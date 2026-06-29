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
  selector: 'app-js-destructuring',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './destructuring.html',
  styleUrl: './destructuring.scss',
})
export class JsDestructuring {
  theory: TheoryPoint[] = [
    {
      heading: 'Object Destructuring',
      points: [
        'Object destructuring extracts properties by name: <code>const { a, b } = obj</code>. The variable name must match the property name — or rename with <code>{ prop: newName }</code>.',
        'Default values: <code>const { x = 0, y = 0 } = point</code> — defaults apply when the property is <code>undefined</code> (not null).',
        'Renaming + default: <code>const { color: fillColor = "black" } = style</code> — rename AND provide a default in one step.',
        'Nested destructuring: <code>const { user: { name, address: { city } } } = data</code> — extract from deeply nested structures. Be careful — if an intermediate property is <code>undefined</code>, it throws.',
        'Rest in object destructuring: <code>const { id, ...rest } = obj</code> — <code>rest</code> gets all own enumerable properties not explicitly destructured. Great for "omit" patterns.',
      ]
    },
    {
      heading: 'Array Destructuring',
      points: [
        'Array destructuring uses position: <code>const [first, second] = arr</code>. You can skip elements with commas: <code>const [,, third] = arr</code>.',
        'Rest with arrays: <code>const [head, ...tail] = arr</code> — <code>tail</code> is a new array of all remaining elements.',
        'Swap variables without a temp: <code>[a, b] = [b, a]</code> — clean, idiomatic JS.',
        'Array destructuring works on any iterable — strings, Sets, Maps, generators, anything with <code>Symbol.iterator</code>.',
        'The array is not consumed — you read from a copy of the iterator. Destructuring a generator does advance it though.',
      ]
    },
    {
      heading: 'Spread & Rest Operators',
      points: [
        'Spread in an array literal: <code>[...a, ...b]</code> — concatenate arrays without <code>.concat()</code>.',
        'Spread in a function call: <code>fn(...args)</code> — equivalent to <code>fn.apply(null, args)</code>.',
        'Spread in object literals: <code>{ ...obj1, ...obj2 }</code> — shallow merge (rightmost wins for conflicts).',
        'Rest in function parameters: <code>function f(first, ...rest)</code> — captures remaining arguments as a real array.',
        'Spread is the inverse of rest: rest collects into an array, spread expands an array back out.',
      ]
    },
    {
      heading: 'Practical Patterns',
      points: [
        '<strong>Function parameter destructuring:</strong> <code>function draw({ x = 0, y = 0, color = "black" } = {})</code> — named arguments with defaults and a fallback empty object.',
        '<strong>Returning multiple values:</strong> return an array or object and destructure at the call site: <code>const [data, error] = await fetchUser(id)</code>.',
        '<strong>Aliased imports:</strong> <code>import { useState as state } from "react"</code> uses the same renaming syntax as object destructuring.',
        '<strong>Swap with array destructuring:</strong> <code>[arr[i], arr[j]] = [arr[j], arr[i]]</code> — in-place swap of array elements.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'const { a, b } = obj',      type: 'syntax', desc: 'Object destructure — extract by property name' },
    { name: 'const { a: x } = obj',      type: 'syntax', desc: 'Rename: extract a, store as x' },
    { name: 'const { a = 0 } = obj',     type: 'syntax', desc: 'Default: use 0 if a is undefined' },
    { name: 'const { a, ...rest } = obj', type: 'syntax', desc: 'Rest: rest gets all remaining own props' },
    { name: 'const [x, y] = arr',        type: 'syntax', desc: 'Array destructure — extract by position' },
    { name: 'const [h, ...t] = arr',     type: 'syntax', desc: 'Array rest: t gets remaining elements as array' },
    { name: '[a, b] = [b, a]',           type: 'syntax', desc: 'Swap two variables without temp' },
    { name: '[...a, ...b]',              type: 'syntax', desc: 'Spread concat two arrays' },
    { name: '{ ...a, ...b }',            type: 'syntax', desc: 'Spread merge two objects (rightmost wins)' },
    { name: 'fn(...arr)',                type: 'syntax', desc: 'Spread array as function arguments' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Object Destructuring',
      language: 'typescript',
      code: `// ── Basic ─────────────────────────────────────────────────────────────
const user = { id: 1, name: 'Alice', role: 'admin', age: 30 };
const { name, role } = user;             // name='Alice', role='admin'

// Rename
const { name: userName, role: userRole } = user;

// Default values
const { theme = 'light', lang = 'en' } = {};  // both get defaults

// Rename + default
const { color: bgColor = '#fff' } = {};   // bgColor = '#fff'

// ── Nested destructuring ──────────────────────────────────────────────
const data = { user: { name: 'Bob', address: { city: 'NYC', zip: '10001' } } };
const { user: { name: userName2, address: { city } } } = data;
// userName2 = 'Bob', city = 'NYC'

// ── Rest ──────────────────────────────────────────────────────────────
const { id, name: n, ...profileData } = user;
// id = 1, n = 'Alice', profileData = { role: 'admin', age: 30 }
// Great for omit patterns: profileData has everything except id and name

// ── In function parameters ────────────────────────────────────────────
function greet({ name = 'World', greeting = 'Hello' } = {}) {
  return \`\${greeting}, \${name}!\`;
}
greet({ name: 'Alice' });   // "Hello, Alice!"
greet();                    // "Hello, World!" — {} default prevents error`,
    },
    {
      label: 'Array Destructuring',
      language: 'typescript',
      code: `// ── Basic ─────────────────────────────────────────────────────────────
const rgb = [255, 128, 0];
const [r, g, b] = rgb;    // r=255, g=128, b=0

// Skip elements
const [, second, , fourth = 0] = [1, 2, 3];  // second=2, fourth=0

// ── Rest ──────────────────────────────────────────────────────────────
const [head, ...tail] = [1, 2, 3, 4, 5];
// head = 1, tail = [2, 3, 4, 5]

const [first, second2, ...rest] = 'hello';
// first = 'h', second2 = 'e', rest = ['l','l','o']

// ── Swap ──────────────────────────────────────────────────────────────
let x = 1, y = 2;
[x, y] = [y, x];          // x=2, y=1 — no temp variable needed!

// ── Return multiple values ────────────────────────────────────────────
function minMax(arr) {
  return [Math.min(...arr), Math.max(...arr)];
}
const [min, max] = minMax([3, 1, 4, 1, 5, 9]);  // min=1, max=9

// ── With iterables ────────────────────────────────────────────────────
const [a2, b2, c2] = new Set([10, 20, 30]);       // a2=10, b2=20, c2=30
const [[k1, v1], [k2, v2]] = new Map([['x',1],['y',2]]);
// k1='x', v1=1, k2='y', v2=2

// ── Regex match groups ────────────────────────────────────────────────
const [, year, month, day] = '2024-03-15'.match(/(\d{4})-(\d{2})-(\d{2})/);
// year='2024', month='03', day='15'`,
    },
    {
      label: 'Spread Patterns',
      language: 'typescript',
      code: `// ── Array spread ──────────────────────────────────────────────────────
const a = [1, 2, 3];
const b = [4, 5, 6];
const combined = [...a, ...b];          // [1,2,3,4,5,6]
const withMiddle = [...a, 99, ...b];    // [1,2,3,99,4,5,6]
const copy = [...a];                    // shallow copy

// Insert/prepend without mutation
const withFirst = [0, ...a];            // [0,1,2,3]
const withLast  = [...a, 4];            // [1,2,3,4]

// ── Object spread ────────────────────────────────────────────────────
const defaults = { theme: 'light', lang: 'en', debug: false };
const override = { theme: 'dark', debug: true };
const config = { ...defaults, ...override };
// { theme:'dark', lang:'en', debug:true }

// Update nested (shallow)
const state = { user: { name: 'Alice', age: 30 }, count: 0 };
const updated = { ...state, user: { ...state.user, age: 31 }, count: state.count + 1 };

// ── Spread in function calls ──────────────────────────────────────────
const nums = [3, 1, 4, 1, 5, 9];
Math.max(...nums);    // 9
Math.min(...nums);    // 1

function sum(a, b, c) { return a + b + c; }
sum(...[1, 2, 3]);    // 6

// Spread converts any iterable to array
const fromString = [...'hello'];      // ['h','e','l','l','o']
const fromSet    = [...new Set([1,2,2,3])];  // [1,2,3]`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Nested destructure on potentially undefined intermediate',
      wrong: `const { user: { name } } = data;  // TypeError if data.user is null/undefined`,
      right: `const { user: { name } = {} } = data ?? {};  // safe with defaults
// Or use optional chaining:
const name = data?.user?.name;`,
      explanation: 'Nested destructuring throws if an intermediate is null/undefined — there\'s no implicit optional chaining. Use default values or optional chaining.',
    },
    {
      title: 'Default value in destructure activates on undefined, not null',
      wrong: `const { theme = 'light' } = { theme: null };
// theme is null, not 'light' — null doesn't trigger default`,
      right: `const { theme: rawTheme = 'light' } = { theme: null };
const theme = rawTheme ?? 'light';  // explicitly handle null`,
      explanation: 'Destructuring defaults only apply when the value is undefined. null is a valid value and won\'t be replaced. Use ?? after destructuring to handle null.',
    },
    {
      title: 'Spreading an object with functions loses this context',
      wrong: `const obj = { name: 'Alice', greet() { return this.name; } };
const copy = { ...obj };
copy.greet();  // 'Alice' — works here, but:
const { greet } = copy;
greet();  // undefined — this is lost when destructured!`,
      right: `const { greet } = copy;
greet.call(copy);          // 'Alice'
const boundGreet = greet.bind(copy);
boundGreet();              // 'Alice'`,
      explanation: 'Extracting a method via destructuring loses its this context. Bind it to the object or call it via the object. Arrow functions avoid this issue.',
    },
    {
      title: 'Destructuring in loop without let/const',
      wrong: `for ({ name, age } of users) {  // ReferenceError if name/age not declared
  console.log(name, age);
}`,
      right: `for (const { name, age } of users) {
  console.log(name, age);
}`,
      explanation: 'Always use const (or let) with destructuring in for...of. Without it you\'re assigning to undeclared variables which throws in strict mode.',
    },
    {
      title: 'Rest element not last in destructure',
      wrong: `const { ...rest, id } = obj;  // SyntaxError: rest element must be last`,
      right: `const { id, ...rest } = obj;  // rest must be last`,
      explanation: 'Rest elements must always be the last item in a destructuring pattern. This applies to both object and array destructuring.',
    },
    {
      title: 'Forgetting the = {} fallback in parameter destructuring',
      wrong: `function init({ debug = false, timeout = 3000 }) {
  /* ... */
}
init();  // TypeError: Cannot destructure property 'debug' of undefined`,
      right: `function init({ debug = false, timeout = 3000 } = {}) {
  /* ... */
}
init();   // OK — {} is used when no argument is passed`,
      explanation: 'If a caller passes no argument, destructuring undefined throws. Add = {} as a default for the whole parameter to make the function callable with no arguments.',
    },
  ];

  challenge: Challenge = {
    title: 'Destructure Nested API Response',
    language: 'typescript',
    description: 'Given the API response below, use destructuring (with defaults and renaming) to extract:\n- `userId` from `data.user.id`\n- `displayName` from `data.user.name` (default: "Anonymous")\n- `postCount` from `data.stats.posts` (default: 0)\n- `latestPost` as first element of `data.posts` array (may be empty)\n- `tags` as remaining posts\n\nWrite it as a single destructure statement, no intermediate variables.',
    hints: [
      'Nested destructuring: { user: { id: userId, name: displayName = "Anonymous" } }',
      'For posts array: { posts: [latestPost, ...tags] = [] }',
      'For stats: { stats: { posts: postCount = 0 } = {} }',
      'Combine all in one const { ... } = response statement',
    ],
    starterCode: `const response = {
  data: {
    user: { id: 42, name: 'Alice' },
    stats: { posts: 7, followers: 120 },
    posts: [
      { title: 'Hello World', date: '2024-01-01' },
      { title: 'Part 2', date: '2024-01-15' },
    ]
  }
};

// Extract all values with ONE destructure statement:
const {
  // your destructuring here
} = response.data;

console.log(userId);      // 42
console.log(displayName); // 'Alice'
console.log(postCount);   // 7
console.log(latestPost);  // { title: 'Hello World', ... }
console.log(tags);        // [{ title: 'Part 2', ... }]`,
    solution: `const {
  user: { id: userId, name: displayName = 'Anonymous' },
  stats: { posts: postCount = 0 } = {},
  posts: [latestPost, ...tags] = [],
} = response.data;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `const { a: x = 10 } = {}` produce?',
      options: ['a = 10', 'x = undefined', 'x = 10', 'a = undefined'],
      answer: 2,
      explanation: 'This renames a to x AND provides a default of 10. Since the object is empty (a is undefined), the default activates. Result: x = 10.',
    },
    {
      q: 'What does `const [head, ...tail] = [1,2,3]` produce?',
      options: [
        'head=1, tail=2',
        'head=1, tail=[2,3]',
        'head=[1], tail=[2,3]',
        'head=1, tail=3',
      ],
      answer: 1,
      explanation: 'head gets the first element (1). ...tail collects all remaining elements as a new array ([2,3]).',
    },
    {
      q: 'When does a destructuring default value activate?',
      options: [
        'When the value is falsy (0, "", null, undefined)',
        'When the value is null or undefined',
        'Only when the value is undefined',
        'When the key does not exist in the object',
      ],
      answer: 2,
      explanation: 'Destructuring defaults activate ONLY for undefined — not null, 0, false, or "". A missing key gives undefined, which triggers the default. null does not.',
    },
    {
      q: 'What does spreading arrays do: `[...a, ...b]`?',
      options: [
        'Creates an array of arrays: [[...a], [...b]]',
        'Concatenates: a\'s elements followed by b\'s elements',
        'Merges them like object spread (rightmost wins)',
        'Throws if arrays have duplicate values',
      ],
      answer: 1,
      explanation: '[...a, ...b] is equivalent to a.concat(b) — it creates a new flat array with all elements of a followed by all elements of b.',
    },
    {
      q: 'How do you swap a and b without a temp variable?',
      options: [
        'a = b; b = a',
        '[a, b] = [b, a]',
        '{ a, b } = { b: a, a: b }',
        'a ^= b; b ^= a; a ^= b',
      ],
      answer: 1,
      explanation: '[a, b] = [b, a] uses array destructuring to atomically swap the values. The right side creates a new array [b, a], which is then destructured into a and b.',
    },
    {
      q: 'Which syntax correctly renames a destructured property?',
      options: ['const { name: firstName } = user', 'const { firstName = name } = user', 'const { name as firstName } = user', 'const firstName = { name } = user'],
      answer: 0,
      explanation: 'The rename syntax is { original: alias }. So { name: firstName } reads the name property and binds it to a local variable called firstName. The alias is on the right of the colon.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between rest and spread?',
      a: 'They use the same <code>...</code> syntax but do opposite things. <strong>Rest</strong> appears in patterns (destructuring, parameter lists) and <strong collects</strong> multiple values into a single array: <code>const [h, ...t] = arr</code> or <code>function f(...args)</code>. <strong>Spread</strong> appears in expressions and <strong>expands</strong> an iterable into individual values: <code>[...arr]</code> or <code>fn(...arr)</code>.',
    },
    {
      q: 'Can I destructure a Map or Set?',
      a: 'Yes — both are iterables so array destructuring works. <code>const [first] = new Set([1,2,3])</code> gives <code>first = 1</code>. For Map: <code>const [[key, val]] = myMap</code> gets the first entry as <code>[key, val]</code>. You can also spread them: <code>[...mySet]</code>, <code>[...myMap.keys()]</code>.',
    },
    {
      q: 'How do I do a partial assignment — destructure some keys and keep the rest?',
      a: 'Use rest destructuring: <code>const { id, name, ...rest } = user</code>. The <code>rest</code> object contains all own enumerable properties not named explicitly. This is a one-liner for the "omit" pattern without modifying the original object.',
    },
    {
      q: 'Can you destructure function parameters directly?',
      a: 'Yes — destructuring in function parameters is idiomatic: <code>function draw({ color = "black", size = 10 } = {}) { ... }</code>. The default <code>= {}</code> makes the entire argument optional. This pattern is common in component props and option bags, replacing the verbose <code>const { color = "black" } = options</code> in the function body.',
    },
    {
      q: 'How do you handle missing keys when destructuring deeply nested objects?',
      a: 'Use optional chaining before destructuring for deeply nested paths: <code>const { street } = user?.address ?? {}</code>. Or chain defaults at each level: <code>const { address: { street = "" } = {} } = user</code>. Avoid deeply nested destructuring in one expression — it is error-prone. Extract intermediate values first.',
    },
    {
      q: 'What is the difference between destructuring assignment and destructuring declaration?',
      a: 'A <strong>declaration</strong> (<code>const { x } = obj</code>) creates a new binding. An <strong>assignment</strong> (<code>({ x } = obj)</code> or <code>[a, b] = arr</code>) assigns to existing variables. For object assignment you must wrap in parens (without <code>const/let/var</code>) because the parser sees <code>{</code> as a block otherwise.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Destructuring and spread make extracting and composing data concise — object destructure by name, array by position, rest collects remainders, spread expands iterables, and all support defaults and renaming.',
    mustKnow: [
      'Object destructure: { a, b } = obj; rename: { a: x }; default: { a = 0 }; rest: { a, ...r }',
      'Array destructure: [h, ...t] = arr; skip: [,, third]; swap: [a,b]=[b,a]',
      'Defaults activate on undefined only — not null',
      'Always add = {} fallback on destructured function parameters',
      'Nested destructure throws if intermediate is undefined — use defaults or optional chaining',
      'Rest must always be last in the pattern',
    ],
    interviewFocus: [
      'Rename and add defaults in one destructure: const { a: x = 10 } = {}',
      'When do defaults activate in destructuring — null vs undefined',
      'Difference between rest (...) and spread (...)',
      'Destructure nested API response with defaults for optional fields',
    ],
  };
}
