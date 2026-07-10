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
  selector: 'app-static-vs-live-collection-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './static-nodelist-vs-live-htmlcollection.html',
  styleUrl: './static-nodelist-vs-live-htmlcollection.scss',
})
export class QuerySelectorAllIsStaticGetElementsByClassNameIsLiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Theory and Mistake #4, Proven by Mutating the DOM After Capture',
      points: [
        'The main page states: "<code>getElementById</code> is the fastest selector for known IDs. <code>getElementsByClassName</code>/<code>getElementsByTagName</code> return live HTMLCollections (update when DOM changes)" — directly contrasted with "NodeList from <code>querySelectorAll</code> is static — it does not update when the DOM changes." This subtopic captures both collection types BEFORE adding a new matching element to the DOM, then checks each collection\'s length AFTER — proving one grows and the other doesn\'t.',
        'A "static" collection is a SNAPSHOT taken at the moment the method was called — it reflects exactly what matched at that instant and never changes again, even if you later add, remove, or modify matching elements. A "live" collection, by contrast, is a continuously-updated VIEW into the document — every time you check its <code>.length</code> or index into it, it reflects the CURRENT state of the DOM, not the state when it was created.',
      ],
    },
    {
      heading: 'Which DOM Query Methods Are Static vs. Live — a Rule Worth Memorizing',
      points: [
        '<strong>Static (NodeList):</strong> <code>querySelectorAll()</code>. This is the one exception among the older DOM APIs — it deliberately returns a static snapshot rather than a live collection, which is part of why it needs an explicit conversion (<code>Array.from()</code> or spread) to get array methods, since a NodeList that never changes has less need for the live-updating behavior of a "collection."',
        '<strong>Live (HTMLCollection):</strong> <code>getElementsByClassName()</code>, <code>getElementsByTagName()</code>, and DOM properties like <code>element.children</code> and <code>form.elements</code> — all of these return HTMLCollections that stay continuously synced with the live document.',
        'This distinction has a genuinely dangerous practical consequence: iterating over a LIVE collection while simultaneously adding or removing matching elements inside the loop body can cause elements to be skipped or visited twice, or even create an infinite loop if the loop keeps adding more matching elements as it goes — a NodeList from <code>querySelectorAll</code> would never have this problem, since it never changes after being captured.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Static NodeList vs live HTMLCollection demo</title></head>
  <body>
    <div id="container">
      <p class="item">Item 1</p>
      <p class="item">Item 2</p>
    </div>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.getElementById('container')!;

console.log('--- Capturing both collection types BEFORE adding a new item ---');
const staticList = document.querySelectorAll('.item');            // NodeList -- static
const liveCollection = document.getElementsByClassName('item');   // HTMLCollection -- live

console.log('staticList.length right after capture:', staticList.length);
console.log('liveCollection.length right after capture:', liveCollection.length);

console.log('--- Adding a THIRD .item element to the DOM ---');
const newItem = document.createElement('p');
newItem.className = 'item';
newItem.textContent = 'Item 3 (added later)';
container.append(newItem);

console.log('--- Checking BOTH collections again, without re-querying ---');
console.log('staticList.length AFTER adding item 3:', staticList.length, '<-- unchanged, still reflects the moment it was captured');
console.log('liveCollection.length AFTER adding item 3:', liveCollection.length, '<-- grew automatically, reflects the CURRENT DOM');

console.log('--- The danger: mutating the DOM while iterating a LIVE collection ---');
const dangerContainer = document.createElement('div');
document.body.append(dangerContainer);
for (let i = 0; i < 3; i++) {
  const el = document.createElement('span');
  el.className = 'danger-item';
  dangerContainer.append(el);
}
const dangerLive = dangerContainer.getElementsByClassName('danger-item');
let iterations = 0;
for (let i = 0; i < dangerLive.length && iterations < 10; i++) {
  iterations++;
  console.log('  iterating index', i, '-- live collection length is now', dangerLive.length);
  if (i === 0) {
    // Simulate accidentally adding a new matching element mid-loop
    const extra = document.createElement('span');
    extra.className = 'danger-item';
    dangerContainer.append(extra);
    console.log('  (added one more matching element mid-loop)');
  }
}
console.log('Loop ran', iterations, 'iterations for what started as 3 elements -- the live collection kept growing as we iterated it');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A third <code>.item</code> element is added to the DOM AFTER both <code>staticList</code> and <code>liveCollection</code> were captured, with neither variable being re-queried. Does either collection\'s <code>.length</code> reflect the new element?',
    hint: 'Ask what each method actually returns -- a fixed snapshot taken at query time, or a continuously-synced view into the live document -- and whether NOT re-running the query would matter for each.',
    solution: `Only liveCollection.length reflects the new element (it becomes 3);
staticList.length stays frozen at 2, exactly what matched at the
moment querySelectorAll() was originally called.

querySelectorAll() returns a NodeList that is a SNAPSHOT -- once
captured, it never changes again, no matter what happens to the DOM
afterward. Even though the new element genuinely matches the ".item"
selector, staticList has no ongoing connection to the document that
would let it notice.

getElementsByClassName(), by contrast, returns an HTMLCollection
that is a LIVE VIEW -- every time you access .length or index into
it, the browser re-evaluates which elements currently match, so it
always reflects the CURRENT DOM state, with zero need to re-run the
query.

The final "danger" scenario shows why this matters practically: a
for loop indexing into a live collection while ALSO adding new
matching elements inside the loop body sees the collection's length
keep growing as it iterates, running more iterations than the
original element count would suggest -- exactly the kind of subtle
bug (skipped elements, double-processing, or even runaway loops)
that a static NodeList from querySelectorAll would never produce,
since its length is fixed forever once captured.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'querySelectorAll() and getElementsByClassName() behave the same way once you\'ve captured their result in a variable — both reflect a fixed set of elements from the moment you queried.',
      reality: 'querySelectorAll() returns a static NodeList that never changes after capture, but getElementsByClassName() (and getElementsByTagName()) return a LIVE HTMLCollection that continuously re-evaluates and reflects the CURRENT DOM every time you access it.',
    },
    {
      thought: 'a "live" HTMLCollection only updates when you explicitly re-run the query method again — it doesn\'t automatically track changes to the DOM on its own.',
      reality: 'a live HTMLCollection updates automatically and continuously — you never need to re-run getElementsByClassName() again; the SAME collection reference you already hold reflects the current DOM state on every access, with no re-query needed at all.',
    },
    {
      thought: 'iterating over any DOM collection with a for loop while adding new matching elements to the DOM inside the loop body is always safe, since the loop\'s upper bound was fixed when the loop started.',
      reality: 'iterating a LIVE collection (from getElementsByClassName/getElementsByTagName/element.children) while adding matching elements mid-loop is genuinely dangerous — the collection\'s length keeps growing as you iterate, which can skip elements, process some twice, or run far more iterations than the original element count would suggest; a static NodeList from querySelectorAll never has this problem.',
    },
  ];
}
