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
  selector: 'app-react-hooks-advanced',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './hooks-advanced.html',
  styleUrl: './hooks-advanced.scss',
})
export class ReactHooksAdvanced {
  quickRef: QuickRefItem[] = [
    { name: 'useReducer(reducer, init)',      type: 'hook',   desc: 'Action-based state. Returns [state, dispatch]. Prefer when state has multiple sub-fields.' },
    { name: 'useMemo(() => value, [deps])',   type: 'hook',   desc: 'Memoize expensive computed value. Recomputes only when deps change.' },
    { name: 'useCallback(fn, [deps])',        type: 'hook',   desc: 'Memoize a function reference. Prevents child re-renders when passed as prop.' },
    { name: 'useTransition()',                type: 'hook',   desc: 'Returns [isPending, startTransition]. Marks state updates as low-priority.' },
    { name: 'useDeferredValue(value)',        type: 'hook',   desc: 'Defers a value update to low priority — like debouncing but driven by the scheduler.' },
    { name: 'useId()',                        type: 'hook',   desc: 'Stable unique ID for a component instance. Safe for SSR hydration.' },
    { name: 'useImperativeHandle(ref, fn)',   type: 'hook',   desc: 'Expose custom methods from a child via forwardRef. Use sparingly.' },
    { name: 'useDebugValue(label)',           type: 'hook',   desc: 'Labels a custom hook in React DevTools — only useful in custom hooks.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'useReducer — action-based state',
      points: [
        '<strong>useReducer(reducer, initialState)</strong> returns <code>[state, dispatch]</code>. The reducer is a pure function <code>(state, action) =&gt; newState</code>. Dispatch an action object and the reducer computes the next state.',
        '<strong>Prefer useReducer over useState</strong> when: state has multiple sub-values that change together; the next state depends on complex logic over the previous state; you want a predictable state machine (actions make transitions explicit and traceable).',
        '<strong>Lazy initialization:</strong> pass a third argument <code>init</code> function to useReducer — <code>useReducer(reducer, arg, init)</code> — and the initial state is <code>init(arg)</code>. Useful when initial state needs computation from props.',
        '<strong>useReducer vs useContext + useState:</strong> combine useReducer with createContext to replace Redux for medium-complexity global state — the reducer handles logic, context provides access without prop-drilling.',
      ],
    },
    {
      heading: 'useMemo and useCallback — referential stability',
      points: [
        '<strong>useMemo(() =&gt; value, [deps])</strong> memoizes an expensive computed value. React recomputes only when deps change. Use it when the computation is measurably slow, not as a default optimization — memoization itself has overhead.',
        '<strong>useCallback(fn, [deps])</strong> memoizes the function reference itself. It is equivalent to <code>useMemo(() =&gt; fn, [deps])</code>. The main use case is stabilizing a callback before passing it to a memoized child component (<code>React.memo</code>) or including it in a useEffect dep array.',
        '<strong>When to reach for them:</strong> (1) a child wrapped in React.memo re-renders when a callback prop changes; (2) a value is used as a useEffect dependency and it changes on every render; (3) a computation is visibly slow in the Profiler. Do NOT add them pre-emptively — they add memory and complexity.',
        '<strong>Object/array deps must be stable.</strong> If you include an object in a dep array, wrap it in useMemo first. Otherwise the object has a new reference on every render and the memo never saves a render.',
      ],
    },
    {
      heading: 'useTransition and useDeferredValue — concurrent features',
      points: [
        '<strong>useTransition()</strong> returns <code>[isPending, startTransition]</code>. Wrap a state update in <code>startTransition</code> to mark it as non-urgent. React keeps the current UI interactive while the low-priority update processes in the background.',
        '<strong>isPending</strong> is true while the transition is in progress — use it to show a loading indicator without blocking the input or blocking the current UI.',
        '<strong>useDeferredValue(value)</strong> accepts a value and returns a deferred version that "lags behind" during high-priority renders. It is like a scheduler-driven debounce — no timer needed. Useful for search results lists that should not block typing.',
        '<strong>useTransition vs useDeferredValue:</strong> use useTransition when you control the state update (you can wrap the setter); use useDeferredValue when you receive a value as a prop and cannot wrap the setter yourself.',
      ],
    },
    {
      heading: 'useId — stable unique IDs',
      points: [
        '<strong>useId()</strong> generates a stable, unique ID for a component instance that is consistent between server-side rendering and client-side hydration. Use it to link <code>&lt;label htmlFor&gt;</code> to <code>&lt;input id&gt;</code> without hard-coding IDs.',
        'Do <strong>not</strong> use useId for list keys — keys should come from data IDs. useId is for linking HTML elements within a component, not for identifying data items.',
        'Each call to useId in the same component returns a different ID — you can call it multiple times and suffix to create related IDs: <code>const id = useId(); // base-r0:, base-r0:-label, etc.</code>',
      ],
    },
    {
      heading: 'Custom hooks — reusable stateful logic',
      points: [
        '<strong>A custom hook is any function starting with "use" that calls other hooks.</strong> It extracts stateful logic, not markup. The consumer gets back data + handlers, not JSX.',
        '<strong>Custom hooks do not share state</strong> between components that call them. Each call creates its own isolated state — like calling useState twice in one component.',
        '<strong>Good custom hook candidates:</strong> data fetching (useFetch, useQuery), form state (useForm), media queries (useMediaQuery), window events (useWindowSize), local storage sync (useLocalStorage), and any pattern you repeat across multiple components.',
        '<strong>Return a tuple <code>[value, actions]</code> or a plain object</strong> depending on whether order matters. Objects are self-documenting and easier to extend; tuples allow renaming at the call site.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'useReducer — form state',
      language: 'typescript',
      code: `import { useReducer } from 'react';

interface FormState {
  name: string; email: string; submitting: boolean; error: string | null; success: boolean;
}
type Action =
  | { type: 'SET_FIELD'; field: 'name' | 'email'; value: string }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; message: string };

const initialState: FormState = { name: '', email: '', submitting: false, error: null, success: false };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'SET_FIELD':  return { ...state, [action.field]: action.value };
    case 'SUBMIT':     return { ...state, submitting: true, error: null };
    case 'SUCCESS':    return { ...state, submitting: false, success: true };
    case 'ERROR':      return { ...state, submitting: false, error: action.message };
    default:           return state;
  }
}

function ContactForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });
    try {
      await submitForm({ name: state.name, email: state.email });
      dispatch({ type: 'SUCCESS' });
    } catch (err) {
      dispatch({ type: 'ERROR', message: (err as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={state.name}  onChange={e => dispatch({ type: 'SET_FIELD', field: 'name',  value: e.target.value })} />
      <input value={state.email} onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })} />
      <button disabled={state.submitting}>Submit</button>
      {state.error   && <p>{state.error}</p>}
      {state.success && <p>Sent!</p>}
    </form>
  );
}`,
    },
    {
      label: 'useMemo + useCallback',
      language: 'typescript',
      code: `import { useState, useMemo, useCallback, memo } from 'react';

// Memoized child — only re-renders when onDelete changes
const TodoItem = memo(({ id, text, onDelete }: { id: number; text: string; onDelete: (id: number) => void }) => {
  console.log('TodoItem render:', id);
  return <li>{text} <button onClick={() => onDelete(id)}>×</button></li>;
});

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Buy milk', done: false },
    { id: 2, text: 'Read docs', done: false },
    { id: 3, text: 'Ship feature', done: true  },
  ]);
  const [showDone, setShowDone] = useState(false);

  // useMemo — filter only recalculates when todos or showDone changes
  const visible = useMemo(
    () => todos.filter(t => showDone || !t.done),
    [todos, showDone]
  );

  // useCallback — stable reference for TodoItem's onDelete prop
  const handleDelete = useCallback((id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []); // no deps — uses functional update inside

  return (
    <div>
      <label><input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} /> Show done</label>
      <ul>{visible.map(t => <TodoItem key={t.id} id={t.id} text={t.text} onDelete={handleDelete} />)}</ul>
    </div>
  );
}`,
    },
    {
      label: 'useTransition — search',
      language: 'typescript',
      code: `import { useState, useTransition } from 'react';

const ITEMS = Array.from({ length: 5000 }, (_, i) => \`Item \${i + 1}\`);

function SearchList() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(ITEMS);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);                    // urgent — update the input immediately
    startTransition(() => {             // non-urgent — filter can lag behind
      setResults(ITEMS.filter(item => item.toLowerCase().includes(value.toLowerCase())));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Search 5000 items…" />
      {isPending && <span> Filtering…</span>}
      <ul>
        {results.slice(0, 50).map(item => <li key={item}>{item}</li>)}
        {results.length > 50 && <li>…and {results.length - 50} more</li>}
      </ul>
    </div>
  );
}`,
    },
    {
      label: 'useDeferredValue',
      language: 'typescript',
      code: `import { useState, useDeferredValue, memo } from 'react';

// Heavy list — re-renders on every keystroke without deferral
const ResultList = memo(({ query }: { query: string }) => {
  const results = Array.from({ length: 3000 }, (_, i) => \`Result \${i + 1}\`)
    .filter(r => r.toLowerCase().includes(query.toLowerCase()));

  return <ul>{results.slice(0, 20).map(r => <li key={r}>{r}</li>)}</ul>;
});

function DeferredSearch() {
  const [query, setQuery] = useState('');
  // Deferred copy lags behind the input during high-priority renders
  const deferredQuery = useDeferredValue(query);
  const isStale = deferredQuery !== query;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type…" />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}`,
    },
    {
      label: 'Custom hook — useLocalStorage',
      language: 'typescript',
      code: `import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const next = value instanceof Function ? value(stored) : value;
      setStored(next);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      console.warn('useLocalStorage write failed:', e);
    }
  };

  return [stored, setValue];
}

// Usage — drop-in replacement for useState
function Settings() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Theme: {theme}
    </button>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'useMemo/useCallback on everything',
      wrong: `// Adding memoization everywhere "just in case"
const label = useMemo(() => \`Hello \${name}\`, [name]);
const handleClick = useCallback(() => console.log('click'), []);`,
      right: `// Only memoize when there is a measured problem
const label = \`Hello \${name}\`;          // string concat is free
const handleClick = () => console.log('click');  // fine unless passed to React.memo child`,
      explanation: 'useMemo and useCallback add memory overhead and cognitive complexity. Profile first — the React DevTools Profiler shows actual wasted renders. Premature memoization often makes things worse.',
    },
    {
      title: 'Forgetting to compare with React.memo',
      wrong: `// useCallback wraps the handler — but child is not memoized
const handleDelete = useCallback((id: number) => {
  setItems(prev => prev.filter(i => i.id !== id));
}, []);
// child always re-renders regardless because it is not wrapped in React.memo
function Item({ onDelete }: { onDelete: (id: number) => void }) { ... }`,
      right: `const handleDelete = useCallback((id: number) => {
  setItems(prev => prev.filter(i => i.id !== id));
}, []);
// Pair useCallback with React.memo — both are required for the optimization
const Item = memo(function Item({ onDelete }: { onDelete: (id: number) => void }) { ... });`,
      explanation: 'useCallback only prevents re-renders if the child component is wrapped in React.memo (or is a PureComponent). Without memo, the child re-renders regardless of prop stability.',
    },
    {
      title: 'Using useTransition for urgent updates',
      wrong: `const [value, setValue] = useState('');
const [isPending, startTransition] = useTransition();

// Wrapping input update in transition — makes the input feel laggy
startTransition(() => setValue(e.target.value));`,
      right: `const [value,   setValue]   = useState('');
const [results, setResults] = useState([]);
const [isPending, startTransition] = useTransition();

// Input update is urgent; filtering is non-urgent
setValue(e.target.value);
startTransition(() => setResults(filterData(e.target.value)));`,
      explanation: 'startTransition marks updates as non-urgent — React may delay them to keep the UI responsive. Never wrap user-visible input or cursor updates in a transition; only wrap derived/expensive state.',
    },
    {
      title: 'Inline reducer function',
      wrong: `// Defining reducer inside the component causes it to be recreated each render
function Counter() {
  const [count, dispatch] = useReducer((state, action) => {
    return action === 'inc' ? state + 1 : state - 1;
  }, 0);
}`,
      right: `// Define reducer outside the component — pure function, no deps
function counterReducer(state: number, action: 'inc' | 'dec') {
  return action === 'inc' ? state + 1 : state - 1;
}
function Counter() {
  const [count, dispatch] = useReducer(counterReducer, 0);
}`,
      explanation: 'An inline reducer is recreated on every render. Define it outside the component — it is a pure function with no component-scope dependencies, so it belongs at module level.',
    },
    {
      title: 'Using useId for list keys',
      wrong: `function List({ items }: { items: string[] }) {
  const id = useId();
  return <ul>{items.map((item, i) => <li key={\`\${id}-\${i}\`}>{item}</li>)}</ul>;
  // index-based keys still cause issues during reorder/filter
}`,
      right: `function List({ items }: { id: string; text: string }[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.text}</li>)}</ul>;
  // Use stable data IDs for keys
}`,
      explanation: 'useId generates a stable ID for a component instance — its purpose is linking form elements (label htmlFor / input id). List keys should be stable data IDs, never indexes or useId.',
    },
    {
      title: 'Not memoizing context selectors',
      wrong: `function useUserName() {
  const { user } = useContext(UserContext);
  return user.name;  // re-renders on any UserContext change, not just name
}`,
      right: `function useUserName() {
  const { user } = useContext(UserContext);
  return useMemo(() => user.name, [user.name]);   // stable when only name changes
  // Or: split UserContext into UserNameContext + UserActionsContext
}`,
      explanation: 'useContext re-renders on any value change. If a consumer only needs a slice of the context, memoize the derived value with useMemo, or split the context by update frequency.',
    },
  ];

  challenge: Challenge = {
    title: 'Shopping Cart with useReducer',
    language: 'typescript',
    description: `Build a shopping cart component using useReducer:

1. State: \`{ items: CartItem[], total: number }\` where CartItem is \`{ id, name, price, qty }\`
2. Actions: ADD_ITEM (or increment qty if exists), REMOVE_ITEM, UPDATE_QTY, CLEAR_CART
3. The \`total\` should be derived in the reducer from items (sum of price * qty)
4. Expose a useCart() custom hook that wraps useContext (CartContext) + dispatch helpers
5. Wrap useMemo around the context value to prevent unnecessary re-renders
6. Display: list of items with +/– buttons, item totals, cart total, Clear button`,
    hints: [
      'Compute total inside the reducer using items.reduce((sum, i) => sum + i.price * i.qty, 0)',
      'ADD_ITEM: check if item exists with find() — if yes, increment qty; if no, push with qty: 1',
      'useCart hook should expose { items, total, addItem, removeItem, updateQty, clearCart } — wrap dispatch calls in named functions',
      'Wrap the context value in useMemo with [state] as deps — dispatch is stable so no need to include it',
    ],
    starterCode: `import { createContext, useContext, useReducer, useMemo } from 'react';

interface CartItem { id: number; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; total: number; }
type CartAction =
  | { type: 'ADD_ITEM';    item: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE_ITEM'; id: number }
  | { type: 'UPDATE_QTY';  id: number; qty: number }
  | { type: 'CLEAR_CART' };

// TODO: implement reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  return state;
}

const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  // TODO: memoize context value, expose helpers
  return <CartContext.Provider value={null}>{children}</CartContext.Provider>;
}

export function useCart() {
  // TODO: consume CartContext and return helpers
  return {};
}`,
    solution: `import { createContext, useContext, useReducer, useMemo } from 'react';

interface CartItem { id: number; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; total: number; }
type CartAction =
  | { type: 'ADD_ITEM';    item: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE_ITEM'; id: number }
  | { type: 'UPDATE_QTY';  id: number; qty: number }
  | { type: 'CLEAR_CART' };

function calcTotal(items: CartItem[]) { return items.reduce((s, i) => s + i.price * i.qty, 0); }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find(i => i.id === action.item.id);
      const items = exists
        ? state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...state.items, { ...action.item, qty: 1 }];
      return { items, total: calcTotal(items) };
    }
    case 'REMOVE_ITEM': {
      const items = state.items.filter(i => i.id !== action.id);
      return { items, total: calcTotal(items) };
    }
    case 'UPDATE_QTY': {
      const items = action.qty <= 0
        ? state.items.filter(i => i.id !== action.id)
        : state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i);
      return { items, total: calcTotal(items) };
    }
    case 'CLEAR_CART': return { items: [], total: 0 };
    default: return state;
  }
}

interface CartCtx { items: CartItem[]; total: number; addItem: (item: Omit<CartItem,'qty'>) => void; removeItem: (id: number) => void; updateQty: (id: number, qty: number) => void; clearCart: () => void; }
const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const value = useMemo<CartCtx>(() => ({
    ...state,
    addItem:    item => dispatch({ type: 'ADD_ITEM', item }),
    removeItem: id   => dispatch({ type: 'REMOVE_ITEM', id }),
    updateQty:  (id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }),
    clearCart:  ()   => dispatch({ type: 'CLEAR_CART' }),
  }), [state]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When should you prefer useReducer over useState?',
      options: ['When state is a simple boolean', 'When state has multiple sub-values that change together or state transitions are complex', 'When you want to avoid re-renders', 'When state is derived from props'],
      answer: 1,
      explanation: 'useReducer shines when state has multiple sub-fields that transition together (form + submitting + error), when next state depends on complex logic, or when you want traceable action-based transitions.',
    },
    {
      q: 'What does useCallback(fn, []) return when deps are empty?',
      options: ['A new function on every render', 'The same function reference across all renders', 'undefined', 'A memoized return value of fn'],
      answer: 1,
      explanation: 'useCallback with empty deps returns the same function reference for the lifetime of the component. useMemo returns the memoized value; useCallback returns the memoized function itself.',
    },
    {
      q: 'What is the key requirement for useCallback to actually prevent a child re-render?',
      options: ['The child must use useEffect', 'The child must be wrapped in React.memo', 'The parent must also use useMemo', 'The callback must not close over state'],
      answer: 1,
      explanation: 'useCallback stabilizes a function reference, but a child component only skips re-rendering when its props are shallowly equal AND it is wrapped in React.memo. Without memo, stable refs make no difference.',
    },
    {
      q: 'What kind of updates should you pass to startTransition?',
      options: ['Urgent user-input updates', 'Non-urgent, deferrable state transitions like filtering large lists', 'Any async operation', 'Only updates that read from the network'],
      answer: 1,
      explanation: 'startTransition marks updates as non-urgent so React can interrupt them to handle urgent work (like user input). Never wrap input value updates in startTransition — that makes the UI feel laggy.',
    },
    {
      q: 'What is the main difference between useDeferredValue and useTransition?',
      options: ['useDeferredValue is for strings only', 'useTransition wraps the state setter; useDeferredValue defers a value you receive (e.g. from props)', 'useDeferredValue is deprecated in React 18', 'They are identical — one is an alias of the other'],
      answer: 1,
      explanation: 'Use useTransition when you control the setter. Use useDeferredValue when you receive a value as a prop or from a context and cannot wrap the setter in startTransition yourself.',
    },
    {
      q: 'What is useId designed for?',
      options: ['Generating unique keys for list items', 'Linking form label htmlFor to input id attributes in a way that is safe for SSR', 'Creating stable identifiers for API requests', 'Replacing Math.random() for IDs'],
      answer: 1,
      explanation: 'useId generates a stable, SSR-safe unique ID for a component instance. It is designed for linking form elements (label + input). List keys should come from data IDs, not useId.',
    },
    {
      q: 'Where should a useReducer reducer function be defined?',
      options: ['Inside the component function', 'As a class method', 'Outside the component at module scope', 'Inside useEffect'],
      answer: 2,
      explanation: 'The reducer is a pure function with no dependency on the component\'s scope. Defining it outside the component prevents it from being recreated on every render and keeps it easily testable.',
    },
    {
      q: 'A custom hook named "fetchUser" will cause a React lint error. Why?',
      options: ['Custom hooks must return an array', 'Custom hooks must start with "use"', 'Custom hooks cannot accept parameters', 'Custom hooks must call at least two other hooks'],
      answer: 1,
      explanation: 'The react-hooks/rules-of-hooks ESLint rule identifies custom hooks by the "use" prefix. A function named "fetchUser" is treated as a regular function — hook calls inside it are flagged as invalid.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When does it make sense to use useReducer + Context instead of Zustand?',
      a: 'For small-to-medium apps where you want zero extra dependencies and predictable state transitions. Zustand is simpler to set up, avoids Provider nesting, and supports selective subscriptions that prevent unnecessary re-renders. For larger apps or teams that benefit from Redux DevTools-style tracing, useReducer + Context is a good zero-dependency alternative.',
    },
    {
      q: 'How do I measure whether useMemo or useCallback is actually helping?',
      a: 'Open React DevTools Profiler, record an interaction, and check the "Why did this render?" panel. If a component shows "Props changed" and the changed prop is a memoized function or value, something upstream is breaking referential stability. Flame charts show which components are slow — only add memoization to those.',
    },
    {
      q: 'Can I use useTransition for data fetching?',
      a: 'Yes — wrapping a setState that triggers a Suspense fallback in startTransition keeps the current UI visible (no spinner flash) while the next route/data loads. This is the intended pattern for React Router\'s lazy routes with Suspense and for useDeferredValue-based search.',
    },
    {
      q: 'How do I test a custom hook?',
      a: 'Use @testing-library/react\'s renderHook utility. It mounts the hook in a minimal wrapper component so you can call its returned handlers and assert on its returned values. For hooks that need Providers (useContext), pass a wrapper option with the Provider to renderHook.',
    },
    {
      q: 'Does useDeferredValue replace useMemo?',
      a: 'No — they solve different problems. useDeferredValue schedules when to apply a value update using the React scheduler. useMemo caches a computed value to avoid recomputation. For filtering large lists, you often use both: useDeferredValue to defer when the filter runs, and useMemo inside the filtered component to avoid recomputing when unrelated state changes.',
    },
    {
      q: 'Should I always pass a lazy initializer to useReducer?',
      a: 'Only when the initial state is expensive to compute from a prop. The third-argument form useReducer(reducer, arg, init) is equivalent to useState(() => init(arg)) — both call the function once on mount. For static initial state (object literal), no initializer needed.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Advanced hooks — useReducer for complex state, useMemo/useCallback for referential stability, and concurrent hooks for smooth UX.',
    mustKnow: [
      'useReducer: (state, action) => newState — prefer over useState when state has multiple fields or complex transitions; define reducer outside the component',
      'useMemo caches a value; useCallback caches a function — both require React.memo on the child to prevent re-renders',
      'Only memoize when the Profiler shows a problem — premature memoization adds overhead',
      'useTransition wraps a setter (you control the update); useDeferredValue defers a received value (you don\'t control the setter)',
      'useId generates stable SSR-safe IDs for linking form elements — not for list keys',
      'Custom hooks start with "use", extract stateful logic (not JSX), and create isolated state per call site',
    ],
    interviewFocus: [
      'Difference between useMemo and useCallback — and when does useCallback actually prevent a re-render?',
      'When would you choose useReducer over useState? Give a real example.',
      'Explain useTransition vs useDeferredValue — when would you reach for each?',
      'How do you test a custom hook, and what library do you use?',
    ],
  };
}
