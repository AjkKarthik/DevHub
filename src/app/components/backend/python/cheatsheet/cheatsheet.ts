import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-python-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class PythonCheatsheet {
  readingTime = 15; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'; since = 'Python 3.9+';

  quickRef: QuickRefItem[] = [
    { name: 'enumerate(iterable, start=0)', type: 'function', desc: 'Yields (index, value) pairs. for i, v in enumerate(items): — avoids manual counter variables.' },
    { name: 'zip(*iterables, strict=False)', type: 'function', desc: 'Pairs elements from multiple iterables. zip(names, scores). strict=True raises if lengths differ.' },
    { name: 'sorted(iterable, key=fn, reverse=False)', type: 'function', desc: 'Returns new sorted list. key=lambda x: x.age. Does not modify original. Use list.sort() for in-place.' },
    { name: '[expr for x in it if cond]', type: 'syntax', desc: 'List comprehension. {k: v for k, v in d.items()} dict comp. {x for x in it} set comp. (x for x in it) generator.' },
    { name: 'f"{value!r:.2f}"', type: 'syntax', desc: 'F-string. !r for repr, !s for str, !a for ascii. :.2f two decimals. :>10 right-align 10 wide. {obj.attr} works.' },
    { name: 'walrus := operator', type: 'operator', desc: 'while chunk := f.read(8192): — assigns AND returns value. Useful in while/comprehension conditions.' },
    { name: 'match subject: case pattern:', type: 'syntax', desc: 'Structural pattern matching (3.10+). case Point(x, y): captures attrs. case [first, *rest]: sequence. case _: wildcard.' },
    { name: '*args, **kwargs', type: 'syntax', desc: '*args collects positional args as tuple. **kwargs collects keyword args as dict. fn(*lst) and fn(**dct) to unpack.' },
    { name: '@dataclass', type: 'decorator', desc: 'Auto-generates __init__, __repr__, __eq__. frozen=True for immutability. field(default_factory=list) for mutable defaults.' },
    { name: '@contextmanager', type: 'decorator', desc: 'from contextlib import contextmanager. yield splits enter/exit. Use try/finally around yield for cleanup.' },
    { name: 'pathlib.Path', type: 'class', desc: 'Path("/tmp") / "sub" / "file.txt". .read_text(), .write_text(). .glob("**/*.py"). .exists(), .stat().st_size.' },
    { name: 'dict.get(key, default)', type: 'method', desc: 'Returns default instead of raising KeyError. dict.setdefault(key, []).append(v). collections.defaultdict(list) for auto-init.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Data Types & Collections',
      points: [
        'list: ordered, mutable, allows duplicates. O(1) append/pop from end; O(n) insert/delete at index. tuple: ordered, immutable — use as dict keys, function return values, namedtuple for structured data.',
        'dict: ordered (Python 3.7+), O(1) get/set/delete. Iterate: .items(), .keys(), .values(). Merge: {**a, **b} or a | b (3.9+). defaultdict(list) auto-creates missing keys. Counter for frequency counts.',
        'set: unordered, unique, O(1) membership test. set intersection (&), union (|), difference (-), symmetric difference (^). frozenset for immutable sets usable as dict keys.',
        'collections module: Counter(iterable) for frequency; deque for O(1) appendleft/popleft; namedtuple for readable tuple fields; ChainMap for layered lookups; OrderedDict (pre-3.7 compat).',
      ]
    },
    {
      heading: 'Functions, Closures & Decorators',
      points: [
        'Positional args, keyword args, *args (tuple), **kwargs (dict). Keyword-only: def f(a, *, b): — b must be passed as keyword. Positional-only (3.8+): def f(a, b, /): — a, b cannot use keyword syntax.',
        'Closures: inner function captures variables from enclosing scope. nonlocal lets inner function rebind an enclosing variable. Common pattern: factory functions returning closures with config baked in.',
        '@functools.wraps(fn) preserves __name__/__doc__ on wrapper. @lru_cache(maxsize=None) memoises function calls. @functools.cache (3.9+) is simpler alias. Decorators stack bottom-up: @b @a → b(a(fn)).',
        'functools.partial(fn, *fixed_args, **fixed_kwargs) creates a new callable with some args pre-filled. operator.itemgetter(0) / attrgetter("name") are faster than lambdas for sort keys.',
      ]
    },
    {
      heading: 'OOP Patterns',
      points: [
        '__init__ initialises; __repr__ for debugging (should be eval-able); __str__ for display; __eq__/__hash__ for equality/sets; __len__, __getitem__, __iter__ for container protocol; __enter__/__exit__ for context manager.',
        '@property turns a method into a read-only attribute. @prop.setter adds a setter. @classmethod receives cls; used for alternative constructors. @staticmethod receives nothing; utility functions logically grouped on the class.',
        'Abstract Base Classes: from abc import ABC, abstractmethod. ABC prevents instantiation without implementing all abstract methods. Protocol (typing) enables structural subtyping — no explicit inheritance needed.',
        '__slots__ = ("x", "y") prevents per-instance __dict__, saving ~50% memory per instance — critical when creating millions of objects. MRO (Method Resolution Order): Python uses C3 linearisation; super() follows MRO.',
      ]
    },
    {
      heading: 'Async & Concurrency',
      points: [
        'async def marks a coroutine. await suspends execution until the awaitable completes — only valid inside async def. asyncio.run(main()) starts the event loop. Never call asyncio.run() inside a running loop.',
        'asyncio.gather(*coros) runs coroutines concurrently and returns all results. asyncio.create_task(coro) schedules a task to run soon; gather waits for it. asyncio.TaskGroup (3.11+) cancels all tasks if one fails.',
        'Threading: for I/O-bound work where GIL is released (network, disk). ThreadPoolExecutor. Multiprocessing: for CPU-bound work — bypasses GIL. ProcessPoolExecutor. asyncio: for high-concurrency I/O without threads.',
        'asyncio.Semaphore(N) limits concurrent tasks. asyncio.Queue for producer/consumer. asyncio.to_thread(sync_fn) runs a blocking function in a thread pool without blocking the event loop.',
      ]
    },
    {
      heading: 'Error Handling & Context Managers',
      points: [
        'try/except/else/finally: else runs if no exception was raised (useful for code that should only run on success). finally always runs — use for cleanup. except (TypeError, ValueError) as e: catches multiple types.',
        'raise ValueError("msg") from original_exception chains exceptions — both tracebacks are shown. raise without args re-raises the current exception. except Exception as e: catches all non-system-exit exceptions.',
        '@contextmanager from contextlib: yield splits __enter__ (before yield) and __exit__ (after yield). try/finally around yield ensures cleanup runs. ExitStack manages variable numbers of context managers.',
        'contextlib.suppress(FileNotFoundError) silently ignores specified exceptions. contextlib.redirect_stdout(f) captures output. contextlib.asynccontextmanager for async context managers.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Builtins & Comprehensions',
      language: 'typescript',
      code: `# enumerate & zip
names = ["Alice", "Bob", "Carol"]
scores = [95, 87, 92]

for i, name in enumerate(names, start=1):
    print(f"{i}. {name}")

for name, score in zip(names, scores):
    print(f"{name}: {score}")

paired = list(zip(names, scores))           # [("Alice", 95), ...]
unzipped_names, unzipped_scores = zip(*paired)

# sorted with key
people = [{"name": "Bob", "age": 30}, {"name": "Alice", "age": 25}]
by_age = sorted(people, key=lambda p: p["age"])
by_name = sorted(people, key=lambda p: p["name"].lower())

# List/dict/set comprehensions
squares = [x**2 for x in range(10) if x % 2 == 0]
word_lengths = {word: len(word) for word in names}
unique_initials = {name[0] for name in names}
gen = (x**2 for x in range(1000))         # generator — lazy

# Walrus operator :=
import re
while line := input("> "):                 # assigns and checks
    if m := re.search(r"\d+", line):      # assign in condition
        print(f"Found number: {m.group()}")

# match/case (3.10+)
def classify(point):
    match point:
        case (0, 0): return "origin"
        case (x, 0): return f"x-axis at {x}"
        case (0, y): return f"y-axis at {y}"
        case (x, y): return f"point ({x}, {y})"
        case _: return "not a point"`
    },
    {
      label: 'Strings & F-strings',
      language: 'typescript',
      code: `# F-string features
name = "Alice"
score = 95.678
count = 1_000_000

print(f"Name: {name!r}")          # repr: 'Alice'
print(f"Score: {score:.2f}")      # 95.68
print(f"Count: {count:,}")        # 1,000,000
print(f"Score: {score:>10.2f}")   # right-align 10 wide
print(f"Hex: {255:#x}")           # 0xff
print(f"Debug: {name=}")          # name='Alice' (3.8+)

# Multi-line f-string
query = (
    f"SELECT * FROM users "
    f"WHERE name = {name!r} "
    f"AND score > {score:.1f}"
)

# str methods
text = "  Hello, World!  "
print(text.strip())               # "Hello, World!"
print(text.lower())               # "  hello, world!  "
print(text.split(", "))           # ["  Hello", "World!  "]
print("separator".join(["a","b","c"]))  # "aseparatorbseparatorc"
print(text.replace("World", "Python"))
print("abc".startswith("ab"))     # True
print("hello world".title())      # "Hello World"

# String check methods
"abc123".isalnum()   # True
"   ".isspace()      # True
"HELLO".isupper()    # True

# Format spec in variables
width, precision = 10, 3
print(f"{score:{width}.{precision}f}")`
    },
    {
      label: 'OOP & Dataclasses',
      language: 'typescript',
      code: `from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from typing import Protocol

# Dataclass
@dataclass
class Point:
    x: float
    y: float
    label: str = "point"
    tags: list[str] = field(default_factory=list)

    def distance(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5

@dataclass(frozen=True)          # immutable — hashable
class Color:
    r: int; g: int; b: int

p = Point(1.0, 2.0)
print(p)                         # Point(x=1.0, y=2.0, label='point', tags=[])

# Protocol (structural subtyping)
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None: print("O")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())                 # works — no explicit inheritance

# ABC (nominal subtyping)
class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @property
    def description(self) -> str:
        return f"shape with area {self.area():.2f}"

class Rectangle(Shape):
    def __init__(self, w: float, h: float):
        self.w = w; self.h = h
    def area(self) -> float: return self.w * self.h

# __slots__ for memory efficiency
class Slot:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x = x; self.y = y`
    },
    {
      label: 'Async Patterns',
      language: 'typescript',
      code: `import asyncio
import httpx                         # async HTTP client

# Basic async/await
async def fetch(url: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.text

# Run multiple concurrently
async def fetch_all(urls: list[str]) -> list[str]:
    return await asyncio.gather(*[fetch(url) for url in urls])

# TaskGroup (3.11+) — cancels all on first failure
async def robust_fetch_all(urls: list[str]) -> list[str]:
    results = []
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(url)) for url in urls]
    return [t.result() for t in tasks]

# Semaphore — limit concurrency
async def rate_limited(urls: list[str], limit: int = 10) -> list[str]:
    sem = asyncio.Semaphore(limit)
    async def bounded(url):
        async with sem:
            return await fetch(url)
    return await asyncio.gather(*[bounded(u) for u in urls])

# Producer/consumer with Queue
async def producer(queue: asyncio.Queue):
    for i in range(5):
        await queue.put(i)
    await queue.put(None)              # sentinel

async def consumer(queue: asyncio.Queue):
    while (item := await queue.get()) is not None:
        print(f"Processing {item}")

# Run blocking code without blocking the loop
import time
async def with_blocking():
    result = await asyncio.to_thread(time.sleep, 1)

asyncio.run(fetch_all(["https://example.com"]))`
    },
    {
      label: 'Error Handling',
      language: 'typescript',
      code: `# try/except/else/finally
def read_config(path: str) -> dict:
    try:
        with open(path) as f:
            import json
            data = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Config not found: {path}") from None
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {path}: {e}") from e
    else:
        # runs only if NO exception was raised
        print(f"Loaded {len(data)} keys")
        return data
    finally:
        # ALWAYS runs
        print("read_config done")

# Catching multiple types
try:
    value = int(input())
except (ValueError, TypeError) as e:
    print(f"Bad input: {e}")

# contextlib utilities
from contextlib import suppress, ExitStack, contextmanager

with suppress(FileNotFoundError):
    open("maybe_missing.txt").close()

# @contextmanager
@contextmanager
def managed_resource(name: str):
    print(f"Acquiring {name}")
    try:
        yield name
    finally:
        print(f"Releasing {name}")    # always runs

with managed_resource("db") as res:
    print(f"Using {res}")

# ExitStack — variable number of context managers
def process_files(paths: list[str]):
    with ExitStack() as stack:
        files = [stack.enter_context(open(p)) for p in paths]
        for f in files:
            print(f.read())`
    },
    {
      label: 'Type Hints',
      language: 'typescript',
      code: `from __future__ import annotations
from typing import TypeVar, Generic, TypedDict, Annotated, Protocol, overload
from collections.abc import Callable, Iterator, Sequence
import sys

# Modern syntax (3.10+)
def greet(name: str | None = None) -> str:
    return f"Hello, {name or 'stranger'}"

def process(items: list[int]) -> dict[str, int]:
    return {"sum": sum(items), "count": len(items)}

# TypeVar — generic functions
T = TypeVar("T")
def first(items: list[T]) -> T | None:
    return items[0] if items else None

# TypedDict — typed dict shape
class UserData(TypedDict):
    id: int
    name: str
    email: str

# Annotated — attach metadata
from typing import Annotated
PositiveInt = Annotated[int, "must be > 0"]

# Protocol — structural typing
class Comparable(Protocol):
    def __lt__(self, other: object) -> bool: ...

def min_value(a: Comparable, b: Comparable) -> Comparable:
    return a if a < b else b

# TYPE_CHECKING guard — avoid circular imports
if sys.version_info >= (3, 11):
    from typing import Self
else:
    from typing import TypeVar
    Self = TypeVar("Self")

# Callable type hints
Handler = Callable[[str, int], bool]

def apply(fn: Handler, text: str, n: int) -> bool:
    return fn(text, n)

# overload — multiple signatures
@overload
def parse(val: str) -> int: ...
@overload
def parse(val: bytes) -> str: ...
def parse(val):
    if isinstance(val, str): return int(val)
    return val.decode()`
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between a list and a tuple in Python?', a: 'Both are ordered sequences. list is mutable — elements can be added, removed, or changed. tuple is immutable — once created, it cannot be modified. Tuples are hashable (if elements are hashable) so they can be used as dict keys or set members. Tuples are slightly faster to create and iterate. Use tuples for fixed data (coordinates, function return values, namedtuple records); use lists for collections that change.' },
    { q: 'What is the GIL and how does it affect concurrent Python code?', a: 'The Global Interpreter Lock (GIL) is a mutex in CPython that allows only one thread to execute Python bytecode at a time. For CPU-bound code, threads cannot run in parallel — use multiprocessing (separate processes, each with their own GIL) or write C extensions. For I/O-bound code, threads work well because the GIL is released during I/O operations (network, disk, sleep). asyncio avoids threads entirely by using a single-threaded event loop with coroutines.' },
    { q: 'What is a generator and when should you use one?', a: 'A generator is a function with yield statements that produces values lazily — one at a time on demand. Unlike a list comprehension that builds the entire list in memory, a generator expression (x for x in iterable) produces values one at a time. Use generators when: processing large files line-by-line, computing infinite sequences, pipelines (chain generators together), or whenever you need a single-pass iteration and don\'t need to store all values at once. A generator function (def fn(): yield x) preserves its execution state between calls.' },
    { q: 'What is the difference between is and ==?', a: '== calls __eq__ and checks VALUE equality. is checks IDENTITY — whether two variables point to the exact same object in memory. Use is only for singletons: if x is None:, if x is True:. Never use is for strings, integers, or other objects you want to compare by value — while CPython caches small integers and interned strings, this is an implementation detail and not reliable. Always use == for value comparison.' },
    { q: 'What does *args and **kwargs mean in a function signature?', a: '*args collects extra positional arguments into a tuple. **kwargs collects extra keyword arguments into a dict. def fn(*args, **kwargs) accepts any combination. They can be used to pass arguments through to another function: return other_fn(*args, **kwargs). On the calling side, *lst unpacks a list as positional args and **dct unpacks a dict as keyword args. Keyword-only parameters (after *): def f(a, *, b) — b must always be passed as b=value.' },
    { q: 'What is a context manager and how do you create one?', a: 'A context manager is an object implementing __enter__ and __exit__ that is used with the with statement. __enter__ sets up the resource and returns it; __exit__ tears it down. The with statement guarantees __exit__ runs even if an exception occurs. To create one: (1) define a class with __enter__/__exit__ methods; (2) use @contextlib.contextmanager — write a generator function with yield in a try/finally. Use context managers for resources that must be released: file handles, database connections, locks, temporary directories.' },
  ];
}
