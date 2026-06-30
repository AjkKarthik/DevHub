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
  { name: 'Loki',          type: 'keyword', desc: 'Grafana\'s log aggregation system — indexes only labels (not full text), stores compressed log chunks. "Prometheus for logs."' },
  { name: 'LogQL',         type: 'keyword', desc: 'Loki\'s query language. Log pipeline: {selector} | json | filter | format | metric. Inspired by PromQL.' },
  { name: 'Promtail',      type: 'keyword', desc: 'Loki\'s log shipper — runs as DaemonSet on K8s nodes, tails pod log files, adds K8s labels, ships to Loki.' },
  { name: 'ELK Stack',     type: 'keyword', desc: 'Elasticsearch + Logstash + Kibana — full-text search on log content, powerful but resource-heavy. Alternative to Loki.' },
  { name: 'Log retention', type: 'keyword', desc: 'How long to keep logs. Hot storage (fast query): 7-30 days. Cold/archive: 90 days - 7 years. Tiered storage reduces cost.' },
  { name: 'Log sampling',  type: 'keyword', desc: 'Only shipping a fraction (e.g., 10%) of high-volume INFO logs to reduce ingestion cost while keeping all errors.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Log Aggregation Architecture',
    points: [
      'In a distributed system, each pod writes logs to stdout. The container runtime writes them to files on the node. Log shippers (Promtail, Fluentd, Filebeat) tail those files, add metadata, and ship to the aggregation backend.',
      'The aggregation backend (Loki, Elasticsearch, CloudWatch Logs) indexes and stores the logs. The query frontend (Grafana Explore, Kibana, CloudWatch Insights) provides the search interface.',
      'Loki vs Elasticsearch: Loki only indexes labels (service name, pod name, namespace) — not full log content. Full-text search is done at query time with regex. This makes ingestion cheap but full-text search slower. Elasticsearch indexes all content at ingest time — full-text search is fast but storage and CPU cost is high.',
      'When to use what: Loki for structured JSON logs you query by field values. Elasticsearch for logs you need to full-text search across all content (security logs, audit trails, unstructured legacy logs).',
    ],
  },
  {
    heading: 'Loki and LogQL',
    points: [
      'Loki streams: a stream is a set of log lines with the same label set (e.g., `{service="order-service", env="production"}`). Loki is optimised for few, distinct streams with many log lines per stream.',
      'Log selector: `{service="order-service"}` — selects all log lines from the order service. `{service=~"order|payment"}` selects multiple services using regex.',
      'Log pipeline: `{service="order-service"} | json | level="error" | line_format "{{.message}} {{.orderId}}"`. Chain filters: json parser → field filter → output format.',
      'Metric queries from logs: `rate({service="order-service"} | json | level="error"[5m])` — error rate from logs. `histogram_quantile(0.99, sum(rate({service="api"} | json | unwrap durationMs[5m])) by (le))` — p99 from log field.',
    ],
  },
  {
    heading: 'Log Shipping in Kubernetes',
    points: [
      'DaemonSet pattern: Promtail runs one pod per node, tails `/var/log/pods/*/*.log`, and automatically discovers pods via Kubernetes API. Labels from pod annotations are applied to every log line.',
      'Recommended: write logs to stdout/stderr. Kubernetes writes them to node-level log files. Promtail tails the files. No log files to manage in the container.',
      'Log enrichment: Promtail can add namespace, pod, container, node, and even deployment name as labels to every log line from K8s metadata — no code changes required.',
      'Sidecar pattern (less common): a log-shipping sidecar container in each pod. Useful when you need per-pod configuration or when pods write to files instead of stdout.',
    ],
  },
  {
    heading: 'Cost Control: Retention and Sampling',
    points: [
      'Log volume at scale can be enormous — 10 services × 100 replicas × 1000 req/s × 2KB/log = 2GB/s. Even at $0.10/GB storage, that\'s $5M/month. Cost control is essential.',
      'Tiered retention: hot storage (Loki, Elasticsearch) for 7-30 days of full-resolution data. Cold storage (S3/GCS) for 90 days - 7 years at 10-100× lower cost. Configure Loki storage_config to use S3 for old chunks.',
      'Log sampling: drop a fraction of high-volume, low-value logs at the shipper (Promtail/Fluentd) before they reach the backend. Keep 100% of WARN/ERROR. Sample 10% of INFO for noisy endpoints like health checks.',
      'Log aggregation at source: instead of logging every cache hit, log only a counter per minute. Transform verbose logs into metrics at the OTel Collector or Fluent Bit level.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'LogQL Queries',
    language: 'typescript',
    code: `# ── LOG SELECTION ─────────────────────────────────────────────────

# All error logs from order-service
{service="order-service"} | json | level="error"

# Logs containing payment errors across multiple services
{service=~"order|payment"} |= "PAYMENT_DECLINED"

# Errors for a specific user
{env="production"} | json | level="error" | userId="usr_42"

# Slow requests (> 500ms)
{service="api"} | json | durationMs > 500

# ── METRIC QUERIES FROM LOGS ───────────────────────────────────────

# Error rate per service (from logs, not Prometheus)
sum(
  rate({env="production"} | json | level="error" [5m])
) by (service)

# p99 request duration from log durationMs field
histogram_quantile(0.99,
  sum(
    rate({service="api"} | json | unwrap durationMs [5m])
  ) by (le, service)
)

# Count of payment declined events
count_over_time(
  {service="payment"} | json | errorCode="PAYMENT_DECLINED" [1h]
)

# ── LOKI ALERTING RULE ────────────────────────────────────────────
# Fires when error log rate exceeds threshold
- alert: LogErrorRateHigh
  expr: |
    sum(rate({service="order-service"} | json | level="error"[5m])) > 10
  for: 2m
  labels: { severity: warning }`,
  },
  {
    label: 'Promtail Config',
    language: 'typescript',
    code: `# promtail-config.yaml — Kubernetes DaemonSet log shipping
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml  # tracks which log lines were shipped

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    pipeline_stages:
      # Parse JSON log lines
      - json:
          expressions:
            level: level
            traceId: traceId
            durationMs: durationMs
      # Extract log level as label (for Loki stream filtering)
      - labels:
          level:
          # Do NOT add high-cardinality fields (userId, traceId) as Loki labels!
          # They create stream explosion — add as log line fields instead
      # Drop DEBUG logs in production — cost savings
      - match:
          selector: '{env="production"}'
          stages:
            - drop:
                expression: '.*"level":"debug".*'
      # Sample 10% of health check logs
      - match:
          selector: '{job="kubernetes-pods"}'
          stages:
            - drop:
                expression: '"path":"/health"'
                drop_counter_reason: health_check_sample
                # Drop 90% of health checks:
                # keep only when hash(log_line) % 10 == 0
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_pod_container_name]
        target_label: container
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: service`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Adding high-cardinality fields as Loki labels',
    wrong: `# Promtail pipeline adding traceId and userId as Loki stream labels
- labels:
    traceId:   # millions of unique trace IDs = millions of streams
    userId:    # millions of unique users = millions of streams
# Loki has an in-memory stream index — this OOM kills Loki`,
    right: `# Only low-cardinality fields as Loki labels
- labels:
    level:       # 5 values: debug/info/warn/error/fatal
    service:     # dozens of services
    namespace:   # handful of K8s namespaces
# traceId and userId remain as JSON fields in the log line body
# Query: {service="api"} | json | traceId="abc123"`,
    explanation: 'Loki keeps an in-memory index of all active stream label combinations. Adding high-cardinality fields (traceId = unique per request, userId = unique per user) creates millions of streams, which exhausts Loki\'s memory and crashes it. Only use labels for fields with a small, bounded set of values (log level, service name, K8s namespace). Query high-cardinality values using LogQL JSON parsing (`| json | traceId="abc123"`).',
  },
  {
    title: 'Not setting log retention policies — unbounded storage growth',
    wrong: `# No retention configured — Loki keeps all logs forever
# After 6 months: 10TB of logs
# Query for recent logs is slow — compaction not configured
# Storage costs are enormous
# Old logs from decommissioned services still being stored`,
    right: `# loki-config.yaml — tiered retention
limits_config:
  retention_period: 744h  # 31 days hot storage
compactor:
  retention_enabled: true
  retention_delete_delay: 2h
# Archive to S3 for cold storage via storage_config:
storage_config:
  aws:
    s3: s3://loki-bucket/
  bos:
    bucket_name: loki-chunks
  tsdb_shipper:
    active_index_directory: /loki/tsdb-index
    cache_location: /loki/tsdb-cache`,
    explanation: 'Without retention policies, log storage grows indefinitely. Configure tiered retention: 7-30 days in hot storage (SSD/fast object storage) for recent queries, archive to cold object storage (S3 Glacier) for 90 days to 7 years for compliance. Loki\'s compactor handles retention deletion automatically when `retention_enabled: true`.',
  },
  {
    title: 'Shipping all logs including health check and metrics scrape logs',
    wrong: `# Every /health request (every 5s per pod) and /metrics scrape generates logs
# 100 pods × 12 health checks/min × 1440 min/day = 1.7M health check logs/day
# These logs contain no useful information for debugging
# Pure waste: ingestion cost, query noise, storage`,
    right: `# Drop health check and metrics logs at Promtail level
- match:
    selector: '{job="kubernetes-pods"}'
    stages:
      - drop:
          expression: '"path":"/health"'
      - drop:
          expression: '"path":"/metrics"'
          drop_counter_reason: metrics_scrape
# Metrics scrape and health check events → counters, not logs`,
    explanation: 'Health check and Prometheus scrape endpoints are called every 5-15 seconds per pod. These generate enormous log volume with zero diagnostic value — the information they contain (status 200) is already captured by HTTP metrics. Drop them at the shipper level (Promtail pipeline `drop` stage) before they reach Loki. Track health check success via metrics, not logs.',
  },
  {
    title: 'Querying Loki with no stream selector — full scan',
    wrong: `# No stream selector — scans ALL log lines
{} | json | userId="usr_42"
# Equivalent to "SELECT * FROM logs WHERE userId = ?" with no index
# Loki reads every chunk in storage — extremely slow, times out`,
    right: `# Always specify stream labels to narrow scope first
{service="order-service", env="production"} | json | userId="usr_42"
# Only scans chunks for order-service in production
# 100× faster — Loki can skip irrelevant chunks entirely`,
    explanation: 'Loki\'s stream index is based on label values — it can quickly identify which log chunks belong to a given stream. Without a stream selector, Loki must scan all chunks for all streams. Always specify at least one label selector (service, namespace) to narrow the scope before applying field filters. This is the most impactful query optimisation for Loki.',
  },
];

