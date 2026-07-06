import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-preflight-bypasses-auth-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-preflight-bypasses-auth-middleware-terminal-response.html',
  styleUrl: './testing-preflight-bypasses-auth-middleware-terminal-response.scss',
})
export class TestingPreflightBypassesAuthMiddlewareTerminalResponseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "CORS must come before auth — preflight OPTIONS requests carry no credentials" as a rule to follow, but stops short of what actually happens mechanically — CorsMiddleware does not just "let preflight requests through" to whatever comes next, it TERMINATES the pipeline for a preflight request entirely',
      points: [
        'When <code>CorsMiddleware</code> (registered via <code>UseCors()</code>) detects an incoming request is a CORS preflight (method <code>OPTIONS</code> plus an <code>Access-Control-Request-Method</code> header), it evaluates the applicable policy, writes the <code>Access-Control-Allow-*</code> response headers itself, sets a 204 (or 200) status, and <strong>returns without calling the next middleware in the pipeline at all</strong>. Authentication, authorization, routing to your endpoint handler — none of it runs for a genuine preflight request, REGARDLESS of ordering, as long as CORS is registered before them.',
        'This is the mechanical reason the main page\'s ordering rule works: it is not that auth middleware "lets preflight through unauthenticated" (which would still require auth logic to special-case OPTIONS) — it is that <strong>CORS middleware never hands control to auth middleware for a preflight request in the first place</strong>, when registered first. Reverse the order, and auth middleware runs FIRST on the OPTIONS request, sees no credentials, and rejects it with 401 before CORS middleware ever gets a chance to run.',
      ],
    },
    {
      heading: 'This is directly provable with a WebApplicationFactory integration test — instrument the protected endpoint handler with a counter and show it never executes for a preflight, in either ordering, while only the CORRECT ordering returns a successful CORS response instead of a 401',
      points: [
        'A minimal test doesn\'t need to inspect internals — send a real OPTIONS request with <code>Access-Control-Request-Method: POST</code> and an <code>Origin</code> header to an <code>[Authorize]</code>-protected endpoint, with NO Authorization header attached, and assert on the status code and response headers directly. The handler itself never runs either way (its side effect — a static counter increment — stays at zero) because CORS-preflight requests never route to endpoint handlers at all, by design, independent of middleware order; what CHANGES between orderings is only whether the request reaches CORS middleware before something else rejects it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Instrumented protected endpoint + both middleware orderings',
      language: 'csharp',
      code: `// Program.cs (test host) — protected endpoint with a side-effect counter
public static class HandlerCallCounter
{
    public static int Calls;
}

app.MapPost("/secure/orders", () =>
{
    Interlocked.Increment(ref HandlerCallCounter.Calls);
    return Results.Ok(new { created = true });
}).RequireAuthorization();

// CORRECT ordering — CORS registered before auth:
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// (Separately built test host variant — WRONG ordering, for comparison:)
// app.UseAuthentication();
// app.UseAuthorization();
// app.UseCors("AllowFrontend");   // too late for preflight`,
    },
    {
      label: 'The test — proving termination, not "auth ignores preflight"',
      language: 'csharp',
      code: `[Fact]
public async Task Preflight_With_Correct_Ordering_Succeeds_Without_Auth()
{
    await using var app = new WebApplicationFactory<Program>(); // CORS before auth
    var client = app.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Options, "/secure/orders");
    request.Headers.Add("Origin", "http://localhost:4200");
    request.Headers.Add("Access-Control-Request-Method", "POST");
    // Deliberately NO Authorization header attached.

    var response = await client.SendAsync(request);

    Assert.Equal(HttpStatusCode.NoContent, response.StatusCode); // 204, not 401
    Assert.Equal("http://localhost:4200",
        response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    Assert.Equal(0, HandlerCallCounter.Calls);
    // The endpoint handler NEVER ran — CorsMiddleware answered the
    // preflight itself and returned early, never reaching routing.
}

[Fact]
public async Task Preflight_With_Wrong_Ordering_Gets_401_Not_CORS_Error()
{
    await using var app = new WebApplicationFactory<Program>(); // auth before CORS
    var client = app.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Options, "/secure/orders");
    request.Headers.Add("Origin", "http://localhost:4200");
    request.Headers.Add("Access-Control-Request-Method", "POST");

    var response = await client.SendAsync(request);

    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    // Auth middleware ran FIRST, saw no credentials on the OPTIONS
    // request, and rejected it — CORS middleware never got a turn.
    // In a real browser this surfaces as a generic "CORS error" in
    // devtools, even though the true cause is a 401 the browser never
    // shows you directly — the confusing symptom the main page's own
    // Q&A section warns about, now pinned down by a passing/failing test.
    Assert.Equal(0, HandlerCallCounter.Calls);
    // Note: the handler ALSO never ran here — for a different reason
    // (401 short-circuit vs. CORS short-circuit). Proving WHICH
    // middleware terminated the request requires checking the status
    // code and headers together, not just "did the handler run?".
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate insists that registering UseAuthorization() before UseCors() is only a problem for endpoints that actually require authorization — public endpoints with no [Authorize] should be unaffected regardless of ordering. Design a test to check this claim for a public (non-authorized) endpoint, and predict the result.',
    hint: 'UseAuthorization() runs for EVERY request that reaches it, not just ones targeting an [Authorize] endpoint — it resolves the applicable policy per-endpoint (bare "no metadata" endpoints fall through to FallbackPolicy if configured, or are allowed through with no policy check at all if none is set). Does authorization middleware reject an OPTIONS preflight for an endpoint with NO authorization requirement?',
    solution: `The claim is correct FOR THIS SPECIFIC CASE, but for a subtly different
reason than "authorization only affects protected endpoints" — worth
distinguishing precisely.

For a public endpoint with no [Authorize] attribute and no
FallbackPolicy configured, UseAuthorization() resolves to "no policy
required" and calls next() unconditionally — the OPTIONS preflight
passes through authorization middleware even if CORS is registered
after it, reaches CORS middleware (now running LATE, but still before
routing), and CORS still answers the preflight correctly. So a test
sending the same OPTIONS request to a public endpoint, with auth
BEFORE cors, would show 204 with correct headers — seemingly proving
the teammate right.

The trap: this only holds because NO FallbackPolicy is configured. The
moment a FallbackPolicy is set (per the Authorization hub's own
subtopic on this exact setting — "FallbackPolicy applies to every
endpoint with no authorization metadata"), authorization middleware
now rejects the SAME "public" OPTIONS preflight too, because from its
perspective the endpoint has no metadata and therefore falls under the
FallbackPolicy's RequireAuthenticatedUser() check. The teammate's claim
is true only in an app with no FallbackPolicy — which is a fragile,
easy-to-invalidate assumption the moment someone adds secure-by-default
FallbackPolicy protection later, exactly the recommended pattern the
Authorization page itself promotes. The safe rule remains unconditional:
always register UseCors() before UseAuthentication()/UseAuthorization(),
regardless of which endpoints currently require authorization.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'authentication middleware has special-case logic that recognizes and lets through OPTIONS preflight requests unauthenticated, which is why CORS "works" even near auth middleware.',
      reality: 'authentication/authorization middleware has no OPTIONS special-casing at all — the reason ordering matters is that CorsMiddleware, when registered FIRST, answers preflight requests itself and never hands control to later middleware; reverse the order and auth middleware runs first and rejects the credential-less OPTIONS request like any other unauthenticated request.',
    },
    {
      thought: 'a CORS preflight request reaches your endpoint handler, which is expected to detect OPTIONS and return an empty response.',
      reality: 'CorsMiddleware answers a preflight itself and returns before reaching routing at all — the endpoint handler never executes for a genuine preflight request, in either correct or incorrect middleware ordering, provable by an untouched side-effect counter.',
    },
    {
      thought: 'the middleware-ordering rule ("CORS before auth") only matters for endpoints that actually require authorization — public endpoints are safe regardless of order.',
      reality: 'that holds only in an app with no FallbackPolicy configured; the moment a secure-by-default FallbackPolicy (RequireAuthenticatedUser()) is set, authorization middleware rejects the preflight for a "public" endpoint too, since it has no authorization metadata of its own and falls under the fallback — making the safe rule unconditional, not endpoint-dependent.',
    },
  ];
}
