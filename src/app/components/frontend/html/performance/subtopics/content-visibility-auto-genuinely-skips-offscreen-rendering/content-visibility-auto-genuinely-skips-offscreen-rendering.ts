import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-content-visibility-auto-genuinely-skips-offscreen-rendering',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './content-visibility-auto-genuinely-skips-offscreen-rendering.html',
  styleUrl: './content-visibility-auto-genuinely-skips-offscreen-rendering.scss'
})
export class ContentVisibilityAutoGenuinelySkipsOffscreenRenderingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'content-visibility: auto is not just "defer the paint" — it skips real rendering work',
      points: [
        'The main page\'s Q&amp;A is direct: content-visibility: auto "instructs the browser to skip rendering off-screen elements and their descendants until they scroll into view. This reduces initial layout, style, and paint work." This is a genuine skip of real rendering pipeline stages, not a visual trick like <code>opacity: 0</code> or a mere CSS transition delay.',
        'The element still reserves its own space in the layout (so the page doesn\'t jump when it later becomes visible) — but its DESCENDANTS are not laid out, styled, or painted at all while off-screen, which is exactly why it helps pages with very long lists of complex content.',
      ]
    },
    {
      heading: 'This is directly observable via a real, standard browser event',
      points: [
        'The <code>contentvisibilityautostatechange</code> event fires on an element with <code>content-visibility: auto</code> whenever the browser starts or stops skipping its rendering — the event object\'s <code>.skipped</code> property is a real, spec-defined boolean reporting exactly that state.',
        'This turns "is the browser actually skipping this content right now" from an inference into a directly observable fact: listen for the event, read <code>.skipped</code>, and you know for certain — no timing heuristics or performance-trace guesswork required.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>content-visibility: auto skipping</title>
    <style>
      .spacer { height: 1400px; background: linear-gradient(#eee, #ccc); display: flex; align-items: center; justify-content: center; }
      #cvBox {
        content-visibility: auto;
        contain-intrinsic-size: 200px; /* reserved placeholder size while skipped */
        border: 2px solid #e34c26;
        padding: 1rem;
      }
    </style>
  </head>
  <body>
    <p id="status">Scroll down to see the content-visibility box's real skip/render state change.</p>
    <div class="spacer">scroll down 1400px</div>
    <div id="cvBox"><p>This box uses content-visibility: auto.</p></div>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;position:fixed;bottom:0;left:0;right:0;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const box = document.getElementById('cvBox')!;

let eventCount = 0;

box.addEventListener('contentvisibilityautostatechange', (e: any) => {
  eventCount++;
  output.textContent =
    \`contentvisibilityautostatechange fired (#\${eventCount})\\n\` +
    \`  event.skipped = \${e.skipped}\\n\` +
    (e.skipped
      ? '  → the browser is CURRENTLY SKIPPING layout/style/paint for this box\\'s children'
      : '  → the browser is now ACTUALLY RENDERING this box\\'s children (it is near/in the viewport)');
});

output.textContent = 'Waiting for the first contentvisibilityautostatechange event (fires once initial state is known)…';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The box starts far below a 1400px spacer, well outside the initial viewport. Predict: what will <code>event.skipped</code> report the very first time <code>contentvisibilityautostatechange</code> fires, before you scroll at all?',
    hint: 'content-visibility: auto\'s whole mechanism is based on proximity to the viewport — an element starting far off-screen has no reason to be actively rendered yet.',
    solution: `It reports skipped: true. The box starts well outside the viewport, so the browser has no reason
to pay the layout/style/paint cost for its children yet — the contentvisibilityautostatechange event
fires immediately to confirm this skipped state. Scroll the box into view and a SECOND event fires
with skipped: false, confirming the browser has now started actually rendering its contents — a
direct, real-time signal of the exact optimization the main page describes, not something you have
to infer from a performance trace.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'content-visibility: auto works like opacity: 0 or visibility: hidden — the content is still fully rendered, just not visually displayed.',
      reality: 'It genuinely skips layout, style calculation, and paint for the element\'s descendants while off-screen — real rendering pipeline work is avoided entirely, not merely hidden after being computed.'
    },
    {
      thought: 'Detecting whether content-visibility is actually skipping an element requires indirect performance profiling or timing heuristics.',
      reality: 'The contentvisibilityautostatechange event and its .skipped property give a direct, real-time, spec-defined answer — no profiling or inference needed.'
    },
    {
      thought: 'An element with content-visibility: auto has no size at all while its content is skipped, causing the surrounding page to reflow oddly.',
      reality: 'The element still occupies layout space based on its own box (and the contain-intrinsic-size hint, if provided) — only its DESCENDANTS\' rendering is skipped, which is exactly what prevents the page from jumping around as elements scroll in and out.'
    },
  ];
}
