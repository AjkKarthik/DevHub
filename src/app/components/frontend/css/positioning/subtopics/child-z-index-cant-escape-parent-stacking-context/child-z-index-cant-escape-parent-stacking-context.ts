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
  templateUrl: './child-z-index-cant-escape-parent-stacking-context.html',
  styleUrl: './child-z-index-cant-escape-parent-stacking-context.scss'
})
export class ChildZIndexCantEscapeParentStackingContextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A z-index only competes against OTHER elements inside the SAME stacking context — never against elements in a sibling context',
      points: [
        'When <code>.card-a</code> gets <code>position: relative; z-index: 1</code>, it creates its own stacking context — everything inside it (including a <code>.tooltip</code> with <code>z-index: 9999</code>) is trapped competing only within that context.',
        'A sibling <code>.card-b</code> with just <code>z-index: 2</code> creates its OWN, separate stacking context at the outer level — and since 2 &gt; 1, <code>.card-b</code> wins the OUTER comparison entirely, before the tooltip\'s enormous <code>z-index: 9999</code> ever gets a chance to matter.',
      ]
    },
    {
      heading: 'This is the exact scenario the main page\'s own code example describes — and it\'s directly verifiable, not just theoretical',
      points: [
        'Using <code>document.elementFromPoint()</code> at the pixel where <code>.tooltip</code> and <code>.card-b</code> visually overlap reveals which one the browser is actually rendering on top — settling the question with a real measurement instead of reasoning about z-index numbers alone.',
        'The practical fix, also from the main page, is <code>isolation: isolate</code> on the component that needs to escape this trap — or restructuring so the tooltip isn\'t nested inside a stacking-context-creating ancestor at all.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>child z-index can't escape parent stacking context</title>
    <style>
      #cardA { position: relative; z-index: 1; width: 100px; height: 100px; background: red; }
      #tooltip { position: absolute; z-index: 9999; top: 20px; left: 20px; width: 100px; height: 100px; background: orange; }
      #cardB { position: relative; z-index: 2; width: 100px; height: 100px; background: blue; margin-top: -60px; margin-left: 60px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="cardA">
      card-a (z-index: 1)
      <div id="tooltip">tooltip (z-index: 9999)</div>
    </div>
    <div id="cardB">card-b (z-index: 2)</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const tooltip = document.querySelector<HTMLElement>('#tooltip')!;
const rect = tooltip.getBoundingClientRect();

const overlapX = rect.left + 70;
const overlapY = rect.top + 70;

const topElement = document.elementFromPoint(overlapX, overlapY) as HTMLElement;
console.log('topmost element at the tooltip/card-b overlap point:', topElement.id);
console.log('card-b (z-index: 2, outer context) wins over tooltip (z-index: 9999, trapped in card-a\\'s context):', topElement.id === 'cardB');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A tooltip has <code>z-index: 9999</code> but is nested inside <code>.card-a</code> (which has <code>position: relative; z-index: 1</code>). A sibling <code>.card-b</code> has <code>z-index: 2</code> and overlaps the tooltip. Which one renders on top?',
    hint: 'The tooltip\'s z-index only matters within .card-a\'s own stacking context — think about what actually competes against .card-b at the OUTER level.',
    solution: '.card-b — its z-index: 2 beats .card-a\'s z-index: 1 at the outer comparison, and once .card-a (and everything inside it, including the tooltip) loses that outer battle, the tooltip\'s huge z-index: 9999 never even enters the competition against .card-b.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'z-index values compete globally across the entire page — the single highest number anywhere always wins.',
      reality: 'z-index only compares elements within the SAME stacking context. A child\'s z-index, no matter how large, is capped by its parent\'s position in the OUTER stacking comparison — it can never escape to compete against elements outside that parent.'
    },
    {
      thought: 'Fixing a z-index conflict like this just requires raising the trapped element\'s z-index even higher.',
      reality: 'No number is high enough — the element is trapped in the wrong stacking context entirely. The fix is structural: isolation: isolate on the right ancestor, or restructuring the DOM so the element isn\'t nested inside a competing stacking context.'
    },
    {
      thought: 'Only explicit z-index + position creates a stacking context — a component without those two properties can\'t accidentally trap its children this way.',
      reality: 'Plenty of other common properties also create stacking contexts — opacity less than 1, transform, filter, will-change — meaning a component can accidentally trap its children\'s z-index without ever setting z-index on itself at all.'
    }
  ];
}
