import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-js-closures',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './closures.html',
  styleUrl: './closures.scss',
})
export class JsClosures {
  theory: TheoryPoint[] = [
    {
      heading: 'What is a Closure?',
      points: [
        'A closure is a function that retains access to its outer (enclosing) scope even after the outer function has returned. The inner function "closes over" the variables it references.',
        'Closures are not a special syntax feature — they are a natural consequence of how JavaScript implements lexical scoping. Every function in JavaScript is a closure.',
        'The key insight: closures capture variables by reference, not by value. If the outer variable changes after the closure is created, the closure sees the updated value.',
        'Closures are the foundation of many JavaScript patterns: module pattern, partial application, memoization, event handlers that remember state, and framework hooks like React\'s useState.',
      ]
    },
    {
      heading: 'Lexical Scope',
      points: [
        'Lexical scope means a function\'s scope is determined at definition time, not call time. A function can always access variables from the scope where it was written, regardless of where it is called from.',
        'JavaScript uses a scope chain — when a variable is referenced, the engine walks up from the current scope through each enclosing scope until it finds the variable or reaches the global scope.',
        'Functions create new scopes; blocks (<code>{}</code>) create block scopes for <code>let</code>/<code>const</code> but not for <code>var</code>. This is why <code>var</code> leaks out of <code>if</code>/<code>for</code> blocks.',
        'The scope chain is static — it\'s fixed when the code is parsed. Dynamic scope (where the call site determines scope) would make code much harder to reason about.',
      ]
    },
    {
      heading: 'The Classic Loop Bug',
      points: [
        'The closure-in-loop bug: using <code>var</code> in a <code>for</code> loop with async callbacks. All callbacks share the <em>same</em> <code>var i</code> which ends at the loop\'s final value.',
        'Three fixes: (1) Use <code>let</code> — block-scoped, so each iteration gets its own binding. (2) Use <code>forEach</code> — the callback gets its own scope per iteration. (3) Use an IIFE to capture <code>i</code> by value.',
        'The <code>let</code> fix works because each loop iteration creates a new block scope with its own binding of <code>i</code>, so each closure captures a different variable.',
        'Understanding this bug reveals how closures really work: they capture variables (bindings), not values. This matters whenever closures and mutations coexist.',
      ]
    },
    {
      heading: 'Practical Closure Patterns',
      points: [
        '<strong>Counter / state encapsulation:</strong> Return a function or object from another function to hide and protect state. Classic "private variable" pattern in JavaScript before classes.',
        '<strong>Partial application:</strong> Create a new function with some arguments pre-filled. <code>const add5 = add.bind(null, 5)</code> or <code>const add5 = x => add(5, x)</code>.',
        '<strong>Memoization:</strong> Cache the results of expensive function calls using a closure over a <code>Map</code>. Each memoized function gets its own private cache.',
        '<strong>Once function:</strong> A wrapper that ensures a function can only be called once — used for one-time initialization. The flag is hidden in the closure.',
        '<strong>Event handlers with context:</strong> Handlers that remember the element, configuration, or state at the time they were registered — without global variables or data attributes.',
      ]
    },
    {
      heading: 'Memory & Garbage Collection',
      points: [
        'Closures hold a reference to their enclosing scope\'s variable environment. If the closure lives long, the outer scope\'s variables cannot be garbage collected — even if they are large.',
        'Common memory leak: storing DOM elements inside closures that are attached to event handlers. If the element is removed from the DOM but the handler still references it, the element can\'t be GC\'d.',
        'Fix: remove event listeners when elements are removed (<code>removeEventListener</code>), or use <code>WeakMap</code> for element-to-data mappings so the data is GC\'d with the element.',
        'Modern JS engines are smart about closures — they optimize away the variables a closure doesn\'t actually reference. But you should still avoid holding large objects in long-lived closures.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Closure',             type: 'keyword',  desc: 'Function that retains access to its outer scope after the outer function returns' },
    { name: 'Lexical scope',       type: 'keyword',  desc: 'Scope determined by where a function is written, not where it is called' },
    { name: 'Scope chain',         type: 'keyword',  desc: 'Chain of enclosing scopes the engine searches when resolving a variable' },
    { name: 'IIFE',                type: 'syntax',   desc: '(function(){})() — immediately invoked, creates its own scope' },
    { name: 'let in for loop',     type: 'syntax',   desc: 'Each iteration gets its own binding — fixes the classic closure-in-loop bug' },
    { name: 'Partial application', type: 'keyword',  desc: 'Create a new function with some arguments pre-applied via closure' },
    { name: 'Memoize',             type: 'keyword',  desc: 'Cache results in a closure-held Map — call with same args returns cached result' },
    { name: 'Once pattern',        type: 'keyword',  desc: 'Wrap function to run at most once — flag stored in closure' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Closure Basics',
      language: 'typescript',
      code: `// ── A simple closure ──────────────────────────────────────────────────
function makeCounter(start = 0) {
  let count = start;   // private to makeCounter's scope

  return {
    increment() { return ++count; },
    decrement() { return --count; },
    value()     { return count; },
    reset()     { count = start; },
  };
}

const c1 = makeCounter(10);
const c2 = makeCounter();     // independent counter

c1.increment(); // 11
c1.increment(); // 12
c2.increment(); // 1  — separate state

console.log(c1.value()); // 12
console.log(c2.value()); // 1

// count is truly private — can't be accessed directly
// console.log(c1.count);  // undefined

// ── Closure captures by reference ────────────────────────────────────
function makeGreeter(greeting) {
  return function(name) {         // inner function = closure
    return \`\${greeting}, \${name}!\`;
  };
}

const sayHello = makeGreeter("Hello");
const sayHi    = makeGreeter("Hi");

console.log(sayHello("Alice")); // "Hello, Alice!"
console.log(sayHi("Bob"));     // "Hi, Bob!"`,
    },
    {
      label: 'Loop Bug & Fix',
      language: 'typescript',
      code: `// ── Classic closure loop BUG ─────────────────────────────────────────
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Prints: 3, 3, 3  — all callbacks share the same var i
// By the time callbacks run, the loop has finished and i === 3

// ── Fix 1: Use let ────────────────────────────────────────────────────
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Prints: 0, 1, 2 — each iteration gets its own block-scoped i

// ── Fix 2: IIFE (legacy code / older environments) ────────────────────
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 0);
  })(i);  // capture current value of i as j
}
// Prints: 0, 1, 2

// ── Fix 3: forEach (for array iteration) ──────────────────────────────
[0, 1, 2].forEach(i => {
  setTimeout(() => console.log(i), 0);
});
// Prints: 0, 1, 2 — callback scope per iteration`,
    },
    {
      label: 'Practical Patterns',
      language: 'typescript',
      code: `// ── Memoization ──────────────────────────────────────────────────────
function memoize(fn) {
  const cache = new Map();    // private cache in closure

  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log('cache hit');
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const slowSquare = (n) => { /* expensive */ return n * n; };
const fastSquare = memoize(slowSquare);

fastSquare(5);  // computes
fastSquare(5);  // cache hit → returns 25 instantly

// ── Once pattern ──────────────────────────────────────────────────────
function once(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

const initDb = once(() => {
  console.log('DB initialized');
  return { connection: 'open' };
});

initDb();  // "DB initialized"
initDb();  // nothing — returns cached result

// ── Partial application ───────────────────────────────────────────────
function partial(fn, ...preArgs) {
  return function(...laterArgs) {
    return fn(...preArgs, ...laterArgs);
  };
}

const multiply = (a, b) => a * b;
const double = partial(multiply, 2);
const triple = partial(multiply, 3);

console.log(double(5));  // 10
console.log(triple(5));  // 15`,
    },
    {
      label: 'Module Pattern',
      language: 'typescript',
      code: `// ── IIFE Module Pattern (pre-ES6 modules) ────────────────────────────
const ShoppingCart = (function() {
  // Private state
  const items = [];
  let discount = 0;

  // Private function
  function calculateTotal() {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0)
      * (1 - discount);
  }

  // Public API
  return {
    add(item)    { items.push(item); },
    remove(name) { const i = items.findIndex(x => x.name === name); if (i > -1) items.splice(i, 1); },
    setDiscount(pct) { discount = pct / 100; },
    total()      { return calculateTotal(); },
    itemCount()  { return items.length; },
  };
})();

ShoppingCart.add({ name: 'Widget', price: 10, qty: 2 });
ShoppingCart.add({ name: 'Gadget', price: 25, qty: 1 });
ShoppingCart.setDiscount(10);  // 10% off
console.log(ShoppingCart.total());     // 40.5
console.log(ShoppingCart.itemCount()); // 2

// items and discount are completely private:
// console.log(ShoppingCart.items); // undefined

// ── Factory function (preferred modern approach) ──────────────────────
function createUser(name, role) {
  let loginCount = 0;     // private

  return {
    name,
    role,
    login() { loginCount++; },
    stats() { return { name, role, loginCount }; },
  };
}

const alice = createUser('Alice', 'admin');
const bob   = createUser('Bob',   'viewer');
alice.login();
alice.login();
console.log(alice.stats()); // { name: 'Alice', role: 'admin', loginCount: 2 }
console.log(bob.stats());   // { name: 'Bob',   role: 'viewer', loginCount: 0 }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Loop closure with var',
      wrong: `for (var i = 0; i < 5; i++) {
  btn[i].onclick = function() { console.log(i); };
}  // all buttons log 5`,
      right: `for (let i = 0; i < 5; i++) {
  btn[i].onclick = function() { console.log(i); };
}  // each button logs its own i`,
      explanation: 'var is function-scoped, so all closures share one i. let creates a new binding per iteration, so each closure captures its own i.',
    },
    {
      title: 'Thinking const prevents closure mutation',
      wrong: `const state = { count: 0 };
const inc = () => state.count++;
inc(); inc();
// thinking state.count is still 0 inside closures`,
      right: `// const prevents rebinding, not mutation.
// state.count IS 2 after two inc() calls.
// To prevent mutation, use Object.freeze() or return new objects.`,
      explanation: 'Closures capture variable bindings, not values. const state always refers to the same object, but its properties are freely mutable.',
    },
    {
      title: 'Memory leak from DOM closures',
      wrong: `function setup() {
  const el = document.getElementById('big-table');
  document.addEventListener('click', function handler() {
    el.style.display = 'none';
  });
  // el removed from DOM later, but handler holds reference — never GC'd
}`,
      right: `function setup() {
  const el = document.getElementById('big-table');
  function handler() { el.style.display = 'none'; }
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
}
const cleanup = setup();
// Call cleanup() when done to free the reference`,
      explanation: 'If a closure holds a reference to a DOM element and the handler is never removed, the element cannot be garbage collected even if removed from the DOM.',
    },
    {
      title: 'Recreating closures in every render / call',
      wrong: `function App() {
  // New function created on every render
  const handleClick = () => { /* ... */ };
  return items.map(i => <button onClick={handleClick}>{i}</button>);
}`,
      right: `// In React: useCallback(fn, deps) stabilizes the reference
// In plain JS: define outside the calling scope if deps don't change
const handleClick = () => { /* ... */ };
function App() { return items.map(i => <button onClick={handleClick}>{i}</button>); }`,
      explanation: 'Creating new closure instances on every call wastes memory and breaks referential equality checks (React.memo, event listener deduplication).',
    },
    {
      title: 'Stale closure in async callbacks',
      wrong: `function startTimer() {
  let count = 0;
  setInterval(() => {
    count++;
    console.log(count);
  }, 1000);
  count = 100; // the callback will see count = 100 on first tick
}`,
      right: `// Closures capture the variable itself — mutations ARE visible.
// This is actually the CORRECT behavior. The stale-closure bug is:
function useEffect_wrong() {
  const [count, setCount] = useState(0);  // React-specific example
  // handler captures count=0 at registration and never updates
  document.onclick = () => console.log(count);  // stale 0
}`,
      explanation: 'Closures capture variable bindings, so mutations are visible. Stale closures happen when you capture a value-type or the variable is never reassigned after the closure is created.',
    },
    {
      title: 'Returning closures from synchronous loops expecting separate state',
      wrong: `function makeAdders() {
  const adders = [];
  for (var i = 0; i < 3; i++) {
    adders.push(function(x) { return x + i; });
  }
  return adders;
}
makeAdders()[0](10); // 13, not 10 — all adders use i=3`,
      right: `function makeAdders() {
  return [0, 1, 2].map(i => x => x + i);
}
makeAdders()[0](10); // 10 ✓ — arrow fn in map, each gets own i`,
      explanation: 'The map approach naturally creates a new scope per iteration. The for+var approach shares one binding. Using let in the for loop also fixes it.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Rate Limiter Using Closures',
    language: 'typescript',
    description: 'Write a `rateLimit(fn, limit, windowMs)` function that wraps `fn` and ensures it is called at most `limit` times per `windowMs` milliseconds. Calls over the limit should be silently dropped (or optionally return a rejection).\n\nBonus: Add a `rateLimitWithQueue(fn, limit, windowMs)` that queues over-limit calls and retries them after the window resets.',
    hints: [
      'Use a closure to hold a count and a window start timestamp',
      'On each call, check if windowMs has elapsed since window start — if so, reset count',
      'Track call timestamps in an array; filter out entries older than windowMs',
      'For the queue bonus: store pending calls in a closure array and use setTimeout to drain',
    ],
    starterCode: `function rateLimit(fn, limit, windowMs) {
  // Your implementation here
}

// Test
const log = rateLimit(console.log, 3, 1000);
log('a');  // logged
log('b');  // logged
log('c');  // logged
log('d');  // dropped (over limit in this window)

// After 1 second, window resets
setTimeout(() => log('e'), 1100);  // logged again`,
    solution: `function rateLimit(fn, limit, windowMs) {
  const calls = [];

  return function(...args) {
    const now = Date.now();
    // Remove calls outside current window
    while (calls.length > 0 && now - calls[0] > windowMs) {
      calls.shift();
    }
    if (calls.length < limit) {
      calls.push(now);
      return fn.apply(this, args);
    }
    // Over limit — silently drop
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is a closure in JavaScript?',
      options: [
        'A function with no parameters',
        'A function that retains access to its outer scope after the outer function returns',
        'A sealed object that cannot be mutated',
        'A function that runs immediately when defined',
      ],
      answer: 1,
      explanation: 'A closure is created when an inner function "closes over" variables from its enclosing scope, retaining access to those variables even after the enclosing function has returned.',
    },
    {
      q: 'What does this print?\n`for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`',
      options: ['0, 1, 2', '0, 0, 0', '3, 3, 3', '1, 2, 3'],
      answer: 2,
      explanation: 'var is function-scoped, so all callbacks share the same i. By the time they run, the loop has finished and i === 3. Use let to fix this.',
    },
    {
      q: 'Do closures capture variables by value or by reference?',
      options: [
        'By value — a snapshot at creation time',
        'By reference — see changes after creation',
        'Depends on whether the value is a primitive',
        'Depends on whether you use const or let',
      ],
      answer: 1,
      explanation: 'Closures capture variable bindings (references), not values. If the outer variable changes after the closure is created, the closure sees the new value.',
    },
    {
      q: 'What is lexical scope?',
      options: [
        'Scope that changes based on where a function is called',
        'Scope that is determined at function call time',
        'Scope that is determined where the function is written (defined)',
        'Scope that applies only to lexical tokens like keywords',
      ],
      answer: 2,
      explanation: 'Lexical scope means scope is determined at parse/definition time — by where the function appears in the source code — not where it is called from.',
    },
    {
      q: 'Which pattern uses closures to create private state in JavaScript?',
      options: ['Prototype pattern', 'Observer pattern', 'Module/IIFE pattern', 'Strategy pattern'],
      answer: 2,
      explanation: 'The Module/IIFE pattern uses an immediately invoked function expression to create a scope, then returns only the public API. The private variables remain accessible via closure but not from outside.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does every function in JavaScript create a closure?',
      a: 'Yes — every function in JavaScript is technically a closure because it retains a reference to its outer scope. Even a top-level function closes over the global scope. The term "closure" is usually reserved for functions that capture variables from a non-global outer scope.',
    },
    {
      q: 'How do closures relate to React hooks?',
      a: 'React hooks rely heavily on closures. <code>useState</code>\'s setter, <code>useEffect</code>\'s cleanup function, and <code>useCallback</code>\'s memoized function all close over component state and props. The "stale closure" bug in React (seeing old state inside an effect) is a direct consequence of closures capturing values at creation time.',
    },
    {
      q: 'What is the difference between a closure and a callback?',
      a: 'A callback is a function passed as an argument to be called later. A closure is a function that retains access to its outer scope. A callback can be a closure (and usually is, if it references variables from the surrounding scope), but not all closures are callbacks. The concepts describe different aspects of functions.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A closure is a function that retains access to its enclosing scope\'s variables — the foundation of private state, memoization, partial application, and the module pattern.',
    mustKnow: [
      'Closures capture variable bindings by reference, not values — mutations are visible',
      'Every function in JavaScript is a closure (even global ones close over the global scope)',
      'The loop-with-var bug: all callbacks share one var binding; fix with let or forEach',
      'The module/IIFE pattern uses closures to create truly private state',
      'Closures can cause memory leaks when they hold DOM references in long-lived handlers',
      'Memoization stores results in a closure-held cache; once() wraps functions to run at most once',
    ],
    interviewFocus: [
      'Explain what a closure is — with a practical real-world example',
      'Debug the classic loop bug: var vs let in for loop with setTimeout',
      'How does the module pattern use closures to simulate private variables?',
      'When can closures cause memory leaks and how do you prevent them?',
    ],
  };
}
