import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-allowanonymous-wins-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './allowanonymous-anywhere-wins-authorize-cannot-override.html',
  styleUrl: './allowanonymous-anywhere-wins-authorize-cannot-override.scss',
})
export class AllowanonymousAnywhereWinsAuthorizeCannotOverrideSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Secure-by-Default" code tab shows grouping endpoints under .RequireAuthorization() as the safe pattern — but never states the one thing that quietly defeats it: [AllowAnonymous]/.AllowAnonymous() ALWAYS wins, on ANY single endpoint in that group, with no error, warning, or build-time signal',
      points: [
        'The authorization middleware checks for <strong>IAllowAnonymousData</strong> metadata FIRST, before it even attempts to resolve or combine any policy. If that metadata is present ANYWHERE in the endpoint\'s metadata chain — the specific endpoint, a group it belongs to, or a controller action — authorization is skipped for that endpoint entirely, full stop. This check happens unconditionally, regardless of how many <code>[Authorize]</code> attributes or <code>.RequireAuthorization()</code> calls also apply to the same endpoint.',
        'This means <code>.AllowAnonymous()</code> is not "one vote among several" the way multiple authorization handlers are (per the OR/veto subtopic) — it is a <strong>hard bypass that pre-empts the whole authorization system</strong>, evaluated before policies are even looked at. There is no scenario where an <code>[Authorize]</code> on a controller class can "outrank" an <code>[AllowAnonymous]</code> on one of its actions, or where a group\'s <code>.RequireAuthorization()</code> outranks a single mapped endpoint inside it calling <code>.AllowAnonymous()</code>.',
      ],
    },
    {
      heading: 'Applied to the main page\'s own Option B example: a single stray .AllowAnonymous() on ONE route inside an otherwise-protected MapGroup silently reopens JUST that route — the other routes in the same group remain fully protected, which is exactly what makes the mistake so easy to miss in review',
      points: [
        'Because the effect is scoped to the one endpoint that carries the <code>[AllowAnonymous]</code>/<code>.AllowAnonymous()</code> metadata, every other endpoint mapped through the same group keeps working correctly under <code>.RequireAuthorization()</code> — manual testing of "a few endpoints in the admin group" will not surface the gap unless the specific reopened route is the one being tested. There is no compiler warning, no runtime log entry, and no analyzer rule (as of current tooling) that flags "an AllowAnonymous endpoint exists inside a group whose RequireAuthorization() call implies every route should require auth."',
        'The realistic way this happens in practice: a developer copies an existing minimal-API handler (which had <code>.AllowAnonymous()</code> because it used to be a public health-check-style endpoint) into a newly created admin group, intending to remove the <code>.AllowAnonymous()</code> call, and forgets. The endpoint compiles, runs, and looks identical in a quick smoke test to its protected siblings — until someone notices it responds 200 with no credentials sent.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own protected group — one stray AllowAnonymous() reopens a single route',
      language: 'csharp',
      code: `// From the main Authorization page's own "Secure-by-Default" example:
var adminApi = app.MapGroup("/admin")
    .RequireAuthorization("AdminOnly");

adminApi.MapDelete("/users/{id}", DeleteUser);
adminApi.MapGet("/audit-log", GetAuditLog);

// A route copy-pasted from an old, genuinely public endpoint —
// the .AllowAnonymous() call was meant to be removed and wasn't:
adminApi.MapGet("/system-status", GetSystemStatus)
    .AllowAnonymous();   // <-- wins, unconditionally, over the group's
                         //     RequireAuthorization("AdminOnly")

// Result: DELETE /admin/users/{id} and GET /admin/audit-log correctly
// return 401/403 for unauthenticated callers. GET /admin/system-status
// returns 200 for ANYONE, no credentials required — even though it is
// mapped through the exact same "protected" adminApi group.
//
// No exception is thrown, no warning is logged. The only signal is
// the actual HTTP response — which is why this needs an explicit test,
// not a glance at the MapGroup() call site.`,
    },
    {
      label: 'Pinning the behavior with a test, and the fix — audit AllowAnonymous endpoints deliberately',
      language: 'csharp',
      code: `// Integration test proving the bypass — WITHOUT sending any credentials:
[Fact]
public async Task SystemStatus_Inside_AdminGroup_Is_Reachable_Anonymously()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();   // no Authorization header set

    var deleteResponse = await client.DeleteAsync("/admin/users/1");
    Assert.Equal(HttpStatusCode.Unauthorized, deleteResponse.StatusCode);

    var statusResponse = await client.GetAsync("/admin/system-status");
    Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);
    // This assertion passing is the BUG, made explicit and pinned down —
    // if system-status is meant to require auth too, this test fails
    // the moment .AllowAnonymous() is (correctly) removed, which is
    // exactly the point: the test documents the current (wrong) state
    // so the fix is a one-line change with an immediate green light.
}

// A lightweight audit at startup — enumerate every endpoint and flag
// any AllowAnonymous endpoint nested under a group name that implies
// it shouldn't be public. Not a substitute for the test above, but a
// cheap early-warning net across the whole route table:
app.MapGet("/__debug/anonymous-endpoints", (EndpointDataSource sources) =>
{
    var anonymous = sources.Endpoints
        .OfType<RouteEndpoint>()
        .Where(e => e.Metadata.GetMetadata<IAllowAnonymousData>() is not null)
        .Select(e => e.RoutePattern.RawText)
        .Where(p => p is not null && p.StartsWith("/admin"))
        .ToList();
    return Results.Ok(anonymous);   // should be empty for an admin-only prefix
}).ExcludeFromDescription();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A controller is decorated with [Authorize] at the class level. One action inside it has [AllowAnonymous]. A teammate argues this must be a bug the compiler should catch, since a class-level [Authorize] is "more specific" scope-wise than a method having no explicit attribute at all. Explain why the compiler cannot and should not catch this, and what the actual precedence is.',
    hint: 'Precedence between AllowAnonymous and Authorize is not about attribute scope specificity (class vs method) — it is about which metadata type the middleware checks FIRST, unconditionally, before any policy resolution happens at all.',
    solution: `The compiler cannot catch this because it is entirely valid, INTENDED
C# — nothing about "[Authorize] on a class, [AllowAnonymous] on one of
its actions" is a type error, a missing reference, or contradictory
syntax. It is the framework's own documented mechanism for opening one
public action (a health check, a public signup endpoint) on an
otherwise-protected controller. The compiler has no way to know
whether a GIVEN instance of this pattern is intentional or a mistake —
only a human (or a runtime test asserting the expected status code)
can determine that.

The actual precedence has nothing to do with attribute "specificity"
by scope (class vs. method). The authorization middleware's algorithm
checks for [AllowAnonymous]/IAllowAnonymousData metadata FIRST, as an
unconditional short-circuit, before it resolves or evaluates ANY
policy — including [Authorize]'s DefaultPolicy. It is not "the more
specific attribute wins" (which would make [Authorize] on the action
beat [AllowAnonymous] on the class, or vice versa depending on how you
define specificity) — it is "IAllowAnonymousData anywhere in the
endpoint's metadata always short-circuits, unconditionally, regardless
of what else is present." A class-level [Authorize] combined with a
method-level [Authorize(Roles="Admin")] DOES combine (AND semantics,
per the main page's own theory) — but [AllowAnonymous] doesn't combine
with anything; it pre-empts the whole check.

The practical takeaway matches this subtopic's core lesson: since there
is no compile-time or build-time signal, the ONLY reliable way to catch
an unintended [AllowAnonymous] is an integration test that asserts the
actual HTTP status code for an unauthenticated request — exactly the
test shown in this subtopic's code tab.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a group-level .RequireAuthorization() call is an enforced floor — no endpoint mapped inside that group can end up less protected than the group specifies.',
      reality: 'a single .AllowAnonymous() call on one endpoint inside the group silently reopens JUST that endpoint, with the rest of the group remaining protected — there is no compiler error, build warning, or runtime log entry, only the actual HTTP response reveals it.',
    },
    {
      thought: 'AllowAnonymous vs Authorize precedence is about which attribute is "more specific" — e.g. a method-level attribute overriding a class-level one, similar to normal C# attribute inheritance reasoning.',
      reality: 'the authorization middleware checks for AllowAnonymous metadata FIRST and unconditionally, before any policy is resolved at all — it is not a specificity contest between attributes, it is a hard pre-emptive bypass that applies regardless of where in the metadata chain it is found.',
    },
    {
      thought: 'if a "protected" endpoint is accidentally left open, a test suite that exercises the happy path of the surrounding feature (e.g., "admin can delete a user") will eventually surface it.',
      reality: 'because the bypass is scoped to exactly the one endpoint carrying AllowAnonymous, every sibling endpoint in the same group continues to behave correctly — only a test that specifically sends an UNAUTHENTICATED request to that exact route will catch it; testing the feature\'s happy path never will.',
    },
  ];
}
