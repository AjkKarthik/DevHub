import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-async-timing-deterministic-controllable-taskcompletionsource-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-async-timing-deterministic-controllable-taskcompletionsource.html',
  styleUrl: './testing-async-timing-deterministic-controllable-taskcompletionsource.scss',
})
export class TestingAsyncTimingDeterministicControllableTaskcompletionsourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own timeout pattern is genuinely hard to test with real Task.Delay calls',
      points: [
        'The main Tasks page\'s own <code>DoWorkWithTimeoutAsync</code> races real work against <code>Task.Delay(TimeSpan.FromSeconds(5))</code>. Testing "the timeout branch actually fires" or "the work branch wins when it\'s fast enough" by using REAL delays makes the test slow (waiting out real timeouts) and flaky (a slow CI runner might tip the race the wrong way) — exactly the properties a good test should never have.',
      ],
    },
    {
      heading: 'A TaskCompletionSource lets you control exactly when a "background" operation completes, deterministically',
      points: [
        'Instead of a real async operation, a test can create a <code>TaskCompletionSource</code>, hand its <code>.Task</code> to the code under test in place of the real work, and then call <code>.SetResult()</code> (or NEVER call it, to simulate "never completes") at EXACTLY the moment the test wants — with zero real wall-clock waiting and zero timing ambiguity.',
        'This directly tests the main page\'s own <code>WhenAny</code>-based timeout pattern\'s LOGIC (does it correctly detect which task won, does it correctly cancel the loser) completely independently of whether real timers or real I/O actually behave as expected — those are the FRAMEWORK\'s job to get right, not this code\'s.',
      ],
    },
    {
      heading: 'This generalizes to any WhenAny/WhenAll code path, not just timeouts',
      points: [
        'The same technique tests the main page\'s own cache-vs-database race pattern: substitute BOTH the cache lookup and the DB lookup with separately-controlled <code>TaskCompletionSource</code> instances, then deterministically complete one before the other in each test to exercise "cache wins," "DB wins," and "both fail" cases — all without a single real cache or database call.',
        'A genuinely useful helper: a small fake service interface returning <code>Task&lt;T&gt;</code> whose implementation just returns a stored <code>TaskCompletionSource&lt;T&gt;</code>\'s <code>.Task</code>, letting the test hold a reference to complete it on demand at any point during the test method\'s execution.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the timeout branch — deterministically, with zero real delay',
      language: 'csharp',
      code: `using Xunit;

// The method under test, from the main page's own pattern:
async Task<string> DoWorkWithTimeoutAsync(Task<string> work, Task timeoutSignal)
{
    var completed = await Task.WhenAny(work, timeoutSignal);
    if (completed == timeoutSignal)
        throw new TimeoutException("Work did not complete in time");
    return await work;
}

public class TimeoutPatternTests
{
    [Fact]
    public async Task TimeoutWins_ThrowsTimeoutException()
    {
        var workSource    = new TaskCompletionSource<string>();
        var timeoutSource = new TaskCompletionSource();

        // Simulate "the timeout fires first" by completing ONLY the
        // timeout source — no real Task.Delay, no real waiting at all:
        timeoutSource.SetResult();

        await Assert.ThrowsAsync<TimeoutException>(() =>
            DoWorkWithTimeoutAsync(workSource.Task, timeoutSource.Task));
        // workSource is deliberately NEVER completed — proving the
        // method correctly detects the timeout branch winning, entirely
        // independent of real timer behavior.
    }

    [Fact]
    public async Task WorkWins_ReturnsResult()
    {
        var workSource    = new TaskCompletionSource<string>();
        var timeoutSource = new TaskCompletionSource();

        // Simulate "the work finishes first" — complete ONLY workSource:
        workSource.SetResult("done");

        string result = await DoWorkWithTimeoutAsync(workSource.Task, timeoutSource.Task);
        Assert.Equal("done", result);
        // timeoutSource is deliberately NEVER completed — proving the
        // method returns the work result when it wins the race.
    }
}`,
    },
    {
      label: 'Testing the cache-vs-database race pattern with two independently controlled sources',
      language: 'csharp',
      code: `async Task<string?> GetProfileFastAsync(Task<string?> cacheTask, Task<string?> dbTask)
{
    var first = await Task.WhenAny(cacheTask, dbTask);
    if (first == cacheTask && await cacheTask is { } cached)
        return cached;
    return await dbTask;
}

public class CacheRaceTests
{
    [Fact]
    public async Task CacheWins_ReturnsCachedValue()
    {
        var cacheSource = new TaskCompletionSource<string?>();
        var dbSource    = new TaskCompletionSource<string?>();

        cacheSource.SetResult("cached-value"); // cache "responds" first
        // dbSource deliberately never completes in this test

        string? result = await GetProfileFastAsync(cacheSource.Task, dbSource.Task);
        Assert.Equal("cached-value", result);
    }

    [Fact]
    public async Task CacheMiss_FallsBackToDatabase()
    {
        var cacheSource = new TaskCompletionSource<string?>();
        var dbSource    = new TaskCompletionSource<string?>();

        cacheSource.SetResult(null); // cache responds first, but with a MISS
        dbSource.SetResult("db-value");

        string? result = await GetProfileFastAsync(cacheSource.Task, dbSource.Task);
        Assert.Equal("db-value", result);
    }
}`,
    },
    {
      label: 'A reusable fake service exposing a controllable TaskCompletionSource',
      language: 'csharp',
      code: `public class FakeAsyncService<T>
{
    private TaskCompletionSource<T> _tcs = new();
    public Task<T> Task => _tcs.Task;

    // The test calls this whenever IT wants the "operation" to finish:
    public void Complete(T result) => _tcs.SetResult(result);
    public void Fail(Exception ex) => _tcs.SetException(ex);
}

public class FlexibleRaceTests
{
    [Fact]
    public async Task Race_HandlesEitherOrderDeterministically()
    {
        var fastPath = new FakeAsyncService<string>();
        var slowPath = new FakeAsyncService<string>();

        fastPath.Complete("won the race"); // completes BEFORE the race
                                            // even starts — no timing
                                            // ambiguity whatsoever

        var winner = await Task.WhenAny(fastPath.Task, slowPath.Task);
        Assert.Equal("won the race", await winner);
        // slowPath.Task is still pending — proving the race genuinely
        // returns as soon as ONE source completes, without needing to
        // ever complete the other.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test for a method <code>async Task&lt;string&gt; FirstNonNullAsync(Task&lt;string?&gt; a, Task&lt;string?&gt; b)</code> that returns whichever of <code>a</code>/<code>b</code> completes first with a non-null value, falling back to the other if the first one that completes is null. Use TaskCompletionSource to make the test deterministic.',
    hint: 'Create two TaskCompletionSource<string?> instances, complete one with null first (simulating it "winning" the race but with no value), then complete the second with a real value, and assert the method returns the second value.',
    solution: `async Task<string> FirstNonNullAsync(Task<string?> a, Task<string?> b)
{
    var first = await Task.WhenAny(a, b);
    var firstResult = await first;
    if (firstResult is not null) return firstResult;

    var second = first == a ? b : a;
    var secondResult = await second;
    return secondResult ?? throw new InvalidOperationException("Both were null");
}

public class FirstNonNullTests
{
    [Fact]
    public async Task FirstCompletesNull_FallsBackToSecond()
    {
        var aSource = new TaskCompletionSource<string?>();
        var bSource = new TaskCompletionSource<string?>();

        // "a" wins the race, but with a null value — deterministic,
        // no real timing involved:
        aSource.SetResult(null);
        bSource.SetResult("fallback-value");

        string result = await FirstNonNullAsync(aSource.Task, bSource.Task);
        Assert.Equal("fallback-value", result);
    }

    [Fact]
    public async Task FirstCompletesNonNull_ReturnsImmediately()
    {
        var aSource = new TaskCompletionSource<string?>();
        var bSource = new TaskCompletionSource<string?>();

        aSource.SetResult("a-value");
        // bSource deliberately never completes — proving the method
        // never even needs to look at it when "a" already has a value:

        string result = await FirstNonNullAsync(aSource.Task, bSource.Task);
        Assert.Equal("a-value", result);
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing timeout or race-condition logic requires using real Task.Delay calls with actual wall-clock waiting.',
      reality: 'a TaskCompletionSource lets a test control exactly when a "background" operation completes, with zero real waiting and zero timing ambiguity — the test becomes both instant and deterministic.',
    },
    {
      thought: 'a test using TaskCompletionSource to simulate a race can only test one specific outcome (whichever completes "first" in real time).',
      reality: 'because the test itself calls SetResult() in whatever order it chooses, it can deterministically construct EVERY possible outcome (A wins, B wins, both fail, etc.) as a separate, reliable test case.',
    },
    {
      thought: 'Task.Delay-based timeout tests that occasionally fail in CI are just "flaky tests" to be retried, not a sign the test itself is poorly designed.',
      reality: 'a test whose pass/fail outcome depends on real wall-clock race timing is fundamentally non-deterministic by construction — replacing the real delay with a TaskCompletionSource-controlled task removes the flakiness at its root instead of retrying around it.',
    },
  ];
}
