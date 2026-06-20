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
  selector: 'app-python-asyncio',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './asyncio.html',
  styleUrl: './asyncio.scss'
})
export class PythonAsyncio {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.7+';
  route = 'py-asyncio'; nextRoute = '/python/threading-multiprocessing'; nextLabel = 'Threading & Multiprocessing';

  quickRef: QuickRefItem[] = [
    { name: 'async def fn()', type: 'syntax', desc: 'Defines a coroutine function. Calling it returns a coroutine object — must be awaited to run.' },
    { name: 'await expr', type: 'syntax', desc: 'Suspends the coroutine until expr (another coroutine or awaitable) completes. Only valid inside async def.' },
    { name: 'asyncio.run(coro)', type: 'function', desc: 'Entry point: creates an event loop, runs coro until completion, closes the loop. One per process.' },
    { name: 'asyncio.gather(*coros)', type: 'function', desc: 'Runs multiple coroutines concurrently. Returns list of results. return_exceptions=True prevents one failure from cancelling others.' },
    { name: 'asyncio.create_task(coro)', type: 'function', desc: 'Schedules coro to run concurrently. Returns Task. Does not block — the caller continues immediately.' },
    { name: 'asyncio.timeout(seconds)', type: 'function', desc: 'Python 3.11+ timeout context manager. Raises TimeoutError after seconds. Replaces asyncio.wait_for.' },
    { name: 'asyncio.Queue', type: 'class', desc: 'Async producer-consumer queue. put()/get() are awaitables. maxsize=N creates bounded queue for backpressure.' },
    { name: 'asyncio.Semaphore(n)', type: 'class', desc: 'Limits concurrent access to n. async with sem: ... — blocks when count reaches 0. Essential for rate limiting.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cooperative Multitasking — How asyncio Works',
      points: [
        'asyncio implements cooperative multitasking on a single thread. Coroutines voluntarily yield control at await points. The event loop picks the next ready coroutine and runs it until it hits another await. Unlike threading, there is no preemption — a coroutine runs uninterrupted between awaits.',
        'This single-threaded model means no GIL conflicts, no race conditions on shared state (because only one coroutine runs at a time), and very low overhead per concurrent task (~1 KB vs ~8 MB per thread). asyncio can handle tens of thousands of concurrent I/O operations on one thread.',
        'The key insight: asyncio is only useful for I/O-bound concurrency (network calls, file I/O, database queries). While one coroutine is waiting for a network response, the event loop runs another. But CPU-bound work (number crunching, image processing) blocks the loop — use multiprocessing for that.',
        'async def creates a coroutine function. Calling it returns a coroutine object without executing the body. You must await it for the body to run. await can only appear inside async def. asyncio.run(coro) is the standard entry point — it creates a new event loop, runs the coroutine, and closes the loop.',
      ]
    },
    {
      heading: 'Tasks and gather — Concurrent Coroutines',
      points: [
        'await coro() runs a coroutine sequentially — control does not return to the event loop until coro() completes. To run coroutines concurrently, use asyncio.gather() or asyncio.create_task(). gather(*coros) schedules all coroutines and awaits all results — like Promise.all in JavaScript.',
        'asyncio.create_task(coro()) schedules coro to run on the event loop and returns a Task immediately. The caller can continue running until it hits an await. Unlike gather(), create_task() lets you schedule work without blocking and collect results later. Tasks can be cancelled with task.cancel().',
        'asyncio.gather(return_exceptions=True) prevents one failing coroutine from cancelling the rest — exceptions are returned as values in the results list. Without return_exceptions=True, the first exception propagates and cancels remaining tasks. Use return_exceptions=True when you want to process all results even if some fail.',
        'TaskGroup (Python 3.11) is the modern alternative to gather — it cancels the whole group if any task fails (fail-fast). async with asyncio.TaskGroup() as tg: tg.create_task(coro()). This is the structured concurrency approach: all tasks in a group are bounded by the group\'s lifetime.',
      ]
    },
    {
      heading: 'Timeouts, Cancellation, and Semaphores',
      points: [
        'asyncio.timeout(seconds) (Python 3.11) wraps a block in a deadline: async with asyncio.timeout(5.0): result = await slow_call(). Raises TimeoutError on expiry. Pre-3.11: asyncio.wait_for(coro(), timeout=5.0) is equivalent. Always set timeouts on network calls — a hanging connection should not block forever.',
        'Coroutines can be cancelled: task.cancel() schedules a CancelledError to be raised at the next await inside the task. Use try/except asyncio.CancelledError: raise to clean up resources on cancellation — always re-raise CancelledError after cleanup so the cancellation propagates correctly.',
        'asyncio.Semaphore(n) limits concurrent coroutines: async with semaphore: await do_work(). When n coroutines hold the semaphore, the next async with blocks until one releases. Use to cap outgoing API connections (Semaphore(10) = max 10 concurrent requests) and prevent thundering herds.',
        'asyncio.Queue provides an async producer-consumer pattern. await queue.put(item) adds an item (blocks if bounded and full). await queue.get() retrieves one item (blocks if empty). queue.task_done() signals completion; await queue.join() waits for all items to be processed. Use maxsize for backpressure.',
      ]
    },
    {
      heading: 'Working with Sync Code and Event Loops',
      points: [
        'loop.run_in_executor(None, sync_fn, *args) runs a synchronous function in a thread pool without blocking the event loop. None uses the default ThreadPoolExecutor. This is how you integrate blocking libraries (requests, boto3, database ORMs) into async code. asyncio.to_thread(fn, *args) (Python 3.9+) is a cleaner API for the same thing.',
        'Never call time.sleep() in an async function — it blocks the event loop, freezing all other coroutines. Use await asyncio.sleep(seconds) instead. Similarly, never use blocking file I/O in async code without run_in_executor; use aiofiles for async file operations.',
        'Multiple event loops in one process is an anti-pattern. asyncio.run() creates and closes a fresh loop each call — it cannot be called from inside an already-running loop (nest_asyncio patches this but it\'s a workaround, not a design). In Jupyter notebooks, the loop is already running — use await directly or use nest_asyncio.',
        'async for and async with work with objects implementing __aiter__/__anext__ and __aenter__/__aexit__. These are the async equivalents of iterator and context manager protocols. Many async libraries (aiohttp, asyncpg, motor) use these protocols: async with aiohttp.ClientSession() as session: async for record in cursor: ...',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Coroutines & gather',
      language: 'typescript',
      code: `import asyncio, aiohttp, time

# Basic coroutine
async def greet(name: str, delay: float) -> str:
    await asyncio.sleep(delay)   # non-blocking sleep
    return f"Hello, {name}!"

# Sequential vs concurrent
async def sequential():
    t0 = time.perf_counter()
    r1 = await greet("Alice", 1.0)   # waits 1 s
    r2 = await greet("Bob",   1.0)   # waits 1 s more
    print(f"Sequential: {time.perf_counter() - t0:.1f}s")  # ~2.0s

async def concurrent():
    t0 = time.perf_counter()
    results = await asyncio.gather(
        greet("Alice", 1.0),
        greet("Bob",   1.0),
    )
    print(f"Concurrent: {time.perf_counter() - t0:.1f}s")  # ~1.0s
    print(results)   # ["Hello, Alice!", "Hello, Bob!"]

asyncio.run(sequential())
asyncio.run(concurrent())

# create_task — fire-and-forget then collect
async def main():
    t1 = asyncio.create_task(greet("Alice", 1.0))   # scheduled immediately
    t2 = asyncio.create_task(greet("Bob",   1.0))   # scheduled immediately
    # other work here while tasks run...
    r1 = await t1
    r2 = await t2
    return r1, r2

# gather with error handling
async def may_fail(n: int) -> int:
    if n == 2: raise ValueError("bad value")
    await asyncio.sleep(0.1)
    return n * 10

async def safe_gather():
    results = await asyncio.gather(
        may_fail(1), may_fail(2), may_fail(3),
        return_exceptions=True    # don't cancel others on failure
    )
    for r in results:
        if isinstance(r, Exception):
            print(f"Error: {r}")
        else:
            print(f"OK: {r}")

asyncio.run(safe_gather())
# OK: 10
# Error: bad value
# OK: 30`
    },
    {
      label: 'Semaphore, Queue & HTTP',
      language: 'typescript',
      code: `import asyncio, aiohttp

# Rate-limited HTTP requests with Semaphore
async def fetch(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore) -> str:
    async with sem:                        # max 10 concurrent
        async with asyncio.timeout(5.0):   # 5-second timeout
            async with session.get(url) as resp:
                return await resp.text()

async def fetch_all(urls: list[str]) -> list[str]:
    sem = asyncio.Semaphore(10)   # max 10 concurrent requests
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url, sem) for url in urls]
        return await asyncio.gather(*tasks, return_exceptions=True)

# Producer-consumer with Queue
async def producer(queue: asyncio.Queue, items: list[int]) -> None:
    for item in items:
        await queue.put(item)
        print(f"Produced: {item}")
        await asyncio.sleep(0.1)
    await queue.put(None)   # sentinel to stop consumer

async def consumer(queue: asyncio.Queue) -> list[int]:
    results = []
    while True:
        item = await queue.get()
        if item is None:
            break
        results.append(item * 2)
        print(f"Consumed: {item}")
        queue.task_done()
    return results

async def run_pipeline():
    queue: asyncio.Queue = asyncio.Queue(maxsize=5)   # bounded: backpressure
    prod = asyncio.create_task(producer(queue, list(range(10))))
    cons = asyncio.create_task(consumer(queue))
    await prod
    results = await cons
    print(results)

asyncio.run(run_pipeline())

# Run blocking code without blocking the loop
import asyncio, time

def blocking_io(path: str) -> str:
    time.sleep(1)    # simulated blocking
    return f"read {path}"

async def async_main():
    result = await asyncio.to_thread(blocking_io, "file.txt")
    print(result)

asyncio.run(async_main())`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using time.sleep() inside async code',
      wrong: `async def delay():
    time.sleep(1)    # blocks the ENTIRE event loop for 1 second!
    return "done"`,
      right: `async def delay():
    await asyncio.sleep(1)   # yields control to event loop
    return "done"`,
      explanation: 'time.sleep() is a blocking call — it stops the Python interpreter for the duration. In an async function, it freezes the entire event loop: no other coroutine can run during that second. await asyncio.sleep() yields control back to the event loop, allowing other coroutines to run while waiting.'
    },
    {
      title: 'Forgetting to await a coroutine',
      wrong: `async def main():
    result = fetch_data()   # NOT awaited — result is a coroutine object!
    print(result)           # <coroutine object fetch_data at 0x...>`,
      right: `async def main():
    result = await fetch_data()   # runs the coroutine and gets the result
    print(result)`,
      explanation: 'Calling an async def function returns a coroutine object, not the result. The body is NOT executed until you await it. Python will issue a RuntimeWarning: coroutine was never awaited if a coroutine object is garbage-collected without being awaited. This is a very common async beginner mistake.'
    },
    {
      title: 'Using requests (sync) instead of aiohttp in async code',
      wrong: `async def fetch(url: str) -> str:
    resp = requests.get(url)   # BLOCKS the event loop for the entire HTTP call!
    return resp.text`,
      right: `async def fetch(session: aiohttp.ClientSession, url: str) -> str:
    async with session.get(url) as resp:
        return await resp.text()`,
      explanation: 'requests uses blocking I/O — calling requests.get() inside a coroutine blocks the entire event loop for the duration of the HTTP request. All concurrency is lost. Use aiohttp or httpx (with async interface) for non-blocking HTTP in async code. Similarly, use asyncpg/aiosqlite for databases, aiofiles for file I/O.'
    },
    {
      title: 'Not re-raising CancelledError after cleanup',
      wrong: `async def worker():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        await cleanup()
        # oops — swallowed CancelledError!`,
      right: `async def worker():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        await cleanup()
        raise   # always re-raise CancelledError`,
      explanation: 'CancelledError is a signal to stop — swallowing it breaks the cancellation chain. The task that called task.cancel() will hang waiting for the task to finish. After cleanup, always re-raise: the coroutine caller needs the exception to propagate. This is the "structured concurrency" contract.'
    },
  ];

  challenge: Challenge = {
    title: 'Concurrent URL Health Checker',
    language: 'typescript',
    description: 'Write an async function check_urls(urls: list[str], max_concurrent: int, timeout: float) -> list[dict] that checks each URL concurrently, limited to max_concurrent simultaneous requests, with a per-request timeout. Return a list of dicts with url, status (int or "timeout" or "error"), and latency_ms. Use asyncio.Semaphore for rate limiting and asyncio.timeout for per-request timeouts.',
    hints: [
      'Use aiohttp.ClientSession as an async context manager',
      'asyncio.Semaphore(max_concurrent) inside check_one coroutine',
      'catch asyncio.TimeoutError and aiohttp.ClientError separately',
    ],
    starterCode: `import asyncio, aiohttp, time

async def check_urls(urls: list[str], max_concurrent: int = 10, timeout: float = 5.0) -> list[dict]:
    pass`,
    solution: `import asyncio, aiohttp, time

async def check_one(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore, timeout: float) -> dict:
    async with sem:
        t0 = time.perf_counter()
        try:
            async with asyncio.timeout(timeout):
                async with session.get(url) as resp:
                    return {"url": url, "status": resp.status, "latency_ms": int((time.perf_counter() - t0) * 1000)}
        except TimeoutError:
            return {"url": url, "status": "timeout", "latency_ms": int(timeout * 1000)}
        except Exception as e:
            return {"url": url, "status": "error", "latency_ms": int((time.perf_counter() - t0) * 1000)}

async def check_urls(urls: list[str], max_concurrent: int = 10, timeout: float = 5.0) -> list[dict]:
    sem = asyncio.Semaphore(max_concurrent)
    async with aiohttp.ClientSession() as session:
        tasks = [check_one(session, url, sem, timeout) for url in urls]
        return await asyncio.gather(*tasks)`
  };

  quiz: QuizQuestion[] = [
    { q: 'What happens if you forget to await a coroutine?', options: ['It runs synchronously', 'A coroutine object is returned and the function body never executes', 'Python raises SyntaxError', 'It runs in a background thread'], answer: 1, explanation: 'Calling async def fn() without await returns a coroutine object without executing fn\'s body. Python issues a RuntimeWarning: coroutine was never awaited when the object is garbage-collected. This is the most common asyncio mistake — always await coroutine calls.' },
    { q: 'When should you use asyncio vs threading?', options: ['threading for all I/O; asyncio for CPU work', 'asyncio for I/O-bound with many connections; threading for blocking libraries or CPU-bound work', 'They are identical in performance', 'asyncio only works with FastAPI'], answer: 1, explanation: 'asyncio excels at I/O-bound work with high concurrency (thousands of simultaneous connections, one thread). Threading is better when: you must use blocking/sync libraries (requests, boto3), or you have a mix of CPU and I/O. Threading uses preemptive scheduling; asyncio uses cooperative scheduling.' },
    { q: 'What does asyncio.gather(return_exceptions=True) do?', options: ['Ignores all exceptions', 'Returns exceptions as values in the results list instead of cancelling other tasks', 'Retries failed coroutines', 'Makes gather run tasks sequentially'], answer: 1, explanation: 'Without return_exceptions=True, the first exception from any coroutine propagates immediately and cancels remaining tasks. With return_exceptions=True, exceptions are caught and placed in the results list as Exception objects — other tasks continue to completion. Use filter(isinstance(r, Exception), results) to separate errors from successes.' },
    { q: 'What is asyncio.Semaphore used for?', options: ['Synchronising two threads', 'Limiting the number of concurrent coroutines that can access a resource', 'Locking a single resource for exclusive access', 'Signalling between producer and consumer'], answer: 1, explanation: 'Semaphore(n) allows n coroutines to acquire it simultaneously. When n coroutines hold the semaphore, the next async with sem: blocks until one releases. Common uses: cap concurrent HTTP requests, limit database connection pool usage, prevent rate limit violations on external APIs.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between asyncio.sleep(0) and asyncio.sleep(1)?', a: 'Both yield control to the event loop, but asyncio.sleep(0) yields and resumes immediately at the next event loop iteration — it gives other scheduled tasks a chance to run without actually waiting. It is used to break up long CPU-bound loops inside async functions to prevent monopolising the loop. asyncio.sleep(1) actually waits 1 second (measured by the event loop timer) before resuming.' },
    { q: 'How do you run a synchronous blocking function without blocking the event loop?', a: 'Use await asyncio.to_thread(fn, *args) (Python 3.9+) to run fn in a thread pool. The event loop continues processing other coroutines while fn runs in a separate thread. Internally this calls loop.run_in_executor(None, fn, *args) with the default ThreadPoolExecutor. For CPU-bound work, use ProcessPoolExecutor instead of the default thread pool to bypass the GIL.' },
    { q: 'What is structured concurrency and why does TaskGroup use it?', a: 'Structured concurrency (Python 3.11 TaskGroup) ties the lifetime of tasks to a scope: all tasks created inside async with TaskGroup() as tg must finish before the with block exits. If any task raises an exception, the other tasks are cancelled and the exception propagates. This prevents task leaks (tasks that outlive their parent scope) and makes error handling predictable. It is the async equivalent of a join point.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'asyncio enables thousands of concurrent I/O operations on one thread via cooperative multitasking — use gather/create_task for concurrency, Semaphore for rate limiting, and never call blocking code in async functions.',
    mustKnow: [
      'async def creates a coroutine function; must be awaited to execute.',
      'asyncio.run() is the entry point; asyncio.gather() runs coroutines concurrently.',
      'Never use time.sleep() or blocking I/O inside async code.',
      'asyncio.Semaphore(n) caps concurrent coroutines to n.',
      'return_exceptions=True in gather: exceptions returned as values, not propagated.',
      'asyncio.to_thread(fn) runs sync code in a thread without blocking the loop.',
    ],
    interviewFocus: [
      'What is the difference between asyncio and threading?',
      'What happens if you forget to await a coroutine?',
      'How do you rate-limit concurrent async requests?',
    ]
  };
}
