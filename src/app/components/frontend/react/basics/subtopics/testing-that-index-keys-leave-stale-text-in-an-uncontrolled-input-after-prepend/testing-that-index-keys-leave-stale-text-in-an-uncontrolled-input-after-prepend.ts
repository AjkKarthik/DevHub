import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-index-keys-leave-stale-text-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-index-keys-leave-stale-text-in-an-uncontrolled-input-after-prepend.html',
  styleUrl: './testing-that-index-keys-leave-stale-text-in-an-uncontrolled-input-after-prepend.scss',
})
export class TestingThatIndexKeysLeaveStaleTextInAnUncontrolledInputAfterPrependSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page States the Consequence but Never Shows It Happen',
      points: [
        'Common Mistake #1 pairs a wrong version — <code>items.map((item, i) =&gt; &lt;Input key={i} defaultValue={item.value} /&gt;)</code> — with the explanation: "React incorrectly reuses the wrong DOM nodes, causing stale input values, lost focus, and animation glitches."',
        'The example uses <code>defaultValue</code>, meaning the <code>&lt;Input&gt;</code> is UNCONTROLLED — its live value lives in the DOM node itself, not in React state. This subtopic makes the exact failure visible: type into an uncontrolled input, prepend a new item to the array, and watch which DOM element ends up holding the typed text.',
      ],
    },
    {
      heading: 'Why an Uncontrolled Input Is Where This Bug Actually Bites',
      points: [
        'With <code>key={i}</code>, React identifies list items by POSITION, not by the data behind them. Prepending a new item shifts every existing item to <code>i+1</code> — but React still sees "the element at position 0," "the element at position 1," etc., and assumes those are the SAME elements as before, just with new props.',
        'For an uncontrolled input, React does not touch the DOM node\'s live value when it reuses it — <code>defaultValue</code> only sets the INITIAL value, and React does not re-apply it to an already-mounted node. So the DOM node at position 1 keeps whatever the user physically typed into it, even though React now considers that position to represent a completely different array item.',
        'The visible result: after prepending, the text you typed appears to have "moved" to the wrong row — attached to a different item\'s label than the one you were actually editing.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "index-key-stale-input-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start"
  }
}
`,
    },
    {
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html>
  <head><title>Index keys and stale input text</title></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
    },
    {
      path: 'src/index.js',
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
`,
    },
    {
      path: 'src/App.js',
      content: `import { useState } from 'react';

const initialItems = [
  { id: 1, label: 'Task A' },
  { id: 2, label: 'Task B' },
];

export default function App() {
  const [items, setItems] = useState(initialItems);
  let nextId = 3;

  function prepend() {
    setItems(prev => [{ id: nextId++, label: 'NEW Task' }, ...prev]);
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={prepend}>Prepend a new item</button>

      <h4>key={'{'}index{'}'} -- BAD, from the main page's own wrong example</h4>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <span style={{ display: 'inline-block', width: 80 }}>{item.label}</span>
          <input defaultValue={'text for ' + item.label} />
        </div>
      ))}

      <h4>key={'{'}item.id{'}'} -- GOOD, stable identity</h4>
      {items.map(item => (
        <div key={item.id} style={{ marginBottom: 6 }}>
          <span style={{ display: 'inline-block', width: 80 }}>{item.label}</span>
          <input defaultValue={'text for ' + item.label} />
        </div>
      ))}

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Type something distinctive into the FIRST input in each section
        (next to "Task A"), then click "Prepend a new item". Which
        input keeps your typed text attached to "Task A" after the new
        row appears?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type a distinctive value (like "MINE") into the first input in each section — the one next to "Task A". Then click "Prepend a new item". In each section, which row now shows "MINE"?',
    hint: 'Uncontrolled inputs keep their live DOM value when React reuses a node — key={index} makes React reuse the wrong node, key={item.id} makes React create a genuinely new node for the new row instead.',
    solution: `In the key={index} section: after prepending, "MINE" now appears
next to the NEW row's label, not "Task A" -- even though you typed it
into the input that was originally next to "Task A". The new item was
inserted at index 0, so the OLD index-0 DOM node (with your typed
text still inside it) got reassigned to render the new item's label,
while a freshly created blank input took over index 1 (now labeled
"Task A").

In the key={item.id} section: "MINE" stays correctly attached to
"Task A" after prepending, because React matches DOM nodes to items by
their stable id, not by position -- the new item gets a brand new
DOM node inserted at the top, and every existing node (and its live,
uncontrolled value) stays attached to the same item it always was.

This is exactly the "stale input values" the main page's Mistake #1
warns about, made concrete: the DOM correctly shows the label for the
new data item, but the input's raw, uncontrolled text content is
still whatever a completely different item's node happened to contain
before the array changed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "stale input values" the main page warns about mean React shows the WRONG label text — a straightforward rendering bug that would be obviously visible as mismatched text.',
      reality: 'the label text is actually correct (it comes from `item.label`, freshly rendered) — it is specifically the UNCONTROLLED input\'s live DOM value that stays behind, silently mismatched with the label sitting right next to it.',
    },
    {
      thought: 'this bug only matters for literal text inputs — checkboxes, focus state, and CSS animations are separate, unrelated concerns from the main page\'s single "stale input values, lost focus, animation glitches" sentence.',
      reality: 'all three symptoms share the exact same root cause: React reusing the wrong DOM node because `key={index}` gives it no way to tell "this is a different item" from "this is the same item with new props" — any state that lives in the DOM node itself (input value, focus, an in-progress CSS transition) can end up attached to the wrong item.',
    },
    {
      thought: 'switching from `key={index}` to `key={item.id}` is purely a best-practice recommendation with no visible functional difference for a simple list like this.',
      reality: 'this playground shows a directly observable behavior difference — the exact same user action (typing then prepending) produces a wrong result with `index` and a correct result with `item.id`, using nothing more exotic than a controlled two-item list.',
    },
  ];
}
