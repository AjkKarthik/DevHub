import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './the-dual-package-hazard-require-and-import-never-share-a-cache.html',
  styleUrl: './the-dual-package-hazard-require-and-import-never-share-a-cache.scss'
})
export class TheDualPackageHazardRequireAndImportNeverShareACacheSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page already names this "dual-package hazard" as a risk — Node\'s own docs treat it as an official, named phenomenon with a documented cause',
      points: [
        'CJS\'s require.cache and ESM\'s internal module registry are genuinely separate caches with no cross-awareness of each other — Node\'s own ESM documentation states this explicitly: "require.cache is not used by import as the ES module loader has its own separate cache." Loading a file via require() populates ONE cache; loading the same file via import() populates a COMPLETELY DIFFERENT one.',
        'This means a single published package, if reachable through BOTH a require() chain and an import() chain within the same application\'s overall dependency graph, gets loaded and evaluated as TWO ENTIRELY SEPARATE instances — two different module-scope variable sets, two different singleton objects, two different class definitions — even though conceptually it\'s "the same package."',
      ]
    },
    {
      heading: 'Why this produces genuinely confusing, hard-to-diagnose bugs rather than an obvious error',
      points: [
        'The classic symptom: an object created by one copy of a class fails an instanceof check against the class exported by the OTHER copy — even though both classes have identical names and came from the same npm package version, because JavaScript\'s instanceof compares against the specific constructor function reference, and the two copies are structurally identical but genuinely different function objects in memory.',
        'A second classic symptom: a package meant to hold shared, singleton-style state (a cache, a registered plugin list, a connection pool) silently has TWO separate copies of that state — code registering something via the require()-loaded copy is invisible to code reading from the import()-loaded copy, since they\'re not actually sharing any memory at all despite appearing to be "the same module" everywhere in the source code.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'How the hazard actually happens across a mixed dependency graph',
      language: 'typescript',
      code: `// my-app (ESM, "type": "module")
import { EventBus } from 'shared-lib';   // loaded via ESM registry
export const bus = new EventBus();

// legacy-plugin.cjs — an older CJS dependency used by my-app
const { EventBus } = require('shared-lib'); // loaded via require.cache
module.exports.legacyBus = new EventBus();

// BUG: 'shared-lib' is published as a dual CJS/ESM package. Because
// my-app reaches it via import() and legacy-plugin.cjs reaches it
// via require(), Node evaluates shared-lib's module code TWICE —
// once into require.cache, once into the ESM module registry.
// bus and legacyBus are instances of TWO DIFFERENT EventBus
// classes, even though both came from the exact same npm package
// at the exact same version.

console.log(bus instanceof legacyBus.constructor); // false — surprising!`,
    },
    {
      label: 'The practical mitigation — avoid mixing require()/import() for shared-state packages',
      language: 'typescript',
      code: `// Safer: pick ONE loading mechanism consistently for packages
// that hold shared, singleton-style state across your whole app.

// If most of your app is ESM, prefer dynamic import() even from
// CJS-adjacent code paths where possible, rather than require():
// legacy-plugin.cjs
async function getSharedBus() {
  const { EventBus } = await import('shared-lib'); // SAME registry
  return new EventBus();
}

// Package authors can also mitigate this with an "ES module
// wrapper" pattern — publishing a thin .mjs file that re-exports
// from the SAME already-loaded CJS instance via createRequire(),
// rather than shipping two independently-evaluated builds.
// (Documented in Node's own packages.md as a real mitigation.)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Node.js app uses a shared-lib package (published as dual CJS/ESM) to manage a plugin registry meant to be a single, app-wide singleton. Some parts of the app are ESM and import shared-lib via import; a legacy CJS module elsewhere requires it via require(). Plugins registered from the ESM side never appear when the CJS side reads the registry, and vice versa — even though both sides log that they\'re "using the same shared-lib version." Explain what\'s actually happening, and why checking the version number doesn\'t reveal the bug.',
    hint: 'Are require() and import() guaranteed to load the SAME instance of a module\'s code when both are used somewhere in the same application\'s dependency graph, or does each one maintain its own separate cache?',
    solution: 'This is the dual package hazard, confirmed by Node\'s own documentation: require.cache and the ESM module registry are genuinely separate caches with no cross-awareness. Since shared-lib is reachable via BOTH a require() chain (from the legacy CJS module) and an import() chain (from the ESM parts of the app), Node evaluates shared-lib\'s module code TWICE — once into each cache — producing two entirely separate instances of whatever state shared-lib holds, including the plugin registry that was supposed to be a single app-wide singleton. Checking the version number doesn\'t reveal this because BOTH copies genuinely are the same package version — the problem isn\'t a version mismatch, it\'s that the SAME version got loaded and evaluated independently through two different loading mechanisms, producing two objects with identical shape and behavior but no shared memory whatsoever. The fix is ensuring the app consistently reaches shared-state packages through only ONE loading mechanism (e.g., using dynamic import() even from CJS code paths), or relying on a package that ships Node\'s documented "ES module wrapper" pattern specifically to avoid this dual-instantiation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as a package is at the same version, requiring it via require() versus importing it via import will always yield the same underlying module instance and shared state.',
      reality: 'This subtopic\'s theory clarifies require.cache and the ESM module registry are entirely separate caches with zero cross-awareness — the SAME package version can be loaded and evaluated TWICE, once per loading mechanism, if both are used somewhere in the same app\'s dependency graph.'
    },
    {
      thought: 'The dual package hazard is a rare, theoretical edge case unlikely to actually occur in a real application\'s dependency graph.',
      reality: 'This subtopic\'s exercise shows it can occur naturally in any app mixing ESM and legacy CJS code (a very common transitional state for real projects) whenever a shared-state package is reachable through both paths — it is a real, officially-documented Node.js phenomenon with a specific name, not a hypothetical.'
    },
    {
      thought: 'If two supposedly-identical objects from the "same" package fail an instanceof check against each other, this always indicates a genuine version mismatch or a corrupted node_modules installation.',
      reality: 'This subtopic\'s exercise shows this exact symptom can occur with a perfectly correct, single, consistent package version installed — the real cause is two independent evaluations of the same version via different loading mechanisms, not a version or installation problem at all.'
    }
  ];
}
