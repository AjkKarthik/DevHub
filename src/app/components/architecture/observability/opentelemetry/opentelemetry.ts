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
  {
    heading: 'The Three Pillars Unified Under One Standard',
    points: [
      'OpenTelemetry aims to unify instrumentation for all three observability signal types — traces, metrics, and logs — under a single specification and SDK, replacing the historically fragmented landscape of vendor-specific instrumentation libraries with one vendor-neutral standard.',
      'Because OpenTelemetry is vendor-neutral, switching observability backends (from a self-hosted Jaeger/Prometheus stack to a commercial vendor, or between commercial vendors) becomes a configuration change in the exporter, not a re-instrumentation project across the entire codebase.',
      'The OpenTelemetry ecosystem includes auto-instrumentation agents for most popular languages and frameworks — for many common cases (a standard Express or Spring Boot app), meaningful tracing and metrics can be added with zero or minimal code changes by simply attaching the appropriate agent.',
      'Semantic conventions (standardized attribute names for common concepts like http.method, db.system, and error indicators) ensure that telemetry generated by different instrumentation libraries and different teams remains consistent and comparable, rather than each team inventing its own incompatible naming scheme.',
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

      // Nested manual span for a complex sub-operation.
      // startActiveSpan() never auto-ends the span -- try/finally is
      // required here too, exactly like the outer span below, or a
      // thrown error from chargeCard() leaks this span forever.
      const payment = await tracer.startActiveSpan('order.payment', async (paySpan) => {
        try {
          paySpan.setAttribute('payment.provider', 'stripe');
          const result = await chargeCard(orderId);
          paySpan.setAttribute('payment.charge_id', result.chargeId);
          return result;
        } finally {
          paySpan.end();
        }
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
    language: 'bash',
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
    explanation: 'A span that is never ended leaks memory and is never exported to the backend. Neither startSpan() nor startActiveSpan() auto-ends a span in the JS/Node.js SDK -- confirmed against OpenTelemetry\'s own JS API guidance: the developer is always responsible for calling span.end(), typically in a finally block, regardless of which of the two you use. Always wrap the span\'s lifetime in try/finally, even inside a startActiveSpan() callback.',
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
  { q: 'What is OpenTelemetry and what problems does it solve?', options: ['An open-source APM tool that replaces Prometheus, Jaeger, and Grafana', 'A vendor-neutral standard and SDK for instrumenting applications to emit metrics, logs, and traces with a common API, eliminating vendor lock-in and reducing the cost of switching observability backends', 'A cloud-native protocol for sending metrics and traces over gRPC between microservices', 'A Kubernetes operator that automatically instruments all pods without code changes'], answer: 1, explanation: 'OpenTelemetry (CNCF graduated project): born from merging OpenCensus (Google) and OpenTracing (CNCF). Solves vendor lock-in: before OTel, instrumenting for Datadog meant using Datadog SDKs; switching to Honeycomb meant re-instrumenting everything. With OpenTelemetry: instrument once using the OTel API and SDK. Change the exporter configuration to send data to Jaeger, Grafana Tempo, Honeycomb, Datadog, New Relic, or any vendor. Auto-instrumentation: OTel provides automatic instrumentation for popular frameworks (Spring, Django, Express, Rails, .NET) without code changes. The combination of auto-instrumentation plus a common API makes OTel the de facto standard for observability instrumentation.' },
  { q: 'What are the main components of the OpenTelemetry architecture?', options: ['API, SDK, Exporter, Collector, and Receiver — five separate microservices deployed alongside the application', 'API (instrumentation contracts), SDK (implementation), auto-instrumentation agents, the OTel Collector (pipeline for receiving, processing, and exporting telemetry), and exporters (send data to backends)', 'OTel only provides APIs; the SDK and Collector are provided by observability vendors separately', 'The OTel architecture consists only of the Collector and OTLP protocol; instrumentation is handled by existing libraries'], answer: 1, explanation: 'OTel architecture: API: defines the interfaces (TracerProvider, Tracer, Span, MeterProvider, Meter, LoggerProvider). Application code calls the API. SDK: the implementation of the API. Configurable with processors, samplers, and exporters. You configure the SDK in your app startup code. Auto-instrumentation: language-specific agents or byte-code instrumentation that automatically intercepts popular frameworks. Zero code changes needed. OTel Collector: a standalone process that receives telemetry (OTLP, Jaeger, Prometheus, Zipkin), processes it (sample, filter, enrich), and exports it (OTLP, Jaeger, Prometheus, Zipkin, vendor backends). Exporters: send data to specific backends. The exporter is the only thing that changes when you switch vendors.' },
  { q: 'What is the OTLP protocol and why was it created?', options: ['OpenTelemetry Latency Protocol — a binary protocol for measuring network latency in distributed systems', 'OpenTelemetry Protocol — a standard gRPC and HTTP/JSON protocol for exporting metrics, logs, and traces from applications and the Collector to backends, enabling any OTel-compatible tool to exchange telemetry data', 'A replacement for Prometheus remote-write that adds trace correlation to metric exports', 'A proprietary protocol from Google that OpenTelemetry adopted as its standard transport'], answer: 1, explanation: 'OTLP (OpenTelemetry Protocol): a standard wire protocol for telemetry data. Transport options: gRPC (OTLP/gRPC, default) and HTTP/JSON (OTLP/HTTP). Covers all three signals: metrics, logs, and traces in a unified protocol. Why OTLP: before OTLP, each vendor had its own protocol (Jaeger Thrift, Zipkin JSON, StatsD UDP, various proprietary formats). The OTel Collector acts as a universal translator. Exporters: the Collector and SDKs ship OTLP exporters for major backends (Jaeger, Zipkin, Prometheus). Vendors implement OTLP receivers on their backends. Once a vendor supports OTLP, any OTLP-compliant tool can send data to them. OTLP is now supported by Jaeger, Grafana Tempo, AWS X-Ray, Azure Monitor, Datadog, New Relic, Honeycomb, and most other observability platforms.' },
  { q: 'What is the OpenTelemetry Collector and when should you use it?', options: ['A Prometheus-compatible scraper that collects metrics from Kubernetes pods', 'A standalone service that receives telemetry from applications, applies processing (sampling, filtering, enrichment), and exports to one or more backends; used to decouple applications from backends and centralize telemetry pipeline management', 'The OTel Collector is optional; applications should always export directly to backends for lower latency', 'A Kubernetes controller that manages OTel SDK configuration across all pods in a cluster'], answer: 1, explanation: 'OTel Collector use cases: decoupling: applications send to the Collector via OTLP. The Collector sends to one or more backends. Changing backends does not require application changes. Data processing: sampling (tail-based sampling in the Collector). Filtering (drop debug spans before they reach the backend). Attribute enrichment (add cluster name, region, environment). Batching and compression (more efficient transmission). Fan-out: send the same data to multiple backends simultaneously (Jaeger for tracing, Prometheus for metrics, Elasticsearch for logs). Protocol translation: receive Jaeger Thrift and export as OTLP. Receive StatsD and export as OTLP metrics. Infrastructure metrics: host receiver, Kubernetes receiver, Docker receiver collect infrastructure metrics without Prometheus. Deployment: deployed as a DaemonSet (one per node) or a central deployment, depending on scale.' },
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
  { q: 'How do you configure OpenTelemetry auto-instrumentation in different languages?', a: 'Java: OTel Java agent (opentelemetry-javaagent.jar) provides auto-instrumentation via byte-code manipulation. Add JVM argument: -javaagent:/path/opentelemetry-javaagent.jar. Automatically instruments Spring, Tomcat, JDBC, gRPC, Kafka, Redis, and 50+ other frameworks. Python: opentelemetry-instrument command wraps the application: opentelemetry-instrument python app.py. Automatically instruments Django, Flask, FastAPI, SQLAlchemy, requests, boto3. Node.js: require the @opentelemetry/auto-instrumentations-node package and configure it in the application entry point or using the --require flag. .NET: OTel .NET SDK auto-instrumentation via AspNetCore, HttpClient, SqlClient instrumentation packages. Add packages and configure in Program.cs. Go: no byte-code manipulation (compiled language). Must add instrumentation manually using OTel Go SDK, but many frameworks provide OTel integrations. Configuration: set OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME environment variables for all agents.' },
  { q: 'How do you configure the OpenTelemetry Collector pipeline?', a: 'OTel Collector pipeline configuration (otel-collector-config.yaml): receivers: define how data enters. otlp: with grpc and http sub-sections. prometheus: to scrape Prometheus targets. processors: transformations. batch: batch spans for efficient export. memory_limiter: prevent OOM. filter: drop unwanted spans. resource: add or modify attributes. tail_sampling: tail-based sampling. exporters: where data goes. otlp: to send to Jaeger or any OTLP receiver. prometheus: expose a /metrics endpoint. logging: for debugging. pipelines: connect receivers to processors to exporters. traces pipeline: receivers -> processors -> exporters. metrics pipeline: separate pipeline for metrics. logs pipeline: separate pipeline for logs. Deployment: as a Kubernetes DaemonSet (one per node) for application telemetry. As a central Deployment for pipeline processing and fan-out. Health check: the Collector exposes a health check HTTP endpoint for Kubernetes readiness probes.' },
  { q: 'What is semantic convention in OpenTelemetry and why does it matter?', a: 'OTel semantic conventions: standardized attribute names for common operations. Instead of each team using different names for the same concept (url, http_url, request_path), semantic conventions define the canonical names. HTTP conventions: http.method, http.url, http.status_code, http.request_content_length. Database conventions: db.system (postgresql, mysql), db.name, db.statement, db.user. Messaging: messaging.system (kafka, rabbitmq), messaging.destination. RPC: rpc.system (grpc), rpc.service, rpc.method. Why it matters: consistent naming means observability backends can show HTTP error rates across all services that follow conventions. Dashboards and alerts can be written generically using conventional attribute names. Vendor-provided dashboards work out of the box for services using semantic conventions. Compliance: OTel auto-instrumentation follows semantic conventions by default. Custom instrumentation should follow them for consistency. The specifications are published at opentelemetry.io/docs/reference/specification/semantic-conventions.' },
  { q: 'How does OpenTelemetry handle the relationship between metrics, logs, and traces?', a: 'OTel signal correlation: traces and metrics: exemplars link metrics to traces. When a histogram observation is made during a traced request, the exemplar carries the trace ID. Grafana displays exemplars on histogram panels. Click an exemplar to jump to the trace. Traces and logs: OTel injects trace context (trace ID, span ID) into the active logging context automatically. Every log line emitted during a traced request includes the trace IDs. Loki, Elasticsearch, and other log tools display a link to the trace. Logs to traces: a log with a trace ID can link to the full distributed trace in Tempo or Jaeger. Metrics to logs: define a Grafana data link from an error rate metric panel to a Loki query pre-filtered to the same service and time window. The three signals form a correlation triangle: metrics detect (low-latency alerting). Logs provide event context (what happened). Traces provide causal structure (why it is slow). OpenTelemetry ensures all three signals carry consistent correlation identifiers.' },
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
