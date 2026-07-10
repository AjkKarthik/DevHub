import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-skiplibcheck-only-skips-dts-extension-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-skiplibcheck-only-skips-d-ts-extension-not-content.html',
  styleUrl: './testing-that-skiplibcheck-only-skips-d-ts-extension-not-content.scss',
})
export class TestingThatSkiplibcheckOnlySkipsDTsExtensionNotContentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Describes skipLibCheck in Terms of ".d.ts Files"',
      points: [
        'The theory section says: <code>skipLibCheck: true</code> "skips type-checking all <code>.d.ts</code> files — both @types packages and generated declarations." A quiz question reinforces this: it silences errors "in third-party <code>.d.ts</code> files ... including in your own generated declaration files."',
        'Every description ties the skip to the phrase "declaration files." A reasonable reading is that TypeScript is exempting files based on what they CONTAIN — pure type declarations, no runtime logic. This subtopic tests whether that\'s actually true, or whether the rule is purely about the file EXTENSION.',
      ],
    },
    {
      heading: 'skipLibCheck Is Extension-Gated, Not Content-Gated',
      points: [
        '<code>skipLibCheck</code> is applied by the compiler based on whether a file\'s name ends in <code>.d.ts</code> — full stop. It has no logic that inspects a file\'s contents to decide "this looks like a declaration file" and exempt it on that basis.',
        'A regular <code>.ts</code> file that happens to contain nothing but <code>declare</code> statements — no runtime code, no exports, purely type-level content that LOOKS exactly like a hand-written <code>.d.ts</code> file — is still fully type-checked under <code>skipLibCheck: true</code>, because its extension is <code>.ts</code>, not <code>.d.ts</code>.',
        'This matters for teams that (intentionally or by habit) put ambient <code>declare</code> blocks directly into a <code>.ts</code> file instead of a proper <code>.d.ts</code> file — those declarations get NO free pass from <code>skipLibCheck</code>, and any error inside them will still surface, unlike the identical content saved with a <code>.d.ts</code> extension.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "skipLibCheck": true
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>skipLibCheck extension vs content</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'broken.d.ts',
      content: `// A genuine .d.ts file with an intentional error -- referencing a
// type name that does not exist anywhere in this project:
declare const fromRealDts: DoesNotExistAnywhere;
`,
    },
    {
      path: 'broken-lookalike.ts',
      content: `// The EXACT same content, saved with a .ts extension instead.
// It contains nothing but a declare statement -- no runtime code,
// no exports -- it "looks like" a declaration file in every way
// except its file extension:
declare const fromLookalikeTs: DoesNotExistAnywhere;
`,
    },
    {
      path: 'index.ts',
      content: `// Both broken.d.ts and broken-lookalike.ts reference an undefined
// type name, DoesNotExistAnywhere. With skipLibCheck: true active
// (see tsconfig.json), does either of them produce a compile error?

console.log('index.ts loaded -- check the Problems/errors panel for broken.d.ts and broken-lookalike.ts');

// Prediction to test:
// - broken.d.ts:          skipLibCheck exempts it (real .d.ts extension)
// - broken-lookalike.ts:  NOT exempt -- same content, wrong extension
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Check the StackBlitz editor for compile errors on `broken.d.ts` and `broken-lookalike.ts` — both files declare a reference to the same nonexistent type, `DoesNotExistAnywhere`. Which one is flagged?',
    hint: '`skipLibCheck` is documented in terms of ".d.ts files" — test whether that means "files that look like declarations" or specifically "files whose name ends in .d.ts".',
    solution: `broken.d.ts shows no error -- skipLibCheck: true exempts it purely
because its filename ends in .d.ts, exactly as the main page's theory
section describes.

broken-lookalike.ts DOES show an error: "Cannot find name
'DoesNotExistAnywhere'." -- even though its content is byte-for-byte
identical in spirit to broken.d.ts (a single declare statement, no
runtime code), skipLibCheck gives it no exemption at all, because the
compiler's rule keys on the file EXTENSION, not on what the file
contains.

The practical lesson: "skipLibCheck skips declaration files" is
accurate but easy to over-generalize into "skipLibCheck skips
declaration-shaped content." It doesn't. A stray declare block placed
in a regular .ts file (a common shortcut when a proper .d.ts file
wasn't set up) gets full type-checking, while the identical content
in a real .d.ts file gets none -- the exact same DoesNotExistAnywhere
typo behaves completely differently depending purely on which of the
two files it was typed into.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`skipLibCheck: true` exempts any file whose content is purely type declarations — the "lib" in its name refers to declaration-style content, not a specific file extension.',
      reality: '`skipLibCheck` keys strictly on the `.d.ts` file extension — a `.ts` file containing nothing but `declare` statements gets zero exemption and is fully type-checked, despite looking identical in spirit to a real declaration file.',
    },
    {
      thought: 'if a type error is invisible with `skipLibCheck: true` in one file, the same error text would be invisible anywhere else it appears in the project.',
      reality: 'the exact same undefined-type-name error is silenced in a `.d.ts` file but fully reported in a `.ts` file with identical content — visibility depends entirely on which file the code was typed into, not on the error itself.',
    },
    {
      thought: 'moving ambient `declare` blocks out of a proper `.d.ts` file and into a regular `.ts` file (e.g. to co-locate them with related code) is a purely stylistic choice with no effect on type-checking.',
      reality: 'that move strips away the `skipLibCheck` exemption entirely — declarations that previously had errors silenced will now surface those errors, which can turn a clean build into a suddenly-failing one after what looked like a harmless file reorganization.',
    },
  ];
}
