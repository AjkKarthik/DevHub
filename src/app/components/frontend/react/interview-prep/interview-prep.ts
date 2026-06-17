import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Question {
  id: number;
  q: string;
  a: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

const QUESTIONS: Question[] = [
  // ── Fundamentals ──────────────────────────────────────────────────────────
  { id: 1,  difficulty: 'beginner',     topic: 'Fundamentals',
    q: 'What is the virtual DOM and how does React use it?',
    a: 'The virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React creates a new virtual DOM tree and diffs it against the previous one (reconciliation). Only the minimal set of real DOM changes is applied. This is faster than directly mutating the DOM on every state change because DOM operations are expensive — batching and minimising them improves performance.' },
  { id: 2,  difficulty: 'beginner',     topic: 'Fundamentals',
    q: 'What is JSX and how does it compile?',
    a: 'JSX is syntactic sugar that looks like HTML inside JavaScript. Babel (or the TS compiler) transforms it into React.createElement() calls. <div className="x">{text}</div> becomes React.createElement("div", { className: "x" }, text). Since React 17, with the new JSX transform, you no longer need to import React for JSX — the runtime is injected automatically.' },
  { id: 3,  difficulty: 'beginner',     topic: 'Fundamentals',
    q: 'Explain one-way data flow in React.',
    a: 'Data flows from parent to child via props — never the other way. A child cannot directly modify its parent\'s state. To communicate upward, the parent passes a callback function as a prop; the child calls it. This unidirectional flow makes state changes traceable and predictable. To share state between siblings, lift it to their lowest common ancestor.' },
  { id: 4,  difficulty: 'beginner',     topic: 'Fundamentals',
    q: 'What are keys in React lists and why do they matter?',
    a: 'Keys are stable unique identifiers that help React match elements between renders during reconciliation. Without keys, React falls back to index-based matching — removing an item from the middle causes every subsequent item to re-render (and potentially receive wrong state). Keys must be stable (not random) and unique among siblings. Never use array index as a key for lists that can be reordered or filtered.' },
  { id: 5,  difficulty: 'beginner',     topic: 'Fundamentals',
    q: 'What is the difference between controlled and uncontrolled components?',
    a: 'Controlled: React state owns the input value via value + onChange — every keystroke updates state and React re-renders. Full control over formatting, validation, and disabling. Uncontrolled: the DOM holds the value; you read it via a ref on demand (e.g. on submit). Simpler but less flexible. React Hook Form uses uncontrolled inputs by default for performance.' },

  // ── Hooks ─────────────────────────────────────────────────────────────────
  { id: 6,  difficulty: 'beginner',     topic: 'Hooks',
    q: 'What rules must hooks follow?',
    a: 'Two rules enforced by the ESLint plugin: (1) Only call hooks at the top level — never inside loops, conditions, or nested functions. (2) Only call hooks from React function components or custom hooks — not regular JS functions. These rules ensure hook call order is consistent between renders, which is how React links state to the correct hook instance.' },
  { id: 7,  difficulty: 'beginner',     topic: 'Hooks',
    q: 'When does useEffect run? What does the cleanup function do?',
    a: 'useEffect runs after the browser has painted — after every render where the deps changed. With [], it runs once after the first render. The cleanup function (optional return value) runs before the next effect fires AND before the component unmounts. Use it to cancel subscriptions, abort fetches, clear timers, and remove event listeners — prevents memory leaks and stale updates.' },
  { id: 8,  difficulty: 'intermediate', topic: 'Hooks',
    q: 'When would you use useReducer over useState?',
    a: 'Prefer useReducer when: (1) state has multiple related sub-values that update together, (2) the next state depends on the previous state in complex ways, (3) you want to colocate state logic and move it out of the component (the reducer is pure and testable in isolation), or (4) you have many setState calls that should be a single atomic transition. useState is fine for simple independent values.' },
  { id: 9,  difficulty: 'intermediate', topic: 'Hooks',
    q: 'What is the difference between useMemo and useCallback?',
    a: 'useMemo memoises a computed VALUE — it returns the result of calling the function. useCallback memoises a FUNCTION REFERENCE — it returns the function itself (which is the same reference across renders as long as deps do not change). useCallback(fn, deps) is syntactic sugar for useMemo(() => fn, deps). Both are needed to prevent React.memo children from re-rendering unnecessarily.' },
  { id: 10, difficulty: 'intermediate', topic: 'Hooks',
    q: 'Explain the stale closure problem in useEffect and how to solve it.',
    a: 'When a useEffect callback captures a variable (e.g. count) in its closure, it captures the value at the time the effect was created. If count changes but deps does not list it, the effect still sees the old value — a stale closure. Solutions: (1) add the variable to deps so the effect re-runs when it changes, (2) use the functional update form of setState (setCount(c => c + 1)) to read the latest value, or (3) use useRef to store a mutable reference to the latest value.' },
  { id: 11, difficulty: 'advanced',     topic: 'Hooks',
    q: 'What are useTransition and useDeferredValue and when do you use each?',
    a: 'Both are concurrent features that keep the UI responsive during heavy re-renders. useTransition gives you a startTransition function to wrap a state update — React treats it as lower priority and keeps the current UI interactive while rendering the transition in the background. useDeferredValue defers updating a derived value — useful when you receive a prop or piece of state and want the expensive part (like filtering a list) to trail behind. Use useTransition when you control the state setter; useDeferredValue when you receive a value as a prop.' },

  // ── State & Rendering ────────────────────────────────────────────────────
  { id: 12, difficulty: 'intermediate', topic: 'State & Rendering',
    q: 'What triggers a re-render in React?',
    a: 'A component re-renders when: (1) its own state changes (useState/useReducer), (2) a context it consumes changes, (3) its parent re-renders (by default, even if props did not change — unless wrapped in React.memo). Props changing is a consequence of parent re-rendering, not a separate trigger. forceUpdate() exists but is an escape hatch.' },
  { id: 13, difficulty: 'intermediate', topic: 'State & Rendering',
    q: 'How does React.memo work and when does it fail to prevent re-renders?',
    a: 'React.memo wraps a component and does a shallow equality check on props between renders. If props are shallowly equal, the render is skipped. It fails when the parent passes new object or function references on every render — {} !== {} even if the contents are the same. Fix: stabilise objects with useMemo and callbacks with useCallback. React.memo is not free — it adds a comparison cost every render, so profile before adding it.' },
  { id: 14, difficulty: 'intermediate', topic: 'State & Rendering',
    q: 'Why should state updates be treated as immutable?',
    a: 'React uses shallow reference equality to detect state changes. If you mutate an object in place (arr.push(item); setState(arr)), the reference does not change — React sees the same reference and skips the re-render. Always create new references: setState([...arr, item]) or setState({ ...obj, key: newValue }). For complex nested state, use immer (via useImmer) to write mutating syntax that produces a new immutable object.' },
  { id: 15, difficulty: 'advanced',     topic: 'State & Rendering',
    q: 'What is the React Fiber architecture?',
    a: 'Fiber is the reconciliation engine introduced in React 16. It represents each component as a "fiber" node in a linked list tree, replacing the recursive call-stack reconciler. Key benefits: (1) work can be paused, aborted, or reused — enabling concurrent rendering, (2) tasks can be prioritised (high-priority updates like clicks interrupt low-priority renders), (3) Suspense and transitions are possible because rendering is no longer a single synchronous task.' },

  // ── Context & State Management ────────────────────────────────────────────
  { id: 16, difficulty: 'intermediate', topic: 'State Management',
    q: 'What are the performance pitfalls of Context API?',
    a: 'Every component that calls useContext(Ctx) re-renders whenever the context VALUE changes — even if only a tiny part of the value changed. Solutions: (1) Split contexts by update frequency (a ThemeContext separate from UserContext), (2) memoize the value object with useMemo so it only changes when its data changes, (3) use a library like Zustand that allows selective subscriptions (only re-render when the selected slice changes), or (4) use context selectors (use-context-selector library).' },
  { id: 17, difficulty: 'intermediate', topic: 'State Management',
    q: 'When would you reach for Zustand over Context + useReducer?',
    a: 'Zustand when: you have truly global state (auth, cart, notifications) that many components need, you need selective subscriptions (a component only re-renders when its slice changes), you want to update state from outside React (in async functions, event listeners), or you need devtools/middleware. Context + useReducer is fine for subtree-scoped state or when the update pattern is simple. Zustand has less boilerplate than Redux and no Provider required.' },

  // ── Performance ───────────────────────────────────────────────────────────
  { id: 18, difficulty: 'intermediate', topic: 'Performance',
    q: 'How do you profile a React app for unnecessary re-renders?',
    a: 'React DevTools Profiler: record an interaction and inspect the flame chart — grey components did not re-render, coloured ones did and show the duration. The "Why did this render?" detail shows which prop/state/context changed. In code, use the <Profiler> component with onRender callback to measure programmatically. For production monitoring, use web-vitals (onINP, onLCP, onCLS) to track user-facing impact.' },
  { id: 19, difficulty: 'intermediate', topic: 'Performance',
    q: 'When should you use code splitting with React.lazy?',
    a: 'Code split at route boundaries (each route becomes its own chunk, loaded only when navigated to) and for large components not visible on the initial render (modals, rich editors, chart libraries). Do not split tiny components — the HTTP overhead outweighs the bundle saving. In Next.js, App Router splits automatically per page. Wrap lazy components in Suspense with a meaningful fallback so users see a spinner instead of a blank screen.' },

  // ── Patterns ──────────────────────────────────────────────────────────────
  { id: 20, difficulty: 'intermediate', topic: 'Patterns',
    q: 'What are compound components and what problem do they solve?',
    a: 'Compound components share implicit state via a Context so that sub-components can coordinate without explicit prop-passing. Example: <Select> + <Select.Option>. The parent provides state (selected value, toggle function) in context; children read it. This gives consumers a declarative, slot-based API instead of a monolithic component with many props. The alternative — prop drilling from parent to deeply nested children — creates a rigid API that is hard to extend.' },
  { id: 21, difficulty: 'intermediate', topic: 'Patterns',
    q: 'Why did custom hooks largely replace render props?',
    a: 'Render props share stateful logic by accepting a function child or render prop that returns JSX. The consumer controls what gets rendered. Custom hooks do the same thing but without the extra JSX nesting — they return data and functions directly. The consumer is free to render whatever it wants. Custom hooks compose better (you can use multiple hooks in one component without nesting), are easier to type, and remove the "wrapper hell" problem of deeply nested render prop components.' },
  { id: 22, difficulty: 'advanced',     topic: 'Patterns',
    q: 'Explain the controlled/uncontrolled component duality pattern.',
    a: 'A component supports both modes: when the value prop is undefined, it manages its own state (uncontrolled). When value is provided (even null), it is controlled by the parent. Internally: const isControlled = value !== undefined; const current = isControlled ? value : internalState. onChange always fires — in controlled mode the parent must update value; in uncontrolled mode the component updates its own state. This pattern (used by Radix, Headless UI) lets consumers choose their API.' },

  // ── Testing ───────────────────────────────────────────────────────────────
  { id: 23, difficulty: 'intermediate', topic: 'Testing',
    q: 'What is the testing philosophy behind React Testing Library?',
    a: 'RTL follows the guiding principle "the more your tests resemble the way your software is used, the more confidence they give you." This means: query by role, label, or text (not class names or IDs), interact via userEvent (not direct state manipulation), and assert on what the user sees (text, aria state). This avoids brittle tests tied to implementation details — components can be refactored freely as long as the user-facing behaviour stays the same.' },
  { id: 24, difficulty: 'intermediate', topic: 'Testing',
    q: 'What is MSW (Mock Service Worker) and why is it preferred over jest.mock for API calls?',
    a: 'MSW intercepts HTTP requests at the network level (via a Service Worker in the browser or a Node interceptor in tests). Instead of mocking the fetch/axios module, you define handlers that the real network code hits. Benefits: (1) tests use the real fetch/axios code paths — no module mocking surprises, (2) the same handlers work in browser dev mode and tests, (3) realistic responses including status codes, headers, and delays. module mocking tightly couples tests to the implementation (the specific module being used).' },

  // ── Next.js / SSR ─────────────────────────────────────────────────────────
  { id: 25, difficulty: 'intermediate', topic: 'Next.js',
    q: 'What is the difference between Server Components and Client Components in Next.js App Router?',
    a: 'Server Components (default in App Router) run only on the server — they can be async, access databases and filesystems directly, and have zero JS sent to the client. They cannot use hooks or browser APIs. Client Components ("use client") run in both server (for SSR) and browser — they support hooks, events, and browser APIs. "use client" marks a boundary: it and all its imports become client code. The key rule: you can import Client Components into Server Components, but not the reverse — pass Server Components to Client Components as children props instead.' },
  { id: 26, difficulty: 'intermediate', topic: 'Next.js',
    q: 'Explain the three Next.js data fetching caching strategies.',
    a: 'In App Router, fetch() is extended with a cache option: (1) force-cache (default in some contexts): cached indefinitely, served from CDN — use for static data that never changes. (2) { next: { revalidate: N } }: ISR — cached for N seconds, then revalidated in the background on the next request. (3) no-store: always fetches fresh, never cached — use for real-time data (stock prices, live scores).' },
  { id: 27, difficulty: 'advanced',     topic: 'Next.js',
    q: 'What are Server Actions and how do they handle CSRF?',
    a: 'Server Actions are async functions marked with "use server" that run exclusively on the server but can be called from Client Components — typically bound to form action props or event handlers. They eliminate the need for separate API route files for mutations. Next.js 14+ includes automatic CSRF protection: it validates the Origin header on Server Action requests and rejects cross-origin calls. Custom API routes do not get this protection automatically.' },

  // ── Advanced / React 19 ───────────────────────────────────────────────────
  { id: 28, difficulty: 'advanced',     topic: 'React 19',
    q: 'What are the main additions in React 19?',
    a: 'React 19 introduces: (1) the React Compiler (auto-memoisation — replaces manual useMemo/useCallback in many cases), (2) Actions — async functions used with forms for mutations with built-in pending/error state via useActionState, (3) useOptimistic() — optimistic UI updates that auto-revert on error, (4) use() — read a Promise or Context directly in render (suspends while pending), (5) server actions become stable, (6) ref as a prop — no more forwardRef needed.' },
  { id: 29, difficulty: 'advanced',     topic: 'Advanced',
    q: 'How does Suspense work for data fetching and what is "render-as-you-fetch"?',
    a: 'Suspense catches thrown Promises from child components. When a component throws a Promise (e.g. a data-fetching library), React pauses rendering that subtree and shows the nearest Suspense fallback. When the Promise resolves, React retries rendering. "Render-as-you-fetch" (vs. "fetch-then-render"): initiate the fetch before rendering, so the component and data load in parallel. Next.js streaming uses this — layout and shell render immediately while Suspense boundaries show skeletons for slower data.' },
  { id: 30, difficulty: 'advanced',     topic: 'Advanced',
    q: 'When should you use a key prop to reset component state deliberately?',
    a: 'Changing the key prop on a component tells React to unmount the old instance and mount a completely fresh one — all state is reset. Use this when: (1) you edit different entities with the same form component (key={entityId} resets form state on entity switch), (2) you want to restart an animation on data change, (3) you need to re-run all useEffects from scratch. It is cleaner than tracking a "reset" boolean in state or using an imperative reset function.' },

  // ── TypeScript with React ─────────────────────────────────────────────────
  { id: 31, difficulty: 'intermediate', topic: 'TypeScript',
    q: 'How do you type a component that accepts all native div props plus custom ones?',
    a: 'Use ComponentPropsWithoutRef<"div"> (or ComponentPropsWithRef if forwarding a ref): type Props = ComponentPropsWithoutRef<"div"> & { variant: "primary" | "secondary" }. This spreads all native div attributes (className, style, onClick, aria-*, data-*) onto your component automatically — no need to redeclare them. Use Omit<ComponentPropsWithoutRef<"div">, "color"> if you want to override a conflicting native prop.' },
  { id: 32, difficulty: 'advanced',     topic: 'TypeScript',
    q: 'What is a discriminated union prop type and when do you use it?',
    a: 'A discriminated union has a shared "discriminant" field (like variant) that TypeScript uses to narrow the type: type Props = { variant: "button"; onClick: () => void } | { variant: "link"; href: string }. When variant === "button", TypeScript knows onClick must be provided; when "link", href is required. This enforces that mutually exclusive prop combinations are valid at compile time — you cannot pass href to a "button" variant. Much better than making everything optional with ?.' },
];

const TOPICS = ['All', ...new Set(QUESTIONS.map(q => q.topic))];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'];

@Component({
  selector: 'app-react-interview-prep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class ReactInterviewPrep {
  questions = QUESTIONS;
  topics = TOPICS;
  difficulties = DIFFICULTIES;

  activeTopic      = signal('All');
  activeDifficulty = signal('All');
  expandedId       = signal<number | null>(null);

  filtered = computed(() => {
    const topic = this.activeTopic();
    const diff  = this.activeDifficulty();
    return this.questions.filter(q =>
      (topic === 'All' || q.topic === topic) &&
      (diff  === 'All' || q.difficulty === diff)
    );
  });

  toggle(id: number) {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  setTopic(t: string) { this.activeTopic.set(t); this.expandedId.set(null); }
  setDiff(d: string)  { this.activeDifficulty.set(d); this.expandedId.set(null); }

  diffLabel(d: string): string {
    return { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[d] ?? d;
  }

  diffClass(d: string): string {
    return { beginner: 'diff-beginner', intermediate: 'diff-intermediate', advanced: 'diff-advanced' }[d] ?? '';
  }

  get counts() {
    const f = this.filtered();
    return {
      total:        f.length,
      beginner:     f.filter(q => q.difficulty === 'beginner').length,
      intermediate: f.filter(q => q.difficulty === 'intermediate').length,
      advanced:     f.filter(q => q.difficulty === 'advanced').length,
    };
  }
}
