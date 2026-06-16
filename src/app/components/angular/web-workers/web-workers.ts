import { Component, signal } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-web-workers',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './web-workers.html',
  styleUrl: './web-workers.scss',
})
export class WebWorkersDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Signals', route: '/angular/signals' },
    { label: 'Change Detection', route: '/angular/change-detection' },
  ];

  result      = signal<number | null>(null);
  running     = signal(false);
  uiCounter   = signal(0);
  mainBlocked = signal(false);
  timerRef: ReturnType<typeof setInterval> | null = null;

  startUiTick() {
    if (this.timerRef) return;
    this.timerRef = setInterval(() => this.uiCounter.update(n => n + 1), 100);
  }

  stopUiTick() {
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
  }

  runOnMainThread() {
    this.stopUiTick();
    this.mainBlocked.set(true);
    this.running.set(true);
    setTimeout(() => {
      let sum = 0;
      for (let i = 0; i < 500_000_000; i++) sum += i;
      this.result.set(sum);
      this.running.set(false);
      this.mainBlocked.set(false);
    }, 0);
  }

  runInWorker() {
    this.startUiTick();
    this.running.set(true);
    this.result.set(null);
    const blob = new Blob([`
      self.onmessage = function() {
        let sum = 0;
        for (let i = 0; i < 500000000; i++) sum += i;
        self.postMessage(sum);
      };
    `], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = (e) => {
      this.result.set(e.data);
      this.running.set(false);
      this.stopUiTick();
      worker.terminate();
    };
    worker.postMessage(null);
  }

  theory: TheoryPoint[] = [
    {
      heading: 'What are Web Workers?',
      points: [
        'Web Workers run JavaScript in a <strong>background OS thread</strong> — completely separate from the main UI thread. The browser can use a real CPU core for the worker while the main thread keeps rendering at 60 fps.',
        'JavaScript is single-threaded: any synchronous computation longer than ~16 ms on the main thread misses a frame and causes jank. Workers eliminate this by moving the heavy work off-thread.',
        'Workers have <strong>no access to the DOM</strong>, <code>window</code>, or <code>document</code> — these APIs are not thread-safe. The only communication channel is the structured-clone-based <code>postMessage()</code> / <code>onmessage</code> API.',
        'Good candidates for workers: <strong>image/video processing</strong>, <strong>large JSON/CSV parsing</strong>, <strong>sorting huge datasets</strong>, <strong>cryptography</strong>, <strong>WebAssembly execution</strong>, and <strong>real-time data transformations</strong>.',
        'Workers run in isolation — they cannot import or share references with the main thread. They have access to <code>self</code>, <code>fetch</code>, <code>IndexedDB</code>, <code>WebSockets</code>, <code>crypto</code>, and <code>import()</code> for dynamic modules.',
      ],
    },
    {
      heading: 'Worker communication patterns',
      points: [
        '<strong>Main → Worker</strong>: <code>worker.postMessage(data)</code> sends a message. Data is <strong>deep-cloned</strong> (structured clone algorithm) — mutations to the original object after postMessage do NOT affect what the worker receives.',
        '<strong>Worker → Main</strong>: inside the worker, <code>self.postMessage(result)</code> sends data back. The main thread receives it in <code>worker.onmessage = (e) =&gt; e.data</code>.',
        '<strong>Transferable objects</strong> (ArrayBuffer, ImageBitmap, MessagePort, ReadableStream) are <strong>transferred</strong> instead of cloned — ownership moves from one thread to the other with zero copy. Pass as the second argument: <code>postMessage(buffer, [buffer])</code>. The original reference becomes detached.',
        '<strong>MessageChannel</strong> creates a pair of <code>MessagePort</code> objects for direct worker-to-worker communication without routing through the main thread — useful in complex multi-worker setups.',
        '<code>worker.terminate()</code> immediately kills the worker thread and frees all its resources. Always terminate as soon as the final result is received. A worker that is not terminated runs forever, consuming CPU and memory.',
      ],
    },
    {
      heading: 'Angular CLI integration and TypeScript setup',
      points: [
        '<code>ng generate web-worker &lt;name&gt;</code> creates <code>src/app/&lt;name&gt;.worker.ts</code> with the <code>/// &lt;reference lib="webworker" /&gt;</code> directive and updates <code>tsconfig.worker.json</code> to include the <code>webworker</code> lib.',
        'Always use the URL constructor pattern: <code>new Worker(new URL(\'./my.worker\', import.meta.url))</code>. This gives Angular\'s build system (esbuild/webpack) a static reference it can detect, bundle as a separate hashed chunk, and tree-shake.',
        'A bare string path — <code>new Worker(\'my.worker.js\')</code> — bypasses the bundler entirely. The worker file won\'t be hashed, chunked, or processed through the TypeScript compiler.',
        'Worker files can import Angular utility services that do not depend on DI or DOM APIs (pure computation functions, parsers, utility classes). They cannot use <code>inject()</code> or Angular\'s DI container.',
        'In the worker TypeScript file, <code>/// &lt;reference lib="webworker" /&gt;</code> at the top is required to get correct typings for <code>self</code>, <code>postMessage</code>, and other worker globals instead of DOM globals.',
      ],
    },
    {
      heading: 'Comlink — RPC over postMessage',
      points: [
        '<code>npm install comlink</code> — Comlink (by Google Chrome Labs) wraps a Worker with a JavaScript <code>Proxy</code>, making cross-thread calls look like ordinary <code>async</code> function calls.',
        'In the worker: <code>Comlink.expose(api)</code> — where <code>api</code> is a plain object or class with methods. In the main thread: <code>const api = Comlink.wrap(worker)</code> — then call <code>await api.sort(data)</code>.',
        'Comlink handles all postMessage serialisation, response correlation, and error propagation (thrown errors in the worker are re-thrown on the main thread as if they happened locally).',
        'You can transfer Transferable objects through Comlink using <code>Comlink.transfer(value, [transferList])</code> — Comlink passes the transfer list as the second argument to postMessage automatically.',
        'Comlink supports exposing class instances: call <code>new api.HeavyProcessor()</code> from the main thread to create an instance in the worker context, then call methods on it — all async, all proxied.',
      ],
    },
    {
      heading: 'SharedArrayBuffer and Atomics — true shared memory',
      points: [
        '<code>SharedArrayBuffer</code> (SAB) is a fixed-size raw binary buffer that is <strong>shared</strong> between the main thread and workers — both read and write the same underlying memory without copying.',
        'To use SAB, your server must send two HTTP headers: <code>Cross-Origin-Opener-Policy: same-origin</code> and <code>Cross-Origin-Embedder-Policy: require-corp</code> (COOP + COEP). Browsers enforce this for security (Spectre mitigation).',
        '<code>Atomics</code> provides atomic (uninterruptible) read-modify-write operations on <code>Int32Array</code> views of a SAB: <code>Atomics.add()</code>, <code>Atomics.compareExchange()</code>, <code>Atomics.wait()</code> / <code>Atomics.notify()</code> for thread synchronisation.',
        '<code>Atomics.wait()</code> blocks the calling thread (workers only — main thread cannot block) until another thread calls <code>Atomics.notify()</code> on the same index. This enables a traditional mutex / condition-variable pattern.',
        'SAB is most useful for: real-time audio processing (AudioWorklet), high-frequency shared state between many workers, and zero-copy image pipelines. For typical Angular use cases, postMessage + Transferables is simpler and usually sufficient.',
      ],
    },
    {
      heading: 'Service Workers vs Web Workers — when to use which',
      points: [
        '<strong>Web Worker</strong>: runs in a tab, tied to its lifetime. Purpose: offload CPU-intensive computation from the main thread. Spawned programmatically via <code>new Worker()</code>. No access to fetch interception.',
        '<strong>Service Worker</strong>: runs independently of any tab (background). Purpose: intercept network requests, cache assets, enable offline use, and deliver push notifications. Controlled via <code>navigator.serviceWorker.register()</code>.',
        'A Service Worker is <em>also</em> a Web Worker at its core — it is a worker script that runs in a separate thread. The difference is scope and lifecycle: SW can survive across page navigations, web workers cannot.',
        'Use a Web Worker when you need <strong>computation</strong>: image filtering, data parsing, heavy math. Use a Service Worker when you need <strong>network control</strong>: caching, offline, PWA, push. They are complementary, not alternatives.',
        'Both are restricted to HTTPS (and localhost). Both communicate via postMessage. Neither has access to the DOM. The Angular CLI provides scaffolding for both: <code>ng generate web-worker</code> and <code>ng add @angular/pwa</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Angular CLI worker',
      language: 'typescript',
      code: `// 1. Generate: ng generate web-worker heavy-compute

// src/app/heavy-compute.worker.ts
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  // Heavy computation — does NOT block main thread
  let sum = 0;
  for (let i = 0; i < data.limit; i++) sum += i;
  postMessage({ sum });
});

// 2. Use in component
export class MyComponent {
  result = signal<number | null>(null);

  compute() {
    const worker = new Worker(
      new URL('./heavy-compute.worker', import.meta.url)
    );
    worker.onmessage = ({ data }) => {
      this.result.set(data.sum);
      worker.terminate();           // always terminate!
    };
    worker.postMessage({ limit: 500_000_000 });
  }
}`,
    },
    {
      label: 'Comlink (RPC-style)',
      language: 'typescript',
      code: `// npm install comlink

// worker.ts
/// <reference lib="webworker" />
import * as Comlink from 'comlink';

const api = {
  async heavySort(arr: number[]): Promise<number[]> {
    return arr.sort((a, b) => a - b);
  },
  async parseCSV(raw: string): Promise<Record<string, string>[]> {
    const [header, ...rows] = raw.split('\\n');
    const keys = header.split(',');
    return rows.map(r => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])));
  },
};
Comlink.expose(api);

// component.ts
import * as Comlink from 'comlink';

const worker = new Worker(new URL('./worker', import.meta.url));
const api    = Comlink.wrap<typeof import('./worker')['api']>(worker);

// Call like a normal async function — Comlink handles postMessage
const sorted = await api.heavySort(myBigArray);
const rows   = await api.parseCSV(csvText);`,
    },
    {
      label: 'Transferable ArrayBuffer',
      language: 'typescript',
      code: `// Zero-copy data transfer with ArrayBuffer

// component.ts
const SIZE = 10_000_000; // 10M floats = 80 MB
const buffer = new SharedArrayBuffer
  ? new Float64Array(SIZE).buffer           // prefer SAB when available
  : new Float64Array(SIZE).buffer;          // or plain ArrayBuffer

const worker = new Worker(new URL('./process.worker', import.meta.url));

worker.onmessage = ({ data }) => {
  const result = new Float64Array(data);    // re-wrap the transferred buffer
  console.log('processed:', result[0]);
  worker.terminate();
};

// Transfer ownership — zero copy, original reference is detached
worker.postMessage(buffer, [buffer]);
// buffer is now detached: buffer.byteLength === 0

// process.worker.ts
/// <reference lib="webworker" />
addEventListener('message', ({ data }) => {
  const arr = new Float64Array(data);
  for (let i = 0; i < arr.length; i++) arr[i] = Math.sqrt(arr[i]);
  postMessage(arr.buffer, [arr.buffer]);   // transfer back
});`,
    },
    {
      label: 'SharedArrayBuffer + Atomics',
      language: 'typescript',
      code: `// True shared memory — requires COOP + COEP headers on your server
// Cross-Origin-Opener-Policy: same-origin
// Cross-Origin-Embedder-Policy: require-corp

// main thread
const sab    = new SharedArrayBuffer(4);    // 4 bytes = one Int32
const shared = new Int32Array(sab);

const worker = new Worker(new URL('./atomics.worker', import.meta.url));
worker.postMessage(sab);                    // send the SAB (not a copy)

// Poll shared[0] to see worker updates — or use Atomics.notify
setInterval(() => console.log('value:', Atomics.load(shared, 0)), 200);

// atomics.worker.ts
/// <reference lib="webworker" />
let shared: Int32Array;

self.onmessage = ({ data }) => {
  shared = new Int32Array(data);

  // Atomically increment shared[0] every 500 ms
  const tick = () => {
    Atomics.add(shared, 0, 1);              // atomic += 1
    Atomics.notify(shared, 0, 1);          // wake one waiter (if any)
    setTimeout(tick, 500);
  };
  tick();
};`,
    },
    {
      label: 'RxJS + Worker bridge',
      language: 'typescript',
      code: `// Wrap a worker in an Observable for reactive data streams

import { fromEvent, map, takeUntil, Subject } from 'rxjs';

function createWorkerStream<T>(workerUrl: URL, input: any): Observable<T> {
  return new Observable<T>(observer => {
    const worker = new Worker(workerUrl);
    const destroy$ = new Subject<void>();

    fromEvent<MessageEvent>(worker, 'message').pipe(
      map(e => e.data as T),
      takeUntil(destroy$),
    ).subscribe(observer);

    fromEvent<ErrorEvent>(worker, 'error').pipe(
      takeUntil(destroy$),
    ).subscribe(e => observer.error(e));

    worker.postMessage(input);

    return () => {
      destroy$.next();
      worker.terminate();
    };
  });
}

// Usage in a component
export class DataComponent {
  private destroy$ = new Subject<void>();

  processData(raw: number[]) {
    createWorkerStream<number[]>(
      new URL('./sort.worker', import.meta.url),
      raw
    ).pipe(takeUntil(this.destroy$)).subscribe(sorted => {
      this.sortedData.set(sorted);
    });
  }

  ngOnDestroy() { this.destroy$.next(); }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Why can Web Workers NOT access the DOM?',
      options: ['The browser sandbox blocks DOM APIs for security reasons', 'Workers run in a separate OS thread and the DOM is not thread-safe', 'Angular strips DOM access at compile time for workers', 'Workers only support ES5 syntax, which predates the DOM API'],
      answer: 1,
      explanation: 'Workers run in a separate OS thread and do not share memory with the main thread. The DOM is intentionally inaccessible because it is not thread-safe. All UI updates must go through postMessage() back to the main thread.',
    },
    {
      q: 'Which of the following correctly creates a worker using the Angular CLI pattern?',
      options: ['new Worker(\'./heavy-compute.worker.ts\')', 'import Worker from \'./heavy-compute.worker\'', 'new Worker(new URL(\'./heavy-compute.worker\', import.meta.url))', 'WorkerFactory.create(\'./heavy-compute.worker\')'],
      answer: 2,
      explanation: 'The URL constructor with import.meta.url gives Angular\'s build system a static reference it can detect, bundle as a separate hashed chunk, and process through the TypeScript compiler. A bare string path bypasses the bundler entirely.',
    },
    {
      q: 'After a Web Worker finishes and sends the result back, what should you always do?',
      options: ['Call worker.close() to flush the message queue', 'Set worker = null to let the garbage collector clean it up', 'Call worker.terminate() to stop the worker and free its resources', 'Nothing — the browser automatically reclaims idle workers'],
      answer: 2,
      explanation: 'worker.terminate() immediately stops the worker thread and frees its resources. Without it, the worker continues running and consuming CPU and memory even after the Angular component is destroyed.',
    },
    {
      q: 'What is the primary advantage of using Transferable objects (e.g., ArrayBuffer) with postMessage?',
      options: ['They bypass the same-origin policy for cross-domain workers', 'They allow the worker to directly mutate main-thread variables', 'They are transferred with zero-copy — ownership moves instead of the data being cloned', 'They automatically compress large payloads before transmission'],
      answer: 2,
      explanation: 'Transferable objects are zero-copy — ownership is moved from one thread to the other rather than deep-cloning the data. After transfer, the original reference is detached (byteLength === 0). This makes them significantly faster for large payloads.',
    },
    {
      q: 'What does Comlink provide that raw postMessage/onmessage does not?',
      options: ['Shared memory access between the worker and main thread', 'A Proxy-based RPC layer so worker functions can be called like regular async functions', 'Built-in TypeScript type generation for worker message schemas', 'Automatic batching of multiple postMessage calls'],
      answer: 1,
      explanation: 'Comlink wraps a Worker with a JavaScript Proxy. This lets you call worker-exported functions as normal async calls (e.g., await api.heavySort(data)) without writing any postMessage or onmessage boilerplate. Errors thrown in the worker are also propagated back to the main thread.',
    },
    {
      q: 'What two HTTP response headers are required to use SharedArrayBuffer in a browser?',
      options: ['Access-Control-Allow-Origin: * and Content-Type: application/wasm', 'Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp', 'Feature-Policy: shared-memory and Origin-Isolation: true', 'Permissions-Policy: shared-array-buffer and X-Frame-Options: SAMEORIGIN'],
      answer: 1,
      explanation: 'Browsers require COOP (Cross-Origin-Opener-Policy: same-origin) and COEP (Cross-Origin-Embedder-Policy: require-corp) to enable SharedArrayBuffer. These headers enable cross-origin isolation, which is required as a Spectre mitigation since SharedArrayBuffer enables high-resolution timing side-channels.',
    },
    {
      q: 'What is the key difference between a Web Worker and a Service Worker?',
      options: ['Web Workers can access the DOM; Service Workers cannot', 'Web Workers are tied to a tab and used for computation; Service Workers run independently and intercept network requests', 'Service Workers run synchronously; Web Workers are asynchronous', 'Web Workers can only be used in Chrome; Service Workers work in all browsers'],
      answer: 1,
      explanation: 'Web Workers are tied to the lifetime of their parent tab and are used to offload CPU-intensive computation. Service Workers live independently, can persist across page navigations, and intercept network requests for caching, offline support, and push notifications. They are complementary tools.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Why can\'t Web Workers access the DOM?', a: 'Workers run in a separate OS thread — they don\'t share memory with the main thread. The DOM is not thread-safe, so it\'s intentionally inaccessible from workers. Workers can only communicate via <code>postMessage()</code>.' },
    { q: 'How do you pass data to and from a Web Worker?', a: '<code>worker.postMessage(data)</code> sends to the worker; the worker handles it in <code>self.onmessage = (e) =&gt; e.data</code>. The worker sends back with <code>self.postMessage(result)</code>; the main thread receives in <code>worker.onmessage</code>. Data is deep-cloned unless you use Transferable objects.' },
    { q: 'What are Transferable objects and why are they faster?', a: 'Transferable objects (ArrayBuffer, ImageBitmap, MessagePort) are transferred zero-copy — ownership moves from one thread to the other. Regular postMessage clones data (can be slow for large payloads). Pass the transfer list as the second argument: <code>worker.postMessage(buffer, [buffer])</code>. After transfer, the original reference is detached.' },
    { q: 'How does the Angular CLI help with Web Workers?', a: '<code>ng generate web-worker my-worker</code> creates a typed worker file and updates <code>tsconfig.worker.json</code>. In the component: <code>new Worker(new URL(\'./my-worker\', import.meta.url))</code>. Angular\'s build system bundles it as a separate hashed chunk.' },
    { q: 'What is Comlink and why would you use it?', a: 'Comlink (by Google Chrome Labs) wraps a Worker with a Proxy that makes cross-thread calls look like normal async function calls. No manual postMessage/onmessage — just <code>await api.expensiveOperation(data)</code>. Errors thrown in the worker propagate back naturally. Much cleaner for complex multi-method APIs.' },
    { q: 'Should you always terminate workers when done?', a: 'Yes — <code>worker.terminate()</code> immediately stops the worker and frees its resources. Without it, the worker runs forever (even after the component is destroyed), consuming CPU and memory. Call it in the <code>onmessage</code> handler after receiving the final result, or in <code>ngOnDestroy</code> if the worker is long-lived.' },
    { q: 'How do you share state between multiple workers?', a: 'Use <code>SharedArrayBuffer</code> (SAB) — a fixed-size binary buffer that is shared across threads without copying. Read and write it atomically using <code>Atomics.add()</code>, <code>Atomics.load()</code>, etc. Requires COOP + COEP HTTP headers. Alternatively use <code>MessageChannel</code> to give workers direct ports for peer-to-peer communication.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'new Worker(url)', type: 'class', desc: 'Spawns a background OS thread that runs a separate JS script without blocking the main thread.', since: '2' },
    { name: 'worker.postMessage(data)', type: 'function', desc: 'Sends a deep-cloned message from the main thread to the worker (or from the worker back via self.postMessage).', since: '2' },
    { name: 'worker.onmessage', type: 'function', desc: 'Event handler on the main thread that fires when the worker posts a result back via self.postMessage().', since: '2' },
    { name: 'worker.terminate()', type: 'function', desc: 'Immediately stops the worker thread and frees its CPU/memory resources — always call after receiving the final result.', since: '2' },
    { name: 'self.onmessage', type: 'function', desc: 'Inside the worker script, this handler receives messages posted from the main thread via worker.postMessage().', since: '2' },
    { name: 'import.meta.url', type: 'function', desc: 'Used with the URL constructor (new URL(\'./my.worker\', import.meta.url)) so the Angular CLI detects and bundles the worker file as a separate chunk.', since: '12' },
    { name: 'ng generate web-worker', type: 'keyword', desc: 'Angular CLI schematic that scaffolds a typed worker file and auto-configures tsconfig.worker.json with the webworker lib.', since: '8' },
    { name: 'Transferable (ArrayBuffer, ImageBitmap)', type: 'interface', desc: 'Objects transferred zero-copy between threads — ownership moves rather than data being deep-cloned. Pass in the second argument of postMessage.', since: '2' },
    { name: 'Comlink.wrap / Comlink.expose', type: 'function', desc: 'Comlink (npm) wraps a Worker with a Proxy so worker-exported functions can be called like normal async functions.', since: '2' },
    { name: 'SharedArrayBuffer', type: 'class', desc: 'Fixed-size binary buffer shared between threads without copying. Requires COOP + COEP headers. Used with Atomics for thread synchronisation.', since: '8' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Creating a worker: bare string path vs CLI pattern',
      before: `// Old: raw string — build system cannot detect or chunk this
const worker = new Worker('heavy-compute.worker.js');
worker.postMessage({ limit: 1e8 });`,
      after: `// New: Angular CLI pattern — bundler detects and hashes the chunk
const worker = new Worker(
  new URL('./heavy-compute.worker', import.meta.url)
);
worker.postMessage({ limit: 1e8 });`,
      note: 'The URL constructor with import.meta.url lets Angular\'s build system find, process, and content-hash the worker file correctly.',
    },
    {
      title: 'Manual postMessage boilerplate vs Comlink RPC',
      before: `// Manual: verbose message protocol, easy to get correlation wrong
worker.postMessage({ fn: 'sort', data: arr });
worker.onmessage = (e) => {
  if (e.data.fn === 'sort') result = e.data.result;
};`,
      after: `// Comlink: call worker functions like async methods — no protocol needed
const api = Comlink.wrap(worker);
const sorted = await api.heavySort(arr);
// Errors thrown in the worker propagate back here automatically`,
      note: 'Comlink uses a JavaScript Proxy to convert the message-passing protocol into ordinary async function calls.',
    },
    {
      title: 'Blocking main thread vs offloading to worker',
      before: `// Runs on main thread — freezes the UI for hundreds of milliseconds
compute() {
  let sum = 0;
  for (let i = 0; i < 5e8; i++) sum += i;
  this.result.set(sum);           // page was unresponsive the whole time
}`,
      after: `// Offloaded — UI stays at 60 fps during computation
compute() {
  const worker = new Worker(new URL('./compute.worker', import.meta.url));
  worker.onmessage = (e) => { this.result.set(e.data); worker.terminate(); };
  worker.postMessage(null);
}`,
      note: 'Any CPU-bound loop > ~16 ms should be moved off-thread to keep the 60 fps render budget intact.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to call worker.terminate()',
      wrong: `worker.onmessage = (e) => {
  this.result.set(e.data);
  // worker keeps running forever consuming CPU + memory
};`,
      right: `worker.onmessage = (e) => {
  this.result.set(e.data);
  worker.terminate(); // free resources immediately
};`,
      explanation: 'A worker that is not terminated continues to consume CPU and memory even after the Angular component is destroyed. Always terminate as soon as the final result is received.',
    },
    {
      title: 'Using a plain string path instead of the URL constructor',
      wrong: `// Build system cannot detect or chunk this
const worker = new Worker('./heavy-compute.worker.js');`,
      right: `// Angular CLI bundles this as a separate hashed chunk
const worker = new Worker(
  new URL('./heavy-compute.worker', import.meta.url)
);`,
      explanation: 'A bare string path bypasses Angular\'s build pipeline. The URL + import.meta.url pattern lets the bundler find, process, and hash the worker file correctly — and makes tree-shaking possible.',
    },
    {
      title: 'Trying to access the DOM inside a worker',
      wrong: `// Inside worker.ts — throws ReferenceError at runtime
self.onmessage = () => {
  document.getElementById('output').textContent = 'done';
};`,
      right: `// Post result back; let the main thread update the DOM
self.onmessage = (e) => {
  const result = heavyCalc(e.data);
  self.postMessage(result);
};`,
      explanation: 'Workers have no access to document, window, or any DOM API. All UI updates must happen on the main thread after receiving the worker result via onmessage.',
    },
    {
      title: 'Cloning huge payloads when Transferables would be zero-copy',
      wrong: `// Deep-clones the entire 80 MB buffer — slow, high memory spike
worker.postMessage(myLargeBuffer);`,
      right: `// Transfers ownership — zero-copy, original is detached
worker.postMessage(myLargeBuffer, [myLargeBuffer]);
// myLargeBuffer.byteLength === 0 after this line`,
      explanation: 'Passing an ArrayBuffer (or ImageBitmap) without the transfer list causes a full structured-clone, which can be orders of magnitude slower for large data and spikes peak memory usage by 2x.',
    },
    {
      title: 'Spawning a new worker on every click instead of reusing',
      wrong: `// New worker on every button click — expensive OS thread creation
onClick() {
  const w = new Worker(new URL('./sort.worker', import.meta.url));
  w.onmessage = (e) => { this.result.set(e.data); w.terminate(); };
  w.postMessage(this.data);
}`,
      right: `// Create once, reuse — terminate only when component destroys
private worker = new Worker(new URL('./sort.worker', import.meta.url));

constructor() {
  this.worker.onmessage = (e) => this.result.set(e.data);
}

onClick() { this.worker.postMessage(this.data); }

ngOnDestroy() { this.worker.terminate(); }`,
      explanation: 'Spawning a worker creates a new OS thread, which takes ~1–50 ms. For repeated operations, create the worker once in the constructor and reuse it. Terminate in ngOnDestroy.',
    },
  ];

  challenge: Challenge = {
    title: 'Off-Thread Fibonacci with a Blob Worker',
    description: 'Create a component method that calculates the nth Fibonacci number (n up to 40) inside an inline Blob-based Web Worker so the main thread stays unblocked. The component should expose a `compute(n: number)` method that spins up the worker, and a `fibResult` signal that holds the answer. Terminate the worker once the result is received.',
    language: 'typescript',
    hints: [
      'Create the worker script as a string, wrap it in `new Blob([...], { type: \'application/javascript\' })`, then pass `URL.createObjectURL(blob)` to `new Worker(...)`.',
      'Inside the blob script, use `self.onmessage = function(e) { ... self.postMessage(result); }` — the value of n arrives as `e.data`.',
      'Set `worker.onmessage = (e) => { this.fibResult.set(e.data); worker.terminate(); }` before calling `worker.postMessage(n)`.',
      'A recursive Fibonacci in the worker: `function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }` — slow enough to show the benefit for n >= 38.',
    ],
    starterCode: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-fib-worker',
  standalone: true,
  template: \`
    <h3>Fibonacci Worker</h3>
    <input type="number" #nInput value="40" min="1" max="45" />
    <button (click)="compute(+nInput.value)">Compute</button>
    @if (running()) { <p>Computing off-thread…</p> }
    @if (fibResult() !== null) { <p>Result: {{ fibResult() }}</p> }
  \`,
})
export class FibWorkerComponent {
  fibResult = signal<number | null>(null);
  running   = signal(false);

  compute(n: number): void {
    this.running.set(true);
    this.fibResult.set(null);

    // TODO: create an inline Blob worker that computes fib(n)
    // and posts the result back. Terminate the worker on receipt.
  }
}`,
    solution: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-fib-worker',
  standalone: true,
  template: \`
    <h3>Fibonacci Worker</h3>
    <input type="number" #nInput value="40" min="1" max="45" />
    <button (click)="compute(+nInput.value)">Compute</button>
    @if (running()) { <p>Computing off-thread…</p> }
    @if (fibResult() !== null) { <p>Result: {{ fibResult() }}</p> }
  \`,
})
export class FibWorkerComponent {
  fibResult = signal<number | null>(null);
  running   = signal(false);

  compute(n: number): void {
    this.running.set(true);
    this.fibResult.set(null);

    const blob = new Blob([\`
      function fib(n) {
        return n <= 1 ? n : fib(n - 1) + fib(n - 2);
      }
      self.onmessage = function(e) {
        const result = fib(e.data);
        self.postMessage(result);
      };
    \`], { type: 'application/javascript' });

    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      this.fibResult.set(e.data);
      this.running.set(false);
      worker.terminate();
    };

    worker.postMessage(n);
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Web Workers run JavaScript in a background OS thread so CPU-intensive code cannot block the main UI thread — communication is strictly via postMessage() since workers have no DOM access.',
    mustKnow: [
      'Workers run in a separate OS thread with no DOM access — all UI updates must go through <code>postMessage()</code> back to the main thread',
      'Always use <code>new Worker(new URL(\'./my.worker\', import.meta.url))</code> so Angular\'s build system bundles the worker as a hashed chunk',
      '<code>worker.terminate()</code> must always be called after receiving the final result — workers do not self-terminate',
      'Transferable objects (ArrayBuffer, ImageBitmap) are zero-copy — pass them in the second argument: <code>postMessage(buf, [buf])</code>; the original is detached after transfer',
      'Comlink wraps workers in a Proxy to make cross-thread calls look like normal <code>async</code> function calls — eliminates postMessage boilerplate',
      '<code>SharedArrayBuffer</code> enables true shared memory between threads but requires COOP + COEP HTTP headers (Spectre mitigation)',
      'Web Workers = computation, tied to tab lifetime. Service Workers = network interception, independent lifecycle. They are complementary.',
    ],
    interviewFocus: [
      'Why can\'t Web Workers access the DOM, and what is the only way to communicate with them?',
      'What is the difference between postMessage with structured clone vs using Transferable objects?',
      'What does Comlink add on top of raw postMessage/onmessage?',
      'What are SharedArrayBuffer and Atomics, and what HTTP headers do they require?',
      'When should you use a Web Worker vs a Service Worker?',
    ],
  };
}
