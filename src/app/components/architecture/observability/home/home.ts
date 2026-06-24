import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Pillars': 'pillars', 'Metrics': 'metrics', 'Logging': 'logging',
  'Tracing': 'tracing', 'Alerting & SRE': 'sre', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Pillars', 'Metrics', 'Logging', 'Tracing', 'Alerting & SRE', 'Reference'];

const ALL_TOPICS: Topic[] = [
  // Pillars
  { title: 'Observability Fundamentals', route: '/observability/observability-fundamentals', badge: 'Pillars', available: true,
    description: 'Metrics, logs, and traces — the three pillars of observability. Understanding the difference between monitoring and observability.',
    keyPoints: ['Monitoring: watching known unknowns; Observability: exploring unknown unknowns', 'Metrics: aggregated numbers; Logs: events; Traces: request flows', 'Cardinality: high-cardinality labels break time-series databases'] },
  { title: 'OpenTelemetry',             route: '/observability/opentelemetry', badge: 'Pillars', available: true,
    description: 'The open standard for instrumentation — SDK, Collector, semantic conventions, and vendor-neutral telemetry.',
    keyPoints: ['OTel SDK instruments your application; Collector receives, processes, exports', 'Semantic conventions: http.method, db.system, rpc.service — consistent labelling', 'Propagation: W3C TraceContext header carries trace/span IDs across services'] },
  { title: 'SLI, SLO & SLA',           route: '/observability/sli-slo-sla', badge: 'Pillars', available: true,
    description: 'Service Level Indicators, Objectives, and Agreements — how to measure and commit to reliability.',
    keyPoints: ['SLI: the metric (99th-percentile latency, error rate)', 'SLO: the target (latency p99 < 200ms over 28 days)', 'Error budget: 100% - SLO = budget to spend on risk; drives toil prioritisation'] },

  // Metrics
  { title: 'Prometheus & Metrics',      route: '/observability/prometheus-metrics', badge: 'Metrics', available: true,
    description: 'Counters, gauges, histograms, summaries — and writing PromQL queries that answer real operational questions.',
    keyPoints: ['Counter: monotonically increasing (request count, error count)', 'Histogram: distribution of values (latency, request size); percentiles via PromQL', 'rate() vs irate(): rate over range vs instant rate — choose based on scrape interval'] },
  { title: 'Grafana Dashboards',        route: '/observability/grafana-dashboards', badge: 'Metrics', available: true,
    description: 'Dashboard design principles, variable templating, annotations, and the USE/RED dashboard methodologies.',
    keyPoints: ['USE (Utilisation, Saturation, Errors): for infrastructure resources', 'RED (Rate, Errors, Duration): for services / request-driven workloads', 'Dashboard-as-code: Grafana Terraform provider or Grafonnet (jsonnet)'] },
  { title: 'Custom Application Metrics', route: '/observability/custom-app-metrics', badge: 'Metrics', available: true,
    description: 'Instrumenting Node.js apps with OpenTelemetry Metrics or Prometheus client — meters, instruments, and best practices.',
    keyPoints: ['prom-client: Counter, Gauge, Histogram — register once at module load', 'Cardinality trap: do not use user IDs as label values', 'Exemplars: attach trace ID to a histogram bucket for drill-down'] },
  { title: 'Infrastructure Metrics',   route: '/observability/infrastructure-metrics', badge: 'Metrics', available: true,
    description: 'CPU, memory, disk I/O, network — essential host and container metrics and when to alert on them.',
    keyPoints: ['CPU steal: time waiting for hypervisor — signals noisy neighbour', 'Memory: RSS vs VSZ; container memory limits vs requests', 'Disk I/O saturation: iowait > 20% indicates disk bottleneck'] },

  // Logging
  { title: 'Structured Logging',        route: '/observability/structured-logging', badge: 'Logging', available: true,
    description: 'JSON logs, log levels, correlation IDs, and why structured logging beats free-text in production.',
    keyPoints: ['Structured: { "level":"info", "msg":"...", "traceId":"..." } — queryable', 'Correlation ID: propagate from request entry point through all log entries', 'Pino, Winston, Bunyan for Node.js structured logging'] },
  { title: 'Log Aggregation',           route: '/observability/log-aggregation', badge: 'Logging', available: true,
    description: 'Centralised logging with ELK Stack, Loki, or cloud-native solutions — ingestion, indexing, and retention.',
    keyPoints: ['Filebeat → Logstash → Elasticsearch → Kibana (ELK)', 'Grafana Loki: label-based index (cheaper), logQL queries', 'Retention tiers: hot (7d), warm (30d), cold/S3 (1y+)'] },
  { title: 'Log Best Practices',        route: '/observability/log-best-practices', badge: 'Logging', available: true,
    description: 'What to log, what NOT to log (PII/secrets), log levels, and sampling high-volume logs.',
    keyPoints: ['Never log passwords, tokens, credit card numbers, or SSNs', 'Log at request entry/exit; avoid logging inside tight loops', 'Head sampling vs tail sampling: tail sampling keeps interesting traces'] },

  // Tracing
  { title: 'Distributed Tracing',       route: '/observability/distributed-tracing', badge: 'Tracing', available: true,
    description: 'Trace propagation across services, span lifecycle, sampling strategies, and root-cause analysis workflows.',
    keyPoints: ['Every outbound call creates a child span with the same trace ID', 'Sampling: head (decide at trace start), tail (decide at trace end)', 'Jaeger, Zipkin, Tempo — query by trace ID, service, duration'] },
  { title: 'OpenTelemetry Tracing',     route: '/observability/opentelemetry-tracing', badge: 'Tracing', available: true,
    description: 'Instrumenting Node.js services with OTel tracing — auto-instrumentation, manual spans, and span attributes.',
    keyPoints: ['startActiveSpan() for custom spans; auto-instrumentation for HTTP and DB', 'SpanKind: SERVER, CLIENT, PRODUCER, CONSUMER, INTERNAL', 'Baggage API: propagate user-tier or tenant ID across service boundaries'] },
  { title: 'Performance Profiling',     route: '/observability/performance-profiling', badge: 'Tracing', available: true,
    description: 'Continuous profiling with Pyroscope, CPU/memory flame graphs, and correlating profiles with traces.',
    keyPoints: ['Flame graph: x-axis = time; y-axis = call stack depth; width = CPU time', 'Pyroscope: continuous profiling — queryable for any historical time window', 'Event loop lag: low CPU + high p99 = synchronous blocking operation'] },

  // Alerting & SRE
  { title: 'Alerting Design',           route: '/observability/alerting-design', badge: 'Alerting & SRE', available: true,
    description: 'Alert fatigue, symptom-based vs cause-based alerting, runbooks, and paging philosophy.',
    keyPoints: ['Alert on symptoms (user-visible impact), not causes (CPU spike)', 'Every alert should have an associated runbook', 'Burn rate alerts: detect SLO budget consumption faster than threshold alerts'] },
  { title: 'On-Call & Incident Management', route: '/observability/on-call-incidents', badge: 'Alerting & SRE', available: true,
    description: 'On-call rotations, PagerDuty/OpsGenie, incident severity levels, blameless post-mortems.',
    keyPoints: ['SEV1: full outage; SEV2: major degradation; SEV3: partial impact', 'Incident commander role: coordinates response, not implementation', 'Blameless post-mortem: 5 Whys root cause, not person blame'] },
  { title: 'Error Budgets & Toil',      route: '/observability/error-budgets-toil', badge: 'Alerting & SRE', available: true,
    description: 'Using error budgets to decide when to ship features vs when to improve reliability.',
    keyPoints: ['Error budget depleted: freeze releases, focus on reliability work', 'Toil: manual, repetitive operational work — measure and reduce', 'Toil budget: SRE teams target < 50% time on toil'] },
  { title: 'Chaos Engineering',         route: '/observability/chaos-engineering', badge: 'Alerting & SRE', available: true,
    description: 'Controlled failure injection — GameDays, Chaos Mesh, and resilience hypothesis testing.',
    keyPoints: ['Hypothesis: "the system will remain available when X fails"', 'Start small: kill a single pod in staging; graduate to production', 'Chaos Mesh, Litmus, Gremlin, AWS Fault Injection Simulator'] },

  // Reference
  { title: 'Cloud-Native Monitoring',    route: '/observability/cloud-native-monitoring', badge: 'Metrics', available: true,
    description: 'Datadog, New Relic, Azure Monitor, and AWS CloudWatch — cloud-native APM trade-offs vs self-hosted.',
    keyPoints: ['Datadog APM: auto-instrumentation + agent, rich out-of-box dashboards', 'Azure Monitor + Application Insights: native for Azure-hosted workloads', 'Self-hosted (Prometheus+Grafana): more control, more ops overhead', 'Vendor lock-in mitigation: OTel SDK with OTLP export to any backend', 'Cost: cloud APM is expensive at scale — profile before committing'] },
  { title: 'eBPF Observability',        route: '/observability/ebpf-observability', badge: 'Pillars', available: true,
    description: 'Zero-instrumentation observability with eBPF — Pixie, Cilium Hubble, and kernel-level telemetry.',
    keyPoints: ['eBPF: runs sandboxed kernel programs — no code change required', 'Automatic L7 protocol detection (HTTP, gRPC, DNS)', 'Pixie: in-cluster eBPF observability for Kubernetes', 'Cilium Hubble: network-level service graph via eBPF', 'Low overhead compared to sidecar proxies'] },
  { title: 'Observability Maturity Model', route: '/observability/observability-maturity', badge: 'Pillars', available: true,
    description: 'Levels from reactive logging to proactive observability — assessing and evolving your team\'s practice.',
    keyPoints: ['Level 1: infra monitoring, uptime checks', 'Level 2: RED metrics, tracing, structured logs', 'Level 3: SLOs, error budgets, burn rate alerts', 'Level 4: continuous profiling, chaos, anomaly detection'] },
  { title: 'Observability Cheat Sheet', route: '/observability/cheatsheet', badge: 'Reference', available: true,
    description: 'PromQL quick reference, OTel SDK setup, log level guide, SLO math, and alerting patterns.',
    keyPoints: ['PromQL: rate(), sum(), histogram_quantile() at a glance', 'Multi-window burn rate: (1h > 14×) AND (6h > 14×)', 'Alert routing: severity → channel mapping guide'] },
  { title: 'SRE Interview Prep',        route: '/observability/interview-prep', badge: 'Reference', available: true,
    description: '15 SRE/observability interview questions — from SLI/SLO/SLA to incident command to chaos engineering.',
    keyPoints: ['Entry: log levels, metrics vs logs, SLI definition', 'Mid: SLO design, Prometheus queries, alert design', 'Senior: error budget policy, toil reduction, chaos engineering'] },
];

@Component({
  selector: 'app-observability-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class ObservabilityHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'pillars'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
