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
  selector: 'app-js-patterns',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './patterns.html',
  styleUrl: './patterns.scss',
})
export class JsPatterns {
  theory: TheoryPoint[] = [
    {
      heading: 'Creational Patterns',
      points: [
        '<strong>Singleton</strong>: ensures only one instance exists. In ESM, a module that exports an object literal IS already a singleton (evaluated once). Explicit singleton: use a module-level variable with a getter.',
        '<strong>Factory</strong>: a function that creates and returns objects without <code>new</code>. Useful when the exact type of object created may vary, or when you want to encapsulate creation logic.',
        '<strong>Builder</strong>: constructs complex objects step by step with a fluent API. Each method returns <code>this</code> to enable chaining. <code>build()</code> produces the final object.',
        '<strong>Object Pool</strong>: reuse expensive objects (WebGL buffers, DB connections) instead of creating and destroying them. Maintain a pool of available instances.',
      ]
    },
    {
      heading: 'Structural Patterns',
      points: [
        '<strong>Module pattern</strong>: uses closures (IIFE or class) to create private state and a public API. The foundation of encapsulation in JavaScript.',
        '<strong>Mixin</strong>: compose behaviors by copying methods from multiple source objects onto a target. Avoids deep inheritance hierarchies. Use <code>Object.assign(target, mixin1, mixin2)</code>.',
        '<strong>Decorator</strong>: wrap a function or object to extend its behavior without modifying it. Compose decorators to add logging, caching, retry, auth, and validation.',
        '<strong>Proxy pattern</strong>: intercept operations (get, set, call) on an object using <code>new Proxy(target, handler)</code>. Used for validation, logging, reactive systems, and lazy loading.',
      ]
    },
    {
      heading: 'Behavioral Patterns',
      points: [
        '<strong>Observer</strong>: objects subscribe to events/state changes. Decouples publishers from subscribers. Native <code>EventTarget</code> is the browser\'s built-in Observer. Also: RxJS Observables.',
        '<strong>Strategy</strong>: encapsulate interchangeable algorithms. Pass a function (the strategy) instead of hard-coding behavior. Enables runtime behavior switching.',
        '<strong>Command</strong>: encapsulate an action as an object — includes execute, undo, and redo. Enables action queues, history, and macro recording.',
        '<strong>Middleware/Pipeline</strong>: chain functions where each receives a value and a <code>next</code> function. Express.js middleware, Redux middleware, and Angular interceptors all use this pattern.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Singleton',   type: 'keyword', desc: 'One instance — ESM module exports are singletons by default' },
    { name: 'Factory',     type: 'keyword', desc: 'Function that creates objects — no new keyword at call site' },
    { name: 'Builder',     type: 'keyword', desc: 'Fluent step-by-step construction, .build() produces result' },
    { name: 'Mixin',       type: 'keyword', desc: 'Copy methods from multiple sources onto one object' },
    { name: 'Decorator',   type: 'keyword', desc: 'Wrap function/object to extend behavior without modifying' },
    { name: 'Observer',    type: 'keyword', desc: 'Subscribe to changes — EventTarget, callbacks, RxJS' },
    { name: 'Strategy',    type: 'keyword', desc: 'Inject algorithm as a function — swap behavior at runtime' },
    { name: 'Middleware',  type: 'keyword', desc: 'fn(value, next) chain — each handler passes to next' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Factory & Builder',
      language: 'typescript',
      code: `// ── Factory function ─────────────────────────────────────────────────
function createUser(name, role = 'viewer') {
  // Private state via closure
  let loginCount = 0;

  return {
    name,
    role,
    login() { loginCount++; },
    getLoginCount() { return loginCount; },
    toJSON() { return { name, role, loginCount }; },
  };
}

const alice = createUser('Alice', 'admin');
alice.login();
console.log(alice.getLoginCount()); // 1
// No loginCount exposed directly — truly private

// ── Builder pattern with fluent API ──────────────────────────────────
class QueryBuilder {
  #table = '';
  #conditions = [];
  #columns = ['*'];
  #limitVal = null;
  #orderCol = null;

  from(table)         { this.#table = table; return this; }
  select(...cols)     { this.#columns = cols; return this; }
  where(condition)    { this.#conditions.push(condition); return this; }
  limit(n)            { this.#limitVal = n; return this; }
  orderBy(col)        { this.#orderCol = col; return this; }

  build() {
    let sql = \`SELECT \${this.#columns.join(', ')} FROM \${this.#table}\`;
    if (this.#conditions.length) sql += \` WHERE \${this.#conditions.join(' AND ')}\`;
    if (this.#orderCol) sql += \` ORDER BY \${this.#orderCol}\`;
    if (this.#limitVal)  sql += \` LIMIT \${this.#limitVal}\`;
    return sql;
  }
}

const query = new QueryBuilder()
  .from('users')
  .select('id', 'name', 'email')
  .where('active = 1')
  .where('role = "admin"')
  .orderBy('name')
  .limit(20)
  .build();

// SELECT id, name, email FROM users WHERE active = 1 AND role = "admin" ORDER BY name LIMIT 20`,
    },
    {
      label: 'Decorator & Mixin',
      language: 'typescript',
      code: `// ── Function decorator — adds logging ────────────────────────────────
function withLogging(fn) {
  return function(...args) {
    console.log(\`→ \${fn.name}(\${args.join(', ')})\`);
    const result = fn.apply(this, args);
    console.log(\`← \${fn.name} =\`, result);
    return result;
  };
}

// ── Function decorator — adds caching (memoize) ───────────────────────
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// ── Stacking decorators ───────────────────────────────────────────────
function expensiveCalc(n) { /* ... */ return n * n; }
const optimized = withLogging(memoize(expensiveCalc));
optimized(10);  // logs + caches
optimized(10);  // logs + hits cache (no recalc)

// ── Mixin pattern ─────────────────────────────────────────────────────
const Serializable = {
  toJSON() { return JSON.stringify(this); },
  fromJSON(str) { return Object.assign(Object.create(this), JSON.parse(str)); },
};

const Validatable = {
  validate() {
    for (const [key, rule] of Object.entries(this.rules ?? {})) {
      if (!rule(this[key])) throw new Error(\`Invalid field: \${key}\`);
    }
    return true;
  },
};

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.rules = {
      name: v => v?.length > 0,
      email: v => /^[^@]+@[^@]+\\.[^@]+$/.test(v),
    };
  }
}

// Apply mixins
Object.assign(User.prototype, Serializable, Validatable);

const user = new User('Alice', 'alice@example.com');
user.validate();   // true
user.toJSON();     // JSON string`,
    },
    {
      label: 'Strategy & Middleware',
      language: 'typescript',
      code: `// ── Strategy pattern ─────────────────────────────────────────────────
// Inject algorithm as a function — swap without changing the consumer
class Sorter {
  constructor(strategy) { this.strategy = strategy; }
  sort(arr) { return [...arr].sort(this.strategy); }
}

const numericAsc  = (a, b) => a - b;
const numericDesc = (a, b) => b - a;
const byName      = (a, b) => a.name.localeCompare(b.name);

const sorter = new Sorter(numericAsc);
sorter.sort([3, 1, 2]);  // [1, 2, 3]

sorter.strategy = byName;  // swap at runtime
sorter.sort([{ name: 'Bob' }, { name: 'Alice' }]); // [Alice, Bob]

// ── Middleware pipeline ───────────────────────────────────────────────
function createPipeline(...middlewares) {
  return function runPipeline(ctx) {
    let idx = 0;
    function next() {
      const mw = middlewares[idx++];
      if (mw) mw(ctx, next);
    }
    next();
    return ctx;
  };
}

const authMiddleware = (ctx, next) => {
  if (!ctx.user) { ctx.error = 'Unauthorized'; return; }
  next();
};

const logMiddleware = (ctx, next) => {
  console.log(\`[LOG] \${ctx.method} \${ctx.url}\`);
  next();
};

const handlerMiddleware = (ctx, next) => {
  ctx.response = { data: 'Hello ' + ctx.user };
  next();
};

const handle = createPipeline(authMiddleware, logMiddleware, handlerMiddleware);
handle({ method: 'GET', url: '/api', user: 'Alice' });
// [LOG] GET /api → { response: { data: 'Hello Alice' } }

handle({ method: 'GET', url: '/api' });
// { error: 'Unauthorized' }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a class singleton with explicit state — use module-level variable instead',
      wrong: `class Config {
  static instance = null;
  static getInstance() {
    if (!Config.instance) Config.instance = new Config();
    return Config.instance;
  }
}`,
      right: `// config.js — the module IS the singleton (evaluated once)
const config = { theme: 'dark', lang: 'en' };
export default config;

// Anywhere: import config from './config.js' — same object`,
      explanation: 'ESM modules are singletons by definition. A module-level exported object achieves the Singleton pattern without the getInstance() boilerplate. The class-based singleton is a Java pattern that doesn\'t map cleanly to JavaScript.',
    },
    {
      title: 'Deep copying objects in mixin instead of adding to prototype',
      wrong: `function applyMixin(target, mixin) {
  target.prototype = { ...target.prototype, ...mixin };  // breaks prototype chain!
}`,
      right: `function applyMixin(target, mixin) {
  Object.assign(target.prototype, mixin);  // adds methods to existing prototype
}`,
      explanation: 'Replacing prototype with a spread breaks the instanceof chain and loses inherited methods. Object.assign mutates the existing prototype object, correctly extending it.',
    },
    {
      title: 'Forgetting to return "this" in builder methods',
      wrong: `class Builder {
  setName(name) { this.name = name; }  // returns undefined
  build() { return { name: this.name }; }
}
new Builder().setName('Alice').build();  // TypeError: Cannot read properties of undefined`,
      right: `class Builder {
  setName(name) { this.name = name; return this; }  // enables chaining
  build() { return { name: this.name }; }
}
new Builder().setName('Alice').build();  // { name: 'Alice' }`,
      explanation: 'Builder pattern requires each setter to return "this" to enable method chaining. Without it, the next method call is on undefined.',
    },
    {
      title: 'Memoize with object arguments using reference equality',
      wrong: `const memo = memoize(fn);
memo({ id: 1 });  // cached
memo({ id: 1 });  // MISS — different object reference!`,
      right: `function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);  // serialize for value equality
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}`,
      explanation: 'Using object references as cache keys (Map default) means two equal-looking objects are different keys. JSON.stringify gives value-based equality. Note: doesn\'t handle circular refs or functions in args.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Retry Decorator',
    language: 'typescript',
    description: 'Write a `withRetry(fn, maxRetries, delay)` decorator that:\n- Calls `fn(...args)` and returns the result if it succeeds\n- On rejection, waits `delay` ms then retries up to `maxRetries` times\n- After all retries exhausted, throws the last error\n- Works with any async function',
    hints: [
      'Return an async function that calls fn(...args)',
      'Use a for loop: for (let i = 0; i <= maxRetries; i++)',
      'await new Promise(r => setTimeout(r, delay)) for the wait',
      'On the last iteration, re-throw instead of retrying',
    ],
    starterCode: `function withRetry(fn, maxRetries = 3, delay = 500) {
  // your implementation
}

// Test
const flaky = withRetry(async () => {
  if (Math.random() < 0.7) throw new Error('Transient error');
  return 'Success!';
}, 5, 100);

flaky().then(console.log).catch(console.error);`,
    solution: `function withRetry(fn, maxRetries = 3, delay = 500) {
  return async function(...args) {
    let lastError;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (e) {
        lastError = e;
        if (i < maxRetries) await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError;
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the Strategy pattern?',
      options: [
        'A way to create objects without specifying their exact class',
        'Injecting an interchangeable algorithm as a function/object',
        'Observing state changes in another object',
        'Restricting a class to one instance',
      ],
      answer: 1,
      explanation: 'Strategy encapsulates algorithms as interchangeable values (functions in JS). The consumer doesn\'t hardcode the algorithm — it receives it as a parameter or property, enabling runtime behavior switching.',
    },
    {
      q: 'How is the Singleton pattern best achieved in ES Modules?',
      options: [
        'Using a class with a static getInstance() method',
        'Using Object.freeze() on every object',
        'Exporting an object from a module — modules are evaluated once and cached',
        'Using the new keyword only once',
      ],
      answer: 2,
      explanation: 'ESM modules are singletons by specification — they are evaluated once and cached. Any object exported from a module is the same instance everywhere it\'s imported. No getInstance() needed.',
    },
    {
      q: 'What does the Decorator pattern do?',
      options: [
        'Restricts which methods are public',
        'Wraps a function/object to add behavior without modifying the original',
        'Creates a family of related objects',
        'Converts one interface to another',
      ],
      answer: 1,
      explanation: 'A decorator wraps existing functionality and adds new behavior (logging, caching, retry, auth) transparently. The original function/class is unchanged. Decorators compose — stack them to layer behaviors.',
    },
    {
      q: 'What problem does the Facade pattern solve?',
      options: ['Prevents a class from being instantiated more than once', 'Hides a complex subsystem behind a simple interface', 'Allows incompatible interfaces to work together', 'Adds state to a stateless function'],
      answer: 1,
      explanation: 'Facade provides a simplified interface to a complex subsystem. Example: a PaymentFacade.charge() that internally coordinates card tokenisation, fraud check, and ledger update — callers only see one method. Reduces coupling between callers and the complex internals.',
    },
    {
      q: 'What is the Strategy pattern?',
      options: ['Runs code at a set time interval', 'Defines a family of algorithms and makes them interchangeable at runtime', 'Ensures a class has only one instance', 'Notifies subscribers of state changes'],
      answer: 1,
      explanation: 'Strategy encapsulates a family of algorithms (sort by price, sort by name, sort by rating) and makes them swappable without changing the calling code. In JS this is often just a function parameter — passing different comparators to Array.sort() is a Strategy pattern.',
    },
    {
      q: 'When should you use the Factory pattern instead of calling `new` directly?',
      options: ['Never — new is always preferred', 'When the concrete class depends on config, or when you want to abstract instantiation from callers', 'Only in TypeScript', 'When you need exactly two instances'],
      answer: 1,
      explanation: 'Factories are valuable when: the concrete type to create depends on runtime data, construction has complex logic (loading config, pooling resources), or you want to swap implementations without changing call sites. They also make code easier to test — inject a mock factory instead of mocking the constructor.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Mixin and Inheritance?',
      a: 'Inheritance creates an <code>is-a</code> relationship through a prototype chain — a class can only extend one parent. Mixins copy methods from multiple source objects onto a target — composition over inheritance. Mixins enable code reuse across unrelated class hierarchies without the fragility of deep inheritance.',
    },
    {
      q: 'When should I use the Command pattern?',
      a: 'Use Command when you need: (1) undo/redo — each command stores enough state to reverse itself, (2) action history/logging, (3) deferred execution — queue commands to run later, (4) macro commands — group multiple commands into one. Common in editors, game engines, and GUI frameworks.',
    },
    {
      q: 'Is the Observer pattern the same as event emitters?',
      a: 'Yes — event emitters (Node.js EventEmitter), EventTarget (browser), RxJS Observables, and reactive stores (Redux, Zustand) are all Observer implementations. The pattern: publishers emit events, subscribers register callbacks, both sides know nothing about each other beyond the event contract.',
    },
    {
      q: 'What is the Proxy pattern (structural) and how is it different from JavaScript\'s Proxy object?',
      a: 'The Proxy <strong>design pattern</strong> is about providing a substitute object that controls access to another — adding logging, lazy initialisation, or access control. JavaScript\'s <code>Proxy</code> object is a built-in runtime mechanism that intercepts fundamental operations (get, set, call) at the VM level. The design pattern and the language feature solve the same concept but at different layers — the design pattern can be implemented without <code>Proxy</code> objects.',
    },
    {
      q: 'What is the difference between the Strategy pattern and simply passing a function as a parameter?',
      a: 'They are closely related — passing a function IS a lightweight implementation of Strategy in a language with first-class functions like JavaScript. The formal Strategy pattern (with a class per strategy implementing a shared interface) matters more in languages without first-class functions, or when a "strategy" needs to carry meaningful internal state and multiple methods beyond a single callable. In idiomatic JavaScript, a higher-order function parameter (array.sort(compareFn)) is usually the simpler, equally valid expression of the same pattern.',
    },
    {
      q: 'When does the Singleton pattern become an anti-pattern in JavaScript applications?',
      a: 'Singletons introduce global mutable state and hidden dependencies — code anywhere in the app can read or mutate the singleton without it appearing in any function signature, making the codebase harder to reason about and test in isolation (tests can leak state between each other via the shared singleton instance). In module-based JavaScript, a module\'s top-level exported state already behaves like a singleton implicitly — explicitly wrapping it in a "Singleton class" pattern rarely adds value and often signals an opportunity to instead pass dependencies explicitly (dependency injection) for better testability.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Patterns are proven solutions to recurring design problems: Factory creates without new; Builder chains setup; Decorator adds behavior without modification; Strategy injects algorithms; Observer decouples publishers from subscribers; Middleware pipes through a chain of handlers.',
    mustKnow: [
      'Factory: function returning objects — encapsulates creation, enables private state',
      'Builder: fluent API, return this from each method, build() at the end',
      'Decorator: wrap a function/object to add behavior (logging, cache, retry)',
      'Mixin: Object.assign(Target.prototype, mixin) — compose behaviors without inheritance',
      'Strategy: inject algorithm as a function — swap at runtime',
      'Observer: pub/sub — EventTarget, callbacks, RxJS are all Observer',
      'Middleware: fn(ctx, next) chain — each handler can short-circuit or pass on',
    ],
    interviewFocus: [
      'Explain the Factory pattern and when to use it over a class constructor',
      'What is the Decorator pattern and how do you compose decorators?',
      'Strategy vs if/else — when to use each?',
      'How does the Middleware pattern work?',
    ],
  };
}
