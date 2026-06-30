import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-web-workers',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './web-workers.html',
  styleUrl: './web-workers.scss',
})
export class PerfWebWorkers {

  quickRef: QuickRefItem[] = [
    { name: 'Web Worker',          type: 'keyword', desc: 'Background JS thread — no DOM access, communicates via postMessage/onmessage' },
    { name: 'Comlink',             type: 'keyword', desc: 'npm library that wraps a Worker with a Proxy for RPC-style async function calls' },
    { name: 'SharedArrayBuffer',   type: 'keyword', desc: 'Shared memory between main thread and Worker — requires cross-origin isolation (COOP/COEP)' },
    { name: 'Atomics',             type: 'class',   desc: 'Atomic read/write/wait operations on SharedArrayBuffer — enables thread synchronisation' },
    { name: 'postMessage()',        type: 'method',  desc: 'Send data to a Worker — structured clone copies the data (or transfer ownership with Transferable)' },
    { name: 'Transferable',        type: 'keyword', desc: 'ArrayBuffer, ImageBitmap, MessagePort — transferred to Worker without copying (zero-copy)' },
    { name: 'OffscreenCanvas',     type: 'class',   desc: 'Canvas that can be transferred to a Worker — render charts/WebGL off the main thread' },
    { name: 'navigator.hardwareConcurrency', type: 'keyword', desc: 'Number of logical CPU cores — use to size a Worker pool without over-subscribing' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why move work off the main thread',
      points: [
        'The browser\'s main thread handles JS execution, layout, paint, user input, and animations — it is single-threaded.',
        'Any task > 50ms blocks all input handling — the user cannot click, scroll, or type while it runs.',
        'CPU-intensive work (JSON parsing, image processing, sorting, crypto, WASM) is the prime candidate for Workers.',
        'Moving heavy work to a Worker keeps the main thread free for input handling — directly reducing INP.',
        'Web Workers are true OS threads: they run in parallel on a separate CPU core, not interleaved via event loop.',
      ],
    },
    {
      heading: 'Web Worker basics — postMessage API',
      points: [
        'Create: const worker = new Worker(new URL("./worker.ts", import.meta.url)) — bundler handles the separate chunk.',
        'Send: worker.postMessage(data) — data is structured-cloned (deep copy) to the Worker thread.',
        'Receive (main): worker.onmessage = (e) => console.log(e.data)',
        'Receive (worker): self.onmessage = (e) => { /* process */ self.postMessage(result); }',
        'Terminate: worker.terminate() — stops the Worker immediately; memory is freed.',
      ],
    },
    {
      heading: 'Comlink — clean RPC over postMessage',
      points: [
        'Comlink wraps a Worker\'s exports in a Proxy — you call worker functions like async functions.',
        'No manual postMessage/onmessage wiring — Comlink handles the message protocol automatically.',
        'Worker side: expose({ myFn }) wraps the exports. Main side: const api = wrap<typeof worker>(worker).',
        'Supports: regular functions, class instances, nested objects, Promises, callbacks via proxy().',
        'Error propagation: exceptions in the worker are re-thrown on the main thread as Promises rejecting.',
      ],
    },
    {
      heading: 'Transferable objects — zero-copy transfer',
      points: [
        'By default postMessage() deep-clones data — a 100 MB ArrayBuffer takes ~100ms to clone.',
        'Transferable objects (ArrayBuffer, ImageBitmap, MessagePort, OffscreenCanvas) are transferred, not copied.',
        'After transfer, the original reference becomes detached (zero-length / null) — ownership moves to the Worker.',
        'Syntax: worker.postMessage(buffer, [buffer]) — second argument is the transfer list.',
        'Use for: image pixels, audio data, large JSON buffers — anywhere clone cost matters.',
      ],
    },
    {
      heading: 'SharedArrayBuffer and Atomics',
      points: [
        'SharedArrayBuffer creates a block of memory shared between the main thread and Worker — no copying.',
        'Requires cross-origin isolation: Cross-Origin-Opener-Policy: same-origin + Cross-Origin-Embedder-Policy: require-corp.',
        'Atomics.load/store/add/sub: atomic operations that prevent data races on shared memory.',
        'Atomics.wait() blocks a Worker thread until notified — used for synchronisation primitives.',
        'Atomics.notify() wakes threads waiting on a location — pairs with Atomics.wait() for mutex patterns.',
      ],
    },
    {
      heading: 'Worker pool and OffscreenCanvas',
      points: [
        'Worker pool: create navigator.hardwareConcurrency Workers; distribute tasks via a queue — maximises parallelism.',
        'Pool prevents over-subscription: more Workers than cores = context switching overhead with no benefit.',
        'OffscreenCanvas: canvas.transferControlToOffscreen() returns a transferable canvas for Worker rendering.',
        'WebGL in a Worker via OffscreenCanvas: render complex 3D scenes off the main thread.',
        'Service Workers are different — they act as a network proxy, not a computation thread. Do not confuse the two.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Worker',
      language: 'typescript',
      code: `// sort-worker.ts — runs in a separate thread
self.onmessage = (e: MessageEvent<number[]>) => {
  const data = e.data;
  // This heavy sort runs on a background thread — main thread stays free
  data.sort((a, b) => a - b);
  self.postMessage(data);
};

// main.ts — create and use the Worker
const worker = new Worker(
  new URL('./sort-worker.ts', import.meta.url),  // bundler creates separate chunk
  { type: 'module' }
);

const bigArray = Array.from({ length: 1_000_000 }, () => Math.random() * 1e9);

// Transfer ownership — zero-copy (no clone of 8MB array)
const buffer = new Int32Array(bigArray).buffer;
worker.postMessage(buffer, [buffer]);  // buffer is now detached on main thread

worker.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  const sorted = new Int32Array(e.data);
  console.log('Sorted:', sorted[0], '→', sorted[sorted.length - 1]);
  worker.terminate();
};

worker.onerror = (e) => console.error('Worker error:', e.message);`,
    },
    {
      label: 'Comlink — RPC style',
      language: 'typescript',
      code: `// npm install comlink

// image-worker.ts — Worker with Comlink
import * as Comlink from 'comlink';

const api = {
  async processImage(imageData: ImageData): Promise<ImageData> {
    // CPU-intensive processing — runs off main thread
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      // Greyscale conversion
      const avg = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
      pixels[i] = pixels[i+1] = pixels[i+2] = avg;
    }
    return imageData;
  },

  async sortLargeDataset(data: number[]): Promise<number[]> {
    return data.sort((a, b) => a - b);
  },
};

Comlink.expose(api);

// main.ts — use the Worker like a normal async function
import * as Comlink from 'comlink';

const worker = new Worker(new URL('./image-worker.ts', import.meta.url), { type: 'module' });
const remoteApi = Comlink.wrap<typeof api>(worker);

async function applyGreyscale(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Looks like a local async call — Comlink handles postMessage behind the scenes
  const processed = await remoteApi.processImage(Comlink.transfer(imageData, [imageData.data.buffer]));
  ctx.putImageData(processed, 0, 0);
}`,
    },
    {
      label: 'Worker pool',
      language: 'typescript',
      code: `// worker-pool.ts — distribute tasks across multiple Workers
class WorkerPool<TInput, TOutput> {
  private workers: Worker[] = [];
  private queue: Array<{ data: TInput; resolve: (v: TOutput) => void; reject: (e: unknown) => void }> = [];
  private busy: Set<Worker> = new Set();

  constructor(workerUrl: URL, size = navigator.hardwareConcurrency) {
    for (let i = 0; i < size; i++) {
      const w = new Worker(workerUrl, { type: 'module' });
      w.onmessage = (e: MessageEvent<TOutput>) => this.onResult(w, e.data);
      w.onerror   = (e) => this.onError(w, e);
      this.workers.push(w);
    }
  }

  run(data: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const idle = this.workers.find(w => !this.busy.has(w));
      if (idle) {
        this.dispatch(idle, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private dispatch(worker: Worker, data: TInput, resolve: (v: TOutput) => void, reject: (e: unknown) => void) {
    this.busy.add(worker);
    (worker as any)._resolve = resolve;
    (worker as any)._reject  = reject;
    worker.postMessage(data);
  }

  private onResult(worker: Worker, result: TOutput) {
    (worker as any)._resolve(result);
    this.busy.delete(worker);
    const next = this.queue.shift();
    if (next) this.dispatch(worker, next.data, next.resolve, next.reject);
  }

  private onError(worker: Worker, e: ErrorEvent) {
    (worker as any)._reject(new Error(e.message));
    this.busy.delete(worker);
  }

  terminate() { this.workers.forEach(w => w.terminate()); }
}

// Usage
const pool = new WorkerPool<number[], number[]>(new URL('./sort-worker.ts', import.meta.url));
const results = await Promise.all(chunks.map(chunk => pool.run(chunk)));`,
    },
    {
      label: 'OffscreenCanvas',
      language: 'typescript',
      code: `// chart-worker.ts — render a chart off the main thread
self.onmessage = (e: MessageEvent<{ canvas: OffscreenCanvas; data: number[] }>) => {
  const { canvas, data } = e.data;
  const ctx = canvas.getContext('2d')!;

  // Draw chart — runs entirely on Worker thread, zero main-thread cost
  const max = Math.max(...data);
  const barWidth = canvas.width / data.length;

  ctx.fillStyle = '#16a34a';
  data.forEach((value, i) => {
    const barHeight = (value / max) * canvas.height;
    ctx.fillRect(
      i * barWidth,
      canvas.height - barHeight,
      barWidth - 2,
      barHeight
    );
  });

  // Commit frame to the display canvas
  // (OffscreenCanvas auto-composites into the original <canvas>)
  self.postMessage('done');
};

// main.ts — transfer canvas control to Worker
const canvas = document.getElementById('chart') as HTMLCanvasElement;
const offscreen = canvas.transferControlToOffscreen();  // detach from main thread

const worker = new Worker(new URL('./chart-worker.ts', import.meta.url), { type: 'module' });

// Transfer offscreen canvas — Worker now owns rendering
worker.postMessage({ canvas: offscreen, data: [4, 8, 3, 9, 2, 7] }, [offscreen]);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Accessing the DOM inside a Web Worker',
      wrong: `// worker.ts — throws ReferenceError: document is not defined
self.onmessage = () => {
  document.getElementById('status').textContent = 'Done';  // ERROR
  window.location.href = '/result';                         // ERROR
};`,
      right: `// worker.ts — send result back to main thread; let main update DOM
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage({ type: 'done', result });
};

// main.ts — main thread handles all DOM updates
worker.onmessage = ({ data }) => {
  if (data.type === 'done') {
    document.getElementById('status')!.textContent = 'Done';
  }
};`,
      explanation: 'Web Workers run in a separate global scope (DedicatedWorkerGlobalScope) — there is no window, document, or DOM. Workers can only communicate with the main thread via postMessage. All DOM reads and writes must happen on the main thread.',
    },
    {
      title: 'Cloning large ArrayBuffers instead of transferring them',
      wrong: `// 100MB buffer — postMessage clones it: ~100ms copy
const buffer = new ArrayBuffer(100 * 1024 * 1024);
worker.postMessage({ buffer });  // buffer is cloned — original still accessible`,
      right: `// Transfer ownership — zero-copy, <1ms regardless of size
const buffer = new ArrayBuffer(100 * 1024 * 1024);
worker.postMessage(buffer, [buffer]);  // second arg = transfer list
// buffer is now detached on main thread (byteLength === 0)`,
      explanation: 'postMessage without a transfer list deep-clones the data — a 100 MB ArrayBuffer takes ~100ms to copy. Transferable objects (ArrayBuffer, ImageBitmap, OffscreenCanvas) are transferred in zero time by moving ownership. The original reference becomes detached after transfer.',
    },
    {
      title: 'Creating a new Worker on every task instead of reusing',
      wrong: `// Creates 1000 Workers for 1000 tasks — each Worker has startup overhead (~30ms)
async function processItem(item: unknown) {
  const worker = new Worker(new URL('./worker.ts', import.meta.url));
  // ... use worker
  worker.terminate();  // tear down after each use
}
items.forEach(processItem);  // 1000 Workers = 30 seconds of startup`,
      right: `// Create once, reuse for all tasks
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

// Or use a pool sized to CPU cores
const pool = new WorkerPool(new URL('./worker.ts', import.meta.url), navigator.hardwareConcurrency);
const results = await Promise.all(items.map(item => pool.run(item)));`,
      explanation: 'Web Worker startup takes ~30–100ms (JS parse, thread creation). Creating a new Worker per task multiplies this cost across every task. Create Workers once at app startup and reuse them — or use a pool that matches Worker count to CPU core count.',
    },
    {
      title: 'Using more Workers than CPU cores',
      wrong: `// 100 Workers for 100 tasks — but only 8 CPU cores available
const workers = Array.from({ length: 100 }, () =>
  new Worker(new URL('./worker.ts', import.meta.url))
);
// 92 Workers sit idle or cause context-switching overhead`,
      right: `// Size pool to CPU cores — maximises parallelism without over-subscription
const POOL_SIZE = navigator.hardwareConcurrency;  // e.g. 8 on a typical laptop
console.log('Pool size:', POOL_SIZE);
const pool = new WorkerPool(new URL('./worker.ts', import.meta.url), POOL_SIZE);`,
      explanation: 'OS threads beyond available CPU cores don\'t run in parallel — they context-switch, adding overhead. navigator.hardwareConcurrency returns the number of logical CPU cores. Use this as your Worker pool size for maximum parallel throughput without context-switching penalty.',
    },
    {
      title: 'Confusing Web Workers with Service Workers',
      wrong: `// Trying to use Service Worker for CPU computation
navigator.serviceWorker.register('./compute-worker.js');
// Then sending computation requests via fetch — wrong abstraction`,
      right: `// Web Worker: computation thread — postMessage API
const computeWorker = new Worker(new URL('./compute.ts', import.meta.url));
computeWorker.postMessage(data);

// Service Worker: network proxy — fetch/cache API
navigator.serviceWorker.register('./sw.js');
// Use for: caching, offline support, background sync — NOT CPU work`,
      explanation: 'Service Workers are network proxies — they intercept fetch requests and manage caches. Web Workers are computation threads — they run arbitrary JS in parallel. They use completely different APIs and serve different purposes. Never use a Service Worker for CPU-intensive computation.',
    },
    {
      title: 'Not handling Worker errors',
      wrong: `const worker = new Worker(new URL('./worker.ts', import.meta.url));
worker.postMessage(data);
worker.onmessage = (e) => console.log(e.data);
// If worker.ts throws, the error is silently swallowed`,
      right: `const worker = new Worker(new URL('./worker.ts', import.meta.url));
worker.postMessage(data);
worker.onmessage = (e) => console.log(e.data);
worker.onerror = (e) => {
  console.error('Worker error:', e.message, 'in', e.filename, 'line', e.lineno);
  // Optionally restart the worker or report to your error tracker
  worker.terminate();
};
worker.onmessageerror = (e) => console.error('Deserialization error:', e);`,
      explanation: 'Unhandled errors in a Worker are delivered to the main thread via the onerror event. Without an onerror handler, Worker exceptions are silently swallowed and your UI appears to hang. Always add onerror handling — log it and decide whether to restart the Worker or surface the error to the user.',
    },
  ];

