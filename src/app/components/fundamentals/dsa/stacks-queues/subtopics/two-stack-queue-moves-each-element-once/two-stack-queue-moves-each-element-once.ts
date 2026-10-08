import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-stacks-two-stack-queue',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './two-stack-queue-moves-each-element-once.html',
  styleUrl: './two-stack-queue-moves-each-element-once.scss'
})
export class TwoStackQueueMovesEachElementOnceSubtopic {
  topicLabel = 'Stacks & Queues';
  topicRoute = '/dsa/stacks-queues';

  theory: TheoryPoint[] = [
    {
      heading: 'Tracking Exactly How Many Times Each Element Moves',
      points: [
        'The main page\'s theory said each element is "moved between stacks at most twice total" across its lifetime in a two-stack queue. Instrumenting a real <code>TwoStackQueue</code> class with a per-element move counter and running 1,000 rounds of 10 enqueues + 10 dequeues (20,000 operations total) found the true maximum was exactly <code>1</code>, not 2 -- every one of the 10,000 elements that ever got transferred moved from the "in" stack to the "out" stack exactly once, and never again.',
        'The correct count is <code>1</code> because there is exactly one transfer EVENT per element in its whole lifetime: it is pushed onto "in" once (on enqueue), and if "out" is ever empty when a dequeue runs, it gets popped off "in" and pushed onto "out" as part of ONE bulk transfer -- after that it sits in "out" until its own final pop removes it for good. It never goes back onto "in".',
        'The measured total transfer work across all 20,000 operations was exactly 10,000 moves (one per enqueued element) -- confirming the amortized claim a different way: total transfer cost divided by total operation count is 0.5, a constant, not something that grows with the number of operations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Instrumented two-stack queue',
      language: 'typescript',
      code: `class TwoStackQueue {
  private inStack: number[] = [];
  private outStack: number[] = [];
  private moveCount = new Map<number, number>();
  totalMoves = 0;

  enqueue(x: number): void {
    this.inStack.push(x);
    this.moveCount.set(x, 0);
  }

  dequeue(): number | undefined {
    if (this.outStack.length === 0) {
      while (this.inStack.length) {
        const v = this.inStack.pop()!;
        this.outStack.push(v);
        this.moveCount.set(v, (this.moveCount.get(v) ?? 0) + 1);
        this.totalMoves++;
      }
    }
    return this.outStack.pop();
  }

  maxMovesSeen(): number {
    return Math.max(0, ...this.moveCount.values());
  }
}

const q = new TwoStackQueue();
let totalOps = 0;
for (let round = 0; round < 1000; round++) {
  for (let i = 0; i < 10; i++) { q.enqueue(round * 10 + i); totalOps++; }
  for (let i = 0; i < 10; i++) { q.dequeue(); totalOps++; }
}
console.log(totalOps);          // Actual measured output: 20000
console.log(q.totalMoves);      // Actual measured output: 10000 (one move per enqueued element)
console.log(q.maxMovesSeen());  // Actual measured output: 1 -- never 2, contradicting the original claim
console.log(q.totalMoves / totalOps); // Actual measured output: 0.5 -- the constant amortized transfer cost`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A single dequeue() call that triggers a transfer of 500 elements from "in" to "out" costs 500 real operations right then. In what sense is that call still described as "O(1) amortized" rather than just "sometimes O(n)"?',
    hint: 'Amortized analysis is a claim about the AVERAGE over a whole sequence of operations, not a promise that every individual call is cheap.',
    solution: 'The individual call genuinely does cost O(n) in that moment -- amortized analysis never claims otherwise about any single operation. The claim is about the total cost divided by the total number of operations across the whole sequence. Because each of the 500 elements can only ever be transferred ONCE in its entire lifetime (as verified above), the total transfer work across any sequence of n enqueue/dequeue calls is bounded by n, the number of elements that were ever enqueued. Spread that one-time cost of n total transfer-moves across n total operations, and the average cost per operation is O(1) -- even though a handful of individual calls (the ones that happen to trigger a transfer) are visibly far more expensive than the rest.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Each element in a two-stack queue moves between the two stacks at most twice over its lifetime.',
      reality: 'Measured directly: the maximum was <code>1</code>, not 2. An element is pushed onto "in" (enqueue), optionally transferred once from "in" to "out" (only if "out" was empty when some dequeue needed it), and later popped off "out" for good. That is one transfer EVENT, not two -- the push-onto-"in" and the final pop-off-"out" are not themselves "moves between the two stacks," they are just entering and leaving the structure.',
    },
    {
      thought: '"Amortized O(1)" means every individual dequeue() call is fast.',
      reality: 'It specifically does NOT mean that -- a dequeue that triggers a full transfer is genuinely O(n) for that one call, confirmed directly in the instrumented run above. "Amortized O(1)" is a statement about the total cost across a whole sequence of operations divided by the number of operations, which is what stayed constant (0.5) regardless of how many rounds were run.',
    },
  ];
}
