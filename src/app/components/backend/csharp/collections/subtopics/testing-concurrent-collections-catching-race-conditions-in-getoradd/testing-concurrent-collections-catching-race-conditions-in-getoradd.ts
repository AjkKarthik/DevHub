import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-concurrent-collections-catching-race-conditions-in-getoradd-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-concurrent-collections-catching-race-conditions-in-getoradd.html',
  styleUrl: './testing-concurrent-collections-catching-race-conditions-in-getoradd.scss',
})
export class TestingConcurrentCollectionsCatchingRaceConditionsInGetoraddSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s quiz question, turned into an actual test',
      points: [
        'The main Collections page has an entire QUIZ QUESTION about <code>ConcurrentDictionary.GetOrAdd</code>\'s factory potentially running more than once under concurrent access — but a quiz question tests whether the READER understands the risk, not whether a specific piece of CODE actually exhibits (or has been fixed to avoid) that risk. This subtopic writes the test that verifies it directly.',
      ],
    },
    {
      heading: 'Reproducing the race deterministically enough to test it',
      points: [
        'A genuine race condition is, by definition, non-deterministic — you cannot reliably force two threads to hit <code>GetOrAdd</code> at the EXACT same nanosecond in a unit test. The practical technique: use a COUNTING factory (incrementing a shared counter every time it runs) combined with a HIGH ITERATION COUNT and real parallelism (<code>Parallel.For</code> or multiple <code>Task.Run</code> calls all targeting the SAME key) — this does not GUARANTEE the race triggers on every test run, but with enough concurrent attempts on the same key, it reliably surfaces the "factory ran more than once" symptom often enough to prove the behavior exists (or, for the fixed version, prove it consistently does NOT).',
        'This is a NOTABLE EXCEPTION to the general rule (from other subtopics in this series) that flaky/non-deterministic tests are bad — here, the test is INTENTIONALLY probabilistic because it is testing a probabilistic phenomenon. Run it with a high enough iteration count (thousands of concurrent calls) that the counting factory\'s "ran more than once" signal becomes reliable in practice, even though no single run is a mathematical guarantee.',
      ],
    },
    {
      heading: 'Proving the raw GetOrAdd factory can run multiple times',
      points: [
        'A test with, say, 50 concurrent tasks all calling <code>GetOrAdd(sameKey, expensiveFactory)</code> on a FRESH <code>ConcurrentDictionary</code>, where <code>expensiveFactory</code> increments a shared counter AND sleeps briefly (to widen the race window), typically shows the counter ending up GREATER than 1 — directly demonstrating the main topic\'s "the factory may run multiple times" warning as an observed test result, not just a claim to take on faith.',
        'The KEY INSIGHT the test should assert: even though the factory ran multiple times, the DICTIONARY ITSELF still only ends up with ONE final value for that key (the "winner" of the race) — <code>GetOrAdd</code>\'s ATOMICITY guarantee is about the DICTIONARY\'S state, not about how many times the factory delegate itself executes. A test asserting <code>dict.Count == 1</code> alongside <code>counter &gt; 1</code> captures BOTH halves of this nuance precisely.',
      ],
    },
    {
      heading: 'Proving the Lazy<T> fix actually works',
      points: [
        'The main topic\'s fix — wrapping the value in <code>Lazy&lt;T&gt;</code> — should be tested the SAME way: run the same high-concurrency <code>GetOrAdd</code> test, but assert the underlying EXPENSIVE OPERATION\'s counter is exactly <code>1</code> after the race, not just "close to 1" or "usually 1." <code>Lazy&lt;T&gt;</code>\'s default thread-safety mode (<code>LazyThreadSafetyMode.ExecutionAndPublication</code>) genuinely guarantees the factory runs exactly once even when multiple <code>Lazy&lt;T&gt;</code> wrapper instances race to compute it — a test proving <code>counter == 1</code> consistently, across MANY repeated test runs, is real evidence the fix works, not just plausible-sounding theory.',
        'This directly mirrors the same "prove the fix, don\'t just trust the pattern" discipline used elsewhere in this series (e.g. testing that a compact constructor validation actually throws, not just assuming the guard clause compiles correctly) — a documented fix pattern deserves the same verification as any other piece of business logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving the raw GetOrAdd race — factory runs more than once',
      language: 'csharp',
      code: `using System.Collections.Concurrent;

public class GetOrAddRaceTests
{
    [Fact]
    public async Task RawGetOrAdd_FactoryCanRunMoreThanOnce_UnderConcurrency()
    {
        var dict = new ConcurrentDictionary<int, string>();
        int factoryRunCount = 0;

        string ExpensiveFactory(int key)
        {
            Interlocked.Increment(ref factoryRunCount);
            Thread.Sleep(5); // widen the race window deliberately
            return $"Value for {key}";
        }

        // 50 concurrent calls, ALL targeting the SAME key — maximizes the
        // chance of two threads both finding the key absent simultaneously.
        var tasks = Enumerable.Range(0, 50)
            .Select(_ => Task.Run(() => dict.GetOrAdd(42, ExpensiveFactory)));

        await Task.WhenAll(tasks);

        // The dictionary itself is correctly consistent — exactly ONE entry.
        Assert.Equal(1, dict.Count);

        // But the factory likely ran MORE than once — GetOrAdd's atomicity
        // guarantee is about the dictionary's final state, not about how
        // many times the factory delegate itself executed.
        //
        // NOTE: this assertion is intentionally probabilistic — with enough
        // concurrent attempts and an artificially widened race window
        // (Thread.Sleep), it reliably demonstrates the race in practice,
        // even though no single run is a mathematical guarantee.
        Assert.True(factoryRunCount > 1,
            $"Expected the factory to race and run more than once, but ran {factoryRunCount} time(s).");
    }
}`,
    },
    {
      label: 'Proving the Lazy<T> fix actually runs the factory exactly once',
      language: 'csharp',
      code: `using System.Collections.Concurrent;

public class LazyGetOrAddFixTests
{
    [Fact]
    public async Task LazyWrappedGetOrAdd_FactoryRunsExactlyOnce_EvenUnderConcurrency()
    {
        var dict = new ConcurrentDictionary<int, Lazy<string>>();
        int factoryRunCount = 0;

        string ExpensiveFactory(int key)
        {
            Interlocked.Increment(ref factoryRunCount);
            Thread.Sleep(5); // same widened race window as the raw test
            return $"Value for {key}";
        }

        var tasks = Enumerable.Range(0, 50).Select(_ => Task.Run(() =>
            dict.GetOrAdd(42, k => new Lazy<string>(() => ExpensiveFactory(k))).Value
        ));

        var results = await Task.WhenAll(tasks);

        // Every task got the SAME computed value.
        Assert.All(results, r => Assert.Equal("Value for 42", r));

        // The fix's whole point, actually PROVEN — not just assumed —
        // exactly once, no matter how many threads raced for it.
        Assert.Equal(1, factoryRunCount);
    }
}`,
    },
    {
      label: 'A note on running this test repeatedly for confidence',
      language: 'csharp',
      code: `// Because the RAW test (proving the race exists) is inherently probabilistic,
// running it once and seeing factoryRunCount > 1 is good evidence but not
// mathematical proof the race COULD NEVER be 1 on a given run. For a
// higher-confidence CI signal, either:
//
// 1. Increase iteration count and concurrent task count further (diminishing
//    returns, but a more consistent trigger of the race).
// 2. Wrap the raw test in a retry-and-average helper that runs it N times
//    and asserts the race triggered in AT LEAST one of them — accepting
//    that a single run occasionally (rarely) shows no race, without that
//    making the underlying GetOrAdd behavior itself any less real.
//
// The Lazy<T> FIX test, by contrast, should be treated as a hard invariant —
// if it ever shows factoryRunCount != 1, that is a genuine regression, not
// expected test flakiness, since Lazy<T>'s ExecutionAndPublication mode is
// a real guarantee, not a probabilistic one.

[Fact]
public async Task RawGetOrAdd_RaceReproducesAcrossMultipleAttempts()
{
    int successfulRaceDetections = 0;

    for (int attempt = 0; attempt < 5; attempt++)
    {
        var dict = new ConcurrentDictionary<int, string>();
        int count = 0;

        var tasks = Enumerable.Range(0, 50).Select(_ => Task.Run(() =>
            dict.GetOrAdd(1, k => { Interlocked.Increment(ref count); Thread.Sleep(2); return "v"; })
        ));
        await Task.WhenAll(tasks);

        if (count > 1) successfulRaceDetections++;
    }

    // The race should reproduce in AT LEAST most of the 5 attempts —
    // this is a probabilistic assertion by design, testing a
    // probabilistic phenomenon, unlike ordinary deterministic tests.
    Assert.True(successfulRaceDetections >= 3,
        $"Expected the race to reproduce in most attempts, got {successfulRaceDetections}/5.");
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>ConcurrentDictionary.TryAdd</code> (unlike <code>GetOrAdd</code>) truly is fully atomic — run many concurrent <code>TryAdd</code> calls for the same key with different values, and assert that exactly ONE of them returns <code>true</code> while all the others return <code>false</code>.',
    hint: 'Use a ConcurrentBag<bool> (thread-safe collection for gathering results) to collect each TryAdd\'s return value from many concurrent tasks targeting the same key, then assert the bag contains exactly one true and the rest false.',
    solution: `[Fact]
public async Task TryAdd_ExactlyOneSucceeds_ForConcurrentCallsOnSameKey()
{
    var dict = new ConcurrentDictionary<int, string>();
    var results = new ConcurrentBag<bool>();

    var tasks = Enumerable.Range(0, 50).Select(i => Task.Run(() =>
    {
        bool added = dict.TryAdd(1, $"value-{i}");
        results.Add(added);
    }));

    await Task.WhenAll(tasks);

    Assert.Equal(1, results.Count(r => r == true));
    Assert.Equal(49, results.Count(r => r == false));
    Assert.Equal(1, dict.Count); // only one entry, as expected
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a race condition in GetOrAdd\'s factory is a theoretical concern from documentation — it\'s hard to actually demonstrate in a real test.',
      reality: 'a test using enough concurrent tasks targeting the SAME key, combined with a counting factory and an artificially widened race window (a short Thread.Sleep inside the factory), reliably reproduces the race in practice — it becomes an observed test result, not just a claim to take on faith.',
    },
    {
      thought: 'if a race-condition test is inherently probabilistic (not guaranteed to trigger on every run), it is a badly-designed, flaky test that should be avoided.',
      reality: 'this is a deliberate EXCEPTION to the general flaky-test rule — when the underlying phenomenon itself is probabilistic (a genuine race condition), a test that reliably reproduces it MOST of the time, run with enough concurrent load, is the correct and honest way to verify it exists (or that a fix eliminates it).',
    },
    {
      thought: 'testing the Lazy&lt;T&gt; fix for GetOrAdd is unnecessary once you understand the pattern from documentation — the fix is well-known enough to trust without verification.',
      reality: 'a documented fix pattern deserves the same verification as any other piece of business logic — a test proving the factory runs EXACTLY once under real concurrent load turns "this pattern is supposed to work" into "this specific code demonstrably works," which is a meaningfully stronger guarantee.',
    },
  ];
}
