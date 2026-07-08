import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-context-selector-memo-still-rerenders-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './context-selector-memo-still-rerenders.html',
  styleUrl: './context-selector-memo-still-rerenders.scss',
})
export class ContextSelectorMemoStillRerendersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Comment Can Be Read Two Ways',
      points: [
        'Mistake #6 fixes <code>useUserName()</code> — which "re-renders on any UserContext change, not just name" — with: <code>return useMemo(() =&gt; user.name, [user.name]); // stable when only name changes</code>.',
        '"Stable when only name changes" is ambiguous: does it mean the COMPONENT CALLING <code>useUserName()</code> only re-renders when name changes, or does it mean the RETURNED VALUE only gets a new reference when name changes, while the component itself still re-renders on every context update? This subtopic tests which one is actually true.',
      ],
    },
    {
      heading: 'Why useMemo Can\'t Prevent the Re-render That Already Happened',
      points: [
        '<code>useContext(UserContext)</code> subscribes the CALLING component to the whole context value. Whenever the Provider passes a new value (even if only an unrelated field changed), React re-renders every component that called <code>useContext</code> for that context — this happens BEFORE any of the component\'s own hook calls, including <code>useMemo</code>, ever run.',
        '<code>useMemo(() =&gt; user.name, [user.name])</code> runs AFTER that re-render has already started. All it can do is recompute (or skip recomputing) the RETURNED VALUE. If <code>user.name</code> hasn\'t changed, <code>useMemo</code> returns the SAME string reference as last time — genuinely useful if that value is later passed to a memoized child or used as a dependency elsewhere — but it cannot retroactively stop the <code>useUserName()</code> hook\'s own calling component from having re-rendered in the first place.',
        'The real fix for stopping the RE-RENDER itself (not just the returned reference) is splitting the context into multiple smaller contexts by update frequency, exactly as the main page\'s comment separately suggests ("Or: split UserContext into UserNameContext + UserActionsContext") — <code>useMemo</code> alone only ever addresses referential stability of a derived value, never the re-render that already occurred.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "context-selector-memo-demo",
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
  <head><title>Context selector memoization</title></head>
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
      content: `import { createContext, useContext, useState, useMemo, useRef } from 'react';

const UserContext = createContext(null);

// The main page's own fix, exactly as written.
function useUserName() {
  const { user } = useContext(UserContext);
  return useMemo(() => user.name, [user.name]);
}

function NameDisplay() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const name = useUserName();
  return (
    <p>
      NameDisplay renders: {renderCount.current} (name: {name})
    </p>
  );
}

export default function App() {
  const [name, setName] = useState('Alice');
  const [lastActive, setLastActive] = useState(0);

  // Unrelated field changes -- name itself never changes here.
  const user = { name, lastActive };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={() => setLastActive(t => t + 1)}>
        Update lastActive (unrelated field, currently {lastActive})
      </button>
      <UserContext.Provider value={{ user }}>
        <NameDisplay />
      </UserContext.Provider>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        The fix's comment says useMemo makes the value "stable when
        only name changes." Click the button -- name never changes,
        only lastActive. Does NameDisplay's render count stay frozen,
        or does it keep incrementing anyway?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Update lastActive" a few times. Does NameDisplay\'s render count stay frozen (since name never changes), or does it keep incrementing on every click?',
    hint: '`useContext` re-renders the calling component whenever the Provider\'s value object changes, regardless of which field inside it changed — this happens before `useMemo` runs.',
    solution: `The render count keeps incrementing on every click, even though
name itself never changes -- only lastActive does. useMemo(() =>
user.name, [user.name]) is running correctly (it would return the
SAME string reference across these re-renders), but that has zero
effect on whether NameDisplay re-renders in the first place, because
useContext already triggered the re-render before useMemo's dependency
check ever ran.

This confirms the ambiguous reading of the main page's own comment:
"stable when only name changes" describes the RETURNED VALUE's
reference stability, not the component's render count. If name were
instead passed down as a prop to a React.memo-wrapped child, that
child WOULD correctly skip re-rendering thanks to the stable
reference -- but NameDisplay itself, which calls useContext directly,
re-renders every single time, unconditionally.

The practical lesson: useMemo on a context-derived value is a real,
useful optimization for what happens with that value AFTER it's
returned -- but it does nothing for the calling component's own
render count. Preventing that requires either splitting the context
by update frequency (the main page's own alternative suggestion) or
reaching for a selector library built for this exact problem.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wrapping a context-derived value in `useMemo(() => user.name, [user.name])` means the calling component only re-renders when `name` specifically changes — matching a literal reading of "stable when only name changes."',
      reality: '`useContext` re-renders its calling component on every Provider value change, regardless of which field changed — `useMemo` only stabilizes the RETURNED VALUE\'s reference for downstream consumers, it has no effect on the calling component\'s own re-render.',
    },
    {
      thought: 'if a component\'s render count keeps incrementing despite using the main page\'s exact `useMemo` fix, the fix must be implemented incorrectly.',
      reality: 'the fix is working exactly as designed — it stabilizes the returned string\'s reference (verifiable by passing it to a memoized child or a dependency array), which is a genuinely different guarantee than "this component won\'t re-render."',
    },
    {
      thought: 'the only way to reduce unnecessary context-triggered re-renders is to memoize every derived value read from the context.',
      reality: 'memoizing derived values only helps DOWNSTREAM of the re-render that already happened — actually reducing re-render frequency requires splitting the context by update frequency or using a context-selector pattern/library, exactly as the main page\'s own alternative note suggests.',
    },
  ];
}
