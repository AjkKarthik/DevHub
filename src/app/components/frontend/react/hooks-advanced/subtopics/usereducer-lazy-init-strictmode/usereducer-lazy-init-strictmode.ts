import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-usereducer-lazy-init-strictmode-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './usereducer-lazy-init-strictmode.html',
  styleUrl: './usereducer-lazy-init-strictmode.scss',
})
export class UsereducerLazyInitStrictmodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page States This as a Flat Equivalence',
      points: [
        'The QnA section says: "The third-argument form <code>useReducer(reducer, arg, init)</code> is equivalent to <code>useState(() =&gt; init(arg))</code> — both call the function once on mount."',
        'This hub\'s Core Hooks topic already found that a <code>useState</code> lazy initializer is actually called TWICE on mount under Strict Mode, not once. If this page\'s own QnA is asserting a genuine equivalence between the two APIs, does <code>useReducer</code>\'s third-argument <code>init</code> function inherit that same double-invocation, or is it a special case that really does run once?',
      ],
    },
    {
      heading: 'Why the Equivalence Holds All the Way Down to Strict Mode',
      points: [
        'Both <code>useState</code>\'s lazy initializer and <code>useReducer</code>\'s <code>init</code> function exist for the same reason: computing an expensive initial value only once per mount, not on every render. React treats both as functions that are supposed to be PURE — and Strict Mode\'s development-only double-invocation policy applies to any function React expects to be pure, not to <code>useState</code> specifically.',
        'This means <code>init(arg)</code> genuinely runs twice on the initial mount under Strict Mode, exactly like the lazy initializer case — React discards the first call\'s result and keeps only the second as the real initial state. The QnA\'s "both call the function once on mount" is accurate for PRODUCTION, but not for development under Strict Mode.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "usereducer-lazy-init-strictmode-demo",
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
  <head><title>useReducer lazy init and StrictMode</title></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
    },
    {
      path: 'src/index.js',
      content: `import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
    },
    {
      path: 'src/App.js',
      content: `import { useReducer } from 'react';

// Module-level counter -- NOT React state, so it survives across
// both invocations of init and isn't reset by them.
let initCallCount = 0;

function init(arg) {
  initCallCount += 1;
  return { count: arg };
}

function reducer(state, action) {
  return action.type === 'inc' ? { count: state.count + 1 } : state;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, 5, init);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>state.count (should be 5, correct either way): {state.count}</p>
      <p>init() call count: {initCallCount}</p>
      <button onClick={() => dispatch({ type: 'inc' })}>+</button>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        This app is wrapped in StrictMode (see src/index.js). The QnA
        says useReducer's init function "calls the function once on
        mount" -- does the count above read 1 or 2?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Load the preview and read "init() call count". Does it read 1 or 2 after the initial mount, given the main page\'s QnA describes it as running "once on mount"?',
    hint: 'Strict Mode\'s double-invocation policy applies to any function React treats as required to be pure — not specifically to useState\'s lazy initializer.',
    solution: `The call count reads 2, not 1 -- init(arg) is double-invoked on the
initial mount under Strict Mode, exactly like useState's lazy
initializer. state.count itself is still correctly 5 either way,
since React keeps only the second call's result.

This directly extends this hub's own Core Hooks finding (StrictMode
double-invokes the useState lazy initializer) to useReducer's third
argument -- confirming the QnA's "useReducer(reducer, arg, init) is
equivalent to useState(() => init(arg))" claim holds even down to
this specific development-mode behavior, not just the production
happy path.

The practical lesson: "calls the function once on mount" is a
production-mode description. Any function passed to React that is
supposed to be a pure computation -- lazy initializers for useState,
init functions for useReducer -- should be written as a genuinely
pure function with no side effects, specifically because Strict Mode
will call it twice in development to help catch violations of that
assumption before they reach production.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "once on mount" description for useReducer\'s init function is a hard runtime guarantee that holds in every environment, since the main page states it as a flat equivalence with useState\'s lazy initializer.',
      reality: 'it is accurate for production, but under Strict Mode in development, init() is double-invoked on mount exactly like useState\'s lazy initializer — the equivalence the main page describes holds precisely BECAUSE both follow the same Strict Mode policy, not despite it.',
    },
    {
      thought: 'only useState has the "lazy initializer" concept — useReducer\'s third argument is a fundamentally different mechanism that happens to serve a similar purpose.',
      reality: 'they are the same mechanism under the hood — React documents useReducer(reducer, arg, init) as literally equivalent to useState(() => init(arg)), including sharing the same Strict Mode double-invocation behavior.',
    },
    {
      thought: 'if init() has a side effect (like incrementing a counter or logging), that side effect only matters if it is observable in the final rendered state.',
      reality: 'the side effect fires regardless of whether it ends up reflected in the kept state — a side effect with a real-world consequence (an API call, a mutation of an external system) fires twice in development even though the resulting REACT STATE looks perfectly normal.',
    },
  ];
}
