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
  templateUrl: './filter-creates-a-stacking-context-trapping-negative-z-index-children.html',
  styleUrl: './filter-creates-a-stacking-context-trapping-negative-z-index-children.scss'
})
export class FilterCreatesAStackingContextTrappingNegativeZIndexChildrenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Just like transform, ANY filter value other than none creates a new stacking context — trapping a z-index: -1 child in front of its own parent',
      points: [
        'A completely visually inert filter — <code>filter: brightness(1)</code>, which changes nothing about how the element actually looks — is still enough to trigger this side effect, because the STACKING CONTEXT creation is tied to the presence of the <code>filter</code> property being set to anything other than <code>none</code>, not to whether it visibly changes anything.',
        'Once the parent is its own stacking context, a child\'s <code>z-index: -1</code> can only ever be compared against OTHER elements inside that same context — it can never escape to compete against the parent itself, exactly like the same effect from <code>transform</code>.',
      ]
    },
    {
      heading: 'This is directly measurable via document.elementFromPoint() — the identical z-index: -1 child correctly goes behind a plain parent, but stays trapped in front of one with even a no-op filter',
      points: [
        'Two structurally identical parent/child pairs are compared: one parent has no <code>filter</code> at all, the other has <code>filter: brightness(1)</code> (a value that changes nothing visually).',
        'Hit-testing the overlapping center point with <code>document.elementFromPoint()</code> reports the PARENT as topmost for the filter-less case (the child correctly went behind), but reports the CHILD as topmost for the filtered case — confirming the filter alone, regardless of its visual effect, caused the trap.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>filter creates a stacking context, trapping negative z-index children</title>
    <style>
      .wrapper { position: fixed; top: 20px; left: 20px; z-index: 9999; }
      .parent { position: relative; width: 100px; height: 100px; background: gold; margin-bottom: 20px; }
      .child { position: absolute; inset: 0; background: purple; z-index: -1; }
      #parentWithFilter { filter: brightness(1); } /* a visually inert filter -- changes nothing */
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="wrapper">
      <div class="parent" id="parentNoFilter"><div class="child" id="childNoFilter"></div></div>
      <div class="parent" id="parentWithFilter"><div class="child" id="childWithFilter"></div></div>
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

const noFilterResult = checkTopElement('parentNoFilter', 'childNoFilter');
console.log('no filter -- z-index:-1 child correctly goes behind the parent:', noFilterResult.topIsParent);

const withFilterResult = checkTopElement('parentWithFilter', 'childWithFilter');
console.log('filter: brightness(1) (visually a no-op!) -- the SAME child is now trapped in front:', withFilterResult.topIsChild);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A card component has <code>filter: brightness(1);</code> left over from an earlier design iteration (it no longer changes the visual appearance at all, since brightness(1) means "unchanged"). The card also has a decorative shape positioned with <code>z-index: -1</code> meant to peek out from behind it. Does removing the now-useless brightness(1) declaration have any visible effect?',
    hint: 'Ask whether filter\'s stacking-context side effect depends on the filter actually changing anything visually.',
    solution: 'Yes, it can have a real visible effect — even though brightness(1) changes nothing about the card\'s own appearance, its mere presence still creates a stacking context that traps the z-index: -1 shape in front of the card. Removing the dead filter declaration would let the shape correctly move behind the card as originally intended. This is a genuinely surprising side effect of "harmless-looking leftover CSS."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'This stacking-context side effect is specific to transform — filter is a completely different property and shouldn\'t share the same quirk.',
      reality: 'filter, backdrop-filter, and transform (along with several other properties like opacity < 1 and will-change) all independently trigger the exact same stacking-context creation — it\'s a shared CSS mechanism, not something unique to any one property.'
    },
    {
      thought: 'A filter value that produces no visible change (like brightness(1) or blur(0)) should be treated by the browser as equivalent to having no filter at all, including for stacking-context purposes.',
      reality: 'The browser triggers this behavior purely from the PRESENCE of a filter value other than the literal keyword none — it does not evaluate whether that value happens to be a visual no-op. brightness(1) still counts as "having a filter" for stacking purposes.'
    },
    {
      thought: 'This kind of bug would be quickly caught, since a leftover filter: brightness(1) declaration is an obviously unusual, suspicious-looking piece of code to leave in a stylesheet.',
      reality: 'It is often introduced innocently — for example, a hover-state filter transition that sets the base state\'s filter value to a no-op default (so the transition has a defined starting point), which quietly triggers the same stacking-context trap on an element that never otherwise looked like it should be doing anything filter-related.'
    }
  ];
}
