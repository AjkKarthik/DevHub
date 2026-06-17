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
  selector: 'app-react-context',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './context.html',
  styleUrl: './context.scss',
})
export class ReactContext {
  quickRef: QuickRefItem[] = [
    { name: 'createContext(defaultValue)',      type: 'function', desc: 'Create a context object. Default used only outside any Provider.' },
    { name: '<Context.Provider value={...}>',   type: 'syntax',   desc: 'Wrap subtree. All useContext consumers re-render when value changes.' },
    { name: 'useContext(MyContext)',             type: 'hook',     desc: 'Subscribe to the nearest Provider above. Re-renders on value change.' },
    { name: 'useMemo(() => ({...}), [deps])',   type: 'hook',     desc: 'Stabilize context value object — prevents all consumers re-rendering on every parent render.' },
    { name: 'Context.displayName = "..."',      type: 'accessor', desc: 'Label shown in React DevTools for this context.' },
    { name: 'useReducer + Context',             type: 'syntax',   desc: 'Dispatch stays stable; split StateContext + DispatchContext for optimal re-renders.' },
    { name: 'context splitting',                type: 'syntax',   desc: 'Separate fast-changing state from slow-changing — consumers only re-render for their own context.' },
    { name: 'lazy context initialization',      type: 'syntax',   desc: 'useState(() => computeDefault()) inside Provider — expensive initial state computed once.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Context solves',
      points: [
        '<strong>Prop drilling</strong> is passing a value through many intermediate components that don\'t use it themselves, just to reach a deeply nested consumer. Context eliminates the intermediaries.',
        '<strong>Context is NOT a state manager.</strong> It is a mechanism to share state that already lives somewhere (in useState or useReducer). The state lives in a component; context is the distribution channel.',
        '<strong>Good Context candidates:</strong> theme, locale, authenticated user, feature flags, and any infrequently-changing global value. Poor candidates: frequently-updating search input, live cursor position, animation state.',
        '<strong>Context vs prop drilling vs Zustand:</strong> prefer props for 1–2 levels; use context for stable shared values; use Zustand/Jotai when many components need the same frequently-updating state.',
      ],
    },
    {
      heading: 'createContext + Provider',
      points: [
        '<strong>createContext(defaultValue)</strong> creates the context object. The <code>defaultValue</code> is used ONLY when a component consumes the context outside any matching Provider — not as the initial state of the Provider.',
        '<strong>Providers can nest.</strong> A nested Provider shadows the outer one for its subtree. This enables per-page or per-section overrides of a global context (e.g. theme override for a dialog).',
        '<strong>Provider goes as high as needed, as low as possible.</strong> Don\'t put every context at the app root — wrap only the subtree that needs it to keep the component tree clean and limit re-render scope.',
        '<strong>Context.displayName</strong> sets the label in React DevTools, making debugging easier when you have multiple contexts: <code>ThemeContext.displayName = "ThemeContext"</code>.',
      ],
    },
    {
      heading: 'Re-render behaviour and memoization',
      points: [
        '<strong>Every useContext consumer re-renders when the context value changes</strong> — React uses Object.is comparison. If you pass an object literal as the value, it creates a new reference on every render, causing all consumers to re-render unnecessarily.',
        '<strong>Wrap object values in useMemo</strong> with the actual changing values as deps. This gives consumers a stable reference unless something truly changed.',
        '<strong>Context splitting</strong> is the primary optimization: separate contexts for different update frequencies. A <code>UserContext</code> and a <code>UserDispatchContext</code> mean action consumers don\'t re-render when user state changes.',
        '<strong>React.memo does NOT prevent context-triggered re-renders.</strong> If a memoized component calls useContext, it re-renders when the context changes — memo only skips prop-change re-renders.',
      ],
    },
    {
      heading: 'useReducer + Context pattern',
      points: [
        '<strong>Combine useReducer with Context</strong> for scalable global state: the reducer handles logic, the Provider distributes state + dispatch, custom hooks expose a clean API.',
        '<strong>Split StateContext and DispatchContext.</strong> dispatch is stable (same reference across renders), so DispatchContext consumers (buttons, forms) never re-render due to state changes.',
        '<strong>Custom hook pattern:</strong> export <code>useMyState()</code> and <code>useMyDispatch()</code> hooks from the context module. This hides the raw useContext calls and adds error-boundary checks (<code>if (!ctx) throw new Error()</code>).',
        '<strong>This pattern scales well to medium-complexity apps</strong> without any extra library. For very large apps or when you need DevTools time-travel, Redux Toolkit adds those capabilities on top of the same mental model.',
      ],
    },
    {
      heading: 'Context performance patterns',
      points: [
        '<strong>Selector pattern with useMemo:</strong> if a consumer needs only a slice of context, memoize the derived value — <code>const name = useMemo(() =&gt; ctx.user.name, [ctx.user.name])</code>.',
        '<strong>Stabilize handlers with useCallback.</strong> If you pass functions in context (e.g. <code>{ openModal, closeModal }</code>), wrap them in useCallback so their references don\'t change when unrelated state updates.',
        '<strong>Context per concern:</strong> one context per logical concern (Auth, Theme, Notifications) keeps providers focused and avoids one mega-context that triggers every consumer on any change.',
        '<strong>When to switch to Zustand:</strong> if you find yourself creating more than 3–4 contexts, splitting state/dispatch for every one, and adding useMemo everywhere — Zustand\'s selective subscription model is simpler and more performant for that use case.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Theme context',
      language: 'typescript',
      code: `import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeCtx { theme: Theme; toggle: () => void; }

const ThemeContext = createContext<ThemeCtx | null>(null);
ThemeContext.displayName = 'ThemeContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Memoize — consumers re-render only when theme actually changes
  const value = useMemo<ThemeCtx>(() => ({
    theme,
    toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

// Usage
function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header data-theme={theme}>
      <button onClick={toggle}>Switch to {theme === 'light' ? 'dark' : 'light'}</button>
    </header>
  );
}`,
    },
    {
      label: 'useReducer + Context',
      language: 'typescript',
      code: `import { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';

interface Todo { id: number; text: string; done: boolean; }
interface State { todos: Todo[]; filter: 'all' | 'active' | 'done'; }
type Action =
  | { type: 'ADD';    text: string }
  | { type: 'TOGGLE'; id: number }
  | { type: 'REMOVE'; id: number }
  | { type: 'FILTER'; filter: State['filter'] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':    return { ...state, todos: [...state.todos, { id: Date.now(), text: action.text, done: false }] };
    case 'TOGGLE': return { ...state, todos: state.todos.map(t => t.id === action.id ? { ...t, done: !t.done } : t) };
    case 'REMOVE': return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
    case 'FILTER': return { ...state, filter: action.filter };
    default:       return state;
  }
}

// Split state + dispatch contexts — dispatch consumers don't re-render on state changes
const StateCtx    = createContext<State | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action> | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { todos: [], filter: 'all' });
  // Memoize state context value — avoids extra renders from object identity
  const stateValue = useMemo(() => state, [state]);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={stateValue}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}

export const useTodoState    = () => { const ctx = useContext(StateCtx);    if (!ctx) throw new Error(); return ctx; };
export const useTodoDispatch = () => { const ctx = useContext(DispatchCtx); if (!ctx) throw new Error(); return ctx; };

// Consumers
function AddTodo() {
  const dispatch = useTodoDispatch();                   // only re-renders if dispatch changes (it doesn't)
  const [text, setText] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'ADD', text }); setText(''); }}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button>Add</button>
    </form>
  );
}

function TodoList() {
  const { todos, filter } = useTodoState();             // re-renders when state changes
  const dispatch = useTodoDispatch();
  const visible = todos.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  return (
    <ul>{visible.map(t => (
      <li key={t.id}>
        <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'TOGGLE', id: t.id })} />
        {t.text}
        <button onClick={() => dispatch({ type: 'REMOVE', id: t.id })}>×</button>
      </li>
    ))}</ul>
  );
}`,
    },
    {
      label: 'Context splitting for performance',
      language: 'typescript',
      code: `import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface User { id: number; name: string; email: string; }

// Separate contexts for data vs actions — prevents unnecessary re-renders
const UserDataCtx    = createContext<User | null>(null);
const UserActionsCtx = createContext<{ logout: () => void; updateName: (n: string) => void } | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({ id: 1, name: 'Alice', email: 'alice@example.com' });

  // Stable callbacks — don't change when user data changes
  const actions = useMemo(() => ({
    logout:     () => setUser(null),
    updateName: (name: string) => setUser(u => u ? { ...u, name } : null),
  }), []); // empty deps — setUser is stable

  return (
    <UserActionsCtx.Provider value={actions}>
      <UserDataCtx.Provider value={user}>{children}</UserDataCtx.Provider>
    </UserActionsCtx.Provider>
  );
}

export const useUser        = () => useContext(UserDataCtx);
export const useUserActions = () => { const ctx = useContext(UserActionsCtx); if (!ctx) throw new Error(); return ctx; };

// This component only re-renders when user data changes
function UserAvatar() {
  const user = useUser();
  return <span>{user?.name[0]}</span>;
}

// This component NEVER re-renders due to user data changes — only accesses actions
function LogoutButton() {
  const { logout } = useUserActions();
  return <button onClick={logout}>Log out</button>;
}`,
    },
    {
      label: 'Nested providers',
      language: 'typescript',
      code: `import { createContext, useContext } from 'react';

const LevelContext = createContext(0);

function Section({ children }: { children: React.ReactNode }) {
  const level = useContext(LevelContext);
  return (
    // Inner Section automatically increments the level
    <LevelContext.Provider value={level + 1}>
      <section style={{ paddingLeft: level * 16 }}>{children}</section>
    </LevelContext.Provider>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  const level = useContext(LevelContext);
  // Dynamically picks h1–h6 based on nesting depth
  const Tag = \`h\${Math.min(level + 1, 6)}\` as keyof JSX.IntrinsicElements;
  return <Tag>{children}</Tag>;
}

// Usage — no prop drilling, headings auto-size
function Page() {
  return (
    <Section>
      <Heading>Page title (h1)</Heading>
      <Section>
        <Heading>Section title (h2)</Heading>
        <Section>
          <Heading>Sub-section (h3)</Heading>
        </Section>
      </Section>
    </Section>
  );
}`,
    },
    {
      label: 'Auth context pattern',
      language: 'typescript',
      code: `import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface AuthCtx {
  user: { id: string; name: string } | null;
  loading: boolean;
  login:  (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);
AuthContext.displayName = 'AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthCtx['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMe(token)
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    loading,
    login: async (token: string) => {
      localStorage.setItem('token', token);
      const me = await fetchMe(token);
      setUser(me);
    },
    logout: () => {
      localStorage.removeItem('token');
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Route guard component
function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user)   return <p>Please log in</p>;
  return <>{children}</>;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Object literal as context value (causes all consumers to re-render)',
      wrong: `function Provider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
  // New object on every render → all consumers re-render on every parent render`,
      right: `function Provider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}`,
      explanation: 'An object literal {} creates a new reference every render. useMemo with [user] as dep means the context value only changes when user changes — not on every parent re-render.',
    },
    {
      title: 'Using context default value as initial state',
      wrong: `// defaultValue passed to createContext is NOT the Provider's initial state
const CountContext = createContext(0);   // user thinks this is the starting count

function Counter() {
  const count = useContext(CountContext);  // receives 0 only outside a Provider
  return <p>{count}</p>;
}`,
      right: `const CountContext = createContext<number | null>(null);  // undefined outside Provider

function CountProvider({ children }) {
  const [count, setCount] = useState(0);   // real initial state lives here
  return <CountContext.Provider value={count}>{children}</CountContext.Provider>;
}`,
      explanation: 'createContext(defaultValue) only uses the default when there is no matching Provider above in the tree. Initial state lives in useState inside the Provider, not in createContext.',
    },
    {
      title: 'Putting everything in one mega-context',
      wrong: `const AppContext = createContext({
  user: null, theme: 'light', cart: [], notifications: [],
  // All app state in one context → every consumer re-renders on any change
});`,
      right: `// Separate contexts by concern and update frequency
const AuthContext   = createContext(null);   // changes infrequently
const ThemeContext  = createContext(null);   // changes on toggle
const CartContext   = createContext(null);   // changes on add/remove`,
      explanation: 'A single context causes all consumers to re-render whenever any part of the context changes. Splitting by concern (auth, theme, cart) means consumers only re-render when their relevant data changes.',
    },
    {
      title: 'Consuming context without checking null',
      wrong: `const UserContext = createContext<User | null>(null);

function Profile() {
  const user = useContext(UserContext);
  return <h1>{user.name}</h1>;  // TypeError if rendered outside Provider
}`,
      right: `export function useUser(): User {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}

function Profile() {
  const user = useUser();   // throws clearly if Provider is missing
  return <h1>{user.name}</h1>;
}`,
      explanation: 'Wrap useContext in a custom hook that throws a descriptive error if the context is null. This surfaces missing Providers as clear errors in development instead of silent null dereferences in production.',
    },
    {
      title: 'React.memo not preventing context re-renders',
      wrong: `// Developers expect memo to block context-triggered re-renders
const ExpensiveChild = memo(function ExpensiveChild() {
  const { user } = useContext(UserContext);  // still re-renders when user changes
  return <p>{user.name}</p>;
});`,
      right: `// Split what you subscribe to, or memoize the derived value
function ExpensiveChild() {
  const { user } = useContext(UserContext);
  const name = useMemo(() => user.name, [user.name]);   // only recalculates on name change
  return <p>{name}</p>;
}`,
      explanation: 'React.memo only prevents re-renders caused by prop changes. If a component calls useContext, it re-renders when the context changes regardless of memo. Split context or memoize derived values.',
    },
    {
      title: 'Not collocating context with its Provider',
      wrong: `// context.ts — context object
export const ThemeContext = createContext(null);

// app.tsx — Provider in app root
<ThemeContext.Provider value={...}>

// button.tsx — consumer imports raw context
import { ThemeContext } from '../context';
const theme = useContext(ThemeContext);  // no null guard, no type safety`,
      right: `// theme-context.tsx — create, provide, and expose hook in one file
export const ThemeContext = createContext<ThemeCtx | null>(null);
export function ThemeProvider({ children }) { ... }
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}`,
      explanation: 'Collocate createContext, Provider, and the custom hook in one file. Consumers import the hook, not the raw context. This enforces the null guard and makes the API self-documenting.',
    },
  ];

  challenge: Challenge = {
    title: 'Notification System with Context',
    language: 'typescript',
    description: `Build a toast notification system using Context + useReducer:

State: \`{ notifications: Notification[] }\`
Notification: \`{ id: string; message: string; type: 'success' | 'error' | 'info'; }\`

Actions: ADD_NOTIFICATION, REMOVE_NOTIFICATION, CLEAR_ALL

Requirements:
1. Create NotificationContext with split State + Dispatch contexts
2. Export useNotifications() and useNotificationDispatch() hooks
3. Export helper functions: notify(message, type) that dispatches ADD_NOTIFICATION with a generated id
4. Render a floating toast container that shows active notifications
5. Each toast auto-dismisses after 3 seconds (useEffect with setTimeout inside the toast component)
6. Show "✓ Success" for success, "✕ Error" for error, "ℹ Info" for info types`,
    hints: [
      'Generate the ID with a counter useRef or pass it in the action: { type: "ADD_NOTIFICATION", notification: { id: crypto.randomUUID(), message, type } }',
      'The toast auto-dismiss effect: useEffect(() => { const id = setTimeout(() => dispatch({type:"REMOVE", id}), 3000); return () => clearTimeout(id); }, [id])',
      'Position the container with position: fixed; bottom: 1rem; right: 1rem; z-index: 9999',
      'Split DispatchContext from StateContext so action-only components (buttons that call notify) never re-render when notifications change',
    ],
    starterCode: `import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface Notification { id: string; message: string; type: 'success' | 'error' | 'info'; }
interface State { notifications: Notification[]; }
type Action =
  | { type: 'ADD';    notification: Notification }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

// TODO: reducer, contexts, Provider, hooks, helpers
// TODO: Toast component that auto-dismisses
// TODO: ToastContainer that renders all active toasts`,
    solution: `import { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';

interface Notification { id: string; message: string; type: 'success' | 'error' | 'info'; }
interface State { notifications: Notification[]; }
type Action = { type: 'ADD'; notification: Notification } | { type: 'REMOVE'; id: string } | { type: 'CLEAR' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':    return { notifications: [...state.notifications, action.notification] };
    case 'REMOVE': return { notifications: state.notifications.filter(n => n.id !== action.id) };
    case 'CLEAR':  return { notifications: [] };
    default:       return state;
  }
}

const StateCtx    = createContext<State | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action> | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { notifications: [] });
  const stateVal = useMemo(() => state, [state]);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={stateVal}>
        {children}
        <ToastContainer />
      </StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}

export const useNotifications        = () => { const c = useContext(StateCtx);    if (!c) throw new Error(); return c; };
export const useNotificationDispatch = () => { const c = useContext(DispatchCtx); if (!c) throw new Error(); return c; };

export function notify(dispatch: React.Dispatch<Action>, message: string, type: Notification['type'] = 'info') {
  dispatch({ type: 'ADD', notification: { id: crypto.randomUUID(), message, type } });
}

const ICONS = { success: '✓', error: '✕', info: 'ℹ' } as const;
const COLORS = { success: '#16a34a', error: '#dc2626', info: '#2563eb' } as const;

function Toast({ n }: { n: Notification }) {
  const dispatch = useNotificationDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: 'REMOVE', id: n.id }), 3000);
    return () => clearTimeout(id);
  }, [n.id, dispatch]);
  return (
    <div style={{ background: COLORS[n.type], color: '#fff', padding: '0.75rem 1rem', borderRadius: 8, marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>{ICONS[n.type]}</span>
      <span>{n.message}</span>
      <button onClick={() => dispatch({ type: 'REMOVE', id: n.id })} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
    </div>
  );
}

function ToastContainer() {
  const { notifications } = useNotifications();
  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999, minWidth: 300 }}>
      {notifications.map(n => <Toast key={n.id} n={n} />)}
    </div>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When is the defaultValue passed to createContext() used?',
      options: ['As the initial state of the Provider', 'Only when a component consumes the context outside any matching Provider', 'As a fallback during loading', 'Always, unless overridden by the Provider'],
      answer: 1,
      explanation: 'The defaultValue is only used when there is no Provider ancestor in the tree. It is not the Provider\'s initial state — that lives in useState/useReducer inside the Provider component.',
    },
    {
      q: 'Does React.memo prevent context-triggered re-renders?',
      options: ['Yes — memo skips all re-renders', 'No — memo only skips re-renders caused by prop changes; useContext still triggers re-renders', 'Yes, but only for primitive context values', 'Only when combined with useMemo'],
      answer: 1,
      explanation: 'React.memo compares props. If a memoized component calls useContext, it still re-renders when the context value changes, because that is independent of prop comparison.',
    },
    {
      q: 'Why should you split StateContext and DispatchContext when using useReducer + Context?',
      options: ['To avoid circular dependencies', 'dispatch is stable (same reference), so DispatchContext consumers never re-render when state changes', 'React requires two contexts for useReducer', 'It improves TypeScript type safety'],
      answer: 1,
      explanation: 'dispatch from useReducer is referentially stable. Components that only need to dispatch actions (buttons, forms) can subscribe to DispatchContext and will never re-render when state changes.',
    },
    {
      q: 'What does useMemo(() => ({ user, setUser }), [user]) achieve on a context value?',
      options: ['Prevents all re-renders', 'Gives the context value a stable reference that only changes when user changes', 'Caches the context value in localStorage', 'Makes setUser synchronous'],
      answer: 1,
      explanation: 'Without useMemo, { user, setUser } creates a new object on every render. useMemo gives it a stable reference — consumers only re-render when user actually changes, not on every parent render.',
    },
    {
      q: 'Where should the initial state of a context live?',
      options: ['In the defaultValue parameter of createContext()', 'In useState or useReducer inside the Provider component', 'In a global variable', 'In the consuming component'],
      answer: 1,
      explanation: 'Initial state belongs in useState or useReducer inside the Provider. createContext\'s defaultValue only activates outside a Provider and is not the Provider\'s starting state.',
    },
    {
      q: 'Which pattern collocates context, Provider, and a safe consumer hook in one file?',
      options: ['Export the raw context from one file, the Provider from another', 'Create context, export Provider component, export useMyContext() custom hook — all from the same file', 'Store context in a global singleton', 'Use React.createRef() instead of context'],
      answer: 1,
      explanation: 'Collocating createContext, Provider, and the custom hook in one file (e.g. theme-context.tsx) enforces the null guard, hides the raw context from consumers, and makes the module self-documenting.',
    },
    {
      q: 'If three components share a UserContext that contains { user, cart, notifications }, what happens when notifications changes?',
      options: ['Only components that read notifications re-render', 'All three components re-render', 'Only the Provider re-renders', 'Nothing — context changes are batched'],
      answer: 1,
      explanation: 'All useContext consumers re-render when the context value changes (Object.is on the value). If the value is one object, any field change causes ALL consumers to re-render. Solution: split into separate contexts.',
    },
    {
      q: 'What is the recommended pattern for exposing context to consumers?',
      options: ['Export the raw context object and let consumers call useContext directly', 'Export a custom hook (e.g. useTheme()) that wraps useContext and throws if called outside the Provider', 'Use a global singleton variable', 'Pass the context as a prop to every component'],
      answer: 1,
      explanation: 'A custom hook (useTheme, useAuth) wraps useContext, checks for null, and throws a clear error if used outside the Provider. Consumers import the hook instead of the raw context, making the API self-documenting.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I put all my app state in Context?',
      a: 'No. Context is best for stable, infrequently-changing values: theme, locale, auth user, feature flags. For frequently-changing state (search queries, live data, animation), use Zustand or Jotai — their selective subscriptions are far more efficient than blanket context re-renders.',
    },
    {
      q: 'How many context Providers is too many?',
      a: 'There is no hard limit, but if you need 5+ context providers at the app root, consider Zustand (one store, no providers needed). For 2–4 providers, the nesting is manageable. You can combine multiple providers into a single AppProviders component to clean up the tree.',
    },
    {
      q: 'Can I use Context for server state (API data)?',
      a: 'Technically yes, but it is not the right tool. TanStack Query and SWR are designed for server state — they handle caching, background refetching, stale-while-revalidate, loading/error states, and request deduplication. Context has none of that. Use Context for client state; use TanStack Query for server state.',
    },
    {
      q: 'How do I read context in an event handler outside the component tree?',
      a: 'You cannot — hooks (including useContext) can only be called inside React components or custom hooks. The workaround is to pass context values as arguments into the handler: expose an action function in the context (e.g. { openModal }) and call it from anywhere within the component tree.',
    },
    {
      q: 'Is useContext the same as Redux?',
      a: 'No. Redux has a single global store, DevTools with time-travel, middleware, and strict action/reducer conventions. Context is just a React mechanism to avoid prop-drilling. useReducer + Context replicates some of the pattern without the tooling. For most apps, start with Context; graduate to Redux Toolkit when you need the DevTools or middleware.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Context distributes existing state without prop-drilling — not a state manager, but an efficient distribution channel when used carefully.',
    mustKnow: [
      'createContext(defaultValue) — default only activates outside a Provider; initial state lives in useState/useReducer inside the Provider',
      'All consumers re-render when context value changes (Object.is) — memoize object values with useMemo',
      'Split StateContext + DispatchContext: dispatch is stable, so dispatch-only consumers never re-render on state changes',
      'React.memo does NOT block context-triggered re-renders — only prop-change re-renders',
      'Collocate createContext + Provider + custom hook in one file; throw on null for clear missing-Provider errors',
      'Use Context for stable global values; use Zustand/Jotai for frequently-updating or complex cross-cutting state',
    ],
    interviewFocus: [
      'Why does useMemo on a context value prevent unnecessary re-renders?',
      'Difference between Context and state management libraries like Zustand or Redux',
      'How does splitting StateContext and DispatchContext improve performance?',
      'When would you choose Zustand over Context + useReducer?',
    ],
  };
}
