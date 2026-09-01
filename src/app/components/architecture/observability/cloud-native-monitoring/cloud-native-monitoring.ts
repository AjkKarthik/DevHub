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
  { name: 'ServiceMonitor',    type: 'keyword', desc: 'Prometheus Operator CRD — declaratively configures Prometheus scrape targets from Kubernetes service labels. No prometheus.yml editing.' },
  { name: 'PrometheusRule',    type: 'keyword', desc: 'Prometheus Operator CRD — defines alerting/recording rules as Kubernetes manifests. Applied without restarting Prometheus.' },
  { name: 'PodMonitor',        type: 'keyword', desc: 'Prometheus Operator CRD for scraping individual pods (without a Service). Useful for DaemonSets and StatefulSets.' },
  { name: 'Thanos',            type: 'keyword', desc: 'Long-term Prometheus storage and global querying — aggregates multiple Prometheus instances across regions into one query endpoint.' },
  { name: 'VictoriaMetrics',   type: 'keyword', desc: 'High-performance drop-in Prometheus replacement — better compression, faster queries, lower memory usage, supports remote write.' },
  { name: 'Grafana Mimir',     type: 'keyword', desc: 'Scalable, multi-tenant Prometheus backend by Grafana Labs — horizontally scalable ingest, storage in S3/GCS, compatible with PromQL.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Cloud-Native Monitoring Challenges',
    points: [
      'Dynamic infrastructure: pods start and stop constantly. Static Prometheus scrape configs (listing IP:port per target) break in Kubernetes — you need service discovery.',
      'Ephemeral targets: a pod\'s IP changes on every restart. Pod IPs cannot be hard-coded in prometheus.yml. Kubernetes SD (service discovery) resolves pods by label selector dynamically.',
      'Scale: a large cluster may have thousands of pods each exposing /metrics. A single Prometheus instance may struggle — Prometheus is single-threaded for compaction and queries. Sharding or remote storage is needed beyond ~1M active series.',
      'Multi-cluster visibility: a global overview across 10 regional clusters requires aggregating metrics from 10 Prometheus instances. Thanos or Grafana Mimir provide federated querying.',
    ],
  },
  {
    heading: 'Prometheus Operator',
    points: [
      'The Prometheus Operator introduces Custom Resource Definitions (CRDs) that let you manage Prometheus configuration as Kubernetes objects — declarative, Git-storable, no manual prometheus.yml editing.',
      'ServiceMonitor: declare which Kubernetes Services to scrape, which port, which path, and at what interval. The Operator generates the Prometheus scrape config automatically when pods matching the selector exist.',
      'PrometheusRule: declare alerting and recording rules as Kubernetes manifests. Applied without restarting Prometheus — the Operator hot-reloads rules.',
      'AlertmanagerConfig: configure Alertmanager receivers and routes as Kubernetes objects — Slack webhook, PagerDuty key, routing by label. Managed alongside the services they alert on.',
    ],
  },
  {
    heading: 'Long-Term Storage with Thanos',
    points: [
      'Prometheus default retention: 15 days (configurable but local storage grows linearly). For SLO windows (30 days) and capacity planning (90+ days), you need long-term storage.',
      'Thanos Sidecar: runs alongside each Prometheus, uploading TSDB blocks to object storage (S3, GCS, Azure Blob) every 2 hours. Prometheus continues operating normally.',
      'Thanos Query: a global query endpoint that aggregates results from multiple Prometheus instances and object storage. PromQL works identically — data source just has more history.',
      'Thanos Compactor: merges and downsamples old blocks — raw data for 30 days, 5-minute resolution for 90 days, 1-hour resolution for 1 year. Reduces storage cost 10-50×.',
    ],
  },
  {
    heading: 'Managed Cloud Monitoring',
    points: [
      'AWS: CloudWatch for native AWS service metrics (EC2, RDS, Lambda). Container Insights for EKS. Can federate to Grafana via the CloudWatch data source or use Amazon Managed Prometheus (AMP).',
      'GCP: Cloud Monitoring (formerly Stackdriver) for GKE and GCP services. Managed Service for Prometheus (GMP) provides Prometheus-compatible ingest with global querying without running Thanos.',
      'Azure: Azure Monitor for AKS and Azure services. Managed Prometheus in Azure Monitor — scrapes Kubernetes pods, stores long-term, queries via PromQL.',
      'Trade-offs: managed solutions eliminate operational burden (no Prometheus to patch, no Thanos to operate) but cost more per metric at scale and may have lower data retention or cardinality limits.',
    ],
  },
  {
    heading: 'Monitoring Ephemeral, Dynamically-Scheduled Workloads',
    points: [
      'Traditional monitoring assumed long-lived, individually-named servers — cloud-native environments (Kubernetes pods, serverless functions) are ephemeral, with instances created and destroyed constantly, making static, host-based monitoring configuration fundamentally incompatible with this model.',
      'Service discovery-based monitoring (Prometheus automatically discovering and scraping targets via the Kubernetes API, rather than a manually maintained list of hosts) is essential — new pods must be discovered and monitored automatically as they are scheduled, without any manual configuration step.',
      'Labels and metadata (namespace, pod name, deployment, node) attached to every metric are what make cloud-native monitoring queryable and meaningful despite the underlying instances constantly changing — aggregating and filtering by these labels, not by individual ephemeral instance identity, is the correct mental model.',
      'Cardinality control matters even more in dynamic environments — including a constantly-changing pod name as a metric label can cause unbounded cardinality growth as pods are recreated, requiring careful label design that captures meaningful dimensions without exploding the number of unique time series.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Prometheus Operator CRDs',
    language: 'bash',
    code: `# ServiceMonitor — tells Prometheus to scrape the order-service
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: order-service
  namespace: monitoring
  labels:
    release: prometheus  # must match Prometheus CR's serviceMonitorSelector
spec:
  selector:
    matchLabels:
      app: order-service  # selects Services with this label
  endpoints:
    - port: metrics      # named port from the Service spec
      path: /metrics
      interval: 15s
      scheme: http
  namespaceSelector:
    matchNames:
      - production

---
# PrometheusRule — alerting rules as Kubernetes manifests
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: order-service-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: order-service
      interval: 30s
      rules:
        - alert: OrderServiceHighErrorRate
          expr: |
            sum(rate(http_requests_total{job="order-service",status_code=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="order-service"}[5m])) > 0.01
          for: 2m
          labels:
            severity: critical
            team: platform
          annotations:
            summary: "Order service error rate > 1%"
            runbook: "https://wiki.internal/runbooks/order-service-errors"`,
  },
  {
    label: 'Thanos Setup',
    language: 'bash',
    code: `# docker-compose.yml — Thanos sidecar + querier setup
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      # command: REPLACES the image's default CMD entirely (not appended) --
      # --config.file must be listed explicitly or Prometheus falls back to
      # its own compiled-in default ("prometheus.yml", a relative path), never
      # finding the config mounted above at /etc/prometheus/prometheus.yml.
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=2h    # Thanos handles long-term
      - --storage.tsdb.min-block-duration=2h
      - --storage.tsdb.max-block-duration=2h
      - --web.enable-lifecycle

  thanos-sidecar:
    image: thanosio/thanos:latest
    command:
      - sidecar
      - --tsdb.path=/prometheus
      - --prometheus.url=http://prometheus:9090
      - --grpc-address=0.0.0.0:10901
      - --http-address=0.0.0.0:10902
      - --objstore.config-file=/etc/thanos/s3.yml
    volumes:
      - prometheus-data:/prometheus
      - ./thanos-s3.yml:/etc/thanos/s3.yml

  thanos-query:
    image: thanosio/thanos:latest
    command:
      - query
      - --http-address=0.0.0.0:10904
      - --store=thanos-sidecar:10901   # add more stores for multi-cluster
    ports:
      - "10904:10904"

# thanos-s3.yml
# type: S3
# config:
#   bucket: my-thanos-bucket
#   endpoint: s3.us-east-1.amazonaws.com
#   region: us-east-1`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Statically configuring Prometheus scrape targets in a Kubernetes cluster',
    wrong: `# prometheus.yml with hard-coded pod IPs — breaks on every pod restart
scrape_configs:
  - job_name: 'order-service'
    static_configs:
      - targets: ['10.0.1.45:3000', '10.0.1.46:3000']  # pod IPs change!
# After rolling deploy, new pods have new IPs — Prometheus misses them`,
    right: `# Use Kubernetes service discovery — auto-discovers all matching pods
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: "true"
# Or better: use Prometheus Operator with ServiceMonitor CRDs`,
    explanation: 'Pod IPs in Kubernetes change on every restart, rolling deploy, or node migration. Hard-coding pod IPs in prometheus.yml means Prometheus loses targets after any pod lifecycle event. Use Kubernetes service discovery (SD) to dynamically discover pods by label, or use the Prometheus Operator with ServiceMonitor CRDs for declarative scrape configuration.',
  },
  {
    title: 'Running Prometheus without remote storage and losing SLO history',
    wrong: `# Default 15-day retention
--storage.tsdb.retention.time=15d
# SLO requires 30-day window
# After 15 days, cannot query whether SLO was met last month
# Capacity planning needs 90-day trends — impossible`,
    right: `# Configure remote write to Thanos or Victoria Metrics
remote_write:
  - url: "http://thanos-receive:19291/api/v1/receive"
# Thanos stores indefinitely in S3 at low cost
# Prometheus only needs 2-hour retention locally
--storage.tsdb.retention.time=2h`,
    explanation: 'Prometheus default retention (15 days) is insufficient for 30-day SLO tracking and quarterly capacity planning. Configure `remote_write` to ship all data to a long-term storage backend (Thanos, Victoria Metrics, Grafana Mimir) that stores data in object storage (S3/GCS) indefinitely at low cost. Prometheus then only needs to retain data for 2 hours locally.',
  },
  {
    title: 'Not setting resource requests/limits on Prometheus — it OOM kills under load',
    wrong: `# Prometheus deployed without resource limits
# Under high cardinality load, memory grows unboundedly
# Kubernetes OOM kills Prometheus
# All metrics gaps during the kill + restart window
# Incident happens — no data available for the incident period`,
    right: `resources:
  requests:
    cpu: 500m
    memory: 2Gi
  limits:
    memory: 4Gi  # let it burst but cap it
# Set --storage.tsdb.wal-compression=true to reduce memory
# Monitor prometheus_tsdb_head_series for cardinality growth
# Alert when series count grows > 20% week-over-week`,
    explanation: 'Prometheus is a memory-intensive process — high-cardinality metrics can cause unbounded memory growth. Set memory limits and monitor `prometheus_tsdb_head_series` (total active time series) for unexpected growth. Alert on series count growing rapidly, which indicates a cardinality problem (new high-cardinality labels being added). Enable WAL compression to reduce memory footprint.',
  },
  {
    title: 'Querying Prometheus directly for multi-cluster dashboards',
    wrong: `# Two regional Prometheus instances — cluster-us and cluster-eu
# Grafana has two data sources
# Dashboard queries only one cluster at a time
# Cannot see aggregate error rate across all regions
# Fleet overview is impossible`,
    right: `# Thanos Query aggregates all Prometheus instances
# Single Grafana data source → Thanos Query endpoint
# Fleet-wide queries work transparently:
sum(rate(http_requests_total[5m])) by (cluster, service)
# Returns data from all clusters, deduplicated and merged`,
    explanation: 'Multiple regional Prometheus instances each have partial data — you cannot write a single PromQL query that aggregates across regions. Use Thanos Query (or Grafana Mimir) as a global query frontend that merges results from all Prometheus instances. Configure one Grafana data source pointing to Thanos Query — all PromQL queries then work fleet-wide without per-cluster data sources.',
  },
];

