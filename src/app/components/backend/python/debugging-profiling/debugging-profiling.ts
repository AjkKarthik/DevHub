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
  selector: 'app-python-debugging-profiling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './debugging-profiling.html',
  styleUrl: './debugging-profiling.scss'
})
export class PythonDebuggingProfiling {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.7+';
  route = 'py-debugging-profiling'; nextRoute = '/python/cheatsheet'; nextLabel = 'Python Cheat Sheet';

  quickRef: QuickRefItem[] = [
    { name: 'breakpoint()', type: 'keyword', desc: 'Drop into the debugger at that line. Uses pdb by default; set PYTHONBREAKPOINT env var to use pudb/ipdb instead.' },
    { name: 'pdb commands', type: 'keyword', desc: 'n (next), s (step into), c (continue), l (list source), p expr (print), pp obj (pprint), u/d (up/down stack), q (quit), b N (break at line N).' },
    { name: 'python -m cProfile -s cumtime script.py', type: 'keyword', desc: 'Profile script. Sort by cumtime (cumulative time). Add -o file.prof to save for later analysis with pstats.' },
    { name: 'line_profiler / @profile', type: 'keyword', desc: 'pip install line_profiler. Decorate with @profile, run kernprof -lv script.py. Shows time per line — slower than cProfile but surgical.' },
    { name: 'tracemalloc', type: 'keyword', desc: 'stdlib memory profiler. tracemalloc.start(); ... ; snapshot = tracemalloc.take_snapshot(). Built-in, zero install.' },
    { name: 'memory_profiler @profile', type: 'keyword', desc: 'pip install memory_profiler. Line-by-line memory usage. mprof run script.py then mprof plot for graph.' },
    { name: 'timeit', type: 'keyword', desc: 'python -m timeit -n 1000 "stmt". Or timeit.timeit(lambda: fn(), number=10000) in code. Microsecond-accurate micro-benchmarks.' },
    { name: 'py-spy top', type: 'keyword', desc: 'Sampling profiler — attaches to a running process. py-spy top --pid 12345. No code changes needed. py-spy record for flamegraph.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'pdb — The Built-in Debugger',
      points: [
        'pdb (Python DeBugger) is the stdlib interactive debugger. breakpoint() (Python 3.7+) inserts a breakpoint and drops you into the pdb REPL when execution reaches that line. The PYTHONBREAKPOINT environment variable can redirect to a richer debugger: PYTHONBREAKPOINT=pudb.set_trace or PYTHONBREAKPOINT=ipdb.set_trace.',
        'Essential pdb commands: n (next — execute current line, stay at same frame), s (step — step into function calls), c (continue until next breakpoint), l (list source around current line), p expr (print expression), pp obj (pretty-print), u / d (move up/down call stack), b 42 (set breakpoint at line 42), w (where — print current stack trace), q (quit). Combine with regular Python expressions — you can call functions, assign variables, inspect objects.',
        'Post-mortem debugging: import pdb; pdb.pm() after an exception, or python -m pdb script.py. pdb.pm() opens the debugger at the frame where the last exception occurred — useful for debugging in REPL sessions. VS Code, PyCharm, and Jupyter all have GUI debuggers wrapping pdb under the hood.',
        'ipdb (pip install ipdb) is pdb with IPython integration: tab completion, syntax highlighting, multi-line editing. pudb (pip install pudb) is a full-screen terminal UI debugger — very useful in remote sessions. Both use the same commands as pdb. Set PYTHONBREAKPOINT once in your shell profile to always use your preferred debugger.',
      ]
    },
    {
      heading: 'Profiling CPU Performance',
      points: [
        'cProfile is the stdlib CPU profiler. Run a script: python -m cProfile -s cumtime script.py. Sort flags: cumtime (total time including subcalls — usually the most useful), tottime (self time only), calls, ncalls. Pipe to head -20 for the top 20 functions. Save to file: python -m cProfile -o output.prof script.py. Analyse with: python -m pstats output.prof.',
        'pstats in code: import pstats; p = pstats.Stats("output.prof"); p.sort_stats("cumtime"); p.print_stats(20). snakeviz (pip install snakeviz) provides a browser-based flamegraph: snakeviz output.prof. Much easier to read than raw cProfile output for complex programs.',
        'line_profiler (pip install line_profiler) profiles line-by-line within specific functions. Decorate with @profile (the decorator is injected at runtime by kernprof): kernprof -lv script.py. Output shows: hits, total time, time per hit, % time per line. Use this AFTER cProfile identifies the hot function — then zoom in with line_profiler to find the hot line.',
        'py-spy is a sampling profiler that attaches to a running process without modifying code: py-spy top --pid $(pgrep python). py-spy record -o output.svg --pid PID generates a flamegraph. Sampling profilers have near-zero overhead — safe to run in production. For async code, py-spy -subprocesses handles asyncio tasks. Pyinstrument (pip install pyinstrument) is another low-overhead profiler focused on wall time.',
      ]
    },
    {
      heading: 'Memory Profiling',
      points: [
        'tracemalloc is the stdlib memory profiler (Python 3.4+). tracemalloc.start(); ... code ...; snapshot = tracemalloc.take_snapshot(); stats = snapshot.statistics("lineno"); print(stats[:10]). Tracks memory allocations per line. Compare two snapshots to find what code allocates the most memory between two points. Built-in — no install needed.',
        'memory_profiler (pip install memory_profiler) gives line-by-line memory usage. Decorate with @profile (same as line_profiler — incompatible, use one at a time): mprof run script.py; mprof plot. Output shows MiB per line. objgraph (pip install objgraph) finds memory leaks by tracking which types have increasing instance counts: objgraph.growth(limit=5) prints the 5 types with the most new instances.',
        'Common memory issues: holding references in global dicts (caches without eviction), large DataFrames left in memory, circular references preventing garbage collection, forgotten asyncio tasks. Python\'s gc module can detect reference cycles: gc.collect(); gc.garbage for uncollectable objects. Use del and context managers to release resources promptly.',
        'gc.set_debug(gc.DEBUG_LEAK) logs objects in cyclic garbage that cannot be freed. weakref.WeakValueDictionary / WeakSet for caches — allows garbage collection of cached objects when no other references exist. sys.getsizeof(obj) gives shallow size; for deep size, recursively sum — or use the third-party pympler.asizeof.',
      ]
    },
    {
      heading: 'Benchmarking and Logging for Observability',
      points: [
        'timeit for micro-benchmarks: python -m timeit -n 100000 "sum(range(1000))". In code: timeit.timeit(lambda: my_fn(), number=10000). timeit disables garbage collection between runs — use timeit.repeat() for multiple runs and take the minimum (not average — outliers are noise, minimum is the true cost). The default_timer uses perf_counter (wall time) on Python 3.3+.',
        'time.perf_counter() for manual timing in code: start = time.perf_counter(); ... ; elapsed = time.perf_counter() - start. perf_counter is the highest-resolution clock. For timing async code, use the same approach around await calls. time.process_time() measures CPU time only (excludes I/O wait) — useful for comparing CPU-bound algorithm costs.',
        'Structured logging with structlog or standard logging + JSON formatter enables searchable logs in production. logging.basicConfig(level=logging.DEBUG) for development. Use logging.getLogger(__name__) in modules — never logging.warning() at the module level. structlog.get_logger().info("event", user_id=id, latency=0.12) produces machine-parseable JSON.',
        'Exception context: except Exception as e: raise RuntimeError("context about what was happening") from e — the from e chain preserves the original traceback. rich.traceback.install() makes tracebacks readable in development. Sentry (sentry-sdk) captures exceptions with full context in production. logging.captureWarnings(True) routes Python warnings through logging.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'pdb Debugging',
      language: 'typescript',
      code: `# Basic breakpoint
def process_items(items: list) -> dict:
    result = {}
    for item in items:
        breakpoint()  # drops into pdb here
        result[item["id"]] = item["value"] * 2
    return result

# Post-mortem: run in REPL
# import pdb; pdb.pm()

# pdb commands cheat sheet:
# (Pdb) l         - list 11 lines around current
# (Pdb) n         - next (step over)
# (Pdb) s         - step (into function calls)
# (Pdb) c         - continue
# (Pdb) p item    - print item
# (Pdb) pp item   - pprint item
# (Pdb) b 42      - breakpoint at line 42
# (Pdb) w         - where (stack trace)
# (Pdb) u / d     - up / down the call stack
# (Pdb) q         - quit

# Conditional breakpoint — no pdb spam:
for item in items:
    if item["id"] == "bad_item":
        breakpoint()   # only breaks for the specific item

# Use ipdb instead of pdb (better UX):
# PYTHONBREAKPOINT=ipdb.set_trace python script.py

# Or set once in shell profile:
# export PYTHONBREAKPOINT=ipdb.set_trace`
    },
    {
      label: 'CPU Profiling',
      language: 'typescript',
      code: `# === cProfile ===
# Command line:
# python -m cProfile -s cumtime app.py | head -30

# In code:
import cProfile
import pstats
from io import StringIO

pr = cProfile.Profile()
pr.enable()
# ... code to profile ...
process_data(large_dataset)
pr.disable()

sio = StringIO()
ps = pstats.Stats(pr, stream=sio).sort_stats("cumtime")
ps.print_stats(20)
print(sio.getvalue())

# Save for snakeviz:
# pr.dump_stats("profile.prof")
# snakeviz profile.prof    (browser flamegraph)

# === line_profiler ===
# pip install line_profiler
# kernprof -lv script.py

from line_profiler import profile  # type: ignore

@profile
def slow_function(data: list) -> list:
    result = []
    for item in data:
        result.append(expensive_op(item))   # <-- identified as 82% of time
    return result

# === py-spy (no code changes, attach to running process) ===
# py-spy top --pid $(pgrep -n python)
# py-spy record -o flamegraph.svg --pid PID

# === timeit micro-benchmark ===
import timeit

# Compare two implementations:
setup = "data = list(range(1000))"
t1 = timeit.timeit("sum(data)", setup=setup, number=100_000)
t2 = timeit.timeit("[x for x in data if x > 0]", setup=setup, number=100_000)
print(f"sum: {t1:.3f}s  list_comp: {t2:.3f}s")`
    },
    {
      label: 'Memory Profiling',
      language: 'typescript',
      code: `# === tracemalloc (built-in) ===
import tracemalloc

tracemalloc.start()

# Code to profile:
import json
data = [{"id": i, "value": "x" * 1000} for i in range(10_000)]
serialized = json.dumps(data)

snapshot = tracemalloc.take_snapshot()
stats = snapshot.statistics("lineno")

print("Top 10 memory allocations:")
for stat in stats[:10]:
    print(stat)

# Compare snapshots to find the leak:
snapshot1 = tracemalloc.take_snapshot()
do_something_that_might_leak()
snapshot2 = tracemalloc.take_snapshot()

top_stats = snapshot2.compare_to(snapshot1, "lineno")
for stat in top_stats[:5]:
    print(stat)

tracemalloc.stop()

# === memory_profiler (per-line, pip install memory_profiler) ===
# @profile decorator (injected by mprof/kernprof)
# mprof run script.py
# mprof plot

# === objgraph (find what's growing) ===
import objgraph

before = objgraph.typestats()
do_work()
objgraph.growth(limit=5)   # shows 5 types with most new instances

# Trace back-references for leaking objects:
leaking_objs = objgraph.by_type("MyClass")[:3]
objgraph.show_backrefs(leaking_objs[0], max_depth=5)`
    },
    {
      label: 'Logging & Structured Errors',
      language: 'typescript',
      code: `# === Structured logging ===
import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def fetch_user(user_id: int) -> dict:
    logger.debug("fetching user", extra={"user_id": user_id})
    try:
        user = db.get(user_id)
        logger.info("user fetched", extra={"user_id": user_id, "found": bool(user)})
        return user
    except Exception:
        logger.exception("failed to fetch user", extra={"user_id": user_id})
        raise

# === Exception chaining ===
def process(record: dict) -> None:
    try:
        value = int(record["amount"])
    except (KeyError, ValueError) as e:
        raise ValueError(f"Invalid record {record!r}: missing or non-numeric amount") from e
    # 'from e' preserves the original traceback in the chained exception

# === structlog (pip install structlog) — JSON for production ===
import structlog

log = structlog.get_logger()
log.info("request.start", method="GET", path="/users/42", user_id=42)
log.error("db.error", exc_info=True, query="SELECT...", duration_ms=1234)

# === rich tracebacks (pip install rich) ===
from rich.traceback import install
install(show_locals=True)   # much prettier tracebacks in dev

# === timing context manager ===
import time
from contextlib import contextmanager

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        logger.debug(f"{label} took {elapsed*1000:.1f}ms")`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using print() for debugging instead of logging',
      wrong: `def process(data):
    print("data:", data)   # pollutes stdout, left in prod
    print("result:", result)
    return result`,
      right: `import logging
logger = logging.getLogger(__name__)

def process(data):
    logger.debug("processing data", extra={"data": data})
    logger.debug("got result", extra={"result": result})
    return result`,
      explanation: 'print() statements are easy to forget in production code, pollute stdout, cannot be filtered by level, and have no timestamps or context. logging.debug() is invisible unless DEBUG level is enabled, supports structured context, can be routed to files/services, and can be filtered. logger.debug() has zero overhead in production (when DEBUG is off, the log call short-circuits before string formatting).'
    },
    {
      title: 'Profiling the wrong scope (entire program vs hot path)',
      wrong: `# Profile the entire Django request cycle
python -m cProfile manage.py runserver
# Result: 10,000+ entries, cannot tell what's slow`,
      right: `# Profile just the suspected function
import cProfile

pr = cProfile.Profile()
pr.enable()
result = slow_query_function(data)   # only the suspect
pr.disable()
pr.print_stats(sort="cumtime")`,
      explanation: 'Profiling the entire program generates thousands of entries across framework code, making it impossible to identify your bottleneck. Narrow the scope: profile only the function or code path you suspect is slow. Use timeit or time.perf_counter() around even smaller scopes. Flame graphs (snakeviz) help for larger profiles by making the hierarchy visual — start wide, then zoom in.'
    },
    {
      title: 'Losing the original exception when catching and raising',
      wrong: `def load_config(path: str) -> dict:
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError("Failed to load config")  # original traceback lost!`,
      right: `def load_config(path: str) -> dict:
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError(f"Failed to load config at {path!r}") from e   # 'from e' chains`,
      explanation: 'raise RuntimeError("msg") without from e creates a new exception that replaces the original — the original FileNotFoundError or JSONDecodeError traceback disappears. raise ... from e chains the exceptions, showing BOTH in the traceback: "During handling of the above exception, another exception occurred." This is critical for debugging: you see both the original cause and where you caught it.'
    },
    {
      title: 'Benchmarking with time.time() instead of timeit',
      wrong: `import time
start = time.time()
for _ in range(1000):
    result = my_function()
end = time.time()
print(f"{(end-start)/1000*1000:.3f}ms per call")
# Inaccurate: includes GC pauses, OS jitter, startup noise`,
      right: `import timeit
# timeit disables GC, runs multiple times, uses perf_counter:
t = timeit.timeit(my_function, number=100_000)
print(f"{t/100_000*1_000_000:.1f}µs per call")

# Or for bigger benchmarks, use min() of repeat():
times = timeit.repeat(my_function, repeat=5, number=10_000)
print(f"best: {min(times)/10_000*1e6:.1f}µs")`,
      explanation: 'time.time() is affected by garbage collection pauses, system clock adjustments, and OS scheduling — making micro-benchmark results noisy and unreliable. timeit explicitly disables GC between runs, uses the highest-resolution clock (perf_counter), and runs thousands of iterations. For benchmarking, take the minimum of multiple repeats — the minimum is the "true" cost; higher values are noise from system interrupts.'
    },
  ];

  challenge: Challenge = {
    title: 'Profile and Fix a Slow Function',
    language: 'typescript',
    description: 'You have a slow find_duplicates() function. (1) Write a wrapper that profiles it using cProfile and prints the top 10 functions by cumtime; (2) identify the bottleneck (it uses a nested loop — O(n²)); (3) rewrite using a set/Counter for O(n); (4) benchmark both with timeit and confirm the speedup.',
    hints: [
      'cProfile.Profile() with enable/disable, pstats.Stats to print_stats(10)',
      'collections.Counter counts occurrences — values > 1 are duplicates',
      'timeit.timeit(lambda: fn(data), number=1000) for both versions',
    ],
    starterCode: `import cProfile, pstats
from io import StringIO

def find_duplicates_slow(items: list) -> list:
    # O(n^2) — nested loop
    duplicates = []
    for i, item in enumerate(items):
        for j, other in enumerate(items):
            if i != j and item == other and item not in duplicates:
                duplicates.append(item)
    return duplicates

data = list(range(500)) + list(range(100))  # has duplicates 0-99

def profile_it():
    # TODO: profile find_duplicates_slow(data) and print top 10 by cumtime
    pass

def find_duplicates_fast(items: list) -> list:
    # TODO: O(n) implementation using Counter or set
    pass`,
    solution: `import cProfile, pstats, timeit
from io import StringIO
from collections import Counter

def find_duplicates_slow(items):
    duplicates = []
    for i, item in enumerate(items):
        for j, other in enumerate(items):
            if i != j and item == other and item not in duplicates:
                duplicates.append(item)
    return duplicates

data = list(range(500)) + list(range(100))

def profile_it():
    pr = cProfile.Profile()
    pr.enable()
    find_duplicates_slow(data)
    pr.disable()
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats("cumtime")
    ps.print_stats(10)
    print(s.getvalue())

def find_duplicates_fast(items):
    counts = Counter(items)
    return [item for item, count in counts.items() if count > 1]

profile_it()

t_slow = timeit.timeit(lambda: find_duplicates_slow(data), number=100)
t_fast = timeit.timeit(lambda: find_duplicates_fast(data), number=100)
speedup = t_slow / t_fast
print(f"Slow: {t_slow:.3f}s  Fast: {t_fast:.3f}s  Speedup: {speedup:.0f}x")`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between tottime and cumtime in cProfile output?', options: ['tottime is wall time; cumtime is CPU time', 'tottime is time spent in the function itself (excluding subcalls); cumtime is total time including all called functions', 'tottime counts iterations; cumtime counts total calls', 'There is no difference'], answer: 1, explanation: 'tottime (total time) measures time spent inside the function body only — it excludes time in functions it calls. cumtime (cumulative time) measures total time including all subcalls. Sort by cumtime (-s cumtime) to find which functions are most expensive end-to-end. Sort by tottime to find functions that are inherently expensive before subcalls are removed. cumtime is usually the right starting point.' },
    { q: 'What does PYTHONBREAKPOINT=0 do?', options: ['Disables the Python debugger globally', 'Sets the default breakpoint to line 0', 'Disables all breakpoint() calls — they become no-ops', 'Enables verbose breakpoint logging'], answer: 2, explanation: 'Setting PYTHONBREAKPOINT=0 disables all breakpoint() calls — they become no-ops without modifying code. This is useful in production: add breakpoint() calls during development, then set PYTHONBREAKPOINT=0 in the production environment. Alternatively, set it to a specific debugger: PYTHONBREAKPOINT=ipdb.set_trace to use ipdb everywhere breakpoint() is called.' },
    { q: 'What is the advantage of tracemalloc over memory_profiler?', options: ['tracemalloc is faster and built into the standard library', 'memory_profiler is better in every way', 'tracemalloc only works on macOS', 'They measure different things — tracemalloc is for CPU'], answer: 0, explanation: 'tracemalloc is built into Python\'s standard library (Python 3.4+) — no installation needed. memory_profiler requires pip install memory_profiler and is a third-party tool. tracemalloc can capture and compare snapshots to track memory growth over time. memory_profiler\'s strength is the @profile decorator showing line-by-line memory usage. For quick allocation tracking without setup, tracemalloc is the right choice.' },
    { q: 'Why should you use from e when re-raising exceptions?', options: ['from e is required syntax for raise statements', 'It causes the except block to run again', 'from e chains the exceptions — both the original and new traceback are shown, preserving the root cause', 'from e suppresses the exception'], answer: 2, explanation: 'raise NewException("msg") without from e replaces the original exception — the traceback shows only the new exception. raise NewException("msg") from e creates an exception chain: Python prints both exceptions with "During handling of the above exception, another exception occurred." This preserves the root cause (e.g. the original FileNotFoundError) alongside your contextual error, which is crucial for debugging.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use py-spy vs cProfile?', a: 'cProfile is best for offline analysis of a known code path: run a script or call a function, get a detailed report. It has overhead (~10–100%) and requires code modification or running under the profiler. py-spy is a sampling profiler that attaches to a running process without modifying code (no instrumentation overhead). Use py-spy when you need to profile a production or long-running process, when you cannot restart it, or when you want a flamegraph of real-world traffic. py-spy top gives a real-time view like htop but for Python call stacks. py-spy record generates a flamegraph SVG. For development profiling, cProfile gives more detail; for production, py-spy is safer.' },
    { q: 'How do I find a memory leak in a Python application?', a: 'Step 1: confirm the leak — monitor process RSS with psutil.Process().memory_info().rss over time or watch with ps aux. Step 2: use tracemalloc snapshots at different times and compare: snapshot2.compare_to(snapshot1, "lineno") shows what allocates the most new memory. Step 3: use objgraph.growth() to see which types are increasing. Step 4: common causes — global dicts/lists growing without bound (caches without eviction: use functools.lru_cache or cachetools.TTLCache), event handler registrations not cleaned up, asyncio tasks created but not awaited (tasks that are created but not stored get garbage collected eventually, but Tasks keep alive the coroutine and all objects it references). Step 5: use weakref.WeakValueDictionary for caches so objects can be collected when unreferenced.' },
    { q: 'What is the fastest way to debug a failing test?', a: 'Run pytest with -x (stop at first failure) --tb=short (compact traceback) -s (show stdout). For a specific test: pytest tests/test_foo.py::test_specific -xvs. Add breakpoint() directly inside the test or the function being tested — pytest captures stdin but still respects breakpoint(). pytest --pdb flag automatically drops into pdb on any test failure. pytest --pdb --pdbcls=IPython.terminal.debugger:TerminalPdb uses ipdb. For async tests with pytest-asyncio, same breakpoint() approach works — the event loop handles it. For complex state, pp locals() inside the debugger prints all local variables.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'breakpoint() drops into pdb; cProfile finds slow functions; line_profiler zooms into hot lines; tracemalloc tracks memory allocations; raise X from e preserves root cause.',
    mustKnow: [
      'breakpoint() — pdb REPL. PYTHONBREAKPOINT=ipdb.set_trace for richer UX.',
      'python -m cProfile -s cumtime script.py — sort by cumtime for hot paths.',
      'line_profiler @profile + kernprof -lv — line-by-line CPU time.',
      'tracemalloc.start() / take_snapshot() — built-in memory allocation tracking.',
      'py-spy top --pid — zero-overhead sampling profiler, attaches to live process.',
      'raise NewException("msg") from e — chains exceptions, preserves root cause.',
    ],
    interviewFocus: [
      'How would you find which function is the bottleneck in a slow Python service?',
      'What is the difference between tottime and cumtime in cProfile?',
      'How do you debug a memory leak in a running Python application?',
    ]
  };
}
