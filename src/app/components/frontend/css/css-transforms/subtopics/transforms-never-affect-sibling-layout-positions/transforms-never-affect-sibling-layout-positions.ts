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
  templateUrl: './transforms-never-affect-sibling-layout-positions.html',
  styleUrl: './transforms-never-affect-sibling-layout-positions.scss'
})
export class TransformsNeverAffectSiblingLayoutPositionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Scaling an element to 2x its size and moving it 200px doesn\'t nudge its neighbor by even a single pixel — transforms are purely visual, layout stays untouched',
      points: [
        'A transform changes how an element is PAINTED — its final visual position and size on screen — without changing anything about the box model calculation that determines where other elements get laid out.',
        'This is fundamentally different from changing <code>width</code>, <code>margin</code>, or <code>top</code>/<code>left</code> in normal flow, all of which genuinely participate in layout and can push siblings around.',
      ]
    },
    {
      heading: 'This is directly measurable: a sibling\'s getBoundingClientRect() position is read before and after a dramatic transform is applied to the PRECEDING element, and the two readings are identical',
      points: [
        'Two inline-block boxes sit side by side. The FIRST one gets <code>transform: translateX(200px) scale(2)</code> applied — a large, visually dramatic move-and-grow.',
        'Reading the SECOND (sibling) box\'s <code>getBoundingClientRect().left</code> before and after that transform shows the exact same value — confirming the sibling never moved, even though the transformed box visually now overlaps where the sibling appears to be.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>transforms never affect sibling layout positions</title>
    <style>
      #wrap { display: flex; gap: 8px; }
      #moved { width: 50px; height: 50px; background: green; }
      #sibling { width: 50px; height: 50px; background: orange; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="wrap">
      <div id="moved"></div>
      <div id="sibling"></div>
    </div>
    <button id="applyBtn">Apply dramatic transform to the green box</button>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const moved = document.querySelector<HTMLElement>('#moved')!;
const sibling = document.querySelector<HTMLElement>('#sibling')!;
const btn = document.querySelector<HTMLButtonElement>('#applyBtn')!;

const siblingLeftBefore = sibling.getBoundingClientRect().left;
console.log('sibling left position BEFORE transform:', siblingLeftBefore);

btn.addEventListener('click', () => {
  moved.style.transform = 'translateX(200px) scale(2)';
  const siblingLeftAfter = sibling.getBoundingClientRect().left;
  console.log('sibling left position AFTER a 200px translate + 2x scale on its neighbor:', siblingLeftAfter);
  console.log('sibling never moved, despite the dramatic visual change next to it:', siblingLeftBefore === siblingLeftAfter);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A card in a horizontal flex row gets <code>transform: scale(1.5)</code> on hover to visually "pop." Do the other cards in the row shift apart to make room for the now-larger card?',
    hint: 'Ask whether transform participates in the box model / layout calculation, or only affects final paint.',
    solution: 'No — the other cards stay exactly where they were. The scaled card\'s ORIGINAL, untransformed size is still what the flex layout uses to position everything; the transform only affects how the card is painted afterward. Visually the enlarged card may overlap its neighbors, but none of them actually move.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since transform can visually make an element much bigger (scale) or move it far away (translate), other elements in the layout must shift to accommodate the new visual size and position.',
      reality: 'Layout is calculated entirely from the element\'s pre-transform box — width, height, margin, and position in normal flow. The transform is applied as a final visual step, completely invisible to the layout algorithm and to how siblings are positioned.'
    },
    {
      thought: 'A large transform (like scale(3) or a big translate) risks visually overlapping siblings in a way that also affects their own layout or triggers a reflow.',
      reality: 'It can cause visual OVERLAP (siblings painted underneath/behind the transformed element, subject to normal stacking/z-index rules), but it never triggers a layout reflow — the siblings\' actual positions in the document remain completely unaffected, confirmed directly by their unchanged getBoundingClientRect() values.'
    },
    {
      thought: 'This "transform doesn\'t affect layout" behavior is somewhat exotic and mainly relevant for animation performance discussions, not everyday layout reasoning.',
      reality: 'It\'s directly useful for everyday centering patterns too — the classic position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) centering trick relies specifically on transform NOT recalculating the element\'s layout position, only its final paint position.'
    }
  ];
}
