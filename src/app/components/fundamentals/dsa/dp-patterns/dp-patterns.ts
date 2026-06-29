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
  selector: 'app-dsa-dp-patterns',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dp-patterns.html',
  styleUrl: './dp-patterns.scss',
})
export class DsaDpPatterns {
  quickRef: QuickRefItem[] = [
    { name: 'Kadane\'s algo',   type: 'syntax',  desc: 'Max subarray sum — O(n): extend or restart at each element' },
    { name: 'Partition DP',    type: 'syntax',  desc: 'Palindrome partition, matrix chain — dp[i][j] over intervals' },
    { name: 'Interval DP',     type: 'syntax',  desc: 'Fill dp by increasing interval length — bottom-up order' },
    { name: 'State machine DP',type: 'syntax',  desc: 'Track states (hold/sold/cooldown) — best stock problems' },
    { name: 'Edit distance',   type: 'syntax',  desc: '2D DP: insert/delete/replace transitions' },
    { name: 'Palindrome DP',   type: 'syntax',  desc: 'dp[i][j]=true if s[i..j] is palindrome; expand from center' },
    { name: 'Unbounded KS',    type: 'syntax',  desc: 'Like 0/1 but traverse left-to-right to allow reuse' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Kadane\'s Algorithm (Max Subarray)',
      points: [
        'dp[i] = max subarray sum ending at index i. Transition: dp[i] = max(nums[i], dp[i-1] + nums[i]).',
        'Restart if dp[i-1] is negative — a negative prefix only hurts. Otherwise extend.',
        'Space-optimized: just track currentMax and globalMax without an array.',
        'Variant: max circular subarray = max(Kadane, total_sum - min_subarray_sum).',
      ],
    },
    {
      heading: 'State Machine DP (Best Time to Buy Stocks)',
      points: [
        'Model the problem as states with transitions: hold → sold, sold → cooldown, cooldown → hold.',
        'At each day, define the max profit in each state, transition based on buy/sell/wait.',
        'Buy once: dp[i][0] (not holding), dp[i][1] (holding). Transition: not-hold = max(prev-not-hold, prev-hold+price); hold = max(prev-hold, -price).',
        'Extend for cooldown: add a cooldown state; hold transitions from cooldown only.',
      ],
    },
    {
      heading: 'Interval DP',
      points: [
        'Problems where the answer for [i,j] depends on answers for sub-intervals.',
        'Fill by increasing interval length: start with length 1, then 2, ..., up to n.',
        'Example: Burst Balloons, Palindrome Partitioning II, Matrix Chain Multiplication.',
        'Template: for len in 2..n; for i in 0..n-len; j=i+len-1; for k in i..j-1: update dp[i][j].',
      ],
    },
    {
      heading: 'Edit Distance & String DP',
      points: [
        'Edit distance: dp[i][j] = min ops to convert s1[0..i-1] to s2[0..j-1].',
        'If s1[i-1] === s2[j-1]: dp[i][j] = dp[i-1][j-1]. Else: 1 + min(replace, delete, insert).',
        'Palindrome check: dp[i][j] = true if s[i] === s[j] and (j-i<=2 or dp[i+1][j-1]).',
        'Longest palindromic substring: expand around each center, or dp[i][j] boolean table.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Kadane & State Machine',
      language: 'typescript',
      code: `// Kadane's Algorithm — max subarray sum O(n) O(1)
function maxSubArray(nums: number[]): number {
  let current = nums[0], global = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]); // extend or restart
    global = Math.max(global, current);
  }
  return global;
}

// Stock buy/sell — at most one transaction O(n) O(1)
function maxProfit(prices: number[]): number {
  let minPrice = Infinity, maxP = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    maxP = Math.max(maxP, p - minPrice);
  }
  return maxP;
}

// Stock — unlimited transactions with cooldown O(n) O(1)
function maxProfitCooldown(prices: number[]): number {
  let hold = -Infinity, sold = 0, cool = 0;
  for (const p of prices) {
    const prevHold = hold, prevSold = sold, prevCool = cool;
    hold = Math.max(prevHold, prevCool - p); // buy from cooldown
    sold = prevHold + p;                     // sell from holding
    cool = Math.max(prevCool, prevSold);     // rest or continue cooldown
  }
  return Math.max(sold, cool);
}`,
    },
    {
      label: 'Edit Distance & Palindrome',
      language: 'typescript',
      code: `// Edit Distance — O(m*n)
function minDistance(word1: string, word2: string): number {
  const m = word1.length, n = word2.length;
  const dp: number[][] = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = word1[i-1] === word2[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]); // replace, delete, insert
  return dp[m][n];
}

// Longest Palindromic Substring — expand around center O(n²) O(1)
function longestPalindrome(s: string): string {
  let start = 0, maxLen = 1;
  function expand(l: number, r: number): void {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    if (r - l - 1 > maxLen) { maxLen = r - l - 1; start = l + 1; }
  }
  for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i+1); } // odd and even
  return s.slice(start, start + maxLen);
}

// Word Break — can string be segmented into dict words? O(n²)
function wordBreak(s: string, wordDict: string[]): boolean {
  const dict = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Kadane: initializing current/global to 0 instead of nums[0]',
      wrong: `let current = 0, global = 0; // misses case where all nums are negative`,
      right: `let current = nums[0], global = nums[0]; // handles all-negative arrays`,
      explanation: 'If all numbers are negative, max subarray is the least-negative element. Initializing to 0 incorrectly returns 0 instead.',
    },
    {
      title: 'Edit distance: wrong base case for empty string comparison',
      wrong: `const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));`,
      right: `// dp[i][0] = i (delete all i chars); dp[0][j] = j (insert all j chars)
dp[i][0] = i; dp[0][j] = j; // first row and column are 0,1,2,...,n/m`,
      explanation: 'Converting s1 of length i to empty string requires i deletions. dp[i][0] = i and dp[0][j] = j are the base cases.',
    },
    {
      title: 'Expand-around-center: forgetting to check even-length palindromes',
      wrong: `for (let i = 0; i < s.length; i++) expand(i, i); // only odd-length`,
      right: `for (let i = 0; i < s.length; i++) {
  expand(i, i);   // odd-length: center at i
  expand(i, i+1); // even-length: center between i and i+1
}`,
      explanation: 'Odd palindromes have a single center character; even palindromes have a gap between two middle characters. Both cases must be checked.',
    },
    {
      title: 'Stock cooldown: not separating hold/sold/cool states',
      wrong: `// Using a single profit variable — can't track state transitions correctly`,
      right: `let hold = -Infinity, sold = 0, cool = 0;
// Three states transition simultaneously each day`,
      explanation: 'State machine DP requires tracking all states simultaneously. Updating one state before reading old values corrupts the transitions.',
    },
    {
      title: 'Word break: not breaking after finding a valid split',
      wrong: `if (dp[j] && dict.has(s.slice(j, i))) dp[i] = true; // continues inner loop`,
      right: `if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }`,
      explanation: 'Once dp[i] is set to true, continuing the inner loop wastes time. break exits early since we only need one valid split.',
    },
  ];

  challenge: Challenge = {
    title: 'Longest Palindromic Subsequence',
    language: 'typescript',
    description: 'Given a string s, return the length of the longest palindromic subsequence (characters need not be contiguous).',
    hints: ['dp[i][j] = length of LPS in s[i..j]', 'If s[i] === s[j]: dp[i][j] = dp[i+1][j-1] + 2', 'Else: dp[i][j] = max(dp[i+1][j], dp[i][j-1])'],
    starterCode: `function longestPalindromeSubseq(s: string): number {
  // 2D DP — dp[i][j] = LPS length of s[i..j]
}`,
    solution: `function longestPalindromeSubseq(s: string): number {
  const n = s.length;
  const dp: number[][] = Array.from({length: n}, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = 1; // base: single char
  for (let len = 2; len <= n; len++) // fill by increasing length
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      dp[i][j] = s[i] === s[j]
        ? (len === 2 ? 2 : dp[i+1][j-1] + 2)
        : Math.max(dp[i+1][j], dp[i][j-1]);
    }
  return dp[0][n-1];
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In Kadane\'s algorithm, when do you restart the current subarray?',
      options: ['When current sum equals 0', 'When adding the current element gives a smaller sum than the element alone', 'After every n/2 elements', 'When the element is negative'],
      answer: 1,
      explanation: 'current = max(nums[i], current + nums[i]). If current+nums[i] < nums[i], then current was negative — restart at nums[i].',
    },
    {
      q: 'In edit distance, what does dp[i][j] represent when s1[i-1] !== s2[j-1]?',
      options: ['dp[i-1][j-1]', '1 + min(replace, delete, insert)', '0', 'max(dp[i-1][j], dp[i][j-1])'],
      answer: 1,
      explanation: '1 + min(dp[i-1][j-1]=replace, dp[i-1][j]=delete from s1, dp[i][j-1]=insert into s1). All three operations cost 1.',
    },
    {
      q: 'What is the time complexity of the expand-around-center approach for longest palindromic substring?',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
      answer: 2,
      explanation: 'n centers × O(n) expansion each = O(n²). The DP table approach is also O(n²). Both are better than brute force O(n³).',
    },
  { q: 'Which DP pattern is used to solve the 0/1 Knapsack problem?', options: ['Kadane (max subarray)', 'Inclusion-exclusion on items with weight constraint', 'Interval DP', 'Digit DP'], answer: 1, explanation: '0/1 Knapsack: dp[i][w] = max value using first i items with capacity w. Either include item i (dp[i-1][w-weight_i] + value_i) or exclude (dp[i-1][w]). Can be space-optimized to 1D O(W) array by iterating w in reverse.' },
  { q: 'What defines a problem that can be solved with interval DP?', options: ['The problem has overlapping subproblems on prefixes', 'The optimal solution for a range [i, j] depends on subranges of [i, j]', 'The problem involves choosing items from a list', 'The state depends only on the previous row'], answer: 1, explanation: 'Interval DP: dp[i][j] = answer for range [i, j]. Base: length-1 intervals. Transition: try all split points k: dp[i][j] = best over k of merge(dp[i][k], dp[k+1][j]). Examples: Matrix Chain Multiplication, Burst Balloons, Optimal BST.' },
  { q: 'What is the key insight of the unbounded knapsack pattern?', options: ['Each item can be used at most once', 'Each item can be reused unlimited times — iterate capacity forward (not reverse)', 'The problem requires sorting items first', 'Only the last item matters'], answer: 1, explanation: 'Unbounded knapsack: iterate capacity w from 0 to W (forward), allowing an item to be used multiple times. Coin Change and Rod Cutting use this. 0/1 Knapsack iterates w reverse to prevent reuse.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does LPS (Longest Palindromic Subsequence) relate to LCS?',
      a: 'LPS of string s = LCS(s, reverse(s)). Because a palindromic subsequence reads the same forwards and backwards — it\'s a common subsequence of s and its reverse. This is a useful insight: if you know LCS, you can solve LPS without a separate derivation.',
    },
    {
      q: 'What is the difference between palindromic substring and palindromic subsequence?',
      a: 'Substring: characters must be contiguous. Subsequence: characters can be non-contiguous (just must maintain order). "abcba" has longest palindromic substring "abcba" (the whole string) and longest palindromic subsequence also "abcba". For "cbbd": longest substring is "bb", longest subsequence is "bbb" (wrong) actually "bb" — they can differ when the string is more complex.',
    },
    {
      q: 'When is interval DP the right approach?',
      a: 'When the answer for a range [i,j] depends on answers for sub-ranges — and you need to try all possible split points k within [i,j]. Classic examples: Matrix Chain Multiplication (split matrix sequence), Burst Balloons (split which balloon to burst last), Palindrome Partitioning II (split into palindromic partitions).',
    },
  { q: 'How do you identify if a problem fits the Longest Common Subsequence pattern?', a: 'LCS pattern: two sequences, need to find their longest common subsequence (elements need not be contiguous). dp[i][j] = LCS length of s1[0..i-1] and s2[0..j-1]. If s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1. Else: max(dp[i-1][j], dp[i][j-1]). O(n*m) time and space (space-optimizable to O(m)). Variants: Edit Distance, Shortest Common Supersequence, Delete Operation for Two Strings.' },
  { q: 'What is the state machine DP pattern and when do you use it?', a: 'State machine DP models transitions between states (e.g., holding/not-holding a stock, on cooldown/not). Define dp[state] at each step; transition based on decisions. Example: Best Time to Buy and Sell Stock with Cooldown: states are HELD (have stock), SOLD (just sold, cooldown), REST (available to buy). At each price, compute the max profit in each state from previous states. O(n * states) time.' },
  { q: 'How do you use DP on trees?', a: 'Tree DP (rerooting technique): compute a value for each node based on its subtree. (1) First DFS: compute down-values (result if the subtree is rooted at each node). (2) Second DFS (rerooting): propagate answers upward to compute results for each node considering the whole tree. Example: Find the maximum distance from each node, sum of distances in tree. O(n) total.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'DP patterns: Kadane (max subarray), state machine (stocks), interval DP (palindromes, burst balloons), edit distance (insert/delete/replace), expand-around-center (palindromic substring).',
    mustKnow: [
      'Kadane: current = max(nums[i], current+nums[i]); init with nums[0]',
      'Edit distance: if match=diagonal; else 1+min(replace,delete,insert)',
      'Expand-around-center: check both odd and even center positions',
      'State machine: snapshot all states before updating any',
      'Interval DP: fill by increasing length, try all split points k',
    ],
    interviewFocus: [
      'Max subarray / circular subarray (Kadane)',
      'Edit distance (classic 2D DP)',
      'Best time to buy stock variants (state machine)',
    ],
  };
}
