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
  { name: 'Circuit breaker',  type: 'keyword', desc: 'Stops calling a failing service after N failures. States: Closed → Open → Half-Open.' },
  { name: 'Bulkhead',        type: 'keyword', desc: 'Isolate thread/connection pools per downstream — one failure cannot exhaust all resources.' },
  { name: 'Timeout',         type: 'keyword', desc: 'Abandon a request after N ms — prevents threads from blocking indefinitely on slow deps.' },
  { name: 'Retry + jitter',  type: 'keyword', desc: 'Exponential back-off + random jitter prevents thundering herd on retry storms.' },
  { name: 'Rate limiting',   type: 'keyword', desc: 'Token bucket / sliding window — protect services from bursts. Shed load early.' },
  { name: 'Fallback',        type: 'keyword', desc: 'Serve cached/default response when downstream is unavailable. Degrade gracefully.' },
  { name: 'Chaos engineering',type: 'keyword', desc: 'Intentionally inject failures in production to find weaknesses before they matter.' },
  { name: 'Bulkhead pattern',type: 'keyword', desc: 'Separate connection pools/threads per tenant or service — isolate blast radius.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Circuit breaker pattern',
    points: [
      'Closed state: requests flow normally; failure count tracked.',
      'Open state: after N failures in a window, all calls fail fast (no network call made).',
      'Half-Open state: after a reset timeout, one probe request is let through; success → Closed; failure → Open.',
      'Prevents cascading failures: if Payment Service is down, Circuit Breaker stops Order Service from waiting and queuing threads.',
      'Libraries: Resilience4j (Java), Polly (.NET), opossum (Node.js), Hystrix (deprecated).',
    ],
  },
  {
    heading: 'Bulkhead pattern',
    points: [
      'Named after ship bulkheads — watertight compartments prevent one breach from sinking the ship.',
      'Thread pool bulkhead: allocate separate thread pools per downstream service. Pool A exhaustion does not affect Pool B.',
      'Connection pool bulkhead: separate DB connection pools per service or tenant.',
      'Semaphore bulkhead: limit concurrent calls per downstream. Simpler than threads but blocks the calling thread.',
    ],
  },
  {
    heading: 'Timeouts and retries',
    points: [
      'Always set timeouts. Default HTTP client timeouts are often 30-60s — too long under load.',
      'Exponential backoff: wait 1s, 2s, 4s, 8s between retries. Cap at max (32s).',
      'Jitter: add random delay to stagger retries from multiple clients: wait = base × 2^attempt + rand(0, 1000ms).',
      'Only retry idempotent operations (GET, PUT with idempotency key). Never blindly retry POST.',
    ],
  },
  {
    heading: 'Load shedding and rate limiting',
    points: [
      'Token bucket: refill N tokens/sec; each request consumes 1 token. Burst handled up to bucket size.',
      'Sliding window: count requests in last N seconds per key (IP, user, API key).',
      'Load shedding: when queue depth exceeds threshold, reject new requests with 429. Better to shed 10% of load than serve 0% for everyone.',
      'Priority queues: shed background jobs first; protect critical user-facing paths.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Circuit Breaker',
    language: 'typescript',
    code: `// Circuit breaker implementation (minimal)
type CBState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: CBState = 'closed';
  private failures = 0;
  private nextAttempt = 0;

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 10_000   // 10s open period
  ) {}

  async call<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        if (fallback) return fallback();
        throw new Error('Circuit open — service unavailable');
      }
      this.state = 'half-open';  // probe attempt
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback) return fallback();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold || this.state === 'half-open') {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage:
const cb = new CircuitBreaker(5, 10_000);
const price = await cb.call(
  () => pricingService.getPrice(productId),
  () => cachedPrice ?? defaultPrice         // fallback
);`,
  },
  {
    label: 'Retry with Jitter',
    language: 'typescript',
    code: `// Exponential backoff + full jitter
async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseMs = 100, maxMs = 5000 } = {}
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      if (attempt === maxAttempts - 1) break;

      // Exponential back-off with full jitter
      const cap = Math.min(maxMs, baseMs * Math.pow(2, attempt));
      const delay = Math.random() * cap;  // uniform random between 0 and cap

      console.warn(\`Attempt \${attempt + 1} failed; retrying in \${delay.toFixed(0)}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

// Usage:
const order = await withRetry(
  () => orderService.create(cart),
  { maxAttempts: 3, baseMs: 200 }
);

// Only retry idempotent operations:
// Safe to retry: GET, PUT (with idempotency key), DELETE
// Unsafe to retry: POST without idempotency key (creates duplicates)`,
  },
  {
    label: 'Token Bucket Rate Limiter',
    language: 'typescript',
    code: `// Token bucket rate limiter using Redis
// 100 requests/second per API key, burst up to 200

class TokenBucketLimiter {
  constructor(
    private redis: RedisClient,
    private readonly ratePerSec: number = 100,
    private readonly burst: number = 200
  ) {}

  async isAllowed(key: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const bucketKey = \`tb:\${key}\`;

    // Lua script for atomic token refill + consume
    const script = \`
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local rate = tonumber(ARGV[2])
      local burst = tonumber(ARGV[3])

      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or burst
      local last_refill = tonumber(bucket[2]) or now

      -- Refill tokens based on elapsed time
      local elapsed = (now - last_refill) / 1000
      tokens = math.min(burst, tokens + elapsed * rate)

      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', key, 60)
        return {1, math.floor(tokens)}
      else
        return {0, 0}
      end
    \`;

    const [allowed, remaining] = await this.redis.eval(script, 1, bucketKey,
      String(now), String(this.ratePerSec), String(this.burst)) as [number, number];

    return { allowed: allowed === 1, remaining };
  }
}

// Middleware:
app.use(async (req, res, next) => {
  const { allowed, remaining } = await limiter.isAllowed(req.headers['x-api-key'] as string);
  res.setHeader('X-RateLimit-Remaining', remaining);
  if (!allowed) return res.status(429).json({ error: 'Rate limit exceeded' });
  next();
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Retrying non-idempotent operations',
    wrong: `// POST /payments — creates a new charge
await withRetry(() => paymentService.charge(amount));
// Retry creates 2nd charge — customer double-billed`,
    right: `// Add idempotency key to make POST safe to retry:
const idempotencyKey = generateUUID();
await withRetry(() =>
  paymentService.charge(amount, { idempotencyKey })
);
// Server deduplicates by idempotencyKey — safe to retry`,
    explanation: 'Retrying a non-idempotent POST can create duplicates (double charges, duplicate orders). Always attach an idempotency key to write operations before adding retry logic.',
  },
  {
    title: 'No jitter on retries (thundering herd)',
    wrong: `// 1000 clients all fail at the same time
// All retry after exactly 1s, 2s, 4s
// Server gets 1000 simultaneous retries at each interval`,
    right: `// Add random jitter: delay = rand(0, min(cap, base * 2^attempt))
// 1000 clients spread retries across the window
// Server sees ~10 req/100ms instead of 1000 req/moment`,
    explanation: 'Without jitter, all retrying clients hit the server simultaneously — the retry storm is as bad as the original spike. Jitter spreads retries randomly, reducing peak load by 10-100×.',
  },
  {
    title: 'Sharing connection pools across all services',
    wrong: `// Single DB pool shared by all operations
// Slow analytics query holds 10 connections
// User-facing API cannot get a connection → times out`,
    right: `// Separate pools per operation type (bulkhead):
const userApiPool = new Pool({ max: 20 });       // user-facing
const analyticsPool = new Pool({ max: 5 });      // analytics
const backgroundPool = new Pool({ max: 10 });    // background jobs`,
    explanation: 'Without bulkheads, a single pool of 30 connections is shared across all operations. A slow batch job holding 25 connections starves user-facing requests. Separate pools isolate blast radius.',
  },
  {
    title: 'Circuit breaker with too-high threshold',
    wrong: `// Circuit opens after 100 failures
// Service times out for 30s each → 100 × 30s = 50 min of blocked threads
// System is dead long before circuit opens`,
    right: `// Open circuit quickly on high error rate:
// threshold: 5 failures in 10s window
// Or: error rate > 50% over last 20 requests
// Fail fast → free threads → system can recover`,
    explanation: 'A circuit breaker that opens too late allows cascading failures to develop. Set the threshold to open quickly on a sustained error rate (5 failures, or 50% error rate over 10s window).',
  },
];

