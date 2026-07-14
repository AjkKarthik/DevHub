import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './oidc-roles-often-use-a-different-claim-type-than-authorize-expects.html',
  styleUrl: './oidc-roles-often-use-a-different-claim-type-than-authorize-expects.scss'
})
export class OidcRolesOftenUseADifferentClaimTypeThanAuthorizeExpectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "Roles with OIDC without claim mapping" mistake has a specific, nameable cause: ClaimsIdentity.RoleClaimType defaults to a value most OIDC providers never populate',
      points: [
        'ASP.NET Core\'s [Authorize(Roles = "Admin")] does not search every claim on the ClaimsPrincipal for a matching value — it specifically checks claims whose TYPE equals the identity\'s own RoleClaimType, which defaults to the well-known Microsoft URI ClaimTypes.Role (http://schemas.microsoft.com/ws/2008/06/identity/claims/role). Any claim carrying role information under a DIFFERENT type string is invisible to this check, no matter what the claim\'s VALUE is.',
        'Most OIDC identity providers (Auth0, Okta, Keycloak, Azure AD/Entra ID in many default configurations) emit role or group membership using the provider\'s OWN claim type — commonly a bare "roles" claim, "groups", or a provider-specific URI — none of which match the default RoleClaimType unless the app explicitly maps it during token validation setup.',
      ]
    },
    {
      heading: 'Why this produces "authenticated but still forbidden" rather than an obvious auth failure',
      points: [
        'The symptom this produces is specifically confusing because authentication itself succeeds completely — the user genuinely IS logged in, AuthorizeView\'s basic (no-Roles) authenticated check passes fine, and the ClaimsPrincipal genuinely DOES contain a claim with the correct role value. The failure is narrowly scoped to Roles-based authorization specifically, because the role claim exists under the WRONG claim type for [Authorize(Roles = ...)]\'s default lookup to find it.',
        'The fix is to map the incoming claim type during OIDC options configuration — setting OpenIdConnectOptions.TokenValidationParameters.RoleClaimType to match whatever claim type the specific provider actually uses (found by inspecting the raw claims collection, e.g. via a debug endpoint that dumps User.Claims), so ASP.NET Core\'s Roles-based authorization checks the claim the provider is actually sending.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap — role claim present, but under the wrong type',
      language: 'csharp',
      code: `builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddOpenIdConnect(options =>
    {
        options.Authority = "https://your-provider.example.com";
        options.ClientId = "your-client-id";
        options.ResponseType = "code";
        // No RoleClaimType mapping here — TokenValidationParameters
        // defaults to ClaimTypes.Role, which this provider never sends.
        // The provider actually sends role info under a claim type
        // literally named "roles".
    });`,
    },
    {
      label: 'The fix — mapping RoleClaimType to what the provider actually sends',
      language: 'csharp',
      code: `builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddOpenIdConnect(options =>
    {
        options.Authority = "https://your-provider.example.com";
        options.ClientId = "your-client-id";
        options.ResponseType = "code";

        // Now [Authorize(Roles = "Admin")] checks claims of type
        // "roles" instead of the default ClaimTypes.Role URI —
        // matching what this specific provider actually emits.
        options.TokenValidationParameters.RoleClaimType = "roles";
    });

// A quick way to discover the ACTUAL claim type a provider sends,
// before guessing at RoleClaimType:
app.MapGet("/debug/claims", (ClaimsPrincipal user) =>
    user.Claims.Select(c => new { c.Type, c.Value }))
    .RequireAuthorization();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A user logs into an app secured with OIDC and an [Authorize] page loads correctly, confirming they are authenticated. A different page using [Authorize(Roles = "Admin")] redirects them to an access-denied page, even though the same user\'s claims (inspected via a debug endpoint) clearly include a claim with type "roles" and value "Admin". Explain the failure and the fix.',
    hint: 'ASP.NET Core\'s Roles-based authorization does not search every claim for a matching VALUE — it checks claims of one SPECIFIC claim type, configurable per identity. What does that type default to, and does it match what this provider is sending?',
    solution: 'The claim genuinely exists with the correct value ("Admin"), but under the claim type "roles" — while [Authorize(Roles = "Admin")] by default only checks claims whose TYPE equals ClaimsIdentity.RoleClaimType, which defaults to the Microsoft-namespaced ClaimTypes.Role URI, not the bare string "roles". Since the provider never sends a claim under that default type, the Roles-based check finds nothing to match against, even though a role claim with the right value is sitting right there under a different type. The fix is setting options.TokenValidationParameters.RoleClaimType = "roles" in the OpenIdConnectOptions configuration, so ASP.NET Core\'s authorization checks look at the claim type this specific provider actually uses instead of the unmatched default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '[Authorize(Roles = "Admin")] checks whether ANY claim on the user has the value "Admin", regardless of what claim type it\'s stored under.',
      reality: 'This subtopic\'s theory clarifies the check is scoped to one specific claim TYPE — ClaimsIdentity.RoleClaimType, defaulting to ClaimTypes.Role — and a claim with the matching VALUE but a different TYPE is completely invisible to it.'
    },
    {
      thought: 'If [Authorize] (with no Roles requirement) succeeds, then [Authorize(Roles = "...")] failing for the same user must mean the role claim itself is missing or has the wrong value.',
      reality: 'This subtopic\'s exercise shows the exact opposite can be true — the role claim can be present with the CORRECT value and the user can be fully authenticated, while Roles-based authorization still fails purely because the claim sits under the wrong claim TYPE for the default RoleClaimType lookup to find.'
    },
    {
      thought: 'Every OIDC identity provider sends role/group information under the same well-known claim type, so RoleClaimType mapping is only needed in unusual, non-standard setups.',
      reality: 'This subtopic\'s theory notes most mainstream providers (Auth0, Okta, Keycloak, and Azure AD/Entra ID in many default configurations) use their OWN provider-specific claim type for roles or groups, not ASP.NET Core\'s default ClaimTypes.Role — checking the actual claims a provider sends (e.g. via a debug endpoint) before assuming Roles-based authorization will work out of the box is standard practice, not an edge case.'
    }
  ];
}
