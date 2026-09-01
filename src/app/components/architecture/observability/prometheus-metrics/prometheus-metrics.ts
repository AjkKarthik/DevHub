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
  { name: 'Counter',    type: 'keyword', desc: 'Monotonically increasing value — only goes up. Total requests, errors, bytes sent. Use rate() in queries. Reset to 0 on restart.' },
  { name: 'Gauge',      type: 'keyword', desc: 'Value that goes up and down — current queue depth, memory usage, active connections. Use directly in queries.' },
  { name: 'Histogram',  type: 'keyword', desc: 'Samples observations into configurable buckets — request duration, response size. Enables quantile calculations across instances.' },
  { name: 'Summary',    type: 'keyword', desc: 'Pre-calculates quantiles client-side — p50, p95, p99. Accurate but cannot be aggregated across instances (unlike histogram).' },
  { name: 'PromQL',     type: 'keyword', desc: 'Prometheus Query Language. rate(), irate(), histogram_quantile(), sum by(), topk() — functional, not SQL.' },
  { name: 'Exemplar',   type: 'keyword', desc: 'A sample point in a histogram that carries a trace ID — enables click-from-metric-spike to representative trace in Grafana.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Four Metric Types',
    points: [
      'Counter: strictly increasing. Counts events — requests, errors, bytes processed. Never decrease (except restart reset to 0). Query with rate() or increase() — never query the raw value directly.',
      'Gauge: current snapshot value. Memory in use, queue depth, number of goroutines, temperature. Can go up or down. Query directly: `node_memory_MemFree_bytes`.',
      'Histogram: distributes observations across pre-defined buckets. Essential for latency — measures how many requests completed in <10ms, <50ms, <100ms, <500ms. Enables histogram_quantile(). Can be aggregated across instances.',
      'Summary: client-side quantile calculation. Reports p50/p95/p99 per instance. More accurate than histogram for outlier detection but CANNOT be aggregated across instances — if you have 10 app servers, you cannot merge their summaries. Prefer histograms for multi-instance deployments.',
    ],
  },
  {
    heading: 'Naming Conventions',
    points: [
      'Format: `<namespace>_<subsystem>_<name>_<unit>`. Unit is always the base unit (seconds not milliseconds, bytes not kilobytes).',
      'Counters: end in `_total`. `http_requests_total`, `db_errors_total`. The `_total` suffix is mandatory in Prometheus 2.x.',
      'Histograms auto-generate `_bucket`, `_sum`, and `_count` suffixes. `http_request_duration_seconds_bucket{le="0.1"}` means requests completing in ≤ 100ms.',
      'Labels: snake_case, no hyphens. Standard labels: `method`, `route`, `status_code`, `service`, `region`. Keep label cardinality bounded (< 100 unique values per label).',
    ],
  },
  {
    heading: 'Essential PromQL Patterns',
    points: [
      '`rate(counter[5m])`: per-second rate over 5-minute window — smooths out spikes. Use for request rate, error rate.',
      '`histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`: p99 latency aggregated across all instances. The killer feature of histograms vs summaries.',
      '`sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`: error rate as a fraction — core SLI query.',
      '`topk(5, rate(http_requests_total[5m]))`: top 5 endpoints by request rate. `by (route)` modifier adds label aggregation.',
    ],
  },
  {
    heading: 'The Scrape Model and Pull vs Push',
    points: [
      'Prometheus uses a pull model: it scrapes `/metrics` endpoints from targets on a configurable interval (default 15s). Services expose metrics; Prometheus collects them.',
      'Advantages of pull: easy to see if a target is down (scrape fails), no push credentials needed in apps, Prometheus controls collection frequency.',
      'Pushgateway: for short-lived jobs that complete before Prometheus scrapes them. Write batch job metrics to the Pushgateway; Prometheus scrapes the Pushgateway. Not for long-running services.',
      'Remote Write: Prometheus can push metrics to remote storage (Thanos, Cortex, Victoria Metrics) for long-term retention and horizontal scaling — Prometheus itself only stores ~15 days by default.',
    ],
  },
  {
    heading: 'The Four Prometheus Metric Types',
    points: [
      'Counter: a value that only increases (or resets to zero on restart) — used for cumulative totals like total requests served or total errors; the actual rate of change (requests per second) is computed at query time using the rate() function, not stored directly.',
      'Gauge: a value that can go up or down — used for current state like memory usage, active connections, or queue depth, representing a snapshot value at the time of the scrape rather than an accumulating total.',
      'Histogram: samples observations (like request duration) into configurable buckets, enabling percentile calculations (p50, p95, p99) at query time — the buckets themselves are pre-aggregated server-side, making histograms efficient to store even at high request volume.',
      'Summary: similar to histogram but calculates configurable quantiles client-side before export — summaries cannot be aggregated across multiple instances meaningfully (you cannot average pre-computed p99 values from different servers), which is why histograms are generally preferred for anything that needs cross-instance aggregation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Node.js prom-client',
    language: 'typescript',
    code: `import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import express from 'express';

const register = new Registry();

// Collect Node.js default metrics (heap, GC, event loop lag)
collectDefaultMetrics({ register });

// Counter — total HTTP requests
const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Histogram — request duration in seconds (NOT milliseconds)
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets in seconds: 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Gauge — active connections
const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Middleware — instruments every request
function metricsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const end = httpDuration.startTimer();
  activeConnections.inc();
  let requestFinished = false;

  res.on('finish', () => {
    requestFinished = true;
    const route = req.route?.path ?? req.path; // use matched route, not exact path
    const labels = { method: req.method, route, status_code: res.statusCode.toString() };
    httpRequests.inc(labels);
    end(labels);
    activeConnections.dec();
  });

  // 'close' fires both on normal completion (after 'finish') AND on a
  // client-aborted/disconnected connection, where 'finish' never fires at
  // all. Only decrement here if 'finish' hasn't already -- otherwise every
  // normal request would double-decrement the gauge.
  res.on('close', () => {
    if (!requestFinished) activeConnections.dec();
  });
  next();
}

const app = express();
app.use(metricsMiddleware);

// Expose /metrics for Prometheus to scrape
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});`,
  },
  {
    label: 'PromQL Queries',
    language: 'bash',
    code: `# ── GOLDEN SIGNAL QUERIES ─────────────────────────────────────────

# Request rate (requests per second, 5-minute rolling)
sum(rate(http_requests_total[5m])) by (service)

# Error rate as a percentage
100 * (
  sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
)

# p99 latency in milliseconds (histogram — aggregatable across instances)
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
) * 1000

# Apdex score (fraction of requests satisfying users)
# Satisfied: < 100ms, Tolerating: < 400ms, Frustrated: > 400ms
(
  sum(rate(http_request_duration_seconds_bucket{le="0.1"}[5m]))
  +
  sum(rate(http_request_duration_seconds_bucket{le="0.4"}[5m]))
) / 2
/
sum(rate(http_request_duration_seconds_count[5m]))

# ── RESOURCE QUERIES ──────────────────────────────────────────────

# Memory usage (bytes)
process_resident_memory_bytes{service="order-service"}

# CPU utilisation
rate(process_cpu_seconds_total[5m]) * 100

# Event loop lag (Node.js — indicates CPU saturation)
nodejs_eventloop_lag_p99_seconds * 1000  # → ms

# Top 5 slowest routes
topk(5,
  histogram_quantile(0.99,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
  )
)`,
  },
  {
    label: 'prometheus.yml',
    language: 'bash',
    code: `# prometheus.yml — scrape configuration
global:
  scrape_interval: 15s      # How often to scrape targets
  evaluation_interval: 15s  # How often to evaluate alerting rules

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts/*.yml'

scrape_configs:
  # Scrape Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Scrape your Node.js services
  - job_name: 'order-service'
    metrics_path: '/metrics'
    scrape_interval: 15s
    static_configs:
      - targets: ['order-service:3000']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance

  # Kubernetes pod discovery — auto-discover all pods with annotation
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: "true"
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Querying a counter\'s raw value instead of rate()',
    wrong: `# Raw counter value is meaningless — it just keeps increasing
http_requests_total{service="api"}
# Returns: 10,432,918 — what does this number tell you? Nothing useful.`,
    right: `# rate() gives per-second rate over the last 5 minutes
rate(http_requests_total{service="api"}[5m])
# Returns: 45.2 — 45 requests per second currently`,
    explanation: 'Counters only go up. Their absolute value depends on how long the service has been running — meaningless for dashboards. Always wrap counters in rate() or increase() to get a meaningful rate. rate() computes per-second rate accounting for counter resets on restarts.',
  },
  {
    title: 'Using Summary instead of Histogram for latency metrics',
    wrong: `// Summary quantiles are calculated per-instance — cannot aggregate
const summary = new Summary({
  name: 'http_request_duration_seconds',
  percentiles: [0.5, 0.95, 0.99], // calculated in each process
});
// 10 servers → 10 different p99 values → cannot compute fleet-wide p99`,
    right: `// Histogram buckets are aggregatable across instances
const histogram = new Histogram({
  name: 'http_request_duration_seconds',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
});
// histogram_quantile(0.99, sum(rate(..._bucket[5m])) by (le))
// → fleet-wide p99 from all 10 servers combined`,
    explanation: 'Summary quantiles are calculated per process — you cannot sum or average quantiles across multiple instances (p99 of p99s is not the fleet p99). Histograms record bucket counts that ARE summable across instances. `histogram_quantile()` in PromQL computes accurate fleet-wide quantiles from aggregated histogram buckets.',
  },
  {
    title: 'Not normalising route labels — one series per URL',
    wrong: `// Using exact request path as label
httpRequests.labels({ route: req.path }).inc();
// /users/123, /users/456, /users/789 → 3 different series
// /users/1000000 → 1,000,000 series in production = cardinality explosion`,
    right: `// Use matched route pattern, not exact path
const route = req.route?.path ?? '/unknown'; // Express matched route
httpRequests.labels({ route }).inc();
// /users/:id → single series covering all user requests`,
    explanation: 'Using the exact request URL (which contains IDs and parameters) as a metric label creates one time series per unique URL. Use the route pattern from your router (Express `req.route.path` = `/users/:id`) to keep a bounded set of label values. If no route is matched, use a catch-all label like `/unknown`.',
  },
  {
    title: 'Storing metrics with very short retention — losing historical data',
    wrong: `# Default Prometheus retention: 15 days
# After 15 days all data is gone
# Cannot compare this week's latency with last month's
# Cannot track long-term SLO compliance`,
    right: `# Remote write to long-term storage (Thanos / Victoria Metrics)
remote_write:
  - url: "http://thanos-receive:19291/api/v1/receive"
# Thanos stores indefinitely in object storage (S3/GCS)
# Query months or years of history via Thanos Query`,
    explanation: 'Prometheus default retention is 15 days — not enough for SLO tracking (typically 30-day windows) or capacity planning (quarterly trends). Configure remote_write to a long-term storage solution (Thanos, Victoria Metrics, or Grafana Mimir) that stores data in object storage indefinitely at low cost.',
  },
];

