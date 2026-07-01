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
  { name: 'Log fatigue',    type: 'keyword', desc: 'Too many low-quality logs that engineers learn to ignore — the precursor to missing real incidents buried in noise.' },
  { name: 'Log contract',   type: 'keyword', desc: 'Team agreement on which events to log, at which level, with which fields. Prevents inconsistent logging across services.' },
  { name: 'Audit log',      type: 'keyword', desc: 'Immutable record of security-relevant actions (login, permission change, data export). Separate from application logs, high retention.' },
  { name: 'Error taxonomy', type: 'keyword', desc: 'Categorising errors as expected (4xx) vs unexpected (5xx) to ensure the right log level is used and the right alerts fire.' },
  { name: 'Log enrichment', type: 'keyword', desc: 'Adding context at shipping time (K8s node name, region, deploy SHA) without changing application code.' },
  { name: 'Idempotent log', type: 'keyword', desc: 'A log that is safe to emit multiple times — deduplication at query time. Important for retry-heavy event processors.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What to Log and What Not to Log',
    points: [
      'Log: state transitions (order created, payment processed, job started/finished), significant failures (unhandled exception, third-party API error), security events (login, permission denied), and performance outliers (query took > 1s).',
      'Do NOT log: every function entry/exit (use tracing instead), successful cache hits (metric counter instead), healthy health check responses, and anything containing PII or secrets.',
      'The test: "Would I want to see this in a 3am incident?" If yes, log it. If the answer is "this is just background noise", it\'s either a metric or should not be logged.',
      'One log per request completion (at INFO), not per operation step. Use traces for operation-level detail. The worst pattern: 50 log lines for a single API request that is actually healthy.',
    ],
  },
  {
    heading: 'Error Taxonomy and Log Levels',
    points: [
      'Expected errors (4xx): user submitted invalid data, resource not found, payment declined. These are business errors, not system failures. Log at WARN — they don\'t need engineer attention.',
      'Unexpected errors (5xx): unhandled exception, database unreachable, third-party timeout. Log at ERROR — these need investigation.',
      'The mistake is logging all errors at ERROR level. If 90% of your ERROR logs are "user not found" (expected), engineers tune out all ERROR logs — including the real ones.',
      'Panics/crashes: log at FATAL (if your logger has it) or ERROR with a `fatal: true` field. These should also trigger a process restart and a page.',
    ],
  },
  {
    heading: 'Audit Logging',
    points: [
      'Audit logs are a separate concern from application logs. They record: who (user/service) did what (action) on which resource (object) at what time, with what result (success/failure).',
      'Audit logs must be immutable — once written, never deleted or modified. They are evidence in security investigations and compliance audits. Never co-mingle audit logs with application logs in the same stream.',
      'Required fields: `actor` (userId/serviceId), `action` (LOGIN, DATA_EXPORT, PERMISSION_GRANT), `resource` (resourceType + resourceId), `timestamp`, `result` (success/failure), `ip`, `userAgent`.',
      'Retention for audit logs is typically much longer (7 years for financial compliance, 90 days minimum for SOC 2) and access should be restricted to security team and auditors.',
    ],
  },
  {
    heading: 'Operational Log Hygiene',
    points: [
      'Define a team log contract: agreed event catalogue, field names, and levels. New services start from the contract, not from scratch. Prevents 30 services using 30 different field names for the same concept.',
      'Log on boundaries, not internally. Log at entry (request received) and exit (response sent, job completed). For internal steps, use traces. Exceptions: genuinely surprising internal state changes.',
      'Test your logs: write integration tests that verify structured log output for key events. If the field name changes, the test fails — preventing silent log contract breakage.',
      'Correlation ID hygiene: always extract from inbound request headers first; generate only if missing. Log the extraction source (header vs generated) to help debug propagation failures.',
    ],
  },
  {
    heading: 'What to Log and What Never to Log',
    points: [
      'Log enough context to reconstruct what happened without needing to reproduce the issue — a log line should include the relevant identifiers (user ID, request ID, order ID) and the specific values that led to a decision, not just a generic "operation failed" message with no surrounding detail.',
      'Never log sensitive data — passwords, full credit card numbers, authentication tokens, and other PII should never appear in logs, since log aggregation systems are often accessible to a wide swath of engineering and third-party log processors, making them a real data exposure risk if sensitive data leaks in.',
      'Log at the right level consistently across a codebase — a shared understanding of what constitutes error vs warn vs info prevents both alert fatigue (everything logged as error) and missed problems (real errors logged as info and never surfaced to anyone watching error-level dashboards).',
      'Avoid logging inside tight loops or extremely hot code paths without rate limiting — a bug that causes a code path to execute millions of times can also cause millions of log lines, potentially overwhelming the logging pipeline and drowning out genuinely important log entries from other parts of the system.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Log Contract',
    language: 'typescript',
    code: `// log-contract.ts — shared across all services
// Defines what to log, at what level, with which fields

export const LOG_EVENTS = {
  // ── HTTP ──────────────────────────────────────────────────────
  REQUEST_STARTED:   { level: 'info',  msg: 'Request started' },
  REQUEST_COMPLETED: { level: 'info',  msg: 'Request completed' },
  REQUEST_FAILED:    { level: 'error', msg: 'Request failed' },

  // ── BUSINESS EVENTS ───────────────────────────────────────────
  ORDER_CREATED:     { level: 'info',  msg: 'Order created' },
  ORDER_CANCELLED:   { level: 'info',  msg: 'Order cancelled' },
  PAYMENT_DECLINED:  { level: 'warn',  msg: 'Payment declined' },   // expected business error
  PAYMENT_ERROR:     { level: 'error', msg: 'Payment processing error' }, // unexpected

  // ── BACKGROUND JOBS ───────────────────────────────────────────
  JOB_STARTED:       { level: 'info',  msg: 'Background job started' },
  JOB_COMPLETED:     { level: 'info',  msg: 'Background job completed' },
  JOB_FAILED:        { level: 'error', msg: 'Background job failed' },

  // ── INFRASTRUCTURE ────────────────────────────────────────────
  DB_CONNECTION_LOST:   { level: 'error', msg: 'Database connection lost' },
  CACHE_UNAVAILABLE:    { level: 'warn',  msg: 'Cache unavailable, using DB fallback' },
  THIRD_PARTY_TIMEOUT:  { level: 'warn',  msg: 'Third-party API timeout' },
} as const;

// Usage:
// logger[LOG_EVENTS.ORDER_CREATED.level](
//   { orderId, userId },
//   LOG_EVENTS.ORDER_CREATED.msg
// );

// ── AUDIT LOG SCHEMA ────────────────────────────────────────────
interface AuditLogEntry {
  timestamp: string;
  actor: { type: 'user' | 'service'; id: string };
  action: string;                   // 'USER_LOGIN', 'ORDER_CANCELLED', 'PERMISSION_GRANTED'
  resource: { type: string; id: string };
  result: 'success' | 'failure';
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// Audit logs go to a SEPARATE stream — not mixed with application logs
function writeAuditLog(entry: AuditLogEntry): void {
  auditLogger.info(entry, 'AUDIT'); // separate pino instance → separate stream
}`,
  },
  {
    label: 'Log Testing',
    language: 'typescript',
    code: `// Testing that structured logs emit correctly — catch field name regressions
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import { Writable } from 'stream';

function createTestLogger() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk) {
      lines.push(JSON.parse(chunk.toString()));
    }
  });
  const logger = pino({ level: 'debug' }, stream);
  return { logger, getLines: () => lines };
}

// In your test suite:
describe('Order service logging', () => {
  it('logs order creation with required fields', async () => {
    const { logger, getLines } = createTestLogger();
    // inject logger into the order service
    const service = new OrderService({ logger });

    await service.createOrder({ userId: 'u1', items: ['item1'] });

    const orderLog = getLines().find(l => l['msg'] === 'Order created');
    expect(orderLog).toBeDefined();
    expect(orderLog!['level']).toBe('info');
    expect(orderLog!['userId']).toBe('u1');
    expect(orderLog!['orderId']).toBeDefined();
    // If field name changes from 'userId' to 'user_id' → test fails → caught before prod
  });

  it('logs payment decline at WARN not ERROR', async () => {
    const { logger, getLines } = createTestLogger();
    // ...
    const log = getLines().find(l => l['msg'] === 'Payment declined');
    expect(log!['level']).toBe('warn'); // not 'error' — expected business outcome
  });
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Logging all errors at ERROR level regardless of whether they are expected',
    wrong: `// Payment declined is a normal business outcome — logged at ERROR
logger.error({ orderId, userId, errorCode: 'PAYMENT_DECLINED' }, 'Payment failed');
// 1000 orders/day, 3% decline rate → 30 ERROR logs/day that are perfectly normal
// Engineers learn to ignore ERROR logs → miss actual system failures`,
    right: `// Expected business outcome → WARN
logger.warn({ orderId, userId, errorCode: 'PAYMENT_DECLINED' }, 'Payment declined');

// Unexpected system failure → ERROR
logger.error({ orderId, userId, error: err.message }, 'Payment gateway unreachable');
// Now ERROR means "engineer action required", not "card was declined"`,
    explanation: 'The purpose of log levels is to indicate action required. ERROR should mean "an engineer needs to investigate this". Payment declined is a normal business outcome — it doesn\'t need investigation. Log expected business errors at WARN, unexpected system failures at ERROR. When ERROR is polluted with expected errors, real incidents get buried.',
  },
  {
    title: 'Using different field names for the same concept across services',
    wrong: `// order-service logs:    { "userId": "u1", "orderId": "o1" }
// payment-service logs:   { "user_id": "u1", "order_id": "o1" }
// inventory-service logs: { "uid": "u1", "oid": "o1" }
// Cannot write one LogQL query to find all events for user u1 across services`,
    right: `// Shared log contract — all services use the same field names
// log-contract.ts defines: userId, orderId, traceId, durationMs
// LogQL: {env="prod"} | json | userId="u1"
// → finds the user's events across ALL services instantly`,
    explanation: 'When 10 services use 10 different field names for user ID, you cannot write a single query to find all events for a user across services. Define a team-wide log field contract (a constants file or shared package) that all services import. Enforce consistency in code review. This makes cross-service debugging with LogQL or Kibana dramatically faster.',
  },
  {
    title: 'Not logging job completion time for background jobs',
    wrong: `async function processReturns() {
  logger.info('Processing returns');
  await processAllReturns();
  logger.info('Done');
  // No timing → cannot know if job is getting slower over time
  // No count → cannot know if job processed fewer items than expected
}`,
    right: `async function processReturns() {
  const start = Date.now();
  logger.info({ jobName: 'process-returns' }, 'Job started');
  const result = await processAllReturns();
  logger.info({
    jobName: 'process-returns',
    itemsProcessed: result.count,
    itemsFailed: result.failures,
    durationMs: Date.now() - start,
  }, 'Job completed');
}`,
    explanation: 'Background job logs must include timing and item counts to be operationally useful. "Done" tells you nothing. "Processed 4,231 returns in 45s, 3 failures" lets you alert on slower-than-expected runs, detect declining throughput, and identify when failure counts are trending up — all from log data without custom metrics.',
  },
  {
    title: 'No log contract — each engineer logs differently',
    wrong: `// Service A: logger.info(\`User \${id} logged in\`)
// Service B: logger.info({ user: id }, 'auth: login')
// Service C: logger.debug({ userId: id, event: 'login', type: 'user' }, 'Login OK')
// 3 services, 3 formats, 3 field names
// Cannot write a single query for all login events`,
    right: `// Shared log contract in a @company/logging package:
// - Event: 'User login'  Level: info  Fields: { userId, sessionId, ip }
// All 3 services import and use the same constant:
import { LOG_EVENTS, logEvent } from '@company/logging';
logEvent(logger, LOG_EVENTS.USER_LOGIN, { userId: id, sessionId, ip: req.ip });`,
    explanation: 'Without a log contract, every engineer makes independent decisions about what to log and how to name fields. After 2 years and 20 services, the logs are a Tower of Babel. Define a shared log event catalogue (what events to log, at which level, with which fields) as a package or documented standard. All services implement the contract — cross-service queries become trivial.',
  },
];

