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
  {
    heading: 'Rate Limiting as a Product and Business Decision',
    points: [
      'Rate limits communicate implicit product tiers — a generous free-tier limit combined with substantially higher paid-tier limits is both a technical protection mechanism and a monetization lever, meaning rate limit design decisions often require input from product and business stakeholders, not engineering alone.',
      'Overly restrictive rate limits frustrate legitimate high-volume users and push them toward workarounds (aggressive caching, scraping via multiple accounts) that can be worse for system load than simply granting a higher limit in the first place — rate limits should be calibrated against genuine legitimate usage patterns, not set arbitrarily low out of caution.',
      'Transparent rate limit communication (documented limits, response headers showing remaining quota) is what allows well-behaved API consumers to build their own client-side throttling and avoid ever actually hitting a 429 — poor communication forces consumers to discover limits through trial and error, creating a worse integration experience.',
      'Rate limiting should be designed and load-tested before launch, not added reactively after a rate-limit-related incident — retrofitting rate limiting onto an API with existing high-volume consumers who have built integrations assuming no limits exist is a much more disruptive change than designing it in from the start.',
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
    // Score = timestamp; remove entries outside the window, then count remaining.
    // IMPORTANT: only add THIS request's own entry if it's going to be allowed --
    // adding it unconditionally (before checking) means a REJECTED request still
    // occupies a slot in the window, so a client that retries after a 429 keeps
    // re-polluting its own window and can become permanently locked out. This
    // check-then-conditionally-add is two round trips (a narrow race window
    // between concurrent requests, the same TOCTOU trade-off this page's own
    // QnA on token-bucket Lua scripts describes) -- a Lua script would close it
    // entirely, at the cost of the simplicity shown here.
    const readPipeline = redis.multi();
    readPipeline.zRemRangeByScore(key, '-inf', windowStart.toString());
    readPipeline.zCard(key);
    const readResults = await readPipeline.exec();
    const requestCount = readResults[1] as number;

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

    // Only reaching here means the request is ALLOWED -- record it now.
    const writePipeline = redis.multi();
    writePipeline.zAdd(key, [{ score: now, value: \`\${now}-\${Math.random()}\` }]);
    writePipeline.expire(key, config.windowSeconds);
    await writePipeline.exec();

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
  { q: 'What is the difference between the fixed window and sliding window rate limiting algorithms?', options: ['Fixed window is server-side; sliding window is client-side', 'Fixed window counts requests in a fixed time interval (resets every minute); sliding window counts requests in a rolling interval starting from the first request, preventing the burst at window boundary that fixed window allows', 'Fixed window is more accurate; sliding window is an approximation', 'Both algorithms produce the same result for all request patterns'], answer: 1, explanation: 'Fixed window problem: a client is allowed 100 requests per minute. Window resets at :00. The client sends 100 requests at :59 and 100 more at :01. In 2 seconds, 200 requests pass because they span two windows. Sliding window: tracks individual request timestamps. At any point, count requests in the past 60 seconds. The client cannot burst at window boundaries. More accurate but requires storing per-request timestamps. Sliding window log: store all request timestamps (expensive at high volume). Sliding window counter: use the proportion of the previous window that overlaps with the current window to estimate the sliding count (approximation but efficient). Redis sorted sets are commonly used for sliding window rate limiting.' },
  { q: 'What is a token bucket algorithm and how does it allow controlled bursting?', options: ['A security token management system that limits API token reuse', 'An algorithm where tokens accumulate in a bucket at a fill rate; each request consumes one token; the bucket capacity defines the maximum burst; no token means the request is rejected or queued', 'A database connection pool algorithm applied to API rate limiting', 'A rate limiting algorithm that randomly selects which requests to allow based on token probability'], answer: 1, explanation: 'Token bucket: capacity (bucket size): the maximum tokens that can accumulate. Fill rate: tokens added per second (e.g., 10 tokens/second). Per request: remove 1 token (or N tokens for expensive operations). No tokens: reject the request (429) or queue it. Burst behavior: if a client has been idle, tokens accumulate up to capacity. They can then burst at the full capacity before being rate limited. Example: capacity=100, fill rate=10/sec. An idle client can burst 100 requests, then is limited to 10/sec. This accommodates legitimate usage patterns where clients are idle then suddenly active. Used by Stripe and most payment APIs. Leaky bucket: similar but the queue is finite (requests drain at a fixed rate). Excess requests are dropped. Smooths out bursts instead of allowing them.' },
  { q: 'What response headers should an API return when rate limiting is applied?', options: ['Only the HTTP 429 status code; headers are optional and optional headers add confusion', 'RateLimit-Limit (the limit), RateLimit-Remaining (requests left in window), RateLimit-Reset (when the window resets), and Retry-After (when to retry after a 429)', 'Only the Retry-After header is standard; other rate limit headers are proprietary extensions', 'Rate limit headers are only required for OAuth2-authenticated requests'], answer: 1, explanation: 'Rate limit response headers (RateLimit-* draft RFC): RateLimit-Limit: the maximum number of requests allowed in the window. RateLimit-Remaining: the number of requests remaining in the current window. RateLimit-Reset: the time when the window resets (Unix timestamp or seconds until reset). When rate limited (HTTP 429): Retry-After: the number of seconds to wait before retrying (or an RFC 1123 date). RateLimit-Remaining: 0. Custom header variations: GitHub uses X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Twitter/X also uses X-Rate-Limit-* prefixed headers. Client best practices: exponential backoff starting with the Retry-After value. Monitor RateLimit-Remaining proactively and slow down before hitting 0.' },
  { q: 'How do you implement distributed rate limiting across multiple API server instances?', options: ['Distributed rate limiting requires a dedicated rate limiting microservice and cannot be done with shared state', 'Use a shared centralized store (Redis) where all API instances atomically increment a counter for the same client key, ensuring rate limits are enforced globally across all instances', 'Each API server instance maintains independent rate limit counters; no coordination is needed', 'Implement rate limiting only at the load balancer level; individual API instances should not rate limit'], answer: 1, explanation: 'Distributed rate limiting with Redis: each API request performs a Redis INCR operation on the key: rate:clientId:windowStart. Set TTL to the window duration. If the count exceeds the limit, return 429. Redis atomic operations (INCR, INCRBY) ensure no race conditions across instances. Redis Lua script for token bucket: atomically check and update the token count and last refill timestamp in one round trip. Redis Cell module: built-in token bucket implementation with INCR commands. Considerations: Redis adds latency to every request (1-2ms for local Redis). Mitigation: use Redis in the same data center. Pipeline multiple Redis commands. Use allow-once with async validation for very high-throughput APIs (accept the request, validate rate limit asynchronously, block future requests if exceeded). Alternative: API gateway handles rate limiting centrally (Kong, AWS API Gateway).' },
];

const qna: QnaItem[] = [
  {
    q: 'Why must the Redis operations backing a distributed token bucket be wrapped in a Lua script rather than issued as separate INCR/GET/SET commands from the application?',
    a: 'A token bucket check-and-decrement is inherently a read-modify-write sequence (read current token count, check if enough tokens remain, decrement if so) — issuing this as separate round-trip commands from the application creates a race window between two concurrent requests: both could read the same token count, both see "enough tokens available," and both proceed, silently allowing more requests through than the bucket should permit (a classic TOCTOU race). A Lua script runs entirely atomically inside Redis\'s single-threaded execution model — the read, check, and decrement happen as one indivisible operation with no other client\'s commands able to interleave in the middle, which is why virtually every production-grade distributed rate limiter (not just token bucket) implements its core logic as a Lua script rather than a sequence of separate Redis commands.',
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
  { q: 'How do you design rate limits for different client tiers?', a: 'Tiered rate limiting: different clients have different rate limits based on their tier. Example tiers: free tier: 100 requests/minute, 1000 requests/day. Pro tier: 1000 requests/minute, 10000 requests/day. Enterprise: custom limits negotiated by contract. Implementation: the API key or JWT contains the tier claim. The rate limiter checks the tier and applies the appropriate limit. Separate limit keys: rate:tier:pro:clientId vs rate:tier:free:clientId. Granular limits: rate limit per endpoint: /checkout may have a lower limit than /products. Rate limit per resource: user actions limited separately from read operations. Cost-based limiting: expensive operations consume more tokens than cheap ones. Rate limit headers should include the tier limit, not a generic limit. API gateway support: most API gateways (Kong, AWS API Gateway) support tiered rate limiting through usage plans and quotas.' },
  { q: 'What strategies reduce the impact of rate limiting on legitimate clients?', a: 'Reducing rate limit friction for legitimate clients: proactive rate limit communication: return RateLimit-Remaining in every response so clients can slow down before hitting the limit. Burst allowance: use token bucket to allow short bursts for legitimate usage patterns without penalizing the client for normal behavior. Soft limits: apply throttling (delay) before hard limits (rejection). The client experiences slower responses but is not blocked. Retry guidance: always include a Retry-After header in 429 responses with an exact wait time. Batch endpoints: provide batch APIs so clients can do more work per request (GET /orders?ids=1,2,3 instead of 3 separate calls). Webhooks: push data to clients instead of requiring polling. Reduces the number of requests clients need to make for monitoring use cases. Generous per-day limits with tighter per-minute limits: allows normal usage patterns while preventing sudden spikes.' },
  { q: 'How do you handle rate limiting for IP addresses vs API keys?', a: 'IP-based rate limiting: easier to implement without authentication. Effective for blocking abusive bots and DoS attacks. Problems: shared NAT (thousands of users sharing one IP — a corporate proxy). IPv6 (clients may use different IPs per request). Dynamic IPs (legitimate mobile users change IPs). Use for: unauthenticated endpoints (login, registration, password reset). DDoS mitigation at the network edge. API key-based rate limiting: tied to the client identity, not the network origin. Works through NATs and dynamic IPs. The API key identifies the specific consumer. Use for: authenticated API endpoints. Partner rate limiting by consumer. Combination strategy: IP rate limiting as a first line of defense (WAF, CDN edge). API key rate limiting for authenticated endpoints. Log the IP alongside the API key for security investigation. For unauthenticated abuse: IP-based blocking is the only option before authentication.' },
  { q: 'What are rate limiting design patterns for GraphQL APIs?', a: 'GraphQL rate limiting challenges: GraphQL has one endpoint. A simple request-count limit does not capture query cost differences (a query fetching 1 item vs 10000 items is very different). Rate limiting strategies for GraphQL: query complexity limiting: calculate the complexity score of the query before execution. If it exceeds the threshold, reject it. Track complexity per client key. Rate limit by complexity instead of request count: a client has 10000 complexity points per minute. A simple query costs 10 points; a complex nested query costs 500. Persisted queries: limit clients to registered queries only. Each registered query has a pre-calculated cost. Rate limit based on the per-query cost. Request count as floor: combine complexity limiting with a base request limit to catch trivial query flooding. Depth limiting: set a max query depth to prevent deeply nested queries that bypass complexity limits. Return the remaining complexity budget in response extensions: { extensions: { rateLimit: { remaining: 500, resetAt: ... } } }.' },
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
