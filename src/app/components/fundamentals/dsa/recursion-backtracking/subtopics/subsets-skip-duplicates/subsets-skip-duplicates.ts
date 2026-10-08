import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-subsets-skip-duplicates',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './subsets-skip-duplicates.html',
  styleUrl: './subsets-skip-duplicates.scss'
})
export class SubsetsSkipDuplicatesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'One Condition Separates Correct Output From Missing Subsets',
      points: [
        'The main page\'s QnA gives the rule for subsets of an input with duplicates — sort, then skip <code>nums[i]</code> when <code>i &gt; start &amp;&amp; nums[i] === nums[i-1]</code> — and says the <code>i &gt; start</code> part limits the skip to the same tree level. No codeTab ever builds it, so it was run with both versions of the condition.',
        'With <code>i &gt; start</code>, <code>[1,2,2]</code> gives the 6 distinct subsets: [], [1], [1,2], [1,2,2], [2], [2,2]. With <code>i &gt; 0</code> it gives only 4 and silently loses [1,2,2] and [2,2].',
        'Why: inside one call, the loop chooses which value goes in the next position. Picking the second 2 there would repeat the branch the first 2 already explored, so it is skipped. But when the recursive call for the first 2 starts at the second 2, <code>i</code> equals <code>start</code>: taking it adds a second 2 to the same subset, which is a new answer. <code>i &gt; 0</code> cannot tell these cases apart and skips both.',
        'The saving is large. Without any skip, <code>[1,2,2]</code> produces 8 subsets with only 6 distinct. For ten 1s and ten 2s, plain generation produces 1,048,576 subsets; the skip rule produces exactly the 121 distinct ones (11 choices of how many 1s times 11 choices of how many 2s), without building and discarding the rest.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Subsets with duplicates: i > start vs i > 0',
      language: 'typescript',
      code: `function subsetsWithDup(nums: number[], skipAtSameLevelOnly = true): number[][] {
  const sorted = [...nums].sort((a, b) => a - b);  // duplicates must be adjacent
  const result: number[][] = [];
  function backtrack(start: number, current: number[]): void {
    result.push([...current]);
    for (let i = start; i < sorted.length; i++) {
      const sameLevel = skipAtSameLevelOnly ? i > start : i > 0;
      if (sameLevel && sorted[i] === sorted[i - 1]) continue;
      current.push(sorted[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

subsetsWithDup([1, 2, 2]);
// [[], [1], [1,2], [1,2,2], [2], [2,2]]       6 distinct, correct

subsetsWithDup([1, 2, 2], false);  // uses i > 0
// [[], [1], [1,2], [2]]                       [1,2,2] and [2,2] are lost

// Ten 1s and ten 2s:
//   no skip at all       -> 1,048,576 subsets generated
//   skip with i > start  ->       121 subsets (11 x 11, all distinct)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Instead of the skip rule, a teammate generates every subset and removes duplicates afterwards by putting <code>subset.join(\',\')</code> into a Set. It gives the right answer. What does it cost compared with the skip rule for ten 1s and ten 2s?',
    hint: 'How many subsets does the plain version build before the Set removes anything?',
    solution: 'It builds all 1,048,576 subsets, copies each one, and joins each into a string, only to keep 121 of them. The skip rule never creates the duplicates in the first place, so it does work proportional to the 121 answers rather than to 2^20. The Set approach is correct but exponentially wasteful on inputs with many repeated values.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sorting the input is optional; the skip check alone removes duplicates.',
      reality: 'The check compares <code>nums[i]</code> with <code>nums[i-1]</code>, which only catches repeats that sit next to each other. For <code>[2,1,2]</code> unsorted, the two 2s are not adjacent and the same subsets are produced twice. Sorting is what groups equal values together so the neighbour check can see them.',
    },
    {
      thought: 'Using <code>i &gt; 0</code> is just a stricter version of the same skip and at worst removes a little too much.',
      reality: 'It removes valid answers, not just extra work: every subset containing a repeated value more than once disappears. For <code>[1,2,2]</code> that is a third of the correct output, with no error to signal it.',
    },
  ];
}
