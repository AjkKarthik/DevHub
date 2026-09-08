import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-sliding-window-has-the-same-member-collision-bug',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sliding-window-has-the-same-member-collision-bug.html',
  styleUrl: './sliding-window-has-the-same-member-collision-bug.scss',
})
export class SlidingWindowHasTheSameMemberCollisionBugSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The bug in the main page\'s own codeTab',
      points: [
        'The main page\'s own mistake block explicitly warns: "Sliding window: using member as timestamp string but not making it unique... If you reuse the same member string, ZADD updates the score instead of adding a new entry — you\'d only ever count 1 request."',
        'The SAME page\'s own "Node.js Patterns" codeTab committed exactly this mistake in its <code>isAllowedSliding</code> function: <code>await redis.zadd(key, now, ${now})</code> — using the bare millisecond timestamp as BOTH the score and the member, with no added uniqueness.',
        'Verified directly by reproducing the exact logic: three concurrent requests landing in the same millisecond (a completely realistic burst under real concurrency, since <code>Date.now()</code> only has millisecond resolution) collapse into just ONE counted entry — the rate limiter silently undercounts by 2, in the exact way its own mistake block warned against.',
      ],
    },
    {
      heading: 'Why this is easy to miss in testing',
      points: [
        'A test suite that calls the rate limiter sequentially, one request at a time with real delays between calls, never exercises this bug — each <code>Date.now()</code> call naturally lands in a different millisecond, so the member strings never collide.',
        'The bug only surfaces under genuine concurrency — multiple requests arriving close enough together to share a millisecond timestamp — which is exactly the traffic PATTERN a rate limiter exists to handle correctly, making this a particularly consequential blind spot.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the undercount',
      language: 'typescript',
      code: `// The main page's own buggy isAllowedSliding logic, reproduced exactly.
class FakeRedisZSet {
  private zsets = new Map<string, Map<string, number>>();

  zadd(key: string, score: number, member: string): void {
    if (!this.zsets.has(key)) this.zsets.set(key, new Map());
    this.zsets.get(key)!.set(member, score); // an existing member's score is just UPDATED
  }
  zremrangebyscore(key: string, min: number, max: number): void {
    const z = this.zsets.get(key);
    if (!z) return;
    for (const [m, s] of z) if (s >= min && s <= max) z.delete(m);
  }
  zcard(key: string): number {
    return this.zsets.get(key)?.size ?? 0;
  }
}

function isAllowedSlidingBuggy(redis: FakeRedisZSet, userId: string, windowMs: number, now: number): void {
  const key = \`ratelimit:sliding:\${userId}\`;
  redis.zremrangebyscore(key, 0, now - windowMs);
  redis.zadd(key, now, String(now)); // <-- the exact main-page bug: bare timestamp as member
}

const redis = new FakeRedisZSet();
const now = Date.now();

// 3 CONCURRENT requests landing in the exact same millisecond.
await Promise.all([1, 2, 3].map(() => isAllowedSlidingBuggy(redis, 'u1', 60000, now)));

console.log('requests actually counted after 3 concurrent requests in the same ms:', redis.zcard('ratelimit:sliding:u1'));
// requests actually counted after 3 concurrent requests in the same ms: 1`,
    },
    {
      label: 'The fix, verified',
      language: 'typescript',
      code: `class FakeRedisZSet {
  private zsets = new Map<string, Map<string, number>>();

  zadd(key: string, score: number, member: string): void {
    if (!this.zsets.has(key)) this.zsets.set(key, new Map());
    this.zsets.get(key)!.set(member, score);
  }
  zremrangebyscore(key: string, min: number, max: number): void {
    const z = this.zsets.get(key);
    if (!z) return;
    for (const [m, s] of z) if (s >= min && s <= max) z.delete(m);
  }
  zcard(key: string): number {
    return this.zsets.get(key)?.size ?? 0;
  }
}

function isAllowedSlidingFixed(redis: FakeRedisZSet, userId: string, windowMs: number, now: number): void {
  const key = \`ratelimit:sliding:\${userId}\`;
  redis.zremrangebyscore(key, 0, now - windowMs);
  // Unique per-request member, exactly matching the main page's own
  // mistake block's own recommended fix.
  redis.zadd(key, now, \`\${now}-\${Math.random()}\`);
}

const redis = new FakeRedisZSet();
const now = Date.now();

await Promise.all([1, 2, 3].map(() => isAllowedSlidingFixed(redis, 'u1', 60000, now)));

console.log('requests counted after fix, same millisecond:', redis.zcard('ratelimit:sliding:u1'));
// requests counted after fix, same millisecond: 3`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague proposes fixing the bug differently: instead of adding randomness to the member, use <code>process.hrtime.bigint()</code> (nanosecond resolution) as BOTH the score and the member, reasoning that nanosecond timestamps are "basically always unique." Does this actually fix the bug the same way the random-suffix fix does?',
    hint: 'Think about what "basically always unique" leaves open, and whether the rate limiter\'s own correctness can depend on a "basically" instead of a guarantee.',
    solution: `It narrows the collision window dramatically but does not structurally eliminate it the way appending Math.random() does. Two genuinely simultaneous requests handled on different CPU cores, or a JS engine that batches multiple synchronous operations within one microtask tick, can still produce the exact same nanosecond reading in principle -- "basically always unique" is a probabilistic argument, not a guarantee, the same category of risk (just far smaller in practice) as the original millisecond-only bug.

The random-suffix fix does not have this weakness: even if two requests land at the EXACT same timestamp (down to any resolution), appending an independent random value makes the resulting member strings distinct with overwhelming probability, and more importantly, decouples "is this member unique" from "how precise is my clock" entirely -- the fix works the same way regardless of what timer resolution is available on a given platform.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A rate limiter\'s own mistake block already teaches this lesson generically — the SAME page\'s own working example must apply that lesson correctly, since it comes right after."',
      reality: 'Demonstrated directly above: the page\'s own "Node.js Patterns" codeTab was written before (or independently of) the mistake block, and repeats the exact mistake the mistake block warns against. A lesson stated once on a page does not guarantee every OTHER code sample on that same page actually follows it — each sample needs its own check.',
    },
    {
      thought: '"This bug would be caught immediately by any reasonable test suite."',
      reality: 'A sequential test suite (call the rate limiter once, wait, call it again) never exercises this bug at all, since each call naturally gets its own millisecond. Only a genuinely concurrent test (Promise.all of several calls) or real production traffic under load surfaces it — exactly the scenario a rate limiter is built to handle, making this a dangerous blind spot for typical unit-test coverage.',
    },
  ];

  topicLabel = 'Sorted Sets';
  topicRoute = '/redis/sorted-sets';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'ZUNIONSTORE: WEIGHTS, AGGREGATE, and the COUNT Mode',
    route: '/redis/sorted-sets/zunionstore-weights-aggregate-and-count-mode',
  };
}
