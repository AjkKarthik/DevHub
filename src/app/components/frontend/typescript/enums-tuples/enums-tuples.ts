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
  selector: 'app-ts-enums-tuples',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './enums-tuples.html',
  styleUrl: './enums-tuples.scss',
})
export class TsEnumsTuples {
  quickRef: QuickRefItem[] = [
    { name: 'enum Direction { Up, Down }', type: 'syntax',   desc: 'Numeric enum — Up = 0, Down = 1 by default; values auto-increment' },
    { name: 'enum Color { Red = "RED" }',  type: 'syntax',   desc: 'String enum — each member must have an explicit string initialiser' },
    { name: 'const enum',                  type: 'keyword',  desc: 'Erased at compile time — inlined as literals; cannot be iterated at runtime' },
    { name: 'enum[value]',                 type: 'syntax',   desc: 'Reverse mapping: numeric enums auto-generate a reverse Direction[0] = "Up"' },
    { name: 'as const',                    type: 'keyword',  desc: 'Alternative to enum — readonly literal object; works across module boundaries' },
    { name: '[string, number]',            type: 'syntax',   desc: 'Tuple type — fixed-length array with positional types; index 0 is string, 1 is number' },
    { name: '[string, ...number[]]',       type: 'syntax',   desc: 'Rest element tuple — first element is string; rest are numbers (variable length)' },
    { name: 'readonly [T, U]',             type: 'syntax',   desc: 'Readonly tuple — elements cannot be reassigned after creation' },
    { name: 'labeled tuple',               type: 'syntax',   desc: '[id: number, name: string] — named elements improve IDE tooltips' },
    { name: 'satisfies',                   type: 'keyword',  desc: 'Validate an as const object against an enum-like type without losing literal types' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Numeric enums — auto-incrementing values',
      points: [
        'A numeric enum assigns integers starting at 0 by default: <code>enum Direction { Up, Down, Left, Right }</code> gives Up=0, Down=1, Left=2, Right=3. Any member can start the counter: <code>enum Status { Active = 1, Inactive, Deleted }</code> → 1, 2, 3.',
        'TypeScript generates a bidirectional mapping object for numeric enums. <code>Direction[0]</code> returns <code>"Up"</code> (reverse mapping). This is useful for debugging but surprising if you iterate <code>Object.keys(Direction)</code> — you get both the names AND the number-string keys.',
        'Numeric enums are open by default — TypeScript allows assigning any number to a numeric enum variable, even one outside the declared values. This is a type safety hole. String enums do not have this problem.',
        'Heterogeneous enums (mixing string and numeric values) are allowed but discouraged — they combine the downsides of both.',
      ],
    },
    {
      heading: 'String enums and why they are safer',
      points: [
        'String enums require explicit string values: <code>enum Direction { Up = "UP", Down = "DOWN" }</code>. They do NOT generate a reverse mapping (the runtime object only has the name → value direction).',
        'String enums are closed: you cannot assign an arbitrary string to a string enum variable. This makes them more type-safe than numeric enums. They are also more readable in logs and network payloads because the value is human-readable.',
        'The downside: every member must have an explicit string value — there is no auto-incrementing. More verbose for large enums.',
        'For string enums, prefer values that match the member name or describe the value clearly: <code>Status.Active = "active"</code>, not <code>Status.Active = "STATUS_001"</code>.',
      ],
    },
    {
      heading: 'const enum — zero-runtime overhead',
      points: [
        '<code>const enum</code> behaves like a regular enum during type-checking but is completely erased at compile time. All usages are inlined as their literal values: <code>const enum Dir { Up = 0 }; let d = Dir.Up;</code> compiles to <code>let d = 0;</code>.',
        'Because const enums have no runtime representation, they cannot be iterated, cannot be used as object values at runtime, and cannot be imported as values from a .d.ts file (only from source .ts files). This makes them incompatible with <code>isolatedModules</code> mode (used by esbuild/Babel) unless you use <code>verbatimModuleSyntax</code>.',
        'The performance benefit is marginal in modern JS engines. The main reason to prefer const enum is semantic — marking that the enum is purely a compile-time abstraction. The incompatibility with isolatedModules is a real downside in modern toolchains.',
        'Recommendation: prefer <code>as const</code> objects over const enums for new code — they work with all toolchains, support module augmentation, and produce the same literal types.',
      ],
    },
    {
      heading: 'as const — the modern enum alternative',
      points: [
        '<code>as const</code> turns an object literal into a readonly literal type: <code>const Direction = { Up: "UP", Down: "DOWN" } as const;</code>. TypeScript infers the type as <code>{ readonly Up: "UP"; readonly Down: "DOWN" }</code>.',
        'To get a union of the values: <code>type DirectionValue = typeof Direction[keyof typeof Direction];</code> → <code>"UP" | "DOWN"</code>. This is the equivalent of a string enum value union.',
        '<code>as const</code> objects work with all TypeScript toolchains including <code>isolatedModules</code>, can be imported as values and types, can be iterated at runtime, and support tree-shaking. They are the recommended approach for new code in most Angular/React/Node projects.',
        'The tradeoff: <code>as const</code> requires slightly more boilerplate to extract the value type, and TypeScript does not enforce completeness the same way enum does for switch/case exhaustiveness.',
      ],
    },
    {
      heading: 'Tuples — fixed-length typed arrays',
      points: [
        'A tuple is an array with a fixed length where each position has its own type: <code>type Point = [number, number]</code>. TypeScript enforces both the length and the type of each element.',
        'Labeled tuples (TypeScript 4.0+) improve readability: <code>type UserRecord = [id: number, name: string, active: boolean]</code>. Labels appear in IDE hover tooltips and error messages — they are purely cosmetic at the type level.',
        'Tuples with rest elements: <code>[string, ...number[]]</code> means the first element is a string and the rest are numbers. The rest element can only appear once and must be at the start or end. Useful for variadic function arguments.',
        'Readonly tuples: <code>readonly [string, number]</code> prevents element reassignment. Return readonly tuples from functions when you do not want callers to mutate the tuple elements.',
      ],
    },
    {
      heading: 'Tuple use cases — structured return values',
      points: [
        'Tuples are ideal for functions that return multiple values of different types: <code>function useState&lt;T&gt;(init: T): [T, (v: T) =&gt; void]</code>. Callers destructure: <code>const [count, setCount] = useState(0)</code>.',
        'CSV / parsing functions often return tuples: <code>function parseCSVRow(row: string): [string, number, boolean]</code>. Positional meaning is important — label the tuple for clarity.',
        'Prefer tuples over plain arrays when position carries semantic meaning and the length is fixed. For variable-length collections of homogeneous elements, use typed arrays (<code>string[]</code>).',
        'TypeScript infers arrays as <code>number[]</code> not <code>[number, number]</code> — you must explicitly annotate a variable or return type as a tuple to get tuple checking, or use <code>as const</code> for literal inference.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Numeric & String Enums',
      language: 'typescript',
      code: `// Numeric enum — auto-increments from 0
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}
let d: Direction = Direction.Up;
console.log(d);              // 0
console.log(Direction[0]);   // "Up" — reverse mapping (numeric enums only)

// Starting from a specific value
enum HttpStatus {
  OK       = 200,
  NotFound = 404,
  Error    = 500,
}

// String enum — no reverse mapping, fully closed
enum LogLevel {
  Debug = 'DEBUG',
  Info  = 'INFO',
  Warn  = 'WARN',
  Error = 'ERROR',
}
function log(msg: string, level: LogLevel) {
  console.log(\`[\${level}] \${msg}\`);
}
log('Server started', LogLevel.Info); // [INFO] Server started
// log('oops', 'INFO'); // Error — string not assignable to LogLevel

// Numeric enum is OPEN — type safety hole
let n: Direction = 42; // TypeScript allows this (numeric enum quirk)
let s: LogLevel  = 'WARN' as LogLevel; // requires cast — string enum is safer`,
    },
    {
      label: 'const enum & as const',
      language: 'typescript',
      code: `// const enum — inlined at compile time, zero runtime overhead
const enum Key {
  Enter = 13,
  Escape = 27,
  Space = 32,
}
// Compiles to: if (event.keyCode === 13) — not if (event.keyCode === Key.Enter)
if (event.keyCode === Key.Enter) { console.log('Enter pressed'); }

// as const — the modern alternative, works everywhere
const Status = {
  Active:   'active',
  Inactive: 'inactive',
  Deleted:  'deleted',
} as const;

// Extract the value union
type StatusValue = typeof Status[keyof typeof Status];
// StatusValue = 'active' | 'inactive' | 'deleted'

function setStatus(s: StatusValue) { /* ... */ }
setStatus(Status.Active);    // OK
// setStatus('unknown');     // type error

// Object.keys works — as const has a runtime presence
Object.values(Status).forEach(v => console.log(v));

// satisfies — validate against a type without losing literal types
type StatusMap = Record<string, string>;
const AppStatus = {
  Running: 'running',
  Stopped: 'stopped',
} satisfies StatusMap;
AppStatus.Running; // still "running" not string — satisfies preserves literals`,
    },
    {
      label: 'Tuples',
      language: 'typescript',
      code: `// Basic tuple
type Point = [number, number];
const p: Point = [10, 20];
const [x, y] = p; // destructuring

// Labeled tuple (TS 4.0+) — better IDE tooltips
type UserEntry = [id: number, name: string, active: boolean];
const user: UserEntry = [1, 'Alice', true];
const [id, name, active] = user;

// Function returning a tuple (like React useState)
function useToggle(init: boolean): [boolean, () => void] {
  let state = init;
  const toggle = () => { state = !state; };
  return [state, toggle];
}
const [on, toggleOn] = useToggle(false);

// Rest element tuple
type StringThenNumbers = [string, ...number[]];
const valid: StringThenNumbers = ['label', 1, 2, 3]; // OK
// const bad: StringThenNumbers = [1, 2, 3];          // first must be string

// Readonly tuple — prevents mutation
type ImmutablePoint = readonly [number, number];
const pt: ImmutablePoint = [5, 10];
// pt[0] = 99; // Cannot assign to '0' because it is a read-only property

// TypeScript infers array, NOT tuple — must annotate
const pair = [1, 'hello'];           // type: (string | number)[]
const strictPair: [number, string] = [1, 'hello']; // type: [number, string]
const asTuple = [1, 'hello'] as const; // type: readonly [1, "hello"]`,
    },
    {
      label: 'Enums in switch',
      language: 'typescript',
      code: `const enum Shape {
  Circle   = 'CIRCLE',
  Square   = 'SQUARE',
  Triangle = 'TRIANGLE',
}

interface Circle   { kind: Shape.Circle;   radius: number }
interface Square   { kind: Shape.Square;   side: number }
interface Triangle { kind: Shape.Triangle; base: number; height: number }
type ShapeUnion = Circle | Square | Triangle;

function area(s: ShapeUnion): number {
  switch (s.kind) {
    case Shape.Circle:   return Math.PI * s.radius ** 2;
    case Shape.Square:   return s.side ** 2;
    case Shape.Triangle: return 0.5 * s.base * s.height;
    default:
      s satisfies never; // compile error if Shape gains a new member
      throw new Error('Unknown shape');
  }
}

// Enum-based flags with bitwise OR (numeric enums)
enum Permission {
  None  = 0,
  Read  = 1 << 0,  // 1
  Write = 1 << 1,  // 2
  Admin = 1 << 2,  // 4
}
const userPerm = Permission.Read | Permission.Write; // 3
const canRead  = (userPerm & Permission.Read)  !== 0; // true
const canAdmin = (userPerm & Permission.Admin) !== 0; // false`,
    },
    {
      label: 'Tuple patterns',
      language: 'typescript',
      code: `// Result tuple — alternative to throwing
type Result<T, E = string> = [true, T] | [false, E];

function parseJSON(raw: string): Result<unknown> {
  try {
    return [true, JSON.parse(raw)];
  } catch (e) {
    return [false, (e as Error).message];
  }
}
const [ok, value] = parseJSON('{"x":1}');
if (ok) {
  console.log(value); // value: unknown — safe
} else {
  console.error(value); // value: string — the error message
}

// Tuple from function inference — use as const or explicit return type
function minMax(nums: number[]): [number, number] {
  return [Math.min(...nums), Math.max(...nums)];
}
const [min, max] = minMax([3, 1, 4, 1, 5]);

// Variadic tuple types (TS 4.0+) — spread tuples
type Pair<A, B>      = [A, B];
type Triple<A, B, C> = [...Pair<A, B>, C];
type NamedTriple = Triple<number, string, boolean>; // [number, string, boolean]

// Tuple mapped type — transform each element
type Nullable<T extends unknown[]> = { [K in keyof T]: T[K] | null };
type NullablePair = Nullable<[number, string]>; // [number | null, string | null]`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Numeric enum type-safety hole — any number is assignable',
      wrong: `enum Status { Active = 1, Inactive = 2 }
let s: Status = 999; // No error! Numeric enums accept any number`,
      right: `// Use string enum — fully closed, only declared values allowed
enum Status { Active = 'active', Inactive = 'inactive' }
// OR use as const for the same effect
const Status = { Active: 'active', Inactive: 'inactive' } as const;
type StatusValue = typeof Status[keyof typeof Status];`,
      explanation: 'Numeric enums accept any number, not just declared values. This is a known type-safety gap in TypeScript. String enums and as const objects are both closed — only declared values are assignable.',
    },
    {
      title: 'Iterating a numeric enum — you get both names and number keys',
      wrong: `enum Dir { Up, Down, Left, Right }
Object.keys(Dir).forEach(k => console.log(k));
// Prints: "0", "1", "2", "3", "Up", "Down", "Left", "Right"
// The number keys come from the reverse mapping — unexpected!`,
      right: `// String enum — no reverse mapping
enum Dir { Up = 'UP', Down = 'DOWN', Left = 'LEFT', Right = 'RIGHT' }
Object.keys(Dir); // ["Up", "Down", "Left", "Right"] — clean

// OR as const — explicit values, iterable, no surprises
const Dir = { Up: 'UP', Down: 'DOWN', Left: 'LEFT', Right: 'RIGHT' } as const;
Object.values(Dir); // ['UP', 'DOWN', 'LEFT', 'RIGHT']`,
      explanation: 'Numeric enums generate a reverse mapping (Direction[0] = "Up"), which pollutes Object.keys() with both numeric string keys and name strings. String enums and as const objects do not have this issue.',
    },
    {
      title: 'const enum with isolatedModules — runtime error',
      wrong: `// lib.ts
export const enum Color { Red = 'red', Blue = 'blue' }

// app.ts (built with esbuild/vite — isolatedModules: true)
import { Color } from './lib';
console.log(Color.Red); // Runtime error — Color is not defined`,
      right: `// Option 1: regular enum (has runtime object)
export enum Color { Red = 'red', Blue = 'blue' }

// Option 2: as const (works everywhere)
export const Color = { Red: 'red', Blue: 'blue' } as const;
export type Color = typeof Color[keyof typeof Color];`,
      explanation: 'const enum is inlined at the usage site — the file exporting it works fine. But the importing file, when processed by isolatedModules-based tools (esbuild, Babel, Vite), cannot see the const enum values. Use regular enums or as const instead.',
    },
    {
      title: 'Expecting TypeScript to infer tuples — it infers arrays',
      wrong: `function getCoords() {
  return [10, 20]; // inferred as number[], NOT [number, number]
}
const coords = getCoords();
coords[2]; // TypeScript allows this — it is number[], not length-2`,
      right: `function getCoords(): [number, number] {
  return [10, 20]; // explicit return type enforces tuple
}
// OR
function getCoords() {
  return [10, 20] as const; // readonly [10, 20] — even more specific
}`,
      explanation: 'TypeScript infers array literals as T[] by default, not as tuples. Annotate the return type explicitly or use as const when you need a tuple type enforced.',
    },
    {
      title: 'Using enum members as keys without computed property syntax',
      wrong: `enum Role { Admin = 'admin', User = 'user' }
const labels: Record<Role, string> = {
  admin: 'Administrator', // Error — string "admin" is not Role
  user:  'Regular User',
};`,
      right: `enum Role { Admin = 'admin', User = 'user' }
const labels: Record<Role, string> = {
  [Role.Admin]: 'Administrator', // computed property key
  [Role.User]:  'Regular User',
};`,
      explanation: 'String enum values are not automatically string literal types in object literal keys. Use computed property syntax [Role.Admin] to use enum members as object keys.',
    },
    {
      title: 'const on variable does not make tuple elements readonly',
      wrong: `const pair: [number, number] = [1, 2];
pair[0] = 99; // TypeScript allows — [number, number] is mutable!
// const on the variable only prevents reassigning pair itself`,
      right: `const pair: readonly [number, number] = [1, 2];
// pair[0] = 99; // Cannot assign to '0' — correctly blocked
// OR
const pair = [1, 2] as const; // readonly [1, 2]`,
      explanation: 'const (the variable keyword) makes the binding immutable — you cannot reassign pair. But the tuple elements are still mutable unless the type is readonly [number, number] or you use as const.',
    },
  ];

  challenge: Challenge = {
    title: 'Type-safe event system with string enum keys',
    language: 'typescript',
    description: 'Build a typed EventBus<TEvents> where TEvents is a Record<string, unknown[]>. Use a string enum for event names. The emit() method should accept the event name as an enum value and strongly-typed args. The on() method should infer the callback parameter types from the enum key. No any in the public API.',
    hints: [
      'Use a string enum for EventName — string enum works with Record keys directly',
      'TEvents maps EventName to a tuple of argument types: { [EventName.UserLogin]: [string, Date] }',
      'on<K extends keyof TEvents>(name: K, cb: (...args: TEvents[K]) => void) — spread the tuple as rest args',
      'emit<K extends keyof TEvents>(name: K, ...args: TEvents[K]) — use the tuple as a rest type',
    ],
    starterCode: `enum EventName {
  UserLogin  = 'user:login',
  UserLogout = 'user:logout',
  PageView   = 'page:view',
}

type AppEvents = {
  [EventName.UserLogin]:  [userId: string, at: Date];
  [EventName.UserLogout]: [userId: string];
  [EventName.PageView]:   [path: string, referrer: string | null];
};

// TODO: implement EventBus<TEvents> class
// on<K extends keyof TEvents>(name: K, cb: (...args: TEvents[K]) => void): void
// emit<K extends keyof TEvents>(name: K, ...args: TEvents[K]): void

const bus = new EventBus<AppEvents>();
bus.on(EventName.UserLogin, (userId, at) => {
  // userId: string, at: Date — inferred!
});
bus.emit(EventName.UserLogin, 'u1', new Date()); // OK
// bus.emit(EventName.UserLogin, 42); // should error`,
    solution: `enum EventName {
  UserLogin  = 'user:login',
  UserLogout = 'user:logout',
  PageView   = 'page:view',
}

type AppEvents = {
  [EventName.UserLogin]:  [userId: string, at: Date];
  [EventName.UserLogout]: [userId: string];
  [EventName.PageView]:   [path: string, referrer: string | null];
};

class EventBus<TEvents extends Record<string, unknown[]>> {
  private handlers = new Map<keyof TEvents, Array<(...args: unknown[]) => void>>();

  on<K extends keyof TEvents>(name: K, cb: (...args: TEvents[K]) => void): void {
    const list = this.handlers.get(name) ?? [];
    list.push(cb as (...args: unknown[]) => void);
    this.handlers.set(name, list);
  }

  emit<K extends keyof TEvents>(name: K, ...args: TEvents[K]): void {
    const list = this.handlers.get(name) ?? [];
    for (const cb of list) cb(...(args as unknown[]));
  }

  off<K extends keyof TEvents>(name: K, cb: (...args: TEvents[K]) => void): void {
    const list = this.handlers.get(name) ?? [];
    this.handlers.set(name, list.filter(h => h !== cb));
  }
}

const bus = new EventBus<AppEvents>();
bus.on(EventName.UserLogin, (userId, at) => {
  console.log(\`\${userId} logged in at \${at.toISOString()}\`);
});
bus.emit(EventName.UserLogin, 'u1', new Date()); // OK — correct types
// bus.emit(EventName.UserLogin, 42);             // Argument of type 'number' is not assignable`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does TypeScript add to numeric enums that string enums do NOT have?',
      options: [
        'Exhaustiveness checking',
        'A reverse mapping (Enum[value] = "MemberName")',
        'Closed type checking',
        'const inlining support',
      ],
      answer: 1,
      explanation: 'Numeric enums generate a bidirectional object: Direction[0] = "Up" and Direction.Up = 0. String enums only have name → value. This reverse mapping is what pollutes Object.keys() with number strings.',
    },
    {
      q: 'Why is a string enum safer than a numeric enum?',
      options: [
        'String enums support reverse mapping; numeric enums do not',
        'String enums are closed — only declared values are assignable; numeric enums accept any number',
        'String enums have better tree-shaking support',
        'String enums are automatically const-erased at compile time',
      ],
      answer: 1,
      explanation: 'Numeric enums are open — you can assign any number to a numeric enum variable without a type error. String enums are closed — only the explicitly declared string values are assignable.',
    },
    {
      q: 'What is the main reason to avoid const enum in a modern Angular/Vite project?',
      options: [
        'const enum values are slower at runtime',
        'const enum cannot be used with switch statements',
        'const enum is incompatible with isolatedModules (used by esbuild/Vite) when imported from another file',
        'const enum requires the strictEnums tsconfig flag',
      ],
      answer: 2,
      explanation: 'const enum is inlined at compile time. Tools using isolatedModules (esbuild, Vite, Babel) process files independently — they cannot see the const enum declaration from another file and emit a runtime error. Use regular enums or as const instead.',
    },
    {
      q: 'What type does TypeScript infer for `const pair = [1, "hello"]`?',
      options: [
        '[number, string]',
        'readonly [1, "hello"]',
        '(number | string)[]',
        '[1, "hello"]',
      ],
      answer: 2,
      explanation: 'TypeScript infers array literals as T[] unions, not tuples. You must explicitly annotate the type as [number, string] or use as const to get literal/tuple inference.',
    },
    {
      q: 'What is the advantage of labeled tuples like `[id: number, name: string]`?',
      options: [
        'They enforce that callers use named arguments',
        'They improve IDE tooltips and error messages — purely cosmetic at the type level',
        'They prevent tuple elements from being accessed by index',
        'They auto-generate corresponding interface properties',
      ],
      answer: 1,
      explanation: 'Labels in tuples are cosmetic — they appear in IDE hover tooltips and error messages but do not affect the type structure. [id: number, name: string] and [number, string] are structurally identical.',
    },
    {
      q: 'How do you extract a union of all values from an `as const` object?',
      options: [
        'keyof typeof Direction',
        'typeof Direction[keyof typeof Direction]',
        'valueof typeof Direction',
        'Object.values(Direction)',
      ],
      answer: 1,
      explanation: '`typeof Direction[keyof typeof Direction]` is the TypeScript pattern to extract the value union from an as const object. keyof typeof Direction gives the key union; indexing with that key union gives the value union.',
    },
    {
      q: 'What is a rest element tuple `[string, ...number[]]`?',
      options: [
        'A tuple where all elements are string or number',
        'A tuple where the first element is string and the remaining elements are numbers',
        'A tuple that can hold any number of mixed string and number elements',
        'A tuple with exactly two elements: string and number[]',
      ],
      answer: 1,
      explanation: 'A rest element tuple `[string, ...number[]]` means: the first element is string, and all subsequent elements are number. The rest element provides variable-length tail type safety.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a const enum vs a regular enum vs as const?',
      a: 'Use as const for most new code — it is toolchain-agnostic, works with isolatedModules, and supports Object.keys()/values() at runtime. Use regular string enums when you want the benefits of a closed type and a runtime object (switch exhaustiveness, iteration, instanceof-like pattern). Avoid const enum unless you are in a tsc-only project (no esbuild/Babel) and specifically need zero-runtime-overhead.',
    },
    {
      q: 'Why does iterating a numeric enum give me unexpected keys?',
      a: 'Numeric enums generate a reverse mapping — Direction[0] = "Up". This means the runtime object has both { Up: 0, Down: 1, ... } AND { "0": "Up", "1": "Down", ... }. Object.keys() returns both sets of keys. String enums and as const objects do not have this problem.',
    },
    {
      q: 'Can I use enum values as object literal keys?',
      a: 'Yes, but you must use computed property syntax: { [Role.Admin]: "Administrator" }. You cannot use the string value directly as a key (like { admin: "Administrator" }) and have TypeScript know it satisfies Record<Role, string> — the string "admin" is not the same as Role.Admin in TypeScript\'s type system.',
    },
    {
      q: 'What is the difference between a tuple and an array in TypeScript?',
      a: 'An array (string[]) has a variable length and homogeneous element types. A tuple ([string, number]) has a fixed length (or variable with a rest element) and heterogeneous positional types — each index has its own type. Tuples are ideal for multi-value returns (like React\'s useState) and CSV/positional data.',
    },
    {
      q: 'How do I make a tuple immutable?',
      a: 'Two ways: annotate the type as readonly [string, number] to prevent element reassignment; or use as const on the value to get a readonly literal tuple like readonly [1, "hello"]. Note that const on the variable binding only prevents reassigning the variable — it does NOT make the tuple elements readonly.',
    },
    {
      q: 'Are TypeScript enums tree-shaken by bundlers?',
      a: 'Regular enums are NOT tree-shaken because they compile to an IIFE that initializes an object — bundlers cannot statically analyze whether the enum is used. const enum is inlined (zero runtime), so there is nothing to tree-shake. as const objects are tree-shakeable because they are plain object literals and bundlers can eliminate unused properties.',
    },
    {
      q: 'What are variadic tuple types and when are they useful?',
      a: 'Variadic tuple types (TypeScript 4.0+) let you spread one tuple type into another: type Triple<A, B, C> = [...Pair<A, B>, C]. They are useful for composing types from smaller building blocks, typing variadic functions that accept multiple argument lists, and building mapped tuple transformations like Nullable<T extends unknown[]>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Numeric enums are open and generate reverse mappings; string enums and as const objects are the safer modern alternatives. Tuples give fixed-length positional typing — annotate return types explicitly or use as const to avoid array inference.',
    mustKnow: [
      'Numeric enums accept any number (open type); string enums are closed — only declared values assignable',
      'Numeric enums generate a reverse mapping — Object.keys() returns both names and number strings',
      'const enum is inlined at compile time; incompatible with isolatedModules (esbuild/Vite)',
      'as const + typeof Obj[keyof typeof Obj] is the modern enum-alternative pattern',
      'TypeScript infers array literals as T[], not tuples — annotate the return type explicitly',
      'readonly [T, U] prevents element mutation; const on the variable does not',
      'Labeled tuples [id: number, name: string] are cosmetic — same structure as [number, string]',
    ],
    interviewFocus: [
      'What is the difference between const enum, regular enum, and as const?',
      'Why are numeric enums less type-safe than string enums?',
      'Why does TypeScript infer (string | number)[] instead of [string, number] for array literals?',
      'What is a rest element tuple and when would you use it?',
      'How do you extract a value union type from an as const object?',
    ],
  };
}
