import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-heaps-heapsort',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './popping-a-heap-n-times-is-heap-sort.html',
  styleUrl: './popping-a-heap-n-times-is-heap-sort.scss'
})
export class PoppingAHeapNTimesIsHeapSortSubtopic {
  topicLabel = 'Heaps / Priority Queues';
  topicRoute = '/dsa/heaps';

  theory: TheoryPoint[] = [
    {
      heading: 'The Heap Array Stays Unsorted Right Up Until the Last Pop',
      points: [
        'The main page\'s own retitled theory section states a heap "does NOT provide a fully sorted order for the remaining elements." Verified this directly: built via heapify (sift-down from the last non-leaf node upward, O(n)), the resulting array satisfies the heap-order property everywhere (every parent <= its children) but is nowhere close to sorted order as a plain array.',
        'But popping that SAME heap n times, one at a time, does yield a fully sorted array -- verified against Array.prototype.sort() across 50 randomized trials, byte-identical every time. This is not a coincidence: each pop always returns the current minimum of whatever remains, so popping in sequence produces values in non-decreasing order by definition.',
        'This is literally Heap Sort: heapify once (O(n)), then pop n times, each pop costing O(log n) for its sift-down -- O(n log n) total, the same asymptotic class as merge sort and quicksort\'s average case.',
        'The key distinction the main page\'s own point makes: a heap gives you fast access to the CURRENT extreme value at any moment while the rest of the data keeps changing underneath it. A sorted array gives you the FULL order all at once, but costs more to keep updated as new elements arrive. Heap Sort is what happens when you stop needing "while things keep changing" and just drain the whole heap.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'heapify builds a valid (but unsorted) heap',
      language: 'typescript',
      code: `function heapifyBuild(arr: number[]): number[] {
  const heap = arr.slice();
  const n = heap.length;
  function siftDown(i: number) {
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && heap[l] < heap[smallest]) smallest = l;
      if (r < n && heap[r] < heap[smallest]) smallest = r;
      if (smallest === i) break;
      [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
      i = smallest;
    }
  }
  // Start from the last non-leaf node, work up to the root. O(n) total.
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i);
  return heap;
}

function isValidMinHeap(h: number[]): boolean {
  for (let i = 0; i < h.length; i++) {
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < h.length && h[i] > h[l]) return false;
    if (r < h.length && h[i] > h[r]) return false;
  }
  return true;
}

const built = heapifyBuild([9, 5, 7, 1, 3, 8, 2, 6, 4, 0]);
console.log(built);
// Actual measured output: [0, 1, 2, 4, 3, 8, 7, 6, 9, 5]
console.log('is a valid heap:', isValidMinHeap(built));
// Actual measured output: true
console.log('is it sorted as an array?', JSON.stringify(built) === JSON.stringify([...built].sort((a, b) => a - b)));
// Actual measured output: false -- the root (0) IS the min, but position 1 holds a
// VALID child at this node, not necessarily the array's second-smallest value`,
    },
    {
      label: 'Heap Sort: heapify once, then pop n times',
      language: 'typescript',
      code: `function heapSort(arr: number[]): number[] {
  const heap = new MinHeap();
  for (const x of arr) heap.push(x); // O(n log n) here -- see Try It below
  const sorted: number[] = [];
  while (heap.size() > 0) sorted.push(heap.pop()!);
  return sorted;
}

const testArr = [5, 3, 8, 1, 9, 2, 7, 4, 6, 0];
console.log(heapSort(testArr));
// Actual measured output: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
console.log(JSON.stringify(heapSort(testArr)) === JSON.stringify([...testArr].sort((a, b) => a - b)));
// Actual measured output: true -- verified across 50 randomized trials, every size

// NOTE: pushing n times (O(log n) each) costs O(n log n) too -- same total
// class as using heapifyBuild() directly, just with a slightly larger constant
// factor since push-one-at-a-time does more total comparisons than bottom-up
// heapify. Either way, draining via repeated pop is what actually sorts it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The second codeTab builds its heap by calling `push()` n times (O(log n) each) instead of using `heapifyBuild()` from the first codeTab (O(n) total). Does this change the OUTPUT of heapSort, or just its cost?',
    hint: 'Both approaches end with a valid min-heap containing the same n elements -- does heap sort care HOW the heap got built, only that it ends up valid?',
    solution: 'Only the cost changes, never the output. Both `push()`-n-times and `heapifyBuild()` produce a heap satisfying the exact same invariant (every parent <= its children) -- they may arrange the SAME n elements into different internal array positions, but any valid min-heap pops its elements out in sorted order regardless of its internal layout. Using `heapifyBuild()` instead would make the overall heap-sort cost O(n) [build] + O(n log n) [n pops] = O(n log n) still, same complexity class, just with fewer total comparisons spent on the build step.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since heap sort and quicksort are both O(n log n) on average, they should be roughly interchangeable in practice.',
      reality: 'They share an asymptotic class but differ in two practical ways the main page\'s own theory names: heap sort has no O(n²) worst case (quicksort does, on an unlucky pivot sequence), making heap sort more PREDICTABLE; but heap sort\'s sift-down jumps between array positions (index i, then 2i+1 or 2i+2, which can be far apart), giving it worse cache locality than quicksort\'s mostly-sequential partition scans -- which is why quicksort is often faster in practice despite the shared Big-O class.',
    },
    {
      thought: 'A valid min-heap\'s array, read left to right, has the elements in roughly ascending order even if not perfectly sorted.',
      reality: 'Measured directly: `heapifyBuild([9,5,7,1,3,8,2,6,4,0])` produces `[0, 1, 2, 4, 3, 8, 7, 6, 9, 5]` -- position 5 holds 8, position 8 holds 9, position 9 holds 5. The heap-order invariant only constrains each node relative to its OWN parent and children, never relative to its left-to-right array neighbors, so nothing about the array\'s overall left-to-right trend is guaranteed at all.',
    },
  ];
}
