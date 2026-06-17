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
  selector: 'app-ts-tsconfig',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './tsconfig.html',
  styleUrl: './tsconfig.scss',
})
export class TsTsconfig {
  quickRef: QuickRefItem[] = [
    { name: 'target',              type: 'keyword', desc: 'JS version emitted: "ES2022", "ESNext" — affects which features are down-compiled' },
    { name: 'lib',                 type: 'keyword', desc: 'Type definitions available at compile time: "ES2022", "DOM", "DOM.Iterable"' },
    { name: 'module',              type: 'keyword', desc: 'Output module format: "NodeNext", "ESNext", "CommonJS"' },
    { name: 'moduleResolution',    type: 'keyword', desc: '"bundler" (TS 5), "node16", "nodenext" — how imports are resolved' },
    { name: 'strict',              type: 'keyword', desc: 'Enables strictNullChecks, noImplicitAny, strictFunctionTypes, and 5 others' },
    { name: 'noEmit',              type: 'keyword', desc: 'Type-check without emitting files — ideal for CI or bundler-managed builds' },
    { name: 'paths',               type: 'keyword', desc: 'Module aliases: "@app/*" → ["./src/app/*"] — must mirror bundler config' },
    { name: 'composite',           type: 'keyword', desc: 'Enable TypeScript project references — required for incremental monorepo builds' },
    { name: 'incremental',         type: 'keyword', desc: 'Write a .tsbuildinfo cache to speed up subsequent builds' },
    { name: 'isolatedModules',     type: 'keyword', desc: 'Each file is a standalone module — required by esbuild/Vite/Babel transpilers' },
    { name: 'baseUrl',             type: 'keyword', desc: 'Root for non-relative imports — usually "." or "./src"' },
    { name: 'skipLibCheck',        type: 'keyword', desc: 'Skip type-checking .d.ts files — speeds up build but misses third-party errors' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'tsconfig.json structure — files, include, exclude, extends',
      points: [
        'A <code>tsconfig.json</code> file has four top-level keys that control which files TypeScript processes: <code>files</code> (explicit list), <code>include</code> (glob patterns), <code>exclude</code> (glob patterns to skip from include), and <code>extends</code> (inherit from another config). <code>compilerOptions</code> holds the compiler flags.',
        '<code>extends</code> lets you share a base config across packages. The child config inherits all settings and can override any key. Community bases like <code>@tsconfig/recommended</code> provide sensible defaults.',
        '<code>include</code> defaults to all <code>**/*.ts</code> files in the project directory. Set it explicitly to avoid accidentally including test configs, dist folders, or build artifacts. <code>exclude</code> defaults to <code>node_modules</code>, <code>outDir</code>, and the TypeScript lib files.',
        'The <code>files</code> array is for small projects with specific entry points. For most projects, use <code>include</code> with glob patterns instead.',
      ],
    },
    {
      heading: 'target, lib, and module — the three output levers',
      points: [
        '<code>target</code> controls what JavaScript syntax TypeScript emits. <code>"ES2022"</code> means TypeScript will emit modern syntax (class fields, optional chaining, etc.) and only downcompile features newer than ES2022. Set this to match the oldest environment you support.',
        '<code>lib</code> controls what global type definitions are available at compile time. <code>"DOM"</code> adds browser globals (<code>document</code>, <code>window</code>). <code>"ES2022"</code> adds <code>Promise.allSettled</code>, <code>Array.at()</code>, etc. <code>lib</code> does not affect the emitted code — it is purely a type-checking concern.',
        '<code>module</code> controls the module format in the emitted JavaScript. Use <code>"NodeNext"</code> or <code>"ESNext"</code> for modern projects. <code>"CommonJS"</code> for Node.js without native ESM. When using a bundler (Vite, webpack, esbuild), you typically set <code>module: "ESNext"</code> and let the bundler handle the format.',
        'A common trap: setting <code>target: "ES5"</code> but forgetting that <code>lib</code> defaults to match — so Promise types are not available. Always set <code>lib</code> explicitly when using a non-default target.',
      ],
    },
    {
      heading: 'moduleResolution — how TypeScript finds imports',
      points: [
        '<code>"node"</code> (the old default): simulates Node.js CommonJS resolution. Does not support <code>exports</code> field in package.json. Avoid for new projects.',
        '<code>"node16"</code> / <code>"nodenext"</code>: full Node.js ESM/CJS resolution including <code>package.json#exports</code>. Requires explicit <code>.js</code> extensions in relative imports (because Node.js does). Pair with <code>module: "Node16"</code>.',
        '<code>"bundler"</code> (TypeScript 5.0+): designed for projects that use Vite, esbuild, webpack, or similar. Does not require file extensions. Resolves <code>package.json#exports</code> and <code>#imports</code>. The recommended setting for bundler-based projects.',
        '<code>"classic"</code>: the original TypeScript resolution. Only use this when you have to support very old code. Avoid entirely in new projects.',
      ],
    },
    {
      heading: 'strict mode — what it actually enables',
      points: [
        '<code>strict: true</code> is shorthand for enabling eight compiler flags at once: <code>strictNullChecks</code>, <code>noImplicitAny</code>, <code>strictFunctionTypes</code>, <code>strictBindCallApply</code>, <code>strictPropertyInitialization</code>, <code>strictBuiltinIteratorReturn</code>, <code>noImplicitThis</code>, and <code>alwaysStrict</code>.',
        '<code>strictNullChecks</code> is the most impactful: <code>null</code> and <code>undefined</code> are no longer assignable to any type by default. Every nullable value must be explicitly typed as <code>string | null</code> or guarded before use.',
        '<code>noImplicitAny</code> forces every untyped parameter or variable to have an explicit type annotation. Without it, TypeScript silently infers <code>any</code> for unannotated parameters.',
        'Additional flags worth knowing beyond strict: <code>noUncheckedIndexedAccess</code> (array/Record access returns <code>T | undefined</code>), <code>exactOptionalPropertyTypes</code> (optional property cannot be set to <code>undefined</code> explicitly), <code>noImplicitReturns</code> (all code paths must return a value).',
      ],
    },
    {
      heading: 'paths, baseUrl, and module aliases',
      points: [
        '<code>paths</code> defines import aliases: <code>"@app/*": ["./src/app/*"]</code>. TypeScript uses these for type resolution. However, <code>paths</code> is a TypeScript-only feature — it does NOT affect the emitted JavaScript.',
        'This means your bundler (Vite, webpack, esbuild) or Node.js runner (ts-node, tsx) also needs the same alias configured. Forgetting this is the most common "it works in TS but breaks at runtime" bug with paths.',
        '<code>baseUrl</code> sets the root directory for non-relative imports. Setting <code>baseUrl: "."</code> lets you write <code>import { x } from "src/utils"</code> instead of <code>"../../utils"</code>. <code>paths</code> entries are resolved relative to <code>baseUrl</code>.',
        'In Angular, the Angular CLI automatically mirrors tsconfig paths in the webpack config. In Vite, use the <code>vite-tsconfig-paths</code> plugin. In Next.js, it is handled automatically.',
      ],
    },
    {
      heading: 'composite, incremental, and project references',
      points: [
        '<code>composite: true</code> enables TypeScript project references. It requires <code>declaration: true</code> and <code>declarationMap: true</code>. Each package in a monorepo becomes its own TypeScript project, and the compiler only rebuilds packages that changed.',
        '<code>incremental: true</code> writes a <code>.tsbuildinfo</code> file that caches the previous build result. On subsequent builds, TypeScript only reprocesses changed files. This can reduce CI type-check time by 60-80% on large projects.',
        '<code>isolatedModules: true</code> is required when your transpiler processes files individually without knowledge of other files (esbuild, Babel, Vite, SWC). It bans features that require cross-file analysis: <code>const enum</code> (must use a regular enum), <code>namespace</code> exports (must use ES modules), and type-only imports without the <code>type</code> keyword.',
        'The <code>tsc --build</code> (or <code>tsc -b</code>) command is the project-references-aware build. Use it instead of plain <code>tsc</code> in monorepos.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Recommended tsconfigs by context',
      language: 'typescript',
      code: `// Browser app with Vite/esbuild
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "paths": { "@app/*": ["./src/app/*"] }
  },
  "include": ["src"]
}

// Node.js (native ESM, Node 18+)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}

// Node.js (CommonJS, classic)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "outDir": "./dist",
    "esModuleInterop": true
  }
}`,
    },
    {
      label: 'Strict mode sub-flags',
      language: 'typescript',
      code: `// What strict: true actually enables — understanding each flag:

// 1. strictNullChecks — null/undefined are separate types
let name: string = null;          // Error with strictNullChecks
let safeName: string | null = null; // OK

// 2. noImplicitAny — parameters must be typed
function greet(name) { return name; }    // Error: 'name' has implicit type 'any'
function greet2(name: string) { return name; } // OK

// 3. strictFunctionTypes — function parameter types are contravariant
type Handler = (event: MouseEvent) => void;
const h: Handler = (e: Event) => {};  // Error — MouseEvent extends Event, not the other way

// 4. strictPropertyInitialization — class fields must be initialized
class User {
  name: string;     // Error — not definitely assigned
  name2!: string;   // OK — the ! tells TS you're handling init externally
  name3: string = ''; // OK — initialized in declaration
}

// Beyond strict — extra safety:
// noUncheckedIndexedAccess
const arr: string[] = ['a', 'b'];
const first = arr[0]; // type: string | undefined (not just string!)

// exactOptionalPropertyTypes
interface Config { debug?: boolean }
const c: Config = { debug: undefined }; // Error — cannot assign undefined to optional bool
const c2: Config = {};                  // OK — omitting the key is fine
const c3: Config = { debug: true };     // OK

// noImplicitReturns
function classify(n: number): string {
  if (n > 0) return 'positive';
  // Error: not all code paths return a value
}`,
    },
    {
      label: 'moduleResolution comparison',
      language: 'typescript',
      code: `// moduleResolution: "node" (OLD — avoid)
// No package.json exports support
// Works: import from 'lodash'
// Fails silently: package subpath exports (e.g. 'package/feature')

// moduleResolution: "bundler" (TS 5+, RECOMMENDED for bundler projects)
// Supports package.json exports and imports
// No extension requirement on relative imports
import { helper } from './utils';          // OK — no .js needed
import { feature } from 'package/feature'; // OK — resolves via exports map

// moduleResolution: "node16" / "nodenext" (FOR NATIVE NODE ESM)
// Requires .js extension on relative imports:
import { helper } from './utils.js';  // Required for node16/nodenext
// (yes, .js even in .ts files — Node.js runtime requires the .js extension)

// Package.json exports field (respected by node16/nodenext/bundler):
// {
//   "exports": {
//     ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
//     "./utils": "./dist/utils.js"
//   }
// }

// esModuleInterop: true — needed for CommonJS default imports
// Without it:
import * as fs from 'fs';        // Must use namespace import for CJS
// With esModuleInterop: true:
import fs from 'fs';             // Default import works for CJS modules`,
    },
    {
      label: 'paths aliases & monorepo project references',
      language: 'typescript',
      code: `// tsconfig.json — paths aliases (TypeScript only)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*":      ["src/app/*"],
      "@shared/*":   ["src/shared/*"],
      "@env":        ["src/environments/environment"]
    }
  }
}

// vite.config.ts — mirror the paths in the bundler
// import { resolve } from 'path'
// export default defineConfig({
//   resolve: {
//     alias: {
//       '@app':    resolve(__dirname, 'src/app'),
//       '@shared': resolve(__dirname, 'src/shared'),
//       '@env':    resolve(__dirname, 'src/environments/environment'),
//     }
//   }
// })

// Monorepo project references (composite: true)
// Root tsconfig.json:
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" },
    { "path": "./packages/app" }
  ]
}

// packages/core/tsconfig.json:
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}

// packages/app/tsconfig.json — depends on core:
{
  "compilerOptions": { "composite": true },
  "references": [{ "path": "../core" }]
}

// Build all with: tsc --build
// Only rebuilds packages that changed (uses .tsbuildinfo cache)`,
    },
    {
      label: 'CI and build pipeline configs',
      language: 'bash',
      code: `# Type-check without emitting (ideal for CI — bundler handles emit)
# tsconfig.json has: "noEmit": true
npx tsc --noEmit

# Type-check with project references
npx tsc --build --dry     # show what would be rebuilt
npx tsc --build           # incremental build using .tsbuildinfo

# Faster type-check with incremental cache in CI:
# tsconfig.json: "incremental": true, "tsBuildInfoFile": ".cache/.tsbuildinfo"
npx tsc --noEmit --incremental

# Check multiple tsconfigs (e.g. app + tests have different configs):
npx tsc --project tsconfig.app.json --noEmit
npx tsc --project tsconfig.spec.json --noEmit

# tsc watch mode (dev):
npx tsc --watch --noEmit

# Force clean build (delete .tsbuildinfo):
npx tsc --build --clean
npx tsc --build`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting target without setting lib — missing global types',
      wrong: `// tsconfig.json
{ "compilerOptions": { "target": "ES5" } }
// 'lib' defaults to match target=ES5 → no Promise types!
// async/await compiles but Promise is not typed`,
      right: `{ "compilerOptions": {
  "target": "ES5",
  "lib": ["ES2022", "DOM", "DOM.Iterable"]
} }
// lib is purely a type declaration concern — it doesn't affect emitted code
// Set it to what your runtime actually supports, not what target says`,
      explanation: 'lib defaults to match the target setting. Setting target: "ES5" makes lib also ES5-level, removing Promise, Map, Set type definitions. Always set lib explicitly to match what your runtime environment provides.',
    },
    {
      title: 'Using paths aliases without configuring the bundler',
      wrong: `// tsconfig.json: "paths": { "@app/*": ["src/app/*"] }
// Works in type-checking, but at runtime:
import { UserService } from '@app/services/user'; // Module not found!
// Bundler (Vite/webpack/esbuild) doesn't know about TypeScript's paths`,
      right: `// tsconfig.json — for TypeScript type resolution:
// "paths": { "@app/*": ["src/app/*"] }

// vite.config.ts — mirror it:
// resolve: { alias: { '@app': resolve(__dirname, 'src/app') } }

// webpack.config.js — mirror it:
// resolve: { alias: { '@app': path.resolve(__dirname, 'src/app') } }

// Angular CLI: automatically mirrors tsconfig paths in the webpack config`,
      explanation: 'TypeScript paths aliases are purely for the type-checker. The bundler has no knowledge of them. Always configure the same aliases in your bundler. Angular CLI handles this automatically; Vite requires the vite-tsconfig-paths plugin or manual alias config.',
    },
    {
      title: 'Using const enum with isolatedModules: true',
      wrong: `// tsconfig.json: "isolatedModules": true (required by Vite/esbuild)
const enum Direction { Up, Down, Left, Right }
// Error: const enum is not allowed with isolatedModules
// esbuild processes files individually — can't inline const enum values across files`,
      right: `// Use a regular enum instead (works with isolatedModules):
enum Direction { Up, Down, Left, Right }

// Or use an object with as const (fully erasable):
const Direction = { Up: 0, Down: 1, Left: 2, Right: 3 } as const;
type Direction = typeof Direction[keyof typeof Direction];`,
      explanation: 'const enum values are inlined at compile time by reading across files — a cross-file analysis that isolatedModules forbids. Use regular enum or as const objects when isolatedModules: true is required (Vite, esbuild, Babel, SWC).',
    },
    {
      title: 'Setting noEmit: true but also outDir — causes confusion',
      wrong: `{ "compilerOptions": {
  "noEmit": true,
  "outDir": "./dist"
} }
// noEmit: true means NO files are ever written to disk
// outDir is ignored — misleading config`,
      right: `// For bundler-driven projects — type-check only:
{ "compilerOptions": { "noEmit": true } }
// outDir not needed — bundler handles output

// For tsc-emitting projects (no bundler):
{ "compilerOptions": { "outDir": "./dist", "declaration": true } }
// Remove noEmit — you want tsc to emit`,
      explanation: 'noEmit: true tells TypeScript to never write output files. Setting outDir alongside it is a no-op and misleads future readers. Pick one: either let tsc emit (outDir + declaration) or use noEmit for type-check-only mode (bundler handles emit).',
    },
    {
      title: 'Forgetting esModuleInterop for CommonJS default imports',
      wrong: `// Without esModuleInterop: true
import fs from 'fs';    // Error: Module has no default export
import _ from 'lodash'; // Error: Module has no default export`,
      right: `// tsconfig.json: "esModuleInterop": true (also "allowSyntheticDefaultImports": true)
import fs from 'fs';     // Now works
import _ from 'lodash';  // Now works

// What esModuleInterop does:
// Generates helpers that allow CJS modules (module.exports = value)
// to be imported as ES default imports`,
      explanation: 'CommonJS modules use module.exports, not ES module default exports. Without esModuleInterop, TypeScript correctly errors on import X from "cjs-module". Set esModuleInterop: true in tsconfig when working with CJS packages.',
    },
    {
      title: 'Using skipLibCheck: true without understanding the trade-off',
      wrong: `{ "compilerOptions": { "skipLibCheck": true } }
// Skips type-checking ALL .d.ts files including your own declarations
// Version conflicts between @types packages silently pass
// Your own declaration files with errors also silently pass`,
      right: `// Only use skipLibCheck to work around a specific third-party type conflict:
// - Leave it true if your project has conflicting @types packages you can't resolve
// - Set it to false once you've upgraded/pinned conflicting type packages

// Prefer fixing the root cause:
// 1. Upgrade @types/node, @types/react to matching major versions
// 2. Use resolutions in package.json to pin a specific @types version
// 3. Add type overrides with declare module "conflicting-package" {}`,
      explanation: 'skipLibCheck: true is a pragmatic escape hatch for third-party type conflicts. It also silences errors in your own .d.ts files. Understand that you are trading correctness for compilation speed. Set it back to false once the underlying conflict is resolved.',
    },
  ];

  challenge: Challenge = {
    title: 'Audit and fix a broken tsconfig',
    language: 'typescript',
    description: `Given a broken tsconfig.json, identify and fix all the problems. The project is a Vite-based React app using TypeScript, targeting modern browsers (Chrome 100+, Firefox 100+, Safari 15+). It should support @ import aliases, work with the Vite bundler, and be ready for CI type-checking without emitting files.`,
    hints: [
      'Check whether module and moduleResolution are appropriate for a Vite (bundler) project',
      'Verify that lib includes DOM types for a browser app',
      'isolatedModules is required by Vite — is it present?',
      'For CI type-check only mode, what flag prevents tsc from writing files?',
      'Are all paths aligned with what Vite needs?',
    ],
    starterCode: `// BROKEN tsconfig.json — find and fix all problems
// Project: Vite + React + TypeScript, browser app
{
  "compilerOptions": {
    "target": "ES5",
    "lib": ["ES5"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": false,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "node_modules"],
  "exclude": []
}`,
    solution: `// FIXED tsconfig.json for Vite + React + TypeScript
{
  "compilerOptions": {
    // FIX 1: target ES2022 — modern browsers support it; ES5 is unnecessary and
    //         forces TypeScript to down-compile modern syntax (class fields, ??, etc.)
    "target": "ES2022",

    // FIX 2: lib must include DOM for browser globals and modern ES features
    //         ES5 lib has no Promise, Map, fetch, etc.
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // FIX 3: module ESNext for Vite — bundler handles module format
    //         CommonJS is for Node.js, not browser bundles
    "module": "ESNext",

    // FIX 4: moduleResolution "bundler" (TS 5+) for Vite projects
    //         "node" doesn't resolve package.json exports fields
    "moduleResolution": "bundler",

    // FIX 5: strict: true — never ship without it
    "strict": true,

    // FIX 6: noEmit: true — Vite handles bundling; tsc is for type-checking only
    //         outDir is irrelevant when Vite emits; remove it
    "noEmit": true,

    // FIX 7: isolatedModules: true — required by Vite (esbuild processes files individually)
    "isolatedModules": true,

    // FIX 8: jsx needed for React
    "jsx": "react-jsx",

    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  // FIX 9: NEVER include node_modules in include — massively slows the compiler
  //         and types directories are already included via lib
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between `target` and `lib` in tsconfig?',
      options: [
        'They are the same — changing one changes the other',
        'target controls what JS syntax is emitted; lib controls what global types are available for type-checking',
        'lib controls what JS syntax is emitted; target controls what types are available',
        'target controls Node.js compatibility; lib controls browser compatibility',
      ],
      answer: 1,
      explanation: 'target tells TypeScript what JavaScript syntax to emit (down-compiling modern features). lib tells TypeScript what global APIs exist in your runtime environment — it is purely a type-checking concern and does not affect emitted code.',
    },
    {
      q: 'Which moduleResolution setting should you use for a Vite project (TypeScript 5)?',
      options: [
        '"node" — it is the most widely supported',
        '"classic" — the original TypeScript setting',
        '"bundler" — designed for Vite/esbuild projects, supports package.json exports without requiring .js extensions',
        '"node16" — the most modern option',
      ],
      answer: 2,
      explanation: '"bundler" (TypeScript 5.0+) is designed specifically for bundler-based projects. It resolves package.json exports maps, does not require .js extensions on imports, and matches how Vite/esbuild resolve modules at runtime.',
    },
    {
      q: 'Why is `isolatedModules: true` required for Vite/esbuild projects?',
      options: [
        'It makes builds faster by caching results',
        'Vite/esbuild process each file individually without cross-file analysis — isolatedModules: true bans TypeScript features that require cross-file knowledge',
        'It enables tree-shaking in the bundle output',
        'It prevents circular imports',
      ],
      answer: 1,
      explanation: 'Tools like esbuild and Vite transpile each TypeScript file independently (no whole-program analysis). isolatedModules: true makes TypeScript error on code that would only work with full cross-file knowledge — like const enum and type-only namespace re-exports.',
    },
    {
      q: 'If you set paths in tsconfig.json for import aliases, what else must you do?',
      options: [
        'Nothing — TypeScript handles the resolution end-to-end',
        'Add the same aliases to your bundler (Vite resolve.alias, webpack resolve.alias, etc.) — TypeScript paths are type-only',
        'Set baseUrl to "/" for paths to work',
        'Enable allowSyntheticDefaultImports',
      ],
      answer: 1,
      explanation: 'TypeScript paths aliases are only used by the type-checker — they have no effect on the emitted JavaScript or how the bundler resolves modules at runtime. You must configure the identical aliases in your bundler (Vite, webpack, esbuild) or the app will fail at runtime.',
    },
    {
      q: 'What does `strict: true` enable?',
      options: [
        'Only strictNullChecks — the other flags must be enabled separately',
        'All tsconfig flags simultaneously',
        'Eight strictness flags including strictNullChecks, noImplicitAny, strictFunctionTypes, and others',
        'strict: true is deprecated — use individual flags instead',
      ],
      answer: 2,
      explanation: 'strict: true is shorthand for enabling eight specific compiler flags: strictNullChecks, noImplicitAny, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, strictBuiltinIteratorReturn, noImplicitThis, and alwaysStrict.',
    },
    {
      q: 'What is the purpose of `composite: true` in a tsconfig?',
      options: [
        'Enables the TypeScript language server features',
        'Enables TypeScript project references for incremental monorepo builds — only rebuilds changed packages',
        'Combines multiple tsconfig files into one',
        'Makes the build output compatible with both CJS and ESM',
      ],
      answer: 1,
      explanation: 'composite: true enables TypeScript project references. Each package becomes a separate TypeScript project with its own build cache (.tsbuildinfo). Running tsc --build only recompiles packages that have changed, dramatically improving build times in monorepos.',
    },
    {
      q: 'What happens when you set both `noEmit: true` and `outDir: "./dist"` in the same tsconfig?',
      options: [
        'TypeScript emits to ./dist when run in watch mode but not in single-run mode',
        'The outDir is ignored — noEmit: true means no files are ever written to disk',
        'TypeScript writes declaration files to ./dist but not JavaScript',
        'It is an error — TypeScript rejects conflicting options',
      ],
      answer: 1,
      explanation: 'noEmit: true overrides outDir — no files are written regardless of what outDir says. The combination is a no-op and misleading. Use noEmit: true without outDir for type-check-only mode, or use outDir without noEmit when you want tsc to emit files.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the minimal tsconfig for a new TypeScript project?',
      a: 'At minimum: target (ES2022 for modern projects), module and moduleResolution (matched pair — e.g. "NodeNext"/"NodeNext" or "ESNext"/"bundler"), strict: true, and either noEmit: true (if a bundler emits) or outDir (if tsc emits). Add lib explicitly if you need DOM or specific ES features. Everything else can be added as needed.',
    },
    {
      q: 'Why does moduleResolution: "node16" require .js extensions in imports?',
      a: 'Node.js ESM requires explicit file extensions because the runtime does not try multiple extensions when resolving imports. Even though you are writing .ts files, the final runtime resolves .js files. TypeScript\'s node16/nodenext modes accurately model this behavior, so you write import from "./utils.js" and TypeScript resolves it to utils.ts during compilation.',
    },
    {
      q: 'When should I use `skipLibCheck: true`?',
      a: 'Use it as a temporary workaround when conflicting @types packages cause type errors in node_modules that you cannot immediately fix. It is common in large projects with mixed @types/react and @types/node versions. The trade-off: it also silences errors in your own .d.ts files. The right fix is to upgrade/pin the conflicting packages, not to skip lib checking permanently.',
    },
    {
      q: 'What is the difference between `incremental: true` and `composite: true`?',
      a: 'incremental: true writes a .tsbuildinfo cache file for a single project, speeding up subsequent builds by only reprocessing changed files. composite: true enables project references — it requires declaration files and allows one TypeScript project to depend on another, enabling tsc --build to only rebuild changed packages in a monorepo. composite implies incremental.',
    },
    {
      q: 'What is `noUncheckedIndexedAccess` and should I enable it?',
      a: 'noUncheckedIndexedAccess: true makes array index access and Record<string, T> access return T | undefined instead of T. This accurately reflects that array[99] might not exist and dict["missing"] might return undefined. It is not part of strict: true. Enable it on new projects — the extra undefined guards are worth it. On existing codebases it requires fixing many access sites.',
    },
    {
      q: 'How do I type-check a TypeScript project in CI without running the full build?',
      a: 'Add "noEmit": true to compilerOptions and run npx tsc --noEmit in CI. This performs a full type-check without writing any output files — much faster than a full build. For incremental CI checks, also add "incremental": true and cache the .tsbuildinfo file between runs. For monorepos with project references, run npx tsc --build --dry first to see what would rebuild.',
    },
    {
      q: 'Can I have multiple tsconfig files in the same project?',
      a: 'Yes — this is common. A typical pattern: tsconfig.json (base shared settings with noEmit: true), tsconfig.app.json (extends base, adds src/ include, jsx for React), tsconfig.spec.json (extends base, adds test files, looser settings). Angular projects scaffold exactly this pattern. Each config is used by a different tool: tsconfig.app.json by the Angular CLI, tsconfig.spec.json by Jest/Karma.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'tsconfig.json is the TypeScript compiler\'s control panel — target sets the output JS version, lib sets available type definitions, moduleResolution controls import resolution, and strict: true enables 8 strictness flags. For bundler projects (Vite, esbuild), use moduleResolution: "bundler", isolatedModules: true, and noEmit: true.',
    mustKnow: [
      'target = emitted JS syntax; lib = type definitions available — they are independent',
      'strict: true enables 8 flags: strictNullChecks, noImplicitAny, strictFunctionTypes, and more',
      'moduleResolution: "bundler" (TS 5+) for Vite/esbuild; "node16"/"nodenext" for native Node.js ESM',
      'paths aliases are TypeScript-only — bundler must be configured separately with the same aliases',
      'isolatedModules: true required by Vite/esbuild — bans const enum and cross-file features',
      'composite: true enables project references (monorepo incremental builds); implies incremental',
      'noEmit: true — type-check only mode; do not combine with outDir',
    ],
    interviewFocus: [
      'What is the difference between target and lib?',
      'Why must you configure paths aliases in both tsconfig and the bundler?',
      'What does strict: true actually enable — list the flags',
      'When would you use moduleResolution: "bundler" vs "node16"?',
      'What is isolatedModules: true and why does Vite require it?',
    ],
  };
}
