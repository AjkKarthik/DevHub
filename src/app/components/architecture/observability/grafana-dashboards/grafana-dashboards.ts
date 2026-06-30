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
  { name: 'Dashboard',     type: 'keyword', desc: 'Collection of panels visualising metrics/logs/traces. Organised in rows, saved as JSON. Can be version-controlled in Git.' },
  { name: 'Panel',         type: 'keyword', desc: 'A single visualisation: time series chart, stat, table, heatmap, logs view, or node graph. Each has its own query.' },
  { name: 'Data Source',   type: 'keyword', desc: 'Backend Grafana queries — Prometheus, Loki, Tempo, Elasticsearch, InfluxDB, PostgreSQL, Jaeger. Supports multiple simultaneously.' },
  { name: 'Variable',      type: 'keyword', desc: 'Dashboard template variable — dropdown populated from a query (e.g., all services). Filters all panels dynamically.' },
  { name: 'Annotation',    type: 'keyword', desc: 'Vertical marker on time series panels — typically deployment events or incidents. Helps correlate changes with metric behaviour.' },
  { name: 'Alert Rule',    type: 'keyword', desc: 'Grafana 9+ unified alerting — define PromQL/LogQL threshold, evaluation interval, notification policy, contact points.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Grafana Architecture',
    points: [
      'Grafana is a multi-source visualisation platform — it queries your data sources (Prometheus, Loki, Tempo) and renders the results. It does not store metrics itself.',
      'The data source plugin model: each backend has a plugin that translates Grafana\'s internal query format to the native query language (PromQL, LogQL, TraceQL). You can add multiple data sources of the same type (e.g., prod and staging Prometheus).',
      'Dashboard JSON: every dashboard is stored as a JSON document. Version-control your dashboards in Git using `grafonnet` (Jsonnet library) or the Grafana API. Treat dashboards as code.',
      'Grafana Cloud vs self-hosted: Grafana Cloud includes hosted Prometheus (Mimir), Loki, and Tempo with a generous free tier. Self-hosted gives more control but requires operating the full LGTM stack (Loki, Grafana, Tempo, Mimir/Prometheus).',
    ],
  },
  {
    heading: 'The RED Dashboard Pattern',
    points: [
      'RED: Rate (requests/second), Errors (error rate %), Duration (p50/p95/p99 latency). The three panels every service dashboard needs.',
      'One dashboard per service/component. Start with a fleet overview (all services, top-level health), then drill into per-service RED dashboards, then per-endpoint details.',
      'Use variables for dynamic filtering: a `$service` variable populated by `label_values(up, job)` lets you switch between services with a dropdown — one dashboard serves all services.',
      'Link panels to related dashboards: the service overview should link to per-endpoint drilldown, which should link to traces (Tempo) and logs (Loki) for the selected time range.',
    ],
  },
  {
    heading: 'Correlating Metrics, Logs, and Traces',
    points: [
      'Grafana Explore view: query Prometheus, Loki, and Tempo side by side. Switch from a metrics spike to logs for the same time range with one click.',
      'Exemplars: histogram metrics can carry trace IDs as exemplar data points. In Grafana, a diamond ◆ on the metric chart represents a trace. Click it to open the trace in Tempo.',
      'Loki datasource linking: add a `derivedField` to Loki datasource config — when a log line contains a traceId, Grafana renders it as a link to the Tempo trace.',
      'The investigation workflow: Prometheus alert fires → Grafana dashboard shows which service is degraded → click exemplar to open representative trace → Loki shows logs for that traceId → root cause found.',
    ],
  },
  {
    heading: 'Grafana Alerting (Unified Alerting)',
    points: [
      'Grafana 9+ unified alerting replaces both Grafana alerts and Prometheus alertmanager as the single alerting plane. Alert rules evaluate PromQL/LogQL queries on a schedule.',
      'Alert rule components: query (PromQL), condition (threshold), evaluation group (interval), labels (severity, team), annotations (summary, description, runbook URL).',
      'Contact points: Slack, PagerDuty, OpsGenie, email, webhook. Notification policy: routes alerts to contact points based on label matchers (severity=critical → PagerDuty, severity=warning → Slack).',
      'Silences and mute timings: suppress alerts during maintenance windows without disabling the underlying alert rule.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Dashboard JSON',
    language: 'typescript',
    code: `// Grafana dashboard as code (JSON structure — store in Git)
{
  "title": "Order Service — RED Dashboard",
  "uid": "order-service-red",
  "tags": ["service", "order", "red-method"],
  "refresh": "30s",
  "time": { "from": "now-1h", "to": "now" },

  "templating": {
    "list": [
      {
        "name": "service",
        "type": "query",
        "datasource": "Prometheus",
        "query": "label_values(http_requests_total, service)",
        "refresh": 2   // refresh on time range change
      },
      {
        "name": "env",
        "type": "custom",
        "options": ["production", "staging"]
      }
    ]
  },

  "panels": [
    {
      "title": "Request Rate (req/s)",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 0, "w": 8, "h": 8 },
      "targets": [{
        "expr": "sum(rate(http_requests_total{service='$service',env='$env'}[5m]))",
        "legendFormat": "req/s"
      }]
    },
    {
      "title": "Error Rate (%)",
      "type": "timeseries",
      "fieldConfig": {
        "defaults": {
          "thresholds": { "steps": [
            { "value": 0, "color": "green" },
            { "value": 1, "color": "yellow" },
            { "value": 5, "color": "red" }
          ]}
        }
      },
      "targets": [{
        "expr": "100 * sum(rate(http_requests_total{service='$service',status_code=~'5..'}[5m])) / sum(rate(http_requests_total{service='$service'}[5m]))",
        "legendFormat": "error %"
      }]
    },
    {
      "title": "Latency (ms)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{service='$service'}[5m])) by (le)) * 1000",
          "legendFormat": "p50"
        },
        {
          "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service='$service'}[5m])) by (le)) * 1000",
          "legendFormat": "p99"
        }
      ]
    }
  ]
}`,
  },
  {
    label: 'Loki + Tempo Linking',
    language: 'typescript',
    code: `# Grafana datasource config (grafana.ini / provisioning)
# Link traceId in logs to Tempo traces

# provisioning/datasources/loki.yaml
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    url: http://loki:3100
    jsonData:
      derivedFields:
        # When a log line contains traceId field, render it as a Tempo link
        - matcherRegex: '"traceId":"(\\w+)"'
          name: TraceID
          url: '\$\${__value.raw}'
          datasourceUid: tempo-uid  # Tempo datasource UID
          urlDisplayLabel: 'View Trace in Tempo'

  - name: Tempo
    type: tempo
    uid: tempo-uid
    url: http://tempo:3200
    jsonData:
      # Link from Tempo trace to Loki logs for same traceId
      tracesToLogs:
        datasourceUid: loki-uid
        tags: ['service', 'pod']
        filterByTraceID: true
        filterBySpanID: false
      # Link from Tempo trace to Prometheus metrics
      tracesToMetrics:
        datasourceUid: prometheus-uid
        queries:
          - name: 'Request rate'
            query: 'sum(rate(http_requests_total{service="$__tags{service}"}[5m]))'

# Now in Grafana:
# 1. Click a metric spike → exemplar diamond ◆ → opens Tempo trace
# 2. In Tempo, click "View Logs" → opens Loki filtered by traceId
# 3. In Loki, traceId fields are clickable links back to Tempo`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Creating one dashboard per team member instead of shared dashboards',
    wrong: `// Each engineer creates their own personal dashboard
// 47 dashboards named "Johns test", "Maria debug", "server stuff"
// Nobody uses the same dashboard during incidents
// No agreement on which metrics matter`,
    right: `// 3-tier dashboard hierarchy, version-controlled in Git:
// 1. Fleet Overview: all services health at a glance
// 2. Service Detail (RED): one per service, variables for filtering
// 3. Debugging: full detail, exemplars, logs/trace links
// Agreed oncall runbook references the correct dashboard`,
    explanation: 'Personal dashboards fragment observability. During incidents, engineers look at different views and cannot communicate effectively. Define a small set of shared dashboards organised in tiers (overview → service detail → debugging). Version-control dashboard JSON in Git so they can be reviewed, and promoted to production.',
  },
  {
    title: 'Using absolute thresholds for alerts instead of rate-based',
    wrong: `# Alert fires when current error count > 100
- alert: TooManyErrors
  expr: http_errors_total > 100
  # Fires at midnight for 1 error on low-traffic service
  # Does not fire at peak traffic with 10,000 errors (counter reset)`,
    right: `# Alert fires when error RATE exceeds 1% of request rate
- alert: ErrorRateTooHigh
  expr: |
    rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.01
  # Proportional to traffic — meaningful at any scale`,
    explanation: 'Raw counter values are meaningless for alerting — they depend on how long the service has been running. A counter value of 100 errors could be perfectly normal for a high-traffic service and catastrophic for a low-traffic one. Always alert on rates (errors per second, error percentage) not absolute counter values.',
  },
  {
    title: 'Dashboard has no links to logs or traces — can\'t investigate from dashboard',
    wrong: `// Dashboard shows latency spike at 14:32
// No link to Loki logs for that time range
// No exemplars pointing to Tempo traces
// Engineer opens separate Explore tab, re-enters the time range manually
// Loses 10 minutes setting up the investigation`,
    right: `// Panel data links in each panel:
{
  "links": [{
    "title": "View logs in Loki",
    "url": "/explore?left={\"datasource\":\"Loki\",\"queries\":[{\"expr\":\"{service=\\\"$service\\\"}\"}],\"range\":{\"from\":\"\${__from}\",\"to\":\"\${__to}\"}}"
  }]
}
// Exemplars on histogram panels link directly to traces`,
    explanation: 'A dashboard that shows a problem but provides no path to investigate it slows incident response. Always add panel data links to related Loki/Tempo Explore views pre-filled with the time range and service filter. Enable exemplars on latency histogram panels — they provide one-click navigation from a metric spike to a representative trace.',
  },
  {
    title: 'No dashboard annotations for deployments',
    wrong: `// Latency increases appear on dashboard
// No indication of what changed when
// Engineer must cross-reference deployment logs manually
// Takes 30 minutes to identify that the deploy at 14:00 caused it`,
    right: `// Grafana annotation API call on every deploy
curl -X POST http://grafana:3000/api/annotations \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Deploy v2.3.1 order-service","tags":["deploy","order-service"],"time":'$(date +%s%3N)'}'
// Vertical line appears on all dashboards at deploy time
// Immediately visible that latency increased 2 mins after deploy`,
    explanation: 'Without deployment annotations, correlating metric changes with code deployments requires manual log-trawling. Post an annotation to Grafana on every deployment (from CI/CD pipeline). The vertical line on time series charts immediately shows "latency increased 3 minutes after the 14:00 deploy" — a 30-minute investigation becomes a 30-second insight.',
  },
];

