import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-createdataction-runtime-throw-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './createdataction-throws-runtime-despite-nameof-safety.html',
  styleUrl: './createdataction-throws-runtime-despite-nameof-safety.scss',
})
export class CreatedatactionThrowsRuntimeDespiteNameofSafetySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page calls CreatedAtAction "refactor-safe" because it uses nameof() instead of a hardcoded URL — but nameof() only guarantees the METHOD NAME compiles, not that the ROUTE will actually generate',
      points: [
        'The main Controllers &amp; Actions page\'s "Using string URL in CreatedAtAction" mistake explains that <code>CreatedAtAction(nameof(GetById), ...)</code> is safer than a hardcoded URL string because it "automatically follows route renames and remains correct after refactoring." This is true for ONE specific kind of refactor — renaming the C# method itself, which <code>nameof()</code> catches at compile time. It is NOT true for a broader class of refactors: changing the TARGET ACTION\'s route template so that it now requires MORE route values than the ones supplied in the <code>routeValues</code> anonymous object.',
      ],
    },
    {
      heading: 'CreatedAtAction resolves the target URL via the route table at RUNTIME, using IUrlHelper — if the supplied routeValues don\'t satisfy every required route parameter of the target action, it throws InvalidOperationException the first time that code path actually executes',
      points: [
        'If a target action\'s route template changes from <code>[HttpGet("{id:int}")]</code> to something requiring an additional segment — e.g., adding API versioning as <code>[HttpGet("v{version}/{id:int}")]</code> — every existing <code>CreatedAtAction(nameof(GetById), new { id = product.Id }, product)</code> call site that used to work now fails to generate a URL, because the <code>routeValues</code> object no longer supplies a value for the new <code>version</code> route parameter. <code>nameof(GetById)</code> STILL COMPILES CLEANLY (the method itself was not renamed or removed) — the failure only surfaces the first time that specific POST action actually executes and <code>CreatedAtAction</code> tries to resolve the URL through <code>IUrlHelper</code>, throwing <code>InvalidOperationException: "No route matches the supplied values."</code> at runtime.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A route-template change on the TARGET action silently breaks an existing CreatedAtAction call — compiles fine, fails at runtime',
      language: 'csharp',
      code: `// BEFORE: this compiles AND works correctly.
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int}")]
    public ActionResult<Product> GetById(int id) => /* ... */;

    [HttpPost]
    public ActionResult<Product> Create(CreateProductDto dto)
    {
        var product = _service.Create(dto);
        // nameof(GetById) compiles cleanly, and the route values
        // ('id') satisfy GetById's ONLY route parameter — this
        // resolves correctly to "/api/products/{id}":
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }
}

// AFTER a version-prefix refactor on GetById's route template —
// nameof(GetById) STILL COMPILES, since the method itself was not
// renamed or removed:
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // The route template changed to REQUIRE an extra 'version' segment:
    [HttpGet("v{version}/{id:int}")]
    public ActionResult<Product> GetById(string version, int id) => /* ... */;

    [HttpPost]
    public ActionResult<Product> Create(CreateProductDto dto)
    {
        var product = _service.Create(dto);
        // THIS LINE WAS NEVER TOUCHED — it still compiles, since
        // nameof(GetById) only checks that the METHOD exists.
        // But at RUNTIME, IUrlHelper tries to resolve
        // "/api/products/v{version}/{id}" using ONLY the supplied
        // { id = product.Id } — with no 'version' value at all:
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        // THROWS: InvalidOperationException: "No route matches the
        // supplied values." — the very first time a POST request
        // actually reaches this line after the refactor ships.
    }
}`,
    },
    {
      label: 'The fix — routeValues must be updated in lockstep with the target action\'s route template, and a test can catch a mismatch before production',
      language: 'csharp',
      code: `[HttpPost]
public ActionResult<Product> Create(CreateProductDto dto)
{
    var product = _service.Create(dto);
    // FIXED: routeValues now supplies EVERY route parameter GetById's
    // CURRENT route template actually requires:
    return CreatedAtAction(nameof(GetById),
        new { version = "1", id = product.Id }, product);
}

// A DEDICATED TEST that would have caught this the moment the route
// template changed — by actually exercising the full HTTP pipeline
// rather than trusting that a compile-clean nameof() call is sufficient:
public class ProductsControllerIntegrationTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductsControllerIntegrationTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task Create_ReturnsLocationHeader_ThatActuallyResolvesToAValidRoute()
    {
        var response = await _client.PostAsJsonAsync("/api/products",
            new { name = "Widget", price = 9.99m });

        // This assertion ALONE proves CreatedAtAction succeeded without
        // throwing — if the routeValues didn't satisfy the target
        // action's route template, this request would have returned a
        // 500 Internal Server Error instead of 201 Created, since the
        // InvalidOperationException from IUrlHelper propagates as an
        // unhandled exception:
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // Going further: actually FOLLOW the returned Location header
        // and confirm it resolves to a real, working GET endpoint —
        // proving the full round trip, not just that CreatedAtAction
        // didn't throw:
        var location = response.Headers.Location;
        Assert.NotNull(location);

        var followUp = await _client.GetAsync(location);
        followUp.EnsureSuccessStatusCode();
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that this failure only surfaces at RUNTIME (via an unhandled InvalidOperationException on the very first request that hits the affected code path), propose a way to catch this class of bug in CI — before it ever reaches a real request in production — without needing to individually remember every CreatedAtAction call site across a large codebase.',
    hint: 'Consider that this subtopic\'s own fix already includes an integration test using WebApplicationFactory — what would make that KIND of test scale to catch this bug automatically across many controllers, rather than requiring a developer to think of it for each new endpoint?',
    solution: `The most scalable answer: a SINGLE integration test suite that exercises
every POST/PUT action returning CreatedAtAction across the ENTIRE API
surface — not by manually writing one test per endpoint, but by
reflecting over all ControllerBase-derived types, finding actions
decorated with [HttpPost] that return a 201-producing type, and
constructing a minimal valid request body for each one automatically
(or, more practically, maintaining a smaller curated list of "smoke
test" requests that are run against EVERY POST endpoint on every CI run,
even if some request bodies need to be hand-crafted per endpoint).

The core testing principle that generalizes here: relying on nameof()
alone provides ZERO protection against this class of bug, precisely
because the compiler check and the runtime route-resolution check are
COMPLETELY INDEPENDENT of each other — nameof() only validates that a
C# identifier resolves to a real method; IUrlHelper's route resolution
only happens at request time, using the actual registered route table.
There is no way to make the compiler catch this, since route templates
are configured via attributes at RUNTIME reflection/startup, not
statically analyzable by the C# compiler in the way nameof() is.

Given that gap can never be closed at compile time, the practical answer
is CI coverage: ANY CreatedAtAction call site is a candidate for this
specific bug the moment the referenced action's route template changes
— which means the safety net has to be "a request actually got made and
a 201 (not a 500) came back," not "the code compiled." A minimal but
effective policy: any controller action using CreatedAtAction gets AT
LEAST one integration test in the suite that actually invokes it over
HTTP and asserts on the resulting status code — exactly the pattern this
subtopic's second code tab already demonstrates, just applied
consistently across the whole controller surface rather than only where
someone happened to think of it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'nameof(GetById) inside CreatedAtAction guarantees the generated Location URL will always be valid, since the compiler verifies the referenced method exists.',
      reality: 'nameof() only guarantees the METHOD NAME resolves at compile time — it says nothing about whether the routeValues object supplies every route parameter the target action\'s CURRENT route template actually requires, which is resolved separately at runtime via IUrlHelper.',
    },
    {
      thought: 'a route template change on one action (like adding a version segment) is a localized change that cannot affect unrelated code elsewhere in the same controller.',
      reality: 'every CreatedAtAction call site anywhere in the codebase that references the changed action by name is silently at risk — the reference still compiles cleanly, but the runtime route-value resolution fails the moment the routeValues no longer match the updated route template.',
    },
    {
      thought: 'this class of bug would be caught by ordinary unit tests that call controller actions directly as C# methods.',
      reality: 'a direct method call never exercises IUrlHelper\'s actual route-table resolution — this failure only manifests when CreatedAtAction genuinely tries to generate a URL against the REAL registered routes, which requires an integration test with a running host (e.g. WebApplicationFactory), not a plain unit test.',
    },
  ];
}
