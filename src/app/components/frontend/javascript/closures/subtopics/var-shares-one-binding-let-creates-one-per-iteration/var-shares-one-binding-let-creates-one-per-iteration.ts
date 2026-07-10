import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-var-vs-let-loop-binding-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './var-shares-one-binding-let-creates-one-per-iteration.html',
  styleUrl: './var-shares-one-binding-let-creates-one-per-iteration.scss',
})
export class VarSharesOneBindingLetCreatesOnePerIterationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Always Uses setTimeout — This Removes the Async Timing Entirely',
      points: [
        'Every example of the loop bug on the main page uses <code>setTimeout(() =&gt; ..., 0)</code> — which is correct, but mixes two things together: the ASYNC nature of setTimeout, and the actual BINDING behavior of var vs let. It\'s worth isolating the binding question on its own, with no async involved at all.',
        'This subtopic stores the closures themselves in an array (WITHOUT calling them), and only calls every stored closure AFTER the loop has completely finished — using zero setTimeout, zero async. This proves the bug is about which VARIABLE each closure references, not about timing.',
      ],
    },
    {
      heading: 'One Binding vs Three Bindings — Made Concrete',
      points: [
        '<code>var i</code> declares exactly ONE binding for the entire loop\'s lifetime, in the enclosing function scope. Every closure created inside any iteration of the loop references that SAME single binding — so no matter how many closures you create, they all read whatever <code>i</code>\'s value happens to be when they are eventually CALLED, not when they were created.',
        '<code>let i</code> in a <code>for</code> loop\'s header is special-cased by the JS spec: each iteration gets a FRESH binding, copied from the previous iteration\'s final value before the loop body runs again. Three iterations of a <code>let</code> loop literally create three distinct variables, each captured by a different closure.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>var vs let loop bindings</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Store the closures WITHOUT calling them -- no setTimeout, no async.
const varClosures: (() => number)[] = [];
for (var i = 0; i < 3; i++) {
  varClosures.push(() => i);
}

const letClosures: (() => number)[] = [];
for (let j = 0; j < 3; j++) {
  letClosures.push(() => j);
}

// Only NOW, after both loops have completely finished, call every
// stored closure -- this isolates the binding behavior with zero
// async timing involved at all.
console.log('var closures, called after the loop finished:');
console.log(varClosures.map(fn => fn()));   // what does each one return?

console.log('let closures, called after the loop finished:');
console.log(letClosures.map(fn => fn()));   // what does each one return?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare the array of results from varClosures.map(fn => fn()) against letClosures.map(fn => fn()). What does each array actually contain?',
    hint: 'No setTimeout is involved at all here — ask how many DISTINCT variable bindings each loop actually created, independent of when the closures are called.',
    solution: `varClosures.map(fn => fn()) returns [3, 3, 3] -- every single
closure in the array, despite being created in three SEPARATE loop
iterations, reads the exact same var i binding. By the time any of
them are called (after the loop entirely finishes), that one shared
binding holds 3 (the value that made the loop condition i < 3
false).

letClosures.map(fn => fn()) returns [0, 1, 2] -- each closure reads
a genuinely DIFFERENT variable, because the for(let...) loop created
a fresh binding for j on every iteration, and each closure captured
its own iteration's specific binding.

This is a stronger, more isolated demonstration than the main page's
own setTimeout examples: there's no async delay here at all, and the
closures aren't even called until well after both loops have
completely finished running. The var loop truly has only ONE i
variable in existence the entire time; the let loop truly creates
THREE separate j variables. It was never really about "when" the
closures run -- it's about how many distinct bindings existed for
them to close over in the first place.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the var closure-loop bug is specifically caused by setTimeout being asynchronous — if the closures were called synchronously inside the loop, they would each get the correct value.',
      reality: 'the bug is about how many distinct variable bindings exist, not about timing — even calling every closure AFTER the loop finishes with zero async involved (as this subtopic does) reproduces the exact same result, because the var loop only ever had one binding for i to begin with.',
    },
    {
      thought: 'let fixes the loop bug by somehow "snapshotting" the current value of i at the moment each closure is created.',
      reality: 'let doesn\'t snapshot a value — it creates a genuinely separate BINDING (variable) for each iteration. The closure still captures by reference, same as with var; there just happen to be three distinct variables to reference instead of one.',
    },
    {
      thought: 'this bug only matters for loops that create closures used asynchronously (event handlers, setTimeout callbacks) — a loop that stores closures for later synchronous use isn\'t affected.',
      reality: 'the binding-sharing behavior is identical regardless of WHEN or HOW the stored closures are eventually called — storing them in an array and calling them synchronously after the loop, as this subtopic does, shows the exact same [3,3,3] vs [0,1,2] split.',
    },
  ];
}
