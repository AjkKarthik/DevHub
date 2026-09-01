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
    heading: 'Named in Prose, Never Built in Code',
    points: [
      'The QnA on rate limiting names token bucket, leaky bucket, sliding window, and fixed window as the four standard algorithms, names Redis as the storage layer for distributed limiting, and names the exact response headers a well-behaved limiter returns — <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code>, <code>RateLimit-Reset</code>, and <code>Retry-After</code> — but no codeTab on the page implements any of it.',
      'Token bucket is the algorithm the QnA itself recommends "for natural burst handling": a bucket holds up to <em>capacity</em> tokens, refills continuously at a fixed rate, and each request consumes one token. A caller can burst up to the full capacity instantly, then is limited to the steady refill rate — a behavior neither fixed-window nor a naive request counter can express.',
      'The four headers map directly onto the bucket’s own state at request time: <code>RateLimit-Limit</code> is the bucket’s capacity, <code>RateLimit-Remaining</code> is the floor of its current token count, <code>RateLimit-Reset</code> is the Unix timestamp at which the bucket will next be back at full capacity, and <code>Retry-After</code> — returned only on a rejected (429) request — is the number of seconds until at least one token will be available again.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Token-Bucket Limiter, Verified',
    language: 'typescript',
    code: `interface BucketState { tokens: number; lastRefillMs: number; }

class TokenBucketLimiter {
  private buckets = new Map<string, BucketState>();
  constructor(private capacity: number, private refillPerSec: number) {}

  check(key: string, nowMs: number) {
    let b = this.buckets.get(key);
    if (!b) { b = { tokens: this.capacity, lastRefillMs: nowMs }; this.buckets.set(key, b); }

    const elapsedSec = (nowMs - b.lastRefillMs) / 1000;
    b.tokens = Math.min(this.capacity, b.tokens + elapsedSec * this.refillPerSec);
    b.lastRefillMs = nowMs;

    const secsToFull = (this.capacity - b.tokens) / this.refillPerSec;
    const resetAt = Math.floor((nowMs + secsToFull * 1000) / 1000);

    if (b.tokens >= 1) {
      b.tokens -= 1;
      return { allowed: true, limit: this.capacity, remaining: Math.floor(b.tokens), resetAt };
    }
    const retryAfterSec = Math.ceil((1 - b.tokens) / this.refillPerSec);
    return { allowed: false, limit: this.capacity, remaining: 0, retryAfterSec,
             resetAt: Math.floor((nowMs + retryAfterSec * 1000) / 1000) };
  }
}

function applyRateLimitHeaders(res: Response, r: ReturnType<TokenBucketLimiter['check']>) {
  res.setHeader('RateLimit-Limit', r.limit);
  res.setHeader('RateLimit-Remaining', r.remaining);
  res.setHeader('RateLimit-Reset', r.resetAt);
  if (!r.allowed) res.setHeader('Retry-After', (r as any).retryAfterSec);
}

// Verified: 5-token bucket, refilling at 1 token/sec, 6 requests fired
// back-to-back (0 elapsed time between them):
//
//   req 1: ALLOWED  remaining=4
//   req 2: ALLOWED  remaining=3
//   req 3: ALLOWED  remaining=2
//   req 4: ALLOWED  remaining=1
//   req 5: ALLOWED  remaining=0   -- full burst of 5 consumed instantly
//   req 6: REJECTED 429           retryAfterSec=1
//
// One full second later, exactly ONE more request is allowed (the
// bucket refilled by 1 token), then the next is rejected again --
// the steady-state rate after the burst is exhausted.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A partner API key is configured with <code>capacity=10, refillPerSec=2</code>. The partner fires 10 requests back-to-back with zero elapsed time between them, then waits exactly 3 seconds and fires 1 more. Which requests are allowed, and what does <code>RateLimit-Remaining</code> read on the very last one?',
  hint: 'The first 10 requests all land at the same instant (0 elapsed time between them), so no refill happens between any of them. After that, elapsed time before the 11th request is 3 seconds at a 2-token/sec refill rate.',
  solution: `// Requests 1-10, fired instantly (0 elapsed time between each):
//   Bucket starts full at 10 tokens; each of the 10 requests consumes
//   one token with no refill in between (elapsed time is 0 each time).
//   All 10 are ALLOWED. remaining after request 10 = 0.
//
// 3 seconds pass. Refill = 3 sec * 2 tokens/sec = 6 tokens.
//   Bucket refills from 0 to min(10, 0 + 6) = 6 tokens.
//
// Request 11:
//   6 tokens available >= 1 -> ALLOWED.
//   One token consumed: remaining = 6 - 1 = 5.
//
// RateLimit-Remaining on the last (11th) request: 5.
//
// This demonstrates the core token-bucket property the QnA names --
// "allows burst up to bucket size" -- the first 10 requests all
// succeed in a single instant precisely BECAUSE the bucket started
// full, not because the rate limiter is misconfigured or broken.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A rate limiter that "allows bursts" is a looser, less effective control than one that enforces a strict, evenly-spaced request rate.',
    reality: 'Token bucket is the QnA’s own recommended algorithm specifically because most real traffic is bursty by nature (a page load firing several API calls at once) — a strict evenly-spaced limiter would reject legitimate burst traffic that a token bucket handles correctly, while still capping the LONG-RUN average rate to the same refill rate either way.',
  },
  {
    thought: '<code>RateLimit-Remaining</code> reaching 0 means the caller is now rate-limited and every subsequent request will be rejected.',
    reality: 'A bucket at 0 tokens is not the same as a bucket permanently empty — it continues refilling at <code>refillPerSec</code> the whole time. As demonstrated in the Try It, a caller who exhausts a 10-token bucket can be fully allowed again after enough elapsed time, without ever needing to wait for some fixed "window" to reset.',
  },
  {
    thought: 'The four rate-limiting headers (<code>RateLimit-Limit</code>/<code>Remaining</code>/<code>Reset</code>, <code>Retry-After</code>) are algorithm-specific to token bucket and wouldn’t apply to a sliding-window or fixed-window limiter.',
    reality: 'These headers describe the CALLER-FACING contract (how many requests are left, when to check back), not the internal algorithm — a sliding-window or fixed-window limiter reports the exact same four headers, just computed from its own different internal state (a request count in a time bucket) instead of a token count.',
  },
];

@Component({
  selector: 'app-api-security-rate-limiter',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-token-bucket-rate-limiter-with-real-headers.html',
  styleUrl: './a-token-bucket-rate-limiter-with-real-headers.scss',
})
export class ATokenBucketRateLimiterWithRealHeadersSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
