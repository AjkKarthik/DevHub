import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-circular-import-undefined-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './circular-import-binding-exists-but-value-is-undefined.html',
  styleUrl: './circular-import-binding-exists-but-value-is-undefined.scss',
})
export class CircularImportBindingExistsButValueIsUndefinedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2, Reproduced With Two Real Circular Files',
      points: [
        'The main page\'s Mistake #2 shows a minimal circular-import example and states: "the binding exists but may be undefined when first accessed. ESM initializes modules in dependency order — if A imports B which imports A, A\'s exports may not be set yet when B reads them." This subtopic reproduces the exact scenario across two real files, logging the value at the precise moment it\'s read to show it really is <code>undefined</code> at first, before becoming defined moments later.',
        'This is NOT the same failure as importing something that was never exported at all (which would be a build-time error in most bundlers, or an immediate <code>undefined</code> with no later change) — a circular import\'s value genuinely transitions from <code>undefined</code> to its real value AS THE MODULE GRAPH FINISHES INITIALIZING, which is what makes this bug so easy to miss if the timing of your logging happens to hide it.',
      ],
    },
    {
      heading: 'Why the Binding "Exists" Even Though the Value Doesn\'t Yet',
      points: [
        'Because ESM imports are live bindings (see the earlier subtopic on this page), the CONNECTION between an importer and an export is established immediately, even before the exporting module\'s top-level code has finished running — this is precisely why the main page distinguishes "the binding exists" from "the value may be undefined": the wiring is in place, but the exporting module hasn\'t assigned a real value to that binding yet at the moment it\'s read.',
        'The specific danger is READING a circularly-imported value at the TOP LEVEL of a module (during initial evaluation) — by the time any FUNCTION defined in that module actually runs (typically much later, after the whole module graph has finished loading), the same import will correctly show the real, fully-initialized value, since the live binding catches up once the exporting module completes.',
        'The main page\'s fix pattern reflects this: restructure a circular pair so a shared value lives in a third, non-circular module that both sides import from, OR ensure that the value in question is only READ from inside a function body (deferred access), never at a module\'s own top level during its initial evaluation.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Circular import undefined-at-first demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'a.ts',
      content: `import { bValue } from './b.js';

console.log('  [a.ts] top-level read of bValue (imported from b.ts):', bValue);
// This runs WHILE b.ts is still in the middle of initializing (b.ts imports a.ts first),
// so b.ts has not yet reached its own "export const bValue = ..." line.

export const aValue = 'A-ready';

// A function (not run yet) that reads bValue LATER, after everything has settled.
export function readBValueLater() {
  console.log('  [a.ts] reading bValue INSIDE a function, called later:', bValue);
}`,
    },
    {
      path: 'b.ts',
      content: `import { aValue, readBValueLater } from './a.js';

console.log('  [b.ts] top-level read of aValue (imported from a.ts):', aValue);
// b.ts is evaluated FIRST (it's the entry point's first import), so when it
// imports a.ts, a.ts starts running -- but a.ts ALSO imports b.ts (circular!),
// and since b.ts hasn't reached "export const bValue" yet, a.ts's top-level
// read of bValue sees undefined at that exact moment.

export const bValue = 'B-ready';

export function callReadBValueLater() {
  readBValueLater();
}`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- Importing b.ts, which circularly imports a.ts ---');
import { callReadBValueLater } from './b.js';

console.log('--- Module graph has now FULLY finished loading ---');
console.log('--- Calling a function that reads bValue AFTER everything settled ---');
callReadBValueLater();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Compare the two logs of <code>bValue</code>: one from <code>a.ts</code>\'s TOP LEVEL (while modules are still loading), and one from INSIDE a function called after everything finishes. Do they show the same value?',
    hint: 'Ask which module -- a.ts or b.ts -- is still in the middle of its own top-level code when the OTHER one tries to read a value from it, versus what\'s true once the entire module graph has finished evaluating.',
    solution: `No -- they show different values. The top-level read of bValue inside
a.ts logs undefined, while the SAME import, read later from inside
readBValueLater(), correctly logs "B-ready".

Here's the exact sequence: index.ts imports b.ts first. b.ts's own
top-level code starts running, and its very first line imports a.ts.
This makes the JS engine pause b.ts and start evaluating a.ts. a.ts
imports bValue from b.ts and immediately (at its own top level) logs
it -- but at this exact moment, b.ts is still paused partway through
its OWN top-level code, having not yet reached its "export const
bValue = 'B-ready'" line. So a.ts's live binding to bValue exists
(the connection is wired up), but the VALUE behind it hasn't been
assigned yet -- hence undefined.

a.ts then finishes its own top-level code (including exporting
aValue and defining readBValueLater, but NOT calling it yet), control
returns to b.ts, which finishes evaluating (now bValue = 'B-ready' is
set), and finally control returns to index.ts.

By the time index.ts calls callReadBValueLater() -- which calls
readBValueLater() inside a.ts -- the entire module graph has long
since finished loading. a.ts's live binding to bValue now correctly
resolves to 'B-ready', because the read happens inside a FUNCTION
BODY, deferred until well after both modules finished initializing,
rather than at either module's own top level during the circular
initialization sequence.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if module A imports a value from module B that hasn\'t been exported yet (due to a circular import), that import simply fails or throws an error, the same way importing a genuinely nonexistent export would.',
      reality: 'a circular import doesn\'t fail or throw — the binding exists and is wired up correctly, but its VALUE is temporarily undefined at the moment it\'s read too early, and correctly becomes defined once the exporting module finishes running.',
    },
    {
      thought: 'once a circularly-imported value shows up as undefined the first time it\'s read, it stays undefined for the rest of the program — the live binding is somehow "broken" by the circular reference.',
      reality: 'the live binding is never broken — reading the SAME import later (typically from inside a function called after the module graph finishes loading) correctly returns the real, fully-initialized value; only a TOP-LEVEL read during the circular initialization sequence risks seeing undefined.',
    },
    {
      thought: 'the safest way to avoid circular import bugs is to just avoid importing anything from a module that might import you back — as long as neither file\'s top level reads a value FROM the other circularly, the specific ORDER the two modules initialize in doesn\'t matter.',
      reality: 'the order absolutely matters if either module reads an imported value at its own top level — deferring that read into a function body (called only after the whole module graph has settled) is what actually neutralizes the risk, not merely "hoping" the initialization order works out.',
    },
  ];
}
