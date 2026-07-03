import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-caching',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './caching.html',
  styleUrl: './caching.scss',
})
export class AspnetCaching {

  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    { label: 'Middleware',           route: '/aspnet/middleware' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'IMemoryCache',              type: 'interface', desc: 'In-process cache — fast, single-server only' },
    { name: 'GetOrCreateAsync()',        type: 'method',    desc: 'Atomic get-or-populate — prevents cache stampede for the same key' },
    { name: 'IDistributedCache',         type: 'interface', desc: 'Shared cache abstraction — works with Redis, SQL Server, NCache' },
    { name: 'AddStackExchangeRedisCache()', type: 'method', desc: 'Register Redis as the IDistributedCache implementation' },
    { name: 'UseResponseCaching()',      type: 'method',    desc: 'Middleware: caches HTTP responses based on Cache-Control headers' },
    { name: 'AddOutputCache()',          type: 'method',    desc: '.NET 7+ output cache — simpler, more control than response caching' },
    { name: '[OutputCache]',             type: 'decorator', desc: 'Attribute to apply output cache policy to a controller action or endpoint' },
    { name: 'CacheEntryOptions',         type: 'class',     desc: 'Configure TTL: AbsoluteExpiration, SlidingExpiration, Priority' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'IMemoryCache — In-Process Cache',
      points: [
        'Register with <code>builder.Services.AddMemoryCache()</code>. Cache data lives in the app process heap — reads are nanosecond-fast (no serialization, no network) but the cache is isolated to one server. Each pod in a multi-pod deployment has its own independent cache, which can serve inconsistent data.',
        'Use <code>GetOrCreateAsync(key, factory)</code> for atomic cache population — the factory runs only if the key is missing. Without atomicity, concurrent cache misses all invoke the factory simultaneously (thundering herd / cache stampede), hammering the database with N identical queries.',
        'Cache entries support <strong>absolute expiration</strong> (expire at a fixed wall-clock time, e.g., 5 minutes from now), <strong>sliding expiration</strong> (reset TTL on each access), and <strong>size limits</strong> (set <code>SizeLimit</code> and call <code>entry.SetSize()</code> on each entry — the cache evicts LRU entries when full). Always set an expiration — unbounded caches grow until OOM.',
        'Combine absolute and sliding expiration: <code>SetAbsoluteExpiration(TimeSpan.FromHours(1))</code> + <code>SetSlidingExpiration(TimeSpan.FromMinutes(10))</code>. The entry expires at whichever comes first — absolute caps the max lifetime while sliding keeps frequently accessed entries alive.',
        'Cache entry priority controls eviction order when memory is low: <code>CacheItemPriority.High</code> is evicted last, <code>NeverRemove</code> is only evicted by explicit removal. Default is <code>Normal</code>. Use <code>NeverRemove</code> sparingly — it prevents memory pressure relief.',
        'Post-eviction callbacks (<code>entry.RegisterPostEvictionCallback()</code>) fire when an entry is evicted. Use to log evictions for observability, reload critical data back into cache, or clean up associated resources when a cached item expires.',
      ],
    },
    {
      heading: 'IDistributedCache — Shared Cache',
      points: [
        '<code>IDistributedCache</code> is a byte[]-keyed abstraction backed by Redis, SQL Server, or NCache. Because it is external to the process, all app instances share the same state — essential for horizontal scaling where per-pod caches would diverge.',
        'Redis (<code>AddStackExchangeRedisCache()</code>) is the production standard: sub-millisecond latency, server-side expiry, atomic operations (INCR, SETNX), pub/sub for invalidation fanout, and Lua scripting for custom atomic logic. SQL Server distributed cache is simpler to operate but adds DB load.',
        'Values must be serialized to bytes: use <code>JsonSerializer.SerializeToUtf8Bytes(obj)</code> to write and <code>JsonSerializer.Deserialize&lt;T&gt;(bytes)</code> to read. Centralize this in a typed cache wrapper to avoid scattered serialization code and to unit test serialization separately.',
        'IDistributedCache has no built-in stampede protection. Implement it with a Redis lock: <code>SETNX cache:lock:key 1 EX 10</code> (set if not exists, expire in 10s) before populating the cache. Only the request that acquired the lock populates the entry; others poll or return stale data.',
        'Use <code>DistributedCacheEntryOptions</code> with <code>AbsoluteExpirationRelativeToNow</code> for TTL. Redis handles expiry server-side — you do not need a background job to clean up. The key is physically deleted after expiry, freeing memory automatically.',
        'HybridCache (.NET 9, <code>Microsoft.Extensions.Caching.Hybrid</code>): wraps IMemoryCache (L1) and IDistributedCache (L2) into one API. On L1 hit, no Redis call is made. On L1 miss, checks Redis; on L2 hit, populates L1. On both miss, calls the factory. Stampede protection is built in.',
      ],
    },
    {
      heading: 'Output Caching (.NET 7+)',
      points: [
        'Output caching stores complete serialized HTTP responses on the server. Register with <code>AddOutputCache()</code> and <code>UseOutputCache()</code>. Apply with <code>.CacheOutput("policyName")</code> on minimal API endpoints or <code>[OutputCache(PolicyName = "...")]</code> on controller actions.',
        'Unlike response caching (client-controlled via Cache-Control headers), output caching is fully server-controlled — the cached response is served regardless of what the client\'s Cache-Control header requests. More predictable in APIs where clients should not control caching behaviour.',
        'Vary the cache by query string, route values, headers, or custom values: <code>builder.SetVaryByQuery("page", "pageSize")</code> creates separate cache entries for each unique combination. This is critical — caching without vary-by would serve one user\'s filtered results to another.',
        'Tag-based eviction: tag entries with <code>.Tag("products")</code> and call <code>IOutputCacheStore.EvictByTagAsync("products", ct)</code> when data changes. This invalidates all cached responses with that tag without knowing the exact cached URLs — a clean alternative to TTL expiry for data-driven invalidation.',
        'Output caching does NOT cache authenticated responses by default — it only caches responses that do not set <code>Authorization</code> cookies or headers. To cache per-user responses, implement a custom <code>IOutputCachePolicy</code> that varies the cache key by user ID.',
        'The default output cache store is in-memory. For multi-pod deployments, install a distributed store: <code>AddOutputCache(opts => opts.AddRedis(...))</code> with <code>Microsoft.AspNetCore.OutputCaching.StackExchangeRedis</code> so all pods share the cached response and evictions propagate.',
      ],
    },
    {
      heading: 'Cache Invalidation Strategies',
      points: [
        '<strong>TTL-based (passive expiry)</strong>: entries expire after a fixed time. Simplest to implement — no invalidation logic required. Suitable for data that can tolerate a brief stale window (config, catalogs, reference data). The stale window is the trade-off.',
        '<strong>Write-invalidate (active eviction)</strong>: remove the cache key immediately after a successful write to the DB. Next read misses and repopulates. The risk: a brief cache miss window after the delete where concurrent reads all hit the DB (mini-stampede). Mitigate with a lock or short delay before invalidating.',
        '<strong>Write-through</strong>: update both the cache and the DB atomically on every write. Keeps cache always fresh but doubles write complexity. A write failure leaves cache and DB inconsistent — wrap in a transaction or use an outbox pattern for reliability.',
        '<strong>Tag-based eviction</strong>: for output caching, tag responses with logical names and call <code>EvictByTagAsync()</code> on write. For IMemoryCache, use <code>CancellationChangeToken</code>: create a <code>CancellationTokenSource</code> per group, link it to entries via <code>entry.AddExpirationToken()</code>, and cancel the token to evict the group.',
        '<strong>Event-driven invalidation</strong>: in a distributed system, publish a "ProductUpdated" event to a message bus (MassTransit, Azure Service Bus). Each pod subscribes and evicts the relevant cache key. Decouples writers from invalidators — no direct dependency between services.',
        'Phil Karlton\'s law: "There are only two hard things in Computer Science: cache invalidation and naming things." Practical rule: prefer short TTLs (seconds to minutes) over complex invalidation for data that changes often. Reserve complex invalidation for data that is expensive to compute or must be immediately consistent.',
      ],
    },
    {
      heading: 'Caching Pitfalls and Production Patterns',
      points: [
        'Never cache without a key strategy. Keys must be unique per distinct cache-able unit: include all parameters that affect the result (<code>products:{category}:{page}:{pageSize}</code>). Missing a parameter causes one user\'s results to overwrite another\'s — a data leak in multi-tenant or personalized systems.',
        'Cache stampede under load: when a popular entry expires, all concurrent requests miss simultaneously and all hit the DB. Mitigate with probabilistic early expiry (refresh before expiry when remaining TTL < threshold), background refresh (preemptively refresh on a background task), or distributed locks (SETNX in Redis).',
        'Never cache sensitive or user-specific data in a shared cache key. Auth tokens, personal data, and permission sets must be keyed by user ID. Using a shared key (e.g., just the URL) leaks user A\'s data to user B. For output caching, explicitly vary by the authenticated user\'s identifier.',
        'Watch for memory pressure in IMemoryCache: set <code>SizeLimit</code> and <code>entry.SetSize()</code>. Without a size limit, the cache grows unboundedly until the GC applies pressure or OOM. In high-throughput scenarios, a large in-memory cache can also introduce significant GC pause time.',
        'Redis connection resilience: use <code>ConfigurationOptions.AbortOnConnectFail = false</code> and configure a retry policy. If Redis is unavailable, decide whether to fail hard (refuse requests) or fail soft (serve uncached from the DB). Fail soft is usually correct for non-critical caches; fail hard for session stores.',
        'Measure cache effectiveness with metrics: hit rate, miss rate, eviction count, key count, and memory usage. A hit rate below 70% suggests either the TTL is too short, keys are too specific, or the cache is being evicted too quickly. Use ASP.NET Core metrics (<code>dotnet-counters</code>) or Prometheus to track these in production.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'IMemoryCache',
      language: 'csharp',
      code: `builder.Services.AddMemoryCache(opts =>
{
    opts.SizeLimit     = 1000;       // max 1000 "units" (you define unit size)
    opts.CompactionPercentage = 0.2; // evict 20% when limit reached
});

public class ProductService(IMemoryCache cache, AppDbContext db)
{
    public async Task<Product?> GetAsync(int id, CancellationToken ct)
        => await cache.GetOrCreateAsync(\`product:\${id}\`, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
            entry.SetSize(1);             // counts toward SizeLimit
            entry.SetPriority(CacheItemPriority.Normal);
            return await db.Products.AsNoTracking()
                           .FirstOrDefaultAsync(p => p.Id == id, ct);
        });

    public void Invalidate(int id) => cache.Remove(\`product:\${id}\`);
}`,
    },
    {
      label: 'IDistributedCache (Redis)',
      language: 'csharp',
      code: `// NuGet: Microsoft.Extensions.Caching.StackExchangeRedis
builder.Services.AddStackExchangeRedisCache(opts =>
{
    opts.Configuration         = builder.Configuration["Redis:Connection"];
    opts.InstanceName          = "myapp:";   // key prefix
});

public class ProductService(IDistributedCache cache, AppDbContext db)
{
    private static readonly DistributedCacheEntryOptions Opts = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    };

    public async Task<Product?> GetAsync(int id, CancellationToken ct)
    {
        var key   = \`products:\${id}\`;
        var bytes = await cache.GetAsync(key, ct);
        if (bytes is not null)
            return JsonSerializer.Deserialize<Product>(bytes);

        var product = await db.Products.AsNoTracking()
                              .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is not null)
            await cache.SetAsync(key,
                JsonSerializer.SerializeToUtf8Bytes(product), Opts, ct);

        return product;
    }

    public Task InvalidateAsync(int id, CancellationToken ct)
        => cache.RemoveAsync(\`products:\${id}\`, ct);
}`,
    },
    {
      label: 'Output Caching (.NET 7+)',
      language: 'csharp',
      code: `// Registration
builder.Services.AddOutputCache(opts =>
{
    opts.AddBasePolicy(b => b.Expire(TimeSpan.FromSeconds(30)));
    opts.AddPolicy("products", b =>
        b.Expire(TimeSpan.FromMinutes(5))
         .Tag("products")
         .SetVaryByQuery("page", "pageSize"));
});
app.UseOutputCache();

// Minimal API
app.MapGet("/products", async (AppDbContext db) =>
    await db.Products.AsNoTracking().ToListAsync())
    .CacheOutput("products");

// Controller
[HttpGet]
[OutputCache(PolicyName = "products")]
public async Task<IActionResult> GetProducts() => Ok(await _service.ListAsync());

// Invalidate by tag when data changes
app.MapPost("/products", async (
    Product p, AppDbContext db, IOutputCacheStore store, CancellationToken ct) =>
{
    db.Products.Add(p);
    await db.SaveChangesAsync(ct);
    await store.EvictByTagAsync("products", ct);   // clear the cache
    return Results.Created(\`/products/\${p.Id}\`, p);
});`,
    },
    {
      label: 'Response Caching',
      language: 'csharp',
      code: `// Response caching — respects Cache-Control headers
builder.Services.AddResponseCaching();
app.UseResponseCaching();

// Controller action — sets Cache-Control: public, max-age=60
[HttpGet]
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
public async Task<IActionResult> GetPublicData()
    => Ok(await _service.GetAsync());

// No-cache for authenticated endpoints
[HttpGet("private")]
[ResponseCache(NoStore = true)]
public IActionResult Private() => Ok("user-specific");

// Note: response caching is client-controlled (Cache-Control header).
// Use output caching (.NET 7+) for full server-side control.`,
    },
    {
      label: 'Cache-Aside Pattern',
      language: 'csharp',
      code: `// Cache-aside: app manages cache explicitly (read-through + write invalidate)
public class CatalogService(IMemoryCache cache, ICatalogRepository repo)
{
    private const string AllProductsKey = "catalog:all";

    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct)
        => await cache.GetOrCreateAsync(AllProductsKey, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(2));
            return await repo.GetAllAsync(ct) as IReadOnlyList<Product>;
        }) ?? [];

    public async Task CreateAsync(Product product, CancellationToken ct)
    {
        await repo.CreateAsync(product, ct);
        cache.Remove(AllProductsKey);      // invalidate on write
    }

    public async Task UpdateAsync(Product product, CancellationToken ct)
    {
        await repo.UpdateAsync(product, ct);
        cache.Remove(AllProductsKey);      // invalidate on write
        cache.Remove(\`catalog:\${product.Id}\`);
    }
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Cached Weather Service',
    language: 'csharp',
    description: 'Build a weather API with layered caching. Requirements: (1) GET /weather/{city} — fetches weather from a slow IWeatherProvider (simulated with Task.Delay). (2) Cache results in IMemoryCache for 5 minutes. (3) Add an endpoint GET /weather/{city}/fresh that bypasses the cache (forces a refresh and repopulates it). (4) Add cache eviction: DELETE /weather/{city}/cache removes the entry. Log a message to ILogger when a cache HIT vs MISS occurs.',
    hints: [
      'GetOrCreateAsync for the cached endpoint, cache.TryGetValue for the fresh endpoint',
      'ILogger<T> injection — log "Cache HIT" vs "Cache MISS" at Information level',
      'cache.Remove(key) for the DELETE endpoint',
      'Simulate slow provider: await Task.Delay(1500, ct) in IWeatherProvider',
    ],
    starterCode: `builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IWeatherProvider, SlowWeatherProvider>();
builder.Services.AddScoped<WeatherService>();

var app = builder.Build();

// TODO: GET /weather/{city} — cached 5 min
// TODO: GET /weather/{city}/fresh — bypass cache, repopulate
// TODO: DELETE /weather/{city}/cache — evict entry

app.Run();

public interface IWeatherProvider
{
    Task<WeatherData> GetAsync(string city, CancellationToken ct);
}
public record WeatherData(string City, double TempC, string Condition);

// TODO: SlowWeatherProvider — simulate delay + return fake data`,
    solution: `builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IWeatherProvider, SlowWeatherProvider>();

var app = builder.Build();

app.MapGet("/weather/{city}", async (
    string city, IMemoryCache cache, IWeatherProvider provider,
    ILogger<Program> log, CancellationToken ct) =>
{
    var key  = \`weather:\${city.ToLower()}\`;
    var data = await cache.GetOrCreateAsync(key, async entry =>
    {
        log.LogInformation("Cache MISS for {City}", city);
        entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
        return await provider.GetAsync(city, ct);
    });
    log.LogInformation("Cache HIT for {City}", city);
    return Results.Ok(data);
});

app.MapGet("/weather/{city}/fresh", async (
    string city, IMemoryCache cache, IWeatherProvider provider,
    ILogger<Program> log, CancellationToken ct) =>
{
    log.LogInformation("Forced refresh for {City}", city);
    var data = await provider.GetAsync(city, ct);
    cache.Set(\`weather:\${city.ToLower()}\`, data,
        new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
        });
    return Results.Ok(data);
});

app.MapDelete("/weather/{city}/cache", (string city, IMemoryCache cache) =>
{
    cache.Remove(\`weather:\${city.ToLower()}\`);
    return Results.NoContent();
});

app.Run();

public interface IWeatherProvider
{
    Task<WeatherData> GetAsync(string city, CancellationToken ct);
}

public record WeatherData(string City, double TempC, string Condition);

public class SlowWeatherProvider : IWeatherProvider
{
    private static readonly string[] Conditions = ["Sunny", "Cloudy", "Rainy", "Windy"];
    private static readonly Random   Rng        = new();

    public async Task<WeatherData> GetAsync(string city, CancellationToken ct)
    {
        await Task.Delay(1500, ct);   // simulate slow external call
        return new WeatherData(city,
            Math.Round(Rng.NextDouble() * 30 + 5, 1),
            Conditions[Rng.Next(Conditions.Length)]);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key advantage of IDistributedCache over IMemoryCache?',
      options: [
        'IDistributedCache is faster',
        'IDistributedCache is shared across multiple app instances — essential for horizontal scaling',
        'IDistributedCache supports sliding expiration; IMemoryCache does not',
        'IDistributedCache is built into ASP.NET Core with no extra packages',
      ],
      answer: 1,
      explanation: 'IMemoryCache is in-process — each server pod has its own isolated cache. IDistributedCache (backed by Redis, SQL Server, etc.) is external and shared — all pods read and write the same data. Critical in multi-instance deployments.',
    },
    {
      q: 'What problem does GetOrCreateAsync() prevent?',
      options: [
        'Cache key collisions',
        'Cache stampede — multiple concurrent cache misses all hitting the database simultaneously',
        'Memory leaks from unbounded cache growth',
        'Stale data from expired entries',
      ],
      answer: 1,
      explanation: 'Without atomic get-or-create, a cold cache under load means dozens of requests all miss and all invoke the factory concurrently. GetOrCreateAsync() serializes the factory for the same key — only one call populates the entry, others wait for the result.',
    },
    {
      q: 'How does output caching differ from response caching?',
      options: [
        'Output caching is client-controlled; response caching is server-controlled',
        'Output caching is server-controlled and supports tag-based eviction; response caching relies on Cache-Control headers',
        'They are identical — output caching is just a newer name',
        'Response caching works with Redis; output caching is in-memory only',
      ],
      answer: 1,
      explanation: 'Response caching stores and serves responses based on Cache-Control headers from clients — clients can bypass it. Output caching (.NET 7+) is fully server-controlled: the server decides what to cache and for how long, regardless of client headers. It also supports tag-based eviction.',
    },
    {
      q: 'What is the difference between AbsoluteExpiration and SlidingExpiration?',
      options: [
        'AbsoluteExpiration resets on access; SlidingExpiration does not',
        'AbsoluteExpiration expires at a fixed time regardless of access; SlidingExpiration resets on each access',
        'They are equivalent — use either',
        'AbsoluteExpiration is only for IDistributedCache',
      ],
      answer: 1,
      explanation: 'AbsoluteExpiration expires the entry at a fixed clock time — e.g., in exactly 5 minutes regardless of whether it was read. SlidingExpiration resets the TTL on each access — entry stays alive as long as it is being used within the sliding window. You can combine both: absolute caps the total lifetime.',
    },
    {
      q: 'What is the cache-aside pattern?',
      options: [
        'The cache automatically reads from the DB on a miss',
        'The application reads the cache first; on a miss it loads from the source and populates the cache itself',
        'Data is written to cache only, not to the database',
        'The cache is populated at startup and never invalidated',
      ],
      answer: 1,
      explanation: 'Cache-aside (lazy loading): check the cache → miss → load from DB → write to cache → return. The application controls cache reads and writes explicitly. On writes, the app either updates the cache (write-through) or invalidates the key (write-invalidate). It is the most common pattern for application-level caching.',
    },
    {
      q: 'What happens if you cache a response in output cache without configuring vary-by parameters?',
      options: [
        'Nothing — output cache always varies by URL automatically',
        'All users receive the same cached response, potentially leaking one user\'s personalized data to another',
        'Output cache throws an exception if vary-by is missing',
        'Only the first user\'s request is cached; subsequent requests bypass the cache',
      ],
      answer: 1,
      explanation: 'Output caching uses the request path and query string by default. If a response is personalized (by user, role, or query params not in the vary-by list), the first user\'s response is served to all subsequent callers with the same cache key. Always configure SetVaryByQuery, SetVaryByHeader, or SetVaryByValue for personalized content.',
    },
    {
      q: 'What is the main risk of write-through caching?',
      options: [
        'It is slower than write-invalidate',
        'If the cache write fails after the DB write, they are inconsistent — the cache has stale data',
        'Write-through is not supported by IDistributedCache',
        'Write-through prevents concurrent reads during the write',
      ],
      answer: 1,
      explanation: 'Write-through updates both the DB and cache on every write. If the DB write succeeds but the cache write fails (Redis timeout, serialization error), the DB has the new value but the cache still has the old one — returning stale data until TTL expiry. Wrap both in a retry or use write-invalidate (simpler: just delete the key on write).',
    },
    {
      q: 'What does HybridCache (.NET 9) offer over using IMemoryCache and IDistributedCache separately?',
      options: [
        'HybridCache replaces both; IMemoryCache and IDistributedCache are deprecated',
        'A single API combining in-process L1 and distributed L2 with built-in stampede protection and automatic serialization',
        'HybridCache only works with Redis, not SQL Server',
        'HybridCache stores data in both caches redundantly — no eviction ever needed',
      ],
      answer: 1,
      explanation: 'HybridCache (Microsoft.Extensions.Caching.Hybrid) presents one GetOrCreateAsync() API that checks L1 (IMemoryCache) first, then L2 (IDistributedCache), then calls the factory. It handles serialization, TTL propagation, and stampede prevention automatically — removing the boilerplate of manually layering two cache tiers.',
    },
    {
      q: 'You have IMemoryCache with SizeLimit = 1000 but never call entry.SetSize(). What happens?',
      options: [
        'Each entry is counted as size 1 automatically',
        'The size limit is ignored — entries can grow unboundedly',
        'An InvalidOperationException is thrown on SetSize-less entries',
        'The cache resets to zero on every request',
      ],
      answer: 1,
      explanation: 'If SizeLimit is set but individual entries do not call SetSize(), the size tracking does not work — the cache cannot enforce the limit and grows without bound. You must call entry.SetSize(n) on every entry when SizeLimit is configured, otherwise the limit is effectively disabled.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use IMemoryCache vs IDistributedCache?',
      a: 'Use IMemoryCache for: single-server deployments, data that is cheap to recompute per server (e.g., config, static lookups), and scenarios where the extra latency of Redis is not acceptable. Use IDistributedCache for: any multi-server (scaled-out) deployment where cache consistency across pods matters, session state, and data that is expensive to reload (external API calls, heavy DB queries).',
    },
    {
      q: 'How do I prevent serving stale data after a database write?',
      a: 'Three strategies: (1) Write-invalidate: remove the cache key when you update the DB — next read will miss and repopulate. (2) Write-through: update both the DB and cache on every write — keeps them in sync but adds write complexity. (3) Short TTL: accept a brief stale window (e.g., 30s) and let entries expire naturally. Tag-based output cache eviction (EvictByTagAsync) is the cleanest option for HTTP-level caching.',
    },
    {
      q: 'Can I cache database query results and still have them invalidated when data changes?',
      a: 'Yes, using write-invalidate: after SaveChangesAsync(), remove the affected cache keys. A cleaner approach is EF Core\'s interceptors — hook into SaveChanges to detect which entities changed and invalidate related keys automatically. For distributed cache, use a Redis pub/sub channel: the writing instance publishes "invalidate product:42" and all app instances subscribe and evict.',
    },
    {
      q: 'Is it safe to cache authenticated or user-specific data?',
      a: 'Only if you vary the cache key by user identity. Never cache a response keyed only on the URL if the response is user-specific — other users would see incorrect data. For output caching, use SetVaryByHeader("Authorization") or SetVaryByValue(ctx => ctx.User.Identity!.Name). For IMemoryCache, include the user ID in the key: "cart:{userId}".',
    },
    {
      q: 'A value is cached via HybridCache and then updated in the database on one instance of a horizontally-scaled app. That instance calls cache.RemoveAsync(key) to invalidate. Does this actually clear the value from OTHER instances\' local L1 in-memory caches, or only from the shared L2?',
      a: 'HybridCache addresses this directly with a tag/broadcast invalidation mechanism specifically because naive removal would only clear the calling instance\'s own L1 and the shared L2 (IDistributedCache) — other instances\' local L1 in-memory copies would otherwise keep serving the stale value until their own TTL expires, since nothing tells THEM to evict it. HybridCache solves this by publishing an invalidation signal (backed by the distributed cache\'s pub/sub-like mechanism where supported, e.g. Redis) that other instances subscribe to, so a RemoveAsync/RemoveByTagAsync call on one instance propagates and evicts the corresponding L1 entries on all other instances too — this cross-instance L1 invalidation is one of the concrete problems HybridCache solves that manually combining IMemoryCache + IDistributedCache does not handle automatically.',
    },
    {
      q: 'How do I implement cache-group invalidation with IMemoryCache (without output caching)?',
      a: 'Use a <code>CancellationTokenSource</code> as a shared expiration token. Create one CTS per logical group (e.g., per product category). When creating entries, call <code>entry.AddExpirationToken(new CancellationChangeToken(cts.Token))</code>. To invalidate the group, call <code>cts.Cancel()</code> — all entries linked to that token are immediately evicted. Create a new CTS for the group after cancelling so future entries can be linked to it.',
    },
    {
      q: 'How does Redis server-side expiry work vs application-managed TTL?',
      a: 'When you call <code>cache.SetAsync(key, bytes, options, ct)</code> with <code>AbsoluteExpirationRelativeToNow</code>, the .NET client sends a Redis <code>SET key value EX seconds</code> command. Redis itself tracks the expiry and physically deletes the key when it expires — no background job or cleanup needed in your app. The key simply stops existing after TTL. This is more reliable than application-managed TTL because Redis enforces it even if the app restarts.',
    },
    {
      q: 'What metrics should I track to evaluate cache health in production?',
      a: '<ul><li><strong>Hit rate</strong>: hits / (hits + misses) — target 70%+. Below this, TTL may be too short or keys too specific.</li><li><strong>Miss rate</strong>: inverse — high misses increase DB load.</li><li><strong>Eviction count</strong>: high evictions mean SizeLimit is too small or TTL is too long.</li><li><strong>Entry count and memory usage</strong>: watch for unbounded growth.</li><li><strong>Redis command latency</strong>: P99 latency spikes indicate connection pool saturation or Redis node pressure.</li></ul>Use <code>dotnet-counters</code>, ASP.NET Core built-in meters, or Prometheus + Grafana.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using IMemoryCache in a multi-pod deployment without a distributed cache',
      wrong: `// Works fine on a single server
// In a 3-pod Kubernetes deployment: each pod has its own cache
// Pod A serves cached product list; Pod B and C have a miss — they query the DB again
// After an update on Pod A, Pods B and C still serve stale data from their caches
builder.Services.AddMemoryCache();`,
      right: `// Use IDistributedCache (Redis) for shared state across pods
builder.Services.AddStackExchangeRedisCache(opts =>
{
    opts.Configuration = config["Redis:Connection"];
    opts.InstanceName  = "myapp:";
});
// Or use HybridCache (.NET 9) for L1 (in-process) + L2 (Redis) automatically`,
      explanation: 'IMemoryCache is per-process. In a multi-pod deployment, each pod maintains an independent cache — cache invalidation on one pod does not propagate to others. Use IDistributedCache (Redis) for shared cache state across pods.',
    },
    {
      title: 'Not calling entry.SetSize() when SizeLimit is configured',
      wrong: `builder.Services.AddMemoryCache(opts => opts.SizeLimit = 500);

// Later in service:
cache.GetOrCreateAsync("products", async entry =>
{
    entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
    // No SetSize() call — SizeLimit is effectively disabled!
    return await db.Products.ToListAsync();
});`,
      right: `cache.GetOrCreateAsync("products", async entry =>
{
    entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
    entry.SetSize(1);  // Each entry counts as 1 unit toward SizeLimit = 500
    return await db.Products.ToListAsync();
});`,
      explanation: 'When SizeLimit is set on MemoryCacheOptions, every entry must call SetSize(). Without it, the cache cannot track usage against the limit and will grow unboundedly — defeating the purpose of setting SizeLimit. The documentation is easy to miss.',
    },
    {
      title: 'Caching user-specific data without user-scoped keys',
      wrong: `// Cached with only the URL — first user's result served to everyone!
app.MapGet("/cart", async (IMemoryCache cache, ICartService svc) =>
    await cache.GetOrCreateAsync("cart", async entry =>
    {
        entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
        return await svc.GetCartAsync();   // user-specific data!
    }));`,
      right: `app.MapGet("/cart", async (
    IMemoryCache cache, ICartService svc, ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
    return await cache.GetOrCreateAsync(\`cart:\${userId}\`, async entry =>
    {
        entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
        return await svc.GetCartAsync(userId);
    });
});`,
      explanation: 'A cache key without user context means the first user\'s data populates the cache and every subsequent user receives the same data — a data leak in authenticated APIs. Always include the user ID or tenant ID in keys for user-specific or tenant-specific data.',
    },
    {
      title: 'Not setting any expiration on cache entries',
      wrong: `// Entry never expires — grows forever until the process restarts
cache.Set("config", LoadConfig());
// After a config change, the cache returns stale data indefinitely`,
      right: `cache.Set("config", LoadConfig(), new MemoryCacheEntryOptions
{
    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    Priority = CacheItemPriority.High,
});
// Or tie it to a IChangeToken from IConfiguration for automatic reload`,
      explanation: 'Cache entries without expiration persist until the app restarts or explicit removal. This is a memory leak for data that grows over time, and means stale data after source changes. Always set an expiration — even for "static" data, a long TTL (hours) is safer than none.',
    },
    {
      title: 'Using response caching on authenticated endpoints',
      wrong: `[HttpGet("profile")]
[Authorize]
[ResponseCache(Duration = 60)]  // Caches the first user's profile for all!
public async Task<IActionResult> GetProfile()
    => Ok(await _userService.GetCurrentUserAsync());`,
      right: `// Output cache with vary-by user identity
app.MapGet("/profile", async (ClaimsPrincipal user, IUserService svc) =>
    await svc.GetProfileAsync(user.FindFirstValue(ClaimTypes.NameIdentifier)!))
    .CacheOutput(b => b
        .SetVaryByValue(ctx => ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!)
        .Expire(TimeSpan.FromMinutes(5)));`,
      explanation: 'Response caching on an authenticated endpoint without vary-by user caches the first authenticated user\'s response and serves it to all subsequent users — a serious data confidentiality bug. Use output caching with SetVaryByValue() keyed to the user ID, or avoid caching personalized responses entirely.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core caching has three layers: IMemoryCache (fast, in-process), IDistributedCache/Redis (shared across pods), and Output Cache (full HTTP response caching with tag invalidation).',
    mustKnow: [
      '<code>IMemoryCache</code>: in-process, fast, but per-pod — not shared across Kubernetes pods',
      '<code>GetOrCreateAsync()</code>: atomic get-or-populate — prevents thundering herd on cache miss',
      '<code>IDistributedCache</code> + Redis: shared across all pods; values must be serialized to bytes',
      'Output caching (.NET 7+): server-controlled, tag-based eviction with <code>EvictByTagAsync()</code>',
      'Cache keys must include all parameters that vary the result (user ID, page, filters) — missing one causes data leaks',
      'Always set expiration — entries without TTL are memory leaks',
      'HybridCache (.NET 9): L1 (in-process) + L2 (Redis) in one API with built-in stampede protection',
    ],
    interviewFocus: [
      'IMemoryCache vs IDistributedCache — when to use each and the multi-pod problem',
      'Cache stampede: what it is and how GetOrCreateAsync() (or a Redis lock) prevents it',
      'Cache invalidation strategies: TTL, write-invalidate, write-through, tag-based eviction',
      'Output caching vs response caching — server-controlled vs client-controlled',
    ],
  };
}
