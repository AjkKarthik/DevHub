import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-dynamic-pgo-rejits-tiered-compilation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-dynamic-pgo-actually-rejits-tiered-compilation-on-stack-replacement.html',
  styleUrl: './how-dynamic-pgo-actually-rejits-tiered-compilation-on-stack-replacement.scss',
})
export class HowDynamicPgoActuallyRejitsTieredCompilationOnStackReplacementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Q&A describes Dynamic PGO in three sentences — this subtopic covers the actual tiering pipeline and the mechanism that lets it re-JIT a method that is CURRENTLY RUNNING',
      points: [
        'The main page\'s Q&amp;A states: "the JIT starts by generating fast-to-compile tier 0 code... re-compiles hot methods at tier 1 using the observed data." This raises an interesting question the main page doesn\'t answer: if a method is already RUNNING (say, deep inside a long-running loop), how does the runtime possibly swap in newly-optimized code for it MID-EXECUTION, without waiting for the method to return and be called again?',
      ],
    },
    {
      heading: 'Tier 0: instrumented, fast-to-produce code with COUNTERS baked in — not optimized, but cheap to generate and includes profiling hooks',
      points: [
        'When a method is FIRST called, the JIT compiles it quickly at "Tier 0" — minimal optimization, prioritizing FAST COMPILATION over fast EXECUTION, since most methods in a typical program run only a handful of times and are never worth spending compile-time optimizing. Critically, Tier 0 code ALSO includes lightweight instrumentation: counters tracking how many times the method has been called, which branches were actually taken, and which concrete types flowed through polymorphic call sites.',
        'Once a method\'s CALL COUNT crosses an internal threshold (indicating it is genuinely "hot" — worth the extra compile time investment), the runtime queues it for Tier 1 recompilation: a FULL optimization pass (aggressive inlining, loop optimizations, devirtualization based on the ACTUALLY-OBSERVED concrete types from Tier 0\'s instrumentation) — producing genuinely fast code, informed by REAL runtime behavior rather than static guesses.',
      ],
    },
    {
      heading: 'On-Stack Replacement (OSR) is the specific mechanism that lets a method\'s SLOW Tier 0 code get swapped for FAST Tier 1 code WHILE that exact method invocation is still executing — without waiting for it to return first',
      points: [
        'Without OSR, tiering would only help methods that are called MANY TIMES, each call SHORT — the very NEXT call after crossing the hotness threshold would use the newly Tier-1-compiled code. But a method containing one GIANT, long-running loop (processing millions of items in a SINGLE call) would never benefit at all — that one call runs entirely on slow Tier 0 code from start to finish, since it is never CALLED AGAIN to pick up the Tier 1 version.',
        'OSR solves exactly this: the runtime can transplant an ALREADY-EXECUTING method\'s current state (its local variables, its current position within a loop) from the Tier 0 compiled version DIRECTLY into an equivalent point in the newly-compiled Tier 1 version — literally swapping out the machine code underneath a still-running method, mid-loop, preserving all its live state. This is why a single call containing a very long loop can visibly speed up PARTWAY THROUGH its own execution, once the loop has run enough iterations to be recognized as hot.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A method whose SINGLE call benefits from OSR mid-execution',
      language: 'csharp',
      code: `// This method is called ONCE, but processes millions of items in a
// single long-running loop — it would NEVER benefit from ordinary
// "recompile before the NEXT call" tiering, since there IS no next call:
public static long SumSquares(long[] data)
{
    long total = 0;
    for (int i = 0; i < data.Length; i++)   // data.Length in the millions
    {
        total += data[i] * data[i];
        // Early iterations of this loop run on Tier 0 (unoptimized,
        // instrumented) compiled code — slower per-iteration, but
        // compiled almost instantly when the method was first entered.
        //
        // Once the runtime's loop-iteration counter (part of Tier 0's
        // instrumentation) crosses an internal threshold WHILE this
        // exact call is still executing, On-Stack Replacement swaps
        // the CURRENTLY RUNNING method's underlying machine code for
        // the fully-optimized Tier 1 version — transplanting "total",
        // "i", and the loop's exact current position into equivalent
        // Tier 1 code, and the REMAINING iterations of THIS SAME loop,
        // in THIS SAME call, run measurably faster than the early ones.
    }
    return total;
}

long result = SumSquares(hugeArray);
// A profiler attached to this single call would show a VISIBLE
// throughput increase partway through the loop — not because
// anything in the C# source changed, but because OSR replaced the
// executing machine code underneath it.`,
    },
    {
      label: 'Confirming this is real — environment variables that expose the tiering pipeline',
      language: 'csharp',
      code: `// Set BEFORE running the app (not C# code — environment configuration)
// to observe tiering decisions directly:

// DOTNET_TieredCompilation=1        (default: on)
// DOTNET_TieredPGO=1                (default: on, .NET 8+)
// DOTNET_TC_QuickJitForLoops=1      (default: on — even loop-containing
//                                    methods get a fast Tier 0 pass first)
// DOTNET_JitStdOutFile=jit_log.txt  (dumps JIT compilation events)

// A JIT trace (via DOTNET_JitDisasmSummary=1) for a hot, loop-heavy
// method shows entries similar to (illustrative, simplified):
//
//   Method: SumSquares
//     Tier0     : compiled in 0.4ms   (fast compile, includes instrumentation)
//     [called, running...]
//     OSR-Tier1 : compiled in 8.2ms while executing (transplanted mid-loop)
//     [remaining iterations run on OSR-Tier1 code]
//
// This is DIRECT, observable evidence that a SINGLE invocation of one
// method executed under TWO DIFFERENT compiled versions of its own
// code, seamlessly, without the method ever returning in between.`,
    },
    {
      label: 'Why devirtualization specifically benefits from waiting for REAL Tier 0 observations',
      language: 'csharp',
      code: `public interface IValidator { bool IsValid(string input); }

public class EmailValidator : IValidator
{
    public bool IsValid(string input) => input.Contains('@');
}

// A generic-looking method — the JIT, seeing ONLY the static types at
// compile time, has NO WAY to know which concrete IValidator
// implementation will actually flow through this call site:
public static int CountValid(IEnumerable<string> inputs, IValidator validator)
{
    int count = 0;
    foreach (var input in inputs)
        if (validator.IsValid(input))   // ordinary interface dispatch —
            count++;                     // a genuine vtable lookup, EVERY
                                          // single call, under Tier 0
    return count;
}

// Tier 0's instrumentation records: "every single call to
// validator.IsValid() at THIS call site, so far, has actually been an
// EmailValidator instance — never any other IValidator implementation."
//
// When this method is re-JIT'd at Tier 1, the JIT can use that REAL,
// OBSERVED data to DEVIRTUALIZE this specific call site: emit a DIRECT
// call to EmailValidator.IsValid (no vtable lookup at all), guarded by
// a cheap type check that falls back to normal virtual dispatch ONLY
// if a genuinely different IValidator implementation ever shows up —
// a speculative optimization that static, ahead-of-time analysis alone
// could never safely make, since it requires ACTUAL runtime evidence
// about what types genuinely flow through this specific call site in
// THIS specific running program.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A benchmark author writes a BenchmarkDotNet <code>[Benchmark]</code> method that runs a HOT loop just 3 times total (the loop body itself does very little work per iteration, and the outer benchmark harness calls the whole method thousands of times to get statistically stable timing). Explain, using tiered compilation and the concept of a call-count threshold, why the main C# hub\'s own BenchmarkDotNet topic emphasizes a proper WARMUP phase before real measurement — connecting it specifically to what this subtopic covers about Tier 0 versus Tier 1 code.',
    hint: 'Consider that BenchmarkDotNet calls the SAME benchmark method thousands of times as part of ONE benchmark run — and that the JIT\'s hotness threshold is based on call count, meaning the VERY FIRST several calls to that method genuinely execute on unoptimized Tier 0 code, before the runtime has observed enough calls to justify Tier 1 recompilation.',
    solution: `[Benchmark]
public int TightLoop()
{
    int sum = 0;
    for (int i = 0; i < 100; i++)
        sum += i;
    return sum;
}

// BenchmarkDotNet calls THIS method MANY THOUSANDS of times as part of
// a single benchmark run (separate from any warmup) — this connects
// DIRECTLY to tiered compilation's call-count-based hotness threshold:
//
// The VERY FIRST several calls to TightLoop() during the run execute
// on TIER 0 code — fast to compile, but NOT optimized, and carrying
// the overhead of the profiling instrumentation counters themselves.
// Only after enough calls accumulate does the runtime recompile
// TightLoop() at TIER 1 (fully optimized, instrumentation removed) —
// and every call AFTER that point runs measurably faster than the
// initial handful of calls did.
//
// IF BenchmarkDotNet measured EVERY call from the very first one,
// the reported Mean would be a MEANINGLESS BLEND of a few slow
// Tier-0-executed calls and many fast Tier-1-executed calls — an
// artifact of the JIT's OWN warmup behavior, having NOTHING to do
// with the actual steady-state performance of the code being
// benchmarked.
//
// THIS IS EXACTLY WHY the main C# hub's own BenchmarkDotNet topic
// insists on a genuine WARMUP phase before real measurement begins —
// BDN's warmup iterations exist SPECIFICALLY to run the benchmark
// method enough times to reach Tier 1 (fully re-JIT'd, steady-state)
// BEFORE any timing data is actually recorded. Skipping or shortening
// warmup does not just risk "cold CPU caches" (as commonly described)
// — it risks measuring a MIX of Tier 0 and Tier 1 execution of the
// SAME method, producing a Mean that describes neither the JIT's
// startup behavior nor its steady-state performance accurately.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a method only gets re-JIT-compiled to optimized code the NEXT time it is called after being recognized as hot — a single, long-running call always executes entirely on whatever tier it started with.',
      reality: 'On-Stack Replacement (OSR) can swap a currently-executing method\'s compiled code mid-execution, transplanting its live state (local variables, current loop position) into the newly-optimized version — a single long-running call containing a hot loop can visibly speed up partway through its own execution.',
    },
    {
      thought: 'Tier 0 (the initial JIT compilation) code has no purpose beyond simply being fast to produce.',
      reality: 'Tier 0 code also includes lightweight profiling instrumentation — call counters, branch outcomes, and observed concrete types at polymorphic call sites — which is exactly the real runtime data Dynamic PGO uses to make informed optimization decisions (like devirtualization) when recompiling at Tier 1.',
    },
    {
      thought: 'when benchmarking, a "warmup phase" exists mainly to warm CPU caches and is otherwise a formality that could be shortened without much consequence.',
      reality: 'warmup iterations also exist to let the JIT\'s own call-count-based tiering reach steady-state (Tier 1) compiled code for the specific method being benchmarked — measuring before this point mixes unoptimized and optimized execution of the same method into one meaningless average.',
    },
  ];
}
