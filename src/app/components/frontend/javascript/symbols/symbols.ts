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
  selector: 'app-js-symbols',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './symbols.html',
  styleUrl: './symbols.scss',
})
export class JsSymbols {
  theory: TheoryPoint[] = [
    {
      heading: 'Symbol Primitive',
      points: [
        '<code>Symbol()</code> creates a unique, immutable primitive value. Every call to <code>Symbol()</code> produces a value that is never equal to any other value — even another <code>Symbol()</code> with the same description.',
        'Symbols are primarily used as unique property keys to avoid naming collisions, especially when multiple libraries add properties to the same object.',
        'The optional description (<code>Symbol("label")</code>) is only for debugging — it appears in <code>.toString()</code> and DevTools, but doesn\'t affect equality.',
        '<code>Symbol.for("key")</code> creates (or retrieves) a globally shared symbol from the global symbol registry. Two calls with the same key return the exact same symbol — unlike <code>Symbol()</code> which always creates a new one.',
        'Symbols are not enumerable in <code>for...in</code>, <code>Object.keys()</code>, or <code>JSON.stringify()</code>. They show up in <code>Object.getOwnPropertySymbols()</code> and <code>Reflect.ownKeys()</code>.',
      ]
    },
    {
      heading: 'Well-Known Symbols',
      points: [
        'JavaScript defines a set of built-in symbols on the <code>Symbol</code> object (e.g. <code>Symbol.iterator</code>, <code>Symbol.toPrimitive</code>). These are hooks into the language\'s internal algorithms.',
        '<code>Symbol.iterator</code>: defines how an object is iterated by <code>for...of</code>, spread (<code>...</code>), and destructuring. Any object with this method is "iterable."',
        '<code>Symbol.toPrimitive</code>: controls how an object is converted to a primitive (number, string, or default). Called by arithmetic operators, template literals, and comparison operators.',
        '<code>Symbol.hasInstance</code>: controls what <code>instanceof</code> returns. <code>Symbol.species</code>: specifies the constructor to use when creating derived objects from map/filter/slice.',
        '<code>Symbol.asyncIterator</code>: enables <code>for await...of</code> on an object. Powers async generators and streams.',
      ]
    },
    {
      heading: 'The Iterator Protocol',
      points: [
        'An iterator is an object with a <code>next()</code> method that returns <code>{ value, done }</code>. When <code>done</code> is <code>true</code>, iteration ends.',
        'An iterable is an object with a <code>[Symbol.iterator]()</code> method that returns an iterator. Arrays, strings, Maps, Sets, and generators are all iterables.',
        '<code>for...of</code> calls <code>[Symbol.iterator]()</code> to get an iterator, then calls <code>next()</code> until <code>done: true</code>. Spread and destructuring use the same protocol.',
        'You can make any object iterable by implementing <code>[Symbol.iterator]()</code>. This enables your custom data structures to work with all of JavaScript\'s iteration syntax.',
        'Generators automatically implement the iterator protocol — a generator function returns an object that is both an iterator AND an iterable.',
      ]
    },
    {
      heading: 'Symbol as Unique Keys',
      points: [
        'Using a Symbol as an object property key guarantees no naming collision with string keys from other code, third-party libraries, or future JavaScript additions.',
        'This is how many internal frameworks avoid property conflicts: React uses <code>Symbol</code>-keyed properties on virtual DOM nodes that libraries shouldn\'t touch.',
        '<code>Symbol.for()</code> + <code>Symbol.keyFor()</code> form a cross-realm symbol registry. Useful when the same symbol needs to be used across iframes or Node.js modules.',
        'Symbol-keyed properties survive <code>Object.assign()</code> and spread — they are not lost when cloning objects, just hidden from enumeration.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Symbol()',              type: 'method',   desc: 'Creates a unique symbol — never equal to anything else' },
    { name: 'Symbol.for("key")',     type: 'method',   desc: 'Gets or creates a globally shared symbol by key' },
    { name: 'Symbol.keyFor(sym)',    type: 'method',   desc: 'Returns the key string for a global symbol (Symbol.for)' },
    { name: 'Symbol.iterator',       type: 'accessor', desc: 'Method called by for...of, spread, destructuring — makes object iterable' },
    { name: 'Symbol.toPrimitive',    type: 'accessor', desc: 'Controls how object converts to a primitive (number/string/default)' },
    { name: 'Symbol.hasInstance',    type: 'accessor', desc: 'Controls instanceof behavior for a class' },
    { name: 'Symbol.asyncIterator',  type: 'accessor', desc: 'Enables for await...of on an object' },
    { name: 'iterator.next()',       type: 'method',   desc: 'Returns { value, done } — the core of the iterator protocol' },
    { name: 'Object.getOwnPropertySymbols()', type: 'method', desc: 'Returns symbol keys on an object (not in for...in or Object.keys)' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Symbol Basics',
      language: 'typescript',
      code: `// ── Creating symbols ─────────────────────────────────────────────────
const sym1 = Symbol('id');
const sym2 = Symbol('id');
console.log(sym1 === sym2);  // false — always unique
console.log(sym1.toString());  // "Symbol(id)"
console.log(sym1.description); // "id"

// ── As unique property keys ───────────────────────────────────────────
const ID   = Symbol('id');
const TYPE = Symbol('type');

const user = {
  name: 'Alice',
  [ID]:   42,
  [TYPE]: 'admin',
};

console.log(user[ID]);    // 42
console.log(user[TYPE]);  // "admin"

// Symbols are hidden from standard enumeration
console.log(Object.keys(user));     // ['name']
console.log(JSON.stringify(user));  // '{"name":"Alice"}'

// But accessible via reflection
console.log(Object.getOwnPropertySymbols(user));  // [Symbol(id), Symbol(type)]
console.log(Reflect.ownKeys(user));               // ['name', Symbol(id), Symbol(type)]

// ── Global registry ───────────────────────────────────────────────────
const s1 = Symbol.for('shared');
const s2 = Symbol.for('shared');
console.log(s1 === s2);          // true — same entry in global registry
console.log(Symbol.keyFor(s1));  // "shared"`,
    },
    {
      label: 'Making Things Iterable',
      language: 'typescript',
      code: `// ── Custom iterable: range ───────────────────────────────────────────
function makeRange(start, end, step = 1) {
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current <= end) {
            const value = current;
            current += step;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        }
      };
    }
  };
}

const range = makeRange(1, 10, 2);
console.log([...range]);           // [1, 3, 5, 7, 9]
for (const n of range) console.log(n);   // 1 3 5 7 9
const [first, second] = range;           // destructure works too!

// ── Infinite sequence ─────────────────────────────────────────────────
function naturals(start = 0) {
  return {
    [Symbol.iterator]() {
      let n = start;
      return { next() { return { value: n++, done: false }; } };
    }
  };
}

// Take first 5 from infinite sequence (need to limit!)
function take(iterable, n) {
  const result = [];
  for (const v of iterable) {
    result.push(v);
    if (result.length >= n) break;
  }
  return result;
}

console.log(take(naturals(), 5));       // [0, 1, 2, 3, 4]
console.log(take(naturals(10), 3));     // [10, 11, 12]`,
    },
    {
      label: 'Well-Known Symbols',
      language: 'typescript',
      code: `// ── Symbol.toPrimitive ────────────────────────────────────────────────
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number')  return this.amount;
    if (hint === 'string')  return \`\${this.amount} \${this.currency}\`;
    return this.amount;  // default
  }
}

const price = new Money(42, 'USD');
console.log(\`Price: \${price}\`);   // "Price: 42 USD"  (string hint)
console.log(price * 2);           // 84               (number hint)
console.log(price > 10);          // true              (default hint)

// ── Symbol.hasInstance ────────────────────────────────────────────────
class EvenNumber {
  static [Symbol.hasInstance](value) {
    return typeof value === 'number' && value % 2 === 0;
  }
}

console.log(4  instanceof EvenNumber);  // true
console.log(5  instanceof EvenNumber);  // false
console.log(42 instanceof EvenNumber);  // true

// ── Symbol.iterator on existing class ────────────────────────────────
class LinkedList {
  constructor() { this.head = null; }
  push(val) { this.head = { val, next: this.head }; }

  [Symbol.iterator]() {
    let node = this.head;
    return {
      next() {
        if (node) { const value = node.val; node = node.next; return { value, done: false }; }
        return { value: undefined, done: true };
      }
    };
  }
}

const list = new LinkedList();
list.push(3); list.push(2); list.push(1);
console.log([...list]);  // [1, 2, 3]`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling Symbol as a constructor',
      wrong: `const s = new Symbol('id');  // TypeError: Symbol is not a constructor`,
      right: `const s = Symbol('id');  // correct — no new keyword`,
      explanation: 'Symbol is a factory function, not a constructor. Calling it with new throws a TypeError. This is intentional to prevent wrapping symbols in objects.',
    },
    {
      title: 'Confusing Symbol() with Symbol.for()',
      wrong: `// Module A
const key = Symbol('sharedKey');
// Module B — trying to use the same symbol
const key = Symbol('sharedKey');  // different symbol!`,
      right: `// Both modules
const key = Symbol.for('myapp.sharedKey');  // same symbol everywhere`,
      explanation: 'Symbol() always creates a NEW unique symbol. Symbol.for() uses a global registry — same key string always returns the same symbol across modules and realms.',
    },
    {
      title: 'Expecting JSON.stringify to include symbol keys',
      wrong: `const ID = Symbol('id');
const obj = { [ID]: 42, name: 'Alice' };
const json = JSON.stringify(obj);
JSON.parse(json)[ID];  // undefined — symbol key lost!`,
      right: `// Use string keys for data you need to serialize
const obj = { id: 42, name: 'Alice' };
// Or handle symbols separately with a replacer function`,
      explanation: 'JSON.stringify silently ignores symbol-keyed properties. If you need to persist or transfer data containing symbol keys, serialize them explicitly.',
    },
    {
      title: 'Infinite iterable without break',
      wrong: `const infinite = { [Symbol.iterator]() { let n=0; return { next() { return {value:n++,done:false}; } }; } };
for (const n of infinite) console.log(n);  // loops forever`,
      right: `for (const n of infinite) {
  if (n >= 10) break;  // always have an exit condition
  console.log(n);
}`,
      explanation: 'Infinite iterables never set done:true. Always use break or take() to limit how many values you consume from an infinite sequence.',
    },
    {
      title: 'Object.assign loses symbol keys',
      wrong: `// Actually Object.assign DOES copy symbol keys!
// The mistake is thinking they're lost:
const ID = Symbol('id');
const src = { [ID]: 1, name: 'a' };
const dst = Object.assign({}, src);
console.log(dst[ID]);  // 1 — symbols ARE copied by Object.assign`,
      right: `// What IS lost: symbol keys in JSON.stringify, for...in, Object.keys()
// Object.assign and spread {...obj} DO preserve symbols
const copy = { ...src };
console.log(copy[ID]);  // 1`,
      explanation: 'Object.assign and spread preserve symbol keys. What ignores symbols: for...in, Object.keys(), JSON.stringify(). Know which operations see symbols.',
    },
    {
      title: 'Forgetting to return the iterator from [Symbol.iterator]',
      wrong: `class Bad {
  [Symbol.iterator]() {
    let n = 0;
    // Returns nothing! Iterator protocol violated.
    const next = () => ({ value: n++, done: n > 3 });
  }
}`,
      right: `class Good {
  [Symbol.iterator]() {
    let n = 0;
    return {  // must return the iterator object
      next: () => ({ value: n++, done: n > 3 })
    };
  }
}`,
      explanation: '[Symbol.iterator]() must return an object with a next() method. If it returns nothing (undefined), for...of throws "is not iterable".',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Paginated Iterable',
    language: 'typescript',
    description: 'Create a `paginate(array, pageSize)` function that returns an iterable of pages (sub-arrays). Each page should be an array of up to `pageSize` elements.\n\nThen add a `zip(iterableA, iterableB)` function that combines two iterables into an iterable of pairs `[a, b]`, stopping when either is exhausted.',
    hints: [
      'paginate: use [Symbol.iterator] that slices the array on each next() call',
      'Track current index; each next() call advances by pageSize',
      'zip: get iterators from both iterables, call .next() on each simultaneously',
      'done is true when either iterator returns done: true',
    ],
    starterCode: `function paginate(array, pageSize) {
  // Return an iterable of sub-arrays
}

function zip(iterableA, iterableB) {
  // Return an iterable of [a, b] pairs
}

// Tests
const pages = paginate([1,2,3,4,5,6,7], 3);
console.log([...pages]);  // [[1,2,3], [4,5,6], [7]]

const zipped = zip([1,2,3], ['a','b','c']);
console.log([...zipped]);  // [[1,'a'], [2,'b'], [3,'c']]

const zipped2 = zip([1,2,3,4], ['a','b']);
console.log([...zipped2]);  // [[1,'a'], [2,'b']]`,
    solution: `function paginate(array, pageSize) {
  return {
    [Symbol.iterator]() {
      let index = 0;
      return {
        next() {
          if (index >= array.length) return { value: undefined, done: true };
          const value = array.slice(index, index + pageSize);
          index += pageSize;
          return { value, done: false };
        }
      };
    }
  };
}

function zip(iterableA, iterableB) {
  return {
    [Symbol.iterator]() {
      const itA = iterableA[Symbol.iterator]();
      const itB = iterableB[Symbol.iterator]();
      return {
        next() {
          const a = itA.next();
          const b = itB.next();
          if (a.done || b.done) return { value: undefined, done: true };
          return { value: [a.value, b.value], done: false };
        }
      };
    }
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does Symbol() return?',
      options: ['A string', 'A unique primitive value that never equals anything else', 'An object', 'The same value if given the same description'],
      answer: 1,
      explanation: 'Symbol() creates a unique primitive. Two Symbol() calls with the same description still produce different values. Use Symbol.for() for shared symbols.',
    },
    {
      q: 'Which method makes an object iterable with for...of?',
      options: ['Symbol.toPrimitive', 'Symbol.hasInstance', 'Symbol.iterator', 'Symbol.asyncIterator'],
      answer: 2,
      explanation: 'Symbol.iterator is the well-known symbol that for...of, spread, and destructuring call to get an iterator from an object.',
    },
    {
      q: 'Are symbol-keyed properties included in JSON.stringify?',
      options: ['Yes', 'No — they are silently skipped', 'Only with a replacer function', 'Only if enumerable is true'],
      answer: 1,
      explanation: 'JSON.stringify silently ignores symbol-keyed properties. This is by design — symbols are meant for metadata and internal keys, not serializable data.',
    },
    {
      q: 'What does an iterator\'s next() method return?',
      options: [
        'The next value directly',
        '{ value, done } object',
        'A Promise of the next value',
        'An array [value, done]',
      ],
      answer: 1,
      explanation: 'The iterator protocol requires next() to return { value, done }. When done is true, iteration ends. This shape is consistent across all iterables.',
    },
    {
      q: 'What is the difference between Symbol() and Symbol.for()?',
      options: [
        'Symbol() is global, Symbol.for() is local',
        'Symbol() always creates a new unique symbol; Symbol.for() uses a global registry',
        'Symbol.for() is faster',
        'There is no difference',
      ],
      answer: 1,
      explanation: 'Symbol() always creates a brand-new unique symbol. Symbol.for(key) looks up (or creates) a symbol in the global registry — same key returns the same symbol across calls, modules, and realms.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When would I actually use Symbol in production code?',
      a: 'Three main uses: (1) <strong>Unique property keys</strong> — adding metadata to objects shared with other code without collision risk. (2) <strong>Well-known symbol customization</strong> — making your class iterable with <code>Symbol.iterator</code>, or controlling type coercion with <code>Symbol.toPrimitive</code>. (3) <strong>Private-ish properties</strong> — before class private fields (<code>#prop</code>), symbols were used to add "hidden" properties that don\'t show up in normal enumeration.',
    },
    {
      q: 'How does for...of work under the hood?',
      a: '<code>for (const x of iterable)</code> calls <code>iterable[Symbol.iterator]()</code> to get an iterator, then repeatedly calls <code>iterator.next()</code> until <code>done: true</code>. Spread (<code>[...iterable]</code>), destructuring (<code>const [a,b] = iterable</code>), and <code>Array.from(iterable)</code> all use the same protocol.',
    },
    {
      q: 'What is the difference between an iterable and an iterator?',
      a: 'An <strong>iterable</strong> is an object with a <code>[Symbol.iterator]()</code> method that returns an iterator. An <strong>iterator</strong> is an object with a <code>next()</code> method returning <code>{value, done}</code>. Arrays are iterables (not iterators). Generators return objects that are both — they have <code>[Symbol.iterator]()</code> that returns <code>this</code>, plus <code>next()</code>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Symbol creates unique primitive keys that avoid naming collisions; well-known symbols like Symbol.iterator hook into JavaScript\'s built-in algorithms and make any object work with for...of, spread, and destructuring.',
    mustKnow: [
      'Symbol() always creates a unique value — two Symbol("x") are never equal',
      'Symbol.for("key") uses global registry — same key = same symbol across modules',
      'Symbol keys are hidden from Object.keys(), for...in, JSON.stringify()',
      'Symbol.iterator: makes object iterable — for...of, spread, destructuring',
      'Iterator protocol: next() returns { value, done } — done:true ends iteration',
      'Symbol.toPrimitive: control how objects convert to strings/numbers',
    ],
    interviewFocus: [
      'What are symbols used for and when would you choose Symbol.for() vs Symbol()?',
      'How does for...of work under the hood (iterator protocol)?',
      'Make a custom class iterable with Symbol.iterator',
      'Why are symbol keys hidden from JSON.stringify and how do you work around it?',
    ],
  };
}
