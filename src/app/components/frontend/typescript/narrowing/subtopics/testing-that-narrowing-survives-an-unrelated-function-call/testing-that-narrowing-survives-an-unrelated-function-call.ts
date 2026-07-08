import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-narrowing-survives-function-call-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-narrowing-survives-an-unrelated-function-call.html',
  styleUrl: './testing-that-narrowing-survives-an-unrelated-function-call.scss',
})
export class TestingThatNarrowingSurvivesAnUnrelatedFunctionCallSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Claim',
      points: [
        'The "Can narrowing cross function boundaries?" Q&A states: "TypeScript does not track narrowing across regular function calls. If you narrow x to string before calling a function, TypeScript assumes the function may have mutated x." Read literally, this suggests ANY function call after narrowing loses the narrowing.',
        'This subtopic tests that literally: narrow a parameter, call a completely unrelated function that has no access to the narrowed variable at all, and check whether the narrowing actually survives past that call.',
      ],
    },
    {
      heading: 'What Actually Determines Whether Narrowing Survives',
      points: [
        'JavaScript gives a called function no mechanism to reach into the CALLER\'s local variables and reassign them — calling <code>doSomething()</code> cannot possibly change what a local parameter <code>x</code> refers to in the calling function, since JS has no pass-by-reference for primitives and no way to mutate a caller\'s local bindings from outside. TypeScript\'s control flow analysis reflects this: narrowing of a local variable or parameter persists across an unrelated function call in the same scope.',
        'The genuine exception — where narrowing DOES get conservatively widened back — is when the narrowed variable is referenced inside a NESTED closure (a function expression defined within the same scope) that could be invoked later, potentially after a reassignment TypeScript can\'t fully order. That is a materially different scenario from simply calling some other, unrelated function in between two uses of the narrowed variable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Narrowing across function calls</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function unrelatedFunction(): void {
  console.log('doing something completely unrelated to x');
}

function process(x: string | number): string {
  if (typeof x === 'string') {
    // x: string here
    unrelatedFunction();       // an unrelated function call, in between
    return x.toUpperCase();    // does this still compile?
  }
  return x.toFixed(2);
}

console.log(process('hello'));   // "HELLO" -- narrowing survived the call in between
console.log(process(3.14159));   // "3.14"

// ── Testing the genuine exception -- a closure that captures x ─────────────
function processWithClosure(x: string | number): string {
  if (typeof x === 'string') {
    const later = () => {
      // x: string | number here -- NOT narrowed to string inside the closure,
      // because TypeScript can't fully verify WHEN 'later' runs relative to
      // any potential reassignment of x
      return typeof x === 'string' ? x.toUpperCase() : String(x);
      // x.toUpperCase() directly (without the typeof check inside the
      // closure) WOULD be a compile error here -- uncomment to see:
      // return x.toUpperCase();
    };
    return later();
  }
  return x.toFixed(2);
}
console.log(processWithClosure('world'));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the closure example, uncomment the bare `return x.toUpperCase();` line (the one without its own typeof check) inside the `later` arrow function. Does it compile? Compare this against the plain unrelatedFunction() call earlier in the file, which did NOT break narrowing.',
    hint: 'The key difference is not "was a function called" — it\'s whether the narrowed variable is referenced INSIDE a nested function expression versus simply having some other function invoked nearby.',
    solution: `The bare x.toUpperCase() inside the closure fails to compile:
"Property 'toUpperCase' does not exist on type 'string | number'."
Inside a nested function expression, TypeScript conservatively
treats x as its full declared type again, since it cannot prove
exactly when the closure will run relative to any future
reassignment of x.

This is a genuinely different situation from unrelatedFunction()
earlier in the file — that call has no closure over x at all, and
narrowing survives it completely (process('hello') correctly
compiles and returns "HELLO"). The Q&A's claim that "TypeScript does
not track narrowing across regular function calls" is accurate only
for the closure-capture case — an ordinary function call that never
references the narrowed variable does not invalidate its narrowing
at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling ANY function after narrowing a variable causes TypeScript to forget the narrowing, since "the function might have mutated it."',
      reality: 'an ordinary function call has no way to reach into the caller\'s local variables in JavaScript — TypeScript\'s narrowing of a local variable or parameter persists across such calls; only referencing the narrowed variable inside a NESTED CLOSURE causes conservative re-widening.',
    },
    {
      thought: 'the reason narrowing is lost inside a closure is that the closure is "a function call," the same category of thing as calling any other function.',
      reality: 'the actual reason is that a closure can be invoked LATER, at a time TypeScript cannot fully order relative to potential reassignments of the captured variable — it is about deferred, uncertain execution timing, not about "being a function" in general.',
    },
    {
      thought: 'if narrowing breaks inside a closure, the fix is always to avoid closures entirely.',
      reality: 'the practical fix demonstrated here is simpler — re-check the condition (typeof x === \'string\') INSIDE the closure itself, which re-establishes narrowing at that specific point without needing to restructure the surrounding code.',
    },
  ];
}
