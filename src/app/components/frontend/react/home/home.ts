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
  { title: 'React Fundamentals',         route: '/react', badge: 'Foundations', available: false,
    description: 'JSX, components, props, rendering, the virtual DOM, and React\'s reconciliation algorithm.',
    keyPoints: ['JSX is transformed to React.createElement() calls', 'Virtual DOM: diffing between renders; reconciler applies minimal DOM updates', 'One-way data flow: parent → child via props; child → parent via callbacks'] },
  { title: 'Components & Props',         route: '/react', badge: 'Foundations', available: false,
    description: 'Functional components, prop types, default props, children prop, and component composition.',
    keyPoints: ['Prefer composition over inheritance — wrap, augment, don\'t extend', 'children: ReactNode for anything; children: React.ReactElement for single element', 'Controlled vs uncontrolled components: React owns the value vs DOM owns it'] },
  { title: 'useState',                   route: '/react', badge: 'Hooks', available: false,
    description: 'State management within a component — when state updates trigger re-renders, batching, and lazy initialisation.',
    keyPoints: ['setState(fn) with a function avoids stale state in callbacks', 'React 18 batches all state updates automatically (even async)', 'Lazy initialiser: useState(() => expensiveCompute()) runs once'] },
  { title: 'useEffect & Lifecycle',      route: '/react', badge: 'Hooks', available: false,
    description: 'Side effects, dependency array, cleanup functions, and the mental model shift from lifecycle to synchronisation.',
    keyPoints: ['Effect runs after render; cleanup runs before next effect and on unmount', 'Empty deps []: run once after mount (mimics componentDidMount)', 'Strict Mode runs effects twice in dev to detect missing cleanups'] },
  { title: 'useRef & useMemo',           route: '/react', badge: 'Hooks', available: false,
    description: 'Mutable references, DOM access, preserving values between renders, and memoising expensive calculations.',
    keyPoints: ['useRef: persists across renders without triggering re-render', 'useMemo: cache expensive calculation; only recompute when deps change', 'Don\'t over-memoize — measure first; premature memoization adds complexity'] },
  { title: 'useCallback & Performance Hooks', route: '/react', badge: 'Hooks', available: false,
    description: 'Stable function references with useCallback, useTransition for non-urgent updates, and useDeferredValue.',
    keyPoints: ['useCallback: stable reference prevents unnecessary child re-renders when passed as prop', 'useTransition: marks state update as low priority — keeps UI responsive', 'useDeferredValue: deferred version of a value for expensive renders'] },
  { title: 'Custom Hooks',               route: '/react', badge: 'Hooks', available: false,
    description: 'Extract and share stateful logic across components — naming conventions, testing, and composition.',
    keyPoints: ['Custom hook: function starting with "use" that calls other hooks', 'Extracts logic, not markup — returns data and handlers', 'useFetch, useLocalStorage, useDebounce, useIntersectionObserver — common patterns'] },
  { title: 'Context API',                route: '/react', badge: 'State Management', available: false,
    description: 'createContext, useContext, and when to use Context vs prop drilling vs a state library.',
    keyPoints: ['Context causes all consumers to re-render on value change', 'Split contexts by update frequency: auth (rare) vs theme vs data', 'Context is not a state manager — combine with useReducer for complex state'] },
  { title: 'useReducer',                 route: '/react', badge: 'State Management', available: false,
    description: 'Predictable state transitions with reducer functions — when to choose useReducer over useState.',
    keyPoints: ['dispatch({ type: "INCREMENT", payload: 1 }) — action-based updates', 'Reducer is pure: (state, action) => newState — easy to test', 'Prefer when: multiple sub-values, next state depends on previous, complex transitions'] },
  { title: 'Zustand & Jotai',            route: '/react', badge: 'State Management', available: false,
    description: 'Lightweight modern state libraries — Zustand\'s store pattern and Jotai\'s atomic model.',
    keyPoints: ['Zustand: create a store outside React; subscribe with useStore()', 'Jotai: atoms as units of state; derived atoms; no provider needed', 'Smaller bundle and simpler API than Redux for most applications'] },
  { title: 'Redux Toolkit',              route: '/react', badge: 'State Management', available: false,
    description: 'RTK createSlice, createAsyncThunk, RTK Query — modern Redux without the boilerplate.',
    keyPoints: ['createSlice: reducers + actions in one — Immer allows mutating syntax', 'createAsyncThunk: handles pending/fulfilled/rejected lifecycle', 'RTK Query: data fetching + caching layer built on Redux'] },
  { title: 'React Router v6',            route: '/react', badge: 'Routing', available: false,
    description: 'Routes, nested routes, loaders, actions, useNavigate, useParams, and the data router pattern.',
    keyPoints: ['Nested routes: <Outlet /> renders child route components', 'loader function: fetch data before rendering — replaces useEffect+fetch', 'useNavigate: programmatic navigation; navigate(-1) for back'] },
  { title: 'Code Splitting & Lazy',      route: '/react', badge: 'Performance', available: false,
    description: 'React.lazy, Suspense, and route-based code splitting to reduce initial bundle size.',
    keyPoints: ['React.lazy(() => import("./Component")) defers the import', 'Suspense + fallback: show spinner while lazy component loads', 'Route-based splitting is the most impactful: split at page boundaries first'] },
  { title: 'React.memo & Memoization',   route: '/react', badge: 'Performance', available: false,
    description: 'Preventing unnecessary re-renders with React.memo, shallow equality, and when memoization hurts.',
    keyPoints: ['React.memo: wraps component; skips re-render if props haven\'t changed', 'Shallow comparison: objects/arrays must be referentially stable', 'Profile in DevTools before memoizing — wrong application adds overhead'] },
  { title: 'React Compiler (RSC)',        route: '/react', badge: 'Performance', available: false,
    description: 'React 19 compiler, Server Components, Server Actions, and the shift to server-first React.',
    keyPoints: ['React Compiler auto-memoizes: useMemo/useCallback often no longer needed', 'RSC: render on server, zero JS sent; Client Components have interactivity', 'Server Actions: form submit and data mutation run on server directly'] },
  { title: 'Compound Components',        route: '/react', badge: 'Patterns', available: false,
    description: 'Building flexible, composable component APIs like <Select>, <Tabs> with implicit shared state.',
    keyPoints: ['Use Context to share state between parent and child components', 'Consumers compose pieces without passing state via props', 'Accessible primitives: Radix UI, Headless UI use compound pattern'] },
  { title: 'Render Props & HOCs',        route: '/react', badge: 'Patterns', available: false,
    description: 'Render props pattern, higher-order components, and why hooks largely replaced both.',
    keyPoints: ['Render prop: <DataFetcher render={(data) => <View data={data} />}>', 'HOC: withAuth(MyComponent) wraps and enhances', 'Both patterns still appear in older codebases — recognise and refactor'] },
  { title: 'Testing React',              route: '/react', badge: 'Ecosystem', available: false,
    description: 'React Testing Library, Vitest/Jest, user-event, mocking, and the testing trophy approach.',
    keyPoints: ['Test behaviour, not implementation: getByRole, not getByClassName', 'userEvent.click() simulates real user interaction', 'MSW (Mock Service Worker): intercept fetch/axios requests in tests'] },
  { title: 'TanStack Query (React Query)', route: '/react', badge: 'Ecosystem', available: false,
    description: 'Server-state management with TanStack Query — the de-facto data fetching library in React.',
    keyPoints: ['useQuery for fetching; useMutation for writes — replace useEffect+fetch', 'Automatic caching, background refetch, stale-while-revalidate', 'QueryClient: configure retry, staleTime, gcTime globally', 'Optimistic updates: mutate UI before server confirms', 'Infinite queries with useInfiniteQuery for pagination'] },
  { title: 'React Hook Form',            route: '/react', badge: 'Ecosystem', available: false,
    description: 'Performant forms with minimal re-renders — register, watch, handleSubmit, validation with Zod.',
    keyPoints: ['register(): binds input to the form without controlled state', 'handleSubmit validates before calling your submit function', 'Zod + zodResolver: schema validation as single source of truth', 'Controller: for controlled components (Material UI, Radix)', 'formState.errors for field-level error display'] },
  { title: 'Next.js App Router',         route: '/react', badge: 'Ecosystem', available: false,
    description: 'The React meta-framework for production — RSC, file-based routing, layouts, server actions, caching.',
    keyPoints: ['app/ directory: every file is a Server Component by default', '"use client" directive opts into Client Component', 'layout.tsx: shared UI wrapper, persists across navigations', 'Server Actions: async functions that run on server, called from forms', 'Streaming: Suspense boundaries stream HTML incrementally'] },
  { title: 'React Native Overview',      route: '/react', badge: 'Ecosystem', available: false,
    description: 'Build iOS and Android apps with React — native components, Expo, navigation, and the new architecture.',
    keyPoints: ['View, Text, ScrollView map to native UI components', 'StyleSheet.create: inline styles, flexbox layout by default', 'Expo: managed workflow — native APIs without Xcode/Android Studio', 'React Navigation: Stack, Tab, Drawer navigators', 'New Architecture (Fabric + JSI): bridgeless, synchronous JS↔native'] },
  { title: 'React Cheat Sheet',          route: '/react', badge: 'Reference', available: false,
    description: 'All hooks, lifecycle mental model, common patterns, and component design quick reference.',
    keyPoints: ['Hooks: useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer', 'Component design: composition > inheritance; controlled > uncontrolled', 'Key patterns: compound, render prop, HOC, custom hook'] },
  { title: 'React Interview Prep',       route: '/react', badge: 'Reference', available: false,
    description: '40+ React interview questions — hooks, rendering, state, performance, and React 19 features.',
    keyPoints: ['Explain the virtual DOM and reconciliation', 'When would you use useReducer over useState?', 'How does React.memo differ from useMemo?'] },
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
