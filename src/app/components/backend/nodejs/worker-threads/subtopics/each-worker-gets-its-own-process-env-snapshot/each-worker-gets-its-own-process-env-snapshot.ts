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
  templateUrl: './each-worker-gets-its-own-process-env-snapshot.html',
  styleUrl: './each-worker-gets-its-own-process-env-snapshot.scss'
})
export class EachWorkerGetsItsOwnProcessEnvSnapshotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory says workers "share the same memory space (via SharedArrayBuffer)" and communicate mainly via message passing — worth knowing this general picture has one specific, easy-to-assume-wrong exception: process.env itself',
      points: [
        'Node\'s own worker_threads documentation states this directly: "process.env is a copy of the parent thread\'s environment variables, unless otherwise specified. Changes to one copy are not visible in other threads." This is a real, deliberate exception to the general expectation that a worker "runs inside the same process" — process.env specifically behaves as an independent snapshot per thread, not a shared or live-synced object.',
        'Concretely: if the main thread sets process.env.FEATURE_FLAG = "true" AFTER a worker has already been created, that worker never sees the change — its own process.env was copied at the moment new Worker(...) ran, and nothing keeps it in sync afterward. The same isolation applies in the other direction: a worker setting process.env.SOME_VAR internally has zero effect on the main thread\'s process.env, or on any sibling worker\'s.',
        'Node\'s documentation also describes an explicit escape hatch for the rare case genuine two-way sharing is needed: passing env: worker.SHARE_ENV as a Worker constructor option makes the parent and worker thread genuinely SHARE the same process.env object, so changes in either become visible to the other — this is opt-in, not the default, and the documentation frames it as a special value specifically for this purpose.',
      ]
    },
    {
      heading: 'Why this specific exception is easy to get wrong in practice',
      points: [
        'A common, reasonable-sounding assumption: "workers run in my process, so anything I can read from process at the top level of my app should be visible everywhere, including inside workers I spawn later." This holds for plenty of process-level state, but process.env specifically does not work this way by default — a worker reads whatever process.env looked like at the exact moment it was created, permanently, unless SHARE_ENV was explicitly requested.',
        'This matters most for long-lived worker pools (the main page\'s own piscina pattern): if an environment variable genuinely needs to change at runtime and be picked up by workers, a pool of pre-warmed, long-lived workers (created once at startup, per the main page\'s own recommendation to avoid per-task spawn overhead) will keep using whatever process.env snapshot they were created with — potentially far out of date — unless the application explicitly passes updated values via workerData or postMessage on each task, rather than relying on the workers reading a live process.env.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default: an independent snapshot, not a live reference',
      language: 'typescript',
      code: `import { Worker, isMainThread, parentPort } from 'node:worker_threads';

if (isMainThread) {
  process.env.FEATURE_FLAG = 'off';

  const worker = new Worker(new URL(import.meta.url));
  // Worker's process.env is a COPY taken right now — FEATURE_FLAG: 'off'

  setTimeout(() => {
    // Changed AFTER the worker was already created:
    process.env.FEATURE_FLAG = 'on';
    worker.postMessage('check');
  }, 1000);
} else {
  parentPort.on('message', () => {
    // Still reads 'off' — this worker's process.env was snapshotted
    // at creation time and never updated, despite the main thread's
    // process.env.FEATURE_FLAG having genuinely changed to 'on' since.
    console.log(process.env.FEATURE_FLAG); // 'off'
  });
}`,
    },
    {
      label: 'Opting into genuine two-way sharing with SHARE_ENV',
      language: 'typescript',
      code: `import { Worker, SHARE_ENV, isMainThread, parentPort } from 'node:worker_threads';

if (isMainThread) {
  process.env.FEATURE_FLAG = 'off';

  // Explicit opt-in — worker.SHARE_ENV means the worker's
  // process.env is the SAME object as the main thread's, not a copy.
  const worker = new Worker(new URL(import.meta.url), { env: SHARE_ENV });

  setTimeout(() => {
    process.env.FEATURE_FLAG = 'on';
    worker.postMessage('check');
  }, 1000);
} else {
  parentPort.on('message', () => {
    // Now reads 'on' — SHARE_ENV means both threads see the SAME
    // underlying environment object, so this change IS visible.
    console.log(process.env.FEATURE_FLAG); // 'on'
  });
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An application maintains a piscina worker pool (matching the main page\'s own recommended pattern) of 8 pre-warmed, long-lived workers, created once at application startup. Hours later, an operator uses a runtime configuration tool to update process.env.RATE_LIMIT on the running main process, expecting all subsequent worker tasks to respect the new value. The workers never pick up the change. Using the documented behavior of process.env in worker threads, explain why, and what the application would need to do differently to make this actually work.',
    hint: 'Were these 8 workers created once, at startup, and then reused for many tasks afterward (matching the main page\'s own worker-pool pattern)? Does a worker\'s process.env update automatically after the worker has already been created, or is it fixed at the moment new Worker() ran?',
    solution: 'The workers never pick up the change because each one\'s process.env was snapshotted independently at the moment it was created — which, for a pre-warmed pool created once at application startup, means every one of those 8 workers has been holding onto a process.env copy from startup time, hours before the operator\'s runtime update. Per Node\'s own documentation, "changes to one copy are not visible in other threads" by default — the main process\'s process.env.RATE_LIMIT genuinely did change, but that change simply never reaches any of the 8 already-running workers, since nothing automatically re-syncs a worker\'s environment snapshot after creation. Two possible fixes: (1) explicitly pass env: worker.SHARE_ENV when creating the pool\'s workers, so all threads genuinely share one live process.env object and the runtime update becomes visible immediately — though this affects ALL environment variables, not just RATE_LIMIT, which may be broader sharing than desired; (2) more targeted, pass the current rate limit value explicitly as part of each task\'s data (via pool.run({ ..., rateLimit: currentValue })) rather than relying on workers reading it from process.env at all — treating it as regular task data instead of environment configuration, which sidesteps the snapshot problem entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since worker_threads run within the same Node.js process (unlike child_process\'s separate OS processes), every piece of process-level state — including process.env — is automatically shared live between the main thread and its workers.',
      reality: 'This subtopic\'s theory and first code example both show process.env is a specific, documented exception — Node\'s own docs confirm it defaults to an independent COPY per thread, not a shared live reference, despite workers genuinely running in the same OS process.'
    },
    {
      thought: 'A worker thread always reflects the main thread\'s CURRENT process.env values whenever it reads process.env, since it is reading from the same running Node.js process.',
      reality: 'This subtopic\'s exercise shows the opposite — a worker\'s process.env is fixed to whatever the main thread\'s environment looked like at the EXACT MOMENT that specific worker was created, and stays that way indefinitely for long-lived workers, regardless of later changes to the main thread\'s environment.'
    },
    {
      thought: 'There is no way to make process.env genuinely shared and live-synced between a main thread and its workers — the independent-copy behavior is a hard, unconfigurable limitation of worker_threads.',
      reality: 'This subtopic\'s second code example shows the opposite — Node\'s own documentation provides an explicit opt-in mechanism, the env: worker.SHARE_ENV constructor option, specifically for cases where genuine two-way process.env sharing between threads is actually needed.'
    }
  ];
}
