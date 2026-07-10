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
  selector: 'app-curry-fn-length-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './curry-fn-length-miscounts-default-and-rest-parameters.html',
  styleUrl: './curry-fn-length-miscounts-default-and-rest-parameters.scss',
})
export class CurryFnLengthMiscountsDefaultAndRestParametersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own curry() Utility, Pushed Past Its Documented Assumption',
      points: [
        'The main page\'s generic <code>curry(fn)</code> utility decides when it has "enough" arguments with a single check: <code>if (args.length >= fn.length)</code>. This subtopic feeds that exact utility a function with a DEFAULT parameter and a function with a REST parameter, and shows <code>fn.length</code> silently under-counts both — causing the curried function to call <code>fn</code> too early, before all the intended arguments have actually arrived.',
        '<code>Function.prototype.length</code> does NOT count every parameter a function declares — it specifically counts only the parameters BEFORE the first one with a default value or a rest parameter. This is a real, spec-defined JavaScript behavior, not a bug in the main page\'s <code>curry()</code> implementation — but it means <code>fn.length</code> is a proxy for "required positional parameter count," not "total parameter count," and the two are easy to conflate.',
      ],
    },
    {
      heading: 'Why fn.length Undercounts — and What It Means for curry()',
      points: [
        'For <code>function greet(name, greeting = \'Hello\')</code>, <code>greet.length</code> is <code>1</code>, not <code>2</code> — the moment the parser reaches <code>greeting = \'Hello\'</code>, it stops counting, since default parameters are (by design) meant to be OPTIONAL, and <code>.length</code> is meant to reflect how many arguments a caller MUST supply, not how many the function merely accepts.',
        'For <code>function sum(a, b, ...rest)</code>, <code>sum.length</code> is <code>2</code> — rest parameters can collect ZERO or more additional arguments, so they are similarly excluded from the "required" count that <code>.length</code> represents.',
        'The main page\'s <code>curry()</code> utility was written and tested against functions with only plain, required parameters — it never claims to handle default or rest parameters correctly, but nothing about its own code guards against being used that way either, which is exactly the kind of implicit assumption that\'s easy to miss until it actually breaks in a real call site.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>curry() fn.length miscounting demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own generic curry() utility, unmodified.
function curry(fn: (...args: any[]) => any) {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) return fn(...args);
    return (...more: any[]) => curried(...args, ...more);
  };
}

console.log('--- A function with a DEFAULT parameter ---');
function greet(name: string, greeting = 'Hello') {
  return greeting + ', ' + name + '!';
}
console.log('greet.length reports:', greet.length, '<-- NOT 2, even though greet takes 2 parameters');

const curriedGreet = curry(greet);
console.log('Calling curriedGreet("Alice") with ONE argument...');
const result1 = curriedGreet('Alice');
console.log('Result:', result1, '<-- fn was called immediately! greeting used its own default, but curry() thinks it already has "enough" args');

console.log('--- A function with a REST parameter ---');
function sum(a: number, b: number, ...rest: number[]) {
  return a + b + rest.reduce((s, n) => s + n, 0);
}
console.log('sum.length reports:', sum.length, '<-- only counts a and b, NOT the rest parameter');

const curriedSum = curry(sum);
console.log('Calling curriedSum(1)(2) with two calls...');
const result2 = curriedSum(1)(2);
console.log('Result:', result2, '<-- fn was called as soon as 2 args arrived; any further calls like (3) would be silently ignored');
console.log('typeof result2:', typeof result2, '<-- a number (3), NOT a function waiting for more args -- the rest parameter can never actually be filled via curry()');

console.log('--- Contrast: a function with only PLAIN required parameters (the assumption curry() was built for) ---');
function add3(a: number, b: number, c: number) { return a + b + c; }
console.log('add3.length reports:', add3.length, '<-- correctly counts all 3 required parameters');
const curriedAdd3 = curry(add3);
console.log('curriedAdd3(1)(2)(3):', curriedAdd3(1)(2)(3), '<-- works exactly as intended');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>greet(name, greeting = \'Hello\')</code> takes two parameters, but <code>curriedGreet(\'Alice\')</code> is called with only ONE argument. Does <code>curry()</code> wait for a second call, or does it invoke <code>greet</code> right away?',
    hint: 'Ask what curry()\'s if (args.length >= fn.length) check is actually comparing curriedGreet(\'Alice\')\'s 1 argument against -- the number of parameters greet visually declares, or Function.prototype.length\'s own specific counting rule?',
    solution: `curry() invokes greet immediately after just one argument -- it never
waits for a second call. curriedGreet('Alice') directly returns
"Hello, Alice!", using greeting's own default value, rather than
returning a function waiting for the greeting argument.

Here's why: greet.length reports 1, not 2, because Function.prototype.
length specifically stops counting at the first parameter with a
default value. curry()'s check, if (args.length >= fn.length), is
comparing args.length (1, from the single 'Alice' call) against
fn.length (also 1) -- since 1 >= 1 is true, curry() concludes it has
"enough" arguments and calls greet('Alice') right away, letting
greeting fall back to its own default 'Hello'.

This isn't necessarily WRONG behavior in every sense -- greet('Alice')
genuinely is a valid, complete call, since greeting is optional. But
it silently defeats the INTENDED use case of currying: being able to
supply greeting explicitly via a second call, like curriedGreet
('Alice')('Hi'). That second call never has a chance to happen,
because curry() already invoked greet after the first one.

The rest-parameter example shows a related but distinct symptom: sum.
length only counts a and b (2), so curriedSum(1)(2) invokes sum
immediately once 2 arguments arrive -- meaning the rest parameter can
NEVER actually be filled through this curry() implementation at all,
no matter how many further calls you chain.

The lesson: curry() based on fn.length silently assumes every
parameter is a plain, required, non-default, non-rest parameter --
this works perfectly for functions like add3(a, b, c), but silently
breaks the moment a default value or rest parameter enters the
signature, with no error or warning anywhere to signal it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Function.prototype.length always reports the total number of parameters a function declares, regardless of whether some of them have default values or are rest parameters.',
      reality: 'Function.prototype.length specifically counts only the parameters BEFORE the first one with a default value or a rest parameter — it represents the number of REQUIRED arguments, not the total parameter count.',
    },
    {
      thought: 'a generic curry(fn) utility based on comparing args.length to fn.length works correctly for any function, since fn.length always accurately reflects how many arguments the function needs.',
      reality: 'this specific implementation strategy silently breaks for any function with a default parameter (invokes too early, ignoring the intended later argument) or a rest parameter (can never actually be filled via currying, since fn.length excludes it entirely from the count).',
    },
    {
      thought: 'if curry() invokes a function "too early" due to a default parameter, this would produce an obvious error or incorrect-looking result that\'s easy to notice and debug.',
      reality: 'invoking the function early with a default parameter often produces a perfectly PLAUSIBLE-looking result (like "Hello, Alice!") that gives no obvious signal anything went wrong — the bug is that the SECOND intended call (to override greeting) silently never gets a chance to happen at all, which is much harder to notice than an outright error.',
    },
  ];
}
