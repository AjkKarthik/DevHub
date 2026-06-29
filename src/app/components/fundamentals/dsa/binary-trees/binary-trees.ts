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
  selector: 'app-dsa-binary-trees',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './binary-trees.html',
  styleUrl: './binary-trees.scss',
})
export class DsaBinaryTrees {
  quickRef: QuickRefItem[] = [
    { name: 'Inorder',    type: 'syntax',  desc: 'Left → Root → Right — gives sorted order for BST' },
    { name: 'Preorder',   type: 'syntax',  desc: 'Root → Left → Right — used for tree copying/serialization' },
    { name: 'Postorder',  type: 'syntax',  desc: 'Left → Right → Root — used for deletion, height calculation' },
    { name: 'BFS/Level',  type: 'syntax',  desc: 'Queue-based — processes nodes level by level' },
    { name: 'Height',     type: 'syntax',  desc: '1 + max(height(left), height(right)); base: null → -1' },
    { name: 'Diameter',   type: 'syntax',  desc: 'Max (left height + right height + 2) across all nodes' },
    { name: 'Path sum',   type: 'syntax',  desc: 'DFS subtracting target; return true at leaf when remaining = 0' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Binary Tree Basics',
      points: [
        'Each node has at most 2 children: left and right.',
        'Height: length of longest path from root to a leaf. A null node has height -1; a leaf has height 0.',
        'Complete binary tree: all levels filled except possibly last (left-filled). Used in heaps.',
        'Full binary tree: every node has 0 or 2 children. Perfect: all leaves at same level.',
      ],
    },
    {
      heading: 'DFS Traversals',
      points: [
        'Inorder (L→Root→R): visits nodes in sorted order for BST. O(n) time, O(h) space.',
        'Preorder (Root→L→R): useful for serialization — root first enables reconstruction.',
        'Postorder (L→R→Root): process children before parent — height, deletion, size calculations.',
        'All three can be done recursively (call stack) or iteratively (explicit stack).',
      ],
    },
    {
      heading: 'BFS (Level-Order)',
      points: [
        'Uses a queue. Process all nodes at depth d before depth d+1.',
        'Snapshot queue.length at start of each level to separate levels.',
        'Used for: level-order traversal, zigzag traversal, right-side view, minimum depth.',
        'BFS guarantees shortest path in unweighted trees (useful for min depth).',
      ],
    },
    {
      heading: 'Common Recursive Patterns',
      points: [
        'Many tree problems return values UP the recursion: height, count, sum, max path.',
        'Global variable pattern: use a closure variable to track max across all subtrees.',
        'Pass-down pattern: carry info from parent to children (path sum, range validation).',
        'Trust the recursion: assume left/right subtrees are correct, combine for root.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Traversals',
      language: 'typescript',
      code: `class TreeNode { val=0; left:TreeNode|null=null; right:TreeNode|null=null; constructor(v:number){this.val=v;} }

// Inorder — recursive O(n) O(h)
function inorder(root: TreeNode | null, res: number[] = []): number[] {
  if (!root) return res;
  inorder(root.left, res);
  res.push(root.val);
  inorder(root.right, res);
  return res;
}

// Iterative inorder — explicit stack
function inorderIterative(root: TreeNode | null): number[] {
  const result: number[] = [], stack: TreeNode[] = [];
  let curr: TreeNode | null = root;
  while (curr || stack.length) {
    while (curr) { stack.push(curr); curr = curr.left; }
    curr = stack.pop()!;
    result.push(curr.val);
    curr = curr.right;
  }
  return result;
}

// Level-order BFS
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [], queue = [root];
  while (queue.length) {
    const level: number[] = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
    },
    {
      label: 'Height & Diameter',
      language: 'typescript',
      code: `// Tree height — O(n) postorder
function height(root: TreeNode | null): number {
  if (!root) return -1; // null height is -1
  return 1 + Math.max(height(root.left), height(root.right));
}

// Diameter — longest path between any two nodes
function diameterOfBinaryTree(root: TreeNode | null): number {
  let diameter = 0;
  function dfs(node: TreeNode | null): number {
    if (!node) return -1;
    const left = dfs(node.left);
    const right = dfs(node.right);
    diameter = Math.max(diameter, left + right + 2); // edges through node
    return 1 + Math.max(left, right);
  }
  dfs(root);
  return diameter;
}

// Max path sum — can go through any path (not just root-to-leaf)
function maxPathSum(root: TreeNode | null): number {
  let maxSum = -Infinity;
  function gain(node: TreeNode | null): number {
    if (!node) return 0;
    const leftGain = Math.max(0, gain(node.left));
    const rightGain = Math.max(0, gain(node.right));
    maxSum = Math.max(maxSum, node.val + leftGain + rightGain);
    return node.val + Math.max(leftGain, rightGain); // only one branch goes up
  }
  gain(root);
  return maxSum;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using height -1 vs 0 inconsistently',
      wrong: `function height(node) {
  if (!node) return 0; // leaf would be 1 — but callers expect 0
}`,
      right: `function height(node) {
  if (!node) return -1; // null=-1, leaf=0, consistent edges-based counting
  return 1 + Math.max(height(node.left), height(node.right));
}`,
      explanation: 'Height counts edges. A null node has -1, a leaf has 0. Using 0 for null makes leaf height 1, breaking diameter calculations.',
    },
    {
      title: 'Diameter: forgetting to add 2 for edges',
      wrong: `diameter = Math.max(diameter, left + right); // counts nodes, not edges`,
      right: `diameter = Math.max(diameter, left + right + 2); // +2 for the two edges to left and right`,
      explanation: 'Left and right return the max height (-1 for null, 0 for leaf). Diameter = left + right + 2 gives edge count.',
    },
    {
      title: 'Max path sum: allowing negative subtrees to reduce the sum',
      wrong: `const leftGain = gain(node.left); // negative subtrees subtract from path`,
      right: `const leftGain = Math.max(0, gain(node.left)); // ignore negative subtrees`,
      explanation: 'A negative subtree can be excluded (just don\'t take that path). Math.max(0, gain) effectively prunes negative branches.',
    },
    {
      title: 'BFS: mutating queue.length mid-loop',
      wrong: `for (let i = 0; i < queue.length; i++) { // queue grows as children are added`,
      right: `const size = queue.length; // snapshot before loop
for (let i = 0; i < size; i++) { ... }`,
      explanation: 'queue.length changes as you push children. Snapshot it first to process only the current level.',
    },
    {
      title: 'Mixing up preorder and inorder',
      wrong: `// To serialize: use inorder — but inorder needs BST to be unique`,
      right: `// To serialize: use preorder — root first enables unique reconstruction without extra info`,
      explanation: 'Inorder alone is not enough to reconstruct a generic binary tree. Preorder (root first) with nulls encodes the structure uniquely.',
    },
  ];

  challenge: Challenge = {
    title: 'Binary Tree Right Side View',
    language: 'typescript',
    description: 'Return the values of nodes visible when looking at the tree from the right side (the last node at each level).',
    hints: ['Use BFS level order', 'The last node in each level is visible from the right', 'DFS also works: visit right before left, track depth'],
    starterCode: `function rightSideView(root: TreeNode | null): number[] {
  // BFS approach: collect last node of each level
}`,
    solution: `function rightSideView(root: TreeNode | null): number[] {
  if (!root) return [];
  const result: number[] = [], queue = [root];
  while (queue.length) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      if (i === size - 1) result.push(node.val); // last node of level
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which traversal visits nodes in sorted order for a BST?',
      options: ['Preorder', 'Inorder', 'Postorder', 'Level-order'],
      answer: 1,
      explanation: 'Inorder (Left → Root → Right) visits BST nodes in ascending sorted order because all left subtree values < root < all right subtree values.',
    },
    {
      q: 'What is the height of a null (empty) tree node, by convention?',
      options: ['0', '-1', '1', 'undefined'],
      answer: 1,
      explanation: 'Height counts edges. Null → -1, leaf → 0. This makes leaf height 1+max(-1,-1) = 0, which is consistent.',
    },
    {
      q: 'Which traversal is best for calculating a node\'s height or size?',
      options: ['Preorder', 'Inorder', 'Postorder', 'Level-order'],
      answer: 2,
      explanation: 'Postorder processes children first, then the parent — you need the children\'s heights/sizes before computing the parent\'s.',
    },
  { q: 'What is the height of a complete binary tree with n nodes?', options: ['n', 'n/2', 'floor(log2(n))', 'ceil(log2(n + 1))'], answer: 2, explanation: 'Height = floor(log2(n)). A complete binary tree fills each level before the next. The maximum number of nodes at height h is 2^(h+1) - 1, so height = floor(log2(n)).' },
  { q: 'What traversal order produces a sorted sequence from a BST?', options: ['Pre-order', 'Post-order', 'Level-order', 'In-order'], answer: 3, explanation: 'In-order traversal (left -> root -> right) of a BST visits nodes in ascending key order. This is the basis for BST-based sorting and for checking if a tree is a valid BST.' },
  { q: 'What is the time complexity of finding the lowest common ancestor (LCA) in a binary tree?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], answer: 2, explanation: 'LCA in an unordered binary tree requires O(n) in the worst case — you must traverse potentially all nodes to find both targets. In a BST, LCA is O(h) = O(log n) for balanced trees.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use DFS vs BFS for tree problems?',
      a: 'Use DFS (recursive) for: height, diameter, path sums, subtree problems, any problem requiring returning values up the tree. Use BFS for: level-order traversal, finding shortest paths (min depth), or anything needing level separation (right-side view, zigzag).',
    },
    {
      q: 'How do you handle the "global variable" pattern in tree recursion?',
      a: 'Many problems need a running maximum/sum across all paths. Use a closure variable (let max = -Infinity) outside the recursive function, update it inside, return only the value useful to the parent. This avoids threading an accumulator through every call.',
    },
    {
      q: 'What is the space complexity of recursive tree traversal?',
      a: 'O(h) where h is the height. In the worst case (skewed tree), h = n → O(n). In a balanced tree, h = log n → O(log n). The call stack holds one frame per level of recursion depth.',
    },
  { q: 'How do you check if a binary tree is balanced?', a: 'A tree is balanced if the height difference of left and right subtrees is at most 1 for EVERY node. Recursive O(n): compute height bottom-up (postorder DFS). If left or right is unbalanced, propagate -1 as a sentinel. At each node: if |leftH - rightH| > 1, return -1 (unbalanced). Avoids recomputing height for each node (unlike the naive O(n^2) approach that calls height() repeatedly).' },
  { q: 'What is the difference between a full, complete, and perfect binary tree?', a: 'Full binary tree: every node has 0 or 2 children (no node has exactly 1 child). Complete binary tree: all levels except possibly the last are fully filled; the last level is filled from left to right. Perfect binary tree: all levels are fully filled (2^(h+1) - 1 nodes total). A perfect tree is both full and complete.' },
  { q: 'How do you serialize and deserialize a binary tree?', a: 'Preorder with null markers: serialize using DFS, write each value and a marker for nulls. Deserialize: consume the preorder sequence, recursively build left then right. O(n) time and space. BFS (level-order) serialization is also common (LeetCode format). Key: null markers allow unambiguous reconstruction — without them, preorder alone is not unique.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Binary tree problems are mostly DFS (postorder for bottom-up values) or BFS (level-by-level) — learn the traversal patterns and trust the recursion.',
    mustKnow: [
      'Inorder=sorted BST, Preorder=serialize, Postorder=height/size',
      'Height: null=-1, leaf=0; use 1+max(left,right)',
      'Diameter: left+right+2 at each node, track global max',
      'Max path sum: Math.max(0, gain) prunes negative branches',
      'BFS: snapshot queue.length before adding children',
    ],
    interviewFocus: [
      'Diameter of binary tree',
      'Max path sum (any path)',
      'Right side view (BFS level-order)',
    ],
  };
}
