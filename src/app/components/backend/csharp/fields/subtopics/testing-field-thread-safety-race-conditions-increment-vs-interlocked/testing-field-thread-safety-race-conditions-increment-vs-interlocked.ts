import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-field-thread-safety-race-conditions-increment-vs-interlocked-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-field-thread-safety-race-conditions-increment-vs-interlocked.html',
  styleUrl: './testing-field-thread-safety-race-conditions-increment-vs-interlocked.scss',
})
export class TestingFieldThreadSafetyRaceConditionsIncrementVsInterlockedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page explains the bug — never how to prove it exists',
      points: [
        'The main Fields page\'s Common Mistake shows <code>_count++</code> is not atomic under concurrent threads and that <code>Interlocked.Increment</code> fixes it — but the demonstration is prose, not a test. A genuinely useful skill is writing an automated test that actually REPRODUCES the race condition on the broken version and PASSES reliably on the fixed version, rather than trusting the explanation.',
      ],
    },
    {
      heading: 'Reproducing a race condition needs real concurrency, not just multiple calls',
      points: [
        'A test that calls <code>_count++</code> sequentially, even many times, from a single thread will never expose the race — the bug only appears when MULTIPLE THREADS genuinely execute the read-increment-write sequence AT THE SAME TIME. The test must launch real concurrent work — <code>Task.WhenAll</code> over many <code>Task.Run</code> calls, or <code>Parallel.For</code> — each incrementing the shared field, then assert the final count against the expected total.',
        'A HIGH iteration count and thread count matters: too few concurrent operations may not trigger the race often enough to fail reliably, making the test FLAKY in the wrong direction — passing even against the genuinely broken <code>++</code> version, giving false confidence. A common practical choice is thousands of increments across dozens of concurrent tasks.',
      ],
    },
    {
      heading: 'A race-condition test is inherently probabilistic — treat it accordingly',
      points: [
        'Because the race depends on precise timing, a test against the broken <code>++</code> version might occasionally still produce the correct count purely by chance, on some machine/run — this does NOT mean the code is safe, only that the race was not observed this time. Conversely, the FIXED <code>Interlocked</code> version should produce the correct count reliably, every single run, with no flakiness at all — that reliability difference is itself part of what the test demonstrates.',
        'This means a race-condition regression test is genuinely most valuable as a demonstration/teaching test (proving the pattern) or as a CI-run-many-times robustness check, rather than a single pass/fail gate you trust blindly on one run — pair it with a high iteration count to make failures on the broken version highly likely, even though "highly likely" is not the same guarantee as a deterministic test.',
      ],
    },
    {
      heading: 'volatile alone does not fix the compound-operation race — testing proves it too',
      points: [
        'The main page\'s theory explicitly states <code>volatile</code> does not make <code>++</code> atomic — this is directly testable: run the SAME concurrent-increment test against a <code>volatile int</code> field using plain <code>++</code>, and it should still occasionally undercount, exactly like the non-volatile version, proving <code>volatile</code> alone is insufficient for this specific compound-operation scenario.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A test that reliably reproduces the race condition',
      language: 'csharp',
      code: `using Xunit;

public class UnsafeCounter
{
    private int _count;
    public void Increment() => _count++;  // NOT atomic — read, add, write
    public int Count => _count;
}

public class UnsafeCounterTests
{
    [Fact]
    public async Task Increment_UnderConcurrency_UndercountsDueToRaceCondition()
    {
        var counter = new UnsafeCounter();
        const int threads = 50;
        const int incrementsPerThread = 1000;
        const int expected = threads * incrementsPerThread; // 50,000

        var tasks = Enumerable.Range(0, threads).Select(_ => Task.Run(() =>
        {
            for (var i = 0; i < incrementsPerThread; i++)
                counter.Increment();
        }));

        await Task.WhenAll(tasks);

        // This assertion is EXPECTED to fail (proving the race exists) —
        // in a real test suite you would NOT assert this as a "passing"
        // test; this demonstrates the bug, it does not validate correct code.
        Assert.NotEqual(expected, counter.Count); // counter.Count is LESS than 50,000
        // High thread/iteration counts make the undercount highly likely to
        // reproduce on nearly every run — though it remains probabilistic.
    }
}`,
    },
    {
      label: 'The fixed version — Interlocked passes reliably, every run',
      language: 'csharp',
      code: `using Xunit;

public class SafeCounter
{
    private int _count;
    public void Increment() => Interlocked.Increment(ref _count);
    public int Count => _count;
}

public class SafeCounterTests
{
    [Fact]
    public async Task Increment_UnderConcurrency_CountsCorrectly()
    {
        var counter = new SafeCounter();
        const int threads = 50;
        const int incrementsPerThread = 1000;
        const int expected = threads * incrementsPerThread; // 50,000

        var tasks = Enumerable.Range(0, threads).Select(_ => Task.Run(() =>
        {
            for (var i = 0; i < incrementsPerThread; i++)
                counter.Increment();
        }));

        await Task.WhenAll(tasks);

        // Unlike the unsafe version, this assertion holds EVERY run —
        // Interlocked.Increment genuinely performs the read-modify-write
        // as a single atomic CPU instruction, with no lost updates.
        Assert.Equal(expected, counter.Count);
    }
}`,
    },
    {
      label: 'volatile does not fix it — proving the main topic\'s claim directly',
      language: 'csharp',
      code: `public class VolatileCounter
{
    private volatile int _count;
    public void Increment() => _count++; // STILL not atomic despite volatile
    public int Count => _count;
}

public class VolatileCounterTests
{
    [Fact]
    public async Task VolatileIncrement_UnderConcurrency_StillUndercounts()
    {
        var counter = new VolatileCounter();
        const int threads = 50;
        const int incrementsPerThread = 1000;
        const int expected = threads * incrementsPerThread;

        var tasks = Enumerable.Range(0, threads).Select(_ => Task.Run(() =>
        {
            for (var i = 0; i < incrementsPerThread; i++)
                counter.Increment();
        }));

        await Task.WhenAll(tasks);

        // volatile ensures visibility (no stale cached reads) but does
        // NOT make "_count++" a single atomic operation — the race
        // condition on the read-increment-write sequence is unaffected,
        // so this reproduces the SAME undercount as the plain int version.
        Assert.NotEqual(expected, counter.Count);
        // This is exactly the main topic's claim — "volatile does NOT
        // make compound operations atomic" — now proven with a real test
        // instead of taken on faith from the prose explanation.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the race-condition test above is "flaky and should be deleted from CI" since it might occasionally pass even against the broken UnsafeCounter. Propose a way to keep the VALUE of this test (documenting and guarding against the bug pattern) without it being a source of CI flakiness.',
    hint: 'Think about separating the roles: one kind of test asserts CORRECT behavior deterministically (the SafeCounter test, which should never flake) and another kind of test is more like documentation/regression-demonstration of the bug (the UnsafeCounter test). Consider whether the UnsafeCounter test even belongs in the main CI suite at all, versus a dedicated, clearly-labeled "regression demo" category run separately or not asserted strictly.',
    solution: `// The key insight: the UnsafeCounter test's VALUE is demonstrating why
// Interlocked is necessary — it is not meant to be a strict pass/fail CI
// gate, because its "failure" (an undercount) IS the expected, desired
// outcome, which makes it a poor fit for ordinary CI assertions.

// Option 1 — remove it from the strict pass/fail suite, keep it as a
// clearly labeled, separately-run demonstration (not part of "dotnet test"
// default filter):
[Fact]
[Trait("Category", "RaceConditionDemo")] // excluded from default CI run
public async Task UnsafeCounter_DemonstratesRaceCondition_NotAStrictGate()
{
    // ... same test body as before ...
    // Run manually or in a separate, non-blocking CI job when teaching
    // or investigating — never gates a normal build.
}

// Option 2 — keep ONLY the SafeCounter test (Interlocked.Increment) as
// the real, deterministic CI gate. It never flakes and directly proves
// the PRODUCTION code (not the broken example) is genuinely correct:
[Fact]
public async Task Increment_UnderConcurrency_CountsCorrectly()
{
    // ... SafeCounter test body — this is the one that actually belongs
    // in ordinary CI, since it is deterministic and gates real code.
}

// The UnsafeCounter test's job is teaching/regression-documentation, not
// CI gating — treating it as a strict assertion in the main suite is
// exactly the mismatch the teammate correctly identified.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that calls a shared field\'s increment method many times sequentially, even from a single thread, is sufficient to catch a race condition in that increment logic.',
      reality: 'a race condition only manifests when multiple threads genuinely execute the read-increment-write sequence concurrently — a sequential test, no matter how many iterations, will never expose the bug because there is no actual concurrent interleaving to race.',
    },
    {
      thought: 'a race-condition test that occasionally passes even against known-broken code (like plain ++ under concurrency) is a badly written, flaky test that should be fixed to be deterministic.',
      reality: 'race-condition tests are inherently probabilistic by nature — the goal is to make failures on broken code highly likely (via high thread/iteration counts), not to guarantee determinism, which is impossible for a genuinely timing-dependent bug.',
    },
    {
      thought: 'testing the same concurrent-increment scenario against a volatile int field will pass, since volatile is a thread-safety keyword.',
      reality: 'volatile only prevents caching/reordering for visibility — it does not make compound read-modify-write operations like ++ atomic, so a concurrent-increment test against a volatile field reproduces the same undercount as a plain, non-volatile field.',
    },
  ];
}
