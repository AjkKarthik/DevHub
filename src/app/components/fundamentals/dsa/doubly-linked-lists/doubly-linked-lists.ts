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
  selector: 'app-dsa-doubly-linked-lists',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './doubly-linked-lists.html',
  styleUrl: './doubly-linked-lists.scss',
})
export class DsaDoublyLinkedLists {
  quickRef: QuickRefItem[] = [
    { name: 'DLL node',       type: 'syntax',  desc: 'val + prev pointer + next pointer' },
    { name: 'Insert after',   type: 'syntax',  desc: 'O(1) — update 4 pointers (prev/next of node and neighbors)' },
    { name: 'Delete node',    type: 'syntax',  desc: 'O(1) if you have the node — no traversal needed' },
    { name: 'LRU Cache',      type: 'syntax',  desc: 'Map + DLL: O(1) get and put via doubly linked structure' },
    { name: 'Sentinel nodes', type: 'syntax',  desc: 'Dummy head + tail eliminate boundary conditions' },
    { name: 'Traverse back',  type: 'syntax',  desc: 'DLL allows backward traversal via node.prev' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Doubly Linked List vs Singly',
      points: [
        'Each node has prev and next pointers — enables O(1) backward traversal.',
        'Delete a node in O(1) if you have a reference to it — no need to find its predecessor.',
        'Uses more memory than SLL: two pointers per node instead of one.',
        'Insertion before/after a given node is O(1) — update 4 pointers total.',
      ],
    },
    {
      heading: 'LRU Cache Pattern (Most Important Use)',
      points: [
        'LRU (Least Recently Used) evicts the least recently accessed item when capacity is exceeded.',
        'Combine a HashMap (key → node) with a DLL (ordered by recency) for O(1) get and put.',
        'On get: move the accessed node to the front of the DLL (most recent).',
        'On put: insert at front; if capacity exceeded, remove from tail (least recent).',
      ],
    },
    {
      heading: 'Sentinel (Dummy) Nodes',
      points: [
        'Use a dummy head and dummy tail to avoid null-checking at boundaries.',
        'head.next is always the most recently used; tail.prev is always the least recently used.',
        'Removes edge cases for empty list, insert at front, insert at back.',
        'This pattern appears in LRU cache, browser history, and undo/redo implementations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'DLL Node & Operations',
      language: 'typescript',
      code: `class DLLNode {
  key: number; val: number;
  prev: DLLNode | null = null;
  next: DLLNode | null = null;
  constructor(key: number, val: number) { this.key = key; this.val = val; }
}

class DoublyLinkedList {
  head: DLLNode; // sentinel head
  tail: DLLNode; // sentinel tail
  constructor() {
    this.head = new DLLNode(0, 0);
    this.tail = new DLLNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Insert node right after head (most recent position)
  insertFront(node: DLLNode): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  // Remove any node in O(1)
  remove(node: DLLNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  // Remove and return least-recent node (before tail)
  removeLast(): DLLNode | null {
    if (this.tail.prev === this.head) return null; // empty
    const last = this.tail.prev!;
    this.remove(last);
    return last;
  }
}`,
    },
    {
      label: 'LRU Cache',
      language: 'typescript',
      code: `class LRUCache {
  private capacity: number;
  private map: Map<number, DLLNode>;
  private list: DoublyLinkedList;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    this.list = new DoublyLinkedList();
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key)!;
    this.list.remove(node);
    this.list.insertFront(node); // move to most-recent
    return node.val;
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) this.list.remove(this.map.get(key)!);
    const node = new DLLNode(key, value);
    this.list.insertFront(node);
    this.map.set(key, node);
    if (this.map.size > this.capacity) {
      const evicted = this.list.removeLast()!;
      this.map.delete(evicted.key); // evict LRU
    }
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to update prev pointer when inserting',
      wrong: `newNode.next = curr.next;
curr.next = newNode;
// newNode.next.prev still points to curr — broken!`,
      right: `newNode.next = curr.next;
newNode.prev = curr;
curr.next!.prev = newNode;
curr.next = newNode;`,
      explanation: 'DLL insertions require updating 4 pointers: both next/prev of the new node AND the prev of the successor.',
    },
    {
      title: 'Not using sentinel nodes — null boundary checks everywhere',
      wrong: `if (node.next) node.next.prev = node.prev; // boundary check
if (node.prev) node.prev.next = node.next;`,
      right: `// With sentinel head/tail, node.prev and node.next are never null
node.prev!.next = node.next;
node.next!.prev = node.prev;`,
      explanation: 'Sentinel (dummy) head and tail nodes mean interior nodes always have non-null prev/next — cleaner code, fewer bugs.',
    },
    {
      title: 'LRU Cache: not removing node from old position before reinserting',
      wrong: `// On put() for existing key: just update the value
this.map.get(key)!.val = value; // position not updated`,
      right: `if (this.map.has(key)) this.list.remove(this.map.get(key)!);
const node = new DLLNode(key, value);
this.list.insertFront(node); // always insert fresh at front`,
      explanation: 'Getting or updating an existing key must move the node to the front to reflect recency.',
    },
    {
      title: 'Forgetting to delete from map when evicting LRU node',
      wrong: `const evicted = this.list.removeLast();
// map still holds the evicted key — memory leak and wrong results`,
      right: `const evicted = this.list.removeLast()!;
this.map.delete(evicted.key); // remove from both list AND map`,
      explanation: 'Both the DLL and the map must be kept in sync. Removing from the list without removing from the map causes stale cache hits.',
    },
    {
      title: 'Using singly linked list for LRU — O(n) delete',
      wrong: `// SLL: to remove a node, must traverse to find predecessor — O(n)`,
      right: `// DLL: remove any node with a reference to it in O(1) via prev pointer`,
      explanation: 'LRU cache requires O(1) delete-from-anywhere. That\'s only possible with a doubly linked list.',
    },
  ];

  challenge: Challenge = {
    title: 'LRU Cache',
    language: 'typescript',
    description: 'Implement an LRU Cache with O(1) get and put. get returns -1 if key doesn\'t exist. put evicts the least recently used when over capacity.',
    hints: ['Use a Map for O(1) key lookup', 'Use a doubly linked list to track recency', 'Keep a dummy head (most recent) and tail (least recent)'],
    starterCode: `class LRUCache {
  constructor(capacity: number) {}
  get(key: number): number { return -1; }
  put(key: number, value: number): void {}
}`,
    solution: `class LRUNode { key=0; val=0; prev: LRUNode|null=null; next: LRUNode|null=null; constructor(k:number,v:number){this.key=k;this.val=v;} }
class LRUCache {
  private cap: number; private map = new Map<number,LRUNode>();
  private head = new LRUNode(0,0); private tail = new LRUNode(0,0);
  constructor(capacity: number) { this.cap=capacity; this.head.next=this.tail; this.tail.prev=this.head; }
  private insert(n: LRUNode){n.next=this.head.next;n.prev=this.head;this.head.next!.prev=n;this.head.next=n;}
  private remove(n: LRUNode){n.prev!.next=n.next;n.next!.prev=n.prev;}
  get(key: number): number { if(!this.map.has(key))return -1; const n=this.map.get(key)!; this.remove(n); this.insert(n); return n.val; }
  put(key: number, value: number): void {
    if(this.map.has(key))this.remove(this.map.get(key)!);
    const n=new LRUNode(key,value); this.insert(n); this.map.set(key,n);
    if(this.map.size>this.cap){const l=this.tail.prev!;this.remove(l);this.map.delete(l.key);}
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why does LRU Cache use a doubly linked list instead of singly linked?',
      options: ['DLL uses less memory', 'DLL enables O(1) node deletion anywhere in the list', 'DLL is faster to traverse', 'DLL stores more data per node'],
      answer: 1,
      explanation: 'With a prev pointer, you can remove any node in O(1) without traversing to find its predecessor.',
    },
    {
      q: 'How many pointers are updated when inserting a node into a DLL?',
      options: ['1', '2', '4', '6'],
      answer: 2,
      explanation: 'New node\'s next and prev, plus the successor\'s prev and the predecessor\'s next — 4 pointer updates total.',
    },
    {
      q: 'What do sentinel (dummy) head and tail nodes eliminate?',
      options: ['The need for a map', 'Null boundary checks at list ends', 'The prev pointer', 'Memory allocation'],
      answer: 1,
      explanation: 'Sentinel nodes mean real nodes always have non-null prev/next — removes all if-null boundary conditions.',
    },
  { q: 'What advantage does a doubly linked list have over a singly linked list?', options: ['O(1) random access', 'O(1) deletion given a pointer to the node (no need to find predecessor)', 'Less memory usage', 'Faster search'], answer: 1, explanation: 'With a pointer to a node, deletion in a DLL is O(1) — use node.prev and node.next to unlink. In a singly linked list, deletion requires finding the predecessor, which takes O(n).' },
  { q: 'What data structure combines a doubly linked list with a hash map to achieve O(1) get and put?', options: ['Priority queue', 'LRU Cache', 'Deque', 'Skip list'], answer: 1, explanation: 'LRU Cache: doubly linked list maintains order (most recently used at head, LRU at tail); hash map provides O(1) key lookup to node. On access, move node to head. On eviction, remove tail. Both operations O(1).' },
  { q: 'How is a browser history (back/forward) typically implemented?', options: ['Two stacks', 'Doubly linked list with a current pointer', 'Circular buffer', 'Array with index'], answer: 1, explanation: 'Browser history: doubly linked list with current node pointer. Go back: move current to current.prev. Go forward: move to current.next. Visit new page: insert after current, truncate forward history. O(1) back/forward.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the time complexity of LRU Cache get and put?',
      a: 'Both are O(1). get: O(1) map lookup + O(1) DLL remove + O(1) DLL insert-front. put: O(1) map lookup + O(1) DLL remove-last + O(1) DLL insert-front. The HashMap and DLL together make all operations constant time.',
    },
    {
      q: 'Where are doubly linked lists used in real systems?',
      a: 'Browser history (forward/back navigation), OS process scheduling, text editor undo/redo, LRU/LFU caches, JavaScript\'s Map internally (for insertion-order iteration), and database buffer pool management.',
    },
  { q: 'How do you reverse a doubly linked list?', a: 'Swap next and prev pointers for every node, then swap head and tail. For each node: temp = node.next; node.next = node.prev; node.prev = temp; advance to temp. After the loop, what was tail is now head. O(n) time O(1) space. Contrast with singly linked list reversal where you only reassign next pointers.' },
  { q: 'What is a sentinel (dummy) node in a doubly linked list and why use it?', a: 'Sentinel nodes are dummy head and tail nodes that always exist (never removed). They eliminate edge cases: no need to check if head/tail is null during insert/delete. With sentinels: insert between sentinel_head and first real node is always valid; delete any node just requires updating its neighbors. Used in LRU Cache and many production DLL implementations.' },
  { q: 'How does a deque (double-ended queue) differ from a doubly linked list?', a: 'A deque is an abstract data type supporting O(1) push/pop at both ends. It can be implemented with a doubly linked list (perfect fit: O(1) insertions/deletions at both ends) or a circular array (better cache performance, O(1) amortized). The DLL-based deque has O(1) worst-case for all operations but worse cache behavior than array-based implementations.' },
  { q: 'When should you prefer a doubly linked list over an array-based list?', a: 'Prefer DLL when: (1) Frequent insertions/deletions in the middle with a node pointer (O(1) vs O(n) for arrays); (2) Implementing undo/redo, LRU cache, browser history; (3) No need for random access (DLL is O(n) to reach index k). Prefer arrays when: random access is needed (O(1)), or cache performance matters (contiguous memory). Java LinkedList is rarely the right choice — use ArrayDeque instead.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Doubly linked lists add a prev pointer for O(1) anywhere-deletion — the key data structure behind LRU cache and bidirectional traversal.',
    mustKnow: [
      '4 pointer updates for insert: new.next, new.prev, successor.prev, predecessor.next',
      'O(1) delete-anywhere requires the prev pointer — not possible with SLL',
      'Sentinel head/tail remove boundary null checks completely',
      'LRU = HashMap (O(1) lookup) + DLL (O(1) recency reorder)',
      'LRU evict: remove from tail.prev; insert to head.next',
    ],
    interviewFocus: [
      'LRU Cache (most common DLL interview question)',
      'Insert/delete operations on DLL',
      'When DLL is needed vs SLL',
    ],
  };
}
