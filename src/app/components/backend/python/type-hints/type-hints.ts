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
  selector: 'app-python-type-hints',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './type-hints.html',
  styleUrl: './type-hints.scss'
})
export class PythonTypeHints {
  readingTime = 20; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.9+';
  route = 'py-type-hints'; nextRoute = '/python/collections-itertools'; nextLabel = 'Collections & Itertools';

  quickRef: QuickRefItem[] = [
    { name: 'X | Y (PEP 604)', type: 'syntax', desc: 'Union type — X or Y. Python 3.10+. Prefer over Union[X, Y]. Use X | None instead of Optional[X].' },
    { name: 'list[X] / dict[K, V]', type: 'syntax', desc: 'Generic built-ins (Python 3.9+). No need to import from typing. tuple[X, ...] for homogeneous tuples.' },
    { name: 'TypeVar("T")', type: 'type', desc: 'Generic type variable. Constrain with bound=BaseClass or __constraints__=(int, str). Used for polymorphic functions.' },
    { name: 'Protocol', type: 'class', desc: 'Structural subtyping (duck typing with types). Any class with the required methods satisfies the Protocol — no explicit inheritance needed.' },
    { name: 'TypedDict', type: 'class', desc: 'Dict with typed keys. class Config(TypedDict): host: str; port: int. Checked by mypy, not at runtime.' },
    { name: 'Annotated[X, metadata]', type: 'type', desc: 'Attach metadata to a type hint. Used by Pydantic for Field() constraints, FastAPI for parameter docs.' },
    { name: 'Final[X]', type: 'type', desc: 'Marks a variable as constant — mypy rejects reassignment. Final without a type infers from the assigned value.' },
    { name: 'TYPE_CHECKING', type: 'keyword', desc: 'from typing import TYPE_CHECKING; if TYPE_CHECKING: import expensive_module — import only during static analysis, not runtime.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Type Hints — Hints, Not Enforcement',
      points: [
        'Python type hints are annotations — they are stored in __annotations__ but not enforced by the runtime. x: int = "hello" is valid Python that runs without error. Static type checkers (mypy, pyright) and IDE tools (PyCharm, VS Code with Pylance) use annotations to catch type errors before running the code.',
        'PEP 604 (Python 3.10) introduced the | union syntax: str | int | None is cleaner than Union[str, int, None] and is now the preferred form. For Python 3.9, use Union[str, int] from typing. For Python 3.8 and earlier, also need from __future__ import annotations to enable postponed evaluation of annotations.',
        'PEP 585 (Python 3.9) makes built-in collection types generic: list[str], dict[str, int], tuple[int, ...], set[float] — no need to import List, Dict, Tuple from typing. For Python 3.8, still import from typing. In new code targeting 3.9+, always use the built-in forms.',
        'from __future__ import annotations (PEP 563) makes ALL annotations in the file lazy strings — they are not evaluated at import time. This enables forward references without quotes and avoids circular import issues. All frameworks that use annotations at runtime (Pydantic, FastAPI, dataclasses) must call typing.get_type_hints(cls) to evaluate them.',
      ]
    },
    {
      heading: 'Generics — TypeVar and Generic',
      points: [
        'TypeVar creates a type variable: T = TypeVar("T"). Use it to express relationships between argument and return types: def first(items: list[T]) -> T: return items[0]. mypy infers T from the call site: first([1, 2, 3]) → T is int; first(["a"]) → T is str.',
        'Constrained TypeVars restrict the type to a set: AnyStr = TypeVar("AnyStr", str, bytes). Bound TypeVars restrict to a base class: T = TypeVar("T", bound=Comparable). Use bound when you need a specific interface (the type must be a subtype of the bound).',
        'Generic classes: class Stack(Generic[T]): def push(self, item: T) → None: ... — instances are typed: stack = Stack[int](); stack.push(1) is ok; stack.push("a") is a mypy error. Python 3.12 introduced PEP 695 syntax: def first[T](items: list[T]) → T: ... with inline type parameters.',
        'ParamSpec (PEP 612) captures the parameter specification of a callable — useful for decorator type signatures: P = ParamSpec("P"); def decorator(fn: Callable[P, T]) → Callable[P, T]: ... This tells mypy that the decorator preserves the wrapped function\'s signature.',
      ]
    },
    {
      heading: 'Protocol — Structural Subtyping',
      points: [
        'Protocol (Python 3.8) enables structural subtyping — duck typing with type checking. class Drawable(Protocol): def draw(self) → None: ... Any class with a draw method satisfies Drawable, without explicitly subclassing it. This is the typed equivalent of duck typing: if it quacks like a duck.',
        'Protocol avoids the coupling of ABC inheritance. When you can\'t modify a third-party class to inherit from your ABC, use a Protocol instead — the third-party class already satisfies the protocol if it has the required methods.',
        'runtime_checkable Protocol: @runtime_checkable class Drawable(Protocol): ... enables isinstance(obj, Drawable) at runtime. Without this decorator, isinstance checks raise TypeError. Use sparingly — runtime isinstance checks on protocols are slow and only check for method existence, not signatures.',
        'Protocols compose: class ReadableWritable(Readable, Writable, Protocol): pass. This requires both the Readable and Writable protocols to be satisfied. You can combine Protocol with other base classes: class Config(TypedDict, total=False): host: str — optional keys with total=False.',
      ]
    },
    {
      heading: 'mypy — Running the Type Checker',
      points: [
        'Install mypy: pip install mypy. Run: mypy src/ or mypy --strict src/ for strictest checking. mypy.ini or pyproject.toml [tool.mypy] configures: ignore_missing_imports = true, disallow_untyped_defs = true, strict = true.',
        'Common mypy flags: --strict enables all strict checks; --ignore-missing-imports suppresses errors for third-party libraries without stubs; --show-error-codes shows error codes (e.g. [arg-type]) for precise suppression with # type: ignore[arg-type].',
        'Type stubs: libraries without annotations need stub packages — typeshed provides stubs for the standard library; pip install types-requests adds stubs for the requests library. Check stubs.typeshed.org or pyrigh\'s bundled stubs for available stubs.',
        'Use # type: ignore[error-code] to suppress specific mypy errors on a line. Plain # type: ignore suppresses all errors on the line — avoid it. cast(T, value) tells mypy to treat value as type T at a specific point — use when you know more than mypy can infer, not to silence errors you should fix.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Type hint syntax',
      language: 'typescript',
      code: `from __future__ import annotations
from typing import TypeVar, Generic, Protocol, TypedDict, Annotated, Final, overload
from collections.abc import Callable, Sequence

# Built-in generics (Python 3.9+)
def process(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Union with | (Python 3.10+)
def parse(value: str | int | None) -> int:
    if value is None: return 0
    return int(value)

# TypeVar — polymorphic function
T = TypeVar("T")

def first(items: Sequence[T]) -> T:
    if not items: raise IndexError("empty sequence")
    return items[0]

result: int = first([1, 2, 3])     # T inferred as int
word: str  = first(["hello"])      # T inferred as str

# Generic class
class Stack(Generic[T]):
    def __init__(self) -> None:
        self._data: list[T] = []
    def push(self, item: T) -> None: self._data.append(item)
    def pop(self) -> T: return self._data.pop()

stack: Stack[int] = Stack()
stack.push(42)

# Protocol — structural typing
class Closeable(Protocol):
    def close(self) -> None: ...

def cleanup(resource: Closeable) -> None:
    resource.close()

class MyConn:               # does NOT inherit from Closeable
    def close(self) -> None: print("closed")

cleanup(MyConn())   # ✓ mypy: MyConn satisfies Closeable

# TypedDict
class Config(TypedDict, total=False):   # total=False → all keys optional
    host: str
    port: int
    debug: bool

# Annotated — Pydantic / FastAPI use this
PositiveInt = Annotated[int, "must be > 0"]

# Final — constant
MAX_RETRIES: Final[int] = 3
# MAX_RETRIES = 5   # mypy error: Cannot assign to final name`
    },
    {
      label: 'overload & mypy config',
      language: 'typescript',
      code: `from typing import overload, Literal

# @overload — different signatures for different argument types
@overload
def parse_number(value: str) -> int: ...
@overload
def parse_number(value: int) -> int: ...
@overload
def parse_number(value: None) -> None: ...

def parse_number(value: str | int | None) -> int | None:
    if value is None: return None
    return int(value)

reveal_type(parse_number("42"))   # mypy: int (not int | None)
reveal_type(parse_number(None))   # mypy: None

# Literal — exact value types
Mode = Literal["r", "w", "a", "rb", "wb"]

def open_file(path: str, mode: Mode) -> None: ...

# open_file("data.txt", "x")   # mypy error: "x" not in Mode

# TYPE_CHECKING — avoid runtime circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from some_heavy_module import HeavyClass   # only imported by mypy

def process(obj: HeavyClass) -> None: ...

# mypy.ini or pyproject.toml [tool.mypy]
# [mypy]
# strict = true
# ignore_missing_imports = true
# disallow_untyped_defs = true
# warn_return_any = true
#
# Run: mypy --strict src/
# Suppress specific error: value = thing()  # type: ignore[assignment]`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Optional[X] instead of X | None',
      wrong: `from typing import Optional
def greet(name: Optional[str]) -> Optional[str]:
    return name.upper() if name else None`,
      right: `def greet(name: str | None) -> str | None:
    return name.upper() if name else None`,
      explanation: 'Optional[X] is equivalent to Union[X, None]. Since Python 3.10, X | None is the preferred, more readable form and does not require an import from typing. In Python 3.9 and below, you still need from __future__ import annotations or from typing import Optional — but on 3.10+ targets, use | None.'
    },
    {
      title: 'Annotating with List/Dict instead of list/dict',
      wrong: `from typing import List, Dict, Tuple, Set
def process(items: List[str]) -> Dict[str, int]: ...`,
      right: `def process(items: list[str]) -> dict[str, int]: ...`,
      explanation: 'Since Python 3.9, built-in collection types (list, dict, tuple, set, frozenset) support subscripting directly. The typing.List, typing.Dict etc. were kept for backward compatibility but are deprecated. For Python 3.8, add from __future__ import annotations to use the new syntax without runtime errors.'
    },
    {
      title: 'Putting Protocol method bodies instead of ...',
      wrong: `class Drawable(Protocol):
    def draw(self) -> None:
        pass   # Protocol methods should not have bodies`,
      right: `class Drawable(Protocol):
    def draw(self) -> None: ...   # ellipsis marks abstract method`,
      explanation: 'Protocol method bodies are misleading — the Protocol is not an ABC with default implementations; it is a structural interface specification. Convention is to use ... (ellipsis) as the body, signalling that the method is abstract and has no meaningful default. Using pass also works but ... is the idiom in typing stubs and Protocols.'
    },
    {
      title: 'Using cast() to silence type errors instead of fixing them',
      wrong: `from typing import cast
result = cast(str, some_fn())   # silences error without fixing root cause`,
      right: `# Investigate: why does some_fn() not return str?
# Fix the type annotation or add a runtime assertion
value = some_fn()
assert isinstance(value, str), f"Expected str, got {type(value)}"
result: str = value`,
      explanation: 'cast(T, value) tells mypy to treat value as type T without any runtime check — it is a no-op at runtime. Overusing cast defeats the purpose of type checking. Only use cast where you have genuine knowledge that mypy cannot infer (e.g. narrowing after isinstance in a context mypy does not handle). Prefer isinstance narrowing or fixing the source annotation.'
    },
  ];

  challenge: Challenge = {
    title: 'Generic Repository Protocol',
    language: 'typescript',
    description: 'Write a generic Repository[T] Protocol with methods get(id: int) -> T | None, save(item: T) -> None, and delete(id: int) -> bool. Write a concrete InMemoryRepository[T] class that satisfies the Protocol. Then write a generic service function find_or_raise(repo: Repository[T], id: int) -> T that uses the Protocol and raises KeyError if not found. Verify mypy catches type errors.',
    hints: [
      'T = TypeVar("T") for the generic parameter',
      'InMemoryRepository does NOT need to inherit from Repository — just implement the methods',
      'Use @runtime_checkable if you want isinstance to work at runtime',
    ],
    starterCode: `from typing import TypeVar, Protocol, Generic, runtime_checkable

T = TypeVar("T")

@runtime_checkable
class Repository(Protocol[T]):
    pass

class InMemoryRepository(Generic[T]):
    pass

def find_or_raise(repo: Repository[T], id: int) -> T:
    pass`,
    solution: `from typing import TypeVar, Protocol, Generic, runtime_checkable

T = TypeVar("T")

@runtime_checkable
class Repository(Protocol[T]):
    def get(self, id: int) -> T | None: ...
    def save(self, item: T) -> None: ...
    def delete(self, id: int) -> bool: ...

class InMemoryRepository(Generic[T]):
    def __init__(self) -> None:
        self._store: dict[int, T] = {}
        self._next_id = 1

    def get(self, id: int) -> T | None:
        return self._store.get(id)

    def save(self, item: T) -> None:
        self._store[self._next_id] = item
        self._next_id += 1

    def delete(self, id: int) -> bool:
        return self._store.pop(id, None) is not None

def find_or_raise(repo: Repository[T], id: int) -> T:
    item = repo.get(id)
    if item is None:
        raise KeyError(f"No item with id={id}")
    return item

repo: InMemoryRepository[str] = InMemoryRepository()
repo.save("hello")
print(find_or_raise(repo, 1))   # "hello"
# find_or_raise(repo, 99)       # KeyError`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between str | None and Optional[str]?', options: ['They are identical — | None is just modern syntax', 'str | None is only valid at runtime; Optional is for mypy only', 'Optional[str] includes all falsy strings; str | None does not', 'str | None requires Python 3.12+'], answer: 0, explanation: 'Optional[str] is exactly equivalent to Union[str, None]. The | syntax (PEP 604) is simply more readable and does not require an import. They mean the same thing to both mypy and the runtime. In Python 3.9, the | syntax for type hints requires from __future__ import annotations to avoid a runtime TypeError.' },
    { q: 'What does Protocol enable compared to ABC?', options: ['Faster method dispatch', 'Structural (duck) typing with type safety — no explicit inheritance needed', 'Runtime validation of method signatures', 'Multiple return types'], answer: 1, explanation: 'Protocol enables structural subtyping: any class that has the required methods satisfies the Protocol, without inheriting from it. ABC requires explicit inheritance: class Dog(Animal) → Dog is an Animal. Protocol requires no declaration: a class with a draw() method satisfies Drawable(Protocol) automatically. This is essential for typing third-party classes you cannot modify.' },
    { q: 'What does TYPE_CHECKING do?', options: ['Enables runtime type checking for all annotations', 'A bool that is True during mypy analysis but False at runtime — prevents importing heavy modules at runtime', 'Enables strict mode in the file', 'Converts type hints to assertions'], answer: 1, explanation: 'typing.TYPE_CHECKING is False at runtime and True when mypy (or pyright) analyses the code. This lets you write if TYPE_CHECKING: import heavy_module for type annotations only — the import never runs in production. This avoids circular imports and avoids loading expensive modules just for type hints.' },
    { q: 'What is the difference between TypeVar with bound vs constraints?', options: ['They are the same thing', 'bound restricts to subclasses of a base; constraints restrict to an exact set of types', 'bound is for runtime; constraints are for mypy only', 'constraints work with Protocol; bound works with ABC'], answer: 1, explanation: 'T = TypeVar("T", bound=BaseClass) accepts T or any subclass of BaseClass. T = TypeVar("T", int, str) accepts exactly int or str (not their subclasses). Use bound for "must have this interface"; use constraints for "must be one of these exact types". AnyStr = TypeVar("AnyStr", str, bytes) is the classic constrained TypeVar.' },
    { q: 'What does from __future__ import annotations do?', options: ['Enables Python 4.0 syntax features', 'Defers evaluation of all annotations to strings — avoids forward reference errors and speeds up module import', 'Enables PEP 695 type alias syntax', 'Imports the annotations module at runtime'], answer: 1, explanation: 'PEP 563 (Python 3.7+): from __future__ import annotations makes all type annotations lazy strings, not evaluated at definition time. This allows forward references (class Foo: def fn(self) -> Foo — normally a NameError). It also speeds up import since annotation expressions are not evaluated. In Python 3.10+ you can write class Foo: x: int | str instead of Union[int, str].' },
    { q: 'What is the difference between Optional[X] and X | None in Python 3.10+?', options: ['Optional[X] means "any type"; X | None means exactly None or X', 'They are identical — Optional[X] is equivalent to Union[X, None] which equals X | None', 'X | None requires runtime evaluation; Optional[X] does not', 'Optional[X] accepts empty string; X | None does not'], answer: 1, explanation: 'Optional[X] from typing is exactly Union[X, None]. In Python 3.10+, X | None is the equivalent union syntax using the | operator at runtime. They are semantically identical — prefer X | None in new code for brevity. Mypy and pyright treat them identically. Note: Optional[X] does NOT mean "optional parameter" — it means the value can be X or None.' },
  ];

  qna: QnaItem[] = [
    { q: 'Do type hints affect Python\'s runtime performance?', a: 'Minimally. Annotations are stored as strings (with from __future__ import annotations) or evaluated lazily — they are not enforced at runtime. The cost is a tiny extra dictionary entry per annotated name. Some frameworks (Pydantic, FastAPI, dataclasses) use typing.get_type_hints() to inspect annotations at startup — this has a one-time cost when the class is first imported, but it is negligible. At function call time, there is zero overhead from type annotations.' },
    { q: 'When should you use TypedDict vs dataclass vs Pydantic?', a: 'TypedDict: for typing existing dicts you cannot change (e.g. JSON API responses, **kwargs patterns). No classes or instances — just a type hint for a dict. Dataclass: for internal models where you want class-like access (obj.field) and some auto-generated boilerplate, with no runtime validation. Pydantic: for external data (API requests, config, user input) that needs validation and coercion at runtime. TypedDict is purely static; dataclass is structural; Pydantic is structural + runtime validated.' },
    { q: 'What is the purpose of Annotated[X, metadata]?', a: 'Annotated lets you attach metadata to a type hint without affecting the type itself. The first argument is the actual type; subsequent arguments are metadata that tools can use. Pydantic uses Annotated[int, Field(gt=0)] for validation constraints. FastAPI uses it for API parameter docs. mypy sees only the type (int) and ignores the metadata. This pattern decouples the type from framework-specific constraints, keeping the type annotation portable.' },
    { q: 'Do Python type hints affect runtime behavior, or are they purely for static analysis?', a: 'By default, type hints are NOT enforced at runtime — Python itself ignores them during execution; def add(a: int, b: int) -> int will happily accept strings and attempt to add them with no error from the type hints themselves. They exist purely to enable static type checkers (mypy, pyright) to catch type mismatches before runtime, and to improve IDE autocomplete and documentation. To get runtime enforcement, you need an additional library like pydantic or explicit manual isinstance() checks — plain type hints alone are a documentation and tooling aid, not a runtime guarantee.' },
    { q: 'What is the difference between Optional[X] and X | None in Python type hints, and which should you use?', a: 'Optional[X] (from the typing module) and X | None are functionally equivalent — both mean "either type X or None". Optional[X] is the older syntax that works on all supported Python versions via from typing import Optional. The X | None union syntax (PEP 604) was introduced in Python 3.10 and is more concise and readable, requiring no import — but it only works natively at runtime on 3.10+ (earlier versions need from __future__ import annotations to use it in type hints, since those become unevaluated strings). Modern codebases targeting 3.10+ generally prefer the X | None syntax.' },
    { q: 'How do generic types like List[int] or list[int] differ from just using list as a type hint?', a: 'A bare list type hint only tells a type checker that the value is some kind of list, with no information about what it contains — code accessing items.append("not a number") on a hinted list: list would not be flagged as an error even if every existing usage assumed integers. A generic hint like list[int] (or List[int] from typing on older Python) specifies the element type, letting the type checker catch type mismatches in list contents (appending a string to a list[int]) and giving accurate autocomplete/type inference for elements retrieved via indexing or iteration.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Type hints are static annotations — use X | None over Optional, list[X] over List[X] (3.9+), Protocol for duck-typed interfaces, and mypy to catch errors statically.',
    mustKnow: [
      'X | None preferred over Optional[X]. list[X] / dict[K, V] over List / Dict (3.9+).',
      'TypeVar("T") creates generic type variables for polymorphic functions.',
      'Protocol: structural typing — no inheritance needed, just matching methods.',
      'TYPE_CHECKING: True only during static analysis, prevents runtime imports.',
      'Annotated[X, metadata]: attach Pydantic/FastAPI constraints to a type.',
      'mypy --strict checks all unannotated code — add incrementally to existing projects.',
    ],
    interviewFocus: [
      'Explain the difference between ABC inheritance and Protocol structural typing.',
      'What does TYPE_CHECKING prevent?',
      'How do TypeVar bound and constraints differ?',
    ]
  };
}
