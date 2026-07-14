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
  templateUrl: './z-index-does-nothing-without-position-set.html',
  styleUrl: './z-index-does-nothing-without-position-set.scss'
})
export class ZIndexDoesNothingWithoutPositionSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'z-index is completely inert on a position: static element — not "weaker," genuinely ignored',
      points: [
        'The CSS spec ties <code>z-index</code> to positioned elements specifically — any element with <code>position: static</code> (the default) simply doesn\'t participate in z-index stacking at all, regardless of what value is set.',
        'This means a static element with <code>z-index: 999999</code> can still render visually BELOW a positioned sibling with <code>z-index: 1</code> — the huge number does nothing, because the element was never eligible to compete on z-index in the first place.',
      ]
    },
    {
      heading: 'This is directly, precisely provable with document.elementFromPoint() — not just a visual guess',
      points: [
        '<code>document.elementFromPoint(x, y)</code> returns whichever element is actually topmost (visually, at the rendering layer) at a given screen coordinate — the definitive way to check real stacking order, rather than trusting eyeballed z-index numbers.',
        'At a coordinate where a static, high-z-index element overlaps a positioned, low-z-index element, this method reliably returns the POSITIONED element — proof the static element\'s z-index had zero effect on the actual render order.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>z-index does nothing without position set</title>
    <style>
      #wrap { position: relative; width: 150px; height: 150px; }
      #staticHigh { position: static; z-index: 10; width: 100px; height: 100px; background: red; }
      #positionedLow { position: relative; z-index: 1; width: 100px; height: 100px; background: blue; margin-top: -100px; margin-left: 20px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="wrap">
      <div id="staticHigh">static, z-index: 10</div>
      <div id="positionedLow">relative, z-index: 1</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const staticHigh = document.querySelector<HTMLElement>('#staticHigh')!;
const rect = staticHigh.getBoundingClientRect();

// Check the pixel where both elements visually overlap.
const overlapX = rect.left + 80;
const overlapY = rect.top + 80;

const topElement = document.elementFromPoint(overlapX, overlapY) as HTMLElement;
console.log('topmost element at the overlap point:', topElement.id);
console.log('the LOWER z-index (1), but POSITIONED, element wins:', topElement.id === 'positionedLow');
console.log('the HIGHER z-index (10), but STATIC, element loses despite its number:', topElement.id !== 'staticHigh');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>position: static</code> element has <code>z-index: 999</code>. It overlaps a <code>position: relative</code> sibling with <code>z-index: 1</code>. Which one renders on top?',
    hint: 'z-index only applies to elements eligible to participate in stacking at all — think about which of the two elements even qualifies.',
    solution: 'The positioned element (z-index: 1) — the static element\'s z-index: 999 is completely ignored, since z-index has no effect whatsoever on position: static elements, no matter how large the value is.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A very large z-index value on any element will make it render above elements with smaller z-index values.',
      reality: 'Only true for elements that are actually POSITIONED (position ≠ static). A static element\'s z-index is completely ignored — even a value of 999999 has zero effect on stacking order.'
    },
    {
      thought: 'z-index issues can usually be diagnosed just by reading the CSS and comparing the numbers written for each element.',
      reality: 'The actual topmost element at a given point is verifiable directly with document.elementFromPoint(x, y) — a definitive, code-based check that doesn\'t depend on correctly reasoning through every element\'s position value and stacking context by eye.'
    },
    {
      thought: 'The fix for a z-index that "isn\'t working" is always to increase the number further.',
      reality: 'If the element is position: static, no number will ever work — the fix is adding position: relative (or another non-static value) FIRST, which is what actually makes z-index apply at all.'
    }
  ];
}
