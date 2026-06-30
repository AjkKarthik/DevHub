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
  { name: 'Structured log',  type: 'keyword', desc: 'JSON or key=value log line with consistent fields — queryable without regex. Opposite of free-text log strings.' },
  { name: 'Log level',       type: 'keyword', desc: 'Severity: DEBUG < INFO < WARN < ERROR < FATAL. Production default: INFO. Increase to DEBUG dynamically for specific services.' },
  { name: 'Correlation ID',  type: 'keyword', desc: 'Unique ID per request, propagated across services and logged on every line — enables cross-service log correlation without traces.' },
  { name: 'Child logger',    type: 'keyword', desc: 'Logger with pre-set fields (userId, requestId). All messages from the child inherit the fields — avoids repetition.' },
  { name: 'Log context',     type: 'keyword', desc: 'AsyncLocalStorage (Node.js) stores per-request fields (traceId, userId) accessible anywhere in the async call chain without prop-drilling.' },
  { name: 'Pino',            type: 'keyword', desc: 'Fastest Node.js JSON logger — logs NDJSON, minimal overhead, compatible with pino-pretty for dev, Loki/ELK for production.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why Structured Logging?',
    points: [
      'Free-text logs are written for humans to read. Structured logs are written for machines to query. In production with millions of log lines per minute, you query — not read — logs.',
      'Structured (JSON) logs have consistent field names: `{"level":"error","message":"Payment failed","userId":"u123","orderId":"o456","traceId":"abc","durationMs":145}`. You can query `{userId="u123"}` in Loki in milliseconds.',
      'Free-text logs require fragile regex. `grep "Payment failed.*u123"` breaks the moment someone changes the log message wording. Field-based queries are stable.',
      'Structured logs enable metrics from logs: count log lines with `level=error` per service, extract latency from `durationMs` fields, build dashboards from log data without instrumenting additional metrics.',
    ],
  },
  {
    heading: 'Essential Log Fields',
    points: [
      'Required on every log line: `timestamp` (ISO 8601), `level` (info/warn/error), `message` (human-readable summary), `service` (which service emitted this), `traceId` (W3C trace context or correlation ID).',
      'Request context (add on every HTTP request log): `method`, `path`, `statusCode`, `durationMs`, `requestId`.',
      'User context (when applicable): `userId`, `sessionId`. Be careful with PII — mask or hash if required by data protection regulations.',
      'Error context: `errorCode`, `errorMessage`, `stack` (in development; consider stripping in production to avoid exposing internals). Use a consistent error schema.',
    ],
  },
  {
    heading: 'Log Levels in Practice',
    points: [
      'DEBUG: detailed diagnostic information — method entry/exit, intermediate values. Too noisy for production. Enable per-service dynamically via feature flag or config reload.',
      'INFO: normal business events — user logged in, order placed, background job started/finished. One or two lines per major user action. The baseline production level.',
      'WARN: unexpected but handled situation — retry succeeded after 1 failure, configuration missing (using default), deprecated API called. Does not require immediate action.',
      'ERROR: failed operation requiring investigation — payment failed, database unavailable, unhandled exception. Should trigger a ticket at minimum; page for sustained error rates.',
    ],
  },
  {
    heading: 'Async Context Propagation',
    points: [
      'The challenge: in Node.js, an HTTP handler spawns async operations (DB query, external API call). How does the DB query log know the requestId from the original HTTP handler?',
      'Naive solution: pass logger as a parameter to every function. Works but couples all code to the logging interface and requires threading logger through every call.',
      'Better: AsyncLocalStorage (Node.js 16+). Create a storage store per request in middleware. Any async code in the same request call chain can access the stored traceId/userId/requestId without parameters.',
      'Pino child loggers: create a child logger per request with `logger.child({ traceId, requestId, userId })`. The child inherits all parent fields and adds its own. Pass the child logger in the request context object.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Pino Setup',
    language: 'typescript',
    code: `import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';
import express from 'express';

// ── ASYNC CONTEXT STORAGE ────────────────────────────────────────
interface RequestContext {
  traceId: string;
  requestId: string;
  userId?: string;
}
const asyncStorage = new AsyncLocalStorage<RequestContext>();

// ── BASE LOGGER (production: JSON to stdout, dev: pretty-print) ──
const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // In production: no prettyPrint — JSON NDJSON for Loki/ELK
  // In dev: pipe to pino-pretty: | npx pino-pretty
  base: {
    service: process.env.SERVICE_NAME ?? 'api',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.creditCard'],
    censor: '[REDACTED]',
  },
});

// ── CONTEXT-AWARE LOGGER ─────────────────────────────────────────
// Retrieves the per-request child logger from AsyncLocalStorage
export function getLogger() {
  const ctx = asyncStorage.getStore();
  if (ctx) {
    return logger.child(ctx);
  }
  return logger;
}

// ── REQUEST MIDDLEWARE ────────────────────────────────────────────
export function loggingMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const traceId = req.headers['traceparent'] as string ?? crypto.randomUUID();
  const requestId = crypto.randomUUID();

  const ctx: RequestContext = { traceId, requestId };

  asyncStorage.run(ctx, () => {
    const start = Date.now();
    const log = getLogger();

    log.info({ method: req.method, path: req.path }, 'Request started');

    res.on('finish', () => {
      log.info(
        { method: req.method, path: req.path, statusCode: res.statusCode, durationMs: Date.now() - start },
        'Request completed',
      );
    });

    next();
  });
}

// ── IN BUSINESS CODE — no logger parameter needed ─────────────────
async function processOrder(orderId: string) {
  const log = getLogger(); // picks up traceId, requestId from async context
  log.info({ orderId }, 'Processing order');
  // Logs: {"level":"info","traceId":"abc","requestId":"xyz","orderId":"o123","msg":"Processing order"}
}`,
  },
  {
    label: 'Log Schema',
    language: 'typescript',
    code: `// Consistent log schema — define and enforce across all services
interface LogFields {
  // Always present
  timestamp: string;    // ISO 8601: "2024-01-15T14:32:11.123Z"
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;      // "order-service"
  version: string;      // "2.1.0"
  env: string;          // "production"

  // Request context (added by middleware)
  traceId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;

  // User context (added when authenticated)
  userId?: string;

  // Error context (added on errors)
  errorCode?: string;
  errorMessage?: string;
  // stack only in development — omit in production
}

// Example well-structured log line:
const exampleLog: LogFields = {
  timestamp: '2024-01-15T14:32:11.123Z',
  level: 'error',
  message: 'Payment declined',
  service: 'order-service',
  version: '2.1.0',
  env: 'production',
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  requestId: '7c3a4b5d-1234-...',
  method: 'POST',
  path: '/orders',
  statusCode: 402,
  durationMs: 234,
  userId: 'usr_42',
  errorCode: 'PAYMENT_DECLINED',
  errorMessage: 'Insufficient funds',
};

// Loki query for all errors for a user:
// {service="order-service"} | json | level="error" | userId="usr_42"
// Grafana filters by any field — no regex required`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Logging sensitive data in plain text',
    wrong: `logger.info(\`User \${user.email} logged in with password \${password}\`);
logger.error(\`Payment failed for card \${card.number} CVV \${card.cvv}\`);
// Credit card numbers, passwords, tokens in logs = PII/PCI violation
// Searchable forever in your log aggregation system`,
    right: `logger.info({ userId: user.id }, 'User logged in'); // never email/password
logger.error({
  userId: user.id,
  paymentProvider: 'stripe',
  errorCode: err.code,
  // card number NEVER logged — only last 4 digits if needed
  cardLast4: card.number.slice(-4),
}, 'Payment failed');
// Use pino's redact option to auto-mask fields`,
    explanation: 'Logs are typically searchable by all engineers and may be retained for years. Logging passwords, credit card numbers, SSNs, or full email addresses violates PCI-DSS, GDPR, and SOC 2. Log only identifiers (userId, orderId) and non-sensitive fields. Use pino\'s `redact` config to automatically mask sensitive field paths.',
  },
  {
    title: 'Using console.log() in production instead of a structured logger',
    wrong: `console.log('Order placed: ' + orderId + ' for user ' + userId);
// Output: "Order placed: o123 for user u456"
// Cannot query: {userId="u456"} — it's inside a string
// No log level — cannot filter by severity
// No timestamp in consistent format
// No service name`,
    right: `logger.info({ orderId, userId }, 'Order placed');
// Output: {"level":"info","time":"2024-01-15T...","orderId":"o123","userId":"u456","msg":"Order placed","service":"order-service"}
// Queryable by any field in Loki/ELK`,
    explanation: 'console.log() produces unstructured text — no consistent fields, no log level, no service name. You cannot reliably filter or query it. Replace all console.log/console.error calls with a structured logger (Pino, Winston). The message argument should be a short static string; variable data goes in a fields object as the first argument.',
  },
  {
    title: 'Logging at DEBUG level in production',
    wrong: `// LOG_LEVEL=debug in production
// Emits 100× more log lines than INFO
// Storage costs 10× higher
// Log queries slow down — too much data
// Sensitive data in debug logs may leak to engineers who shouldn't see it`,
    right: `// Default: LOG_LEVEL=info in production
// Support dynamic log level changes without restart:
app.post('/admin/log-level', auth, (req, res) => {
  logger.level = req.body.level; // change to 'debug' for 5 mins, then back
  setTimeout(() => { logger.level = 'info'; }, 5 * 60 * 1000);
  res.json({ level: logger.level });
});`,
    explanation: 'DEBUG logs can be 10-100× more verbose than INFO logs. In production with high traffic, this means dramatically higher storage costs and slower queries. Set LOG_LEVEL=info in production. For debugging specific incidents, implement dynamic log level changes via an admin endpoint (with authentication) that reverts automatically after a timeout.',
  },
  {
    title: 'Not including durationMs in request logs',
    wrong: `res.on('finish', () => {
  logger.info({ method: req.method, path: req.path, status: res.statusCode }, 'Request completed');
  // No timing → cannot identify slow requests from logs
  // Cannot compute latency SLIs from log data
  // Cannot correlate with trace spans for verification`,
    right: `const startMs = Date.now();
res.on('finish', () => {
  logger.info({
    method: req.method, path: req.path, statusCode: res.statusCode,
    durationMs: Date.now() - startMs, // always include
  }, 'Request completed');
});
// Grafana Loki: {service="api"} | json | durationMs > 500
// → find all slow requests in logs`,
    explanation: 'Without durationMs in request logs, you cannot identify slow requests from log data alone. Including request duration lets you compute latency percentiles from logs (useful when metrics are unavailable), filter for slow requests in Loki, and cross-reference with trace spans to verify timing accuracy. Always start a timer at request start and log the duration on finish.',
  },
];