const challenge: Challenge = {
  title: 'Implement a histogram recorder',
  language: 'typescript',
  description: `Implement a SimpleHistogram class:
- constructor(buckets: number[]): sorted bucket boundaries
- record(value: number): void — increment the right buckets
- getCount(le: number): number — return count of values <= le
- totalCount(): number — total observations recorded

Each observation goes into ALL buckets where value <= bucket boundary (cumulative).`,
  hints: ['Cumulative histogram: each bucket includes all values <= that boundary', 'A value of 0.08 increments all buckets >= 0.08 (i.e., le=0.1, le=0.25, le=0.5, le=Inf)'],
  starterCode: `class SimpleHistogram {
  constructor(private buckets: number[]) {}

  record(value: number): void {}
  getCount(le: number): number { return 0; }
  totalCount(): number { return 0; }
}

const h = new SimpleHistogram([0.05, 0.1, 0.25, 0.5, 1.0]);
h.record(0.08);  // goes into 0.1, 0.25, 0.5, 1.0
h.record(0.03);  // goes into 0.05, 0.1, 0.25, 0.5, 1.0
h.record(0.6);   // goes into 1.0

console.log(h.getCount(0.05));  // 1
console.log(h.getCount(0.1));   // 2
console.log(h.getCount(1.0));   // 3
console.log(h.totalCount());    // 3`,
  solution: `class SimpleHistogram {
  private counts: Map<number, number>;

  constructor(private buckets: number[]) {
    this.counts = new Map(buckets.map(b => [b, 0]));
  }

  record(value: number): void {
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        this.counts.set(bucket, (this.counts.get(bucket) ?? 0) + 1);
      }
    }
  }

  getCount(le: number): number {
    return this.counts.get(le) ?? 0;
  }

  totalCount(): number {
    return Math.max(...this.counts.values(), 0);
  }
}

const h = new SimpleHistogram([0.05, 0.1, 0.25, 0.5, 1.0]);
h.record(0.08);
h.record(0.03);
h.record(0.6);
console.log(h.getCount(0.05));
console.log(h.getCount(0.1));
console.log(h.getCount(1.0));
console.log(h.totalCount());`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'You have two instances of your service, each reporting p99 latency as a Summary. Instance A p99 = 200ms, Instance B p99 = 400ms. What is the fleet-wide p99?',
    options: [
      '300ms (average of the two p99 values)',
      'Impossible to compute — Summary quantiles cannot be aggregated across instances',
      '400ms (worst p99 across instances)',
      'It depends on the traffic split between instances',
    ],
    answer: 1,
    explanation: 'This is the fundamental limitation of Summaries. Quantiles (p99) are statistical measures that cannot be mathematically combined by averaging or taking the max. The only accurate way to compute a fleet-wide p99 is from raw observations or bucket counts. Histogram buckets ARE summable — `sum(rate(h_bucket[5m])) by (le)` gives correct fleet-wide quantiles via `histogram_quantile()`.',
  },
  {
    q: 'What does a burn rate of 14 mean in the context of an SLO error budget?',
    options: [
      '14% of the error budget has been consumed',
      'The service is consuming the error budget 14 times faster than expected for the SLO period',
      'The error rate is 14% — critically high',
      '14 incidents occurred in the last window',
    ],
    answer: 1,
    explanation: 'Burn rate is the ratio of actual error rate to allowed error rate. Burn rate 14 means you\'re consuming the error budget 14× faster than the SLO assumes. For a 30-day SLO window, burn rate 14 means the budget will be exhausted in 30 ÷ 14 ≈ 2 days. This is the Google SRE page threshold — fast enough to exhaust the budget in 2 days requires immediate action.',
  },
  { q: 'What are the four core Prometheus metric types and when should you use each?', options: ['Gauge, Counter, Summary, and Histogram — but they are interchangeable; pick whichever is easiest to implement', 'Counter for ever-increasing values such as request count, Gauge for values that go up or down such as active connections, Histogram for latency distribution in buckets, Summary for client-side quantile calculation', 'Request, Error, Duration, and Saturation — the four types correspond to Prometheus metric names', 'Boolean, Integer, Float, and String — the four data types supported by the Prometheus data model'], answer: 1, explanation: 'Counter: monotonically increasing. Resets to 0 on restart. Use for: request count, error count, bytes sent. Query with rate() to get per-second rate. Never use for values that can decrease. Gauge: snapshot value that can go up or down. Use for: active connections, current queue depth, memory usage, CPU percentage. Query directly without rate(). Histogram: samples each observation and stores it in pre-defined buckets. Use for: request latency, request body size. Required for percentile queries via histogram_quantile(). Automatically provides sum and count. Summary: like histogram but calculates quantiles on the client side. Use for: when you know the quantiles you need and do not need to aggregate across instances. Limitation: quantiles from summaries cannot be aggregated across instances. Prefer Histogram over Summary in most cases.' },
  { q: 'What is the difference between rate() and irate() in PromQL?', options: ['rate() calculates the average per-second rate over a range window; irate() calculates the instantaneous per-second rate using only the last two data points — irate() is more responsive but noisier', 'irate() is deprecated; rate() is the correct function and should always be used', 'rate() requires a Counter metric; irate() works with both Counters and Gauges', 'rate() returns per-minute rates; irate() returns per-second rates'], answer: 1, explanation: 'rate(metric[5m]): average per-second rate of increase over the 5-minute window. Smoothed. Better for: alerting (avoids false alerts from spikes). Dashboard long-term trends. irate(metric[5m]): rate based on the last two data points in the 5-minute window. Immediate response. Better for: real-time dashboards where you want to see spikes. High-resolution graphs. Tradeoffs: rate() is less sensitive to transient spikes. A 1-second spike is averaged over 5 minutes and appears small. irate() captures spikes immediately — a 1-second spike appears at its full magnitude. Alerts: use rate() for alert expressions. A spike that lasts only 2 seconds would trigger and immediately resolve an irate() alert, creating alert flap. rate() prevents this by smoothing over the window.' },
  { q: 'What is the histogram_quantile function and what are bucket boundaries?', options: ['histogram_quantile calculates the exact percentile from recorded individual observations', 'histogram_quantile(0.99, rate(latency_bucket[5m])) estimates the 99th percentile latency by interpolating within the histogram bucket containing the 99th percentile observation', 'histogram_quantile can only calculate the median (0.5); use the summary metric type for other quantiles', 'Histogram buckets must be defined at query time in Prometheus; you cannot change them after the application starts'], answer: 1, explanation: 'histogram_quantile: interpolates within histogram buckets to estimate a percentile. Typical usage: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])). This reads: estimate the p99 latency from the per-second rate of bucket observations over the last 5 minutes. Bucket boundaries: defined when the histogram metric is created in the application. Typical latency buckets (in seconds): 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10. Accuracy: the estimated percentile is accurate only to the bucket granularity. If the true p99 is 847ms and you have buckets at 500ms and 1000ms, the estimate is derived by interpolating within the 500-1000ms bucket. Importance of bucket boundaries: if most requests complete in 50-150ms but the lowest bucket is 100ms, you lose visibility into the sub-100ms distribution. Tune bucket boundaries to the actual latency range of your service.' },
  { q: 'How do Prometheus labels work and what are the cardinality risks?', options: ['Labels are optional metadata on metrics; they have no performance implications regardless of the number of unique values', 'Labels add dimensions to metrics (such as method, status_code, endpoint) enabling grouping and filtering in queries, but each unique label combination creates a separate time series — too many unique values (high cardinality) can overwhelm Prometheus memory', 'Labels in Prometheus are equivalent to tags in other monitoring systems but are limited to 5 per metric', 'Prometheus labels are only applied at scrape time by the Prometheus server, not in the application'], answer: 1, explanation: 'Labels: key-value pairs that add dimensions to metrics. A metric with labels method=GET, status_code=200, endpoint=/api/orders is a different time series from one with method=POST, status_code=500, endpoint=/api/users. Grouping in queries: sum by (status_code) (rate(http_requests_total[5m])) — request rate broken down by status code. Cardinality risk: each unique combination of label values creates a new time series in Prometheus. 10 methods x 10 status codes x 1000 endpoints = 100,000 time series for one metric. High cardinality labels to avoid: request IDs (unique per request). User IDs (millions of unique values). Full URLs with query parameters. What to do instead: group high-cardinality attributes into categories (endpoint pattern not full URL, error type not error message). Keep high-cardinality data in traces not in metrics.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use a Summary vs a Histogram?',
    a: '<strong>Use Histogram</strong> (the default choice for new metrics) when: <ul><li>You have multiple service instances — histogram_quantile() aggregates correctly across instances</li><li>You want to define SLO alerting rules in Prometheus</li><li>You want exemplars (trace IDs linked to histogram observations)</li></ul><strong>Use Summary</strong> only when: <ul><li>You have a single-instance service and need very accurate quantiles</li><li>You know the exact quantiles you need in advance and never need to aggregate across instances</li></ul>The rule is simple: almost always use Histogram. The ability to compute accurate fleet-wide quantiles with `histogram_quantile()` is essential for SLO tracking in multi-instance deployments. The accuracy tradeoff (histograms approximate quantiles) is acceptable — typically within 1-5% of the true value with well-chosen buckets.',
  },
  {
    q: 'How do I choose histogram bucket boundaries?',
    a: 'Bucket boundaries should reflect meaningful latency thresholds for your SLOs. Default guidance: <ul><li><strong>User-facing HTTP APIs</strong>: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] seconds — the prom-client default is reasonable</li><li><strong>Background jobs</strong>: wider buckets [0.1, 0.5, 1, 5, 10, 30, 60] seconds</li><li><strong>Database queries</strong>: tighter at the low end [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]</li></ul>Key rule: your SLO latency target should land in the middle of your bucket range. If your SLO is p99 < 200ms, ensure you have buckets around 100ms, 200ms, 500ms so the histogram can approximate 200ms accurately. Avoid too few buckets (poor accuracy) or too many (higher cardinality, more storage per metric).',
  },
  { q: 'How do you implement RED metrics for a microservice with Prometheus?', a: 'RED metrics implementation: Request rate: counter metric incremented on every incoming request. Use labels for method, endpoint, and status_code. Query: sum by endpoint of the per-second rate. Error rate: use the request counter filtered to 5xx status codes divided by total request rate. Alternative: a separate error counter metric. Duration: histogram metric recording the latency of each request with method and endpoint labels. Omit status_code from the histogram labels to keep cardinality lower. p99 latency: use histogram_quantile(0.99, sum by le and endpoint of the rate of histogram buckets). Implementation: most frameworks provide Prometheus middleware that records these automatically. Go: promhttp.InstrumentHandlerDuration. .NET: prometheus-net AspNetCore middleware. Java: Micrometer with Prometheus registry. Node.js: prom-client with express-prom-bundle. Alerting: set alerts on error rate exceeding threshold and p99 latency exceeding SLO. Use the rate() function over a 5-minute window for alert expressions to avoid alerting on transient spikes.' },
  { q: 'How do you configure Prometheus scraping and service discovery in Kubernetes?', a: 'Kubernetes scraping: Prometheus needs to discover and scrape all pods and services dynamically as they scale and restart. Service discovery: kubernetes_sd_configs discovers targets from the Kubernetes API. Role types: pod (scrapes each pod directly), endpoints (scrapes service endpoints), service (scrapes the service ClusterIP). Target configuration: annotations-based — add prometheus.io/scrape: true and prometheus.io/port: 8080 annotations to pods. Prometheus relabeling rules read these annotations and configure scraping. Prometheus Operator (recommended): CRD-based approach. Define ServiceMonitor resources that select which services to scrape. The Operator syncs ServiceMonitors into Prometheus scrape configuration automatically. kube-prometheus-stack Helm chart: installs Prometheus Operator, Prometheus, Alertmanager, and Grafana with sensible Kubernetes defaults. Includes pre-built dashboards for node, pod, and API server metrics. Scrape interval: default 1 minute. For SLO-sensitive metrics, 15-30 seconds. For infrastructure metrics, 1-5 minutes. Avoid very short intervals (every 5 seconds) for most metrics — high storage cost for marginal benefit.' },
  { q: 'What is Prometheus remote write and when should you use it?', a: 'Prometheus remote write: configuration that makes Prometheus forward metrics it has scraped and stored to a remote storage backend in addition to its local TSDB. When to use: long-term retention — Prometheus local storage is designed for 15 days by default. For 1+ year retention, use a remote storage backend (Thanos, Cortex, Mimir, Victoria Metrics, AWS Managed Prometheus). Multi-region aggregation: multiple Prometheus instances in different regions send data to a central backend for global queries. High availability: remote write to a durable backend protects against Prometheus pod restarts causing data gaps. Backends: Thanos (open-source, S3-backed long-term storage). Grafana Mimir (Prometheus-compatible, horizontally scalable). Victoria Metrics (high-performance, low-memory remote write receiver). AWS Managed Prometheus (AMP). Grafana Cloud Metrics. Configuration: remote_write section in prometheus.yml with url, queue_config (batching), and optional TLS configuration. Drawbacks: remote write adds latency and storage cost. For short retention requirements, local storage is simpler and cheaper.' },
  { q: 'How do you write effective PromQL alert rules?', a: 'Alert rule structure: define alert rules in a Prometheus rules file within a groups block. Each alert has a name, an expr (the PromQL expression), a for duration, labels for routing (severity: critical or warning), and annotations for human-readable context (summary, description). Best practices: always include a for clause. An alert that fires for only 30 seconds is likely a transient spike. A 5-minute for duration prevents spurious alerts. Always use rate() on counters — never alert on raw counter values. Burn rate alerts for SLOs: instead of alerting on error rate exceeding a threshold, use multiwindow multi-burn-rate alerts (1h and 5m windows) to detect fast and slow error budget consumption at appropriate urgency. These alerts are more actionable than simple threshold alerts. Label routing: severity labels route alerts to the right channels in Alertmanager. Critical: page the on-call engineer. Warning: create a ticket. Test your alerts: use promtool test rules to verify alert expressions fire under expected conditions without running Prometheus itself.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Counter (rate()), Gauge (direct), Histogram (quantiles across instances), Summary (single-instance quantiles). PromQL is functional, not SQL.',
  mustKnow: [
    'Counter → always use rate() or increase(), never raw value. Must end in _total.',
    'Histogram → histogram_quantile() for p99 — aggregatable across instances. Prefer over Summary.',
    'Summary → pre-calculated quantiles, cannot aggregate across instances. Avoid in multi-instance deployments.',
    'Label cardinality: route pattern not exact path. Keep each label\'s unique values < 100.',
    'Prometheus scrape pull model: expose /metrics, configure prometheus.yml targets.',
    'Remote write to Thanos/VictoriaMetrics for retention beyond 15 days (SLO windows need 30 days+).',
  ],
  interviewFocus: [
    'Why use Histogram instead of Summary for latency metrics in a multi-instance service?',
    'Why do you need rate() for Counter queries but not for Gauge?',
    'What is cardinality and why does it matter in Prometheus?',
  ],
};

@Component({
  selector: 'app-obs-prometheus',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './prometheus-metrics.html',
  styleUrl: './prometheus-metrics.scss',
})
export class ObsPrometheusMetrics {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
