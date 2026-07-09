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
  selector: 'app-spread-ignores-generator-return-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './spread-ignores-generator-return-value.html',
  styleUrl: './spread-ignores-generator-return-value.scss',
})
export class SpreadAndForOfIgnoreAGeneratorsReturnValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #5, Verified by Comparing Two Consumption Methods',
      points: [
        'The main page\'s "Forgetting that return value in generator is the done:true value" mistake states plainly: spreading a generator that has a <code>return 3;</code> statement produces <code>[1, 2]</code> — the <code>3</code> is silently dropped. This subtopic runs the SAME generator through both spread AND manual <code>.next()</code> calls side by side, so the missing value is directly visible by comparison, not just asserted.',
        'A generator\'s <code>return</code> statement does not produce a normal yielded value — it produces the FINAL result object, <code>{ value: returnValue, done: true }</code>. Every iteration-consuming construct (spread, <code>for...of</code>, <code>Array.from</code>, destructuring) is built on the iterator protocol\'s contract: STOP iterating as soon as <code>done</code> is <code>true</code>, and never include that final object\'s <code>value</code> in the results.',
      ],
    },
    {
      heading: 'Why This Is Correct Protocol Behavior, Not a Bug',
      points: [
        'The iterator protocol treats the <code>done: true</code> result as a SIGNAL that iteration has ended, not as one more item in the sequence — this is true for every iterable in JavaScript, not just generators, which is why <code>for...of</code> and spread behave identically here.',
        'The only ways to actually retrieve a generator\'s return value are: (1) call <code>.next()</code> manually and inspect the final <code>{ value, done: true }</code> result yourself, or (2) delegate to the generator with <code>yield*</code> from an OUTER generator — <code>yield*</code> specifically evaluates to the inner generator\'s return value, which is exactly why the main page\'s theory calls this out as one of <code>yield*</code>\'s special behaviors that a manual loop wouldn\'t replicate.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Spread ignores a generator's return value</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function* gen() {
  yield 1;
  yield 2;
  return 3; // NOT a yielded value -- this is the final done:true value
}

console.log('--- Consuming via spread ---');
const spreadResult = [...gen()];
console.log('Spread result:', spreadResult, '<-- only [1, 2] -- the 3 is nowhere to be found');

console.log('--- Consuming via for...of ---');
const forOfResult: number[] = [];
for (const v of gen()) {
  forOfResult.push(v);
}
console.log('for...of result:', forOfResult, '<-- also only [1, 2], same protocol');

console.log('--- Consuming via manual .next() calls ---');
const g = gen();
console.log('next() #1:', g.next());  // { value: 1, done: false }
console.log('next() #2:', g.next());  // { value: 2, done: false }
console.log('next() #3:', g.next());  // { value: 3, done: true } <-- the 3 is HERE, only visible manually

console.log('--- Consuming via yield* delegation from an outer generator ---');
function* outer() {
  const returnedValue = yield* gen();  // yield* itself evaluates to the inner generator's return value
  console.log('yield* expression evaluated to:', returnedValue, '<-- 3, recovered via delegation');
}
[...outer()];`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The exact same generator, <code>gen()</code>, is consumed four different ways. Which consumption method(s) actually give you access to the <code>3</code> from <code>return 3;</code>?',
    hint: 'Every method that relies on repeatedly checking done and stopping the moment it becomes true will miss the value attached to that very done:true result -- ask which methods DON\'T follow that stopping rule.',
    solution: `Only two of the four methods give you access to the 3: manual
.next() calls, and yield* delegation from an outer generator.

Spread ([...gen()]) and for...of both produce [1, 2] -- neither one
includes the 3. Both are built on the same iterator protocol
contract: keep calling next() and collecting values only while
done is false; the moment a next() call returns done: true, stop
immediately and discard that final result's value entirely.

Manual .next() calls let you inspect that final result yourself --
the third call returns exactly { value: 3, done: true }, and since
you're reading the raw result object rather than relying on
spread/for...of to filter it for you, the 3 is right there.

yield* delegation is the other way to recover it: when outer()
calls yield* gen(), the yield* EXPRESSION ITSELF evaluates to
gen()'s return value once gen() finishes -- so "const returnedValue
= yield* gen()" correctly captures the 3, even though outer()'s own
consumption via [...outer()] never sees a yielded 3 in its results
(outer() never actually yields it -- it only uses it internally,
in this example just to log it).

The lesson: a generator's return value is fundamentally different
from a yielded value -- it's metadata attached to the END of
iteration, not part of the sequence, and only code that explicitly
looks at the final { done: true } result (directly or via yield*)
can see it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a generator\'s return statement adds one final value to the sequence, so spreading or looping over the generator with for...of includes it as the last element.',
      reality: 'a generator\'s return value is never included by spread or for...of — both stop the instant they see done: true and completely discard that final result\'s value, treating it purely as an end-of-iteration signal.',
    },
    {
      thought: 'if a generator\'s return value is silently dropped by spread and for...of, there is no way to access it at all — it is simply lost once you consume the generator that way.',
      reality: 'the return value is only lost if you consume the generator via spread or for...of specifically — calling .next() manually and reading the final result object, or delegating to it with yield* from an outer generator, both give you direct access to it.',
    },
    {
      thought: 'this dropped-return-value behavior is a JavaScript-specific quirk of generators — other iterables in the language don\'t have this same "final value gets discarded" behavior.',
      reality: 'this is universal iterator protocol behavior, not a generator-specific quirk — ANY custom iterable that returns { value, done: true } from its next() method has that final value ignored by spread/for...of in exactly the same way, since they all follow the same protocol contract.',
    },
  ];
}
