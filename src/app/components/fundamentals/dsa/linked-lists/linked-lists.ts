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
  selector: 'app-dsa-linked-lists',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './linked-lists.html',
  styleUrl: './linked-lists.scss',
})
export class DsaLinkedLists {
  quickRef: QuickRefItem[] = [
    { name: 'Insert at head',    type: 'syntax',  desc: 'O(1) — point new node to current head' },
    { name: 'Insert at tail',    type: 'syntax',  desc: 'O(n) without tail pointer, O(1) with tail pointer' },
    { name: 'Delete by value',   type: 'syntax',  desc: 'O(n) — traverse to find node, relink predecessor' },
    { name: 'Reverse',           type: 'syntax',  desc: 'O(n) iterative — prev, curr, next pointers' },
    { name: 'Floyd\'s cycle',   type: 'syntax',  desc: 'Slow/fast pointers — detect cycle in O(n) O(1) space' },
    { name: 'Middle node',       type: 'syntax',  desc: 'Slow/fast pointers — fast moves 2x, slow lands at middle' },
    { name: 'Merge two sorted',  type: 'syntax',  desc: 'O(n+m) — compare heads, advance the smaller pointer' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Linked List Structure',
      points: [
        'Each node has a value and a next pointer. The last node\'s next is null.',
        'No random access — must traverse from head: O(n) to reach index i.',
        'O(1) insert/delete at head (unlike arrays which are O(n) at front).',
        'No wasted space from pre-allocated capacity — nodes are allocated individually.',
      ],
    },
    {
      heading: 'Slow and Fast Pointer (Floyd\'s Algorithm)',
      points: [
        'Slow moves 1 step per iteration; fast moves 2 steps.',
        'If a cycle exists, fast eventually laps slow and they meet inside the cycle.',
        'To find cycle start: reset slow to head, both move 1 step until they meet.',
        'To find middle: when fast reaches end, slow is at the middle.',
      ],
    },
    {
      heading: 'Reversal',
      points: [
        'Iterative reversal: maintain prev, curr, next pointers. Redirect curr.next = prev each step.',
        'After reversal, the old tail becomes the new head.',
        'Recursive reversal is elegant but uses O(n) stack space — prefer iterative for large lists.',
        'Partial reversal (e.g. reverse k-groups) is common in advanced problems.',
      ],
    },
    {
      heading: 'Common Patterns',
      points: [
        'Dummy head node eliminates edge cases for head deletion and insertion.',
        'Two pointers k apart: advance first pointer k steps, then advance both until first reaches end.',
        'Merge sorted lists: compare heads iteratively, link the smaller node.',
        'Palindrome check: find middle, reverse second half, compare both halves.',
      ],
    },
    {
      heading: 'In-Place Algorithms Can Have Hidden Side Effects',
      points: [
        'The page\'s own Palindrome Challenge solution below finds O(1) extra space by reversing the SECOND HALF of the list in-place, comparing it against the first half, and returning — without ever reversing it back. Verified directly: calling the solution on <code>[1,2,3,2,1]</code> and then traversing from the ORIGINAL head afterward returns <code>[1,2,3,2]</code> — one node shorter, and permanently restructured.',
        'The mechanism: the middle node\'s own next pointer (call it <code>slow.next</code>) is never touched directly, but the node it originally pointed to has its OWN next pointer overwritten to null as the very first step of the reversal — severing the link to the rest of the original tail, which only remains reachable through the separate, never-reconnected <code>prev</code> pointer the reversal returns.',
        'Fixing this costs exactly one more O(n) pass: after comparing, reverse the (already-reversed) second half AGAIN and reconnect it to the middle node — this restores the original structure byte-for-byte while keeping the overall time at O(n) and the extra space at O(1).',
        'This is a general lesson, not specific to palindrome checking: ANY in-place linked-list subroutine (reversal, splitting) used inside a larger function that is expected to leave its input unchanged needs this same "mutate now, restore later" discipline — worth stating explicitly in an interview, since it is easy to produce a working answer that silently corrupts the caller\'s data structure.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Core Operations',
      language: 'typescript',
      code: `class ListNode {
  val: number;
  next: ListNode | null = null;
  constructor(val: number) { this.val = val; }
}

// Reverse a linked list — O(n) O(1)
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

// Find middle — slow/fast pointers
function middleNode(head: ListNode): ListNode {
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next!;
    fast = fast.next.next;
  }
  return slow; // middle (or left-middle for even length)
}

// Merge two sorted lists — O(n+m)
function mergeTwoLists(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
    else { curr.next = l2; l2 = l2.next; }
    curr = curr.next;
  }
  curr.next = l1 ?? l2;
  return dummy.next;
}`,
    },
    {
      label: 'Cycle & Remove Nth',
      language: 'typescript',
      code: `// Detect cycle — Floyd's algorithm O(n) O(1)
function hasCycle(head: ListNode | null): boolean {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

// Find cycle start
function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      slow = head; // reset slow to head
      while (slow !== fast) { slow = slow!.next; fast = fast!.next; }
      return slow; // cycle start
    }
  }
  return null;
}

// Remove nth node from end — one pass with two pointers
function removeNthFromEnd(head: ListNode, n: number): ListNode | null {
  const dummy = new ListNode(0);
  dummy.next = head;
  let fast: ListNode | null = dummy;
  let slow: ListNode | null = dummy;
  for (let i = 0; i <= n; i++) fast = fast!.next; // advance fast n+1 steps
  while (fast) { slow = slow!.next; fast = fast.next; }
  slow!.next = slow!.next!.next; // skip the nth node
  return dummy.next;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Losing the next pointer before reassignment',
      wrong: `curr.next = prev; // lost next — can't advance
curr = curr.next; // now points to prev, not forward`,
      right: `const next = curr.next; // save first
curr.next = prev;
prev = curr;
curr = next; // advance correctly`,
      explanation: 'Always save curr.next before redirecting curr.next = prev, or you lose the rest of the list.',
    },
    {
      title: 'Not using a dummy head node for edge cases',
      wrong: `// Deleting the head requires special-case logic
if (head.val === target) return head.next;`,
      right: `const dummy = new ListNode(0);
dummy.next = head;
let curr = dummy;
// Now all deletions are uniform — no special head case`,
      explanation: 'A dummy head eliminates special cases for head deletion or insertion, making the code cleaner.',
    },
    {
      title: 'Off-by-one in "remove nth from end"',
      wrong: `for (let i = 0; i < n; i++) fast = fast.next; // n steps`,
      right: `for (let i = 0; i <= n; i++) fast = fast.next; // n+1 steps`,
      explanation: 'Advancing fast n+1 steps (not n) ensures slow lands on the predecessor of the node to remove.',
    },
    {
      title: 'Null pointer when checking fast.next.next in slow/fast',
      wrong: `while (fast.next.next) { fast = fast.next.next; }`,
      right: `while (fast && fast.next) { fast = fast.next.next; }`,
      explanation: 'Always guard both fast and fast.next before accessing fast.next.next to avoid null dereference.',
    },
    {
      title: 'Assuming linked list has O(1) index access',
      wrong: `// Linked list: access element at index 5 → O(1)`,
      right: `// Linked list: must traverse from head → O(n) to reach index i`,
      explanation: 'Unlike arrays, linked lists have no index mapping to memory address. Traversal is always O(n).',
    },
    {
      title: 'Not restoring list state after an in-place subroutine',
      wrong: `// isPalindrome reverses the second half and never reverses it back
// Verified: calling it on [1,2,3,2,1] then traversing from head
// afterward returns [1,2,3,2] — the list is now permanently shorter`,
      right: `// After comparing, reverse the second half AGAIN and reconnect it
slow.next = reverse(reversedSecondHalf);
// One extra O(n) pass restores the original list exactly`,
      explanation: 'An in-place reversal used as a subroutine inside a function that should leave its input unchanged needs an explicit restore step — otherwise the caller\'s list is silently corrupted, even though the function only ever read its "head" parameter.',
    },
  ];

  challenge: Challenge = {
    title: 'Palindrome Linked List',
    language: 'typescript',
    description: 'Return true if the linked list is a palindrome. Do it in O(n) time and O(1) space.',
    hints: ['Find the middle using slow/fast pointers', 'Reverse the second half in-place', 'Compare first half with reversed second half'],
    starterCode: `function isPalindrome(head: ListNode | null): boolean {
  // O(n) time, O(1) space solution
}`,
    solution: `function isPalindrome(head: ListNode | null): boolean {
  if (!head || !head.next) return true;
  // 1. Find middle
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; }
  // 2. Reverse second half
  let prev: ListNode | null = null, curr: ListNode | null = slow.next;
  while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
  // 3. Compare
  let left: ListNode | null = head, right: ListNode | null = prev;
  while (right) { if (left!.val !== right.val) return false; left = left!.next; right = right.next; }
  return true;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of inserting a node at the head of a singly linked list?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      answer: 2,
      explanation: 'Insert at head: set new.next = head, then head = new. No traversal needed — O(1).',
    },
    {
      q: 'Floyd\'s cycle detection uses which pointer arrangement?',
      options: ['Two pointers, both moving 1 step', 'One pointer 1 step, one pointer 2 steps', 'Two pointers k positions apart', 'Pointer starts from tail'],
      answer: 1,
      explanation: 'Slow moves 1 step, fast moves 2 steps. If a cycle exists, fast will eventually catch slow inside the cycle.',
    },
    {
      q: 'Why is a dummy head node useful in linked list problems?',
      options: ['It speeds up traversal', 'It eliminates special cases for head insertion/deletion', 'It enables O(1) tail access', 'It stores the list length'],
      answer: 1,
      explanation: 'A dummy head means the "real" head is always dummy.next, so head deletion is just a regular middle-node deletion.',
    },
  { q: 'You reverse a linked list recursively instead of iteratively. What changes, complexity-wise?', options: ['Nothing — both are O(n) time and O(1) space', 'Time becomes O(n²)', 'Space becomes O(n) due to the call stack, even though time stays O(n)', 'Recursive reversal is not possible on singly linked lists'], answer: 2, explanation: 'Recursive reversal still visits each node once (O(n) time), but each recursive call adds a stack frame that isn\'t popped until the base case returns — so the call stack holds all n frames simultaneously, making space O(n) instead of the O(1) an iterative three-pointer reversal achieves. This is a common oversight: candidates state "O(n) time, O(1) space" for recursive reversal out of habit, without accounting for the stack.' },
  { q: 'What is the technique for reversing a singly linked list in-place?', options: ['Create a new list in reverse order', 'Three-pointer iteration: prev, curr, next — redirect curr.next to prev at each step', 'Recursion with O(n) space', 'Sort the list by position'], answer: 1, explanation: 'Three-pointer reverse: prev=null, curr=head. While curr: next=curr.next; curr.next=prev; prev=curr; curr=next. After loop, prev is the new head. O(n) time O(1) space. New head is the last node of original list.' },
  { q: 'How do you find the middle of a linked list in one pass?', options: ['Count nodes then traverse again', 'Slow and fast pointers: fast moves 2 steps, slow 1 step; when fast reaches end, slow is at middle', 'Store all nodes in an array', 'Use a stack'], answer: 1, explanation: 'Slow/fast pointer (Floyd): slow at head, fast at head. While fast and fast.next exist: slow = slow.next, fast = fast.next.next. When fast reaches end, slow is at the middle. O(n) time O(1) space.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a linked list instead of an array?',
      a: 'Use a linked list when you need frequent O(1) insertions/deletions at the head (e.g. implementing a stack), or when you\'re implementing data structures like LRU cache. Arrays are better for random access, better cache performance, and most general-purpose use cases.',
    },
    {
      q: 'How does Floyd\'s algorithm find the start of a cycle?',
      a: 'After slow and fast meet inside the cycle, reset slow to head. Advance both one step at a time — they will meet exactly at the cycle\'s start node. This works due to the mathematical relationship between the distances: distance from head to cycle start equals distance from meeting point to cycle start.',
    },
    {
      q: 'Can you reverse a linked list recursively?',
      a: 'Yes: base case is head == null or head.next == null. Recursively reverse from head.next, then set head.next.next = head and head.next = null. But recursive reversal uses O(n) stack space — prefer iterative for large lists.',
    },
  { q: 'How do you merge two sorted linked lists?', a: 'Iterative approach: use a dummy head to simplify edge cases. Compare l1.val and l2.val; append the smaller to the result; advance that pointer. When one list is exhausted, append the remaining other list. O(n + m) time O(1) space. Recursive: merge(l1, l2) = if l1.val < l2.val: l1.next = merge(l1.next, l2), return l1; else l2.next = merge(l1, l2.next), return l2. O(n+m) time O(n+m) stack space.' },
  { q: 'How do you find the nth node from the end of a linked list in one pass?', a: 'Two-pointer technique: advance fast pointer n steps ahead; then move both slow and fast one step at a time until fast reaches the end. Slow pointer is now at the nth-from-end node. O(n) time O(1) space. For deletion of nth from end: use a dummy head and find the (n+1)th from end to remove the next node.' },
  { q: 'How do you check if a linked list is a palindrome?', a: '(1) Find the middle (slow/fast pointers); (2) Reverse the second half in-place; (3) Compare the first and second halves node by node; (4) Restore the list (reverse second half again) if needed. O(n) time O(1) space. Alternative: push first half to a stack, compare with second half — O(n) time O(n) space.' },
  { q: 'Does using a dummy head node change the time or space complexity of an algorithm?', a: 'No — this is a common misconception. A dummy head is a single extra node (O(1) space) that exists purely to eliminate special-case branching for head insertion/deletion. It does not change the asymptotic time complexity of any operation; its entire value is code simplicity, not performance.' },
  { q: 'If you have a pointer to a node in the middle of a singly linked list (not the head), can you delete it in O(1)?', a: 'Only with a trick, and only if it is not the last node: copy the NEXT node\'s value into the current node, then delete the next node instead (curr.val = curr.next.val; curr.next = curr.next.next). You cannot truly delete the given node itself in O(1) on a singly linked list, since that requires knowing the PREVIOUS node\'s reference to relink around it — this trick works around that by relabeling instead of truly removing the target node.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Singly linked lists give O(1) head insertion/deletion at the cost of O(n) traversal — master slow/fast pointers, reversal, and the dummy-head pattern.',
    mustKnow: [
      'Insert at head O(1), insert at tail O(n) without tail pointer',
      'Iterative reversal: save next, redirect, advance prev/curr',
      'Slow/fast pointers: cycle detection, middle node, nth from end',
      'Dummy head eliminates edge cases for head deletion',
      'Merge two sorted lists: compare heads, link smaller, advance pointer',
    ],
    interviewFocus: [
      'Reverse linked list (iterative — O(n) O(1))',
      'Detect and find cycle start (Floyd\'s)',
      'Palindrome check (find middle, reverse half, compare)',
    ],
  };
}
