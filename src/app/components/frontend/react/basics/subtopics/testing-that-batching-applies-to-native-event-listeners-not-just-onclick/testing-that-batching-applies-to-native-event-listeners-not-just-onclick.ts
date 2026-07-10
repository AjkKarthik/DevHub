import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-batching-applies-to-native-event-listeners-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-batching-applies-to-native-event-listeners-not-just-onclick.html',
  styleUrl: './testing-that-batching-applies-to-native-event-listeners-not-just-onclick.scss',
})
export class TestingThatBatchingAppliesToNativeEventListenersNotJustOnclickSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Claim Goes Beyond Ordinary onClick Handlers',
      points: [
        'The "Rendering, Re-renders, and the Reconciler" section says: "React 18 batches state updates... automatically in all scenarios including async functions, timeouts, and native event listeners." A quiz question repeats this exact list as the correct answer.',
        'Every code example on the page triggers state from a normal JSX handler like <code>onClick={handleClick}</code> — which goes through React\'s synthetic event system. The page never actually shows a listener attached with raw <code>addEventListener</code>, bypassing React\'s event system entirely. Does batching really reach that far, or is "native event listeners" aspirational phrasing?',
      ],
    },
    {
      heading: 'Why Batching Extends Past React\'s Own Event System',
      points: [
        'Before React 18, batching was implemented INSIDE React\'s synthetic event dispatcher — only code that ran during a React-managed event (a click handled via <code>onClick</code>) was batched. A handler added with <code>element.addEventListener(\'click\', fn)</code> runs completely outside that dispatcher, so pre-18 React re-rendered once per <code>setState</code> call inside it.',
        'React 18\'s automatic batching moved the mechanism out of the event system entirely — it now batches based on the JS microtask/macrotask boundary, regardless of what triggered the state updates. Two <code>setState</code> calls made synchronously anywhere before the current task yields — including inside a raw <code>addEventListener</code> callback — collapse into a single render.',
        'This is directly testable: attach a listener with plain <code>addEventListener</code> (not JSX <code>onClick</code>), call two state setters inside it, and count how many times the component function body actually runs.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "batching-native-listener-demo",
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
  <head><title>Batching and native event listeners</title></head>
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
      content: `import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;

  const btnRef = useRef(null);

  // Attach with plain addEventListener -- NOT React's onClick.
  // This bypasses React's synthetic event system entirely.
  useEffect(() => {
    const btn = btnRef.current;
    function handleNativeClick() {
      // Two state updates, synchronously, inside a raw DOM listener.
      setA(prev => prev + 1);
      setB(prev => prev + 1);
      console.log('native listener fired both setters');
    }
    btn.addEventListener('click', handleNativeClick);
    return () => btn.removeEventListener('click', handleNativeClick);
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>a = {a}, b = {b}</p>
      <p>Render count: {renderCount.current}</p>
      <button ref={btnRef}>
        Click (native addEventListener, not onClick)
      </button>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Each click calls setA and setB synchronously inside a native
        DOM listener. Does the render count go up by 1 or by 2 per click?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the browser console, click the button a few times, and watch the render count. Does it increase by 1 or by 2 per click, given that the click handler calls two separate state setters?',
    hint: 'React 18\'s automatic batching is no longer tied to React\'s own synthetic event dispatcher — it batches synchronous state updates regardless of what triggered them, including a raw `addEventListener` callback.',
    solution: `The render count increases by exactly 1 per click, not 2 -- even
though the native listener calls setA and setB as two separate,
synchronous state updates, and even though the listener was attached
with plain addEventListener, completely outside React's own event
system.

This confirms the main page's theory claim precisely: React 18's
automatic batching is not scoped to onClick-style synthetic event
handlers. It batches any synchronous state updates that happen before
the browser yields control back to the event loop -- including native
DOM listeners, setTimeout callbacks, and resolved Promises. In React
17, this exact same code would have produced 2 renders per click,
because pre-18 batching only worked inside React's own synthetic
event dispatcher.

The practical lesson: you can rely on batching even in code that
never touches JSX event props directly -- third-party libraries that
attach their own DOM listeners and call your state setters get the
same batching guarantee automatically in React 18, with nothing extra
to opt into.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'React 18\'s automatic batching only applies to state updates triggered through JSX event props like `onClick` — anything attached via `addEventListener` still causes one render per `setState` call, just like React 17.',
      reality: 'automatic batching in React 18 is decoupled from React\'s own synthetic event system entirely — it batches synchronous state updates regardless of what triggered them, including a listener attached with plain `addEventListener`.',
    },
    {
      thought: 'if a UI library calls your React state setters from its own internal DOM event listeners, you need to manually wrap those calls in `ReactDOM.unstable_batchedUpdates` to avoid extra renders, same as in React 17.',
      reality: '`unstable_batchedUpdates` is no longer necessary for this in React 18 — automatic batching already covers native listeners, timeouts, and promises without any manual wrapping.',
    },
    {
      thought: 'the main page\'s claim that batching covers "native event listeners" is a minor implementation detail unlikely to matter in typical app code.',
      reality: 'it matters directly whenever state setters are called from code React does not control — analytics scripts, third-party widgets, WebSocket message handlers, or any `addEventListener` callback — all of which get the same single-render guarantee automatically.',
    },
  ];
}
