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
  selector: 'app-dsa-hash-tables',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './hash-tables.html',
  styleUrl: './hash-tables.scss',
})
export class DsaHashTables {
  quickRef: QuickRefItem[] = [
    { name: 'Map.get/set',   type: 'method',  desc: 'O(1) average lookup and insert' },
    { name: 'Map.has',       type: 'method',  desc: 'O(1) membership check' },
    { name: 'Set.add/has',   type: 'method',  desc: 'O(1) unique element tracking' },
    { name: 'Load factor',   type: 'keyword', desc: 'n/capacity — rehash when > 0.75' },
    { name: 'Chaining',      type: 'keyword', desc: 'Collision resolution via linked list at each bucket' },
    { name: 'Open addressing',type: 'keyword',desc: 'Probing for next empty slot on collision' },
    { name: 'Two Sum pattern',type: 'syntax', desc: 'Store complement in map — O(n) with O(n) space' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Hash Tables Work',
      points: [
        'A hash function maps a key to a bucket index: index = hash(key) % capacity.',
        'A good hash function distributes keys uniformly to minimise collisions.',
        'Average case: O(1) insert, lookup, delete. Worst case: O(n) if all keys collide.',
        'JavaScript Map preserves insertion order; plain objects do not for non-string keys.',
      ],
    },
    {
      heading: 'Collision Resolution',
      points: [
        'Chaining: each bucket holds a linked list. Lookup walks the list — O(1) avg, O(n) worst.',
        'Open addressing (linear probing): probe next slots until empty. Cache-friendly but degrades with high load.',
        'Quadratic probing and double hashing reduce clustering in open addressing.',
        'Load factor threshold (typically 0.75) triggers rehashing — doubles capacity and rehashes all keys.',
      ],
    },
    {
      heading: 'Common Patterns',
      points: [
        'Two Sum: store seen values in a map, check if target - current exists — O(n).',
        'Frequency counting: map key → count; find most common element in O(n).',
        'Grouping: map key → list; group anagrams by sorted string key.',
        'Existence check: use Set for O(1) has() instead of O(n) array includes().',
      ],
    },
    {
      heading: 'When to Use Map vs Object vs Set',
      points: [
        'Map: when keys are non-string or insertion order matters; slightly slower than Object for string keys.',
        'Object: fastest for string keys in hot loops; no .size property, use Object.keys().length.',
        'Set: when you only need unique membership — no values, just keys.',
        'In interviews, Map is almost always the right choice — it\'s clearest and handles all key types.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Core Patterns',
      language: 'typescript',
      code: `// Two Sum — O(n) time, O(n) space
function twoSum(nums: number[], target: number): [number, number] {
  const seen = new Map<number, number>(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement)!, i];
    seen.set(nums[i], i);
  }
  return [-1, -1];
}

// Frequency count — most common element
function mostCommon(arr: number[]): number {
  const freq = new Map<number, number>();
  let maxCount = 0, result = arr[0];
  for (const n of arr) {
    const count = (freq.get(n) ?? 0) + 1;
    freq.set(n, count);
    if (count > maxCount) { maxCount = count; result = n; }
  }
  return result;
}

// Subarray sum equals k — O(n)
function subarraySum(nums: number[], k: number): number {
  const prefixCount = new Map([[0, 1]]); // prefix sum → count
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    count += prefixCount.get(sum - k) ?? 0;
    prefixCount.set(sum, (prefixCount.get(sum) ?? 0) + 1);
  }
  return count;
}`,
    },
    {
      label: 'Custom Hash Map',
      language: 'typescript',
      code: `// Simple hash map with chaining (for illustration)
class HashMap<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size = 0;
  private capacity: number;

  constructor(capacity = 16) {
    this.capacity = capacity;
    this.buckets = Array.from({ length: capacity }, () => []);
  }

  private hash(key: K): number {
    const str = String(key);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % this.capacity;
    }
    return h;
  }

  set(key: K, value: V): void {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    const entry = bucket.find(([k]) => k === key);
    if (entry) entry[1] = value;
    else { bucket.push([key, value]); this.size++; }
    if (this.size / this.capacity > 0.75) this.rehash();
  }

  get(key: K): V | undefined {
    const bucket = this.buckets[this.hash(key)];
    return bucket.find(([k]) => k === key)?.[1];
  }

  private rehash(): void {
    const old = this.buckets.flatMap(b => b);
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.size = 0;
    for (const [k, v] of old) this.set(k, v);
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using array includes() instead of Set.has()',
      wrong: `const seen: number[] = [];
if (seen.includes(x)) { ... } // O(n) per lookup`,
      right: `const seen = new Set<number>();
if (seen.has(x)) { ... } // O(1) per lookup`,
      explanation: 'Array.includes() is O(n). Set.has() is O(1). For repeated membership checks, always use a Set.',
    },
    {
      title: 'Forgetting to handle hash collisions in custom implementations',
      wrong: `// Direct slot storage — overwrites on collision
buckets[hash(key)] = [key, value];`,
      right: `// Chaining — each slot holds a list
buckets[hash(key)].push([key, value]);`,
      explanation: 'Two keys can hash to the same index. Chaining or probing must handle this.',
    },
    {
      title: 'Using object keys for non-string types',
      wrong: `const map: Record<any, number> = {};
map[[1,2]] = 5; // key becomes "[1,2]" string — unexpected`,
      right: `const map = new Map<number[], number>();
map.set([1,2], 5); // reference equality — but use primitives as keys`,
      explanation: 'Object keys are always coerced to strings. Use Map for non-string keys, but note Map uses reference equality for objects.',
    },
    {
      title: 'Not initialising the default value in frequency maps',
      wrong: `freq[key]++; // NaN if key doesn't exist yet`,
      right: `freq.set(key, (freq.get(key) ?? 0) + 1);`,
      explanation: 'undefined + 1 = NaN. Always initialise with a default (0, [], etc.) before incrementing.',
    },
    {
      title: 'Assuming O(1) for hash map in all cases',
      wrong: `// Hash map lookup is always O(1)`,
      right: `// O(1) average, O(n) worst case with many collisions. Interviews assume O(1) average.`,
      explanation: 'Worst-case hash map is O(n). Always say "O(1) amortised average" to be precise.',
    },
  ];

  challenge: Challenge = {
    title: 'Longest Consecutive Sequence',
    language: 'typescript',
    description: 'Given an unsorted array of integers, return the length of the longest consecutive elements sequence in O(n) time.',
    hints: ['Put all numbers in a Set for O(1) lookup', 'Only start counting from the sequence\'s beginning (no n-1 in set)', 'This avoids the O(n²) naive approach'],
    starterCode: `function longestConsecutive(nums: number[]): number {
  // Your O(n) solution here
}

// longestConsecutive([100,4,200,1,3,2]) → 4 (sequence: 1,2,3,4)
// longestConsecutive([0,3,7,2,5,8,4,6,0,1]) → 9`,
    solution: `function longestConsecutive(nums: number[]): number {
  const numSet = new Set(nums);
  let longest = 0;
  for (const n of numSet) {
    if (!numSet.has(n - 1)) { // start of a sequence
      let current = n, length = 1;
      while (numSet.has(current + 1)) { current++; length++; }
      longest = Math.max(longest, length);
    }
  }
  return longest;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What triggers a hash table rehash?',
      options: ['When any collision occurs', 'When load factor exceeds threshold (typically 0.75)', 'When capacity is reached', 'Every n insertions'],
      answer: 1,
      explanation: 'Rehashing happens when load factor (n/capacity) exceeds a threshold. This keeps lookup times near O(1).',
    },
    {
      q: 'What is the worst-case time complexity of a hash map lookup?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      answer: 2,
      explanation: 'If all keys hash to the same bucket, lookup degrades to O(n) (scanning the whole collision chain).',
    },
    {
      q: 'Which approach solves Two Sum in O(n)?',
      options: ['Sort and binary search', 'Nested loops', 'Hash map storing seen values', 'Two pointers'],
      answer: 2,
      explanation: 'Store each value in a map. For each element, check if target - element exists in the map — O(1) per check, O(n) total.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Map and object {} in JavaScript?',
      a: 'Map supports any key type (not just strings), preserves insertion order, has a .size property, and is slightly slower for pure string keys. Object is faster for string/symbol keys but coerces all keys to strings. In interviews, use Map for clarity and correctness.',
    },
    {
      q: 'How do you handle hash map problems where keys are composite (e.g. pairs)?',
      a: 'Encode the composite key as a string: `${row},${col}` for coordinate pairs. This gives O(1) lookup using a string key. Alternatively, use a nested Map: Map<number, Map<number, V>>.',
    },
    {
      q: 'When is a hash map NOT the right choice?',
      a: 'When you need sorted order (use a BST/TreeMap instead), when keys are objects needing deep equality (Map uses reference equality), or when memory is very constrained and the load factor is high.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Hash tables give O(1) average insert/lookup/delete by mapping keys to bucket indices — the go-to structure for frequency counting, caching, and existence checks.',
    mustKnow: [
      'O(1) average, O(n) worst case — collisions cause degradation',
      'Chaining vs open addressing for collision resolution',
      'Load factor → rehash at ~0.75 to maintain performance',
      'Two Sum pattern: map complement → index',
      'Use Set for O(1) membership; Map for key-value pairs',
    ],
    interviewFocus: [
      'Two sum (complement map)',
      'Subarray sum = k (prefix sum + map)',
      'Longest consecutive sequence (Set + start-of-sequence check)',
    ],
  };
}
