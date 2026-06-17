import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-performance',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
    BeforeAfterComponent, CommonMistakesComponent, PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './performance.html',
  styleUrl: './performance.scss',
})
export class AspnetPerformance {

  prerequisites: Prerequisite[] = [
    { label: 'Caching', route: '/aspnet/caching' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddResponseCompression()',  type: 'method',  desc: 'Registers Brotli/Gzip compression services. Chain to add providers and MIME types.', since: 'Core 2.1+' },
    { name: 'UseResponseCompression()',  type: 'method',  desc: 'Middleware that compresses responses — must come before UseStaticFiles/routing.', since: 'Core 2.1+' },
    { name: 'dotnet-counters',           type: 'keyword', desc: 'CLI: live runtime metrics (CPU, GC, heap, thread pool, request rate) without attaching a profiler.', since: '.NET 5+' },
    { name: 'dotnet-trace',              type: 'keyword', desc: 'CLI: collect an EventPipe CPU/allocation trace for offline flame-graph analysis in SpeedScope.', since: '.NET 5+' },
    { name: 'dotnet-dump',               type: 'keyword', desc: 'CLI: capture a managed memory dump for heap analysis (dumpheap -stat, gcroot).', since: '.NET 5+' },
    { name: '[Benchmark]',               type: 'keyword', desc: 'BenchmarkDotNet attribute — marks a method for statistically rigorous micro-benchmarking.', since: 'BDN 0.9+' },
    { name: '[MemoryDiagnoser]',         type: 'keyword', desc: 'BenchmarkDotNet attribute — adds Allocated bytes column and GC count to benchmark results.', since: 'BDN 0.9+' },
    { name: 'ObjectPool<T>',             type: 'class',   desc: 'Reuse expensive-to-create objects (StringBuilder, MemoryStream) to reduce GC pressure.', since: '.NET 5+' },
    { name: 'ArrayPool<T>',              type: 'class',   desc: 'Rent/return arrays from a shared pool — eliminates allocations in hot read/write paths.', since: '.NET 5+' },
    { name: 'IAsyncEnumerable<T>',       type: 'interface', desc: 'Stream query results row-by-row to the HTTP response — avoids buffering entire datasets in memory.', since: '.NET 5+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Response compression — Brotli, Gzip, and MIME filtering',
      points: [
        'Enable Brotli and Gzip via <code>AddResponseCompression()</code>. Brotli compresses ~15–25% better than Gzip at equal speed; modern browsers support both. Gzip is the fallback for older clients.',
        'Compression is most effective for text-based responses: JSON, HTML, CSS, JavaScript, CSV. <strong>Never compress already-compressed content</strong> — JPEG, PNG, video, ZIP files grow or stay the same size and waste CPU.',
        'Set <code>EnableForHttps = true</code> when you control the entire request path and can rule out BREACH-class attacks. BREACH is only exploitable when secrets that reflect user-controlled input are present in a compressed response — API responses with no such pattern are safe to compress over HTTPS.',
        'The compression level trade-off: <code>CompressionLevel.Fastest</code> for Brotli (best latency/throughput for high-traffic APIs), <code>CompressionLevel.SmallestSize</code> for Gzip (better ratio for large, static-ish responses). Tune per use case.',
        '<code>UseResponseCompression()</code> must be placed <strong>before</strong> <code>UseStaticFiles()</code> and routing in the middleware pipeline — once the response body starts flowing through downstream middleware, the compression middleware wraps it in a compressed stream.',
      ],
    },
    {
      heading: 'Diagnostic tools — counters, traces, and dumps',
      points: [
        '<code>dotnet-counters monitor</code> shows live runtime metrics without stopping or attaching to the process — the first tool to reach for in a production triage. Key signals: <code>gen-0-gc-count</code> (allocation pressure), <code>threadpool-queue-length</code> (CPU saturation), <code>requests-per-second</code> (throughput), <code>exception-count</code> (error rate).',
        '<code>dotnet-trace collect --profile cpu-sampling</code> captures an EventPipe trace while the app runs. Convert with <code>dotnet-trace convert --format Speedscope</code> and open at speedscope.app — flame graphs identify hot methods consuming disproportionate CPU time.',
        '<code>dotnet-dump collect</code> captures a managed heap snapshot. Analyze with <code>dumpheap -stat</code> (largest types by total size), <code>dumpheap -mt &lt;addr&gt;</code> (all instances), <code>gcroot &lt;addr&gt;</code> (what is keeping an object alive — critical for memory leak diagnosis).',
        'For production memory leaks: compare two dumps taken 10 minutes apart. Objects whose count grew significantly in that window are likely candidates. Use <code>dumpheap -stat</code> on both and diff the output.',
        'Application Performance Monitoring (APM) tools (OpenTelemetry + Jaeger/Tempo, Azure Application Insights, Datadog) provide continuous distributed tracing in production. Use <code>Activity</code>/<code>ActivitySource</code> to instrument code with structured traces that correlate across microservices.',
      ],
    },
    {
      heading: 'BenchmarkDotNet — rigorous micro-benchmarking',
      points: [
        'BenchmarkDotNet is the .NET micro-benchmarking standard. Mark methods with <code>[Benchmark]</code>, run in Release mode (<code>dotnet run -c Release</code>), and the framework handles JIT warmup, statistical analysis (mean, StdDev, percentiles), multiple runs, and GC interactions.',
        'Never benchmark with <code>Stopwatch</code> in unit tests: (1) the first run includes JIT compilation, (2) GC can pause execution mid-measurement, (3) Windows timer resolution is ~15 ms — too coarse for sub-millisecond measurements, (4) no warmup means first-call overhead contaminates the result.',
        '<code>[MemoryDiagnoser]</code> adds <strong>Allocated</strong> (bytes per operation) and GC counts to results. The Allocated column is often more actionable than mean duration — reducing allocations lowers GC pressure and indirectly improves P99 latency by reducing pause time.',
        'Parameterise benchmarks with <code>[Params(100, 1000, 10000)]</code> to measure how an algorithm scales. Complexity that is fine at N=100 may collapse at N=10,000 — parameterised benchmarks reveal the crossover point.',
        'Use <code>[ShortRunJob]</code> during development (fewer iterations, faster feedback), remove it for the final numbers that go into a PR or ADR. The default job runs long enough for statistical significance (~20–30 seconds per method).',
      ],
    },
    {
      heading: 'ObjectPool and ArrayPool — eliminating hot-path allocations',
      points: [
        '<code>ArrayPool&lt;T&gt;.Shared.Rent(minimumLength)</code> returns a buffer from a shared pool — <strong>no heap allocation</strong>. Always call <code>ArrayPool&lt;T&gt;.Shared.Return(buffer)</code> in a <code>finally</code> block. The rented buffer may be larger than requested — use only the first <code>minimumLength</code> elements.',
        '<code>ObjectPool&lt;T&gt;</code> (Microsoft.Extensions.ObjectPool) reuses expensive-to-create objects. Register with <code>new DefaultObjectPoolProvider().CreateStringBuilderPool()</code> and inject as a singleton. <code>Get()</code> to borrow, <code>Return()</code> in finally. The pool calls <code>sb.Clear()</code> automatically but does not reset capacity.',
        'Use <code>Span&lt;T&gt;</code> and <code>Memory&lt;T&gt;</code> to slice over rented arrays without additional allocations. <code>AsSpan()</code>, <code>MemoryMarshal</code>, and stack-allocated <code>stackalloc</code> keep data on the stack for small, short-lived buffers — zero GC impact.',
        'GC pressure manifests as high <code>gen-0-gc-count</code> in dotnet-counters and high <strong>Allocated</strong> in BenchmarkDotNet. The fix is almost always the same: pool or reuse allocations in the hot path. Objects allocated and discarded in every request are the primary culprit.',
        'Benchmark before pooling — not every allocation is a problem. Pool only objects that (a) are expensive to create, (b) are allocated frequently, and (c) can be safely reset to a clean state. Premature pooling adds complexity without measurable benefit.',
      ],
    },
    {
      heading: 'Async streaming and efficient data serialisation',
      points: [
        'Return <code>IAsyncEnumerable&lt;T&gt;</code> from Minimal API handlers or controllers to stream results row-by-row directly to the HTTP response. ASP.NET Core and System.Text.Json coordinate to flush chunks incrementally — memory usage stays constant regardless of result set size.',
        '<code>db.Orders.AsAsyncEnumerable()</code> (EF Core) reads database rows one-by-one from the data reader instead of loading the entire result set into a <code>List&lt;T&gt;</code>. For 100,000 rows, the difference is ~400 MB buffered vs ~5 MB peak working set.',
        'Use <code>JsonSerializer.SerializeAsync</code> with a <code>Utf8JsonWriter</code> over a <code>PipeWriter</code> or <code>MemoryStream</code> for maximum throughput. Source generators (<code>[JsonSerializable]</code>) eliminate runtime reflection for JSON, reducing both CPU time and startup overhead.',
        'For binary serialisation in hot paths (inter-service calls, caching), consider <strong>MessagePack</strong> (2–5× smaller than JSON, 3–10× faster serialisation). For Protobuf compatibility, <strong>Google.Protobuf</strong> or <strong>protobuf-net</strong>. JSON is the right default for external APIs; binary formats for internal hot paths.',
        '<code>System.IO.Pipelines</code> (<code>PipeReader</code>/<code>PipeWriter</code>) is the lowest-level, highest-throughput I/O abstraction in .NET — used by Kestrel internally. For network protocols or large binary processing, a <code>Pipe</code> avoids the extra copy that <code>MemoryStream</code> introduces. It is advanced infrastructure; only reach for it when profiling confirms the stream copy is a bottleneck.',
      ],
    },
    {
      heading: 'GC optimisation and memory management patterns',
      points: [
        'Understand the .NET GC generations: <strong>Gen 0</strong> (short-lived, cheap to collect), <strong>Gen 1</strong> (survived one Gen 0, cheap), <strong>Gen 2</strong> (long-lived objects — expensive to collect, pauses the whole heap), <strong>LOH</strong> (Large Object Heap — objects ≥ 85,000 bytes, only collected on Gen 2). Minimise LOH allocations and Gen 2 promotion.',
        '<code>GC.Collect()</code> in application code is almost always wrong — it forces a full Gen 2 collection, pausing all threads. Trust the GC\'s heuristics. The only legitimate use is after a one-time large allocation that will never recur (e.g., after loading a reference dataset at startup).',
        'Server GC mode (<code>&lt;GarbageCollectionAdapationMode&gt;0&lt;/GarbageCollectionAdapationMode&gt;</code> in .csproj, or <code>System.GC.Server=true</code> in runtimeconfig.json) uses one heap per logical core — higher throughput but higher memory footprint. Workstation GC mode uses one heap — lower memory, higher pause frequency. Server mode is the right default for ASP.NET Core deployments with multiple cores.',
        'Avoid finalizers (<code>~ClassName()</code>) on hot-path objects — objects with finalizers are promoted to Gen 1 after finalization, increasing GC pressure. Use <code>IDisposable</code> with explicit disposal and <code>using</code> statements instead.',
        '<code>ReadOnlySpan&lt;string&gt; parts = ["a", "b", "c"];</code> (C# 12) creates a stack-allocated span backed by a static data segment — zero heap allocation for string constant arrays. Similarly, <code>string.Create&lt;TState&gt;</code> lets you fill a string\'s internal buffer directly, avoiding intermediate allocations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Response Compression',
      language: 'csharp',
      code: `builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        ["application/json", "application/problem+json", "text/csv"]);
});

builder.Services.Configure<BrotliCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);         // best latency for APIs

builder.Services.Configure<GzipCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.SmallestSize);    // better ratio for large/static

var app = builder.Build();

// MUST come before UseStaticFiles and routing
app.UseResponseCompression();

// Verify compression is working:
// curl -H "Accept-Encoding: br" -v https://localhost:5001/api/products
// → Response includes: Content-Encoding: br`,
    },
    {
      label: 'Diagnostic Tools (CLI)',
      language: 'csharp',
      code: `# Install global tools once
dotnet tool install --global dotnet-counters
dotnet tool install --global dotnet-trace
dotnet tool install --global dotnet-dump

# ── dotnet-counters: live metrics without attaching ────────────────────
dotnet-counters ps                                       # find the process ID
dotnet-counters monitor --process-id 12345 \\
  --refresh-interval 1 \\
  System.Runtime Microsoft.AspNetCore.Hosting

# Key counters to watch:
#   gc-heap-size              MB on managed heap (growing = memory leak)
#   gen-0-gc-count            minor GCs/sec (allocation pressure)
#   threadpool-queue-length   work items waiting (CPU saturation)
#   requests-per-second       ASP.NET Core throughput
#   exception-count           unhandled exceptions/sec

# ── dotnet-trace: flame-graph CPU profile ─────────────────────────────
dotnet-trace collect --process-id 12345 \\
  --duration 00:00:30 --profile cpu-sampling -o trace.nettrace
dotnet-trace convert trace.nettrace --format Speedscope -o trace.json
# Open trace.json at https://www.speedscope.app → left-heavy view shows hot methods

# ── dotnet-dump: managed heap snapshot ────────────────────────────────
dotnet-dump collect --process-id 12345 -o dump.dmp
dotnet-dump analyze dump.dmp
# > dumpheap -stat          top types by total retained size
# > dumpheap -mt <MethodTable> all instances of a type
# > gcroot <object-addr>   what is keeping this object alive`,
    },
    {
      label: 'BenchmarkDotNet',
      language: 'csharp',
      code: `// dotnet add package BenchmarkDotNet
// Run: dotnet run -c Release  (NEVER Debug — JIT optimisations are disabled)

[MemoryDiagnoser]     // adds Allocated and GC count columns
[ShortRunJob]         // fewer iterations for dev iteration; remove for final numbers
public class StringBenchmarks
{
    private const int N = 1000;
    private static readonly ObjectPool<StringBuilder> _pool =
        new DefaultObjectPoolProvider().CreateStringBuilderPool();

    [Benchmark(Baseline = true)]
    public string StringConcat()
    {
        var result = string.Empty;
        for (var i = 0; i < N; i++)
            result += i.ToString();
        return result;
    }

    [Benchmark]
    public string StringBuilder_New()
    {
        var sb = new StringBuilder();
        for (var i = 0; i < N; i++) sb.Append(i);
        return sb.ToString();
    }

    [Benchmark]
    public string StringBuilder_Pooled()
    {
        var sb = _pool.Get();
        try
        {
            for (var i = 0; i < N; i++) sb.Append(i);
            return sb.ToString();
        }
        finally { _pool.Return(sb); }
    }
}

class Program { static void Main() => BenchmarkRunner.Run<StringBenchmarks>(); }

// Typical output (N=1000):
// | Method               | Mean     | Allocated |
// |----------------------|----------|-----------|
// | StringConcat         | 1,200 μs | 2,450 KB  |  ← O(n²) allocations
// | StringBuilder_New    |    42 μs |    18 KB  |  ← much better
// | StringBuilder_Pooled |    40 μs |     2 KB  |  ← near zero after warmup`,
    },
    {
      label: 'ObjectPool & ArrayPool',
      language: 'csharp',
      code: `// ── ObjectPool<StringBuilder> ─────────────────────────────────────────
// Register as singleton in Program.cs:
builder.Services.AddSingleton(
    new DefaultObjectPoolProvider().CreateStringBuilderPool());

public class ReportBuilder(ObjectPool<StringBuilder> pool)
{
    public string BuildReport(IEnumerable<Order> orders)
    {
        var sb = pool.Get();
        try
        {
            sb.AppendLine("Order Report");
            foreach (var o in orders)
                sb.Append(o.Id).Append(": ").AppendLine(o.Total.ToString("C"));
            return sb.ToString();
        }
        finally
        {
            pool.Return(sb);   // clears content + returns to pool
        }
    }
}

// ── ArrayPool<byte> ────────────────────────────────────────────────────
public async Task<byte[]> HashStreamAsync(Stream input)
{
    var buffer = ArrayPool<byte>.Shared.Rent(81_920);   // rent ≥ 80 KB
    try
    {
        using var sha = SHA256.Create();
        int read;
        while ((read = await input.ReadAsync(buffer.AsMemory(0, 81_920))) > 0)
            sha.TransformBlock(buffer, 0, read, null, 0);
        sha.TransformFinalBlock([], 0, 0);
        return sha.Hash!;
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer);  // MUST return — even on exception
    }
}

// ── Span<T> for allocation-free slicing ───────────────────────────────
public static int ParseFirstInt(ReadOnlySpan<char> csv)
{
    var comma = csv.IndexOf(',');
    return int.Parse(comma < 0 ? csv : csv[..comma]);
}`,
    },
    {
      label: 'Async Streaming (IAsyncEnumerable)',
      language: 'csharp',
      code: `// ── Stream EF Core results directly to the HTTP response ─────────────
// Instead of loading all rows into a List<T> first:
app.MapGet("/orders/export", async IAsyncEnumerable<OrderDto>(AppDbContext db) =>
    db.Orders
      .OrderBy(o => o.Id)
      .Select(o => new OrderDto(o.Id, o.Total))
      .AsAsyncEnumerable());           // rows flow to JSON serialiser one by one

// Memory: ~5 MB peak for 100k rows vs ~400 MB with ToList()

// ── Manual streaming with IAsyncEnumerable ─────────────────────────────
public async IAsyncEnumerable<PriceUpdate> StreamPrices(
    string symbol,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    while (!ct.IsCancellationRequested)
    {
        yield return new PriceUpdate(symbol, await FetchPriceAsync(symbol));
        await Task.Delay(500, ct);
    }
}

// ── JSON source generator for zero-reflection serialisation ───────────
// Program.cs:
// builder.Services.ConfigureHttpJsonOptions(opts =>
//     opts.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default));

[JsonSerializable(typeof(OrderDto))]
[JsonSerializable(typeof(IAsyncEnumerable<OrderDto>))]
internal partial class AppJsonContext : JsonSerializerContext { }

// Minimal API returns OrderDto — source gen handles serialisation, no runtime reflection`,
    },
    {
      label: 'Common Perf Patterns',
      language: 'csharp',
      code: `// 1. Always pass CancellationToken — cancels work when client disconnects
app.MapGet("/slow-report", async (AppDbContext db, CancellationToken ct) =>
    await db.Orders.ToListAsync(ct));  // ← query stops if client disconnects

// 2. Filter in SQL, not in memory
var activeUsers = db.Users.Where(u => u.IsActive).ToList();  // ✓ SQL WHERE
// BAD: db.Users.ToList().Where(u => u.IsActive)             // ✗ loads everything

// 3. Avoid Select N+1 — use Include or projection
var ordersWithItems = await db.Orders
    .Include(o => o.Items)        // single JOIN query
    .ToListAsync();
// BAD: foreach (var o in orders) o.Items = GetItemsFor(o.Id); // N queries

// 4. Use compiled queries for repeated parameterised EF queries
private static readonly Func<AppDbContext, int, Task<Order?>> _getOrder =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Orders.FirstOrDefault(o => o.Id == id));

// 5. Span<char> for string parsing without allocation
public static bool TryParseOrderId(ReadOnlySpan<char> input, out int id)
{
    var dashIdx = input.IndexOf('-');
    return int.TryParse(
        dashIdx >= 0 ? input[(dashIdx + 1)..] : input,
        out id);
}

// 6. Compiled LINQ expressions for dynamic predicates (avoid Reflection.Emit)
// Expression<Func<Order, bool>> filter = o => o.Total > threshold;
// var results = await db.Orders.Where(filter).ToListAsync();`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Stopwatch timing vs BenchmarkDotNet',
      before: `// Unreliable micro-benchmark with Stopwatch
[Fact]
public void StringConcat_ShouldBeFast()
{
    var sw = Stopwatch.StartNew();
    var result = string.Empty;
    for (var i = 0; i < 1000; i++) result += i;
    sw.Stop();

    // Problems:
    // 1. First call includes JIT compilation overhead
    // 2. GC may run mid-measurement
    // 3. Windows timer resolution is ~15 ms — too coarse
    // 4. No warmup, no statistical analysis
    Assert.True(sw.ElapsedMilliseconds < 100, $"Too slow: {sw.ElapsedMilliseconds}ms");
}`,
      after: `// BenchmarkDotNet — statistically rigorous, handles JIT warmup and GC
[MemoryDiagnoser]
public class StringBenchmarks
{
    [Benchmark(Baseline = true)]
    public string StringConcat()
    {
        var result = string.Empty;
        for (var i = 0; i < 1000; i++) result += i;
        return result;
    }

    [Benchmark]
    public string StringBuilder_Pooled()
    {
        var sb = _pool.Get();
        try { for (var i = 0; i < 1000; i++) sb.Append(i); return sb.ToString(); }
        finally { _pool.Return(sb); }
    }
}
// dotnet run -c Release  ← always Release, never Debug
// Results: Mean, StdDev, P99, Allocated, GC Gen 0/1/2 counts — all statistically valid`,
      note: 'BenchmarkDotNet runs warmup iterations (JIT compiles first), then measures timing in a loop with enough iterations for statistical significance, and reports mean/StdDev/P50/P99. Stopwatch measurements from a single run include JIT and GC noise that can exceed the signal.',
    },
    {
      title: 'ToList() + filter in memory vs IAsyncEnumerable streaming',
      before: `// Loads ALL rows into a List<T> before responding — O(n) memory
app.MapGet("/orders/export", async (AppDbContext db) =>
{
    var all = await db.Orders.ToListAsync();   // ← buffers 100k rows in RAM
    return all.Select(o => new OrderDto(o.Id, o.Total));
    // 100k rows at ~200 bytes each = ~20 MB minimum, often 60–400 MB with overhead
    // Response only starts after ALL rows are loaded
});`,
      after: `// Stream rows directly — constant memory, faster time-to-first-byte
app.MapGet("/orders/export", async IAsyncEnumerable<OrderDto>(AppDbContext db) =>
    db.Orders
      .Select(o => new OrderDto(o.Id, o.Total))
      .AsAsyncEnumerable());    // ← rows flow out as they arrive from the database
// Memory peak: ~5 MB regardless of row count
// Time-to-first-byte: milliseconds (first row), not seconds (all rows)
// Client receives JSON array as a stream — can start processing immediately`,
      note: 'ToList() materialises the entire result set in server memory before the first byte goes to the client. IAsyncEnumerable streams rows as the data reader produces them — the JSON serialiser flushes to the response buffer periodically. Memory stays flat and the client sees data sooner.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Enabling compression over HTTP without understanding BREACH',
      wrong: `// Enabling HTTPS compression without understanding the risk
builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;  // ← is this safe?
    opts.Providers.Add<BrotliCompressionProvider>();
});

// If your endpoint:
//   1. Is compressed (EnableForHttps = true)
//   2. Contains a user-controllable value (e.g. search term reflected in response)
//   3. Contains a secret (CSRF token, session data) in the SAME response
// → Vulnerable to BREACH oracle attack`,
      right: `// Safe: avoid reflecting secrets and user-controlled input in the same compressed response
// OR: ensure responses don't contain sensitive secrets in compressed form

// Safest API pattern — keep secrets OUT of JSON response bodies:
// 1. Don't reflect user input verbatim in API responses
// 2. Don't include CSRF tokens or session tokens in JSON bodies
// 3. Place CSRF tokens in response headers (not body) or separate endpoints
builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;  // safe when the above conditions hold
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes; // JSON, HTML, CSS only
});`,
      explanation: 'BREACH is an attack against TLS+compression that exploits the fact that secrets compress shorter when the attacker can vary the guessed prefix. It requires: compression enabled over HTTPS, a secret in the response, and user-controllable input in the same response. For pure JSON APIs that do not echo user input alongside secrets, EnableForHttps=true is safe. For pages with CSRF tokens, mitigate by not reflecting user input in the same response.',
    },
    {
      title: 'Not returning rented ArrayPool buffers in finally blocks',
      wrong: `public async Task ProcessFileAsync(Stream input)
{
    var buffer = ArrayPool<byte>.Shared.Rent(65536);

    // If ReadAsync throws, Rent returns without matching Return
    int read = await input.ReadAsync(buffer, 0, buffer.Length);
    ProcessChunk(buffer, read);

    // BUG: exception skips the Return
    ArrayPool<byte>.Shared.Return(buffer);
}`,
      right: `public async Task ProcessFileAsync(Stream input)
{
    var buffer = ArrayPool<byte>.Shared.Rent(65536);
    try
    {
        int read = await input.ReadAsync(buffer.AsMemory(0, buffer.Length));
        ProcessChunk(buffer.AsSpan(0, read));
    }
    finally
    {
        // ALWAYS in finally — runs even on exception or cancellation
        ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
    }
}`,
      explanation: 'ArrayPool buffers that are not returned remain in limbo — they are neither available to the pool nor garbage collected (the pool holds a reference). Over time, unreturned buffers exhaust the pool and fall back to heap allocations, negating the benefit. Always return in a finally block, and only pass clearArray: true if the buffer contains sensitive data that must be zeroed.',
    },
    {
      title: 'Running BenchmarkDotNet in Debug mode',
      wrong: `# BUG: running benchmarks in Debug mode
dotnet run        # ← default is Debug
dotnet run -c Debug

# Results will show 10-100× slower numbers than production:
# - JIT optimisations disabled (inlining, escape analysis off)
# - Runtime checks enabled (bounds, overflow)
# - No SIMD vectorisation
# - Meaningless compared to production behaviour`,
      right: `# Always run benchmarks in Release mode
dotnet run -c Release

# BenchmarkDotNet will warn and refuse to run in Debug mode by default:
// Benchmark was built without Release configuration.
// The results are not reliable.

// To enforce Release check:
// [Fact]
// public void BenchmarksRunInRelease() =>
//     Assert.True(BenchmarkDotNet.Helpers.RuntimeVersionHelper.IsRelease());`,
      explanation: 'The .NET JIT compiler performs aggressive optimisations in Release mode — method inlining, escape analysis, dead code elimination, and SIMD vectorisation. Debug mode disables most of these to support stepping and inspection. Debug benchmarks can be 10–100× slower than production, making them worse than useless — they mislead you into over-optimising fast paths and ignoring real bottlenecks.',
    },
    {
      title: 'ObjectPool not accounting for oversized StringBuilder capacity',
      wrong: `// After returning, the pool calls sb.Clear() but keeps the backing buffer
// A one-off 100 MB string operation contaminates the pool
var sb = pool.Get();
try
{
    foreach (var row in hugeDataset)   // accidentally loads 100 MB string
        sb.AppendLine(row);
    return sb.ToString();
}
finally
{
    pool.Return(sb);   // sb now has 100 MB internal buffer — returned to pool
    // Next borrow returns a 100 MB StringBuilder to a caller that needs 1 KB
}`,
      right: `var sb = pool.Get();
try
{
    foreach (var row in dataset) sb.AppendLine(row);
    return sb.ToString();
}
finally
{
    // Discard oversized instances — don't pollute the pool with huge buffers
    if (sb.Capacity > 128 * 1024)   // e.g., 128 KB threshold
        sb = null!;     // let GC collect it
    else
        pool.Return(sb);
}`,
      explanation: 'ObjectPool clears a StringBuilder\'s content on Return but preserves its internal char[] capacity. A StringBuilder that grew to 100 MB returned to the pool remains at 100 MB — future callers borrow and hold a 100 MB buffer for a 100-byte operation, wasting memory. Always check Capacity before returning and discard instances that grew beyond a safe limit.',
    },
    {
      title: 'Calling GC.Collect() in application request handlers',
      wrong: `// BUG: manually triggering GC in a request handler
app.MapPost("/bulk-import", async (IFormFile file, AppDbContext db) =>
{
    var records = ParseCsv(file);
    await db.Records.AddRangeAsync(records);
    await db.SaveChangesAsync();

    GC.Collect();              // ← forces Gen 2 collection
    GC.WaitForPendingFinalizers(); // ← pauses ALL threads for full GC sweep
    GC.Collect();              // "double collect" pattern

    return Results.Ok(records.Count);
    // Every bulk import pauses the entire server for 50-500 ms
});`,
      right: `// Let the GC manage its own schedule — it is tuned for your workload
app.MapPost("/bulk-import", async (IFormFile file, AppDbContext db) =>
{
    var records = ParseCsv(file);
    await db.AddRangeAsync(records);
    await db.SaveChangesAsync();
    // No GC.Collect() — the runtime promotes and collects on its own schedule

    return Results.Ok(records.Count);
});

// If you MUST hint after one-time startup load (not in request handlers):
// app.Lifetime.ApplicationStarted.Register(() =>
// {
//     LoadStaticData();       // one-time, never repeated
//     GC.Collect();           // acceptable here — server not yet serving traffic
// });`,
      explanation: 'GC.Collect() forces a full Gen 2 collection — the most expensive GC type — and can pause all managed threads (Stop-The-World) for tens to hundreds of milliseconds. Calling it in a request handler effectively imposes that latency on every concurrent request. The GC has adaptive heuristics that outperform manual invocation in all production scenarios. The only valid use is after a one-time startup load, before the server starts accepting traffic.',
    },
  ];

  challenge: Challenge = {
    title: 'Benchmark & Optimise a CSV Endpoint',
    language: 'csharp',
    description: `You have an endpoint that exports orders as CSV using string concatenation. Optimise it:
1. Write a <strong>BenchmarkDotNet</strong> benchmark comparing: string concat vs <code>StringBuilder</code> vs <code>ObjectPool&lt;StringBuilder&gt;</code>.
2. Replace the endpoint with the pooled <code>StringBuilder</code> version.
3. Enable <strong>Brotli compression</strong> for <code>text/csv</code>.
4. Add <code>[MemoryDiagnoser]</code> and confirm allocations drop significantly.`,
    hints: [
      'Run dotnet run -c Release — BenchmarkDotNet refuses Debug mode',
      'Register ObjectPool<StringBuilder> as Singleton via new DefaultObjectPoolProvider().CreateStringBuilderPool()',
      'AddResponseCompression with MimeTypes including "text/csv"',
      '[MemoryDiagnoser] adds the Allocated column — look for it to drop from MB to KB',
    ],
    starterCode: `app.MapGet("/export", (int rows) =>
{
    var csv = "id,name,value\\n";
    for (var i = 0; i < rows; i++)
        csv += $"{i},item-{i},{i * 1.5}\\n";    // O(n²) allocations
    return Results.Text(csv, "text/csv");
});`,
    solution: `// Program.cs
builder.Services.AddSingleton(
    new DefaultObjectPoolProvider().CreateStringBuilderPool());

builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["text/csv"]);
});

var app = builder.Build();
app.UseResponseCompression();

app.MapGet("/export", (int rows, ObjectPool<StringBuilder> pool) =>
{
    var sb = pool.Get();
    try
    {
        sb.AppendLine("id,name,value");
        for (var i = 0; i < rows; i++)
            sb.Append(i).Append(',').Append("item-").Append(i)
              .Append(',').AppendLine((i * 1.5).ToString("F1"));
        return Results.Text(sb.ToString(), "text/csv");
    }
    finally { pool.Return(sb); }
});

// Benchmark
[MemoryDiagnoser]
public class CsvBenchmarks
{
    [Params(100, 1000)] public int Rows { get; set; }
    private static readonly ObjectPool<StringBuilder> _pool =
        new DefaultObjectPoolProvider().CreateStringBuilderPool();

    [Benchmark(Baseline = true)]
    public string Concat()
    {
        var s = string.Empty;
        for (var i = 0; i < Rows; i++) s += \$"{i},item-{i},{i * 1.5:F1}\\n";
        return s;
    }

    [Benchmark]
    public string Pooled()
    {
        var sb = _pool.Get();
        try
        {
            sb.AppendLine("id,name,value");
            for (var i = 0; i < Rows; i++)
                sb.AppendLine(\$"{i},item-{i},{i * 1.5:F1}");
            return sb.ToString();
        }
        finally { _pool.Return(sb); }
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you never benchmark .NET code with Stopwatch in a unit test?',
      options: [
        'Stopwatch is not thread-safe and can produce negative values',
        'JIT warmup, GC pauses, and OS timer resolution make Stopwatch measurements unreliable for micro-benchmarks',
        'Stopwatch only measures wall-clock time, not CPU time or allocations',
        'Unit tests run in a sandbox that throttles the CPU',
      ],
      answer: 1,
      explanation: 'The first run incurs JIT compilation overhead. GC can pause execution mid-measurement for milliseconds. Windows timer resolution is ~15 ms — too coarse for sub-millisecond operations. There is no warmup or statistical analysis. BenchmarkDotNet handles all of these with warmup iterations, many repetitions, and mean/StdDev/P99 reporting.',
    },
    {
      q: 'What is the key benefit of ArrayPool<T>.Shared.Rent() over new byte[size]?',
      options: [
        'Rented arrays are always zero-initialised on first use',
        'Rented arrays avoid a heap allocation — the buffer is returned from the pool, reducing GC pressure',
        'Rented arrays can hold more than 2 billion elements',
        'Rented arrays are pinned in memory, enabling direct DMA I/O',
      ],
      answer: 1,
      explanation: 'ArrayPool.Rent() returns an existing buffer from a shared pool — no heap allocation. This eliminates the Gen 0 collection pressure that comes from frequently allocating and discarding byte arrays in I/O-heavy code. The trade-off: you must manually Return() in a finally block.',
    },
    {
      q: 'Why must UseResponseCompression() be placed before UseStaticFiles() in the pipeline?',
      options: [
        'Static files cannot be served if compression is applied after them',
        'Once response bytes start flowing through downstream middleware, they cannot be wrapped in a compression stream retroactively',
        'UseStaticFiles sets a Cache-Control header that prevents compression',
        'Compression middleware overwrites the Content-Type set by static files',
      ],
      answer: 1,
      explanation: 'Compression middleware works by wrapping the response stream. Once UseStaticFiles (or routing) starts writing response bytes, the body is already flowing — a compression wrapper inserted later has nothing to intercept. The compression middleware must be in place BEFORE any middleware that writes response body bytes.',
    },
    {
      q: 'What does the [MemoryDiagnoser] attribute add to BenchmarkDotNet output?',
      options: [
        'A live memory profiler that attaches to the process during benchmarking',
        'Allocated bytes per operation and GC collection counts (Gen 0/1/2) alongside timing results',
        'A comparison of managed vs unmanaged heap usage',
        'Peak memory usage for the entire benchmark run',
      ],
      answer: 1,
      explanation: '[MemoryDiagnoser] instruments each benchmark method to count managed heap allocations per operation (in bytes) and Gen 0/1/2 GC collections during the run. The Allocated column is often more actionable than timing — reducing allocations lowers GC pressure and indirectly improves P99 latency by reducing stop-the-world pause frequency.',
    },
    {
      q: 'Why is calling GC.Collect() inside a request handler harmful?',
      options: [
        'GC.Collect() is not thread-safe and can corrupt the heap',
        'It forces a Gen 2 collection that can pause all managed threads for tens to hundreds of milliseconds per request',
        'GC.Collect() resets the thread pool and drops active connections',
        'It is illegal in .NET 8+ and throws InvalidOperationException',
      ],
      answer: 1,
      explanation: 'GC.Collect() triggers a full Gen 2 (stop-the-world) collection. Every concurrent request thread is paused for the duration — typically 50–500 ms on a large heap. Calling it per request multiplies that latency by request rate and effectively serial-queues every request through a GC pause. The GC\'s own heuristics outperform manual invocation in all production workloads.',
    },
    {
      q: 'What happens to an ObjectPool<StringBuilder> after a StringBuilder grows to 100 MB inside the pool?',
      options: [
        'The pool automatically evicts oversized objects and creates a new one on the next Get()',
        'Return() clears the content but keeps the 100 MB backing buffer, polluting the pool for all future callers',
        'The StringBuilder is garbage collected because the pool has a maximum capacity per item',
        'Return() throws InvalidOperationException if the StringBuilder exceeds the pool\'s max size',
      ],
      answer: 1,
      explanation: 'ObjectPool calls Clear() on Return, which empties the string content but does NOT shrink the internal char[] capacity. A 100 MB StringBuilder returned to the pool remains at 100 MB — future callers borrow and hold a 100 MB buffer for a 100-byte operation, wasting memory. Always check Capacity before returning and discard oversized instances.',
    },
    {
      q: 'How does returning IAsyncEnumerable<T> from an API endpoint improve performance over returning List<T>?',
      options: [
        'IAsyncEnumerable is faster to serialize because it uses binary encoding',
        'Rows flow from the database reader to the HTTP response incrementally — memory stays flat regardless of row count',
        'IAsyncEnumerable skips JSON serialization and sends raw bytes',
        'It reduces database round-trips by batching queries automatically',
      ],
      answer: 1,
      explanation: 'Returning List<T> loads the entire result set into memory before writing a single byte to the response — memory peaks at N × object size. IAsyncEnumerable<T> streams: EF Core reads rows from the data reader one at a time, System.Text.Json writes each to the response buffer, and Kestrel flushes periodically. Memory usage stays constant regardless of N, and the client receives the first rows much sooner.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is dotnet-counters most useful for in production?', a: 'Real-time triage of live production issues without stopping the process. Key signals: <code>gen-0-gc-count</code> (allocation pressure — high means many short-lived allocations), <code>threadpool-queue-length</code> (CPU saturation — growing means you are CPU-bound), <code>gc-heap-size</code> growing over time (memory leak), and <code>requests-per-second</code> drop (performance regression). Run it for 30–60 seconds during a problem and compare to a baseline.' },
    { q: 'When does response compression actually hurt performance?', a: 'Three cases: (1) <strong>Already-compressed content</strong> — JPEG, PNG, video, ZIP. Compressing again adds CPU cost with no size reduction. (2) <strong>Very small responses</strong> (&lt;1 KB) — compression overhead and added headers can exceed the bandwidth saving. (3) <strong>CPU-bound services</strong> — if the server is already at 80–90% CPU, adding Brotli compression at the fastest level may tip it over, reducing throughput more than the bandwidth saving improves latency. Profile before enabling.' },
    { q: 'What is a captive StringBuilder in an ObjectPool?', a: 'After <code>Return(sb)</code>, the pool calls <code>sb.Clear()</code> — which erases characters but does not shrink the internal char[] array. A StringBuilder that grew to 100 MB from a one-time large operation stays at 100 MB in the pool. The next caller borrows a 100 MB buffer for a 100-byte string, wasting memory for the lifetime of that pooled object. Discard oversized instances on Return rather than letting them contaminate the pool.' },
    { q: 'How do I profile a memory leak in production?', a: 'Use <code>dotnet-counters</code> to confirm the heap is growing (<code>gc-heap-size</code> increases monotonically between GC cycles). Then take two <code>dotnet-dump</code> snapshots 10–15 minutes apart. In each dump, run <code>dumpheap -stat</code> and diff the output — types whose total retained size grew significantly are suspects. For each suspect, use <code>gcroot &lt;addr&gt;</code> to find what is holding a reference and preventing collection. Common culprits: event handlers on long-lived objects, static dictionaries that never evict, and DI-registered singletons holding references to scoped data.' },
    { q: 'When should I use System.IO.Pipelines instead of Stream?', a: '<code>PipeReader</code>/<code>PipeWriter</code> eliminate the extra copy that <code>MemoryStream</code> introduces between the I/O layer and your processing code. Kestrel uses Pipelines internally. Reach for it when: (a) profiling confirms a Stream copy is a bottleneck, (b) you are implementing a network protocol parser that must handle partial reads efficiently, or (c) you need backpressure signalling built-in. For most application-level code (reading JSON bodies, writing CSV), <code>Stream</code> or <code>IAsyncEnumerable</code> is sufficient and far simpler.' },
    { q: 'What is the difference between Gen 0, Gen 1, and Gen 2 in .NET GC?', a: 'The GC divides the managed heap into generations based on object age. <strong>Gen 0</strong>: new objects — collected very frequently (every few MB), very fast (&lt;1 ms). <strong>Gen 1</strong>: survived one Gen 0 — a buffer zone collected less often. <strong>Gen 2</strong>: long-lived objects — collected rarely, expensive (can pause for 10–500 ms on large heaps). <strong>LOH</strong> (Large Object Heap): objects ≥ 85 KB — allocated directly into Gen 2 space and only collected on Gen 2. The goal is to keep most objects in Gen 0 (allocate and collect quickly) and avoid promoting long-lived objects that aren\'t truly long-lived.' },
    { q: 'How do I measure allocations in ASP.NET Core without a profiler?', a: 'Three approaches: (1) <strong>BenchmarkDotNet with [MemoryDiagnoser]</strong> — gold standard for micro-benchmarking individual methods. (2) <strong>dotnet-counters gen-0-gc-count</strong> — rate of minor GC collections; high rate means allocation pressure. (3) <strong>System.GC.GetAllocatedBytesForCurrentThread()</strong> — measure allocations for a specific code path in a test: take a snapshot before and after the call and diff. This is low-overhead and works in unit tests.' },
    { q: 'When is it worth switching from JSON to MessagePack or Protobuf?', a: 'JSON is the right default for external/public APIs — universal, human-readable, and self-describing. Switch to a binary format for <strong>internal hot paths</strong> where: (a) profiling shows JSON serialisation is a measurable bottleneck (&gt;5% of request time), (b) payload size is large (&gt;10 KB per request), or (c) you are making thousands of inter-service calls per second. MessagePack is ~2–5× smaller and ~3–10× faster to serialise/deserialise than JSON. Protobuf (via gRPC) is preferred when you need a formal schema contract between services.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Compress text responses with Brotli before routing middleware; never benchmark in Debug mode — use BenchmarkDotNet with [MemoryDiagnoser]; always return ArrayPool buffers in finally blocks; stream large datasets with IAsyncEnumerable instead of buffering in List<T>; diagnose live production issues with dotnet-counters before attaching a profiler.',
    mustKnow: [
      'UseResponseCompression() must go BEFORE UseStaticFiles/routing — response bytes must not be flowing yet',
      'BenchmarkDotNet only — never Stopwatch in tests. Run in Release mode with [MemoryDiagnoser] for allocation data',
      'ArrayPool.Rent() must always be paired with Return() in a finally block — even on exceptions',
      'IAsyncEnumerable<T> streams rows to the response incrementally; ToList() buffers all rows in memory first',
      'ObjectPool<StringBuilder>.Return() keeps the backing buffer — discard oversized instances rather than returning them',
      'GC.Collect() in request handlers forces a stop-the-world pause for every concurrent request — never call it there',
      'dotnet-counters is the first tool for live production triage; dotnet-trace for flame graphs; dotnet-dump for memory leaks',
    ],
    interviewFocus: [
      'Why is Stopwatch unreliable for micro-benchmarks and what should you use instead?',
      'What is the difference between ArrayPool<T> and ObjectPool<T>, and when do you use each?',
      'How does returning IAsyncEnumerable<T> from an API reduce memory usage compared to List<T>?',
      'What are the three .NET diagnostic CLI tools and what does each one tell you?',
      'Why should GC.Collect() never be called in application request handlers?',
    ],
  };
}
