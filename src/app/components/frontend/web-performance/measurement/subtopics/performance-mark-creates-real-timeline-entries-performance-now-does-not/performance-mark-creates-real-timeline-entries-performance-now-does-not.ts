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
  templateUrl: './performance-mark-creates-real-timeline-entries-performance-now-does-not.html',
  styleUrl: './performance-mark-creates-real-timeline-entries-performance-now-does-not.scss'
})
export class PerformanceMarkCreatesRealTimelineEntriesPerformanceNowDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'performance.now() returns a plain number — nothing else in the browser can see it',
      points: [
        'Subtracting two <code>performance.now()</code> calls gives an accurate duration, but that duration exists only as a local JavaScript variable. It is never recorded anywhere the browser itself tracks — not in DevTools, not queryable via any Performance API method.',
        'Confirmed directly: after timing work with <code>performance.now()</code>, querying <code>performance.getEntriesByType(\'mark\')</code> and <code>getEntriesByType(\'measure\')</code> for anything related to that timing returns ZERO entries — the measurement simply does not exist as far as the Performance API\'s own timeline is concerned.',
      ]
    },
    {
      heading: 'performance.mark() and performance.measure() create real, queryable, named entries on the browser\'s own timeline',
      points: [
        'The exact same timed work, instrumented instead with <code>performance.mark()</code> before and after, plus <code>performance.measure()</code> between them, produces REAL entries — confirmed directly via <code>getEntriesByType(\'mark\')</code> returning the two marks and <code>getEntriesByType(\'measure\')</code> returning the named measure, complete with an accurate <code>.duration</code> property.',
        'This is exactly why the main page recommends marks over raw <code>performance.now()</code> subtraction for anything worth investigating later — a mark/measure entry can be found by name from ANYWHERE in the codebase (or from DevTools\' own Performance panel Timings lane) long after the code that created it has run, while a <code>performance.now()</code> difference is gone the instant the variable goes out of scope.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>performance.mark() creates real timeline entries — performance.now() does not</title>
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
      content: `function doWork(): number {
  let sum = 0;
  for (let i = 0; i < 100_000; i++) sum += i;
  return sum;
}

// Approach A: performance.now() — a plain number, invisible to the Performance API
const start = performance.now();
doWork();
const end = performance.now();
const rawDuration = end - start;

console.log('performance.now() duration (a local variable only):', rawDuration.toFixed(2), 'ms');
console.log('entries the Performance API can find for this timing:', performance.getEntriesByType('mark').length + performance.getEntriesByType('measure').length, '(expected 0)');

// Approach B: performance.mark() / measure() — real, queryable timeline entries
performance.mark('work-start');
doWork();
performance.mark('work-end');
performance.measure('doWork-duration', 'work-start', 'work-end');

const marks = performance.getEntriesByType('mark');
const measures = performance.getEntriesByType('measure');
const namedMeasure = performance.getEntriesByName('doWork-duration')[0] as PerformanceMeasure;

console.log('real marks found by the Performance API:', marks.length, marks.map((m) => m.name));
console.log('real measures found by the Performance API:', measures.length, measures.map((m) => m.name));
console.log('the measure has a real, queryable duration:', namedMeasure.duration.toFixed(2), 'ms — findable by NAME from anywhere.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer times a checkout flow with performance.now(), logs the duration to the console during development, and removes the console.log before shipping (keeping the timing variables for "later analysis if needed"). Months later, a performance investigation wants to know how long checkout took for a specific slow session recorded in a session-replay tool that captures DevTools Performance traces. Is the removed console.log data recoverable from the trace?',
    hint: 'Ask where a performance.now() difference actually lives once the console.log line is gone — is it recorded anywhere the Performance panel or a trace file can see?',
    solution: 'No, it is not recoverable — confirmed directly in this subtopic\'s demo, a performance.now() timing produces zero entries anywhere in the Performance API\'s own timeline. Once the console.log is removed, the only record of that duration was a JavaScript variable that existed briefly and then vanished; it was never part of the browser\'s recorded performance data, so no DevTools trace, session replay, or Performance panel capture could ever have included it. Had the code used performance.mark()/measure() instead, the named measure entry would be present in ANY performance trace recording taken during that session, recoverable long after the fact — this is exactly the gap the main page\'s "use marks, not raw now()" advice closes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'performance.now() and performance.mark()/measure() are just two different syntaxes for getting the same underlying timing data — pick whichever is more convenient to write.',
      reality: 'They produce fundamentally different artifacts — this subtopic\'s demo shows performance.now() leaves ZERO trace anywhere queryable, while mark()/measure() create real, named entries findable via getEntriesByType() or getEntriesByName() from anywhere in the codebase.'
    },
    {
      thought: 'Since performance.now() gives a more precise, direct number, it must be the more "raw" and therefore more accurate timing method — marks add unnecessary overhead for a simple duration measurement.',
      reality: 'The underlying timestamp precision is identical either way — performance.mark() internally calls the same high-resolution clock performance.now() uses. The only difference is whether that timestamp gets RECORDED as a named, later-queryable entry, not its precision.'
    },
    {
      thought: 'DevTools\' Performance panel automatically captures ALL performance.now() calls in a recorded trace, the same way it captures marks — you just need to know where to look in the trace viewer.',
      reality: 'DevTools has no visibility into a plain performance.now() difference at all — confirmed in this subtopic\'s demo that it produces no Performance API entry of any kind. Only performance.mark()/measure() calls appear in the Performance panel\'s "Timings" lane; there is no equivalent view for raw now() differences because none exists to show.'
    }
  ];
}