  challenge: Challenge = {
    title: 'Move JSON parsing off the main thread',
    language: 'typescript',
    description: `Your app fetches and parses a 5 MB JSON file on the main thread — creating a 400ms long task that blocks user input.

Move the JSON parsing to a Web Worker using Comlink:
1. Create a \`data-worker.ts\` that exports a \`parseData(jsonString: string)\` function
2. In the main thread, use Comlink to call parseData without blocking
3. While parsing runs in the Worker, the main thread should remain responsive (log "main thread free" during parsing)
4. Return the parsed data and log the item count`,
    hints: [
      'Worker file: import * as Comlink from "comlink"; const api = { parseData }; Comlink.expose(api)',
      'Main file: const worker = new Worker(url); const api = Comlink.wrap<typeof workerApi>(worker)',
      'Comlink.wrap returns a Proxy — call api.parseData(json) as an async function',
      'Add a console.log between starting the parse and awaiting the result — it should log while Worker runs',
    ],
    starterCode: `// BEFORE — blocks main thread for 400ms
async function loadData() {
  const response = await fetch('/api/large-dataset.json');
  const text = await response.text();

  console.log('Starting parse...');
  // This blocks the main thread for 400ms — no input can be handled
  const data = JSON.parse(text);
  console.log('Parsed', data.items.length, 'items');
  return data;
}`,
    solution: `// data-worker.ts
import * as Comlink from 'comlink';

const workerApi = {
  parseData(jsonString: string) {
    // Runs on Worker thread — main thread stays free during this
    const data = JSON.parse(jsonString) as { items: unknown[] };
    return { itemCount: data.items.length, data };
  }
};

Comlink.expose(workerApi);
export type WorkerApi = typeof workerApi;

// main.ts
import * as Comlink from 'comlink';
import type { WorkerApi } from './data-worker';

async function loadData() {
  const worker = new Worker(
    new URL('./data-worker.ts', import.meta.url),
    { type: 'module' }
  );
  const api = Comlink.wrap<WorkerApi>(worker);

  const response = await fetch('/api/large-dataset.json');
  const text = await response.text();

  // Start Worker parse — does NOT block main thread
  const parsePromise = api.parseData(text);

  // This logs WHILE Worker is parsing — main thread is free
  console.log('main thread free — Worker is parsing in background');

  const { itemCount, data } = await parsePromise;
  console.log('Parsed', itemCount, 'items');
  worker.terminate();
  return data;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main reason to move CPU work to a Web Worker?',
      options: [
        'Workers can access the network faster than the main thread',
        'Workers run on a separate OS thread — heavy computation doesn\'t block main-thread input handling',
        'Workers bypass the same-origin policy for API calls',
        'Workers have access to more memory than the main thread',
      ],
      answer: 1,
      explanation: 'The browser\'s main thread handles JS, layout, paint, AND user input — all on one thread. A CPU-heavy task (> 50ms) blocks all input handling during that time. Web Workers run on a separate OS thread, so heavy computation runs in parallel without blocking input events, directly reducing INP.',
    },
    {
      q: 'What happens to a transferred ArrayBuffer on the main thread after postMessage(buffer, [buffer])?',
      options: [
        'It is read-only until the Worker sends it back',
        'It becomes detached — byteLength is 0 and it cannot be used',
        'It is garbage collected immediately',
        'It remains accessible but the Worker gets a copy',
      ],
      answer: 1,
      explanation: 'Transferable objects (ArrayBuffer, ImageBitmap, etc.) have their ownership transferred to the Worker. The original reference on the main thread becomes "detached" — byteLength becomes 0 and any access throws a TypeError. This is what makes transfer zero-copy: no data is cloned.',
    },
    {
      q: 'What does Comlink do?',
      options: [
        'It compresses messages sent between Workers and the main thread',
        'It wraps a Worker with a Proxy so you can call Worker functions as async functions without manual postMessage',
        'It creates a shared memory channel between multiple Workers',
        'It automatically load-balances tasks across a Worker pool',
      ],
      answer: 1,
      explanation: 'Comlink wraps a Worker\'s exposed API in a Proxy. Calling a method on the Proxy sends a postMessage and returns a Promise that resolves when the Worker responds. This eliminates manual postMessage/onmessage wiring and makes Worker communication look like normal async function calls.',
    },
    {
      q: 'What headers are required to use SharedArrayBuffer?',
      options: [
        'Access-Control-Allow-Origin: * and Vary: Origin',
        'Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp',
        'Content-Security-Policy: sandbox and Strict-Transport-Security',
        'X-Frame-Options: SAMEORIGIN and X-Content-Type-Options: nosniff',
      ],
      answer: 1,
      explanation: 'SharedArrayBuffer uses shared memory between threads. Because of Spectre-class CPU attacks (cross-origin timing attacks via shared memory), browsers require cross-origin isolation before enabling it. This is achieved via COOP: same-origin and COEP: require-corp response headers.',
    },
    {
      q: 'How should you size a Web Worker pool for maximum parallel efficiency?',
      options: [
        'One Worker per pending task — scale dynamically',
        'navigator.hardwareConcurrency — matches the number of logical CPU cores',
        'Always 4 Workers — safe default across all devices',
        'navigator.deviceMemory * 2 — scale to available RAM',
      ],
      answer: 1,
      explanation: 'navigator.hardwareConcurrency returns the number of logical CPU cores (typically 4–16 on modern devices). Using more Workers than cores doesn\'t increase parallelism — excess Workers context-switch, adding overhead. Matching pool size to core count maximises throughput without over-subscription.',
    },
    {
      q: 'What types of data can be transferred between a Web Worker and the main thread via postMessage?',
      options: ['Only strings', 'Any JSON-serializable object; ArrayBuffers and transferable objects can be transferred (zero-copy)', 'DOM nodes and functions', 'Only primitive values'],
      answer: 1,
      explanation: 'postMessage uses the Structured Clone algorithm — it can copy objects, arrays, Dates, Maps, ArrayBuffers, ImageData, and more. Transferable objects (ArrayBuffer, MessagePort, ImageBitmap) are transferred with zero-copy using the transfer argument: postMessage(buffer, [buffer]). After transfer, the original reference is neutered (ArrayBuffer.byteLength === 0). Functions and DOM nodes cannot be cloned or transferred.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use TypeScript in Web Workers with Vite/Angular?',
      a: 'Yes. In Vite: new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }) — Vite bundles worker.ts as a separate ES module chunk. In Angular: the CLI supports Worker generation with ng generate web-worker <name>, creating a typed worker with a separate tsconfig.worker.json. Both approaches support TypeScript with full type checking in the Worker file.',
    },
    {
      q: 'What tasks are good candidates for Web Workers?',
      a: 'Best candidates: JSON parsing of large payloads (> 1 MB), image/video processing (pixel manipulation, resizing, filtering), cryptography (hashing, encryption), sorting/filtering large arrays (> 100K items), WASM execution, text search across large documents, and chart rendering (via OffscreenCanvas). Bad candidates: anything that needs DOM access, tasks that complete in < 5ms (Worker overhead outweighs the benefit), or tasks that require frequent bidirectional synchronisation.',
    },
    {
      q: 'How do I debug code running inside a Web Worker?',
      a: 'Chrome DevTools → Sources panel → look for a "Workers" section in the left sidebar — each active Worker appears there. You can set breakpoints, step through code, and inspect variables inside the Worker. console.log() inside a Worker appears in the DevTools Console tab labelled with the Worker URL. For production debugging, use onerror on the Worker to catch and log errors.',
    },
    {
      q: 'Is there an Angular-specific way to use Web Workers?',
      a: 'Yes: ng generate web-worker my-worker creates src/app/my-worker.worker.ts with the correct tsconfig setup. Call it from a service with new Worker(new URL("./my-worker.worker", import.meta.url)) — Angular CLI bundles it as a separate chunk. For cleaner APIs, combine with Comlink. The Angular CDK also uses Workers internally for some virtualisation computations.',
    },
    {
      q: 'What is the difference between postMessage structured clone and JSON.stringify for transferring data?',
      a: 'Structured clone (used by postMessage) supports more types than JSON: TypedArrays, ArrayBuffer, Map, Set, Date, RegExp, Blob, ImageData — without conversion. JSON.stringify/parse only handles plain objects, arrays, strings, and numbers — it cannot handle undefined, NaN (becomes null), Dates (becomes string), or circular references. For large binary data, use Transferable objects to avoid cloning entirely.',
    },
    {
      q: 'What kinds of work are NOT good candidates for offloading to a Web Worker, even though they are slow?',
      a: 'Web Workers cannot access the DOM directly, so any work that requires reading or writing layout, styles, or DOM nodes mid-computation (most UI rendering logic) cannot be moved to a worker without significant restructuring (or libraries like Comlink/OffscreenCanvas for specific rendering cases). Work that is already fast (under a few milliseconds) is also a poor candidate — the overhead of serializing data across the postMessage boundary (structured clone, which is not free for large objects) can outweigh the benefit, and worker communication is inherently asynchronous, adding complexity for what may have been a simple synchronous call. The best candidates are genuinely CPU-heavy, DOM-independent tasks: large JSON parsing/transformation, image/data processing, complex calculations, or client-side search/filtering over large datasets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Web Workers run CPU-heavy tasks on a separate OS thread — keeping the main thread free for input; use Comlink for clean APIs and Transferable objects for zero-copy large data transfer.',
    mustKnow: [
      'Workers have no DOM access — communicate only via postMessage/onmessage',
      'Transferable objects (ArrayBuffer, ImageBitmap) transfer ownership with zero copy',
      'Comlink wraps a Worker in a Proxy for RPC-style async calls without manual postMessage',
      'Pool size = navigator.hardwareConcurrency — never more Workers than CPU cores',
      'SharedArrayBuffer requires COOP/COEP cross-origin isolation headers',
      'Service Workers = network proxy; Web Workers = computation thread — don\'t confuse them',
    ],
    interviewFocus: [
      'Why would you move computation to a Web Worker instead of using async/await?',
      'What is a Transferable object and why is it faster than the default postMessage clone?',
      'What does Comlink do and how does it simplify Worker usage?',
      'What are the constraints on Web Workers (no DOM, cross-origin isolation)?',
    ],
  };
}
