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
  { name: 'OTel SDK',        type: 'keyword', desc: 'Language-specific library that instruments your code and emits traces, metrics, and logs to a Collector or backend.' },
  { name: 'OTel Collector',  type: 'keyword', desc: 'Vendor-neutral agent/gateway that receives, processes, and exports telemetry to one or more backends. Pipeline: receivers → processors → exporters.' },
  { name: 'TracerProvider',  type: 'keyword', desc: 'Global factory for Tracer instances. Configure once at startup with resource attributes and exporters.' },
  { name: 'Span',            type: 'keyword', desc: 'A single named, timed operation. Set attributes, record exceptions, update status. Automatically propagates context.' },
  { name: 'W3C traceparent', type: 'keyword', desc: 'HTTP header standard for propagating trace context: version-traceId-parentSpanId-flags. OTel propagates this automatically.' },
  { name: 'Auto-instrumentation', type: 'keyword', desc: 'Patches popular libraries (Express, fetch, pg, Redis) without code changes using `@opentelemetry/auto-instrumentations-node`.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What OpenTelemetry Is',
    points: [
      'OpenTelemetry (OTel) is the CNCF standard for observability instrumentation — one SDK, one Collector, any backend. It replaces proprietary agents (Datadog agent, Jaeger client, Zipkin client) with a single vendor-neutral instrumentation layer.',
      'Before OTel: each observability vendor provided its own SDK. Switching vendors required rewriting all instrumentation code. OTel decouples instrumentation from the backend — instrument once, export to Prometheus/Jaeger/Datadog/Tempo by changing one exporter config.',
      'OTel covers all three pillars: traces (stable), metrics (stable), logs (stable as of 2023). A single OTel Collector can receive all three from your services and fan out to multiple backends.',
      'The specification is language-agnostic. Implementations exist for Node.js, Python, Java, Go, .NET, Ruby, PHP, Rust, and more — with the same API concepts across all of them.',
    ],
  },
  {
    heading: 'Architecture: SDK → Collector → Backend',
    points: [
      'OTel SDK: embedded in your application code. Instruments libraries (auto) or wraps business logic (manual). Exports OTLP (OpenTelemetry Protocol) over gRPC or HTTP to the Collector.',
      'OTel Collector: sidecar or standalone service. Receives OTLP from apps, processes (batch, filter, enrich, sample), and exports to backends. Acts as a buffer — apps don\'t need to know about backend endpoints or credentials.',
      'Backends: Jaeger or Tempo for traces, Prometheus or InfluxDB for metrics, Loki or Elasticsearch for logs. The Collector fans out to multiple backends simultaneously. Changing backends = updating Collector config only.',
      'The Collector pipeline: receivers (OTLP, Jaeger, Prometheus) → processors (batch, memory_limiter, resourcedetection, tail_sampling) → exporters (Jaeger, Prometheus, Loki, Datadog).',
    ],
  },
  {
    heading: 'Auto-Instrumentation vs Manual Instrumentation',
    points: [
      'Auto-instrumentation: zero-code patches for popular libraries. In Node.js, `getNodeAutoInstrumentations()` instruments Express/Koa, http, https, fetch, pg, MySQL, Redis, gRPC — giving you spans for every incoming request and outgoing call automatically.',
      'Manual instrumentation: wrapping business logic in custom spans. Useful for adding context to long-running operations, recording business events, or instrumenting non-library code. Use `tracer.startActiveSpan(\'name\', span => { ... })`.',
      'Best practice: start with auto-instrumentation to get 80% of the value instantly, then add manual spans for high-value business operations (checkout, payment processing, critical background jobs).',
      'Attributes (formerly tags): key-value pairs on spans. Use OTel semantic conventions (`http.method`, `db.statement`, `user.id`) for consistent dashboards across teams and languages.',
    ],
  },
  {
    heading: 'Context Propagation',
    points: [
      'Context propagation is how trace context moves between services. The OTel SDK automatically injects the W3C `traceparent` header on outgoing HTTP calls and extracts it on incoming requests — creating a connected span tree.',
      'Without propagation, each service creates an isolated trace with no parent — you cannot see the cross-service call tree.',
      'For non-HTTP transports (Kafka, gRPC, AMQP), OTel provides carrier injection APIs. Kafka consumers/producers need explicit context extraction from message headers.',
      'The B3 propagation format (Zipkin legacy) is also supported via `@opentelemetry/propagator-b3` for backwards compatibility with existing systems.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Node.js Setup',
    language: 'typescript',
    code: `// instrumentation.ts — load BEFORE your app code (--require flag)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '2.1.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://otel-collector:4318/v1/metrics',
    }),
    exportIntervalMillis: 15_000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());

// package.json start script:
// "start": "node --require ./instrumentation.js src/index.js"`,
  },
  {
    label: 'Manual Spans',
    language: 'typescript',
    code: `import { trace, SpanStatusCode, context, propagation } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service', '2.1.0');

async function processOrder(orderId: string, items: CartItem[]) {
  // Start a custom span wrapping business logic
  return tracer.startActiveSpan('order.process', async (span) => {
    try {
      // Add business-relevant attributes
      span.setAttributes({
        'order.id': orderId,
        'order.item_count': items.length,
        'order.total': items.reduce((s, i) => s + i.price, 0),
      });

      // Child spans are created automatically for DB calls (auto-instrumented)
      const validated = await validateInventory(items);

      // Nested manual span for a complex sub-operation
      const payment = await tracer.startActiveSpan('order.payment', async (paySpan) => {
        paySpan.setAttribute('payment.provider', 'stripe');
        const result = await chargeCard(orderId);
        paySpan.setAttribute('payment.charge_id', result.chargeId);
        paySpan.end();
        return result;
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return { orderId, payment };
    } catch (err) {
      // Record exception details on the span
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      span.end(); // ALWAYS end the span
    }
  });
}`,
  },
  {
    label: 'Collector Config',
    language: 'typescript',
    code: `# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1024
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  resource:
    attributes:
      - key: environment
        value: production
        action: upsert
  # Tail sampling: only keep 10% of successful traces, 100% of errors
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors-policy
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow-policy
        type: latency
        latency: { threshold_ms: 1000 }
      - name: probabilistic
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls: { insecure: true }
  prometheus:
    endpoint: 0.0.0.0:8889
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, tail_sampling]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting to call span.end()',
    wrong: `const span = tracer.startSpan('my-operation');
span.setAttribute('key', 'value');
await doWork();
// span never ends → memory leak, trace never exported`,
    right: `const span = tracer.startSpan('my-operation');
try {
  span.setAttribute('key', 'value');
  await doWork();
} finally {
  span.end(); // always in finally — runs even if doWork() throws
}`,
    explanation: 'A span that is never ended leaks memory and is never exported to the backend. Use a try/finally block or prefer startActiveSpan() with a callback — it automatically calls span.end() when the callback returns or throws.',
  },
  {
    title: 'Using console.log instead of OTel-aware logger',
    wrong: `// Logs are separate from traces — no traceId linking
console.log('Order created:', orderId);
// In Loki/Kibana you cannot find logs for a specific trace`,
    right: `// Inject current span context into every log line
import { trace } from '@opentelemetry/api';
function log(msg: string, fields: Record<string, unknown> = {}) {
  const span = trace.getActiveSpan();
  const ctx = span?.spanContext();
  console.log(JSON.stringify({
    msg, ...fields,
    traceId: ctx?.traceId,
    spanId: ctx?.spanId,
  }));
}
log('Order created', { orderId }); // now searchable by traceId in Loki`,
    explanation: 'OpenTelemetry does not automatically inject trace context into console.log output. Use a logging library (Winston, Pino) with an OTel log bridge, or manually read the active span\'s trace/span IDs and include them in your structured log output. This connects your logs to traces in Grafana.',
  },
  {
    title: 'Initialising the SDK after importing instrumented libraries',
    wrong: `import express from 'express'; // ← auto-instrumentation misses this
import { NodeSDK } from '@opentelemetry/sdk-node';
const sdk = new NodeSDK({ ... });
sdk.start(); // too late — express already imported`,
    right: `// instrumentation.ts (loaded first via --require)
import { NodeSDK } from '@opentelemetry/sdk-node';
const sdk = new NodeSDK({ ... });
sdk.start(); // patches before any other module loads

// main.ts (loaded second)
import express from 'express'; // now correctly patched`,
    explanation: 'Auto-instrumentation works by monkey-patching modules at import time. If your app imports express, pg, or redis before the OTel SDK is started, those libraries are not patched and their spans are never created. Always load instrumentation.ts via --require before any other code.',
  },
  {
    title: 'Exporting directly to backend from app instead of using Collector',
    wrong: `// App exports directly to Jaeger — tight coupling
new NodeSDK({
  traceExporter: new JaegerExporter({ host: 'jaeger', port: 6832 })
});
// Changing backends requires redeploying all services`,
    right: `// App exports OTLP to local Collector — backend is Collector's concern
new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' })
});
// Collector config determines the backend — no app changes needed`,
    explanation: 'Exporting directly from the app to backends (Jaeger, Datadog) couples every service to the backend. Changing backends requires redeploying all services. Use the OTel Collector as a local sidecar: apps export OTLP to the Collector, and the Collector fans out to any backends. Swapping backends only requires updating Collector config.',
  },
];

