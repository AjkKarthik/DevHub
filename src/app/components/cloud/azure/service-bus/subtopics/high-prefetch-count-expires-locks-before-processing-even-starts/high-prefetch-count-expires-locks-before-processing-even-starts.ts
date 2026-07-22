import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './high-prefetch-count-expires-locks-before-processing-even-starts.html',
  styleUrl: './high-prefetch-count-expires-locks-before-processing-even-starts.scss'
})
export class HighPrefetchCountExpiresLocksBeforeProcessingEvenStartsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own batch-receive example never mentions prefetch at all, despite covering lock duration and lock renewal in depth',
      points: [
        'The main page\'s own theory covers message locks extensively: default 60-second lock duration, lock renewal for long processing, and the duplicate-processing risk when a lock expires before completion. Its "Batch processing" bullet describes ReceiveMessagesAsync(maxMessages: 10) purely as a throughput optimization, with no mention of a related, separate setting that interacts with the exact same lock-expiry risk.',
        'Prefetching is a genuinely different mechanism from batch receiving — it\'s a client-side cache that fetches and locks messages BEFORE the application asks for them, not just a way to retrieve several already-requested messages in one round trip — and it can reintroduce the same lock-expiry problem the main page\'s own lock-renewal advice is meant to solve, just from a different cause.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own performance guidance: a high prefetch count can lock messages that sit unprocessed until their lock expires',
      points: [
        'Per Microsoft\'s own documentation: "When a message is prefetched, the service locks the prefetched message... If the receiver can\'t complete the message before the lock expires, the message becomes available to other receivers. The prefetched copy of the message remains in the cache. The receiver that consumes the expired cached copy receives an exception when it tries to complete that message." A message sitting in the local prefetch cache, not yet handed to application code, is ALREADY locked and ALREADY consuming its lock-duration countdown — waiting in cache costs lock time exactly the same as active processing does.',
        'Microsoft\'s own sizing guidance makes the tradeoff explicit: "a good value for PrefetchCount is 20 times the maximum processing rates of all receivers... There are some challenges with having a greedy approach, that is, keeping the prefetch count high, because it implies that the message is locked to a particular receiver." Set the count too high relative to how fast messages actually get processed, and later messages in the cache can have their locks expire before the receiver even reaches them — not because processing itself was slow, but because the queue of cached-but-unprocessed messages was too deep.',
        'The main page\'s own default lock duration (60 seconds, extendable to 5 minutes) is exactly what this budget is measured against — Microsoft\'s own formula (PrefetchCount ≤ n/3 × messages-processed-per-second, where n is the lock duration) ties directly back to the same 60-second figure the main page already documents for a completely different reason (lock renewal), without the two ever being connected on the page.',
      ]
    },
    {
      heading: 'Why the fix isn\'t simply "prefetch more to go faster"',
      points: [
        'Microsoft\'s own scenario-specific guidance shows prefetch is not a blanket "bigger is better" setting: for a queue with a large number of receivers, the recommendation is a SMALL prefetch count ("PrefetchCount = 10") specifically "to prevent receivers from being idle while other receivers have large numbers of messages cached" — a high prefetch count on one receiver can starve other receivers of messages entirely, a fairness problem distinct from the lock-expiry problem.',
        'For a low-latency, single-client scenario the guidance flips again — a larger prefetch count reduces round-trips and improves the perceived responsiveness of the FIRST message received, precisely because there\'s no competing receiver to starve. The right prefetch value depends on the receiver topology (one client vs. many, high throughput vs. low latency), not a single number that\'s always correct.',
        'The practical fix when lock expirations are traced back to prefetch (not genuinely slow processing) is lowering the prefetch count so the cache never holds more messages than the receiver can realistically get through within a single lock window — exactly the sizing formula Microsoft\'s own docs provide, applied against the SAME lock duration value the main page already discusses for lock renewal.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A prefetch count that silently causes duplicate processing',
      language: 'typescript',
      code: `// Default lock duration: 60 seconds (per the main page's own theory).
// A receiver that processes ~2 messages/second, with prefetch set
// far too high for that rate:
const receiver = sbClient.createReceiver('my-queue', {
  receiveMode: 'peekLock',
});
// Setting a naive "bigger is faster" prefetch value:
// prefetchCount: 500  <-- WRONG for this processing rate

// Per Microsoft's own sizing guidance: "a good value for
// PrefetchCount is 20 times the maximum processing rates of all
// receivers" -- at 2 msg/sec, that's roughly 20 x 2 = 40, not 500.
// With prefetchCount 500 and a 60-second lock, only the first
// ~120 messages (2/sec x 60s) can be processed before the REST of
// the cached 500 have their locks expire while still waiting --
// those expired-lock messages get redelivered to another receiver,
// AND the original receiver's later completeMessage() calls on them
// throw exceptions.

const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
// (receiveMessages itself is a separate, request-response operation
// from prefetch -- prefetch is a background CACHING behavior
// configured once on the receiver, not per-call)`,
    },
    {
      label: 'Sizing prefetch against the same lock duration the main page already covers',
      language: 'typescript',
      code: `// Correctly-sized prefetch, tied to the actual processing rate and
// the SAME 60-second default lock duration the main page's own
// theory documents for lock renewal:

const processingRatePerSecond = 2;   // measured, not assumed
const lockDurationSeconds = 60;      // main page's own documented default

// Microsoft's own formula: PrefetchCount up to (lockDuration / 3) x
// processing-rate-per-second when combined with batch receives:
const safePrefetchCount = Math.floor((lockDurationSeconds / 3) * processingRatePerSecond);
// = 40

const receiver = sbClient.createReceiver('my-queue', {
  receiveMode: 'peekLock',
  prefetchCount: safePrefetchCount,
});

// For a queue with MANY competing receivers instead of one, per
// Microsoft's own guidance, go smaller still (e.g. 10) to avoid
// starving other receivers of messages -- prefetch tuning depends
// on receiver topology, not a single fixed formula.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their Service Bus consumer is occasionally throwing "lock lost" exceptions and messages are showing higher-than-expected delivery counts, even though individual message processing itself completes in well under a second. They rule out slow processing as the cause. They had recently increased prefetchCount from 20 to 2000 to "improve throughput." Could that change be the actual cause, and why would fast per-message processing not protect against it?',
    hint: 'Check what a prefetched-but-not-yet-processed message\'s lock status is, and whether time spent waiting in the local cache counts against that lock the same way active processing time does.',
    solution: 'Yes, the prefetchCount increase is a very plausible cause, and fast individual processing doesn\'t protect against it. Per Microsoft\'s own documentation, "when a message is prefetched, the service locks the prefetched message" immediately — the lock timer starts the moment the message enters the local cache, not when the application actually begins processing it. With prefetchCount at 2000, messages near the back of that cache can sit waiting for a long time before the receiver works through everything ahead of them, even if each individual message processes quickly — the CUMULATIVE wait time for messages deep in an oversized cache can exceed the lock duration on its own. The fix is sizing prefetchCount against the actual processing rate and lock duration using Microsoft\'s own guidance (roughly 20x the processing rate per second, or lockDuration/3 x rate when combined with batch receives), not simply setting it as high as possible.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A message sitting in a Service Bus receiver\'s local prefetch cache, not yet handed to application code, isn\'t locked yet — the lock only starts once processing actually begins.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly: "When a message is prefetched, the service locks the prefetched message" — the lock begins the moment the message is cached, regardless of how long it then waits before the application starts working on it.'
    },
    {
      thought: 'Setting prefetchCount as high as possible is always the right way to maximize Service Bus receive throughput.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own guidance describes real downsides to a high prefetch count — messages can have their locks expire before processing even starts, and for topologies with many competing receivers, a high prefetch count on one receiver can starve the others of messages entirely.'
    },
    {
      thought: 'Lock expirations and elevated delivery counts always indicate that individual message processing itself is too slow.',
      reality: 'Per this subtopic\'s theory, an oversized prefetch count can cause the exact same symptom even when individual processing is fast — the cumulative wait time for messages queued behind others in an oversized local cache can exceed the lock duration on its own, independent of per-message processing speed.'
    }
  ];
}
