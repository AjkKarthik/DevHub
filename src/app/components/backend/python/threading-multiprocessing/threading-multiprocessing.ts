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
  selector: 'app-python-threading-multiprocessing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './threading-multiprocessing.html',
  styleUrl: './threading-multiprocessing.scss'
})
export class PythonThreadingMultiprocessing {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.x';
  route = 'py-threading-multiprocessing'; nextRoute = '/python/concurrency-patterns'; nextLabel = 'Python Concurrency Patterns';

  quickRef: QuickRefItem[] = [
    { name: 'ThreadPoolExecutor(max_workers)', type: 'class', desc: 'Thread pool from concurrent.futures. submit(fn, *args) → Future. Use for I/O-bound blocking calls.' },
    { name: 'ProcessPoolExecutor(max_workers)', type: 'class', desc: 'Process pool from concurrent.futures. Bypasses GIL for CPU-bound work. max_workers defaults to CPU count.' },
    { name: 'executor.map(fn, iterable)', type: 'method', desc: 'Parallel map — applies fn to each item. Results in submission order. Blocks until all complete.' },
    { name: 'futures.as_completed(fs)', type: 'function', desc: 'Yields futures as they complete (not in submission order). Good for processing results ASAP.' },
    { name: 'threading.Lock()', type: 'class', desc: 'Mutual exclusion lock. with lock: ... — only one thread enters at a time. threading.RLock for re-entrant use.' },
    { name: 'threading.Event()', type: 'class', desc: 'Signal between threads. event.set() signals; event.wait() blocks until set; event.clear() resets.' },
    { name: 'multiprocessing.Queue', type: 'class', desc: 'Thread/process-safe queue for IPC. put() / get() work across processes (serialised via pickle).' },
    { name: 'threading.local()', type: 'function', desc: 'Thread-local storage — each thread has its own copy. Used for DB connections, request context.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The GIL — Global Interpreter Lock',
      points: [
        'CPython (the standard Python implementation) has a GIL: a mutex that allows only one thread to execute Python bytecode at a time. The GIL exists to protect CPython\'s reference-counting memory management — without it, concurrent reference count updates would corrupt memory.',
        'The GIL is released during I/O operations (network calls, file reads, sleep). This is why threading improves I/O-bound code: while thread A waits for a network response (GIL released), thread B can execute Python code. For pure Python CPU work, threads do NOT run in parallel — the GIL prevents it.',
        'Python 3.13 introduced an experimental "free-threaded" mode (--disable-gil build) that removes the GIL. In standard 3.x, the GIL remains. C extensions can release the GIL explicitly (NumPy does this for element-wise operations, which is why NumPy is fast in threads).',
        'Implications: for I/O-bound work → threading or asyncio. For CPU-bound work → multiprocessing (each process has its own GIL-free interpreter). For both → asyncio with run_in_executor for CPU work.',
      ]
    },
    {
      heading: 'concurrent.futures — Unified High-Level API',
      points: [
        'concurrent.futures provides ThreadPoolExecutor and ProcessPoolExecutor with an identical API. executor.submit(fn, *args) returns a Future — a handle to the pending computation. future.result() blocks until done. executor.map(fn, iterable) is a parallel map that returns results in order.',
        'futures.as_completed(future_list) yields futures as they finish — not in submission order. This is the right choice when you want to process results as soon as they are ready (e.g. display progress, short-circuit on first success). executor.map yields results in submission order (may buffer finished results).',
        'Context manager protocol: with ThreadPoolExecutor(max_workers=10) as ex: ... — the pool shuts down (joins all threads) on exit. Always use as a context manager to avoid thread leaks. max_workers defaults to min(32, os.cpu_count() + 4) for threads; os.cpu_count() for processes.',
        'submit() vs map(): submit() is for heterogeneous tasks (different functions and args). map() is for applying the same function to a collection. map() is also lazy when the iterable is lazy. Prefer submit() + as_completed() when you need per-task error handling.',
      ]
    },
    {
      heading: 'Synchronisation Primitives',
      points: [
        'threading.Lock() is a mutual exclusion lock. with lock: block — only one thread runs the block at a time. RLock (re-entrant lock) allows the same thread to acquire the lock multiple times without deadlock. Use Lock for protecting shared mutable state; prefer Queue or concurrent.futures for high-level coordination.',
        'threading.Event() signals state between threads: event.set() wakes all waiting threads; event.wait(timeout) blocks until set; event.clear() resets to not-set. Condition extends Event with a waiting/notification pattern for producer-consumer. Semaphore limits concurrent access to N threads.',
        'threading.local() creates thread-local storage: each thread sees its own value for the attribute. Used in web frameworks to store per-request database connections and user context without passing them as arguments: _local = threading.local(); _local.db = get_db_connection().',
        'queue.Queue is thread-safe (uses internal locks). Use it for producer-consumer patterns in threaded code. For inter-process communication, use multiprocessing.Queue (serialises via pickle) or multiprocessing.Pipe (bidirectional byte stream).',
      ]
    },
    {
      heading: 'multiprocessing — True Parallelism',
      points: [
        'multiprocessing spawns independent processes — each with its own memory space, GIL, and Python interpreter. True parallelism for CPU-bound work. The cost: spawning a process is slow (~100 ms); inter-process communication (IPC) serialises data via pickle, which is expensive for large arrays.',
        'ProcessPoolExecutor(max_workers=os.cpu_count()) parallelises CPU work. It uses the same Future/map API as ThreadPoolExecutor. Arguments and return values must be picklable — plain Python objects, numpy arrays, dataclasses work; lambda, local functions, and file handles do not.',
        'multiprocessing.Pool.starmap(fn, [(a1,b1),(a2,b2),...]) is the multiprocessing equivalent of itertools.starmap — distributes tuples of arguments to the pool. chunksize=N sends items in batches to reduce IPC overhead for small tasks.',
        'For shared state across processes, use multiprocessing.Value (shared scalar) and Array (shared array) — they use OS-level shared memory. Or use a Manager() for managed dicts/lists (slower but more flexible). For heavy numerical work, prefer numpy shared memory or process-local computation with result aggregation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ThreadPoolExecutor',
      language: 'typescript',
      code: `from concurrent.futures import ThreadPoolExecutor, as_completed
import time, threading

# I/O-bound: download URLs concurrently with threads
def download(url: str) -> tuple[str, int]:
    import urllib.request
    time.sleep(0.5)   # simulated network delay
    return url, 200   # simulated response

urls = [f"https://example.com/{i}" for i in range(20)]

# executor.map — results in submission order
with ThreadPoolExecutor(max_workers=10) as ex:
    for url, status in ex.map(download, urls):
        print(f"{status}: {url}")

# submit + as_completed — process results as they arrive
with ThreadPoolExecutor(max_workers=10) as ex:
    future_to_url = {ex.submit(download, url): url for url in urls}
    for future in as_completed(future_to_url):
        url = future_to_url[future]
        try:
            _, status = future.result()
            print(f"Done: {url} ({status})")
        except Exception as e:
            print(f"Failed: {url} — {e}")

# Thread-safe counter using Lock
counter = 0
lock = threading.Lock()

def increment_safe():
    global counter
    with lock:          # only one thread at a time
        counter += 1

threads = [threading.Thread(target=increment_safe) for _ in range(100)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)   # always 100 (would be unpredictable without lock)`
    },
    {
      label: 'ProcessPoolExecutor',
      language: 'typescript',
      code: `from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing, time, os

# CPU-bound: parallel number crunching
def is_prime(n: int) -> bool:
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True

def count_primes_in_range(start: int, stop: int) -> int:
    return sum(1 for n in range(start, stop) if is_prime(n))

# Split work into chunks for CPU count
def parallel_prime_count(up_to: int) -> int:
    workers = os.cpu_count() or 4
    chunk = up_to // workers
    ranges = [(i * chunk, (i + 1) * chunk) for i in range(workers)]
    ranges[-1] = (ranges[-1][0], up_to)   # last chunk to the end

    with ProcessPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(count_primes_in_range, s, e) for s, e in ranges]
        return sum(f.result() for f in futures)

if __name__ == "__main__":   # required on Windows for spawn
    t0 = time.perf_counter()
    count = parallel_prime_count(500_000)
    print(f"{count} primes below 500,000 in {time.perf_counter()-t0:.2f}s")

# multiprocessing.Pool.starmap for argument tuples
from multiprocessing import Pool

def power(base: int, exp: int) -> int:
    return base ** exp

if __name__ == "__main__":
    with Pool() as pool:
        results = pool.starmap(power, [(2, 10), (3, 5), (4, 3)])
        print(results)   # [1024, 243, 64]

# Shared state with Value
from multiprocessing import Process, Value

def worker(shared_count):
    for _ in range(1000):
        with shared_count.get_lock():
            shared_count.value += 1

if __name__ == "__main__":
    counter = Value("i", 0)   # shared int
    procs = [Process(target=worker, args=(counter,)) for _ in range(4)]
    for p in procs: p.start()
    for p in procs: p.join()
    print(counter.value)   # 4000`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using threads for CPU-bound work (GIL prevents speedup)',
      wrong: `def crunch(n): return sum(i*i for i in range(n))

with ThreadPoolExecutor(4) as ex:
    results = list(ex.map(crunch, [10**6]*4))   # NOT 4× faster — GIL!`,
      right: `with ProcessPoolExecutor(4) as ex:
    results = list(ex.map(crunch, [10**6]*4))   # 4× faster — separate processes`,
      explanation: 'The GIL allows only one thread to execute Python bytecode at a time. For CPU-bound work, threading provides no parallelism — the threads take turns. Use ProcessPoolExecutor for CPU-bound work. Use ThreadPoolExecutor for I/O-bound work (where the GIL is released during I/O).'
    },
    {
      title: 'Forgetting if __name__ == "__main__" for multiprocessing on Windows',
      wrong: `from multiprocessing import Pool
with Pool() as p:          # Windows: spawns new processes without the guard
    results = p.map(fn, data)  # RecursionError / freeze on Windows`,
      right: `from multiprocessing import Pool
if __name__ == "__main__":   # REQUIRED on Windows (spawn start method)
    with Pool() as p:
        results = p.map(fn, data)`,
      explanation: 'On Windows and macOS (Python 3.8+), multiprocessing uses the "spawn" start method: each new process imports the script from scratch. Without the if __name__ == "__main__" guard, the worker processes try to spawn more processes recursively, causing a freeze or RecursionError. On Linux (fork), this guard is not strictly required but is still good practice.'
    },
    {
      title: 'Passing unpicklable objects to ProcessPoolExecutor',
      wrong: `import sqlite3
conn = sqlite3.connect("db.sqlite")

def query(table: str):
    return conn.execute(f"SELECT * FROM {table}").fetchall()

with ProcessPoolExecutor() as ex:   # sqlite3.Connection is not picklable!
    results = list(ex.map(query, tables))`,
      right: `def query(table: str):
    conn = sqlite3.connect("db.sqlite")   # open per-process
    return conn.execute(f"SELECT * FROM {table}").fetchall()

with ProcessPoolExecutor() as ex:
    results = list(ex.map(query, tables))`,
      explanation: 'Arguments and return values passed to/from ProcessPoolExecutor are serialised with pickle. Many objects are not picklable: database connections, file handles, lambda functions, local functions, and closures over non-picklable state. Create resources inside the worker function where each process gets its own instance.'
    },
    {
      title: 'Modifying shared state from threads without a lock',
      wrong: `counter = 0

def increment():
    global counter
    counter += 1   # not atomic — read-modify-write race condition!

threads = [threading.Thread(target=increment) for _ in range(1000)]`,
      right: `counter = 0
lock = threading.Lock()

def increment():
    global counter
    with lock:
        counter += 1`,
      explanation: 'counter += 1 is not atomic in CPython — it compiles to LOAD_GLOBAL, BINARY_ADD, STORE_GLOBAL. The GIL can switch threads between any two bytecode instructions. Two threads can both read the same value of counter before either writes back, losing an increment. Protect all read-modify-write operations with a Lock.'
    },
  ];

  challenge: Challenge = {
    title: 'Parallel File Processor',
    language: 'typescript',
    description: 'Write process_files(directory: str, pattern: str, max_workers: int) -> dict that finds all files matching pattern in directory (recursively), reads each file in a thread pool (I/O-bound), counts words per file, and returns a dict mapping filename → word count. Also write summarise_results(counts: dict) returning the top-5 files by word count.',
    hints: [
      'Use Path.rglob(pattern) to find files',
      'ThreadPoolExecutor for I/O-bound file reading',
      'futures.as_completed for progress feedback',
    ],
    starterCode: `from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

def process_files(directory: str, pattern: str = "*.txt", max_workers: int = 8) -> dict[str, int]:
    pass

def summarise_results(counts: dict[str, int], top_n: int = 5) -> list[tuple[str, int]]:
    pass`,
    solution: `from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

def count_words(path: Path) -> tuple[str, int]:
    text = path.read_text(encoding="utf-8", errors="replace")
    return path.name, len(text.split())

def process_files(directory: str, pattern: str = "*.txt", max_workers: int = 8) -> dict[str, int]:
    files = list(Path(directory).rglob(pattern))
    results: dict[str, int] = {}
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        future_to_path = {ex.submit(count_words, f): f for f in files}
        for future in as_completed(future_to_path):
            try:
                name, count = future.result()
                results[name] = count
            except Exception as e:
                results[future_to_path[future].name] = -1
    return results

def summarise_results(counts: dict[str, int], top_n: int = 5) -> list[tuple[str, int]]:
    import heapq
    return heapq.nlargest(top_n, counts.items(), key=lambda x: x[1])`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does the GIL prevent in CPython?', options: ['Deadlocks between threads', 'True parallel execution of Python bytecode across multiple threads', 'Memory leaks in multi-threaded code', 'Multiple threads from being created'], answer: 1, explanation: 'The GIL (Global Interpreter Lock) ensures only one thread executes Python bytecode at a time. This prevents race conditions in CPython\'s reference-counting memory management but also prevents CPU-bound threads from running in parallel. The GIL IS released during I/O, so threading still speeds up I/O-bound work.' },
    { q: 'What is the key difference between futures.map() and as_completed()?', options: ['map() is faster; as_completed() is for debugging', 'map() returns results in submission order; as_completed() yields futures as they complete (any order)', 'as_completed() only works with processes', 'They are identical'], answer: 1, explanation: 'executor.map(fn, items) returns results in the same order as items, buffering finished results if needed. as_completed(future_list) yields futures in completion order — the first to finish yields first. Use as_completed when you want to process results immediately as they arrive, reducing latency for the first results.' },
    { q: 'Why must you use multiprocessing instead of threading for CPU-bound work?', options: ['Processes are always faster than threads', 'The GIL prevents threads from running Python code in parallel; processes each have their own GIL', 'threading does not support CPU operations', 'Processes share memory; threads do not'], answer: 1, explanation: 'The GIL ensures only one thread runs Python bytecode at a time. For CPU-bound work, threads queue behind the GIL and provide no speedup. multiprocessing spawns separate interpreter processes — each with its own GIL and memory space — allowing true parallel execution on multiple CPU cores.' },
    { q: 'What must be picklable when using ProcessPoolExecutor?', options: ['Only return values', 'Function arguments, function itself, and return values', 'Only the function itself', 'Nothing — multiprocessing handles all types'], answer: 1, explanation: 'Inter-process communication uses pickle for serialisation. The function passed to submit/map, its arguments, and its return value must all be picklable. Common non-picklable items: lambda functions, local (nested) functions, database connections, file handles, and locks. Rewrite your function to be a module-level function and create resources inside it.' },
    { q: 'What is a threading.Event and when would you use it?', options: ['A log entry when a thread starts', 'A synchronisation primitive — one thread signals an event; other threads wait until it is set', 'A thread lifecycle callback', 'An exception raised by a thread'], answer: 1, explanation: 'threading.Event() has set(), clear(), and wait() methods. One thread calls event.set() to signal; another thread calls event.wait() and blocks until set. Use for: start signal (wait for main thread ready), shutdown signal (while not stop_event.is_set(): do_work()), or one-time gates. Prefer Event over manual sleep loops.' },
    { q: 'What is the difference between daemon threads and normal threads in Python?', options: ['Daemon threads run faster', 'Daemon threads are killed automatically when the main thread exits; normal threads keep the process alive', 'Normal threads cannot access shared state; daemon threads can', 'Daemon threads do not acquire the GIL'], answer: 1, explanation: 'A normal thread keeps the Python interpreter alive — the process waits for all normal threads to finish. A daemon thread (t.daemon = True before start()) is killed abruptly when the main thread exits without cleanup. Use daemon=True for background housekeeping tasks (heartbeat, cache refresh) where you don\'t need graceful shutdown. Avoid for tasks writing to files or databases.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should you use threading vs asyncio vs multiprocessing?', a: 'Use asyncio when: I/O-bound with many concurrent connections and you can use async-native libraries (aiohttp, asyncpg). Use threading when: I/O-bound but you must use blocking sync libraries (requests, boto3, legacy ORMs), or you have a mix of I/O and small CPU work. Use multiprocessing when: CPU-bound (number crunching, image processing, ML inference on large batches). The decision tree: Is it I/O-bound? → asyncio or threading. Is it CPU-bound? → multiprocessing.' },
    { q: 'How do you share data safely between threads?', a: 'Prefer immutable data (no sharing needed), queue.Queue (thread-safe), or concurrent.futures (no manual sharing). When you must share mutable state: use threading.Lock for simple read-modify-write; threading.RLock if the same thread acquires the lock recursively; threading.local() for per-thread values (DB connections). Avoid sharing state when possible — it is the root cause of most race conditions.' },
    { q: 'What is "daemon" in the context of threads?', a: 'A daemon thread is a background thread that is abruptly killed when the main thread exits — the process does not wait for daemon threads to finish. Non-daemon threads (default) keep the process alive until they complete. Use daemon=True for background workers (e.g. a thread that polls a message queue) that should not prevent program exit. Use non-daemon threads for tasks that must complete (e.g. writing to a file before exit).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The GIL limits threading to I/O-bound parallelism; use ProcessPoolExecutor for CPU-bound work; concurrent.futures gives both a unified API.',
    mustKnow: [
      'GIL: only one thread executes Python bytecode at a time; released during I/O.',
      'ThreadPoolExecutor: I/O-bound (network, file, DB). ProcessPoolExecutor: CPU-bound.',
      'executor.map() → results in order; as_completed() → results as they finish.',
      'threading.Lock(): protect shared mutable state from race conditions.',
      'multiprocessing requires picklable args/returns and if __name__ == "__main__" on Windows.',
      'threading.local(): per-thread storage for DB connections and request context.',
    ],
    interviewFocus: [
      'Explain the GIL and when it matters.',
      'When would you use threading vs multiprocessing vs asyncio?',
      'What is the risk of not using a Lock when sharing state between threads?',
    ]
  };
}
