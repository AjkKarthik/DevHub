import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Functions': 'functions', 'Objects & Arrays': 'objects',
  'Async': 'async', 'DOM & Browser': 'dom', 'Modules & Tooling': 'modules',
  'Patterns': 'patterns', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Functions', 'Objects & Arrays', 'Async', 'DOM & Browser', 'Modules & Tooling', 'Patterns', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'JavaScript Fundamentals',    route: '/javascript/fundamentals', badge: 'Foundations', available: true,
    description: 'Variables, data types, operators, control flow, type coercion, and the difference between == and ===.',
    keyPoints: ['var/let/const: prefer const; let for reassignable; avoid var', 'Truthy/falsy: 0, "", null, undefined, NaN, false are falsy — everything else is truthy', 'typeof null === "object" is a historical bug — always check for null explicitly'] },
  { title: 'Scope & Closures',           route: '/javascript/closures', badge: 'Foundations', available: true,
    description: 'Global, function, and block scope; lexical scope; closures and the module pattern.',
    keyPoints: ['Closures: inner function retains access to outer function\'s variables after outer returns', 'let/const are block-scoped; var is function-scoped (and hoisted)', 'Closure pitfall in loops: use let (block-scoped) or IIFE — not var'] },
  { title: 'Hoisting & TDZ',             route: '/javascript/hoisting', badge: 'Foundations', available: true,
    description: 'How JavaScript hoists function declarations, var declarations, and the Temporal Dead Zone for let/const.',
    keyPoints: ['Function declarations are fully hoisted; function expressions are not', 'var: declaration hoisted (undefined); let/const: hoisted but in TDZ until declaration', 'TDZ: accessing let/const before declaration throws ReferenceError'] },
  { title: 'Symbols & Iterators',         route: '/javascript/symbols', badge: 'Foundations', available: true,
    description: 'Symbol primitive, well-known symbols, and the iterator protocol — how for...of and spread really work.',
    keyPoints: ['Symbol(): unique primitive, never equal to anything else', 'Symbol.iterator: makes any object iterable (for...of, spread, destructure)', 'Well-known symbols: Symbol.toPrimitive, Symbol.hasInstance, Symbol.asyncIterator'] },
  { title: 'Functions Deep Dive',        route: '/javascript/functions', badge: 'Functions', available: true,
    description: 'Function declarations vs expressions, arrow functions, IIFE, higher-order functions, and this binding.',
    keyPoints: ['Arrow functions have no own this, arguments, or prototype', 'call()/apply()/bind() explicitly set this', 'First-class functions: assigned to variables, passed as arguments, returned from functions'] },
  { title: 'Prototypes & Classes',       route: '/javascript/prototypes', badge: 'Functions', available: true,
    description: 'Prototype chain, Object.create, ES6 classes (syntactic sugar), inheritance, and mixins.',
    keyPoints: ['Every object has __proto__ pointing to its prototype', 'class is syntax sugar over prototype-based inheritance', 'instanceof walks the prototype chain; typeof only identifies primitives'] },
  { title: 'Object Fundamentals',        route: '/javascript/objects', badge: 'Objects & Arrays', available: true,
    description: 'Object literals, property descriptors, getters/setters, Object.freeze/seal, and cloning strategies.',
    keyPoints: ['Spread {...obj}: shallow clone; structuredClone(obj): deep clone', 'Object.keys/values/entries — the essential iteration trio', 'Optional chaining: obj?.user?.name avoids nested null checks'] },
  { title: 'Destructuring & Spread',     route: '/javascript/destructuring', badge: 'Objects & Arrays', available: true,
    description: 'Object and array destructuring, default values, renaming, rest/spread operators, and practical patterns.',
    keyPoints: ['const { a, b = 10 } = obj — destructure with default', 'const [head, ...tail] = arr — rest collects remaining elements', 'Spread in function call: Math.max(...arr) vs apply(null, arr)'] },
  { title: 'Arrays & Iteration',         route: '/javascript/arrays', badge: 'Objects & Arrays', available: true,
    description: 'map, filter, reduce, find, some, every, flat, flatMap — functional array methods and iteration protocols.',
    keyPoints: ['map: transform; filter: subset; reduce: accumulate — chain them', 'for...of: iterates values; for...in: iterates keys (avoid on arrays)', 'Array.from(new Set(arr)) — deduplication one-liner'] },
  { title: 'Promises & Async/Await',     route: '/javascript/promises', badge: 'Async', available: true,
    description: 'Promise states, chaining, error handling, async/await, and the relationship to the event loop.',
    keyPoints: ['async function always returns a Promise', 'await pauses execution of the async function without blocking the thread', 'Promise.all: parallel; Promise.allSettled: all results even on failure; Promise.race: first wins'] },
  { title: 'Event Loop & Concurrency',   route: '/javascript/event-loop', badge: 'Async', available: true,
    description: 'Call stack, Web APIs, callback queue, microtask queue — how JavaScript achieves non-blocking I/O.',
    keyPoints: ['Microtasks (Promises) drain before macrotasks (setTimeout)', 'setTimeout(fn, 0) does not guarantee immediate execution — it queues a macrotask', 'Web Workers: true parallelism in a separate thread; no DOM access'] },
  { title: 'Error Handling',             route: '/javascript/error-handling', badge: 'Async', available: true,
    description: 'try/catch/finally, custom errors, async error handling, and global error events.',
    keyPoints: ['Custom errors: class AppError extends Error { constructor(msg, code) { super(msg); this.code = code; } }', 'async functions: use try/catch or .catch() on the returned promise', 'window.onerror and unhandledrejection catch uncaught errors globally'] },
  { title: 'Generators',                 route: '/javascript/generators', badge: 'Async', available: true,
    description: 'function*, yield, two-way communication, infinite sequences, and async generators.',
    keyPoints: ['function*: returns a generator — pauses at each yield', 'next(value) passes a value back in to the yield expression', 'async function* for async iteration — for await...of a stream'] },
  { title: 'DOM Manipulation',           route: '/javascript/dom', badge: 'DOM & Browser', available: true,
    description: 'querySelector, createElement, event listeners, event delegation, and performance-aware DOM updates.',
    keyPoints: ['Event delegation: attach one listener to parent, check event.target inside', 'DocumentFragment for batch DOM inserts without reflow on each', 'MutationObserver: react to DOM changes without polling'] },
  { title: 'Events & Custom Events',     route: '/javascript/events', badge: 'DOM & Browser', available: true,
    description: 'Event phases (capture vs bubble), stopPropagation, preventDefault, and creating custom events.',
    keyPoints: ['Bubbles: div → body → html → document → window', 'stopPropagation stops bubbling; stopImmediatePropagation stops other handlers too', 'new CustomEvent("my-event", { detail: data, bubbles: true })'] },
  { title: 'Browser APIs',               route: '/javascript/browser-apis', badge: 'DOM & Browser', available: true,
    description: 'Fetch, Web Storage, Web Workers, Intersection Observer, ResizeObserver, and the History API.',
    keyPoints: ['IntersectionObserver: lazy loading, infinite scroll, scroll animations — no scroll listeners', 'ResizeObserver: react to element size changes without window.resize', 'History API: pushState/replaceState for SPA routing without page reload'] },
  { title: 'ES Modules',                 route: '/javascript/modules', badge: 'Modules & Tooling', available: true,
    description: 'import/export syntax, named vs default exports, dynamic import(), module resolution, and tree-shaking.',
    keyPoints: ['Named exports: export const foo; import { foo } from "./foo.js"', 'Default export: one per module — often the component or class', 'Dynamic import(): code-splitting — load module on demand'] },
  { title: 'Bundlers & Build Tools',     route: '/javascript/bundlers', badge: 'Modules & Tooling', available: true,
    description: 'Vite, Webpack, esbuild, Rollup — what bundlers do, why you need them, and the modern build pipeline.',
    keyPoints: ['Vite dev server: ESM native, HMR via WebSocket, instant startup', 'Webpack: graph of all modules; tree-shaking removes unused exports', 'esbuild: 10–100× faster than Webpack, written in Go'] },
  { title: 'Design Patterns in JS',      route: '/javascript/patterns', badge: 'Patterns', available: true,
    description: 'Module, Observer, Factory, Singleton, and Proxy patterns — all in idiomatic modern JavaScript.',
    keyPoints: ['Module pattern via ES modules replaces IIFE module pattern', 'Observer with EventTarget: elem.addEventListener / dispatchEvent', 'Proxy: intercept object operations — validation, logging, reactivity systems'] },
  { title: 'Functional JS',              route: '/javascript/functional', badge: 'Patterns', available: true,
    description: 'Pure functions, immutability, composition, currying, memoization, and point-free style.',
    keyPoints: ['Pure function: same input → same output, no side effects', 'Immutability: spread or structuredClone — never mutate shared state directly', 'compose/pipe: f(g(x)) readable as pipe(g, f)(x)'] },
  { title: 'Proxy & Reflect API',        route: '/javascript/proxy', badge: 'Patterns', available: true,
    description: 'Intercept object operations with Proxy traps — powers Vue 3 reactivity, validation, and logging.',
    keyPoints: ['new Proxy(target, handler): intercept get/set/has/apply/construct', 'Vue 3 reactivity is built on Proxy — zero configuration tracking', 'Reflect: mirrors Proxy traps — always call Reflect inside trap for correct default'] },
  { title: 'WeakMap, WeakSet & WeakRef', route: '/javascript/weakrefs', badge: 'Patterns', available: true,
    description: 'Weak references that don\'t prevent garbage collection — private data, caches, and memory-sensitive patterns.',
    keyPoints: ['WeakMap: keys must be objects; entries GC\'d when key is unreachable', 'WeakSet: tracks object existence without preventing GC', 'WeakRef: hold a reference that may be collected; use deref() to check'] },
  { title: 'JavaScript Cheat Sheet',     route: '/javascript/cheatsheet', badge: 'Reference', available: true,
    description: 'Array methods, Object methods, string methods, async patterns, and ES6+ syntax at a glance.',
    keyPoints: ['Array: map/filter/reduce/find/some/every/flat/flatMap', 'String: template literals, padStart/End, trimStart/End, replaceAll, at()', 'Object: keys/values/entries/assign/freeze/fromEntries'] },
  { title: 'JavaScript Interview Prep',  route: '/javascript/interview-prep', badge: 'Reference', available: true,
    description: '40+ JS interview questions — closures, event loop, prototypes, this, async/await, and tricky edge cases.',
    keyPoints: ['Explain closure — with a real-world use case', 'How does the event loop work? Microtasks vs macrotasks', 'What is the difference between null and undefined?'] },
];

@Component({
  selector: 'app-javascript-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class JavaScriptHome {
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
