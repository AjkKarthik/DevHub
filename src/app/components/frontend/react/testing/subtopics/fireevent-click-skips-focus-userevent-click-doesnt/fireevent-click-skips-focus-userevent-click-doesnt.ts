import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-fireevent-vs-userevent-focus-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './fireevent-click-skips-focus-userevent-click-doesnt.html',
  styleUrl: './fireevent-click-skips-focus-userevent-click-doesnt.scss',
})
export class FireeventClickSkipsFocusUsereventClickDoesntSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Claim Is Precise, But Abstract Without a Concrete Consequence',
      points: [
        'The theory section says: "userEvent simulates the full browser event sequence — pointer events, focus, keydown/up, input, change, blur. fireEvent dispatches a single synthetic event. Always prefer userEvent for realistic tests."',
        'This is stated as a general principle, but the page never shows a case where the difference actually changes whether a test PASSES or FAILS. This subtopic builds exactly that case: a component that only reacts to a real <code>focus</code> event, and compares what happens when it\'s clicked via the real <code>fireEvent.click</code> versus the real <code>userEvent.click</code>.',
      ],
    },
    {
      heading: 'Why fireEvent.click Alone Never Focuses the Element',
      points: [
        '<code>fireEvent.click(element)</code> does exactly one thing: it dispatches a single <code>click</code> DOM event at that element. It does not simulate what a REAL mouse click does in a real browser — pressing the mouse down, releasing it, and (for a focusable element) moving keyboard focus to it as a side effect.',
        '<code>userEvent.click(element)</code> is built specifically to replicate that full real-world sequence: <code>pointerdown</code>, <code>mousedown</code>, <code>focus</code>, <code>pointerup</code>, <code>mouseup</code>, and finally <code>click</code> — in that order, matching what an actual browser does when a real user clicks a real button.',
        'For a component whose behavior depends on the <code>focus</code> event specifically (a common pattern for showing "focused" styling, opening a dropdown on focus, or a custom keyboard-accessible widget), <code>fireEvent.click</code> alone will never trigger that behavior — the click "succeeds" in the sense that the click handler runs, but any focus-dependent logic never fires, because no real focus event was ever dispatched.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "fireevent-userevent-focus-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@testing-library/react": "^14.2.1",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/dom": "^9.3.4"
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
  <head><title>fireEvent vs userEvent and focus</title></head>
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
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// A button whose behavior depends specifically on a real focus event.
function FocusTrackingButton({ onFocusFired }) {
  return <button onFocus={onFocusFired}>Click me</button>;
}

export default function App() {
  const [output, setOutput] = useState('Click a button below to run the comparison.');

  async function runFireEvent() {
    let focused = false;
    const { container, unmount } = render(<FocusTrackingButton onFocusFired={() => { focused = true; }} />);
    const button = container.querySelector('button');

    // The REAL fireEvent.click -- a single synthetic click event.
    fireEvent.click(button);

    setOutput('fireEvent.click result -- did onFocus fire? ' + focused);
    unmount();
  }

  async function runUserEvent() {
    let focused = false;
    const user = userEvent.setup();
    const { container, unmount } = render(<FocusTrackingButton onFocusFired={() => { focused = true; }} />);
    const button = container.querySelector('button');

    // The REAL userEvent.click -- the full pointer/focus/click sequence.
    await user.click(button);

    setOutput('userEvent.click result -- did onFocus fire? ' + focused);
    unmount();
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={runFireEvent}>Run with fireEvent.click</button>
      <button onClick={runUserEvent} style={{ marginLeft: 8 }}>Run with userEvent.click</button>
      <pre style={{ marginTop: 12, background: '#f3f4f6', padding: 12 }}>{output}</pre>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        FocusTrackingButton only sets focused to true when a REAL
        focus event fires. Try both buttons -- does fireEvent.click
        trigger it? Does userEvent.click?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Run with fireEvent.click", then click "Run with userEvent.click". Compare the two results — did onFocus fire in each case?',
    hint: 'fireEvent.click dispatches exactly one click event — userEvent.click replicates the full real-browser sequence, including a genuine focus event, before the click.',
    solution: `"Run with fireEvent.click" shows: "did onFocus fire? false" --
the button's onClick-equivalent behavior technically happened (the
click event genuinely reached the button), but onFocus never fired,
because fireEvent.click only ever dispatches that one click event --
nothing simulates the focus a real mouse click would also cause.

"Run with userEvent.click" shows: "did onFocus fire? true" -- the
real userEvent library fired a full, realistic event sequence
(pointerdown, mousedown, focus, pointerup, mouseup, click), and the
genuine focus event in that sequence triggered FocusTrackingButton's
onFocus handler exactly as a real user's click would in a real
browser.

This is the concrete consequence the main page's abstract claim
predicts: a test asserting focus-dependent behavior (a focus ring
appearing, a tooltip opening, a dropdown expanding on focus) would
PASS with userEvent.click and FAIL with fireEvent.click for the exact
same component -- not because the component is broken, but because
fireEvent.click never simulated the browser behavior the component
actually depends on. This is precisely why the main page recommends
"always prefer userEvent for realistic tests" rather than treating
fireEvent and userEvent as interchangeable click simulators.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`fireEvent.click(button)` and `userEvent.click(button)` both simulate "a user clicking the button," so they should be interchangeable for any test that just needs a click to happen.',
      reality: '`fireEvent.click` dispatches exactly one `click` DOM event; `userEvent.click` dispatches a full realistic sequence including `focus` — for any component whose behavior depends on focus (or hover, or the intermediate mousedown/mouseup states), the two produce genuinely different, observable outcomes.',
    },
    {
      thought: 'if `fireEvent.click` were missing some behavior a real click provides, RTL or React would surface an error or warning to flag the gap.',
      reality: 'there is no error or warning — the click event genuinely fires and any onClick handler genuinely runs; the only symptom is that focus-dependent logic silently never executes, which looks identical to "the component doesn\'t have that behavior" unless you specifically know to check.',
    },
    {
      thought: 'this distinction only matters for exotic components with unusual focus-handling — most buttons and links don\'t need to worry about this gap.',
      reality: 'this is relevant to any interactive element using onFocus/onBlur for legitimate UX (focus rings, autocomplete dropdowns, form field highlighting) — a genuinely common pattern in real component libraries, not an edge case.',
    },
  ];
}
