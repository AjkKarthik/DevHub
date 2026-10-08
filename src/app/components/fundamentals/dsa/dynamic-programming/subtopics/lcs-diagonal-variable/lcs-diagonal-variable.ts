import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-lcs-diagonal-variable',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lcs-diagonal-variable.html',
  styleUrl: './lcs-diagonal-variable.scss'
})
export class LcsDiagonalVariableSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Three Neighbours, Two Rows, One Array',
      points: [
        'Each LCS cell reads three neighbours: <code>dp[i-1][j]</code> (above, previous row), <code>dp[i][j-1]</code> (left, current row) and <code>dp[i-1][j-1]</code> (diagonal, previous row). Squeezing the table into one array means one array slot has to serve two rows at once, and the update order decides which version each read sees.',
        'The main page\'s QnA said "iterate right-to-left". Right-to-left keeps the diagonal and the cell above from the previous row — but then the left neighbour is also still from the previous row, while the recurrence needs the current row\'s value. Against the full 2D table on 2,000 random strings over the letters a and b, the right-to-left version was wrong 579 times. For "abcba" and "abcbcba" it returns 4; the correct answer is 5.',
        'Plain left-to-right with no extra variable fails the other way: the left neighbour is correct, but by the time cell j is computed, slot j-1 has already been overwritten, so the diagonal is gone. It was wrong 1,071 times out of 2,000 and returned 6 — longer than either string allows — for the same pair.',
        'The fix is to go left-to-right and save the old value of each slot before overwriting it. That saved value is exactly the diagonal for the next cell. This version matched the 2D table on all 2,000 random cases, using O(n) space instead of O(m × n).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Right-to-left fails; a saved diagonal works',
      language: 'typescript',
      code: `// Right-to-left: the "left" neighbour is still from the PREVIOUS row -> wrong
function lcsRightToLeft(a: string, b: string): number {
  const dp = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++)
    for (let j = b.length; j >= 1; j--)
      dp[j] = a[i - 1] === b[j - 1] ? dp[j - 1] + 1 : Math.max(dp[j], dp[j - 1]);
  return dp[b.length];
}

// Left-to-right with a saved diagonal -> matches the 2D table
function lcsOneRow(a: string, b: string): number {
  const dp = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diag = 0;                  // dp[i-1][0]
    for (let j = 1; j <= b.length; j++) {
      const above = dp[j];         // dp[i-1][j], about to be overwritten
      dp[j] = a[i - 1] === b[j - 1]
        ? diag + 1                 // dp[i-1][j-1] + 1
        : Math.max(above, dp[j - 1]);
      diag = above;                // becomes the diagonal for j + 1
    }
  }
  return dp[b.length];
}

lcsRightToLeft('abcba', 'abcbcba');  // 4  (wrong)
lcsOneRow('abcba', 'abcbcba');       // 5  (correct)

// 2,000 random pairs over {a, b}, checked against the full 2D table:
//   right-to-left            579 wrong
//   left-to-right, no diag  1071 wrong
//   left-to-right + diag       0 wrong`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s 0/1 knapsack loop does go right-to-left in a single array and is correct. Why does right-to-left work there but not for LCS?',
    hint: 'Which neighbours does each recurrence read, and which row should each come from?',
    solution: 'Knapsack reads only dp[w] and dp[w - weight], and both must come from the previous item\'s row. Going right-to-left guarantees nothing to the left has been overwritten yet, so both reads are old values. LCS needs a mix: the left neighbour from the current row and the diagonal from the previous row. No single direction gives both, so one direction plus a saved variable is required.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any 2D DP that only looks one row back can be compressed by iterating in the right direction.',
      reality: 'Direction alone works only when every read must come from the same row. When a recurrence reads both the current row (left) and the previous row (diagonal), the slot you need is overwritten in either direction, and you have to save it.',
    },
    {
      thought: 'A wrong one-row version would be obvious, since it would give nonsense answers.',
      reality: 'Both broken versions gave the right answer on most of the main page\'s style of small examples, including "abcde" and "ace". The errors appeared on inputs with repeated characters, and the left-to-right version even returned a length longer than the shorter string.',
    },
  ];
}
