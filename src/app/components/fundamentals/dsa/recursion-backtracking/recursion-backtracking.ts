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
  selector: 'app-dsa-recursion-backtracking',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './recursion-backtracking.html',
  styleUrl: './recursion-backtracking.scss',
})
export class DsaRecursionBacktracking {
  quickRef: QuickRefItem[] = [
    { name: 'Base case',      type: 'keyword', desc: 'Termination condition — reached leaf node or empty state' },
    { name: 'Backtrack',      type: 'keyword', desc: 'Undo the last choice after recursive call returns' },
    { name: 'Subsets',        type: 'syntax',  desc: 'Include or exclude each element — 2^n paths' },
    { name: 'Permutations',   type: 'syntax',  desc: 'Choose unused element for each position — n! paths' },
    { name: 'Combinations',   type: 'syntax',  desc: 'Start index prevents duplicates — C(n,k) paths' },
    { name: 'Pruning',        type: 'keyword', desc: 'Skip invalid branches early to reduce exponential work' },
    { name: 'State space',    type: 'keyword', desc: 'Choices × depth — backtracking explores all, prunes invalid' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Recursion Fundamentals',
      points: [
        'Every recursive function needs a base case (stops recursion) and a recursive case (reduces the problem).',
        'Trust the recursion: assume the recursive call returns the correct answer for the subproblem.',
        'Call stack depth = recursion depth. Each frame holds local variables — O(depth) space.',
        'Tail recursion: recursive call is the last operation — some languages optimize this to O(1) stack. JavaScript does not.',
      ],
    },
    {
      heading: 'Backtracking Pattern',
      points: [
        'Explore a choice → recurse → undo the choice (backtrack). This explores all valid paths.',
        'Three steps: make a choice, recurse on the new state, undo the choice.',
        'Used for: subsets, permutations, combinations, N-Queens, Sudoku, word search.',
        'Time complexity is typically exponential (2^n or n!) — backtracking is for small n with pruning.',
      ],
    },
    {
      heading: 'Subsets, Permutations, Combinations',
      points: [
        'Subsets: for each element, branch into "include" and "exclude". 2^n subsets total.',
        'Permutations: track used elements, place each unused element at current position. n! permutations.',
        'Combinations: pass a start index to avoid re-using elements and prevent duplicate subsets.',
        'Avoid duplicates: sort input first; skip duplicates at the same tree level (i > start && arr[i] === arr[i-1]).',
      ],
    },
    {
      heading: 'Pruning',
      points: [
        'Pruning cuts off branches that cannot lead to a valid solution — critical for performance.',
        'Sudoku: only try digits that don\'t conflict in row/col/box. N-Queens: skip attacked positions.',
        'Combination sum: if remaining sum < 0, backtrack immediately — no need to go deeper.',
        'Effective pruning can reduce exponential time to near-polynomial for typical inputs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Subsets & Combinations',
      language: 'typescript',
      code: `// Subsets — O(2^n * n), include/exclude each element
function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  function backtrack(start: number, current: number[]): void {
    result.push([...current]); // add current subset (including empty)
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]); // include
      backtrack(i + 1, current);
      current.pop(); // exclude (backtrack)
    }
  }
  backtrack(0, []);
  return result;
}

// Combinations of k elements — C(n,k) results
function combine(n: number, k: number): number[][] {
  const result: number[][] = [];
  function backtrack(start: number, current: number[]): void {
    if (current.length === k) { result.push([...current]); return; }
    for (let i = start; i <= n - (k - current.length) + 1; i++) { // pruning
      current.push(i);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(1, []);
  return result;
}

// Combination sum — allow repeated use, no duplicates
function combinationSum(candidates: number[], target: number): number[][] {
  const result: number[][] = [];
  function backtrack(start: number, current: number[], remaining: number): void {
    if (remaining === 0) { result.push([...current]); return; }
    if (remaining < 0) return; // pruning
    for (let i = start; i < candidates.length; i++) {
      current.push(candidates[i]);
      backtrack(i, current, remaining - candidates[i]); // i (not i+1) allows reuse
      current.pop();
    }
  }
  backtrack(0, [], target);
  return result;
}`,
    },
    {
      label: 'Permutations & N-Queens',
      language: 'typescript',
      code: `// Permutations — O(n! * n)
function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  function backtrack(current: number[], used: boolean[]): void {
    if (current.length === nums.length) { result.push([...current]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(nums[i]);
      backtrack(current, used);
      current.pop();
      used[i] = false; // backtrack
    }
  }
  backtrack([], new Array(nums.length).fill(false));
  return result;
}

// N-Queens — O(n! * n) with pruning
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const cols = new Set<number>(), diag1 = new Set<number>(), diag2 = new Set<number>();
  const board: number[] = []; // board[row] = col of queen
  function backtrack(row: number): void {
    if (row === n) {
      result.push(board.map(c => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
      cols.add(col); diag1.add(row - col); diag2.add(row + col); board.push(col);
      backtrack(row + 1);
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col); board.pop();
    }
  }
  backtrack(0);
  return result;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Pushing current array without spreading — all results point to same array',
      wrong: `result.push(current); // pushed a reference — all entries will be the same empty array`,
      right: `result.push([...current]); // push a snapshot copy`,
      explanation: 'Arrays are passed by reference. Pushing current directly means all results share the same array which gets emptied on backtrack.',
    },
    {
      title: 'Not undoing the choice after recursive call returns',
      wrong: `current.push(nums[i]);
backtrack(i + 1, current);
// Missing: current.pop() — state is never restored`,
      right: `current.push(nums[i]);
backtrack(i + 1, current);
current.pop(); // restore state — essential for backtracking`,
      explanation: 'Backtracking requires undoing every choice. Without pop(), the current array grows indefinitely across all branches.',
    },
    {
      title: 'Permutations: not tracking which elements are used',
      wrong: `for (let i = 0; i < nums.length; i++) {
  current.push(nums[i]); // may push the same element twice`,
      right: `const used = new Array(nums.length).fill(false);
// Skip if used[i] === true, set/unset around recursive call`,
      explanation: 'Without a used array, the same element can appear multiple times in a single permutation.',
    },
    {
      title: 'Combination sum: passing i+1 instead of i — prevents reuse',
      wrong: `backtrack(i + 1, current, remaining - candidates[i]); // can't reuse candidate`,
      right: `backtrack(i, current, remaining - candidates[i]); // i allows reusing same element`,
      explanation: 'If candidates can be reused (combination sum allows repeats), pass i (not i+1) to the recursive call.',
    },
    {
      title: 'No pruning — TLE on large inputs',
      wrong: `for (let i = start; i < candidates.length; i++) {
  current.push(candidates[i]);
  backtrack(i, current, remaining - candidates[i]); // no early exit`,
      right: `if (remaining < 0) return; // prune negative remaining immediately
// Or: sort candidates and break when candidates[i] > remaining`,
      explanation: 'Without pruning, the backtracking tree explores dead-end branches. Even a simple remaining < 0 check dramatically cuts the search space.',
    },
  ];

  challenge: Challenge = {
    title: 'Word Search',
    language: 'typescript',
    description: 'Given an m×n grid of characters and a word, return true if the word exists in the grid. The word can be constructed from adjacent (horizontally/vertically) cells, with each cell used at most once.',
    hints: ['DFS from each cell that matches word[0]', 'Mark cell as visited during DFS, unmark on backtrack', 'Prune when current character doesn\'t match'],
    starterCode: `function exist(board: string[][], word: string): boolean {
  // DFS + backtracking from each matching start cell
}`,
    solution: `function exist(board: string[][], word: string): boolean {
  const rows = board.length, cols = board[0].length;
  function dfs(r: number, c: number, idx: number): boolean {
    if (idx === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[idx]) return false;
    const temp = board[r][c];
    board[r][c] = '#'; // mark visited
    const found = dfs(r+1,c,idx+1) || dfs(r-1,c,idx+1) || dfs(r,c+1,idx+1) || dfs(r,c-1,idx+1);
    board[r][c] = temp; // backtrack
    return found;
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (dfs(r, c, 0)) return true;
  return false;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why must you push [...current] instead of current when collecting results?',
      options: ['Arrays can\'t be pushed directly', 'current is modified later — a copy captures the current state', 'Spread makes a deep copy', 'Performance is better with spread'],
      answer: 1,
      explanation: 'current is mutated during backtracking. Without spreading, all pushed "results" are references to the same array, which will be empty at the end.',
    },
    {
      q: 'What is the time complexity of generating all permutations of n distinct elements?',
      options: ['O(n²)', 'O(2^n)', 'O(n! × n)', 'O(n log n)'],
      answer: 2,
      explanation: 'There are n! permutations. Building each takes O(n) time to copy the array. Total: O(n! × n).',
    },
    {
      q: 'In combination sum, why pass i (not i+1) to the recursive call?',
      options: ['i+1 causes stack overflow', 'i allows the same candidate to be reused in a combination', 'i is more efficient', 'i+1 would skip elements'],
      answer: 1,
      explanation: 'Passing i means the same index can be chosen again in the next recursive call. Passing i+1 would prevent reusing the same element.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is backtracking different from brute-force?',
      a: 'Brute force generates all possible states then filters. Backtracking abandons (prunes) a path as soon as it detects that no solution can be found from that state. Backtracking explores only the valid parts of the search tree, making it far more efficient than raw brute force.',
    },
    {
      q: 'When should I use backtracking vs dynamic programming?',
      a: 'Use backtracking when you need all solutions (all permutations, all subsets), when choices are interdependent (placing a queen changes valid positions for the next), or when there\'s no overlapping subproblem structure. Use DP when you only need the count or optimal value and subproblems overlap (e.g. count of combinations = DP, all combinations = backtracking).',
    },
    {
      q: 'How do you avoid duplicate subsets when input has duplicate elements?',
      a: 'Sort the input first. In the loop, skip nums[i] if i > start && nums[i] === nums[i-1]. The i > start check ensures you only skip duplicates at the same level of the recursion tree, not within a valid path.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Backtracking = make a choice, recurse, undo the choice. Always push [...current] for snapshots, prune early, and undo all state changes on return.',
    mustKnow: [
      'Three steps: choose, recurse, unchoose (backtrack)',
      'Always push [...current] — never push the mutable reference',
      'Subsets: 2^n paths; Permutations: n! paths; Combinations: C(n,k) paths',
      'Avoid duplicates: sort + skip nums[i]===nums[i-1] when i>start',
      'Pruning cuts dead-end branches early — critical for performance',
    ],
    interviewFocus: [
      'Subsets / subsets with duplicates',
      'Permutations / word search (mark visited, backtrack)',
      'Combination sum (reuse vs no-reuse — i vs i+1)',
    ],
  };
}
