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
  { name: 'Trace',        type: 'keyword', desc: 'Complete end-to-end record of one request — a tree of spans across all services involved.' },
  { name: 'Span',         type: 'keyword', desc: 'One unit of work: service + operation name + start time + duration + attributes + status + events.' },
  { name: 'Parent span',  type: 'keyword', desc: 'The span that caused the current span — forms the tree structure. Root span has no parent.' },
  { name: 'SpanContext',  type: 'keyword', desc: 'Immutable traceId + spanId — propagated across network calls so child spans in other services know their parent.' },
  { name: 'Jaeger',       type: 'keyword', desc: 'Open-source distributed tracing backend by Uber. Stores traces, provides search and flamegraph UI. Part of CNCF.' },
  { name: 'Tempo',        type: 'keyword', desc: 'Grafana\'s trace storage backend — object-storage based, cost-effective, queried via TraceQL. Integrates natively with Grafana.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What Distributed Tracing Solves',
    points: [
      'In a monolith, a slow function call is easy to profile — it\'s all in one process. In microservices, a user request may touch 10 services. Which one is slow? Which database query is the bottleneck?',
      'Metrics can tell you "p99 latency of checkout API is 3s". They cannot tell you which service or operation within checkout is responsible. Logs require manual correlation across 10 service log streams.',
      'Distributed traces capture the complete request journey — every service adds a span, and the spans form a tree. The trace UI shows exactly which span took how long, in what order, and what attributes it had.',
      'Traces answer the questions that metrics can\'t: "Where did the 2 seconds go?" → "payment-service DB query: 1.8s" → root cause identified without guessing.',
    ],
  },
  {
    heading: 'Trace Structure: Spans and Relationships',
    points: [
      'Root span: the first span, created by the service that received the user request (e.g., API gateway). It has no parent span. Its spanId becomes the parentSpanId for every service it calls.',
      'Child spans: created when a service makes an outbound call — HTTP to another service, database query, cache lookup, message publish. Each child records the operation and links to the caller\'s span as parent.',
      'Span events: timestamped events within a span — e.g., "cache miss", "retry attempt 2", "started serialising". Useful for recording significant moments within a long operation.',
      'Span status: OK or ERROR. Set status to ERROR (with message) when the operation fails. Tracing backends can then filter for failed spans to find root causes.',
    ],
  },
  {
    heading: 'Sampling Strategies',
    points: [
      'Tracing every request is expensive — 1000 req/s × 100 spans × 2KB = 200MB/s of trace data. Sampling reduces this volume to a representative subset.',
      'Head sampling: at the first span, decide whether to trace this request. Simple and cheap — but you may drop traces for slow/error requests that you specifically want to keep.',
      'Tail sampling: wait until the trace is complete, then decide based on the outcome. Keep all traces with errors or latency > threshold. Sample down healthy fast traces.',
      'Adaptive sampling: vary the sampling rate based on traffic. At low traffic, trace 100%; at high traffic, sample down to 1% or 10% for common paths. Preserves detail when traffic is low.',
    ],
  },
  {
    heading: 'Reading a Trace Flamegraph',
    points: [
      'Each row in the flamegraph is a service/span. Horizontal position = time. Width = duration. Children are nested under parents.',
      'Critical path: the sequence of spans that determines the total request duration. Find the widest child at each level — that\'s where the time goes.',
      'Parallel vs sequential: spans at the same level that overlap in time are parallel (concurrent). Spans that follow sequentially add their durations. Sequential calls that could be parallelised are common optimisation opportunities.',
      'Gaps between spans: time between parent and child span start can represent network latency (serialisation, TCP, etc.) or time in a queue before processing begins.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Trace Flow Example',
    language: 'typescript',
    code: `// Checkout request flowing through 4 services
// Each service creates spans; they form a tree via traceId + parentSpanId

// ── REQUEST TIMELINE ─────────────────────────────────────────────
// traceId: abc123

// 1. API Gateway (root span)
{
  traceId: 'abc123',
  spanId: 's1',         parentSpanId: null,         // ← root: no parent
  service: 'api-gateway',
  operation: 'POST /checkout',
  start: 0, duration: 1200,  // 1200ms total
  status: 'OK',
}

// 2. Order Service (called by API Gateway)
{
  traceId: 'abc123',
  spanId: 's2',         parentSpanId: 's1',          // ← parent = gateway
  service: 'order-service',
  operation: 'createOrder',
  start: 10, duration: 1180,  // most of the time is here
  status: 'OK',
}

// 3. DB query (within Order Service)
{
  traceId: 'abc123',
  spanId: 's3',         parentSpanId: 's2',
  service: 'order-service',
  operation: 'db:INSERT orders',
  start: 15, duration: 50,
  attributes: { 'db.system': 'postgresql', 'db.statement': 'INSERT INTO orders...' },
}

// 4. Payment Service (called by Order Service)
{
  traceId: 'abc123',
  spanId: 's4',         parentSpanId: 's2',
  service: 'payment-service',
  operation: 'chargeCard',
  start: 70, duration: 1100,  // ← 1100ms! This is the bottleneck
  status: 'OK',
}

// 5. Stripe API (called by Payment Service)
{
  traceId: 'abc123',
  spanId: 's5',         parentSpanId: 's4',
  service: 'payment-service',
  operation: 'http:POST api.stripe.com',
  start: 75, duration: 1090,  // ← Stripe is slow — network or their API
  attributes: { 'http.url': 'https://api.stripe.com/v1/charges', 'http.status_code': 200 },
}

// Flamegraph view:
// [─────────────── API Gateway (1200ms) ────────────────]
//   [──────────────── Order Service (1180ms) ──────────────]
//     [DB 50ms] [──── Payment Service (1100ms) ────────]
//                   [──── Stripe HTTP (1090ms) ──────]
// Root cause: Stripe API taking 1.09s → consider async payment or timeout tuning`,
  },
  {
    label: 'Trace Search Queries (Jaeger/Tempo)',
    language: 'typescript',
    code: `# ── JAEGER SEARCH ─────────────────────────────────────────────────
# Find all traces for checkout with duration > 1s in last 2h
service: order-service
operation: POST /checkout
min_duration: 1s
lookback: 2h

# Find traces that have an ERROR span
tags: error=true

# Find a specific user's trace
tags: userId=usr_42

# ── TEMPO / TRACEQL ───────────────────────────────────────────────

# Find spans in payment-service that took > 500ms
{ .service.name = "payment-service" && duration > 500ms }

# Find traces where any span errored
{ status = error }

# Find traces where payment-service was slow AND had error
{ .service.name = "payment-service" && duration > 1s && status = error }

# Structural query: find traces where order-service called payment-service
{ .service.name = "order-service" } >> { .service.name = "payment-service" }

# Find traces with specific attribute
{ span.db.statement =~ ".*orders.*" && duration > 100ms }

# ── GRAFANA TEMPO METRICS FROM TRACES ─────────────────────────────
# Rate of traced requests per service
rate({ .service.name = "order-service" }[5m])

# p99 latency from spans
histogram_quantile(0.99, { .service.name = "api-gateway" })`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not setting span status to ERROR on failures',
    wrong: `span.end(); // span ends without error status
// Trace shows the span as "OK" even though it threw
// Jaeger/Tempo query for error spans misses this failure
// Root cause of incident is invisible in traces`,
    right: `try {
  await processPayment(order);
} catch (err) {
  span.recordException(err as Error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
} finally {
  span.end();
}
// Trace correctly shows this span as ERROR — findable by error filter`,
    explanation: 'Distributed tracing backends let you filter for traces with ERROR spans — the fastest way to find failing requests during an incident. If spans don\'t have their status set to ERROR on failures, the error filter finds nothing and traces appear successful. Always set span status to ERROR and call recordException() when an operation fails.',
  },
  {
    title: 'Creating spans for trivial operations — span explosion',
    wrong: `// Creating a span for every function call — thousands of tiny spans per request
async function getUser(id: string) {
  const span = tracer.startSpan('getUser');  // 0.2ms function — not worth tracing
  const user = cache.get(id);
  span.end();
  return user;
}
// 500 tiny spans per request → trace is unreadable, storage explodes`,
    right: `// Only span operations with meaningful latency or diagnostic value
// Auto-instrumented: HTTP, database, Redis, gRPC — these are always worth it
// Manual spans: business operations taking > ~10ms or with business context
async function processCheckout(cart: Cart): Promise<Order> {
  return tracer.startActiveSpan('checkout.process', async span => {
    // This span matters: 100-2000ms, crosses multiple sub-systems
    try { return await doCheckout(cart); }
    finally { span.end(); }
  });
}`,
    explanation: 'Auto-instrumentation creates spans for every HTTP call and database query — which is appropriate. Creating additional manual spans for every small helper function produces thousands of spans per request. The trace becomes a wall of tiny spans that is impossible to read. Create manual spans only for significant business operations or operations with notable latency (> ~10ms).',
  },
  {
    title: 'Not adding business attributes to spans',
    wrong: `// Span has only auto-instrumented HTTP attributes
{
  "operation": "POST /orders",
  "http.method": "POST",
  "http.status_code": 201,
  "duration": 145
}
// Cannot search for "all orders over $1000" in traces
// Cannot find "all traces for customer X" from the trace UI`,
    right: `// Add business context to the root span
span.setAttributes({
  'order.id': order.id,
  'order.total': order.total,
  'order.item_count': cart.items.length,
  'customer.id': customer.id,
  'customer.tier': customer.tier,      // 'premium'|'standard'
  'payment.provider': 'stripe',
});
// Now searchable: { span.order.total > 1000 } or { span.customer.tier = "premium" }`,
    explanation: 'Auto-instrumented spans capture HTTP and database metadata but nothing about your business domain. Without adding business attributes (orderId, customerId, order total), traces are hard to correlate with specific users or orders during an incident. Add 3-5 business attributes to root spans and significant child spans — they enable filtering by business context in Jaeger/Tempo.',
  },
  {
    title: 'Head sampling with a random rate — dropping all error traces',
    wrong: `// 10% head sampling — random coin flip at trace start
// No knowledge of outcome when decision is made
// Expected: 90% of errors sampled away (10% kept)
// During incident: 90% of error traces are gone
// You see 10 error traces out of 100 — incomplete picture`,
    right: `// Tail sampling in OTel Collector:
tail_sampling:
  decision_wait: 10s
  policies:
    - name: keep-all-errors
      type: status_code
      status_code: { status_codes: [ERROR] }   # keep 100% of errors
    - name: keep-slow
      type: latency
      latency: { threshold_ms: 1000 }          # keep 100% of slow traces
    - name: sample-success
      type: probabilistic
      probabilistic: { sampling_percentage: 10 } # sample 10% of success`,
    explanation: 'Head sampling makes the keep/drop decision before the trace outcome is known. During incidents, a 10% head sample rate means 90% of error traces are dropped — exactly when you need them most. Use tail sampling in the OTel Collector: wait for the trace to complete, then keep 100% of errors and slow requests, and sample down only healthy fast traces.',
  },
];

