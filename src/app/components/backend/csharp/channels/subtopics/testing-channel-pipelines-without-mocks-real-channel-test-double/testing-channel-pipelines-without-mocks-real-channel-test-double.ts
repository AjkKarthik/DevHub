import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-channel-pipelines-without-mocks-real-channel-test-double-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-channel-pipelines-without-mocks-real-channel-test-double.html',
  styleUrl: './testing-channel-pipelines-without-mocks-real-channel-test-double.scss',
})
export class TestingChannelPipelinesWithoutMocksRealChannelTestDoubleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA states this is possible in one sentence — this subtopic actually demonstrates it',
      points: [
        'The main Channels page\'s own Ownership Q&amp;A notes, in passing, that "<code>ChannelWriter&lt;T&gt;</code>/<code>ChannelReader&lt;T&gt;</code> are abstract base classes — you can write unit tests with a <code>Channel.CreateUnbounded&lt;T&gt;()</code> as a test double without any mocking framework." This is stated but never actually shown — a genuinely useful technique worth seeing in full, working test code.',
      ],
    },
    {
      heading: 'Because production code depends only on the reader/writer ABSTRACTIONS, a real (but throwaway) channel substitutes perfectly for any mock',
      points: [
        'A method like the main page\'s own <code>PrintQueue.EnqueueAsync</code> and <code>RunPrinterAsync</code> depend only on <code>ChannelWriter&lt;T&gt;</code>/<code>ChannelReader&lt;T&gt;</code> — NOT on the concrete <code>Channel&lt;T&gt;</code> class. A test can construct a real, ordinary <code>Channel.CreateUnbounded&lt;T&gt;()</code>, hand its <code>.Writer</code>/<code>.Reader</code> to the code under test, and then directly READ from (or WRITE to) the OTHER side of that same channel to observe or drive the behavior — with zero mocking framework involved, because the channel genuinely behaves exactly like production.',
      ],
    },
    {
      heading: 'This directly tests the main page\'s own backpressure and completion-propagation claims',
      points: [
        'A test can verify BACKPRESSURE concretely: create a bounded channel with capacity 1, call the production code\'s enqueue method twice without reading in between, and assert the SECOND call\'s <code>Task</code> has not yet completed (it is genuinely waiting) until a read happens — this proves backpressure is actually working, not just configured.',
        'A test can verify COMPLETION PROPAGATION: call the production shutdown method, then assert <code>reader.Completion</code> (accessed via the SAME channel instance the test constructed) has completed — proving the code under test genuinely calls <code>writer.Complete()</code> and that the drain-then-finish contract holds.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Substituting a real channel for the writer/reader dependencies — no mocking framework',
      language: 'csharp',
      code: `using System.Threading.Channels;
using Xunit;

// The main page's own PrintQueue, refactored to accept its channel
// via constructor injection (the SAME ownership pattern the main page
// already recommends — expose only the view each side needs):
public class PrintQueue
{
    private readonly ChannelWriter<string> _writer;
    private readonly ChannelReader<string> _reader;

    public PrintQueue(ChannelWriter<string> writer, ChannelReader<string> reader)
        => (_writer, _reader) = (writer, reader);

    public Task EnqueueAsync(string document) => _writer.WriteAsync(document).AsTask();

    public async Task RunPrinterAsync(CancellationToken ct)
    {
        await foreach (var doc in _reader.ReadAllAsync(ct))
        {
            await Task.Delay(100, ct);
        }
    }

    public async Task ShutdownAsync()
    {
        _writer.Complete();
    }
}

public class PrintQueueTests
{
    [Fact]
    public async Task EnqueueAsync_WritesDocumentToChannel()
    {
        // A REAL, throwaway channel — no mocking framework needed:
        var channel = Channel.CreateUnbounded<string>();
        var queue = new PrintQueue(channel.Writer, channel.Reader);

        await queue.EnqueueAsync("invoice.pdf");

        // Read directly from the SAME channel's reader side to
        // observe what production code actually wrote:
        bool got = channel.Reader.TryRead(out var doc);
        Assert.True(got);
        Assert.Equal("invoice.pdf", doc);
    }
}`,
    },
    {
      label: 'Directly testing that backpressure genuinely works — not just that it is configured',
      language: 'csharp',
      code: `public class BackpressureTests
{
    [Fact]
    public async Task EnqueueAsync_WhenChannelFull_WaitsUntilSpaceFrees()
    {
        // Bounded channel, capacity 1 — the SAME kind of channel the
        // main page's own PrintQueue example uses, just injected
        // directly here for the test:
        var channel = Channel.CreateBounded<string>(1);
        var queue = new PrintQueue(channel.Writer, channel.Reader);

        await queue.EnqueueAsync("doc-1");   // fills the ONE slot

        // Start a second enqueue WITHOUT awaiting it yet:
        var secondEnqueue = queue.EnqueueAsync("doc-2");

        // Directly proves backpressure is genuinely active — the
        // second WriteAsync call has NOT completed, because the
        // channel is full and no reader has taken anything yet:
        await Task.Delay(50); // brief grace period
        Assert.False(secondEnqueue.IsCompleted);

        // Now free space by reading — the second enqueue should
        // complete shortly after:
        channel.Reader.TryRead(out _);
        await secondEnqueue; // now completes
        Assert.True(secondEnqueue.IsCompletedSuccessfully);
    }
}`,
    },
    {
      label: 'Testing that shutdown genuinely completes the writer and propagates through reader.Completion',
      language: 'csharp',
      code: `public class ShutdownPropagationTests
{
    [Fact]
    public async Task ShutdownAsync_CompletesTheWriter_ObservableViaReaderCompletion()
    {
        var channel = Channel.CreateUnbounded<string>();
        var queue = new PrintQueue(channel.Writer, channel.Reader);

        await queue.EnqueueAsync("last-doc");
        await queue.ShutdownAsync();

        // Drain the buffered item first — reader.Completion only
        // finishes once the channel is BOTH completed AND drained,
        // exactly as the main page's own theory states:
        channel.Reader.TryRead(out var lastDoc);
        Assert.Equal("last-doc", lastDoc);

        // NOW directly verify the shutdown contract: reader.Completion,
        // accessed via the SAME channel instance the test constructed,
        // should be genuinely complete — proving ShutdownAsync really
        // called writer.Complete() and the channel is fully drained:
        await channel.Reader.Completion; // should not hang
        Assert.True(channel.Reader.Completion.IsCompletedSuccessfully);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that after calling the main topic page\'s own <code>PrintQueue.ShutdownAsync()</code>, a SUBSEQUENT call to <code>EnqueueAsync</code> throws <code>ChannelClosedException</code> — using a real channel as the test double, no mocking framework.',
    hint: 'Construct a real Channel.CreateUnbounded<string>(), build a PrintQueue around its Writer/Reader, call ShutdownAsync(), then wrap a call to EnqueueAsync in Assert.ThrowsAsync<ChannelClosedException>.',
    solution: `[Fact]
public async Task EnqueueAsync_AfterShutdown_ThrowsChannelClosedException()
{
    var channel = Channel.CreateUnbounded<string>();
    var queue = new PrintQueue(channel.Writer, channel.Reader);

    await queue.ShutdownAsync(); // completes the writer

    // Directly proves the main page's own documented behavior —
    // "Writes after Complete() throw ChannelClosedException" —
    // using a genuinely real channel instance, no mock setup at all:
    await Assert.ThrowsAsync<ChannelClosedException>(() =>
        queue.EnqueueAsync("too-late"));
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing channel-based producer/consumer code requires a mocking framework to fake ChannelWriter<T>/ChannelReader<T>.',
      reality: 'because these are abstract base classes with a genuine, lightweight concrete implementation (Channel.CreateUnbounded/CreateBounded), a real throwaway channel substitutes perfectly as a test double — no mocking framework is needed at all.',
    },
    {
      thought: 'verifying that a bounded channel provides backpressure just means checking the channel was constructed with a capacity argument.',
      reality: 'genuinely proving backpressure requires filling the channel, starting a second write WITHOUT awaiting it, and asserting that write has NOT completed until space is freed — configuration alone does not prove the runtime behavior.',
    },
    {
      thought: 'a test calling ShutdownAsync() and observing no exception has verified the shutdown logic is correct.',
      reality: 'the meaningful verification is that reader.Completion (accessed via the same channel instance) actually completes, and that buffered items were genuinely drained first — absence of an exception says nothing about whether the completion contract was actually fulfilled.',
    },
  ];
}
