import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-missing-valueasnumber-breaks-arithmetic-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './missing-valueasnumber-breaks-arithmetic-silently.html',
  styleUrl: './missing-valueasnumber-breaks-arithmetic-silently.scss',
})
export class MissingValueasnumberBreaksArithmeticSilentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #6 Shows the Fix, But Not the Actual Wrong Number It Produces',
      points: [
        'Mistake #6\'s wrong example comments "data.age === \'42\' (string!) — breaks arithmetic and Zod z.number() validation" — a claim about WHAT breaks, but not a concrete demonstration of the actual wrong output. "Breaks arithmetic" could mean an error is thrown, or it could mean something quieter and more dangerous.',
        'This subtopic makes it concrete: adding two "number" inputs together WITHOUT valueAsNumber does not throw an error at all — it silently performs STRING CONCATENATION, producing a plausible-looking but completely wrong number, with no crash, no warning, and no validation failure to catch it (if no resolver is configured).',
      ],
    },
    {
      heading: 'Why "42" + "8" Becomes "428", Not 50',
      points: [
        'HTML input elements of every type — including <code>type="number"</code> — always return their value as a JavaScript string via <code>event.target.value</code>. RHF\'s register() reads this same string-typed value via ref; nothing about type="number" changes the JS-level type of what RHF captures.',
        'JavaScript\'s <code>+</code> operator is overloaded: for two numbers it adds; for two strings (or a string and anything else) it concatenates. "42" + "8" evaluates to "428" (string concatenation), NOT 50 (numeric addition) — a classic, well-known JS gotcha, made specifically dangerous here because a <code>type="number"</code> input LOOKS like it should already be numeric.',
        'This is silent specifically because there is no type system enforcing correctness at runtime unless a resolver (Zod with z.number(), which would reject a string and produce a visible validation error) is actually wired up. Without a resolver, or with a resolver that doesn\'t catch it, the wrong concatenated "value" flows straight into your onSubmit handler and beyond.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "rhf-valueasnumber-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-hook-form": "^7.51.0"
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
  <head><title>valueAsNumber demo</title></head>
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
      content: `import { useForm } from 'react-hook-form';
import { useState } from 'react';

// WITHOUT valueAsNumber -- both inputs return strings.
function PlainNumberForm() {
  const { register, handleSubmit } = useForm({ defaultValues: { a: '', b: '' } });
  const [result, setResult] = useState(null);

  function onSubmit(data) {
    setResult({
      typeofA: typeof data.a,
      typeofB: typeof data.b,
      sum: data.a + data.b,     // '+' on two strings -- concatenation, not addition
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
      <h3>Without valueAsNumber</h3>
      <input type="number" {...register('a')} placeholder="First number" />
      {' + '}
      <input type="number" {...register('b')} placeholder="Second number" />
      <button type="submit">Add them</button>
      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </form>
  );
}

// WITH valueAsNumber -- both inputs return real numbers.
function ValueAsNumberForm() {
  const { register, handleSubmit } = useForm({ defaultValues: { a: '', b: '' } });
  const [result, setResult] = useState(null);

  function onSubmit(data) {
    setResult({
      typeofA: typeof data.a,
      typeofB: typeof data.b,
      sum: data.a + data.b,     // '+' on two real numbers -- actual addition
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ border: '1px solid #ccc', padding: 12 }}>
      <h3>With valueAsNumber: true</h3>
      <input type="number" {...register('a', { valueAsNumber: true })} placeholder="First number" />
      {' + '}
      <input type="number" {...register('b', { valueAsNumber: true })} placeholder="Second number" />
      <button type="submit">Add them</button>
      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </form>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>Enter 42 and 8 in BOTH forms, then submit each and compare the sum.</p>
      <PlainNumberForm />
      <ValueAsNumberForm />
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Enter 42 and 8 into both forms\' two number inputs and submit each. What does "sum" show in each result, and what are typeofA/typeofB?',
    hint: 'JavaScript\'s + operator concatenates when both operands are strings — check whether type="number" on the <input> actually changes the JS type RHF captures.',
    solution: `Without valueAsNumber: typeofA and typeofB are both "string", and
sum shows "428" -- the two strings "42" and "8" were concatenated,
not added. There is no error, no warning, nothing visually wrong
about the form itself -- just a silently incorrect result that
LOOKS like it could plausibly be a real number if you weren't
specifically checking.

With valueAsNumber: true: typeofA and typeofB are both "number", and
sum correctly shows 50 -- genuine numeric addition, because register's
valueAsNumber option converts the string from event.target.value into
a real number before RHF stores it.

This confirms the theory section's claim precisely: type="number" on
the <input> element is purely a BROWSER UI hint (numeric keyboard on
mobile, up/down spinner arrows, basic format validation) -- it has
zero effect on the JavaScript type of the value RHF actually
receives via register(). The only way to get a real number out of
RHF is valueAsNumber: true (or z.coerce.number() if using a Zod
resolver, which also produces a validation ERROR for genuinely
non-numeric input, unlike plain valueAsNumber which produces NaN
silently for invalid input like "abc").`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '&lt;input type="number"&gt; automatically makes the value a JavaScript number, since the input itself only accepts numeric characters.',
      reality: 'type="number" is purely a browser UI/UX hint — event.target.value (and therefore what RHF\'s register() captures via ref) is ALWAYS a string, regardless of the input\'s type attribute.',
    },
    {
      thought: 'if a form performs arithmetic on unconverted string values from number inputs, it will throw a visible error or produce NaN, making the bug obvious immediately.',
      reality: 'JavaScript\'s + operator concatenates two strings rather than throwing — "42" + "8" silently produces "428", a plausible-LOOKING but completely wrong result with no error, warning, or NaN to signal anything went wrong.',
    },
    {
      thought: 'adding a Zod schema with z.number() automatically fixes this, since Zod validates types.',
      reality: 'z.number() on its own REJECTS a string input with a validation error rather than converting it — this catches the bug (visibly, as a validation error) but does not silently fix it into a working number the way valueAsNumber or z.coerce.number() does.',
    },
  ];
}
