import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: '"Rate-Limiting Per Subscriber" — Named, Never Shown',
    points: [
      'The main page’s own QnA on fan-out describes the pattern precisely: "Worker pool processes delivery jobs concurrently with rate-limiting per subscriber." No codeTab on the page shows what rate-limiting a SPECIFIC subscriber, independently of every other subscriber, actually looks like.',
      'The main page’s own <code>dispatchWebhook</code> function already loops over every subscription and enqueues one job each — this subtopic extends that exact pattern with a check BEFORE enqueueing: does THIS subscriber have capacity remaining in its own current time window?',
      'Per-subscriber (not global) rate limiting matters because a single slow or over-quota consumer should never throttle delivery to every OTHER subscriber — each subscriber’s limiter tracks its OWN request history independently, exactly the isolation this subtopic’s codeTab demonstrates.',
      'A subscriber that’s temporarily over its limit isn’t a delivery FAILURE in the sense the main page’s own retry/backoff logic handles — it’s a deferral. A real implementation would typically re-enqueue the job for a later attempt (or let the job queue’s own delay mechanism handle it) rather than treating it identically to a failed HTTP delivery.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Per-Subscriber Rate-Limited Fan-Out',
    language: 'typescript',
    code: `interface Subscriber {
  id: string;
  url: string;
}

// A minimal sliding-window rate limiter -- tracks only ITS OWN request
// timestamps, with no knowledge of any other subscriber's limiter.
class RateLimiter {
  private timestamps: number[] = [];

  constructor(private maxPerWindow: number, private windowMs: number) {}

  tryAcquire(now: number): boolean {
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxPerWindow) return false;
    this.timestamps.push(now);
    return true;
  }
}

interface FanOutResult {
  subscriberId: string;
  status: 'enqueued' | 'rate-limited-deferred';
  url?: string;
}

function fanOutWebhook(
  event: { type: string },
  subscribers: Subscriber[],
  limiters: Map<string, RateLimiter>,
  now: number
): FanOutResult[] {
  const results: FanOutResult[] = [];
  for (const sub of subscribers) {
    const limiter = limiters.get(sub.id)!;
    if (!limiter.tryAcquire(now)) {
      // Deferred, not failed -- a real implementation would re-enqueue
      // for a later attempt rather than treating this like a delivery
      // failure that counts against the retry/backoff budget.
      results.push({ subscriberId: sub.id, status: 'rate-limited-deferred' });
      continue;
    }
    results.push({ subscriberId: sub.id, status: 'enqueued', url: sub.url });
  }
  return results;
}

const subscribers: Subscriber[] = [
  { id: 'sub1', url: 'https://a.example.com/webhooks' },
  { id: 'sub2', url: 'https://b.example.com/webhooks' },
];

const limiters = new Map<string, RateLimiter>([
  ['sub1', new RateLimiter(1, 60_000)],   // sub1: max 1 delivery per minute
  ['sub2', new RateLimiter(100, 60_000)], // sub2: generous limit
]);

const now = 1_700_000_000_000;

console.log('First dispatch:', fanOutWebhook({ type: 'order.created' }, subscribers, limiters, now));
// both subscribers enqueued

console.log('Second dispatch, 5s later:', fanOutWebhook({ type: 'order.created' }, subscribers, limiters, now + 5_000));
// sub1: rate-limited-deferred (still within its 1-minute window)
// sub2: enqueued (unaffected by sub1's limit at all)

console.log('Third dispatch, 61s later:', fanOutWebhook({ type: 'order.created' }, subscribers, limiters, now + 61_000));
// sub1's window has reset -- enqueued again`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>RateLimiter</code> class above is instantiated once per subscriber and stored in a <code>Map</code> keyed by subscriber ID, rather than one shared <code>RateLimiter</code> instance used for every subscriber. What real problem would sharing ONE limiter instance across all subscribers cause?',
  hint: 'If <code>sub1</code> and <code>sub2</code> shared the exact same <code>RateLimiter</code> object, would <code>sub2</code>’s own deliveries count against <code>sub1</code>’s limit, or vice versa? Is that the behavior the main page’s own QnA describes as "rate-limiting per subscriber"?',
  solution: `// Sharing one RateLimiter instance across every subscriber would mean
// every subscriber's deliveries count against the SAME shared budget --
// a burst of deliveries to sub2 could exhaust the limit and cause sub1
// to get "rate-limited-deferred" even though sub1 itself never made a
// single request recently.

// This directly contradicts what "rate-limiting PER SUBSCRIBER" (the
// main page's own QnA phrasing) actually means -- the whole point is
// that EACH subscriber has its OWN independent budget, so one
// subscriber's traffic pattern can never affect another's delivery
// timing. A single shared limiter would effectively become a GLOBAL
// rate limit instead, which is a completely different (and much
// coarser) guarantee than what was actually asked for.

// This is exactly why the codeTab keys limiters by subscriber ID in a
// Map -- each subscriber gets its own RateLimiter object, with its own
// private timestamps array that no other subscriber's deliveries ever
// touch.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A subscriber being "rate-limited-deferred" is functionally the same outcome as a delivery attempt failing (e.g., the consumer’s endpoint returning a 500).',
    reality: 'The theory above explicitly distinguishes these — a rate-limited delivery never even reached the network; it was intentionally held back by the SENDER’s own dispatch logic before an HTTP request was ever attempted. Treating it identically to a real delivery failure would incorrectly consume the retry/backoff budget the main page’s own theory dedicates to handling GENUINE consumer-side failures, for a situation that isn’t actually a failure at all.',
  },
  {
    thought: 'Rate-limiting webhook deliveries mainly protects the SENDER’s own infrastructure from being overwhelmed by its own fan-out traffic.',
    reality: 'The codeTab’s own per-subscriber design (limiting each CONSUMER’s incoming request rate independently) is aimed at protecting the RECEIVING consumer’s endpoint from being overwhelmed by a burst of deliveries — not the sender’s own infrastructure. A consumer with a modest server capacity genuinely needs its inbound webhook rate bounded, independent of how many other subscribers exist or how much OTHER traffic the sender is generating.',
  },
  {
    thought: 'Since <code>fanOutWebhook</code> processes subscribers in a simple loop, a rate-limited subscriber earlier in the list would block or delay delivery to subscribers later in the same list.',
    reality: 'The codeTab’s own second example demonstrates the opposite directly — <code>sub1</code> being rate-limited-deferred has zero effect on <code>sub2</code>’s own <code>enqueued</code> result in the SAME dispatch call. The loop simply records a different outcome per subscriber; it never skips, pauses, or waits on any subscriber’s result before moving to the next.',
  },
];

@Component({
  selector: 'app-api-webhook-fanout-rate-limit',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fan-out-with-per-subscriber-rate-limiting.html',
  styleUrl: './fan-out-with-per-subscriber-rate-limiting.scss',
})
export class FanOutWithPerSubscriberRateLimitingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
