import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-missing-key-breaks-exit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './missing-key-breaks-exit-for-list-items.html',
  styleUrl: './missing-key-breaks-exit-for-list-items.scss',
})
export class MissingKeyBreaksExitForListItemsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #2 Says "Cannot Detect Removals" — But What Does That Look Like?',
      points: [
        'Mistake #2\'s explanation states: "AnimatePresence tracks which children are removed by their key. Without keys, it cannot detect removals and exit animations never play." This is stated as an absolute (exit animations "never play"), but the main page never shows what actually happens INSTEAD — does the item just vanish instantly? Does the wrong item animate out?',
        'This subtopic builds a real removable list, side by side with and without a stable <code>key={item.id}</code>, and removes items from the MIDDLE of each list to observe the actual, concrete difference in behavior.',
      ],
    },
    {
      heading: 'Why AnimatePresence Needs Keys Specifically (Not Just React)',
      points: [
        'Ordinary React already uses keys to match list items across renders — this is standard reconciliation, independent of Framer Motion. AnimatePresence adds a SECOND layer on top: it needs keys to detect when an item has been REMOVED from the array entirely (not just reordered), so it can hold that specific element in the DOM long enough to play its exit animation before actually removing it.',
        'Without a stable key (or with the array index used as a fallback key, which shifts every time an earlier item is removed), AnimatePresence cannot reliably tell "this specific item is gone" from "the list just re-rendered with different props at the same position" — so it has no removed element to animate, and the DOM node backing the actually-deleted item is simply removed by React\'s normal reconciliation, with no exit animation intercepting it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "framer-motion-key-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "framer-motion": "^11.0.0"
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
  <head><title>AnimatePresence key demo</title></head>
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
      content: `import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const INITIAL = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
];

// WRONG: no key at all on the motion.li.
function NoKeyList() {
  const [items, setItems] = useState(INITIAL);
  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
      <h3>No key on motion.li</h3>
      <AnimatePresence>
        {items.map(item => (
          <motion.li
            style={{ listStyle: 'none', background: '#f0f9ff', padding: 8, marginBottom: 4 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 40 }}
          >
            {item.name}
            <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
              style={{ marginLeft: 8 }}>Remove</button>
          </motion.li>
        ))}
      </AnimatePresence>
    </div>
  );
}

// CORRECT: stable key={item.id} on the motion.li.
function StableKeyList() {
  const [items, setItems] = useState(INITIAL);
  return (
    <div style={{ border: '1px solid #ccc', padding: 12 }}>
      <h3>key={'{item.id}'}</h3>
      <AnimatePresence>
        {items.map(item => (
          <motion.li
            key={item.id}
            style={{ listStyle: 'none', background: '#f0f9ff', padding: 8, marginBottom: 4 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 40 }}
          >
            {item.name}
            <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
              style={{ marginLeft: 8 }}>Remove</button>
          </motion.li>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>Click "Remove" on the MIDDLE item ("Banana") in both lists. Watch what actually animates.</p>
      <NoKeyList />
      <StableKeyList />
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Remove" on the middle item ("Banana") in both lists. What does each list actually do — does an exit animation play, and does the correct item disappear?',
    hint: 'Without a key, React can\'t tell which specific DOM node corresponds to the removed array item — ask what it does instead when the array shrinks.',
    solution: `In the "No key" list, clicking Remove on Banana makes the LAST item
("Cherry") disappear instantly, with no exit animation -- while
"Banana" and "Apple" remain, with Banana now showing in the position
that used to be Apple's. Without a key, React matches elements by
POSITION, not identity -- so removing Banana from the middle of the
array shifts every element AFTER it up by one position. React sees
position 0 = Apple (unchanged), position 1 = "new" content (which is
actually Cherry's text now occupying Banana's old position, so it
looks like Banana instantly became Cherry-ish text with no
animation), and position 2 is simply gone -- AnimatePresence has no
identity information to know it was actually Banana that the user
asked to remove, so no exit animation targets the right conceptual
item.

In the "key={item.id}" list, clicking Remove on Banana correctly
plays Banana's own exit animation (fading and sliding right) while
Apple and Cherry remain completely undisturbed in their own
positions -- because AnimatePresence can now correctly identify
"the item with key=2 is the one that's gone," hold IT specifically
in the DOM for its exit animation, and leave the other two items'
own DOM nodes and matched identities alone.

This confirms the deeper mechanism behind Mistake #2's claim: the
symptom isn't simply "no animation plays" in isolation -- it's that
positional matching (React's fallback without keys) misattributes
which conceptual item was removed, producing a visibly wrong result
that looks like a totally different bug (wrong item vanishing) if
you didn't already know to look for a missing key.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'without a key, AnimatePresence simply skips the exit animation but otherwise removes the correct item — the only downside is losing the visual polish.',
      reality: 'without a key, React matches list items by POSITION, not identity — removing a middle item shifts the array, and the resulting instant (non-animated) removal happens to the LAST item, not the one actually removed, misattributing which item disappeared.',
    },
    {
      thought: 'using the array index as the key (key={index}) is functionally the same as no key at all for AnimatePresence purposes.',
      reality: 'index keys have the exact same positional-matching problem as no key at all — the index of every item after a removed one changes, so AnimatePresence still can\'t correctly identify which specific item was removed.',
    },
    {
      thought: 'this bug only matters cosmetically — the underlying data (state) is still correct even if the exit animation targets the wrong visual element.',
      reality: 'the underlying React state IS correct (the right item is removed from the array) — but the user-visible consequence, an unrelated item appearing to vanish or change, is a genuine, confusing UX bug, not just a missing animation.',
    },
  ];
}
