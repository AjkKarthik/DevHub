import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-noimplicitany-doesnt-restrict-explicit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-noimplicitany-doesnt-restrict-explicit-any.html',
  styleUrl: './testing-that-noimplicitany-doesnt-restrict-explicit-any.scss',
})
export class TestingThatNoimplicitanyDoesntRestrictExplicitAnySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Example Only Removes the any, Never Uses It On Purpose',
      points: [
        'Common Mistake\'s noImplicitAny fix shows: <code>function process(data) { ... }</code> (implicit any — error) becomes <code>function process2(data: DataRecord) { ... }</code> (explicit interface). The page frames <code>noImplicitAny</code> purely as a flag that "forces explicit types," without ever writing the literal word <code>any</code> anywhere in that fix.',
        'This subtopic tests the boundary case the page never shows: what if a developer, instead of providing a REAL type, just writes <code>data: any</code> explicitly? Does <code>noImplicitAny</code> catch that too, or does it only ever police the UNANNOTATED case?',
      ],
    },
    {
      heading: 'Why noImplicitAny Only Restricts the Implicit Kind',
      points: [
        '<code>noImplicitAny</code> does exactly what its name says: it flags places where TypeScript would otherwise SILENTLY INFER <code>any</code> because no annotation was given. It has no mechanism to inspect or restrict an EXPLICITLY written <code>: any</code> annotation — from the compiler\'s perspective, an explicit <code>any</code> is a deliberate, fully legal type annotation, no different in kind from writing <code>: string</code> or <code>: number</code>.',
        'This means <code>function process(data: any) { return data.name; }</code> compiles with ZERO errors under <code>noImplicitAny: true</code> (or even under full <code>strict: true</code>) — the flag was satisfied the moment SOME annotation was present, regardless of what that annotation actually was.',
        'Preventing explicit <code>any</code> requires a COMPLETELY DIFFERENT tool: the ESLint rule <code>@typescript-eslint/no-explicit-any</code>. This is a lint-level policy decision, not a TypeScript compiler flag — <code>noImplicitAny</code> and this ESLint rule solve two related but genuinely distinct problems.',
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
    "noImplicitAny": true
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>noImplicitAny and explicit any</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// This playground's tsconfig.json has noImplicitAny: true active.

// The main page's own failing case -- IMPLICIT any (no annotation)
// function processImplicit(data) { return data.name; }
// Uncomment above -- does this compile with noImplicitAny: true?

// This subtopic's test -- EXPLICIT any, written on purpose
function processExplicit(data: any) {
  return data.name;
}
console.log(processExplicit({ name: 'Alice' }));

// Does noImplicitAny stop THIS from compiling? It looks just as
// unsafe as the implicit version -- data.name has zero type checking
// either way.
processExplicit(42);          // no error -- any accepts anything
processExplicit('a string');  // no error -- any accepts anything
processExplicit(null);        // no error -- any accepts anything, crashes at runtime
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `processImplicit`. Confirm it fails to compile (the main page\'s own documented error). Then confirm `processExplicit` compiles cleanly, and that calling it with `null` produces no compile error despite guaranteed runtime unsafety.',
    hint: 'noImplicitAny only checks whether an annotation is PRESENT -- it never inspects WHAT that annotation says, so an explicit ": any" satisfies the check exactly as well as any real type would.',
    solution: `Uncommenting processImplicit gives: "Parameter 'data' implicitly has
an 'any' type." -- exactly the main page's own documented error,
confirming noImplicitAny correctly catches the UNANNOTATED case.

processExplicit compiles with zero errors, even though its
data: any parameter provides exactly as little type safety as the
implicit version did. Calling processExplicit(null) also compiles
cleanly -- any accepts literally any value, including null -- and
would crash at runtime trying to read .name off null, with
absolutely no warning anywhere in the type-checking process.

The practical lesson: noImplicitAny is a floor, not a ceiling -- it
guarantees every parameter has SOME annotation, but says nothing
about whether that annotation is actually meaningful. Catching
explicit any usage (a very common way developers "satisfy" strict
mode without doing real migration work) requires the separate
@typescript-eslint/no-explicit-any lint rule, layered on top of
noImplicitAny, not a replacement for it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`noImplicitAny: true` bans the use of `any` anywhere in the codebase — the "implicit" in its name is just describing the common case, not limiting its scope.',
      reality: '`noImplicitAny` ONLY restricts the case where TypeScript would silently infer `any` because no annotation was given — an explicit `: any` annotation is fully legal under this flag, and under full `strict: true`, with zero errors.',
    },
    {
      thought: 'a codebase with `strict: true` and no `noImplicitAny` compile errors has no meaningful `any` types remaining.',
      reality: 'a codebase can be riddled with explicit `data: any` annotations, added specifically to silence `noImplicitAny` without doing the real work of typing the parameter, and `strict: true` alone provides zero signal that this happened.',
    },
    {
      thought: 'if a team wants to eliminate `any` from their codebase during a migration, enabling `noImplicitAny` is a complete, sufficient policy.',
      reality: '`noImplicitAny` only closes the SILENT-any loophole — catching explicit, deliberate `any` usage requires a separate tool (the `@typescript-eslint/no-explicit-any` lint rule), layered on top, not included in any TypeScript compiler flag.',
    },
  ];
}
