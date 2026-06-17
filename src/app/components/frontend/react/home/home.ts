import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Hooks': 'hooks', 'State Management': 'state',
  'Routing': 'routing', 'Performance': 'performance', 'Patterns': 'patterns',
  'Ecosystem': 'ecosystem', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Hooks', 'State Management', 'Routing', 'Performance', 'Patterns', 'Ecosystem', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'React Fundamentals',         route: '/react/basics', badge: 'Foundations', available: true,
    description: 'JSX, function components, props, rendering, keys, fragments, and React\'s virtual DOM and reconciliation algorithm.',
    keyPoints: ['JSX is syntactic sugar over React.createElement() calls', 'Virtual DOM: diff between renders; React applies minimal DOM patches', 'One-way data flow — parent → child via props, child → parent via callbacks'] },
  { title: 'TypeScript & React',          route: '/react/typescript', badge: 'Foundations', available: false,
    description: 'Typing props, events, refs, generic components, and discriminated union patterns for variant props.',
    keyPoints: ['Prefer (props: Props) => JSX.Element over React.FC — no implicit children', 'Event types: React.ChangeEvent<HTMLInputElement>, React.FormEvent<HTMLFormElement>', 'Generic components: function List<T>(props: { items: T[] }) — same syntax as TypeScript generics'] },
  { title: 'Forms & Validation',          route: '/react/forms', badge: 'Foundations', available: false,
    description: 'Controlled vs uncontrolled inputs, HTML5 validation, and getting started with React Hook Form + Zod.',
    keyPoints: ['Controlled: React owns the value via useState — enables real-time validation', 'Uncontrolled: DOM owns the value via useRef — simpler but less flexible', 'Zod + React Hook Form: schema as single source of truth for validation'] },
  { title: 'Core Hooks',                  route: '/react/hooks-core', badge: 'Hooks', available: true,
    description: 'useState, useEffect, useRef, useContext — the hooks you use in every component.',
    keyPoints: ['useState(fn): lazy initializer runs once — use for expensive initial state', 'useEffect cleanup: return a function to cancel subscriptions, timers, and abort controllers', 'useRef: persists across renders without triggering a re-render — DOM refs and stale closure escape'] },
  { title: 'Advanced Hooks',              route: '/react/hooks-advanced', badge: 'Hooks', available: false,
    description: 'useReducer, useMemo, useCallback, useTransition, useDeferredValue, useId, and building custom hooks.',
    keyPoints: ['useReducer: action-based updates — prefer when state has multiple sub-values', 'useTransition: mark state as low-priority to keep UI responsive during heavy renders', 'Custom hooks: extract stateful logic, not markup — start with "use", return data + handlers'] },
  { title: 'Context API',                 route: '/react/context', badge: 'State Management', available: false,
    description: 'createContext, useContext, context splitting for performance, and when to reach for Zustand instead.',
    keyPoints: ['All context consumers re-render when value changes — split by update frequency', 'Context is not a state manager — combine with useReducer for complex global state', 'Zustand: simpler API, no provider, selective subscription — preferred for cross-cutting state'] },
  { title: 'State Management',            route: '/react/state-management', badge: 'State Management', available: false,
    description: 'useState vs useReducer vs Zustand vs Jotai vs Redux Toolkit — when to pick each, derived state.',
    keyPoints: ['useState: local component state — first choice, lift when siblings need it', 'Zustand: global state, no provider, subscribe to slices — minimal boilerplate', 'Redux Toolkit: createSlice + RTK Query — justified at large scale with complex async flows'] },
  { title: 'React Router v6/v7',           route: '/react/router', badge: 'Routing', available: false,
    description: 'createBrowserRouter, nested routes, loader and action functions, useNavigate, useParams, and Outlet.',
    keyPoints: ['Nested routes: <Outlet /> renders the child route component', 'loader: fetch data before rendering the route — replaces useEffect+fetch', 'useNavigate(-1) for back; navigate() for imperative navigation with state'] },
  { title: 'TanStack Query',              route: '/react/tanstack-query', badge: 'Ecosystem', available: false,
    description: 'Server-state management — useQuery, useMutation, stale-while-revalidate, cache invalidation, and optimistic updates.',
    keyPoints: ['useQuery: automatic caching, background refetch, stale-while-revalidate', 'useMutation + onSuccess → queryClient.invalidateQueries: keep cache fresh after writes', 'Optimistic updates: update UI instantly, rollback on error — useMutation onMutate + onError'] },
  { title: 'React Performance',           route: '/react/performance', badge: 'Performance', available: false,
    description: 'React.memo, useMemo, useCallback, Profiler, concurrent features, and virtualization with react-window.',
    keyPoints: ['Profile first — React DevTools Profiler shows which components re-render and why', 'React.memo: skip re-render if props are shallowly equal — objects must be stable references', 'Virtualization: react-window renders only visible rows — essential for 1000+ item lists'] },
  { title: 'React Patterns',              route: '/react/patterns', badge: 'Patterns', available: false,
    description: 'Compound components, render props, HOCs, and why custom hooks are the modern replacement.',
    keyPoints: ['Compound components: share implicit state via Context — <Select>, <Tabs>', 'Custom hook is the modern render prop — returns data and handlers, not JSX', 'HOC: withAuth(Comp) — still common in older codebases; prefer hooks in new code'] },
  { title: 'Testing React',               route: '/react/testing', badge: 'Ecosystem', available: false,
    description: 'React Testing Library, Vitest, userEvent, MSW for API mocking, and async testing patterns.',
    keyPoints: ['Test behaviour, not implementation — getByRole, not getByClassName', 'userEvent.click() simulates real user events including focus and keyboard', 'MSW: intercept fetch/axios in tests without mocking modules — realistic tests'] },
  { title: 'Next.js App Router',          route: '/react/nextjs', badge: 'Ecosystem', available: false,
    description: 'Server Components, Client Components, Server Actions, layouts, Suspense streaming, and caching.',
    keyPoints: ['"use client" opts into Client Component — everything else is a Server Component', 'Server Actions: async functions that run on the server, called from forms or buttons', 'layout.tsx persists across navigations; loading.tsx is automatic Suspense boundary'] },
  { title: 'React Native',                route: '/react/native', badge: 'Ecosystem', available: false,
    description: 'View/Text/ScrollView, StyleSheet, Expo, React Navigation, and the New Architecture (Fabric + JSI).',
    keyPoints: ['No HTML — View maps to UIView/android.view, Text to UILabel/TextView', 'StyleSheet.create: inline styles validated at dev time; flexbox by default', 'New Architecture: Fabric renderer + JSI bridge = synchronous JS↔native calls'] },
  { title: 'React Hook Form',             route: '/react/hook-form', badge: 'Ecosystem', available: false,
    description: 'Uncontrolled form management — register, handleSubmit, Controller, zodResolver, and field arrays.',
    keyPoints: ['register(): binds inputs without controlled state — minimal re-renders', 'Controller: wraps controlled components (Material UI, Radix) in RHF', 'zodResolver: schema-driven validation — single source of truth for form + API shapes'] },
  { title: 'Animations (Framer Motion)',  route: '/react/animations', badge: 'Ecosystem', available: false,
    description: 'motion.div, animate/variants, layout animations, AnimatePresence for exit animations, and useSpring.',
    keyPoints: ['motion.div animate={{ x: 100 }}: declarative imperative animation', 'variants: name reusable states — parent orchestrates children via "staggerChildren"', 'AnimatePresence: enables exit animations for components removed from the DOM'] },
  { title: 'Security in React',           route: '/react/security', badge: 'Patterns', available: false,
    description: 'XSS prevention, dangerouslySetInnerHTML, CSP headers, authentication patterns, and CSRF in Next.js.',
    keyPoints: ['React escapes JSX strings by default — dangerouslySetInnerHTML bypasses this', 'DOMPurify: sanitize untrusted HTML before dangerouslySetInnerHTML', 'CSRF in Next.js: Server Actions use CSRF tokens automatically; REST APIs need explicit headers'] },
  { title: 'React Cheat Sheet',           route: '/react/cheatsheet', badge: 'Reference', available: false,
    description: 'All hooks, component patterns, event types, and routing API quick-reference.',
    keyPoints: ['Hooks: useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer', 'Component design: composition > inheritance; controlled > uncontrolled', 'Key patterns: compound, render prop, HOC, custom hook'] },
  { title: 'React Interview Prep',        route: '/react/interview-prep', badge: 'Reference', available: false,
    description: '40+ React interview questions — hooks, rendering, state, performance, and React 19 features.',
    keyPoints: ['Explain the virtual DOM, reconciliation, and the Fiber architecture', 'When would you use useReducer over useState?', 'How does React.memo differ from useMemo and useCallback?'] },
];

@Component({
  selector: 'app-react-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class ReactHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
