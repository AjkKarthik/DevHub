import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-iterator-actually-lazy-side-effects-not-run-before-enumeration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-iterator-actually-lazy-side-effects-not-run-before-enumeration.html',
  styleUrl: './testing-iterator-actually-lazy-side-effects-not-run-before-enumeration.scss',
})
export class TestingIteratorActuallyLazySideEffectsNotRunBeforeEnumerationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Evens() example demonstrates laziness by printing output — that is directly testable instead',
      points: [
        'The main Iterators page\'s own <code>Evens()</code> example proves deferred execution by printing "Iterator started" and observing it appears AFTER "Before loop" in the console. This exact claim — "the method body has not run yet, purely from calling the method" — is directly and deterministically testable without relying on console output ordering at all.',
      ],
    },
    {
      heading: 'A boolean flag flipped inside the iterator body proves whether it has actually started running',
      points: [
        'The technique: have the iterator body set a simple <code>bool</code> (or increment a counter) as its FIRST action, then assert that flag is still <code>false</code> immediately after CALLING the method — before any enumeration — and only becomes <code>true</code> after the first <code>MoveNext()</code>/<code>foreach</code> iteration. This directly proves the "calling the method executes nothing" claim the main page makes, rather than relying on console output timing which is a weaker, harder-to-automate signal.',
      ],
    },
    {
      heading: 'This same technique tests the main page\'s own eager-validation-wrapper fix directly',
      points: [
        'The main page\'s own <code>ChunkSafe</code> fix (eager public wrapper + private iterator) makes a specific, testable claim: calling <code>ChunkSafe(source, -1)</code> throws IMMEDIATELY, without needing to enumerate the result at all. A test that calls the method and asserts the exception is thrown BEFORE any <code>foreach</code>/<code>MoveNext()</code> — contrasted with a companion test proving the UNSAFE version does NOT throw until enumeration — directly and permanently documents the exact bug the wrapper pattern exists to prevent.',
        'This is a genuinely useful regression test to have in a codebase using this pattern: a future refactor that accidentally moves validation back inside the iterator body would silently reintroduce the deferred-validation bug, and only a test asserting on WHEN the exception fires (not just THAT it fires) would catch that regression.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving deferred execution with a flag instead of console timing',
      language: 'csharp',
      code: `using Xunit;

static IEnumerable<int> Evens(int max, Action onStarted)
{
    onStarted();   // fires as the FIRST action inside the iterator body
    for (int i = 0; i <= max; i += 2)
        yield return i;
}

public class DeferredExecutionTests
{
    [Fact]
    public void CallingIteratorMethod_DoesNotExecuteBodyYet()
    {
        bool started = false;
        IEnumerable<int> seq = Evens(6, () => started = true);

        // Directly proves "calling the method runs nothing" —
        // no reliance on console output ordering at all:
        Assert.False(started);

        // Only after actually enumerating does the body run:
        _ = seq.First();
        Assert.True(started);
    }
}`,
    },
    {
      label: 'Testing the eager-validation-wrapper fix directly — WHEN the exception fires, not just THAT it fires',
      language: 'csharp',
      code: `// The main page's own unsafe version:
static IEnumerable<int> ChunkUnsafe(int[] source, int size)
{
    if (size <= 0)
        throw new ArgumentOutOfRangeException(nameof(size)); // deferred!
    for (int i = 0; i < source.Length; i += size)
        yield return source[i];
}

// The main page's own fixed version:
static IEnumerable<int> ChunkSafe(int[] source, int size)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(size); // immediate
    return Core(source, size);
    static IEnumerable<int> Core(int[] src, int sz)
    {
        for (int i = 0; i < src.Length; i += sz)
            yield return src[i];
    }
}

public class ChunkValidationTests
{
    [Fact]
    public void ChunkUnsafe_DoesNotThrowUntilEnumerated()
    {
        // Calling it alone does NOT throw — proving the bug exists:
        var result = ChunkUnsafe(new[] { 1, 2, 3 }, -1);
        // No exception here yet!

        // The exception only fires once enumeration actually begins:
        Assert.Throws<ArgumentOutOfRangeException>(() => result.First());
    }

    [Fact]
    public void ChunkSafe_ThrowsImmediatelyOnCall_BeforeAnyEnumeration()
    {
        // Directly proves the FIX — the exception fires on the CALL
        // itself, with no enumeration step involved at all. If a
        // future refactor moved validation back inside the private
        // iterator, this specific test would start failing:
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            ChunkSafe(new[] { 1, 2, 3 }, -1));
    }
}`,
    },
    {
      label: 'Testing the multiple-enumeration trap: counting how many times the pipeline actually runs',
      language: 'csharp',
      code: `public class MultipleEnumerationTests
{
    [Fact]
    public void EnumeratingTwice_RunsThePipelineTwice()
    {
        int lookupCallCount = 0;

        IEnumerable<int> Source() { yield return 1; yield return 2; }
        bool Lookup(int x) { lookupCallCount++; return true; }

        var pipeline = Source().Where(Lookup);

        _ = pipeline.Count();  // first full pass
        _ = pipeline.First();  // SECOND pass starts the lookups again

        // Directly proves the "re-runs the whole pipeline" claim —
        // 2 elements x 2 enumerations = 4 Lookup calls, not 2:
        Assert.Equal(4, lookupCallCount);
    }

    [Fact]
    public void MaterializingFirst_RunsThePipelineOnce()
    {
        int lookupCallCount = 0;
        IEnumerable<int> Source() { yield return 1; yield return 2; }
        bool Lookup(int x) { lookupCallCount++; return true; }

        var materialized = Source().Where(Lookup).ToList(); // ONE pass

        _ = materialized.Count;  // no re-enumeration — plain List access
        _ = materialized[0];

        Assert.Equal(2, lookupCallCount); // proves ToList() genuinely
                                           // prevents the repeated work
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test for the main topic page\'s own <code>SlidingWindow&lt;T&gt;</code> challenge that proves its argument validation (size &lt;= 0) throws immediately on call, without needing to enumerate the result.',
    hint: 'Call SlidingWindow with an invalid size and wrap ONLY that call (not any enumeration) in Assert.Throws — if validation were deferred, the exception would only fire once you enumerate, and this test would fail.',
    solution: `[Fact]
public void SlidingWindow_InvalidSize_ThrowsImmediatelyOnCall()
{
    int[] source = { 1, 2, 3, 4 };

    // Wraps ONLY the call itself — no .ToList()/.First()/foreach here.
    // If SlidingWindow's validation were accidentally moved inside the
    // private iterator (reintroducing the deferred-validation bug this
    // topic warns about), this exact assertion would start failing,
    // because the exception would only fire once enumeration began:
    Assert.Throws<ArgumentOutOfRangeException>(() =>
        source.SlidingWindow(0));
}

[Fact]
public void SlidingWindow_ValidCall_DoesNotThrowUntilEnumerationEitherWay()
{
    // A companion sanity check — a VALID call should never throw at
    // all, on call or on enumeration:
    var windows = new[] { 1, 2, 3, 4 }.SlidingWindow(2);
    var result = windows.ToList();
    Assert.Equal(3, result.Count); // [1,2], [2,3], [3,4]
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'proving an iterator is lazy requires printing to the console and manually inspecting the output order.',
      reality: 'a simple boolean flag (or counter) set as the first action inside the iterator body, checked before and after enumeration begins, directly and deterministically proves deferred execution without relying on console output timing at all.',
    },
    {
      thought: 'testing that an eager-validation-wrapper fix works correctly just means confirming the exception is eventually thrown.',
      reality: 'the meaningful test asserts the exception fires on the CALL itself, with zero enumeration involved — this is what actually distinguishes the fix from the original deferred-validation bug, and is what a regression test must specifically check for.',
    },
    {
      thought: 'confirming a materialized (.ToList()) result and a lazy sequence produce the SAME final values proves they behave equivalently.',
      reality: 'equal final values say nothing about how many times expensive side effects (like a database Lookup) ran along the way — counting actual invocations is what distinguishes "ran once, materialized" from "ran twice, re-enumerated lazily".',
    },
  ];
}
