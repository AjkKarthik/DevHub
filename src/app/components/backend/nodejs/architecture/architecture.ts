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
  selector: 'app-node-architecture',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './architecture.html',
  styleUrl: './architecture.scss'
})
export class NodeArchitecture {
  quickRef: QuickRefItem[] = [
    { name: 'Event Loop', type: 'keyword', desc: 'Single-threaded loop that processes JS callbacks in phases: timers, I/O callbacks, poll, check, close.' },
    { name: 'libuv', type: 'keyword', desc: 'C library providing async I/O, thread pool (4 threads), and the event loop implementation.' },
    { name: 'V8', type: 'keyword', desc: "Google's JavaScript engine — compiles JS to machine code, manages the heap and call stack." },
    { name: 'Thread Pool', type: 'keyword', desc: 'libuv thread pool (default 4) handles blocking I/O: fs, crypto, dns.lookup, zlib.' },
    { name: 'process.nextTick()', type: 'function', desc: 'Queues callback to run after current operation, before any I/O events.' },
    { name: 'setImmediate()', type: 'function', desc: 'Runs callback in the check phase — after I/O, before timers on the next loop.' },
    { name: 'UV_THREADPOOL_SIZE', type: 'keyword', desc: 'Env var to increase thread pool size (max 128) for CPU-heavy I/O workloads.' },
    { name: 'Call Stack', type: 'keyword', desc: 'LIFO stack of V8 — JS executes here synchronously. Blocking it blocks everything.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Event Loop and Non-blocking I/O',
      points: [
        'Node.js is single-threaded for JavaScript execution but uses libuv to offload I/O operations to the OS or a thread pool. When I/O completes, libuv pushes the callback to the event queue. The event loop picks it up when the call stack is empty.',
        'Event loop phases in order: Timers (setTimeout/setInterval) → Pending I/O callbacks → Idle/Prepare → Poll (fetch new I/O) → Check (setImmediate) → Close callbacks. Between each phase, nextTick queue and microtasks (Promises) run.',
        'process.nextTick() callbacks run before the next event loop phase — they drain the nextTick queue completely. Promise .then() callbacks run from the microtask queue, which also runs between phases. Both are faster than setImmediate.',
        'The poll phase is where Node waits for I/O: if the queue is empty and no timers are pending, it blocks here until I/O arrives. This is Node.js\'s "wait" mode.',
      ]
    },
    {
      heading: 'V8 Engine and the Thread Pool',
      points: [
        'V8 compiles JavaScript to native machine code using JIT compilation. It manages the heap (object allocation) and garbage collects automatically. V8 runs exclusively on the main thread — all JavaScript is single-threaded.',
        'libuv\'s thread pool handles: file system operations (fs.*), crypto (hashing, pbkdf2), zlib (compression), and dns.lookup(). Network I/O (TCP, HTTP) is handled by the OS asynchronously — no thread pool needed.',
        'Default thread pool size is 4. If you run 5 simultaneous fs.readFile() calls, 4 start immediately and the 5th waits. Set UV_THREADPOOL_SIZE=8 (before Node starts) for workloads with many concurrent file or crypto operations.',
        'Never block the event loop: avoid synchronous fs (readFileSync), CPU-heavy crypto (scryptSync), large JSON.parse on the main thread, or long loops. These freeze all requests.',
      ]
    },
    {
      heading: 'Concurrency Without Threads',
      points: [
        'Node.js handles thousands of concurrent connections with a single thread by never waiting synchronously. Each request registers callbacks and returns. The event loop continuously picks up completed I/O and runs callbacks.',
        'CPU-bound work is the exception: heavy computation (image resizing, ML inference, complex sorting) blocks the event loop. Solutions: Worker Threads (true parallelism), child_process (separate Node process), or offload to a background service.',
        'Node.js excels at I/O-bound work: REST APIs, proxies, real-time servers, microservices. It is not the right choice as the primary processor for CPU-intensive pipelines.',
      ]
    },
    {
      heading: 'Choosing an Architectural Style',
      points: [
        'Monolith-first is not a legacy anti-pattern — for small teams and unproven products, a well-modularized monolith ships faster and is far easier to debug than a distributed system, because there is only one process to trace a request through.',
        'Modular monolith: enforce internal boundaries (no direct cross-module database access, explicit interfaces between domains) using folder structure and lint rules even without physical service separation — this keeps the option to split into real services open later without a rewrite.',
        'Microservices trade development simplicity for operational flexibility: independent deployability and scaling per service come at the cost of distributed tracing, network reliability handling, and eventual-consistency data modeling that a monolith never has to think about.',
        'The deciding factor is usually organizational, not technical — Conway\'s Law observes that system architecture tends to mirror team communication structure. Splitting services along team boundaries (not arbitrary technical lines) reduces the coordination overhead that makes microservices painful.',
      ]
    },
    {
      heading: 'Layered Architecture in Practice',
      points: [
        'A typical Node.js layered structure: routes (HTTP concerns only — parsing, status codes) → controllers (orchestrate a request, no business logic) → services (business logic, framework-agnostic) → repositories/data access (database queries only).',
        'Each layer should only depend on the layer directly below it — a route handler should never import a database driver directly, and a service should never construct an Express Response object. This keeps business logic testable without spinning up an HTTP server.',
        'Dependency injection (manual or via a framework like NestJS/Awilix) at each layer boundary lets tests substitute a fake repository for a real database, keeping unit tests for business logic fast and isolated from I/O.',
        'A common anti-pattern: "fat controllers" where validation, business rules, and database calls all live inline in the route handler. This makes logic untestable without an HTTP server and duplicates rules across similar endpoints.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Event Loop Order',
      language: 'typescript',
      code: `// Demonstrates exact execution order
console.log('1: synchronous');

setTimeout(() => console.log('5: timer (timers phase)'), 0);

setImmediate(() => console.log('6: setImmediate (check phase)'));

Promise.resolve().then(() => console.log('3: microtask (Promise)'));

process.nextTick(() => console.log('2: nextTick (before next phase)'));

// I/O callback (poll phase) would come 4th if present
// Output order: 1, 2, 3, 5, 6
// (Inside an I/O callback: setImmediate wins over setTimeout)`
    },
    {
      label: 'Blocking vs Non-blocking',
      language: 'typescript',
      code: `const fs = require('fs');

// WRONG — blocks the event loop
const data = fs.readFileSync('big-file.txt'); // freezes all requests!

// CORRECT — async callback
fs.readFile('big-file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data.length);
});

// BETTER — promise-based (Node v10+)
const { readFile } = require('fs/promises');
async function load() {
  const data = await readFile('big-file.txt', 'utf8');
  return data.length;
}

// Thread pool in action
const crypto = require('crypto');
// Runs on thread pool — doesn't block event loop
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => {
  console.log('hashed on thread pool:', key.toString('hex').slice(0, 10));
});
console.log('this runs while hashing is in progress');`
    },
    {
      label: 'Event Loop Monitoring',
      language: 'typescript',
      code: `// Detect event loop lag (sign of blocking)
let lastTick = Date.now();
setInterval(() => {
  const lag = Date.now() - lastTick - 100; // expected 100ms
  if (lag > 50) {
    console.warn(\`Event loop lag: \${lag}ms\`);
  }
  lastTick = Date.now();
}, 100);

// UV_THREADPOOL_SIZE before starting Node:
// UV_THREADPOOL_SIZE=16 node server.js

// Check active handles (what's keeping Node alive)
process._getActiveHandles().forEach(h => console.log(h.constructor.name));
process._getActiveRequests().forEach(r => console.log(r.constructor.name));`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Blocking the event loop with synchronous fs',
      wrong: 'const data = fs.readFileSync("users.json");',
      right: 'const data = await fs.promises.readFile("users.json", "utf8");',
      explanation: 'Sync fs calls block the entire Node.js process. No other requests can be served while the disk read is happening. Always use async variants.'
    },
    {
      title: 'Long computation on the main thread',
      wrong: 'app.get("/sort", (req, res) => { const sorted = hugeArray.sort(); res.json(sorted); })',
      right: '// Offload to worker_threads or a background job queue',
      explanation: 'Sorting a million-element array can take 100ms+, blocking all other requests. Move CPU-bound work to Worker Threads or a separate process.'
    },
    {
      title: 'Confusing process.nextTick with setImmediate',
      wrong: 'setImmediate(() => db.close()); // may run after other I/O callbacks',
      right: 'process.nextTick(() => cleanup()); // guaranteed before next phase',
      explanation: 'nextTick callbacks run before any I/O events — use them when a callback MUST run before the next phase. setImmediate runs in the check phase after I/O.'
    },
    {
      title: 'Assuming thread pool handles all async operations',
      wrong: '// "All async I/O uses the thread pool"',
      right: '// Network I/O (HTTP, TCP) uses OS async. Thread pool = fs, crypto, dns.lookup, zlib',
      explanation: 'Most people over-allocate UV_THREADPOOL_SIZE thinking it affects HTTP. Network I/O is handled by the OS asynchronously and does not touch the thread pool.'
    },
    {
      title: 'Not handling uncaughtException or unhandledRejection',
      wrong: '// No global error handlers — crashes are silent until load',
      right: 'process.on("uncaughtException", (err) => { logger.fatal(err); process.exit(1); });',
      explanation: 'An unhandled exception or rejection leaves Node in an undefined state. Always add global handlers that log and exit — PM2 or Docker will restart the process.'
    },
  ];

  challenge: Challenge = {
    title: 'Event Loop Order Predictor',
    language: 'typescript',
    description: 'Implement a function runAll(callbacks) that accepts an array of { type: "sync"|"nextTick"|"promise"|"setTimeout"|"setImmediate", fn: () => void } and executes each in the correct Node.js order. Write a test that schedules one of each type and asserts the execution order array equals ["sync","nextTick","promise","setTimeout","setImmediate"].',
    hints: [
      'Run sync callbacks immediately in the same tick.',
      'Promise.resolve().then() is the microtask queue.',
      'process.nextTick() runs before microtasks in Node — but after the current operation.',
    ],
    starterCode: `function runAll(callbacks) {
  const order = [];
  // TODO: execute callbacks in Node.js event loop order
  // Return a promise that resolves with the order array
}

// Expected: ["sync","nextTick","promise","setTimeout","setImmediate"]
runAll([
  { type: "setImmediate",  fn: () => {} },
  { type: "sync",         fn: () => {} },
  { type: "promise",      fn: () => {} },
  { type: "nextTick",     fn: () => {} },
  { type: "setTimeout",   fn: () => {} },
]).then(order => console.log(order));`,
    solution: `function runAll(callbacks) {
  const order = [];
  const byType = (t) => callbacks.filter(c => c.type === t);

  return new Promise(resolve => {
    // 1. Sync — run immediately
    byType('sync').forEach(c => { c.fn(); order.push('sync'); });

    // 2. nextTick — queued before microtasks
    byType('nextTick').forEach(c => process.nextTick(() => { c.fn(); order.push('nextTick'); }));

    // 3. Promises — microtask queue
    byType('promise').forEach(c => Promise.resolve().then(() => { c.fn(); order.push('promise'); }));

    // 4. setTimeout — timers phase
    byType('setTimeout').forEach(c => setTimeout(() => { c.fn(); order.push('setTimeout'); }, 0));

    // 5. setImmediate — check phase
    byType('setImmediate').forEach(c => setImmediate(() => {
      c.fn(); order.push('setImmediate');
      if (order.length === callbacks.length) resolve(order);
    }));
  });
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'In what order do these run: setTimeout(0), setImmediate, Promise.resolve().then, process.nextTick?', options: ['nextTick → Promise → setTimeout → setImmediate', 'setTimeout → setImmediate → nextTick → Promise', 'Promise → nextTick → setImmediate → setTimeout', 'nextTick → Promise → setImmediate → setTimeout'], answer: 0, explanation: 'nextTick drains first (before next phase), then microtasks (Promise.then), then the timers phase (setTimeout), then check phase (setImmediate).' },
    { q: 'Which I/O operations use the libuv thread pool?', options: ['HTTP requests and TCP connections', 'fs operations, crypto, dns.lookup, zlib', 'All async operations in Node', 'Only synchronous operations'], answer: 1, explanation: 'Network I/O (HTTP, TCP) uses OS async mechanisms without the thread pool. The thread pool handles fs, crypto (pbkdf2, scrypt), dns.lookup, and zlib.' },
    { q: 'What is the default libuv thread pool size?', options: ['1', '4', '8', '16'], answer: 1, explanation: 'libuv defaults to 4 threads. You can increase this with UV_THREADPOOL_SIZE env var (max 128). This matters for apps doing many concurrent file or crypto operations.' },
    { q: 'What happens if you call fs.readFileSync in a request handler?', options: ['It runs on a thread pool thread', 'It blocks the entire Node process until complete', 'It throws an error in production mode', 'It queues the read in the poll phase'], answer: 1, explanation: 'Sync calls block the JS main thread. No other request callbacks, timers, or I/O callbacks can run during a synchronous fs call.' },
    { q: 'What is the "poll" phase of the event loop responsible for?', options: ['Running setTimeout callbacks', 'Running setImmediate callbacks', 'Fetching new I/O events and blocking if nothing pending', 'Running process.nextTick callbacks'], answer: 2, explanation: 'The poll phase retrieves new I/O events. If the callback queue is empty and no timers are pending, Node blocks here waiting for I/O to arrive.' },
    { q: 'What is the difference between process.nextTick() and setImmediate()?', options: ['They are identical — both queue a microtask', 'process.nextTick() runs before the next event loop phase (after current op); setImmediate() runs in the check phase after I/O', 'setImmediate() runs before process.nextTick()', 'process.nextTick() is deprecated in Node 18+'], answer: 1, explanation: 'process.nextTick() callbacks run at the end of the current operation, before the event loop proceeds to the next phase — they can starve I/O if used recursively. setImmediate() schedules in the check phase, after I/O events. Use setImmediate() for yielding to the event loop; nextTick() for truly immediate but post-operation callbacks.' },
  ];

  qna: QnaItem[] = [
    { q: 'How does Node.js handle 10,000 concurrent connections with a single thread?', a: 'Each connection registers callbacks and the handler returns immediately. The OS manages the actual TCP connections. The event loop picks up completed I/O callbacks one at a time — but since each callback is fast (they just respond or queue the next async step), the single thread handles thousands of connections in rapid succession without waiting.' },
    { q: 'When would you use Worker Threads vs child_process?', a: 'Worker Threads share memory (via SharedArrayBuffer) and are cheaper to spin up — use for CPU-heavy computation within the same app (image processing, ML inference). child_process spawns a separate Node.js process with its own V8 heap — use for running untrusted code, isolating crashes, or running a completely different program (Python script, CLI tool).' },
    { q: 'Why can setImmediate win over setTimeout(fn, 0) inside an I/O callback?', a: 'Inside an I/O callback you are already in the poll phase. After poll, the next phase is check (setImmediate). Timers are the first phase of the NEXT iteration. So setImmediate is guaranteed to run before setTimeout when both are scheduled inside an I/O callback.' },
    { q: 'What is event loop lag and how do you measure it?', a: 'Event loop lag is the delay between when a callback is queued and when it actually runs. It indicates a blocked event loop. Measure it by scheduling a setInterval(100ms) and comparing actual elapsed time vs expected 100ms. Libraries like clinic.js doctor automate this. A lag above 50-100ms in production is a warning sign.' },
    { q: 'What is the difference between a layered (MVC-style) architecture and a hexagonal (ports and adapters) architecture in a Node.js backend?', a: 'A layered architecture organizes code into horizontal layers (routes/controllers, services, data access) where each layer depends on the one below it, which is simple to understand but can let business logic leak into the framework-coupled controller layer. Hexagonal architecture inverts this — the core business logic sits at the center with no dependency on frameworks or databases, communicating only through defined "ports" (interfaces), while Express, the database driver, and external APIs are "adapters" plugged in at the edges — making the business logic independently testable and framework-agnostic.' },
    { q: 'Why do larger Node.js applications often move from a single monolithic process to a modular monolith before considering microservices?', a: 'Microservices introduce significant operational complexity — distributed tracing, network reliability concerns, data consistency across service boundaries, and deployment orchestration — that is often premature for teams still iterating on product-market fit or with a small engineering team. A modular monolith keeps deployment simple (one process, one deploy) while still enforcing internal module boundaries (clear interfaces between domains, no direct cross-module database access) so the codebase remains organized and could be split into real services later if scaling genuinely requires it.' },
    { q: 'What architectural pattern helps a Node.js service stay resilient when a downstream dependency (database, third-party API) becomes slow or unavailable?', a: 'The Circuit Breaker pattern (implemented via libraries like opossum) monitors calls to a dependency and "opens" after a threshold of failures, immediately failing fast on subsequent calls (without waiting for a timeout) for a cooldown period rather than letting every request hang waiting on a known-broken dependency. Combined with sensible request timeouts and a fallback/degraded response strategy, this prevents a single slow dependency from cascading into exhausting your own service\'s resources (connection pools, event loop capacity) under sustained load.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Node.js is single-threaded JS on V8, with non-blocking I/O via libuv — the event loop dispatches callbacks from a queue when the call stack is empty.',
    mustKnow: [
      'Event loop phases: Timers → I/O → Poll → Check (setImmediate) → Close.',
      'process.nextTick runs before any I/O; Promise.then runs from microtask queue.',
      'Thread pool (default 4): fs, crypto, dns.lookup, zlib — NOT network I/O.',
      'Blocking the event loop (sync I/O, long loops) stops ALL requests.',
      'CPU-bound work → Worker Threads or child_process, not main thread.',
      'UV_THREADPOOL_SIZE env var increases thread pool size up to 128.',
    ],
    interviewFocus: [
      'Explain the Node.js event loop and its phases in detail.',
      'What operations go through the libuv thread pool vs OS async?',
      'How would you detect and fix event loop blocking in production?',
    ]
  };
}
