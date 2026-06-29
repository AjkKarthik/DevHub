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
  selector: 'app-dsa-strings',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './strings.html',
  styleUrl: './strings.scss',
})
export class DsaStrings {
  quickRef: QuickRefItem[] = [
    { name: 'Anagram check',    type: 'syntax',  desc: 'Sort both strings or use char frequency map — O(n)' },
    { name: 'Palindrome check', type: 'syntax',  desc: 'Two pointers from both ends — O(n) time, O(1) space' },
    { name: 'KMP search',       type: 'syntax',  desc: 'Find pattern in text — O(n+m) using failure function' },
    { name: 'Rolling hash',     type: 'syntax',  desc: 'Rabin-Karp substring search — O(n+m) average' },
    { name: 'split/join',       type: 'method',  desc: 'O(n) split by delimiter; O(n) join array to string' },
    { name: 'substring',        type: 'method',  desc: 'O(k) to extract k chars; naive search is O(nm)' },
    { name: 'charCodeAt',       type: 'method',  desc: 'Convert char to ASCII — key for char frequency maps' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'String Immutability and Building',
      points: [
        'In JavaScript/TypeScript, strings are immutable — every concatenation creates a new string.',
        'Repeated concatenation in a loop is O(n²) — use an array and join() at the end for O(n).',
        'String comparison is O(min(m,n)) — not O(1). Hashing enables O(1) average comparison.',
        'Unicode complicates length: emoji/surrogate pairs can be 1 JS char but multiple bytes.',
      ],
    },
    {
      heading: 'Anagram Detection',
      points: [
        'Two strings are anagrams if they contain the same characters with the same frequencies.',
        'Method 1: sort both → compare. O(n log n) time, O(1) space (ignoring sort overhead).',
        'Method 2: character frequency map. O(n) time, O(1) space (26 letters = constant).',
        'Group anagrams: use sorted string as key → O(n × k log k) where k = max word length.',
      ],
    },
    {
      heading: 'Palindrome Patterns',
      points: [
        'Simple palindrome: two pointers from both ends comparing chars — O(n) time, O(1) space.',
        'Longest palindromic substring: expand around each centre — O(n²) time, O(1) space.',
        'Manacher\'s algorithm finds all palindromic substrings in O(n) — rarely needed in interviews.',
        'Valid palindrome ignoring non-alphanumeric: clean the string or skip chars during comparison.',
      ],
    },
    {
      heading: 'Pattern Matching',
      points: [
        'Naive: check every position — O(nm) where n = text length, m = pattern length.',
        'KMP (Knuth-Morris-Pratt): build failure function in O(m), then search in O(n). Total O(n+m).',
        'Rabin-Karp: hash the pattern, slide a rolling hash over the text — O(n+m) average.',
        'In interviews, use String.indexOf() (O(nm)) unless asked for better — optimise only if asked.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Anagram & Palindrome',
      language: 'typescript',
      code: `// Anagram check — O(n) with frequency map
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every(c => c === 0);
}

// Palindrome check — two pointers O(n)
function isPalindrome(s: string): boolean {
  let left = 0, right = s.length - 1;
  while (left < right) {
    while (left < right && !isAlphanumeric(s[left])) left++;
    while (left < right && !isAlphanumeric(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++; right--;
  }
  return true;
}
function isAlphanumeric(c: string) { return /[a-zA-Z0-9]/.test(c); }

// Longest palindromic substring — expand around centre O(n²)
function longestPalindrome(s: string): string {
  let start = 0, maxLen = 1;
  function expand(l: number, r: number) {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    if (r - l - 1 > maxLen) { maxLen = r - l - 1; start = l + 1; }
  }
  for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); }
  return s.substring(start, start + maxLen);
}`,
    },
    {
      label: 'Group Anagrams & KMP',
      language: 'typescript',
      code: `// Group anagrams — O(n * k log k)
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return [...map.values()];
}

// KMP pattern search — O(n+m)
function kmpSearch(text: string, pattern: string): number[] {
  const results: number[] = [];
  const m = pattern.length;
  // Build failure function
  const fail = new Array(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) k = fail[k - 1];
    if (pattern[k] === pattern[i]) k++;
    fail[i] = k;
  }
  // Search
  k = 0;
  for (let i = 0; i < text.length; i++) {
    while (k > 0 && pattern[k] !== text[i]) k = fail[k - 1];
    if (pattern[k] === text[i]) k++;
    if (k === m) { results.push(i - m + 1); k = fail[k - 1]; }
  }
  return results;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'String concatenation in a loop — O(n²)',
      wrong: `let result = '';
for (const ch of chars) result += ch; // creates new string each time`,
      right: `const parts: string[] = [];
for (const ch of chars) parts.push(ch);
const result = parts.join(''); // O(n)`,
      explanation: 'Each += creates a new string. Use an array and join() for linear time.',
    },
    {
      title: 'Forgetting strings are case-sensitive',
      wrong: `if (s === t)  // "Abc" !== "abc"`,
      right: `if (s.toLowerCase() === t.toLowerCase())`,
      explanation: 'Unless told otherwise, always normalise case before comparing in string problems.',
    },
    {
      title: 'Using sort for anagram check when O(n) suffices',
      wrong: `return s.split('').sort().join('') === t.split('').sort().join(''); // O(n log n)`,
      right: `// char frequency map — O(n) time, O(1) space (26 letters = constant)`,
      explanation: 'Sorting is correct but slower. For fixed alphabets, a frequency array is O(n) and O(1) space.',
    },
    {
      title: 'Mutating strings via indexing',
      wrong: `s[0] = 'X'; // silently does nothing — strings are immutable`,
      right: `const arr = s.split(''); arr[0] = 'X'; s = arr.join('');`,
      explanation: 'JavaScript strings are immutable. Convert to array, modify, then rejoin.',
    },
    {
      title: 'Using indexOf for all pattern searches',
      wrong: `// indexOf is O(n*m) — fine for most cases but can TLE on long inputs`,
      right: `// For multiple pattern searches in a long text, use KMP O(n+m)`,
      explanation: 'indexOf is fine for single searches. If you\'re doing many searches or the interviewer asks for optimal, use KMP.',
    },
  ];

  challenge: Challenge = {
    title: 'Minimum Window Substring',
    language: 'typescript',
    description: 'Given strings s and t, return the minimum window in s that contains all characters of t. Return "" if no window exists.',
    hints: ['Use a sliding window with two frequency maps', 'Track how many chars are currently satisfied', 'Shrink the left pointer when all chars are covered'],
    starterCode: `function minWindow(s: string, t: string): string {
  // Your solution here
}

// minWindow("ADOBECODEBANC", "ABC") → "BANC"
// minWindow("a", "a") → "a"
// minWindow("a", "aa") → ""`,
    solution: `function minWindow(s: string, t: string): string {
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  const window = new Map<string, number>();
  let have = 0, required = need.size;
  let left = 0, minLen = Infinity, minStart = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) ?? 0) + 1);
    if (need.has(c) && window.get(c) === need.get(c)) have++;
    while (have === required) {
      if (right - left + 1 < minLen) { minLen = right - left + 1; minStart = left; }
      const lc = s[left++];
      window.set(lc, window.get(lc)! - 1);
      if (need.has(lc) && window.get(lc)! < need.get(lc)!) have--;
    }
  }
  return minLen === Infinity ? '' : s.substring(minStart, minStart + minLen);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of checking if two strings are anagrams using a character frequency map?',
      options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(1)'],
      answer: 1,
      explanation: 'One pass to build the frequency map, one pass to verify — O(n) with O(1) space for fixed alphabet.',
    },
    {
      q: 'KMP pattern matching has which time complexity?',
      options: ['O(nm)', 'O(n + m)', 'O(n log m)', 'O(m²)'],
      answer: 1,
      explanation: 'KMP builds the failure function in O(m) and searches in O(n), giving O(n + m) total.',
    },
    {
      q: 'Why is repeated string concatenation in a loop O(n²)?',
      options: ['Strings are sorted each time', 'Each concatenation creates a new string and copies all previous chars', 'Memory allocation is quadratic', 'String hashing takes O(n)'],
      answer: 1,
      explanation: 'str += char copies the entire current string each time — total copies = 1+2+...+n = O(n²).',
    },
  { q: 'What is the time complexity of the KMP string matching algorithm?', options: ['O(n * m)', 'O(n + m)', 'O(n log n)', 'O(m^2)'], answer: 1, explanation: 'KMP (Knuth-Morris-Pratt): O(n + m) where n is text length and m is pattern length. Preprocessing builds the failure function (LPS array) in O(m). Matching runs in O(n) by using the LPS array to avoid redundant comparisons.' },
  { q: 'What is the Rabin-Karp algorithm used for?', options: ['Finding the longest palindrome', 'Multiple pattern matching using rolling hash', 'Checking string anagrams', 'Counting distinct substrings'], answer: 1, explanation: 'Rabin-Karp uses a rolling hash to efficiently search for a pattern in text. O(n + m) average case. Strength: can search for multiple patterns simultaneously. Used in plagiarism detection, DNA sequence matching. Worst case O(nm) on hash collisions.' },
  { q: 'How do you find the longest palindromic substring efficiently?', options: ['Check all substrings: O(n^3)', 'Expand around each center: O(n^2)', 'Manacher algorithm: O(n)', 'Both B and C are O(n)'], answer: 2, explanation: 'Manacher algorithm finds the longest palindromic substring in O(n) by computing palindrome radii for each center using previously computed information. Practical O(n^2) expand-around-center is acceptable for most interviews (n <= 10^3).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I sort vs use a frequency map for anagram problems?',
      a: 'Sorting is O(n log n) but conceptually simpler and good for grouping anagrams (sorted string as key). Frequency map is O(n) time and O(1) space for a fixed alphabet — prefer it when checking two strings are anagrams and performance matters.',
    },
    {
      q: 'What is the rolling hash and why is it useful?',
      a: 'A rolling hash (Rabin-Karp) computes the hash of a window in O(1) by removing the outgoing character\'s contribution and adding the incoming character\'s. This enables O(n) average substring search and O(n) duplicate substring detection — useful for problems like longest duplicate substring.',
    },
    {
      q: 'How do you handle Unicode strings in interviews?',
      a: 'Mention it as a clarification: "I\'ll assume ASCII/English for now." If Unicode matters, use a Map instead of a fixed 26-size array, and be aware that some characters (emoji, CJK) may span multiple code units in JS.',
    },
  { q: 'How do you check if two strings are anagrams of each other?', a: 'Sort both strings and compare: O(n log n). Or use a frequency count array (for fixed alphabets): count chars in s1 (increment), count chars in s2 (decrement); if all counts are 0, they are anagrams. O(n) time O(k) space (k = alphabet size). For general Unicode: use a hash map. Extension: find all anagram substrings in a text (sliding window with frequency map).' },
  { q: 'What is the Z-algorithm and how does it work?', a: 'Z-algorithm computes Z[i] = length of the longest substring starting at i that is also a prefix of the string. O(n). Used for: pattern matching (concatenate pattern + separator + text, look for Z values = pattern length), finding all occurrences of a pattern. Simpler to implement than KMP with similar performance. Z[0] is undefined (conventionally the string length or 0).' },
  { q: 'How do you efficiently count distinct substrings of a string?', a: 'Suffix Array + LCP array: total distinct substrings = n*(n+1)/2 - sum(LCP). Suffix array sorts all suffixes lexicographically in O(n log n) or O(n). LCP (Longest Common Prefix) array between adjacent sorted suffixes is computed in O(n) using Kasai algorithm. Alternative: Suffix Automaton counts distinct substrings in O(n). Both O(n) for counting once built.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Strings are immutable arrays of characters — use frequency maps for anagram problems, two pointers for palindromes, and sliding window for substring problems.',
    mustKnow: [
      'String concatenation in loops is O(n²) — use array + join()',
      'Anagram: sort O(n log n) or frequency map O(n)',
      'Palindrome: two pointers from ends O(n) O(1) space',
      'Sliding window for longest substring without repeats, min window substring',
      'KMP for O(n+m) pattern search — know the concept even if you implement indexOf',
    ],
    interviewFocus: [
      'Valid anagram (frequency map or sort)',
      'Longest substring without repeating characters (sliding window)',
      'Minimum window substring (sliding window + two maps)',
    ],
  };
}
