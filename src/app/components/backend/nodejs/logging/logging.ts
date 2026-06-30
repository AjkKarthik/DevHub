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
  selector: 'app-node-logging',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './logging.html',
  styleUrl: './logging.scss'
})
export class NodeLogging {
  quickRef: QuickRefItem[] = [
    { name: 'Pino', type: 'keyword', desc: 'Fastest Node.js logger. JSON output, minimal overhead, async transports.' },
    { name: 'Winston', type: 'keyword', desc: 'Flexible multi-transport logger. Widely used, many community transports.' },
    { name: 'Log levels', type: 'keyword', desc: 'fatal > error > warn > info > debug > trace. Set minimum level per environment.' },
    { name: 'Structured logging', type: 'keyword', desc: 'JSON format with consistent fields. Machine-parseable by Datadog, ELK, CloudWatch.' },
    { name: 'requestId / correlationId', type: 'keyword', desc: 'Unique ID per request propagated through all log lines for request tracing.' },
    { name: 'Pino child logger', type: 'method', desc: 'logger.child({ requestId }) creates a logger that always includes the bound context.' },
    { name: 'Log rotation', type: 'keyword', desc: 'Rotate log files by size/time. Use logrotate (Linux) or pino-roll.' },
    { name: 'AsyncLocalStorage', type: 'class', desc: 'Propagates requestId through async call chains without parameter drilling.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Structured Logging Fundamentals',
      points: [
        'Structured logging emits JSON objects instead of human-readable strings. Each log line has consistent fields: timestamp, level, requestId, service, message, and contextual metadata. JSON logs are machine-parseable — platforms like Datadog, CloudWatch, and ELK Stack index every field for querying and alerting.',
        'Log levels control verbosity: fatal (process will crash), error (operation failed, needs attention), warn (something unexpected but recovered), info (normal operation milestones), debug (detailed diagnostic info), trace (function-level tracing). Set minimum level to info in production, debug in staging.',
        'Never use console.log in production applications. console.log is synchronous, unstructured, and has no concept of levels or transports. Use a dedicated logger (Pino, Winston) that serializes to JSON, routes to appropriate transports, and has configurable minimum log levels.',
        'Pino is the recommended logger for Node.js. It is 5-8x faster than Winston and console.log because it does minimal work on the hot path and delegates JSON serialization to a separate process (pino-pretty, pino-transport). Zero overhead when log level is filtered.',
      ]
    },
    {
      heading: 'Correlation IDs and Request Context',
      points: [
        'Correlation IDs (request IDs) link all log lines for a single request. Without them, logs from concurrent requests are interleaved and impossible to trace. Generate a UUID at request entry (or read x-request-id header from upstream), and include it in every log line within that request.',
        'Child loggers attach permanent context: const reqLogger = logger.child({ requestId, userId, path }). Every log call on reqLogger automatically includes those fields. Use child loggers per-request to avoid manually passing requestId everywhere.',
        'AsyncLocalStorage (node:async_hooks) propagates request context through async call chains without explicit parameter passing. Store { requestId, userId } in AsyncLocalStorage at request entry. Any function in the request\'s call chain can read it, enabling automatic context in log calls.',
        'Distributed tracing: in microservices, propagate trace context (W3C Trace Context: traceparent header) across service calls. Each service adds spans to the trace. OpenTelemetry instruments Node.js automatically, exporting to Jaeger, Zipkin, or Datadog APM.',
      ]
    },
    {
      heading: 'Log Management and Production Practices',
      points: [
        'Transports route log output to destinations: stdout (for containerised apps — Docker/K8s picks it up), files (development), external services (Datadog, Logtail, CloudWatch). In containers, always log to stdout and let the orchestrator handle log collection.',
        'Pino transports run in a separate worker thread (pino.transport() with target). This means slow transports (file I/O, network) never block the main thread. Winston transports run synchronously — a slow transport blocks the event loop.',
        'Sensitive data must never appear in logs. Sanitize before logging: redact passwords, tokens, credit card numbers. Pino has a built-in redact option: pino({ redact: ["body.password", "headers.authorization"] }) replaces those fields with [Redacted].',
        'Log sampling under high load: logging every request at info level with 10,000 req/s creates 864M log lines per day. Sample debug logs (log 1% of requests for debug). Log all errors. Use adaptive sampling — log more detail when error rate spikes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pino structured logging',
      language: 'typescript',
      code: `import pino from 'pino';
import { randomUUID } from 'node:crypto';

// Create logger with redaction and transport
const logger = pino({
  level:  process.env.LOG_LEVEL ?? 'info',
  redact: ['body.password', 'headers.authorization', '*.token'],
  base:   { service: 'api', version: process.env.npm_package_version },
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,  // JSON to stdout in production
});

// Express middleware — create child logger per request
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] ?? randomUUID();
  req.log = logger.child({
    requestId,
    method:  req.method,
    path:    req.path,
    ip:      req.ip,
  });

  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    req.log.info({
      statusCode:  res.statusCode,
      duration:    Date.now() - start,
    }, 'request completed');
  });
  next();
});

// Use request logger in routes
app.get('/users/:id', async (req, res) => {
  req.log.debug({ userId: req.params.id }, 'fetching user');
  const user = await userService.findById(req.params.id);
  if (!user) {
    req.log.warn({ userId: req.params.id }, 'user not found');
    return res.status(404).json({ error: 'Not found' });
  }
  req.log.info({ userId: user.id }, 'user fetched successfully');
  res.json(user);
});`
    },
    {
      label: 'AsyncLocalStorage for automatic correlation',
      language: 'typescript',
      code: `import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const baseLogger = pino({ level: 'info' });
const store = new AsyncLocalStorage();

// Logger that automatically picks up context
export const logger = {
  info:  (msg, ctx = {}) => getLogger().info(ctx, msg),
  error: (msg, ctx = {}) => getLogger().error(ctx, msg),
  warn:  (msg, ctx = {}) => getLogger().warn(ctx, msg),
  debug: (msg, ctx = {}) => getLogger().debug(ctx, msg),
};

function getLogger() {
  const ctx = store.getStore();
  return ctx ? baseLogger.child(ctx) : baseLogger;
}

// Middleware: create context for each request
app.use((req, res, next) => {
  const ctx = {
    requestId: req.headers['x-request-id'] ?? randomUUID(),
    userId:    req.user?.id,  // set after auth middleware
  };
  store.run(ctx, next);
});

// Any function in the request chain gets requestId automatically
async function sendEmailToUser(email) {
  logger.info('Sending email', { email }); // automatically includes requestId
  await emailService.send(email);
  logger.info('Email sent', { email });
}

// No need to pass requestId through every function call
app.post('/welcome', async (req, res) => {
  logger.info('Processing welcome email');
  await sendEmailToUser(req.body.email); // requestId propagated automatically
  res.json({ ok: true });
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using console.log in production',
      wrong: `app.get('/users', async (req, res) => {
  console.log('Fetching users'); // synchronous, unstructured, no level, no context
  const users = await db.findAll();
  res.json(users);
});`,
      right: `app.get('/users', async (req, res) => {
  req.log.info('Fetching users'); // structured, has requestId, leveled
  const users = await db.findAll();
  res.json(users);
});`,
      explanation: 'console.log is synchronous (blocks the event loop briefly), unstructured (string output, not queryable), has no log levels, and has no context. In production, use Pino or Winston for JSON structured logs.'
    },
    {
      title: 'Logging sensitive data',
      wrong: `logger.info({ user: req.body }, 'User registered'); // logs password!`,
      right: `const { password, ...safeUser } = req.body;
logger.info({ user: safeUser }, 'User registered');
// OR: use pino's built-in redact option`,
      explanation: 'Logs are stored, indexed, and often accessed by multiple teams. Passwords, tokens, and PII in logs create a security and compliance risk. Destructure to exclude sensitive fields, or configure Pino\'s redact option to automatically replace them with [Redacted].'
    },
    {
      title: 'Logging entire request/response bodies',
      wrong: `app.use((req, res, next) => {
  logger.debug({ body: req.body, headers: req.headers }, 'incoming request');
  // logs every header including Authorization and Cookie
  next();
});`,
      right: `app.use((req, res, next) => {
  logger.debug({
    method:  req.method,
    path:    req.path,
    // Specific safe fields only
  }, 'incoming request');
  next();
});`,
      explanation: 'Request headers often contain Authorization tokens, Cookie values (session tokens), and other sensitive data. Log only the fields needed for debugging: method, path, and selected safe metadata. Never log full headers or request bodies without redaction.'
    },
    {
      title: 'Not setting minimum log level per environment',
      wrong: `const logger = pino({ level: 'trace' }); // trace in production = millions of log lines per minute`,
      right: `const logger = pino({ level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug') });`,
      explanation: 'Debug/trace logs in production create massive log volumes, increase storage costs, and can expose sensitive debug data. Set the minimum level via an environment variable. Production default: info. Only downgrade to debug temporarily for incident investigation.'
    },
  ];

  challenge: Challenge = {
    title: 'Request Logger Middleware',
    language: 'typescript',
    description: 'Build an Express request logger middleware using Pino. It should: (1) generate or read x-request-id from headers, (2) create a child logger with requestId, method, path bound, (3) attach req.log for use in route handlers, (4) log completed requests with statusCode, duration, and contentLength, (5) redact authorization headers from logs.',
    hints: [
      'req.log = logger.child({ requestId, method, path })',
      'Use res.on("finish") to log after response is sent',
      'res.getHeader("content-length") for response size',
    ],
    starterCode: `import pino from 'pino';
import { randomUUID } from 'node:crypto';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // TODO: add redact for authorization header
});

export function requestLogger(req, res, next) {
  // TODO: implement logging middleware
  next();
}

app.use(requestLogger);
app.get('/test', (req, res) => {
  req.log.info('Handler reached');
  res.json({ ok: true });
});`,
    solution: `import pino from 'pino';
import { randomUUID } from 'node:crypto';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  base: { service: 'api' },
});

export function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.log = logger.child({ requestId, method: req.method, path: req.path });

  res.setHeader('x-request-id', requestId);
  req.log.info('request started');

  const start = Date.now();
  res.on('finish', () => {
    req.log.info({
      statusCode:    res.statusCode,
      duration:      Date.now() - start,
      contentLength: res.getHeader('content-length') ?? 0,
    }, 'request completed');
  });

  next();
}

app.use(requestLogger);
app.get('/test', (req, res) => {
  req.log.info('Handler reached');
  res.json({ ok: true });
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why should you use Pino instead of Winston for high-throughput Node.js APIs?', options: ['Pino has more transports', 'Pino does minimal work on the hot path and delegates serialization to a worker thread — 5-8x faster than Winston', 'Pino supports more log levels', 'Pino is newer'], answer: 1, explanation: 'Pino\'s design principle is minimal overhead on the logging call. Serialization to JSON and transport I/O happen in a separate worker thread (pino.transport()) so slow I/O never blocks the event loop. Winston transports run synchronously on the main thread.' },
    { q: 'What is the purpose of child loggers in Pino?', options: ['To run in a child process', 'To create a logger instance with permanent bound context (requestId, userId) included in every log call', 'To reduce log file size', 'To filter specific log levels'], answer: 1, explanation: 'logger.child({ requestId, userId }) returns a new logger where every log call automatically includes those fields. Instead of manually passing requestId to every log call, bind it once in request middleware and use req.log throughout the request lifecycle.' },
    { q: 'What is structured logging and why is it preferred over string logs?', options: ['Logs written to structured files instead of stdout', 'JSON log output with consistent fields (timestamp, level, message, context) — machine-parseable for queries and alerts', 'Logs with a fixed character width', 'Logs grouped by request type'], answer: 1, explanation: 'Structured logging (JSON) makes logs queryable by any field: filter by requestId, userId, statusCode, or error message. Platforms like Datadog, CloudWatch, and ELK index every JSON field. String logs require regex parsing and lose structure.' },
    { q: 'Why should the default log level in production be "info" rather than "debug"?', options: ['debug level is deprecated in production', 'debug logs can contain sensitive data and create excessive log volume — millions of lines per minute at scale', 'info logs are faster to write', 'debug logs require more disk space per line'], answer: 1, explanation: 'Debug/trace logs include detailed operational data (every function call, DB query, etc.) that is helpful for development but creates enormous log volume in production (10K req/s × multiple debug logs = 100M+ lines/hour). High volume = high cost, and debug logs may leak internal details.' },
    { q: 'What is log correlation and why is it important in distributed systems?', options: ['Combining logs from multiple files into one', 'Attaching a unique request ID to all logs generated within one request — enables tracing across services', 'Sorting logs by timestamp', 'Grouping logs by error level'], answer: 1, explanation: 'In a microservices system, one user request touches 5+ services. Without correlation, diagnosing an issue requires guessing which logs belong together. A traceId (X-Request-ID header, or OpenTelemetry trace ID) passed between services and included in every log line allows you to filter all logs for one request across all services with a single query.' },
    { q: 'What is the difference between console.log() and a proper logger (Winston/Pino) in production?', options: ['They are equivalent — console.log writes to stdout which log collectors read', 'A proper logger adds structured fields, log levels, and transports — console.log lacks levels, has no JSON output, and cannot be configured', 'console.log is faster than Winston', 'Winston prevents stdout logging in production'], answer: 1, explanation: 'console.log() always writes at "info" level with no way to filter. No log levels, no JSON, no context injection. Winston/Pino support: levels (warn/error/debug), JSON output for machine parsing, transports (file, CloudWatch, Datadog), child loggers that inherit context (requestId, userId). For production services, console.log is not a logging solution.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I propagate request ID to downstream service calls?', a: 'When making HTTP requests to other services, include the requestId in the outgoing headers: axios.get(url, { headers: { "x-request-id": requestId } }). If using AsyncLocalStorage, read the requestId from the store and inject it automatically in an Axios interceptor or fetch wrapper. Downstream services read the header and use it as their own requestId. This creates a trace chain across services without a full distributed tracing setup.' },
    { q: 'Should I log to files or stdout in containerised apps?', a: 'Always stdout (and stderr for errors) in containers. Docker and Kubernetes capture stdout/stderr and route them to the cluster\'s logging infrastructure (Fluentd, Logstash, CloudWatch Agent). If you write to files inside a container, the logs are lost when the container is replaced. File logging makes sense only in traditional VM deployments with log rotation configured. Platform rule: let the infrastructure handle log collection — your app just needs to write to stdout.' },
    { q: 'How do I handle log sampling at high traffic?', a: 'Full logging at 10K req/s generates ~1TB of logs per day at 100 bytes per log line. Strategies: (1) Deterministic sampling — log only requests where requestId hash % N === 0 (e.g. 1% sample). (2) Priority sampling — always log errors, 5xx responses, and slow requests regardless of sample rate. (3) Adaptive sampling — normal rate at low traffic, increased sampling when error rate spikes. Pino supports custom redact functions to implement sampling at the transport level.' },
    { q: 'Why is structured (JSON) logging preferred over plain text console.log statements in production Node.js services?', a: 'Plain text logs require fragile regex parsing to extract fields for searching, filtering, or alerting, and lose all type information (a numeric duration becomes an unstructured string fragment). Structured JSON logs (via pino, winston with JSON format) emit each log entry as a parseable object with consistent fields (timestamp, level, message, requestId, custom context), letting log aggregation platforms (Datadog, ELK, CloudWatch Logs Insights) index, filter, and alert on specific fields directly without brittle text parsing.' },
    { q: 'What is a correlation ID and why is it essential for debugging distributed Node.js systems?', a: 'A correlation ID (or request ID/trace ID) is a unique identifier generated at the entry point of a request and propagated through every downstream log statement, service call, and queue message related to that request. Without it, finding all log lines for a single user-facing request across multiple microservices, async jobs, or retries is nearly impossible — with it, a single grep or log-platform filter on the correlation ID reconstructs the complete request journey across the entire distributed system.' },
    { q: 'Why is pino generally preferred over console.log or even winston for high-throughput Node.js APIs?', a: 'pino is designed for minimal serialization overhead — it uses fast JSON stringification and avoids synchronous, blocking I/O for log writes in the hot path (it can offload formatting/transport to a separate worker thread via pino-transport), making it significantly faster than synchronous console.log or winston\'s default configuration under high request volume. For services logging thousands of requests per second, this overhead difference becomes a measurable factor in overall throughput and latency.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Structured JSON logging with Pino + child loggers per request + requestId correlation = debuggable production systems. Redact sensitive data; set level:info in production.',
    mustKnow: [
      'Structured logging: JSON with consistent fields — machine-queryable.',
      'Log levels: fatal/error/warn/info/debug/trace. Production: info minimum.',
      'Pino is 5-8x faster than Winston — uses worker thread for serialization.',
      'Child logger per request: req.log = logger.child({ requestId }) — auto-context.',
      'Redact sensitive fields: pino({ redact: ["body.password"] }).',
      'Containers: log to stdout, not files — orchestrator handles collection.',
      'AsyncLocalStorage: propagates requestId without parameter drilling.',
    ],
    interviewFocus: [
      'What is structured logging and why is it better than string logs?',
      'How do you trace a request across multiple log lines?',
      'What data should never appear in logs?',
    ]
  };
}
