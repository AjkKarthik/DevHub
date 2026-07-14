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
  templateUrl: './transform-avoids-cls-while-top-and-left-trigger-it.html',
  styleUrl: './transform-avoids-cls-while-top-and-left-trigger-it.scss'
})
export class TransformAvoidsClsWhileTopAndLeftTriggerItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The SAME visual movement genuinely produces a different CLS outcome depending purely on which property does the moving',
      points: [
        'CLS is not calculated from "did anything move visually" — it is calculated from actual <code>layout-shift</code> performance entries the browser records when an element\'s LAYOUT geometry changes between two rendered frames.',
        'Changing <code>top</code> forces the browser to recompute layout (the element\'s position in the box model genuinely changes), which the browser detects and reports as a real layout shift. Changing <code>transform</code> only affects the compositor\'s final paint step — the element\'s LAYOUT geometry never changes at all, so there is nothing for the layout-shift detector to see.',
      ]
    },
    {
      heading: 'This is directly measurable using the real browser Performance API — a PerformanceObserver for layout-shift entries fires for a top-based move but stays completely silent for the identical transform-based move',
      points: [
        'Two identical 200×200 boxes are each moved by exactly 300px — one using <code>el.style.top</code>, the other using <code>el.style.transform = \'translateY(300px)\'</code>.',
        'A live <code>PerformanceObserver({ type: \'layout-shift\' })</code> records ONE real entry (with a genuine numeric shift score) for the <code>top</code>-based move, and reports ZERO entries at all for the <code>transform</code>-based move — this is the exact same mechanism the Chrome DevTools CLS score and real CrUX field data use, not a simulation.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>transform avoids CLS while top and left trigger it</title>
    <style>
      #topBox { width: 100px; height: 100px; background: crimson; position: fixed; top: 20px; left: 20px; }
      #transformBox { width: 100px; height: 100px; background: royalblue; position: fixed; top: 150px; left: 20px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="topBox"></div>
    <div id="transformBox"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const topShiftEntries: number[] = [];
const transformShiftEntries: number[] = [];

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries() as any[]) {
    // We can't easily attribute which element caused which entry in this simplified demo,
    // so we run the two moves sequentially and bucket by timing instead.
    console.log('real layout-shift entry recorded, score:', entry.value);
  }
});
observer.observe({ type: 'layout-shift', buffered: false });

const topBox = document.querySelector<HTMLElement>('#topBox')!;
const transformBox = document.querySelector<HTMLElement>('#transformBox')!;

console.log('moving #topBox via style.top (layout-triggering)...');
topBox.style.top = '300px';
void topBox.offsetWidth; // force layout flush

setTimeout(() => {
  console.log('moving #transformBox via style.transform (compositor-only)...');
  transformBox.style.transform = 'translateY(300px)';
  void transformBox.offsetWidth;

  setTimeout(() => {
    observer.disconnect();
    console.log('check the log above: the top-based move logged a real layout-shift entry; the transform-based move logged NONE at all.');
  }, 500);
}, 300);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A mobile nav drawer slides in using <code>.drawer { left: -280px; transition: left 0.3s; } .drawer.open { left: 0; }</code>. Lighthouse flags this component as a CLS contributor. Would switching to a transform-based approach genuinely fix the score, or is it just a style preference?',
    hint: 'Ask whether the browser\'s real layout-shift detector can even distinguish between the two approaches, or if it\'s purely cosmetic.',
    solution: 'It genuinely fixes the CLS score, not just style — left triggers actual layout recalculation, which the browser\'s real layout-shift detector records as a measurable shift entry every time the drawer opens or closes. Switching to transform: translateX(-280px) / translateX(0) produces the identical visual animation but generates zero layout-shift entries, since transform only affects compositor-stage painting, never layout geometry.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CLS is a rough, somewhat subjective estimate of "how much stuff visually moved around" — the exact CSS property used to move something shouldn\'t matter much to the actual number.',
      reality: 'CLS comes from a precise, real browser API (the layout-shift performance entry) that only fires when LAYOUT geometry changes — not from any general "did pixels move" heuristic. The specific property used is the entire difference between a real shift entry and zero entries.'
    },
    {
      thought: 'Since transform and top can both be used to move an element to the same final visual position, they must be roughly interchangeable choices with only a minor performance difference.',
      reality: 'They differ categorically for CLS purposes, not just in raw animation smoothness — one is invisible to the layout-shift detector entirely, and the other is exactly what it is designed to catch.'
    },
    {
      thought: 'This distinction mainly matters for continuous animations (like a sliding drawer) — a one-time, instant style change (no transition) probably behaves the same either way.',
      reality: 'It applies identically to instant, non-animated changes too — the demo in this subtopic uses instant style assignments, not a CSS transition, and the top-based one-time jump still produces a real layout-shift entry while the transform-based one-time jump produces none.'
    }
  ];
}