const challenge: Challenge = {
  title: 'Trace context propagation',
  language: 'typescript',
  description: `Implement injectTraceContext(headers: Record<string, string>, traceId: string, spanId: string): void
and extractTraceContext(headers: Record<string, string>): { traceId: string; spanId: string } | null

Use the simplified W3C traceparent format: "00-{traceId}-{spanId}-01"
Return null if the header is missing or malformed (doesn't start with "00-").`,
  hints: ['traceparent format: version-traceId-parentSpanId-flags', 'Split by "-" and validate parts'],
  starterCode: `function injectTraceContext(
  headers: Record<string, string>,
  traceId: string,
  spanId: string
): void {
  // TODO: set headers['traceparent'] in W3C format
}

function extractTraceContext(
  headers: Record<string, string>
): { traceId: string; spanId: string } | null {
  // TODO: parse traceparent header and return { traceId, spanId } or null
  return null;
}

const h: Record<string, string> = {};
injectTraceContext(h, 'abc123', 'def456');
console.log(h['traceparent']); // 00-abc123-def456-01

console.log(extractTraceContext(h)); // { traceId: 'abc123', spanId: 'def456' }
console.log(extractTraceContext({})); // null`,
  solution: `function injectTraceContext(
  headers: Record<string, string>,
  traceId: string,
  spanId: string
): void {
  headers['traceparent'] = \`00-\${traceId}-\${spanId}-01\`;
}

function extractTraceContext(
  headers: Record<string, string>
): { traceId: string; spanId: string } | null {
  const tp = headers['traceparent'];
  if (!tp) return null;
  const parts = tp.split('-');
  if (parts.length !== 4 || parts[0] !== '00') return null;
  return { traceId: parts[1], spanId: parts[2] };
}

const h: Record<string, string> = {};
injectTraceContext(h, 'abc123', 'def456');
console.log(h['traceparent']);
console.log(extractTraceContext(h));
console.log(extractTraceContext({}));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the primary benefit of routing telemetry through the OTel Collector instead of exporting directly to backends?',
    options: [
      'The Collector compresses data, reducing network bandwidth by 90%',
      'The Collector decouples app code from backend details — changing backends only requires Collector config changes, not app redeployment',
      'The Collector enforces security policies and blocks sensitive data',
      'The Collector converts OTLP to JSON, which is required by most backends',
    ],
    answer: 1,
    explanation: 'When apps export OTLP to a local Collector, they don\'t know or care which backend (Jaeger, Tempo, Datadog) receives the data. Switching from Jaeger to Tempo only requires updating the Collector\'s exporter config — no app code changes, no redeployments. This is the key architectural benefit of the SDK → Collector → Backend pattern.',
  },
  {
    q: 'Why must the OTel SDK be initialised before importing instrumented libraries like Express?',
    options: [
      'The SDK registers event listeners that must be set up before the Node.js event loop starts',
      'Auto-instrumentation patches modules at import time — importing express before the SDK starts means it is never patched and its spans are never created',
      'The SDK needs to read express configuration to determine which routes to instrument',
      'Node.js requires the SDK to be the first module loaded to prevent circular dependencies',
    ],
    answer: 1,
    explanation: 'OTel auto-instrumentation works by monkey-patching (wrapping) library functions at import time. JavaScript\'s module system caches imported modules — if express is already imported before the OTel SDK starts, its functions are cached in their original, unpatched form. The SDK never gets to wrap them, so no spans are created for HTTP requests.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between OpenTelemetry and OpenTracing/OpenCensus?',
    a: 'OpenTelemetry is the merger and successor of both OpenTracing and OpenCensus, created in 2019. OpenTracing provided a tracing API specification (no implementation). OpenCensus provided both API and SDK for traces and metrics, primarily from Google. The two projects had overlapping goals but incompatible APIs — developers had to choose one. OpenTelemetry merged both projects under the CNCF, creating a single specification and SDK that covers traces, metrics, and logs. If you\'re starting today, use OpenTelemetry exclusively — OpenTracing and OpenCensus are archived and no longer maintained. Many vendors that previously provided OpenTracing/OpenCensus SDKs now provide OTel exporters instead.',
  },
  {
    q: 'How does tail sampling differ from head sampling, and when should I use each?',
    a: '<strong>Head sampling</strong>: the decision to sample (keep or drop) a trace is made at the start of the first span, before the outcome is known. Fast and cheap (no buffering required), but you may drop traces for slow/error requests — exactly the ones you want to keep. Use for very high-volume, low-criticality traffic where you want a statistical sample.<br><br><strong>Tail sampling</strong>: the decision is made after the trace is complete, when the Collector has seen all spans and knows the outcome (success/error/slow). You can keep 100% of error traces and slow traces while sampling down successful fast traces. Requires the Collector to buffer all spans for a trace before deciding — higher memory usage. Use when you care about never missing error traces or traces exceeding a latency threshold. The OTel Collector\'s tail_sampling processor implements this with configurable policies.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'OpenTelemetry = one vendor-neutral SDK for traces + metrics + logs → OTel Collector → any backend. Instrument once, export anywhere.',
  mustKnow: [
    'OTel replaces proprietary agents — instrument once with OTel SDK, change backends by updating Collector config only',
    'Architecture: App SDK → OTLP → Collector (receive, process, sample) → exporters (Jaeger, Prometheus, Loki)',
    'Auto-instrumentation patches Express/pg/Redis etc. at import time — SDK must be initialised FIRST via --require',
    'Manual spans: startActiveSpan() with try/finally span.end() — always end spans',
    'W3C traceparent header propagates trace context across HTTP calls — OTel injects/extracts automatically',
    'Tail sampling in Collector: keep 100% errors/slow, sample down success — never miss critical traces',
  ],
  interviewFocus: [
    'What problem does OpenTelemetry solve? (vendor lock-in for observability instrumentation)',
    'Explain the OTel Collector pipeline: receivers → processors → exporters',
    'Head sampling vs tail sampling — tradeoffs?',
  ],
};

@Component({
  selector: 'app-obs-opentelemetry',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './opentelemetry.html',
  styleUrl: './opentelemetry.scss',
})
export class ObsOpentelemetry {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
