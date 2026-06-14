import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-csharp-whats-new-latest',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './whats-new-latest.html',
  styleUrl: './whats-new-latest.scss',
})
export class CsharpWhatsNewLatest {

  quickRef: QuickRefItem[] = [
    { name: 'params ReadOnlySpan<T>',     type: 'keyword',    desc: 'C# 13. params now works with Span<T> and ReadOnlySpan<T> — zero allocation variadic methods for hot paths.', since: 'C# 13' },
    { name: 'new Lock type',              type: 'class',      desc: 'C# 13. System.Threading.Lock replaces object-based locking. Use lock (myLock) or myLock.EnterScope() for safer, more explicit locking.', since: 'C# 13' },
    { name: 'allows ref struct',          type: 'constraint', desc: 'C# 13. Generic type constraint that permits ref struct types (like Span<T>) as type arguments.', since: 'C# 13' },
    { name: 'ref/unsafe in async',        type: 'syntax',     desc: 'C# 13. ref locals and unsafe code can now appear in async methods and iterators (in non-async segments).', since: 'C# 13' },
    { name: 'field keyword',              type: 'keyword',    desc: 'C# 13. Inside a property accessor, "field" refers to the compiler-generated backing field, eliminating manual private field declarations.', since: 'C# 13' },
    { name: 'CountBy()',                  type: 'method',     desc: '.NET 9 LINQ. Groups elements and returns (key, count) pairs. More efficient than GroupBy(...).Select(g => (g.Key, g.Count())).', since: '.NET 9' },
    { name: 'AggregateBy()',              type: 'method',     desc: '.NET 9 LINQ. Aggregates values by key without creating intermediate groups. Like GroupBy + Aggregate in one pass.', since: '.NET 9' },
    { name: 'Index()',                    type: 'method',     desc: '.NET 9 LINQ. Returns (index, element) tuples — equivalent to Select((x, i) => (i, x)) but more readable.', since: '.NET 9' },
    { name: 'TimeProvider',               type: 'class',      desc: '.NET 8+. Abstraction over system time. Inject in services; use FakeTimeProvider in tests. Replaces DateTime.UtcNow coupling.', since: '.NET 8' },
    { name: 'HybridCache',                type: 'class',      desc: '.NET 9. Combines IMemoryCache (L1) and IDistributedCache (L2) with stampede protection and tag-based invalidation.', since: '.NET 9' },
    { name: 'extension members (C# 14)',  type: 'syntax',     desc: 'C# 14 preview. Extension blocks can declare both instance and static extension members, including properties and operators.', since: 'C# 14' },
    { name: 'partial properties (C# 14)', type: 'keyword',    desc: 'C# 14. Property declarations can be split across partial class files, enabling source-generator-driven property bodies.', since: 'C# 14' },
    { name: 'AVX-512 / SIMD',             type: 'type',       desc: '.NET 9/10. New Vector512<T> and AVX-512 intrinsics for hardware-accelerated SIMD operations on 512-bit registers.', since: '.NET 9' },
    { name: 'FrozenDictionary<K,V>',      type: 'class',      desc: '.NET 8. Read-only dictionary optimised for lookup speed. Build once at startup with .ToFrozenDictionary(), then read many times.', since: '.NET 8' },
    { name: 'Microsoft.Extensions.Resilience', type: 'class', desc: '.NET 8+. Built-in Polly-backed resilience pipelines via AddResilienceHandler() — retry, circuit-breaker, rate-limit, timeout.', since: '.NET 8' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# 13 — params spans and the Lock type',
      points: [
        '<code>params ReadOnlySpan&lt;T&gt;</code> enables zero-allocation variadic methods. Unlike <code>params T[]</code> which always allocates a heap array, span-based params use stack allocation for small argument counts — critical for serialisation and logging hot paths.',
        'The new <code>System.Threading.Lock</code> type provides more explicit, safer locking than the legacy <code>lock (object)</code> pattern. The compiler generates optimised enter/exit code when used with the <code>lock</code> statement, and <code>Lock.EnterScope()</code> returns a <code>ref struct</code> that releases automatically via <code>using</code>.',
        'The <code>field</code> keyword inside a property accessor refers to the compiler-generated backing field for that specific property. This eliminates the noise of a separate private field declaration when you only want to intercept get/set for validation or change notification.',
        '<code>allows ref struct</code> lifts the restriction that previously prevented <code>Span&lt;T&gt;</code> and other ref structs from being used as generic type arguments. Generics that need to operate on stack-only types can now declare this constraint explicitly.',
        '<code>ref</code> locals and <code>unsafe</code> code can now appear in <code>async</code> methods and iterators, as long as they are not used across an <code>await</code> or <code>yield</code> boundary. This removes a blanket restriction that previously forced developers to split methods unnecessarily.',
      ],
    },
    {
      heading: '.NET 9/10 — LINQ additions',
      points: [
        '<code>CountBy(keySelector)</code> counts elements per key in a single streaming pass and returns <code>IEnumerable&lt;KeyValuePair&lt;TKey, int&gt;&gt;</code>. It is more efficient than <code>GroupBy(…).Select(g =&gt; (g.Key, g.Count()))</code> because it never buffers element sequences — only running counts.',
        '<code>AggregateBy(keySelector, seed, accumulator)</code> performs a keyed aggregation in one pass without materialising intermediate groups. Ideal for summing, averaging, or accumulating values per group where you only need the final aggregate and not the individual elements.',
        '<code>Index()</code> returns <code>(int Index, T Item)</code> pairs for every element, replacing the verbose <code>.Select((x, i) =&gt; (i, x))</code> idiom with a clear, intention-revealing method call.',
        '<code>Order()</code> and <code>OrderDescending()</code> sort without a key selector, for sequences of comparable types. They replace <code>OrderBy(x =&gt; x)</code> / <code>OrderByDescending(x =&gt; x)</code> with a more readable form.',
        '<code>ToFrozenDictionary()</code> and <code>ToFrozenSet()</code> (introduced in .NET 8) produce immutable, read-optimised collections. Once built, lookups are 20–30% faster than <code>Dictionary&lt;K,V&gt;</code> due to a more cache-friendly internal structure. Build once at startup; read indefinitely.',
      ],
    },
    {
      heading: '.NET 9/10 — performance and JSON improvements',
      points: [
        'Dynamic PGO (Profile-Guided Optimisation) is on by default since .NET 8. The JIT observes actual runtime behaviour — which branches are taken, which interface implementations are used — and re-JITs hot methods with optimised code. Typical workloads see 10–30% throughput improvements with no code changes.',
        '<code>System.Text.Json</code> source generators produce AOT-compatible, reflection-free serialisers at compile time. Annotate a partial <code>JsonSerializerContext</code> subclass with <code>[JsonSerializable(typeof(T))]</code> and the compiler generates optimised read/write code for each type.',
        '<code>TimeProvider</code> (introduced in .NET 8, widely adopted in 9/10) abstracts over <code>DateTime.UtcNow</code> and timer creation. Inject <code>TimeProvider.System</code> in production and <code>FakeTimeProvider</code> in tests for deterministic time control without <code>Thread.Sleep</code>.',
        '<code>System.IO.Pipelines</code> enables zero-copy, high-throughput I/O by exposing memory-efficient <code>PipeReader</code>/<code>PipeWriter</code> APIs. Combined with <code>IAsyncEnumerable&lt;T&gt;</code>, they power ASP.NET Core\'s Kestrel server internals and HTTP/2 streaming.',
        'AVX-512 hardware intrinsics (<code>System.Runtime.Intrinsics.X86.Avx512F</code>) and <code>Vector512&lt;T&gt;</code> are available in .NET 9/10, enabling 512-bit SIMD parallelism on supported CPUs. The BCL uses these automatically for <code>Array.Sort</code>, string search, and numeric operations.',
      ],
    },
    {
      heading: '.NET 9/10 — HybridCache, resilience, and cloud-native',
      points: [
        '<code>HybridCache</code> (<code>Microsoft.Extensions.Caching.Hybrid</code>, .NET 9) combines an L1 in-process memory cache with an L2 distributed cache (e.g., Redis). It has built-in stampede protection: multiple requests for the same cold key coalesce into one back-end call.',
        'Tag-based cache invalidation lets you attach string tags to cache entries and later call <code>cache.RemoveByTagAsync("user-123")</code> to evict all entries for that user across all app instances — without knowing the individual cache keys.',
        '<code>Microsoft.Extensions.Resilience</code> ships Polly 8 policies (retry, circuit breaker, hedging, rate-limit, timeout) as first-class DI extensions. Call <code>AddResilienceHandler("my-pipeline")</code> on an <code>HttpClient</code> or any named service to wire up resilience declaratively.',
        '.NET Aspire provides an opinionated, cloud-native application model: service discovery, health checks, structured logging, OpenTelemetry traces and metrics, and a local dashboard — all wired up with minimal code via the Aspire App Host project.',
        '<code>System.Diagnostics.Metrics</code> improvements in .NET 9/10 include: <code>Gauge&lt;T&gt;</code> instrument, better histogram bucket customisation, and the <code>IMeterFactory</code> for test isolation. These integrate directly with OpenTelemetry and the .NET Aspire dashboard.',
      ],
    },
    {
      heading: 'C# 14 preview — extension members and partial properties',
      points: [
        'C# 14 introduces <strong>extension blocks</strong> (<code>extension(string s) { … }</code>): a new syntax that groups extension methods and extension properties for a type in a single block, replacing the static-class-with-static-methods workaround.',
        'Extension properties allow you to add computed properties to types you don\'t own: <code>extension(string s) { public bool IsEmail =&gt; s.Contains(\'@\'); }</code>. Previously impossible without wrapper classes.',
        'Static extension members let you add factory or utility methods that call as <code>DateTime.FromUnixSeconds(ts)</code> rather than <code>DateTimeExtensions.FromUnixSeconds(ts)</code> — preserving the natural noun–verb call syntax.',
        '<strong>Partial properties</strong> (C# 14) split a property declaration across files: the declaring half in one partial class file, the implementation half in another. Source generators use this to inject property bodies (e.g., for <code>INotifyPropertyChanged</code>) without needing to generate the full class.',
        'The direction of C# 14 reflects a broad theme: closing gaps where the type system forced workarounds (static extensions, partial methods/properties, ref struct constraints) so that framework code and source-generated code can be expressed as clearly as hand-written application code.',
      ],
    },
    {
      heading: 'Tracking the evolution — what these releases mean for everyday .NET code',
      points: [
        'The performance story is increasingly zero-allocation: <code>params ReadOnlySpan&lt;T&gt;</code>, <code>FrozenDictionary</code>, <code>u8</code> literals, inline arrays, and source-generated JSON all move work to compile time or eliminate heap allocations entirely. Write idiomatic code and the runtime/compiler delivers the performance.',
        'Testability is now a first-class language/runtime concern: <code>TimeProvider</code> for time, <code>IMeterFactory</code> for metrics isolation, <code>FakeTimeProvider</code>, and <code>IResiliencePipelineProvider</code> for resilience testing — all injectable, all fake-able, no static coupling to platform APIs.',
        'The ecosystem is converging around OpenTelemetry: traces, metrics, and logs via <code>System.Diagnostics</code> APIs wired to any OTLP endpoint. Writing a new service means adding two lines to your DI setup, not integrating a third-party observability library.',
        'AOT-readiness is now the default goal: source-generated JSON, source-generated regex, <code>[LibraryImport]</code> P/Invoke, and interceptors all push reflection usage out of the critical path. New code should be written AOT-compatible by default in libraries intended for broad distribution.',
        'The cadence is annual (.NET 9 in Nov 2024, .NET 10 LTS in Nov 2025, C# 13 with .NET 9, C# 14 with .NET 10). LTS versions (even numbers: .NET 8, 10, 12) receive 3-year support. New projects should target the current LTS unless you need a cutting-edge feature from the latest STS release.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'C# 13 Features',
      language: 'csharp',
      code: `// ── 1. params ReadOnlySpan<T> — zero allocation ──────────────────
// Old: params T[] allocates a heap array on every call
static int SumOld(params int[] values)
{
    int total = 0;
    foreach (var v in values) total += v;
    return total;
}

// New: params ReadOnlySpan<T> — stack-allocated for small counts
static int Sum(params ReadOnlySpan<int> values)
{
    int total = 0;
    foreach (var v in values) total += v;
    return total;
}

Console.WriteLine(Sum(1, 2, 3, 4, 5));   // 15 — no heap allocation

// ── 2. The new Lock type ──────────────────────────────────────────
using System.Threading;

private readonly Lock _lock = new();

void SafeIncrement(ref int counter)
{
    lock (_lock)                    // works with lock statement
        counter++;
}

void SafeAppend(List<string> list, string item)
{
    using (_lock.EnterScope())      // auto-released on dispose
        list.Add(item);
}

// ── 3. field keyword in property accessors ────────────────────────
public class Temperature
{
    // No separate _celsius field needed!
    public double Celsius
    {
        get => field;
        set
        {
            if (value < -273.15)
                throw new ArgumentOutOfRangeException(nameof(value),
                    "Cannot be below absolute zero");
            field = value;   // "field" = the auto-generated backing field
        }
    }

    public double Fahrenheit => Celsius * 9 / 5 + 32;
}

// ── 4. allows ref struct constraint ───────────────────────────────
static void Process<T>(T value) where T : allows ref struct
{
    // T can now be Span<int>, ReadOnlySpan<char>, etc.
    Console.WriteLine(value?.ToString());
}

Process(new Span<int>([1, 2, 3]));   // works — Span<T> is a ref struct`,
    },
    {
      label: '.NET 9 LINQ',
      language: 'csharp',
      code: `// ── 1. CountBy ───────────────────────────────────────────────────
string[] words = ["apple", "banana", "avocado", "blueberry", "cherry", "apricot"];

foreach (var (letter, count) in words.CountBy(w => w[0]))
    Console.WriteLine(\$"{letter}: {count}");
// a: 3, b: 2, c: 1

// ── 2. AggregateBy ────────────────────────────────────────────────
var orders = new[]
{
    (CustomerId: 1, Amount: 100m),
    (CustomerId: 2, Amount:  50m),
    (CustomerId: 1, Amount: 200m),
    (CustomerId: 3, Amount:  75m),
    (CustomerId: 2, Amount: 125m),
};

var totals = orders.AggregateBy(
    keySelector: o => o.CustomerId,
    seed:        0m,
    func:       (total, o) => total + o.Amount);

foreach (var (customerId, total) in totals)
    Console.WriteLine(\$"Customer {customerId}: \${total}");
// Customer 1: $300, Customer 2: $175, Customer 3: $75

// ── 3. Index() ────────────────────────────────────────────────────
string[] fruits = ["apple", "banana", "cherry"];

foreach (var (index, fruit) in fruits.Index())
    Console.WriteLine(\$"[{index}] {fruit}");
// [0] apple, [1] banana, [2] cherry

// ── 4. Order() and OrderDescending() ─────────────────────────────
int[] nums = [5, 2, 8, 1, 9, 3];

var ascending  = nums.Order().ToArray();           // [1,2,3,5,8,9]
var descending = nums.OrderDescending().ToArray(); // [9,8,5,3,2,1]

// Old pattern (still works):
// nums.OrderBy(x => x)

// ── 5. FrozenDictionary / FrozenSet ──────────────────────────────
// Build once at startup — optimised for read-heavy workloads
var config = new Dictionary<string, string>
{
    ["db"]    = "localhost:5432",
    ["cache"] = "localhost:6379",
}.ToFrozenDictionary();

bool hasDb   = config.ContainsKey("db");       // ~20-30% faster than Dictionary

var validRoles = new[] { "admin", "editor", "viewer" }.ToFrozenSet();
bool isAdmin = validRoles.Contains("admin");   // fast O(1) membership test`,
    },
    {
      label: 'TimeProvider & JSON',
      language: 'csharp',
      code: `// ── 1. TimeProvider abstraction ──────────────────────────────────
// Production code — inject TimeProvider (replaces DateTime.UtcNow coupling)
public class OrderExpiryService(TimeProvider time)
{
    public bool IsExpired(Order order, TimeSpan ttl)
        => time.GetUtcNow() - order.CreatedAt > ttl;

    public async Task WaitForExpiryAsync(Order order, TimeSpan ttl, CancellationToken ct)
    {
        var remaining = ttl - (time.GetUtcNow() - order.CreatedAt);
        if (remaining > TimeSpan.Zero)
            await Task.Delay(remaining, time, ct);  // uses TimeProvider's timer
    }
}

// Register in DI:
// builder.Services.AddSingleton(TimeProvider.System);

// In tests — control time deterministically (Microsoft.Extensions.Time.Testing):
// var fakeTime = new FakeTimeProvider(DateTimeOffset.UtcNow);
// fakeTime.Advance(TimeSpan.FromHours(25));  // fast-forward without sleeping

// ── 2. System.Text.Json source generators ─────────────────────────
// Zero-reflection, AOT-compatible, faster serialisation
[System.Text.Json.Serialization.JsonSerializable(typeof(UserDto))]
[System.Text.Json.Serialization.JsonSerializable(typeof(List<UserDto>))]
public partial class AppJsonContext
    : System.Text.Json.Serialization.JsonSerializerContext { }

public record UserDto(int Id, string Name, string Email);

// Use the generated context — no reflection at runtime:
string json = System.Text.Json.JsonSerializer.Serialize(
    new UserDto(1, "Alice", "alice@example.com"),
    AppJsonContext.Default.UserDto);

UserDto? user = System.Text.Json.JsonSerializer.Deserialize(
    json,
    AppJsonContext.Default.UserDto);

// ── 3. System.IO.Pipelines — high-throughput I/O ─────────────────
using System.IO.Pipelines;

async Task ParseLinesAsync(Stream stream, CancellationToken ct)
{
    var reader = PipeReader.Create(stream);
    while (true)
    {
        var result = await reader.ReadAsync(ct);
        var buffer = result.Buffer;
        foreach (var segment in buffer)
            ProcessSegment(segment.Span);   // zero-copy processing
        reader.AdvanceTo(buffer.End);
        if (result.IsCompleted) break;
    }
    await reader.CompleteAsync();
}

static void ProcessSegment(ReadOnlySpan<byte> data)
    => Console.WriteLine(\$"Segment: {data.Length} bytes");`,
    },
    {
      label: 'HybridCache & Resilience',
      language: 'csharp',
      code: `// ── 1. HybridCache (.NET 9) ──────────────────────────────────────
// Combines L1 (in-process memory) + L2 (distributed, e.g. Redis)
// with stampede protection and tag-based invalidation

// Register (in Program.cs / DI):
// builder.Services.AddHybridCache();
// builder.Services.AddStackExchangeRedisCache(opts =>
//     opts.Configuration = connectionString);  // optional L2

public class ProductService(HybridCache cache, IProductRepository repo)
{
    public async Task<Product?> GetProductAsync(int id, CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(
            key:     \$"product-{id}",
            factory: async cancel => await repo.GetByIdAsync(id, cancel),
            options: new() { Expiration = TimeSpan.FromMinutes(5) },
            tags:    [\$"product-{id}", "products"],
            cancellationToken: ct);
    }

    public async Task InvalidateProductAsync(int id)
    {
        // Evicts all entries tagged "product-42" across all app instances
        await cache.RemoveByTagAsync(\$"product-{id}");
    }
}

// ── 2. Microsoft.Extensions.Resilience ────────────────────────────
// Polly 8 resilience pipelines built into the framework
// builder.Services
//     .AddHttpClient<OrderClient>()
//     .AddResilienceHandler("order-pipeline", builder =>
//     {
//         builder
//             .AddRetry(new HttpRetryStrategyOptions
//             {
//                 MaxRetryAttempts = 3,
//                 Delay = TimeSpan.FromMilliseconds(200),
//                 UseJitter = true,
//             })
//             .AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
//             {
//                 SamplingDuration = TimeSpan.FromSeconds(30),
//                 FailureRatio = 0.5,
//                 MinimumThroughput = 10,
//             })
//             .AddTimeout(TimeSpan.FromSeconds(10));
//     });

// ── 3. System.Diagnostics.Metrics (.NET 9) ─────────────────────────
using System.Diagnostics.Metrics;

// Create a meter and instruments (use IMeterFactory for test isolation)
public class OrderMetrics(IMeterFactory meterFactory)
{
    private readonly Meter _meter = meterFactory.Create("Orders");
    private Counter<int>?  _created;
    private Gauge<int>?    _pendingCount;

    public void RecordOrderCreated()
        => (_created ??= _meter.CreateCounter<int>("orders.created")).Add(1);

    public void SetPendingCount(int count)
        => (_pendingCount ??= _meter.CreateGauge<int>("orders.pending")).Record(count);
}

// ── 4. .NET Aspire (App Host wires everything) ────────────────────
// In AspireAppHost/Program.cs:
// var builder = DistributedApplication.CreateBuilder(args);
// var redis    = builder.AddRedis("redis");
// var api      = builder.AddProject<Projects.MyApi>("api")
//                       .WithReference(redis);
// builder.Build().Run();
//
// The Aspire dashboard at https://localhost:15888 shows:
// traces, logs, metrics, health — no extra configuration needed`,
    },
    {
      label: 'C# 14 Preview',
      language: 'csharp',
      code: `// ─────────────────────────────────────────────────────────────────
// C# 14 (preview) — Extension Members
// ─────────────────────────────────────────────────────────────────

// ── 1. Extension block — instance properties and methods ──────────
// Old style: static class with static methods
public static class StringExtensionsOld
{
    public static bool IsEmail(this string s) => s.Contains('@') && s.Contains('.');
    public static string Truncate(this string s, int max)
        => s.Length <= max ? s : s[..max] + "...";
}

// New style (C# 14): extension block
// extension(string s)
// {
//     public bool   IsEmail               => s.Contains('@') && s.Contains('.');
//     public string Truncate(int max)     => s.Length <= max ? s : s[..max] + "...";
//     public bool   IsNullOrEmpty         => string.IsNullOrEmpty(s);
// }

// ── 2. Static extension members (factory pattern) ─────────────────
// extension(DateTime)
// {
//     public static DateTime FromUnixSeconds(long seconds)
//         => DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime;
//
//     public static DateTime StartOfDay(DateTime dt)
//         => dt.Date;
// }
//
// Usage: DateTime dt = DateTime.FromUnixSeconds(1_700_000_000);
//        -- Reads like a native method, not DateTimeExtensions.Method()

// ── 3. Partial properties (C# 14) ────────────────────────────────
// Declaring file (hand-written class):
// public partial class ViewModel
// {
//     public partial string Name { get; set; }   // signature only
// }
//
// Implementing file (source-generator emits this):
// public partial class ViewModel : INotifyPropertyChanged
// {
//     private string _name = "";
//     public partial string Name
//     {
//         get => _name;
//         set { _name = value; OnPropertyChanged(); }
//     }
// }

// ── 4. field keyword (C# 13) + partial property (C# 14) together ──
public partial class Person
{
    // C# 13: field replaces private backing field
    public string FirstName
    {
        get => field;
        set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
    }

    // C# 14: partial property — body generated elsewhere
    public partial int Age { get; set; }
}

// ── 5. params collections — C# 13 expanded support ────────────────
static void LogAll(params IEnumerable<string> messages)
{
    foreach (var m in messages) Console.WriteLine(m);
}

LogAll("one", "two", "three");                // variadic call
LogAll(new List<string> { "a", "b" });        // collection argument
LogAll(Enumerable.Range(1, 5).Select(i => i.ToString())); // LINQ`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Locking on a new object() each time instead of a shared Lock field',
      wrong: `public class Counter
{
    public int Value { get; private set; }

    public void Increment()
    {
        // BUG: creates a NEW object on every call — no mutual exclusion!
        lock (new object())
        {
            Value++;
        }
    }
}`,
      right: `public class Counter
{
    private readonly Lock _lock = new();  // C# 13 Lock type; or: object _lock = new()
    public int Value { get; private set; }

    public void Increment()
    {
        lock (_lock)   // all callers share the SAME lock object
            Value++;
    }
}`,
      explanation: 'A lock only provides mutual exclusion if all threads contend on the same object. Creating a new object each call means every thread gets its own lock — no thread ever waits for another, so the critical section is not protected at all. Always store the lock target in a readonly field.',
    },
    {
      title: 'Using params ReadOnlySpan<T> in an async method — Span cannot cross await',
      wrong: `// CS4012: Span<T> cannot be used as type argument in an async method
// because Span is a ref struct that cannot be stored on the heap
public static async Task ProcessAsync(params ReadOnlySpan<int> values)
{
    await Task.Delay(100);     // ERROR: span cannot live across an await
    Console.WriteLine(values.Length);
}`,
      right: `// Option 1: use params T[] for async/iterator methods
public static async Task ProcessAsync(params int[] values)
{
    await Task.Delay(100);
    Console.WriteLine(values.Length);
}

// Option 2: copy span to array before the first await
public static async Task ProcessAsync2(ReadOnlySpan<int> values)
{
    int[] copy = values.ToArray();  // copy to heap before await
    await Task.Delay(100);
    Console.WriteLine(copy.Length);
}`,
      explanation: 'Ref structs like Span<T> and ReadOnlySpan<T> must live on the stack and cannot be stored on the heap. async method state machines store local variables on the heap to survive across await points. Therefore, Span<T> cannot be a parameter or local variable in an async method that has an await. Use T[] for async variadic methods, or copy to an array before the first await.',
    },
    {
      title: 'Treating CountBy result as an IGrouping — it returns KeyValuePair, not a group',
      wrong: `string[] words = ["apple", "banana", "avocado"];

// CountBy returns IEnumerable<KeyValuePair<TKey, int>>
// NOT IEnumerable<IGrouping<TKey, string>>
foreach (var group in words.CountBy(w => w[0]))
{
    // CS1061: KeyValuePair<char, int> has no .Key / group enumeration
    foreach (var word in group)   // ERROR — cannot iterate a KeyValuePair
        Console.WriteLine(word);
}`,
      right: `// CountBy only gives you the count — use GroupBy if you need the elements too
foreach (var (letter, count) in words.CountBy(w => w[0]))
    Console.WriteLine(\$"{letter}: {count}");

// When you need the actual words per letter:
foreach (var group in words.GroupBy(w => w[0]))
{
    Console.WriteLine(\$"{group.Key}: {string.Join(", ", group)}");
}`,
      explanation: 'CountBy is purpose-built for counting — it returns (key, count) pairs and never stores the individual elements. If you need to access the elements of each group, use GroupBy which produces IGrouping<TKey, T> with an enumerable sequence of elements per key. Picking the wrong one either loses element access or wastes memory on unnecessary grouping.',
    },
    {
      title: 'Using DateTime.UtcNow directly in service code — breaks test determinism',
      wrong: `public class SessionService
{
    // Static coupling to real clock — tests cannot control time without Thread.Sleep
    public bool IsSessionExpired(Session session)
        => DateTime.UtcNow - session.CreatedAt > TimeSpan.FromHours(1);

    public async Task ExpireInAsync(TimeSpan delay, CancellationToken ct)
        => await Task.Delay(delay, ct);  // real delay — tests are slow
}`,
      right: `// Inject TimeProvider — swap for FakeTimeProvider in tests
public class SessionService(TimeProvider time)
{
    public bool IsSessionExpired(Session session)
        => time.GetUtcNow() - session.CreatedAt > TimeSpan.FromHours(1);

    public async Task ExpireInAsync(TimeSpan delay, CancellationToken ct)
        => await Task.Delay(delay, time, ct);  // time-provider-aware delay
}

// In tests (using Microsoft.Extensions.Time.Testing):
// var fake = new FakeTimeProvider();
// var svc  = new SessionService(fake);
// fake.Advance(TimeSpan.FromHours(2));  // instant — no real sleep
// Assert.True(svc.IsSessionExpired(session));`,
      explanation: 'DateTime.UtcNow is a static ambient dependency — it cannot be substituted in tests, making time-dependent tests either slow (real sleeps), flaky (race conditions), or impossible to write. TimeProvider is the .NET 8+ abstraction for this: FakeTimeProvider lets you advance time programmatically in microseconds. Register TimeProvider.System in your DI container for production.',
    },
    {
      title: 'Assuming FrozenDictionary is mutable after construction',
      wrong: `var lookup = new Dictionary<string, int> { ["a"] = 1 }
    .ToFrozenDictionary();

// FrozenDictionary has NO Add/Remove/TryAdd methods
lookup.Add("b", 2);   // CS1061 — FrozenDictionary<K,V> has no 'Add'
lookup["c"] = 3;      // CS0200 — indexer has no setter`,
      right: `// Build the source dictionary first, then freeze
var source = new Dictionary<string, int>();
source["a"] = 1;
source["b"] = 2;

// Freezing is a terminal operation — the result is forever read-only
var lookup = source.ToFrozenDictionary();

// Now only read operations are available:
bool hasA   = lookup.ContainsKey("a");   // true
int  valA   = lookup["a"];               // 1
// lookup.Add("c", 3);                  // compile error — no Add

// To "update", build a new dictionary and freeze again:
var updated = source
    .Concat([new KeyValuePair<string, int>("c", 3)])
    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
    .ToFrozenDictionary();`,
      explanation: 'FrozenDictionary is permanently read-only — it has no mutation methods. This is by design: immutability allows the optimised internal layout that makes lookups faster. Use it for configuration, code maps, or lookup tables that are built once at startup and never change. If you need to update data at runtime, stick with Dictionary<K,V> or ConcurrentDictionary<K,V>.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the performance benefit of params ReadOnlySpan<T> over params T[] in C# 13?',
      options: [
        'ReadOnlySpan<T> allows more arguments than T[]',
        'params ReadOnlySpan<T> avoids heap allocation for the argument array — arguments are stack-allocated for small counts',
        'ReadOnlySpan<T> enables parallel processing of the variadic arguments',
        'There is no performance difference — it is purely a syntax preference',
      ],
      answer: 1,
      explanation: '<code>params T[]</code> always allocates a new array on the heap, even for a single call with a few arguments. <code>params ReadOnlySpan&lt;T&gt;</code> uses the stack for small argument counts, producing zero GC pressure on hot paths such as tight loops or high-throughput serialisation code.',
    },
    {
      q: 'What does LINQ\'s CountBy() method return and how does it differ from GroupBy?',
      options: [
        'CountBy returns the total count of all elements; GroupBy returns the total count per group',
        'CountBy returns IEnumerable<KeyValuePair<TKey, int>> of (key, count) pairs in a single pass; GroupBy creates intermediate group objects with their full element sequences',
        'They are identical — CountBy is just a convenience alias for GroupBy(...).Count()',
        'CountBy only works on numeric sequences; GroupBy works on any type',
      ],
      answer: 1,
      explanation: '<code>CountBy(keySelector)</code> counts elements per key in a single streaming pass and returns <code>IEnumerable&lt;KeyValuePair&lt;TKey, int&gt;&gt;</code>. <code>GroupBy</code> creates <code>IGrouping&lt;TKey, T&gt;</code> objects that buffer all elements per group in memory, which is more memory-intensive when you only need counts.',
    },
    {
      q: 'Why is TimeProvider preferred over DateTime.UtcNow in .NET 8+ code?',
      options: [
        'TimeProvider is faster than DateTime.UtcNow at runtime',
        'DateTime.UtcNow is deprecated in .NET 8',
        'TimeProvider is an abstraction that can be substituted in tests with FakeTimeProvider, enabling deterministic time-dependent tests without Thread.Sleep or real delays',
        'TimeProvider automatically converts between time zones',
      ],
      answer: 2,
      explanation: '<code>DateTime.UtcNow</code> is a static call that couples your code to real wall-clock time. <code>TimeProvider</code> is an abstract class you can inject: <code>TimeProvider.System</code> in production, <code>FakeTimeProvider</code> in tests. Call <code>fake.Advance(duration)</code> to control time without sleeping, making time-dependent tests fast and deterministic.',
    },
    {
      q: 'What does the C# 14 extension block syntax improve over traditional extension methods?',
      options: [
        'Extension blocks allow extension methods to access private members of the extended type',
        'Extension blocks enable instance extension properties, static extension members, and cleaner grouping — things the old static-class approach could not express',
        'Extension blocks compile to faster code than traditional extension methods',
        'Extension blocks replace interfaces and abstract classes for polymorphism',
      ],
      answer: 1,
      explanation: 'Traditional extension methods (static method with <code>this T param</code>) can only add methods. C# 14 extension blocks add: <strong>extension properties</strong> (<code>public bool IsEmail =&gt; ...</code>), <strong>static extension members</strong> (factory methods on existing types), and cleaner grouping syntax — making language extensibility first-class.',
    },
    {
      q: 'What does the new System.Threading.Lock type in C# 13 provide over using "object" as a lock?',
      options: [
        'Lock allows locking from async methods without blocking the thread',
        'Lock provides a dedicated type with better diagnostics, a disposable EnterScope() pattern, and optimised compiler support compared to locking on a plain object',
        'Lock is slower than object locking but more readable',
        'Lock automatically detects deadlocks at runtime',
      ],
      answer: 1,
      explanation: '<code>System.Threading.Lock</code> is a purpose-built lock type. Benefits: the compiler generates better code for <code>lock (_lock)</code> than for <code>lock (objectRef)</code>; <code>Lock.EnterScope()</code> returns a disposable ref struct for <code>using</code> patterns; tooling (debuggers, analyzers) understands it as a lock object rather than a generic object. The old <code>object</code> lock pattern still works but <code>Lock</code> is preferred in new code.',
    },
    {
      q: 'What does LINQ\'s Index() method return?',
      options: [
        'The index of the first occurrence of each element',
        '(int Index, T Item) pairs for each element — replacing the verbose Select((x, i) => (i, x)) pattern',
        'An ILookup<int, T> indexed by position',
        'The same as ElementAt() — accesses a single element by index',
      ],
      answer: 1,
      explanation: '<code>sequence.Index()</code> returns <code>IEnumerable&lt;(int Index, T Item)&gt;</code> — essentially a named-tuple version of <code>Select((x, i) =&gt; (i, x))</code>. It is clearer at the call site (<code>foreach (var (i, item) in list.Index())</code>) and removes the unusual reversed parameter order of the Select overload.',
    },
    {
      q: 'What problem does HybridCache solve that IMemoryCache and IDistributedCache individually cannot?',
      options: [
        'HybridCache automatically serialises cached objects to JSON',
        'HybridCache combines an L1 in-process cache and L2 distributed cache with stampede protection — preventing multiple cache misses from all hitting the database simultaneously',
        'HybridCache removes the need for a distributed cache like Redis entirely',
        'HybridCache caches database query plans, not application data',
      ],
      answer: 1,
      explanation: '<code>IMemoryCache</code> is per-process (fast, no serialisation, lost on restart). <code>IDistributedCache</code> is shared across instances (slower, requires serialisation). <code>HybridCache</code> combines both as L1+L2 and adds <strong>stampede protection</strong>: when many requests simultaneously miss a cold key, only one back-end call is made and all waiters receive the same result. It also adds tag-based bulk invalidation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is Dynamic PGO and how does it improve .NET 9/10 performance without code changes?',
      a: 'Dynamic Profile-Guided Optimisation (PGO) is on by default since .NET 8. The JIT starts by generating fast-to-compile "tier 0" code. As the application runs, the runtime profiles which methods are hot, which branches are taken most, and which interface implementations are used. The JIT then re-compiles hot methods at "tier 1" using the observed data — inlining, de-virtualising, and branch-optimising based on real runtime behaviour rather than static analysis. Typical workloads see 10–30% throughput improvements with zero code changes. Verify it is active with <code>DOTNET_TieredPGO=1</code> (the default in .NET 8+).',
    },
    {
      q: 'How does AggregateBy differ from GroupBy + Aggregate?',
      a: '<code>GroupBy(keySelector).Select(g =&gt; (g.Key, g.Aggregate(...)))</code> buffers all elements per group in memory before the aggregate step — two passes through the data, O(n) extra memory for intermediate groups.<br><br><code>AggregateBy(keySelector, seed, func)</code> accumulates values per key in a single streaming pass using a dictionary internally. No intermediate group objects are created. For large datasets where counting or summing per group is the bottleneck, <code>AggregateBy</code> reduces both time and peak memory usage.',
    },
    {
      q: 'What is the "field" keyword in C# 13 and when should I use it?',
      a: 'The <code>field</code> keyword inside a property accessor refers to the compiler-generated backing field for that property. Previously, if you wanted to add validation or change-notification logic to a property you had to declare a separate private field (<code>private string _name = "";</code>) alongside the property.<br><br>With <code>field</code>, the property body can access its own backing field directly and the private declaration disappears from your source. Use it whenever you want to intercept get or set (validation, <code>INotifyPropertyChanged</code>, lazy initialisation) without polluting the class with backing-field declarations. It pairs especially well with MVVM patterns.',
    },
    {
      q: 'What are interceptors in C# 12/13 and who are they for?',
      a: 'Interceptors (marked <code>[Experimental]</code>) let a source generator re-route a specific call site — identified by file path and line number — to a different static method at compile time. The call site in your source code looks unchanged; the compiler silently substitutes the generated implementation.<br><br>The primary use case is ASP.NET Core Minimal API source generation: the runtime\'s request delegate generator replaces reflective parameter binding with type-safe, AOT-compatible generated code. This contributes to the startup-time improvements in .NET 8+ web apps.<br><br>Unless you are writing source generators or framework infrastructure code, you will never write interceptors directly. They are a tooling primitive, not a user-facing feature.',
    },
    {
      q: 'When should I use FrozenDictionary vs Dictionary?',
      a: '<strong>FrozenDictionary</strong> is for <em>build-once, read-many</em> scenarios: configuration maps, keyword lookups, HTTP status code tables, country code maps — data that is fully known at startup and never changes. Lookups are 20–30% faster than <code>Dictionary&lt;K,V&gt;</code> because the internal layout is optimised for the specific set of keys at build time. It has no mutation API.<br><br><strong>Dictionary&lt;K,V&gt;</strong> is for mutable, dynamic data: caches that grow, maps that are updated at runtime, any collection where Add/Remove/Update occur after initialisation.<br><br><strong>ConcurrentDictionary&lt;K,V&gt;</strong>: when you need thread-safe mutation. FrozenDictionary is also thread-safe (it is immutable), but ConcurrentDictionary allows concurrent writes.',
    },
    {
      q: 'What is .NET Aspire and do I need it for all .NET projects?',
      a: '.NET Aspire is an opinionated cloud-native application stack: it wires up service discovery, health checks, structured logging, OpenTelemetry traces and metrics, and a local developer dashboard with minimal configuration. You reference service projects and infrastructure (Redis, databases, message buses) in an Aspire AppHost project, and Aspire handles connection strings, environment variables, and port assignment during local development.<br><br>You do NOT need Aspire for all .NET projects. It is most valuable for distributed applications with multiple services — microservices, apps using databases, caches, or message queues where local orchestration was previously done with docker-compose. Small monolithic apps, libraries, and console tools don\'t benefit meaningfully from Aspire.',
    },
    {
      q: 'What does the "allows ref struct" constraint in C# 13 unlock?',
      a: 'Before C# 13, <code>Span&lt;T&gt;</code>, <code>ReadOnlySpan&lt;T&gt;</code>, and other ref struct types could <em>not</em> be used as generic type arguments. This prevented writing generic algorithms (like <code>Process&lt;T&gt;</code>) that could accept either managed types or stack-allocated spans.<br><br><code>allows ref struct</code> is a new constraint (<code>where T : allows ref struct</code>) that opts the type parameter in to accepting ref struct types. The compiler then restricts the type parameter\'s usage within the generic body to operations safe for ref structs (no boxing, no storing in heap-allocated variables).<br><br>This is mainly useful for high-performance library code that needs to work equally well with <code>string</code>, <code>char[]</code>, and <code>ReadOnlySpan&lt;char&gt;</code> without separate overloads.',
    },
  ];

  challenge: Challenge = {
    title: 'LINQ Statistics with .NET 9 operators',
    description: 'Use the new .NET 9 LINQ operators to analyse a collection of sales records. Given a list of SaleRecord(string Region, string Product, decimal Amount), implement SalesAnalyzer: (1) TopProductsByRegion(records) → Dictionary<string, string> returns the best-selling product (by total Amount) for each Region. (2) TransactionCountByRegion(records) → IEnumerable<(string Region, int Count)> uses CountBy to count transactions per Region. (3) IndexedSummary(records) → IEnumerable<string> uses Index() to return strings like "[0] North: Widget $450.00". (4) Use TimeProvider to add a timestamp to each summary line.',
    language: 'csharp',
    hints: [
      'CountBy(r => r.Region) gives transaction counts directly',
      'For TopProductsByRegion, group by (Region, Product) and sum Amount, then pick max per Region',
      'Index() returns (int Index, T Item) — destructure with var (i, item)',
      'Inject TimeProvider and use time.GetUtcNow() for the timestamp',
    ],
    starterCode: `public record SaleRecord(string Region, string Product, decimal Amount);

public class SalesAnalyzer(TimeProvider time)
{
    public Dictionary<string, string> TopProductsByRegion(IEnumerable<SaleRecord> records)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<(string Region, int Count)> TransactionCountByRegion(
        IEnumerable<SaleRecord> records)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<string> IndexedSummary(IEnumerable<SaleRecord> records)
    {
        throw new NotImplementedException();
    }
}`,
    solution: `public record SaleRecord(string Region, string Product, decimal Amount);

public class SalesAnalyzer(TimeProvider time)
{
    public Dictionary<string, string> TopProductsByRegion(IEnumerable<SaleRecord> records)
    {
        return records
            .GroupBy(r => r.Region)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(r => r.Product)
                       .Select(pg => (Product: pg.Key, Total: pg.Sum(r => r.Amount)))
                       .MaxBy(x => x.Total)!.Product);
    }

    public IEnumerable<(string Region, int Count)> TransactionCountByRegion(
        IEnumerable<SaleRecord> records)
    {
        return records
            .CountBy(r => r.Region)
            .Select(kv => (kv.Key, kv.Value));
    }

    public IEnumerable<string> IndexedSummary(IEnumerable<SaleRecord> records)
    {
        var ts = time.GetUtcNow().ToString("HH:mm:ss");
        return records
            .Index()
            .Select(x => \$"[{x.Index}] {x.Item.Region}: {x.Item.Product} \${x.Item.Amount:F2} @ {ts}");
    }
}

// Usage:
var records = new[]
{
    new SaleRecord("North", "Widget",  450m),
    new SaleRecord("North", "Gadget",  200m),
    new SaleRecord("South", "Widget",  300m),
    new SaleRecord("South", "Gadget",  600m),
    new SaleRecord("North", "Widget",  100m),
};

var analyzer = new SalesAnalyzer(TimeProvider.System);

foreach (var (region, product) in analyzer.TopProductsByRegion(records))
    Console.WriteLine(\$"{region}: {product}");
// North: Widget (total 550m), South: Gadget (total 600m)

foreach (var (region, count) in analyzer.TransactionCountByRegion(records))
    Console.WriteLine(\$"{region}: {count} transactions");

foreach (var line in analyzer.IndexedSummary(records))
    Console.WriteLine(line);`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# 13 added params ReadOnlySpan<T>, the Lock type, the field keyword, and allows ref struct; .NET 9 added CountBy/AggregateBy/Index LINQ operators, HybridCache, and built-in resilience; C# 14 previews extension blocks and partial properties.',
    mustKnow: [
      '<code>params ReadOnlySpan&lt;T&gt;</code> is zero-allocation for small argument counts but cannot be used in <code>async</code> methods — Span cannot cross an <code>await</code> boundary',
      '<code>System.Threading.Lock</code> is the C# 13 replacement for locking on <code>object</code>; always store it in a <code>readonly</code> field shared by all threads — never create a new lock object per call',
      '<code>CountBy(key)</code> → (key, count) pairs in one pass; <code>AggregateBy(key, seed, func)</code> → keyed aggregation in one pass; neither buffers element sequences like <code>GroupBy</code> does',
      '<code>TimeProvider</code> is the .NET 8+ injectable time abstraction — use <code>TimeProvider.System</code> in production and <code>FakeTimeProvider</code> in tests for deterministic time control without sleeping',
      '<code>FrozenDictionary</code>/<code>FrozenSet</code>: build once at startup from a mutable dictionary, then read forever — faster lookups than <code>Dictionary</code> but completely immutable (no Add/Remove)',
      '<code>HybridCache</code> (.NET 9) combines L1 in-memory + L2 distributed cache with automatic stampede protection and tag-based bulk invalidation',
      'C# 14 extension blocks add extension <em>properties</em> and <em>static</em> extension members — things the old static-class extension method pattern could not express',
    ],
    interviewFocus: [
      'What is the difference between params T[] and params ReadOnlySpan<T>, and when can you NOT use the span version?',
      'How does HybridCache differ from using IMemoryCache and IDistributedCache separately?',
      'Why inject TimeProvider instead of calling DateTime.UtcNow, and how do you test time-dependent code?',
      'When would you choose FrozenDictionary over Dictionary, and what is the trade-off?',
      'What does CountBy return, and why is it more efficient than GroupBy for counting use cases?',
    ],
  };
}
