import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-break-triggers-generator-return-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './break-triggers-generator-return-finally.html',
  styleUrl: './break-triggers-generator-return-finally.scss',
})
export class BreakingAForOfLoopTriggersGeneratorReturnAndRunsFinallySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s QnA, Proven With a Real Resource-Cleanup Log',
      points: [
        'The main page\'s QnA states plainly: "When a <code>for...of</code> loop breaks early (or throws), JavaScript calls <code>generator.return()</code> which causes the generator to run any <code>finally</code> blocks and terminate cleanly." Its Mistake #6 shows this is actually the CORRECT, safe pattern when the generator wraps resource acquisition in <code>try/finally</code> — this subtopic proves it by logging the exact moment cleanup runs relative to the early <code>break</code>.',
        'This is genuinely surprising to anyone coming from plain loops: a <code>break</code> statement, which looks like it just exits a loop, actually reaches INTO the generator object being iterated and calls a special method (<code>.return()</code>) on it — the generator is not just abandoned, it is given a chance to clean up.',
      ],
    },
    {
      heading: 'Why This Exists — Generators Aren\'t "Just" Functions',
      points: [
        'A generator paused mid-execution (suspended at a <code>yield</code>) can be holding onto real resources — an open file handle, a database connection, a lock — exactly as if it were frozen mid-function. If <code>break</code> simply abandoned the generator with no signal at all, any <code>try/finally</code> block wrapping that resource would never get a chance to run, silently leaking the resource forever.',
        'The iterator protocol solves this with an OPTIONAL <code>.return(value)</code> method: when present, <code>for...of</code> (and other constructs, like array destructuring with an early exit) call it automatically on early termination. For a generator, calling <code>.return()</code> makes the paused <code>yield</code> expression behave AS IF a <code>return</code> statement had been reached at that exact point — which is precisely what causes any enclosing <code>finally</code> block to run before the generator actually terminates.',
        'This same mechanism also fires on an uncaught error thrown INSIDE the loop body (not inside the generator) — the generator still gets its chance to clean up via <code>.return()</code>, even though the early exit was caused by an exception rather than an explicit <code>break</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>break triggers generator.return() demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function* withResource(label: string) {
  console.log('  [' + label + '] resource acquired');
  try {
    let i = 0;
    while (true) {
      yield label + '-item-' + i;
      i++;
    }
  } finally {
    console.log('  [' + label + '] finally ran -- resource released');
  }
}

console.log('--- Scenario 1: break out of the loop early ---');
for (const item of withResource('A')) {
  console.log('received:', item);
  if (item === 'A-item-2') {
    console.log('breaking now...');
    break;
  }
}
console.log('after the loop -- notice the finally log already appeared ABOVE this line, not after\\n');

console.log('--- Scenario 2: manually calling .return() directly ---');
const gen = withResource('B');
console.log('received:', gen.next().value);
console.log('received:', gen.next().value);
console.log('calling gen.return() manually now...');
const result = gen.return(undefined);
console.log('gen.return() result:', result, '<-- done: true, and the finally block already ran above');

console.log('--- Scenario 3: an exception thrown inside the loop body ---');
try {
  for (const item of withResource('C')) {
    console.log('received:', item);
    if (item === 'C-item-1') {
      throw new Error('something went wrong in the loop body, not the generator');
    }
  }
} catch (e) {
  console.log('caught:', (e as Error).message, '-- but the finally log already ran above, BEFORE this catch block');
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In Scenario 1, the loop breaks right after receiving <code>\'A-item-2\'</code>. Does the generator\'s <code>finally</code> block run immediately when <code>break</code> executes, or does it wait until the generator would naturally be garbage collected?',
    hint: 'break doesn\'t just exit the loop silently -- it calls a specific method on the generator object being iterated. Think about what that method\'s documented effect on a paused yield is.',
    solution: `The finally block runs IMMEDIATELY when break executes -- you can
see the "[A] finally ran" log appear right after the "breaking
now..." log, well before the "after the loop" line runs.

Here's the mechanism: for...of automatically calls gen.return()
on the generator the instant the loop exits early via break. Calling
.return() on a generator that's currently paused at a yield makes
that yield behave AS IF a return statement had executed right there
-- which means any enclosing try/finally block runs its finally
clause immediately, synchronously, as part of that .return() call.

Scenario 2 proves the same mechanism explicitly: calling
gen.return(undefined) directly (with no for...of loop at all)
triggers the exact same finally log, confirming that for...of's
break behavior is really just calling this same documented method
you can call yourself.

Scenario 3 shows it also happens on an uncaught exception from
inside the loop body -- the finally log appears BEFORE the catch
block even runs, since the generator gets cleaned up as the
exception propagates out of the for...of loop, before the exception
reaches your surrounding try/catch.

The lesson: a generator's try/finally is genuinely reliable for
resource cleanup, even under early exit -- as long as consumers use
for...of, destructuring, spread, or another protocol-aware
construct (a raw, manual loop that just stops calling .next()
without ever calling .return() would NOT trigger this).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a break statement inside a for...of loop simply stops calling next() on the generator and abandons it — any cleanup code inside the generator (like a try/finally around a held resource) never gets a chance to run.',
      reality: 'for...of automatically calls the generator\'s <code>.return()</code> method on early exit via break — this makes the paused yield behave as if a return statement executed there, which DOES trigger any enclosing finally block to run immediately.',
    },
    {
      thought: 'this automatic cleanup-on-break behavior is specific to break statements — an uncaught error thrown inside the loop body would just crash without giving the generator a chance to clean up.',
      reality: 'the exact same <code>.return()</code> mechanism fires when an exception propagates out of a for...of loop\'s body too — the generator\'s finally block runs before the exception reaches any surrounding catch block, exactly as it does for an explicit break.',
    },
    {
      thought: 'this reliable cleanup-on-early-exit behavior applies no matter how you stop consuming a generator, including a manual loop that just stops calling gen.next() without doing anything else.',
      reality: 'a manual loop that simply STOPS calling .next() (without ever calling .return()) does NOT trigger the finally block — the generator is left permanently suspended with its resource unreleased; the automatic cleanup only happens through protocol-aware consumers (for...of, destructuring, spread) or an explicit manual call to .return().',
    },
  ];
}
