import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bt-morris',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './morris-traversal-restores-the-tree-unless-you-forget.html',
  styleUrl: './morris-traversal-restores-the-tree-unless-you-forget.scss'
})
export class MorrisTraversalRestoresTheTreeUnlessYouForgetSubtopic {
  topicLabel = 'Binary Trees';
  topicRoute = '/dsa/binary-trees';

  theory: TheoryPoint[] = [
    {
      heading: 'Building and Deliberately Breaking Morris Traversal',
      points: [
        'The main page\'s own theory names Morris traversal as achieving O(1) extra space by "temporarily" threading and un-threading the tree, with no code on the page ever demonstrating it. Built a correct implementation and verified it produces the exact same result as a normal recursive inorder traversal, AND that the tree\'s structure (serialized including every left/right pointer) is byte-for-byte identical before and after the call -- confirming "temporarily" is not just a description, it is a verified guarantee.',
        'The mechanism depends on one specific line: for each node with a left child, find that child\'s rightmost descendant (the "predecessor") and thread its otherwise-unused right pointer forward to the current node -- this lets traversal return to the current node later without a stack. The thread is only safe because it gets explicitly removed (set back to null) the second time it is encountered.',
        'Deliberately removing that one "remove the thread" line produces a genuinely broken result -- not a cosmetic one. The traversal itself still returns the correct values on its FIRST run (since the thread is used exactly once per node during that pass), but it leaves a real, permanent CYCLE in the tree: in a small test tree, the leaf node originally holding value 4 ends up with its own .right pointer still pointing back to its own ancestor, node 2.',
        'The consequence is dramatic and verified directly: running an ordinary, unrelated recursive inorder traversal on the now-corrupted tree afterward produces garbage -- repeated values (4, 4, 4, 2, 2, 2, 2, ...) instead of the correct 7 distinct values, because the recursion is now walking around a cycle that did not exist before the broken Morris traversal ran.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Correct Morris traversal, verified to restore the tree',
      language: 'typescript',
      code: `function morrisInorder(root: TreeNode | null): number[] {
  const result: number[] = [];
  let curr: TreeNode | null = root;
  while (curr) {
    if (!curr.left) {
      result.push(curr.val);
      curr = curr.right;
    } else {
      let pred = curr.left;
      while (pred.right && pred.right !== curr) pred = pred.right;
      if (!pred.right) {
        pred.right = curr; // create the temporary thread
        curr = curr.left;
      } else {
        pred.right = null; // remove the thread -- restores this part of the tree
        result.push(curr.val);
        curr = curr.right;
      }
    }
  }
  return result;
}

const before = serializeStructure(tree); // includes every left/right pointer
const result = morrisInorder(tree);
const after = serializeStructure(tree);

console.log(result);
// Actual measured output: [4, 2, 7, 5, 1, 3, 6] -- same as normal inorder
console.log(before === after);
// Actual measured output: true -- tree structure fully restored`,
    },
    {
      label: 'The broken version, deliberately missing one line',
      language: 'typescript',
      code: `function morrisInorderBroken(root: TreeNode | null): number[] {
  const result: number[] = [];
  let curr: TreeNode | null = root;
  while (curr) {
    if (!curr.left) {
      result.push(curr.val);
      curr = curr.right;
    } else {
      let pred = curr.left;
      while (pred.right && pred.right !== curr) pred = pred.right;
      if (!pred.right) {
        pred.right = curr;
        curr = curr.left;
      } else {
        // BUG: forgot "pred.right = null;" -- the thread is never removed
        result.push(curr.val);
        curr = curr.right;
      }
    }
  }
  return result;
}

morrisInorderBroken(tree); // returns [4, 2, 7, 5, 1, 3, 6] -- looks fine!

// But the leaf node that originally held value 4 is now corrupted:
console.log(node4.right?.val);
// Actual measured output: 2 -- node 4 now points back to its own ancestor, node 2

// Running an ORDINARY recursive inorder on the corrupted tree afterward:
inorderCapped(tree);
// Actual measured output: [4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, ...]
// -- garbage, because the recursion is now stuck looping around a real cycle`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The broken version returns the CORRECT result on its own first call, even though it leaves the tree permanently corrupted. Why does the bug not show up immediately, in that very same call?',
    hint: 'Think about how many times, during ONE full traversal, the algorithm actually needs to follow a specific thread before deciding whether to remove it.',
    solution: 'During a single traversal, each thread is only ever followed back to its target exactly once -- the very moment that happens, the algorithm has already pushed curr.val to the result and moved on (curr = curr.right); it never needs to re-traverse that same thread again within the SAME call. The missing "remove the thread" line only matters for anyone who touches the tree again AFTERWARD, which is exactly why this class of bug is dangerous: the function that introduces it looks completely correct when tested in isolation (its own return value is right), and the damage only becomes visible later, in a completely different, seemingly unrelated piece of code that happens to traverse the same tree object a second time.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a function\'s return value is correct when you test it, the function has no bugs worth worrying about.',
      reality: 'The broken Morris traversal above returns the exact correct array on its own first call -- and still permanently corrupts the tree it was given, confirmed by measuring a real leftover cycle and a subsequent unrelated traversal returning garbage. A function can be "correct" by its own return value and still have a serious, verified side-effect bug.',
    },
    {
      thought: 'Morris traversal\'s "temporary" tree modification is really just a cosmetic implementation detail, not something that needs careful verification.',
      reality: 'Verified directly: a single missing line turns the "temporary" modification into a permanent one, and a permanent accidental cycle in a tree structure is not a minor issue -- it breaks every single future traversal of that tree, as confirmed by the garbage output from a completely ordinary, correctly-written recursive function run on the corrupted tree afterward.',
    },
  ];
}
