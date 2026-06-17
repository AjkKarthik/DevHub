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
  selector: 'app-js-arrays',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './arrays.html',
  styleUrl: './arrays.scss',
})
export class JsArrays {
  theory: TheoryPoint[] = [
    {
      heading: 'Core Functional Methods',
      points: [
        '<code>map(fn)</code> transforms every element and returns a new array of the same length. Never mutates. Returns <code>undefined</code> for elements where <code>fn</code> returns nothing.',
        '<code>filter(fn)</code> keeps elements for which <code>fn</code> returns truthy. Returns a new (possibly shorter) array. <code>fn</code> receives <code>(element, index, array)</code>.',
        '<code>reduce(fn, initial)</code> accumulates all elements into a single value — any type (number, object, array, string). Always provide the initial value to avoid bugs with empty arrays.',
        '<code>forEach(fn)</code> iterates for side effects — it does NOT return a value. If you want a result, use <code>map</code> or <code>reduce</code>.',
        'Chain these methods: <code>arr.filter(x => x > 0).map(x => x * 2).reduce((a,b) => a+b, 0)</code>. Each returns a new array — intermediate arrays are created, so extremely long chains on huge datasets are better handled with a single <code>reduce</code>.',
      ]
    },
    {
      heading: 'Search & Test Methods',
      points: [
        '<code>find(fn)</code> returns the first element matching the predicate, or <code>undefined</code>. <code>findIndex(fn)</code> returns its index, or <code>-1</code>.',
        '<code>some(fn)</code> returns <code>true</code> if at least one element matches. Short-circuits on first match.',
        '<code>every(fn)</code> returns <code>true</code> only if all elements match. Short-circuits on first failure.',
        '<code>includes(val)</code> checks for exact inclusion using <code>===</code>. Note: <code>includes(NaN)</code> works correctly, unlike <code>indexOf</code> which uses <code>===</code> (NaN !== NaN).',
        '<code>indexOf(val)</code> returns first index using <code>===</code>, or <code>-1</code>. Does NOT find NaN. Use <code>findIndex</code> with a predicate for complex searches.',
      ]
    },
    {
      heading: 'Transformation & Flattening',
      points: [
        '<code>flat(depth)</code> flattens nested arrays up to <code>depth</code> levels (default 1). <code>flat(Infinity)</code> flattens to any depth.',
        '<code>flatMap(fn)</code> maps then flattens one level — more efficient than <code>.map(...).flat(1)</code>. Great for one-to-many transformations.',
        '<code>slice(start, end)</code> returns a shallow copy of a portion. Negative indices count from the end. Does NOT mutate.',
        '<code>concat(...arrays)</code> merges arrays. Prefer spread <code>[...a, ...b]</code> for clarity and support for any iterable.',
        '<code>Array.from(iterable, mapFn)</code> creates an array from any iterable or array-like (NodeList, Set, string, arguments). Optional map function applied during creation.',
      ]
    },
    {
      heading: 'Sorting & Mutating Methods',
      points: [
        '<code>sort(compareFn)</code> mutates the array. Always provide a comparator for numbers: <code>arr.sort((a,b) => a-b)</code>. Default sort converts to strings — <code>[10,9,2].sort()</code> gives <code>[10,2,9]</code>.',
        '<code>reverse()</code> mutates the array in place. To sort/reverse without mutation: <code>[...arr].sort(...)</code> / <code>[...arr].reverse()</code>.',
        '<code>splice(start, deleteCount, ...items)</code> is the Swiss Army knife of mutation: remove, insert, or replace elements in place.',
        '<code>push/pop</code> add/remove from end; <code>unshift/shift</code> add/remove from start. <code>push</code>/<code>pop</code> are O(1); <code>unshift</code>/<code>shift</code> are O(n) since elements must be shifted.',
        'ES2023 <code>toSorted()</code>, <code>toReversed()</code>, <code>toSpliced()</code>, <code>with(index, value)</code> — non-mutating versions that return new arrays.',
      ]
    },
    {
      heading: 'Sets, Maps & Iteration',
      points: [
        '<code>Set</code> stores unique values: <code>new Set([1,1,2,3])</code> → <code>{1,2,3}</code>. Quick dedup: <code>[...new Set(arr)]</code> or <code>Array.from(new Set(arr))</code>.',
        '<code>Map</code> stores key-value pairs with any key type. Unlike objects, Map preserves insertion order and has a <code>.size</code> property.',
        '<code>for...of</code> iterates array values. <code>for...in</code> iterates enumerable keys including inherited — avoid on arrays.',
        '<code>entries()</code>, <code>keys()</code>, <code>values()</code> return iterators. Useful with <code>for...of</code> when you need both index and value: <code>for (const [i, v] of arr.entries())</code>.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'arr.map(fn)',        type: 'method', desc: 'Transform each element → new array same length' },
    { name: 'arr.filter(fn)',     type: 'method', desc: 'Keep elements where fn returns truthy → new array' },
    { name: 'arr.reduce(fn, init)', type: 'method', desc: 'Accumulate all elements into one value' },
    { name: 'arr.find(fn)',       type: 'method', desc: 'First element matching predicate, or undefined' },
    { name: 'arr.findIndex(fn)',  type: 'method', desc: 'Index of first match, or -1' },
    { name: 'arr.some(fn)',       type: 'method', desc: 'True if any element matches (short-circuits)' },
    { name: 'arr.every(fn)',      type: 'method', desc: 'True if all elements match (short-circuits)' },
    { name: 'arr.flat(depth)',    type: 'method', desc: 'Flatten nested arrays up to depth levels' },
    { name: 'arr.flatMap(fn)',    type: 'method', desc: 'Map then flatten one level — one-to-many transforms' },
    { name: 'arr.at(-1)',         type: 'method', desc: 'Element at index (negative = from end)' },
    { name: 'arr.toSorted()',     type: 'method', desc: 'ES2023: non-mutating sort (returns new array)' },
    { name: 'Array.from(it, fn)', type: 'method', desc: 'Array from iterable/array-like with optional map' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'map / filter / reduce',
      language: 'typescript',
      code: `const products = [
  { name: 'Widget',  price: 9.99,  qty: 5,  category: 'tools' },
  { name: 'Gadget',  price: 24.99, qty: 2,  category: 'tech'  },
  { name: 'Doohickey', price: 4.99, qty: 10, category: 'tools' },
  { name: 'Thingamajig', price: 49.99, qty: 1, category: 'tech' },
];

// map: transform
const names = products.map(p => p.name);
// ['Widget','Gadget','Doohickey','Thingamajig']

// filter: subset
const affordable = products.filter(p => p.price < 25);
// [Widget, Gadget, Doohickey]

// reduce: accumulate into any shape
const totalValue = products.reduce((sum, p) => sum + p.price * p.qty, 0);
// 9.99*5 + 24.99*2 + 4.99*10 + 49.99*1 = 199.83

// reduce to object: group by category
const byCategory = products.reduce((acc, p) => {
  (acc[p.category] ??= []).push(p.name);
  return acc;
}, {});
// { tools: ['Widget','Doohickey'], tech: ['Gadget','Thingamajig'] }

// Chain: total value of affordable tools
const affordableToolsValue = products
  .filter(p => p.category === 'tools' && p.price < 10)
  .reduce((sum, p) => sum + p.price * p.qty, 0);
// (9.99*5) + (4.99*10) = 99.85`,
    },
    {
      label: 'Search & Test',
      language: 'typescript',
      code: `const users = [
  { id: 1, name: 'Alice', active: true,  age: 30 },
  { id: 2, name: 'Bob',   active: false, age: 25 },
  { id: 3, name: 'Carol', active: true,  age: 35 },
];

// find: first match or undefined
const alice = users.find(u => u.id === 1);
// { id: 1, name: 'Alice', ... }

const admin = users.find(u => u.role === 'admin');
// undefined — not found

// findIndex: index or -1
const bobIdx = users.findIndex(u => u.name === 'Bob');  // 1

// some / every
const hasActive  = users.some(u => u.active);   // true (Alice, Carol)
const allActive  = users.every(u => u.active);  // false (Bob is inactive)

// includes (primitives)
const nums = [1, 2, NaN, 4];
nums.includes(2);    // true
nums.includes(NaN);  // true (uses SameValueZero, unlike indexOf!)
nums.indexOf(NaN);   // -1  (uses ===, NaN !== NaN)

// at() for negative indexing
const last = users.at(-1);   // Carol
const second_last = users.at(-2);  // Bob`,
    },
    {
      label: 'flat / flatMap / from',
      language: 'typescript',
      code: `// ── flat ──────────────────────────────────────────────────────────────
const nested = [1, [2, 3], [4, [5, 6]]];
nested.flat();           // [1, 2, 3, 4, [5, 6]]  — default depth 1
nested.flat(2);          // [1, 2, 3, 4, 5, 6]
nested.flat(Infinity);   // [1, 2, 3, 4, 5, 6]

// ── flatMap ───────────────────────────────────────────────────────────
// One-to-many: expand each sentence into words
const sentences = ['Hello World', 'Foo Bar Baz'];
const words = sentences.flatMap(s => s.split(' '));
// ['Hello','World','Foo','Bar','Baz']

// Filter + map in one step (return [] to skip)
const results = [1, -2, 3, -4, 5];
const positiveDoubled = results.flatMap(n => n > 0 ? [n * 2] : []);
// [2, 6, 10]  — negative numbers removed, positive doubled

// ── Array.from ────────────────────────────────────────────────────────
// From NodeList
const divs = Array.from(document.querySelectorAll('div'));

// From Set (dedup)
const unique = Array.from(new Set([1, 2, 2, 3, 3, 3]));  // [1, 2, 3]

// With map function — create array of N items
const range = Array.from({ length: 5 }, (_, i) => i + 1);  // [1,2,3,4,5]

// From string
Array.from('hello');  // ['h','e','l','l','o']

// ── Set for dedup ─────────────────────────────────────────────────────
const tags = ['js', 'ts', 'js', 'react', 'ts'];
const uniqueTags = [...new Set(tags)];  // ['js','ts','react']`,
    },
    {
      label: 'Sort & Mutating',
      language: 'typescript',
      code: `// ── sort ─────────────────────────────────────────────────────────────
const nums = [10, 2, 20, 1, 5];
nums.sort();               // [1, 10, 2, 20, 5] — lexicographic! BAD
nums.sort((a, b) => a-b); // [1, 2, 5, 10, 20] — numeric ascending
nums.sort((a, b) => b-a); // [20, 10, 5, 2, 1] — descending

// Sort objects
const people = [{ name: 'Carol', age: 35 }, { name: 'Alice', age: 30 }];
people.sort((a, b) => a.age - b.age);  // ascending by age
people.sort((a, b) => a.name.localeCompare(b.name));  // alphabetical

// Non-mutating sort (ES2023 or copy first)
const sorted = [...nums].sort((a, b) => a - b);     // original unchanged
const sorted2 = nums.toSorted((a, b) => a - b);     // ES2023

// ── splice ────────────────────────────────────────────────────────────
const arr = ['a','b','c','d','e'];
arr.splice(1, 2);         // removes 'b','c'; arr = ['a','d','e']
arr.splice(1, 0, 'X','Y'); // inserts at 1; arr = ['a','X','Y','d','e']
arr.splice(2, 1, 'Z');    // replaces 1 at index 2 with 'Z'

// ── Non-mutating ES2023 ───────────────────────────────────────────────
const arr2 = [1, 2, 3];
arr2.toReversed();       // [3,2,1] — new array, original unchanged
arr2.with(1, 99);        // [1,99,3] — new array with index 1 changed
arr2.toSpliced(1, 1);    // [1,3]   — new array with element removed`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sorting numbers without a comparator',
      wrong: `[10, 9, 2, 100].sort()  // [10, 100, 2, 9] — sorted as strings!`,
      right: `[10, 9, 2, 100].sort((a, b) => a - b)  // [2, 9, 10, 100]`,
      explanation: 'Array.sort() without a comparator converts elements to strings and compares lexicographically. Always provide (a, b) => a - b for numeric sort.',
    },
    {
      title: 'Using forEach when you need a return value',
      wrong: `const doubled = arr.forEach(x => x * 2);
console.log(doubled);  // undefined — forEach always returns undefined`,
      right: `const doubled = arr.map(x => x * 2);  // returns new array`,
      explanation: 'forEach is for side effects only — it always returns undefined. Use map to transform and get a new array back.',
    },
    {
      title: 'Reduce without initial value on empty array',
      wrong: `[].reduce((acc, x) => acc + x)  // TypeError: Reduce of empty array with no initial value`,
      right: `[].reduce((acc, x) => acc + x, 0)  // 0 — safe with initial value`,
      explanation: 'Without an initial value, reduce uses the first element as the accumulator. On an empty array this throws. Always provide an initial value.',
    },
    {
      title: 'Mutating array during map/filter/forEach',
      wrong: `const arr = [1, 2, 3];
arr.map((x, i) => { arr.splice(i, 1); return x * 2; });  // undefined behaviour`,
      right: `const doubled = arr.map(x => x * 2);  // never mutate arr inside map`,
      explanation: 'Mutating the source array inside a callback creates undefined behaviour — skipped elements, duplicates. These methods expect the source to be stable.',
    },
    {
      title: 'Using indexOf to find NaN',
      wrong: `[1, NaN, 3].indexOf(NaN)  // -1 — NaN !== NaN so indexOf fails`,
      right: `[1, NaN, 3].includes(NaN)   // true — uses SameValueZero
[1, NaN, 3].findIndex(Number.isNaN)  // 1`,
      explanation: 'indexOf uses strict equality (===). Since NaN !== NaN, it always returns -1 for NaN. Use includes() (SameValueZero) or findIndex(Number.isNaN) instead.',
    },
    {
      title: 'Chaining map().flat() instead of flatMap()',
      wrong: `sentences.map(s => s.split(' ')).flat()  // creates intermediate array`,
      right: `sentences.flatMap(s => s.split(' '))      // more efficient, same result`,
      explanation: 'flatMap is map + flat(1) in one pass — no intermediate array. Use it for one-to-many transformations.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Data Pipeline',
    language: 'typescript',
    description: 'Given the orders array, write a data pipeline (chain of array methods) that:\n1. Filters to only completed orders\n2. Flattens all order items into one list\n3. Groups items by category (reduce to an object)\n4. For each category, calculates the total revenue\n\nReturn an object like `{ electronics: 349.97, books: 29.98 }`.',
    hints: [
      'filter(o => o.status === "completed")',
      'flatMap(o => o.items) to flatten items from all orders',
      'reduce to group by category',
      'Each item has { name, category, price, qty }',
    ],
    starterCode: `const orders = [
  { id: 1, status: 'completed', items: [
    { name: 'Laptop', category: 'electronics', price: 299.99, qty: 1 },
    { name: 'Mouse',  category: 'electronics', price: 49.98,  qty: 2 },
  ]},
  { id: 2, status: 'pending', items: [
    { name: 'Keyboard', category: 'electronics', price: 79.99, qty: 1 },
  ]},
  { id: 3, status: 'completed', items: [
    { name: 'JS Book',  category: 'books', price: 14.99, qty: 1 },
    { name: 'CSS Book', category: 'books', price: 14.99, qty: 1 },
  ]},
];

function revenueByCategory(orders) {
  // Your pipeline here
}

console.log(revenueByCategory(orders));
// { electronics: 399.97, books: 29.98 }`,
    solution: `function revenueByCategory(orders) {
  return orders
    .filter(o => o.status === 'completed')
    .flatMap(o => o.items)
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.price * item.qty;
      return acc;
    }, {});
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does Array.map() return when the callback returns nothing (undefined)?',
      options: [
        'The original element',
        'An array with undefined at that position',
        'It skips that element',
        'It throws an error',
      ],
      answer: 1,
      explanation: 'map always returns a new array of the same length. If the callback returns nothing (undefined), the new array has undefined at that position. Use filter to remove elements.',
    },
    {
      q: 'What is the default sort behavior of Array.sort()?',
      options: [
        'Numeric ascending',
        'Numeric descending',
        'Lexicographic (converts to strings)',
        'Insertion order preserved',
      ],
      answer: 2,
      explanation: 'Without a comparator, sort converts elements to strings and sorts them lexicographically. So [10,2,1].sort() gives [1,10,2]. Always pass a comparator for numbers.',
    },
    {
      q: 'Why does [].reduce((a,b) => a+b) throw?',
      options: [
        'reduce is not defined on empty arrays',
        'No initial value and empty array — no first element to use as accumulator',
        'The callback requires three arguments',
        'It does not throw — it returns undefined',
      ],
      answer: 1,
      explanation: 'Without an initial value, reduce uses the first element as the initial accumulator. On an empty array, there is no first element, so it throws TypeError.',
    },
    {
      q: 'What does flatMap do differently from map().flat()?',
      options: [
        'flatMap is the same, just shorter syntax',
        'flatMap is more efficient (single pass, no intermediate array)',
        'flatMap flattens to Infinity depth',
        'flatMap only works on string arrays',
      ],
      answer: 1,
      explanation: 'flatMap does map + flat(1) in a single pass without creating an intermediate array. It\'s more efficient and is the idiomatic choice for one-to-many transformations.',
    },
    {
      q: 'Which method correctly detects NaN in an array?',
      options: ['arr.indexOf(NaN)', 'arr.find(x => x === NaN)', 'arr.includes(NaN)', 'arr.some(x => x == NaN)'],
      answer: 2,
      explanation: 'includes() uses SameValueZero comparison which correctly handles NaN. indexOf() uses === which fails since NaN !== NaN. find/some with === also fail.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use for...of vs forEach vs map?',
      a: '<strong>map</strong>: when you need a new transformed array. <strong>filter</strong>: when you need a subset. <strong>reduce</strong>: when you need a single accumulated value. <strong>forEach</strong>: for side effects with no return value needed. <strong>for...of</strong>: when you need <code>break</code>/<code>continue</code>, or when working with async (<code>for await...of</code>) — you can\'t break out of forEach.',
    },
    {
      q: 'What is the difference between find and filter?',
      a: '<code>find(fn)</code> returns the <strong>first matching element</strong> (or <code>undefined</code>) and short-circuits as soon as a match is found. <code>filter(fn)</code> always scans the entire array and returns a <strong>new array of ALL matches</strong>. Use <code>find</code> when you expect one result; <code>filter</code> when you expect multiple.',
    },
    {
      q: 'How do I efficiently deduplicate an array?',
      a: '<code>[...new Set(arr)]</code> or <code>Array.from(new Set(arr))</code> deduplicates primitives in O(n). For objects (where you want unique by a key): <code>arr.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)</code> — O(n²). For large datasets, use a Map: <code>[...new Map(arr.map(x => [x.id, x])).values()]</code> — O(n).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'JavaScript arrays have a rich functional API — map/filter/reduce for transformations, find/some/every for search, flatMap for one-to-many, and Set for deduplication; sort always needs a comparator for numbers.',
    mustKnow: [
      'map → same-length transform; filter → subset; reduce → any accumulated value',
      'sort() default is lexicographic — always pass (a,b)=>a-b for numbers',
      'includes() finds NaN; indexOf() does not (uses ===)',
      'forEach returns undefined — use map when you need the result',
      'flatMap = map + flat(1) in one pass — efficient one-to-many transform',
      '[...new Set(arr)] deduplicates primitives; Map-based dedup for objects by key',
    ],
    interviewFocus: [
      'Implement map, filter, reduce from scratch',
      'Why does [10,2].sort() give wrong results? How do you fix it?',
      'Difference between find and filter',
      'How does flatMap work and when do you use it over map().flat()?',
    ],
  };
}
