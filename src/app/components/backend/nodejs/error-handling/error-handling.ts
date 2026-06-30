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
  selector: 'app-node-error-handling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss'
})
export class NodeErrorHandling {
  quickRef: QuickRefItem[] = [
    { name: 'AppError', type: 'class', desc: 'Custom error class extending Error with statusCode and isOperational flag.' },
    { name: 'process.on("uncaughtException")', type: 'function', desc: 'Last-resort handler for synchronous exceptions that escape all try/catch blocks.' },
    { name: 'process.on("unhandledRejection")', type: 'function', desc: 'Catches unhandled Promise rejections — log and exit in production.' },
    { name: 'Operational error', type: 'keyword', desc: 'Expected runtime failure: 404, validation error, DB timeout. Safe to send to client.' },
    { name: 'Programmer error', type: 'keyword', desc: 'Bug in code: undefined access, wrong arg type. Crash and restart; never send stack trace.' },
    { name: 'asyncHandler(fn)', type: 'function', desc: 'Express wrapper: catches async route errors and forwards to next(err).' },
    { name: 'errorMiddleware', type: 'function', desc: 'Express 4-arg (err, req, res, next) middleware — registered last, catches all route errors.' },
    { name: 'Result type', type: 'type', desc: 'Functional pattern: return { ok, value } | { ok: false, error } to avoid throwing.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Operational vs Programmer Errors',
      points: [
        'Operational errors are expected failures at runtime: a 404 for a missing resource, a database timeout, a validation failure, a downstream API being unavailable. These should be caught, logged lightly, and returned to the client as a structured error response.',
        'Programmer errors are bugs: accessing .name on undefined, passing the wrong type to a function, a logic error that causes incorrect state. These should never be silently caught — they indicate a defect that must be fixed. The safe response is to crash and let the process manager restart.',
        'The key question for error handling design: "Is this error expected, and can I handle it gracefully?" If yes — operational, handle it. If no — programmer, crash or re-throw and let it propagate.',
        'Custom error classes encode this distinction: extend Error, add isOperational = true for operational errors and statusCode for HTTP context. Programmer errors either go untagged or throw plain Errors.',
      ]
    },
    {
      heading: 'Async Error Propagation',
      points: [
        'In Express, unhandled async errors (thrown from async route handlers) do NOT propagate to error middleware automatically in Express 4. You must catch them and call next(err).',
        'The asyncHandler wrapper pattern: const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next). Wrap every async route function with it.',
        'Express 5 (available as beta) automatically handles async errors — thrown errors in async handlers propagate to error middleware. Express 5 removes the need for asyncHandler.',
        'In Fastify, async errors in handlers propagate automatically. Fastify wraps handlers in try/catch and routes errors to the onError hook. No wrapper needed.',
      ]
    },
    {
      heading: 'Global Error Handlers and Graceful Shutdown',
      points: [
        'process.on("unhandledRejection", (reason, promise) => { logger.error(reason); process.exit(1); }): handles Promise rejections with no .catch(). Exit so the process manager restarts.',
        'process.on("uncaughtException", (err) => { logger.fatal(err); process.exit(1); }): handles synchronous exceptions that escape all try/catch. Always exit — the process state is unknown.',
        'Graceful shutdown: on SIGTERM, stop accepting new connections (server.close()), finish in-flight requests, close DB connections, then exit. PM2 sends SIGTERM before SIGKILL; Docker does the same.',
        'Error monitoring services (Sentry, Datadog) should be called in global handlers before exiting. They flush their buffer synchronously so errors are captured even on crash.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Custom AppError + Express middleware',
      language: 'typescript',
      code: `// errors/AppError.js
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// middleware/asyncHandler.js
export const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// middleware/errorMiddleware.js
export function errorMiddleware(err, req, res, next) {
  // Operational: known, safe to surface
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }
  // Programmer error: log full details, hide from client
  console.error('CRITICAL ERROR', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
}

// Usage in routes
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));

// Must be registered LAST in Express
app.use(errorMiddleware);`
    },
    {
      label: 'Global handlers + graceful shutdown',
      language: 'typescript',
      code: `import { createServer } from 'node:http';

const server = createServer(app);

// Unhandled async rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  // Initiate graceful shutdown — process.exit after cleanup
  shutdown('unhandledRejection');
});

// Uncaught sync exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown('uncaughtException'); // exit immediately — state is unknown
});

// Graceful shutdown on SIGTERM (Docker, PM2, K8s)
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

async function shutdown(signal) {
  console.log(\`Shutdown triggered by \${signal}\`);
  server.close(async () => {
    // No new connections — finish in-flight requests first
    await db.end();              // close DB pool
    await redis.quit();          // close cache
    console.log('Graceful shutdown complete');
    process.exit(signal === 'uncaughtException' ? 1 : 0);
  });

  // Force exit if shutdown takes too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Catching errors silently in async routes (Express 4)',
      wrong: `app.get('/users', async (req, res) => {
  const users = await db.getAll(); // throws — never reaches error middleware
  res.json(users);
});`,
      right: `app.get('/users', asyncHandler(async (req, res) => {
  const users = await db.getAll(); // caught by asyncHandler → next(err)
  res.json(users);
}));`,
      explanation: 'Express 4 does not catch errors from async handlers automatically. Without asyncHandler or a manual try/catch calling next(err), the error silently hangs the request.'
    },
    {
      title: 'Sending stack traces to clients in production',
      wrong: `res.status(500).json({ error: err.message, stack: err.stack });`,
      right: `if (err.isOperational) {
  res.status(err.statusCode).json({ error: err.message });
} else {
  res.status(500).json({ error: 'Internal server error' });
}`,
      explanation: 'Stack traces reveal internal file paths, library versions, and code structure. This is sensitive information that enables targeted attacks. Programmer errors should always return a generic message to clients.'
    },
    {
      title: 'Not exiting after uncaughtException',
      wrong: `process.on('uncaughtException', (err) => {
  console.error(err); // just log — keep running
});`,
      right: `process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1); // process state is unknown — must exit
});`,
      explanation: "After an uncaughtException, the application is in an undefined state. Memory may be corrupt, database connections may be in inconsistent state. Continuing to serve requests is dangerous. Exit and let the process manager restart."
    },
    {
      title: 'Throwing in the error middleware',
      wrong: `app.use((err, req, res, next) => {
  const formatted = formatError(err); // if this throws — infinite loop
  res.json(formatted);
});`,
      right: `app.use((err, req, res, next) => {
  try {
    const formatted = formatError(err);
    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});`,
      explanation: 'Throwing inside Express error middleware causes the error to be lost — Express has no outer handler. Wrap error middleware logic in try/catch and always fall back to a safe response.'
    },
    {
      title: 'Catching and swallowing errors to "handle" them',
      wrong: `async function getUser(id) {
  try {
    return await db.findUser(id);
  } catch (e) { return null; } // caller can't tell null from "not found" vs "DB crash"
}`,
      right: `async function getUser(id) {
  try {
    return await db.findUser(id);
  } catch (e) {
    if (e.code === 'NOT_FOUND') return null;
    throw e; // re-throw unexpected errors
  }
}`,
      explanation: 'Swallowing all errors hides bugs. A DB connection failure looks the same as a "not found" response. Only catch errors you can meaningfully handle; re-throw the rest.'
    },
  ];

  challenge: Challenge = {
    title: 'Typed Result Error Handling',
    language: 'typescript',
    description: 'Implement a Result<T, E> pattern for Node.js functions. Create ok(value) and err(error) factory functions returning Result objects. Implement a tryCatch(fn) helper that wraps an async function and returns a Result instead of throwing. Use it to safely call a flaky API and return structured results without try/catch at the call site.',
    hints: [
      'Result is: { ok: true, value: T } | { ok: false, error: E }',
      'tryCatch returns a Promise<Result<T, Error>>',
      'Caller checks result.ok before accessing result.value',
    ],
    starterCode: `// TODO: implement ok(), err(), tryCatch()
function ok(value) { /* ... */ }
function err(error) { /* ... */ }
async function tryCatch(fn) { /* ... */ }

// Usage
const result = await tryCatch(() => fetch('https://api.example.com/data').then(r => r.json()));
if (!result.ok) {
  console.error('Failed:', result.error.message);
} else {
  console.log('Got:', result.value);
}`,
    solution: `function ok(value) { return { ok: true, value }; }
function err(error) { return { ok: false, error }; }

async function tryCatch(fn) {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// Extended: chain results
function map(result, fn) {
  return result.ok ? ok(fn(result.value)) : result;
}

// Usage
const result = await tryCatch(() =>
  fetch('https://api.example.com/data').then(r => {
    if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
    return r.json();
  })
);

if (!result.ok) {
  console.error('Failed:', result.error.message);
} else {
  const processed = map(result, data => data.items.filter(i => i.active));
  console.log('Active items:', processed.value);
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between an operational error and a programmer error?', options: ['Operational errors are in JavaScript; programmer errors are in C++', 'Operational errors are expected runtime failures; programmer errors are bugs in the code', 'Operational errors crash the process; programmer errors are recoverable', 'There is no real difference — both should be caught and logged'], answer: 1, explanation: 'Operational errors (404, DB timeout, validation failure) are expected and can be handled gracefully. Programmer errors (undefined access, wrong types) are bugs — the process should crash and restart rather than continue in a broken state.' },
    { q: 'Why do async Express 4 route handlers need asyncHandler?', options: ['Express 4 is synchronous by design', 'Express 4 does not catch errors thrown from async functions and forward to error middleware', 'async functions return undefined in Express', 'Error middleware is not supported in Express 4'], answer: 1, explanation: 'Express 4 was written before async/await. It does not wrap handler calls in try/catch. If an async handler throws, the error is an unhandled rejection — it never reaches error middleware. asyncHandler catches the rejected Promise and calls next(err).' },
    { q: 'What should you do after an uncaughtException event?', options: ['Log it and continue serving requests', 'Restart only the failed route', 'Exit the process — state is undefined', 'Convert it to an operational error and respond 500'], answer: 2, explanation: 'After an uncaughtException, the Node.js process is in an unknown state. Memory may be corrupt, resources may be leaked. Continuing to serve requests risks data corruption. Exit immediately and let the process manager (PM2, systemd) restart the process.' },
    { q: 'Where should Express error middleware be registered?', options: ['Before any routes', 'After every individual route', 'Last, after all routes and other middleware', 'In the route file alongside the route'], answer: 2, explanation: 'Express processes middleware in registration order. Error middleware (4-arg: err, req, res, next) must be registered last — after all routes and non-error middleware — so errors from any route can flow to it.' },
    { q: 'What is the difference between operational errors and programmer errors in Node.js?', options: ['They are the same — all errors should crash the process', 'Operational errors (DB down, bad input) are expected and recoverable; programmer errors (undefined is not a function) indicate bugs and should crash', 'Programmer errors should be caught with try/catch; operational errors should not', 'Only programmer errors should be logged'], answer: 1, explanation: 'Operational errors: DB connection refused, file not found, validation failed — part of normal system operation. Handle them gracefully, return error responses. Programmer errors: TypeError, ReferenceError, assertion failures — indicate a bug in the code. Crash and restart the process; do not try to recover from an undefined state.' },
    { q: 'What is the purpose of a custom AppError class extending Error?', options: ['Required by Node.js for proper stack traces', 'Adds structured fields (statusCode, isOperational, code) that error middleware uses to generate responses', 'Prevents errors from being swallowed by Express', 'Provides automatic retry logic'], answer: 1, explanation: 'Extending Error lets you attach statusCode (400, 404, 500), isOperational (true for expected errors), and error codes. Error middleware checks isOperational: if true, send the error message to the client; if false (programmer error), send a generic 500 and alert on-call. This separates client-facing messages from internal debugging.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use try/catch everywhere or let errors propagate?', a: 'Let errors propagate up to a single boundary: your error middleware (Express) or route-level handler (Fastify). Only catch when you can meaningfully handle the error — convert a DB "not found" to a 404 AppError, for example. Catching everywhere creates noise, hides bugs, and makes error context vague. The single error boundary pattern keeps handling consistent and logging centralised.' },
    { q: 'How do I handle errors in parallel async operations?', a: 'Promise.all rejects immediately on first failure — wrap it in try/catch at the call site. Promise.allSettled collects all results including failures — filter by { status: "rejected" } to find failures. For partial success (some succeed, some fail), use allSettled and handle each failure individually. Never use Promise.all when partial success is acceptable.' },
    { q: 'What error information is safe to return to clients?', a: "Operational errors: message, status code, and an error code (e.g. VALIDATION_ERROR) are safe and useful. Programmer errors: return only a generic '500 Internal Server Error' — never the stack trace, file paths, or error class name. A good rule: if the client can take action based on the error, include it; if it's internal system detail, hide it." },
    { q: 'What is the difference between operational errors and programmer errors in Node.js, and why does the distinction matter?', a: 'Operational errors are expected runtime conditions — a failed database connection, invalid user input, a timed-out external API call — that the application should catch, log, and recover from gracefully without crashing. Programmer errors are bugs — calling a function with the wrong argument types, a null reference, a logic error — that indicate the program is in an unknown, potentially corrupted state. The common guidance is: catch and handle operational errors normally, but let programmer errors crash the process (and restart cleanly via a process manager) rather than trying to "recover" from undefined behavior, which risks silent data corruption.' },
    { q: 'Why is it dangerous to continue running a Node.js process after an uncaughtException?', a: 'When an uncaughtException fires, the error already unwound the stack outside of any try/catch, meaning the process state is in an unknown condition — open file handles, half-completed writes, or corrupted in-memory caches may exist. The Node.js documentation explicitly recommends treating uncaughtException as a last-resort logging opportunity, then exiting the process (process.exit(1)) and relying on a process manager (PM2, Kubernetes) to restart it cleanly, rather than attempting to resume normal operation in a possibly-corrupted state.' },
    { q: 'How do you properly propagate errors through a chain of async/await calls without losing the original stack trace?', a: 'Use try/catch at the boundary where you can meaningfully handle the error (e.g., an Express error-handling middleware), and when re-throwing or wrapping an error, use the Error cause option (new Error("context message", { cause: originalError })) introduced in Node 16.9+ — this preserves the original error and its stack trace as a linked cause rather than discarding it, letting you add context without losing the root failure information needed for debugging.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Operational errors are expected — handle gracefully. Programmer errors are bugs — crash and restart. Use a single error boundary with asyncHandler + Express error middleware.',
    mustKnow: [
      'Operational vs programmer errors: handle vs crash.',
      'asyncHandler wraps async Express routes to forward errors to next(err).',
      'Error middleware is 4-arg (err, req, res, next) and registered last.',
      'process.on("unhandledRejection") and "uncaughtException" — log, exit(1).',
      'Custom AppError class: statusCode + isOperational flag.',
      'Never send stack traces to clients in production.',
      'Graceful shutdown: server.close() → drain DB/cache → exit.',
    ],
    interviewFocus: [
      'What is the difference between operational and programmer errors?',
      'Why does Express 4 require asyncHandler for async routes?',
      'How do you implement graceful shutdown in Node.js?',
    ]
  };
}
