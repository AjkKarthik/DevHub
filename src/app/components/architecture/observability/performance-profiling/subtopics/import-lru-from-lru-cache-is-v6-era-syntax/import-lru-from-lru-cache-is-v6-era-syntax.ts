import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Real, Verified Break in the Main Page’s Own "Fix"',
    points: [
      'The main page’s own "Memory Leak Detection" code tab presents <code>import LRU from \'lru-cache\'; const cache2 = new LRU&lt;string, object&gt;({ max: 1000, ttl: 1000 * 60 * 5 })</code> as the correct FIX for an unbounded-cache leak. That import style — a default import — is genuinely how <code>lru-cache</code> worked before its v7 rewrite, but the package that ships today has no default export at all.',
      'Confirmed by actually installing the current, real <code>lru-cache</code> package (v11 at the time of writing) and inspecting it directly: <code>require(\'lru-cache\')</code> returns a plain object whose only useful member is a NAMED export, <code>LRUCache</code>. There is no function or class sitting at the module’s own top level for a default import to bind to.',
      'The practical consequence, reproduced directly: code written the way the page shows it compiles fine as far as TypeScript’s own type errors go under many common `tsconfig` setups (especially with <code>esModuleInterop</code>), but throws <code>TypeError: LRU is not a constructor</code> the moment <code>new LRU(...)</code> actually runs — because the CJS-interop binding for a default import of a module with no real default export ends up pointing at the whole module object, not a callable class.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Break, Then the Real Fix',
    language: 'typescript',
    code: `// Reproduces exactly what happens at runtime with the page's ORIGINAL
// import style against the real, currently-published lru-cache package.
const mod = require('lru-cache');

console.log('typeof require(\\'lru-cache\\'):', typeof mod);
console.log('has a named LRUCache export?', typeof mod.LRUCache);
console.log('is the module itself directly constructable?', typeof mod === 'function');

// Simulating what "import LRU from 'lru-cache'" binds LRU to under
// TypeScript's esModuleInterop CJS-interop rules, for a module with
// no __esModule flag and no default export of its own:
const LRU = mod; // this is what the default-import binding resolves to

try {
  const cache = new LRU({ max: 1000, ttl: 1000 * 60 * 5 });
  console.log('construction succeeded (unexpected)');
} catch (err) {
  console.log('construction FAILED:', (err as Error).message);
}

// ── THE ACTUAL FIX ──────────────────────────────────────────────────
import { LRUCache } from 'lru-cache'; // v7+ named export -- no default at all
const cache2 = new LRUCache<string, object>({ max: 1000, ttl: 1000 * 60 * 5 });
cache2.set('order:42', { total: 99.5 });
console.log('correct usage works:', cache2.get('order:42'));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate suggests a one-line fix that keeps the default-import syntax: <code>import * as LRU from \'lru-cache\'; const cache2 = new LRU.LRUCache({ ... })</code>. Would that actually work, and if so, why doesn’t the main page just use that instead of switching to a named import?',
  hint: 'Think about what <code>import * as X</code> actually binds — a namespace object containing every export — compared to what a plain default or named import binds.',
  solution: `// Yes, "import * as LRU from 'lru-cache'" would genuinely work --
// import * as X pulls in a NAMESPACE OBJECT containing every named
// export of the module, and LRU.LRUCache would correctly reach the
// real class through it, exactly like accessing mod.LRUCache directly
// in the verification above.
//
// It's just a worse fix stylistically, not a broken one: the whole
// point of "import { LRUCache } from 'lru-cache'" is that the name in
// your own code (LRUCache) matches the name everyone reading OTel/npm
// docs, Stack Overflow answers, and the package's own README already
// expect -- LRU.LRUCache works but reads like an unnecessary extra
// layer of indirection for a module that only really has one export
// worth importing. The main page picked the named-import form because
// it's the form the package's own documentation recommends, not
// because the namespace-import form would fail.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the buggy import compiles without a TypeScript error, that means it’s type-safe and the bug is purely a runtime surprise nothing could have caught earlier.',
    reality: 'It depends entirely on the project’s own `tsconfig.json`. With `esModuleInterop: true` (the common default in most modern setups, including Angular’s own generated config) and no `.d.ts` for the package declaring a real default export, TypeScript’s type-checker for a default import of a CommonJS module without one is often permissive rather than a hard compile error — which is exactly why this specific mistake tends to surface at RUNTIME, in whichever code path first actually calls <code>new LRU(...)</code>, rather than at build time.',
  },
  {
    thought: 'This is a one-off, package-specific quirk of <code>lru-cache</code> — most npm packages that switch major versions keep their import style stable.',
    reality: 'Switching from a default export to a named export (or the reverse) is a genuinely common breaking change across major versions of many popular packages, not unique to this one — it’s exactly the kind of change semantic versioning’s major-version bump exists to signal. The specific, reliable check that generalizes beyond this one package: after bumping ANY dependency’s major version, actually run (or at minimum read) the code path that constructs/calls the library, rather than trusting that an old import statement still resolves to the same thing.',
  },
];

@Component({
  selector: 'app-obs-profiling-lru-import',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './import-lru-from-lru-cache-is-v6-era-syntax.html',
  styleUrl: './import-lru-from-lru-cache-is-v6-era-syntax.scss',
})
export class ImportLruFromLruCacheIsV6EraSyntaxSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
