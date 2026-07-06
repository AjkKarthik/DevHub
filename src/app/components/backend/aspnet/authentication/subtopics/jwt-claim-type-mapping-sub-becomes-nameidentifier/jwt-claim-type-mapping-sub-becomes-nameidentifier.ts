import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-jwt-claim-type-mapping-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './jwt-claim-type-mapping-sub-becomes-nameidentifier.html',
  styleUrl: './jwt-claim-type-mapping-sub-becomes-nameidentifier.scss',
})
export class JwtClaimTypeMappingSubBecomesNameidentifierSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own /login example writes a "sub" claim into the token — but a handler reading User.FindFirst("sub") on the protected side gets NULL, because the JWT middleware silently RENAMES inbound claim types before your code ever sees them',
      points: [
        'The main Authentication page\'s "Issue a JWT" tab adds <code>new Claim(JwtRegisteredClaimNames.Sub, req.Username)</code> — the OIDC-standard subject claim. What the page never mentions: on the VALIDATING side, the JWT handler applies a legacy <strong>inbound claim type map</strong> (a compatibility layer dating back to WIF/SOAP-era identity) that translates compact JWT claim names into long SOAP-style URIs as the <code>ClaimsPrincipal</code> is built. <code>"sub"</code> becomes <code>ClaimTypes.NameIdentifier</code> (<code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier</code>), <code>"email"</code> becomes <code>ClaimTypes.Email</code>, and so on. The token on the wire still says <code>"sub"</code> — but by the time YOUR code inspects <code>HttpContext.User</code>, that claim type no longer exists under its original name.',
      ],
    },
    {
      heading: 'The same mapping layer explains two further surprises: Identity.Name and IsInRole() do not read the token\'s claims directly — they read whatever claim type the identity\'s NameClaimType/RoleClaimType point at, which for an external OIDC issuer\'s compact claims frequently matches NOTHING',
      points: [
        '<code>User.Identity.Name</code> is not magic — it returns the value of the first claim whose type equals the identity\'s <code>NameClaimType</code>, which defaults to <code>ClaimTypes.Name</code>. <code>IsInRole("Admin")</code> likewise checks claims of the identity\'s <code>RoleClaimType</code>, defaulting to <code>ClaimTypes.Role</code>. The main page\'s own example works only because its /login writes <code>ClaimTypes.Name</code> and <code>ClaimTypes.Role</code> DIRECTLY — the long URIs. A token from a real external issuer (Entra, Auth0, Keycloak) carries compact <code>"name"</code> and <code>"role"</code>/<code>"roles"</code> claims instead; <code>"name"</code> is not in the inbound map at all, and <code>"role"</code> passes through unmapped — so <code>Identity.Name</code> is null and <code>IsInRole()</code> is always false, even though the claims are RIGHT THERE in <code>User.Claims</code> under their compact names.',
        'Two clean configurations exist, and mixing them is what causes the bugs. LEGACY MODE (default, <code>MapInboundClaims = true</code>): claim types are renamed to <code>ClaimTypes.*</code> URIs — read claims via <code>ClaimTypes.NameIdentifier</code> etc., never via <code>"sub"</code>. MODERN MODE (<code>opts.MapInboundClaims = false</code>): claim types pass through exactly as the token states them — read <code>"sub"</code> as <code>"sub"</code>, but you MUST then tell the identity where its name and roles live: <code>TokenValidationParameters.NameClaimType = "name"</code> (or <code>"sub"</code>) and <code>RoleClaimType = "role"</code>, or <code>Identity.Name</code> and <code>IsInRole()</code> break in the OTHER direction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The surprise, demonstrated — the token says sub, the principal says NameIdentifier',
      language: 'csharp',
      code: `// The main page's own /login writes:
new Claim(JwtRegisteredClaimNames.Sub, req.Username)   // "sub" on the wire

// A protected endpoint, written by a developer who reasonably expects
// to read back what was written:
app.MapGet("/whoami", (ClaimsPrincipal user) =>
{
    var bySub = user.FindFirstValue("sub");
    // NULL under the default configuration — the inbound map renamed
    // the claim type while building the principal.

    var byNameIdentifier = user.FindFirstValue(ClaimTypes.NameIdentifier);
    // "alice" — the SAME claim, now living under
    // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier

    return Results.Ok(new { bySub, byNameIdentifier });
});
// Response: { "bySub": null, "byNameIdentifier": "alice" }

// A test pinning the behavior, no server needed — validate a token and
// inspect the principal the SAME way the middleware builds it:
[Fact]
public void DefaultHandler_RenamesSubToNameIdentifier()
{
    var handler = new JwtSecurityTokenHandler();   // MapInboundClaims
                                                    // behavior is ON here
    var principal = handler.ValidateToken(
        MintTokenWithSubClaim("alice"), StandardParameters(), out _);

    Assert.Null(principal.FindFirst("sub"));                       // gone
    Assert.Equal("alice",
        principal.FindFirstValue(ClaimTypes.NameIdentifier));      // renamed

    // The wire-format token is untouched — decode it raw and "sub" is
    // still there. The rename happens ONLY in the in-memory principal:
    var rawPayload = handler.ReadJwtToken(MintTokenWithSubClaim("alice"));
    Assert.Equal("alice", rawPayload.Claims.First(c => c.Type == "sub").Value);
}`,
    },
    {
      label: 'The two coherent configurations — and the external-issuer failure the default causes',
      language: 'csharp',
      code: `// FAILURE SCENARIO with a real OIDC issuer (Entra, Auth0, Keycloak):
// the token carries compact claims —
//   { "sub": "u-42", "name": "Alice", "role": "Admin" }
//
// Under the DEFAULT configuration:
//   user.FindFirst("sub")            → null   ("sub" renamed to NameIdentifier)
//   user.Identity.Name               → null   ("name" is NOT in the inbound
//                                              map; it stays "name", but
//                                              NameClaimType looks for
//                                              ClaimTypes.Name — no match)
//   user.IsInRole("Admin")           → false  ("role" passes through
//                                              unmapped; RoleClaimType looks
//                                              for ClaimTypes.Role — no match)
//
// [Authorize(Roles = "Admin")] therefore returns 403 for a user whose
// token PLAINLY says role: "Admin" — one of the most-debugged auth
// symptoms in ASP.NET Core, and it is pure claim-type bookkeeping.

// CONFIGURATION 1 — MODERN MODE (recommended for new APIs): turn the
// legacy map off and point the identity at the token's own claim names:
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.MapInboundClaims = false;    // claim types pass through as-is
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            // ... issuer/audience/key validation as on the main page ...
            NameClaimType = "name",       // Identity.Name reads "name"
            RoleClaimType = "role",       // IsInRole reads "role"
        };
    });
// Now: FindFirst("sub") works, Identity.Name is "Alice",
// IsInRole("Admin") is true, and what you read matches what the
// token actually says — nothing is silently renamed.

// CONFIGURATION 2 — LEGACY MODE (the default): keep the map, and
// consistently read the MAPPED types everywhere:
var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);  // was "sub"
var email  = user.FindFirstValue(ClaimTypes.Email);           // was "email"
// ...and when ISSUING tokens yourself (as the main page's /login
// does), write ClaimTypes.Name / ClaimTypes.Role directly so the
// defaults line up — which is exactly why the main page's example
// works: it side-steps the mapping by never using compact names for
// the claims the identity's defaults depend on.

// THE ONE RULE: pick a mode per service and be consistent. The bugs
// live at the seams — issuing compact claims while reading mapped
// types, or disabling the map without redirecting NameClaimType and
// RoleClaimType.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team disables the legacy map (MapInboundClaims = false, NameClaimType = "name", RoleClaimType = "role") on their API. Their own /login endpoint — copied from the main page — still issues tokens with new Claim(ClaimTypes.Role, "User") and new Claim(ClaimTypes.Name, username). Predict exactly which of Identity.Name, IsInRole("User"), and [Authorize(Roles = "User")] work for these self-issued tokens, and explain why.',
    hint: 'With the map OFF, claim types pass through exactly as written into the token. What literal claim-type STRING did the /login endpoint write — the compact "role", or something else? Then check what RoleClaimType is configured to look for.',
    solution: `All three are BROKEN for the self-issued tokens — the failure from
the code tab, mirrored to the other side of the seam.

Walk it through: ClaimTypes.Role is not the string "role" — it is the
long URI http://schemas.microsoft.com/ws/2008/06/identity/claims/role.
The /login endpoint therefore writes a claim whose TYPE is that long
URI into the JWT payload. With MapInboundClaims = false, validation
performs NO renaming in either direction: the principal ends up
holding a claim literally typed as the long URI.

Now the identity's configured lookups:
  - RoleClaimType = "role" → IsInRole("User") scans for claims typed
    "role", finds none (the only role-ish claim is typed as the long
    URI) → false.
  - [Authorize(Roles = "User")] uses the same IsInRole machinery →
    403 for every authenticated user.
  - NameClaimType = "name" → Identity.Name scans for "name", but the
    token carries ClaimTypes.Name (another long URI) → null.

FindFirstValue(ClaimTypes.Role) WOULD still work — the claim exists
under exactly that type — which makes the bug extra confusing: the
claims are visibly present when you dump User.Claims, yet every
convenience API returns empty.

The fix is to make the ISSUING side match the chosen mode: with the
modern configuration, /login should write compact names —
new Claim("name", username) and new Claim("role", "User") — i.e.,
issue what a standards-compliant OIDC provider would issue. (JWTs from
external issuers already do this, which is why modern mode fixes them;
self-issued tokens have to be updated to speak the same dialect.)

The general lesson, completing this subtopic's rule: MapInboundClaims,
NameClaimType, RoleClaimType, AND the claim types your own token
issuance writes are ONE configuration set. Changing any of them
independently moves the seam somewhere else — the modes only work when
issuing and consuming agree end to end.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the claims you read from HttpContext.User have the same types as the claims in the JWT on the wire — FindFirst("sub") returns the token\'s sub claim.',
      reality: 'under the default configuration, a legacy inbound claim-type map renames compact JWT claim names to long ClaimTypes.* URIs while building the principal — "sub" becomes ClaimTypes.NameIdentifier, so FindFirst("sub") returns null even though the raw token plainly contains it.',
    },
    {
      thought: 'Identity.Name and IsInRole() read the token\'s "name" and "role" claims directly, so a standards-compliant OIDC token from Entra or Auth0 lights them up automatically.',
      reality: 'both APIs read whatever claim type the identity\'s NameClaimType/RoleClaimType point at — defaulting to the long ClaimTypes.Name/ClaimTypes.Role URIs — while an external issuer\'s compact "name" and "role" claims match neither, leaving Identity.Name null and [Authorize(Roles=...)] returning 403 despite the role being visibly present in User.Claims.',
    },
    {
      thought: 'setting MapInboundClaims = false is a standalone modernization that makes claim handling more predictable with no other changes required.',
      reality: 'disabling the map without also setting NameClaimType/RoleClaimType — and without updating any self-issued tokens to use compact claim names — simply moves the mismatch to the other side of the seam; the mapping mode, the identity\'s claim-type lookups, and the claim types you issue form one configuration set that must agree end to end.',
    },
  ];
}
