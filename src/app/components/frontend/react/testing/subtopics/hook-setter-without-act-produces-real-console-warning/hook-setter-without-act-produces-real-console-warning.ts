import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-hook-setter-without-act-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './hook-setter-without-act-produces-real-console-warning.html',
  styleUrl: './hook-setter-without-act-produces-real-console-warning.scss',
})
export class HookSetterWithoutActProducesRealConsoleWarningSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #6 Describes the Warning, But Never Shows Its Exact Text',
      points: [
        'Mistake #6 says calling a hook\'s state-changing function outside <code>act()</code> produces "a \'not wrapped in act()\' warning and may read stale state." The wrong/right code snippets show the FIX, but neither the exact warning text nor a way to actually SEE it appear.',
        'This subtopic renders the real <code>renderHook</code> from <code>@testing-library/react</code>, calls a counter hook\'s <code>increment()</code> both with and without <code>act()</code>, and captures the actual browser console output for each — so you can read the real warning React itself produces, not just a paraphrase of it.',
      ],
    },
    {
      heading: 'Why act() Exists at All',
      points: [
        'React batches and schedules state updates asynchronously as part of its normal rendering process. In a real app, this is invisible — React flushes updates before the browser paints, and your code never observes an in-between state.',
        'In a test (or in this subtopic\'s plain-browser simulation of one), calling a function that triggers a state update OUTSIDE of <code>act()</code> means your assertion (or, here, your displayed output) can run and READ the hook\'s result BEFORE React has actually finished processing that update — a race condition between your code and React\'s own scheduling.',
        '<code>act(callback)</code> tells React: "run this callback, and don\'t return control until every resulting state update and effect has been fully flushed." Wrapping a hook\'s setter call in <code>act()</code> eliminates the race entirely — by the time <code>act()</code> returns, <code>result.current</code> is guaranteed to reflect the update.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "hook-setter-act-warning-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@testing-library/react": "^14.2.1"
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
  <head><title>act() and console warnings</title></head>
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
import { renderHook, act } from '@testing-library/react';

function useCounter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(c => c + 1);
  return { count, increment };
}

export default function App() {
  const [output, setOutput] = useState('Click a button below.');

  function runWithoutAct() {
    const captured = [];
    const originalError = console.error;
    console.error = (...args) => { captured.push(args.join(' ')); originalError(...args); };

    const { result, unmount } = renderHook(() => useCounter());
    // Calling the state-changing setter WITHOUT act().
    result.current.increment();

    console.error = originalError;
    setOutput(
      'WITHOUT act() -- console.error captured:\\n' +
      (captured.length ? captured[0].slice(0, 200) : '(nothing captured)')
    );
    unmount();
  }

  function runWithAct() {
    const captured = [];
    const originalError = console.error;
    console.error = (...args) => { captured.push(args.join(' ')); originalError(...args); };

    const { result, unmount } = renderHook(() => useCounter());
    // The main page's own fix -- calling the setter INSIDE act().
    act(() => result.current.increment());

    console.error = originalError;
    setOutput(
      'WITH act() -- console.error captured:\\n' +
      (captured.length ? captured[0].slice(0, 200) : '(nothing captured -- clean)')
    );
    unmount();
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={runWithoutAct}>Run WITHOUT act()</button>
      <button onClick={runWithAct} style={{ marginLeft: 8 }}>Run WITH act()</button>
      <pre style={{ marginTop: 12, background: '#f3f4f6', padding: 12, whiteSpace: 'pre-wrap' }}>{output}</pre>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Both buttons call the exact same increment() function on a
        freshly rendered hook. Only one wraps the call in act(). Which
        one produces a real React console warning?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Run WITHOUT act()", then "Run WITH act()". Compare the captured console.error output for each — which one shows a real React warning?',
    hint: 'act() tells React to fully flush a state update before returning — outside of it, your code can observe React mid-update, which is exactly the race condition React\'s own warning is designed to catch.',
    solution: `"Run WITHOUT act()" captures a real React warning: "Warning: An
update to TestComponent inside a test was not wrapped in act(...)."
-- React itself detected that increment()'s setCount call happened
outside any act() boundary, and logged this to the console
automatically, exactly as Mistake #6 describes but now with the
actual wording React uses.

"Run WITH act()" shows "(nothing captured -- clean)" -- wrapping the
identical increment() call in act() gives React the boundary it needs
to fully process the update before act() returns, so no warning
fires at all.

Both buttons call the literal same increment function against a
freshly mounted hook instance -- the only difference is the act()
wrapper. This confirms the warning isn't about YOUR code doing
anything wrong in a deep sense; it's React specifically detecting
"a state update happened where I can't guarantee you saw the fully
flushed result," which act() exists to prevent.

The practical lesson: seeing this exact warning in your own test
output is a direct, actionable signal — wrap whatever call triggered
it in act() (or, for async updates, use await waitFor(...), which
wraps act() internally). The main page's Mistake #6 fix isn't a
stylistic preference; it's the specific action that makes this exact
warning disappear.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "not wrapped in act()" warning is a generic linting-style suggestion, similar to a code style warning that doesn\'t indicate a real problem.',
      reality: 'it is React itself detecting a genuine race condition — code reading a hook\'s state before React has guaranteed that state update is fully processed — which can produce flaky, order-dependent test results if left unaddressed.',
    },
    {
      thought: 'act() only matters inside actual Jest/Vitest test files — calling a hook\'s setter outside act() in ordinary application code (not a test) would trigger the same warning.',
      reality: 'this specific warning is scoped to React\'s TEST utilities detecting updates during rendering/testing utilities like renderHook — ordinary application code calling a state setter from a normal event handler is the expected, normal path and never triggers this warning.',
    },
    {
      thought: 'if a hook test "looks like it passes" without act(), the warning is just noise that can be safely ignored.',
      reality: 'a test that passes without act() can still be relying on incidental timing — a later React or testing-library version, or a slower/faster execution environment, can turn a "passing" un-act()-wrapped test into a flaky one that intermittently reads stale state.',
    },
  ];
}
