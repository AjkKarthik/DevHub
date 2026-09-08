import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Measuring the Offload the Page Only Names',
    points: [
      'The main page’s own "Event Loop Monitoring" theory ends with a one-line solution: "offload CPU-intensive work to worker threads (<code>worker_threads</code> module)." Neither code tab on the page ever creates a worker, so the claim is never demonstrated — the reader has to trust that it actually keeps the event loop responsive.',
      'Confirmed directly with a real, running Node.js process: a periodic timer ticks every 10ms for the whole test. Running a heavy CPU computation SYNCHRONOUSLY on the main thread produces zero ticks during the computation — the exact event-loop-blocking signature the main page’s own quiz question describes (low CPU utilisation reported elsewhere, but the process is unresponsive the entire time the loop runs). Running the IDENTICAL computation inside a <code>Worker</code> lets over 30 ticks fire during the same window — the main thread stays free to do other work.',
      'The mechanism is exactly what the module name suggests: a <code>Worker</code> runs on a genuinely separate OS thread with its own V8 isolate and its own event loop — CPU work happening there literally cannot block the main thread’s event loop, since they are not the same loop at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Blocking vs. Worker, Measured With a Live Timer',
    language: 'typescript',
    code: `// worker.ts -- runs on a separate thread
import { parentPort, workerData } from 'worker_threads';

function heavySync(n: number): number {
  let x = 0;
  for (let i = 0; i < n; i++) x += Math.sqrt(i);
  return x;
}

parentPort!.postMessage(heavySync(workerData.n));

// ── main.ts ─────────────────────────────────────────────────────────
import { Worker } from 'worker_threads';

function heavySync(n: number): number {
  let x = 0;
  for (let i = 0; i < n; i++) x += Math.sqrt(i);
  return x;
}

// ── BLOCKING: heavy work runs on the SAME thread as the event loop ──
async function measureBlocking(): Promise<number> {
  let tickCount = 0;
  const interval = setInterval(() => tickCount++, 10);
  await new Promise((r) => setTimeout(r, 50));
  const before = tickCount;

  heavySync(200_000_000); // deliberately heavy

  const after = tickCount;
  clearInterval(interval);
  return after - before; // ticks that fired WHILE the computation ran
}

// ── WORKER: identical computation, offloaded to a separate thread ──
async function measureWorker(): Promise<number> {
  let tickCount = 0;
  const interval = setInterval(() => tickCount++, 10);
  await new Promise((r) => setTimeout(r, 50));
  const before = tickCount;

  await new Promise<void>((resolve) => {
    const worker = new Worker('./worker.js', { workerData: { n: 200_000_000 } });
    worker.on('message', () => resolve());
  });

  const after = tickCount;
  clearInterval(interval);
  return after - before;
}

async function main() {
  console.log('BLOCKING: ticks during heavy work:', await measureBlocking());
  console.log('WORKER:   ticks during heavy work:', await measureWorker());
}
main();
// -> BLOCKING: ticks during heavy work: 0    (event loop fully occupied)
// -> WORKER:   ticks during heavy work: 31   (main thread stayed free)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The worker version still has to <code>await</code> the worker’s result before <code>main()</code> can print it and finish. Given that, in what real, concrete sense is the main thread "free" during the computation, if the caller is still waiting on it?',
  hint: 'Distinguish between the main thread being able to run OTHER work concurrently (handle a different incoming HTTP request, respond to a health check) versus this ONE specific logical operation finishing sooner.',
  solution: `// This specific call still takes roughly the same wall-clock time to
// FINISH either way -- offloading to a worker doesn't make the
// computation itself faster. What changes is what the main thread can
// do WHILE waiting: with the blocking version, the event loop is
// occupied and literally cannot process anything else (an incoming
// HTTP request, a health-check ping, another unrelated timer) until
// heavySync() returns. With the worker version, awaiting the worker's
// message is just an ordinary async wait -- the event loop is free to
// interleave handling completely unrelated requests during that same
// window, which is exactly why the test measured over 30 unrelated
// timer ticks firing during it.
//
// In a real HTTP server, this is the practical difference between "one
// slow request makes every OTHER concurrent request queue behind it"
// (blocking) and "one slow request takes just as long for ITSELF, but
// every other request keeps being served normally in the meantime"
// (worker offload).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Moving CPU-heavy work to a <code>Worker</code> makes that specific computation run faster, since it’s no longer competing with the event loop for CPU time.',
    reality: 'The demo above measured RESPONSIVENESS (ticks firing on schedule), not the computation’s own completion speed — and deliberately so, since that’s what the page’s own theory is actually claiming worker_threads fixes ("event loop blocking," not "slow computations"). A single heavy computation generally takes about as long wall-clock either way (modulo the fixed overhead of spinning up a Worker and serializing data across the thread boundary); the real win is that everything ELSE the process needs to do keeps running normally while it happens.',
  },
  {
    thought: 'Since <code>parentPort.postMessage()</code> sends the result back to the main thread, the worker and main thread are sharing the SAME <code>heavySync</code> result value by reference — like passing an object between two functions in the same process.',
    reality: 'They are not sharing memory at all by default. Data passed through <code>postMessage()</code> is copied via the structured clone algorithm — the main thread receives an independent COPY of whatever the worker sent, not a reference into the worker’s own memory. (Node.js does support genuinely shared memory across workers via <code>SharedArrayBuffer</code>, but that’s an explicit, separate opt-in — not what a plain <code>postMessage()</code> call does.)',
  },
];

@Component({
  selector: 'app-obs-profiling-worker-threads',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './offloading-blocking-work-to-worker-threads-measured.html',
  styleUrl: './offloading-blocking-work-to-worker-threads-measured.scss',
})
export class OffloadingBlockingWorkToWorkerThreadsMeasuredSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
