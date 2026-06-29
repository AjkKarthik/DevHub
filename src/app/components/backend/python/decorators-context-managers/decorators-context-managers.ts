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
  selector: 'app-python-decorators-context-managers',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './decorators-context-managers.html',
  styleUrl: './decorators-context-managers.scss'
})
export class PythonDecoratorsContextManagers {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.x';
  route = 'py-decorators-context-managers'; nextRoute = '/python/type-hints'; nextLabel = 'Type Hints & mypy';

  quickRef: QuickRefItem[] = [
    { name: 'functools.wraps(fn)', type: 'decorator', desc: 'Copies __name__, __doc__, __wrapped__ from fn to the wrapper. Always use inside a decorator to preserve identity.' },
    { name: '@contextmanager', type: 'decorator', desc: 'contextlib.contextmanager turns a generator function with a single yield into a context manager.' },
    { name: 'functools.lru_cache(maxsize=128)', type: 'decorator', desc: 'Memoisation: caches results keyed by arguments. None = unlimited. .cache_info() shows hits/misses. .cache_clear() resets.' },
    { name: 'functools.cache', type: 'decorator', desc: 'Python 3.9+ alias for lru_cache(maxsize=None). Unbounded cache — use for pure functions with small argument space.' },
    { name: 'functools.partial(fn, *args)', type: 'function', desc: 'Creates a new callable with some arguments pre-filled. partial(pow, 2) → 2^x function.' },
    { name: '__enter__ / __exit__', type: 'method', desc: 'Dunder methods for class-based context managers. __exit__(exc_type, exc_val, exc_tb) — return True to suppress exceptions.' },
    { name: 'contextlib.suppress(exc)', type: 'function', desc: 'Context manager that silences a specific exception type. with suppress(FileNotFoundError): path.unlink().' },
    { name: 'contextlib.ExitStack', type: 'class', desc: 'Dynamically manages multiple context managers. Useful when the number of CMs is not known at compile time.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Decorators — How They Work',
      points: [
        'A decorator is a callable that takes a function and returns a new callable. @my_decorator above a function is syntactic sugar for: fn = my_decorator(fn). The original function is passed as an argument; the decorator returns the wrapper (or the original, unmodified).',
        'The wrapper function should use *args and **kwargs to accept any signature, call the original function (fn(*args, **kwargs)), and apply the cross-cutting logic (logging, timing, retry). Use functools.wraps(fn) on the wrapper to copy the original function\'s metadata (__name__, __doc__) — without it, all decorated functions appear to be named "wrapper" in stack traces and help().',
        'Decorator factories (parameterised decorators) add an extra layer: @retry(max=3) becomes retry(max=3)(fn). The outer function takes the parameter and returns a decorator; the decorator takes the function and returns the wrapper. Three nested levels: factory → decorator → wrapper.',
        'Class-based decorators implement __call__. This is useful for stateful decorators that need to accumulate state across calls (e.g. a call counter). The class is instantiated with the function on __init__; __call__ is invoked each time the decorated function is called.',
      ]
    },
    {
      heading: 'functools — Cache, Partial, and Reduce',
      points: [
        '@functools.lru_cache(maxsize=128) memoises the return value keyed by the function arguments. Arguments must be hashable (no lists, dicts). maxsize=None (or @functools.cache in Python 3.9+) uses an unbounded cache. @lru_cache is ideal for recursive functions (Fibonacci, tree DP) and pure functions with expensive repeated calls.',
        'functools.partial(fn, *args, **kwargs) creates a new callable with some positional or keyword arguments pre-filled. This is useful for adapting a function to a callback interface: sorted(data, key=partial(operator.getitem, 0)) or creating specialised versions of a generic function.',
        'functools.reduce(fn, iterable, initial) applies a binary function cumulatively: reduce(operator.add, [1,2,3,4], 0) → 10. Used for folding an iterable into a single value. Python 3 removed reduce from builtins — import from functools. For simple cases, prefer sum(), max(), min(), or any() which are clearer.',
        'functools.singledispatch creates a generic function that dispatches to different implementations based on the type of the first argument — Python\'s function overloading mechanism. Register implementations with @fn.register(type). Useful for writing serialisers, renderers, or type-aware formatters.',
      ]
    },
    {
      heading: 'Context Managers — with Statement',
      points: [
        'A context manager implements __enter__ and __exit__. __enter__ is called when entering the with block and its return value is bound to the as variable. __exit__(exc_type, exc_val, exc_tb) is called when leaving, whether normally or via an exception. Return True from __exit__ to suppress the exception.',
        '@contextlib.contextmanager turns a generator function into a context manager. Yield once: code before yield is __enter__; code after yield is __exit__. Wrap the yield in try/finally to ensure cleanup even on exceptions: try: yield finally: cleanup(). This is the idiomatic way to write simple context managers without a full class.',
        'contextlib.suppress(*exceptions) creates a context manager that silences the specified exceptions — cleaner than try/except/pass: with suppress(FileNotFoundError): path.unlink(). contextlib.nullcontext() is a no-op context manager (useful when a CM is optional).',
        'contextlib.ExitStack manages multiple context managers dynamically: stack = ExitStack(); f1 = stack.enter_context(open(p1)); f2 = stack.enter_context(open(p2)); — all CMs are closed in reverse order when the stack exits. Useful when the number of resources is determined at runtime.',
      ]
    },
    {
      heading: 'Stacking and Order',
      points: [
        'Multiple decorators are applied bottom-up: @a @b def fn is equivalent to fn = a(b(fn)). The innermost decorator (b) is applied first, then a is applied to the result. This means a sees the wrapper returned by b, not the original fn. Order matters when decorators interact (e.g. @lru_cache should be outermost to cache the already-logged result).',
        'When using @functools.wraps, the wrapped function is accessible via wrapper.__wrapped__ — this is how unittest.mock and debuggers unwrap decorated functions. Calling fn.__wrapped__ gives you the original undecorated callable.',
        'A decorator that returns the original function unmodified (a "marker" decorator): @register — the decorator records the function in a registry dict and returns fn unchanged. This pattern is used by Flask for routing (@app.route), pytest for marks, and click for CLI commands.',
        'Async decorators must return an async function: if the original is async, the wrapper must be defined with async def and use await fn(*args, **kwargs). A sync wrapper wrapping an async function breaks the coroutine protocol.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Decorators',
      language: 'typescript',
      code: `import functools, time, logging

# Basic decorator with @wraps
def timer(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{fn.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

# Parameterised decorator (factory)
def retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    time.sleep(delay * 2 ** (attempt - 1))   # exponential backoff
        return wrapper
    return decorator

@timer
@retry(max_attempts=3, delay=0.1)
def fetch_data(url: str) -> str:
    # simulated network call
    import random
    if random.random() < 0.5:
        raise ConnectionError("timeout")
    return f"data from {url}"

# Class-based stateful decorator
class CountCalls:
    def __init__(self, fn):
        functools.update_wrapper(self, fn)
        self.fn = fn
        self.calls = 0

    def __call__(self, *args, **kwargs):
        self.calls += 1
        return self.fn(*args, **kwargs)

@CountCalls
def greet(name: str) -> str:
    return f"Hello, {name}"

greet("Alice"); greet("Bob")
print(greet.calls)   # 2

# lru_cache
@functools.lru_cache(maxsize=128)
def fib(n: int) -> int:
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))             # computed instantly
print(fib.cache_info())    # CacheInfo(hits=48, misses=51, maxsize=128, currsize=51)`
    },
    {
      label: 'Context Managers',
      language: 'typescript',
      code: `import contextlib, time
from pathlib import Path

# Class-based context manager
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self.start
        print(f"Elapsed: {self.elapsed:.4f}s")
        return False   # do not suppress exceptions

with Timer() as t:
    sum(range(10 ** 6))
print(f"Got: {t.elapsed:.4f}s")

# @contextmanager — generator style
@contextlib.contextmanager
def temp_env_var(key: str, value: str):
    import os
    old = os.environ.get(key)
    os.environ[key] = value
    try:
        yield          # execution returns here inside the with block
    finally:
        if old is None:
            del os.environ[key]
        else:
            os.environ[key] = old

with temp_env_var("DEBUG", "1"):
    import os
    print(os.environ["DEBUG"])  # "1"
# restored after the block

# contextlib.suppress — silence specific exceptions
with contextlib.suppress(FileNotFoundError):
    Path("nonexistent.txt").unlink()   # no error raised

# ExitStack — dynamic number of context managers
files_to_open = ["a.txt", "b.txt", "c.txt"]
with contextlib.ExitStack() as stack:
    handles = [stack.enter_context(open(f, "w", encoding="utf-8")) for f in files_to_open]
    for fh in handles:
        fh.write("hello\\n")
# all three files closed automatically`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting @functools.wraps in a decorator',
      wrong: `def logger(fn):
    def wrapper(*args, **kwargs):
        print(f"Calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper   # wrapper.__name__ = "wrapper"!`,
      right: `import functools
def logger(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"Calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper   # wrapper.__name__ = fn.__name__`,
      explanation: 'Without @functools.wraps, the wrapper function has __name__ = "wrapper" and __doc__ = None. This breaks introspection, help(), stack traces, and tools that rely on function names (like pytest markers and Flask routing). Always apply @functools.wraps(fn) to the inner wrapper function.'
    },
    {
      title: 'Not using try/finally in @contextmanager',
      wrong: `@contextlib.contextmanager
def acquire_resource():
    resource = get_resource()
    yield resource
    release_resource(resource)  # not called if exception raised!`,
      right: `@contextlib.contextmanager
def acquire_resource():
    resource = get_resource()
    try:
        yield resource
    finally:
        release_resource(resource)   # always called`,
      explanation: 'If an exception is raised inside the with block, execution jumps back to the generator at the yield. Without try/finally, the code after yield (the cleanup) is never reached. Always wrap the yield in try/finally to guarantee cleanup, matching the guarantee that __exit__ always runs.'
    },
    {
      title: 'Applying @lru_cache to a method with self',
      wrong: `class DataService:
    @functools.lru_cache(maxsize=128)
    def fetch(self, key: str):    # self is in cache key — leaks memory!
        return expensive_fetch(key)`,
      right: `class DataService:
    def __init__(self): self._cache = {}

    def fetch(self, key: str):
        if key not in self._cache:
            self._cache[key] = expensive_fetch(key)
        return self._cache[key]`,
      explanation: 'lru_cache caches based on all arguments including self. Since self is the instance, the cache keeps a reference to every instance that calls fetch() — preventing garbage collection. Use an instance-level dict (_cache) instead, or use methodtools.lru_cache (a third-party package) which handles instance caching correctly.'
    },
    {
      title: 'Using a sync wrapper for an async function',
      wrong: `def log_calls(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):    # sync wrapper
        print(f"Calling {fn.__name__}")
        return fn(*args, **kwargs)   # returns a coroutine, not the result!
    return wrapper

@log_calls
async def fetch(): ...`,
      right: `def log_calls(fn):
    @functools.wraps(fn)
    async def wrapper(*args, **kwargs):   # async wrapper
        print(f"Calling {fn.__name__}")
        return await fn(*args, **kwargs)  # await the coroutine
    return wrapper`,
      explanation: 'If the decorated function is async, the wrapper must also be async and must await the call. A sync wrapper returns the coroutine object without executing it — the coroutine is created but never awaited, meaning the function body never runs. The fix: detect with asyncio.iscoroutinefunction(fn) and return an async wrapper conditionally, or always write async wrappers for async-aware decorators.'
    },
  ];

  challenge: Challenge = {
    title: 'Rate-Limiting Decorator with Context Manager',
    language: 'typescript',
    description: 'Write a rate_limit(calls: int, period: float) decorator factory that limits a function to at most calls invocations per period seconds. If the limit is exceeded, raise RuntimeError("rate limit exceeded"). Then write a @contextmanager open_temp_json(data: dict) that writes data to a temporary JSON file, yields the file path as a string, and deletes the file in cleanup.',
    hints: [
      'Track call timestamps with a deque(maxlen=calls) from collections',
      'Check if the oldest call in the deque is within the period window',
      'Use tempfile.NamedTemporaryFile(delete=False, suffix=".json") for the temp file',
    ],
    starterCode: `import functools, time, tempfile, json, contextlib
from collections import deque
from pathlib import Path

def rate_limit(calls: int, period: float):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            pass
        return wrapper
    return decorator

@contextlib.contextmanager
def open_temp_json(data: dict):
    pass`,
    solution: `import functools, time, tempfile, json, contextlib
from collections import deque
from pathlib import Path

def rate_limit(calls: int, period: float):
    def decorator(fn):
        timestamps: deque = deque(maxlen=calls)
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            now = time.monotonic()
            if len(timestamps) == calls and (now - timestamps[0]) < period:
                raise RuntimeError("rate limit exceeded")
            timestamps.append(now)
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@contextlib.contextmanager
def open_temp_json(data: dict):
    tf = tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="w", encoding="utf-8")
    try:
        json.dump(data, tf)
        tf.close()
        yield tf.name
    finally:
        Path(tf.name).unlink(missing_ok=True)

# Test
@rate_limit(calls=3, period=1.0)
def api_call(n): return f"result {n}"

for i in range(3): print(api_call(i))
# api_call(4)  # RuntimeError: rate limit exceeded

with open_temp_json({"key": "value"}) as path:
    print(path, Path(path).read_text())`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does @functools.wraps(fn) do in a decorator?', options: ['Speeds up the decorated function', 'Copies __name__, __doc__ and other metadata from fn to the wrapper', 'Automatically caches the function result', 'Makes the decorator thread-safe'], answer: 1, explanation: 'Without @functools.wraps, the wrapper function has its own __name__ ("wrapper"), __doc__ (None), etc. This breaks introspection, stack traces, help(), and tools like Flask routing and pytest. @functools.wraps(fn) copies the original function\'s metadata to the wrapper, making it appear transparent to callers and tools.' },
    { q: 'What is the execution order for @a @b def fn?', options: ['a applied first, then b', 'b applied first (inner), then a (outer)', 'Order is random', 'a and b are applied simultaneously'], answer: 1, explanation: 'Stacked decorators are applied bottom-up. @a @b def fn means fn = a(b(fn)). b is applied first, returning b_wrapped; then a is applied to b_wrapped, returning the final callable. When fn() is called, a\'s wrapper runs first, then b\'s wrapper, then the original fn.' },
    { q: 'In a @contextmanager generator, why must the yield be inside try/finally?', options: ['Python requires try/finally inside generators', 'To prevent the generator from stopping prematurely', 'To ensure cleanup code runs even when an exception is raised in the with block', 'To allow the generator to be used multiple times'], answer: 2, explanation: 'When an exception is raised inside the with block, execution returns to the generator at the yield point. Without try/finally, the generator function simply propagates the exception and skips any cleanup code after yield. try/finally guarantees the finally block runs regardless of whether the exception was raised.' },
    { q: 'What does return True in __exit__ do?', options: ['Indicates success', 'Suppresses the exception that caused the with block to exit', 'Restarts the with block', 'Closes the context manager permanently'], answer: 1, explanation: 'If __exit__ returns a truthy value, Python suppresses the exception that caused the with block to exit — the exception is swallowed and execution continues normally after the with block. Return False (or None) to let the exception propagate. contextlib.suppress uses this mechanism.' },
    { q: 'How do you stack multiple decorators on a function and in what order do they apply?', options: ['Bottom-up — the decorator closest to the function applies last', 'Top-down — the decorator closest to the function applies first', 'Order does not matter', 'Stacking decorators is not supported'], answer: 1, explanation: 'Decorators stack bottom-up at definition time. @d1 @d2 def f() means f = d1(d2(f)) — d2 wraps f first, then d1 wraps the result. At call time, d1\'s wrapper runs first, which calls d2\'s wrapper, which calls the original f. Order matters: put @functools.wraps (via @wraps) innermost; put @login_required before @cache so auth is checked before cached data is returned.' },
    { q: 'What does functools.wraps do and why is it needed?', options: ['Speeds up the decorator', 'Copies __name__, __doc__, and other metadata from the wrapped function to the wrapper', 'Prevents double-wrapping of decorators', 'Makes the decorator work with classes'], answer: 1, explanation: 'Without @functools.wraps(func) in the wrapper, the wrapper function\'s __name__ is "wrapper" and __doc__ is the wrapper\'s docstring — not the original function\'s. This breaks introspection tools (help(), pydoc, debuggers, pytest names). @wraps(func) copies __name__, __qualname__, __doc__, __dict__, and __module__ from the original, making the wrapper look like the original.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do you write a decorator that works for both sync and async functions?', a: 'Use asyncio.iscoroutinefunction(fn) to check: if the function is async, return an async wrapper that awaits the call; otherwise return a sync wrapper. Example: def log_calls(fn): if asyncio.iscoroutinefunction(fn): async def wrapper(*a, **kw): print("call"); return await fn(*a, **kw) else: def wrapper(*a, **kw): print("call"); return fn(*a, **kw); return functools.wraps(fn)(wrapper). Some frameworks (like anyio) provide a helper for this.' },
    { q: 'What is the difference between a decorator and a context manager?', a: 'A decorator wraps a function, adding behaviour at call time (before/after/around the function invocation). A context manager wraps a block of code, adding setup before the block and teardown after it. Both are forms of aspect-oriented programming — separating cross-cutting concerns from business logic. Some objects are both: @contextmanager creates a function that can be used either way. contextlib.ContextDecorator makes a class-based CM also usable as a decorator.' },
    { q: 'When should you use functools.partial vs a lambda?', a: 'Both partially apply arguments, but partial is more readable for simple cases and works with introspection (partial preserves the function name). Lambda is more flexible for inline expression logic: sorted(data, key=lambda x: -x.score) vs partial(operator.neg, ...). Prefer partial when adapting a named function to a callback API (partial(operator.add, 10) as the key for sorted). Prefer lambda for short inline functions where the logic itself is the important part.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Decorators are callables that wrap functions; always use @wraps; @contextmanager turns a generator into a CM; try/finally ensures cleanup.',
    mustKnow: [
      'Decorator syntax: @d means fn = d(fn). Factories add one more level.',
      '@functools.wraps(fn) is required to preserve __name__ and __doc__.',
      'Stacked decorators apply bottom-up: @a @b → a(b(fn)).',
      '@contextmanager: code before yield = setup; after = teardown. Wrap yield in try/finally.',
      'return True in __exit__ suppresses exceptions from the with block.',
      '@lru_cache on methods leaks instances — use instance-level dict instead.',
    ],
    interviewFocus: [
      'Walk through how a parameterised decorator (retry(max=3)) works.',
      'What happens if you forget try/finally in a @contextmanager?',
      'How do you write a decorator that handles both sync and async functions?',
    ]
  };
}
