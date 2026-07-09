import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-select-runtime-coercion-boolean-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './select-runtime-coercion-mishandles-boolean-typed-t.html',
  styleUrl: './select-runtime-coercion-mishandles-boolean-typed-t.scss',
})
export class SelectRuntimeCoercionMishandlesBooleanTypedTSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Generic Select\'s Coercion Logic Only Handles Two of Its Own Allowed Types',
      points: [
        'The generic <code>Select&lt;T extends string | number&gt;</code> component\'s <code>onChange</code> wiring does: <code>const typed = (typeof value === \'number\' ? Number(raw) : raw) as T; onChange(typed);</code> — checking whether the CURRENT value is a number, and converting the raw string accordingly.',
        'This subtopic tests what actually gets passed to <code>onChange</code> when <code>T</code> is genuinely just <code>string</code> the whole time (a perfectly valid instantiation of <code>T extends string | number</code>) versus what a caller might reasonably assume the coercion guarantees.',
      ],
    },
    {
      heading: 'Why as T Asserts a Promise the Runtime Code Never Actually Keeps',
      points: [
        '<code>as T</code> is a TypeScript type ASSERTION — it tells the compiler "trust me, this value has type T," but it performs ZERO runtime conversion or validation. The actual JavaScript value flowing through is whatever <code>typeof value === \'number\' ? Number(raw) : raw</code> computed — a plain <code>number</code> or a plain <code>string</code>, nothing else, regardless of what <code>T</code> is asserted to be.',
        'For <code>T = string</code>: the branch that runs is <code>raw</code> (the string branch) — this is correct, no issue. The coercion logic happens to work correctly ONLY because its two branches (number and string) happen to be the only two types <code>T</code> is constrained to (<code>string | number</code>).',
        'The deeper issue: this coercion logic is fundamentally checking the WRONG thing — it inspects <code>typeof value</code> (the CURRENT prop value) to decide how to convert <code>raw</code>, rather than being told what <code>T</code> actually is. If a future maintainer widened the constraint to <code>T extends string | number | boolean</code> (a small, easy-to-make change) without updating this coercion logic, passing a boolean-typed <code>value</code> would fall through to the <code>raw</code> (string) branch — <code>onChange</code> would receive the literal string <code>"true"</code> or <code>"false"</code>, silently violating the <code>onChange: (value: T) =&gt; void</code> contract despite TypeScript\'s own <code>as T</code> assertion insisting everything is fine.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "select-boolean-coercion-demo",
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
  <head><title>Generic Select and boolean coercion</title></head>
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

// The main page's own Select coercion logic, unchanged -- imagining a
// future maintainer widened T to allow booleans without updating this.
function Select({ options, value, onChange }) {
  return (
    <select
      value={String(value)}
      onChange={e => {
        const raw = e.target.value;
        // This is the EXACT logic from the main page's own component.
        // It only ever branches on 'number' -- everything else,
        // including a genuine boolean value, falls into the raw-string branch.
        const typed = (typeof value === 'number' ? Number(raw) : raw); // "as T" asserted here in the TS original
        onChange(typed);
      }}
    >
      {options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

export default function App() {
  // A boolean-typed value -- a perfectly reasonable instantiation if
  // Select's constraint were ever widened to allow it.
  const [enabled, setEnabled] = useState(true);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <Select
        value={enabled}
        onChange={setEnabled}
        options={[{ value: true, label: 'Enabled' }, { value: false, label: 'Disabled' }]}
      />
      <p>enabled variable's actual value: {JSON.stringify(enabled)}</p>
      <p>typeof enabled: {typeof enabled}</p>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Switch the dropdown to "Disabled". Does "enabled" become the
        real boolean false, or does it become something else?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Switch the dropdown from "Enabled" to "Disabled". Check the "enabled variable\'s actual value" and "typeof enabled" lines — is it the real boolean false, or something else?',
    hint: 'The coercion logic only checks `typeof value === \'number\'` — anything that isn\'t a number (including a boolean) falls through to the raw string branch, unconverted.',
    solution: `After selecting "Disabled", the page shows:
"enabled variable's actual value: 'false'" (a STRING, with quotes,
per JSON.stringify) and "typeof enabled: string" -- not the boolean
false and not "boolean".

This is exactly the failure the coercion logic's narrow typeof check
predicts: since typeof value === 'number' was false (the current
value was a boolean, true), the code fell through to the else branch
and passed the raw HTML <option> string value straight through,
completely unconverted. onChange received the STRING "false", not
the boolean false.

In the original TypeScript version, (raw) as T would have silently
asserted this string as T (boolean), completely masking the mismatch
from the type checker -- code consuming enabled elsewhere, written
under the assumption that "TypeScript said this is a boolean," would
now be working with the STRING "false" -- which is truthy in
JavaScript, the exact opposite of what an "isEnabled" style boolean
flag being false should mean.

The practical lesson: a type assertion (as T) is a promise to the
compiler, not a runtime guarantee. Coercion logic that inspects
typeof value on the CURRENT value to decide how to convert new input
is fragile specifically because it only handles the types someone
remembered to write a branch for -- widening the type constraint
without updating every such branch creates exactly this kind of
silent, type-system-invisible bug.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a TypeScript type assertion like `(raw) as T` performs an actual runtime conversion to make the value genuinely match type T, similar to calling `Number()` or `Boolean()`.',
      reality: 'a type assertion does nothing at runtime whatsoever — it only tells the TypeScript compiler to stop checking that value against its inferred type; the actual JavaScript value is whatever the surrounding code computed, unconverted.',
    },
    {
      thought: 'the Select component\'s coercion logic (`typeof value === \'number\' ? Number(raw) : raw`) is a complete, correct implementation for any T that satisfies its own `T extends string | number` constraint.',
      reality: 'it happens to work correctly for exactly that constraint today, but the logic is written by checking the WRONG thing (the CURRENT value\'s typeof) rather than being driven by T itself — it is one constraint-widening change away from silently breaking, with the type system providing no protection against that.',
    },
    {
      thought: 'if this bug were real, it would be immediately obvious — the UI would look broken, or React would throw an error.',
      reality: 'the UI renders and behaves as if it "works" — the dropdown shows the right label, selections register — the only symptom is the wrong VALUE flowing into onChange, which is invisible unless you specifically inspect the type or runtime value of what onChange actually received.',
    },
  ];
}
