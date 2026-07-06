import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-allocation-regressions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-allocation-regressions-with-getallocatedbytesforthread.html',
  styleUrl: './testing-allocation-regressions-with-getallocatedbytesforthread.scss',
})
export class TestingAllocationRegressionsWithGetallocatedbytesforthreadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page correctly steers you toward BenchmarkDotNet over Stopwatch — but BenchmarkDotNet runs are far too slow (~20-30 seconds per method) to run on every CI build, which leaves a real gap: how do you catch "someone reintroduced string concatenation in a hot path" as a routine, fast, CI-friendly regression test, not a manual benchmark you remember to run occasionally?',
      points: [
        'The main page\'s own Q&A mentions <code>System.GC.GetAllocatedBytesForCurrentThread()</code> in passing as a way to "measure allocations for a specific code path in a test" — this is the key building block. Unlike BenchmarkDotNet, it needs no warmup, no statistical analysis, and runs in microseconds: call it once before the code under test, run the code, call it again, and the difference is the number of BYTES ALLOCATED ON THE CURRENT THREAD during that call — accurate enough to catch a GROSS regression (an O(1)-allocation path becoming O(n)) even though it lacks BenchmarkDotNet\'s statistical rigor for absolute timing comparisons.',
        'This is NOT a replacement for BenchmarkDotNet — it answers a narrower, different question. BenchmarkDotNet tells you "is this 15% faster than that" with statistical confidence; a <code>GetAllocatedBytesForCurrentThread()</code> assertion tells you "did this code path suddenly start allocating 100x more than an established baseline," which is exactly the kind of coarse, binary regression check that belongs in a fast CI suite rather than a slow, separately-run benchmark project.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A reusable allocation-measuring helper for xUnit tests',
      language: 'csharp',
      code: `public static class AllocationAssert
{
    // Measures bytes allocated on the CURRENT thread during 'action' —
    // microseconds of overhead, no warmup needed for a coarse check.
    public static long MeasureAllocatedBytes(Action action)
    {
        // Force a collection first so background allocations from
        // prior tests don't bleed into this measurement's baseline:
        GC.Collect();
        GC.WaitForPendingFinalizers();

        var before = GC.GetAllocatedBytesForCurrentThread();
        action();
        var after = GC.GetAllocatedBytesForCurrentThread();

        return after - before;
    }

    public static void AllocatesAtMost(long maxBytes, Action action)
    {
        var allocated = MeasureAllocatedBytes(action);
        Assert.True(allocated <= maxBytes,
            $"Expected at most {maxBytes:N0} bytes allocated, but measured {allocated:N0}.");
    }
}`,
    },
    {
      label: 'Using it to pin the exact regression the main page\'s own BeforeAfter demonstrates',
      language: 'csharp',
      code: `public class ReportBuilderAllocationTests
{
    private static readonly ObjectPool<StringBuilder> _pool =
        new DefaultObjectPoolProvider().CreateStringBuilderPool();

    [Fact]
    public void PooledStringBuilder_Allocates_Under_5KB_For_1000_Rows()
    {
        var orders = Enumerable.Range(0, 1000)
            .Select(i => new Order(i, i * 1.5m)).ToList();

        AllocationAssert.AllocatesAtMost(5_000, () =>
        {
            var sb = _pool.Get();
            try
            {
                foreach (var o in orders)
                    sb.Append(o.Id).Append(": ").AppendLine(o.Total.ToString("C"));
                _ = sb.ToString();
            }
            finally { _pool.Return(sb); }
        });
        // A one-time result string allocation plus a handful of small
        // internal buffers — comfortably under 5 KB for 1000 rows.
    }

    [Fact]
    public void StringConcat_Allocates_Over_1MB_For_1000_Rows_Documenting_The_Cost()
    {
        var orders = Enumerable.Range(0, 1000)
            .Select(i => new Order(i, i * 1.5m)).ToList();

        var allocated = AllocationAssert.MeasureAllocatedBytes(() =>
        {
            var result = string.Empty;
            foreach (var o in orders)
                result += $"{o.Id}: {o.Total:C}\\n";   // the main page's own
                                                        // O(n²) StringConcat
                                                        // benchmark example
        });

        // This test doesn't assert a strict upper bound — it EXISTS to
        // document, in a fast CI-visible way, exactly how expensive the
        // "before" version from the main page's own BeforeAfter is —
        // over a megabyte for a mere 1000 rows, due to O(n²) reallocation:
        Assert.True(allocated > 1_000_000,
            $"Expected the naive concat to allocate heavily; measured {allocated:N0} bytes — " +
            "if this assertion fails, something changed about string concatenation's cost model.");
    }

    // THE REGRESSION-CATCHING TEST — this is the one that actually
    // belongs in CI: if someone "simplifies" ReportBuilder back to
    // string concatenation, THIS test fails immediately, in
    // milliseconds, without anyone needing to remember to run
    // BenchmarkDotNet manually:
    [Fact]
    public void ReportBuilder_BuildReport_Does_Not_Regress_To_String_Concat()
    {
        var reportBuilder = new ReportBuilder(_pool);
        var orders = Enumerable.Range(0, 1000)
            .Select(i => new Order(i, i * 1.5m)).ToList();

        AllocationAssert.AllocatesAtMost(10_000, () =>
            reportBuilder.BuildReport(orders));
        // If ReportBuilder.BuildReport ever reverts to result += ...,
        // this test fails with a clear "allocated 1,180,000 bytes, but
        // expected at most 10,000" message — a fast, deterministic
        // signal in the SAME test run as everything else, not a
        // separate BenchmarkDotNet project someone has to remember
        // to execute and read.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes replacing ALL of the team\'s BenchmarkDotNet benchmarks with GC.GetAllocatedBytesForCurrentThread()-based xUnit tests, arguing "they measure the same thing, and these are faster and run automatically in CI." Identify what capability this change would genuinely lose, using the main page\'s own theory about what BenchmarkDotNet specifically provides.',
    hint: 'The main page\'s own theory lists what BenchmarkDotNet handles: "JIT warmup, statistical analysis (mean, StdDev, percentiles), multiple runs, and GC interactions." Does a single before/after GetAllocatedBytesForCurrentThread() measurement, run once inside a test, replicate ALL of these, or only the allocation-counting part?',
    solution: `The teammate's proposal would lose the ENTIRE timing/statistical side
of what BenchmarkDotNet provides — GetAllocatedBytesForCurrentThread()
measures ONLY allocated bytes, not execution time, and it does so with
a single measurement rather than BenchmarkDotNet's warmup iterations,
many repeated runs, and statistical reporting (mean, StdDev, P50/P99).
A team relying solely on allocation-count tests would have zero
visibility into whether a change made code SLOWER without changing its
allocation profile — a very real and common case (e.g., replacing a
fast O(1) dictionary lookup with a slower O(n) linear scan that happens
to allocate the same amount, or introducing a lock/contention point
that adds latency without adding allocations).

The two techniques answer genuinely different questions and are not
interchangeable: GetAllocatedBytesForCurrentThread() is a coarse,
single-measurement REGRESSION GATE ("did allocations suddenly jump"),
well-suited to running in every CI build because it's fast and doesn't
need statistical rigor for a binary pass/fail threshold check.
BenchmarkDotNet is a rigorous MEASUREMENT TOOL for actually understanding
and comparing performance characteristics — timing AND allocations,
with proper JIT warmup and enough repetitions to trust the numbers
statistically — appropriate for deliberate performance investigation,
documenting a specific optimization's magnitude in a PR description, or
periodic (not necessarily every-commit) deep benchmarking.

The correct answer generally isn't "replace one with the other" — it's
using BOTH for their respective strengths: fast allocation-regression
gates in the main CI test suite (catching gross allocation regressions
immediately, on every commit, cheaply), and BenchmarkDotNet runs
reserved for deliberate performance work, PRs specifically about
optimization, or a slower, periodic benchmark suite that doesn't block
every commit but still gets run and reviewed regularly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'GC.GetAllocatedBytesForCurrentThread()-based tests are a faster, CI-friendly replacement for BenchmarkDotNet that measure the same thing.',
      reality: 'they measure a completely different dimension — allocated bytes only, via a single before/after snapshot with no warmup or statistical analysis — while BenchmarkDotNet measures BOTH timing and allocations with proper JIT warmup, many repetitions, and statistical rigor; a codebase relying solely on allocation-count tests has zero visibility into pure timing regressions that don\'t change the allocation profile.',
    },
    {
      thought: 'a single call to GC.GetAllocatedBytesForCurrentThread() before and after a code block gives an unreliable, noisy measurement unsuitable for any kind of test assertion.',
      reality: 'while it lacks BenchmarkDotNet\'s statistical rigor for precise comparisons, it is accurate and stable enough to catch GROSS regressions (an accidental return to O(n²) string concatenation, for example) reliably — exactly the coarse, binary pass/fail signal that belongs in a fast CI gate rather than a slow, manually-run benchmark.',
    },
    {
      thought: 'allocation-regression tests using GetAllocatedBytesForCurrentThread() should be run in isolation from other tests to avoid noise from unrelated allocations.',
      reality: 'a GC.Collect() + GC.WaitForPendingFinalizers() call immediately before the "before" measurement clears out background allocations from prior tests without requiring full test isolation — the measurement only captures allocations attributed to the CURRENT thread during the specific action being measured, which is already scoped tightly enough for reliable coarse regression detection.',
    },
  ];
}
