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
  templateUrl: './event-delegation-catches-dynamically-added-elements.html',
  styleUrl: './event-delegation-catches-dynamically-added-elements.scss'
})
export class EventDelegationCatchesDynamicallyAddedElementsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Per-element listeners are attached to specific DOM nodes — nodes added later were never there to attach to',
      points: [
        'The main page frames event delegation mainly as a memory/performance win (one listener instead of N) — but there is an equally important CORRECTNESS property: a per-element listener setup only ever attaches to the elements that existed at the moment it ran.',
        'Any element added to the list AFTER that setup code ran has NO click listener at all, unless the setup code is re-run for it — a common, easy-to-miss source of "the click handler stopped working" bugs after dynamically adding new items.',
      ]
    },
    {
      heading: 'A delegated listener on the parent keeps working for content added at any time afterward — confirmed directly, not assumed',
      points: [
        'Confirmed directly: attaching per-element listeners to a list with one item, THEN adding a second item afterward, and clicking both — only the FIRST item\'s click was ever counted. The second item, added after listener setup, was silently unclickable.',
        'The identical setup using event delegation (one listener on the parent <code>&lt;ul&gt;</code>, checking <code>e.target</code>) counted BOTH clicks correctly — including the item added after the delegated listener was attached, since delegation relies on event bubbling reaching the parent, not on each child having its own listener.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>event delegation catches dynamically added elements</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <ul id="perElementList"></ul>
    <ul id="delegatedList"></ul>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Approach A: per-element listeners, attached BEFORE a second item is added
const perElementList = document.querySelector<HTMLUListElement>('#perElementList')!;
let perElementClicks = 0;

const item1 = document.createElement('li');
item1.textContent = 'Item 1 (present when listeners were attached)';
perElementList.appendChild(item1);

// Attach a listener to every CURRENT list item
perElementList.querySelectorAll('li').forEach((li) => {
  li.addEventListener('click', () => { perElementClicks++; });
});

// Now add a SECOND item, AFTER the per-element setup already ran
const item2 = document.createElement('li');
item2.textContent = 'Item 2 (added AFTER listener setup)';
perElementList.appendChild(item2);

(item1 as HTMLElement).click();
(item2 as HTMLElement).click(); // this one was never given a listener

console.log('per-element listeners: clicks counted =', perElementClicks, '(expected 1 — item 2 was missed)');

// Approach B: ONE delegated listener on the parent, attached ONCE
const delegatedList = document.querySelector<HTMLUListElement>('#delegatedList')!;
let delegatedClicks = 0;

delegatedList.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).tagName === 'LI') delegatedClicks++;
});

const item3 = document.createElement('li');
item3.textContent = 'Item 1';
delegatedList.appendChild(item3);

// Add a second item AFTER the delegated listener was attached
const item4 = document.createElement('li');
item4.textContent = 'Item 2 (added AFTER delegation was set up)';
delegatedList.appendChild(item4);

(item3 as HTMLElement).click();
(item4 as HTMLElement).click(); // delegation still catches this via bubbling

console.log('event delegation: clicks counted =', delegatedClicks, '(expected 2 — both items were caught)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A shopping cart list attaches a "remove" click handler to each item via item.addEventListener(\'click\', removeItem) inside the render function. Users report that after adding a new item to the cart (without a full page reload), the new item\'s remove button does nothing on the first click, but works after a second click. What is actually happening on that first click?',
    hint: 'Ask whether the per-element listener attachment code re-runs for the newly added item, or only ran once for the items that existed at initial render.',
    solution: 'The first click genuinely does nothing because the newly added item never had a listener attached to it — confirmed directly in this subtopic\'s demo, where an item added after per-element listener setup was silently unclickable. The "works on the second click" is almost certainly a red herring or a side effect of some OTHER re-render cycle re-running the listener-attachment code and finally catching the new item — not the click itself succeeding. The reliable fix is switching to event delegation: one listener on the cart\'s parent container, checking which item was clicked via event.target — confirmed in this subtopic\'s demo to correctly catch clicks on items added at any time, with no re-attachment needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Event delegation is purely a memory/performance optimisation (fewer listener objects) — for a small list, per-element listeners work exactly the same functionally, just with slightly more overhead.',
      reality: 'There is a genuine functional/correctness difference, not just an efficiency one — this subtopic\'s demo shows a per-element setup silently missing a dynamically-added item\'s clicks entirely, a real bug, not just wasted memory.'
    },
    {
      thought: 'As long as the per-element listener-attachment code is called again after adding new items, per-element listeners work exactly as reliably as delegation.',
      reality: 'That is true in principle, but it requires REMEMBERING to re-run the attachment code every single time new elements are added — a maintenance burden that delegation eliminates entirely, since the parent listener never needs to know about individual child additions at all.'
    },
    {
      thought: 'Event delegation only works for simple flat lists — deeply nested or more complex DOM structures need per-element listeners for reliable click handling.',
      reality: 'Delegation works for any depth of nesting as long as the event bubbles to the delegated parent (most events do, by default) — checking event.target (or event.target.closest(selector) for nested markup inside each item) handles arbitrarily complex item structures without any per-element attachment at all.'
    }
  ];
}
