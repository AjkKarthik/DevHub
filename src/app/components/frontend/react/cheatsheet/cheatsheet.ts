import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CheatItem {
  name: string;
  syntax: string;
  desc: string;
  tags: string[];
}

interface CheatTab {
  label: string;
  items: CheatItem[];
}

const TABS: CheatTab[] = [
  {
    label: 'Hooks',
    items: [
      { name: 'useState', syntax: 'const [value, setValue] = useState(initial)', desc: 'Local component state. Re-renders the component when value changes. Pass a function for lazy initialisation.', tags: ['state', 'core'] },
      { name: 'useState (lazy)', syntax: 'const [s, setS] = useState(() => expensive())', desc: 'Lazy initialiser: the function runs only on the first render, not on every re-render.', tags: ['state', 'performance'] },
      { name: 'useEffect', syntax: 'useEffect(() => { /* side effect */ return cleanup; }, [deps])', desc: 'Synchronise with external systems. Runs after every render where deps changed. Return a cleanup function.', tags: ['effects', 'core'] },
      { name: 'useEffect (once)', syntax: "useEffect(() => { fetch('/data'); }, [])", desc: 'Empty dep array: runs once after the first render. Equivalent to componentDidMount.', tags: ['effects'] },
      { name: 'useRef', syntax: 'const ref = useRef<HTMLInputElement>(null)', desc: 'Mutable container that persists across renders without triggering a re-render. Also used for DOM element refs.', tags: ['refs', 'core'] },
      { name: 'useContext', syntax: 'const value = useContext(MyContext)', desc: 'Read the nearest context value above this component. Re-renders when context value changes.', tags: ['context', 'core'] },
      { name: 'useReducer', syntax: 'const [state, dispatch] = useReducer(reducer, initial)', desc: 'Like useState but for complex state with multiple sub-values or action-based updates.', tags: ['state', 'advanced'] },
      { name: 'useMemo', syntax: 'const result = useMemo(() => compute(a, b), [a, b])', desc: 'Memoize an expensive computed value. Only recomputes when deps change. Do not use for cheap computations.', tags: ['performance', 'memoisation'] },
      { name: 'useCallback', syntax: 'const fn = useCallback(() => doSomething(id), [id])', desc: 'Memoize a function reference. Stable across renders unless deps change. Needed to avoid breaking React.memo.', tags: ['performance', 'memoisation'] },
      { name: 'useId', syntax: 'const id = useId()', desc: 'Generate a stable unique ID for accessibility — label htmlFor, aria-describedby. Safe for SSR.', tags: ['accessibility', 'advanced'] },
      { name: 'useTransition', syntax: 'const [isPending, startTransition] = useTransition()', desc: 'Mark a state update as non-urgent. React keeps UI responsive during heavy renders in the transition.', tags: ['concurrent', 'performance'] },
      { name: 'useDeferredValue', syntax: 'const deferred = useDeferredValue(value)', desc: 'Defer updating a value — useful for keeping an input responsive while a derived list updates.', tags: ['concurrent', 'performance'] },
      { name: 'useImperativeHandle', syntax: 'useImperativeHandle(ref, () => ({ focus }))', desc: 'Customise the value exposed via a forwarded ref. Use sparingly — prefer props.', tags: ['refs', 'advanced'] },
      { name: 'useLayoutEffect', syntax: 'useLayoutEffect(() => { measure DOM }, [deps])', desc: 'Like useEffect but fires synchronously after DOM mutations — use for DOM measurements. Prefer useEffect.', tags: ['effects', 'advanced'] },
      { name: 'useDebugValue', syntax: "useDebugValue(value, v => format(v))", desc: 'Display a label for a custom hook in React DevTools. Second arg is an optional formatter.', tags: ['devtools', 'advanced'] },
    ],
  },
  {
    label: 'Components',
    items: [
      { name: 'Function component', syntax: 'function MyComp({ name }: { name: string }) { return <div>{name}</div>; }', desc: 'The only way to define components in modern React. Accepts props, returns JSX.', tags: ['basics'] },
      { name: 'React.memo', syntax: 'const Comp = React.memo(function Comp(props) { ... })', desc: 'Skip re-render if props are shallowly equal. The parent must pass stable references for object/function props.', tags: ['performance', 'memoisation'] },
      { name: 'forwardRef', syntax: 'const Input = forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} {...props} />)', desc: 'Forward a ref through to a DOM element inside a component.', tags: ['refs', 'advanced'] },
      { name: 'lazy + Suspense', syntax: "const Page = lazy(() => import('./Page')); <Suspense fallback={<Spinner/>}><Page/></Suspense>", desc: 'Code-split a component — loaded on demand. Suspense shows fallback until loaded.', tags: ['performance', 'code-splitting'] },
      { name: 'createContext', syntax: 'const Ctx = createContext<T>(defaultValue)', desc: 'Create a context object. Provide a default used when no Provider is above the consumer.', tags: ['context'] },
      { name: 'Context.Provider', syntax: '<Ctx.Provider value={val}>{children}</Ctx.Provider>', desc: 'Provide a context value to all descendant components.', tags: ['context'] },
      { name: 'Fragment', syntax: '<></> or <React.Fragment key={id}>', desc: 'Group children without adding a DOM element. Use the long form when you need a key prop.', tags: ['basics', 'jsx'] },
      { name: 'Strict Mode', syntax: '<React.StrictMode><App /></React.StrictMode>', desc: 'Enables extra development-only checks — double-invokes renders to surface side effects.', tags: ['devtools', 'basics'] },
      { name: 'Error Boundary', syntax: 'class ErrorBoundary extends Component { componentDidCatch(err, info) }', desc: 'Catch rendering errors in the subtree. Must be a class component. Use react-error-boundary library.', tags: ['error-handling', 'advanced'] },
      { name: 'Portal', syntax: 'createPortal(<Modal/>, document.getElementById("modal-root"))', desc: 'Render a child component outside the parent DOM hierarchy. Used for modals, tooltips.', tags: ['advanced', 'dom'] },
    ],
  },
  {
    label: 'JSX & Events',
    items: [
      { name: 'Conditional render', syntax: '{condition && <Component />}', desc: 'Short-circuit rendering. If condition is 0, renders "0" — prefer condition ? <C/> : null for numbers.', tags: ['jsx', 'basics'] },
      { name: 'Ternary render', syntax: '{flag ? <A /> : <B />}', desc: 'Render one of two components based on a condition.', tags: ['jsx', 'basics'] },
      { name: 'List render', syntax: "{items.map(item => <li key={item.id}>{item.name}</li>)}", desc: 'Always provide a unique stable key prop — not array index. Key is used by React for reconciliation.', tags: ['jsx', 'lists'] },
      { name: 'className', syntax: '<div className="container active">', desc: 'Use className instead of class in JSX — class is a reserved word in JavaScript.', tags: ['jsx', 'basics'] },
      { name: 'htmlFor', syntax: '<label htmlFor="email">', desc: 'Use htmlFor instead of for in JSX — for is a reserved word.', tags: ['jsx', 'accessibility'] },
      { name: 'onClick', syntax: '<button onClick={() => handleClick(id)}>', desc: 'Pass a function reference, not a call. () => fn(arg) for handlers that need arguments.', tags: ['events', 'basics'] },
      { name: 'onChange (input)', syntax: '<input value={v} onChange={e => setValue(e.target.value)} />', desc: 'Controlled input: React owns the value via state. Always pair value with onChange.', tags: ['events', 'forms'] },
      { name: 'onSubmit (form)', syntax: '<form onSubmit={e => { e.preventDefault(); handle(); }}>', desc: 'Always call e.preventDefault() in form submit handlers to stop browser page reload.', tags: ['events', 'forms'] },
      { name: 'style (inline)', syntax: '<div style={{ color: "red", fontSize: 16 }}>', desc: 'Inline styles use camelCase properties. Value is a JS object — double braces: outer for JSX, inner for object.', tags: ['jsx', 'styling'] },
      { name: 'Spread props', syntax: '<Button {...buttonProps} />', desc: 'Pass all properties of an object as props. Useful for forwarding props to wrapped components.', tags: ['jsx', 'advanced'] },
      { name: 'children prop', syntax: 'function Card({ children }: { children: React.ReactNode })', desc: 'React.ReactNode is the widest type for children — accepts JSX, strings, arrays, null.', tags: ['props', 'typescript'] },
      { name: 'defaultProps alternative', syntax: 'function Btn({ label = "Click" }: Props)', desc: 'Use JS default parameter values instead of static defaultProps (deprecated for function components).', tags: ['props', 'basics'] },
    ],
  },
  {
    label: 'TypeScript',
    items: [
      { name: 'Props interface', syntax: 'interface ButtonProps { label: string; onClick: () => void; disabled?: boolean; }', desc: 'Define component props with an interface. Optional fields use ?. Prefer interface over type for component props.', tags: ['typescript', 'basics'] },
      { name: 'Event types', syntax: 'React.ChangeEvent<HTMLInputElement>\nReact.MouseEvent<HTMLButtonElement>\nReact.FormEvent<HTMLFormElement>', desc: 'Common event types. The generic is the element type that raised the event.', tags: ['typescript', 'events'] },
      { name: 'Ref type', syntax: 'const ref = useRef<HTMLInputElement>(null)', desc: 'Generic type is the element type. Initial value null — the ref is null until the element mounts.', tags: ['typescript', 'refs'] },
      { name: 'Generic component', syntax: 'function List<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => ReactNode })', desc: 'Generic components work the same as generic functions. In .tsx files, add a trailing comma: <T,> to avoid JSX parsing ambiguity.', tags: ['typescript', 'advanced', 'generics'] },
      { name: 'Discriminated union props', syntax: "type Props = { variant: 'primary'; label: string } | { variant: 'icon'; icon: ReactNode }", desc: 'Use a discriminated union when a component has mutually exclusive prop sets. TypeScript narrows the type based on the discriminant.', tags: ['typescript', 'advanced'] },
      { name: 'ComponentPropsWithoutRef', syntax: "type ButtonProps = ComponentPropsWithoutRef<'button'> & { variant: string }", desc: 'Extend all native HTML element props. Use WithoutRef for most cases; WithRef when forwarding a ref.', tags: ['typescript', 'advanced'] },
      { name: 'ReturnType / typeof', syntax: 'type Methods = ReturnType<typeof useMyHook>', desc: 'Infer the return type of a hook for sharing types across components without explicit interfaces.', tags: ['typescript', 'advanced'] },
      { name: 'ReactNode vs JSX.Element', syntax: 'children: React.ReactNode  // widest — allows null, string, array\nchildren: JSX.Element    // only JSX — disallows strings', desc: 'ReactNode for children props (widest type). JSX.Element when you need exactly one element returned.', tags: ['typescript', 'types'] },
    ],
  },
  {
    label: 'Patterns',
    items: [
      { name: 'Controlled input', syntax: 'const [v, setV] = useState("");\n<input value={v} onChange={e => setV(e.target.value)} />', desc: 'React state is the single source of truth. Enables real-time validation and formatted input.', tags: ['patterns', 'forms'] },
      { name: 'Lifting state', syntax: 'function Parent() { const [v, setV] = useState(0); return <Child value={v} onChange={setV} /> }', desc: 'Move state to the lowest common ancestor of components that share it.', tags: ['patterns', 'state'] },
      { name: 'Compound components', syntax: '<Select>\n  <Select.Option value="a">A</Select.Option>\n</Select>', desc: 'Implicit shared state via context. Dot-notation sub-components are attached to the parent\'s exports.', tags: ['patterns', 'advanced'] },
      { name: 'Custom hook', syntax: 'function useCounter(init = 0) { const [n, setN] = useState(init); return { n, inc: () => setN(v => v+1) }; }', desc: 'Extract stateful logic into a reusable function. Starts with "use". Hooks inside follow the rules of hooks.', tags: ['patterns', 'hooks'] },
      { name: 'Render prop', syntax: '<DataLoader render={data => <Table data={data} />} />', desc: 'Share logic by accepting a function prop that returns JSX. Largely replaced by custom hooks.', tags: ['patterns', 'advanced'] },
      { name: 'HOC pattern', syntax: 'function withAuth<P>(Comp: FC<P>): FC<P> { return props => isLoggedIn ? <Comp {...props as P} /> : <Login />; }', desc: 'Higher-Order Component: wraps a component and returns an enhanced version. Common for auth guards.', tags: ['patterns', 'advanced'] },
      { name: 'Derived state', syntax: 'const filtered = useMemo(() => items.filter(predicate), [items, predicate])', desc: 'Compute state from other state in useMemo — avoid duplicating state that can be derived.', tags: ['patterns', 'state', 'performance'] },
      { name: 'Optimistic update', syntax: 'setItems(prev => [...prev, newItem]); // instant\nawait saveItem(newItem);             // then confirm', desc: 'Update UI immediately, then confirm with the server. Roll back on error.', tags: ['patterns', 'async'] },
    ],
  },
  {
    label: 'Performance',
    items: [
      { name: 'React.memo', syntax: 'export default React.memo(Component)', desc: 'Skip re-render when props are shallowly equal. Ineffective if parent passes new object/function refs every render.', tags: ['performance'] },
      { name: 'Stable callbacks', syntax: 'const onClick = useCallback(() => doThing(id), [id])', desc: 'Pass to React.memo children. Without useCallback, new function ref every render = memo always re-renders.', tags: ['performance', 'memoisation'] },
      { name: 'Stable objects', syntax: 'const config = useMemo(() => ({ timeout: 5000 }), [])', desc: 'Pass to React.memo children or context values. Avoids new object reference on every render.', tags: ['performance', 'memoisation'] },
      { name: 'Code splitting', syntax: "const Page = lazy(() => import('./Page'))", desc: 'Split bundles by route or feature. The chunk is only downloaded when the lazy component is first rendered.', tags: ['performance', 'code-splitting'] },
      { name: 'Virtualisation', syntax: '<FixedSizeList height={600} itemCount={1000} itemSize={50}>{Row}</FixedSizeList>', desc: 'react-window: only renders visible rows. Required for lists > ~200 items.', tags: ['performance', 'lists'] },
      { name: 'useTransition', syntax: 'startTransition(() => setFilter(val))', desc: 'Keeps typing input responsive while the filtered list re-renders in the background.', tags: ['performance', 'concurrent'] },
      { name: 'Profiler component', syntax: '<Profiler id="Nav" onRender={callback}>', desc: 'Measure render timing programmatically. onRender fires with id, phase, actualDuration, baseDuration.', tags: ['performance', 'devtools'] },
      { name: 'Key to reset state', syntax: '<Component key={userId} />', desc: 'Changing the key unmounts and remounts the component with fresh state — a deliberate reset.', tags: ['performance', 'patterns'] },
    ],
  },
  {
    label: 'Router v6/v7',
    items: [
      { name: 'createBrowserRouter', syntax: "const router = createBrowserRouter([{ path: '/', element: <Home /> }])", desc: 'Data router with loader/action support. Recommended over BrowserRouter for new projects.', tags: ['routing', 'setup'] },
      { name: 'RouterProvider', syntax: '<RouterProvider router={router} />', desc: 'Mount the data router at the app root. Replaces <BrowserRouter> when using createBrowserRouter.', tags: ['routing', 'setup'] },
      { name: 'Nested routes', syntax: "{ path: '/posts', element: <Posts />, children: [{ path: ':id', element: <Post /> }] }", desc: 'Child routes render inside the parent\'s <Outlet />. Parent wraps common UI (nav, layout).', tags: ['routing'] },
      { name: 'Outlet', syntax: '<Outlet />', desc: 'Renders the matched child route component inside a layout route.', tags: ['routing'] },
      { name: 'useParams', syntax: "const { id } = useParams<{ id: string }>()", desc: 'Read dynamic URL segments. Always returns strings — parse numbers with Number() or parseInt().', tags: ['routing'] },
      { name: 'useNavigate', syntax: "const nav = useNavigate(); nav('/home'); nav(-1);", desc: 'Programmatic navigation. nav(-1) is equivalent to browser back. Pass state as second arg.', tags: ['routing'] },
      { name: 'useSearchParams', syntax: "const [sp, setSp] = useSearchParams(); sp.get('q')", desc: 'Read and write URL query parameters. setSp merges with existing params by default.', tags: ['routing'] },
      { name: 'loader function', syntax: "{ path: '/post/:id', loader: async ({ params }) => fetch(`/api/${params.id}`), element: <Post /> }", desc: 'Fetch data before rendering the route. useLoaderData() reads the result. No useEffect needed.', tags: ['routing', 'data'] },
      { name: 'Link vs NavLink', syntax: '<Link to="/about">About</Link>\n<NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>About</NavLink>', desc: 'NavLink gets an isActive prop — use for navigation menus that highlight the current route.', tags: ['routing', 'jsx'] },
    ],
  },
];

const ALL_TAGS = [...new Set(TABS.flatMap(t => t.items.flatMap(i => i.tags)))].sort();

@Component({
  selector: 'app-react-cheatsheet',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class ReactCheatsheet {
  tabs = TABS;
  allTags = ALL_TAGS;

  activeTab   = signal(0);
  searchQuery = signal('');
  activeTag   = signal('');

  filteredItems = computed(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const tag = this.activeTag();
    const tab = this.tabs[this.activeTab()];
    return tab.items.filter(item => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.syntax.toLowerCase().includes(q);
      const matchesTag    = !tag || item.tags.includes(tag);
      return matchesSearch && matchesTag;
    });
  });

  setTab(index: number) {
    this.activeTab.set(index);
    this.activeTag.set('');
  }

  setTag(tag: string) {
    this.activeTag.set(this.activeTag() === tag ? '' : tag);
  }

  get tagsForCurrentTab(): string[] {
    return [...new Set(this.tabs[this.activeTab()].items.flatMap(i => i.tags))].sort();
  }
}
