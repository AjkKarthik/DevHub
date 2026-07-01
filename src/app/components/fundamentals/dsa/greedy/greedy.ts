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
  selector: 'app-dsa-greedy',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './greedy.html',
  styleUrl: './greedy.scss',
})
export class DsaGreedy {
  quickRef: QuickRefItem[] = [
    { name: 'Local optimum',   type: 'keyword', desc: 'Greedy picks the best choice at each step without backtracking' },
    { name: 'Interval scheduling', type: 'syntax', desc: 'Sort by end time, greedily pick non-overlapping intervals' },
    { name: 'Jump Game',       type: 'syntax',  desc: 'Track max reachable index — can we reach the end?' },
    { name: 'Gas station',     type: 'syntax',  desc: 'If total gas >= total cost, solution exists; find start greedily' },
    { name: 'Sort by condition',type:'syntax',  desc: 'Many greedy problems start with a sort that defines processing order' },
    { name: 'Greedy vs DP',    type: 'keyword', desc: 'Greedy: one optimal local choice. DP: try all subproblems and cache' },
    { name: 'Proof needed',    type: 'keyword', desc: 'Greedy correctness requires exchange argument — not always obvious' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Greedy Algorithm Pattern',
      points: [
        'At each step, make the locally optimal choice — the one that looks best right now — and never reconsider.',
        'Greedy works when the problem has the greedy-choice property: a local optimum leads to a global optimum.',
        'Much simpler than DP when it applies — O(n log n) (sort + one pass) is typical.',
        'The hard part is proving correctness — use an exchange argument: assume an optimal solution differs, show you can swap to the greedy choice without losing optimality.',
      ],
    },
    {
      heading: 'Interval Scheduling',
      points: [
        'Minimum intervals to remove overlaps: sort by end time, greedily keep intervals that don\'t overlap with the last kept one.',
        'Merge intervals: sort by start time, merge overlapping pairs by extending the end of the current interval.',
        'Key insight: sorting by end time is optimal because earlier-finishing intervals leave the most room for future ones.',
        'Meeting rooms II (min rooms needed): count peak overlapping intervals using sorted start/end events.',
      ],
    },
    {
      heading: 'Jump Game Patterns',
      points: [
        'Jump Game I (can reach end): track maxReach = max(maxReach, i + jumps[i]). If i > maxReach at any point, return false.',
        'Jump Game II (min jumps): track currentEnd (current jump range) and farthest. When i reaches currentEnd, take a jump.',
        'Both are O(n) O(1) — greedy beats DP here because we only need to track the furthest reach.',
        'Gas Station: if total gas >= total cost, a solution always exists. The starting position is where cumulative tank last hit 0.',
      ],
    },
    {
      heading: 'Greedy vs DP',
      points: [
        'Greedy: make one definitive choice per step, never undo. O(n) or O(n log n). Works on a subset of problems.',
        'DP: try all possible choices for each subproblem, cache results. O(n²) or more. Works on a larger set of problems.',
        'If greedy fails (e.g. coin change with non-canonical coins), fall back to DP.',
        'When a problem says "minimum number of..." or "maximum of..." — try greedy first; if it doesn\'t work, use DP.',
      ],
    },
    {
      heading: 'Proving (or Disproving) That a Greedy Approach Works',
      points: [
        'A greedy algorithm is only correct if the problem exhibits the "greedy choice property" (a locally optimal choice leads to a globally optimal solution) — verifying this property, typically via an exchange argument or induction, is essential before trusting a greedy solution.',
        'The classic activity selection problem (choosing the maximum number of non-overlapping intervals) is provably solved optimally by always picking the interval with the earliest finish time — a specific greedy strategy that would NOT work if applied to earliest start time instead.',
        'Many candidates incorrectly assume any locally-sensible-looking strategy is greedy-optimal — 0/1 knapsack is the canonical counterexample, where greedily picking items by best value-to-weight ratio does NOT guarantee an optimal solution, unlike the fractional knapsack variant where it does.',
        'When a greedy approach fails to produce a provably optimal solution, dynamic programming is the typical fallback, since DP explores the full solution space (with memoization to avoid redundant work) rather than committing irrevocably to locally optimal choices.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Interval Problems',
      language: 'typescript',
      code: `// Non-overlapping intervals (min removals) — sort by end, greedy keep
function eraseOverlapIntervals(intervals: number[][]): number {
  intervals.sort((a, b) => a[1] - b[1]); // sort by end time
  let removals = 0, lastEnd = -Infinity;
  for (const [start, end] of intervals) {
    if (start >= lastEnd) lastEnd = end; // no overlap — keep this interval
    else removals++; // overlap — remove (implicitly keep the one with earlier end)
  }
  return removals;
}

// Merge intervals — sort by start, merge overlapping
function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const result: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else result.push(intervals[i]);
  }
  return result;
}

// Meeting rooms II — min rooms needed
function minMeetingRooms(intervals: number[][]): number {
  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
  const ends   = intervals.map(i => i[1]).sort((a, b) => a - b);
  let rooms = 0, endPtr = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] < ends[endPtr]) rooms++;
    else endPtr++;
  }
  return rooms;
}`,
    },
    {
      label: 'Jump Game & Gas Station',
      language: 'typescript',
      code: `// Jump Game I — can reach end? O(n) O(1)
function canJump(nums: number[]): boolean {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false; // can't reach position i
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
}

// Jump Game II — min jumps to reach end O(n) O(1)
function jump(nums: number[]): number {
  let jumps = 0, currentEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === currentEnd) { jumps++; currentEnd = farthest; }
  }
  return jumps;
}

// Gas Station — find starting position O(n) O(1)
function canCompleteCircuit(gas: number[], cost: number[]): number {
  let totalTank = 0, currentTank = 0, start = 0;
  for (let i = 0; i < gas.length; i++) {
    const net = gas[i] - cost[i];
    totalTank += net;
    currentTank += net;
    if (currentTank < 0) { start = i + 1; currentTank = 0; } // reset start
  }
  return totalTank >= 0 ? start : -1;
}

// Partition labels — greedy with last occurrence
function partitionLabels(s: string): number[] {
  const last: Record<string, number> = {};
  for (let i = 0; i < s.length; i++) last[s[i]] = i;
  const result: number[] = [];
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s[i]]);
    if (i === end) { result.push(end - start + 1); start = i + 1; }
  }
  return result;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Applying greedy to coin change with non-standard denominations',
      wrong: `// coins = [1, 3, 4], amount = 6
// Greedy picks 4+1+1 = 3 coins — but 3+3 = 2 coins is optimal`,
      right: `// Use DP for coin change — greedy only works for canonical coin systems
// (e.g. US coins: 25, 10, 5, 1 — greedy always optimal there)`,
      explanation: 'Greedy coin change only works when each larger coin divides evenly into the next (canonical system). For arbitrary denominations, DP is required.',
    },
    {
      title: 'Interval scheduling: sorting by start time instead of end time',
      wrong: `intervals.sort((a, b) => a[0] - b[0]); // sort by start — wrong for non-overlap`,
      right: `intervals.sort((a, b) => a[1] - b[1]); // sort by end — greedy keeps earliest-finishing`,
      explanation: 'Earliest deadline first (sort by end) is the provably optimal strategy for maximizing non-overlapping intervals. Sorting by start doesn\'t guarantee optimality.',
    },
    {
      title: 'Jump Game: not checking if current position is reachable before updating maxReach',
      wrong: `for (let i = 0; i < nums.length; i++) {
  maxReach = Math.max(maxReach, i + nums[i]); // i may be unreachable`,
      right: `if (i > maxReach) return false; // can't reach i — stop early
maxReach = Math.max(maxReach, i + nums[i]);`,
      explanation: 'If position i is beyond maxReach, we can never get there. Check reachability before updating — otherwise you might extend from an unreachable position.',
    },
    {
      title: 'Gas station: not checking if a solution exists (total >= 0)',
      wrong: `return start; // may return wrong answer if no solution exists`,
      right: `return totalTank >= 0 ? start : -1; // no solution if total gas < total cost`,
      explanation: 'If total gas < total cost, no starting position can complete the circuit. Always check total first.',
    },
    {
      title: 'Merge intervals: not using Math.max for the end of merged interval',
      wrong: `last[1] = intervals[i][1]; // overwrites end — wrong if current interval ends earlier`,
      right: `last[1] = Math.max(last[1], intervals[i][1]); // keep the furthest end`,
      explanation: 'An interval fully contained within the previous one has a smaller end. Take Math.max to correctly extend to the furthest right bound.',
    },
  ];

  challenge: Challenge = {
    title: 'Task Scheduler',
    language: 'typescript',
    description: 'Given tasks with frequencies and a cooldown n, return the minimum time to execute all tasks. Identical tasks must be at least n intervals apart. You can insert idle slots.',
    hints: ['Find the most frequent task — it determines the frame structure', 'Minimum time = max(tasks.length, (maxFreq-1)*(n+1) + count_of_maxFreq_tasks)', 'This formula handles both idle-dominated and task-dominated cases'],
    starterCode: `function leastInterval(tasks: string[], n: number): number {
  // Greedy: schedule most frequent task first
}`,
    solution: `function leastInterval(tasks: string[], n: number): number {
  const freq = new Array(26).fill(0);
  for (const t of tasks) freq[t.charCodeAt(0) - 65]++;
  const maxFreq = Math.max(...freq);
  const maxCount = freq.filter(f => f === maxFreq).length;
  // Frame: (maxFreq-1) full cycles of (n+1) slots + final row of maxCount tasks
  return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why do we sort by end time (not start time) for non-overlapping interval scheduling?',
      options: ['End time sort is faster', 'Earliest-finishing intervals leave maximum room for future intervals', 'Start time sort causes incorrect merges', 'Sorting by start requires extra space'],
      answer: 1,
      explanation: 'Earliest Deadline First: by picking the interval that ends soonest, we free up the most time for subsequent intervals — provably optimal by exchange argument.',
    },
    {
      q: 'In Jump Game II (minimum jumps), when do you increment the jump count?',
      options: ['Every time i moves', 'When i reaches currentEnd (the boundary of current jump range)', 'When farthest is updated', 'At every odd index'],
      answer: 1,
      explanation: 'When i reaches currentEnd, we\'ve exhausted the current jump range. We must take another jump to reach farthest — increment jumps and update currentEnd.',
    },
    {
      q: 'In Gas Station, what condition guarantees a solution exists?',
      options: ['Starting at index 0 works', 'Total gas >= total cost', 'All gas[i] > cost[i]', 'The array is sorted'],
      answer: 1,
      explanation: 'If total gas >= total cost, the circuit can always be completed — a valid starting position always exists. The greedy scan finds it in O(n).',
    },
  { q: 'What is the greedy choice property?', options: ['The optimal solution always uses the same choice at every step', 'A locally optimal choice at each step leads to a globally optimal solution', 'Greedy always sorts input first', 'Greedy applies only to graph problems'], answer: 1, explanation: 'Greedy choice property: at each decision point, the locally optimal choice (greedy pick) is safe — it is part of some globally optimal solution. Combined with optimal substructure, this justifies greedy over DP.' },
  { q: 'Which problem is correctly solved by the greedy algorithm?', options: ['0/1 Knapsack', 'Longest Common Subsequence', 'Activity Selection (interval scheduling)', 'Coin Change with arbitrary denominations'], answer: 2, explanation: 'Activity Selection: sort activities by end time, greedily pick the first compatible activity. Provably optimal. 0/1 Knapsack requires DP (greedy on value/weight ratio fails). Coin Change with arbitrary coins requires DP.' },
  { q: 'What is the greedy algorithm for Huffman coding?', options: ['Sort characters by frequency, assign binary codes', 'Use a min-heap: repeatedly merge two lowest-frequency nodes into a parent node', 'Assign 0 to all characters', 'Use a balanced binary tree'], answer: 1, explanation: 'Huffman coding builds an optimal prefix-free code. Min-heap: extract two minimum frequency nodes, create parent with sum frequency, re-insert. Repeat until one tree. O(n log n). Characters with higher frequency get shorter codes.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you prove a greedy algorithm is correct?',
      a: 'Use an exchange argument: (1) Assume an optimal solution S* differs from the greedy solution G. (2) Show you can swap the differing choice in S* for the greedy choice without making the solution worse. (3) By induction, the greedy solution is at least as good as any optimal solution, so it is optimal.',
    },
    {
      q: 'When should I try greedy vs DP?',
      a: 'Try greedy when: the problem has a natural ordering/sorting step, local choices don\'t invalidate each other, and you can argue the local optimum is globally optimal. Try DP when: choices have downstream effects (coin change), you need all solutions (not just count), or greedy gives wrong answers on counterexamples. Many problems accept either — greedy is always faster if it works.',
    },
    {
      q: 'What is the exchange argument and why does it matter?',
      a: 'The exchange argument formally proves greedy correctness: take any optimal solution, and show you can transform it into the greedy solution step-by-step without worsening the objective. This is stronger than just "it works on examples" — it proves the greedy choice is always safe to make.',
    },
  { q: 'How do you prove that a greedy algorithm is correct?', a: 'Two standard proofs: (1) Greedy stays ahead: show that after each step, the greedy solution is at least as good as any other solution at that point. (2) Exchange argument: take any optimal solution; show you can swap non-greedy choices for greedy choices without worsening the result. If every swap maintains optimality, greedy is optimal. Failure of exchange argument usually means you need DP.' },
  { q: 'What is the fractional knapsack problem and why does greedy work for it but not 0/1 knapsack?', a: 'Fractional knapsack allows taking fractions of items. Greedy: sort by value/weight ratio, take items in order, take fraction of last item if needed. Works because taking the highest-ratio item is always optimal when fractions are allowed. In 0/1 knapsack, you cannot take fractions, so a high-ratio item that wastes capacity may be suboptimal vs two lower-ratio items that fill the knapsack exactly.' },
  { q: 'How does the interval scheduling maximization problem differ from interval scheduling with deadlines?', a: 'Interval scheduling maximization: select max number of non-overlapping intervals. Greedy: sort by END TIME, pick earliest-ending compatible interval. Optimal. Interval scheduling with deadlines (weighted): each job has a profit and deadline; maximize profit. Greedy by deadline and use a greedy-with-backtracking approach or DP. Weighted interval scheduling requires DP (binary search on sorted intervals).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Greedy makes the locally optimal choice at each step — works when local optimum = global optimum. Sort by the right criterion, then greedily scan in one pass.',
    mustKnow: [
      'Interval scheduling: sort by END time, keep non-overlapping',
      'Merge intervals: sort by START time, extend end greedily',
      'Jump Game I: track maxReach, return false if i > maxReach',
      'Jump Game II: increment jumps when i hits currentEnd',
      'Gas station: totalTank >= 0 guarantees solution; start resets on negative tank',
    ],
    interviewFocus: [
      'Non-overlapping intervals (eraseOverlapIntervals)',
      'Jump Game I and II',
      'Task scheduler (frequency-based greedy)',
    ],
  };
}
