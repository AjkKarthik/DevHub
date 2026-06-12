import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-caching',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './caching.html',
  styleUrl: './caching.scss',
})
export class AspnetCaching {

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
        'Register with <code>builder.Services.AddMemoryCache()</code>. The cache is stored in the app process — blazing fast (nanosecond reads) but isolated to one server. If you run multiple pods, each has its own cache with potential inconsistencies.',
        'Use <code>GetOrCreateAsync(key, factory)</code> for atomic cache population — the factory runs only if the key is missing. This prevents the "thundering herd" (cache stampede) where dozens of concurrent requests all miss and hammer the database simultaneously.',
        'Cache entries support <strong>absolute expiration</strong> (expire at a fixed time), <strong>sliding expiration</strong> (expire after N minutes of inactivity), and <strong>size limits</strong> (evict LRU entries when the cache is full). Always set a TTL — unbounded caches are memory leaks.',
      ],
    },
    {
      heading: 'IDistributedCache — Shared Cache',
      points: [
        '<code>IDistributedCache</code> is a string/byte[] key-value abstraction backed by Redis, SQL Server, or NCache. Because it is external, all app instances share the same state — critical for horizontal scaling.',
        'Redis (<code>AddStackExchangeRedisCache()</code>) is the standard choice: sub-millisecond latency, rich data structures, pub/sub for cache invalidation, and built-in expiry. SQL Server distributed cache is simpler to operate but slower.',
        'Values must be serialized — use <code>JsonSerializer.SerializeToUtf8Bytes()</code> to write and <code>JsonSerializer.Deserialize()</code> to read. Or use a helper like <code>Microsoft.Extensions.Caching.Hybrid</code> (.NET 9 preview) for a unified API.',
      ],
    },
    {
      heading: 'Output Caching (.NET 7+)',
      points: [
        'Output caching stores complete HTTP responses. Add with <code>builder.Services.AddOutputCache()</code> and <code>app.UseOutputCache()</code>. Apply via the <code>[OutputCache]</code> attribute on a controller action, or <code>.CacheOutput()</code> on a minimal API endpoint.',
        'Unlike response caching (which relies on client Cache-Control headers), output caching is fully server-controlled — the cache is on the server and bypasses client directives. More predictable and easier to reason about.',
        'Invalidate entries by <strong>tag</strong>: tag entries with <code>o.Tags = ["products"]</code> then call <code>cache.EvictByTagAsync("products")</code> when products change — a clean pattern for cache invalidation without knowing all cached URLs.',
      ],
    },
    {
      heading: 'Cache Invalidation Strategies',
      points: [
        '<strong>TTL-based</strong>: entries expire after a fixed time. Simple to implement, but stale window can be a problem for frequently updated data.',
        '<strong>Write-through</strong>: update the cache every time you write to the DB. Keeps cache fresh but adds complexity — cache and DB can diverge on write failure.',
        '<strong>Tag-based eviction</strong>: tag related entries and evict by tag when data changes. Output cache supports this natively; for IMemoryCache, use <code>CancellationChangeToken</code> with <code>ChangeToken.OnChange()</code>.',
        'The hardest problem in distributed caching is race conditions during invalidation. Prefer short TTLs over complex invalidation logic for data that changes unpredictably.',
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
      q: 'What is HybridCache in .NET 9?',
      a: 'Microsoft.Extensions.Caching.Hybrid (introduced in .NET 9 preview) wraps IMemoryCache and IDistributedCache into a single unified API: cache.GetOrCreateAsync("key", factory). It uses the in-process cache as L1 (fast) and the distributed cache as L2 (shared). On a hit in L1, the distributed call is skipped entirely. It also handles stampede prevention and serialization automatically.',
    },
  ];
}
