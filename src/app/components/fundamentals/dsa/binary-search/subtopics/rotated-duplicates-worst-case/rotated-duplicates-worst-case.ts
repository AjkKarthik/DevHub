import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-rotated-duplicates-worst-case',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rotated-duplicates-worst-case.html',
  styleUrl: './rotated-duplicates-worst-case.scss'
})
export class RotatedDuplicatesWorstCaseSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'When the Sorted Half Cannot Be Identified',
      points: [
        'The main page\'s <code>searchRotated</code> decides which half is sorted by testing <code>nums[lo] &lt;= nums[mid]</code>. With distinct values that test is reliable. With duplicates it is not: when <code>nums[lo]</code>, <code>nums[mid]</code> and <code>nums[hi]</code> are all equal, either half could contain the rotation point.',
        'Run directly, the page\'s own function finds 2 in <code>[1,1,1,1,1,2,1,1,1]</code> (index 5) but returns -1 for <code>[1,1,1,2,1,1,1,1,1]</code>, where 2 is at index 3. The test wrongly treats the left half as sorted, sees 2 outside the range 1 to 1, and discards the half that holds it.',
        'The standard fix, which the main page mentions in its theory and QnA, is to shrink both ends by one when all three values are equal, then try again. With that change both arrays return the right index.',
        'The cost is the guarantee. Each tie removes only two elements instead of half the range. Measured on arrays of all 1s while searching for 2: 50 iterations for n = 100, 500 for n = 1,000 and 5,000 for n = 10,000 — n / 2 each time, which is O(n). No algorithm does better in the worst case, because telling such an array apart from one with a single different value somewhere needs a look at every position.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Duplicate-safe rotated search, and its O(n) worst case',
      language: 'typescript',
      code: `function searchRotatedDup(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    // Ambiguous: cannot tell which half is sorted, so shrink both ends
    if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) { lo++; hi--; continue; }
    if (nums[lo] <= nums[mid]) {            // left half sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {                                // right half sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

// The main page's searchRotated (no tie handling):
//   [1,1,1,1,1,2,1,1,1], target 2  ->  5   (correct)
//   [1,1,1,2,1,1,1,1,1], target 2  -> -1   (WRONG, 2 is at index 3)
// searchRotatedDup on both arrays  ->  5 and 3

// Iterations on an array of n ones, searching for 2:
//   n = 100     ->    50
//   n = 1,000   ->   500
//   n = 10,000  -> 5,000   (n / 2: linear, not logarithmic)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s challenge, Find Minimum in Rotated Sorted Array, compares <code>nums[mid]</code> with <code>nums[hi]</code> and assumes no duplicates. If duplicates are allowed and <code>nums[mid] === nums[hi]</code>, what is a safe update, and what does it do to the worst case?',
    hint: 'If the two values are equal, can nums[hi] be the only copy of the minimum?',
    solution: 'Decrement hi by one. If nums[mid] equals nums[hi], removing hi cannot lose the minimum value, because an equal copy still exists at mid. Like the tie rule in the search, this removes one element per step instead of half, so the worst case becomes O(n) — on an array of all equal values the loop runs n - 1 times.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding the tie-break rule keeps rotated search at O(log n); it just adds an extra step now and then.',
      reality: 'The tie-break removes one element from each end per step. On inputs made mostly of one repeated value it fires almost every step, so the loop runs about n / 2 times. The average on varied data stays close to O(log n), but the worst case is O(n).',
    },
    {
      thought: 'Because the original function only fails when duplicates are present, it is safe to use on any array with no repeated value next to the target.',
      reality: 'The failure depends on whether <code>nums[lo]</code>, <code>nums[mid]</code> and <code>nums[hi]</code> happen to be equal at some step, not on what sits next to the target. Any input with duplicates can trigger it, so use the duplicate-safe version whenever duplicates are possible.',
    },
  ];
}
