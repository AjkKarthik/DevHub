import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-react-memo-alone-doesnt-stop-fresh-object-prop-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-react-memo-alone-doesnt-stop-a-fresh-object-prop-re-render.html',
  styleUrl: './testing-that-react-memo-alone-doesnt-stop-a-fresh-object-prop-re-render.scss',
})
export class TestingThatReactMemoAloneDoesntStopAFreshObjectPropReRenderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Fix Assumes memo Is Already in the Picture',
      points: [
        'Common Mistake #6 shows <code>&lt;Profile user={"{{"} id: 1, name: \'Alice\' {"}}"} /&gt;</code> creating "a new object reference every render" that "breaks React.memo on child" — and fixes it with <code>useMemo</code> so the reference stays stable.',
        'The mistake\'s title names <code>React.memo</code> directly, but the WRONG code snippet never actually shows <code>Profile</code> wrapped in <code>memo(...)</code>. This subtopic checks a natural follow-up question: if a component IS wrapped in <code>React.memo</code>, does that alone provide any protection against a freshly created object prop, or is <code>memo</code> completely powerless here without the <code>useMemo</code> fix?',
      ],
    },
    {
      heading: 'Why memo\'s Shallow Compare Can\'t See Through a New Object',
      points: [
        '<code>React.memo(Component)</code> wraps a component so that, before re-rendering it, React shallow-compares each new prop to the previous one using <code>Object.is</code> (roughly <code>===</code>). If every prop is referentially equal to last time, <code>memo</code> skips re-rendering the child entirely.',
        'An object literal written directly in JSX — <code>{"{"}{"{"} id: 1, name: \'Alice\' {"}"}{"}"}</code> — allocates a BRAND NEW object every time the parent renders, even if every field inside it holds the exact same values as last time. <code>Object.is(newObj, oldObj)</code> is <code>false</code> for two different object instances, regardless of their contents.',
        '<code>memo</code> has no mechanism to look INSIDE the object and compare field-by-field (that would require a custom comparison function, a second argument <code>memo</code> supports but the main page\'s fix doesn\'t use). Without <code>useMemo</code> stabilizing the reference upstream, <code>memo</code> sees "a different object" on every render and re-renders the child anyway — providing zero protection on its own for this specific case.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "memo-object-prop-demo",
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
  <head><title>React.memo and object-literal props</title></head>
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
      content: `import { useState, useMemo, memo, useRef } from 'react';

// Wrapped in React.memo -- per the main page's Mistake #6 title.
const Profile = memo(function Profile({ user }) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return (
    <p>
      Profile renders: {renderCount.current} (user: {user.name})
    </p>
  );
});

export default function App() {
  const [tick, setTick] = useState(0);

  // BAD -- the main page's own wrong example: a fresh object every render.
  const badUser = { id: 1, name: 'Alice' };

  // GOOD -- the main page's own fix: stable reference via useMemo.
  const goodUser = useMemo(() => ({ id: 1, name: 'Alice' }), []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={() => setTick(t => t + 1)}>
        Trigger unrelated re-render (tick = {tick})
      </button>

      <h4>Wrapped in memo, but object literal inline (BAD)</h4>
      <Profile user={badUser} />

      <h4>Wrapped in memo, WITH useMemo (the main page's fix)</h4>
      <Profile user={goodUser} />

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Both Profile instances are wrapped in React.memo. Click the
        button a few times -- does memo alone stop the BAD one from
        re-rendering, or only the GOOD one?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Trigger unrelated re-render" five times. Compare the two render counts — does React.memo alone stop the BAD (inline object literal) Profile from re-rendering, or only the GOOD (useMemo) one?',
    hint: '`React.memo` shallow-compares props with `Object.is` — it has no way to know that two different object instances happen to contain the same field values.',
    solution: `The BAD Profile's render count goes up on every click, right along
with tick -- React.memo provides ZERO protection here, even though
Profile is wrapped in memo() exactly as the main page's mistake title
implies it should matter. badUser is a fresh object literal created
fresh on every App render, so memo's shallow Object.is comparison
sees "different object" every single time and re-renders the child.

The GOOD Profile's render count stays at 1 no matter how many times
you click -- useMemo(() => ({ id: 1, name: 'Alice' }), []) keeps
returning the SAME object reference across renders (empty dependency
array), so memo's shallow comparison correctly sees "same object" and
skips re-rendering the child entirely.

The practical lesson: React.memo is necessary but not sufficient when
a prop is an object, array, or function created inline in JSX. Wrapping
the child in memo without ALSO stabilizing the object reference
upstream (useMemo, useCallback, or hoisting the literal outside the
component) buys nothing -- the main page's Mistake #6 fix (useMemo) is
the part that actually matters; memo alone was never going to help.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wrapping a component in `React.memo()` is the fix for unnecessary re-renders caused by object-literal props — the main page\'s Mistake #6 title even names `React.memo` directly.',
      reality: '`memo` alone provides zero protection against a freshly allocated object prop — the actual fix is stabilizing the object\'s REFERENCE upstream with `useMemo`; `memo` only helps once that stable reference already exists.',
    },
    {
      thought: 'if a memoized component keeps re-rendering despite receiving "the same" props, `React.memo` must be implemented incorrectly or buggy.',
      reality: '`memo`\'s default shallow comparison is working exactly as designed — two different object instances with identical field values are, by design, considered different props under `Object.is`; the fix is not in `memo`, it\'s in how the prop is created.',
    },
    {
      thought: 'adding `React.memo` around every component is a safe, low-risk way to reduce re-renders, even without knowing what kind of props it receives.',
      reality: 'for components that receive inline object, array, or function props from their parent, `memo` adds a shallow-comparison cost on every render while preventing zero re-renders — a pure-overhead change unless the prop reference is also stabilized.',
    },
  ];
}
