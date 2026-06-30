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
  { q: 'What is the difference between monitoring and observability?', options: ['Monitoring is manual; observability is automated metric collection', 'Monitoring checks known failure conditions against known thresholds; observability provides the ability to understand any system state from its external outputs, including unknown unknowns', 'Observability only applies to distributed systems; monitoring applies to single services', 'Both terms are equivalent; observability is the modern marketing term for monitoring'], answer: 1, explanation: 'Monitoring: you define in advance what you want to check. Dashboards and alerts for known failure modes. Good for: known failure types you have seen before. Observability (Charity Majors): the ability to ask arbitrary questions about system behavior by examining outputs (metrics, logs, traces) — even questions you did not anticipate needing to ask. Good for: novel failure modes, debugging complex interactions, understanding system behavior under new conditions. The distinction: monitoring tells you that something is wrong. Observability helps you understand why. Observability requires all three pillars — metrics, logs, and traces — because each provides a different perspective that the others cannot.' },
  { q: 'What are the three pillars of observability and what unique role does each play?', options: ['Uptime, latency, and error rate — the three key service level indicators', 'Metrics (aggregated numeric measurements over time), logs (timestamped event records), and distributed traces (request flows across services); each answers different questions about system behavior', 'Alerting, dashboards, and incident management — the three components of an observability platform', 'Infrastructure, application, and user experience monitoring — the three layers of modern observability'], answer: 1, explanation: 'Metrics: aggregated numeric values over time. Efficient for trending and alerting. Cannot explain why a single request failed. Logs: timestamped records of discrete events. Rich context per event. Cannot show the flow of a request across services. Distributed traces: the journey of a single request across all services. Shows where time is spent and what calls are made. Cannot efficiently aggregate across millions of requests. The pillars complement each other: metrics detect the problem. Logs provide event-level context about what happened. Traces show the complete request flow through distributed services. Effective observability requires all three.' },
  { q: 'What is high cardinality and why is it important for modern observability?', options: ['High cardinality refers to having many unique metric names in a monitoring system', 'High cardinality means having many unique values for an attribute (like user ID or request ID); traditional metrics cannot handle high cardinality efficiently but modern observability tools like Honeycomb can query arbitrary high-cardinality data', 'High cardinality is a performance problem that all observability tools must avoid', 'High cardinality is the ability to ingest metrics at a very high rate (high cardinality of events per second)'], answer: 1, explanation: 'High cardinality: an attribute with many unique values. User ID, order ID, request ID, session ID. Traditional metrics: each unique label combination creates a separate time series. One million unique user IDs creates one million time series in Prometheus — not feasible. Traditional solution: pre-aggregate (count by user tier instead of by user ID). Lose individual-level detail. Modern observability (Honeycomb, Lightstep, Jaeger): store individual events with all attributes. Query any attribute combination at query time. Can answer: what is the p99 latency for user 12345? Which users experienced errors in the last 5 minutes? High cardinality observability enables questions that pre-aggregated metrics cannot answer because the detail is retained.' },
  { q: 'What is the difference between black-box monitoring and white-box monitoring?', options: ['Black-box monitoring runs in the cloud; white-box monitoring runs on-premises', 'Black-box monitoring tests the system from the outside (like a user) without knowledge of internal state; white-box monitoring instruments the system internals and uses internal metrics, logs, and traces', 'White-box monitoring is more accurate; black-box monitoring is an approximation', 'Black-box monitoring is deprecated; all modern systems use white-box monitoring exclusively'], answer: 1, explanation: 'Black-box monitoring: tests the system from the user perspective without knowledge of internal implementation. Synthetic checks: HTTP health checks, ping monitors, end-to-end synthetic transactions. Catches failures that affect external behavior regardless of internal cause. Examples: Prometheus blackbox exporter probes HTTP endpoints, SSL certificate expiry, DNS resolution. Cloud load balancer health checks. What it misses: cannot detect degradation that has not yet manifested as external failure. White-box monitoring: instruments internal system components. Metrics from within the application, logs, traces. Catches issues before they become user-visible. Can diagnose root causes. Best practice: use both. Black-box monitoring catches what users actually experience. White-box monitoring helps diagnose why problems occur.' },
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
  { q: 'What is the MELT acronym and how does it expand the three pillars of observability?', a: 'MELT: Metrics, Events, Logs, Traces — an expansion of the three-pillar model that recognizes events as a distinct signal type. Metrics: aggregated numeric measurements (request rate, p99 latency, error rate). Time-series. Efficient for dashboards and alerting. Events: discrete occurrences with rich attributes at a specific point in time. An order placed, a user logged in, a deployment completed. High cardinality — each event has unique identifiers. Not aggregated in advance. Tools: Honeycomb, Clickhouse for event analytics. Logs: timestamped text or structured records of what happened. Typically emitted by application code. May be structured (JSON) or unstructured (text). Traces: the distributed request journey across services. Connected spans showing latency and causality. Why MELT vs three pillars: events emphasize the value of high-cardinality individual-level data. Some tools (Honeycomb) unify events, logs, and traces into a single store.' },
  { q: 'How do you build an observability culture in an engineering team?', a: 'Building observability culture: make observability a launch requirement: no service ships to production without: a RED metrics dashboard, error logging, and distributed tracing. Runbooks for all P1 alerts. Instrument by default: use observability frameworks (OpenTelemetry) that instrument automatically at the framework level. Engineers get traces and metrics without writing instrumentation code. Use observability in debugging: when an engineer investigates a bug, they must use the observability tools (not just local debugging). This builds fluency and surfaces gaps in instrumentation. Blameless postmortems: after incidents, focus on: what observability data was missing? What made it hard to diagnose? What will we add? Treat observability gaps as action items. On-call: everyone who writes code is on-call for their service. This creates immediate feedback between poor observability and engineering experience. Share dashboards: make observability dashboards visible in team channels. Normalize looking at metrics during deployments.' },
  { q: 'What is the difference between active and passive observability?', a: 'Passive observability: the system emits signals as a side effect of normal operation. Metrics scraped from running services. Logs written as the application processes requests. Traces generated by instrumentation in the code path. Passive observability captures what actually happened to real user requests. Its only limitation: it can only observe what did happen, not what would happen. Active observability (synthetic monitoring): inject artificial requests to probe the system. Synthetic transactions (Datadog Synthetics, New Relic Synthetics): run scripted user journeys every minute. Blackbox probers: HTTP health checks, DNS checks, SSL checks from Prometheus blackbox-exporter. Canary deployments with real traffic routing. Advantages of active: catches issues when no real users are active (off-peak, before launch). Gives consistent baselines uncorrelated with traffic patterns. Can detect slow degradation before it becomes a user-visible problem. Both passive and active together provide the most comprehensive observability coverage.' },
  { q: 'What is the difference between availability and reliability as system properties?', a: 'Availability: the fraction of time a system is operational and accessible. Calculated as: (total time - downtime) / total time. 99.9% availability = 43.8 minutes downtime per month. Availability is a binary measurement — the system is either up or it is not. Reliability: a broader concept. Includes availability but also: correctness (giving right answers). Performance (acceptable latency). Consistency (same behavior across requests). Safety (no harmful behavior under failure). A system can be available but not reliable: serving 500 errors (available, not correct). Responding slowly (available, poor performance). Giving stale data (available, not consistent). SLO design: availability SLOs measure uptime. Error rate SLOs measure correctness. Latency SLOs measure performance. Together they capture reliability more completely than availability alone.' },
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
