import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-microtask-loop-delays-macrotask-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './microtask-loop-delays-a-macrotask-scheduled-before-it.html',
  styleUrl: './microtask-loop-delays-a-macrotask-scheduled-before-it.scss',
})
export class MicrotaskLoopDelaysAMacrotaskScheduledBeforeItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s QnA, Made Directly Observable With Real Timestamps',
      points: [
        'The main page\'s QnA states: "if a microtask schedules another microtask infinitely, the microtask queue never drains and the event loop never moves to the next macrotask." This subtopic makes that claim concrete and measurable — not with a TRUE infinite loop (which would freeze the whole demo), but with a long, self-terminating chain of a few thousand microtasks, timed against a <code>setTimeout(fn, 0)</code> that was registered BEFORE the chain even started.',
        'The order in which two async operations are SCHEDULED has no bearing on which one runs first — only their QUEUE matters. A macrotask registered first, but sitting behind a still-draining microtask queue, waits for that entire queue to finish, no matter how long it takes.',
      ],
    },
    {
      heading: 'Why the Microtask Queue Has No "Budget" or Time Limit',
      points: [
        'Unlike some scheduling systems that cap how much work runs before yielding, the JavaScript microtask queue has no built-in time budget: the event loop is contractually required to drain it COMPLETELY, however long that takes, before touching the macrotask queue or letting the browser paint a frame.',
        'This is the same underlying mechanism the main page\'s "Creating microtask loops that starve macrotasks" mistake and its <code>pump()</code> example describe — a microtask that re-schedules itself via <code>Promise.resolve().then(pump)</code> keeps the queue non-empty forever, so nothing else — not a <code>setTimeout</code>, not a click handler, not a browser repaint — ever gets a turn.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Microtask queue starves a scheduled macrotask</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const startTime = performance.now();
const MICROTASK_COUNT = 20000;

function elapsed(): string {
  return (performance.now() - startTime).toFixed(1) + 'ms';
}

console.log('t=0ms: registering setTimeout(fn, 0) FIRST...');
setTimeout(() => {
  console.log('t=' + elapsed() + ': setTimeout callback FINALLY runs');
}, 0);

console.log('t=' + elapsed() + ': now starting a chain of ' + MICROTASK_COUNT + ' microtasks (registered AFTER the setTimeout above)...');

let count = 0;
function scheduleNextMicrotask() {
  count++;
  if (count < MICROTASK_COUNT) {
    Promise.resolve().then(scheduleNextMicrotask);
  } else {
    console.log('t=' + elapsed() + ': microtask chain finished all ' + MICROTASK_COUNT + ' steps -- only NOW can the setTimeout above finally run');
  }
}
Promise.resolve().then(scheduleNextMicrotask);

console.log('t=' + elapsed() + ': synchronous code finished -- the setTimeout was registered first, but watch which log appears last');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The <code>setTimeout</code> call is the very FIRST line of async code registered. Does its callback log before or after the 20,000-step microtask chain finishes, even though the chain was scheduled second?',
    hint: 'Registration order only decides which QUEUE a callback goes into (microtask vs. macrotask) — it does not decide execution order between the two different queues.',
    solution: `The setTimeout callback logs LAST, even though it was registered
FIRST, before the microtask chain even began.

The synchronous code finishes first (the "synchronous code
finished" log), then the event loop must drain the microtask queue
COMPLETELY before it's allowed to process the next macrotask. Since
the 20,000-step microtask chain keeps re-enqueuing itself into the
SAME queue the setTimeout callback is waiting behind, all 20,000
steps run to completion first -- only then does the event loop
finally reach the macrotask queue and run the setTimeout callback.

This is the exact mechanism the main page's QnA describes for a
genuinely INFINITE microtask loop -- the only difference here is
that this chain deliberately terminates after a large but finite
number of steps, so you can actually observe the setTimeout callback
eventually firing (with a real, measurable delay) instead of the
page freezing forever.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the order in which async operations are registered in the code determines the order their callbacks run in, regardless of whether they\'re promises or setTimeout calls.',
      reality: 'ONLY the queue matters, not registration order across different queues — a setTimeout registered first still waits behind the ENTIRE microtask queue, however long it takes to drain, even if microtasks were scheduled afterward.',
    },
    {
      thought: 'the microtask queue has some kind of time limit or step budget, after which the event loop is forced to yield to the macrotask queue anyway, similar to how some UI frameworks time-slice long renders.',
      reality: 'the microtask queue has NO built-in time budget or step limit — the event loop is required by spec to drain it completely, however long that takes, before it will process a single macrotask or let the browser paint a frame.',
    },
    {
      thought: 'this kind of microtask starvation is a rare, contrived edge case that would never happen in real code.',
      reality: 'it happens any time a <code>.then()</code> callback conditionally re-schedules itself with more <code>.then()</code> calls in a loop or recursive pattern — a very natural-looking pattern for "keep polling/retrying via promises" that silently starves the rest of the page if it runs long enough.',
    },
  ];
}
