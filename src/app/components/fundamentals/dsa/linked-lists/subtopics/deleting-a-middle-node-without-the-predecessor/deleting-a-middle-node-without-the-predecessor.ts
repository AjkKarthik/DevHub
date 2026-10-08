import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-ll-delete-middle',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './deleting-a-middle-node-without-the-predecessor.html',
  styleUrl: './deleting-a-middle-node-without-the-predecessor.scss'
})
export class DeletingAMiddleNodeWithoutThePredecessorSubtopic {
  topicLabel = 'Linked Lists';
  topicRoute = '/dsa/linked-lists';

  theory: TheoryPoint[] = [
    {
      heading: 'The Copy-Forward Trick, Built and Broken on Purpose',
      points: [
        'The main page\'s own QnA describes a trick for deleting a given node when you only have a pointer to THAT node (not the head, not the predecessor): copy the next node\'s value into the current node, then skip over the next node. No codeTab on the page ever builds it.',
        'Built and verified it directly: given only a reference to the node holding value <code>5</code> inside <code>[4,5,1,9]</code> (no head reference, no predecessor), the trick correctly produces <code>[4,1,9]</code> -- the list visually "loses" the value 5, even though the node object that ORIGINALLY held 9 is still technically allocated in memory; what actually got removed from the chain is the node that used to hold 1.',
        'The QnA\'s own caveat -- "only if it is not the last node" -- was verified by deliberately attempting the trick on the last node of <code>[4,5,1,9]</code> (the node holding <code>9</code>, whose <code>.next</code> is null): it throws a <code>TypeError</code> immediately, trying to read <code>.val</code> off <code>null</code>, confirming the trick has no fallback for this case and genuinely cannot work on the last node by its very construction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trick, working',
      language: 'typescript',
      code: `// Given ONLY a reference to the node itself -- no head, no predecessor
function deleteNodeTrick(node: ListNode): void {
  node.val = node.next!.val;
  node.next = node.next!.next;
}

const list = fromArray([4, 5, 1, 9]);
const nodeWithFive = findNode(list, 5); // some way the caller obtained this reference
deleteNodeTrick(nodeWithFive);
console.log(toArray(list));
// Actual measured output: [4, 1, 9]`,
    },
    {
      label: 'The trick, deliberately broken',
      language: 'typescript',
      code: `const list2 = fromArray([4, 5, 1, 9]);
const lastNode = findNode(list2, 9); // the LAST node -- .next is null

try {
  deleteNodeTrick(lastNode);
} catch (e) {
  console.log((e as Error).message);
}
// Actual measured output: "Cannot read properties of null (reading 'val')"
// -- the trick has no way to "delete" the true last node, because there is
// no node AFTER it to copy a value from`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'After calling deleteNodeTrick on the node that held value 5 inside [4,5,1,9], the list becomes [4,1,9]. Which original node object was actually removed from the chain -- the one that held 5, or the one that held 1?',
    hint: 'The function overwrites node.val (the node\'s own value field) before touching node.next -- think about what that overwrite does to the node\'s original identity.',
    solution: 'The node that originally held the value 1 is the one removed from the chain -- the node object the caller originally had a reference to (which held 5) is NOT removed at all. Instead, that node\'s own .val field gets overwritten to 1 (copied from the next node), and its .next pointer gets redirected to skip over the (now-unreferenced) node that used to hold 1. From the outside, traversing the list afterward looks identical to having deleted the "5" node -- the VALUES in sequence are correct -- but the actual node OBJECT that is still linked into the list, at that position, is the original "5" node, just relabeled. This is exactly why the technique only works when you do not need the deleted node\'s own identity to survive anywhere else (e.g. another part of the program holding a separate reference to that exact node object would NOT see it disappear).',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The copy-forward trick genuinely deletes the specific node object the caller was given a reference to.',
      reality: 'It does not -- verified by tracing which node survives in the chain. The node the caller held a reference to STAYS in the list, just with its value overwritten; the node immediately after it is the one that gets unlinked. For most practical purposes this is indistinguishable from the outside (values printed in sequence are correct), but it genuinely matters if any other code elsewhere holds its OWN separate reference to either of those two specific node objects.',
    },
    {
      thought: 'This trick is a general-purpose way to delete any node in O(1) given just a pointer to it, with no further restriction.',
      reality: 'Verified directly that it throws when attempted on the true LAST node of the list -- there is no next node to copy a value from, so node.next!.val fails. The technique fundamentally requires a node AFTER the target to exist; it is not a universal O(1) deletion method, only a workaround for the specific "I don\'t have the predecessor" case, and only for non-tail nodes.',
    },
  ];
}
