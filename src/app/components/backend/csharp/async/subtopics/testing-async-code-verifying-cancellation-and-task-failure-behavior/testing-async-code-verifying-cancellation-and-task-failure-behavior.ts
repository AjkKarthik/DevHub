import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-async-code-verifying-cancellation-and-task-failure-behavior-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-async-code-verifying-cancellation-and-task-failure-behavior.html',
  styleUrl: './testing-async-code-verifying-cancellation-and-task-failure-behavior.scss',
})
export class TestingAsyncCodeVerifyingCancellationAndTaskFailureBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s async void QnA, extended to the tests you SHOULD write',
      points: [
        'The main Async page has a QnA explaining WHY async void is untestable (no Task to await, so a test\'s assertion races the method\'s own completion) — but it never shows what a CORRECT async test actually looks like, or how to verify the main topic\'s own CancellationToken and Task.WhenAll behaviors are implemented correctly in your code.',
      ],
    },
    {
      heading: 'The basic shape — async Task test methods',
      points: [
        'xUnit (and most .NET test frameworks) support <code>async Task</code> as a valid test method signature: <code>[Fact] public async Task MyMethod_DoesX() &#123; var result = await MyAsyncMethod(); Assert.Equal(expected, result); &#125;</code> — the test RUNNER awaits the returned Task itself, so the test genuinely waits for the async work to complete before evaluating assertions, eliminating the exact race condition the main topic\'s async void QnA describes.',
        'This is why the main topic\'s advice ("any method you intend to call from your own code, including tests, needs to return Task") is not just a style preference — it is what makes deterministic async testing possible at all.',
      ],
    },
    {
      heading: 'Testing that CancellationToken forwarding actually works',
      points: [
        'The main topic\'s "Dropping the CancellationToken" Common Mistake describes a token accepted but never forwarded — this is DIRECTLY testable: create a <code>CancellationTokenSource</code>, cancel it BEFORE calling the method under test, and assert the method throws <code>OperationCanceledException</code> (or its more specific subtype, <code>TaskCanceledException</code>) — a method that silently ignores the token will complete NORMALLY instead of throwing, making the test fail in an obvious, specific way.',
        'For methods with a LOOP that should check cancellation mid-iteration, a stronger test cancels the token FROM WITHIN a fake dependency partway through the operation (e.g. the second call to a mocked repository triggers <code>cts.Cancel()</code>) — proving the operation actually stops responding to a mid-flight cancellation, not just a cancellation requested before the method starts.',
      ],
    },
    {
      heading: 'Testing Task.WhenAll error-aggregation behavior',
      points: [
        'The main topic notes <code>Task.WhenAll</code> "re-throws the FIRST exception only" when awaited directly, but exposes ALL exceptions via the Task\'s own <code>.Exception.InnerExceptions</code> — both halves of this are independently testable: <code>await Assert.ThrowsAsync&lt;Exception&gt;(() =&gt; Task.WhenAll(failingTask1, failingTask2))</code> proves the awaited call throws (only the first exception surfaces this way), while a SEPARATE assertion on the WhenAll task\'s <code>.Exception.InnerExceptions.Count</code> (after catching the awaited exception) proves BOTH failures are still recorded and inspectable.',
        'This distinction matters in practice: logging code that only catches the awaited exception from <code>Task.WhenAll</code> will silently miss additional failures beyond the first — a test asserting on <code>InnerExceptions.Count</code> specifically catches a logging/observability gap that a single "did it throw" test would not.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The basic async test pattern — genuinely deterministic',
      language: 'csharp',
      code: `public class OrderServiceTests
{
    [Fact]
    public async Task ProcessOrderAsync_ReturnsCompletedOrder_ForValidInput()
    {
        var service = new OrderService(new FakeRepository(), new FakePaymentGateway());

        // The TEST RUNNER awaits this Task — genuinely waits for completion,
        // unlike an async void method where the caller has no handle to wait on.
        var result = await service.ProcessOrderAsync(orderId: 1);

        Assert.Equal(OrderStatus.Completed, result.Status);
    }

    [Fact]
    public async Task ProcessOrderAsync_ThrowsInvalidOperationException_WhenPaymentFails()
    {
        var service = new OrderService(new FakeRepository(), new FailingPaymentGateway());

        // Assert.ThrowsAsync awaits internally — proper way to test an
        // async method that is EXPECTED to throw.
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessOrderAsync(orderId: 1));
    }
}`,
    },
    {
      label: 'Testing CancellationToken forwarding — both scenarios',
      language: 'csharp',
      code: `public class CancellationTests
{
    [Fact]
    public async Task ProcessOrderAsync_ThrowsOperationCanceled_WhenTokenAlreadyCancelled()
    {
        var service = new OrderService(new FakeRepository(), new FakePaymentGateway());
        using var cts = new CancellationTokenSource();
        cts.Cancel(); // cancelled BEFORE the call even starts

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => service.ProcessOrderAsync(orderId: 1, cts.Token));

        // If this test PASSES when it shouldn't (i.e. the method completes
        // normally instead of throwing), that's exactly the "dropped
        // CancellationToken" bug the main topic warns about — the token
        // was accepted but never actually forwarded/checked.
    }

    [Fact]
    public async Task BatchProcessAsync_StopsMidLoop_WhenCancelledPartway()
    {
        using var cts = new CancellationTokenSource();
        var repo = new CancellingFakeRepository(cts); // cancels cts on its 2nd call

        var service = new BatchService(repo);

        // A STRONGER test than "cancelled before starting" — proves the
        // loop actually responds to cancellation requested MID-OPERATION,
        // not just a token that was already cancelled at the outset.
        await Assert.ThrowsAsync<OperationCanceledException>(
            () => service.BatchProcessAsync(["a", "b", "c", "d"], cts.Token));

        Assert.Equal(2, repo.CallCount); // stopped after the 2nd item, not all 4
    }
}

// A fake that triggers cancellation from WITHIN the operation, simulating
// a real-world "user cancels mid-request" scenario more realistically
// than pre-cancelling the token.
class CancellingFakeRepository(CancellationTokenSource cts)
{
    public int CallCount { get; private set; }

    public Task ProcessItemAsync(string item, CancellationToken ct)
    {
        CallCount++;
        if (CallCount == 2) cts.Cancel(); // cancel partway through
        ct.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }
}`,
    },
    {
      label: 'Testing Task.WhenAll\'s error-aggregation behavior',
      language: 'csharp',
      code: `public class WhenAllErrorTests
{
    [Fact]
    public async Task WhenAll_ThrowsOnlyTheFirstException_WhenAwaitedDirectly()
    {
        var task1 = FailAfterAsync("A", 10);
        var task2 = FailAfterAsync("B", 20);

        // Awaiting Task.WhenAll surfaces only ONE exception, even though
        // both tasks fail — exactly the main topic's documented behavior.
        var ex = await Assert.ThrowsAsync<Exception>(
            () => Task.WhenAll(task1, task2));

        Assert.Equal("A", ex.Message); // the FIRST one to fault
    }

    [Fact]
    public async Task WhenAll_Task_ExposesAllExceptions_ViaInnerExceptions()
    {
        var task1 = FailAfterAsync("A", 10);
        var task2 = FailAfterAsync("B", 20);

        var whenAllTask = Task.WhenAll(task1, task2);
        try { await whenAllTask; } catch { /* only the first is observed here */ }

        // This is the test that catches a logging/observability gap:
        // code that only logs the awaited exception MISSES this second failure.
        Assert.NotNull(whenAllTask.Exception);
        Assert.Equal(2, whenAllTask.Exception!.InnerExceptions.Count);
        Assert.Contains(whenAllTask.Exception.InnerExceptions, e => e.Message == "A");
        Assert.Contains(whenAllTask.Exception.InnerExceptions, e => e.Message == "B");
    }

    static async Task FailAfterAsync(string message, int delayMs)
    {
        await Task.Delay(delayMs);
        throw new Exception(message);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>Task.WhenAny</code>\'s timeout pattern (from the main topic\'s Parallelism tab — racing real work against a <code>Task.Delay</code>) correctly throws <code>TimeoutException</code> when the work takes LONGER than the timeout, and does NOT throw when the work finishes FIRST.',
    hint: 'Write two tests: one where the "work" task uses Task.Delay(2000) against a 100ms timeout (expect TimeoutException), and one where "work" uses Task.Delay(50) against a 2000ms timeout (expect it to complete normally, asserting the correct result rather than a thrown exception).',
    solution: `public class TimeoutPatternTests
{
    private static async Task<string> DoWorkAsync(int delayMs, string result)
    {
        await Task.Delay(delayMs);
        return result;
    }

    private static async Task<string> WithTimeoutAsync(Task<string> work, TimeSpan timeout)
    {
        var timeoutTask = Task.Delay(timeout);
        var completed = await Task.WhenAny(work, timeoutTask);

        if (completed == timeoutTask)
            throw new TimeoutException("Work did not complete in time");

        return await work; // safe — already completed
    }

    [Fact]
    public async Task WithTimeoutAsync_ThrowsTimeoutException_WhenWorkIsSlowerThanTimeout()
    {
        var work = DoWorkAsync(delayMs: 2000, result: "done");

        await Assert.ThrowsAsync<TimeoutException>(
            () => WithTimeoutAsync(work, TimeSpan.FromMilliseconds(100)));
    }

    [Fact]
    public async Task WithTimeoutAsync_ReturnsResult_WhenWorkFinishesBeforeTimeout()
    {
        var work = DoWorkAsync(delayMs: 50, result: "done");

        var result = await WithTimeoutAsync(work, TimeSpan.FromSeconds(2));

        Assert.Equal("done", result);
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing an async method just means calling it and immediately asserting on the result, since await already handles the waiting.',
      reality: 'the TEST METHOD ITSELF must also be declared async Task (not async void) so the test runner genuinely awaits it — an async void test method has the exact same "no Task to observe" problem the main topic describes for async void in general, producing flaky, timing-dependent test results.',
    },
    {
      thought: 'if a test proves <code>Task.WhenAll</code> throws when tasks fail, that\'s sufficient coverage — you\'ve verified the error-handling behavior.',
      reality: 'awaiting Task.WhenAll directly surfaces only the FIRST exception — a separate assertion on the WhenAll task\'s own .Exception.InnerExceptions is needed to prove ALL failures are recorded, catching a real gap where logging code that only handles the awaited exception silently misses additional failures.',
    },
    {
      thought: 'testing that a CancellationToken works only requires cancelling the token BEFORE calling the method and asserting it throws.',
      reality: 'this only proves the entry-point check works — a stronger test cancels the token FROM WITHIN a mid-operation dependency (partway through a loop or multi-step process) to prove the operation genuinely responds to cancellation requested mid-flight, not just a token that was already cancelled at the outset.',
    },
  ];
}
