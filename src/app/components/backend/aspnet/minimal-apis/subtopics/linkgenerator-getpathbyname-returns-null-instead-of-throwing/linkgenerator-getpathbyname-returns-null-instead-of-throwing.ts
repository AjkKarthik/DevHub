import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-linkgenerator-getpathbyname-null-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './linkgenerator-getpathbyname-returns-null-instead-of-throwing.html',
  styleUrl: './linkgenerator-getpathbyname-returns-null-instead-of-throwing.scss',
})
export class LinkgeneratorGetpathbynameReturnsNullInsteadOfThrowingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own fix for the hardcoded-URL mistake calls WithName() + LinkGenerator "the same mechanism as controllers" and "remaining correct through refactoring" — but its FAILURE MODE is actually the opposite of a controller\'s',
      points: [
        'The main Minimal APIs page\'s "Forgetting .WithName()" Common Mistake shows the fix: name the GET endpoint with <code>.WithName("GetProduct")</code>, then generate its URL via <code>links.GetPathByName("GetProduct", new { id = product.Id })</code>. This is presented as directly equivalent to a controller\'s <code>CreatedAtAction()</code> — but the two behave DIFFERENTLY when the supplied route values do not satisfy the target endpoint\'s route template.',
      ],
    },
    {
      heading: 'CreatedAtAction throws InvalidOperationException when route values don\'t match — LinkGenerator.GetPathByName returns null silently, with no exception at all',
      points: [
        'As covered in the Controllers subtopics, <code>CreatedAtAction</code> resolves its target URL via <code>IUrlHelper</code>, which THROWS <code>InvalidOperationException: "No route matches the supplied values."</code> when the <code>routeValues</code> don\'t satisfy the target action\'s route template — a LOUD, unmissable failure the first time that code path executes. <code>LinkGenerator.GetPathByName()</code> is built directly on the SAME underlying route-value-matching logic, but its contract is different: when no matching route can be generated, it returns <strong>null</strong> — no exception, no log entry, nothing. If that null is passed directly into <code>TypedResults.Created(url, product)</code> without a null check, the response is still 201 Created, but with a <strong>missing or literally "null" <code>Location</code> header</strong> — a REST contract violation that most test suites and manual testing would not notice, since the response still "looks successful."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own fixed example — but with the SAME route-template-change bug covered for CreatedAtAction, applied here instead',
      language: 'csharp',
      code: `// From the main page's own "right" example:
app.MapGet("/products/{id:int}", (int id) => Get(id))
   .WithName("GetProduct");

app.MapPost("/products", (CreateProductDto dto, LinkGenerator links, HttpContext ctx) =>
{
    var product = Create(dto);
    var url = links.GetPathByName("GetProduct", new { id = product.Id });
    return TypedResults.Created(url, product);
});

// SUPPOSE the GET endpoint's route template later changes to add API
// versioning — mirroring the exact refactor covered in the Controllers
// subtopics, but for minimal APIs instead:
app.MapGet("/v{version}/products/{id:int}", (string version, int id) => Get(id))
   .WithName("GetProduct");   // name is UNCHANGED — still "GetProduct"

// The POST handler above was NEVER touched. It still compiles (there is
// no compile-time link between a string endpoint name and the route
// template it currently maps to — WithName("GetProduct") is just a
// runtime string key). At RUNTIME:
//
//   links.GetPathByName("GetProduct", new { id = product.Id })
//
// can no longer generate a URL, because the ROUTE TEMPLATE now also
// requires a 'version' value that 'new { id = product.Id }' does not
// supply.`,
    },
    {
      label: 'The critical difference: GetPathByName returns NULL here — no exception, no diagnostic, a silently broken response',
      language: 'csharp',
      code: `// WHAT ACTUALLY HAPPENS after the route-template change in the previous
// tab — unlike CreatedAtAction (which throws), this fails SILENTLY:

app.MapPost("/products", (CreateProductDto dto, LinkGenerator links, HttpContext ctx) =>
{
    var product = Create(dto);

    // 'url' is NULL here — GetPathByName's contract is to return null
    // when no route matches, NOT to throw:
    var url = links.GetPathByName("GetProduct", new { id = product.Id });

    // TypedResults.Created accepts a nullable string uri parameter —
    // this line does NOT throw either:
    return TypedResults.Created(url, product);
});

// THE OBSERVABLE RESULT: a POST request still returns 201 Created (the
// status code the client expects for successful creation), but the
// Location header is MISSING or empty — a REST contract violation that:
//
//   - Passes any test asserting only on the status code
//     (response.StatusCode == 201)
//   - Is invisible in casual manual testing (Postman/curl users often
//     don't check for the Location header specifically)
//   - Silently breaks any client code that DOES rely on the Location
//     header to fetch the newly created resource
//
// ── THE FIX: explicitly check for null and handle it deliberately ──
app.MapPost("/products", (CreateProductDto dto, LinkGenerator links, HttpContext ctx) =>
{
    var product = Create(dto);
    var url = links.GetPathByName("GetProduct", new { id = product.Id });

    if (url is null)
    {
        // Fail LOUDLY instead of silently — surfacing exactly the same
        // kind of diagnostic CreatedAtAction would have given for free:
        throw new InvalidOperationException(
            $"Could not generate a Location URL for endpoint 'GetProduct' " +
            $"with route values {{ id = {product.Id} }} — check that the " +
            "route template's parameters match what is being supplied.");
    }

    return TypedResults.Created(url, product);
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose an integration test that would catch the silent null-URL bug described in this subtopic BEFORE it reaches production — specifically one that would fail even though the response status code is a perfectly valid 201 Created.',
    hint: 'Consider that the bug this subtopic describes is NOT about the status code at all — it is entirely about a missing or null Location header. What specific header should a test assert on, beyond just checking response.IsSuccessStatusCode?',
    solution: `The key insight: a test checking ONLY the status code (as many tests do,
since 201 Created is the "happy path" outcome developers naturally test
for) would pass even with this bug present — the fix has to explicitly
assert on the Location header's presence and validity:

public class ProductsMinimalApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductsMinimalApiTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task Create_ReturnsLocationHeader_ThatActuallyResolvesToAValidRoute()
    {
        var response = await _client.PostAsJsonAsync("/products",
            new { name = "Widget", price = 9.99m });

        response.EnsureSuccessStatusCode();   // THIS ALONE would NOT
                                                // catch the bug — a 201
                                                // with a missing Location
                                                // header still passes here

        // THIS is the assertion that actually catches the bug: the
        // Location header must be PRESENT (not null) — if
        // GetPathByName returned null and it was passed straight into
        // TypedResults.Created(url, product), the header would be
        // missing or empty here, and this assertion fails:
        Assert.NotNull(response.Headers.Location);

        // Going further, as with the CreatedAtAction integration test in
        // the Controllers subtopics: actually FOLLOW the Location
        // header and confirm it resolves to a real, working GET
        // endpoint — proving the full round trip works, not just that
        // A header exists:
        var followUp = await _client.GetAsync(response.Headers.Location);
        followUp.EnsureSuccessStatusCode();
    }
}

The broader lesson connecting this to the sibling Controllers subtopic
on CreatedAtAction: BOTH URL-generation mechanisms (IUrlHelper for
controllers, LinkGenerator for minimal APIs) share the same underlying
weakness — a route-template change on the TARGET endpoint can silently
break URL generation at any call site referencing it by name, with
NEITHER the C# compiler nor a status-code-only test catching it. The
only difference between the two is HOW LOUDLY they fail: controllers
throw immediately (easy to notice in any test hitting that code path at
all), while minimal APIs fail silently (requiring a test that explicitly
asserts on the Location header, not just the status code, to catch it
at all).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'LinkGenerator.GetPathByName behaves identically to CreatedAtAction/IUrlHelper when route values don\'t satisfy the target endpoint\'s route template.',
      reality: 'IUrlHelper (used by CreatedAtAction) throws InvalidOperationException when route values don\'t match — LinkGenerator.GetPathByName returns null instead, with no exception and no diagnostic at all.',
    },
    {
      thought: 'a test asserting response.EnsureSuccessStatusCode() or checking for 201 Created is sufficient to verify a POST endpoint using WithName() + LinkGenerator works correctly.',
      reality: 'a null URL passed into TypedResults.Created still produces a 201 response with a missing or empty Location header — a test must explicitly assert on response.Headers.Location being non-null to actually catch this bug.',
    },
    {
      thought: 'naming an endpoint with .WithName() creates a compile-time link between that name and the endpoint\'s current route template, so a later route template change would be caught at build time.',
      reality: '.WithName() is purely a runtime string key with no compile-time connection to the route template — changing the target endpoint\'s route parameters (like adding an API version segment) compiles fine everywhere and only fails (silently, via a null return) the first time GetPathByName is actually called at runtime.',
    },
  ];
}
