import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-monitoring',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.scss'
})
export class DevopsMonitoring {

  quickRef: QuickRefItem[] = [
    { name: 'Prometheus', type: 'keyword', desc: 'Open-source metrics database with a pull-based scrape model and PromQL query language' },
    { name: 'PromQL', type: 'keyword', desc: 'Prometheus Query Language; rate(), histogram_quantile(), sum by() are the most common functions' },
    { name: 'Grafana', type: 'keyword', desc: 'Visualisation platform for metrics, logs, and traces; connects to Prometheus, Loki, Datadog, and 300+ data sources' },
    { name: 'AlertManager', type: 'keyword', desc: 'Routes Prometheus alerts to PagerDuty, Slack, email; groups and deduplicates firing alerts' },
    { name: 'Datadog', type: 'keyword', desc: 'SaaS observability platform: metrics, APM, logs, RUM, synthetic monitoring in one UI' },
    { name: 'Azure Monitor', type: 'keyword', desc: 'Azure\'s native observability service — collects metrics, logs, and traces from Azure resources' },
    { name: 'Application Insights', type: 'keyword', desc: 'Azure Monitor feature for APM: request rates, dependencies, exceptions, performance counters' },
    { name: 'rate()', type: 'method', desc: 'PromQL: per-second rate of a counter over a time window — rate(http_requests_total[5m])' },
    { name: 'histogram_quantile()', type: 'method', desc: 'PromQL: compute Nth percentile from a histogram — histogram_quantile(0.99, ...)' },
    { name: 'SLO-based alerting', type: 'keyword', desc: 'Alert when error budget burn rate is too high, not on raw thresholds — reduces noise' },
    { name: 'Cardinality', type: 'keyword', desc: 'Number of unique label combinations in a metric; high cardinality (user IDs as labels) kills Prometheus' },
    { name: 'Dead man\'s switch', type: 'keyword', desc: 'An alert that fires when your alerting pipeline itself goes silent — prevents silent monitoring failures' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The four golden signals',
      points: [
        'Google SRE defined four signals that capture the health of any service: Latency, Traffic, Errors, and Saturation (LTES).',
        'Latency: how long it takes to serve a request. Track percentiles (p50, p95, p99) — averages hide the tail. A p99 of 5s means 1% of users wait 5 seconds.',
        'Traffic: how many requests per second the system handles. Useful baseline for scaling and anomaly detection.',
        'Errors: the rate of failed requests (HTTP 5xx, exceptions, timeouts). Distinguish user errors (4xx — their problem) from system errors (5xx — your problem).',
        'Saturation: how full your resources are (CPU %, memory %, queue depth). Systems degrade before they hit 100% — alert at 80% not 100%.',
      ]
    },
    {
      heading: 'Prometheus architecture',
      points: [
        'Prometheus uses a pull model: it scrapes HTTP /metrics endpoints on your services at a configured interval (default 15s). No agent required — just expose metrics.',
        'Metrics are stored as time-series: metric_name{label="value"} float_value timestamp. Labels add dimensions; avoid high-cardinality labels (user IDs, request IDs).',
        'Four metric types: Counter (monotonically increasing, e.g. total requests), Gauge (can go up or down, e.g. active connections), Histogram (bucketed latency distribution), Summary (precomputed quantiles).',
        'Prefer Histograms over Summaries: histograms can be aggregated across instances with histogram_quantile(); summaries cannot. Histograms are better for distributed systems.',
        'ServiceMonitor (Prometheus Operator): a Kubernetes CRD that tells Prometheus which Services to scrape — no manual scrape config editing required.',
      ]
    },
    {
      heading: 'Alerting strategy',
      points: [
        'Alert on symptoms, not causes: "5xx rate > 1%" is a symptom (users are affected). "CPU > 90%" is a cause (may not affect users yet). Symptom-based alerts reduce noise and wake-up calls.',
        'AlertManager groups related alerts, deduplicates repeated fires, and routes to the right on-call. Configure receivers for PagerDuty (P1), Slack (P2/P3), and email (low-priority).',
        'SLO-based alerting (multi-window multi-burn rate): fire when the error budget is being consumed too fast. A 14.4× burn rate means the 30-day budget will be gone in 2 hours — page now.',
        'Dead man\'s switch: an alert that always fires (WatchdogAlert in Prometheus rules). If AlertManager stops receiving it, something broke in the alerting pipeline itself.',
        'Runbook URLs: every alert rule should have a runbook_url annotation pointing to the troubleshooting guide. On-call engineers should not be reading code at 3am.',
      ]
    },
    {
      heading: 'Grafana dashboards',
      points: [
        'Grafana connects to multiple data sources simultaneously: Prometheus for metrics, Loki for logs, Tempo for traces — enabling correlated observability on one screen.',
        'Dashboard-as-code: store dashboard JSON in Git. Grafana provisioning API loads dashboards at startup. Grafana Operator for Kubernetes manages dashboards as CRDs.',
        'USE method for infrastructure (Utilisation, Saturation, Errors) and RED method for services (Rate, Errors, Duration) are standard dashboard templates.',
        'Avoid vanity dashboards: build dashboards for specific jobs (deploy dashboard, incident triage, capacity planning) not generic "show everything".',
        'Grafana Alerting (unified alerting): create alert rules directly in Grafana against any data source, route through contact points (PagerDuty, Slack, webhooks).',
      ]
    },
    {
      heading: 'Azure Monitor and Application Insights',
      points: [
        'Azure Monitor is the umbrella service: collects platform metrics from all Azure resources automatically (no instrumentation), plus custom metrics and logs via agents.',
        'Log Analytics workspace: centralised log repository. Kusto Query Language (KQL) queries logs. Azure Monitor Alerts can fire on log query results.',
        'Application Insights instruments application-level telemetry: request rates, response times, dependency calls (SQL, HTTP), exceptions, custom events. SDK available for .NET, Node.js, Python, Java.',
        'Smart Detection: Application Insights ML-based anomaly detection automatically fires on unusual failure rates or performance degradation without manual threshold configuration.',
        'Azure Monitor Action Groups: reusable alert routing — email, SMS, Logic App, Azure Function, webhook, ITSM connector. Wire alert rules to action groups for consistent routing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Prometheus + AlertManager Rules',
      language: 'bash',
      code: `# ─── Prometheus scrape config (prometheus.yml) ────────────────────────────────

# global:
#   scrape_interval: 15s
#   evaluation_interval: 15s
#
# scrape_configs:
#   - job_name: myapp
#     static_configs:
#       - targets: ['myapp-service:8080']
#     metrics_path: /metrics
#
#   - job_name: kubernetes-pods
#     kubernetes_sd_configs:
#       - role: pod
#     relabel_configs:
#       - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
#         action: keep
#         regex: "true"

# ─── Alert rules (alerts.yml) ─────────────────────────────────────────────────

# groups:
# - name: myapp.rules
#   rules:
#
#   # Four golden signals
#   - alert: HighErrorRate
#     expr: |
#       rate(http_requests_total{status=~"5.."}[5m])
#       / rate(http_requests_total[5m]) > 0.01
#     for: 2m
#     labels:
#       severity: page
#     annotations:
#       summary: "High error rate on {{ \$labels.job }}"
#       description: "Error rate {{ \$value | humanizePercentage }} > 1%"
#       runbook_url: "https://runbooks.internal/high-error-rate"
#
#   - alert: SlowLatency
#     expr: |
#       histogram_quantile(0.99,
#         rate(http_request_duration_seconds_bucket[5m])
#       ) > 1.0
#     for: 5m
#     labels:
#       severity: warning
#     annotations:
#       summary: "p99 latency > 1s on {{ \$labels.job }}"
#
#   - alert: HighMemoryUsage
#     expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
#     for: 10m
#     labels:
#       severity: warning
#     annotations:
#       summary: "Memory at {{ \$value | humanizePercentage }} of limit"
#
#   # Dead man's switch — fires constantly; silence means alerting is broken
#   - alert: Watchdog
#     expr: vector(1)
#     labels:
#       severity: none
#     annotations:
#       summary: "Alerting pipeline is alive"

# ─── AlertManager routing (alertmanager.yml) ──────────────────────────────────

# global:
#   resolve_timeout: 5m
#
# route:
#   group_by: ['alertname', 'job']
#   group_wait: 30s
#   group_interval: 5m
#   repeat_interval: 12h
#   receiver: slack-warnings
#   routes:
#     - match:
#         severity: page
#       receiver: pagerduty
#     - match:
#         severity: warning
#       receiver: slack-warnings
#
# receivers:
#   - name: pagerduty
#     pagerduty_configs:
#       - routing_key: '\$\{\{ secrets.PAGERDUTY_KEY }}'
#         description: '{{ .CommonAnnotations.summary }}'
#   - name: slack-warnings
#     slack_configs:
#       - api_url: 'https://hooks.slack.com/services/...'
#         channel: '#alerts'
#         title: '{{ .CommonAnnotations.summary }}'`,
    },
    {
      label: 'Grafana Dashboard as Code',
      language: 'bash',
      code: `# ─── Grafana provisioning: datasources.yaml ───────────────────────────────────

# apiVersion: 1
# datasources:
#   - name: Prometheus
#     type: prometheus
#     url: http://prometheus:9090
#     isDefault: true
#   - name: Loki
#     type: loki
#     url: http://loki:3100

# ─── dashboard.json (simplified) ─────────────────────────────────────────────
# Store in Git → Grafana loads on startup via provisioning
# {
#   "title": "MyApp — Golden Signals",
#   "panels": [
#     {
#       "title": "Request Rate (RPS)",
#       "type": "timeseries",
#       "targets": [{
#         "expr": "sum(rate(http_requests_total[5m])) by (job)",
#         "legendFormat": "{{ job }}"
#       }]
#     },
#     {
#       "title": "Error Rate (%)",
#       "type": "timeseries",
#       "targets": [{
#         "expr": "sum(rate(http_requests_total{status=~'5..'}[5m])) / sum(rate(http_requests_total[5m])) * 100",
#         "legendFormat": "5xx %"
#       }],
#       "fieldConfig": { "thresholds": { "steps": [{ "color": "red", "value": 1 }] } }
#     },
#     {
#       "title": "p99 Latency (ms)",
#       "type": "timeseries",
#       "targets": [{
#         "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) * 1000",
#         "legendFormat": "p99"
#       }]
#     }
#   ]
# }

# ─── Kubernetes: Prometheus Operator ServiceMonitor ───────────────────────────

# apiVersion: monitoring.coreos.com/v1
# kind: ServiceMonitor
# metadata:
#   name: myapp
#   namespace: production
#   labels:
#     release: kube-prometheus-stack     # must match Prometheus selector
# spec:
#   selector:
#     matchLabels:
#       app: myapp
#   endpoints:
#     - port: http
#       path: /metrics
#       interval: 15s
#       scrapeTimeout: 10s

# ─── .NET Application Insights SDK ────────────────────────────────────────────

# Program.cs
# builder.Services.AddApplicationInsightsTelemetry(
#   builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]);

# Custom telemetry event:
# private readonly TelemetryClient _telemetry;
# _telemetry.TrackEvent("OrderPlaced", new Dictionary<string, string> {
#     ["orderId"] = order.Id,
#     ["amount"]  = order.Total.ToString("F2")
# });
# _telemetry.TrackMetric("CheckoutDurationMs", stopwatch.ElapsedMilliseconds);`,
    },
    {
      label: 'SLO-Based Alerting',
      language: 'bash',
      code: `# ─── SLO definition ──────────────────────────────────────────────────────────
# SLI: proportion of successful requests (non-5xx)
# SLO: 99.9% availability over a rolling 30-day window
# Error budget: 0.1% × 30d × 24h × 60min = 43.2 minutes of downtime allowed

# ─── Multi-window multi-burn-rate alerts (Google SRE recommendation) ──────────

# groups:
# - name: slo.rules
#   rules:
#
#   # Fast-burn: consuming budget 14.4× faster than allowed
#   # 14.4× burn depletes budget in 2 hours — PAGE NOW
#   - alert: ErrorBudgetBurnHigh
#     expr: |
#       (
#         rate(http_requests_total{status=~"5.."}[1h])
#         / rate(http_requests_total[1h])
#       ) > (14.4 * 0.001)     # 0.001 = 1 - 0.999 SLO
#       and
#       (
#         rate(http_requests_total{status=~"5.."}[5m])
#         / rate(http_requests_total[5m])
#       ) > (14.4 * 0.001)
#     for: 2m
#     labels:
#       severity: page
#     annotations:
#       summary: "Error budget burning fast — 2h window"
#       description: "Burn rate {{ \$value | humanize }}× — budget exhausted in ~2h"
#
#   # Slow-burn: consuming budget 6× faster
#   # 6× burn depletes budget in ~5 days — TICKET NOW
#   - alert: ErrorBudgetBurnMedium
#     expr: |
#       (
#         rate(http_requests_total{status=~"5.."}[6h])
#         / rate(http_requests_total[6h])
#       ) > (6 * 0.001)
#       and
#       (
#         rate(http_requests_total{status=~"5.."}[30m])
#         / rate(http_requests_total[30m])
#       ) > (6 * 0.001)
#     for: 15m
#     labels:
#       severity: ticket
#     annotations:
#       summary: "Error budget slow burn — investigate soon"

# ─── Error budget dashboard panel ─────────────────────────────────────────────
# Remaining budget % (Grafana stat panel):
# 1 - (
#   sum(rate(http_requests_total{status=~"5.."}[30d]))
#   / sum(rate(http_requests_total[30d]))
# ) / 0.001

# ─── Azure Monitor KQL alert ──────────────────────────────────────────────────
# Log Analytics Workspace alert rule — fires on high exception rate
# requests
# | where timestamp > ago(5m)
# | summarize
#     total    = count(),
#     failures = countif(success == false)
#     by bin(timestamp, 1m), cloud_RoleName
# | extend errorRate = todouble(failures) / todouble(total) * 100
# | where errorRate > 1.0
# | project timestamp, cloud_RoleName, errorRate`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Alerting on CPU % instead of user-facing symptoms',
      wrong: `- alert: HighCPU
  expr: cpu_usage_percent > 90
  for: 5m
  labels:
    severity: page`,
      right: `- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
  for: 2m
  labels:
    severity: page
    runbook_url: https://runbooks.internal/high-error-rate`,
      explanation: 'CPU at 90% may not affect users — the app might handle it fine. A 1% error rate definitely is affecting users. Alert on symptoms (what users experience) rather than causes (what the system is doing). Fewer alerts, higher signal, less on-call fatigue.',
    },
    {
      title: 'Using user IDs or request IDs as metric labels',
      wrong: `// HIGH CARDINALITY — kills Prometheus
httpRequestsTotal.WithLabels(userId, endpoint, method).Inc()`,
      right: `// LOW CARDINALITY — safe
httpRequestsTotal.WithLabels(endpoint, method, statusCode).Inc()
// user-level analysis belongs in logs or traces, not metrics`,
      explanation: 'Prometheus stores a time-series per unique label combination. A user_id label with 1M users creates 1M series — Prometheus runs out of memory. Keep metric label cardinality under a few hundred unique values. User IDs, request IDs, and session IDs belong in structured logs or distributed traces.',
    },
    {
      title: 'No runbook URL on alert rules',
      wrong: `- alert: DatabaseConnectionPoolExhausted
  expr: db_pool_idle_connections == 0
  annotations:
    summary: "DB pool exhausted"`,
      right: `- alert: DatabaseConnectionPoolExhausted
  expr: db_pool_idle_connections == 0
  for: 1m
  annotations:
    summary: "DB connection pool exhausted on {{ \$labels.instance }}"
    runbook_url: "https://runbooks.internal/db-pool-exhausted"
    description: "Pool has been empty for >1m. Check for connection leaks or increase pool size."`,
      explanation: 'On-call engineers are woken at 3am — they should not need to search for how to debug the issue. Every alert rule must have a runbook_url annotation linking directly to the troubleshooting procedure. Also add a description with the current value and thresholds for immediate context.',
    },
    {
      title: 'Measuring average latency instead of percentiles',
      wrong: `- alert: SlowResponse
  expr: avg(http_request_duration_seconds) > 0.5
  for: 5m`,
      right: `- alert: SlowResponseP99
  expr: |
    histogram_quantile(0.99,
      rate(http_request_duration_seconds_bucket[5m])
    ) > 1.0
  for: 5m`,
      explanation: 'Averages hide the tail. If 99% of requests take 10ms but 1% take 10 seconds, the average might look acceptable. histogram_quantile(0.99, ...) exposes the worst-case experience for real users. Track p50 (median), p95, and p99 — alert on p99.',
    },
    {
      title: 'No alert on the alerting pipeline itself',
      wrong: `# Only application alerts defined
# If Prometheus crashes or AlertManager is misconfigured, silence is indistinguishable from healthy`,
      right: `- alert: Watchdog
  expr: vector(1)
  labels:
    severity: none
  annotations:
    summary: "Alerting pipeline heartbeat"
# AlertManager routes Watchdog to DeadMansSnitch or a separate pager channel
# If it stops firing → pipeline is broken → external service pages you`,
      explanation: 'If Prometheus crashes, AlertManager stops working, or a misconfigured rule silences everything — you won\'t know. A Watchdog alert fires constantly (vector(1) is always true). Route it to a dead man\'s switch service (DeadMansSnitch, PagerDuty heartbeat) that pages you if the heartbeat stops.',
    },
  ];

  challenge: Challenge = {
    title: 'Alert Severity Classifier',
    language: 'typescript',
    description: `Classify a monitoring alert based on its metrics and return the appropriate severity and action.

Given an alert with these fields:
- errorRatePct: number (percentage of requests that are errors, 0–100)
- p99LatencyMs: number (99th percentile latency in milliseconds)
- memoryPct: number (memory usage as percentage of limit, 0–100)
- cpuPct: number (CPU usage as percentage of limit, 0–100)

Return: { severity: 'critical' | 'high' | 'medium' | 'low' | 'ok', action: string, primaryReason: string }

Rules (evaluate in order, first match wins):
1. errorRatePct > 5 OR p99LatencyMs > 5000 → critical, action: "page on-call immediately"
2. errorRatePct > 1 OR p99LatencyMs > 2000 → high, action: "open P2 incident, notify team"
3. memoryPct > 85 OR cpuPct > 85 → medium, action: "create ticket, monitor closely"
4. memoryPct > 70 OR cpuPct > 70 → low, action: "log and review at next standup"
5. All below thresholds → ok, action: "no action required"

primaryReason: name the metric that triggered the severity (e.g. "errorRate", "p99Latency", "memory", "cpu", "none").`,
    hints: [
      'Evaluate the conditions in order — the first match wins, so use if/else if chains.',
      'For each condition, check all metrics that contribute to that severity level.',
      'primaryReason needs to identify which specific metric crossed the threshold.',
      'Return the ok case as the final else with action "no action required".',
    ],
    starterCode: `interface AlertMetrics {
  errorRatePct: number;
  p99LatencyMs: number;
  memoryPct: number;
  cpuPct: number;
}

interface AlertResult {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'ok';
  action: string;
  primaryReason: string;
}

function classifyAlert(metrics: AlertMetrics): AlertResult {
  // TODO: implement severity classification
  return { severity: 'ok', action: '', primaryReason: 'none' };
}

// Tests
console.log(classifyAlert({ errorRatePct: 8, p99LatencyMs: 300, memoryPct: 50, cpuPct: 60 }));
// { severity: 'critical', action: 'page on-call immediately', primaryReason: 'errorRate' }

console.log(classifyAlert({ errorRatePct: 0.5, p99LatencyMs: 2500, memoryPct: 60, cpuPct: 50 }));
// { severity: 'high', action: 'open P2 incident, notify team', primaryReason: 'p99Latency' }

console.log(classifyAlert({ errorRatePct: 0.1, p99LatencyMs: 200, memoryPct: 90, cpuPct: 40 }));
// { severity: 'medium', action: 'create ticket, monitor closely', primaryReason: 'memory' }

console.log(classifyAlert({ errorRatePct: 0, p99LatencyMs: 150, memoryPct: 45, cpuPct: 30 }));
// { severity: 'ok', action: 'no action required', primaryReason: 'none' }`,
    solution: `interface AlertMetrics {
  errorRatePct: number;
  p99LatencyMs: number;
  memoryPct: number;
  cpuPct: number;
}

interface AlertResult {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'ok';
  action: string;
  primaryReason: string;
}

function classifyAlert(metrics: AlertMetrics): AlertResult {
  const { errorRatePct, p99LatencyMs, memoryPct, cpuPct } = metrics;

  if (errorRatePct > 5 || p99LatencyMs > 5000) {
    return {
      severity: 'critical',
      action: 'page on-call immediately',
      primaryReason: errorRatePct > 5 ? 'errorRate' : 'p99Latency',
    };
  }
  if (errorRatePct > 1 || p99LatencyMs > 2000) {
    return {
      severity: 'high',
      action: 'open P2 incident, notify team',
      primaryReason: errorRatePct > 1 ? 'errorRate' : 'p99Latency',
    };
  }
  if (memoryPct > 85 || cpuPct > 85) {
    return {
      severity: 'medium',
      action: 'create ticket, monitor closely',
      primaryReason: memoryPct > 85 ? 'memory' : 'cpu',
    };
  }
  if (memoryPct > 70 || cpuPct > 70) {
    return {
      severity: 'low',
      action: 'log and review at next standup',
      primaryReason: memoryPct > 70 ? 'memory' : 'cpu',
    };
  }
  return { severity: 'ok', action: 'no action required', primaryReason: 'none' };
}

console.log(classifyAlert({ errorRatePct: 8, p99LatencyMs: 300, memoryPct: 50, cpuPct: 60 }));
// { severity: 'critical', action: 'page on-call immediately', primaryReason: 'errorRate' }

console.log(classifyAlert({ errorRatePct: 0.5, p99LatencyMs: 2500, memoryPct: 60, cpuPct: 50 }));
// { severity: 'high', action: 'open P2 incident, notify team', primaryReason: 'p99Latency' }

console.log(classifyAlert({ errorRatePct: 0.1, p99LatencyMs: 200, memoryPct: 90, cpuPct: 40 }));
// { severity: 'medium', action: 'create ticket, monitor closely', primaryReason: 'memory' }

console.log(classifyAlert({ errorRatePct: 0, p99LatencyMs: 150, memoryPct: 45, cpuPct: 30 }));
// { severity: 'ok', action: 'no action required', primaryReason: 'none' }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What are the four golden signals defined by Google SRE?',
      options: [
        'CPU, Memory, Disk, Network',
        'Latency, Traffic, Errors, Saturation',
        'Availability, Reliability, Scalability, Security',
        'Requests, Response time, Error rate, Throughput',
      ],
      answer: 1,
      explanation: 'Latency (how long), Traffic (how many), Errors (how many fail), Saturation (how full). These four signals give a complete picture of service health from the user\'s perspective. CPU/memory are causes, not golden signals — they matter only when they affect these four metrics.',
    },
    {
      q: 'Why should you use histogram_quantile() instead of avg() for latency alerts?',
      options: [
        'avg() is deprecated in newer versions of Prometheus',
        'histogram_quantile() runs faster in PromQL',
        'Averages hide the tail — p99 reveals the worst 1% of user experiences that averages mask',
        'avg() only works on counters, not histograms',
      ],
      answer: 2,
      explanation: 'If 99% of requests take 10ms but 1% take 10 seconds, the average might be 110ms — looks fine. But 1% of users are getting terrible experience. histogram_quantile(0.99, ...) surfaces that worst-case tail. Always alert on p95 or p99, never on averages for latency.',
    },
    {
      q: 'What is the purpose of a Watchdog / dead man\'s switch alert?',
      options: [
        'It fires when a service goes down and calls the on-call engineer',
        'It constantly fires to prove the alerting pipeline itself is working — silence means the pipeline broke',
        'It prevents accidental deployment during on-call hours',
        'It escalates an alert to a manager if not acknowledged within 15 minutes',
      ],
      answer: 1,
      explanation: 'Watchdog (vector(1)) is always true — it always fires. AlertManager routes it to a heartbeat service (DeadMansSnitch). If Prometheus crashes or AlertManager misconfigures, the heartbeat stops firing and the external service pages you. Without it, a broken alerting pipeline is silently invisible.',
    },
    {
      q: 'Why is high cardinality dangerous for Prometheus?',
      options: [
        'High cardinality causes PromQL queries to return incorrect values',
        'Each unique label combination creates a separate time-series; millions of series exhaust Prometheus memory',
        'Prometheus cannot scrape more than 100 unique label values per metric',
        'High cardinality makes Grafana dashboards slow to render',
      ],
      answer: 1,
      explanation: 'Prometheus stores one time-series per unique label combination. A user_id label with 1 million users → 1 million series per metric. With retention and multiple metrics, memory explodes and Prometheus OOM-kills. Keep labels to low-cardinality dimensions (method, status, endpoint) — not IDs.',
    },
    {
      q: 'In SLO-based alerting, what does a 14.4× burn rate mean?',
      options: [
        'The service is handling 14.4 times more traffic than normal',
        'CPU is at 14.4 times its SLO threshold',
        'The error budget is being consumed 14.4 times faster than allowed — it will be exhausted in ~2 hours',
        'The alert has been firing for 14.4 minutes without acknowledgement',
      ],
      answer: 2,
      explanation: 'If your SLO allows 0.1% errors over 30 days, and you\'re currently seeing 1.44% errors (14.4× the allowance), the 30-day budget will be fully consumed in 30d ÷ 14.4 ≈ 2 days — but with a 1-hour confirmation window, the worst case is ~2 hours. This is the trigger for an immediate page — you\'re burning budget fast enough to violate the SLO very soon.',
    },
    {
      q: 'What are the Four Golden Signals for monitoring a service?',
      options: [
        'CPU, memory, disk, network',
        'Latency, traffic, errors, and saturation — the signals most indicative of whether a service is healthy from a user perspective',
        'P50, P95, P99, P99.9 latency percentiles',
        'Availability, reliability, scalability, maintainability'],
      answer: 1,
      explanation: 'Google SRE\'s Four Golden Signals: Latency (how long requests take — distinguish successful vs error latency), Traffic (request rate — qps, transactions/sec), Errors (rate of failed requests — HTTP 5xx, exceptions, policy violations), Saturation (how "full" the service is — CPU, queue depth, disk). These four signals give the most actionable signal for service health. Alert on all four; correlate them during incidents.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Prometheus and Datadog?',
      a: 'Prometheus is open-source, self-hosted, and pull-based — it scrapes metrics from your services. You manage storage, scaling, and high availability yourself (Thanos or Cortex for scale). Datadog is a commercial SaaS platform: send metrics, logs, and traces to Datadog\'s cloud. No infrastructure to manage, but it costs per host/metric/log. Prometheus + Grafana + AlertManager is the standard open-source stack; Datadog is common in enterprises that want a fully managed, correlated observability platform.',
    },
    {
      q: 'What is the difference between the USE and RED methods for dashboards?',
      a: 'USE (Brendan Gregg): Utilisation, Saturation, Errors — applied to infrastructure resources (CPU, memory, disk, network). USE answers "is this resource healthy?". RED (Tom Wilkie): Rate, Errors, Duration — applied to services/endpoints. RED answers "is this service serving users well?". Use USE for host/node dashboards and RED for application/API dashboards. Together they form a complete picture.',
    },
    {
      q: 'How do you instrument a .NET application for Application Insights?',
      a: 'Add the Microsoft.ApplicationInsights.AspNetCore NuGet package. In Program.cs: builder.Services.AddApplicationInsightsTelemetry(configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]). This auto-instruments HTTP requests, dependencies (SQL, HTTP outbound), exceptions, and process counters. For custom telemetry, inject TelemetryClient and call TrackEvent(), TrackMetric(), TrackException(), TrackDependency(). The connection string (not key since SDK 2.12) is set via environment variable or Key Vault reference.',
    },
    {
      q: 'What is a Prometheus Operator ServiceMonitor?',
      a: 'A Kubernetes custom resource (CRD) from the Prometheus Operator that declaratively configures which Services Prometheus should scrape. Instead of editing prometheus.yml directly, you create a ServiceMonitor in the same namespace as your app, specifying the port and path. The Prometheus Operator watches ServiceMonitor resources and automatically updates Prometheus\'s scrape configuration. It pairs with the kube-prometheus-stack Helm chart which installs Prometheus, AlertManager, and Grafana with sensible defaults.',
    },
    {
      q: 'How does Azure Monitor Smart Detection work?',
      a: 'Smart Detection uses machine learning to establish a baseline of your application\'s normal behaviour (request rates, failure rates, response times) over the first few days. It then continuously monitors for anomalies — unusual spikes in failure rates, degraded dependency performance, or memory leak patterns — without you defining thresholds. When it detects an anomaly, it sends a Smart Detection notification to the configured Action Group with context about what changed and when. It\'s complementary to, not a replacement for, manual alert rules.',
    },
    {
      q: 'What is the difference between SLO, SLA, and SLI?',
      a: 'SLI (Service Level Indicator): a quantitative measure of a service characteristic — e.g., request success rate = (successful requests / total requests) × 100%. The raw metric. SLO (Service Level Objective): an internal target for an SLI — e.g., "99.9% of requests should succeed". Defined by the engineering team, drives reliability work. SLA (Service Level Agreement): a contractual commitment to a customer with financial penalties for breach — usually slightly looser than your SLO (SLO 99.9%, SLA 99.5%) to give buffer. SLOs drive internal behaviour (error budget, engineering priorities). SLAs drive business consequences (refunds, penalties). Set SLOs first, derive SLAs from them with buffer, measure SLIs continuously to track both.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Monitor services with Prometheus\'s four golden signals, alert on symptoms via AlertManager, visualise with Grafana, and replace threshold-based noise with SLO burn-rate alerting.',
    mustKnow: [
      'Four golden signals: Latency (p99, not avg), Traffic (RPS), Errors (5xx rate), Saturation (memory/CPU %)',
      'Alert on symptoms (error rate > 1%) not causes (CPU > 90%) — fewer alerts, higher signal',
      'histogram_quantile(0.99, rate(bucket[5m])): p99 latency — use histograms not summaries for distributed systems',
      'High cardinality kills Prometheus: no user_id/request_id labels; keep cardinality under ~100 unique values per label',
      'SLO burn-rate: 14.4× = page now (budget gone in 2h); 6× = ticket soon (gone in ~5 days)',
      'Watchdog/dead man\'s switch: always-firing alert that proves the alerting pipeline is alive',
      'Every alert must have runbook_url — engineers should not search for remediation at 3am',
    ],
    interviewFocus: [
      'What are the four golden signals and why do you alert on symptoms not causes?',
      'Why is histogram_quantile() better than avg() for latency SLOs?',
      'Explain SLO-based alerting: what is error budget, burn rate, and why is it better than thresholds?',
      'What happens if Prometheus itself crashes? How do you detect a broken alerting pipeline?',
    ],
  };
}
