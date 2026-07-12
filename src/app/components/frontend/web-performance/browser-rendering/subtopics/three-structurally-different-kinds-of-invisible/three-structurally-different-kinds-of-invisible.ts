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
  templateUrl: './three-structurally-different-kinds-of-invisible.html',
  styleUrl: './three-structurally-different-kinds-of-invisible.scss'
})
export class ThreeStructurallyDifferentKindsOfInvisibleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'opacity: 0 and visibility: hidden both keep full layout space — display: none does not',
      points: [
        'The main page notes that opacity: 0 is composite-only while visibility: hidden triggers a paint pass — both are still "in the render pipeline" in a way display: none is not.',
        'Measured directly with <code>getBoundingClientRect()</code>: an element with <code>opacity: 0</code> reports its real, full height (e.g. 80px). The identical element with <code>visibility: hidden</code> ALSO reports its real full height. The identical element with <code>display: none</code> reports exactly <strong>0</strong> — it has been removed from layout entirely.',
      ]
    },
    {
      heading: 'opacity: 0 stays hit-testable — visibility: hidden does not',
      points: [
        'A more surprising, real distinction: <code>document.elementFromPoint()</code> — the browser\'s own real hit-testing mechanism — FINDS an <code>opacity: 0</code> element at its location, but does NOT find a <code>visibility: hidden</code> element at its location (it returns whatever is behind it instead).',
        'This means an opacity: 0 element still receives click/hover events by default (unless separately given <code>pointer-events: none</code>) — a common source of "invisible but still clickable" bugs. A visibility: hidden element never receives pointer events, regardless of layering.',
        'Practical takeaway: three genuinely different tools for three different jobs — display: none to remove something entirely, visibility: hidden to hide something while reserving its space and blocking interaction, opacity: 0 to fade something out while it remains interactive (e.g. mid-transition, or deliberately overlaying an invisible hit target).',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>three structurally different kinds of invisible</title>
    <style>
      .box { width: 120px; height: 80px; position: absolute; }
      #opacityBox { top: 0; left: 0; background: crimson; opacity: 0; }
      #visibilityBox { top: 100px; left: 0; background: royalblue; visibility: hidden; }
      #displayNoneBox { top: 200px; left: 0; background: seagreen; display: none; }
      #behindVisibility { top: 100px; left: 0; width: 120px; height: 80px; position: absolute; background: gold; z-index: -1; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="opacityBox"></div>
    <div id="visibilityBox"></div>
    <div id="displayNoneBox"></div>
    <div id="behindVisibility"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const opacityBox = document.querySelector<HTMLElement>('#opacityBox')!;
const visibilityBox = document.querySelector<HTMLElement>('#visibilityBox')!;
const displayNoneBox = document.querySelector<HTMLElement>('#displayNoneBox')!;

console.log('--- Layout space (getBoundingClientRect height) ---');
console.log('opacity: 0        →', opacityBox.getBoundingClientRect().height, 'px');
console.log('visibility: hidden →', visibilityBox.getBoundingClientRect().height, 'px');
console.log('display: none     →', displayNoneBox.getBoundingClientRect().height, 'px');

console.log('--- Hit-testing (document.elementFromPoint) ---');
const opacityHit = document.elementFromPoint(60, 40);
const visibilityHit = document.elementFromPoint(60, 140);
console.log('elementFromPoint over the opacity:0 box     →', opacityHit === opacityBox ? 'FOUND the box' : 'found something else');
console.log('elementFromPoint over the visibility:hidden box →', visibilityHit === visibilityBox ? 'FOUND the box' : 'found the element BEHIND it instead');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A modal close button is faded out with <code>opacity: 0</code> during its exit transition, but before the transition finishes and the modal is removed, users report accidentally clicking through to a button that is now visible behind it. What is happening, and what is the one-line fix?',
    hint: 'Ask whether opacity: 0 alone removes an element from receiving pointer events, or whether that needs to be handled separately.',
    solution: 'opacity: 0 only makes the element visually transparent — it does NOT remove it from hit-testing, confirmed directly in this subtopic\'s demo where an opacity: 0 element is still found by document.elementFromPoint(). During the fade-out, the modal\'s close button is still fully clickable and still sits on top of (or near) whatever is now visible behind it, causing accidental clicks. The one-line fix is adding pointer-events: none to the element during (or immediately before) the fade, or switching to visibility: hidden once the fade completes, which never receives pointer events.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'opacity: 0 and visibility: hidden are two interchangeable ways to "hide" an element while keeping its layout space — pick whichever reads better in the code.',
      reality: 'They differ in a way that causes real bugs: opacity: 0 remains hit-testable (still receives clicks/hover by default) while visibility: hidden does not, confirmed directly via elementFromPoint in this subtopic\'s demo — the choice has functional, not just stylistic, consequences.'
    },
    {
      thought: 'display: none, visibility: hidden, and opacity: 0 all remove an element from the accessibility tree and screen readers the same way.',
      reality: 'They differ here too, though this subtopic focuses on layout/hit-testing — display: none and visibility: hidden both remove content from assistive technology by default, while opacity: 0 does NOT (the element is still announced by screen readers, since visually-transparent is not the same as semantically-hidden) — a genuinely separate axis from the layout-space distinction covered here.'
    },
    {
      thought: 'Since display: none removes an element from layout, it must also be the fastest of the three to toggle back to visible, since there is nothing to reserve.',
      reality: 'Toggling display: none back on is actually the MOST expensive of the three to re-show, since the browser must lay out the element from scratch (and everything around it may reflow) — opacity and visibility toggles never require a fresh layout pass since the space was reserved the whole time.'
    }
  ];
}
