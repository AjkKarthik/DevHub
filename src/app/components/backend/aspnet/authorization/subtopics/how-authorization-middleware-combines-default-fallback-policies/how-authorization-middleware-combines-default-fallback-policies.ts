import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-authz-middleware-combines-policies-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-authorization-middleware-combines-default-fallback-policies.html',
  styleUrl: './how-authorization-middleware-combines-default-fallback-policies.scss',
})
export class HowAuthorizationMiddlewareCombinesDefaultFallbackPoliciesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page defines DefaultPolicy and FallbackPolicy as two separate settings — but never explains that they are mutually EXCLUSIVE per endpoint, not layered. FallbackPolicy is not a baseline that gets ANDed under every other policy',
      points: [
        'The authorization middleware makes ONE decision per request, in this order: does the matched endpoint carry ANY authorization metadata (an <code>[Authorize]</code> attribute anywhere in its chain, or a <code>.RequireAuthorization()</code> call)? If YES, the middleware resolves and evaluates THAT policy alone — bare <code>[Authorize]</code> resolves to <code>DefaultPolicy</code>; <code>[Authorize(Policy = "X")]</code> resolves to policy "X". If NO metadata exists at all, the middleware falls through to <code>FallbackPolicy</code> instead.',
        '<strong>FallbackPolicy never runs alongside a more specific policy.</strong> It is not "the minimum bar every request must additionally clear." It is what runs ONLY in the total absence of endpoint-level authorization metadata. Set a FallbackPolicy of <code>RequireAuthenticatedUser()</code> expecting it to guarantee every <code>[Authorize(Policy = "X")]</code> endpoint ALSO requires authentication, and you get a surprise: if policy "X" itself never calls <code>RequireAuthenticatedUser()</code>, authentication is never checked for that endpoint — FallbackPolicy does not backstop it.',
      ],
    },
    {
      heading: 'The practical failure mode: a custom policy built from requirements that do not depend on identity at all can pass for a fully anonymous request, even with a strict FallbackPolicy configured — because that policy\'s mere PRESENCE on the endpoint is what disqualifies FallbackPolicy from ever being consulted',
      points: [
        'Consider a requirement whose handler checks something environmental — time of day, a feature flag, an IP allow-list — and calls <code>context.Succeed(requirement)</code> unconditionally when that external condition holds, with no reference to <code>context.User</code> at all. A policy built ONLY from that requirement, applied via <code>[Authorize(Policy = "BusinessHoursOnly")]</code>, will succeed for a request carrying NO credentials whatsoever. The endpoint has authorization metadata (the attribute is present), so FallbackPolicy is bypassed entirely — there is no second layer checking that the caller is even authenticated.',
        'This is not a framework bug — it is the documented, correct behavior of policy resolution. The lesson is that <strong>every custom policy is responsible for its own authentication requirement</strong>. If a policy should also require a valid identity, it must explicitly combine <code>RequireAuthenticatedUser()</code> with the custom requirement (<code>p.RequireAuthenticatedUser().AddRequirements(new BusinessHoursRequirement())</code>) — FallbackPolicy will not add that check retroactively once the endpoint already has ANY authorization metadata.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The precedence rule, demonstrated — FallbackPolicy is skipped once metadata exists',
      language: 'csharp',
      code: `builder.Services.AddAuthorization(opts =>
{
    // Intent: "require login EVERYWHERE, no exceptions"
    opts.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    // A requirement with NO reference to identity at all
    opts.AddPolicy("BusinessHoursOnly", p =>
        p.AddRequirements(new BusinessHoursRequirement()));
});

public record BusinessHoursRequirement : IAuthorizationRequirement;

public class BusinessHoursHandler : AuthorizationHandler<BusinessHoursRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, BusinessHoursRequirement req)
    {
        var hour = DateTime.UtcNow.Hour;
        if (hour is >= 9 and < 17)
            context.Succeed(req);   // never inspects context.User
        return Task.CompletedTask;
    }
}

// Fully anonymous request — no Authorization header, no cookie:
app.MapGet("/reports/summary", () => "quarterly summary")
   .RequireAuthorization("BusinessHoursOnly");

// Result during business hours: 200 OK, with NO credentials sent.
// The FallbackPolicy — RequireAuthenticatedUser() — is configured but
// NEVER EVALUATED for this endpoint, because RequireAuthorization("...")
// already attached authorization metadata. FallbackPolicy only applies
// to endpoints with ZERO authorization metadata of any kind.`,
    },
    {
      label: 'The fix — every policy states its own auth requirement explicitly',
      language: 'csharp',
      code: `// FallbackPolicy still exists as a genuine safety net — but ONLY for
// endpoints that declare no authorization metadata whatsoever:
app.MapGet("/ping", () => "pong");
// No [Authorize], no .RequireAuthorization(), no .AllowAnonymous().
// THIS endpoint — and only this shape of endpoint — falls through to
// FallbackPolicy and is correctly rejected for anonymous callers.

// For every policy that SHOULD also require a logged-in user, combine
// RequireAuthenticatedUser() into the SAME policy — do not rely on
// FallbackPolicy to add it:
opts.AddPolicy("BusinessHoursOnly", p =>
    p.RequireAuthenticatedUser()              // now explicit
     .AddRequirements(new BusinessHoursRequirement()));

// Verifying the precedence rule directly, no HTTP pipeline needed —
// resolve the policy the same way the middleware does and check what
// it actually contains:
[Fact]
public async Task PolicyWithoutRequireAuthenticatedUser_AllowsAnonymous()
{
    var services = new ServiceCollection();
    services.AddAuthorization(opts =>
        opts.AddPolicy("BusinessHoursOnly", p =>
            p.AddRequirements(new BusinessHoursRequirement())));
    services.AddSingleton<IAuthorizationHandler, BusinessHoursHandler>();
    services.AddLogging();
    var provider = services.BuildServiceProvider();

    var policyProvider = provider.GetRequiredService<IAuthorizationPolicyProvider>();
    var policy = await policyProvider.GetPolicyAsync("BusinessHoursOnly");

    // The resolved policy contains ONLY BusinessHoursRequirement —
    // no ClaimsAuthorizationRequirement, no DenyAnonymousAuthorizationRequirement.
    Assert.DoesNotContain(policy!.Requirements,
        r => r is DenyAnonymousAuthorizationRequirement);
    // This is the concrete, testable signal that FallbackPolicy's
    // RequireAuthenticatedUser() was never merged in.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets FallbackPolicy to RequireAuthenticatedUser() and believes this means "every endpoint in the app requires login unless AllowAnonymous is used." They then add [Authorize(Roles = "Support")] to a ticket-viewing endpoint. A user with NO valid credentials sends a request with a forged, unsigned Roles=Support header (not a real claim). Will they get in? Now predict what actually determines the answer.',
    hint: 'Roles= compiles into RequireRole(), which checks claims on the AUTHENTICATED ClaimsPrincipal built by the authentication middleware — not raw request headers. Does [Authorize(Roles = "Support")] alone also require the request to be authenticated in the first place?',
    solution: `The forged header does nothing — RequireRole() reads claims from the
ClaimsPrincipal that authentication middleware already validated and
attached to HttpContext.User; it never inspects raw request headers.
An anonymous request has an empty/unauthenticated ClaimsIdentity, so
IsInRole("Support") is false regardless of any header sent.

But here is the subtlety this subtopic is actually about: [Authorize(
Roles = "Support")] DOES implicitly combine RequireAuthenticatedUser()
— role-based and claims-based [Authorize] attribute shorthand always
includes it in the generated policy. So this SPECIFIC example is safe,
and the team's mental model happens to hold here.

The gap only opens with CUSTOM policies built from AddRequirements()
that never call RequireAuthenticatedUser() explicitly (like this
subtopic's BusinessHoursRequirement) — those are NOT auto-combined
with an authentication check, and FallbackPolicy will not retroactively
add one, because the endpoint already has authorization metadata via
its own named policy. The team's belief ("FallbackPolicy backstops
everything") is correct for the built-in Roles=/Policy= shorthand's
generated policies, and silently WRONG the moment someone adds a
hand-rolled requirement-only policy without thinking to add
RequireAuthenticatedUser() themselves — which is exactly why this
mechanism is worth understanding precisely rather than trusting by
analogy to the framework's own built-in shortcuts.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FallbackPolicy acts as a baseline that gets ANDed underneath every other policy — configuring RequireAuthenticatedUser() as the FallbackPolicy guarantees every endpoint requires login, no matter what other policy it also carries.',
      reality: 'FallbackPolicy only runs for endpoints with ZERO authorization metadata of any kind; the moment an endpoint has ANY [Authorize] attribute or .RequireAuthorization() call — even one that only checks an unrelated custom requirement — FallbackPolicy is skipped entirely for that endpoint, not merged in.',
    },
    {
      thought: 'a policy built from a custom IAuthorizationRequirement automatically also requires the caller to be authenticated, since authorization implies authentication happened first.',
      reality: 'a custom requirement whose handler never inspects context.User can succeed for a fully anonymous request; only [Authorize(Roles=...)]/[Authorize(Policy=...)] built from the framework\'s own role/claim shorthand auto-combine RequireAuthenticatedUser() — hand-rolled AddRequirements() policies must add it explicitly.',
    },
    {
      thought: 'DefaultPolicy and FallbackPolicy are just two names for slightly different scenarios of the same underlying mechanism, and can be reasoned about interchangeably.',
      reality: 'they resolve at entirely different points in the decision tree — DefaultPolicy is what a bare [Authorize] with no Policy/Roles resolves TO; FallbackPolicy is what runs INSTEAD OF policy resolution when there is no authorization metadata at all — an endpoint only ever consults one or the other, never both.',
    },
  ];
}
