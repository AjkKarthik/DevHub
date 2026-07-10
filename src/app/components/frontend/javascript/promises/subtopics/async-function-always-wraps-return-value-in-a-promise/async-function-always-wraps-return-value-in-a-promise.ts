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
  selector: 'app-async-always-wraps-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './async-function-always-wraps-return-value-in-a-promise.html',
  styleUrl: './async-function-always-wraps-return-value-in-a-promise.scss',
})
export class AsyncFunctionAlwaysWrapsReturnValueInAPromiseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Rule the Main Page Flags as a Common Mistake, Made Directly Visible',
      points: [
        'The main page\'s "Using async where sync works" mistake and its first quiz question both point at the same rule: marking a function <code>async</code> changes its return type completely, even if the function body itself never awaits anything or does any asynchronous work at all.',
        'An <code>async function</code> ALWAYS returns a genuine <code>Promise</code> object — never the raw value written after <code>return</code>. If the function body returns a plain value like <code>42</code>, the actual return value the caller receives is <code>Promise&lt;number&gt;</code> that has already resolved to <code>42</code>, not the number <code>42</code> itself.',
      ],
    },
    {
      heading: 'Why This Matters Even for a Trivial, Fully Synchronous Function',
      points: [
        'This is true regardless of whether the function body contains an <code>await</code>, a loop, or nothing async at all — the <code>async</code> keyword itself is what triggers the wrapping, applied by the JavaScript engine to EVERY call of that function, unconditionally.',
        'A caller that forgets this and writes <code>const result = asyncAdd(2, 3);</code> followed by <code>console.log(result + 1)</code> is not adding <code>1</code> to a number — it\'s attempting to add <code>1</code> to a <code>Promise</code> object, which produces the nonsensical string <code>"[object Promise]1"</code> rather than a runtime error, because JavaScript\'s <code>+</code> operator silently coerces the Promise to a string when one operand isn\'t a number.',
        'The correct way to get the underlying value back out is always the same regardless of how trivial the function body is: <code>await asyncAdd(2, 3)</code>, or <code>asyncAdd(2, 3).then(result => ...)</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>async always wraps in Promise demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// A perfectly synchronous computation -- no await, no I/O, nothing async at all.
async function asyncAdd(a: number, b: number): Promise<number> {
  return a + b;
}

// The exact same computation, written as an ordinary sync function.
function syncAdd(a: number, b: number): number {
  return a + b;
}

console.log('--- calling syncAdd(2, 3) directly ---');
const syncResult = syncAdd(2, 3);
console.log('typeof syncResult:', typeof syncResult);
console.log('syncResult:', syncResult);
console.log('syncResult + 1:', syncResult + 1, '<-- works correctly, 6');

console.log('--- calling asyncAdd(2, 3) WITHOUT await (the mistake) ---');
const asyncResultUnawaited = asyncAdd(2, 3);
console.log('typeof asyncResultUnawaited:', typeof asyncResultUnawaited);
console.log('asyncResultUnawaited:', asyncResultUnawaited, '<-- a Promise object, not the number 5');
console.log('asyncResultUnawaited + 1:', (asyncResultUnawaited as any) + 1, '<-- nonsense string, not 6');

console.log('--- calling asyncAdd(2, 3) WITH await (correct) ---');
async function main() {
  const asyncResultAwaited = await asyncAdd(2, 3);
  console.log('typeof asyncResultAwaited:', typeof asyncResultAwaited);
  console.log('asyncResultAwaited:', asyncResultAwaited);
  console.log('asyncResultAwaited + 1:', asyncResultAwaited + 1, '<-- works correctly, 6');
}
main();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Compare the <code>typeof</code> logged for <code>syncResult</code>, the un-awaited <code>asyncResultUnawaited</code>, and the awaited <code>asyncResultAwaited</code>. Which one is <code>"object"</code> instead of <code>"number"</code>, and why?',
    hint: 'asyncAdd and syncAdd have the literal same function body (return a + b) — the only difference between them is the async keyword on the function declaration itself.',
    solution: `syncResult logs typeof "number" -- syncAdd is an ordinary function,
so it returns exactly what its return statement produced.

asyncResultUnawaited logs typeof "object" -- even though asyncAdd's
body is 100% synchronous (return a + b, no await anywhere), marking
the function async means every call to it returns a Promise object
wrapping that value, not the value itself. Adding 1 to it produces
the nonsense string "[object Promise]1" instead of throwing an
error, because JavaScript's + operator silently stringifies the
Promise when it can't add it as a number.

asyncResultAwaited logs typeof "number" again -- because it's
declared with "await asyncAdd(2, 3)" inside another async function,
which unwraps the Promise and extracts the resolved value (5)
before assigning it to the variable.

The lesson: the async keyword's effect on a function's return type
is unconditional and mechanical -- it doesn't matter whether the
function body actually does anything asynchronous. Any caller MUST
either await the call or chain a .then() to get the real value back
out, every single time.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a function only needs to be treated as returning a Promise if its body actually contains an await or does real asynchronous work — a trivial async function that just does return a + b behaves like a normal function to its callers.',
      reality: 'the <code>async</code> keyword ALWAYS wraps the return value in a Promise, unconditionally, regardless of whether the function body contains any actual asynchronous work — a caller must always <code>await</code> it or use <code>.then()</code>.',
    },
    {
      thought: 'adding 1 to an un-awaited async function\'s return value throws a runtime TypeError, making the mistake obvious and easy to catch immediately.',
      reality: 'no error is thrown at all — JavaScript\'s <code>+</code> operator silently coerces the Promise object to its string representation, producing a nonsensical concatenated result like <code>"[object Promise]1"</code> instead of a number, which can silently corrupt data far from where the actual mistake was made.',
    },
    {
      thought: 'marking a function async is essentially free — a stylistic choice that only matters if you plan to add await later, with no real behavioral difference in the meantime.',
      reality: 'marking a function async is a real, immediate change to its return TYPE and calling contract — every existing caller of a function that gets the <code>async</code> keyword added to it must be updated to <code>await</code> the result (or chain <code>.then()</code>), or it will silently receive a Promise object instead of the value it used to get.',
    },
  ];
}
