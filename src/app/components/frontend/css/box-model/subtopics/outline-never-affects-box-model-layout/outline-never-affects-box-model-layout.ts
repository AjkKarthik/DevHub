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
  templateUrl: './outline-never-affects-box-model-layout.html',
  styleUrl: './outline-never-affects-box-model-layout.scss'
})
export class OutlineNeverAffectsBoxModelLayoutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'outline is drawn OUTSIDE the border, in the same visual position border occupies — but it reserves zero layout space',
      points: [
        'Unlike <code>border</code> (which is a genuine box-model layer that adds to an element\'s rendered size in <code>content-box</code>), <code>outline</code> is composited on top of the page without shifting anything — not the element\'s own size, and not any sibling\'s position.',
        'This holds true no matter how large the outline is — a 1px outline and a 50px outline both reserve exactly zero layout space, which is why outline is the recommended tool for focus indicators: it can never cause a layout shift when it appears or disappears.',
      ]
    },
    {
      heading: 'This is directly measurable: a sibling\'s position is provably identical before and after adding a large outline',
      points: [
        'Reading a sibling element\'s <code>getBoundingClientRect()</code> before and after setting <code>outline: 20px solid</code> on a preceding element shows the exact same coordinates — proof that outline genuinely never participates in layout, not just "usually doesn\'t affect it much."',
        '<code>outline-offset</code> can even push the outline further away from the border, and this ALSO has zero layout effect — it only changes where the already-non-participating outline paints.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>outline never affects layout</title>
    <style>
      #x { width: 100px; height: 50px; background: #16a34a; }
      #y { width: 100px; height: 50px; background: #eab308; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="x">X</div>
    <div id="y">Y</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const x = document.querySelector<HTMLElement>('#x')!;
const y = document.querySelector<HTMLElement>('#y')!;

const yTopBefore = y.getBoundingClientRect().top;
console.log('y.top before adding outline to x:', yTopBefore);

x.style.outline = '20px solid black';
x.style.outlineOffset = '10px';

const yTopAfter = y.getBoundingClientRect().top;
console.log('y.top after a 20px outline + 10px offset on x:', yTopAfter);
console.log('y position genuinely unchanged:', yTopBefore === yTopAfter);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An element gets <code>outline: 50px solid red; outline-offset: 20px;</code> added to it. Its next sibling\'s <code>getBoundingClientRect().top</code> is read before and after. Do the two readings differ?',
    hint: 'Compare this to what a 50px border would do — border is a genuine box-model layer, but outline is drawn in a completely separate step of rendering.',
    solution: 'No — they\'re identical. Neither the outline\'s width nor its offset participate in layout at all; the sibling\'s position is completely unaffected regardless of how large the outline or offset gets.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'outline behaves like a second border — it just renders a bit further out, but still takes up space the way border does.',
      reality: 'It reserves zero layout space, period. A border adds to an element\'s size in content-box; an outline of any width changes nothing about layout — only what\'s painted on top of the existing box.'
    },
    {
      thought: 'A very large outline (like 50px) might start affecting nearby elements\' positions, even if a thin one doesn\'t.',
      reality: 'Outline width has no relationship to layout at any size — a 1px outline and a 500px outline both reserve exactly zero space. This is exactly why it\'s the recommended choice for focus indicators, which need to appear/disappear without ever shifting the page.'
    },
    {
      thought: 'outline-offset pushes the outline outward by increasing the element\'s effective footprint.',
      reality: 'outline-offset only repositions where the (already layout-inert) outline paints relative to the border — it has zero layout effect too, exactly like outline-width.'
    }
  ];
}
