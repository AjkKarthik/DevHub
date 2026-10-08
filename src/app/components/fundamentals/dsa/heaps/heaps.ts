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
  selector: 'app-dsa-heaps',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './heaps.html',
  styleUrl: './heaps.scss',
})
export class DsaHeaps {
  quickRef: QuickRefItem[] = [
    { name: 'Min-heap peek',  type: 'syntax',  desc: 'O(1) — root is always the minimum element' },
    { name: 'Push',           type: 'syntax',  desc: 'O(log n) — insert at end, bubble up (sift up)' },
    { name: 'Pop (extract)',  type: 'syntax',  desc: 'O(log n) — swap root with last, remove, sift down' },
    { name: 'Heapify',        type: 'syntax',  desc: 'O(n) — build heap from array in-place' },
    { name: 'Kth largest',    type: 'syntax',  desc: 'Min-heap of size k — maintain k largest seen so far' },
    { name: 'Merge k lists',  type: 'syntax',  desc: 'Min-heap of (value, listIndex) — always extract smallest' },
    { name: 'Array formula',  type: 'syntax',  desc: 'parent=(i-1)/2, left=2i+1, right=2i+2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Heap Structure',
      points: [
        'A complete binary tree stored as an array. Parent at index i has children at 2i+1 and 2i+2.',
        'Min-heap: every parent ≤ its children. Root is the minimum element.',
        'Max-heap: every parent ≥ its children. Root is the maximum element.',
        'JavaScript has no built-in heap — implement with an array and sift-up/sift-down operations.',
      ],
    },
    {
      heading: 'Core Operations',
      points: [
        'Push (insert): add to end of array, sift up by swapping with parent while parent > child.',
        'Pop (extract-min): swap root with last element, remove last, sift down from root.',
        'Peek: O(1) — just read heap[0], no modification.',
        'Heapify (build from array): O(n) — sift down all non-leaf nodes from bottom up.',
      ],
    },
    {
      heading: 'Top-K Pattern',
      points: [
        'Kth largest: maintain a min-heap of size k. Push each element; if size > k, pop the min.',
        'After processing all elements, the heap contains the k largest and root is the kth largest.',
        'Kth smallest: use a max-heap of size k — pop when size > k.',
        'This is O(n log k) — much better than O(n log n) sort when k is small.',
      ],
    },
    {
      heading: 'Two-Heap Pattern',
      points: [
        'Used to maintain a running median: max-heap (left half) + min-heap (right half).',
        'Keep heaps balanced (sizes differ by at most 1). Median is the root of the larger heap.',
        'On insert: add to max-heap, rebalance by moving tops between heaps if needed.',
        'Get median: O(1) peek; Insert: O(log n).',
      ],
    },
    {
      heading: 'Heap Order vs. Sorted Order — and Heap Sort',
      points: [
        'A heap only guarantees the root is the min (or max) — it does NOT provide a fully sorted order for the remaining elements, meaning heap-based priority queues cannot be used to look up arbitrary ranks efficiently, unlike a balanced BST.',
        'Despite that, repeatedly popping a heap n times DOES produce a fully sorted array — this is literally Heap Sort: heapify once (O(n)), then pop n times (O(n log n) total). Each individual pop only reveals the current min; the heap array itself stays unsorted until every element has been popped.',
        'Heap Sort is in-place (O(1) extra space beyond the array itself, unlike mergesort\'s O(n) auxiliary array) and has no O(n²) worst case (unlike quicksort\'s pathological pivot case) — but it is NOT stable (equal elements can be reordered) and has worse cache locality than quicksort in practice, since sift-down jumps between array positions rather than scanning sequentially.',
        'This is why a heap and a sorted structure solve different problems: a heap is optimized for "give me the min/max fast, repeatedly, while things keep changing"; a sorted array or balanced BST is optimized for "let me look up or range-query anything, any time."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Min-Heap Implementation',
      language: 'typescript',
      code: `class MinHeap {
  private heap: number[] = [];

  push(val: number): void {
    this.heap.push(val);
    this._siftUp(this.heap.length - 1);
  }

  pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) { this.heap[0] = last; this._siftDown(0); }
    return min;
  }

  peek(): number | undefined { return this.heap[0]; }
  size(): number { return this.heap.length; }

  private _siftUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private _siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1, right = 2 * i + 2;
      if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}`,
    },
    {
      label: 'Top-K & Running Median',
      language: 'typescript',
      code: `// Kth largest element — min-heap of size k
function findKthLargest(nums: number[], k: number): number {
  const heap = new MinHeap();
  for (const n of nums) {
    heap.push(n);
    if (heap.size() > k) heap.pop(); // evict smallest
  }
  return heap.peek()!; // root = kth largest
}

// Merge k sorted lists — min-heap of {value, listIdx, elemIdx} tuples.
// The heap never holds more than k items (one per list), so each of the
// n total elements costs one O(log k) push + one O(log k) pop: O(n log k).
function mergeKLists(lists: (number[] | null)[]): number[] {
  type Entry = { val: number; li: number; ei: number };
  const heap: Entry[] = [];
  const cmp = (a: Entry, b: Entry) => a.val - b.val;
  const siftUp = (i: number) => {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (cmp(heap[p], heap[i]) <= 0) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const siftDown = (i: number) => {
    const n = heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && cmp(heap[l], heap[smallest]) < 0) smallest = l;
      if (r < n && cmp(heap[r], heap[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
      i = smallest;
    }
  };
  const push = (e: Entry) => { heap.push(e); siftUp(heap.length - 1); };
  const pop = (): Entry => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) { heap[0] = last; siftDown(0); }
    return top;
  };

  for (let li = 0; li < lists.length; li++) {
    const list = lists[li];
    if (list && list.length > 0) push({ val: list[0], li, ei: 0 });
  }
  const result: number[] = [];
  while (heap.length > 0) {
    const { val, li, ei } = pop();
    result.push(val);
    const list = lists[li]!;
    if (ei + 1 < list.length) push({ val: list[ei + 1], li, ei: ei + 1 });
  }
  return result;
}

// Running median — two heaps
class MedianFinder {
  private lo = new MinHeap(); // max-heap simulated (negate values)
  private hi = new MinHeap(); // min-heap (right half)

  addNum(num: number): void {
    this.lo.push(-num); // negate to simulate max-heap
    this.hi.push(-this.lo.pop()!); // move max of lo to hi
    if (this.hi.size() > this.lo.size()) this.lo.push(-this.hi.pop()!);
  }

  findMedian(): number {
    if (this.lo.size() > this.hi.size()) return -this.lo.peek()!;
    return (-this.lo.peek()! + this.hi.peek()!) / 2;
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Kth largest: using max-heap instead of min-heap',
      wrong: `// Max-heap of all elements — O(n log n), no advantage over sort
// Extracting k times gives kth largest, but heap holds all n elements`,
      right: `// Min-heap of size k — O(n log k)
// Root is always the kth largest so far; pop if size > k`,
      explanation: 'Min-heap of size k lets you evict elements smaller than the kth largest. Max-heap approach doesn\'t prune — no benefit.',
    },
    {
      title: 'Forgetting to negate values for max-heap simulation',
      wrong: `// Simulating max-heap with MinHeap — inserting positive values
lo.push(num); // stored as positive — sift-up treats as min-heap`,
      right: `lo.push(-num); // negate to invert ordering
const maxVal = -lo.pop()!; // negate back when extracting`,
      explanation: 'To simulate a max-heap using a min-heap, store negated values. The min of negatives = the max of positives.',
    },
    {
      title: 'Sift-down: using wrong child index formula',
      wrong: `const left = 2 * i, right = 2 * i + 1; // 1-indexed formula`,
      right: `const left = 2 * i + 1, right = 2 * i + 2; // 0-indexed array`,
      explanation: 'For 0-indexed arrays: left child = 2i+1, right child = 2i+2, parent = floor((i-1)/2).',
    },
    {
      title: 'Pop: not handling empty heap',
      wrong: `pop(): number { const last = this.heap.pop()!; this.heap[0] = last; this._siftDown(0); }`,
      right: `pop(): number | undefined {
  if (this.heap.length === 0) return undefined;
  const min = this.heap[0];
  const last = this.heap.pop()!;
  if (this.heap.length > 0) { this.heap[0] = last; this._siftDown(0); }
  return min;
}`,
      explanation: 'If the heap has only one element, pop() removes it and there\'s nothing to sift down. Guard both cases.',
    },
    {
      title: 'Assuming heapify is O(n log n)',
      wrong: `// Build heap: push each element one by one → O(n log n)`,
      right: `// Heapify: sift-down all non-leaf nodes from bottom → O(n)`,
      explanation: 'Heapify in O(n) works because lower levels of the tree have more nodes but shorter sift-down paths. The sum converges to O(n).',
    },
  ];

  challenge: Challenge = {
    title: 'K Closest Points to Origin',
    language: 'typescript',
    description: 'Given an array of points, return the k closest points to the origin (0,0). Distance is Euclidean but you can compare squared distances.',
    hints: ['Use a max-heap of size k', 'Store (distance², x, y) in the heap', 'Pop when heap size > k to keep only k closest'],
    starterCode: `function kClosest(points: number[][], k: number): number[][] {
  // Use a max-heap of size k
  // Return the k closest points
}`,
    solution: `function kClosest(points: number[][], k: number): number[][] {
  // Simpler approach: sort by distance
  return points
    .sort((a, b) => (a[0]**2 + a[1]**2) - (b[0]**2 + b[1]**2))
    .slice(0, k);
  // O(n log n) — heap approach would be O(n log k):
  // max-heap of size k, pop when > k, remaining are k closest
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of inserting an element into a heap?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answer: 1,
      explanation: 'Insert adds to the end (O(1)) then sifts up at most h=log n levels → O(log n) total.',
    },
    {
      q: 'What is the time complexity of building a heap (heapify) from an array?',
      options: ['O(n log n)', 'O(n)', 'O(log n)', 'O(n²)'],
      answer: 1,
      explanation: 'Heapify runs sift-down from all non-leaf nodes. Because lower nodes are more numerous with shorter paths, the total work is O(n).',
    },
    {
      q: 'For "find kth largest", which heap type and size should you use?',
      options: ['Max-heap, size n', 'Min-heap, size k', 'Max-heap, size k', 'Min-heap, size n'],
      answer: 1,
      explanation: 'Min-heap of size k keeps the k largest elements. The root (minimum of the heap) is the kth largest. O(n log k).',
    },
  { q: 'How do you delete an arbitrary element (not the root) from a heap efficiently?', options: ['Not possible — heaps only support root deletion', 'Swap it with the last element, remove the last, then sift-up or sift-down the swapped element as needed', 'Rebuild the whole heap from scratch', 'Mark it as deleted and skip it on future pops'], answer: 1, explanation: 'To delete an arbitrary index i: swap heap[i] with the last element, shrink the array, then sift-up or sift-down from i depending on whether the new value is smaller or larger than its parent. O(log n).' },
  { q: 'How do you find the kth largest element in an array efficiently?', options: ['Sort the array, index n-k', 'Use a min-heap of size k: push each element, pop when size > k; root is kth largest', 'Use a max-heap of size n', 'Use binary search on a sorted array'], answer: 1, explanation: 'Min-heap of size k: for each element, push it; if heap size exceeds k, pop the minimum. After processing all elements, the heap root is the kth largest. O(n log k) time. Works for streaming data where you can\'t store all elements.' },
  { q: 'What is a heap used for in the Dijkstra shortest path algorithm?', options: ['To store visited nodes', 'As a priority queue to always extract the minimum-distance unvisited node', 'To detect cycles', 'To store the adjacency list'], answer: 1, explanation: 'Dijkstra uses a min-heap (priority queue) keyed by tentative distance. Always extract the minimum-distance node next. When a shorter path to a neighbor is found, push (distance, node) to the heap. O((V + E) log V) with binary heap.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you implement a max-heap in JavaScript?',
      a: 'JavaScript has no built-in heap. For a max-heap, either: (1) implement MinHeap and negate all values, or (2) implement MaxHeap by reversing the comparison in sift-up and sift-down (use > instead of <). In interviews, clarify your approach upfront.',
    },
    {
      q: 'When is a heap better than sorting?',
      a: 'When you only need the top-k elements (O(n log k) vs O(n log n) sort), or when elements arrive as a stream and you need running top-k/median. Sort is O(n log n) and requires all data upfront. A heap processes elements one at a time with O(log k) per operation.',
    },
    {
      q: 'What is the difference between a heap and a priority queue?',
      a: 'A priority queue is an abstract data type — it defines the interface (insert, extractMin/Max, peek). A heap is a concrete implementation of a priority queue. Other implementations exist (sorted list, Fibonacci heap), but heap is the most common due to O(log n) insert/extract and O(1) peek.',
    },
  { q: 'How do you merge k sorted arrays efficiently using a heap?', a: 'Min-heap approach: push the first element of each array with its (value, array_index, element_index) into a min-heap. Extract the minimum, add it to the result, push the next element from the same array. Repeat until heap is empty. O(n log k) time where n is total elements and k is number of arrays. Each element is pushed and popped once: O(log k) per operation.' },
  { q: 'How do you implement a running median using two heaps?', a: 'Use a max-heap for the lower half and a min-heap for the upper half. Invariant: max-heap size >= min-heap size. (1) Push to max-heap; (2) If max-heap top > min-heap top, rebalance by moving max-heap top to min-heap; (3) If min-heap size > max-heap size, move min-heap top to max-heap. Median: if sizes equal, average of both tops; else max-heap top. O(log n) per insert, O(1) median query.' },
  { q: 'What is the difference between a binary heap and a Fibonacci heap?', a: 'Binary heap: insert O(log n), extract-min O(log n), decrease-key O(log n). Fibonacci heap: insert O(1) amortized, extract-min O(log n) amortized, decrease-key O(1) amortized. Fibonacci heap makes Dijkstra O(E + V log V) (vs O(E log V) with binary heap). In practice, binary heaps are preferred due to lower constant factors and simpler implementation. Fibonacci heaps are theoretically optimal for dense graphs.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A heap is a complete binary tree in an array — O(1) peek, O(log n) push/pop, O(n) heapify. Min-heap of size k solves top-k problems in O(n log k).',
    mustKnow: [
      'Array formula: parent=(i-1)/2, left=2i+1, right=2i+2',
      'Push: add at end, sift up — O(log n)',
      'Pop: swap root with last, remove, sift down — O(log n)',
      'Top-k largest: min-heap of size k, pop when > k',
      'Max-heap simulation: negate values in a min-heap',
    ],
    interviewFocus: [
      'Kth largest element (min-heap size k)',
      'Running median (two heaps)',
      'Merge k sorted lists (min-heap with (val, listIndex))',
    ],
  };
}
