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
  selector: 'app-ts-modules',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class TsModules {
  quickRef: QuickRefItem[] = [
    { name: 'export',                  type: 'keyword', desc: 'Named export — consumers import by name: import { x } from "./mod"' },
    { name: 'export default',          type: 'keyword', desc: 'Default export — one per file; imported without braces: import x from "./mod"' },
    { name: 'import type',             type: 'keyword', desc: 'Type-only import — erased at compile time, never appears in emitted JS' },
    { name: 're-export',               type: 'syntax',  desc: 'export { x } from "./mod" — re-export without importing into current scope' },
    { name: 'export * from',           type: 'syntax',  desc: 'Re-export all named exports from a module — barrel/index pattern' },
    { name: 'namespace',               type: 'keyword', desc: 'Legacy TypeScript feature — use ES modules instead in modern code' },
    { name: 'declare module',          type: 'keyword', desc: 'Ambient module declaration — adds types for a JS-only library or global' },
    { name: 'module augmentation',     type: 'syntax',  desc: 'Add members to an existing module\'s types without forking the library' },
    { name: 'package.json#exports',    type: 'keyword', desc: 'Node.js exports map — controls what subpaths packages expose' },
    { name: 'import.meta',             type: 'keyword', desc: 'ESM runtime metadata: import.meta.url, import.meta.env (Vite)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ES modules vs CommonJS — the two module systems',
      points: [
        'JavaScript has two mainstream module systems. <strong>ES Modules (ESM)</strong>: the standard — <code>import</code>/<code>export</code> syntax, static (analyzable at parse time), supports tree-shaking. <strong>CommonJS (CJS)</strong>: Node.js original — <code>require()</code>/<code>module.exports</code>, dynamic (can be inside conditionals), synchronous.',
        'TypeScript compiles your <code>import</code>/<code>export</code> syntax to the format you specify in <code>module</code> tsconfig. With <code>module: "CommonJS"</code> it emits <code>require()</code>. With <code>module: "ESNext"</code> it leaves the ESM syntax as-is for your bundler or runtime.',
        'Modern Node.js (12+) supports native ESM via <code>.mjs</code> files or <code>"type": "module"</code> in package.json. CJS and ESM do not interoperate cleanly — a CJS file can <code>require()</code> another CJS but cannot natively <code>import</code> an ESM-only package.',
        'For new projects: use ESM. For Node.js libraries: dual-publish with both ESM and CJS via <code>package.json#exports</code>. For browser bundles: use ESM with a bundler (Vite, webpack, esbuild).',
      ],
    },
    {
      heading: 'Named exports, default exports, and re-exports',
      points: [
        'Named exports are the preferred pattern in TypeScript codebases. They are explicit, refactor-friendly (IDEs can rename across files), and tree-shakable. Use <code>export { x, y }</code> at the end or inline <code>export const x = ...</code>.',
        'Default exports have one per file and are imported without braces. They make refactoring harder (the import name is chosen by the consumer) and create friction with re-exports. Avoid default exports in libraries; they are fine for React components and Angular modules where convention dictates them.',
        'Re-exports create public surface without importing into the current scope: <code>export { parseDate } from "./dates"</code>. The barrel pattern (<code>index.ts</code> re-exporting everything from a folder) is common for library public APIs but can cause slow TypeScript compilation if overused in large projects.',
        '<code>export type { MyType }</code> ensures the export is type-only and will never appear in emitted JavaScript. Required with <code>isolatedModules: true</code> when re-exporting a type from another file.',
      ],
    },
    {
      heading: 'import type — type-only imports',
      points: [
        '<code>import type { Foo } from "./foo"</code> tells TypeScript this import is for types only. The import is completely erased from the emitted JavaScript — no <code>require()</code> call, no import statement. This is critical for avoiding circular runtime dependencies that would exist only because of types.',
        'With <code>isolatedModules: true</code> (required by Vite/esbuild), TypeScript enforces that you use <code>import type</code> for any import that is only used as a type. This prevents the transpiler from accidentally emitting an import that only existed for type-checking.',
        'You can also use the <code>type</code> modifier inline: <code>import { type Foo, bar } from "./foo"</code> — mixes type-only and value imports from the same module. This is the most common pattern in modern TypeScript.',
        'When to use <code>import type</code>: whenever you only use the imported name in type position (as a type annotation, generic argument, or interface). When in doubt, use it — it cannot hurt and avoids circular dependency issues.',
      ],
    },
    {
      heading: 'Namespaces — what they are and why to avoid them',
      points: [
        'TypeScript <code>namespace</code> (formerly <code>module</code>) is a TypeScript-specific way to group related code under a name. Before ES modules were standard, namespaces were used to avoid global variable collisions. They compile to immediately-invoked function expressions (IIFEs) that attach to a global object.',
        'Namespaces are almost entirely obsolete in modern TypeScript. ES modules provide better isolation, tree-shaking, and tooling support. The only remaining valid use case is ambient namespace declarations for legacy global-script libraries (e.g. a CDN-hosted library that sets <code>window.jQuery</code>).',
        'Namespaces do NOT work well with <code>isolatedModules: true</code> — namespace exports across files require cross-file analysis. If you see namespace in existing code, it is a legacy pattern — migrate it to ES modules when possible.',
        'Do not confuse TypeScript <code>namespace</code> with Node.js packages or Java-style packages. They serve completely different purposes.',
      ],
    },
    {
      heading: 'Module augmentation and declaration merging',
      points: [
        'Module augmentation lets you add new members to an existing module\'s type declarations without modifying the original library. Syntax: <code>declare module "express" { interface Request { user?: User } }</code>. This extends Express\'s Request type to include a <code>user</code> property that your auth middleware adds.',
        'Declaration merging is the mechanism behind module augmentation: TypeScript merges all <code>interface</code> declarations with the same name. Two <code>interface Foo</code> declarations in the same or different files merge into one type with all members.',
        'Global augmentation adds to the global scope: <code>declare global { interface Window { myPlugin: Plugin } }</code>. This must be inside a module file (a file with at least one <code>import</code> or <code>export</code>) to not accidentally replace the global type.',
        'Module augmentation requires you to import from the original module first — you cannot augment a module you have never referenced. The augmentation file must itself be a module (have an <code>import</code> or <code>export</code>), otherwise TypeScript treats it as a script and it does not augment but replaces.',
      ],
    },
    {
      heading: 'package.json exports map — controlling what a package exposes',
      points: [
        'The <code>exports</code> field in package.json is the modern way to control what subpaths a package exposes. It replaces the old <code>main</code> field and enables conditional exports based on the import context (ESM vs CJS, browser vs Node.js).',
        'Example: <code>{ "exports": { ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" } } }</code> — consumers get the ESM version when using <code>import</code> and the CJS version when using <code>require()</code>.',
        'Subpath exports restrict what can be imported from a package. If a package has <code>"exports": { ".": "..." }</code> without a <code>"./utils"</code> entry, <code>import { x } from "pkg/utils"</code> throws at runtime — even if the file exists on disk.',
        'TypeScript respects the <code>exports</code> map when <code>moduleResolution</code> is <code>"node16"</code>, <code>"nodenext"</code>, or <code>"bundler"</code>. With the old <code>"node"</code> resolution, TypeScript ignores the exports map and reads files directly — a common source of "works in TypeScript but breaks at runtime" bugs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Named vs default exports',
      language: 'typescript',
      code: `// ---- named-exports.ts ----
// Preferred: named exports are explicit and refactor-friendly
export const PI = 3.14159;
export function add(a: number, b: number): number { return a + b; }
export class Vector { constructor(public x: number, public y: number) {} }

// Re-export from another module (barrel pattern):
export { parseDate, formatDate } from './dates';
export type { DateOptions } from './dates'; // type-only re-export

// ---- default-export.ts ----
// One default per file — consumers choose the import name
export default class UserRepository {
  findById(id: string) { return { id, name: 'Alice' }; }
}

// ---- consumer.ts ----
import { PI, add, Vector } from './named-exports'; // named — explicit
import UserRepo from './default-export';            // default — name is arbitrary
import Repo from './default-export';                // also valid — different name, same class

// Mixing named and default:
import defaultExport, { namedExport } from './module';

// Type-only imports (erased at compile time):
import type { DateOptions } from './dates'; // never in emitted JS
import { type Vector as VectorType, add as mathAdd } from './named-exports'; // inline type modifier`,
    },
    {
      label: 'Barrel / index pattern',
      language: 'typescript',
      code: `// Barrel pattern: src/utils/index.ts re-exports everything from the folder
// Consumers import from the folder, not from individual files

// src/utils/dates.ts
export function parseDate(s: string): Date { return new Date(s); }
export function formatDate(d: Date): string { return d.toISOString(); }

// src/utils/strings.ts
export function capitalize(s: string): string { return s[0].toUpperCase() + s.slice(1); }
export function truncate(s: string, len: number): string { return s.length > len ? s.slice(0, len) + '…' : s; }

// src/utils/index.ts — barrel
export * from './dates';
export * from './strings';
// Or selectively re-export:
export { parseDate, formatDate } from './dates';
export type { DateRange } from './dates'; // type-only re-export

// Consumer:
import { parseDate, capitalize } from './utils'; // clean — no path diving

// ⚠️ Barrel trade-off:
// - Pro: clean imports, single public surface area
// - Con: in large projects, deep barrel chains can slow TypeScript language server
// - Con: importing one item loads all barrel entries (mitigated by tree-shaking)
// Rule: use barrels for public library APIs; avoid in internal app code with hot reloads`,
    },
    {
      label: 'ESM vs CommonJS interop',
      language: 'typescript',
      code: `// === CommonJS (tsconfig module: "CommonJS") ===
// TypeScript compiles import/export to require/module.exports:

// Source (TypeScript):
import { add } from './math';
export function double(n: number) { return add(n, n); }

// Compiled output (JavaScript, CJS):
// "use strict";
// const math_1 = require("./math");
// function double(n) { return (0, math_1.add)(n, n); }
// exports.double = double;

// === ESM (tsconfig module: "ESNext" or "NodeNext") ===
// TypeScript leaves import/export as-is:

// Source == Output:
import { add } from './math.js'; // .js required for node16/nodenext
export function double(n: number) { return add(n, n); }

// === Importing CJS packages from ESM ===
// With esModuleInterop: true:
import fs from 'fs';          // CJS default import — works
import { readFile } from 'fs'; // named import — also works

// Without esModuleInterop: true:
import * as fs from 'fs';     // Must use namespace import for CJS
import { readFile } from 'fs'; // Named CJS import — still works

// Dynamic import (works in both CJS and ESM):
const { add } = await import('./math.js'); // returns a module namespace object
// Useful for: lazy loading, conditional imports, avoiding circular deps`,
    },
    {
      label: 'Module augmentation & global augmentation',
      language: 'typescript',
      code: `// === Augmenting Express Request ===
// File: src/types/express.d.ts
import 'express'; // MUST import or this replaces rather than augments

declare module 'express' {
  interface Request {
    user?: { id: string; roles: string[] };
    sessionId?: string;
  }
}

// Now in route handlers:
// import { Request, Response } from 'express';
// app.get('/me', (req: Request, res: Response) => {
//   const userId = req.user?.id; // TypeScript knows user exists
// });

// === Augmenting a library's types ===
// File: src/types/lodash.d.ts
import 'lodash';
declare module 'lodash' {
  interface LoDashStatic {
    customHelper(arr: unknown[]): unknown[];
  }
}

// === Global augmentation ===
// File: src/types/global.d.ts
export {}; // MUST be a module (has import/export) to use declare global

declare global {
  interface Window {
    analytics: { track(event: string, data?: object): void };
  }
  // Add to the global scope:
  function logDev(message: string): void;
}

// Use:
// window.analytics.track('page_view');
// logDev('debug info');`,
    },
    {
      label: 'Namespaces (legacy) vs ES modules',
      language: 'typescript',
      code: `// === LEGACY: namespace (avoid in modern code) ===
namespace Geometry {
  export interface Point { x: number; y: number; }
  export function distance(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
  export namespace Color { // nested namespace
    export type RGB = [number, number, number];
  }
}
const dist = Geometry.distance({ x: 0, y: 0 }, { x: 3, y: 4 }); // 5
type RGB = Geometry.Color.RGB;

// What TypeScript compiles this to (IIFE pattern):
// var Geometry;
// (function (Geometry) {
//   function distance(a, b) { ... }
//   Geometry.distance = distance;
// })(Geometry || (Geometry = {}));

// === MODERN: use ES modules instead ===
// geometry/point.ts
export interface Point { x: number; y: number; }

// geometry/distance.ts
import type { Point } from './point';
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// geometry/index.ts (barrel)
export type { Point } from './point';
export { distance } from './distance';

// consumer.ts
import { distance, type Point } from './geometry';`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Circular imports causing undefined at runtime',
      wrong: `// a.ts
import { b } from './b';
export const a = 'A-' + b; // b is undefined at init time!

// b.ts
import { a } from './a';
export const b = 'B-' + a; // a is undefined at init time!

// Circular: a needs b, b needs a — one must initialize first with undefined`,
      right: `// Break the cycle by extracting shared values to a third module:
// shared.ts
export const PREFIX = 'shared';

// a.ts
import { PREFIX } from './shared';
export const a = PREFIX + '-A';

// b.ts
import { PREFIX } from './shared';
export const b = PREFIX + '-B';

// Or use type-only imports where only types create the cycle:
// import type { MyType } from './b'; // removed from emitted JS — no circular runtime dep`,
      explanation: 'ES module circular imports are allowed syntactically but cause initialization order issues. If module A imports from B and B imports from A, one module sees undefined when the other initializes. Extract shared constants/types to a third module, or use import type for type-only cycles.',
    },
    {
      title: 'Using default exports in libraries — makes refactoring hard',
      wrong: `// utils.ts
export default function parseDate(s: string): Date { return new Date(s); }

// Consumer A:
import parseDate from './utils';   // works
// Consumer B (different name — no TS error):
import parseDateHelper from './utils'; // different name, same function — confusing`,
      right: `// Use named exports for library code:
export function parseDate(s: string): Date { return new Date(s); }

// Consumer — always uses the correct name:
import { parseDate } from './utils';
// Rename with 'as' when needed — explicit:
import { parseDate as parse } from './utils';`,
      explanation: 'Default exports let consumers import under any name — this fragments naming conventions and makes "find all usages" unreliable. Named exports enforce a canonical name across the codebase. Reserve default exports for Angular components, React components, or Next.js pages where framework convention requires them.',
    },
    {
      title: 'Omitting `import type` with isolatedModules (Vite/esbuild)',
      wrong: `// tsconfig: isolatedModules: true
// Only using User as a type annotation — but imported as a value:
import { User } from './user'; // Error: 'User' is a type — use import type

function greet(user: User): string { return user.name; }`,
      right: `// Option 1: import type — erased, no runtime cost:
import type { User } from './user';
function greet(user: User): string { return user.name; }

// Option 2: inline type modifier — mix value and type in one import:
import { type User, createUser } from './user';
function greet(user: User): string { return user.name; }
const u = createUser('Alice');`,
      explanation: 'With isolatedModules: true, every file is transpiled independently. The transpiler cannot know that User is only a type — it might emit a runtime import. import type makes this explicit and required. TypeScript errors when you import a type without the type keyword under isolatedModules.',
    },
    {
      title: 'Barrel index.ts causing slow compilation in large apps',
      wrong: `// src/index.ts — re-exports everything in the app:
export * from './components';
export * from './services';
export * from './models';
export * from './utils';
// 500+ exports — TypeScript must resolve all of them for every import`,
      right: `// Import directly from the module, not the barrel:
import { UserService } from './services/user.service'; // fast
// instead of:
// import { UserService } from '.'; // slow — forces resolution of entire barrel

// Keep barrels only for the public API of a library or a bounded module:
// src/user-module/index.ts — exports only the public surface of user-module
export { UserService } from './user.service';
export type { User, CreateUserDto } from './user.model';`,
      explanation: 'Deep barrel chains (index.ts re-exporting other index.ts files) force TypeScript to resolve hundreds of modules to find one export. This slows the language server and build. Use direct imports inside the app; use barrels only for the public API boundary of a library or well-bounded module.',
    },
    {
      title: 'Augmenting a module without importing it first',
      wrong: `// src/types/express.d.ts — missing the import!
declare module 'express' {
  interface Request {
    user?: { id: string };
  }
}
// Without import 'express', this REPLACES the module's types (ambient module)
// instead of AUGMENTING them — losing all existing Express types!`,
      right: `// src/types/express.d.ts — must import first to augment
import 'express'; // this import triggers "augmentation mode"

declare module 'express' {
  interface Request {
    user?: { id: string };
  }
}

// Also: the augmentation file must itself be a module (have import/export)
// to avoid replacing the global scope. The import 'express' line satisfies this.`,
      explanation: 'Module augmentation requires a prior import of the module being augmented. Without it, TypeScript treats the declare module as an ambient module declaration that replaces all existing types. The import does not have to import any specific symbol — import "express" is enough to switch to augmentation mode.',
    },
    {
      title: 'Using namespace instead of ES modules in new code',
      wrong: `// Legacy pattern — compiles to IIFEs, no tree-shaking, poor tooling:
namespace Api {
  export interface User { id: string; name: string; }
  export function fetchUser(id: string): Promise<User> { /* ... */ return Promise.resolve({id, name:''}); }
}`,
      right: `// Modern ES module pattern:
// api/types.ts
export interface User { id: string; name: string; }

// api/user.ts
import type { User } from './types';
export async function fetchUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json() as Promise<User>;
}`,
      explanation: 'TypeScript namespaces are a legacy concept — ES modules are the standard for code organization. Namespaces do not tree-shake, create awkward interop with CommonJS/ESM tools, and conflict with isolatedModules. Migrate namespace code to ES modules unless you are maintaining a legacy codebase that scripts into a global scope.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a type-safe plugin registry using module patterns',
    language: 'typescript',
    description: 'Create a PluginRegistry<TMap> that allows registering and retrieving typed plugins by name key. The registry should be type-safe: registering a plugin under a key and then getting it back should return the correct plugin type without any casting. Use named exports, type-only imports, and generic constraints.',
    hints: [
      'Use a generic type map: TMap extends Record<string, unknown> — keys are plugin names, values are plugin types',
      'The registry class stores plugins in a Map<string, unknown> internally but the public API is typed via TMap',
      'get<K extends keyof TMap>(key: K): TMap[K] — indexed access gives the right type per key',
      'A fluent register method can return a new registry type: register<K, V>(key: K, plugin: V): PluginRegistry<TMap & Record<K, V>>',
    ],
    starterCode: `// TODO: implement PluginRegistry<TMap> with:
//   register<K extends string, V>(key: K, plugin: V): PluginRegistry<TMap & Record<K, V>>
//   get<K extends keyof TMap>(key: K): TMap[K]
//   has(key: string): boolean
//   keys(): Array<keyof TMap>

// Usage should work like this:
const registry = new PluginRegistry()
  .register('logger', { log: (msg: string) => console.log(msg) })
  .register('formatter', { format: (n: number) => n.toFixed(2) });

const logger = registry.get('logger');
logger.log('hello'); // typed: { log: (msg: string) => void }

const formatter = registry.get('formatter');
console.log(formatter.format(3.14159)); // typed: { format: (n: number) => string }`,
    solution: `class PluginRegistry<TMap extends Record<string, unknown> = Record<never, never>> {
  private readonly store = new Map<string, unknown>();

  private constructor(entries?: [string, unknown][]) {
    if (entries) {
      for (const [k, v] of entries) this.store.set(k, v);
    }
  }

  static create(): PluginRegistry<Record<never, never>> {
    return new PluginRegistry();
  }

  register<K extends string, V>(
    key: K,
    plugin: V
  ): PluginRegistry<TMap & Record<K, V>> {
    const entries = [...this.store.entries(), [key, plugin]] as [string, unknown][];
    return new PluginRegistry<TMap & Record<K, V>>(entries);
  }

  get<K extends keyof TMap>(key: K): TMap[K] {
    return this.store.get(key as string) as TMap[K];
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  keys(): Array<keyof TMap> {
    return [...this.store.keys()] as Array<keyof TMap>;
  }
}

// Usage:
const registry = PluginRegistry.create()
  .register('logger', { log: (msg: string) => console.log(msg) })
  .register('formatter', { format: (n: number) => n.toFixed(2) })
  .register('parser', { parse: (s: string) => parseInt(s, 10) });

const logger = registry.get('logger');
logger.log('hello'); // { log: (msg: string) => void }

const formatter = registry.get('formatter');
console.log(formatter.format(3.14159)); // "3.14"

console.log(registry.keys()); // ['logger', 'formatter', 'parser']
console.log(registry.has('parser')); // true`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between ES modules and CommonJS?',
      options: [
        'ES modules use export/import and are static; CommonJS uses require/module.exports and is dynamic',
        'ES modules only work in browsers; CommonJS only works in Node.js',
        'ES modules are faster at runtime than CommonJS',
        'CommonJS supports tree-shaking; ES modules do not',
      ],
      answer: 0,
      explanation: 'ES modules use export/import syntax and are statically analyzable at parse time — enabling tree-shaking and better tooling. CommonJS uses require() which is a function call that can appear anywhere at runtime — making static analysis impossible.',
    },
    {
      q: 'What does `import type { Foo } from "./foo"` guarantee?',
      options: [
        'Foo is exported from foo with the type keyword',
        'The import is completely erased from emitted JavaScript — no runtime dependency on foo',
        'Foo can only be used as a class, not an interface',
        'TypeScript skips type-checking for Foo',
      ],
      answer: 1,
      explanation: 'import type imports are entirely erased during compilation — they produce zero JavaScript output. No require() call, no import statement. This eliminates runtime circular dependencies that exist only because of type annotations.',
    },
    {
      q: 'Why should you avoid deep barrel (index.ts) chains in a large app?',
      options: [
        'They cause runtime errors in Node.js',
        'They break tree-shaking in all bundlers',
        'They force TypeScript to resolve hundreds of modules for any import, slowing the language server and build',
        'They conflict with the isolatedModules compiler option',
      ],
      answer: 2,
      explanation: 'Every time you import from a barrel, TypeScript must resolve all modules that barrel re-exports — just to find the one export you want. In large apps with deep barrel chains, this significantly slows compilation and the language server. Import directly from the source file inside the app.',
    },
    {
      q: 'When augmenting an Express Request type, why must you include `import "express"` at the top?',
      options: [
        'To ensure Express is installed before the augmentation runs',
        'To switch TypeScript to augmentation mode — without it, the declare module replaces all existing Express types instead of extending them',
        'To import the Request type you are augmenting',
        'TypeScript requires all declaration files to have at least one import',
      ],
      answer: 1,
      explanation: 'Without the import, TypeScript treats the declare module block as an ambient module that replaces the entire module\'s types — losing all existing Express definitions. The import "express" switches to augmentation mode, merging your additions with the existing types.',
    },
    {
      q: 'What is the main problem with TypeScript namespaces in modern code?',
      options: [
        'They cannot contain interfaces — only classes and functions',
        'They are slower than ES modules at runtime',
        'They compile to IIFEs and do not work well with ES module tools, tree-shaking, or isolatedModules',
        'They cannot be imported across files',
      ],
      answer: 2,
      explanation: 'Namespaces compile to immediately-invoked function expressions (IIFEs) that attach to global objects. This pattern does not work with ES module tree-shaking, conflicts with isolatedModules, and creates awkward interop with modern bundlers. Use ES modules instead.',
    },
    {
      q: 'What does the `exports` field in package.json do when used with moduleResolution: "bundler"?',
      options: [
        'It lists all exported TypeScript types for the package',
        'It controls what subpaths the package exposes and which format (ESM/CJS) is served per import context',
        'It replaces the main field for all module resolutions',
        'It enables tree-shaking for the package',
      ],
      answer: 1,
      explanation: 'The exports map in package.json controls exactly what subpaths a package exposes and can serve different files for ESM vs CJS imports. TypeScript respects it when moduleResolution is "bundler", "node16", or "nodenext" — subpaths not in the map are inaccessible even if the file exists on disk.',
    },
    {
      q: 'Which of these is the preferred pattern for exporting from a utility module?',
      options: [
        'export default — one big object with all utilities',
        'Named exports — each utility exported individually by name',
        'namespace — group utilities under a namespace object',
        'export * — re-export from an internal module',
      ],
      answer: 1,
      explanation: 'Named exports are explicit, refactor-friendly (IDEs can track renames), tree-shakable (bundlers can remove unused exports), and force a consistent name across the codebase. Default exports of big objects defeat tree-shaking; namespaces are legacy; export * is for barrel files, not for authoring utilities.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a module and a script in TypeScript?',
      a: 'A file with at least one top-level import or export is a module — it has its own scope and does not pollute the global namespace. A file with no imports or exports is a script — its declarations are in the global scope and visible everywhere. This distinction matters for declaration files: a .d.ts file without import/export adds to the global scope (intentional for global type augmentation); with import/export it is a module (must be imported explicitly).',
    },
    {
      q: 'How do I share types between files without a runtime circular dependency?',
      a: 'Use import type. Since type-only imports are erased from emitted JavaScript, they cannot create circular runtime dependencies. If modules A and B share types but also reference each other\'s values, extract the shared types to a third file (types.ts) that neither A nor B imports values from — only types.ts is imported by both, breaking the cycle.',
    },
    {
      q: 'When should I use `export * from` vs `export { x, y } from`?',
      a: 'Use export * from for barrel files where you want to re-export the entire public surface of a sub-module. Use export { x, y } from when you want to be selective — only exposing specific names from a module. Selective re-exports are better for large libraries where you want explicit control over the public API surface. export * can accidentally re-export internal implementation details.',
    },
    {
      q: 'What is `import.meta` and when do I use it?',
      a: 'import.meta is a meta-property available inside ES modules — it provides module-specific metadata. import.meta.url is the URL of the current module (useful in Node.js for finding files relative to the current module instead of using __dirname). Vite extends it with import.meta.env for environment variables (import.meta.env.VITE_API_URL) and import.meta.hot for HMR. It is only available in ESM, not in CommonJS.',
    },
    {
      q: 'How do I make a TypeScript library work with both CJS and ESM consumers?',
      a: 'Dual-publish: compile two output formats and expose them via the package.json exports map. The exports map has a "import" condition for ESM and a "require" condition for CJS: { ".": { "import": "./dist/esm/index.js", "require": "./dist/cjs/index.cjs", "types": "./dist/types/index.d.ts" } }. Build tools like tsup or unbuild automate this. Consumers get the right format based on how they import your library.',
    },
    {
      q: 'Does TypeScript\'s `paths` config affect the compiled output?',
      a: 'No. TypeScript paths aliases are purely a type-checking feature — they tell the TypeScript compiler where to look for type information when resolving an aliased import like @app/services. The emitted JavaScript still contains the literal import string. The bundler or runtime must independently resolve it. Always configure your bundler (Vite, webpack, esbuild) with the same aliases as your tsconfig paths.',
    },
    {
      q: 'What is the difference between `declare module` for augmentation vs for ambient modules?',
      a: 'If the file containing declare module has at least one import or export (making it a module), the declare module block augments an existing module\'s types — merging with the library\'s existing declarations. If the file has no imports or exports (a script file), declare module creates an ambient module — replacing the library\'s types or declaring types for a JS-only library with no types. The import "express" line at the top of augmentation files is the signal that switches to augmentation mode.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ES modules (import/export, static, tree-shakable) are the modern standard — TypeScript compiles to whatever format module specifies. Use import type for type-only imports, named exports over defaults for libraries, and avoid namespaces. Module augmentation extends third-party types; package.json exports maps control subpath access.',
    mustKnow: [
      'ES modules: static import/export; CommonJS: dynamic require() — TypeScript can emit either',
      'import type: erased from JS output — no runtime dep; required with isolatedModules: true',
      'Named exports preferred over default — explicit, refactor-friendly, tree-shakable',
      'Barrel index.ts: clean imports but slows TS compilation in large apps — use selectively',
      'Module augmentation: import the module first, then declare module — without import it replaces types',
      'namespace is legacy — use ES modules instead in all modern TypeScript code',
      'package.json exports map: controls what subpaths are accessible; respected by bundler/node16/nodenext',
    ],
    interviewFocus: [
      'What is the difference between ES modules and CommonJS?',
      'What does import type do and why is it important with isolatedModules?',
      'Why are named exports preferred over default exports in library code?',
      'How do you augment a third-party type like Express Request — what is the critical requirement?',
      'What problem does export * from in barrel files cause in large TypeScript projects?',
    ],
  };
}
