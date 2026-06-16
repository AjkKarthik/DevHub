import { Component } from '@angular/core';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ts-narrowing',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './narrowing.html',
  styleUrl: './narrowing.scss',
})
export class TsNarrowing {
  quickRef: QuickRefItem[] = [
    { name: 'typeof x === "T"',     type: 'syntax',   desc: 'Narrow primitives: string, number, boolean, bigint, symbol, undefined, function' },
    { name: 'x instanceof C',       type: 'syntax',   desc: 'Narrow class instances — checks the prototype chain at runtime' },
    { name: '"prop" in x',          type: 'syntax',   desc: 'Narrow by property presence — works on objects without a shared discriminant' },
    { name: 'x === literal',        type: 'syntax',   desc: 'Equality narrowing — narrows to the exact literal value' },
    { name: 'if (x)',               type: 'syntax',   desc: 'Truthiness narrowing — removes null/undefined/0/""/false/NaN' },
    { name: 'x is T',              type: 'syntax',   desc: 'Type predicate — user-defined narrowing function that returns boolean' },
    { name: 'asserts x is T',      type: 'syntax',   desc: 'Assertion function — throws if x is not T; narrows after call' },
    { name: 'Array.isArray(x)',     type: 'method',   desc: 'Narrows x to any[] — built-in type predicate for arrays' },
    { name: 'satisfies never',      type: 'keyword',  desc: 'Exhaustiveness check — compile error if this branch is reachable' },
    { name: 'control flow analysis', type: 'keyword', desc: 'TypeScript tracks type narrowing through if/else, switch, loops, return' },
    { name: 'type guard function',  type: 'keyword',  desc: 'A function that returns x is T — informs TypeScript about narrowing' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Control flow analysis — how TypeScript tracks types',
      points: [
        'TypeScript\'s type narrowing is powered by <em>control flow analysis</em>. The compiler tracks what types are possible at each point in the code, updating its knowledge after each conditional branch, assignment, or function call.',
        'After <code>if (typeof x === "string") { ... }</code>, TypeScript knows x is <code>string</code> inside the block and the remaining type(s) in the else branch. This happens automatically — no casts required.',
        'Control flow analysis works through: <code>if/else</code>, <code>switch</code> statements, <code>while</code>/<code>for</code> loops, ternary expressions, logical operators (<code>&amp;&amp;</code>, <code>||</code>, <code>??</code>), early <code>return</code>/<code>throw</code>, and assignments.',
        'TypeScript\'s narrowing is "widening on assignment" — after <code>x = someString</code>, x is narrowed to <code>string</code> regardless of its declared type. But if the declared type is a union, subsequent reads may be the full union again.',
      ],
    },
    {
      heading: 'Built-in narrowing operators',
      points: [
        '<code>typeof x</code>: narrows primitives. Possible return values: <code>"string"</code>, <code>"number"</code>, <code>"boolean"</code>, <code>"bigint"</code>, <code>"symbol"</code>, <code>"undefined"</code>, <code>"object"</code>, <code>"function"</code>. Critically: <code>typeof null === "object"</code> — always check null separately when narrowing objects.',
        '<code>x instanceof Constructor</code>: narrows class instances by checking the prototype chain at runtime. Works for classes and their subclasses. Does NOT work for plain interfaces (erased at runtime). For a class hierarchy <code>class B extends A</code>, <code>x instanceof B</code> is more specific than <code>x instanceof A</code>.',
        '<code>"prop" in x</code>: narrows to union members that have the named property. Useful when there is no shared literal discriminant. TypeScript narrows to the intersection of all union members that declare the named property.',
        'Equality narrowing: <code>x === "literal"</code> narrows x to that literal type. In a switch on a discriminated union, each <code>case</code> branch narrows to the matching member automatically.',
        'Truthiness: <code>if (x)</code> removes <code>null</code>, <code>undefined</code>, <code>0</code>, <code>-0</code>, <code>0n</code>, <code>""</code>, <code>false</code>, <code>NaN</code>. After the if, x is the union without those types. Be careful when 0 or "" are valid values.',
      ],
    },
    {
      heading: 'User-defined type predicates (x is T)',
      points: [
        'When built-in operators are not sufficient, you can write a <em>type guard function</em>. Its return type is <code>param is Type</code>: <code>function isString(x: unknown): x is string { return typeof x === "string"; }</code>.',
        'When such a function returns <code>true</code>, TypeScript narrows the argument to the specified type in the calling scope. When it returns <code>false</code>, the type is narrowed to what remains.',
        'TypeScript trusts type predicates completely — the implementation is NOT verified. Returning <code>true</code> on the wrong input is a silent bug that compiles and corrupts the type system. Always validate every required property.',
        'Type predicates are most useful for: validating API responses (<code>isUser(data)</code>), filtering arrays (<code>items.filter(isString)</code> gives <code>string[]</code>), and narrowing values from <code>unknown</code> catch blocks.',
      ],
    },
    {
      heading: 'Assertion functions (asserts x is T)',
      points: [
        'An assertion function is a function with return type <code>asserts x is T</code>. It never returns normally if the condition fails — it throws. After a call to an assertion function, TypeScript narrows x to T for all subsequent code in the same scope.',
        'The key difference from type predicates: assertion functions don\'t return a boolean — the caller doesn\'t decide what to do. The function either narrowed the type (returned) or threw. Useful for invariant checks in tests and initialisation code.',
        'The <code>asserts</code> keyword can also be used without <code>is T</code>: <code>function assert(condition: boolean): asserts condition</code>. After calling <code>assert(x !== null)</code>, TypeScript knows x is not null.',
        'Both type predicates and assertion functions are unsafe by design — the compiler trusts you. The alternative is to put the runtime checks inline, which can be verbose. Use type predicates and assertion functions when you want reusable validation.',
      ],
    },
    {
      heading: 'Narrowing with Array.isArray and discriminant fields',
      points: [
        '<code>Array.isArray(x)</code> is a built-in type predicate that narrows to <code>any[]</code>. Combined with element type checks, you can safely validate arrays from external sources.',
        'The most reliable narrowing pattern for discriminated unions is a <code>switch</code> on the discriminant property. Each case branch narrows to the specific union member, and the <code>default</code> branch with <code>satisfies never</code> provides the exhaustiveness guarantee.',
        'After a <code>return</code> or <code>throw</code>, TypeScript removes the returned/thrown type from what remains. This is why early-return guards work: <code>if (!user) return; user.name; // user: User, not User | null</code>.',
        'Assignment narrows too: <code>let x: string | number = "hello"; x.toUpperCase();</code> — x is inferred as <code>string</code> at the point of first use after the string assignment, not the full union.',
      ],
    },
    {
      heading: 'Narrowing in filter, reduce, and array methods',
      points: [
        '<code>Array.prototype.filter</code> does not automatically narrow the result type. <code>items.filter(x => x !== null)</code> still returns <code>(T | null)[]</code>, not <code>T[]</code>. You must provide a type predicate: <code>items.filter((x): x is T => x !== null)</code>.',
        'This is a very common pain point — many developers expect filter to narrow but it only does so when explicitly given a type predicate callback.',
        '<code>items.filter(isString)</code> where <code>isString</code> is declared as <code>(x: unknown): x is string</code> will narrow the result to <code>string[]</code>. The type predicate is detected by TypeScript in the filter callback position.',
        'For reduce, TypeScript infers the accumulator type from the initial value. If the initial value is <code>[]</code>, the accumulator is <code>never[]</code> — provide an explicit type annotation: <code>.reduce&lt;string[]&gt;((acc, ...) => ..., [])</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Control Flow Analysis',
      language: 'typescript',
      code: `type Input = string | number | boolean | null | undefined;

function process(val: Input): string {
  // typeof — narrows primitives
  if (typeof val === 'string')  return val.toUpperCase(); // val: string
  if (typeof val === 'number')  return val.toFixed(2);    // val: number
  if (typeof val === 'boolean') return val ? 'yes' : 'no';// val: boolean
  // val: null | undefined here
  return 'nothing';
}

// Early return guard — very common pattern
function getLength(s: string | null): number {
  if (s === null) return 0;  // early return removes null
  return s.length;            // s: string — null is gone
}

// Logical narrowing
function greet(name?: string) {
  const msg = name && \`Hello, \${name}!\`;  // name narrowed in &&
  return msg ?? 'Hello, stranger!';         // ?? removes null/undefined
}

// Assignment narrows
let x: string | number = "hello";
x.toUpperCase(); // ✅ x is string here (from initialiser)
x = 42;
x.toFixed();    // ✅ x is number here (from assignment)`,
    },
    {
      label: 'typeof, instanceof, in',
      language: 'typescript',
      code: `// typeof — primitive narrowing
function formatValue(val: string | number | null): string {
  if (val === null)             return 'null';
  if (typeof val === 'string')  return \`"\${val}"\`;
  return val.toFixed(2);  // val: number
}

// instanceof — class narrowing
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
  }
}
function handleError(err: HttpError | ValidationError) {
  if (err instanceof HttpError) {
    console.error(\`HTTP \${err.status}: \${err.message}\`);
  } else {
    console.error(\`Invalid field '\${err.field}': \${err.message}\`);
  }
}

// in operator — property-based narrowing
interface Circle    { radius: number }
interface Rectangle { width: number; height: number }
type Shape = Circle | Rectangle;

function area(s: Shape): number {
  if ('radius' in s) return Math.PI * s.radius ** 2; // s: Circle
  return s.width * s.height;                          // s: Rectangle
}`,
    },
    {
      label: 'Type Predicates',
      language: 'typescript',
      code: `// Basic type predicate
function isString(val: unknown): val is string {
  return typeof val === 'string';
}

// Complex predicate — validate object shape
interface User { id: number; name: string; email: string }

function isUser(val: unknown): val is User {
  return (
    typeof val === 'object' && val !== null &&
    'id'    in val && typeof (val as any).id    === 'number' &&
    'name'  in val && typeof (val as any).name  === 'string' &&
    'email' in val && typeof (val as any).email === 'string'
  );
}

// Use in catch blocks (TS 4.0+ — err is unknown)
try {
  fetchUser();
} catch (err) {
  if (err instanceof Error) console.error(err.message);
}

// Use in filter — narrows array element type
const mixed: (string | number | null)[] = ['a', 1, null, 'b', 2];
const strings: string[] = mixed.filter(
  (x): x is string => typeof x === 'string'
);
// Without the predicate: filter returns (string | number | null)[]

// Narrowing with Array.isArray
function processItems(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((x): x is string => typeof x === 'string');
}`,
    },
    {
      label: 'Assertion Functions',
      language: 'typescript',
      code: `// asserts x is T — throws if condition fails, narrows after call
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new TypeError(\`Expected string, got \${typeof val}\`);
  }
}

const raw: unknown = fetchData();
assertIsString(raw);
raw.toUpperCase(); // ✅ raw is string after the assertion

// asserts condition (without is T)
function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

const user: User | null = getUser();
assert(user !== null, 'User must be logged in');
user.name; // ✅ user: User — null removed

// Test utility pattern
function assertDefined<T>(val: T | undefined | null): asserts val is T {
  if (val === undefined || val === null) {
    throw new Error('Expected a defined value, got ' + val);
  }
}
const element = document.getElementById('app');
assertDefined(element);
element.style.display = 'none'; // ✅ element: HTMLElement`,
    },
    {
      label: 'Switch & Exhaustiveness',
      language: 'typescript',
      code: `type Shape =
  | { kind: 'circle';    radius: number   }
  | { kind: 'square';    side: number     }
  | { kind: 'triangle';  base: number; height: number };

// switch + exhaustiveness check
function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.radius ** 2;  // s: { kind: 'circle'; radius: number }
    case 'square':
      return s.side ** 2;              // s: { kind: 'square'; side: number }
    case 'triangle':
      return 0.5 * s.base * s.height; // s: { kind: 'triangle'; ... }
    default:
      s satisfies never;               // compile error if Shape gains a new member
      throw new Error('Unknown shape');
  }
}

// After early throw, type is removed
function requireUser(user: User | null): User {
  if (!user) throw new Error('Not authenticated');
  return user; // user: User — null removed by the throw
}

// Narrowing with optional chaining
interface Tree { value: string; left?: Tree; right?: Tree }
function depthFirst(node: Tree | undefined): string[] {
  if (!node) return [];
  return [
    ...depthFirst(node.left),
    node.value,
    ...depthFirst(node.right),
  ];
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'typeof null === "object" — the classic trap',
      wrong: `function processObj(val: object | null) {
  if (typeof val === 'object') {
    val.toString(); // ❌ val is still null here — null passes typeof "object"
  }
}`,
      right: `function processObj(val: object | null) {
  if (typeof val === 'object' && val !== null) {
    val.toString(); // ✅ null excluded
  }
  // or: if (val !== null) val.toString();
}`,
      explanation: 'typeof null === "object" is a JavaScript quirk from 1995. Always add && val !== null when narrowing from object using typeof.',
    },
    {
      title: 'Trusting type predicates without validating the implementation',
      wrong: `function isUser(val: unknown): val is User {
  return (val as any).name !== undefined; // only checks name — misses id, email
}
isUser({ name: 'Alice' }); // true — but missing id and email!`,
      right: `function isUser(val: unknown): val is User {
  return (
    typeof val === 'object' && val !== null &&
    typeof (val as any).id    === 'number' &&
    typeof (val as any).name  === 'string' &&
    typeof (val as any).email === 'string'
  );
}`,
      explanation: 'TypeScript trusts type predicates — a partial check silently corrupts the type system. Validate every required field in the predicate body.',
    },
    {
      title: 'filter() not narrowing without a type predicate',
      wrong: `const items: (string | null)[] = ['a', null, 'b'];
const strings = items.filter(x => x !== null);
// strings: (string | null)[] — NOT string[]!
strings[0].toUpperCase(); // ❌ TypeScript still thinks null is possible`,
      right: `const strings = items.filter((x): x is string => x !== null);
// strings: string[] ✅
strings[0].toUpperCase(); // ✅`,
      explanation: 'Array.prototype.filter does not automatically narrow the result type. Provide an inline type predicate callback to get the correctly typed array.',
    },
    {
      title: 'Using truthiness when 0 or "" are valid values',
      wrong: `function processCount(count: number | null) {
  if (count) doSomething(count); // 0 is silently skipped!
  // count === 0 is a valid count but treated as falsy
}`,
      right: `function processCount(count: number | null) {
  if (count !== null) doSomething(count); // 0 is correctly handled
}`,
      explanation: 'Truthiness narrowing excludes all falsy values: null, undefined, 0, "", false, NaN. Be explicit with !== null when 0 or "" might be valid.',
    },
    {
      title: 'instanceof on interfaces — runtime error',
      wrong: `interface Serializable { serialize(): string }
function process(val: Serializable | string) {
  if (val instanceof Serializable) { // ❌ Error: Serializable is not a value
    val.serialize();
  }
}`,
      right: `interface Serializable { serialize(): string }
function isSerializable(val: unknown): val is Serializable {
  return typeof val === 'object' && val !== null && 'serialize' in val;
}
function process(val: Serializable | string) {
  if (isSerializable(val)) val.serialize(); // ✅
}`,
      explanation: 'instanceof only works with classes — they have a runtime constructor. Interfaces are erased at compile time. Use a type predicate checking for required properties instead.',
    },
    {
      title: 'Forgetting to narrow after optional chaining',
      wrong: `interface Config { db?: { host: string; port: number } }
function getPort(cfg: Config): number {
  return cfg.db?.port; // ❌ cfg.db?.port: number | undefined — not number
}`,
      right: `function getPort(cfg: Config): number {
  if (!cfg.db) return 5432; // default
  return cfg.db.port;       // cfg.db: { host: string; port: number } — narrowed
  // OR:
  return cfg.db?.port ?? 5432; // use nullish coalescing for a default
}`,
      explanation: 'Optional chaining (?.) returns undefined when the chain is absent. You still need to handle the undefined case — either with a default via ?? or an explicit null check.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a universal value parser',
    language: 'typescript',
    description: 'Implement a parseValue() function that takes an unknown value and returns a strongly-typed ParsedValue discriminated union. Handle at least 5 types: string, number, boolean, array, and object (non-null). Use type predicates and control flow narrowing — no any casts in the return path.',
    hints: [
      'Define ParsedValue as a discriminated union: { type: "string"; value: string } | { type: "number"; value: number } | ...',
      'Use typeof and Array.isArray() for narrowing — check array BEFORE object (arrays are objects)',
      'For "object", exclude null with !== null after typeof check',
      'The "unknown" fallback case handles null, undefined, and unrecognized types',
    ],
    starterCode: `type ParsedValue =
  | { type: 'string';  value: string }
  | { type: 'number';  value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'array';   value: unknown[] }
  | { type: 'object';  value: Record<string, unknown> }
  | { type: 'unknown'; value: unknown };

// TODO: implement parseValue(raw: unknown): ParsedValue
// No "any" in the implementation

console.log(parseValue('hello'));   // { type: 'string', value: 'hello' }
console.log(parseValue(42));        // { type: 'number', value: 42 }
console.log(parseValue([1, 2, 3])); // { type: 'array', value: [1,2,3] }
console.log(parseValue(null));      // { type: 'unknown', value: null }`,
    solution: `type ParsedValue =
  | { type: 'string';  value: string }
  | { type: 'number';  value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'array';   value: unknown[] }
  | { type: 'object';  value: Record<string, unknown> }
  | { type: 'unknown'; value: unknown };

function parseValue(raw: unknown): ParsedValue {
  if (typeof raw === 'string')  return { type: 'string',  value: raw };
  if (typeof raw === 'number')  return { type: 'number',  value: raw };
  if (typeof raw === 'boolean') return { type: 'boolean', value: raw };
  if (Array.isArray(raw))       return { type: 'array',   value: raw };
  if (typeof raw === 'object' && raw !== null) {
    return { type: 'object', value: raw as Record<string, unknown> };
  }
  return { type: 'unknown', value: raw };
}

// Type-safe usage
function describe(pv: ParsedValue): string {
  switch (pv.type) {
    case 'string':  return \`String: "\${pv.value}"\`;
    case 'number':  return \`Number: \${pv.value.toFixed(2)}\`;
    case 'boolean': return \`Boolean: \${pv.value ? 'true' : 'false'}\`;
    case 'array':   return \`Array[\${pv.value.length}]\`;
    case 'object':  return \`Object{keys: \${Object.keys(pv.value).join(', ')}}\`;
    case 'unknown': return \`Unknown: \${String(pv.value)}\`;
    default: pv satisfies never; throw new Error('Unreachable');
  }
}

console.log(describe(parseValue('hello')));  // String: "hello"
console.log(describe(parseValue(42)));       // Number: 42.00
console.log(describe(parseValue([1,2,3]))); // Array[3]`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does TypeScript know about `x` inside `if (typeof x === "string") { ... }`?',
      options: [
        'x is string | undefined',
        'x is the exact string value',
        'x is narrowed to string',
        'x is any',
      ],
      answer: 2,
      explanation: 'typeof narrowing tells TypeScript that x is string inside that branch. The declared type is narrowed to the subset compatible with the check.',
    },
    {
      q: 'Why does `typeof null === "object"` cause problems when narrowing?',
      options: [
        'It is a TypeScript bug',
        'null passes the typeof "object" check but is not an object',
        'typeof null returns "null" in TypeScript',
        'TypeScript automatically excludes null from typeof "object"',
      ],
      answer: 1,
      explanation: 'typeof null === "object" is a JavaScript quirk. TypeScript follows JavaScript semantics here — you must explicitly check val !== null when narrowing objects with typeof.',
    },
    {
      q: 'What type does `items.filter(x => x !== null)` return when items is `(string | null)[]`?',
      options: ['string[]', '(string | null)[]', 'string | null', 'never[]'],
      answer: 1,
      explanation: 'filter() without a type predicate returns the same element type as the input — (string | null)[]. To get string[], you must write filter((x): x is string => x !== null).',
    },
    {
      q: 'What is the difference between a type predicate (x is T) and an assertion function (asserts x is T)?',
      options: [
        'Type predicates are safer — TypeScript validates their implementation',
        'A type predicate returns boolean; an assertion function throws on failure',
        'Assertion functions are only available in strict mode',
        'They are identical — just different syntax for the same behaviour',
      ],
      answer: 1,
      explanation: 'A type predicate returns boolean — the caller decides what to do. An assertion function throws if the condition fails and never returns normally in that case.',
    },
    {
      q: 'Can you use instanceof to narrow a TypeScript interface?',
      options: [
        'Yes — instanceof works with any TypeScript type',
        'No — interfaces are erased at runtime; instanceof needs a class',
        'Yes — if the interface has at least one method',
        'No — instanceof only works with primitive types',
      ],
      answer: 1,
      explanation: 'instanceof checks the prototype chain at runtime. Interfaces have no runtime representation — they are erased. Use type predicates with property checks to narrow to interface types.',
    },
    {
      q: 'After `if (!user) return;`, what is the type of `user` on the next line?',
      options: [
        'User | null (unchanged)',
        'null',
        'User (null/undefined removed by the early return)',
        'never',
      ],
      answer: 2,
      explanation: 'TypeScript\'s control flow analysis removes the falsy types from the union after an early return. If user was User | null, it is User after if (!user) return.',
    },
    {
      q: 'Which operator narrows based on property presence?',
      options: ['typeof', 'instanceof', 'in', 'keyof'],
      answer: 2,
      explanation: 'The in operator ("prop" in x) narrows to union members that declare the named property. It is useful when there is no shared literal discriminant.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is control flow analysis in TypeScript?',
      a: 'Control flow analysis is TypeScript\'s ability to track the possible types of a variable at each point in the code based on the control flow — if/else branches, switch cases, return/throw statements, and assignments. It automatically narrows types as you write conditions without requiring explicit casts.',
    },
    {
      q: 'When should I write a custom type guard vs using instanceof or in?',
      a: 'Use instanceof when narrowing class instances — it is the cleanest option. Use in when discriminating between object shapes without a shared literal discriminant. Write a custom type predicate when the shape is complex (multiple required properties to check), when narrowing unknown values from external sources, or when you want to reuse the check across multiple places.',
    },
    {
      q: 'Why doesn\'t filter() narrow the array element type automatically?',
      a: 'TypeScript cannot infer from a callback alone that the filter removes a specific type. The return type of filter is the same as the input element type unless you provide an explicit type predicate. Always write filter((x): x is T => condition) to get a narrowed result type.',
    },
    {
      q: 'What is the asserts keyword used for?',
      a: 'asserts is used in assertion function signatures. An assertion function with return type "asserts x is T" throws if x is not T — it never returns normally on failure. After the call, TypeScript narrows x to T for subsequent code. It is useful for invariant checks, test helpers, and initialization guards.',
    },
    {
      q: 'How does TypeScript narrow types in a switch statement?',
      a: 'In a switch on a discriminated union property, TypeScript narrows the union to the member matching each case value. In the default branch, the type is narrowed to the remaining members. If all members are handled, the type is never in the default branch — which is how the exhaustiveness check works.',
    },
    {
      q: 'Can narrowing cross function boundaries?',
      a: 'No — TypeScript does not track narrowing across regular function calls. If you narrow x to string before calling a function, TypeScript assumes the function may have mutated x. The exception is immediately-invoked functions and closures in certain patterns. This is why type predicates exist — they are an explicit way to communicate narrowing across a function boundary.',
    },
    {
      q: 'What is the difference between truthiness narrowing and !== null checks?',
      a: 'Truthiness (if (x)) removes null, undefined, 0, "", false, and NaN. !== null checks remove only null. Use !== null when 0 or "" are valid values in your domain. Use !== null && !== undefined (or ?? nullish coalescing) for the most precise null/undefined handling.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript tracks types through control flow — typeof, instanceof, in, and truthiness narrow automatically; type predicates and assertion functions extend narrowing across function boundaries.',
    mustKnow: [
      'typeof null === "object" — always add !== null when narrowing objects with typeof',
      'instanceof narrows classes; does NOT work on interfaces (no runtime representation)',
      '"prop" in x narrows to union members that declare that property',
      'filter() requires an explicit type predicate callback to narrow the result array type',
      'Type predicates (x is T) are trusted unconditionally — wrong implementations silently corrupt types',
      'Assertion functions (asserts x is T) throw on failure; narrows all code after the call',
      'After an early return/throw, TypeScript removes those types from what follows in the same scope',
    ],
    interviewFocus: [
      'What is control flow analysis and how does TypeScript track types through branches?',
      'Why does typeof null === "object" cause issues and how do you handle it?',
      'How do you write a type predicate and what are its risks?',
      'Why does Array.prototype.filter not narrow the element type without a type predicate?',
      'What is the difference between a type predicate and an assertion function?',
    ],
  };
}
