import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-and-profiling-web-workers-in-devtools-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-and-profiling-web-workers-in-devtools.html',
  styleUrl: './debugging-and-profiling-web-workers-in-devtools.scss',
})
export class DebuggingAndProfilingWebWorkersInDevtoolsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Workers do not appear in the normal Sources panel context',
      points: [
        'The main Web Workers page shows how to WRITE worker code but says nothing about debugging it once something goes wrong. A worker\'s console output IS interleaved into the main DevTools Console by default (tagged with the worker\'s script name), but its own execution — breakpoints, call stack, local variables — lives in a SEPARATE JavaScript context that the top-level Sources panel does not show by default.',
        'In Chrome DevTools, the small dropdown at the top-left of the Sources panel (next to the file tree, sometimes hidden until a worker is active) lists every active execution context — <code>top</code> (the main page) plus one entry per running worker. Selecting a worker\'s context switches breakpoints, the call stack view, and the console\'s implicit <code>this</code>/scope to that worker specifically.',
      ],
    },
    {
      heading: 'Setting breakpoints inside worker source',
      points: [
        'With sourcemaps enabled (the Angular CLI generates them for worker chunks by default in dev builds), the worker\'s ORIGINAL TypeScript file — not the bundled/minified output — appears in the Sources panel\'s file tree, nested under the worker\'s own script origin. Set a breakpoint directly on a TypeScript line exactly as you would in main-thread code.',
        'When that breakpoint hits, DevTools pauses ONLY that worker thread — the main UI thread keeps running normally (you can still interact with the page). This is different from a main-thread breakpoint, which freezes the entire page including all rendering.',
        'A common gotcha: if a worker is short-lived (spawned, does one task, terminates), it may finish and be garbage-collected before you\'ve had a chance to open its context in the dropdown. Add a temporary <code>debugger;</code> statement at the top of the worker script itself to guarantee a pause on every run while investigating, then remove it.',
      ],
    },
    {
      heading: 'The multi-thread Performance profiler',
      points: [
        'Chrome DevTools\' Performance panel records ALL threads simultaneously — the main thread\'s flame chart appears at the top, and each active worker gets its own separate flame-chart LANE beneath it, labeled with the worker\'s script URL. This is the direct way to VISUALLY CONFIRM the main topic\'s core claim — that heavy computation moved to a worker keeps the main thread\'s lane free of long tasks, instead of just trusting the code looks right.',
        'A long task on the MAIN thread\'s lane shows as a wide red-flagged block (frame budget exceeded); the same computation correctly offloaded shows a wide block in the WORKER\'s lane instead, with the main thread\'s lane staying mostly idle/short blocks — this is the profiler\'s visual proof that the "eliminate jank" theory claim from the main topic actually held in practice.',
        'The profiler also reveals STRUCTURED CLONE cost as a distinct block in the "Timings" or the main thread\'s activity right around a <code>postMessage()</code> call — for large payloads without Transferables, this can show up as an unexpectedly large chunk of main-thread time, which is the profiler evidence for why the main topic recommends Transferable objects for big buffers.',
      ],
    },
    {
      heading: 'Inspecting live workers outside the current tab\'s DevTools',
      points: [
        '<code>chrome://inspect/#workers</code> (or the "Workers" section of that page) lists every worker running across ALL open tabs, including ones whose parent tab\'s own DevTools you haven\'t opened — clicking "inspect" next to one opens a dedicated DevTools window scoped to just that worker\'s context.',
        'This is particularly useful for a worker that keeps running after you\'ve navigated away from its originating page in that tab (a bug in itself — the main topic\'s "always terminate" rule exists partly to prevent this), since it lets you find and inspect an orphaned worker that a normal per-tab DevTools session would have already lost access to.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/heavy.worker.ts',
      content: `/// <reference lib="webworker" />

self.onmessage = ({ data }: MessageEvent<number>) => {
  // Uncomment while debugging to force a guaranteed pause in this worker's
  // own execution context, even if the worker finishes before you can
  // select it from the Sources panel's context dropdown:
  // debugger;

  let sum = 0;
  for (let i = 0; i < data; i++) sum += i;
  self.postMessage(sum);
};
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Debugging and profiling Web Workers in DevTools</h3>
    <p>
      Open your browser's DevTools (F12), start a Performance recording, then click
      Compute — the main thread's flame-chart lane should stay clear while a separate
      lane for heavy.worker.ts shows the actual computation.
    </p>
    <button (click)="compute()">Compute (500M iterations, off-thread)</button>
    @if (result() !== null) { <p>Result: {{ result() }}</p> }
    <p class="hint">
      Also try: open the Sources panel's context dropdown (top-left, next to the file
      tree) while this runs — it lists "top" plus this worker's own execution context.
    </p>
  \`,
})
export class App {
  result = signal<number | null>(null);

  compute() {
    const worker = new Worker(new URL('./heavy.worker', import.meta.url));
    worker.onmessage = (e) => {
      this.result.set(e.data);
      worker.terminate();
    };
    worker.postMessage(500_000_000);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Debugging and Profiling Web Workers in DevTools</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Modify <code>heavy.worker.ts</code> to <code>postMessage()</code> the full 500M-element intermediate array instead of just the final sum (a deliberately wasteful change), then use the Performance profiler\'s main-thread lane to find the structured-clone cost this introduces around the returning <code>postMessage</code> call — compare it against the original version\'s profile.',
    hint: 'Build an array in the worker (e.g. new Float64Array(500_000_000) filled with partial sums) and postMessage() it WITHOUT a transfer list. Record a new Performance profile and look for a wide block on the main thread right as the worker\'s message is received — that\'s the deep-clone cost the main topic\'s Transferables section warns about.',
    solution: `// Deliberately wasteful version for profiling comparison:
self.onmessage = ({ data }: MessageEvent<number>) => {
  const arr = new Float64Array(data);
  let sum = 0;
  for (let i = 0; i < data; i++) {
    sum += i;
    arr[i] = sum; // large intermediate array, kept around on purpose
  }
  // No transfer list — this deep-clones the entire array back to main thread.
  self.postMessage(arr);
};

// In the Performance profiler, look for a wide block on the MAIN thread's
// lane immediately after the worker's lane finishes — that gap is structured-clone
// deserialization cost, which a transfer list (postMessage(arr.buffer, [arr.buffer]))
// would eliminate almost entirely.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a worker\'s <code>console.log</code> output appearing in the main DevTools Console means its full execution (breakpoints, call stack, scope) is also automatically visible there.',
      reality: 'console output is interleaved into the shared Console, but breakpoints and the call stack live in the worker\'s OWN execution context — you must select that context from the Sources panel\'s context dropdown (or open chrome://inspect/#workers) to set breakpoints or inspect its scope.',
    },
    {
      thought: 'pausing at a breakpoint inside a worker freezes the whole page, the same as a main-thread breakpoint.',
      reality: 'a worker breakpoint pauses ONLY that worker thread — the main UI thread and page remain fully interactive, which is a direct consequence of workers running on a genuinely separate OS thread.',
    },
    {
      thought: 'the Performance profiler only shows main-thread activity — workers are invisible to it.',
      reality: 'the Performance panel records every active thread simultaneously, giving each worker its own flame-chart lane beneath the main thread\'s — this is the most direct way to visually confirm that heavy work actually moved off the main thread, rather than just trusting the code.',
    },
  ];
}
