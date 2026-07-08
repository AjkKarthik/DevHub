import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-const-enum-import-doesnt-throw-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-const-enum-import-doesnt-throw-in-this-playground.html',
  styleUrl: './testing-that-const-enum-import-doesnt-throw-in-this-playground.scss',
})
export class TestingThatConstEnumImportDoesntThrowInThisPlaygroundSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Claim',
      points: [
        'Common Mistake #3 shows a two-file example: <code>lib.ts</code> exports a <code>const enum Color</code>, <code>app.ts</code> imports it and is "built with esbuild/vite (isolatedModules: true)" — and the claim is that <code>console.log(Color.Red)</code> throws a runtime error, "Color is not defined."',
        'This subtopic splits the exact same two files into a real, separately-compiled two-file project and imports the const enum across the file boundary — without configuring <code>isolatedModules</code> — to see whether the failure the mistake describes actually happens by default.',
      ],
    },
    {
      heading: 'Why the Failure Needs a Specific Kind of Tool, Not Just "Two Files"',
      points: [
        'A whole-program TypeScript compiler (<code>tsc</code>, and this playground\'s default TypeScript template) type-checks and emits ALL files in the project together, with full knowledge of every declaration. When it sees <code>import { Color } from \'./lib\'</code> used only as <code>Color.Red</code>, it can look into <code>lib.ts</code>, resolve <code>Color.Red</code> to its literal value, and inline it directly into the emitted <code>app.js</code> — the same erasure a const enum gets within a single file.',
        'The failure described in the Common Mistake is specific to transpilers that process each file in ISOLATION — esbuild, Babel, and SWC (and the <code>isolatedModules</code> TypeScript flag that warns about code patterns those tools can\'t handle) compile one file at a time, with no visibility into what <code>./lib</code> actually exports. They can\'t inline a value they\'have never seen, so they either error or leave a dangling reference to a runtime object (<code>Color</code>) that was never emitted — because <code>const enum</code> declarations produce ZERO runtime code by design.',
        'The practical takeaway isn\'t "const enum across files is broken" — it\'s "const enum across files is broken specifically under per-file transpilation," which is what most modern bundlers (Vite, esbuild-based tooling) use by default. A plain <code>tsc</code>-only project, or this whole-program playground, doesn\'t hit it at all.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>const enum across files</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'lib.ts',
      content: `// lib.ts -- exactly matches the main page's Common Mistake #3 example
export const enum Color {
  Red  = 'red',
  Blue = 'blue',
}
`,
    },
    {
      path: 'index.ts',
      content: `// index.ts -- the main page's "app.ts", importing the const enum
// from a SEPARATE file, compiled by this whole-program TypeScript
// playground (no isolatedModules, no esbuild/Babel/SWC involved)
import { Color } from './lib';

console.log('Color.Red =', Color.Red);
// The main page's Common Mistake claims this throws:
// "Runtime error -- Color is not defined"
// Under THIS whole-program compiler, it does not -- tsc inlines
// Color.Red as the literal 'red' directly into the emitted JS,
// exactly as it would within a single file.

console.log('If you see this line, the import across files did not throw.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the StackBlitz project settings (or imagine a real repo) and picture running this same two-file setup through esbuild or Vite\'s dev server instead of tsc. What specifically would esbuild need to know that it can\'t get from looking at index.ts alone?',
    hint: 'esbuild transpiles index.ts without ever opening lib.ts. It needs to know that Color.Red should become the string \'red\' — but that mapping only exists inside lib.ts\'s declaration.',
    solution: `esbuild (and Babel, SWC) transpile each file independently for
speed -- index.ts is processed without reading lib.ts at all. To
inline Color.Red as 'red', the transpiler would need to already know
what Color.Red evaluates to, but that information lives entirely
inside lib.ts's const enum declaration, which esbuild never opens.

Two ways this fails in practice: TypeScript's own isolatedModules
flag detects the situation and refuses to compile it (a build-time
error, which is what the "isolatedModules: true" setting is FOR --
catching this before it ships). Without that flag active, some
bundlers instead emit a bare, unresolved import reference to a
runtime object named "Color" that const enum was specifically
designed to never generate -- producing the "Color is not defined"
runtime error the Common Mistake describes.

Either way, the root cause is the same: a per-file transpiler cannot
erase a const enum reference it has no visibility into. A
whole-program compiler like the one running this exact playground
does not have that limitation -- which is why the demo above prints
successfully instead of throwing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`const enum` exported from one file and imported in another is simply "broken" and should always be avoided in multi-file projects.',
      reality: 'it works correctly under a whole-program compiler like plain `tsc` (or this playground) — the failure is specific to per-file transpilers (esbuild, Babel, SWC) that never see the exporting file\'s declaration, which is exactly the situation `isolatedModules` exists to catch.',
    },
    {
      thought: 'the main page\'s Common Mistake example fails because of something inherently wrong with the TWO-FILE structure itself.',
      reality: 'the two-file structure is fine on its own — the failure requires BOTH a two-file (or more) structure AND a per-file transpiler in the build pipeline; this subtopic\'s identical two-file structure, compiled whole-program, does not fail.',
    },
    {
      thought: 'if `isolatedModules` is off, `const enum` across files is always safe.',
      reality: 'the flag only controls whether TypeScript itself WARNS you at compile time — if the actual JavaScript build step further down the pipeline (esbuild, Vite, Babel) still transpiles per-file, the runtime failure can still occur even with the flag off, since tsc\'s own emit was never what shipped to the browser.',
    },
  ];
}
