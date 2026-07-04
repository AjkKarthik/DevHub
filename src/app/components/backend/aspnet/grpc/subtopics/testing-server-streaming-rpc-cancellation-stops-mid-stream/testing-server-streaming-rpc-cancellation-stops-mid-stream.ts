import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-server-streaming-cancellation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-server-streaming-rpc-cancellation-stops-mid-stream.html',
  styleUrl: './testing-server-streaming-rpc-cancellation-stops-mid-stream.scss',
})
export class TestingServerStreamingRpcCancellationStopsMidStreamSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A mentions the testing pattern by name — a fake IServerStreamWriter<T> collecting written items — but never shows the actual test that proves the main page\'s own Common Mistake fix works',
      points: [
        'The main gRPC page\'s Q&A says: "For server streaming tests, implement a fake <code>IServerStreamWriter&lt;T&gt;</code> that collects written items into a list." Separately, its own Common Mistake shows the CORRECT fix for the cancellation bug: checking <code>ctx.CancellationToken.IsCancellationRequested</code> in the streaming loop. Neither of these is combined into an actual, runnable test that PROVES the fix works — that a streaming RPC genuinely stops writing once cancellation is requested, rather than continuing to write items after the client has disconnected.',
      ],
    },
    {
      heading: '<code>TestServerCallContext.Create()</code> accepts a CancellationToken directly — cancelling that token mid-test and asserting on how many items the fake stream writer collected proves the streaming loop actually respects it',
      points: [
        'Since <code>TestServerCallContext</code> is constructed with an explicit <code>CancellationToken</code> parameter, a test can create a <code>CancellationTokenSource</code>, pass its token into the context, call the streaming RPC method (NOT awaited synchronously to completion, since it may run indefinitely), cancel the token AFTER a known short delay, and then assert that the fake <code>IServerStreamWriter&lt;T&gt;</code> stopped collecting items shortly after that cancellation — rather than continuing to accumulate items indefinitely, which is exactly the main page\'s own Common Mistake bug.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A fake IServerStreamWriter<T> that collects every written item — the pattern the main page\'s own Q&A names but never shows',
      language: 'csharp',
      code: `using Grpc.Core;
using Grpc.Core.Testing;

public class FakeServerStreamWriter<T> : IServerStreamWriter<T>
{
    public List<T> WrittenItems { get; } = [];
    public WriteOptions? WriteOptions { get; set; }

    public Task WriteAsync(T message)
    {
        WrittenItems.Add(message);
        return Task.CompletedTask;
    }
}

// The main page's own "right" fixed StreamGreetings implementation,
// unchanged — this is the code under test:
public class GreeterService : Greeter.GreeterBase
{
    public override async Task StreamGreetings(
        HelloRequest request,
        IServerStreamWriter<HelloReply> responseStream,
        ServerCallContext context)
    {
        for (var i = 1; i <= 5; i++)
        {
            if (context.CancellationToken.IsCancellationRequested) break;
            await responseStream.WriteAsync(
                new HelloReply { Message = $"Hello {request.Name} ({i}/5)" });
            await Task.Delay(500, context.CancellationToken);
        }
    }
}`,
    },
    {
      label: 'The test that proves cancellation actually stops the stream mid-way — not just that it eventually completes',
      language: 'csharp',
      code: `public class GreeterServiceStreamingTests
{
    [Fact]
    public async Task StreamGreetings_StopsWriting_AssoonAsCancellationRequested()
    {
        var service = new GreeterService();
        var fakeStream = new FakeServerStreamWriter<HelloReply>();
        using var cts = new CancellationTokenSource();

        // TestServerCallContext.Create() accepts the cancellation token
        // directly — this is what wires the test's own CTS into
        // 'context.CancellationToken' inside the RPC method:
        var context = TestServerCallContext.Create(
            method: "StreamGreetings", host: null, deadline: DateTime.UtcNow.AddMinutes(1),
            requestHeaders: [], cancellationToken: cts.Token,
            peer: "test-peer", authContext: null, contextPropagationToken: null,
            writeHeadersFunc: _ => Task.CompletedTask,
            writeOptionsGetter: () => null, writeOptionsSetter: _ => { });

        // Start the streaming call WITHOUT awaiting it to completion —
        // it writes 5 items with a 500ms delay between each, so it
        // would normally take ~2.5 seconds to finish naturally:
        var streamingTask = service.StreamGreetings(
            new HelloRequest { Name = "Alice" }, fakeStream, context);

        // Let it write roughly 2 items (~1 second), THEN cancel —
        // simulating a client disconnecting partway through:
        await Task.Delay(1100);
        cts.Cancel();

        // Wait for the (now-cancelled) streaming task to actually stop:
        await streamingTask;

        // THE KEY ASSERTION: fewer than all 5 items were written,
        // proving the loop's 'if (context.CancellationToken
        // .IsCancellationRequested) break;' check actually took effect
        // rather than the loop running to completion regardless of
        // cancellation — exactly the class of regression the main
        // page's own Common Mistake describes:
        Assert.True(fakeStream.WrittenItems.Count < 5,
            $"Expected the stream to stop early after cancellation, but all " +
            $"{fakeStream.WrittenItems.Count} items were written — the " +
            "cancellation check may have been removed or is not being reached.");
        Assert.True(fakeStream.WrittenItems.Count >= 2,
            "Expected at least 2 items to have been written before cancellation, " +
            "given the 1.1s delay before cancelling.");
    }
}

// WHAT THIS TEST ACTUALLY CATCHES: reintroducing the main page's own
// BROKEN version (a 'while (true)' loop with no cancellation check)
// would make 'fakeStream.WrittenItems.Count' equal 5 (or hang
// entirely, since the broken loop never terminates on its own) —
// either way, this test fails, directly proving whether the
// cancellation-respecting behavior the main page documents is ACTUALLY
// implemented, not just described in a code comment.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The test in this subtopic uses a fixed 1.1-second delay before cancelling, tuned to the RPC\'s own hardcoded 500ms per-item delay. Explain why this kind of timing-dependent test is inherently a bit fragile, and propose a more deterministic alternative that does not rely on real wall-clock delays at all.',
    hint: 'Consider making the FakeServerStreamWriter itself trigger the cancellation — for example, cancelling the CancellationTokenSource automatically after a specific NUMBER of items have been written, rather than after a fixed amount of real time has passed.',
    solution: `Relying on real wall-clock delays (Task.Delay(1100) tuned against the
RPC's own 500ms per-item delay) is fragile because it depends on the
test environment's actual timing behavior — a slow CI runner, GC
pause, or thread-pool contention could shift the exact number of items
written before the 1.1-second mark, making the test occasionally flaky
(asserting "at least 2, fewer than 5" gives some slack, but a tighter
assertion would be more fragile still).

A more deterministic alternative: have the FAKE stream writer itself
trigger cancellation after a specific COUNT of items, removing all
real-time dependency:

public class FakeServerStreamWriter<T> : IServerStreamWriter<T>
{
    public List<T> WrittenItems { get; } = [];
    public WriteOptions? WriteOptions { get; set; }

    // A callback fired after each write — lets a test decide exactly
    // WHEN to cancel, based on item COUNT rather than elapsed time:
    public Action<int>? OnItemWritten { get; set; }

    public Task WriteAsync(T message)
    {
        WrittenItems.Add(message);
        OnItemWritten?.Invoke(WrittenItems.Count);
        return Task.CompletedTask;
    }
}

[Fact]
public async Task StreamGreetings_StopsWriting_ExactlyAfterCancellationCount()
{
    var service = new GreeterService();
    using var cts = new CancellationTokenSource();
    var fakeStream = new FakeServerStreamWriter<HelloReply>
    {
        // Cancel deterministically after EXACTLY the 2nd item is
        // written — no real-time delay assumptions anywhere in this
        // test at all:
        OnItemWritten = count => { if (count == 2) cts.Cancel(); }
    };

    var context = TestServerCallContext.Create(/* ... cts.Token ... */);

    await service.StreamGreetings(new HelloRequest { Name = "Alice" }, fakeStream, context);

    // Now a PRECISE assertion is safe, since the test controls
    // EXACTLY when cancellation fires relative to the write count:
    Assert.Equal(2, fakeStream.WrittenItems.Count);
}

This removes ALL dependency on Task.Delay durations matching up with
real elapsed time — the test becomes purely event-driven (cancel after
a specific COUNT of writes) rather than time-driven (cancel after a
specific DURATION), which is both faster to run and immune to CI
timing flakiness.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own Q&A description of the testing pattern ("implement a fake IServerStreamWriter<T> that collects written items into a list") is itself sufficient verification that a streaming RPC\'s cancellation behavior is correct.',
      reality: 'the Q&A only describes HOW to observe what a streaming method writes — it does not, on its own, prove that cancellation actually stops the writing early; a dedicated test that cancels mid-stream and asserts on the partial item count is what verifies the cancellation-respecting behavior specifically.',
    },
    {
      thought: 'a test that awaits a streaming RPC method to full completion and checks the final item count is sufficient to test cancellation behavior.',
      reality: 'testing cancellation specifically requires cancelling the token WHILE the RPC is still running (not waiting for natural completion first) — the whole point is to prove the method reacts to an IN-PROGRESS cancellation, not just that it eventually finishes normally.',
    },
    {
      thought: 'a fixed wall-clock delay (like waiting 1.1 seconds before cancelling) is a reliable way to test that a streaming RPC stops partway through.',
      reality: 'timing-dependent tests relying on real delays can be flaky under CI load variance — triggering cancellation based on a deterministic event (like a specific write COUNT via a callback on the fake stream writer) removes the real-time dependency entirely.',
    },
  ];
}
