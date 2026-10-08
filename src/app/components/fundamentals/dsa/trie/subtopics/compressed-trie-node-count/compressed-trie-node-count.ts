import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-compressed-trie-node-count',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './compressed-trie-node-count.html',
  styleUrl: './compressed-trie-node-count.scss'
})
export class CompressedTrieNodeCountSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What Compression Removes and What It Keeps',
      points: [
        'The main page\'s QnA said a compressed trie (radix tree) reduces space "from O(total_chars) to O(n)". It reduces the number of nodes to O(n). Whether total space drops depends on how the edge labels are stored.',
        'Measured on 1,000 random words of 5 to 24 letters (14,907 characters in total): the plain trie built 12,577 nodes. Keeping only the nodes that matter in a radix tree — the root, every word end, and every branching point — left 1,411. That fits the structural bound: every node is either a word end (at most n of them) or a branch point with at least two children (fewer than n of those), so a radix tree has under 2n nodes.',
        'The characters do not disappear. Each removed chain of single-child nodes becomes one edge with a multi-letter label, so the labels together still contain about 12,576 characters — one per edge of the original trie.',
        'Real savings come from what each node costs. A plain-trie node carries a Map or a 26-slot array plus a flag, so removing 11,000 of them saves a lot of memory. To reach truly O(n) space, implementations store each label as a start and end index into the original word rather than as a copied string.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Counting plain-trie nodes vs radix-tree nodes',
      language: 'typescript',
      code: `class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

function buildTrie(words: string[]): { root: TrieNode; nodes: number } {
  const root = new TrieNode();
  let nodes = 1;
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children.has(ch)) { node.children.set(ch, new TrieNode()); nodes++; }
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }
  return { root, nodes };
}

// A radix tree keeps only: the root, word ends, and branching nodes.
// Every other node is in a single-child chain and merges into an edge label.
function radixNodeCount(root: TrieNode): number {
  let count = 0;
  const walk = (node: TrieNode, isRoot: boolean) => {
    if (isRoot || node.isEnd || node.children.size !== 1) count++;
    for (const child of node.children.values()) walk(child, false);
  };
  walk(root, true);
  return count;
}

// 1,000 random words, 5-24 letters from a-j:
//   total characters      14,907
//   plain trie nodes      12,577
//   radix tree nodes       1,411   (below the 2n = 2,000 bound)
//   characters in labels  ~12,576  (unchanged, just grouped onto fewer edges)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Insert the words "test", "team" and "toast" into a radix tree. How many nodes does it have, and what are the edge labels?',
    hint: 'Find where the words first differ: after "t", and then after "te".',
    solution: 'Six nodes: the root, a branch node "t" (children "e" and "oast"), a branch node "te" (children "st" and "am"), and three leaves for "test", "team" and "toast". The edge labels are "t", "e", "st", "am" and "oast". A plain trie for the same words needs 11 nodes: the root plus one per distinct prefix (t, te, tes, test, tea, team, to, toa, toas, toast).',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A radix tree stores fewer characters than a plain trie.',
      reality: 'It stores the same characters on fewer, longer edges. The saving is in nodes — each with its own child map and flag — not in characters, unless labels are kept as index ranges into the original strings.',
    },
    {
      thought: 'Compression only helps dictionaries with long shared prefixes.',
      reality: 'It helps most where words have long unshared tails. In the random test, few prefixes were shared, so most of each word was a single-child chain — exactly what compression merges, from 12,577 nodes down to 1,411.',
    },
  ];
}
