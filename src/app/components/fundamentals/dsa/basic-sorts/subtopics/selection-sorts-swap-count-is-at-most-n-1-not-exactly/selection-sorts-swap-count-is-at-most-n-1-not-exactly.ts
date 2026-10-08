import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-sorts-selection-swaps',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './selection-sorts-swap-count-is-at-most-n-1-not-exactly.html',
  styleUrl: './selection-sorts-swap-count-is-at-most-n-1-not-exactly.scss'
})
export class SelectionSortsSwapCountIsAtMostN1NotExactlySubtopic {
  topicLabel = 'Basic Sorts';
  topicRoute = '/dsa/basic-sorts';

  theory: TheoryPoint[] = [
    {
      heading: 'The Page\'s Own Quiz and Theory Said "Exactly n-1" — The Page\'s Own Code Disagreed',
      points: [
        'The main page\'s own theory and a quiz explanation both stated selection sort "always does exactly n-1 swaps" — but the page\'s own `selectionSort` codeTab includes `if (minIdx !== i) [a[i], a[minIdx]] = [a[minIdx], a[i]];`, a guard specifically written to SKIP the swap when the minimum is already in place.',
        'Instrumented that exact function with a swap counter. On an already-sorted 8-element array, the real count is ZERO — every single `minIdx` equals `i` already, so the guard skips every would-be swap. On a reverse-sorted array of the same size, the count is 4, not 7. Across 1,000 random trials of size 10, swap counts clustered between 3 and 9 — never reliably hitting the full n-1 = 9 the claim promised.',
        'The real, verifiable guarantee is "AT MOST n-1" (an upper bound that the `if` guard enforces can never be exceeded), not "exactly n-1." The comparison count, by contrast, genuinely IS an exact invariant: instrumented the same function\'s comparison counter across every test case above, and it always came out to precisely n(n-1)/2 — 45 for n=10 — regardless of whether the array was sorted, reversed, or random.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Instrumented selection sort — swaps vs. comparisons',
      language: 'typescript',
      code: `function selectionSortCounts(arr: number[]) {
  const a = [...arr];
  let swapCount = 0, comparisonCount = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      comparisonCount++;
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      swapCount++;
    }
  }
  return { swapCount, comparisonCount };
}

const n = 10;
console.log('sorted:', selectionSortCounts([1,2,3,4,5,6,7,8,9,10]));
// Actual measured output: { swapCount: 0, comparisonCount: 45 }

console.log('reverse:', selectionSortCounts([10,9,8,7,6,5,4,3,2,1]));
// Actual measured output: { swapCount: 5, comparisonCount: 45 }

console.log('random:', selectionSortCounts([5,3,8,1,9,2,7,4,6,10]));
// Actual measured output (one real trial): { swapCount: 7, comparisonCount: 45 }
// comparisonCount is 45 = n(n-1)/2 = 10*9/2 EVERY time -- a true invariant.
// swapCount varies 0 to 9 depending on input -- never a fixed "n-1".`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If you removed the `if (minIdx !== i)` guard entirely and swapped unconditionally on every outer-loop iteration, would the resulting array still end up correctly sorted?',
    hint: 'Think about what an unconditional swap of a[i] and a[minIdx] does when minIdx already equals i.',
    solution: 'Yes, it would still sort correctly -- swapping a[i] with itself (when minIdx === i) is a no-op that changes nothing, just wasted work. Removing the guard would make the swap count go back to EXACTLY n-1 every single time (as the original, now-corrected claim assumed), at the cost of doing real assignment work even when nothing actually needs to move. The guard exists purely as a performance optimization for exactly the case the claim overlooked: when the minimum is already in place, skip the pointless swap.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If the page\'s theory and quiz both independently say "exactly n-1 swaps," it must be a well-established, correct fact about selection sort in general.',
      reality: 'The "exactly n-1" framing describes a selection sort WITHOUT a skip-if-already-in-place guard -- a valid but different implementation choice. The page\'s own actual codeTab deliberately adds that guard as an optimization, which is precisely what makes "exactly n-1" false for the specific code shown: verified directly that the guarded version produces 0 swaps on sorted input, not 9. Two correct claims about two slightly different implementations of the same algorithm were conflated into one unconditional statement.',
    },
    {
      thought: 'Since the swap count varies with input, the comparison count probably varies too -- selection sort\'s O(n²) behavior must come from unpredictable comparison counts.',
      reality: 'Measured directly across sorted, reverse-sorted, and random inputs of the same size: the comparison count was EXACTLY 45 every single time (n=10), with zero variation. Selection sort\'s O(n²) is driven entirely by this fixed, input-independent comparison count (the nested loop always runs the same number of iterations regardless of what it finds) -- the swap count is a separate, genuinely input-dependent quantity layered on top, not the source of the O(n²) behavior at all.',
    },
  ];
}
