import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';

@Component({
  selector: 'app-aspnet-output-caching-advanced',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent, BeforeAfterComponent],
  templateUrl: './output-caching-advanced.html',
  styleUrl: './output-caching-advanced.scss',
})
export class AspnetOutputCachingAdvanced {

  prerequisites: Prerequisite[] = [
    { label: 'Caching', route: '/aspnet/caching' },
    { label: 'Middleware Pipeline', route: '/aspnet/middleware' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddOutputCache()',              type: 'method',   desc: 'Registers the output cache services. Call before Build().' },
    { name: 'UseOutputCache()',              type: 'method',   desc: 'Adds the output caching middleware. Must come after UseRouting().' },
    { name: '[OutputCache]',                 type: 'decorator',desc: 'Attribute to apply output caching to a controller action or endpoint.' },
    { name: '.CacheOutput()',                type: 'method',   desc: 'Minimal API extension to apply caching to an endpoint.' },
    { name: 'VaryByQuery(params)',           type: 'method',   desc: 'Creates separate cache entries per unique query string value.' },
    { name: 'VaryByHeader(header)',          type: 'method',   desc: 'Varies cache by a request header (e.g., Accept-Language).' },
    { name: 'VaryByRouteValue(param)',       type: 'method',   desc: 'Varies cache by a route segment value.' },
    { name: '.Tag(tags)',                    type: 'method',   desc: 'Associates cache entries with one or more tags for grouped eviction.' },
    { name: 'IOutputCacheStore.EvictByTagAsync()', type: 'method', desc: 'Invalidates all cache entries associated with a tag.' },
    { name: 'options.AddPolicy(name, b)',    type: 'method',   desc: 'Defines a named cache policy to reuse across endpoints.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Output Cache vs Response Cache',
      points: ['Response caching (AddResponseCaching) relies on HTTP cache headers (Cache-Control) and only caches when the client and proxies cooperate. Output caching (AddOutputCache) is server-side only — it stores the full response in memory regardless of client cache headers, giving full control over what is cached and for how long.'],
    },
    {
      heading: 'Cache Policies',
      points: ['Define named policies in AddOutputCache() using options.AddPolicy("Products", b => b.Expire(TimeSpan.FromMinutes(5)).Tag("products")). Apply a policy with [OutputCache(PolicyName = "Products")] or .CacheOutput("Products") on minimal APIs. Policies encapsulate expiration, vary-by, and tag rules in one reusable unit.'],
    },
    {
      heading: 'Vary-By Rules',
      points: ['By default the cache key is the full URL path. Add VaryByQuery("page", "pageSize") to create separate entries per query string combination. VaryByHeader("Accept-Language") caches per language. VaryByRouteValue("id") is used for parameterised routes. Avoid over-varying as it increases memory usage and reduces hit rates.'],
    },
    {
      heading: 'Cache Tags and Eviction',
      points: ['Tag cache entries with .Tag("products") and call IOutputCacheStore.EvictByTagAsync("products") to invalidate all product-related entries after a write. This solves the stale-data problem in GET-heavy APIs where writes are infrequent. Tags can be applied globally in a policy or per-endpoint.'],
    },
    {
      heading: 'Locking and Stampede Prevention',
      points: ['When a cache entry expires and multiple requests arrive simultaneously, output caching serialises them — the first request populates the cache and the others wait for it. This prevents the thundering herd (cache stampede) problem that would otherwise cause a spike in backend load.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup & Policy',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddOutputCache(options =>
{
    // Default: 60-second expiry
    options.AddBasePolicy(b => b.Expire(TimeSpan.FromSeconds(60)));

    // Named policy for product listings
    options.AddPolicy("Products", b => b
        .Expire(TimeSpan.FromMinutes(5))
        .VaryByQuery("page", "pageSize", "search")
        .Tag("products"));

    // Short policy for static data
    options.AddPolicy("Static", b => b.Expire(TimeSpan.FromHours(1)));
});

app.UseOutputCache();`,
    },
    {
      label: 'Minimal API',
      language: 'csharp',
      code: `// Apply named policy
app.MapGet("/products", (IProductRepo repo) => repo.GetAllAsync())
   .CacheOutput("Products");

// Inline policy with tag
app.MapGet("/categories", (ICategoryRepo repo) => repo.GetAllAsync())
   .CacheOutput(b => b.Expire(TimeSpan.FromMinutes(30)).Tag("categories"));

// No caching for write endpoints
app.MapPost("/products", async (CreateProductRequest req, IProductRepo repo) =>
{
    var product = await repo.CreateAsync(req);
    return TypedResults.Created(\`/products/\${product.Id}\`, product);
})
.WithMetadata(new OutputCacheAttribute { NoStore = true });`,
    },
    {
      label: 'Eviction',
      language: 'csharp',
      code: `app.MapPost("/products", async (
    CreateProductRequest req,
    IProductRepo repo,
    IOutputCacheStore cacheStore,
    CancellationToken ct) =>
{
    var product = await repo.CreateAsync(req);

    // Invalidate all "products"-tagged cache entries
    await cacheStore.EvictByTagAsync("products", ct);

    return TypedResults.Created(\`/products/\${product.Id}\`, product);
});

app.MapDelete("/products/{id:int}", async (
    int id,
    IProductRepo repo,
    IOutputCacheStore cacheStore,
    CancellationToken ct) =>
{
    await repo.DeleteAsync(id);
    await cacheStore.EvictByTagAsync("products", ct);
    return TypedResults.NoContent();
});`,
    },
    {
      label: 'Controller Attribute',
      language: 'csharp',
      code: `[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [OutputCache(PolicyName = "Products")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1)
        => Ok(await _repo.GetPageAsync(page));

    [HttpGet("{id:int}")]
    [OutputCache(Duration = 120, VaryByRouteValueNames = new[] { "id" })]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _repo.FindAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [OutputCache(NoStore = true)]
    public async Task<IActionResult> Create(CreateProductRequest req) { /* ... */ }
}`,
    },
    {
      label: 'Custom Cache Key',
      language: 'csharp',
      code: `public class UserScopedCachePolicy : IOutputCachePolicy
{
    public ValueTask CacheRequestAsync(OutputCacheContext ctx, CancellationToken ct)
    {
        ctx.EnableOutputCaching = true;
        ctx.ResponseExpirationTimeSpan = TimeSpan.FromMinutes(10);
        // Vary per authenticated user
        var userId = ctx.HttpContext.User.FindFirst("sub")?.Value ?? "anon";
        ctx.CacheVaryByValues.Add("user", userId);
        return ValueTask.CompletedTask;
    }

    public ValueTask ServeFromCacheAsync(OutputCacheContext ctx, CancellationToken ct)
        => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext ctx, CancellationToken ct)
        => ValueTask.CompletedTask;
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Response Cache vs Output Cache',
      before: `// Response caching — client controls caching via Cache-Control
[ResponseCache(Duration = 300)]
public IActionResult GetProducts() => Ok(_products);
// Problem: 'Cache-Control: no-cache' from client bypasses it`,
      after: `// Output caching — always server-controlled
app.MapGet("/products", () => _products)
   .CacheOutput(b => b.Expire(TimeSpan.FromMinutes(5)));
// Client headers cannot bypass server-side storage`,
      note: 'Output caching is immune to client cache-busting headers — the server decides what to cache.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Placing UseOutputCache() before UseRouting()',
      wrong: `app.UseOutputCache();
app.UseRouting();`,
      right: `app.UseRouting();
app.UseOutputCache();`,
      explanation: 'Output caching must come after UseRouting() so it knows which endpoint handles the request and can apply the correct policy.',
    },
    {
      title: 'Caching POST/PUT/DELETE endpoints',
      wrong: `app.MapPost("/products", Handler).CacheOutput();`,
      right: `app.MapPost("/products", Handler); // no cache
// Evict on writes: await cacheStore.EvictByTagAsync("products", ct);`,
      explanation: 'Caching mutating endpoints returns stale data to subsequent callers. Cache GET endpoints and evict by tag on writes instead.',
    },
    {
      title: 'Forgetting to tag entries before trying to evict',
      wrong: `app.MapGet("/products", Handler).CacheOutput();
// Later: await cacheStore.EvictByTagAsync("products", ct); // no-op`,
      right: `app.MapGet("/products", Handler).CacheOutput(b => b.Tag("products"));
// Eviction now works
await cacheStore.EvictByTagAsync("products", ct);`,
      explanation: 'EvictByTagAsync only removes entries that were stored with that tag. If no tag was set, eviction silently does nothing.',
    },
    {
      title: 'Over-varying the cache key',
      wrong: `options.AddPolicy("All", b => b.VaryByQuery("*")); // every query param`,
      right: `options.AddPolicy("Products", b => b.VaryByQuery("page", "pageSize", "sort"));`,
      explanation: 'VaryByQuery("*") creates a unique cache entry for every query string combination, destroying cache hit rates. Only vary by params that genuinely change the response.',
    },
  ];

  challenge: Challenge = {
    title: 'Tag-Based Cache Invalidation',
    language: 'csharp',
    description: `Implement output caching for a /categories endpoint with a 10-minute expiry, tagged "categories". Then implement a POST /categories endpoint that creates a category and evicts the cache tag so the next GET returns fresh data.`,
    hints: [
      'Use .CacheOutput(b => b.Expire(...).Tag(...))',
      'Inject IOutputCacheStore and call EvictByTagAsync("categories", ct)',
      'Return TypedResults.Created on the POST',
    ],
    starterCode: `app.MapGet("/categories", (ICategoryRepo repo) => repo.GetAllAsync());
// TODO: add caching

app.MapPost("/categories", async (CreateCategoryRequest req, ICategoryRepo repo) =>
{
    // TODO: create category and evict cache
});`,
    solution: `app.MapGet("/categories", (ICategoryRepo repo) => repo.GetAllAsync())
   .CacheOutput(b => b.Expire(TimeSpan.FromMinutes(10)).Tag("categories"));

app.MapPost("/categories", async (
    CreateCategoryRequest req,
    ICategoryRepo repo,
    IOutputCacheStore store,
    CancellationToken ct) =>
{
    var cat = await repo.CreateAsync(req);
    await store.EvictByTagAsync("categories", ct);
    return TypedResults.Created(\`/categories/\${cat.Id}\`, cat);
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of output caching over response caching?',
      options: [
        'It works with HTTP proxies and CDNs',
        'It is server-controlled and immune to client cache-busting headers',
        'It stores responses in a distributed cache by default',
        'It compresses responses automatically',
      ],
      answer: 1,
      explanation: 'Output caching is fully server-side — clients cannot bypass it with Cache-Control: no-cache headers, unlike response caching.',
    },
    {
      q: 'What method evicts all cache entries associated with a tag?',
      options: ['RemoveAsync()', 'ClearAsync()', 'EvictByTagAsync()', 'InvalidateAsync()'],
      answer: 2,
      explanation: 'IOutputCacheStore.EvictByTagAsync(tag, ct) removes all cache entries stored with that tag.',
    },
    {
      q: 'What happens if multiple requests arrive when a cache entry has just expired?',
      options: [
        'All requests hit the backend simultaneously',
        'The first request populates the cache while others wait',
        'A 503 is returned until the cache is populated',
        'The stale entry is served until the first request completes',
      ],
      answer: 1,
      explanation: 'Output caching serialises requests on a cache miss — the first request fills the cache while concurrent requests wait, preventing a thundering herd.',
    },
    {
      q: 'Which call adds a separate cache entry per "page" query parameter?',
      options: ['VaryByHeader("page")', 'VaryByRouteValue("page")', 'VaryByQuery("page")', 'VaryByParam("page")'],
      answer: 2,
      explanation: 'VaryByQuery specifies which query string parameters should be part of the cache key.',
    },
    {
      q: 'What must you do before calling EvictByTagAsync("products") to make it work?',
      options: [
        'Register the tag in AddOutputCache() options',
        'Call UseOutputCache() before UseRouting()',
        'Tag the cached endpoints with .Tag("products")',
        'Add output caching middleware twice',
      ],
      answer: 2,
      explanation: 'Cache entries must be tagged at storage time with .Tag("products"). Without a tag on the endpoint, eviction is a no-op.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does output caching work with authentication?',
      a: 'By default, ASP.NET Core output caching does not cache authenticated requests (requests with Authorization headers). You can change this by implementing a custom IOutputCachePolicy that opts in authenticated responses, typically varying the cache key by user identity.',
    },
    {
      q: 'Can I use Redis as a backing store for output cache?',
      a: 'Yes. Install Microsoft.AspNetCore.OutputCaching.StackExchangeRedis and call builder.Services.AddStackExchangeRedisOutputCache(options => { options.Configuration = "..."; }). This enables distributed output caching across multiple server instances.',
    },
    {
      q: 'What is the difference between .Expire() and Duration in [OutputCache]?',
      a: '.Expire(TimeSpan) is the policy-builder API for programmatic configuration. Duration in the [OutputCache] attribute is the equivalent declarative approach in seconds. Both control how long a response is stored before it is considered stale.',
    },
    {
      q: 'How do I disable output caching for a specific endpoint when a base policy is active?',
      a: 'Use .CacheOutput(b => b.NoStore()) on the endpoint or add [OutputCache(NoStore = true)] on the controller action. This explicitly opts the endpoint out of caching even when a base policy is configured.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Output caching stores full HTTP responses server-side with named policies, vary-by rules, and tag-based eviction — immune to client cache headers.',
    mustKnow: [
      'AddOutputCache() + UseOutputCache() — must come after UseRouting()',
      'Named policies: options.AddPolicy("Name", b => b.Expire().VaryByQuery().Tag())',
      'Apply with .CacheOutput("PolicyName") or [OutputCache(PolicyName = "...")]',
      'Tags: store with .Tag("name"), evict with IOutputCacheStore.EvictByTagAsync()',
      'Never cache POST/PUT/DELETE — only cache GETs and evict on writes',
      'Output cache is server-side; response cache depends on client Cache-Control',
    ],
    interviewFocus: [
      'Output caching vs response caching — who controls it and why it matters',
      'How cache stampede (thundering herd) is prevented by output caching',
      'Tag-based eviction pattern for invalidating related cache entries on writes',
      'Distributed output caching with Redis for multi-instance deployments',
    ],
  };
}
