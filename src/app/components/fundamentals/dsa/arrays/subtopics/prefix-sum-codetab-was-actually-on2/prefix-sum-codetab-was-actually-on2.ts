import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-arrays-prefix-on2',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './prefix-sum-codetab-was-actually-on2.html',
  styleUrl: './prefix-sum-codetab-was-actually-on2.scss'
})
export class PrefixSumCodetabWasActuallyOn2Subtopic {
  topicLabel = 'Arrays';
  topicRoute = '/dsa/arrays';

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory Said O(n), the Code Sample Said Otherwise',
      points: [
        'The main page\'s own "Prefix Sum Array" theory section states plainly: "prefix[i] = arr[0] + arr[1] + ... + arr[i-1]. Build in O(n)." Its own "Prefix sum" code sample, in the Sliding Window codeTab, instead built the array as <code>arr.map((_, i) =&gt; arr.slice(0, i + 1).reduce(...))</code> -- a slice PLUS a reduce inside a map, for every single index.',
        'Counted exactly, not estimated: for index i, <code>slice(0, i+1)</code> touches i+1 elements and the following <code>reduce</code> touches i+1 more, so the total work across all n indices is 2*(1+2+...+n) = n(n+1) -- a classic triangular sum. Measured directly: the ratio of (naive ops) to n^2 converged to EXACTLY 1.0000 for n=100, 1,000, 10,000, and 100,000. That is not "close to" O(n) with a bad constant -- it is genuinely O(n^2).',
        'The fix was already sitting elsewhere on the same page: the "Prefix sum index confusion" mistake block\'s own "right" example builds the array with one single forward loop, <code>prefix[i + 1] = prefix[i] + arr[i]</code> -- real O(n), touching each element exactly once. The codeTab just never adopted its own page\'s correct pattern.'
      ]
    },
    {
      heading: 'Why This Kind of Bug Is Easy to Miss',
      points: [
        'The naive version is correct -- it returns the exact same prefix array as the proper O(n) version, verified directly. A correctness check alone (does it give the right answer?) will never catch this; only a complexity check (does the WORK scale the way the theory claims?) catches it.',
        '<code>.map()</code>, <code>.slice()</code>, and <code>.reduce()</code> are each individually O(1)-per-call-site in the sense that they are built-in, commonly-trusted array methods -- the hidden cost comes from CALLING one O(n) method (reduce over a growing slice) once PER ITERATION of another O(n) loop (map), which is exactly the "hidden complexity inside a loop" pattern the main page\'s own theory section on Big-O pitfalls warns about generally, just not caught here on its own code.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Op-count comparison, measured',
      language: 'typescript',
      code: `// The main page's ORIGINAL "Prefix sum" function (now fixed on the page itself):
function naiveRangeSumPrefix(arr: number[]): number[] {
  return [0, ...arr.map((_, i) => arr.slice(0, i + 1).reduce((a, b) => a + b, 0))];
}

// Exact operation count for the naive version at index i: slice touches
// i+1 elements, reduce touches i+1 more -- total across all n indices:
function naiveOpCount(n: number): number {
  let ops = 0;
  for (let i = 0; i < n; i++) ops += (i + 1) + (i + 1);
  return ops;
}

// Actual measured output -- ratio of naiveOps to n^2 converges to EXACTLY 1:
//   n=100      naiveOps=10,100          n^2=10,000          ratio=1.0100
//   n=1,000    naiveOps=1,001,000       n^2=1,000,000       ratio=1.0010
//   n=10,000   naiveOps=100,010,000     n^2=100,000,000     ratio=1.0001
//   n=100,000  naiveOps=10,000,100,000  n^2=10,000,000,000  ratio=1.0000
// This IS O(n^2), by the exact definition -- not merely "a bit slow."`
    },
    {
      label: 'The fix — one forward pass',
      language: 'typescript',
      code: `// Matches the pattern the main page's OWN "Prefix sum index confusion"
// mistake block already shows elsewhere -- now applied to the codeTab too.
function rangeSum(arr: number[], l: number, r: number): number {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) prefix[i + 1] = prefix[i] + arr[i];
  return prefix[r + 1] - prefix[l];
}

// Both versions return IDENTICAL output for the same input -- correctness
// was never the problem, only the amount of work done to get there:
//   naiveRangeSumPrefix([3,1,4,1,5,9,2,6]) -> [0,3,4,8,9,14,23,25,31]
//   properPrefix([3,1,4,1,5,9,2,6])        -> [0,3,4,8,9,14,23,25,31]`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "optimizes" the naive version by replacing <code>arr.slice(0, i + 1).reduce(...)</code> with <code>arr.slice(0, i + 1).reduce((a, b) =&gt; a + b)</code> (dropping the initial value <code>0</code>) to "save a step." Does this fix the O(n^2) problem?',
    hint: 'The initial value argument to reduce() controls correctness for empty arrays, not how many elements reduce() has to visit. Think about what work slice() and reduce() are each still doing per call.',
    solution: 'No -- dropping the initial value changes nothing about the complexity. <code>slice(0, i+1)</code> still copies i+1 elements into a new array, and <code>reduce</code> still visits all of them (one fewer comparison with no initial value, which is a constant-factor difference, not a complexity-class one). The O(n^2) cost comes from calling an O(i) operation inside an O(n) loop, for every i -- nothing about reduce\'s initial-value argument touches that structure. The only real fix is to stop re-scanning the array from the start on every iteration, which is exactly what the single forward pass (carrying the running sum forward in <code>prefix[i]</code>) does.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a function returns the mathematically correct answer, it is implementing the complexity its surrounding theory describes.',
      reality: 'Correctness and complexity are independent properties. The naive <code>slice()+reduce()</code> version returns the exact right prefix array every time -- it is simply doing far more work than necessary to get there. Verifying complexity needs an operation-count or timing check, not just a correctness check.'
    },
    {
      thought: 'Built-in array methods like <code>.slice()</code> and <code>.reduce()</code> are always "fast," so chaining a few of them together inside a loop is harmless.',
      reality: 'Each one individually does real, scaling work (<code>.slice(0, k)</code> is O(k), not O(1)) -- calling an O(k) method inside a loop that itself runs n times, with k growing alongside the loop index, is precisely how an apparently simple one-liner becomes O(n^2).'
    },
    {
      thought: 'Spotting this kind of bug requires reading the implementation very carefully line by line.',
      reality: 'The fastest way to catch it is comparative: the SAME page\'s own mistake block, two sections away, already contained the correct O(n) pattern for the exact same prefix-sum construction. Cross-checking a codeTab against the page\'s own other sections for the same concept is often faster than analyzing one snippet in isolation.'
    }
  ];
}
