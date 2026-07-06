import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-building-a-worker-pool-for-parallel-task-dispatch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './building-a-worker-pool-for-parallel-task-dispatch.html',
  styleUrl: './building-a-worker-pool-for-parallel-task-dispatch.scss',
})
export class BuildingAWorkerPoolForParallelTaskDispatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One worker vs many — a different problem than the main topic solves',
      points: [
        'The main Web Workers page\'s "reuse a worker" mistake fix covers ONE long-lived worker handling repeated calls sequentially. That doesn\'t help when you have MANY independent tasks (e.g. thumbnail-generate 200 images) that could genuinely run in parallel — sequentially posting to one worker processes them one at a time, wasting the other CPU cores the browser has available.',
        'A worker pool spawns <code>N</code> workers up front (typically <code>navigator.hardwareConcurrency</code>, the number of logical CPU cores) and DISTRIBUTES incoming tasks across them, so up to <code>N</code> tasks genuinely execute simultaneously — this is the standard pattern used by tools like Vite\'s and Webpack\'s own parallel file processing.',
      ],
    },
    {
      heading: 'Task queue + round-robin (or idle-first) dispatch',
      points: [
        'The simplest dispatch strategy: keep an array of <code>&#123; worker, busy &#125;</code> entries and a FIFO queue of pending tasks. When a task arrives, find the first IDLE worker and hand it the task immediately; if all workers are busy, push the task onto the queue. When any worker\'s <code>onmessage</code> fires, mark it idle and immediately pull the next queued task if one exists.',
        'Each dispatched task needs a way to route its result back to the correct CALLER — since all workers share the same pool, a naive single "the last result" approach breaks under concurrency. Assign each task a unique ID, send it as part of the message payload, and store a <code>Map&lt;id, resolve/reject&gt;</code> so the pool can resolve the right caller\'s Promise when that ID\'s response comes back.',
        'Wrapping dispatch in a Promise-returning method — <code>pool.run(taskData): Promise&lt;Result&gt;</code> — lets calling code use ordinary <code>await</code>/<code>Promise.all()</code> instead of manual postMessage/onmessage bookkeeping, similar in spirit to what Comlink does for a single worker.',
      ],
    },
    {
      heading: 'Sizing the pool and handling backpressure',
      points: [
        '<code>navigator.hardwareConcurrency</code> reports the number of logical cores (already accounts for hyperthreading) — spawning MORE workers than this does not add real parallelism, only OS thread-scheduling overhead. A common conservative choice is <code>Math.max(1, navigator.hardwareConcurrency - 1)</code>, leaving one core free for the main thread\'s own rendering work.',
        'If tasks arrive faster than the pool can process them, the pending queue grows unbounded unless you cap it — for a bulk operation (e.g. "process all 500 files"), this is usually fine since the caller already awaited enqueuing all of them; for a live/streaming source, consider dropping or coalescing tasks instead of letting the queue grow forever.',
        'Terminate ALL pool workers together, once, when the pool itself is no longer needed (e.g. in the owning service\'s cleanup) — NOT after each individual task, since the whole point of the pool is to keep the same <code>N</code> workers alive across many tasks.',
      ],
    },
    {
      heading: 'When a pool is overkill',
      points: [
        'For a SINGLE long computation (the main topic\'s Fibonacci example), a pool adds indirection with no benefit — one worker running one task already uses one core; more workers would sit idle. Reach for a pool specifically when you have a BATCH of independent tasks that can run concurrently.',
        'If tasks are extremely short (a few milliseconds each), the postMessage overhead itself (structured-clone serialization, thread-scheduling latency) can dominate — batch several small units of work into ONE message per worker rather than one message per unit, to amortize that fixed cost.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/worker-pool.ts',
      content: `export class WorkerPool<TIn, TOut> {
  private workers: { worker: Worker; busy: boolean }[];
  private queue: { data: TIn; resolve: (v: TOut) => void; reject: (e: unknown) => void }[] = [];
  private nextId = 0;
  private pending = new Map<number, { resolve: (v: TOut) => void; reject: (e: unknown) => void }>();

  constructor(workerUrl: URL, size = Math.max(1, navigator.hardwareConcurrency - 1)) {
    this.workers = Array.from({ length: size }, () => {
      const worker = new Worker(workerUrl);
      const entry = { worker, busy: false };
      worker.onmessage = (e: MessageEvent<{ id: number; result: TOut }>) => {
        const { id, result } = e.data;
        this.pending.get(id)?.resolve(result);
        this.pending.delete(id);
        this.markIdleAndDrain(entry);
      };
      return entry;
    });
  }

  run(data: TIn): Promise<TOut> {
    return new Promise((resolve, reject) => {
      const idle = this.workers.find(w => !w.busy);
      if (idle) {
        this.dispatch(idle, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private dispatch(
    entry: { worker: Worker; busy: boolean },
    data: TIn,
    resolve: (v: TOut) => void,
    reject: (e: unknown) => void,
  ) {
    entry.busy = true;
    const id = this.nextId++;
    this.pending.set(id, { resolve, reject });
    entry.worker.postMessage({ id, data });
  }

  private markIdleAndDrain(entry: { worker: Worker; busy: boolean }) {
    entry.busy = false;
    const next = this.queue.shift();
    if (next) this.dispatch(entry, next.data, next.resolve, next.reject);
  }

  terminate() {
    this.workers.forEach(w => w.worker.terminate());
  }
}
`,
    },
    {
      path: 'src/app/square.worker.ts',
      content: `/// <reference lib="webworker" />

// Each worker echoes back its task ID alongside the result, so the pool
// can route the response to the right caller even under concurrency.
self.onmessage = (e: MessageEvent<{ id: number; data: number }>) => {
  const { id, data } = e.data;
  const result = data * data; // stand-in for real per-task work
  self.postMessage({ id, result });
};
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { WorkerPool } from './worker-pool';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Worker pool: {{ poolSize }} workers running 20 tasks concurrently</h3>
    <button (click)="runBatch()" [disabled]="running()">Square numbers 1–20</button>
    @if (running()) { <p>Dispatching across {{ poolSize }} workers…</p> }
    @if (results().length) {
      <p>Results: {{ results().join(', ') }}</p>
    }
  \`,
})
export class App {
  poolSize = Math.max(1, navigator.hardwareConcurrency - 1);
  private pool = new WorkerPool<number, number>(
    new URL('./square.worker', import.meta.url),
    this.poolSize,
  );

  running = signal(false);
  results = signal<number[]>([]);

  async runBatch() {
    this.running.set(true);
    this.results.set([]);

    const inputs = Array.from({ length: 20 }, (_, i) => i + 1);
    // All 20 tasks are enqueued immediately — the pool distributes them
    // across its N workers, running up to N in parallel at any moment.
    const results = await Promise.all(inputs.map(n => this.pool.run(n)));

    this.results.set(results);
    this.running.set(false);
  }

  ngOnDestroy() {
    this.pool.terminate();
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Building a Worker Pool for Parallel Task Dispatch</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a <code>maxQueueLength</code> option to <code>WorkerPool</code> — when the pending queue would exceed it, <code>run()</code> should reject immediately instead of enqueuing, so a caller can apply backpressure (e.g. show "too busy, try again") rather than letting the queue grow unbounded.',
    hint: 'Add a maxQueueLength?: number constructor parameter (default undefined = unbounded). In run(), before pushing to this.queue, check if maxQueueLength is set and this.queue.length >= maxQueueLength — if so, reject with an error instead of enqueuing.',
    solution: `constructor(
  workerUrl: URL,
  size = Math.max(1, navigator.hardwareConcurrency - 1),
  private maxQueueLength?: number,
) {
  // ...unchanged worker setup
}

run(data: TIn): Promise<TOut> {
  return new Promise((resolve, reject) => {
    const idle = this.workers.find(w => !w.busy);
    if (idle) {
      this.dispatch(idle, data, resolve, reject);
      return;
    }
    if (this.maxQueueLength !== undefined && this.queue.length >= this.maxQueueLength) {
      reject(new Error('WorkerPool queue is full — try again later'));
      return;
    }
    this.queue.push({ data, resolve, reject });
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'spawning as many workers as possible always makes a batch of tasks finish faster.',
      reality: '<code>navigator.hardwareConcurrency</code> caps the number of CPU cores actually available — more workers than that only adds OS thread-scheduling overhead without more real parallelism. Size the pool to roughly the core count, leaving one free for the main thread.',
    },
    {
      thought: 'a worker pool needs a separate worker "type" per task category, similar to microservices.',
      reality: 'a pool typically runs IDENTICAL worker scripts (all capable of handling any incoming task) — the pool\'s job is purely load-balancing tasks across otherwise-interchangeable workers, not routing to specialized workers.',
    },
    {
      thought: 'since all pool workers run the same script, a response from any worker can be matched to whichever call is "next" in order.',
      reality: 'tasks complete out of order under real concurrency — a fast task dispatched second can finish before a slow task dispatched first. Each task needs its own ID echoed back in the response so the pool resolves the correct caller\'s Promise.',
    },
  ];
}
