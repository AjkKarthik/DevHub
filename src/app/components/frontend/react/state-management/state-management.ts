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
  selector: 'app-react-state-management',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './state-management.html',
  styleUrl: './state-management.scss',
})
export class ReactStateManagement {
  quickRef: QuickRefItem[] = [
    { name: 'useState',                     type: 'hook',     desc: 'Local component state. First choice — lift when siblings need it.' },
    { name: 'useReducer',                   type: 'hook',     desc: 'Action-based local/shared state. Scales well with Context.' },
    { name: 'create(set => ({...}))',        type: 'function', desc: 'Zustand: define store with state + actions in one call.' },
    { name: 'useStore(s => s.slice)',        type: 'hook',     desc: 'Zustand: subscribe to a slice — re-renders only when that slice changes.' },
    { name: 'atom(initialValue)',            type: 'function', desc: 'Jotai: atomic state unit. Components subscribe to individual atoms.' },
    { name: 'useAtom(myAtom)',               type: 'hook',     desc: 'Jotai: returns [value, setter] — like useState but global.' },
    { name: 'createSlice()',                 type: 'function', desc: 'RTK: generates actions + reducer from a single config object.' },
    { name: 'useSelector(s => s.slice)',     type: 'hook',     desc: 'RTK/Redux: extract state from the store with memoized selector.' },
    { name: 'useDispatch()',                 type: 'hook',     desc: 'RTK/Redux: get the dispatch function to fire actions.' },
    { name: 'derived/computed state',       type: 'syntax',   desc: 'Never duplicate state — derive it with useMemo, selector, or atom derivation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Choosing the right state tool',
      points: [
        '<strong>Start with useState.</strong> It is the right tool for 80% of cases — component-local, simple, well-understood. Lift to the nearest common ancestor when siblings need the same value.',
        '<strong>Upgrade to useReducer</strong> when a component has 3+ related state fields that transition together, or when the update logic is complex enough to benefit from named actions.',
        '<strong>Reach for external state</strong> (Zustand, Jotai, Redux Toolkit) when: state is genuinely global (auth, theme, cart); multiple unrelated components need the same state; or Context is causing performance issues from over-subscription.',
        '<strong>Never synchronize state.</strong> If two pieces of state are always in sync, one of them is derived — compute it with useMemo or a selector, do not duplicate it.',
        '<strong>Server state is different.</strong> Data fetched from an API is not client state — it lives on the server and has a lifecycle (loading, stale, error). Use TanStack Query or SWR for server state, not any of the above.',
      ],
    },
    {
      heading: 'Zustand — minimal global state',
      points: [
        '<strong>Zustand uses a hook-based API</strong> with no Provider needed. Define a store with <code>create(set => ({...}))</code>; consume anywhere with the returned hook.',
        '<strong>Selective subscription</strong> is Zustand\'s key performance advantage: <code>useStore(s =&gt; s.count)</code> subscribes only to <code>count</code>. The component re-renders only when that slice changes — not when unrelated parts of the store update.',
        '<strong>Actions live inside the store.</strong> Collocate state and the functions that update it: <code>increment: () =&gt; set(s =&gt; ({ count: s.count + 1 }))</code>. No separate action types or dispatch needed.',
        '<strong>Zustand vs Context + useReducer:</strong> Zustand is simpler to set up, has selective subscriptions, does not need Provider nesting, and works outside React components (e.g. in WebSocket callbacks). Prefer it for medium/large apps.',
      ],
    },
    {
      heading: 'Jotai — atomic state',
      points: [
        '<strong>Jotai\'s model is bottom-up:</strong> start with small atoms, compose them into derived atoms. Compare with Zustand\'s top-down single-store model.',
        '<strong>Each atom is a piece of state</strong> that components can individually subscribe to. <code>useAtom(countAtom)</code> returns <code>[value, setter]</code> — like useState but globally shared.',
        '<strong>Derived atoms</strong> are computed from other atoms: <code>atom(get =&gt; get(aAtom) + get(bAtom))</code>. They update automatically when their dependencies change — similar to Vue\'s computed properties.',
        '<strong>Jotai scales well for complex data-flow graphs</strong> where many small pieces of state depend on each other. Zustand is simpler for traditional "store with actions" patterns.',
      ],
    },
    {
      heading: 'Redux Toolkit — large-scale state',
      points: [
        '<strong>RTK is the official modern Redux.</strong> <code>createSlice()</code> generates actions and a reducer from a single config object — no more switch/case boilerplate, no separate action type constants.',
        '<strong>Immer is built in</strong> — you can "mutate" state directly in reducers (<code>state.count++</code>) and RTK produces a new immutable state under the hood.',
        '<strong>RTK Query</strong> (included in RTK) handles server state: auto-generates hooks, caches responses, manages loading/error state, and invalidates cache after mutations. It competes with TanStack Query.',
        '<strong>When to choose RTK:</strong> large teams needing standardized patterns, DevTools time-travel debugging, complex async with middleware (thunks, sagas), or when migrating an existing Redux codebase.',
      ],
    },
    {
      heading: 'Derived state — the golden rule',
      points: [
        '<strong>Never store what you can compute.</strong> If a value can be calculated from existing state, it is derived state — store it in useMemo, a Zustand selector, or a Jotai derived atom, not in another useState.',
        '<strong>Derived state keeps state atomic.</strong> Fewer primary state variables = fewer synchronization bugs. The classic mistake: storing both <code>items</code> and <code>total</code> when total is just <code>items.reduce(...)</code>.',
        '<strong>Selectors</strong> (in Redux/Zustand) and <code>atom(get =&gt; ...)</code> (Jotai) are the idiomatic way to derive data from the store. Memoized selectors (Reselect, Zustand\'s subscribeWithSelector) prevent unnecessary re-renders.',
        '<strong>Resetting to initial state:</strong> in Zustand, add a <code>reset: () =&gt; set(initialState)</code> action. In RTK, handle a reset action in extraReducers or use the action creator from the slice.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Zustand store',
      language: 'typescript',
      code: `import { create } from 'zustand';

interface CartItem { id: number; name: string; price: number; qty: number; }

interface CartStore {
  items: CartItem[];
  total: number;
  addItem:    (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: number) => void;
  updateQty:  (id: number, qty: number) => void;
  clearCart:  () => void;
}

const calcTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0);

export const useCartStore = create<CartStore>(set => ({
  items: [],
  total: 0,

  addItem: item => set(s => {
    const exists = s.items.find(i => i.id === item.id);
    const items  = exists
      ? s.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      : [...s.items, { ...item, qty: 1 }];
    return { items, total: calcTotal(items) };
  }),

  removeItem: id => set(s => {
    const items = s.items.filter(i => i.id !== id);
    return { items, total: calcTotal(items) };
  }),

  updateQty: (id, qty) => set(s => {
    const items = qty <= 0
      ? s.items.filter(i => i.id !== id)
      : s.items.map(i => i.id === id ? { ...i, qty } : i);
    return { items, total: calcTotal(items) };
  }),

  clearCart: () => set({ items: [], total: 0 }),
}));

// Usage — selective subscription
function CartBadge() {
  const count = useCartStore(s => s.items.length);   // re-renders only when count changes
  return <span>{count}</span>;
}

function CartTotal() {
  const total = useCartStore(s => s.total);           // re-renders only when total changes
  return <strong>\${total.toFixed(2)}</strong>;
}

function AddToCartButton({ item }: { item: Omit<CartItem, 'qty'> }) {
  const addItem = useCartStore(s => s.addItem);       // stable reference — no re-render
  return <button onClick={() => addItem(item)}>Add to cart</button>;
}`,
    },
    {
      label: 'Jotai atoms',
      language: 'typescript',
      code: `import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Primitive atoms
const countAtom  = atom(0);
const stepAtom   = atom(1);

// Derived (read-only) atom — recomputes when dependencies change
const doubledAtom = atom(get => get(countAtom) * 2);

// Write atom — custom setter logic
const incrementAtom = atom(
  get => get(countAtom),
  (get, set) => set(countAtom, get(countAtom) + get(stepAtom))
);

function Counter() {
  const [count,  setCount]  = useAtom(countAtom);
  const [step,   setStep]   = useAtom(stepAtom);
  const doubled             = useAtomValue(doubledAtom);
  const increment           = useSetAtom(incrementAtom);

  return (
    <div>
      <p>Count: {count} (doubled: {doubled})</p>
      <label>Step: <input type="number" value={step} onChange={e => setStep(+e.target.value)} /></label>
      <button onClick={increment}>+ {step}</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Atom families — parameterized atoms
import { atomFamily } from 'jotai/utils';
const todoAtom = atomFamily((id: number) => atom({ id, text: '', done: false }));

function TodoItem({ id }: { id: number }) {
  const [todo, setTodo] = useAtom(todoAtom(id));
  return (
    <li>
      <input type="checkbox" checked={todo.done} onChange={() => setTodo(t => ({ ...t, done: !t.done }))} />
      {todo.text}
    </li>
  );
}`,
    },
    {
      label: 'Redux Toolkit (RTK)',
      language: 'typescript',
      code: `import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit';
import { useSelector, useDispatch, Provider } from 'react-redux';

interface Todo { id: number; text: string; done: boolean; }
interface TodoState { items: Todo[]; filter: 'all' | 'active' | 'done'; }

const todoSlice = createSlice({
  name: 'todos',
  initialState: { items: [], filter: 'all' } as TodoState,
  reducers: {
    addTodo:    (s, a: PayloadAction<string>) => { s.items.push({ id: Date.now(), text: a.payload, done: false }); },
    toggleTodo: (s, a: PayloadAction<number>) => { const t = s.items.find(t => t.id === a.payload); if (t) t.done = !t.done; },
    removeTodo: (s, a: PayloadAction<number>) => { s.items = s.items.filter(t => t.id !== a.payload); },
    setFilter:  (s, a: PayloadAction<TodoState['filter']>) => { s.filter = a.payload; },
  },
});

export const { addTodo, toggleTodo, removeTodo, setFilter } = todoSlice.actions;

export const store = configureStore({ reducer: { todos: todoSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// Typed hooks
const useAppSelector = useSelector.withTypes<RootState>();
const useAppDispatch = useDispatch.withTypes<AppDispatch>();

function TodoList() {
  const { items, filter } = useAppSelector(s => s.todos);
  const dispatch = useAppDispatch();
  const visible = items.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  return (
    <ul>
      {visible.map(t => (
        <li key={t.id}>
          <input type="checkbox" checked={t.done} onChange={() => dispatch(toggleTodo(t.id))} />
          {t.text}
        </li>
      ))}
    </ul>
  );
}

// Wrap app in Provider
function App() {
  return <Provider store={store}><TodoList /></Provider>;
}`,
    },
    {
      label: 'Decision tree',
      language: 'typescript',
      code: `/*
 * React State — Decision Tree
 * ─────────────────────────────────────────────────────────────────────
 *
 * Is the state used by only one component?
 *   → useState / useReducer (local state)
 *
 * Is it needed by 2–3 closely related components?
 *   → Lift state to their common ancestor + pass as props
 *
 * Is it needed by many components or across unrelated subtrees?
 *   ├── Does it change infrequently? (theme, locale, auth)
 *   │     → Context + useState/useReducer (zero dependencies)
 *   └── Does it change frequently or does performance matter?
 *         → Zustand or Jotai (selective subscriptions, no Provider)
 *
 * Is it server/API data with caching + background refresh needs?
 *   → TanStack Query or SWR (NOT any of the above)
 *
 * Do you need DevTools time-travel, complex middleware, or
 * standardized patterns across a large team?
 *   → Redux Toolkit
 *
 * ─────────────────────────────────────────────────────────────────────
 * Rule: always start simple, move up the ladder only when you hit
 * an actual problem — not because you might need it someday.
 */

// ZUSTAND — when to pick it
// ✅ Global state, no Provider needed
// ✅ Many components need selective access
// ✅ State needs to be read outside React (WebSocket, timer callbacks)
// ✅ Simple migration path from Context — same API shape

// JOTAI — when to pick it
// ✅ Many small, independent pieces of state
// ✅ Complex data-flow graphs where atoms depend on other atoms
// ✅ Want React Suspense-native async atoms
// ✅ Prefer bottom-up composition over top-down store

// REDUX TOOLKIT — when to pick it
// ✅ Large team needing conventions and code-review guardrails
// ✅ DevTools time-travel is a requirement
// ✅ Complex async flows (RTK Query replaces TanStack Query for some teams)
// ✅ Existing Redux codebase being modernised`,
    },
    {
      label: 'Zustand with devtools + persist',
      language: 'typescript',
      code: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsStore {
  theme:       'light' | 'dark';
  language:    string;
  setTheme:    (t: 'light' | 'dark') => void;
  setLanguage: (l: string) => void;
}

export const useSettings = create<SettingsStore>()(
  devtools(        // adds Redux DevTools support
    persist(       // persists to localStorage automatically
      set => ({
        theme:       'light',
        language:    'en',
        setTheme:    theme    => set({ theme },    false, 'setTheme'),
        setLanguage: language => set({ language }, false, 'setLanguage'),
      }),
      { name: 'app-settings' }   // localStorage key
    ),
    { name: 'SettingsStore' }    // DevTools label
  )
);

// Zustand subscribeWithSelector — react to store changes outside components
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(subscribeWithSelector(set => ({
  count: 0,
  increment: () => set(s => ({ count: s.count + 1 })),
})));

// Subscribe to a slice change outside React — useful for analytics, syncing
const unsub = useStore.subscribe(
  s => s.count,
  count => console.log('Count changed to:', count)
);
// Call unsub() to unsubscribe`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing derived state',
      wrong: `const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);   // derived — always items.reduce(...)

const addItem = (item) => {
  const next = [...items, item];
  setItems(next);
  setTotal(next.reduce((s, i) => s + i.price, 0));  // must remember to sync`,
      right: `const [items, setItems] = useState([]);
const total = useMemo(() => items.reduce((s, i) => s + i.price, 0), [items]);
// total always matches items — impossible to forget`,
      explanation: 'Storing derived state creates a synchronization problem — you must update both pieces of state together. Derive it with useMemo or a selector instead.',
    },
    {
      title: 'Subscribing to the entire Zustand store',
      wrong: `// Re-renders on ANY store change
function CartBadge() {
  const store = useCartStore();   // subscribes to everything
  return <span>{store.items.length}</span>;
}`,
      right: `// Re-renders only when items.length changes
function CartBadge() {
  const count = useCartStore(s => s.items.length);
  return <span>{count}</span>;
}`,
      explanation: 'Calling useCartStore() with no selector subscribes to the entire store. Every store update triggers a re-render. Always pass a selector to subscribe to only what the component needs.',
    },
    {
      title: 'Using local state for server data',
      wrong: `const [users, setUsers]   = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers).finally(() => setLoading(false));
}, []);
// No caching, no background refetch, no deduplication`,
      right: `import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });
}`,
      explanation: 'Server data has its own lifecycle — stale, loading, error, background refresh. TanStack Query handles all of this automatically. Manual useState + useEffect for API data is an anti-pattern.',
    },
    {
      title: 'Calling Zustand actions that mutate state directly',
      wrong: `export const useStore = create(set => ({
  items: [],
  addItem: item => set(s => {
    s.items.push(item);   // mutates the state directly — referential equality breaks
    return s;
  }),
}));`,
      right: `export const useStore = create(set => ({
  items: [],
  addItem: item => set(s => ({ items: [...s.items, item] })),   // new array reference
}));`,
      explanation: 'Zustand uses Object.is comparison. Mutating and returning the same object reference means Zustand thinks nothing changed and skips re-renders. Always return a new object/array.',
    },
    {
      title: 'Creating Zustand stores inside components',
      wrong: `function MyComponent() {
  // Creates a new store on every render
  const useStore = create(set => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }));
  const count = useStore(s => s.count);
}`,
      right: `// Define store at module scope — created once
export const useCountStore = create(set => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}));

function MyComponent() {
  const count = useCountStore(s => s.count);
}`,
      explanation: 'create() should be called at module scope, not inside a component. Calling it inside a component creates a new isolated store on every render, losing all state between renders.',
    },
    {
      title: 'Not using immer-style mutations in RTK slices',
      wrong: `const todoSlice = createSlice({
  reducers: {
    addTodo: (state, action) => {
      return { ...state, items: [...state.items, action.payload] };  // manual spread — verbose
    },
  },
});`,
      right: `const todoSlice = createSlice({
  reducers: {
    addTodo: (state, action) => {
      state.items.push(action.payload);   // Immer handles immutability
    },
  },
});`,
      explanation: 'RTK uses Immer under the hood inside createSlice reducers. You can safely mutate state directly — Immer tracks changes and produces a new immutable state. No need for manual spread.',
    },
  ];

  challenge: Challenge = {
    title: 'Zustand Product Filter Store',
    language: 'typescript',
    description: `Build a product filtering app using a Zustand store:

Store state:
- products: Product[] (id, name, price, category, inStock)
- search: string
- selectedCategory: string | 'all'
- maxPrice: number
- showInStockOnly: boolean

Derived (computed) values inside the store:
- filteredProducts: Product[] — computed from all filter state
- categories: string[] — unique list from products

Actions: setSearch, setCategory, setMaxPrice, toggleInStock, resetFilters

Requirements:
1. Define the Zustand store with all state + actions
2. filteredProducts should be a getter (derived, not stored separately)
3. Three filter components — SearchBar, CategoryFilter, PriceFilter — each subscribes to only its relevant slice
4. ProductList subscribes only to filteredProducts
5. A ResetButton subscribes only to the resetFilters action`,
    hints: [
      'For derived computed values in Zustand, use a getter in the store definition: get filteredProducts() { return this.products.filter(...) } — or compute inside a selector function',
      'Alternative: compute filteredProducts directly in the selector: useStore(s => s.products.filter(p => p.name.includes(s.search)))',
      'Each filter component should select only its own state + setter: const [search, setSearch] = useStore(s => [s.search, s.setSearch])',
      'resetFilters: () => set({ search: "", selectedCategory: "all", maxPrice: Infinity, showInStockOnly: false })',
    ],
    starterCode: `import { create } from 'zustand';

interface Product { id: number; name: string; price: number; category: string; inStock: boolean; }

const PRODUCTS: Product[] = [
  { id: 1, name: 'React Handbook', price: 29, category: 'Books',  inStock: true  },
  { id: 2, name: 'TypeScript Course', price: 49, category: 'Courses', inStock: true },
  { id: 3, name: 'VS Code Theme', price: 9, category: 'Tools', inStock: false },
  { id: 4, name: 'Node.js Guide', price: 35, category: 'Books', inStock: true },
];

interface FilterStore {
  products: Product[];
  search: string;
  selectedCategory: string;
  maxPrice: number;
  showInStockOnly: boolean;
  // TODO: add actions
}

const useFilterStore = create<FilterStore>(set => ({
  products: PRODUCTS,
  search: '',
  selectedCategory: 'all',
  maxPrice: 200,
  showInStockOnly: false,
  // TODO: implement actions
}));

// TODO: SearchBar, CategoryFilter, PriceFilter, ProductList, ResetButton components`,
    solution: `import { create } from 'zustand';

interface Product { id: number; name: string; price: number; category: string; inStock: boolean; }
const PRODUCTS: Product[] = [
  { id: 1, name: 'React Handbook',    price: 29, category: 'Books',   inStock: true  },
  { id: 2, name: 'TypeScript Course', price: 49, category: 'Courses', inStock: true  },
  { id: 3, name: 'VS Code Theme',     price: 9,  category: 'Tools',   inStock: false },
  { id: 4, name: 'Node.js Guide',     price: 35, category: 'Books',   inStock: true  },
];

interface FilterStore {
  products: Product[];
  search: string;
  selectedCategory: string;
  maxPrice: number;
  showInStockOnly: boolean;
  setSearch:          (s: string) => void;
  setCategory:        (c: string) => void;
  setMaxPrice:        (p: number) => void;
  toggleInStock:      () => void;
  resetFilters:       () => void;
}

const useFilterStore = create<FilterStore>(set => ({
  products: PRODUCTS,
  search: '', selectedCategory: 'all', maxPrice: 200, showInStockOnly: false,
  setSearch:     search          => set({ search }),
  setCategory:   selectedCategory => set({ selectedCategory }),
  setMaxPrice:   maxPrice        => set({ maxPrice }),
  toggleInStock: ()              => set(s => ({ showInStockOnly: !s.showInStockOnly })),
  resetFilters:  ()              => set({ search: '', selectedCategory: 'all', maxPrice: 200, showInStockOnly: false }),
}));

// Derived selector — computed outside the store
const useFiltered = () => useFilterStore(s =>
  s.products.filter(p =>
    p.name.toLowerCase().includes(s.search.toLowerCase()) &&
    (s.selectedCategory === 'all' || p.category === s.selectedCategory) &&
    p.price <= s.maxPrice &&
    (!s.showInStockOnly || p.inStock)
  )
);

const useCategories = () => useFilterStore(s => ['all', ...new Set(s.products.map(p => p.category))]);

function SearchBar() {
  const search    = useFilterStore(s => s.search);
  const setSearch = useFilterStore(s => s.setSearch);
  return <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" />;
}

function CategoryFilter() {
  const selected    = useFilterStore(s => s.selectedCategory);
  const setCategory = useFilterStore(s => s.setCategory);
  const categories  = useCategories();
  return (
    <select value={selected} onChange={e => setCategory(e.target.value)}>
      {categories.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function PriceFilter() {
  const maxPrice    = useFilterStore(s => s.maxPrice);
  const setMaxPrice = useFilterStore(s => s.setMaxPrice);
  return <input type="range" min={0} max={200} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} />;
}

function ProductList() {
  const products = useFiltered();
  return (
    <ul>{products.length
      ? products.map(p => <li key={p.id}>{p.name} — \${p.price} {p.inStock ? '✓' : '✗'}</li>)
      : <li>No results</li>
    }</ul>
  );
}

function ResetButton() {
  const reset = useFilterStore(s => s.resetFilters);
  return <button onClick={reset}>Reset filters</button>;
}

export default function App() {
  return (
    <div>
      <SearchBar /><CategoryFilter /><PriceFilter /><ResetButton />
      <ProductList />
    </div>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary performance advantage of Zustand over React Context?',
      options: ['Zustand is faster because it is not built on React', 'Zustand supports selective subscriptions — components re-render only when their subscribed slice changes', 'Zustand automatically batches all state updates', 'Zustand uses Web Workers for state updates'],
      answer: 1,
      explanation: 'Zustand\'s selector function (useStore(s => s.count)) means the component only re-renders when count changes. Context re-renders all consumers whenever any part of the context value changes.',
    },
    {
      q: 'When would you choose Jotai over Zustand?',
      options: ['When you need DevTools support', 'When state is better modeled as many small, independent pieces with complex derivation between them', 'When you need persistence to localStorage', 'When working with class components'],
      answer: 1,
      explanation: 'Jotai\'s atom model excels when you have many small pieces of state that derive from each other (dependency graph). Zustand is simpler for a single store with co-located actions.',
    },
    {
      q: 'What does createSlice() return in Redux Toolkit?',
      options: ['A React hook', 'An object with actions, reducer, and name — generated from the config', 'A middleware function', 'A selector creator'],
      answer: 1,
      explanation: 'createSlice() generates action creators and a reducer from a single config object. It uses Immer under the hood so you can write "mutating" reducer logic that produces immutable state.',
    },
    {
      q: 'Why should server state (API data) use TanStack Query instead of useState?',
      options: ['useState does not support async operations', 'TanStack Query provides caching, background refetch, deduplication, and stale-while-revalidate — none of which useState offers', 'TanStack Query is faster than useState', 'useState does not work with fetch()'],
      answer: 1,
      explanation: 'Server state has a unique lifecycle: loading, stale, error, background refresh. TanStack Query manages this automatically. useState + useEffect requires you to re-implement all of this manually and miss edge cases.',
    },
    {
      q: 'What happens when you call useCartStore() (no selector) in Zustand?',
      options: ['You get only the state, not the actions', 'The component subscribes to the entire store and re-renders on any change', 'The component never re-renders', 'Zustand throws an error'],
      answer: 1,
      explanation: 'Without a selector, useCartStore() subscribes to the whole store. Any state change — even an unrelated field — triggers a re-render. Always pass a selector to subscribe to only what you need.',
    },
    {
      q: 'What is "derived state" and how should you handle it?',
      options: ['State received via props — lift it to the parent', 'A value that can be computed from existing state — derive it with useMemo or a selector, do not store separately', 'State from a context — use useContext', 'State from an API — use TanStack Query'],
      answer: 1,
      explanation: 'Derived state (e.g. total from items.reduce) should be computed, not stored. Storing it duplicates the source of truth and creates synchronization bugs when one piece updates but the other doesn\'t.',
    },
    {
      q: 'How does RTK\'s createSlice allow you to write "mutating" code in reducers?',
      options: ['RTK stores state in a MutableRef', 'RTK uses Immer under the hood — your mutations are tracked and produce a new immutable state', 'RTK clones the state before the reducer runs', 'JavaScript objects are always mutable in RTK'],
      answer: 1,
      explanation: 'createSlice wraps reducers with Immer\'s produce. When you write state.items.push(item), Immer tracks the draft mutations and returns a new immutable state — no spread syntax needed.',
    },
    {
      q: 'At what scope should a Zustand store be defined?',
      options: ['Inside each component that uses it', 'In a useEffect', 'At module scope, outside all components', 'Inside a Context Provider'],
      answer: 2,
      explanation: 'The Zustand create() call must be at module scope so it runs once and creates a single store. Calling it inside a component creates a new store on every render, losing all state between re-renders.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use both Zustand and TanStack Query in the same app?',
      a: 'Yes — and this is the recommended pattern. Zustand manages client state (cart, UI state, auth preferences). TanStack Query manages server state (fetched data, cache, background refresh). They are complementary, not competing.',
    },
    {
      q: 'How do I share Zustand state between micro-frontends or iframes?',
      a: 'Use Zustand\'s subscribeWithSelector + a cross-window messaging channel (BroadcastChannel, postMessage). Each window has its own store, and you sync specific slices via messages. Alternatively, use a shared backend as the source of truth and invalidate caches.',
    },
    {
      q: 'Is Redux Toolkit still worth learning in 2024?',
      a: 'Yes if you join a team using Redux, need complex async with RTK Query, or want DevTools time-travel. For greenfield apps, Zustand is simpler and covers most use cases. RTK\'s slice pattern is excellent — even if you don\'t use the full Redux stack.',
    },
    {
      q: 'How do I reset a Zustand store to its initial state?',
      a: 'Define the initial state as a const outside create(), then add a reset action: reset: () => set(initialState). For nested stores, use set(state => ({ ...state, ...initialState })) to preserve non-resettable fields.',
    },
    {
      q: 'What is Zustand\'s immer middleware?',
      a: 'Zustand has an optional immer middleware that lets you write mutating code in Zustand set() calls, the same way RTK does: set(s => { s.count++ }). Install it from zustand/middleware. Useful if your store has deeply nested objects.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Pick the simplest tool for the job: useState → lift → Context → Zustand/Jotai → RTK; server state always goes to TanStack Query.',
    mustKnow: [
      'useState for local state; useReducer for complex local/shared; Context for stable global values',
      'Zustand: create() at module scope, always use selectors — no full-store subscriptions',
      'Jotai: atomic bottom-up model, derived atoms, atom families for parameterized state',
      'RTK: createSlice generates actions + reducer with Immer; useSelector + useDispatch consume the store',
      'Never store derived state — compute with useMemo/selector; never store server state in useState',
      'Server state (API data): TanStack Query or SWR — not any client-state tool',
    ],
    interviewFocus: [
      'Walk through the React state decision tree — when do you move from useState to Zustand?',
      'How does Zustand\'s selective subscription prevent unnecessary re-renders vs Context?',
      'What problem does TanStack Query solve that Zustand/Context cannot?',
      'Explain Immer\'s role in RTK — why can you "mutate" state in createSlice reducers?',
    ],
  };
}
