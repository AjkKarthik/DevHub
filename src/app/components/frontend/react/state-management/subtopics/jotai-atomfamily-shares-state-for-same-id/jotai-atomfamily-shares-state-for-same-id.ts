import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-jotai-atomfamily-shares-state-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './jotai-atomfamily-shares-state-for-same-id.html',
  styleUrl: './jotai-atomfamily-shares-state-for-same-id.scss',
})
export class JotaiAtomfamilySharesStateForSameIdSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Introduces atomFamily Without Testing Its Core Guarantee',
      points: [
        'The "Jotai atoms" code tab introduces <code>atomFamily</code> as "parameterized atoms": <code>const todoAtom = atomFamily((id: number) =&gt; atom({ id, text: \'\', done: false }));</code>, with a single <code>&lt;TodoItem id={id}&gt;</code> usage example.',
        'The example only ever shows ONE component calling <code>todoAtom(id)</code> per id. The whole point of "family" caching is that calling it AGAIN with the same id should reuse something — but with just one call site shown, that guarantee is never actually put to the test.',
      ],
    },
    {
      heading: 'Why atomFamily Caches by Parameter, Not by Call Site',
      points: [
        '<code>atomFamily((param) =&gt; atom(...))</code> maintains an internal cache keyed by the parameter (<code>id</code> here). The FIRST call with a given <code>id</code> creates a brand-new atom and stores it in that cache. Every SUBSEQUENT call with the exact same <code>id</code> — regardless of which component makes the call, or how many different components make it — returns that SAME cached atom instance, not a fresh one.',
        'This means two completely separate components, each calling <code>useAtom(todoAtom(5))</code> independently with no shared props, wiring, or context between them, are actually reading and writing the exact same underlying atom — they share state automatically, purely because they passed the same parameter value.',
        'This is genuinely different from calling <code>atom({...})</code> directly twice (which always creates two independent atoms) — the caching-by-parameter behavior is the entire reason <code>atomFamily</code> exists instead of just calling <code>atom()</code> inside a loop or a component.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "jotai-atomfamily-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "jotai": "^2.7.0"
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
  <head><title>Jotai atomFamily shared state</title></head>
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
      content: `import { atom, useAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// The main page's own atomFamily pattern, unchanged.
const todoAtom = atomFamily(id => atom({ id, text: 'Task ' + id, done: false }));

function TodoItem({ id, label }) {
  const [todo, setTodo] = useAtom(todoAtom(id));
  return (
    <label style={{ display: 'block', marginBottom: 6 }}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => setTodo(t => ({ ...t, done: !t.done }))}
      />
      {label} -- {todo.text} ({todo.done ? 'done' : 'not done'})
    </label>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h4>Two DIFFERENT ids -- independent components, independent data</h4>
      <TodoItem id={1} label="Widget A" />
      <TodoItem id={2} label="Widget B" />

      <h4>The SAME id (5), rendered by two SEPARATE component instances</h4>
      <TodoItem id={5} label="Widget C" />
      <TodoItem id={5} label="Widget D (different component, same id)" />

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Toggle "Widget A" -- does "Widget B" change? Now toggle
        "Widget C" -- does "Widget D" change too, even though it's a
        totally separate TodoItem instance with no shared props?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Toggle Widget A\'s checkbox — does Widget B change? Now toggle Widget C\'s checkbox — does Widget D change too, even though they\'re separate component instances?',
    hint: 'atomFamily maintains an internal cache keyed by the parameter — two calls with the same id return the exact same underlying atom, no matter how unrelated the calling components are.',
    solution: `Toggling Widget A leaves Widget B completely unaffected -- they use
different ids (1 and 2), so atomFamily created two genuinely separate
atoms, exactly as expected.

Toggling Widget C ALSO toggles Widget D immediately, even though they
are two entirely separate <TodoItem> instances with no props passed
between them, no shared parent state, and no explicit wiring at all.
Both call todoAtom(5) -- the SAME id -- so atomFamily handed both of
them the identical cached atom instance. From Jotai's perspective,
there is only ONE piece of state here, being read by two different
components, not two independent pieces of state that happen to start
with the same shape.

The practical lesson: atomFamily's caching is by VALUE of the
parameter, not by call site or component identity. This is exactly
what makes it useful for things like "one atom per row in a list, but
reused correctly if the same row re-renders or is referenced from
multiple places" -- but it also means two components that pass the
same id are not just "coincidentally similar," they are reading and
writing literally the same state, which can surprise a developer who
expected each <TodoItem> instance to be independent by default.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'each `<TodoItem id={5} />` instance gets its own independent piece of state, similar to how each call to `useState()` inside a component creates independent state per component instance.',
      reality: '`atomFamily(id => atom(...))` caches by the parameter value — two different component instances calling `todoAtom(5)` share the exact same underlying atom and thus the same state, unlike `useState`, which is always scoped per component instance regardless of any argument.',
    },
    {
      thought: 'atomFamily creates a fresh atom every time it\'s called, and the "family" name just refers to a naming/organizational convention for related atoms.',
      reality: 'atomFamily\'s entire purpose is the opposite — it deliberately reuses (caches) the same atom instance for repeated calls with the same parameter, which is precisely what makes it different from calling `atom({...})` directly.',
    },
    {
      thought: 'if two components both need "task 5" data, using atomFamily(5) in both places is a coincidental optimization — using two separate atom() calls instead would produce the same visible behavior, just with slightly more memory use.',
      reality: 'using two separate atom() calls would produce components with INDEPENDENT state that drift apart the moment one is updated — atomFamily(5)\'s shared-instance behavior is a genuine correctness requirement here (both components need to reflect the SAME task), not merely a memory optimization.',
    },
  ];
}
