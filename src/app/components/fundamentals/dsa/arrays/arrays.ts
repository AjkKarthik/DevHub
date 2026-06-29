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
  selector: 'app-dsa-arrays',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './arrays.html',
  styleUrl: './arrays.scss',
})
export class DsaArrays {
  quickRef: QuickRefItem[] = [
    { name: 'arr[i]',       type: 'syntax',  desc: 'O(1) random access by index' },
    { name: 'push/pop',     type: 'method',  desc: 'O(1) amortised append/remove from end' },
    { name: 'unshift/shift',type: 'method',  desc: 'O(n) insert/remove at front — shifts all elements' },
    { name: 'splice',       type: 'method',  desc: 'O(n) insert/remove at arbitrary index' },
    { name: 'Two Pointers', type: 'syntax',  desc: 'left + right converging — O(n) with O(1) space' },
    { name: 'Sliding Window',type: 'syntax', desc: 'Maintain a window of size k — O(n) instead of O(nk)' },
    { name: 'Prefix Sum',   type: 'syntax',  desc: 'precompute cumulative sums for O(1) range queries' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Array Fundamentals',
      points: [
        'Arrays store elements at contiguous memory addresses — O(1) index access via base + offset.',
        'Static arrays have fixed size. Dynamic arrays (ArrayList/JS Array) double capacity when full — O(1) amortised push.',
        'Insertion at end: O(1) amortised. Insertion at middle: O(n) — must shift elements right.',
        'Deletion at end: O(1). Deletion at middle: O(n) — must shift elements left.',
      ],
    },
    {
      heading: 'Two-Pointer Technique',
      points: [
        'Use two indices moving toward each other (or same direction) to avoid nested loops.',
        'Classic use: check if a sorted array has two numbers summing to a target — O(n) instead of O(n²).',
        'Fast/slow pointers detect cycles (Floyd\'s algorithm) or find the middle of a list.',
        'Prerequisite: the array is usually sorted or the problem has a monotonic property.',
      ],
    },
    {
      heading: 'Sliding Window',
      points: [
        'Maintains a contiguous subarray of variable or fixed size, sliding from left to right.',
        'Fixed window of size k: remove the leftmost element, add the rightmost — O(n) total.',
        'Variable window: expand right until condition is met, shrink left until condition breaks.',
        'Common for: maximum sum subarray of size k, longest substring without repeats.',
      ],
    },
    {
      heading: 'Prefix Sum Array',
      points: [
        'prefix[i] = arr[0] + arr[1] + ... + arr[i-1]. Build in O(n).',
        'Range sum query [l, r] = prefix[r+1] - prefix[l] in O(1).',
        'Avoids recomputing sums inside loops — critical for range query problems.',
        'Extend to 2D for submatrix sum queries.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two Pointers',
      language: 'typescript',
      code: `// Two sum II — sorted array
function twoSum(numbers: number[], target: number): [number, number] {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1]; // 1-indexed
    else if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}

// Remove duplicates from sorted array in-place
function removeDuplicates(nums: number[]): number {
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1; // new length
}`,
    },
    {
      label: 'Sliding Window',
      language: 'typescript',
      code: `// Fixed window — max sum of subarray of size k
function maxSumSubarray(arr: number[], k: number): number {
  let windowSum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // slide: add right, remove left
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}

// Variable window — longest substring without repeating chars
function lengthOfLongestSubstring(s: string): number {
  const seen = new Map<string, number>();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right])! >= left) {
      left = seen.get(s[right])! + 1;
    }
    seen.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

// Prefix sum
function rangeSum(arr: number[], l: number, r: number): number {
  const prefix = [0, ...arr.map((_, i) => arr.slice(0, i + 1).reduce((a, b) => a + b, 0))];
  return prefix[r + 1] - prefix[l];
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Off-by-one in sliding window',
      wrong: `for (let i = k; i < arr.length; i++) {
  windowSum += arr[i] - arr[i - k + 1]; // wrong offset
}`,
      right: `windowSum += arr[i] - arr[i - k]; // remove element that left the window`,
      explanation: 'The element leaving the window is at index i - k. Using i - k + 1 creates an overlap.',
    },
    {
      title: 'Mutating the array while iterating',
      wrong: `for (let i = 0; i < arr.length; i++) {
  arr.splice(i, 1); // shifts elements — skips next element
}`,
      right: `// Iterate backwards when removing during iteration
for (let i = arr.length - 1; i >= 0; i--) {
  if (condition) arr.splice(i, 1);
}`,
      explanation: 'splice() shifts all subsequent elements. Iterating backwards avoids skipping elements.',
    },
    {
      title: 'Using two pointers on an unsorted array without sorting first',
      wrong: `// Two sum on unsorted array with two pointers — gives wrong answers`,
      right: `arr.sort((a, b) => a - b); // sort first, then apply two pointers`,
      explanation: 'Two-pointer convergence only works if the array is sorted — the monotonic property allows pruning.',
    },
    {
      title: 'Prefix sum index confusion',
      wrong: `const prefix = new Array(n);
prefix[0] = arr[0]; // range sum formula breaks`,
      right: `const prefix = new Array(n + 1).fill(0);
for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + arr[i];
// rangeSum(l, r) = prefix[r+1] - prefix[l]`,
      explanation: 'A 1-indexed prefix sum array of size n+1 makes the range sum formula cleaner and bug-free.',
    },
    {
      title: 'Assuming push() is always O(1)',
      wrong: `// In worst case, dynamic array doubles → O(n) single push`,
      right: `// O(1) amortised — n pushes cost O(n) total, so O(1) per push on average`,
      explanation: 'push() is amortised O(1), not guaranteed O(1) for every call. Worst-case single push is O(n).',
    },
  ];

  challenge: Challenge = {
    title: 'Maximum Product Subarray',
    language: 'typescript',
    description: 'Given an integer array, find the subarray with the largest product and return the product.',
    hints: ['Track both max and min at each position (negatives can flip to max)', 'Reset when you hit a zero', 'O(n) time, O(1) space is optimal'],
    starterCode: `function maxProduct(nums: number[]): number {
  // Your solution here
}

// Test cases:
// maxProduct([2,3,-2,4]) → 6
// maxProduct([-2,0,-1]) → 0
// maxProduct([-2,3,-4]) → 24`,
    solution: `function maxProduct(nums: number[]): number {
  let maxProd = nums[0], minProd = nums[0], result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < 0) [maxProd, minProd] = [minProd, maxProd]; // swap on negative
    maxProd = Math.max(nums[i], maxProd * nums[i]);
    minProd = Math.min(nums[i], minProd * nums[i]);
    result = Math.max(result, maxProd);
  }
  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of inserting an element at index 0 of a dynamic array?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      answer: 2,
      explanation: 'Inserting at the front shifts all n existing elements one position right — O(n).',
    },
    {
      q: 'The sliding window technique replaces which naive approach?',
      options: ['Recursion', 'Nested loops', 'Binary search', 'Sorting'],
      answer: 1,
      explanation: 'Sliding window avoids nested loops (O(n²)) by reusing computation from the previous window — O(n).',
    },
    {
      q: 'What does a prefix sum array enable?',
      options: ['O(1) sort', 'O(log n) insert', 'O(1) range sum queries', 'O(n) search'],
      answer: 2,
      explanation: 'After O(n) build time, prefix[r+1] - prefix[l] gives the sum of any range in O(1).',
    },
  { q: 'Which technique is best for finding a subarray with a given sum in a non-negative array?', options: ['Two pointers from both ends', 'Sliding window with variable size', 'Binary search on prefix sums', 'Sort then scan'], answer: 1, explanation: 'Sliding window (expandright/contractleft): expand right pointer until sum exceeds target, then contract left. Works in O(n) for non-negative values because sum only increases when expanding and decreases when contracting.' },
  { q: 'What is the Dutch National Flag algorithm used for?', options: ['Sorting strings', 'Partitioning an array into three groups (e.g. 0s, 1s, 2s) in one pass', 'Finding duplicates', 'Rotating an array'], answer: 1, explanation: 'Dutch National Flag (Dijkstra): three-pointer partition (lo, mid, hi) in one pass O(n) O(1) space. Used in 3-way QuickSort and the Sort Colors problem (LeetCode 75).' },
  { q: 'What is the time complexity of rotating an array by k positions using the reversal algorithm?', options: ['O(k)', 'O(n)', 'O(n log n)', 'O(n * k)'], answer: 1, explanation: 'Reversal algorithm: reverse all, reverse first k, reverse remaining — three O(n) reversals = O(n) total. In-place O(1) space. Alternative: GCD-cycle approach is also O(n) O(1).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a sliding window vs two pointers?',
      a: 'Use sliding window for contiguous subarray/substring problems (max sum, longest without repeats). Use two pointers for problems involving pairs or partitioning (two sum, palindrome check, remove duplicates). Both are O(n) but the window maintains a range while two pointers compare endpoints.',
    },
    {
      q: 'How is dynamic array resizing amortised O(1)?',
      a: 'When the array fills up, it doubles its capacity and copies all elements — O(n) for that one push. But this doubling happens so rarely (after 1, 2, 4, 8, 16... pushes) that the total cost of n pushes is O(n), giving O(1) amortised per push.',
    },
    {
      q: 'When is an array a poor data structure choice?',
      a: 'When you need frequent insertions or deletions in the middle (use a linked list or deque), when you don\'t know the size upfront and resizing is expensive, or when you need O(1) lookup by key rather than index (use a hash map).',
    },
  { q: 'How does Kadane algorithm find the maximum subarray sum?', a: 'Kadane: at each index, decide whether to extend the current subarray or start fresh. Track curSum = max(curSum + nums[i], nums[i]) and globalMax = max(globalMax, curSum). O(n) time O(1) space. Key insight: if curSum becomes negative, starting a new subarray from the current element is always better.' },
  { q: 'When should you use two pointers vs a hash map for array problems?', a: 'Two pointers: use when the array is sorted (or can be sorted) and you need pairs/triplets summing to a target — O(n) after sort vs O(n^2) brute force. Hash map: use when the array is unsorted and you need O(1) lookups — Two Sum unsorted is O(n) with a hash map. If sorting is not allowed and you need pairs, hash map wins.' },
  { q: 'What is the purpose of a prefix sum array and what does it enable?', a: 'A prefix sum array prefix[i] = sum of elements 0..i-1 (with prefix[0]=0). After O(n) build: range sum query [l, r] = prefix[r+1] - prefix[l] in O(1). Enables: subarray sum queries, counting subarrays with target sum (hash map on prefix sums), and 2D range queries with a 2D prefix sum matrix.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Arrays give O(1) index access and amortised O(1) push — master two pointers, sliding window, and prefix sums for efficient linear solutions.',
    mustKnow: [
      'Random access O(1), front insert/delete O(n), back push/pop O(1) amortised',
      'Two-pointer: works on sorted arrays or monotonic problems',
      'Sliding window: fixed and variable window patterns',
      'Prefix sum: O(n) build → O(1) range sum queries',
      'Two sum is the canonical two-pointer/hash map problem — know both approaches',
    ],
    interviewFocus: [
      'Two sum (sorted → two pointers, unsorted → hash map)',
      'Subarray sum = k (prefix sum + hash map)',
      'Maximum subarray (Kadane\'s algorithm O(n))',
    ],
  };
}
