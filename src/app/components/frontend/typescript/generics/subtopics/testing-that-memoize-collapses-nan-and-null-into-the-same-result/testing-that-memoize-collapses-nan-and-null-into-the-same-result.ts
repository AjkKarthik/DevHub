import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-memoize-nan-null-collision-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-memoize-collapses-nan-and-null-into-the-same-result.html',
  styleUrl: './testing-that-memoize-collapses-nan-and-null-into-the-same-result.scss',
})
export class TestingThatMemoizeCollapsesNanAndNullIntoTheSameResultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s memoize Implementation',
      points: [
        'The Default & Higher-Order Generics tab defines <code>memoize&lt;TArgs extends unknown[], TReturn&gt;(fn)</code>, caching results in a <code>Map&lt;string, TReturn&gt;</code> keyed by <code>JSON.stringify(args)</code>. This is presented purely as a generic-signature exercise — "preserves the full type signature of the wrapped function" — with no claim made about the cache KEY strategy itself.',
        'This subtopic tests that cache key strategy directly: does <code>JSON.stringify</code> always produce a distinct key for distinct arguments? It fully preserves the function\'s TYPE signature (the theory\'s claim), but that says nothing about whether two genuinely different runtime argument VALUES might serialize to the identical string.',
      ],
    },
    {
      heading: 'Why JSON.stringify Is Not a Safe Cache Key for Every Value',
      points: [
        '<code>JSON.stringify</code> has no representation for <code>NaN</code> — the JSON spec has no NaN literal, so <code>JSON.stringify(NaN)</code> silently converts it to the string <code>"null"</code>, identical to what <code>JSON.stringify(null)</code> itself produces. Both <code>[NaN]</code> and <code>[null]</code> serialize to the exact same string, <code>"[null]"</code>.',
        'This means <code>memoize</code>\'s type signature is perfectly sound — <code>TArgs</code> and <code>TReturn</code> really are preserved and enforced at the type level — while the underlying cache correctness has a genuine runtime hole entirely orthogonal to the generics: two calls with different (and differently-typed, if the parameter is <code>number | null</code>) arguments can silently return each other\'s cached result.',
        'The type system cannot catch this, because the bug lives in the string-serialization step, which happens entirely inside <code>JSON.stringify</code> — a function whose type signature (<code>(value: any) =&gt; string</code>) gives no indication that distinct inputs might collide.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>memoize cache key collision</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own memoize implementation, unchanged
function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();
  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

function classify(x: number | null): string {
  if (typeof x === 'number' && Number.isNaN(x)) return 'got NaN';
  if (x === null) return 'got null';
  return 'got other: ' + String(x);
}

const memoClassify = memoize(classify);

console.log(memoClassify(NaN));  // "got NaN" -- computed fresh, cached under key "[null]"
console.log(memoClassify(null)); // expected "got null" -- what does it actually print?

// Confirm the root cause directly:
console.log('JSON.stringify([NaN])  =', JSON.stringify([NaN]));
console.log('JSON.stringify([null]) =', JSON.stringify([null]));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third call, `memoClassify(5)`, after the two calls above. Does it correctly return "got other: 5"? Then explain in your own words why THAT call is safe while the NaN/null pair is not.',
    hint: 'JSON.stringify(5) produces the string "5", which is distinct from "null" -- the collision is specific to values that JSON.stringify happens to serialize identically, not a general flaw affecting every argument.',
    solution: `memoClassify(5) correctly returns "got other: 5" -- JSON.stringify([5])
is "[5]", a key that has never been cached before, so the function
runs fresh and caches correctly under its own distinct key.

The bug is narrow, not universal: it only strikes pairs of values
that JSON.stringify happens to serialize to the identical string.
NaN and null are the classic example (both become "null"), but the
same category of bug also applies to undefined inside an array
(JSON.stringify([undefined]) becomes "[null]" too) and to values
containing functions or symbols (also serialized as null inside
arrays). Ordinary primitives like numbers, strings, and booleans
that differ in value always serialize to genuinely different keys,
which is why memoClassify(5) works exactly as expected.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because `memoize<TArgs, TReturn>` correctly preserves and enforces the wrapped function\'s exact type signature, the memoized function must also be behaviorally correct for all inputs.',
      reality: 'the type signature only proves the wrapper accepts and returns the right TYPES — it says nothing about the cache KEY strategy underneath, which uses `JSON.stringify` and has real collisions for specific value pairs like `NaN` and `null`.',
    },
    {
      thought: '`JSON.stringify` always produces a unique string for distinct JavaScript values, since it is meant for serialization.',
      reality: '`JSON.stringify` has no representation for `NaN`, `undefined` (inside arrays), functions, or symbols — all of these serialize to `null` (or are dropped/replaced), so distinct values can produce identical serialized strings.',
    },
    {
      thought: 'this cache-key bug is a TypeScript problem that stronger typing could catch.',
      reality: 'this is a pure runtime/JavaScript problem — `JSON.stringify`\'s type signature (`(value: any) => string`) is technically accurate; TypeScript has no way to reason about the STRING CONTENT two different runtime values happen to produce.',
    },
  ];
}
