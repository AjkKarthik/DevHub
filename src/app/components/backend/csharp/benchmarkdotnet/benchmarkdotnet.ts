import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-benchmarkdotnet',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './benchmarkdotnet.html',
  styleUrl: './benchmarkdotnet.scss',
})
export class CsharpBenchmarkdotnet {

  prerequisites: Prerequisite[] = [
    { label: 'Span<T> & Memory<T>', route: '/csharp/span-memory' },
    { label: 'LINQ',               route: '/csharp/linq' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '[Benchmark]',          type: 'accessor', desc: 'Marks a method as a benchmark — BDN measures its execution time and allocations', since: 'BDN 0.x' },
    { name: '[GlobalSetup]',        type: 'accessor', desc: 'Runs once before all benchmark iterations — use for one-time expensive setup', since: 'BDN 0.x' },
    { name: '[IterationSetup]',     type: 'accessor', desc: 'Runs before each iteration — use for per-run state resets', since: 'BDN 0.x' },
    { name: '[Params]',             type: 'accessor', desc: 'Parameterises benchmarks — runs all combinations: [Params(100, 1000, 10000)] int N', since: 'BDN 0.x' },
    { name: '[MemoryDiagnoser]',    type: 'accessor', desc: 'Adds Allocated (bytes/op) column to results — shows GC allocation per operation', since: 'BDN 0.x' },
    { name: '[SimpleJob]',          type: 'accessor', desc: 'Configures warmup + iterations: [SimpleJob(RuntimeMoniker.Net90, warmupCount:3)]', since: 'BDN 0.x' },
    { name: 'BenchmarkRunner.Run',  type: 'method',   desc: 'Entry point: BenchmarkRunner.Run<MyBenchmarks>(args) — run in Release mode', since: 'BDN 0.x' },
    { name: 'BenchmarkSwitcher',    type: 'class',    desc: 'BenchmarkSwitcher.FromAssembly(assembly).Run(args) — interactive benchmark selection', since: 'BDN 0.x' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Stopwatch is not enough',
      points: [
        'Measuring performance with <code>Stopwatch</code> gives misleading results: the first call is slower due to JIT compilation, the OS scheduler interferes with short measurements, GC collections happen at random moments, CPU caches are cold on the first iteration, and the measurement loop itself has overhead.',
        'BenchmarkDotNet (BDN) solves all of these: it runs a JIT warmup phase before measuring, executes enough iterations to get statistically reliable results, controls GC between runs, reports confidence intervals, and separates setup from measurement. The result is comparable, reproducible data.',
        'BDN is the official .NET performance benchmarking library, maintained by the .NET Foundation. It is used throughout the .NET BCL itself to track performance regressions. Third-party claims of "X is 3× faster" without BDN numbers (and allocation data) should be treated with skepticism.',
        'The golden rule: measure in Release mode with optimisations enabled. Debug builds disable inlining and other optimisations — they measure the JIT\'s unoptimised output, not what ships to production. BDN enforces Release mode and will warn if you run it in Debug.',
      ],
    },
    {
      heading: 'Setting up a benchmark project',
      points: [
        'Create a separate console project for benchmarks (never mix with production code — setup overhead, slower builds, no interference). Add <code>BenchmarkDotNet</code> NuGet package. Set <code>&lt;AllowUnsafeBlocks&gt;true&lt;/AllowUnsafeBlocks&gt;</code> if benchmarking unsafe code.',
        'Mark benchmark methods with <code>[Benchmark]</code>. The class does not need any base class or interface — BDN discovers it by reflection. Run via <code>BenchmarkRunner.Run&lt;MyBenchmarks&gt;(args)</code> in <code>Main()</code>.',
        'The <code>[GlobalSetup]</code> method runs once before any benchmark iteration — ideal for creating test data, opening files, or building look-up tables. The <code>[IterationSetup]</code> runs before each iteration — use it when a benchmark mutates state (e.g., filling a collection) that must be reset between runs.',
        'BDN exports results in multiple formats: Markdown tables, HTML reports, CSV, and JSON. By default results go to the <code>BenchmarkDotNet.Artifacts/</code> folder. The Markdown export is ideal for GitHub PR comments showing before/after performance comparisons.',
      ],
    },
    {
      heading: 'Reading the results table',
      points: [
        'The key columns in a BDN results table: <strong>Method</strong> (which benchmark), <strong>Mean</strong> (average execution time per operation), <strong>Error</strong> (half of the 99.9% confidence interval — how certain we are), <strong>StdDev</strong> (standard deviation — consistency of results).',
        '<strong>Ratio</strong> column (when using [Benchmark(Baseline = true)]): shows relative performance vs the baseline. 1.00 = same speed, 0.50 = 2× faster, 2.00 = 2× slower. This is the cleanest way to communicate improvements.',
        '<strong>Allocated</strong> column (requires [MemoryDiagnoser]): bytes allocated on the heap per operation. 0 B means zero heap allocation — the holy grail for hot-path optimisations. This column often reveals the real bottleneck more clearly than execution time.',
        'Gen 0 / Gen 1 / Gen 2 columns (with [MemoryDiagnoser]): GC collection counts per 1000 operations. High Gen 2 counts indicate large long-lived object allocations — a serious performance concern. Gen 0 counts are less alarming (short-lived objects collected quickly).',
      ],
    },
    {
      heading: 'Parameterisation and comparison',
      points: [
        '<code>[Params(10, 100, 1000, 10000)]</code> on a field runs all benchmark methods with each parameter value — showing how performance scales. Combined with multiple benchmark methods, you get a matrix comparing approaches across input sizes.',
        '<code>[Benchmark(Baseline = true)]</code> on one method makes it the baseline; all others show their Ratio relative to it. This is the standard pattern for before/after comparisons: baseline = old approach, others = candidates.',
        '<code>[ParamsSource(nameof(MyData))]</code> lets you provide parameter values from a property or field that returns <code>IEnumerable</code> — useful for complex parameterisation like different JSON payloads or connection strings.',
        'Use <code>[SimpleJob(RuntimeMoniker.Net80), SimpleJob(RuntimeMoniker.Net90)]</code> to run benchmarks across multiple .NET versions in one run — useful for quantifying runtime improvements.',
      ],
    },
    {
      heading: 'Common pitfalls in benchmarking',
      points: [
        'Dead code elimination: the JIT may optimise away a benchmark method that does not produce an observable side effect. Return the result from the method or assign it to a <code>volatile</code> field. BDN provides a <code>BlackHole(result)</code> helper to consume values without the overhead of a field write.',
        'Benchmarking the wrong thing: if the code you intend to measure is not the bottleneck in the loop, you are measuring noise. Profile first with dotnet-trace or Visual Studio profiler to identify where time is actually spent, then benchmark that specific hotspot.',
        'Allocation benchmarks lie when comparing implementations that share a pool: if both use <code>ArrayPool&lt;T&gt;.Shared</code>, the first run pays the pool-population cost and subsequent runs are "free". Always run with enough warmup iterations (BDN defaults are usually correct).',
        'Not enough iterations: BDN auto-configures iteration count based on observed variance. For very fast methods (nanoseconds), it may run millions of iterations to get stable measurements. Do not try to hard-code iteration counts — let BDN decide.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic setup',
      language: 'csharp',
      code: `// BenchmarkProject.csproj
// <PackageReference Include="BenchmarkDotNet" Version="0.14.*" />
// Always run in Release mode: dotnet run -c Release

using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

// Program.cs
BenchmarkRunner.Run<StringBenchmarks>(args);

[MemoryDiagnoser]            // adds Allocated column
[SimpleJob]                  // default job: multiple warmup + measurement iterations
public class StringBenchmarks
{
    private const string Line = "2024-01-15,Alice,Engineering,95000";

    [Benchmark(Baseline = true)]
    public string Substring() => Line.Substring(10, 5);  // allocates new string

    [Benchmark]
    public ReadOnlySpan<char> AsSpan() => Line.AsSpan(10, 5);  // zero allocation

    [Benchmark]
    public bool SubstringEquals() => Line.Substring(10, 5) == "Alice";  // allocates

    [Benchmark]
    public bool SpanEquals() => Line.AsSpan(10, 5).SequenceEqual("Alice");  // no alloc
}

// Example output:
// | Method          | Mean     | Error    | Ratio | Allocated |
// |-----------------|----------|----------|-------|-----------|
// | Substring       | 15.23 ns | 0.31 ns  | 1.00  | 32 B      |
// | AsSpan          |  2.14 ns | 0.04 ns  | 0.14  | -         |
// | SubstringEquals | 18.47 ns | 0.42 ns  | 1.21  | 32 B      |
// | SpanEquals      |  2.98 ns | 0.06 ns  | 0.20  | -         |`,
    },
    {
      label: 'Params & GlobalSetup',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

BenchmarkRunner.Run<CollectionBenchmarks>(args);

[MemoryDiagnoser]
public class CollectionBenchmarks
{
    [Params(100, 1_000, 10_000)]
    public int N;

    private List<int>    _list  = null!;
    private HashSet<int> _set   = null!;
    private int[]        _array = null!;

    [GlobalSetup]  // runs once before all iterations — expensive one-time setup
    public void Setup()
    {
        var rng = new Random(42);
        _list  = Enumerable.Range(0, N).Select(_ => rng.Next(N * 2)).ToList();
        _set   = new HashSet<int>(_list);
        _array = _list.ToArray();
    }

    [Benchmark(Baseline = true)]
    public bool ListContains() => _list.Contains(N / 2);     // O(n) linear scan

    [Benchmark]
    public bool SetContains() => _set.Contains(N / 2);       // O(1) hash lookup

    [Benchmark]
    public int LinqFirst() => _list.First(x => x == N / 2); // O(n) LINQ overhead

    [Benchmark]
    public int ArrayBinarySearch()                            // O(log n) if sorted
    {
        var sorted = (int[])_array.Clone();
        Array.Sort(sorted);
        return Array.BinarySearch(sorted, N / 2);
    }
}

// Results show how performance scales with N — key for capacity planning`,
    },
    {
      label: 'Memory allocation deep-dive',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using System.Buffers;

[MemoryDiagnoser]
public class AllocationBenchmarks
{
    private const int Size = 1024;

    [Benchmark(Baseline = true)]
    public byte[] NewArray()
    {
        var buf = new byte[Size];  // heap allocation every call
        buf[0] = 0xFF;
        return buf;
    }

    [Benchmark]
    public void ArrayPoolRent()
    {
        byte[] buf = ArrayPool<byte>.Shared.Rent(Size);
        try
        {
            buf[0] = 0xFF;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buf);
        }
        // Allocated: ~0 B after warmup (pool pre-populated)
    }

    [Benchmark]
    public void Stackalloc()
    {
        Span<byte> buf = stackalloc byte[256];  // stack — zero heap allocation
        buf[0] = 0xFF;
        // Allocated: 0 B — truly zero
    }

    // Compare string operations
    [Benchmark]
    public string StringFormat()   => string.Format("Hello, {0}! You are {1}.", "Alice", 30);

    [Benchmark]
    public string StringInterp()   => \$"Hello, {"Alice"}! You are {30}.";

    [Benchmark]
    public string StringBuilder()
    {
        var sb = new System.Text.StringBuilder();
        sb.Append("Hello, "); sb.Append("Alice");
        sb.Append("! You are "); sb.Append(30); sb.Append('.');
        return sb.ToString();
    }
}
// Key insight: Allocated column reveals whether an "optimisation" actually
// reduces allocations — execution time alone can be misleading`,
    },
    {
      label: 'Multi-job & exporter config',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Environments;
using BenchmarkDotNet.Jobs;
using BenchmarkDotNet.Exporters;
using BenchmarkDotNet.Running;

// Custom config: compare .NET 8 vs .NET 9, add GitHub Markdown exporter
var config = DefaultConfig.Instance
    .AddJob(Job.Default.WithRuntime(CoreRuntime.Core80).WithId(".NET 8"))
    .AddJob(Job.Default.WithRuntime(CoreRuntime.Core90).WithId(".NET 9"))
    .AddExporter(MarkdownExporter.GitHub)   // outputs results/BenchmarkDotNet.Artifacts/*.md
    .AddExporter(HtmlExporter.Default);     // outputs HTML report

BenchmarkRunner.Run<SerializationBenchmarks>(config, args);

// Alternatively, use attributes on the class:
[Config(typeof(MultiRuntimeConfig))]
[MemoryDiagnoser]
public class SerializationBenchmarks
{
    private readonly Product _product = new(1, "Widget", 9.99m, true);
    private string _json = null!;

    [GlobalSetup]
    public void Setup() => _json = System.Text.Json.JsonSerializer.Serialize(_product);

    [Benchmark(Baseline = true)]
    public string Serialize() => System.Text.Json.JsonSerializer.Serialize(_product);

    [Benchmark]
    public Product? Deserialize() =>
        System.Text.Json.JsonSerializer.Deserialize<Product>(_json);
}

public class MultiRuntimeConfig : ManualConfig
{
    public MultiRuntimeConfig()
    {
        AddJob(Job.Default.WithRuntime(CoreRuntime.Core80).WithId(".NET 8"));
        AddJob(Job.Default.WithRuntime(CoreRuntime.Core90).WithId(".NET 9"));
        AddExporter(MarkdownExporter.GitHub);
    }
}

record Product(int Id, string Name, decimal Price, bool InStock);`,
    },
    {
      label: 'Avoiding dead code elimination',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Engines;

[MemoryDiagnoser]
public class SafeBenchmarks
{
    private readonly Consumer _consumer = new();  // BDN's blackhole consumer

    // WRONG: JIT may eliminate the entire loop body — nothing is used
    // Results will show near-0 ns and are meaningless
    [Benchmark]
    public void WrongLoop_DeadCode()
    {
        for (int i = 0; i < 1000; i++)
        {
            int x = i * i;  // result discarded — JIT eliminates this
        }
    }

    // RIGHT option 1: return the value — JIT must compute it
    [Benchmark]
    public int ReturnResult()
    {
        int sum = 0;
        for (int i = 0; i < 1000; i++)
            sum += i * i;
        return sum;
    }

    // RIGHT option 2: use Consumer (BDN's blackhole) for void methods
    [Benchmark]
    public void UseConsumer()
    {
        for (int i = 0; i < 1000; i++)
            _consumer.Consume(i * i);  // prevents dead-code elimination
    }

    // RIGHT option 3: volatile field write (slight overhead, but reliable)
    private volatile int _sink;

    [Benchmark]
    public void VolatileSink()
    {
        for (int i = 0; i < 1000; i++)
            _sink = i * i;
    }

    // Benchmark with [IterationSetup] — reset mutable state per iteration
    private List<int> _list = null!;

    [IterationSetup(Target = nameof(SortList))]
    public void SetupSort() => _list = Enumerable.Range(0, 1000).Reverse().ToList();

    [Benchmark]
    public List<int> SortList()
    {
        _list.Sort();
        return _list;  // always return; avoids dead-code elimination
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running benchmarks in Debug mode',
      wrong: `// WRONG: Debug mode disables inlining, loop unrolling, and many JIT optimisations
// Results are 10-100× slower than production and completely meaningless

// Running with: dotnet run  (defaults to Debug)
// or: dotnet run -c Debug`,
      right: `// ALWAYS run benchmarks in Release mode
dotnet run -c Release

// Or if using BenchmarkRunner.Run<>():
// BDN will print a warning and refuse to give meaningful results in Debug
// It will say: "Run benchmarks only in Release mode"

// Set up a dedicated benchmark console project:
// <PropertyGroup>
//   <Optimize>true</Optimize>
// </PropertyGroup>`,
      explanation: 'Debug builds disable the JIT optimisations that ship to production — inlining, loop unrolling, branch elimination. Debug benchmark results are meaningless for production performance. BDN will warn you if you run in Debug mode. Never report Debug benchmark numbers.',
    },
    {
      title: 'Not returning or consuming benchmark results (dead code elimination)',
      wrong: `[Benchmark]
public void ComputeHash()
{
    // The JIT sees the result is never used — may eliminate the hash computation entirely
    var hash = System.Security.Cryptography.SHA256.HashData(
        System.Text.Encoding.UTF8.GetBytes("benchmark data"));
    // hash is discarded — benchmark measures near 0 ns
}`,
      right: `[Benchmark]
public byte[] ComputeHash()
{
    // Return the result — JIT must compute it; BDN consumes it
    return System.Security.Cryptography.SHA256.HashData(
        System.Text.Encoding.UTF8.GetBytes("benchmark data"));
}

// Or use Consumer:
private readonly Consumer _consumer = new();

[Benchmark]
public void ComputeHashConsumer()
{
    var hash = System.Security.Cryptography.SHA256.HashData(
        System.Text.Encoding.UTF8.GetBytes("benchmark data"));
    _consumer.Consume(hash);
}`,
      explanation: 'The JIT is smart — if it can determine a computation result is never used, it eliminates the computation entirely. Benchmark shows 0 ns because the code was never executed. Always return the result or pass it to Consumer to force computation.',
    },
    {
      title: 'Putting setup code inside the benchmark method',
      wrong: `[Benchmark]
public int SearchInList()
{
    // WRONG: setup (list creation) is included in measurement
    var list = Enumerable.Range(0, 10_000).ToList();  // measured!
    return list.Contains(5_000) ? 1 : 0;             // also measured
}
// You're benchmarking list creation, not Contains`,
      right: `private List<int> _list = null!;

[GlobalSetup]
public void Setup() => _list = Enumerable.Range(0, 10_000).ToList();

[Benchmark]
public bool SearchInList() => _list.Contains(5_000);  // only Contains measured`,
      explanation: 'GlobalSetup runs before any benchmark iteration — it is excluded from measurement. Putting setup code inside [Benchmark] measures the combined setup + target operation, making it impossible to isolate the operation you care about. Especially egregious when setup is orders of magnitude slower than the operation being benchmarked.',
    },
    {
      title: 'Comparing allocating and non-allocating code without [MemoryDiagnoser]',
      wrong: `// Without [MemoryDiagnoser], the Allocated column is missing
// You cannot tell if the "faster" method also avoids allocations
public class StringBenchmarks
{
    [Benchmark] public string Substring() => "hello world".Substring(0, 5);
    [Benchmark] public ReadOnlySpan<char> Span() => "hello world".AsSpan(0, 5);
}
// Span looks faster — but you don't know about GC pressure`,
      right: `// Add [MemoryDiagnoser] to see allocations per operation
[MemoryDiagnoser]
public class StringBenchmarks
{
    [Benchmark] public string Substring() => "hello world".Substring(0, 5);
    [Benchmark] public ReadOnlySpan<char> Span() => "hello world".AsSpan(0, 5);
}
// Now you see: Substring = 24 B allocated; Span = 0 B — full picture`,
      explanation: 'Execution time alone is incomplete. A method may be fast but allocate heavily, causing GC pauses that dwarf its per-call time in production. Always add [MemoryDiagnoser] when comparing approaches — the Allocated column often reveals the real story.',
    },
  ];

