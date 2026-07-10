import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-simpleinput-optional-onchange-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './simpleinput-optional-onchange-creates-readonly-input.html',
  styleUrl: './simpleinput-optional-onchange-creates-readonly-input.scss',
})
export class SimpleinputOptionalOnchangeCreatesReadonlyInputSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Type Signature Marks onChange Optional, But value Still Flows Through',
      points: [
        'The <code>SimpleInput</code> example types <code>onChange</code> as OPTIONAL: <code>{ onChange?: (value: string) =&gt; void }</code>. Its implementation does: <code>onChange={onChange ? e =&gt; onChange(e.target.value) : undefined}</code> — when no <code>onChange</code> is supplied, the rendered <code>&lt;input&gt;</code> gets a literal <code>onChange={undefined}</code>.',
        'Meanwhile, <code>value</code> flows through completely untouched via <code>...rest</code> — <code>ComponentPropsWithoutRef&lt;\'input\'&gt;</code> includes the native <code>value</code> prop, and nothing in <code>SimpleInput</code>\'s own code treats it specially. This subtopic tests what happens when a consumer passes <code>value</code> (making the input controlled) WITHOUT also passing <code>onChange</code> — a combination the TYPE SYSTEM fully permits, since <code>onChange</code> is optional.',
      ],
    },
    {
      heading: 'Why "Optional" in the Type Doesn\'t Mean "Optional" for React\'s Own DOM Rules',
      points: [
        'TypeScript\'s <code>onChange?:</code> only describes what values are ALLOWED for that prop from a type-checking perspective — it says nothing about React\'s own runtime rules for how <code>&lt;input value=...&gt;</code> is expected to behave.',
        'React has an independent, unrelated rule: an <code>&lt;input&gt;</code> that receives a <code>value</code> prop is a CONTROLLED input — React expects something to be listening for changes and updating that value, normally via <code>onChange</code>. An <code>&lt;input value="x" onChange={undefined}&gt;</code> satisfies TypeScript\'s type completely, but violates React\'s own controlled-input contract: the user can\'t actually type anything, since no handler exists to update the value the DOM keeps getting reset to.',
        'The type system and React\'s runtime behavior are two SEPARATE sets of rules here — <code>onChange?:</code> being valid TypeScript says nothing about whether the resulting rendered DOM element will behave sensibly. A perfectly type-safe call to <code>SimpleInput</code> can still produce a broken, unusable, read-only-looking input, and TypeScript has no way to catch it because from its perspective, nothing is wrong.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "simpleinput-optional-onchange-demo",
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
  <head><title>SimpleInput optional onChange</title></head>
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

// The main page's own SimpleInput, unchanged.
function SimpleInput({ onChange, ...rest }) {
  return <input {...rest} onChange={onChange ? e => onChange(e.target.value) : undefined} />;
}

export default function App() {
  const [text] = useState('Hello');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>Try typing into this input:</p>
      {/* value is passed (controlled), but onChange is deliberately
          NOT passed -- a combination the type system fully allows,
          since onChange is optional. */}
      <SimpleInput value={text} placeholder="Try typing here..." />

      <p style={{ marginTop: 16 }}>Open the browser console. Any warnings?</p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Try clicking into the input and typing a character. Does the text change? Open the browser console — do you see any React warnings?',
    hint: 'React treats an input with a value prop as controlled, regardless of whether an onChange handler is attached — TypeScript\'s onChange?: only describes what the TYPE allows, not what React\'s own DOM behavior requires.',
    solution: `Typing into the input does absolutely nothing -- every keystroke is
immediately reverted, since value is pinned to the fixed text state
and nothing (no onChange) is listening to update it. The input LOOKS
interactive but is effectively read-only.

The browser console shows a real React warning: "Warning: You
provided a value prop to a form field without an onChange handler.
This will render a read-only field. If the field should be mutable
use defaultValue. Otherwise, set either onChange or readOnly." -- a
genuine runtime signal that something is wrong, completely
independent of TypeScript, which never flagged anything because
onChange?: (value: string) => void; being omitted is perfectly valid
according to its own type.

This confirms the gap directly: SimpleInput's type signature says
"onChange is optional," and that is TRUE as a type-level statement --
omitting it type-checks fine. But React's own DOM-level contract for
controlled inputs is a completely separate, unrelated rule that the
type system has no visibility into at all. A caller can write
perfectly type-safe code and still ship an input the user cannot
actually use.

The practical lesson: making a prop optional in a TypeScript type is
purely a type-level decision — it says nothing about whether that
combination of props makes sense at the React/DOM level. For a
wrapper like SimpleInput, either onChange should be required whenever
value is present (harder to express cleanly with plain optional
props), or the component should defensively warn/handle the
value-without-onChange case itself, since TypeScript will never catch
it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'marking `onChange?:` as optional in SimpleInput\'s type means it is always safe to omit — if it were dangerous to omit in some situations, TypeScript would require it in those cases.',
      reality: 'TypeScript types describe shape and presence, not context-dependent runtime rules — it has no way to express "onChange is required ONLY when value is also passed," so it allows the combination completely, even though React\'s own runtime behavior treats it as a real problem.',
    },
    {
      thought: 'if passing value without onChange to SimpleInput caused an actual bug, TypeScript\'s type-checking would have caught it, since the whole point of typing components is to catch this kind of mistake.',
      reality: 'this specific bug lives entirely at the React/DOM runtime level, in a rule TypeScript\'s type system has no representation for — TypeScript successfully catches shape mismatches (wrong prop types, missing required props) but has no mechanism for "these two optional props have an unsafe combination."',
    },
    {
      thought: 'React only warns about missing onChange handlers for native `<input>` elements written directly in JSX — a wrapper component like SimpleInput that adds its own logic around onChange would be exempt from this warning.',
      reality: 'the warning is triggered by the actual rendered DOM element having a value prop and no functioning onChange, regardless of how many wrapper components sit between the JSX author and the final `<input>` — SimpleInput\'s own onChange ? ... : undefined logic still results in a plain `<input value=... onChange={undefined}>` at the DOM level.',
    },
  ];
}
