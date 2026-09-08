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
  { name: 'TracerProvider',    type: 'keyword', desc: 'Global factory for Tracer instances. Configure once with resource, sampler, and exporters.' },
  { name: 'Tracer',            type: 'keyword', desc: 'Named tracer instance — one per instrumentation library or module. Obtain via trace.getTracer(name, version).' },
  { name: 'startActiveSpan',   type: 'keyword', desc: 'Starts a span AND sets it as the active span in context. Child spans created inside the callback are automatically linked.' },
  { name: 'context.with()',     type: 'keyword', desc: 'Binds a context to an async operation. Use when startActiveSpan\'s callback scope isn\'t sufficient (Kafka, event handlers).' },
  { name: 'SpanKind',          type: 'keyword', desc: 'INTERNAL, SERVER, CLIENT, PRODUCER, CONSUMER — hints to the backend about the span\'s role in the request flow.' },
  { name: 'Semantic conventions', type: 'keyword', desc: 'OTel standard attribute names: http.method, db.system, messaging.system. Use these for consistent dashboards across teams.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'OTel Tracing API vs SDK',
    points: [
      'The OTel Tracing API (`@opentelemetry/api`) is the interface — instrument your code against it. No concrete implementation, no backend dependency.',
      'The OTel Tracing SDK (`@opentelemetry/sdk-trace-node`) is the implementation — it actually creates and exports spans. Configure it once at startup.',
      'Libraries instrument against the API. Applications configure the SDK. This separation means library authors don\'t force an implementation on consumers, and application code can swap SDKs without changing library code.',
      'Noop API: if your app uses a library that is instrumented with OTel but you haven\'t configured the SDK, spans are created as no-ops — zero overhead, no errors. The SDK is optional from the library\'s perspective.',
    ],
  },
  {
    heading: 'Context and Propagation',
    points: [
      'OTel context is an immutable key-value store that propagates implicitly through async code (using AsyncLocalStorage under the hood in Node.js).',
      'Active span: when you call `startActiveSpan()`, the new span is stored in the current context. Any span created inside the callback automatically uses this span as its parent.',
      'Propagators: read/write trace context from/to carrier objects (HTTP headers, message headers). `propagation.inject()` writes traceparent to outbound request headers. `propagation.extract()` reads it from inbound request headers.',
      'Manual context binding: for event emitters, setTimeout, Kafka consumers — places where async context doesn\'t automatically flow — use `context.with(ctx, callback)` to bind a specific context to the operation.',
    ],
  },
  {
    heading: 'Span Kinds and Semantic Conventions',
    points: [
      'SpanKind.SERVER: the span represents a server handling an inbound request (Express route handler). SpanKind.CLIENT: calling an external service.',
      'SpanKind.PRODUCER/CONSUMER: for message queues. PRODUCER is the span that publishes; CONSUMER is the span that processes.',
      'SpanKind.INTERNAL: work inside a single process that doesn\'t cross a network boundary.',
      'Semantic conventions define standard attribute names for common operations: `http.method`, `http.status_code`, `db.system`, `db.statement`, `messaging.system`, `messaging.destination`. Using these ensures your spans appear correctly in Grafana/Jaeger dashboards without custom configuration.',
    ],
  },
  {
    heading: 'Advanced: Baggage',
    points: [
      'Baggage is user-defined key-value data that propagates alongside trace context. Unlike span attributes (local to one span), baggage flows through the entire trace — every downstream service can read it.',
      'Use case: propagate business context (tenantId, featureFlag, userId) from the inbound request to all downstream services without adding it to every function signature.',
      'Caution: baggage is transmitted in HTTP headers to EVERY downstream service — including third-party services. Never put sensitive data (tokens, PII) in baggage. Size limit: typically 8KB.',
      'Access baggage: `propagation.getBaggage(context.active())?.getEntry(\'tenantId\')?.value`.',
    ],
  },
  {
    heading: 'OpenTelemetry Tracing Architecture',
    points: [
      'OpenTelemetry provides a vendor-neutral standard for generating and exporting traces — instrumenting an application once with the OpenTelemetry SDK lets you export traces to any compatible backend (Jaeger, Zipkin, Datadog, Honeycomb) without re-instrumenting the application if you later switch backends.',
      'Automatic instrumentation (via language-specific agents or libraries that patch common frameworks — HTTP clients, database drivers) generates spans for common operations without any manual code changes, while manual instrumentation (explicitly creating spans in application code) captures business-specific operations the automatic instrumentation cannot know about.',
      'The OpenTelemetry Collector is a separate, standalone service that receives telemetry data from applications, can process/transform/filter it, and exports it to one or more backends — decoupling applications from directly depending on a specific backend\'s SDK and enabling centralized telemetry pipeline configuration.',
      'Context propagation across service boundaries (via the W3C Trace Context standard) is handled automatically by OpenTelemetry\'s instrumentation libraries for common protocols (HTTP, gRPC) — critical for stitching together a complete distributed trace across every service a request touches, without manual header-passing code in every service.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Advanced Manual Tracing',
    language: 'typescript',
    code: `import {
  trace, context, propagation, SpanKind, SpanStatusCode, Attributes
} from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

const tracer = trace.getTracer('order-service', '2.1.0');

// ── startActiveSpan (preferred — handles context automatically) ───
async function processOrder(orderId: string) {
  return tracer.startActiveSpan(
    'order.process',
    { kind: SpanKind.INTERNAL },
    async (span) => {
      span.setAttributes({ 'order.id': orderId, 'service.layer': 'business' });
      try {
        const result = await doProcessing(orderId); // child spans auto-link
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
        throw err;
      } finally {
        span.end(); // always end — startActiveSpan does NOT auto-end
      }
    }
  );
}

// ── HTTP CLIENT: add SpanKind.CLIENT and semantic attributes ──────
async function callPaymentService(orderId: string, amount: number) {
  return tracer.startActiveSpan(
    'http.request',
    { kind: SpanKind.CLIENT },
    async (span) => {
      span.setAttributes({
        [SemanticAttributes.HTTP_METHOD]: 'POST',
        [SemanticAttributes.HTTP_URL]:    'https://payment-service/charge',
        'order.id': orderId,
        'payment.amount': amount,
      });
      try {
        // fetch auto-injects traceparent if instrumented — or do it manually:
        const activeCtx = context.active();
        const headers: Record<string, string> = {};
        propagation.inject(activeCtx, headers);

        const res = await fetch('https://payment-service/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ orderId, amount }),
        });
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, res.status);
        if (!res.ok) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: \`HTTP \${res.status}\` });
        }
        return res;
      } finally {
        span.end();
      }
    }
  );
}

// ── SPAN EVENTS: record timestamped events within a span ──────────
async function processWithRetry(orderId: string) {
  return tracer.startActiveSpan('order.processWithRetry', async (span) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        span.addEvent('retry.attempt', { 'retry.count': attempts });
        const result = await processOrder(orderId);
        span.addEvent('retry.succeeded', { 'retry.count': attempts });
        span.end();
        return result;
      } catch {
        attempts++;
        if (attempts === 3) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Max retries exceeded' });
          span.end();
          throw new Error('Max retries exceeded');
        }
      }
    }
  });
}`,
  },
  {
    label: 'Kafka Context Propagation',
    language: 'typescript',
    code: `import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import { KafkaMessage } from 'kafkajs';

// ── PRODUCER: inject trace context into message headers ───────────
async function publishOrderEvent(orderId: string) {
  const tracer = trace.getTracer('order-service');
  return tracer.startActiveSpan(
    'kafka.publish',
    { kind: SpanKind.PRODUCER },
    async (span) => {
      span.setAttributes({
        'messaging.system': 'kafka',
        'messaging.destination': 'orders.created',
        'messaging.destination_kind': 'topic',
        'order.id': orderId,
      });

      // Inject current trace context into Kafka message headers
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);

      try {
        await kafka.producer().send({
          topic: 'orders.created',
          messages: [{
            value: JSON.stringify({ orderId }),
            headers,  // ← trace context travels in headers
          }],
        });
      } finally {
        span.end(); // finally — a broker/network failure must still end the span
      }
    }
  );
}

// ── CONSUMER: extract trace context from message headers ──────────
async function handleOrderEvent(message: KafkaMessage) {
  const tracer = trace.getTracer('notification-service');

  // Extract parent context from message headers
  const carrier: Record<string, string> = {};
  for (const [key, value] of Object.entries(message.headers ?? {})) {
    carrier[key] = value?.toString() ?? '';
  }
  const parentContext = propagation.extract(context.ROOT_CONTEXT, carrier);

  // Start consumer span as child of producer span (across process boundary)
  return context.with(parentContext, () =>
    tracer.startActiveSpan(
      'kafka.consume',
      { kind: SpanKind.CONSUMER },
      async (span) => {
        span.setAttributes({
          'messaging.system': 'kafka',
          'messaging.source': 'orders.created',
        });
        try {
          const payload = JSON.parse(message.value!.toString());
          await sendOrderConfirmationEmail(payload.orderId);
          span.end();
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.end();
          throw err;
        }
      }
    )
  );
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Calling tracer.startSpan() without making it active in context',
    wrong: `// startSpan creates a span but does NOT set it as the active context span
const span = tracer.startSpan('my-operation');
await dbQuery(); // auto-instrumented DB call creates a new span
// DB span has NO parent — it thinks it's a root span
// Trace is broken — DB call is disconnected from the business operation`,
    right: `// startActiveSpan sets the span as active — child spans automatically link
tracer.startActiveSpan('my-operation', async (span) => {
  await dbQuery(); // DB span's parent = 'my-operation' span — linked correctly
  span.end();
});
// Or with startSpan: context.with(trace.setSpan(context.active(), span), () => ...)`,
    explanation: '`tracer.startSpan()` creates a span but does not set it as the active span in the async context. Auto-instrumented library calls (Express, pg, Redis) read the active context to find their parent. Without the span being active, they create orphan root spans — breaking the trace tree. Always use `startActiveSpan()` for spans whose children should be automatically linked.',
  },
  {
    title: 'Not using semantic convention attribute names',
    wrong: `span.setAttributes({
  method: 'POST',        // should be http.method
  url: '/orders',        // should be http.url
  dbQuery: 'SELECT...',  // should be db.statement
  dbType: 'postgres',    // should be db.system
});
// Grafana/Jaeger dashboards that filter on http.method find nothing
// Service maps that look for db.system don't categorise spans correctly`,
    right: `import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
span.setAttributes({
  [SemanticAttributes.HTTP_METHOD]:    'POST',
  [SemanticAttributes.HTTP_URL]:       '/orders',
  [SemanticAttributes.DB_STATEMENT]:   'SELECT...',
  [SemanticAttributes.DB_SYSTEM]:      'postgresql',
});
// Standard attribute names → standard dashboard panels work out of the box`,
    explanation: 'OTel semantic conventions define standard attribute names for common operations (http.method, db.system, db.statement, messaging.system). Backend tools (Grafana Service Maps, Jaeger service dependency graphs) use these standard names to automatically categorise spans. Using custom attribute names means these features don\'t work without custom configuration. Always import and use SemanticAttributes constants.',
  },
  {
    title: 'Not configuring a resource for the TracerProvider',
    wrong: `const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: '...' }),
  // No resource — all spans have no service name
});
// In Jaeger: service name = "unknown_service"
// Cannot filter traces by service — all traces in one bucket`,
    right: `const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:    'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '2.1.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
  }),
  traceExporter: new OTLPTraceExporter({ url: '...' }),
});
// All spans tagged with service.name, version, env — filterable in Jaeger`,
    explanation: 'The Resource describes the service emitting the telemetry. Without configuring a Resource with SERVICE_NAME, all your spans appear in Jaeger/Tempo as "unknown_service" — making it impossible to filter by service or build service dependency maps. Always configure SERVICE_NAME (and optionally SERVICE_VERSION and DEPLOYMENT_ENVIRONMENT) in the TracerProvider Resource.',
  },
  {
    title: 'Recording errors with span.setAttribute instead of span.recordException',
    wrong: `} catch (err) {
  span.setAttribute('error', true);
  span.setAttribute('error.message', (err as Error).message);
  // No stack trace, no exception type recorded
  // Jaeger cannot extract structured error info`,
    right: `} catch (err) {
  span.recordException(err as Error); // records type, message, and stack trace
  span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
  // Jaeger/Tempo shows structured exception with full stack trace
}`,
    explanation: '`span.recordException()` creates a span event with the standard OTel exception attributes: `exception.type`, `exception.message`, `exception.stacktrace`. Tracing backends (Jaeger, Tempo) display these as structured exception events with the full stack trace. Setting individual attributes manually loses the structured format and stack trace, making errors harder to investigate.',
  },
];

