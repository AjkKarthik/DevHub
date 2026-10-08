import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-linked-list-binary-search',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './linked-list-binary-search.html',
  styleUrl: './linked-list-binary-search.scss'
})
export class LinkedListBinarySearchSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two Ways to Reach the Middle, Neither Faster Than a Scan',
      points: [
        'The main page said binary search on a linked list "degrades to O(n log n)". That is the cost of one specific implementation: walking from the head to every new midpoint. Measured with a step counter on a sorted list searching for the last value, it took 10,230 steps for n = 1,024 and 20,971,500 for n = 1,048,576 — exactly n log2 n both times.',
        'A more careful version keeps a reference to the node at <code>lo</code> and walks forward from there. Each walk covers half of the remaining range, so the walks add up to n/2 + n/4 + ... which is at most n. Measured: 1,023 steps for n = 1,024 and 1,048,575 for n = 1,048,576.',
        'A plain linear scan for the same value costs n - 1 steps. The careful binary search ties it and the naive one loses by a factor of log n. The comparisons drop to O(log n), but the pointer walking dominates, so there is no input where binary search on a singly linked list wins.',
        'This is why structures built for sorted search on linked nodes add extra pointers: a skip list or a balanced tree gives each node shortcuts so a step can cover many elements at once.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive vs careful pointer walking, with step counts',
      language: 'typescript',
      code: `interface ListNode { val: number; next: ListNode | null; }

// Naive: restart from the head for every midpoint -> O(n log n) steps
function searchNaive(head: ListNode, n: number, target: number): number {
  let lo = 0, hi = n - 1, steps = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    let node = head;
    for (let i = 0; i < mid; i++) { node = node.next!; steps++; }
    if (node.val === target) return steps;
    if (node.val < target) lo = mid + 1; else hi = mid - 1;
  }
  return steps;
}

// Careful: keep the node at lo and walk forward from it -> O(n) steps
function searchCareful(head: ListNode, n: number, target: number): number {
  let lo = 0, hi = n - 1, loNode: ListNode = head, steps = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    let node = loNode;
    for (let i = lo; i < mid; i++) { node = node.next!; steps++; }
    if (node.val === target) return steps;
    if (node.val < target) { lo = mid + 1; loNode = node.next!; steps++; }
    else hi = mid - 1;
  }
  return steps;
}

// Sorted list 0..n-1, searching for the last value (n - 1):
//   n          naive        careful     linear scan
//   1,024      10,230       1,023       1,023
//   65,536     1,048,560    65,535      65,535
//   1,048,576  20,971,500   1,048,575   1,048,575`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The careful version above keeps a reference to the node at <code>lo</code>. Suppose you also keep a reference to the node at <code>hi</code>. Could you walk backward from <code>hi</code> when the midpoint is closer to it, and would that beat a linear scan?',
    hint: 'Which direction can you move along a singly linked list?',
    solution: 'No. A singly linked list only has next pointers, so a node reference at hi cannot be used to move backward. Even in a doubly linked list, where you could walk from whichever end is nearer, the walks still sum to a constant fraction of n, so the total stays O(n) — the same order as a scan. Beating a scan needs pointers that skip many elements, such as the extra levels of a skip list.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Binary search on a linked list is O(n log n), so it is merely slower than on an array but still a reasonable choice for very large lists.',
      reality: 'O(n log n) is the cost of the naive version. The best version is O(n), which only matches a plain scan. Since a scan is simpler and never slower, binary search on a singly linked list is never the right choice.',
    },
    {
      thought: 'Because binary search only does O(log n) comparisons, it must save time whenever comparisons are expensive, such as comparing long strings.',
      reality: 'That part is true: with expensive comparisons, the careful version does O(n) cheap pointer steps but only O(log n) comparisons, while a scan does O(n) comparisons. It is the one case where it can pay off. For ordinary numeric keys, a pointer step and a comparison cost about the same, so there is no gain.',
    },
  ];
}
