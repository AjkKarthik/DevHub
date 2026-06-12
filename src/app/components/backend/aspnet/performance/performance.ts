import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'AddResponseCompression()', type: 'method',  desc: 'Enables Brotli/Gzip compression for HTTP responses.' },
  { name: 'UseResponseCompression()', type: 'method',  desc: 'Middleware that compresses responses — add before static files/controllers.' },
  { name: 'dotnet-counters',          type: 'keyword', desc: 'CLI tool: live metrics (CPU, GC, heap, thread pool) without attaching a profiler.' },
  { name: 'dotnet-trace',             type: 'keyword', desc: 'CLI tool: collect a CPU/allocation trace for offline analysis in PerfView/SpeedScope.' },
  { name: 'dotnet-dump',              type: 'keyword', desc: 'CLI tool: capture a memory dump for heap analysis (dotnet-dump analyze).' },
  { name: '[Benchmark]',              type: 'keyword', desc: 'BenchmarkDotNet attribute — marks a method for micro-benchmarking.' },
  { name: 'ObjectPool<T>',            type: 'class',   desc: 'Reuse expensive objects (StringBuilder, MemoryStream) to reduce GC pressure.' },
  { name: 'ArrayPool<T>',             type: 'class',   desc: 'Rent/return arrays without allocation — critical in hot paths.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Response compression',
    points: [
      'Enable Brotli and Gzip via <code>AddResponseCompression()</code>. Most effective for text (JSON, HTML, CSS). Skip for already-compressed content (images, video).',
      'Always use HTTPS with compression — compression over HTTP is vulnerable to BREACH attacks when responses contain secrets that reflect user-controlled input.',
      '<code>UseResponseCompression()</code> must come before <code>UseStaticFiles()</code> and routing in the middleware pipeline.',
    ],
  },
  {
    heading: 'Diagnostic tools',
    points: [
      '<strong>dotnet-counters monitor</strong> shows live metrics (GC pause time, heap size, request rate) without stopping the process — the first tool to reach for in a production issue.',
      '<strong>dotnet-trace collect</strong> captures an EventPipe trace. Open in SpeedScope (browser) or PerfView to find hot methods via flame graph. Use <code>--profile cpu-sampling</code> for CPU bottlenecks.',
      '<strong>dotnet-dump analyze</strong> after capture: <code>dumpheap -stat</code> shows the largest types on the managed heap; <code>gcroot &lt;addr&gt;</code> finds what is keeping an object alive.',
    ],
  },
  {
    heading: 'BenchmarkDotNet',
    points: [
      'BenchmarkDotNet is the .NET micro-benchmarking standard. Mark methods with <code>[Benchmark]</code> and run in Release mode (<code>dotnet run -c Release</code>). It handles warmup, statistical analysis, and memory allocation reporting.',
      'Never benchmark with <code>Stopwatch</code> in unit tests — JIT warmup, GC pauses, and timer resolution (~15 ms on Windows) make the numbers meaningless.',
      'Use <code>[MemoryDiagnoser]</code> to see allocations per operation alongside timing. The <strong>Allocated</strong> column is often more actionable than mean duration.',
    ],
  },
  {
    heading: 'ObjectPool and ArrayPool',
    points: [
      '<code>ObjectPool&lt;T&gt;</code> (Microsoft.Extensions.ObjectPool) reuses expensive-to-construct objects — borrow with <code>Get()</code>, return with <code>Return()</code>. Ideal for <code>StringBuilder</code> in high-throughput endpoints.',
      '<code>ArrayPool&lt;T&gt;.Shared.Rent(size)</code> rents a buffer (may be larger than requested) from a shared pool — always call <code>Return()</code> in a finally block.',
      'Use <code>Span&lt;T&gt;</code> and <code>Memory&lt;T&gt;</code> to slice over rented arrays without further allocation, keeping hot paths allocation-free.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Response Compression',
    language: 'csharp',
    code: `builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        ["application/json", "application/problem+json"]);
});

builder.Services.Configure<BrotliCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);

builder.Services.Configure<GzipCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.SmallestSize);

var app = builder.Build();

// MUST come before UseStaticFiles and routing
app.UseResponseCompression();

// Verify: curl -H "Accept-Encoding: br" -v https://localhost:5001/api/products
// Response should show: Content-Encoding: br`,
  },
  {
    label: 'Diagnostic Tools (CLI)',
    language: 'csharp',
    code: `# Install once
dotnet tool install --global dotnet-counters
dotnet tool install --global dotnet-trace
dotnet tool install --global dotnet-dump

# ── dotnet-counters ───────────────────────────────────────────────────────────
dotnet-counters ps                                      # list .NET processes
dotnet-counters monitor --process-id 12345 --refresh-interval 1 \\
  System.Runtime Microsoft.AspNetCore.Hosting

# Key counters:
#   gc-heap-size              MB of managed heap
#   gen-0-gc-count            minor GCs/sec (allocation pressure indicator)
#   threadpool-queue-length   backlogged work items (CPU saturation)
#   requests-per-second       ASP.NET Core throughput

# ── dotnet-trace ─────────────────────────────────────────────────────────────
dotnet-trace collect --process-id 12345 --duration 00:00:30 \\
  --profile cpu-sampling -o trace.nettrace

dotnet-trace convert trace.nettrace --format Speedscope -o trace.json
# Open trace.json at https://www.speedscope.app for flame graph

# ── dotnet-dump ───────────────────────────────────────────────────────────────
dotnet-dump collect --process-id 12345 -o dump.dmp
dotnet-dump analyze dump.dmp
# > dumpheap -stat       top types by total size
# > dumpheap -mt <addr>  all instances of a type
# > gcroot <addr>        what is keeping this object alive`,
  },
  {
    label: 'BenchmarkDotNet',
    language: 'csharp',
    code: `// dotnet add package BenchmarkDotNet
// Run: dotnet run -c Release

[MemoryDiagnoser]
[ShortRunJob]    // fewer iterations for dev iteration — remove for final numbers
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
    public string StringBuilder()
    {
        var sb = new StringBuilder();
        for (var i = 0; i < N; i++)
            sb.Append(i);
        return sb.ToString();
    }

    [Benchmark]
    public string StringBuilderPooled()
    {
        var sb = _pool.Get();
        try
        {
            for (var i = 0; i < N; i++)
                sb.Append(i);
            return sb.ToString();
        }
        finally { _pool.Return(sb); }
    }
}

class Program { static void Main() => BenchmarkRunner.Run<StringBenchmarks>(); }

// Typical results (N=1000):
// | Method               | Mean     | Allocated |
// |----------------------|----------|-----------|
// | StringConcat         | 1,200 us | 2,450 KB  |
// | StringBuilder        |    42 us |    18 KB  |
// | StringBuilderPooled  |    40 us |     2 KB  |`,
  },
  {
    label: 'ObjectPool & ArrayPool',
    language: 'csharp',
    code: `// ── ObjectPool<StringBuilder> ───────────────────────────────────────────────
// Register: builder.Services.AddSingleton(new DefaultObjectPoolProvider().CreateStringBuilderPool());

public class ReportBuilder(ObjectPool<StringBuilder> pool)
{
    public string BuildReport(IEnumerable<Order> orders)
    {
        var sb = pool.Get();
        try
        {
            sb.AppendLine("Order Report");
            foreach (var o in orders)
                sb.AppendLine($"{o.Id}: {o.Total:C}");
            return sb.ToString();
        }
        finally
        {
            pool.Return(sb);   // clears and returns to pool
        }
    }
}

// ── ArrayPool<byte> ──────────────────────────────────────────────────────────
public async Task<byte[]> HashFileAsync(string path)
{
    using var stream = File.OpenRead(path);
    var buffer = ArrayPool<byte>.Shared.Rent(81920);
    try
    {
        using var sha = SHA256.Create();
        int read;
        while ((read = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            sha.TransformBlock(buffer, 0, read, null, 0);
        sha.TransformFinalBlock([], 0, 0);
        return sha.Hash!;
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer);  // always return, even on exception
    }
}`,
  },
  {
    label: 'Common Perf Patterns',
    language: 'csharp',
    code: `// 1. Use IAsyncEnumerable for streaming large result sets
app.MapGet("/orders", async IAsyncEnumerable<Order> (AppDbContext db) =>
    db.Orders.AsAsyncEnumerable());   // streams rows, does not buffer all in memory

// 2. Avoid ToList() mid-chain
// BAD: loads ALL users then filters in memory
var activeUsers = db.Users.ToList().Where(u => u.IsActive);

// GOOD: filters in SQL
var activeUsers2 = db.Users.Where(u => u.IsActive).ToList();

// 3. Always pass CancellationToken — saves resources on client disconnect
app.MapGet("/slow", async (CancellationToken ct) =>
{
    await Task.Delay(5000, ct);
    return "done";
});

// 4. Avoid large object captures in lambdas (prevents GC)
// BAD: bigList is captured — stays alive as long as the delegate
var bigList = Enumerable.Range(0, 100_000).ToList();
var handler = () => bigList.Count;

// GOOD: capture only what you need
var count   = bigList.Count;
var handler2 = () => count;

// 5. Use Span<T> for stack-allocated slices (no heap allocation)
public static int ParseFirstInt(string csv)
{
    var span = csv.AsSpan();
    var comma = span.IndexOf(',');
    return int.Parse(comma < 0 ? span : span[..comma]);
}`,
  },
];

