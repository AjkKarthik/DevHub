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
  { name: 'Metric',       type: 'keyword', desc: 'Numeric measurement aggregated over time — request count, error rate, p99 latency. Fast, cheap, but low context.' },
  { name: 'Log',          type: 'keyword', desc: 'Timestamped text/JSON event record — high context, queryable if structured, expensive at high volume.' },
  { name: 'Trace',        type: 'keyword', desc: 'End-to-end record of a request across services — spans form a tree showing where time was spent.' },
  { name: 'Span',         type: 'keyword', desc: 'Single unit of work within a trace — has start/end time, service name, attributes, and parent span ID.' },
  { name: 'Cardinality',  type: 'keyword', desc: 'Number of unique label combinations in a metric — high cardinality (user IDs as labels) breaks time-series DBs.' },
  { name: 'MTTD / MTTR',  type: 'keyword', desc: 'Mean Time To Detect / Mean Time To Resolve — key SRE reliability metrics. Observability reduces both.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Monitoring vs Observability',
    points: [
      'Monitoring: watching dashboards and alerts for known failure modes — "Is it down?" You know what to look for in advance.',
      'Observability: the ability to understand the internal state of a system from its external outputs — "Why is it slow for this user?" You can explore unknowns.',
      'Monitoring asks pre-defined questions. Observability lets you ask arbitrary new questions about your system without deploying new code.',
      'A monolith with good logging may be adequately monitored. A microservices system with 50 services serving millions of users requires full observability to diagnose cross-service latency regressions.',
    ],
  },
  {
    heading: 'The Three Pillars',
    points: [
      'Metrics: numeric measurements collected at intervals — counters, gauges, histograms. Cheap to store, fast to query, excellent for alerting and dashboards. Low context: you know something is wrong but not why.',
      'Logs: timestamped event records. High context when structured (JSON with correlation IDs). Expensive at scale — sample high-volume events. Essential for debugging specific incidents.',
      'Traces: the path of a single request through your system. Every service adds a span to the trace. Answers "which service added 500ms to this request for this user?" — impossible with metrics alone.',
      'The pillars are complementary: alerts fire on metrics → dashboards show degraded service → traces pinpoint the slow span → logs on the affected service reveal the root cause.',
    ],
  },
  {
    heading: 'Cardinality — The Silent Killer',
    points: [
      'Time-series databases (Prometheus, InfluxDB) store one series per unique label combination. Labels with too many unique values explode the number of series.',
      'Safe labels (low cardinality): HTTP method (5 values), status code class (5xx, 4xx…), service name, region, environment.',
      'Dangerous labels (high cardinality): user ID, session ID, request ID, email address, IP address — each creates a new time series per unique value.',
      'Rule of thumb: if a label value comes from user input or is a UUID/timestamp, it does not belong in a metric. Put it in a log or trace attribute instead.',
    ],
  },
  {
    heading: 'The Observability Data Model',
    points: [
      'A trace ID links all signals for one request: trace ID on logs, metric exemplars, and the trace itself. This lets you pivot from metric spike → representative traces → root cause logs.',
      'OpenTelemetry is the standard for emitting all three signals from application code — one SDK, one Collector, many backends (Prometheus, Jaeger, Loki, Datadog).',
      'Correlation ID vs Trace ID: correlation IDs are simpler (UUID propagated via header), trace IDs are richer (tied to a structured span tree). OTel trace IDs subsume correlation IDs.',
      'The goal is to answer "what happened for request X?" in production without touching the code — using only the signals already being emitted.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Three Signals',
    language: 'typescript',
    code: `// ── METRIC ──────────────────────────────────────────────────────────
// Numeric + label dimensions. Time-series. No per-request context.
// "How many requests returned 500 in the last 5 minutes?"
{
  name: 'http_requests_total',
  labels: { method: 'POST', path: '/orders', status: '500' },
  value: 42,
  timestamp: 1705316400
}

// ── LOG ──────────────────────────────────────────────────────────────
// Structured JSON event. High context. Per-request details.
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "error",
  "message": "Order validation failed",
  "traceId": "4bf92f3577b34da6",
  "spanId":  "00f067aa0ba902b7",
  "service": "order-service",
  "userId":  "usr_42",            // ← in log, NOT in metric label
  "orderId": "ord_abc123",
  "error":   "total below minimum",
  "durationMs": 12
}

// ── TRACE (span) ─────────────────────────────────────────────────────
// One node in the call tree. Answers "where did the time go?"
{
  traceId:    "4bf92f3577b34da6",  // same across ALL spans in request
  spanId:     "00f067aa0ba902b7",
  parentSpanId:"a2fb4a1d1a96d312", // parent = caller service's span
  operationName: "POST /orders",
  service:    "order-service",
  startTime:  1705316400000,
  duration:   145,                 // ms
  status:     "ERROR",
  attributes: {
    "http.method":      "POST",
    "http.status_code": 400,
    "db.system":        "postgresql",  // child span attribute
    "db.statement":     "INSERT INTO orders ...",
  }
}`,
  },
  {
    label: 'Cardinality Trap',
    language: 'typescript',
    code: `// ❌ BAD: userId as a metric label → millions of time series
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status', 'userId'], // userId = HIGH CARDINALITY
});

// With 1M users × 10 paths × 5 methods × 5 statuses = 250 MILLION series
// Prometheus crashes. Costs multiply. Queries become impossibly slow.
requestCounter.labels('GET', '/orders', '200', 'usr_1234567').inc(); // ❌

// ✅ GOOD: low-cardinality labels on metrics; high-cardinality data in logs/traces
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'], // bounded set of values
});

requestCounter.labels('GET', '/orders/:id', '200').inc(); // ✅ ~50 series total

// High-cardinality data belongs in the structured log:
logger.info('Request handled', {
  traceId: span.traceId,
  userId: req.user.id,           // ← high cardinality → log field
  orderId: req.params.id,        // ← high cardinality → log field
  durationMs: Date.now() - start,
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using high-cardinality labels in metrics',
    wrong: `counter.labels({ userId: req.user.id, requestId: uuid() }).inc();
// 1M users → 1M time series → OOM, slow queries, huge storage cost`,
    right: `counter.labels({ route: '/orders/:id', statusCode: '200' }).inc();
// Put userId/requestId in structured log fields or trace attributes`,
    explanation: 'Time-series databases multiply series per unique label value. One million users as a label = one million series per metric. Use only labels with a bounded, small set of values (method, route, status code class). Put high-cardinality context in logs and trace attributes.',
  },
  {
    title: 'Confusing monitoring with observability',
    wrong: `// Dashboards showing CPU, memory, disk — nothing service-level
// Alert fires: "CPU > 80%" — no idea which requests are affected
// Cannot answer: "why is checkout slow for users in region US-East?"`,
    right: `// Service-level metrics: error rate, p99 latency, saturation
// Structured logs with traceId, userId, region for drill-down
// Distributed traces linking all spans in a checkout request
// Can answer: slow span in payment-service → DB query without index`,
    explanation: 'Monitoring known failure modes (CPU/disk alerts) is not observability. Observability means being able to explore unknown failure modes using the signals your system emits. Without traces and structured logs with correlation IDs, you cannot diagnose complex distributed system failures.',
  },
  {
    title: 'Not propagating trace/correlation IDs across services',
    wrong: `// Service A generates a requestId but does not forward it
app.post('/orders', (req, res) => {
  const requestId = uuid();
  await paymentService.charge(amount); // no requestId passed
  // Logs in payment-service have no link back to order-service
});`,
    right: `app.post('/orders', (req, res) => {
  const traceId = req.headers['traceparent'] ?? generateTraceId();
  await paymentService.charge(amount, {
    headers: { 'traceparent': traceId } // propagate to every outbound call
  });
  logger.info('Order created', { traceId, orderId }); // same traceId in logs
});`,
    explanation: 'Without propagating a trace/correlation ID to every downstream service call, you cannot connect the logs of service A with logs of service B for the same user request. Always forward the W3C traceparent header (or your correlation ID) on every outbound HTTP/gRPC call and log it in every service.',
  },
  {
    title: 'Logging unstructured text in production',
    wrong: `console.log('User ' + userId + ' order ' + orderId + ' failed: ' + err.message);
// Cannot filter by userId in Kibana/Grafana Loki without regex
// Correlation across services is impossible`,
    right: `logger.error('Order creation failed', {
  userId, orderId, errorCode: err.code, errorMessage: err.message,
  traceId, durationMs
});
// Can now query: {userId="usr_42"} | json | error_code="PAYMENT_DECLINED"`,
    explanation: 'Free-text logs require expensive regex to query and cannot be reliably filtered or correlated. Structured JSON logs with consistent field names (userId, orderId, traceId) can be queried precisely in Kibana, Grafana Loki, or CloudWatch — turning a 2-hour incident into a 5-minute investigation.',
  },
];

