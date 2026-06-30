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
  selector: 'app-python-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class PythonFundamentals {
  readingTime = 20; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'; since = 'Python 3.8+';
  route = 'py-fundamentals'; nextRoute = '/python/functions-closures'; nextLabel = 'Functions & Closures';

  quickRef: QuickRefItem[] = [
    { name: 'f-strings', type: 'syntax', desc: 'f"{value:.2f}" — inline expressions, format specs, nested quotes. Fastest string formatting in Python 3.6+.' },
    { name: 'walrus operator :=', type: 'operator', desc: 'Assignment expression: while chunk := f.read(8192): — assign and test in one step.' },
    { name: 'Truthy / falsy', type: 'keyword', desc: 'Falsy: None, 0, 0.0, "", [], {}, set(), False. Everything else is truthy.' },
    { name: 'type() vs isinstance()', type: 'function', desc: 'isinstance(x, int) is preferred — respects inheritance. type(x) is int fails for subclasses.' },
    { name: 'unpacking *', type: 'syntax', desc: 'a, *rest = [1,2,3,4] → rest=[2,3,4]. Also works in function calls: fn(*list, **dict).' },
    { name: 'enumerate()', type: 'function', desc: 'for i, val in enumerate(items, start=1) — avoids manual index tracking.' },
    { name: 'zip()', type: 'function', desc: 'zip(a, b) pairs elements. zip(*matrix) transposes. Use strict=True to error on length mismatch.' },
    { name: 'None coalescing', type: 'syntax', desc: 'value = x if x is not None else default — Python has no ?? but this is idiomatic.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Python\'s Type System — Dynamic but Strict',
      points: [
        'Python is dynamically typed: variables hold references to objects, not values. The type is on the object, not the variable — x = 42 makes x point to an int object. Reassigning x = "hello" is valid; Python does not care what type x previously held.',
        'Python is also strongly typed: it does not silently coerce types. "3" + 3 raises TypeError — unlike JavaScript. This prevents a class of bugs at the cost of needing explicit conversions like int("3") + 3.',
        'Type annotations (PEP 526, Python 3.6+) are hints, not enforcement. def greet(name: str) -> str does not prevent passing an int at runtime. Use mypy or Pyright to statically enforce annotations; use pydantic for runtime enforcement.',
        'Common type pitfalls: mutable default arguments (def fn(items=[]) shares the list across all calls — use None instead), integer division (3/2=1.5 in Python 3; use // for floor division), and None checks (use is None, not == None — None is a singleton).',
      ]
    },
    {
      heading: 'Control Flow — Pythonic Patterns',
      points: [
        'Python if/elif/else: no switch statement before Python 3.10. Use match/case (structural pattern matching) in Python 3.10+ for dispatching on value or structure. For simple lookups use a dictionary: HANDLERS = {"add": add_fn, "sub": sub_fn}; HANDLERS[op](a, b).',
        'for loops in Python iterate over any iterable — not just ranges. for item in list, for char in string, for key in dict (iterates keys), for key, val in dict.items() — all work. Use range(n) when you need indices, but prefer enumerate() when you need both index and value.',
        'The else clause on for/while executes when the loop completes without a break. Useful for "search and not found" patterns: for item in items: if condition: break else: handle_not_found().',
        'Comprehension expressions can replace many loops: [x**2 for x in range(10) if x % 2 == 0]. They are generally faster than equivalent for loops because they run in optimised C bytecode. But do not sacrifice readability — complex logic belongs in a for loop.',
      ]
    },
    {
      heading: 'Functions as First-Class Objects',
      points: [
        'Python functions are objects — they can be stored in variables, passed as arguments, returned from other functions, and stored in data structures. This enables higher-order functions: map(fn, items), filter(pred, items), sorted(items, key=fn).',
        'Default argument evaluation happens once at function definition time, not at call time. def fn(x, items=[]) — the list is shared across all calls. The Pythonic fix: def fn(x, items=None): if items is None: items = []. This creates a new list per call.',
        'Keyword-only arguments (after *): def fn(a, b, *, sort=False) — sort must be passed as a keyword argument. Positional-only arguments (before /): def fn(a, b, /, c) — a and b cannot be passed as keyword arguments. Use / in library APIs to allow renaming parameters without breaking callers.',
        'Lambda is a single-expression anonymous function: sorted(data, key=lambda x: x["age"]). For anything more complex than a single expression, use a named function — readability matters.',
      ]
    },
    {
      heading: 'The Zen of Python — Design Philosophy',
      points: [
        'Explicit is better than implicit — Python avoids magic. No automatic type coercion, no implicit returns (functions return None if no return statement), no implicit string concatenation across lines (except inside parentheses/brackets).',
        'Flat is better than nested — deeply nested conditionals are a code smell. Early returns (guard clauses) flatten the structure: if not valid: return error before the main logic. Comprehensions flatten loops. Package-level imports flatten import chains.',
        'Readability counts — Python uses whitespace for structure (no braces), enforces PEP 8 naming (snake_case for functions/variables, PascalCase for classes, SCREAMING_SNAKE_CASE for constants), and prefers words over symbols. Line length convention: 79–99 characters.',
        'Errors should never pass silently — catch specific exceptions, not bare except:. Use logging, not print, in production code. Raise meaningful exceptions with context: raise ValueError(f"Expected positive int, got {value}") from None.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables & types',
      language: 'typescript',
      code: `# Dynamic typing — variable holds a reference
x = 42          # int
x = "hello"     # now str — same variable, different object

# Type annotations (hints, not enforcement)
count: int = 0
name: str = "Alice"

# Multiple assignment
a, b, c = 1, 2, 3
a, b = b, a           # swap without temp variable

# Unpacking
first, *rest = [1, 2, 3, 4]  # first=1, rest=[2,3,4]
*init, last = [1, 2, 3, 4]   # init=[1,2,3], last=4

# Walrus operator (Python 3.8+)
import re
if m := re.search(r"\\d+", text):
    print(m.group())  # m is available in the block

# f-strings (fastest, most readable)
name = "Alice"; age = 30
print(f"{name} is {age} years old")
print(f"{age:05d}")          # zero-padded: 00030
print(f"{3.14159:.2f}")      # 2 decimal places: 3.14
print(f"{'hello':>10}")      # right-align in 10 chars

# Truthiness
bool(None), bool(0), bool(""), bool([])  # all False
bool(1), bool("x"), bool([0])           # all True`
    },
    {
      label: 'Control flow & builtins',
      language: 'typescript',
      code: `# Conditional — no switch before 3.10
value = "admin"
match value:
    case "admin":  print("Admin access")
    case "user":   print("User access")
    case _:        print("Unknown role")

# dict-based dispatch (pre-3.10 alternative)
ROLES = {"admin": lambda: "Admin access", "user": lambda: "User access"}
print(ROLES.get(value, lambda: "Unknown")())

# for loop patterns
items = ["a", "b", "c"]
for i, item in enumerate(items, start=1):
    print(f"{i}. {item}")          # 1. a, 2. b, 3. c

# zip
keys = ["x", "y", "z"]; vals = [1, 2, 3]
d = dict(zip(keys, vals))         # {"x":1,"y":2,"z":3}

# for-else: "search and not found"
for item in items:
    if item == "target":
        print("Found!")
        break
else:
    print("Not found")

# Comprehension vs loop
squares = [x**2 for x in range(10)]           # list
evens_sq = {x**2 for x in range(10) if x%2==0}  # set
index_map = {v: i for i, v in enumerate(items)}  # dict

# Built-in helpers
print(any(x > 5 for x in [3, 6, 2]))   # True
print(all(x > 0 for x in [1, 2, 3]))   # True
print(max([3,1,4,1,5], key=lambda x: x % 3))   # key-based max`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutable default argument',
      wrong: `def append_to(item, lst=[]):
    lst.append(item)
    return lst
# First call: [1], Second call: [1, 2] — shared list!`,
      right: `def append_to(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst`,
      explanation: 'Default arguments are evaluated once when the function is defined, not each time it is called. Mutable defaults (lists, dicts) are shared across all calls. Use None as the default and create the mutable inside the body.'
    },
    {
      title: 'Using == None instead of is None',
      wrong: `if x == None:  # triggers __eq__, can be overridden
    ...`,
      right: `if x is None:  # identity check — always correct
    ...`,
      explanation: 'None is a singleton — there is exactly one None object. is None checks identity (same object), which is always correct and slightly faster. == None calls __eq__, which custom objects could override to return True even for non-None values.'
    },
    {
      title: 'Catching bare except',
      wrong: `try:
    result = risky()
except:  # catches EVERYTHING — including SystemExit, KeyboardInterrupt
    pass`,
      right: `try:
    result = risky()
except ValueError as e:
    log.warning("Invalid value: %s", e)
except (IOError, OSError) as e:
    log.error("I/O error: %s", e)`,
      explanation: 'Bare except: catches ALL exceptions including SystemExit (raised by sys.exit()), KeyboardInterrupt (Ctrl+C), and GeneratorExit. This silently swallows errors and makes programs impossible to interrupt. Always catch specific exception types.'
    },
    {
      title: 'Integer division confusion',
      wrong: `result = 7 / 2   # result = 3.5, not 3
# Surprising if you wanted integer division`,
      right: `result = 7 // 2  # floor division → 3
result = 7 % 2   # modulo → 1
q, r = divmod(7, 2)  # both at once → (3, 1)`,
      explanation: 'In Python 3, / always returns float. Use // for floor division (integer quotient). This differs from Python 2 where 7 / 2 = 3. If you need both quotient and remainder, divmod() is more efficient than computing each separately.'
    },
  ];

  challenge: Challenge = {
    title: 'FizzBuzz with Python Idioms',
    language: 'typescript',
    description: 'Write FizzBuzz for numbers 1–30 using Python idioms: use a dictionary to map divisors to words, use a list comprehension to generate results, and return a list of strings (not print). The function signature: def fizzbuzz(n: int) -> list[str].',
    hints: [
      'Build a RULES dict: {3: "Fizz", 5: "Buzz"}',
      'Use "".join(word for div, word in RULES.items() if n % div == 0) to combine matches',
      'If the joined string is empty, return str(n) as the fallback',
    ],
    starterCode: `def fizzbuzz(n: int) -> list[str]:
    # Return ["1","2","Fizz","4","Buzz",...] for range 1..n
    pass`,
    solution: `def fizzbuzz(n: int) -> list[str]:
    RULES = {3: "Fizz", 5: "Buzz"}
    results = []
    for i in range(1, n + 1):
        word = "".join(w for d, w in RULES.items() if i % d == 0)
        results.append(word or str(i))
    return results

# One-liner alternative
def fizzbuzz_compact(n: int) -> list[str]:
    return [
        "".join(w for d, w in {3:"Fizz",5:"Buzz"}.items() if i%d==0) or str(i)
        for i in range(1, n+1)
    ]`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does the walrus operator (:=) do?', options: ['Compares two values for equality', 'Assigns a value and returns it in the same expression', 'Creates a new scope', 'Unpacks a tuple'], answer: 1, explanation: 'The walrus operator (:=) is an assignment expression — it assigns a value to a variable and returns that value, allowing assignment inside conditions like while chunk := f.read(8192): or if m := re.search(...).' },
    { q: 'Which of these is falsy in Python?', options: ['[0]', '(False,)', '0.0', '"False"'], answer: 2, explanation: '0.0 is falsy — any numeric zero (0, 0.0, 0j) is falsy. [0] is a non-empty list (truthy). (False,) is a non-empty tuple (truthy). "False" is a non-empty string (truthy).' },
    { q: 'Why should mutable defaults be avoided in function signatures?', options: ['They cause slower function calls', 'They are shared across all calls where the default is used', 'Python does not allow mutable defaults', 'They prevent type checking'], answer: 1, explanation: 'Default arguments are evaluated once at function definition time. A mutable default like def fn(lst=[]) means all callers that rely on the default share the SAME list object, so mutations in one call affect subsequent calls.' },
    { q: 'What is the difference between / and // in Python 3?', options: ['/ returns int, // returns float', '/ always returns float, // returns the floor of the division', 'They are identical', '// performs modulo division'], answer: 1, explanation: 'In Python 3, / always returns float (7/2 = 3.5). // performs floor division and returns an int when both operands are ints (7//2 = 3). This is different from Python 2 where 7/2 = 3.' },
    { q: 'What does the walrus operator (:=) do in Python 3.8+?', options: ['Compares two values without side effects', 'Assigns a value to a variable AND returns it — used inside expressions', 'Declares a constant', 'Is a type annotation shorthand'], answer: 1, explanation: 'The walrus operator := (assignment expression) assigns and returns a value in a single expression. Classic use: while chunk := f.read(8192): process(chunk) — avoids reading twice. In comprehensions: [y for x in data if (y := transform(x)) > 0] — computes transform once and uses it in both the condition and the output.' },
    { q: 'What is the difference between a list and a tuple in Python?', options: ['Lists allow duplicates; tuples do not', 'Lists are mutable sequences; tuples are immutable sequences (and hashable if all elements are hashable)', 'Tuples use more memory than lists', 'Lists can hold mixed types; tuples cannot'], answer: 1, explanation: 'Lists ([1,2,3]) are mutable — you can append, remove, or replace elements. Tuples ((1,2,3)) are immutable — no in-place modifications. Tuples are hashable if all elements are hashable, so they can be dict keys or set members. Tuples are slightly faster than lists for iteration. Prefer tuples for heterogeneous fixed-shape records (x, y coordinates) and lists for homogeneous collections.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between is and == in Python?', a: '== calls the __eq__ method and tests value equality. is tests identity — whether two names refer to the exact same object in memory. Use is for None checks (is None, is not None) and for comparing singletons. Never use is to compare strings or integers (Python may or may not intern them, making results unpredictable).' },
    { q: 'What happens when you iterate over a dictionary?', a: 'Iterating over a dict (for k in d) iterates over keys. Use d.items() for key-value pairs, d.values() for values only, d.keys() for keys (same as iterating the dict itself). Since Python 3.7, dict insertion order is guaranteed — iteration always follows insertion order.' },
    { q: 'What is the difference between a list and a tuple?', a: 'Lists are mutable (you can add/remove/change items); tuples are immutable (fixed after creation). Tuples are slightly faster to create and iterate, use less memory, and can be used as dict keys (because they are hashable, assuming all elements are hashable). Use tuples for fixed collections (coordinates, RGB values, function return values); lists for collections that may change.' },
    { q: 'Why is Python described as both dynamically typed and strongly typed?', a: 'Dynamically typed means variable types are determined at runtime, not declared upfront — the same variable name can be reassigned to hold an int, then a string, with no compile-time type checking. Strongly typed means Python does not silently coerce between incompatible types — "5" + 5 raises a TypeError rather than implicitly converting one side, unlike weakly typed languages such as JavaScript where "5" + 5 produces "55". This combination gives flexibility in variable usage while still catching type-mismatch bugs early.' },
    { q: 'What is the Global Interpreter Lock (GIL) and why does it matter for Python performance?', a: 'The GIL is a mutex in CPython (the standard Python implementation) that allows only one thread to execute Python bytecode at a time, even on multi-core machines — meaning pure-Python multi-threaded code does not achieve true CPU parallelism. I/O-bound threads still benefit from threading (the GIL is released during I/O waits), but CPU-bound parallel work requires multiprocessing (separate processes, each with its own GIL and memory space) or GIL-releasing C extensions (NumPy) to actually use multiple cores.' },
    { q: 'What does "Pythonic" mean, and why does the Zen of Python (import this) matter for writing idiomatic code?', a: 'Pythonic code follows established community idioms and leverages the language\'s built-in features rather than porting patterns from other languages verbatim — using list comprehensions instead of manual append loops, context managers (with) for resource cleanup, and unpacking instead of manual indexing. The Zen of Python ("Readability counts", "There should be one obvious way to do it") is a design philosophy that explains why Python favors explicit, readable code over clever-but-obscure one-liners, guiding decisions when multiple valid approaches exist.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Python is dynamically typed, strongly typed, and emphasises readability — "one obvious way to do it" over magic.',
    mustKnow: [
      'Dynamic typing: variables hold references; type is on the object, not the variable.',
      'Falsy values: None, 0, 0.0, "", [], {}, set(), False — everything else is truthy.',
      'Mutable defaults in functions are shared across calls — use None and create inside.',
      'Use is None (not == None) for None checks — None is a singleton.',
      '/ returns float in Python 3; // is floor division.',
      'f-strings are the modern string formatting standard — prefer over .format() and %.',
      'Walrus operator (:=) allows assignment inside expressions (Python 3.8+).',
    ],
    interviewFocus: [
      'Explain mutable default arguments and why they are a bug.',
      'What is the difference between is and == — when would each give wrong results?',
      'How does Python\'s GIL affect concurrency? (Bridge to threading topic.)',
    ]
  };
}
