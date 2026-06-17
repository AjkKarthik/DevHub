import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-hooks-core',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './hooks-core.html',
  styleUrl: './hooks-core.scss',
})
export class ReactHooksCore {
  quickRef: QuickRefItem[] = [
    { name: 'useState(initialValue)',       type: 'hook',     desc: 'Local state; returns [value, setter]. Never mutate value directly.' },
    { name: 'useState(() => expensiveInit)',type: 'hook',     desc: 'Lazy initializer — function runs once on mount only.' },
    { name: 'setState(prev => next)',       type: 'hook',     desc: 'Functional update — safe when next state depends on previous.' },
    { name: 'useEffect(fn, [deps])',        type: 'hook',     desc: 'Side effects after render. Cleanup via returned function.' },
    { name: 'useEffect(fn, [])',            type: 'hook',     desc: 'Empty deps = run once on mount, cleanup on unmount.' },
    { name: 'useEffect(fn)',                type: 'hook',     desc: 'No deps = run after every render (use sparingly).' },
    { name: 'useRef(initialValue)',         type: 'hook',     desc: 'Mutable .current that persists across renders without re-render.' },
    { name: 'useContext(MyContext)',         type: 'hook',     desc: 'Subscribe to the nearest Provider value above in the tree.' },
    { name: 'createContext(defaultValue)',  type: 'function', desc: 'Create a context object. defaultValue used only outside Provider.' },
    { name: 'AbortController + useEffect', type: 'syntax',   desc: 'Cancel fetch on cleanup: controller.abort() in the return function.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'useState — local state',
      points: [
        '<strong>useState returns [value, setter].</strong> React schedules a re-render whenever the setter is called with a new value (Object.is comparison). Never mutate the state value directly — always replace it with a new value or a new object/array reference.',
        '<strong>Functional update form:</strong> <code>setState(prev =&gt; next)</code> receives the guaranteed latest state, avoiding stale-closure bugs when multiple updates occur in the same event or async callback. Always use it when new state depends on the old state.',
        '<strong>Lazy initializer:</strong> pass a function — <code>useState(() =&gt; expensiveComputation())</code> — and React calls it only once on mount instead of on every render. Use it for expensive initial values like parsing localStorage.',
        '<strong>React 18 automatic batching</strong> groups multiple setState calls inside event handlers into a single re-render. This means three setState calls in one click handler trigger one re-render, not three.',
      ],
    },
    {
      heading: 'useEffect — side effects',
      points: [
        '<strong>useEffect runs after the browser paints.</strong> Use it for subscriptions, timers, data fetching, and any DOM manipulation that must happen outside the render phase.',
        '<strong>Dependency array controls when the effect re-runs:</strong> no array → every render; <code>[]</code> → once on mount; <code>[a, b]</code> → when a or b changes (Object.is).',
        '<strong>Cleanup function</strong> (returned from the effect) runs before the next effect execution and on unmount. Always clean up subscriptions, timers, and fetch AbortControllers to avoid memory leaks and state updates on unmounted components.',
        '<strong>React 18 Strict Mode fires effects twice in development</strong> to surface missing cleanup. If your app breaks on the second run, you need a cleanup function. This only happens in development — production runs effects once.',
        '<strong>Never pass an async function directly</strong> to useEffect — it returns a Promise, not a cleanup function. Define an async function inside the effect body and call it immediately.',
      ],
    },
    {
      heading: 'useRef — mutable values and DOM refs',
      points: [
        '<strong>useRef returns { current: T }.</strong> Mutating <code>.current</code> does NOT trigger a re-render, making it ideal for values the UI doesn\'t need to react to.',
        '<strong>DOM refs:</strong> attach to JSX via the <code>ref</code> prop to access the DOM node directly for focus, scroll, or measurement. TypeScript types it as <code>T | null</code> — always use optional chaining: <code>ref.current?.focus()</code>.',
        '<strong>Mutable instance variables:</strong> store timer IDs, interval handles, previous values, WebSocket instances, or abort controllers that should persist across renders without causing re-renders.',
        '<strong>Latest-ref pattern</strong> escapes stale closures in long-lived effects. Sync a ref with a callback in an effect with no deps (<code>useEffect(() =&gt; { cbRef.current = cb; })</code>), then call <code>cbRef.current()</code> inside the long-lived effect — always gets the current version.',
      ],
    },
    {
      heading: 'useContext — consuming shared state',
      points: [
        '<strong>Context avoids prop-drilling.</strong> Create with <code>createContext(defaultValue)</code>, wrap with <code>&lt;MyContext.Provider value={...}&gt;</code>, consume with <code>useContext(MyContext)</code> anywhere in the subtree.',
        '<strong>All consumers re-render</strong> when the context value changes (Object.is). If you pass an object literal as the value, it creates a new reference on every render — memoize with <code>useMemo</code> or split into multiple contexts.',
        '<strong>Context is not a state manager.</strong> It is a way to share state that already exists. Pair it with useReducer for complex global state. For high-frequency updates or cross-cutting state that many components need, prefer Zustand.',
        '<strong>defaultValue</strong> (passed to createContext) is only used when a component consumes the context outside any Provider. For required contexts, pass <code>undefined</code> and throw in the custom hook if ctx is undefined.',
      ],
    },
    {
      heading: 'Rules of Hooks',
      points: [
        '<strong>Only call hooks at the top level</strong> — never inside conditions, loops, or nested functions. React relies on the call order to map state to the right hook between renders. Breaking this causes state to be assigned to the wrong hook.',
        '<strong>Only call hooks in React functions</strong> — function components or custom hooks (functions starting with "use"). Never in regular JS functions, class components, or event handlers.',
        '<strong>Exhaustive dependencies:</strong> the ESLint rule <code>react-hooks/exhaustive-deps</code> enforces that all values from the component scope read inside an effect/memo/callback are listed in the dependency array. Missing deps cause stale closure bugs. The fix is to add the dep or restructure — never to lie in the array.',
        '<strong>Custom hooks</strong> must start with "use" so the linter knows to apply hook rules. A custom hook is just a function that calls other hooks — it lets you extract and reuse stateful logic without sharing component state.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'useState counter',
      language: 'typescript',
      code: `import { useState } from 'react';

function Counter() {
  const [count, setCount]   = useState(0);
  const [step,  setStep]    = useState(1);

  const increment = () => setCount(prev => prev + step);
  const decrement = () => setCount(prev => prev - step);
  const reset     = () => setCount(0);

  return (
    <div>
      <p>Count: {count}</p>
      <label>
        Step: <input type="number" value={step} onChange={e => setStep(Number(e.target.value))} />
      </label>
      <button onClick={decrement}>−</button>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`,
    },
    {
      label: 'useEffect fetch',
      language: 'typescript',
      code: `import { useState, useEffect } from 'react';

interface Post { id: number; title: string; body: string; }

function PostDetail({ id }: { id: number }) {
  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(\`https://jsonplaceholder.typicode.com/posts/\${id}\`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(data => { if (!cancelled) { setPost(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });

    return () => { cancelled = true; };   // prevent state update after unmount
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Error: {error}</p>;
  return <article><h1>{post?.title}</h1><p>{post?.body}</p></article>;
}`,
    },
    {
      label: 'useRef DOM + timer',
      language: 'typescript',
      code: `import { useState, useRef, useEffect } from 'react';

function Stopwatch() {
  const [time,    setTime]    = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTime(t => t + 1), 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const seconds = (time / 10).toFixed(1);

  return (
    <div>
      <p>{seconds}s</p>
      <button onClick={() => setRunning(r => !r)}>{running ? 'Pause' : 'Start'}</button>
      <button onClick={() => { setRunning(false); setTime(0); }}>Reset</button>
    </div>
  );
}`,
    },
    {
      label: 'useContext theme',
      language: 'typescript',
      code: `import { createContext, useContext, useState, useMemo } from 'react';

type Theme = 'light' | 'dark';
interface ThemeCtx { theme: Theme; toggle: () => void; }

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  // Memoize so object reference is stable — prevents unnecessary re-renders
  const value = useMemo(() => ({ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

// Usage in any component
function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header style={{ background: theme === 'dark' ? '#111' : '#fff' }}>
      <button onClick={toggle}>Toggle: {theme}</button>
    </header>
  );
}`,
    },
    {
      label: 'Custom hook — useFetch',
      language: 'typescript',
      code: `import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetch(url, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(\`\${res.status} \${res.statusText}\`); return res.json(); })
      .then(data  => setState({ data, loading: false, error: null }))
      .catch(err  => {
        if (err.name !== 'AbortError') setState({ data: null, loading: false, error: err.message });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

// Usage
function UserProfile({ id }: { id: number }) {
  const { data, loading, error } = useFetch<{ name: string }>(\`/api/users/\${id}\`);
  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Error: {error}</p>;
  return <p>{data?.name}</p>;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Direct state mutation',
      wrong: `const [items, setItems] = useState([1, 2, 3]);
items.push(4);        // mutates — React sees same reference
setItems(items);      // no re-render triggered`,
      right: `const [items, setItems] = useState([1, 2, 3]);
setItems(prev => [...prev, 4]);   // new array — triggers re-render`,
      explanation: 'React uses Object.is to detect state changes. Mutating the existing array/object means the reference stays the same, so React skips the re-render.',
    },
    {
      title: 'Missing useEffect cleanup',
      wrong: `useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  // no cleanup — interval runs forever after unmount
}, []);`,
      right: `useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);   // cleanup on unmount
}, []);`,
      explanation: 'Without cleanup, timers, subscriptions, and event listeners continue running after the component unmounts, causing memory leaks and state updates on unmounted components.',
    },
    {
      title: 'Stale closure in useEffect',
      wrong: `const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    console.log(count);   // always 0 — stale closure
  }, 1000);
  return () => clearInterval(id);
}, []);   // ← missing count dependency`,
      right: `useEffect(() => {
  const id = setInterval(() => {
    setCount(prev => prev + 1);   // functional update avoids reading stale count
  }, 1000);
  return () => clearInterval(id);
}, []);`,
      explanation: 'useEffect captures the values of its closure at the time it runs. If count is missing from deps, the effect always sees the initial value. Use functional updates or add the dep.',
    },
    {
      title: 'Object/array dependency causing infinite loop',
      wrong: `function MyComp({ config }: { config: { limit: number } }) {
  useEffect(() => {
    fetchData(config);
  }, [config]);   // new object ref on every render → infinite loop
}`,
      right: `function MyComp({ config }: { config: { limit: number } }) {
  const { limit } = config;
  useEffect(() => {
    fetchData({ limit });
  }, [limit]);   // primitive dep — stable comparison
}`,
      explanation: 'Objects and arrays are compared by reference. A prop object created inline gets a new reference on every render, so the effect fires in a loop. Destructure to primitive deps.',
    },
    {
      title: 'useRef for DOM but forgetting null check',
      wrong: `const ref = useRef<HTMLInputElement>(null);
useEffect(() => {
  ref.current.focus();   // TypeError if element not yet mounted
}, []);`,
      right: `const ref = useRef<HTMLInputElement>(null);
useEffect(() => {
  ref.current?.focus();   // optional chaining — safe
}, []);`,
      explanation: 'TypeScript types ref.current as T | null. The element may not be mounted when the effect runs (e.g. conditional rendering). Always use optional chaining or a null guard.',
    },
    {
      title: 'Not memoizing context value object',
      wrong: `function Provider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
  // New object on every render — all consumers re-render`,
      right: `function Provider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}`,
      explanation: 'An object literal creates a new reference on every render. useMemo makes the reference stable so consumers only re-render when user actually changes.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Live Search Component',
    language: 'typescript',
    description: `Create a SearchBox component that:
1. Maintains an input value with useState
2. Debounces the search — only fetches 500ms after the user stops typing (use useRef to store the timer ID, useEffect to trigger the fetch)
3. Fetches from https://jsonplaceholder.typicode.com/users?name_like={query} when query is >= 2 characters
4. Shows a loading spinner while fetching
5. Cancels in-flight requests when a new keystroke arrives (AbortController in cleanup)
6. Displays results as a list or "No results" if empty`,
    hints: [
      'Store the debounce timer in useRef<ReturnType<typeof setTimeout> | null>(null) — clear it in cleanup',
      'Combine loading + data + error into a single state object to avoid partial updates',
      'The AbortController cleanup runs before the next effect, which is before the debounced fetch fires — handle the abort-error case',
      'useEffect with [query] dependency triggers on every keystroke; the debounce logic lives inside the effect',
    ],
    starterCode: `import { useState, useEffect, useRef } from 'react';

interface User { id: number; name: string; email: string; }

function SearchBox() {
  const [query, setQuery] = useState('');
  // TODO: add state for results, loading, error
  // TODO: useRef for timer and AbortController
  // TODO: useEffect for debounced fetch

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search users…"
      />
      {/* TODO: render loading / results / error */}
    </div>
  );
}

export default SearchBox;`,
    solution: `import { useState, useEffect, useRef } from 'react';

interface User { id: number; name: string; email: string; }
interface FetchState { data: User[]; loading: boolean; error: string | null; }

function SearchBox() {
  const [query, setQuery] = useState('');
  const [{ data, loading, error }, setState] = useState<FetchState>({ data: [], loading: false, error: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setState({ data: [], loading: false, error: null }); return; }

    const controller = new AbortController();
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setState(s => ({ ...s, loading: true, error: null }));
      fetch(\`https://jsonplaceholder.typicode.com/users?name_like=\${encodeURIComponent(query)}\`, { signal: controller.signal })
        .then(r => r.json())
        .then(d => setState({ data: d, loading: false, error: null }))
        .catch(e => { if (e.name !== 'AbortError') setState({ data: [], loading: false, error: e.message }); });
    }, 500);

    return () => { controller.abort(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users…" />
      {loading && <p>Loading…</p>}
      {error   && <p>Error: {error}</p>}
      {!loading && data.length === 0 && query.length >= 2 && <p>No results</p>}
      <ul>{data.map(u => <li key={u.id}><strong>{u.name}</strong> — {u.email}</li>)}</ul>
    </div>
  );
}

export default SearchBox;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens if you call setState(sameValue) where sameValue is referentially equal to the current state?',
      options: ['React always re-renders', 'React bails out and skips the re-render', 'React throws an error', 'React re-renders only the component, not its children'],
      answer: 1,
      explanation: 'React uses Object.is comparison. If the new value is identical to the current state (same primitive or same reference), React bails out without re-rendering.',
    },
    {
      q: 'Why does React 18 Strict Mode run effects twice in development?',
      options: ['Performance profiling', 'To simulate concurrent rendering and surface missing cleanup functions', 'To detect memory leaks', 'To verify the dependency array'],
      answer: 1,
      explanation: 'React 18 Strict Mode mounts → unmounts → remounts to ensure your cleanup function properly tears down the effect. If your app breaks on the second mount, you need a cleanup.',
    },
    {
      q: 'Which hook should you use to store a previous render value without triggering a re-render?',
      options: ['useState', 'useMemo', 'useRef', 'useReducer'],
      answer: 2,
      explanation: 'useRef persists a mutable .current value across renders without triggering a re-render when mutated. This makes it ideal for storing previous values, timer IDs, and DOM references.',
    },
    {
      q: 'What is the effect of passing an empty dependency array [] to useEffect?',
      options: ['The effect runs after every render', 'The effect runs once on mount and cleanup runs on unmount', 'The effect never runs', 'The effect runs on mount but cleanup never runs'],
      answer: 1,
      explanation: 'An empty deps array tells React the effect has no reactive dependencies. It runs once after the initial render, and if a cleanup function is returned, it runs on unmount.',
    },
    {
      q: 'What problem does the functional form of setState (prev => next) solve?',
      options: ['It prevents React from batching updates', 'It avoids stale closure bugs when new state depends on previous state', 'It makes the update synchronous', 'It reduces the number of re-renders'],
      answer: 1,
      explanation: 'The functional form receives the guaranteed latest state, avoiding stale closure issues when multiple updates occur in the same event loop tick or inside async callbacks.',
    },
    {
      q: 'Which of these will cause an infinite useEffect loop?',
      options: ['useEffect(() => {}, [])', 'useEffect(() => { setCount(c => c + 1) }, [])', 'useEffect(() => { setCount(c => c + 1) }, [count])', 'useEffect(() => { fetchData() }, [userId])'],
      answer: 2,
      explanation: 'Updating count inside an effect that depends on count creates a loop: count changes → effect runs → updates count → effect runs again. This is the classic infinite loop pattern.',
    },
    {
      q: 'When does useContext cause a re-render?',
      options: ['Whenever the Provider component re-renders', 'Only when the context value changes (Object.is comparison)', 'Only when the component itself calls setState', 'Never — context is read-only'],
      answer: 1,
      explanation: 'useContext re-renders the consumer when the context value changes as detected by Object.is. A new object reference counts as a change — this is why memoizing the value object matters.',
    },
    {
      q: 'The latest-ref pattern uses useRef to solve which problem?',
      options: ['Expensive re-renders', 'Stale closures inside long-lived effects like event listeners', 'Memory leaks from subscriptions', 'Missing keys in lists'],
      answer: 1,
      explanation: 'Long-lived effects (WebSocket, event listeners) capture their closure once. The latest-ref pattern stores the current version of a callback in a ref so the effect always calls the up-to-date function.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use the functional update form of useState?',
      a: 'Whenever the new state depends on the previous state — especially inside event handlers, setInterval callbacks, or any async code. The functional form receives the guaranteed latest state, not the captured closure value.',
    },
    {
      q: 'Why does React run my useEffect twice in development?',
      a: 'React 18 Strict Mode intentionally mounts → unmounts → remounts to verify your cleanup function properly reverses the effect. The double-invocation only happens in development. If your app breaks, add a cleanup function.',
    },
    {
      q: 'What is the difference between useEffect and useLayoutEffect?',
      a: 'useEffect fires asynchronously after the browser has painted. useLayoutEffect fires synchronously after DOM mutations but before the paint — use it to read layout (getBoundingClientRect) and make synchronous DOM changes to avoid flicker. Prefer useEffect unless you see a visual glitch.',
    },
    {
      q: 'Can I put async functions directly in useEffect?',
      a: 'No — useEffect\'s callback must return either nothing or a cleanup function; an async function returns a Promise. The pattern is to define an async function inside the effect and call it immediately: const run = async () => { ... }; run();',
    },
    {
      q: 'When is Context too heavy — when should I use Zustand instead?',
      a: 'Context re-renders all consumers on every value change. For state that updates frequently (search input, live feeds) or that many unrelated components need, Zustand\'s selective subscription is cheaper. Context is great for theme, locale, and low-frequency auth state.',
    },
    {
      q: 'Is useRef the same as creating a class instance variable?',
      a: 'Functionally yes — ref.current is like this.someVariable in a class component. It persists across renders, is mutable, and does not trigger re-renders. Use it for values that the UI does not need to react to.',
    },
    {
      q: 'Why does my useEffect dependency array cause an ESLint warning when I include a function?',
      a: 'Functions defined in the component body are recreated on every render, making them "unstable" as dependencies and potentially causing infinite loops. The fix is either to define the function inside the effect, or to wrap it in useCallback with its own deps.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The four core hooks — useState, useEffect, useRef, useContext — cover the vast majority of React component logic.',
    mustKnow: [
      'useState returns [value, setter] — never mutate value directly; use functional update when next state depends on prev',
      'useEffect runs after render; return a cleanup function to cancel subscriptions, timers, or fetch requests',
      'Empty deps [] = run once on mount; [dep] = run when dep changes; no array = run every render',
      'useRef stores mutable values (.current) without triggering re-renders — used for DOM refs, timers, and latest-ref pattern',
      'useContext re-renders all consumers when the context value changes — memoize object values with useMemo',
      'Rules of Hooks: only at top level, only in React functions — never inside conditions, loops, or callbacks',
    ],
    interviewFocus: [
      'Explain the stale closure problem and two ways to solve it (functional update or add to deps)',
      'What does the useEffect cleanup function do and when does it run?',
      'Why does React 18 Strict Mode run effects twice in development?',
      'Difference between useEffect and useLayoutEffect — when would you reach for useLayoutEffect?',
    ],
  };
}
