import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint }         from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }               from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion }          from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }                from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge }        from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem }           from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent }                         from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                     from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake }   from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary }   from '../../../shared/revision-card/revision-card';

const quickRef: QuickRefItem[] = [
  { name: 'JSX',                    type: 'syntax',    desc: 'HTML-like syntax compiled to React.createElement() calls' },
  { name: 'React.createElement',    type: 'function',  desc: 'Produces a React element (plain JS object) describing a DOM node' },
  { name: 'Reconciliation',         type: 'keyword',   desc: 'React\'s diffing algorithm comparing old vs new virtual DOM trees' },
  { name: 'Fiber',                  type: 'keyword',   desc: 'React\'s incremental rendering engine — enables concurrent features' },
  { name: 'key prop',               type: 'accessor',  desc: 'Stable identity hint for list items — tells React which element moved/changed' },
  { name: 'Fragment (<>…</>)',       type: 'syntax',    desc: 'Group siblings without adding a real DOM node' },
  { name: 'props',                  type: 'keyword',   desc: 'Read-only inputs passed from parent to child — triggers re-render on change' },
  { name: 'children prop',          type: 'accessor',  desc: 'Implicit prop containing anything placed between component tags' },
  { name: 'defaultProps (legacy)',  type: 'accessor',  desc: 'Old way to set defaults; use ES default parameters in function components' },
  { name: 'StrictMode',             type: 'class',     desc: 'Development-only wrapper that double-invokes renders to detect side-effects' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What React Is (and Isn\'t)',
    points: [
      '<strong>React is a UI library, not a framework.</strong> It only handles the view layer — rendering components to the DOM. Routing (React Router), data fetching (TanStack Query), forms (React Hook Form), and state management (Zustand, Redux) are all separate packages you choose yourself. This keeps React small and composable but means you assemble your own stack.',
      '<strong>React uses a virtual DOM.</strong> Instead of updating the real DOM directly, React maintains an in-memory representation. On each render it diffs the new tree against the previous one (reconciliation) and applies only the minimal set of real DOM changes. This batching avoids unnecessary reflows and repaints.',
      '<strong>React 18 introduced concurrent rendering.</strong> The Fiber architecture lets React pause, abort, and resume rendering work. This enables <code>useTransition</code>, <code>Suspense</code>, automatic batching, and streaming SSR. Concurrent mode is opt-in via <code>createRoot</code> (the modern API) rather than the legacy <code>ReactDOM.render</code>.',
      '<strong>The component model is the core abstraction.</strong> A React component is a function that accepts props and returns JSX. React calls it on each render, producing a description of the UI. Components compose — you build large UIs by nesting smaller ones. Lifecycle, state, and side effects attach to components via hooks.',
    ],
  },
  {
    heading: 'JSX — Syntax and Transform',
    points: [
      '<strong>JSX is not HTML.</strong> It is a syntax extension that Babel/esbuild compiles to <code>React.createElement(type, props, ...children)</code> calls. The resulting objects are plain JS — React reads them to build the virtual DOM tree. JSX attributes use camelCase (<code>className</code>, <code>onClick</code>) because they map to JS object keys, not HTML attributes.',
      '<strong>JSX expressions use curly braces.</strong> Anything in <code>{ }</code> is evaluated as a JavaScript expression: <code>{"{"}{user.name}{"}"}</code>, <code>{"{"}{count * 2}{"}"}</code>, <code>{"{"}{isAdmin ? <Admin /> : <User />}{"}"}</code>. Statements (if, for) cannot go in JSX directly — use expressions, ternaries, or extract logic into variables.',
      '<strong>React 17+ automatic JSX transform.</strong> With the new JSX transform (<code>"jsx": "react-jsx"</code> in tsconfig), you no longer need to import React in every file. The compiler auto-imports <code>jsx()</code> from <code>react/jsx-runtime</code>. You still need <code>import React from "react"</code> when using hooks or React-specific APIs directly.',
      '<strong>JSX is sanitised by default.</strong> Values interpolated inside JSX are escaped — any string is rendered as text, not HTML. Only <code>dangerouslySetInnerHTML</code> bypasses this. This makes XSS via JSX very hard: you have to explicitly opt out of escaping.',
      '<strong>Self-closing tags are mandatory for empty elements.</strong> <code>{"<"}img{">"}</code> is invalid JSX; you must write <code>{"<"}img /{">"}</code>. This applies to any component with no children.',
    ],
  },
  {
    heading: 'Components and Props',
    points: [
      '<strong>A React component is a function.</strong> It takes a single <code>props</code> object and returns React elements (JSX). The naming convention is PascalCase — lowercase names are treated as HTML elements by JSX. Components can be defined inline or in their own files; each file can export multiple components.',
      '<strong>Props are read-only.</strong> You never mutate props inside a component. If you need to derive local state from props, do it with <code>useState</code> (initialized once) or compute it directly (if it\'s a pure derivation). Mutating props silently — like assigning <code>props.value = newVal</code> — breaks React\'s unidirectional data flow.',
      '<strong>Children are just another prop.</strong> <code>{"<"}Card{">"}{"{"}children{"}"}{"/"}Card{">"}</code> places whatever is between the tags in <code>props.children</code>. TypeScript type: <code>children: React.ReactNode</code> for any renderable content. Render props extend this pattern: pass a function as children for dynamic rendering.',
      '<strong>Default parameters replace defaultProps.</strong> Legacy <code>Component.defaultProps = {"{"}{"}{"}"}</code> is being deprecated. Use ES default parameter syntax instead: <code>function Card({"{"} title = "Untitled", size = "md" {"}"})</code>. This is statically analysable by TypeScript and doesn\'t require post-declaration mutations.',
      '<strong>Prop spreading must be intentional.</strong> <code>{"<"}div {...rest}{"/"}{">"}</code> passes all remaining props to the underlying element — useful for wrapper components that forward HTML attributes. The risk: accidentally passing invalid DOM attributes (like <code>isActive</code>) that show up in the HTML. Use TypeScript to catch these at compile time.',
    ],
  },
  {
    heading: 'Rendering, Re-renders, and the Reconciler',
    points: [
      '<strong>A render is just a function call.</strong> React calls your component function, gets back JSX, and walks the tree. "Rendering" does not mean the DOM is being updated — it means React is computing what the DOM should look like. A DOM update only happens if the diff finds a change.',
      '<strong>Re-renders trigger on state or prop changes.</strong> A component re-renders when: its own state changes (via a setter), its parent re-renders and passes new props, or a context it subscribes to changes. Re-rendering is cheap — React bails out early if the output is identical (referential equality for objects). Profiler helps identify when renders are unexpected.',
      '<strong>React batches state updates in React 18.</strong> Multiple state updates within the same event handler (or async code) are batched automatically — a single re-render happens at the end. This was already true for synchronous event handlers in React 17, but React 18 extends it to async code, timeouts, and native event listeners.',
      '<strong>Keys tell the reconciler about list item identity.</strong> Without a stable <code>key</code>, React assumes position determines identity — reordering items causes destructive updates. With a stable key (a unique ID, not an index), React can move the existing DOM node instead of recreating it. Using index as key is acceptable only for static, never-reordered lists.',
      '<strong>React.StrictMode double-invokes renders.</strong> In development, StrictMode calls your component function twice to help detect unintended side effects. The second render is discarded — only the first result is committed. This surface-level pain is worth it: it catches state mutations, missing useEffect cleanups, and deprecated APIs early.',
    ],
  },
  {
    heading: 'Fragments, Portals, and Lists',
    points: [
      '<strong>Fragments group elements without adding DOM nodes.</strong> <code>{"<>"}{" "}{"</>"}</code> (shorthand) or <code>{"<"}React.Fragment key={"{id}"}{">"}</code> (when you need a key) return multiple siblings without wrapping them in a <code>div</code>. This preserves correct HTML structure (e.g., <code>{"<"}tr{">"}</code> children that can\'t have a <code>div</code> parent).',
      '<strong>Lists require stable keys.</strong> Every element in a <code>.map()</code> rendered list needs a <code>key</code> prop — React warns without it and degrades reconciliation quality. The key must be unique among siblings (not globally unique). IDs from your data are ideal; avoid using <code>Math.random()</code> (new key every render = full remount).',
      '<strong>Portals render into a different DOM node.</strong> <code>ReactDOM.createPortal({"<"}Modal /{">"}, document.body)</code> renders the component\'s output in a separate DOM location while keeping it logically in the React tree. Events still bubble up through the React component tree as expected. Use for modals, tooltips, and dropdowns that need to escape CSS overflow/z-index constraints.',
      '<strong>Conditional rendering uses JavaScript expressions.</strong> <code>{"{"}{condition} && {"<"}Comp /{">"}{}</code> is the idiomatic short-circuit pattern. Caution: if <code>condition</code> is <code>0</code>, React renders "0" as text (because 0 is falsy but is a valid renderable value). Use ternaries or convert to a boolean: <code>Boolean(count) && {"<"}Comp /{">"}</code>.',
    ],
  },
  {
    heading: 'Event Handling and the Synthetic Event System',
    points: [
      '<strong>React uses a synthetic event system.</strong> All event handlers receive a <code>SyntheticEvent</code> — a wrapper around the native browser event. React attaches a single event listener at the root (event delegation), not on each element. This is more efficient and consistent across browsers. Most native properties and methods are mirrored on SyntheticEvent.',
      '<strong>Event handler naming uses camelCase in JSX.</strong> HTML uses <code>onclick</code>; JSX uses <code>onClick</code>. You pass a function reference, not a string: <code>onClick={handleClick}</code>. Avoid inline arrow functions in performance-critical lists — they create a new function on every render, defeating <code>React.memo</code>.',
      '<strong>Prevent default must be explicit.</strong> React\'s synthetic events do not support <code>return false</code> to prevent default browser behaviour (unlike jQuery). You must call <code>event.preventDefault()</code> explicitly in the handler. The same applies to <code>event.stopPropagation()</code> for stopping event bubbling.',
      '<strong>React 18 event priority.</strong> React classifies user interactions (clicks, keypresses) as high-priority; background work (data fetching, non-urgent updates) can be marked low-priority via <code>startTransition</code>. This is what keeps the UI responsive when triggering expensive state updates — React can interrupt low-priority renders to handle a user click.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'JSX & Components',
    language: 'typescript',
    code: `// A minimal React component in TypeScript
interface GreetingProps {
  name: string;
  role?: 'admin' | 'user';
}

function Greeting({ name, role = 'user' }: GreetingProps) {
  return (
    <div className="greeting">
      <h1>Hello, {name}!</h1>
      {role === 'admin' && <span className="badge">Admin</span>}
    </div>
  );
}

// Composition — components inside components
function App() {
  const users = [
    { id: 1, name: 'Alice', role: 'admin' as const },
    { id: 2, name: 'Bob',   role: 'user'  as const },
  ];

  return (
    <>
      <header>
        <h1>DevHub</h1>
      </header>
      <main>
        {users.map(u => (
          // stable key = ID from data, not array index
          <Greeting key={u.id} name={u.name} role={u.role} />
        ))}
      </main>
    </>
  );
}`,
  },
  {
    label: 'Props & Children',
    language: 'typescript',
    code: `import { ReactNode } from 'react';

// Typed children prop
interface CardProps {
  title: string;
  variant?: 'default' | 'highlight';
  children: ReactNode;          // any renderable value
  onDismiss?: () => void;
}

function Card({ title, variant = 'default', children, onDismiss }: CardProps) {
  return (
    <div className={\`card card--\${variant}\`}>
      <div className="card-header">
        <h2>{title}</h2>
        {onDismiss && (
          <button onClick={onDismiss} aria-label="Dismiss">✕</button>
        )}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage — children passed between tags
function Dashboard() {
  return (
    <Card title="Summary" onDismiss={() => console.log('dismissed')}>
      <p>Everything is running smoothly.</p>
      <a href="/metrics">View metrics →</a>
    </Card>
  );
}`,
  },
  {
    label: 'JSX Compilation',
    language: 'typescript',
    code: `// What you write:
const element = <h1 className="title">Hello</h1>;

// What Babel/esbuild compiles it to (React 17+ transform):
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx('h1', { className: 'title', children: 'Hello' });

// JSX with dynamic content:
const count = 5;
const ui = (
  <div>
    <p>Count: {count}</p>
    {count > 3 ? <strong>High</strong> : <span>Low</span>}
  </div>
);
// Compiles to (simplified):
const ui2 = _jsx('div', {
  children: [
    _jsx('p', { children: ['Count: ', count] }),
    count > 3
      ? _jsx('strong', { children: 'High' })
      : _jsx('span',   { children: 'Low'  }),
  ],
});

// Self-closing required for void-like elements:
const img  = <img src="/logo.png" alt="logo" />;   // OK
// const bad = <img src="/logo.png" alt="logo">;    // SyntaxError`,
  },
  {
    label: 'Keys & Reconciliation',
    language: 'typescript',
    code: `interface Item { id: number; text: string; done: boolean; }

function TodoList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        // GOOD: stable key from data ID
        <li key={item.id} className={item.done ? 'done' : ''}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

// Why key matters — without it React uses position:
//   [A, B, C]  →  [D, A, B, C]
//   React sees 4 nodes at same positions; deletes old 4, creates new 4.
//   With key: React recognises A/B/C haven't changed, only D is new.
//   Cost: 4 DOM mutations → 1 DOM insertion.

// BAD — index as key (breaks on reorder/insert):
items.map((item, index) => <li key={index}>{item.text}</li>)
// OK — index as key only when list is static and never reordered.

// Fragments with keys:
items.map(item => (
  <React.Fragment key={item.id}>
    <dt>{item.text}</dt>
    <dd>{item.done ? 'Done' : 'Pending'}</dd>
  </React.Fragment>
))`,
  },
  {
    label: 'Events & StrictMode',
    language: 'typescript',
    code: `import { StrictMode } from 'react';
import { createRoot }   from 'react-dom/client';

// Correct event handling in React + TypeScript
function SearchInput() {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log(e.target.value);        // typed — no 'any'
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();                 // must be explicit — no "return false"
    // process form data...
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="search" onChange={handleChange} placeholder="Search..." />
      <button type="submit">Go</button>
    </form>
  );
}

// Bootstrap with concurrent mode (React 18+)
const root = createRoot(document.getElementById('root')!);
root.render(
  // StrictMode in development: double-invokes render to catch side effects.
  // Has no effect in production.
  <StrictMode>
    <App />
  </StrictMode>
);

// Legacy ReactDOM.render (React 17 and below) — no concurrent features:
// ReactDOM.render(<App />, document.getElementById('root'));`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using index as key in dynamic lists',
    wrong: `// Adding/removing/reordering breaks component state
items.map((item, i) => <Input key={i} defaultValue={item.value} />)`,
    right: `// Stable ID from data preserves DOM identity across mutations
items.map(item => <Input key={item.id} defaultValue={item.value} />)`,
    explanation: 'When items are inserted or removed, index-based keys shift — React incorrectly reuses the wrong DOM nodes, causing stale input values, lost focus, and animation glitches.',
  },
  {
    title: 'Directly mutating props',
    wrong: `function Counter({ count }) {
  count++;            // silently mutates — React won't re-render
  return <p>{count}</p>;
}`,
    right: `function Counter({ count }) {
  const display = count + 1;  // derive a new value, never mutate
  return <p>{display}</p>;
}`,
    explanation: 'Props are owned by the parent. Mutating them skips React\'s change detection — the component appears stuck. Derive new values instead; lift state up if the child needs to change it.',
  },
  {
    title: 'Truthy 0 renders "0" as text',
    wrong: `// When count is 0, renders the string "0" in the DOM
{count && <Badge count={count} />}`,
    right: `{count > 0 && <Badge count={count} />}
// or
{Boolean(count) && <Badge count={count} />}`,
    explanation: 'React renders all valid React nodes, including the number 0. Short-circuit with a falsy number doesn\'t suppress rendering — it renders the number itself. Convert to a boolean comparison.',
  },
  {
    title: 'Forgetting event.preventDefault() in form handlers',
    wrong: `function handleSubmit(e) {
  // page reloads because default form submission fires
  processData(e.target);
}`,
    right: `function handleSubmit(e: React.FormEvent) {
  e.preventDefault();   // stops page reload
  processData(new FormData(e.currentTarget));
}`,
    explanation: 'React does not provide "return false" to prevent default browser behaviour (unlike jQuery event handlers). You must explicitly call e.preventDefault() in every form submit handler.',
  },
  {
    title: 'Using lowercase component names in JSX',
    wrong: `// React treats lowercase as HTML element — renders <mybutton>
function myButton() { return <button>Click</button>; }
const el = <mybutton />;`,
    right: `// PascalCase = React component; lowercase = HTML element
function MyButton() { return <button>Click</button>; }
const el = <MyButton />;`,
    explanation: 'JSX uses the capitalisation of the tag name to decide HTML element vs React component. A lowercase tag always creates a DOM element, which means your component code never runs.',
  },
  {
    title: 'Passing object literals as props without memoization',
    wrong: `// New object reference every render — breaks React.memo on child
<Profile user={{ id: 1, name: 'Alice' }} />`,
    right: `// Stable reference — define outside render or memoize
const user = useMemo(() => ({ id: 1, name: 'Alice' }), []);
<Profile user={user} />`,
    explanation: 'Object literals in JSX create a new reference on every render. Even if values are identical, shallow-equality checks in React.memo fail, causing unnecessary child re-renders.',
  },
];

const challenge: Challenge = {
  title: 'Build a Filterable Product List',
  language: 'typescript',
  description: `Build a <ProductList /> component that:
1. Renders a list of products (id, name, category, price)
2. Shows a filter bar with category chips — clicking a chip filters the list
3. Shows an "in stock" checkbox that further filters the list
4. Highlights the active category chip
5. Shows "No products match your filters" when the filtered list is empty

Use proper key props, typed props, and conditional rendering patterns.`,
  hints: [
    'Derive filteredProducts from the full list using filter() — do not store it in state',
    'Keep selectedCategory and inStockOnly in state; derive everything else',
    'Use a ternary or && for showing the empty state message',
    'A stable product.id is the correct key for the list items',
  ],
  starterCode: `import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'TypeScript Handbook',  category: 'Books',    price: 29, inStock: true  },
  { id: 2, name: 'React Deep Dive',      category: 'Books',    price: 35, inStock: false },
  { id: 3, name: 'Mechanical Keyboard',  category: 'Hardware', price: 120, inStock: true },
  { id: 4, name: 'USB-C Hub',           category: 'Hardware', price: 45, inStock: true  },
  { id: 5, name: 'Figma Pro',           category: 'Software', price: 15, inStock: true  },
];

export function ProductList() {
  // TODO: add state for selectedCategory (string) and inStockOnly (boolean)

  // TODO: derive filteredProducts

  // TODO: extract unique categories for chips

  return (
    <div>
      {/* TODO: render category chips */}
      {/* TODO: render in-stock checkbox */}
      {/* TODO: render product list or empty state */}
    </div>
  );
}`,
  solution: `import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'TypeScript Handbook',  category: 'Books',    price: 29,  inStock: true  },
  { id: 2, name: 'React Deep Dive',      category: 'Books',    price: 35,  inStock: false },
  { id: 3, name: 'Mechanical Keyboard',  category: 'Hardware', price: 120, inStock: true  },
  { id: 4, name: 'USB-C Hub',            category: 'Hardware', price: 45,  inStock: true  },
  { id: 5, name: 'Figma Pro',            category: 'Software', price: 15,  inStock: true  },
];

export function ProductList() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Derived — no separate state needed
  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];

  const filteredProducts = PRODUCTS.filter(p => {
    const categoryMatch = selectedCategory === 'All' || p.category === selectedCategory;
    const stockMatch    = !inStockOnly || p.inStock;
    return categoryMatch && stockMatch;
  });

  return (
    <div className="product-list">
      {/* Category chips */}
      <div className="chip-row">
        {categories.map(cat => (
          <button
            key={cat}
            className={\`chip \${cat === selectedCategory ? 'chip--active' : ''}\`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* In-stock toggle */}
      <label className="stock-filter">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={e => setInStockOnly(e.target.checked)}
        />
        In stock only
      </label>

      {/* Product list or empty state */}
      {filteredProducts.length === 0 ? (
        <p className="empty-state">No products match your filters.</p>
      ) : (
        <ul className="products">
          {filteredProducts.map(p => (
            <li key={p.id} className={\`product \${p.inStock ? '' : 'product--out'}\`}>
              <strong>{p.name}</strong>
              <span className="category">{p.category}</span>
              <span className="price">\${p.price}</span>
              {!p.inStock && <span className="out-badge">Out of stock</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does JSX compile to at the language level?',
    options: ['HTML template strings', 'React.createElement() function calls', 'WebComponent definitions', 'Angular-style decorators'],
    answer: 1,
    explanation: 'JSX is syntactic sugar. A Babel/esbuild transform converts each JSX tag into a React.createElement() (or jsx() with the new runtime) call, producing a plain JS object describing the element type, props, and children.',
  },
  {
    q: 'You have a list: items.map((item, i) => <li key={i}>{item.name}</li>). A new item is prepended to items. What problem does this cause?',
    options: ['React throws an error about duplicate keys', 'All existing items re-render needlessly and can lose state', 'The list renders in reverse order', 'Nothing — index keys work fine here'],
    answer: 1,
    explanation: 'Prepending shifts every index by 1. React now sees a different key at each position, treats every element as changed, and re-creates DOM nodes and resets component state. Stable IDs from your data fix this.',
  },
  {
    q: 'What is the correct way to prevent a form from submitting in React?',
    options: ['Return false from the handler', 'Call event.preventDefault()', 'Use onSubmit={false}', 'Add type="button" to the form'],
    answer: 1,
    explanation: 'React does not support "return false" to cancel native events (unlike jQuery). You must explicitly call event.preventDefault() inside the event handler to stop the browser\'s default form submission behaviour.',
  },
  {
    q: 'What renders in the DOM when React evaluates: {0 && <Badge />}?',
    options: ['Nothing — 0 is falsy so the expression short-circuits', 'The Badge component', 'The string "false"', 'The number 0 as a text node'],
    answer: 3,
    explanation: 'React renders all valid React nodes, including numbers. 0 is falsy but is a renderable value — React outputs it as a text node. Use {count > 0 && <Badge />} or {Boolean(count) && <Badge />} to avoid this.',
  },
  {
    q: 'What does React.StrictMode do in production?',
    options: ['Enforces PropTypes validation', 'Enables concurrent rendering features', 'Has no effect — it is a development-only tool', 'Adds runtime performance monitoring'],
    answer: 2,
    explanation: 'StrictMode is purely a development helper. It has zero runtime cost in production builds. In development it double-invokes renders and effects to surface unintentional side effects and deprecated API usage.',
  },
  {
    q: 'When does React 18 batch state updates?',
    options: ['Only in synchronous event handlers', 'Only when setState is called multiple times on the same line', 'Automatically in all scenarios including async functions, timeouts, and native event listeners', 'Only when using useTransition'],
    answer: 2,
    explanation: 'React 18 introduced automatic batching — all state updates in any context (async, setTimeout, Promises, native event listeners) are batched into a single re-render. In React 17, automatic batching only applied to synthetic event handlers.',
  },
  {
    q: 'Which JSX syntax correctly renders a component named "button"?',
    options: ['<button />', '<Button />', 'React.render("button")', '<button component />'],
    answer: 1,
    explanation: 'JSX uses capitalisation to distinguish React components from HTML elements. A lowercase <button> creates a native HTML button element. <Button> (PascalCase) looks up the Button identifier in scope and calls it as a React component.',
  },
  {
    q: 'What is the recommended way to create a React 18 root?',
    options: ['ReactDOM.render(<App />, el)', 'createRoot(el).render(<App />)', 'new ReactRoot(el).mount(<App />)', 'ReactDOM.hydrate(<App />, el)'],
    answer: 1,
    explanation: 'createRoot() is the React 18 API that enables concurrent rendering features. The legacy ReactDOM.render() still works in React 18 but opts out of concurrent mode and shows a console warning.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between the virtual DOM and the real DOM?',
    a: 'The <strong>real DOM</strong> is the browser\'s live document tree — reading and writing it triggers expensive layout and paint operations. The <strong>virtual DOM</strong> is a lightweight in-memory representation maintained by React. On each render, React builds a new virtual DOM tree and diffs it against the previous one (reconciliation). Only the differences are applied to the real DOM in a batch. This minimises browser work: instead of clearing and rebuilding nodes, React surgically applies the smallest possible set of mutations.',
  },
  {
    q: 'Why does JSX use className instead of class?',
    a: '<code>class</code> is a reserved keyword in JavaScript. JSX maps attribute names to JavaScript object property keys — and because JSX transpiles to plain JavaScript objects, <code>class</code> would be a syntax error in older parsers. The solution was <code>className</code>, mirroring the DOM property <code>element.className</code>. Similarly, <code>for</code> becomes <code>htmlFor</code> on <code>{"<"}label{">"}</code>. With the modern JSX transform these restrictions technically relaxed, but <code>className</code> remains the convention.',
  },
  {
    q: 'When should you use a Fragment vs wrapping elements in a div?',
    a: 'Use a <code>{"<"}Fragment{">"}</code> (or <code>{"<>"}</>{"</"}</code>{">"}) when: (1) you need to return multiple siblings from a component; (2) adding a wrapper <code>div</code> would break CSS layout (e.g. flex/grid direct children); (3) the parent element only accepts specific children (<code>{"<"}tr{">"}</code>, <code>{"<"}ul{">"}</code>, <code>{"<"}dl{">"}</code>). Use a real wrapper element when it carries semantic meaning or needs CSS styling.',
  },
  {
    q: 'What is React Fiber and why was it introduced?',
    a: 'Fiber is React\'s reconciliation engine, rewritten in React 16. The original stack-based reconciler was synchronous — it processed the entire component tree in one uninterruptible pass, blocking the main thread and causing janky UIs for large trees. Fiber broke rendering work into small units that can be paused, prioritised, and resumed. This enabled <strong>concurrent features</strong>: <code>useTransition</code> (low-priority state updates), <code>Suspense</code> (intentional loading states), streaming SSR, and automatic batching in React 18.',
  },
  {
    q: 'What is the difference between a controlled and an uncontrolled component?',
    a: 'A <strong>controlled component</strong> stores input value in React state — the value prop always reflects state, and onChange updates it. React is the "single source of truth." This enables real-time validation, dependent fields, and programmatic resets, but requires an onChange handler. An <strong>uncontrolled component</strong> lets the DOM own the value; you read it via a <code>ref</code> only when needed (e.g., on submit). Uncontrolled components have less boilerplate but offer no real-time reactivity. React Hook Form uses uncontrolled components under the hood for performance.',
  },
  {
    q: 'Why do you never mutate state directly in React?',
    a: 'React schedules re-renders by comparing the old and new state references. If you mutate the existing object — e.g., <code>items.push(newItem)</code> — the reference stays the same, so React\'s comparison sees no change and skips the re-render. The UI becomes out of sync with state. Always create a new reference: <code>setItems([...items, newItem])</code>. For nested objects, spread at each level or use Immer\'s <code>produce()</code> for ergonomic immutable updates.',
  },
  {
    q: 'What is event delegation and how does React use it?',
    a: 'Event delegation is a browser pattern where you attach one listener to an ancestor (like <code>document</code>) instead of one per element. Events bubble up from the target to the ancestor, where you check <code>event.target</code> to decide how to respond. React uses a single event listener attached at the root DOM container (the element passed to <code>createRoot</code>). When a user clicks anywhere, the single listener fires, React identifies which component\'s handler should run based on the virtual DOM tree, and invokes it with a SyntheticEvent. This scales to thousands of elements with zero extra event listeners.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'React is a UI library for building component trees — JSX describes what to render, reconciliation computes minimal DOM patches, and re-renders fire when state or props change.',
  mustKnow: [
    'JSX compiles to <code>React.createElement()</code> — it\'s plain JavaScript objects, not HTML',
    'Reconciliation diffs the virtual DOM tree; only changed nodes update the real DOM',
    '<code>key</code> on list items must be stable and unique among siblings — use data IDs, not indices',
    'Props are read-only; never mutate — always derive or lift state',
    'React 18: automatic batching in all contexts; <code>createRoot</code> enables concurrent features',
    'StrictMode double-invokes renders in dev to catch side-effect bugs — no production cost',
    '0 && <C /> renders "0" — use <code>count {">"} 0 && {"<"}C /{">"}</code> to avoid the text node',
  ],
  interviewFocus: [
    'What is reconciliation? How does React decide what DOM updates to make?',
    'Why is index as key problematic? When is it acceptable?',
    'What does React.StrictMode do and when should you use it?',
    'What is the Fiber architecture and what did it enable over the original stack reconciler?',
    'Controlled vs uncontrolled components — trade-offs and when to use each',
  ],
};

@Component({
  selector: 'app-react-basics',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './basics.html',
  styleUrl: './basics.scss',
})
export class ReactBasics {
  quickRef = quickRef;
  theory   = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz     = quiz;
  qna      = qna;
  revision = revision;
}
