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
  selector: 'app-js-functional',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './functional.html',
  styleUrl: './functional.scss',
})
export class JsFunctional {
  theory: TheoryPoint[] = [
    {
      heading: 'Pure Functions & Immutability',
      points: [
        'A <strong>pure function</strong> has two properties: (1) same inputs always produce the same output (deterministic), and (2) no side effects — it doesn\'t modify external state, make network calls, or write to the DOM.',
        'Pure functions are easy to test (no setup/mocks), safe to cache (memoize), and can be parallelized. Impure functions (those with side effects) should be pushed to the edges of your system.',
        '<strong>Immutability</strong>: instead of mutating objects, create new ones with the changes. <code>{ ...obj, key: newValue }</code>, <code>[...arr, newItem]</code>, <code>arr.filter()</code>. Prevents a whole class of bugs where shared mutable state leads to unexpected changes.',
        '<code>Object.freeze()</code> makes an object shallowly immutable (prevents property reassignment). For deep immutability, freeze recursively or use a library like Immer.',
      ]
    },
    {
      heading: 'Currying & Partial Application',
      points: [
        '<strong>Currying</strong>: transform a function that takes N arguments into N nested functions that each take one argument. <code>add(1)(2)(3)</code> instead of <code>add(1, 2, 3)</code>. Named after mathematician Haskell Curry.',
        '<strong>Partial application</strong>: pre-fill some arguments of a function, returning a new function with fewer parameters. <code>fn.bind(null, arg1)</code> or a custom <code>partial(fn, ...args)</code>.',
        'Both enable <strong>specialization</strong>: create reusable, configured function variants from general ones. Example: <code>const double = multiply(2)</code> from a general <code>multiply</code>.',
        'Curried functions compose better because they accept one argument at a time — perfect for point-free pipeline stages.',
      ]
    },
    {
      heading: 'Function Composition',
      points: [
        '<strong>compose(...fns)</strong>: combine functions right-to-left. <code>compose(f, g, h)(x)</code> = <code>f(g(h(x)))</code>. Mathematical function composition.',
        '<strong>pipe(...fns)</strong>: combine functions left-to-right. <code>pipe(h, g, f)(x)</code> = <code>f(g(h(x)))</code>. More readable for data transformation pipelines.',
        'Composition enables building complex transformations from small, reusable pieces. Each function does one thing — compose them to do many things.',
        'Point-free style: define functions without mentioning their arguments. <code>const process = pipe(parse, validate, transform)</code> — no <code>x => process(x)</code> wrapper needed.',
      ]
    },
    {
      heading: 'Functors, Monads & Option Pattern',
      points: [
        'A <strong>functor</strong> is anything with a <code>map</code> method that transforms the value inside without changing the container structure. Arrays are functors — <code>arr.map(fn)</code> transforms values, returns a new array.',
        'A <strong>monad</strong> is a functor that also has <code>flatMap/chain</code> to flatten nested containers. Promises are monads — <code>.then(fn)</code> auto-flattens nested promises.',
        'The <strong>Option/Maybe pattern</strong>: wrap a value in <code>Some(value)</code> or <code>None</code> to safely handle nullable values. Transform with <code>.map()</code> without null checks — <code>None.map(fn)</code> returns <code>None</code>.',
        'These patterns enable chaining operations on values that may be absent/errored, without <code>if (x !== null)</code> guards at every step.',
      ]
    },
    {
      heading: 'Function Composition and Point-Free Style',
      points: [
        'Function composition combines simple, single-purpose functions into a pipeline (<code>compose(f, g, h)(x)</code> equivalent to <code>f(g(h(x)))</code>) — building complex transformations from small, independently testable, reusable pieces.',
        'Point-free style (also called tacit programming) defines functions without explicitly naming their arguments (<code>const double = x => x * 2</code> vs the point-free <code>const double = multiply(2)</code> using a curried multiply) — can improve readability for simple pipelines but harm it if overused for complex logic.',
        'Composition works best with unary (single-argument) functions — utilities like lodash\'s <code>flow()</code> or a custom <code>pipe()</code> helper pass a single value through a chain of transformations, which is why currying is often paired with composition.',
        'Pure functions (no side effects, same input always produces same output) are what make composition safe and predictable — composing functions with hidden side effects or external dependencies produces pipelines that are hard to reason about and test.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Pure function',        type: 'keyword',   desc: 'Same input → same output, no side effects' },
    { name: '[...arr, item]',       type: 'syntax',    desc: 'Immutable array add (spread)' },
    { name: '{ ...obj, key: val }', type: 'syntax',    desc: 'Immutable object update (spread)' },
    { name: 'curry(fn)',            type: 'function',  desc: 'Transform f(a,b,c) → f(a)(b)(c)' },
    { name: 'partial(fn, ...args)', type: 'function',  desc: 'Pre-fill arguments, return reduced fn' },
    { name: 'compose(f, g, h)',     type: 'function',  desc: 'Right-to-left function composition' },
    { name: 'pipe(h, g, f)',        type: 'function',  desc: 'Left-to-right function pipeline' },
    { name: 'Array.prototype.map',  type: 'method',    desc: 'Functor map — transform without mutation' },
    { name: 'Promise.prototype.then', type: 'method',  desc: 'Monad flatMap — chains and flattens' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pure Functions & Immutability',
      language: 'typescript',
      code: `// ── Pure vs impure ───────────────────────────────────────────────────
// ❌ Impure — depends on external state, modifies external array
let total = 0;
const items = [];
function addItem(item) {
  items.push(item);     // side effect
  total += item.price;  // side effect
}

// ✓ Pure — same inputs → same outputs, no external dependency
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
function addItem(items, item) {
  return [...items, item];   // returns new array, doesn't mutate
}

// ── Immutable update patterns ─────────────────────────────────────────
// Object update (spread)
const user = { name: 'Alice', age: 30, role: 'viewer' };
const promoted = { ...user, role: 'admin' };  // user unchanged

// Nested object — spread each level that changes
const state = { user: { name: 'Alice', prefs: { theme: 'light' } } };
const darkState = {
  ...state,
  user: { ...state.user, prefs: { ...state.user.prefs, theme: 'dark' } },
};

// Array operations — all return new arrays
const nums = [1, 2, 3, 4, 5];
const withSix  = [...nums, 6];                    // add
const without3 = nums.filter(n => n !== 3);       // remove
const doubled  = nums.map(n => n * 2);            // transform
const updated  = nums.map(n => n === 3 ? 99 : n); // update by value

// ── Object.freeze for shallow immutability ───────────────────────────
const config = Object.freeze({ apiUrl: '/api', timeout: 5000 });
config.apiUrl = '/other';  // silently fails (throws in strict mode)
console.log(config.apiUrl); // still '/api'`,
    },
    {
      label: 'Currying & Partial Application',
      language: 'typescript',
      code: `// ── Manual curry ─────────────────────────────────────────────────────
const add = a => b => a + b;
const add5 = add(5);    // partially applied
add5(3);  // 8
add5(10); // 15

// ── Generic curry utility ─────────────────────────────────────────────
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);        // got all args — call fn
    }
    return (...more) => curried(...args, ...more);  // collect more
  };
}

const multiply = curry((a, b, c) => a * b * c);
multiply(2)(3)(4);    // 24
multiply(2, 3)(4);    // 24 — partial application
multiply(2)(3, 4);    // 24
multiply(2, 3, 4);    // 24 — all at once

// ── Specialized functions from general ones ───────────────────────────
const double  = multiply(2);
const triple  = multiply(3);
const sixTimes = multiply(2)(3);

double(5);   // 10
triple(5);   // 15
sixTimes(5); // 30

// ── Partial application with bind ─────────────────────────────────────
function fetchResource(baseUrl, endpoint, id) {
  return fetch(\`\${baseUrl}\${endpoint}/\${id}\`);
}

const fetchUsers = fetchResource.bind(null, '/api', '/users');
fetchUsers(42);    // GET /api/users/42
fetchUsers(99);    // GET /api/users/99

// ── Real-world: curried event handler ────────────────────────────────
const handleFieldChange = field => event => {
  setState(prev => ({ ...prev, [field]: event.target.value }));
};
// <input onChange={handleFieldChange('username')} />
// <input onChange={handleFieldChange('email')} />`,
    },
    {
      label: 'Compose & Pipe',
      language: 'typescript',
      code: `// ── pipe: left-to-right (most readable) ─────────────────────────────
const pipe = (...fns) => x => fns.reduce((v, fn) => fn(v), x);

// ── compose: right-to-left (mathematical) ────────────────────────────
const compose = (...fns) => x => fns.reduceRight((v, fn) => fn(v), x);

// ── Building a data pipeline ──────────────────────────────────────────
const trim        = str => str.trim();
const toLowerCase = str => str.toLowerCase();
const removeSpaces = str => str.replace(/\\s+/g, '-');
const addPrefix   = prefix => str => \`\${prefix}-\${str}\`;

const slugify = pipe(trim, toLowerCase, removeSpaces, addPrefix('post'));
slugify('  Hello World  ');  // "post-hello-world"

// ── Compose async functions with promise chain ────────────────────────
const pipeAsync = (...fns) => x => fns.reduce(
  (promise, fn) => promise.then(fn),
  Promise.resolve(x)
);

const processUser = pipeAsync(
  fetchUser,
  validateUser,
  enrichWithPermissions,
  formatForDisplay,
);

processUser(userId).then(console.log).catch(console.error);

// ── Point-free style ─────────────────────────────────────────────────
const users = [
  { name: 'Alice', active: true, score: 85 },
  { name: 'Bob',   active: false, score: 92 },
  { name: 'Carol', active: true, score: 78 },
];

// With explicit arg
const getActiveScores = users => users
  .filter(u => u.active)
  .map(u => u.score);

// Point-free (each step is a reusable function)
const isActive   = u => u.active;
const getScore   = u => u.score;
const filterActive = arr => arr.filter(isActive);
const mapScore     = arr => arr.map(getScore);

const getActiveScoresPF = pipe(filterActive, mapScore);
getActiveScoresPF(users);  // [85, 78]`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating input arrays/objects in "functional" code',
      wrong: `function addTag(user, tag) {
  user.tags.push(tag);   // mutates the original object!
  return user;
}`,
      right: `function addTag(user, tag) {
  return { ...user, tags: [...user.tags, tag] };  // new object, new array
}`,
      explanation: 'Returning the mutated object tricks callers into thinking it\'s pure. Any code holding a reference to the original will see the change, causing subtle bugs. Always spread/slice/filter to produce new values.',
    },
    {
      title: 'Treating shallow-frozen objects as deeply immutable',
      wrong: `const state = Object.freeze({ user: { name: 'Alice' } });
state.user.name = 'Bob';    // works! Object.freeze is shallow
console.log(state.user.name); // "Bob"`,
      right: `function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = obj[name];
    if (val && typeof val === 'object') deepFreeze(val);
  });
  return Object.freeze(obj);
}
const state = deepFreeze({ user: { name: 'Alice' } });`,
      explanation: 'Object.freeze only prevents reassigning properties on the top-level object. Nested objects are still mutable. Deep freeze recursively or use Immer for truly immutable updates.',
    },
    {
      title: 'Over-currying when plain functions are clearer',
      wrong: `const getFullName = firstName => lastName => \`\${firstName} \${lastName}\`;
getFullName('Alice')('Smith');  // confusing at call sites`,
      right: `const getFullName = (firstName, lastName) => \`\${firstName} \${lastName}\`;
// Curry only when partial application is genuinely useful:
const greetAlice = getFullName.bind(null, 'Alice');`,
      explanation: 'Currying adds cognitive overhead. Only curry when you genuinely need partial application — when creating specialized functions from general ones, or when functions feed into pipelines.',
    },
    {
      title: 'Missing the return in pipe/compose chain (void functions)',
      wrong: `const process = pipe(
  data => { validate(data); },      // forgot return!
  data => transform(data),
);
process(input);  // transform receives undefined`,
      right: `const process = pipe(
  data => { validate(data); return data; },  // pass data through
  data => transform(data),
);`,
      explanation: 'Each stage in a pipe must return the value for the next stage. Arrow functions with curly braces require an explicit return. Void functions break the pipeline by passing undefined to the next step.',
    },
  ];

  challenge: Challenge = {
    title: 'Build pipe() and curry()',
    language: 'typescript',
    description: 'Implement two utility functions:\n1. `pipe(...fns)` — returns a function that passes its argument through each fn left-to-right\n2. `curry(fn)` — returns a curried version that collects args until fn.length is satisfied\n\nThen use them to build a data transformation pipeline.',
    hints: [
      'pipe: reduce over fns with initial value = x',
      'curry: compare args.length to fn.length; if enough, call fn; else return a function to collect more',
      'Use ...rest spreading to collect multiple args across calls',
      'Test: curry((a,b,c) => a+b+c)(1)(2,3) should equal 6',
    ],
    starterCode: `function pipe(...fns) {
  // your implementation
}

function curry(fn) {
  // your implementation
}

// Test pipe
const process = pipe(
  x => x * 2,
  x => x + 10,
  x => \`Result: \${x}\`
);
console.log(process(5));  // "Result: 20"

// Test curry
const add3 = curry((a, b, c) => a + b + c);
console.log(add3(1)(2)(3));   // 6
console.log(add3(1, 2)(3));   // 6
console.log(add3(1)(2, 3));   // 6`,
    solution: `function pipe(...fns) {
  return x => fns.reduce((v, fn) => fn(v), x);
}

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What makes a function "pure"?',
      options: [
        'It only uses const variables',
        'Same inputs always produce same output AND no side effects',
        'It doesn\'t use loops',
        'It\'s defined with an arrow function',
      ],
      answer: 1,
      explanation: 'A pure function: (1) is deterministic — same inputs always give same output, and (2) has no side effects — doesn\'t modify external state, make network calls, or produce observable changes outside its return value.',
    },
    {
      q: 'What is currying?',
      options: [
        'Adding spice to functions for flavor',
        'Transforming f(a,b,c) into f(a)(b)(c) — one argument at a time',
        'Combining two functions into one',
        'Memoizing a function\'s results',
      ],
      answer: 1,
      explanation: 'Currying transforms a multi-argument function into a sequence of single-argument functions. f(a,b,c) becomes f(a)(b)(c). Enables partial application: const double = multiply(2) — a specialized version of a general function.',
    },
    {
      q: 'What is the difference between pipe() and compose()?',
      options: [
        'pipe goes right-to-left; compose goes left-to-right',
        'pipe goes left-to-right; compose goes right-to-left',
        'They are identical',
        'compose only works with async functions',
      ],
      answer: 1,
      explanation: 'pipe(f, g, h)(x) = h(g(f(x))) — left-to-right, data flows top-to-bottom. compose(f, g, h)(x) = f(g(h(x))) — right-to-left, mathematical notation. pipe is more readable for data transformation pipelines.',
    },
    {
      q: 'What is referential transparency?',
      options: ['An object that refers to itself', 'An expression that can be replaced by its result without changing program behavior', 'A transparent proxy', 'A type that exposes its internals'],
      answer: 1,
      explanation: 'A referentially transparent expression always evaluates to the same value and has no side effects, so you can safely substitute it with its result anywhere in the code. Pure functions are referentially transparent. This property enables memoization, caching, and safe refactoring.',
    },
    {
      q: 'What is point-free style in functional programming?',
      options: ['Functions with no arguments', 'Defining functions by composing others without mentioning the data argument', 'Functions that return void', 'A style that avoids semicolons'],
      answer: 1,
      explanation: 'Point-free (tacit) style defines functions by composing existing functions without explicitly naming the data they operate on. Example: const getNames = map(prop("name")) — no explicit x => ... The function is defined purely as a composition. It is concise but can become unreadable when overused.',
    },
    {
      q: 'What is an algebraic data type (ADT) and how does it appear in JavaScript?',
      options: ['A type from a math library', 'A type formed by combining other types (product types and sum types)', 'Only available in TypeScript', 'A type for database queries'],
      answer: 1,
      explanation: 'ADTs are composable type structures. A <strong>product type</strong> (AND — object/tuple: has field A AND field B). A <strong>sum type</strong> (OR — discriminated union: is either A OR B). In JS/TS, discriminated unions model sum types: { kind: "ok"; value: T } | { kind: "err"; error: E }. Libraries like fp-ts formalise Option, Result, and Either as ADTs.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is a functor?',
      a: 'A functor is any container that implements <code>map(fn)</code> — it applies <code>fn</code> to the value inside and returns a new container of the same type. Arrays are the most familiar functor. Promises, Options, Results, and Observables are also functors. The key rule: <code>map</code> must preserve the container structure and compose correctly.',
    },
    {
      q: 'Is functional programming better than OOP in JavaScript?',
      a: 'They\'re complementary, not competing. JavaScript supports both. Functional programming shines for data transformation, pure business logic, and state management (Redux is functional). OOP shines for modeling complex entities with behavior and encapsulated state. Most real JavaScript mixes both: classes with functional methods, or functional pipelines that create class instances. Use what fits the problem.',
    },
    {
      q: 'What is a monad (simply)?',
      a: 'A monad is a functor that also has <code>flatMap/chain</code> (called <code>.then</code> in Promises). The key difference from a plain functor: flatMap flattens one level, preventing nested containers. Without it, <code>Promise.then(fn)</code> where fn returns another Promise would give you <code>Promise&lt;Promise&lt;T&gt;&gt;</code>. flatMap auto-unwraps the inner container.',
    },
    {
      q: 'What is currying and how does it differ from partial application?',
      a: '<strong>Currying</strong> transforms a function of N args into a chain of N single-argument functions: <code>add(a)(b)</code>. It is a structural transformation — the function is always called one arg at a time. <strong>Partial application</strong> fixes some args to produce a function with fewer args: <code>add5 = add.bind(null, 5)</code>. Currying enables point-free style and function composition; partial application is more pragmatic for quick specialization.',
    },
    {
      q: 'How does immutability help with debugging and concurrent programming?',
      a: 'Immutable data cannot be changed after creation — every update produces a new value. This means you can log a value and trust it won\'t change later (no time-of-log vs time-of-inspection confusion). In concurrent JavaScript (Workers, async), immutable data passed via <code>postMessage</code> as a structured clone is safe — no shared mutable state, no race conditions. Libraries like Immer give you a mutable-looking API that produces immutable output.',
    },
    {
      q: 'What is a lens in functional programming?',
      a: 'A lens is a composable abstraction for getting and setting a value deep inside an immutable data structure. It has two operations: <code>view(lens, obj)</code> (get) and <code>set(lens, value, obj)</code> (produce a new object with the value changed). Lenses compose: <code>compose(nameLens, firstLens)</code> zooms into a nested field. Libraries like Ramda provide lens implementations. They replace verbose spread-based nested updates.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Functional JS: pure functions (deterministic, no side effects) + immutability (spread/filter, never mutate) + currying (one-arg-at-a-time for partial application) + pipe/compose (combine small functions into pipelines).',
    mustKnow: [
      'Pure function: same inputs → same output, zero side effects',
      'Immutability: spread to update — [...arr, x], {...obj, key: val}',
      'Curry: f(a)(b)(c) — collect args until fn.length is met',
      'Partial application: pre-fill args via bind or curry',
      'pipe: left-to-right; compose: right-to-left',
      'Functor: anything with .map() that transforms the value inside',
      'Monad: functor + .flatMap() — auto-flattens nested containers',
    ],
    interviewFocus: [
      'What is a pure function and why is it valuable?',
      'What is currying vs partial application?',
      'Explain pipe() vs compose() with an example',
      'How do you update a deeply nested object immutably?',
    ],
  };
}