const challenge: Challenge = {
  title: 'Build a PromQL query generator',
  language: 'typescript',
  description: `Implement generateRedQuery(signal: 'rate' | 'errors' | 'duration', service: string, window: string): string

Return the PromQL query string for:
- rate: sum(rate(http_requests_total{service="<svc>"}[<w>]))
- errors: 100 * sum(rate(http_requests_total{service="<svc>",status_code=~"5.."}[<w>])) / sum(rate(http_requests_total{service="<svc>"}[<w>]))
- duration: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="<svc>"}[<w>])) by (le)) * 1000`,
  hints: ['Use template literals', 'Each signal has a fixed PromQL pattern'],
  starterCode: `function generateRedQuery(
  signal: 'rate' | 'errors' | 'duration',
  service: string,
  window: string
): string {
  return '';
}

console.log(generateRedQuery('rate', 'order-service', '5m'));
console.log(generateRedQuery('errors', 'order-service', '5m'));
console.log(generateRedQuery('duration', 'order-service', '5m'));`,
  solution: `function generateRedQuery(
  signal: 'rate' | 'errors' | 'duration',
  service: string,
  window: string
): string {
  const svcFilter = \`service="\${service}"\`;
  if (signal === 'rate') {
    return \`sum(rate(http_requests_total{\${svcFilter}}[\${window}]))\`;
  }
  if (signal === 'errors') {
    return \`100 * sum(rate(http_requests_total{\${svcFilter},status_code=~"5.."}[\${window}])) / sum(rate(http_requests_total{\${svcFilter}}[\${window}]))\`;
  }
  return \`histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{\${svcFilter}}[\${window}])) by (le)) * 1000\`;
}

console.log(generateRedQuery('rate', 'order-service', '5m'));
console.log(generateRedQuery('errors', 'order-service', '5m'));
console.log(generateRedQuery('duration', 'order-service', '5m'));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the purpose of a Grafana template variable like `$service`?',
    options: [
      'To define default alert thresholds that apply to all panels',
      'To create a dropdown that dynamically filters all panels by the selected service, so one dashboard serves all services',
      'To set the time range for all queries in the dashboard',
      'To password-protect dashboards for specific teams',
    ],
    answer: 1,
    explanation: 'Template variables create interactive dropdowns populated from metric queries (e.g., all unique values of the `service` label). When a value is selected, it is substituted into all panel queries as `$service`. One dashboard with a `$service` variable replaces 50 identical service-specific dashboards and stays in sync automatically as new services are added.',
  },
  {
    q: 'What are Grafana exemplars and how do they help investigation?',
    options: [
      'Example dashboard templates that can be imported from the Grafana dashboard library',
      'Data points on a histogram metric that carry a trace ID, enabling one-click navigation from a metric spike to the trace in Tempo',
      'Annotated screenshots of dashboards shared with team members during incidents',
      'Pre-built alert rules that exemplify best practices for SLO alerting',
    ],
    answer: 1,
    explanation: 'Exemplars are special data points attached to histogram observations that carry a trace ID. In Grafana, they appear as diamond ◆ markers on time series panels. Clicking an exemplar opens the associated trace in Tempo — letting you jump directly from "p99 latency spiked at 14:32" to a representative request trace from that moment without manually searching for traces.',
  },
  { q: 'What are the key principles of effective Grafana dashboard design?', options: ['Show as many metrics as possible on each panel to maximize information density', 'Design dashboards for a specific audience and purpose: start with an overview, drill down to details; use consistent color coding; place the most important metrics at the top left; limit panels per dashboard', 'Always use line graphs for all metric types for visual consistency', 'Each team should have its own completely separate dashboard for their service metrics'], answer: 1, explanation: 'Effective dashboard design principles: audience-first: know who will use this dashboard and what questions it answers (on-call engineer during incident vs capacity planning review). Hierarchy: overview dashboard links to service-specific dashboards which link to component dashboards. Consistent colors: red always means bad, green means good, yellow means warning. Top-left priority: most critical metrics visible without scrolling. Limit panels: 6-12 panels per dashboard maximum. More panels = cognitive overload. Whitespace: group related panels using rows. No orphan panels. Time range: default to last 1 hour for operational dashboards, last 30 days for trend dashboards. Annotations: mark deployments and incidents on the time axis.' },
  { q: 'What is the difference between a Grafana panel query variable and a dashboard variable?', options: ['Panel query variables filter the data within one panel only; dashboard variables filter all panels on the dashboard that use the variable', 'Dashboard variables are used in panel titles; panel query variables are used in the data source query only', 'Both types filter the same data; the difference is only cosmetic in the Grafana UI', 'Panel query variables are deprecated; only dashboard variables should be used in modern Grafana'], answer: 1, explanation: 'Grafana dashboard variables: template variables defined at the dashboard level. Appear as dropdown filters at the top of the dashboard. When changed, they affect all panels on the dashboard that reference the variable in their queries. Examples: instance, environment, namespace, pod. Common pattern: define a job variable that filters all Prometheus queries to a specific service. Define a namespace variable that filters all Kubernetes metrics to a specific namespace. Variable types: query (populated from a data source query), custom (fixed list), constant (hardcoded), interval (time grouping), textbox (freeform input). Variables make dashboards reusable across services, environments, and teams without duplicating dashboards.' },
  { q: 'What is Grafana alerting and how does it differ from Prometheus Alertmanager?', options: ['Grafana alerting replaces Prometheus Alertmanager entirely in modern Grafana stacks', 'Grafana alerting evaluates rules against any data source (not just Prometheus) and routes via Grafana notification channels; Alertmanager is a standalone service that receives alerts from Prometheus specifically', 'Grafana alerting only supports email notifications; Alertmanager supports all notification channels', 'Both are identical; Grafana alerting is simply a UI wrapper for Alertmanager'], answer: 1, explanation: 'Grafana unified alerting (Grafana 9+): evaluates alert rules against any Grafana data source (Prometheus, Loki, InfluxDB, SQL databases). Routes through Grafana notification policies and contact points (Slack, PagerDuty, email). Stores alert rules in Grafana database or as code in git (Grafana as code). Alertmanager (Prometheus): a standalone service that receives pre-fired alerts from Prometheus. Handles deduplication, grouping, routing, silencing, and inhibition. Highly mature with extensive routing capabilities. Comparison: Grafana alerting is better when using multiple data sources. Alertmanager is better for complex routing and inhibition logic. Modern stacks: Grafana alerting can send to an external Alertmanager, combining both systems.' },
  { q: 'What are Grafana dashboard annotations and how do you use them effectively?', options: ['Annotations are descriptive labels added to panel titles for documentation purposes', 'Annotations are vertical markers on time-series panels that indicate events like deployments, incidents, or config changes, helping correlate metric behavior with system events', 'Annotations are performance thresholds drawn as horizontal lines on metric graphs', 'Annotations are read-only comments added to dashboards by stakeholders in review mode'], answer: 1, explanation: 'Grafana annotations: vertical markers overlaid on time-series graphs at a specific timestamp. Sources: native annotations (added manually or via API). Query annotations (query a data source for events; display them as markers automatically). Webhook annotations (CI/CD systems send deployment events to Grafana API). Common use cases: mark every deployment with a vertical line. Mark incidents with color-coded annotations. Mark config changes, load tests, and cron job runs. Value: when a metric spikes, annotations immediately show if a deployment happened at the same time — the most common correlation in incident investigation. Correlation is the primary reason to use annotations. Without annotations, engineers must check deployment history separately and mentally overlay the timeline.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the LGTM stack and when should I use it?',
    a: 'LGTM stands for Loki (logs), Grafana (visualisation), Tempo (traces), Mimir/Prometheus (metrics) — a fully open-source, self-hostable observability stack. Use it when: <ul><li>You want full control over your observability infrastructure</li><li>You\'re cost-sensitive and cannot afford commercial solutions at scale</li><li>You have a Kubernetes environment and want to use the Grafana Operator or Helm charts</li></ul>When to consider alternatives: <ul><li><strong>Grafana Cloud</strong>: managed LGTM with generous free tier — best for small teams</li><li><strong>Datadog</strong>: all-in-one SaaS with excellent auto-discovery but expensive at scale</li><li><strong>AWS CloudWatch / Azure Monitor</strong>: native cloud options if you\'re already deep in one cloud provider</li></ul>The LGTM stack has the most active open-source community and Grafana can query any backend as a data source — mix and match (e.g., Prometheus + Tempo + Elastic) without switching the visualisation layer.',
  },
  {
    q: 'How should I organise dashboards for a team of 20 engineers running 15 microservices?',
    a: 'Three-tier hierarchy, all version-controlled in Git: <ol><li><strong>Fleet Overview</strong> (1 dashboard): traffic, error rate, p99 latency for ALL services on one screen. Oncall lands here first.</li><li><strong>Service RED dashboards</strong> (1 per service): deep-dive for a single service — request rate, error breakdown by endpoint, latency heatmap, resource usage. Template variable filters by instance/pod.</li><li><strong>Investigation dashboards</strong> (2-3 total): logs + traces + metrics side-by-side for debugging. Not service-specific — use variables to pivot to any service.</li></ol>Additionally: store all dashboard JSON in a <code>dashboards/</code> directory in the service repo or a shared observability repo. Use Grafana provisioning to auto-load dashboards on startup. Set a folder per team in Grafana. Link each dashboard to a runbook page in your wiki. Never have more than 10 starred/pinned dashboards per team — cognitive overload during incidents.',
  },
  { q: 'How do you organize Grafana dashboards in a large organization?', a: 'Dashboard organization strategy: folder structure: one folder per team or service. Shared folder for cross-team dashboards. Platform folder for infrastructure and Kubernetes dashboards. Naming conventions: team_service_purpose (e.g. payments_checkout_overview, payments_checkout_database). Tagging: tag dashboards by service, environment, team, and SLO. Enables filtering and searching across hundreds of dashboards. Dashboard hierarchy: platform overview (all services, key SLOs) links to service overview (one service, all RED metrics) links to component dashboard (database, cache, queue). Dashboard ownership: each dashboard has an owning team. The owning team is responsible for keeping it accurate. Unused dashboards create noise — archive or delete dashboards that have not been viewed in 90 days. Dashboard as code: store dashboards as JSON in git using grafonnet or Terraform Grafana provider. Peer review for dashboard changes. Prevents dashboard sprawl and drift.' },
  { q: 'What visualization types in Grafana are appropriate for which metric types?', a: 'Time series (line graph): the default for metrics over time. Rate metrics (requests per second), latency trends, error rate trends. Ideal for showing trends and correlating with events. Stat (single number): current value of a gauge or rate. Used for key indicators at a glance (current error rate, request rate). Supports thresholds for color coding (green/yellow/red). Bar gauge: comparison of values across multiple instances or services. Which pods have the highest error rate right now. Histogram panel: distribution of values. Latency distribution, request size distribution. Table: raw data, top-N queries, slow endpoints. Supports sorting and filtering. Logs panel: Loki log streams integrated directly into dashboards. Heatmap: latency over time visualized as a 2D heatmap (X: time, Y: latency bucket, color: frequency). The most powerful visualization for latency distribution trends. Node Graph: service dependency maps, trace topology.' },
  { q: 'How do you implement dashboard-as-code in Grafana?', a: 'Dashboard as code options: Grafana JSON model: each dashboard is a JSON document. Can be stored in git, reviewed, and deployed via API. Manual management becomes unwieldy at scale. Grafonnet: a Jsonnet library for generating Grafana dashboard JSON programmatically. Define reusable panel templates. Generate consistent dashboards for all microservices from a single template. Terraform Grafana provider: manage dashboards, data sources, folders, and alert rules as Terraform resources. Integrates with existing infrastructure-as-code workflows. Ansible Grafana collection: alternative for Ansible-based infrastructure teams. Grafana Grizzly: CLI tool for managing Grafana resources as YAML files with diff and deploy commands. Benefits of dashboard as code: peer review for dashboard changes via pull requests. Consistent structure across services. Prevent accidental deletion. Version history for all dashboard changes. CI/CD deployment of dashboards.' },
  { q: 'What are Grafana recording rules and how do they differ from Prometheus recording rules?', a: 'Prometheus recording rules: evaluated inside Prometheus at the configured interval. Pre-compute expensive PromQL queries and store the result as a new metric. Used to: reduce query load on dashboards and alerts. Create new aggregated metrics (per-job rate totals). The stored metric is available for all consumers (Grafana, Alertmanager, other Prometheus instances). Grafana recording rules: introduced in Grafana unified alerting. Evaluate a query against any Grafana data source and store the result. Useful for non-Prometheus data sources where recording rules are not available. Limitation: Grafana recording rules are less efficient than Prometheus recording rules because they run in Grafana rather than in the Prometheus server. Best practice: use Prometheus recording rules for Prometheus data sources. Use Grafana recording rules for other data sources (InfluxDB, SQL, CloudWatch) where Prometheus recording rules are not applicable.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Grafana visualises Prometheus/Loki/Tempo — RED dashboards (Rate, Errors, Duration), template variables, exemplars linking metrics to traces, unified alerting.',
  mustKnow: [
    'RED method: Rate (req/s), Errors (%), Duration (p99 ms) — the three panels every service dashboard needs',
    'Template variables ($service): one dashboard for all services — populated from label_values() query',
    'Exemplars: histogram data points carrying trace IDs — click ◆ to jump from metric spike to Tempo trace',
    'Annotations: mark deployments on all dashboards via Grafana API in CI/CD pipeline',
    'Unified alerting: PromQL condition → notification policy → contact points (PagerDuty, Slack)',
    'Dashboard JSON → store in Git, review like code, use Grafana provisioning to deploy',
  ],
  interviewFocus: [
    'What is the RED method for service dashboards?',
    'How do exemplars connect metrics to traces in Grafana?',
    'How do you handle alerting in Grafana — what are contact points and notification policies?',
  ],
};

@Component({
  selector: 'app-obs-grafana',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './grafana-dashboards.html',
  styleUrl: './grafana-dashboards.scss',
})
export class ObsGrafanaDashboards {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
