import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-producer-consumer-pipelines-with-system-threading-channels-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './producer-consumer-pipelines-with-system-threading-channels.html',
  styleUrl: './producer-consumer-pipelines-with-system-threading-channels.scss',
})
export class ProducerConsumerPipelinesWithSystemThreadingChannelsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The async-first producer/consumer primitive the main topic never introduces',
      points: [
        'The main Async page covers <code>SemaphoreSlim</code> for limiting concurrency and <code>IAsyncEnumerable&lt;T&gt;</code> for producing an async STREAM — but never covers <code>System.Threading.Channels</code>, the modern, purpose-built primitive for a PRODUCER writing items that one or more CONSUMERS read asynchronously, decoupled from each other\'s pace. This is genuinely the natural evolution of the older <code>BlockingCollection&lt;T&gt;</code> pattern (covered in this hub\'s Collections topic) redesigned specifically for <code>async</code>/<code>await</code> from the ground up, rather than adapted from a pre-async synchronous API.',
      ],
    },
    {
      heading: 'Channel<T> — the shape of the API',
      points: [
        '<code>Channel.CreateUnbounded&lt;T&gt;()</code> creates a channel with no capacity limit — a producer can write as fast as it wants, buffering unboundedly. <code>Channel.CreateBounded&lt;T&gt;(capacity)</code> caps how many unconsumed items can queue up, applying natural BACKPRESSURE: once full, <code>WriteAsync</code> itself asynchronously waits (without blocking a thread) until the consumer catches up.',
        'A channel exposes a <code>.Writer</code> (with <code>WriteAsync(item)</code> and <code>Complete()</code>) and a <code>.Reader</code> (with <code>ReadAllAsync()</code>, consumable via <code>await foreach</code> — the exact same consumption syntax as the main topic\'s <code>IAsyncEnumerable&lt;T&gt;</code> examples, since <code>ChannelReader&lt;T&gt;.ReadAllAsync()</code> literally returns an <code>IAsyncEnumerable&lt;T&gt;</code>).',
        'Calling <code>writer.Complete()</code> (optionally with an exception) signals "no more items are coming" — the consumer\'s <code>await foreach</code> loop then finishes naturally once the buffer drains, rather than waiting forever for a next item that will never arrive.',
      ],
    },
    {
      heading: 'Why Channel<T> over SemaphoreSlim + a plain collection, or BlockingCollection',
      points: [
        'The main topic\'s <code>SemaphoreSlim</code> example limits CONCURRENT OPERATIONS (how many downloads run at once) — a genuinely different problem from DECOUPLING a producer\'s pace from a consumer\'s pace, which is what channels solve. You COULD hand-roll a producer/consumer queue with a lock and a <code>SemaphoreSlim</code> for signaling, but <code>Channel&lt;T&gt;</code> already handles this correctly (including bounded-capacity backpressure, completion signaling, and multi-writer/multi-reader safety) without you re-deriving that logic.',
        '<code>BlockingCollection&lt;T&gt;</code> (a synchronous, pre-async .NET 4 API) requires a DEDICATED THREAD blocked in <code>.Take()</code> to consume — exactly the kind of thread-blocking the main topic\'s entire async philosophy argues against for I/O-bound work. <code>Channel&lt;T&gt;</code>\'s <code>ReadAllAsync()</code> consumes via <code>await foreach</code>, releasing the thread back to the pool between items rather than dedicating a whole OS thread to waiting.',
      ],
    },
    {
      heading: 'A concrete pipeline — decoupling ingestion from processing',
      points: [
        'A realistic shape: a fast producer reads incoming webhook events and writes them to a BOUNDED channel; one or more consumer tasks read from the channel and do slower downstream work (database writes, external API calls) — the bounded capacity means the producer naturally slows down (via backpressure on <code>WriteAsync</code>) if consumers fall behind, rather than the producer\'s buffer growing unboundedly and risking memory exhaustion.',
        'Multiple consumer tasks can read from the SAME channel concurrently — <code>ChannelReader&lt;T&gt;</code> is safe for concurrent reads, so starting several <code>await foreach</code> loops over the same reader naturally load-balances items across them, giving you a simple worker-pool pattern with no additional synchronization code required.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A basic bounded channel — producer and consumer',
      language: 'csharp',
      code: `using System.Threading.Channels;

// Bounded to 10 — WriteAsync will asynchronously wait (not block a thread)
// once 10 unconsumed items are buffered, applying natural backpressure.
Channel<string> channel = Channel.CreateBounded<string>(10);

async Task ProduceAsync(ChannelWriter<string> writer, CancellationToken ct)
{
    for (int i = 0; i < 100; i++)
    {
        await writer.WriteAsync($"item-{i}", ct);
        await Task.Delay(5, ct); // simulate work producing each item
    }
    writer.Complete(); // signals "no more items" — the reader's loop will end
}

async Task ConsumeAsync(ChannelReader<string> reader, CancellationToken ct)
{
    // await foreach consumes exactly like the main topic's IAsyncEnumerable<T>
    // examples — ReadAllAsync() literally returns an IAsyncEnumerable<string>.
    await foreach (var item in reader.ReadAllAsync(ct))
    {
        Console.WriteLine($"Processing: {item}");
        await Task.Delay(20, ct); // simulate slower downstream work
    }
}

using var cts = new CancellationTokenSource();
var producer = ProduceAsync(channel.Writer, cts.Token);
var consumer = ConsumeAsync(channel.Reader, cts.Token);

await Task.WhenAll(producer, consumer);
// The consumer naturally paces the producer — once the buffer fills to
// capacity 10, WriteAsync asynchronously waits for the consumer to drain some.`,
    },
    {
      label: 'Multiple consumers — a simple worker pool',
      language: 'csharp',
      code: `using System.Threading.Channels;

Channel<int> workItems = Channel.CreateUnbounded<int>();

async Task ProduceWorkAsync()
{
    for (int i = 0; i < 50; i++)
        await workItems.Writer.WriteAsync(i);
    workItems.Writer.Complete();
}

async Task WorkerAsync(int workerId, ChannelReader<int> reader)
{
    // Multiple workers reading the SAME channel concurrently is safe —
    // ChannelReader<T> naturally load-balances items across readers,
    // no extra synchronization code needed.
    await foreach (var item in reader.ReadAllAsync())
    {
        Console.WriteLine($"Worker {workerId} processing item {item}");
        await Task.Delay(50); // simulate variable-duration work
    }
}

var producer = ProduceWorkAsync();

// Start 3 concurrent workers pulling from the same channel — a simple
// worker-pool pattern with no manual queue/lock/semaphore bookkeeping.
var workers = Enumerable.Range(0, 3)
    .Select(id => WorkerAsync(id, workItems.Reader));

await Task.WhenAll(new[] { producer }.Concat(workers));
// Items are distributed across the 3 workers roughly evenly, each
// consuming as fast as its own downstream work allows.`,
    },
    {
      label: 'Signaling failure through the channel',
      language: 'csharp',
      code: `using System.Threading.Channels;

Channel<string> channel = Channel.CreateBounded<string>(10);

async Task ProduceAsync(ChannelWriter<string> writer)
{
    try
    {
        for (int i = 0; i < 20; i++)
        {
            if (i == 10)
                throw new InvalidOperationException("Simulated producer failure");

            await writer.WriteAsync($"item-{i}");
        }
        writer.Complete(); // normal completion — no more items
    }
    catch (Exception ex)
    {
        // Completing with an exception propagates it to consumers —
        // their await foreach loop re-throws it instead of just stopping
        // silently, so the failure is never swallowed.
        writer.Complete(ex);
    }
}

async Task ConsumeAsync(ChannelReader<string> reader)
{
    try
    {
        await foreach (var item in reader.ReadAllAsync())
            Console.WriteLine($"Processing: {item}");
    }
    catch (InvalidOperationException ex)
    {
        Console.WriteLine($"Consumer observed producer failure: {ex.Message}");
    }
}

var producer = ProduceAsync(channel.Writer);
var consumer = ConsumeAsync(channel.Reader);
await Task.WhenAll(producer, consumer);
// Processes items 0-9, then the consumer's foreach throws and is caught,
// reporting the producer's failure instead of silently stopping at item 9.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Modify the multiple-consumers example to track (via a thread-safe counter) how many items EACH worker processed, and print a summary after all work completes — proving the load actually gets distributed across workers rather than one worker doing everything.',
    hint: 'Use a ConcurrentDictionary<int, int> (workerId -> count) or an array of Interlocked-incremented counters, one per worker. Increment the counter for the current workerId inside each worker\'s foreach loop, then print all counts after Task.WhenAll completes.',
    solution: `using System.Collections.Concurrent;
using System.Threading.Channels;

Channel<int> workItems = Channel.CreateUnbounded<int>();
var counts = new ConcurrentDictionary<int, int>();

async Task ProduceWorkAsync()
{
    for (int i = 0; i < 50; i++)
        await workItems.Writer.WriteAsync(i);
    workItems.Writer.Complete();
}

async Task WorkerAsync(int workerId, ChannelReader<int> reader)
{
    await foreach (var item in reader.ReadAllAsync())
    {
        counts.AddOrUpdate(workerId, 1, (_, existing) => existing + 1);
        await Task.Delay(50);
    }
}

var producer = ProduceWorkAsync();
var workers = Enumerable.Range(0, 3).Select(id => WorkerAsync(id, workItems.Reader));
await Task.WhenAll(new[] { producer }.Concat(workers));

foreach (var (workerId, count) in counts.OrderBy(kv => kv.Key))
    Console.WriteLine($"Worker {workerId} processed {count} items");
// Confirms the 50 items were distributed across all 3 workers, not
// monopolized by a single one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'System.Threading.Channels solves the same problem as SemaphoreSlim from the main topic — limiting how many operations run concurrently.',
      reality: 'these are genuinely different problems — SemaphoreSlim caps concurrent OPERATIONS (e.g. simultaneous downloads); Channel&lt;T&gt; decouples a PRODUCER\'s pace from a CONSUMER\'s pace, with the reader consuming items as they become available regardless of how many are "in flight" at once.',
    },
    {
      thought: 'BlockingCollection&lt;T&gt; and Channel&lt;T&gt; are interchangeable — just two different APIs for the same producer/consumer pattern.',
      reality: 'BlockingCollection&lt;T&gt; requires a DEDICATED THREAD blocked in .Take() to consume — exactly the thread-blocking the main topic\'s async philosophy argues against. Channel&lt;T&gt;\'s ReadAllAsync() consumes via await foreach, releasing the thread back to the pool between items instead of dedicating a whole OS thread to waiting.',
    },
    {
      thought: 'if a channel\'s producer throws an exception, calling writer.Complete() without arguments is sufficient — consumers will just stop cleanly.',
      reality: 'calling Complete() with no arguments signals NORMAL completion, silently ending the consumer\'s loop with no indication anything went wrong — Complete(exception) is what propagates the failure to consumers, causing their await foreach to re-throw it instead of swallowing the error.',
    },
  ];
}
