import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-dsa-dynamic-programming',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dynamic-programming.html',
  styleUrl: './dynamic-programming.scss',
})
export class DsaDynamicProgramming {
  quickRef: QuickRefItem[] = [
    { name: 'Memoization',     type: 'keyword', desc: 'Top-down: cache recursive results in a map/array' },
    { name: 'Tabulation',      type: 'keyword', desc: 'Bottom-up: fill dp table iteratively from base cases' },
    { name: 'Overlapping subproblems', type: 'keyword', desc: 'Same subproblem computed multiple times — DP caches it' },
    { name: 'Optimal substructure',    type: 'keyword', desc: 'Optimal solution contains optimal solutions to subproblems' },
    { name: 'State definition', type: 'keyword', desc: 'Define what dp[i] or dp[i][j] represents — the hardest step' },
    { name: 'Transition',      type: 'keyword', desc: 'Recurrence relation — how dp[i] is computed from previous states' },
    { name: 'Space opt.',      type: 'keyword', desc: 'Often reduce O(n²) to O(n) by keeping only previous row/value' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'When to Use DP',
      points: [
        'Two necessary conditions: overlapping subproblems (same work repeated) and optimal substructure (optimal answer built from optimal sub-answers).',
        'DP trades space for time — cache subproblem results so each is solved only once.',
        'Recognize DP problems: "how many ways", "minimum/maximum", "is it possible", with overlapping choices.',
        'If backtracking finds all solutions but is too slow, DP counts or optimizes without enumerating all paths.',
      ],
    },
    {
      heading: 'Top-Down (Memoization)',
      points: [
        'Write the recursive solution first. Add a cache (Map or array) to store results by state.',
        'Before computing, check if the result is already cached — return it if so.',
        'Natural to write; call graph mirrors the problem\'s structure.',
        'O(states × work per state) time; O(states) space for the cache.',
      ],
    },
    {
      heading: 'Bottom-Up (Tabulation)',
      points: [
        'Fill a dp array/table iteratively from base cases up to the target state.',
        'No recursion overhead or stack depth limit. Usually faster in practice.',
        'Requires figuring out the iteration order so dependencies are computed before they\'re needed.',
        'Often allows space optimization: if dp[i] only depends on dp[i-1], use two variables instead of an array.',
      ],
    },
    {
      heading: 'State Design',
      points: [
        'The state is what uniquely identifies a subproblem. Get this right and the recurrence follows naturally.',
        '1D state: dp[i] = answer for first i elements (climbing stairs, house robber, coin change).',
        '2D state: dp[i][j] = answer considering first i items with capacity j (knapsack, LCS, edit distance).',
        'Space optimization: if dp[i] only depends on dp[i-1] and dp[i-2], you only need 2 variables.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '1D DP Classics',
      language: 'typescript',
      code: `// Climbing Stairs — O(n) O(1)
// dp[i] = ways to reach step i = dp[i-1] + dp[i-2]
function climbStairs(n: number): number {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) [prev2, prev1] = [prev1, prev1 + prev2];
  return prev1;
}

// House Robber — O(n) O(1)
// dp[i] = max money from first i houses
// dp[i] = max(dp[i-1], dp[i-2] + nums[i])
function rob(nums: number[]): number {
  let prev2 = 0, prev1 = 0;
  for (const n of nums) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + n)];
  return prev1;
}

// Coin Change — O(n*amount) O(amount)
// dp[i] = min coins to make amount i
function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}

// Longest Increasing Subsequence — O(n²)
// dp[i] = length of LIS ending at index i
function lengthOfLIS(nums: number[]): number {
  const dp = new Array(nums.length).fill(1);
  let max = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++)
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    max = Math.max(max, dp[i]);
  }
  return max;
}`,
    },
    {
      label: '2D DP Classics',
      language: 'typescript',
      code: `// Unique Paths — O(m*n) or O(n) with space opt
// dp[i][j] = paths to reach (i,j) = dp[i-1][j] + dp[i][j-1]
function uniquePaths(m: number, n: number): number {
  const dp = new Array(n).fill(1); // first row all 1s
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      dp[j] += dp[j - 1]; // dp[j] = from above, dp[j-1] = from left
  return dp[n - 1];
}

// Longest Common Subsequence — O(m*n)
// dp[i][j] = LCS of s1[0..i-1] and s2[0..j-1]
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length, n = text2.length;
  const dp: number[][] = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = text1[i-1] === text2[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

// 0/1 Knapsack — O(n*W)
// dp[i][w] = max value using first i items with capacity w
function knapsack(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < n; i++)
    for (let w = W; w >= weights[i]; w--) // traverse right-to-left for 0/1
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
  return dp[W];
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Wrong state definition — dp[i] is ambiguous',
      wrong: `const dp = new Array(n).fill(0);
// What does dp[i] mean? "something about index i" is not specific enough`,
      right: `// dp[i] = minimum cost to reach step i
// dp[i] = max money robbed from first i houses
// State must have a precise, verifiable meaning`,
      explanation: 'The state definition is the hardest part of DP. Write it in a sentence before writing the recurrence — if you can\'t say it clearly, the code will be wrong.',
    },
    {
      title: 'Wrong base case initialization',
      wrong: `const dp = new Array(amount + 1).fill(0); // 0 means "0 coins" — wrong for min`,
      right: `const dp = new Array(amount + 1).fill(Infinity); // can't make amount yet
dp[0] = 0; // 0 coins needed for amount 0`,
      explanation: 'For minimization, initialize with Infinity so valid paths always improve the value. Wrong base case propagates incorrectly through all transitions.',
    },
    {
      title: 'Knapsack 0/1: traversing left-to-right allows using item twice',
      wrong: `for (let w = weights[i]; w <= W; w++) // left-to-right — uses dp[w-weight] already updated this row`,
      right: `for (let w = W; w >= weights[i]; w--) // right-to-left — reads old row values`,
      explanation: 'In 0/1 knapsack, each item can only be used once. Right-to-left traversal ensures dp[w-weight] is still from the previous item\'s row.',
    },
    {
      title: 'LCS: off-by-one in the index mapping',
      wrong: `if (text1[i] === text2[j]) dp[i][j] = dp[i-1][j-1] + 1; // i is 1-indexed but text1[i] is 0-indexed string access`,
      right: `if (text1[i-1] === text2[j-1]) dp[i][j] = dp[i-1][j-1] + 1; // dp is (m+1)×(n+1), characters are i-1/j-1`,
      explanation: 'With (m+1)×(n+1) dp table, dp[i][j] represents first i chars of text1. The character at position i is text1[i-1].',
    },
    {
      title: 'Coin change: trying to use a coin larger than remaining amount',
      wrong: `for (const c of coins) dp[i] = Math.min(dp[i], dp[i - c] + 1); // dp[i-c] may be negative index`,
      right: `for (const c of coins)
  if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1); // guard i >= c`,
      explanation: 'Only use a coin if it doesn\'t exceed the current amount. Accessing dp[i-c] with c > i gives dp[negative] — undefined behavior.',
    },
  ];

  challenge: Challenge = {
    title: '0/1 Knapsack — Maximum Value',
    language: 'typescript',
    description: 'Given items with weights and values, and a knapsack with capacity W, find the maximum value you can carry. Each item can be used at most once.',
    hints: ['dp[w] = max value achievable with capacity w', 'Traverse weights right-to-left to prevent reusing items', 'For each item, update dp[W] down to dp[weights[i]]'],
    starterCode: `function maxKnapsack(weights: number[], values: number[], W: number): number {
  // 0/1 knapsack — each item used at most once
}`,
    solution: `function maxKnapsack(weights: number[], values: number[], W: number): number {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++)
    for (let w = W; w >= weights[i]; w--)
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
  return dp[W];
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What two properties must a problem have for DP to apply?',
      options: ['Sorted input and distinct elements', 'Overlapping subproblems and optimal substructure', 'Graph structure and non-negative weights', 'Linear time and constant space'],
      answer: 1,
      explanation: 'DP requires overlapping subproblems (same work repeated — worth caching) and optimal substructure (optimal answer built from optimal sub-answers).',
    },
    {
      q: 'In 0/1 knapsack, why traverse the capacity array right-to-left?',
      options: ['To avoid negative indices', 'To ensure each item is used at most once', 'To improve cache performance', 'Right-to-left is always required in DP'],
      answer: 1,
      explanation: 'Right-to-left ensures dp[w - weight] is from the previous item\'s state, not the current one. Left-to-right would allow using the same item multiple times.',
    },
    {
      q: 'What is the time complexity of the LCS (Longest Common Subsequence) DP?',
      options: ['O(n)', 'O(n log n)', 'O(m × n)', 'O(2^n)'],
      answer: 2,
      explanation: 'Two nested loops over strings of lengths m and n, each computing dp[i][j] in O(1) → O(m × n) total.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I decide between top-down memoization and bottom-up tabulation?',
      a: 'Use top-down when: the problem structure is naturally recursive, not all subproblems need to be solved, or you want to write less code. Use bottom-up when: you need the most speed (no recursion overhead), you need space optimization (keep only 1-2 rows), or the call stack depth is a concern.',
    },
    {
      q: 'How do you optimize DP space from O(n²) to O(n)?',
      a: 'Analyze which previous states dp[i][j] depends on. If it only depends on dp[i-1][j] (previous row) and dp[i][j-1] (same row, previous column), you can use a single 1D array, updating it in the right order. For LCS, iterate right-to-left or save one extra variable.',
    },
    {
      q: 'What\'s the difference between the coin change problem (count of ways) and (minimum coins)?',
      a: 'Minimum coins: dp[i] = min coins, initialize to Infinity, transition dp[i] = min(dp[i], dp[i-c]+1). Count of ways: dp[i] = number of combinations, initialize dp[0]=1, transition dp[i] += dp[i-c]. Same structure, different operation (min vs sum) and initialization.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'DP = define state precisely, write recurrence, identify base cases. Cache subproblem results to avoid recomputation. Space-optimize by keeping only needed rows.',
    mustKnow: [
      'State definition must be unambiguous — write it as a sentence first',
      'Base case initialization: Infinity for min, 0 for count/max from nothing',
      '0/1 knapsack: right-to-left traversal prevents item reuse',
      'LCS: dp[i][j] uses dp[i-1][j-1] (diagonal), dp[i-1][j], dp[i][j-1]',
      'Space opt: if dp[i] depends only on dp[i-1], use two variables',
    ],
    interviewFocus: [
      'Coin change (minimum coins — classic 1D DP)',
      'LCS / edit distance (2D DP)',
      '0/1 Knapsack (capacity DP with right-to-left)',
    ],
  };
}
