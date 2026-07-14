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
  templateUrl: './hover-only-transition-snaps-back-instead-of-reversing.html',
  styleUrl: './hover-only-transition-snaps-back-instead-of-reversing.scss'
})
export class HoverOnlyTransitionSnapsBackInsteadOfReversingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A transition declared only inside the :hover rule animates going IN, but snaps instantly going OUT — because the base state has no transition property to drive the reverse',
      points: [
        'When <code>transition</code> lives only on <code>.card:hover</code>, hovering IN triggers a genuine transition (the base rule has no transition, but the hover rule being APPLIED does — and that\'s enough to animate toward it).',
        'Hovering back OUT reverts the element to the base rule\'s styles, which never declared a <code>transition</code> at all — so there is nothing telling the browser to animate the change, and the color/transform/etc. snaps back instantly.',
      ]
    },
    {
      heading: 'This is directly checkable: a real CSSTransition object exists on hover-out only when the transition was declared on the base rule, not when it lived only inside :hover',
      points: [
        'For an element with <code>transition</code> on its BASE class, removing the hover state and checking <code>element.getAnimations()</code> shortly after returns an active <code>CSSTransition</code> object — proof the reverse direction is genuinely animating.',
        'For an element with <code>transition</code> declared only inside its <code>.is-hovered</code> rule, the exact same check after removing that class returns an EMPTY array — no transition object was ever created for the reverse change, and the computed style already shows the final value almost immediately.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>hover-only transition snaps back instead of reversing</title>
    <style>
      .base-hover { width: 80px; height: 80px; background: rgb(0,0,255); transition: background 0.3s linear; }
      .base-hover.is-hovered { background: rgb(128,0,128); }

      .hover-only { width: 80px; height: 80px; background: rgb(0,0,255); }
      .hover-only.is-hovered { background: rgb(128,0,128); transition: background 0.3s linear; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="baseHover" class="base-hover"></div>
    <div id="hoverOnly" class="hover-only"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function testReverseTransition(id: string) {
  const el = document.querySelector<HTMLElement>('#' + id)!;
  el.classList.add('is-hovered');

  setTimeout(() => {
    el.classList.remove('is-hovered'); // simulate mouse leaving

    setTimeout(() => {
      const reverseAnims = el.getAnimations();
      const bg = getComputedStyle(el).backgroundColor;
      console.log(\`\${id} — active transitions on reverse (hover-out):\`, reverseAnims.length);
      console.log(\`\${id} — background 20ms after hover-out:\`, bg, '(already fully blue = snapped instantly)');
    }, 20);
  }, 20);
}

testReverseTransition('baseHover');
testReverseTransition('hoverOnly');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A button\'s CSS is: <code>.btn:hover { background: purple; transition: background 0.3s; }</code> — no transition on the base <code>.btn</code> rule. What happens visually when the mouse leaves the button?',
    hint: 'Ask which rule is actually active (and therefore which transition declaration applies) at the moment the mouse leaves.',
    solution: 'Hovering in animates smoothly (the hover rule\'s transition applies while it\'s active). But hovering out reverts to the base .btn rule, which has no transition property at all — the background snaps back to its original color instantly, with no animation. Fix it by moving transition onto the base .btn rule instead.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since :hover { transition: ... } makes hovering in animate smoothly, the reverse (hovering out) should animate the same way automatically.',
      reality: 'The transition declaration only exists on the :hover rule. The moment :hover stops applying, the element falls back to the base rule\'s styles — and if that rule never declared a transition, the reverse change has nothing to animate it, so it snaps instantly.'
    },
    {
      thought: 'CSS transitions are a property of the ELEMENT — once one starts, the reverse direction naturally uses the same transition.',
      reality: 'A transition is only created when the property that CHANGES has an active transition declaration on the rule that\'s newly in effect. Hover-in and hover-out are two separate style changes, each independently checked against whichever CSS rule currently applies.'
    },
    {
      thought: 'This only matters for simple demos — in real components, forgetting to put transition on the base rule is rare and easy to avoid.',
      reality: 'It\'s one of the most common real transition bugs — a component that "animates in but jerks out" almost always has the transition declared only in the active/hover/open state, not the base rule. This is directly listed as one of the main page\'s own five common mistakes.'
    }
  ];
}
