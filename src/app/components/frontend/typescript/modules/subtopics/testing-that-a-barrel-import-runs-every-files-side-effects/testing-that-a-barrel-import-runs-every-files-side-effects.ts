import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-barrel-import-side-effects-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-barrel-import-runs-every-files-side-effects.html',
  styleUrl: './testing-that-a-barrel-import-runs-every-files-side-effects.scss',
})
export class TestingThatABarrelImportRunsEveryFilesSideEffectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Concern Is Compile Speed, Not Runtime Behavior',
      points: [
        'Common Mistake #4 warns that deep barrel chains slow TypeScript\'s LANGUAGE SERVER AND COMPILER — "TypeScript must resolve all of them for every import." That is entirely a build-time / editor-responsiveness concern.',
        'This subtopic tests a separate, RUNTIME consequence the page never mentions: when you <code>import { capitalize } from \'./utils\'</code> from the barrel shown in the page\'s own example, does the JavaScript engine actually execute EVERY file the barrel re-exports — including <code>dates.ts</code>, which you never asked for — or only the one you used?',
      ],
    },
    {
      heading: 'Why the Whole Module Graph Executes, Not Just What You Use',
      points: [
        'ES module evaluation is graph-based: importing ANY name from a module causes that entire module\'s TOP-LEVEL code to run, and importing from a barrel (<code>export * from \'./dates\'; export * from \'./strings\';</code>) means the JavaScript engine must first evaluate <code>dates.ts</code> and <code>strings.ts</code> in full to know what they export — before it can even give you the specific name you asked for.',
        'This is unrelated to whether a bundler LATER tree-shakes the final bundle. Tree-shaking is a build-time optimization applied to the OUTPUT bundle; it does not change what code actually executes during development (unbundled dev servers, ts-node, direct Node.js ESM execution) or in cases where the bundler cannot prove a module has no side effects.',
        'The practical consequence: if <code>dates.ts</code> has ANY top-level side effect — a <code>console.log</code>, a global event listener registration, a singleton instantiation, a stylesheet injection — that side effect fires the moment ANYTHING is imported from the barrel, even if your code only ever uses <code>capitalize</code> from the completely unrelated <code>strings.ts</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Barrel imports and side effects</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'utils/dates.ts',
      content: `// A top-level side effect -- runs the instant this MODULE is evaluated,
// regardless of whether anything from it is actually used
console.log('[SIDE EFFECT] dates.ts module body executed');

export function parseDate(s: string): Date { return new Date(s); }
export function formatDate(d: Date): string { return d.toISOString(); }
`,
    },
    {
      path: 'utils/strings.ts',
      content: `console.log('[SIDE EFFECT] strings.ts module body executed');

export function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}
export function truncate(s: string, len: number): string {
  return s.length > len ? s.slice(0, len) + '...' : s;
}
`,
    },
    {
      path: 'utils/index.ts',
      content: `// The main page's own barrel pattern, unchanged
export * from './dates';
export * from './strings';
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- before importing from the barrel ---');

// The main page's own example: import ONLY capitalize from strings.ts,
// via the barrel -- never touching dates.ts directly
import { capitalize } from './utils';

console.log('--- after importing from the barrel ---');
console.log('capitalize result:', capitalize('hello'));

// Did dates.ts's side effect fire, even though we never used parseDate
// or formatDate anywhere in this file?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Read the exact console output order. Does "[SIDE EFFECT] dates.ts module body executed" appear, even though this file never imports parseDate or formatDate? Where does it appear relative to the "before/after importing" logs?',
    hint: 'The barrel\'s own module body (export * from \'./dates\'; export * from \'./strings\';) has to evaluate BOTH files in full before the barrel module itself finishes evaluating -- this happens before your single import { capitalize } statement resolves.',
    solution: `Both "[SIDE EFFECT] dates.ts module body executed" and "[SIDE EFFECT]
strings.ts module body executed" appear in the console output,
sandwiched between "before importing" and "after importing" -- even
though index.ts only ever imports capitalize, and dates.ts's exports
(parseDate, formatDate) are never referenced anywhere in this
program.

This happens because import { capitalize } from './utils' requires
fully evaluating utils/index.ts, which in turn requires fully
evaluating BOTH utils/dates.ts and utils/strings.ts (since export *
needs to know everything each file exports) -- their side effects
fire as an unavoidable consequence of module evaluation order, not
because of anything your code specifically asked for.

The practical lesson: a barrel file is not a free abstraction at
runtime. If any file behind a barrel has import-time side effects --
common in real code (analytics setup, singleton construction,
polyfill registration) -- those side effects apply to EVERY consumer
of the barrel, even ones that only need one small, unrelated part of
it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a bundler\'s tree-shaking (or a modern JS engine\'s optimizations) prevents unused barrel exports from actually running their module code, so `import { capitalize } from \'./utils\'` only executes strings.ts.',
      reality: 'tree-shaking is a build-time transformation applied to the FINAL bundle output — it does not change what runs during ordinary module evaluation (dev servers, ts-node, direct ESM execution), and even in bundled output, a bundler can only skip a module\'s side effects if it can PROVE the module is side-effect-free.',
    },
    {
      thought: 'the main page\'s Common Mistake #4 fully covers the practical downside of barrel files — the compile-time slowdown.',
      reality: 'there is a SEPARATE, purely RUNTIME cost the page never mentions: importing anything from a barrel forces the JavaScript engine to evaluate every file the barrel re-exports, executing all of their top-level side effects regardless of which specific export you actually use.',
    },
    {
      thought: 'as long as your own code only imports the specific named export it needs from a barrel, you have no exposure to what the OTHER files behind that barrel do.',
      reality: 'you are exposed to every side effect in every file the barrel transitively re-exports, the moment you import ANYTHING from it — the barrel does not selectively evaluate only the files backing the names you asked for.',
    },
  ];
}