const challenge: Challenge = {
  title: 'Implement baggage propagation',
  language: 'typescript',
  description: `Implement simple baggage inject/extract functions for HTTP headers:
- injectBaggage(headers: Record<string, string>, baggage: Record<string, string>): void
  Sets headers['baggage'] as comma-separated "key=value" pairs
- extractBaggage(headers: Record<string, string>): Record<string, string>
  Parses headers['baggage'] back to an object. Return {} if missing.

Format: "tenantId=acme,featureFlag=new-checkout"`,
  hints: ['Baggage header format: key=value,key2=value2', 'Split by comma, then split each pair by ='],
  starterCode: `function injectBaggage(
  headers: Record<string, string>,
  baggage: Record<string, string>
): void {}

function extractBaggage(
  headers: Record<string, string>
): Record<string, string> {
  return {};
}

const headers: Record<string, string> = {};
injectBaggage(headers, { tenantId: 'acme', featureFlag: 'new-checkout' });
console.log(headers['baggage']); // tenantId=acme,featureFlag=new-checkout

console.log(extractBaggage(headers)); // { tenantId: 'acme', featureFlag: 'new-checkout' }
console.log(extractBaggage({}));      // {}`,
  solution: `function injectBaggage(
  headers: Record<string, string>,
  baggage: Record<string, string>
): void {
  headers['baggage'] = Object.entries(baggage).map(([k, v]) => \`\${k}=\${v}\`).join(',');
}

function extractBaggage(
  headers: Record<string, string>
): Record<string, string> {
  const raw = headers['baggage'];
  if (!raw) return {};
  return Object.fromEntries(
    raw.split(',').map(pair => {
      const idx = pair.indexOf('=');
      return [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()];
    })
  );
}

const headers: Record<string, string> = {};
injectBaggage(headers, { tenantId: 'acme', featureFlag: 'new-checkout' });
console.log(headers['baggage']);
console.log(extractBaggage(headers));
console.log(extractBaggage({}));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the difference between OTel Baggage and span attributes?',
    options: [
      'Baggage is encrypted while span attributes are stored in plain text',
      'Span attributes are local to one span. Baggage propagates to ALL downstream services in the same trace.',
      'Baggage can only hold string values while span attributes support numbers and booleans',
      'Span attributes are only available during the request. Baggage is persisted to the trace backend.',
    ],
    answer: 1,
    explanation: 'Span attributes are attached to a specific span and visible only in that span\'s record in the trace backend. Baggage is propagated in HTTP headers (baggage header) to every downstream service in the call chain — each service can read the baggage values from the context. This makes baggage useful for propagating cross-cutting context like tenantId or feature flags without changing function signatures. Important: baggage goes to third-party services too — never put secrets in baggage.',
  },
  {
    q: 'When should you use SpanKind.CLIENT vs SpanKind.SERVER for a span?',
    options: [
      'CLIENT for spans in your application\'s frontend; SERVER for spans in your backend',
      'SERVER when your service is handling an inbound request; CLIENT when your service is making an outbound call to another service',
      'CLIENT when the operation reads data; SERVER when the operation writes data',
      'SERVER for synchronous operations; CLIENT for asynchronous operations like Kafka',
    ],
    answer: 1,
    explanation: 'SpanKind indicates the span\'s role from a network perspective, not the application tier. SpanKind.SERVER = "this service is the server in this interaction" — use for spans handling inbound HTTP/gRPC requests (Express route handlers). SpanKind.CLIENT = "this service is the client making an outbound call" — use for spans making HTTP/gRPC calls to other services. Tracing backends use SpanKind to build service dependency maps and identify where time is spent on each side of a service boundary.',
  },
  { q: 'What is a distributed trace and what information does it capture?', options: ['A log file recording all function calls in a single service during a request', 'A hierarchical tree of spans representing the end-to-end journey of a single request across all services, capturing operation names, timing, status, and attributes for each step', 'A Prometheus metric that counts requests passing through each service in the architecture', 'A visualization of network topology showing which services call which other services'], answer: 1, explanation: 'Distributed trace: the complete record of how a single request is processed across all services. Structure: root span — the first operation, typically the HTTP request entering the system. Child spans — operations performed within or called from the parent operation. Each span captures: operation name, service name, start time, duration, status (OK, ERROR, UNSET), attributes (key-value pairs with request details), events (timestamped log-like records within the span), links (references to other traces). Trace context: the trace ID propagates across service boundaries via HTTP headers (W3C traceparent header). Child services create new spans with the same trace ID and a parent span ID. Result: a Gantt chart of the entire request showing how long was spent in each service and operation.' },
  { q: 'What is the W3C traceparent header and why is it important?', options: ['A custom Datadog header for correlating traces across services in a Datadog environment', 'A W3C standard HTTP header (format: version-trace_id-parent_id-flags) for propagating trace context between services, enabling any OTel-compatible service to continue a distributed trace regardless of upstream tracing tool', 'A Kubernetes admission controller that injects trace headers into all pod-to-pod HTTP requests', 'The header used by Zipkin to propagate trace context before the W3C standard existed'], answer: 1, explanation: 'W3C traceparent (W3C Trace Context standard): format: 00-{traceId}-{parentSpanId}-{flags}. traceId: 32 hex chars (128-bit). parentSpanId: 16 hex chars (64-bit). flags: 01 = sampled. Example: traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01. Why it matters: before this standard, every tracing tool used different header names (X-B3-TraceId for Zipkin/Jaeger B3, X-Datadog-Trace-Id, etc.). A request passing through a service using Zipkin and another using Datadog could not correlate traces. The W3C standard: all OTel SDKs support traceparent. All major vendors support it as the primary propagation format. A request can now flow through services using different OTel-compatible SDKs and be correlated in the tracing backend.' },
  { q: 'What is tail-based sampling and how does it differ from head-based sampling?', options: ['Tail-based sampling samples only the last N traces per minute; head-based samples the first N traces per minute', 'Head-based sampling decides whether to sample a trace at the start before seeing the outcome; tail-based sampling buffers the complete trace then makes the sampling decision based on outcome — error, slow, or interesting — retaining all important traces', 'Tail-based sampling is applied in the application SDK; head-based sampling is applied in the Collector', 'Head-based sampling is used in production; tail-based sampling is only used during debugging sessions'], answer: 1, explanation: 'Head-based sampling: make the sampling decision at the root span before the trace completes. Pros: simple, low overhead. Cons: if you set 1% sample rate, that 1% includes errors — but a failing request is exactly what you want to see. You lose the rare important traces. Tail-based sampling: buffer all spans for a trace in the Collector. When the root span arrives (trace complete), evaluate the entire trace. Sampling rules: always keep traces with errors. Always keep traces over a latency threshold. Apply a lower rate to successful, fast traces. Result: 100% of errors and slow traces are retained. Fast, successful traces sampled at 1-5%. Dramatically more signal per dollar of storage. Tradeoff: requires buffering complete traces in the Collector (memory overhead, complexity). Implemented in: OTel Collector tail sampling processor, Grafana Tempo, Honeycomb.' },
  { q: 'What are span attributes and events and when should you add custom ones?', options: ['Span attributes are required OTel fields; span events are optional and rarely used', 'Span attributes are key-value pairs describing the operation context such as user ID, order ID, SQL query, cache hit/miss; span events are timestamped log-like records within the span for significant moments during the span lifetime', 'Span attributes are performance metrics; span events are error records attached to spans', 'Custom span attributes and events should never be added; semantic conventions cover all needed context'], answer: 1, explanation: 'Span attributes: key-value pairs attached to the span describing the operation. Semantic convention attributes set by auto-instrumentation: http.method, db.statement, messaging.destination. Custom attributes to add: business entity IDs (user.id, order.id, product.sku). Feature flag values active during the request. Cache hit/miss results. Number of retries attempted. Business tier or category. Why add custom attributes: they become searchable dimensions in the tracing backend. Find all traces where user.id=12345 and status=ERROR. Span events: timestamped records within a span for significant moments. Cache miss at timestamp T. Retry attempt 2 at T+100ms. Lock acquired at T+200ms. Events give a timeline within the span without creating child spans. When to create child spans vs events: span for operations with meaningful duration and possible failure. Event for instantaneous state changes within an operation.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between startSpan() and startActiveSpan() in OTel?',
    a: '<code>tracer.startSpan(\'name\')</code> creates a new span but does <strong>not</strong> set it as the active span in the current async context. Any spans created inside code after this call will use whatever was previously the active span as their parent — not the span you just created. You must manually call <code>context.with(trace.setSpan(context.active(), span), () => ...)</code> to propagate it.<br><br><code>tracer.startActiveSpan(\'name\', callback)</code> creates the span AND sets it as the active span for the duration of the callback. Any spans created inside the callback — whether by your code or auto-instrumented libraries — automatically use this span as their parent. This is the right default for almost all use cases. The span is NOT automatically ended — you must still call <code>span.end()</code> in a finally block inside the callback.',
  },
  {
    q: 'How do I instrument a legacy codebase that uses callbacks instead of async/await?',
    a: 'OTel context propagation works through AsyncLocalStorage in Node.js, which does support callback-style async code — but you need to be careful about how you bind context. <ol><li><strong>Wrap callback-based functions</strong>: use <code>context.bind(context.active(), callbackFn)</code> to explicitly bind the current context to a callback function before passing it. The callback will then run in the correct async context.</li><li><strong>Use context.with()</strong>: when entering a callback that should propagate the current trace context: <code>context.with(context.active(), () => yourCallback())</code>.</li><li><strong>Promisify first</strong>: convert callback-based APIs to Promises using <code>util.promisify()</code> or manual wrapping, then use <code>startActiveSpan()</code> normally. This is the cleanest approach when refactoring is possible.</li></ol>The key insight: AsyncLocalStorage propagates context across <code>await</code> and <code>Promise.then()</code> automatically, but NOT across plain callbacks unless you explicitly bind or call them within a <code>context.with()</code> scope.',
  },
  { q: 'How do you instrument a new service with distributed tracing from scratch?', a: 'Instrumentation steps: install OTel SDK for your language. Configure the tracer provider in application startup: set the OTLP exporter endpoint (the OTel Collector), the service name, and the sampler. Enable auto-instrumentation: add the auto-instrumentation package for your framework (Spring, Express, ASP.NET Core, Django). This automatically creates spans for incoming HTTP requests and outgoing HTTP, gRPC, and database calls. Verify with logs: start the application and make a request. Confirm spans appear in the Collector debug logs. Check in the tracing UI: open Jaeger or Tempo and verify the trace appears with child spans for all downstream calls. Add custom spans for business operations: for operations not covered by auto-instrumentation (a complex validation step, a background job), add manual spans. Add custom attributes: add business entity IDs (userId, orderId) to the root span so all downstream spans inherit the trace context. Verify error propagation: trigger a failing request. Confirm the error span appears with status=ERROR and the exception event attached.' },
  { q: 'How do you correlate traces with metrics and logs in Grafana?', a: 'Grafana correlation setup: trace to logs: configure a data link from Tempo (traces) to Loki (logs). The link passes the trace ID to a Loki query that filters for log lines containing that trace ID. Prerequisite: the application must inject the trace ID into log lines. OTel does this automatically when using the OTel logging bridge. Logs to traces: in Loki dashboard panels, add a derived field for traceId that extracts the trace ID from log lines and creates a link to Tempo. Metrics to traces via exemplars: Prometheus exemplars attach trace IDs to individual histogram observations. Grafana displays exemplar data points on histogram panels. Click an exemplar to jump to the corresponding trace in Tempo. Configuration: enable exemplars in the Prometheus data source settings. The application must emit exemplars — OTel SDK with Prometheus exporter does this automatically. Service graphs: Tempo generates service graph metrics (request rate, error rate, latency between services) from trace data. Displayed as a topology graph in Grafana. Click a service to filter traces for that service.' },
  { q: 'What is trace sampling and what are appropriate sampling strategies for production?', a: 'Sampling necessity: at high request rates (10,000 RPS), storing 100% of traces is cost-prohibitive. A single request might generate 50 spans — 500,000 spans per second at 100% sampling. Sampling strategies: probabilistic (head-based): sample N% of all traces regardless of outcome. Simple but loses rare important traces. Ratio-based: sample at different rates based on route or operation type. High-value endpoints sampled at higher rates. Rate-limiting: keep a maximum of N traces per second. Even at high traffic you have a representative sample. Error-always: always sample traces containing at least one error span. Essential for debugging. Latency-based (tail-based): always keep traces exceeding a latency threshold. Composite (recommended): rate-limit successful traces at 1-5%. Keep 100% of error traces. Keep 100% of traces exceeding p99 latency. Implementable in the OTel Collector tail sampling processor. Avoid over-sampling: do not over-invest in sampling health check and liveness probe traces — these have low diagnostic value. Filter them out in the Collector.' },
  { q: 'How do you debug a slow API request using distributed tracing?', a: 'Debugging workflow: reproduce and find the trace: identify the slow request from the latency percentile dashboard. Filter traces in the tracing UI by service name, time range, and latency threshold (above 1000ms). Find a representative trace. Examine the Gantt chart: the trace Gantt shows each span as a horizontal bar. Total width is the end-to-end duration. Spans that are wide are the slow operations. Look for: sequential calls that could be parallelized. Large gaps between spans (time spent in code without an active span). Repeated identical spans (N+1 problem). Inspect slow spans: click on the slowest span. Examine attributes: the database statement, the HTTP URL, number of rows returned. Examine events: were there retries? Cache misses? Check downstream dependencies: is the slow span calling an external service? Open traces from that service for the same time window. Does the downstream service think it responded slowly, or is the latency in the network? Common findings: N+1 database queries. Synchronous calls that could be async. Missing database indexes (full table scan visible in db.rows_affected). Cold start of an external service.' },
];

const revision: RevisionSummary = {
  oneLiner: 'startActiveSpan() auto-links child spans. SpanKind + semantic conventions enable service maps. Baggage propagates cross-service context. recordException() for structured errors.',
  mustKnow: [
    'startActiveSpan() sets span as active — child spans (auto + manual) link automatically. startSpan() does NOT.',
    'SpanKind: SERVER (handling inbound), CLIENT (making outbound), PRODUCER/CONSUMER (messaging)',
    'Semantic conventions: http.method, db.system, messaging.system — required for Grafana/Jaeger dashboards to work',
    'Resource: configure SERVICE_NAME — without it, spans appear as "unknown_service" in backends',
    'span.recordException(err) + span.setStatus(ERROR) — structured error with stack trace, not custom attributes',
    'Baggage: cross-service context propagation via headers. LOCAL to trace, NOT to third-party services carefully.',
  ],
  interviewFocus: [
    'What is the difference between startSpan() and startActiveSpan()?',
    'What is OTel Baggage and when would you use it vs span attributes?',
    'How do semantic conventions help with observability tooling?',
  ],
};

@Component({
  selector: 'app-obs-otel-tracing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './opentelemetry-tracing.html',
  styleUrl: './opentelemetry-tracing.scss',
})
export class ObsOpentelemetryTracing {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
