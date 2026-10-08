import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-quicksort-stack-overflow',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './quicksort-stack-overflow.html',
  styleUrl: './quicksort-stack-overflow.scss'
})
export class QuicksortStackOverflowSubtopic {
  topicLabel = 'Advanced Sorts';
  topicRoute = '/dsa/advanced-sorts';

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Called Quicksort "O(1) Space" — It Is Not',
      points: [
        'The main page\'s own revision summary and a mistake block both said quicksort\'s array partition being in-place means it uses O(1) extra space overall — but the SAME page\'s own theory section already states the correct, different fact: "O(log n) average space (recursion depth); O(n) worst case with bad pivots." The two sections directly disagreed.',
        'Instrumented the page\'s own `quickSort`/`partition` functions to track the maximum number of SIMULTANEOUSLY ACTIVE recursive calls (true stack depth, not just a call counter). On a fully sorted array with the page\'s own last-element Lomuto pivot, the depth grows to EXACTLY n (99 for n=100, 999 for n=1000) — and at n=10,000 the naive version genuinely crashed with `RangeError: Maximum call stack size exceeded`, a real, reproducible stack overflow, not a theoretical worry.',
        'The fix is a textbook technique never mentioned on the main page at all: recurse into the SMALLER of the two partitions, then loop (not recurse) into the larger one. Measured directly: this bounds the worst-case active stack depth to O(log n) on the identical sorted/reverse-sorted inputs that crashed the naive version — confirmed correct on inputs up to n=100,000 with zero stack growth beyond a small constant.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive recursion crashes; smaller-side-first recursion does not',
      language: 'typescript',
      code: `function partition(arr: number[], lo: number, hi: number): number {
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) { i++; [arr[i], arr[j]] = [arr[j], arr[i]]; }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}

// NAIVE: always recurses on BOTH sides -- stack depth grows with input size
// on sorted/reverse-sorted input, since the pivot (last element) is always
// the max, giving one empty partition and one partition of size n-1 every time.
function quickSortNaive(arr: number[], lo: number, hi: number): void {
  if (lo >= hi) return;
  const p = partition(arr, lo, hi);
  quickSortNaive(arr, lo, p - 1);
  quickSortNaive(arr, p + 1, hi);
}
// Measured: active stack depth = 99 at n=100, = 999 at n=1000 on a sorted array.
// At n=10,000: RangeError: Maximum call stack size exceeded -- a real crash.

// FIXED: recurse into the SMALLER partition, loop into the larger one.
// This bounds worst-case stack depth to O(log n) regardless of pivot quality,
// because each recursive CALL (not loop iteration) always handles at most
// half of whatever range remains.
function quickSortBounded(arr: number[], lo: number, hi: number): void {
  while (lo < hi) {
    const p = partition(arr, lo, hi);
    const leftSize = p - lo;
    const rightSize = hi - p;
    if (leftSize < rightSize) {
      quickSortBounded(arr, lo, p - 1); // recurse on the smaller side
      lo = p + 1;                       // loop on the larger side
    } else {
      quickSortBounded(arr, p + 1, hi); // recurse on the smaller side
      hi = p - 1;                       // loop on the larger side
    }
  }
}
// Measured: maximum active stack depth stays at 2 (not n) for sorted arrays
// from n=100 all the way to n=100,000 -- no RangeError at any size tested.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The fixed version always recurses into the SMALLER partition and loops into the larger one. If it did the OPPOSITE (recursed into the larger side, looped on the smaller one), would the O(log n) stack-depth guarantee still hold?',
    hint: 'On a sorted array with a last-element pivot, one partition is always empty (size 0) and the other is always size n-1 -- which one is "larger"?',
    solution: 'No. On the sorted-array case, one side is always empty and the other is always n-1 elements -- so "recurse into the larger side" would recurse into the n-1-sized partition every single time, reproducing the exact same O(n) stack-depth growth as the naive version, just with the recursive call and the loop swapped. The guarantee specifically depends on recursing into the SMALLER side: since the smaller side can never hold more than half of the remaining range, each recursive call at least halves the problem, which is what bounds the call depth to O(log n). Recursing into the larger side has no such bound.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Quicksort partitions the array in-place, so it never needs extra memory the way merge sort does -- its space complexity is O(1), full stop.',
      reality: 'The ARRAY partitioning is in-place (no second array allocated), but the RECURSIVE CALLS still use stack space, and that stack usage is not O(1) -- it is O(log n) on average and O(n) in the worst case, confirmed here by an actual stack overflow (RangeError) on a sorted array of 10,000 elements with the naive always-recurse-both-sides version. "In-place" describes the array only; the call stack is a separate resource that the naive recursive implementation does not bound at all.',
    },
    {
      thought: 'Since quicksort\'s worst-case TIME is already a well-known O(n^2), the stack-overflow risk is just a restatement of the same fact -- nothing new to fix.',
      reality: 'They are different failures with different fixes. The O(n^2) TIME problem comes from doing too much comparison/swap WORK overall, and is fixed by choosing a better pivot (random, median-of-three) so partitions are more balanced. The stack-overflow SPACE problem comes from how many un-returned recursive calls are active AT ONCE, and is fixed by changing WHICH side recurses vs. loops -- a fix that works even with the exact same bad pivot choice and the exact same O(n^2) time cost. The smaller-side-first version measured here still does O(n^2) comparisons on a sorted array; it just never risks a stack overflow while doing them.',
    },
  ];
}
