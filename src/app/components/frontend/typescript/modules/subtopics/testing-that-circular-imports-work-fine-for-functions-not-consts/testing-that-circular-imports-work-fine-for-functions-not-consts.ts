import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-circular-imports-functions-work-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-circular-imports-work-fine-for-functions-not-consts.html',
  styleUrl: './testing-that-circular-imports-work-fine-for-functions-not-consts.scss',
})
export class TestingThatCircularImportsWorkFineForFunctionsNotConstsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Example Uses CONST Initializers',
      points: [
        'Common Mistake #1 demonstrates the failure with top-level <code>const</code> values: <code>export const a = \'A-\' + b;</code> in a.ts, circularly importing from b.ts which does the same. Both fail because each module tries to READ the other\'s value WHILE it is still being initialized.',
        'This subtopic tests a structurally different case the page never shows: two modules that circularly import each other\'s FUNCTIONS, where the import is only used INSIDE a function body — never evaluated at the top level during module initialization.',
      ],
    },
    {
      heading: 'Why Function Hoisting Changes the Outcome',
      points: [
        'ES module bindings are "live" — an imported name is a reference to the exporting module\'s binding, not a snapshot copied at import time. A <code>function</code> declaration is fully hoisted within its module: the function itself exists and is callable from the very start of that module\'s evaluation, even before any of its own top-level code has run.',
        'The main page\'s failure happens because <code>const a = \'A-\' + b</code> tries to READ the VALUE of <code>b</code> immediately, at module-evaluation time — and at that exact moment, if b.ts hasn\'t finished initializing yet, <code>b</code> is <code>undefined</code> (or, under stricter ESM semantics, in the temporal dead zone).',
        'A circular import between two functions never has this problem AS LONG AS the imported function is only CALLED later — inside another function\'s body, from external code, after both modules have finished their own top-level evaluation. By the time either function actually executes, the whole circular module graph has already finished loading.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Circular imports: functions vs consts</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'a.ts',
      content: `import { greetB } from './b';

// The main page's own failing pattern -- reading b's value immediately
export const constA = 'A-uses-' + greetB.name; // reading .name at module init time

// This subtopic's test: a FUNCTION that calls the circular import,
// but only when INVOKED, not at module-evaluation time
export function greetA(): string {
  return 'Hello from A, calling B: ' + greetB();
}
`,
    },
    {
      path: 'b.ts',
      content: `import { greetA } from './a';

export function greetB(): string {
  return 'Hello from B';
}

// Notice: this file never tries to CALL greetA() at the top level --
// only exports a function that WOULD call it, if invoked
export function greetBThenA(): string {
  return greetB() + ' / then: ' + greetA();
}
`,
    },
    {
      path: 'index.ts',
      content: `import { greetA } from './a';
import { greetBThenA } from './b';

// The const-based circular value -- does it show the "undefined" problem
// the main page describes?
import { constA } from './a';
console.log('constA (circular const):', constA);

// The function-based circular calls -- called AFTER all modules finished loading
console.log('greetA():', greetA());
console.log('greetBThenA():', greetBThenA());
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Check the logged value of constA. Does it show "A-uses-undefined" (the main page\'s described failure) or something else? Then confirm greetA() and greetBThenA() both work correctly.',
    hint: 'greetB is a hoisted function declaration -- greetB.name is readable immediately even mid-circular-import, unlike a const value computed from the OTHER module\'s export.',
    solution: `constA logs "A-uses-greetB" -- NOT undefined, because greetB.name
reads a property off the greetB FUNCTION OBJECT itself (which is
hoisted and exists immediately), not off some value greetB computes.
This particular demo happens to avoid the classic failure because
functions are available immediately -- but reading .name here is
still reading something ABOUT the function at module-init time,
distinct from calling it.

greetA() correctly logs "Hello from A, calling B: Hello from B", and
greetBThenA() correctly logs "Hello from B / then: Hello from A,
calling B: Hello from B" -- both circular function calls resolve
correctly because by the time either function actually RUNS (as
opposed to being merely declared), both a.ts and b.ts have finished
their top-level evaluation.

The general rule: circular imports break specifically when one
module tries to READ a VALUE from the other at top-level,
module-evaluation time, before that value has been assigned.
Function declarations (hoisted, and only invoked later) sidestep
this entirely -- which is exactly why the main page's own fix
("extract shared constants to a third module") targets CONST
values specifically, not functions.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'circular imports between ES modules are unsafe in general — any two modules that import from each other risk the "undefined at runtime" failure the main page describes.',
      reality: 'the failure is specific to reading a VALUE (like a `const` initializer) from the other module at TOP-LEVEL, module-evaluation time — circular imports of `function` declarations, only called later, do not have this problem at all.',
    },
    {
      thought: 'the fix for circular imports is always to extract shared code to a third module, as the main page\'s Common Mistake #1 shows.',
      reality: 'that fix is specifically needed for circular CONST/VALUE dependencies — a circular dependency between two functions that only call each other from inside their own bodies (never at the top level) needs no such restructuring at all.',
    },
    {
      thought: 'ES module circular imports behave identically regardless of whether the exported binding is a function, a class, or a plain value.',
      reality: 'function declarations are hoisted and exist as soon as their module begins evaluating, while `const`/`let` bindings are only assigned when their initializer expression actually runs — this timing difference is exactly what makes function-based circular imports safe and value-based ones unsafe.',
    },
  ];
}