const challenge: Challenge = {
  title: 'Parse a LogQL stream selector',
  language: 'typescript',
  description: `Implement parseStreamSelector(query: string): Record<string, string>
Parse the label selector from a LogQL query: {service="api",env="prod"}
Return the labels as key-value pairs. Only handle exact match (=), no regex.
Return empty object if no valid selector found.`,
  hints: ['Find content between { and }', 'Split by comma, then split each pair by =', 'Strip surrounding quotes from values'],
  starterCode: `function parseStreamSelector(query: string): Record<string, string> {
  return {};
}

console.log(parseStreamSelector('{service="api",env="prod"}'));
// { service: 'api', env: 'prod' }

console.log(parseStreamSelector('{service="order-service"} | json | level="error"'));
// { service: 'order-service' }

console.log(parseStreamSelector('no selector here'));
// {}`,
  solution: `function parseStreamSelector(query: string): Record<string, string> {
  const match = query.match(/\\{([^}]*)\\}/);
  if (!match) return {};
  const inner = match[1].trim();
  if (!inner) return {};
  const result: Record<string, string> = {};
  for (const pair of inner.split(',')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (key && val) result[key] = val;
  }
  return result;
}

console.log(parseStreamSelector('{service="api",env="prod"}'));
console.log(parseStreamSelector('{service="order-service"} | json | level="error"'));
console.log(parseStreamSelector('no selector here'));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key architectural difference between Loki and Elasticsearch for log storage?',
    options: [
      'Loki supports SQL queries while Elasticsearch uses a proprietary query language',
      'Loki only indexes stream labels (service, namespace), querying log content at runtime; Elasticsearch indexes all log content at ingest time for fast full-text search',
      'Loki is cloud-only while Elasticsearch must be self-hosted on-premises',
      'Loki uses a relational storage model while Elasticsearch uses a document model',
    ],
    answer: 1,
    explanation: 'This architectural difference drives the cost/performance tradeoff. Loki\'s label-only index makes ingestion cheap and storage compact (logs are compressed chunks, not indexed documents). Full-text search is done at query time by scanning compressed chunks — slower for ad-hoc text search but fast for field-based queries on structured JSON logs. Elasticsearch indexes every word at ingest time, making full-text search instant but at significantly higher CPU, memory, and storage cost.',
  },
  {
    q: 'Why should traceId NOT be used as a Loki stream label even though it would enable per-trace log queries?',
    options: [
      'TraceIds are too long to be stored efficiently as Loki label values',
      'Each unique traceId creates a new Loki stream; millions of requests per day = millions of streams, exhausting Loki\'s in-memory stream index',
      'Loki does not support UUID-format values in stream labels',
      'TraceIds are ephemeral and Loki requires stable label values that persist across restarts',
    ],
    answer: 1,
    explanation: 'Loki keeps an in-memory index of all active stream label combinations (called the "stream index"). Every unique label value combination creates a new stream entry. TraceIds are unique per request — with 1 million requests per day, you create 1 million new Loki streams daily. This exhausts memory and slows indexing. Keep traceId as a JSON field in the log body; query it with `| json | traceId="abc123"` after a label-based stream selector that limits the scope.',
  },
  { q: 'What is the ELK stack and what role does each component play?', options: ['Elasticsearch, Lambda, Kubernetes — a serverless log processing pipeline', 'Elasticsearch (search and storage), Logstash (ingestion and transformation), and Kibana (visualization); together they form a popular log aggregation and analysis platform', 'Edge, Load balancer, Kubernetes — a networking stack for distributed systems', 'Elasticsearch, Logstash, Kafka — a streaming log pipeline for real-time analytics'], answer: 1, explanation: 'ELK stack: Elasticsearch: a distributed search and analytics engine. Stores log documents as JSON. Full-text search across all fields. Scales horizontally. Logstash: a log processing pipeline. Reads from many input sources (files, Kafka, syslog, Beats). Transforms and enriches (parse fields, add geoIP, drop sensitive fields). Writes to outputs (Elasticsearch, S3, Kafka). Kibana: a web UI for Elasticsearch. Discover (search and filter logs). Visualize (charts and dashboards). Lens (drag-and-drop visualization builder). SIEM (security dashboards). Modern evolution: Beats (Filebeat, Metricbeat) supplement Logstash as lightweight data shippers. The Elastic Stack now includes APM, SIEM, and Fleet for agent management. Competing stack: the Grafana stack (Loki, Grafana) is a popular lightweight alternative.' },
  { q: 'What is Loki and how does it differ from Elasticsearch for log storage?', options: ['Loki stores logs compressed in object storage and indexes only labels (not log content) making it much cheaper; Elasticsearch indexes all log content enabling full-text search at higher storage and cost', 'Loki is a time-series database for metrics; Elasticsearch handles logs only', 'Both are equivalent; Loki is a newer version of Elasticsearch with a different query language', 'Loki requires a separate Kafka cluster for log ingestion; Elasticsearch can ingest logs directly'], answer: 1, explanation: 'Loki (Grafana Labs): like Prometheus but for logs. Labels-only indexing: only the metadata labels (app, namespace, level) are indexed — not the log content. Log streams are stored compressed in object storage (S3, GCS). LogQL query language is very similar to PromQL. Advantages: dramatically lower storage cost (compressed chunks vs full-text index). Lower operational overhead. Native Grafana integration. Disadvantages: no full-text search (you must know which labels to filter on). Regex search of log content is slower than Elasticsearch full-text index. When to choose Elasticsearch: you need full-text search across all log fields. Security use cases (SIEM). Complex log analytics. When to choose Loki: Kubernetes-native workloads. Cost-sensitive environments. Already using Prometheus and Grafana.' },
  { q: 'What is log sampling and when should it be applied?', options: ['Log sampling reduces log retention period to lower storage costs', 'Log sampling discards a percentage of logs to reduce volume while preserving statistical accuracy; applied to high-volume debug or info logs where 100% collection is unnecessary and cost-prohibitive', 'Log sampling randomly increases log detail level for specific requests to improve debugging', 'Log sampling is only applied to distributed trace logs; application logs should never be sampled'], answer: 1, explanation: 'Log sampling: not all logs are equally valuable. High-volume debug and info logs from healthy code paths may be sampled (keep 10%, discard 90%). Never sample: error logs (keep 100%). Warning logs (keep 100%). Security audit logs (keep 100%). Logs for requests that have errors or high latency. Sampling strategies: random (simple, loses correlated logs). Head-based (decide at request start — all logs for a request are kept or dropped together). Tail-based (keep logs for requests that result in errors). Probabilistic on log level (keep 100% error, 50% warning, 1% info, 0% debug). Implementation: in the logging library, check a sampling decision before emitting the log. The decision should be consistent for a given request (same as trace sampling decision).' },
  { q: 'What are the most important fields to include in a structured log entry?', options: ['Only the log message and timestamp are required; additional fields add unnecessary parsing overhead', 'Timestamp, log level, message, service name, trace ID, span ID, and relevant business context (user ID, order ID, request path); structured logs enable filtering, correlation, and aggregation', 'Log level and message are sufficient; timestamps add storage overhead at scale', 'Structured logs should only include technical fields; business identifiers like user IDs should not be in logs for privacy reasons'], answer: 1, explanation: 'Structured log required fields: timestamp (ISO 8601): precise to milliseconds for accurate event ordering. level: ERROR, WARN, INFO, DEBUG. message: a human-readable summary. service: which service emitted the log. Correlation fields: traceId and spanId (from the active trace context for log-trace correlation). Request context: requestId, httpMethod, httpPath, httpStatus, durationMs. Business context: userId, tenantId, orderId (relevant identifiers for the operation). Error fields: errorType, errorMessage, stackTrace (for error logs only). Environment: environment (production, staging), region, podName. What to avoid in logs: full request/response bodies (PII risk, storage cost). Credit card numbers, passwords, tokens (never log secrets). Full SQL queries with bound parameters (may contain sensitive data). Log each field as a separate structured key-value pair, not concatenated into the message.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Loki vs Elasticsearch for log aggregation?',
    a: '<strong>Choose Loki when</strong>: <ul><li>Your logs are structured JSON — query by field values, not full text</li><li>You already use Grafana — native integration with Explore and dashboards</li><li>Cost is a concern — Loki is 10-100× cheaper to operate than Elasticsearch at the same scale</li><li>You want to query metrics and logs in the same interface (Grafana + Prometheus + Loki)</li><li>You\'re running in Kubernetes — Promtail DaemonSet integration is first-class</li></ul><strong>Choose Elasticsearch when</strong>: <ul><li>You need fast full-text search across all log content (security audit logs, unstructured application logs)</li><li>You need complex aggregations and analytics on log data (e.g., user behaviour analysis)</li><li>You already have Kibana expertise or dashboards</li><li>You\'re handling compliance logs that require document-level access control (Elasticsearch security features)</li></ul>For most microservices observability use cases, Loki is the right choice. Elasticsearch is better for search-centric use cases.',
  },
  {
    q: 'How do I handle log volume cost at high scale (10,000 req/s)?',
    a: 'Multi-layered cost control: <ol><li><strong>Drop noisy low-value logs at shipper</strong>: health checks, /metrics scrapes, static asset requests. Zero diagnostic value, high volume.</li><li><strong>Sample INFO logs for non-critical paths</strong>: keep 100% of WARN/ERROR, 100% of critical paths (payment, auth), 10% of routine paths (product listing, search). Use Promtail/Fluent Bit sampling stages.</li><li><strong>Aggregate at source</strong>: instead of logging every cache hit, increment a counter and log a summary every 60 seconds. Convert repetitive logs to metrics via the OTel Collector `log to metric` transform.</li><li><strong>Tiered retention</strong>: hot storage 7 days, cold S3 30-90 days, archive 1-7 years. Query recent data fast; old data on slower storage.</li><li><strong>Compression</strong>: Loki and Elasticsearch both compress log data significantly — structured JSON compresses 10-20× with gzip/snappy. Loki chunks are ~10× smaller than raw text on average.</li></ol>At 10,000 req/s with 2KB average log, raw volume is ~1.7TB/day. With sampling + compression + dropping, typical effective storage is 20-100GB/day — manageable and affordable.',
  },
  { q: 'How do you manage log retention and cost effectively at scale?', a: 'Log retention strategy: tiered retention: hot tier (fast SSD storage) for recent logs (last 7-30 days). Warm tier (slower magnetic storage or S3 Intelligent-Tiering) for medium-term logs (30-90 days). Cold tier (S3 Glacier or similar) for compliance archival (1-7 years). Cost reduction tactics: log level filtering: do not collect DEBUG logs from production in normal operation. Structured log compression: JSON logs compress very well (4-10x). Enable compression in the log shipper. Sampling: sample high-volume healthy logs as described. Retention by level: keep ERROR logs for 1 year. Keep INFO/WARN for 30 days. Keep DEBUG for 3 days (if collected at all). Review log volume dashboards monthly: identify which services are logging the most. Work with those service teams to reduce unnecessary logging. Cloud-managed: AWS CloudWatch Logs Insights, Google Cloud Logging, and Azure Monitor Logs handle retention and tiering automatically but charge by ingestion volume.' },
  { q: 'What is Fluentd vs Filebeat vs Promtail for log shipping?', a: 'Fluentd: a versatile log aggregator and forwarder. Runs as a DaemonSet in Kubernetes. Rich plugin ecosystem (200+ input and output plugins). Can buffer, parse, filter, and route logs. Higher resource usage. Good for complex log routing. Fluent Bit: the lightweight sibling of Fluentd (written in C). Lower memory usage. Suitable for constrained environments. Fewer plugins but covers most use cases. The Kubernetes default in many managed clusters. Filebeat (Elastic): a lightweight log shipper from the Elastic ecosystem. Sends to Elasticsearch, Logstash, or Kafka. Built-in Kubernetes autodiscovery. Part of the Elastic Beats family. Promtail (Grafana): the recommended log shipper for Loki. Native Kubernetes service discovery. Supports the same label configuration as Prometheus (relabeling rules). Lightweight. Pipeline discovery works identically to Prometheus. Choice: use Promtail for Loki. Use Filebeat for Elasticsearch/Elastic Stack. Use Fluent Bit when flexibility and low resource usage are both needed.' },
  { q: 'How do you implement log-based alerting and what are its limitations?', a: 'Log-based alerting: count log lines matching a pattern over a time window and alert when the count exceeds or drops below a threshold. Examples: alert when error log count exceeds 100 per minute. Alert when a specific error message appears more than 5 times per minute. Alert when no logs are received from a service for 5 minutes (dead man switch). Implementation in Loki: LogQL count_over_time or rate queries used in Grafana alerting rules. In Elasticsearch: Kibana alerting with kibana.alert rules and Watcher rules. In CloudWatch: CloudWatch Metric Filters extract a metric from log content. Limitations: log-based alerting latency: logs must be shipped, parsed, and indexed before the alert can evaluate. This adds 30-120 seconds of delay compared to metrics-based alerting. Volume sensitivity: if log shipping is delayed or buffered, alert conditions may fire late or not at all. High-volume log parsing in the alerting system adds load. Recommendation: use metrics for low-latency alerting. Use log-based alerts for pattern detection where the specific log message content is important.' },
  { q: 'What security and compliance considerations apply to log aggregation?', a: 'PII and sensitive data: never log passwords, API keys, credit card numbers, or SSNs. Mask or truncate sensitive fields before logging. Log masking libraries (logback Masking, Serilog enrichers) can automatically redact patterns matching PII. Access control: who can view production logs? Limit access to need-to-know. Role-based access in Kibana, Grafana, and Cloud logging systems. Compliance retention: PCI DSS, HIPAA, SOC 2, and GDPR may require logs to be retained for 1-7 years and be tamper-proof. Use immutable storage (S3 Object Lock, Azure Immutable Blob Storage). Audit logs: maintain separate audit logs for who accessed what data, administrative actions, and authentication events. Audit logs must be tamper-proof and separate from application logs. Encryption: encrypt logs in transit (TLS) and at rest (S3 SSE, Elasticsearch encryption). Log integrity: tamper-evident logging (hash chaining or Merkle tree structures) for forensic-grade audit trails.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Loki = label-indexed log aggregation. LogQL: {selector} | json | filter | metric. Promtail DaemonSet ships K8s pod logs. Only label low-cardinality fields.',
  mustKnow: [
    'Loki indexes only stream labels (service, env, level) — not log content. Fast ingestion, cost-effective. Full-text search at query time.',
    'LogQL pipeline: {stream selector} | json | field=value filter | unwrap field | metric function',
    'Promtail: DaemonSet tailing pod stdout files, enriching with K8s metadata labels, shipping to Loki',
    'Never add high-cardinality fields (traceId, userId) as Loki stream labels — causes stream explosion and OOM',
    'Always start LogQL queries with a stream selector ({service="api"}) — without it, Loki full-scans all chunks',
    'Cost control: drop health/metrics logs at shipper, sample 10% INFO, tiered retention (hot 7d, cold S3 90d)',
  ],
  interviewFocus: [
    'What is the difference between Loki and Elasticsearch architecturally?',
    'Why should high-cardinality values like traceId not be Loki stream labels?',
    'How does LogQL differ from SQL for log queries?',
  ],
};

@Component({
  selector: 'app-obs-log-aggregation',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './log-aggregation.html',
  styleUrl: './log-aggregation.scss',
})
export class ObsLogAggregation {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
