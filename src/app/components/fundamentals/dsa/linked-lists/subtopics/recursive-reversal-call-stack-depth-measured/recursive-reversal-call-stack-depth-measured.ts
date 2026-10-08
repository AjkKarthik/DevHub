import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-ll-recursive-reversal',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './recursive-reversal-call-stack-depth-measured.html',
  styleUrl: './recursive-reversal-call-stack-depth-measured.scss'
})
export class RecursiveReversalCallStackDepthMeasuredSubtopic {
  topicLabel = 'Linked Lists';
  topicRoute = '/dsa/linked-lists';

  theory: TheoryPoint[] = [
    {
      heading: 'Measuring the Stack, Not Just Stating It',
      points: [
        'The main page\'s own theory and quiz state that recursive reversal uses O(n) stack space "because each recursive call adds a stack frame" -- but no codeTab on the page ever writes a recursive reversal, so the claim is never demonstrated. Instrumented a real recursive <code>reverseRecursive</code> function with a module-level counter tracking the deepest call depth reached.',
        'Measured directly: reversing a 1,000-node list reached a maximum recursion depth of exactly <code>1,000</code> -- one stack frame per node, confirming the 1:1 relationship the theory asserts rather than just naming it. Doubling the list to 2,000 nodes doubled the measured depth to exactly <code>2,000</code>, confirming the relationship is linear, not merely "grows somehow."',
        'The iterative version from the main page\'s own codeTab needs only three local variables (<code>prev</code>, <code>curr</code>, <code>next</code>) regardless of list length -- its stack usage is a single, constant-size frame for the whole function call, which is the concrete, measurable difference between the O(1) extra space of the iterative version and the O(n) extra space of the recursive one.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Instrumented recursive reversal',
      language: 'typescript',
      code: `let maxDepth = 0;

function reverseRecursive(head: ListNode | null, depth = 1): ListNode | null {
  maxDepth = Math.max(maxDepth, depth);
  if (!head || !head.next) return head;
  const newHead = reverseRecursive(head.next, depth + 1);
  head.next.next = head;
  head.next = null;
  return newHead;
}

maxDepth = 0;
const result = reverseRecursive(fromArray(Array.from({ length: 1000 }, (_, i) => i)));
console.log(toArray(result).slice(0, 5));
// Actual measured output: [999, 998, 997, 996, 995]
console.log(maxDepth);
// Actual measured output: 1000 -- one stack frame per node

maxDepth = 0;
reverseRecursive(fromArray(Array.from({ length: 2000 }, (_, i) => i)));
console.log(maxDepth);
// Actual measured output: 2000 -- doubling the list doubles the measured depth`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If a recursive reversal call only ever has at most ONE pending recursive call active at a time (never two branches at once, unlike a binary tree traversal), why does its stack usage still count as O(n) rather than O(1)?',
    hint: 'Does a stack frame get removed (popped) the moment the NEXT recursive call starts, or only once that call eventually returns?',
    solution: 'A stack frame is popped only when its own function call RETURNS, not when it makes a nested call. reverseRecursive(head) calls reverseRecursive(head.next) and then still has work left to do AFTER that inner call returns (head.next.next = head; head.next = null;) -- so its own frame must stay on the stack, waiting, for the entire duration of the inner call. For a 1000-node list, this creates a chain of exactly 1000 waiting frames stacked on top of each other at the deepest point, all still alive simultaneously, which is exactly what was measured above. Having only one "active" branch at a time (as opposed to a tree\'s two) does not shrink this -- it is the DEPTH of the call chain that drives the space cost, not how many siblings exist at each level.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Recursive reversal is O(n) time and O(1) space, just like the iterative version, since it never allocates a new data structure.',
      reality: 'Measured directly: the recursion depth for a 1000-node list reached exactly 1000, and 2000 for a 2000-node list -- a precise 1:1 relationship between list length and stack frames alive at once. "No new data structure" is true, but the CALL STACK itself grows linearly with input size, which is exactly what O(n) SPACE means -- it does not have to be a data structure the programmer explicitly allocated.',
    },
    {
      thought: 'Stack depth only matters for recursive FUNCTIONS that branch into multiple recursive calls per level (like tree or graph traversals).',
      reality: 'Recursive reversal makes exactly ONE recursive call per level, never branching -- and still produces O(n) stack depth, confirmed by direct measurement. The driver of stack depth is how many frames remain alive SIMULTANEOUSLY at the deepest point, which depends on chain length, not branching factor.',
    },
  ];
}
