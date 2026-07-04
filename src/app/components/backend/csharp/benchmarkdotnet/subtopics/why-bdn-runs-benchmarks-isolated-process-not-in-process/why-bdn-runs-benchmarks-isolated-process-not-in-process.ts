import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-bdn-runs-benchmarks-isolated-process-not-in-process-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-bdn-runs-benchmarks-isolated-process-not-in-process.html',
  styleUrl: './why-bdn-runs-benchmarks-isolated-process-not-in-process.scss',
})
export class WhyBdnRunsBenchmarksIsolatedProcessNotInProcessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows BenchmarkRunner.Run&lt;T&gt;(args) as if it directly calls your [Benchmark] methods in-process — it does not',
      points: [
        'Every code example on the main BenchmarkDotNet page calls <code>BenchmarkRunner.Run&lt;StringBenchmarks&gt;(args)</code> from inside <code>Main()</code>, which reads as though BDN simply invokes <code>Substring()</code> and <code>AsSpan()</code> directly, in a loop, within the SAME running process. This is a natural but incorrect assumption to make from the code alone — understanding what actually happens explains several BDN behaviours that otherwise look mysterious (why it takes so long just to START measuring, why it generates extra project files, why runtime comparisons work at all).',
      ],
    },
    {
      heading: 'BDN auto-generates, compiles, and launches a SEPARATE, independent console project per benchmark configuration',
      points: [
        'When <code>BenchmarkRunner.Run&lt;T&gt;()</code> executes, BDN generates a brand-new, minimal C# project on disk (under <code>bin/Release/.../BenchmarkDotNet.Auto/</code>) containing ONLY the code needed to run that specific benchmark class under that specific job configuration, compiles it as a standalone executable, and launches it as a CHILD PROCESS — completely separate from the process that called <code>BenchmarkRunner.Run</code>. The actual timing measurements happen entirely inside that generated, isolated child process; the original calling process just orchestrates and collects the results afterward.',
        'This is precisely why running <code>[SimpleJob(RuntimeMoniker.Net80), SimpleJob(RuntimeMoniker.Net90)]</code> "in one run" works at all: BDN literally generates and launches a SEPARATE process for EACH job/runtime combination, each targeting the specific runtime version requested — something that could never happen if benchmarks executed in-process inside whatever single runtime your `Main()` itself is running under.',
      ],
    },
    {
      heading: 'Process isolation exists specifically to eliminate cross-benchmark contamination that in-process execution could never avoid',
      points: [
        'If ALL benchmark methods ran inside ONE long-lived process, JIT tiering state (methods get progressively re-JIT-compiled to more optimized code the more they run), GC generation occupancy, and general memory fragmentation would all accumulate and carry over from EARLIER benchmarks into LATER ones within the same run — making it genuinely impossible to say whether a later benchmark\'s numbers reflect ITS OWN code or lingering effects from whatever ran before it.',
        'A fresh, isolated process per benchmark configuration starts from a clean JIT/GC/memory state EVERY time — this is precisely the same motivation behind the main page\'s own warning about warmup and "cold CPU caches," extended to the PROCESS level rather than just the CPU-cache level: BDN eliminates cross-benchmark contamination structurally, by construction, rather than by trying to reset in-process state perfectly (which is not fully possible for things like JIT tiering decisions).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What it LOOKS like — a single in-process call',
      language: 'csharp',
      code: `// Program.cs — this is ALL your code shows:
using BenchmarkDotNet.Running;

BenchmarkRunner.Run<StringBenchmarks>(args);

// It reads as though BDN just calls StringBenchmarks.Substring() and
// StringBenchmarks.AsSpan() directly, right here, in THIS process —
// but that is not what actually happens at all.`,
    },
    {
      label: 'What ACTUALLY happens — generated project + isolated child process',
      language: 'csharp',
      code: `// When BenchmarkRunner.Run<StringBenchmarks>(args) executes:
//
// 1. BDN reflects over StringBenchmarks, finds every [Benchmark] method
//    and every [Params]/[GlobalSetup] configuration combination.
//
// 2. For EACH job configuration (by default, just one — your current
//    runtime — but MORE if you use [SimpleJob(RuntimeMoniker...)]
//    multiple times, or AddJob() in a custom config), BDN GENERATES a
//    brand-new, minimal C# project on disk:
//
//    bin/Release/net9.0/StringBenchmarks.Auto/
//      Program.cs          ← auto-generated: calls Substring()/AsSpan()
//                             in a tight, precisely-timed measurement loop
//      *.csproj             ← references YOUR compiled assembly, targets
//                             the SPECIFIC runtime this job requests
//
// 3. BDN COMPILES that generated project (dotnet build) as its own
//    standalone executable.
//
// 4. BDN LAUNCHES it as a completely SEPARATE CHILD PROCESS — a fresh
//    process, with its own fresh JIT tiering state, fresh GC heap, no
//    memory fragmentation carried over from anything else:
//    Process.Start("StringBenchmarks.Auto.exe")
//
// 5. The CHILD PROCESS runs the warmup + measurement iterations
//    ENTIRELY within itself, and communicates results back to the
//    ORIGINAL process (the one that called BenchmarkRunner.Run) via
//    its standard output / a results file, which BDN then parses to
//    build the results table you see printed.
//
// This is WHY a single "dotnet run -c Release" for a benchmark project
// can take much longer to even START showing results than the actual
// benchmarked code's total execution time would suggest — most of
// that time is the GENERATE + COMPILE step for each job configuration,
// which happens BEFORE any real measurement begins.`,
    },
    {
      label: 'Why this makes multi-runtime comparison possible at all',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Jobs;
using BenchmarkDotNet.Environments;

[SimpleJob(RuntimeMoniker.Net80)]
[SimpleJob(RuntimeMoniker.Net90)]
[MemoryDiagnoser]
public class RuntimeComparisonBenchmarks
{
    [Benchmark]
    public int SumArray()
    {
        var arr = Enumerable.Range(0, 1000).ToArray();
        return arr.Sum();
    }
}

// If BDN executed benchmarks IN-PROCESS, this would be IMPOSSIBLE —
// a single running .NET process is locked to the ONE runtime version
// it was started with; it cannot suddenly re-execute code under a
// DIFFERENT .NET version mid-run.
//
// Because BDN instead generates and compiles a SEPARATE project TARGETING
// each specific [SimpleJob(RuntimeMoniker...)] and launches EACH as its
// own independent child process (each one built against and started
// under ITS OWN targeted runtime), running ".NET 8" and ".NET 9" "in
// one benchmark run" is really TWO entirely separate generated
// executables, each launched and measured independently, with results
// merged back into one combined table by the ORCHESTRATING process
// afterward — not one process somehow running two runtimes at once.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer wraps <code>BenchmarkRunner.Run&lt;MyBenchmarks&gt;(args)</code> inside an xUnit test method, expecting it to run as part of the normal fast test suite in Debug mode during local development. Explain, based on BDN\'s actual process-isolation execution model, why this is a fundamentally bad idea beyond just "Debug mode gives meaningless numbers."',
    hint: 'Consider what the GENERATE-then-COMPILE-then-LAUNCH-CHILD-PROCESS sequence means for how long a single call to BenchmarkRunner.Run actually takes to complete, completely separate from whether the resulting NUMBERS would even be meaningful.',
    solution: `[Fact]
public void MyBenchmarks_Should_Run_Fast()
{
    // This single line does NOT just call the benchmark methods a few
    // times — it triggers BDN's FULL generate-compile-launch pipeline:
    var summary = BenchmarkRunner.Run<MyBenchmarks>();
    Assert.NotNull(summary);
}

// WHY THIS BREAKS THE "FAST TEST SUITE" EXPECTATION, INDEPENDENT OF
// the separate (also real) Debug-mode meaninglessness problem:
//
// Every single invocation of BenchmarkRunner.Run<T>() triggers:
//   1. Reflection over the benchmark class to discover [Benchmark]
//      methods and configuration.
//   2. GENERATING an entire new, separate C# project on disk.
//   3. COMPILING that generated project via "dotnet build" — a real,
//      full compiler invocation, taking SECONDS at minimum, even for
//      a trivial benchmark class.
//   4. LAUNCHING it as a brand-new CHILD PROCESS — process startup
//      overhead, .NET runtime initialization, JIT warmup — ALL on TOP
//      of the compile step above.
//   5. Running the ACTUAL warmup + measurement iterations inside that
//      child process, which for a properly-configured benchmark is
//      DELIBERATELY designed to take a meaningful amount of wall-clock
//      time (BDN needs enough iterations for statistical confidence).
//
// A test suite is expected to run hundreds or thousands of tests in
// SECONDS total. A SINGLE BenchmarkRunner.Run call, by itself, given
// its own generate+compile+launch+measure pipeline, can EASILY take
// 10-60+ SECONDS on its own — completely independent of whether Debug
// mode makes the resulting NUMBERS meaningless. Running this inside
// EVERY CI test run, on EVERY commit, as part of the "fast" test suite
// would make the entire suite unacceptably slow, regardless of what
// the benchmark actually measures.
//
// THE FIX: benchmarks belong in their OWN separate console project
// (exactly as the main page recommends — "never mix with production
// code"), invoked EXPLICITLY and DELIBERATELY (a dedicated CI job, or
// manually by a developer investigating a specific performance
// question) — never as part of the routine, fast, every-commit unit
// test suite.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'BenchmarkRunner.Run<T>(args) directly invokes your [Benchmark] methods in the same process that calls it.',
      reality: 'BDN generates a brand-new, minimal C# project targeting each job configuration, compiles it as a standalone executable, and launches it as a completely separate child process — the actual measurement happens entirely inside that isolated child process.',
    },
    {
      thought: 'comparing multiple .NET runtime versions with multiple [SimpleJob(RuntimeMoniker...)] attributes somehow runs all of them inside one single running process.',
      reality: 'each targeted runtime gets its own separately generated, separately compiled, separately launched child process built specifically against that runtime — a single running process cannot switch which .NET runtime version it executes under mid-run.',
    },
    {
      thought: 'calling BenchmarkRunner.Run<T>() is a lightweight, fast operation suitable for embedding inside a regular unit test that runs on every commit.',
      reality: 'a single call triggers a full generate-compile-launch-measure pipeline that can easily take tens of seconds by itself, independent of whether Debug mode also makes the resulting numbers meaningless — benchmarks belong in their own dedicated, deliberately-invoked project, never the routine fast test suite.',
    },
  ];
}
