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
];

const codeTabs: CodeTab[] = [
  {
    label: 'Prometheus Operator CRDs',
    language: 'typescript',
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
    language: 'typescript',
    code: `# docker-compose.yml — Thanos sidecar + querier setup
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
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
