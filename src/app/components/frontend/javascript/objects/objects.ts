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
  selector: 'app-js-objects',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './objects.html',
  styleUrl: './objects.scss',
})
export class JsObjects {
  theory: TheoryPoint[] = [
    {
      heading: 'Object Literals & Shorthand',
      points: [
        'Object literals (<code>{}</code>) are the most common way to create objects. ES6 shorthand: <code>{ name, age }</code> instead of <code>{ name: name, age: age }</code>.',
        'Computed property keys: <code>{ [expression]: value }</code> — lets you use variables as property names at construction time.',
        'Method shorthand: <code>{ greet() {} }</code> instead of <code>{ greet: function() {} }</code>. Shorthand methods can use <code>super</code>; function-value properties cannot.',
        'Getter/setter shorthand: <code>get fullName() { return ... }</code> / <code>set fullName(v) { ... }</code> — intercept property reads and writes with functions.',
      ]
    },
    {
      heading: 'Property Descriptors',
      points: [
        'Every property has a descriptor with flags: <code>writable</code> (can be changed), <code>enumerable</code> (shows in for...in/Object.keys), <code>configurable</code> (can be redefined/deleted).',
        '<code>Object.defineProperty(obj, key, descriptor)</code> sets these flags explicitly. All flags default to <code>false</code> when using <code>defineProperty</code>, and <code>true</code> when using literal assignment.',
        '<code>Object.freeze(obj)</code> makes all own properties non-writable and non-configurable, and prevents adding new properties. Shallow — nested objects are not frozen.',
        '<code>Object.seal(obj)</code> prevents adding/deleting properties but existing properties can still be changed.',
      ]
    },
    {
      heading: 'Cloning Objects',
      points: [
        '<strong>Shallow clone:</strong> <code>{ ...obj }</code> or <code>Object.assign({}, obj)</code> copies own enumerable properties one level deep. Nested objects are still shared by reference.',
        '<strong>Deep clone:</strong> <code>structuredClone(obj)</code> (modern, built-in) produces a deep clone handling nested objects, arrays, Dates, Maps, Sets, and circular references.',
        '<code>JSON.parse(JSON.stringify(obj))</code> is a legacy deep-clone hack — it loses <code>undefined</code>, functions, Dates (become strings), <code>Map</code>/<code>Set</code> (become <code>{}</code>), and throws on circular refs.',
        'For complex cloning with custom logic, use a recursive cloner or a library like <code>lodash.cloneDeep</code>.',
      ]
    },
    {
      heading: 'Object Iteration',
      points: [
        '<code>Object.keys(obj)</code> — array of own enumerable string keys (most common).',
        '<code>Object.values(obj)</code> — array of own enumerable values.',
        '<code>Object.entries(obj)</code> — array of <code>[key, value]</code> pairs — great for <code>for...of</code> and <code>map/filter</code> on objects.',
        '<code>Object.fromEntries(pairs)</code> — convert entries array (or Map) back to an object. Pairs well with <code>Object.entries(...).map(...)</code> for object transformations.',
        '<code>for...in</code> iterates all enumerable keys including inherited — almost always use <code>Object.keys()</code> instead.',
      ]
    },
    {
      heading: 'Optional Chaining & Nullish Patterns',
      points: [
        'Optional chaining <code>obj?.prop</code> returns <code>undefined</code> if any part of the chain is <code>null</code>/<code>undefined</code> without throwing. Works for methods (<code>obj?.method()</code>) and computed keys (<code>obj?.[key]</code>).',
        'Combine with nullish coalescing for safe defaults: <code>user?.address?.city ?? "Unknown"</code>.',
        '<code>Object.hasOwn(obj, key)</code> (ES2022) is the modern replacement for <code>obj.hasOwnProperty(key)</code> — works on null-prototype objects where <code>hasOwnProperty</code> is undefined.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Object.keys(obj)',        type: 'method', desc: 'Own enumerable string keys as array' },
    { name: 'Object.values(obj)',      type: 'method', desc: 'Own enumerable values as array' },
    { name: 'Object.entries(obj)',     type: 'method', desc: '[key, value] pairs — great for for...of' },
    { name: 'Object.fromEntries(arr)', type: 'method', desc: 'Convert [key,val] pairs (or Map) back to object' },
    { name: 'Object.assign(t, ...s)',  type: 'method', desc: 'Shallow merge sources into target; returns target' },
    { name: 'Object.freeze(obj)',      type: 'method', desc: 'Prevent property add/change/delete (shallow)' },
    { name: 'structuredClone(obj)',    type: 'method', desc: 'Deep clone — handles nested, Dates, Maps, circular refs' },
    { name: '{ ...obj }',             type: 'syntax', desc: 'Spread — shallow clone / merge objects' },
    { name: 'obj?.prop',              type: 'operator', desc: 'Optional chain — undefined if obj is null/undefined' },
    { name: 'Object.hasOwn(obj, k)',  type: 'method', desc: 'Safe own-property check (works on null-proto objects)' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Object Patterns',
      language: 'typescript',
      code: `// ── Shorthand & computed keys ─────────────────────────────────────────
const name = 'Alice', age = 30;
const user = { name, age };          // shorthand: { name: 'Alice', age: 30 }

const prefix = 'get';
const api = {
  [prefix + 'Name']() { return this.name; },  // computed method name
  [Symbol.toPrimitive]() { return this.name; },
};

// ── Getters & setters ─────────────────────────────────────────────────
const person = {
  _first: 'John',
  _last:  'Doe',
  get fullName() { return \`\${this._first} \${this._last}\`; },
  set fullName(v) { [this._first, this._last] = v.split(' '); },
};

person.fullName;          // "John Doe"
person.fullName = 'Jane Smith';
person._first;            // "Jane"

// ── Object.entries transformation ────────────────────────────────────
const prices = { apple: 1.2, banana: 0.8, cherry: 3.5 };
const discounted = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, +(v * 0.9).toFixed(2)])
);
// { apple: 1.08, banana: 0.72, cherry: 3.15 }`,
    },
    {
      label: 'Cloning',
      language: 'typescript',
      code: `// ── Shallow clone ─────────────────────────────────────────────────────
const src = { a: 1, nested: { b: 2 } };
const shallow = { ...src };

shallow.a = 99;           // doesn't affect src
shallow.nested.b = 99;    // DOES affect src — shared reference!

// ── Deep clone: structuredClone ───────────────────────────────────────
const deep = structuredClone(src);
deep.nested.b = 999;      // src.nested.b still 2 ✓

// Handles complex types:
const complex = {
  date:    new Date(),
  map:     new Map([['key', 'val']]),
  set:     new Set([1, 2, 3]),
  arr:     [1, [2, [3]]],
};
const cloned = structuredClone(complex);
// All deeply copied, types preserved

// Circular refs work too:
const circular = { self: null };
circular.self = circular;
const safeClone = structuredClone(circular);

// ── JSON hack (legacy, avoid) ─────────────────────────────────────────
const jsonClone = JSON.parse(JSON.stringify({ a: 1, b: new Date() }));
// { a: 1, b: "2024-01-01T..." }  — Date became a string!
// undefined, functions → stripped; Map/Set → {}`,
    },
    {
      label: 'Property Descriptors',
      language: 'typescript',
      code: `// ── Object.defineProperty ────────────────────────────────────────────
const config = {};
Object.defineProperty(config, 'MAX_SIZE', {
  value:        100,
  writable:     false,    // can't change
  enumerable:   true,     // shows in Object.keys
  configurable: false,    // can't redefine or delete
});

config.MAX_SIZE = 200;   // silently fails (or throws in strict mode)
console.log(config.MAX_SIZE);  // still 100

// ── Object.freeze ─────────────────────────────────────────────────────
const frozen = Object.freeze({ x: 1, nested: { y: 2 } });
frozen.x = 99;          // silently ignored (or throws in strict mode)
frozen.nested.y = 99;   // WORKS — freeze is shallow!

// Deep freeze utility:
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = obj[name];
    if (typeof val === 'object' && val !== null) deepFreeze(val);
  });
  return Object.freeze(obj);
}

const deepFrozen = deepFreeze({ a: { b: { c: 1 } } });
deepFrozen.a.b.c = 99;  // silently ignored ✓

// ── Checking descriptors ──────────────────────────────────────────────
Object.getOwnPropertyDescriptor(config, 'MAX_SIZE');
// { value: 100, writable: false, enumerable: true, configurable: false }`,
    },
    {
      label: 'Iteration & Merging',
      language: 'typescript',
      code: `// ── Iteration trio ────────────────────────────────────────────────────
const inventory = { apples: 5, bananas: 12, cherries: 3 };

Object.keys(inventory);    // ['apples', 'bananas', 'cherries']
Object.values(inventory);  // [5, 12, 3]
Object.entries(inventory); // [['apples',5], ['bananas',12], ['cherries',3]]

// Filter object by value
const inStock = Object.fromEntries(
  Object.entries(inventory).filter(([, qty]) => qty > 4)
);  // { apples: 5, bananas: 12 }

// ── Merging objects ───────────────────────────────────────────────────
const defaults = { theme: 'light', lang: 'en', debug: false };
const userPrefs = { theme: 'dark', fontSize: 14 };
const config = { ...defaults, ...userPrefs };
// { theme: 'dark', lang: 'en', debug: false, fontSize: 14 }
// rightmost spread wins for duplicate keys

// ── Optional chaining ────────────────────────────────────────────────
const data = { user: null };
const city  = data?.user?.address?.city ?? 'Unknown';  // 'Unknown'
const first = data?.items?.[0]?.name;                  // undefined

// Object.hasOwn vs in
const obj = Object.create({ inherited: true });
obj.own = true;

'inherited' in obj;              // true (includes prototype)
Object.hasOwn(obj, 'inherited'); // false (own only)
Object.hasOwn(obj, 'own');       // true`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Shallow clone thinking it\'s a deep clone',
      wrong: `const original = { settings: { dark: false } };
const copy = { ...original };
copy.settings.dark = true;  // original.settings.dark is now true too!`,
      right: `const copy = structuredClone(original);
copy.settings.dark = true;  // original is untouched`,
      explanation: 'Spread and Object.assign only copy the top-level properties. Nested objects are still shared by reference. Use structuredClone() for deep copies.',
    },
    {
      title: 'JSON clone losing Dates and undefined',
      wrong: `const obj = { date: new Date(), val: undefined, fn: () => {} };
const clone = JSON.parse(JSON.stringify(obj));
// { date: "2024-01-01T..." }  — date is string, undefined and fn stripped`,
      right: `const clone = structuredClone(obj);
// Handles Date natively; still can't clone functions (they're excluded)`,
      explanation: 'JSON.stringify → JSON.parse is a lossy clone: Dates become strings, undefined/functions are stripped, Map/Set become {}, and circular references throw.',
    },
    {
      title: 'for...in iterating inherited properties',
      wrong: `const obj = Object.create({ inherited: true });
obj.own = 1;
for (const key in obj) console.log(key);  // "own", "inherited"`,
      right: `for (const key of Object.keys(obj)) console.log(key);  // "own" only`,
      explanation: 'for...in includes inherited enumerable properties. Always use Object.keys() to iterate only own properties.',
    },
    {
      title: 'Using hasOwnProperty on null-prototype objects',
      wrong: `const dict = Object.create(null);
dict.key = 'value';
dict.hasOwnProperty('key');  // TypeError: dict.hasOwnProperty is not a function`,
      right: `Object.hasOwn(dict, 'key');  // true — works on null-proto objects
// Or: Object.prototype.hasOwnProperty.call(dict, 'key')`,
      explanation: 'Object.create(null) objects have no prototype methods including hasOwnProperty. Use Object.hasOwn() (ES2022) which works safely on all objects.',
    },
    {
      title: 'Object.freeze thinking it\'s deep',
      wrong: `const config = Object.freeze({ db: { host: 'localhost' } });
config.db.host = 'evil.com';  // works! freeze is shallow`,
      right: `function deepFreeze(obj) {
  Object.values(obj).filter(v => v && typeof v === 'object').forEach(deepFreeze);
  return Object.freeze(obj);
}
const config = deepFreeze({ db: { host: 'localhost' } });
config.db.host = 'evil.com';  // silently ignored`,
      explanation: 'Object.freeze is shallow — it freezes own properties but not nested objects. Use a recursive deepFreeze if you need nested immutability.',
    },
    {
      title: 'Property order gotcha with integer keys',
      wrong: `const obj = { b: 1, a: 2, 1: 3, 2: 4 };
Object.keys(obj);  // expecting ['b','a','1','2']
// Actually: ['1', '2', 'b', 'a'] — integer keys sort first!`,
      right: `// If insertion order matters for integer-like keys, use a Map:
const map = new Map([['b',1],['a',2],['1',3],['2',4]]);
[...map.keys()];  // ['b','a','1','2'] — insertion order preserved`,
      explanation: 'Objects sort integer-like string keys numerically before other string keys. If insertion order matters for numeric keys, use a Map which always preserves insertion order.',
    },
  ];

  challenge: Challenge = {
    title: 'Object Utilities',
    language: 'typescript',
    description: 'Implement these object utility functions:\n1. `pick(obj, keys)` — return new object with only the specified keys\n2. `omit(obj, keys)` — return new object without the specified keys\n3. `mapValues(obj, fn)` — return new object with values transformed by fn\n4. `deepMerge(target, source)` — recursively merge source into target',
    hints: [
      'pick: Object.fromEntries with filtered Object.entries',
      'omit: similar but filter OUT the listed keys',
      'mapValues: Object.fromEntries + map over entries',
      'deepMerge: recurse when both target[k] and source[k] are plain objects',
    ],
    starterCode: `function pick(obj, keys) { }
function omit(obj, keys) { }
function mapValues(obj, fn) { }
function deepMerge(target, source) { }

// Tests
const user = { id: 1, name: 'Alice', password: 'secret', age: 30 };
console.log(pick(user, ['id', 'name']));       // { id: 1, name: 'Alice' }
console.log(omit(user, ['password']));         // { id:1, name:'Alice', age:30 }
console.log(mapValues({ a: 1, b: 2 }, v => v * 10));  // { a:10, b:20 }

const merged = deepMerge(
  { a: 1, b: { x: 1, y: 2 } },
  { b: { y: 99, z: 3 }, c: 4 }
);
console.log(merged);  // { a:1, b:{ x:1, y:99, z:3 }, c:4 }`,
    solution: `function pick(obj, keys) {
  return Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
}

function omit(obj, keys) {
  const set = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !set.has(k)));
}

function mapValues(obj, fn) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const [k, v] of Object.entries(source)) {
    result[k] = isPlainObject(v) && isPlainObject(result[k])
      ? deepMerge(result[k], v)
      : v;
  }
  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `{ ...obj }` produce?',
      options: [
        'A deep clone where nested objects are also copied',
        'A shallow clone — nested objects are still shared by reference',
        'A frozen copy that cannot be mutated',
        'A copy with only enumerable own properties removed',
      ],
      answer: 1,
      explanation: 'Spread creates a shallow clone — top-level properties are copied but nested objects are still shared by reference. Use structuredClone() for deep cloning.',
    },
    {
      q: 'Which method creates a proper deep clone of an object?',
      options: ['{ ...obj }', 'Object.assign({}, obj)', 'JSON.parse(JSON.stringify(obj))', 'structuredClone(obj)'],
      answer: 3,
      explanation: 'structuredClone() is the modern built-in deep clone that handles nested objects, Dates, Maps, Sets, and circular references. JSON round-trip is lossy.',
    },
    {
      q: 'What does Object.freeze() do?',
      options: [
        'Deep-freezes the object and all nested objects',
        'Prevents adding/changing/deleting own properties (shallow)',
        'Makes the object immutable forever including the prototype',
        'Prevents the variable from being reassigned',
      ],
      answer: 1,
      explanation: 'Object.freeze() is shallow — it prevents adding/changing/deleting own properties but nested objects are still mutable. Use deepFreeze() for recursive immutability.',
    },
    {
      q: 'How do you safely iterate only own (non-inherited) properties?',
      options: ['for...in', 'for...of', 'Object.keys(obj)', 'Object.getOwnPropertyNames(obj)'],
      answer: 2,
      explanation: 'Object.keys() returns own enumerable string keys. for...in also walks the prototype chain. Object.getOwnPropertyNames() includes non-enumerable keys too.',
    },
    {
      q: 'Which merge wins when there\'s a conflict: `{ ...a, ...b }` vs `{ ...b, ...a }`?',
      options: ['Left side always wins', 'Right side always wins (last write wins)', 'Neither — it throws', 'Alphabetical order'],
      answer: 1,
      explanation: 'In spread merges, the rightmost value wins for duplicate keys. { ...a, ...b } → b wins. { ...b, ...a } → a wins. This is "last write wins."',
    },
    {
      q: 'What is the purpose of Object.freeze() and what does it NOT do?',
      options: ['Deep-freezes an object including nested objects', 'Prevents adding, removing, or changing properties on the object itself (shallow)', 'Makes the variable binding const', 'Prevents the object from being garbage collected'],
      answer: 1,
      explanation: 'Object.freeze() is shallow — it freezes the top-level properties of the object. Nested objects are not frozen; you must recursively freeze them. It does NOT affect the variable binding (let vs const).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Map instead of a plain object?',
      a: 'Use <strong>Map</strong> when: (1) keys are not strings (objects, numbers, symbols as keys), (2) you need guaranteed insertion-order iteration for integer-like keys, (3) you\'re frequently adding/deleting entries (Map is optimized), (4) you need the size easily (<code>map.size</code>). Use a <strong>plain object</strong> for static configs, data transfer (JSON), and when keys are simple strings.',
    },
    {
      q: 'What is the difference between Object.assign and spread?',
      a: 'Both are shallow copies of own enumerable string properties. Key difference: <code>Object.assign</code> MUTATES the target and invokes setters on the target object. Spread creates a new object literal (no setters invoked). Prefer spread for immutable patterns; use <code>Object.assign</code> when you explicitly want to mutate a target.',
    },
    {
      q: 'What does structuredClone NOT support?',
      a: '<code>structuredClone()</code> cannot clone: <strong>functions</strong> (throws), <strong>DOM nodes</strong> (throws), class instances lose their prototype (become plain objects), <strong>WeakMap/WeakSet</strong> (throws). For those, write a custom cloner or use <code>lodash.cloneDeep</code>.',
    },
    {
      q: 'What does Object.create(null) give you and when is it useful?',
      a: '<code>Object.create(null)</code> creates an object with NO prototype — no <code>toString</code>, <code>hasOwnProperty</code>, <code>valueOf</code>, or any inherited method. Useful as a safe dictionary when keys are user-controlled, because prototype pollution attacks that target <code>__proto__</code> or <code>constructor</code> can\'t reach anything useful. Also slightly faster property lookup due to shorter prototype chain.',
    },
    {
      q: 'What is property shadowing in prototype chains?',
      a: 'When you set a property on an instance that already exists on its prototype, the instance gets its own copy that "shadows" the prototype property. Reads on the instance get the own property; the prototype\'s property is unchanged. This is different from inheritance overriding — the prototype property still exists and is accessible via <code>Object.getPrototypeOf(obj).propName</code>.',
    },
    {
      q: 'How do computed property names work in object literals?',
      a: 'Use square bracket syntax in an object literal to compute the key at creation time: <code>const key = "name"; const obj = { [key]: "Alice" }</code> produces <code>{ name: "Alice" }</code>. The expression inside <code>[]</code> is evaluated and coerced to string. Useful for dynamic keys, Symbol keys, and building objects from maps.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Objects are the building blocks of JS — spread does shallow clones, structuredClone does deep clones, Object.entries/fromEntries enable functional transformations, and optional chaining safely navigates nested structures.',
    mustKnow: [
      'Spread {...obj} is shallow — nested objects are shared references',
      'structuredClone() is the modern deep clone (handles Date, Map, Set, circular)',
      'Object.keys/values/entries: always own enumerable; for...in includes inherited',
      'Object.freeze is shallow — nested objects still mutable',
      'Object.hasOwn() is safe on null-prototype objects; hasOwnProperty is not',
      'Integer-like string keys sort before other keys in Object.keys()',
    ],
    interviewFocus: [
      'Difference between shallow and deep clone — which methods do which?',
      'Why does JSON.parse(JSON.stringify(obj)) lose Dates and undefined?',
      'Implement pick/omit/mapValues using Object.entries/fromEntries',
      'When would you use Map instead of a plain object?',
    ],
  };
}
