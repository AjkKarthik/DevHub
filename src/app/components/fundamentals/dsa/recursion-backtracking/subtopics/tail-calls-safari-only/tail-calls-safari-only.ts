import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-tail-calls-safari-only',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tail-calls-safari-only.html',
  styleUrl: './tail-calls-safari-only.scss'
})
export class TailCallsSafariOnlySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the Spec Says Versus What Engines Ship',
      points: [
        'The main page said tail-call optimization is something "some languages" do and "JavaScript does not". The language itself says otherwise: ES2015 requires <em>proper tail calls</em>. When strict-mode code returns the result of a call directly, the engine must reuse the caller\'s stack frame instead of pushing a new one.',
        'Only Safari\'s JavaScriptCore implements this, as described on WebKit\'s own engineering blog. V8 had an implementation and removed it (commits from 2016 and 2017 strip tail-call support from Crankshaft and then TurboFan), so Chrome, Edge and Node do not have it. Firefox does not ship it either.',
        'Measured in Node 22: a strict-mode, correctly tail-recursive sum returned 500,500 for n = 1,000 and threw <code>RangeError: Maximum call stack size exceeded</code> at n = 10,000. On Node the tail position earns nothing.',
        'The portable fixes are a plain loop, which is what a tail call compiles to anyway, or a trampoline: the function returns a thunk instead of calling itself, and a small driver loop keeps calling thunks until a non-function value comes back. Both summed to 500,000,500,000 for n = 1,000,000 in Node.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tail recursion overflows in Node; loop and trampoline do not',
      language: 'typescript',
      code: `'use strict';

// Correct tail position: the recursive call is returned directly.
function sumTail(n: number, acc: number): number {
  if (n === 0) return acc;
  return sumTail(n - 1, acc + n);
}

sumTail(1_000, 0);   // 500500
sumTail(10_000, 0);  // Node 22: RangeError: Maximum call stack size exceeded
                     // Safari: 50005000 (frame reused, per the ES2015 spec)

// Fix 1: the loop a tail call is equivalent to
function sumLoop(n: number): number {
  let acc = 0;
  while (n > 0) { acc += n; n--; }
  return acc;
}
sumLoop(1_000_000);  // 500000500000

// Fix 2: trampoline -- return a thunk instead of making the call
type Thunk<T> = T | (() => Thunk<T>);
function trampoline<T>(result: Thunk<T>): T {
  while (typeof result === 'function') result = (result as () => Thunk<T>)();
  return result;
}
function sumStep(n: number, acc: number): Thunk<number> {
  return n === 0 ? acc : () => sumStep(n - 1, acc + n);
}
trampoline(sumStep(1_000_000, 0));  // 500000500000`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Is <code>return n * factorial(n - 1);</code> a tail call that Safari could run in constant stack space?',
    hint: 'After the recursive call returns, is there still work left in the current frame?',
    solution: 'No. The multiplication by n happens after factorial(n - 1) returns, so the current frame must stay alive to finish it. A tail call has to be the very last action, with its result returned unchanged. The tail-recursive form passes the running product as an accumulator: return factorialAcc(n - 1, acc * n). Even then it only runs in constant stack in Safari; in Node it still needs a loop or a trampoline.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Tail-call optimization is an optional compiler trick, so its absence in JavaScript is just a missing optimization.',
      reality: 'For JavaScript it is not optional on paper. ES2015 specifies proper tail calls as required behavior in strict mode, which is why WebKit\'s blog distinguishes "proper tail calls" (a spec guarantee) from "tail call optimization" (an optional speed-up). Most engines simply do not conform on this point.',
    },
    {
      thought: 'Writing recursion in tail form is enough to make it safe for deep inputs in a backtracking solution.',
      reality: 'Only on Safari. Node, Chrome and Firefox still push a frame per call, and the measured limit in Node 22 was below 10,000 calls. Backtracking depth is usually small (the length of the current path), which is why it rarely hits this, but a recursion whose depth grows with the input size should be converted to a loop.',
    },
  ];
}
