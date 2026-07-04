import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-race-conditions-stress-testing-concurrent-code-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-race-conditions-stress-testing-concurrent-code.html',
  styleUrl: './testing-race-conditions-stress-testing-concurrent-code.scss',
})
export class TestingRaceConditionsStressTestingConcurrentCodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own SafeCounter/TtlCache examples are never tested under real concurrency',
      points: [
        'The main Threading page\'s own <code>SafeCounter</code> demo runs 10 threads incrementing a shared counter and PRINTS the result to visually confirm correctness (<code>"Safe: 10000 (always 10000)"</code>) — this is a manual, one-off demonstration, not a repeatable, assertable test. An ordinary single-threaded xUnit test calling <code>Increment()</code> a few times proves almost nothing about thread-safety, because a race condition may only manifest under genuine concurrent contention.',
      ],
    },
    {
      heading: 'A stress test deliberately creates the contention a normal test never would',
      points: [
        'The core technique: spin up MANY concurrent threads or tasks (the main page\'s own pattern — <code>Enumerable.Range(0, N).Select(_ => new Thread(...))</code>, or <code>Parallel.For</code>) that all hammer the SAME shared state simultaneously, then assert on an invariant that would only be violated if a race condition actually occurred — for a counter, the final total; for a cache, that no key\'s value is ever corrupted mid-write.',
        'This kind of test is inherently probabilistic rather than deterministic — a genuine race condition might not manifest on every single run, especially on a fast machine with few cores. Running the stress body multiple times, or scaling up the iteration/thread count, increases the chance of catching a real bug, but can never PROVE the absence of one the way a deterministic unit test can prove other kinds of bugs.',
      ],
    },
    {
      heading: 'A useful contrast test — asserting the UNSAFE version actually fails intermittently',
      points: [
        'A genuinely instructive companion test asserts that the KNOWINGLY unsafe version (the main page\'s own <code>unsafeCount++</code> example) is EXPECTED to sometimes produce a wrong total — this both documents WHY the safe version exists and gives future maintainers a concrete, runnable illustration of the race condition, rather than relying on a comment explaining it in prose.',
        'Because this expectation is itself probabilistic (the race may not always manifest), such a test is usually written as a demonstration/benchmark rather than a hard pass/fail assertion in the main test suite — a genuinely wrong total is evidence FOR the race condition\'s existence, but an occasional correct total does not disprove it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Stress-testing the main page\'s own SafeCounter for real thread-safety',
      language: 'csharp',
      code: `using Xunit;

public class SafeCounterStressTests
{
    [Fact]
    public void Increment_UnderHeavyConcurrency_NeverLosesAnIncrement()
    {
        var counter = new SafeCounter();
        const int threadCount = 20;
        const int incrementsPerThread = 5000;

        var threads = Enumerable.Range(0, threadCount).Select(_ => new Thread(() =>
        {
            for (int i = 0; i < incrementsPerThread; i++)
                counter.Increment();
        })).ToArray();

        foreach (var t in threads) t.Start();
        foreach (var t in threads) t.Join();

        // This assertion would FAIL intermittently on an unsynchronized
        // counter — it only reliably passes because SafeCounter's lock
        // genuinely prevents lost updates under real contention:
        Assert.Equal(threadCount * incrementsPerThread, counter.Value);
    }
}`,
    },
    {
      label: 'A demonstration test — proving the UNSAFE version really does lose increments',
      language: 'csharp',
      code: `public class UnsafeCounterDemonstration
{
    // Not a strict pass/fail unit test — a documented, runnable proof
    // that the race condition genuinely exists, matching the main
    // page's own "Unsafe: ... (should be 10000, probably isn't)" demo:
    [Fact]
    public void UnsafeIncrement_UnderContention_TypicallyLosesUpdates()
    {
        int unsafeCount = 0;
        const int threadCount = 20;
        const int incrementsPerThread = 5000;
        int expected = threadCount * incrementsPerThread;

        var threads = Enumerable.Range(0, threadCount).Select(_ => new Thread(() =>
        {
            for (int i = 0; i < incrementsPerThread; i++)
                unsafeCount++;   // NOT thread-safe — read/increment/write race
        })).ToArray();

        foreach (var t in threads) t.Start();
        foreach (var t in threads) t.Join();

        // Documented as EXPECTED to typically fail this equality — a lost
        // update is evidence the race condition is real; an occasional
        // pass does not disprove it, since races are probabilistic:
        if (unsafeCount != expected)
            Console.WriteLine($"Race condition confirmed: expected {expected}, got {unsafeCount}");
        else
            Console.WriteLine("No lost updates this run — race is timing-dependent, rerun to observe it");
    }
}`,
    },
    {
      label: 'Stress-testing the ConcurrentDictionary-based TtlCache challenge for corruption',
      language: 'csharp',
      code: `public class TtlCacheStressTests
{
    [Fact]
    public void Set_FromManyThreadsSimultaneously_NeverProducesCorruptedEntry()
    {
        var cache = new TtlCache();
        const int threadCount = 16;

        // All threads write to the SAME key concurrently — this is
        // exactly the scenario the main page's own ConcurrentDictionary
        // section warns is a real contention point:
        var threads = Enumerable.Range(0, threadCount).Select(i => new Thread(() =>
        {
            cache.Set("shared-key", $"value-from-thread-{i}", TimeSpan.FromMinutes(1));
        })).ToArray();

        foreach (var t in threads) t.Start();
        foreach (var t in threads) t.Join();

        // The invariant under test isn't WHICH thread's value "won" —
        // it's that the stored value is a genuinely complete, valid
        // string from ONE of the writers, never a corrupted partial
        // write straddling two different threads' values:
        Assert.True(cache.TryGet("shared-key", out var result));
        Assert.Matches(@"^value-from-thread-\\d+$", result!);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a stress test for the main topic page\'s own <code>AtomicCounter</code> (using <code>Interlocked.Increment</code>) that spins up 50 threads each calling <code>Increment()</code> 1000 times, and assert the final count is exactly correct.',
    hint: 'Follow the same pattern as the SafeCounter stress test — create an array of Thread objects, Start() each, Join() each, then assert the final Value equals threadCount * incrementsPerThread.',
    solution: `[Fact]
public void Increment_UnderHeavyConcurrency_InterlockedNeverLosesAnIncrement()
{
    var counter = new AtomicCounter();
    const int threadCount = 50;
    const int incrementsPerThread = 1000;

    var threads = Enumerable.Range(0, threadCount).Select(_ => new Thread(() =>
    {
        for (int i = 0; i < incrementsPerThread; i++)
            counter.Increment();
    })).ToArray();

    foreach (var t in threads) t.Start();
    foreach (var t in threads) t.Join();

    // Interlocked.Increment is a single atomic CPU instruction, so this
    // assertion should ALWAYS pass reliably, unlike the unsafe demo —
    // proving the atomic operation genuinely prevents lost updates
    // under the exact same contention pattern:
    Assert.Equal(threadCount * incrementsPerThread, counter.Value);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a unit test that calls a thread-safe method a few times from a single thread proves the method is actually thread-safe.',
      reality: 'a race condition only manifests under genuine concurrent contention — a single-threaded test exercises none of the interleaving that could expose a synchronization bug, regardless of how many times it calls the method.',
    },
    {
      thought: 'if a stress test passes once, the code under test is proven free of race conditions.',
      reality: 'race conditions are inherently probabilistic — a genuine bug might not manifest on every run, especially on a fast machine or with few threads/iterations. A single passing run is evidence, not proof; increasing thread count and iterations improves confidence but never guarantees certainty.',
    },
    {
      thought: 'a stress test demonstrating an UNSAFE implementation should assert the wrong total as a hard, deterministic pass/fail check.',
      reality: 'because the race is probabilistic, asserting a SPECIFIC wrong total (or that the total is definitely wrong) can itself be flaky — such tests are usually written as documented demonstrations rather than strict CI-blocking assertions.',
    },
  ];
}
