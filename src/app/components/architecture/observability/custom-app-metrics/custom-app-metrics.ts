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
  { name: 'Business metric',   type: 'keyword', desc: 'Domain-specific KPI — orders placed, revenue per minute, feature flag activations. Answers "is the business working?" not just "is the server up?"' },
  { name: 'USE method',        type: 'keyword', desc: 'Utilisation, Saturation, Errors — metric framework for resources (CPU, queues, databases). Complements RED for user-facing services.' },
  { name: 'SLI candidate',     type: 'keyword', desc: 'A custom metric that directly measures user experience — candidate for becoming a formal Service Level Indicator.' },
  { name: 'Gauge function',    type: 'keyword', desc: 'Callback-based gauge — registered function called at scrape time to snapshot a current value (e.g., queue depth from Redis).' },
  { name: 'push vs pull',      type: 'keyword', desc: 'Pull: Prometheus scrapes your /metrics endpoint. Push: Pushgateway for short-lived jobs. Prefer pull for long-running services.' },
  { name: 'Label strategy',    type: 'keyword', desc: 'Plan labels before instrumenting — changing labels breaks dashboard queries. Define a team-wide convention and stick to it.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Infrastructure Metrics vs Business Metrics',
    points: [
      'Infrastructure metrics (CPU, memory, network I/O) tell you about system health. They do not tell you if the business is functioning correctly. A service at 10% CPU can still be failing to process orders.',
      'Business metrics answer: "Are users getting value?" — orders placed per minute, checkout conversion rate, payment success rate, feature flag exposure count, search result click-through rate.',
      'During incidents, business metrics are often the first signal. "Orders per minute dropped 40%" fires before any infrastructure metric crosses a threshold.',
      'The ideal metric dashboard combines both: infrastructure metrics for diagnosing causes, business metrics for understanding impact. Impact-first alerting (business metric degradation → page on-call) is more user-centric than threshold-first (CPU > 80% → page).',
    ],
  },
  {
    heading: 'Designing Custom Metrics',
    points: [
      'Start with a question. "How many orders are failing payment?" → `orders_payment_failed_total` (counter). "How full is the order queue?" → `order_queue_depth` (gauge). "How long does checkout take end-to-end?" → `checkout_duration_seconds` (histogram).',
      'Follow the naming convention: `<service>_<subsystem>_<name>_<unit>`. Units are always base units (seconds, bytes, not ms/KB). Counter must end in `_total`.',
      'Add a few targeted labels. Good: `payment_provider` (stripe/paypal), `order_type` (subscription/one-time). Bad: `customer_id`, `order_id` — high cardinality.',
      'Document every custom metric: what it measures, unit, labels, and the PromQL query that turns it into an SLI. Add it to your team\'s metric catalogue.',
    ],
  },
  {
    heading: 'Instrumenting Without Framework Coupling',
    points: [
      'Create a thin metrics abstraction layer in your application. Import the metrics module, not the Prometheus client directly. This lets you swap backends (OTel SDK, Datadog StatsD) without touching business code.',
      'Middleware pattern for HTTP: centralise all HTTP metrics in one middleware class — `method`, `route`, `status_code`. Business logic should not know anything about Prometheus.',
      'Domain event pattern: emit structured domain events (OrderPlaced, PaymentFailed) from business code, and convert them to metrics in an event listener. Keeps business logic clean and makes it easy to add new metrics later.',
      'Gauge functions for external state: use callback-based gauges to snapshot values polled from external systems (Redis queue depth, database connection pool usage) at scrape time. Avoids polling on a fixed interval that misaligns with the scrape interval.',
    ],
  },
  {
    heading: 'The Four Golden Signals',
    points: [
      'Google\'s SRE book defines four golden signals as the minimum essential metrics for any user-facing system: latency (how long requests take), traffic (how much demand the system is receiving), errors (the rate of failed requests), and saturation (how full/constrained the system\'s resources are).',
      'These four signals together give a comprehensive view of service health without requiring exhaustive instrumentation of every internal detail — a service exposing accurate golden signal metrics can be reasonably monitored even before deeper, more granular instrumentation is added.',
      'Latency should always be measured as a distribution (percentiles: p50, p95, p99), never just an average — an average hides the tail latency that a meaningful fraction of real users actually experience, which is usually what matters most for user-perceived performance.',
      'Saturation is often the hardest golden signal to measure well, since it requires knowing a resource\'s actual capacity limit, not just its current usage — a queue depth metric alone means little without also knowing what queue depth indicates the system is genuinely struggling to keep up.',
    ],
  },
  {
    heading: 'Instrumentation Best Practices',
    points: [
      'Instrument at the boundary of your service (incoming requests, outgoing calls to dependencies) first, before instrumenting internal implementation details — boundary metrics answer the most common operational questions (is this service healthy, is a dependency causing problems) with the least instrumentation effort.',
      'Custom application metrics should use consistent naming conventions (a namespace prefix, consistent units suffixed in the name) across a codebase — inconsistent naming makes metrics hard to discover and query correctly, especially as the number of instrumented services grows.',
      'Avoid over-instrumenting — adding a metric for every internal function call or variable creates noise, cardinality problems, and maintenance burden without proportional operational value; instrument what you would actually need to look at during an incident, not everything that is technically measurable.',
      'Metrics libraries (Prometheus client libraries, OpenTelemetry SDKs) handle the underlying aggregation and export machinery — application code should focus on correctly categorizing what to measure (counter, gauge, histogram) rather than reimplementing metric collection primitives from scratch.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Business Metrics',
    language: 'typescript',
    code: `import { Counter, Histogram, Gauge } from 'prom-client';

// ── BUSINESS COUNTERS ─────────────────────────────────────────────
const ordersTotal = new Counter({
  name: 'orders_placed_total',
  help: 'Total number of orders placed',
  labelNames: ['order_type', 'channel'], // subscription|one-time, web|mobile|api
});

const paymentResults = new Counter({
  name: 'orders_payment_total',
  help: 'Payment outcomes',
  labelNames: ['provider', 'result'], // stripe|paypal, success|declined|error
});

// ── BUSINESS HISTOGRAMS ───────────────────────────────────────────
const checkoutDuration = new Histogram({
  name: 'checkout_duration_seconds',
  help: 'End-to-end checkout duration from cart to confirmation',
  labelNames: ['channel'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10], // checkout SLO: p99 < 2s
});

// ── BUSINESS GAUGES ───────────────────────────────────────────────
const pendingOrdersGauge = new Gauge({
  name: 'orders_pending',
  help: 'Orders awaiting payment confirmation',
  labelNames: ['payment_provider'],
  // Callback gauge: called at every Prometheus scrape
  collect() {
    // poll Redis/DB at scrape time, not on a fixed interval
    this.reset();
    // MUST return the promise -- prom-client only awaits collect() if it
    // gets a Promise back. Without the return, the scrape serializes the
    // just-reset (empty) gauge before this .then() ever runs.
    return getPendingOrders().then(orders => {
      for (const [provider, count] of Object.entries(orders)) {
        this.labels(provider).set(count);
      }
    });
  },
});

// ── USAGE IN BUSINESS CODE ────────────────────────────────────────
async function placeOrder(cart: Cart, user: User): Promise<Order> {
  const end = checkoutDuration.startTimer({ channel: user.channel });
  try {
    const order = await createOrder(cart, user);
    const payment = await chargePayment(order);

    ordersTotal.inc({ order_type: order.type, channel: user.channel });
    paymentResults.inc({ provider: payment.provider, result: 'success' });

    end(); // record successful checkout duration
    return order;
  } catch (err) {
    if (err instanceof PaymentDeclinedError) {
      paymentResults.inc({ provider: err.provider, result: 'declined' });
    }
    end(); // still record duration even on failure
    throw err;
  }
}`,
  },
  {
    label: 'Metric Abstraction Layer',
    language: 'typescript',
    code: `// metrics/index.ts — thin abstraction; business code imports this, not prom-client
import { Counter, Histogram, Gauge, register } from 'prom-client';

export interface IMetrics {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordDuration(name: string, seconds: number, labels?: Record<string, string>): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
}

class PrometheusMetrics implements IMetrics {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();
  private gauges = new Map<string, Gauge>();

  private getOrCreateCounter(name: string, labels: Record<string, string>): Counter {
    if (!this.counters.has(name)) {
      // Register the label set from the FIRST call -- a hardcoded
      // labelNames: [] would make every call with labels throw
      // "Added label ... is not included in initial labelset: []".
      this.counters.set(name, new Counter({ name, help: name, labelNames: Object.keys(labels) }));
    }
    return this.counters.get(name)!;
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.getOrCreateCounter(name, labels).inc(labels);
  }

  recordDuration(name: string, seconds: number, labels: Record<string, string> = {}): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Histogram({ name, help: name, labelNames: Object.keys(labels) }));
    }
    this.histograms.get(name)!.observe(labels, seconds);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Gauge({ name, help: name, labelNames: Object.keys(labels) }));
    }
    this.gauges.get(name)!.set(labels, value);
  }
}

export const metrics: IMetrics = new PrometheusMetrics();

// In business code — zero Prometheus knowledge needed:
// metrics.incrementCounter('orders_placed_total', { type: 'subscription' });
// metrics.recordDuration('checkout_duration_seconds', 0.45, { channel: 'web' });`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Only instrumenting HTTP endpoints — missing background job metrics',
    wrong: `// Only HTTP middleware metrics — background jobs are invisible
// Queue processor runs, fails silently — no alert fires
// Jobs pile up, database grows — discovered by users, not monitoring`,
    right: `const jobsProcessed = new Counter({
  name: 'jobs_processed_total',
  labelNames: ['queue', 'result'], // result: success|failed|retried
});
const jobDuration = new Histogram({ name: 'job_duration_seconds', labelNames: ['queue'] });

async function processJob(job: Job) {
  const end = jobDuration.startTimer({ queue: job.queue });
  try {
    await handleJob(job);
    jobsProcessed.inc({ queue: job.queue, result: 'success' });
  } catch {
    jobsProcessed.inc({ queue: job.queue, result: 'failed' });
  } finally { end(); }
}`,
    explanation: 'HTTP auto-instrumentation only covers user-facing requests. Background jobs, queue workers, cron tasks, and stream processors need explicit instrumentation. A failing background job may never surface as an HTTP error. Instrument every major processing path — not just the HTTP layer.',
  },
  {
    title: 'Recording durations in milliseconds instead of seconds',
    wrong: `// Records 150ms as 150 — Prometheus expects seconds
histogram.observe(Date.now() - startTime); // → 150 instead of 0.15

// PromQL: histogram_quantile(0.99, ...) returns 150 (appears to be 150 seconds!)
// Dashboard shows p99 = 2.5 minutes for a 150ms request`,
    right: `// Always record in seconds — Prometheus convention
const startMs = Date.now();
// ... operation ...
histogram.observe((Date.now() - startMs) / 1000); // → 0.15 seconds

// Or use the built-in timer helper
const end = histogram.startTimer();
// ... operation ...
end(); // automatically records elapsed time in seconds`,
    explanation: 'Prometheus convention is to use base SI units: seconds for time, bytes for size. If you record milliseconds, every PromQL query and dashboard panel will show values 1000× too high. The `startTimer()` helper from prom-client automatically records in seconds — prefer it over manual `Date.now()` arithmetic.',
  },
  {
    title: 'No metric catalogue — nobody knows what metrics exist',
    wrong: `// 30 engineers add metrics independently over 2 years
// 400 metrics with inconsistent names: request_count, http_reqs, req_total
// Nobody knows what labels each metric has
// Duplicate metrics for the same thing
// Dashboards break when metrics are renamed`,
    right: `// metrics/catalogue.ts — single source of truth
export const METRICS = {
  HTTP_REQUESTS:    'http_requests_total',           // labels: method, route, status_code
  CHECKOUT_DURATION:'checkout_duration_seconds',    // labels: channel
  ORDERS_PLACED:    'orders_placed_total',           // labels: order_type, channel
  PAYMENT_RESULT:   'orders_payment_total',          // labels: provider, result
} as const;
// All metric names are constants — typos caught at compile time
// No duplicate metrics — check catalogue before adding new`,
    explanation: 'Without a metric catalogue, teams duplicate metrics, use inconsistent naming, and create breaking changes when renaming. Define all metric names as constants in a central file. Engineers check the catalogue before adding metrics. Dashboards import metric name constants — renaming a metric is a compile-time error, not a silent dashboard breakage.',
  },
  {
    title: 'Alerting only on infrastructure metrics — missing business impact',
    wrong: `# Only CPU/memory/disk alerts
- alert: HighCPU
  expr: cpu_usage > 0.8
  # CPU at 30% but orders failing → no alert fires
  # Users experiencing failures for 20 mins before anyone notices`,
    right: `# Business impact alert — immediate user-visible failure
- alert: OrderFailureRateHigh
  expr: |
    rate(orders_payment_total{result="failed"}[5m])
    / rate(orders_payment_total[5m]) > 0.05
  annotations:
    summary: "5%+ of payments are failing — immediate user impact"`,
    explanation: 'Infrastructure metrics (CPU, memory) reflect system health, not user experience. A service can fail to process orders at 10% CPU. Lead with business metrics for alerting — if the order failure rate exceeds 5%, page on-call immediately, regardless of infrastructure health indicators. Use infrastructure metrics for diagnosis after the alert fires.',
  },
];

