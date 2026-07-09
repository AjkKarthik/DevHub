import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-usecounter-reset-frozen-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './usecounter-reset-frozen-to-mount-time-initial-count.html',
  styleUrl: './usecounter-reset-frozen-to-mount-time-initial-count.scss',
})
export class UsecounterResetFrozenToMountTimeInitialCountSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The State Initializer Pattern Description Never Mentions Later Argument Changes',
      points: [
        'The theory section describes the state initializer pattern: "accept an <code>initialState</code> prop; store it in a ref; expose a <code>reset()</code> function that restores to initial." The <code>useCounter</code> example does exactly this: <code>const initialRef = useRef(initialCount);</code>.',
        'Nothing in the description says what happens if the CALLER later invokes <code>useCounter(newInitialCount)</code> with a different argument on a subsequent render — e.g. because <code>initialCount</code> is itself derived from a prop that changed. This subtopic tests whether <code>reset()</code> picks up that new value, or ignores it.',
      ],
    },
    {
      heading: 'Why useRef\'s Initial Value Argument Is Only Ever Read Once',
      points: [
        '<code>useRef(initialCount)</code> only uses its argument to compute the ref\'s value on the VERY FIRST render of that component instance. On every subsequent render, React reuses the SAME ref object it created initially — the <code>initialCount</code> argument passed on later renders is evaluated (the expression still runs) but its result is simply discarded, since <code>useRef</code> has no mechanism to "update" an existing ref\'s value from its argument.',
        'This means if the caller changes what value they pass as <code>initialCount</code> on a later render, <code>initialRef.current</code> permanently keeps the value from the FIRST call. <code>reset()</code>, which always resets to <code>initialRef.current</code>, therefore resets to whatever <code>initialCount</code> was at mount time — not whatever it currently is.',
        'This is a very common, easy-to-miss trap: the pattern LOOKS like it tracks "the initial value," but it actually tracks "the value the very first time this hook instance was ever called," which silently diverges the moment a caller\'s <code>initialCount</code> argument changes on a later render.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "usecounter-reset-frozen-demo",
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
  <head><title>useCounter reset frozen to mount-time value</title></head>
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
      content: `import { useState, useRef, useCallback } from 'react';

// The main page's own useCounter, unchanged.
function useCounter(initialCount = 0) {
  const initialRef = useRef(initialCount);
  const [count, setCount] = useState(initialCount);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset     = useCallback(() => setCount(initialRef.current), []);
  return { count, increment, decrement, reset };
}

export default function App() {
  // startAt itself is a piece of state the caller can change later.
  const [startAt, setStartAt] = useState(0);
  const { count, increment, decrement, reset } = useCounter(startAt);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>count: {count}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment} style={{ marginLeft: 8 }}>+</button>
      <button onClick={reset} style={{ marginLeft: 8 }}>Reset</button>

      <hr style={{ margin: '16px 0' }} />

      <button onClick={() => setStartAt(100)}>
        Change startAt to 100 (currently {startAt})
      </button>

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Click "Change startAt to 100" FIRST. Then click "Reset". Does
        count go back to 0 (the value at mount) or to 100 (the new
        startAt value)?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Change startAt to 100" first, so startAt updates from 0 to 100. Then click "Reset". Does count go back to 0 (the mount-time value) or to 100 (the current startAt)?',
    hint: 'useRef(initialCount) only reads its argument on the very first render of this component instance — later renders reuse the same ref, ignoring whatever new value the argument expression evaluates to.',
    solution: `Clicking "Reset" sets count back to 0 -- NOT 100 -- even though
startAt clearly shows 100 on screen by the time you click Reset, and
useCounter(startAt) is being called with 100 on every render since
the change.

This happens because initialRef was created with useRef(initialCount)
on the component's FIRST render, when initialCount (aka startAt) was
still 0. Every later render of useCounter passes a fresh argument
(100, after the change) to useRef(100) -- but useRef only uses that
argument on true initial mount; on every subsequent call it just
returns the EXISTING ref object, completely ignoring the new
argument. initialRef.current is therefore permanently stuck at 0,
and reset() -- which always does setCount(initialRef.current) -- can
only ever go back to that frozen value.

The practical lesson: the state initializer pattern's reset()
tracks "whatever the initial value was when this hook instance first
mounted," not "whatever the initial value currently is." If a
caller's initial-value argument can legitimately change after mount
(as it does here, since startAt is itself stateful), reset() will
silently diverge from what a reasonable consumer might expect --
"reset to the current default" -- unless the hook is explicitly
redesigned to track later changes (e.g. with a useEffect that updates
initialRef.current when initialCount changes, if that\'s the intended
behavior).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`useRef(initialCount)` keeps tracking the CURRENT value of `initialCount` across renders, the same way a `useState`\'s value updates when its setter is called — so if the caller passes a new `initialCount`, the ref reflects it.',
      reality: '`useRef`\'s argument is only ever used to compute the ref\'s value on the very first render — every later render\'s argument value is evaluated but discarded, since `useRef` has no update mechanism tied to its argument at all.',
    },
    {
      thought: 'the state initializer pattern\'s `reset()` function restores state to whatever the CURRENT default/initial value is, making it suitable for "reset to defaults" UI where the defaults might change dynamically.',
      reality: '`reset()` restores state to whatever the initial value was at MOUNT TIME specifically — if the intended default can legitimately change later, the hook needs additional logic (like a `useEffect` syncing `initialRef.current` to the latest argument) to actually support that use case.',
    },
    {
      thought: 'this only matters in contrived scenarios — in practice, a component\'s "initial count" argument is set once and never changes, so the frozen-ref behavior is rarely observable.',
      reality: 'it is a common, realistic scenario whenever the initial value is derived from a prop, URL param, or user selection that can change during the component\'s lifetime — a settings panel with a "starting balance" selector feeding into a counter hook is a completely ordinary case where this would silently misbehave.',
    },
  ];
}
