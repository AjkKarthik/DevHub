import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: '429 Too Many Requests', type: 'keyword', desc: 'HTTP status for rate limit exceeded. Always include Retry-After and X-RateLimit-* headers.' },
  { name: 'Fixed Window',          type: 'keyword', desc: 'Count requests in a fixed time window (e.g., 100/min). Simple but vulnerable to boundary bursts.' },
  { name: 'Sliding Window',        type: 'keyword', desc: 'Count requests in the last N seconds rolling — smoother than fixed window, no boundary burst.' },
  { name: 'Token Bucket',          type: 'keyword', desc: 'Tokens added at a fixed rate; each request consumes one token. Allows bursts up to bucket capacity.' },
  { name: 'Leaky Bucket',          type: 'keyword', desc: 'Requests queue; processed at a fixed rate. Smoothest output; queue fills → 429 on overflow.' },
  { name: 'X-RateLimit-Remaining', type: 'keyword', desc: 'Response header: remaining requests allowed in the current window. -1 = no limit.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why Rate Limit?',
    points: [
      'Rate limiting protects your API from abuse, DoS attacks, and runaway clients that accidentally hammer your servers with retry loops.',
      'Fair usage: prevents one consumer from consuming all capacity at the expense of others. A bug in one integration should not degrade service for all consumers.',
      'Cost control: every API request has a cost (compute, DB queries, third-party calls). Rate limits make cost predictable and cap runaway bill scenarios.',
      'Tier-based monetization: free tier gets 100 req/min; paid tiers get higher limits. Rate limiting is the technical implementation of pricing tiers.',
    ],
  },
  {
    heading: 'Rate Limiting Algorithms',
    points: [
      'Fixed Window: count requests per time window (e.g., 100 requests per minute, reset at :00). Simple to implement but vulnerable to boundary burst — 200 requests in 2 seconds straddling the window boundary.',
      'Sliding Window: rolling count of requests in the last 60 seconds. Fairer and smoother than fixed window — prevents boundary bursts. Slightly more expensive (Redis sorted set or approximate counter).',
      'Token Bucket: refill tokens at a fixed rate (e.g., 1 token/sec, bucket capacity 60). Each request consumes a token. Allows natural bursts up to the bucket capacity — best for bursty workloads.',
      'Leaky Bucket: requests enter a queue; the queue drains at a fixed rate. Smoothest output — forces a steady rate regardless of burst. Queue overflow → 429. Good for protecting downstream services.',
    ],
  },
  {
    heading: 'Rate Limit Dimensions',
    points: [
      'Per API key: most common. Each consumer (API key) gets an independent limit — one misbehaving consumer does not affect others.',
      'Per IP address: for public/unauthenticated endpoints (login, sign-up) — prevents brute-force attacks. Less precise for consumers behind NAT/proxy.',
      'Per user: finer than API key — useful if one API key is shared by multiple end users (B2B platforms).',
      'Per endpoint: expensive endpoints (report generation, bulk export) may have tighter limits than cheap endpoints (GET /status). Set limits proportional to resource cost.',
    ],
  },
  {
    heading: 'Response Headers',
    points: [
      'Always return rate limit headers on every response — not just on 429. Consumers need these to implement proactive rate limit management.',
      'Standard headers: `X-RateLimit-Limit` (total limit), `X-RateLimit-Remaining` (remaining in current window), `X-RateLimit-Reset` (Unix timestamp when window resets).',
      'On 429: include `Retry-After` header (seconds to wait, or HTTP date) — consumers can backoff correctly without guessing.',
      'Emerging standard: IETF draft "RateLimit Fields for HTTP" proposes standardised `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Sliding Window (Redis)',
    language: 'typescript',
    code: `import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

interface RateLimitConfig {
  windowSeconds: number;  // window size
  maxRequests: number;    // requests allowed per window
  keyFn: (req: Request) => string; // what to rate-limit by
}

function rateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = \`rl:\${config.keyFn(req)}\`;
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    // Sliding window using Redis Sorted Set
    // Score = timestamp; remove entries outside the window, then count remaining
    const pipeline = redis.multi();
    pipeline.zRemRangeByScore(key, '-inf', windowStart.toString());
    pipeline.zCard(key);
    pipeline.zAdd(key, [{ score: now, value: \`\${now}-\${Math.random()}\` }]);
    pipeline.expire(key, config.windowSeconds);
    const results = await pipeline.exec();

    const requestCount = results[1] as number;

    // Set rate limit headers on EVERY response
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - requestCount - 1));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + config.windowSeconds * 1000) / 1000));

    if (requestCount >= config.maxRequests) {
      res.setHeader('Retry-After', config.windowSeconds);
      return res.status(429).json({
        error: {
          code: 'rate_limit_exceeded',
          message: \`Rate limit of \${config.maxRequests} requests per \${config.windowSeconds}s exceeded.\`,
          retryAfter: config.windowSeconds,
        },
      });
    }

    next();
  };
}

// Per API key rate limiter: 1000 req/min
const apiKeyLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 1000,
  keyFn: (req) => req.headers['x-api-key'] as string ?? 'anonymous',
});

// Per IP limiter for unauthenticated endpoints: 20 req/min (brute-force protection)
const ipLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 20,
  keyFn: (req) => req.ip ?? 'unknown',
});

// Apply globally to authenticated routes
app.use('/api', apiKeyLimiter);

// Stricter limit on auth endpoints
app.post('/auth/login', ipLimiter, handleLogin);
app.post('/auth/register', ipLimiter, handleRegister);`,
  },
  {
    label: 'Token Bucket',
    language: 'typescript',
    code: `// Token bucket — allows bursts up to capacity, then throttles to refill rate
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,    // max burst: 60 tokens
    private refillRate: number,  // tokens per second: 10
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(count = 1): { allowed: boolean; tokens: number; retryAfterMs: number } {
    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= count) {
      this.tokens -= count;
      return { allowed: true, tokens: this.tokens, retryAfterMs: 0 };
    }

    // Calculate how long until enough tokens are available
    const tokensNeeded = count - this.tokens;
    const retryAfterMs = (tokensNeeded / this.refillRate) * 1000;
    return { allowed: false, tokens: this.tokens, retryAfterMs };
  }
}

// Per-consumer buckets stored in Redis (simplified in-memory version)
const buckets = new Map<string, TokenBucket>();

function getOrCreateBucket(key: string): TokenBucket {
  if (!buckets.has(key)) {
    buckets.set(key, new TokenBucket(60, 10)); // 60 burst, 10/s sustained
  }
  return buckets.get(key)!;
}

function tokenBucketMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string ?? req.ip;
  const bucket = getOrCreateBucket(apiKey!);
  const result = bucket.consume();

  res.setHeader('X-RateLimit-Remaining', Math.floor(result.tokens));

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    return res.status(429).json({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many requests. Token bucket depleted.',
        retryAfterMs: Math.ceil(result.retryAfterMs),
      },
    });
  }

  next();
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not returning Retry-After on 429 responses',
    wrong: `if (rateLimitExceeded) {
  return res.status(429).json({ error: 'Too many requests' });
  // Consumers retry immediately → makes the problem worse
}`,
    right: `if (rateLimitExceeded) {
  res.setHeader('Retry-After', '60'); // seconds; or HTTP-date string
  return res.status(429).json({
    error: { code: 'rate_limit_exceeded', message: 'Retry after 60 seconds', retryAfter: 60 }
  });
}`,
    explanation: 'Without Retry-After, clients either retry immediately (making the overload worse) or implement arbitrary backoff. Retry-After tells clients exactly when they can retry — enabling polite exponential backoff. Always include it on 429 responses.',
  },
  {
    title: 'Only setting rate limit headers on 429 responses',
    wrong: `// Headers only sent when limit is exceeded — consumers can't monitor their usage
if (exceeded) {
  res.setHeader('X-RateLimit-Remaining', 0);
  return res.status(429)...;
}`,
    right: `// Set headers on EVERY response — consumers track usage proactively
res.setHeader('X-RateLimit-Limit', maxRequests);
res.setHeader('X-RateLimit-Remaining', remaining);
res.setHeader('X-RateLimit-Reset', resetTimestamp);

if (exceeded) return res.status(429)...;
next();`,
    explanation: 'Rate limit headers on every response let consumers monitor their usage and back off before hitting the limit — not just after. A well-implemented client reads X-RateLimit-Remaining and slows down when it approaches zero, avoiding 429s entirely.',
  },
  {
    title: 'Using in-memory rate limiting in a multi-instance deployment',
    wrong: `// In-memory counter — resets on restart, not shared across instances
const counts = new Map<string, number>();
if ((counts.get(key) ?? 0) >= limit) return res.status(429)...;
counts.set(key, (counts.get(key) ?? 0) + 1);`,
    right: `// Redis-backed counter — shared across all server instances, survives restarts
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, windowSeconds);
if (count > limit) return res.status(429)...;`,
    explanation: 'In-memory counters are not shared between server instances. With 5 instances and an in-memory limit of 100 req/min, a consumer can actually make 500 requests by spreading them across instances. Always use a shared store (Redis) for rate limit state in horizontally-scaled deployments.',
  },
  {
    title: 'Applying the same rate limit to all endpoints regardless of cost',
    wrong: `// Same limit for cheap and expensive endpoints
app.use('/api', rateLimiter({ maxRequests: 100, windowSeconds: 60 }));
// GET /status (microseconds) gets same limit as POST /reports/export (30 seconds)`,
    right: `// Granular limits proportional to endpoint cost
app.use('/api', rateLimiter({ maxRequests: 1000, windowSeconds: 60 }));
// Expensive endpoints get tighter limits
app.post('/reports/export', rateLimiter({ maxRequests: 5, windowSeconds: 3600 }), ...);
app.get('/search', rateLimiter({ maxRequests: 50, windowSeconds: 60 }), ...);`,
    explanation: 'A 100 req/min limit on cheap GET /status is wasteful; the same limit on an expensive report-generation endpoint is too lenient. Set limits proportional to the resource cost of each endpoint — cheap reads can have high limits; expensive writes and report generation need tight limits.',
  },
];

