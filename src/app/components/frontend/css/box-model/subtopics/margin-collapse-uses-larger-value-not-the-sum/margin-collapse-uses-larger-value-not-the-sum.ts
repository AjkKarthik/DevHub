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
  templateUrl: './margin-collapse-uses-larger-value-not-the-sum.html',
  styleUrl: './margin-collapse-uses-larger-value-not-the-sum.scss'
})
export class MarginCollapseUsesLargerValueNotTheSumSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two adjacent vertical margins don\'t add together — the browser keeps only the LARGER of the two',
      points: [
        'A block with <code>margin-bottom: 30px</code> immediately followed by a block with <code>margin-top: 20px</code> produces a 30px gap between them, not 50px — the smaller margin is entirely discarded, not added on top.',
        'This is genuinely different from how spacing works almost everywhere else in CSS (padding, gap, flex/grid spacing all sum normally) — margin collapse is a deliberate, historical exception specific to adjacent block-level vertical margins in normal flow.',
      ]
    },
    {
      heading: 'This is directly measurable via getBoundingClientRect() — no visual inspection or guessing needed',
      points: [
        'Reading the actual gap between two elements — <code>secondElement.getBoundingClientRect().top - firstElement.getBoundingClientRect().bottom</code> — gives the true rendered distance, which a script can compare directly against both the sum and the max of the two declared margins.',
        'This measurement approach works for any CSS layout claim, not just margin collapse — getBoundingClientRect() reflects the actual computed, rendered layout, not just the declared CSS values.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Margin collapse uses the larger value</title>
    <style>
      #a { margin-bottom: 30px; height: 10px; background: #dc2626; }
      #b { margin-top: 20px; height: 10px; background: #2563eb; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="a">Block A (margin-bottom: 30px)</div>
    <div id="b">Block B (margin-top: 20px)</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const a = document.querySelector<HTMLElement>('#a')!;
const b = document.querySelector<HTMLElement>('#b')!;

const actualGap = b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
const declaredSum = 30 + 20;
const declaredMax = Math.max(30, 20);

console.log('actual measured gap:', actualGap, 'px');
console.log('sum of both margins would be:', declaredSum, 'px');
console.log('larger of the two margins is:', declaredMax, 'px');
console.log('gap equals the larger margin, not the sum:', actualGap === declaredMax);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Block A has <code>margin-bottom: 40px</code>. Block B directly follows it with <code>margin-top: 10px</code>. What is the actual rendered gap between them?',
    hint: 'Margin collapse doesn\'t split the difference or average the two values — it keeps exactly one of them and discards the other entirely.',
    solution: '40px — the larger of the two margins. The smaller 10px margin is completely discarded, not added on top and not averaged; measuring with getBoundingClientRect() would show a gap of exactly 40px, not 50px.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adjacent vertical margins add together, the same way padding or gap values would.',
      reality: 'They collapse into a single value — the larger of the two — with the smaller one discarded entirely. This is a deliberate CSS-specific exception, not how spacing works elsewhere.'
    },
    {
      thought: 'Margin collapse averages the two margin values, or uses whichever element comes first in the DOM.',
      reality: 'It always uses the LARGER of the two values, regardless of which element declared it or which comes first — a 10px margin next to a 40px margin always collapses to 40px.'
    },
    {
      thought: 'To verify a layout claim like this, you need to visually inspect a screenshot or manually measure pixels on screen.',
      reality: 'getBoundingClientRect() gives the exact rendered position and size of any element directly from script — a precise, repeatable way to verify computed layout without any visual inspection at all.'
    }
  ];
}
