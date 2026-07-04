import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-versioned-endpoints-shapes-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-versioned-endpoints-return-genuinely-different-shapes.html',
  styleUrl: './testing-versioned-endpoints-return-genuinely-different-shapes.scss',
})
export class TestingVersionedEndpointsReturnGenuinelyDifferentShapesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake shows an action missing [MapToApiVersion] silently leaking into every version — but nothing on the page shows a test that would catch this exact regression',
      points: [
        'The main API Versioning page\'s "Actions without [MapToApiVersion] unintentionally exposed in all versions" mistake demonstrates a v2-only action that, without the attribute, becomes reachable from v1 too. This is a SILENT mistake — the v1 endpoint still returns 200 OK with SOME response body, it is just the WRONG one (the v2 shape) rather than a clear error. A developer testing only "does GET /api/v1/products/{id} return 200?" would see success and move on, never noticing the response actually came from the v2-only handler.',
      ],
    },
    {
      heading: 'An integration test that hits BOTH version URLs and asserts on the SPECIFIC, DISTINGUISHING shape each version is supposed to return — not just the status code — is what actually proves version isolation is intact',
      points: [
        'Since the main page\'s own v1/v2 examples deliberately return DIFFERENT DTO shapes (v1: <code>{ id, format = "legacy" }</code>; v2: <code>{ id, name, price }</code>), a test can assert on the PRESENCE of version-specific fields — e.g., that the v1 response contains <code>"legacy"</code> and does NOT contain <code>"price"</code>, and vice versa for v2. This directly encodes "version isolation is correct" as an executable assertion, rather than relying on a developer noticing a missing <code>[MapToApiVersion]</code> attribute during code review.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An integration test proving v1 and v2 return genuinely distinct, version-specific shapes',
      language: 'csharp',
      code: `public class ApiVersioningTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiVersioningTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task V1_ReturnsLegacyShape_NotTheV2Shape()
    {
        var response = await _client.GetAsync("/api/v1/products/1");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // These assertions directly encode "this IS the v1 shape" — not
        // just "a 200 came back." If the main page's own missing-
        // [MapToApiVersion] mistake were reintroduced (a v2-only action
        // silently reachable from v1), THIS test would fail because the
        // v1 URL would now return the v2 shape instead:
        Assert.True(body.TryGetProperty("format", out var format));
        Assert.Equal("legacy", format.GetString());
        Assert.False(body.TryGetProperty("price", out _),
            "v1 response should NOT contain 'price' — that's the v2-only field");
    }

    [Fact]
    public async Task V2_ReturnsRichShape_NotTheV1Shape()
    {
        var response = await _client.GetAsync("/api/v2/products/1");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(body.TryGetProperty("price", out var price));
        Assert.True(price.GetDecimal() > 0);
        Assert.False(body.TryGetProperty("format", out _),
            "v2 response should NOT contain 'format' — that's the v1-only field");
    }
}

// WHAT THIS TEST ACTUALLY CATCHES: if a future action is added to the
// v2 controller WITHOUT [MapToApiVersion("2.0")], and that action
// happens to share the SAME route template as an existing v1 action,
// the v1 test above would start seeing 'price' where it shouldn't (or
// vice versa) — failing immediately, rather than silently shipping a
// version-isolation regression that only a careful manual comparison
// of both responses would catch.`,
    },
    {
      label: 'The exact regression this test catches — reproducing the main page\'s own mistake, and confirming the test fails',
      language: 'csharp',
      code: `// Reproducing the BROKEN version from the main page's own mistake:
[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int}")]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1(int id)
        => Ok(new { id, format = "legacy" });

    // BUG: missing [MapToApiVersion("2.0")] — this action is now
    // available in BOTH v1 and v2, creating a route conflict with
    // GetV1 for the SAME route template AND the SAME v1 version:
    [HttpGet("{id:int}")]
    public IActionResult GetV2(int id)
        => Ok(new { id, name = "Laptop", price = 999.99m });
}

// DEPENDING ON THE EXACT VERSION-SELECTION TIE-BREAKING RULES, this
// could manifest as either:
//   (a) an AmbiguousMatchException at request time (if the framework
//       cannot disambiguate GetV1 vs GetV2 for a v1 request), or
//   (b) GetV2 silently winning and serving the v2 shape to v1 clients
//       (if the framework's tie-breaking happens to prefer it) —
// EITHER WAY, the 'V1_ReturnsLegacyShape_NotTheV2Shape' test from the
// previous tab FAILS — either from an unexpected exception, or from
// the response containing 'price' where the assertion expects
// 'format' and no 'price' — directly surfacing the exact bug the main
// page's own Common Mistake describes, the moment it's introduced,
// rather than requiring a developer to manually compare both version's
// responses during review.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The tests in this subtopic check the RESPONSE BODY shape for each version. Propose an ADDITIONAL assertion these tests should include, based on the main page\'s own ReportApiVersions guidance, to more fully verify the versioning setup is configured correctly — not just that the right DTO shape came back.',
    hint: 'Consider what RESPONSE HEADERS the main page says ReportApiVersions = true adds to every response — could a test assert on those headers too, to verify the versioning middleware itself is active and correctly configured, independent of what any specific action returns?',
    solution: `An additional assertion should check the api-supported-versions (and,
for the v1 test specifically, api-deprecated-versions) response
headers that the main page's own ReportApiVersions = true setting adds
to every response — this verifies the VERSIONING INFRASTRUCTURE itself
is correctly configured, independent of what any individual action
happens to return:

[Fact]
public async Task V1_ReturnsLegacyShape_AndReportsDeprecatedVersionHeader()
{
    var response = await _client.GetAsync("/api/v1/products/1");
    var body = await response.Content.ReadFromJsonAsync<JsonElement>();

    Assert.True(body.TryGetProperty("format", out var format));
    Assert.Equal("legacy", format.GetString());

    // Verifies ReportApiVersions = true is actually wired up, AND that
    // v1 is correctly marked Deprecated = true — both configuration
    // details the main page emphasizes, neither of which the body-shape
    // assertions alone would catch if accidentally misconfigured:
    Assert.True(response.Headers.TryGetValues("api-supported-versions", out var supported));
    Assert.Contains("1.0", supported!);
    Assert.Contains("2.0", supported!);

    Assert.True(response.Headers.TryGetValues("api-deprecated-versions", out var deprecated));
    Assert.Contains("1.0", deprecated!);
}

This test now verifies THREE independent things that could each
regress separately: (1) the v1 action returns the correct DTO shape,
(2) the versioning middleware is correctly reporting both supported
versions, and (3) v1 is still correctly flagged as deprecated in the
response headers — a configuration detail that is easy to accidentally
drop during a refactor (e.g., if someone rewrites the [ApiVersion]
attributes and forgets Deprecated = true) but has NO effect on the
actual response body, meaning body-shape assertions alone would never
catch a regression in the deprecation signal specifically.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing that a versioned endpoint returns HTTP 200 for both /api/v1/... and /api/v2/... URLs is sufficient to verify version isolation is working correctly.',
      reality: 'a version-isolation bug (like a v2-only action missing [MapToApiVersion]) still returns 200 OK — just with the WRONG response shape — so a status-code-only test passes even with the exact regression the main page\'s own Common Mistake describes; asserting on version-SPECIFIC fields in the body is what actually catches it.',
    },
    {
      thought: 'a missing [MapToApiVersion] attribute on an action would be caught immediately by a compile error or an obvious runtime exception on every request.',
      reality: 'depending on how the framework resolves the resulting ambiguity, the action might silently win for BOTH versions (serving the wrong shape to one of them) rather than throwing — making a dedicated content-based test the only reliable signal, rather than assuming an obvious crash would surface the bug.',
    },
    {
      thought: 'testing the response BODY shape for each API version fully verifies the versioning setup is correctly configured.',
      reality: 'configuration details like ReportApiVersions and Deprecated=true affect only RESPONSE HEADERS, not the body — a body-shape-only test provides zero coverage for a regression in those headers, which requires a separate, explicit assertion on the headers themselves.',
    },
  ];
}
