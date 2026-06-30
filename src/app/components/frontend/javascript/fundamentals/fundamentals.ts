import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  selector: 'app-js-fundamentals',
  standalone: true,
  imports: [CommonModule, RouterLink, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class JsFundamentals {
  theory: TheoryPoint[] = [
    {
      heading: 'Variables: var, let, const',
      points: [
        '<code>const</code> is the default choice — it signals intent and prevents accidental reassignment. Use it for everything that doesn\'t need to change.',
        '<code>let</code> is for values that need to be reassigned (loop counters, accumulated results). It is block-scoped, so it doesn\'t leak outside <code>{}</code>.',
        '<code>var</code> is function-scoped and hoisted as <code>undefined</code>, which causes subtle bugs — avoid it in modern code. It exists for legacy compatibility only.',
        'Declaring with <code>const</code> doesn\'t make objects immutable — it prevents <em>reassignment</em> of the binding. Object properties can still be mutated. Use <code>Object.freeze()</code> for deep immutability.',
        'All three declarations are hoisted to the top of their scope, but only <code>var</code> is initialized to <code>undefined</code>. <code>let</code>/<code>const</code> sit in the Temporal Dead Zone until their declaration is reached.',
      ]
    },
    {
      heading: 'Data Types & typeof',
      points: [
        'JavaScript has 8 types: <code>string</code>, <code>number</code>, <code>bigint</code>, <code>boolean</code>, <code>undefined</code>, <code>null</code>, <code>symbol</code>, and <code>object</code> (which includes arrays, functions, and plain objects).',
        '<code>typeof null === "object"</code> is a historical bug from JavaScript\'s first week — it has never been fixed to avoid breaking the web. Always check <code>value === null</code> explicitly.',
        '<code>typeof</code> is the safe way to check for undefined: <code>typeof x === "undefined"</code> doesn\'t throw if <code>x</code> was never declared, unlike <code>x === undefined</code> which throws a <code>ReferenceError</code>.',
        '<code>NaN</code> (Not a Number) is the only value in JavaScript not equal to itself. Use <code>Number.isNaN(x)</code> — not <code>isNaN(x)</code> — which coerces its argument first and gives wrong results for strings.',
        'Primitive values (string, number, boolean, etc.) are immutable and compared by value. Objects are mutable and compared by reference — two objects with identical contents are not <code>===</code> equal unless they are the same object.',
      ]
    },
    {
      heading: 'Type Coercion & Equality',
      points: [
        '<code>==</code> (loose equality) triggers type coercion before comparing. <code>===</code> (strict equality) compares both value and type without coercion. Use <code>===</code> everywhere — there\'s no good reason for <code>==</code> in production code.',
        'Coercion rules are complex and non-obvious: <code>"" == false</code> (true), <code>null == undefined</code> (true), <code>0 == false</code> (true). These are the source of many bugs when <code>==</code> is used.',
        'Truthy/falsy: only 6 values are falsy — <code>false</code>, <code>0</code>, <code>""</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code>. Everything else is truthy, including <code>[]</code>, <code>{}</code>, and the string <code>"false"</code>.',
        'The <code>||</code> operator returns the first truthy value; <code>&&</code> returns the first falsy value (or the last value). The nullish coalescing operator <code>??</code> only checks for <code>null</code>/<code>undefined</code>, not all falsy values.',
        'Use optional chaining <code>obj?.prop</code> to safely read nested properties without null-checking each level. It short-circuits and returns <code>undefined</code> if any link in the chain is <code>null</code>/<code>undefined</code>.',
      ]
    },
    {
      heading: 'Operators & Control Flow',
      points: [
        'Arithmetic: <code>+</code> is overloaded — when either operand is a string, it concatenates. <code>"5" + 1 = "51"</code> but <code>"5" - 1 = 4</code> (subtraction always coerces to numbers).',
        'Logical assignment operators (<code>??=</code>, <code>||=</code>, <code>&&=</code>) are short-circuit assignments introduced in ES2021. <code>x ??= defaultVal</code> only assigns if <code>x</code> is null/undefined.',
        'The ternary <code>condition ? a : b</code> is an expression (returns a value) — useful in JSX and template literals where statements are not allowed.',
        '<code>for...of</code> iterates values of any iterable (arrays, strings, Maps, Sets). <code>for...in</code> iterates enumerable keys — avoid it on arrays as it may include inherited properties.',
        'Labeled statements and <code>break label</code> / <code>continue label</code> can break out of nested loops — a rarely used but legitimate escape hatch for nested iteration.',
      ]
    },
    {
      heading: 'String & Template Literals',
      points: [
        'Template literals (backtick strings) support multi-line strings and embedded expressions <code>\`Hello, \${name}!\`</code>. They replace concatenation in virtually all cases.',
        'Tagged template literals let you process a template string with a function: <code>sql\`SELECT * FROM users WHERE id = \${id}\`</code> — used by styled-components, SQL query builders, i18n libraries.',
        'Strings are immutable in JavaScript — every string method returns a new string. Use <code>at(-1)</code> to access the last character instead of <code>[str.length - 1]</code>.',
        '<code>String.raw\`...\`</code> returns the raw string where backslash sequences are not processed — useful for regex patterns and file paths on Windows.',
        'Common string methods: <code>includes()</code>, <code>startsWith()</code>, <code>endsWith()</code>, <code>padStart()</code>/<code>padEnd()</code>, <code>trimStart()</code>/<code>trimEnd()</code>, <code>replaceAll()</code>.',
      ]
    },
    {
      heading: 'Numbers & Math',
      points: [
        'JavaScript uses IEEE 754 double-precision floating-point — <code>0.1 + 0.2 !== 0.3</code>. For precise decimal arithmetic use <code>BigInt</code> or a library like <code>decimal.js</code>.',
        '<code>Number.isFinite()</code> and <code>Number.isInteger()</code> are the safe alternatives to the global <code>isFinite()</code>/<code>isInteger()</code> which coerce their argument.',
        '<code>BigInt</code> handles integers larger than <code>Number.MAX_SAFE_INTEGER</code> (2^53 − 1). Create with <code>9007199254740993n</code> suffix. Cannot mix BigInt and Number in arithmetic.',
        'Math methods: <code>Math.floor()</code>, <code>Math.ceil()</code>, <code>Math.round()</code>, <code>Math.trunc()</code>, <code>Math.abs()</code>, <code>Math.max()</code>/<code>Math.min()</code>, <code>Math.random()</code>.',
        '<code>parseInt(str, radix)</code> always pass the radix (10 for decimal) — without it, strings starting with "0x" are parsed as hex, and older engines treated "0" prefix as octal.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'typeof x',            type: 'operator', desc: 'Returns type as string ("string","number","object","undefined","boolean","function","symbol","bigint")' },
    { name: 'x ?? y',              type: 'operator', desc: 'Returns y if x is null or undefined, else x (nullish coalescing)' },
    { name: 'x?.prop',             type: 'operator', desc: 'Optional chaining — returns undefined if x is null/undefined' },
    { name: 'Number.isNaN(x)',     type: 'method',   desc: 'True only if x is NaN (safe — unlike global isNaN)' },
    { name: 'Number.isFinite(x)',  type: 'method',   desc: 'True if x is a finite number (no coercion)' },
    { name: 'Number.isInteger(x)', type: 'method',   desc: 'True if x is an integer (no coercion)' },
    { name: 'structuredClone(obj)',type: 'method',   desc: 'Deep clone — handles nested objects, arrays, Dates, Maps, Sets' },
    { name: 'Object.freeze(obj)',  type: 'method',   desc: 'Makes object properties non-writable and non-configurable (shallow)' },
    { name: 'String.raw`...`',     type: 'method',   desc: 'Tagged template — raw string, backslashes not processed' },
    { name: 'BigInt(n) / n',       type: 'syntax',   desc: 'Arbitrary precision integer — use n suffix: 9007199254740993n' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables & Types',
      language: 'typescript',
      code: `// ── const / let / var ──────────────────────────────────────────────────
const PI = 3.14159;        // can't be reassigned
let count = 0;             // block-scoped, reassignable
// var legacy = "avoid";   // function-scoped, hoisted as undefined

// const doesn't make objects immutable
const user = { name: 'Alice' };
user.name = 'Bob';          // OK — mutating a property
// user = {};               // TypeError — reassigning the binding

// ── Types ──────────────────────────────────────────────────────────────
typeof "hello"      // "string"
typeof 42           // "number"
typeof true         // "boolean"
typeof undefined    // "undefined"
typeof null         // "object"  ← historical bug
typeof {}           // "object"
typeof []           // "object"  ← arrays are objects
typeof function(){} // "function"
typeof Symbol()     // "symbol"
typeof 42n          // "bigint"

// Safe null check
const val = null;
if (val === null) console.log('is null');

// Safe undefined check (won't throw if x is undeclared)
if (typeof x === 'undefined') console.log('x not declared');`,
    },
    {
      label: 'Coercion & Equality',
      language: 'typescript',
      code: `// ── Strict vs loose equality ────────────────────────────────────────────
console.log(1 === "1");  // false — different types
console.log(1 == "1");   // true  — coercion: string → number

// Tricky coercions with ==
console.log("" == false);        // true
console.log(null == undefined);  // true
console.log([] == false);        // true  ([] → "" → 0)
// Rule: always use ===

// ── Falsy values (exactly 6) ─────────────────────────────────────────
const falsyValues = [false, 0, "", null, undefined, NaN];
// Everything else is truthy — including [], {}, "false"

// ── Nullish coalescing vs OR ──────────────────────────────────────────
const name = null;
console.log(name || "default");   // "default" (falsy check)
console.log(name ?? "default");   // "default" (null/undefined check)

const count = 0;
console.log(count || 10);  // 10  — wrong! 0 is falsy
console.log(count ?? 10);  // 0   — correct, 0 is not null/undefined

// ── Optional chaining ────────────────────────────────────────────────
const obj = { user: { address: null } };
console.log(obj?.user?.address?.city);   // undefined (no error)
console.log(obj?.phone?.number);          // undefined (no error)

// Logical assignment
let x = null;
x ??= "fallback";   // assigns only if x is null/undefined
console.log(x);      // "fallback"`,
    },
    {
      label: 'Template Literals',
      language: 'typescript',
      code: `// ── Basic template literals ────────────────────────────────────────────
const name = "Alice";
const age = 30;
const greeting = \`Hello, \${name}! You are \${age} years old.\`;
// vs. concatenation: "Hello, " + name + "! You are " + age + " years old."

// Multi-line strings
const html = \`
  <div class="card">
    <h2>\${name}</h2>
    <p>Age: \${age}</p>
  </div>
\`;

// Expressions in templates
const price = 9.99;
const tax = 0.1;
console.log(\`Total: \$\{(price * (1 + tax)).toFixed(2)}\`);  // Total: $10.99

// ── Tagged templates ──────────────────────────────────────────────────
function highlight(strings, ...values) {
  return strings.reduce((acc, str, i) => {
    const val = values[i - 1];
    return acc + (val !== undefined ? \`<mark>\${val}</mark>\` : '') + str;
  });
}
const product = "JavaScript";
console.log(highlight\`Learn \${product} today!\`);
// "Learn <mark>JavaScript</mark> today!"

// SQL template tag example (in practice, use a library)
function sql(strings, ...values) {
  // Parameterize to prevent injection
  return { text: strings.join('?'), values };
}
const userId = 42;
const query = sql\`SELECT * FROM users WHERE id = \${userId}\`;
// { text: 'SELECT * FROM users WHERE id = ?', values: [42] }

// String.raw for regex patterns
const regex = new RegExp(String.raw\`\d+\.\d+\`);
console.log(regex.test("3.14")); // true`,
    },
    {
      label: 'Numbers & Math',
      language: 'typescript',
      code: `// ── Floating point gotcha ──────────────────────────────────────────────
console.log(0.1 + 0.2);               // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);       // false

// For comparisons: use epsilon
const EPSILON = Number.EPSILON;
console.log(Math.abs(0.1 + 0.2 - 0.3) < EPSILON);  // true

// For display: toFixed
console.log((0.1 + 0.2).toFixed(2));  // "0.30"

// ── Safe number checks ───────────────────────────────────────────────
console.log(Number.isNaN(NaN));        // true
console.log(Number.isNaN("abc"));      // false (no coercion!)
console.log(isNaN("abc"));             // true  (coerces! "abc" → NaN)

console.log(Number.isFinite(Infinity)); // false
console.log(Number.isInteger(3.0));     // true
console.log(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)); // false

// ── parseInt & parseFloat ────────────────────────────────────────────
parseInt("42px", 10);    // 42 — stops at non-numeric
parseInt("0x1A", 16);    // 26 — hex
parseFloat("3.14em");    // 3.14

// ── BigInt ────────────────────────────────────────────────────────────
const big = 9007199254740993n;
console.log(big === 9007199254740993n);  // true (would be false with Number)

// Can't mix BigInt and Number
// big + 1    // TypeError
big + 1n;    // 9007199254740994n — correct

// ── Math utilities ───────────────────────────────────────────────────
Math.trunc(-4.7);    // -4 (remove decimal, toward zero)
Math.floor(-4.7);    // -5 (toward -Infinity)
Math.ceil(-4.7);     // -4 (toward +Infinity)
Math.sign(-5);       // -1 | 0 | 1
Math.log2(8);        // 3
Math.clamp ??        // not built-in — use Math.min(max, Math.max(min, val))`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using == instead of ===',
      wrong: `if (user.id == "42") { /* runs for both 42 and "42" */ }`,
      right: `if (user.id === 42) { /* only matches number 42 */ }`,
      explanation: 'Loose equality coerces types before comparing, producing non-obvious results. Always use === unless you specifically need type coercion.',
    },
    {
      title: 'typeof null check',
      wrong: `if (typeof value === 'object') { doSomething(value.data); }`,
      right: `if (value !== null && typeof value === 'object') { doSomething(value.data); }`,
      explanation: 'typeof null === "object" is a historic bug. Always add a null check when checking for object type to avoid calling methods on null.',
    },
    {
      title: 'isNaN() coercion',
      wrong: `if (isNaN(userInput)) { showError(); }  // isNaN("") = false, isNaN(" ") = false`,
      right: `if (Number.isNaN(Number(userInput)) || userInput === '') { showError(); }`,
      explanation: 'The global isNaN() coerces its argument, making empty strings and whitespace pass falsely. Use Number.isNaN() after explicit conversion.',
    },
    {
      title: 'Using || for default values with falsy 0',
      wrong: `function setVolume(vol) { const v = vol || 50; }  // 0 becomes 50!`,
      right: `function setVolume(vol) { const v = vol ?? 50; }  // 0 stays 0`,
      explanation: '|| treats 0, "", false as falsy, replacing them with the default. Use ?? (nullish coalescing) which only triggers on null or undefined.',
    },
    {
      title: 'Mutating const objects thinking they\'re immutable',
      wrong: `const config = { debug: false }; config.debug = true; // silently succeeds`,
      right: `const config = Object.freeze({ debug: false }); config.debug = true; // throws in strict mode`,
      explanation: 'const prevents rebinding the variable, not mutation of the object. Use Object.freeze() for truly immutable shallow objects.',
    },
    {
      title: '0.1 + 0.2 floating point comparison',
      wrong: `if (price + tax === 0.3) { applyDiscount(); }  // never runs`,
      right: `if (Math.abs(price + tax - 0.3) < Number.EPSILON) { applyDiscount(); }`,
      explanation: 'IEEE 754 floating-point arithmetic produces rounding errors. Never use === for float comparisons — use an epsilon tolerance instead.',
    },
  ];

  challenge: Challenge = {
    title: 'Type-Safe Value Normalizer',
    language: 'typescript',
    description: 'Write a function `normalize(value)` that:\n- Returns 0 for null, undefined, NaN, Infinity, or -Infinity\n- Returns the number for valid finite numbers (including 0)\n- Parses strings to numbers (returns 0 if not a valid number)\n- Returns 0 for booleans, objects, arrays\n\nBonus: Write a `safeDiv(a, b)` that returns null instead of Infinity/NaN.',
    hints: [
      'typeof can distinguish string from number from object',
      'Number.isFinite() is the key check for valid numbers',
      'parseFloat() + Number.isFinite() handles string parsing',
      'For bonus: check b === 0 before dividing',
    ],
    starterCode: `function normalize(value) {
  // Your implementation here
}

function safeDiv(a, b) {
  // Return null if division would produce Infinity or NaN
}

// Tests
console.log(normalize(42));          // 42
console.log(normalize(0));           // 0
console.log(normalize("3.14"));      // 3.14
console.log(normalize("abc"));       // 0
console.log(normalize(null));        // 0
console.log(normalize(undefined));   // 0
console.log(normalize(NaN));         // 0
console.log(normalize(Infinity));    // 0
console.log(normalize({}));          // 0

console.log(safeDiv(10, 2));   // 5
console.log(safeDiv(10, 0));   // null`,
    solution: `function normalize(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function safeDiv(a, b) {
  if (b === 0) return null;
  const result = a / b;
  return Number.isFinite(result) ? result : null;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `typeof null` return?',
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      answer: 2,
      explanation: 'typeof null === "object" is a historical bug from JavaScript\'s original implementation. It has never been fixed to avoid breaking existing web pages.',
    },
    {
      q: 'Which values are falsy in JavaScript?',
      options: [
        'false, 0, "", null, undefined, NaN',
        'false, 0, "", null, undefined, NaN, [], {}',
        'false, 0, "", null, undefined',
        'false, null, undefined',
      ],
      answer: 0,
      explanation: 'Exactly 6 values are falsy: false, 0, "", null, undefined, NaN. Empty arrays and objects are truthy even though they\'re "empty".',
    },
    {
      q: 'What is the result of `0.1 + 0.2 === 0.3`?',
      options: ['true', 'false', 'NaN', 'TypeError'],
      answer: 1,
      explanation: 'False — IEEE 754 floating-point gives 0.30000000000000004. Use Math.abs(a - b) < Number.EPSILON for float comparisons.',
    },
    {
      q: 'What does `const arr = [1,2,3]; arr.push(4)` do?',
      options: [
        'TypeError — const arrays are immutable',
        'Pushes 4 into the array (length becomes 4)',
        'Creates a new array [1,2,3,4]',
        'Silently fails',
      ],
      answer: 1,
      explanation: 'const prevents rebinding the variable (arr = something_else), not mutation. You can still push, pop, and modify elements.',
    },
    {
      q: 'What does `count ?? 10` return when count is 0?',
      options: ['10', '0', 'undefined', 'null'],
      answer: 1,
      explanation: '?? (nullish coalescing) only triggers for null and undefined — not for 0, "", false. So 0 ?? 10 returns 0. Unlike ||, which returns 10 because 0 is falsy.',
    },
    {
      q: 'Which is the safest way to check if x is NaN?',
      options: ['x === NaN', 'isNaN(x)', 'Number.isNaN(x)', 'typeof x === "NaN"'],
      answer: 2,
      explanation: 'NaN is the only value not equal to itself, so === NaN always fails. Global isNaN() coerces its argument. Number.isNaN() returns true only for the actual NaN value.',
    },
    {
      q: 'What does `parseInt("08", 10)` return?',
      options: ['0', '8', 'NaN', 'undefined'],
      answer: 1,
      explanation: 'With radix 10, parseInt correctly parses "08" as 8. Without the radix, some engines historically treated leading "0" as octal (where 8 is invalid) — always pass the radix.',
    },
    {
      q: 'What is `[] == false`?',
      options: ['true', 'false', 'TypeError', 'undefined'],
      answer: 0,
      explanation: 'true — [] coerces to "" (via .toString()), then to 0. false coerces to 0. So 0 == 0 is true. This is one of many reasons to always use ===.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between null and undefined?',
      a: '<code>undefined</code> means a variable was declared but never assigned a value — it\'s the default absence of value. <code>null</code> is an explicit assignment meaning "no value here intentionally." In practice: use <code>null</code> to clear a value, functions return <code>undefined</code> by default.',
    },
    {
      q: 'Why does typeof NaN return "number"?',
      a: '<code>NaN</code> stands for "Not a Number" but its type is <code>"number"</code> in the IEEE 754 spec. It\'s a numeric value representing an invalid or undefined numerical result (like <code>0/0</code> or <code>parseInt("abc")</code>). Use <code>Number.isNaN()</code> to detect it.',
    },
    {
      q: 'When should you use ?? vs ||?',
      a: 'Use <code>??</code> when you want a default only for <code>null</code>/<code>undefined</code> — preserving legitimate falsy values like <code>0</code>, <code>false</code>, and <code>""</code>. Use <code>||</code> when you want a fallback for <em>any</em> falsy value. Example: <code>volume ?? 50</code> keeps <code>0</code> (muted) but <code>volume || 50</code> would replace <code>0</code> with <code>50</code>.',
    },
    {
      q: 'What is the difference between var, let, and const scoping?',
      a: '<code>var</code> is <strong>function-scoped</strong> — it leaks out of <code>if</code>/<code>for</code> blocks and is hoisted as <code>undefined</code>. <code>let</code> and <code>const</code> are <strong>block-scoped</strong> — they only exist within <code>{}</code> and are in the TDZ before their declaration. <code>const</code> additionally prevents rebinding.',
    },
    {
      q: 'What is the Temporal Dead Zone (TDZ)?',
      a: 'The TDZ is the period between entering a block scope and reaching the <code>let</code>/<code>const</code> declaration. During this period, accessing the variable throws a <code>ReferenceError</code>. This is why <code>let</code>/<code>const</code> appear "not hoisted" — they are hoisted (the engine knows they exist) but uninitialized.',
    },
    {
      q: 'What is type coercion and when does it cause unexpected bugs?',
      a: 'Type coercion is JavaScript\'s implicit conversion of values to a different type. It causes bugs most often in: (1) equality checks — <code>0 == ""</code> is <code>true</code>; use <code>===</code>. (2) addition vs concatenation — <code>"5" + 3 = "53"</code> because <code>+</code> prefers strings. (3) boolean contexts — <code>if ([]) {}</code> executes (empty array is truthy). Always use <code>===</code>, be explicit about conversions with <code>Number()</code>, <code>String()</code>, <code>Boolean()</code>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'JavaScript uses dynamic typing with 8 primitive/reference types; always prefer const, ===, and nullish coalescing over var, ==, and ||.',
    mustKnow: [
      'The 6 falsy values: false, 0, "", null, undefined, NaN — everything else is truthy',
      'typeof null === "object" is a bug — check === null explicitly',
      'const prevents rebinding, not mutation — use Object.freeze() for immutability',
      '?? vs ||: ?? only checks null/undefined; || checks all falsy values',
      'Number.isNaN() is safe; global isNaN() coerces and gives wrong answers',
      '0.1 + 0.2 !== 0.3 — use Number.EPSILON for float comparisons',
      'Template literals support expressions, multi-line strings, and tagged templates',
    ],
    interviewFocus: [
      'typeof null === "object" — why and how to safely check for null',
      'Difference between == and === — always use ===',
      'Why is 0.1 + 0.2 !== 0.3 and how do you work around it?',
      'What is the TDZ and how does it differ from var hoisting?',
    ],
  };
}
