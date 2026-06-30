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
  selector: 'app-js-weakrefs',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './weakrefs.html',
  styleUrl: './weakrefs.scss',
})
export class JsWeakrefs {
  theory: TheoryPoint[] = [
    {
      heading: 'WeakRef',
      points: [
        '<code>new WeakRef(target)</code> holds a weak reference to an object — the reference does NOT prevent garbage collection. If no other strong references exist, the GC can collect the target.',
        '<code>weakRef.deref()</code> returns the target if still alive, or <code>undefined</code> if it has been collected. Always check for <code>undefined</code> before using the result.',
        'WeakRef is useful for caching: hold a reference to a large object but allow GC to reclaim it when memory is needed. On next access, re-compute if the ref is dead.',
        'The timing of GC is non-deterministic — you cannot predict WHEN an object will be collected, only that it CAN be. Never write code that depends on a specific GC timing.',
        'WeakRef is ES2021. Available in all modern browsers and Node.js 14.6+.',
      ]
    },
    {
      heading: 'FinalizationRegistry',
      points: [
        '<code>new FinalizationRegistry(callback)</code> lets you register a cleanup callback to run after an object is garbage collected.',
        '<code>registry.register(target, heldValue, unregisterToken)</code> — when <code>target</code> is collected, <code>callback(heldValue)</code> is called. <code>heldValue</code> is the data you want in the cleanup.',
        '<code>registry.unregister(unregisterToken)</code> cancels the registration before GC fires. Useful when you clean up manually (e.g. component unmount) and don\'t want the GC callback to run too.',
        'The callback runs on the event loop after GC — there is no guarantee of when, and it may not run at all in short-lived processes. Do NOT rely on it for critical cleanup.',
        'Common use: releasing external resources (file handles, GPU memory, Web Workers) that JavaScript cannot release automatically.',
      ]
    },
    {
      heading: 'WeakMap & WeakSet',
      points: [
        '<code>WeakMap</code>: keys must be objects (or non-registered symbols). Entries are removed automatically when the key is GC\'d. No <code>.size</code>, no iteration — intentionally opaque.',
        '<code>WeakSet</code>: stores objects weakly. An object can only appear once. No iteration, no size. GC removes entries when the object is collected.',
        'Primary use of WeakMap: associate private data with an object WITHOUT preventing its collection. Better than class fields for truly private per-instance state in some patterns.',
        'WeakMap is also used to store proxy caches (target → proxy), memo caches keyed by object, and DOM-element-to-metadata associations without causing memory leaks.',
        'The key difference from Map: WeakMap keys are weakly held — they do not count as a reference for GC. Map keys are strongly held — objects referenced as Map keys cannot be collected.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'new WeakRef(obj)',              type: 'syntax',   desc: 'Hold object without preventing GC' },
    { name: 'weakRef.deref()',               type: 'method',   desc: 'Get target or undefined if collected' },
    { name: 'new FinalizationRegistry(cb)',  type: 'syntax',   desc: 'Run cb(heldValue) when target is GC\'d' },
    { name: 'registry.register(obj, data)',  type: 'method',   desc: 'Register obj; data passed to callback on GC' },
    { name: 'registry.unregister(token)',    type: 'method',   desc: 'Cancel registration before GC fires' },
    { name: 'new WeakMap()',                 type: 'syntax',   desc: 'Object-keyed map — entries GC\'d with key' },
    { name: 'new WeakSet()',                 type: 'syntax',   desc: 'Set of objects — auto-cleaned on GC' },
    { name: 'weakMap.get/set/has/delete',    type: 'method',   desc: 'WeakMap operations (no .size, no iteration)' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'WeakRef Cache',
      language: 'typescript',
      code: `// ── WeakRef-backed cache ─────────────────────────────────────────────
// Caches expensive objects but allows GC to reclaim them when needed
class WeakCache {
  #store = new Map();   // key → WeakRef<value>

  set(key, value) {
    this.#store.set(key, new WeakRef(value));
  }

  get(key) {
    const ref = this.#store.get(key);
    if (!ref) return undefined;

    const value = ref.deref();
    if (value === undefined) {
      this.#store.delete(key);   // clean up dead entry
      return undefined;
    }
    return value;
  }

  has(key) { return this.get(key) !== undefined; }
}

// Usage: cache large render outputs
const cache = new WeakCache();

function getProcessedImage(id) {
  const cached = cache.get(id);
  if (cached) return cached;          // alive in memory — reuse

  const image = processImage(id);     // expensive operation
  cache.set(id, image);
  return image;
}
// When memory is tight, GC can collect processed images
// — next request will reprocess (cache miss is acceptable)

// ── Simpler WeakRef use ────────────────────────────────────────────────
class ComponentRegistry {
  #refs = new Map();  // id → WeakRef<Component>

  register(id, component) {
    this.#refs.set(id, new WeakRef(component));
  }

  getById(id) {
    return this.#refs.get(id)?.deref();  // undefined if collected
  }

  broadcast(event) {
    for (const [id, ref] of this.#refs) {
      const comp = ref.deref();
      if (comp) {
        comp.handleEvent(event);
      } else {
        this.#refs.delete(id);  // prune dead refs
      }
    }
  }
}`,
    },
    {
      label: 'FinalizationRegistry',
      language: 'typescript',
      code: `// ── Release external resources on GC ────────────────────────────────
const resourceRegistry = new FinalizationRegistry(({ id, resourceId }) => {
  console.log(\`[GC] Object \${id} collected — releasing resource \${resourceId}\`);
  externalSystem.release(resourceId);
});

class ManagedResource {
  #resourceId;
  #token = {};   // unique object used as unregister token

  constructor(id) {
    this.#resourceId = externalSystem.acquire(id);
    // Register THIS object; when it's GC'd, release the external resource
    resourceRegistry.register(this, { id, resourceId: this.#resourceId }, this.#token);
  }

  use() { return externalSystem.read(this.#resourceId); }

  // Explicit cleanup (preferred) — also unregisters GC callback
  dispose() {
    externalSystem.release(this.#resourceId);
    resourceRegistry.unregister(this.#token);  // cancel GC callback
  }
}

// Usage
let resource = new ManagedResource('conn-1');
resource.use();
resource.dispose();    // explicit cleanup — unregisters finalization
resource = null;       // GC can now collect (finalization won't double-release)

// ── Track DOM element lifecycle ───────────────────────────────────────
const domTracker = new FinalizationRegistry(id => {
  console.log(\`[GC] Element #\${id} was collected\`);
  analytics.recordElementRemoved(id);
});

function trackElement(el) {
  domTracker.register(el, el.id);
  // When el is GC'd (removed from DOM + no references), analytics fires
}`,
    },
    {
      label: 'WeakMap & WeakSet',
      language: 'typescript',
      code: `// ── WeakMap for private instance data ────────────────────────────────
const _private = new WeakMap();

class BankAccount {
  constructor(owner, balance) {
    _private.set(this, { balance, transactions: [] });
    this.owner = owner;
  }

  deposit(amount) {
    const data = _private.get(this);
    data.balance += amount;
    data.transactions.push({ type: 'deposit', amount });
  }

  get balance() { return _private.get(this).balance; }
  // balance is completely inaccessible outside the class (no way to access _private)
}

const acc = new BankAccount('Alice', 1000);
acc.deposit(500);
console.log(acc.balance);   // 1500
// acc._private → undefined — truly private
// When acc is GC'd, _private entry is automatically removed

// ── WeakMap as proxy cache ────────────────────────────────────────────
const proxyCache = new WeakMap();

function getReactiveProxy(obj, handler) {
  if (proxyCache.has(obj)) return proxyCache.get(obj);
  const proxy = new Proxy(obj, handler);
  proxyCache.set(obj, proxy);
  return proxy;
}
// If obj is GC'd, the WeakMap entry is automatically removed

// ── WeakSet for "visited" tracking ───────────────────────────────────
const processed = new WeakSet();

function processOnce(obj) {
  if (processed.has(obj)) return;   // skip if already processed
  processed.add(obj);
  doExpensiveWork(obj);
  // When obj is GC'd, WeakSet entry is removed — no manual cleanup needed
}

// ── WeakMap vs Map — the key difference ──────────────────────────────
const cache = new Map();
let obj = { data: 'large payload' };
cache.set(obj, 'cached');
obj = null;   // MEMORY LEAK! Map still holds strong reference to the original obj

const weakCache = new WeakMap();
let obj2 = { data: 'large payload' };
weakCache.set(obj2, 'cached');
obj2 = null;  // SAFE — WeakMap doesn't prevent GC; entry is removed automatically`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not checking deref() for undefined before using it',
      wrong: `const ref = new WeakRef(expensiveObject);
// Later...
const obj = ref.deref();
obj.doWork();  // TypeError if obj was GC'd — obj is undefined!`,
      right: `const ref = new WeakRef(expensiveObject);
// Later...
const obj = ref.deref();
if (obj === undefined) {
  // re-compute or skip
  return;
}
obj.doWork();`,
      explanation: 'deref() returns undefined when the object has been garbage collected. Always guard with an undefined check before using the result — the GC can run at any time.',
    },
    {
      title: 'Using FinalizationRegistry for critical cleanup',
      wrong: `const registry = new FinalizationRegistry(conn => conn.close());
class DB {
  constructor() { registry.register(this, this.connection); }
}
// If process exits before GC, connection is never closed!`,
      right: `class DB {
  async dispose() { await this.connection.close(); }
}
// Always call dispose() explicitly — use try/finally or using (TC39 proposal)
const db = new DB();
try { await db.query('...'); }
finally { await db.dispose(); }`,
      explanation: 'FinalizationRegistry callbacks are best-effort — they may not run in short-lived processes, during crashes, or before program exit. Never rely on them for critical resource cleanup. Use explicit dispose() methods.',
    },
    {
      title: 'Trying to iterate a WeakMap or WeakSet',
      wrong: `const wm = new WeakMap();
wm.set(obj1, 'a');
wm.set(obj2, 'b');
for (const [k, v] of wm) { /* ... */ }  // TypeError: wm is not iterable`,
      right: `// WeakMap/WeakSet are intentionally non-iterable
// If you need iteration, use Map/Set instead
// Use WeakMap only when you don't need to enumerate entries`,
      explanation: 'WeakMap and WeakSet have no .size property and are non-iterable by design. Iteration would expose when entries have been GC\'d, which would make GC behavior observable — a security and determinism concern.',
    },
    {
      title: 'Using WeakRef where a regular variable would suffice',
      wrong: `function processData(data) {
  const ref = new WeakRef(data);  // pointless — data is in scope as strong ref
  const obj = ref.deref();
  obj.process();
}`,
      right: `function processData(data) {
  data.process();  // data is already strongly referenced — no WeakRef needed
}
// WeakRef is for when you want to hold an object across async boundaries
// WITHOUT preventing its collection if nothing else needs it`,
      explanation: 'WeakRef is only useful when you hold a reference ACROSS time boundaries (event handlers, long-lived caches) and explicitly want to allow GC. Inside a function where you already have a strong reference, WeakRef adds nothing.',
    },
  ];

  challenge: Challenge = {
    title: 'Weak Event Emitter',
    language: 'typescript',
    description: 'Build a `WeakEmitter` where listeners are held as WeakRefs:\n- `on(event, listener)` — register a listener (held weakly)\n- `emit(event, ...args)` — call all living listeners; prune dead ones\n- `off(event, listener)` — remove a specific listener\n\nDeep design: listeners can be GC\'d without explicit removal.',
    hints: [
      'Store Map<event, Set<WeakRef<fn>>> for listeners',
      'In emit: iterate set, call deref(); skip/delete if undefined',
      'In off: iterate and remove the WeakRef whose deref() === listener',
      'To compare in off, deref() each ref and compare by reference equality',
    ],
    starterCode: `class WeakEmitter {
  // your implementation
}

const emitter = new WeakEmitter();

let handler = (msg) => console.log('Got:', msg);
emitter.on('data', handler);
emitter.emit('data', 'hello');   // Got: hello

handler = null;  // handler can now be GC'd
// After GC: emitter.emit('data', 'world') — nothing fires (dead ref pruned)`,
    solution: `class WeakEmitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(new WeakRef(listener));
  }

  emit(event, ...args) {
    const refs = this.#listeners.get(event);
    if (!refs) return;
    for (const ref of refs) {
      const fn = ref.deref();
      if (fn) fn(...args);
      else refs.delete(ref);
    }
  }

  off(event, listener) {
    const refs = this.#listeners.get(event);
    if (!refs) return;
    for (const ref of refs) {
      if (ref.deref() === listener) { refs.delete(ref); break; }
    }
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does WeakRef.deref() return when the object has been garbage collected?',
      options: ['null', 'false', 'undefined', 'It throws a ReferenceError'],
      answer: 2,
      explanation: 'deref() returns the target object if it is still alive, or undefined if it has been garbage collected. Always check for undefined before using the result.',
    },
    {
      q: 'What is the key difference between WeakMap and Map?',
      options: [
        'WeakMap is faster for lookups',
        'WeakMap keys must be strings; Map keys can be any type',
        'WeakMap keys are held weakly — entries are auto-removed when the key is GC\'d; Map holds keys strongly',
        'WeakMap supports iteration; Map does not',
      ],
      answer: 2,
      explanation: 'WeakMap keys do not count as strong references — if no other reference exists, the key can be GC\'d and the entry is automatically removed. Map holds keys strongly, preventing GC and potentially causing memory leaks.',
    },
    {
      q: 'When does a FinalizationRegistry callback run?',
      options: [
        'Immediately when the object goes out of scope',
        'At the end of the current microtask queue',
        'Non-deterministically after the object is GC\'d — may not run at all',
        'Only when you manually call registry.cleanup()',
      ],
      answer: 2,
      explanation: 'FinalizationRegistry callbacks run at an unspecified time after GC — you cannot predict when, and in short-lived processes they may not run at all. Never use them for critical cleanup; use explicit dispose() patterns.',
    },
    {
      q: 'Why are WeakMap and WeakSet non-iterable?',
      options: [
        'For performance — iteration is too slow',
        'To prevent exposing GC timing — iteration would reveal which entries have been collected',
        'Because they have no .size property',
        'They were designed only for internal browser use',
      ],
      answer: 1,
      explanation: 'If WeakMap were iterable, you could observe WHEN entries disappear — effectively making GC behavior observable. That would make programs non-deterministic and cause security concerns. Non-iterability is intentional.',
    },
    {
      q: 'What does FinalizationRegistry do?',
      options: ['Prevents GC of registered objects', 'Runs a callback after a registered object is garbage collected', 'Tracks all live WeakRefs', 'Flushes WeakMap entries on demand'],
      answer: 1,
      explanation: 'FinalizationRegistry lets you register a callback that fires after an object is garbage collected. The callback receives the registered held value (not the GC\'d object — that is gone). Useful for cleanup tasks like releasing native resources when a JS wrapper is collected.',
    },
    {
      q: 'What is the difference between WeakSet and Set for storing DOM nodes?',
      options: ['WeakSet is faster', 'WeakSet allows nodes to be GC\'d when removed from the DOM; Set keeps them alive', 'Set allows duplicates; WeakSet does not', 'WeakSet is iterable; Set is not'],
      answer: 1,
      explanation: 'A regular Set holding DOM nodes prevents GC — even when nodes are removed from the document, the Set reference keeps them alive (memory leak). WeakSet holds nodes weakly — once a node is detached and has no other references, it can be GC\'d. WeakSet is the right container for "track which elements have been processed" use cases.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I actually use WeakRef?',
      a: 'WeakRef shines in two scenarios: (1) <strong>memory-sensitive caches</strong> — hold expensive-to-compute objects but let GC reclaim them under memory pressure (better than an LRU cache for some cases), and (2) <strong>event emitters with auto-cleanup</strong> — listeners can be GC\'d without explicit removal. For most use cases, strong references with explicit cleanup (using/dispose) are clearer. Avoid WeakRef unless you have a specific GC-sensitive need.',
    },
    {
      q: 'Is WeakMap good for truly private class fields?',
      a: 'WeakMap was the pre-ES2022 pattern for private fields: store per-instance data in a module-level WeakMap. Now that class private fields (<code>#field</code>) are standard, prefer those — they\'re syntactically clear, performant, and enforced at compile time. WeakMap privacy is still useful in some dynamic metaprogramming scenarios where you need to associate data with objects you don\'t own.',
    },
    {
      q: 'Can you use non-object keys in WeakMap?',
      a: 'No (with one exception). WeakMap keys must be objects or non-registered Symbols (ES2023+). Primitives (strings, numbers, booleans) cannot be WeakMap keys. The reason: primitives are value-typed and have no identity — the GC cannot track "this specific string" going out of scope. Objects have identity, which is what makes weak references meaningful.',
    },
    {
      q: 'When would you choose WeakRef over WeakMap for caching?',
      a: 'Use <code>WeakRef</code> when you want to optionally hold onto a value and the cache key is the value itself (self-referential or keyed by something else). Use <code>WeakMap</code> when you want to associate extra data with an object key. Example: a DOM node → computed style cache → use WeakMap (key is the node, value is derived data). An optional memoised result cache → use WeakRef on the result. If unsure, WeakMap is almost always the cleaner choice.',
    },
    {
      q: 'How does FinalizationRegistry differ from WeakRef, and why is it considered unreliable for critical cleanup logic?',
      a: 'FinalizationRegistry lets you register a callback to run after an object has been garbage collected, useful for releasing associated external resources (closing a file handle tied to a JS wrapper object). The spec explicitly does NOT guarantee the callback will ever run — the engine may delay it indefinitely, batch it, or skip it entirely if the process exits first. This makes it unsuitable for anything requiring deterministic cleanup (closing database connections, releasing locks) — use explicit dispose patterns or try/finally for guaranteed cleanup, reserving FinalizationRegistry purely as a best-effort backstop or for development-time leak detection.',
    },
    {
      q: 'Why can holding a WeakRef to an object still prevent garbage collection if you are not careful?',
      a: 'A WeakRef itself does not prevent collection — but if your code also holds any STRONG reference to the same object elsewhere (a variable, a closure, an array), that strong reference keeps the object alive regardless of any WeakRefs pointing to it. A common mistake is creating a WeakRef expecting it to enable collection, while a forgotten strong reference (e.g., still captured in an event listener closure that was never removed) silently keeps the object alive — WeakRef only matters once ALL strong references to the object are gone.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'WeakRef holds objects without preventing GC — always check deref() for undefined; FinalizationRegistry runs cleanup after GC (non-deterministic, not for critical paths); WeakMap/WeakSet hold entries weakly so they auto-delete when keys are collected.',
    mustKnow: [
      'WeakRef.deref() returns undefined if object was GC\'d — always check',
      'GC timing is non-deterministic — never depend on it for correctness',
      'FinalizationRegistry: cleanup callback fires after GC — best-effort only',
      'WeakMap: object keys held weakly — entries auto-removed on GC; no iteration',
      'WeakSet: holds objects weakly — no size, no iteration, auto-cleaned',
      'WeakMap vs Map: WeakMap doesn\'t prevent GC of keys; Map holds keys strongly',
      'Use explicit dispose() for critical cleanup; WeakRef for optional caching only',
    ],
    interviewFocus: [
      'What is the difference between WeakRef and a regular reference?',
      'When would you use FinalizationRegistry?',
      'Why is WeakMap non-iterable?',
      'WeakMap vs Map — when to use each?',
    ],
  };
}
