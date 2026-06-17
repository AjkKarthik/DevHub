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
  selector: 'app-ts-performance',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './ts-performance.html',
  styleUrl: './ts-performance.scss',
})
export class TsPerformance {
  quickRef: QuickRefItem[] = [
    { name: 'incremental: true',      type: 'keyword', desc: 'Write .tsbuildinfo cache — subsequent builds only reprocess changed files' },
    { name: 'composite: true',        type: 'keyword', desc: 'Project references for monorepos — rebuilds only changed packages' },
    { name: 'isolatedModules: true',  type: 'keyword', desc: 'Each file is transpiled independently — required by esbuild/Vite/SWC for speed' },
    { name: 'skipLibCheck: true',     type: 'keyword', desc: 'Skip type-checking .d.ts files — faster builds, hides third-party type conflicts' },
    { name: 'tsc --noEmit',          type: 'syntax',  desc: 'Type-check only, no output files — faster CI step when bundler handles emit' },
    { name: 'tsc --build',           type: 'syntax',  desc: 'Project-references-aware build — uses .tsbuildinfo cache per package' },
    { name: 'tsbuildinfo',           type: 'type',    desc: 'Incremental build cache file — stores file hashes and type info between builds' },
    { name: 'transpileOnly (ts-node)', type: 'keyword', desc: 'Skip type-checking in ts-node — fast execution for scripts and dev server' },
    { name: 'typeRoots',             type: 'keyword', desc: 'Limit where TypeScript looks for @types — reduces file system I/O on large projects' },
    { name: 'tsc --extendedDiagnostics', type: 'syntax', desc: 'Show timing breakdown per compilation phase — identify where time is spent' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why TypeScript builds slow — understanding the bottlenecks',
      points: [
        'TypeScript performs a full-program analysis: it reads every included file, builds a type graph, resolves all imports, and type-checks across the entire dependency chain. This is fundamentally more expensive than simple transpilation (which reads one file at a time). On large projects (500+ files), a cold build without caching can take minutes.',
        'The two biggest performance levers: (1) <strong>reduce the files TypeScript processes</strong> — narrower <code>include</code>, explicit <code>types</code> array, <code>skipLibCheck</code>. (2) <strong>cache between builds</strong> — <code>incremental: true</code> writes a <code>.tsbuildinfo</code> file that lets subsequent builds skip unchanged files.',
        'TypeScript compilation has three phases: (1) <em>parsing</em> — reads files and builds ASTs; (2) <em>binding</em> — builds the symbol table; (3) <em>type-checking</em> — resolves types and checks assignments. Type-checking is by far the most expensive. Tools like esbuild and SWC skip type-checking entirely — they only parse and emit, so they are 10–100× faster than <code>tsc</code> for transpilation.',
        'Run <code>tsc --extendedDiagnostics</code> to see a timing breakdown: files read, type-check time, emit time, and memory usage. This tells you whether you are spending time on I/O (too many files included) or type-checking (complex types). The diagnosis determines the fix.',
      ],
    },
    {
      heading: 'Incremental builds — tsbuildinfo cache',
      points: [
        '<code>incremental: true</code> writes a <code>.tsbuildinfo</code> file after each build. On the next run, TypeScript reads the cache and reprocesses only files that have changed since the last build (by comparing file hashes). For a 300-file project where you touched 5 files, only those 5 files (plus their dependents) are reprocessed. Build time drops from 30s to 2–3s.',
        'Set <code>tsBuildInfoFile</code> to control where the cache is written: <code>".tsbuildinfo"</code> in the project root, or <code>".cache/.tsbuildinfo"</code> for a cleaner directory. Always add <code>*.tsbuildinfo</code> to <code>.gitignore</code> — it is a build artifact, not source.',
        'In CI: cache the <code>.tsbuildinfo</code> file between runs. GitHub Actions can cache by key (e.g. hash of tsconfig + package-lock). A cache hit gives CI the incremental speedup. A cache miss falls back to a full build. This is often the single highest-impact CI optimization for TypeScript projects.',
        '<code>composite: true</code> extends incremental with project references. Each package in a monorepo has its own <code>.tsbuildinfo</code>. Running <code>tsc --build</code> rebuilds only packages where sources changed. The cache survives across package boundaries — if package A hasn\'t changed, it is not reprocessed even if package B (which depends on A) has changed.',
      ],
    },
    {
      heading: 'Separating type-checking from transpilation',
      points: [
        'The key insight: type-checking and transpilation are separate concerns. Type-checking verifies correctness (slow, needs full program). Transpilation converts TypeScript to JavaScript (fast, single-file). Most modern setups use a fast transpiler for development and run <code>tsc --noEmit</code> separately in CI.',
        'Development server (Vite, Next.js, ts-node with <code>--transpile-only</code>): uses esbuild or SWC to transpile without type-checking. Feedback is instant. Type errors surface in the IDE via the TypeScript language server.',
        'CI pipeline: run <code>tsc --noEmit</code> as a dedicated job. This performs a full type-check without emitting files. A failed type-check blocks the PR. Development is fast; correctness is enforced in CI. This is the gold standard setup.',
        '<code>ts-node</code> by default type-checks before running — slow for scripts. Add <code>--transpile-only</code> (or <code>--swc</code> for even faster execution with SWC) to skip type-checking for development scripts, tests, and tooling. Type-checking is still done in CI.',
      ],
    },
    {
      heading: 'Reducing files TypeScript processes',
      points: [
        'The <code>include</code> array in tsconfig is the first place to look. Be explicit — <code>"include": ["src"]</code> is better than the default (all .ts files everywhere). Accidentally including <code>node_modules</code>, <code>dist</code>, or <code>coverage</code> directories multiplies file count enormously.',
        'The <code>"types": ["node", "jest"]</code> array limits which <code>@types/*</code> packages are auto-included. Without it, all <code>@types</code> packages in <code>node_modules/@types</code> are included — including transitive ones from your dependencies. In a large project, this can add hundreds of .d.ts files.',
        '<code>skipLibCheck: true</code> skips type-checking all <code>.d.ts</code> files — both @types packages and generated declarations. This is a significant speedup since .d.ts files account for a large share of TypeScript\'s I/O. The trade-off: type errors in third-party declarations are silenced.',
        'Large union types and deeply recursive conditional types are the biggest type-system performance killers. A union of 100 string literals or a recursive <code>DeepReadonly</code> type that TypeScript must expand can cause multi-second slowdowns in the language server. Simplify or bound the depth.',
      ],
    },
    {
      heading: 'Project references and monorepo build performance',
      points: [
        'In a monorepo without project references, TypeScript processes every package every time — even packages that did not change. With <code>composite: true</code> and <code>references</code>, each package is its own TypeScript project with its own cache. <code>tsc --build</code> skips packages whose sources and dependencies have not changed.',
        'Project reference setup: each package tsconfig needs <code>composite: true</code>, <code>declaration: true</code>, and <code>declarationMap: true</code>. The root tsconfig has a <code>references</code> array pointing to each package. Consumers reference packages by path, not by their source files — this is the cache boundary.',
        'The <code>tsc --build --watch</code> command watches all referenced packages simultaneously and rebuilds only the packages that changed. This is the recommended dev mode for monorepos — faster than running watch per package.',
        'Tools like Turborepo and Nx build on top of project references, adding remote caching (share build caches across CI machines and developers) and intelligent task scheduling (run tests only for changed packages). For large monorepos, these orchestration layers can reduce CI time from 30 minutes to 5.',
      ],
    },
    {
      heading: 'Language server performance — IDE responsiveness',
      points: [
        'The TypeScript language server (tsserver) runs in your IDE and powers autocomplete, go-to-definition, find-all-references, and inline error reporting. It maintains a type graph in memory and updates it as you type. In large projects, it can become slow or memory-hungry.',
        'Main causes of slow language server: (1) too many files included (check with <code>tsc --listFiles | wc -l</code>), (2) complex recursive types (conditional types or mapped types with high depth), (3) deep barrel chains forcing large re-evaluations on every file change, (4) large union types (100+ members).',
        'Fixes: narrow <code>include</code>, add <code>skipLibCheck: true</code>, simplify complex utility types by using intermediate type aliases (break long type chains into named steps), replace barrel imports with direct imports in heavily-used files.',
        'VS Code\'s "TypeScript: Open TS Server Log" command logs language server performance. Look for operations taking > 200ms. The TypeScript wiki has a detailed guide on profiling with Chrome DevTools attached to the language server process.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Incremental & composite tsconfig',
      language: 'typescript',
      code: `// Single project — incremental build cache:
// tsconfig.json
// {
//   "compilerOptions": {
//     "incremental": true,
//     "tsBuildInfoFile": ".cache/.tsbuildinfo",  ← put cache in .cache/
//     "noEmit": true,
//     "strict": true
//   },
//   "include": ["src"]
// }

// .gitignore — cache is a build artifact:
// .cache/
// *.tsbuildinfo

// Monorepo project references:
// packages/core/tsconfig.json:
// {
//   "compilerOptions": {
//     "composite": true,       ← enables project references
//     "declaration": true,     ← required for composite
//     "declarationMap": true,
//     "outDir": "./dist"
//   }
// }

// packages/app/tsconfig.json — depends on core:
// {
//   "compilerOptions": { "composite": true },
//   "references": [{ "path": "../core" }]   ← use core's .d.ts, not its source
// }

// Root tsconfig.json — orchestrates all packages:
// {
//   "files": [],    ← no files in root (packages have their own tsconfigs)
//   "references": [
//     { "path": "./packages/core" },
//     { "path": "./packages/ui" },
//     { "path": "./packages/app" }
//   ]
// }

// Build commands:
// tsc --build           → incremental build of all packages
// tsc --build --watch   → watch mode, rebuilds only changed packages
// tsc --build --clean   → remove all .d.ts, .js, .tsbuildinfo outputs
// tsc --build --dry     → show what would be rebuilt without building`,
    },
    {
      label: 'Separating type-check from transpile',
      language: 'typescript',
      code: `// package.json scripts — separate concerns:
// {
//   "scripts": {
//     "dev":        "vite",                   ← no type-check, just fast transpile
//     "build":      "vite build",             ← esbuild transpile, no type-check
//     "typecheck":  "tsc --noEmit",           ← type-check only, no output files
//     "typecheck:watch": "tsc --noEmit --watch",
//     "ci":         "tsc --noEmit && vite build && vitest run"
//   }
// }

// ts-node — skip type-checking for scripts:
// npx ts-node --transpile-only script.ts       ← fast, no type-check
// npx ts-node --swc script.ts                 ← fastest, uses SWC transpiler
// npx tsx script.ts                           ← drop-in ts-node replacement, SWC-backed

// Jest config — use ts-jest in transpile-only mode:
// jest.config.js:
// module.exports = {
//   transform: {
//     '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }]
//   }
// }
// isolatedModules: true → each test file transpiled independently (fast)
// Type errors still caught by: npm run typecheck (separate step)

// Vitest — zero config, uses Vite (esbuild) for transpilation:
// vitest runs tests fast with esbuild transpilation
// Add a separate tsc --noEmit step in CI for type safety

// GitHub Actions cache example:
// - uses: actions/cache@v3
//   with:
//     path: .cache/.tsbuildinfo
//     key: tsbuildinfo-\${{ hashFiles('tsconfig.json', 'package-lock.json') }}`,
    },
    {
      label: 'Measuring & diagnosing slow builds',
      language: 'typescript',
      code: `// 1. Get timing breakdown:
// npx tsc --noEmit --extendedDiagnostics
// Output includes:
//   Files:              312          ← how many files processed
//   Lines:              45,231
//   Identifiers:        198,021
//   I/O read time:      0.23s
//   Parse time:         1.45s
//   Bind time:          0.82s
//   Check time:         8.31s       ← type-checking dominates — look for complex types
//   Total time:         11.24s

// 2. List all files TypeScript is processing:
// npx tsc --noEmit --listFiles 2>/dev/null | wc -l
// If the count is much higher than your src files → check include/exclude

// 3. Find which types take longest (TypeScript 4.2+):
// npx tsc --noEmit --generateTrace trace-output/
// Then open trace-output/trace.json in chrome://tracing
// Hover over long spans to see which type or file is slow

// Typical findings and fixes:
// - Large @types/node included unintentionally → add "types": ["node"] to tsconfig
// - 1000+ files from deep barrel chains → import directly from source files
// - Recursive conditional type taking 2s → add depth limit or simplify
// - node_modules/some-package/src included → add to exclude array

// Quick wins to check first:
// 1. Add skipLibCheck: true
// 2. Add "types": ["node"] (or whatever you actually use)
// 3. Explicitly set include: ["src"] instead of relying on defaults
// 4. Check that node_modules, dist, coverage are in exclude
// 5. Enable incremental: true with a cache file`,
    },
    {
      label: 'Complex type performance issues',
      language: 'typescript',
      code: `// Slow: large string literal unions
type HundredColors =
  | 'red' | 'blue' | 'green' | 'yellow' | 'orange'
  // ... 95 more ...
  | 'coral';
// TypeScript checks every assignment against 100 members — language server slows

// Fix: group with Record or limit with string & {}:
const COLORS = ['red', 'blue', 'green'] as const;
type Color = typeof COLORS[number]; // same safety, less TypeScript work

// Slow: deeply recursive types without depth limit
type DeepReadonly<T> =
  T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
// Applied to a deeply nested object — TypeScript expands every level eagerly

// Fix: add a depth counter to bound recursion:
type DeepReadonly<T, D extends number = 5> =
  D extends 0
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K], [-1, 0, 1, 2, 3, 4][D]> }
      : T;

// Slow: deeply nested conditional types
type Extract<A, B, C, D, E> =
  A extends string
    ? B extends number
      ? C extends boolean
        ? D extends object
          ? E extends null ? 'match' : 'no' : 'no'
          : 'no'
        : 'no'
      : 'no'
    : 'no';
// Each nesting level multiplies the type-checking work

// Fix: use named intermediate types to break the chain:
type AIsString<A> = A extends string ? true : false;
type BIsNumber<B> = B extends number ? true : false;
// TypeScript caches named type alias results`,
    },
    {
      label: 'Language server & IDE performance',
      language: 'typescript',
      code: `// VS Code TypeScript language server settings:
// .vscode/settings.json:
// {
//   "typescript.tsserver.maxTsServerMemory": 4096,  ← increase if server OOMs
//   "typescript.tsserver.watchOptions": {
//     "watchFile": "useFsEvents",
//     "watchDirectory": "useFsEvents",
//     "fallbackPolling": "dynamicPriority"
//   }
// }

// Use workspace version of TypeScript (not VS Code's bundled version):
// { "typescript.tsdk": "node_modules/typescript/lib" }
// Ensures IDE uses the same TS version as tsc → consistent errors

// Barrel file performance:
// SLOW — language server re-evaluates entire barrel on any change inside it:
// import { UserService } from '@app/services'; // resolves via index.ts barrel
// Every file in the barrel is re-read to find UserService

// FAST — direct import, only that file is re-read:
// import { UserService } from '@app/services/user.service';

// For large generated files (e.g. GraphQL schema types, Prisma client):
// Put them outside the main tsconfig include if possible:
// { "include": ["src"], "exclude": ["src/generated"] }
// Reference generated types via paths without including the whole file

// Auto-import performance — VS Code "includePackageJsonAutoImports":
// "typescript.preferences.includePackageJsonAutoImports": "off"
// Reduces the set of packages scanned for auto-import suggestions

// Check language server memory usage:
// VS Code → Command Palette → "TypeScript: Open TS Server Log"
// Look for "Memory" lines — if consistently > 2GB, reduce included files`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Including node_modules or dist in the tsconfig include',
      wrong: `// tsconfig.json — accidentally processes thousands of extra files:
{
  "compilerOptions": { "strict": true },
  "include": ["src", "node_modules/@myorg"] // Bad! Processes all source in @myorg
}
// Or no explicit include → defaults to **/*.ts → picks up dist/, coverage/`,
      right: `{
  "compilerOptions": { "strict": true },
  "include": ["src"],                       // explicit, narrow
  "exclude": ["node_modules", "dist", "coverage", "**/*.spec.ts"]
}
// node_modules is excluded by default but be explicit anyway
// dist often contains .ts files from other packages → exclude it`,
      explanation: 'TypeScript defaults to including all .ts files in the project directory. Without an explicit include array, it can accidentally pick up dist/, coverage/, or node_modules sub-packages. Explicitly set include: ["src"] and exclude what you do not want processed. This alone can cut file count by 50–80% on large projects.',
    },
    {
      title: 'Not caching .tsbuildinfo in CI',
      wrong: `# GitHub Actions — rebuilds from scratch every time:
- run: npx tsc --noEmit
# Every CI run processes all 500 files — slow even with incremental: true
# because .tsbuildinfo is discarded between runs`,
      right: `# Cache the tsbuildinfo between CI runs:
- uses: actions/cache@v3
  with:
    path: .cache/.tsbuildinfo
    key: tsbuildinfo-\${{ hashFiles('tsconfig.json', 'package-lock.json') }}
    restore-keys: tsbuildinfo-

- run: npx tsc --noEmit --incremental
# On a cache hit: only changed files processed → 30s → 3s`,
      explanation: 'incremental: true writes a cache file, but that file is lost between CI runs unless you explicitly cache it. Adding a cache step to GitHub Actions (or your CI system) that persists .tsbuildinfo between runs turns a cold 30-second type-check into a warm 3-second one.',
    },
    {
      title: 'Running tsc for transpilation in a bundler project',
      wrong: `// package.json:
// "build": "tsc && rollup -c"
// "dev": "tsc --watch & rollup --watch -c"

// tsc handles both type-checking AND transpilation:
// - Processes all 400 files
// - Type-checks everything
// - Emits .js files
// → 25 seconds for a dev server restart`,
      right: `// "build":  "tsc --noEmit && vite build"   ← type-check + fast bundler emit
// "dev":    "vite"                           ← esbuild transpilation only (no type-check)
// "typecheck": "tsc --noEmit"               ← type-check as a separate step

// In dev: Vite uses esbuild → 50ms HMR
// In CI: tsc --noEmit → full type-check, no output files wasted`,
      explanation: 'tsc is a thorough type-checker but a slow transpiler. Modern bundlers (Vite, esbuild, SWC) transpile TypeScript 10–100× faster by skipping type-checking. Use the bundler for transpilation and run tsc --noEmit separately for type safety. Do not use tsc to emit files when a bundler is doing the job.',
    },
    {
      title: 'Deeply recursive types causing language server freezes',
      wrong: `// Unbounded recursive type — TypeScript expands eagerly:
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
// Applied to a deeply nested config object (10+ levels):
// Language server freezes for 3–5s on every keystroke near this type`,
      right: `// Bound the recursion with a depth counter:
type Prev = [never, 0, 1, 2, 3, 4, 5];
type DeepPartial<T, D extends number = 5> =
  D extends 0
    ? T
    : { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K], Prev[D]> : T[K] };

// Or: use a simpler approach — shallow Partial + explicit nesting for known types:
type PartialConfig = Partial<Config> & {
  database?: Partial<Config['database']>;
  server?: Partial<Config['server']>;
};`,
      explanation: 'Recursive conditional types applied to deeply nested objects cause TypeScript to expand every level eagerly. On complex objects, this is exponential work. Add a depth counter as a second generic parameter to bound the recursion — or restructure to avoid deep recursion altogether by using named intermediate types.',
    },
    {
      title: 'Using ts-node without --transpile-only for development scripts',
      wrong: `// package.json:
// "seed": "ts-node scripts/seed.ts"
// ts-node defaults to full type-checking — same as running tsc first
// A 50-line seed script takes 8 seconds to start because it type-checks the world`,
      right: `// Skip type-checking for development execution:
// "seed":        "ts-node --transpile-only scripts/seed.ts"  ← skip type-check
// "seed:fast":   "tsx scripts/seed.ts"                       ← SWC-backed, fastest
// "seed:typed":  "tsc --noEmit && ts-node scripts/seed.ts"   ← type-check first, then run

// Or use tsx (drop-in ts-node replacement with esbuild):
// npm install -D tsx
// tsx scripts/seed.ts  ← starts in < 500ms instead of 8s`,
      explanation: 'ts-node without --transpile-only performs full type-checking before running your script — the same work as tsc. For development scripts (seeds, migrations, code generators), this is unnecessary. Use --transpile-only or tsx for instant startup. Reserve full type-checking for CI.',
    },
    {
      title: 'Deep barrel chains slowing the language server',
      wrong: `// src/index.ts exports everything from 20 sub-barrels
// Each sub-barrel exports from 10 files
// Result: import { UserService } from '@app' forces TS to resolve 200 files

import { UserService } from '@app';      // slow
import { formatDate }  from '@app';      // slow — same barrel, same cost again`,
      right: `// Import directly from the source file:
import { UserService } from '@app/services/user.service'; // fast
import { formatDate }  from '@app/utils/dates';           // fast

// Keep barrels only for the public surface of a library boundary:
// src/user-module/index.ts — only the external API
export { UserService } from './user.service';
export type { User, CreateUserDto } from './user.model';
// Internal files within the module: import directly (no barrel)`,
      explanation: 'Deep barrel chains cause the TypeScript language server to re-evaluate hundreds of module files whenever any file in the chain changes. This creates stuttering autocomplete and slow "go to definition". Use direct imports inside the app; reserve barrel files for genuine library API surfaces only.',
    },
  ];

  challenge: Challenge = {
    title: 'Audit and optimize a slow TypeScript project setup',
    language: 'typescript',
    description: `You have been given a tsconfig.json and package.json from a slow TypeScript project (400 files, 45-second type-check on CI). Identify all performance problems and write the optimized versions of both files. The project uses Vite for bundling and Vitest for testing.`,
    hints: [
      'Check what files are included — is include explicit? Are dist/coverage excluded?',
      'Is incremental: true set? Is the tsbuildinfo file cached in CI?',
      'Should tsc be emitting files if Vite handles bundling?',
      'Are all @types packages included by default or scoped with "types": [...]?',
      'Look at the dev/build/test scripts — which ones are running tsc unnecessarily?',
    ],
    starterCode: `// SLOW tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "outDir": "./dist"
  }
}

// SLOW package.json scripts:
{
  "scripts": {
    "dev":   "tsc --watch",
    "build": "tsc",
    "test":  "tsc && vitest run"
  }
}

// Also: no .gitignore entries for build artifacts
// And: GitHub Actions runs: npx tsc with no caching`,
    solution: `// OPTIMIZED tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2022",               // FIX 1: match modern browsers
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",               // FIX 2: ESNext for Vite
    "moduleResolution": "bundler",    // FIX 3: bundler resolution for Vite
    "strict": true,
    "noEmit": true,                   // FIX 4: Vite emits — tsc just type-checks
    "incremental": true,              // FIX 5: cache between builds
    "tsBuildInfoFile": ".cache/.tsbuildinfo",
    "skipLibCheck": true,             // FIX 6: don't type-check .d.ts files
    "types": ["node", "vitest/globals"], // FIX 7: only include needed @types
    "isolatedModules": true           // FIX 8: required by Vite/esbuild
  },
  "include": ["src"],                 // FIX 9: explicit narrow include
  "exclude": ["node_modules", "dist", "coverage", ".cache"]
}

// OPTIMIZED package.json scripts:
{
  "scripts": {
    "dev":         "vite",                    // FIX 10: Vite dev server (esbuild transpile)
    "build":       "tsc --noEmit && vite build",  // type-check then bundle
    "typecheck":   "tsc --noEmit",            // type-check only (for CI / watch)
    "typecheck:w": "tsc --noEmit --watch",
    "test":        "vitest run",              // FIX 11: no tsc needed — Vite transpiles
    "ci":          "tsc --noEmit && vitest run"
  }
}

// .gitignore additions:
// .cache/
// *.tsbuildinfo

// GitHub Actions optimization:
// - uses: actions/cache@v3
//   with:
//     path: .cache/.tsbuildinfo
//     key: ts-\${{ hashFiles('tsconfig.json', 'package-lock.json') }}
// - run: npx tsc --noEmit  ← uses cached .tsbuildinfo for incremental speedup`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `incremental: true` in tsconfig do?',
      options: [
        'Makes TypeScript skip unchanged files without any cache file',
        'Writes a .tsbuildinfo cache file — subsequent builds reprocess only changed files and their dependents',
        'Enables project references for monorepos',
        'Gradually applies strict mode over time',
      ],
      answer: 1,
      explanation: 'incremental: true writes a .tsbuildinfo file containing file hashes and type information. On subsequent builds, TypeScript compares file hashes to the cache and only reprocesses files that changed (and their dependents). This can reduce build time from 30s to 2–3s for projects with partial changes.',
    },
    {
      q: 'What is the recommended setup for type-checking in a Vite project?',
      options: [
        'Set tsc as the dev server — it is more accurate than Vite',
        'Use Vite for fast transpilation during dev, run tsc --noEmit as a separate CI step for type safety',
        'Use ts-loader with webpack — more compatible than esbuild',
        'Disable type-checking in Vite — rely on runtime errors to catch type bugs',
      ],
      answer: 1,
      explanation: 'The optimal split: Vite uses esbuild for instant transpilation during development (no type-checking). A separate tsc --noEmit step in CI provides full type-safety enforcement. This gives the fastest dev experience while ensuring type correctness blocks bad PRs.',
    },
    {
      q: 'Which command shows a timing breakdown of TypeScript compilation phases?',
      options: [
        'tsc --verbose',
        'tsc --profile',
        'tsc --extendedDiagnostics',
        'tsc --timing',
      ],
      answer: 2,
      explanation: 'tsc --extendedDiagnostics prints a detailed timing breakdown: files read, parse time, bind time, check time, emit time, and memory usage. The check time line tells you how much type-checking costs; the files count tells you if too many files are being processed.',
    },
    {
      q: 'Why do deeply nested barrel files (index.ts chains) slow the language server?',
      options: [
        'Barrel files disable incremental builds for their directory',
        'The language server must resolve and evaluate all modules a barrel re-exports — potentially hundreds of files — on every file change in the chain',
        'Barrel files create circular imports that TypeScript must detect',
        'index.ts files are given lower priority by the TypeScript language server',
      ],
      answer: 1,
      explanation: 'When you import from a barrel, the TypeScript language server must resolve every module that barrel re-exports (including sub-barrels) to find the symbol you want. A deep chain of barrels can force re-evaluation of hundreds of files whenever any file in the chain changes — causing stuttering autocomplete.',
    },
    {
      q: 'What is the difference between `composite: true` and `incremental: true`?',
      options: [
        'They are the same — composite implies incremental',
        'incremental: caches one project between builds; composite: enables multi-package project references so each package has its own cache and rebuilds independently',
        'composite is for CI; incremental is for local development',
        'incremental requires composite to work',
      ],
      answer: 1,
      explanation: 'incremental: true adds a build cache (.tsbuildinfo) to a single TypeScript project — subsequent builds skip unchanged files. composite: true builds on this for monorepos: each package becomes its own TypeScript project with its own cache, and tsc --build rebuilds only packages whose sources or dependencies changed.',
    },
    {
      q: 'When should you use `ts-node --transpile-only`?',
      options: [
        'When you want to skip all type checking permanently',
        'For development scripts, seeds, and tooling where fast startup matters — type safety is still enforced separately in CI',
        'Only in production — type checking is needed for development',
        'Only when your TypeScript version is below 4.0',
      ],
      answer: 1,
      explanation: '--transpile-only makes ts-node skip type-checking and just transpile — startup goes from 8s to < 500ms. Use it for development scripts, database seeds, code generators, and similar tooling where fast startup matters. Type-checking still runs in CI via tsc --noEmit.',
    },
    {
      q: 'What is the main risk of `skipLibCheck: true`?',
      options: [
        'TypeScript skips checking your source files as well',
        'It causes type errors in third-party .d.ts files to be silenced — including in your own generated declaration files',
        'It prevents @types packages from being used',
        'It breaks incremental builds',
      ],
      answer: 1,
      explanation: 'skipLibCheck: true tells TypeScript to skip type-checking all .d.ts files — both @types packages and generated declaration files from your own packages. This hides real type errors in third-party packages AND in your own library\'s .d.ts output. Use it as a pragmatic trade-off when conflicting @types packages cause noise, not as a permanent setting.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find out which files TypeScript is processing and why there are so many?',
      a: 'Run tsc --noEmit --listFiles 2>/dev/null to see every file TypeScript includes. Pipe it through wc -l for the count. If the count is much higher than your source files, check: (1) whether include is explicit or defaulting to **/*.ts, (2) whether dist/ or coverage/ is accidentally included, (3) whether a deep barrel chain is pulling in many modules indirectly. Also run tsc --traceResolution to see why specific files were included.',
    },
    {
      q: 'Should I commit .tsbuildinfo files to the repository?',
      a: 'No — add .tsbuildinfo (or your tsBuildInfoFile path) to .gitignore. The cache is a build artifact that is machine-specific and can be regenerated. Committing it causes unnecessary merge conflicts and bloats the repository. In CI, cache it between runs using your CI provider\'s caching mechanism (GitHub Actions cache, GitLab cache, CircleCI cache).',
    },
    {
      q: 'What is `generateTrace` and when should I use it?',
      a: 'tsc --noEmit --generateTrace ./trace-output writes a JSON trace file compatible with Chrome\'s tracing tool (chrome://tracing). Load the trace to see a flame graph of compilation time — which types or files are taking the longest. Use it when extendedDiagnostics shows high check time (> 10s) and you need to identify the specific type or file causing the slowdown. It is a power-user diagnostic tool, not something needed routinely.',
    },
    {
      q: 'How much faster is esbuild/SWC than tsc for transpilation?',
      a: 'Roughly 10–100× faster. tsc on a 300-file project might take 15–30 seconds. esbuild transpiles the same project in 100–500ms. The difference is that esbuild and SWC skip type-checking entirely — they parse TypeScript syntax and strip types without building a type graph. For hot module replacement in development, esbuild\'s speed is the reason Vite\'s HMR is nearly instant.',
    },
    {
      q: 'What is Turborepo and how does it relate to TypeScript project references?',
      a: 'Turborepo is a monorepo build system that adds remote caching and intelligent task scheduling on top of project references. TypeScript project references (tsc --build) determine what to rebuild locally based on changed packages. Turborepo adds: (1) remote cache — if a teammate already built the same commit, you get their cached output; (2) task graph — runs type-check, test, and build in the right order in parallel. Together they can reduce CI time from 30 minutes to 3–5 minutes on large monorepos.',
    },
    {
      q: 'Can I use SWC instead of esbuild for TypeScript transpilation?',
      a: 'Yes — SWC (Speedy Web Compiler) is a Rust-based TypeScript/JavaScript compiler that is comparable to esbuild in speed. ts-node has a --swc flag, Jest has @swc/jest, and Next.js uses SWC by default since v12. SWC tends to have better Babel compatibility (same plugins) while esbuild has a smaller API surface. Both skip type-checking — they are transpilation tools only.',
    },
    {
      q: 'How do I speed up the TypeScript language server in VS Code specifically?',
      a: 'Key steps: (1) Use the workspace TypeScript version (typescript.tsdk: "node_modules/typescript/lib"). (2) Increase max memory if needed ("typescript.tsserver.maxTsServerMemory": 4096). (3) Replace barrel imports with direct imports in frequently-edited files. (4) Set skipLibCheck: true if not already set. (5) Use watchOptions with useFsEvents for file system watching. (6) Run "TypeScript: Open TS Server Log" to see which operations are slow — the log timestamps operations and reveals bottlenecks.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript build performance: incremental: true caches unchanged files; composite: true scales to monorepos; noEmit: true separates type-checking from transpilation (use esbuild/Vite for speed). Skip lib checking, narrow include, cache .tsbuildinfo in CI — and avoid deep barrel chains that slow the language server.',
    mustKnow: [
      'incremental: true writes .tsbuildinfo — subsequent builds skip unchanged files',
      'composite: true enables project references — each package caches independently with tsc --build',
      'noEmit: true + Vite/esbuild: fast transpile in dev; tsc --noEmit in CI for type-safety',
      'tsc --extendedDiagnostics: see files processed, parse time, check time — diagnose bottlenecks',
      'ts-node --transpile-only / tsx: skip type-checking for dev scripts (500ms vs 8s startup)',
      'Cache .tsbuildinfo in CI (GitHub Actions cache) — warm incremental build vs cold full build',
      'Deep barrel chains slow the language server — import directly from source files in the app',
    ],
    interviewFocus: [
      'How does incremental: true speed up TypeScript builds?',
      'What is the difference between composite and incremental?',
      'How would you set up a Vite project for fast development AND type safety?',
      'Why do deep barrel chains slow the TypeScript language server?',
      'What command do you run to diagnose slow TypeScript compilation?',
    ],
  };
}
