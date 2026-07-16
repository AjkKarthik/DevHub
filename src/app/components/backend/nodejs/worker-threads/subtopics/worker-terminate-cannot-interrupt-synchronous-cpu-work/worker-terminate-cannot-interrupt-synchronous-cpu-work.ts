import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './worker-terminate-cannot-interrupt-synchronous-cpu-work.html',
  styleUrl: './worker-terminate-cannot-interrupt-synchronous-cpu-work.scss'
})
export class WorkerTerminateCannotInterruptSynchronousCpuWorkSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'worker.terminate() stops the worker "as soon as possible" — not instantly, and not mid-statement',
      points: [
        'Node\'s own worker_threads documentation describes terminate() as stopping "all JavaScript execution in the worker thread as soon as possible" and returning a Promise that resolves once the thread has actually stopped. The phrase "as soon as possible" is deliberate, not filler — it signals that termination is not guaranteed to be instantaneous or to interrupt code already running at the exact moment terminate() is called.',
        'A worker that is currently blocked inside a long, purely synchronous, CPU-bound loop — a tight for loop doing heavy math, a large JSON.parse() on a huge string, a synchronous regex backtracking badly — cannot be interrupted mid-execution by a terminate() call from the parent. The terminate() request is delivered to the worker\'s own event loop, but that event loop has no opportunity to process it (or anything else — timers, message events, everything) until the currently running synchronous code finishes and control returns to the loop.',
        'This is not a documented worker_threads-specific caveat stated in those exact terms — it follows directly from JavaScript\'s general single-threaded, run-to-completion execution model, which applies inside a worker thread exactly as it does on the main thread. A worker thread has its own dedicated JavaScript execution thread and its own event loop, but that event loop is still single-threaded internally — one synchronous call stack runs to completion before the loop can service anything else, including a pending termination signal.',
      ]
    },
    {
      heading: 'What this means in practice for a worker pool',
      points: [
        'A "cancel this task" feature built on worker.terminate() works reliably for a worker that is idle, waiting on I/O, or between discrete units of async work — the termination signal is processed the next time the event loop gets a turn. It does NOT reliably cancel a worker actively churning through one long synchronous computation; the terminate() Promise will not resolve until that computation naturally finishes on its own.',
        'The main page\'s own piscina worker-pool pattern recommends workers for CPU-bound tasks specifically because they run without blocking the main thread\'s event loop — but that same CPU-bound nature is exactly what makes them resistant to being stopped early once started. A task genuinely needing to be interruptible mid-computation has to build cooperative cancellation into the computation itself (e.g., checking a shared flag or SharedArrayBuffer value between chunks of work and returning early), not rely on terminate() alone.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'terminate() on an idle/async worker resolves promptly',
      language: 'typescript',
      code: `import { Worker, isMainThread, parentPort } from 'node:worker_threads';

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url));

  worker.on('online', async () => {
    // Worker is idle, just waiting on its event loop — terminate()
    // resolves quickly because there's nothing blocking it.
    console.time('terminate');
    await worker.terminate();
    console.timeEnd('terminate'); // a few ms
  });
} else {
  // Worker sits idle, waiting for messages that never arrive.
  parentPort.on('message', () => {});
}`,
    },
    {
      label: 'terminate() cannot interrupt a synchronous CPU-bound loop',
      language: 'typescript',
      code: `import { Worker, isMainThread } from 'node:worker_threads';

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url));

  setTimeout(async () => {
    console.time('terminate');
    await worker.terminate();
    // Does NOT resolve in a few ms — it waits for the worker's
    // current synchronous loop below to finish running first.
    console.timeEnd('terminate');
  }, 100);
} else {
  // A purely synchronous, CPU-bound loop with no await/yield points.
  // Once this starts, the worker's event loop cannot process the
  // pending terminate() request until this loop returns control.
  let total = 0;
  for (let i = 0; i < 50_000_000_000; i++) {
    total += Math.sqrt(i);
  }
  console.log(total);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A worker pool exposes a "cancel task" button in a UI, implemented by calling worker.terminate() on the worker running that task. For most tasks it works instantly. For one specific task — a synchronous data-transformation function that loops over a huge in-memory array with no async breaks — clicking cancel appears to do nothing for several seconds, even though the exact same terminate() call is used. Using what this subtopic covers, explain why this one task behaves differently, and describe one way to make it genuinely cancellable.',
    hint: 'Does terminate() interrupt code that is already running synchronously, or does it only get processed the next time the worker\'s event loop is free to check for it? What is different about a tight synchronous loop over a huge array compared to most other tasks in the pool?',
    solution: 'terminate() does not interrupt code already executing synchronously — Node\'s own documentation frames it as stopping execution "as soon as possible," which in practice means the pending termination request can only be processed once the worker\'s single-threaded event loop is free to check for it, and a purely synchronous loop with no await/yield points never gives the event loop that opportunity until the loop itself finishes. Most other tasks in the pool likely involve some asynchronous work (I/O, timers, or chunked processing) that periodically returns control to the event loop, giving terminate() a chance to take effect quickly — which is why cancel appears instant for those. This one task is different because it is one long, unbroken synchronous computation over a huge array with no such yield points, so terminate() has no opportunity to interrupt it until the loop naturally completes on its own, several seconds later. To make it genuinely cancellable, the loop itself needs to be restructured to cooperate with cancellation — for example, breaking the huge array into chunks and processing one chunk per event-loop tick (via setImmediate or similar), checking a shared cancellation flag (e.g., a value in a SharedArrayBuffer set by the parent) between chunks, and returning early when it is set — rather than relying on terminate() alone to stop mid-computation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling worker.terminate() immediately and forcibly stops whatever code is currently executing inside that worker, the moment terminate() is called — similar to killing an OS process.',
      reality: 'This subtopic\'s theory and second code example both show this is not the case — Node\'s own documentation describes stopping execution "as soon as possible," and a worker running a purely synchronous, CPU-bound loop cannot be interrupted mid-execution; the terminate() Promise only resolves once that loop naturally finishes.'
    },
    {
      thought: 'Since a worker thread has its own dedicated thread separate from the main thread, terminate() acts on that separate thread the same way an OS-level process kill would — interrupting it at any point, regardless of what it is doing.',
      reality: 'This subtopic\'s theory explains the actual mechanism — a worker thread still runs a single-threaded, run-to-completion JavaScript event loop internally, so a pending terminate() request has to wait for the currently running synchronous call stack to finish before it can take effect, exactly like any other pending event-loop work.'
    },
    {
      thought: 'A worker pool\'s "cancel task" feature built on terminate() is reliable for every kind of task the pool might run, since it is the same terminate() call regardless of what the worker is doing.',
      reality: 'This subtopic\'s exercise shows the opposite — terminate() reliably cancels tasks with async yield points quickly, but a long, unbroken synchronous CPU-bound task resists cancellation until it finishes on its own, meaning genuinely interruptible cancellation has to be built cooperatively into the computation itself.'
    }
  ];
}
