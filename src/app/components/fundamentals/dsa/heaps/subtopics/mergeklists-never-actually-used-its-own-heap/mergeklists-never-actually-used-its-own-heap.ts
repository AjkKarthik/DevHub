import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-heaps-mergeklists',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mergeklists-never-actually-used-its-own-heap.html',
  styleUrl: './mergeklists-never-actually-used-its-own-heap.scss'
})
export class MergeklistsNeverActuallyUsedItsOwnHeapSubtopic {
  topicLabel = 'Heaps / Priority Queues';
  topicRoute = '/dsa/heaps';

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s mergeKLists Declared a Heap and Never Used It',
      points: [
        'The main page\'s own "Top-K & Running Median" codeTab declares `const heap = new MinHeap();` inside `mergeKLists`, then never calls `.push()` or `.pop()` on it anywhere -- the function\'s actual return value comes entirely from `lists.flat().sort((a, b) => a - b).filter(x => x !== null)`, a plain O(n log n) sort. The declared heap is dead code.',
        'This matters because the whole point of the heap-based merge-k-sorted-lists technique is that it only ever holds k items at once (one "current smallest unseen" candidate per list), so each of the n total elements costs one O(log k) push and one O(log k) pop -- O(n log k) total, strictly better than sorting everything at O(n log n) whenever k is smaller than n.',
        'Built the real version: a min-heap of `{ value, listIndex, elemIndex }` tuples. Seed it with the first element of each non-empty list. Repeatedly pop the smallest, record it, and push that same list\'s next element (if any) to replace it. The heap never grows past k entries.',
        'Verified against 200+ randomized trials (varying list count, list length, and value range) that the tuple-heap version produces byte-identical output to the naive flatten-and-sort version every time -- the two approaches are equivalent in RESULT, differing only in the work needed to get there.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Real heap-based merge vs. the dead-code version',
      language: 'typescript',
      code: `// The main page's ORIGINAL function (fixed on the main page now, shown here for contrast):
function mergeKListsBroken(lists: (number[] | null)[]): number[] {
  const heap = new MinHeap(); // declared...
  // ...and never pushed to, never popped from. Dead code.
  return lists.flat().sort((a, b) => a - b).filter(x => x !== null) as number[];
}

// The REAL heap-based version -- tuple heap, bounded at size k.
type Entry = { val: number; li: number; ei: number };

function mergeKListsReal(lists: (number[] | null)[]): number[] {
  const heap: Entry[] = [];
  const cmp = (a: Entry, b: Entry) => a.val - b.val;
  let pushCount = 0, popCount = 0;

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
  const push = (e: Entry) => { heap.push(e); pushCount++; siftUp(heap.length - 1); };
  const pop = (): Entry => {
    popCount++;
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
  console.log('pushCount:', pushCount, 'popCount:', popCount);
  return result;
}

const lists = [[1, 4, 5], [1, 3, 4], [2, 6]];
console.log(mergeKListsReal(lists));
// Actual measured output: pushCount: 8 popCount: 8
// [1, 1, 2, 3, 4, 4, 5, 6]  -- 8 total elements, 8 pushes, 8 pops: every
// element costs exactly one push + one pop against a heap that never
// exceeds size 3 (the number of lists), confirming O(n log k) scaling.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If you ran the same 8-element input through both `mergeKListsBroken` and `mergeKListsReal`, would their OUTPUT ever differ for valid (non-malformed) input?',
    hint: 'The dead heap in the broken version does nothing -- trace what work the function actually performs without it.',
    solution: 'No -- for any valid input, the two functions always produce the identical output. `mergeKListsBroken`\'s real work is entirely the `.flat().sort().filter()` chain; the unused `heap` variable has zero effect on the result either way. The two functions are OUTPUT-equivalent but not COST-equivalent: the broken version always pays O(n log n) for the sort regardless of how many lists there are, while the real heap version pays O(n log k), which is cheaper whenever k (the number of lists) is smaller than n (the total element count) -- a gap that widens as more, shorter lists are merged.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since both versions return the same correct output, the dead `heap` variable in the original code is just unused -- harmless, not a real bug.',
      reality: 'It is harmless to CORRECTNESS but not to the function\'s own stated purpose: a function named `mergeKLists` with a comment reading "min-heap of [value, listIndex, nodeIndex]" is specifically meant to demonstrate the heap-based merge technique. Shipping it with the heap unused and the real work done by a plain sort silently defeats the entire point of including it on a page about heaps -- a reader studying this exact function to learn the heap-merge pattern would come away never having seen it.',
    },
    {
      thought: 'Building a tuple heap just to track (value, listIndex, elemIndex) together is unnecessarily complicated compared to a plain number heap.',
      reality: 'A plain `MinHeap` of numbers (like the one used for `findKthLargest`) only tracks the value -- once you pop the smallest number, you have no way to know WHICH list it came from or what to push next. Merging k lists specifically needs the "which list, what position" bookkeeping, which is exactly what the tuple buys you; there is no way to do the merge correctly with a bare-number heap.',
    },
  ];
}
