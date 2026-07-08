import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-zod-coerce-number-empty-string-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './zod-coerce-number-empty-string.html',
  styleUrl: './zod-coerce-number-empty-string.scss',
})
export class ZodCoerceNumberEmptyStringSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Fix Only Ever Shows a Filled-In Value',
      points: [
        'Mistake #6 fixes <code>z.number()</code> failing on HTML input strings with: <code>z.coerce.number().min(1, \'Must be at least 1\')</code> — demonstrated with <code>"25" → 25</code>, a value the user actually typed.',
        'A number input can also be EMPTY — the natural state when a user clears the field, or before they type anything. What does <code>z.coerce.number()</code> do with <code>""</code> specifically? Does it fail the same way plain <code>z.number()</code> failed on a string, or does it produce something else entirely?',
      ],
    },
    {
      heading: 'Why an Empty Number Field Silently Becomes Zero',
      points: [
        '<code>z.coerce.number()</code> works by calling JavaScript\'s <code>Number()</code> constructor on the input before validating. <code>Number("25")</code> is <code>25</code>, as the main page\'s fix relies on — but <code>Number("")</code> is a famous JavaScript quirk: it evaluates to <code>0</code>, not <code>NaN</code> and not an error.',
        'This means an EMPTY number input coerces cleanly to the number <code>0</code>, which then flows into whatever <code>min</code>/<code>max</code> checks the schema defines. <code>z.coerce.number().min(1)</code> correctly rejects it (0 fails min(1)) — but <code>z.coerce.number().min(0)</code>, or a schema with no minimum at all, lets an EMPTY field through as a perfectly valid <code>0</code>, indistinguishable from a user who deliberately typed "0".',
        'This is a real gap the main page\'s single "25 → 25" example never surfaces: coercion doesn\'t just convert user input, it also converts the ABSENCE of input into a specific, silently-accepted value.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "zod-coerce-empty-string-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "zod": "^3.22.4"
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
  <head><title>z.coerce.number() and empty strings</title></head>
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
import { z } from 'zod';

// The main page's own schema shape, with min(0) instead of min(1) --
// a very easy, realistic variation (e.g. "quantity can be zero or more").
const schemaMinZero = z.object({ age: z.coerce.number().min(0) });

// The main page's own exact schema.
const schemaMinOne = z.object({ age: z.coerce.number().min(1, 'Must be at least 1') });

export default function App() {
  const [input, setInput] = useState('');

  const resultMinZero = schemaMinZero.safeParse({ age: input });
  const resultMinOne = schemaMinOne.safeParse({ age: input });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <label>
        Age input (try clearing it completely):{' '}
        <input value={input} onChange={e => setInput(e.target.value)} />
      </label>

      <p>Raw input value: {JSON.stringify(input)}</p>

      <p>
        z.coerce.number().min(0) result:{' '}
        {resultMinZero.success
          ? 'VALID, coerced age = ' + JSON.stringify(resultMinZero.data.age)
          : 'invalid: ' + resultMinZero.error.issues[0].message}
      </p>

      <p>
        z.coerce.number().min(1) result (the main page's exact schema):{' '}
        {resultMinOne.success
          ? 'VALID, coerced age = ' + JSON.stringify(resultMinOne.data.age)
          : 'invalid: ' + resultMinOne.error.issues[0].message}
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Clear the input completely (empty string). Compare the two results — does min(0) accept the empty field as valid? Does min(1) also accept it?',
    hint: '`Number("")` evaluates to `0` in JavaScript — `z.coerce.number()` uses exactly this conversion before running any min/max checks.',
    solution: `With the input cleared, both schemas coerce "" to the number 0 --
confirmed by the "coerced age" value shown when a result is valid.

min(0) reports VALID, coerced age = 0 -- the empty field is silently
accepted as a legitimate age of zero, with no way to distinguish it
from a user who actually typed "0".

min(1) (the main page's own exact schema) correctly reports invalid --
but only because 0 happens to fail that specific threshold, not
because Zod recognizes the field as "empty" or "missing" in any way.

The practical lesson: z.coerce.number() has no concept of "required
but empty" -- it converts the empty string to 0 just like any other
coercion, and validation success or failure from there on is purely
about whether 0 happens to satisfy the schema's numeric constraints.
For a genuinely required numeric field, pair z.coerce.number() with an
explicit check that also rejects the empty string BEFORE coercion --
e.g. z.string().min(1, 'Required').pipe(z.coerce.number()) -- rather
than relying on min()/max() thresholds to incidentally catch it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`z.coerce.number()` treats an empty string input the same way it would treat genuinely missing or undefined data — rejecting it as invalid regardless of the schema\'s min/max constraints.',
      reality: '`z.coerce.number()` converts an empty string to the number `0` via JavaScript\'s `Number("")` behavior — whether that\'s accepted or rejected depends entirely on whether `0` happens to satisfy the schema\'s own numeric constraints, not on any "empty" detection.',
    },
    {
      thought: 'a schema like `z.coerce.number().min(1)` is a safe, general pattern for "required positive number" fields — since the main page\'s own example uses exactly this pattern successfully.',
      reality: 'that specific example only works because `1` happens to be greater than `0` — the exact same pattern with `min(0)`, or with no minimum bound at all, silently lets an empty field through as a valid zero.',
    },
    {
      thought: 'if a required numeric field is left empty, submitting the form will show a clear "this field is required" error, since Zod validation runs before submission.',
      reality: 'depending on the schema\'s bounds, an empty numeric field can coerce straight through to a valid `0` with no error at all — a genuinely required field needs an explicit non-empty check, not just numeric bounds, to actually catch this case.',
    },
  ];
}
