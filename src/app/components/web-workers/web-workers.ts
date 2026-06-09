import { Component, signal } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-web-workers',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './web-workers.html',
  styleUrl: './web-workers.scss',
})
export class WebWorkersDemo {
  qna: QnaItem[] = [
    { q: 'Why can\'t Web Workers access the DOM?', a: 'Workers run in a separate OS thread — they don\'t share memory with the main thread. The DOM is not thread-safe, so it\'s intentionally inaccessible from workers. Workers can only communicate via <code>postMessage()</code>.' },
    { q: 'How do you pass data to and from a Web Worker?', a: '<code>worker.postMessage(data)</code> sends to the worker; the worker handles it in <code>self.onmessage = (e) => e.data</code>. The worker sends back with <code>self.postMessage(result)</code>; the main thread receives in <code>worker.onmessage</code>.' },
    { q: 'What are Transferable objects and why are they faster?', a: 'Transferable objects (ArrayBuffer, ImageBitmap, MessagePort) are transferred zero-copy — ownership moves from one thread to the other. Regular postMessage clones data (can be slow for large payloads). Use transfer for typed arrays and image data.' },
    { q: 'How does the Angular CLI help with Web Workers?', a: '<code>ng generate web-worker my-worker</code> creates a typed worker file and updates <code>tsconfig.worker.json</code>. In the component: <code>new Worker(new URL(\'./my-worker\', import.meta.url))</code>. Angular\'s build system bundles it as a separate chunk.' },
    { q: 'What is Comlink and why would you use it?', a: 'Comlink (by Google) wraps a Worker with a Proxy that makes cross-thread calls look like normal async function calls. No manual postMessage/onmessage — just <code>await api.expensiveOperation(data)</code>. Much cleaner for complex APIs.' },
    { q: 'Always terminate workers you create?', a: 'Yes — <code>worker.terminate()</code> immediately stops the worker and frees its resources. Without it, the worker runs forever (even after the component is destroyed), consuming CPU and memory. Call it in the onmessage handler after receiving the result.' },
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
    // Simulate heavy computation — blocks the main thread
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
        'Web Workers run JavaScript in a background thread — separate from the main UI thread.',
        'Heavy computations (sorting, parsing, crypto) on the main thread block rendering and user input.',
        'Workers have no access to the DOM — they communicate with the main thread via postMessage() / onmessage.',
        'Angular CLI scaffolds workers: ng generate web-worker my-worker — auto-configures tsconfig.',
      ],
    },
    {
      heading: 'Worker communication',
      points: [
        'Main → Worker: worker.postMessage(data) sends a message; data is deep-cloned (structured clone).',
        'Worker → Main: self.postMessage(result) sends back; main handles via worker.onmessage = (e) => e.data.',
        'Transferable objects (ArrayBuffer, ImageBitmap) are transferred (zero-copy) instead of cloned — much faster for large data.',
        'worker.terminate() kills the worker immediately — always terminate when done to free resources.',
      ],
    },
    {
      heading: 'Angular CLI integration',
      points: [
        'ng generate web-worker app creates src/app/app.worker.ts and updates tsconfig.',
        'Import and use: const worker = new Worker(new URL(\'./app.worker\', import.meta.url)).',
        'Angular\'s build system bundles the worker file separately — it gets its own chunk.',
        'Workers can import Angular services that don\'t use DI or DOM — pure utility functions.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Workers are not a silver bullet — postMessage has serialisation overhead for large payloads.',
        'Use workers for: image processing, CSV/JSON parsing, sorting large datasets, crypto operations.',
        'SharedArrayBuffer + Atomics enables shared memory between threads — requires COOP/COEP headers.',
        'Comlink (npm package) wraps workers with a Proxy API — call worker functions like regular async functions.',
      ],
    },
  ];

  tabs: CodeTab[] = [
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
      worker.terminate();
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
import * as Comlink from 'comlink';

const api = {
  async heavySort(arr: number[]): Promise<number[]> {
    return arr.sort((a, b) => a - b);
  },
};
Comlink.expose(api);

// component.ts
import * as Comlink from 'comlink';

const worker = new Worker(new URL('./worker', import.meta.url));
const api = Comlink.wrap<typeof import('./worker')['api']>(worker);

// Call like a normal async function — Comlink handles postMessage
const sorted = await api.heavySort(myBigArray);`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Why can Web Workers NOT access the DOM?', options: ['The browser sandbox blocks DOM APIs for security reasons', 'Workers run in a separate OS thread and the DOM is not thread-safe', 'Angular strips DOM access at compile time for workers', 'Workers only support ES5 syntax, which predates the DOM API'], answer: 1, explanation: 'Workers run in a separate OS thread and do not share memory with the main thread. The DOM is intentionally inaccessible because it is not thread-safe. Communication must go through postMessage().' },
    { q: 'Which of the following correctly shows how an Angular component creates a worker using the CLI-generated file pattern?', options: ['new Worker(\'./heavy-compute.worker.ts\')', 'import Worker from \'./heavy-compute.worker\'', 'new Worker(new URL(\'./heavy-compute.worker\', import.meta.url))', 'WorkerFactory.create(\'./heavy-compute.worker\')'], answer: 2, explanation: 'Angular\'s build system requires the URL constructor with import.meta.url so it can detect and bundle the worker file as a separate chunk at build time.' },
    { q: 'After a Web Worker finishes its computation and sends the result back, what should you always do?', options: ['Call worker.close() to flush the message queue', 'Set worker = null to let the garbage collector clean it up', 'Call worker.terminate() to stop the worker and free its resources', 'Nothing — the browser automatically reclaims idle workers'], answer: 2, explanation: 'worker.terminate() immediately stops the worker and frees its resources. Without it, the worker continues running and consuming CPU and memory even after the Angular component is destroyed.' },
    { q: 'What is the primary advantage of using Transferable objects (e.g., ArrayBuffer) with postMessage instead of plain objects?', options: ['They bypass the same-origin policy for cross-domain workers', 'They allow the worker to directly mutate main-thread variables', 'They are transferred with zero-copy — ownership moves instead of the data being cloned', 'They automatically compress large payloads before transmission'], answer: 2, explanation: 'Transferable objects are zero-copy — ownership is moved from one thread to the other rather than deep-cloning the data. This makes them significantly faster for large payloads like typed arrays and image data.' },
    { q: 'What does Comlink provide that raw postMessage/onmessage does not?', options: ['Shared memory access between the worker and main thread', 'A Proxy-based RPC layer so worker functions can be called like regular async functions', 'Built-in TypeScript type generation for worker message schemas', 'Automatic batching of multiple postMessage calls into one network request'], answer: 1, explanation: 'Comlink wraps a Worker with a JavaScript Proxy. This lets you call worker-exported functions as normal async calls (e.g., await api.heavySort(data)) without writing any postMessage or onmessage boilerplate.' },
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

  quickRef: QuickRefItem[] = [
    { name: 'new Worker(url)', type: 'class', desc: 'Spawns a background OS thread that runs a separate JS script without blocking the main thread.' , since: '2'},
    { name: 'worker.postMessage(data)', type: 'function', desc: 'Sends a deep-cloned message from the main thread to the worker (or from the worker back via self.postMessage).' , since: '2'},
    { name: 'worker.onmessage', type: 'function', desc: 'Event handler on the main thread that fires when the worker posts a result back via self.postMessage().' , since: '2'},
    { name: 'worker.terminate()', type: 'function', desc: 'Immediately stops the worker thread and frees its CPU/memory resources — always call after receiving the final result.' , since: '2'},
    { name: 'self.onmessage', type: 'function', desc: 'Inside the worker script, this handler receives messages posted from the main thread via worker.postMessage().' , since: '2'},
    { name: 'import.meta.url', type: 'function', desc: 'Used with the URL constructor (new URL(\'./my.worker\', import.meta.url)) so the Angular CLI can detect and bundle the worker file as a separate chunk.' , since: '12'},
    { name: 'ng generate web-worker', type: 'function', desc: 'Angular CLI schematic that scaffolds a typed worker file and auto-configures tsconfig.worker.json.' , since: '8'},
    { name: 'Transferable (ArrayBuffer, ImageBitmap)', type: 'interface', desc: 'Objects that are transferred zero-copy between threads (ownership moves) rather than deep-cloned, making them much faster for large payloads.' , since: '2'},
    { name: 'URL.createObjectURL(blob)', type: 'function', desc: 'Creates an object URL from a Blob so you can spin up an inline worker from a script string without a separate file.' , since: '2'},
    { name: 'Comlink.wrap / Comlink.expose', type: 'function', desc: 'Comlink (npm) wraps a Worker with a Proxy so worker-exported functions can be called like normal async functions without manual postMessage boilerplate.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Creating a worker: old inline script string vs CLI pattern', before: '// Old: raw string, no bundler awareness\nconst worker = new Worker(\'heavy-compute.worker.js\');\nworker.postMessage({ limit: 1e8 });', after: '// New: Angular CLI pattern — bundler detects and chunks it\nconst worker = new Worker(\n  new URL(\'./heavy-compute.worker\', import.meta.url)\n);\nworker.postMessage({ limit: 1e8 });',
      note: 'The URL constructor with import.meta.url lets Angular\'s build system bundle the worker as a separate chunk and apply tree-shaking.' },
    { title: 'Manual postMessage boilerplate vs Comlink RPC', before: '// Manual: verbose message protocol\nworker.postMessage({ fn: \'sort\', data: arr });\nworker.onmessage = (e) => {\n  if (e.data.fn === \'sort\') result = e.data.result;\n};', after: '// Comlink: call worker functions like async methods\nconst api = Comlink.wrap(worker);\nconst sorted = await api.heavySort(arr);\n// No postMessage / onmessage needed',
      note: 'Comlink uses a JavaScript Proxy to convert the message-passing protocol into ordinary async function calls.' },
    { title: 'Blocking main thread vs offloading to worker', before: '// Runs on main thread — freezes the UI\ncompute() {\n  let sum = 0;\n  for (let i = 0; i < 5e8; i++) sum += i;\n  this.result.set(sum);\n}', after: '// Offloaded — UI stays responsive\ncompute() {\n  const worker = new Worker(new URL(\'./compute.worker\', import.meta.url));\n  worker.onmessage = (e) => { this.result.set(e.data); worker.terminate(); };\n  worker.postMessage(null);\n}',
      note: 'Any CPU-bound loop > ~16 ms should be moved off-thread to keep the 60 fps render budget intact.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Forgetting to call worker.terminate()', wrong: 'worker.onmessage = (e) => {\n  this.result.set(e.data);\n  // worker keeps running forever!\n};', right: 'worker.onmessage = (e) => {\n  this.result.set(e.data);\n  worker.terminate(); // free resources\n};', explanation: 'A worker that is not terminated continues to consume CPU and memory even after the Angular component is destroyed. Always terminate as soon as the final result is received.'  },
    { title: 'Using a plain string path instead of the URL constructor', wrong: '// Build system cannot detect or chunk this\nconst worker = new Worker(\'./heavy-compute.worker.js\');', right: '// Angular CLI bundles this as a separate chunk\nconst worker = new Worker(\n  new URL(\'./heavy-compute.worker\', import.meta.url)\n);', explanation: 'A bare string path bypasses Angular\'s build pipeline. The URL + import.meta.url pattern lets the bundler find, process, and hash the worker file correctly.'  },
    { title: 'Trying to access the DOM inside a worker', wrong: '// Inside worker.ts — throws ReferenceError\nself.onmessage = () => {\n  document.getElementById(\'output\').textContent = \'done\';\n};', right: '// Post result back; let the main thread update the DOM\nself.onmessage = (e) => {\n  const result = heavyCalc(e.data);\n  self.postMessage(result);\n};', explanation: 'Workers have no access to document, window, or any DOM API. All UI updates must happen on the main thread after receiving the worker result via onmessage.'  },
    { title: 'Cloning huge payloads when Transferables would be zero-copy', wrong: '// Deep-clones the entire 50 MB buffer — slow\nworker.postMessage(myLargeArray.buffer);', right: '// Transfers ownership — zero-copy\nworker.postMessage(\n  myLargeArray.buffer,\n  [myLargeArray.buffer]\n);', explanation: 'Passing an ArrayBuffer (or ImageBitmap) in the transfer list moves ownership instead of copying. Forgetting the second argument causes a full structured-clone, which can be orders of magnitude slower for large data.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '8', label: 'Angular CLI Web Worker scaffolding', features: ['ng generate web-worker <name> creates a typed worker file', 'Auto-generates tsconfig.worker.json with webworker lib', 'Build system bundles the worker as a separate hashed chunk', 'import.meta.url pattern officially supported for worker URLs'] },
    { version: '16', label: 'Signals complement off-thread patterns', features: ['signal() / computed() / effect() replace manual ChangeDetectorRef.markForCheck() after worker callbacks', 'Worker result can be written directly to a signal — Angular schedules the render automatically', 'Reduces boilerplate when updating the UI from worker.onmessage handlers'] },
  ];
}
