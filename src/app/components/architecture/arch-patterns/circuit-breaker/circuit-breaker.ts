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

@Component({
  selector: 'app-arch-circuit-breaker',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './circuit-breaker.html',
  styleUrl: './circuit-breaker.scss',
})
export class ArchCircuitBreaker {

  quickRef: QuickRefItem[] = [
    { name: 'Closed State', type: 'keyword', desc: 'Normal operation — calls pass through; failures counted' },
    { name: 'Open State', type: 'keyword', desc: 'Failure threshold exceeded — all calls fail fast without hitting the downstream' },
    { name: 'Half-Open State', type: 'keyword', desc: 'Trial period — limited calls allowed; success → Closed, failure → Open again' },
    { name: 'Failure Threshold', type: 'keyword', desc: 'Number or % of failures that trips the circuit from Closed to Open' },
    { name: 'Cooldown Period', type: 'keyword', desc: 'Time the circuit stays Open before allowing trial calls in Half-Open' },
    { name: 'Fallback', type: 'keyword', desc: 'Alternative response returned when circuit is Open (cached data, default, graceful degradation)' },
    { name: 'Polly', type: 'keyword', desc: '.NET resilience library with CircuitBreaker, Retry, Timeout, Bulkhead strategies' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Problem: Cascade Failures',
      points: [
        'In a microservices system, Service A calls Service B. If B is slow, A\'s threads pile up waiting, exhausting its thread pool.',
        'A then fails to respond to its callers — cascade failure spreads upstream until the whole system is down.',
        'The circuit breaker pattern stops the cascade: once B is clearly failing, A fails fast immediately instead of waiting.',
        'Fast failure frees threads immediately and gives B time to recover without being hammered by retries.',
      ],
    },
    {
      heading: 'The Three States',
      points: [
        'Closed: calls flow normally. Every failure increments a counter. When the counter exceeds the threshold, the circuit trips to Open.',
        'Open: all calls fail immediately with a CircuitBreakerOpenException — no network call is made. A timer starts.',
        'Half-Open: after the cooldown timer expires, a limited number of trial calls are allowed through. If they succeed, circuit resets to Closed. If they fail, circuit returns to Open.',
        'The state machine is the key insight: it gives the downstream service a recovery window.',
      ],
    },
    {
      heading: 'Fallbacks and Degraded Modes',
      points: [
        'When the circuit is Open, the caller should have a fallback: return cached data, a default response, or a partial result.',
        'Graceful degradation: the system continues to work at reduced capacity rather than failing completely.',
        'Example: product recommendations are unavailable → show "You may also like" from a cached list instead of erroring.',
        'Combine circuit breaker with retry: retry on transient errors (429, 503), but do not retry when the circuit is Open.',
      ],
    },
    {
      heading: 'The Three Circuit Breaker States and Their Transitions',
      points: [
        'In the CLOSED state, requests pass through normally to the downstream service while the circuit breaker monitors the failure rate — this is the default, healthy operating state where the breaker is essentially transparent.',
        'When failures exceed a configured threshold, the breaker transitions to OPEN, immediately failing all requests without even attempting to call the downstream service — this fast-fail behavior prevents piling up requests against an already-struggling service, which would make its recovery harder.',
        'After a configured timeout, the breaker transitions to HALF-OPEN, allowing a small number of test requests through — if they succeed, the breaker closes again (resuming normal traffic); if they fail, it reopens, extending the timeout before trying again.',
        'Tuning the failure threshold and timeout duration requires understanding the downstream service\'s actual failure and recovery characteristics — too sensitive a threshold trips the breaker on normal transient blips, while too lenient a threshold delays protection during a genuine outage.',
      ],
    },
    {
      heading: 'Circuit Breakers vs. Retries — Complementary, Not Competing',
      points: [
        'Retries and circuit breakers solve related but distinct problems — retries handle transient, isolated failures by trying again, while circuit breakers protect against SUSTAINED failure by stopping requests entirely once a failure pattern is detected, preventing retries from making an ongoing outage worse.',
        'Combining them without care creates a dangerous interaction — aggressive retries against a struggling service can themselves overwhelm it further, delaying the circuit breaker\'s ability to detect the sustained failure pattern and open, worsening the very problem retries were meant to mitigate.',
        'A well-designed resilience strategy applies the circuit breaker at the OUTER boundary of a call (wrapping the entire retry logic), so retries operate normally during transient issues, but once the circuit breaker detects sustained failure, retries are also short-circuited along with everything else.',
        'Fallback behavior (returning cached or default data when the circuit is open) is what makes a circuit breaker\'s fast-fail behavior actually useful to end users — an open circuit that simply returns an error to the user provides resilience for the SYSTEM but not necessarily a good experience for the user, unless paired with a graceful fallback.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Manual Circuit Breaker',
      language: 'typescript',
      code: `type CircuitState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly cooldownMs: number = 30_000,
    private readonly halfOpenMaxCalls: number = 3,
  ) {}

  async call<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'half-open';
      } else {
        if (fallback) return fallback();
        throw new Error('Circuit breaker is OPEN');
      }
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
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      console.warn(\`Circuit OPEN after \${this.failureCount} failures\`);
    }
  }
}

// Usage
const cb = new CircuitBreaker(5, 30_000);
const price = await cb.call(
  () => catalogService.getPrice(productId),
  () => 0, // fallback: free if service unavailable
);`
    },
    {
      label: 'Polly (.NET)',
      language: 'typescript',
      code: `// .NET — Polly ResiliencePipeline with CircuitBreaker + Retry
// Program.cs

services.AddHttpClient<ICatalogClient, CatalogClient>()
  .AddResilienceHandler("catalog-pipeline", builder =>
  {
    // 1. Retry: 3 attempts, exponential backoff (not on circuit open)
    builder.AddRetry(new HttpRetryStrategyOptions
    {
      MaxRetryAttempts = 3,
      BackoffType = DelayBackoffType.Exponential,
      Delay = TimeSpan.FromMilliseconds(200),
      ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
        .Handle<HttpRequestException>()
        .HandleResult(r => (int)r.StatusCode >= 500),
    });

    // 2. Circuit Breaker: open after 5 failures in 30s window
    builder.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
    {
      FailureRatio = 0.5,              // 50% failure rate trips circuit
      MinimumThroughput = 10,          // needs at least 10 calls to evaluate
      SamplingDuration = TimeSpan.FromSeconds(30),
      BreakDuration = TimeSpan.FromSeconds(30),
      OnOpened = args => { Console.WriteLine("Circuit OPEN"); return ValueTask.CompletedTask; },
      OnClosed = args => { Console.WriteLine("Circuit CLOSED"); return ValueTask.CompletedTask; },
    });

    // 3. Timeout per attempt
    builder.AddTimeout(TimeSpan.FromSeconds(3));
  });`
    },
    {
      label: 'Fallback Pattern',
      language: 'typescript',
      code: `// Graceful degradation with cached fallback
class ProductService {
  private cache = new Map<string, { price: number; cachedAt: number }>();
  private breaker = new CircuitBreaker(5, 30_000);

  async getPrice(productId: string): Promise<number> {
    try {
      const price = await this.breaker.call(() =>
        this.catalogClient.getPrice(productId)
      );
      // Cache successful response
      this.cache.set(productId, { price, cachedAt: Date.now() });
      return price;
    } catch {
      // Circuit open or call failed — use cached value
      const cached = this.cache.get(productId);
      if (cached && Date.now() - cached.cachedAt < 300_000) { // 5min cache
        console.warn(\`Using cached price for \${productId}\`);
        return cached.price;
      }
      // No cache available — degrade gracefully
      console.error(\`Cannot fetch price for \${productId}, using 0\`);
      return 0;
    }
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Retrying when the circuit is open',
      wrong: `// Retry 3 times immediately when circuit is open — hammers dead service`,
      right: `// Retry handles transient errors; circuit breaker handles sustained failures — use both but configure retry to NOT fire when circuit is open`,
      explanation: 'Retrying against an open circuit re-hammers the already-failing service, worsening its recovery time. Polly\'s pipeline applies retry before circuit check.',
    },
    {
      title: 'No fallback when circuit opens',
      wrong: `throw new Error('Circuit open'); // caller gets 500 error`,
      right: `return fallback(); // cached data, default value, partial response`,
      explanation: 'An open circuit should trigger graceful degradation, not a hard error to the end user. Always define what the system should return when the circuit trips.',
    },
    {
      title: 'Sharing one circuit breaker instance across all services',
      wrong: `const globalCb = new CircuitBreaker(); // used for orders, catalog, payment`,
      right: `const orderCb = new CircuitBreaker(); const catalogCb = new CircuitBreaker();`,
      explanation: 'A shared circuit breaker means one failing service opens the circuit for all calls. Each downstream dependency needs its own circuit breaker instance.',
    },
    {
      title: 'Setting failure threshold too low',
      wrong: `new CircuitBreaker(failureThreshold: 1) // trips on first error`,
      right: `new CircuitBreaker(failureThreshold: 5, minThroughput: 10) // needs pattern of failures`,
      explanation: 'A threshold of 1 trips the circuit on transient errors (network blip, slow GC). Require a meaningful failure count or ratio over a sampling window.',
    },
  ];

  challenge: Challenge = {
    title: 'Add Half-Open State to a Circuit Breaker',
    language: 'typescript',
    description: `Extend the basic circuit breaker class to support the Half-Open state:
- After the cooldown expires, allow up to 3 trial calls.
- If all 3 succeed → reset to Closed.
- If any trial call fails → return to Open and restart cooldown.`,
    hints: [
      'Track halfOpenCallCount and halfOpenSuccessCount separately',
      'In half-open: allow call, increment counts on success/failure',
      'On 3 successes: reset state to closed, reset all counters',
      'On any failure in half-open: reset to open, restart cooldown timer',
    ],
    starterCode: `class CircuitBreaker {
  state: 'closed' | 'open' | 'half-open' = 'closed';
  failureCount = 0;
  lastFailureTime = 0;
  readonly threshold = 3;
  readonly cooldownMs = 5000;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    // TODO: implement half-open logic
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.cooldownMs) {
        throw new Error('Circuit OPEN');
      }
      this.state = 'half-open';
    }
    try {
      const result = await fn();
      // TODO: handle half-open success
      this.failureCount = 0; this.state = 'closed';
      return result;
    } catch (e) {
      this.failureCount++; this.lastFailureTime = Date.now();
      if (this.failureCount >= this.threshold) this.state = 'open';
      throw e;
    }
  }
}`,
    solution: `class CircuitBreaker {
  state: 'closed' | 'open' | 'half-open' = 'closed';
  failureCount = 0;
  lastFailureTime = 0;
  halfOpenTrials = 0;
  halfOpenSuccesses = 0;
  readonly threshold = 3;
  readonly cooldownMs = 5000;
  readonly halfOpenMax = 3;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.cooldownMs) {
        throw new Error('Circuit OPEN — fail fast');
      }
      this.state = 'half-open';
      this.halfOpenTrials = 0;
      this.halfOpenSuccesses = 0;
    }

    if (this.state === 'half-open' && this.halfOpenTrials >= this.halfOpenMax) {
      throw new Error('Half-open trial limit reached');
    }

    if (this.state === 'half-open') this.halfOpenTrials++;

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.halfOpenSuccesses++;
        if (this.halfOpenSuccesses >= this.halfOpenMax) {
          this.state = 'closed'; this.failureCount = 0;
          console.log('Circuit CLOSED after half-open recovery');
        }
      } else {
        this.failureCount = 0;
      }
      return result;
    } catch (e) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      this.state = 'open'; // half-open failure → back to open
      throw e;
    }
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of the Half-Open state?',
      options: [
        'To fail all calls permanently',
        'To allow a limited number of trial calls to test if the downstream has recovered',
        'To cache responses for offline use',
        'To increase retry attempts',
      ],
      answer: 1,
      explanation: 'Half-Open lets a few trial calls through after the cooldown period. Success → circuit closes; failure → circuit reopens with a new cooldown.',
    },
    {
      q: 'What prevents cascade failures when using a circuit breaker?',
      options: [
        'Retrying faster',
        'Failing fast when the circuit is Open — no network call is made',
        'Using synchronous communication only',
        'Sharing one DB connection',
      ],
      answer: 1,
      explanation: 'Fast failure in the Open state frees threads immediately, preventing resource exhaustion from waiting on a dead downstream service.',
    },
    {
      q: 'Should one circuit breaker instance protect all downstream dependencies?',
      options: [
        'Yes — simpler to manage',
        'No — each downstream dependency needs its own circuit breaker',
        'Only if they share the same database',
        'Only in production, not development',
      ],
      answer: 1,
      explanation: 'Sharing one breaker means one failing service trips the circuit for ALL calls. Isolate each dependency with its own breaker.',
    },
    { q: 'What are the three states of a circuit breaker?', options: ['Active, Inactive, Testing', 'Closed, Open, Half-Open', 'Connected, Disconnected, Reconnecting', 'Healthy, Unhealthy, Recovering'], answer: 1, explanation: 'Closed: normal operation; requests pass through. Failures are counted. When the failure rate exceeds the threshold, the circuit transitions to Open. Open: requests are immediately rejected without attempting to call the downstream service, returning a fallback or error instantly. After a timeout period, the circuit transitions to Half-Open. Half-Open: one or a small number of test requests are allowed through to probe if the downstream service has recovered. If the test request succeeds, the circuit closes and normal operation resumes. If it fails, the circuit returns to Open for another timeout period.' },
    { q: 'What is the difference between a circuit breaker and a retry mechanism?', options: ['They are alternatives; use one or the other but never both', 'Retries attempt the same failed call multiple times; a circuit breaker stops all calls after a failure threshold and fails fast without retrying', 'A circuit breaker handles timeouts; retries handle network errors', 'Retries are server-side; circuit breakers are client-side patterns'], answer: 1, explanation: 'Retries help with transient, short-duration failures by re-attempting the request. They are appropriate when the downstream is momentarily overloaded or a request was dropped by network issues. But if the downstream is down for minutes, retries exacerbate the problem: each failed service call occupies a thread until it times out. A circuit breaker stops calling a service that is likely down, failing fast and freeing threads immediately. Use both together: retry a few times with backoff, and if failures persist past a threshold, open the circuit and stop retrying entirely.' },
    { q: 'What happens when a circuit breaker is in the Open state and a request comes in?', options: ['The circuit breaker queues the request until the service recovers', 'The circuit breaker immediately returns an error or fallback response without forwarding the request to the downstream service', 'The circuit breaker sends the request at a reduced rate to avoid overwhelming the downstream', 'The circuit breaker logs the request and retries it automatically after the timeout'], answer: 1, explanation: 'In the Open state, the circuit breaker fails fast: it immediately returns without making any network call. This protects threads from waiting for a timeout on a service that is known to be unavailable. The response can be an error (503), a cached result, a default value, or the output of a fallback function. The fast rejection allows the calling service to remain responsive even when a dependency is down, rather than having all threads blocked waiting for timeouts.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does a circuit breaker differ from a retry?',
      a: 'Retry handles transient failures (single failed request) by trying again immediately. Circuit breaker handles sustained failures (service is down) by stopping all calls for a cooldown period. Use both: retry for blips, circuit breaker to stop hammering a dead service.',
    },
    {
      q: 'What is the Bulkhead pattern and how does it complement circuit breakers?',
      a: 'Bulkhead limits the number of concurrent calls to a downstream service (thread pool or semaphore isolation). Circuit breaker stops calls when the failure rate is high. Together: bulkhead prevents resource exhaustion; circuit breaker stops cascade failures.',
    },
    {
      q: 'Does Kubernetes liveness probe replace a circuit breaker?',
      a: 'No. Kubernetes liveness/readiness probes remove unhealthy pods from the Service endpoint pool. Circuit breakers protect the caller — if the downstream is degraded (slow, error-prone) but not completely dead, Kubernetes won\'t remove it but the circuit breaker will stop your service from being dragged down.',
    },
    { q: 'How do you configure circuit breaker thresholds appropriately?', a: 'Key configuration parameters: failure rate threshold (percentage of requests that must fail to open the circuit, e.g., 50%). Minimum number of calls in the window before the rate threshold applies (prevents opening on a single failure during low traffic). Sliding window type and size: count-based (last N requests) or time-based (last N seconds). Open state timeout before transitioning to Half-Open. Number of test calls in Half-Open state before closing. Set thresholds based on observed error rates under normal conditions: if the service normally has 0.1% errors, a 50% threshold is appropriate. A threshold too sensitive trips the circuit on normal noise; too insensitive fails to protect against genuine outages.' },
    { q: 'How do you implement fallback behavior when a circuit breaker is open?', a: 'Fallback strategies: return cached data from the last successful response if the data can be slightly stale. Return a degraded response with less detail. Return a default or placeholder response that the UI can render gracefully. Queue the request to be processed when the service recovers (only for non-time-sensitive operations). Throw a specific exception that the caller handles to show a user-friendly error message. The right fallback depends on the use case: a product recommendation fallback may return popular items; a payment service fallback must fail explicitly because returning a default value would be wrong. Design the fallback when designing the circuit breaker, not as an afterthought.' },
    { q: 'What metrics should you monitor for circuit breakers in production?', a: 'Key circuit breaker metrics: state transitions (Closed to Open events indicate service degradation; frequent transitions indicate instability). Failure rate per circuit: shows which dependencies are most problematic. Successful fallback rate: high fallback rate means the circuit is protecting the system but users are getting degraded responses. Half-Open probe success rate: indicates recovery trajectory of the downstream service. Rejected request count in Open state: quantifies how many requests were spared the timeout. Export these metrics to your APM platform (Datadog, Prometheus) and set alerts on circuit breaker Open state, which indicates an active incident in a downstream dependency.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The circuit breaker stops cascade failures by failing fast when a downstream service is unhealthy, then probing recovery in Half-Open state.',
    mustKnow: [
      'Three states: Closed (normal) → Open (fail fast) → Half-Open (trial calls)',
      'Open state: all calls fail immediately — no network call; threads freed instantly',
      'Half-Open: N trial calls; success → Closed; failure → back to Open',
      'Each downstream dependency gets its own circuit breaker instance',
      'Always define a fallback for when the circuit is Open',
    ],
    interviewFocus: [
      'Explain the three circuit breaker states with transitions',
      'How does a circuit breaker prevent cascade failures?',
      'How does it differ from a retry policy?',
    ],
  };
}
