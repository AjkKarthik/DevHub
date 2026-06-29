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
  selector: 'app-react-patterns',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './patterns.html',
  styleUrl: './patterns.scss',
})
export class ReactPatterns {
  quickRef: QuickRefItem[] = [
    { name: 'Compound Component',       type: 'syntax',    desc: 'Parent + child set share implicit state via Context. Flexible composition without prop-drilling.' },
    { name: 'Controlled Component',     type: 'syntax',    desc: 'Consumer owns the state, passes value + onChange. Most predictable and testable pattern.' },
    { name: 'Render Prop',              type: 'syntax',    desc: 'Pass a function as children/prop; component calls it with data. Superseded by custom hooks.' },
    { name: 'Higher-Order Component',   type: 'function',  desc: 'withX(Comp) wraps a component with cross-cutting logic. Still common in older codebases.' },
    { name: 'Custom Hook',              type: 'hook',      desc: 'Extract stateful logic into a reusable function. The modern answer to render props and HOCs.' },
    { name: 'Provider Pattern',         type: 'syntax',    desc: 'Wrap a subtree with a Context Provider to inject shared state without prop-drilling.' },
    { name: 'Container / Presentational', type: 'syntax', desc: 'Separate data fetching (container) from rendering (presentational). Less needed with hooks.' },
    { name: 'Composite Pattern',        type: 'syntax',    desc: 'Expose sub-components as static properties: Tabs.Tab, Select.Option, Modal.Header.' },
    { name: 'State Initializer',        type: 'syntax',    desc: 'Accept initial/default prop; expose reset() to restore initial state. Classic for form resets.' },
    { name: 'Prop Collections',         type: 'syntax',    desc: 'Return objects of related props from a hook (getInputProps, getToggleProps). Semantic grouping.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Custom hooks — the modern baseline pattern',
      points: [
        '<strong>Custom hooks replace render props and most HOCs</strong> in modern React. Extract any stateful or effect logic that is reused across components into a function starting with "use". The hook returns data and handlers; the component renders JSX.',
        '<strong>The "use" prefix is required</strong> — React\'s linting rules enforce it. It signals that hook rules apply (no conditional calls) and that the function may call other hooks.',
        '<strong>Naming convention:</strong> name the hook after what it does, not what it is. <code>useWindowSize</code> > <code>useObserver</code>; <code>useFormField</code> > <code>useInput</code>. The return value naming follows the data: return <code>{ count, increment, reset }</code>, not <code>{ value, fn1, fn2 }</code>.',
        '<strong>Custom hooks compose:</strong> a hook can call other hooks. <code>useUserProfile</code> can internally call <code>useQuery</code> + <code>useLocalStorage</code>. This is the primary code-reuse mechanism in functional React.',
      ],
    },
    {
      heading: 'Compound components',
      points: [
        '<strong>Compound components</strong> model a UI element that has multiple co-operating parts — like HTML\'s <code>&lt;select&gt;</code>/<code>&lt;option&gt;</code>. A parent component manages shared state in a Context; children read from it without explicit prop passing.',
        '<strong>Two implementation approaches:</strong> (1) React.Children + React.cloneElement — older, inflexible, forces direct children. (2) Context — recommended, allows arbitrary nesting (children can be nested several levels deep).',
        '<strong>Composite (dot notation):</strong> expose child components as static properties of the parent — <code>Select.Option</code>, <code>Tabs.Tab</code>, <code>Modal.Header</code>. This makes the API self-documenting and keeps related components co-located in one file.',
        '<strong>Use when:</strong> a component has multiple variants of child parts that need to share state; the consumer should be able to choose the order and composition of parts; "prop explosion" is starting to appear (5+ related props).',
      ],
    },
    {
      heading: 'Controlled and uncontrolled patterns',
      points: [
        '<strong>Fully controlled:</strong> the consumer passes <code>value</code> + <code>onChange</code>. The component has no internal state for the value — it is a pure rendering function. Easiest to test; consumer has total control.',
        '<strong>Fully uncontrolled:</strong> the component manages its own state internally. Consumer optionally passes <code>defaultValue</code> (initial value only) and <code>onChange</code> (notification only). Simpler consumer API.',
        '<strong>State initializer pattern:</strong> accept an <code>initialState</code> prop; store it in a ref; expose a <code>reset()</code> function that restores to initial. This lets consumers reset without lifting state — used heavily in form libraries.',
        '<strong>Flexible controlled (open/onOpenChange):</strong> accept both an optional controlled prop AND internal state with the same default. If the controlled prop is provided, use it; otherwise use internal state. This is the pattern used by Radix UI primitives.',
      ],
    },
    {
      heading: 'Render props and HOCs — legacy but present',
      points: [
        '<strong>Render prop:</strong> a prop (often <code>children</code>) that is a function. The component calls it with data: <code>{children({ isOpen, toggle })}</code>. Useful for libraries that need to inject behavior without owning rendering. React Router v5\'s <code>&lt;Route render={...}&gt;</code> was a render prop.',
        '<strong>HOC (Higher-Order Component):</strong> a function that takes a component and returns a new enhanced component — <code>withAuth(Dashboard)</code>. Still common in class-component codebases; in modern React, prefer custom hooks.',
        '<strong>The key difference:</strong> HOCs create new components in the tree (visible in DevTools, can cause display-name issues); custom hooks do not. Render props cause extra nesting but are otherwise transparent.',
        '<strong>When HOCs are still justified:</strong> wrapping third-party components you cannot modify; adding error boundaries; cross-cutting concerns (logging, auth) that must wrap the full component tree lifecycle including constructor and componentDidCatch.',
      ],
    },
    {
      heading: 'Prop collection and prop getter patterns',
      points: [
        '<strong>Prop collection:</strong> return a plain object of related props from a hook. <code>useToggle</code> returns <code>{ on, toggle, togglerProps: { onClick: toggle, "aria-pressed": on } }</code>. The consumer spreads <code>togglerProps</code> onto any element.',
        '<strong>Prop getter</strong> is the advanced version — return a function that accepts additional props and merges them with the built-in ones. <code>getToggleProps({ onClick: myClick })</code> composes both handlers. Used extensively by downshift and react-table.',
        '<strong>Inversion of Control:</strong> expose an <code>itemToString</code>, <code>stateReducer</code>, or <code>onChange</code> prop that the consumer uses to override default behaviour. The component defers control at the right seam rather than adding every possible prop.',
        '<strong>headless UI / renderless components:</strong> components (or hooks) that manage all behaviour and accessibility but render nothing — the consumer provides all JSX. Radix UI Primitives, Headless UI, and TanStack Table follow this model.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Compound Select',
      language: 'typescript',
      code: `import { createContext, useContext, useState, useId, type ReactNode } from 'react';

// ──── Context ────────────────────────────────────────────────
interface SelectCtx {
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  labelId: string;
}
const Ctx = createContext<SelectCtx | null>(null);
const useSelectCtx = () => { const c = useContext(Ctx); if (!c) throw new Error('Use inside <Select>'); return c; };

// ──── Root ───────────────────────────────────────────────────
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  return (
    <Ctx.Provider value={{ value, onChange, open, setOpen, labelId }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>{children}</div>
    </Ctx.Provider>
  );
}

// ──── Sub-components ─────────────────────────────────────────
Select.Trigger = function Trigger({ children }: { children: ReactNode }) {
  const { open, setOpen, labelId } = useSelectCtx();
  return <button aria-haspopup="listbox" aria-labelledby={labelId} aria-expanded={open}
    onClick={() => setOpen(!open)}>{children} ▾</button>;
};

Select.Options = function Options({ children }: { children: ReactNode }) {
  const { open, labelId } = useSelectCtx();
  if (!open) return null;
  return <ul role="listbox" aria-labelledby={labelId}
    style={{ position: 'absolute', top: '100%', left: 0, border: '1px solid #ddd', background: '#fff', minWidth: 160, listStyle: 'none', margin: 0, padding: 4, zIndex: 10 }}>{children}</ul>;
};

Select.Option = function Option({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useSelectCtx();
  const selected = ctx.value === value;
  return (
    <li role="option" aria-selected={selected}
      onClick={() => { ctx.onChange(value); ctx.setOpen(false); }}
      style={{ padding: '6px 12px', cursor: 'pointer', background: selected ? '#e0f2fe' : 'transparent' }}>
      {selected ? '✓ ' : ''}{children}
    </li>
  );
};

// ──── Usage ──────────────────────────────────────────────────
function Demo() {
  const [lang, setLang] = useState('ts');
  return (
    <Select value={lang} onChange={setLang}>
      <Select.Trigger>{lang === 'ts' ? 'TypeScript' : lang === 'js' ? 'JavaScript' : 'Python'}</Select.Trigger>
      <Select.Options>
        <Select.Option value="ts">TypeScript</Select.Option>
        <Select.Option value="js">JavaScript</Select.Option>
        <Select.Option value="py">Python</Select.Option>
      </Select.Options>
    </Select>
  );
}`,
    },
    {
      label: 'Custom hooks',
      language: 'typescript',
      code: `import { useState, useEffect, useCallback, useRef } from 'react';

// ──── useLocalStorage ─────────────────────────────────────────
function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStored(prev => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [stored, setValue] as const;
}

// ──── useDebounce ─────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ──── useClickOutside ─────────────────────────────────────────
function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) callback(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
}

// ──── useWindowSize ───────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

// ──── Composed: useProductSearch ──────────────────────────────
function useProductSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [savedQuery, setSavedQuery] = useLocalStorage('lastSearch', initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => { if (debouncedQuery) setSavedQuery(debouncedQuery); }, [debouncedQuery, setSavedQuery]);

  return { query, setQuery, debouncedQuery, savedQuery };
}`,
    },
    {
      label: 'Flexible controlled (open/uncontrolled)',
      language: 'typescript',
      code: `import { useState, useRef, useCallback } from 'react';

// Flexible controlled pattern — works both controlled and uncontrolled
function useControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (v: T) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolled;

  const setValue = useCallback((next: T) => {
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
  }, [isControlled, onChange]);

  return [value, setValue] as const;
}

// Accordion that works controlled OR uncontrolled
function Accordion({
  open,             // controlled: pass this to control externally
  defaultOpen = false,
  onOpenChange,
  title,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? '▾' : '▸'} {title}</button>
      {isOpen && <div style={{ padding: '0.5rem 1rem' }}>{children}</div>}
    </div>
  );
}

// State initializer — reset to initial
function useCounter(initialCount = 0) {
  const initialRef = useRef(initialCount);
  const [count, setCount] = useState(initialCount);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset     = useCallback(() => setCount(initialRef.current), []);
  return { count, increment, decrement, reset };
}`,
    },
    {
      label: 'HOC + render prop',
      language: 'typescript',
      code: `import { ComponentType, useEffect, useState, type ReactNode } from 'react';

// ──── HOC: withAuth ────────────────────────────────────────────
interface WithAuthProps { user: { name: string; role: string } | null; }

function withAuth<P extends WithAuthProps>(
  WrappedComponent: ComponentType<P>,
  requiredRole?: string,
) {
  const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

  function WithAuth(props: Omit<P, keyof WithAuthProps>) {
    const [user, setUser] = useState<WithAuthProps['user']>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Simulate auth check
      setTimeout(() => { setUser({ name: 'Alice', role: 'admin' }); setLoading(false); }, 300);
    }, []);

    if (loading)  return <div>Checking auth…</div>;
    if (!user)    return <div>Please log in.</div>;
    if (requiredRole && user.role !== requiredRole) return <div>Access denied.</div>;

    return <WrappedComponent {...(props as P)} user={user} />;
  }
  WithAuth.displayName = \`WithAuth(\${displayName})\`;
  return WithAuth;
}

function AdminDashboard({ user }: WithAuthProps) {
  return <div>Welcome, {user!.name}!</div>;
}
const ProtectedDashboard = withAuth(AdminDashboard, 'admin');

// ──── Render prop: Mouse position ─────────────────────────────
function MouseTracker({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })} style={{ height: 200, border: '1px solid #ddd' }}>
      {children(pos)}
    </div>
  );
}

// Consumer uses render prop
function Demo() {
  return (
    <MouseTracker>
      {({ x, y }) => <p>Mouse: {x}, {y}</p>}
    </MouseTracker>
  );
}

// ──── Equivalent as a custom hook (modern) ────────────────────
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}`,
    },
    {
      label: 'Prop getter (headless)',
      language: 'typescript',
      code: `import { useState, useId, useCallback } from 'react';

// Prop getter pattern — consumer merges their own props
function useToggle(defaultOn = false) {
  const [on, setOn] = useState(defaultOn);
  const id = useId();
  const toggle = useCallback(() => setOn(o => !o), []);
  const reset  = useCallback(() => setOn(defaultOn), [defaultOn]);

  // Prop collection — a plain object of props to spread
  const togglerProps = { 'aria-pressed': on, onClick: toggle };

  // Prop getter — a function that composes caller's props with ours
  function getTogglerProps<T extends { onClick?: React.MouseEventHandler }>({ onClick, ...rest }: T = {} as T) {
    return {
      ...rest,
      'aria-pressed': on,
      id,
      onClick(e: React.MouseEvent) {
        onClick?.(e);       // caller's handler first
        toggle();           // then our toggle
      },
    };
  }

  return { on, toggle, reset, togglerProps, getTogglerProps };
}

// ──── Headless combobox stub (Radix-style) ─────────────────────
function useCombobox<T extends { label: string; value: string }>({
  items,
  itemToString = (item: T | null) => item?.label ?? '',
  onChange,
}: {
  items: T[];
  itemToString?: (item: T | null) => string;
  onChange?: (item: T) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [selected,   setSelected]   = useState<T | null>(null);
  const [isOpen,     setIsOpen]     = useState(false);

  const filtered = items.filter(i => i.label.toLowerCase().includes(inputValue.toLowerCase()));

  function getInputProps() {
    return {
      value: inputValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setInputValue(e.target.value); setIsOpen(true); },
      onFocus: () => setIsOpen(true),
    };
  }

  function getItemProps(item: T) {
    return {
      onClick() { setSelected(item); setInputValue(itemToString(item)); setIsOpen(false); onChange?.(item); },
      'aria-selected': selected?.value === item.value,
    };
  }

  return { isOpen, filtered, selected, getInputProps, getItemProps };
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using React.cloneElement for compound components',
      wrong: `function Select({ value, onChange, children }: any) {
  return <div>{React.Children.map(children, child =>
    React.cloneElement(child, { selectedValue: value, onSelect: onChange })
  )}</div>;
}
// Breaks when children are nested — only direct children receive the props`,
      right: `const SelectCtx = createContext<{ value: string; onChange: (v: string) => void } | null>(null);

function Select({ value, onChange, children }: any) {
  return <SelectCtx.Provider value={{ value, onChange }}><div>{children}</div></SelectCtx.Provider>;
}
// Works at any nesting depth — children just call useContext`,
      explanation: 'React.cloneElement only passes props to direct children. Context-based compound components work at any nesting level and do not depend on component structure. Always prefer Context for compound components.',
    },
    {
      title: 'Writing a render prop when a custom hook is cleaner',
      wrong: `// Render prop — adds nesting, harder to combine with other render props
<MouseTracker>
  {({ x, y }) => (
    <WindowSize>
      {({ width }) => <div style={{ left: x < width / 2 ? 0 : 'auto' }}>…</div>}
    </WindowSize>
  )}
</MouseTracker>`,
      right: `// Custom hooks — flat, composable, no nesting
const { x, y }  = useMousePosition();
const { width } = useWindowSize();
return <div style={{ left: x < width / 2 ? 0 : 'auto' }}>…</div>;`,
      explanation: 'Render props solve the same reuse problem as custom hooks but add JSX nesting ("callback hell"). In modern React, extract logic into custom hooks — they compose flat and are easier to read.',
    },
    {
      title: 'Creating HOCs instead of custom hooks',
      wrong: `// HOC: creates an extra component in the tree, display names get mangled
const withTheme = <P,>(Comp: ComponentType<P & { theme: string }>) =>
  function WithTheme(props: P) {
    const theme = useTheme();   // just a hook call
    return <Comp {...props} theme={theme} />;
  };`,
      right: `// Custom hook: no extra component, no display-name problem
function useTheme() { return useContext(ThemeCtx); }

function MyComponent() {
  const theme = useTheme();   // direct, clear, testable
  return <div data-theme={theme}>…</div>;
}`,
      explanation: 'HOCs that only inject a hook\'s result have no advantage over calling the hook directly. Use HOCs only for genuine component-level concerns (error boundaries, class component wrapping) that hooks cannot address.',
    },
    {
      title: 'Prop getter that overwrites the caller\'s handler',
      wrong: `function getButtonProps() {
  return { onClick: toggle };  // consumer's onClick is silently discarded
}
// <button {...getButtonProps()} onClick={myHandler} /> — myHandler never runs`,
      right: `function getButtonProps({ onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> = {}) {
  return {
    ...rest,
    onClick(e: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(e);   // caller's handler first
      toggle();       // then ours
    },
  };
}`,
      explanation: 'Prop getters must compose, not overwrite. The convention is: call the consumer\'s handler first, then the internal one. If the consumer calls e.stopPropagation(), the internal handler still runs — add an explicit escape hatch if needed.',
    },
    {
      title: 'Flexible controlled: checking null instead of undefined',
      wrong: `const isControlled = controlledValue !== null;  // null is a valid controlled value`,
      right: `const isControlled = controlledValue !== undefined;  // undefined = uncontrolled; null = controlled "empty"`,
      explanation: 'null is a valid controlled value (e.g., "no item selected"). The controlled/uncontrolled distinction should use undefined: if the value prop was never passed (undefined), the component manages its own state.',
    },
    {
      title: 'Displaying HOC-wrapped components as "Unknown" in DevTools',
      wrong: `const Protected = withAuth(Dashboard);   // shows as "WithAuth" or "Unknown" in DevTools`,
      right: `function withAuth<P>(Wrapped: ComponentType<P>) {
  function WithAuth(props: P) { /* ... */ return <Wrapped {...props} />; }
  WithAuth.displayName = \`WithAuth(\${Wrapped.displayName ?? Wrapped.name ?? 'Component'})\`;
  return WithAuth;
}`,
      explanation: 'HOC-wrapped components lose their display name by default — React DevTools shows the inner component name, not the wrapped one. Always set displayName on the returned component for readable DevTools.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Headless Tabs Component',
    language: 'typescript',
    description: `Build a compound, accessible Tabs component that:

1. Uses Context to share activeTab state between Tabs.List, Tabs.Tab, and Tabs.Panel
2. Supports both uncontrolled (internal state) and controlled (value + onChange prop) modes
3. Tabs.Tab renders a <button role="tab" aria-selected aria-controls> and is keyboard-navigable (ArrowLeft/ArrowRight)
4. Tabs.Panel renders only when its tab is active, with role="tabpanel" aria-labelledby
5. Exposes the dot-notation API: <Tabs>, <Tabs.List>, <Tabs.Tab id="...">, <Tabs.Panel id="...">`,
    hints: [
      'createContext for { activeTab, setActiveTab } — throw if used outside <Tabs>',
      'Uncontrolled: useState inside Tabs, defaultValue prop. Controlled: use the value/onChange props directly',
      'Keyboard nav: onKeyDown on Tabs.List, find all [role="tab"] buttons, navigate with ArrowLeft/ArrowRight, call .focus()',
      'aria-controls on Tabs.Tab should match the id of its Tabs.Panel — generate a stable ID with useId()',
    ],
    starterCode: `import { createContext, useContext, useState, useId, useRef, type ReactNode } from 'react';

// TODO: Create TabsContext with activeTab and setActiveTab
// TODO: Implement Tabs root — supports controlled (value/onChange) and uncontrolled (defaultValue)
// TODO: Implement Tabs.List — wraps buttons, handles ArrowLeft/ArrowRight keyboard nav
// TODO: Implement Tabs.Tab — button with role="tab", aria-selected, aria-controls
// TODO: Implement Tabs.Panel — div with role="tabpanel", only renders when active

// Usage should look like:
//   <Tabs defaultValue="profile">
//     <Tabs.List>
//       <Tabs.Tab id="profile">Profile</Tabs.Tab>
//       <Tabs.Tab id="settings">Settings</Tabs.Tab>
//     </Tabs.List>
//     <Tabs.Panel id="profile"><p>Profile content</p></Tabs.Panel>
//     <Tabs.Panel id="settings"><p>Settings content</p></Tabs.Panel>
//   </Tabs>`,
    solution: `import { createContext, useContext, useState, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react';

interface TabsCtx { activeTab: string; setActiveTab: (id: string) => void; }
const Ctx = createContext<TabsCtx | null>(null);
const useTabsCtx = () => { const c = useContext(Ctx); if (!c) throw new Error('Use inside <Tabs>'); return c; };

function Tabs({
  value, defaultValue = '', onChange, children,
}: { value?: string; defaultValue?: string; onChange?: (v: string) => void; children: ReactNode }) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internal;
  const setActiveTab = useCallback((id: string) => {
    if (!isControlled) setInternal(id);
    onChange?.(id);
  }, [isControlled, onChange]);
  return <Ctx.Provider value={{ activeTab, setActiveTab }}><div>{children}</div></Ctx.Provider>;
}

Tabs.List = function TabsList({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!listRef.current) return;
    const tabs = Array.from(listRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const idx  = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(idx + 1) % tabs.length]?.focus(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length]?.focus(); }
  };
  return <div ref={listRef} role="tablist" onKeyDown={handleKey} style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb' }}>{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabsCtx();
  const selected = activeTab === id;
  return (
    <button role="tab" aria-selected={selected} aria-controls={\`panel-\${id}\`} id={\`tab-\${id}\`}
      onClick={() => setActiveTab(id)}
      style={{ padding: '8px 16px', border: 'none', background: selected ? '#0ea5e9' : 'transparent', color: selected ? '#fff' : 'inherit', cursor: 'pointer', borderRadius: '4px 4px 0 0' }}>
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useTabsCtx();
  if (activeTab !== id) return null;
  return <div role="tabpanel" id={\`panel-\${id}\`} aria-labelledby={\`tab-\${id}\`} style={{ padding: '1rem' }}>{children}</div>;
};`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of Context-based compound components over React.Children + cloneElement?',
      options: ['Context is faster than cloneElement', 'Context works at any nesting depth; cloneElement only passes props to direct children', 'Context avoids re-renders; cloneElement always causes them', 'cloneElement requires TypeScript'],
      answer: 1,
      explanation: 'React.cloneElement only injects props into direct children — if the children are nested inside a wrapper div or fragment, the props are lost. Context-based compound components work at any depth because any descendant can call useContext.',
    },
    {
      q: 'When should you use a render prop pattern over a custom hook?',
      options: ['Always — render props are more flexible', 'When you need to inject behavior into JSX returned by the consumer AND a custom hook cannot directly provide the necessary ref or event binding', 'Render props are deprecated — never use them', 'When performance is critical'],
      answer: 1,
      explanation: 'Custom hooks have replaced render props for most reuse cases. Render props are still useful when a library must inject behavior AND rendering context in a way hooks cannot (e.g., a drag-and-drop library that must control which element receives event listeners).',
    },
    {
      q: 'What distinguishes a prop getter from a prop collection?',
      options: ['A prop getter is a function that accepts and merges the consumer\'s own props; a prop collection is a plain object', 'They are identical terms', 'A prop collection uses TypeScript; a prop getter does not', 'A prop getter is for aria attributes only'],
      answer: 0,
      explanation: 'A prop collection is a plain object you spread: <button {...togglerProps} />. A prop getter is a function: getToggleProps({ onClick: myHandler }) — it composes the consumer\'s props with the internal ones, allowing custom event handlers to coexist.',
    },
    {
      q: 'For the flexible controlled pattern, how do you distinguish controlled from uncontrolled mode?',
      options: ['Check if the prop is null', 'Check if the prop is undefined — undefined = uncontrolled, any other value (including null) = controlled', 'Check if an onChange prop was also passed', 'Check if defaultValue was passed'],
      answer: 1,
      explanation: 'undefined means the prop was not passed — the component should manage its own state. null is a valid controlled value meaning "nothing selected." Checking for null incorrectly marks null-selected state as uncontrolled.',
    },
    {
      q: 'What is the "headless UI" pattern?',
      options: ['Server-side rendered components without hydration', 'Components or hooks that manage all behavior and accessibility but render no JSX — the consumer provides all markup', 'Components without props', 'UI built without a design system'],
      answer: 1,
      explanation: 'Headless UI (or renderless components) separates behavior and accessibility from visual design. Libraries like Radix UI Primitives, Headless UI (Tailwind), and TanStack Table follow this model — they handle keyboard navigation, ARIA, and state, but all styling is the consumer\'s responsibility.',
    },
    {
      q: 'Why should HOCs set displayName on the returned component?',
      options: ['TypeScript requires it', 'Without it, React DevTools shows the component as "Unknown" or with the wrong name, making debugging very hard', 'It improves render performance', 'It is required by ESLint rules'],
      answer: 1,
      explanation: 'When a HOC returns an anonymous function, React DevTools cannot infer its name and shows it as "Anonymous" or uses the inner component\'s name ambiguously. Setting displayName = `HOCName(${Wrapped.displayName})` gives a readable component tree.',
    },
    {
      q: 'What is the "state initializer" pattern?',
      options: ['Initialising state with a lazy function passed to useState', 'Accepting an initialValue prop, storing it in a ref, and exposing a reset() function that restores to that value', 'Persisting initial state to localStorage', 'Using a reducer for all initial state'],
      answer: 1,
      explanation: 'State initializer: accept an initialValue/defaultValue prop; store it in a useRef (the ref does not change on re-renders); expose a reset() function that calls setState(initialRef.current). This lets consumers reset complex form or UI state without lifting it up.',
    },
    {
      q: 'What is the "composite" (dot notation) pattern?',
      options: ['Using multiple context providers', 'Assigning sub-components as static properties of the parent — Select.Option, Modal.Header, Tabs.Tab', 'Composing multiple HOCs', 'Using React.Children.map to compose children'],
      answer: 1,
      explanation: 'The composite pattern co-locates related sub-components in one file and exposes them as static properties of the parent. Select.Option, Tabs.Tab, Modal.Header — the namespace makes the relationship explicit and the API self-documenting.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I convert all my render props to custom hooks?',
      a: 'Yes, for any render props in components YOU own. New components should use custom hooks. The exception is library-provided render props you cannot change — or patterns like <Consumer>{value => ...}</Consumer> from older Context APIs, which are still valid.',
    },
    {
      q: 'When does prop drilling actually become a problem?',
      a: 'When the same prop passes through 3+ intermediate components that do not use it, or when adding a new feature requires touching many files just to thread a prop. At that point, lift the state to Context, Zustand, or a query cache rather than drilling further.',
    },
    {
      q: 'Is the container/presentational pattern still relevant?',
      a: 'The strict separation (class containers, functional presentational) is less relevant since hooks. But the principle — separating data-fetching concerns from rendering — is still useful. Today this is usually expressed as "smart hook + dumb component": the hook fetches/manages state, the component renders it.',
    },
    {
      q: 'How do Radix UI Primitives relate to these patterns?',
      a: 'Radix uses compound components + headless pattern + prop getters all together. Each primitive (Select, Dialog, Tabs) is a set of compound sub-components that share implicit Context, manage all accessibility/keyboard behavior, and render no styles — the consumer adds all CSS via className.',
    },
    {
      q: 'When is a HOC still the right choice over a hook?',
      a: 'Error boundaries — class components only support componentDidCatch and getDerivedStateFromError, so withErrorBoundary HOCs are the standard pattern. Also when wrapping third-party components whose source you cannot modify (injecting props into a legacy component).',
    },
    {
      q: 'What is the difference between a controlled and an uncontrolled component pattern?',
      a: 'Controlled: the parent owns the value and passes it down via props; every change goes through the parent\'s handler. Uncontrolled: the component owns its own state via a ref or internal useState — the parent asks for the value only when needed (e.g. on submit). Use controlled for forms that need live validation or cross-field logic; use uncontrolled (with defaultValue) for simple inputs where you only need the final value.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Custom hooks are the modern reuse primitive — compound components (Context), prop getters, and headless UI complete the toolkit.',
    mustKnow: [
      'Custom hooks: extract stateful logic (not JSX) into a function starting with "use" — they replace render props and most HOCs',
      'Compound components: share implicit state via Context for flexible composition — not React.cloneElement',
      'Composite pattern: Select.Option, Tabs.Tab — sub-components as static properties, co-located, self-documenting API',
      'Flexible controlled: undefined = uncontrolled, any other value (including null) = controlled',
      'Prop getter: a function that composes consumer\'s props with internal ones — handlers must compose, not overwrite',
      'HOCs: still justified for error boundaries and class-component wrapping; set displayName for DevTools',
    ],
    interviewFocus: [
      'What problem does the compound component pattern solve — and why Context is better than cloneElement?',
      'How do custom hooks replace render props — and when would you still use a render prop?',
      'Explain the flexible controlled pattern — how do you support both controlled and uncontrolled from one component?',
      'What is a headless UI library, and which patterns does it combine?',
    ],
  };
}
