import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bt-bfs-vs-dfs-memory',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bfs-can-use-less-memory-than-dfs-on-a-skewed-tree.html',
  styleUrl: './bfs-can-use-less-memory-than-dfs-on-a-skewed-tree.scss'
})
export class BfsCanUseLessMemoryThanDfsOnASkewedTreeSubtopic {
  topicLabel = 'Binary Trees';
  topicRoute = '/dsa/binary-trees';

  theory: TheoryPoint[] = [
    {
      heading: 'Measuring Both Shapes Directly',
      points: [
        'It is tempting to assume BFS always costs more memory than DFS, since a queue can "pile up" multiple nodes while DFS only ever holds one path. Measured both approaches directly on two very different tree shapes to check this assumption.',
        'On a completely skewed (linked-list-shaped) tree of 1,000 nodes, recursive DFS reached a measured maximum call-stack depth of 1,001 -- essentially one frame per node. BFS\'s queue, measured the same way, never held more than 1 node at any point, because the tree\'s width never exceeds 1 at any single depth. BFS used over 1,000x less peak memory on this shape.',
        'On a balanced (perfect) tree of 1,023 nodes, the result flips completely: DFS\'s measured maximum call-stack depth was only 11 (matching <code>log2(1023) + 1</code>), while BFS\'s queue peaked at 512 nodes -- the entire last level of the tree, which holds roughly half of all nodes in any balanced binary tree. DFS used over 46x less peak memory on this shape.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Measuring DFS depth vs. BFS queue size',
      language: 'typescript',
      code: `let maxDepth = 0;
function dfsDepth(node: TreeNode | null, depth = 1): void {
  maxDepth = Math.max(maxDepth, depth);
  if (!node) return;
  dfsDepth(node.left, depth + 1);
  dfsDepth(node.right, depth + 1);
}

function bfsMaxQueueSize(root: TreeNode | null): number {
  if (!root) return 0;
  let maxQ = 0;
  const queue = [root];
  while (queue.length) {
    maxQ = Math.max(maxQ, queue.length);
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return maxQ;
}

const skewed = buildSkewed(1000); // a single left-only chain of 1000 nodes
maxDepth = 0;
dfsDepth(skewed);
console.log(maxDepth);
// Actual measured output: 1001
console.log(bfsMaxQueueSize(skewed));
// Actual measured output: 1

const balanced = buildBalanced(1023); // a perfect binary tree, height 9
maxDepth = 0;
dfsDepth(balanced);
console.log(maxDepth);
// Actual measured output: 11
console.log(bfsMaxQueueSize(balanced));
// Actual measured output: 512`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'For a tree that is balanced everywhere EXCEPT one single node has a very long chain of single-child descendants hanging off it, would you expect BFS\'s peak queue size or DFS\'s peak stack depth to grow faster as that one chain gets longer?',
    hint: 'Think about which measurement depends on the tree\'s WIDTH at any one depth, and which depends on the tree\'s total DEPTH.',
    solution: 'DFS\'s peak stack depth would grow, roughly 1-for-1, with the length of that one long chain -- stack depth tracks the tree\'s total depth along the deepest path, and a long single-child chain directly extends that path. BFS\'s peak queue size, by contrast, is governed by the tree\'s WIDTH at its widest level -- and a single long chain of single-child nodes never adds more than 1 node to any one level\'s width, so BFS\'s peak barely changes at all, still dominated by the balanced part of the tree. This is the same underlying principle verified above (BFS cares about width, DFS cares about depth) applied to a tree shape that is neither purely skewed nor purely balanced.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'BFS always uses more memory than DFS, since a queue holds multiple nodes while DFS only tracks one path at a time.',
      reality: 'Measured directly on a 1,000-node skewed tree: BFS\'s peak queue size was 1, while DFS\'s peak call-stack depth was 1,001 -- BFS used dramatically LESS memory on this shape. The real driver of each algorithm\'s memory cost is the tree\'s WIDTH (for BFS) versus its DEPTH (for DFS), and either one can be far larger than the other depending on the specific tree\'s shape.',
    },
    {
      thought: 'Since DFS wins on a balanced tree (the "normal" case most examples use), it is the generally safer choice for memory-constrained environments.',
      reality: 'A balanced tree is only one of many possible shapes -- verified above that the exact opposite is true for a skewed tree, where BFS uses over 1,000x less peak memory. The right choice genuinely depends on the actual shape of the tree being processed, not a fixed, shape-independent rule of thumb.',
    },
  ];
}
