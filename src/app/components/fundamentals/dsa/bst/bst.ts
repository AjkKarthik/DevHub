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
  selector: 'app-dsa-bst',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bst.html',
  styleUrl: './bst.scss',
})
export class DsaBst {
  quickRef: QuickRefItem[] = [
    { name: 'BST property',      type: 'keyword', desc: 'left < node < right at every node' },
    { name: 'Search',            type: 'syntax',  desc: 'O(h) — go left if target < node, right if >' },
    { name: 'Insert',            type: 'syntax',  desc: 'O(h) — find correct leaf position, attach' },
    { name: 'Delete',            type: 'syntax',  desc: 'O(h) — 3 cases: leaf, one child, two children (inorder successor)' },
    { name: 'Inorder = sorted',  type: 'syntax',  desc: 'Inorder traversal of BST yields sorted ascending sequence' },
    { name: 'Validation',        type: 'syntax',  desc: 'Pass min/max bounds down: left subtree < node, right subtree > node' },
    { name: 'Kth smallest',      type: 'syntax',  desc: 'Inorder traversal, stop at kth node' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'BST Property',
      points: [
        'For every node N: all values in the left subtree < N.val, all values in the right subtree > N.val.',
        'This property holds recursively — not just for immediate children.',
        'Average height is O(log n) for random insertion; worst case O(n) for sorted input (degenerates to linked list).',
        'Balanced BSTs (AVL, Red-Black) maintain O(log n) height through rotations.',
      ],
    },
    {
      heading: 'Search and Insert',
      points: [
        'Search: at each node, go left if target < node.val, right if target > node.val. Stop when found or null.',
        'Insert: search to find the correct null position, create a new node there.',
        'Both operations are O(h) where h is the tree height.',
        'Duplicate handling: typically ignore duplicates or store counts; define your policy upfront.',
      ],
    },
    {
      heading: 'Delete — Three Cases',
      points: [
        'Case 1 (leaf): simply remove the node.',
        'Case 2 (one child): replace node with its child.',
        'Case 3 (two children): replace node\'s value with its inorder successor (smallest node in right subtree), then delete the successor.',
        'The inorder successor always has at most one child (right child), so its deletion is Case 1 or 2.',
      ],
    },
    {
      heading: 'Validation',
      points: [
        'A common mistake: only checking parent-child relationship. Must pass bounds down recursively.',
        'Call validate(node, min, max): left subtree gets max=node.val, right subtree gets min=node.val.',
        'Initialize with min=-Infinity, max=+Infinity at root.',
        'This catches cases where a node in the left subtree is greater than an ancestor.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Search, Insert, Delete',
      language: 'typescript',
      code: `class TreeNode { val=0; left:TreeNode|null=null; right:TreeNode|null=null; constructor(v:number){this.val=v;} }

// Search — O(h)
function searchBST(root: TreeNode | null, val: number): TreeNode | null {
  if (!root || root.val === val) return root;
  return val < root.val ? searchBST(root.left, val) : searchBST(root.right, val);
}

// Insert — O(h)
function insertIntoBST(root: TreeNode | null, val: number): TreeNode {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;
}

// Delete — O(h)
function deleteNode(root: TreeNode | null, key: number): TreeNode | null {
  if (!root) return null;
  if (key < root.val) { root.left = deleteNode(root.left, key); }
  else if (key > root.val) { root.right = deleteNode(root.right, key); }
  else {
    if (!root.left) return root.right;  // case 1 & 2
    if (!root.right) return root.left;  // case 2
    // case 3: find inorder successor (min of right subtree)
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}`,
    },
    {
      label: 'Validate & Kth Smallest',
      language: 'typescript',
      code: `// Validate BST — pass bounds down O(n)
function isValidBST(root: TreeNode | null, min = -Infinity, max = Infinity): boolean {
  if (!root) return true;
  if (root.val <= min || root.val >= max) return false;
  return isValidBST(root.left, min, root.val) &&
         isValidBST(root.right, root.val, max);
}

// Kth smallest — inorder, O(n) O(h) space
function kthSmallest(root: TreeNode | null, k: number): number {
  let count = 0, result = 0;
  function inorder(node: TreeNode | null): void {
    if (!node || count >= k) return;
    inorder(node.left);
    count++;
    if (count === k) { result = node.val; return; }
    inorder(node.right);
  }
  inorder(root);
  return result;
}

// Convert sorted array to balanced BST — O(n)
function sortedArrayToBST(nums: number[]): TreeNode | null {
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  const node = new TreeNode(nums[mid]);
  node.left = sortedArrayToBST(nums.slice(0, mid));
  node.right = sortedArrayToBST(nums.slice(mid + 1));
  return node;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Validating BST by only checking immediate children',
      wrong: `// Only checking node.left.val < node.val — misses ancestor violations
if (node.left && node.left.val >= node.val) return false;`,
      right: `// Pass bounds recursively
function isValid(node, min, max) {
  if (!node) return true;
  if (node.val <= min || node.val >= max) return false;
  return isValid(node.left, min, node.val) && isValid(node.right, node.val, max);
}`,
      explanation: 'A node in the left subtree could violate an ancestor\'s constraint. Only bounds passed recursively catch this.',
    },
    {
      title: 'BST delete: not finding the inorder successor for two-child case',
      wrong: `// Using inorder predecessor (max of left) — valid but less common
let pred = root.left;
while (pred.right) pred = pred.right;`,
      right: `// Using inorder successor (min of right subtree) — standard approach
let succ = root.right;
while (succ.left) succ = succ.left;`,
      explanation: 'Either works, but inorder successor (min of right subtree) is the conventional approach. Be consistent.',
    },
    {
      title: 'Assuming BST is always O(log n)',
      wrong: `// BST search is O(log n)`,
      right: `// BST search is O(h) — O(log n) balanced, O(n) worst case (sorted input)`,
      explanation: 'A BST built from sorted input degenerates to a linked list (height = n). Always say O(h) and clarify balanced vs unbalanced.',
    },
    {
      title: 'Inorder traversal: collecting all nodes instead of stopping at kth',
      wrong: `// Collect all into array, then return array[k-1] — O(n) space
const arr: number[] = []; inorder(root, arr); return arr[k-1];`,
      right: `// Count during traversal, stop early — O(h) space
let count = 0; function dfs(n) { ... if(++count === k) result = n.val; ... }`,
      explanation: 'Stopping early avoids collecting all n nodes. The inorder traversal doesn\'t need to finish — stop when count reaches k.',
    },
    {
      title: 'Using strict inequality wrong in BST validation',
      wrong: `if (root.val < min || root.val > max) return false; // allows equals`,
      right: `if (root.val <= min || root.val >= max) return false; // BST has strict inequality`,
      explanation: 'Standard BST definition requires strict inequality: left < node < right. Equal values would violate the property.',
    },
  ];

  challenge: Challenge = {
    title: 'Lowest Common Ancestor of BST',
    language: 'typescript',
    description: 'Given a BST and two nodes p and q, find their lowest common ancestor. The LCA is the deepest node that has both p and q as descendants.',
    hints: ['Use the BST property — no need to do full DFS', 'If both p and q are less than root, LCA is in left subtree', 'If both are greater, LCA is in right subtree; otherwise root is the LCA'],
    starterCode: `function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
  // Use the BST property to navigate efficiently
}`,
    solution: `function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
  if (p.val < root.val && q.val < root.val) return lowestCommonAncestor(root.left!, p, q);
  if (p.val > root.val && q.val > root.val) return lowestCommonAncestor(root.right!, p, q);
  return root; // split point — root is the LCA
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the worst-case time complexity of BST search?',
      options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
      answer: 1,
      explanation: 'A BST built from sorted input becomes a linked list (skewed tree). Search degrades to O(n) in this case.',
    },
    {
      q: 'When deleting a BST node with two children, what replaces it?',
      options: ['Left child', 'Right child', 'Inorder successor (min of right subtree)', 'Inorder predecessor (max of left subtree)'],
      answer: 2,
      explanation: 'The inorder successor is the smallest value in the right subtree. Replacing with it maintains the BST property.',
    },
    {
      q: 'What does inorder traversal of a BST produce?',
      options: ['Reverse sorted order', 'Sorted ascending order', 'Level-order sequence', 'Depends on the tree'],
      answer: 1,
      explanation: 'BST property: left < root < right at every node. Inorder (L→Root→R) visits nodes in ascending sorted order.',
    },
  { q: 'What is the worst-case time complexity of BST operations on an unbalanced tree?', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], answer: 1, explanation: 'An unbalanced BST can degenerate into a linked list (e.g., inserting sorted values). All operations become O(n). Balanced BSTs (AVL, Red-Black) guarantee O(log n) by maintaining balance invariants.' },
  { q: 'What invariant must hold for every node in a valid BST?', options: ['Left child < parent < right child', 'All values in left subtree < node < all values in right subtree', 'Left child < right child', 'Node is smaller than its parent'], answer: 1, explanation: 'The BST property applies to entire subtrees, not just direct children. For every node N: all keys in N.left subtree < N.key < all keys in N.right subtree. Direct child comparison alone is insufficient for validation.' },
  { q: 'How do you find the kth smallest element in a BST efficiently?', options: ['BFS and sort', 'In-order traversal, stop at kth node', 'Binary search the root', 'Store all nodes then index'], answer: 1, explanation: 'In-order traversal (left->root->right) visits BST nodes in sorted order. Stop when you have visited k nodes — the kth node is the answer. O(h + k) time, O(h) space for the stack (h = height).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a BST and a balanced BST?',
      a: 'A BST guarantees the ordering property (left < node < right) but not height. A balanced BST (AVL, Red-Black) additionally guarantees O(log n) height through rotations. In interviews, BST usually means unbalanced unless specified; TreeMap/TreeSet in Java are backed by Red-Black trees.',
    },
    {
      q: 'How do you find the lowest common ancestor in a generic binary tree (not BST)?',
      a: 'Without BST ordering, you must use DFS. For each node, check if it equals p or q. If left subtree contains one and right contains the other, the current node is the LCA. If both are in the same subtree, recurse down that side.',
    },
  { q: 'How do you validate that a binary tree is a valid BST?', a: 'Pass down min/max bounds: validate(node, minVal, maxVal). Node is valid if minVal < node.val < maxVal. Recurse: left subtree gets maxVal = node.val; right subtree gets minVal = node.val. Base case: null is valid. O(n) time. Common mistake: only comparing with direct parent instead of using inherited bounds.' },
  { q: 'What is the algorithm for deleting a node from a BST?', a: '3 cases: (1) Node has no children: remove it. (2) Node has one child: replace node with its child. (3) Node has two children: find in-order successor (smallest value in right subtree), copy its value to the node, then delete the successor (which has at most one right child). All cases O(h) time.' },
  { q: 'What is the difference between a BST and a balanced BST?', a: 'A plain BST has O(h) operations where h can be O(n) in the worst case (degenerate tree). A self-balancing BST (AVL tree, Red-Black tree) maintains h = O(log n) through rotations on insert/delete, guaranteeing O(log n) operations. Practically: Java TreeMap/TreeSet use Red-Black tree; Python uses sorted containers. Use when you need both ordering and O(log n) updates.' },
  { q: 'How do you find the lowest common ancestor in a BST?', a: 'Exploit BST ordering: for nodes p and q, if both p.val < node.val and q.val < node.val, LCA is in the left subtree. If both are greater, LCA is in the right. Otherwise, the current node is the LCA (the paths diverge here). O(h) time. Much faster than the O(n) LCA for general binary trees because you can navigate directly without searching both subtrees.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'BST maintains left < node < right at every node — enables O(h) search/insert/delete and O(n) inorder sorted traversal.',
    mustKnow: [
      'BST property: left < node < right, recursively',
      'Search/Insert O(h) — O(log n) balanced, O(n) skewed',
      'Delete: leaf → remove, one child → replace, two children → inorder successor',
      'Validation: pass (min, max) bounds down, not just parent-child check',
      'Inorder traversal → sorted ascending sequence',
    ],
    interviewFocus: [
      'Validate BST (bounds propagation)',
      'Kth smallest (inorder with early stop)',
      'LCA of BST (exploit ordering property)',
    ],
  };
}