const challenge: Challenge = {
  title: 'Classify log events by level',
  language: 'typescript',
  description: `Implement classifyLogLevel(event: string): 'debug' | 'info' | 'warn' | 'error'

Rules:
- Contains "failed" or "error" (case-insensitive) AND not "declined" → 'error'
- Contains "declined" or "retry" or "timeout" → 'warn'
- Contains "started" or "completed" or "created" → 'info'
- Otherwise → 'debug'`,
  hints: ['Use .toLowerCase() for case-insensitive matching', 'Check conditions in order of priority'],
  starterCode: `function classifyLogLevel(event: string): 'debug' | 'info' | 'warn' | 'error' {
  return 'debug';
}

console.log(classifyLogLevel('Database connection failed'));  // error
console.log(classifyLogLevel('Payment declined'));            // warn
console.log(classifyLogLevel('API timeout on retry'));        // warn
console.log(classifyLogLevel('Order created'));               // info
console.log(classifyLogLevel('Cache key lookup'));            // debug`,
  solution: `function classifyLogLevel(event: string): 'debug' | 'info' | 'warn' | 'error' {
  const lower = event.toLowerCase();
  if ((lower.includes('failed') || lower.includes('error')) && !lower.includes('declined')) return 'error';
  if (lower.includes('declined') || lower.includes('retry') || lower.includes('timeout')) return 'warn';
  if (lower.includes('started') || lower.includes('completed') || lower.includes('created')) return 'info';
  return 'debug';
}

console.log(classifyLogLevel('Database connection failed'));
console.log(classifyLogLevel('Payment declined'));
console.log(classifyLogLevel('API timeout on retry'));
console.log(classifyLogLevel('Order created'));
console.log(classifyLogLevel('Cache key lookup'));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'An engineer says "we should log at ERROR whenever an exception is thrown." What is wrong with this approach?',
    options: [
      'Exceptions are too large to log efficiently — stack traces inflate log storage costs significantly',
      'Many exceptions represent expected business outcomes (PaymentDeclinedException, NotFoundException) — logging them as ERROR creates noise that masks real system failures',
      'Logging exceptions at ERROR triggers automatic PagerDuty alerts, causing alert fatigue',
      'Nothing is wrong — ERROR is the correct level for all exceptions regardless of type',
    ],
    answer: 1,
    explanation: 'Not all exceptions represent system failures. PaymentDeclinedException is a normal business outcome — the payment processor rejected the card. NotFoundException occurs when a user requests a non-existent resource. Logging these at ERROR means your ERROR stream is full of expected events, and engineers learn to ignore it. Use WARN for expected business exceptions and ERROR only for truly unexpected system failures (database unreachable, unhandled exception in unexpected code path).',
  },
  {
    q: 'Why should audit logs be in a separate stream from application logs?',
    options: [
      'Audit logs use a different format that is incompatible with standard log aggregation systems',
      'Application log retention (7-30 days) is too short for audit requirements (1-7 years), and access must be restricted to security/compliance teams, not all engineers',
      'Audit logs are too large to store alongside application logs in the same system',
      'Audit events fire too frequently and would overwhelm the application log stream',
    ],
    answer: 1,
    explanation: 'Audit logs have fundamentally different operational requirements from application logs: much longer retention (7 years for SOC 2 / financial compliance vs 7-30 days for application logs), immutability (must not be deletable even by administrators), and restricted access (security team and auditors, not all engineers). Co-mingling audit and application logs in the same stream makes it impossible to enforce these requirements independently.',
  },
  { q: 'What is the key difference between structured and unstructured logging?', options: ['Structured logging is faster to write at runtime; unstructured logging is easier to read by humans', 'Structured logging emits log entries as machine-parseable key-value pairs (JSON) enabling filtering, aggregation, and querying on any field; unstructured logging emits free-form text strings that require regex parsing', 'Structured logging stores logs in a database; unstructured logging writes to plain text files', 'Unstructured logging is deprecated; all modern applications must use structured logging by law'], answer: 1, explanation: 'Unstructured logging: printf-style strings. 2024-01-15 12:34:56 ERROR Failed to process order 456 for user 123. Difficult to query by order ID or user ID without fragile regex parsing. Structured logging: JSON with discrete fields. { timestamp: 2024-01-15T12:34:56Z, level: ERROR, message: Failed to process order, orderId: 456, userId: 123, errorType: ValidationError }. Log aggregation systems (Elasticsearch, Loki) can filter on any field efficiently. Aggregations are trivial: count errors by userId, find the top 10 failing orderIds. No regex needed. Structured logging with a consistent schema across all services dramatically reduces the time to investigate incidents.' },
  { q: 'What log levels should be used and what criteria distinguish them?', options: ['Log everything at DEBUG level and filter at the aggregation layer for cost efficiency', 'ERROR for unhandled failures requiring intervention; WARN for handled issues worth tracking; INFO for significant events in normal flow; DEBUG for detailed development-time context', 'Use only two levels: ERROR and INFO; WARN and DEBUG add unnecessary complexity', 'All requests should be logged at INFO; only production deployments should change to ERROR-only logging'], answer: 1, explanation: 'Log level guidelines: ERROR: something failed that requires engineering attention. Unhandled exceptions, failed database connections, third-party API failures, missing required resources. Should trigger alerting. WARN: something unexpected happened but the system handled it. Retried a request and succeeded, degraded to fallback, approaching resource limit. Worth tracking but not urgent. INFO: normal significant application events. Service started, request received, order completed, scheduled job finished. The happy path milestone markers. DEBUG: detailed diagnostic information useful only during development or incident investigation. Variable values, SQL queries, intermediate computation results. Should be off in production or sampled very heavily. Never log at TRACE in production.' },
  { q: 'What is log context injection and how does it improve log correlations?', options: ['A security technique that filters malicious content from log entries before storage', 'Automatically attaching contextual fields (trace ID, user ID, request ID) to all log entries emitted within a request scope without manually passing them to every log call', 'A log parsing technique that extracts structured fields from unstructured log strings', 'A Kubernetes feature that adds pod metadata to logs collected by Fluentd or Promtail'], answer: 1, explanation: 'Log context injection: using thread-local storage (Java MDC), async context (Node.js AsyncLocalStorage), or middleware to store request context that is automatically included in every log line emitted during that request. Without context injection: every log call must manually include requestId, userId, traceId as parameters. Easy to forget. With context injection: middleware stores the request context at the start. Every log call in that request scope automatically includes all stored fields. Implementation: Logback MDC.put, .NET ILogger Scope, Go context with zerolog, Node.js AsyncLocalStorage. Result: every log line in a request contains the trace ID, allowing instant correlation of all logs across all services for one request.' },
  { q: 'What is log rotation and why is it critical for application servers?', options: ['Log rotation distributes log writes across multiple log files for higher write throughput', 'Log rotation periodically renames and compresses old log files and creates a new active log file, preventing log files from growing indefinitely and consuming all disk space', 'Log rotation is the process of migrating logs from one aggregation system to another', 'Log rotation applies only to system logs; application logs are managed by the application itself'], answer: 1, explanation: 'Log rotation problem without rotation: a single log file grows indefinitely. A busy server writing 100MB of logs per hour fills a 500GB disk in 5000 hours (under 7 months). Operational impact: disk full causes application crashes and data loss. Log rotation solution: configure the logging framework or logrotate daemon to: rotate logs daily or when the file exceeds a size limit. Keep N days of compressed archives. Delete archives older than the retention period. Linux logrotate: the standard tool for rotating logs for applications writing to files. Application logging framework support: Log4j, Logback, Winston, Serilog all support built-in rotation. In Kubernetes: container logs are written to stdout/stderr. The kubelet manages log rotation via container log rotation settings. Log shipping: prefer shipping logs to a centralized system over managing log files on disk.' },
];

const qna: QnaItem[] = [
  {
    q: 'How many log lines should a successful HTTP request generate?',
    a: 'Ideally one to two: one at request start (optional, for tracking in-flight requests) and one at request completion (required — includes method, path, statusCode, durationMs, traceId). For 95% of healthy requests, two log lines is optimal. <br><br><strong>When more is acceptable</strong>: if the request performs a significant business action (order placed, payment processed), one additional INFO log for the business event is appropriate. Total: 3 lines.<br><br><strong>What NOT to log per request</strong>: every function call, every cache check, every database query (those belong in traces), intermediate variable values, "entering function X", "leaving function X". If you have 20+ log lines for a healthy request, you have debug-level verbosity in production — it is costing you money and burying real signals in noise.',
  },
  {
    q: 'How do I implement a "log contract" without creating a shared package that all services must update?',
    a: 'Three approaches, from lightest to most rigorous: <ol><li><strong>Documentation-only</strong>: a team wiki page or CLAUDE.md file that defines the field names, log levels, and event list. Enforced in code review. Zero dependency overhead, requires discipline.</li><li><strong>Shared TypeScript types</strong>: a monorepo internal package (`@internal/log-types`) that exports interfaces and constants. Services import types only — no runtime dependency. Changes are backwards-compatible (adding fields).</li><li><strong>Shared logger factory</strong>: a package that wraps Pino and exports `createLogger(serviceName)`. Returns a pre-configured logger with enforced fields. The contract is in the wrapper — services can\'t accidentally use wrong field names.</li></ol>Option 3 is the most robust but has highest coupling. Option 1 works for teams with good review culture. Option 2 is the sweet spot for most teams — types catch typos at compile time without runtime coupling. Start with option 1, promote to 2 when inconsistency causes real incidents.',
  },
  { q: 'What should you never log and how do you prevent accidental sensitive data logging?', a: 'Never log: passwords and password hashes. API keys, tokens, and secrets. Credit card numbers and CVVs. Social security numbers and government IDs. Full bank account numbers. Private cryptographic keys. Session tokens and JWT tokens. Full HTTP request/response bodies (may contain any of the above). Prevention strategies: static analysis tools: tools like Semgrep can scan for logging of fields named password, secret, or token. Log masking libraries: intercept log events and apply regex patterns to redact known sensitive patterns (16-digit card numbers, email addresses if not needed). Serialization control: use custom serializers that redact sensitive fields before converting objects to log-able strings. Code review: include sensitive data logging as a specific code review checklist item. Test: write unit tests that verify sensitive fields are not present in log output. Environment-specific: never log request bodies in production; optionally log them in development with explicit opt-in.' },
  { q: 'How do you implement effective error logging that aids incident investigation?', a: 'Error log content: always include a stack trace for unexpected exceptions. Include the full error chain (cause chain) not just the top-level exception. Include all context available: request parameters (sanitized), user ID, resource ID, operation being attempted. Include the error type and error code (not just the message string). Correlation: include trace ID and span ID so the error log can be linked to the distributed trace showing all services involved in the failed request. Error categorization: classify errors by type (user error vs system error). User errors (400-level) should be INFO or WARN, not ERROR. System errors (500-level) are ERROR. Unexpected business rule violations are WARN. Log once rule: if an exception is caught and re-thrown, log it only at the point where it is ultimately handled (or not handled). Logging at every catch and rethrow causes duplicate log entries for the same error. Counter metrics: for every ERROR log, also increment a corresponding error counter metric.' },
  { q: 'How do you design logging for asynchronous and event-driven systems?', a: 'Asynchronous logging challenges: operations span multiple threads or processes. A request starts in Thread A, queues work, and Thread B processes it later. The trace context and request context must be propagated through the async boundary. Solutions: trace context propagation: inject the trace ID into message headers (Kafka headers, SQS message attributes, RabbitMQ headers). The consumer reads the trace ID and resumes the trace as a linked span. Correlation ID: add a business-level correlation ID (orderId, workflowId) to all log entries related to the same business process. Even without trace ID propagation, logs can be correlated by business entity. Async context: use language-level async context (Node.js AsyncLocalStorage, Java CompletableFuture context propagation). Log at boundaries: log when work is queued (producer side) and when it starts and completes (consumer side). Include queue depth and processing time in consumer logs.' },
  { q: 'What is the logging overhead problem and how do you minimize it?', a: 'Logging overhead sources: string formatting: printf-style formatting constructs the string even if the log level is disabled. Use guard checks (if (logger.isDebugEnabled())) or lazy evaluation (debug(() -> computeExpensiveString())). Synchronous I/O: writing to a log file synchronously blocks the application thread. Use asynchronous log appenders (Logback AsyncAppender, Log4j async logger). Serialization: JSON serialization of complex objects can be expensive for high-frequency log paths. Pre-serialize common objects or use string builders. Network I/O: shipping logs directly to Elasticsearch from the application adds latency and creates a dependency on the log aggregation system. Use a local buffer (file or Fluent Bit sidecar) and ship asynchronously. Measurement: profile logging overhead with production-representative load. If logging takes more than 1% of request time, it is too expensive. Reduce log volume or optimize serialization. Benchmark: structured JSON logging with async appenders typically adds less than 50 microseconds per log line at INFO level.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Log at boundaries, not internals. Expected errors → WARN, system failures → ERROR. Audit logs are separate. Define a team log contract. Test your logs.',
  mustKnow: [
    'Log level semantics: DEBUG (dev-only), INFO (business events), WARN (expected errors), ERROR (unexpected failures needing investigation)',
    'Expected business errors (payment declined, not found) → WARN not ERROR — prevents ERROR stream noise',
    'Audit logs: separate stream, long retention, immutable, restricted access. Never co-mingle with app logs.',
    'Log contract: shared event catalogue and field names across all services — cross-service queries only work with consistent field names',
    'Log on boundaries (request in/out, job start/finish) not on every internal function call',
    'Test log output: verify field names and levels in integration tests to catch contract regressions before production',
  ],
  interviewFocus: [
    'When should you log at WARN vs ERROR? Give an example of each.',
    'Why are audit logs kept separate from application logs?',
    'What is a log contract and why does it matter for multi-service systems?',
  ],
};

@Component({
  selector: 'app-obs-log-best-practices',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './log-best-practices.html',
  styleUrl: './log-best-practices.scss',
})
export class ObsLogBestPractices {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
