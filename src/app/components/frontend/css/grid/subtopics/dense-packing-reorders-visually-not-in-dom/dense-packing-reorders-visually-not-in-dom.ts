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
  templateUrl: './dense-packing-reorders-visually-not-in-dom.html',
  styleUrl: './dense-packing-reorders-visually-not-in-dom.scss'
})
export class DensePackingReordersVisuallyNotInDomSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'grid-auto-flow: row dense can move a LATER item ahead of an EARLIER one visually — automatically, with no order property involved at all',
      points: [
        'The default ("sparse") auto-placement algorithm never backtracks: each item is placed at or after the position of the previous item, so a gap left by an earlier large item stays empty if a later item doesn\'t happen to fit it going forward.',
        '<code>dense</code> packing explicitly backtracks to fill ANY earlier gap it can, regardless of DOM order — so a small item that comes AFTER a gap-creating item in the markup can end up rendering visually BEFORE another item that comes between them in the DOM.',
      ]
    },
    {
      heading: 'This creates the exact same DOM-vs-visual divergence flexbox\'s order property does — just triggered automatically instead of manually',
      points: [
        'With three items A (spans 2 columns), B (spans 2 columns), and C (spans 1 column) in that DOM order, a 3-column dense grid renders them as A, C, B — C jumps ahead of B to fill the single-column gap A\'s span leaves in row one.',
        'The DOM order itself never changes — a script traversing <code>container.children</code> still reports A, B, C — meaning Tab-key order and screen reader reading order follow the ORIGINAL sequence, potentially now disagreeing with what a sighted user sees rendered.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>dense packing reorders visually, not in the DOM</title>
    <style>
      #grid { display: grid; grid-template-columns: repeat(3, 100px); grid-auto-rows: 50px; grid-auto-flow: row dense; }
      #itemA { grid-column: span 2; background: #dc2626; }
      #itemB { grid-column: span 2; background: #16a34a; }
      #itemC { background: #2563eb; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="grid">
      <div id="itemA">A (span 2)</div>
      <div id="itemB">B (span 2)</div>
      <div id="itemC">C</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const grid = document.querySelector<HTMLElement>('#grid')!;
const children = Array.from(grid.children) as HTMLElement[];

const domOrder = children.map(el => el.id);
console.log('DOM order (container.children):', domOrder.join(', '));

const visualOrder = children
  .map(el => ({ id: el.id, rect: el.getBoundingClientRect() }))
  .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)
  .map(x => x.id);
console.log('visual order (top-to-bottom, left-to-right):', visualOrder.join(', '));

console.log('C rendered before B despite coming after it in the DOM:',
  visualOrder.indexOf('itemC') < visualOrder.indexOf('itemB'));
console.log('DOM order itself is unchanged:', domOrder.join() === 'itemA,itemB,itemC');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A dense grid has items A (span 2 columns), B (span 2 columns), C (span 1 column) in that DOM order. A screen reader announces items in DOM order. Does it announce C before or after B?',
    hint: 'Dense packing changes where things are PAINTED — think about whether that has any effect on the sequence a script (or assistive technology) sees when traversing the DOM.',
    solution: 'After B — the screen reader follows DOM order (A, B, C), completely unaffected by dense packing\'s visual reshuffling. This can genuinely disagree with what a sighted user sees on screen, where C visually appears before B.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'grid-auto-flow: row dense only affects layout when items explicitly have an order property set, similar to flexbox.',
      reality: 'No order property is involved at all — dense packing is purely a side effect of the auto-placement algorithm backtracking to fill gaps, triggered automatically by item spans, not by any per-item ordering value.'
    },
    {
      thought: 'Since dense packing only rearranges empty space, not actual content order, it has no accessibility implications.',
      reality: 'It has the exact same class of accessibility implication as flexbox\'s order property — DOM order (and therefore Tab/screen-reader order) can diverge from visual order, confusing keyboard and screen-reader users even though the layout looks intentional to a sighted mouse user.'
    },
    {
      thought: 'Checking whether dense packing changed anything requires visually inspecting the rendered grid for gaps.',
      reality: 'It\'s directly checkable via script — comparing DOM traversal order against items sorted by their actual rendered position (top, then left) reveals exactly how far the two have diverged, without needing to eyeball anything.'
    }
  ];
}
