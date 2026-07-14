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
  templateUrl: './long-tasks-register-as-real-longtask-entries.html',
  styleUrl: './long-tasks-register-as-real-longtask-entries.scss'
})
export class LongTasksRegisterAsRealLongtaskEntriesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The browser has a real, dedicated API for detecting long tasks — this is not a theoretical 50ms rule of thumb',
      points: [
        'The Long Tasks API exposes a <code>longtask</code> performance entry type. Any single synchronous chunk of main-thread work exceeding 50ms produces a real entry, with a genuine <code>duration</code> field reporting exactly how long it blocked the thread.',
        'This is directly measurable: registering a live <code>PerformanceObserver({ type: \'longtask\' })</code> and running a genuine 360ms synchronous busy-loop produces exactly one entry with <code>duration: 360</code> — the same detection mechanism Chrome DevTools\' Performance panel uses to draw its red "long task" markers.',
      ]
    },
    {
      heading: 'Why input delay is really "was a longtask entry already in progress when the user clicked"',
      points: [
        'A user gesture (click, tap, key press) cannot be handled until the browser\'s current task finishes. If that task is a 360ms long task, and the gesture happens 100ms into it, the input delay is at least the remaining 260ms — regardless of how fast the actual click handler itself would have run.',
        'This is why input delay is so often blamed on "unrelated" code — a large JS bundle evaluating at startup, or a heavy synchronous computation triggered by something else entirely, can be the actual cause of a slow click that has nothing to do with the click handler itself.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>long tasks register as real longtask entries</title>
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
      content: `const entries: number[] = [];
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    entries.push(entry.duration);
    console.log('real longtask entry recorded — duration:', entry.duration.toFixed(1), 'ms');
  }
});
observer.observe({ type: 'longtask', buffered: false });

// Give the observer a brief moment to fully attach before starting the block
setTimeout(() => {
  console.log('starting a genuine 360ms synchronous busy-loop now...');
  const end = performance.now() + 360;
  while (performance.now() < end) { /* burn the main thread */ }
  console.log('busy-loop finished — check above: did a real longtask entry fire?');

  setTimeout(() => {
    observer.disconnect();
    console.log('total longtask entries captured:', entries.length, '— any click during that 360ms window would have been delayed by up to the full 360ms.');
  }, 200);
}, 50);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A "Add to cart" button feels sluggish. Its own click handler is tiny — it just sets a boolean flag. Profiling shows the click fires 280ms after the actual mouse-down. The handler itself only takes 2ms to run. Where is the other 278ms going?',
    hint: 'Ask what "input delay" actually measures — the time from the gesture to when the handler STARTS, not how long the handler itself takes.',
    solution: 'The 278ms is input delay — time the browser spent unable to even START the click handler, almost certainly because a long task (over 50ms, possibly much longer) was already running on the main thread when the click happened. This is commonly caused by unrelated code: a large bundle finishing evaluation, an analytics script initializing, or a synchronous computation triggered by something else on the page. The 2ms handler was never the bottleneck — the fix is finding and breaking up whatever long task was blocking the thread at that moment, not optimising the handler itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Long task" is just a rough rule of thumb performance guides use — roughly "don\'t write slow code", not a precise browser measurement.',
      reality: 'It is a real, standardised browser API (<code>PerformanceObserver({ type: \'longtask\' })</code>) with an exact 50ms threshold and a genuine <code>duration</code> field — the same signal Chrome DevTools\' own Performance panel visualises as red task markers.'
    },
    {
      thought: 'If a click handler itself is fast (a few milliseconds), the interaction should always feel instant regardless of what else is happening on the page.',
      reality: 'A fast handler can still produce a slow interaction if a long task from UNRELATED code is already running on the main thread when the click happens — the browser cannot start the handler until the current task finishes, no matter how quick that handler would be.'
    },
    {
      thought: 'Long tasks are mainly a concern during page load (parsing bundles, hydration) — once the page has settled, this stops being relevant.',
      reality: 'Any synchronous block over 50ms triggered at ANY point in the page lifecycle — a large search-result render, a heavy synchronous computation from a later user action — produces the exact same longtask entry and the exact same input-delay risk, well after initial load.'
    }
  ];
}
