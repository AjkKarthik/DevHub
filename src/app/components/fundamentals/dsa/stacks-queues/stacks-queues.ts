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
  selector: 'app-dsa-stacks-queues',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './stacks-queues.html',
  styleUrl: './stacks-queues.scss',
})
export class DsaStacksQueues {
  quickRef: QuickRefItem[] = [
    { name: 'Stack (LIFO)',        type: 'keyword', desc: 'push/pop from same end — O(1) both' },
    { name: 'Queue (FIFO)',        type: 'keyword', desc: 'enqueue at back, dequeue from front — O(1) with deque' },
    { name: 'Monotonic Stack',     type: 'syntax',  desc: 'Maintain increasing/decreasing order — next greater element' },
    { name: 'Deque',               type: 'keyword', desc: 'Double-ended queue — O(1) push/pop at both ends' },
    { name: 'Min Stack',           type: 'syntax',  desc: 'Stack with O(1) getMin — store (value, currentMin) pairs' },
    { name: 'BFS uses queue',      type: 'syntax',  desc: 'Level-order traversal, shortest path (unweighted)' },
    { name: 'DFS uses stack',      type: 'syntax',  desc: 'Iterative DFS via explicit stack or recursion call stack' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Stack — LIFO',
      points: [
        'Last-In-First-Out: push adds to top, pop removes from top. Both O(1) with array or linked list.',
        'Use cases: function call stack, undo/redo, balanced parentheses, DFS, expression evaluation.',
        'JavaScript array: push() adds to end (top), pop() removes from end — natural stack behaviour.',
        'Check empty before pop — popping an empty stack is undefined behaviour.',
      ],
    },
    {
      heading: 'Queue — FIFO',
      points: [
        'First-In-First-Out: enqueue at back, dequeue from front. Array shift() is O(n) — use index pointer or deque.',
        'Implement with a head index: increment head on dequeue instead of calling shift().',
        'BFS relies on queue to process nodes level by level — guarantees shortest path in unweighted graphs.',
        'Priority Queue (heap): dequeue returns the minimum/maximum element, not necessarily the oldest.',
      ],
    },
    {
      heading: 'Monotonic Stack',
      points: [
        'Maintains a stack whose elements are always in monotonically increasing or decreasing order.',
        'Next Greater Element: for each element, pop all stack elements that are smaller — they found their answer.',
        'Used for: daily temperatures, largest rectangle in histogram, trapping rain water.',
        'Key insight: each element is pushed and popped at most once → O(n) total.',
      ],
    },
    {
      heading: 'Deque (Double-Ended Queue)',
      points: [
        'Supports O(1) push/pop at both front and back.',
        'Sliding window maximum: maintain a deque of indices in decreasing order; remove stale indices from front.',
        'In JavaScript, arrays lack O(1) front operations — simulate with index pointers or use a linked-list-backed deque.',
        'Used in BFS when priority is needed at both ends (e.g. 0-1 BFS).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Stack Patterns',
      language: 'typescript',
      code: `// Valid parentheses — classic stack problem
function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}

// Min Stack — O(1) getMin
class MinStack {
  private stack: [number, number][] = []; // [value, currentMin]
  push(val: number): void {
    const min = this.stack.length ? Math.min(val, this.stack.at(-1)![1]) : val;
    this.stack.push([val, min]);
  }
  pop(): void { this.stack.pop(); }
  top(): number { return this.stack.at(-1)![0]; }
  getMin(): number { return this.stack.at(-1)![1]; }
}

// Monotonic stack — daily temperatures (next warmer day)
function dailyTemperatures(temps: number[]): number[] {
  const result = new Array(temps.length).fill(0);
  const stack: number[] = []; // indices
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack.at(-1)!]) {
      const idx = stack.pop()!;
      result[idx] = i - idx;
    }
    stack.push(i);
  }
  return result;
}`,
    },
    {
      label: 'Queue & Deque',
      language: 'typescript',
      code: `// BFS level-order traversal
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue: TreeNode[] = [root];
  while (queue.length) {
    const level: number[] = [];
    const size = queue.length; // snapshot current level size
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}

// Sliding window maximum — deque O(n)
function maxSlidingWindow(nums: number[], k: number): number[] {
  const deque: number[] = []; // indices, front is always the max
  const result: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] < i - k + 1) deque.shift(); // stale
    while (deque.length && nums[deque.at(-1)!] < nums[i]) deque.pop(); // smaller
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}

declare class TreeNode { val: number; left: TreeNode | null; right: TreeNode | null; }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using array.shift() for queue dequeue — O(n)',
      wrong: `const queue: number[] = [];
queue.push(x);   // enqueue
queue.shift();   // dequeue — O(n)! shifts all elements`,
      right: `// Use index pointer or proper deque
let head = 0;
const queue: number[] = [];
queue.push(x);
const front = queue[head++]; // O(1) dequeue`,
      explanation: 'Array.shift() is O(n) because it shifts all remaining elements. Use an index pointer for O(1) dequeue.',
    },
    {
      title: 'Not snapshotting queue size in BFS level processing',
      wrong: `while (queue.length) {
  const node = queue.shift();
  // Adding children during iteration inflates the loop`,
      right: `const size = queue.length; // snapshot before adding children
for (let i = 0; i < size; i++) { ... }`,
      explanation: 'Snapshot the queue size before adding children — otherwise children are processed in the same "level".',
    },
    {
      title: 'Forgetting that stack.pop() mutates the stack',
      wrong: `const top = stack.pop();  // removes the element
// Now stack doesn't have top anymore`,
      right: `const top = stack.at(-1); // peek without removing
// pop() only when you want to remove`,
      explanation: 'Use stack.at(-1) (or stack[stack.length-1]) to peek without removing.',
    },
    {
      title: 'Monotonic stack direction confusion',
      wrong: `// For "next greater element" — maintaining decreasing stack
while (stack.length && stack.at(-1) > current) stack.pop();`,
      right: `// Pop elements SMALLER than current (they found their next greater)
while (stack.length && nums[stack.at(-1)!] < current) {
  result[stack.pop()!] = current;
}`,
      explanation: 'For next greater element, pop elements that are smaller than the current — they\'ve found their answer.',
    },
    {
      title: 'Using a stack when BFS order is required',
      wrong: `// DFS (stack) for shortest path — gives wrong distances`,
      right: `// BFS (queue) guarantees shortest path in unweighted graphs`,
      explanation: 'DFS visits nodes in depth-first order, not level order. BFS guarantees the shortest path because it explores all nodes at distance d before d+1.',
    },
  ];

  challenge: Challenge = {
    title: 'Largest Rectangle in Histogram',
    language: 'typescript',
    description: 'Given an array of bar heights, find the area of the largest rectangle that can be formed within the histogram.',
    hints: ['Use a monotonic increasing stack', 'When a shorter bar is found, pop and calculate rectangle area', 'The width extends from current index to the new top of stack'],
    starterCode: `function largestRectangleArea(heights: number[]): number {
  // Your solution here — aim for O(n) with monotonic stack
}

// largestRectangleArea([2,1,5,6,2,3]) → 10
// largestRectangleArea([2,4]) → 4`,
    solution: `function largestRectangleArea(heights: number[]): number {
  const stack: number[] = []; // indices
  let maxArea = 0;
  const h = [...heights, 0]; // sentinel 0 forces remaining bars to be processed
  for (let i = 0; i < h.length; i++) {
    while (stack.length && h[stack.at(-1)!] > h[i]) {
      const height = h[stack.pop()!];
      const width = stack.length ? i - stack.at(-1)! - 1 : i;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }
  return maxArea;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which data structure guarantees shortest path in an unweighted graph?',
      options: ['Stack (DFS)', 'Queue (BFS)', 'Priority Queue', 'Deque'],
      answer: 1,
      explanation: 'BFS explores nodes level by level — the first time a node is reached is via the shortest path.',
    },
    {
      q: 'A monotonic stack processes each element how many times?',
      options: ['O(n) times each', 'At most twice (push + pop)', 'Once — push only', 'Depends on input'],
      answer: 1,
      explanation: 'Each element is pushed once and popped at most once — total O(n) operations, making monotonic stack problems O(n).',
    },
    {
      q: 'What is the time complexity of queue dequeue using a head-pointer array approach?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      answer: 2,
      explanation: 'Incrementing the head pointer is O(1) — no element shifting required.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you implement a queue using two stacks?',
      a: 'Use two stacks: inbox and outbox. Push to inbox. On dequeue, if outbox is empty, pop all from inbox to outbox (reversing order), then pop from outbox. Amortised O(1) per operation — each element moves at most twice.',
    },
    {
      q: 'What is the difference between a stack and a deque?',
      a: 'A stack only allows push/pop at one end (LIFO). A deque (double-ended queue) allows O(1) push/pop at both ends. A deque can implement both stack and queue behaviour. The sliding window maximum problem needs a deque because you remove from both ends.',
    },
    {
      q: 'When should I choose iterative DFS (explicit stack) over recursive DFS?',
      a: 'Use iterative DFS when the input is large enough to risk stack overflow (deep trees, large graphs). Recursion uses the call stack, which is limited (~10k–100k frames). Iterative DFS gives you explicit control over the stack size.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Stack (LIFO) powers DFS and expression problems; queue (FIFO) powers BFS and level-order; monotonic stack solves next-greater-element problems in O(n).',
    mustKnow: [
      'Stack: push/pop O(1) — use for parentheses, DFS, expression eval',
      'Queue: enqueue/dequeue O(1) — use for BFS, level order',
      'Array.shift() is O(n) — use head pointer or deque for efficient queue',
      'Monotonic stack: each element pushed/popped once → O(n) total',
      'Min stack: store (value, currentMin) pairs for O(1) getMin',
    ],
    interviewFocus: [
      'Valid parentheses (stack)',
      'Daily temperatures / next greater element (monotonic stack)',
      'BFS level-order / shortest path (queue)',
    ],
  };
}
