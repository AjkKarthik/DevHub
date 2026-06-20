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
  selector: 'app-python-comprehensions-generators',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './comprehensions-generators.html',
  styleUrl: './comprehensions-generators.scss'
})
export class PythonComprehensionsGenerators {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.8+';
  route = 'py-comprehensions-generators'; nextRoute = '/python/file-io'; nextLabel = 'File I/O & Pathlib';

  quickRef: QuickRefItem[] = [
    { name: '[x for x in it if cond]', type: 'syntax', desc: 'List comprehension — builds a list. Filter with if clause. Evaluates eagerly (all at once).' },
    { name: '{k: v for k, v in it}', type: 'syntax', desc: 'Dict comprehension — builds a dict from any iterable of (key, value) pairs.' },
    { name: '{x for x in it}', type: 'syntax', desc: 'Set comprehension — builds a set (deduplicated, unordered).' },
    { name: '(x for x in it)', type: 'syntax', desc: 'Generator expression — lazy, evaluates one at a time. Use in sum(), max(), join().' },
    { name: 'yield', type: 'keyword', desc: 'Pauses a generator function and emits a value. Resumes on next().' },
    { name: 'yield from', type: 'keyword', desc: 'Delegates to a sub-iterable or sub-generator. Equivalent to a nested for loop but more efficient.' },
    { name: 'next(gen)', type: 'function', desc: 'Advances the generator. next(gen, default) returns default instead of raising StopIteration.' },
    { name: 'itertools.chain', type: 'function', desc: 'chain(it1, it2) lazily chains iterables without creating a new list.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Comprehensions — Pythonic Loops',
      points: [
        'List comprehensions replace for loops that build lists. [fn(x) for x in iterable if pred(x)] is more readable and typically 30–50% faster than an equivalent append loop, because the loop runs in optimised C bytecode without the overhead of Python attribute lookup for list.append.',
        'Comprehensions support multiple for clauses (nested iteration): [(x, y) for x in range(3) for y in range(3)]. The first for is the outer loop — equivalent to: outer for x in range(3): inner for y in range(3): result.append((x, y)).',
        'Dict comprehensions are essential for transforming mappings: {k: v*2 for k, v in counts.items() if v > 0}. They replace dict(zip(keys, values)) for simple cases and are more flexible. Use them to invert a dict: {v: k for k, v in d.items()} — only works if values are unique.',
        'Set comprehensions create deduplicated collections: {word.lower() for line in text.split("\\n") for word in line.split()}. They are faster than list comprehensions followed by set() for large inputs because insertion into a set is O(1) average.',
      ]
    },
    {
      heading: 'Generator Expressions — Lazy Evaluation',
      points: [
        'A generator expression looks like a list comprehension but uses parentheses: (x**2 for x in range(1000000)). Unlike a list comprehension, it does not create all values at once — it produces values one at a time, on demand. This makes it memory-efficient for large sequences.',
        'Generator expressions are most valuable as arguments to functions that consume iterables: sum(x**2 for x in data), max(len(s) for s in words), ",".join(str(x) for x in items). The outer parentheses of the function call serve as the generator expression\'s delimiters, so you do not need double parentheses: sum(x**2 for x in data) is correct.',
        'You can only iterate a generator expression once — after exhaustion, it is empty. If you need to iterate multiple times, materialise it as a list. This is also why you should not reuse a generator: gen = (x for x in range(10)); list(gen); list(gen) → the second list is [].',
        'Chaining generators creates a pipeline: parsed = (int(line.strip()) for line in file); filtered = (x for x in parsed if x > 0); total = sum(filtered). Each value flows through the pipeline one at a time without building intermediate lists — this is the generator pipeline pattern for processing large files.',
      ]
    },
    {
      heading: 'Generator Functions — yield',
      points: [
        'A generator function contains at least one yield statement. Calling it returns a generator object without executing the body. Execution begins when you call next() and pauses at each yield. This lets you represent infinite sequences and lazy data pipelines.',
        'yield from (PEP 380) delegates to a sub-iterable and transparently passes values, send() calls, and throw() calls through. yield from range(n) is equivalent to for x in range(n): yield x but more efficient. It enables recursive generators for tree traversal without explicit stack management.',
        'Generators support two-way communication via send(): gen.send(value) resumes the generator and makes the value available as the result of the yield expression. This is the basis of coroutines (pre-asyncio). For modern async code, use async/await instead.',
        'Generators are iterators — they implement __iter__ and __next__. Use them when: you process large files line by line (avoids loading the whole file), you implement paginated API consumption, you represent infinite sequences (Fibonacci, primes), or you create processing pipelines.',
      ]
    },
    {
      heading: 'itertools — The Standard Library for Lazy Iteration',
      points: [
        'itertools.chain(*iterables) lazily chains multiple iterables into one: chain([1,2], [3,4]) → 1,2,3,4. chain.from_iterable([[1,2],[3,4]]) chains a nested iterable. Use instead of list comprehensions that flatten: list(chain.from_iterable(nested)) is much faster than [x for sub in nested for x in sub].',
        'itertools.islice(iterable, n) takes the first n items lazily — the equivalent of slicing for iterables. itertools.takewhile(pred, it) yields items while pred is True. itertools.dropwhile(pred, it) skips items while pred is True then yields the rest.',
        'itertools.groupby(sorted_iterable, key) groups consecutive equal-key items. The iterable MUST be sorted by the same key first — groupby only groups consecutive runs, not all occurrences. pairs = sorted(data, key=key_fn); for k, group in groupby(pairs, key=key_fn): ...',
        'itertools.combinations(it, r) and permutations(it, r) yield combinatoric tuples lazily. itertools.product(*its) is the Cartesian product. These avoid building large intermediate lists when you only need to process each combination once.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Comprehensions',
      language: 'typescript',
      code: `# List comprehension — filter + transform
words = ["hello", "world", "python", "is", "great"]
long_words = [w.upper() for w in words if len(w) > 4]
# ["HELLO", "WORLD", "PYTHON", "GREAT"]

# Nested comprehension — Cartesian product
pairs = [(x, y) for x in range(3) for y in range(3) if x != y]
# [(0,1),(0,2),(1,0),(1,2),(2,0),(2,1)]

# Dict comprehension — transform keys/values
prices = {"apple": 1.50, "banana": 0.75, "cherry": 3.00}
discounted = {item: price * 0.9 for item, price in prices.items()}

# Invert a dict
inv = {v: k for k, v in {"a": 1, "b": 2}.items()}  # {1: "a", 2: "b"}

# Set comprehension — unique values
text = "the cat sat on the mat"
unique_words = {word for word in text.split()}

# Conditional expression (ternary) inside comprehension
scores = [85, 92, 78, 95, 60]
grades = ["pass" if s >= 70 else "fail" for s in scores]

# Nested list comprehension — flatten 2D
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [x for row in matrix for x in row]  # [1,2,3,4,5,6,7,8,9]`
    },
    {
      label: 'Generators & pipelines',
      language: 'typescript',
      code: `import itertools

# Generator function
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
first_10 = [next(fib) for _ in range(10)]  # [0,1,1,2,3,5,8,13,21,34]

# yield from — recursive tree traversal
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)   # delegate to sub-generator
        else:
            yield item

list(flatten([1, [2, [3, 4]], [5, 6]]))  # [1, 2, 3, 4, 5, 6]

# Generator pipeline — process large file without loading it all
def read_lines(path):
    with open(path) as f:
        yield from f               # yields lines lazily

def parse_int(lines):
    for line in lines:
        line = line.strip()
        if line.isdigit():
            yield int(line)

def above_threshold(nums, threshold):
    return (n for n in nums if n > threshold)

# Chain: disk → parse → filter → sum (constant memory)
total = sum(above_threshold(parse_int(read_lines("data.txt")), 100))

# itertools examples
import itertools

# chain — lazily concatenate iterables
combined = list(itertools.chain([1, 2], [3, 4], [5]))  # [1,2,3,4,5]

# groupby — must be sorted first!
data = [("A", 1), ("A", 2), ("B", 3), ("B", 4)]
data.sort(key=lambda x: x[0])
for key, group in itertools.groupby(data, key=lambda x: x[0]):
    print(key, list(group))   # A [('A',1),('A',2)]; B [('B',3),('B',4)]

# islice — take first N from any iterable
first5 = list(itertools.islice(fibonacci(), 5))  # [0, 1, 1, 2, 3]`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reusing an exhausted generator',
      wrong: `gen = (x**2 for x in range(5))
first_pass = list(gen)   # [0, 1, 4, 9, 16]
second_pass = list(gen)  # [] — generator is exhausted!`,
      right: `# Option 1: materialise to list if you need multiple passes
squares = [x**2 for x in range(5)]

# Option 2: use a generator function (creates a fresh generator each call)
def squares_gen(n):
    return (x**2 for x in range(n))

list(squares_gen(5))  # [0,1,4,9,16]
list(squares_gen(5))  # [0,1,4,9,16] — fresh generator`,
      explanation: 'A generator can only be iterated once. After StopIteration is raised, the generator is done. If you pass a generator to two consumers, the second one gets nothing. Use a list if you need to iterate multiple times, or a function that creates a new generator each time.'
    },
    {
      title: 'Using groupby without sorting first',
      wrong: `data = [("A", 1), ("B", 2), ("A", 3)]
for k, g in itertools.groupby(data, key=lambda x: x[0]):
    print(k, list(g))
# Prints A, B, A — not A, B as expected!`,
      right: `data = [("A", 1), ("B", 2), ("A", 3)]
data.sort(key=lambda x: x[0])   # sort first!
for k, g in itertools.groupby(data, key=lambda x: x[0]):
    print(k, list(g))   # A [('A',1),('A',3)], B [('B',2)]`,
      explanation: 'groupby only groups consecutive equal-key items — it does not group ALL occurrences. Without sorting, identical keys that appear non-consecutively create separate groups. Always sort by the groupby key first.'
    },
    {
      title: 'Building list in comprehension when sum/any/all suffice',
      wrong: `result = sum([x**2 for x in range(1000000)])  # builds 1M-element list`,
      right: `result = sum(x**2 for x in range(1000000))    # generator: O(1) memory`,
      explanation: 'sum(), any(), all(), max(), min(), and ",".join() all accept iterables. Passing a generator expression instead of a list comprehension avoids building an intermediate list in memory. For 1M elements, this saves ~8 MB and is marginally faster.'
    },
    {
      title: 'Complex logic inside comprehensions',
      wrong: `result = [transform(x) for x in data if pred1(x) and pred2(x) and pred3(x) and len(x) > 5]`,
      right: `def should_include(x):
    return pred1(x) and pred2(x) and pred3(x) and len(x) > 5

result = [transform(x) for x in data if should_include(x)]`,
      explanation: 'Comprehensions should be readable at a glance. If the filter condition spans multiple lines or requires explanation, extract it into a named function. The rule of thumb: if you cannot read the comprehension aloud in one breath, it should be a loop or use a helper.'
    },
  ];

  challenge: Challenge = {
    title: 'Lazy Prime Number Generator',
    language: 'typescript',
    description: 'Write a generator function primes() that yields prime numbers indefinitely. Then write a function first_n_primes(n) that returns the first n primes as a list, and sum_primes_below(limit) that returns the sum of all primes below limit — both using itertools.islice or itertools.takewhile on the generator.',
    hints: [
      'Use a simple trial division: for each candidate, check if divisible by any prime found so far',
      'Use itertools.islice(primes(), n) to get first n primes',
      'Use itertools.takewhile(lambda p: p < limit, primes()) for sum_primes_below',
    ],
    starterCode: `import itertools

def primes():
    """Yields prime numbers indefinitely."""
    pass

def first_n_primes(n: int) -> list[int]:
    pass

def sum_primes_below(limit: int) -> int:
    pass`,
    solution: `import itertools

def primes():
    found = []
    candidate = 2
    while True:
        if all(candidate % p != 0 for p in found):
            found.append(candidate)
            yield candidate
        candidate += 1

def first_n_primes(n: int) -> list[int]:
    return list(itertools.islice(primes(), n))

def sum_primes_below(limit: int) -> int:
    return sum(itertools.takewhile(lambda p: p < limit, primes()))

# Tests
print(first_n_primes(10))      # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
print(sum_primes_below(100))   # 1060`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between a list comprehension and a generator expression?', options: ['List comprehensions are faster', 'List comprehensions eagerly build a list; generator expressions are lazy and memory-efficient', 'Generator expressions support filtering; list comprehensions do not', 'They are identical — just different syntax'], answer: 1, explanation: 'A list comprehension [x for x in it] builds the complete list in memory immediately. A generator expression (x for x in it) is lazy — it produces values one at a time on demand. Use generators when you only iterate once or when the sequence would be very large.' },
    { q: 'What does yield from do in a generator?', options: ['Yields the entire iterable as a single value', 'Delegates to a sub-iterable, yielding each of its values in turn', 'Creates a new generator from an iterable', 'Pauses and waits for an external value'], answer: 1, explanation: 'yield from sub_iterable transparently delegates: it yields each value from sub_iterable, passing through send() and throw() calls. It is equivalent to for x in sub_iterable: yield x but more efficient and enables proper generator composition.' },
    { q: 'What happens when you call list() on an exhausted generator?', options: ['Raises StopIteration', 'Returns an empty list', 'Restarts the generator from the beginning', 'Returns the last yielded value'], answer: 1, explanation: 'An exhausted generator has no more values to yield. Calling list() on it returns []. The generator does not restart — it is permanently done after StopIteration is raised once. Use a generator function (not expression) if you need a fresh generator on each call.' },
    { q: 'Why must you sort data before using itertools.groupby?', options: ['groupby requires sorted input to work at all', 'groupby only groups consecutive equal-key items, not all occurrences', 'Sorting makes groupby faster', 'groupby modifies the original list'], answer: 1, explanation: 'groupby scans sequentially and creates a new group each time the key changes. If equal-key items are not consecutive, they form separate groups. Sorting by the same key ensures all equal-key items are adjacent and grouped together.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should you use a generator instead of a list?', a: 'Use a generator when: (1) the sequence is large and you only need to iterate it once (avoids storing everything in memory), (2) the sequence is infinite (Fibonacci, primes, event streams), (3) you are creating a pipeline where each value flows through multiple processing stages, (4) you want lazy evaluation to short-circuit early (sum() may stop early if using a generator with a guard). Use a list when you need random access, multiple iterations, or len().' },
    { q: 'What is the generator send() protocol used for?', a: 'gen.send(value) resumes the generator and makes value available as the result of the yield expression inside the generator: received = yield output. This enables coroutines — generators that both produce and consume values. It was the basis of async programming before Python 3.5 introduced native async/await. Today, you\'ll mainly encounter send() in legacy coroutines or advanced generator protocols. For modern async code, use asyncio.' },
    { q: 'How is dict comprehension different from dict(zip(keys, values))?', a: 'dict(zip(keys, values)) pairs two existing sequences of equal length. Dict comprehension is more general: you can transform keys and values, add filters, and iterate any iterable (including generators). For simple pairing of two lists, both work — dict(zip(k, v)) is slightly more readable. For transformations or filtering, dict comprehension is the right choice.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Comprehensions are Pythonic eager loops; generator expressions are lazy and memory-efficient; yield/yield from enable infinite and pipeline-based iteration.',
    mustKnow: [
      'List comprehension builds immediately; generator expression is lazy (O(1) memory).',
      'Generators can only be iterated once — create a new one for each pass.',
      'yield from delegates to a sub-iterable or sub-generator.',
      'itertools.groupby requires sorted input — groups consecutive equal-key items only.',
      'Use generators as arguments to sum(), max(), join() — no double parentheses needed.',
      'Multiple for clauses in a comprehension = nested loops (first for = outer).',
    ],
    interviewFocus: [
      'Memory difference between [x for x in range(10**6)] vs (x for x in range(10**6)).',
      'When would you choose a generator over a list?',
      'Explain the groupby sorting requirement.',
    ]
  };
}
