import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-ts-basics',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './basics.html',
  styleUrl: './basics.scss',
})
export class TsBasics {

  quickRef: QuickRefItem[] = [
    { name: 'tsc --noEmit',           type: 'keyword', desc: 'Type-check without writing output files — ideal for CI.' },
    { name: 'tsc --watch',            type: 'keyword', desc: 'Incremental type-check on every save.' },
    { name: 'strict: true',           type: 'keyword', desc: 'Enables noImplicitAny, strictNullChecks, strictFunctionTypes, and more.' },
    { name: 'noImplicitAny',          type: 'keyword', desc: 'Error on expressions where TS infers `any` — catches missing type annotations.' },
    { name: 'strictNullChecks',       type: 'keyword', desc: 'null and undefined are NOT assignable to other types — explicit narrowing required.' },
    { name: 'type annotation',        type: 'syntax',  desc: 'const x: string = "hello" — add after the variable name with a colon.' },
    { name: 'type inference',         type: 'keyword', desc: 'TS infers the type from the initialiser — explicit annotation often not needed.' },
    { name: 'structural typing',      type: 'keyword', desc: 'Two types are compatible if their shapes match — name/class does not matter.' },
    { name: ': unknown',              type: 'type',    desc: 'Type-safe `any` — must narrow (typeof, instanceof) before use.' },
    { name: ': never',                type: 'type',    desc: 'A type with no values — used for exhaustive checks and unreachable code.' },
    { name: 'as const',               type: 'keyword', desc: 'Widens tuple/object to readonly literal types — e.g. ["a","b"] becomes readonly ["a","b"].' },
    { name: 'satisfies',              type: 'keyword', desc: 'Validates an expression against a type without widening — TS 4.9+.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why TypeScript? — Type safety and developer ergonomics',
      points: [
        'TypeScript is JavaScript with a static type system. It compiles to plain JavaScript — every browser or Node.js runtime that runs JS can run TypeScript output. There is no TypeScript runtime, only a TypeScript compiler.',
        'The compiler catches entire classes of bugs at build time instead of at runtime: typos on property names, passing the wrong argument type, calling a method that may not exist, returning the wrong shape from a function. These are some of the most common JavaScript production bugs.',
        'Modern editors (VS Code, WebStorm) use the TypeScript Language Server to provide autocompletion, inline documentation, and rename-refactoring that works across files — powered entirely by type information. TypeScript makes large codebases navigable by machines.',
        'TypeScript adoption is now near-universal in frontend (Angular requires it, React projects default to it), and extremely common in Node.js backends (NestJS, Fastify, tRPC). Most 2024–2025 job listings for JavaScript roles expect TypeScript fluency.',
        'TypeScript is a superset of JavaScript — every valid JS file is already valid TS (with `allowJs: true`). You can adopt it incrementally, file by file, without rewriting anything.',
      ],
    },
    {
      heading: 'The TypeScript compiler — tsc, transpilation, and type checking',
      points: [
        'The TypeScript compiler (`tsc`) does two distinct jobs: (1) <strong>type checking</strong> — verifying that all types are consistent and reporting errors; (2) <strong>transpilation</strong> — stripping type annotations and emitting plain JavaScript. These can be separated.',
        'In most production setups, a bundler (Vite, esbuild, Webpack with `ts-loader`) does the transpilation for speed, while `tsc --noEmit` runs separately in CI to type-check. This split avoids waiting for full type-checking during hot-module reloads.',
        '<code>tsc --noEmit</code>: type-checks the whole project and reports errors without writing any output files. This is the canonical CI command. Use it in your lint/test pipeline.',
        '<code>tsc --watch</code> (or `--incremental`): re-type-checks changed files on every save, maintaining a build cache (`.tsbuildinfo`). Incremental mode can be 10× faster on large projects than a cold full check.',
        'Type checking is <em>optional</em> — you can `ts-node --transpile-only` or use `isolatedModules: true` with esbuild to strip types without any checking. This is useful for bootstrapping, but you must run `tsc --noEmit` in CI to catch errors.',
      ],
    },
    {
      heading: 'Structural typing — shape over identity',
      points: [
        'TypeScript uses <strong>structural typing</strong> (also called "duck typing at the type level"). A type is compatible with another if it has all the required properties — the class or interface name does not matter. This is different from C# and Java, which use nominal typing (two classes with the same shape but different names are NOT compatible).',
        'Example: <code>interface Point { x: number; y: number }</code> — any object with x and y of type number satisfies this interface, regardless of how it was declared. This makes TypeScript extremely flexible for working with existing JavaScript libraries.',
        'Excess property checking is the one exception: when assigning an object literal directly (not through a variable), TypeScript flags extra properties as errors to catch typos. <code>const p: Point = { x: 1, y: 2, z: 3 }</code> → error; but <code>const obj = { x:1, y:2, z:3 }; const p: Point = obj;</code> → no error (widening via intermediate variable).',
        'Structural typing means you can pass a class instance anywhere an interface is expected, as long as the instance has the required shape. This is idiomatic in TypeScript — you rarely need to write <code>implements</code> unless you want an explicit compile-time guarantee.',
        'Function types are also structurally compared. A function with fewer parameters is assignable to a type with more — this is why <code>[1,2,3].forEach(x => x)</code> works even though `forEach` calls the callback with three arguments: the callback type is structurally compatible even when you ignore extra parameters.',
      ],
    },
    {
      heading: 'Type annotations and type inference — when to write types explicitly',
      points: [
        'TypeScript infers types from initialisers: <code>const x = 42</code> gives x the type `42` (literal type), not `number`. <code>let x = 42</code> gives `number` (widened, because let can be reassigned). You almost never need to annotate variables that have an obvious initialiser.',
        'Annotate function parameters and return types explicitly — inference does not help there, and explicit return types catch accidental `undefined` returns. <code>function add(a: number, b: number): number { return a + b; }</code>',
        'Annotate when the inferred type is too wide or too narrow for your use case. <code>const status = "active"</code> infers type `"active"` — useful. <code>const config = {}</code> infers <code>{}</code> — useless. Write <code>const config: Config = {}</code> to enforce the shape.',
        '<code>as const</code> freezes an object or array at its literal types and makes everything readonly: <code>const DIRS = ["north","south","east","west"] as const</code> gives type <code>readonly ["north","south","east","west"]</code>, which is narrower and more precise than <code>string[]</code>.',
        'The <code>satisfies</code> operator (TS 4.9+) validates an expression against a type WITHOUT widening it: <code>const palette = { red: [255,0,0], green: "#00ff00" } satisfies Record&lt;string, string | number[]&gt;</code> — TS validates the shape but <code>palette.red</code> retains type <code>number[]</code>, not <code>string | number[]</code>. This is more precise than a type annotation.',
      ],
    },
    {
      heading: 'strict mode and the most important compiler options',
      points: [
        '<code>strict: true</code> is a shorthand that enables a group of strictness flags: <code>noImplicitAny</code>, <code>strictNullChecks</code>, <code>strictFunctionTypes</code>, <code>strictBindCallApply</code>, <code>strictPropertyInitialization</code>, <code>noImplicitThis</code>, and <code>useUnknownInCatchVariables</code>. Always start new projects with <code>strict: true</code>.',
        '<code>strictNullChecks</code> is the single most impactful option. Without it, <code>null</code> and <code>undefined</code> are assignable to every type — which mirrors JS behaviour but defeats most of the safety TypeScript provides. With it, you must explicitly handle null/undefined with narrowing or the non-null assertion operator (<code>!</code>).',
        '<code>noImplicitAny</code>: TypeScript errors on any expression where it would infer the type `any` because no annotation was given and none can be inferred. This forces you to annotate function parameters, which is where most type errors originate.',
        '<code>target</code> sets the JS version to emit (e.g. `"ES2022"` for modern Node.js, `"ES5"` for old browsers). <code>lib</code> sets what DOM/ES APIs TypeScript knows about (e.g. `["ES2022", "DOM"]`). Set `target` to the oldest runtime you support; set `lib` to include all APIs you use.',
        '<code>moduleResolution: "bundler"</code> (TS 5.0+) is the correct setting for projects using Vite, esbuild, or Webpack — it matches how bundlers resolve modules. For Node.js projects without a bundler, use `"node16"` or `"nodenext"`.',
      ],
    },
    {
      heading: 'any, unknown, never — the escape hatches and the impossible type',
      points: [
        '<code>any</code> is a complete escape hatch — a value of type `any` can be used in any context without a type error, and TypeScript stops checking it entirely. <code>any</code> is contagious: once a value is `any`, operations on it also produce `any`. Avoid it except at system boundaries (third-party JSON, untyped APIs).',
        '<code>unknown</code> is the type-safe alternative to `any`. An unknown value can hold any value, but you CANNOT use it without first narrowing its type with `typeof`, `instanceof`, or a type predicate. This forces you to handle the "what if this is the wrong type" case before using the value.',
        'When you receive a value from `JSON.parse()`, `fetch().then(r => r.json())`, or `catch (e)` blocks, the type is `unknown` (with `useUnknownInCatchVariables: true`). You should narrow it before use: `if (typeof e === "object" && e !== null && "message" in e) { ... }`.',
        '<code>never</code> represents a type with NO possible values — the type of a function that always throws, the type of an infinite loop, and the type that results from an impossible intersection (`string & number = never`). It is used for exhaustiveness checking: after narrowing a union to all its members, the remaining type should be `never` — if it is not, you missed a case.',
        'Exhaustiveness pattern: <code>function assertNever(x: never): never { throw new Error("Unreachable: " + x); }</code> — place this in the `default` case of a switch on a discriminated union. If a new union member is added but the switch is not updated, TypeScript reports an error at the `assertNever(x)` call.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Type annotations & inference',
      language: 'typescript',
      code: `// ── Primitive type annotations ──────────────────────────────────────────────
let name: string = "Alice";         // explicit annotation (redundant here)
const age = 30;                     // inferred: number
const greeting = \`Hello \${name}\`;  // inferred: string

// ── Function annotations — ALWAYS annotate params and return type ────────────
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function (same rule)
const multiply = (a: number, b: number): number => a * b;

// ── Inference avoids verbose annotations ─────────────────────────────────────
const point = { x: 10, y: 20 };    // inferred: { x: number; y: number }
const nums = [1, 2, 3];            // inferred: number[]
const pair = [1, "two"] as const;  // inferred: readonly [1, "two"]  (tuple via as const)

// ── as const — literal types and readonly ────────────────────────────────────
const DIRECTIONS = ["north", "south", "east", "west"] as const;
type Direction = (typeof DIRECTIONS)[number];   // "north" | "south" | "east" | "west"

const CONFIG = { host: "localhost", port: 3000 } as const;
// CONFIG.host: "localhost" (not string) — exact literal type

// ── satisfies — validate shape without widening ───────────────────────────────
type Palette = Record<string, string | number[]>;
const palette = {
  red:   [255, 0, 0],
  green: "#00ff00",
} satisfies Palette;
// palette.red is number[] (not string | number[]) — kept narrow by satisfies
const r = palette.red.map(v => v * 2);   // OK — TS knows it's number[]`,
    },
    {
      label: 'Structural typing in practice',
      language: 'typescript',
      code: `// ── Structural typing — shape over name ─────────────────────────────────────
interface Point { x: number; y: number }

class Vector {
  constructor(public x: number, public y: number) {}
  magnitude() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
}

function distanceFromOrigin(p: Point): number {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}

const v = new Vector(3, 4);
console.log(distanceFromOrigin(v));   // 5 — Vector satisfies Point structurally
// No 'implements Point' needed — the shape is enough

// ── Excess property checking (only on direct object literals) ────────────────
const p1: Point = { x: 1, y: 2 };           // OK
// const p2: Point = { x: 1, y: 2, z: 3 };  // ERROR — excess property 'z'
const raw = { x: 1, y: 2, z: 3 };
const p3: Point = raw;                        // OK — no excess check on variable

// ── Structural compatibility between function types ───────────────────────────
type Callback = (event: MouseEvent) => void;
const handler: Callback = (e) => console.log(e.clientX);

// Functions with fewer params are compatible — mirroring JS callback conventions
type SimpleCallback = () => void;
const simple: SimpleCallback = () => console.log("clicked");
// forEach callback example:
[1, 2, 3].forEach((x) => x);   // valid — ignores second and third args

// ── Interface vs class nominal mismatch in other languages (not TS) ───────────
interface Serialisable { toJSON(): string }
class User {
  constructor(public name: string) {}
  toJSON() { return JSON.stringify({ name: this.name }); }
}
class Product {
  constructor(public sku: string) {}
  toJSON() { return JSON.stringify({ sku: this.sku }); }
}
function save(s: Serialisable) { return s.toJSON(); }
save(new User("Alice"));    // OK — User satisfies Serialisable
save(new Product("BOOT"));  // OK — Product satisfies Serialisable`,
    },
    {
      label: 'strict mode options',
      language: 'typescript',
      code: `// ── Demonstrating the effect of strictNullChecks ─────────────────────────────
// Without strictNullChecks (legacy — avoid):
// let name: string = null;   // allowed — dangerous

// With strictNullChecks (always use):
let name: string | null = null;   // explicit null union required

function getUser(id: number): string | null {
  return id > 0 ? "Alice" : null;
}
const user = getUser(1);
// user.toUpperCase();          // ERROR — user might be null
if (user !== null) {
  console.log(user.toUpperCase()); // OK — narrowed to string
}
// Or: use optional chaining
console.log(user?.toUpperCase());  // string | undefined

// ── noImplicitAny — force explicit types on params ────────────────────────────
// Without noImplicitAny:
// function process(data) {}    // 'data' implicitly has type 'any'

// With noImplicitAny:
function process(data: unknown) {  // must be explicit
  if (typeof data === "string") console.log(data.toUpperCase());
}

// ── useUnknownInCatchVariables (TS 4.0+, default in strict) ──────────────────
async function fetchData(url: string) {
  try {
    const res = await fetch(url);
    return await res.json() as unknown;
  } catch (e) {
    // e is 'unknown' with useUnknownInCatchVariables — not 'any'
    if (e instanceof Error) {
      console.error(e.message);   // OK — narrowed to Error
    } else {
      console.error("Unknown error", e);
    }
  }
}

// ── tsconfig.json — recommended base ─────────────────────────────────────────
// {
//   "compilerOptions": {
//     "target": "ES2022",
//     "lib": ["ES2022", "DOM"],
//     "module": "ESNext",
//     "moduleResolution": "bundler",
//     "strict": true,
//     "noUncheckedIndexedAccess": true,  // array[i] is T | undefined, not T
//     "noEmit": true,                    // only type-check (bundler handles emit)
//     "skipLibCheck": true               // skip d.ts files in node_modules
//   }
// }`,
    },
    {
      label: 'any, unknown, never',
      language: 'typescript',
      code: `// ── any — escape hatch (avoid except at boundaries) ─────────────────────────
function parseConfig(raw: any) {
  // TypeScript does NOT check — everything is allowed:
  return raw.host.toUpperCase() as string;  // no error even if raw is null at runtime
}

// ── unknown — type-safe escape hatch ─────────────────────────────────────────
function parseConfigSafe(raw: unknown): string {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "host" in raw &&
    typeof (raw as { host: unknown }).host === "string"
  ) {
    return (raw as { host: string }).host.toUpperCase(); // narrowed, safe
  }
  throw new Error("Invalid config");
}

// ── Catch variable narrowing (strict mode) ───────────────────────────────────
try {
  JSON.parse("{bad}");
} catch (e: unknown) {
  if (e instanceof Error) {
    console.log(e.message);   // string
  }
  // e.message without narrowing → ERROR: Object is of type 'unknown'
}

// ── never — exhaustiveness checking ──────────────────────────────────────────
type Shape = { kind: "circle"; radius: number }
           | { kind: "square"; side: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default:
      // TypeScript infers s as never here — if a new Shape member is added
      // without updating this switch, TS reports an error at the next line:
      const _exhaustive: never = s;
      throw new Error("Unhandled shape: " + JSON.stringify(_exhaustive));
  }
}

// ── never from impossible intersection ───────────────────────────────────────
type Impossible = string & number;  // never — no value can be both`,
    },
    {
      label: 'Real-world tsconfig patterns',
      language: 'typescript',
      code: `// ── Base tsconfig for a Vite + React / Angular project ───────────────────────
// tsconfig.json
// {
//   "compilerOptions": {
//     "target": "ES2022",
//     "lib": ["ES2022", "DOM", "DOM.Iterable"],
//     "module": "ESNext",
//     "moduleResolution": "bundler",   // TS 5+: matches Vite/esbuild resolution
//     "resolveJsonModule": true,
//     "allowImportingTsExtensions": true,
//     "noEmit": true,                  // bundler emits; tsc just type-checks
//     "strict": true,
//     "noUnusedLocals": true,
//     "noUnusedParameters": true,
//     "noFallthroughCasesInSwitch": true,
//     "noUncheckedIndexedAccess": true, // catches array[i] being undefined
//     "skipLibCheck": true
//   }
// }

// ── Node.js (no bundler) tsconfig ─────────────────────────────────────────────
// {
//   "compilerOptions": {
//     "target": "ES2022",
//     "lib": ["ES2022"],
//     "module": "NodeNext",           // node16 / nodenext: use for pure Node.js
//     "moduleResolution": "NodeNext",
//     "outDir": "./dist",
//     "rootDir": "./src",
//     "strict": true,
//     "skipLibCheck": true
//   }
// }

// ── Monorepo with project references ─────────────────────────────────────────
// Root tsconfig.json (no compilerOptions needed — just references):
// { "references": [{ "path": "packages/api" }, { "path": "packages/web" }] }

// packages/api/tsconfig.json:
// { "compilerOptions": { "composite": true, "outDir": "./dist" }, ... }
// composite: true enables incremental build caching (.tsbuildinfo).
// tsc --build (or tsc -b) builds the dependency graph; only changed packages rebuild.

// ── Useful CLI commands ────────────────────────────────────────────────────────
// tsc --noEmit                    # type-check only (CI)
// tsc --noEmit --watch            # continuous type-check
// tsc --noEmit --diagnostics      # show timing/memory diagnostics
// tsc --build --clean             # clean build artefacts
// tsc --showConfig                # print effective config (helpful when debugging extends chain)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using `any` instead of `unknown` for external data',
      wrong: `function parse(raw: any) {
  return raw.user.name; // no error even if raw is null
}`,
      right: `function parse(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null &&
      'user' in raw && typeof (raw as any).user?.name === 'string') {
    return (raw as { user: { name: string } }).user.name;
  }
  throw new Error('Invalid');
}`,
      explanation: '`any` disables all type checking. `unknown` forces you to narrow before use, catching errors like null access that `any` silently allows.',
    },
    {
      title: 'Skipping `strict: true` in tsconfig',
      wrong: `// tsconfig.json — omitting strict
{ "compilerOptions": { "target": "ES2020" } }
// null is assignable to string — bugs hidden at compile time
let name: string = null; // allowed!`,
      right: `// tsconfig.json
{ "compilerOptions": { "target": "ES2020", "strict": true } }
// Now: let name: string = null; // ERROR
let name: string | null = null; // must be explicit`,
      explanation: 'Without `strict: true`, TypeScript catches far fewer errors. `strictNullChecks` alone eliminates an entire category of "Cannot read properties of null/undefined" runtime crashes.',
    },
    {
      title: 'Annotating obvious initialisers (redundant)',
      wrong: `const count: number = 0;
const name: string = 'Alice';
const arr: string[] = ['a', 'b'];`,
      right: `const count = 0;
const name = 'Alice';
const arr = ['a', 'b'];
// Annotate what can't be inferred — function params, empty arrays, complex objects`,
      explanation: 'TypeScript infers types from initialisers. Annotating obvious values adds noise without adding safety. Reserve annotations for function parameters, return types, and non-obvious cases.',
    },
    {
      title: 'Using `as` cast to silence legitimate errors',
      wrong: `const el = document.getElementById('root') as HTMLInputElement;
el.value = 'hello'; // crashes if element is null or not an input`,
      right: `const el = document.getElementById('root');
if (el instanceof HTMLInputElement) {
  el.value = 'hello'; // narrowed, safe
}`,
      explanation: '`as` is a lie to the compiler — it bypasses type safety. Use `instanceof` or `typeof` narrowing instead. If you must use `as`, first handle the null/wrong-type case.',
    },
    {
      title: 'Forgetting `as const` on config/enum-like objects',
      wrong: `const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
type Status = typeof STATUS[keyof typeof STATUS]; // string — too wide!`,
      right: `const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' } as const;
type Status = typeof STATUS[keyof typeof STATUS]; // "active" | "inactive"`,
      explanation: 'Without `as const`, object values are widened to `string`. With `as const`, they keep their literal types, making the derived union precise and safe.',
    },
    {
      title: 'Using `!` non-null assertion without understanding the risk',
      wrong: `const el = document.getElementById('root')!;
el.addEventListener('click', () => {}); // crashes if element doesn't exist`,
      right: `const el = document.getElementById('root');
if (!el) throw new Error('#root element not found');
el.addEventListener('click', () => {}); // narrowed to HTMLElement`,
      explanation: '`!` tells TypeScript "trust me, this is not null" — but if you are wrong, you get a runtime crash. Prefer explicit null checks or early returns so the failure is handled predictably.',
    },
  ];

