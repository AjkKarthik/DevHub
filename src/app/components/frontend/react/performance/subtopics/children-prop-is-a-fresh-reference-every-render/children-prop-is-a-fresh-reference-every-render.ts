import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-children-fresh-reference-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './children-prop-is-a-fresh-reference-every-render.html',
  styleUrl: './children-prop-is-a-fresh-reference-every-render.scss',
})
export class ChildrenPropIsAFreshReferenceEveryRenderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A One-Line Claim With No Demonstration',
      points: [
        'The "When memo is not worth it" theory point lists, almost in passing: "components that receive children (children is always a new reference)." No code tab shows this — every memo example in the page passes primitive or explicitly-memoized props, never plain <code>children</code>.',
        'This subtopic tests that specific claim directly: if a memo\'d component\'s ONLY prop is <code>children</code>, and the JSX passed as children LOOKS completely static from render to render (same tag, same text), does the memo\'d component still re-render every time its parent does?',
      ],
    },
    {
      heading: 'Why JSX Always Allocates a New Element, Even When It "Looks the Same"',
      points: [
        'JSX is not markup — <code>&lt;p&gt;Hello&lt;/p&gt;</code> compiles to a function call, <code>jsx(\'p\', { children: \'Hello\' })</code>, that runs and returns a brand-new plain object every single time the surrounding component function executes. There is no caching of "this JSX looks like the same JSX I returned last time" — each render call produces its own fresh element object.',
        'When that JSX is passed as <code>children</code> to another component — <code>&lt;Wrapper&gt;&lt;p&gt;Hello&lt;/p&gt;&lt;/Wrapper&gt;</code> — the <code>&lt;p&gt;</code> element object is created fresh in the PARENT\'s render, then handed to <code>Wrapper</code> as its <code>children</code> prop. Even though the text content and tag are identical to the previous render, the object reference is new, so <code>Object.is(prevChildren, nextChildren)</code> is <code>false</code>.',
        'A memo\'d <code>Wrapper</code> therefore re-renders every time its parent does, regardless of how static the children JSX visually appears in the source code — memo genuinely cannot help here unless the children themselves are hoisted out of the re-rendering scope (a module-level constant, or the children prop stored in state/ref rather than recreated inline).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "children-fresh-reference-demo",
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
  <head><title>children is a fresh reference every render</title></head>
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
      content: `import { useState, memo, useRef } from 'react';

// Wrapper's ONLY prop is children -- no other props to destabilize it.
const Wrapper = memo(function Wrapper({ children }) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return (
    <div style={{ border: '1px solid #ccc', padding: 10, marginTop: 8 }}>
      <p>Wrapper renders: {renderCount.current}</p>
      {children}
    </div>
  );
});

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={() => setCount(c => c + 1)}>
        Trigger unrelated re-render (count: {count})
      </button>

      {/* This JSX looks completely static -- same tag, same text,
          every single render -- but it's re-created fresh each time. */}
      <Wrapper>
        <p>Hello, this text never changes.</p>
      </Wrapper>

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Wrapper is wrapped in memo and receives ONLY children as a
        prop. The children JSX above never changes in the source code.
        Click the button -- does Wrapper's render count stay frozen,
        or keep climbing anyway?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Trigger unrelated re-render" a few times. Wrapper is memoized and receives only children — the JSX passed as children never changes in the source. Does Wrapper\'s render count stay frozen, or keep climbing anyway?',
    hint: 'JSX compiles to a function call that returns a brand-new object every time it runs — "looks identical in the source" and "is the same object reference" are two completely different things.',
    solution: `Wrapper's render count climbs on every single click, right along
with count -- even though memo wraps Wrapper, even though children
is its ONLY prop, and even though the <p>Hello, this text never
changes.</p> JSX is byte-for-byte identical in the source code on
every render.

This is exactly what "children is always a new reference" means in
practice: App's render function calls jsx('p', { children: 'Hello,
this text never changes.' }) fresh every time it executes, producing
a new element object each time. That new object is what Wrapper
receives as its children prop -- memo's Object.is comparison
correctly reports "this is a different value than last time,"
because at the object-reference level, it genuinely is.

The practical lesson: memo cannot rescue a component whose primary
prop is children rendered inline from a re-rendering parent, no
matter how visually static that children content is. The main
page's own phrasing -- "components that receive children ... are
usually not worth wrapping in memo" -- is the direct, practical
consequence of this: for a wrapper whose only real prop is children,
memo adds comparison overhead for a check that will essentially
always fail.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if the JSX passed as `children` looks identical between renders (same tags, same text, no dynamic values), React treats it as the same value and a memoized wrapper around it will skip re-rendering.',
      reality: 'JSX always compiles to a fresh function call that allocates a new element object on every render, regardless of how visually static the markup looks in the source — `Object.is` sees a different reference every time, so a memoized wrapper receiving that JSX as `children` re-renders anyway.',
    },
    {
      thought: 'wrapping a component in `React.memo()` is always either helpful or neutral — worst case, it just does a comparison that finds nothing changed and skips a tiny bit of work.',
      reality: 'for a component whose main prop is `children` created inline by a re-rendering parent, `memo` adds a real (if small) comparison cost on every render while never actually preventing a re-render — it is worse than doing nothing in that specific case.',
    },
    {
      thought: 'the fix for this is to add `useMemo` around the children JSX, the same way you would memoize an object or array prop.',
      reality: 'wrapping JSX in `useMemo(() => <p>...</p>, [])` does work as a fix (it stabilizes the reference), but the more common and idiomatic fix is to hoist genuinely static children to a module-level constant outside the component entirely, since they never depend on any props or state in the first place.',
    },
  ];
}
