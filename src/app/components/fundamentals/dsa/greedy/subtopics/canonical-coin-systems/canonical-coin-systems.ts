import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-canonical-coin-systems',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './canonical-coin-systems.html',
  styleUrl: './canonical-coin-systems.scss'
})
export class CanonicalCoinSystemsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Divisibility Is Sufficient, Not Necessary',
      points: [
        'The main page\'s coin-change mistake said greedy works "only when each larger coin divides evenly into the next". Its own "right" example contradicts that: US coins 1, 5, 10, 25 are called greedy-safe, yet 25 is not a multiple of 10.',
        'The actual definition of a canonical coin system is behavioural: greedy gives the minimum number of coins for every amount. Comparing greedy with the DP minimum for every amount from 1 to 500: US coins and the euro coins 1, 2, 5, 10, 20, 50, 100, 200 never disagreed, and neither has the divisibility property. [1, 2, 4, 8] does have it, and is also canonical.',
        'Small changes break it. [1, 3, 4] first fails at 6 (greedy 4+1+1, optimal 3+3), and [1, 10, 25] — US coins without the nickel — first fails at 30: greedy takes 25 and five 1s (six coins) where three 10s would do.',
        'A divisibility chain does guarantee canonicity, so it is a quick sufficient check. When it does not hold, the reliable test is to compare greedy with DP. A known result (Kozen and Zaks, 1994) says a counterexample, if one exists, appears below the sum of the two largest coins, so the check only needs a bounded range.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Find the first amount where greedy loses',
      language: 'typescript',
      code: `function greedyCoins(coins: number[], amount: number): number {
  let count = 0;
  for (const c of [...coins].sort((a, b) => b - a)) {
    count += Math.floor(amount / c);
    amount %= c;
  }
  return amount === 0 ? count : Infinity;
}

function dpCoins(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
  return dp[amount];
}

function firstGreedyFailure(coins: number[], limit: number): number | null {
  for (let a = 1; a <= limit; a++)
    if (greedyCoins(coins, a) !== dpCoins(coins, a)) return a;
  return null;
}

//                                       divisibility chain   first failure (1..500)
firstGreedyFailure([1, 5, 10, 25], 500);          // no              null  (canonical)
firstGreedyFailure([1, 2, 5, 10, 20, 50, 100, 200], 500); // no      null  (canonical)
firstGreedyFailure([1, 2, 4, 8], 500);            // yes             null  (canonical)
firstGreedyFailure([1, 3, 4], 500);               // no              6
firstGreedyFailure([1, 10, 25], 500);             // no              30`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A game currency has coins 1, 7 and 10. Without running code, find an amount where greedy uses more coins than necessary.',
    hint: 'Look for an amount that two 7s make exactly but that starts with a 10 under greedy.',
    solution: '14. Greedy takes 10 and then four 1s, five coins in total, while 7 + 7 uses two. The system is not canonical, so this game needs DP for minimum coins. The Kozen and Zaks bound says checking amounts below 7 + 10 = 17 is enough to find such a failure.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A coin system works with greedy if every coin divides the next larger one.',
      reality: 'That is a sufficient condition, not the definition. US and euro coins fail it and are still canonical. The only complete test is whether greedy matches the optimum for every amount.',
    },
    {
      thought: 'If greedy is optimal for the coins you use, it stays optimal when you remove one denomination.',
      reality: 'Removing the 5 from US coins gives [1, 10, 25], which greedy gets wrong at 30. Canonicity is a property of the whole set, not of each coin.',
    },
  ];
}
