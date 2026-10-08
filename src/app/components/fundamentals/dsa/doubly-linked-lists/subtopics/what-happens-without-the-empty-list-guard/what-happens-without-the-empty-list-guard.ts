import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-dll-empty-guard',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './what-happens-without-the-empty-list-guard.html',
  styleUrl: './what-happens-without-the-empty-list-guard.scss'
})
export class WhatHappensWithoutTheEmptyListGuardSubtopic {
  topicLabel = 'Doubly Linked Lists';
  topicRoute = '/dsa/doubly-linked-lists';

  theory: TheoryPoint[] = [
    {
      heading: 'Proving the Sentinel-Boundary Risk the Main Page Now Flags',
      points: [
        'The main page\'s own <code>removeLast()</code> correctly guards with <code>if (this.tail.prev === this.head) return null;</code> before removing anything -- but the main page never demonstrates what happens if that ONE line is forgotten. Removing it and calling the resulting <code>removeLastBuggy()</code> on an empty list was tested directly.',
        'The result is NOT a silent corruption -- it is an immediate crash. <code>this.tail.prev</code> on an empty list IS the sentinel head itself (since head and tail point directly at each other when empty). Calling <code>remove(head)</code> then tries to read <code>head.prev.next</code> -- and <code>head.prev</code> was NEVER set to anything (it defaults to null, since the head sentinel has no node before it), so this throws <code>TypeError: Cannot set properties of null</code> immediately.',
        'This confirms the main page\'s own corrected theory bullet precisely: sentinels eliminate null checks for everything STRICTLY BETWEEN head and tail, but <code>head.prev</code> and <code>tail.next</code> themselves are still genuine null pointers -- stepping one position too far past either sentinel (exactly what the missing guard allows) reaches that boundary and crashes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The crash, reproduced',
      language: 'typescript',
      code: `class DoublyLinkedList {
  head: DLLNode;
  tail: DLLNode;
  constructor() {
    this.head = new DLLNode(0, 0);
    this.tail = new DLLNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    // Note: this.head.prev and this.tail.next are left as their default null
  }
  remove(node: DLLNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }
  // The guard line from the main page's own removeLast() is DELETED here on purpose
  removeLastBuggy(): DLLNode | null {
    const last = this.tail.prev!;
    this.remove(last);
    return last;
  }
}

const list = new DoublyLinkedList(); // empty -- head and tail point directly at each other
list.removeLastBuggy();
// Actual measured output: TypeError: Cannot set properties of null (setting 'next')
//   at DoublyLinkedList.remove
//   -- because "last" here IS this.head, and this.head.prev is null`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The crash happens inside remove(), on the line "node.prev!.next = node.next". If you added a null check there instead of restoring the missing empty-list guard in removeLast(), would the LRU cache still behave correctly on an empty list?',
    hint: 'Think about what removeLastBuggy() is supposed to return in that case, and what the rest of the LRU cache\'s put() method does with that return value.',
    solution: 'No -- adding a null check inside remove() would stop the crash, but it would not fix the underlying bug. With a null check silently skipping the unlink, removeLastBuggy() would still return the SENTINEL HEAD NODE itself as if it were a real evicted entry. The caller (put()) would then try to do map.delete(evicted.key) using the sentinel\'s own placeholder key -- a no-op, since the sentinel was never in the map -- but worse, the sentinel head node itself may now be left in a half-unlinked state depending on exactly how the null check is written, corrupting the list for every future operation. The crash is actually the SAFER failure mode here: it fails loudly and immediately, rather than silently returning a fake "evicted" node and corrupting internal state. The correct fix is the original guard clause itself, which prevents removeLast() from ever being called on an empty list in the first place.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sentinel head and tail nodes guarantee that no part of a doubly linked list implementation can ever null-dereference.',
      reality: 'Verified directly: removeLastBuggy() on an empty list throws a real TypeError. Sentinels guarantee non-null prev/next ONLY for the region strictly between head and tail -- head.prev and tail.next are themselves still null by construction, and any code path that reaches past the sentinel boundary (exactly what the missing empty-list guard allows) hits that null.',
    },
    {
      thought: 'A crash is always a worse outcome than silently continuing, so the missing guard clause is strictly bad in every way.',
      reality: 'In this specific case, the crash is the SAFER of the two bad outcomes compared to the alternative of adding a null check deep inside remove() instead -- that alternative would let removeLastBuggy() silently return the sentinel head as a fake "evicted" node, corrupting the list state for every future call instead of failing immediately and visibly. The right fix is still the original guard, not either of these fallbacks.',
    },
  ];
}