  challenge: Challenge = {
    title: 'Type a configuration loader',
    language: 'typescript',
    description: 'Write a `loadConfig` function that: (1) accepts `unknown` input; (2) validates it has `host: string` and `port: number`; (3) returns a typed `Config` object; (4) throws a descriptive error if the shape is wrong. Add a helper type guard `isConfig(x: unknown): x is Config`.',
    hints: [
      'Define: interface Config { host: string; port: number }',
      'Use typeof checks inside the type guard',
      'Check typeof x === "object" && x !== null before accessing properties',
      'The type guard returns x is Config — TypeScript narrows after a call that returns true',
    ],
    starterCode: `interface Config {
  host: string;
  port: number;
}

// 1. Write a type guard
function isConfig(x: unknown): x is Config {
  // TODO
}

// 2. Write the loader
function loadConfig(raw: unknown): Config {
  // TODO
}

// Test
console.log(loadConfig({ host: 'localhost', port: 3000 })); // OK
console.log(loadConfig({ host: 'example.com', port: '8080' })); // should throw`,
    solution: `interface Config {
  host: string;
  port: number;
}

function isConfig(x: unknown): x is Config {
  return (
    typeof x === 'object' &&
    x !== null &&
    'host' in x && typeof (x as Record<string, unknown>).host === 'string' &&
    'port' in x && typeof (x as Record<string, unknown>).port === 'number'
  );
}

function loadConfig(raw: unknown): Config {
  if (!isConfig(raw)) {
    throw new Error(
      \`Invalid config: expected { host: string; port: number }, got \${JSON.stringify(raw)}\`
    );
  }
  return raw; // narrowed to Config by the type guard
}

console.log(loadConfig({ host: 'localhost', port: 3000 })); // { host: 'localhost', port: 3000 }
try {
  loadConfig({ host: 'example.com', port: '8080' });
} catch (e) {
  if (e instanceof Error) console.error(e.message);
}`,
    playgroundUrl: 'https://www.typescriptlang.org/play',
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between TypeScript\'s structural typing and the nominal typing used in C# or Java?',
      options: [
        'TypeScript checks type names; C# checks type shapes',
        'TypeScript checks type shapes (duck typing); C# checks type names — two classes with the same shape are NOT compatible unless they share a common type',
        'TypeScript only works at compile time; C# is runtime',
        'There is no difference — they both use shapes',
      ],
      answer: 1,
      explanation: 'TypeScript uses structural typing: if two types have the same shape (same properties and types), they are compatible — regardless of class name or declaration. In C#/Java, two classes with identical properties are NOT interchangeable unless one extends or implements the other.',
    },
    {
      q: 'What does `tsc --noEmit` do and why is it used in CI?',
      options: [
        'Compiles TypeScript without optimization — slower but more accurate',
        'Runs type-checking across all files and reports errors, but writes no output files — ideal for CI because you only want error detection, not to generate JS',
        'Skips type-checking and only emits JS — faster for development',
        'Deletes all previously emitted JS files',
      ],
      answer: 1,
      explanation: '`tsc --noEmit` performs full type-checking without writing any JavaScript output. In CI pipelines, you want to know if there are type errors — the bundler (Vite, esbuild) handles the actual JS emit. Separating the two makes CI faster and builds faster.',
    },
    {
      q: 'Which compiler option prevents `null` and `undefined` from being assigned to types like `string` and `number` without explicit handling?',
      options: [
        'noImplicitAny',
        'noUncheckedIndexedAccess',
        'strictNullChecks',
        'useUnknownInCatchVariables',
      ],
      answer: 2,
      explanation: '`strictNullChecks` makes `null` and `undefined` their own distinct types, not assignable to `string` or `number`. Without it, null-related runtime crashes can compile without error. This single option eliminates a huge class of production bugs.',
    },
    {
      q: 'What is the difference between `unknown` and `any` in TypeScript?',
      options: [
        '`any` is for primitive types; `unknown` is for objects',
        '`unknown` and `any` are identical — just different names for the same type',
        '`any` disables all type checking on a value; `unknown` allows any value to be assigned but requires narrowing (typeof/instanceof) before you can use it',
        '`unknown` is stricter than `any` — it rejects null and undefined',
      ],
      answer: 2,
      explanation: '`any` is a full escape hatch — the compiler stops checking entirely. `unknown` is the type-safe alternative: a value can hold any runtime value, but TypeScript forces you to narrow the type before calling methods or accessing properties. Prefer `unknown` at system boundaries (JSON.parse, catch blocks, fetch responses).',
    },
    {
      q: 'What type does TypeScript infer for `const status = "active"` (with `strictNullChecks` on)?',
      options: [
        'string',
        '"active" (literal type)',
        'string | undefined',
        'const',
      ],
      answer: 1,
      explanation: 'When a `const` variable is initialised with a string literal, TypeScript infers the literal type `"active"`, not the wider `string`. This enables discriminated unions and exhaustiveness checking. `let status = "active"` would infer `string` because let can be reassigned.',
    },
    {
      q: 'What does the `never` type represent and how is it used in practice?',
      options: [
        'A value that is explicitly set to null',
        'The type of a value that never exists — used for unreachable code and exhaustiveness checking in switch statements',
        'An empty string or zero — falsy values',
        'A function that returns void',
      ],
      answer: 1,
      explanation: '`never` is the bottom type — no value belongs to it. It arises in impossible intersections (`string & number`), functions that always throw or loop forever, and as the remaining type after exhaustive narrowing. Placing `const _: never = x` in a switch default catches missing cases when a new union member is added.',
    },
    {
      q: 'What is the difference between `as T` (type assertion) and a type guard `x is T`?',
      options: [
        'They are identical — both narrow the type',
        '`as T` casts at runtime; type guards are compile-time only',
        '`as T` is a compile-time lie — it tells TS "trust me, no runtime check". A type guard (`x is T`) performs an actual runtime check and narrows the type only when the check passes — this is type-safe',
        'Type guards only work with classes; `as T` works with interfaces',
      ],
      answer: 2,
      explanation: '`as T` bypasses type safety — if you are wrong, you get a runtime crash with no compiler warning. A type guard is a function that returns `x is T` — it performs a real runtime check, and TypeScript narrows the type inside the `if (isT(x))` block only when the guard actually returns true. Always prefer type guards over `as` for external data.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I write explicit type annotations vs letting TypeScript infer?',
      a: 'Infer when the type is obvious from the initialiser: <code>const count = 0</code>, <code>const user = { name: "Alice" }</code>. Annotate explicitly for: (1) function parameters — inference cannot help here; (2) function return types — catches accidental <code>undefined</code> returns; (3) empty array or object literals — <code>const items: string[] = []</code>; (4) when the inferred type is too wide for your use case. The guiding principle: annotate at function boundaries, infer inside function bodies.',
    },
    {
      q: 'What is `as const` and when do I use it?',
      a: '<code>as const</code> is a const assertion. It freezes an array or object literal at its most precise literal types and makes everything <code>readonly</code>. Use it for: (1) config/enum-like objects where you want the values to be literal types: <code>{ STATUS: "active" } as const</code> gives type <code>"active"</code> not <code>string</code>; (2) arrays you want to use as a union type: <code>const COLORS = ["red","green","blue"] as const; type Color = typeof COLORS[number]</code>; (3) anywhere you want to derive a precise type from a JS value rather than writing a separate <code>type</code> declaration.',
    },
    {
      q: 'What does `satisfies` do that a type annotation doesn\'t?',
      a: '<code>satisfies</code> (TS 4.9+) validates that an expression matches a type but keeps the expression\'s more specific inferred type. A type annotation widens: <code>const p: Point = { x:1, y:2 }</code> — the type of <code>p</code> is <code>Point</code>. With <code>satisfies</code>: <code>const p = { x:1, y:2 } satisfies Point</code> — TS validates the shape, but the type of <code>p</code> is still <code>{ x: number; y: number }</code> (more specific). This matters when you have a union type: <code>Record&lt;string, string | string[]&gt;</code> — without <code>satisfies</code>, each value\'s type widens to <code>string | string[]</code>; with <code>satisfies</code>, each value keeps its exact type.',
    },
    {
      q: 'What is the difference between `strictNullChecks` and the `!` non-null assertion operator?',
      a: '<code>strictNullChecks</code> is a compiler option that makes <code>null</code> and <code>undefined</code> separate types — they cannot be assigned to <code>string</code> or <code>number</code> without an explicit union. The <code>!</code> operator is a per-site override: <code>el!</code> tells TypeScript "I guarantee this is not null/undefined — don\'t check". It is a compile-time assertion with no runtime effect. If you are wrong at runtime, you get a crash. Prefer explicit null checks (<code>if (!el) throw ...</code>) over <code>!</code>, except in test code or when you have strong contextual evidence the value cannot be null.',
    },
    {
      q: 'How does TypeScript handle excess properties on object literals?',
      a: 'TypeScript applies excess property checking <strong>only on direct object literal assignments</strong> to a typed variable. <code>const p: Point = { x:1, y:2, z:3 }</code> is an error (extra property <code>z</code>). But <code>const obj = { x:1, y:2, z:3 }; const p: Point = obj;</code> is allowed — the object is assigned via a variable first, so structural compatibility (not excess property checking) applies. This asymmetry exists because typos in direct object literals are almost always bugs, while passing a richer object through a variable is intentional.',
    },
    {
      q: 'What is `moduleResolution: "bundler"` and when should I use it?',
      a: '<code>moduleResolution: "bundler"</code> (TypeScript 5.0+) tells the TypeScript compiler to resolve modules the way modern bundlers (Vite, esbuild, Webpack 5) do — allowing <code>.ts</code> extensions in imports, supporting path aliases, and not requiring explicit <code>.js</code> extensions in ESM imports. Use it for: any project using Vite, esbuild, or modern Webpack. For pure Node.js without a bundler, use <code>node16</code> or <code>nodenext</code> — these match Node\'s native ESM resolution (requiring <code>.js</code> extensions). Never use the legacy <code>node</code> value for new projects.',
    },
    {
      q: 'What is `noUncheckedIndexedAccess` and should I enable it?',
      a: '<code>noUncheckedIndexedAccess</code> makes array index access return <code>T | undefined</code> instead of just <code>T</code>, because TypeScript cannot know if index <code>i</code> is within bounds at compile time. Example: with this flag, <code>const arr = [1,2,3]; const x = arr[5];</code> gives <code>x: number | undefined</code> — forcing you to handle the out-of-bounds case. This is not part of <code>strict: true</code> (it is not enabled by default) because it requires nullish checks on every array access, which adds some verbosity. Recommended for new projects that handle data-intensive code; optional for UI-heavy projects where array access patterns are predictable.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript is a structurally-typed superset of JavaScript that adds static type checking — it compiles to plain JS and catches bugs at build time rather than runtime.',
    mustKnow: [
      'Structural typing: compatibility is determined by <code>shape</code>, not class name',
      '<code>strict: true</code> (especially <code>strictNullChecks</code>) is the baseline for all new projects',
      'Infer from obvious initialisers; always annotate function params and return types',
      '<code>unknown</code> is the type-safe alternative to <code>any</code> — must narrow before use',
      '<code>never</code> enables exhaustiveness checking in switch/discriminated union patterns',
      '<code>as const</code> freezes literals to their precise types and makes objects <code>readonly</code>',
      '<code>tsc --noEmit</code> type-checks without emitting JS — the canonical CI command',
    ],
    interviewFocus: [
      'What is structural typing and how does it differ from nominal typing?',
      'What is the difference between <code>any</code> and <code>unknown</code>?',
      'When would you use <code>never</code> — give a concrete example',
      'What does <code>strict: true</code> enable and why does it matter?',
      'Explain the difference between a type assertion (<code>as T</code>) and a type guard (<code>x is T</code>)',
    ],
  };
}
