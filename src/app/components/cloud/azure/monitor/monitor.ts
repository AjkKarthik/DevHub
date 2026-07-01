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
  selector: 'app-azure-monitor',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './monitor.html',
  styleUrl: './monitor.scss'
})
export class AzureMonitor {

  quickRef: QuickRefItem[] = [
    { name: 'Azure Monitor', type: 'type', desc: 'Platform-level observability — collects metrics and logs from all Azure resources. Hub for Metrics Explorer, Log Analytics, Alerts, and Dashboards.' },
    { name: 'Log Analytics Workspace', type: 'type', desc: 'Centralised log store. Resources send diagnostic logs here. Query with KQL (Kusto Query Language). Retention: 30–730 days.' },
    { name: 'Application Insights', type: 'type', desc: 'APM (Application Performance Monitoring) — SDK-based traces, dependency tracking, live metrics, distributed tracing, and failure analysis.' },
    { name: 'KQL', type: 'type', desc: 'Kusto Query Language — used in Log Analytics and Application Insights. SQL-like syntax for querying telemetry: project, summarize, extend, join, render.' },
    { name: 'Alert Rule', type: 'type', desc: 'Fires when a condition is met (metric threshold, log query result, activity log event). Triggers an Action Group (email, webhook, Azure Function, ITSM).' },
    { name: 'Action Group', type: 'type', desc: 'Reusable set of notification/automation actions triggered by an alert: email, SMS, voice, webhook, Azure Function, Logic App, ITSM connector.' },
    { name: 'Distributed Tracing', type: 'type', desc: 'End-to-end transaction trace across multiple services using correlation IDs (W3C TraceContext). App Insights aggregates spans into a unified transaction map.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Azure Monitor Architecture',
      points: [
        'Azure Monitor is the umbrella observability platform. It collects: Metrics (numerical time-series — CPU%, request rate), Logs (structured/unstructured events in Log Analytics Workspace), Activity Log (subscription-level audit — who did what to which resource), and Resource Logs (diagnostic logs from specific services).',
        'Data sources: Azure resources emit metrics automatically (platform metrics — no configuration needed). Resource logs (diagnostic logs) must be enabled via Diagnostic Settings → route to Log Analytics Workspace, Event Hub, or Storage. Application telemetry requires Application Insights SDK.',
        'Metrics are stored in Azure Monitor Metrics (time-series DB, 93-day retention, fine granularity). Logs go to Log Analytics Workspace (KQL queryable, configurable 30–730 day retention, longer with data archiving). Metrics are cheaper for alerting on simple thresholds.',
        'Azure Monitor Workbooks: interactive dashboards combining metrics charts, log query results, parameters, and text. Shareable and parameterisable. Great for SRE runbooks, performance summaries, and cost views.',
        'Data Collection Rules (DCR): define what data to collect from where and where to route it. More granular than Diagnostic Settings — filter by log category, transform data, split to multiple destinations. Used by the Azure Monitor Agent (replacing MMA/OMS agents).',
      ]
    },
    {
      heading: 'Application Insights',
      points: [
        'Application Insights is an APM service for web applications. It collects: requests (HTTP), dependencies (SQL, HTTP calls, Redis), exceptions, traces (custom logs), page views (browser SDK), and custom events/metrics.',
        'Instrumentation: add the SDK package (Microsoft.ApplicationInsights.AspNetCore for .NET, applicationinsights for Node.js) and set the Connection String. Auto-instrumentation is available for App Service, AKS, Azure Functions — no code change required, just enable in the portal.',
        'Distributed tracing: App Insights uses W3C TraceContext (traceparent header) to correlate spans across services. A single user request generates one operation ID; all spans (API call → database → downstream service) are linked under that ID and visualised in the Transaction Search and Application Map.',
        'Live Metrics Stream: real-time view of requests, failures, dependencies, CPU, memory — streaming from all connected instances with <1 second latency. Useful for monitoring during a deployment or diagnosing a live incident.',
        'Smart Detection: ML-based anomaly detection that alerts on unusual failure rate increases, response time degradation, and memory leak patterns. No configuration required — Smart Detection rules activate automatically after enough baseline data is collected.',
      ]
    },
    {
      heading: 'KQL Queries & Log Analytics',
      points: [
        'KQL (Kusto Query Language) is the query language for Log Analytics. Basic structure: TableName | operator1 | operator2. Key operators: where (filter), project (select columns), extend (add computed columns), summarize (aggregate), join (combine tables), render (chart type).',
        'Common tables: requests (App Insights HTTP), dependencies (outbound calls), exceptions (unhandled errors), traces (custom logs), customEvents (trackEvent calls), performanceCounters (CPU/memory from agents), AzureMetrics (platform metrics routed to workspace).',
        'Time range: KQL queries default to the portal-selected time range. Use | where TimeGenerated > ago(1h) to filter. TimeGenerated is the standard timestamp field in all Monitor tables.',
        'Summarize aggregations: count(), avg(), max(), min(), percentile(column, 95), dcount() (distinct count), make_list() (collect into array). Group by one or more columns: | summarize count() by ResultCode, bin(TimeGenerated, 5m).',
        'Alerts: Log Alert rules run KQL queries on a schedule (1–60 minute evaluation frequency). If the query returns rows (or result exceeds threshold), the alert fires. Use | summarize count() > 0 pattern to detect any occurrence of an error condition.',
      ]
    },
    {
      heading: 'Alerts & Action Groups',
      points: [
        'Alert rule types: Metric alerts (fast, stateless — fires when metric crosses threshold), Log Search alerts (KQL query result triggers — more flexible, higher latency), Activity Log alerts (ARM operations — e.g. "VM deleted"), and Smart Detection (App Insights ML alerts).',
        'Action Groups define what happens when an alert fires: Email/SMS/Voice (direct notification), Webhook (call an HTTP endpoint — Slack, PagerDuty), Azure Function (run serverless logic), Logic App (complex workflow), ITSM connector (ServiceNow, Jira). One Action Group can be reused across many alert rules.',
        'Alert severity levels: Sev 0 (Critical) → Sev 4 (Verbose). Severity is informational — it does not change how alerts fire or what actions execute, but it helps triage. Sev 0 and 1 typically page on-call; Sev 2+ may just email.',
        'Dynamic thresholds for metric alerts: instead of a static threshold, Azure Monitor learns the normal pattern of a metric (seasonality, day-of-week variation) and alerts on deviations. Reduces false positives for metrics with natural variation.',
        'Alert processing rules: suppress alerts during maintenance windows, or add action groups to alert patterns without modifying individual alert rules. Useful for scheduled maintenance (on-call holiday suppression) and alert routing (route prod alerts to different teams than staging alerts).',
      ]
    },
    {
      heading: 'Metrics vs. Logs — Different Storage and Query Models',
      points: [
        'Azure Monitor Metrics are lightweight, numerical time-series data stored in a specialized time-series database, optimized for near-real-time alerting and dashboarding with very low query latency — ideal for high-frequency data like CPU percentage or request count.',
        'Azure Monitor Logs (backed by Log Analytics) store rich, structured event data queryable via Kusto Query Language (KQL), enabling complex correlation and analysis (like joining application logs with infrastructure events) that simple metric time-series cannot express.',
        'Metrics-based alerts fire faster (often within a minute) than log-based alerts, which depend on log ingestion latency and the query execution schedule — this latency difference matters when choosing which system to alert on for time-critical issues.',
        'Sending the same signal to both systems unnecessarily doubles cost and storage — the choice should be driven by whether the data is genuinely a simple numeric metric best suited for fast alerting, or rich structured data that benefits from KQL\'s query flexibility.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Diagnostic Settings & Alerts',
      language: 'bash',
      code: `# Create Log Analytics Workspace
az monitor log-analytics workspace create \\
  --workspace-name my-laws --resource-group my-rg \\
  --location eastus --retention-time 90

LAWS_ID=$(az monitor log-analytics workspace show \\
  --workspace-name my-laws --resource-group my-rg \\
  --query id -o tsv)

# Enable Diagnostic Settings on an App Service (send logs to workspace)
az monitor diagnostic-settings create \\
  --name appservice-diag \\
  --resource $(az webapp show --name my-app --resource-group my-rg --query id -o tsv) \\
  --workspace $LAWS_ID \\
  --logs '[{"category":"AppServiceHTTPLogs","enabled":true},{"category":"AppServiceConsoleLogs","enabled":true}]' \\
  --metrics '[{"category":"AllMetrics","enabled":true}]'

# Create metric alert — fire when HTTP 5xx > 10 in 5 minutes
az monitor metrics alert create \\
  --name high-5xx-alert --resource-group my-rg \\
  --scopes $(az webapp show --name my-app -g my-rg --query id -o tsv) \\
  --condition "count Http5xx > 10" \\
  --window-size 5m --evaluation-frequency 1m \\
  --severity 1 \\
  --action-group /subscriptions/<subId>/resourceGroups/my-rg/providers/microsoft.insights/actionGroups/on-call

# Create Action Group with email notification
az monitor action-group create \\
  --name on-call --resource-group my-rg \\
  --short-name oncall \\
  --email-receiver name=SRE email=sre-team@example.com`
    },
    {
      label: 'KQL Queries',
      language: 'bash',
      code: `# Run KQL query via CLI against Log Analytics
az monitor log-analytics query \\
  --workspace $LAWS_ID \\
  --analytics-query '
requests
| where TimeGenerated > ago(1h)
| where resultCode >= 500
| summarize count() by resultCode, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
'

# Top 10 slowest requests in last 24h
az monitor log-analytics query \\
  --workspace $LAWS_ID \\
  --analytics-query '
requests
| where TimeGenerated > ago(24h)
| top 10 by duration desc
| project timestamp, name, duration, resultCode, cloud_RoleName
'

# Exceptions grouped by problem ID (smart deduplication)
az monitor log-analytics query \\
  --workspace $LAWS_ID \\
  --analytics-query '
exceptions
| where TimeGenerated > ago(24h)
| summarize count(), sample = any(outerMessage) by problemId
| order by count_ desc
| take 20
'

# Dependency failures (outbound HTTP/SQL calls that failed)
az monitor log-analytics query \\
  --workspace $LAWS_ID \\
  --analytics-query '
dependencies
| where TimeGenerated > ago(1h) and success == false
| summarize count() by target, type, resultCode
| order by count_ desc
'`
    },
    {
      label: 'App Insights SDK (TypeScript)',
      language: 'typescript',
      code: `import { TelemetryClient } from 'applicationinsights';

// Initialize (usually done once at app start)
// Set APPLICATIONINSIGHTS_CONNECTION_STRING env var
import * as appInsights from 'applicationinsights';
appInsights.setup().setAutoCollectRequests(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectExceptions(true)
  .start();

const client = appInsights.defaultClient;

// Track a custom event
client.trackEvent({
  name: 'UserCheckout',
  properties: { userId: '123', cartTotal: '49.99', currency: 'USD' }
});

// Track a custom metric
client.trackMetric({
  name: 'QueueDepth',
  value: 42
});

// Track an exception with context
try {
  await processOrder(orderId);
} catch (err) {
  client.trackException({
    exception: err as Error,
    properties: { orderId, userId }
  });
  throw err;
}

// Manual dependency tracking (for libraries without auto-instrumentation)
const start = Date.now();
const result = await callExternalApi();
client.trackDependency({
  target: 'external-api.example.com',
  name: 'GET /api/prices',
  data: 'GET /api/prices?productId=abc',
  duration: Date.now() - start,
  resultCode: result.status,
  success: result.status < 400,
  dependencyTypeName: 'HTTP'
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not enabling Diagnostic Settings on Azure resources',
      wrong: `# Created App Service / Key Vault / SQL — no diagnostic settings configured`,
      right: `az monitor diagnostic-settings create --name diag --resource <id> --workspace $LAWS_ID --logs '[...]'`,
      explanation: 'Platform metrics are collected automatically, but resource logs (App Service HTTP logs, Key Vault audit logs, SQL query logs, etc.) are not sent anywhere by default. Enable Diagnostic Settings on each resource to route logs to Log Analytics Workspace. Without this, you cannot query logs, investigate incidents, or set up log-based alerts.'
    },
    {
      title: 'Using Connection String instead of APPLICATIONINSIGHTS_CONNECTION_STRING environment variable',
      wrong: `appInsights.setup('InstrumentationKey=abc123')  // Hardcoded ikey in source`,
      right: `// Set APPLICATIONINSIGHTS_CONNECTION_STRING env var; SDK picks it up automatically`,
      explanation: 'Hardcoding the instrumentation key or connection string in source code leaks it to version control and makes rotating the key difficult. Set APPLICATIONINSIGHTS_CONNECTION_STRING as an environment variable (App Service app setting, Key Vault Reference). The SDK discovers it automatically. The Connection String (not just the ikey) is required from 2025 onwards as standalone ikey ingestion is being retired.'
    },
    {
      title: 'Creating metric alerts without configuring evaluation frequency and window',
      wrong: `az monitor metrics alert create --condition "avg Percentage CPU > 80"  # Default window may miss spikes`,
      right: `az monitor metrics alert create --condition "avg Percentage CPU > 80" --window-size 5m --evaluation-frequency 1m`,
      explanation: 'Without explicit window and frequency settings, Azure uses defaults that may be too coarse for your scenario (e.g., a 5-minute spike averaged over a 1-hour window never triggers). Set window-size (how much history to average) and evaluation-frequency (how often to check). For latency-sensitive alerts, use 1m/1m; for noisy metrics, use 5m/5m to avoid alert fatigue.'
    },
    {
      title: 'Running expensive KQL queries with no time filter in production Log Analytics',
      wrong: `requests | where resultCode == "500" | count  // Scans all data since workspace creation`,
      right: `requests | where TimeGenerated > ago(1h) | where resultCode == "500" | count`,
      explanation: 'Log Analytics charges per GB of data queried. A query without a TimeGenerated filter scans the entire retention window (up to 730 days) — massively expensive and slow. Always filter by time first: | where TimeGenerated > ago(1h). This is also the most effective query optimisation in KQL — time filters use the table\'s index.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse Application Insights request telemetry',
    language: 'typescript',
    description: 'Application Insights request telemetry looks like:\n{ name: "GET /api/users", duration: 245, resultCode: "200", success: true, timestamp: "2025-01-15T10:30:00Z" }\n\nWrite summariseRequests(requests: RequestTelemetry[]): { totalCount: number; errorCount: number; errorRate: number; avgDuration: number; p95Duration: number } where errorRate is 0–1 and p95Duration is the 95th percentile duration.',
    hints: [
      'errorCount = requests where success === false',
      'errorRate = errorCount / totalCount',
      'avgDuration = sum of durations / totalCount',
      'p95: sort durations ascending, take index Math.ceil(0.95 * n) - 1',
    ],
    starterCode: `interface RequestTelemetry {
  name: string; duration: number;
  resultCode: string; success: boolean; timestamp: string;
}

export function summariseRequests(requests: RequestTelemetry[]): {
  totalCount: number; errorCount: number; errorRate: number;
  avgDuration: number; p95Duration: number;
} {
  return { totalCount: 0, errorCount: 0, errorRate: 0, avgDuration: 0, p95Duration: 0 };
}`,
    solution: `interface RequestTelemetry {
  name: string; duration: number;
  resultCode: string; success: boolean; timestamp: string;
}

export function summariseRequests(requests: RequestTelemetry[]): {
  totalCount: number; errorCount: number; errorRate: number;
  avgDuration: number; p95Duration: number;
} {
  if (requests.length === 0) return { totalCount: 0, errorCount: 0, errorRate: 0, avgDuration: 0, p95Duration: 0 };
  const totalCount = requests.length;
  const errorCount = requests.filter(r => !r.success).length;
  const avgDuration = requests.reduce((s, r) => s + r.duration, 0) / totalCount;
  const sorted = [...requests].map(r => r.duration).sort((a, b) => a - b);
  const p95Duration = sorted[Math.ceil(0.95 * totalCount) - 1];
  return { totalCount, errorCount, errorRate: errorCount / totalCount, avgDuration, p95Duration };
}`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between Azure Monitor Metrics and Logs?',
      options: [
        'Metrics are for applications; Logs are for infrastructure',
        'Metrics are numerical time-series stored 93 days; Logs are structured events in Log Analytics queryable with KQL',
        'Metrics require the App Insights SDK; Logs are automatic',
        'They are the same — "Metrics" and "Logs" are marketing names for the same data'
      ],
      answer: 1,
      explanation: 'Metrics are lightweight numerical time-series (CPU%, request count, latency percentiles) stored in the Azure Monitor Metrics store for 93 days — fast and cheap for threshold-based alerting. Logs are structured events (request details, exceptions, custom traces) stored in Log Analytics Workspace — queryable with KQL, configurable 30–730 day retention, more powerful but more expensive and slower for alerts.'
    },
    {
      q: 'What configuration is required before resource diagnostic logs appear in Log Analytics?',
      options: [
        'Install the Azure Monitor Agent on every VM',
        'Enable Diagnostic Settings on each resource, routing log categories to the Log Analytics Workspace',
        'Enable Application Insights on the subscription',
        'Log Analytics automatically collects all resource logs without configuration'
      ],
      answer: 1,
      explanation: 'Platform metrics are collected automatically. But resource diagnostic logs (App Service HTTP logs, Key Vault audit logs, SQL query store, NSG flow logs, etc.) must be explicitly routed via Diagnostic Settings. For each resource, configure which log categories to collect and where to send them (Log Analytics Workspace, Event Hub for streaming, or Storage for archiving).'
    },
    {
      q: 'What does the KQL operator `summarize` do?',
      options: [
        'Sorts the result set in ascending order',
        'Aggregates rows and groups by specified columns (count, avg, max, percentile)',
        'Joins two tables on a common key',
        'Filters rows based on a condition'
      ],
      answer: 1,
      explanation: 'summarize aggregates data: requests | summarize count(), avg(duration) by resultCode produces one row per resultCode with count and average duration. It is equivalent to SQL\'s GROUP BY with aggregate functions. Common aggregations: count(), avg(), max(), min(), percentile(col, 95), dcount() (distinct count), make_list() (collect values into array).'
    },
    {
      q: 'What is an Action Group in Azure Monitor?',
      options: [
        'A group of alert rules that fire together',
        'A reusable set of notification and automation actions (email, webhook, Function) triggered when an alert fires',
        'A collection of diagnostic settings applied to multiple resources',
        'A KQL query template shared across multiple log alert rules'
      ],
      answer: 1,
      explanation: 'An Action Group is a reusable collection of actions that execute when an alert fires: email/SMS notifications, webhooks (Slack, PagerDuty), Azure Functions (custom logic), Logic Apps (complex workflows), and ITSM connectors (ServiceNow, Jira). One Action Group can be attached to many alert rules — change the Action Group to update what all those alerts do at once.'
    },
    {
      q: 'What is distributed tracing in Application Insights?',
      options: [
        'Tracing CPU usage across multiple VMs in a scale set',
        'End-to-end correlation of spans across multiple services using a shared operation ID (W3C TraceContext)',
        'A feature that traces memory allocations in .NET applications',
        'Azure Monitor\'s ability to replay historical traffic for debugging'
      ],
      answer: 1,
      explanation: 'Distributed tracing links all the work done across services for a single user request using a correlation ID (operation_Id). App Insights propagates W3C traceparent headers between services. When you look up a request in Transaction Search, you see the full chain: frontend request → API call → database dependency → downstream service call — all as a waterfall timeline, even across separate App Insights resources.'
    },
    {
      q: 'What is a Log Analytics workspace in Azure Monitor?',
      options: [
        'A storage account specifically for diagnostic logs',
        'A centralised repository where Azure Monitor collects, stores, and queries log and metric data using KQL',
        'A dashboard for visualising Azure metrics in real time',
        'An alerting engine that sends notifications to action groups',
      ],
      answer: 1,
      explanation: 'A Log Analytics workspace is the data store for Azure Monitor Logs. Resources send diagnostic data there; you query it using Kusto Query Language (KQL) for troubleshooting, alerting, and insights.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Application Insights and Log Analytics?',
      a: '<strong>Application Insights</strong> is an APM service for web applications — it collects structured telemetry (requests, dependencies, exceptions, traces, custom events) via an SDK or auto-instrumentation. It has purpose-built UIs (Application Map, Transaction Search, Failures, Performance blades) and smart detection. Under the hood, App Insights data lands in a <strong>Log Analytics Workspace</strong> (the tables: requests, dependencies, exceptions, traces, customEvents). Log Analytics is the general-purpose log store and query engine (KQL) that App Insights, Activity Log, Diagnostic Settings, and other sources all funnel into. You can query App Insights data directly in Log Analytics.'
    },
    {
      q: 'How do you correlate logs across multiple microservices in App Insights?',
      a: 'App Insights uses the W3C TraceContext standard. Each incoming request gets an <strong>operation_Id</strong> (trace ID) and <strong>operation_ParentId</strong> (span ID). When your service calls a downstream service, it propagates the traceparent header — the downstream service associates its telemetry with the same operation_Id. In Log Analytics: <code>union requests, dependencies, exceptions | where operation_Id == "abc123"</code> shows all telemetry for that request across services. In the portal, Transaction Search or the Application Map visualises the full distributed trace as a waterfall. For Node.js, HTTP clients with the App Insights SDK auto-propagate headers. For manual SDK calls, use client.getCorrelationContext().'
    },
    {
      q: 'What is the Log Analytics data retention cost model?',
      a: 'Log Analytics charges two ways: <strong>ingestion cost</strong> (per GB of data ingested — Basic tier is cheaper, no query capability; Analytics tier is queryable) and <strong>retention cost</strong> (first 30 days free for Analytics tier; days 31–730 charged per GB per day). Configure retention per table in DCR: keep hot data (requests, exceptions) for 90 days queryable, then archive to cheaper storage. Use Commitment Tiers (reserve 100+ GB/day) for predictable discounts over pay-as-you-go. Monitor ingestion with usage query: <code>Usage | summarize sum(Quantity) by DataType</code>.'
    },
    {
      q: 'What are Azure Monitor Workbooks and when should you use them?',
      a: '<strong>Workbooks</strong> are interactive reports combining metrics charts, KQL query results, text, parameters (dropdowns, time ranges), and links. They are stored as Azure resources and can be shared across teams. Use cases: (1) SRE runbooks — live operational data alongside troubleshooting steps. (2) Performance dashboards — latency percentiles, error rates, throughput over time. (3) Cost and usage reports — which services consume the most data. (4) Security audits — sign-in failures, RBAC changes, Key Vault access logs. Workbooks are parameterisable (filter by subscription, resource group, time range) making them reusable templates.'
    },
    {
      q: 'How do you avoid alert fatigue in Azure Monitor?',
      a: 'Alert fatigue (too many noisy alerts) leads teams to ignore alerts — exactly when real incidents are missed. Mitigations: (1) <strong>Dynamic thresholds</strong> on metric alerts — learn normal patterns and alert on deviations, reducing false positives for metrics with natural variation. (2) <strong>Alert suppression</strong> via Alert Processing Rules during maintenance windows. (3) <strong>Severity routing</strong> — Sev 0/1 pages on-call immediately, Sev 2/3 sends email only. (4) <strong>Multi-condition alerts</strong> — fire only when multiple metrics breach simultaneously (CPU high AND error rate high). (5) <strong>Alert deduplication</strong> — aggregation period prevents the same condition from firing repeatedly within a window.'
    },
    {
      q: 'Why do metric-based alerts typically fire faster than log-based alerts for the same underlying condition?',
      a: 'Platform metrics are collected and made available near-instantly (often within 1-3 minutes) as pre-aggregated time-series data specifically optimized for fast querying and alerting, and metric alert rules can evaluate on a schedule as tight as every 1 minute. Log-based alerts instead run a KQL query against the Log Analytics workspace on a schedule (as infrequent as every 5-15 minutes for cost/performance reasons), and there is additional ingestion latency (often several minutes) between an event occurring and it becoming queryable in Logs at all — so even with identical detection logic, a metric alert on CPU% will typically fire noticeably sooner than a log alert querying the equivalent data from ingested logs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Monitor is the observability platform — platform metrics are automatic, resource logs require Diagnostic Settings to Log Analytics, and Application Insights adds SDK-based APM with distributed tracing and smart detection.',
    mustKnow: [
      'Platform metrics: automatic 93-day retention. Resource logs: need Diagnostic Settings to route to Log Analytics',
      'App Insights: requests, dependencies, exceptions, traces, customEvents — SDK or auto-instrumentation',
      'KQL time filter first: | where TimeGenerated > ago(1h) — uses index, reduces cost and scan time',
      'Distributed tracing: operation_Id correlates all spans across services via W3C traceparent header',
      'Action Groups: reusable notification/automation (email, webhook, Function) attached to alert rules',
      'Dynamic thresholds: ML-learned baseline reduces false positives on seasonally variable metrics',
    ],
    interviewFocus: [
      'What is the difference between Azure Monitor Metrics and Log Analytics Logs?',
      'How does distributed tracing work across microservices in Application Insights?',
      'What configuration is needed before resource logs appear in Log Analytics?',
      'How do you write a KQL query to find the top 10 slowest API endpoints in the last hour?',
    ],
  };
}
