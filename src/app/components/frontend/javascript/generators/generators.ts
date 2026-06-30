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
  selector: 'app-js-generators',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './generators.html',
  styleUrl: './generators.scss',
})
export class JsGenerators {
  theory: TheoryPoint[] = [
    {
      heading: 'Generator Functions',
      points: [
        'A generator function (<code>function*</code>) returns a generator object that implements both the iterator and iterable protocols. It pauses at each <code>yield</code> and resumes when <code>next()</code> is called.',
        'Calling a generator function does NOT execute its body — it returns the generator object. Body execution starts on the first <code>.next()</code> call.',
        'Each <code>yield expression</code> pauses execution and returns <code>{ value: expression, done: false }</code>. When the function returns (or falls off the end), it yields <code>{ value: returnValue, done: true }</code>.',
        'Two-way communication: <code>next(value)</code> passes <code>value</code> INTO the generator — it becomes the result of the current <code>yield</code> expression inside the function.',
      ]
    },
    {
      heading: 'Use Cases',
      points: [
        '<strong>Infinite sequences:</strong> generate IDs, Fibonacci numbers, timestamps — values are produced lazily, no array needed.',
        '<strong>Lazy iteration:</strong> process large datasets item-by-item without loading everything into memory. Great for parsing streams, reading files line-by-line.',
        '<strong>State machines:</strong> generator state persists between calls, making complex step-by-step logic easy to express without external state variables.',
        '<strong>Coroutines:</strong> two pieces of code take turns executing — generators were the building blocks for async/await before native async functions existed.',
        '<strong>Custom iterators:</strong> implement <code>[Symbol.iterator]</code> as a generator for clean, readable iterable classes.',
      ]
    },
    {
      heading: 'yield* (Delegation)',
      points: [
        '<code>yield*</code> delegates to another iterable — it yields all values from that iterable before continuing. Works with any iterable: arrays, strings, other generators.',
        'The return value of <code>yield* gen()</code> is the final <code>{ done: true, value: returnValue }</code> from the delegated generator — not the last yielded value.',
        'Use <code>yield*</code> to compose generators: flatten nested structures, chain sequences, or implement tree traversal recursively.',
      ]
    },
    {
      heading: 'Async Generators',
      points: [
        '<code>async function*</code> creates an async generator — it can use both <code>await</code> and <code>yield</code>. Each <code>next()</code> call returns a Promise.',
        'Consume with <code>for await...of</code> — works like <code>for...of</code> but awaits each iteration.',
        'Perfect for paginated APIs, streaming data, SSE (Server-Sent Events), WebSocket message streams.',
        '<code>ReadableStream</code> (Streams API) can be consumed with <code>for await...of</code> in modern environments.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'function*',             type: 'syntax',  desc: 'Generator function — returns a generator object' },
    { name: 'yield value',           type: 'syntax',  desc: 'Pause and emit value; resumes on next .next()' },
    { name: 'yield* iterable',       type: 'syntax',  desc: 'Delegate to another iterable — yields all its values' },
    { name: 'gen.next(val)',         type: 'method',  desc: 'Resume; val becomes result of current yield expression' },
    { name: 'gen.return(val)',       type: 'method',  desc: 'Terminate the generator, returning { value:val, done:true }' },
    { name: 'gen.throw(err)',        type: 'method',  desc: 'Throw err into the generator at the current yield point' },
    { name: 'async function*',       type: 'syntax',  desc: 'Async generator — can use both await and yield' },
    { name: 'for await...of',        type: 'syntax',  desc: 'Consume async iterables — awaits each iteration' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Generator Basics',
      language: 'typescript',
      code: `// ── Simple generator ──────────────────────────────────────────────────
function* counter(start = 0, step = 1) {
  while (true) {
    yield start;
    start += step;
  }
}

const evens = counter(0, 2);
evens.next();  // { value: 0, done: false }
evens.next();  // { value: 2, done: false }
evens.next();  // { value: 4, done: false }

// Use with spread / destructure / for...of (need to limit infinite!)
function take(gen, n) {
  const result = [];
  for (const v of gen) {
    result.push(v);
    if (result.length >= n) break;
  }
  return result;
}
take(counter(1), 5);  // [1, 2, 3, 4, 5]

// ── Finite generator ──────────────────────────────────────────────────
function* range(start, end, step = 1) {
  for (let i = start; i <= end; i += step) {
    yield i;
  }
}

[...range(1, 10, 2)];  // [1, 3, 5, 7, 9]

// ── Two-way communication ─────────────────────────────────────────────
function* accumulator() {
  let total = 0;
  while (true) {
    const n = yield total;  // yield current total, receive next number
    if (n === null) return total;
    total += n;
  }
}

const acc = accumulator();
acc.next();     // start: { value: 0 }
acc.next(5);    // add 5: { value: 5 }
acc.next(3);    // add 3: { value: 8 }
acc.next(null); // done: { value: 8, done: true }`,
    },
    {
      label: 'yield* & Composition',
      language: 'typescript',
      code: `// ── yield* delegation ────────────────────────────────────────────────
function* concat(...iterables) {
  for (const it of iterables) {
    yield* it;
  }
}

[...concat([1, 2], 'ab', [3, 4])];
// [1, 2, 'a', 'b', 3, 4]

// ── Tree traversal with generators ───────────────────────────────────
function* walkTree(node) {
  yield node.value;
  for (const child of node.children ?? []) {
    yield* walkTree(child);  // recursive delegation!
  }
}

const tree = {
  value: 1,
  children: [
    { value: 2, children: [{ value: 4 }, { value: 5 }] },
    { value: 3, children: [{ value: 6 }] },
  ]
};

[...walkTree(tree)];  // [1, 2, 4, 5, 3, 6]  (depth-first)

// ── Flatten arbitrary depth ───────────────────────────────────────────
function* flatten(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) yield* flatten(item);
    else yield item;
  }
}

[...flatten([1, [2, [3, [4]], 5]])];  // [1, 2, 3, 4, 5]`,
    },
    {
      label: 'Async Generators',
      language: 'typescript',
      code: `// ── Async generator: paginated API ───────────────────────────────────
async function* fetchAllPages(baseUrl) {
  let page = 1;
  while (true) {
    const res = await fetch(\`\${baseUrl}?page=\${page}\`);
    const { data, hasMore } = await res.json();
    yield* data;         // yield each item from this page
    if (!hasMore) break;
    page++;
  }
}

// Consume all users across all pages
for await (const user of fetchAllPages('/api/users')) {
  console.log(user.name);
  // Fetches next page only when this page's items are exhausted
}

// ── Process in batches ────────────────────────────────────────────────
async function* batch(asyncIterable, size) {
  let current = [];
  for await (const item of asyncIterable) {
    current.push(item);
    if (current.length === size) {
      yield current;
      current = [];
    }
  }
  if (current.length) yield current;
}

for await (const chunk of batch(fetchAllPages('/api/users'), 10)) {
  await processBatch(chunk);  // process 10 at a time
}

// ── ReadableStream as async iterable ─────────────────────────────────
async function readStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function* lines() {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) { if (buffer) yield buffer; return; }
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop();   // keep incomplete line
      yield* parts;
    }
  }

  for await (const line of lines()) {
    console.log(line);
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling generator function and expecting immediate execution',
      wrong: `function* gen() { console.log('started'); yield 1; }
gen();  // nothing printed — calling doesn't execute the body!`,
      right: `const g = gen();
g.next();  // "started" — body runs until first yield`,
      explanation: 'Calling a generator function returns a generator object without executing the body. The body runs on the first next() call.',
    },
    {
      title: 'Spreading an infinite generator',
      wrong: `function* naturals() { let n=0; while(true) yield n++; }
[...naturals()];  // infinite loop — hangs the browser`,
      right: `function take(gen, n) {
  const r = []; for(const v of gen) { r.push(v); if(r.length>=n) break; } return r;
}
take(naturals(), 5);  // [0,1,2,3,4]`,
      explanation: 'Spreading an infinite generator tries to collect all values — an infinite operation. Always limit consumption with break or a take() utility.',
    },
    {
      title: 'Ignoring the value passed to next()',
      wrong: `function* gen() {
  const x = yield 'give me a value';
  // x is undefined if you don't pass a value to next()
  yield x * 2;
}
const g = gen();
g.next();       // start
g.next();       // x = undefined, yields NaN`,
      right: `g.next();    // start — returns { value: 'give me a value' }
g.next(5);   // x = 5, yields { value: 10 }`,
      explanation: 'The value passed to next() becomes the result of the CURRENT yield expression inside the generator. Forgetting to pass a value leaves the yield result as undefined.',
    },
    {
      title: 'Using for...of instead of for await...of with async generators',
      wrong: `async function* asyncGen() { yield await fetch('/api'); }
for (const val of asyncGen()) {  // TypeError — async generator returns Promises
  console.log(val);
}`,
      right: `for await (const val of asyncGen()) {
  console.log(val);  // properly awaits each yielded Promise
}`,
      explanation: 'Async generators yield Promises. Use for await...of to properly await each value. for...of would give you the raw Promise objects.',
    },
    {
      title: 'Forgetting that return value in generator is the done:true value',
      wrong: `function* gen() {
  yield 1; yield 2; return 3;
}
const arr = [...gen()];  // [1, 2] — 3 is NOT included!`,
      right: `// The return value is in { value: 3, done: true } — spread ignores done:true
const g = gen();
g.next(); // {value:1,done:false}
g.next(); // {value:2,done:false}
g.next(); // {value:3,done:true}  ← only accessible manually
// Use return to pass a final value to yield* callee, not to spread`,
      explanation: 'The value in the done:true final result is not included in spread or for...of. It\'s only accessible by calling next() manually or as yield* return value.',
    },
    {
      title: 'Not handling generator cleanup with return()',
      wrong: `// If consumer breaks early, generator cleanup (finally) may not run
function* withResource() {
  const resource = acquireResource();
  try { yield* processItems(resource); }
  finally { releaseResource(resource); }  // runs on return() or throw()
}
// Early break: for(const v of withResource()) { if(v===3) break; }
// ← break calls gen.return() which triggers finally — this is CORRECT`,
      right: `// The above pattern IS correct — break/return triggers finally.
// The mistake is using generators WITHOUT try/finally when cleanup is needed.
function* badGen() {
  const conn = openConnection();
  yield* fetchData(conn);
  conn.close();  // NOT reached if consumer breaks early!
}`,
      explanation: 'break in for...of calls generator.return() which triggers finally blocks. Always wrap resource acquisition in try/finally inside generators for safe cleanup.',
    },
  ];

  challenge: Challenge = {
    title: 'Lazy Pipeline with Generators',
    language: 'typescript',
    description: 'Implement a lazy pipeline of generator utilities:\n1. `map(gen, fn)` — lazily maps values\n2. `filter(gen, pred)` — lazily filters values\n3. `take(gen, n)` — takes first n values\n4. `pipe(...fns)` — composes generator transformers\n\nThen use them to process the first 3 even squares from an infinite number sequence.',
    hints: [
      'Each utility is a generator that takes a generator and yields transformed values',
      'map: for (const v of gen) yield fn(v)',
      'filter: for (const v of gen) if (pred(v)) yield v',
      'take: for (const v of gen) { yield v; if (--n === 0) return; }',
    ],
    starterCode: `function* naturals(start = 0) {
  while (true) yield start++;
}

function* map(gen, fn) { /* lazy map */ }
function* filter(gen, pred) { /* lazy filter */ }
function* take(gen, n) { /* take first n */ }

// Should lazily produce: [4, 16, 36] (squares of 2,4,6 — first 3 even squares)
const result = [...take(
  filter(map(naturals(1), n => n * n), n => n % 2 === 0),
  3
)];
console.log(result);  // [4, 16, 36]`,
    solution: `function* naturals(start = 0) { while (true) yield start++; }

function* map(gen, fn) { for (const v of gen) yield fn(v); }
function* filter(gen, pred) { for (const v of gen) { if (pred(v)) yield v; } }
function* take(gen, n) { for (const v of gen) { yield v; if (--n === 0) return; } }

const result = [...take(
  filter(map(naturals(1), n => n * n), n => n % 2 === 0),
  3
)];`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does calling a generator function return?',
      options: [
        'The first yielded value',
        'A generator object (the body does not execute yet)',
        'A Promise',
        'undefined',
      ],
      answer: 1,
      explanation: 'Calling a generator function returns a generator object without executing the body. The body runs on the first next() call, up to the first yield.',
    },
    {
      q: 'What is two-way communication in generators?',
      options: [
        'yield sends data out; throw() sends errors in',
        'yield sends data out; next(value) sends value in as the yield result',
        'Generators can call back their parent function',
        'Two generators can communicate with each other',
      ],
      answer: 1,
      explanation: 'yield sends a value out to the caller. The value passed to next(val) becomes the result of the current yield expression inside the generator — sending data back in.',
    },
    {
      q: 'What does `yield*` do?',
      options: [
        'Yields a Promise',
        'Delegates to another iterable, yielding all its values',
        'Yields and immediately resumes',
        'Creates an infinite sequence',
      ],
      answer: 1,
      explanation: 'yield* delegates to another iterable (array, string, other generator). It yields each value from that iterable before the generator continues.',
    },
    {
      q: 'How do you consume an async generator?',
      options: [
        'for...of',
        'for await...of',
        'Promise.all() on the generator',
        '.then() on each next() call',
      ],
      answer: 1,
      explanation: 'Async generators yield Promises. for await...of properly awaits each yielded value. Regular for...of would give you the raw Promise objects.',
    },
    {
      q: 'Is the return value of a generator included when you spread it?',
      options: [
        'Yes — it\'s the last element',
        'No — spread/for...of stops at done:true and ignores the return value',
        'Only if it is not undefined',
        'Yes — it is always the last element',
      ],
      answer: 1,
      explanation: 'The return value appears in the { done: true, value: returnValue } object. Spread and for...of stop at done:true and do NOT include the return value in the results.',
    },
    {
      q: 'What does passing a value to generator.next(value) do?',
      options: ['It is ignored', 'It becomes the result of the yield expression inside the generator', 'It appends to the yielded sequence', 'It throws inside the generator'],
      answer: 1,
      explanation: 'The value passed to .next(value) becomes the value of the yield expression on the left of the = inside the generator. The first .next() call starts execution and its argument is ignored.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When would I actually use generators over async/await?',
      a: 'Generators shine for: (1) <strong>Infinite/lazy sequences</strong> where you don\'t know how many values you need upfront. (2) <strong>Custom iterables</strong> — cleaner than manual Symbol.iterator + next(). (3) <strong>State machines</strong> where each step has its own state. (4) <strong>Async data streams</strong> (async generators) for paginated APIs, WebSocket feeds. async/await is simpler for one-shot async operations; generators for continuous, lazy, or stepped flows.',
    },
    {
      q: 'How did generators relate to the history of async/await?',
      a: 'Before native async/await (ES2017), libraries like <code>co</code> used generators to write async code that looked synchronous. The pattern: yield a Promise, the runner awaits it and resumes the generator with the result. async/await is essentially this pattern baked into the language — it uses generators internally in many engine implementations.',
    },
    {
      q: 'What happens to generator cleanup if the consumer breaks early?',
      a: 'When a <code>for...of</code> loop breaks early (or throws), JavaScript calls <code>generator.return()</code> which causes the generator to run any <code>finally</code> blocks and terminate cleanly. This is how resource cleanup works: wrap resource acquisition in <code>try/finally</code> inside the generator — the finally block runs even on early termination.',
    },
    {
      q: 'What is an async generator and when would you use one?',
      a: 'An async generator is declared with <code>async function*</code> and can use both <code>yield</code> and <code>await</code>. It returns an AsyncIterator consumed with <code>for await...of</code>. Use it for paginated API calls, server-sent events, reading streams chunk by chunk, or any scenario where you produce values asynchronously one at a time. It combines the lazy pull model of generators with async I/O.',
    },
    {
      q: 'How do generators differ from iterators?',
      a: 'An <strong>iterator</strong> is any object with a <code>next()</code> method returning <code>{value, done}</code> — you implement all the state management manually. A <strong>generator</strong> is a function that automatically creates an iterator for you — state, pausing, and resuming are handled by the engine via <code>yield</code>. All generators produce iterators, but not all iterators are generators.',
    },
    {
      q: 'How can generators implement the observer pattern?',
      a: 'By receiving values via <code>yield</code> and processing them: <code>const result = yield nextValue</code> — the sender calls <code>gen.next(incomingValue)</code>. This creates a coroutine where the generator is both a producer (yielding) and a consumer (receiving). Libraries like Redux-Saga use this to create testable async workflows where effects are plain values that the middleware interprets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Generator functions pause at yield and resume on next() — enabling lazy infinite sequences, custom iterables, coroutines, and async data streams via async function*.',
    mustKnow: [
      'Calling function*() returns a generator object — body doesn\'t run until first next()',
      'yield pauses and emits; next(val) resumes with val as the yield expression result',
      'yield* delegates to another iterable — yields all its values',
      'Async generators: async function* + for await...of for paginated/streamed data',
      'Spread/for...of ignores the done:true return value',
      'Break triggers generator.return() — finally blocks run for cleanup',
    ],
    interviewFocus: [
      'Explain how generators work — function*, yield, next()',
      'Two-way communication: what does next(value) do?',
      'Implement a lazy infinite sequence with generators',
      'When would you use an async generator vs Promise.all?',
    ],
  };
}
