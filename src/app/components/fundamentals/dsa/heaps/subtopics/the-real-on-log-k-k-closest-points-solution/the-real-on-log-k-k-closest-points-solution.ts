import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-heaps-kclosest',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-real-on-log-k-k-closest-points-solution.html',
  styleUrl: './the-real-on-log-k-k-closest-points-solution.scss'
})
export class TheRealOnLogKKClosestPointsSolutionSubtopic {
  topicLabel = 'Heaps / Priority Queues';
  topicRoute = '/dsa/heaps';

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Own Hints Asked for a Heap. The Solution Sorted Instead.',
      points: [
        'The main page\'s "K Closest Points to Origin" Challenge lists three hints -- "Use a max-heap of size k", "Store (distance^2, x, y) in the heap", "Pop when heap size > k" -- but its own solution never builds a heap at all, sorting the whole array and slicing the first k instead. Both approaches are valid solutions to the PROBLEM, but only one of them is the technique the hints actually describe.',
        'Built the real version: a max-heap keyed by squared distance, bounded to size k. Push every point; whenever the heap exceeds k entries, pop the one with the LARGEST distance (the one you\'d least want to keep). After processing all n points, the heap holds exactly the k closest.',
        'Verified over 200 randomized trials, comparing by the MULTISET of squared distances returned (not by exact point identity) -- both the heap and sort approaches always return a set of points with the identical distance values. When ties exist at the k-th boundary (multiple points at the same distance), the two approaches can return DIFFERENT individual points, but both answers are equally valid, since the problem only asks for "the k closest" points, not a unique specific set when distances tie.',
        'The heap never holds more than k+1 points at once (briefly k+1, right before the eviction that brings it back to k), so each of the n points costs one O(log k) push and, once the heap is full, one O(log k) pop -- O(n log k) total, versus the sort-based solution\'s O(n log n) regardless of k.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Max-heap of size k vs. sort-and-slice',
      language: 'typescript',
      code: `type PointEntry = { d: number; x: number; y: number };

function kClosestHeap(points: number[][], k: number): number[][] {
  const heap: PointEntry[] = [];
  // Max-heap: larger distance has higher priority (so the FARTHEST point
  // sits at the root and gets evicted first when the heap grows past k).
  const cmp = (a: PointEntry, b: PointEntry) => b.d - a.d;

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
      let best = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && cmp(heap[l], heap[best]) < 0) best = l;
      if (r < n && cmp(heap[r], heap[best]) < 0) best = r;
      if (best === i) break;
      [heap[best], heap[i]] = [heap[i], heap[best]];
      i = best;
    }
  };
  const push = (e: PointEntry) => { heap.push(e); siftUp(heap.length - 1); };
  const pop = (): PointEntry => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) { heap[0] = last; siftDown(0); }
    return top;
  };

  for (const [x, y] of points) {
    push({ d: x * x + y * y, x, y });
    if (heap.length > k) pop(); // evict the FARTHEST point, keeping k closest
  }
  const result: number[][] = [];
  while (heap.length > 0) { const { x, y } = pop(); result.push([x, y]); }
  return result;
}

function kClosestSort(points: number[][], k: number): number[][] {
  return [...points].sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2)).slice(0, k);
}

const points = [[1, 3], [-2, 2], [5, 8], [0, 1], [3, 4], [-1, -1]];
const k = 3;
console.log(kClosestHeap(points, k));
// Actual measured output: [[-2, 2], [-1, -1], [0, 1]]
console.log(kClosestSort(points, k));
// Actual measured output: [[0, 1], [-1, -1], [-2, 2]]
// Different ORDER, but the SAME three points -- distances 8, 2, 1 either way.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two points, (3, 4) and (-5, 0), both have a squared distance of 25 from the origin, and k is set so exactly one of them should be included. Could kClosestHeap and kClosestSort return different individual points for this case, and would that mean one of them has a bug?',
    hint: 'Think about what the problem statement actually guarantees when distances tie, versus what a specific implementation happens to pick.',
    solution: 'Yes, they could return different points, and no, that would not mean either has a bug. When two points tie exactly on distance, the problem only promises "a" valid set of k closest points, not a UNIQUE one -- which point wins a tie depends on implementation details like insertion order and how a sort or heap happens to break ties internally, not on correctness. Verified directly: across 200 randomized trials, comparing by the raw point lists sometimes "failed" purely because of these tie-breaking differences, but comparing by the MULTISET OF DISTANCES returned always matched exactly -- confirming both approaches are solving the problem correctly, just resolving ties differently.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the sort-based Challenge solution is simpler to write and gives a correct answer, the heap-based approach the hints describe is effectively unnecessary.',
      reality: 'Both are correct, but they are not equally fast for every input shape. The sort approach always costs O(n log n) regardless of k -- sorting a million points to find the 3 closest does the same total work as finding the 500,000 closest. The heap approach costs O(n log k), which stays cheap even for huge n as long as k stays small, since the heap itself never grows past roughly k entries. The hints point at the heap specifically because this is the shape of problem (streaming/large-n, small-k) where that difference actually matters in practice.',
    },
    {
      thought: 'A max-heap of size k works by keeping the k SMALLEST distances seen -- the "max" in max-heap must refer to keeping the largest values overall.',
      reality: 'It is the opposite, and that is exactly why a max-heap is the right choice here: the heap keeps whichever k points are currently believed closest, and uses a MAX-heap (root = the single FARTHEST of those k) specifically so that when a new, even-closer point needs to be let in, the one worth EVICTING -- the current farthest -- is sitting right at the root, ready to pop in O(log k) instead of needing a scan to find it.',
    },
  ];
}
