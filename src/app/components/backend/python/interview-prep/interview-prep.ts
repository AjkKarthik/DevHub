import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-python-interview-prep',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss'
})
export class PythonInterviewPrep {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.9+';

  quickRef: QuickRefItem[] = [
    { name: 'GIL (Global Interpreter Lock)', type: 'keyword', desc: 'CPython mutex — only one thread executes bytecode at a time. I/O releases GIL; CPU-bound code does not. Use multiprocessing for CPU parallelism.' },
    { name: 'Mutable default argument trap', type: 'keyword', desc: 'def f(lst=[]): appends persist across calls. Fix: def f(lst=None): if lst is None: lst = []. Defaults are created once at function definition.' },
    { name: 'is vs ==', type: 'operator', desc: 'is checks object identity (same memory address). == calls __eq__ for value equality. Only use is for None/True/False singletons.' },
    { name: 'LEGB scope rule', type: 'keyword', desc: 'Local → Enclosing → Global → Built-in. Name resolution order. nonlocal modifies enclosing; global modifies global. Late binding: closures capture the variable, not its value at creation.' },
    { name: 'MRO (Method Resolution Order)', type: 'keyword', desc: 'Python C3 linearisation — determines which class\'s method is called in multiple inheritance. ClassName.__mro__ or ClassName.mro() to inspect. super() follows MRO.' },
    { name: 'Generator vs list', type: 'keyword', desc: 'Generator: lazy, O(1) memory, single pass, yields one item at a time. List: eager, O(n) memory, random access, reusable. Use generators for large/infinite sequences.' },
    { name: '__slots__', type: 'keyword', desc: 'Prevents __dict__ on instances — saves ~50% memory. Useful when creating millions of instances. Downside: cannot add arbitrary attributes; no weakref by default.' },
    { name: 'Shallow vs deep copy', type: 'keyword', desc: 'copy.copy(): new container, same child objects. copy.deepcopy(): recursively copies all objects. list[:] and dict.copy() are shallow. JSON round-trip is a manual deep copy.' },
    { name: 'EAFP vs LBYL', type: 'keyword', desc: 'Easier to Ask Forgiveness than Permission (try/except) vs Look Before You Leap (if x in d). Python favours EAFP — it is faster when success is the common case and avoids TOCTOU races.' },
    { name: 'Duck typing', type: 'keyword', desc: '"If it walks like a duck and quacks like a duck, it is a duck." Python checks behaviour, not type. hasattr() > isinstance() for checking capabilities. Protocol enables static duck typing.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Core Language Gotchas',
      points: [
        'Mutable default argument: def append_to(elem, lst=[]): lst.append(elem); return lst — the list is shared across all calls. Each call with no lst argument appends to the SAME list from the previous call. Fix: use None as default and create a new list inside the function body.',
        'Late binding closures: def make_adders(): return [lambda x: x + i for i in range(3)] — all lambdas share the same i variable. When called, i is 2 (final loop value). Fix: def make_adders(): return [lambda x, i=i: x + i for i in range(3)] — capture i by value at creation.',
        'is vs == gotcha: a = 256; b = 256; a is b → True (CPython caches small integers -5..256). a = 257; b = 257; a is b → False (separate objects). Never rely on is for value comparison — it is an implementation detail. Use == for values, is only for None/True/False.',
        'UnboundLocalError: x = 10; def f(): print(x); x = 20 → UnboundLocalError at the print line. Python sees x is assigned in f(), treats it as local, but it is referenced before assignment. Fix: use global x or pass x as parameter.',
      ]
    },
    {
      heading: 'Memory & Performance',
      points: [
        'GIL: only one thread executes Python bytecode at a time in CPython. For I/O-bound code (network, disk, sleep), the GIL is released during the I/O call — threading works fine. For CPU-bound code (computation), threads cannot truly run in parallel — use multiprocessing or Cython/C extensions.',
        '__slots__: class Point: __slots__ = ("x", "y") — no per-instance __dict__. Each instance saves ~200 bytes. When creating millions of objects (e.g. nodes in a graph, particles in a simulation), this difference is critical. Trade-off: cannot add arbitrary attributes; monkey-patching blocked.',
        'Generators vs lists: (x**2 for x in range(10**9)) uses constant memory; [x**2 for x in range(10**9)] uses ~8 GB. Generators are single-pass — after iterating once, they are exhausted. itertools functions return generators. For files: for line in open("huge.txt") iterates without loading into memory.',
        'copy.copy() vs copy.deepcopy(): shallow copy creates a new container but the elements point to the same objects. Modifying a nested mutable element (list, dict) in the copy also modifies the original. deepcopy() recursively copies everything — safe but slower. For immutable-value containers (lists of ints), shallow copy is sufficient.',
      ]
    },
    {
      heading: 'Concurrency Mental Model',
      points: [
        'Three concurrency models: asyncio (single thread, coroutines, event loop), threading (OS threads, GIL, shared memory), multiprocessing (separate processes, no GIL, separate memory). Rule: I/O-bound → asyncio (best) or threading; CPU-bound → multiprocessing. asyncio handles 10,000+ concurrent connections with one thread; threading is simpler but context-switch overhead limits it to ~100 concurrent threads.',
        'asyncio event loop: runs one coroutine at a time. When a coroutine awaits (e.g. await client.get(url)), it suspends and the event loop runs another coroutine. No GIL problem — no threads. Blocking calls in asyncio (time.sleep, blocking socket) freeze the entire event loop — use asyncio.to_thread() for blocking code.',
        'concurrent.futures provides a uniform API: ThreadPoolExecutor (threads, good for I/O) and ProcessPoolExecutor (processes, good for CPU). with ThreadPoolExecutor(max_workers=10) as ex: futures = [ex.submit(fn, arg) for arg in args]. as_completed(futures) yields futures as they complete.',
        'Race conditions in threading: multiple threads reading and writing shared state. Use threading.Lock() for mutual exclusion. queue.Queue is thread-safe. asyncio is single-threaded so no race conditions between coroutines — but asyncio.Lock exists for async critical sections.',
      ]
    },
    {
      heading: 'Pythonic Patterns',
      points: [
        'EAFP (Easier to Ask Forgiveness than Permission): try: value = d[key]; except KeyError: handle(). Preferred in Python — faster when success is common, avoids TOCTOU (time-of-check/time-of-use) race conditions. LBYL: if key in d: value = d[key] — performs two lookups; better when failure is common.',
        'Duck typing: Python checks what an object can DO, not what it IS. isinstance() checks type hierarchy; checking hasattr() or just calling the method and catching AttributeError is more Pythonic. Protocol (typing) makes duck typing statically verifiable: class Sized(Protocol): def __len__(self) -> int: ...',
        'Comprehensions over loops: [f(x) for x in items] is 30–50% faster than an explicit for loop because it avoids LOAD_FAST overhead for the list. Dict/set comprehensions similarly outperform explicit loops. Use when the expression is simple; use explicit loop when logic is complex or multi-line.',
        'Context managers for resource management: with open() ensures file is closed even on exception. with lock: ensures lock is released. Custom context managers via @contextmanager or __enter__/__exit__ — use for any resource that needs guaranteed cleanup. ExitStack composes multiple context managers dynamically.',
      ]
    },
    {
      heading: 'What Interviewers Actually Probe For in Python Interviews',
      points: [
        'Beyond syntax knowledge, Python interviews commonly probe understanding of the GIL\'s implications for concurrency, mutable default argument pitfalls, and the difference between shallow and deep copying — these represent genuine "gotchas" that separate surface-level familiarity from deeper Python fluency.',
        'Being able to explain WHY a piece of Python code behaves unexpectedly (like late-binding closures or mutable defaults) demonstrates a stronger grasp of the language\'s actual execution model than simply being able to write correct code without fully understanding its underlying mechanics.',
        'Complexity analysis of Python\'s built-in operations (list.append is O(1) amortized, "in" on a list is O(n) but O(1) on a set/dict, list.insert(0, x) is O(n)) is frequently tested, since choosing the wrong built-in data structure for a given access pattern is a common source of accidental performance bugs.',
        'Practical, applied knowledge (how would you structure a Flask/FastAPI service, how do you avoid N+1 queries, how do you profile a slow function) is increasingly weighted alongside pure algorithmic questions, reflecting that real-world Python engineering is as much about idiomatic, maintainable code as clever algorithms.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Classic Gotchas',
      language: 'typescript',
      code: `# === Mutable default argument ===
def broken(lst=[]):          # DO NOT DO THIS
    lst.append(1)
    return lst

print(broken())  # [1]
print(broken())  # [1, 1]  ← same list!

def correct(lst=None):       # CORRECT
    if lst is None:
        lst = []
    lst.append(1)
    return lst

# === Late binding closure ===
adders_broken = [lambda x: x + i for i in range(3)]
print([f(10) for f in adders_broken])  # [12, 12, 12]  ← all see i=2

adders_fixed = [lambda x, i=i: x + i for i in range(3)]
print([f(10) for f in adders_fixed])   # [10, 11, 12]  ← correct

# === is vs == ===
a = 256; b = 256
print(a is b)   # True  (CPython caches -5..256)
a = 257; b = 257
print(a is b)   # False (implementation detail!)
print(a == b)   # True  (always correct)
print(None is None)    # True  (safe — singleton)
print(True is True)    # True  (safe — singleton)

# === UnboundLocalError ===
x = 10
def broken():
    print(x)   # UnboundLocalError: x referenced before assignment
    x = 20     # Python sees this → x is local throughout

def correct():
    global x
    print(x)   # 10
    x = 20`
    },
    {
      label: 'Scope & Closures',
      language: 'typescript',
      code: `# LEGB: Local → Enclosing → Global → Built-in
x = "global"

def outer():
    x = "enclosing"
    def inner():
        # x = "local"      # if uncommented, overrides enclosing
        print(x)           # → "enclosing"
    inner()
    return inner

outer()

# nonlocal
def counter():
    count = 0
    def increment():
        nonlocal count    # modify enclosing scope
        count += 1
        return count
    return increment

inc = counter()
print(inc(), inc(), inc())  # 1 2 3

# Closure factory
def make_multiplier(n):
    def multiply(x):
        return x * n     # n captured from enclosing scope
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5), triple(5))  # 10 15

# Decorator as closure
import functools
def retry(times):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == times - 1: raise
            raise RuntimeError("unreachable")
        return wrapper
    return decorator

@retry(3)
def flaky_operation(): ...`
    },
    {
      label: 'Memory Patterns',
      language: 'typescript',
      code: `# __slots__ — memory efficiency
class WithDict:
    def __init__(self, x, y): self.x = x; self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y): self.x = x; self.y = y

import sys
a = WithDict(1, 2)
b = WithSlots(1, 2)
print(sys.getsizeof(a))   # ~48 bytes + dict overhead (~232)
print(sys.getsizeof(b))   # ~56 bytes (no dict)

# Generators — O(1) memory
def read_chunks(path, size=8192):
    with open(path, "rb") as f:
        while chunk := f.read(size):
            yield chunk   # one chunk at a time, not all at once

# Generator pipeline (no intermediate lists)
import itertools
lines = (line.strip() for line in open("data.txt"))
non_empty = (l for l in lines if l)
words = itertools.chain.from_iterable(l.split() for l in non_empty)
word_count = sum(1 for _ in words)

# Shallow vs deep copy
import copy
original = [[1, 2], [3, 4]]
shallow = copy.copy(original)
deep = copy.deepcopy(original)

shallow[0].append(99)
print(original[0])   # [1, 2, 99]  ← affected!
deep[0].append(99)
print(original[0])   # [1, 2, 99]  ← not affected (already changed above)

# weakref — cache without preventing garbage collection
import weakref
class HeavyObject: pass
obj = HeavyObject()
ref = weakref.ref(obj)
print(ref())         # <HeavyObject ...>
del obj
print(ref())         # None — collected`
    },
    {
      label: 'Concurrency Patterns',
      language: 'typescript',
      code: `import asyncio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed

# I/O-bound: asyncio (best) or threading
async def fetch_async(url: str) -> str:
    import httpx
    async with httpx.AsyncClient() as client:
        return (await client.get(url)).text

async def fetch_all(urls):
    return await asyncio.gather(*[fetch_async(u) for u in urls])

# I/O-bound: threading (when async not available)
def fetch_sync(url):
    import urllib.request
    return urllib.request.urlopen(url).read()

with ThreadPoolExecutor(max_workers=20) as ex:
    futures = {ex.submit(fetch_sync, url): url for url in urls}
    for fut in as_completed(futures):
        result = fut.result()

# CPU-bound: multiprocessing
def heavy_compute(n: int) -> int:
    return sum(i**2 for i in range(n))

with ProcessPoolExecutor() as ex:
    results = list(ex.map(heavy_compute, [10**6, 10**6, 10**6]))

# Thread safety with Lock
import threading
counter = 0
lock = threading.Lock()

def increment():
    global counter
    with lock:     # ensures atomic read-modify-write
        counter += 1

threads = [threading.Thread(target=increment) for _ in range(1000)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)   # always 1000 (with lock), sometimes < 1000 (without)`
    },
    {
      label: 'Pythonic Code',
      language: 'typescript',
      code: `# EAFP vs LBYL
# LBYL — two lookups, potential TOCTOU
if "key" in data:
    value = data["key"]   # another thread may delete between check and get

# EAFP — Pythonic, one lookup, no race
try:
    value = data["key"]
except KeyError:
    value = default

# dict.get() shorthand when default is simple
value = data.get("key", default)

# Duck typing vs isinstance
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

# Don't check type — check capability:
def render(obj):
    try:
        obj.draw()          # EAFP duck typing
    except AttributeError:
        raise TypeError(f"{obj!r} is not drawable")

# Static duck typing with Protocol
def render_typed(obj: Drawable) -> None:
    obj.draw()              # mypy validates at type-check time

# Comprehensions outperform loops
squares_loop = []
for x in range(1000):
    squares_loop.append(x**2)

squares_comp = [x**2 for x in range(1000)]   # ~30% faster

# Context manager for any cleanup
from contextlib import contextmanager
import tempfile, os

@contextmanager
def temp_directory():
    tmpdir = tempfile.mkdtemp()
    try:
        yield tmpdir
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

with temp_directory() as d:
    # tmpdir cleaned up even on exception
    open(f"{d}/test.txt", "w").write("hello")`
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the GIL and how do you work around it?', a: 'The Global Interpreter Lock is a mutex in CPython that allows only one thread to execute Python bytecode at a time. For I/O-bound tasks, the GIL is released during I/O so threading still achieves concurrency. For CPU-bound tasks, threads cannot run in parallel — workarounds: (1) multiprocessing module (separate processes, each with their own GIL); (2) C extensions like NumPy release the GIL for heavy computation; (3) PyPy or Cython for compute-intensive code. Python 3.13 adds experimental no-GIL mode (PEP 703).' },
    { q: 'Explain the mutable default argument trap.', a: 'Default argument values are evaluated once when the function is defined, not on each call. def f(lst=[]): creates one list object shared across all calls. lst.append(x) modifies this same list every call. Fix: use None as the sentinel — def f(lst=None): if lst is None: lst = []. The same trap applies to dict, set, and any other mutable default. Immutable defaults (int, str, tuple) are safe because they cannot be mutated.' },
    { q: 'What is the difference between generators and iterators?', a: 'An iterator is any object implementing __iter__() and __next__(). A generator is a function with yield — Python automatically creates an iterator object from it. Generators are the easiest way to create iterators. Generator expressions (x for x in items) are syntactic sugar for one-liner generators. Key property: generators are lazy — they compute values on demand without storing all of them. A generator object is itself an iterator, but not all iterators are generators (e.g. list.__iter__() returns a list_iterator, not a generator).' },
    { q: 'How does Python resolve names in nested scopes (LEGB)?', a: 'Python looks up names in order: Local (current function) → Enclosing (enclosing functions, from inner to outer) → Global (module level) → Built-in (builtins module). The global keyword makes an assignment target the global scope. The nonlocal keyword makes an assignment target the nearest enclosing scope that has that name. Late binding: closures capture the VARIABLE (cell object), not its value — so the variable\'s value at call time is used, not at definition time.' },
    { q: 'What is the difference between @classmethod and @staticmethod?', a: '@classmethod receives the class (cls) as its first argument — it can access and modify class state, create instances via cls(), and is inherited properly by subclasses. Use for alternative constructors: @classmethod def from_string(cls, s): return cls(*parse(s)). @staticmethod receives no implicit first argument — it is a plain function logically grouped on the class. Use for utility functions that do not need access to the class or instance. Neither requires an instance to call: MyClass.method().' },
    { q: 'When would you use a Protocol vs ABC?', a: 'ABC (Abstract Base Class) uses nominal subtyping — a class must explicitly inherit from the ABC and implement all abstract methods. Protocol uses structural subtyping (duck typing) — any class with the right methods satisfies the Protocol, regardless of inheritance. Prefer Protocol for library code / function parameter types — callers do not need to import and inherit from your ABC. Use ABC when you want to enforce a contract on a class hierarchy you control, provide shared implementation, or register virtual subclasses. Protocol is the modern Pythonic choice for type checking duck-typed interfaces.' },
    { q: 'What is asyncio and when should you use it?', a: 'asyncio is a single-threaded concurrency model using coroutines and an event loop. When a coroutine awaits (e.g. await response.json()), it suspends and the event loop runs another coroutine. No threads means no GIL contention, no race conditions, and very low overhead per "task". Use asyncio when: you need to handle many concurrent I/O operations (100s–10,000s of simultaneous network connections); you are building web servers, API clients, or scrapers; using frameworks like FastAPI, aiohttp, or HTTPX. Do not use asyncio for CPU-bound work — it cannot parallelise computation (only one coroutine runs at a time).' },
    { q: 'What is a decorator and how do you write one that preserves metadata?', a: 'A decorator is a callable that takes a function and returns a replacement function, applied with @ syntax. Simple decorator: def log(fn): def wrapper(*a, **kw): print(fn.__name__); return fn(*a, **kw); return wrapper. Problem: wrapper.__name__ is "wrapper", not the original function\'s name. Fix: @functools.wraps(fn) on the wrapper copies __name__, __doc__, __annotations__, and __module__ from fn to wrapper. For parameterised decorators, add another layer: def retry(n): def decorator(fn): @functools.wraps(fn) def wrapper(...): ...; return wrapper; return decorator.' },
    { q: 'How does Python\'s import system work?', a: 'When Python encounters import foo: (1) checks sys.modules — if already loaded, returns the cached module (imports are cached); (2) finds the module file using sys.path (ordered list of directories); (3) creates a module object and executes the file in its namespace; (4) stores in sys.modules[foo]. Relative imports: from . import sibling; from .. import parent. TYPE_CHECKING guard avoids circular imports at runtime: if TYPE_CHECKING: from heavy_module import Type. importlib.import_module("name") for dynamic imports. __init__.py makes a directory a package.' },
    { q: 'Explain Python\'s memory management and garbage collection.', a: 'Python uses reference counting as the primary memory management mechanism — each object has a refcount; when it reaches 0, the object is immediately freed. Problem: circular references (A → B → A) never reach refcount 0. CPython\'s cyclic garbage collector (gc module) detects and collects cycles. gc runs periodically (on allocation thresholds) and can be triggered manually: gc.collect(). The gc module tracks container objects (list, dict, set, user classes) but not simple types (int, str). weakref allows references that do not increment refcount — useful for caches.' },
    { q: 'What are Python data model (dunder) methods and why do they matter?', a: 'Dunder (double underscore) methods define how objects behave with Python\'s syntax and built-ins. __init__: initialise; __repr__: debug string (should be eval-able); __str__: user-facing string; __eq__ + __hash__: equality and hashability (needed for dict keys / set members); __len__: len(); __getitem__ / __setitem__: subscript operator []; __iter__ / __next__: for loop; __enter__ / __exit__: with statement; __call__: make instance callable; __add__ / __radd__: + operator. Implementing these makes your objects feel like first-class Python types and integrate with built-ins, for loops, context managers, and operators.' },
  ];
}
