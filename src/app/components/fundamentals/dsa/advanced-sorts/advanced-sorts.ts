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
  selector: 'app-dsa-advanced-sorts',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './advanced-sorts.html',
  styleUrl: './advanced-sorts.scss',
})
export class DsaAdvancedSorts {
  quickRef: QuickRefItem[] = [
    { name: 'Merge Sort',   type: 'syntax',  desc: 'O(n log n) stable — divide, sort halves, merge. O(n) space' },
    { name: 'Quick Sort',   type: 'syntax',  desc: 'O(n log n) avg, O(n²) worst — partition around pivot. O(log n) space' },
    { name: 'Counting Sort',type: 'syntax',  desc: 'O(n+k) — non-comparison, integers in range [0,k]. Stable' },
    { name: 'Heap Sort',    type: 'syntax',  desc: 'O(n log n) worst — heapify then extract-max. O(1) space, not stable' },
    { name: 'Pivot choice', type: 'keyword', desc: 'Median-of-three or random pivot avoids O(n²) worst case' },
    { name: 'Merge invariant',type:'keyword',desc: 'Merge step assumes both halves are already sorted' },
    { name: 'Timsort',     type: 'keyword', desc: 'Hybrid merge+insertion — O(n log n), stable — used in JS/Python' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Merge Sort',
      points: [
        'Divide array in half recursively until size 1, then merge sorted halves back together.',
        'O(n log n) guaranteed in all cases — log n levels of recursion, O(n) work per level to merge.',
        'Stable: equal elements from the left half are placed before equal elements from the right half.',
        'O(n) extra space for the temporary merge buffer — downside vs. in-place sorts.',
      ],
    },
    {
      heading: 'Quick Sort',
      points: [
        'Choose a pivot, partition array so elements < pivot are left, elements > pivot are right. Recurse.',
        'Average O(n log n); worst O(n²) when pivot is always the min/max (sorted input with first-element pivot).',
        'O(log n) average space (recursion depth); O(n) worst case with bad pivots.',
        'In practice faster than merge sort for random data due to better cache performance and no extra memory.',
      ],
    },
    {
      heading: 'Counting Sort',
      points: [
        'Non-comparison sort: count occurrences of each value, reconstruct sorted array from counts.',
        'O(n+k) time and space where k is the range of values. Only works for integers in a bounded range.',
        'Stable when implemented with a cumulative count array and backward reconstruction.',
        'Used as a subroutine in Radix sort. Great for sorting frequencies, ages, grades.',
      ],
    },
    {
      heading: 'Heap Sort',
      points: [
        'Build a max-heap (O(n)), then repeatedly extract-max to get sorted order (n × O(log n)).',
        'O(n log n) guaranteed, O(1) space — sorts in-place using the heap stored in the array.',
        'Not stable: heap operations move elements across the array in non-order-preserving ways.',
        'Rarely used in practice (worse cache performance than quicksort) but provably O(n log n) in-place.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Merge Sort',
      language: 'typescript',
      code: `// Merge Sort — O(n log n), O(n) space, stable
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]); // <= for stability
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i), right.slice(j));
}

// Count inversions using merge sort (classic interview problem)
function countInversions(arr: number[]): number {
  let inversions = 0;
  function mergeSortCount(a: number[]): number[] {
    if (a.length <= 1) return a;
    const mid = Math.floor(a.length / 2);
    const left = mergeSortCount(a.slice(0, mid));
    const right = mergeSortCount(a.slice(mid));
    const merged: number[] = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) merged.push(left[i++]);
      else { inversions += left.length - i; merged.push(right[j++]); }
    }
    return merged.concat(left.slice(i), right.slice(j));
  }
  mergeSortCount(arr);
  return inversions;
}`,
    },
    {
      label: 'Quick Sort & Counting Sort',
      language: 'typescript',
      code: `// Quick Sort — O(n log n) avg, O(n²) worst, O(log n) space
function quickSort(arr: number[], lo = 0, hi = arr.length - 1): void {
  if (lo >= hi) return;
  const pivotIdx = partition(arr, lo, hi);
  quickSort(arr, lo, pivotIdx - 1);
  quickSort(arr, pivotIdx + 1, hi);
}

function partition(arr: number[], lo: number, hi: number): number {
  // Lomuto partition: pivot = last element
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) { i++; [arr[i], arr[j]] = [arr[j], arr[i]]; }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}

// Counting Sort — O(n+k), non-comparison, integers only
function countingSort(arr: number[], maxVal: number): number[] {
  const count = new Array(maxVal + 1).fill(0);
  for (const n of arr) count[n]++;
  // Cumulative counts for stable sort
  for (let i = 1; i <= maxVal; i++) count[i] += count[i - 1];
  const output = new Array(arr.length);
  for (let i = arr.length - 1; i >= 0; i--) {
    output[--count[arr[i]]] = arr[i]; // backward pass for stability
  }
  return output;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Quick sort worst case on sorted/reverse-sorted input with first-element pivot',
      wrong: `const pivot = arr[lo]; // always picks first — O(n²) on sorted arrays`,
      right: `// Use last element (Lomuto) or median-of-three or random pivot
const pivot = arr[hi]; // Lomuto — still O(n²) on sorted, but common in interviews
// Random: const pivotIdx = lo + Math.floor(Math.random()*(hi-lo+1)); swap to hi first`,
      explanation: 'First-element pivot on already-sorted input creates n partitions of size 0 and n-1 — degenerating to O(n²).',
    },
    {
      title: 'Merge sort: using > instead of <= in merge — breaks stability',
      wrong: `if (left[i] < right[j]) result.push(left[i++]); // < not <=`,
      right: `if (left[i] <= right[j]) result.push(left[i++]); // <= for stability`,
      explanation: 'Using <= means equal elements from the left half are placed first — preserving their original relative order (stability).',
    },
    {
      title: 'Counting sort on negative integers without offset',
      wrong: `count[arr[i]]++; // index -1 → out of bounds or incorrect`,
      right: `const min = Math.min(...arr);
const count = new Array(max - min + 1).fill(0);
count[arr[i] - min]++; // offset by min`,
      explanation: 'Counting sort requires non-negative indices. Offset all values by min to handle negative integers.',
    },
    {
      title: 'Assuming quicksort is always O(n log n)',
      wrong: `// Quicksort is O(n log n) in all cases`,
      right: `// Quicksort is O(n log n) average, O(n²) worst case (poor pivot choice)`,
      explanation: 'Quicksort\'s worst case is O(n²) with a consistently bad pivot. Randomized pivot makes worst case extremely unlikely in practice.',
    },
    {
      title: 'Using merge sort when O(1) space is required',
      wrong: `// Merge sort needs O(n) extra space for the merge buffer`,
      right: `// For O(1) space + O(n log n): use heap sort
// For O(1) space + average O(n log n): use quicksort (in-place partition)`,
      explanation: 'Merge sort\'s O(n) extra space is a hard constraint. Heap sort is the only comparison sort that is both O(n log n) worst case and O(1) space.',
    },
  ];

  challenge: Challenge = {
    title: 'Sort an Array (Merge Sort Implementation)',
    language: 'typescript',
    description: 'Implement merge sort to sort an array of integers in ascending order. You must NOT use the built-in sort function.',
    hints: ['Divide: find mid, recursively sort left and right halves', 'Merge: two-pointer merge of sorted halves', 'Base case: array of length 0 or 1 is already sorted'],
    starterCode: `function sortArray(nums: number[]): number[] {
  // Implement merge sort — O(n log n), stable
}`,
    solution: `function sortArray(nums: number[]): number[] {
  if (nums.length <= 1) return nums;
  const mid = Math.floor(nums.length / 2);
  const left = sortArray(nums.slice(0, mid));
  const right = sortArray(nums.slice(mid));
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i), right.slice(j));
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which sort is guaranteed O(n log n) in the worst case AND uses O(1) extra space?',
      options: ['Merge sort', 'Quick sort', 'Heap sort', 'Counting sort'],
      answer: 2,
      explanation: 'Heap sort: O(n log n) guaranteed (no bad pivot), O(1) space (in-place heap). Merge sort needs O(n) space; quicksort is O(n²) worst case.',
    },
    {
      q: 'What makes merge sort stable?',
      options: ['It uses a pivot', 'Left half elements are placed before right when equal (using <=)', 'It uses extra space', 'It works recursively'],
      answer: 1,
      explanation: 'Using <= in the merge comparison means equal elements from the left half are always placed first, preserving original relative order.',
    },
    {
      q: 'What is the time complexity of counting sort?',
      options: ['O(n log n)', 'O(n²)', 'O(n + k) where k is value range', 'O(k log k)'],
      answer: 2,
      explanation: 'Counting sort is O(n + k): O(n) to count, O(k) to build cumulative counts, O(n) to reconstruct. Only works for integers in bounded range.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When would you choose quicksort over mergesort in practice?',
      a: 'Quicksort is preferred in practice for in-memory sorting: better cache locality (partitions in-place), O(log n) average stack depth, and faster constant factors. Mergesort is preferred for external sorting (disk), stable sorting requirements, or when worst-case O(n log n) is mandatory.',
    },
    {
      q: 'How does JavaScript\'s Array.sort() work?',
      a: 'JavaScript engines use Timsort (a hybrid merge+insertion sort). It\'s O(n log n), stable (guaranteed since ES2019), and adapts to partially sorted data. Always provide a comparator: arr.sort((a,b) => a-b) for numbers — without it, elements are sorted as strings.',
    },
    {
      q: 'What is radix sort and how does it relate to counting sort?',
      a: 'Radix sort processes integer keys digit by digit from least significant to most significant. It uses counting sort as a stable subroutine for each digit. Total complexity: O(d × (n+k)) where d is number of digits. Useful for large n with bounded integer keys.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Merge sort: stable O(n log n) O(n) space. Quicksort: in-place O(n log n) avg O(n²) worst. Heap sort: in-place O(n log n) worst. Counting sort: O(n+k) non-comparison.',
    mustKnow: [
      'Merge sort: always O(n log n), stable, O(n) space',
      'Quick sort: O(n log n) avg, O(n²) worst, O(1) space (in-place)',
      'Heap sort: O(n log n) worst, O(1) space, not stable',
      'Counting sort: O(n+k), integers only, non-comparison',
      'JS Array.sort() = Timsort (stable, O(n log n))',
    ],
    interviewFocus: [
      'Implement merge sort or quicksort from scratch',
      'Which sort is stable? Which is in-place?',
      'When would you use counting sort?',
    ],
  };
}
