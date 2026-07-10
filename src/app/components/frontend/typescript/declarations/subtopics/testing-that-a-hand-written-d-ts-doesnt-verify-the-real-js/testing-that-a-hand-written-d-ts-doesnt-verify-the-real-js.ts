import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-hand-written-dts-no-verify-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-hand-written-d-ts-doesnt-verify-the-real-js.html',
  styleUrl: './testing-that-a-hand-written-d-ts-doesnt-verify-the-real-js.scss',
})
export class TestingThatAHandWrittenDTsDoesntVerifyTheRealJsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s chart-lite and date-utils Examples Are Never Checked Against Real Code',
      points: [
        'The "Writing a .d.ts for a JS library" section and the challenge both write ambient declarations for an IMAGINARY library — <code>chart-lite</code>, <code>date-utils</code> — that has no actual JavaScript implementation anywhere on the page. The declarations are presented as correct by assertion, never verified against real behavior.',
        'This subtopic makes that gap concrete: write a real, tiny, UNTYPED <code>.js</code> file (simulating a genuine JS-only library), pair it with a deliberately WRONG hand-written <code>.d.ts</code>, and see whether TypeScript catches the mismatch anywhere.',
      ],
    },
    {
      heading: 'Why TypeScript Cannot Catch a Wrong Hand-Written Declaration',
      points: [
        'A <code>.d.ts</code> file is a pure ASSERTION — a claim about what a module exports, with zero connection to any actual implementation TypeScript could cross-check it against. For an untyped <code>.js</code> file, TypeScript does not read the JavaScript\'s logic at all when a matching <code>declare module</code> block exists; it trusts the declaration completely.',
        'This means a hand-written declaration can describe a function signature that has NOTHING to do with what the real function actually does — wrong parameter types, wrong parameter order, wrong return type — and TypeScript will type-check every call site as if the declaration were ground truth, because as far as the type-checker is concerned, it IS the ground truth.',
        'The compiler-generated case is different and safe: when <code>declaration: true</code> auto-generates a <code>.d.ts</code> FROM your own <code>.ts</code> source (the "Library output" section elsewhere on this page), the declaration is mechanically derived from the real implementation — it cannot drift out of sync, because it is not hand-maintained at all. The risk is specific to HAND-WRITING declarations for pre-existing JavaScript.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Hand-written .d.ts vs the real JS</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'mini-lib.js',
      content: `// A genuinely untyped, plain JavaScript "library" -- exactly the
// kind of thing the main page's chart-lite/date-utils examples
// are meant to represent, but this one is REAL and RUNS.
export function greet(name) {
  return 'Hello, ' + name + '!';
}
`,
    },
    {
      path: 'mini-lib.d.ts',
      content: `// A hand-written declaration for mini-lib.js -- following the main
// page's own "Writing a .d.ts for a JS library" pattern exactly,
// but with a DELIBERATELY WRONG parameter type
declare module './mini-lib.js' {
  export function greet(loud: boolean): string; // WRONG -- the real function takes a name string
}
`,
    },
    {
      path: 'index.ts',
      content: `import { greet } from './mini-lib.js';

// TypeScript believes greet takes a boolean, per the (wrong) .d.ts.
// Does this compile?
const result = greet(true);
console.log('result of greet(true):', result);
// What does the REAL, untyped JavaScript function actually do with
// "true" as its argument, given it does 'Hello, ' + name + '!'?

// A second call, "correctly" typed per the wrong declaration:
const result2 = greet(false);
console.log('result of greet(false):', result2);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Predict the exact string result and result2 will hold before running. Then explain why TypeScript raised zero errors anywhere in this file, despite the declaration being completely wrong.',
    hint: 'JavaScript string concatenation (\'Hello, \' + name + \'!\') coerces ANY value to a string -- including the boolean true/false -- so the real function runs without crashing, just producing a nonsensical result.',
    solution: `result logs "Hello, true!" and result2 logs "Hello, false!" --
the real JavaScript function just concatenates whatever value it
receives into a string, regardless of what the .d.ts claims the
parameter type should be. Passing true or false works "fine" at
runtime (no crash), just producing meaningless output, because
JavaScript's + operator silently converts booleans to the strings
"true"/"false".

TypeScript raises zero errors anywhere in index.ts because, as far
as the type-checker is concerned, greet(loud: boolean): string IS
the correct, complete truth about mini-lib.js -- there is no
mechanism to cross-check a hand-written .d.ts against the JavaScript
file it describes.

This is precisely why the main QnA section recommends installing
@types/xxx (community-maintained, widely used, more likely to be
caught wrong by many users) over hand-writing your own, and why
compiler-generated .d.ts files (from your own .ts source via
declaration: true) carry none of this risk -- they are mechanically
derived from code that actually runs, not asserted by hand.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a hand-written `.d.ts` file compiles without errors and its usage examples "type-check successfully" (like the main page\'s own chart-lite and date-utils examples), that is meaningful evidence the declaration is correct.',
      reality: 'a `.d.ts` file compiling cleanly only proves it is internally CONSISTENT with itself and its own usage — it proves nothing about whether it accurately describes the REAL JavaScript implementation, since TypeScript never reads or checks against that implementation when a `declare module` block is present.',
    },
    {
      thought: 'this hand-written-declaration risk is roughly the same as any other TypeScript typing mistake — annoying but no different in kind from getting a type wrong in your own regular TypeScript code.',
      reality: 'ordinary TypeScript code gets its types checked against actual, connected implementation code (the compiler verifies your function bodies match their declared signatures) — a hand-written `.d.ts` for pre-existing JS has NO such connection at all, making it a fundamentally different, unchecked category of risk.',
    },
    {
      thought: 'this only matters for exotic edge cases — in practice, hand-written declarations for real libraries are reliably accurate.',
      reality: 'this is precisely why DefinitelyTyped (`@types/*`) exists as a community-maintained alternative to writing your own — the risk is real and common enough that a whole ecosystem exists specifically to centralize and vet these hand-written declarations rather than leaving every project to write and trust its own.',
    },
  ];
}
