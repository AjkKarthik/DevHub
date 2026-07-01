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
    {
      heading: 'Why Basic Sorts Still Matter Despite Being Asymptotically Worse',
      points: [
        'Insertion sort outperforms O(n log n) algorithms like merge sort or quicksort on small arrays (typically under 10-20 elements) due to lower constant-factor overhead, which is why many production sort implementations switch to insertion sort as a base case for small subarrays.',
        'Insertion sort is adaptive — its running time approaches O(n) on nearly-sorted input, since few or no swaps are needed, making it a good choice for data that is already mostly ordered, such as incrementally appending new elements to a maintained sorted list.',
        'Bubble sort and selection sort are rarely used in production code due to their consistent O(n^2) behavior even on nearly-sorted data, but they remain useful teaching tools because their mechanics are the simplest to trace by hand and reason about.',
        'Understanding basic sorts builds the intuition (comparisons, swaps, invariants maintained across passes) needed to analyze and debug more advanced algorithms, which is why interviewers often start with these before moving to merge sort or quicksort questions.',
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
  { q: 'What is the best-case time complexity of Insertion Sort?', options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 2, explanation: 'Insertion Sort is O(n) on already-sorted input — it makes one pass and each element requires zero swaps. This makes it excellent for nearly-sorted data or small arrays (used by TimSort for runs < 64 elements).' },
  { q: 'Which basic sort is the only stable and adaptive one among bubble, selection, and insertion?', options: ['Bubble Sort only', 'Insertion Sort only', 'Both bubble and insertion', 'All three are stable and adaptive'], answer: 2, explanation: 'Bubble Sort: stable (swaps adjacent equal elements only when strictly less than), adaptive (can be O(n) with an early-exit flag). Selection Sort: NOT stable (swaps non-adjacent elements), NOT adaptive (always O(n^2)).' },
  { q: 'Why is Selection Sort rarely used in practice?', options: ['It is unstable and always O(n^2)', 'It uses too much memory', 'It only works on integers', 'It requires sorted input'], answer: 0, explanation: 'Selection Sort does exactly n-1 swaps (useful if writes are expensive) but always makes O(n^2) comparisons regardless of input order. It is also unstable. Insertion Sort is preferred for small arrays.' },
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
  { q: 'When is Insertion Sort faster than O(n log n) algorithms like MergeSort?', a: 'Insertion Sort outperforms MergeSort/QuickSort on: (1) Very small arrays (n < 10-20) due to low constant factors and cache efficiency; (2) Nearly sorted arrays (each element is k positions from its sorted position, O(nk) total); (3) Online sorting (elements arrive one at a time — insert each in O(n) into a sorted prefix). TimSort uses Insertion Sort for small runs.' },
  { q: 'How does Bubble Sort adaptive optimization work?', a: 'Add an early-exit flag: set swapped=false before each pass; if no swap occurs during a full pass, the array is sorted and you can stop. Best case becomes O(n). In practice, Bubble Sort is still rarely used because Insertion Sort has identical best case but fewer comparisons on average. The optimization does make Bubble Sort linear on nearly-sorted input.' },
  { q: 'What is the difference between a stable and unstable sort?', a: 'A stable sort preserves the relative order of equal elements. Example: sorting [{name:Alice, age:30}, {name:Bob, age:30}] by age — a stable sort keeps Alice before Bob. Importance: multi-key sorts (sort by last name then first name) require stability. JavaScript Array.sort() is stable since ES2019. Unstable sorts: Selection Sort, HeapSort, naive QuickSort.' },
  { q: 'What is the space complexity of bubble, selection, and insertion sort?', a: 'All three are O(1) space (in-place). They sort the array using only a constant amount of additional variables (loop indices, a temporary swap variable). This contrasts with MergeSort O(n) and some QuickSort implementations. In-place sorting is important for memory-constrained environments.' },
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