const challenge: Challenge = {
  title: 'Build a rate calculator from counters',
  language: 'typescript',
  description: `Implement computeRate(samples: {value: number; timestamp: number}[], windowSeconds: number): number
Given a time series of counter samples (value + Unix timestamp in ms), return the per-second rate over the given window.

Rate = (latest_value - oldest_value_in_window) / window_seconds
Only include samples within the last windowSeconds. Return 0 if fewer than 2 samples in window.`,
  hints: ['Filter samples within the window first', 'Rate = delta / time_delta_seconds'],
  starterCode: `function computeRate(
  samples: { value: number; timestamp: number }[],
  windowSeconds: number
): number {
  return 0;
}

const now = Date.now();
const samples = [
  { value: 100, timestamp: now - 60_000 },
  { value: 130, timestamp: now - 45_000 },
  { value: 160, timestamp: now - 30_000 },
  { value: 200, timestamp: now },
];

console.log(computeRate(samples, 60).toFixed(2)); // ~1.67 req/s (100 events in 60s)`,
  solution: `function computeRate(
  samples: { value: number; timestamp: number }[],
  windowSeconds: number
): number {
  const now = samples[samples.length - 1]?.timestamp ?? Date.now();
  const cutoff = now - windowSeconds * 1000;
  const inWindow = samples.filter(s => s.timestamp >= cutoff);
  if (inWindow.length < 2) return 0;
  const oldest = inWindow[0];
  const latest = inWindow[inWindow.length - 1];
  const delta = latest.value - oldest.value;
  const elapsed = (latest.timestamp - oldest.timestamp) / 1000;
  return elapsed > 0 ? delta / elapsed : 0;
}

const now = Date.now();
const samples = [
  { value: 100, timestamp: now - 60_000 },
  { value: 130, timestamp: now - 45_000 },
  { value: 160, timestamp: now - 30_000 },
  { value: 200, timestamp: now },
];
console.log(computeRate(samples, 60).toFixed(2));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should a callback-based (collect function) gauge be used for queue depth instead of setting the gauge value on every message processed?',
    options: [
      'Callback gauges are more accurate because they use async/await internally',
      'Setting the gauge on every message causes cardinality explosion as message IDs become labels',
      'The callback is called at scrape time, avoiding drift between the gauge value and actual state between scrapes',
      'Prometheus only supports callback gauges for external system metrics',
    ],
    answer: 2,
    explanation: 'If you set the gauge value manually on every event, you must ensure you always update it — including when messages are added AND removed. Missing an update causes drift. A callback gauge calls your collect() function at every Prometheus scrape, providing a fresh snapshot of the current state by polling the source of truth (Redis, database). No drift possible — the value is always current at scrape time.',
  },
  {
    q: 'What is the primary advantage of defining business metrics (orders placed, payment results) alongside infrastructure metrics?',
    options: [
      'Business metrics are cheaper to store than infrastructure metrics in Prometheus',
      'Business metrics directly reflect user impact — a drop in orders-per-minute alerts before any infrastructure threshold is crossed',
      'Business metrics automatically disable infrastructure alerting to reduce noise',
      'Business metrics can only be tracked with custom metrics, not with auto-instrumented libraries',
    ],
    answer: 1,
    explanation: 'Business metrics are early-warning signals for user impact. A payment processing failure may never cross an infrastructure threshold (CPU stays low, error rate on HTTP 400s might look normal) but would immediately show as a drop in orders_placed_total or a spike in orders_payment_total{result="declined"}. Business metrics enable impact-first alerting — "users are failing to pay" fires before "server resources are strained".',
  },
  { q: 'What is the difference between RED metrics and USE metrics?', options: ['RED is for storage systems; USE is for application servers', 'RED (Rate, Errors, Duration) measures service performance from the request perspective; USE (Utilization, Saturation, Errors) measures resource health from the infrastructure perspective', 'USE is deprecated in favor of RED for all metric types', 'RED is for frontend metrics; USE is for backend database metrics'], answer: 1, explanation: 'RED method (Tom Wilkie, for services and APIs): Rate (requests per second), Errors (error rate), Duration (request latency percentiles). Answers: how is the service performing for users right now? USE method (Brendan Gregg, for hardware and resources): Utilization (time a resource is busy), Saturation (how much extra work is queued or pending), Errors (hardware error events). Answers: is a resource limiting the service? Both are complementary. Use RED for alerting on service health. Use USE for diagnosing resource bottlenecks. The four golden signals (Google SRE) combine both: latency and error rate from RED, traffic, and saturation from USE.' },
  { q: 'What is the difference between a Prometheus counter, gauge, and histogram?', options: ['Counter stores the current value; gauge tracks events over time; histogram samples values at intervals', 'Counter is monotonically increasing (total events); gauge represents the current state (can go up or down); histogram tracks the distribution of values across configurable buckets', 'Gauge is the only type that supports aggregation; counters and histograms are computed server-side', 'All three types are equivalent; the distinction is only for documentation purposes'], answer: 1, explanation: 'Counter: monotonically increasing value that only goes up. Total HTTP requests, total errors, total bytes sent. Never resets except on restart. Use rate() in PromQL to get per-second rate. Gauge: current value that can go up or down. Active connections, queue depth, memory usage, temperature. Use directly in PromQL without rate(). Histogram: observes values and places them in configurable buckets. Produces three metrics: _bucket (cumulative count per bucket), _sum (sum of all observations), _count (total observations). Use histogram_quantile() to compute p99. Summary: precomputes quantiles on the client. Less flexible than histogram for aggregation but less CPU in PromQL.' },
  { q: 'What is metric cardinality and why does high cardinality cause performance problems?', options: ['Cardinality refers to the number of unique metric names in a monitoring system', 'Cardinality is the total number of unique time series created by a metric; high cardinality from labels with many unique values (user IDs, request IDs) creates millions of time series that exhaust Prometheus memory and storage', 'High cardinality improves query precision; it only becomes a problem when storage is limited', 'Cardinality only matters for Prometheus; other monitoring systems are not affected'], answer: 1, explanation: 'Time series explosion: each unique combination of label values creates a distinct time series. http_requests_total with labels method, status, endpoint, user_id: if user_id has 1 million unique values, this metric creates millions of series. Prometheus stores all active time series in memory (head block). High cardinality exhausts RAM and makes queries slow. Rule: never use labels with unbounded cardinality (user IDs, request IDs, UUIDs, full URLs). Good labels: HTTP method (GET, POST — few values), status code (200, 400, 500), endpoint (/users, /orders — bounded). Use logs or distributed tracing for high-cardinality identifiers. Target cardinality: most metrics should have fewer than 1000 unique time series.' },
  { q: 'What is an OpenMetrics exemplar and how does it bridge metrics and traces?', options: ['An exemplar is a sample data point used to validate metric collection accuracy', 'An exemplar is a specific sample attached to a histogram observation that includes a trace ID, linking a high-latency bucket hit to the exact distributed trace for that request', 'An exemplar is a pre-computed query result cached alongside a metric for dashboard performance', 'An exemplar is a reference metric used to calibrate other metrics to a known baseline value'], answer: 1, explanation: 'Exemplars (OpenMetrics specification): when a histogram observation is made (e.g. a 500ms request), the system can attach an exemplar containing the trace ID of that specific request. Grafana displays exemplars as dots on histogram panels. Clicking an exemplar jumps directly to the distributed trace for that slow request. Benefit: you can go from a p99 latency spike (metric) directly to the specific request that caused it (trace) without searching. Prometheus supports exemplars in the OpenMetrics format. Applications must emit exemplars from their tracing instrumentation. OpenTelemetry SDKs emit exemplars automatically when both metrics and tracing are configured.' },
];

const qna: QnaItem[] = [
  {
    q: 'How many custom metrics should a service expose?',
    a: 'A typical service should expose 10-25 custom metrics: the default system metrics (CPU, memory, GC) plus 5-10 HTTP metrics (auto-instrumented) plus 5-15 business/domain metrics. More than 50 custom metrics per service is a smell — likely some are duplicates or rarely queried. Quality over quantity: each metric should answer a specific question about user experience or business health. Before adding a new metric, ask: "What dashboard panel or alert will use this?" If you can\'t answer that, don\'t add the metric. Use a metric catalogue (constants file) to track what exists and enforce naming consistency.',
  },
  {
    q: 'Should I use OpenTelemetry metrics or prom-client directly?',
    a: 'For new projects, prefer OpenTelemetry metrics (the `@opentelemetry/api` and `@opentelemetry/sdk-metrics` packages). Reasons: <ul><li>OTel metrics can be exported to Prometheus (via Prometheus exporter), Datadog, InfluxDB, or any OTLP-compatible backend without changing instrumentation code</li><li>One SDK for traces + metrics + logs — simpler dependency management</li><li>Semantic conventions define standard attribute names across languages</li></ul>Use prom-client directly when: <ul><li>You are certain you will always use Prometheus and never switch</li><li>Your team is already deeply familiar with prom-client and switching has no benefit</li><li>You need specific prom-client features (e.g., Pushgateway, custom registry per test)</li></ul>If you use prom-client today, a thin abstraction layer (an IMetrics interface wrapping prom-client) makes future migration to OTel low-risk.',
  },
  { q: 'What naming conventions should custom application metrics follow?', a: 'Prometheus naming convention: use snake_case. Units in the metric name: http_request_duration_seconds not http_request_duration_ms. Total suffix for counters: http_requests_total. Namespace prefix: myapp_http_requests_total. Subsystem: myapp_database_queries_total. Units: use base SI units (seconds not milliseconds, bytes not kilobytes). Avoid abbreviations that reduce clarity. Full example: myapp_http_request_duration_seconds (histogram). myapp_http_requests_total (counter). myapp_active_connections (gauge). myapp_queue_depth_items (gauge). Use consistent naming across teams so metrics from different services are comparable. Document each metric: what does it measure, what are the labels, what are the units.' },
  { q: 'How do you design metrics for a queue-based message processing system?', a: 'Queue metrics: queue depth (messages waiting to be processed) — the most important metric. Publish rate (messages per second being added). Consume rate (messages per second being processed). Processing time histogram (how long each message takes to process). Consumer lag (difference between latest message offset and consumer position — critical for Kafka). Error rate (failed processing attempts). Retry count (messages processed more than once). Dead letter queue depth (messages that could not be processed). Derived metrics: queue depth rising = consumers not keeping up with producers. Consumer lag growing = potential processing backlog. High error rate + growing DLQ depth = systemic processing failure. Alerting: alert on consumer lag exceeding threshold. Alert on DLQ depth growing. Alert on processing error rate above SLO.' },
  { q: 'What is the difference between pre-aggregated recording rules and computing metrics at query time?', a: 'Computing at query time: flexible — any aggregation can be computed when querying. But expensive for complex queries over large data sets with many time series. High cardinality queries with many label combinations can take seconds. Pre-aggregated recording rules: Prometheus recording rules compute an aggregation on a schedule and store the result as a new metric. Example: record job:http_requests_total:rate5m as the per-job sum of request rates. Dashboard panels and alert rules query the pre-aggregated metric (fast) instead of recomputing the aggregation each time. When to pre-aggregate: frequently used dashboard queries. Alert rules that evaluate every minute (computing each time is expensive). Global rollup metrics (total request rate across all pods). Trade-off: recording rules consume additional storage for the pre-aggregated series and must be updated if the aggregation needs change.' },
  { q: 'How do you instrument a database access layer for comprehensive observability?', a: 'Key metrics to instrument on every database call: query duration histogram (p50, p95, p99 by query type or table). Total query count (counter by status: success, error, timeout). Active connections and connection pool utilization. Connection wait time (time spent waiting for a connection from the pool). Rows examined vs rows returned ratio (indicates missing indexes). Slow query count (queries exceeding a threshold). Transaction count and duration. What to label: operation type (select, insert, update, delete). Table name (bounded set). Result status (success, error, connection-error). What NOT to label: specific query text (unbounded cardinality). User IDs in queries. Additional observability: emit a trace span for every database call with the query type and table name. Log slow queries with the full query text (in logs, not metrics, due to cardinality). Database-level metrics: connection pool metrics are critical — pool exhaustion causes cascading failures.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Custom app metrics = business domain counters/histograms/gauges. Name with units, keep labels low-cardinality, catalogue all metrics, alert on business impact first.',
  mustKnow: [
    'Business metrics (orders/min, payment failures) detect user impact before infrastructure thresholds fire',
    'Naming: <service>_<subsystem>_<name>_<unit>. Counters end in _total. Always base units (seconds, bytes).',
    'Callback gauges: polled at scrape time for external state (queue depth, DB pool) — no drift from manual updates',
    'Label strategy: plan labels before instrumenting — changing labels breaks dashboards. Low cardinality only.',
    'Metric catalogue: constants file for all metric names — prevents duplicates and enables compile-time typo detection',
    'Instrument background jobs, queue workers, and cron tasks — not just HTTP endpoints',
  ],
  interviewFocus: [
    'What is the difference between infrastructure metrics and business metrics?',
    'When would you use a callback-based gauge vs setting the gauge directly?',
    'How do you keep metric label cardinality under control?',
  ],
};

@Component({
  selector: 'app-obs-custom-metrics',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './custom-app-metrics.html',
  styleUrl: './custom-app-metrics.scss',
})
export class ObsCustomAppMetrics {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
