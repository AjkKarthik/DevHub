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
  selector: 'app-devops-logging',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './logging.html',
  styleUrl: './logging.scss'
})
export class DevopsLogging {

  quickRef: QuickRefItem[] = [
    { name: 'Structured logging', type: 'keyword', desc: 'Emit logs as JSON objects with consistent fields — machine-parseable vs plain text strings' },
    { name: 'Fluentd / Fluent Bit', type: 'keyword', desc: 'Log collection agents: Fluentd (full-featured, Ruby), Fluent Bit (lightweight, C) — read, filter, route logs' },
    { name: 'Logstash', type: 'keyword', desc: 'ELK stack log processor: parses, filters, enriches, and routes logs to Elasticsearch' },
    { name: 'Elasticsearch', type: 'keyword', desc: 'Distributed full-text search and analytics engine; stores and indexes logs for fast queries' },
    { name: 'Kibana', type: 'keyword', desc: 'Elasticsearch visualisation UI — dashboards, discover view, alerting, log search' },
    { name: 'Loki', type: 'keyword', desc: 'Grafana\'s log aggregation system; indexes only labels (like Prometheus), not log content — cheap storage' },
    { name: 'LogQL', type: 'keyword', desc: 'Loki query language: {app="myapp"} |= "error" | json | rate() — labels + filter + parser + metric' },
    { name: 'OpenTelemetry Logs', type: 'keyword', desc: 'OTLP log signal: vendor-neutral log format + collector; routes to any backend (Loki, Elastic, Datadog)' },
    { name: 'Correlation ID', type: 'keyword', desc: 'Unique request/trace ID propagated through all services and included in every log line for cross-service tracing' },
    { name: 'Log levels', type: 'keyword', desc: 'TRACE < DEBUG < INFO < WARN < ERROR < FATAL — only ERROR+ in prod by default; DEBUG via dynamic log level' },
    { name: 'Log retention', type: 'keyword', desc: 'Hot (fast, expensive) → Warm (compressed) → Cold (archival) tiering; compliance often requires 1–7 years' },
    { name: 'Azure Log Analytics (KQL)', type: 'keyword', desc: 'Azure\'s log store and query engine; KQL (Kusto) for analysis, dashboards, and alerts' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Structured logging — the foundation',
      points: [
        'Unstructured logs (plain text strings) are human-readable but machine-hostile: you cannot reliably filter, aggregate, or alert on fields without fragile regex parsing.',
        'Structured logs emit JSON (or another structured format): every field has a consistent key. { "level": "ERROR", "timestamp": "...", "message": "...", "requestId": "...", "userId": "...", "durationMs": 142 }',
        'Include these standard fields in every log line: timestamp (ISO 8601, UTC), level, message, service/app name, environment, correlation/trace ID, and any relevant domain context.',
        'Correlation IDs: generate a unique ID at the edge (API gateway, load balancer) and propagate it through all downstream service calls via HTTP headers (X-Correlation-Id, traceparent). Include it in every log line to reconstruct the full request flow.',
        'Use log levels correctly: DEBUG for developer diagnostics (off in prod), INFO for normal operations, WARN for recoverable issues, ERROR for failures that need attention, FATAL for unrecoverable crashes.',
      ]
    },
    {
      heading: 'The ELK / Elastic Stack',
      points: [
        'ELK: Elasticsearch (store + search) + Logstash (ingest + transform) + Kibana (visualise). Often extended to EFK with Fluentd or Filebeat instead of Logstash.',
        'Logstash pipeline: input (file, syslog, Kafka, Beats) → filter (grok parsing, JSON, geoip enrichment, field mutation) → output (Elasticsearch, S3, Kafka).',
        'Elasticsearch indexes log documents in time-based indices (logs-2025.06.01). Index lifecycle management (ILM) automatically moves indices from hot to warm to cold tiers and eventually deletes them.',
        'Filebeat / Metricbeat are lightweight Elastic agents that ship logs/metrics directly to Logstash or Elasticsearch without the Logstash middle layer — preferred for Kubernetes sidecar or DaemonSet deployments.',
        'Kibana Discover: ad-hoc log search with filters and time ranges. Dashboards: charts and tables for log analytics. Alerting: watch rules that fire on log patterns.',
      ]
    },
    {
      heading: 'Loki — Prometheus for logs',
      points: [
        'Loki indexes only log labels (app, namespace, pod), not the log content. Content is stored compressed as chunks. This makes Loki dramatically cheaper than Elasticsearch for raw storage.',
        'Trade-off: Loki is fast at label-based filtering but slower at full-text search across content. Use Elasticsearch for complex log analysis; Loki for operational log tailing and metric extraction.',
        'LogQL query: {app="myapp", namespace="production"} |= "error" | json | line_format "{{.message}}"',
        'Loki integrates natively with Grafana — the same Grafana that shows your Prometheus metrics can show correlated logs in the same dashboard, linked by labels.',
        'Promtail (Loki\'s agent): runs as a DaemonSet in Kubernetes, tails pod logs, attaches Kubernetes labels, and ships to Loki. Fluent Bit with Loki output is an alternative.',
      ]
    },
    {
      heading: 'Log collection pipeline in Kubernetes',
      points: [
        'Pod logs go to stdout/stderr — Kubernetes writes them to /var/log/pods/ on the node. A DaemonSet log agent (Fluent Bit, Fluentd, Filebeat) runs on every node and ships these files.',
        'Fluent Bit is the lightweight choice for Kubernetes: low memory footprint (~50MB), filters for Kubernetes metadata enrichment (pod name, namespace, labels), outputs to Loki/Elasticsearch/S3.',
        'Sidecar logging pattern: a separate container in the Pod tails application log files (when the app cannot write to stdout) and forwards them. More resource overhead than DaemonSet.',
        'Multi-line log handling: stack traces span multiple lines but appear as separate log events by default. Configure the agent to detect and concatenate multi-line patterns (Java stack traces, Python tracebacks).',
        'Log sampling: in very high-volume systems, logging every DEBUG line is impractical. Sample at the agent level (1 in 10 DEBUG lines) while keeping all WARN and ERROR lines.',
      ]
    },
    {
      heading: 'Log retention, cost, and compliance',
      points: [
        'Storage tiering: Hot (SSDs, fast queries, expensive) for 7–30 days; Warm (compressed, slower) for 30–90 days; Cold (object storage like S3/Azure Blob, very cheap) for years.',
        'Elasticsearch ILM policies automate the tier progression and delete old indices. Loki chunks are stored in object storage from day 0 — already cheap without explicit tiering.',
        'Compliance requirements: SOC 2, HIPAA, PCI DSS, and GDPR each specify minimum retention periods and access control requirements for audit logs. Typically 1–7 years.',
        'Never log PII (names, emails, passwords, card numbers, SSNs) or secrets in plain text. Use log scrubbing (masking or hashing sensitive fields at the agent level) or structured redaction.',
        'Log-based metrics: extract counters/gauges from log fields (Loki metric queries, Elasticsearch transforms, Datadog log-based metrics). Turns operational logs into alertable signals without code changes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fluent Bit + Loki (Kubernetes)',
      language: 'bash',
      code: `# ─── Fluent Bit ConfigMap for Kubernetes → Loki ──────────────────────────────

# apiVersion: v1
# kind: ConfigMap
# metadata:
#   name: fluent-bit-config
#   namespace: logging
# data:
#   fluent-bit.conf: |
#     [SERVICE]
#         Flush         5
#         Log_Level     info
#         Parsers_File  parsers.conf
#
#     [INPUT]
#         Name              tail
#         Path              /var/log/containers/*.log
#         Parser            docker
#         Tag               kube.*
#         Refresh_Interval  5
#         Mem_Buf_Limit     5MB
#
#     [FILTER]
#         Name                kubernetes
#         Match               kube.*
#         Merge_Log           On          # merge JSON from app logs into record
#         K8S-Logging.Parser  On          # honor pod annotation for parser
#         K8S-Logging.Exclude On          # honor pod annotation to exclude
#
#     [FILTER]
#         Name    grep
#         Match   kube.*
#         Exclude log /health    # drop noisy healthcheck logs
#
#     [OUTPUT]
#         Name            loki
#         Match           kube.*
#         Host            loki.logging.svc.cluster.local
#         Port            3100
#         Labels          job=fluentbit,namespace=\$kubernetes['namespace_name'],app=\$kubernetes['labels']['app']
#         Label_Keys      level,traceId
#         Auto_Kubernetes_Labels on

# ─── Fluent Bit DaemonSet (abbreviated) ──────────────────────────────────────

# apiVersion: apps/v1
# kind: DaemonSet
# metadata:
#   name: fluent-bit
#   namespace: logging
# spec:
#   selector:
#     matchLabels:
#       app: fluent-bit
#   template:
#     spec:
#       serviceAccountName: fluent-bit
#       containers:
#       - name: fluent-bit
#         image: fluent/fluent-bit:3.0
#         volumeMounts:
#         - name: varlog
#           mountPath: /var/log
#         - name: config
#           mountPath: /fluent-bit/etc/
#       volumes:
#       - name: varlog
#         hostPath: { path: /var/log }
#       - name: config
#         configMap: { name: fluent-bit-config }

# ─── LogQL queries in Grafana ─────────────────────────────────────────────────

# Show error logs for myapp in production
# {app="myapp", namespace="production"} |= "error" | json

# Error rate as metric (for Grafana panel)
# sum(rate({app="myapp"} |= "error" [5m])) by (namespace)

# Extract field from JSON and filter
# {app="myapp"} | json | durationMs > 1000 | line_format "slow: {{.requestId}} {{.durationMs}}ms"`,
    },
    {
      label: 'Structured Logging (.NET + Node.js)',
      language: 'bash',
      code: `# ─── .NET: Serilog structured logging ────────────────────────────────────────

# dotnet add package Serilog.AspNetCore
# dotnet add package Serilog.Sinks.Console
# dotnet add package Serilog.Sinks.Seq        # optional: Seq UI

# Program.cs
# Log.Logger = new LoggerConfiguration()
#     .MinimumLevel.Information()
#     .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
#     .Enrich.FromLogContext()
#     .Enrich.WithEnvironmentName()
#     .Enrich.WithMachineName()
#     .WriteTo.Console(new JsonFormatter())   // structured JSON to stdout
#     .WriteTo.Seq("http://seq:5341")         // optional Seq UI
#     .CreateLogger();
#
# builder.Host.UseSerilog();

# In a controller or service:
# _logger.LogInformation(
#     "Order placed {OrderId} for {CustomerId} total {Amount:F2}",
#     order.Id, order.CustomerId, order.Total);
#
# // Serilog captures orderId, customerId, amount as structured fields:
# // { "level":"Information","message":"Order placed ...","orderId":"ord-123","customerId":"cust-456","amount":99.99 }

# Middleware: enrich all logs with correlation ID
# app.Use(async (ctx, next) => {
#     var traceId = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault()
#                   ?? Activity.Current?.Id
#                   ?? Guid.NewGuid().ToString();
#     using (LogContext.PushProperty("traceId", traceId)) {
#         ctx.Response.Headers["X-Correlation-Id"] = traceId;
#         await next();
#     }
# });

# ─── Node.js: Pino structured logging ────────────────────────────────────────

# npm install pino pino-pretty

# import pino from 'pino';
# const logger = pino({
#   level: process.env.LOG_LEVEL ?? 'info',
#   base: {
#     service: 'order-service',
#     env: process.env.NODE_ENV,
#   },
#   timestamp: pino.stdTimeFunctions.isoTime,
# });
#
# // Structured log with context fields
# logger.info({ orderId: '123', userId: 'u-456', durationMs: 142 }, 'Order processed');
# // { "level": "info", "time": "2025-01-15T10:30:00.000Z", "service": "order-service",
# //   "orderId": "123", "userId": "u-456", "durationMs": 142, "msg": "Order processed" }
#
# // Child logger with bound context — all logs include these fields
# const reqLogger = logger.child({ requestId: req.headers['x-correlation-id'], method: req.method });
# reqLogger.warn({ statusCode: 429 }, 'Rate limit exceeded');

# ─── Azure: correlating logs via Application Insights ─────────────────────────

# Every request auto-gets an operation_Id (correlation ID)
# Custom properties are searchable in KQL:
# requests
# | where timestamp > ago(1h)
# | where customDimensions.orderId == "ord-123"
# | join kind=inner exceptions on operation_Id
# | project timestamp, name, outerMessage, customDimensions`,
    },
    {
      label: 'ELK Stack — Logstash Pipeline',
      language: 'bash',
      code: `# ─── Logstash pipeline config ─────────────────────────────────────────────────

# /etc/logstash/conf.d/app-logs.conf
#
# input {
#   beats {
#     port => 5044         # receive from Filebeat / Fluent Bit
#   }
#   kafka {
#     bootstrap_servers => "kafka:9092"
#     topics => ["app-logs"]
#     codec => json
#   }
# }
#
# filter {
#   # Parse JSON logs from containers
#   if [message] =~ /^\{/ {
#     json { source => "message" }
#   }
#
#   # Grok fallback for non-JSON (legacy apps)
#   else {
#     grok {
#       match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:msg}" }
#     }
#   }
#
#   # Enrich with GeoIP
#   if [clientIp] {
#     geoip { source => "clientIp" }
#   }
#
#   # Drop healthcheck noise
#   if [path] == "/healthz" {
#     drop {}
#   }
#
#   # Mask sensitive fields
#   mutate {
#     gsub => ["message", "password=[^\\s]+", "password=***REDACTED***"]
#   }
#
#   # Parse timestamp
#   date {
#     match => ["timestamp", "ISO8601"]
#     target => "@timestamp"
#   }
# }
#
# output {
#   elasticsearch {
#     hosts => ["https://elasticsearch:9200"]
#     index => "logs-%{[kubernetes][namespace]}-%{+YYYY.MM.dd}"
#     user => "\${ES_USER}"
#     password => "\${ES_PASSWORD}"
#     ssl => true
#   }
#   # Sidecar: send errors to separate high-priority index
#   if [level] == "ERROR" {
#     elasticsearch {
#       hosts => ["https://elasticsearch:9200"]
#       index => "errors-%{+YYYY.MM.dd}"
#     }
#   }
# }

# ─── Elasticsearch ILM Policy (hot-warm-cold-delete) ─────────────────────────

# PUT _ilm/policy/logs-policy
# {
#   "policy": {
#     "phases": {
#       "hot":    { "actions": { "rollover": { "max_age": "1d", "max_size": "50gb" } } },
#       "warm":   { "min_age": "7d",  "actions": { "shrink": { "number_of_shards": 1 }, "forcemerge": { "max_num_segments": 1 } } },
#       "cold":   { "min_age": "30d", "actions": { "freeze": {} } },
#       "delete": { "min_age": "90d", "actions": { "delete": {} } }
#     }
#   }
# }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Logging unstructured plain text strings',
      wrong: `logger.info("User " + userId + " placed order " + orderId + " for £" + total);
// Log: "User u-123 placed order ord-456 for £99.99"
// Searching by userId requires regex: /User u-123/`,
      right: `logger.info({ userId, orderId, totalGbp: total }, "Order placed");
// Log: { "level":"info","userId":"u-123","orderId":"ord-456","totalGbp":99.99,"msg":"Order placed" }
// Searching by userId: { app="myapp" } | json | userId="u-123"`,
      explanation: 'Structured logs emit machine-readable fields alongside the message. This enables exact-match filtering (userId = "u-123"), numeric range queries (durationMs > 1000), aggregations, and alerting — all without fragile regex. Use JSON formatters in Serilog, Pino, Logback, or Zap.',
    },
    {
      title: 'Logging sensitive data in plain text',
      wrong: `logger.info(\`Login attempt: email=\${email} password=\${password}\`);
logger.debug(\`JWT token: \${jwtToken}\`);`,
      right: `logger.info({ email: maskEmail(email) }, "Login attempt");
// maskEmail("user@example.com") → "u***@example.com"
// Never log passwords, tokens, card numbers, SSNs, or raw PII`,
      explanation: 'Logs are stored long-term and accessible to anyone with log access. Logging passwords, JWT tokens, API keys, or raw PII is a security incident waiting to happen. Mask or hash sensitive values before logging, and add Logstash/Fluent Bit filter rules as a defence-in-depth layer.',
    },
    {
      title: 'No correlation ID across services',
      wrong: `// Service A
logger.info("Processing payment");
// Service B
logger.info("Sending email");
// No way to know which A log relates to which B log`,
      right: `// Edge/gateway: generate and propagate
const correlationId = req.headers['x-correlation-id'] ?? crypto.randomUUID();
res.setHeader('x-correlation-id', correlationId);
// Service A
logger.info({ correlationId }, "Processing payment");
// Service B (received correlationId in header)
logger.info({ correlationId }, "Sending email");
// Now both logs share the same correlationId — searchable across services`,
      explanation: 'Without a correlation ID, debugging a multi-service request requires timing-based log archaeology. Generate a unique ID at the entry point (API gateway, ingress), pass it as a request header (X-Correlation-Id, traceparent), and include it in every log line throughout the call chain.',
    },
    {
      title: 'Using DEBUG log level in production',
      wrong: `// appsettings.Production.json
{
  "Serilog": {
    "MinimumLevel": "Debug"  // logs everything — huge volume, cost, noise
  }
}`,
      right: `// appsettings.Production.json — INFO minimum, specific namespaces overridden
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    }
  }
}
// For live debugging: use dynamic log level endpoint or feature flag`,
      explanation: 'DEBUG in production generates 10–100× more log volume, inflating storage costs and burying important events in noise. Set minimum level to INFO (or WARN) in production. Use dynamic log level APIs (ASP.NET Core /loglevel, Log4j JMX, Pino runtime) to temporarily enable DEBUG for a specific service without redeployment.',
    },
    {
      title: 'Logging every request body and response',
      wrong: `app.use((req, res, next) => {
  logger.debug({ body: req.body, headers: req.headers }, "Request received");
  // Logs full request body including passwords, tokens, credit card numbers
  next();
});`,
      right: `app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    correlationId: req.headers['x-correlation-id'],
    userAgent: req.headers['user-agent'],
    // Never log: req.body, Authorization header, Cookie header
  }, "Request received");
  next();
});`,
      explanation: 'Request bodies often contain passwords (login), payment details, or session tokens. Response bodies may contain PII. Log metadata (method, path, status code, duration, correlation ID) not payload content. If you need payload debugging, use a dedicated trace system (Jaeger, Tempo) with appropriate sampling, not logs.',
    },
  ];

  challenge: Challenge = {
    title: 'Log Line Analyser',
    language: 'typescript',
    description: `Parse an array of structured log lines (JSON strings) and produce a summary report.

Each log line is a JSON string with these fields: level, message, durationMs (optional), userId (optional), statusCode (optional).

Return a report:
{
  total: number,
  byLevel: Record<string, number>,       // count per level
  errorMessages: string[],               // messages where level === 'ERROR' or 'FATAL'
  slowRequests: number,                  // lines where durationMs > 1000
  uniqueUsers: number,                   // count of distinct userId values (exclude undefined/null)
  hasSensitiveData: boolean              // true if any message contains 'password', 'token', or 'secret' (case-insensitive)
}`,
    hints: [
      'JSON.parse() each line to get the object; wrap in try/catch in case a line is malformed.',
      'Use a Set to collect unique userIds — Set.size gives the count.',
      'String.prototype.toLowerCase() + includes() for case-insensitive sensitive-data check.',
      'Filter for errorMessages using level === "ERROR" || level === "FATAL".',
    ],
    starterCode: `interface LogLine {
  level: string;
  message: string;
  durationMs?: number;
  userId?: string;
  statusCode?: number;
}

interface LogReport {
  total: number;
  byLevel: Record<string, number>;
  errorMessages: string[];
  slowRequests: number;
  uniqueUsers: number;
  hasSensitiveData: boolean;
}

function analyselogs(lines: string[]): LogReport {
  // TODO: parse and analyse the log lines
  return { total: 0, byLevel: {}, errorMessages: [], slowRequests: 0, uniqueUsers: 0, hasSensitiveData: false };
}

const logs = [
  '{"level":"INFO","message":"User logged in","userId":"u-1","durationMs":45}',
  '{"level":"ERROR","message":"Database connection failed","durationMs":5001}',
  '{"level":"WARN","message":"Rate limit approaching","userId":"u-2","statusCode":429}',
  '{"level":"INFO","message":"password=abc123 found in config","userId":"u-1"}',
  '{"level":"FATAL","message":"Out of memory","durationMs":0}',
  '{"level":"INFO","message":"Order placed","userId":"u-3","durationMs":1200}',
  'not valid json',
];

console.log(analyselogsog(logs));`,
    solution: `interface LogLine {
  level: string;
  message: string;
  durationMs?: number;
  userId?: string;
  statusCode?: number;
}

interface LogReport {
  total: number;
  byLevel: Record<string, number>;
  errorMessages: string[];
  slowRequests: number;
  uniqueUsers: number;
  hasSensitiveData: boolean;
}

function analyselogs(lines: string[]): LogReport {
  const byLevel: Record<string, number> = {};
  const errorMessages: string[] = [];
  const userIds = new Set<string>();
  let slowRequests = 0;
  let hasSensitiveData = false;
  let total = 0;
  const sensitivePattern = /password|token|secret/i;

  for (const line of lines) {
    let parsed: LogLine;
    try {
      parsed = JSON.parse(line) as LogLine;
    } catch {
      continue; // skip malformed lines
    }
    total++;

    byLevel[parsed.level] = (byLevel[parsed.level] ?? 0) + 1;

    if (parsed.level === 'ERROR' || parsed.level === 'FATAL') {
      errorMessages.push(parsed.message);
    }
    if (parsed.durationMs !== undefined && parsed.durationMs > 1000) {
      slowRequests++;
    }
    if (parsed.userId) {
      userIds.add(parsed.userId);
    }
    if (sensitivePattern.test(parsed.message)) {
      hasSensitiveData = true;
    }
  }

  return { total, byLevel, errorMessages, slowRequests, uniqueUsers: userIds.size, hasSensitiveData };
}

const logs = [
  '{"level":"INFO","message":"User logged in","userId":"u-1","durationMs":45}',
  '{"level":"ERROR","message":"Database connection failed","durationMs":5001}',
  '{"level":"WARN","message":"Rate limit approaching","userId":"u-2","statusCode":429}',
  '{"level":"INFO","message":"password=abc123 found in config","userId":"u-1"}',
  '{"level":"FATAL","message":"Out of memory","durationMs":0}',
  '{"level":"INFO","message":"Order placed","userId":"u-3","durationMs":1200}',
  'not valid json',
];

console.log(analyselogs(logs));
// { total: 6, byLevel: { INFO: 3, ERROR: 1, WARN: 1, FATAL: 1 },
//   errorMessages: ['Database connection failed', 'Out of memory'],
//   slowRequests: 2, uniqueUsers: 3, hasSensitiveData: true }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary advantage of structured (JSON) logging over plain text logging?',
      options: [
        'JSON logs are smaller in bytes than plain text logs',
        'JSON logs can be read by humans but not machines',
        'Fields are consistently named and machine-parseable — enabling exact filtering, aggregation, and alerting without regex',
        'JSON logs automatically encrypt sensitive data',
      ],
      answer: 2,
      explanation: 'Plain text strings require fragile regex to extract fields. JSON logs expose every field with a consistent key — log aggregators can index them, query engines can filter them (userId = "u-123"), and alerting rules can aggregate them (count ERROR per service). This is the foundation of modern observability.',
    },
    {
      q: 'What is the key architectural difference between Loki and Elasticsearch for log storage?',
      options: [
        'Loki stores logs in relational tables; Elasticsearch uses documents',
        'Loki indexes only labels (metadata), not log content; Elasticsearch indexes the full log text — making Loki much cheaper but slower at full-text search',
        'Elasticsearch can only store logs for 7 days; Loki has no retention limit',
        'Loki requires Kubernetes; Elasticsearch runs anywhere',
      ],
      answer: 1,
      explanation: 'Elasticsearch inverted-indexes every token in every log line — powerful full-text search but storage-intensive. Loki only indexes the labels attached to log streams (like Prometheus labels), storing content as compressed chunks in object storage. Loki is much cheaper for high-volume log ingestion but lacks Elasticsearch\'s full-text search capability.',
    },
    {
      q: 'Why is a correlation ID essential in a microservices architecture?',
      options: [
        'It encrypts the log payload before transmission',
        'It prevents duplicate log entries from multiple service instances',
        'It links log lines from multiple services that handled the same user request — enabling end-to-end request tracing across services',
        'It compresses logs to reduce storage cost',
      ],
      answer: 2,
      explanation: 'In a microservices system, a single user request touches 5–10 services. Without a correlation ID, you cannot tell which logs from Service B relate to a specific request in Service A. Generate a UUID at the API gateway, propagate it in X-Correlation-Id headers, and include it in every log line — then a single search finds the complete call chain.',
    },
    {
      q: 'What should be the minimum log level in production and why?',
      options: [
        'TRACE — capture everything for maximum visibility',
        'DEBUG — developers need detailed logs to diagnose production issues',
        'INFO (or WARN) — DEBUG/TRACE generate excessive volume, cost, and noise',
        'FATAL — only log unrecoverable errors to keep costs minimal',
      ],
      answer: 2,
      explanation: 'DEBUG generates 10–100× more log events than INFO. In high-traffic production systems, this dramatically inflates log storage costs and buries important events in noise. Use INFO minimum; override specific noisy frameworks to WARNING. Enable DEBUG dynamically (without restarts) via dynamic log-level endpoints when diagnosing a specific issue.',
    },
    {
      q: 'What is Elasticsearch Index Lifecycle Management (ILM) used for?',
      options: [
        'Managing user access permissions to indices',
        'Automatically moving indices through hot → warm → cold → delete tiers based on age or size to control storage costs',
        'Replicating indices across availability zones for high availability',
        'Compressing index mappings to reduce memory usage',
      ],
      answer: 1,
      explanation: 'ILM automates the data tier progression: hot (fast SSDs, frequent queries) → warm (compressed, less frequent) → cold (frozen, rare queries) → delete. For example: roll over at 50GB or 1 day, move to warm after 7 days, freeze after 30 days, delete after 90. This keeps query performance high on recent data while controlling storage costs for older logs.',
    },
    {
      q: 'What is log sampling and when should you use it?',
      options: [
        'Randomly deleting log entries to save space',
        'Only logging a percentage of requests — e.g. 10% of debug logs — to reduce volume while preserving statistical patterns for high-traffic services',
        'Sampling is only for metrics, not logs',
        'Logging every 10th error to prevent log flooding'],
      answer: 1,
      explanation: 'At 100K req/s, logging every request at DEBUG level generates ~1TB/day — prohibitively expensive. Log sampling logs a configurable percentage of traces (e.g., 1% of normal traffic, 100% of errors). The sampled data provides statistically representative insights. Always sample on trace ID so all spans of a sampled trace are kept together. Libraries like OpenTelemetry SDK support head-based and tail-based sampling.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Fluentd and Fluent Bit?',
      a: 'Both are open-source log collectors from the Fluent project. Fluent Bit is written in C, has a tiny footprint (~1MB binary, ~50MB memory), and is ideal as a Kubernetes DaemonSet or sidecar for log collection and basic filtering. Fluentd is written in Ruby, much heavier, but supports 500+ plugins for complex transformations, routing, and output targets. Common pattern: Fluent Bit collects and forwards to Fluentd (aggregator) which handles complex processing and routes to Elasticsearch/Loki/S3.',
    },
    {
      q: 'What is the OpenTelemetry Logs signal and why does it matter?',
      a: 'OpenTelemetry defines three observability signals: Traces, Metrics, and Logs. The Logs signal uses the OpenTelemetry Protocol (OTLP) — a vendor-neutral format for structured log records. The OTel Collector receives logs via OTLP and routes them to any backend (Loki, Elasticsearch, Datadog, Splunk). This matters because it decouples your application from the observability backend — change from Elasticsearch to Loki without touching application code. SDKs for .NET, Java, Python, Node.js all support OTLP log export.',
    },
    {
      q: 'How do you handle multi-line logs (like Java stack traces) in Kubernetes?',
      a: 'Kubernetes writes each stdout line as a separate log record. A Java stack trace spanning 20 lines becomes 20 separate log events. Solutions: (1) Configure your app to emit the entire stack trace as a single-line JSON log with a "stack_trace" field (the best approach — structured logging at source). (2) Configure the log agent (Fluent Bit multiline filter, Logstash multiline codec) with a pattern like "starts with a timestamp" to detect new log events and concatenate orphaned lines into the previous record. Option 1 is always preferable.',
    },
    {
      q: 'How do you debug a production issue in real time with Loki?',
      a: 'Use Grafana Explore mode with the Loki datasource and add -follow to live-tail: {app="myapp", namespace="production"} |= "error". You can narrow by label values, filter by string patterns (|= "userId"), parse JSON fields (| json | durationMs > 500), and use the line_format template to reshape output. For correlating with traces, copy the traceId from a log line and paste it into Grafana Tempo. For correlating with metrics, switch to the Prometheus datasource in the same time window.',
    },
    {
      q: 'What KQL query finds all exceptions for a specific operation in Azure Application Insights?',
      a: 'exceptions | where timestamp > ago(1h) | where operation_Name == "POST /api/orders" | project timestamp, outerMessage, details, operation_Id, user_Id | order by timestamp desc. To correlate with the request: exceptions | join kind=inner (requests | where name == "POST /api/orders") on operation_Id | project timestamp, outerMessage, resultCode, duration, user_Id. The operation_Id is Application Insights\' correlation ID — it links requests, dependencies, traces, and exceptions from the same logical operation.',
    },
    {
      q: 'What log retention strategy should you implement and what factors determine retention period?',
      a: 'Log retention is a balance of cost, compliance, and operational need. Factors: (1) Compliance — HIPAA (6 years), PCI-DSS (1 year minimum), SOC 2 (typically 90 days to 1 year). Security audit logs often need longer retention than application logs. (2) Incident investigation — most production incidents are diagnosed from logs in the last 30–90 days. (3) Cost — hot storage (searchable) is expensive; tiered retention is common. Implementation: 7 days hot (immediate search), 30–90 days warm (slower but still searchable), 1+ year cold (S3 Glacier/Azure Archive, retrieval in hours). Compression and indexing reduce costs significantly — JSON logs compress 5–10×. Set up lifecycle policies in your logging platform (Datadog retention policies, CloudWatch log group retention) to auto-delete or archive.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Emit structured JSON logs with correlation IDs, collect via Fluent Bit, aggregate in Loki or Elasticsearch, and query in Grafana or Kibana for correlated observability.',
    mustKnow: [
      'Structured logging: emit JSON with consistent field names (level, timestamp, message, traceId, userId) — not plain text strings',
      'Correlation ID: generate at ingress, propagate in X-Correlation-Id header, include in every log line across all services',
      'Fluent Bit DaemonSet: collects Kubernetes pod logs, enriches with K8s metadata labels, routes to Loki/Elasticsearch',
      'Loki: indexes labels only (cheap), stores content as compressed chunks; fast label filtering, slow full-text search',
      'ELK: Logstash pipelines (input → filter → output), ILM for hot-warm-cold-delete tiering',
      'Never log passwords, tokens, or raw PII; use DEBUG minimum in prod or dynamic log level APIs',
      'Multi-line logs: emit as single-line JSON at source (best), or use agent multiline filter (second best)',
    ],
    interviewFocus: [
      'What is structured logging and why is it better than string concatenation?',
      'How does a correlation ID enable end-to-end request tracing across microservices?',
      'What is the difference between Loki and Elasticsearch — when would you use each?',
      'Walk through a Kubernetes log pipeline: from pod stdout to Grafana query',
    ],
  };
}
