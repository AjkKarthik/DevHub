import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-module-level-var-leaks-across-hook-instances-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './module-level-var-leaks-across-hook-instances.html',
  styleUrl: './module-level-var-leaks-across-hook-instances.scss',
})
export class ModuleLevelVarLeaksAcrossHookInstancesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page States This as an Unconditional Property of Custom Hooks',
      points: [
        'The theory section says plainly: "Custom hooks do not share state between components that call them. Each call creates its own isolated state — like calling <code>useState</code> twice in one component."',
        'This is stated as a property of custom hooks IN GENERAL — but a custom hook is "just a function that calls other hooks." What actually provides the isolation: something inherent to writing a function with a "use" prefix, or specifically the React hooks (like <code>useState</code>) called inside it? This subtopic tests what happens when a custom hook is written WITHOUT using <code>useState</code> internally.',
      ],
    },
    {
      heading: 'Why Isolation Comes From useState, Not From Being a Custom Hook',
      points: [
        'A custom hook has no special isolation mechanism of its own — calling it is just calling a regular JavaScript function. The isolation the main page describes comes entirely from <code>useState</code> (or <code>useReducer</code>/<code>useRef</code>) internally attaching its state to the CALLING COMPONENT\'s own Fiber node — each component instance gets its own slot in React\'s internal state, keyed to that instance.',
        'If a custom hook instead stores its "state" in a plain variable declared at MODULE scope (outside any function, outside any hook), that variable is not tied to any component instance at all — it is one single piece of memory shared by the whole JS module, exactly like any other module-level variable. Every component that calls the hook reads and writes the SAME variable.',
        'This means the main page\'s "isolated state" guarantee is really a property of <code>useState</code> itself, inherited by any custom hook that happens to use it — not a guarantee that comes from following the "starts with use" naming convention. A custom hook that skips <code>useState</code> and reaches for module-level mutable state breaks the isolation entirely, while still passing the ESLint "starts with use" check and still looking like a normal custom hook from the outside.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "module-level-var-leak-demo",
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
  <head><title>Module-level state and custom hook isolation</title></head>
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
      content: `import { useState, useEffect } from 'react';

// GOOD -- properly isolated, uses useState internally.
function useGoodCounter() {
  const [count, setCount] = useState(0);
  return [count, () => setCount(c => c + 1)];
}

// BAD -- looks like a normal custom hook (starts with "use"), but
// stores its "state" in a plain module-level variable instead of
// calling any React hook for the count itself.
let sharedCount = 0;
const listeners = new Set();
function useBadCounter() {
  const [, forceRender] = useState(0);

  // Subscribe this instance to re-render whenever ANY instance
  // increments the shared module-level count.
  useEffect(() => {
    const listener = () => forceRender(n => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const increment = () => {
    sharedCount += 1;
    listeners.forEach(fn => fn());
  };

  return [sharedCount, increment];
}

function GoodCounterDisplay({ label }) {
  const [count, increment] = useGoodCounter();
  return <p>{label} (useGoodCounter): {count} <button onClick={increment}>+</button></p>;
}

function BadCounterDisplay({ label }) {
  const [count, increment] = useBadCounter();
  return <p>{label} (useBadCounter): {count} <button onClick={increment}>+</button></p>;
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h4>useGoodCounter -- two separate instances</h4>
      <GoodCounterDisplay label="Instance A" />
      <GoodCounterDisplay label="Instance B" />

      <h4>useBadCounter -- two separate instances</h4>
      <BadCounterDisplay label="Instance A" />
      <BadCounterDisplay label="Instance B" />

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Click "+" on Instance A under each heading. Does Instance B's
        count change too, or stay independent, for each hook?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "+" on Instance A under "useGoodCounter". Does Instance B change? Now click "+" on Instance A under "useBadCounter". Does Instance B change this time?',
    hint: 'useState attaches its value to the calling component\'s own Fiber node — a plain module-level variable has no such per-instance attachment at all.',
    solution: `Under useGoodCounter: clicking Instance A's "+" leaves Instance B
completely unchanged -- exactly matching the main page's claim.
useState gives each calling component its own isolated slot.

Under useBadCounter: clicking Instance A's "+" ALSO increments
Instance B's displayed count, immediately -- the two "separate"
instances are not isolated at all. Both read and display the exact
same sharedCount module-level variable, and the manual listener
subscription forces every instance to re-render whenever any instance
increments it.

The practical lesson: "custom hooks do not share state between
components" is true only insofar as the hook uses React's own state
primitives (useState, useReducer, useRef) internally. Nothing about
the "use" naming convention or the function-calling-other-hooks shape
enforces isolation on its own -- a custom hook that reaches for
module-level mutable state (a common shortcut for a "singleton" cache
or counter) silently breaks the isolation guarantee the main page
describes as a given, while still looking, from the outside, like any
other well-formed custom hook.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"custom hooks do not share state between components" is a guarantee provided by the React hooks system itself, applying to any function that follows the "use" naming convention.',
      reality: 'the isolation comes specifically from the React hooks (useState, useReducer, useRef) called INSIDE the custom hook, each of which attaches its value to the calling component\'s own Fiber node — a custom hook that avoids those primitives in favor of module-level state has no isolation at all, regardless of its name.',
    },
    {
      thought: 'a function starting with "use" that calls at least one React hook internally is automatically safe from accidentally leaking state across component instances.',
      reality: 'calling ANY hook internally (even just for triggering re-renders, as in the useBadCounter example) does not protect a SEPARATE piece of state stored elsewhere, like a module-level variable — isolation applies per-piece-of-state, not per-function.',
    },
    {
      thought: 'a shared module-level variable inside a custom hook is a rare, contrived mistake unlikely to appear in real code.',
      reality: 'it is a common, easy-to-reach-for shortcut for implementing a lightweight cache, in-memory singleton, or "global counter" pattern inside what otherwise looks like an ordinary custom hook — exactly the kind of code that passes review because it satisfies the "starts with use, calls other hooks" surface-level check.',
    },
  ];
}
