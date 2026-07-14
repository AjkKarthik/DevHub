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
  templateUrl: './transform-creates-a-stacking-context-trapping-negative-z-index-children.html',
  styleUrl: './transform-creates-a-stacking-context-trapping-negative-z-index-children.scss'
})
export class TransformCreatesAStackingContextTrappingNegativeZIndexChildrenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A child with z-index: -1, intended to sit BEHIND its parent, cannot escape a transformed parent — it stays trapped in front, because the parent\'s transform created a brand new stacking context',
      points: [
        'Any element with a <code>transform</code> value other than <code>none</code> creates a new stacking context — the same category of effect as <code>position</code> combined with a <code>z-index</code>, but triggered purely by the presence of a transform.',
        'Once a parent is a stacking context, EVERY z-index value on its descendants is only ever compared against OTHER descendants within that same context — a child can never use z-index to escape and compete against its own ancestor\'s stacking level.',
      ]
    },
    {
      heading: 'This is directly measurable via document.elementFromPoint() — a z-index: -1 child of a transformed parent still paints IN FRONT of that parent, confirmed by hit-testing the overlapping region',
      points: [
        'A parent has a background color and a child with <code>z-index: -1</code> covering it entirely — the intent (in ordinary, non-transformed CSS) would be for the parent\'s own background to paint OVER the negative-z-index child, hiding it.',
        'Once the parent also has ANY transform (even a no-op like <code>translateZ(0)</code>), <code>document.elementFromPoint()</code> at the overlapping coordinates reports the CHILD as the topmost element — not the parent — proving the child never actually went behind it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>transform creates a stacking context</title>
    <style>
      #parentNoTransform {
        position: relative; width: 150px; height: 100px; background: gold;
      }
      #childOfNoTransform {
        position: absolute; inset: 0; background: purple; z-index: -1;
      }

      #parentWithTransform {
        position: relative; width: 150px; height: 100px; background: gold;
        transform: translateZ(0); /* creates a stacking context, even though visually a no-op */
      }
      #childOfTransformed {
        position: absolute; inset: 0; background: purple; z-index: -1;
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="parentNoTransform">
      <div id="childOfNoTransform"></div>
    </div>
    <div id="parentWithTransform">
      <div id="childOfTransformed"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function checkTopElement(parentId: string, childId: string) {
  const parent = document.querySelector<HTMLElement>('#' + parentId)!;
  const rect = parent.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const topElement = document.elementFromPoint(centerX, centerY);
  const child = document.querySelector('#' + childId);
  return { topIsParent: topElement === parent, topIsChild: topElement === child };
}

const withoutTransform = checkTopElement('parentNoTransform', 'childOfNoTransform');
console.log('non-transformed parent -- z-index:-1 child correctly goes behind it:', withoutTransform.topIsParent);

const withTransform = checkTopElement('parentWithTransform', 'childOfTransformed');
console.log('transformed parent -- the SAME z-index:-1 child is now trapped IN FRONT of it:', withTransform.topIsChild);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A decorative background shape inside a card uses <code>position: absolute; z-index: -1;</code> intending to sit behind the card\'s own background. The card also has <code>transform: translateY(-4px)</code> for a hover-lift effect. Does the shape stay hidden behind the card background?',
    hint: 'Ask whether the card\'s own transform (however subtle) creates a new stacking context that traps the shape\'s z-index inside it.',
    solution: 'No — since the card has ANY transform value (even a small translateY), it becomes a stacking context, and the shape\'s z-index: -1 can only be compared against other elements inside that same context. The shape stays trapped in front of the card\'s own background, visible when it was meant to be hidden. The fix is either removing the transform from the element that needs to stay a normal stacking participant, or restructuring so the negative-z-index element is a sibling outside the transformed wrapper instead of a descendant.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'z-index: -1 always means "behind everything else on the page, or at least behind its own parent" — a universal, absolute positioning rule.',
      reality: 'z-index only compares elements within the SAME stacking context. A transformed ancestor creates a new stacking context that CONTAINS the negative z-index child, meaning the child can never escape to compete against that ancestor itself — it can only ever be behind other things WITHIN the ancestor\'s own context.'
    },
    {
      thought: 'Only position + z-index create stacking contexts — a plain transform (with no explicit z-index or position change) shouldn\'t have any effect on stacking behavior.',
      reality: 'transform alone (with any value other than none) is independently sufficient to create a new stacking context — no z-index or position property needs to be set on the transformed element at all for this effect to occur.'
    },
    {
      thought: 'This bug would be immediately obvious and easy to diagnose, since z-index issues are a well-known, commonly-searched CSS topic.',
      reality: 'It is genuinely one of the more confusing z-index bugs specifically because the culprit property (transform) doesn\'t look related to stacking at all — a developer debugging "why is my z-index:-1 element still visible" often checks position and z-index values everywhere except the seemingly unrelated transform declaration on an ancestor.'
    }
  ];
}
