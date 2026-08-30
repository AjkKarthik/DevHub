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

@Component({
  selector: 'app-mesh-tracing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './tracing.html',
  styleUrl: './tracing.scss',
})
export class MeshTracing {
  quickRef: QuickRefItem[] = [
    { name: 'Trace', type: 'keyword', desc: 'End-to-end record of a single request as it flows through multiple services — composed of spans.' },
    { name: 'Span', type: 'keyword', desc: 'One unit of work within a trace — has a name, start time, duration, and metadata tags.' },
    { name: 'trace-id', type: 'keyword', desc: 'Unique identifier shared across all spans in one trace. Propagated via HTTP headers.' },
    { name: 'B3 propagation', type: 'keyword', desc: 'Zipkin header format: X-B3-TraceId, X-B3-SpanId, X-B3-ParentSpanId, X-B3-Sampled.' },
    { name: 'W3C TraceContext', type: 'keyword', desc: 'Standard trace propagation format: traceparent and tracestate headers. Preferred over B3.' },
    { name: 'sampling rate', type: 'keyword', desc: 'Fraction of requests that generate trace data. 100% in dev, 1% in high-traffic production.' },
    { name: 'OpenTelemetry', type: 'keyword', desc: 'Vendor-neutral SDK and protocol for traces, metrics, and logs. Replaces Jaeger/Zipkin SDKs.' },
    { name: 'Jaeger', type: 'keyword', desc: 'Open-source distributed tracing backend — stores and visualises Istio trace data.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Distributed Tracing Works with Istio',
      points: [
        'Istio creates a span for each hop in a request path — every Envoy-to-Envoy call generates inbound and outbound spans. These spans are linked by a shared trace ID propagated through HTTP headers.',
        'Critical: Istio only propagates trace headers between services — it cannot correlate spans across service calls unless your application forwards the incoming trace headers to outgoing requests. Envoy injects headers on the first hop; your app must pass them along.',
        'Required headers (B3): `x-request-id`, `x-b3-traceid`, `x-b3-spanid`, `x-b3-parentspanid`, `x-b3-sampled`, `x-b3-flags`. All must be forwarded from the inbound request to any outbound service call your service makes.',
        'W3C TraceContext (preferred since Istio 1.12): `traceparent` and `tracestate` headers. Single header for most fields — simpler to forward. Supported by most modern SDKs (OpenTelemetry).',
        'Sampling: not every request generates a trace. The sampling decision is made at the entry point (ingress gateway or first service) and the decision is encoded in the `x-b3-sampled` header. If `sampled=0`, Envoy skips trace generation for that request.',
        'Trace data flow: Envoy emits spans to a local collector (OpenTelemetry Collector sidecar or directly to Jaeger). The collector batches and forwards to the backend (Jaeger, Zipkin, Tempo, or a commercial APM).',
      ],
    },
    {
      heading: 'Header Propagation — The Critical Requirement',
      points: [
        'Without header propagation, Istio generates isolated two-span traces per hop — you see A→B and B→C as separate unlinked traces instead of one A→B→C trace. The trace is broken.',
        'Propagation in practice: when service A calls service B, A must extract the trace headers from the incoming request and include them in the outgoing HTTP client request to B.',
        'OpenTelemetry SDK handles propagation automatically if you initialise it correctly — call `propagator.inject(carrier, context)` before each outbound HTTP call. The SDK reads the trace context from the active context and injects the headers.',
        'Manual propagation (without SDK): read `traceparent`, `x-b3-traceid`, `x-b3-spanid`, etc. from the incoming request, add them to a map, and pass that map as headers on all outgoing HTTP calls.',
        'gRPC: trace context is propagated in gRPC metadata, not HTTP headers. The gRPC OpenTelemetry interceptor handles this automatically. Without it, you must manually read/write gRPC metadata.',
        'Testing propagation: use `istioctl dashboard jaeger` and make a multi-hop request. If you see a single trace with all hops, propagation is working. If you see separate 2-span traces per service, an app is dropping the headers.',
      ],
    },
    {
      heading: 'OpenTelemetry Integration',
      points: [
        'OpenTelemetry (OTel) is the CNCF standard for observability data. It provides SDKs for every language, a protocol (OTLP), and a Collector that receives/processes/exports traces, metrics, and logs.',
        'Istio 1.22+ documents OpenTelemetry as a first-class tracing provider: `meshConfig.extensionProviders[0].opentelemetry`. This replaces the older Zipkin/Jaeger native integrations.',
        'OTel Collector deployment: run a DaemonSet or Deployment of the OTel Collector in the cluster. Envoy sidecars send spans to the collector via OTLP gRPC (port 4317). The collector then exports to Jaeger, Tempo, Datadog, etc.',
        'Custom spans from application code: use the OTel SDK to create application-level spans within each service. These appear as child spans of the Envoy span in the trace — combining infrastructure and app-level tracing in one view.',
        'Baggage propagation: OTel baggage (key-value pairs attached to a trace context) can be used to pass context across services — e.g., user ID, feature flags. All services in the trace have access to baggage items.',
        'Resource attributes: set `OTEL_RESOURCE_ATTRIBUTES=service.name=checkout,service.version=1.2.0` on each pod. These appear on all spans from that service — essential for filtering traces by version during canary releases.',
      ],
    },
    {
      heading: 'Sampling Strategies',
      points: [
        'Head-based sampling (default): the decision to trace a request is made at the first service. All subsequent hops in the same trace follow the same sampling decision (encoded in `x-b3-sampled`).',
        '`meshConfig.defaultConfig.tracing.sampling`: the OLDER way to set the sampling percentage (0-100) globally. When a Telemetry resource\'s `randomSamplingPercentage` is ALSO configured, the Telemetry API value takes precedence — prefer configuring sampling through the Telemetry API alone rather than setting both.',
        'Sampling rates: 100% for development/staging. For production: 1% for extremely high-traffic services, 10% for typical services. At 1000 RPS, 1% sampling still generates 10 traces/sec.',
        'Tail-based sampling: decide AFTER the trace completes — only keep traces that match certain criteria (error traces, slow traces). Requires the OTel Collector or a tool like Tempo with tail sampling. More expensive but keeps the most valuable traces.',
        'Error sampling: combine head sampling (10%) with a policy to always sample requests that result in 5xx responses. This ensures you always have trace data for failures even at low overall sampling rates.',
        'Sampling via Telemetry API: override the global sampling rate per workload: `spec.tracing[0].providers[0].name = jaeger; spec.tracing[0].randomSamplingPercentage = 5`.',
      ],
    },
    {
      heading: 'Jaeger and Tempo',
      points: [
        'Jaeger: open-source tracing backend from CNCF. Istio\'s bundled Jaeger is for evaluation — single replica, no persistence. Production Jaeger needs Cassandra or Elasticsearch storage, and HA deployment.',
        'Grafana Tempo: lightweight, scalable tracing backend optimised for object storage (S3/GCS). Excellent for high-volume tracing. Integrates natively with Grafana — query traces from the same Grafana instance as your Prometheus metrics.',
        'Trace to logs correlation: Grafana Loki + Tempo integration. Add `trace_id` to every log line (using OTel Logging SDK or JSON structured logging). In Grafana, click a trace span to jump to the correlated logs — immediate context switching.',
        'Trace to metrics exemplars: Prometheus Exemplars attach a trace ID to a specific metric sample. When a latency spike appears in Grafana, click on the high-latency metric point and jump directly to the trace for that exact request.',
        'Commercial alternatives: Datadog APM (auto-traces Istio via the Datadog Agent DaemonSet), New Relic, Honeycomb, Lightstep. These provide retention, anomaly detection, and alerting beyond open-source tools.',
        'jaeger-operator: Kubernetes operator for deploying production-grade Jaeger. Manages Jaeger All-in-One (dev) or Jaeger Production (with external storage) via CRD — simplifies lifecycle management.',
      ],
    },
    {
      heading: 'Tracing in Production',
      points: [
        'Start with 1-10% sampling for high-traffic services. Even at 1%, you generate statistically significant data for latency percentiles and error analysis.',
        'Always sample error requests (5xx): configure tail sampling or a custom sampler that forces sampling for requests resulting in errors. Never miss a failure trace.',
        'Trace retention: keep detailed traces for 3-7 days; keep aggregated metrics (derived from traces) indefinitely. Storage grows linearly with sampling rate × request rate × trace size.',
        'Privacy in traces: traces may capture HTTP paths, headers, and query parameters. Scrub or mask PII before storing. OTel Collector supports attribute scrubbing processors.',
        'Trace-driven root cause analysis workflow: alert fires → check Prometheus for error spike → filter traces by `response_code=500` in Jaeger → find the failing span → check span attributes for error message → cross-reference with pod logs.',
        'Service dependency map: use trace data to automatically generate an accurate service dependency graph. Jaeger and Kiali both derive this from trace data — catches undocumented service-to-service calls.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enable Tracing (Istio)',
      language: 'bash',
      code: `# Configure Jaeger as tracing provider in IstioOperator
cat <<EOF | kubectl apply -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    defaultConfig:
      tracing:
        sampling: 10        # 10% of requests traced
        zipkin:
          address: jaeger-collector.istio-system:9411
    extensionProviders:
    - name: otel-tracing
      opentelemetry:
        service: opentelemetry-collector.istio-system.svc.cluster.local
        port: 4317
EOF

# Apply Telemetry API to use the OTel provider
cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-tracing
  namespace: istio-system
spec:
  tracing:
  - providers:
    - name: otel-tracing
    randomSamplingPercentage: 10
EOF`,
    },
    {
      label: 'Header Propagation (Node.js)',
      language: 'bash',
      code: `# Application MUST forward these headers on every outbound call
# Node.js / Express example using OpenTelemetry SDK

# Install: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

# tracing.js (loaded before app code)
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

# Auto-instrumentation handles header propagation for http/https/grpc automatically.
# For manual HTTP calls, inject headers using the propagation API:

const { propagation, context } = require('@opentelemetry/api');
const headers = {};
propagation.inject(context.active(), headers);
// headers now contains traceparent, x-b3-traceid, etc.`,
    },
    {
      label: 'OTel Collector Config',
      language: 'bash',
      code: `# Deploy OTel Collector to receive spans from Envoy sidecars
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: istio-system
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    processors:
      batch:
        timeout: 1s
        send_batch_size: 1024
      # Scrub sensitive headers from spans
      attributes:
        actions:
        - key: http.request.header.authorization
          action: delete
    exporters:
      jaeger:
        endpoint: jaeger-collector:14250
        tls:
          insecure: true
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, attributes]
          exporters: [jaeger]
EOF`,
    },
    {
      label: 'Sampling Override per Service',
      language: 'bash',
      code: `# Override sampling rate for a specific high-traffic service
cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: low-sampling-healthcheck
  namespace: production
spec:
  selector:
    matchLabels:
      app: high-traffic-api
  tracing:
  - providers:
    - name: otel-tracing
    randomSamplingPercentage: 1   # 1% for high-traffic service
---
# Always sample error requests (use tail sampling in OTel Collector)
# In OTel Collector config - tail sampling processor:
# processors:
#   tail_sampling:
#     policies:
#     - name: sample-errors
#       type: status_code
#       status_code: { status_codes: [ERROR] }
#     - name: probabilistic
#       type: probabilistic
#       probabilistic: { sampling_percentage: 5 }
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not forwarding trace headers — broken traces',
      wrong: `// Service B receives request from A (has traceparent header)
// Service B calls Service C — does NOT include traceparent
app.get('/orders', async (req, res) => {
  const result = await fetch('http://inventory/stock');
  // No headers forwarded → C gets a new trace ID → broken trace
});`,
      right: `// Forward trace headers from incoming to outgoing requests
app.get('/orders', async (req, res) => {
  const headers = {
    'traceparent': req.headers['traceparent'],
    'x-b3-traceid': req.headers['x-b3-traceid'],
    'x-b3-spanid': req.headers['x-b3-spanid'],
    'x-b3-sampled': req.headers['x-b3-sampled'],
  };
  const result = await fetch('http://inventory/stock', { headers });
});`,
      explanation: 'Istio creates spans for each Envoy hop but cannot link them across service boundaries without the trace ID being propagated in headers. Without forwarding `traceparent` or B3 headers, each service appears as a separate unlinked trace in Jaeger. This is the most common tracing misconfiguration in Istio.',
    },
    {
      title: 'Using 100% sampling in high-traffic production',
      wrong: `meshConfig:
  defaultConfig:
    tracing:
      sampling: 100   # 100% of all requests traced
# At 10,000 RPS: 10,000 traces/sec → storage exhaustion in hours`,
      right: `meshConfig:
  defaultConfig:
    tracing:
      sampling: 1     # 1% = 100 traces/sec at 10,000 RPS
# Use tail sampling for errors to never miss failure traces`,
      explanation: '100% sampling at high traffic volumes exhausts Jaeger/Tempo storage and overwhelms the collector. At 10,000 RPS, 100% sampling generates ~864 million traces/day. Start at 1% for high-traffic services and use tail sampling to always capture error traces at 100%.',
    },
    {
      title: 'Storing PII in trace span attributes',
      wrong: `// Adding user email to span attributes
span.setAttribute('user.email', user.email);
span.setAttribute('payment.card_number', card.number);
// Now user PII is in the trace backend — compliance violation`,
      right: `// Use non-identifying attributes
span.setAttribute('user.id', user.id);        // Opaque ID, not email
span.setAttribute('payment.method', 'card');   // Type, not number
span.setAttribute('user.tier', user.tier);     // Tier, not identity`,
      explanation: 'Trace data is often stored in third-party backends (Datadog, Honeycomb) or shared with ops teams. Adding PII (emails, names, payment details) to span attributes creates compliance risks (GDPR, PCI-DSS). Use opaque IDs and non-sensitive categorical attributes instead.',
    },
    {
      title: 'Mixing B3 and W3C TraceContext headers — broken propagation',
      wrong: `// Service A sends W3C traceparent header
// Service B's library only reads B3 x-b3-traceid header
// Trace context is lost at service B → broken link`,
      right: `// Standardise on W3C TraceContext (traceparent) across all services
// Use OpenTelemetry SDK — it handles both B3 and W3C automatically
// Configure Istio to use W3C: meshConfig.defaultConfig.tracing (uses W3C by default in 1.16+)
// Verify: all services use the same OTel SDK version`,
      explanation: 'B3 and W3C TraceContext are incompatible formats. If different services use different propagation formats, traces break at every format boundary. Standardise on W3C TraceContext (the IETF standard) using OpenTelemetry SDKs across all services.',
    },
    {
      title: 'Using bundled Jaeger in production',
      wrong: `istioctl install --set profile=demo
# Bundled Jaeger: in-memory storage, data lost on restart, single replica`,
      right: `# Deploy production Jaeger with Elasticsearch storage
# helm install jaeger jaegertracing/jaeger \\
#   --set storage.type=elasticsearch \\
#   --set storage.elasticsearch.host=elasticsearch
# Or use Grafana Tempo for lightweight S3-backed storage`,
      explanation: 'Istio\'s bundled Jaeger (demo profile) uses in-memory storage — all traces are lost when the Jaeger pod restarts. Production needs Cassandra or Elasticsearch for persistence, HA replicas for the collector and query services, and proper retention policies. Consider Grafana Tempo as a simpler, scalable alternative.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Header Propagation Utility',
    language: 'typescript',
    description: `Write a TypeScript utility function that extracts all Istio/OpenTelemetry trace propagation headers from an incoming HTTP request and returns them as an object to be forwarded to outgoing requests.

Required headers to propagate:
- W3C: traceparent, tracestate
- B3 multi: x-b3-traceid, x-b3-spanid, x-b3-parentspanid, x-b3-sampled, x-b3-flags
- Istio: x-request-id

The function should only include headers that are present in the incoming request (skip undefined/null).`,
    hints: [
      'Check if each header exists before including it',
      'Return only defined headers to avoid sending "undefined" strings',
      'The function should accept a headers object (Record<string, string | undefined>)',
      'Use object spread or reduce to build the result',
    ],
    starterCode: `type Headers = Record<string, string | undefined>;

function extractTraceHeaders(incomingHeaders: Headers): Record<string, string> {
  // Your implementation here
  return {};
}

// Test
const incoming: Headers = {
  'traceparent': '00-abc123-def456-01',
  'x-b3-traceid': 'abc123',
  'x-request-id': 'req-uuid',
  'content-type': 'application/json',  // Should NOT be forwarded
};
console.log(extractTraceHeaders(incoming));`,
    solution: `type Headers = Record<string, string | undefined>;

function extractTraceHeaders(incomingHeaders: Headers): Record<string, string> {
  const TRACE_HEADERS = [
    'traceparent',
    'tracestate',
    'x-b3-traceid',
    'x-b3-spanid',
    'x-b3-parentspanid',
    'x-b3-sampled',
    'x-b3-flags',
    'x-request-id',
  ];

  return TRACE_HEADERS.reduce((acc, header) => {
    const value = incomingHeaders[header];
    if (value !== undefined && value !== null) {
      acc[header] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}

// Test
const incoming: Headers = {
  'traceparent': '00-abc123-def456-01',
  'x-b3-traceid': 'abc123',
  'x-request-id': 'req-uuid',
  'content-type': 'application/json',
};
console.log(extractTraceHeaders(incoming));
// { traceparent: '00-abc123-def456-01', 'x-b3-traceid': 'abc123', 'x-request-id': 'req-uuid' }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the most critical application requirement for distributed tracing to work with Istio?',
      options: ['Applications must implement the OpenTelemetry SDK for all languages', 'Applications must forward incoming trace headers to all outgoing HTTP/gRPC calls', 'Applications must create custom spans for every database query', 'Applications must set a OTEL_RESOURCE_ATTRIBUTES environment variable'],
      answer: 1,
      explanation: 'Istio generates spans for each Envoy-to-Envoy hop automatically, but it cannot link spans across service boundaries without the trace ID being propagated in headers. If service B receives a request with a trace ID but doesn\'t forward that ID to service C, the trace is broken into unlinked fragments in Jaeger.',
    },
    {
      q: 'What is the difference between head-based and tail-based sampling?',
      options: ['Head-based samples the first N requests per minute; tail-based samples the last N', 'Head-based decides to trace at request start and propagates the decision; tail-based decides after the trace completes (can target errors/slow traces)', 'Head-based is for ingress traffic; tail-based is for egress', 'Head-based uses Zipkin format; tail-based uses W3C TraceContext'],
      answer: 1,
      explanation: 'Head-based sampling decides at the start of a request whether to trace it — cheap but you can\'t target specific request types (errors, slow). Tail-based sampling collects ALL spans and makes the keep/drop decision after the full trace is available — more expensive (requires buffer) but lets you always keep error traces and slow traces while discarding fast successes.',
    },
    {
      q: 'What does the `x-b3-sampled: 0` header mean?',
      options: ['0% sampling rate is configured globally', 'This specific request should NOT be traced — Envoy skips span generation', 'The trace was sampled but the data is empty', 'The service has no tracing backend configured'],
      answer: 1,
      explanation: '`x-b3-sampled: 0` means the head-based sampling decision for this request is "do not trace." All downstream Envoy proxies see this header and skip generating spans for this request. `x-b3-sampled: 1` means "do trace." This decision is made once at the entry point and propagated throughout the entire request chain.',
    },
    {
      q: 'Why is W3C TraceContext preferred over B3 headers for new Istio deployments?',
      options: ['W3C TraceContext has lower overhead because it uses fewer headers', 'W3C TraceContext is the IETF standard supported natively by all modern OpenTelemetry SDKs — better interoperability across languages and vendors', 'B3 headers are deprecated and no longer supported by Istio', 'W3C TraceContext provides stronger encryption for trace data'],
      answer: 1,
      explanation: 'W3C TraceContext is the IETF W3C Recommendation for distributed trace context propagation. OpenTelemetry SDKs support it natively across all languages. B3 is the older Zipkin format — still functional but requires custom configuration in some SDKs. Standardising on W3C TraceContext ensures interoperability between services written in different languages and with different vendors.',
    },
    {
      q: 'What happens in Jaeger if an application does NOT forward trace headers to outgoing calls?',
      options: ['Jaeger shows an incomplete trace with missing spans for that service', 'Jaeger shows separate, unlinked two-span traces per service hop instead of one connected trace', 'Istio blocks the request until trace headers are added', 'The trace ID is regenerated by the next service\'s Envoy proxy'],
      answer: 1,
      explanation: 'Without header forwarding, each Envoy creates spans with a NEW trace ID for each hop. In Jaeger, you see separate two-span mini-traces (inbound Envoy + outbound Envoy) per service — all disconnected. There is no end-to-end trace showing the full request path. This is the "broken traces" symptom that indicates missing header propagation.',
    },
    {
      q: 'What is an OpenTelemetry Collector and why use one instead of Envoy sending directly to Jaeger?',
      options: ['The Collector is required by Istio — Envoy cannot send spans to Jaeger directly', 'The Collector decouples Envoy from the tracing backend — it can batch, filter, transform, and route spans to multiple backends simultaneously', 'The Collector compresses trace data to reduce network bandwidth', 'The Collector is only needed for tail-based sampling'],
      answer: 1,
      explanation: 'The OTel Collector acts as a pipeline between Envoy and the tracing backend. Benefits: batching (reduces network calls), filtering (drop high-volume health check spans), transformation (scrub PII, add attributes), and fan-out (send to Jaeger AND Tempo AND Datadog simultaneously without changing Envoy config). Envoy can send directly to Jaeger but loses all these capabilities.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you connect traces with logs in Grafana?',
      a: 'Use trace-log correlation: <ol><li><strong>Add trace_id to every log line</strong>: use the OTel Logging SDK or structured logging with `{"trace_id": "abc123", "message": "..."}` in JSON format.</li><li><strong>Collect logs with Grafana Loki</strong>: Loki indexes log lines and supports Grafana as a query interface.</li><li><strong>Configure Grafana correlations</strong>: in Grafana, set up a "Derived Field" in the Loki data source that extracts `trace_id` from log lines and creates a link to Tempo.</li></ol>Result: in Grafana, click a trace span → jump to the logs from that service during that trace\'s timeframe → click the trace_id in a log line → jump to the full trace. This is "observability in three clicks."',
    },
    {
      q: 'How does Istio\'s tracing interact with custom application spans?',
      a: 'Istio generates infrastructure-level spans (Envoy inbound + outbound per hop) automatically. Application-level spans created with the OTel SDK appear as <strong>child spans</strong> of the Envoy span for the same service. This means: <ul><li>The Envoy span shows total request time at the network layer</li><li>App spans inside it show time spent in specific code paths (DB query, external API call, cache lookup)</li><li>Together they give full visibility: network time + application time + individual operation time</li></ul>Start times and durations are correlated because both Envoy and the app use the same trace context. The key is using the same trace ID propagated from Envoy via the W3C traceparent header.',
    },
    {
      q: 'What is Grafana Tempo and when would you choose it over Jaeger?',
      a: '<strong>Jaeger</strong>: mature, feature-rich, requires Cassandra or Elasticsearch for production storage. Good UI for trace exploration. Complex to operate at scale. <br><br><strong>Grafana Tempo</strong>: lightweight, stores traces directly in object storage (S3, GCS, Azure Blob) — much cheaper than Cassandra/Elasticsearch. Designed for large-scale tracing. Tight Grafana integration (traces appear directly in Grafana alongside Prometheus metrics). <br><br>Choose Tempo when: you already use Grafana + Loki + Prometheus (the "LGTM" stack), you want low-cost object storage backend, or you want trace/metric/log correlation in one UI. Choose Jaeger when: you need rich trace search UI, your team is already familiar with Jaeger, or you need standalone trace exploration outside Grafana.',
    },
    {
      q: 'How do trace exemplars connect Prometheus metrics to Jaeger traces?',
      a: 'Prometheus Exemplars (defined by the OpenMetrics specification) attach a trace ID to a specific metric sample: <pre><code>http_request_duration_seconds_bucket{le="0.5"} 42 # {trace_id="abc123"} 0.45</code></pre>When you see a latency spike in a Grafana chart, the spike point has an attached trace ID (the exemplar). Click the spike → Grafana jumps to the Jaeger/Tempo trace for that exact request. <br>To use: <ul><li>Application records exemplars when emitting latency histograms (OTel SDK + Prometheus SDK)</li><li>Prometheus scrapes with exemplar support enabled</li><li>Grafana configured to show exemplars in histogram panels</li></ul>This closes the loop between aggregate metrics (what is slow?) and individual traces (why is this specific request slow?).',
    },
    {
      q: 'Can you trace gRPC calls with Istio and OpenTelemetry?',
      a: 'Yes. Istio automatically creates spans for gRPC calls (gRPC uses HTTP/2 underneath — Envoy traces it just like HTTP/2). For application-level spans and proper header propagation in gRPC: <ul><li>Use the <strong>gRPC OpenTelemetry interceptor</strong> (<code>opentelemetry-instrumentation-grpc</code> for Python, <code>go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc</code> for Go)</li><li>The interceptor auto-propagates trace context in gRPC metadata (equivalent of HTTP headers in gRPC)</li><li>Without the interceptor, gRPC trace context is NOT forwarded — you get broken traces for gRPC hops</li></ul>gRPC trace headers are propagated in metadata, not HTTP headers. This is the key difference from HTTP service tracing.',
    },
  { q: 'How do you propagate distributed trace context in your application when using Istio?', a: 'Istio automatically creates the initial trace span and propagates context between services via Envoy. However, your application code must forward trace headers from incoming requests to outgoing requests for the trace to be correlated. The headers to forward depend on the tracing backend: for Zipkin and Jaeger, forward x-request-id, x-b3-traceid, x-b3-spanid, x-b3-parentspanid, x-b3-sampled, and x-b3-flags. For OpenTelemetry, forward the traceparent and tracestate headers. Failure to propagate these headers results in disconnected spans that appear as separate unrelated traces instead of one unified distributed trace.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Distributed tracing links request spans across services via propagated trace headers. Istio auto-generates Envoy spans but applications MUST forward traceparent/B3 headers to outbound calls. OpenTelemetry SDK handles propagation automatically.',
    mustKnow: [
      'Istio creates Envoy spans automatically — but apps must forward traceparent/x-b3-* headers to outgoing calls',
      'Broken trace symptom: many disconnected 2-span mini-traces in Jaeger instead of one end-to-end trace',
      'W3C TraceContext (traceparent header) is the modern standard — preferred over B3',
      'Sampling: head-based (decide at entry), tail-based (decide after — can target errors)',
      'x-b3-sampled: 1 = trace this request, 0 = skip; propagated to all downstream services',
      'OTel Collector: batches, filters (scrub PII), and fans out to multiple backends',
      'Grafana Tempo: lightweight object-storage tracing backend; Jaeger: mature, rich UI',
    ],
    interviewFocus: [
      'Why applications must propagate trace headers — broken traces explained',
      'Head-based vs tail-based sampling trade-offs',
      'How to always capture error traces at low overall sampling rates',
      'OTel Collector role — why not send directly from Envoy to Jaeger?',
      'How trace exemplars connect Prometheus metrics to specific traces',
    ],
  };
}
