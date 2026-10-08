import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-word-search-ii-pruning',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './word-search-ii-pruning.html',
  styleUrl: './word-search-ii-pruning.scss'
})
export class WordSearchIiPruningSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Three Versions of the Same Search, Counted',
      points: [
        'The main page\'s Word Search II code collected found words in a Set and kept every trie branch forever. Its QnA describes the usual improvement as marking a found word with <code>isEnd = false</code> and aborting at nodes with no children. Those are two separate steps, and only one of them saves time.',
        'Counted on a 5×5 board of all "a" with the words "a" to "aaaaaa": the original version made 7,985 DFS calls. Adding only <code>isEnd = false</code> made exactly 7,985 calls too — it stops a word being reported twice, which the Set already prevented, but every branch is still walked again from every starting cell.',
        'Adding the second step — after exploring a child, delete it from its parent when it has no children left and no word ends there — dropped the count to 36. Once the first start cell finds all six words, the whole trie is emptied and the other 24 start cells return after one call each.',
        'On a less extreme input, a random 6×6 board over a, b, c, d with about 300 random words, the same three versions made 2,885, 2,885 and 1,689 calls, all finding the same 109 words. The main page\'s code now includes both steps.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Marking found words vs deleting empty branches',
      language: 'typescript',
      code: `class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

function findWords(board: string[][], words: string[]): string[] {
  const root = new TrieNode();
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }

  const rows = board.length, cols = board[0].length;
  const found: string[] = [];
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  function dfs(r: number, c: number, node: TrieNode, path: string): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] === '#') return;
    const ch = board[r][c];
    const next = node.children.get(ch);
    if (!next) return;
    const nextPath = path + ch;
    if (next.isEnd) { found.push(nextPath); next.isEnd = false; }  // step 1: report once
    board[r][c] = '#';
    for (const [dr, dc] of DIRS) dfs(r + dr, c + dc, next, nextPath);
    board[r][c] = ch;
    if (next.children.size === 0 && !next.isEnd) node.children.delete(ch);  // step 2: prune
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) dfs(r, c, root, '');
  return found;
}

// DFS calls made:                     no steps   step 1 only   steps 1 + 2
//   5x5 all "a", words a..aaaaaa         7,985        7,985            36
//   random 6x6 (a-d), ~300 words         2,885        2,885         1,689`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Without step 1, would step 2 alone still delete branches? Try it on the word "aa" in a board containing "aa".',
    hint: 'Step 2 only deletes a node when no word ends there and it has no children.',
    solution: 'No. The node for the last letter of "aa" keeps isEnd = true forever without step 1, so it is never deleted, and neither is its parent, which still has it as a child. Pruning needs a found word to be cleared first; otherwise the condition in step 2 never becomes true for nodes that end a word.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting isEnd = false after finding a word is the pruning optimization for Word Search II.',
      reality: 'It only stops duplicate reports. The measured call count did not change at all. The saving comes from removing branches that have no words left, so later DFS calls stop at the parent.',
    },
    {
      thought: 'Deleting nodes from the trie during the search could break other searches that are still running.',
      reality: 'A node is deleted only after its own subtree has been fully explored and found empty, so no remaining word can lie below it. Any later search reaching that parent would have found nothing down that branch anyway.',
    },
  ];
}