const challenge: Challenge = {
  title: 'Add fault tolerance to a fragile payment flow',
  language: 'typescript',
  description: `This payment service has no fault tolerance:

async function processPayment(orderId: string, amount: number): Promise<Receipt> {
  const fraud = await fraudService.check(orderId);   // external API, p99=800ms
  const payment = await stripe.charge(amount);        // external, p99=2000ms
  const receipt = await receiptService.send(orderId); // internal, p99=100ms
  return receipt;
}

Problems:
1. fraudService can be slow/unavailable — blocks payment
2. stripe.charge times out with no retry
3. receiptService failure fails the whole payment
4. No rate limiting — bot traffic overwhelms

Add: timeout, circuit breaker, retry, graceful degradation, rate limiting`,
  hints: [
    'fraudService: circuit breaker + fallback (allow with flag if service is down)',
    'stripe.charge: timeout 5s + retry with idempotency key (max 2 retries)',
    'receiptService: fire-and-forget — payment success even if receipt fails',
    'Rate limiter: 10 payments/min per user',
  ],
  starterCode: `async function processPayment(orderId: string, amount: number): Promise<Receipt> {
  const fraud = await fraudService.check(orderId);
  const payment = await stripe.charge(amount);
  const receipt = await receiptService.send(orderId);
  return receipt;
}`,
  solution: `const fraudCB = new CircuitBreaker(5, 30_000);
const rateLimiter = new TokenBucketLimiter(redis, 10, 20); // 10/min per user

async function processPayment(
  orderId: string,
  amount: number,
  userId: string
): Promise<Receipt> {
  // 1. Rate limit
  const { allowed } = await rateLimiter.isAllowed(userId);
  if (!allowed) throw new Error('Rate limit exceeded');

  // 2. Fraud check — circuit breaker + fallback (allow on service outage)
  const fraudResult = await fraudCB.call(
    () => withTimeout(fraudService.check(orderId), 1000),  // 1s timeout
    () => ({ allowed: true, risk: 'unknown' })              // fallback
  );
  if (!fraudResult.allowed) throw new Error('Fraud check failed');

  // 3. Stripe charge — retry with idempotency key
  const idempotencyKey = \`charge-\${orderId}\`;
  const payment = await withRetry(
    () => withTimeout(stripe.charge(amount, { idempotencyKey }), 5000),
    { maxAttempts: 2, baseMs: 500 }  // only 2 attempts — charges are expensive
  );

  // 4. Receipt — fire-and-forget (degrade gracefully)
  receiptService.send(orderId, payment.id)
    .catch(err => logger.error('Receipt failed — will retry via queue', err));

  return { orderId, paymentId: payment.id, status: 'success' };
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A circuit breaker in "Open" state does what?',
    options: [
      'Passes all requests normally',
      'Fails all requests immediately without calling downstream',
      'Queues requests until downstream recovers',
      'Retries requests automatically',
    ],
    answer: 1,
    explanation: 'In Open state, the circuit breaker fails fast — it does NOT make a network call. This prevents thread exhaustion from waiting on a known-failed service, allowing the system to remain responsive.',
  },
  {
    q: 'Why add random jitter to retry back-off delays?',
    options: [
      'To make retry timing unpredictable to attackers',
      'To avoid a retry storm where all clients hit the server simultaneously',
      'To increase the total number of retries',
      'To comply with HTTP standards',
    ],
    answer: 1,
    explanation: 'Without jitter, all clients that failed at the same time retry at the same intervals — creating a new spike at each retry round. Jitter spreads them randomly, reducing peak load by 10-100×.',
  },
  {
    q: 'The bulkhead pattern protects against?',
    options: [
      'SQL injection attacks',
      'One slow dependency exhausting shared resources (threads/connections) and taking down the entire system',
      'Memory leaks in long-running processes',
      'Network packet loss',
    ],
    answer: 1,
    explanation: 'The bulkhead isolates resource pools per downstream service. If Service A is slow and exhausts its pool of 10 threads, Service B still has its own pool of 20 threads and continues serving requests.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use a circuit breaker vs a retry?',
    a: 'Use both together — they complement each other. Retry handles transient failures (network glitch, brief overload). Circuit breaker handles sustained failures (service is down, database is unreachable). The circuit prevents retries from hammering a failed service: after 5 failures, the circuit opens and retries stop. On the half-open probe, a single retry tests recovery.',
  },
  {
    q: 'How do I choose a timeout value?',
    a: 'Look at the p99 latency of the downstream in normal conditions (e.g. 200ms). Set timeout at 2-3× that value (e.g. 500ms) to allow for occasional spikes without waiting forever. For user-facing APIs: 1-3s total budget. For internal microservices: 200-500ms. If a dependency is inherently slow (ML inference, batch job), use async patterns rather than a long synchronous timeout.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Circuit breaker fails fast on sustained failures; bulkhead isolates blast radius; retry with jitter prevents storms; timeout prevents thread exhaustion.',
  mustKnow: [
    'Circuit breaker states: Closed (normal) → Open (fail fast) → Half-Open (probe)',
    'Bulkhead: separate thread/connection pools per downstream service',
    'Exponential backoff + full jitter: avoids thundering herd on retries',
    'Only retry idempotent operations — add idempotency key to POST',
    'Token bucket rate limiting: ratePerSec refill, burst capacity',
    'Graceful degradation: serve fallback/cache when dependency is unavailable',
  ],
  interviewFocus: [
    'Explain circuit breaker state machine and when it opens/closes',
    'Why jitter? Walk through a thundering herd scenario without it',
    'Bulkhead: which pools to isolate in a microservices architecture',
    'Combine all patterns: timeout → retry → circuit breaker order',
  ],
};

@Component({
  selector: 'app-sysdesign-fault-tolerance',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fault-tolerance.html',
  styleUrl: './fault-tolerance.scss',
})
export class SysdesignFaultTolerance {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
