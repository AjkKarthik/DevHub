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

      await kafka.producer().send({
        topic: 'orders.created',
        messages: [{
          value: JSON.stringify({ orderId }),
          headers,  // ← trace context travels in headers
        }],
      });
      span.end();
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
