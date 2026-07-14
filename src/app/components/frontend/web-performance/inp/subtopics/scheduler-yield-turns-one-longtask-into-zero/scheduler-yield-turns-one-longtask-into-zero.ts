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
  templateUrl: './scheduler-yield-turns-one-longtask-into-zero.html',
  styleUrl: './scheduler-yield-turns-one-longtask-into-zero.scss'
})
export class SchedulerYieldTurnsOneLongtaskIntoZeroSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'scheduler.yield() splits one continuous block of main-thread work into separate browser tasks, each of which is individually timed against the 50ms longtask threshold',
      points: [
        'A single, unbroken 360ms synchronous loop is ONE browser task — and it produces exactly one <code>longtask</code> entry with <code>duration: 360</code>.',
        'The identical 360ms of TOTAL work, split into twelve 30ms chunks with <code>await scheduler.yield()</code> between each one, produces ZERO <code>longtask</code> entries — because every individual chunk stays under the 50ms threshold, even though the combined work and wall-clock time is unchanged.',
        'This is measured directly with a live <code>PerformanceObserver({ type: \'longtask\' })</code> comparing both versions — not a simulation of what should theoretically happen.',
      ]
    },
    {
      heading: 'Zero longtask entries does not mean the work vanished — it means input now has repeated chances to interrupt',
      points: [
        'Total wall-clock time for the yielding version is roughly the same as the unyielding version (plus a small scheduling overhead) — <code>scheduler.yield()</code> does not make code run faster.',
        'What changes is that between every chunk, the browser gets a real opportunity to process a pending user gesture before continuing — so a click that happens to land mid-computation is handled promptly instead of waiting for the entire block to finish.',
        'This is exactly why the main page recommends yielding inside loops (<code>if (i % 50 === 0) await scheduler.yield()</code>) rather than trying to make the loop itself faster — the goal is giving input a chance to interrupt, not reducing total work.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>scheduler.yield() turns one longtask into zero</title>
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
      content: `function heavyChunk(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) { /* burn the main thread */ }
}

async function measureLongtasks(label: string, work: () => Promise<void>) {
  const durations: number[] = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) durations.push(Math.round(entry.duration));
  });
  observer.observe({ type: 'longtask', buffered: false });
  await new Promise(r => setTimeout(r, 30)); // let the observer fully attach

  const start = performance.now();
  await work();
  const wallClockMs = performance.now() - start;

  await new Promise(r => setTimeout(r, 150)); // let any entries flush
  observer.disconnect();

  console.log(label, '— wall-clock:', wallClockMs.toFixed(0), 'ms | longtask entries:', durations.length, durations);
}

(async () => {
  await measureLongtasks('UNYIELDED (one 360ms block)', async () => {
    heavyChunk(360);
  });

  await new Promise(r => setTimeout(r, 100));

  await measureLongtasks('YIELDED (12 x 30ms chunks + scheduler.yield())', async () => {
    let elapsed = 0;
    while (elapsed < 360) {
      heavyChunk(30);
      elapsed += 30;
      await (scheduler as any).yield();
    }
  });

  console.log('same total work, same rough wall-clock time — but the unyielded version guarantees one 50ms+ longtask, and the yielded version guarantees none.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds <code>scheduler.yield()</code> every 50 iterations inside a slow loop, expecting the loop to finish noticeably faster. After measuring, the total wall-clock time is almost identical to before — maybe even a few milliseconds slower. They conclude scheduler.yield() "doesn\'t actually help" and revert the change. Is that the right conclusion?',
    hint: 'Ask what scheduler.yield() is actually supposed to change: the total time the work takes, or something else about how that time is structured.',
    solution: 'The conclusion is wrong — scheduler.yield() was never meant to make the loop faster, and a small overhead from repeated yielding is expected and normal. What it changes is whether the SAME total work blocks input the whole time or gets interrupted along the way. The correct way to evaluate the change is checking Long Tasks entries (or real click responsiveness during the loop), not total wall-clock time — this subtopic\'s demo shows wall-clock time staying roughly the same while longtask entries drop from one guaranteed 360ms block to zero.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'scheduler.yield() is a performance optimisation that makes slow code run faster, similar to caching or algorithmic improvements.',
      reality: 'It does not reduce total work or wall-clock time at all — this subtopic\'s demo shows both versions taking roughly the same total time. What it changes is whether that time is one uninterruptible block or several yieldable chunks, which is what actually matters for INP.'
    },
    {
      thought: 'Since scheduler.yield() adds await points and some scheduling overhead, using it will always make the overall interaction feel slightly slower end-to-end.',
      reality: 'The overhead is real but tiny compared to the benefit — a 360ms task that responds to a mid-task click instantly (yielded) feels vastly more responsive than a 360ms task that makes every click wait the full duration (unyielded), even if the yielded version finishes a few milliseconds later in total.'
    },
    {
      thought: 'You only need to worry about scheduler.yield() for extremely long operations — anything under a second or so is short enough not to matter for INP.',
      reality: 'The relevant threshold is 50ms, not "under a second" — a single unbroken 360ms block already produces a full longtask entry and can single-handedly cause a poor (> 500ms) INP score if a click lands early in that block; nothing about "under a second" makes it safe.'
    }
  ];
}
