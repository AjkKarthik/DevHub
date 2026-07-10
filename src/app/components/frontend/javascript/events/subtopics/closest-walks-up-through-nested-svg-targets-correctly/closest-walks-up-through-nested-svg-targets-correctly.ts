import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-closest-svg-delegation-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './closest-walks-up-through-nested-svg-targets-correctly.html',
  styleUrl: './closest-walks-up-through-nested-svg-targets-correctly.scss',
})
export class ClosestWalksUpThroughNestedSvgTargetsCorrectlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s QnA, Verified by Actually Clicking a Nested SVG Path',
      points: [
        'The main page\'s QnA poses exactly this scenario: a delegated click listener uses <code>e.target.closest(".item")</code> to find a list item, but the item contains an SVG icon built from nested <code>&lt;path&gt;</code> elements — does <code>closest()</code> still work when the click lands directly on a deeply nested <code>&lt;path&gt;</code>? The answer is "Yes" — this subtopic clicks an actual nested SVG path programmatically and confirms <code>closest()</code> still correctly resolves to the enclosing <code>.item</code>.',
        '<code>closest()</code> walks up the REAL DOM ancestor chain starting from wherever <code>e.target</code> actually is — it has no special-case logic for SVG, custom elements, or any other element type. Whatever landed the click, <code>closest()</code> just keeps checking "is this element (or its parent, or its parent\'s parent...) a match?" until it finds one or runs out of ancestors.',
      ],
    },
    {
      heading: 'The Real Gotcha: e.target Itself, Not closest()',
      points: [
        'The main page\'s answer specifically calls out where the actual surprise is: "SVG elements dispatch events with <code>e.target</code> set to the specific SVG child that was actually clicked (the <code>&lt;path&gt;</code>, not the outer <code>&lt;svg&gt;</code>)." A developer who assumes <code>e.target</code> will always be the <code>&lt;svg&gt;</code> element itself (treating it as one opaque unit, the way an <code>&lt;img&gt;</code> behaves) will be surprised to find <code>e.target</code> can be any of the SVG\'s own internal children.',
        'This is exactly why <code>closest()</code> — rather than a direct check like <code>e.target === iconElement</code> or <code>e.target.matches(".item")</code> — is the robust delegation pattern: it doesn\'t matter WHICH specific descendant node the click precisely landed on, since <code>closest()</code> walks upward from wherever that turns out to be, resolving correctly regardless.',
        'This generalizes beyond SVG: any deeply nested structure — a custom element\'s internal DOM, a canvas with layered child elements, deeply nested <code>&lt;span&gt;</code>s from syntax highlighting — behaves the same way. <code>e.target</code> is always whatever specific leaf-level element the click precisely hit, and <code>closest()</code> is what makes delegation resilient to that unpredictability.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>closest() with nested SVG targets demo</title></head>
  <body>
    <ul id="list">
      <li class="item" data-id="1">
        <svg id="icon" width="24" height="24" viewBox="0 0 24 24">
          <path id="path-a" d="M0 0 L12 0 L12 12 Z" fill="steelblue"></path>
          <path id="path-b" d="M12 12 L24 12 L24 24 Z" fill="tomato"></path>
        </svg>
        Item 1
      </li>
    </ul>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const list = document.getElementById('list')!;
const pathB = document.getElementById('path-b')!;

list.addEventListener('click', (e) => {
  const target = e.target as Element;
  console.log('e.target tag name:', target.tagName, '(id:', target.id + ')');

  const item = target.closest('.item');
  console.log('closest(".item") found:', item ? '.item with data-id=' + (item as HTMLElement).dataset.id : 'null -- NOT FOUND');
});

console.log('--- Dispatching a real click event directly on the nested <path id="path-b"> ---');
const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
pathB.dispatchEvent(clickEvent);

console.log('--- For comparison: what if e.target had been the outer <svg> instead? ---');
const svgIcon = document.getElementById('icon')!;
const clickOnSvg = new MouseEvent('click', { bubbles: true, cancelable: true });
svgIcon.dispatchEvent(clickOnSvg);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The click is dispatched directly on <code>&lt;path id="path-b"&gt;</code>, an element nested three levels inside <code>.item</code> (item → svg → path). What tag name does <code>e.target</code> report, and does <code>closest(".item")</code> still find the right element?',
    hint: 'Ask whether e.target reports the innermost element the click actually landed on, or some "rolled up" version like the outer <svg> -- then ask whether closest() cares which one it is, given how it walks the ancestor chain.',
    solution: `e.target.tagName reports "path" (the specific <path> element the
click was dispatched on) -- NOT "svg", even though visually and
semantically the SVG icon might feel like one atomic unit. This
confirms the main page's QnA point directly: SVG child elements are
real, individually-targetable nodes in the event system, just like
any HTML element.

Despite e.target being this deeply nested <path>, closest(".item")
still correctly finds the enclosing <li class="item"> -- logging
"closest('.item') found: .item with data-id=1". This is because
closest() walks up the REAL DOM ancestor chain starting from
whatever e.target happens to be (path → svg → li.item → ul), with
no special handling needed for the fact that two of those ancestors
are SVG elements rather than HTML elements.

The second dispatch (directly on the <svg> element itself) also
resolves correctly, for the same reason -- closest() doesn't care
where in the chain it starts, only that it walks upward correctly
from there.

The lesson: closest()-based delegation is robust regardless of how
deeply nested or what specific TYPE of element a click precisely
lands on -- the one thing worth remembering is that e.target itself
can be surprisingly granular (an inner <path>, not the outer <svg>
you might have expected), which is exactly why relying on closest()
rather than a direct e.target equality check is the safer pattern.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'clicking anywhere on an SVG icon reports e.target as the outer <svg> element itself, since the SVG is visually one cohesive icon.',
      reality: 'e.target reports whichever specific SVG child element (like a <path>, <circle>, or <rect>) the click actually landed on — SVG internals are real, individually-targetable DOM nodes in the event system, not one opaque unit.',
    },
    {
      thought: 'closest() needs special handling or won\'t work reliably when the click lands on an SVG element, since SVG uses a different namespace than regular HTML elements.',
      reality: 'closest() works identically regardless of element type or namespace — it walks the actual DOM ancestor chain from e.target upward, and SVG elements participate in that same ancestor chain exactly like HTML elements do.',
    },
    {
      thought: 'a robust delegation pattern should check e.target directly against the icon element (e.g. e.target === iconElement) rather than using closest(), to avoid confusion about which specific SVG child was clicked.',
      reality: 'a direct e.target equality check is actually the FRAGILE approach here — it would fail the moment the click landed on a different internal SVG child than expected; closest() is specifically robust to not knowing or caring which exact descendant node absorbed the click.',
    },
  ];
}
