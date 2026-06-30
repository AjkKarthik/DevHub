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
  selector: 'app-node-promises-async',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './promises-async.html',
  styleUrl: './promises-async.scss'
})
export class NodePromisesAsync {
  quickRef: QuickRefItem[] = [
    { name: 'util.promisify()', type: 'function', desc: 'Converts error-first callback functions to Promise-based.' },
    { name: 'Promise.all()', type: 'function', desc: 'Runs promises concurrently — resolves when all resolve, rejects on first failure.' },
    { name: 'Promise.allSettled()', type: 'function', desc: 'Like Promise.all but never rejects — returns array of {status, value/reason}.' },
    { name: 'Promise.race()', type: 'function', desc: 'Resolves/rejects as soon as the first promise settles.' },
    { name: 'Promise.any()', type: 'function', desc: 'Resolves on first success, rejects only if ALL reject (AggregateError).' },
    { name: 'AbortController', type: 'class', desc: 'Cancel async operations with abort signal: fetch(url, { signal: controller.signal }).' },
    { name: 'for await...of', type: 'syntax', desc: 'Iterate async iterables: streams, async generators, paginated API results.' },
    { name: 'process.on("unhandledRejection")', type: 'function', desc: 'Catch missed .catch() — log and exit in production.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Async/Await and Error Handling',
      points: [
        'async/await is syntactic sugar over Promises. An async function always returns a Promise. await pauses execution until the Promise settles — but only within the async function, not the event loop.',
        'Every await can throw. Wrap in try/catch or let errors propagate up the call chain. In Express routes, use next(err) in the catch. In top-level async functions, attach .catch() handlers.',
        'Top-level await is available in ES Modules (Node.js 14.8+): await db.connect() at the top level of a .mjs file or "type":"module" package. In CJS, wrap in an IIFE: (async () => { await connect(); })().',
        'unhandledRejection: always add process.on("unhandledRejection", (err) => { logger.fatal(err); process.exit(1); }). In Node 15+, unhandled rejections crash the process by default. In older versions, they silently swallow the error.',
      ]
    },
    {
      heading: 'Promise Combinators',
      points: [
        'Promise.all([a, b, c]): runs all concurrently. Resolves when ALL resolve. Rejects immediately if any one rejects. Use when all are required and failure of one should abort the batch.',
        'Promise.allSettled([a, b, c]): runs all concurrently. Always resolves with an array of { status: "fulfilled"|"rejected", value|reason }. Use when you need all results regardless of individual failures.',
        'Promise.race([a, b]): settles as soon as the first promise settles (resolved OR rejected). Classic use: timeout pattern — race(fetch(url), delay(5000).then(() => { throw new Error("timeout") })).',
        'Promise.any([a, b, c]): resolves with the first success. Only rejects if ALL reject (returns AggregateError). Use for racing fallback sources (try primary, then backup).',
      ]
    },
    {
      heading: 'Async Iterators and util.promisify',
      points: [
        'util.promisify(fn) wraps a Node.js error-first callback (err, result) into a Promise. Works with all Node.js core callback APIs. Custom promisify: use util.promisify.custom symbol to define non-standard behaviour.',
        'for await...of works with any async iterable: readable streams, async generators, database cursors, paginated API results. It processes items one at a time — not in parallel. Use Promise.all inside the loop for parallel processing.',
        'Async generators: async function*() { yield value; } combined with for await...of enable memory-efficient processing of large sequences without loading all data at once.',
        'AsyncLocalStorage (node:async_hooks): pass context (request ID, user) through async call chains without explicit parameter passing. Ideal for logging correlation IDs.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Promise combinators',
      language: 'typescript',
      code: `// Run 3 DB queries concurrently (all required)
const [user, orders, preferences] = await Promise.all([
  db.users.findById(id),
  db.orders.findByUser(id),
  db.preferences.findByUser(id),
]);
// If any fails, the whole thing rejects

// Run 3 queries but collect all results (some may fail)
const results = await Promise.allSettled([
  emailService.send(email1),
  emailService.send(email2),
  emailService.send(email3),
]);
const failures = results.filter(r => r.status === 'rejected');
console.log(\`\${failures.length} emails failed\`);

// Timeout pattern using Promise.race
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(\`Timeout after \${ms}ms\`)), ms)
  );
  return Promise.race([promise, timeout]);
}
const data = await withTimeout(fetchFromSlowAPI(), 5000);

// Primary + backup source using Promise.any
const result = await Promise.any([
  fetchFromPrimary(url),
  fetchFromBackup(url),
]).catch(err => {
  // AggregateError if ALL fail
  throw new Error('All sources failed');
});`
    },
    {
      label: 'util.promisify and async generators',
      language: 'typescript',
      code: `import { promisify } from 'node:util';
import { readFile } from 'node:fs';
import { createConnection } from 'node:net';

// Promisify callback-based API
const readFileAsync = promisify(readFile);
const content = await readFileAsync('data.txt', 'utf8');

// Async generator for paginated results
async function* fetchAllPages(url) {
  let cursor = null;
  do {
    const page = await fetch(\`\${url}?cursor=\${cursor}\`).then(r => r.json());
    yield* page.items;          // yield each item
    cursor = page.nextCursor;
  } while (cursor);
}

// Process all pages without loading everything into memory
for await (const item of fetchAllPages('https://api.example.com/items')) {
  await processItem(item); // one at a time
}

// Parallel processing with async iterables
const CONCURRENCY = 5;
async function processParallel(iterable, fn) {
  const batch = [];
  for await (const item of iterable) {
    batch.push(fn(item));
    if (batch.length >= CONCURRENCY) {
      await Promise.all(batch.splice(0)); // drain batch
    }
  }
  await Promise.all(batch); // remaining
}`
    },
    {
      label: 'AsyncLocalStorage for correlation IDs',
      language: 'typescript',
      code: `import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const requestStore = new AsyncLocalStorage();

// Middleware: start a new async context per request
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  requestStore.run({ requestId }, () => {
    res.setHeader('x-request-id', requestId);
    next();
  });
});

// Logger reads from the async context — no req parameter needed!
function log(message) {
  const store = requestStore.getStore();
  const requestId = store?.requestId ?? 'no-context';
  console.log(JSON.stringify({ requestId, message, time: new Date() }));
}

// Now any function in the request's async call chain can log with the ID
app.get('/users/:id', async (req, res) => {
  log('Fetching user');               // logs with correct requestId automatically
  const user = await userService.get(req.params.id);
  log('User fetched');
  res.json(user);
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Parallel work done sequentially with await in a loop',
      wrong: 'for (const id of ids) { results.push(await fetchUser(id)); } // sequential!',
      right: 'const results = await Promise.all(ids.map(id => fetchUser(id))); // concurrent',
      explanation: 'await in a for loop runs each fetch sequentially — 10 requests × 100ms = 1 second. Promise.all runs them concurrently — 10 requests take ~100ms total.'
    },
    {
      title: 'No unhandledRejection handler in production',
      wrong: '// No global handler — silent rejections in Node.js 14 and below',
      right: 'process.on("unhandledRejection", (err) => { logger.fatal(err); process.exit(1); });',
      explanation: 'In Node 14 and below, unhandled promise rejections are silently ignored. A rejected DB connection or API call disappears. Always add a global handler that logs and exits — the process manager will restart it.'
    },
    {
      title: 'Mixing .then() and async/await in the same chain',
      wrong: 'async function get() { return fetch(url).then(r => r.json()); } // inconsistent style',
      right: 'async function get() { const r = await fetch(url); return r.json(); }',
      explanation: 'Mixing .then() inside async functions is syntactically valid but confusing. Error handling differs between then/catch chains and try/catch. Pick one style per function.'
    },
    {
      title: 'Forgetting to await an async function call',
      wrong: 'async function save() { db.insert(data); return "done"; } // insert may not have finished',
      right: 'async function save() { await db.insert(data); return "done"; }',
      explanation: 'Without await, the Promise from db.insert() is ignored. The function returns before the insert completes. The insert may fail silently or run after the response is sent.'
    },
  ];

  challenge: Challenge = {
    title: 'Concurrent Rate-Limited Processor',
    language: 'typescript',
    description: 'Implement processConcurrently(items, fn, concurrency) that processes items by calling fn(item) with at most `concurrency` concurrent calls at any time. As soon as one slot frees up, the next item starts. Return an array of results in the same order as input. Handle rejections by including the error in the result array (don\'t abort the batch).',
    hints: [
      'Use a queue and track active count.',
      'Promise.allSettled can help if you want to handle per-item errors.',
      'Alternatively, maintain a pool of "slots" using a semaphore pattern.',
    ],
    starterCode: `async function processConcurrently(items, fn, concurrency = 5) {
  // TODO: process items with max concurrency slots
  // Return results in order (Promise<PromiseSettledResult[]>)
}

// Test: 10 items, 3 at a time, each takes ~100ms
const results = await processConcurrently(
  [1,2,3,4,5,6,7,8,9,10],
  async n => { await delay(100); return n * 2; },
  3
);
console.log(results); // [{status:'fulfilled',value:2}, ...]`,
    solution: `async function processConcurrently(items, fn, concurrency = 5) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i]) };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Promise.allSettled() do that Promise.all() does not?', options: ['Runs promises sequentially', 'Always resolves — collects all results including rejections', 'Cancels remaining promises on first rejection', 'Returns only successful results'], answer: 1, explanation: 'Promise.all rejects immediately on any failure. Promise.allSettled waits for ALL promises and returns { status, value/reason } for each — never rejects itself. Use when you need all results regardless of individual failures.' },
    { q: 'What is the problem with "await in a for loop"?', options: ['It is a syntax error', 'It causes memory leaks', 'Iterations run sequentially instead of concurrently', 'It does not work with arrays'], answer: 2, explanation: 'await in a for loop pauses the loop body — each iteration waits for the previous to complete. 10 async ops run in series. Use Promise.all(array.map(fn)) for concurrent execution.' },
    { q: 'What does util.promisify() do?', options: ['Converts a Promise to a callback', 'Wraps an error-first callback function into a Promise-returning function', 'Validates Promise chains', 'Creates a new Promise constructor'], answer: 1, explanation: 'util.promisify() converts Node.js-style callback functions (err, result) into async functions that return Promises. Works with all core Node.js APIs that follow the error-first callback convention.' },
    { q: 'What happens to an unhandled Promise rejection in Node.js 15+?', options: ['It is silently ignored', 'The process crashes with UnhandledPromiseRejection', 'It is retried automatically', 'The rejection becomes null'], answer: 1, explanation: 'Node.js 15+ treats unhandled rejections as fatal — the process exits with a non-zero code. Earlier versions emitted a warning but continued. Always add process.on("unhandledRejection") in production.' },
    { q: 'What does Promise.allSettled() do differently from Promise.all()?', options: ['allSettled is faster for many promises', 'allSettled waits for all promises to complete (fulfilled or rejected) and returns all results; all() rejects immediately on first failure', 'allSettled only returns fulfilled promises', 'Promise.all() is deprecated in Node 18+'], answer: 1, explanation: 'Promise.all([p1,p2,p3]) short-circuits on the first rejection — you lose the results of the others. Promise.allSettled() waits for ALL promises regardless of outcome and returns [{status:"fulfilled",value:...}, {status:"rejected",reason:...}]. Use allSettled when you need results from all promises even if some fail (batch operations, parallel API calls).' },
    { q: 'What is the difference between async/await and Promise chaining?', options: ['async/await is faster at runtime', 'They compile to the same microtask mechanism; async/await is syntactic sugar that produces more readable sequential-looking code', 'Promise chaining handles errors better', 'async/await cannot be used in loops'], answer: 1, explanation: 'async/await is syntactic sugar over Promises — at runtime, both use the same microtask queue. await pauses the function and resumes when the promise settles, but does not block the event loop. async/await is more readable for sequential async operations and makes error handling with try/catch feel natural. Both are correct — prefer async/await for readability.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use Promise.all vs Promise.allSettled?', a: 'Promise.all: when all operations must succeed and a single failure should abort the batch (loading all user dependencies for a page). Promise.allSettled: when you want all results and can handle individual failures gracefully (sending batch emails — collect failures, report later; processing a list where some items may fail independently).' },
    { q: 'What is AsyncLocalStorage and when should I use it?', a: 'AsyncLocalStorage (node:async_hooks) provides context propagation through async call chains — without passing parameters down every function. Use it for: request ID/correlation ID in logging, per-request caching, database transaction context, user identity. Every async operation spawned in requestStore.run(ctx, fn) can access the context with requestStore.getStore().' },
    { q: 'How do I implement a timeout for an async operation?', a: 'Use Promise.race with a timeout promise: race([operation, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))]). Or use AbortController: const ac = new AbortController(); setTimeout(() => ac.abort(), ms); await fetch(url, { signal: ac.signal }). AbortController is cleaner as it cancels the operation, not just ignores its result.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'async/await is Promise sugar — Promise.all for concurrency, Promise.allSettled for resilient batches, util.promisify for callbacks, and always handle unhandledRejection.',
    mustKnow: [
      'await in a for loop is sequential — use Promise.all(items.map(fn)) for concurrency.',
      'Promise.all rejects on first failure; Promise.allSettled collects all outcomes.',
      'util.promisify converts Node.js error-first callbacks to Promises.',
      'Add process.on("unhandledRejection") to log and exit — do not swallow errors.',
      'for await...of iterates async iterables one at a time.',
      'AsyncLocalStorage propagates context (request ID) through async chains.',
    ],
    interviewFocus: [
      'What is the difference between Promise.all and Promise.allSettled?',
      'How do you run 100 async operations with at most 5 concurrent?',
      'What happens with unhandled Promise rejections in Node.js 15+?',
    ]
  };
}
