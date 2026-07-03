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
  selector: 'app-js-promises',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './promises.html',
  styleUrl: './promises.scss',
})
export class JsPromises {
  theory: TheoryPoint[] = [
    {
      heading: 'Promise States & Lifecycle',
      points: [
        'A Promise is an object representing an eventual value. It has three states: <strong>pending</strong> (initial), <strong>fulfilled</strong> (succeeded with a value), <strong>rejected</strong> (failed with a reason).',
        'Once settled (fulfilled or rejected), a Promise is immutable — it cannot change state. Calling <code>resolve</code> or <code>reject</code> more than once has no effect.',
        '<code>.then(onFulfilled, onRejected)</code> subscribes to a Promise. It always returns a NEW Promise, enabling chaining.',
        '<code>.catch(onRejected)</code> is shorthand for <code>.then(undefined, onRejected)</code>. <code>.finally(fn)</code> runs regardless of success or failure and does not receive the value.',
        'Promises are always asynchronous — even if resolved synchronously, <code>.then</code> callbacks run in the microtask queue (after the current synchronous code).',
      ]
    },
    {
      heading: 'async/await',
      points: [
        '<code>async function</code> always returns a Promise. If the function returns a non-Promise value, it\'s wrapped in <code>Promise.resolve(value)</code>.',
        '<code>await</code> pauses execution of the <code>async</code> function until the Promise settles, then returns the fulfilled value. It does NOT block the event loop.',
        'Error handling: wrap <code>await</code> calls in <code>try/catch</code> — rejected Promises throw inside async functions. Uncaught, they become unhandled rejections.',
        '<code>await</code> can be used on any "thenable" — not just native Promises. This enables interop with older Promise libraries.',
        'Top-level <code>await</code> is available in ES modules (not CommonJS) — lets you <code>await</code> at the module level without wrapping in an async function.',
      ]
    },
    {
      heading: 'Parallel & Race Patterns',
      points: [
        '<code>Promise.all(promises)</code> runs all in parallel and resolves when ALL fulfill. Rejects immediately if ANY rejects (fail-fast). Returns array of results in the same order.',
        '<code>Promise.allSettled(promises)</code> waits for ALL to settle regardless of outcome. Returns array of <code>{status, value/reason}</code> objects. Never rejects.',
        '<code>Promise.race(promises)</code> resolves/rejects with the first settled Promise. Useful for timeouts: race a request against a timeout Promise.',
        '<code>Promise.any(promises)</code> resolves with the first FULFILLED Promise. Rejects only if ALL reject (with AggregateError). Ignores rejections as long as one succeeds.',
        'Sequential vs parallel: <code>await a(); await b();</code> runs sequentially. <code>await Promise.all([a(), b()])</code> runs in parallel. The parallel version is often 2× faster.',
      ]
    },
    {
      heading: 'Promise Creation & Utilities',
      points: [
        'Create a Promise: <code>new Promise((resolve, reject) => { ... })</code>. Call <code>resolve(value)</code> to fulfill, <code>reject(reason)</code> to reject.',
        '<code>Promise.resolve(value)</code> creates an already-fulfilled Promise. <code>Promise.reject(reason)</code> creates an already-rejected one. Useful for normalizing values in APIs that may return sync or async results.',
        'Promisify callbacks: wrap callback-based APIs in a Promise so you can use await. Node.js has <code>util.promisify</code> for this.',
        'Avoid the "Promise constructor anti-pattern": don\'t wrap async code in <code>new Promise</code> — just return the async call directly.',
      ]
    },
    {
      heading: 'Promise Chaining and Error Propagation',
      points: [
        'Each <code>.then()</code> call returns a NEW promise, resolved with whatever the callback returns — this is what enables chaining (<code>.then(a).then(b).then(c)</code>), with each step receiving the previous step\'s resolved value.',
        'A single <code>.catch()</code> at the end of a chain catches an error from ANY preceding step — once an error occurs, subsequent <code>.then()</code> callbacks are skipped entirely until a <code>.catch()</code> (or the second argument of a <code>.then()</code>) handles it.',
        'Returning a promise from inside a <code>.then()</code> callback automatically "flattens" it — the outer chain waits for that inner promise to settle before continuing, rather than resolving immediately with a promise-wrapping-a-promise (avoiding manual nested <code>.then()</code> pyramids).',
        'A common mistake is forgetting to <code>return</code> inside a <code>.then()</code> callback that starts another async operation — without the return, the chain does not actually wait for that inner operation, breaking the intended sequential flow silently.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'new Promise((res,rej)=>{})', type: 'syntax',  desc: 'Create a Promise — call res to fulfill, rej to reject' },
    { name: 'promise.then(fn)',           type: 'method',  desc: 'Subscribe to fulfillment — returns new Promise' },
    { name: 'promise.catch(fn)',          type: 'method',  desc: 'Handle rejection — shorthand for .then(null, fn)' },
    { name: 'promise.finally(fn)',        type: 'method',  desc: 'Run fn on settle — no value passed, returns same promise' },
    { name: 'async function',            type: 'syntax',  desc: 'Always returns Promise; can use await inside' },
    { name: 'await promise',             type: 'syntax',  desc: 'Pause async fn until promise settles; returns value' },
    { name: 'Promise.all([...])',         type: 'method',  desc: 'Parallel — all must succeed; fails fast on any reject' },
    { name: 'Promise.allSettled([...])',  type: 'method',  desc: 'Parallel — waits for all; never rejects; [{status,value}]' },
    { name: 'Promise.race([...])',        type: 'method',  desc: 'Resolves/rejects with first settled promise' },
    { name: 'Promise.any([...])',         type: 'method',  desc: 'Resolves with first fulfilled; rejects only if ALL reject' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Promise Basics',
      language: 'typescript',
      code: `// ── Creating a Promise ───────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: 'Alice' });
      else reject(new Error('Invalid ID'));
    }, 100);
  });
}

// ── Chaining .then ────────────────────────────────────────────────────
fetchUser(1)
  .then(user => user.name.toUpperCase())   // "ALICE"
  .then(name => \`Hello, \${name}!\`)        // "Hello, ALICE!"
  .then(msg  => console.log(msg))
  .catch(err => console.error(err.message))
  .finally(()=> console.log('done'));

// ── Error propagation ─────────────────────────────────────────────────
fetchUser(-1)
  .then(user => user.name)      // skipped — rejected
  .then(name => name.toUpper()) // skipped
  .catch(err => console.error(err.message))  // "Invalid ID" caught here`,
    },
    {
      label: 'async/await',
      language: 'typescript',
      code: `// ── Basic async/await ────────────────────────────────────────────────
async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    const posts = await fetchPosts(user.id);
    return { user, posts };
  } catch (err) {
    console.error('Failed:', err.message);
    throw err;  // re-throw if caller needs to handle
  }
}

// ── Sequential vs parallel ────────────────────────────────────────────
async function loadDataSlowly() {
  const user  = await fetchUser(1);   // waits
  const posts = await fetchPosts(1);  // then waits again
  // Total time: time(user) + time(posts)
}

async function loadDataFast() {
  const [user, posts] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
  ]);
  // Total time: max(time(user), time(posts)) — parallel!
}

// ── Await in loops ────────────────────────────────────────────────────
// ❌ Sequential — each awaits before next starts
async function processAllSlowly(ids) {
  for (const id of ids) {
    const user = await fetchUser(id);
    console.log(user);
  }
}

// ✓ Parallel — all requests fire at once
async function processAllFast(ids) {
  const users = await Promise.all(ids.map(id => fetchUser(id)));
  users.forEach(u => console.log(u));
}

// ── Timeout with Promise.race ─────────────────────────────────────────
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

const user = await withTimeout(fetchUser(1), 5000);`,
    },
    {
      label: 'Promise Combinators',
      language: 'typescript',
      code: `const p1 = fetch('/api/user');
const p2 = fetch('/api/posts');
const p3 = fetch('/api/comments');

// ── Promise.all ───────────────────────────────────────────────────────
// All must succeed; first rejection rejects the whole thing
try {
  const [user, posts, comments] = await Promise.all([p1, p2, p3]);
} catch (err) {
  // If any of p1/p2/p3 rejects, this catches it
}

// ── Promise.allSettled ────────────────────────────────────────────────
// All settle regardless; inspect each result
const results = await Promise.allSettled([p1, p2, p3]);
for (const r of results) {
  if (r.status === 'fulfilled') console.log('OK', r.value);
  else console.error('FAIL', r.reason);
}

// ── Promise.any ───────────────────────────────────────────────────────
// First success wins; useful for racing fallback servers
const fastest = await Promise.any([
  fetch('https://server1.example.com/api'),
  fetch('https://server2.example.com/api'),
  fetch('https://server3.example.com/api'),
]);

// ── Promise.race ──────────────────────────────────────────────────────
// First settled wins (even if rejected)
async function fetchOrCache(key, fetchFn, cacheFn) {
  return Promise.race([fetchFn(), cacheFn()]);
}`,
    },
    {
      label: 'Promisify & Patterns',
      language: 'typescript',
      code: `// ── Promisify callback API ───────────────────────────────────────────
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
// Node.js: const { promisify } = require('util');
// const readFile = promisify(fs.readFile);

// ── Promise.resolve shortcut ──────────────────────────────────────────
function getConfig(useCache) {
  if (useCache) return Promise.resolve(cachedConfig);  // sync, wrapped in Promise
  return fetch('/api/config').then(r => r.json());
}
// Callers always await getConfig() — works both ways

// ── Avoid constructor anti-pattern ───────────────────────────────────
// ❌ wrapping a promise in a promise
async function badWrap() {
  return new Promise(async (resolve) => {
    const data = await fetch('/api');  // unhandled rejection risk!
    resolve(data);
  });
}

// ✓ just return the async chain
async function goodWrap() {
  return fetch('/api');
}

// ── Retry with exponential backoff ────────────────────────────────────
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url); }
    catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * 2 ** i));
    }
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Floating promises (not awaiting)',
      wrong: `async function saveUser(user) {
  db.save(user);      // not awaited — errors silently swallowed!
  return 'saved';
}`,
      right: `async function saveUser(user) {
  await db.save(user);  // errors propagate correctly
  return 'saved';
}`,
      explanation: 'Not awaiting a promise creates a "floating" promise — errors are silently ignored, and the function returns before the async work completes.',
    },
    {
      title: 'Sequential await in loop instead of parallel',
      wrong: `// Takes 3 × fetchTime instead of 1 × fetchTime
for (const id of ids) {
  const user = await fetchUser(id);  // each waits for the previous
}`,
      right: `const users = await Promise.all(ids.map(id => fetchUser(id)));`,
      explanation: 'Sequential await in a loop is usually wrong — each request waits for the previous. Use Promise.all for parallel execution when requests are independent.',
    },
    {
      title: 'Missing catch on Promise chain',
      wrong: `fetchUser(id)
  .then(user => processUser(user))
  .then(result => save(result));
// Unhandled rejection if any step throws`,
      right: `fetchUser(id)
  .then(user => processUser(user))
  .then(result => save(result))
  .catch(err => console.error('Pipeline failed:', err));`,
      explanation: 'Without .catch(), rejected promises produce "UnhandledPromiseRejection" warnings and may crash Node.js. Always add .catch() or use async/await with try/catch.',
    },
    {
      title: 'Promise constructor anti-pattern',
      wrong: `return new Promise(async (resolve, reject) => {
  const data = await fetch(url);  // if fetch rejects, reject() is never called!
  resolve(data);
});`,
      right: `return fetch(url);  // just return the promise chain directly`,
      explanation: 'Wrapping async code in new Promise is the constructor anti-pattern. Errors inside the async executor may go unhandled. Always return the promise chain directly.',
    },
    {
      title: 'Forgetting Promise.all rejects immediately on first failure',
      wrong: `// You think you handle all errors but Promise.all fails fast
const results = await Promise.all([fetchUser(), fetchPosts(), fetchComments()]);
// If fetchPosts() rejects, fetchUser/fetchComments results are lost`,
      right: `// Use allSettled when you want ALL results regardless of failures
const results = await Promise.allSettled([fetchUser(), fetchPosts(), fetchComments()]);
const successes = results.filter(r => r.status === 'fulfilled').map(r => r.value);`,
      explanation: 'Promise.all fails fast on first rejection, discarding other results. Use Promise.allSettled when you need results from all promises even if some fail.',
    },
    {
      title: 'Using async where sync works (over-engineering)',
      wrong: `async function add(a, b) {
  return a + b;  // unnecessary async — wraps in Promise for no reason
}`,
      right: `function add(a, b) { return a + b; }
// Only use async when you actually need await inside`,
      explanation: 'async wraps the return value in a Promise. If you don\'t use await, don\'t use async — it just forces callers to await an unnecessarily wrapped value.',
    },
  ];

  challenge: Challenge = {
    title: 'Promise Queue with Concurrency Limit',
    language: 'typescript',
    description: 'Implement `runWithConcurrency(tasks, limit)` — given an array of async task functions and a concurrency limit, run them so that at most `limit` tasks run at the same time. Return a Promise resolving to all results in the original order.',
    hints: [
      'Start with the first `limit` tasks simultaneously',
      'When any task completes, start the next pending task',
      'Track results by index to preserve order',
      'Use a counter to know which task to start next',
    ],
    starterCode: `async function runWithConcurrency(tasks, limit) {
  // Run at most \`limit\` tasks simultaneously
  // Return array of results in original order
}

// Test
const makeTask = (id, ms) => async () => {
  await new Promise(r => setTimeout(r, ms));
  console.log(\`Task \${id} done\`);
  return id;
};

const tasks = [
  makeTask(1, 100), makeTask(2, 50), makeTask(3, 200),
  makeTask(4, 30),  makeTask(5, 150),
];

runWithConcurrency(tasks, 2).then(results => {
  console.log(results);  // [1, 2, 3, 4, 5] in original order
});`,
    solution: `async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does async function always return?',
      options: ['The return value directly', 'A Promise wrapping the return value', 'undefined', 'A callback'],
      answer: 1,
      explanation: 'async functions always return a Promise. If you return a non-Promise value, it\'s wrapped in Promise.resolve(). This makes all async functions consistently awaitable.',
    },
    {
      q: 'What does Promise.all() do if one promise rejects?',
      options: [
        'Ignores the rejection and waits for others',
        'Immediately rejects with that error (fail-fast)',
        'Returns the rejection in the results array',
        'Retries the rejected promise',
      ],
      answer: 1,
      explanation: 'Promise.all() fails fast — if any promise rejects, the whole Promise.all() rejects immediately with that error, regardless of other pending promises.',
    },
    {
      q: 'Which combinator waits for ALL promises and never rejects?',
      options: ['Promise.all', 'Promise.race', 'Promise.allSettled', 'Promise.any'],
      answer: 2,
      explanation: 'Promise.allSettled() waits for all promises to settle (regardless of success or failure) and returns [{status, value/reason}] for each. It never rejects.',
    },
    {
      q: 'How do you handle a rejected promise in async/await?',
      options: [
        '.catch() on the async function call',
        'try/catch around the await expression',
        'Both are valid',
        'You cannot — async/await doesn\'t support error handling',
      ],
      answer: 2,
      explanation: 'Both work: try/catch around await inside the async function, or .catch() on the Promise returned by the async function. Use try/catch for inline handling, .catch() for the caller.',
    },
    {
      q: 'Running `await a(); await b();` vs `await Promise.all([a(), b()])` — what\'s the difference?',
      options: [
        'No difference — both run in parallel',
        'Sequential vs parallel — Promise.all can be 2× faster for independent tasks',
        'Promise.all is slower because of overhead',
        'await a(); await b(); runs in parallel too',
      ],
      answer: 1,
      explanation: 'Sequential await waits for each to finish before starting the next. Promise.all starts all simultaneously, taking max(a, b) time instead of time(a) + time(b).',
    },
    {
      q: 'What is the difference between Promise.all and Promise.allSettled?',
      options: ['No difference', 'Promise.all rejects on the first rejection; allSettled waits for all and reports each result', 'Promise.allSettled is faster', 'Promise.all waits for all even if one rejects'],
      answer: 1,
      explanation: 'Promise.all short-circuits on the first rejection, discarding other results. Promise.allSettled always waits for every promise and returns an array of { status: "fulfilled"|"rejected", value/reason } objects — useful when you want results even if some fail.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'If you use Promise.all and one promise rejects, do the OTHER still-pending promises get cancelled?',
      a: 'No — this is a common misconception. JavaScript promises have no cancellation mechanism built in. Promise.all rejecting immediately just means the .catch()/await site stops waiting and moves on; the other promises keep running to completion (or eventual rejection) in the background, and any side effects they were performing (network requests, timers, writes) still happen — they are simply no longer being awaited by that particular Promise.all call. If you genuinely need to abort in-flight work, that requires an explicit mechanism like AbortController, not just Promise.all rejecting.',
    },
    {
      q: 'What is an unhandled promise rejection?',
      a: 'When a Promise rejects and no <code>.catch()</code> or <code>try/catch</code> handles it. In browsers, this fires the <code>unhandledrejection</code> event. In Node.js, it causes a warning and (in newer versions) terminates the process. Always handle rejections — floating promises with unhandled errors are silent bugs.',
    },
    {
      q: 'Can I use await outside an async function?',
      a: 'Yes — in ES modules (files with <code>type: "module"</code> in package.json or <code>.mjs</code> extension), you can use <code>await</code> at the top level without wrapping in <code>async function</code>. This is called top-level await. In CommonJS modules (<code>require()</code> style), top-level await is not available.',
    },
    {
      q: 'What does Promise.any() do and when would you use it?',
      a: '<code>Promise.any()</code> resolves as soon as the FIRST promise fulfills, ignoring rejections. If ALL reject, it rejects with an <code>AggregateError</code>. Use it for "race to success" scenarios: fetch the same resource from multiple CDN endpoints, and use whichever responds first successfully. Contrast with <code>Promise.race()</code> which settles on the first outcome — fulfilled OR rejected.',
    },
    {
      q: 'How do you cancel a fetch request in JavaScript?',
      a: 'Use <code>AbortController</code>: <code>const ctrl = new AbortController(); fetch(url, { signal: ctrl.signal })</code>. Call <code>ctrl.abort()</code> to cancel — the fetch rejects with an <code>AbortError</code>. Check the signal in the catch block: <code>if (err.name === "AbortError") return</code>. Useful for cancelling stale requests on component unmount or user navigation.',
    },
    {
      q: 'What is Promise chaining and what is the pitfall of not returning from .then()?',
      a: 'Each <code>.then()</code> returns a new Promise. If the callback returns a value, the next <code>.then()</code> receives it. If it returns a Promise, the chain waits for it. The pitfall: if you forget to <code>return</code> from a <code>.then()</code>, the chain receives <code>undefined</code> instead of the inner value — a common source of "why is my data undefined?" bugs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Promises represent eventual values — async/await makes them readable as synchronous code; always await or chain .catch(), use Promise.all for parallel, Promise.allSettled when partial failures are acceptable.',
    mustKnow: [
      'Promise states: pending → fulfilled | rejected — immutable once settled',
      'async function always returns Promise; await pauses without blocking event loop',
      'Promise.all: parallel, fail-fast; Promise.allSettled: parallel, never rejects',
      'Sequential await in loops is usually wrong — use Promise.all for independence',
      'Always handle rejections — unhandled rejections are silent bugs in production',
      'Promise.race: first settled wins; Promise.any: first fulfilled wins',
    ],
    interviewFocus: [
      'Difference between Promise.all, Promise.allSettled, Promise.race, and Promise.any',
      'Sequential vs parallel await — when to use each',
      'What is an unhandled promise rejection and how do you prevent it?',
      'Implement a retry-with-backoff utility using async/await',
    ],
  };
}
