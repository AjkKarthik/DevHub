import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-implementing-leaky-bucket-with-a-bounded-queue',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-leaky-bucket-with-a-bounded-queue.html',
  styleUrl: './implementing-leaky-bucket-with-a-bounded-queue.scss',
})
export class ImplementingLeakyBucketWithABoundedQueueSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named twice, built nowhere',
      points: [
        'The main page\'s own Quick Reference names Leaky Bucket precisely: "LPUSH requests; background consumer drains at fixed rate." A QnA repeats the definition ("requests enter a queue, processed at fixed rate — smooths bursts, excess dropped") and contrasts it with Token Bucket. No codeTab on the page ever builds one — all three codeTabs implement Fixed Window, Sliding Window Log, and Token Bucket instead.',
        'Leaky Bucket and Token Bucket are often confused because both involve a "bucket," but they solve different problems: Token Bucket controls HOW MANY requests are allowed to pass (rejecting excess outright), while Leaky Bucket controls the RATE at which accepted requests are actually processed downstream, smoothing a burst into a steady drip rather than passing it straight through.',
      ],
    },
    {
      heading: 'The two moving parts: a bounded queue, and a fixed-rate drain',
      points: [
        'The queue has a fixed CAPACITY (the bucket\'s size). A request that arrives when the queue is already full is dropped immediately — this is the "leak" that gives excess traffic nowhere to go, distinct from Token Bucket, which can reject instantly without ever queuing anything at all.',
        'A separate consumer process drains the queue at a constant rate, regardless of how fast requests are arriving — this is what actually smooths a burst: ten requests arriving in the same millisecond still get processed one at a time, at the configured rate, rather than all at once.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Leaky Bucket with a bounded Redis list',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Accept a request into the bucket, or reject it if the bucket is already full.
async function leakyBucketAccept(identifier: string, capacity: number): Promise<boolean> {
  const key = \`rl:leaky:\${identifier}\`;
  const len = await redis.llen(key);
  if (len >= capacity) return false; // bucket full -- drop the request
  await redis.rpush(key, JSON.stringify({ ts: Date.now() }));
  return true;
}

// Background consumer: runs on a fixed interval, drains at most \`ratePerTick\`
// entries per call regardless of how full the queue currently is.
async function leakyBucketDrain(identifier: string, ratePerTick: number): Promise<number> {
  const key = \`rl:leaky:\${identifier}\`;
  let drained = 0;
  for (let i = 0; i < ratePerTick; i++) {
    const item = await redis.lpop(key);
    if (!item) break; // queue empty -- nothing left to process this tick
    drained++;
    // ... process the request here (call the origin API, write to DB, etc.) ...
  }
  return drained;
}

// A burst of 10 requests against a capacity-5 bucket:
async function demo() {
  const results: boolean[] = [];
  for (let i = 0; i < 10; i++) results.push(await leakyBucketAccept('user:42', 5));
  console.log('Accepted:', results.filter(Boolean).length, 'Rejected:', results.filter(r => !r).length);

  // Background drain runs separately, e.g. via setInterval(() => leakyBucketDrain('user:42', 2), 1000)
  const drained = await leakyBucketDrain('user:42', 2);
  console.log('Drained this tick:', drained);
}
// Accepted: 5 Rejected: 5
// Drained this tick: 2`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements Leaky Bucket for outbound email sending (capacity 5, drain rate 2/sec) to smooth a burst of newsletter sends. They notice that when the queue is full, the 6th through 10th requests in a burst are silently dropped — no email is queued and no error is returned to the caller. Is this the correct behavior for Leaky Bucket, or a bug?',
    hint: 'Compare against what Token Bucket does for a rejected request, and check whether the main page\'s own QnA definition of Leaky Bucket says anything about what happens to excess requests.',
    solution: `This is the correct, documented behavior for Leaky Bucket, not a bug -- the main page's own QnA states it plainly: "excess dropped." A full bucket has no room to accept more requests, and Leaky Bucket has no notion of "reject with an error and let the caller retry" the way a rate limiter returning a 429 status does; it silently discards what doesn't fit, which is exactly the "leak" in its name.

If the team actually needs the CALLER to know a request was dropped (so it can retry, alert, or queue elsewhere), Leaky Bucket by itself is the wrong tool -- they would need leakyBucketAccept's own boolean return value surfaced as a real rejection response, or a different algorithm (Token Bucket, which also rejects outright but is more commonly paired with an explicit 429 response) rather than treating the drop as purely internal plumbing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Leaky Bucket and Token Bucket are basically the same algorithm with different names, since both involve a bucket with a capacity."',
      reality: 'They control different things. Token Bucket decides how many requests are ALLOWED THROUGH (accept or reject, immediately). Leaky Bucket decides the RATE at which already-accepted requests get PROCESSED (queue now, drain later at a fixed pace) — a request accepted into a leaky bucket doesn\'t run immediately, it waits its turn.',
    },
    {
      thought: '"A bucket that\'s full just means the rate limiter needs a bigger capacity — increasing capacity always fixes dropped requests."',
      reality: 'Increasing capacity only delays when drops start during a sustained burst — it does nothing for the underlying rate mismatch. If requests arrive faster than the drain rate for long enough, ANY finite capacity eventually fills and starts dropping; the real fix is either a higher drain rate or a smaller sustained input rate, not simply a bigger queue.',
    },
  ];

  topicLabel = 'Rate Limiting';
  topicRoute = '/redis/rate-limiting';
  prev: SubtopicLink | null = {
    label: 'The Off-by-One in Remaining After an Allowed Request',
    route: '/redis/rate-limiting/the-off-by-one-in-remaining-after-an-allowed-request',
  };
  next: SubtopicLink | null = {
    label: 'Fail-Open vs. Fail-Closed When Redis Is Unreachable',
    route: '/redis/rate-limiting/fail-open-vs-fail-closed-when-redis-is-unreachable',
  };
}
