import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-deeppartials-depth-counter-makes-fields-required-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-deeppartials-depth-counter-makes-deep-fields-required.html',
  styleUrl: './testing-that-deeppartials-depth-counter-makes-deep-fields-required.scss',
})
export class TestingThatDeeppartialsDepthCounterMakesDeepFieldsRequiredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Fix Is Framed Purely as a Performance Win',
      points: [
        'Common Mistake #4 shows the unbounded <code>DeepPartial&lt;T&gt;</code> freezing the language server on deeply nested config objects, then "fixes" it with: <code>type Prev = [never, 0, 1, 2, 3, 4, 5]; type DeepPartial&lt;T, D extends number = 5&gt; = D extends 0 ? T : { [K in keyof T]?: T[K] extends object ? DeepPartial&lt;T[K], Prev[D]&gt; : T[K] };</code>',
        'The explanation only talks about bounding recursion to stop eager expansion. It never mentions what happens to the OBJECT SHAPE once the depth counter runs out — does <code>DeepPartial</code> still make every field optional at every depth, or does the guarantee quietly stop at some point?',
      ],
    },
    {
      heading: 'Why the 6th Level of Nesting Comes Back Fully Required',
      points: [
        'Walk the counter: at the root, <code>D</code> defaults to <code>5</code>. Each recursive call indexes <code>Prev[D]</code> to decrement: <code>Prev[5]=4</code>, <code>Prev[4]=3</code>, <code>Prev[3]=2</code>, <code>Prev[2]=1</code>, <code>Prev[1]=0</code>. So the mapped type <code>{ [K in keyof T]?: ... }</code> — the part that actually ADDS the <code>?</code> — runs at D=5,4,3,2,1: five levels of nesting.',
        'The moment a recursive call is made with <code>D=0</code>, the ternary\'s base case fires FIRST: <code>D extends 0 ? T : ...</code> returns <code>T</code> completely unchanged — no mapped type, no optional markers, nothing. Whatever interface was sitting at that 6th level of nesting comes back exactly as originally declared: every field still required.',
        'This means <code>DeepPartial&lt;AppConfig&gt;</code> silently stops being "deep" past 5 levels. A config shape nested 6+ levels down keeps its ORIGINAL required fields, with no compiler warning that the depth limit was hit — the type alias just quietly stops doing its job at the boundary.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>DeepPartial depth-counter boundary</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own depth-counter fix, copied exactly:
type Prev = [never, 0, 1, 2, 3, 4, 5];
type DeepPartial<T, D extends number = 5> =
  D extends 0
    ? T
    : { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K], Prev[D]> : T[K] };

// A config shape nested exactly 6 levels deep (root counts as level 0):
interface Backoff   { multiplier: number; jitter: boolean; }        // level 5
interface Retry      { backoff: Backoff; attempts: number; }        // level 4
interface Pool        { retry: Retry; maxConnections: number; }     // level 3
interface Connection   { pool: Pool; ssl: boolean; }                // level 2
interface Database       { connection: Connection; name: string; } // level 1
interface AppConfig { database: Database; label: string; }          // level 0 (root)

// D defaults to 5 -- walk the counter: 5 -> 4 -> 3 -> 2 -> 1 -> (0, base case)
// Levels 0-4 get the mapped type (fields optional). Level 5 (Backoff) is
// reached with D already at 0 -- base case fires, Backoff comes back
// AS-IS, fields fully required.

// Omitting an optional field 5 levels deep (Pool.maxConnections) -- compiles fine:
const shallowOmit: DeepPartial<AppConfig> = {
  database: {
    connection: {
      pool: {
        // maxConnections omitted -- still within the optional zone (D=2)
        retry: { backoff: { multiplier: 2, jitter: true }, attempts: 3 },
      },
    },
  },
};
console.log('shallow omission compiles:', shallowOmit);

// Omitting a field at the 6th level (Backoff.jitter) -- does this compile?
// const deepOmit: DeepPartial<AppConfig> = {
//   database: {
//     connection: {
//       pool: {
//         retry: {
//           backoff: { multiplier: 2 }, // jitter omitted
//           attempts: 3,
//         },
//       },
//     },
//   },
// };
// Uncomment above -- DeepPartial promises every field is optional. Is
// Backoff.jitter actually optional here, or does TypeScript reject this?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `deepOmit`. Confirm the compiler rejects it for a missing `jitter`, even though `shallowOmit` (which omits a shallower field, `maxConnections`) compiles fine just above it.',
    hint: '`Prev = [never, 0, 1, 2, 3, 4, 5]` decrements D once per nesting level. Starting from the default D=5, the base case (`D extends 0`) fires exactly when the recursion reaches the 6th level of nesting — Backoff.',
    solution: `Uncommenting deepOmit gives: "Property 'jitter' is missing in type
'{ multiplier: number; }' but required in type 'Backoff'." -- DeepPartial
did NOT make Backoff.jitter optional, despite the type alias's own name.

shallowOmit compiles cleanly because Pool sits at nesting level 3, well
within the D=5,4,3,2,1 range where the mapped type still applies "?" to
every field.

The practical lesson: a depth-bounded recursive type is a genuine fix
for the language-server-freeze problem the main page describes, but it
trades correctness at the boundary for that speed. Past the configured
depth, DeepPartial<T> silently reverts to requiring every field of T
exactly as originally declared -- with zero compiler warning that the
limit was hit. For config objects that might nest deeper than the
default D=5, either raise the counter or restructure to avoid deep
nesting -- don't assume "DeepPartial" means every field, at every
depth, is actually optional.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a depth-counter fix like the main page\'s `DeepPartial<T, D extends number = 5>` is purely a performance optimization — it computes the exact same optional-everywhere type as the unbounded version, just faster.',
      reality: 'past the configured depth, the type reverts to returning `T` completely unchanged — fields at and beyond that nesting level stay fully required, which is a real behavior change from the unbounded version, not just a speed difference.',
    },
    {
      thought: 'if `DeepPartial<AppConfig>` compiles without error for a given object literal, every field at every level of that object was genuinely optional in the type.',
      reality: 'a field 6+ levels deep can be REQUIRED under `DeepPartial<T, 5>` — the error only appears if you actually try to omit that specific deep field, so shallow test objects can pass review without ever exercising the boundary.',
    },
    {
      thought: 'raising the depth counter (e.g. `Prev` extended to allow `D = 10`) has no real downside — it just extends how deep the "optional everywhere" guarantee reaches.',
      reality: 'raising the counter directly reintroduces the language-server cost the fix existed to solve — the whole point of bounding `D` was trading some correctness at extreme depths for the speed the main page\'s Common Mistake was written to fix.',
    },
  ];
}
