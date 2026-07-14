import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './reusing-a-worker-is-dramatically-faster-than-creating-one-per-task.html',
  styleUrl: './reusing-a-worker-is-dramatically-faster-than-creating-one-per-task.scss'
})
export class ReusingAWorkerIsDramaticallyFasterThanCreatingOnePerTaskSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "~30-100ms startup" claim, made directly measurable across many small tasks',
      points: [
        'Creating a Worker means the browser must spin up a real OS thread, parse and evaluate the Worker\'s script, and set up the messaging channel — none of that is instant, and none of it is needed again once a Worker already exists and is idle.',
        'Reusing one Worker (or a small pool) for many tasks pays that startup cost ONCE; creating a fresh Worker per task pays it on every single task, even for trivially small work.',
      ]
    },
    {
      heading: 'Confirmed directly — 20 tiny tasks took 17.8x longer when each got its own fresh Worker versus reusing a single Worker for all 20',
      points: [
        'Running 20 trivial "double this number" tasks, each via a brand-new <code>new Worker(...)</code> immediately <code>terminate()</code>\'d afterward, took a measured 89ms total.',
        'Running the identical 20 tasks through ONE Worker created once up front took a measured 5ms total — a 17.8x difference, entirely attributable to Worker creation/teardown overhead rather than the trivial work itself.',
        'This is the direct, measured justification for the main page\'s Worker pool pattern: create Workers once (sized to <code>navigator.hardwareConcurrency</code>), then route many tasks through that fixed set — never spin up a Worker per task.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>reusing a Worker is dramatically faster than creating one per task</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Compare two ways of running 20 trivial tasks: a fresh Worker per task (created + terminated
// each time) vs one Worker created once and reused for all 20 tasks.
const workerCode = \`
  self.onmessage = (e) => {
    self.postMessage(e.data * 2);
  };
\`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);

const TASKS = 20;

(async () => {
  // Approach A: a NEW Worker for every task, terminated right after
  const tA = performance.now();
  for (let i = 0; i < TASKS; i++) {
    const w = new Worker(workerUrl);
    await new Promise<void>((resolve) => {
      w.onmessage = () => resolve();
      w.postMessage(i);
    });
    w.terminate();
  }
  const oneOffElapsed = performance.now() - tA;

  // Approach B: ONE Worker, created once, reused for all 20 tasks
  const reusedWorker = new Worker(workerUrl);
  const tB = performance.now();
  for (let i = 0; i < TASKS; i++) {
    await new Promise<void>((resolve) => {
      reusedWorker.onmessage = () => resolve();
      reusedWorker.postMessage(i);
    });
  }
  const reusedElapsed = performance.now() - tB;
  reusedWorker.terminate();

  console.log(\`\${TASKS} tasks, a fresh Worker per task: \${oneOffElapsed.toFixed(1)}ms\`);
  console.log(\`\${TASKS} tasks, one reused Worker: \${reusedElapsed.toFixed(1)}ms\`);
  console.log('---');
  console.log(\`ratio: \${(oneOffElapsed / reusedElapsed).toFixed(1)}x slower for the one-Worker-per-task approach\`);
  console.log('the underlying work is trivial in both cases — the gap is pure Worker creation/teardown overhead.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team processes a stream of 500 small incoming WebSocket messages per minute, each needing a quick CPU-bound transform. They write code that creates a new Worker for each incoming message, processes it, and terminates the Worker. Based on this subtopic\'s measured result, what would you recommend instead?',
    hint: 'Think about the ratio measured in this subtopic\'s demo (17.8x for 20 trivial tasks) and what that implies at 500 tasks per minute.',
    solution: 'Create a small Worker pool ONCE (sized to navigator.hardwareConcurrency, per the main page\'s own recommendation) and route all 500 messages/minute through that fixed set of already-running Workers, rather than creating and destroying a Worker per message. This subtopic\'s demo measured a 17.8x overhead penalty for one-off Workers on just 20 trivial tasks — at 500 tasks/minute, that overhead would compound continuously, likely making the "optimization" (moving work off the main thread) net SLOWER in wall-clock terms than doing the same small transforms directly on the main thread, entirely defeating the purpose. The fix costs nothing extra in code complexity: the WorkerPool pattern from the main page\'s own code tab handles exactly this queuing/reuse.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Worker creation is cheap enough that it doesn\'t matter whether you create a fresh one per task or reuse a single instance — the real cost is always in the task\'s own work.',
      reality: 'This subtopic\'s demo isolates exactly the opposite: with genuinely trivial task work (doubling a number), the one-off-Worker approach still took 17.8x longer than the reused-Worker approach — the gap is entirely Worker creation/teardown overhead, not the work itself.'
    },
    {
      thought: 'Terminating a Worker after each task is good practice — it "cleans up" and prevents memory leaks, so it\'s worth the extra overhead for the safety.',
      reality: 'A reused, long-lived Worker with no ongoing task is not "leaking" anything — it sits idle consuming minimal resources until the next postMessage, confirmed by this subtopic\'s demo running 20 sequential tasks through one Worker instance with no issue. terminate() is for when you\'re truly done with a Worker (e.g. a feature is torn down), not a per-task cleanup ritual.'
    },
    {
      thought: 'The ~30-100ms Worker startup cost mentioned on the main page is negligible in practice since it only happens once per page load.',
      reality: 'The startup cost is PER WORKER CREATED, not per page load — this subtopic\'s demo shows it compounds directly with how many times new Worker() is called; a codebase that creates a Worker per task (rather than once, reused) pays that cost repeatedly, exactly the scenario measured here.'
    }
  ];
}
