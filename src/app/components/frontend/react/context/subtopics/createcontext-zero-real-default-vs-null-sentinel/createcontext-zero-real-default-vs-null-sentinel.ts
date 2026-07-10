import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-createcontext-zero-real-default-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './createcontext-zero-real-default-vs-null-sentinel.html',
  styleUrl: './createcontext-zero-real-default-vs-null-sentinel.scss',
})
export class CreatecontextZeroRealDefaultVsNullSentinelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Uses Two Completely Different defaultValue Strategies',
      points: [
        'Every OTHER context on this page — <code>ThemeContext</code>, <code>AuthContext</code>, <code>UserContext</code>, the Todo <code>StateCtx</code>/<code>DispatchCtx</code> — is created with <code>createContext(null)</code> or <code>createContext&lt;T | null&gt;(null)</code>, paired with a custom hook that throws if the resolved value is <code>null</code>. <code>null</code> here is a deliberate ERROR SENTINEL, not a usable value.',
        'The "Nested providers" tab does something different: <code>const LevelContext = createContext(0);</code> — and <code>Heading</code>/<code>Section</code> consume it directly with <code>useContext(LevelContext)</code>, no null check, no throwing custom hook. <code>0</code> here is used as a genuinely FUNCTIONAL fallback, not an error signal. This subtopic tests what that difference actually means for a component rendered with zero wrapping Providers.',
      ],
    },
    {
      heading: 'Why the Same API Supports Two Opposite Design Intents',
      points: [
        '<code>createContext(defaultValue)</code> always behaves identically at the mechanical level: a consumer with no Provider ancestor gets exactly <code>defaultValue</code>, no error, no exception. What differs is entirely up to the CONSUMING code\'s choice of default value and whether it adds its own guard.',
        'For <code>LevelContext</code>, using <code>0</code> as the default is exactly right: a <code>&lt;Heading&gt;</code> rendered with NO wrapping <code>&lt;Section&gt;</code> at all is semantically "top-level" — level <code>0</code> is a perfectly valid, meaningful value, so <code>&lt;Heading&gt;</code> renders as an <code>&lt;h1&gt;</code> with no error and no Provider required anywhere.',
        'For <code>UserContext</code>/<code>AuthContext</code>/etc., there is no meaningful "default user" — rendering <code>&lt;Profile&gt;</code> with no <code>&lt;UserProvider&gt;</code> is a real bug, so those contexts intentionally use <code>null</code> as a value that can never legitimately occur, paired with a throw, specifically to convert a silent wrong-render into a loud, immediate error.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "createcontext-default-strategies-demo",
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
  <head><title>createContext default strategies</title></head>
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

// The main page's own LevelContext -- a REAL usable default.
const LevelContext = createContext(0);

function Section({ children }) {
  const level = useContext(LevelContext);
  return (
    <LevelContext.Provider value={level + 1}>
      <section style={{ paddingLeft: level * 16 }}>{children}</section>
    </LevelContext.Provider>
  );
}

function Heading({ children }) {
  const level = useContext(LevelContext);
  const Tag = 'h' + Math.min(level + 1, 6);
  return <Tag>{children} (level={level})</Tag>;
}

// The main page's own UserContext pattern -- null as an ERROR SENTINEL.
const UserContext = createContext(null);
function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside a UserContext.Provider');
  return ctx;
}
function Profile() {
  const user = useUser(); // throws if there's no Provider ancestor
  return <p>{user.name}</p>;
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      {/* Heading rendered with ZERO wrapping Sections -- no Provider at all */}
      <Heading>Top-level heading, no Section wrapper</Heading>

      <Section>
        <Heading>Nested once</Heading>
      </Section>

      {/* Uncomment to compare -- Profile rendered with NO UserContext.Provider: */}
      {/* <Profile /> */}
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The first Heading has no wrapping Section at all. Does it render correctly, or does something break? Then uncomment `<Profile />` at the bottom — what happens now?',
    hint: 'LevelContext\'s default (0) is a genuinely meaningful value for "no nesting" — UserContext\'s default (null) is a sentinel specifically chosen to be an invalid value for real use.',
    solution: `The first Heading renders fine as an <h1> showing "level=0" -- with
NO Provider anywhere above it. createContext(0)'s default isn't an
error case here; it's the correct, intended value for "not nested in
any Section."

Uncommenting <Profile /> throws immediately: "useUser must be used
inside a UserContext.Provider" -- a real runtime error, by design.
UserContext's null default was never meant to be usable; useUser()
exists specifically to convert that null into a loud failure instead
of letting user.name silently crash with a much less clear TypeError,
or worse, silently render wrong/missing data.

The practical lesson: createContext(defaultValue) doesn't tell you
anything on its own about whether a Provider is required. That's a
design decision made by whoever wrote the context: LevelContext chose
a default that makes the "no Provider" case a legitimate, working
state; UserContext chose a default that makes the "no Provider" case
a deliberate, immediate crash. Reading a context's default value is
how you can tell which category it falls into before using it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a context created with `createContext(null)` and one created with `createContext(0)` behave differently at the React level — one requires a Provider and the other doesn\'t.',
      reality: '`createContext` behaves identically either way — a consumer with no Provider ancestor always gets exactly the passed default value, with no error. The difference is entirely in whether the CONSUMING code (a custom hook, typically) treats that default as usable or throws on it.',
    },
    {
      thought: 'every context on this page follows the same "throw if no Provider" convention — the null + custom-hook-guard pattern is the ONE correct way to use context.',
      reality: 'the `LevelContext` example deliberately does the opposite — its default (`0`) is a fully legitimate, working value for the "no Section wrapper" case, and adding a throwing guard there would break the intentional "headings work fine even at the top level" behavior.',
    },
    {
      thought: 'if a component using `useContext` doesn\'t crash when rendered without a Provider, that means the developer forgot to add the null-check pattern the main page recommends.',
      reality: 'not crashing can be entirely intentional — it depends on whether the context\'s default value represents a real, valid state (like `LevelContext`\'s `0`) or an impossible one (like `UserContext`\'s `null`, which is only ever reached by mistake).',
    },
  ];
}
