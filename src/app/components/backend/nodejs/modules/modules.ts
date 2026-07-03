import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-modules',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './modules.html',
  styleUrl: './modules.scss'
})
export class NodeModules {
  quickRef: QuickRefItem[] = [
    { name: 'require()', type: 'function', desc: 'CommonJS: synchronously loads a module. Cached after first load.' },
    { name: 'module.exports', type: 'keyword', desc: 'CJS: the object returned by require(). Can be any JS value.' },
    { name: 'exports', type: 'keyword', desc: 'CJS shorthand for module.exports — safe to add properties, not reassign.' },
    { name: 'import/export', type: 'syntax', desc: 'ES Modules (ESM): static imports, top-level await, tree-shakeable.' },
    { name: '"type":"module"', type: 'keyword', desc: 'In package.json — makes .js files ESM. Omit for CJS default.' },
    { name: '.mjs / .cjs', type: 'keyword', desc: 'Force ESM (.mjs) or CJS (.cjs) regardless of package.json type field.' },
    { name: '__dirname / __filename', type: 'keyword', desc: 'CJS globals for file path. Not available in ESM — use import.meta.url.' },
    { name: 'import.meta.url', type: 'keyword', desc: 'ESM equivalent of __filename. Use with fileURLToPath() for __dirname.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CommonJS vs ES Modules',
      points: [
        'CommonJS (CJS): require() is synchronous, module.exports is the public API. Created before JavaScript had a standard module system. Still the default in Node.js when no "type":"module" in package.json.',
        'ES Modules (ESM): import/export is the JavaScript standard. Imports are static (analyzed before running), allowing tree-shaking. import() dynamic import is async (returns a Promise). Node.js supports ESM natively since v12.',
        'Key differences: CJS require() is synchronous and can be conditional; ESM static imports cannot. CJS modules have __dirname/__filename; ESM uses import.meta.url. ESM supports top-level await; CJS does not.',
        'Interop: CJS can require() a CJS module. ESM can import CJS with import x from "./cjs-mod.cjs". CJS cannot require() an ESM module — use dynamic import() instead.',
      ]
    },
    {
      heading: 'Module Caching and Circular Dependencies',
      points: [
        'Node.js caches modules after the first require(). Calling require("./foo") twice returns the same object. This is why service singletons work — a module initialized once is shared across all importers.',
        'Circular dependencies: A requires B, B requires A. Node.js handles this by returning the partial exports of the module that is still loading. This can lead to undefined values if the dependency is used before the module finishes initializing.',
        'Cache invalidation: delete require.cache[require.resolve("./mod")] forces a reload. Used in testing or hot-reload dev tools, rarely in production.',
        'ESM does not use require.cache. ESM modules are evaluated once and their live bindings (exported values) update automatically when the original changes — unlike CJS which exports snapshots.',
      ]
    },
    {
      heading: 'Package.json Module Fields',
      points: [
        '"type":"module" makes all .js files in the package ESM. Use "type":"commonjs" (or omit) for CJS default.',
        '"exports" field replaces "main": defines precise public entry points, supports conditional exports (node, browser, import, require, default conditions), and blocks access to internal files.',
        '"main" (legacy): entry point for CJS require(). "module" (bundlers only): ESM entry for bundlers like webpack/rollup — Node.js ignores this field.',
        'Dual CJS/ESM packages: publish both with the "exports" field mapping "require" to the .cjs build and "import" to the .mjs build. This lets the same package work in CJS and ESM projects.',
      ]
    },
    {
      heading: 'CommonJS vs ES Modules — Practical Differences',
      points: [
        'CommonJS require() is synchronous and resolves at the call site, allowing conditional or dynamic requires (require(condition ? "a" : "b")) anywhere in code. ES Modules import is statically analyzed at parse time, always hoisted to the top regardless of where written in source.',
        'Static analysis of ES Modules enables tree-shaking (bundlers can determine exactly which exports are actually used and eliminate the rest from the final bundle) — something CommonJS\'s dynamic require() cannot reliably support.',
        'Node.js determines module format from package.json\'s "type" field (module for ESM, commonjs or absent for CJS) or file extension (.mjs always ESM, .cjs always CommonJS) — mixing conventions inconsistently within a project is a common source of confusing import errors.',
        'Top-level await is only available in ES Modules — a CommonJS module cannot await at the top level of the file, only inside an async function, which is one practical reason some newer libraries require ESM.',
      ]
    },
    {
      heading: 'Interoperability Between CJS and ESM',
      points: [
        'An ES Module can import a CommonJS package (most npm packages still ship CJS) via default import interop — Node.js wraps the CJS module.exports as the default export automatically in most cases.',
        'A CommonJS file cannot directly require() an ESM-only package — dynamic import() (which returns a Promise) is required instead, since ESM modules cannot be loaded synchronously.',
        'Dual-package hazard: a package published in both CJS and ESM formats can accidentally load two separate copies of itself if a project imports it via both require() and import() paths in different parts of the dependency graph — leading to subtle bugs like failed instanceof checks across the two copies.',
        'The "exports" field in package.json with conditional exports lets a single published package declare separate entry points for "require" and "import" consumers, letting Node.js automatically pick the correct format for each consumer.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CJS vs ESM',
      language: 'typescript',
      code: `// --- CommonJS (math.js) ---
function add(a, b) { return a + b; }
module.exports = { add };               // export
// Or: exports.add = add;               // shorthand (same thing)

const { add } = require('./math');      // import
console.log(add(1, 2));                 // 3

// --- ES Modules (math.mjs) ---
export function add(a, b) { return a + b; }  // named export
export default class Calculator { /* ... */ } // default export

import { add } from './math.mjs';       // named import
import Calculator from './math.mjs';    // default import
import * as math from './math.mjs';     // namespace import

// Dynamic import (works in both CJS and ESM)
const { add: addFn } = await import('./math.mjs');`
    },
    {
      label: 'ESM __dirname equivalent',
      language: 'typescript',
      code: `// CJS (always available)
console.log(__dirname);   // /home/user/project/src
console.log(__filename);  // /home/user/project/src/server.js

// ESM (need to construct it)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

console.log(__dirname);   // same as CJS

// Or use node:path directly (Node 21.2+)
import { resolve } from 'node:path';
const dir = resolve(); // current working directory (not file dir!)

// Cleaner ESM pattern with import.meta.dirname (Node 21.2+)
const dir2 = import.meta.dirname; // same as __dirname`
    },
    {
      label: 'package.json exports',
      language: 'typescript',
      code: `{
  "name": "my-package",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts",
      "default": "./dist/index.mjs"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs"
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reassigning exports breaks the reference',
      wrong: 'exports = { add, subtract }; // breaks — module.exports unchanged',
      right: 'module.exports = { add, subtract }; // correct reassignment',
      explanation: 'exports is a reference to module.exports. Reassigning exports breaks the link. Always reassign module.exports; only add properties to exports.'
    },
    {
      title: 'require()ing an ESM-only package in CJS',
      wrong: 'const pkg = require("pure-esm-package"); // Error: require() of ES Module',
      right: 'const pkg = await import("pure-esm-package"); // dynamic import works',
      explanation: 'ESM-only packages cannot be required synchronously. Use dynamic import() which returns a Promise, or migrate your code to ESM.'
    },
    {
      title: 'Using __dirname in an ESM file',
      wrong: 'console.log(__dirname); // ReferenceError: __dirname is not defined',
      right: 'const __dirname = dirname(fileURLToPath(import.meta.url));',
      explanation: '__dirname and __filename are CJS-only globals. ESM files must reconstruct them from import.meta.url.'
    },
    {
      title: 'Expecting module cache to reset between tests',
      wrong: '// After modifying module state in test 1, test 2 sees the same state',
      right: 'delete require.cache[require.resolve("./my-module")]; // before each test',
      explanation: 'require() caches on first load. Tests that import singleton modules share state. Use jest.resetModules() or manually clear require.cache.'
    },
    {
      title: 'Not using the exports field for subpath imports',
      wrong: 'import secret from "my-pkg/src/internal/secret"; // exposes internals',
      right: '// Use "exports" in package.json to control which paths are public',
      explanation: 'Without "exports", all files in the package are importable. The "exports" field lets you explicitly declare what is public and block internal paths.'
    },
  ];

  challenge: Challenge = {
    title: 'Module Cache Inspector',
    language: 'typescript',
    description: 'Write a function getLoadedModules() that returns an array of all currently cached module paths (from require.cache), filtered to only include paths inside the project directory (process.cwd()). Then write a function clearProjectModules() that removes those entries from the cache. This is used in test frameworks for module isolation.',
    hints: [
      'Object.keys(require.cache) gives all cached module paths.',
      'Filter with .startsWith(process.cwd()) to exclude node_modules and built-ins.',
      'Delete from require.cache with delete require.cache[path].',
    ],
    starterCode: `function getLoadedModules() {
  // Return array of cached module paths inside project dir
}

function clearProjectModules() {
  // Remove project modules from cache
}`,
    solution: `function getLoadedModules() {
  const cwd = process.cwd();
  return Object.keys(require.cache)
    .filter(p => p.startsWith(cwd) && !p.includes('node_modules'));
}

function clearProjectModules() {
  const modules = getLoadedModules();
  modules.forEach(p => delete require.cache[p]);
  return modules.length;
}

// Usage
console.log(getLoadedModules()); // e.g., ['/home/user/proj/src/db.js', ...]
console.log(\`Cleared \${clearProjectModules()} modules\`);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does module.exports = function() {} do vs exports.foo = function() {}?', options: ['Both are identical', 'The first replaces the export with a function; the second adds a named property', 'Neither pattern is valid in Node.js', 'The second causes a TypeError'], answer: 1, explanation: 'module.exports = fn replaces the entire export with a function. exports.foo = fn adds a named property to the existing object. After module.exports = fn, the exports shorthand is broken.' },
    { q: 'How do you use __dirname in an ES Module file?', options: ['It is available natively', 'import.meta.dirname (Node 21.2+) or fileURLToPath(import.meta.url)', 'global.__dirname', 'require.main.filename'], answer: 1, explanation: '__dirname does not exist in ESM. Use import.meta.dirname (Node 21.2+) or construct it: dirname(fileURLToPath(import.meta.url)).' },
    { q: 'What does "type":"module" in package.json do?', options: ['Adds TypeScript support', 'Makes all .js files ES Modules', 'Enables ECMAScript strict mode', 'Adds module bundling'], answer: 1, explanation: '"type":"module" tells Node to treat .js files as ES Modules. Without it, .js files default to CommonJS. .mjs files are always ESM regardless of this field.' },
    { q: 'Can CJS require() an ESM module?', options: ['Yes, seamlessly', 'No — use dynamic import() instead', 'Yes, using require.async()', 'Only if the ESM module has a "main" field'], answer: 1, explanation: 'require() is synchronous and ESM modules load asynchronously. You cannot require() an ESM-only package. Use dynamic import() which returns a Promise.' },
    { q: 'When does Node.js re-evaluate a require()d module?', options: ['Every call to require()', 'Only on process restart (unless cache is manually cleared)', 'When the file modification time changes', 'After 60 seconds'], answer: 1, explanation: 'require() caches modules after the first load. Subsequent calls return the cached exports. The module only re-evaluates if you delete require.cache[path] or restart the process.' },
    { q: 'If a package has "type": "module" set, can it still ship a .cjs file, and what happens to that file\'s module interpretation?', options: ['No — "type": "module" forces every file in the package to be ESM with no exceptions', 'Yes — the .cjs extension always forces CommonJS interpretation for that file regardless of the package-level "type" field, the mirror image of how .mjs always forces ESM regardless of "type"', 'Yes, but .cjs files are silently ignored by Node.js when "type": "module" is set', 'The .cjs extension only works inside TypeScript projects, not plain Node.js'], answer: 1, explanation: 'File extensions override the package-level "type" field: .mjs always means ESM and .cjs always means CommonJS regardless of what "type" says, and only plain .js files fall back to whatever "type" specifies (module or commonjs, defaulting to commonjs if omitted). This lets an otherwise-ESM package still ship a handful of CommonJS-specific files (a legacy config some tool expects) by naming them .cjs, without needing to change the package-wide type setting.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use CJS or ESM for a new Node.js project?', a: 'ESM for new projects. It is the JavaScript standard, supports top-level await, and enables tree-shaking. Add "type":"module" to package.json. The main friction is interop with older CJS packages (use dynamic import()) and tooling that expects CJS (jest — use vitest instead, or configure jest for ESM).' },
    { q: 'What is a "pure ESM" package and why does it cause issues?', a: 'A pure ESM package has "type":"module" and no CJS fallback. CJS projects cannot require() it — they get "Error: require() of ES Module". Options: (1) migrate your project to ESM, (2) use dynamic import() at the call site, (3) find a CJS-compatible version of the package.' },
    { q: 'How does module caching affect singleton patterns?', a: 'Module caching makes singletons work naturally — the first require() runs the module code and caches the exports object. All subsequent require() calls return the same cached object. This is why a shared db connection or config object works: every file that requires it gets the same instance.' },
    { q: 'What is the practical difference between CommonJS require() and ES Modules import in Node.js?', a: 'CommonJS require() is synchronous and resolves modules at the point of the call, allowing conditional or dynamic requires (require(condition ? "a" : "b")) anywhere in the code. ES Modules import is statically analyzed at parse time (enabling tree-shaking by bundlers) and is asynchronous under the hood, with imports always hoisted to the top of the module regardless of where they are written in the source. Node.js supports both, distinguished by the "type" field in package.json (module for ESM, commonjs or absent for CJS) or file extension (.mjs vs .cjs).' },
    { q: 'Why can you not directly use require() inside a Node.js ES Module file?', a: 'require, along with __dirname and __filename, are CommonJS-specific globals that are not defined in the ES Module scope — ESM uses import.meta.url instead for module-relative path resolution. To use a CommonJS-only package from an ESM file, you typically import it as a default export (since most CJS packages are interop-compatible) or use createRequire(import.meta.url) from the "module" built-in to construct a require function when truly necessary.' },
    { q: 'What problem do dual-format (CJS + ESM) npm packages solve, and how do they declare both formats?', a: 'A library author wants their package usable by both legacy CommonJS consumers and modern ESM consumers without forcing either group to migrate. This is solved via the "exports" field in package.json with conditional exports, specifying separate entry points for "require" (CJS build) and "import" (ESM build) — Node.js automatically picks the correct one based on how the consuming code is importing the package, allowing a single published package to serve both module systems correctly.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CJS uses synchronous require()/module.exports; ESM uses static import/export. Node.js caches modules after first load — singletons work for free.',
    mustKnow: [
      'CJS require() is synchronous and cached; ESM import is static and async.',
      '"type":"module" in package.json makes .js files ESM; .mjs/.cjs force the format.',
      'exports = {} breaks the link to module.exports — reassign module.exports.',
      '__dirname/__filename are CJS-only; ESM uses import.meta.url / import.meta.dirname.',
      'CJS cannot require() ESM — use dynamic import() instead.',
      '"exports" field in package.json controls public API and blocks internal paths.',
    ],
    interviewFocus: [
      'What is the difference between CJS require() and ESM import?',
      'Why can\'t CJS require() an ESM module?',
      'How does module caching work and when is it a problem?',
    ]
  };
}
