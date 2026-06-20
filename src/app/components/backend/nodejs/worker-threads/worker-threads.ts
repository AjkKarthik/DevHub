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
  selector: 'app-node-worker-threads',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './worker-threads.html',
  styleUrl: './worker-threads.scss'
})
export class NodeWorkerThreads {
  quickRef: QuickRefItem[] = [
    { name: 'new Worker(filename, { workerData })', type: 'class', desc: 'Spawn a worker thread running filename. Pass initial data via workerData.' },
    { name: 'parentPort.postMessage()', type: 'method', desc: 'Send a message from worker to parent. Parent receives via worker.on("message").' },
    { name: 'parentPort.on("message")', type: 'method', desc: 'Receive messages sent from parent to worker via worker.postMessage().' },
    { name: 'workerData', type: 'keyword', desc: 'Read-only initial data passed to the worker when created. Deeply cloned.' },
    { name: 'SharedArrayBuffer', type: 'class', desc: 'Shared memory between threads. Mutations visible without message passing.' },
    { name: 'Atomics', type: 'class', desc: 'Atomic operations on SharedArrayBuffer: Atomics.add(), wait(), notify().' },
    { name: 'isMainThread', type: 'keyword', desc: 'true if running on the main thread. Use for single-file worker pattern.' },
    { name: 'receiveMessageOnPort()', type: 'function', desc: 'Synchronous message receive for Atomics.wait() patterns.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Worker Threads vs Cluster vs Child Process',
      points: [
        'Worker threads are for CPU-intensive tasks within one Node.js process. They share the same memory space (via SharedArrayBuffer) and communicate via message passing. Workers are lighter than processes — startup time is ~10ms vs ~50ms for a new process.',
        'Child processes (child_process module) spawn entirely separate OS processes. They have no shared memory. They communicate via stdin/stdout/IPC. Use for: running external programs, true process isolation, tasks in different languages or runtimes.',
        'Cluster module forks multiple Node.js worker processes for one HTTP server. Each cluster worker runs the full application. Best for multiplying HTTP throughput across CPU cores. Cluster workers can\'t easily share data — use Redis for shared state.',
        'Decision matrix: CPU work in same JS process → worker_threads. HTTP throughput → cluster. External process / isolation / other language → child_process. CPU work offloaded to queue → job queue (Bull/BullMQ) with separate worker process.',
      ]
    },
    {
      heading: 'Message Passing and Structured Clone',
      points: [
        'Messages between threads are transferred via the Structured Clone Algorithm — a deep copy of the value. Modifications in the worker do not affect the main thread\'s copy. This is safe but has overhead for large objects (copying a 10MB buffer costs ~10ms).',
        'Transferable objects avoid copying: ArrayBuffers can be transferred (ownership moved to the recipient, original becomes detached). Pass via the transfer array: worker.postMessage(buffer, [buffer.buffer]). The main thread can no longer access the buffer after transfer.',
        'MessageChannel provides a dedicated communication channel between any two endpoints (two workers, worker and main). Create a MessageChannel, pass one port to a worker, use the other in the main thread. Enables direct worker-to-worker communication.',
        'Worker thread error handling: listen to worker.on("error") and worker.on("exit") on the main thread. A thrown error in a worker terminates it — the main thread must handle this and potentially re-spawn. Always handle the "error" event or it becomes an unhandled rejection.',
      ]
    },
    {
      heading: 'Shared Memory and Thread Pools',
      points: [
        'SharedArrayBuffer allows true shared memory between threads. Both main thread and workers can read and write the same memory. Without synchronization (Atomics), concurrent writes cause race conditions. Use Atomics.add(), Atomics.compareExchange() for atomic operations.',
        'Atomics.wait() blocks a worker thread until notified (via Atomics.notify()). This implements lock/mutex patterns in shared memory. Note: Atomics.wait() cannot be called on the main thread (blocks the event loop). Use it in workers only.',
        'Worker thread pool pattern: create N workers on startup, queue tasks, assign to idle workers. Re-use workers across tasks instead of creating/destroying per task (eliminates ~10ms startup overhead). Libraries like workerpool or piscina implement this pattern.',
        'Appropriate tasks for worker threads: image/video processing, PDF generation, encryption of large data, heavy JSON parsing, ML inference in ONNX runtime, complex mathematical computations, regex on large strings. Avoid I/O in workers — I/O is non-blocking on the main thread.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Worker thread pattern',
      language: 'typescript',
      code: `// main.js
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

// Single-file worker pattern — same file runs in both contexts
if (isMainThread) {
  // Main thread: HTTP server
  app.post('/process', (req, res) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { data: req.body.data },
    });

    worker.once('message', result => res.json(result));
    worker.once('error',   err    => res.status(500).json({ error: err.message }));
    worker.once('exit',    code   => {
      if (code !== 0) console.error(\`Worker exited with code \${code}\`);
    });
  });

  app.listen(3000);
} else {
  // Worker thread: CPU-intensive task
  const { data } = workerData;
  const result = heavyCpuWork(data);  // runs without blocking main thread
  parentPort.postMessage(result);
}

function heavyCpuWork(data) {
  // e.g. image resize, hash computation, ML inference
  let sum = 0;
  for (let i = 0; i < 1_000_000; i++) sum += i; // simulate CPU work
  return { sum, processedBy: 'worker' };
}`
    },
    {
      label: 'Worker pool with piscina',
      language: 'typescript',
      code: `// worker-pool.js — using piscina for thread pooling
import Piscina from 'piscina';
import { fileURLToPath } from 'node:url';

// Pool of CPU workers — reuse threads across tasks
const pool = new Piscina({
  filename:    fileURLToPath(new URL('./worker.js', import.meta.url)),
  minThreads:  2,
  maxThreads:  8,
  idleTimeout: 30_000,  // reclaim idle threads after 30s
});

// Worker.js — a default export function
// export default function processImage({ buffer, width, height }) {
//   return sharp(buffer).resize(width, height).toBuffer();
// }

// Using the pool in an Express route
app.post('/resize', async (req, res) => {
  const { imageBuffer, width, height } = req.body;
  try {
    // Pool manages thread allocation automatically
    const resized = await pool.run({ buffer: imageBuffer, width, height });
    res.set('Content-Type', 'image/jpeg');
    res.send(resized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SharedArrayBuffer for high-frequency updates
const sharedBuffer = new SharedArrayBuffer(4);     // 1 int32
const counter      = new Int32Array(sharedBuffer);

// Worker: atomically increment shared counter
// Atomics.add(counter, 0, 1);  // thread-safe increment
// console.log(Atomics.load(counter, 0));  // read atomically`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a new Worker per request instead of using a pool',
      wrong: `app.get('/process', (req, res) => {
  const w = new Worker('./worker.js'); // new thread every request (~10ms startup)
  w.once('message', result => res.json(result));
});`,
      right: `const pool = new Piscina({ filename: './worker.js', maxThreads: 4 });
app.get('/process', async (req, res) => {
  const result = await pool.run(req.body); // reuse existing threads
  res.json(result);
});`,
      explanation: 'Creating a Worker per request adds ~10ms startup overhead per request and can exhaust OS thread limits under load. A worker pool maintains warm threads and queues tasks. Piscina handles pool management, backpressure, and load distribution.'
    },
    {
      title: 'Using worker_threads for I/O operations',
      wrong: `// worker.js
import { readFile } from 'node:fs/promises';
const data = await readFile('large-file.txt'); // I/O in worker — no benefit!
parentPort.postMessage(data);`,
      right: `// main thread
const data = await fs.promises.readFile('large-file.txt'); // async I/O on main thread
// Pass data to worker for CPU processing, not the I/O`,
      explanation: 'Node.js I/O is already non-blocking and asynchronous — it does not block the event loop. Offloading I/O to workers adds message-passing overhead without benefit. Workers are for CPU work. Do I/O on the main thread and pass the result to workers for computation.'
    },
    {
      title: 'Not handling worker errors',
      wrong: `const worker = new Worker('./worker.js');
worker.once('message', result => console.log(result));
// Worker crashes — no handler — unhandled rejection in main thread`,
      right: `const worker = new Worker('./worker.js');
worker.once('message', result => console.log(result));
worker.once('error',   err    => console.error('Worker error:', err));
worker.once('exit',    code   => { if (code !== 0) console.error('Worker exit:', code); });`,
      explanation: 'An unhandled error event in Node.js becomes an uncaught exception that crashes the process. Workers can crash — always attach error and exit handlers. In a pool, the pool manager handles restarts automatically.'
    },
    {
      title: 'Transferring large data instead of using SharedArrayBuffer',
      wrong: `// Copies 100MB buffer per task — 100ms overhead each way
worker.postMessage({ buffer: largeImageBuffer });`,
      right: `// Transfer ownership — zero copy
const buffer = largeImageBuffer.buffer; // get underlying ArrayBuffer
worker.postMessage({ buffer }, [buffer]); // transfer, not copy
// largeImageBuffer is now detached in main thread — cannot use it`,
      explanation: 'postMessage with an ArrayBuffer in the transfer list moves ownership to the receiver without copying. For large buffers (images, audio, large datasets), this eliminates potentially hundreds of milliseconds of copy overhead.'
    },
  ];

  challenge: Challenge = {
    title: 'Worker Thread Hash Computer',
    language: 'typescript',
    description: 'Build a system where the main thread accepts POST /hash requests with { data: string }, offloads SHA-256 hashing to a worker thread (to avoid blocking the event loop), and returns { hash, duration }. Use a single-file pattern (isMainThread check). The worker should perform the hash computation and post back the result. Measure duration in the main thread.',
    hints: [
      'import { createHash } from "node:crypto" for SHA-256',
      'new Worker(new URL(import.meta.url), { workerData: { data } }) for same-file worker',
      'performance.now() for duration measurement in main thread',
    ],
    starterCode: `import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';
import express from 'express';

if (isMainThread) {
  const app = express();
  app.use(express.json());

  app.post('/hash', (req, res) => {
    // TODO: spawn worker, measure duration, return { hash, duration }
  });

  app.listen(3000);
} else {
  // TODO: compute hash of workerData.data and postMessage result
}`,
    solution: `import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import express from 'express';

if (isMainThread) {
  const app = express();
  app.use(express.json());

  app.post('/hash', (req, res) => {
    const start = performance.now();
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { data: req.body.data },
    });

    worker.once('message', ({ hash }) => {
      res.json({ hash, duration: \`\${(performance.now() - start).toFixed(2)}ms\` });
    });
    worker.once('error', err => res.status(500).json({ error: err.message }));
  });

  app.listen(3000, () => console.log('Listening on 3000'));
} else {
  const { data } = workerData;
  const hash = createHash('sha256').update(data).digest('hex');
  parentPort.postMessage({ hash });
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'When should you use worker_threads vs child_process?', options: ['They are interchangeable', 'worker_threads for CPU-intensive JS tasks in the same app; child_process for external programs or true process isolation', 'child_process is always faster', 'worker_threads only work in TypeScript'], answer: 1, explanation: 'Worker threads share the same Node.js instance, can use SharedArrayBuffer for shared memory, and are lighter (~10ms startup). Child processes are fully separate OS processes, have their own memory, and are ideal for running external programs or sandboxing untrusted code.' },
    { q: 'What does transferring an ArrayBuffer to a worker via postMessage do?', options: ['Copies the buffer data to the worker', 'Moves ownership to the worker — the original buffer becomes detached and unusable in the main thread', 'Creates a SharedArrayBuffer', 'Serializes the buffer to JSON'], answer: 1, explanation: 'Transferring an ArrayBuffer (passing it in the transfer list) moves ownership without copying. The receiving thread gets the buffer; the sending thread\'s ArrayBuffer becomes detached (byteLength = 0). This is zero-copy — critical for large data like images or audio.' },
    { q: 'Why should you use a worker pool instead of creating a worker per request?', options: ['Pools are easier to code', 'New Worker() has ~10ms startup overhead per request; pools reuse threads across tasks', 'Pools provide thread safety', 'Single workers cannot handle async code'], answer: 1, explanation: 'Creating a Worker has a ~10ms thread startup cost. At 1000 req/s, that\'s 10 seconds wasted on thread creation alone. A pool maintains warm threads and queues tasks to idle ones — near-zero allocation overhead per task.' },
    { q: 'Can you call Atomics.wait() on the main thread?', options: ['Yes, it is the preferred way to wait', 'No — it blocks the thread and would freeze the Node.js event loop', 'Only in strict mode', 'Only if SharedArrayBuffer is created on the main thread'], answer: 1, explanation: 'Atomics.wait() blocks the calling thread until notified. On the main thread, this would freeze the event loop — no requests processed, no I/O callbacks, no timers. Atomics.wait() throws a TypeError when called on the main thread. Use it only in workers.' },
  ];

  qna: QnaItem[] = [
    { q: 'What types of tasks are good candidates for worker threads?', a: 'CPU-intensive JavaScript: image/video processing (resizing, transcoding), PDF generation, encryption/decryption of large data, ML inference (ONNX Runtime Node.js), heavy JSON parsing or schema validation, complex regex on large strings, hash computation, file compression. NOT suitable: database queries, HTTP calls, file reads — these are I/O-bound and already non-blocking via Node.js async I/O. Worker threads benefit only tasks that genuinely occupy CPU cycles.' },
    { q: 'How do you share state between worker threads?', a: 'Three options: (1) Message passing: deep-copy data between threads via postMessage/on("message"). Safe, no race conditions, but copies data. (2) SharedArrayBuffer + Atomics: true shared memory, no copying. Requires careful atomic operations to avoid race conditions. Low-level, error-prone. (3) Transferable objects: ArrayBuffer ownership moved to recipient. Zero copy, but original is unusable. For most use cases, message passing is safest. Only use SharedArrayBuffer when performance requirements demand it.' },
    { q: 'How does piscina improve on manual worker pool implementations?', a: 'Piscina handles: worker lifecycle (spawn, maintain pool size, restart crashed workers), task queue with configurable max queue size and backpressure, load balancing (assign tasks to least-loaded workers), idle timeout (reclaim threads after inactivity to save RAM), AbortController support for task cancellation, and TypeScript types. Writing a correct worker pool from scratch covers the same ground but is easy to get wrong. Use piscina unless you have unusual requirements.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Worker threads offload CPU work off the main thread. Use a pool (piscina) to avoid startup overhead. Transfer large ArrayBuffers instead of copying. SharedArrayBuffer + Atomics for shared state.',
    mustKnow: [
      'worker_threads: CPU work in same process. child_process: external programs/isolation.',
      'New Worker per request = 10ms overhead — use a pool (piscina).',
      'Messages are deep-copied (structured clone). Transfers move ownership (zero copy).',
      'SharedArrayBuffer + Atomics for shared memory between threads.',
      'Atomics.wait() blocks — only call in workers, NEVER main thread.',
      'Workers are for CPU work — I/O is already non-blocking on the main thread.',
      'Always handle worker "error" and "exit" events.',
    ],
    interviewFocus: [
      'When would you use worker_threads vs child_process vs cluster?',
      'How do you share data between worker threads without copying?',
      'What is a worker thread pool and why is it better than creating workers per request?',
    ]
  };
}
