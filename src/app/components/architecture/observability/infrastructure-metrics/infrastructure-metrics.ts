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
  { name: 'node_exporter',    type: 'keyword', desc: 'Prometheus exporter for Linux host metrics — CPU, memory, disk I/O, network. Runs as a sidecar or DaemonSet in Kubernetes.' },
  { name: 'kube-state-metrics', type: 'keyword', desc: 'Exposes Kubernetes object state as metrics — pod status, deployment replicas, node conditions, resource requests/limits.' },
  { name: 'cAdvisor',         type: 'keyword', desc: 'Container resource usage metrics — CPU throttling, memory limits, network per-container. Built into kubelet in Kubernetes.' },
  { name: 'USE method',       type: 'keyword', desc: 'Utilisation (% busy), Saturation (excess work queued), Errors — framework for analysing every resource systematically.' },
  { name: 'CPU steal',        type: 'keyword', desc: 'Time the hypervisor took CPU from your VM for another tenant. High steal means your host is oversubscribed — cloud provider issue.' },
  { name: 'OOM kill',         type: 'keyword', desc: 'Out-of-Memory kill — kernel kills a process when memory pressure is critical. kube_pod_container_status_last_terminated_reason tracks this.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The USE Method for Infrastructure',
    points: [
      'USE (Utilisation, Saturation, Errors) by Brendan Gregg is a framework for systematically checking every resource. For each resource (CPU, memory, disk, network, queues), ask three questions.',
      'Utilisation: the average time the resource was busy, as a percentage. CPU at 80% utilisation means the CPU was busy 80% of the time. High utilisation alone is not a problem — it only matters if it causes saturation.',
      'Saturation: whether the resource has excess work it cannot process — requests queuing, threads blocking. CPU saturation shows as load average > CPU count, or I/O wait. Memory saturation shows as swap usage or OOM kills.',
      'Errors: error events — disk write errors, network packet drops, NIC errors. Even at low utilisation, errors indicate failing hardware or misconfiguration.',
    ],
  },
  {
    heading: 'Host Metrics: node_exporter',
    points: [
      'CPU: `node_cpu_seconds_total{mode="idle"}` — 100% minus idle gives utilisation. `rate(node_cpu_seconds_total{mode="iowait"}[5m])` shows I/O bottleneck.',
      'Memory: `node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes` — available fraction. `node_vmstat_pgmajfault` — major page faults indicate memory pressure and swap use.',
      'Disk: `rate(node_disk_io_time_seconds_total[5m])` — disk utilisation (0-1). `node_filesystem_avail_bytes / node_filesystem_size_bytes` — free disk fraction. Alert when < 10% free.',
      'Network: `rate(node_network_receive_errs_total[5m])` — receive errors. `rate(node_network_transmit_packets_dropped_total[5m])` — packet drops indicating saturation.',
    ],
  },
  {
    heading: 'Kubernetes Metrics',
    points: [
      'Pod health: `kube_pod_status_phase{phase="Running"}` — count of running pods. `kube_pod_container_status_restarts_total` — restart count; high restarts = crash loop.',
      'Resource limits: `rate(container_cpu_usage_seconds_total[5m]) / kube_pod_container_resource_limits{resource="cpu"}` — CPU usage-to-limit ratio (not throttling — see the CPU throttling ratio query below for that). If sustained near 1.0 the container is consistently using its full CPU allocation. The rate() wrapper is required: `container_cpu_usage_seconds_total` is a raw cumulative counter, so dividing it by the limit directly produces a value that grows without bound the longer the container has been running, regardless of actual load.',
      'Deployment health: `kube_deployment_status_replicas_available / kube_deployment_spec_replicas` — availability ratio. < 1 means degraded deployment.',
      'OOM kills: `kube_pod_container_status_last_terminated_reason == "OOMKilled"` — containers killed for exceeding memory limits. Increase resource limits or fix memory leak.',
    ],
  },
  {
    heading: 'Database and Queue Metrics',
    points: [
      'PostgreSQL: `pg_stat_activity_count` (connections), `pg_stat_bgwriter_buffers_alloc` (buffer allocations), `pg_locks_count` (blocking locks). Connection pool saturation is a common bottleneck.',
      'Redis: `redis_memory_used_bytes / redis_memory_max_bytes` (memory pressure), `redis_keyspace_misses_total / redis_keyspace_hits_total` (miss rate), `redis_connected_clients` (connection count).',
      'RabbitMQ/Kafka: queue depth and consumer lag are the key saturation metrics. `rabbitmq_queue_messages` for depth, `kafka_consumer_lag` for how far behind consumers are.',
      'Set alerts on connection pool saturation (> 80% used) and queue depth (> N messages) before they cause latency spikes. These are leading indicators — they precede user-visible impact by minutes.',
    ],
  },
  {
    heading: 'Beyond CPU and Memory: Metrics That Actually Predict Problems',
    points: [
      'CPU and memory utilization alone rarely predict user-facing problems directly — a server at 90% CPU utilization that is still meeting its latency SLOs is not actually a problem, while a server at 40% CPU with saturated disk I/O or network bandwidth might be failing users badly.',
      'Disk I/O wait time and queue depth are frequently overlooked but critical infrastructure metrics — a database server experiencing high I/O wait is effectively CPU-idle while waiting on slow storage, a pattern that plain CPU utilization graphs completely hide.',
      'Network-level metrics (connection counts, retransmission rates, bandwidth saturation) become increasingly important in distributed, microservice-heavy architectures, where a growing share of total request latency is spent in network round trips between services rather than in any single service\'s own computation.',
      'Container and orchestrator-level metrics (pod restarts, OOMKilled events, resource request/limit ratios in Kubernetes) reveal a distinct category of infrastructure problems specific to containerized environments that traditional host-level metrics were never designed to surface.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Key PromQL Queries',
    language: 'bash',
    code: `# ── HOST METRICS (node_exporter) ─────────────────────────────────

# CPU utilisation (all cores, average)
1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)

# Memory available fraction
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

# Disk write utilisation
rate(node_disk_io_time_seconds_total[5m])

# Disk space free fraction (alert when < 0.1)
node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"}

# Network errors per second
sum(rate(node_network_receive_errs_total[5m])) by (instance, device)

# ── KUBERNETES METRICS ────────────────────────────────────────────

# Container CPU throttling ratio (> 0.25 = consistently throttled)
sum(rate(container_cpu_throttled_seconds_total[5m])) by (pod)
/
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)

# Pod restart rate (crash loop indicator)
rate(kube_pod_container_status_restarts_total[15m]) > 0

# Deployment availability ratio
kube_deployment_status_replicas_available / kube_deployment_spec_replicas

# Memory usage vs limit
container_memory_working_set_bytes
/
kube_pod_container_resource_limits{resource="memory"}

# ── DATABASE METRICS ──────────────────────────────────────────────

# Postgres connection pool utilisation
pg_stat_activity_count / pg_settings_max_connections

# Redis memory pressure (alert when > 0.85)
redis_memory_used_bytes / redis_memory_max_bytes

# Kafka consumer lag per topic-partition
kafka_consumer_group_lag{topic="orders", group="order-processor"}`,
  },
  {
    label: 'Alert Rules',
    language: 'bash',
    code: `groups:
  - name: infrastructure
    rules:
      # ── HOST ──────────────────────────────────────────────────────
      - alert: HighCPUUtilisation
        expr: |
          1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance) > 0.9
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "CPU > 90% for 5 minutes on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: |
          node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes < 0.1
        for: 1m
        labels: { severity: critical }
        annotations:
          summary: "Disk < 10% free on {{ $labels.instance }}:{{ $labels.mountpoint }}"

      # ── KUBERNETES ────────────────────────────────────────────────
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash-looping"

      - alert: ContainerOOMKilled
        expr: |
          kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1
        labels: { severity: warning }
        annotations:
          summary: "{{ $labels.container }} in {{ $labels.pod }} was OOM killed"

      - alert: CPUThrottlingHigh
        expr: |
          sum(rate(container_cpu_throttled_seconds_total[5m])) by (pod)
          / sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) > 0.5
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "{{ $labels.pod }} CPU throttled > 50% — increase CPU limit"`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Alerting on CPU > 80% without saturation check',
    wrong: `# Fires on every transient CPU burst — alert fatigue
- alert: HighCPU
  expr: cpu_usage > 0.8
  # Batch job runs → CPU hits 85% for 30s → alert fires
  # Not a real problem — batch job completes normally`,
    right: `# Alert when CPU is sustained AND saturation is present
- alert: CPUSaturation
  expr: |
    (1 - avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m]))) > 0.9
    AND on(instance)
    node_load1 > count by(instance)(node_cpu_seconds_total{mode="idle"})
  for: 5m
  # CPU > 90% AND load average > CPU count = real saturation`,
    explanation: 'CPU utilisation alone is not a good alert condition — periodic batch jobs legitimately spike CPU without causing problems. Alert on sustained CPU saturation: utilisation > 90% for 5+ minutes AND load average exceeding CPU count (meaning work is queuing). The `for: 5m` clause suppresses transient bursts.',
  },
  {
    title: 'Not monitoring container resource limits — hitting limits silently',
    wrong: `// Containers running with no resource limits
// Or limits set once and never reviewed
// CPU throttling occurs silently — adds latency but no error
// Memory limits too low — OOM kills, no alert fires
// Discovered when users report slowness`,
    right: `// Monitor throttling and OOM kills actively
container_cpu_throttled_seconds_total  // → alert when throttle ratio > 50%
kube_pod_container_status_restarts_total // → alert on crash loop
kube_pod_container_status_last_terminated_reason == "OOMKilled"

// Also track headroom:
// container_memory_working_set_bytes / memory_limit_bytes
// → alert when > 80% → increase limit before OOM`,
    explanation: 'Kubernetes containers hitting CPU limits are throttled silently — requests take longer but no errors appear. Containers hitting memory limits are OOM killed, which may cause the pod to restart. Neither fires a HTTP error alert. Explicitly monitor CPU throttling ratio and OOM kill events, and track memory headroom (current usage vs limit) to get ahead of these issues.',
  },
  {
    title: 'Using node_exporter metrics to monitor containers instead of cAdvisor',
    wrong: `# node_exporter shows host-level metrics — aggregates ALL containers
# Cannot tell which container is using 80% of CPU
rate(node_cpu_seconds_total{mode!="idle"}[5m])
# Is it your app? A sidecar? The OS? Unknown.`,
    right: `# cAdvisor (built into kubelet) shows per-container metrics
rate(container_cpu_usage_seconds_total{container!="POD"}[5m])
# Filters by container name, pod, namespace
# Can identify exactly which container is consuming resources`,
    explanation: 'node_exporter exposes host-level metrics aggregated across all containers and the OS. In a Kubernetes environment, use cAdvisor metrics (`container_*`) for per-container resource usage — they are scraped from the kubelet and provide namespace/pod/container label dimensions. node_exporter is still useful for host saturation (network errors, disk I/O) that cAdvisor doesn\'t expose.',
  },
  {
    title: 'Not monitoring database connection pool — a common saturation point',
    wrong: `// Database has max_connections = 100
// Application uses connection pooling with pool size 20
// Under load: all 20 connections occupied, requests queue
// Response time increases gradually — no alert fires until timeouts
// Discovered when users report slow page loads`,
    right: `const poolGauge = new Gauge({
  name: 'db_pool_connections',
  help: 'Database connection pool utilisation',
  labelNames: ['state'], // active|idle|waiting
  collect() {
    this.labels('active').set(pool.totalCount - pool.idleCount);
    this.labels('idle').set(pool.idleCount);
    this.labels('waiting').set(pool.waitingCount);
  },
});
// Alert when waiting > 0 for sustained period — pre-cursor to timeouts`,
    explanation: 'Database connection pool saturation is one of the most common causes of gradual latency degradation. When all connections are in use, new requests queue. Queue depth growing is a leading indicator that fires minutes before query timeouts start. Expose pool state (active/idle/waiting connections) as a gauge and alert when waiting count is non-zero for more than 30 seconds.',
  },
];

