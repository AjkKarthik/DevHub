import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-coin-ways-loop-order',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './coin-ways-loop-order.html',
  styleUrl: './coin-ways-loop-order.scss'
})
export class CoinWaysLoopOrderSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Same Transition, Different Question',
      points: [
        'The main page\'s QnA said counting the ways to make an amount has the "same structure" as minimum coins, just with a sum instead of a min and dp[0] = 1. Reusing the page\'s own coinChange loops — amount in the outer loop, coins in the inner loop — with <code>dp[i] += dp[i - c]</code> gives 9 for coins [1,2,5] and amount 5. There are only 4 combinations.',
        'The 9 is the number of ordered sequences: 1+2+2, 2+1+2 and 2+2+1 are counted as three ways. With amount outside, every amount i considers every coin as the last one added, so each ordering is a separate path.',
        'Swapping the loops fixes it: put coins outside and amount inside. Each coin is fully processed before the next one is allowed, so a combination can only be built in one order (all 1s, then all 2s, then all 5s), and each is counted once — 4 for [1,2,5] and 5, and 3 for [1,2] and 4 (against 5 ordered sequences).',
        'For the minimum-coins version the order does not matter: both loop orders returned 3 for [1,2,5] and 11, and 4 for [2,5,10,1] and 27. Taking a minimum over paths gives the same answer however many times a path is reached; summing paths does not.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two loop orders, two different counts',
      language: 'typescript',
      code: `// Amount outer, coins inner: counts ORDERED sequences (permutations)
function countSequences(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (c <= i) dp[i] += dp[i - c];
  return dp[amount];
}

// Coins outer, amount inner: counts COMBINATIONS
function countCombinations(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;
  for (const c of coins)
    for (let i = c; i <= amount; i++)
      dp[i] += dp[i - c];
  return dp[amount];
}

countSequences([1, 2, 5], 5);     // 9
countCombinations([1, 2, 5], 5);  // 4  -> 5, 2+2+1, 2+1+1+1, 1+1+1+1+1
countSequences([1, 2], 4);        // 5
countCombinations([1, 2], 4);     // 3

// Minimum coins: either loop order gives the same answer
//   [1,2,5], 11      -> 3 both ways
//   [2,5,10,1], 27   -> 4 both ways`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'LeetCode 377 "Combination Sum IV" asks for the number of ordered ways to reach a target, so (1,2) and (2,1) count separately. Which of the two functions above solves it as written?',
    hint: 'Which version counts 1+2 and 2+1 as different paths?',
    solution: 'countSequences, the amount-outer version. Despite the problem name, it counts ordered sequences, which is exactly what amount-outer computes. countCombinations would undercount it, because it only ever builds each multiset of coins in one order.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Swapping the two loops in a DP is a style choice as long as every dp[i - c] is computed before dp[i].',
      reality: 'Both orders compute dependencies first, and both are valid DP. They answer different questions. For a sum over paths, the loop order decides which paths exist, so it decides whether orderings are merged or counted separately.',
    },
    {
      thought: 'If the minimum-coins code works, changing min to + and setting dp[0] = 1 is enough to count combinations.',
      reality: 'That is exactly what returns 9 instead of 4 for coins [1,2,5] and amount 5. The min version only works in either order because a minimum ignores how many paths lead to the same value.',
    },
  ];
}
