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
  selector: 'app-js-modules',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class JsModules {
  theory: TheoryPoint[] = [
    {
      heading: 'ES Modules: Named vs Default Exports',
      points: [
        '<strong>Named exports</strong>: <code>export const PI = 3.14</code> or <code>export function fn() {}</code>. Imported with exact name in braces: <code>import { PI, fn } from \'./math\'</code>. One file can have many named exports.',
        '<strong>Default export</strong>: <code>export default class Foo {}</code>. Imported without braces: <code>import Foo from \'./foo\'</code>. Each module can have at most one default export. Importer chooses the name.',
        'Mixing: <code>import React, { useState, useEffect } from \'react\'</code> — React is the default, useState/useEffect are named. Common pattern in libraries.',
        'Re-export for barrel files: <code>export { fn } from \'./utils\'</code> or <code>export * from \'./utils\'</code>. Lets consumers import from one entry point instead of many paths.',
        'Rename on import/export: <code>import { fn as myFn } from \'./utils\'</code> or <code>export { fn as publicFn }</code>.',
      ]
    },
    {
      heading: 'Module Scope & Live Bindings',
      points: [
        'Every ES module has its own scope — top-level variables are NOT global. They must be explicitly exported to be accessible outside.',
        'ES module imports are <strong>live bindings</strong>: if the exporting module updates an exported variable, the importer sees the new value automatically. This differs from CommonJS <code>require()</code> which copies values.',
        'Modules are singletons: the same module is only evaluated once regardless of how many times it\'s imported. Shared state is maintained.',
        'Circular imports are allowed in ESM but can cause issues if a module reads an import before it\'s initialized. The binding exists (live binding) but the value may be <code>undefined</code> at the time of access.',
      ]
    },
    {
      heading: 'Dynamic Import',
      points: [
        '<code>import(\'./module\')</code> returns a Promise and loads the module lazily. Use for code-splitting: delay loading large/rarely-used code until actually needed.',
        'Dynamic imports work inside <code>if</code> blocks, functions, and event handlers — unlike static imports which must be at the top level.',
        'Bundlers (Vite, webpack) create a separate chunk for each dynamic import — the browser fetches it only when needed.',
        '<code>import.meta.url</code> gives the current module\'s URL — useful for relative path resolution in modules, as there is no <code>__dirname</code> in ESM.',
      ]
    },
    {
      heading: 'CommonJS vs ESM',
      points: [
        '<strong>CommonJS</strong>: <code>require()</code> / <code>module.exports</code>. Synchronous, evaluated at runtime. Node.js default until 2020. Cannot use in browsers natively.',
        '<strong>ESM</strong>: <code>import/export</code>. Statically analyzable (bundlers can tree-shake), async-capable, works natively in modern browsers with <code>type="module"</code>.',
        'In Node.js, use <code>.mjs</code> extension or <code>"type": "module"</code> in package.json for ESM. Mix carefully — <code>require</code> cannot be used in ESM files.',
        'Top-level await (<code>await fetch(...)</code> at module root) is an ESM-only feature — modules can be async without wrapper functions.',
      ]
    },
    {
      heading: 'Named Exports vs Default Exports',
      points: [
        'Named exports (<code>export const foo = ...</code>) require the importer to use the exact same name (or explicitly rename via <code>as</code>), enabling better tooling support — IDEs can reliably auto-import and rename across a codebase since the export name is fixed and statically known.',
        'Default exports (<code>export default foo</code>) let the importer choose any name they like on import, which sacrifices some tooling consistency (the same module might be imported under different names in different files) for a slightly shorter import syntax.',
        'Many style guides now prefer named exports exclusively for this reason — consistent naming across a codebase, better auto-import/refactor tooling support, and the ability to export multiple things from one module without an awkward object-wrapping default export.',
        'Mixing both (a default export plus several named exports from the same module) is valid but can be confusing — pick one convention (usually named-only) and apply it consistently across a project.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'export const x = ...',               type: 'syntax',   desc: 'Named export' },
    { name: 'export default value',               type: 'syntax',   desc: 'Default export (one per module)' },
    { name: 'import { x } from \'./mod\'',        type: 'syntax',   desc: 'Named import' },
    { name: 'import Foo from \'./foo\'',           type: 'syntax',   desc: 'Default import' },
    { name: 'import * as ns from \'./mod\'',       type: 'syntax',   desc: 'Namespace import' },
    { name: 'export { x } from \'./mod\'',         type: 'syntax',   desc: 'Re-export' },
    { name: 'import(\'./mod\')',                   type: 'function', desc: 'Dynamic import → Promise<module>' },
    { name: 'import.meta.url',                    type: 'keyword',  desc: 'Current module URL (ESM only)' },
    { name: '<script type="module">',             type: 'syntax',   desc: 'Enable ESM in browser HTML' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Named & Default Exports',
      language: 'typescript',
      code: `// ── math.js — named exports ──────────────────────────────────────────
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }

// ── user.js — default + named ─────────────────────────────────────────
export default class User {
  constructor(name) { this.name = name; }
  greet() { return \`Hi, I'm \${this.name}\`; }
}
export function validateEmail(email) {
  return /^[^@]+@[^@]+\\.[^@]+$/.test(email);
}

// ── main.js — importing ───────────────────────────────────────────────
import { PI, add } from './math.js';          // named imports
import User, { validateEmail } from './user.js'; // default + named

console.log(add(PI, 1));             // 4.14159
const u = new User('Alice');
console.log(u.greet());              // "Hi, I'm Alice"
console.log(validateEmail('a@b.c')); // true

// ── Rename on import ──────────────────────────────────────────────────
import { add as sum, multiply as mul } from './math.js';
console.log(sum(2, 3)); // 5

// ── Namespace import ──────────────────────────────────────────────────
import * as MathUtils from './math.js';
console.log(MathUtils.PI);           // 3.14159
console.log(MathUtils.add(1, 2));    // 3

// ── Barrel file (index.js) ────────────────────────────────────────────
// src/utils/index.js
export { add, multiply } from './math.js';
export { validateEmail } from './user.js';

// Consumer imports from one place:
import { add, validateEmail } from './utils/index.js';`,
    },
    {
      label: 'Dynamic Import',
      language: 'typescript',
      code: `// ── Lazy load on demand ──────────────────────────────────────────────
// Heavy chart library only loaded when user opens the chart tab
document.querySelector('#chart-tab').addEventListener('click', async () => {
  const { Chart } = await import('./chart.js');  // fetched only now
  new Chart(document.querySelector('#canvas'), data);
});

// ── Conditional loading ───────────────────────────────────────────────
async function loadFeature(feature) {
  const modules = {
    pdf: () => import('./features/pdf-viewer.js'),
    map: () => import('./features/map.js'),
    editor: () => import('./features/rich-editor.js'),
  };
  const loader = modules[feature];
  if (!loader) throw new Error(\`Unknown feature: \${feature}\`);
  return loader();  // { default: FeatureClass, ... }
}

// ── Code splitting in route handler ──────────────────────────────────
const routes = {
  '/admin': () => import('./pages/AdminPage.js'),
  '/profile': () => import('./pages/ProfilePage.js'),
  '/home': () => import('./pages/HomePage.js'),
};

async function navigate(path) {
  const loader = routes[path];
  if (!loader) { /* 404 */ return; }
  const { default: Page } = await loader();
  mountPage(new Page());
}

// ── import.meta.url — resolve paths in ESM ───────────────────────────
// In a module at /src/utils/loader.js:
const dir = new URL('.', import.meta.url);          // /src/utils/
const wasmUrl = new URL('./parser.wasm', import.meta.url); // /src/utils/parser.wasm

// ── Top-level await (ESM only) ────────────────────────────────────────
// config.js
const res = await fetch('/api/config');
export const config = await res.json();

// Other modules can import 'config' and it's guaranteed to be ready`,
    },
    {
      label: 'CommonJS vs ESM',
      language: 'typescript',
      code: `// ── CommonJS (Node.js traditional) ───────────────────────────────────
// utils.cjs
const PI = 3.14;
function add(a, b) { return a + b; }
module.exports = { PI, add };          // or module.exports.add = add;

// main.cjs
const { PI, add } = require('./utils.cjs');  // synchronous, inline
const path = require('path');                // Node built-in
const pkg = require('./package.json');       // JSON works directly

// ── ES Modules (modern) ───────────────────────────────────────────────
// utils.mjs  (or .js with "type":"module" in package.json)
export const PI = 3.14;
export function add(a, b) { return a + b; }

// main.mjs
import { PI, add } from './utils.mjs';
import { readFile } from 'node:fs/promises';  // Node built-in ESM form

// ── Key differences table (as comments) ──────────────────────────────
// CJS: require() is synchronous, dynamic, can be called anywhere
// ESM: import is async-capable, static (top-level only), tree-shakeable
//
// CJS: values are copied at require() time (no live bindings)
// ESM: imports are live bindings — see updates from the source
//
// CJS: __dirname and __filename are available
// ESM: use import.meta.url + new URL('.', import.meta.url) instead
//
// CJS: default export = module.exports; named = object properties
// ESM: explicit export keywords; one default, many named

// ── Interop: using CJS from ESM ───────────────────────────────────────
import cjsModule from './legacy.cjs';        // default import = module.exports
const { helper } = cjsModule;               // destructure named exports`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Importing a default export with braces (or named without)',
      wrong: `import { User } from './user.js';    // wrong — User is the default export
import Button from './ui.js';         // wrong if Button is a named export`,
      right: `import User from './user.js';         // default export — no braces
import { Button } from './ui.js';     // named export — with braces`,
      explanation: 'Default exports are imported without braces and can be named anything. Named exports use their exact exported name in braces. Mixing these up is the most common module mistake.',
    },
    {
      title: 'Circular imports causing undefined values',
      wrong: `// a.js: import { b } from './b.js'; console.log(b);  // undefined!
// b.js: import { a } from './a.js'; export const b = 'B';`,
      right: `// Extract shared values to a third module (c.js) that neither imports from the other
// OR restructure so only one direction imports from the other`,
      explanation: 'In circular imports, the binding exists but may be undefined when first accessed. ESM initializes modules in dependency order — if A imports B which imports A, A\'s exports may not be set yet when B reads them.',
    },
    {
      title: 'Using require() in an ESM file',
      wrong: `// package.json: { "type": "module" }
const fs = require('fs');  // ReferenceError: require is not defined`,
      right: `import { readFileSync } from 'fs';
// Or for dynamic CJS-style loading in ESM:
import { createRequire } from 'module';
const require = createRequire(import.meta.url);`,
      explanation: 'When "type":"module" is set, all .js files are treated as ESM and require() is unavailable. Use import statements, or createRequire for legacy CJS interop.',
    },
    {
      title: 'Forgetting await on dynamic import()',
      wrong: `const mod = import('./heavy.js');  // mod is a Promise, not the module!
mod.doSomething();                  // TypeError`,
      right: `const { doSomething } = await import('./heavy.js');
doSomething();`,
      explanation: 'import() is an async function returning a Promise<module>. You must await it (or .then()) before accessing exports. The module object has the same shape as static imports.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Lazy Plugin Registry',
    language: 'typescript',
    description: 'Build a `PluginRegistry` class with:\n- `register(name, loader)` — register a dynamic import loader function\n- `load(name)` — dynamically import the plugin (cache after first load)\n- `isLoaded(name)` — check if already loaded\n\nPlugins should only be imported once even if `load()` is called multiple times.',
    hints: [
      'Store loaders in a Map: name → () => import(...)',
      'Store loaded modules in a separate Map for caching',
      'Return the cached module immediately if already loaded',
      'The loader is a thunk: () => import("./plugin")',
    ],
    starterCode: `class PluginRegistry {
  // your implementation
}

const registry = new PluginRegistry();

// Register lazy loaders
registry.register('chart', () => import('./chart.js'));
registry.register('pdf', () => import('./pdf.js'));

// Load on demand — only imports once
const chart = await registry.load('chart');
const chart2 = await registry.load('chart');  // cached, no second fetch
console.log(chart === chart2);  // true`,
    solution: `class PluginRegistry {
  #loaders = new Map();
  #cache = new Map();

  register(name, loader) {
    this.#loaders.set(name, loader);
  }

  async load(name) {
    if (this.#cache.has(name)) return this.#cache.get(name);
    const loader = this.#loaders.get(name);
    if (!loader) throw new Error(\`Unknown plugin: \${name}\`);
    const mod = await loader();
    this.#cache.set(name, mod);
    return mod;
  }

  isLoaded(name) { return this.#cache.has(name); }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between a named export and a default export?',
      options: [
        'Named exports use braces on import; default exports don\'t. A module can have many named but only one default.',
        'Default exports are faster to load',
        'Named exports can only export functions',
        'They are identical in behavior',
      ],
      answer: 0,
      explanation: 'Named exports: import { x } from "..." — must match the exported name (or use "as"). Default export: import Anything from "..." — importer names it freely. One module can have multiple named exports but only one default.',
    },
    {
      q: 'What does import() (dynamic import) return?',
      options: ['The module object synchronously', 'A Promise that resolves to the module', 'undefined', 'A generator'],
      answer: 1,
      explanation: 'Dynamic import() is asynchronous and returns a Promise<module>. You must await it or .then() before accessing exports. This enables lazy loading and code splitting.',
    },
    {
      q: 'Are ES module imports live bindings or value copies?',
      options: [
        'Value copies — like CommonJS require()',
        'Live bindings — updates in the exporting module are seen by importers',
        'Depends on whether the export is const or let',
        'They are always frozen at import time',
      ],
      answer: 1,
      explanation: 'ESM imports are live bindings. If the exporting module changes an exported variable, importers see the new value. CommonJS require() copies values at the time of require — no live binding.',
    },
    {
      q: 'How many default exports can a single module file have?',
      options: ['Unlimited', 'Two', 'One', 'Zero'],
      answer: 2,
      explanation: 'Each module can have exactly one default export. It represents the "main" export of the module. You can have zero or one — but never more than one.',
    },
    {
      q: 'What is circular dependency in modules and how do you detect it?',
      options: ['A module that imports itself directly', 'A cycle where A imports B which imports A (directly or indirectly)', 'Importing the same module twice', 'A dependency with no exports'],
      answer: 1,
      explanation: 'Circular deps occur when module A imports B and B imports A. ESM handles this via live bindings (values can be undefined until the cycle resolves). CommonJS may get incomplete exports. Detect with bundler warnings, madge, or eslint-plugin-import.',
    },
    {
      q: 'What is import.meta and what does it provide?',
      options: ['A way to import metadata files', 'Module-level metadata: import.meta.url, import.meta.env, import.meta.resolve', 'A method to inspect exports', 'A Node.js-only feature'],
      answer: 1,
      explanation: 'import.meta is an object available inside ES modules containing context about the current module. import.meta.url gives the module\'s URL. Bundlers add custom properties like import.meta.env (Vite) or import.meta.hot (HMR). It replaces __dirname/__filename in ESM.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is a barrel file and when should I use one?',
      a: 'A barrel file (typically <code>index.js</code>) re-exports items from multiple modules in one place. Consumers import from one path instead of many. Good for public library APIs and feature folders. Avoid barrel files in large apps where everything re-exports everything — bundlers may struggle to tree-shake and you can get circular dependency issues.',
    },
    {
      q: 'When should I use dynamic import vs static import?',
      a: 'Use static imports for code that is always needed (they are analyzed at build time for tree-shaking). Use dynamic imports when: code is only needed sometimes (route-based code splitting), loading is user-triggered (open modal, click tab), or the module is very large (charts, PDF, 3D libraries). Dynamic imports create separate bundle chunks that load on demand.',
    },
    {
      q: 'What is top-level await and when can I use it?',
      a: 'Top-level await lets you use <code>await</code> at the root of a module without wrapping in an <code>async</code> function. It\'s an ESM-only feature (not available in CommonJS). Great for async initialization like fetching config or connecting to a database at module load time. Other modules that import this module will wait for it to complete.',
    },
    {
      q: 'What is the difference between named exports and default exports in terms of refactoring?',
      a: 'Named exports are explicitly named — they are refactorable by IDEs and statically analysable for tree-shaking. Renaming a named export and its usages is a safe, automated operation. Default exports can be imported under ANY name (<code>import Foo</code>, <code>import Bar</code>), making global renames unreliable. Prefer named exports in shared code; default exports suit components and pages that are the sole export of a file.',
    },
    {
      q: 'How does tree-shaking work and what prevents it?',
      a: 'Tree-shaking removes unused exported code at build time by statically analysing import/export statements. It only works with static ESM (<code>import/export</code>), not dynamic <code>require()</code>. Things that prevent tree-shaking: side-effectful imports (running code on import), missing <code>sideEffects: false</code> in package.json, dynamic property access (<code>module[key]</code>), and importing entire namespaces (<code>import * as lib</code>).',
    },
    {
      q: 'How do you share constants between a Node.js server and a browser client without duplicating code?',
      a: 'Place shared constants in an ESM file (e.g. <code>shared/constants.ts</code>) with no platform-specific code. Both server (Node.js 12+ with ESM or a bundler) and client bundler can import it. Bundlers like Vite/webpack resolve the same ESM source for both targets. This eliminates manual duplication and keeps the single source of truth for error codes, status values, and type guards.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Named exports use braces; default export uses none; modules are singletons with live bindings; dynamic import() enables lazy loading; ESM is statically analyzable and tree-shakeable, unlike CommonJS require().',
    mustKnow: [
      'Named imports: import { x } from "..." — must match exported name',
      'Default import: import X from "..." — importer names it freely',
      'One default export per module; unlimited named exports',
      'ESM imports are live bindings (not value copies like CJS)',
      'Modules are singletons — evaluated once, shared state maintained',
      'import() is async → returns Promise<module> — code splitting',
      'Top-level await is ESM-only; import.meta.url replaces __dirname',
    ],
    interviewFocus: [
      'Named vs default export — syntax and import difference',
      'What are live bindings in ESM vs CommonJS copies?',
      'What is dynamic import and why use it?',
      'ESM vs CommonJS — key differences',
    ],
  };
}
