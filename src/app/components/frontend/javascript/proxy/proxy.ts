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
  selector: 'app-js-proxy',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './proxy.html',
  styleUrl: './proxy.scss',
})
export class JsProxy {
  theory: TheoryPoint[] = [
    {
      heading: 'Proxy Fundamentals',
      points: [
        '<code>new Proxy(target, handler)</code> creates a wrapper around <code>target</code> that intercepts operations via <strong>traps</strong> defined in <code>handler</code>. Every operation that isn\'t trapped falls through to the target unchanged.',
        'A <strong>trap</strong> is a method on the handler object with the same name as the operation it intercepts: <code>get</code>, <code>set</code>, <code>has</code>, <code>deleteProperty</code>, <code>apply</code>, <code>construct</code>, <code>ownKeys</code>, <code>defineProperty</code>, <code>getPrototypeOf</code>, and more.',
        'The <strong>get trap</strong> intercepts property reads: <code>get(target, prop, receiver)</code>. The <strong>set trap</strong> intercepts property writes: <code>set(target, prop, value, receiver)</code> — must return <code>true</code> to indicate success.',
        'Proxies are <strong>transparent</strong> — consumers use the proxy exactly as they would the original object. The interception is completely invisible.',
        'Use <code>Reflect</code> methods inside traps to forward operations to the target, preserving correct prototype chain behavior. <code>Reflect.get(target, prop, receiver)</code> is safer than <code>target[prop]</code>.',
      ]
    },
    {
      heading: 'Common Proxy Use Cases',
      points: [
        '<strong>Validation</strong>: intercept <code>set</code> to validate values before they are stored. Throw or return <code>false</code> to reject invalid assignments.',
        '<strong>Reactivity / change tracking</strong>: intercept <code>set</code> to notify observers when state changes. Vue 3\'s reactivity system is built on Proxy. This enables fine-grained dependency tracking.',
        '<strong>Logging & debugging</strong>: intercept <code>get</code> and <code>set</code> to log every property access and mutation — useful for debugging complex objects.',
        '<strong>Default values</strong>: intercept <code>get</code> to return a default when a property is <code>undefined</code>. Build infinite-depth nested object access without null checks.',
        '<strong>Revocable proxies</strong>: <code>Proxy.revocable(target, handler)</code> returns <code>{ proxy, revoke }</code>. After calling <code>revoke()</code>, any access to the proxy throws a TypeError. Useful for capability-based security.',
      ]
    },
    {
      heading: 'Reflect API',
      points: [
        '<code>Reflect</code> is a built-in object (not a constructor) with static methods that mirror every Proxy trap. <code>Reflect.get</code>, <code>Reflect.set</code>, <code>Reflect.has</code>, <code>Reflect.deleteProperty</code>, <code>Reflect.ownKeys</code>, etc.',
        'Always use <code>Reflect</code> inside Proxy traps to forward the operation. Using <code>target[prop]</code> directly can break <code>this</code> binding and prototype-chain traversal in subclasses.',
        '<code>Reflect.set(target, prop, value, receiver)</code> returns <code>true</code>/<code>false</code> — use its return value as the set trap\'s return value.',
        'Outside Proxy, Reflect provides a cleaner, functional API for meta-programming operations that used to require awkward patterns like <code>Object.defineProperty</code> or <code>Function.prototype.apply.call</code>.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'new Proxy(target, handler)',         type: 'syntax',   desc: 'Wrap object with intercepting traps' },
    { name: 'handler.get(target, prop, receiver)', type: 'method',   desc: 'Intercept property reads' },
    { name: 'handler.set(target, prop, val, rec)', type: 'method',   desc: 'Intercept property writes — return true' },
    { name: 'handler.has(target, prop)',           type: 'method',   desc: 'Intercept "in" operator' },
    { name: 'handler.apply(target, thisArg, args)',type: 'method',   desc: 'Intercept function calls' },
    { name: 'handler.construct(target, args)',     type: 'method',   desc: 'Intercept "new" operator' },
    { name: 'Proxy.revocable(target, handler)',    type: 'function', desc: 'Proxy that can be disabled via revoke()' },
    { name: 'Reflect.get(target, prop, receiver)', type: 'method',   desc: 'Forward get trap to target correctly' },
    { name: 'Reflect.set(target, prop, val, rec)', type: 'method',   desc: 'Forward set trap to target correctly' },
    { name: 'Reflect.ownKeys(target)',             type: 'method',   desc: 'Get all own property keys including symbols' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Validation & Defaults',
      language: 'typescript',
      code: `// ── Validation proxy ─────────────────────────────────────────────────
function createValidated(schema) {
  return new Proxy({}, {
    set(target, prop, value) {
      const validator = schema[prop];
      if (validator && !validator(value)) {
        throw new TypeError(\`Invalid value for \${String(prop)}: \${value}\`);
      }
      return Reflect.set(target, prop, value);
    },
  });
}

const user = createValidated({
  age:   v => Number.isInteger(v) && v >= 0 && v <= 150,
  email: v => /^[^@]+@[^@]+\\.[^@]+$/.test(v),
  name:  v => typeof v === 'string' && v.length > 0,
});

user.name = 'Alice';       // ok
user.email = 'alice@example.com'; // ok
user.age = 30;             // ok
user.age = -1;             // TypeError: Invalid value for age: -1
user.age = 'old';          // TypeError: Invalid value for age: old

// ── Default values proxy ──────────────────────────────────────────────
function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(t, prop, receiver) {
      const value = Reflect.get(t, prop, receiver);
      return value !== undefined ? value : defaults[prop];
    },
  });
}

const config = withDefaults({ theme: 'dark' }, {
  theme: 'light',
  language: 'en',
  timeout: 5000,
});

console.log(config.theme);    // "dark"   — own value
console.log(config.language); // "en"     — default
console.log(config.timeout);  // 5000     — default`,
    },
    {
      label: 'Reactivity & Logging',
      language: 'typescript',
      code: `// ── Reactive state proxy ─────────────────────────────────────────────
function reactive(obj, onChange) {
  return new Proxy(obj, {
    set(target, prop, value, receiver) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);
      if (result && oldValue !== value) {
        onChange(prop, value, oldValue);
      }
      return result;
    },

    // Also intercept nested objects
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (value && typeof value === 'object') {
        return reactive(value, onChange);  // wrap nested objects too
      }
      return value;
    },
  });
}

const state = reactive({ count: 0, user: { name: 'Alice' } }, (key, next, prev) => {
  console.log(\`[state] \${key}: \${prev} → \${next}\`);
  render(state);
});

state.count++;             // [state] count: 0 → 1
state.user.name = 'Bob';   // [state] name: Alice → Bob

// ── Property access logger ────────────────────────────────────────────
function createLogger(target, label = 'obj') {
  return new Proxy(target, {
    get(t, prop, receiver) {
      if (typeof prop === 'string') {
        console.log(\`[GET] \${label}.\${prop}\`);
      }
      return Reflect.get(t, prop, receiver);
    },
    set(t, prop, value, receiver) {
      console.log(\`[SET] \${label}.\${String(prop)} = \`, value);
      return Reflect.set(t, prop, value, receiver);
    },
    deleteProperty(t, prop) {
      console.log(\`[DEL] \${label}.\${String(prop)}\`);
      return Reflect.deleteProperty(t, prop);
    },
  });
}

const logged = createLogger({ x: 1, y: 2 }, 'point');
logged.x;           // [GET] point.x
logged.z = 3;       // [SET] point.z = 3
delete logged.y;    // [DEL] point.y`,
    },
    {
      label: 'Apply Trap & Revocable',
      language: 'typescript',
      code: `// ── apply trap — intercept function calls ────────────────────────────
function withCallLogging(fn) {
  return new Proxy(fn, {
    apply(target, thisArg, args) {
      console.log(\`\${target.name}(\${args.join(', ')})\`);
      const result = Reflect.apply(target, thisArg, args);
      console.log(\`→ \${result}\`);
      return result;
    },
  });
}

const add = withCallLogging((a, b) => a + b);
add(2, 3);   // add(2, 3) → 5

// ── Memoize via proxy ─────────────────────────────────────────────────
function memoizeProxy(fn) {
  const cache = new Map();
  return new Proxy(fn, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = Reflect.apply(target, thisArg, args);
      cache.set(key, result);
      return result;
    },
  });
}

const expFib = memoizeProxy(function fib(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});

// ── Revocable proxy — capability-based security ───────────────────────
function createTempAccess(resource, ttlMs) {
  const { proxy, revoke } = Proxy.revocable(resource, {
    get(target, prop, receiver) {
      console.log(\`[access] \${String(prop)}\`);
      return Reflect.get(target, prop, receiver);
    },
  });

  // Auto-revoke after ttl
  setTimeout(() => {
    revoke();
    console.log('[access] Proxy revoked — no more access');
  }, ttlMs);

  return proxy;
}

const tempDB = createTempAccess(database, 60_000);  // 60s access window
tempDB.query('SELECT * FROM users');  // ok
// after 60s: tempDB.query(...) → TypeError: Cannot perform 'get' on a revoked proxy

// ── construct trap — intercept "new" ─────────────────────────────────
const TrackedClass = new Proxy(MyClass, {
  construct(target, args, newTarget) {
    console.log(\`new \${target.name}(\${args.join(', ')})\`);
    return Reflect.construct(target, args, newTarget);
  },
});
new TrackedClass(42);  // new MyClass(42)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to return true from the set trap',
      wrong: `const proxy = new Proxy({}, {
  set(target, prop, value) {
    target[prop] = value;
    // forgot return true!
  }
});
proxy.x = 1;  // TypeError: 'set' on proxy returned false`,
      right: `const proxy = new Proxy({}, {
  set(target, prop, value, receiver) {
    return Reflect.set(target, prop, value, receiver);  // returns true/false
  }
});`,
      explanation: 'The set trap must return true to indicate success. If it returns a falsy value (including undefined), a TypeError is thrown in strict mode. Always use Reflect.set() which returns the correct boolean.',
    },
    {
      title: 'Using target[prop] instead of Reflect.get in traps',
      wrong: `const proxy = new Proxy(target, {
  get(target, prop) {
    return target[prop];   // breaks "this" for inherited methods
  }
});`,
      right: `const proxy = new Proxy(target, {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);  // correct "this" binding
  }
});`,
      explanation: 'target[prop] ignores the receiver (the proxy), breaking "this" for getters and inherited methods that expect "this" to be the proxy. Reflect.get(target, prop, receiver) passes the correct context.',
    },
    {
      title: 'Creating a new proxy wrapper on every nested property access',
      wrong: `// In a reactive proxy — wrapping on every get:
get(target, prop, receiver) {
  const val = Reflect.get(target, prop, receiver);
  return typeof val === 'object' ? new Proxy(val, handler) : val;
  // Creates a NEW proxy object every time — breaks referential equality!
}`,
      right: `const proxyCache = new WeakMap();
get(target, prop, receiver) {
  const val = Reflect.get(target, prop, receiver);
  if (!val || typeof val !== 'object') return val;
  if (!proxyCache.has(val)) proxyCache.set(val, new Proxy(val, handler));
  return proxyCache.get(val);  // same proxy instance every time
}`,
      explanation: 'Creating a new Proxy on every get means two reads of the same nested object return different proxy instances. Use a WeakMap to cache proxies by their target — same target → same proxy.',
    },
    {
      title: 'Proxying non-configurable properties incorrectly',
      wrong: `const frozen = Object.freeze({ x: 1 });
const proxy = new Proxy(frozen, {
  get(target, prop) { return 42; }  // invariant violation!
});
proxy.x;  // TypeError: invariant violation`,
      right: `// Don't lie about non-configurable, non-writable properties
const proxy = new Proxy(frozen, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    return typeof val === 'number' ? val * 2 : val;  // can transform, but must match type
  }
});`,
      explanation: 'Proxy traps must respect Object invariants. For non-configurable, non-writable own properties, the get trap must return the actual property value — returning a different value throws a TypeError.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Type-Safe Config Proxy',
    language: 'typescript',
    description: 'Build `createConfig(defaults)` that returns a proxy where:\n- Getting an undefined property returns the default value (not undefined)\n- Setting a property validates it matches the type of the default\n- Getting a nested object also wraps it with the same behavior\n- `config.$raw` returns the plain underlying object (special escape hatch)',
    hints: [
      'Intercept get: check if prop === "$raw" first, then default lookup',
      'Intercept set: typeof value !== typeof defaults[prop] → throw TypeError',
      'For nested objects in get, recursively call createConfig on them',
      'Store actual data in a separate plain object, not the proxy',
    ],
    starterCode: `function createConfig(defaults) {
  const data = {};
  // your proxy implementation
}

const config = createConfig({ timeout: 5000, debug: false, db: { host: 'localhost', port: 5432 } });

config.timeout = 3000;      // ok — number
config.timeout = '3s';      // TypeError: expected number
config.debug = true;        // ok — boolean
console.log(config.retries); // undefined → returns default (not in defaults, so undefined)
console.log(config.timeout); // 3000
console.log(config.$raw);    // { timeout: 3000, debug: true }`,
    solution: `function createConfig(defaults) {
  const data = {};
  return new Proxy(data, {
    get(target, prop, receiver) {
      if (prop === '$raw') return { ...target };
      const val = Reflect.get(target, prop, receiver);
      if (val !== undefined) {
        return val && typeof val === 'object' ? createConfig(val) : val;
      }
      const def = defaults[prop];
      return def && typeof def === 'object' ? createConfig(def) : def;
    },
    set(target, prop, value, receiver) {
      const def = defaults[prop];
      if (def !== undefined && typeof value !== typeof def) {
        throw new TypeError(\`Expected \${typeof def} for "\${String(prop)}", got \${typeof value}\`);
      }
      return Reflect.set(target, prop, value, receiver);
    },
  });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What must the set trap return to indicate a successful write?',
      options: ['undefined', 'The new value', 'true', 'The target object'],
      answer: 2,
      explanation: 'The set trap must return true to signal success. Returning a falsy value (false, undefined, 0) causes a TypeError in strict mode. Reflect.set() returns this boolean automatically.',
    },
    {
      q: 'Why use Reflect.get(target, prop, receiver) instead of target[prop]?',
      options: [
        'Reflect.get is faster',
        'target[prop] throws for undefined properties',
        'Reflect.get passes the correct "this" (receiver) for getters and prototype methods',
        'They are identical — just style preference',
      ],
      answer: 2,
      explanation: 'target[prop] loses the receiver context. For getters and inherited methods that use "this", the receiver (the proxy itself) must be passed so "this" refers to the proxy, not the target. Reflect.get forwards receiver correctly.',
    },
    {
      q: 'What does Proxy.revocable() return?',
      options: [
        'A frozen proxy',
        '{ proxy, revoke } — proxy can be disabled by calling revoke()',
        'A proxy that expires after one use',
        'A weak reference to the proxy',
      ],
      answer: 1,
      explanation: 'Proxy.revocable() returns { proxy, revoke }. The proxy works normally until revoke() is called. After revocation, any operation on the proxy throws a TypeError. Useful for granting then revoking access to a resource.',
    },
    {
      q: 'Which trap intercepts function calls on a proxied function?',
      options: ['call', 'invoke', 'apply', 'execute'],
      answer: 2,
      explanation: 'The apply trap intercepts calls to a proxied function: handler.apply(target, thisArg, argumentsList). It corresponds to Function.prototype.apply and Reflect.apply.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Proxy and Object.defineProperty?',
      a: '<code>Object.defineProperty</code> intercepts a specific, named property on one object — powerful but static. <code>Proxy</code> intercepts ALL operations on the entire object, including properties that don\'t exist yet (<code>get</code> for missing keys), array length changes, and function calls. Proxy is more powerful and the basis for Vue 3\'s reactivity (Vue 2 used defineProperty and couldn\'t detect array mutations or new properties).',
    },
    {
      q: 'Can you proxy an array?',
      a: 'Yes. Arrays are objects. You can proxy array access (<code>get</code> intercepts index reads and method calls), mutations (<code>set</code> intercepts index writes and length changes), and iteration (<code>ownKeys</code>). Vue 3 uses Proxy on arrays to track mutations like <code>push</code>, <code>pop</code>, and index assignments automatically.',
    },
    {
      q: 'What are Proxy invariants?',
      a: 'Invariants are rules Proxy traps must not violate — they protect JavaScript\'s fundamental guarantees. For example: the get trap must return the actual value for non-configurable, non-writable properties; the set trap must return false if the property is non-writable; the has trap must return true for non-configurable own properties. Violating invariants throws a TypeError to prevent security bypasses.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Proxy wraps an object with traps that intercept operations (get/set/apply/construct); always use Reflect.method() inside traps to forward correctly; set trap must return true; revocable proxies enable capability revocation; Vue 3 reactivity is built on Proxy.',
    mustKnow: [
      'new Proxy(target, handler) — handler traps intercept object operations',
      'set trap must return true (use Reflect.set which returns boolean)',
      'Use Reflect.get(target, prop, receiver) not target[prop] — preserves "this"',
      'apply trap intercepts function calls; construct intercepts new',
      'Proxy.revocable() → { proxy, revoke } — revoke disables the proxy',
      'Proxy can intercept non-existent properties (defineProperty cannot)',
      'Cache nested proxies in WeakMap to preserve referential equality',
    ],
    interviewFocus: [
      'What is a Proxy and what problems does it solve over Object.defineProperty?',
      'Why must the set trap return true?',
      'Why use Reflect methods inside Proxy traps?',
      'What is a revocable proxy and when would you use one?',
    ],
  };
}
