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
  templateUrl: './border-radius-50pct-is-an-ellipse-not-a-circle.html',
  styleUrl: './border-radius-50pct-is-an-ellipse-not-a-circle.scss'
})
export class BorderRadius50pctIsAnEllipseNotACircleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'border-radius: 50% produces a perfect circle only on a square element — on any other aspect ratio it produces an ellipse',
      points: [
        'Percentage border-radius values resolve independently against the element\'s own width and height — the horizontal corner radius is 50% of the width, the vertical corner radius is 50% of the height.',
        'On a square element those two radii are equal, so all four corners meet as a true circle. On a rectangular element (say 200×100) the horizontal radius (100px) is twice the vertical radius (50px), producing an ellipse — a common surprise when trying to make a "circular" avatar or badge out of a non-square box.',
      ]
    },
    {
      heading: 'This is checkable without a container-shape API by testing which points near a corner actually fall inside the rendered shape',
      points: [
        'A point positioned the same absolute distance from a corner (e.g. 20px right, 15px down) can be INSIDE the visible shape on a square element but OUTSIDE it (clipped away) on a non-square element with the same border-radius: 50% — because the two elements\' corner curves have different horizontal-vs-vertical proportions.',
        'Reading <code>document.elementFromPoint(x, y)</code> at that coordinate reveals whether the element itself is still rendered there, or whether whatever sits behind it shows through instead — directly proving the corner curve\'s shape without needing to measure pixels visually.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>border-radius: 50% is an ellipse, not a circle</title>
    <style>
      #rect { width: 200px; height: 100px; border-radius: 50%; background: crimson; position: fixed; top: 200px; left: 50px; }
      #square { width: 100px; height: 100px; border-radius: 50%; background: royalblue; position: fixed; top: 340px; left: 50px; }
      #marker { width: 6px; height: 6px; background: yellow; position: fixed; z-index: 5; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="rect"></div>
    <div id="square"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function cornerHitTest(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  // A point 20px right, 15px down from the top-left corner of the box.
  const x = rect.left + 20;
  const y = rect.top + 15;
  return document.elementFromPoint(x, y) === el;
}

const rectEl = document.querySelector<HTMLElement>('#rect')!;
const squareEl = document.querySelector<HTMLElement>('#square')!;

const rectHit = cornerHitTest(rectEl);
const squareHit = cornerHitTest(squareEl);

console.log('200x100 rectangle, border-radius: 50% — same corner point still inside the shape:', rectHit);
console.log('100x100 square, border-radius: 50% — same corner point still inside the shape:', squareHit);
console.log('the two shapes clip that same relative point differently, proving the rectangle\\'s corner curve is an ellipse, not a circle:', rectHit !== squareHit);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A profile card has a 240×80 banner image with <code>border-radius: 50%;</code> applied, hoping for rounded pill-like ends. What shape actually renders?',
    hint: 'Ask whether the element\'s width and height are equal — 50% resolves against each dimension separately.',
    solution: 'Since 240 and 80 aren\'t equal, the horizontal radius (120px) and vertical radius (40px) differ — the result is an ellipse, not a clean rounded-pill or circle shape. Getting an actual pill shape instead requires a fixed, smaller radius like border-radius: 40px (half the height), not a 50% percentage.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'border-radius: 50% always produces a perfect circle, since 50% is the standard way to make a circular avatar.',
      reality: 'It only produces a circle when width and height are equal. On a rectangular element it produces an ellipse, since the horizontal and vertical corner radii resolve against width and height independently.'
    },
    {
      thought: 'A visibly "rounded" element with border-radius: 50% must be circular if I can\'t immediately tell the aspect ratio just by looking.',
      reality: 'The safest way to confirm a truly circular result is to check that width and height are explicitly equal (or use aspect-ratio: 1 alongside a fixed dimension) — the visual roundness of a corner alone doesn\'t confirm the overall shape is a circle rather than an ellipse.'
    },
    {
      thought: 'To get a rounded-pill shape (like a stadium button), the natural choice is border-radius: 50%, matching how it works for circular avatars.',
      reality: 'For a non-square element, 50% produces an ellipse, which looks wrong on a pill button (over-rounded, egg-shaped ends). A true pill shape needs a fixed radius equal to half the element\'s height (e.g. border-radius: 999px or a value matching height/2), not a percentage.'
    }
  ];
}