const challenge: Challenge = {
  title: 'Classify observability signals',
  language: 'typescript',
  description: `Implement classifySignal(signal: SignalInput): 'metric' | 'log' | 'trace' | 'unknown'
Rules:
- Has value (number) + labels (object) → 'metric'
- Has message (string) + level (string) → 'log'
- Has traceId (string) + spanId (string) + duration (number) → 'trace'
- Otherwise → 'unknown'`,
  hints: ['Check fields in the signal object', 'typeof checks for string/number types'],
  starterCode: `type SignalInput = Record<string, any>;

function classifySignal(signal: SignalInput): 'metric' | 'log' | 'trace' | 'unknown' {
  return 'unknown';
}

console.log(classifySignal({ value: 42, labels: { method: 'GET' } }));     // metric
console.log(classifySignal({ message: 'order placed', level: 'info' }));   // log
console.log(classifySignal({ traceId: 'abc', spanId: 'def', duration: 45 })); // trace
console.log(classifySignal({ foo: 'bar' }));                               // unknown`,
  solution: `type SignalInput = Record<string, any>;

function classifySignal(signal: SignalInput): 'metric' | 'log' | 'trace' | 'unknown' {
  if (typeof signal.value === 'number' && typeof signal.labels === 'object') return 'metric';
  if (typeof signal.message === 'string' && typeof signal.level === 'string') return 'log';
  if (typeof signal.traceId === 'string' && typeof signal.spanId === 'string' && typeof signal.duration === 'number') return 'trace';
  return 'unknown';
}

console.log(classifySignal({ value: 42, labels: { method: 'GET' } }));
console.log(classifySignal({ message: 'order placed', level: 'info' }));
console.log(classifySignal({ traceId: 'abc', spanId: 'def', duration: 45 }));
console.log(classifySignal({ foo: 'bar' }));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which observability signal best answers: "Which microservice added the most latency to the user\'s checkout request?"',
    options: ['Metric (p99 latency histogram)', 'Structured log with timestamps', 'Distributed trace showing all service spans', 'Infrastructure metric (CPU usage)'],
    answer: 2,
    explanation: 'Distributed traces capture the entire request journey — each service adds a span with start time and duration. The trace tree immediately shows which span took the most time. Metrics aggregate across all requests (you can\'t trace back to one user\'s request). Logs need manual correlation across services without a shared trace structure.',
  },
  {
    q: 'Why should user IDs NOT be used as metric labels in Prometheus?',
    options: ['User IDs are PII and should never appear in monitoring systems', 'Unique user IDs create one time series per user, causing cardinality explosion and OOM errors', 'Prometheus cannot store string labels — only numeric values are allowed', 'User IDs change too frequently for metric labels to be reliable'],
    answer: 1,
    explanation: 'Each unique label value combination creates a separate time series in Prometheus. With millions of users as label values, you get millions of time series — exceeding memory limits, slowing queries to seconds, and multiplying storage costs. Use low-cardinality labels on metrics (route, status code, method) and put user IDs in structured log fields or trace attributes.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between monitoring and observability?',
    a: 'Monitoring is the practice of watching pre-defined metrics and alerts for known failure modes — you collect dashboards and set thresholds for CPU, error rate, latency. It answers "is it broken?" for problems you anticipated. Observability is a property of a system: the degree to which you can understand its internal state from external outputs (metrics, logs, traces). An observable system lets you ask arbitrary new questions — "why is checkout slow for users with 3+ items in their cart from mobile devices?" — without deploying new instrumentation. Monitoring is what you do; observability is the property that makes monitoring effective for unknown failure modes. In practice: monitoring catches the alert; observability helps you diagnose why.',
  },
  {
    q: 'Do I need all three pillars (metrics + logs + traces) or can I start with just one?',
    a: 'Start with structured logs — they provide the most diagnostic value per unit of effort for most teams. Add metrics next to enable alerting and dashboards. Add distributed tracing when you have multiple services and need to understand cross-service latency. Priority guidance: <ol><li><strong>Structured JSON logs with correlation IDs</strong>: essential from day one — queryable, correlatable, diagnostic</li><li><strong>Service-level metrics (error rate, p99 latency, saturation)</strong>: needed for alerting and SLO tracking</li><li><strong>Distributed tracing</strong>: high value when you have &gt;2 services, worth the investment when diagnosing microservices latency</li></ol>Many teams start with all three simultaneously by adopting OpenTelemetry early — its SDK instruments all three signals with one setup. The cost of retrofitting observability into an existing system is far higher than building it in from the start.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Observability = metrics (what) + logs (why) + traces (where) — correlated by trace ID to diagnose any failure without deploying new code.',
  mustKnow: [
    'Monitoring knows what to look for; observability lets you ask new questions about unknown failures',
    'Three pillars: metrics (aggregate numbers), logs (event records), traces (request paths across services)',
    'Cardinality: high-cardinality labels (user IDs) explode time-series DB — keep labels bounded',
    'Propagate trace/correlation ID across every service call and log it — enables cross-service debugging',
    'Structured JSON logs are queryable; free-text logs require expensive regex — always use structured logging',
    'Alert on metrics → drill into trace → investigate logs: the observability investigation workflow',
  ],
  interviewFocus: [
    'What is the difference between monitoring and observability?',
    'Why is cardinality important in metrics? What happens with high-cardinality labels?',
    'How do distributed traces differ from logs?',
  ],
};

@Component({
  selector: 'app-obs-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './observability-fundamentals.html',
  styleUrl: './observability-fundamentals.scss',
})
export class ObsFundamentals {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
