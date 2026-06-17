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
  selector: 'app-ts-declarations',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './declarations.html',
  styleUrl: './declarations.scss',
})
export class TsDeclarations {
  quickRef: QuickRefItem[] = [
    { name: '.d.ts file',          type: 'type',    desc: 'Declaration file — type information only, no JavaScript output' },
    { name: 'declare',             type: 'keyword', desc: 'Ambient declaration — tells TypeScript a value exists at runtime without defining it' },
    { name: 'declare module',      type: 'keyword', desc: 'Adds types for a JS-only library or augments an existing module\'s types' },
    { name: 'declare global',      type: 'keyword', desc: 'Adds to the global scope (Window, globalThis) — must be inside a module file' },
    { name: 'declare namespace',   type: 'keyword', desc: 'Types for libraries that set a global object (e.g. window.jQuery → declare namespace $)' },
    { name: '@types/*',            type: 'type',    desc: 'DefinitelyTyped packages — community-maintained .d.ts files for JS libraries' },
    { name: 'types field',         type: 'keyword', desc: 'tsconfig "types": ["node"] — only include listed @types packages' },
    { name: 'typeRoots',           type: 'keyword', desc: 'tsconfig: directories TypeScript searches for type packages (default: node_modules/@types)' },
    { name: 'triple-slash ref',    type: 'syntax',  desc: '/// <reference types="..." /> — pulls in type declarations from a package or file' },
    { name: 'declaration: true',   type: 'keyword', desc: 'tsconfig: emit .d.ts files alongside JS output — required for publishing a library' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are .d.ts files and why do they exist',
      points: [
        'A <code>.d.ts</code> (declaration file) contains only type information — no runtime JavaScript. When TypeScript encounters an import for a package or file, it looks for a declaration file to understand the types of that module\'s exports. The JavaScript runs normally; the .d.ts file is only for the type-checker.',
        'Declaration files are needed because most JavaScript libraries were written before TypeScript existed and contain no type annotations. The .d.ts file is the bridge: it describes the shape of an existing JavaScript module in pure type syntax.',
        'When you build a TypeScript library with <code>declaration: true</code> in tsconfig, the compiler automatically generates .d.ts files alongside the .js output. Consumers of your library get type information without needing your source TypeScript files.',
        'Two sources of declaration files: (1) included in the package itself under the <code>types</code> or <code>typings</code> field in package.json, and (2) a separate <code>@types/package-name</code> package from DefinitelyTyped.',
      ],
    },
    {
      heading: 'DefinitelyTyped and @types packages',
      points: [
        'DefinitelyTyped is a community repository of declaration files for JavaScript packages that do not include their own types. Install types for a package with: <code>npm install -D @types/lodash</code>. TypeScript automatically picks them up from <code>node_modules/@types</code>.',
        'When a package includes its own types (the <code>package.json</code> has a <code>"types"</code> field pointing to a .d.ts file), no @types package is needed. Examples: TypeScript itself, RxJS, Zod, Prisma. When a package does not ship types, check DefinitelyTyped first before writing your own.',
        'The tsconfig <code>"types": ["node", "jest"]</code> array limits which @types packages are automatically included. Without this, all <code>@types/*</code> packages in node_modules are included — this can cause conflicts when you have both @types/node and @types/browser.',
        '<code>typeRoots</code> overrides the directories TypeScript searches for type packages (default: all <code>node_modules/@types</code> directories). Rarely needed — only for non-standard type locations.',
      ],
    },
    {
      heading: 'Writing ambient declarations — declare keyword',
      points: [
        'The <code>declare</code> keyword creates an ambient declaration: it tells TypeScript that a value exists at runtime without providing an implementation. Use it to type values that are injected by the environment (build tools, CDN scripts, browser APIs not yet in TypeScript\'s lib).',
        '<code>declare const __DEV__: boolean</code> — types a global constant injected by a bundler (webpack DefinePlugin, Vite define). <code>declare function fetch(url: string): Promise<Response></code> — types a global function available in the environment.',
        '<code>declare module "*.svg"</code> — ambient module declaration for file types. This tells TypeScript that importing any .svg file returns a specific type (e.g. string for the URL or a React component). Required for non-JS asset imports in bundlers like Vite or webpack.',
        'Ambient declarations go in <code>.d.ts</code> files (no corresponding .js needed) or in <code>.ts</code> files that are included by tsconfig. They must not have implementations — only type signatures.',
      ],
    },
    {
      heading: 'Authoring declaration files for a library',
      points: [
        'When publishing a TypeScript library: set <code>declaration: true</code> and <code>declarationMap: true</code> in tsconfig. The compiler generates <code>*.d.ts</code> alongside each <code>*.js</code> file, and <code>*.d.ts.map</code> files that link back to the original TypeScript source (allowing "Go to definition" to open .ts rather than .d.ts).',
        'Point consumers to your types via the <code>"types"</code> (or <code>"typings"</code>) field in package.json: <code>"types": "./dist/index.d.ts"</code>. For packages with conditional exports, add <code>"types"</code> inside each exports condition.',
        'Declaration files should not include implementation details — only the public API. Private internals should be excluded from the output. Use <code>stripInternal: true</code> combined with <code>/** @internal */</code> JSDoc comments to exclude specific declarations from the emitted .d.ts.',
        'For hand-written declaration files (typing an existing JS library), prefer the real-world API shape over over-engineering. Start with the most-used parts and add more coverage over time. Overly complex declarations often cause more confusion than simple ones.',
      ],
    },
    {
      heading: 'Triple-slash directives and reference comments',
      points: [
        'Triple-slash directives are single-line comments starting with <code>///</code> that contain XML tags. They were the original way to reference type dependencies before <code>tsconfig.json</code> existed. In modern code, most triple-slash directives are replaced by tsconfig settings.',
        '<code>/// &lt;reference types="node" /&gt;</code> — pulls in the @types/node declarations for the current file. Equivalent to adding "node" to tsconfig <code>"types"</code>. Needed in .d.ts files that reference Node.js globals when the project tsconfig does not include @types/node.',
        '<code>/// &lt;reference path="./other.d.ts" /&gt;</code> — includes another declaration file by path. Used to split large ambient declarations into multiple files and compose them with a root reference file.',
        '<code>/// &lt;reference lib="dom" /&gt;</code> — pulls in TypeScript\'s built-in DOM type definitions. Useful in .d.ts files that need DOM types without requiring consumers to set lib: ["DOM"] in their tsconfig.',
      ],
    },
    {
      heading: 'Declaration merging — extending types across files',
      points: [
        'TypeScript\'s declaration merging allows multiple declarations with the same name to combine into a single type. This is how <code>interface</code> augmentation works: two <code>interface Window</code> declarations in different files merge into one. This is the mechanism behind module augmentation.',
        'Interfaces merge; type aliases do not. <code>interface Foo { a: string }</code> + <code>interface Foo { b: number }</code> = <code>interface Foo { a: string; b: number }</code>. Attempting the same with <code>type Foo</code> is an error.',
        'Class declarations can be merged with namespaces and interfaces — adding static members to a class via a namespace, or adding methods via an interface. This is a rare pattern used by some frameworks.',
        'Function declarations can be merged with namespaces: <code>function parse(s: string): Date</code> merged with <code>namespace parse { export function iso(s: string): Date }</code> allows both <code>parse("...")</code> and <code>parse.iso("...")</code>. Used in jQuery-style APIs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ambient declarations & module wildcards',
      language: 'typescript',
      code: `// src/types/global.d.ts — ambient globals injected by build tools

// Vite/webpack injected globals:
declare const __DEV__: boolean;
declare const __VERSION__: string;
declare const __API_URL__: string;

// Custom global function (polyfill injected via script tag):
declare function trackEvent(name: string, props?: Record<string, unknown>): void;

// ---- Asset module declarations ----
// src/types/assets.d.ts

// Vite: import logoUrl from './logo.svg' → string (asset URL)
declare module '*.svg' {
  const url: string;
  export default url;
}

// React + Vite: import Logo from './logo.svg?react' → React component
declare module '*.svg?react' {
  import type { ComponentType, SVGProps } from 'react';
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// CSS modules: import styles from './App.module.css'
declare module '*.module.css' {
  const styles: Record<string, string>;
  export default styles;
}

// JSON imports (needed when resolveJsonModule: false):
declare module '*.json' {
  const value: unknown;
  export default value;
}`,
    },
    {
      label: 'Writing a .d.ts for a JS library',
      language: 'typescript',
      code: `// Typing a hypothetical JS chart library: "chart-lite"
// File: src/types/chart-lite.d.ts (or node_modules/chart-lite/index.d.ts)

declare module 'chart-lite' {
  export interface ChartOptions {
    type: 'bar' | 'line' | 'pie';
    width?: number;
    height?: number;
    colors?: string[];
    animate?: boolean;
  }

  export interface DataPoint {
    label: string;
    value: number;
  }

  export interface Chart {
    render(container: HTMLElement, data: DataPoint[]): void;
    update(data: DataPoint[]): void;
    destroy(): void;
    on(event: 'click', handler: (point: DataPoint) => void): void;
    on(event: 'hover', handler: (point: DataPoint | null) => void): void;
  }

  // Factory function — the main export
  export function createChart(options: ChartOptions): Chart;

  // Default export is the factory
  export default createChart;
}

// Usage (fully typed):
import createChart from 'chart-lite';
const chart = createChart({ type: 'bar', width: 600 });
chart.render(document.getElementById('chart')!, [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 150 },
]);`,
    },
    {
      label: 'Library output — declaration: true',
      language: 'typescript',
      code: `// Source: src/math.ts
export function add(a: number, b: number): number { return a + b; }
export function multiply(a: number, b: number): number { return a * b; }
export type BinaryOp = (a: number, b: number) => number;

// tsconfig.json: { "declaration": true, "declarationMap": true, "outDir": "./dist" }

// Generated: dist/math.js
// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.multiply = exports.add = void 0;
// function add(a, b) { return a + b; }
// exports.add = add;
// function multiply(a, b) { return a * b; }
// exports.multiply = multiply;

// Generated: dist/math.d.ts  ← consumers use this for types
// export declare function add(a: number, b: number): number;
// export declare function multiply(a: number, b: number): number;
// export type BinaryOp = (a: number, b: number) => number;

// package.json for the library:
// {
//   "main": "./dist/math.js",
//   "types": "./dist/math.d.ts",
//   "exports": {
//     ".": {
//       "import": "./dist/math.js",
//       "require": "./dist/math.cjs",
//       "types": "./dist/math.d.ts"
//     }
//   }
// }

// @internal — excluded from .d.ts with stripInternal: true
/** @internal */
export function _internalHelper(): void { /* never in .d.ts */ }`,
    },
    {
      label: 'Declaration merging & function+namespace',
      language: 'typescript',
      code: `// Interface merging — both declarations merge into one:
interface AppConfig {
  apiUrl: string;
  timeout: number;
}
interface AppConfig { // same file or different file — merges!
  debug?: boolean;
  version: string;
}
// Result: AppConfig has apiUrl, timeout, debug?, version

// Function + namespace merge (jQuery-style):
declare function query(selector: string): QueryResult;
declare namespace query {
  function ajax(url: string): Promise<unknown>;
  const version: string;
  interface QueryResult { /* ... */ }
}
// Allows: query('#app') and query.ajax('/api') and query.version

// Class + namespace merge — add static members:
class EventEmitter {
  emit(event: string): void { /* ... */ }
}
namespace EventEmitter {
  export type Handler = (data: unknown) => void;
  export const defaultMaxListeners = 10;
}
const maxL: number = EventEmitter.defaultMaxListeners; // static
const h: EventEmitter.Handler = (d) => console.log(d); // type

// Module augmentation with interface merging:
// src/types/express-augment.d.ts
import 'express';
declare module 'express' {
  interface Request {
    user?: { id: string; email: string };
    correlationId?: string;
  }
}`,
    },
    {
      label: 'Triple-slash directives',
      language: 'typescript',
      code: `// Triple-slash directives — reference comments at top of file

// 1. Reference a @types package in a .d.ts file:
/// <reference types="node" />
// Equivalent to tsconfig "types": ["node"] but file-scoped

// 2. Reference another .d.ts file by path:
/// <reference path="./vendor-types.d.ts" />
// Used to split declarations across files

// 3. Reference a built-in TypeScript lib:
/// <reference lib="dom" />
// Pulls in DOM type definitions for this file

// Example: a library that works in both browser and Node.js
// types/index.d.ts (the root declaration file for a library):
/// <reference types="node" />       // includes Node.js globals
/// <reference types="web" />        // includes browser globals
/// <reference path="./internal.d.ts" />  // includes internal declarations

export declare function readFile(path: string): Promise<Buffer>;
export declare function fetch(url: string): Promise<Response>;

// Modern approach — avoid triple-slash in src files, use tsconfig instead:
// tsconfig.json: { "types": ["node"] }
// Only use triple-slash in .d.ts files where tsconfig isn't available`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting `declaration: true` when publishing a library',
      wrong: `// tsconfig.json — missing declaration: true
{ "compilerOptions": { "outDir": "./dist", "strict": true } }
// Publishes only .js files — consumers get no type information
// TypeScript treats the package as 'any' unless @types exists`,
      right: `{ "compilerOptions": {
  "outDir": "./dist",
  "strict": true,
  "declaration": true,
  "declarationMap": true,
  "sourceMap": true
} }
// package.json: "types": "./dist/index.d.ts"
// Consumers get full type information from your source`,
      explanation: 'Without declaration: true, tsc emits only JavaScript files. Anyone using your library as a dependency gets no TypeScript types and must either install @types/your-package or write their own declarations. Always set declaration: true when building a library for public consumption.',
    },
    {
      title: 'Putting implementation code in a .d.ts file',
      wrong: `// utils.d.ts — WRONG: has actual implementation
export function add(a: number, b: number): number {
  return a + b; // Error: .d.ts files cannot have implementations
}`,
      right: `// utils.d.ts — type declarations only:
export declare function add(a: number, b: number): number;

// utils.ts — the real implementation (tsc generates utils.d.ts automatically):
export function add(a: number, b: number): number {
  return a + b;
}`,
      explanation: '.d.ts files are declaration-only — they describe what exists, not how it works. TypeScript will error if you include function bodies or variable initializers in a .d.ts file. Only hand-write .d.ts files when you are typing a plain JavaScript library; for TypeScript source files, let the compiler generate .d.ts automatically.',
    },
    {
      title: 'Ambient module declaration accidentally replacing a package\'s types',
      wrong: `// src/types/lodash.d.ts — missing the import!
declare module 'lodash' {
  // This REPLACES all of lodash's types with just this one function!
  export function chunk<T>(arr: T[], size: number): T[][];
}
// All other lodash types are now gone`,
      right: `// Option 1: Augment (add to existing types) — include an import first:
import 'lodash';
declare module 'lodash' {
  // Now this MERGES with existing lodash types
  interface LoDashStatic { myCustomMethod(x: string): string; }
}

// Option 2: If the package has no types at all (no @types/lodash):
// Declare all the parts you use — or install @types/lodash instead
declare module 'lodash' {
  export function chunk<T>(arr: T[], size: number): T[][];
  export function flatten<T>(arr: T[][]): T[];
  // ... etc
}`,
      explanation: 'A bare declare module "package" block without a preceding import replaces all existing types for that module with only what you declare. To augment (add to) existing types, import the module first. To declare types for a package with no types at all, write a full ambient module declaration and consider submitting it to DefinitelyTyped.',
    },
    {
      title: 'Using @types packages that conflict across versions',
      wrong: `// package.json — @types packages from incompatible versions:
{
  "devDependencies": {
    "@types/node": "^14.0.0",   // old
    "@types/react": "^18.0.0"  // uses Node 18+ types internally
  }
}
// Results in: type errors about duplicate identifiers (Buffer, etc.)`,
      right: `// Pin @types/node to a version compatible with your other @types:
{
  "devDependencies": {
    "@types/node": "^20.0.0",   // match your actual Node.js version
    "@types/react": "^18.0.0"
  }
}
// Or scope @types to only what you need in tsconfig:
// { "compilerOptions": { "types": ["node", "react", "react-dom"] } }
// This prevents other @types packages from auto-including`,
      explanation: 'Different @types packages can have incompatible global type declarations. A common conflict is @types/node versions — older versions declare globals that newer versions restructure. Use tsconfig "types" to include only the @types packages your project needs, and keep them at matching major versions.',
    },
    {
      title: 'Not using `declarationMap: true` in a library',
      wrong: `// tsconfig: "declaration": true (but no declarationMap)
// Consumers install your library and ctrl+click a symbol:
// → jumps to the .d.ts file (type stubs only, no code)
// → cannot navigate to the real implementation
// → confusing for contributors and debuggers`,
      right: `// tsconfig: "declaration": true, "declarationMap": true, "sourceMap": true
// Also publish the source maps (or source files) in the package:
// package.json: "files": ["dist", "src"]  ← include source

// Now ctrl+click → jumps to the original .ts source file
// "Go to definition" in IDEs works seamlessly
// Stack traces are readable (sourceMap: true)`,
      explanation: 'declarationMap: true generates .d.ts.map files that link declaration positions back to the original TypeScript source. Without it, "Go to definition" in consumers\' IDEs opens the generated .d.ts stub — technically correct but much less useful than seeing the original code. Always pair declaration: true with declarationMap: true in libraries.',
    },
    {
      title: 'Hand-writing .d.ts files for your own TypeScript source files',
      wrong: `// src/utils.ts — TypeScript source file
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// src/utils.d.ts — HAND-WRITTEN duplicate (don't do this!)
export declare function formatCurrency(amount: number, currency: string): string;`,
      right: `// src/utils.ts — just write the TypeScript source:
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
// tsconfig: "declaration": true → dist/utils.d.ts is auto-generated
// Never write .d.ts files for .ts source files — the compiler does it`,
      explanation: 'Hand-written .d.ts files alongside .ts source files create a maintenance burden — they can drift out of sync with the implementation. TypeScript auto-generates .d.ts files from .ts source when declaration: true is set. Only hand-write .d.ts files for plain JavaScript files that have no TypeScript source.',
    },
  ];

  challenge: Challenge = {
    title: 'Write declaration files for a legacy JS library',
    language: 'typescript',
    description: `The "date-utils" JavaScript library has no types. It exports the following API (from its README):
- \`parseDate(str, format?)\` — parses a string to a Date. format is "ISO" | "US" | "EU" (default "ISO")
- \`formatDate(date, format?)\` — formats a Date to a string. Same format options
- \`addDays(date, days)\` — returns a new Date with days added
- \`diffDays(a, b)\` — returns number of days between two dates (positive if a > b)
- \`DateFormat\` — a type alias for the format strings
- Default export: an object with all four functions

Write the complete .d.ts declaration file for this library.`,
    hints: [
      'Use declare module "date-utils" { } to declare the ambient module',
      'Export a type alias DateFormat for the union of format strings',
      'All functions should have proper parameter types and return types',
      'The default export is an object containing all four functions — type it as an interface or inline object type',
      'Export both named (parseDate, formatDate, etc.) and the default export',
    ],
    starterCode: `// date-utils.d.ts — write your declaration file here

declare module 'date-utils' {
  // TODO: export type DateFormat = ...
  // TODO: export function parseDate(...): ...
  // TODO: export function formatDate(...): ...
  // TODO: export function addDays(...): ...
  // TODO: export function diffDays(...): ...
  // TODO: export default ...
}

// After writing the declarations, this usage should type-check:
import dateUtils, { parseDate, formatDate, addDays, diffDays, type DateFormat } from 'date-utils';

const fmt: DateFormat = 'US';
const d: Date = parseDate('12/25/2024', fmt);
const s: string = formatDate(d, 'EU');
const next: Date = addDays(d, 7);
const diff: number = diffDays(next, d); // 7`,
    solution: `declare module 'date-utils' {
  export type DateFormat = 'ISO' | 'US' | 'EU';

  export function parseDate(str: string, format?: DateFormat): Date;
  export function formatDate(date: Date, format?: DateFormat): string;
  export function addDays(date: Date, days: number): Date;
  export function diffDays(a: Date, b: Date): number;

  interface DateUtils {
    parseDate(str: string, format?: DateFormat): Date;
    formatDate(date: Date, format?: DateFormat): string;
    addDays(date: Date, days: number): Date;
    diffDays(a: Date, b: Date): number;
  }

  const dateUtils: DateUtils;
  export default dateUtils;
}

// Verified usage:
import dateUtils, { parseDate, formatDate, addDays, diffDays, type DateFormat } from 'date-utils';

const fmt: DateFormat = 'US';
const d: Date = parseDate('12/25/2024', fmt);            // Date
const s: string = formatDate(d, 'EU');                   // string
const next: Date = addDays(d, 7);                        // Date
const diff: number = diffDays(next, d);                  // 7

// Also works via default export:
const d2 = dateUtils.parseDate('2024-01-01');
const s2 = dateUtils.formatDate(d2, 'ISO');`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of a .d.ts file?',
      options: [
        'It is a TypeScript file that compiles to JavaScript and types simultaneously',
        'It contains type declarations only — no JavaScript output; tells the type-checker about the shape of existing JS code',
        'It replaces tsconfig.json for type configuration',
        'It is used exclusively for testing TypeScript types',
      ],
      answer: 1,
      explanation: 'A .d.ts file contains only type information — no runtime code. TypeScript uses it to understand the types of an existing JavaScript module without running any code. The JavaScript runs separately; the .d.ts is only consulted during type-checking.',
    },
    {
      q: 'When should you install @types/lodash vs using lodash\'s built-in types?',
      options: [
        'Always install @types/lodash — it is more up to date',
        'Install @types/lodash only when lodash itself does not ship a "types" field in its package.json',
        'Never use @types packages — write your own declarations',
        '@types packages are only for browser environments',
      ],
      answer: 1,
      explanation: 'When a package includes its own types (package.json has a "types" or "typings" field), no @types package is needed — TypeScript uses the bundled declarations automatically. Only install @types/xxx when the package has no built-in types and a DefinitelyTyped package exists.',
    },
    {
      q: 'What does `declarationMap: true` in tsconfig do?',
      options: [
        'Generates a map of all declarations in the project for the language server',
        'Generates .d.ts.map files that link back to the original TypeScript source, enabling "Go to definition" to open .ts instead of .d.ts',
        'Validates that all exported types are documented',
        'Creates a JSON file listing all exported types in the library',
      ],
      answer: 1,
      explanation: 'declarationMap: true generates .d.ts.map files alongside .d.ts files. These maps link each position in the declaration file back to the original TypeScript source. IDEs use them so "Go to definition" opens the actual .ts implementation file rather than the generated .d.ts stub.',
    },
    {
      q: 'What happens if you write `declare module "lodash"` in a .d.ts file without first importing lodash?',
      options: [
        'It augments lodash\'s existing types — adding new members',
        'It creates a type alias for lodash',
        'It replaces all of lodash\'s existing type declarations with only what you write in the block',
        'It causes a TypeScript compilation error',
      ],
      answer: 2,
      explanation: 'Without a preceding import, declare module creates an ambient module declaration that completely replaces the module\'s types. All existing declarations from @types/lodash or lodash\'s built-in types are gone — only what you write in the block remains. Add import "lodash" first to augment instead of replace.',
    },
    {
      q: 'What does the triple-slash directive `/// <reference types="node" />` do?',
      options: [
        'Imports the Node.js runtime into the TypeScript compiler',
        'Adds @types/node type declarations to the current file — equivalent to adding "node" to tsconfig "types" for this file',
        'Requires the file to run in Node.js',
        'Prevents browser-specific types from being available in the file',
      ],
      answer: 1,
      explanation: '/// <reference types="node" /> is a file-level directive that pulls in the @types/node type declarations for the current file, similar to adding "node" to tsconfig "types". Used in .d.ts files that reference Node.js globals when the project tsconfig does not include @types/node.',
    },
    {
      q: 'Can you merge two type aliases with the same name using declaration merging?',
      options: [
        'Yes — type aliases merge just like interfaces',
        'Yes — but only for union types',
        'No — only interfaces support declaration merging; duplicate type aliases are always an error',
        'No — type aliases can only be merged via the intersection operator',
      ],
      answer: 2,
      explanation: 'Declaration merging only works with interfaces (and some combinations with namespaces, classes, and functions). Duplicate type aliases always produce an error — "Duplicate identifier". Use interface when you need a type that can be augmented or merged across files.',
    },
    {
      q: 'Which tsconfig option should you use to prevent all @types packages from being auto-included?',
      options: [
        'skipLibCheck: true',
        'noLib: true',
        '"types": [] — an explicit empty or populated array limits which @types packages are included',
        'typeRoots: []',
      ],
      answer: 2,
      explanation: 'By default, TypeScript includes all @types/* packages found in node_modules. Setting "types": ["node", "jest"] explicitly limits inclusion to only those packages. An empty "types": [] excludes all @types packages. This prevents type conflicts when multiple @types packages declare overlapping globals.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does TypeScript decide which declaration file to use for an import?',
      a: 'TypeScript uses the moduleResolution strategy to find the declaration file. For a package import: it reads the package\'s package.json "types" or "typings" field first; if absent, it looks for index.d.ts in the package root; if still absent, it checks node_modules/@types/package-name. For a relative import, it looks for a .d.ts file alongside the .js file, or uses the .ts source file directly.',
    },
    {
      q: 'When should I write my own .d.ts file vs installing @types/xxx?',
      a: 'Install @types/xxx first — DefinitelyTyped has declarations for thousands of packages and they are maintained by the community. Only write your own .d.ts if: (1) no @types package exists and the library is niche enough that it never will, (2) the @types package is out of date or missing a specific API you need, or (3) you are declaring types for internal assets or build-injected globals (like declare const __DEV__).',
    },
    {
      q: 'What is the difference between `declare const` and `const` in a .d.ts file?',
      a: 'In a .d.ts file, all declarations are automatically ambient — the declare keyword is implied and can be omitted. In a .ts file, declare const says "this value exists at runtime but is not defined here." Without declare, const would require an initializer and would be compiled to JavaScript. The declare keyword suppresses that requirement and signals "this is a type-only declaration."',
    },
    {
      q: 'How do I add types for a CSS module import (e.g. `import styles from "./App.module.css"`)?',
      a: 'Add a wildcard ambient module declaration in a .d.ts file: declare module "*.module.css" { const styles: Record<string, string>; export default styles; }. For more precise types (actual class names), tools like typed-css-modules or vanilla-extract generate specific .d.ts files per CSS file with the exact class name strings as a union type — much more accurate than Record<string, string>.',
    },
    {
      q: 'Should I commit generated .d.ts files to the repository?',
      a: 'For applications (not libraries): no. Generated .d.ts files are build artifacts — add them to .gitignore and regenerate them during CI. For libraries: the published npm package must include them, but whether you commit them depends on your workflow. Many library authors commit the dist/ folder (including .d.ts files) to make npm publishing simpler; others generate them during publish and exclude them from git.',
    },
    {
      q: 'What is `stripInternal: true` and when do I use it?',
      a: 'stripInternal: true removes declarations marked with /** @internal */ from the generated .d.ts files. This lets you mark helper functions or types as internal implementation details — they are still usable within your library\'s source but are not visible to consumers in their type definitions. Use it to keep your public API surface clean while still using typed internal helpers.',
    },
    {
      q: 'How do I type a library that exports both a function and properties on that function (jQuery pattern)?',
      a: 'Use declaration merging: declare the function, then declare a namespace with the same name to add properties. Example: declare function $(selector: string): JQuery; declare namespace $ { function ajax(url: string): JQueryXHR; const fn: JQueryStatic; }. This allows both $(\'#app\') and $.ajax(\'/api\') to type-check correctly. DefinitelyTyped\'s @types/jquery uses exactly this pattern.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Declaration files (.d.ts) contain type information only — no JS output. They describe existing JavaScript for the type-checker. TypeScript auto-generates them from .ts source with declaration: true. Hand-write them for JS-only libraries when @types packages do not exist.',
    mustKnow: [
      '.d.ts = type declarations only, no runtime code — consumed by the type-checker, not the JS engine',
      'declaration: true + declarationMap: true — required for publishing a typed library',
      '@types/xxx: DefinitelyTyped community types — install when a package has no built-in types',
      'declare module "pkg" without an import: replaces types; with import "pkg": augments (merges)',
      'Interfaces merge across declarations; type aliases do not — use interface for extensible types',
      '"types": ["node"] in tsconfig limits which @types packages are auto-included',
      'Triple-slash /// <reference types="xxx" /> pulls in a @types package for a single .d.ts file',
    ],
    interviewFocus: [
      'What is a .d.ts file and when would you write one manually?',
      'What is the difference between declaration merging for interfaces vs type aliases?',
      'How does TypeScript resolve types for an npm package — what fields does it look at?',
      'What does declarationMap: true do and why does it matter for library consumers?',
      'How do you augment a third-party module\'s types without replacing them?',
    ],
  };
}
