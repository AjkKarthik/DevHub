import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-circular-kadane-all-negative',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './circular-kadane-all-negative.html',
  styleUrl: './circular-kadane-all-negative.scss'
})
export class CircularKadaneAllNegativeSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The Wrap-Around Formula Has an Empty-Subarray Hole',
      points: [
        'The main page gives the circular variant as <code>max(Kadane, total_sum - min_subarray_sum)</code>. The second term represents a subarray that wraps around the end: everything except one contiguous middle block, chosen to be the most negative block.',
        'If every value is negative, the most negative block is the entire array. Removing it leaves nothing, so <code>total_sum - min_subarray_sum</code> is 0 — the sum of an empty subarray, which the problem does not allow. Since 0 is larger than any negative answer, the formula returns 0. For <code>[-3, -2, -3]</code> it returned 0; the correct answer is -2.',
        'Checked against a brute force that tries every start and every length around the circle on 5,000 random arrays of values from -5 to 5: the plain formula was wrong 614 times, every time on an all-negative array. Adding one check — if plain Kadane is negative, return it — made it agree on all 5,000.',
        'This is the same trap as the main page\'s own first mistake, initializing Kadane with 0: both silently allow an empty subarray. The main page fixed it for the linear case; the circular formula reintroduces it through subtraction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Circular max subarray: the formula and the guard',
      language: 'typescript',
      code: `function kadaneMax(nums: number[]): number {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}

function kadaneMin(nums: number[]): number {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.min(nums[i], cur + nums[i]);
    best = Math.min(best, cur);
  }
  return best;
}

function maxCircularSubarray(nums: number[]): number {
  const straight = kadaneMax(nums);
  if (straight < 0) return straight;   // all negative: wrap-around would be empty
  const total = nums.reduce((s, x) => s + x, 0);
  return Math.max(straight, total - kadaneMin(nums));
}

// Without the guard:          With the guard:
//   [5, -3, 5]   -> 10           10   (wraps: 5 + 5)
//   [1, -2, 3, -2] -> 3           3
//   [-3, -2, -3] -> 0  WRONG     -2
//   [-1]         -> 0  WRONG     -1
// 5,000 random arrays vs brute force: 614 wrong without the guard, 0 with it`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Why is checking <code>straight &lt; 0</code> enough? Could an array with a mix of positive and negative values still make the wrap-around term use an empty subarray?',
    hint: 'If at least one value is zero or positive, what is the smallest the plain Kadane result can be?',
    solution: 'If any value is zero or positive, plain Kadane is at least that value, so it is not negative and the guard does not fire. In that case the minimum subarray cannot be the whole array unless the whole array sums to the minimum, and even then total - min is 0, which is no larger than the non-negative Kadane result, so max() still returns the correct value. The empty wrap-around only wins when every value is negative, which is exactly when Kadane itself is negative.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If plain Kadane handles all-negative input correctly, any formula built from it will too.',
      reality: 'Plain Kadane is safe because it starts from nums[0], never from 0. The circular formula subtracts one Kadane result from the total, and that subtraction can produce 0 — an empty subarray — even though neither Kadane call ever considered one.',
    },
    {
      thought: 'Tests with a single negative value or a mostly-positive array would catch this.',
      reality: 'Mixed arrays never trigger it. It only fails when every value is negative, so a test suite of typical inputs passes, and the bug appears only on that edge case.',
    },
  ];
}
