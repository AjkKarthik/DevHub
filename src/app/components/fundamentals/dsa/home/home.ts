import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Arrays & Strings': 'arrays', 'Linked Lists': 'linked',
  'Trees & Graphs': 'trees', 'Sorting': 'sorting', 'Dynamic Programming': 'dp',
  'Algorithms': 'algorithms', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Sorting', 'Dynamic Programming', 'Algorithms', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Big-O Notation', route: '/dsa/big-o', badge: 'Foundations', description: 'Time and space complexity — O(1), O(log n), O(n), O(n log n), O(n²) and how to analyse algorithms.', keyPoints: ['Time vs space complexity', 'Best, average, worst case', 'Amortised complexity', 'Drop constants and lower terms', 'Common complexity classes'], available: true },
  { title: 'Arrays', route: '/dsa/arrays', badge: 'Arrays & Strings', description: 'Static and dynamic arrays, access, insert, delete, two-pointer and sliding window techniques.', keyPoints: ['O(1) random access', 'Dynamic resizing (ArrayList)', 'Two-pointer technique', 'Sliding window pattern', 'Prefix sum array'], available: true },
  { title: 'Strings', route: '/dsa/strings', badge: 'Arrays & Strings', description: 'String manipulation, anagram detection, palindromes, KMP pattern matching, and rolling hash.', keyPoints: ['String immutability', 'Anagram via character count', 'Palindrome two-pointer', 'KMP algorithm O(n+m)', 'Rolling hash Rabin-Karp'], available: true },
  { title: 'Hash Tables', route: '/dsa/hash-tables', badge: 'Arrays & Strings', description: 'Hash functions, collision handling (chaining, open addressing), and HashMap/HashSet operations.', keyPoints: ['Hash function design', 'Chaining vs open addressing', 'Load factor and rehashing', 'O(1) average lookup', 'Use cases: caching, counting'], available: true },
  { title: 'Stacks & Queues', route: '/dsa/stacks-queues', badge: 'Arrays & Strings', description: 'Stack (LIFO), queue (FIFO), deque, monotonic stack, and their array/linked list implementations.', keyPoints: ['Stack push/pop O(1)', 'Queue enqueue/dequeue', 'Monotonic stack pattern', 'BFS uses queue', 'DFS uses stack (or recursion)'], available: true },
  { title: 'Singly Linked Lists', route: '/dsa/linked-lists', badge: 'Linked Lists', description: 'Node structure, insertion, deletion, traversal, reversal, and cycle detection with Floyd\'s algorithm.', keyPoints: ['Node with value + next', 'Insert at head/tail O(1)/O(n)', 'Reverse iteratively', 'Floyd cycle detection', 'Middle node — slow/fast pointer'], available: true },
  { title: 'Doubly Linked Lists', route: '/dsa/doubly-linked-lists', badge: 'Linked Lists', description: 'Doubly linked lists, prev pointer, LRU cache implementation, and XOR linked list trick.', keyPoints: ['prev + next pointers', 'O(1) delete with reference', 'LRU cache with HashMap + DLL', 'Sentinel dummy nodes', 'XOR linked list memory trick'], available: true },
  { title: 'Binary Trees', route: '/dsa/binary-trees', badge: 'Trees & Graphs', description: 'Tree traversals (inorder, preorder, postorder, level-order), height, diameter, and path problems.', keyPoints: ['Inorder: left → root → right', 'Preorder: root → left → right', 'BFS level-order traversal', 'Tree height recursion', 'Lowest common ancestor'], available: true },
  { title: 'Binary Search Trees', route: '/dsa/bst', badge: 'Trees & Graphs', description: 'BST insert, delete, search, and balancing — AVL and Red-Black tree concepts.', keyPoints: ['BST property: left < root < right', 'Search O(log n) balanced', 'Inorder gives sorted order', 'AVL rotation rebalancing', 'Red-Black tree invariants'], available: true },
  { title: 'Heaps & Priority Queues', route: '/dsa/heaps', badge: 'Trees & Graphs', description: 'Min/max heap, heapify, heap sort, and priority queue use cases — k-th largest, merge k lists.', keyPoints: ['Min heap: parent ≤ children', 'Insert and extract-min O(log n)', 'Build heap O(n)', 'Heap sort O(n log n)', 'K-th largest with min heap size k'], available: true },
  { title: 'Graphs — BFS & DFS', route: '/dsa/graphs-bfs-dfs', badge: 'Trees & Graphs', description: 'Graph representations, BFS for shortest path (unweighted), DFS for connectivity and cycle detection.', keyPoints: ['Adjacency list vs matrix', 'BFS shortest path O(V+E)', 'DFS iterative vs recursive', 'Cycle detection (visited states)', 'Connected components'], available: true },
  { title: 'Graph Algorithms', route: '/dsa/graph-algorithms', badge: 'Trees & Graphs', description: 'Dijkstra, Bellman-Ford, topological sort, Union-Find, and minimum spanning tree (Kruskal/Prim).', keyPoints: ['Dijkstra O(E log V)', 'Bellman-Ford negative weights', 'Topological sort (Kahn\'s)', 'Union-Find path compression', 'Kruskal MST with sorting'], available: true },
  { title: 'Bubble, Selection & Insertion Sort', route: '/dsa/basic-sorts', badge: 'Sorting', description: 'Simple O(n²) sorts — when to use them, how they work, and invariants.', keyPoints: ['Bubble: swap adjacent', 'Selection: find min each pass', 'Insertion: build sorted prefix', 'All O(n²) worst case', 'Insertion O(n) on nearly sorted'], available: true },
  { title: 'Merge Sort & Quick Sort', route: '/dsa/advanced-sorts', badge: 'Sorting', description: 'Divide-and-conquer sorting — merge sort stability, quick sort pivot selection, and 3-way partition.', keyPoints: ['Merge sort O(n log n) stable', 'Merge sort O(n) extra space', 'Quick sort O(n log n) average', 'Random pivot selection', '3-way partition for duplicates'], available: true },
  { title: 'Binary Search', route: '/dsa/binary-search', badge: 'Sorting', description: 'Classic binary search and its variants — leftmost/rightmost insertion, rotated arrays, and search space.', keyPoints: ['O(log n) on sorted arrays', 'Left and right boundary variants', 'Search in rotated array', 'Binary search on answer', 'Overflow-safe midpoint'], available: true },
  { title: 'Recursion & Backtracking', route: '/dsa/recursion-backtracking', badge: 'Algorithms', description: 'Recursive thinking, call stack, memoisation, and backtracking for permutations, subsets, and N-queens.', keyPoints: ['Base case + recursive case', 'Call stack depth = O(n)', 'Backtracking: undo choice', 'Permutations and subsets', 'N-Queens constraint solving'], available: true },
  { title: 'Dynamic Programming', route: '/dsa/dynamic-programming', badge: 'Dynamic Programming', description: 'Overlapping subproblems and optimal substructure — top-down memoisation vs bottom-up tabulation.', keyPoints: ['Memoisation (top-down)', 'Tabulation (bottom-up)', 'Fibonacci as DP intro', 'State definition is key', '0/1 knapsack pattern'], available: true },
  { title: 'DP Patterns', route: '/dsa/dp-patterns', badge: 'Dynamic Programming', description: 'Classic DP patterns: LCS, LIS, coin change, edit distance, matrix chain, and interval DP.', keyPoints: ['Longest Common Subsequence', 'Longest Increasing Subsequence O(n log n)', 'Coin change unbounded knapsack', 'Edit distance 2D DP table', 'Interval DP for burst balloons'], available: true },
  { title: 'Trie', route: '/dsa/trie', badge: 'Algorithms', description: 'Prefix tree for autocomplete, word search, and efficient prefix lookup.', keyPoints: ['TrieNode with children array/map', 'Insert and search O(L)', 'StartsWith prefix query', 'Word search II (Trie + backtrack)', 'Memory vs HashMap trade-off'], available: true },
  { title: 'Bit Manipulation', route: '/dsa/bit-manipulation', badge: 'Reference', description: 'AND, OR, XOR, shifts, bit tricks — counting bits, finding single number, and power of 2 checks.', keyPoints: ['n & (n-1) clears lowest set bit', 'n ^ n = 0 for deduplication', 'Left shift = multiply by 2', 'Check power of 2: n & (n-1) == 0', 'Brian Kernighan\'s bit count'], available: true },
  { title: 'Greedy Algorithms', route: '/dsa/greedy', badge: 'Reference', description: 'Activity selection, interval scheduling, jump game, and proving greedy correctness.', keyPoints: ['Make locally optimal choice', 'Interval scheduling by end time', 'Jump game greedy reach', 'Huffman coding', 'Exchange argument proof'], available: true },
];

@Component({ selector: 'app-dsa-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class DsaHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