const challenge: Challenge = {
  title: 'Build a structured logger',
  language: 'typescript',
  description: `Implement a Logger class with:
- constructor(baseFields: Record<string, unknown>)
- child(fields: Record<string, unknown>): Logger (new instance inheriting all base + extra fields)
- log(level: string, message: string, fields?: Record<string, unknown>): string
  → returns JSON string: { ...baseFields, ...fields, level, message, timestamp: 'ISO' }

The timestamp field should be the string 'ISO' (we use a fixed value for testability).`,
  hints: ['child() merges parent fields + new fields', 'log() merges all fields into one JSON object'],
  starterCode: `class Logger {
  constructor(private baseFields: Record<string, unknown>) {}

  child(fields: Record<string, unknown>): Logger {
    return new Logger({});
  }

  log(level: string, message: string, fields: Record<string, unknown> = {}): string {
    return '';
  }
}

const base = new Logger({ service: 'api', env: 'prod' });
const req = base.child({ traceId: 'abc', userId: 'u1' });
console.log(req.log('info', 'Order placed', { orderId: 'o1' }));
// {"service":"api","env":"prod","traceId":"abc","userId":"u1","orderId":"o1","level":"info","message":"Order placed","timestamp":"ISO"}`,
  solution: `class Logger {
  constructor(private baseFields: Record<string, unknown>) {}

  child(fields: Record<string, unknown>): Logger {
    return new Logger({ ...this.baseFields, ...fields });
  }

  log(level: string, message: string, fields: Record<string, unknown> = {}): string {
    return JSON.stringify({
      ...this.baseFields,
      ...fields,
      level,
      message,
      timestamp: 'ISO',
    });
  }
}

const base = new Logger({ service: 'api', env: 'prod' });
const req = base.child({ traceId: 'abc', userId: 'u1' });
console.log(req.log('info', 'Order placed', { orderId: 'o1' }));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key advantage of structured (JSON) logs over free-text logs in production?',
    options: [
      'JSON logs are smaller than text logs, reducing storage costs significantly',
      'Structured logs have consistent field names that can be queried precisely (e.g., {userId="u123"}) without fragile regex',
      'JSON is the only log format supported by Kubernetes and cloud providers',
      'Structured logs automatically redact sensitive data like passwords and credit card numbers',
    ],
    answer: 1,
    explanation: 'The primary advantage is queryability. Free-text logs require regex that breaks when the message wording changes. Structured logs have consistent fields (userId, traceId, orderId) that can be queried precisely in Loki, Elasticsearch, or CloudWatch Logs Insights without regex. This turns a 30-minute log grep session into a 30-second query.',
  },
  {
    q: 'Why should the `message` field in a structured log be a short static string, with variable data in separate fields?',
    options: [
      'Log aggregation systems have a 100-character limit on message fields',
      'A static message string allows log aggregation systems to group similar events; variable data in fields enables precise filtering and metric extraction',
      'Dynamic message strings cause JSON serialisation errors in Pino and Winston',
      'Static messages use less CPU to format than template literals with variable substitution',
    ],
    answer: 1,
    explanation: 'If you write `message: "Order o123 placed by user u456"`, every order creates a unique message string — Loki cannot group all order placement events. With `message: "Order placed"` (static) and `{ orderId: "o123", userId: "u456" }` (fields), you can query `msg="Order placed"` to see all orders, then filter by `orderId` for specific orders. Consistent static messages enable grouping, rate counting, and alerting by log event type.',
  },
  { q: 'What is structured logging and what are its advantages over unstructured logging?', options: ['Structured logging is logging to a database instead of a flat file', 'Structured logging emits log entries as machine-parseable key-value pairs (typically JSON) where each field has a defined name and type, enabling efficient filtering, aggregation, and search without regex parsing', 'Structured logging uses a strict schema that must be approved by the database team before use', 'Structured logging is only necessary for systems that process more than 1 million log lines per day'], answer: 1, explanation: 'Unstructured logging: printf-style free-form text. Example: ERROR 2024-01-15 12:34:56 — Failed to process order 456 for user 123 — ValidationError: Invalid amount. Parsing requires fragile regex. Cannot efficiently filter by user or order. No consistent schema across services. Structured logging: a JSON log entry contains discrete fields such as level, timestamp, message, orderId, userId, errorType, errorDetail — each separately addressable. Filter by userId=123 using an index. Aggregate by errorType across all services. Join with traces via traceId field. Consistent schema enables cross-service queries. Advantages: log aggregation systems (Elasticsearch, Loki) can index specific fields. Dashboards can filter, aggregate, and visualize structured data without complex parsing. A query like find all order failures for user 123 of type ValidationError in the last hour is a single indexed query rather than a multi-pass regex scan.' },
  { q: 'What is a log aggregation pipeline and how does it work?', options: ['A log aggregation pipeline is a Kubernetes CronJob that merges log files from multiple pods into a single file', 'A log aggregation pipeline collects logs from multiple sources, ships them to a central store such as Elasticsearch or Loki, and indexes them for search and analysis across all services', 'Log aggregation applies only to application logs; infrastructure logs are managed separately by cloud providers', 'A log aggregation pipeline is an ETL process that converts JSON logs to CSV format for storage in a data warehouse'], answer: 1, explanation: 'Log aggregation pipeline components: Collection — Kubernetes: kubelet writes pod stdout/stderr to files on the node. DaemonSet log collectors (Fluentbit, Promtail, Filebeat) run on each node to tail these files. Non-Kubernetes: Fluentd or Filebeat agents run on VMs to tail application log files. Shipping: logs sent over the network to the aggregation backend. May include transformation (format conversion, field enrichment). Storage: Elasticsearch and Kibana (ELK stack) — full-text search, complex aggregations, more expensive at scale. Grafana Loki — label-based indexing, significantly cheaper storage, queries use LogQL. Splunk — enterprise-grade with powerful SPL query language. AWS CloudWatch Logs — managed, integrated with AWS services. Analysis: query language to filter, search, and aggregate. Dashboards showing error counts and request rates from log data. Alerting on log patterns such as spiking error rates.' },
  { q: 'What are the key fields every structured log entry should contain?', options: ['Only the error message and stack trace are required; other fields are optional and should be added only when debugging', 'Every log entry should contain timestamp (ISO 8601), log level, service name, trace ID for correlation, and a descriptive message; most entries should also include relevant entity IDs such as userId and orderId', 'The exact fields depend entirely on the logging framework; there is no universal standard for structured log fields', 'Only timestamp and message are required; all other fields add overhead and should be avoided in production'], answer: 1, explanation: 'Required structured log fields: timestamp in ISO 8601 with millisecond precision and UTC timezone — enables chronological ordering and time-range filtering. level (ERROR, WARN, INFO, DEBUG) — enables filtering by severity. service (the service name, e.g., order-service) — essential when querying across multiple services. message — a human-readable description; should be consistent for the same event type (use string constants, not dynamic interpolation). traceId and spanId — distributed tracing context; essential for correlating logs to traces and across services. environment (prod, staging, dev) — prevents mixing environments in searches. Situational fields to add when relevant: userId, orderId, requestId, errorType, errorCode, durationMs, httpMethod, httpPath, httpStatusCode. Anti-patterns: never include passwords, tokens, full SQL queries with data, or PII without explicit privacy review.' },
  { q: 'How does log sampling differ from log filtering and when should you use each?', options: ['Log sampling and log filtering are synonyms; both reduce log volume by discarding some log lines', 'Log filtering permanently discards log entries matching a condition (such as removing all DEBUG logs); log sampling probabilistically keeps a representative fraction of logs (such as 1% of INFO logs), preserving statistical representation of behavior', 'Log sampling is only applicable to error logs; log filtering applies to all log levels', 'Log filtering is preferred for cost reduction; log sampling should never be used in production because it loses data'], answer: 1, explanation: 'Log filtering: discard all logs matching a condition. Filter out DEBUG logs in production. Filter out health check request logs (200 OK on /health every 5 seconds adds no value). Filter out logs from non-critical internal operations. When to use: when a log type adds no diagnostic value. Log sampling: probabilistically retain a fraction of a log type. Keep 1% of INFO-level request logs for a high-traffic endpoint. Keep 100% of ERROR logs. Keep 10% of WARN logs. When to use: when a log type has value but the full volume is cost-prohibitive. Sampling preserves statistical validity — you can estimate the true count from the sample. Caution: sampling loses individual events. If you sample 1% of request logs, you cannot find the specific request from a particular user in the 99% that were dropped. Only sample when individual event retrieval is not needed. Head-based: random at ingestion time. Tail-based: keep the log only if certain conditions are met after the fact.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do I propagate request context (traceId, userId) to every function in Node.js without passing it as a parameter?',
    a: 'Use <strong>AsyncLocalStorage</strong> (Node.js 16+, built-in `async_hooks` module). In your HTTP middleware, create a request context object and run all downstream code inside `asyncStorage.run(ctx, () => next())`. Any async code in the same async chain — including promise callbacks, setTimeout, EventEmitter handlers — can call `asyncStorage.getStore()` to retrieve the context. Create a `getLogger()` function that retrieves the store and returns a child logger with the context fields pre-set. This gives every function in the async call chain access to traceId/userId without any parameter threading. The store is automatically cleaned up when the async context exits.',
  },
  {
    q: 'Should I log errors with full stack traces in production?',
    a: 'Conditional: log stack traces in production for unexpected errors, but be careful. <strong>Log stack traces for</strong>: unhandled exceptions, unexpected internal errors, database connection failures. These are high-value for debugging. <strong>Omit stack traces for</strong>: expected business errors (PaymentDeclinedError, ValidationError) — the errorCode and message is enough; logging 50 lines of stack per declined payment fills your logs with noise. <strong>Security concern</strong>: stack traces can expose internal file paths, library versions, and code structure. Consider logging the full stack to a separate high-privilege log stream and only the error message + code to the application log. In practice: log stacks for 5xx errors, suppress for 4xx errors. Use `err.stack` in the log fields object, not as part of the message string.',
  },
  { q: 'How do you implement structured logging in .NET with Serilog?', a: 'Serilog setup in .NET: install packages — Serilog.AspNetCore, Serilog.Sinks.Console, Serilog.Sinks.Elasticsearch or Serilog.Sinks.Grafana.Loki. Configure in Program.cs using the fluent builder: create a LoggerConfiguration that enriches from log context and machine name, writes to Console with a JSON formatter, and writes to Elasticsearch or Loki. Use structured message templates rather than string interpolation. Correct: logger.Information passing the template string Order {OrderId} processed for user {UserId} in {DurationMs}ms along with the actual values as separate arguments. Serilog creates a structured log entry with OrderId, UserId, and DurationMs as discrete indexed fields. Wrong: using string interpolation inside the template — this creates a flat string and loses the structured fields. Log context enrichment: push properties into the logging context using LogContext.PushProperty within a using block. All log lines emitted inside the block automatically include the pushed property. OpenTelemetry integration: install the Serilog OTel logging bridge package to automatically inject TraceId and SpanId from the active OTel context into every log entry.' },
  { q: 'How do you query structured logs efficiently in Grafana Loki?', a: 'Loki query language (LogQL): label filtering (fast, uses index): select logs using a label selector in curly braces specifying service name and environment. This uses the Loki index and is the fastest query type. Pattern filtering (slower, scans log lines): after the label selector, pipe the results through string filters such as |= to match lines containing a substring, or != to exclude lines. Parse and filter on JSON fields: pipe through the json parser, then filter on a specific JSON field value such as userId or orderId. Rate queries: count ERROR log lines per second per service using count_over_time within the rate function. Aggregation: count total validation errors in the last hour using count_over_time over a 1-hour window. Effective Loki schema: use labels for low-cardinality fields (service, environment, cluster, pod). Put high-cardinality values (userId, orderId) in the JSON body, not as labels. Labels with high cardinality create too many Loki streams and degrade performance. Query those fields via JSON parsing instead. Performance: label-only queries with no JSON parsing are fastest. Keep the label set small and consistent across all services.' },
  { q: 'What is log normalization and why is it important in a multi-service environment?', a: 'Log normalization: standardizing log field names and formats across all services so logs from different services can be queried with the same field names. Problem without normalization: service A logs with a field called ts, service B calls it time, service C calls it timestamp. To search for errors across all services, you need three different field names for the same concept. Similarly: service A uses lvl, service B uses level, service C uses severity. Solution: define an organization-wide logging standard with canonical field names such as timestamp, level, message, service, traceId, spanId, environment. Enforcement strategies: provide a shared logging library that emits canonical fields automatically. All services use this library rather than configuring the logging framework directly. Or: use a Fluentbit transformation pipeline to normalize field names at the collection layer — rename non-standard fields to canonical names before shipping to the central store. Benefits: a single query finds errors across all services without per-service customization. Dashboards work for all services from a generic template. On-call engineers can investigate any service without learning its unique log schema.' },
  { q: 'How do you handle sensitive data in structured logs?', a: 'Sensitive data categories: authentication credentials (passwords, API keys, tokens). Payment data (card numbers, CVVs, bank accounts). PII (names, emails, SSNs, government IDs). Health information (PHI in regulated industries). Prevention strategies: logging standards document — explicitly list forbidden fields. Never log fields named password, token, secret, key, cvv, or ssn. Structured log sanitization: create a sanitize function that redacts sensitive fields before logging. Apply it to any object being logged. Type-safe wrappers: create specific log parameter types that only expose safe fields. Rather than logging an entire User object, log a UserLogView with only id and role. Request/response body logging: never log full HTTP bodies in production. If body logging is needed for debugging, require explicit opt-in with automatic expiration and access controls. Automated detection: add Semgrep rules to the CI pipeline that flag logging calls where the argument name matches sensitive field patterns. Data masking: for fields that are partially useful (last 4 digits of card number, first 3 characters of email), implement masking in the log serializer. Audit log separation: some PII must be logged for compliance. Store audit logs in a separate access-controlled store with stricter retention and access policies.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Structured JSON logs with traceId + userId + durationMs on every request. Pino + AsyncLocalStorage for context propagation. Static messages, variable data in fields.',
  mustKnow: [
    'Structured (JSON) logs = queryable by field. Free-text = fragile regex. Always use structured logging in production.',
    'Required fields: timestamp, level, message (static), service, traceId on every log line',
    'AsyncLocalStorage: propagate request context (traceId, userId) to any async call without parameter threading',
    'Pino child logger: base.child({ traceId, requestId }) — child inherits all parent fields automatically',
    'Log level: DEBUG (too noisy for prod) → INFO (default) → WARN (degraded) → ERROR (alert-worthy)',
    'Never log passwords, card numbers, tokens — use pino redact or manual masking. Log only identifiers.',
  ],
  interviewFocus: [
    'Why is structured logging better than console.log() in production?',
    'How do you propagate request context across async boundaries in Node.js without parameter drilling?',
    'What fields should every production log line include?',
  ],
};

@Component({
  selector: 'app-obs-structured-logging',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './structured-logging.html',
  styleUrl: './structured-logging.scss',
})
export class ObsStructuredLogging {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
