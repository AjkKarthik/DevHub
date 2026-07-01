import { Component } from '@angular/core';
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

@Component({
  selector: 'app-redis-rate-limiting',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rate-limiting.html',
  styleUrl: './rate-limiting.scss',
})
export class RedisRateLimiting {
  quickRef: QuickRefItem[] = [
    { name: 'Fixed Window', type: 'syntax', desc: 'INCR + EXPIRE per time bucket — simple, allows burst at window boundary' },
    { name: 'Sliding Window (log)', type: 'syntax', desc: 'ZADD + ZREMRANGEBYSCORE per identifier — accurate, more memory' },
    { name: 'Sliding Window (counter)', type: 'syntax', desc: 'Two-bucket weighted average — accurate, low memory, one roundtrip via Lua' },
    { name: 'Token Bucket', type: 'syntax', desc: 'HMSET tokens+last; refill rate × elapsed; deduct 1 token atomically' },
    { name: 'Leaky Bucket', type: 'syntax', desc: 'LPUSH requests; background consumer drains at fixed rate' },
    { name: 'INCR key', type: 'keyword', desc: 'Atomic increment — returns new value for counter-based limiters' },
    { name: 'ZADD key score member', type: 'keyword', desc: 'Add timestamped request to sliding log (score = timestamp)' },
    { name: 'ZREMRANGEBYSCORE key min max', type: 'keyword', desc: 'Remove requests outside the sliding window' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Fixed Window Counter',
      points: [
        'Simplest approach: INCR a key per time window (e.g. `rl:user:42:2024-01-15:14:30` for per-minute). Set EXPIRE on first write.',
        'Pros: O(1), single command, minimal memory. Cons: burst at window boundary — a user can send limit×2 requests by sending limit at 11:59 and limit at 12:00.',
        'Mitigated by using shorter windows (seconds) or by the sliding window approaches.',
        'Best for: high-throughput rate limiting where boundary bursts are acceptable (API quotas, per-day limits).',
      ],
    },
    {
      heading: 'Sliding Window Log',
      points: [
        'Store each request as a sorted set entry with score = timestamp. On each request: ZADD (add entry), ZREMRANGEBYSCORE (remove old entries), ZCARD (count).',
        'If count > limit, reject. Otherwise allow and set EXPIRE on the key.',
        'Pros: perfectly accurate — no boundary burst. Cons: O(log N) per request, stores every request timestamp (memory scales with traffic volume).',
        'Best for: low-to-moderate traffic where accuracy is critical (login attempts, payment APIs).',
      ],
    },
    {
      heading: 'Sliding Window Counter (Two-Bucket)',
      points: [
        'Approximation of sliding window with O(1) memory: maintain two counters — current window and previous window. Weight the previous window count by the fraction of its time that overlaps with the current sliding window.',
        'Formula: `current_count + prev_count × ((window_size - elapsed_in_current) / window_size)`.',
        'Best accuracy/efficiency trade-off for most production rate limiters. Cloudflare uses this approach.',
        'Implement atomically with a Lua script to avoid race conditions between reading prev and writing current.',
      ],
    },
    {
      heading: 'Token Bucket',
      points: [
        'Maintains `tokens` (float) and `last` (timestamp) in a hash. On each request: refill tokens based on elapsed time (rate × seconds), deduct 1 if tokens ≥ 1, reject otherwise.',
        'Allows controlled bursting up to the bucket capacity while enforcing a long-term rate. Natural model for API rate limits that allow short bursts.',
        'Must be implemented atomically (Lua script) to avoid race conditions between read and write of the token count.',
        'Best for: APIs that want to allow occasional bursts (bucket capacity) while enforcing a sustained rate.',
      ],
    },
    {
      heading: 'Implementing Sliding Window Rate Limiting with Redis',
      points: [
        'A simple fixed-window counter (INCR on a key with an EXPIRE) is easy to implement but suffers from the boundary-burst problem — a client can send up to double the intended rate by timing requests around a window reset boundary.',
        'A sliding window log implemented with a Redis sorted set (ZADD storing request timestamps as scores, ZREMRANGEBYSCORE pruning entries outside the current window, ZCARD counting remaining entries) provides accurate sliding-window rate limiting without the fixed-window boundary problem.',
        'Redis\'s atomic operations and Lua scripting make it possible to implement the entire check-and-increment rate limit logic as a single atomic operation, preventing race conditions where two near-simultaneous requests could both read a stale "under limit" count and both be incorrectly allowed through.',
        'Redis\'s in-memory speed makes it well-suited for rate limiting\'s latency-sensitive check-on-every-request pattern — a rate limit check must add minimal overhead to the request path, which a fast, dedicated in-memory store like Redis provides far better than querying a traditional disk-backed database on every request.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fixed Window',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

async function fixedWindowLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const windowKey = Math.floor(Date.now() / (windowSec * 1000));
  const key = \`rl:\${identifier}:\${windowKey}\`;

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.ttl(key);
  const [[, count], [, ttl]] = await pipeline.exec() as [[null, number], [null, number]];

  if (count === 1) await redis.expire(key, windowSec);

  const remaining = Math.max(0, limit - count);
  return {
    allowed: count <= limit,
    remaining,
    resetIn: ttl > 0 ? ttl : windowSec,
  };
}`,
    },
    {
      label: 'Sliding Window Log',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

async function slidingWindowLog(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const key = \`rl:log:\${identifier}\`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, '-inf', windowStart);  // remove old
  pipeline.zadd(key, now, \`\${now}-\${Math.random()}\`); // add current
  pipeline.zcard(key);                                  // count in window
  pipeline.expire(key, Math.ceil(windowMs / 1000) + 1);
  const results = await pipeline.exec() as [null, unknown][];

  const count = results[2][1] as number;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}`,
    },
    {
      label: 'Token Bucket (Lua)',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

const tokenBucketScript = \`
local data = redis.call('HMGET', KEYS[1], 'tokens', 'last')
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local tokens = tonumber(data[1]) or capacity
local last = tonumber(data[2]) or now
tokens = math.min(capacity, tokens + (now - last) * rate)
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
redis.call('EXPIRE', KEYS[1], math.ceil(capacity / rate) * 2)
return { allowed, math.floor(tokens) }
\`;

let tokenBucketSha: string;
async function initTokenBucket() {
  tokenBucketSha = await redis.script('LOAD', tokenBucketScript) as string;
}

async function tokenBucketCheck(
  identifier: string,
  ratePerSec: number,
  capacity: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now() / 1000;
  const result = await redis.evalsha(
    tokenBucketSha, 1,
    \`rl:tb:\${identifier}\`,
    String(now), String(ratePerSec), String(capacity),
  ) as [number, number];
  return { allowed: result[0] === 1, remaining: result[1] };
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Race condition in non-atomic fixed window (INCR + EXPIRE separately)',
      wrong: `const count = await redis.incr(key);
await redis.expire(key, windowSec); // race: two processes both incr without expiry`,
      right: `const count = await redis.incr(key);
if (count === 1) await redis.expire(key, windowSec); // only first sets expiry`,
      explanation: 'Only set EXPIRE when count === 1 (first request in window). If you call EXPIRE on every INCR, a second request resets the window TTL, potentially extending the window. If you never set EXPIRE, the key lives forever.',
    },
    {
      title: 'Using user-supplied strings directly as rate limit keys',
      wrong: 'const key = `rl:${req.headers["x-forwarded-for"]}`; // user-controlled',
      right: `const ip = req.socket.remoteAddress ?? ''; // trusted
const key = \`rl:\${ip}\`;`,
      explanation: 'Never use user-controlled headers (X-Forwarded-For, X-Real-IP) directly as rate limit keys without validation. Attackers can spoof them to bypass per-IP limits. Use the actual socket IP or a trusted proxy header configured at the load balancer.',
    },
    {
      title: 'Not returning rate limit headers to clients',
      wrong: `if (!allowed) res.status(429).json({ error: 'Rate limited' });`,
      right: `res.set({
  'X-RateLimit-Limit': String(limit),
  'X-RateLimit-Remaining': String(remaining),
  'X-RateLimit-Reset': String(resetIn),
  'Retry-After': String(resetIn),
});
if (!allowed) res.status(429).json({ error: 'Rate limited' });`,
      explanation: 'Always return rate limit headers so clients can implement backoff. X-RateLimit-Remaining tells them how many requests are left; Retry-After tells them how long to wait. Without these, clients retry immediately, amplifying traffic.',
    },
  ];

  challenge: Challenge = {
    title: 'Sliding Window Counter Limiter',
    language: 'typescript',
    description: 'Implement `slidingCounterLimit(redis, identifier, limit, windowSec)` using the two-bucket approximation. Store current and previous window counters in a hash. Return `{ allowed, remaining, resetIn }`. Use a Lua script for atomicity.',
    hints: [
      'Key: `rl:sw:{identifier}`, hash fields: `cur`, `prev`, `win` (window start epoch)',
      'weight = prev × ((windowSec - elapsed) / windowSec); total = cur + weight',
    ],
    starterCode: `import Redis from 'ioredis';

async function slidingCounterLimit(
  redis: Redis,
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {}`,
    solution: `import Redis from 'ioredis';

const script = \`
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local data = redis.call('HMGET', key, 'cur', 'prev', 'win')
local cur = tonumber(data[1]) or 0
local prev = tonumber(data[2]) or 0
local winStart = tonumber(data[3]) or now
local elapsed = now - winStart
if elapsed >= window then
  prev = (elapsed < window * 2) and cur or 0
  cur = 0
  winStart = now
  elapsed = 0
end
local weight = prev * ((window - elapsed) / window)
local total = math.floor(cur + weight)
local allowed = 0
if total < limit then
  cur = cur + 1
  allowed = 1
end
redis.call('HMSET', key, 'cur', cur, 'prev', prev, 'win', winStart)
redis.call('EXPIRE', key, window * 2)
return { allowed, math.max(0, limit - math.floor(total + (allowed == 1 and 0 or 1))), window - elapsed }
\`;

let sha: string;
async function slidingCounterLimit(redis: Redis, identifier: string, limit: number, windowSec: number) {
  if (!sha) sha = await redis.script('LOAD', script) as string;
  const now = Math.floor(Date.now() / 1000);
  const result = await redis.evalsha(sha, 1, \`rl:sw:\${identifier}\`, String(limit), String(windowSec), String(now)) as number[];
  return { allowed: result[0] === 1, remaining: result[1], resetIn: result[2] };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main drawback of the fixed window rate limiting algorithm?',
      options: [
        'It requires Lua scripts',
        'It allows 2× the limit in requests at window boundaries',
        'It uses too much memory',
        'It requires a sorted set per user',
      ],
      answer: 1,
      explanation: 'Fixed window allows a burst of 2× the limit: a user can send `limit` requests at the end of window N and `limit` more at the start of window N+1, totalling 2× limit in a short period.',
    },
    {
      q: 'Why must token bucket rate limiting be implemented with a Lua script?',
      options: [
        'Lua is faster than client-side code',
        'To avoid a race condition between reading token count and writing the updated value',
        'Redis INCR doesn\'t support floats',
        'Lua scripts bypass maxmemory limits',
      ],
      answer: 1,
      explanation: 'Token bucket requires reading the current token count, computing the new count, and writing it back. Without a Lua script (or WATCH/MULTI), two concurrent requests could both see sufficient tokens and both be allowed, exceeding the limit.',
    },
    {
      q: 'How does the INCR + EXPIRE pattern implement rate limiting?',
      options: ['It stores user requests in a sorted set', 'INCR atomically increments a counter key; EXPIRE sets its TTL so the window resets automatically — if counter exceeds limit, reject', 'It uses Lua to check and increment in one call', 'It uses Redis Streams to track requests'],
      answer: 1,
      explanation: 'SET key 1 EX window or INCR + EXPIRE on miss: key=user:endpoint, value=count. If INCR returns > limit, reject. EXPIRE ensures the window resets. Race condition: use SET NX EX or Lua for atomic INCR+EXPIRE on first request.',
    },
    {
      q: 'How do sorted sets enable a sliding window rate limiter?',
      options: ['By storing events as members with request count as score', 'By storing each request as a member with timestamp as score; remove old timestamps with ZREMRANGEBYSCORE then count with ZCARD', 'By using ZADD NX to prevent duplicates', 'Sorted sets do not support sliding window rate limiting'],
      answer: 1,
      explanation: 'ZADD key timestamp timestamp; ZREMRANGEBYSCORE key 0 (now-window); ZCARD key. If count <= limit, allow and set EXPIRE. This gives exact sliding window but uses more memory than fixed window counters.',
    },
    {
      q: 'What is a token bucket rate limiter in Redis?',
      options: ['A counter that resets every fixed time period', 'A bucket that refills at a fixed rate; requests consume tokens; if bucket is empty the request is rejected', 'A set that tracks allowed user tokens', 'A Lua script that calls INCR on a list'],
      answer: 1,
      explanation: 'Token bucket allows burst traffic up to bucket capacity, then enforces steady-state rate. Implement in Redis with a Lua script: calculate tokens refilled since last request, add to stored count (capped at max), subtract for current request, store with timestamp.',
    },
    {
      q: 'Could you achieve the same atomicity a Lua script provides for rate limiting by wrapping the check-and-decrement in a Redis MULTI/EXEC transaction instead?',
      options: ['Yes, MULTI/EXEC and Lua scripts are functionally identical for this use case with no meaningful difference', 'Not cleanly — MULTI/EXEC queues commands blindly without letting you branch on a value read earlier in the same transaction (you cannot read the counter, decide whether to decrement, all within one MULTI block), whereas a Lua script can read the current count, evaluate a conditional, and only then decide whether to write, all atomically', 'MULTI/EXEC is strictly faster than Lua scripts for this exact use case', 'Redis rate limiting requires neither Lua nor MULTI/EXEC, since single commands are always atomic enough'], answer: 1,
      explanation: 'MULTI/EXEC guarantees the QUEUED commands execute as an atomic batch, but it cannot make a decision mid-transaction based on a value read earlier in that same transaction — commands are queued blindly before any of them run, so you cannot say "read the count, and only decrement it if under the limit" within a single MULTI block. A Lua script runs as ordinary sequential code with full conditional logic (if current_count < limit then ... end) while still executing atomically relative to other Redis clients, which is exactly the capability rate limiting needs and MULTI/EXEC structurally cannot provide.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I rate limit across a Redis Cluster?',
      a: 'In Redis Cluster, all keys for a rate limiter must hash to the same slot. Use hash tags in your key: `rl:{user:42}:window` — Redis Cluster uses only the content inside `{}` for slot assignment. This ensures all keys for a user are on the same node, making Lua scripts safe. Without hash tags, a Lua script accessing keys on different slots returns a CROSSSLOT error.',
    },
    {
      q: 'What is the difference between fixed window and sliding window rate limiting?',
      a: '<strong>Fixed window</strong>: count resets at fixed intervals (e.g., every minute boundary). Simple but allows burst at window edges (2x rate for a short period). <strong>Sliding window</strong>: uses current time minus window to count requests — more accurate, no edge burst. Redis sorted set implementation: store timestamps as members, ZREMRANGEBYSCORE to trim old entries.',
    },
    {
      q: 'How do you implement rate limiting without race conditions in Redis?',
      a: 'Use a Lua script for atomic check-and-increment: (1) GET counter, (2) if >= limit return 0, (3) INCR counter, (4) EXPIRE on first increment. This is atomic — no other client can interleave. Alternatively: <code>SET key 1 NX EX window</code> + <code>INCR</code> on existence. The Lua approach is more robust.',
    },
    {
      q: 'How do you implement per-user rate limiting in Redis?',
      a: 'Key pattern: <code>ratelimit:endpoint:userId</code>. On each request: INCR the key, set EXPIRE on first increment (or use SET EX NX). Check if count > limit. Use different limits per tier: <code>ratelimit:api:userId:tier</code>. Sliding window variant: ZADD <code>ratelimit:userId</code> timestamp timestamp; ZREMRANGEBYSCORE to trim; ZCARD to count.',
    },
    {
      q: 'What is a leaky bucket rate limiter and how does it differ from token bucket?',
      a: '<strong>Leaky bucket</strong>: requests enter a queue, processed at fixed rate — smooths bursts, excess dropped. <strong>Token bucket</strong>: tokens accumulate at rate R up to capacity B; requests consume tokens; allows bursts up to B. Token bucket is more common in APIs. Implement token bucket in Redis with Lua: store tokens + last refill timestamp, calculate tokens added since last call.',
    },
    {
      q: 'How do you handle distributed rate limiting across multiple app servers?',
      a: 'All app servers share a single Redis instance — rate limiting is naturally distributed. Each server atomically INCRs the same key. For multi-region, use a Redis Cluster or replicated setup. Watch for Redis latency adding to API response time — use pipeline or Lua for efficiency. Consider circuit breakers: if Redis is unavailable, fail open (no rate limit) or fail closed (reject all).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Fixed window is O(1) but allows boundary bursts; sliding log is accurate but memory-heavy; token bucket allows controlled bursting — always implement atomically via Lua.',
    mustKnow: [
      'Fixed window: INCR + EXPIRE — simple, O(1), but 2× burst at boundary',
      'Sliding log: ZADD + ZREMRANGEBYSCORE + ZCARD — accurate, more memory',
      'Token bucket: refill × elapsed → deduct atomically via Lua — allows bursting',
      'Always set EXPIRE only on count === 1 to avoid resetting the window',
      'Return X-RateLimit-Remaining and Retry-After headers to clients',
      'Redis Cluster: use hash tags `{user:id}` to ensure keys co-locate on one slot',
    ],
    interviewFocus: [
      'Compare fixed window vs sliding window rate limiting',
      'Why does token bucket need atomic execution?',
      'What is the boundary burst problem in fixed windows?',
      'How do you implement rate limiting in Redis Cluster?',
    ],
  };
}
