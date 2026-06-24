import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CheatItem {
  category: string;
  name: string;
  syntax: string;
  description: string;
}

const ITEMS: CheatItem[] = [
  // ── PROMETHEUS ──────────────────────────────────────────────────
  { category: 'Prometheus', name: 'Counter', syntax: 'counter.inc() / counter.add(n)', description: 'Monotonically increasing value. Use for: request count, error count, bytes sent. Never decreases (only resets on restart).' },
  { category: 'Prometheus', name: 'Gauge', syntax: 'gauge.set(n) / gauge.inc() / gauge.dec()', description: 'Arbitrary value that goes up or down. Use for: queue size, active connections, memory in use.' },
  { category: 'Prometheus', name: 'Histogram', syntax: 'histogram.observe(value)', description: 'Samples observations in configurable buckets. Use for: request latency, response size. Enables percentile (p99) calculation with histogram_quantile().' },
  { category: 'Prometheus', name: 'histogram_quantile', syntax: 'histogram_quantile(0.99, rate(metric_bucket[5m]))', description: 'Computes p99 from a histogram. Always apply rate() to _bucket series before passing to histogram_quantile.' },
  { category: 'Prometheus', name: 'rate()', syntax: 'rate(counter[5m])', description: 'Per-second rate of increase over the window. Use on counters only. 5m window = good for alerts, 1m = more responsive dashboards.' },
  { category: 'Prometheus', name: 'increase()', syntax: 'increase(counter[1h])', description: 'Total increase in counter over the window. Equivalent to rate() × window duration. Use for "total requests in the last hour" style queries.' },
  { category: 'Prometheus', name: 'sum by()', syntax: 'sum by(service) (rate(metric[5m]))', description: 'Aggregate across label dimensions. `by(service)` keeps only the service label, summing all other labels together.' },
  { category: 'Prometheus', name: 'absent()', syntax: 'absent(up{job="api"})', description: 'Returns 1 if the selector matches no time series. Use in dead man\'s switch: alert if the "always up" metric is absent.' },
  { category: 'Prometheus', name: 'label_replace()', syntax: 'label_replace(metric, "dst", "$1", "src", "(.*)")', description: 'Adds or modifies a label on a metric using a regex. Useful for normalising label values across scrape targets.' },
  { category: 'Prometheus', name: 'Recording rule', syntax: 'record: job:http_requests:rate5m\nexpr: sum(rate(http_requests_total[5m]))', description: 'Pre-computes expensive PromQL expressions. Results stored as new metrics. Reduces dashboard query load and enables burn rate alerts.' },
  // ── SLO / ERROR BUDGET ──────────────────────────────────────────
  { category: 'SLO', name: 'Availability SLI', syntax: 'good_requests / total_requests', description: 'Fraction of requests that succeed. Must be measured with user-visible success criteria, not just HTTP 200 (a 200 with an error body is not a success).' },
  { category: 'SLO', name: 'Latency SLI', syntax: 'requests_under_threshold / total_requests', description: 'Fraction of requests completing under the latency threshold (e.g., 500ms). Threshold must be defined from user expectation research.' },
  { category: 'SLO', name: 'Error budget', syntax: '(1 - SLO_target) × window', description: 'Allowable failure volume. For 99.9% SLO over 30 days: 0.001 × 30 × 24 × 60 = 43.2 minutes of downtime allowed.' },
  { category: 'SLO', name: 'Burn rate', syntax: 'actual_error_rate / allowed_error_rate', description: '1× = consuming budget at exactly the right rate. 14× = budget exhausted in 2.5 days. Alert at 14× (short+long window) and 3× (warning).' },
  { category: 'SLO', name: 'Multi-window burn', syntax: '(burn_1h > 14) AND (burn_6h > 14)', description: 'Requires both short and long windows to exceed the threshold. Prevents false positives from brief spikes. The gold standard for SLO alerting.' },
  { category: 'SLO', name: 'Budget policy', syntax: '>50%: normal | 25-50%: low risk | <25%: reliability sprint | 0%: freeze', description: 'Pre-agreed action at each budget level. Must be written down and signed by both engineering and product leadership before deployment.' },
  // ── OPENTELEMETRY ───────────────────────────────────────────────
  { category: 'OpenTelemetry', name: 'Tracer', syntax: "tracer.startActiveSpan('name', span => { ... span.end(); })", description: 'Create a span and set it as the active context. Child spans created within the callback are automatically parented to this span.' },
  { category: 'OpenTelemetry', name: 'Span attributes', syntax: "span.setAttribute('http.method', 'GET')", description: 'Structured key-value data on a span. Use OpenTelemetry semantic conventions for standard attributes (http.*, db.*, rpc.*). These enable cross-vendor tooling.' },
  { category: 'OpenTelemetry', name: 'Span events', syntax: "span.addEvent('cache.miss', { key: 'user:123' })", description: 'Timestamped log-like messages within a span. Use for significant moments within a span\'s lifetime (cache miss, retry, etc.).' },
  { category: 'OpenTelemetry', name: 'Context propagation', syntax: 'W3C traceparent: 00-traceId-spanId-flags', description: 'Passes trace context across service boundaries via HTTP headers. traceparent carries traceId + spanId. tracestate carries vendor-specific data.' },
  { category: 'OpenTelemetry', name: 'Sampling', syntax: 'TraceIdRatioBased: 0.01 (1%)', description: 'Head sampling: decided at trace start. Tail sampling: decided after trace completes (keeps 100% of slow/error traces). Use tail sampling for SLO investigations.' },
  { category: 'OpenTelemetry', name: 'Exemplar', syntax: 'Gauge.observe(value, { traceId, spanId })', description: 'Links a specific metric data point to a trace. In Grafana: click the ◆ on a high-latency spike to jump directly to the matching trace.' },
  { category: 'OpenTelemetry', name: 'OTLP', syntax: 'OTLP/gRPC :4317 | OTLP/HTTP :4318', description: 'OpenTelemetry Protocol — the wire format for OTel data (traces, metrics, logs). Supported by all major backends (Tempo, Jaeger, Datadog, etc.).' },
  // ── LOGGING ─────────────────────────────────────────────────────
  { category: 'Logging', name: 'Structured log', syntax: '{ "level": "error", "msg": "...", "traceId": "...", "userId": "..." }', description: 'JSON format log. Every field is queryable in Loki/Elasticsearch. traceId field enables jumping from log to trace. Never interpolate dynamic data into the message string.' },
  { category: 'Logging', name: 'Log levels', syntax: 'ERROR > WARN > INFO > DEBUG', description: 'Production: INFO and above. ERROR = requires investigation. WARN = unexpected but recoverable. INFO = significant events. DEBUG = verbose detail (dev only).' },
  { category: 'Logging', name: 'LogQL filter', syntax: '{service="api"} | json | level="error" | message =~ "timeout"', description: 'Loki query language. Stream selector {} filters by labels. json parses the log line. | field=value filters by structured fields. |~ for regex.' },
  { category: 'Logging', name: 'LogQL metrics', syntax: 'rate({service="api"} | json | level="error" [5m])', description: 'Derives a metric from log lines. Count errors per second from logs without needing a separate Prometheus metric. Useful for log-based alerting.' },
  { category: 'Logging', name: 'Correlation ID', syntax: 'X-Request-ID header → requestId field in all logs', description: 'Unique ID per request, propagated across all services. Enables filtering all log lines for a single user request across microservices.' },
  { category: 'Logging', name: 'Sampling logs', syntax: 'if (Math.random() < 0.01) logger.info(heavyPayload)', description: 'Sample verbose log lines (like full request bodies) to control log volume. Always log ERROR and above at 100%. Sample INFO/DEBUG at 1-10%.' },
  // ── ALERTING ────────────────────────────────────────────────────
  { category: 'Alerting', name: 'Inhibition rule', syntax: 'source_match: severity=critical\ntarget_match: service=*\nequal: [instance]', description: 'Suppresses child alerts when a parent alert is active on the same instance. Prevents 50 service alerts when a host is already paged as down.' },
  { category: 'Alerting', name: 'Dead man\'s switch', syntax: "expr: vector(1) # always fires", description: 'Heartbeat alert forwarded to healthchecks.io. If Alertmanager stops sending it, the snitch pages on-call. Detects failure of the alerting pipeline itself.' },
  { category: 'Alerting', name: 'Mute timing', syntax: 'time_intervals: weekdays Mon-Fri, times 02:00-04:00', description: 'Recurring time windows when notifications are suppressed. For regular maintenance windows. Defined in Alertmanager notification policy.' },
  { category: 'Alerting', name: 'for: duration', syntax: 'for: 5m', description: 'Alert must continuously satisfy the expression for this duration before firing. Prevents flapping. Use 1-2m for critical, 5-15m for warnings.' },
  // ── INCIDENT RESPONSE ───────────────────────────────────────────
  { category: 'Incident Response', name: 'SEV1', syntax: 'All users impacted | revenue loss | data at risk', description: 'Highest severity. Immediate page, incident commander declared, status page updated. All hands if needed. MTTR target < 30 minutes.' },
  { category: 'Incident Response', name: 'SEV2', syntax: 'Partial impact | degraded | SLO breach imminent', description: 'Significant but not total. Page on-call. Update status page if user-facing. MTTR target < 2 hours.' },
  { category: 'Incident Response', name: 'MTTD', syntax: 'avg(alert_time - incident_start_time)', description: 'Mean Time To Detect. Reduced by good SLI alerting with short detection windows. Target: < 5 minutes for user-facing failures.' },
  { category: 'Incident Response', name: 'MTTR', syntax: 'avg(resolved_time - detected_time)', description: 'Mean Time To Resolve. Reduced by runbooks, good dashboards, pre-defined escalation paths, and postmortem action item completion.' },
  { category: 'Incident Response', name: 'Five Whys', syntax: 'Why? → answer → Why that? → answer → (×5)', description: 'Root cause analysis technique. Each "why" drills one level deeper. The 5th answer is usually a systemic/process failure rather than a human mistake.' },
  // ── CHAOS ENGINEERING ───────────────────────────────────────────
  { category: 'Chaos', name: 'Experiment steps', syntax: '1.steady state 2.hypothesis 3.inject 4.observe 5.learn', description: 'The five-step scientific process for chaos experiments. Never skip step 1 (you cannot detect deviation without a baseline) or step 5 (the value is in the learning).' },
  { category: 'Chaos', name: 'PodChaos (Chaos Mesh)', syntax: 'action: pod-kill | mode: one | selector: app=svc', description: 'Kill one pod matching the selector. Verifies: K8s reschedule, health check restart, connection pool reconnect. First experiment to run.' },
  { category: 'Chaos', name: 'NetworkChaos', syntax: 'action: delay | latency: 500ms | direction: egress', description: 'Inject latency on outbound calls from the selected pods. Verifies: timeout configuration, circuit breaker thresholds, retry budget.' },
  // ── EBPF ────────────────────────────────────────────────────────
  { category: 'eBPF', name: 'kprobe', syntax: "bpftrace -e 'kprobe:vfs_read { @[comm] = count(); }'", description: 'Attaches to a kernel function call. Counts, measures, or traces every invocation at the kernel level — zero application code changes.' },
  { category: 'eBPF', name: 'uprobe', syntax: "bpftrace -e 'uprobe:/lib/libssl.so.3:SSL_write { ... }'", description: 'Attaches to a user-space function. Used by Pixie to intercept OpenSSL functions and read plaintext data after TLS decryption.' },
  { category: 'eBPF', name: 'Cilium Hubble', syntax: 'hubble observe --follow --namespace production', description: 'Real-time service flow visibility: which service calls which, allowed/dropped connections, L7 HTTP details — without sidecars.' },
];

const CATEGORIES = ['All', ...Array.from(new Set(ITEMS.map(i => i.category)))];

@Component({
  selector: 'app-obs-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class ObsCheatsheet {
  search = signal('');
  activeCategory = signal('All');
  categories = CATEGORIES;

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const cat = this.activeCategory();
    return ITEMS.filter(item =>
      (cat === 'All' || item.category === cat) &&
      (!q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.syntax.toLowerCase().includes(q))
    );
  });

  setCategory(cat: string) { this.activeCategory.set(cat); }
}