  challenge: Challenge = {
    title: 'Benchmark string splitting approaches',
    language: 'csharp',
    description: `Write a BenchmarkDotNet class that compares three approaches to splitting a CSV line and parsing an integer field:
1. string.Split() → parse field at index 2 with int.Parse()
2. Manual index-of loop with Substring → int.Parse()
3. ReadOnlySpan<char> with manual comma finding → int.TryParse()

Parameterise with N = 100 and 10000 (number of lines to process in a loop).
Add [MemoryDiagnoser]. Use [GlobalSetup] to pre-generate the test lines.
Mark approach 1 as the baseline.`,
    hints: [
      '[Params(100, 10_000)] public int N;',
      '[GlobalSetup] generates N random CSV lines into a string[] field',
      'Each benchmark iterates over all N lines and sums the parsed integers',
      'Return the sum to avoid dead-code elimination',
      'string.Split allocates; Span-based approach should show 0 B allocated',
    ],
    starterCode: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

BenchmarkRunner.Run<CsvBenchmarks>(args);

// TODO: implement CsvBenchmarks class with:
// - [Params(100, 10_000)] int N
// - [GlobalSetup] to generate test data
// - [MemoryDiagnoser]
// - Three benchmark methods
// Return the sum of parsed integers from all lines to prevent dead-code elimination`,
    solution: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

BenchmarkRunner.Run<CsvBenchmarks>(args);

[MemoryDiagnoser]
public class CsvBenchmarks
{
    [Params(100, 10_000)]
    public int N;

    private string[] _lines = null!;

    [GlobalSetup]
    public void Setup()
    {
        var rng = new Random(42);
        _lines = new string[N];
        for (int i = 0; i < N; i++)
            _lines[i] = \$"Alice,Smith,{rng.Next(18, 90)},Engineering,{rng.Next(40000, 120000)}";
    }

    [Benchmark(Baseline = true)]
    public int StringSplit()
    {
        int sum = 0;
        foreach (var line in _lines)
        {
            var parts = line.Split(',');
            sum += int.Parse(parts[2]);
        }
        return sum;
    }

    [Benchmark]
    public int SubstringManual()
    {
        int sum = 0;
        foreach (var line in _lines)
        {
            int c1 = line.IndexOf(',');
            int c2 = line.IndexOf(',', c1 + 1);
            int c3 = line.IndexOf(',', c2 + 1);
            sum += int.Parse(line.Substring(c2 + 1, c3 - c2 - 1));
        }
        return sum;
    }

    [Benchmark]
    public int SpanBased()
    {
        int sum = 0;
        foreach (var line in _lines)
        {
            ReadOnlySpan<char> span = line.AsSpan();
            int c1 = span.IndexOf(',');
            int c2 = span.Slice(c1 + 1).IndexOf(',') + c1 + 1;
            int c3 = span.Slice(c2 + 1).IndexOf(',') + c2 + 1;
            int.TryParse(span.Slice(c2 + 1, c3 - c2 - 1), out int value);
            sum += value;
        }
        return sum;
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is using Stopwatch directly for benchmarking unreliable?',
      options: [
        'Stopwatch is too slow and introduces significant overhead',
        'JIT warmup, OS scheduler interference, GC interference, and cold CPU caches all skew results — making first-run measurements unrepresentative of steady-state performance',
        'Stopwatch cannot measure sub-millisecond times accurately',
        'Stopwatch is not thread-safe and produces inconsistent results',
      ],
      answer: 1,
      explanation: 'A raw Stopwatch measurement includes JIT compilation time (first call), OS context switches, GC pauses, and cold CPU/memory caches. BDN addresses all of these: it runs a warmup phase to JIT-compile and warm caches, runs many iterations to average out noise, and controls GC between measurements.',
    },
    {
      q: 'What does the "Allocated" column in BenchmarkDotNet results show?',
      options: [
        'Total heap memory used by the process',
        'Bytes allocated on the managed heap per operation (requires [MemoryDiagnoser])',
        'Stack memory consumed per benchmark call',
        'Peak memory usage during the entire benchmark run',
      ],
      answer: 1,
      explanation: '[MemoryDiagnoser] enables GC allocation tracking. The Allocated column shows bytes allocated on the managed heap per single benchmark invocation. "0 B" means the method made zero heap allocations — the goal for hot-path optimisations. This column often reveals the true bottleneck more clearly than execution time.',
    },
    {
      q: 'What is the purpose of [GlobalSetup] in a BenchmarkDotNet class?',
      options: [
        'It runs before each iteration and is included in the benchmark measurement',
        'It runs once before all benchmark iterations and is excluded from measurement — for expensive one-time setup like building test data',
        'It configures global BDN settings for the entire benchmark session',
        'It runs after all benchmarks complete to clean up resources',
      ],
      answer: 1,
      explanation: '[GlobalSetup] runs once before BDN begins taking measurements. It is excluded from the timing. Use it for setup that would dominate the benchmark if included — creating large collections, reading files, or building look-up tables. [IterationSetup] runs before each iteration and is also excluded from timing.',
    },
    {
      q: 'Why might a benchmark show near-0 ns execution time even for a complex operation?',
      options: [
        'BenchmarkDotNet automatically parallelises benchmarks to speed them up',
        'The JIT may have eliminated the code via dead-code elimination if the result is never used',
        'The operation is running from CPU cache and is genuinely that fast',
        'BDN\'s warmup phase pre-computes results and replays them during measurement',
      ],
      answer: 1,
      explanation: 'The JIT performs dead-code elimination — if it proves the result of a computation is never observed, it removes the computation entirely. The benchmark loop runs, but does nothing. Always return the result from the benchmark method, or pass it to BDN\'s Consumer to force the JIT to actually execute the code.',
    },
    {
      q: 'What does [Benchmark(Baseline = true)] do in a BenchmarkDotNet class?',
      options: [
        'It makes that benchmark run first to warm up the environment for other benchmarks',
        'It designates that method as the reference point — other methods\' Ratio column shows their performance relative to it (1.00 = same, 0.50 = 2× faster)',
        'It uses a larger warmup count for that specific benchmark',
        'It prevents that benchmark from being excluded by BDN\'s outlier detection',
      ],
      answer: 1,
      explanation: '[Benchmark(Baseline = true)] marks one method as the reference for the Ratio column. All other benchmarks in the class show their Mean divided by the baseline Mean. 1.00 = same speed, 0.50 = twice as fast, 2.00 = twice as slow. This is the standard way to communicate before/after improvements.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I integrate BenchmarkDotNet into CI to catch performance regressions?',
      a: 'Run benchmarks in CI with a fixed seed and a baseline file committed to the repo. BDN\'s ResultsComparer (separate tool) compares current run against the baseline and fails the build if any benchmark regresses beyond a threshold (e.g., 5% slower). Alternatively, use Perfolizer\'s statistical tests (also maintained by the BDN team) for more rigorous regression detection. GitHub Actions + BDN artifacts is a common setup.',
    },
    {
      q: 'Should I benchmark my entire application or specific methods?',
      a: 'Specific methods — but profile first to find the right ones. Use dotnet-trace, dotnet-counters, or Visual Studio profiler to find hotspots under realistic load. Only then write BDN benchmarks for those specific operations. Benchmarking the wrong method is common and wastes effort. The typical workflow: profile → identify hotspot → optimise → benchmark the specific change → confirm improvement.',
    },
    {
      q: 'What is the difference between [IterationSetup] and [GlobalSetup]?',
      a: '[GlobalSetup] runs once before all measurement iterations — correct for creating test data that is read-only or freshly reset by each benchmark call. [IterationSetup] runs before each individual iteration — use when the benchmark mutates its input (e.g., List.Sort() rearranges the list; you must reset it to unsorted before each iteration). Both are excluded from measurement time.',
    },
    {
      q: 'Can BenchmarkDotNet measure I/O, network calls, or database queries?',
      a: 'Yes, but with caveats. BDN can time any async or synchronous code, including I/O. The challenge is variability — network/disk latency varies widely between runs, making statistical confidence harder to achieve. BDN will run many more iterations to compensate. For database benchmarks, mock the DB or use a local in-memory DB (SQLite :memory:). Measuring real network calls in BDN is generally not recommended — use load testing tools (k6, NBomber) instead.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'BenchmarkDotNet is the standard for .NET performance measurement — it handles JIT warmup, iteration counts, GC control, and statistical analysis. Use <code>[MemoryDiagnoser]</code> for allocations, <code>[GlobalSetup]</code> for test data, and always return results to prevent dead-code elimination.',
    mustKnow: [
      'Always run in Release mode: <code>dotnet run -c Release</code>',
      '<code>[Benchmark]</code> marks measured method; <code>[GlobalSetup]</code> = one-time setup excluded from timing',
      '<code>[MemoryDiagnoser]</code> adds Allocated column — bytes per op; 0 B = zero heap allocation',
      '<code>[Benchmark(Baseline = true)]</code> + Ratio column = clean before/after comparison',
      '<code>[Params(100, 1000)]</code> runs all benchmarks × all param values — shows scaling',
      'Return results or use <code>Consumer</code> to prevent JIT dead-code elimination',
    ],
    interviewFocus: [
      '<strong>Why not Stopwatch?</strong> — JIT warmup, OS noise, GC interference; BDN controls all of these',
      '<strong>[MemoryDiagnoser] purpose?</strong> — shows heap bytes allocated per operation; critical for GC pressure analysis',
      '<strong>Dead-code elimination?</strong> — JIT removes unused computations; always return or consume the result',
      '<strong>GlobalSetup vs IterationSetup?</strong> — Global = once before all runs; Iteration = before each run (for mutable inputs)',
    ],
  };
}
