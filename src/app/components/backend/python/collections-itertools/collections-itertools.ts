import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-python-collections-itertools',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './collections-itertools.html',
  styleUrl: './collections-itertools.scss'
})
export class PythonCollectionsItertools {
  readingTime = 20; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.x';
  route = 'py-collections-itertools'; nextRoute = '/python/asyncio'; nextLabel = 'Async Python (asyncio)';

  quickRef: QuickRefItem[] = [
    { name: 'Counter(iterable)', type: 'class', desc: 'Frequency map. most_common(n) returns top n items. Counter supports +, -, &, | (union/intersection).' },
    { name: 'defaultdict(factory)', type: 'class', desc: 'Dict that auto-creates missing keys. defaultdict(list) for grouping; defaultdict(int) for counting.' },
    { name: 'deque(maxlen=N)', type: 'class', desc: 'Double-ended queue. O(1) appendleft/popleft. maxlen auto-evicts oldest when full. Thread-safe append/pop.' },
    { name: 'ChainMap(*maps)', type: 'class', desc: 'Logical view of multiple dicts. Reads from first dict with key; writes always go to first map. Good for layered config.' },
    { name: 'OrderedDict', type: 'class', desc: 'Dict that remembers insertion order (all dicts do since 3.7). OrderedDict.move_to_end(key) and reversed() are extras.' },
    { name: 'namedtuple(name, fields)', type: 'function', desc: 'Immutable tuple subclass with named fields. Lighter than dataclass. Use typing.NamedTuple for type-annotated version.' },
    { name: 'heapq.nlargest(n, it)', type: 'function', desc: 'Returns n largest items. nsmallest(n, it) for smallest. heappush/heappop for a min-heap.' },
    { name: 'itertools.accumulate(it)', type: 'function', desc: 'Running total (or custom binary fn). accumulate([1,2,3]) → [1, 3, 6]. Like reduce but yields intermediate results.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Counter, defaultdict, and deque',
      points: [
        'Counter(iterable) builds a frequency map in one line. Counter("banana") → {"b":1,"a":3,"n":2}. Counter supports arithmetic: c1 + c2 adds counts; c1 - c2 subtracts (drops zeros and negatives); c1 & c2 minimum; c1 | c2 maximum. most_common(n) returns the n highest-frequency items in sorted order.',
        'defaultdict(factory) behaves like a regular dict but calls factory() when a key is missing. defaultdict(list) is the idiomatic way to group items: for item in data: groups[item.category].append(item). Without defaultdict, you need if category not in groups: groups[category] = []. The factory can be any zero-argument callable: defaultdict(lambda: "unknown").',
        'deque (double-ended queue) supports O(1) append and appendleft, pop and popleft. A list has O(n) insert at position 0. deque(maxlen=N) creates a bounded queue — when full, appending to one end automatically removes from the other. This makes deque ideal for sliding windows and fixed-size history buffers. deque append/pop are thread-safe (GIL protects single operations).',
        'heapq implements a min-heap on a plain list. heapq.heapify(lst) rearranges in O(n). heapq.heappush(heap, item) and heappop(heap) maintain the heap invariant in O(log n). heapq.nlargest(k, iterable, key=fn) is more efficient than sorted(iterable, reverse=True)[:k] for large iterables when k is small.',
      ]
    },
    {
      heading: 'ChainMap, OrderedDict, and namedtuple',
      points: [
        'ChainMap(*maps) provides a logical view of multiple dicts without merging them. Key lookups scan maps left to right and return the first match. Writes and deletes always affect the first map. This is perfect for layered config: local_config = ChainMap(cli_args, env_vars, file_config, defaults) — CLI overrides env, env overrides file.',
        'OrderedDict is like a regular dict with additional methods: move_to_end(key, last=True) moves a key to the end (or beginning with last=False); popitem(last=True) removes and returns the last (or first) item. Since Python 3.7, all dicts maintain insertion order, so OrderedDict is mainly used when you need move_to_end or reversed(ordered_dict).',
        'collections.namedtuple("Point", ["x", "y"]) creates an immutable tuple subclass with named attributes. p = Point(1, 2); p.x == 1; p[0] == 1. _asdict() converts to a dict; _replace(x=5) creates a copy with changed fields. typing.NamedTuple is the modern typed form: class Point(NamedTuple): x: float; y: float.',
        'UserDict, UserList, UserString are wrapper classes designed for subclassing when you need to customise the built-in collections. Subclassing list or dict directly can lead to subtle bugs (methods calling each other in unexpected ways); UserList/UserDict delegate to self.data which you can safely override.',
      ]
    },
    {
      heading: 'itertools — Lazy Combinatorics and More',
      points: [
        'itertools.product(*iterables, repeat=1) generates the Cartesian product lazily — equivalent to nested for loops. product("AB", "12") → ("A","1"), ("A","2"), ("B","1"), ("B","2"). product(range(2), repeat=3) → all 3-bit binary strings. Useful for parameter grid search without building a list of lists.',
        'itertools.combinations(it, r) yields r-length tuples without replacement, in sorted order. combinations_with_replacement allows repeated elements. itertools.permutations(it, r) yields all ordered arrangements. These are lazy — for large r and n, total count is C(n,r) or P(n,r), so only iterate if you can process each tuple immediately.',
        'itertools.accumulate(it, fn, initial=None) yields running totals. accumulate([1,2,3,4]) → [1,3,6,10]. With a custom fn: accumulate([2,3,4], operator.mul) → [2,6,24] (running product). initial (Python 3.8+) adds a value before the first element. This is the sequence-building equivalent of reduce().',
        'itertools.zip_longest(*iterables, fillvalue=None) zips iterables of different lengths, padding the shorter ones with fillvalue. Regular zip() stops at the shortest. itertools.starmap(fn, iterable) is like map(fn, *args) for an iterable of argument tuples: starmap(pow, [(2,5),(3,2)]) → [32, 9].',
      ]
    },
    {
      heading: 'functools — Reduce, Cached, and Singledispatch',
      points: [
        'functools.reduce(fn, iterable, initial) applies fn cumulatively: reduce(lambda a, b: a * b, [1,2,3,4], 1) → 24 (factorial). Remove from builtins in Python 3 — must import. For common reductions (sum, product, any, all, max, min), built-in functions are clearer. Use reduce for custom aggregations.',
        'functools.cached_property (Python 3.8) is like @property but caches the computed result on the instance after the first call. Unlike @lru_cache, it stores the result in the instance __dict__, so it is per-instance and automatically collected with the instance. Ideal for expensive computations that depend on instance state.',
        'functools.singledispatch creates a generic function that dispatches based on the type of the first argument: @singledispatch def render(obj): ...; @render.register(int) def _(n): return str(n). This is Python\'s way of achieving function overloading. Use for type-specific serialisers or renderers without isinstance chains.',
        'functools.total_ordering fills in missing comparison methods. Define __eq__ and one of __lt__, __le__, __gt__, __ge__ — total_ordering derives the rest. Simpler than defining all six comparison methods, at a small performance cost (each missing method goes through the derived implementation).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Counter, defaultdict, deque',
      language: 'typescript',
      code: `from collections import Counter, defaultdict, deque, ChainMap, namedtuple
import heapq

# Counter
words = "the cat sat on the mat the cat".split()
freq = Counter(words)
print(freq.most_common(3))   # [('the', 3), ('cat', 2), ('sat', 1)]
print(freq["the"])            # 3
print(freq["dog"])            # 0 (not KeyError)

c1, c2 = Counter(a=3, b=1), Counter(a=1, b=2)
print(c1 + c2)  # Counter({'a': 4, 'b': 3})
print(c1 - c2)  # Counter({'a': 2}) — negatives dropped
print(c1 & c2)  # Counter({'b': 1, 'a': 1}) — minimum
print(c1 | c2)  # Counter({'a': 3, 'b': 2}) — maximum

# defaultdict — group by category
from typing import NamedTuple
class Order(NamedTuple): category: str; amount: float

orders = [Order("books", 12.5), Order("food", 5.0), Order("books", 8.0)]
by_category: dict[str, list[Order]] = defaultdict(list)
for order in orders:
    by_category[order.category].append(order)

# deque — sliding window (last 5 readings)
window = deque(maxlen=5)
for reading in range(10):
    window.append(reading)
    print(list(window))    # never grows beyond 5

# heapq — top-K items
data = [5, 1, 9, 3, 7, 2, 8, 4, 6]
print(heapq.nlargest(3, data))   # [9, 8, 7]
print(heapq.nsmallest(3, data))  # [1, 2, 3]

# min-heap for priority queue
heap = []
heapq.heappush(heap, (2, "task B"))
heapq.heappush(heap, (1, "task A"))
heapq.heappush(heap, (3, "task C"))
print(heapq.heappop(heap))   # (1, "task A") — lowest priority first`
    },
    {
      label: 'itertools & functools',
      language: 'typescript',
      code: `import itertools, functools, operator

# accumulate — running totals
data = [1, 2, 3, 4, 5]
print(list(itertools.accumulate(data)))                        # [1, 3, 6, 10, 15]
print(list(itertools.accumulate(data, operator.mul)))          # [1, 2, 6, 24, 120] (factorial)
print(list(itertools.accumulate(data, initial=0)))             # [0, 1, 3, 6, 10, 15]

# product — Cartesian product
print(list(itertools.product("AB", "12")))  # [('A','1'),('A','2'),('B','1'),('B','2')]
print(list(itertools.product(range(2), repeat=3)))  # all 3-bit binary strings

# combinations / permutations
items = [1, 2, 3]
print(list(itertools.combinations(items, 2)))   # [(1,2),(1,3),(2,3)]
print(list(itertools.permutations(items, 2)))   # [(1,2),(1,3),(2,1),(2,3),(3,1),(3,2)]

# zip_longest
a, b = [1, 2, 3], ["x", "y"]
print(list(itertools.zip_longest(a, b, fillvalue=0)))  # [(1,'x'),(2,'y'),(3,0)]

# starmap
print(list(itertools.starmap(pow, [(2, 5), (3, 2), (10, 3)])))  # [32, 9, 1000]

# functools.cached_property
class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

    @functools.cached_property
    def area(self) -> float:
        import math
        print("computing...")
        return math.pi * self.radius ** 2

c = Circle(5)
print(c.area)   # "computing..." then 78.53...
print(c.area)   # cached — no print this time

# singledispatch
@functools.singledispatch
def serialize(obj) -> str:
    raise NotImplementedError(f"cannot serialize {type(obj)}")

@serialize.register(int)
def _(obj: int) -> str: return str(obj)

@serialize.register(list)
def _(obj: list) -> str: return f"[{', '.join(serialize(x) for x in obj)}]"

print(serialize(42))        # "42"
print(serialize([1, 2, 3])) # "[1, 2, 3]"`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a regular dict for grouping instead of defaultdict',
      wrong: `groups = {}
for item in data:
    if item.key not in groups:
        groups[item.key] = []
    groups[item.key].append(item)`,
      right: `from collections import defaultdict
groups = defaultdict(list)
for item in data:
    groups[item.key].append(item)`,
      explanation: 'defaultdict(list) eliminates the check-and-initialize boilerplate. The factory (list) is called automatically when a missing key is accessed, creating an empty list. The result is identical to the manual version but more readable and less error-prone. Use defaultdict(int) for counting, defaultdict(set) for grouping into sets.'
    },
    {
      title: 'Using list for a queue (O(n) pops from front)',
      wrong: `queue = [1, 2, 3]
item = queue.pop(0)   # O(n) — shifts all elements left`,
      right: `from collections import deque
queue = deque([1, 2, 3])
item = queue.popleft()   # O(1)`,
      explanation: 'list.pop(0) removes the first element and shifts all remaining elements left — O(n). For a queue (FIFO), deque provides O(1) appendleft() and popleft(). For large queues or tight performance loops, the difference is significant: 10,000-element list.pop(0) is ~100× slower than deque.popleft().'
    },
    {
      title: 'Using sorted().[:k] instead of heapq.nlargest for big datasets',
      wrong: `top5 = sorted(million_items, reverse=True)[:5]  # O(n log n)`,
      right: `import heapq
top5 = heapq.nlargest(5, million_items)  # O(n log k)`,
      explanation: 'sorted() sorts the entire list in O(n log n) just to take 5 items. heapq.nlargest(k, iterable) uses a heap of size k, giving O(n log k) complexity. For n=1,000,000 and k=5, heapq is thousands of times faster. The breakeven point where sorted() wins is around k ≈ n/2 — for small k, always use heapq.'
    },
    {
      title: 'Iterating combinations for large n without early exit',
      wrong: `for combo in itertools.combinations(range(1000), 10):
    process(combo)   # C(1000, 10) ≈ 2.6 × 10^23 iterations — never finishes`,
      right: `# Either reduce n/r, or add early exit condition:
for combo in itertools.combinations(range(20), 3):   # C(20,3) = 1140
    if is_solution(combo):
        result = combo
        break`,
      explanation: 'The number of combinations grows explosively. C(50,10) ≈ 10^10 — iterating all combinations at microsecond speed would take hours. Always verify the count: math.comb(n, r). If the count is large, use a smarter algorithm (branch-and-bound, dynamic programming) instead of exhaustive enumeration.'
    },
  ];

  challenge: Challenge = {
    title: 'Top-N Word Frequency with sliding window',
    language: 'typescript',
    description: 'Write top_n_words(text: str, n: int) -> list[tuple[str, int]] that returns the n most common words (case-insensitive, stripped of punctuation). Then write sliding_window_max(data: list[int], k: int) -> list[int] that returns the maximum value in each sliding window of size k using a deque.',
    hints: [
      'Use Counter and most_common(n) for word frequency',
      'Use str.translate to strip punctuation',
      'For sliding window max: store indices in the deque, not values; evict indices outside the window',
    ],
    starterCode: `from collections import Counter, deque
import string

def top_n_words(text: str, n: int) -> list[tuple[str, int]]:
    pass

def sliding_window_max(data: list[int], k: int) -> list[int]:
    pass`,
    solution: `from collections import Counter, deque
import string

def top_n_words(text: str, n: int) -> list[tuple[str, int]]:
    translator = str.maketrans("", "", string.punctuation)
    words = text.lower().translate(translator).split()
    return Counter(words).most_common(n)

def sliding_window_max(data: list[int], k: int) -> list[int]:
    result = []
    dq: deque = deque()   # stores indices; front = max index
    for i, val in enumerate(data):
        # remove indices outside window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # remove smaller values from back
        while dq and data[dq[-1]] < val:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(data[dq[0]])
    return result

text = "The cat sat on the mat. The cat sat."
print(top_n_words(text, 3))          # [('the', 3), ('cat', 2), ('sat', 2)]
print(sliding_window_max([1,3,1,3,5,3,6,7], 3))  # [3,3,5,5,6,7]`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the time complexity of deque.popleft() vs list.pop(0)?', options: ['Both are O(1)', 'deque.popleft() is O(1); list.pop(0) is O(n)', 'list.pop(0) is O(1); deque is O(log n)', 'Both are O(n)'], answer: 1, explanation: 'deque is a doubly-linked list under the hood — popleft() removes the head pointer in O(1). list is a dynamic array — pop(0) removes the first element and shifts all remaining elements left in O(n). For queues (FIFO), always use deque.' },
    { q: 'What does Counter("banana") produce?', options: ["Counter({'a': 3, 'n': 2, 'b': 1})", "Counter({'b': 1, 'a': 1, 'n': 1, 'a': 2, 'n': 1, 'a': 3})", 'A sorted list of characters', 'A set of unique characters'], answer: 0, explanation: 'Counter iterates the iterable and counts each element. Counter("banana") gives {"a": 3, "n": 2, "b": 1}. Most common is displayed first in repr. Accessing a missing key returns 0 (not KeyError), and most_common(n) returns the n highest-count pairs as a list of tuples.' },
    { q: 'How does ChainMap differ from {**map1, **map2}?', options: ['They are identical', 'ChainMap is a live view — updates to the maps are visible; {**m1, **m2} creates a new merged dict', 'ChainMap merges all keys; {**} only takes the last map', 'ChainMap only works with two maps'], answer: 1, explanation: '{**m1, **m2} creates a brand-new dict at that moment — later changes to m1 or m2 are NOT reflected. ChainMap holds references to the original maps — it is a live view. Looking up a key scans maps left to right; updating a key always writes to the first map. This makes ChainMap ideal for layered config that can change.' },
    { q: 'When is heapq.nlargest faster than sorted()?', options: ['Never — sorted() is always faster', 'When k (number of items wanted) is much smaller than n (total items)', 'When items are already partially sorted', 'When items are strings, not numbers'], answer: 1, explanation: 'sorted() is O(n log n) regardless of k. heapq.nlargest(k, it) is O(n log k) — it maintains a heap of size k while scanning n items. For k=5 and n=1,000,000, heapq is far faster. The breakeven is around k ≈ n/2; past that, sorted() is comparable or better.' },
    { q: 'What is the time complexity of deque.appendleft() compared to list.insert(0, x)?', options: ['Both are O(1)', 'deque.appendleft() is O(1); list.insert(0, x) is O(n)', 'Both are O(n)', 'deque.appendleft() is O(n); list.insert(0, x) is O(1)'], answer: 1, explanation: 'collections.deque is a doubly-linked list optimised for appends and pops from both ends — appendleft() is O(1). list.insert(0, x) must shift all existing elements right by one — O(n). For queue operations (FIFO) use deque; for stack operations (LIFO) either works but deque.append/pop is still O(1). Random access to deque (deque[i]) is O(n), while list[i] is O(1).' },
    { q: 'What does itertools.islice do and why is it useful with infinite iterators?', options: ['Converts a list to an iterator', 'Takes a slice from any iterator (including infinite ones) without materialising the entire sequence', 'Skips None values in an iterator', 'Raises StopIteration after the first element'], answer: 1, explanation: 'islice(iterable, stop) or islice(iterable, start, stop, step) returns elements from the iterator without loading everything into memory. For infinite generators like itertools.count() or itertools.cycle(), islice is the only safe way to take a finite prefix. list(islice(count(10), 5)) gives [10, 11, 12, 13, 14] without running forever.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should you use deque with maxlen?', a: 'deque(maxlen=N) creates a bounded circular buffer: when the deque is full and you append to one end, the element at the opposite end is automatically evicted. This is perfect for: (1) keeping the last N log lines or sensor readings (sliding window); (2) implementing a fixed-size LRU cache eviction queue; (3) any "recent N" pattern. The maxlen is enforced without any bookkeeping code — Python does it automatically.' },
    { q: 'What is the difference between accumulate and reduce?', a: 'functools.reduce(fn, it, initial) folds an iterable to a single value — it returns only the final result. itertools.accumulate(it, fn, initial) yields the intermediate running values as well as the final result. Use accumulate when you need the running total or running max (e.g. for a plot of cumulative sales); use reduce when you only need the final aggregate.' },
    { q: 'How do you update a Counter with new data?', a: 'Counter.update(iterable_or_dict) adds counts from new data — it does not reset, it accumulates. c = Counter("hello"); c.update("world") → both "hello" and "world" counts merged. Counter.subtract(iterable_or_dict) subtracts counts (allows negative counts, unlike subtraction with - which drops negatives). c += Counter("more") is shorthand for c.update(Counter("more")).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Counter for frequencies, defaultdict for auto-initialised groups, deque for O(1) both-end queue, itertools for lazy combinatorics — all part of the Python standard library.',
    mustKnow: [
      'Counter.most_common(n) returns top-n; supports +, -, &, | operators.',
      'defaultdict(list) for grouping; defaultdict(int) for counting — no key checks.',
      'deque.popleft() is O(1); list.pop(0) is O(n). Use deque for queues.',
      'deque(maxlen=N): bounded buffer — auto-evicts opposite end when full.',
      'heapq.nlargest(k, it) is O(n log k) vs sorted()\'s O(n log n).',
      'ChainMap is a live view of multiple dicts; {**m1, **m2} creates a copy.',
    ],
    interviewFocus: [
      'Why is deque faster than list for queue operations?',
      'When would you use ChainMap over dict merge?',
      'How does heapq.nlargest beat sorted for large n with small k?',
    ]
  };
}
