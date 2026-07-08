import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pipeline-skips-pipe-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-pipeline-skips-pipe-entirely-and-still-type-checks.html',
  styleUrl: './testing-that-pipeline-skips-pipe-entirely-and-still-type-checks.scss',
})
export class TestingThatPipelineSkipsPipeEntirelyAndStillTypeChecksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Claim',
      points: [
        'The Generic Pipeline Builder challenge describes its goal precisely: "the pipeline must enforce AT COMPILE TIME that consecutive steps have compatible types." The solution\'s <code>pipe&lt;TNext&gt;(fn: (val: TOut) =&gt; TNext): Pipeline&lt;TIn, TNext&gt;</code> genuinely does this — chaining through <code>.pipe()</code> forces each step\'s input to match the previous step\'s output.',
        'But <code>class Pipeline&lt;TIn, TOut = TIn&gt;</code> has a public constructor accepting an untyped <code>steps</code> array, and <code>TOut</code> only defaults to <code>TIn</code> — it does not have to equal <code>TIn</code>. This subtopic tests what happens when a caller supplies BOTH type arguments directly to the constructor, bypassing <code>.pipe()</code> entirely.',
      ],
    },
    {
      heading: 'Why Direct Construction Breaks the Guarantee',
      points: [
        'The constructor signature is <code>constructor(steps: Array&lt;(val: unknown) =&gt; unknown&gt; = [])</code> — nothing in that signature relates <code>TIn</code> or <code>TOut</code> to the actual contents of <code>steps</code>. TypeScript has no way to check "does this array of erased functions actually transform TIn into TOut" because the array\'s element type is <code>unknown =&gt; unknown</code>, already stripped of any connection to the class\'s own type parameters.',
        '<code>new Pipeline&lt;string, number&gt;()</code> is a completely valid call: <code>TIn = string</code> and <code>TOut = number</code> are both supplied explicitly, and the default <code>steps = []</code> satisfies the constructor. Calling <code>.run(\'hello\')</code> then executes ZERO steps — <code>reduce</code> over an empty array simply returns the initial value, the raw input string, cast to <code>TOut</code> via <code>as TOut</code>.',
        'The result: TypeScript\'s static type for the returned value says <code>number</code>, while the actual runtime value is still the original string. This is a genuine type-safety hole — not a bug in the <code>.pipe()</code> chain itself, which remains sound, but in the class\'s public surface allowing that chain to be bypassed entirely.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Pipeline bypassing pipe()</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The challenge's own Pipeline solution, unchanged
class Pipeline<TIn, TOut = TIn> {
  private readonly steps: Array<(val: unknown) => unknown>;

  constructor(steps: Array<(val: unknown) => unknown> = []) {
    this.steps = steps;
  }

  pipe<TNext>(fn: (val: TOut) => TNext): Pipeline<TIn, TNext> {
    return new Pipeline<TIn, TNext>([...this.steps, fn as (val: unknown) => unknown]);
  }

  run(input: TIn): TOut {
    return this.steps.reduce(
      (val, step) => step(val),
      input as unknown
    ) as TOut;
  }
}

// Built the intended way -- genuinely type-safe, one step
const safe = new Pipeline<string>().pipe(s => s.length).run('hello');
console.log('safe (via .pipe()):', safe, '-- typeof:', typeof safe);

// Bypassing .pipe() entirely -- supply BOTH type arguments directly
const unsound: number = new Pipeline<string, number>().run('hello');
console.log('unsound (direct construction):', unsound, '-- typeof:', typeof unsound);
// TypeScript's type annotation above says "number" -- what does typeof actually print?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add `unsound.toFixed(2)` (a number-only method) right after the unsound example. Does it compile? Then run the playground and read what actually happens when that line executes.',
    hint: 'TypeScript trusts the `number` annotation completely at compile time -- the actual crash (if any) only happens at runtime, when a string tries to run a number-only method.',
    solution: `unsound.toFixed(2) compiles without any error -- TypeScript's type
checker has no way to know that "unsound" is actually still the
string 'hello' at runtime, because the class's own type signature
told it TOut is number.

Running it throws a genuine runtime error: "unsound.toFixed is not
a function" (since strings don't have toFixed). This is exactly
what a type-safe API is supposed to prevent -- the type checker
gave a false guarantee because the class's public constructor
allowed bypassing the one code path (.pipe()) that actually
enforces the chain.

The practical fix: make the constructor private (or protected), and
provide a static factory method (e.g. Pipeline.start<T>()) as the
only public way to create a Pipeline<TIn, TIn> with zero steps --
closing off the direct-construction escape hatch this subtopic
exploited.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because the Pipeline challenge\'s `.pipe()` method genuinely enforces compatible types between consecutive steps, the whole Pipeline class is type-safe end to end.',
      reality: 'the `.pipe()` chain is sound, but the class\'s public constructor accepts both type parameters directly with no relation to the actual (type-erased) steps array — bypassing `.pipe()` entirely produces a `Pipeline<TIn, TOut>` whose `run()` return type is a complete fabrication.',
    },
    {
      thought: 'if a TypeScript expression compiles without an error, the runtime value is guaranteed to match the declared type.',
      reality: 'TypeScript type declarations are erased at compile time and never checked at runtime — a type assertion (`as TOut`) or an unsound generic API can produce a fully compiling program whose runtime values do not match their declared types at all.',
    },
    {
      thought: 'a "type-safe" builder or pipeline pattern is safe as long as ITS OWN methods (like `.pipe()`) are individually well-typed.',
      reality: 'safety has to be evaluated across the WHOLE public surface of the class — a single unguarded entry point (here, the public constructor) can undermine guarantees that every other method correctly upholds.',
    },
  ];
}
