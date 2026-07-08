import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-usecontext-defaultvalue-skipped-by-undefined-provider-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './usecontext-defaultvalue-undefined-provider.html',
  styleUrl: './usecontext-defaultvalue-undefined-provider.scss',
})
export class UsecontextDefaultvalueUndefinedProviderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Wording Leaves the Boundary Ambiguous',
      points: [
        'The theory section says: "<code>defaultValue</code> (passed to <code>createContext</code>) is only used when a component consumes the context outside any Provider." The word "outside" is doing a lot of work here — does it mean "no Provider ancestor exists at all," or could it also cover "a Provider exists but its value happens to be falsy/undefined"?',
        'The page separately recommends: "For required contexts, pass <code>undefined</code> and throw in the custom hook if ctx is undefined" — implying a Provider CAN legitimately pass <code>undefined</code> as a real value. This subtopic tests exactly what a consumer sees in that specific case, compared to having no Provider at all.',
      ],
    },
    {
      heading: 'Why defaultValue Is About Provider PRESENCE, Not Value Truthiness',
      points: [
        '<code>useContext</code> walks up the component tree looking for the nearest matching <code>&lt;Context.Provider&gt;</code> ancestor. <code>defaultValue</code> is used ONLY if that walk finds no Provider at all — it is a fallback for "you forgot to wrap this in a Provider," not a fallback for "the Provider\'s value happens to be falsy."',
        'If a Provider IS present in the tree — even one explicitly written as <code>&lt;MyContext.Provider value={undefined}&gt;</code> — <code>useContext</code> returns exactly that <code>undefined</code> value. <code>defaultValue</code> is never consulted, because from React\'s perspective a Provider ancestor was found; its value is simply <code>undefined</code>, not "missing."',
        'This is exactly why the main page\'s own "required contexts" pattern works: a real Provider passing a genuine value flows through untouched, while a consumer rendered with NO Provider ancestor at all falls back to <code>defaultValue</code> (commonly set to <code>undefined</code> specifically so the custom hook\'s guard clause can distinguish the two).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "usecontext-defaultvalue-demo",
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
  <head><title>useContext defaultValue boundary</title></head>
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
      content: `import { createContext, useContext } from 'react';

const MyContext = createContext('DEFAULT_VALUE');

function ConsumerNoProvider() {
  // Rendered with NO Provider ancestor at all.
  const val = useContext(MyContext);
  return <p>No Provider ancestor: {String(val)}</p>;
}

function ConsumerUndefinedProvider() {
  // Rendered INSIDE a Provider that explicitly passes value={undefined}.
  const val = useContext(MyContext);
  return <p>Provider present, value={'{undefined}'}: {String(val)}</p>;
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <ConsumerNoProvider />

      <MyContext.Provider value={undefined}>
        <ConsumerUndefinedProvider />
      </MyContext.Provider>

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Both consumers should logically get "no real value" -- but do
        they actually show the same thing? Compare the two lines above.
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Compare the two rendered lines. The first consumer has no Provider ancestor at all; the second sits inside a Provider that explicitly passes `value={undefined}`. Do they show the same text?',
    hint: '`useContext` only falls back to `defaultValue` when no Provider ancestor is found at all — a Provider that is present, even with an `undefined` value, is still "found."',
    solution: `ConsumerNoProvider shows "DEFAULT_VALUE" -- with no Provider
ancestor anywhere above it, useContext falls back to the value passed
to createContext.

ConsumerUndefinedProvider shows "undefined" -- NOT "DEFAULT_VALUE" --
even though its Provider's value is, in a sense, "no real value
either." A Provider ancestor was found, so React uses exactly the
value that Provider passed, which happens to be undefined. The
defaultValue fallback is never consulted here.

This confirms the main page's "required contexts" pattern precisely:
a custom hook can safely do "if (ctx === undefined) throw new
Error(...)" to detect a missing Provider, specifically BECAUSE
useContext distinguishes "no Provider found, use defaultValue" from
"a Provider was found, and it happens to have passed undefined" --
these are two genuinely different code paths inside React, not two
descriptions of the same outcome.

The practical lesson: defaultValue is a "you forgot the Provider"
safety net, not a general-purpose fallback for a falsy or unset
context value. If a real Provider is present anywhere above a
consumer, its exact value -- however falsy -- always wins.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`useContext` falls back to `defaultValue` whenever the resolved context value is falsy (`undefined`, `null`, `0`, empty string) — the check is about the VALUE, not whether a Provider exists.',
      reality: '`useContext` falls back to `defaultValue` ONLY when no Provider ancestor is found in the tree at all — a present Provider\'s value, however falsy, is always used exactly as passed.',
    },
    {
      thought: 'writing `<MyContext.Provider value={undefined}>` is functionally the same as not rendering a Provider at all, since both result in `useContext` seeing "no value."',
      reality: 'they are genuinely different from React\'s perspective — one has a Provider ancestor (so `defaultValue` is skipped entirely) and the other does not (so `defaultValue` is used) — this is exactly the distinction the main page\'s "required contexts" pattern relies on.',
    },
    {
      thought: 'the "for required contexts, pass undefined and throw in the custom hook" pattern the main page recommends works by comparing the resolved value against `defaultValue`.',
      reality: 'it actually works by comparing the resolved value against `undefined` specifically — `defaultValue` itself is typically also set to `undefined` so that both "missing Provider" and "the guard clause\'s expected sentinel" line up, but the underlying mechanism is Provider presence, not a comparison to `defaultValue`.',
    },
  ];
}
