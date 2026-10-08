import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-memo-vs-table-measured',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './memo-vs-table-measured.html',
  styleUrl: './memo-vs-table-measured.scss'
})
export class MemoVsTableMeasuredSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'When Each Approach Wins, With Numbers',
      points: [
        'The main page\'s quiz asked which approach is "generally" faster and marked "top-down is faster for sparse subproblems" as correct, while its own theory says bottom-up is "usually faster in practice". The quiz answer is now bottom-up, with sparse problems as the stated exception. Both halves were measured on coin change.',
        'Sparse case: coins [3000, 7000] and amount 10000. A memoized top-down solution only ever reaches amounts that are 10000 minus some mix of 3000s and 7000s; it computed 5 distinct states. The page\'s bottom-up table fills all 10,000 entries regardless, most of which can never be part of the answer.',
        'Dense case: coins [1, 2, 5]. Here top-down reaches every amount anyway — 1,000 states for amount 1,000, the same as the table — so it saves nothing and pays for a function call and a Map lookup per state.',
        'Depth: the memoized recursion goes one level deeper per coin of 1, so its stack depth equals the amount. At amount 20,000 it threw <code>RangeError: Maximum call stack size exceeded</code> in Node; the bottom-up table returned 4,000 coins without issue. Memoization removes repeated work, not recursion depth.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Counting states visited, and where recursion stops',
      language: 'typescript',
      code: `function minCoinsMemo(coins: number[], amount: number) {
  const memo = new Map<number, number>();
  let states = 0;
  function f(x: number): number {
    if (x === 0) return 0;
    if (x < 0) return Infinity;
    if (memo.has(x)) return memo.get(x)!;
    states++;
    let best = Infinity;
    for (const c of coins) best = Math.min(best, f(x - c) + 1);
    memo.set(x, best);
    return best;
  }
  return { coins: f(amount), states };
}

function minCoinsTable(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
  return dp[amount];
}

// Sparse: only a handful of amounts are reachable from the target
minCoinsMemo([3000, 7000], 10000);  // { coins: 2, states: 5 }
                                    // table: fills 10,000 entries

// Dense: every amount is reachable, so memo visits all of them
minCoinsMemo([1, 2, 5], 1000);      // { coins: 200, states: 1000 }

// Deep: recursion depth grows with the amount
minCoinsMemo([1, 2, 5], 20000);     // Node: RangeError: Maximum call stack size exceeded
minCoinsTable([1, 2, 5], 20000);    // 4000`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You must solve coin change for amounts up to 10 million with coins that include 1, and the code runs in Node. Which approach do you pick, and why?',
    hint: 'With a coin of 1, how deep can the recursion get, and how many amounts are reachable?',
    solution: 'Bottom-up. With a coin of 1, every amount is reachable, so top-down gains nothing from sparsity, and its recursion depth would reach about 10 million, far past the depth that already overflowed at amount 20,000 in Node. The table does the same number of states with a plain loop and no depth limit.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Memoization fixes the stack-depth problem of plain recursion because it stops repeated calls.',
      reality: 'It stops repeated work, but the first time each state is computed the call chain is as deep as the longest dependency path. For coin change with a coin of 1, that is the full amount, which overflowed the stack at 20,000.',
    },
    {
      thought: 'Top-down and bottom-up always compute the same set of subproblems, just in a different order.',
      reality: 'Bottom-up computes every state in its table. Top-down computes only the states reachable from the target. For coins [3000, 7000] and amount 10000 that is 5 states against 10,000.',
    },
  ];
}
