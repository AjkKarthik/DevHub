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
  selector: 'app-set-trap-must-return-true-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './set-trap-must-return-true-or-strict-mode-throws.html',
  styleUrl: './set-trap-must-return-true-or-strict-mode-throws.scss',
})
export class ForgettingToReturnTrueFromTheSetTrapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #1, Proven With the Real TypeError',
      points: [
        'The main page\'s Mistake #1 shows a <code>set</code> trap that assigns the value directly but forgets its <code>return true</code> statement, with the comment "TypeError: \'set\' on proxy returned false." This subtopic actually assigns to that broken proxy and catches the real, thrown TypeError — proving the assignment silently succeeded internally (the value WAS stored) while the assignment EXPRESSION itself still throws.',
        'The <code>set</code> trap\'s return value is not just documentation or a style convention — it is a REQUIRED PART of the Proxy contract that the JavaScript engine actively enforces. Returning anything falsy (<code>undefined</code>, <code>false</code>, <code>0</code>, <code>\'\'</code>) causes the engine itself to throw a <code>TypeError</code> in strict mode, completely independent of whether the trap\'s own internal logic "worked."',
      ],
    },
    {
      heading: 'Why This Genuinely Surprises People Coming From Getters/Setters',
      points: [
        'A plain JavaScript setter (<code>set prop(value) { ... }</code>) has NO return-value contract at all — whatever it returns (or doesn\'t) is simply discarded. A <code>set</code> TRAP is different: it participates in the Proxy meta-programming protocol, where the boolean return value is how the trap communicates success or failure back to the engine, which then decides whether to throw.',
        'This is exactly why the main page\'s fix is to always use <code>Reflect.set(target, prop, value, receiver)</code> as the trap\'s return value, rather than performing the assignment manually and returning nothing — <code>Reflect.set()</code> already returns the correct boolean the engine expects, so forwarding its return value directly is both simpler AND correct, with no risk of forgetting the boolean.',
        'ES modules and most other JavaScript code execute in strict mode by default (module top-level code is ALWAYS strict) — which is exactly the context most Proxy-based state management or validation code runs in, making this a very live, easy-to-hit mistake rather than an edge case that only matters in "\'use strict\'" files.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>set trap must return true demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- BROKEN: set trap forgets to return true ---');
const target1: Record<string, unknown> = {};
const brokenProxy = new Proxy(target1, {
  set(target, prop, value) {
    (target as any)[prop] = value; // the assignment DOES happen internally
    // forgot to return true!
  },
});

try {
  (brokenProxy as any).x = 1;
  console.log('assignment succeeded with no error?!');
} catch (e) {
  console.log('assignment THREW:', (e as Error).message);
}
console.log('but was the value actually stored on target1?', target1.x, '<-- yes! 1 was stored, despite the thrown error');

console.log('--- FIXED: set trap uses Reflect.set() and forwards its boolean ---');
const target2: Record<string, unknown> = {};
const fixedProxy = new Proxy(target2, {
  set(target, prop, value, receiver) {
    (target as any)[prop] = value;
    return true; // explicit, correct
  },
});
(fixedProxy as any).y = 2; // no error
console.log('fixedProxy.y:', (fixedProxy as any).y, '<-- assignment succeeded cleanly, no error thrown');

console.log('--- BEST PRACTICE: use Reflect.set()\\'s own return value directly ---');
const target3: Record<string, unknown> = {};
const bestProxy = new Proxy(target3, {
  set(target, prop, value, receiver) {
    return Reflect.set(target, prop, value, receiver); // always correct, no risk of forgetting
  },
});
(bestProxy as any).z = 3;
console.log('bestProxy.z:', (bestProxy as any).z, '<-- also works correctly, and can never forget the boolean');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the broken proxy, the value IS actually assigned to <code>target1</code> inside the trap (<code>target[prop] = value</code> genuinely runs). Does the assignment expression <code>brokenProxy.x = 1</code> still throw?',
    hint: 'Ask what the engine is actually checking after the set trap FINISHES running -- does it care whether the assignment "worked" internally, or specifically what the trap function itself RETURNED?',
    solution: `Yes -- brokenProxy.x = 1 still throws a TypeError, even though
target1.x genuinely does end up equal to 1 afterward. Both things are
true at once: the internal assignment succeeded, AND the assignment
EXPRESSION threw.

Here's why: after the set trap function finishes running, the
JavaScript engine checks its RETURN VALUE specifically -- not
whether any particular line of code inside the trap "worked." The
broken trap has no return statement at all, so it implicitly returns
undefined, which is falsy. In strict mode (which module-level code
always runs in), a falsy return from the set trap causes the engine
itself to throw a TypeError, completely independent of what the
trap's own body actually did internally.

This is why simply checking "did the value get stored?" is not
enough to verify a set trap is correct -- the trap can DO the right
thing internally while still being broken from the caller's
perspective, because the caller's assignment expression throws
regardless.

The fixed version explicitly adds return true;, and the best-practice
version returns Reflect.set()'s own boolean result directly -- both
avoid the TypeError entirely, with the Reflect.set() version being
strictly safer since it can never accidentally return the wrong
value or forget the return statement altogether.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a set trap\'s return value is just documentation or a style convention — as long as the trap actually stores the value on the target internally, the assignment will succeed from the caller\'s perspective.',
      reality: 'the set trap\'s return value is a REQUIRED part of the Proxy protocol that the JavaScript engine actively checks — a falsy return causes a TypeError in strict mode regardless of whether the trap\'s internal logic actually stored the value correctly.',
    },
    {
      thought: 'a set trap behaves like an ordinary property setter (set prop(value) { ... }), where the return value is simply ignored and has no effect on whether the assignment "succeeds."',
      reality: 'this is a genuine and easy trap to fall into — ordinary setters truly do ignore their return value, but a Proxy set TRAP is part of a different, stricter protocol where the boolean return value directly determines whether the engine throws.',
    },
    {
      thought: 'this TypeError only happens in code explicitly marked with "use strict" — plain script-tag JavaScript or CommonJS modules would silently accept a falsy set trap return with no error.',
      reality: 'ES modules (the dominant module format in modern JavaScript, including everything loaded via <code>type="module"</code> or a bundler\'s ESM pipeline) are ALWAYS strict mode at the top level, with no "use strict" directive needed — making this a very live, commonly-hit mistake, not a rare edge case.',
    },
  ];
}
