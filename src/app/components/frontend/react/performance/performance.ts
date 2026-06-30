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
  selector: 'app-react-performance',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './performance.html',
  styleUrl: './performance.scss',
})
export class ReactPerformance {
  quickRef: QuickRefItem[] = [
    { name: 'React.memo(Component)',        type: 'function', desc: 'Skip re-render if props are shallowly equal. Pair with useCallback for stable prop refs.' },
    { name: 'useMemo(() => val, [deps])',   type: 'hook',     desc: 'Cache expensive computed value. Recompute only when deps change.' },
    { name: 'useCallback(fn, [deps])',      type: 'hook',     desc: 'Stable function reference — prevents memo\'d children re-rendering on parent re-render.' },
    { name: 'useTransition()',              type: 'hook',     desc: 'Mark state updates as non-urgent to keep UI responsive.' },
    { name: 'useDeferredValue(v)',          type: 'hook',     desc: 'Lag a derived value behind high-priority renders — scheduler-driven debounce.' },
    { name: 'lazy(() => import(...))',      type: 'function', desc: 'Code-split a component. Wrap in Suspense with fallback.' },
    { name: '<Suspense fallback={...}>',    type: 'syntax',   desc: 'Boundary for lazy components and async data. Shows fallback while loading.' },
    { name: 'react-window FixedSizeList',   type: 'class',    desc: 'Virtualised list — only renders visible rows. Essential for 1000+ items.' },
    { name: 'React Profiler (DevTools)',    type: 'method',   desc: 'Flame chart showing component render times and "why did this render?".' },
    { name: 'web-vitals (LCP, INP, CLS)',   type: 'method',   desc: 'Core Web Vitals — measure real-user performance in production.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Profile first — measure before optimising',
      points: [
        '<strong>React DevTools Profiler</strong> is the first tool to reach for. Record an interaction, inspect the flame chart, and check "Why did this render?" for each component. Optimise the components shown in red — don\'t guess.',
        '<strong>Common culprits:</strong> parent re-renders cascading to all children; missing memo + unstable callback props; large lists rendering every item; expensive computations on every render.',
        '<strong>React re-renders are fast</strong> — the virtual DOM diff is cheap. An unnecessary re-render is only a problem if the component\'s render function is genuinely slow (large lists, heavy computation, deep trees). Do not add memo everywhere.',
        '<strong>Production metrics:</strong> Core Web Vitals (LCP, INP, CLS) measure real-user experience. Use web-vitals package + reportWebVitals() to send them to analytics. Lighthouse and Chrome DevTools Performance tab give lab data.',
      ],
    },
    {
      heading: 'React.memo and referential stability',
      points: [
        '<strong>React.memo(Component)</strong> skips re-rendering if every prop is shallowly equal (Object.is). It only works if the props are stable — functions and objects passed as props must have stable references, otherwise memo never helps.',
        '<strong>The memo + useCallback + useMemo trio:</strong> wrap the child in React.memo; wrap callback props in useCallback; wrap object/array props in useMemo. All three are required for the optimisation to work.',
        '<strong>Custom comparison:</strong> React.memo accepts a second argument — <code>areEqual(prevProps, nextProps)</code> returning true to skip re-render. Use for deep comparisons on specific fields, not as a default.',
        '<strong>When memo is not worth it:</strong> components that always re-render because a primitive prop changes; components with very cheap renders; components that receive children (children is always a new reference).',
      ],
    },
    {
      heading: 'Code splitting and lazy loading',
      points: [
        '<strong>React.lazy(() =&gt; import("./Component"))</strong> splits the component into a separate bundle chunk. The browser only downloads it when the component is first rendered. Wrap in <code>&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;</code>.',
        '<strong>Route-level splitting</strong> is the biggest win — each route is a separate bundle. React Router\'s lazy option does this automatically. Large routes can reduce initial bundle size by 50–80%.',
        '<strong>Library splitting:</strong> heavy libraries (chart.js, Monaco editor, PDF generators) should be lazy-loaded. Import them inside a lazy component or via dynamic <code>import()</code> inside a useEffect.',
        '<strong>Preloading:</strong> call the import() function on hover to warm the cache before the user clicks. The promise resolves instantly on click since the module is already downloading.',
      ],
    },
    {
      heading: 'Virtualisation — rendering large lists',
      points: [
        '<strong>Virtualisation renders only visible rows.</strong> For a list of 10 000 items, react-window renders ~20 DOM nodes regardless of list length. Without virtualisation, every item is mounted and the scroll becomes janky.',
        '<strong>react-window</strong> provides <code>FixedSizeList</code> (all items same height) and <code>VariableSizeList</code> (dynamic heights). <code>FixedSizeGrid</code> handles two-dimensional grids.',
        '<strong>Windowing is required when:</strong> a list has 500+ items that are all mounted at once; scroll performance is below 60fps; time-to-interactive is degraded by initial render of a large DOM.',
        '<strong>Alternative: pagination.</strong> Divide data into pages and only render the current page. Simpler than virtualisation for non-scroll-heavy UIs. TanStack Table has built-in pagination.',
      ],
    },
    {
      heading: 'Concurrent features and rendering optimisation',
      points: [
        '<strong>useTransition</strong> marks state updates as non-urgent, allowing React to interrupt them to handle urgent work. Use for heavy renders like large list filters — keep the input responsive while the filtered list updates.',
        '<strong>useDeferredValue</strong> defers a value to a lower-priority render. Wrap a component with <code>memo</code> and pass the deferred value as a prop — it re-renders with the previous value until React has time to process the new one.',
        '<strong>Automatic batching (React 18)</strong> groups multiple setState calls inside setTimeout, Promises, and native event handlers into a single re-render. No code change needed — it is on by default with createRoot.',
        '<strong>Avoid expensive work in the render path:</strong> move heavy computation to useMemo; move side effects out of render into useEffect; avoid inline object/array creation in JSX that defeats memo.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'React.memo + useCallback',
      language: 'typescript',
      code: `import { useState, useCallback, memo } from 'react';

// Without memo: re-renders every time parent updates, even if props didn't change
// With memo: skips re-render if name and onDelete are shallowly equal
const ContactCard = memo(function ContactCard({
  name,
  email,
  onDelete,
}: {
  name: string;
  email: string;
  onDelete: (email: string) => void;
}) {
  console.log('ContactCard render:', name);
  return (
    <div>
      <strong>{name}</strong> — {email}
      <button onClick={() => onDelete(email)}>Remove</button>
    </div>
  );
});

function ContactList() {
  const [contacts, setContacts] = useState([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob',   email: 'bob@example.com'   },
  ]);
  const [filter, setFilter] = useState('');

  // Without useCallback: new function reference on every render → memo is useless
  // With useCallback: stable reference → ContactCard skips re-render on filter change
  const handleDelete = useCallback((email: string) => {
    setContacts(prev => prev.filter(c => c.email !== email));
  }, []); // empty deps — uses functional update, no stale closure

  const visible = contacts.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" />
      {visible.map(c => (
        <ContactCard key={c.email} name={c.name} email={c.email} onDelete={handleDelete} />
      ))}
    </div>
  );
}`,
    },
    {
      label: 'Code splitting',
      language: 'typescript',
      code: `import { lazy, Suspense, useState } from 'react';

// Heavy components — downloaded only when rendered
const HeavyChart     = lazy(() => import('./HeavyChart'));
const RichTextEditor = lazy(() => import('./RichTextEditor'));
const PDFPreview     = lazy(() => import('./PDFPreview'));

function Skeleton({ height = 200 }: { height?: number }) {
  return <div style={{ height, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'chart' | 'editor' | 'pdf'>('chart');

  // Preload on hover — starts download before user clicks
  const preload = (tab: typeof activeTab) => () => {
    if (tab === 'editor') import('./RichTextEditor');
    if (tab === 'pdf')    import('./PDFPreview');
  };

  return (
    <div>
      <nav>
        {(['chart', 'editor', 'pdf'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} onMouseEnter={preload(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <Suspense fallback={<Skeleton height={400} />}>
        {activeTab === 'chart'  && <HeavyChart />}
        {activeTab === 'editor' && <RichTextEditor />}
        {activeTab === 'pdf'    && <PDFPreview />}
      </Suspense>
    </div>
  );
}`,
    },
    {
      label: 'Virtualised list (react-window)',
      language: 'typescript',
      code: `import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { memo, useCallback } from 'react';

interface Item { id: number; name: string; price: number; }

// Row component — must be memoised for virtualisation to be effective
const Row = memo(function Row({ index, style, data }: ListChildComponentProps<Item[]>) {
  const item = data[index];
  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '0 1rem' }}>
      <span style={{ flex: 1 }}>{item.name}</span>
      <span>\${item.price.toFixed(2)}</span>
    </div>
  );
});

function VirtualProductList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={500}          // visible container height in px
      width="100%"
      itemCount={items.length}
      itemSize={48}         // fixed row height in px
      itemData={items}      // passed as data prop to each Row
    >
      {Row}
    </FixedSizeList>
  );
}

// For variable heights — use VariableSizeList
import { VariableSizeList } from 'react-window';

function VariableList({ items }: { items: { text: string }[] }) {
  const getHeight = useCallback((i: number) =>
    items[i].text.length > 100 ? 80 : 48, [items]);

  return (
    <VariableSizeList height={400} width="100%" itemCount={items.length} itemSize={getHeight}>
      {({ index, style }) => <div style={style}>{items[index].text}</div>}
    </VariableSizeList>
  );
}`,
    },
    {
      label: 'useTransition + useDeferredValue',
      language: 'typescript',
      code: `import { useState, useTransition, useDeferredValue, memo, useMemo } from 'react';

const ITEMS = Array.from({ length: 10000 }, (_, i) => \`Product \${i + 1}\`);

// ──── useTransition ────────────────────────────────────────
function TransitionSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(ITEMS);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);          // urgent — input updates immediately
    startTransition(() => {            // non-urgent — filter runs when React has time
      setResults(ITEMS.filter(i => i.toLowerCase().includes(e.target.value.toLowerCase())));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Search 10k items…" />
      {isPending && <span style={{ color: '#888' }}>⏳ Filtering…</span>}
      <ul>{results.slice(0, 20).map(r => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}

// ──── useDeferredValue ─────────────────────────────────────
// Use when you receive a prop/value you can't wrap in startTransition
const FilteredList = memo(function FilteredList({ query }: { query: string }) {
  const results = useMemo(
    () => ITEMS.filter(i => i.toLowerCase().includes(query.toLowerCase())).slice(0, 50),
    [query]
  );
  return <ul>{results.map(r => <li key={r}>{r}</li>)}</ul>;
});

function DeferredSearch() {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);          // lags behind query during busy renders
  const isStale  = deferred !== query;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <FilteredList query={deferred} />             {/* renders with old value while catching up */}
      </div>
    </div>
  );
}`,
    },
    {
      label: 'Performance measurement',
      language: 'typescript',
      code: `import { Profiler, ProfilerOnRenderCallback } from 'react';
import { reportWebVitals } from 'web-vitals';

// ──── React Profiler API ────────────────────────────────────
const onRender: ProfilerOnRenderCallback = (
  id,             // component tree name
  phase,          // 'mount' | 'update' | 'nested-update'
  actualDuration, // time for this render
  baseDuration,   // estimated time without memoisation
  startTime,
  commitTime,
) => {
  if (actualDuration > 16) {   // flag renders over one frame (16ms @ 60fps)
    console.warn(\`Slow render: \${id} [\${phase}] \${actualDuration.toFixed(1)}ms\`);
  }
};

function SlowSubtree() {
  return (
    <Profiler id="SlowSubtree" onRender={onRender}>
      <ExpensiveComponent />
      <AnotherExpensiveComponent />
    </Profiler>
  );
}

// ──── Core Web Vitals ──────────────────────────────────────
// In index.tsx after createRoot:
import { onCLS, onINP, onLCP } from 'web-vitals';

onCLS(console.log);   // Cumulative Layout Shift
onINP(console.log);   // Interaction to Next Paint (replaced FID)
onLCP(console.log);   // Largest Contentful Paint

// Send to analytics
function sendToAnalytics(metric: { name: string; value: number }) {
  navigator.sendBeacon('/analytics', JSON.stringify({
    name:  metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  }));
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Adding React.memo without stable prop references',
      wrong: `const Item = memo(({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Click</button>);

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <Item onClick={() => console.log('click')} />  {/* inline fn = new ref every render */}
    </div>
  );
}`,
      right: `const Item = memo(({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Click</button>);

function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => console.log('click'), []);  // stable ref
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <Item onClick={handleClick} />
    </div>
  );
}`,
      explanation: 'React.memo only works if props are stable. An inline arrow function creates a new reference on every render — memo never skips. Pair memo with useCallback for function props and useMemo for object/array props.',
    },
    {
      title: 'Optimising before profiling',
      wrong: `// Adding useMemo/useCallback everywhere "just in case"
function ProductCard({ product }: { product: Product }) {
  const formattedPrice = useMemo(() => \`\$\${product.price.toFixed(2)}\`, [product.price]);
  const handleClick    = useCallback(() => navigate(product.id), [product.id]);
  // toFixed and arrow fn are essentially free — this useMemo/useCallback is overhead
}`,
      right: `function ProductCard({ product }: { product: Product }) {
  // Profile first — if this component renders thousands of times per second,
  // THEN consider memoisation. Otherwise: plain code is cleaner and faster.
  const formattedPrice = \`\$\${product.price.toFixed(2)}\`;
  const handleClick    = () => navigate(product.id);
}`,
      explanation: 'useMemo and useCallback have their own overhead — cache lookup, dependency comparison, closure creation. Premature optimisation often makes things slower. Profile with React DevTools first.',
    },
    {
      title: 'Rendering large lists without virtualisation',
      wrong: `function ProductList({ products }: { products: Product[] }) {
  // Mounts 5000 DOM nodes — browser chokes on scroll
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}`,
      right: `import { FixedSizeList } from 'react-window';
function ProductList({ products }: { products: Product[] }) {
  return (
    <FixedSizeList height={500} width="100%" itemCount={products.length} itemSize={48} itemData={products}>
      {({ index, style, data }) => <div style={style}>{data[index].name}</div>}
    </FixedSizeList>
  );
}`,
      explanation: 'Rendering 1000+ items creates thousands of DOM nodes. Virtualisation with react-window renders only the ~15 visible rows at any time — scroll is smooth regardless of list size.',
    },
    {
      title: 'Forgetting key on mapped components (causes full re-mount)',
      wrong: `// Using index as key — React cannot track identity across reorders
{items.map((item, i) => <Item key={i} data={item} />)}`,
      right: `// Use stable data ID — React reconciles correctly on reorder/filter
{items.map(item => <Item key={item.id} data={item} />)}`,
      explanation: 'Index keys cause React to re-mount components when the list order changes. Every filtered/sorted render unmounts and remounts items, losing state and running expensive effects. Always use stable data IDs.',
    },
    {
      title: 'Putting new objects/arrays inline in JSX',
      wrong: `// New object on every render — child with React.memo always re-renders
<Chart
  data={chartData}
  options={{ responsive: true, maintainAspectRatio: false }}  // new ref every render
/>`,
      right: `// Define stable outside render or memoize
const CHART_OPTIONS = { responsive: true, maintainAspectRatio: false };  // module-level constant

function MyChart({ chartData }: { chartData: any }) {
  return <Chart data={chartData} options={CHART_OPTIONS} />;
}`,
      explanation: 'Object/array literals in JSX create new references on every render. Even if React.memo wraps the child, it sees changed props and re-renders. Move constants to module scope or wrap in useMemo.',
    },
    {
      title: 'Not using Suspense with lazy components',
      wrong: `const LazyChart = lazy(() => import('./Chart'));

function Dashboard() {
  return <LazyChart />;  // throws without Suspense — React cannot handle the Promise
}`,
      right: `const LazyChart = lazy(() => import('./Chart'));

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart…</div>}>
      <LazyChart />
    </Suspense>
  );
}`,
      explanation: 'React.lazy suspends the component tree until the module loads. Without a Suspense boundary ancestor, React throws an error. The nearest Suspense boundary shows the fallback during loading.',
    },
  ];

  challenge: Challenge = {
    title: 'Optimise a Slow Dashboard',
    language: 'typescript',
    description: `The following Dashboard component has several performance problems. Identify and fix all of them:

Problems to find:
1. ExpensiveMetric re-renders on every keystroke even though its props don't change
2. formatCurrency runs 1000 times per render (called in a loop)
3. getTopProducts runs a heavy O(n²) sort on every render
4. A list of 2000 items is fully mounted in the DOM
5. The inline onDelete handler breaks memo on ProductRow

Apply: React.memo, useCallback, useMemo, react-window virtualisation, and stable references.`,
    hints: [
      'Wrap ExpensiveMetric in React.memo — its props (revenue, orders) are primitives and will be stable',
      'useMemo for formatCurrency results: useMemo(() => metrics.map(m => ({ ...m, formatted: formatCurrency(m.value) })), [metrics])',
      'useMemo for topProducts: useMemo(() => [...products].sort(...).slice(0, 10), [products])',
      'Replace the <ul> with FixedSizeList from react-window — height=400, itemSize=52',
    ],
    starterCode: `import { useState } from 'react';
const products = Array.from({ length: 2000 }, (_, i) => ({ id: i, name: \`Product \${i}\`, revenue: Math.random() * 1000 }));
const metrics  = [{ label: 'Revenue', value: 98420 }, { label: 'Orders', value: 1234 }];

function formatCurrency(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); }

// ❌ No memo — re-renders with every parent update
function ExpensiveMetric({ label, value }: { label: string; value: number }) {
  return <div><strong>{label}</strong>: {formatCurrency(value)}</div>;
}

// ❌ No memo — re-renders when onDelete changes reference
function ProductRow({ product, onDelete }: { product: { id: number; name: string; revenue: number }; onDelete: (id: number) => void }) {
  return <div>{product.name} — {formatCurrency(product.revenue)} <button onClick={() => onDelete(product.id)}>×</button></div>;
}

function Dashboard() {
  const [filter, setFilter] = useState('');
  const [items, setItems]   = useState(products);

  // ❌ New function reference every render
  const handleDelete = (id: number) => setItems(prev => prev.filter(p => p.id !== id));

  // ❌ Heavy computation every render
  const topProducts = [...items].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter products…" />
      <div>{metrics.map(m => <ExpensiveMetric key={m.label} label={m.label} value={m.value} />)}</div>
      <h3>Top products</h3>
      <div>{topProducts.map(p => <ProductRow key={p.id} product={p} onDelete={handleDelete} />)}</div>
      <h3>All products ({items.length})</h3>
      {/* ❌ 2000 DOM nodes */}
      <ul>{items.filter(p => p.name.includes(filter)).map(p => <li key={p.id}>{p.name}</li>)}</ul>
    </div>
  );
}`,
    solution: `import { useState, useMemo, useCallback, memo } from 'react';
import { FixedSizeList } from 'react-window';

const products = Array.from({ length: 2000 }, (_, i) => ({ id: i, name: \`Product \${i}\`, revenue: Math.random() * 1000 }));
const metrics  = [{ label: 'Revenue', value: 98420 }, { label: 'Orders', value: 1234 }];

function formatCurrency(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); }

// ✅ memo — skips re-render when parent re-renders with same label/value
const ExpensiveMetric = memo(function ExpensiveMetric({ label, value }: { label: string; value: number }) {
  return <div><strong>{label}</strong>: {formatCurrency(value)}</div>;
});

// ✅ memo + stable onDelete
const ProductRow = memo(function ProductRow({ product, onDelete }: { product: { id: number; name: string; revenue: number }; onDelete: (id: number) => void }) {
  return <div>{product.name} — {formatCurrency(product.revenue)} <button onClick={() => onDelete(product.id)}>×</button></div>;
});

function Dashboard() {
  const [filter, setFilter] = useState('');
  const [items, setItems]   = useState(products);

  // ✅ stable reference — memo on ProductRow now works
  const handleDelete = useCallback((id: number) => setItems(prev => prev.filter(p => p.id !== id)), []);

  // ✅ memoised — recomputes only when items change
  const topProducts = useMemo(() => [...items].sort((a, b) => b.revenue - a.revenue).slice(0, 10), [items]);

  // ✅ filtered list memoised
  const filtered = useMemo(() => items.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())), [items, filter]);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter products…" />
      <div>{metrics.map(m => <ExpensiveMetric key={m.label} label={m.label} value={m.value} />)}</div>
      <h3>Top products</h3>
      <div>{topProducts.map(p => <ProductRow key={p.id} product={p} onDelete={handleDelete} />)}</div>
      <h3>All products ({filtered.length})</h3>
      {/* ✅ Virtualised — only visible rows in DOM */}
      <FixedSizeList height={400} width="100%" itemCount={filtered.length} itemSize={52} itemData={filtered}>
        {({ index, style, data }) => <div style={style}>{data[index].name}</div>}
      </FixedSizeList>
    </div>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What three things must be true for React.memo to prevent a re-render?',
      options: ['The component must be a class component', 'The component is wrapped in memo, all props are primitives or stable references, and no context it consumes changed', 'The parent must also use memo', 'The component must have no children'],
      answer: 1,
      explanation: 'memo requires: (1) the component is wrapped in React.memo; (2) every prop passes Object.is comparison (primitives or stable object/function references via useMemo/useCallback); (3) no context the component uses changed.',
    },
    {
      q: 'What does React.lazy(() => import("./Chart")) do at runtime?',
      options: ['It eagerly loads the Chart module at startup', 'It splits Chart into a separate bundle chunk, downloaded only when the component first renders', 'It renders Chart on the server only', 'It creates a copy of Chart in memory'],
      answer: 1,
      explanation: 'React.lazy creates a lazy component that wraps a dynamic import(). The browser only downloads the chunk when the component is actually rendered. This reduces initial bundle size.',
    },
    {
      q: 'Why must a React.lazy component be wrapped in Suspense?',
      options: ['For TypeScript type safety', 'Because lazy components suspend the tree while loading — Suspense catches the suspension and shows the fallback', 'To enable server-side rendering', 'Because lazy does not support hooks'],
      answer: 1,
      explanation: 'React.lazy suspends the component tree while the module downloads. Without a Suspense ancestor to catch the suspension, React throws an error. Suspense shows the fallback until loading completes.',
    },
    {
      q: 'When is virtualisation with react-window necessary?',
      options: ['For any list with more than 10 items', 'When a list is long enough that mounting all items causes visible performance problems (typically 500+ items)', 'Only for server-rendered lists', 'When using TypeScript'],
      answer: 1,
      explanation: 'Virtualisation is not always needed — small lists are fine. Use it when many items are mounted simultaneously causing slow initial render, janky scroll, or high memory usage. Profile first.',
    },
    {
      q: 'What is the difference between useTransition and useDeferredValue for performance?',
      options: ['They are identical', 'useTransition wraps a state setter you control; useDeferredValue defers a value you receive (prop/context)', 'useDeferredValue is only for strings', 'useTransition is deprecated in React 18'],
      answer: 1,
      explanation: 'Use useTransition when you control the state setter — wrap it in startTransition. Use useDeferredValue when you receive a value from outside (prop/context) and cannot wrap the setter.',
    },
    {
      q: 'Which React DevTools feature tells you WHY a component re-rendered?',
      options: ['Components tab > hooks panel', 'Profiler tab > "Why did this render?" section (click a component in the flame chart)', 'Console > performance entries', 'React DevTools settings > tracing'],
      answer: 1,
      explanation: 'In the React DevTools Profiler, record a session and click a component in the flame chart. The panel shows "Why did this render?" with the specific prop or hook that changed.',
    },
    {
      q: 'What is the Core Web Vital that measures a component\'s response to user interaction?',
      options: ['LCP (Largest Contentful Paint)', 'CLS (Cumulative Layout Shift)', 'INP (Interaction to Next Paint)', 'FCP (First Contentful Paint)'],
      answer: 2,
      explanation: 'INP (Interaction to Next Paint) measures the delay between user interaction (click, key press) and the browser rendering the response. It replaced FID in 2024 as the interaction CWV.',
    },
    {
      q: 'Why does using an index as a list key cause performance issues?',
      options: ['Indexes are too long to hash efficiently', 'When items reorder or filter, React maps keys to wrong components — causing re-mounts instead of updates', 'Indexes prevent memo from working', 'React does not support numeric keys'],
      answer: 1,
      explanation: 'Index keys make React tie item identity to position. When items reorder, React thinks it is updating existing components but actually their identities changed — triggering full re-mounts, losing state, and running effects.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I know if my React app is slow?',
      a: 'Start with the React DevTools Profiler: record an interaction and look for red components in the flame chart. Then check Core Web Vitals with Lighthouse or web-vitals package in production. INP > 200ms means interactions feel sluggish; LCP > 2.5s means slow initial load.',
    },
    {
      q: 'Does React 18 automatic batching replace the need for useTransition?',
      a: 'Automatic batching reduces unnecessary re-renders by grouping multiple setState calls in one event. useTransition is separate — it marks a specific update as non-urgent so React can interrupt it for urgent work. They complement each other.',
    },
    {
      q: 'Is react-window still the go-to for virtualisation?',
      a: 'react-window (or its bigger sibling react-virtual) is still widely used. TanStack Virtual is the modern alternative with better TypeScript support and more flexibility. For table rows, TanStack Table has built-in virtualisation.',
    },
    {
      q: 'Does SSR (Next.js) improve performance?',
      a: 'Yes — SSR sends fully rendered HTML so LCP is faster (content visible before JS hydrates). Server Components (Next.js App Router) go further — they never hydrate at all, sending zero JS to the client for those components.',
    },
    {
      q: 'When should I use the React Profiler component vs DevTools Profiler?',
      a: 'React DevTools Profiler is for development — interactive flame charts, "why did this render?". The Profiler component (API) is for production — programmatic capture of render duration that you can send to analytics. Use both: DevTools to find the problem, the API to monitor it in production.',
    },
    {
      q: 'How does useTransition differ from useDeferredValue?',
      a: 'useTransition wraps a state setter you control: `startTransition(() => setState(next))` — the update is marked low-priority so the UI stays responsive. useDeferredValue accepts an external value you receive (e.g., a prop) and defers its use: `const deferred = useDeferredValue(propValue)`. Rule of thumb: if you own the update, use useTransition; if you receive the value from outside, use useDeferredValue.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Profile before optimising — React.memo + stable refs, lazy + Suspense for code splitting, and react-window for large lists.',
    mustKnow: [
      'React.memo only prevents re-renders if ALL props are stable — pair with useCallback (functions) and useMemo (objects/arrays)',
      'React.lazy + Suspense: route-level code splitting is the biggest bundle-size win',
      'react-window virtualises large lists — only ~20 DOM nodes regardless of list length',
      'useTransition: wrap the setter you control; useDeferredValue: defer a received value',
      'Profile first with React DevTools Profiler → "Why did this render?" — never optimise by intuition',
      'Index keys cause re-mounts on reorder; module-level constants prevent inline object allocation',
    ],
    interviewFocus: [
      'What three conditions must be met for React.memo to actually prevent a re-render?',
      'Explain lazy + Suspense — what happens at runtime when a lazy component first renders?',
      'When would you reach for react-window — and what does it do that a normal list cannot?',
      'Difference between useTransition and useDeferredValue for handling slow renders',
    ],
  };
}
