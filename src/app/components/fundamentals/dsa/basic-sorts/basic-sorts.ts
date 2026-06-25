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
  selector: 'app-dsa-basic-sorts',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './basic-sorts.html',
  styleUrl: './basic-sorts.scss',
})
export class DsaBasicSorts {
  quickRef: QuickRefItem[] = [
    { name: 'Bubble Sort',    type: 'syntax',  desc: 'O(n²) — swap adjacent elements, largest bubbles to end' },
    { name: 'Selection Sort', type: 'syntax',  desc: 'O(n²) — find min in unsorted portion, swap to front' },
    { name: 'Insertion Sort', type: 'syntax',  desc: 'O(n²) worst, O(n) nearly-sorted — shift elements right, insert' },
    { name: 'Stability',      type: 'keyword', desc: 'Stable sort preserves relative order of equal elements' },
    { name: 'In-place',       type: 'keyword', desc: 'Sorts without extra array — O(1) space beyond input' },
    { name: 'Best case',      type: 'keyword', desc: 'Insertion sort: O(n) on already-sorted — best of the three' },
    { name: 'Use case',       type: 'keyword', desc: 'Basic sorts used for small n or nearly-sorted — O(n²) otherwise' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Bubble Sort',
      points: [
        'Repeatedly compare adjacent pairs and swap if out of order. After each pass, the largest unsorted element "bubbles" to its correct position.',
        'O(n²) worst and average; O(n) best case with early-exit optimization (no swaps in a pass means sorted).',
        'Stable: equal elements are never swapped — relative order preserved.',
        'Rarely used in practice — insertion sort outperforms it even for small arrays.',
      ],
    },
    {
      heading: 'Selection Sort',
      points: [
        'Find the minimum element in the unsorted portion and swap it to the front. Repeat for the remaining unsorted portion.',
        'O(n²) in all cases — always scans the full unsorted portion even if already sorted.',
        'NOT stable: the swap can move an equal element past another.',
        'Advantage: minimizes the number of swaps — exactly n-1 swaps total. Useful when writes are expensive.',
      ],
    },
    {
      heading: 'Insertion Sort',
      points: [
        'For each element, insert it into its correct position in the already-sorted left portion by shifting elements right.',
        'O(n²) worst case (reverse sorted); O(n) best case (already sorted). Excellent for small or nearly-sorted arrays.',
        'Stable and in-place. Used as the base case in hybrid sorts (Timsort, Introsort) for small subarrays.',
        'Online algorithm: can sort a list as it receives elements one at a time.',
      ],
    },
    {
      heading: 'Comparison & Use Cases',
      points: [
        'All three are O(n²) worst case — only suitable for n ≤ ~50 or nearly-sorted data.',
        'Insertion sort is the best of the three: O(n) best case and good cache performance.',
        'Selection sort makes fewest swaps — prefer when swap cost > comparison cost.',
        'In interviews, you\'re expected to know these, but always mention you\'d use a built-in O(n log n) sort in production.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Bubble & Selection Sort',
      language: 'typescript',
      code: `// Bubble Sort — O(n²) O(1) space, stable
function bubbleSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // early exit if already sorted
  }
  return a;
}

// Selection Sort — O(n²) O(1) space, NOT stable
function selectionSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) [a[i], a[minIdx]] = [a[minIdx], a[i]];
  }
  return a;
}`,
    },
    {
      label: 'Insertion Sort',
      language: 'typescript',
      code: `// Insertion Sort — O(n²) worst, O(n) best, stable, in-place
function insertionSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j]; // shift right
      j--;
    }
    a[j + 1] = key; // insert at correct position
  }
  return a;
}

// Demo: insertion sort on nearly-sorted — shows O(n) best case
const nearlySorted = [1, 2, 3, 5, 4]; // one swap needed
console.log(insertionSort(nearlySorted)); // [1,2,3,4,5]

// Sort comparison table:
// Algorithm      Best    Avg     Worst   Space   Stable?
// Bubble Sort    O(n)    O(n²)   O(n²)   O(1)    Yes
// Selection Sort O(n²)   O(n²)   O(n²)   O(1)    No
// Insertion Sort O(n)    O(n²)   O(n²)   O(1)    Yes`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Bubble sort inner loop bound not reducing with outer loop',
      wrong: `for (let j = 0; j < arr.length - 1; j++) { // re-checks sorted tail`,
      right: `for (let j = 0; j < arr.length - 1 - i; j++) { // skip sorted tail`,
      explanation: 'After i passes, the last i elements are already in their final positions. Reduce inner bound by i to avoid redundant comparisons.',
    },
    {
      title: 'Forgetting bubble sort early exit — still O(n²) on sorted input',
      wrong: `for (let j = 0; j < n - 1 - i; j++) { ... } // always runs n² iterations`,
      right: `let swapped = false;
// ... swap and set swapped = true ...
if (!swapped) break; // O(n) on already-sorted arrays`,
      explanation: 'Without the early-exit flag, bubble sort is always O(n²). The flag makes it O(n) for already-sorted input.',
    },
    {
      title: 'Selection sort: claiming it\'s stable',
      wrong: `// Selection sort is stable — equal elements maintain their order`,
      right: `// Selection sort is NOT stable — the swap can move an element past its equal`,
      explanation: 'When swapping the minimum to position i, if arr[i] equals the minimum at minIdx, the equal element at i jumps past others. Not stable.',
    },
    {
      title: 'Insertion sort: using swap instead of shift',
      wrong: `while (j >= 0 && a[j] > key) { [a[j], a[j+1]] = [a[j+1], a[j]]; j--; }`,
      right: `while (j >= 0 && a[j] > key) { a[j+1] = a[j]; j--; } // shift, not swap
a[j+1] = key; // single insert at end`,
      explanation: 'Swapping is 3 operations per element; shifting is 1. Insertion sort is faster because it shifts elements right and places key once.',
    },
    {
      title: 'Using O(n²) sort in production when n is large',
      wrong: `// Bubble/selection/insertion sort for n=100000 — 10 billion operations`,
      right: `// Use built-in sort (Timsort — O(n log n)) for n > ~50
arr.sort((a, b) => a - b);`,
      explanation: 'Basic sorts are only practical for small n (< 50) or nearly-sorted data. For general use, always prefer O(n log n) algorithms.',
    },
  ];

  challenge: Challenge = {
    title: 'Sort Colors (Dutch National Flag)',
    language: 'typescript',
    description: 'Given an array with values 0, 1, 2 (representing red, white, blue), sort it in-place in one pass without using the built-in sort.',
    hints: ['Three-pointer approach: low, mid, high', '0s go to front (low), 2s go to back (high), 1s stay in middle', 'Only advance mid when placing a 1 or moving a 0 to front'],
    starterCode: `function sortColors(nums: number[]): void {
  // In-place, one pass — Dutch National Flag algorithm
}`,
    solution: `function sortColors(nums: number[]): void {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--; // don't advance mid — swapped element needs checking
    }
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which basic sort is NOT stable?',
      options: ['Bubble sort', 'Insertion sort', 'Selection sort', 'All are stable'],
      answer: 2,
      explanation: 'Selection sort swaps the minimum to the front, potentially moving it past equal elements. Bubble and insertion sort are stable.',
    },
    {
      q: 'What is the best-case time complexity of insertion sort?',
      options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'],
      answer: 2,
      explanation: 'On an already-sorted array, insertion sort\'s inner while loop never executes — each element is already in place → O(n).',
    },
    {
      q: 'Which sort minimizes the number of swaps?',
      options: ['Bubble sort', 'Insertion sort', 'Selection sort', 'All equal'],
      answer: 2,
      explanation: 'Selection sort always does exactly n-1 swaps — it finds the minimum and places it with a single swap per pass.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why do Timsort and Introsort use insertion sort for small subarrays?',
      a: 'For small arrays (typically n < 16-64), insertion sort beats quicksort/mergesort in practice due to lower constant factors, better cache performance, and O(n) best case on nearly-sorted data. Hybrid sorts use O(n log n) algorithms for the divide phase and insertion sort for small partitions.',
    },
    {
      q: 'How do you sort an array of objects by multiple keys stably?',
      a: 'Use a stable sort (Timsort — JavaScript\'s Array.sort() is stable since ECMAScript 2019). Sort by least important key first, then most important. Because stable sort preserves existing order, equal elements from earlier sort steps keep their relative positions.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Bubble, selection, insertion sort are all O(n²) — know their differences: insertion sort has O(n) best case and is stable; selection sort has fewest swaps but is not stable.',
    mustKnow: [
      'Bubble: adjacent swaps, stable, O(n) best with early-exit flag',
      'Selection: find min + single swap, NOT stable, always O(n²)',
      'Insertion: shift elements right, stable, O(n) already-sorted',
      'All O(n²) average/worst — only practical for small or nearly-sorted arrays',
      'Production: use built-in sort (Timsort O(n log n))',
    ],
    interviewFocus: [
      'Sort colors / Dutch National Flag (three pointers)',
      'Stability: which sorts are stable and why it matters',
      'When insertion sort beats O(n log n) sorts',
    ],
  };
}
