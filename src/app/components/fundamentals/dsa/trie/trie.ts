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
  selector: 'app-dsa-trie',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './trie.html',
  styleUrl: './trie.scss',
})
export class DsaTrie {
  quickRef: QuickRefItem[] = [
    { name: 'Insert',        type: 'method',  desc: 'O(L) — traverse/create nodes for each character of the word' },
    { name: 'Search',        type: 'method',  desc: 'O(L) — traverse nodes; return isEnd at last char' },
    { name: 'StartsWith',    type: 'method',  desc: 'O(L) — traverse nodes; return true if prefix path exists' },
    { name: 'TrieNode',      type: 'syntax',  desc: 'children: Map<char, TrieNode> + isEnd: boolean' },
    { name: 'Space O(L*W)',  type: 'keyword', desc: 'Total chars across all inserted words — shared prefixes save space' },
    { name: 'Prefix search', type: 'syntax',  desc: 'Trie beats HashMap for prefix queries — HashSet can\'t do startsWith' },
    { name: 'Word search II',type: 'syntax',  desc: 'DFS on grid + Trie for simultaneous multi-word search' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Trie Structure',
      points: [
        'A tree where each node represents a character, and paths from root to isEnd nodes represent stored words.',
        'Each node has children (usually a Map<char, TrieNode> or array of 26) and an isEnd boolean.',
        'Shared prefixes are stored once — space-efficient for large dictionaries with common prefixes.',
        'Unlike a hash set, a trie supports prefix queries (startsWith) in O(L) — a set cannot do this efficiently.',
      ],
    },
    {
      heading: 'Core Operations',
      points: [
        'Insert: iterate over characters, create child nodes that don\'t exist, set isEnd=true at last character.',
        'Search: iterate over characters, return false if any child is missing; at end, return node.isEnd.',
        'StartsWith: same as search but return true at the end regardless of isEnd.',
        'All operations are O(L) where L is the length of the word — independent of dictionary size.',
      ],
    },
    {
      heading: 'When to Use a Trie',
      points: [
        'Autocomplete / prefix matching: find all words with a given prefix.',
        'Word search in a grid (Word Search II): DFS on the grid while traversing the trie.',
        'Longest word with all prefixes present: insert all words, then find deepest path where every node is isEnd.',
        'XOR problems: binary trie stores integers bit-by-bit for fast XOR maximization.',
      ],
    },
    {
      heading: 'Array vs Map for Children',
      points: [
        'Array of 26: children = new Array(26).fill(null). Index = char.charCodeAt(0) - 97. O(1) access, O(26) space per node.',
        'Map<char, TrieNode>: only stores existing children — more space-efficient for sparse alphabets.',
        'Use Map for unicode/general characters; use Array[26] for lowercase English letters (faster).',
        'Space: O(alphabet_size × total_nodes) for array; O(total_characters_inserted) for map.',
      ],
    },
    {
      heading: 'When a Trie Outperforms a Hash Set for String Problems',
      points: [
        'A trie supports prefix-based queries (find all words starting with a given prefix, or check if any word has a given prefix) in time proportional to the prefix length — a hash set cannot answer these prefix queries efficiently at all, requiring a full scan of all stored strings.',
        'Autocomplete and typeahead search features are natural applications of tries, since they fundamentally require "find all entries matching this prefix" — the exact query pattern a trie is structurally optimized for, unlike hash-based or sorted-array alternatives.',
        'A trie\'s memory usage can exceed that of a hash set when stored strings share few common prefixes, since each unique character path requires its own node — the space efficiency of a trie depends heavily on how much prefix-sharing exists in the actual dataset.',
        'Compressed tries (radix trees / Patricia tries), which merge chains of single-child nodes into a single edge labeled with a substring, address the memory overhead of a naive trie while preserving the same prefix-query performance characteristics.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Trie Implementation',
      language: 'typescript',
      code: `class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return true; // prefix path exists
  }

  // Get all words with a given prefix (autocomplete)
  wordsWithPrefix(prefix: string): string[] {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return [];
      node = node.children.get(ch)!;
    }
    const results: string[] = [];
    const dfs = (n: TrieNode, path: string) => {
      if (n.isEnd) results.push(path);
      for (const [ch, child] of n.children) dfs(child, path + ch);
    };
    dfs(node, prefix);
    return results;
  }
}`,
    },
    {
      label: 'Word Search II',
      language: 'typescript',
      code: `// Word Search II — find all words from dictionary in grid
// Uses DFS on grid + Trie for simultaneous search
function findWords(board: string[][], words: string[]): string[] {
  const trie = new Trie();
  for (const w of words) trie.insert(w);

  const rows = board.length, cols = board[0].length;
  const found = new Set<string>();
  const DIRS = [[0,1],[0,-1],[1,0],[-1,0]];

  function dfs(r: number, c: number, node: TrieNode, path: string): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] === '#') return;
    const ch = board[r][c];
    if (!node.children.has(ch)) return; // prune — no word continues this way
    const nextNode = node.children.get(ch)!;
    const nextPath = path + ch;
    if (nextNode.isEnd) found.add(nextPath);
    board[r][c] = '#'; // mark visited
    for (const [dr, dc] of DIRS) dfs(r+dr, c+dc, nextNode, nextPath);
    board[r][c] = ch; // restore
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dfs(r, c, (trie as any).root, '');

  return [...found];
}

declare class Trie { insert(w: string): void; search(w: string): boolean; startsWith(p: string): boolean; }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Search returns true when prefix exists but word doesn\'t end there',
      wrong: `search(word: string): boolean {
  // ... traverse ...
  return node !== null; // returns true for any prefix`,
      right: `search(word: string): boolean {
  // ... traverse ...
  return node.isEnd; // must check isEnd — "app" exists ≠ "apple" is inserted`,
      explanation: 'A node existing means the characters were inserted as part of some word. isEnd=true means this exact word was inserted.',
    },
    {
      title: 'Not creating child nodes during insert',
      wrong: `insert(word: string): void {
  let node = this.root;
  for (const ch of word) node = node.children.get(ch)!; // crashes if node missing`,
      right: `for (const ch of word) {
  if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
  node = node.children.get(ch)!;
}`,
      explanation: 'Insert must create nodes that don\'t exist. Always check and create before navigating to the child.',
    },
    {
      title: 'Word Search: not restoring the board cell after DFS',
      wrong: `board[r][c] = '#'; // mark visited
dfs(r+1, c, ...);
// Missing restore — cell stays '#' for other DFS paths`,
      right: `board[r][c] = '#';
for (const [dr, dc] of DIRS) dfs(r+dr, c+dc, ...);
board[r][c] = ch; // restore for other starting paths`,
      explanation: 'Backtracking requires restoring the board cell. Without restoration, later DFS paths can\'t use this cell.',
    },
    {
      title: 'Using a plain Set/Map instead of Trie — can\'t do prefix search',
      wrong: `const dict = new Set(words);
dict.has(prefix); // checks exact match, not prefix`,
      right: `const trie = new Trie();
words.forEach(w => trie.insert(w));
trie.startsWith(prefix); // O(L) prefix check`,
      explanation: 'Set.has() checks for exact membership. Trie.startsWith() checks if any stored word begins with the prefix — O(L) in both cases, but Set can\'t do prefix queries at all.',
    },
    {
      title: 'Trie with array children: using wrong char index formula',
      wrong: `const idx = ch.charCodeAt(0); // absolute ASCII — index 97-122, not 0-25`,
      right: `const idx = ch.charCodeAt(0) - 'a'.charCodeAt(0); // 0-25 for lowercase a-z`,
      explanation: 'Lowercase letters have ASCII values 97-122. Subtract \'a\' (97) to map a→0, b→1, ..., z→25 for the 26-element children array.',
    },
  ];

  challenge: Challenge = {
    title: 'Design Add and Search Words Data Structure',
    language: 'typescript',
    description: 'Implement a data structure that supports addWord(word) and search(word), where search can contain \'.\' which matches any character.',
    hints: ['Use a Trie for the underlying structure', 'When you encounter \'.\', try all possible child nodes recursively', 'Mark word ends with isEnd=true'],
    starterCode: `class WordDictionary {
  addWord(word: string): void {}
  search(word: string): boolean { return false; }
}`,
    solution: `class WordDictionary {
  private root = new TrieNode();
  addWord(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }
  search(word: string): boolean {
    const dfs = (node: TrieNode, i: number): boolean => {
      if (i === word.length) return node.isEnd;
      const ch = word[i];
      if (ch === '.') return [...node.children.values()].some(child => dfs(child, i + 1));
      if (!node.children.has(ch)) return false;
      return dfs(node.children.get(ch)!, i + 1);
    };
    return dfs(this.root, 0);
  }
}
class TrieNode { children = new Map<string, TrieNode>(); isEnd = false; }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of Trie insert and search?',
      options: ['O(n) where n is number of words', 'O(L) where L is word length', 'O(log n)', 'O(L × n)'],
      answer: 1,
      explanation: 'Both insert and search traverse one node per character — O(L) where L is the word length. Independent of how many words are stored.',
    },
    {
      q: 'What distinguishes Trie.search() from Trie.startsWith()?',
      options: ['search is faster', 'search checks node.isEnd; startsWith returns true if path exists', 'startsWith requires the whole word', 'They are identical'],
      answer: 1,
      explanation: 'search checks that the path exists AND the last node has isEnd=true. startsWith only checks that the path exists — isEnd doesn\'t matter.',
    },
    {
      q: 'Why is a Trie better than a HashSet for autocomplete?',
      options: ['Trie is O(1) lookup', 'Trie supports prefix queries; HashSet only has exact match', 'Trie uses less memory', 'HashSet can\'t store strings'],
      answer: 1,
      explanation: 'HashSet.has() checks exact membership. Trie.startsWith() finds all words with a given prefix — something a HashSet fundamentally cannot do efficiently.',
    },
  { q: 'What is the time complexity of inserting a string of length m into a Trie?', options: ['O(m * n) where n is number of strings', 'O(m)', 'O(log n)', 'O(1)'], answer: 1, explanation: 'Trie insertion traverses or creates at most m nodes (one per character). Each step: check if child exists (O(1) with array or hash map), create if not. Total O(m) per insertion, independent of the number of strings already in the trie.' },
  { q: 'What advantage does a Trie have over a hash map for prefix search?', options: ['Trie is always faster for exact lookup', 'Trie supports O(m) prefix search and autocomplete; hash maps cannot enumerate prefix matches efficiently', 'Trie uses less memory', 'Trie is easier to implement'], answer: 1, explanation: 'Trie allows finding all strings with a given prefix in O(m + k) where k is the number of results. Hash maps need to scan all keys for prefix matching. Tries are used in search autocomplete, spell checkers, and IP routing tables.' },
  { q: 'How can a Trie solve the maximum XOR of two numbers in an array?', options: ['Store numbers in sorted order', 'Insert binary representations; for each number, greedily choose the opposite bit at each level to maximize XOR', 'Sort and use two pointers', 'Use a hash set of all pairs'], answer: 1, explanation: 'Binary Trie for XOR: for each number, insert its 32-bit binary representation. To find max XOR with a number x: at each bit from MSB, try to go the opposite direction of x\'s bit (maximizing XOR). O(32n) = O(n) time. LeetCode 421.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does a Trie compare to a HashMap for word storage?',
      a: 'HashMap: O(1) insert/lookup per word, but O(L×n) space and no prefix support. Trie: O(L) per operation, O(total_chars) space with shared prefixes, and O(L) prefix queries. Use HashMap when you only need exact lookup. Use Trie when you need prefix queries, autocomplete, or simultaneous multi-pattern matching.',
    },
    {
      q: 'What is a binary trie and when is it used?',
      a: 'A binary trie stores integers bit-by-bit (from MSB to LSB), with only 2 children per node (0 and 1). Used for XOR maximization problems: insert numbers into the trie, then for each number greedily choose the opposite bit at each level to maximize XOR. Maximum XOR of two numbers in an array can be solved in O(n × 32) this way.',
    },
  { q: 'How do you implement autocomplete using a Trie?', a: 'Build a Trie from the dictionary. To autocomplete prefix: (1) Traverse the Trie following each character of the prefix — if any character is missing, no completions; (2) From the terminal node of the prefix, collect all words by DFS (follow all children, collect strings where isEnd=true). Time: O(m + k) where m is prefix length and k is total characters in all matching words. Rank by frequency: store frequency at each word end node.' },
  { q: 'What is a compressed Trie (Patricia Trie or Radix Tree) and when is it used?', a: 'A compressed Trie merges single-child chains into one edge with a multi-character label. Reduces space from O(total_chars) to O(n) where n is number of strings. Used in: IP routing (longest prefix match in routers), compressed string indexing. Tradeoff: more complex to implement (edge splitting on insert), but much better memory for sparse tries with long common paths.' },
  { q: 'How do you delete a word from a Trie?', a: 'Recursive deletion: (1) Traverse to the end of the word; (2) Mark isEnd = false; (3) On the way back up, delete nodes that are no longer needed (no children and not marked as word end). A node can be deleted only if: it has no children and is not the end of another word. Alternatively, just set isEnd=false without cleanup (lazy deletion) — simpler but leaves unused nodes in memory.' },
  { q: 'How is a Trie used in the Word Search II problem?', a: 'Build a Trie from the word list. Run DFS from each cell in the 2D board, traversing the Trie simultaneously. When a Trie node has isEnd=true, a word is found. Marking the node as found (isEnd=false) after finding it prevents duplicates. Pruning: if the current DFS path leads to a Trie node with no children, abort early. O(m * n * 4^L) where L is max word length, significantly pruned by the Trie.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A Trie stores words as character paths — O(L) insert/search/prefix, shared prefixes save space. Essential for autocomplete, word search, and prefix-matching problems.',
    mustKnow: [
      'TrieNode: children (Map or Array[26]) + isEnd boolean',
      'Insert: create child nodes if missing, set isEnd at word end',
      'Search checks isEnd; startsWith does not',
      'Word Search II: DFS on grid + Trie for simultaneous pruning',
      'Array[26] children: idx = ch.charCodeAt(0) - 97',
    ],
    interviewFocus: [
      'Implement Trie (insert/search/startsWith)',
      'Word Search II (grid DFS + Trie pruning)',
      'Design add/search words with wildcard \'.\' (Trie + DFS)',
    ],
  };
}
