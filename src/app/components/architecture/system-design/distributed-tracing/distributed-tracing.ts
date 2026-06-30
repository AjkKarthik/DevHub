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
  { name: 'Trace',          type: 'keyword', desc: 'End-to-end record of a single request across all services. Has a unique trace ID.' },
  { name: 'Span',           type: 'keyword', desc: 'A single unit of work within a trace. Has start time, duration, parent span ID.' },
  { name: 'Trace ID',       type: 'keyword', desc: 'Globally unique ID propagated in headers (W3C traceparent). Links spans across services.' },
  { name: 'OpenTelemetry',  type: 'keyword', desc: 'CNCF standard for traces, metrics, logs. Vendor-neutral SDK + collector pipeline.' },
  { name: 'Jaeger',         type: 'keyword', desc: 'Open-source distributed tracing backend. Stores and visualises traces from OTLP.' },
  { name: 'Zipkin',         type: 'keyword', desc: 'Older distributed tracing system. Supports Zipkin B3 headers for propagation.' },
  { name: 'Sampling',       type: 'keyword', desc: 'Tracing every request is expensive. Head sampling: decide at start. Tail sampling: decide at end.' },
  { name: 'W3C traceparent',type: 'keyword', desc: 'Standard header: version-traceId-parentId-flags. Replaces B3 and X-Request-Id.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Traces, spans, and the trace context',
    points: [
      'A trace represents one user request flowing through multiple services.',
      'Each service creates one or more spans. Spans are linked via parent span ID — forming a tree.',
      'The trace ID is generated at the edge (API gateway or frontend) and propagated in every downstream HTTP header and message.',
      'Visualised as a Gantt chart: time on X-axis, each span as a bar — reveals which service added latency.',
    ],
  },
  {
    heading: 'OpenTelemetry (OTel)',
    points: [
      'Unified SDK for traces + metrics + logs. Vendor-neutral — export to Jaeger, Tempo, Datadog, etc.',
      'Auto-instrumentation: patches HTTP, DB, and messaging libraries with zero code changes.',
      'OTel Collector: receives OTLP from services, batches, filters, and forwards to backend.',
      'W3C traceparent header is the standard propagation format; OTel propagates it automatically.',
    ],
  },
  {
    heading: 'Sampling strategies',
    points: [
      'Always-on sampling: 100% of traces captured. Only feasible at low traffic (< 100 req/s).',
      'Head-based sampling: decide at trace root (e.g. 1% of requests). Simple but misses rare slow requests.',
      'Tail-based sampling: buffer spans; decide to keep/drop after entire trace arrives. Keeps all errors and slow traces.',
      'Adaptive: Jaeger and Tempo support dynamic rate per service/endpoint.',
    ],
  },
  {
    heading: 'Correlating traces, metrics, and logs',
    points: [
      'Include trace ID in every log line — enables jumping from log → trace in one click.',
      'Metrics can carry trace exemplars: specific trace IDs for the p99 data point.',
      'Structured logging (JSON) + trace ID + span ID = full observability correlation.',
      'The three pillars of observability: Logs (what happened), Metrics (how much), Traces (where and how long).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'OTel Node.js Setup',
    language: 'typescript',
    code: `// OpenTelemetry Node.js auto-instrumentation
// npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
// npm install @opentelemetry/exporter-trace-otlp-http

// tracing.ts — load BEFORE your app code
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-patches: http, express, pg, redis, mongodb, kafka, grpc
      '@opentelemetry/instrumentation-fs': { enabled: false }, // too noisy
    }),
  ],
  serviceName: 'order-service',
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => sdk.shutdown());

// Manual span (for business logic):
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('order-service');

async function processOrder(orderId: string) {
  const span = tracer.startSpan('processOrder');
  span.setAttribute('order.id', orderId);
  try {
    const result = await doWork(orderId);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  } finally {
    span.end();
  }
}`,
  },
  {
    label: 'Context Propagation',
    language: 'typescript',
    code: `// W3C traceparent propagation across service boundaries
// OTel auto-instruments HTTP — this shows the mechanics manually

// Service A: outbound HTTP call
import { propagation, context } from '@opentelemetry/api';

async function callServiceB(orderId: string): Promise<void> {
  const headers: Record<string, string> = {};
  // Inject current trace context into headers
  propagation.inject(context.active(), headers);
  // headers now contains: { traceparent: '00-<traceId>-<spanId>-01' }

  await fetch('http://service-b/api/order', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
}

// Service B: inbound HTTP — extract and continue the trace
app.use((req, res, next) => {
  const parentContext = propagation.extract(context.active(), req.headers);
  context.with(parentContext, () => {
    // All spans created in this request continue the parent trace
    next();
  });
});

// Include trace ID in logs:
import { trace } from '@opentelemetry/api';

function logWithTrace(level: string, message: string, meta?: object): void {
  const span = trace.getActiveSpan();
  const traceId = span?.spanContext().traceId ?? 'none';
  console.log(JSON.stringify({ level, message, traceId, ...meta }));
}`,
  },
  {
    label: 'Jaeger Docker Setup',
    language: 'bash',
    code: `# Jaeger all-in-one (dev/demo — stores in memory)
docker run -d --name jaeger \\
  -e COLLECTOR_OTLP_ENABLED=true \\
  -p 16686:16686 \\  # Jaeger UI
  -p 4317:4317 \\    # OTLP gRPC
  -p 4318:4318 \\    # OTLP HTTP
  jaegertracing/all-in-one:latest

# Open Jaeger UI: http://localhost:16686
# Select service → search traces → click a trace → view waterfall

# docker-compose.yml for full OTel stack:
# services:
#   otel-collector:
#     image: otel/opentelemetry-collector-contrib
#     volumes:
#       - ./otel-config.yaml:/etc/otel/config.yaml
#     command: ["--config=/etc/otel/config.yaml"]
#     ports:
#       - "4317:4317"
#       - "4318:4318"
#
#   jaeger:
#     image: jaegertracing/all-in-one
#     ports:
#       - "16686:16686"
#       - "14250:14250"   # jaeger model

# otel-config.yaml:
# receivers:
#   otlp:
#     protocols: { grpc: {}, http: {} }
# exporters:
#   jaeger:
#     endpoint: jaeger:14250
# service:
#   pipelines:
#     traces:
#       receivers: [otlp]
#       exporters: [jaeger]`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not propagating trace context to message queues',
    wrong: `// Producer sends Kafka message — no trace context
await kafka.produce('orders', { orderId });
// Consumer processes message — starts a new unrelated trace
// Cannot correlate producer and consumer spans`,
    right: `// Inject trace context into Kafka headers
const headers: Record<string, string> = {};
propagation.inject(context.active(), headers);
await kafka.produce('orders', { orderId }, { headers });

// Consumer: extract and link
const parentCtx = propagation.extract(context.active(), msg.headers);
context.with(parentCtx, () => processMessage(msg));`,
    explanation: 'Trace context must be propagated through every transport — HTTP headers, gRPC metadata, Kafka message headers, SQS attributes. Without it, producer and consumer spans are disconnected — you cannot trace a request end-to-end through async flows.',
  },
  {
    title: '100% sampling in high-traffic production',
    wrong: `// Always-on sampling at 100,000 req/s
// 100k spans/s × 1KB each = 100 MB/s to tracing backend
// Cost: ~$8,000/month in storage alone`,
    right: `// Tail-based sampling: keep 1% of normal + 100% of errors/slow
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBased(0.01),  // 1% head sample
});
// In OTel Collector: tail_sampling processor keeps all error traces`,
    explanation: '100% sampling at high traffic is prohibitively expensive. Use head-based sampling (1-5%) for baseline with tail-based sampling to capture all errors and p99+ slow traces.',
  },
  {
    title: 'Missing trace ID in log lines',
    wrong: `// Logs have no trace context
console.log('Payment failed for order', orderId);
// Cannot correlate this log to the Jaeger trace
// Debugging requires manual correlation across tools`,
    right: `// Include trace ID in every log line
const traceId = trace.getActiveSpan()?.spanContext().traceId;
logger.error('Payment failed', { orderId, traceId });
// Now: log error → click traceId → open Jaeger → see full waterfall`,
    explanation: 'Without trace IDs in logs, you cannot correlate a log error to the trace that caused it. Add trace ID + span ID to every structured log line — most logging frameworks support this via OTel log correlation.',
  },
  {
    title: 'Creating spans with no attributes',
    wrong: `// Span has no useful information
const span = tracer.startSpan('processOrder');
// Jaeger shows: processOrder, 120ms — no context about what order`,
    right: `const span = tracer.startSpan('processOrder');
span.setAttribute('order.id', orderId);
span.setAttribute('order.total', total);
span.setAttribute('user.id', userId);
span.setAttribute('db.query.rows_affected', rowsAffected);
// Jaeger shows: processOrder [order=42, user=123, $99.99]`,
    explanation: 'Spans without attributes are hard to filter and debug. Add business context (order ID, user ID, item count) and technical context (DB query, cache hit/miss, retry count) to every span as attributes.',
  },
];

