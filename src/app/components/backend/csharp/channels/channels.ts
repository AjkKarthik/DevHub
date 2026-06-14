import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-channels',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './channels.html',
  styleUrl: './channels.scss',
})
export class CsharpChannels {

  quickRef: QuickRefItem[] = [
    { name: 'Channel.CreateUnbounded<T>()', type: 'method', desc: 'Queue with no capacity limit — writes always succeed (memory is the limit)', since: '.NET Core 3' },
    { name: 'Channel.CreateBounded<T>(n)',  type: 'method', desc: 'Fixed-capacity queue — full channel applies backpressure to writers', since: '.NET Core 3' },
    { name: 'channel.Writer.WriteAsync()',  type: 'method', desc: 'Writes an item; on a full bounded channel it waits (backpressure)', since: '.NET Core 3' },
    { name: 'channel.Reader.ReadAllAsync()', type: 'method', desc: 'IAsyncEnumerable view of the channel — consume with await foreach', since: '.NET Core 3' },
    { name: 'writer.TryWrite(item)',        type: 'method', desc: 'Synchronous non-blocking write — false if full/completed', since: '.NET Core 3' },
    { name: 'writer.Complete()',            type: 'method', desc: 'Signals "no more items" — readers drain the rest, then finish', since: '.NET Core 3' },
    { name: 'writer.TryComplete()',         type: 'method', desc: 'Like Complete() but returns false instead of throwing if already completed — safe in races', since: '.NET Core 3' },
    { name: 'reader.Completion',            type: 'method', desc: 'Task that completes when the channel is completed AND drained', since: '.NET Core 3' },
    { name: 'BoundedChannelFullMode',       type: 'type',   desc: 'What a full channel does: Wait (default), DropOldest, DropNewest, DropWrite', since: '.NET Core 3' },
    { name: 'SingleReader / SingleWriter',  type: 'syntax', desc: 'ChannelOptions hints that unlock faster lock-free fast paths when only one reader/writer exists', since: '.NET Core 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What a Channel is — an async-first queue',
      points: [
        '<code>Channel&lt;T&gt;</code> is a thread-safe hand-off between producers and consumers, designed for async: writers <code>await WriteAsync</code>, readers <code>await foreach (… in ReadAllAsync())</code>. No threads block — they yield.',
        'It splits into two views: <code>ChannelWriter&lt;T&gt;</code> (the producer API) and <code>ChannelReader&lt;T&gt;</code> (the consumer API). Hand each side only the view it needs — this enforces ownership and prevents consumers accidentally completing the channel.',
        'Compared to its predecessors: <code>BlockingCollection</code> blocks real threads (sync world); TPL Dataflow is a heavier framework of linked, automatically connected blocks. Channels are the lightweight, allocation-conscious modern default.',
        'Channels live in <code>System.Threading.Channels</code> — available since .NET Core 2.1 / .NET Standard 2.1. No NuGet package needed on .NET 5+.',
        'Typical uses: work queues inside a service, decoupling a fast producer from a slow consumer, fan-out to N competing workers, and feeding <code>BackgroundService</code> loops in ASP.NET Core.',
      ],
    },
    {
      heading: 'Bounded vs unbounded — backpressure is the point',
      points: [
        '<code>CreateUnbounded</code> never blocks writers — which means a slow consumer lets the queue (and your memory) grow without limit. Use it only when production is naturally bounded or dropping items is not acceptable.',
        '<code>CreateBounded(capacity)</code> caps the queue. When full, <code>WriteAsync</code> waits until space frees — the producer is automatically slowed to the consumer\'s pace. That feedback loop is <strong>backpressure</strong>, and it is why bounded is the safer default for most production systems.',
        '<code>BoundedChannelFullMode</code> picks the alternative to waiting: <code>DropOldest</code> keeps freshest items (ideal for telemetry/metrics), <code>DropNewest</code> keeps oldest, or <code>DropWrite</code> discards the incoming item.',
        'Set <code>SingleReader</code>/<code>SingleWriter = true</code> in the options when true — the channel switches to faster lock-free implementations. These are promises, not constraints — violating them causes undefined behaviour.',
        'Sizing the bound: too small causes excessive backpressure and starves producers; too large wastes memory. A common heuristic is 2–4× the expected burst size or the time to drain one batch.',
      ],
    },
    {
      heading: 'Completion — shutting a pipeline down cleanly',
      points: [
        'When the producer is done it calls <code>writer.Complete()</code> (or <code>Complete(exception)</code> to fault the channel with an error). Reads on a faulted channel throw that exception.',
        'Readers keep draining buffered items after <code>Complete()</code>; when the buffer is empty, <code>ReadAllAsync</code> simply ends and <code>await foreach</code> exits cleanly.',
        '<code>reader.Completion</code> is a Task that completes only when the channel is completed <em>and</em> fully drained — await it to know the pipeline truly finished before doing cleanup.',
        'Writes after <code>Complete()</code> throw <code>ChannelClosedException</code>. Use <code>TryComplete()</code> when multiple producers might race to close — it returns false instead of throwing if already completed.',
        'Always pair with <code>CancellationToken</code>: both <code>WriteAsync(item, ct)</code> and <code>ReadAllAsync(ct)</code> accept one, so application shutdown can abandon the pipeline without deadlocking.',
      ],
    },
    {
      heading: 'Pipelines and fan-out patterns',
      points: [
        'Producer/consumer: one task writes, one or more tasks consume — the channel absorbs bursts and the bound smooths them out, preventing the fast producer from overwhelming the slow consumer.',
        'Fan-out: N worker tasks all <code>await foreach</code> the same reader — each item is delivered to exactly <strong>one</strong> worker (channels are competing-consumer queues, not broadcasts). This is effectively a work-stealing thread pool.',
        'Multi-stage pipelines: stage A\'s consumer is stage B\'s producer — download → parse → save — each stage with its own channel, bound, parallelism, and error handling.',
        'Error propagation across stages: each stage wraps its logic in try/catch and calls <code>writer.Complete(ex)</code> on failure. The exception re-throws from the next stage\'s <code>await foreach</code>, propagating the fault cleanly downstream.',
        'For broadcast (every subscriber sees every item) channels are the wrong tool. Create one channel per subscriber, or use System.Reactive, an event bus, or a pub/sub library.',
      ],
    },
    {
      heading: 'Channel vs BlockingCollection vs TPL Dataflow',
      points: [
        '<code>BlockingCollection&lt;T&gt;</code> is the classic sync producer/consumer queue. <code>Add()</code> and <code>Take()</code> block threads — fine for dedicated background threads, but wasteful in async code where thread-pool threads should never block.',
        '<code>Channel&lt;T&gt;</code> is the async successor: <code>WriteAsync</code> and <code>ReadAllAsync</code> yield instead of blocking. No threads are consumed while waiting for capacity or items.',
        'TPL Dataflow (<code>ActionBlock</code>, <code>TransformBlock</code>, etc.) is a full pipeline framework with built-in parallelism per block, automatic completion propagation, and block linking. More powerful but heavier — more allocations and more cognitive overhead.',
        'Channels are a single primitive you compose yourself with plain tasks. The result is more explicit but also more flexible — you control error handling, parallelism, and shutdown precisely.',
        'Rule of thumb: start with <code>Channel&lt;T&gt;</code>. Reach for Dataflow only when its automatic block-graph features (linking, parallelism settings per block, join/broadcast blocks) genuinely save significant code.',
      ],
    },
    {
      heading: 'Ownership and the writer/reader split',
      points: [
        'The channel itself is usually a private field. Expose only <code>ChannelReader&lt;T&gt;</code> to consumers and only <code>ChannelWriter&lt;T&gt;</code> to producers — this makes ownership explicit and prevents consumers from accidentally completing the write side.',
        'In a <code>BackgroundService</code> pattern: the service owns the channel; HTTP controllers or other producers get only the writer; the background loop gets only the reader.',
        '<code>ChannelWriter&lt;T&gt;</code>/<code>ChannelReader&lt;T&gt;</code> are abstract base classes — you can write unit tests with a <code>Channel.CreateUnbounded&lt;T&gt;()</code> as a test double without any mocking framework.',
        'Always complete the writer in a finally block (or use <code>TryComplete()</code>) to guarantee the reader\'s <code>await foreach</code> eventually terminates even when an exception occurs.',
        'Multiple producers are fine with a multi-writer channel. For a single writer, declare <code>SingleWriter = true</code> to get a faster lock-free implementation — but only when you can genuinely guarantee at most one concurrent writer.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Producer / consumer',
      language: 'csharp',
      code: `using System.Threading.Channels;

var channel = Channel.CreateBounded<string>(
    new BoundedChannelOptions(capacity: 10)
    {
        SingleWriter = true,
        SingleReader = true,
        FullMode = BoundedChannelFullMode.Wait,   // backpressure (default)
    });

// Producer — slowed automatically when the channel is full
var producer = Task.Run(async () =>
{
    for (int i = 1; i <= 100; i++)
    {
        await channel.Writer.WriteAsync($"job-{i}");   // waits if full
    }
    channel.Writer.Complete();                          // no more items
});

// Consumer — drains until Complete() AND empty
var consumer = Task.Run(async () =>
{
    await foreach (var job in channel.Reader.ReadAllAsync())
    {
        await Task.Delay(50);                  // simulate slow work
        Console.WriteLine($"processed {job}");
    }
});

await Task.WhenAll(producer, consumer);
// All 100 jobs processed; memory never held more than 10 at a time.`,
    },
    {
      label: 'Fan-out workers',
      language: 'csharp',
      code: `var channel = Channel.CreateBounded<Uri>(50);

// ONE queue, FOUR workers — each URL goes to exactly one worker
var workers = Enumerable.Range(1, 4).Select(id => Task.Run(async () =>
{
    using var http = new HttpClient();
    await foreach (var url in channel.Reader.ReadAllAsync())
    {
        var html = await http.GetStringAsync(url);
        Console.WriteLine($"worker {id}: {url} → {html.Length} chars");
    }
})).ToArray();

// Feed the queue from any number of sources
foreach (var link in await LoadLinksAsync())
    await channel.Writer.WriteAsync(link);

channel.Writer.Complete();
await Task.WhenAll(workers);          // workers exit when drained

// Want every consumer to see EVERY item instead (broadcast)?
// Channels don't do that — create one channel per subscriber,
// or look at System.Reactive / event patterns.`,
    },
    {
      label: 'Full modes & drops',
      language: 'csharp',
      code: `// Telemetry: keep the FRESHEST samples, silently drop old ones —
// a stalled consumer must never stall the app being measured.
var metrics = Channel.CreateBounded<Sample>(
    new BoundedChannelOptions(1_000)
    {
        FullMode = BoundedChannelFullMode.DropOldest,
    });

// Producer side never waits with drop modes:
metrics.Writer.TryWrite(new Sample(DateTime.UtcNow, cpu: 0.82));

// FullMode cheat sheet for a FULL channel:
//   Wait        → WriteAsync waits for space        (lossless, backpressure)
//   DropOldest  → evict head, accept new item       (keep freshest)
//   DropNewest  → evict the most recent buffered    (keep oldest)
//   DropWrite   → discard the incoming item         (keep buffer as-is)

// Completion + error propagation:
try
{
    await ProduceAllAsync(metrics.Writer);
    metrics.Writer.Complete();                 // success: end of stream
}
catch (Exception ex)
{
    metrics.Writer.Complete(ex);               // fault the channel —
}                                              // readers' await foreach throws

await metrics.Reader.Completion;               // done AND drained`,
    },
    {
      label: 'Pipeline + cancellation',
      language: 'csharp',
      code: `// download → parse: two stages, independent pacing, clean shutdown
static async Task RunPipelineAsync(CancellationToken ct)
{
    var raw    = Channel.CreateBounded<string>(20);
    var parsed = Channel.CreateBounded<Report>(20);

    var downloader = Task.Run(async () =>
    {
        try
        {
            using var http = new HttpClient();
            await foreach (var url in GetUrlsAsync(ct))
                await raw.Writer.WriteAsync(
                    await http.GetStringAsync(url, ct), ct);
            raw.Writer.Complete();
        }
        catch (Exception ex) { raw.Writer.Complete(ex); }
    }, ct);

    var parser = Task.Run(async () =>
    {
        try
        {
            await foreach (var html in raw.Reader.ReadAllAsync(ct))
                await parsed.Writer.WriteAsync(Report.Parse(html), ct);
            parsed.Writer.Complete();
        }
        catch (Exception ex) { parsed.Writer.Complete(ex); }
    }, ct);

    await foreach (var report in parsed.Reader.ReadAllAsync(ct))
        await SaveAsync(report, ct);

    await Task.WhenAll(downloader, parser);
}
// Cancel the token → every WriteAsync/ReadAllAsync throws
// OperationCanceledException and the whole pipeline unwinds cleanly.`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting writer.Complete() — consumer awaits forever',
      wrong: `// Producer writes items but never signals it is done
var channel = Channel.CreateUnbounded<string>();

await Task.Run(async () =>
{
    for (int i = 0; i < 100; i++)
        await channel.Writer.WriteAsync($"item-{i}");
    // FORGOT: channel.Writer.Complete()
});

// Consumer reads all 100 items... then hangs here forever waiting for more
await foreach (var item in channel.Reader.ReadAllAsync())
    Process(item);

// ReadAllAsync never ends — the await foreach is an infinite loop`,
      right: `// Always Complete() the writer when done — even in the face of exceptions
var channel = Channel.CreateUnbounded<string>();

var producer = Task.Run(async () =>
{
    try
    {
        for (int i = 0; i < 100; i++)
            await channel.Writer.WriteAsync($"item-{i}");
    }
    finally
    {
        channel.Writer.Complete();  // always signals done — even after exception
    }
});

await foreach (var item in channel.Reader.ReadAllAsync())
    Process(item);  // exits cleanly after all 100 items and Complete() is called

await producer;`,
      explanation: 'ReadAllAsync() only terminates when the channel is both completed (writer.Complete() called) AND fully drained. If the writer never calls Complete(), the consumer\'s await foreach runs forever — leaking the consumer task and any thread it holds. Always Complete() in a finally block, or use TryComplete() when multiple producers may race to close.',
    },
    {
      title: 'Using an unbounded channel with a slow consumer — memory grows unchecked',
      wrong: `// Unbounded channel + slow consumer = growing memory, eventually OOM
var channel = Channel.CreateUnbounded<Order>();  // no capacity limit!

// Producer: fast — writes 10,000 orders per second
var producer = Task.Run(async () =>
{
    await foreach (var order in GetOrdersFromKafkaAsync())
        await channel.Writer.WriteAsync(order);  // always succeeds immediately
});

// Consumer: slow — each DB write takes 100ms
var consumer = Task.Run(async () =>
{
    await foreach (var order in channel.Reader.ReadAllAsync())
        await _db.SaveAsync(order);  // 10 per second — can't keep up
});

// After a few minutes: 590,000 buffered orders eating several GB of RAM`,
      right: `// Bounded channel applies backpressure automatically
var channel = Channel.CreateBounded<Order>(new BoundedChannelOptions(500)
{
    FullMode = BoundedChannelFullMode.Wait,   // producer waits when full
});

// Now WriteAsync blocks when 500 orders are queued
// Producer is naturally paced to the consumer — no memory growth`,
      explanation: 'An unbounded channel absorbs items as fast as the producer writes them. If the consumer is slower than the producer, the queue grows indefinitely until the process runs out of memory. Use a bounded channel so WriteAsync backs off when the queue is full — this is backpressure. Choose the capacity based on expected burst size and acceptable latency.',
    },
    {
      title: 'Writing to a completed channel — ChannelClosedException',
      wrong: `var channel = Channel.CreateUnbounded<string>();

// Shutdown logic calls Complete() prematurely during processing
async Task Shutdown() => channel.Writer.Complete();

// Meanwhile the producer is still writing...
await channel.Writer.WriteAsync("item");   // OK

await Shutdown();  // Complete() called

await channel.Writer.WriteAsync("more");   // throws ChannelClosedException!
channel.Writer.TryWrite("more");           // returns false — but exception not thrown`,
      right: `// Check before writing with TryWrite, or handle the exception
if (!channel.Writer.TryWrite(item))
{
    // Channel is full (bounded + not Wait mode) or completed
    _logger.LogWarning("Could not write {Item} — channel full or closed", item);
}

// For multiple producers racing to complete: use TryComplete()
// to avoid ChannelClosedException if already completed
channel.Writer.TryComplete();   // safe: returns false if already completed

// Or wrap writes in try/catch:
try
{
    await channel.Writer.WriteAsync(item, ct);
}
catch (ChannelClosedException)
{
    // Channel was completed — normal during shutdown
}`,
      explanation: 'Once writer.Complete() is called, any subsequent WriteAsync throws ChannelClosedException. TryWrite returns false silently. In systems with multiple producers or concurrent shutdown, you must either check completion before writing, handle the exception, or use TryComplete() to safely signal completion from multiple places.',
    },
    {
      title: 'Lying about SingleWriter/SingleReader — undefined behavior under contention',
      wrong: `// Declaring SingleWriter = true but using multiple concurrent producers
var channel = Channel.CreateBounded<string>(new BoundedChannelOptions(100)
{
    SingleWriter = true,   // LIE — two tasks will write concurrently
    SingleReader = true,
});

// Two concurrent writers on a "single writer" channel
var writer1 = Task.Run(async () =>
{
    for (int i = 0; i < 50; i++)
        await channel.Writer.WriteAsync($"A-{i}");  // races with writer2
});
var writer2 = Task.Run(async () =>
{
    for (int i = 0; i < 50; i++)
        await channel.Writer.WriteAsync($"B-{i}");  // races with writer1
});
// Result: data corruption, lost items, or runtime exceptions`,
      right: `// Declare SingleWriter only when you can guarantee ONE concurrent writer
var channel = Channel.CreateBounded<string>(new BoundedChannelOptions(100)
{
    SingleWriter = false,  // honest — multiple producers will write
    SingleReader = true,   // honest — single consumer task
});

// With honest options, concurrent writes are safe:
await Task.WhenAll(
    Task.Run(async () => { for (int i = 0; i < 50; i++) await channel.Writer.WriteAsync($"A-{i}"); }),
    Task.Run(async () => { for (int i = 0; i < 50; i++) await channel.Writer.WriteAsync($"B-{i}"); })
);`,
      explanation: 'SingleWriter and SingleReader are performance hints — when true, the channel uses a faster, lock-free implementation that skips multi-access coordination. If you set SingleWriter = true but have two concurrent writers, you bypass the coordination that prevents data races, causing silent data corruption, lost items, or crashes. Only set these to true when you can absolutely guarantee the access pattern.',
    },
    {
      title: 'Not awaiting reader.Completion — processing incomplete on shutdown',
      wrong: `// Service shuts down before all buffered items are processed
public class OrderProcessingService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        _channel.Writer.Complete();  // signal done

        // WRONG: not awaiting Completion — some items may still be buffered!
        // The service returns here while the consumer task is still draining.
    }
}`,
      right: `public class OrderProcessingService : BackgroundService
{
    private readonly Channel<Order> _channel = Channel.CreateBounded<Order>(100);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var consumer = Task.Run(async () =>
        {
            await foreach (var order in _channel.Reader.ReadAllAsync())
                await ProcessOrderAsync(order);
        }, ct);

        // Produce until cancellation...
        await ProduceAsync(ct);

        _channel.Writer.Complete();

        // CORRECT: wait until the channel is fully drained before returning
        await _channel.Reader.Completion;
        await consumer;
    }
}`,
      explanation: 'writer.Complete() signals that no more items will be written, but buffered items are still in the queue. reader.Completion is a Task that only completes when the channel is both completed AND empty (all items read). If you exit your service without awaiting Completion, in-flight items are silently dropped during shutdown — orders are lost, work is abandoned. Always await reader.Completion to guarantee clean drain-and-stop.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when WriteAsync is called on a FULL bounded channel (default options)?',
      options: [
        'It throws ChannelFullException',
        'It silently drops the item',
        'It asynchronously waits until a reader frees space — backpressure',
        'It grows the channel capacity automatically',
      ],
      answer: 2,
      explanation: 'The default <code>FullMode.Wait</code> makes <code>WriteAsync</code> return an incomplete ValueTask until space is available — the producer is paced to the consumer without blocking a thread. The <code>Drop*</code> modes change this to eviction strategies for scenarios where latency matters more than completeness.',
    },
    {
      q: 'Three worker tasks all consume the same ChannelReader. What happens to each item?',
      options: [
        'Each item is delivered to all three workers (broadcast)',
        'Each item goes to exactly one worker — channels are competing-consumer queues',
        'Only the first worker receives items; the others starve',
        'The channel throws because multiple readers need MultiReader mode',
      ],
      answer: 1,
      explanation: 'A channel is a queue: every item is consumed once. Multiple readers compete for items, which is exactly the fan-out worker pattern — an automatic work-stealing pool. For broadcast semantics (every subscriber sees every item), create one channel per subscriber or use a different primitive.',
    },
    {
      q: 'What does writer.Complete() do to items already buffered in the channel?',
      options: [
        'They are discarded immediately',
        'They remain readable — consumers drain them, then the read loop ends gracefully',
        'They throw ChannelClosedException when read',
        'They are flushed to the first reader as one batch',
      ],
      answer: 1,
      explanation: '<code>Complete()</code> only forbids new writes. Buffered items stay available; <code>ReadAllAsync</code> yields them all and then ends gracefully. <code>reader.Completion</code> completes once the channel is both completed AND empty.',
    },
    {
      q: 'Why prefer Channel<T> over BlockingCollection<T> in async code?',
      options: [
        'BlockingCollection cannot be bounded',
        'Channel methods await instead of blocking threads — no thread-pool starvation',
        'BlockingCollection is not thread-safe',
        'Channel<T> preserves insertion order while BlockingCollection does not',
      ],
      answer: 1,
      explanation: '<code>BlockingCollection</code>\'s <code>Add</code>/<code>Take</code> block real threads, which in an async server burns thread-pool threads and invites starvation. Channels were designed async-first: full/empty conditions yield via ValueTask instead of blocking a thread.',
    },
    {
      q: 'What is the purpose of reader.Completion?',
      options: [
        'It completes the channel so no more items can be written',
        'It is a Task that completes when the channel is completed AND fully drained',
        'It returns the number of items remaining in the channel',
        'It cancels all pending WriteAsync calls',
      ],
      answer: 1,
      explanation: '<code>reader.Completion</code> is a <code>Task</code> that completes only when: (1) <code>writer.Complete()</code> has been called, AND (2) all buffered items have been consumed. Awaiting it gives you a reliable "pipeline is truly finished" signal — important for graceful shutdown in background services.',
    },
    {
      q: 'Which BoundedChannelFullMode is best for a telemetry/metrics pipeline where freshness matters more than completeness?',
      options: [
        'DropWrite — discard the new sample when the channel is full',
        'Wait — slow down the instrumented code until the consumer catches up',
        'DropOldest — evict the oldest sample and enqueue the new one, keeping freshest data',
        'DropNewest — evict the newest buffered sample to make room',
      ],
      answer: 2,
      explanation: '<code>DropOldest</code> evicts the head of the queue (the oldest data) and enqueues the new item. For telemetry and monitoring, you always want the most recent measurements — stale metrics from minutes ago are less useful than fresh ones. <code>Wait</code> would stall the application being measured, which is unacceptable for instrumentation.',
    },
    {
      q: 'What is the risk of setting SingleWriter = true when two tasks write concurrently?',
      options: [
        'A compile-time error is raised',
        'The second writer is silently queued until the first finishes',
        'The channel switches to a faster lock-free implementation that bypasses multi-access coordination, causing data corruption or crashes',
        'The channel automatically upgrades to multi-writer mode at runtime',
      ],
      answer: 2,
      explanation: '<code>SingleWriter = true</code> is a performance promise to the channel: it selects a faster lock-free code path that skips the synchronization needed for concurrent writers. If two tasks actually write concurrently, you bypass that coordination — leading to lost items, corrupted internal state, or exceptions. Only set <code>SingleWriter = true</code> when you can absolutely guarantee a single concurrent producer.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I pick a bounded vs unbounded channel?',
      a: 'Default to <strong>bounded</strong>. An unbounded channel with a consumer that falls behind is a slow memory leak — the queue absorbs everything until the process dies. A bound forces you to answer "what should happen when we are overwhelmed?" — and gives you the answer for free: wait (backpressure) or drop, your choice via <code>BoundedChannelFullMode</code>. Use unbounded only when production is naturally rate-limited (e.g. you are draining a finite source) or when dropping items is completely unacceptable and you have other mechanisms to prevent the producer from outrunning the consumer.',
    },
    {
      q: 'How do channels compare to TPL Dataflow?',
      a: 'TPL Dataflow (<code>ActionBlock</code>, <code>TransformBlock</code>, etc.) is a full pipeline framework with built-in per-block parallelism, automatic completion propagation between linked blocks, join blocks, and broadcast blocks. Channels are a single primitive — lighter, fewer allocations, and more explicit. You compose pipelines yourself with plain tasks. New code usually starts with channels and reaches for Dataflow only when its block-graph features (auto-linking, per-block parallelism settings, join/broadcast) genuinely save significant code compared to writing it manually.',
    },
    {
      q: 'Can a channel broadcast one item to many subscribers?',
      a: 'No — channels are competing-consumer queues; each item is read exactly once. For broadcast, keep a list of subscriber channels and write each message to all of them (this is how SignalR fan-out works internally), or use System.Reactive, an event bus, or a pub/sub pattern. If you need a mix — some items to all, some to one — a message router in front of per-subscriber channels is the standard approach.',
    },
    {
      q: 'What do the SingleReader/SingleWriter options actually do?',
      a: 'They are performance hints that select faster internal implementations. When <code>SingleWriter = true</code>, the channel uses a lock-free write path that skips multi-producer coordination. When <code>SingleReader = true</code>, it uses a lock-free read path. These are promises, not constraints the runtime enforces — if you declare <code>SingleWriter = true</code> and two tasks actually write concurrently, you bypass the needed synchronization and get data corruption, lost items, or crashes. Only set them true when you can guarantee the access pattern.',
    },
    {
      q: 'How do errors propagate through a channel pipeline?',
      a: 'Each producer stage wraps its logic in try/catch and calls <code>writer.Complete(exception)</code> on failure. The exception then re-throws from the consumer stage\'s <code>await foreach</code> (and from <code>reader.Completion</code>), so the failure travels downstream. Each consumer stage repeats the pattern and calls its own writer\'s <code>Complete(ex)</code>. The result is clean end-to-end error propagation: a failure in any stage causes all downstream stages to fault in order.',
    },
    {
      q: 'Where do channels show up in ASP.NET Core?',
      a: 'The classic pattern is an in-process background work queue: controllers/endpoints write requests into a bounded channel, a <code>BackgroundService</code> drains it. The bound protects the app from request floods (backpressure slows callers or returns 503 if full), and <code>Complete()</code> on the <code>ApplicationStopping</code> token lets in-flight work finish before process exit. Awaiting <code>reader.Completion</code> in <code>ExecuteAsync</code> guarantees all buffered items are processed before the service returns. This is the recommended replacement for <code>BlockingCollection&lt;T&gt;</code> in <code>BackgroundService</code> workers.',
    },
    {
      q: 'What is the difference between TryWrite and WriteAsync?',
      a: '<code>TryWrite(item)</code> is synchronous and non-blocking: it immediately returns <code>false</code> if the channel is full or completed, and <code>true</code> if the item was enqueued. No waiting, no async overhead. Use it for fire-and-forget writes where dropping is acceptable (combined with <code>DropWrite</code> or <code>DropOldest</code> full modes). <code>WriteAsync(item, ct)</code> returns a <code>ValueTask</code> that suspends when the channel is full and resumes when space is available — the backpressure path. Use <code>WriteAsync</code> whenever you need lossless delivery and are OK yielding the current method while waiting for capacity.',
    },
  ];

  challenge: Challenge = {
    title: 'Rate-Limited Print Queue',
    language: 'csharp',
    description: `Build a <code>PrintQueue</code> class backed by a bounded <code>Channel&lt;string&gt;</code> (capacity 5).

Expose:
1. <code>Task EnqueueAsync(string doc)</code> — writes to the channel; naturally waits when 5 documents are pending (backpressure)
2. <code>Task RunPrinterAsync(CancellationToken ct)</code> — consumes documents one per 100ms (simulated printing) using <code>ReadAllAsync</code>
3. <code>Task ShutdownAsync()</code> — completes the writer and waits for the reader to fully drain (<code>reader.Completion</code>)`,
    hints: [
      'Channel.CreateBounded<string>(5) with default FullMode.Wait gives backpressure for free',
      'RunPrinterAsync: await foreach over Reader.ReadAllAsync(ct), then Task.Delay(100, ct)',
      'ShutdownAsync: Writer.Complete() then await Reader.Completion',
      'Store the channel in a readonly field; expose no channel internals to callers',
    ],
    starterCode: `using System.Threading.Channels;

public class PrintQueue
{
    // TODO: bounded channel, capacity 5

    public Task EnqueueAsync(string document)
    {
        // TODO: write (waits when 5 pending)
        throw new NotImplementedException();
    }

    public Task RunPrinterAsync(CancellationToken ct)
    {
        // TODO: consume + 100ms per document
        throw new NotImplementedException();
    }

    public Task ShutdownAsync()
    {
        // TODO: complete + wait for drain
        throw new NotImplementedException();
    }
}`,
    solution: `using System.Threading.Channels;

public class PrintQueue
{
    private readonly Channel<string> _channel =
        Channel.CreateBounded<string>(new BoundedChannelOptions(5)
        {
            SingleReader = true,
            FullMode = BoundedChannelFullMode.Wait,
        });

    public Task EnqueueAsync(string document)
        => _channel.Writer.WriteAsync(document).AsTask();
        // With 5 docs pending, this awaits until the printer frees a slot.

    public async Task RunPrinterAsync(CancellationToken ct)
    {
        await foreach (var doc in _channel.Reader.ReadAllAsync(ct))
        {
            await Task.Delay(100, ct);
            Console.WriteLine($"printed: {doc}");
        }
        // Exits when Complete() has been called and the buffer is drained.
    }

    public async Task ShutdownAsync()
    {
        _channel.Writer.Complete();
        await _channel.Reader.Completion;
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Channel<T> is an async-first producer/consumer queue. Bounded channels apply backpressure via WriteAsync. writer.Complete() signals no more items; reader.Completion completes when the queue is empty. Each item is consumed by exactly one reader — channels are not broadcasts.',
    mustKnow: [
      'Channel<T> splits into ChannelWriter<T> (producer) and ChannelReader<T> (consumer) — hand each side only its view.',
      'Bounded: WriteAsync waits when full (backpressure). Unbounded: writes always succeed — memory is the only limit.',
      'BoundedChannelFullMode: Wait (default — backpressure), DropOldest (keep freshest), DropNewest, DropWrite.',
      'writer.Complete() forbids new writes but leaves buffered items readable. reader.Completion completes only when completed AND drained.',
      'ReadAllAsync ends gracefully after Complete() + drain — no ChannelClosedException on the read side.',
      'Channels are competing-consumer queues: each item goes to exactly ONE reader. Create one channel per subscriber for broadcast.',
      'SingleWriter/SingleReader are performance promises, not runtime constraints — lying causes data corruption.',
    ],
    interviewFocus: [
      'What is backpressure and how does a bounded channel implement it? (WriteAsync suspends when full, pacing producer to consumer)',
      'Difference between writer.Complete() and reader.Completion? (Complete = no more writes; Completion = Task fires when drained)',
      'Why are channels preferred over BlockingCollection in async code? (WriteAsync/ReadAllAsync yield instead of blocking threads)',
      'What happens if you set SingleWriter=true but have two concurrent writers? (Data corruption — lock-free path skips needed synchronization)',
      'How would you broadcast one item to multiple consumers using channels? (One channel per subscriber — channels are competing-consumer, not pub/sub)',
    ],
  };
}
