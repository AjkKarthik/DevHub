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
  selector: 'app-ts-primitive-types',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './primitive-types.html',
  styleUrl: './primitive-types.scss',
})
export class TsPrimitiveTypes {
  quickRef: QuickRefItem[] = [
    { name: 'string',    type: 'type',    desc: 'Unicode text values' },
    { name: 'number',    type: 'type',    desc: 'All numeric values (integer + float, IEEE 754 double)' },
    { name: 'boolean',   type: 'type',    desc: 'true / false' },
    { name: 'null',      type: 'type',    desc: 'Intentional absence of value (requires strictNullChecks to be useful)' },
    { name: 'undefined', type: 'type',    desc: 'Variable declared but not yet assigned' },
    { name: 'void',      type: 'type',    desc: 'Function return: "I don\'t care about this value" — callback style' },
    { name: 'never',     type: 'type',    desc: 'Bottom type — value that never occurs (throw, infinite loop, impossible intersection)' },
    { name: 'unknown',   type: 'type',    desc: 'Type-safe any — must narrow before use' },
    { name: 'any',       type: 'type',    desc: 'Escape hatch — disables type checking entirely' },
    { name: 'bigint',    type: 'type',    desc: 'Arbitrary-precision integers: 9007199254740992n (requires target ES2020+)' },
    { name: 'symbol',    type: 'type',    desc: 'Unique, immutable identifier: Symbol("id")' },
    { name: 'as const',  type: 'keyword', desc: 'Freeze object/array to readonly literal types — no runtime effect' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The TypeScript type hierarchy',
      points: [
        'TypeScript types form a two-ended hierarchy. At the top is <code>unknown</code> — every type is assignable to <code>unknown</code>. At the bottom is <code>never</code> — <code>never</code> is assignable to every type, but nothing is assignable to <code>never</code> except <code>never</code> itself.',
        'Between the poles sit the concrete primitive types: <code>string</code>, <code>number</code>, <code>boolean</code>, <code>null</code>, <code>undefined</code>, <code>bigint</code>, <code>symbol</code>, and <code>object</code>. Understanding where a type sits in this hierarchy explains why <code>unknown</code> forces narrowing and why <code>never</code> is the exhaustion signal.',
        '<code>any</code> is a special escape hatch — it opts out of the hierarchy entirely. A value of type <code>any</code> is assignable to and from every type, which is why it is dangerous.',
        'Practical rule: use <code>unknown</code> for values from external sources (JSON, fetch, catch blocks); use <code>never</code>in exhaustiveness checks; avoid <code>any</code> except as a last resort migration aid.',
      ],
    },
    {
      heading: 'Primitive types in depth',
      points: [
        '<code>string</code>: all Unicode text. Single-quoted, double-quoted, and template literals are all <code>string</code>. There is no separate <code>char</code> type.',
        '<code>number</code>: all numeric values — integers and floats — stored as IEEE 754 doubles. There is no separate <code>int</code> or <code>float</code>. Edge cases (<code>Infinity</code>, <code>-Infinity</code>, <code>NaN</code>, <code>0xFF</code>) are all <code>number</code>.',
        '<code>boolean</code>: exactly <code>true</code> or <code>false</code>. Any other value is truthy/falsy in JavaScript but not of type <code>boolean</code>.',
        '<code>null</code> and <code>undefined</code> are separate types. <code>null</code> represents intentional absence ("not found"). <code>undefined</code> means a variable was declared but not assigned. With <code>strictNullChecks</code>, neither is assignable to other types without an explicit union.',
        '<code>bigint</code>: arbitrary-precision integers written with an <code>n</code> suffix (<code>100n</code>). Cannot be mixed with <code>number</code> in arithmetic. Requires <code>target: "ES2020"</code> or higher.',
        '<code>symbol</code>: a globally unique, immutable primitive created with <code>Symbol()</code>. Each call returns a distinct value. Useful as non-colliding object keys.',
      ],
    },
    {
      heading: 'Literal types and widening',
      points: [
        'When you declare with <code>const</code>, TypeScript infers the <em>narrowest</em> (literal) type: <code>const role = "admin"</code> → type <code>"admin"</code>, not <code>string</code>. When you use <code>let</code>, TypeScript widens to the primitive base: <code>let role = "admin"</code> → type <code>string</code>.',
        'This matters because literal types are required for discriminated unions, exhaustiveness checks, and any API that compares values at the type level.',
        '<code>as const</code> on an object literal narrows all properties to their literal types and marks the entire structure as <code>Readonly</code>: <code>{ env: "production" } as const</code> gives <code>{ readonly env: "production" }</code>.',
        '<code>as const</code> on an array creates a <code>readonly</code> tuple: <code>[1, "one"] as const</code> → <code>readonly [1, "one"]</code>. This is how you derive a union from an array: <code>type Status = typeof STATUS[number]</code>.',
        'You can force a literal type on a <code>let</code> with an annotation: <code>let x: "admin" = "admin"</code>. Assigning any other value then fails to compile.',
      ],
    },
    {
      heading: 'void vs undefined vs null',
      points: [
        '<code>void</code> means "this function\'s return value should be ignored". It does NOT mean <code>undefined</code>. A callback typed <code>() => void</code> may return any value — TypeScript simply discards it.',
        '<code>undefined</code> as a return type means the function explicitly returns the value <code>undefined</code> — callers get that <code>undefined</code>.',
        '<code>null</code> is the conventional way to signal "intentional absence of an object" — think <code>User | null</code> from a database lookup. <code>undefined</code> signals "not yet set".',
        'With <code>strictNullChecks: true</code>, neither <code>null</code> nor <code>undefined</code> is assignable to <code>string</code>, <code>number</code>, etc. You must explicitly write <code>string | null</code> or <code>string | undefined</code>. This is the single most impactful flag in <code>strict</code> mode.',
      ],
    },
    {
      heading: 'never — the bottom type',
      points: [
        '<code>never</code> is the type of values that never exist. A function that always throws, or loops forever, returns <code>never</code>. A union narrowed down to nothing is <code>never</code>. An impossible intersection (<code>string &amp; number</code>) is <code>never</code>.',
        'The most practical use is an <em>exhaustiveness check</em> in a switch statement. In the <code>default:</code> branch, assign the discriminant to a variable of type <code>never</code>. If a new union member is ever added without updating the switch, that branch becomes reachable and the assignment fails to compile.',
        'The <code>satisfies never</code> idiom (TypeScript 4.9+) is cleaner: <code>x satisfies never</code> in the default branch emits a compile error the moment <code>x</code> is not <code>never</code>.',
        '<code>never</code> is assignable to every type, which is why throwing functions can appear in any position — <code>throw fail("msg")</code> satisfies any expected type.',
      ],
    },
    {
      heading: 'unknown vs any — why the difference matters',
      points: [
        '<code>any</code> disables the type system entirely. A value of type <code>any</code> can be used as anything without checking. TypeScript trusts you completely, and a mistake compiles silently, blowing up at runtime.',
        '<code>unknown</code> is the type-safe alternative. You can assign anything to <code>unknown</code>, but you cannot do anything with it until you narrow the type. This forces you to handle the uncertainty explicitly rather than assuming.',
        'Use <code>unknown</code> for: values from <code>JSON.parse()</code>, <code>fetch</code> responses, catch-block errors, and any data from an external API. Narrow with <code>typeof</code>, <code>instanceof</code>, or a custom type guard before accessing properties.',
        'Since TypeScript 4.0 with <code>useUnknownInCatchVariables: true</code> (part of <code>strict</code>), catch-clause variables are <code>unknown</code> by default, not <code>any</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Primitive Types',
      language: 'typescript',
      code: `// All TypeScript primitive types
let text:    string    = 'hello world';
let count:   number    = 42;
let flag:    boolean   = true;
let nothing: null      = null;
let missing: undefined = undefined;
let big:     bigint    = 100n;
let sym:     symbol    = Symbol('key');

// Special types
let safe:    unknown = JSON.parse('{"name":"Alice"}');
let risky:   any     = fetchUntypedData();
function crash(): never { throw new Error(); }

// number edge cases — all still type "number"
const inf  = Infinity;
const nan  = NaN;
const hex  = 0xFF;     // 255
const fp   = 1.5e-10;

// Type assertions (use sparingly — no runtime check)
const el = document.getElementById('app') as HTMLElement;`,
    },
    {
      label: 'Literal Types',
      language: 'typescript',
      code: `// const → literal type; let → widened primitive
const direction = 'north';           // type: "north"
const statusCode = 404;              // type: 404
let   message    = 'hello';          // type: string (widened)

// Literal union types
type Direction  = 'north' | 'south' | 'east' | 'west';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Binary     = 0 | 1;

function move(d: Direction) { console.log('Moving', d); }
move('north');  // ✅
move('up');     // ❌ Error: not assignable to Direction

// as const — freeze all values to literals
const ROUTES = {
  home:     '/',
  profile:  '/profile',
  settings: '/settings',
} as const;
// ROUTES.home: "/" — not string
// ROUTES is Readonly — no mutation allowed

// Derive a union type from an as const array
const STATUSES = ['pending', 'fulfilled', 'rejected'] as const;
type Status = typeof STATUSES[number]; // "pending" | "fulfilled" | "rejected"`,
    },
    {
      label: 'void / never / unknown',
      language: 'typescript',
      code: `// void — return type for "ignored" callbacks
const arr = [1, 2, 3];
arr.forEach((n) => {           // (n: number) => void
  console.log(n);              // ✅ returning nothing — fine
});
// You CAN return a value from a void callback — it's discarded
arr.forEach((n): void => n * 2); // ✅ allowed

// never — exhaustive union checking
type Status = 'pending' | 'fulfilled' | 'rejected';
function describe(s: Status): string {
  if (s === 'pending')   return 'Waiting...';
  if (s === 'fulfilled') return 'Done!';
  if (s === 'rejected')  return 'Failed!';
  s satisfies never;    // ❌ compile error if Status gains a new member
  throw new Error('Unreachable');
}

// unknown — safe handling of external data
function parseJson(raw: string): unknown {
  return JSON.parse(raw);
}
const data = parseJson('{"id": 1}');
// data.id          ❌ Error — must narrow first
if (typeof data === 'object' && data !== null && 'id' in data) {
  console.log((data as { id: unknown }).id); // ✅
}`,
    },
    {
      label: 'Type Narrowing',
      language: 'typescript',
      code: `// typeof narrowing
function double(x: string | number): string | number {
  if (typeof x === 'string') return x.repeat(2);  // x: string
  return x * 2;                                    // x: number
}

// Truthiness narrowing
function greet(name: string | null | undefined) {
  if (!name) return 'Hello, stranger!';
  return \`Hello, \${name}!\`;   // name: string here
}

// Equality narrowing (discriminated union)
type A = { kind: 'a'; value: string };
type B = { kind: 'b'; value: number };
type AB = A | B;

function process(ab: AB) {
  if (ab.kind === 'a') {
    ab.value.toUpperCase(); // ab: A
  } else {
    ab.value.toFixed(2);    // ab: B
  }
}

// in operator narrowing
interface Cat { meow(): void }
interface Dog { bark(): void }
function speak(pet: Cat | Dog) {
  if ('meow' in pet) pet.meow();  // pet: Cat
  else               pet.bark();  // pet: Dog
}`,
    },
    {
      label: 'bigint & symbol',
      language: 'typescript',
      code: `// bigint — arbitrary precision integers (target ES2020+)
const big: bigint = 9007199254740992n;  // beyond MAX_SAFE_INTEGER
const sum = big + 1n;                   // ✅
const mix = big + 1;                    // ❌ cannot mix bigint and number

// Must convert explicitly
const total = big + BigInt(1);          // ✅

function factorial(n: bigint): bigint {
  if (n <= 1n) return 1n;
  return n * factorial(n - 1n);
}
console.log(factorial(100n)); // huge number, no overflow

// symbol — unique identifiers
const KEY_A = Symbol('key');
const KEY_B = Symbol('key');
KEY_A === KEY_B;  // false — every Symbol() is unique

// Well-known symbol use
const PRIVATE = Symbol('private');
const obj = {
  [PRIVATE]: 'secret',  // not in Object.keys()
  public: 'visible',
};

// unique symbol — type-level singleton
declare const ID: unique symbol;
type HasId = { [ID]: number };`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using any instead of unknown for external data',
      wrong: `function parseConfig(raw: string): any {
  return JSON.parse(raw);
}
const cfg = parseConfig(input);
cfg.port.toFixed(); // runtime crash if port is a string`,
      right: `function parseConfig(raw: string): unknown {
  return JSON.parse(raw);
}
const cfg = parseConfig(input);
if (typeof cfg === 'object' && cfg !== null) {
  // narrow before accessing properties
}`,
      explanation: 'unknown forces you to narrow before use, catching bad assumptions at compile time rather than at runtime.',
    },
    {
      title: 'Confusing void with undefined',
      wrong: `function getLength(): void {
  return undefined; // Works but signals wrong intent
}
const len: number = getLength(); // ❌ type error`,
      right: `// void: return value is ignored by the caller (callback style)
arr.forEach((item): void => { process(item); });

// undefined: function explicitly returns nothing useful
function noop(): undefined { return undefined; }`,
      explanation: 'void signals "the caller should not use this return value". undefined means the function returns the literal value undefined.',
    },
    {
      title: 'Missing null checks without strictNullChecks',
      wrong: `// strictNullChecks: false (dangerous)
function getUser(id: number): User {
  return users.find(u => u.id === id); // could be undefined!
}
getUser(99).name; // runtime crash`,
      right: `// Always use strict: true (enables strictNullChecks)
function getUser(id: number): User | undefined {
  return users.find(u => u.id === id);
}
const user = getUser(99);
if (user) console.log(user.name); // safe`,
      explanation: 'strictNullChecks is the most impactful TypeScript flag. Without it, null and undefined are invisible to the type system and cause runtime surprises.',
    },
    {
      title: 'Using let where const narrows better',
      wrong: `let status = 'pending'; // type: string — too wide
function handle(s: typeof status) { /* s: string, not "pending" */ }`,
      right: `const status = 'pending'; // type: "pending" — literal

// Or derive a union from an array:
const STATUSES = ['pending', 'fulfilled', 'rejected'] as const;
type Status = typeof STATUSES[number];`,
      explanation: 'const infers literal types; let widens to the primitive base. Use const or as const when the value represents a specific allowed value.',
    },
    {
      title: 'Mixing bigint and number in arithmetic',
      wrong: `const big = 9007199254740993n;
const count = 5;
const total = big + count; // ❌ cannot mix bigint and number`,
      right: `const big = 9007199254740993n;
const count = 5n;              // use bigint literal
const total = big + count;     // ✅

// or explicitly convert
const total2 = big + BigInt(5); // ✅`,
      explanation: 'bigint and number are entirely separate types. All values in a bigint expression must be bigint — use the n suffix or BigInt() for conversion.',
    },
    {
      title: 'Missing exhaustiveness check in switch/if chains',
      wrong: `type Color = 'red' | 'green' | 'blue';
function hex(c: Color): string {
  if (c === 'red')   return '#ff0000';
  if (c === 'green') return '#00ff00';
  return ''; // blue silently falls through with no error
}`,
      right: `function hex(c: Color): string {
  if (c === 'red')   return '#ff0000';
  if (c === 'green') return '#00ff00';
  if (c === 'blue')  return '#0000ff';
  c satisfies never; // compile error if Color gains a new member
  throw new Error('Unreachable');
}`,
      explanation: 'Without an exhaustiveness check, TypeScript does not warn about unhandled union members. Use "satisfies never" in the default/final branch.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a type-safe event emitter',
    language: 'typescript',
    description: 'Create a typed EventEmitter class that maps event names (string literals) to their payload types. Implement on() to register a handler and emit() to trigger it. Use generics and a type map to ensure full type safety at the call site.',
    hints: [
      'Use a generic type parameter: TypedEmitter<TMap extends Record<string, unknown>>',
      'on<K extends keyof TMap & string>(event: K, handler: (payload: TMap[K]) => void)',
      'emit<K extends keyof TMap & string>(event: K, payload: TMap[K])',
      'Store handlers in a Map<string, Array<(p: unknown) => void>> internally',
    ],
    starterCode: `interface AppEvents {
  'user:login':  { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'data:loaded': { count: number };
}

class TypedEmitter<TMap extends Record<string, unknown>> {
  // TODO: implement on() and emit()
}

const emitter = new TypedEmitter<AppEvents>();
// Should be fully type-safe:
emitter.on('user:login', (payload) => {
  console.log(payload.userId); // no type assertion needed
});
emitter.emit('user:login', { userId: 'u1', timestamp: Date.now() });`,
    solution: `class TypedEmitter<TMap extends Record<string, unknown>> {
  private handlers = new Map<string, Array<(payload: unknown) => void>>();

  on<K extends keyof TMap & string>(
    event: K,
    handler: (payload: TMap[K]) => void
  ): this {
    const list = this.handlers.get(event) ?? [];
    list.push(handler as (p: unknown) => void);
    this.handlers.set(event, list);
    return this;
  }

  off<K extends keyof TMap & string>(
    event: K,
    handler: (payload: TMap[K]) => void
  ): this {
    const list = this.handlers.get(event) ?? [];
    this.handlers.set(event, list.filter(h => h !== handler));
    return this;
  }

  emit<K extends keyof TMap & string>(event: K, payload: TMap[K]): void {
    this.handlers.get(event)?.forEach(h => h(payload));
  }
}

interface AppEvents {
  'user:login':  { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'data:loaded': { count: number };
}

const emitter = new TypedEmitter<AppEvents>();
emitter.on('user:login', ({ userId, timestamp }) => {
  console.log(\`\${userId} logged in at \${timestamp}\`);
});
emitter.emit('user:login', { userId: 'u1', timestamp: Date.now() });
// emitter.emit('user:login', { wrong: true }); // ❌ compile error`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the inferred type of `const x = "hello"`?',
      options: ['string', '"hello"', 'String', 'unknown'],
      answer: 1,
      explanation: 'const declarations infer the narrowest (literal) type. x has type "hello", not string.',
    },
    {
      q: 'Which type must be narrowed before you can access its properties?',
      options: ['any', 'object', 'unknown', 'undefined'],
      answer: 2,
      explanation: 'unknown is the type-safe alternative to any. You cannot call methods or access properties on unknown without narrowing first.',
    },
    {
      q: 'What is the return type of a function that always throws an error?',
      options: ['void', 'undefined', 'null', 'never'],
      answer: 3,
      explanation: 'never is the return type for functions that never return normally — they throw, loop forever, or call process.exit().',
    },
    {
      q: 'What does `as const` do to an object literal?',
      options: [
        'Freezes the object at runtime so it cannot be mutated',
        'Makes all values readonly with narrow literal types at compile time',
        'Converts it to a class',
        'Converts all strings to enums',
      ],
      answer: 1,
      explanation: 'as const makes all property types narrow to their literal values and marks the object as Readonly. It has no runtime effect — the object is still technically mutable in JS.',
    },
    {
      q: 'What is the difference between null and undefined in TypeScript (with strictNullChecks)?',
      options: [
        'They are identical — both mean "no value"',
        'null is intentional absence; undefined means not yet assigned',
        'null is a type; undefined is a value only',
        'They are interchangeable with void',
      ],
      answer: 1,
      explanation: 'By convention: null represents intentional absence (e.g., "user not found"). undefined means a variable was declared but never assigned a value.',
    },
    {
      q: 'Which arithmetic expression causes a TypeScript compile error?',
      options: ['1n + 2n', '1 + 2', '1.5 * 2', '1n + 1'],
      answer: 3,
      explanation: 'You cannot mix bigint and number in arithmetic — 1n + 1 is a type error. Both operands must be the same numeric type.',
    },
    {
      q: 'What does `void` mean as a function return type in a callback context?',
      options: [
        'The function must explicitly return undefined',
        'The function may return any value but callers should ignore the return',
        'The function throws an error',
        'The function receives no parameters',
      ],
      answer: 1,
      explanation: 'void in a callback type means "the return value will be ignored". The function can technically return any value — TypeScript just discards it at the call site.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use unknown instead of any?',
      a: 'Use unknown whenever you receive data from an external source — JSON.parse(), fetch responses, catch blocks, or user input. unknown forces you to narrow the type before using it, catching errors at compile time. any silently disables all type checking and lets runtime errors slip through undetected.',
    },
    {
      q: 'Can I assign null to a string variable in TypeScript?',
      a: 'Not with strictNullChecks: true (which is part of strict: true). You must explicitly include null in the type: string | null. This is why enabling strict mode is the most impactful step when starting a TypeScript project — it makes null and undefined visible as distinct types.',
    },
    {
      q: 'Why does TypeScript widen my const type to the primitive?',
      a: 'TypeScript only infers literal types for const variable declarations. For let declarations it widens to the primitive because the value might be reassigned. You can force a literal type with an annotation (let x: "admin" = "admin") or use as const on object/array literals.',
    },
    {
      q: 'What is the difference between void and undefined as a return type?',
      a: 'void is for callbacks where the return value is intentionally ignored. A function typed () => void can return any value — the caller discards it. undefined means the function explicitly returns undefined. The practical difference matters for callbacks: forEach expects (item: T) => void, not () => undefined.',
    },
    {
      q: 'Where does never appear in practice?',
      a: 'Three main places: (1) functions that always throw or loop forever; (2) the narrowed type when all union members are exhausted in a switch; (3) impossible intersections like string & number. The exhaustiveness check pattern — assigning to a never variable or using "satisfies never" in the default branch — is the most useful day-to-day application.',
    },
    {
      q: 'Should I use bigint for financial calculations?',
      a: 'bigint is excellent for very large integers, but financial values usually need decimal arithmetic. For money, use a decimal library (decimal.js, big.js) or store values as integer cents (number) and convert for display. bigint also requires target: ES2020 or later in tsconfig.',
    },
    {
      q: 'Why does TypeScript infer "admin" instead of string for const?',
      a: 'TypeScript infers the narrowest type it can safely use. For const, the value cannot change, so the type is the exact literal value. For let, the value may be reassigned, so TypeScript widens to allow any value of that primitive type. This is called "literal type inference" and is fundamental to making discriminated unions work correctly.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript\'s primitive types range from unknown (top) through concrete types to never (bottom) — literal types, as const, and exhaustiveness checks are the everyday tools.',
    mustKnow: [
      'any disables type checking; unknown requires narrowing — always prefer unknown for external data',
      'const infers literal types ("admin"); let widens to the primitive (string)',
      'as const on an object literal narrows all values to literals and marks them Readonly',
      'null = intentional absence; undefined = not assigned; void = return value ignored by caller',
      'never = bottom type — functions that always throw, exhausted unions, impossible intersections',
      'bigint and number cannot be mixed in arithmetic — use the n suffix or BigInt() for conversion',
      'Use "satisfies never" in the default branch of a switch to catch missing union members at compile time',
    ],
    interviewFocus: [
      'Explain the difference between unknown and any — when would you use each?',
      'What does as const do? How does it affect the inferred type?',
      'Why is void different from undefined as a return type?',
      'What is never and how do you use it for exhaustiveness checking?',
      'How does strictNullChecks change the behavior of null and undefined?',
    ],
  };
}
