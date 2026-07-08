import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-rtk-mutating-useselector-value-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './rtk-mutating-useselector-value-directly-fails-silently.html',
  styleUrl: './rtk-mutating-useselector-value-directly-fails-silently.scss',
})
export class RtkMutatingUseselectorValueDirectlyFailsSilentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Teaches "You Can Mutate Directly" Without a Boundary',
      points: [
        'Mistake #5\'s fix says: "RTK uses Immer under the hood... you can safely mutate state directly in reducers (<code>state.count++</code>)". Quiz Q7 repeats it: "your mutations are tracked and produce a new immutable state."',
        'The word "safely" and the phrase "mutate state directly" never specify WHERE this is safe — only inside a reducer, or anywhere you can get your hands on a piece of Redux state? This subtopic tests what happens when the exact same "just mutate it" instinct is applied to the object returned by <code>useSelector</code>, outside any reducer.',
      ],
    },
    {
      heading: 'Why Immer\'s Safety Only Exists Inside a Reducer',
      points: [
        'Immer\'s "mutate directly" magic works because <code>createSlice</code> wraps every reducer call in <code>produce()</code>, which hands the reducer a special Proxy-wrapped DRAFT object. Every mutation on that draft is recorded and replayed to build a genuinely new, immutable state object when the reducer returns — the actual store state was never touched directly.',
        '<code>useSelector</code> returns the REAL, already-resolved state value — a plain JavaScript object, not an Immer draft, and not wrapped in any Proxy. There is no producer running, no draft being tracked, and no new state object waiting to be built.',
        'Mutating that plain object directly (<code>selectedTodo.done = true</code>) changes the actual field in memory — the mutation genuinely happens — but Redux has no way of knowing the state changed, because the store\'s state REFERENCE never changed. Components subscribed via <code>useSelector</code> compare by reference and see no difference, so no re-render fires, even though the underlying data is now different from what a fresh read would show.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "rtk-useselector-mutation-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@reduxjs/toolkit": "^2.2.1",
    "react-redux": "^9.1.0"
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
  <head><title>Mutating a useSelector value directly</title></head>
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
      content: `import { createSlice, configureStore } from '@reduxjs/toolkit';
import { useSelector, useDispatch, Provider } from 'react-redux';

const todoSlice = createSlice({
  name: 'todo',
  initialState: { text: 'Buy milk', done: false },
  reducers: {
    // The main page's own "safe" Immer mutation, INSIDE a reducer.
    toggleViaReducer: state => { state.done = !state.done; },
  },
});
const { toggleViaReducer } = todoSlice.actions;
const store = configureStore({ reducer: { todo: todoSlice.reducer } });

function TodoDisplay() {
  const todo = useSelector(s => s.todo);
  const dispatch = useDispatch();

  // The SAME "just mutate it" instinct, applied OUTSIDE a reducer,
  // directly to the plain object useSelector returned.
  const toggleViaDirectMutation = () => { todo.done = !todo.done; };

  return (
    <div>
      <p>{todo.text}: {todo.done ? 'done' : 'not done'}</p>
      <button onClick={() => dispatch(toggleViaReducer())}>
        Toggle via reducer (the main page's pattern)
      </button>
      <button onClick={toggleViaDirectMutation}>
        Toggle via direct mutation (same instinct, outside a reducer)
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
        <TodoDisplay />
        <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
          Click each button once. Does the displayed text ("done" /
          "not done") update after EACH button, or only one of them?
        </p>
      </div>
    </Provider>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Toggle via reducer" once — does the display update? Now click "Toggle via direct mutation" once — does the display update this time?',
    hint: 'useSelector compares state by REFERENCE — Immer\'s mutation tracking only exists inside a reducer\'s draft proxy, not on the plain object useSelector hands back.',
    solution: `Clicking "Toggle via reducer" updates the display immediately --
this is the main page's own pattern working exactly as described.
Immer's produce() built a genuinely new state object behind the
scenes, so useSelector's reference comparison correctly detects a
change and re-renders.

Clicking "Toggle via direct mutation" does NOT update the display --
even though the underlying todo.done field genuinely did flip in
memory (confirmable by then clicking "Toggle via reducer", which will
now start from the mutated value, proving the direct mutation really
happened). useSelector's reference comparison sees the exact same
object reference as before, since nothing replaced it, so React
never re-renders to show the new value.

The practical lesson: "you can mutate state directly in RTK" is true
ONLY inside a reducer function, where createSlice's Immer wrapper is
actively tracking a draft. The instant you have a plain state value
in your hands -- from useSelector, from getState(), from destructuring
props -- Immer's magic is gone, and directly mutating it is a real bug:
the data changes, but nothing re-renders to reflect it, producing a UI
that has silently drifted out of sync with the store's actual contents.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RTK\'s "you can mutate state directly" capability, via Immer, applies to Redux state in general — any object obtained from the store, including one returned by useSelector, can be safely mutated the same way.',
      reality: 'Immer\'s mutation tracking only exists inside the Proxy-wrapped draft object a reducer receives — useSelector returns the plain, already-resolved state, which has no such tracking and mutating it directly is a genuine, silent bug.',
    },
    {
      thought: 'if a direct mutation of a useSelector value doesn\'t crash or throw an error, it must have worked correctly, the same way the reducer-based mutation did.',
      reality: 'the mutation does succeed at the raw JavaScript level (the field really does change) — the bug is entirely about React not knowing to re-render, since useSelector\'s reference-equality check never sees a new object; the failure is silent, not an exception.',
    },
    {
      thought: 'this kind of bug would be immediately obvious during development, since the UI clearly wouldn\'t match the data.',
      reality: 'it can be genuinely subtle — if a LATER action happens to trigger an unrelated re-render (for any reason), the stale UI will suddenly "catch up" and show the already-mutated value, making the bug look like a one-off flicker or a timing issue rather than a systemic direct-mutation problem.',
    },
  ];
}
