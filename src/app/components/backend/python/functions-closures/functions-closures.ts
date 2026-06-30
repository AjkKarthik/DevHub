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
  selector: 'app-python-functions-closures',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './functions-closures.html',
  styleUrl: './functions-closures.scss'
})
export class PythonFunctionsClosures {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'; since = 'Python 3.8+';
  route = 'py-functions-closures'; nextRoute = '/python/comprehensions-generators'; nextLabel = 'Comprehensions & Generators';

  quickRef: QuickRefItem[] = [
    { name: '*args', type: 'syntax', desc: 'Collects extra positional args into a tuple: def fn(*args). Always a tuple, even if empty.' },
    { name: '**kwargs', type: 'syntax', desc: 'Collects extra keyword args into a dict: def fn(**kwargs). Useful for pass-through wrappers.' },
    { name: 'functools.wraps', type: 'decorator', desc: '@wraps(fn) on a wrapper copies __name__, __doc__, __wrapped__ from the original — essential for debugging.' },
    { name: 'functools.partial', type: 'function', desc: 'partial(fn, arg1) returns a new callable with arg1 pre-filled.' },
    { name: 'functools.lru_cache', type: 'decorator', desc: '@lru_cache(maxsize=128) memoizes a function. Use @cache (Python 3.9+) for unbounded cache.' },
    { name: 'lambda', type: 'keyword', desc: 'lambda x: x*2 — single-expression anonymous function. For anything multi-line, use a named def.' },
    { name: 'nonlocal', type: 'keyword', desc: 'nonlocal x inside an inner function allows assignment to the outer scope variable x.' },
    { name: 'Keyword-only args', type: 'syntax', desc: 'def fn(a, *, b) — b must be passed as keyword. Positional-only: def fn(a, b, /) — a, b cannot be keyword.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Functions as First-Class Objects',
      points: [
        'In Python, functions are objects — they have attributes (__name__, __doc__, __code__), can be stored in variables, passed as arguments, returned from other functions, and stored in data structures. This is what makes higher-order functions possible.',
        'Higher-order functions take or return functions: sorted(items, key=str.lower), map(fn, iterable), filter(pred, iterable). The key= parameter in sorted() is the most common use — it avoids Schwartzian transforms.',
        'Closures capture variables from the enclosing scope by reference, not by value. The closure "closes over" the variable — if the variable changes after the closure is created, the closure sees the new value. This is the source of the common loop-variable capture bug.',
        'Use functools.partial to pre-fill arguments: double = partial(operator.mul, 2). Use functools.reduce for left-fold operations. Use operator module (operator.attrgetter, operator.itemgetter) as fast, readable key functions instead of lambdas.',
      ]
    },
    {
      heading: 'Argument Passing — *args, **kwargs, and Special Forms',
      points: [
        'Argument order in a function signature: positional → *args → keyword-only → **kwargs. Example: def fn(pos1, pos2, *args, kw_only, **kwargs). You can use * alone (def fn(a, *, b)) to make all subsequent args keyword-only without collecting varargs.',
        'Positional-only parameters (PEP 570, Python 3.8+) are declared before /: def fn(a, b, /, c). This means a and b cannot be passed by keyword. Useful for APIs that need to rename parameters without breaking callers.',
        'Unpacking at call time: fn(*list_arg, **dict_arg) expands a list into positional args and a dict into keyword args. You can mix: fn(1, *[2,3], key=4, **{"extra": 5}). This is how print(*lines, sep="\\n") works.',
        'Call-by-object-reference: Python passes references to objects, not copies. If you mutate a mutable argument (lst.append(x)), the caller sees the change. If you rebind (lst = []), the caller does not — you replaced your local reference, not the object.',
      ]
    },
    {
      heading: 'Decorators — Functions Wrapping Functions',
      points: [
        'A decorator is a callable that takes a function and returns a (usually enhanced) function. @decorator is syntactic sugar for fn = decorator(fn). Decorators are applied bottom-up when stacked: @A @B means fn = A(B(fn)).',
        'Always use @functools.wraps(fn) inside your decorator wrapper. Without it, the decorated function loses its __name__, __doc__, and other introspection attributes — this breaks debugging, documentation, and some frameworks (like Flask route registration).',
        'Class-based decorators implement __call__: class Retry: def __init__(self, fn): self.fn = fn; def __call__(self, *a, **kw): ... They support state (retry count, cache) more naturally than closures. Use when your decorator needs configuration or mutable state.',
        'Parameterised decorators are decorators that take arguments: @retry(times=3). They require an extra layer of nesting — a factory function that receives the arguments and returns the actual decorator. The three-level nesting (factory → decorator → wrapper) is the standard pattern.',
      ]
    },
    {
      heading: 'Closures and the LEGB Rule',
      points: [
        'LEGB is the name lookup order: Local → Enclosing → Global → Built-in. When Python encounters a name, it searches each scope in order. This means built-ins like list and len can be shadowed by local variables — avoid naming locals after built-ins.',
        'Closures capture variables from the enclosing scope. The classic bug: [lambda: i for i in range(5)] — all five lambdas capture the same i variable, and after the loop, i is 4. Fix: [lambda i=i: i for i in range(5)] — the default argument captures by value.',
        'nonlocal allows an inner function to assign to a variable in the enclosing (but non-global) scope. Without nonlocal, assigning to a name in an inner function creates a new local variable that shadows the outer one — the outer variable is unchanged.',
        'global keyword makes a variable reference the module-level name. Avoid using global in production code — it creates invisible dependencies and makes functions hard to test. Prefer passing values explicitly or using class attributes for shared mutable state.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Closures & decorators',
      language: 'typescript',
      code: `import functools, time

# Closure — factory returning a configured function
def make_multiplier(n):
    def multiplier(x):
        return x * n     # n is captured from enclosing scope
    return multiplier

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5))  # 10
print(triple(5))  # 15

# The loop-variable capture bug
lambdas_bug = [lambda: i for i in range(5)]  # all return 4!
lambdas_fix = [lambda i=i: i for i in range(5)]  # returns 0,1,2,3,4

# Decorator with @functools.wraps
def timer(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{fn.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timer
def slow_add(a, b):
    time.sleep(0.1)
    return a + b

slow_add(1, 2)   # prints: slow_add took 0.1002s

# Parameterised decorator
def retry(times=3, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except exceptions as e:
                    if attempt == times - 1:
                        raise
                    print(f"Retry {attempt+1}/{times}: {e}")
        return wrapper
    return decorator

@retry(times=3, exceptions=(IOError,))
def fetch(url): ...`
    },
    {
      label: '*args, **kwargs, partial',
      language: 'typescript',
      code: `import functools, operator

# *args and **kwargs
def log(level, *messages, sep=" | ", **extra):
    print(f"[{level}] {sep.join(messages)}", extra)

log("INFO", "Connected", "Ready")
log("ERROR", "Timeout", "Retry", sep=" → ", request_id="abc123")

# Unpacking at call site
def vector_add(x, y, z): return (x, y, z)
coords = [1, 2, 3]
result = vector_add(*coords)   # unpacks list into positional args

defaults = {"z": 0}
result2 = vector_add(1, 2, **defaults)  # unpacks dict into keyword args

# Keyword-only arguments (enforced by *)
def create_user(name, email, *, role="user", active=True):
    return {"name": name, "email": email, "role": role, "active": active}

create_user("Alice", "a@b.com", role="admin")   # OK
# create_user("Alice", "a@b.com", "admin")     # TypeError! role is keyword-only

# functools.partial — pre-fill arguments
power = functools.partial(pow, exp=2)   # equivalent to: lambda x: pow(x, exp=2)
# Note: pow doesn't support exp as keyword — just for illustration

base_url = "https://api.example.com"
get_user = functools.partial(requests.get, f"{base_url}/users")
get_post = functools.partial(requests.get, f"{base_url}/posts")

# functools.lru_cache — memoization
@functools.lru_cache(maxsize=None)
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

print(fib(100))   # instant; without cache: would compute 2^100 calls`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting @functools.wraps in decorators',
      wrong: `def my_decorator(fn):
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name): """Say hello.""" return f"Hello {name}"

greet.__name__  # "wrapper" — wrong!
greet.__doc__   # None — documentation lost!`,
      right: `def my_decorator(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper`,
      explanation: 'Without @functools.wraps, the decorated function masquerades as the wrapper. This breaks help(), logging, Flask route registration (which uses __name__ to name routes), and any tool that introspects function metadata.'
    },
    {
      title: 'Loop variable capture bug in closures',
      wrong: `fns = [lambda: i for i in range(5)]
[f() for f in fns]  # [4, 4, 4, 4, 4] — all capture final i`,
      right: `fns = [lambda i=i: i for i in range(5)]
[f() for f in fns]  # [0, 1, 2, 3, 4] — default arg captures by value`,
      explanation: 'Closures capture variables by reference. After the loop, i is 4 — all lambdas see the same i. The fix uses a default argument (i=i) which is evaluated at lambda creation time and captures the current value of i.'
    },
    {
      title: 'Using global for shared state',
      wrong: `counter = 0
def increment():
    global counter   # creates invisible dependency
    counter += 1`,
      right: `class Counter:
    def __init__(self): self._count = 0
    def increment(self): self._count += 1
    def value(self): return self._count`,
      explanation: 'Global state is invisible to callers and makes functions impossible to test in isolation. Use class attributes for shared mutable state, or pass state as arguments and return new values.'
    },
    {
      title: 'Shadowing built-ins with local variables',
      wrong: `list = [1, 2, 3]    # shadows the built-in list()!
type = "admin"       # shadows built-in type()
id = user["id"]      # shadows built-in id()`,
      right: `items = [1, 2, 3]
role = "admin"
user_id = user["id"]`,
      explanation: 'Python\'s built-ins are in the outermost scope. A local variable with the same name silently shadows them. This is caught by linters (flake8: A001/A002) but not by Python itself — it will cause confusing NameErrors later in the same scope when you need the built-in.'
    },
  ];

  challenge: Challenge = {
    title: 'Build a Retry Decorator with Exponential Backoff',
    language: 'typescript',
    description: 'Write a @retry(max_attempts=3, base_delay=1.0, exceptions=(Exception,)) decorator that retries a function on failure with exponential backoff (delay doubles each attempt). It should preserve the original function\'s metadata and re-raise the last exception after all attempts fail.',
    hints: [
      'Three levels: factory(max_attempts, base_delay, exceptions) → decorator(fn) → wrapper(*args, **kwargs)',
      'Delay for attempt n: base_delay * (2 ** attempt) — starts at base_delay, doubles each time',
      'Use @functools.wraps(fn) on the wrapper',
      'Use time.sleep(delay) between retries',
    ],
    starterCode: `import functools, time

def retry(max_attempts=3, base_delay=1.0, exceptions=(Exception,)):
    def decorator(fn):
        # implement wrapper here
        pass
    return decorator

@retry(max_attempts=3, base_delay=0.1, exceptions=(IOError,))
def unstable_fetch(url: str) -> str:
    raise IOError("Connection refused")`,
    solution: `import functools, time

def retry(max_attempts=3, base_delay=1.0, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_attempts):
                try:
                    return fn(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    if attempt < max_attempts - 1:
                        delay = base_delay * (2 ** attempt)
                        print(f"Attempt {attempt+1} failed: {e}. Retrying in {delay:.1f}s...")
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does @functools.wraps(fn) do in a decorator?', options: ['Makes the decorator faster', 'Copies __name__, __doc__, and other metadata from fn to the wrapper', 'Prevents the wrapper from being called directly', 'Enables async support'], answer: 1, explanation: 'functools.wraps copies dunders (__name__, __doc__, __qualname__, __annotations__, __wrapped__) from the wrapped function to the wrapper. Without it, the decorated function appears to be named "wrapper" and has no docstring, breaking introspection tools.' },
    { q: 'What is the output of: fns = [lambda: i for i in range(3)]; [f() for f in fns]?', options: ['[0, 1, 2]', '[2, 2, 2]', '[0, 0, 0]', 'TypeError'], answer: 1, explanation: 'All three lambdas close over the same variable i. After the comprehension finishes, i is 2. All three lambdas return 2. Fix: lambda i=i: i to capture by value in the default argument.' },
    { q: 'What does nonlocal do in Python?', options: ['Makes a variable available globally', 'Allows an inner function to reassign a variable in the enclosing (non-global) scope', 'Creates a module-level constant', 'Prevents a variable from being reassigned'], answer: 1, explanation: 'nonlocal allows an inner function to assign to a variable in the nearest enclosing function scope (not global). Without nonlocal, assigning to a name inside an inner function creates a new local variable that shadows the outer one.' },
    { q: 'How do you make a function parameter keyword-only in Python?', options: ['By adding a * prefix to the parameter name', 'By placing parameters after * or *args in the signature', 'By using the keyword_only=True decorator', 'By using type annotations'], answer: 1, explanation: 'Parameters after * (bare) or after *args are keyword-only: def fn(a, *, b, c). Callers must pass b and c as keyword arguments. This prevents API breakage when positional order changes.' },
    { q: 'What does functools.partial do?', options: ['Creates a copy of a function with no arguments', 'Returns a new function with some arguments pre-filled', 'Wraps a function with error handling', 'Converts a method to a function'], answer: 1, explanation: 'functools.partial(fn, *args, **kwargs) returns a new callable with those args/kwargs pre-applied. Example: double = partial(multiply, factor=2); double(5) → multiply(5, factor=2) → 10. Useful for callbacks that need extra args (button.on_click = partial(handle_click, item_id=42)) and for adapting functions to fixed interfaces.' },
    { q: 'What is the difference between *args and **kwargs in a function signature?', options: ['*args collects keyword arguments; **kwargs collects positional arguments', '*args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict', 'They cannot be used together', '*args is for type hints; **kwargs is for default values'], answer: 1, explanation: '*args collects all extra positional arguments into a tuple. **kwargs collects all extra keyword arguments into a dict. def fn(*args, **kwargs) accepts any combination of arguments. Common pattern: wrappers that pass-through to the underlying function (def log_call(fn, *args, **kwargs): log(); return fn(*args, **kwargs)).' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between a closure and a class with __call__?', a: 'Both can encapsulate state and be called like a function. Closures are lighter (no class overhead) and are good for simple state. Classes with __call__ are better when: you need multiple methods (reset(), inspect()), you want the state to be inspectable, or the logic is complex enough that a class structure aids readability. functools.lru_cache uses a class-based approach internally.' },
    { q: 'When should you use functools.partial vs a lambda?', a: 'partial is preferred when: you want the name to be preserved in tracebacks (partial shows the original function name), you need to pre-fill multiple arguments or keyword arguments, or you want the partial to be picklable (lambdas are not picklable — important for multiprocessing). Use lambda for simple one-off key functions in sort() or filter() where readability matters more than reuse.' },
    { q: 'How does Python\'s functools.lru_cache work?', a: 'lru_cache wraps a function and stores (caches) its return value keyed by the arguments. On repeated calls with the same arguments, it returns the cached result without calling the function. The cache is bounded by maxsize (uses LRU eviction). Arguments must be hashable. Use @cache (Python 3.9+) for unbounded caching. The cache is per-instance for methods — use @cached_property for property-style caching.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Python functions are first-class objects; closures capture variables by reference; decorators are functions wrapping functions — always use @functools.wraps.',
    mustKnow: [
      'Functions are objects — storable, passable, returnable.',
      '*args collects positional varargs as tuple; **kwargs collects keyword varargs as dict.',
      'Closures capture by reference — the loop-variable bug is the classic gotcha.',
      'nonlocal lets inner functions reassign outer-scope variables.',
      '@functools.wraps preserves function metadata in decorators.',
      'Parameterised decorators need three layers: factory → decorator → wrapper.',
      'functools.partial pre-fills arguments; functools.lru_cache memoizes.',
    ],
    interviewFocus: [
      'Explain the closure loop-variable bug and how to fix it.',
      'What does @functools.wraps do and why is it important?',
      'Difference between *args in the definition vs *args at the call site.',
    ]
  };
}
