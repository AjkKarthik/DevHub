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
  selector: 'app-dsa-big-o',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './big-o.html',
  styleUrl: './big-o.scss',
})
export class DsaBigO {
  quickRef: QuickRefItem[] = [
    { name: 'O(1)',       type: 'keyword', desc: 'Constant — array index access, hash table lookup' },
    { name: 'O(log n)',   type: 'keyword', desc: 'Logarithmic — binary search, balanced BST operations' },
    { name: 'O(n)',       type: 'keyword', desc: 'Linear — single loop, linear search' },
    { name: 'O(n log n)', type: 'keyword', desc: 'Linearithmic — merge sort, heap sort' },
    { name: 'O(n²)',      type: 'keyword', desc: 'Quadratic — nested loops, bubble sort' },
    { name: 'O(2ⁿ)',      type: 'keyword', desc: 'Exponential — recursive Fibonacci, power set' },
    { name: 'O(n!)',      type: 'keyword', desc: 'Factorial — permutation generation' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Big-O Measures',
      points: [
        'Big-O describes the upper bound of an algorithm\'s growth rate relative to input size n.',
        'Time complexity counts operations; space complexity counts extra memory used.',
        'We care about asymptotic behaviour — how performance scales as n → ∞, not small n.',
        'Drop constant factors and lower-order terms: 3n² + 5n + 2 → O(n²).',
      ],
    },
    {
      heading: 'Best, Average, and Worst Case',
      points: [
        'Best case (Ω): most favourable input — e.g. the target is the first element in a linear search.',
        'Average case (Θ): expected performance over all inputs — often most practically relevant.',
        'Worst case (O): least favourable input — guarantees algorithm won\'t be worse than this.',
        'Interviews typically ask for worst case unless told otherwise.',
      ],
    },
    {
      heading: 'Rules for Analysing Code',
      points: [
        'Sequential statements: add their complexities — O(n) + O(n²) = O(n²).',
        'Nested loops: multiply — outer O(n) × inner O(n) = O(n²).',
        'Divide-and-conquer halving (binary search, merge sort): multiply log n.',
        'Recursion: draw the call tree and sum all work done — T(n) = 2T(n/2) + O(n) → O(n log n).',
      ],
    },
    {
      heading: 'Space Complexity',
      points: [
        'Only count extra space — the input itself is not counted unless you copy it.',
        'Recursion uses O(depth) stack space — watch for deep recursion causing stack overflow.',
        'In-place algorithms (bubble sort, two pointers) use O(1) extra space.',
        'Hash maps, queues, and auxiliary arrays add to space complexity.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Common Complexities',
      language: 'typescript',
      code: `// O(1) — constant time
function getFirst(arr: number[]): number {
  return arr[0]; // single operation regardless of size
}

// O(n) — linear time
function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) { // n iterations
    if (arr[i] === target) return i;
  }
  return -1;
}

// O(n²) — quadratic time (nested loops)
function hasDuplicate(arr: number[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) { // n*(n-1)/2 pairs
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// O(log n) — logarithmic time (binary search)
function binarySearch(sorted: number[], target: number): number {
  let left = 0, right = sorted.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (sorted[mid] === target) return mid;
    else if (sorted[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    },
    {
      label: 'Amortised Analysis',
      language: 'typescript',
      code: `// Dynamic array push — amortised O(1)
// Occasionally doubles in size (O(n)) but averaged over n pushes → O(1) per push
class DynamicArray {
  private data: number[] = [];
  private capacity = 1;

  push(val: number): void {
    if (this.data.length === this.capacity) {
      // Double capacity — O(n) but rare
      const newData = new Array(this.capacity * 2);
      for (let i = 0; i < this.data.length; i++) newData[i] = this.data[i];
      this.data = newData;
      this.capacity *= 2;
    }
    this.data[this.data.length] = val;
  }
}

// Master theorem examples
// T(n) = T(n/2) + O(1) → O(log n) [binary search]
// T(n) = 2T(n/2) + O(n) → O(n log n) [merge sort]
// T(n) = 2T(n/2) + O(1) → O(n) [sum of binary tree]`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to drop lower-order terms',
      wrong: `O(n² + n)  // wrong — keep both`,
      right: `O(n²)      // drop the lower-order n`,
      explanation: 'As n grows large, n² dominates. Always drop lower-order terms and constants.',
    },
    {
      title: 'Confusing O(log n) base',
      wrong: `O(log₂ n) vs O(log₁₀ n)  // different bases`,
      right: `O(log n)  // all logarithms differ by a constant factor — base doesn't matter`,
      explanation: 'log₂(n) = log₁₀(n) / log₁₀(2) — the difference is a constant, which Big-O drops.',
    },
    {
      title: 'Ignoring recursion stack space',
      wrong: `// Recursive DFS — "O(1) space"
function dfs(node) { dfs(node.left); dfs(node.right); }`,
      right: `// O(h) space where h = tree height (O(log n) balanced, O(n) skewed)`,
      explanation: 'Every recursive call adds a stack frame. Deep recursion uses O(depth) extra space.',
    },
    {
      title: 'Treating all loops as O(n)',
      wrong: `// Outer loop n, inner loop shrinks — "O(n²)"
for (let i = 0; i < n; i++)
  for (let j = i; j < n; j++) { }`,
      right: `// n + (n-1) + ... + 1 = n(n+1)/2 = O(n²) — still quadratic here, but not always`,
      explanation: 'Count total iterations carefully. A halving inner loop gives O(n log n), not O(n²).',
    },
    {
      title: 'Confusing worst case and average case',
      wrong: `// Quick sort is always O(n log n)`,
      right: `// Quick sort: O(n log n) average, O(n²) worst case (bad pivot)`,
      explanation: 'Quick sort degrades to O(n²) with a sorted array and first-element pivot. Use random pivot.',
    },
  ];

  challenge: Challenge = {
    title: 'Identify the Complexity',
    language: 'typescript',
    description: 'Determine the time and space complexity of the given function and explain your reasoning.',
    hints: ['Count nested loops — what is the iteration count?', 'Does the recursion halve the input?', 'Is any extra data structure used?'],
    starterCode: `function mystery(arr: number[]): number {
  let result = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j += i + 1) {
      result += arr[i] + arr[j];
    }
  }
  return result;
}
// What is the time complexity? Explain why.`,
    solution: `// Outer loop: n iterations (i from 0 to n-1)
// Inner loop: n / (i+1) iterations when i = 0,1,...,n-1
// Total = n/1 + n/2 + n/3 + ... + n/n = n * H(n)
// H(n) = harmonic series ≈ ln(n), so total ≈ O(n log n)
// Space complexity: O(1) — only 'result' variable`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of accessing arr[5] in an array of 1000 elements?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      answer: 2,
      explanation: 'Array index access is O(1) — arrays store elements at contiguous memory addresses, so the offset is computed directly.',
    },
    {
      q: 'An algorithm does n + n² + 100 operations. What is its Big-O?',
      options: ['O(n + n²)', 'O(n²)', 'O(n)', 'O(100)'],
      answer: 1,
      explanation: 'Drop lower-order terms and constants. n² dominates as n grows, so the complexity is O(n²).',
    },
    {
      q: 'A recursive function calls itself twice per level and halves the input. Time complexity?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
      answer: 0,
      explanation: 'T(n) = 2T(n/2) + O(1). By the Master Theorem (case 1), this gives O(n).',
    },
    {
      q: 'Merge sort has which space complexity?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answer: 2,
      explanation: 'Merge sort needs O(n) auxiliary space for the temporary merge array.',
    },
  { q: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], answer: 1, explanation: 'Binary search halves the search space each step. After k steps, 2^k >= n, so k >= log2(n). Binary search is O(log n) — the most common logarithmic algorithm.' },
  { q: 'What does O(n!) represent and what algorithm has this complexity?', options: ['Sorting algorithms', 'Brute-force permutation algorithms', 'Hash table operations', 'Tree traversals'], answer: 1, explanation: 'O(n!) grows faster than exponential. Brute-force Traveling Salesman (checking all permutations), naive permutation generation, and some backtracking solutions without pruning. Completely impractical for n > 12-15.' },
  { q: 'What is the amortized time complexity of appending to a dynamic array?', options: ['O(n) every time', 'O(log n)', 'O(1) amortized', 'O(n) amortized'], answer: 2, explanation: 'Dynamic arrays double in size when full (1, 2, 4, 8... capacity). Over n appends, resizing costs total 1+2+4+...+n = 2n work, amortized to O(1) per append. Individual appends can be O(n) but averaged out they are O(1).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why do we drop constants in Big-O?',
      a: 'Constants depend on hardware, language, and compiler — they don\'t affect the fundamental growth rate. O(2n) and O(100n) both grow linearly; the constant multiplier is irrelevant when comparing algorithms at scale.',
    },
    {
      q: 'When does the average case matter more than worst case?',
      a: 'In practice, with randomised inputs or probabilistic algorithms. Quick sort\'s O(n²) worst case almost never occurs with random pivot selection — the average case O(n log n) is what you observe in production.',
    },
    {
      q: 'How do you analyse the complexity of hash table operations?',
      a: 'Average case: O(1) insert, lookup, delete. Worst case: O(n) if all keys hash to the same bucket (hash collision). In interviews, assume O(1) average unless told to consider worst case.',
    },
  { q: 'How do you determine the time complexity of a recursive algorithm?', a: 'Use the Master Theorem for T(n) = aT(n/b) + f(n): compare f(n) to n^log_b(a). Three cases: (1) f(n) < n^log_b(a) -> O(n^log_b(a)); (2) f(n) = n^log_b(a) -> O(n^log_b(a) * log n); (3) f(n) > n^log_b(a) -> O(f(n)). Example: MergeSort T(n) = 2T(n/2) + O(n): a=2, b=2, log_b(a)=1, f(n)=n -> case 2, O(n log n).' },
  { q: 'What is the difference between best case, average case, and worst case complexity?', a: 'Best case: most favorable input (QuickSort on already-sorted with good pivot: O(n log n)). Worst case: most adversarial input (QuickSort with bad pivot always: O(n^2)). Average case: over all possible inputs with uniform distribution (QuickSort average: O(n log n)). Algorithm design targets worst case; amortized analysis averages over a sequence of operations.' },
  { q: 'How do you calculate the space complexity of a recursive function?', a: 'Space complexity of recursion = call stack depth * space per frame. Binary search recursive: O(log n) stack frames * O(1) per frame = O(log n) space. Fibonacci recursive: O(n) depth * O(1) per frame = O(n). Merge sort: O(log n) stack depth + O(n) merge buffer = O(n). Always consider both auxiliary space and call stack depth.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Big-O describes the growth rate of an algorithm\'s resource usage — drop constants and lower-order terms, keep the dominant term.',
    mustKnow: [
      'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)',
      'Nested loops multiply; sequential loops add',
      'Drop constants and lower-order terms',
      'Recursion depth = stack space (unless tail-call optimised)',
      'Average case ≠ worst case — know both for common algorithms',
    ],
    interviewFocus: [
      'State time AND space complexity for every solution you write',
      'Explain why — not just state the answer — "because the nested loops iterate n×n times"',
      'Know the Big-O of built-in operations: Array sort = O(n log n), Map lookup = O(1) avg',
    ],
  };
}
