import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-exhaustiveness-compiler-error-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-the-exact-compiler-error-when-a-new-shape-variant-is-added.html',
  styleUrl: './demonstrating-the-exact-compiler-error-when-a-new-shape-variant-is-added.scss',
})
export class DemonstratingTheExactCompilerErrorWhenANewShapeVariantIsAddedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the main page shows vs. what it doesn\'t',
      points: [
        'The main topic\'s exhaustiveness example defines a Shape union with "circle" and "square", then a switch that handles both, ending with <code>const _exhaustive: never = s;</code> in the default case. The theory text explains, in words, that adding a new Shape member without updating the switch "reports an error at the assertNever(x) call" — but the page never actually shows what that error looks like, or exactly where it points.',
        'This subtopic adds the third Shape variant the main page never adds, and looks at the exact compiler error TypeScript produces — this is the single most useful skill for actually using this pattern day to day: recognizing that specific error message immediately tells you "a switch somewhere is missing a case for this new type," even before you\'ve found which switch.',
      ],
    },
    {
      heading: 'Reading the exhaustiveness error',
      points: [
        'When a union gains a new member and a switch statement using the never-assignment pattern is not updated, TypeScript reports the error at the <code>const _exhaustive: never = s;</code> line specifically — not at the switch statement itself, and not at the call sites of the function. The error message names the exact excess type that could not be narrowed away: <code>Type \'{ kind: "triangle"; base: number; height: number; }\' is not assignable to type \'never\'.</code>',
        'This is a genuinely useful debugging signal: if you see "is not assignable to type \'never\'" anywhere in your build output, the fix is almost always "go to that exact line, and add a case for whatever type is named in the error" — you don\'t need to hunt for which switch statement is incomplete, the compiler points at the precise unhandled variant.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Exhaustiveness checking</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };
  // Try adding a third member here, e.g.:
  // | { kind: "triangle"; base: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default:
      // If Shape gains a member not handled above, TypeScript cannot
      // narrow 's' down to 'never' here -- and reports an error on
      // THIS line, naming the exact unhandled shape.
      const _exhaustive: never = s;
      throw new Error("Unhandled shape: " + JSON.stringify(_exhaustive));
  }
}

console.log(area({ kind: "circle", radius: 2 }));
console.log(area({ kind: "square", side: 3 }));

// ── Try it: add a "triangle" member to the Shape union above, but
// DON'T add a matching case to the switch. Read the red squiggle on
// the "const _exhaustive: never = s;" line -- that is the exact
// error the main page describes only in prose.
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third Shape variant, { kind: "triangle"; base: number; height: number }, to the union in the playground above — but do NOT add a matching case to the switch statement. Read the exact error TypeScript reports, then fix it two different ways: (1) add the missing case, (2) instead, add a fourth Shape variant and see whether the SAME error reappears without you touching the switch again.',
    hint: 'The error appears on the `const _exhaustive: never = s;` line, not on the switch statement itself or on the Shape type definition — look there first.',
    solution: `Adding "triangle" to the Shape union without updating the switch
produces exactly one error, on the const _exhaustive: never = s;
line: "Type '{ kind: \\"triangle\\"; base: number; height: number; }'
is not assignable to type 'never'." Nothing else in the file
reports an error -- not the switch statement, not the area()
function signature, not the call sites.

Adding the case case "triangle": return 0.5 * s.base * s.height;
resolves it immediately, since s is now fully narrowed to never in
the default branch again. Adding a FOURTH variant without a
matching case reproduces the identical error shape, just naming the
new variant instead -- confirming the pattern scales to any number
of union members without ever needing to remember to "check for
completeness" manually; the compiler does it on every build.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the exhaustiveness check fires as a warning on the switch statement itself, similar to how an IDE might underline an incomplete switch.',
      reality: 'the error appears specifically at the `const _exhaustive: never = s;` assignment inside the default case — TypeScript reports it as an assignability error at that exact line, not as a generic "incomplete switch" warning on the switch keyword.',
    },
    {
      thought: 'the exhaustiveness pattern only helps you when you are the one WRITING the new union member — it does not help catch bugs introduced by someone else\'s change.',
      reality: 'this is precisely the scenario the pattern protects against: a teammate adds a new Shape variant somewhere else in the codebase, and every never-assignment switch that doesn\'t handle it fails to compile immediately, regardless of who wrote the original switch.',
    },
    {
      thought: 'if the exhaustiveness check passes (no error), the switch statement is guaranteed to handle every case correctly at runtime.',
      reality: 'the check only guarantees every union MEMBER has a matching case — it says nothing about whether that case\'s LOGIC is correct. A case that returns the wrong value for its shape still compiles cleanly; exhaustiveness checking is about coverage, not correctness.',
    },
  ];
}
