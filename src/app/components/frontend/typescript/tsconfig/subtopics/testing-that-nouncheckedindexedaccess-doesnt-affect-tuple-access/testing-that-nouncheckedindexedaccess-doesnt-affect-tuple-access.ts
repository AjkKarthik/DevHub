import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nouncheckedidx-tuple-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-nouncheckedindexedaccess-doesnt-affect-tuple-access.html',
  styleUrl: './testing-that-nouncheckedindexedaccess-doesnt-affect-tuple-access.scss',
})
export class TestingThatNouncheckedindexedaccessDoesntAffectTupleAccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s One Example — a Plain Array',
      points: [
        'The Strict mode sub-flags tab shows exactly one <code>noUncheckedIndexedAccess</code> example: <code>const arr: string[] = [\'a\', \'b\']; const first = arr[0]; // type: string | undefined</code> — a plain, open-ended array where TypeScript genuinely cannot know at compile time whether index 0 exists.',
        'This subtopic tests a structurally different case the page never shows: a TUPLE, whose length and per-position types ARE fully known at compile time. Does <code>noUncheckedIndexedAccess</code> add <code>| undefined</code> to a literal, in-bounds tuple index the same way it does for a plain array?',
      ],
    },
    {
      heading: 'Why Tuples Are Exempt for In-Bounds Literal Indices',
      points: [
        'The entire justification for <code>noUncheckedIndexedAccess</code> is that TypeScript CANNOT statically verify an arbitrary index expression is within bounds for an open-ended <code>T[]</code> or <code>Record&lt;string, T&gt;</code>. A tuple type like <code>[string, number]</code> is the opposite case — its length and the type at every valid position are fully known and checked at compile time.',
        'Accessing <code>pair[0]</code> where <code>pair: [string, number]</code> with a literal <code>0</code> is exactly analogous to accessing a named property on an object type — TypeScript already GUARANTEES (via the tuple type itself) that position 0 exists and holds a <code>string</code>. There is nothing "unchecked" about it, so the flag has nothing to add there.',
        'The flag DOES still apply if you index a tuple with a non-literal, computed <code>number</code>-typed variable (<code>pair[i]</code> where <code>i: number</code>) instead of a literal in-range index — at that point TypeScript can no longer prove the index is in bounds, and the same <code>| undefined</code> widening from the array case applies.',
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
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>noUncheckedIndexedAccess and tuples</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own array example -- adds | undefined, as documented
const arr: string[] = ['a', 'b'];
const first = arr[0]; // type: string | undefined
// first.toUpperCase(); // would be an error here -- first might be undefined

// This subtopic's test: a TUPLE with a literal, in-bounds index
const pair: [string, number] = ['x', 1];
const name = pair[0]; // does THIS get | undefined too, or stay plain string?
console.log('name.toUpperCase() should compile if name is plain string:', name.toUpperCase());

// Compare: indexing the SAME tuple with a non-literal, computed index
function getAt(t: [string, number], i: number) {
  return t[i]; // i is NOT a literal in-bounds index -- what type does TS give here?
}
const value = getAt(pair, 0);
// value.toString(); // does this compile, or does TS demand a guard first?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `value.toString();`. Does it compile? Compare against `name.toUpperCase()` a few lines above, which compiles cleanly with no guard.',
    hint: 'TypeScript only knows an index is safely in-bounds when the index itself is a literal number matching a known tuple position -- a variable-typed index (i: number) loses that guarantee, exactly like a plain array.',
    solution: `name.toUpperCase() compiles with zero errors -- pair[0] with a
literal 0 keeps its exact tuple-position type, string, completely
unaffected by noUncheckedIndexedAccess.

value.toString() FAILS to compile: "Object is possibly 'undefined'."
-- because getAt's t[i] uses a computed, non-literal index (i:
number), which TypeScript cannot verify is in-bounds for the tuple
at compile time. This falls back to the exact same | undefined
widening the main page's own arr[0] example demonstrates for plain
arrays.

The distinguishing factor is not "is this a tuple or an array" --
it's "does TypeScript have a specific, literal position it can prove
is valid." A tuple accessed with a literal in-range index is exempt;
the same tuple accessed with a variable index is not, and neither
is a plain array under any circumstances (since arrays have no
fixed, known length at the type level).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`noUncheckedIndexedAccess` adds `| undefined` to any indexed-access expression uniformly, based on whether the value is stored in some kind of array-like or object-like structure.',
      reality: 'the flag specifically targets accesses TypeScript CANNOT statically prove are in-bounds — a tuple accessed with a literal, in-range index is exempt, because the tuple\'s own type already guarantees that position exists.',
    },
    {
      thought: 'once a value is typed as a tuple, ALL indexed access into it is exempt from `noUncheckedIndexedAccess`, since tuples have "known" contents.',
      reality: 'only LITERAL, in-bounds index access is exempt — indexing the same tuple with a variable, computed `number`-typed index loses that static guarantee and falls back to the same `| undefined` widening a plain array gets.',
    },
    {
      thought: 'the main page\'s single array example fully represents how `noUncheckedIndexedAccess` behaves across every kind of indexed structure in TypeScript.',
      reality: 'tuples behave meaningfully differently for literal indices specifically because they carry more precise compile-time information than a plain `T[]` — a distinction the page\'s one example never has occasion to show.',
    },
  ];
}
