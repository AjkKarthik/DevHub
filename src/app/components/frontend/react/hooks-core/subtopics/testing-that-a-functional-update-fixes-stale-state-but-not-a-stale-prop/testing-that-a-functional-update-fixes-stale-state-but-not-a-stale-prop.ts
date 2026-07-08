import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-functional-update-fixes-stale-state-not-stale-prop-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-functional-update-fixes-stale-state-but-not-a-stale-prop.html',
  styleUrl: './testing-that-a-functional-update-fixes-stale-state-but-not-a-stale-prop.scss',
})
export class TestingThatAFunctionalUpdateFixesStaleStateButNotAStalePropSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Fix Only Ever Reads ONE Value From the Closure',
      points: [
        'Mistake #3 shows an interval reading a stale <code>count</code>, and fixes it with <code>setCount(prev =&gt; prev + 1)</code> — a functional update that "avoids reading stale count" by never reading the closed-over <code>count</code> variable at all.',
        'The wrong AND right versions both only ever reference <code>count</code> inside the interval. This subtopic asks a natural follow-up: what if the SAME interval also needs to read a completely different value — say, a prop — that is NOT part of the state being updated? Does wrapping the setter in a functional update protect that second value too, or only the one variable it\'s directly updating?',
      ],
    },
    {
      heading: 'Why the Functional-Update Fix Is Narrowly Scoped',
      points: [
        'The functional update form works because React passes the CURRENT state directly into the callback as an argument (<code>prev</code>) — it doesn\'t need to read any variable from the surrounding closure at all for that one value. This sidesteps the stale-closure problem specifically for the piece of state being updated.',
        'Every OTHER value referenced inside that same effect — a prop, a different piece of state, a value from context — is still read the normal way: from the closure the effect captured when it was created. If the effect\'s dependency array doesn\'t include that value, and it changes later, the effect keeps using the OLD version, exactly as if there were no functional update anywhere in the file.',
        'This means "I switched to a functional update, so I don\'t need to worry about exhaustive deps anymore" is only true for the ONE value being functionally updated — every other captured value still needs to either be added to the dependency array or accessed some other way (a ref, for instance).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "functional-update-stale-prop-demo",
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
  <head><title>Functional update and a stale prop</title></head>
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

function Ticker({ multiplier }) {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      // Functional update -- exactly the main page's own fix.
      // This part of the closure problem is genuinely solved:
      setCount(prev => prev + 1);

      // But 'multiplier' is still read from the closure this effect
      // captured when it was created -- deps array below is empty,
      // matching the main page's own "fixed" example pattern.
      setLog(prevLog => [...prevLog, multiplier]);
    }, 1000);
    return () => clearInterval(id);
  }, []); // deliberately empty, like the main page's fixed version

  return (
    <div style={{ marginBottom: 20 }}>
      <p>Count (via functional update): {count}</p>
      <p>Multiplier values captured over time: {log.join(', ') || '(waiting...)'}</p>
    </div>
  );
}

export default function App() {
  const [multiplier, setMultiplier] = useState(1);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={() => setMultiplier(m => m + 1)}>
        Increase multiplier (currently {multiplier})
      </button>
      <Ticker multiplier={multiplier} />
      <p style={{ fontSize: 13, color: '#555' }}>
        Wait a couple seconds, then click the button a few times. Does
        "count" keep incrementing correctly? Do the newly logged
        multiplier values in the second line change to match the
        button's current number, or stay frozen?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Wait for a few ticks, then click "Increase multiplier" a few times. Does the count keep incrementing correctly? Do NEW entries appended to the multiplier log reflect the current multiplier, or the value from when the effect first ran?',
    hint: 'The functional update `setCount(prev => prev + 1)` receives the current count directly from React, bypassing the closure entirely — but `multiplier` is still read from the same stale closure the effect captured on mount.',
    solution: `count keeps incrementing correctly forever -- the functional update
genuinely fixes the stale-closure problem for count specifically,
exactly as the main page's Mistake #3 describes.

But every new value appended to the log stays exactly the value
multiplier held when the effect first ran (1, if you didn't click
before waiting) -- no matter how many times you click "Increase
multiplier" afterward. The effect's dependency array is empty, so the
interval callback keeps using the SAME closure, and multiplier inside
that closure never updates, even while count -- read through the
functional-update pattern -- updates perfectly.

The practical lesson: setCount(prev => prev + 1) does not "fix
closures" in any general sense -- it specifically avoids reading
count from the closure by having React hand back the current value
directly. Every OTHER captured value in the same effect (props, other
state, context) still needs to be either added to the dependency
array or read some other way (a ref holding the latest value, for
instance) -- switching one setter to its functional form provides zero
protection for the rest of the closure.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once an effect uses the functional update form for its state setter — `setCount(prev => prev + 1)` — the entire effect is protected from stale-closure bugs, regardless of what else it reads.',
      reality: 'the functional update form only protects the ONE value being updated that way — every other value read from the same closure (props, other state, context) is exactly as stale as it would be without the functional update.',
    },
    {
      thought: 'the main page\'s Mistake #3 fix means you can leave a `useEffect` dependency array empty as long as every state update inside it uses the functional form.',
      reality: '`react-hooks/exhaustive-deps` still needs every OTHER referenced value (props, non-functionally-updated state, context) in the dependency array — the functional update form is a narrow exception for the specific state being set, not a blanket substitute for correct deps.',
    },
    {
      thought: 'if a bug like this were real, the count value itself would also be wrong — a single stale closure should affect everything the effect touches uniformly.',
      reality: 'the two behaviors are genuinely different at once, in the same interval callback, in the same tick — count is exactly correct because React hands it in directly, while multiplier is stale because it is still read from the closure — one effect body, two different staleness outcomes.',
    },
  ];
}
