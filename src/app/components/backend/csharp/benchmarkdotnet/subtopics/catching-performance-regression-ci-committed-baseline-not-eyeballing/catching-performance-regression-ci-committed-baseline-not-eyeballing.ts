import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-catching-performance-regression-ci-committed-baseline-not-eyeballing-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './catching-performance-regression-ci-committed-baseline-not-eyeballing.html',
  styleUrl: './catching-performance-regression-ci-committed-baseline-not-eyeballing.scss',
})
export class CatchingPerformanceRegressionCiCommittedBaselineNotEyeballingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Q&A mentions CI integration in passing — this is the concrete "test" you actually write',
      points: [
        'The main BenchmarkDotNet page\'s Q&amp;A briefly mentions committing "a baseline file" and comparing against it in CI, but does not show what that comparison actually looks like. A BDN results table is just numbers on a screen until something FAILS THE BUILD when a change makes code meaningfully slower or allocates meaningfully more — this subtopic covers that concrete gate.',
      ],
    },
    {
      heading: 'BDN exports results as structured JSON — this is what a regression check actually diffs, not the human-readable Markdown table',
      points: [
        '<code>[JsonExporter]</code> (or the <code>DefaultConfig</code> with a JSON exporter added) writes each benchmark\'s <code>Mean</code>, <code>Allocated</code>, and other statistics to a machine-readable JSON file in <code>BenchmarkDotNet.Artifacts/results/</code>. This file, committed to source control as the CURRENT baseline, is what a later CI run diffs its OWN fresh results against — never a human staring at a Markdown table trying to remember what last week\'s numbers were.',
        'A regression check is a simple, deterministic comparison: for each benchmark method present in BOTH the baseline and the new run, compute the percentage change in <code>Mean</code> (and separately in <code>Allocated</code>), and FAIL if either exceeds a configured tolerance (e.g., 10% slower, or ANY new non-zero allocation on a benchmark that previously allocated 0 B) — this is exactly the same shape as a snapshot test, just for performance numbers instead of string output.',
      ],
    },
    {
      heading: 'A meaningful tolerance threshold, not an exact-match comparison, is essential — benchmark numbers have natural run-to-run variance',
      points: [
        'BDN\'s own <code>Error</code>/<code>StdDev</code> columns exist precisely because a single run\'s Mean is a statistical ESTIMATE, not an exact value — machine load, thermal throttling, and background processes cause small run-to-run fluctuations even with IDENTICAL code. A regression check comparing exact values would fail on pure noise constantly; the threshold must be set comfortably above normal variance (commonly 5-15% for Mean, and typically ZERO tolerance for Allocated, since allocation counts are far more deterministic than timing and any increase there usually indicates a genuine code change, not noise).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Exporting a baseline as JSON — committed to the repo',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Exporters.Json;
using BenchmarkDotNet.Running;

var config = DefaultConfig.Instance
    .AddExporter(new JsonExporter(fileNameSuffix: "-baseline", indentJson: true));

BenchmarkRunner.Run<StringBenchmarks>(config, args);

[MemoryDiagnoser]
public class StringBenchmarks
{
    private const string Line = "2024-01-15,Alice,Engineering,95000";

    [Benchmark(Baseline = true)]
    public string Substring() => Line.Substring(10, 5);

    [Benchmark]
    public ReadOnlySpan<char> AsSpan() => Line.AsSpan(10, 5);
}

// Produces: BenchmarkDotNet.Artifacts/results/StringBenchmarks-report-baseline.json
// Committed to the repo at: benchmarks/baselines/StringBenchmarks.json
// Contains structured data per benchmark:
// { "Method": "Substring", "Statistics": { "Mean": 15.23 }, "Memory": { "BytesAllocatedPerOperation": 32 } }
// { "Method": "AsSpan",    "Statistics": { "Mean": 2.14 },  "Memory": { "BytesAllocatedPerOperation": 0 } }`,
    },
    {
      label: 'A regression-check script — the actual "test" that fails the build',
      language: 'csharp',
      code: `// A small console tool (or a build-time script), run in CI AFTER a
// fresh benchmark run, comparing its JSON output against the committed
// baseline — this is the executable equivalent of a snapshot test:
using System.Text.Json;

record BenchmarkResult(string Method, double Mean, long AllocatedBytes);

static List<BenchmarkResult> ParseResults(string jsonPath)
{
    using var doc = JsonDocument.Parse(File.ReadAllText(jsonPath));
    return doc.RootElement.GetProperty("Benchmarks").EnumerateArray()
        .Select(b => new BenchmarkResult(
            b.GetProperty("Method").GetString()!,
            b.GetProperty("Statistics").GetProperty("Mean").GetDouble(),
            b.GetProperty("Memory").GetProperty("BytesAllocatedPerOperation").GetInt64()))
        .ToList();
}

const double MeanRegressionTolerance = 0.10; // 10% slower fails the build

var baseline = ParseResults("benchmarks/baselines/StringBenchmarks.json");
var current  = ParseResults("BenchmarkDotNet.Artifacts/results/StringBenchmarks-report-full.json");

var failures = new List<string>();
foreach (var baselineResult in baseline)
{
    var currentResult = current.FirstOrDefault(c => c.Method == baselineResult.Method);
    if (currentResult is null) continue; // method removed/renamed — not a regression check concern here

    double meanChange = (currentResult.Mean - baselineResult.Mean) / baselineResult.Mean;
    if (meanChange > MeanRegressionTolerance)
        failures.Add(\$"{baselineResult.Method}: Mean regressed {meanChange:P1} ({baselineResult.Mean:F2}ns → {currentResult.Mean:F2}ns)");

    // Allocated bytes are far more deterministic than timing — ANY
    // increase from a previously-zero-allocation benchmark is treated
    // as a genuine regression, not noise:
    if (baselineResult.AllocatedBytes == 0 && currentResult.AllocatedBytes > 0)
        failures.Add(\$"{baselineResult.Method}: now allocates {currentResult.AllocatedBytes} B, was 0 B");
}

if (failures.Count > 0)
{
    Console.Error.WriteLine("Performance regression(s) detected:");
    foreach (var f in failures) Console.Error.WriteLine($"  - {f}");
    Environment.Exit(1);  // fails the CI build
}

Console.WriteLine("No performance regressions detected.");`,
    },
    {
      label: 'Wiring it into CI — two jobs, benchmark then compare',
      language: 'csharp',
      code: `# .github/workflows/benchmark-regression.yml
name: Benchmark Regression Check
on: [pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '9.0.x' }

      # Run the actual benchmarks — Release mode is mandatory, BDN
      # itself refuses to give meaningful numbers otherwise:
      - run: dotnet run -c Release --project benchmarks/StringBenchmarks

      # Run the comparison tool from the previous tab against the
      # committed baseline — fails the PR check if any regression
      # exceeds the configured tolerance:
      - run: dotnet run -c Release --project benchmarks/RegressionChecker

  # A SEPARATE, manually-triggered step updates the committed baseline
  # ONLY when a real, intentional performance change lands (never as
  # part of the automatic PR check itself, since that would silently
  # accept every regression as the new "normal"):
  # dotnet run -c Release --project benchmarks/StringBenchmarks -- --exporters json
  # cp BenchmarkDotNet.Artifacts/results/*.json benchmarks/baselines/
  # git commit -m "chore(bench): update performance baseline after intentional change"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s regression checker uses a flat 10% tolerance for ALL benchmark methods\' Mean values. A very fast benchmark (Mean = 2 nanoseconds) starts failing the CI check every few runs even with no code changes, while a slower benchmark (Mean = 500 microseconds) never has this problem. Explain why, and propose a better tolerance strategy.',
    hint: 'Consider what a fixed PERCENTAGE tolerance means in ABSOLUTE terms for a very small Mean value — a tiny nanosecond-scale measurement has proportionally much more natural run-to-run noise relative to its own magnitude than a much larger, millisecond-scale one.',
    solution: `// The flaky 2ns benchmark:
[Benchmark]
public ReadOnlySpan<char> AsSpan() => Line.AsSpan(10, 5); // Mean ~2.14 ns

// WHY IT FAILS INTERMITTENTLY WITH A FLAT 10% TOLERANCE:
// At the nanosecond scale, the ABSOLUTE size of normal measurement
// noise (timer resolution granularity, tiny scheduler jitter, thermal
// variance) is roughly CONSTANT across runs — say, +/- 0.3ns of natural
// variance regardless of what's being measured. For a 2.14ns baseline,
// that +/-0.3ns noise band is already close to 15% of the baseline
// value BY ITSELF, with ZERO actual code change — easily enough to
// intermittently exceed a flat 10% tolerance purely by chance.
//
// For the 500-microsecond benchmark, that SAME +/-0.3ns of absolute
// timer noise is a vanishingly small fraction of the total (0.00006%)
// — utterly swamped by the benchmark's own actual execution time, so
// a 10% tolerance there is comfortably wide and essentially never
// triggers on noise alone.
//
// THE FIX — do not use ONE flat percentage tolerance for every
// benchmark regardless of scale. Better strategies:
//
// 1. Use BDN's OWN reported Error/StdDev from the CURRENT run as part
//    of the comparison — only flag a regression if the change exceeds
//    some multiple (e.g. 3x) of the CURRENT run's own StdDev, which
//    naturally scales with each benchmark's own measurement noise:
if (Math.Abs(currentResult.Mean - baselineResult.Mean) > 3 * currentResult.StdDev
    && meanChange > MeanRegressionTolerance)
{
    failures.Add(/* ... */);
}

// 2. Set a MINIMUM ABSOLUTE THRESHOLD alongside the percentage one —
//    e.g. "only flag if the absolute Mean difference exceeds 1ns AND
//    the percentage exceeds 10%" — this exempts ultra-fast benchmarks
//    from noise-driven false failures while still catching genuine
//    regressions once they cross a meaningful absolute threshold too.
//
// 3. For genuinely nanosecond-scale hot-path benchmarks specifically,
//    consider a LOOSER percentage tolerance (e.g. 25-30%) alongside a
//    tighter one for millisecond+-scale benchmarks — acknowledging
//    that noise-to-signal ratio is fundamentally scale-dependent rather
//    than applying one blanket rule to every benchmark in the suite.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a BenchmarkDotNet regression check should use an exact-match comparison against the baseline — any difference at all should fail the build.',
      reality: 'benchmark Mean values have natural run-to-run variance even with identical code — a meaningful tolerance threshold (commonly 5-15% for timing) is required to avoid the check failing constantly on pure measurement noise.',
    },
    {
      thought: 'a flat percentage tolerance (e.g. "10% slower fails") works equally well for every benchmark in a suite, regardless of how fast or slow each one is.',
      reality: 'absolute measurement noise is roughly constant across benchmarks of different scales, making a fixed percentage tolerance proportionally much tighter (and more failure-prone) for very fast, nanosecond-scale benchmarks than for slower ones.',
    },
    {
      thought: 'the baseline file used for regression comparison should be updated automatically on every CI run, keeping it always in sync with the latest results.',
      reality: 'auto-updating the baseline on every run would silently accept every regression as the new normal — the baseline should only be updated deliberately, as its own separate, reviewed step, when an intentional performance change actually lands.',
    },
  ];
}
