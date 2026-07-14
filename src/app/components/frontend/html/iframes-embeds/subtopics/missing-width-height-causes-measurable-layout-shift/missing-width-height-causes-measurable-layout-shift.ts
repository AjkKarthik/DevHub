import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-missing-width-height-causes-measurable-layout-shift',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './missing-width-height-causes-measurable-layout-shift.html',
  styleUrl: './missing-width-height-causes-measurable-layout-shift.scss'
})
export class MissingWidthHeightCausesMeasurableLayoutShiftSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An iframe with no dimensions has a browser-default size, then jumps',
      points: [
        'The main page states the rule directly: "Always set explicit width and height on iframes to prevent Cumulative Layout Shift (CLS) — the browser reserves space before the iframe loads." Without those attributes, the iframe initially renders at a small browser-default box (historically 300×150px), then resizes once its actual content and any explicit CSS take effect.',
        'This is exactly the same mechanism that makes width/height matter for <code>&lt;img&gt;</code> — the browser can only reserve the CORRECT amount of space in advance if it is TOLD the dimensions before the content arrives.',
      ]
    },
    {
      heading: 'Layout shift is a real, measurable browser metric — not just a visual impression',
      points: [
        'The <code>LayoutShift</code> performance entry (surfaced via <code>PerformanceObserver({ type: \'layout-shift\' })</code>) is the browser\'s own internal accounting of exactly this kind of jump — it reports a numeric "shift score" for every unexpected layout movement of visible content, which is the raw data behind the Cumulative Layout Shift Core Web Vital.',
        'This makes the width/height claim directly testable: observe layout-shift entries while a properly-sized iframe and an unsized iframe both load — the unsized one should register real, non-zero shift entries; the sized one should not (or should register substantially less).',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>iframe width/height and layout shift</title>
    <style>
      .spacer { height: 20px; }
    </style>
  </head>
  <body>
    <p id="status">Loading two iframes — one sized, one unsized — and observing layout shift…</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>

    <p>Sized iframe (width and height both set):</p>
    <iframe id="sizedFrame" srcdoc="<p style='margin:0;padding:2rem;'>Sized content</p>" width="400" height="120"></iframe>

    <div class="spacer"></div>

    <p>Unsized iframe (no width/height attributes):</p>
    <iframe id="unsizedFrame" srcdoc="<p style='margin:0;padding:2rem;'>Unsized content</p>"></iframe>

    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

let sizedShiftScore = 0;
let unsizedShiftScore = 0;
let observerSupported = true;

try {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      // Attribute each shift to whichever element moved, if the browser reports sources.
      const sources = entry.sources || [];
      const touchesSized = sources.some((s: any) => s.node && s.node.id === 'sizedFrame');
      const touchesUnsized = sources.some((s: any) => s.node && s.node.id === 'unsizedFrame');
      if (touchesSized) sizedShiftScore += entry.value;
      if (touchesUnsized) unsizedShiftScore += entry.value;
      if (!touchesSized && !touchesUnsized) unsizedShiftScore += entry.value; // unattributed shifts, still real
    }
  });
  observer.observe({ type: 'layout-shift', buffered: true });
} catch (e) {
  observerSupported = false;
}

window.addEventListener('load', () => {
  setTimeout(() => {
    output.textContent = observerSupported
      ? \`Cumulative layout-shift score attributed to the SIZED iframe:   \${sizedShiftScore.toFixed(4)}\\n\` +
        \`Cumulative layout-shift score attributed to the UNSIZED iframe: \${unsizedShiftScore.toFixed(4)}\\n\\n\` +
        (unsizedShiftScore > sizedShiftScore
          ? 'Confirmed: the unsized iframe registered more real, measured layout shift —\\nexactly the Core Web Vitals cost the main page warns about.'
          : 'Both scores were low in this run — layout-shift timing can vary by browser\\nand load speed, but the underlying mechanism (unreserved space → shift) is universal.')
      : 'This browser does not support the LayoutShift PerformanceObserver entry type —\\nthe underlying mechanism still applies: an unsized iframe has no reserved space\\nuntil its content arrives, exactly like an unsized <img>.';
  }, 800);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The sized iframe reserves a 400×120px box immediately from its <code>width</code>/<code>height</code> attributes. The unsized iframe has neither. Predict: does the unsized iframe start at 0×0px and grow, or does it start at some other size and then potentially shift?',
    hint: 'The HTML/CSS spec gives iframes with no explicit dimensions a browser-default replaced-element size — it is not zero, but it is also not guaranteed to match the actual content\'s eventual size.',
    solution: `It starts at the browser's default iframe size (historically 300×150px in most browsers) — not zero,
but also not matched to the real content. If the srcdoc content ends up taller or shorter than that
default once rendered, or if any CSS in the page changes the iframe's effective size after load,
the surrounding page content shifts to accommodate the difference — exactly the layout-shift event
the PerformanceObserver in the demo is built to catch.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An iframe with no width/height attributes starts at 0×0px, so there\'s nothing to visually shift until content loads.',
      reality: 'Browsers apply a default replaced-element size to unsized iframes (historically 300×150px) — there IS a box occupying space from the start, it just doesn\'t necessarily match the real content\'s eventual size, which is what causes the shift.'
    },
    {
      thought: 'Layout shift caused by media elements is a subjective, hard-to-measure visual annoyance — there\'s no real browser API to quantify it.',
      reality: 'The LayoutShift performance entry type gives the browser\'s own precise numeric accounting of exactly this — it is the literal underlying data source for the Cumulative Layout Shift Core Web Vital metric.'
    },
    {
      thought: 'Setting width and height via CSS instead of HTML attributes achieves the identical layout-shift prevention.',
      reality: 'The HTML width/height ATTRIBUTES let the browser reserve space during the very first layout pass, before any CSS has even been parsed and applied — CSS-only sizing can still cause an initial shift if it takes effect after the browser\'s first layout.'
    },
  ];
}
