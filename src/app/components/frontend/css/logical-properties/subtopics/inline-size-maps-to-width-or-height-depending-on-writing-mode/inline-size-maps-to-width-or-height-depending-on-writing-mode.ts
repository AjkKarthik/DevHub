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
  templateUrl: './inline-size-maps-to-width-or-height-depending-on-writing-mode.html',
  styleUrl: './inline-size-maps-to-width-or-height-depending-on-writing-mode.scss'
})
export class InlineSizeMapsToWidthOrHeightDependingOnWritingModeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'inline-size: 300px is width in horizontal-tb, but the exact same declaration becomes HEIGHT once writing-mode: vertical-rl is set',
      points: [
        'Unlike the inline-start/inline-end flip (which follows <code>direction</code>), the inline-size/block-size mapping follows the <code>writing-mode</code> property — a different axis-control mechanism entirely.',
        'In <code>horizontal-tb</code> (the default), the inline axis runs horizontally, so <code>inline-size</code> controls the same dimension as <code>width</code>. In <code>vertical-rl</code>, the inline axis runs vertically, so the SAME <code>inline-size</code> declaration now controls the same dimension as <code>height</code> instead.',
      ]
    },
    {
      heading: 'This is directly measurable via getBoundingClientRect() — the identical inline-size/block-size pair produces a rendered box with its width and height literally swapped between writing modes',
      points: [
        'An element with <code>inline-size: 300px; block-size: 100px;</code> under <code>writing-mode: horizontal-tb</code> renders at exactly 300×100.',
        'The IDENTICAL <code>inline-size: 300px; block-size: 100px;</code> declaration under <code>writing-mode: vertical-rl</code> instead renders at 100×300 — width and height have completely swapped, confirming inline-size truly tracks the writing-mode-relative axis, not a fixed physical dimension.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>inline-size maps to width or height depending on writing mode</title>
    <style>
      #horizBox { writing-mode: horizontal-tb; inline-size: 300px; block-size: 100px; background: crimson; }
      #vertBox  { writing-mode: vertical-rl;   inline-size: 300px; block-size: 100px; background: royalblue; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="horizBox"></div>
    <div id="vertBox"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const horizBox = document.querySelector<HTMLElement>('#horizBox')!;
const vertBox = document.querySelector<HTMLElement>('#vertBox')!;

const horizRect = horizBox.getBoundingClientRect();
const vertRect = vertBox.getBoundingClientRect();

console.log('horizontal-tb -- rendered width x height:', horizRect.width, 'x', horizRect.height);
console.log('vertical-rl   -- rendered width x height:', vertRect.width, 'x', vertRect.height);
console.log('the identical inline-size/block-size pair produced a fully swapped box:',
  horizRect.width === vertRect.height && horizRect.height === vertRect.width);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A component library ships a Japanese vertical-text mode using <code>writing-mode: vertical-rl</code>. A card inside it declares <code>inline-size: 300px;</code>, expecting it to control the card\'s width as it does everywhere else in the app. What actually happens?',
    hint: 'Ask which physical dimension the inline axis maps to once writing-mode switches away from the default horizontal-tb.',
    solution: 'The 300px constrains the card\'s HEIGHT, not its width, since the inline axis runs vertically in vertical-rl. This is the entire point of logical sizing properties — they track the actual content flow axis — but it does mean a component author must think in terms of "the dimension text flows along" rather than assuming inline-size always means width.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'inline-size is essentially just a synonym for width that also happens to support RTL languages, similar to how margin-inline-start relates to margin-left.',
      reality: 'inline-size tracks the writing-mode axis, not the direction axis — a fundamentally different mechanism. It can map to height, not just mirror between left/right like the inline-start/end properties do.'
    },
    {
      thought: 'Since RTL languages (Arabic, Hebrew) are the main use case for logical properties, writing-mode: vertical-rl is a rare edge case not worth designing for.',
      reality: 'Vertical writing modes are actively used for Japanese and Chinese typography, and any component library aiming for genuine internationalization support needs its logical-property-based layout to correctly handle both the direction axis (RTL/LTR) and the writing-mode axis (horizontal/vertical) independently.'
    },
    {
      thought: 'block-size and inline-size only matter for setting explicit dimensions — properties like max-width/min-height don\'t have this same axis-swapping behavior.',
      reality: 'The same mapping applies to max-inline-size, min-inline-size, max-block-size, and min-block-size — every sizing property with a logical form follows the identical writing-mode-relative axis assignment.'
    }
  ];
}
