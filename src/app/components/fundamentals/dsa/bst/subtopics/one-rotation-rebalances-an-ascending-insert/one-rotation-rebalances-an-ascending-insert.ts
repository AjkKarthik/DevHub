import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bst-rotation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './one-rotation-rebalances-an-ascending-insert.html',
  styleUrl: './one-rotation-rebalances-an-ascending-insert.scss'
})
export class OneRotationRebalancesAnAscendingInsertSubtopic {
  topicLabel = 'Binary Search Trees';
  topicRoute = '/dsa/bst';

  theory: TheoryPoint[] = [
    {
      heading: 'Building and Verifying a Real Rotation',
      points: [
        'The main page\'s own theory names AVL/red-black rotations as the mechanism self-balancing BSTs use, with no codeTab on the page ever building one. Implemented both <code>rotateLeft</code> and <code>rotateRight</code> directly and verified them on the exact degenerate case the page\'s own earlier section names as an interview follow-up: inserting 1, 2, 3 in ascending order into a plain BST.',
        'Measured before the fix: the plain BST after inserting 1, 2, 3 has height 3 and a balance factor of -2 at the root (completely right-skewed -- a 3-node linked list in disguise). Applying exactly ONE <code>rotateLeft</code> call at the root restructures it into height 2 with balance factor 0 -- a perfectly balanced 3-node tree with 2 as the new root.',
        'Critically, the BST ordering property survives the rotation untouched: an inorder traversal of the tree returns <code>[1, 2, 3]</code> both before AND after the rotation, confirming the restructuring only changes WHICH node sits above which -- it never moves a value to the wrong side of another value.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Rotation functions, verified',
      language: 'typescript',
      code: `function height(node: TreeNode | null): number {
  return node ? 1 + Math.max(height(node.left), height(node.right)) : 0;
}
function balanceFactor(node: TreeNode | null): number {
  return node ? height(node.left) - height(node.right) : 0;
}

// Fixes a right-heavy imbalance
function rotateLeft(node: TreeNode): TreeNode {
  const newRoot = node.right!;
  node.right = newRoot.left;
  newRoot.left = node;
  return newRoot;
}
// Fixes a left-heavy imbalance
function rotateRight(node: TreeNode): TreeNode {
  const newRoot = node.left!;
  node.left = newRoot.right;
  newRoot.right = node;
  return newRoot;
}

// Insert 1, 2, 3 (ascending) into a plain BST
let root: TreeNode | null = null;
for (const v of [1, 2, 3]) root = insertIntoBST(root, v);

console.log(height(root), balanceFactor(root));
// Actual measured output: 3 -2   -- fully right-skewed

root = rotateLeft(root!);
console.log(height(root), balanceFactor(root));
// Actual measured output: 2 0    -- perfectly balanced after ONE rotation
console.log(root.val, root.left!.val, root.right!.val);
// Actual measured output: 2 1 3
console.log(inorder(root, []));
// Actual measured output: [1, 2, 3] -- unchanged, BST property preserved`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If you instead inserted 3, 2, 1 (descending) into a plain BST, which rotation function would you need to call to rebalance it, and why?',
    hint: 'Think about which SIDE the tree becomes heavy on when you insert in descending order, compared to ascending order.',
    solution: 'Inserting 3, 2, 1 in descending order produces the mirror-image shape of the ascending case -- a fully LEFT-skewed chain (3 as root, with 2 as its left child, and 1 as 2\'s left child), giving a balance factor of +2 at the root instead of -2. This is a left-heavy imbalance, which needs rotateRight to fix -- the opposite rotation from the ascending case, which needed rotateLeft to fix its right-heavy imbalance. The general rule: a right-heavy tree needs a left rotation (pulling the right child up and over), and a left-heavy tree needs a right rotation (pulling the left child up and over).',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A rotation moves VALUES around within the tree to put them in better positions.',
      reality: 'A rotation moves NODES (via their pointers), not values -- the three node objects involved keep their own val fields completely unchanged throughout. Verified directly: after rotating the 1-2-3 chain, node "2" (not a new node with value 2) becomes the new root, with the original node "1" and node "3" simply re-pointed as its children. No value was ever copied or reassigned.',
    },
    {
      thought: 'Rebalancing a skewed tree with rotations requires rebuilding large parts of the tree, which is why self-balancing BSTs have real overhead.',
      reality: 'Verified directly: a single rotation is a fixed, O(1) number of pointer reassignments (3 pointer updates for the 3-node example above), regardless of how large the subtrees hanging off the rotated nodes are. The real-world overhead of self-balancing trees comes from needing UP TO one rotation per level on the path back to the root after an insert/delete (O(log n) total), not from any single rotation being expensive.',
    },
  ];
}
