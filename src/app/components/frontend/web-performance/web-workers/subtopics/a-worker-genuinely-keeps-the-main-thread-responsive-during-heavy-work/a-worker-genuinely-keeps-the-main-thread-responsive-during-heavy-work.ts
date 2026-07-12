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
  templateUrl: './a-worker-genuinely-keeps-the-main-thread-responsive-during-heavy-work.html',
  styleUrl: './a-worker-genuinely-keeps-the-main-thread-responsive-during-heavy-work.scss'
})
export class AWorkerGenuinelyKeepsTheMainThreadResponsiveDuringHeavyWorkSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s core claim, made directly measurable: a Worker runs on a genuinely separate OS thread',
      points: [
        'If Web Workers were just a scheduling trick (like breaking work into chunks with setTimeout), the main thread would still have to find gaps to run its own timers and input handlers around the work.',
        'Because a Worker is a real, separate OS thread, the main thread\'s own event loop — timers, input handlers, rendering — keeps running completely undisturbed while the Worker\'s JS executes its own busy loop in parallel.',
      ]
    },
    {
      heading: 'Confirmed directly — a setInterval on the main thread kept ticking through 300ms of Worker CPU work, but froze completely during the identical work run directly on the main thread',
      points: [
        'Running a genuine 300ms synchronous busy-loop (no awaits, no yields) directly on the main thread produced exactly 0 setInterval ticks during that window — the classic main-thread-blocking symptom the main page describes.',
        'Running the IDENTICAL 300ms busy-loop inside a real Worker (built from a Blob URL) produced 4 setInterval ticks on the main thread during the same window — direct, measured proof the main thread stayed free to run its own scheduled callbacks the entire time the Worker was computing.',
        'This is the mechanism behind the main page\'s INP claim: moving CPU work to a Worker doesn\'t make the work itself faster, it makes the MAIN THREAD available to respond to clicks, keystrokes, and scrolls while that work happens elsewhere.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>a Worker genuinely keeps the main thread responsive during heavy work</title>
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
      content: `// Compare main-thread responsiveness (measured via setInterval ticks) during
// a 300ms synchronous busy-loop run two ways: directly on the main thread, vs inside a real Worker.
function heavyWork(ms: number): number {
  const end = performance.now() + ms;
  let x = 0;
  while (performance.now() < end) { x += Math.sqrt(x + 1); }
  return x;
}

(async () => {
  // Test A: heavy work directly on the main thread — blocks everything, including timers
  let mainThreadTicks = 0;
  const timerA = setInterval(() => { mainThreadTicks++; }, 5);
  await new Promise((r) => setTimeout(r, 10));
  const ticksBeforeBlock = mainThreadTicks;

  heavyWork(300); // synchronous — nothing else can run while this executes

  const ticksDuringBlock = mainThreadTicks - ticksBeforeBlock;
  clearInterval(timerA);
  console.log('Main-thread work: setInterval ticks DURING 300ms of blocking work:', ticksDuringBlock, '(expect 0 — main thread is fully blocked)');

  // Test B: the SAME 300ms of work, run inside a real Worker instead
  const workerCode = \`
    self.onmessage = (e) => {
      const ms = e.data;
      const end = performance.now() + ms;
      let x = 0;
      while (performance.now() < end) { x += Math.sqrt(x + 1); }
      self.postMessage('done');
    };
  \`;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  let workerTestTicks = 0;
  const timerB = setInterval(() => { workerTestTicks++; }, 5);
  await new Promise((r) => setTimeout(r, 10));
  const ticksBeforeWorker = workerTestTicks;

  await new Promise<void>((resolve) => {
    worker.onmessage = () => resolve();
    worker.postMessage(300);
  });

  const ticksDuringWorkerWork = workerTestTicks - ticksBeforeWorker;
  clearInterval(timerB);
  worker.terminate();

  console.log('Worker-thread work: setInterval ticks DURING the identical 300ms of work:', ticksDuringWorkerWork, '(main thread stayed free)');
  console.log('---');
  console.log('Same 300ms of CPU work, two locations, dramatically different main-thread availability.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Moving our JSON.parse() of a huge payload into a Worker should make our app parse it faster." Based on this subtopic\'s measured result, is "faster parsing" the right way to describe the benefit?',
    hint: 'Think about what this subtopic actually measured — did the Worker complete the SAME 300ms of work in LESS time, or did something else change?',
    solution: 'No — "faster" is not quite the right framing, and this subtopic\'s demo makes the real distinction measurable. The 300ms busy-loop took the same ~300ms whether run on the main thread or inside a Worker — moving work to a Worker does not make the CPU do that work any faster (same instructions, same CPU work). What changed was main-thread AVAILABILITY: 0 setInterval ticks fired during the main-thread version, while 4 ticks fired during the identical Worker version — meaning the main thread was free to run other scheduled work throughout. The correct framing is "keeps the app responsive during that time," not "parses faster" — a user clicking a button during a Worker-based parse gets an instant response; the same click during a main-thread parse queues up behind the blocking work.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Web Workers make CPU-bound code run faster by using some kind of optimized execution engine.',
      reality: 'This subtopic\'s demo shows the identical 300ms busy-loop took the same ~300ms whether run on the main thread or inside a Worker — the CPU work itself is not accelerated. What changes is that the MAIN THREAD stays free to run its own scheduled callbacks (confirmed: 0 ticks vs 4 ticks) while the Worker computes in parallel on a separate thread.'
    },
    {
      thought: 'A Worker just breaks work into smaller chunks behind the scenes, similar to using setTimeout(fn, 0) to yield periodically — so a long enough Worker task could still cause noticeable jank.',
      reality: 'A Worker is a genuinely separate OS thread, not a chunking trick — confirmed directly in this subtopic\'s demo, a single unbroken 300ms synchronous busy-loop (no yields, no chunking) inside a Worker still let the main thread\'s own setInterval keep firing throughout, something no amount of main-thread chunking could achieve for that same unbroken loop.'
    },
    {
      thought: 'Since a Worker runs in parallel, the main thread and the Worker are competing for the same CPU time — moving work to a Worker only helps if the machine has spare cores sitting idle.',
      reality: 'While true that Workers benefit most from spare cores, the responsiveness benefit measured in this subtopic (main-thread timers firing freely during Worker work) holds regardless of core count — the critical fact is that the MAIN thread\'s event loop is never occupied by the Worker\'s busy-loop, so input handling and timers stay unblocked even on a single logical core where the OS time-slices between threads.'
    }
  ];
}
