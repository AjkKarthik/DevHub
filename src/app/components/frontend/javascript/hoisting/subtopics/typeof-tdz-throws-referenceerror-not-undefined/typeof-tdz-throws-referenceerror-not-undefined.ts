import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-typeof-tdz-throws-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './typeof-tdz-throws-referenceerror-not-undefined.html',
  styleUrl: './typeof-tdz-throws-referenceerror-not-undefined.scss',
})
export class TypeofTdzThrowsReferenceerrorNotUndefinedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Calls This "a Common Misconception" — Worth Seeing Both Cases Side by Side',
      points: [
        'The QnA section states: "typeof is normally \'safe\' for undeclared variables (returns \'undefined\'). But for let/const in the TDZ, typeof throws a ReferenceError." Mistake #3 shows a code snippet illustrating the bug, but the reader never sees the ACTUAL thrown error message, or a genuinely undeclared variable\'s safe result right next to it for direct comparison.',
        'This subtopic runs <code>typeof</code> on a completely undeclared identifier (never declared ANYWHERE in the file) and on a <code>let</code> variable accessed before its own declaration line, catching any thrown error, to show the real outcome of each — not just described in prose.',
      ],
    },
    {
      heading: 'Why typeof Behaves Differently for These Two Cases',
      points: [
        '<code>typeof</code> was specifically designed, decades ago, to be a SAFE way to check for the existence of a variable that might not exist at all — this is why <code>typeof completelyUndeclaredThing === "undefined"</code> never throws, even though directly referencing <code>completelyUndeclaredThing</code> (without <code>typeof</code>) WOULD throw a ReferenceError.',
        'A <code>let</code>/<code>const</code> variable in its TDZ is a fundamentally different situation: the engine already KNOWS this identifier exists in the current scope (it was hoisted, just not yet initialized) — so this isn\'t the "maybe this doesn\'t exist at all" case <code>typeof</code>\'s safety was designed for. The TDZ\'s entire purpose is to make ANY access before initialization loud and immediate, and the spec deliberately makes <code>typeof</code> obey that rule too, rather than carving out a silent exception for it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>typeof and TDZ demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// ── Case 1: a completely undeclared identifier ──────────────────
// (neverDeclaredAnywhere does not appear anywhere else in this file)
try {
  // @ts-ignore -- deliberately referencing an identifier with no declaration anywhere, to test typeof's real runtime behavior
  console.log('typeof on a TRULY undeclared variable:', typeof neverDeclaredAnywhere);
} catch (err) {
  console.log('typeof on undeclared variable THREW:', (err as Error).message);
}

// ── Case 2: a let variable accessed via typeof, before its own declaration line ──
function checkTdzVariable() {
  try {
    // @ts-ignore -- deliberately accessing tdzVar before its own declaration line, still within the same block, to observe the real TDZ behavior
    console.log('typeof on a let variable IN ITS OWN TDZ:', typeof tdzVar);
  } catch (err) {
    console.log('typeof on TDZ variable THREW:', (err as Error).message);
  }
  let tdzVar = 42;
  return tdzVar;
}
checkTdzVariable();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare the two results: typeof on a truly undeclared variable, and typeof on a let variable accessed before its own declaration line inside the same function.',
    hint: 'Does the engine know the identifier exists at all in each case? That distinction is exactly what determines whether typeof stays "safe" or throws.',
    solution: `Case 1 (truly undeclared): "typeof on a TRULY undeclared
variable: undefined" -- no error at all. This confirms typeof's
long-standing safety guarantee for identifiers the engine has no
knowledge of whatsoever, anywhere in the accessible scope chain.

Case 2 (let variable in its own TDZ): "typeof on TDZ variable
THREW: Cannot access 'tdzVar' before initialization" -- a real,
genuine ReferenceError, caught by the try/catch. This is NOT the
same as the "safe undefined" result from Case 1, even though both
scenarios might sound similar at first ("the variable isn't
available yet").

The distinguishing factor: in Case 1, the engine has zero knowledge
of neverDeclaredAnywhere in any reachable scope -- it could be a
typo, a missing import, anything. In Case 2, the engine DOES know
tdzVar exists (it was hoisted to the top of checkTdzVariable's
function body) -- it simply hasn't been initialized yet, and the TDZ
rule says accessing it in ANY way (including via typeof) before that
initialization is an error, precisely to surface the out-of-order
access immediately rather than let it slide through as if the
variable didn't exist.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'typeof is universally "safe" — it never throws for any variable, declared or not, which is the whole reason to use it over directly referencing the variable.',
      reality: 'typeof\'s safety guarantee specifically covers TRULY UNDECLARED identifiers — for a let/const variable that IS declared in the current scope but hasn\'t reached its initialization yet (the TDZ), typeof throws a real ReferenceError just like directly referencing it would.',
    },
    {
      thought: 'a let variable "in its TDZ" and a "truly undeclared" variable are functionally the same thing from typeof\'s perspective — both represent "this doesn\'t exist yet."',
      reality: 'they are fundamentally different to the engine — a TDZ variable is a KNOWN identifier in the current scope that is simply uninitialized, while a truly undeclared variable has no binding anywhere in the accessible scope chain at all.',
    },
    {
      thought: 'this typeof/TDZ distinction is a rare edge case unlikely to come up in real code, since most code just checks "typeof x !== \'undefined\'" for feature detection.',
      reality: 'this exact pattern (feature-detecting with typeof before a variable\'s own declaration, perhaps due to code reordering or a refactor) is precisely the scenario Mistake #3 describes — it is a realistic, not contrived, way to trip over this distinction.',
    },
  ];
}
