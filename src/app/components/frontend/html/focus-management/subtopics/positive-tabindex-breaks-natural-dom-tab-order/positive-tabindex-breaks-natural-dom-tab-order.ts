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
  templateUrl: './positive-tabindex-breaks-natural-dom-tab-order.html',
  styleUrl: './positive-tabindex-breaks-natural-dom-tab-order.scss'
})
export class PositiveTabindexBreaksNaturalDomTabOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The browser\'s actual tab-order algorithm is NOT simply "DOM order" — positive tabindex values jump the queue first',
      points: [
        'The spec-defined sequential focus navigation order is: every element with a POSITIVE <code>tabindex</code> first, sorted ascending by that number (ties broken by DOM order) — THEN every element with <code>tabindex="0"</code> or naturally-focusable elements with no tabindex at all, in plain DOM order.',
        'This means a single stray <code>tabindex="5"</code> deep in a page can pull an element all the way to the FRONT of the tab sequence, ahead of everything else — including elements that appear much earlier in the DOM.',
      ]
    },
    {
      heading: 'This two-tier ordering rule is directly computable from the DOM, without needing to simulate actual Tab key presses',
      points: [
        'Because the rule is a pure, deterministic sort — (positive tabindex ascending, then DOM order) followed by (zero/no tabindex, DOM order) — the resulting sequence can be reconstructed in JavaScript exactly as the browser would compute it internally.',
        'Comparing that computed order against the plain DOM order (a simple <code>querySelectorAll</code> traversal) is the clearest way to SEE how far a positive tabindex value can displace an element from where it visually/structurally sits.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Positive tabindex breaks tab order</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <button id="a">A (first in DOM)</button>
    <button id="b">B (second in DOM)</button>
    <button id="c" tabindex="1">C (third in DOM, tabindex=1)</button>
    <button id="d">D (fourth in DOM)</button>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));

console.log('DOM order:', buttons.map(b => b.id).join(', '));

// Reconstruct the spec's actual tab-order sort: positive tabindex
// first (ascending), then zero/none in DOM order.
function computeTabOrder(elements: HTMLButtonElement[]): string[] {
  const withPositive = elements
    .filter(el => el.tabIndex > 0)
    .sort((a, b) => a.tabIndex - b.tabIndex);
  const rest = elements.filter(el => el.tabIndex <= 0);
  return [...withPositive, ...rest].map(el => el.id);
}

console.log('actual tab order:', computeTabOrder(buttons).join(', '));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Four buttons appear in DOM order A, B, C, D. Only C has <code>tabindex="1"</code> (all others have no tabindex, meaning 0). What is the actual Tab-key traversal order?',
    hint: 'Positive tabindex elements form their OWN group that comes first in the sequence, sorted by their number — everything else follows afterward in plain DOM order.',
    solution: 'C, A, B, D — C jumps to the very front because it\'s the only element with a positive tabindex, regardless of its DOM position. A, B, and D then follow in their normal DOM order, since none of them has a positive tabindex to compete with.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Tab-key navigation always follows an element\'s DOM position — an element earlier in the HTML is always focused earlier via Tab.',
      reality: 'That\'s only true among elements that DON\'T have a positive tabindex. Any element with <code>tabindex="1"</code> or higher jumps ahead of the entire DOM-order group, regardless of where it physically sits in the markup.'
    },
    {
      thought: 'A higher tabindex number means "focus this later" — like a priority queue where bigger numbers go last.',
      reality: 'It\'s the opposite direction from most priority systems: positive values are sorted ASCENDING, so <code>tabindex="1"</code> comes before <code>tabindex="2"</code>, and both come before every zero/no-tabindex element, no matter how many of those there are.'
    },
    {
      thought: 'Using positive tabindex values is a normal, low-risk way to fine-tune tab order on a page.',
      reality: 'It\'s a well-documented anti-pattern precisely because of this jump-the-queue behavior — a single positive tabindex added later, by anyone, silently reorders the ENTIRE page\'s tab sequence around it. The recommended approach is always <code>tabindex="0"</code> (join natural order) or reordering the actual DOM/CSS instead.'
    }
  ];
}
