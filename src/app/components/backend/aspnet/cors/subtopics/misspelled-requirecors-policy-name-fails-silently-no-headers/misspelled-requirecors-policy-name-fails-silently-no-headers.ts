import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-misspelled-requirecors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './misspelled-requirecors-policy-name-fails-silently-no-headers.html',
  styleUrl: './misspelled-requirecors-policy-name-fails-silently-no-headers.scss',
})
export class MisspelledRequirecorsPolicyNameFailsSilentlyNoHeadersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A shows .RequireCors("PolicyName") as a safe, declarative per-endpoint override — but never mentions what happens when the string does not match any registered policy: NOT a startup exception, NOT a runtime exception — just a response with no CORS headers at all',
      points: [
        'Named CORS policies are resolved LAZILY, per-request, by <code>ICorsPolicyProvider.GetPolicyAsync(context, policyName)</code> — inspecting the string against the dictionary populated by <code>AddCors()</code>\'s <code>AddPolicy()</code> calls. This lookup happens the FIRST time a matching request arrives, not at application startup — there is no validation step anywhere in <code>WebApplication.Build()</code> or <code>Run()</code> that checks every <code>.RequireCors("...")</code> call site against the registered policy names.',
        'When the name does not match, <code>GetPolicyAsync</code> simply returns <code>null</code>. <code>CorsMiddleware</code> treats a <code>null</code> policy as "nothing to apply" — it calls <code>next()</code> and lets the request proceed completely normally through the rest of the pipeline, with NO CORS headers added to the response. The endpoint handler runs fine, returns 200, the response body is correct — the ONLY symptom is that <code>Access-Control-Allow-Origin</code> is simply absent.',
      ],
    },
    {
      heading: 'The practical consequence: this is invisible to every tool except an actual browser making a cross-origin call — curl, Postman, and even a same-origin browser tab see a perfectly normal 200 response, and the natural debugging instinct (re-check the ALLOWED ORIGINS list) points at exactly the wrong part of the configuration',
      points: [
        'A developer debugging "CORS is blocking my request" almost always starts by re-checking the policy\'s <code>WithOrigins()</code> list — is the origin spelled right, is the port correct, is it HTTP vs HTTPS. None of that is the problem when the actual bug is a typo in the STRING passed to <code>.RequireCors("Publci")</code> vs. the STRING passed to <code>AddPolicy("Public", ...)</code> three lines away in a different file. The fix is a one-character diff, but nothing in the error surface points there — Swagger/OpenAPI testing tools, curl, and integration tests using <code>HttpClient</code> directly (rather than asserting on CORS response headers specifically) all report success.',
        'This is a case where the ONLY reliable defense is a targeted integration test asserting the actual <code>Access-Control-Allow-Origin</code> header is present for the exact endpoint under an Origin header — exactly the technique the main page\'s own Q&A section recommends for testing CORS generally, but this subtopic shows WHY that specific test (and not a general "does the endpoint return 200" test) is the one that actually catches this class of typo.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent failure, reproduced — one typo, zero errors anywhere',
      language: 'csharp',
      code: `builder.Services.AddCors(opts =>
{
    opts.AddPolicy("Public", p =>
        p.AllowAnyOrigin().WithMethods("GET"));
});

var app = builder.Build();
app.UseCors();   // no default policy set — fine, since every endpoint
                  // below uses an explicit RequireCors() call

// Typo: "PublicReadOnly" was never registered — only "Public" was.
app.MapGet("/products", () => Results.Ok(new[] { "Widget", "Gadget" }))
   .RequireCors("PublicReadOnly");   // <-- silently resolves to null

// What actually happens for a cross-origin browser request:
//   1. GetPolicyAsync(context, "PublicReadOnly") returns null
//      (no exception, no log entry above Debug level by default)
//   2. CorsMiddleware calls next() — the request proceeds normally
//   3. The endpoint handler runs and returns 200 with the product list
//   4. The RESPONSE has no Access-Control-Allow-Origin header
//   5. curl/Postman/HttpClient in a test all report: 200 OK, correct
//      body — everything "looks fine"
//   6. Only an ACTUAL BROWSER, making this exact cross-origin fetch(),
//      blocks the response and reports a generic CORS error`,
    },
    {
      label: 'The test that actually catches it — and a startup-time safety net',
      language: 'csharp',
      code: `[Fact]
public async Task Products_Endpoint_Sends_Cors_Header_For_Allowed_Origin()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Get, "/products");
    request.Headers.Add("Origin", "https://anything.example.com");

    var response = await client.SendAsync(request);

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);  // this alone
                                                            // would NOT
                                                            // catch the bug
    Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
    // THIS assertion is what actually fails when the policy name is
    // misspelled — status code and body are identical either way.
}

// A lightweight startup-time safety net — enumerate every RequireCors()
// call site via endpoint metadata and cross-check against registered
// policy names, failing fast instead of waiting for a browser to notice:
public static void ValidateCorsPolicyNames(WebApplication app, CorsOptions corsOptions)
{
    var registeredNames = corsOptions.GetPolicyNames(); // via reflection/
                                                         // custom tracking,
                                                         // since CorsOptions
                                                         // doesn't expose this
                                                         // publicly pre-.NET 9
    var dataSource = app.Services.GetRequiredService<EndpointDataSource>();
    foreach (var endpoint in dataSource.Endpoints)
    {
        var corsMetadata = endpoint.Metadata.GetMetadata<ICorsPolicyMetadata>();
        if (corsMetadata is { PolicyName: { } name } &&
            !registeredNames.Contains(name))
        {
            throw new InvalidOperationException(
                $"Endpoint '{endpoint.DisplayName}' references CORS " +
                $"policy '{name}', which was never registered.");
        }
    }
}
// Call this once, right after app.Build(), before app.Run() — turns a
// silent runtime gap into a fail-fast startup error.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes an integration test for their /products endpoint that asserts response.StatusCode == HttpStatusCode.OK and response body content, then ships it as their "CORS test." Six months later, someone renames the policy from "PublicReadOnly" to "ReadOnlyPublic" in AddCors() but forgets to update the .RequireCors() call site. Will the existing test suite catch this regression? What is the minimum change needed to catch it?',
    hint: 'Does asserting on status code and body distinguish between "CORS headers present" and "CORS headers silently absent"? What did the earlier code tab show CorsMiddleware actually does when the policy name doesn\'t resolve?',
    solution: `No, the existing test suite will NOT catch this regression, and it
will not catch it for exactly the reason demonstrated in the code
tab: a null-resolved CORS policy causes CorsMiddleware to skip adding
any headers and call next() as if CORS simply weren't configured for
that endpoint — the endpoint handler still runs normally, still
returns 200, and the response body is byte-for-byte identical to the
working case. A test asserting only status code and body content has
NO SIGNAL to detect the difference; it will pass identically whether
the CORS policy resolved correctly or not at all.

The minimum fix is exactly one additional assertion per CORS-sensitive
endpoint test: send the request WITH an Origin header attached (as if
from a real cross-origin browser call), and assert that
response.Headers.Contains("Access-Control-Allow-Origin") is true — or,
more precisely, that its value matches the expected origin. This is
the ONLY signal that distinguishes "policy resolved and applied" from
"policy silently failed to resolve," because that header is the one
and only artifact CorsMiddleware produces differently between the two
cases.

The broader lesson connects back to this subtopic's core point: a
"CORS test" that doesn't specifically assert on CORS response headers
isn't testing CORS at all — it's testing that the endpoint works,
which was never in question. The rename-without-updating-the-call-site
scenario is a realistic refactor accident precisely because nothing in
the C# compiler, the ASP.NET Core startup path, or a body/status-only
test suite treats a CORS policy name as a reference that needs to stay
in sync — it's just two independent strings that happen to need to
match.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if .RequireCors("SomeName") references a policy name that was never registered with AddPolicy(), ASP.NET Core throws a clear exception — either at startup or the first time that endpoint is hit.',
      reality: 'a misspelled or unregistered policy name resolves to null via ICorsPolicyProvider.GetPolicyAsync(), and CorsMiddleware treats a null policy as "nothing to apply" — it silently calls next() with no exception anywhere, and the response is simply missing its CORS headers.',
    },
    {
      thought: 'an integration test asserting the endpoint returns 200 with the correct response body is sufficient coverage for "CORS is configured correctly" on that endpoint.',
      reality: 'the endpoint handler runs identically and returns the identical response body whether the CORS policy resolved correctly or silently failed to resolve at all — only an assertion specifically checking for the presence and value of the Access-Control-Allow-Origin response header can distinguish the two cases.',
    },
    {
      thought: 'a broken CORS policy reference would show up in local development or manual testing before reaching production, since developers routinely test their own endpoints.',
      reality: 'curl, Postman, and same-origin browser testing (opening the API directly, or testing via Swagger UI served from the same origin) never send the cross-origin Origin header that would expose the missing Access-Control-Allow-Origin response header — the gap is invisible to every common manual testing method except an actual cross-origin fetch() from the real frontend.',
    },
  ];
}
