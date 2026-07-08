import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-minmax-without-return-type-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-minmax-without-return-type-becomes-an-array.html',
  styleUrl: './testing-that-minmax-without-return-type-becomes-an-array.scss',
})
export class TestingThatMinmaxWithoutReturnTypeBecomesAnArraySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Example, Minus One Detail',
      points: [
        'The Tuple Use Cases section defines <code>function minMax(nums: number[]): [number, number] { return [Math.min(...nums), Math.max(...nums)]; }</code> — note the explicit <code>: [number, number]</code> return type annotation. Common Mistake #4 separately explains, using a DIFFERENT function (<code>getCoords</code>), that TypeScript infers array literals as <code>T[]</code>, not tuples, when no annotation is given.',
        'This subtopic connects those two: take the main page\'s own <code>minMax</code> function and remove its return type annotation. Does the destructuring usage still "work"? And what protection is actually lost?',
      ],
    },
    {
      heading: 'What Changes When the Annotation Is Removed',
      points: [
        'Without <code>: [number, number]</code>, TypeScript infers <code>minMax</code>\'s return type from the <code>return</code> statement\'s array literal: <code>[Math.min(...nums), Math.max(...nums)]</code>, both <code>number</code>-typed expressions, giving the inferred type <code>number[]</code> — a variable-length array, not a fixed-length pair.',
        'The destructuring call site, <code>const [min, max] = minMax(...)</code>, compiles identically either way — JavaScript array destructuring doesn\'t care whether the source is a 2-tuple or an open-ended array, and TypeScript permits destructuring more elements than a plain array type formally guarantees exist (arrays don\'t carry a compile-time length the way tuples do).',
        'The real difference shows up in code TypeScript SHOULD reject but doesn\'t: indexing past position 1. For the tuple-typed version, <code>result[2]</code> is a compile error ("Tuple type ... of length 2 has no element at index 2"). For the inferred <code>number[]</code> version, <code>result[2]</code> type-checks fine as <code>number</code> — even though at runtime it is <code>undefined</code>, because the array genuinely only has two elements.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Tuple annotation vs inferred array</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own function, WITH its explicit tuple return type
function minMaxTuple(nums: number[]): [number, number] {
  return [Math.min(...nums), Math.max(...nums)];
}
const tupleResult = minMaxTuple([3, 1, 4, 1, 5]);
const [tMin, tMax] = tupleResult;
console.log('tuple version:', tMin, tMax);

// tupleResult[2];
// Uncomment the line above -- compile error:
// "Tuple type '[number, number]' of length '2' has no element at index '2'."

// ── The same function, with the return type annotation removed ─────────────
function minMaxInferred(nums: number[]) {
  return [Math.min(...nums), Math.max(...nums)]; // inferred: number[]
}
const arrayResult = minMaxInferred([3, 1, 4, 1, 5]);
const [aMin, aMax] = arrayResult; // destructuring still "works" identically
console.log('inferred version:', aMin, aMax);

// Compare: this compiles fine on the inferred number[] version...
console.log('arrayResult[2] compiles, and is actually:', arrayResult[2]); // undefined
// ...but the equivalent tupleResult[2] above is a COMPILE ERROR, not just
// a runtime undefined -- that's the protection the explicit tuple
// annotation buys you.
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `tupleResult[2];` line in the playground. Read the exact compiler error. Then check: does `arrayResult[2]` (the inferred version) produce any compiler error at all?',
    hint: 'The tuple type carries a fixed length TypeScript checks at compile time; the inferred number[] type only carries an element type, with no length information at all.',
    solution: `Uncommenting tupleResult[2] gives:
"Tuple type '[number, number]' of length '2' has no element at
index '2'." -- a compile-time error, before the code ever runs.

arrayResult[2] produces NO compiler error. It type-checks as number,
and only reveals the problem at runtime, where it evaluates to
undefined (accessing past the end of a real 2-element array).

The explicit return type annotation on minMaxTuple isn't cosmetic --
it's the only thing enabling TypeScript to catch an out-of-bounds
tuple access at compile time. Drop the annotation, and the exact
same bug (reading a position that doesn't exist) silently becomes a
runtime-only problem, discoverable only by actually running the
code.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'since `const [min, max] = minMax(...)` destructures correctly either way, the explicit `: [number, number]` return type annotation on `minMax` is mostly decorative.',
      reality: 'the annotation is what makes out-of-bounds access (`result[2]`) a COMPILE-TIME error instead of a silent runtime `undefined` — destructuring the first two elements working either way hides that difference completely.',
    },
    {
      thought: 'TypeScript infers a fixed-length tuple from any array literal with a known, fixed number of elements, like `[Math.min(...nums), Math.max(...nums)]`.',
      reality: 'TypeScript infers `T[]` (open-ended) from array literal expressions by default regardless of how many elements are written — fixed-length tuple inference only happens with an explicit type annotation or `as const`, never automatically from a two-element literal.',
    },
    {
      thought: 'because arrays and tuples destructure identically and both "have two elements" at runtime, the type-level distinction between them doesn\'t really matter in practice.',
      reality: 'the distinction is exactly what changes whether a bug (like an accidental out-of-bounds read) is caught while writing the code or discovered later as a live `undefined` value — the same runtime behavior, with very different discoverability.',
    },
  ];
}
