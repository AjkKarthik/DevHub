import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-when-mean-lies-bimodal-distribution-hides-two-performance-paths-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './when-mean-lies-bimodal-distribution-hides-two-performance-paths.html',
  styleUrl: './when-mean-lies-bimodal-distribution-hides-two-performance-paths.scss',
})
export class WhenMeanLiesBimodalDistributionHidesTwoPerformancePathsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page teaches you to read Mean, Error, and StdDev — but a single Mean can describe a benchmark that NEVER actually runs at that speed',
      points: [
        'The main BenchmarkDotNet page explains Mean ("average execution time per operation") and StdDev ("consistency of results") as the primary columns to read. This works perfectly when a benchmark\'s individual iteration times cluster around ONE central value. It becomes actively MISLEADING when the benchmarked operation has TWO (or more) genuinely different execution paths with very different costs — a "cache hit" path and a "cache miss" path, for example — because the Mean reported is a single number that no individual run of the operation ever actually takes.',
      ],
    },
    {
      heading: 'A bimodal distribution: half the calls are fast, half are slow, and the Mean sits in a "valley" neither group ever visits',
      points: [
        'Consider a lookup method where 90% of calls hit an in-memory cache (fast, say 5ns) and 10% miss and must recompute (slow, say 200ns). The Mean across many iterations works out to roughly <code>0.9 × 5 + 0.1 × 200 = 24.5ns</code> — but NO individual call of this method EVER actually takes 24.5ns; every single call is either genuinely ~5ns or genuinely ~200ns. Reporting "24.5ns average" describes a speed the operation literally never exhibits.',
        'BDN is aware of this problem and specifically checks for it: when it detects a MULTIMODAL distribution in the raw iteration measurements, it prints an explicit warning in the console output ("MultimodalDistribution" or similar), and its <code>-e</code> (exporters) can include a full histogram export showing the actual shape of the distribution — but this warning is easy to miss if you only glance at the summary table\'s Mean/Error/StdDev columns and move on.',
      ],
    },
    {
      heading: 'The Percentiles and Min/Max columns (enabled via a StatisticColumn config) reveal what Mean alone hides',
      points: [
        'Adding <code>[MinColumn, MaxColumn]</code> or a percentile-based statistics config to a benchmark surfaces the ACTUAL range of individual measurements — a huge gap between <code>Min</code> (~5ns) and <code>Max</code> (~200ns) alongside a "reasonable-looking" Mean and StdDev is the tell-tale sign of exactly this bimodal situation, prompting a deeper look (a full histogram export, or splitting the benchmark into two SEPARATE, explicitly-labeled benchmark methods — one for the cache-hit path, one for the cache-miss path — which is usually the RIGHT fix, since averaging genuinely different behaviours together was the wrong measurement in the first place).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A benchmark that silently hides a bimodal distribution behind one Mean',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]
public class CacheLookupBenchmarks
{
    private readonly Dictionary<int, string> _cache = new();
    private readonly Random _rng = new(42);
    private int[] _keys = null!;

    [GlobalSetup]
    public void Setup()
    {
        // Pre-populate 90% of the keys we'll query — the other 10%
        // will be genuine cache MISSES requiring expensive recomputation:
        _keys = Enumerable.Range(0, 1000).ToArray();
        foreach (var key in _keys.Take(900))
            _cache[key] = ComputeExpensiveValue(key);
    }

    [Benchmark]
    public string LookupOrCompute()
    {
        int key = _keys[_rng.Next(_keys.Length)];
        if (_cache.TryGetValue(key, out var cached))
            return cached;                    // FAST path — ~5ns

        var computed = ComputeExpensiveValue(key);  // SLOW path — ~200ns
        _cache[key] = computed;
        return computed;
    }

    private string ComputeExpensiveValue(int key) =>
        System.Security.Cryptography.SHA256.HashData(BitConverter.GetBytes(key)).ToString()!;
}

// Reported summary (what most people glance at and stop reading):
// | Method           | Mean     | Error   | StdDev  |
// |------------------|----------|---------|---------|
// | LookupOrCompute  | 24.51 ns | 1.2 ns  | 8.3 ns  |
//
// This "24.51 ns" is a number NO individual call ever actually takes —
// every call is either genuinely ~5ns or genuinely ~200ns, never
// anything in between.`,
    },
    {
      label: 'Surfacing the hidden bimodality — Min/Max and BDN\'s own console warning',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Columns;
using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Running;

var config = ManualConfig.Create(DefaultConfig.Instance)
    .AddColumn(StatisticColumn.Min, StatisticColumn.Max, StatisticColumn.P90);

BenchmarkRunner.Run<CacheLookupBenchmarks>(config, args);

// Now the results table reveals what Mean alone hid:
// | Method           | Mean     | Min     | P90      | Max      |
// |------------------|----------|---------|----------|----------|
// | LookupOrCompute  | 24.51 ns | 4.92 ns | 198.7 ns | 203.4 ns |
//
// A ~40x gap between Min and Max, with P90 sitting right near Max
// rather than smoothly between Min and Mean, is the tell-tale
// numerical signature of a bimodal (or worse, multimodal) distribution
// — the single "24.51 ns" Mean was quietly averaging together two
// genuinely different behaviours.
//
// BDN ALSO detects this automatically in many cases and prints a
// console warning during the run itself:
// // * Warnings *
// // MultimodalDistribution
// //   LookupOrCompute: MValue = 3.21
// // (a heuristic statistic BDN computes specifically to flag
// //  likely-multimodal iteration measurements — worth reading the
// //  console output, not just the final summary table)`,
    },
    {
      label: 'The real fix — split into two explicitly-labeled benchmarks instead of one averaged one',
      language: 'csharp',
      code: `[MemoryDiagnoser]
public class CacheLookupBenchmarksSplit
{
    private readonly Dictionary<int, string> _cache = new();

    [GlobalSetup]
    public void Setup() => _cache[1] = ComputeExpensiveValue(1);

    // Two SEPARATE, honestly-labeled benchmarks — each one now
    // measures ONE genuinely consistent code path, and each Mean is
    // a number that path ACTUALLY exhibits on every single call:
    [Benchmark]
    public string CacheHit() => _cache[1];  // always hits — consistent ~5ns

    [Benchmark]
    public string CacheMiss()
    {
        var computed = ComputeExpensiveValue(2);  // always recomputes — consistent ~200ns
        return computed;
    }

    private string ComputeExpensiveValue(int key) =>
        System.Security.Cryptography.SHA256.HashData(BitConverter.GetBytes(key)).ToString()!;
}

// | Method    | Mean     |
// |-----------|----------|
// | CacheHit  |   5.1 ns |
// | CacheMiss | 201.3 ns |
//
// BOTH numbers are now genuinely meaningful — each describes a real,
// consistent behaviour, and a reader can reason about the 90/10 hit
// ratio SEPARATELY (as a business/workload assumption) rather than
// having it silently baked into one misleading averaged number.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team benchmarks a connection-pooling method and gets Mean = 850 microseconds with a moderate StdDev. They conclude the pool is "reasonably fast" and ship it. In production, some requests take 50 microseconds and others take 5 milliseconds, with almost none near 850 microseconds. What went wrong with how the benchmark was read, and what should have been checked before drawing that conclusion?',
    hint: 'Consider that a pool with an available connection versus a pool that must create a brand-new connection are two fundamentally different code paths with very different costs — exactly the shape of problem this subtopic covers — and what column, beyond Mean/StdDev, would have revealed this before shipping.',
    solution: `// The benchmark, as likely written:
[Benchmark]
public async Task<Connection> GetConnection() => await _pool.RentAsync();

// Mean = 850us, moderate StdDev — LOOKS like a single, consistent cost.

// WHAT WENT WRONG: the team read ONLY Mean and StdDev and concluded
// "reasonably fast" — but a connection pool has (at minimum) two
// STRUCTURALLY different code paths bundled into ONE benchmark method:
//   - Path A: an idle connection is available in the pool — genuinely
//     fast, maybe ~50us (matches production's fast requests).
//   - Path B: the pool is exhausted and must ESTABLISH A NEW connection
//     (TCP handshake, auth, etc.) — genuinely slow, maybe ~5ms (matches
//     production's slow requests).
// The 850us Mean is the WEIGHTED AVERAGE of however often the benchmark
// happened to hit each path DURING THAT SPECIFIC RUN — a number neither
// actual production code path ever really exhibits, exactly as this
// subtopic's cache example demonstrates.

// WHAT SHOULD HAVE BEEN CHECKED FIRST: adding Min/Max/percentile
// columns (or just watching for BDN's own MultimodalDistribution
// console warning) BEFORE concluding anything from Mean alone:
var config = ManualConfig.Create(DefaultConfig.Instance)
    .AddColumn(StatisticColumn.Min, StatisticColumn.Max, StatisticColumn.P95);
// A ~100x gap between Min (~50us) and Max (~5ms) would have immediately
// signaled "this Mean is hiding two very different behaviours" —
// exactly the numerical fingerprint from the earlier cache example.

// THE CORRECT BENCHMARK STRUCTURE — split into explicitly distinct,
// individually meaningful scenarios, matching how the pool ACTUALLY
// behaves under different conditions, rather than one averaged number
// that represents neither:
[Benchmark]
public async Task<Connection> GetConnection_PoolWarm()
{
    // GlobalSetup pre-warms the pool with an idle connection available
    return await _pool.RentAsync();
}

[Benchmark]
public async Task<Connection> GetConnection_PoolExhausted()
{
    // GlobalSetup/IterationSetup forces the pool to be empty, requiring
    // a brand-new connection to be established
    return await _pool.RentAsync();
}
// Now BOTH numbers are individually honest, and the team can reason
// about the ACTUAL production hit-rate between "warm" and "exhausted"
// as an EXPLICIT, separate consideration — rather than it being
// silently, invisibly baked into one misleading averaged Mean.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the Mean column in a BenchmarkDotNet results table always describes a value close to what any individual call of that method actually experiences.',
      reality: 'when a benchmark bundles two genuinely different code paths (a fast path and a slow path) into one method, the Mean is a weighted average that no individual call ever actually exhibits — a bimodal distribution can produce a Mean that sits in a "valley" between two real clusters of measurements.',
    },
    {
      thought: 'a moderate StdDev value is enough evidence that a benchmark\'s measurements are reasonably consistent and centered around the Mean.',
      reality: 'StdDev alone does not distinguish a genuinely unimodal (single-cluster) distribution from a bimodal one — Min/Max, percentile columns, or BDN\'s own multimodal-distribution warning are needed to actually detect this, since StdDev can look "moderate" even when two very different clusters exist.',
    },
    {
      thought: 'if a benchmarked operation has multiple possible code paths (like a cache hit versus a cache miss), one combined benchmark measuring the realistic overall mix is always the most useful way to benchmark it.',
      reality: 'splitting into separate, explicitly-labeled benchmarks for each distinct code path usually produces more genuinely useful numbers — each Mean then describes a real, consistent behaviour, and the relative frequency of each path becomes an explicit, separately-reasoned-about assumption rather than a silent, invisible weighting baked into one number.',
    },
  ];
}
