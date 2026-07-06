import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-openapi-spec-typedresults-regression-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-openapi-spec-catches-typedresults-regression-to-iresult.html',
  styleUrl: './testing-openapi-spec-catches-typedresults-regression-to-iresult.scss',
})
export class TestingOpenapiSpecCatchesTypedresultsRegressionToIresultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake shows TypedResults being accidentally reverted to bare IResult, silently losing schema — but nothing on the page shows a test that would catch this regression in CI',
      points: [
        'The main OpenAPI &amp; Swagger page\'s "Using IResult return type and losing response schema inference" mistake shows exactly what happens when a developer (perhaps during a refactor, or copying an example from elsewhere) changes an endpoint\'s return type from <code>Results&lt;Ok&lt;Product&gt;, NotFound&gt;</code> back to bare <code>Results.Ok(p)</code>/<code>Results.NotFound()</code> — the generated spec silently degrades to an empty <code>responses: {}</code> for that endpoint. This kind of regression produces NO build error, NO test failure by default, and is easy to miss in code review since the ENDPOINT still behaves correctly at runtime — only the DOCUMENTATION quietly gets worse.',
      ],
    },
    {
      heading: 'Fetching the actual generated OpenAPI JSON in an integration test and asserting on specific schema properties directly proves the spec still documents what it should — catching a schema regression the exact moment it happens',
      points: [
        'Since <code>MapOpenApi()</code> serves the generated document as a normal JSON endpoint, an integration test using <code>WebApplicationFactory&lt;T&gt;</code> can fetch <code>/openapi/v1.json</code>, parse it, and assert that a SPECIFIC endpoint\'s response definitions include the EXPECTED schema references — e.g., that <code>GET /products/{id}</code> documents BOTH a 200 response with a <code>Product</code> schema reference AND a 404 response, rather than an empty <code>responses: {}</code> object. This test fails IMMEDIATELY if a future edit reverts the endpoint to bare <code>IResult</code>, long before a human reviewer might notice the documentation quietly degraded.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An integration test that fetches the real spec and asserts on specific schema content',
      language: 'csharp',
      code: `public class OpenApiSpecContentTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OpenApiSpecContentTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task ProductsGetByIdEndpoint_DocumentsBothOkAndNotFoundResponses()
    {
        var response = await _client.GetAsync("/openapi/v1.json");
        response.EnsureSuccessStatusCode();

        var spec = await response.Content.ReadFromJsonAsync<JsonDocument>();
        var responses = spec!.RootElement
            .GetProperty("paths")
            .GetProperty("/products/{id}")
            .GetProperty("get")
            .GetProperty("responses");

        // These assertions FAIL the moment TypedResults gets reverted
        // to bare IResult (or Results.Ok()/Results.NotFound()) — the
        // exact regression the main page's own Common Mistake
        // describes, caught automatically rather than relying on a
        // human noticing the spec quietly went empty:
        Assert.True(responses.TryGetProperty("200", out var okResponse),
            "Expected a documented 200 response — the endpoint may have regressed to a bare IResult return type");
        Assert.True(responses.TryGetProperty("404", out var notFoundResponse),
            "Expected a documented 404 response — Results<Ok<T>, NotFound> may have been changed");

        // Going further: verify the 200 response actually references a
        // SCHEMA (not just an empty response definition with no body
        // description at all):
        var hasSchema = okResponse
            .GetProperty("content")
            .GetProperty("application/json")
            .TryGetProperty("schema", out _);
        Assert.True(hasSchema, "Expected the 200 response to reference a Product schema");
    }
}`,
    },
    {
      label: 'The exact regression this test catches — a well-intentioned refactor that silently degrades the spec',
      language: 'csharp',
      code: `// BEFORE the regression — correctly typed, exactly like the main
// page's own "right" example:
products.MapGet("/{id:int}",
    async (int id, IProductService svc) =>
    {
        var p = await svc.FindAsync(id);
        return p is null
            ? (Results<Ok<Product>, NotFound>)TypedResults.NotFound()
            : TypedResults.Ok(p);
    })
    .WithSummary("Get product by ID");

// AFTER a "simplification" refactor — a developer, perhaps finding the
// explicit cast to Results<Ok<Product>, NotFound> unfamiliar or
// verbose, "cleans it up" to plain Results.Ok()/Results.NotFound():
products.MapGet("/{id:int}",
    async (int id, IProductService svc) =>
    {
        var p = await svc.FindAsync(id);
        // Looks equivalent — runs IDENTICALLY at request time — but
        // the METHOD'S OWN DECLARED RETURN TYPE is now bare IResult,
        // not a Results<T1,T2> union:
        return p is null ? Results.NotFound() : Results.Ok(p);
    })
    .WithSummary("Get product by ID");

// 'dotnet build' succeeds. The endpoint STILL correctly returns 200 or
// 404 at runtime for real requests — a manual smoke test would see
// nothing wrong. Only the GENERATED SPEC silently degrades: the
// "responses" object for this path becomes empty (or generic/untyped),
// and any consumer relying on Kiota/NSwag-generated clients built from
// THIS version of the spec would get an untyped or 'object'-shaped
// response model instead of a proper 'Product' type — a real, but
// invisible-until-noticed, regression in generated-client quality.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The test in this subtopic checks one specific endpoint\'s schema. Propose a more general, scalable version of this test that would catch a schema regression on ANY endpoint in a growing API, without needing to hand-write one assertion block per route.',
    hint: 'Consider recording a KNOWN-GOOD snapshot of the generated spec (or a reduced summary of it — just the set of documented response codes per path) once, checking it into source control, and having a test compare the CURRENT spec against that snapshot on every run.',
    solution: `A scalable approach: a "spec snapshot" test that compares the CURRENT
generated OpenAPI document against a checked-in, known-good snapshot,
failing whenever a meaningful structural change occurs (an endpoint
losing a previously-documented response code, a schema reference
disappearing, etc.) — this is the same underlying technique as the main
page's own recommendation to "check the generated client into source
control and diff it in PRs," applied one layer earlier, directly to the
spec itself:

[Fact]
public async Task OpenApiSpec_MatchesKnownGoodSnapshot_NoUndocumentedRegressions()
{
    var response = await _client.GetAsync("/openapi/v1.json");
    var currentSpec = await response.Content.ReadAsStringAsync();

    // Reduce the full spec to just the structurally meaningful part —
    // for each path+method, the SET of documented response codes.
    // This avoids the snapshot being fragile to cosmetic changes
    // (descriptions, examples) while still catching the regression
    // that actually matters: an endpoint losing a response code it
    // used to document:
    var currentSummary = ExtractResponseCodesPerEndpoint(currentSpec);

    var snapshotPath = Path.Combine(AppContext.BaseDirectory, "openapi-response-codes.snapshot.json");
    if (!File.Exists(snapshotPath))
    {
        // First run — establish the baseline (a developer reviews and
        // commits this file, exactly like reviewing a generated
        // client diff in a PR):
        File.WriteAllText(snapshotPath, JsonSerializer.Serialize(currentSummary));
        return;
    }

    var knownGood = JsonSerializer.Deserialize<Dictionary<string, string[]>>(
        File.ReadAllText(snapshotPath))!;

    foreach (var (endpoint, expectedCodes) in knownGood)
    {
        Assert.True(currentSummary.TryGetValue(endpoint, out var actualCodes),
            $"Endpoint '{endpoint}' is missing from the current spec entirely");
        foreach (var code in expectedCodes)
            Assert.Contains(code, actualCodes!);
    }
}

This scales to any number of endpoints without hand-writing an
assertion block per route, and the snapshot file itself becomes a
reviewable PR artifact — a developer intentionally removing a
documented response code updates the snapshot explicitly (a visible,
reviewed change), while an ACCIDENTAL regression (like the IResult
reversion from this subtopic's second code tab) fails the test instead
of silently degrading the spec.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a regression from TypedResults back to bare IResult would be caught by ordinary functional/integration tests that check the endpoint\'s actual runtime behavior (status codes, response bodies).',
      reality: 'the endpoint behaves IDENTICALLY at runtime either way — the regression is purely in the GENERATED OPENAPI SPEC\'s documentation quality, which ordinary functional tests never inspect at all, since they only check what the endpoint DOES, not what it DOCUMENTS.',
    },
    {
      thought: 'a schema regression like this would be obvious in code review, since reviewers would notice the return type change from Results<T1,T2> to bare IResult.',
      reality: 'a "simplification" refactor that removes an unfamiliar-looking explicit cast or union type can look like a genuine improvement to a reviewer unfamiliar with WHY the original code was written that way — without a test asserting on the actual generated spec content, there is no automated signal that documentation quality just degraded.',
    },
    {
      thought: 'hand-writing one assertion block per endpoint is the only way to test that an OpenAPI spec stays correct as an API grows.',
      reality: 'a snapshot-based test that reduces the full spec to just the response codes documented per endpoint, checked against a committed baseline, scales to any number of endpoints without per-route hand-written assertions — while still surfacing any REAL regression as a reviewable diff.',
    },
  ];
}