const challenge: Challenge = {
  title: 'Debug a slow checkout using traces',
  language: 'typescript',
  description: `A checkout request takes 3.2 seconds. You have Jaeger traces.
The waterfall shows:

checkout-service          [0ms ─────────────────────────── 3200ms]
  ├─ validate-cart        [5ms ─ 45ms]
  ├─ fraud-check          [50ms ─────────────────── 2800ms]  ← !!
  │   └─ fraud-api HTTP   [50ms ─────────────────── 2780ms]
  ├─ charge-payment       [2810ms ── 3150ms]
  └─ create-order         [3155ms ── 3195ms]

fraud-api HTTP span attributes:
  http.url: https://fraud-api.vendor.com/v2/check
  http.status_code: 200
  retry.count: 2

Tasks:
1. Identify the root cause from the trace
2. What attribute reveals the real problem?
3. How would you fix this architecture?
4. What sampling strategy captures this in production?`,
  hints: [
    'fraud-api took 2730ms — look at retry.count attribute',
    'First attempt likely timed out; 2 retries = 3 × ~900ms',
    'Fix: set timeout, add circuit breaker, provide fallback',
    'Tail-based sampling: this slow trace should always be captured',
  ],
  starterCode: `// From the trace, answer:
// 1. Root cause:
// 2. Key attribute:
// 3. Architecture fix:
// 4. Sampling strategy:

// Also: what code change adds the retry.count attribute?
const span = tracer.startSpan('fraud-api-call');`,
  solution: `// 1. Root cause:
// fraud-api first attempt timed out (no timeout set → default 30s? or 900ms)
// retry.count: 2 means 3 total attempts: ~900ms × 3 = 2700ms
// The vendor API is slow but eventually succeeds

// 2. Key attribute: retry.count: 2 — reveals this was not a single slow call

// 3. Architecture fix:
// a) Set aggressive timeout: 500ms (vendor SLA should be < 200ms)
// b) Add circuit breaker: open after 5 timeouts in 30s window
// c) Add fallback: if fraud-check fails, allow with low-risk flag + async review
// d) Move fraud check async: charge payment first, refund if fraud found later
//    (industry pattern for low-value orders — Amazon does this)

// 4. Sampling strategy:
// Tail-based sampling in OTel Collector:
// - Keep 100% of traces where duration > 1000ms
// - Keep 100% of traces where http.status_code >= 500
// - Keep 1% of normal traces (baseline)
// This trace (3200ms) would ALWAYS be captured

// Adding retry.count attribute:
async function callWithRetry(url: string, maxRetries = 2) {
  const span = tracer.startSpan('fraud-api-call');
  let retries = 0;
  try {
    while (retries <= maxRetries) {
      try {
        return await fetch(url, { signal: AbortSignal.timeout(500) });
      } catch { retries++; }
    }
  } finally {
    span.setAttribute('retry.count', retries);
    span.end();
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the relationship between a trace and a span?',
    options: [
      'A span contains multiple traces',
      'A trace is a single unit of work; a span is a full request',
      'A trace is the end-to-end request; spans are individual units of work within it',
      'They are synonymous',
    ],
    answer: 2,
    explanation: 'A trace represents one full request across all services. Spans are the individual operations within that trace — each service creates spans, linked via parent span ID into a tree structure.',
  },
  {
    q: 'Tail-based sampling is preferred over head-based because?',
    options: [
      'It is faster to implement',
      'It decides to keep a trace after all spans arrive, so it can always capture errors and slow traces',
      'It samples more traces overall',
      'It requires no configuration',
    ],
    answer: 1,
    explanation: 'Head-based sampling decides at the start — it may drop a trace that turns out to be an error or slow. Tail-based sampling buffers all spans and decides after the full trace is known, keeping all errors and latency outliers.',
  },
  {
    q: 'The W3C traceparent header format is?',
    options: [
      'traceId:spanId:flags',
      'X-B3-TraceId + X-B3-SpanId (separate headers)',
      'version-traceId-parentId-flags (single header)',
      'bearer-token:traceId',
    ],
    answer: 2,
    explanation: 'W3C traceparent: `00-<16-byte-traceId>-<8-byte-parentId>-<flags>` in a single header. Example: `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`. This replaced the older Zipkin B3 multi-header format.',
  },
  { q: 'What is a trace in distributed tracing?', options: ['A log entry for each HTTP request on a single server', 'A collection of spans that together represent an end-to-end request as it flows through multiple services', 'A snapshot of all active database queries at a point in time', 'A record of network packets between microservices'], answer: 1, explanation: 'A trace represents the complete journey of a single request through a distributed system. It consists of multiple spans, each representing a unit of work in one service: receiving the HTTP request, calling a downstream service, querying a database. Spans are linked by a shared trace ID propagated via HTTP headers. Visualized as a tree or waterfall diagram, a trace shows the full call path, parallel operations, and where time was spent. Tracing is essential for identifying which service in a chain is responsible for high latency in a microservices architecture.' },
  { q: 'What is a sampling strategy in distributed tracing and why is it needed?', options: ['Sampling selects which users to test a new feature with', 'Tracing every request would produce too much data; sampling collects traces for only a fraction of requests to manage volume', 'Sampling in tracing refers to how often metrics are collected from services', 'Sampling selects which spans within a trace are recorded for storage'], answer: 1, explanation: 'Tracing every request in a high-traffic system would generate enormous data volumes and add overhead to every request. Sampling strategies: head-based sampling makes the decision at the start of a request, typically sampling a fixed percentage like 1%. Tail-based sampling waits until the trace completes and makes the sampling decision based on outcomes, keeping 100% of error traces and slow traces. Adaptive sampling adjusts the rate based on current traffic volume. Most production systems use head-based sampling for simplicity and tail-based for capturing anomalous requests.' },
  { q: 'How does context propagation work in distributed tracing?', options: ['Each service independently generates a new trace ID for its own requests', 'The trace ID and span ID are propagated via HTTP headers from service to service as each request travels downstream', 'Context propagation is handled automatically by the network layer without application code involvement', 'Distributed tracing does not require context propagation; spans are correlated by timestamp'], answer: 1, explanation: 'Context propagation transmits trace context (trace ID, parent span ID, sampling decision) from service to service via HTTP request headers or message metadata. The W3C Trace Context standard defines the traceparent header format. OpenTelemetry instrumentation libraries handle injection (adding headers to outgoing requests) and extraction (reading headers from incoming requests). Without propagation, each service generates its own isolated spans that cannot be correlated into a single trace.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between distributed tracing and logging?',
    a: 'Logs record discrete events (errors, state changes) from a single process. Traces track the flow of a single request across multiple services over time. Logs answer "what happened?"; traces answer "where did the latency come from across all services?". They complement each other — include trace IDs in logs to link the two.',
  },
  {
    q: 'How do I choose between Jaeger, Zipkin, and Grafana Tempo?',
    a: 'Jaeger: mature, full-featured UI, good for getting started. Supports OTLP natively since v1.35. Zipkin: older, simpler, limited UI. Still widely used but OTel support is weaker. Grafana Tempo: best for high-scale (no indexing — trace IDs stored in object store like S3). Integrates with Grafana for unified traces + metrics + logs. For new systems: use OTel SDK → any backend; Tempo+Grafana is the modern default for Kubernetes.',
  },
  { q: 'How do you choose between Jaeger, Zipkin, and OpenTelemetry Collector for distributed tracing?', a: 'OpenTelemetry is the de facto standard for instrumentation: use OpenTelemetry SDKs to instrument your services, then export telemetry to any backend via the OpenTelemetry Collector. This decouples instrumentation from the backend choice. Jaeger is a mature open-source backend designed for high-volume trace storage and analysis, with a powerful query UI and deep search capabilities. Zipkin is older and simpler, with lower operational overhead. Commercial backends like Datadog APM, Honeycomb, and AWS X-Ray add ML-powered anomaly detection and better integration with other observability signals. Instrument with OpenTelemetry, evaluate backends based on your scale and budget.' },
  { q: 'How do you use distributed traces to find performance bottlenecks?', a: 'Start with traces for your slowest or most frequently slow requests, filtered by P99 latency. The waterfall view shows the critical path: the sequence of sequential spans that determines total latency. Focus on the longest spans in the critical path. Check for: unnecessary sequential calls that could be parallelized, N+1 query patterns where a loop makes one DB call per item, high database query latency indicating missing indexes, and external service calls with high latency or retries. Tail latency analysis identifies whether slowness is consistent across all requests or affects only a subset, which points to resource contention, GC pauses, or specific data patterns.' },
  { q: 'How do you correlate distributed traces with logs and metrics?', a: 'Correlation unlocks the full power of observability. Include the trace ID and span ID in every log line emitted during a request, using structured logging fields not just a message string. Log aggregation tools like the ELK stack or Loki can then filter logs by trace ID, jumping from a trace to the exact logs emitted during that request. Correlate with metrics by including trace context in exemplars: sample metric data points annotated with the trace ID that generated the metric value. Grafana and Prometheus support exemplars, letting you jump from a spike in a metric graph directly to a representative trace. This three-pillar correlation reduces MTTR by removing the guesswork of which log lines correspond to a specific failing request.' },
  { q: 'What is the overhead of distributed tracing instrumentation and how do you minimize it?', a: 'Tracing overhead comes from: context propagation (adding headers to every outbound request), span creation and attribute setting, and network egress sending trace data to the collector. With proper sampling, overhead is typically under 1% CPU and memory. To minimize: use asynchronous export so traces are sent to the collector in a background thread without blocking the request thread. Use batch export to send spans in bulk rather than one at a time. Lower the sampling rate for high-traffic low-value endpoints. Use the OTLP protocol which is more efficient than Zipkin JSON format. Head-based sampling makes the decision immediately on request start, so uninstrumented requests skip all span creation entirely.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Trace = request across all services; spans = individual ops linked by trace ID propagated in W3C traceparent header; OTel is the vendor-neutral SDK.',
  mustKnow: [
    'Trace: end-to-end request; Span: unit of work with start/duration/parent',
    'Trace ID propagated via W3C traceparent header across all services and queues',
    'OpenTelemetry: unified SDK for traces + metrics + logs; vendor-neutral',
    'Head sampling: decide at start (fast, may miss errors)',
    'Tail sampling: decide after full trace (keeps all errors + slow traces)',
    'Always include trace ID in log lines — links logs to traces',
  ],
  interviewFocus: [
    'Explain trace → span hierarchy and how context propagates across services',
    'Head vs tail sampling: which to use and why tail is better for production',
    'How to debug a slow request using a distributed trace waterfall',
    'OTel: what it replaces (Jaeger SDK, Zipkin SDK) and why vendor-neutral matters',
  ],
};

@Component({
  selector: 'app-sysdesign-distributed-tracing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './distributed-tracing.html',
  styleUrl: './distributed-tracing.scss',
})
export class SysdesignDistributedTracing {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