const challenge: Challenge = {
  title: 'Parse a Kubernetes ServiceMonitor selector',
  language: 'typescript',
  description: `Implement matchesSelector(pod: Record<string, string>, selector: Record<string, string>): boolean
Returns true if all selector key-value pairs match the pod's labels (exact match, AND logic).
This is how ServiceMonitor.spec.selector.matchLabels works in Prometheus Operator.`,
  hints: ['Every selector key must exist in pod labels', 'Every selector value must equal the pod label value'],
  starterCode: `function matchesSelector(
  pod: Record<string, string>,
  selector: Record<string, string>
): boolean {
  return false;
}

const pod = { app: 'order-service', env: 'production', version: 'v2' };
console.log(matchesSelector(pod, { app: 'order-service' }));           // true
console.log(matchesSelector(pod, { app: 'order-service', env: 'production' })); // true
console.log(matchesSelector(pod, { app: 'order-service', env: 'staging' }));    // false
console.log(matchesSelector(pod, { tier: 'backend' }));                // false`,
  solution: `function matchesSelector(
  pod: Record<string, string>,
  selector: Record<string, string>
): boolean {
  return Object.entries(selector).every(([key, value]) => pod[key] === value);
}

const pod = { app: 'order-service', env: 'production', version: 'v2' };
console.log(matchesSelector(pod, { app: 'order-service' }));
console.log(matchesSelector(pod, { app: 'order-service', env: 'production' }));
console.log(matchesSelector(pod, { app: 'order-service', env: 'staging' }));
console.log(matchesSelector(pod, { tier: 'backend' }));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What problem does the Prometheus Operator\'s ServiceMonitor CRD solve?',
    options: [
      'It compresses Prometheus data to reduce storage costs automatically',
      'It enables declarative, Kubernetes-native scrape configuration that auto-discovers pods by label selector without editing prometheus.yml',
      'It provides multi-cluster querying by federating multiple Prometheus instances',
      'It adds long-term storage by uploading Prometheus blocks to S3',
    ],
    answer: 1,
    explanation: 'Without ServiceMonitor, you must manually edit prometheus.yml every time a new service is deployed or an IP changes. ServiceMonitor is a Kubernetes CRD — you declare which service label to scrape and the Prometheus Operator generates the correct prometheus.yml automatically, using Kubernetes pod discovery. New pods matching the selector are automatically scraped; deleted pods are removed. No manual configuration changes needed.',
  },
  {
    q: 'What does Thanos Compactor do with old metric blocks?',
    options: [
      'It deletes metrics older than 30 days to comply with GDPR data retention policies',
      'It merges overlapping blocks from multiple Prometheus instances and downsamples old data to reduce storage costs',
      'It re-indexes metric labels to improve query performance for historical data',
      'It encrypts old metric blocks before uploading them to object storage',
    ],
    answer: 1,
    explanation: 'Thanos Compactor merges blocks and downsamples historical data: raw 15-second samples for 30 days, 5-minute resolution for 90 days, 1-hour resolution for 1+ years. This reduces storage cost dramatically — a year of hourly resolution data is ~50× smaller than raw data. PromQL still works on downsampled data (using `_5m` and `_1h` suffix variants of metrics), with the accuracy tradeoff of lower time resolution for old data.',
  },
  { q: 'What fundamentally distinguishes cloud-native monitoring from traditional server monitoring?', options: ['Cloud-native monitoring only applies to AWS, Azure, and GCP services', 'In cloud-native environments workloads are ephemeral and dynamic — containers and pods come and go, making static IP or hostname-based monitoring obsolete; monitoring must use service discovery and label-based targeting', 'Cloud-native monitoring replaces metrics with distributed traces as the primary signal', 'Traditional monitoring is deprecated for cloud-native environments; only APM tools should be used'], answer: 1, explanation: 'Traditional monitoring: you know which servers exist and configure monitoring per host. Hosts have stable IP addresses and hostnames. In cloud-native (Kubernetes): pods are ephemeral (they restart, reschedule, scale). IP addresses change constantly. Services are discovered dynamically. Cloud-native monitoring must: use service discovery (Kubernetes API, DNS, Consul) to find targets automatically. Target labels (app, namespace, team) not hostnames. Handle high cardinality from pod labels. Monitor the cluster and platform alongside the applications. The monitoring system must be as dynamic as the workloads it observes.' },
  { q: 'What is the difference between the pull model and push model for metrics collection?', options: ['Pull collects data from databases; push collects data from APIs', 'In the pull model the monitoring system scrapes targets on a schedule (Prometheus); in the push model targets send metrics to a collector (StatsD, CloudWatch); pull provides better control and discovery while push suits short-lived jobs', 'Push is deprecated; all modern monitoring systems use pull exclusively', 'Pull models are for infrastructure metrics; push models are for application metrics'], answer: 1, explanation: 'Pull model (Prometheus): the monitoring server scrapes HTTP /metrics endpoints at regular intervals (15s by default). Benefits: monitoring server controls the scrape rate. Easy service discovery (if the target exists, it is scraped). Health checking built in (if scrape fails, the target is down). Push model (StatsD, CloudWatch, InfluxDB with Telegraf): the application sends metrics to a centralized collector. Benefits: works for short-lived jobs that finish before the next scrape. Works across firewalls (outbound connections). Cloud providers favor push (CloudWatch). Hybrid: Prometheus Pushgateway bridges push model for batch jobs in a pull-model environment.' },
  { q: 'How does Prometheus service discovery work in Kubernetes?', options: ['Prometheus requires manual configuration of all pod IP addresses in prometheus.yaml', 'Kubernetes service discovery in Prometheus uses the Kubernetes API to automatically discover pods, services, and nodes with configurable relabeling to filter and label targets', 'Prometheus discovers Kubernetes pods through DNS SRV records only', 'Kubernetes service discovery requires deploying a separate service discovery agent alongside Prometheus'], answer: 1, explanation: 'Prometheus Kubernetes service discovery: Prometheus connects to the Kubernetes API server. Discovers all pods, services, endpoints, nodes, and namespaces. Relabeling rules transform Kubernetes metadata into Prometheus labels. Common pattern: scrape all pods with annotation prometheus.io/scrape: true. Set the scrape port from annotation prometheus.io/port. Set the path from prometheus.io/path. Benefits: adding a new service automatically gets scraped without Prometheus configuration changes. Labels from Kubernetes (namespace, pod name, labels) become Prometheus labels for filtering. Kube-state-metrics and node-exporter complement Prometheus with cluster and node metrics.' },
  { q: 'What is multi-cluster observability and what are the main approaches to implementing it?', options: ['Multi-cluster observability means running a separate monitoring stack per cluster with no aggregation', 'Observability across multiple Kubernetes clusters achieved by federating metrics into a central store, using Thanos or Cortex for long-term multi-cluster storage, or using cloud-managed observability platforms', 'Multi-cluster observability requires running a single shared Prometheus across all clusters', 'Only commercial APM tools support multi-cluster observability; open-source tools cannot span multiple clusters'], answer: 1, explanation: 'Multi-cluster approaches: Prometheus Federation: a global Prometheus scrapes aggregated metrics from per-cluster Prometheus instances. Simple but not scalable for large environments. Thanos: sidecar containers stream Prometheus data to object storage (S3, GCS). A global query layer aggregates across clusters. Provides long-term retention and global queries. Cortex/Mimir: horizontally scalable Prometheus-compatible storage. Each cluster Prometheus remote-writes to the central store. Global dashboards and alerts in one place. Cloud-managed: AWS CloudWatch Container Insights, Google Cloud Monitoring, Azure Monitor all aggregate multi-cluster metrics natively. VictoriaMetrics: another horizontally scalable remote-write-compatible solution.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should I use Thanos, Victoria Metrics, or Grafana Mimir for long-term storage?',
    a: 'All three solve the same core problem (long-term Prometheus storage beyond 15 days) and are production-proven. Choosing: <ul><li><strong>Thanos</strong>: most widely adopted, great multi-cluster federation, large community. Best if you already run Prometheus Operator and want incremental adoption (add Thanos Sidecar without changing Prometheus). Slightly more complex to operate than VM.</li><li><strong>Victoria Metrics</strong>: drop-in Prometheus replacement — lower memory, better compression, faster ingest. Single binary deployment. Best if you want simplicity and can swap the Prometheus binary for VictoriaMetrics. Also has cluster mode (VMCluster) for HA.</li><li><strong>Grafana Mimir</strong>: best horizontal scalability (splits ingest, compaction, storage, query into separate components). Best for very large deployments (100M+ series). Most complex to operate; Grafana Cloud uses it under the hood.</li></ul>For most teams: start with Thanos (most documentation and examples). Switch to VictoriaMetrics for operational simplicity at moderate scale.',
  },
  {
    q: 'When should I use managed cloud monitoring (AWS AMP, GCP Managed Prometheus) vs self-hosted?',
    a: '<strong>Use managed monitoring when</strong>: <ul><li>Your team lacks Kubernetes operators familiar with running Prometheus/Thanos reliably</li><li>You want to eliminate operational overhead — no Prometheus upgrades, no Thanos to patch</li><li>Your metric volume is moderate (< 50M active series) — managed solutions become expensive at high scale</li><li>You are already deep in one cloud provider and want native integration (IAM, VPC, billing)</li></ul><strong>Self-host when</strong>: <ul><li>Your metric volume is high (> 50M series) — self-hosted VictoriaMetrics or Thanos is significantly cheaper</li><li>You need full control over data retention, query performance, and cardinality limits</li><li>You have multi-cloud or on-premises infrastructure that managed solutions cannot reach</li><li>You have the operational expertise to run the stack reliably</li></ul>Hybrid: use managed metrics for cloud-native services and self-hosted Prometheus for on-premises/multi-cloud. Grafana can query both simultaneously.',
  },
  { q: 'What are the unique challenges of monitoring ephemeral container workloads?', a: 'Challenge 1 - Identity: containers are ephemeral. A crashing container disappears from monitoring before its failure is recorded. Solution: use Kubernetes labels (not pod names) as the identity. The deployment label persists even when pods restart. Challenge 2 - Cardinality: each pod has a unique pod name, contributing to high label cardinality. Solution: drop the pod name label for aggregate metrics; keep it only for traces and logs. Challenge 3 - Short-lived jobs: a batch job that completes in 10 seconds is never scraped by a 15-second interval Prometheus. Solution: Pushgateway for batch jobs. Challenge 4 - Container resource metrics: container CPU and memory limits affect scheduling and throttling. Node-level metrics are separate from container-level metrics. Solution: use kube-state-metrics for cluster state and cAdvisor for container resource usage.' },
  { q: 'How do you monitor serverless functions effectively?', a: 'AWS Lambda monitoring: built-in CloudWatch Metrics: invocations, errors, duration, throttles, concurrent executions, cold starts. CloudWatch Logs: all function output. Lambda Insights: enhanced metrics with memory usage and initialization time. Custom metrics: use the embedded metrics format (EMF) to emit custom metrics to CloudWatch from within the function code without extra API calls. Azure Functions: Application Insights provides automatic instrumentation, distributed tracing, and custom metrics. Google Cloud Functions: Cloud Monitoring and Cloud Trace. Key metrics to monitor: cold start frequency and duration (affects user latency). Timeout rate (function exceeding max duration). Memory utilization vs memory limit (right-sizing). Error rate by error type. Concurrency and throttle events (hitting account limits). Distributed tracing is especially important for serverless to track the full request path across multiple functions.' },
  { q: 'What is the kube-state-metrics exporter and what Kubernetes state does it expose?', a: 'kube-state-metrics: a Prometheus exporter that generates metrics from the Kubernetes API server about the state of Kubernetes objects. Complement to cAdvisor and node-exporter (which report resource usage). Metrics exposed: Deployment: desired vs available replicas, update strategy, observed generation. Pod: phase (Running, Pending, Failed, Succeeded), container states, restart count, resource requests and limits. Node: conditions (Ready, DiskPressure, MemoryPressure), schedulable status. StatefulSet: replicas, current replicas, ready replicas. PersistentVolumeClaim: phase (Bound, Pending, Lost). HorizontalPodAutoscaler: current vs desired replicas, min/max bounds. Job and CronJob: completion status, active jobs. Why it matters: these state metrics expose issues that resource metrics cannot — a deployment stuck at 0 ready replicas is critical regardless of CPU usage.' },
  { q: 'How do you implement observability for service-to-service communication in a microservices architecture?', a: 'Service mesh observability: Istio and Linkerd inject a sidecar proxy into every pod. The proxy automatically captures all inter-service HTTP/gRPC traffic. Provides: request rate, latency histograms, and error rates for every service-to-service call without application code changes. mTLS status. Circuit breaker state. Retry and timeout metrics. This gives the RED (Rate, Errors, Duration) metrics for every service call automatically. Application-level tracing: inject trace context (W3C TraceContext headers) into inter-service calls. Each service creates spans for its processing. The full trace shows the entire call chain. Combining both: service mesh gives aggregate metrics per service pair. Distributed tracing gives per-request latency breakdown for debugging. Together they provide complete visibility into inter-service communication.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Cloud-native monitoring = Prometheus Operator CRDs for K8s discovery, Thanos/Mimir for long-term storage and multi-cluster querying, managed options for operational simplicity.',
  mustKnow: [
    'Static scrape configs break in Kubernetes — use K8s SD or Prometheus Operator ServiceMonitor CRDs',
    'ServiceMonitor: label-selector-based scrape config as Kubernetes manifest. PrometheusRule: alert rules as CRDs.',
    'Thanos: Sidecar ships blocks to S3, Query federates multi-cluster, Compactor downsamples for cost reduction',
    'Prometheus needs remote_write to long-term storage for 30-day SLO windows and quarterly capacity planning',
    'Victoria Metrics: drop-in replacement, lower memory/better compression, simpler than Thanos for single-cluster',
    'Grafana Mimir: horizontally scalable for 100M+ series; Grafana Cloud uses it for managed Prometheus',
  ],
  interviewFocus: [
    'Why do static Prometheus scrape configs not work in Kubernetes?',
    'What components make up a Thanos deployment and what does each do?',
    'When would you choose managed cloud monitoring over self-hosted Prometheus?',
  ],
};

@Component({
  selector: 'app-obs-cloud-native',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cloud-native-monitoring.html',
  styleUrl: './cloud-native-monitoring.scss',
})
export class ObsCloudNativeMonitoring {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
