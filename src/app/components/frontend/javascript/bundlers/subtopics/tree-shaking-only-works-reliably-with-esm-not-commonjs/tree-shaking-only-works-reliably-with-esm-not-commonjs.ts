import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-tree-shaking-esm-only-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './tree-shaking-only-works-reliably-with-esm-not-commonjs.html',
  styleUrl: './tree-shaking-only-works-reliably-with-esm-not-commonjs.scss',
})
export class TreeShakingOnlyWorksReliablyWithEsmNotCommonJsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Claim: Tree-Shaking Needs Static Analysis',
      points: [
        'The main page states directly: tree-shaking "relies on ESM\'s static import/export structure. CommonJS <code>require()</code> is dynamic and prevents effective tree-shaking." This subtopic explains WHY that\'s true by comparing what a bundler can actually determine about each module system BEFORE running any code, since tree-shaking is fundamentally a build-time, static-analysis decision — not something observable by running JS in a browser console.',
        'A bundler decides what to remove by reading your source files\' <code>import</code>/<code>export</code> statements textually, without executing any code — this is only reliable when those statements are fixed, top-level, and never conditional, which is exactly what ESM guarantees and CommonJS does not.',
      ],
    },
    {
      heading: 'Why require() Defeats Static Analysis',
      points: [
        'ESM\'s <code>import</code>/<code>export</code> statements MUST appear at the top level of a module and use string literals for the module specifier — <code>import { x } from \'./mod\'</code> can always be resolved and analyzed purely by READING the source text, before any code runs. A bundler can build a complete, precise graph of "what does every module actually use from every other module" with total confidence.',
        'CommonJS\'s <code>require()</code> is just a regular FUNCTION CALL — it can be wrapped in a condition (<code>if (isDev) require(\'debug-tools\')</code>), computed from a variable (<code>require(moduleNameVariable)</code>), or called anywhere in the code, not just at the top level. A bundler cannot safely assume it knows every module a file might <code>require()</code> without actually running the code, which static analysis fundamentally cannot do.',
        'Because of this uncertainty, a bundler processing CommonJS code must conservatively assume ANY exported value from a <code>require()</code>\'d module might be used somewhere, and keep the whole module intact — this is precisely why mixing CommonJS dependencies into an otherwise-ESM project silently defeats tree-shaking for those specific dependencies, even if the rest of the app tree-shakes perfectly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ESM: Statically Analyzable',
      language: 'typescript',
      code: `// utils.js — ESM named exports
export function debounce(fn, ms) { /* ... */ }
export function throttle(fn, ms) { /* ... */ }
export function deepClone(obj) { /* ... */ }

// app.js — only imports debounce
import { debounce } from './utils.js';

debounce(() => console.log('resized'), 200);

// A bundler can read this file WITHOUT running it and know with total
// certainty: only "debounce" is used. throttle and deepClone are
// PROVABLY unreachable from this import, and can be safely deleted
// from the final bundle.`,
    },
    {
      label: 'CommonJS: Defeats Static Analysis',
      language: 'typescript',
      code: `// utils.cjs — CommonJS exports
function debounce(fn, ms) { /* ... */ }
function throttle(fn, ms) { /* ... */ }
function deepClone(obj) { /* ... */ }
module.exports = { debounce, throttle, deepClone };

// app.cjs — a bundler CANNOT statically know which of these get used
const utilsModuleName = getConfiguredUtilsModule(); // computed at RUNTIME
const utils = require(utilsModuleName);             // could be ANY module
const fnName = process.env.MODE === 'debug' ? 'deepClone' : 'debounce';
utils[fnName](() => {});  // property access is also dynamic

// A bundler reading this file has NO reliable way to determine, just by
// reading the source text, which of debounce/throttle/deepClone will
// actually be called -- require() and property access are both regular
// runtime operations, not statically fixed declarations like import/export.
// The safe (conservative) choice is to keep the ENTIRE utils module intact.`,
    },
    {
      label: 'Mixed Project: One CJS Dependency Defeats Its Own Tree-Shaking',
      language: 'typescript',
      code: `// Your app.js is pure ESM -- tree-shakes perfectly on its own.
import { formatDate } from './dateHelpers.js';  // ESM, tree-shakeable

// But a dependency published as CommonJS...
import moment from 'moment';  // moment.js ships as CommonJS internally
const now = moment().format('YYYY-MM-DD');

// Even though YOUR code only uses moment() and .format(), the bundler
// cannot statically verify moment's own INTERNAL require() calls and
// dynamic exports -- so the ENTIRE moment package (with all its locale
// data) ships in the bundle, regardless of how little of its API you use.

// This is exactly why modern replacements are published as pure ESM:
import { format } from 'date-fns';  // pure ESM -- only "format" ships
const now2 = format(new Date(), 'yyyy-MM-dd');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the "Mixed Project" example, your own <code>app.js</code> is pure ESM. Does that guarantee the final bundle only contains the specific <code>moment</code> functions you actually called?',
    hint: 'Ask whether the tree-shaking guarantee applies per-project or per-module -- does YOUR file being ESM say anything about whether a DEPENDENCY you imported is also ESM internally?',
    solution: `No -- even though app.js itself is pure ESM, the moment package ships
its own internals as CommonJS, so the bundler cannot statically verify
which of moment's exports are actually reachable. The ENTIRE moment
package (locale data and all) ends up in the final bundle, regardless
of how minimally your own code uses it.

Tree-shaking isn't a single project-wide switch that turns on once
your OWN code is written as ESM -- it's decided PER MODULE, based on
how that specific module's source is structured. Your app.js being
ESM only guarantees YOUR OWN code tree-shakes correctly; it says
nothing about whether moment (or any other dependency) can be
tree-shaken, since that depends entirely on how moment itself was
published.

This is exactly why the main page's advice to prefer named ESM
imports (lodash-es over lodash, date-fns over moment) matters at the
DEPENDENCY level, not just in your own application code -- a single
CommonJS dependency in your tree can silently bloat your bundle no
matter how carefully you've structured everything else as clean,
tree-shakeable ESM.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'tree-shaking is a general JavaScript optimization that works on any code, as long as the unused functions are never actually called anywhere in the program.',
      reality: 'tree-shaking is a STATIC ANALYSIS technique performed at build time by reading import/export statements as text, without running any code — it fundamentally cannot work on CommonJS\'s require(), which is a regular, potentially-dynamic function call the bundler cannot fully resolve without executing the program.',
    },
    {
      thought: 'writing your OWN application code as pure ESM is sufficient to guarantee your final bundle is fully tree-shaken and free of unused code.',
      reality: 'tree-shaking is decided per-module across your ENTIRE dependency tree — even a perfectly ESM-authored app can end up with untree-shaken bloat if any of its dependencies are internally published as CommonJS, since the bundler must conservatively keep those dependencies\' code intact.',
    },
    {
      thought: 'a bundler could, in principle, analyze a require() call\'s arguments and surrounding code closely enough to tree-shake CommonJS just as effectively as ESM — it\'s just that bundler authors haven\'t prioritized building that analysis yet.',
      reality: 'this isn\'t a matter of insufficient tooling investment — it\'s a fundamental limitation: require() can be called conditionally, with a computed module name, or anywhere in a function body, meaning the SET of possible requires can genuinely depend on runtime state that static analysis, by definition, cannot observe without executing the code.',
    },
  ];
}
