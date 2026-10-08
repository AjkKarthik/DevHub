import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bt-serialize',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './inorder-alone-cannot-reconstruct-a-binary-tree.html',
  styleUrl: './inorder-alone-cannot-reconstruct-a-binary-tree.scss'
})
export class InorderAloneCannotReconstructABinaryTreeSubtopic {
  topicLabel = 'Binary Trees';
  topicRoute = '/dsa/binary-trees';

  theory: TheoryPoint[] = [
    {
      heading: 'Proving the Mistake Block\'s Claim, Then Building the Fix',
      points: [
        'The main page\'s own "Mixing up preorder and inorder" mistake block states that inorder alone "is not enough to reconstruct a generic binary tree." Proved this directly rather than just citing it: built two DIFFERENT tree shapes -- a small balanced tree (root 2, children 1 and 3) and a completely right-skewed chain (1 -> 2 -> 3, each only a right child) -- and confirmed both produce the IDENTICAL inorder sequence <code>[1, 2, 3]</code>. Given only that sequence, there is no way to tell which of the two (or any other) tree shapes it came from.',
        'The main page\'s own QnA describes the actual fix in prose: preorder traversal WITH explicit null markers, since preorder visits the root first (enabling top-down reconstruction) and the null markers remove the remaining ambiguity about exactly where each subtree ends. Built and verified this directly: serializing the main page\'s own 7-node example tree, then deserializing that string back into a tree, produces a structure that is byte-for-byte identical to the original (verified by comparing a full left/right-pointer serialization of both, not just comparing values).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving inorder alone is ambiguous',
      language: 'typescript',
      code: `function inorder(root: TreeNode | null, res: number[] = []): number[] {
  if (!root) return res;
  inorder(root.left, res);
  res.push(root.val);
  inorder(root.right, res);
  return res;
}

// Tree A: small balanced tree -- root 2, left child 1, right child 3
const treeA: TreeNode = { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } };

// Tree B: completely right-skewed chain -- 1 -> 2 -> 3 (each only a right child)
const treeB: TreeNode = { val: 1, left: null, right: { val: 2, left: null, right: { val: 3, left: null, right: null } } };

console.log(inorder(treeA, []));
// Actual measured output: [1, 2, 3]
console.log(inorder(treeB, []));
// Actual measured output: [1, 2, 3] -- identical to treeA, despite being a completely different shape`,
    },
    {
      label: 'Preorder + null markers, round-tripped',
      language: 'typescript',
      code: `function serialize(root: TreeNode | null): string {
  const result: string[] = [];
  function dfs(node: TreeNode | null): void {
    if (!node) { result.push('#'); return; }
    result.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result.join(',');
}

function deserialize(data: string): TreeNode | null {
  const values = data.split(',');
  let i = 0;
  function build(): TreeNode | null {
    const token = values[i++];
    if (token === '#') return null;
    return { val: Number(token), left: build(), right: build() };
  }
  return build();
}

const data = serialize(originalTree);
console.log(data);
// Actual measured output: "1,2,4,#,#,5,7,#,#,#,3,#,6,#,#"

const rebuilt = deserialize(data);
console.log(serializeStructure(originalTree) === serializeStructure(rebuilt));
// Actual measured output: true -- every left/right pointer matches exactly, not just the values`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If you serialized a tree using preorder WITHOUT null markers (just the non-null values, root first), could you always reconstruct the exact original tree from that sequence alone?',
    hint: 'Think about whether a bare preorder sequence like [1, 2, 3] could itself be produced by more than one tree shape -- the same question this subtopic already answered for inorder.',
    solution: 'No -- without null markers, preorder has the exact same ambiguity problem as inorder. The bare sequence [1, 2, 3] in preorder order could be: a single right-skewed chain (1 -> right:2 -> right:3), a single left-skewed chain (1 -> left:2 -> left:3), or a balanced tree (1 as root, 2 as left child, 3 as right child) -- all three are valid preorder traversals of the identical sequence [1, 2, 3]. The null markers are not an optional nicety; they are what actually removes the ambiguity, by explicitly recording exactly where each node\'s left and right children are absent, which is the information a bare value sequence alone can never carry.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Preorder traversal is enough on its own to uniquely reconstruct a binary tree, since it visits the root first.',
      reality: 'Verified directly: a bare preorder sequence like [1, 2, 3] is ambiguous between at least three different tree shapes (left-skewed, right-skewed, and balanced) -- visiting the root first tells you WHICH node is the root, but says nothing about where each node\'s children stop. Null markers are the specific piece of information that removes this ambiguity, not preorder order by itself.',
    },
    {
      thought: 'If two trees produce the same traversal output, they must have very similar overall shapes.',
      reality: 'Verified directly: a small BALANCED tree and a completely SKEWED chain -- about as different in shape as two 3-node trees can be -- produce the exact identical inorder sequence [1, 2, 3]. Traversal output alone reveals almost nothing about the tree\'s actual shape.',
    },
  ];
}
