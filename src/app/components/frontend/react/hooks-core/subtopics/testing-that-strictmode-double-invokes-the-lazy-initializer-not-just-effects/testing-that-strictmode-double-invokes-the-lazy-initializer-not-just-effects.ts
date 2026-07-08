import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-strictmode-double-invokes-lazy-initializer-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-strictmode-double-invokes-the-lazy-initializer-not-just-effects.html',
  styleUrl: './testing-that-strictmode-double-invokes-the-lazy-initializer-not-just-effects.scss',
})
export class TestingThatStrictmodeDoubleInvokesTheLazyInitializerNotJustEffectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Only Ever Talks About Strict Mode and Effects',
      points: [
        'The theory section says: "React 18 Strict Mode fires effects twice in development to surface missing cleanup." A QnA question reinforces this with a module-level counter incremented inside an effect, mounted twice.',
        'Separately, the Quick Reference names the <code>useState(() =&gt; expensiveInit)</code> lazy initializer as running "once on mount only." Neither section connects the two ideas — does Strict Mode\'s double-invocation reach the RENDER phase too, specifically the lazy initializer function passed to <code>useState</code>, or is "once on mount" still literally true even under Strict Mode?',
      ],
    },
    {
      heading: 'Why Strict Mode Doubles More Than Just Effects',
      points: [
        'React 18 Strict Mode\'s double-invocation is not limited to effects — it also double-invokes the component FUNCTION BODY itself on the initial mount in development, along with specific functions React knows are supposed to be pure: the <code>useState</code>/<code>useReducer</code> lazy initializer, and the updater function passed to a state setter.',
        'This means a lazy initializer like <code>useState(() =&gt; expensiveComputation())</code> genuinely runs TWICE on mount under Strict Mode — React deliberately discards the first call\'s result and keeps only the second, purely to help surface accidental side effects hiding inside what should be a pure computation.',
        'The state you actually end up with is still correct (only one result is kept) — but if the initializer has an observable side effect of its own (logging, mutating an external variable, reading and incrementing a shared counter), that side effect fires twice, exactly like the main page\'s own effect-based example, just one phase earlier.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "strictmode-lazy-initializer-demo",
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
  <head><title>StrictMode and the lazy initializer</title></head>
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

// StrictMode wraps the whole tree -- this is where the double-invoke
// behavior under test actually comes from.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
    },
    {
      path: 'src/App.js',
      content: `import { useState } from 'react';

// Module-level counter -- NOT React state, so it survives across
// both invocations of the lazy initializer and isn't reset by them.
let initializerCallCount = 0;

export default function App() {
  const [count] = useState(() => {
    initializerCallCount += 1;
    return 0;
  });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>State value (should be 0, correct either way): {count}</p>
      <p>Lazy initializer call count: {initializerCallCount}</p>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        This app is wrapped in StrictMode (see src/index.js). The
        Quick Reference calls the lazy initializer "once on mount
        only" -- does the call count above read 1 or 2 after the
        initial mount?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Load the preview and read "Lazy initializer call count". Does it read 1 or 2, given the main page describes the lazy initializer as running "once on mount only"?',
    hint: 'React 18 Strict Mode double-invokes more than effects in development — it also double-invokes the component body and any useState/useReducer lazy initializer on the initial mount.',
    solution: `The call count reads 2, not 1 -- even though the Quick Reference's
"once on mount only" phrasing, taken at face value, implies a single
call. Under StrictMode, React deliberately calls the lazy initializer
twice during the initial mount and keeps only the second call's
result as the actual state value (count itself still correctly
reads 0 either way).

This is the exact same category of behavior as the main page's own
QnA about a module-level counter inside an effect being incremented
twice under the mount→unmount→remount cycle -- just one phase
earlier, during render/initialization rather than during the effect
phase.

The practical lesson: "once on mount" is only strictly true in
production, or for effects specifically outside of StrictMode's
render-phase double-invocation. Any lazy initializer with an
observable side effect (not just a pure computation) needs the same
scrutiny as an effect without cleanup -- StrictMode is deliberately
trying to catch exactly this category of impurity before it reaches
production, where it would only run once.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'React 18 Strict Mode\'s double-invocation behavior is specific to `useEffect` — the main page only ever mentions effects, so other hooks like `useState`\'s lazy initializer are unaffected.',
      reality: 'StrictMode also double-invokes the component function body and the `useState`/`useReducer` lazy initializer on the initial mount — the effects case is simply the most commonly discussed instance of a broader "call twice, keep one result" pattern.',
    },
    {
      thought: 'if a `useState(() => expensiveInit())` lazy initializer only performs a pure computation with no observable side effect, StrictMode\'s double call has zero practical consequence beyond CPU time.',
      reality: 'that is actually the common, unproblematic case — the double-invocation is specifically DESIGNED to be invisible for pure initializers; it only becomes a visible bug when the initializer does something impure, exactly mirroring why effects need cleanup.',
    },
    {
      thought: 'the resulting state value after a double-invoked lazy initializer is unpredictable — since the function ran twice, you can\'t be sure which call\'s result "won."',
      reality: 'React always keeps the SECOND call\'s result and discards the first — for a pure function this is unobservable (both calls return the same thing), which is exactly why an impure initializer with different results per call is the specific case StrictMode is trying to surface.',
    },
  ];
}
