import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'OOP & Patterns': 'oop', 'Data & Types': 'data',
  'Async': 'async', 'Web & APIs': 'web', 'Data Science': 'ds',
  'Tooling': 'tooling', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'OOP & Patterns', 'Data & Types', 'Async', 'Web & APIs', 'Data Science', 'Tooling', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Python Fundamentals',       route: '/python', badge: 'Foundations', available: false,
    description: 'Variables, data types, control flow, functions, and Python\'s philosophy — the Zen of Python.',
    keyPoints: ['Dynamic typing: type is determined at runtime; annotations are hints, not enforcement', 'Truthy/falsy: None, 0, "", [], {}, set() are falsy', 'The Zen of Python (import this): readability counts, explicit is better than implicit'] },
  { title: 'Functions & Closures',      route: '/python', badge: 'Foundations', available: false,
    description: 'First-class functions, lambda, closures, decorators, and *args/**kwargs.',
    keyPoints: ['*args: positional varargs tuple; **kwargs: keyword varargs dict', 'Decorators: @wraps preserves __name__ and __doc__ of wrapped function', 'functools.lru_cache: memoization decorator — one line for caching'] },
  { title: 'List Comprehensions & Generators', route: '/python', badge: 'Foundations', available: false,
    description: 'List, dict, set comprehensions, generator expressions, and yield/yield from.',
    keyPoints: ['[x*2 for x in range(10) if x % 2 == 0] — filter + transform', 'Generator expression (x*2 for x in range(10)): lazy evaluation, memory-efficient', 'yield from: delegate to a sub-generator; use for recursive generators'] },
  { title: 'OOP in Python',             route: '/python', badge: 'OOP & Patterns', available: false,
    description: 'Classes, inheritance, multiple inheritance with MRO, dunder methods, and class vs static methods.',
    keyPoints: ['MRO (Method Resolution Order): C3 linearisation — use super() correctly', '__repr__ for debugging; __str__ for user display', '@dataclass: auto-generates __init__, __repr__, __eq__ from field annotations'] },
  { title: 'Dataclasses & Pydantic',    route: '/python', badge: 'OOP & Patterns', available: false,
    description: '@dataclass, NamedTuple, and Pydantic v2 models for validation, serialisation, and settings.',
    keyPoints: ['@dataclass(frozen=True): immutable; field(default_factory=list): mutable default', 'Pydantic: runtime validation from type annotations — model.model_dump() serialises', 'BaseSettings: load config from env vars with type validation'] },
  { title: 'Type Hints & mypy',         route: '/python', badge: 'Data & Types', available: false,
    description: 'Python type annotation system — Optional, Union, Literal, TypeVar, Protocol, and running mypy.',
    keyPoints: ['X | Y (PEP 604, Python 3.10+): preferred over Union[X, Y]', 'Protocol: structural subtyping — duck typing with type safety', 'TypeVar: generic type variables; ParamSpec: preserve callable signatures'] },
  { title: 'Collections & Itertools',   route: '/python', badge: 'Data & Types', available: false,
    description: 'defaultdict, Counter, deque, namedtuple, ChainMap — plus itertools and functools essentials.',
    keyPoints: ['Counter(words): frequency map in one line', 'defaultdict(list): auto-initialised values; deque: O(1) both-end append/pop', 'itertools.chain, groupby, product, combinations — lazy combinatoric tools'] },
  { title: 'Async Python (asyncio)',    route: '/python', badge: 'Async', available: false,
    description: 'async/await, event loop, tasks, asyncio.gather, and the difference from threading.',
    keyPoints: ['async def + await: cooperative multitasking on one thread', 'asyncio.gather(*coros): run coroutines concurrently; gather with return_exceptions=True', 'asyncio.run(): entry point; asyncio.create_task(): schedule without awaiting immediately'] },
  { title: 'Threading & Multiprocessing', route: '/python', badge: 'Async', available: false,
    description: 'The GIL, threading for I/O-bound tasks, multiprocessing for CPU-bound, and concurrent.futures.',
    keyPoints: ['GIL: only one thread executes Python bytecode at a time', 'ThreadPoolExecutor: I/O-bound; ProcessPoolExecutor: CPU-bound — bypasses GIL', 'concurrent.futures.as_completed: get results as futures finish, not in submission order'] },
  { title: 'FastAPI',                   route: '/python', badge: 'Web & APIs', available: false,
    description: 'Async REST APIs with FastAPI — Pydantic models, dependency injection, OpenAPI generation, and OAuth2.',
    keyPoints: ['Path operations auto-generate OpenAPI docs at /docs and /redoc', 'Depends(): injectable dependencies — DB sessions, auth, config', 'Background tasks: BackgroundTasks.add_task(fn, arg) runs after response sent'] },
  { title: 'Django',                    route: '/python', badge: 'Web & APIs', available: false,
    description: 'Full-stack web framework — models, views, templates, ORM, admin, and Django REST Framework.',
    keyPoints: ['MVT: Model-View-Template; URL dispatcher routes to views', 'Django ORM: queryset API with lazy evaluation, select_related, prefetch_related', 'DRF: Serializers + ViewSets + Routers for RESTful APIs'] },
  { title: 'NumPy & Pandas',            route: '/python', badge: 'Data Science', available: false,
    description: 'NumPy arrays, broadcasting, vectorised operations, and Pandas DataFrames for data analysis.',
    keyPoints: ['NumPy vectorisation: element-wise ops without Python loops — 100× faster', 'Broadcasting: shapes compatible if trailing dimensions match', 'Pandas: groupby, merge, pivot_table — SQL-like operations on DataFrames'] },
  { title: 'Machine Learning with scikit-learn', route: '/python', badge: 'Data Science', available: false,
    description: 'Classification, regression, clustering, pipelines, cross-validation, and model evaluation metrics.',
    keyPoints: ['Pipeline: chain transforms + model — prevents data leakage in cross-validation', 'GridSearchCV: exhaustive hyperparameter search with cross-validation', 'Classification report: precision, recall, F1, support per class'] },
  { title: 'Testing with pytest',       route: '/python', badge: 'Tooling', available: false,
    description: 'Fixtures, parametrize, mocking, coverage, and testing async code with pytest-asyncio.',
    keyPoints: ['@pytest.fixture: reusable test setup with scopes (function, class, module, session)', '@pytest.mark.parametrize: run one test with many input combinations', 'monkeypatch.setattr: patch objects without unittest.mock boilerplate'] },
  { title: 'Python Packaging & venv',   route: '/python', badge: 'Tooling', available: false,
    description: 'Virtual environments, pyproject.toml, setuptools, pip, Poetry, and publishing to PyPI.',
    keyPoints: ['uv: Rust-based package manager — 10–100× faster than pip', 'pyproject.toml: PEP 517/518 standard replaces setup.py and setup.cfg', 'Poetry: dependency resolution + lockfile + publish in one tool'] },
  { title: 'Python Cheat Sheet',        route: '/python', badge: 'Reference', available: false,
    description: 'Built-in functions, comprehension syntax, string methods, dataclass and type hint quick reference.',
    keyPoints: ['Built-ins: map, filter, zip, enumerate, sorted, min/max with key, any, all', 'String: f-strings, join, split, strip, replace, startswith/endswith', 'Type hint quick-reference: list[X], dict[K,V], X | None, Callable[[A], R]'] },
  { title: 'Python Interview Prep',     route: '/python', badge: 'Reference', available: false,
    description: '40+ Python interview questions — GIL, generators, decorators, OOP, async, and data science.',
    keyPoints: ['Explain the GIL and its implications for concurrency', 'What is the difference between a generator and an iterator?', 'When would you use asyncio vs threading vs multiprocessing?'] },
];

@Component({
  selector: 'app-python-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class PythonHome {
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
