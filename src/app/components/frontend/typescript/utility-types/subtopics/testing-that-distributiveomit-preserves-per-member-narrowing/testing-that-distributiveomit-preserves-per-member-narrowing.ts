import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-distributiveomit-preserves-narrowing-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-distributiveomit-preserves-per-member-narrowing.html',
  styleUrl: './testing-that-distributiveomit-preserves-per-member-narrowing.scss',
})
export class TestingThatDistributiveomitPreservesPerMemberNarrowingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Fix, Stated but Not Fully Exercised',
      points: [
        'Common Mistake #2 shows that <code>Omit&lt;A | B, \'type\'&gt;</code> collapses to <code>{}</code> — only keys common to every union member survive — and fixes it with <code>DistributiveOmit&lt;T, K&gt; = T extends unknown ? Omit&lt;T, K&gt; : never</code>, stating the result is "correct" as <code>{ value: string } | { count: number }</code>.',
        'The page shows the resulting TYPE is a union of two object shapes, but never demonstrates whether that union still behaves like a genuine discriminated union afterward — specifically, whether you can still narrow between its members. This subtopic tests that directly, using the ORIGINAL discriminant field that <code>DistributiveOmit</code> just removed.',
      ],
    },
    {
      heading: 'Why Distribution Preserves the Per-Member Structure',
      points: [
        '<code>T extends unknown ? Omit&lt;T, K&gt; : never</code> is a distributive conditional type — when <code>T</code> is a naked type parameter bound to a union, TypeScript applies the conditional to EACH member separately and unions the results back together. So <code>DistributiveOmit&lt;A | B, \'type\'&gt;</code> genuinely computes <code>Omit&lt;A, \'type\'&gt; | Omit&lt;B, \'type\'&gt;</code>, two SEPARATE object shapes, not one merged shape.',
        'Because each member keeps its own distinct set of remaining keys (<code>{ value: string }</code> vs. <code>{ count: number }</code>), TypeScript can still narrow between them using structural checks like <code>\'value\' in obj</code> or <code>\'count\' in obj</code> — even though the ORIGINAL discriminant property (<code>type</code>) that a reader might reach for first was exactly the one property <code>DistributiveOmit</code> just removed.',
        'This is worth confirming explicitly: a reader who only sees the page\'s comment ("correct!") might reasonably wonder whether the fix produces a genuinely useful discriminated-adjacent union, or just a cosmetically-correct-looking type that is unusable in practice. It genuinely is usable — narrowing by remaining structural keys works.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>DistributiveOmit and narrowing</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own A/B union and DistributiveOmit fix, unchanged
type A = { type: 'a'; value: string };
type B = { type: 'b'; count: number };
type AB = A | B;

type DistributiveOmit<T, K extends string | number | symbol> =
  T extends unknown ? Omit<T, K> : never;

type OmitType = DistributiveOmit<AB, 'type'>;
// The page's own comment: { value: string } | { count: number } -- "correct!"

function describe(item: OmitType): string {
  // The ORIGINAL discriminant 'type' was just removed by DistributiveOmit --
  // it does not exist on OmitType at all. Does narrowing by the REMAINING
  // structural keys still work?
  if ('value' in item) {
    return \`string value: \${item.value.toUpperCase()}\`; // item narrowed to { value: string }
  }
  return \`numeric count: \${item.count.toFixed(0)}\`; // item narrowed to { count: number }
}

console.log(describe({ value: 'hello' }));
console.log(describe({ count: 42 }));

// Confirm 'type' genuinely doesn't exist on OmitType anymore
const sample: OmitType = { value: 'x' };
// sample.type;
// Uncomment above -- does it compile?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `sample.type;`. Read the exact compiler error. Then explain why `describe()` still works correctly even though `type` — the field you might normally reach for to distinguish A from B — no longer exists on OmitType.',
    hint: 'A discriminated union does not strictly require a dedicated discriminant property -- any structurally-distinguishing key (present on one member but not the other) can be used to narrow, including via the `in` operator.',
    solution: `sample.type fails to compile: "Property 'type' does not exist on
type 'OmitType'." -- confirming DistributiveOmit genuinely removed
it from BOTH union members, not just one.

describe() still works because OmitType is { value: string } | {
count: number } -- two structurally DIFFERENT shapes, distributed
correctly by DistributiveOmit rather than merged into one. The 'value'
in item check narrows the union using ordinary TypeScript control
flow analysis on the 'in' operator, which works for any property
that's present on some union members and absent on others -- it
doesn't require a dedicated string-literal "discriminant" field like
'type' specifically.

This confirms the main page's "correct!" comment holds up under
actual use, not just at the type-alias level: DistributiveOmit
doesn't just look right in an inline type comment, it produces a
union you can genuinely still work with.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once `DistributiveOmit` removes the `type` discriminant field, the resulting union `{ value: string } | { count: number }` becomes unusable for narrowing, since there is no dedicated discriminant left.',
      reality: 'narrowing does not require a dedicated discriminant field — TypeScript can narrow a union using ANY structurally-distinguishing property via the `in` operator, and DistributiveOmit correctly keeps `value` and `count` as separate, per-member keys rather than merging them.',
    },
    {
      thought: 'the main page\'s comment showing `OmitType` as `{ value: string } | { count: number }` is just a type-level description — it does not necessarily mean the type behaves correctly when actually used in a function.',
      reality: 'this subtopic\'s live demo confirms the type genuinely IS usable — `describe()` correctly narrows and accesses `item.value` or `item.count` per branch, with no type errors or unsafe casts required.',
    },
    {
      thought: 'a distributive conditional type like `T extends unknown ? Omit<T, K> : never` is just a syntactic trick to make `Omit` "work" on unions, producing the same practical result as a non-distributive `Omit<T, K>` would if `Omit` somehow supported unions.',
      reality: 'the distributive version computes something structurally different — a genuine UNION of per-member results — rather than the merged, common-keys-only shape a naive `Omit<T, K>` produces for the same union.',
    },
  ];
}
