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
  templateUrl: './em-compounds-in-nested-elements-rem-does-not.html',
  styleUrl: './em-compounds-in-nested-elements-rem-does-not.scss'
})
export class EmCompoundsInNestedElementsRemDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'font-size: 1.25em is relative to the PARENT\'s computed font-size — nest it again and the multiplication compounds',
      points: [
        'A parent with <code>font-size: 1.25em</code> (relative to a 16px root) computes to 20px. A child ALSO using <code>font-size: 1.25em</code> is relative to ITS parent\'s computed 20px — not the original 16px root — producing 25px, not another flat 20px.',
        'Nest a third level and it compounds again: 25px × 1.25 = 31.25px. Each additional nesting level multiplies further, even though every element in the chain declares the exact same <code>1.25em</code> value.',
      ]
    },
    {
      heading: 'font-size: 1.25rem is ALWAYS relative to the root element\'s font-size, regardless of nesting depth — the compounding never happens',
      points: [
        'Because <code>rem</code> ("root em") always measures against the <code>&lt;html&gt;</code> element\'s font-size specifically — never the immediate parent — every element using <code>1.25rem</code> computes to the exact same pixel value, no matter how deeply it\'s nested.',
        'This is directly measurable: a parent and child both using <code>1.25rem</code> compute to IDENTICAL font-sizes, while the same parent/child pair using <code>1.25em</code> compute to genuinely different, compounding values.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>em compounds, rem does not</title>
    <style>
      html { font-size: 16px; }
      #emParent { font-size: 1.25em; }
      #emChild { font-size: 1.25em; }
      #remParent { font-size: 1.25rem; }
      #remChild { font-size: 1.25rem; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="emParent">em parent
      <div id="emChild">em child</div>
    </div>
    <div id="remParent">rem parent
      <div id="remChild">rem child</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const emParent = document.querySelector<HTMLElement>('#emParent')!;
const emChild = document.querySelector<HTMLElement>('#emChild')!;
const remParent = document.querySelector<HTMLElement>('#remParent')!;
const remChild = document.querySelector<HTMLElement>('#remChild')!;

console.log('root font-size: 16px, both parent/child use font-size: 1.25em or 1.25rem');
console.log('em parent computed font-size:', getComputedStyle(emParent).fontSize);
console.log('em child computed font-size:', getComputedStyle(emChild).fontSize, '(compounds: 1.25 x 1.25 x 16px)');
console.log('rem parent computed font-size:', getComputedStyle(remParent).fontSize);
console.log('rem child computed font-size:', getComputedStyle(remChild).fontSize, '(always 1.25 x 16px, never compounds)');
console.log('em genuinely compounds:', getComputedStyle(emChild).fontSize !== getComputedStyle(emParent).fontSize);
console.log('rem stays identical regardless of nesting:', getComputedStyle(remChild).fontSize === getComputedStyle(remParent).fontSize);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The root font-size is 16px. A parent has <code>font-size: 1.25em</code>. Its child ALSO has <code>font-size: 1.25em</code>. What is the child\'s actual computed font-size?',
    hint: 'The child\'s em is relative to its own parent\'s COMPUTED font-size, not the original root — figure out the parent\'s computed size first, then apply 1.25 again.',
    solution: '25px — the parent computes to 20px (1.25 × 16px), and the child\'s 1.25em is relative to THAT 20px, not the original 16px root: 1.25 × 20px = 25px. Each nesting level compounds the multiplication further.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'font-size: 1.25em always means "1.25 times the root font-size," the same way rem works.',
      reality: 'em is relative to the ELEMENT\'S OWN PARENT\'s computed font-size, not the root — this is the fundamental difference from rem, and it\'s exactly why em compounds when nested and rem never does.'
    },
    {
      thought: 'Compounding only becomes a real problem after many levels of nesting — one or two levels of em is safe.',
      reality: 'It\'s measurable and real even at just two levels — a parent and child both using the same 1.25em value produce genuinely different, incorrect font-sizes (20px vs 25px) immediately, not just in deeply nested edge cases.'
    },
    {
      thought: 'The fix for em compounding is to calculate and hardcode a compensating smaller em value at each nesting level.',
      reality: 'The simpler, standard fix is to just use rem for font-size instead — it sidesteps the compounding problem entirely rather than requiring per-level compensation math.'
    }
  ];
}
