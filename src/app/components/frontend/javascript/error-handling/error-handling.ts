import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-js-error-handling',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss',
})
export class JsErrorHandling {
  theory: TheoryPoint[] = [
    {
      heading: 'try / catch / finally',
      points: [
        '<code>try</code> wraps code that might throw. <code>catch(err)</code> receives the thrown value — it can be any type, not just an Error object. <code>finally</code> always runs whether or not an error occurred.',
        '<code>finally</code> is useful for cleanup: closing connections, releasing locks, hiding spinners. It runs even if <code>try</code> or <code>catch</code> has a <code>return</code> statement.',
        'Rethrowing: catch the error, do what you need, then <code>throw err</code> again to let it propagate. Only catch errors you can meaningfully handle.',
        'You can catch specific error types: <code>if (err instanceof TypeError)</code>. For others, rethrow. Don\'t use a blanket catch that swallows all errors silently.',
        '<code>try/catch</code> does NOT catch errors in async callbacks: <code>try { setTimeout(() => { throw new Error(); }, 0) } catch(e) {}</code> — the error escapes.',
      ]
    },
    {
      heading: 'Error Types',
      points: [
        'Built-in error types: <code>Error</code> (base), <code>TypeError</code> (wrong type), <code>ReferenceError</code> (undefined variable), <code>SyntaxError</code> (parse error), <code>RangeError</code> (value out of range), <code>URIError</code>, <code>EvalError</code>.',
        'All Error objects have <code>.message</code> (human-readable) and <code>.name</code> (type name). Modern environments also provide <code>.stack</code> — a string with the call stack at throw time.',
        'Create custom errors by extending Error: <code>class AppError extends Error { constructor(msg, code) { super(msg); this.name = "AppError"; this.code = code; } }</code>.',
        'Always set <code>this.name</code> in custom errors — <code>Error</code> base class sets it to "Error" automatically, but subclasses need to set it explicitly for meaningful error messages.',
      ]
    },
    {
      heading: 'Async Error Handling',
      points: [
        'For async functions, wrap <code>await</code> calls in <code>try/catch</code> — rejected Promises throw inside async functions.',
        'For Promise chains, add <code>.catch(err => ...)</code> at the end. Errors propagate through the chain until a <code>.catch</code> handles them.',
        '<strong>Global handlers:</strong> <code>window.onerror</code> catches uncaught synchronous errors. <code>window.addEventListener("unhandledrejection", e => ...)</code> catches unhandled Promise rejections.',
        'In Node.js: <code>process.on("uncaughtException", ...)</code> and <code>process.on("unhandledRejection", ...)</code> are last-resort handlers — log and exit gracefully, don\'t try to recover.',
        'The "error boundary" pattern in frameworks (React, Angular) catches errors in component trees to prevent the whole UI from crashing.',
      ]
    },
    {
      heading: 'Result Pattern (Error as Values)',
      points: [
        'Instead of throwing, return <code>{ data, error }</code> or <code>[data, error]</code>. The caller explicitly handles both paths without try/catch.',
        'This pattern is common in Go and is gaining popularity in TypeScript with discriminated unions: <code>type Result<T> = { ok: true; data: T } | { ok: false; error: Error }</code>.',
        'Benefits: errors are part of the type system, impossible to forget handling them, no hidden control flow from throws.',
        'Trade-off: more verbose, especially for deeply nested calls. Good fit for known failure modes (network errors, validation); throws are still appropriate for programmer errors (bugs).',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'try/catch/finally',       type: 'syntax',  desc: 'try: protected block; catch: handler; finally: always runs' },
    { name: 'throw new Error(msg)',    type: 'syntax',  desc: 'Throw any value — convention is Error or subclass' },
    { name: 'err.message',             type: 'accessor', desc: 'Human-readable error description' },
    { name: 'err.stack',               type: 'accessor', desc: 'Call stack string at throw time' },
    { name: 'err instanceof TypeError', type: 'operator', desc: 'Check specific error type before handling' },
    { name: 'class AppError extends Error', type: 'syntax', desc: 'Custom error — set this.name in constructor' },
    { name: 'window.onerror',          type: 'accessor', desc: 'Global handler for uncaught sync errors' },
    { name: 'unhandledrejection event', type: 'keyword', desc: 'Global handler for unhandled Promise rejections' },
    { name: 'err.cause',               type: 'accessor', desc: 'ES2022: chain errors with new Error(msg, { cause: originalErr })' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'try/catch Patterns',
      language: 'typescript',
      code: `// ── Basic try/catch/finally ───────────────────────────────────────────
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error('Parse failed:', err.message);
    return null;
  } finally {
    console.log('parseJSON called');  // always runs
  }
}

// ── Specific error type handling ──────────────────────────────────────
function processValue(val) {
  try {
    return val.toString().toUpperCase();
  } catch (err) {
    if (err instanceof TypeError) {
      return '';   // handle null/undefined gracefully
    }
    throw err;     // rethrow anything else
  }
}

// ── Rethrow pattern ────────────────────────────────────────────────────
class DatabaseError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'DatabaseError';
  }
}

async function getUser(id) {
  try {
    return await db.query('SELECT * FROM users WHERE id = ?', [id]);
  } catch (err) {
    throw new DatabaseError(\`Failed to fetch user \${id}\`, err);
    // Original error is accessible via err.cause
  }
}`,
    },
    {
      label: 'Custom Errors',
      language: 'typescript',
      code: `// ── Custom error hierarchy ───────────────────────────────────────────
class AppError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;  // 'AppError', 'ValidationError', etc.
    this.code = options.code ?? 'UNKNOWN';
    this.statusCode = options.statusCode ?? 500;
  }
}

class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: 400 });
    this.fields = fields;  // { fieldName: 'error message' }
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(\`\${resource} with id \${id} not found\`, {
      code: 'NOT_FOUND', statusCode: 404
    });
    this.resource = resource;
    this.id = id;
  }
}

// ── Using the hierarchy ───────────────────────────────────────────────
async function createUser(data) {
  const errors = {};
  if (!data.name) errors.name = 'Name is required';
  if (!data.email?.includes('@')) errors.email = 'Valid email required';
  if (Object.keys(errors).length) throw new ValidationError('Invalid user data', errors);

  return await db.insert('users', data);
}

// ── Handling in middleware / route handler ────────────────────────────
async function handleRequest(req, res) {
  try {
    const user = await createUser(req.body);
    res.json({ success: true, user });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
    } else {
      res.status(500).json({ error: 'Internal server error' });
      console.error('Unexpected error:', err);  // log unexpected errors
    }
  }
}`,
    },
    {
      label: 'Async Error Handling',
      language: 'typescript',
      code: `// ── async/await with try/catch ───────────────────────────────────────
async function fetchAndProcess(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    const data = await response.json();
    return processData(data);
  } catch (err) {
    if (err.name === 'AbortError') return null;  // cancelled — not an error
    throw err;   // propagate everything else
  }
}

// ── Global handlers ───────────────────────────────────────────────────
window.onerror = (msg, src, line, col, err) => {
  logToServer({ type: 'uncaught', msg, src, line, col, stack: err?.stack });
  return true;  // prevents default browser error handling
};

window.addEventListener('unhandledrejection', event => {
  logToServer({ type: 'unhandled-rejection', reason: event.reason });
  event.preventDefault();  // suppress console warning
});

// ── Result pattern (no throws) ────────────────────────────────────────
async function safeAsync(fn, ...args) {
  try {
    const data = await fn(...args);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

const { data: user, error } = await safeAsync(fetchUser, userId);
if (error) { showError(error.message); return; }
renderUser(user);

// ── Error chaining (ES2022) ───────────────────────────────────────────
try {
  await connectToDatabase();
} catch (dbErr) {
  throw new Error('Application startup failed', { cause: dbErr });
  // err.cause === dbErr — full chain preserved
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Swallowing errors silently',
      wrong: `try {
  processData();
} catch (e) {}  // silent swallow — you'll never know it failed`,
      right: `try {
  processData();
} catch (e) {
  console.error('processData failed:', e);
  throw e;  // or handle meaningfully
}`,
      explanation: 'Empty catch blocks hide bugs. Always at minimum log the error. Only catch errors you can meaningfully recover from; rethrow the rest.',
    },
    {
      title: 'Catching async errors with sync try/catch',
      wrong: `try {
  setTimeout(() => { throw new Error('async error'); }, 0);
} catch (e) {
  console.log('caught');  // never runs!
}`,
      right: `// Option 1: async function with await
async function run() {
  try { await delay(0); doRiskyThing(); } catch (e) { console.log('caught'); }
}
// Option 2: global unhandledrejection handler`,
      explanation: 'try/catch only catches synchronous errors. Errors thrown in setTimeout/setInterval callbacks are not caught by the surrounding try/catch.',
    },
    {
      title: 'Not setting this.name in custom errors',
      wrong: `class AppError extends Error {
  constructor(msg) { super(msg); }
}
new AppError('oops').name;  // "Error" not "AppError"`,
      right: `class AppError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'AppError';  // or: this.name = this.constructor.name
  }
}
new AppError('oops').name;  // "AppError"`,
      explanation: 'The Error base class sets name to "Error". Subclasses must explicitly set this.name to get meaningful names in stack traces and instanceof checks.',
    },
    {
      title: 'Using finally with a return that overrides catch',
      wrong: `function test() {
  try {
    throw new Error('fail');
  } catch (e) {
    return 'caught';
  } finally {
    return 'finally';  // overrides the catch return!
  }
}
test();  // "finally" — the 'caught' return is discarded`,
      right: `function test() {
  try {
    throw new Error('fail');
  } catch (e) {
    return 'caught';  // this returns correctly
  } finally {
    cleanup();  // cleanup only — no return here
  }
}`,
      explanation: 'A return in finally overrides any return or throw in try/catch. Only use finally for cleanup side effects, never for return values.',
    },
    {
      title: 'Throwing non-Error values',
      wrong: `throw 'something went wrong';  // string — no stack trace!
throw { code: 404, message: 'Not found' };  // object — no stack`,
      right: `throw new Error('something went wrong');
throw new NotFoundError('User', userId);  // custom Error subclass`,
      explanation: 'You can throw any value, but only Error instances have .stack for debugging. Always throw Error or subclasses for actionable error messages.',
    },
    {
      title: 'Forgetting to handle the error in Promise chains',
      wrong: `fetchData()
  .then(process)
  .then(save);  // if fetchData or process throws, it's an unhandled rejection`,
      right: `fetchData()
  .then(process)
  .then(save)
  .catch(err => {
    logger.error('Pipeline failed', err);
    showUserError('Failed to save. Please try again.');
  });`,
      explanation: 'Promise chains without .catch() create unhandled rejections. Errors silently propagate through the chain until caught — or until Node.js/browser log them.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Safe Fetch Wrapper',
    language: 'typescript',
    description: 'Implement `safeFetch(url, options)` that:\n- Returns `{ data, error, status }` (never throws)\n- Throws `NetworkError` if the request fails to connect\n- Throws `HttpError` with `.status` and `.body` if response is not ok (status >= 400)\n- Has a built-in 10-second timeout\n- Retries on 5xx errors up to 2 times with 1-second delay',
    hints: [
      'class NetworkError extends Error and class HttpError extends Error with status/body',
      'Use AbortController for the timeout',
      'Check response.ok — if false, read response text and throw HttpError',
      'Retry loop: catch 5xx HttpErrors, sleep 1s, retry up to 2 times',
    ],
    starterCode: `class NetworkError extends Error { /* ... */ }
class HttpError extends Error { /* ... */ }

async function safeFetch(url, options = {}) {
  // timeout, retry, structured error return
}

// Usage
const { data, error, status } = await safeFetch('/api/users');
if (error instanceof HttpError && error.status === 404) {
  showNotFound();
} else if (error) {
  showGenericError(error.message);
} else {
  renderUsers(data);
}`,
    solution: `class NetworkError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'NetworkError';
  }
}

class HttpError extends Error {
  constructor(status, body) {
    super(\`HTTP Error \${status}\`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

async function safeFetch(url, options = {}, retries = 2) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000));
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          const err = new HttpError(res.status, body);
          if (res.status >= 500 && attempt < retries) { lastError = err; continue; }
          throw err;
        }
        const data = await res.json();
        return { data, error: null, status: res.status };
      } catch (err) {
        if (err instanceof HttpError) throw err;
        if (err.name === 'AbortError') throw new NetworkError('Request timed out');
        throw new NetworkError('Network request failed', err);
      }
    }
    throw lastError;
  } catch (error) {
    return { data: null, error, status: error instanceof HttpError ? error.status : 0 };
  } finally {
    clearTimeout(timer);
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When does `finally` run?',
      options: [
        'Only when no error occurs',
        'Only when an error occurs',
        'Always — whether try succeeds or catch handles an error',
        'Only when the try block completes normally',
      ],
      answer: 2,
      explanation: 'finally always runs — after try completes normally, after catch handles an error, and even if try or catch have a return statement. Use it for cleanup.',
    },
    {
      q: 'Does try/catch catch errors thrown inside setTimeout?',
      options: [
        'Yes — it catches all errors from code inside try',
        'No — setTimeout callbacks run outside the current call stack',
        'Yes, but only for the first setTimeout',
        'Yes, if the setTimeout delay is 0',
      ],
      answer: 1,
      explanation: 'setTimeout callbacks run later in the event loop, outside the current call stack. The try/catch has already completed by then, so it cannot catch those errors.',
    },
    {
      q: 'What does `new Error("msg", { cause: originalErr })` provide?',
      options: [
        'Nothing — the second argument to Error is ignored',
        'error.cause = originalErr — chains errors for context',
        'It automatically logs originalErr',
        'It merges both error messages',
      ],
      answer: 1,
      explanation: 'ES2022 error cause: the second argument can have { cause } to chain errors. error.cause gives access to the original error, preserving the full context.',
    },
    {
      q: 'What is the best way to catch unhandled Promise rejections globally?',
      options: [
        'window.onerror',
        'try/catch around the entire script',
        'window.addEventListener("unhandledrejection", handler)',
        'process.on("uncaughtException", handler)',
      ],
      answer: 2,
      explanation: 'unhandledrejection is the event fired when a Promise rejects and no .catch() handles it. window.onerror only catches synchronous errors. In Node.js use process.on("unhandledRejection").',
    },
    {
      q: 'Why should custom errors set `this.name`?',
      options: [
        'Required by the JavaScript spec',
        'Without it, instanceof checks fail',
        'The base Error class sets name to "Error" — subclasses need to override it for accurate stack traces',
        'It enables the .stack property',
      ],
      answer: 2,
      explanation: 'Error base sets name to "Error". Subclasses inherit this unless they override it. Without setting this.name, all custom errors show as "Error" in stack traces, making debugging harder.',
    },
    {
      q: 'Which is not a built-in JavaScript error type?',
      options: ['RangeError', 'NetworkError', 'SyntaxError', 'EvalError'],
      answer: 1,
      explanation: 'NetworkError is not a built-in JavaScript error. The built-in types are: Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError. Network fetch failures use DOMException or a custom error depending on the API.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I throw vs return an error?',
      a: 'Throw for <strong>unexpected programmer errors</strong> (null when non-null expected, invalid arguments to internal APIs, violated invariants) — these represent bugs. Return errors (result pattern, <code>{ data, error }</code>) for <strong>expected operational failures</strong> (network errors, validation, not-found) where the caller should handle both paths. Frameworks like React Error Boundaries also influence this choice.',
    },
    {
      q: 'What is error.cause and when was it introduced?',
      a: '<code>error.cause</code> was introduced in ES2022 (Node.js 16.9+). Pass it as <code>new Error("msg", { cause: originalError })</code>. It lets you wrap and rethrow errors while preserving the original context — equivalent to Java\'s chained exceptions. Stack trace tools display the full chain.',
    },
    {
      q: 'How do I globally log all errors in a web app?',
      a: 'Two handlers: (1) <code>window.onerror</code> for uncaught synchronous errors — receives message, source, line, col, error object. (2) <code>window.addEventListener("unhandledrejection", e => ...)</code> for unhandled Promise rejections — receives <code>e.reason</code>. Send both to your error monitoring service (Sentry, Datadog). In a framework, combine with error boundaries for component-level errors.',
    },
    {
      q: 'What is the difference between throwing an Error and throwing a string?',
      a: 'Throwing an <code>Error</code> (or subclass) includes a stack trace, a <code>name</code>, and a <code>message</code> — making it inspectable in catch blocks and monitoring tools. Throwing a string gives you only the string — no stack trace, no type, nothing catch blocks can reliably inspect. Always throw <code>Error</code> instances or subclasses; never throw strings, numbers, or plain objects.',
    },
    {
      q: 'How does the finally block behave when a return statement is inside try or catch?',
      a: 'The <code>finally</code> block always runs, even if <code>try</code> or <code>catch</code> has a <code>return</code>. If <code>finally</code> itself has a <code>return</code>, it overrides the value returned by <code>try</code> or <code>catch</code>. This is usually a bug — avoid returning from <code>finally</code> unless intentional.',
    },
    {
      q: 'What does AggregateError represent and when is it thrown?',
      a: '<code>AggregateError</code> wraps multiple errors into one, with an <code>errors</code> array. It is thrown by <code>Promise.any()</code> when ALL promises reject — it packages all the rejection reasons together so you can inspect every failure, not just the first. You can also throw it manually when you want to report multiple validation errors at once.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Robust error handling: catch what you can handle, rethrow the rest, use custom Error subclasses with this.name and error.cause, and always handle async errors with try/catch or .catch().',
    mustKnow: [
      'finally always runs — do not put return in finally (it overrides try/catch return)',
      'try/catch does NOT catch async callback errors (setTimeout, setInterval)',
      'Custom errors: extend Error, set this.name = this.constructor.name',
      'error.cause (ES2022) chains errors without losing original context',
      'async: wrap await in try/catch; promises: always add .catch()',
      'Global: window.onerror (sync), unhandledrejection (promises)',
    ],
    interviewFocus: [
      'Explain try/catch/finally — what does finally guarantee?',
      'How do you create a custom error class? What must you remember to set?',
      'Why doesn\'t try/catch work for setTimeout errors? How do you handle them?',
      'Throw vs return error — when do you choose each approach?',
    ],
  };
}
