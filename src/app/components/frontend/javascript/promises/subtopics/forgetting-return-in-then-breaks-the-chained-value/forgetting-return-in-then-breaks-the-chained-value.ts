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
  selector: 'app-forgetting-return-in-then-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './forgetting-return-in-then-breaks-the-chained-value.html',
  styleUrl: './forgetting-return-in-then-breaks-the-chained-value.scss',
})
export class ForgettingReturnInThenBreaksTheChainedValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Warning, Made Concrete',
      points: [
        'The main Promises page states: "if you forget to return from a .then(), the chain receives undefined instead of the inner value." This subtopic builds exactly that broken chain and shows the undefined actually propagating through two more .then() steps, instead of just describing the rule abstractly.',
        'A <code>.then(callback)</code> call always returns a NEW promise. What that new promise resolves to depends entirely on what <code>callback</code> RETURNS — if <code>callback</code> returns a value, the new promise resolves to that value; if <code>callback</code> has no explicit <code>return</code> statement, it implicitly returns <code>undefined</code>, and the new promise resolves to <code>undefined</code> instead.',
      ],
    },
    {
      heading: 'Why This Mistake Is Easy to Make and Easy to Miss',
      points: [
        'It is especially easy to lose the <code>return</code> keyword when a <code>.then()</code> callback body has more than one statement and uses curly braces — <code>promise.then(val => { doSomething(val); anotherStep(val); })</code> silently returns <code>undefined</code>, whereas the single-expression arrow form <code>promise.then(val => transform(val))</code> returns the expression\'s value automatically with no <code>return</code> needed at all.',
        'The bug rarely throws an error — the chain keeps running, just with <code>undefined</code> silently replacing the real value at every subsequent step, which is exactly what makes it hard to spot without deliberately logging each stage.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Broken .then() chain demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function fetchUser(): Promise<{ id: number; name: string }> {
  return Promise.resolve({ id: 7, name: 'Ada' });
}

function fetchOrderCount(userId: number): Promise<number> {
  return Promise.resolve(userId === 7 ? 12 : 0);
}

console.log('--- BROKEN chain (missing return) ---');
fetchUser()
  .then(user => {
    console.log('Step 1 received user:', user);
    fetchOrderCount(user.id);
    // BUG: no return here! the outer .then() implicitly returns undefined.
  })
  .then(orderCountPromiseResult => {
    console.log('Step 2 received:', orderCountPromiseResult, '<-- undefined, not the order count!');
    return orderCountPromiseResult;
  })
  .then(finalValue => {
    console.log('Step 3 received:', finalValue, '<-- still undefined, the break propagated all the way down');
  });

console.log('--- FIXED chain (return added) ---');
fetchUser()
  .then(user => {
    console.log('Step 1 received user:', user);
    return fetchOrderCount(user.id);
    // FIX: returning the promise lets the next .then() wait for it and receive its real value.
  })
  .then(orderCount => {
    console.log('Step 2 received:', orderCount, '<-- the real order count, 12');
    return orderCount * 2;
  })
  .then(finalValue => {
    console.log('Step 3 received:', finalValue, '<-- 24, correctly derived from the real value');
  });
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Compare the two chains\' console output. In the broken chain, at which step does the value first become <code>undefined</code> — Step 1, Step 2, or Step 3?',
    hint: 'The break happens where the return statement is missing, not where undefined is first logged — think about which .then() callback actually swallowed the returned promise.',
    solution: `Step 2 is the first place "undefined" is logged, but the actual BUG
lives in Step 1's callback -- it calls fetchOrderCount(user.id) but
never returns the result, so the promise Step 1's .then() implicitly
returns is a promise that resolves to undefined.

Step 2 then receives that undefined value (not the real order
count), logs it, and returns it unchanged -- so Step 3 also receives
undefined, all the way down the chain.

In the FIXED chain, Step 1 explicitly returns
fetchOrderCount(user.id) -- since .then() automatically "flattens" a
returned promise (waiting for it to settle before passing its
resolved value onward), Step 2 correctly receives the real order
count (12), not the promise object itself and not undefined.

The lesson: a missing return doesn't cause an error -- it silently
converts every downstream step's value into undefined, and the
first place you'll actually SEE that undefined is one step after
the step where the return was actually missing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a .then() callback\'s last line is a function call that itself returns a promise, that promise\'s eventual value automatically becomes the next .then()\'s input, even without an explicit return.',
      reality: 'JavaScript never implicitly returns a value from a multi-statement arrow function or a regular function body — without an explicit <code>return</code> keyword, the callback returns <code>undefined</code> no matter what the last line inside it was.',
    },
    {
      thought: 'forgetting return inside a .then() callback throws an error or at least logs a warning, making the mistake easy to catch.',
      reality: 'nothing throws — the chain keeps running normally, just silently passing <code>undefined</code> forward instead of the real value, which is exactly what makes this bug hard to notice without deliberately logging each step.',
    },
    {
      thought: 'this only matters for the specific value passed between .then() calls — it has no effect on error handling or timing further down the chain.',
      reality: 'forgetting to return a PROMISE (as opposed to a plain value) is worse than losing a value — it also breaks the chain\'s ability to wait for that promise to settle, so a later <code>.then()</code> can run before the "forgotten" async work has even finished.',
    },
  ];
}
