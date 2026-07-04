import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-typod-withname-breaks-linkgenerator-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './typod-renamed-withname-silently-breaks-linkgenerator-no-compile-check.html',
  styleUrl: './typod-renamed-withname-silently-breaks-linkgenerator-no-compile-check.scss',
})
export class TypodRenamedWithnameSilentlyBreaksLinkgeneratorNoCompileCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own NotificationService example already guards against this with "?? throw" — that defensive line is a hint at a real, easy-to-miss failure mode',
      points: [
        'The main Routing page\'s own <code>NotificationService.BuildOrderUrl</code> example writes: <code>linkGen.GetUriByName(...) ?? throw new InvalidOperationException("Endpoint not found")</code>. That <code>?? throw</code> is not decorative — <code>GetUriByName</code> (and <code>GetPathByName</code>) return <strong>null</strong>, not an exception, when the named endpoint cannot be found. And "cannot be found" includes the single most common real-world cause: a <code>WithName("...")</code> string that was TYPO\'D or RENAMED in ONE place but not the OTHER.',
      ],
    },
    {
      heading: '.WithName("GetProduct") and linkGen.GetPathByName("GetProduct", ...) are connected ONLY by matching string literals — there is no compiler check linking them at all',
      points: [
        'Unlike a C# method name (where renaming <code>GetProduct()</code> and forgetting to update a caller is a COMPILE ERROR), <code>WithName</code> and <code>GetPathByName</code>/<code>GetUriByName</code> communicate purely through ORDINARY STRINGS. The compiler has no concept that these two string literals are "supposed to" refer to the same logical endpoint — nothing checks that every <code>GetPathByName("SomeName")</code> call has a MATCHING <code>WithName("SomeName")</code> somewhere in the route table, and nothing checks the reverse either.',
        'This means renaming an endpoint\'s <code>WithName("GetProduct")</code> to <code>WithName("GetProductById")</code> (a perfectly reasonable refactor) compiles CLEANLY, and the app STARTS UP CLEANLY — the mismatch only manifests at RUNTIME, the very next time some OTHER piece of code calls <code>GetPathByName("GetProduct", ...)</code>, which now silently returns <code>null</code> instead of the URL it used to produce.',
      ],
    },
    {
      heading: 'What actually happens downstream of that null depends ENTIRELY on whether the calling code defensively guards against it — and the main page\'s own example shows the RIGHT pattern, but it is easy to write the WRONG one',
      points: [
        'If the calling code (like the main page\'s own example) uses <code>?? throw new InvalidOperationException(...)</code>, the failure is at least LOUD and immediate — a clear exception with a message, easy to trace back to the actual cause. If the calling code does NOT guard against null (a genuinely common oversight, since <code>GetPathByName</code>\'s return type is nullable but nothing FORCES handling it), the null can propagate much further: into a <code>Results.Created(null, ...)</code> call (producing a response with a missing or malformed <code>Location</code> header), into an email template as a broken link, or into a <code>NullReferenceException</code> several call frames away from the actual root cause.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own endpoint, renamed — everything still compiles',
      language: 'csharp',
      code: `// BEFORE the rename — the main page's own working example:
app.MapGet("/orders/{id:int}", (int id) => Results.Ok(id))
   .WithName("GetOrder");

app.MapPost("/orders", (CreateOrderRequest req, LinkGenerator linkGen, HttpContext ctx) =>
{
    var order = new Order(1, req.Description);
    var path = linkGen.GetPathByName("GetOrder", new { id = order.Id });
    return Results.Created(path, order);
});

// AFTER a reasonable-sounding refactor — someone renames the endpoint
// for clarity, updating ONLY the WithName call:
app.MapGet("/orders/{id:int}", (int id) => Results.Ok(id))
   .WithName("GetOrderById");   // renamed here...

app.MapPost("/orders", (CreateOrderRequest req, LinkGenerator linkGen, HttpContext ctx) =>
{
    var order = new Order(1, req.Description);
    var path = linkGen.GetPathByName("GetOrder", new { id = order.Id });
    // ...but NOT updated here — "GetOrder" no longer matches any
    // registered endpoint name at all.
    return Results.Created(path, order);
    // THIS COMPILES CLEANLY. THE APP STARTS CLEANLY. Nothing fails
    // until a REQUEST actually reaches this POST handler at runtime.
});`,
    },
    {
      label: 'What actually happens at runtime — GetPathByName returns null, silently',
      language: 'csharp',
      code: `// Tracing through what GetPathByName("GetOrder", ...) actually does
// once "GetOrder" no longer matches any endpoint name:

var path = linkGen.GetPathByName("GetOrder", new { id = order.Id });
// path is now: null
// NO exception was thrown. NO warning was logged by default. The
// method's contract is explicitly "return null if not found" — this
// is DOCUMENTED, expected behavior, not a bug in LinkGenerator itself.

return Results.Created(path, order);
// Results.Created(string? uri, object? value) ACCEPTS a null uri —
// it does not throw either. The HTTP response is still produced, with
// status 201 Created, but its "Location" HEADER IS EITHER MISSING
// ENTIRELY or set to an empty/malformed value, depending on the exact
// ASP.NET Core version's handling of a null location argument.
//
// FROM THE CLIENT'S PERSPECTIVE: a 201 Created response arrives, as
// expected — but any client code that reads response.Headers.Location
// to follow up (fetch the newly created resource, as the HTTP spec
// intends) gets nothing usable. This can go UNNOTICED for a long time
// if most client code does not actually rely on the Location header,
// surfacing only when someone finally writes code that does.`,
    },
    {
      label: 'Two defensive patterns — the main page\'s own approach, and a stronger, test-verifiable one',
      language: 'csharp',
      code: `// PATTERN 1 (from the main page itself) — fail LOUDLY and immediately:
public class NotificationService(LinkGenerator linkGen, IHttpContextAccessor ctx)
{
    public string BuildOrderUrl(int orderId)
        => linkGen.GetUriByName(ctx.HttpContext!, "GetOrder", new { id = orderId })
           ?? throw new InvalidOperationException("Endpoint not found");
    // At least this THROWS with a clear message the moment the
    // mismatch is hit — far better than a silent null propagating
    // further, but STILL only caught at runtime, on whatever request
    // path happens to exercise it first (which may be rare, or may be
    // a path with poor test coverage).
}

// PATTERN 2 — a STARTUP-TIME test that verifies every named endpoint
// referenced anywhere in the codebase ACTUALLY EXISTS, catching a
// rename mismatch in CI, before any request ever reaches the mismatched
// code path in production:
[Fact]
public void AllLinkGeneratorReferences_ResolveToRealEndpoints()
{
    // The set of endpoint names the codebase is KNOWN to reference via
    // LinkGenerator (maintained explicitly, or discovered via a
    // Roslyn/reflection scan of GetPathByName/GetUriByName call sites —
    // a fuller implementation is a genuinely useful internal tool for
    // larger codebases with many named endpoints):
    var referencedNames = new[] { "GetOrder", "GetProduct", "GetCustomer" };

    var app = BuildTestApp();   // the SAME route registration Program.cs uses
    var endpointNames = app.Services
        .GetRequiredService<EndpointDataSource>()
        .Endpoints
        .Select(e => e.Metadata.GetMetadata<IEndpointNameMetadata>()?.EndpointName)
        .Where(name => name is not null)
        .ToHashSet();

    foreach (var name in referencedNames)
        Assert.Contains(name, endpointNames);   // fails IMMEDIATELY,
                                                  // in CI, for a renamed
                                                  // or typo'd endpoint —
                                                  // not at an unpredictable
                                                  // future runtime moment
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s email service calls <code>linkGen.GetUriByName(ctx, "ResetPassword", new { token })</code> to build a password-reset link, WITHOUT any null-check or "?? throw" guard. A rename of the actual endpoint\'s <code>WithName()</code> goes unnoticed for two weeks. Explain the realistic, concrete symptom users would experience, and why it might take unusually long for the team to connect the symptom to its actual root cause.',
    hint: 'Consider what a null URL embedded directly into an email template actually LOOKS like to an end user reading that email, versus what an exception in server-side logs would look like — and which of those two is more likely to generate an immediate, loud internal alert versus a quiet, easy-to-miss support ticket.',
    solution: `public class PasswordResetEmailService(LinkGenerator linkGen, IHttpContextAccessor ctx)
{
    public async Task SendResetEmailAsync(string email, string token)
    {
        var resetUrl = linkGen.GetUriByName(ctx.HttpContext!, "ResetPassword", new { token });
        // NO null-check, NO "?? throw" guard here at all:

        await _emailSender.SendAsync(email, "Reset your password",
            \$"Click here to reset your password: {resetUrl}");
        // If resetUrl is null, this literally sends:
        // "Click here to reset your password: "
        // — a broken, empty link, embedded directly in a real email
        // that was ACTUALLY SENT to a real user.
    }
}

// THE REALISTIC, CONCRETE SYMPTOM: users start reporting "the reset
// password link in my email doesn't work" or "there's no link in the
// email at all" — a CUSTOMER SUPPORT ticket, not a server error alert.
// The SendAsync call itself SUCCEEDS (the email genuinely gets sent —
// it just contains a missing/empty URL) — there is NO exception
// anywhere in server logs, NO failed HTTP request, NO 500 error, and
// often NO monitoring alert at all, since "email sent successfully"
// is usually the ONLY thing instrumented/alerted on for this code path.

// WHY IT TAKES UNUSUALLY LONG TO CONNECT SYMPTOM TO ROOT CAUSE:
// - The failure is SILENT at the exact moment it happens (no
//   exception, no log entry, no alert) — it only becomes visible much
//   later, indirectly, through a HUMAN reading a broken email and
//   filing a support ticket, which then has to work its way back
//   through support -> engineering -> "which code sends this email"
//   -> "why is the URL empty" -> eventually tracing back to the
//   WithName() rename that happened two weeks earlier, in a
//   completely different part of the codebase, by a different
//   developer, for what seemed like an unrelated, low-risk refactor.
// - Nothing in the deployment pipeline flagged the mismatch, because
//   (per this subtopic's own core point) WithName() and
//   GetUriByName() are connected ONLY by matching string literals,
//   with zero compile-time or even routine startup-time verification
//   linking them — unless a team specifically adds the kind of
//   endpoint-existence test shown in this subtopic's second defensive
//   pattern, nothing in the normal build/deploy/test cycle would ever
//   catch this at all.
//
// THE ACTUAL FIX: add BOTH defenses — a null-check with a loud
// exception (or at minimum a logged error) at every LinkGenerator call
// site, AND a CI test verifying every referenced endpoint name
// actually exists in the route table, so a rename mismatch is caught
// in minutes during development, not weeks later via a support ticket.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'WithName("SomeEndpoint") and GetPathByName("SomeEndpoint", ...)/GetUriByName("SomeEndpoint", ...) are checked against each other by the compiler, similar to how a renamed method call produces a compile error.',
      reality: 'they are connected purely by matching string literals with zero compile-time verification — renaming or typo\'ing one without updating the other compiles cleanly and starts cleanly, only failing (silently, by returning null) the next time the mismatched name is actually looked up at runtime.',
    },
    {
      thought: 'LinkGenerator.GetPathByName/GetUriByName throw an exception when the named endpoint cannot be found, making the failure immediately obvious.',
      reality: 'they return null by documented design — the failure is only as loud as whatever the CALLING code chooses to do with that null, which can range from an immediate clear exception (if guarded) to a silently broken URL embedded in a response, email, or log with no error anywhere.',
    },
    {
      thought: 'a broken link generated from a renamed endpoint will surface quickly through normal application monitoring and error alerting.',
      reality: 'if the calling code does not explicitly check for null, the failure can be completely silent from a server-side monitoring perspective — the request that produced the broken link can succeed with a 2xx status, surfacing only through indirect signals like a customer support ticket about a broken link in an email.',
    },
  ];
}
