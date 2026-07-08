import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-as-const-runtime-mutable-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-as-consts-readonly-is-compile-time-only-not-runtime.html',
  styleUrl: './testing-that-as-consts-readonly-is-compile-time-only-not-runtime.scss',
})
export class TestingThatAsConstsReadonlyIsCompileTimeOnlyNotRuntimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Claims About the Same Object, Read Side by Side',
      points: [
        'The "Literal Types" code tab builds ROUTES with <code>as const</code> and comments: "ROUTES is Readonly — no mutation allowed" — stated flatly, with no qualifier. Elsewhere on the SAME page, the "What does as const do to an object literal?" quiz answer is more precise: "It has no runtime effect — the object is still technically mutable in JS."',
        'These are not actually contradictory once you read closely — but a reader who only skims the code tab\'s comment, without reaching the quiz explanation further down the page, can easily walk away believing <code>as const</code> provides the same kind of protection as <code>Object.freeze()</code>: an actual runtime guard that throws (or silently fails) on a mutation attempt. It does not.',
      ],
    },
    {
      heading: 'What "Readonly" Actually Means Here',
      points: [
        '<code>as const</code> is purely a TYPE-LEVEL construct. It tells the TypeScript compiler "treat every property as readonly," which makes the COMPILER reject an assignment like <code>ROUTES.home = "/x"</code> with a type error. It does nothing to the actual JavaScript object TypeScript emits — no <code>Object.freeze()</code> call, no property descriptor changes, nothing observable at runtime.',
        'This means any code path that bypasses TypeScript\'s type checking — an explicit <code>as any</code> cast, plain untyped JavaScript consuming the compiled output, or simply a `.js` file that never went through <code>tsc</code> at all — can mutate a <code>ROUTES</code>-like object freely, with no error, no warning, nothing. The "Readonly" guarantee is a promise the compiler enforces on YOUR code, not a property of the value itself.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>as const readonly — compile-time vs runtime</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's exact example
const ROUTES = {
  home:     '/',
  profile:  '/profile',
  settings: '/settings',
} as const;

// ROUTES.home = '/other';  // uncomment: TypeScript compile error --
                             // "Cannot assign to 'home' because it is a read-only property."

// But this compiles and RUNS just fine -- 'as any' bypasses the
// compile-time check entirely, and there is nothing left underneath
// to stop the mutation at runtime:
(ROUTES as any).home = '/mutated';
console.log(ROUTES.home);  // "/mutated" -- the "readonly" object DID mutate

// For comparison: Object.freeze() DOES provide a runtime guarantee
const FROZEN_ROUTES = Object.freeze({
  home:     '/',
  profile:  '/profile',
  settings: '/settings',
});
(FROZEN_ROUTES as any).home = '/mutated';
console.log(FROZEN_ROUTES.home);
// "/" -- unchanged. In non-strict-mode JS this assignment silently
// fails; in strict-mode JS (the default for ES modules, like this
// playground) it throws a TypeError. Either way, Object.freeze
// actually stops the mutation -- as const alone never does.
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the playground above, remove the `as any` cast from the ROUTES mutation line so it reads `ROUTES.home = \'/mutated\';` directly. Does the code still run? Then try the exact same thing on FROZEN_ROUTES. What differs?',
    hint: 'Removing `as any` from the ROUTES line brings back the TypeScript compile error — but what happens if you comment out just enough to get it to compile, and actually execute it at runtime, for each object?',
    solution: `Removing "as any" from the ROUTES.home assignment brings back
TypeScript's compile-time error immediately -- the code won't even
build. That error is coming entirely from the "as const" readonly
type annotation, and it only exists at compile time.

The key difference shows up once you bypass that check (via "as
any", untyped JS, or any other route around the type system):
ROUTES.home genuinely changes to "/mutated" at runtime -- "as
const" provided no runtime protection at all. FROZEN_ROUTES, by
contrast, stays "/" even when mutated through the same "as any"
bypass, because Object.freeze() is a REAL runtime mechanism, not a
compile-time-only annotation -- it enforced by the JavaScript engine
itself, independent of whether TypeScript's type checker is even
involved.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>as const</code> makes an object immutable in the same way <code>Object.freeze()</code> does — attempting to mutate it fails at runtime.',
      reality: '<code>as const</code> is purely a compile-time type annotation. TypeScript rejects the mutation in code it type-checks, but the underlying JavaScript object is never actually frozen — any code path that bypasses the type checker can mutate it freely at runtime.',
    },
    {
      thought: 'a code comment like "Readonly — no mutation allowed" next to an <code>as const</code> object is describing the object\'s actual runtime behavior.',
      reality: 'it is describing what the TYPE SYSTEM will and won\'t allow YOUR TypeScript code to do — not a property the compiled JavaScript value carries with it at runtime.',
    },
    {
      thought: 'if you need a genuinely mutation-proof object at runtime (e.g., a config object shared across a large codebase, including untyped or dynamically-loaded code), <code>as const</code> alone is sufficient.',
      reality: 'that scenario needs <code>Object.freeze()</code> (or a deep-freeze utility for nested objects) — a real runtime mechanism — <code>as const</code> only helps the statically-typed portions of a codebase that the TypeScript compiler actually checks.',
    },
  ];
}
