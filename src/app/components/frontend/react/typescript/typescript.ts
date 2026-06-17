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
  selector: 'app-react-typescript',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './typescript.html',
  styleUrl: './typescript.scss',
})
export class ReactTypescript {
  quickRef: QuickRefItem[] = [
    { name: '(props: Props) => JSX.Element',      type: 'syntax',    desc: 'Preferred function component signature. No implicit children unlike React.FC.' },
    { name: 'React.FC / React.FunctionComponent', type: 'type',      desc: 'Legacy alias — avoid in new code. Implicitly added children prop in older React types.' },
    { name: 'React.ReactNode',                    type: 'type',      desc: 'Broadest children type: JSX, string, number, null, undefined, array. Use for children prop.' },
    { name: 'React.ReactElement',                 type: 'type',      desc: 'Narrower — JSX only, no primitives. Use for props that must receive a React element.' },
    { name: 'React.ChangeEvent<T>',               type: 'type',      desc: 'onChange event for form elements. T is the element type: HTMLInputElement, HTMLSelectElement.' },
    { name: 'React.MouseEvent<T>',                type: 'type',      desc: 'onClick event. T defaults to HTMLElement. Use Element for generic click targets.' },
    { name: 'React.FormEvent<T>',                 type: 'type',      desc: 'onSubmit event. T is HTMLFormElement.' },
    { name: 'React.KeyboardEvent<T>',             type: 'type',      desc: 'onKeyDown/Up/Press. Check e.key (string) not e.keyCode (deprecated).' },
    { name: 'React.Ref<T> / useRef<T>(null)',      type: 'type',      desc: 'DOM ref. T is the element type: HTMLInputElement, HTMLDivElement, etc.' },
    { name: 'ComponentProps<typeof C>',           type: 'type',      desc: 'Extracts all props from a component. Extend to add extra props to a wrapper.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Typing props — interfaces vs type aliases',
      points: [
        '<strong>Both interfaces and type aliases work for props.</strong> The community convention is to use <code>interface</code> for object shapes (extendable with <code>extends</code>) and <code>type</code> for unions/intersections (<code>ButtonVariant = "primary" | "secondary"</code>). Choose one and be consistent.',
        '<strong>Always name the prop type after the component:</strong> <code>interface ButtonProps { ... }</code>. Inline prop types (<code>({ label }: { label: string })</code>) are fine for one-off components but harder to reuse.',
        '<strong>Optional props:</strong> use <code>label?: string</code> for optional, <code>label: string | undefined</code> only when you need to distinguish "not passed" from "explicitly undefined". Default values go in the destructuring: <code>({ size = "md" }: ButtonProps)</code>.',
        '<strong>Discriminated unions</strong> are the TypeScript superpower for variant props: <code>type AlertProps = { kind: "info"; message: string } | { kind: "error"; code: number; message: string }</code>. TypeScript narrows the type correctly based on <code>kind</code>.',
      ],
    },
    {
      heading: 'Event types',
      points: [
        '<strong>React wraps native DOM events</strong> in synthetic event objects with the same shape. The generic parameter is the element, not the event — <code>React.ChangeEvent&lt;HTMLInputElement&gt;</code>, not <code>React.ChangeEvent&lt;Event&gt;</code>.',
        '<strong>Common event types:</strong> <code>onChange</code> → <code>React.ChangeEvent&lt;HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement&gt;</code>; <code>onClick</code> → <code>React.MouseEvent&lt;HTMLButtonElement&gt;</code>; <code>onSubmit</code> → <code>React.FormEvent&lt;HTMLFormElement&gt;</code>.',
        '<strong>Inline vs typed:</strong> for simple handlers you can let TypeScript infer: <code>onChange={e =&gt; setVal(e.target.value)}</code> — TS infers the event type from the element. For extracted handlers, annotate explicitly: <code>const handleChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; ...</code>.',
        '<strong>Event target narrowing:</strong> <code>e.target</code> is <code>EventTarget</code> by default in some cases. Cast to the specific element when accessing non-standard properties: <code>(e.target as HTMLInputElement).value</code>.',
      ],
    },
    {
      heading: 'Refs and forwardRef',
      points: [
        '<strong>useRef for DOM elements:</strong> always pass the element type and initialise with <code>null</code>: <code>const ref = useRef&lt;HTMLInputElement&gt;(null)</code>. Access with <code>ref.current?.focus()</code> — the <code>?.</code> handles the initial null.',
        '<strong>useRef for mutable values (no re-render):</strong> use the value type directly: <code>const timerRef = useRef&lt;number | null&gt;(null)</code>. No null initialisation needed — TypeScript distinguishes the two useRef overloads.',
        '<strong>forwardRef:</strong> when a component needs to forward a ref to a DOM node, wrap with <code>React.forwardRef&lt;HTMLInputElement, InputProps&gt;((props, ref) =&gt; ...)</code>. The type params are <code>&lt;RefType, PropsType&gt;</code> — RefType first.',
        '<strong>useImperativeHandle:</strong> expose a custom handle instead of the raw DOM node. Type the handle with an interface: <code>interface InputHandle { focus(): void; clear(): void; }</code>. Used in component libraries where callers should not access the raw DOM.',
      ],
    },
    {
      heading: 'Generic components',
      points: [
        '<strong>Generic components</strong> accept a type parameter that flows through props. A <code>List&lt;T&gt;</code> component can accept <code>items: T[]</code> and a <code>renderItem: (item: T) =&gt; ReactNode</code> — the item type is inferred from the array.',
        '<strong>Arrow function syntax requires a trailing comma</strong> in TSX to disambiguate the generic from a JSX tag: <code>const List = &lt;T,&gt;({ items }: { items: T[] }) =&gt; ...</code>. Function declaration syntax does not need this.',
        '<strong>Constrained generics:</strong> add a constraint when you need to access a property — <code>&lt;T extends { id: string }&gt;</code> lets you use <code>item.id</code> as a key without a cast. Prefer specific constraints over <code>extends object</code>.',
        '<strong>Generic context:</strong> when Context must be generic, create a factory: <code>function createContext&lt;T&gt;() { return React.createContext&lt;T | null&gt;(null); }</code>. Each call to the factory creates a typed context with no unsafe <code>any</code>.',
      ],
    },
    {
      heading: 'Utility types and component types',
      points: [
        '<strong>ComponentProps&lt;typeof C&gt;</strong> extracts all props from a component. Use it to extend a component without manually listing every prop: <code>interface MyButtonProps extends ComponentProps&lt;typeof Button&gt; { loading?: boolean; }</code>.',
        '<strong>ComponentPropsWithoutRef&lt;"button"&gt;</strong> gives you all native HTML element props. Combine with your own: <code>interface ButtonProps extends React.ComponentPropsWithoutRef&lt;"button"&gt; { variant: "primary" | "secondary"; }</code>.',
        '<strong>PropsWithChildren&lt;P&gt;</strong> adds <code>children?: ReactNode</code> to P. Useful when a component definitely accepts children but you want to keep the base type clean.',
        '<strong>Omit for overrides:</strong> <code>type Props = Omit&lt;ComponentProps&lt;typeof Input&gt;, "onChange"&gt; & { onChange: (value: string) =&gt; void }</code> — replace the native onChange with a simplified string-only version.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Props & events',
      language: 'typescript',
      code: `import { useState } from 'react';

// ──── Discriminated union props ────────────────────────────────
type AlertProps =
  | { kind: 'info';    message: string }
  | { kind: 'warning'; message: string; dismissible?: boolean }
  | { kind: 'error';   message: string; code: number };

function Alert(props: AlertProps) {
  const colors = { info: '#0ea5e9', warning: '#f59e0b', error: '#ef4444' };
  return (
    <div style={{ padding: 12, background: colors[props.kind] + '22', border: \`1px solid \${colors[props.kind]}\`, borderRadius: 6 }}>
      <strong>{props.kind.toUpperCase()}</strong>: {props.message}
      {/* TypeScript narrows: props.code only available when kind === 'error' */}
      {props.kind === 'error' && <span> (code {props.code})</span>}
      {props.kind === 'warning' && props.dismissible && <button style={{ float: 'right' }}>×</button>}
    </div>
  );
}

// ──── Event typing ─────────────────────────────────────────────
interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

function SearchBox({ onSearch, placeholder = 'Search…' }: SearchBoxProps) {
  const [value, setValue] = useState('');

  // Inline: TS infers the event type from the element
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={value} onChange={handleChange} onKeyDown={handleKeyDown} placeholder={placeholder} />
      <button type="submit">Search</button>
    </form>
  );
}`,
    },
    {
      label: 'Refs & forwardRef',
      language: 'typescript',
      code: `import { useRef, useEffect, forwardRef, useImperativeHandle, type ReactNode } from 'react';

// ──── DOM ref ──────────────────────────────────────────────────
function AutoFocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();   // ?. handles null before mount
  }, []);

  return <input ref={inputRef} type="text" />;
}

// ──── Mutable value ref (no re-render) ────────────────────────
function Timer() {
  const timerId = useRef<number | null>(null);
  const [running, setRunning] = useState(false);

  function start() {
    timerId.current = window.setInterval(() => console.log('tick'), 1000);
    setRunning(true);
  }
  function stop() {
    if (timerId.current !== null) clearInterval(timerId.current);
    setRunning(false);
  }
  return <button onClick={running ? stop : start}>{running ? 'Stop' : 'Start'}</button>;
}

// ──── forwardRef ───────────────────────────────────────────────
interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

// Type params: <RefType, PropsType>
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, value, onChange },
  ref,   // ref is React.ForwardedRef<HTMLInputElement>
) {
  return (
    <label>
      {label}
      <input ref={ref} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
});

// ──── useImperativeHandle ─────────────────────────────────────
interface FancyInputHandle { focus(): void; clear(): void; }

const FancyInput = forwardRef<FancyInputHandle, { placeholder?: string }>(
  function FancyInput({ placeholder }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({
      focus() { inputRef.current?.focus(); },
      clear() { if (inputRef.current) inputRef.current.value = ''; },
    }));
    return <input ref={inputRef} placeholder={placeholder} style={{ border: '2px solid #0ea5e9', borderRadius: 6, padding: 8 }} />;
  }
);

// Usage:
function Page() {
  const fancyRef = useRef<FancyInputHandle>(null);
  return (
    <>
      <FancyInput ref={fancyRef} placeholder="Type here…" />
      <button onClick={() => fancyRef.current?.focus()}>Focus</button>
      <button onClick={() => fancyRef.current?.clear()}>Clear</button>
    </>
  );
}`,
    },
    {
      label: 'Generic components',
      language: 'typescript',
      code: `import type { ReactNode } from 'react';

// ──── Basic generic list ───────────────────────────────────────
// The trailing comma after T is required in TSX to avoid JSX-tag ambiguity
function List<T extends { id: string | number }>({
  items,
  renderItem,
  emptyMessage = 'No items',
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}) {
  if (!items.length) return <p>{emptyMessage}</p>;
  return <ul>{items.map((item, i) => <li key={item.id}>{renderItem(item, i)}</li>)}</ul>;
}

// Usage — TS infers T as { id: number; name: string; price: number }
function ProductList({ products }: { products: { id: number; name: string; price: number }[] }) {
  return (
    <List
      items={products}
      renderItem={p => <span>{p.name} — \${p.price}</span>}
      emptyMessage="No products found"
    />
  );
}

// ──── Generic select ───────────────────────────────────────────
interface Option<T> { value: T; label: string; }

function Select<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <select value={String(value)} onChange={e => {
      const raw = e.target.value;
      const typed = (typeof value === 'number' ? Number(raw) : raw) as T;
      onChange(typed);
    }}>
      {options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

// ──── Generic context factory ──────────────────────────────────
import { createContext as reactCreateContext, useContext } from 'react';

function createTypedContext<T>(name: string) {
  const Ctx = reactCreateContext<T | null>(null);
  function useTypedContext() {
    const v = useContext(Ctx);
    if (v === null) throw new Error(\`use\${name} must be inside \${name}Provider\`);
    return v;
  }
  return [Ctx.Provider, useTypedContext] as const;
}

const [UserProvider, useUser] = createTypedContext<{ name: string; role: string }>('User');`,
    },
    {
      label: 'ComponentProps & utility types',
      language: 'typescript',
      code: `import { type ComponentProps, type ComponentPropsWithoutRef } from 'react';

// ──── Extend a component's props ────────────────────────────────
function BaseButton({ children, ...rest }: ComponentPropsWithoutRef<'button'>) {
  return <button {...rest}>{children}</button>;
}

// Extend with extra props, keep all native button props
interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  icon: React.ReactNode;
  label: string;          // aria-label shorthand
}

function IconButton({ icon, label, children, ...rest }: IconButtonProps) {
  return (
    <BaseButton aria-label={label} {...rest}>
      {icon}
      {children && <span style={{ marginLeft: 6 }}>{children}</span>}
    </BaseButton>
  );
}

// ──── Override one prop ────────────────────────────────────────
// Native input onChange gives ChangeEvent; we want the string value directly
type SimpleInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'onChange'> & {
  onChange?: (value: string) => void;
};

function SimpleInput({ onChange, ...rest }: SimpleInputProps) {
  return <input {...rest} onChange={onChange ? e => onChange(e.target.value) : undefined} />;
}

// ──── Extract props from a custom component ────────────────────
function Card({ title, children, accent = '#0ea5e9' }: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return <div style={{ border: \`2px solid \${accent}\`, borderRadius: 8, padding: 16 }}><h3>{title}</h3>{children}</div>;
}

// Wrap Card and add an icon prop
interface FeatureCardProps extends ComponentProps<typeof Card> {
  icon: string;
}

function FeatureCard({ icon, title, ...rest }: FeatureCardProps) {
  return <Card title={\`\${icon} \${title}\`} {...rest} />;
}`,
    },
    {
      label: 'Typing hooks',
      language: 'typescript',
      code: `import { useState, useReducer, useCallback, type Dispatch } from 'react';

// ──── useState with explicit type ─────────────────────────────
// Needed when initial value is null/undefined but the state has a richer type
const [user, setUser] = useState<{ name: string; email: string } | null>(null);

// ──── useReducer ───────────────────────────────────────────────
interface CartItem { id: string; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; }

type CartAction =
  | { type: 'ADD';    item: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; qty: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD':        return { items: [...state.items, action.item] };
    case 'REMOVE':     return { items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY': return { items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i) };
    case 'CLEAR':      return { items: [] };
  }
}

// ──── Typed custom hook ────────────────────────────────────────
interface UsePaginationOptions { total: number; pageSize: number; initialPage?: number; }
interface UsePaginationReturn  { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean; nextPage(): void; prevPage(): void; goTo(p: number): void; }

function usePagination({ total, pageSize, initialPage = 1 }: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const totalPages = Math.ceil(total / pageSize);
  return {
    page, totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: useCallback(() => setPage(p => Math.min(p + 1, totalPages)), [totalPages]),
    prevPage: useCallback(() => setPage(p => Math.max(p - 1, 1)), []),
    goTo:     useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]),
  };
}

// Exporting dispatch type for use in context
type CartDispatch = Dispatch<CartAction>;`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using React.FC (adds implicit children in React 17 and below)',
      wrong: `// React.FC adds children?: ReactNode implicitly in older @types/react
// The component doesn't use children, but TypeScript won't catch accidental passing
const Button: React.FC<{ label: string }> = ({ label }) => <button>{label}</button>;`,
      right: `// Plain function — explicit, no surprise children
function Button({ label }: { label: string }) {
  return <button>{label}</button>;
}
// If children is needed, add it explicitly:
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3>{title}</h3>{children}</div>;
}`,
      explanation: 'React.FC added an implicit children prop in React 17 and earlier — a component would silently accept children it never used. @types/react v18 removed this, but the pattern is still considered bad practice. Use plain function signatures.',
    },
    {
      title: 'Typing forwardRef with swapped type params',
      wrong: `// WRONG order: (PropsType, RefType) — TypeScript error or silent wrong types
const Input = forwardRef<TextInputProps, HTMLInputElement>((props, ref) => <input ref={ref} />);`,
      right: `// CORRECT order: (RefType, PropsType) — RefType first
const Input = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => <input ref={ref} />);`,
      explanation: 'forwardRef<RefType, PropsType> — the generic order is RefType first, PropsType second. It is easy to swap. A wrong RefType means the parent\'s useRef<...> type won\'t match.',
    },
    {
      title: 'Using any for event handlers',
      wrong: `// any loses all type safety — e.target.value, e.key etc. are all unknown
const handleChange = (e: any) => setValue(e.target.value);
const handleClick  = (e: any) => e.stopPropagation();`,
      right: `const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
const handleClick  = (e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation();`,
      explanation: 'Use the specific React event types — they carry the correct element type and all standard DOM event properties. React.ChangeEvent<T>, React.MouseEvent<T>, React.FormEvent<T>, React.KeyboardEvent<T>.',
    },
    {
      title: 'Typing children as any or React.ReactChild (deprecated)',
      wrong: `interface CardProps {
  children: any;              // loses all type checking
  // or
  children: React.ReactChild;  // deprecated in @types/react v18
}`,
      right: `interface CardProps {
  children: React.ReactNode;  // JSX, string, number, null, undefined, arrays
  // OR narrow when you need only JSX elements:
  children: React.ReactElement | React.ReactElement[];
}`,
      explanation: 'React.ReactNode is the broadest children type that covers all valid React children. React.ReactChild is deprecated — it did not include null/undefined. For children that must be React elements (not strings), use React.ReactElement.',
    },
    {
      title: 'Casting e.target as HTMLInputElement unnecessarily',
      wrong: `// Casting when the element type is already known from the event generic
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value = (e.target as HTMLInputElement).value;  // redundant cast
}`,
      right: `// e.target is already typed as HTMLInputElement from the generic
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value;  // no cast needed
}`,
      explanation: 'When you use React.ChangeEvent<HTMLInputElement>, TypeScript already knows e.target is HTMLInputElement. The cast is noise. Only cast when the generic cannot infer the type — e.g., generic event listeners added in useEffect.',
    },
    {
      title: 'Using type assertion (as) to silence type errors on component props',
      wrong: `// Silencing the error hides a genuine type mismatch
<UserCard user={data as User} />          // data might actually be null
<Button onClick={handler as any} />      // handler signature doesn't match`,
      right: `// Fix the type at the source
if (!data) return <Spinner />;
<UserCard user={data} />                  // data is narrowed to User

// or use optional chaining/defaults
<UserCard user={data ?? DEFAULT_USER} />`,
      explanation: 'Type assertions with as silence the compiler without fixing the bug. A runtime error will happen when the actual type doesn\'t match. Fix the type at the source — narrow with a guard, provide a default, or fix the function signature.',
    },
  ];

  challenge: Challenge = {
    title: 'Type a Generic Data Table',
    language: 'typescript',
    description: `Build a fully typed generic DataTable<T> component that:

1. Accepts items: T[] and columns: Column<T>[] where Column<T> has { key: keyof T; header: string; render?: (value: T[keyof T], row: T) => ReactNode }
2. Renders a table with headers and rows — each cell uses render() if provided, otherwise String(value)
3. Supports optional onRowClick?: (row: T) => void prop
4. Is fully type-safe: accessing column.key on a T item must not require any casts
5. The column type should constrain key to keyof T so invalid field names are compile errors`,
    hints: [
      'Define Column<T> with key: keyof T — this constrains valid column keys to T\'s actual properties',
      'For render?, use (value: T[keyof T], row: T) => ReactNode to get the value type',
      'For accessing the cell value: row[col.key] — TypeScript infers T[keyof T]',
      'Add a constraint to T if you need a stable key for rows: T extends { id: string | number }',
    ],
    starterCode: `import type { ReactNode } from 'react';

// TODO: Define Column<T> interface with key: keyof T, header: string, optional render
// TODO: Define DataTableProps<T> with items, columns, optional onRowClick
// TODO: Implement DataTable<T> component — generic arrow function with trailing comma
// TODO: Render a <table> with thead (column headers) and tbody (rows)
// TODO: For each cell: use col.render(row[col.key], row) if render exists, else String(row[col.key])

// The usage below must type-check with NO casts:
interface Product { id: number; name: string; price: number; inStock: boolean; }

const products: Product[] = [
  { id: 1, name: 'Widget', price: 9.99,  inStock: true  },
  { id: 2, name: 'Gadget', price: 24.99, inStock: false },
];

// This usage should compile and show type errors for invalid keys:
<DataTable
  items={products}
  columns={[
    { key: 'name',    header: 'Product' },
    { key: 'price',   header: 'Price',    render: v => \`\$\${(v as number).toFixed(2)}\` },
    { key: 'inStock', header: 'Available', render: v => v ? '✓' : '✗' },
    // { key: 'missing', header: 'Bad' },   // ← should be a TypeScript error
  ]}
  onRowClick={row => console.log(row.id)}
/>`,
    solution: `import type { ReactNode } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface DataTableProps<T extends { id: string | number }> {
  items: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

function DataTable<T extends { id: string | number }>({
  items,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map(row => (
          <tr key={row.id} onClick={() => onRowClick?.(row)}
            style={{ cursor: onRowClick ? 'pointer' : 'default', borderBottom: '1px solid #f3f4f6' }}>
            {columns.map(col => {
              const value = row[col.key];
              return (
                <td key={String(col.key)} style={{ padding: '8px 12px' }}>
                  {col.render ? col.render(value, row) : String(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Usage — fully typed, no casts needed for row/column access ──
interface Product { id: number; name: string; price: number; inStock: boolean; }
const products: Product[] = [
  { id: 1, name: 'Widget', price: 9.99,  inStock: true  },
  { id: 2, name: 'Gadget', price: 24.99, inStock: false },
];

function App() {
  return (
    <DataTable
      items={products}
      columns={[
        { key: 'name',    header: 'Product' },
        { key: 'price',   header: 'Price',     render: (v) => \`\$\${(v as number).toFixed(2)}\` },
        { key: 'inStock', header: 'Available', render: (v) => v ? '✓' : '✗' },
      ]}
      onRowClick={row => alert(row.name)}
    />
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is (props: Props) => JSX.Element preferred over React.FC<Props>?',
      options: ['JSX.Element is faster', 'React.FC added implicit children in older @types/react, making the prop list inaccurate. Plain function signatures are explicit about what the component accepts.', 'React.FC does not support hooks', 'React.FC is not valid TypeScript'],
      answer: 1,
      explanation: 'React.FC added children?: ReactNode implicitly in @types/react versions targeting React 17 and earlier. This made every component silently accept children it never used. Plain function signatures force you to declare children explicitly.',
    },
    {
      q: 'What is the correct order of type parameters in forwardRef?',
      options: ['forwardRef<PropsType, RefType>', 'forwardRef<RefType, PropsType>', 'forwardRef<ComponentType, RefType>', 'forwardRef<RefType>'],
      answer: 1,
      explanation: 'forwardRef<RefType, PropsType> — RefType (the DOM or component handle type) comes first, PropsType second. Swapping them causes TypeScript to assign the wrong types to ref and props.',
    },
    {
      q: 'How do you add a trailing comma in a TSX generic arrow function to avoid JSX ambiguity?',
      options: ['Add extends after T: const List = <T extends unknown>', 'Add a trailing comma: const List = <T,>(...)', 'Use a regular function declaration instead', 'Both B and C are valid'],
      answer: 3,
      explanation: 'Both work: <T,> (trailing comma) tells the TSX parser it is a generic, not a JSX tag. A regular function declaration (function List<T>...) also avoids the ambiguity. Either is acceptable; the trailing comma is the convention for arrow functions.',
    },
    {
      q: 'Which type should you use for a component\'s children prop?',
      options: ['any', 'React.ReactChild (deprecated)', 'React.ReactNode — covers JSX, strings, numbers, null, undefined, and arrays', 'React.Element'],
      answer: 2,
      explanation: 'React.ReactNode is the broadest valid children type. React.ReactChild is deprecated in v18 types. React.ReactElement is narrower — strings and numbers are not ReactElements. Use ReactElement when children MUST be a React element (e.g., a compound component slot).',
    },
    {
      q: 'What does ComponentPropsWithoutRef<"button"> give you?',
      options: ['Only the ref prop of a button', 'All native HTML button props except ref — useful as a base for custom button components', 'Props of a React.Component class button', 'It is equivalent to React.ButtonHTMLAttributes<HTMLButtonElement>'],
      answer: 1,
      explanation: 'ComponentPropsWithoutRef<"button"> extracts all HTML attributes for the button element, excluding the ref. It is equivalent to React.ButtonHTMLAttributes<HTMLButtonElement> but works with any element via the string tag. Use it as a base for wrapper components.',
    },
    {
      q: 'You have a generic component List<T> and want to constrain T so you can use item.id as a React key. What constraint do you add?',
      options: ['T extends any', 'T extends object', 'T extends { id: string | number }', 'T extends React.Key'],
      answer: 2,
      explanation: 'T extends { id: string | number } tells TypeScript that every T has an id property of type string or number. You can then safely use item.id as a key without casting. React.Key is a type alias for string | number | bigint that also works.',
    },
    {
      q: 'When do you need to explicitly cast e.target in a React event handler?',
      options: ['Always — TypeScript cannot infer e.target type', 'Never — React event generics fully type e.target', 'Only when using generic event listeners in useEffect, not in JSX event handler props', 'Only for keyboard events'],
      answer: 2,
      explanation: 'JSX event handler props (onClick, onChange, etc.) are typed via the React event generics, so e.target is correctly typed. When you add raw addEventListener in useEffect, you get a native DOM Event whose target is EventTarget — then a cast is needed.',
    },
    {
      q: 'How do you override one prop type while keeping all others from a base component?',
      options: ['interface Props extends BaseProps { newProp: NewType }', 'type Props = Omit<ComponentProps<typeof Base>, "propToOverride"> & { propToOverride: NewType }', 'You cannot override props in TypeScript', 'extends does not allow overriding'],
      answer: 1,
      explanation: 'Omit removes the specific prop from the base type, then intersect with the new version: Omit<BaseProps, "onChange"> & { onChange: (value: string) => void }. Simple extends would cause a type conflict since the same key exists with a different type.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use interface or type for component props?',
      a: 'Both work. Interfaces are extendable with extends and give better error messages for object shapes. Types are needed for unions, intersections, and mapped types. The practical rule: use interface for props objects, type for unions and computed types. Pick one style and be consistent within a project.',
    },
    {
      q: 'How do I type a component that accepts a render prop?',
      a: 'Type the render prop as a function returning ReactNode: renderItem: (item: T, index: number) => React.ReactNode. For children as a render prop: children: (value: SomeType) => React.ReactNode. The return type should always be ReactNode, not JSX.Element — it allows returning null and arrays.',
    },
    {
      q: 'What is the difference between React.ReactElement and JSX.Element?',
      a: 'JSX.Element is an alias for React.ReactElement<any, any> with any type params. They are effectively the same for most uses. React.ReactElement<P, T> is more precise — it carries the prop type P and component type T. Prefer React.ReactNode for children; use React.ReactElement when you need to clone the element or access its props type.',
    },
    {
      q: 'How do I type a polymorphic component (one that can render as different elements)?',
      a: 'Use an "as" prop with a generic: type PolymorphicProps<C extends React.ElementType> = { as?: C } & React.ComponentPropsWithoutRef<C>. This is the pattern used by Radix UI and MUI — <Box as="a" href="/..."> renders an anchor with full anchor-prop type safety.',
    },
    {
      q: 'How do I share state type between a component and its context?',
      a: 'Export the state interface from the component file and import it in the context file, or define the types in a shared types.ts file. For small features, a single file with the Context, types, hook, and provider is cleanest. For larger features, split into context.ts (types, context, hook) and provider.tsx (the Provider component with logic).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Plain function signatures with explicit prop interfaces — discriminated unions, React event generics, and forwardRef<RefType, PropsType>.',
    mustKnow: [
      'Prefer (props: Props) => JSX.Element over React.FC — no implicit children, explicit types',
      'forwardRef<RefType, PropsType> — RefType first. useRef<HTMLInputElement>(null) for DOM refs',
      'React.ChangeEvent<HTMLInputElement>, MouseEvent<HTMLButtonElement> — generic is the element, not the event',
      'Generic components in TSX: trailing comma <T,> or function declaration to avoid JSX ambiguity',
      'ComponentPropsWithoutRef<"button"> as base for wrapper components; Omit to override one prop',
      'Discriminated unions for variant props: { kind: "error"; code: number } | { kind: "info" }',
    ],
    interviewFocus: [
      'Why avoid React.FC? What did it add implicitly in older versions?',
      'How do you type a forwardRef component — and what order are the type params?',
      'What is the difference between ReactNode and ReactElement, and when do you use each?',
      'How do you build a generic component in TSX without triggering the JSX parser?',
    ],
  };
}
