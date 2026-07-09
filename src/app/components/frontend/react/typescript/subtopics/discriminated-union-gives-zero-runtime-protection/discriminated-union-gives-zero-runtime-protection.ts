import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-discriminated-union-zero-runtime-protection-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './discriminated-union-gives-zero-runtime-protection.html',
  styleUrl: './discriminated-union-gives-zero-runtime-protection.scss',
})
export class DiscriminatedUnionGivesZeroRuntimeProtectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Calls This TypeScript\'s "Superpower" Without a Boundary Note',
      points: [
        'The theory section says: "Discriminated unions are the TypeScript superpower for variant props... TypeScript narrows the type correctly based on <code>kind</code>." The <code>Alert</code> example shows <code>props.code</code> only accessed inside <code>props.kind === \'error\'</code>, and TypeScript genuinely does enforce this at compile time for code written against the type.',
        'This subtopic tests a different question entirely: what happens when the OBJECT ITSELF, at runtime, doesn\'t actually match its claimed shape — e.g. an object with <code>kind: \'info\'</code> that ALSO happens to carry a <code>code</code> field, the way a real API response or a JSON.parse\'d value might?',
      ],
    },
    {
      heading: 'Why Narrowing Is a Compile-Time Promise About AUTHORED Code, Not Runtime Data',
      points: [
        'Discriminated union narrowing works by TypeScript\'s compiler tracking which branch of an <code>if</code>/<code>switch</code>/<code>&&</code> you\'re inside, and restricting what fields it will let you ACCESS in that branch. This is purely a static analysis of the SOURCE CODE — it has zero connection to what a specific object actually contains once the program is running.',
        'If a value arrives from OUTSIDE TypeScript\'s type-checking — <code>JSON.parse(apiResponse)</code>, a prop passed from a plain-JS caller, a value cast with <code>as AlertProps</code> — TypeScript has no way to verify the object really has the shape it claims. The type system trusts the annotation completely; it never inserts a runtime check.',
        'So an object like <code>{ kind: \'info\', message: \'Hi\', code: 500 }</code> — which VIOLATES the union (the <code>info</code> variant has no <code>code</code> field) — passes straight through as a normal JavaScript object. If it reaches the <code>Alert</code> component, the component\'s own runtime logic (<code>props.kind === \'error\' &amp;&amp; ...</code>) just checks the actual, real value of <code>kind</code> — since it\'s <code>\'info\'</code>, the code branch doesn\'t render, but nothing detects or complains about the presence of the "impossible" extra <code>code</code> field.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "discriminated-union-runtime-demo",
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
  <head><title>Discriminated unions and runtime data</title></head>
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
      content: `// The main page's own Alert component, unchanged.
function Alert(props) {
  const colors = { info: '#0ea5e9', warning: '#f59e0b', error: '#ef4444' };
  return (
    <div style={{ padding: 12, background: colors[props.kind] + '22', border: '1px solid ' + colors[props.kind], borderRadius: 6, marginBottom: 8 }}>
      <strong>{props.kind.toUpperCase()}</strong>: {props.message}
      {props.kind === 'error' && <span> (code {props.code})</span>}
      {props.kind === 'warning' && props.dismissible && <button style={{ float: 'right' }}>x</button>}
    </div>
  );
}

// A perfectly "legal" union member -- TypeScript would accept this.
const validInfoAlert = { kind: 'info', message: 'Saved successfully' };

// Simulating data that arrived from OUTSIDE TypeScript's own type-checking
// -- e.g. JSON.parse(apiResponse) -- claiming to be 'info' but ALSO
// carrying a 'code' field, which the info variant of AlertProps says
// should be impossible.
const malformedAlert = JSON.parse('{"kind":"info","message":"Weird one","code":500}');

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <Alert {...validInfoAlert} />
      <Alert {...malformedAlert} />
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        malformedAlert claims kind: 'info' -- a shape the AlertProps
        union says can never have a code field. Does React crash, warn,
        or just quietly render it? Does the extra code field show up
        anywhere, or get silently ignored?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both alerts render on the page. The second one (malformedAlert) violates the discriminated union\'s own contract by claiming kind "info" while also carrying a code field. Does React crash, warn, or just render it?',
    hint: 'Discriminated union narrowing is a compile-time analysis of authored code — it has no way to verify the actual shape of a value that arrives from outside TypeScript\'s own type-checking, like a JSON.parse result.',
    solution: `Both alerts render without any crash, warning, or visible error.
The malformed one shows "INFO: Weird one" -- exactly like a normal,
valid info alert -- with the extra code: 500 field completely
invisible in the output, silently present on the object but never
read by the component's own runtime logic (since props.kind ===
'error' is false, that branch never touches props.code at all).

This confirms the union type's own contract -- "info alerts never
have a code field" -- was never actually checked against this
specific object. AlertProps as a TYPE only constrains code written
INSIDE TypeScript's type-checked source; the moment a value crosses
a boundary TypeScript doesn't see through (JSON.parse, an API
response, a prop from plain-JS code, an "as AlertProps" cast), that
constraint evaporates completely. The object is just a normal
JavaScript object with three fields, and Alert's own render logic
only ever asks "is kind currently 'error'?" -- a real, honest runtime
check that has nothing to do with whether the REST of the object's
shape is "valid" by the union's rules.

The practical lesson: discriminated unions genuinely prevent a
mistake like "accidentally reading props.code inside the info
branch" while you're WRITING TypeScript code — that protection is
real and valuable. But they provide zero defense against malformed
data arriving at runtime from outside the type system. For data
crossing that boundary (API responses, localStorage, URL params),
runtime validation (a schema library, a manual shape check) is a
completely separate concern the type system cannot substitute for.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a discriminated union like AlertProps guarantees that any object with kind: "info" actually never has a code field, anywhere the object might come from — API responses, JSON.parse, or any other source.',
      reality: 'the guarantee only applies to values TypeScript itself type-checked when they were created — a JSON.parse\'d object, or any value crossing a boundary TypeScript doesn\'t see through, can have literally any shape at runtime, and the union type provides zero verification.',
    },
    {
      thought: 'if a component receives props that violate its own TypeScript-declared union type, something in React or the JavaScript runtime would catch and report the mismatch.',
      reality: 'neither React nor plain JavaScript has any concept of the TypeScript type at runtime — types are fully erased during compilation, so a "malformed" object is, at runtime, just an ordinary object with whatever fields it happens to have.',
    },
    {
      thought: 'the fix for accepting genuinely untrusted data (API responses, JSON.parse results) into a component typed with a discriminated union is to add more specific TypeScript types or stricter interfaces.',
      reality: 'more precise TypeScript types add zero runtime safety by themselves — actually validating untrusted data requires a runtime validation step (a schema library like Zod, or explicit manual checks) that inspects the ACTUAL value, something the type system cannot do since it doesn\'t exist anymore once the code is running.',
    },
  ];
}
