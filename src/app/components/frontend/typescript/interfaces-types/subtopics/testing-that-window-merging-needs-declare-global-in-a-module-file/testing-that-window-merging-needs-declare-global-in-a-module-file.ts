import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-window-merging-declare-global-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-window-merging-needs-declare-global-in-a-module-file.html',
  styleUrl: './testing-that-window-merging-needs-declare-global-in-a-module-file.scss',
})
export class TestingThatWindowMergingNeedsDeclareGlobalInAModuleFileSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Example, and What It Doesn\'t Mention',
      points: [
        'The "Declaration Merging" code tab shows: <code>interface Window { myPlugin: { version: string } }</code> followed by <code>window.myPlugin.version; // ✅ now typed</code> — presented as if simply writing this interface anywhere merges it with the global <code>Window</code> type.',
        'That is true ONLY in a "script" file — one with no top-level <code>import</code> or <code>export</code> statement. The moment a <code>.ts</code> file has ANY top-level <code>import</code>/<code>export</code>, TypeScript treats it as a MODULE, and every declaration inside it — including <code>interface Window { ... }</code> — becomes scoped to that module, not the global scope. It silently stops merging with the real global <code>Window</code> interface.',
      ],
    },
    {
      heading: 'Why This Matters in Practice',
      points: [
        'The overwhelming majority of real TypeScript files in a modern project (Angular, React, Node with ESM, anything using a bundler) DO have top-level <code>import</code>/<code>export</code> statements — they are modules by default. Pasting the main page\'s exact example into any typical project file produces no error, no warning — it just silently creates an unrelated, module-scoped <code>Window</code> type that never actually augments the global one, and <code>window.myPlugin</code> remains untyped everywhere else in the project.',
        'The fix is <code>declare global</code>: wrapping the interface merge in <code>declare global { interface Window { myPlugin: { version: string } } }</code> explicitly tells TypeScript "treat what\'s inside this block as global scope, even though this file is a module." This is the standard, documented pattern for augmenting global types from within a module — and it is what the main page\'s example is implicitly assuming, without ever showing it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Window merging — script vs module scope</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// This file has a top-level 'export' below, making it a MODULE --
// exactly like almost every real-world .ts file in a bundled project.

// ── The main page's exact example, run inside THIS module file ─────────────
interface Window {
  myPlugin: { version: string };
}
// This interface is now scoped to THIS MODULE ONLY -- it does NOT
// merge with the real global Window interface, because this file
// has a top-level 'export' statement further down.

// (window as any).myPlugin = { version: '1.0' };  // set at runtime for the demo
// window.myPlugin.version;
// uncomment the line above: ERROR -- Property 'myPlugin' does not
// exist on type 'Window & typeof globalThis'. The main page's own
// "// ✅ now typed" comment does not hold true in a module file.

// ── The fix: declare global ──────────────────────────────────────────────
declare global {
  interface Window {
    myPlugin: { version: string };
  }
}
(window as any).myPlugin = { version: '2.0' };
console.log(window.myPlugin.version);  // ✅ genuinely typed now -- "2.0"

export {};  // the top-level export that makes this file a module
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Delete the `export {};` line at the bottom of the playground above (making the file a plain script again, with no top-level import/export), then re-comment the declare global block and un-comment the earlier plain `interface Window { ... }` block\'s usage lines. Does window.myPlugin.version type-check now?',
    hint: 'The presence or absence of ANY top-level import/export statement in the file — not anything about the interface declaration itself — determines whether TypeScript treats the file as a module or a script.',
    solution: `Yes -- once the file has no top-level import or export statement
at all, it is a "script" file rather than a module, and TypeScript
treats every top-level declaration (including a plain
interface Window { ... }) as GLOBAL scope automatically. In that
configuration, the main page's exact example works precisely as
shown, with no declare global needed.

The moment ANY top-level import or export statement is added back
-- even one unrelated to Window entirely, like export {} at the end
of a file, or importing a single utility function -- the file
becomes a module, and a plain interface Window { ... } silently
stops merging with the global type. Since real-world TypeScript
projects are almost always built entirely from modules, declare
global is the pattern actually needed in practice, even though the
main page's example never shows it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'writing `interface Window { myPlugin: ... }` anywhere in a TypeScript project merges it with the global Window type, as long as the syntax is correct.',
      reality: 'whether it merges globally depends entirely on whether the FILE containing it is a script (no top-level import/export) or a module (has one) — the exact same interface declaration behaves completely differently depending on that one file-level property.',
    },
    {
      thought: 'adding an unrelated `import` or `export` statement to a file for some other reason is a purely local change that couldn\'t possibly affect an interface declaration elsewhere in the same file.',
      reality: 'adding ANY top-level import/export flips the entire file from script mode to module mode, silently changing the scoping behavior of every other top-level declaration in that file, including interface merges that used to be global.',
    },
    {
      thought: 'if TypeScript accepts a global interface augmentation without any error, it must be correctly merging with the real global type.',
      reality: 'in a module file, a plain (non-`declare global`) interface Window { ... } compiles with zero errors and zero warnings — it just silently creates a separate, module-scoped, functionally inert type instead of augmenting the real global one; the absence of an error is not confirmation that the merge worked.',
    },
  ];
}
