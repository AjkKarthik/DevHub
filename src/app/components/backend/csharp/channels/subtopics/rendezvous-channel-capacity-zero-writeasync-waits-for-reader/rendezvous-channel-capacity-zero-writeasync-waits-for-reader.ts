import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-rendezvous-channel-capacity-zero-writeasync-waits-for-reader-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './rendezvous-channel-capacity-zero-writeasync-waits-for-reader.html',
  styleUrl: './rendezvous-channel-capacity-zero-writeasync-waits-for-reader.scss',
})
export class RendezvousChannelCapacityZeroWriteasyncWaitsForReaderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s bounded-channel sizing advice assumes a positive capacity — capacity 0 is a valid, genuinely different configuration',
      points: [
        'The main Channels page\'s own sizing heuristic ("2-4x the expected burst size") assumes you are choosing SOME positive buffer capacity. <code>Channel.CreateBounded&lt;T&gt;(0)</code> is ALSO valid — it creates what is traditionally called a <strong>rendezvous channel</strong>, with zero internal buffer space at all.',
      ],
    },
    {
      heading: 'With capacity 0, WriteAsync does not complete until an active reader is THERE to receive the item directly',
      points: [
        'For any positive capacity, the main page\'s own backpressure model applies: <code>WriteAsync</code> waits only when the BUFFER is full — it can succeed immediately as long as there is empty buffer space, even if no reader happens to be actively waiting at that exact moment. With capacity 0, there is NO buffer space at all — <code>WriteAsync</code> can ONLY complete at the exact moment a reader is actively calling <code>ReadAsync</code>/<code>TryRead</code> (via <code>WaitToReadAsync</code>) and receives the item directly, hand-to-hand, with no intermediate storage.',
        'This is a genuinely different SYNCHRONIZATION GUARANTEE than ordinary backpressure — a positive-capacity channel merely paces the producer to roughly the consumer\'s speed, while a capacity-0 channel guarantees the producer and consumer are synchronized at the EXACT moment of hand-off, similar to Go\'s unbuffered channels or CSP-style rendezvous synchronization.',
      ],
    },
    {
      heading: 'This makes capacity 0 the right tool specifically when you need a synchronization guarantee, not just a queue',
      points: [
        'A genuine use case: a producer that must know its item has ACTUALLY been picked up by a consumer before proceeding (e.g. a "handoff" pattern where the producer needs to be certain the item is being actively processed RIGHT NOW, not merely sitting in a buffer that might never be drained if the consumer crashes). A capacity-0 channel gives you this guarantee directly, where any positive-capacity channel cannot — <code>WriteAsync</code> completing on a buffered channel only proves the item was STORED, never that a consumer has actually started working on it.',
        'The trade-off is throughput: a rendezvous channel cannot absorb ANY burst at all — if the consumer is even momentarily busy (mid-<code>await Task.Delay</code>, say), every <code>WriteAsync</code> call genuinely blocks until the consumer becomes available again, unlike a small positive-capacity buffer that can absorb a brief burst without stalling the producer.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Capacity 0 vs capacity 1 — the SAME producer, genuinely different completion timing',
      language: 'csharp',
      code: `// Capacity 1 — ordinary backpressure. WriteAsync can complete
// IMMEDIATELY even with no reader currently waiting, as long as the
// single buffer slot is empty:
var buffered = Channel.CreateBounded<string>(1);
await buffered.Writer.WriteAsync("item-A"); // completes RIGHT AWAY —
                                             // stored in the buffer,
                                             // no reader needs to be
                                             // present at this moment

// Capacity 0 — rendezvous. WriteAsync genuinely WAITS until a reader
// is actively there to receive the item directly:
var rendezvous = Channel.CreateBounded<string>(0);

var writeTask = rendezvous.Writer.WriteAsync("item-B").AsTask();
await Task.Delay(100);
Console.WriteLine(writeTask.IsCompleted); // False — no reader yet,
                                            // and there is NO buffer
                                            // slot to store it in
                                            // even temporarily

// Only once a reader ACTUALLY reads does the write complete:
var readTask = rendezvous.Reader.ReadAsync().AsTask();
await Task.WhenAll(writeTask, readTask);
Console.WriteLine(writeTask.IsCompleted); // True — NOW it's done,
                                            // exactly when the
                                            // hand-off actually happened`,
    },
    {
      label: 'The genuine use case — a producer that needs to KNOW a consumer picked up the item',
      language: 'csharp',
      code: `// A "handoff" pattern: the producer must be certain a worker has
// ACTUALLY started processing before considering its own step done —
// e.g. dispatching a critical task where "it's in the buffer" is not
// good enough, only "someone is actively taking it right now" counts:
var handoff = Channel.CreateBounded<WorkItem>(0);

var worker = Task.Run(async () =>
{
    await foreach (var item in handoff.Reader.ReadAllAsync())
    {
        Console.WriteLine($"Worker actively processing: {item.Id}");
        await ProcessAsync(item);
    }
});

async Task DispatchAsync(WorkItem item)
{
    // With capacity 0, THIS completing genuinely means a worker is
    // AT THIS MOMENT receiving the item — not just "it's queued
    // somewhere and might get picked up eventually":
    await handoff.Writer.WriteAsync(item);
    Console.WriteLine($"Confirmed: worker has taken {item.Id}");
}

// Contrast: with ANY positive capacity, "await WriteAsync completed"
// only proves the item was STORED — it says nothing about whether a
// worker has actually started on it yet, or ever will if the worker
// process crashes before draining the buffer.

record WorkItem(int Id);
static Task ProcessAsync(WorkItem item) => Task.Delay(50);`,
    },
    {
      label: 'The trade-off — zero burst tolerance',
      language: 'csharp',
      code: `// A rendezvous channel cannot absorb EVEN a brief burst — every
// single write blocks until the consumer is specifically ready:
var rendezvous = Channel.CreateBounded<int>(0);

var consumer = Task.Run(async () =>
{
    await foreach (var n in rendezvous.Reader.ReadAllAsync())
    {
        await Task.Delay(50); // consumer briefly busy processing
    }
});

var sw = System.Diagnostics.Stopwatch.StartNew();
for (int i = 0; i < 5; i++)
    await rendezvous.Writer.WriteAsync(i);
    // EACH of these 5 writes genuinely waits for the consumer's
    // 50ms processing window to become free again — total time is
    // roughly 5 x 50ms = 250ms, with ZERO ability to get ahead of
    // the consumer even momentarily.
sw.Stop();
Console.WriteLine(sw.ElapsedMilliseconds); // ~250ms

// Contrast: Channel.CreateBounded<int>(5) with the SAME consumer
// would let all 5 writes complete almost immediately (buffered),
// with the consumer draining them at its own pace afterward — a
// completely different throughput profile for the exact same
// producer/consumer logic, purely from the capacity choice.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why a capacity-0 channel is the WRONG choice for the main topic page\'s own telemetry/metrics use case (<code>BoundedChannelFullMode.DropOldest</code>, capacity 1000), and what property of rendezvous channels makes them fundamentally incompatible with that scenario.',
    hint: 'Consider what "drop the oldest buffered item" even MEANS when there is no buffer at all — a rendezvous channel has zero items ever sitting in a buffer to drop.',
    solution: `// The main page's telemetry example specifically wants:
//   - The PRODUCER (instrumented code) to NEVER be slowed down by a
//     stalled consumer — metrics.Writer.TryWrite() must succeed
//     immediately regardless of consumer state
//   - If the consumer falls behind, OLD buffered samples should be
//     evicted to make room for fresh ones (DropOldest)
//
// A capacity-0 rendezvous channel is fundamentally incompatible with
// BOTH requirements:
//
// 1. There is NO buffer at all — TryWrite on a capacity-0 channel can
//    only succeed at the exact instant a reader is actively waiting
//    to receive it; if the consumer is busy or absent, TryWrite fails
//    immediately (or WriteAsync blocks), which is the OPPOSITE of
//    "never slows down the instrumented code."
//
// 2. "DropOldest" requires SOMETHING to be buffered in order to have
//    an "oldest" item to evict in the first place — with zero buffer
//    capacity, there is nothing sitting in the channel to drop; every
//    write either hands off immediately to a waiting reader or fails/
//    blocks outright, so the DropOldest full-mode concept doesn't
//    apply to a rendezvous channel in any meaningful way.
//
// The main page's own choice — a positive-capacity bounded channel
// (1000) with DropOldest — is exactly right for the telemetry
// scenario; capacity 0 is the right tool ONLY for the OPPOSITE goal:
// guaranteeing a genuine synchronization hand-off between producer
// and consumer, not for absorbing bursts or tolerating a slow
// consumer at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Channel.CreateBounded<T>(0) is either invalid or functionally identical to a very small positive-capacity channel like capacity 1.',
      reality: 'capacity 0 creates a genuinely different "rendezvous" channel — WriteAsync can only complete at the exact moment a reader is actively receiving the item, with zero buffer storage, unlike even capacity 1 which lets a write succeed immediately into the single buffer slot with no reader present.',
    },
    {
      thought: 'a WriteAsync call completing on any bounded channel proves a consumer has started processing that item.',
      reality: 'on a POSITIVE-capacity channel, WriteAsync completing only proves the item was stored in the buffer — it says nothing about whether a consumer has picked it up yet. Only a capacity-0 rendezvous channel gives that stronger "a consumer is actively receiving this right now" guarantee.',
    },
    {
      thought: 'a rendezvous (capacity 0) channel is strictly more restrictive and therefore never useful compared to a small positive-capacity buffer.',
      reality: 'it is the correct tool specifically when you need a genuine synchronization guarantee (producer confirms a consumer is actively taking the item) rather than merely pacing — a use case a buffered channel cannot satisfy no matter how small its capacity.',
    },
  ];
}
