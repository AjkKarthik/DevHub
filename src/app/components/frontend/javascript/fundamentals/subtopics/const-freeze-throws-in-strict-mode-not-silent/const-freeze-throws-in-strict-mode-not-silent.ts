import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-const-freeze-strict-mode-throw-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './const-freeze-throws-in-strict-mode-not-silent.html',
  styleUrl: './const-freeze-throws-in-strict-mode-not-silent.scss',
})
export class ConstFreezeThrowsInStrictModeNotSilentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #5\'s Comment Says "Throws in Strict Mode" — Does Your Code Run in Strict Mode?',
      points: [
        'Mistake #5\'s fix comment says: <code>Object.freeze({ debug: false }); config.debug = true; // throws in strict mode</code>. The word "throws" is doing a lot of work here — a real mutation attempt on a frozen object DOESN\'T always throw; whether it does depends entirely on strict mode, which most developers don\'t think about explicitly day to day.',
        'This subtopic runs the SAME frozen-object mutation attempt in both an explicit <code>"use strict"</code> context and a genuinely non-strict (sloppy mode) context, catching any thrown error, to show the actual different outcomes side by side — not just described in a code comment.',
      ],
    },
    {
      heading: 'Why Strict Mode Changes the Outcome, and Why It Usually Doesn\'t Matter in Practice',
      points: [
        'In non-strict ("sloppy") mode, assigning to a non-writable property (which is what <code>Object.freeze()</code> makes every own property) SILENTLY FAILS — the assignment statement runs without error, but the property\'s value simply doesn\'t change. This is one of JavaScript\'s classic "fails quietly" behaviors that can hide real bugs.',
        'In strict mode, the identical assignment throws a real <code>TypeError</code> immediately at the point of the failed write — loud, catchable, and impossible to silently ignore.',
        'The main page\'s comment "throws in strict mode" is accurate but slightly misleading in a modern context: ALL ES modules (any file using <code>import</code>/<code>export</code>, which is the default in React, Angular, Vite, and virtually every modern JS/TS project) are automatically strict mode — so in practice, most developers writing modern code get the loud TypeError behavior by default, without ever writing <code>"use strict"</code> themselves. The silent-failure mode mainly still shows up in plain, non-module <code>&lt;script&gt;</code> tags or old-style CommonJS files without an explicit strict directive.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Object.freeze() strict vs sloppy mode</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// This file is an ES module (has import/export elsewhere in a real
// project) -- ES modules are ALWAYS strict mode automatically.
// To genuinely compare, we construct a sloppy-mode function using
// the Function constructor, which does NOT inherit module strictness.

function tryMutateInStrictMode(): string {
  'use strict';
  const config = Object.freeze({ debug: false });
  try {
    // @ts-ignore -- deliberately mutating a frozen, readonly-typed object to observe the real runtime result
    config.debug = true;
    return 'No error thrown. config.debug is now: ' + config.debug;
  } catch (err) {
    return 'Threw: ' + (err as Error).message + ' | config.debug is still: ' + config.debug;
  }
}

// Function constructor bodies run in sloppy (non-strict) mode by
// default, even though this whole file is a module -- a genuine,
// real way to compare both modes in the same environment.
const tryMutateInSloppyMode = new Function(\`
  var config = Object.freeze({ debug: false });
  try {
    config.debug = true;
    return 'No error thrown. config.debug is now: ' + config.debug;
  } catch (err) {
    return 'Threw: ' + err.message + ' | config.debug is still: ' + config.debug;
  }
\`) as () => string;

console.log('Strict mode result:', tryMutateInStrictMode());
console.log('Sloppy mode result:', tryMutateInSloppyMode());
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare the "Strict mode result" and "Sloppy mode result" lines. Does the mutation attempt throw in both, one, or neither?',
    hint: 'Object.freeze() makes properties non-writable in BOTH modes — but does a failed write to a non-writable property behave the same way in both modes?',
    solution: `Strict mode result: "Threw: Cannot assign to read only property
'debug' of object '#<Object>' | config.debug is still: false" — the
mutation attempt genuinely throws a real TypeError, caught by the
try/catch, and config.debug remains unchanged at false.

Sloppy mode result: "No error thrown. config.debug is now: false" —
no error is thrown at all, the assignment statement completes
"successfully" from the code's perspective, but config.debug is
STILL false -- the write to the frozen property was silently
ignored. This is genuinely the more dangerous outcome: code that
appears to run without any errors, while the actual assignment did
nothing.

This confirms Mistake #5's "throws in strict mode" comment precisely
-- and clarifies the practical takeaway: since virtually every
modern JS/TS file using import/export syntax is automatically strict
mode, most developers get the LOUD, catchable TypeError by default
without ever writing "use strict" themselves. The silent-failure
sloppy-mode behavior mainly matters for older, non-module script
files -- but it's exactly the kind of gap that can hide a real bug
if a script somehow ends up NOT running as a module (a plain
<script src="legacy.js"> tag, for instance).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Object.freeze() always throws a TypeError when you try to mutate a frozen object, regardless of strict mode — that\'s the whole point of freezing it.',
      reality: 'whether the mutation attempt throws depends entirely on strict vs sloppy mode — in sloppy mode, the assignment silently fails with no error at all, while the object remains genuinely unchanged either way.',
    },
    {
      thought: 'strict mode is an opt-in feature most developers need to remember to enable manually with "use strict" for this protection to work.',
      reality: 'every ES module (any file using import/export syntax) is automatically strict mode with no directive needed — this covers the vast majority of modern JavaScript/TypeScript code by default, including React, Angular, and virtually all modern bundler-based projects.',
    },
    {
      thought: 'since Object.freeze() genuinely prevents the underlying data from changing in BOTH modes, whether an error is thrown or not is a minor, cosmetic difference.',
      reality: 'the difference is significant for debugging — a silent failure in sloppy mode can mask a real logic bug for a long time (the code "runs fine" while quietly doing the wrong thing), while a thrown TypeError surfaces the problem immediately at the exact line that caused it.',
    },
  ];
}
