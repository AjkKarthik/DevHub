import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-reexecute-status-code-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-reexecuted-error-endpoint-must-explicitly-restore-status-code.html',
  styleUrl: './why-reexecuted-error-endpoint-must-explicitly-restore-status-code.scss',
})
export class WhyReexecutedErrorEndpointMustExplicitlyRestoreStatusCodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own error endpoint explicitly passes "statusCode: code" into Results.Problem() — this is NOT decorative, it is the ONLY thing that keeps the original status code from being silently replaced',
      points: [
        'The main Error Handling page\'s "Status Code Pages" section shows <code>app.UseStatusCodePagesWithReExecute("/error/{0}")</code> paired with an error endpoint: <code>app.MapGet("/error/{code:int}", (int code) => Results.Problem(statusCode: code, title: ...))</code>. The route parameter <code>{code:int}</code> and the explicit <code>statusCode: code</code> argument are doing REAL WORK — <code>UseStatusCodePagesWithReExecute</code> does not automatically preserve the original status code on the RESPONSE the client receives; it only preserves the original PATH information so the re-executed pipeline can look it up.',
      ],
    },
    {
      heading: 'Re-execution swaps the REQUEST PATH to the error route and runs the pipeline again from routing onward — the RESPONSE status code is whatever the re-executed endpoint actually sets, not automatically the original one',
      points: [
        'When a downstream response (say, from a missing route or a manually-set 404) has no body and a non-2xx status code, <code>UseStatusCodePagesWithReExecute</code> captures the ORIGINAL status code and path via an internal <code>IStatusCodeReExecuteFeature</code>, then REWRITES the request path to <code>/error/{0}</code> (substituting the original status code into the template) and re-runs the pipeline from ROUTING onward — as if the client had originally requested <code>/error/404</code>. The KEY DETAIL: this re-execution runs a COMPLETELY NORMAL request pipeline pass — the <code>/error/{code:int}</code> endpoint is just an ordinary minimal API handler, and whatever IT returns (which, absent the explicit <code>statusCode: code</code> argument, defaults to 200 OK for a bare object return) becomes the ACTUAL response sent to the client.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own error endpoint — correct because it explicitly restores the status code from the route parameter',
      language: 'csharp',
      code: `app.UseStatusCodePagesWithReExecute("/error/{0}");

// {0} in the template is substituted with the ORIGINAL status code —
// e.g. a request that resulted in a bare 404 gets re-executed as if
// the client had requested "/error/404":
app.MapGet("/error/{code:int}", (int code) =>
    Results.Problem(
        statusCode: code,   // <-- THIS explicitly sets the RESPONSE
                            //     status code to match the ORIGINAL
                            //     one — it is NOT automatic
        title: code switch {
            404 => "The requested resource was not found.",
            403 => "You do not have permission to access this resource.",
            400 => "The request was invalid.",
            _   => "An unexpected error occurred."
        }))
.ExcludeFromDescription();

// Results.Problem(statusCode: code, ...) constructs an IResult that,
// when executed, explicitly sets HttpResponse.StatusCode = code before
// writing the ProblemDetails body. This is a NORMAL result-execution
// step — nothing about UseStatusCodePagesWithReExecute automatically
// does this on the endpoint's behalf.`,
    },
    {
      label: 'What happens if the error endpoint forgets to pass statusCode — the original 404 silently becomes 200',
      language: 'csharp',
      code: `// A BROKEN variant — reads 'code' from the route but never uses it to
// set the actual response status:
app.MapGet("/error/{code:int}", (int code) =>
    Results.Ok(new {           // BUG: Results.Ok() ALWAYS sends 200,
        message = code switch  //      regardless of what 'code' equals
        {
            404 => "The requested resource was not found.",
            403 => "You do not have permission to access this resource.",
            _   => "An unexpected error occurred."
        }
    }))
.ExcludeFromDescription();

// WHAT ACTUALLY HAPPENS: a client requests GET /products/99999 (a
// product that doesn't exist). Suppose the products endpoint itself
// returns a bare 404 with no body (e.g. via 'return Results.NotFound()'
// with no ProblemDetails formatting configured for that specific path).
//
//   1. UseStatusCodePagesWithReExecute detects the 404 with an empty
//      body, captures it, and re-executes the pipeline as
//      "/error/404".
//   2. The (broken) /error/{code:int} endpoint runs, receives
//      code = 404 correctly (the ROUTE VALUE itself is fine — routing
//      always worked correctly), but its handler calls Results.Ok(...),
//      which unconditionally sets the RESPONSE status to 200.
//   3. THE CLIENT RECEIVES: HTTP/1.1 200 OK, with a JSON body saying
//      "The requested resource was not found." — a deeply confusing
//      combination: a 200 status code paired with a body describing a
//      FAILURE. Any client code checking 'response.ok' (fetch) or
//      'response.IsSuccessStatusCode' (HttpClient) would treat this as
//      a SUCCESSFUL request, potentially processing the error message
//      as if it were valid data.

// THE LESSON: the route VALUE 'code' being correctly bound to 404 does
// NOT mean the ACTUAL HTTP RESPONSE status code is 404 — those are two
// completely independent things. Re-execution only guarantees the
// ORIGINAL status is available to READ (via the route parameter or
// IStatusCodeReExecuteFeature) — using it to actually SET the response
// status is the error endpoint's own explicit responsibility.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write an integration test that would catch the broken /error/{code:int} endpoint shown in this subtopic\'s second code tab — one that specifically distinguishes "the response BODY correctly describes a 404" from "the response STATUS CODE is actually 404."',
    hint: 'Consider that a test asserting only on response body content (e.g. checking the JSON message contains "not found") would pass even with the bug present — what HTTP-level property must the test check instead, or in addition?',
    solution: `The test must explicitly assert on the response's actual HTTP status
code, not just its body content — a body-only assertion would pass even
with the bug, since the broken endpoint still produces a body that
LOOKS correct despite the wrong status:

public class StatusCodeReExecuteTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public StatusCodeReExecuteTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task MissingProduct_ReturnsActual404StatusCode_NotJust404InTheBody()
    {
        var response = await _client.GetAsync("/products/99999");

        // THIS is the assertion that catches the bug — checking the
        // ACTUAL HTTP status code the client would use for control flow
        // (response.IsSuccessStatusCode, HTTP caching behavior, retry
        // logic, etc.), not just the body's textual content:
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Contains("not found", body!.Title, StringComparison.OrdinalIgnoreCase);

        // A test asserting ONLY the second block (body content) would
        // have PASSED even with the broken Results.Ok() endpoint from
        // this subtopic's second code tab, since that endpoint still
        // produces a body containing "not found" — the FIRST assertion
        // is what actually distinguishes correct behavior from the bug.
    }
}

This reinforces a general testing principle worth carrying beyond this
specific subtopic: whenever a response has BOTH a status code AND a
body describing a similar concept (an error status alongside an error
message), a test must assert on BOTH independently — a body-only
assertion can pass even when the status code is systematically wrong,
exactly as demonstrated by the Results.Ok() vs Results.Problem(statusCode:)
distinction in this subtopic.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'UseStatusCodePagesWithReExecute automatically ensures the client receives the ORIGINAL status code (e.g. 404) on the final response, since that\'s the whole point of the middleware.',
      reality: 'the middleware only preserves the original status code as INFORMATION available to the re-executed pipeline (via the route parameter or IStatusCodeReExecuteFeature) — the ACTUAL response status code sent to the client is whatever the re-executed error endpoint itself explicitly sets, which requires code like Results.Problem(statusCode: code) rather than a bare Results.Ok().',
    },
    {
      thought: 'a route parameter like {code:int} correctly binding to a value (e.g. 404) guarantees the actual HTTP response status code will also be 404.',
      reality: 'the bound route VALUE and the RESPONSE STATUS CODE are two completely independent things — a handler that reads code=404 correctly but calls Results.Ok(...) still sends a 200 OK response regardless of what the route parameter contains.',
    },
    {
      thought: 'a test asserting that a response BODY contains the correct error message (e.g. "not found") is sufficient to verify error-handling behavior for that status.',
      reality: 'a broken endpoint can produce a body that looks correct while sending the WRONG status code entirely — a test must independently assert on response.StatusCode to catch this class of bug, since client code often branches on the status code rather than parsing body text.',
    },
  ];
}