const challenge: Challenge = {
  title: 'Benchmark & Optimise a String Endpoint',
  language: 'csharp',
  description: 'You have an endpoint that builds a large CSV string with string concatenation. Optimise it:\n1. Write a BenchmarkDotNet benchmark comparing: string concat vs `StringBuilder` vs `ObjectPool<StringBuilder>`.\n2. Replace the endpoint implementation with the pooled version.\n3. Enable response compression (Brotli) for `text/csv`.\n4. Verify allocations decrease using `[MemoryDiagnoser]`.',
  hints: [
    'Install BenchmarkDotNet and run dotnet run -c Release',
    'Register ObjectPool<StringBuilder> as Singleton via DefaultObjectPoolProvider',
    'AddResponseCompression with MimeTypes including text/csv',
    '[MemoryDiagnoser] adds the Allocated column to benchmark results',
  ],
  starterCode: `app.MapGet("/export", (int rows) =>
{
    var csv = "id,name,value\\n";
    for (var i = 0; i < rows; i++)
        csv += $"{i},item-{i},{i * 1.5}\\n";    // O(n²) allocations
    return Results.Text(csv, "text/csv");
});`,
  solution: `// Register in Program.cs
builder.Services.AddSingleton(new DefaultObjectPoolProvider().CreateStringBuilderPool());
builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["text/csv"]);
});
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
    [Params(1000)] public int Rows { get; set; }
    private static readonly ObjectPool<StringBuilder> _pool =
        new DefaultObjectPoolProvider().CreateStringBuilderPool();

    [Benchmark(Baseline = true)]
    public string Concat()
    {
        var s = string.Empty;
        for (var i = 0; i < Rows; i++) s += $"{i},item-{i},{i * 1.5:F1}\n";
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
                sb.AppendLine($"{i},item-{i},{i * 1.5:F1}");
            return sb.ToString();
        }
        finally { _pool.Return(sb); }
    }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should you never benchmark .NET code with Stopwatch in a unit test?',
    options: [
      'Stopwatch is not thread-safe',
      'JIT warmup, GC pauses, and OS timer resolution make Stopwatch measurements unreliable for micro-benchmarks',
      'Stopwatch only measures wall-clock time, not CPU time',
      'Unit tests run in Debug mode which disables Stopwatch',
    ],
    answer: 1,
    explanation: 'The first run incurs JIT compilation. GC can pause execution mid-measurement. Timer resolution on Windows is ~15 ms. BenchmarkDotNet handles all of these with warmup runs, many iterations, and statistical analysis.',
  },
  {
    q: 'What is the key benefit of ArrayPool<T>.Shared.Rent() over new byte[size]?',
    options: [
      'Rented arrays are always zero-initialised',
      'Rented arrays avoid a heap allocation — the buffer is reused from the pool, reducing GC pressure',
      'Rented arrays can exceed the 2 GB array size limit',
      'Rented arrays are pinned in memory for direct IO',
    ],
    answer: 1,
    explanation: 'ArrayPool.Rent() returns an existing buffer from a shared pool rather than allocating on the heap, significantly reducing Gen 0/1 GC churn in high-throughput scenarios.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is dotnet-counters most useful for in production?',
    a: 'Real-time triage of live production issues without stopping the process. Key signals: gen-0-gc-count (allocation pressure), threadpool-queue-length (CPU saturation), requests-per-second (throughput regression), and exception-count (error rate).',
  },
  {
    q: 'When does response compression actually slow things down?',
    a: 'When the response is already compressed (JPEG, PNG, video), or when the response is very small (<1 KB) and compression overhead exceeds the bandwidth saving. Also avoid for HTTP/1.0 responses.',
  },
  {
    q: 'What is a captive StringBuilder in ObjectPool?',
    a: 'ObjectPool<StringBuilder> calls sb.Clear() on Return but does NOT reset the capacity. A StringBuilder that grew to 10 MB stays at 10 MB in the pool. For pools shared across many operations, check the capacity before returning and discard oversized instances rather than returning them.',
  },
];

@Component({
  selector: 'app-aspnet-performance',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './performance.html',
  styleUrl: './performance.scss',
})
export class AspnetPerformance {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