const challenge: Challenge = {
  title: 'Build a span tree printer',
  language: 'typescript',
  description: `Implement printSpanTree(spans: Span[], rootSpanId: string): string[]
Print the span tree as indented lines, depth-first.
Each line: "  ".repeat(depth) + span.operation + " (" + span.duration + "ms)"
Span children = spans where parentSpanId === span.spanId`,
  hints: ['Recursive DFS from root span', 'Find children by filtering on parentSpanId'],
  starterCode: `interface Span {
  spanId: string;
  parentSpanId: string | null;
  operation: string;
  duration: number;
}

function printSpanTree(spans: Span[], rootSpanId: string): string[] {
  return [];
}

const spans: Span[] = [
  { spanId: 's1', parentSpanId: null,  operation: 'POST /checkout', duration: 1200 },
  { spanId: 's2', parentSpanId: 's1',  operation: 'createOrder',    duration: 1180 },
  { spanId: 's3', parentSpanId: 's2',  operation: 'db:INSERT',      duration: 50 },
  { spanId: 's4', parentSpanId: 's2',  operation: 'chargeCard',     duration: 1100 },
];

printSpanTree(spans, 's1').forEach(l => console.log(l));`,
  solution: `interface Span {
  spanId: string;
  parentSpanId: string | null;
  operation: string;
  duration: number;
}

function printSpanTree(spans: Span[], rootSpanId: string): string[] {
  const lines: string[] = [];
  function dfs(spanId: string, depth: number) {
    const span = spans.find(s => s.spanId === spanId);
    if (!span) return;
    lines.push('  '.repeat(depth) + span.operation + ' (' + span.duration + 'ms)');
    const children = spans.filter(s => s.parentSpanId === spanId);
    for (const child of children) dfs(child.spanId, depth + 1);
  }
  dfs(rootSpanId, 0);
  return lines;
}

const spans: Span[] = [
  { spanId: 's1', parentSpanId: null,  operation: 'POST /checkout', duration: 1200 },
  { spanId: 's2', parentSpanId: 's1',  operation: 'createOrder',    duration: 1180 },
  { spanId: 's3', parentSpanId: 's2',  operation: 'db:INSERT',      duration: 50 },
  { spanId: 's4', parentSpanId: 's2',  operation: 'chargeCard',     duration: 1100 },
];
printSpanTree(spans, 's1').forEach(l => console.log(l));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A checkout request takes 1.2s. The flamegraph shows: API Gateway (1.2s) → Order Service (1.18s) → Payment Service (1.1s) → Stripe HTTP (1.09s). Where is the bottleneck?',
    options: [
      'API Gateway — it has the longest duration and should be optimised first',
      'Order Service — it is spending most of the 1.18s processing',
      'Stripe HTTP call — 1.09s of the 1.1s in Payment Service is the Stripe API latency',
      'The database query — databases are always the bottleneck in e-commerce',
    ],
    answer: 2,
    explanation: 'In a flamegraph, child spans are contained within parent spans. The Stripe HTTP span (1.09s) accounts for nearly all of the Payment Service span (1.1s), which in turn accounts for nearly all of the Order Service span (1.18s). The critical path is: Gateway → Order → Payment → Stripe. 1.09 of the 1.2 seconds is spent waiting for Stripe. Solutions: implement async payment processing, add a circuit breaker with timeout, or investigate Stripe API latency.',
  },
  {
    q: 'What is the advantage of tail sampling over head sampling for production tracing?',
    options: [
      'Tail sampling is faster to implement — it requires no code changes in the application',
      'Tail sampling makes the keep/drop decision after the trace completes, allowing 100% retention of errors and slow traces while sampling down healthy traces',
      'Tail sampling reduces the number of spans created per trace, lowering CPU usage in the application',
      'Tail sampling automatically strips PII from trace attributes before storage',
    ],
    answer: 1,
    explanation: 'Head sampling makes a random decision at the start of a trace before the outcome is known. A 10% head sample rate means 90% of error traces are dropped — worst case during incidents. Tail sampling in the OTel Collector buffers complete traces and then decides: keep all ERROR spans, keep all slow traces, sample down successful fast traces. This preserves exactly the traces you need for debugging while reducing volume from healthy traffic.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between Jaeger and Tempo for trace storage?',
    a: '<strong>Jaeger</strong> (CNCF project, originally from Uber): stores traces in its own storage (Cassandra, Elasticsearch, BadgerDB). Has a built-in query UI with service dependency graphs, trace search, and comparison features. More self-contained — easier to get started. Better for smaller-scale deployments where you want a single trace tool with its own UI.<br><br><strong>Grafana Tempo</strong>: stores traces in object storage (S3, GCS, Azure Blob) — extremely cost-effective at scale. Has no built-in UI — queries through Grafana Explore. Uses TraceQL for structured span queries. Native integration with Grafana dashboards, exemplars, and Loki log linking. Best when you already use Grafana and want unified observability (metrics + logs + traces in one interface).<br><br>Recommendation: Tempo if you use Grafana (most teams do). Jaeger if you want a standalone trace UI without Grafana, or if you need Elasticsearch-backed trace search.',
  },
  {
    q: 'How do traces interact with asynchronous communication (Kafka messages)?',
    a: 'Asynchronous communication breaks the default HTTP context propagation — the Kafka consumer runs in a different process after the producer has completed. OTel provides explicit carrier APIs for this: <ol><li><strong>Producer side</strong>: before publishing, call `propagation.inject(context.active(), messageHeaders, carrier)` to inject the W3C traceparent into message headers.</li><li><strong>Consumer side</strong>: when processing a message, call `propagation.extract(context.ROOT_CONTEXT, messageHeaders, carrier)` to extract the trace context, then start a new span with this as the parent: `tracer.startSpan(\'process.message\', { kind: SpanKind.CONSUMER }, extractedContext)`.</li></ol>The resulting trace shows: producer span → asynchronous gap → consumer span, connected by the same traceId. In Jaeger/Tempo, the consumer span appears as a child of the producer span (separated in time). This lets you trace a user action across a Kafka event boundary — critical for diagnosing end-to-end latency in event-driven architectures.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Distributed trace = tree of spans across services. Root span → child spans linked by traceId + parentSpanId. Tail sample to keep 100% errors. Add business attributes for searchability.',
  mustKnow: [
    'Trace = tree of spans; each service adds a child span under the caller\'s span using traceId + parentSpanId',
    'Span status must be set to ERROR on failures — otherwise error filter in Jaeger/Tempo finds nothing',
    'Add business attributes to spans (orderId, customerId, total) — enables business-context trace search',
    'Tail sampling (in OTel Collector): keep 100% errors/slow traces, sample down healthy traces — never miss critical traces',
    'Flamegraph critical path: widest span at each level = bottleneck. Gaps between spans = network/queue latency.',
    'Kafka/async propagation: inject traceparent into message headers; extract and link on consumer side',
  ],
  interviewFocus: [
    'How do spans form a trace tree? What fields connect them?',
    'What is tail sampling and why is it better than head sampling for production?',
    'How do you propagate trace context across a Kafka message boundary?',
  ],
};

@Component({
  selector: 'app-obs-distributed-tracing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './distributed-tracing.html',
  styleUrl: './distributed-tracing.scss',
})
export class ObsDistributedTracing {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
