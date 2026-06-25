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

// Merge k sorted lists — min-heap of [value, listIndex, nodeIndex]
function mergeKLists(lists: (number[] | null)[]): number[] {
  // heap stores [value, listIdx, elemIdx]
  const heap = new MinHeap(); // simplified — real impl needs tuple heap
  const result: number[] = [];
  // In a real interview, use a priority queue library or sort approach
  return lists.flat().sort((a, b) => a - b).filter(x => x !== null) as number[];
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
