import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-filereadersync-only-exists-inside-a-real-web-worker',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './filereadersync-only-exists-inside-a-real-web-worker.html',
  styleUrl: './filereadersync-only-exists-inside-a-real-web-worker.scss'
})
export class FileReaderSyncOnlyExistsInsideARealWebWorkerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'FileReaderSync isn\'t merely discouraged on the main thread — it genuinely does not exist there',
      points: [
        'The main page\'s Common Mistake is explicit: "FileReaderSync blocks the UI thread; it should only be used in Web Workers." This is stronger than a style guideline — <code>FileReaderSync</code> is a global constructor defined ONLY on <code>WorkerGlobalScope</code>, never on <code>Window</code>.',
        'The regular, asynchronous <code>FileReader</code> exists on both the main thread and inside workers, but its synchronous counterpart was deliberately scoped to workers only — a synchronous, blocking file read would freeze the entire page\'s UI if it were allowed on the main thread, so the platform simply never defines the constructor there.',
      ]
    },
    {
      heading: 'This is directly checkable from both sides at once',
      points: [
        'On the main thread, <code>typeof FileReaderSync</code> evaluates to <code>\'undefined\'</code> — the identifier is genuinely undeclared, the same as checking any made-up global name, with no ReferenceError thrown by the safe <code>typeof</code> operator.',
        'Spinning up a REAL <code>Worker</code> and checking the same <code>typeof FileReaderSync</code> expression from inside its own script reports <code>\'function\'</code> instead — a live, side-by-side confirmation that this is a genuine scope difference, not a permissions restriction or a deprecated API.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>FileReaderSync exists only in workers</title></head>
  <body>
    <p>Checking typeof FileReaderSync on the main thread AND from inside a real Web Worker.</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'worker.js',
      content: `// This file runs in WorkerGlobalScope, not Window — a genuinely different
// global execution context from the main page.
self.postMessage({
  context: 'inside the Worker',
  hasFileReaderSync: typeof FileReaderSync,
  hasFileReader: typeof FileReader,
});
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const mainThreadCheck = {
  context: 'main thread (window)',
  hasFileReaderSync: typeof (window as any).FileReaderSync,
  hasFileReader: typeof (window as any).FileReader,
};

const worker = new Worker('/worker.js');
worker.onmessage = (event) => {
  const workerCheck = event.data;

  output.textContent =
    \`\${mainThreadCheck.context}:\\n\` +
    \`  typeof FileReaderSync = "\${mainThreadCheck.hasFileReaderSync}"\\n\` +
    \`  typeof FileReader     = "\${mainThreadCheck.hasFileReader}"\\n\\n\` +
    \`\${workerCheck.context}:\\n\` +
    \`  typeof FileReaderSync = "\${workerCheck.hasFileReaderSync}"\\n\` +
    \`  typeof FileReader     = "\${workerCheck.hasFileReader}"\\n\\n\` +
    'FileReader exists in BOTH contexts. FileReaderSync exists ONLY inside\\n' +
    'the real Worker — this is a genuine scope difference in the platform\\n' +
    'itself, confirmed live from both sides.';
  worker.terminate();
};
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The demo checks <code>typeof FileReaderSync</code> on the main thread AND inside a real <code>Worker</code>. Predict: on the main thread, does this throw a <code>ReferenceError</code>, or does it evaluate safely to a string?',
    hint: '<code>typeof</code> is specifically designed to never throw for an undeclared identifier — that is exactly why it is the safe way to check whether a global exists before using it.',
    solution: `It evaluates safely to the string "undefined" — no ReferenceError, on the main thread. typeof is
built to be safe against undeclared globals for exactly this reason; only DIRECTLY referencing an
undeclared identifier (like new FileReaderSync()) would throw a ReferenceError. Inside the real
Worker, the exact same expression instead evaluates to "function", confirming FileReaderSync is a
genuinely defined constructor there — a live, two-sided proof of the scope difference the main
page's mistake entry describes.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FileReaderSync exists everywhere JavaScript runs, but using it on the main thread is just a bad practice that still technically works.',
      reality: 'It genuinely does not exist as a global on the main thread at all — typeof FileReaderSync reports "undefined" there, and attempting new FileReaderSync() throws a real ReferenceError, not just a performance warning.'
    },
    {
      thought: 'Since FileReader and FileReaderSync sound like a sync/async pair of the same API, they must be available in exactly the same contexts.',
      reality: 'FileReader is available on BOTH the main thread and inside workers; FileReaderSync is deliberately restricted to WorkerGlobalScope only — the platform never even defines the synchronous constructor where it could block the UI.'
    },
    {
      thought: 'Testing whether an API exists in a Worker requires inspecting worker source code or documentation, not something you can verify live from the main page.',
      reality: 'A real Worker can self-check its own global scope and report the result back via postMessage — exactly what the demo above does, turning documentation into a live, two-sided, directly observable fact.'
    },
  ];
}
