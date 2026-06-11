import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-channels',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
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
    { name: 'reader.Completion',            type: 'method', desc: 'Task that completes when the channel is completed AND drained', since: '.NET Core 3' },
    { name: 'BoundedChannelFullMode',       type: 'type',   desc: 'What a full channel does: Wait (default), DropOldest, DropNewest, DropWrite', since: '.NET Core 3' },
    { name: 'SingleReader / SingleWriter',  type: 'syntax', desc: 'ChannelOptions hints that unlock faster lock-free fast paths', since: '.NET Core 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What a Channel is — an async-first queue',
      points: [
        '<code>Channel&lt;T&gt;</code> is a thread-safe hand-off between producers and consumers, designed for async: writers <code>await WriteAsync</code>, readers <code>await foreach (… in ReadAllAsync())</code>. No threads block — they yield.',
        'It splits into two views: <code>ChannelWriter&lt;T&gt;</code> (the producer API) and <code>ChannelReader&lt;T&gt;</code> (the consumer API). Hand each side only the view it needs.',
        'Compared to its ancestors: <code>BlockingCollection</code> blocks real threads (sync world); TPL Dataflow is a heavier framework of linked blocks. Channels are the lightweight, allocation-conscious modern default.',
        'Typical uses: work queues inside a service, decoupling a fast producer from a slow consumer, fan-out to N workers, and feeding <code>BackgroundService</code> loops in ASP.NET Core.',
      ],
    },
    {
      heading: 'Bounded vs unbounded — backpressure is the point',
      points: [
        '<code>CreateUnbounded</code> never blocks writers — which means a slow consumer lets the queue (and your memory) grow without limit. Use it only when production is naturally bounded.',
        '<code>CreateBounded(capacity)</code> caps the queue. When full, <code>WriteAsync</code> waits until space frees — the producer is automatically slowed to the consumer\'s pace. That feedback loop is <strong>backpressure</strong>, and it is why bounded is the safer default.',
        '<code>BoundedChannelFullMode</code> picks the alternative to waiting: <code>DropOldest</code> (keep freshest — great for telemetry), <code>DropNewest</code>, or <code>DropWrite</code> (discard the incoming item).',
        'Set <code>SingleReader</code>/<code>SingleWriter = true</code> in the options when true — the channel switches to faster lock-free implementations.',
      ],
    },
    {
      heading: 'Completion — shutting a pipeline down cleanly',
      points: [
        'When the producer is done it calls <code>writer.Complete()</code> (or <code>Complete(exception)</code> to fault the pipe). Readers keep draining buffered items; when empty, <code>ReadAllAsync</code> simply ends and <code>await foreach</code> exits.',
        '<code>reader.Completion</code> is a Task that completes only when the channel is completed <em>and</em> fully drained — await it to know the pipeline truly finished.',
        'Writes after Complete() throw <code>ChannelClosedException</code> (<code>TryWrite</code> returns false). Use <code>TryComplete()</code> when multiple producers might race to close.',
        'Pair channels with <code>CancellationToken</code>: both <code>WriteAsync</code> and <code>ReadAllAsync</code> accept one, so a service shutdown can abandon the pipeline without deadlocking.',
      ],
    },
    {
      heading: 'Pipelines and fan-out patterns',
      points: [
        'Producer/consumer: one task writes, one consumes — the channel absorbs bursts and the bound smooths them out.',
        'Fan-out: N worker tasks all <code>await foreach</code> the same reader — each item is delivered to exactly <strong>one</strong> worker (channels are queues, not broadcasts). Instant work-stealing thread pool.',
        'Multi-stage pipelines: stage A\'s consumer is stage B\'s producer — download → parse → save, each stage with its own parallelism and bound.',
        'Consumption idiom is <code>await foreach (var item in reader.ReadAllAsync(ct))</code> — the <code>IAsyncEnumerable</code> machinery behind that syntax is covered on the <strong>async / await</strong> page.',
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

// Feed the queue
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
// OperationCanceledException and the whole pipeline unwinds.`,
    },
  ];

  challenge: Challenge = {
    title: 'Rate-Limited Print Queue',
    language: 'csharp',
    description: 'Build a PrintQueue class backed by a bounded Channel<string> (capacity 5). Expose: Task EnqueueAsync(string doc) that writes to the channel; Task RunPrinterAsync(CancellationToken ct) that consumes documents one per 100ms (simulated printing) using ReadAllAsync; and Task ShutdownAsync() that completes the writer and waits for the reader to drain (Completion). Enqueue must naturally wait when 5 documents are pending (backpressure).',
    hints: [
      'Channel.CreateBounded<string>(5) with default FullMode.Wait gives the backpressure for free',
      'RunPrinterAsync: await foreach over Reader.ReadAllAsync(ct), then Task.Delay(100, ct)',
      'ShutdownAsync: Writer.Complete() then await Reader.Completion',
      'Store the channel in a readonly field; expose no channel internals',
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
            SingleReader = true,                  // one printer task
            FullMode = BoundedChannelFullMode.Wait, // backpressure
        });

    public Task EnqueueAsync(string document)
        => _channel.Writer.WriteAsync(document).AsTask();
        // With 5 docs pending this awaits until the printer frees a slot.

    public async Task RunPrinterAsync(CancellationToken ct)
    {
        await foreach (var doc in _channel.Reader.ReadAllAsync(ct))
        {
            await Task.Delay(100, ct);            // "printing"
            Console.WriteLine($"printed: {doc}");
        }
        // Exits when Complete() has been called and the buffer is drained.
    }

    public async Task ShutdownAsync()
    {
        _channel.Writer.Complete();               // no more enqueues
        await _channel.Reader.Completion;         // completed AND drained
    }
}`,
  };

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
      explanation: 'The default FullMode.Wait makes WriteAsync return an incomplete ValueTask until space is available — the producer is paced to the consumer without blocking a thread. The Drop* modes change this to eviction strategies.',
    },
    {
      q: 'Three worker tasks all consume the same ChannelReader. What does each item do?',
      options: [
        'Each item is delivered to all three workers (broadcast)',
        'Each item goes to exactly one worker — channels are competing-consumer queues',
        'Only the first worker receives items; the others starve',
        'The channel throws because multiple readers need MultiReader mode',
      ],
      answer: 1,
      explanation: 'A channel is a queue: every item is consumed once. Multiple readers compete, which is exactly the fan-out worker pattern. For broadcast semantics you need one channel per subscriber or a different primitive.',
    },
    {
      q: 'What does writer.Complete() do to items already buffered in the channel?',
      options: [
        'They are discarded immediately',
        'They remain readable — consumers drain them, then the read loop ends',
        'They throw ChannelClosedException when read',
        'They are flushed to the first reader as one batch',
      ],
      answer: 1,
      explanation: 'Complete() only forbids new writes. Buffered items stay available; ReadAllAsync yields them all and then ends gracefully. reader.Completion completes once the channel is both completed and empty.',
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
      explanation: 'BlockingCollection\'s Add/Take block real threads, which in an async server burns thread-pool threads and invites starvation. Channels were designed async-first: full/empty conditions yield via ValueTask instead of blocking.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I pick a bounded vs unbounded channel?',
      a: 'Default to <strong>bounded</strong>. An unbounded channel with a consumer that falls behind is a slow memory leak — the queue absorbs everything until the process dies. A bound forces the question "what should happen when we are overwhelmed?" and gives you the answer for free: wait (backpressure) or drop, your choice via FullMode.',
    },
    {
      q: 'How do channels compare to TPL Dataflow?',
      a: 'Dataflow (ActionBlock, TransformBlock…) is a full framework: built-in parallelism per block, linking, completion propagation. Channels are a single primitive — lighter, faster, fewer allocations — and you compose pipelines yourself with plain tasks. New code usually starts with channels and reaches for Dataflow only when its block graph features genuinely pay.',
    },
    {
      q: 'Can a channel broadcast one item to many subscribers?',
      a: 'No — channels are competing-consumer queues; each item is read exactly once. For broadcast, keep a list of subscriber channels and write each message to all of them (that is how SignalR-style fan-out works internally), or use an eventing/Rx primitive instead.',
    },
    {
      q: 'What do the SingleReader/SingleWriter options actually do?',
      a: 'They are promises, not constraints the runtime enforces strictly — when you declare them true, the channel selects specialised lock-free implementations that skip coordination needed for the multi case. Honest hints = measurable throughput gains; lying (two writers on SingleWriter) = undefined behaviour.',
    },
    {
      q: 'How do errors propagate through a channel pipeline?',
      a: 'Producer catches its exception and calls <code>writer.Complete(ex)</code>. The exception then re-throws from the consumer\'s <code>await foreach</code> (and from <code>reader.Completion</code>), so the failure travels downstream with the data. Each stage repeats the pattern and the whole pipeline unwinds cleanly.',
    },
    {
      q: 'Where do channels show up in ASP.NET Core?',
      a: 'The classic pattern is an in-process background work queue: controllers/endpoints write requests into a bounded channel, a <code>BackgroundService</code> drains it. The bound protects the app from request floods, and Complete() on shutdown lets in-flight work finish. (The ASP.NET hub\'s Background Services topic builds exactly this.)',
    },
  ];
}
