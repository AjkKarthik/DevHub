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
  selector: 'app-dsa-binary-search',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './binary-search.html',
  styleUrl: './binary-search.scss',
})
export class DsaBinarySearch {
  quickRef: QuickRefItem[] = [
    { name: 'Standard BS',     type: 'syntax',  desc: 'lo=0, hi=n-1; while lo<=hi; mid=(lo+hi)>>1' },
    { name: 'Left bound',      type: 'syntax',  desc: 'Find first occurrence: when match, hi=mid-1; return lo' },
    { name: 'Right bound',     type: 'syntax',  desc: 'Find last occurrence: when match, lo=mid+1; return hi' },
    { name: 'Search space',    type: 'keyword', desc: 'Binary search on answer — minimize/maximize monotone condition' },
    { name: 'Overflow guard',  type: 'keyword', desc: 'mid = lo + (hi-lo)/2 — avoids integer overflow' },
    { name: 'Rotated array',   type: 'syntax',  desc: 'One half is always sorted — use to discard correctly' },
    { name: 'Complexity',      type: 'keyword', desc: 'O(log n) time, O(1) space — halves search space each step' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Binary Search Fundamentals',
      points: [
        'Requires a sorted array (or a monotone condition). Halves the search space at each step → O(log n).',
        'Maintain lo and hi pointers. Compute mid = lo + Math.floor((hi - lo) / 2) to avoid overflow.',
        'Three outcomes per iteration: target found, go left (hi = mid - 1), go right (lo = mid + 1).',
        'Loop condition lo <= hi: terminates when lo > hi, meaning the target is not present.',
      ],
    },
    {
      heading: 'Left Bound and Right Bound',
      points: [
        'Left bound (first occurrence): when arr[mid] === target, set hi = mid - 1. Return lo at end.',
        'Right bound (last occurrence): when arr[mid] === target, set lo = mid + 1. Return hi at end.',
        'After the loop, lo is the index where target would be inserted (lower_bound).',
        'Use these variants for: find range of a value, count occurrences, insertion point.',
      ],
    },
    {
      heading: 'Binary Search on Answer',
      points: [
        'When the answer is a number in a range and there\'s a monotone condition (valid/invalid split).',
        'Binary search the answer space: if condition(mid) is valid, try lower (minimize) or higher (maximize).',
        'Examples: minimum speed to eat bananas, minimum days to ship packages, sqrt(x).',
        'Key insight: you\'re not searching an array — you\'re searching the range of possible answers.',
      ],
    },
    {
      heading: 'Rotated Sorted Array',
      points: [
        'One half of a rotated sorted array is always normally sorted — use this to decide which half to search.',
        'If left half is sorted (arr[lo] <= arr[mid]): target in [arr[lo], arr[mid]) → search left, else search right.',
        'If right half is sorted (arr[mid] <= arr[hi]): target in (arr[mid], arr[hi]] → search right, else search left.',
        'With duplicates: arr[lo] === arr[mid] is ambiguous — increment lo to break the tie.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Core Templates',
      language: 'typescript',
      code: `// Standard binary search — returns index or -1
function search(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// Left bound — first occurrence / insertion point
function lowerBound(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1; // include mid as potential answer
  }
  return lo; // index of first element >= target
}

// Right bound — last occurrence
function upperBound(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] <= target) lo = mid + 1; // include mid as potential answer
    else hi = mid - 1;
  }
  return hi; // index of last element <= target
}

// Count occurrences of target
function countOccurrences(arr: number[], target: number): number {
  const left = lowerBound(arr, target);
  const right = upperBound(arr, target);
  return arr[left] === target ? right - left + 1 : 0;
}`,
    },
    {
      label: 'Search on Answer & Rotated',
      language: 'typescript',
      code: `// Binary search on answer — minimum eating speed (Koko)
function minEatingSpeed(piles: number[], h: number): number {
  const canFinish = (speed: number) => piles.every(p => Math.ceil(p / speed) <= h);
  // Hmm — wait: total hours, not per pile
  const totalHours = (speed: number) => piles.reduce((s, p) => s + Math.ceil(p / speed), 0);
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) { // lo < hi pattern for "find minimum valid"
    const mid = lo + Math.floor((hi - lo) / 2);
    if (totalHours(mid) <= h) hi = mid; // valid — try smaller
    else lo = mid + 1; // too slow — need bigger speed
  }
  return lo;
}

// Search in rotated sorted array — O(log n)
function searchRotated(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) { // left half is sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else { // right half is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Integer overflow in mid calculation',
      wrong: `const mid = Math.floor((lo + hi) / 2); // lo+hi can overflow in other languages`,
      right: `const mid = lo + Math.floor((hi - lo) / 2); // safe in all languages`,
      explanation: 'In JavaScript numbers are 64-bit floats so overflow is unlikely, but the safe formula is a good habit — especially for C++/Java interviews.',
    },
    {
      title: 'Off-by-one: using lo < hi vs lo <= hi',
      wrong: `while (lo < hi) { ... } // misses the case where lo === hi === answer`,
      right: `while (lo <= hi) { ... return -1; } // standard "find exact" template
// OR: while (lo < hi) { ... } return lo; // "find minimum valid" template`,
      explanation: 'Use lo <= hi when searching for an exact value. Use lo < hi when binary searching for a boundary (lo is the answer when the loop ends).',
    },
    {
      title: 'Left bound: not continuing search when target found',
      wrong: `if (arr[mid] === target) return mid; // returns any occurrence, not first`,
      right: `if (arr[mid] >= target) hi = mid - 1; // shrink right when match or overshoot
// after loop: lo is the first occurrence`,
      explanation: 'To find the leftmost occurrence, when you find the target, don\'t stop — set hi=mid-1 to keep searching left.',
    },
    {
      title: 'Rotated array: wrong condition for which half is sorted',
      wrong: `if (arr[mid] > arr[lo]) { ... } // edge case: lo===mid makes this unstable`,
      right: `if (arr[lo] <= arr[mid]) { // left half sorted (includes lo===mid case)`,
      explanation: 'Use <= (not <) to handle the case where lo and mid point to the same element.',
    },
    {
      title: 'Binary search on answer: wrong loop condition or return value',
      wrong: `while (lo <= hi) { if (valid(mid)) hi = mid; else lo = mid + 1; } // infinite loop`,
      right: `while (lo < hi) { // terminates when lo===hi===answer
  const mid = lo + Math.floor((hi - lo) / 2);
  if (valid(mid)) hi = mid; else lo = mid + 1;
}
return lo;`,
      explanation: 'For "find minimum valid", use lo < hi and set hi=mid (not mid-1) to avoid skipping the answer.',
    },
  ];

  challenge: Challenge = {
    title: 'Find Minimum in Rotated Sorted Array',
    language: 'typescript',
    description: 'Given a rotated sorted array with no duplicates, find the minimum element in O(log n).',
    hints: ['The minimum is the "inflection point" where rotation happened', 'Compare mid with hi to determine which half is out of order', 'The unsorted half contains the minimum'],
    starterCode: `function findMin(nums: number[]): number {
  // O(log n) — binary search for the rotation point
}`,
    solution: `function findMin(nums: number[]): number {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] > nums[hi]) lo = mid + 1; // right half is out of order — min is there
    else hi = mid; // mid could be the min, don't exclude it
  }
  return nums[lo];
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the safe mid calculation formula to avoid integer overflow?',
      options: ['(lo + hi) / 2', 'lo + (hi - lo) / 2', '(hi - lo) / 2', 'lo * hi / 2'],
      answer: 1,
      explanation: 'lo + (hi - lo) / 2 avoids potential overflow of lo + hi by keeping the computation in a safe range.',
    },
    {
      q: 'For "find the first occurrence" of a target, what do you do when arr[mid] === target?',
      options: ['Return mid immediately', 'Set lo = mid + 1', 'Set hi = mid - 1 to keep searching left', 'Set hi = mid'],
      answer: 2,
      explanation: 'Set hi = mid - 1 to continue searching for an earlier occurrence. The loop ends when lo > hi and lo holds the first occurrence.',
    },
    {
      q: 'In a rotated sorted array search, how do you determine which half is normally sorted?',
      options: ['Check if arr[mid] > arr[lo]', 'Check if arr[lo] <= arr[mid]', 'Always assume left half is sorted', 'Check if arr[mid] < arr[hi]'],
      answer: 1,
      explanation: 'arr[lo] <= arr[mid] means the left half is in sorted order (including the edge case where lo === mid).',
    },
  { q: 'How do you binary search for the leftmost element equal to target?', options: ['Standard binary search works', 'Move right boundary when equal (hi = mid), return lo', 'Move left boundary when equal (lo = mid + 1), return hi', 'Use linear scan after finding any match'], answer: 1, explanation: 'Leftmost: when nums[mid] == target, set hi = mid (do not stop). When nums[mid] < target, lo = mid + 1. Loop ends when lo == hi. This finds the first occurrence in O(log n).' },
  { q: 'What is binary search on the answer and when do you apply it?', options: ['Binary search on a sorted array only', 'Apply when: the answer is monotonic (larger capacity -> feasible) and checking feasibility is O(n)', 'Apply only to integer arrays', 'Apply when the array has no duplicates'], answer: 1, explanation: 'Binary search on the answer: instead of searching an array, search the answer space [lo, hi]. At each mid, check if mid is feasible in O(n). Example: Koko Eating Bananas, Minimum Capacity Ship. Works when feasibility is monotonic.' },
  { q: 'What is the time complexity of binary search in a 2D sorted matrix?', options: ['O(n * m)', 'O(log(n * m))', 'O(n + m)', 'O(n * log m)'], answer: 1, explanation: 'Treat the n*m matrix as a 1D sorted array of size n*m. Map index i to row=i/m, col=i%m. Binary search on the virtual 1D array: O(log(n*m)).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you apply binary search to a problem that doesn\'t give you a sorted array?',
      a: 'Binary search on the answer space. Identify the range of possible answers [lo, hi] and a monotone condition (valid/invalid boundary). Binary search within that range. Example: "minimum days to ship packages" — binary search on capacity, validate by simulating.',
    },
    {
      q: 'What is the difference between lower_bound and upper_bound?',
      a: 'lower_bound(target) returns the index of the first element >= target. upper_bound(target) returns the index of the first element > target. Count of target = upper_bound - lower_bound. These correspond to std::lower_bound/upper_bound in C++ STL.',
    },
    {
      q: 'When does binary search NOT work?',
      a: 'Binary search requires a monotone property — either a sorted array or a condition that flips exactly once from invalid to valid (or valid to invalid). It doesn\'t work on unsorted arrays, non-monotone functions, or when you can\'t efficiently evaluate the condition at a given midpoint.',
    },
  { q: 'How do you binary search in a rotated sorted array?', a: 'Key insight: one half of a rotated sorted array is always sorted. At each step: (1) Check if nums[lo] <= nums[mid] (left half sorted); (2) If target is in [nums[lo], nums[mid]], search left; else search right. Otherwise right half is sorted — apply symmetric logic. Handles duplicates with a lo++ fallback when nums[lo] == nums[mid] == nums[hi].' },
  { q: 'What are common off-by-one errors in binary search and how to avoid them?', a: 'Common errors: (1) Infinite loop when lo = hi - 1 and mid = lo but hi is never updated (fix: use lo = mid + 1 not lo = mid when searching right); (2) Wrong answer when loop condition is lo < hi vs lo <= hi (use lo < hi when lo == answer on exit; lo <= hi when returning inside the loop). Template: lo=0, hi=n-1, mid=lo+(hi-lo)/2, lo=mid+1 or hi=mid-1.' },
  { q: 'How do you find the peak element in an unsorted array in O(log n)?', a: 'A peak element is nums[i] > nums[i-1] and nums[i] > nums[i+1]. Binary search: if nums[mid] < nums[mid+1], the peak is to the right (set lo = mid + 1); otherwise the peak is at mid or left (set hi = mid). When lo == hi, that is the peak index. O(log n) because we always move toward a peak.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Binary search halves the search space each step — O(log n). Master three templates: exact search, left/right bound, and binary search on answer.',
    mustKnow: [
      'mid = lo + Math.floor((hi-lo)/2) — avoid overflow',
      'Exact search: lo <= hi, return -1 if not found',
      'Left bound: hi=mid-1 on match; return lo',
      'Search on answer: lo < hi, hi=mid on valid, return lo',
      'Rotated array: arr[lo]<=arr[mid] → left half sorted',
    ],
    interviewFocus: [
      'Search in rotated sorted array',
      'Binary search on answer (koko bananas, ship packages)',
      'Find first/last occurrence (left/right bound templates)',
    ],
  };
}
