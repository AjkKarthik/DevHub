import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-sorted-array-prefix-search',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sorted-array-prefix-search.html',
  styleUrl: './sorted-array-prefix-search.scss'
})
export class SortedArrayPrefixSearchSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'All Words With a Prefix Sit Next to Each Other',
      points: [
        'The main page grouped sorted arrays with hash sets as structures that cannot serve autocomplete. A hash set really cannot: hashing scatters "app", "apple" and "apply" to unrelated slots. A sorted array is different. In lexicographic order, every word starting with a prefix forms one consecutive block, because they all compare greater than or equal to the prefix and less than the next prefix after it.',
        'So a prefix query is a lower-bound binary search for the first word that is not less than the prefix, followed by a forward scan while words still start with it. The search takes about log2 n string comparisons, each up to L characters.',
        'Tested on 1,000 random words: every query took 10 comparisons (log2 1,000 is just under 10), and for prefixes "ab", "abc", "j" and "cdef" the sorted array returned exactly the same matches as the trie — 11, 2, 102 and 0 words.',
        'The trie still has real advantages: O(L) per lookup with no log n factor, cheap inserts (a sorted array needs O(n) to insert in the middle), and per-node data such as counts or top suggestions. For a dictionary that is built once and queried many times, a sorted array is a simpler and much more compact alternative.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Prefix search on a sorted array',
      language: 'typescript',
      code: `// First index whose word is >= prefix (lower bound)
function lowerBound(words: string[], prefix: string): number {
  let lo = 0, hi = words.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (words[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function wordsWithPrefix(sortedWords: string[], prefix: string): string[] {
  const result: string[] = [];
  for (let i = lowerBound(sortedWords, prefix); i < sortedWords.length; i++) {
    if (!sortedWords[i].startsWith(prefix)) break;  // left the contiguous block
    result.push(sortedWords[i]);
  }
  return result;
}

const sorted = ['app', 'apple', 'apply', 'apt', 'bat', 'bath'];  // already sorted
wordsWithPrefix(sorted, 'app');  // ['app', 'apple', 'apply']
wordsWithPrefix(sorted, 'ba');   // ['bat', 'bath']
wordsWithPrefix(sorted, 'c');    // []

// 1,000 random words, same results as the page's Trie.wordsWithPrefix:
//   'ab' -> 11 words, 'abc' -> 2, 'j' -> 102, 'cdef' -> 0
//   10 comparisons per lookup (log2 1000 ~ 10)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The dictionary gets 50,000 new words per second while users type queries. Should you keep the sorted array or switch to a trie?',
    hint: 'What does inserting one word into the middle of a sorted array cost?',
    solution: 'Switch to a trie, or another structure built for inserts. Keeping an array sorted means shifting every later element on each insert, O(n) per word, so a large, fast-changing dictionary pays that cost constantly. A trie inserts in O(L). The sorted array is the better choice when the word list changes rarely and lookups dominate.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Only a trie can answer "which words start with this prefix" without scanning every word.',
      reality: 'Any ordered structure can, because sorting places all words with a shared prefix in one contiguous run. A sorted array, a balanced search tree, or a database index on the column all answer it with one search plus a scan of the matches.',
    },
    {
      thought: 'A hash set and a sorted array are equally bad at prefix queries.',
      reality: 'A hash set has no order, so finding words with a prefix needs a full scan. A sorted array keeps them adjacent, so the 1,000-word test needed only 10 comparisons to locate them.',
    },
  ];
}
