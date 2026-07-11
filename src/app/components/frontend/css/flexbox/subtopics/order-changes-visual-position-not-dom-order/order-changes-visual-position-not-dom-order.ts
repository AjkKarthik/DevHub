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
  templateUrl: './order-changes-visual-position-not-dom-order.html',
  styleUrl: './order-changes-visual-position-not-dom-order.scss'
})
export class OrderChangesVisualPositionNotDomOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'order changes only where an item RENDERS — it never touches the underlying DOM structure',
      points: [
        'Three items in DOM order A, B, C can be given <code>order: 2</code>, <code>order: 1</code>, and <code>order: 0</code> respectively, causing them to visually render as C, B, A — while <code>document.querySelectorAll()</code> or any DOM traversal still reports A, B, C, completely unchanged.',
        'This is directly measurable: DOM order (children array order) and visual order (sorted by each item\'s rendered horizontal position) can be compared programmatically and shown to genuinely diverge.',
      ]
    },
    {
      heading: 'Because DOM order is what drives Tab-key navigation and screen reader reading order, this divergence has real accessibility consequences',
      points: [
        'A keyboard user pressing Tab moves through elements in DOM order, NOT visual order — so if <code>order</code> is used to make an item appear first visually, a sighted keyboard user still tabs to it LAST, in its original DOM position.',
        'This is exactly why the main page recommends caution with <code>order</code>: visual order and DOM order intentionally diverging can create a confusing mismatch between what a sighted mouse user sees and what a keyboard/screen-reader user experiences, unless the divergence is deliberate and minor.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>order changes visual position, not DOM order</title>
    <style>
      #container { display: flex; }
      #container div { width: 60px; height: 40px; }
      #itemA { order: 2; background: #dc2626; }
      #itemB { order: 1; background: #16a34a; }
      #itemC { order: 0; background: #2563eb; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container">
      <div id="itemA">A</div>
      <div id="itemB">B</div>
      <div id="itemC">C</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.querySelector<HTMLElement>('#container')!;
const children = Array.from(container.children) as HTMLElement[];

const domOrder = children.map(el => el.id);
console.log('DOM order (children array):', domOrder.join(', '));

const visualOrder = children
  .map(el => ({ id: el.id, left: el.getBoundingClientRect().left }))
  .sort((a, b) => a.left - b.left)
  .map(x => x.id);
console.log('visual order (sorted by left position):', visualOrder.join(', '));

console.log('do they differ?', domOrder.join() !== visualOrder.join());
console.log('DOM order unchanged despite the visual reshuffle:', domOrder.join() === 'itemA,itemB,itemC');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Three flex items in DOM order A, B, C are given <code>order: 2</code>, <code>order: 1</code>, <code>order: 0</code> respectively. A keyboard user presses Tab from outside the container. Which item receives focus first?',
    hint: 'Tab-key navigation follows one specific order — think about which of the two (DOM order or visual order) that actually is.',
    solution: 'Item A — Tab follows DOM order, not visual order, so the item that\'s FIRST in the markup (A) still receives focus first, even though it now renders LAST on screen (order: 2 pushes it visually to the end).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting the CSS order property reorders elements in the DOM, the same way JavaScript\'s appendChild or insertBefore would.',
      reality: 'It never touches the DOM at all — only where each item is painted on screen changes. A DOM traversal (querySelectorAll, children, etc.) reports the original, unchanged order regardless of any order values applied.'
    },
    {
      thought: 'Since order only affects rendering, it has no consequences beyond visual layout.',
      reality: 'It has real accessibility consequences — Tab-key navigation and screen reader reading order both follow DOM order, not visual order, so a mismatch between the two can genuinely confuse keyboard and screen-reader users even though sighted mouse users see nothing wrong.'
    },
    {
      thought: 'A visual reordering via CSS order is always safe as long as the final layout looks correct to a sighted user testing with a mouse.',
      reality: 'Looking correct visually says nothing about the keyboard/screen-reader experience — verifying order usage requires actually tabbing through the page (or checking DOM order programmatically) in addition to a visual check.'
    }
  ];
}
