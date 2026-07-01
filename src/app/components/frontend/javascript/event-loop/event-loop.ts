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
  selector: 'app-js-event-loop',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './event-loop.html',
  styleUrl: './event-loop.scss',
})
export class JsEventLoop {
  theory: TheoryPoint[] = [
    {
      heading: 'JavaScript is Single-Threaded',
      points: [
        'JavaScript has one call stack and one thread of execution. Only one piece of code runs at a time. There is no preemption — a running function must complete (or yield via await/yield) before the next one runs.',
        'This single-threaded model avoids a whole class of concurrency bugs (race conditions, deadlocks on shared mutable state). The trade-off: long-running synchronous code blocks everything.',
        'Non-blocking I/O is achieved by delegating work to Web APIs (fetch, setTimeout, DOM events) which run outside the JS thread. When they complete, callbacks are placed in the event queue.',
        'The term "event loop" describes the runtime\'s continuous cycle: run all synchronous code → drain microtasks → process one macrotask → drain microtasks → process next macrotask → ...',
      ]
    },
    {
      heading: 'Call Stack, Web APIs & Queues',
      points: [
        'The <strong>call stack</strong> tracks function execution. When a function is called, a frame is pushed; when it returns, the frame is popped. Stack overflow is literally when the stack runs out of space (infinite recursion).',
        '<strong>Web APIs</strong> (browser) or <strong>libuv</strong> (Node.js) handle async operations outside the JS thread: <code>setTimeout</code>, <code>fetch</code>, DOM event listeners, file system I/O.',
        'The <strong>microtask queue</strong> holds callbacks from Promise <code>.then</code>, <code>queueMicrotask()</code>, and <code>MutationObserver</code>. It is drained completely after every task before the next macrotask runs.',
        'The <strong>macrotask queue</strong> (also called callback queue or task queue) holds callbacks from <code>setTimeout</code>, <code>setInterval</code>, I/O callbacks, UI events. One macrotask is processed per event loop iteration.',
      ]
    },
    {
      heading: 'Microtasks vs Macrotasks',
      points: [
        'Key rule: <strong>all microtasks drain before the next macrotask runs</strong>. This means Promise callbacks always run before the next <code>setTimeout</code> callback, even <code>setTimeout(fn, 0)</code>.',
        'If a microtask enqueues another microtask, it runs in the same draining pass. Infinite microtask loops block macrotasks (and rendering) permanently.',
        'Microtasks: Promise <code>.then/.catch/.finally</code>, <code>queueMicrotask()</code>, <code>MutationObserver</code>, async/await continuations.',
        'Macrotasks: <code>setTimeout</code>, <code>setInterval</code>, <code>setImmediate</code> (Node.js), I/O callbacks, UI events (click, keypress), <code>requestAnimationFrame</code>.',
        'Rendering (painting) happens between macrotasks in the browser — long-running JS or too many microtasks can cause jank by delaying frames.',
      ]
    },
    {
      heading: 'Web Workers & True Parallelism',
      points: [
        'Web Workers run JavaScript in a separate thread — true parallelism. They have no access to the DOM or shared memory (by default). Communication is via <code>postMessage</code> / <code>onmessage</code>.',
        'Use Workers for CPU-intensive tasks (image processing, crypto, complex calculations) that would otherwise block the main thread and freeze the UI.',
        '<code>SharedArrayBuffer</code> + <code>Atomics</code> enables shared memory between workers, allowing lock-free communication for performance-critical code.',
        '<code>requestAnimationFrame(fn)</code> schedules <code>fn</code> before the next browser paint — ideal for animations, ensuring you update at display refresh rate (60fps).',
      ]
    },
    {
      heading: 'Microtasks vs Macrotasks',
      points: [
        'Promise callbacks (<code>.then()</code>, <code>.catch()</code>, <code>async/await</code> continuations) are microtasks, queued in the microtask queue. <code>setTimeout</code>, <code>setInterval</code>, and I/O callbacks are macrotasks, queued separately.',
        'The event loop always drains the ENTIRE microtask queue before moving to the next macrotask — this is why a chain of resolved promises all run before a <code>setTimeout(fn, 0)</code> callback, even one scheduled earlier.',
        'A microtask that schedules another microtask (a <code>.then()</code> that returns a promise handled by another <code>.then()</code>) keeps extending the current microtask drain — an infinite chain of synchronously-resolving microtasks can starve macrotasks (and rendering) indefinitely.',
        'Understanding this ordering is essential for debugging "why did my setTimeout run after all my promises" surprises — it is not a bug, it is the deterministic, spec-defined priority of microtasks over macrotasks on every event loop tick.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Call stack',          type: 'keyword', desc: 'Tracks function execution frames — LIFO' },
    { name: 'Microtask queue',     type: 'keyword', desc: 'Promise .then, queueMicrotask — drained fully after each task' },
    { name: 'Macrotask queue',     type: 'keyword', desc: 'setTimeout, setInterval, I/O events — one per event loop tick' },
    { name: 'queueMicrotask(fn)',  type: 'method',  desc: 'Schedule fn as a microtask — runs before next macrotask' },
    { name: 'setTimeout(fn, 0)',   type: 'method',  desc: 'Macrotask — NOT immediate; runs after ALL microtasks drain' },
    { name: 'requestAnimationFrame(fn)', type: 'method', desc: 'Schedule before next browser paint (~60fps)' },
    { name: 'Web Worker',          type: 'keyword', desc: 'True parallel JS thread — no DOM, no shared memory by default' },
    { name: 'postMessage / onmessage', type: 'method', desc: 'Communication between main thread and workers' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Execution Order',
      language: 'typescript',
      code: `// ── Predict the output ───────────────────────────────────────────────
console.log('1: sync start');

setTimeout(() => console.log('4: setTimeout'), 0);  // macrotask

Promise.resolve()
  .then(() => console.log('3: promise .then'));       // microtask

queueMicrotask(() => console.log('2: queueMicrotask'));  // microtask

console.log('1: sync end');

// Output order:
// 1: sync start
// 1: sync end
// 2: queueMicrotask    ← microtask runs before macrotask
// 3: promise .then     ← microtask
// 4: setTimeout        ← macrotask (last)

// ── async/await execution order ───────────────────────────────────────
async function main() {
  console.log('A: before await');
  await Promise.resolve();           // pauses here
  console.log('C: after await');     // resumes as microtask
}

console.log('before main()');
main();
console.log('B: sync after main()');

// Output: "before main()" → "A: before await" → "B: sync after main()" → "C: after await"
// await suspends the async fn; synchronous code continues, then C runs as microtask`,
    },
    {
      label: 'Blocking vs Non-Blocking',
      language: 'typescript',
      code: `// ── Blocking the event loop ──────────────────────────────────────────
function blockFor(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {}  // busy-wait: blocks EVERYTHING
}

document.querySelector('button').addEventListener('click', () => {
  blockFor(5000);          // UI frozen for 5 seconds — click, scroll, type all blocked
  console.log('done');
});

// ── Non-blocking alternative ──────────────────────────────────────────
async function processInChunks(items, chunkSize = 100) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    processChunk(chunk);
    await new Promise(r => setTimeout(r, 0));  // yield to event loop between chunks
  }
}

// ── Web Worker for true non-blocking ─────────────────────────────────
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ data: hugeDataset });
worker.onmessage = (e) => console.log('Result:', e.data);

// worker.js (runs in separate thread)
// self.onmessage = (e) => {
//   const result = heavyComputation(e.data);
//   self.postMessage(result);
// };

// ── requestAnimationFrame ─────────────────────────────────────────────
let x = 0;
function animate() {
  x += 2;
  element.style.transform = \`translateX(\${x}px)\`;
  if (x < 200) requestAnimationFrame(animate);  // next frame
}
requestAnimationFrame(animate);`,
    },
    {
      label: 'Microtask Gotchas',
      language: 'typescript',
      code: `// ── Infinite microtask loop (blocks macrotasks!) ────────────────────
function infiniteMicrotasks() {
  Promise.resolve().then(infiniteMicrotasks);  // DO NOT DO THIS
  // setTimeout callbacks never run, UI freezes
}

// ── MutationObserver runs as microtask ───────────────────────────────
const observer = new MutationObserver(mutations => {
  // Runs as microtask — before the next macrotask
  // So DOM mutations from a task run, then the observer fires
  // before any setTimeout callbacks
  console.log('DOM changed:', mutations.length, 'changes');
});
observer.observe(document.body, { childList: true, subtree: true });

// ── Promise chain length affects timing ──────────────────────────────
// Each .then() adds a microtask
Promise.resolve()
  .then(() => 'step 1')   // 1 microtask
  .then(() => 'step 2')   // 2nd microtask
  .then(() => 'step 3');  // 3rd microtask

// All three run before any macrotask, but in sequence

// ── Batch DOM updates (avoid layout thrashing) ────────────────────────
// ❌ Read + write in alternation forces layout recalculation each time
elements.forEach(el => {
  const h = el.offsetHeight;   // force layout
  el.style.height = h + 10 + 'px';  // invalidate layout
});

// ✓ Read all, then write all
const heights = elements.map(el => el.offsetHeight);   // one layout
elements.forEach((el, i) => el.style.height = heights[i] + 10 + 'px'); // one write`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Thinking setTimeout(fn, 0) is immediate',
      wrong: `setTimeout(() => console.log('a'), 0);
Promise.resolve().then(() => console.log('b'));
// Expecting: a, b  — actual: b, a`,
      right: `// Microtasks (Promises) always run before macrotasks (setTimeout)
// setTimeout(fn, 0) means "as soon as the call stack and all microtasks are done"`,
      explanation: 'setTimeout(fn, 0) is a macrotask — it runs AFTER all microtasks (Promise callbacks) drain. It is NOT immediate.',
    },
    {
      title: 'Long synchronous loops blocking the UI',
      wrong: `button.onclick = () => {
  for (let i = 0; i < 1_000_000_000; i++) { /* heavy work */ }
  updateUI();
};  // UI is completely frozen during this`,
      right: `button.onclick = async () => {
  await processInChunks(data);  // yield to event loop between chunks
  updateUI();
};`,
      explanation: 'Long synchronous code blocks the event loop — no user interactions, no rendering, no timers fire. Break heavy work into chunks with await new Promise(r => setTimeout(r, 0)) between them.',
    },
    {
      title: 'Accessing DOM from a Web Worker',
      wrong: `// worker.js
document.querySelector('#app').innerHTML = 'done';  // ReferenceError: document is not defined`,
      right: `// worker.js — post message back to main thread
self.postMessage({ type: 'update', html: 'done' });

// main.js — update DOM on main thread
worker.onmessage = (e) => {
  document.querySelector('#app').innerHTML = e.data.html;
};`,
      explanation: 'Web Workers have no access to the DOM, window, or document. All DOM updates must happen on the main thread. Workers communicate results via postMessage.',
    },
    {
      title: 'Using setInterval for animations',
      wrong: `setInterval(() => { animateFrame(); }, 16);  // roughly 60fps but drifts`,
      right: `function loop() {
  animateFrame();
  requestAnimationFrame(loop);  // synced to display refresh rate
}
requestAnimationFrame(loop);`,
      explanation: 'setInterval drifts over time and can fire multiple times between frames or skip frames. requestAnimationFrame is synchronized to the browser\'s actual refresh rate.',
    },
    {
      title: 'Creating microtask loops that starve macrotasks',
      wrong: `function pump() {
  doWork();
  Promise.resolve().then(pump);  // microtask schedules microtask — never ends
}
pump();  // setTimeout, I/O, UI events never run`,
      right: `async function pump() {
  doWork();
  await new Promise(r => setTimeout(r, 0));  // yields as macrotask
  pump();
}`,
      explanation: 'Microtasks that recursively schedule microtasks drain forever and starve macrotasks. Use setTimeout(r, 0) to periodically yield and let the event loop process other tasks.',
    },
    {
      title: 'Layout thrashing in event handlers',
      wrong: `elements.forEach(el => {
  const h = el.offsetHeight;      // read — forces layout flush
  el.style.height = h + 10 + 'px'; // write — invalidates layout
  // next iteration reads again → forced flush again...
});`,
      right: `const heights = elements.map(el => el.offsetHeight);  // read all (one layout)
elements.forEach((el, i) => el.style.height = heights[i] + 10 + 'px'); // write all`,
      explanation: 'Reading layout properties (offsetHeight, getBoundingClientRect) after DOM writes forces a synchronous layout recalculation. Batch all reads, then all writes.',
    },
  ];

  challenge: Challenge = {
    title: 'Predict the Output',
    language: 'typescript',
    description: 'For each snippet, predict the output order WITHOUT running the code. Then explain why using event loop terminology (call stack, microtask queue, macrotask queue).',
    hints: [
      'Sync code runs first, then microtasks drain, then one macrotask runs',
      'await pauses the async function — sync code AFTER the call continues immediately',
      'Each .then() continuation is a separate microtask',
      'setTimeout and setInterval callbacks are macrotasks',
    ],
    starterCode: `// Snippet 1
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// Snippet 2
async function foo() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}
console.log('X');
foo();
console.log('Y');

// Snippet 3
Promise.resolve()
  .then(() => { console.log('p1'); return Promise.resolve(); })
  .then(() => console.log('p2'));

Promise.resolve()
  .then(() => console.log('p3'))
  .then(() => console.log('p4'));`,
    solution: `// Snippet 1: 1, 4, 3, 2
// Sync: 1, 4 → microtask: 3 → macrotask: 2

// Snippet 2: X, A, Y, B
// Sync: X → foo() starts sync → A → await pauses foo → Y → microtask: B

// Snippet 3: p1, p3, p2, p4
// First pass microtasks: p1 and p3 run (both .then at depth 1)
// p1 returns Promise.resolve() which adds another .then (p2) at depth 2
// p3 adds p4 at depth 2
// Second pass: p2, p4 (interleaved because each chain's next .then is queued in order)`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What runs first: a Promise .then() callback or a setTimeout(fn, 0)?',
      options: ['setTimeout (registered first)', 'Promise .then() (microtask)', 'They run simultaneously', 'Depends on the browser'],
      answer: 1,
      explanation: 'Microtasks (Promise .then) always drain before the next macrotask (setTimeout). Even setTimeout(fn, 0) waits until all microtasks complete.',
    },
    {
      q: 'Why doesn\'t JavaScript block during fetch()?',
      options: [
        'fetch runs on a background thread inside V8',
        'Web APIs handle network I/O outside the JS thread; a callback is queued when done',
        'fetch uses SharedArrayBuffer for non-blocking I/O',
        'JavaScript pauses the event loop during fetch',
      ],
      answer: 1,
      explanation: 'The browser\'s Web API (not V8) handles the network request. When it completes, the callback/promise resolution is placed in the appropriate queue and the JS thread picks it up.',
    },
    {
      q: 'What is the consequence of a long synchronous loop?',
      options: [
        'It runs on a worker thread automatically',
        'setTimeout callbacks are delayed but UI still renders',
        'The event loop is blocked — no events, renders, or timers fire',
        'It throws a timeout error after 5 seconds',
      ],
      answer: 2,
      explanation: 'Long synchronous code occupies the call stack and blocks the event loop entirely. No user events, renders, or timer callbacks can run until it finishes.',
    },
    {
      q: 'What can Web Workers NOT do?',
      options: ['Run CPU-intensive JavaScript', 'Access the DOM', 'Use fetch()', 'Communicate via postMessage'],
      answer: 1,
      explanation: 'Web Workers have no access to the DOM, window, or document. All DOM manipulation must happen on the main thread. Workers can use fetch, IndexedDB, and postMessage.',
    },
    {
      q: 'What does `await new Promise(r => setTimeout(r, 0))` achieve inside async code?',
      options: [
        'Waits exactly 0 milliseconds — effectively does nothing',
        'Yields to the event loop, allowing macrotasks and rendering to run',
        'Converts synchronous code to asynchronous',
        'Creates a memory leak',
      ],
      answer: 1,
      explanation: 'This yields control back to the event loop as a macrotask. It lets setTimeout callbacks, I/O events, and browser rendering happen before resuming — essential for chunked processing.',
    },
    {
      q: 'Where in the event loop does a resolved Promise callback run?',
      options: ['Immediately, synchronously', 'In the microtask queue after current task', 'In the macrotask queue like setTimeout(fn, 0)', 'In a Web Worker thread'],
      answer: 1,
      explanation: 'Promise .then()/.catch()/.finally() callbacks are microtasks. They run after the current synchronous task completes but before the browser paints or the next macrotask starts.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'If JavaScript is single-threaded, how does it handle concurrent operations?',
      a: 'JavaScript delegates I/O and timer operations to the host environment (browser Web APIs or Node.js libuv). These run outside the JS thread. When they complete, callbacks are queued. The event loop picks callbacks from the queue when the call stack is empty, giving the illusion of concurrency without multiple threads.',
    },
    {
      q: 'What is the difference between the microtask queue and the macrotask queue?',
      a: '<strong>Microtask queue</strong>: Promise callbacks, <code>queueMicrotask()</code>, <code>MutationObserver</code>. Drained <em>completely</em> after every task before the next macrotask runs. <strong>Macrotask queue</strong>: <code>setTimeout</code>, <code>setInterval</code>, I/O events, UI events. One macrotask per event loop tick. The browser may repaint between macrotasks.',
    },
    {
      q: 'When should I use a Web Worker?',
      a: 'Use Web Workers for CPU-intensive work that would block the main thread: parsing large JSON/CSV, image processing, cryptography, complex data transformations, WebAssembly execution. If a task takes more than ~16ms on the main thread, it risks dropping frames at 60fps — that\'s a good indicator to consider a worker.',
    },
    {
      q: 'What is queueMicrotask() and when would you use it?',
      a: '<code>queueMicrotask(fn)</code> schedules a function to run as a microtask — after the current synchronous code but before any macrotasks. Use it when you need to defer work minimally without creating a full Promise chain. It is lighter than <code>Promise.resolve().then(fn)</code> and clearer in intent. Common use: scheduling a callback that must run before the browser paints but after state updates settle.',
    },
    {
      q: 'Can infinite microtask loops block the event loop?',
      a: 'Yes — if a microtask schedules another microtask infinitely, the microtask queue never drains and the event loop never moves to the next macrotask or render. This starves I/O events, timers, and UI updates, effectively blocking the page. Always ensure microtask chains terminate. This contrasts with <code>setTimeout</code> loops which yield to the event loop between iterations.',
    },
    {
      q: 'What is the call stack and how is it related to the event loop?',
      a: 'The call stack is where JavaScript tracks function execution — each function call pushes a frame, each return pops one. The event loop only picks up the next task (macro or micro) when the call stack is empty. A synchronous infinite loop (<code>while(true){}</code>) fills the stack and prevents the event loop from ever running queued tasks.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'JavaScript is single-threaded with an event loop — microtasks (Promises) drain completely before each macrotask (setTimeout), long sync code blocks everything, and Web Workers provide true parallelism without DOM access.',
    mustKnow: [
      'Call stack → microtask queue (drain all) → macrotask (one) → microtask drain → ...',
      'Microtasks: Promise .then, queueMicrotask, MutationObserver',
      'Macrotasks: setTimeout, setInterval, I/O callbacks, UI events',
      'setTimeout(fn, 0) is NOT immediate — runs after ALL microtasks',
      'Long sync code blocks the event loop — use chunking or Web Workers',
      'Web Workers: true parallel JS thread; no DOM access; communicate via postMessage',
    ],
    interviewFocus: [
      'Predict output with mixed sync, Promise, and setTimeout code',
      'Why does setTimeout(fn, 0) run after Promise .then()?',
      'How does JavaScript achieve non-blocking I/O being single-threaded?',
      'When would you use a Web Worker?',
    ],
  };
}
