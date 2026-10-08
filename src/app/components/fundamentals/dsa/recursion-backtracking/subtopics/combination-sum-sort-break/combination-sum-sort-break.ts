import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-combination-sum-sort-break',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './combination-sum-sort-break.html',
  styleUrl: './combination-sum-sort-break.scss'
})
export class CombinationSumSortBreakSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two Pruning Checks, Counted Call by Call',
      points: [
        'The main page\'s <code>combinationSum</code> prunes with <code>if (remaining &lt; 0) return;</code> at the top of each call. Its own "No pruning" mistake block mentions a second option in one line: sort the candidates and <code>break</code> once <code>candidates[i] &gt; remaining</code>. Neither section says how the two compare, so both were instrumented with a call counter.',
        'The negative check only fires after a call has already been made for the overshooting candidate. Sort-and-break never makes that call, and because the array is sorted, one failing candidate rules out every larger candidate after it in the same loop.',
        'Measured, with identical result sets in every case: [2,3,6,7] with target 7 went from 28 calls to 10; [2,3,5] with target 8 from 23 to 13; six candidates 2 to 7 with target 30 from 2,176 to 1,824; seven candidates with target 40 from 5,448 to 4,803.',
        'The saving shrinks as the answer count grows. Both versions must still visit every path that leads to one of the 245 or 608 valid combinations; pruning only removes the dead ends hanging off those paths. Pruning reduces wasted calls, it does not change the exponential number of valid answers that have to be produced.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Negative-remaining check vs sort and break, with call counts',
      language: 'typescript',
      code: `// The main page's version: prune one call too late
function combinationSumCheck(candidates: number[], target: number): number {
  let calls = 0;
  const result: number[][] = [];
  function backtrack(start: number, current: number[], remaining: number): void {
    calls++;
    if (remaining === 0) { result.push([...current]); return; }
    if (remaining < 0) return;               // the overshoot already cost a call
    for (let i = start; i < candidates.length; i++) {
      current.push(candidates[i]);
      backtrack(i, current, remaining - candidates[i]);
      current.pop();
    }
  }
  backtrack(0, [], target);
  return calls;
}

// Sort once, then stop the loop at the first candidate that is too big
function combinationSumBreak(candidates: number[], target: number): number {
  const sorted = [...candidates].sort((a, b) => a - b);
  let calls = 0;
  const result: number[][] = [];
  function backtrack(start: number, current: number[], remaining: number): void {
    calls++;
    if (remaining === 0) { result.push([...current]); return; }
    for (let i = start; i < sorted.length; i++) {
      if (sorted[i] > remaining) break;      // every later candidate is larger too
      current.push(sorted[i]);
      backtrack(i, current, remaining - sorted[i]);
      current.pop();
    }
  }
  backtrack(0, [], target);
  return calls;
}

// Same combinations found by both; calls made:
//   [2,3,6,7], 7               28  ->  10   (2 combinations)
//   [2,3,5], 8                 23  ->  13   (3 combinations)
//   [7,6,5,4,3,2], 30       2,176  -> 1,824 (245 combinations)
//   [12,10,8,6,4,3,2], 40   5,448  -> 4,803 (608 combinations)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate keeps the main page\'s unsorted loop but replaces <code>break</code> with <code>continue</code> when <code>candidates[i] &gt; remaining</code>. Does that give the same savings as sort and break?',
    hint: 'Without sorting, can a smaller candidate appear later in the array?',
    solution: 'It removes the overshooting calls, so it beats the negative-remaining check, but it cannot stop early. Without sorting, a smaller candidate may come later in the array, so every candidate must still be checked one by one. Sorting is what makes it safe to break, because once one candidate is too big, all the rest are too. The call count matches the sorted version, but each loop does more comparisons.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding a good pruning check turns an exponential backtracking search into a fast one.',
      reality: 'It removes dead ends, not answers. With 608 valid combinations, both versions had to build all 608, and the better check saved about 12% of calls. Pruning helps most when most branches are invalid; when most branches lead to real answers, the output size itself is the cost.',
    },
    {
      thought: 'Sorting the candidates costs O(n log n) extra, so it is only worth it for large inputs.',
      reality: 'The sort runs once, while the break saves calls at every node of an exponentially large tree. On the smallest example, four candidates and target 7, the sort-and-break version already made 10 calls instead of 28.',
    },
  ];
}