const challenge: Challenge = {
  title: 'Compute USE scores for a resource',
  language: 'typescript',
  description: `Implement useScore(utilisation: number, saturation: number, errors: number): { score: number; status: string }
- utilisation: 0-1 (fraction of resource capacity in use)
- saturation: number of queued/waiting items (0 = no queuing)
- errors: error count in last interval

Score = utilisation*0.5 + min(saturation/10, 1)*0.3 + min(errors/5, 1)*0.2
status: score < 0.5 = 'healthy', < 0.75 = 'degraded', >= 0.75 = 'critical'`,
  hints: ['Normalise saturation and errors to 0-1 range using min(x/max, 1)', 'Weighted sum for score'],
  starterCode: `function useScore(
  utilisation: number,
  saturation: number,
  errors: number
): { score: number; status: string } {
  return { score: 0, status: 'unknown' };
}

console.log(useScore(0.3, 0, 0));    // healthy
console.log(useScore(0.8, 5, 0));    // degraded
console.log(useScore(0.95, 15, 3));  // critical`,
  solution: `function useScore(
  utilisation: number,
  saturation: number,
  errors: number
): { score: number; status: string } {
  const score =
    utilisation * 0.5 +
    Math.min(saturation / 10, 1) * 0.3 +
    Math.min(errors / 5, 1) * 0.2;

  const status = score >= 0.75 ? 'critical' : score >= 0.5 ? 'degraded' : 'healthy';
  return { score: Math.round(score * 100) / 100, status };
}

console.log(useScore(0.3, 0, 0));
console.log(useScore(0.8, 5, 0));
console.log(useScore(0.95, 15, 3));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A Node.js container shows CPU utilisation at 60% but p99 latency is 2 seconds (SLO is 200ms). What metric should you check next?',
    options: [
      'node_memory_MemAvailable_bytes — memory pressure causes CPU slowdown',
      'container_cpu_throttled_seconds_total — the container may be hitting its CPU limit and being throttled',
      'node_network_receive_errs_total — high network errors are causing packet retransmission',
      'kube_pod_container_status_restarts_total — the pod is crash-looping and requests are being lost',
    ],
    answer: 1,
    explanation: 'A container can have 60% CPU utilisation from cAdvisor perspective (relative to the host) while being heavily throttled if its CPU LIMIT is set lower than actual usage. The container sees 60% host CPU but Kubernetes is restricting it to (say) 0.5 CPU cores. Check `container_cpu_throttled_seconds_total / container_cpu_usage_seconds_total` — a throttling ratio above 50% directly causes high latency as requests queue waiting for CPU time.',
  },
  {
    q: 'What does the USE method\'s "Saturation" component measure for a CPU resource?',
    options: [
      'The percentage of CPU capacity currently in use (utilisation)',
      'Excess work that cannot be serviced — work queuing, visible as load average exceeding CPU count or run queue length',
      'The number of CPU-related error events in the last interval',
      'The CPU idle percentage — lower is worse',
    ],
    answer: 1,
    explanation: 'Saturation measures whether a resource has more work than it can handle. For CPU, saturation shows as load average exceeding the CPU core count (processes waiting in the run queue) or I/O wait (processes blocked on disk, waiting for CPU to process I/O completions). A CPU at 80% utilisation with no queue is fine; the same CPU with load average 4× core count is saturated and causing latency.',
  },
  { q: 'What is CPU steal time and why does it matter for cloud virtual machines?', options: ['CPU steal time is processor time wasted on cache miss operations', 'CPU steal time is the percentage of time the virtual CPU waits while the hypervisor serves another VM; high steal indicates CPU resource contention on the physical host, causing performance degradation that appears as high CPU without high application load', 'CPU steal time measures the overhead of context switching between processes', 'CPU steal time is the processor time consumed by kernel interrupts and system calls'], answer: 1, explanation: 'CPU steal time (st in top output): time that the CPU is ready to run but cannot because the hypervisor is running another VM on the same physical core. In cloud environments: a noisy neighbor VM on the same physical host can steal CPU cycles from your VM. Your application appears CPU-bottlenecked even though application-level CPU usage is low. High steal time (above 5-10%): indicates the physical host is oversubscribed. Solutions: move to a dedicated host (AWS Dedicated Hosts). Upgrade to a larger instance type. Change the instance type (some types have better CPU isolation). Monitor steal time in node-exporter as node_cpu_seconds_total with mode=steal.' },
  { q: 'What is the difference between CPU utilization and CPU saturation?', options: ['Utilization measures processor frequency; saturation measures processor temperature', 'CPU utilization is the percentage of time CPUs are busy (not idle); CPU saturation is the degree to which demand exceeds capacity, measured by load average and run queue length', 'Saturation is a Kubernetes metric; utilization is a bare-metal metric', 'Both metrics are identical; the choice of term depends on the monitoring tool vendor'], answer: 1, explanation: 'CPU utilization (USE framework — Brendan Gregg): the percentage of time all CPUs are busy executing processes. 100% means all CPUs are running all the time. A necessary but not sufficient indicator of problems. CPU saturation: the amount of extra work queued because the CPUs cannot keep up. Measured by: load average (processes in run state or waiting for CPU). Run queue length (processes waiting for CPU time). Scheduler latency. Why both matter: 50% CPU utilization with zero queue = healthy (bursts can be absorbed). 50% CPU utilization with growing queue = saturated (requests are waiting). High utilization alone does not cause problems if there is no queue. Saturation means processes are actually waiting.' },
  { q: 'What infrastructure metrics should you monitor for a production database server?', options: ['Only CPU and memory usage; database performance is fully captured by query metrics', 'CPU utilization and steal time, memory usage and swap, disk IOPS and throughput, disk read/write latency, disk fill rate, network throughput, connection count, and replication lag', 'Only disk usage and connection count; CPU is irrelevant for read-heavy databases', 'Infrastructure metrics are not useful for databases; only application-level query metrics matter'], answer: 1, explanation: 'Database infrastructure metrics: CPU: high CPU for a query-heavy database is expected. Watch steal time and saturation (run queue). Memory: buffer pool usage (MySQL InnoDB buffer pool, PostgreSQL shared_buffers). If the buffer pool is fully utilized, more disk I/O occurs. Swap usage indicates memory pressure. Disk: IOPS (read vs write). Throughput (MB/s read and write). Latency (await in iostat). Critical: disk latency above 1ms for databases causes significant query slowdown. Disk fill rate: project when the disk will fill and alert before it happens. Network: replication traffic consumes bandwidth. Monitor network saturation on replication servers. Connection count: approaching max_connections causes new connections to fail. Replication lag: critical for read replicas and high-availability setups.' },
  { q: 'What is the node-exporter and what categories of infrastructure metrics does it expose?', options: ['Node-exporter is a Kubernetes-specific exporter that only runs on master nodes', 'Node-exporter is a Prometheus exporter that runs on every Linux host and exposes hardware and OS metrics: CPU, memory, disk, network, filesystem, system load, and kernel statistics', 'Node-exporter replaces the need for cloud provider metrics APIs for infrastructure monitoring', 'Node-exporter only monitors physical bare-metal servers; container metrics require a separate exporter'], answer: 1, explanation: 'Prometheus node-exporter: deployed as a DaemonSet in Kubernetes or as a system service on bare metal. Key metric categories: CPU: per-mode utilization (user, system, idle, iowait, steal, nice). Memory: available, used, buffers, cached, swap. Disk: read/write IOPS, throughput, await (latency), utilization, disk fill rate. Network: bytes sent/received, packets sent/received, errors, drops, per-interface. Filesystem: size, used, available, inode utilization per mount. System: load average, uptime, file descriptors. Network sockets: TCP states, UDP stats. Specific hardware: CPU temperature (sensors), NUMA statistics, NFS stats, XFS and ext4 stats. Usage: combine with kube-state-metrics for complete Kubernetes node monitoring.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between node_exporter and cAdvisor metrics in a Kubernetes cluster?',
    a: '<strong>node_exporter</strong> runs on each host and exposes operating system-level metrics: CPU time per mode (idle, iowait, user, system), total memory, disk I/O, network interface stats, filesystem usage. Labels typically include `instance` (the host). It aggregates across all containers and the OS — you cannot tell which container is responsible.<br><br><strong>cAdvisor</strong> is built into the Kubernetes kubelet and exposes per-container resource metrics: `container_cpu_usage_seconds_total`, `container_memory_working_set_bytes`, `container_network_receive_bytes_total`. Labels include `namespace`, `pod`, `container`. Scraped via the kubelet metrics endpoint.<br><br>Use both together: node_exporter for host-level saturation (network errors, disk I/O patterns, total available memory), cAdvisor for per-container attribution (which pod is consuming CPU, which container is OOM-killing).',
  },
  {
    q: 'How do I monitor a PostgreSQL database with Prometheus?',
    a: 'Use the <strong>postgres_exporter</strong> (prometheus-community/postgres_exporter). It connects to PostgreSQL and exposes metrics from system views. Key metrics to monitor: <ul><li><code>pg_stat_activity_count by (state)</code> — connections by state (active/idle/idle in transaction)</li><li><code>pg_stat_activity_count{state="idle in transaction"}</code> — long-held transactions blocking others</li><li><code>pg_locks_count by (mode)</code> — lock contention</li><li><code>pg_stat_bgwriter_buffers_backend / pg_stat_bgwriter_buffers_alloc</code> — dirty page flush rate (I/O pressure)</li><li><code>pg_replication_lag</code> — replica lag in seconds</li></ul>Alerts: page when replica lag > 30s, when idle-in-transaction connections > 10, when max_connections > 80% used. The connection pool saturation alert is often the most impactful — application connection pool exhaustion cascades quickly into request timeouts.',
  },
  { q: 'How do you set up meaningful capacity alerts for infrastructure resources?', a: 'Capacity alerting principles: disk space: alert when disk is 80% full with a projection of when it will fill based on the current growth rate. A disk filling gradually over 2 weeks is less urgent than one filling in 2 hours. Alert on fill rate exceeding a threshold. Memory: alert when available memory drops below a threshold that allows the OS page cache to function. Swap usage above 0 is a warning sign. CPU: alert on sustained CPU saturation (load average above core count for more than 10 minutes). Not on momentary spikes. Network: alert when network throughput approaches interface capacity. Network saturation is often missed until the interface drops packets. Time-to-exhaustion: the most useful capacity alert is: at the current growth rate, resource X will be exhausted in Y hours or days. Provides actionable lead time for remediation. Avoid: alerting when CPU exceeds 90% without a duration component (workloads legitimately spike to 100%).' },
  { q: 'What are the key metrics for monitoring Linux memory health?', a: 'Linux memory metrics: MemAvailable: the most important metric. Amount of memory available for starting new applications without swapping. Not the same as MemFree. Alert when MemAvailable drops below 10% of total RAM. MemFree: completely unused memory. Low MemFree is normal (the kernel uses free memory for disk caching). Do not alert on MemFree alone. Cached and Buffers: memory used by the kernel for disk caching (reclaimed when applications need it). SwapUsed: any swap usage indicates memory pressure. Applications are slower when using swap. Alert when swap usage appears and investigate. OOM kills: track oom_kill_total (node-exporter) to detect when the kernel is killing processes due to memory pressure. Hugepages: databases and JVMs use transparent hugepages for performance. Monitor hugepage allocation if the application requires them. PageMajFaults: major page faults indicate memory pressure causing disk I/O for page retrieval.' },
  { q: 'How do you monitor disk I/O performance and identify bottlenecks?', a: 'Disk I/O key metrics: await (I/O latency): average time per I/O operation in milliseconds. The most important disk metric. Under 1ms: NVMe SSD excellent. Under 10ms: SATA SSD good. Under 20ms: spinning disk acceptable. Above 20ms: indicates disk saturation or failing drive. %util (disk utilization): percentage of time the disk is busy. For SSDs, high utilization does not necessarily mean saturation. For spinning disks, above 80% utilization causes queue buildup. iops (read and write separately): compare to the disk IOPS limit (NVMe SSDs: hundreds of thousands, SATA SSDs: tens of thousands, spinning disks: 200-400). Throughput (kB/s read and write): compare to disk throughput limits. Queue depth (avgqu-sz): number of outstanding I/O operations. Growing queue depth indicates disk saturation. Tools: iostat -xz 1. node-exporter metrics: node_disk_io_time_seconds_total, node_disk_read_time_seconds_total, node_disk_writes_completed_total.' },
  { q: 'What is the difference between network packets and network bytes for monitoring?', a: 'Network packets vs bytes: bytes per second: measures the bandwidth consumed. Important for: bandwidth capacity (approaching interface limits of 1 Gbps, 10 Gbps). Identifying large file transfers or backup jobs consuming bandwidth. Packets per second (PPS): measures the processing rate. Each packet requires CPU processing (interrupt handling, network stack processing). High PPS with low bytes = many small packets (chatty applications, DNS, NTP). Low PPS with high bytes = large transfers (backups, video streaming). Monitoring both: a DDoS attack often appears as extremely high PPS with small packet sizes (reflection attacks). Normal traffic has a certain bytes-per-packet ratio. Unusual PPS/bytes ratios indicate anomalies. Errors and drops: interface errors and RX/TX drops are hardware problems or buffer exhaustion. Any packet drops on a production interface are a problem to investigate. Node-exporter metrics: node_network_receive_bytes_total, node_network_transmit_bytes_total, node_network_receive_drop_total.' },
];

const revision: RevisionSummary = {
  oneLiner: 'USE method: Utilisation + Saturation + Errors for every resource. node_exporter for host, cAdvisor for containers, kube-state-metrics for K8s objects.',
  mustKnow: [
    'USE method: Utilisation (% busy), Saturation (work queuing), Errors — apply to every resource systematically',
    'node_exporter: host CPU/memory/disk/network. cAdvisor: per-container CPU throttling/memory. kube-state-metrics: pod/deployment state',
    'CPU throttling is silent — container hitting CPU limit adds latency without HTTP errors. Monitor throttle ratio.',
    'OOM kills: kube_pod_container_status_last_terminated_reason == "OOMKilled" — track memory headroom proactively',
    'Connection pool saturation (DB/Redis) is a leading indicator — alert on waiting connections before timeouts occur',
    'Database connection pool exhaustion cascades into request timeouts — monitor pool state as a gauge',
  ],
  interviewFocus: [
    'What is the USE method and how do you apply it to a CPU resource?',
    'What is CPU throttling in Kubernetes and how does it show up in metrics?',
    'How do you detect a database connection pool saturation problem before it causes user-visible failures?',
  ],
};

@Component({
  selector: 'app-obs-infrastructure',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './infrastructure-metrics.html',
  styleUrl: './infrastructure-metrics.scss',
})
export class ObsInfrastructureMetrics {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