const challenge: Challenge = {
  title: 'Fixed Window Rate Limiter',
  language: 'typescript',
  description: `Implement a FixedWindowLimiter class:
- constructor(limit: number, windowMs: number)
- consume(key: string): { allowed: boolean; remaining: number; resetAt: number }
  - Track request counts per key per window
  - resetAt is the timestamp (ms) when the current window expires
  - After windowMs, count resets to 0`,
  hints: [
    'Store { count, windowStart } per key in a Map',
    'If Date.now() - windowStart >= windowMs, reset the window',
  ],
  starterCode: `class FixedWindowLimiter {
  private store = new Map<string, { count: number; windowStart: number }>();

  constructor(private limit: number, private windowMs: number) {}

  consume(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    // Get or initialize entry for key
    // Reset if window has expired
    // Increment count, check against limit
    return { allowed: true, remaining: 0, resetAt: 0 };
  }
}

const limiter = new FixedWindowLimiter(3, 1000); // 3 req per second
console.log(limiter.consume('user1')); // { allowed: true, remaining: 2, ... }
console.log(limiter.consume('user1')); // { allowed: true, remaining: 1, ... }
console.log(limiter.consume('user1')); // { allowed: true, remaining: 0, ... }
console.log(limiter.consume('user1')); // { allowed: false, remaining: 0, ... }`,
  solution: `class FixedWindowLimiter {
  private store = new Map<string, { count: number; windowStart: number }>();

  constructor(private limit: number, private windowMs: number) {}

  consume(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now - entry.windowStart >= this.windowMs) {
      entry = { count: 0, windowStart: now };
      this.store.set(key, entry);
    }

    const resetAt = entry.windowStart + this.windowMs;
    entry.count++;

    if (entry.count > this.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining: this.limit - entry.count, resetAt };
  }
}

const limiter = new FixedWindowLimiter(3, 1000);
console.log(limiter.consume('user1'));
console.log(limiter.consume('user1'));
console.log(limiter.consume('user1'));
console.log(limiter.consume('user1')); // blocked`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main advantage of the token bucket algorithm over fixed window rate limiting?',
    options: [
      'Token bucket uses less memory because it does not store timestamps',
      'Token bucket allows natural bursts up to the bucket capacity, then throttles to the refill rate',
      'Token bucket prevents all requests above the limit, even brief spikes',
      'Token bucket is simpler to implement and requires no shared state',
    ],
    answer: 1,
    explanation: 'Token bucket allows bursts — if the bucket has accumulated tokens, a consumer can make many requests quickly up to the bucket capacity, then the rate is throttled to the refill rate. Fixed window applies the same limit to all windows regardless of recent usage. Token bucket is better for bursty but overall well-behaved clients.',
  },
  {
    q: 'Why should rate limit headers be sent on every API response, not just 429 responses?',
    options: [
      'HTTP requires rate limit headers on all responses per RFC 7231',
      'Sending headers on every response lets clients proactively slow down before hitting the limit',
      'Most API gateways reject responses that do not include rate limit headers',
      'Rate limit headers are required for CORS to work correctly in browsers',
    ],
    answer: 1,
    explanation: 'X-RateLimit-Remaining on every response lets well-implemented clients monitor their remaining quota and slow down before hitting zero — avoiding 429 errors entirely. A client that only learns its limit when it gets a 429 cannot proactively manage its rate. Sending headers proactively enables polite consumption.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do you implement rate limiting for a distributed API with multiple server instances?',
    a: 'In-memory counters do not work across instances — use a shared store: <ul><li><strong>Redis</strong>: atomic INCR + EXPIRE for fixed window; sorted sets (ZADD/ZCARD/ZREMRANGEBYSCORE) for sliding window; Lua scripts for atomic compare-and-set in token bucket. Redis is the industry standard for rate limiting — sub-millisecond, supports clustering.</li><li><strong>API Gateway</strong>: AWS API Gateway, Kong, Nginx, Cloudflare — handle rate limiting at the edge before requests reach your servers. Zero code in your app. Best for large-scale or multi-service architectures.</li><li><strong>Distributed counters</strong>: for extremely high throughput, use approximate counting (probabilistic structures like Redis HyperLogLog) or shard counters by instance and accept slight over-counting.</li></ul>Library choice for Node.js: <code>rate-limiter-flexible</code> — supports Redis, Mongo, PostgreSQL backends with fixed/sliding window and token bucket algorithms in one package.',
  },
  {
    q: 'How should API consumers handle rate limit errors gracefully?',
    a: `Good API client behavior when receiving 429: <ol>
      <li><strong>Read Retry-After header</strong>: wait exactly that many seconds before retrying — not less (wastes quota), not more (unnecessary delay)</li>
      <li><strong>Exponential backoff with jitter</strong>: if no Retry-After, start with a 1s delay and double on each retry + random jitter (±30%) to prevent thundering herd when many clients retry simultaneously</li>
      <li><strong>Monitor X-RateLimit-Remaining</strong>: when remaining approaches 0 (e.g., below 10%), slow down proactively — add artificial delays between requests</li>
      <li><strong>Queue requests locally</strong>: if bursting, buffer requests in a local queue and release them at a rate just under the limit</li>
      <li><strong>Circuit breaker</strong>: if receiving many 429s in a row, open the circuit and fail fast for N seconds rather than continuing to hammer the API</li>
    </ol>`,
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Rate limiting protects capacity and enables fair usage — always return 429 with Retry-After + X-RateLimit-* headers; use Redis for shared state across instances.',
  mustKnow: [
    '429 Too Many Requests + Retry-After + X-RateLimit-Limit/Remaining/Reset headers',
    'Fixed window: simple but boundary burst vulnerability; sliding window: smoother',
    'Token bucket: allows bursts up to capacity then throttles — best for bursty clients',
    'Rate limit per API key, per IP for auth endpoints, per endpoint for expensive ops',
    'Redis INCR+EXPIRE for fixed window; sorted sets for sliding window — shared across instances',
    'Never use in-memory counters in multi-instance deployments — state not shared',
  ],
  interviewFocus: [
    'What is the difference between token bucket and fixed window rate limiting?',
    'How do you implement rate limiting in a horizontally-scaled deployment?',
    'What headers should a 429 response include?',
  ],
};

@Component({
  selector: 'app-api-rate-limiting',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rate-limiting.html',
  styleUrl: './rate-limiting.scss',
})
export class ApiRateLimiting {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
