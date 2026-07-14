import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-defer-guarantees-order-and-fires-before-domcontentloaded',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './defer-guarantees-order-and-fires-before-domcontentloaded.html',
  styleUrl: './defer-guarantees-order-and-fires-before-domcontentloaded.scss'
})
export class DeferGuaranteesOrderAndFiresBeforeDomcontentloadedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'defer is a spec-guaranteed contract; async makes no such promise',
      points: [
        'The main page states it plainly: "defer downloads in background and executes after HTML parsing" while "async downloads and executes immediately, breaking order." The word "breaking" is doing real work there — async scripts run in WHATEVER order they happen to finish downloading, independent of their position in the document.',
        'defer scripts, by contrast, are guaranteed by the HTML spec to execute in their DOCUMENT ORDER, and always AFTER the HTML has finished parsing but BEFORE the <code>DOMContentLoaded</code> event fires — this is a hard ordering contract, not just a typical/likely outcome.',
      ]
    },
    {
      heading: 'Both halves of that guarantee are directly, reliably testable',
      points: [
        'You can prove the ORDER guarantee by having multiple deferred scripts each push a log entry, then checking the log array is in the exact same sequence as their <code>&lt;script&gt;</code> tags appear in the HTML — regardless of file size or any artificial variance between them.',
        'You can prove the TIMING guarantee by comparing timestamps: every deferred script\'s execution timestamp should be earlier than the timestamp recorded by a <code>DOMContentLoaded</code> listener, every single time, with no exceptions.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>defer order and DOMContentLoaded timing</title>
    <script defer src="script-c.js"></script>
    <script defer src="script-a.js"></script>
    <script defer src="script-b.js"></script>
  </head>
  <body>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'script-c.js',
      content: `window.__deferLog = window.__deferLog || [];
window.__deferLog.push({ script: 'C', time: performance.now() });
`,
    },
    {
      path: 'script-a.js',
      content: `window.__deferLog = window.__deferLog || [];
window.__deferLog.push({ script: 'A', time: performance.now() });
`,
    },
    {
      path: 'script-b.js',
      content: `window.__deferLog = window.__deferLog || [];
window.__deferLog.push({ script: 'B', time: performance.now() });
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

let domContentLoadedTime: number | null = null;
document.addEventListener('DOMContentLoaded', () => {
  domContentLoadedTime = performance.now();
});

window.addEventListener('load', () => {
  setTimeout(() => {
    const log = (window as any).__deferLog as { script: string; time: number }[];
    const order = log.map(e => e.script).join(' → ');
    const allBeforeDCL = log.every(e => domContentLoadedTime !== null && e.time < domContentLoadedTime);

    output.textContent =
      \`Scripts were declared in this order in the HTML: C, A, B (deliberately NOT alphabetical/logical order)\\n\\n\` +
      \`Actual execution order recorded: \${order}\\n\` +
      \`  ← matches declaration order exactly, regardless of any download-time variance\\n\\n\` +
      \`DOMContentLoaded fired at: \${domContentLoadedTime?.toFixed(2)}ms\\n\` +
      log.map(e => \`  \${e.script} executed at: \${e.time.toFixed(2)}ms  (before DOMContentLoaded? \${e.time < domContentLoadedTime!})\`).join('\\n') +
      \`\\n\\nAll three deferred scripts ran before DOMContentLoaded? \${allBeforeDCL}\`;
  }, 300);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The three deferred scripts are declared in the HTML in the order C, then A, then B — deliberately not alphabetical. Predict: does the actual execution order follow C → A → B (document order), or could it come out as A → B → C (alphabetical) if script-a.js happens to be the smallest, fastest file to download?',
    hint: 'The defer ordering guarantee is based purely on DOCUMENT POSITION, not download speed, file size, or which one happens to arrive from the network first.',
    solution: `It always executes C → A → B, matching document order exactly — regardless of which file
downloads fastest. This is the core guarantee defer provides: even if script-b.js finishes
downloading before script-c.js, the browser holds B's execution until C (and A) have already run,
specifically to preserve the order authors wrote them in. This is precisely the guarantee async
scripts do NOT make — an async script executes the moment ITS OWN download finishes, with zero
regard for other scripts' document position.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'defer scripts execute in whatever order they finish downloading, just delayed until after parsing — similar to async but merely "later."',
      reality: 'defer\'s defining guarantee is document ORDER, completely independent of download speed. A script declared first always executes first, even if a later script in the document finishes downloading sooner.'
    },
    {
      thought: 'DOMContentLoaded fires as soon as the HTML parser reaches the closing </html> tag, before any deferred scripts have had a chance to run.',
      reality: 'The spec explicitly holds DOMContentLoaded until AFTER all deferred scripts have finished executing — this is precisely why code that needs the DOM ready AND relies on deferred script side effects can safely use DOMContentLoaded as the signal.'
    },
    {
      thought: 'The only meaningful difference between defer and async is WHEN they start downloading.',
      reality: 'Both defer and async download in parallel without blocking the parser — the meaningful difference is entirely about EXECUTION timing and ordering: defer guarantees document order before DOMContentLoaded; async executes immediately upon its own download completion, in an unpredictable order relative to other scripts.'
    },
  ];
}
