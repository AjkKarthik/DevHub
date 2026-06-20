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
  selector: 'app-python-concurrency-patterns',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './concurrency-patterns.html',
  styleUrl: './concurrency-patterns.scss'
})
export class PythonConcurrencyPatterns {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced'; since = 'Python 3.9+';
  route = 'py-concurrency-patterns'; nextRoute = '/python/fastapi'; nextLabel = 'FastAPI';

  quickRef: QuickRefItem[] = [
    { name: 'asyncio.Semaphore(n)', type: 'class', desc: 'Cap concurrent coroutines to n. async with sem: prevents more than n simultaneous operations.' },
    { name: 'asyncio.Queue(maxsize)', type: 'class', desc: 'Async producer-consumer. maxsize creates backpressure — put() blocks when full.' },
    { name: 'run_in_executor(None, fn)', type: 'method', desc: 'Run sync blocking fn in thread pool without blocking event loop. asyncio.to_thread() is the 3.9+ alias.' },
    { name: 'ThreadPoolExecutor + asyncio', type: 'class', desc: 'Bridge sync libs into async code. loop.run_in_executor(executor, fn, *args) or asyncio.to_thread().' },
    { name: 'asyncio.TaskGroup (3.11)', type: 'class', desc: 'Structured concurrency — all tasks cancelled if one fails. async with TaskGroup() as tg: tg.create_task(coro()).' },
    { name: 'contextvars.ContextVar', type: 'class', desc: 'Task-local storage for asyncio (like threading.local for threads). Each Task has its own copy.' },
    { name: 'asyncio.Barrier (3.11)', type: 'class', desc: 'Synchronise N tasks at a checkpoint: all must reach the barrier before any proceed.' },
    { name: 'anyio', type: 'keyword', desc: 'Compatibility layer over asyncio and trio. Structured concurrency primitives: TaskGroup, move_on_after(), etc.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Choosing the Right Concurrency Model',
      points: [
        'The concurrency decision tree: (1) I/O-bound with many simultaneous connections and async-native libraries available → asyncio. (2) I/O-bound but using blocking sync libraries (requests, boto3, legacy ORMs) → ThreadPoolExecutor in async via run_in_executor, or pure threading. (3) CPU-bound (number crunching, image processing) → ProcessPoolExecutor or multiprocessing. (4) Mixed CPU + I/O → asyncio for I/O orchestration + run_in_executor(ProcessPoolExecutor) for CPU work.',
        'asyncio is not always fastest — it excels at high-concurrency I/O (hundreds to thousands of simultaneous connections). For low-concurrency I/O (10 parallel requests), threading is often simpler and comparably fast. The overhead of async/await setup matters at low concurrency; at high concurrency, the event loop overhead is amortised over thousands of tasks.',
        'Never mix blocking and async in the same thread without a bridge. Calling requests.get() inside a coroutine freezes the event loop. Calling asyncio.run() inside a running event loop raises RuntimeError. The bridge is asyncio.to_thread() (async → sync) or running the whole async app in a thread for sync callers.',
        'Concurrency is not parallelism. asyncio provides concurrency (multiple tasks making progress) on one thread — no parallelism. multiprocessing provides parallelism (true simultaneous execution). threading provides concurrency with preemptive scheduling — not parallel for CPU-bound Python code due to the GIL.',
      ]
    },
    {
      heading: 'Rate Limiting and Throttling Patterns',
      points: [
        'Semaphore rate limiting: asyncio.Semaphore(n) limits concurrent coroutines to n. All requests beyond n queue and wait for a slot. This is a concurrency limit, not a time-based rate limit. For 10 requests/second with 50 ms each, Semaphore(10) would actually allow 200 requests/second since 10 can run in 50 ms.',
        'Token bucket rate limiting: maintain a token count; refill at the rate limit; consume one token per request; if no token, wait. Implement with asyncio.Semaphore + periodic refill coroutine, or with asyncio.Queue where the refill coroutine puts tokens and workers get tokens.',
        'Adaptive throttling: start with Semaphore(n), measure response time and error rate, and dynamically adjust n. Libraries like aiolimiter provide time-window rate limiting: async with rate_limiter: await call() — blocks until the rate limit allows the call. Circuit breakers stop calls when error rate exceeds a threshold.',
        'Backpressure: asyncio.Queue(maxsize=N) creates backpressure — producers block (await queue.put()) when the queue is full. This prevents a fast producer from overwhelming a slow consumer. Without backpressure, memory grows unboundedly as the queue absorbs all produced items.',
      ]
    },
    {
      heading: 'Bridging Sync and Async Code',
      points: [
        'asyncio.to_thread(fn, *args) runs a synchronous function in the default ThreadPoolExecutor without blocking the event loop. This is the right way to integrate blocking third-party libraries (requests, boto3, PIL, heavy file I/O) into async code. The coroutine awaiting to_thread() suspends while fn runs in a thread.',
        'For CPU-bound work in async code: loop.run_in_executor(process_executor, fn, args) where process_executor is a ProcessPoolExecutor. The event loop is not blocked; the process runs in parallel. Results are marshalled back via pickle. Keep the CPU task self-contained (no shared state, picklable args/returns).',
        'sync_to_async in Django/Channels: adapts synchronous Django view code to work in async contexts. async_to_sync in asgiref: calls an async coroutine from synchronous code (e.g., from a Django management command or test). These bridges handle event loop creation and thread safety.',
        'For long-running sync servers that need async clients, run the asyncio event loop in a background thread: loop = asyncio.new_event_loop(); t = Thread(target=loop.run_forever, daemon=True); t.start(). Then submit coroutines from sync code: asyncio.run_coroutine_threadsafe(coro(), loop).result().',
      ]
    },
    {
      heading: 'Context Variables and Task-Local State',
      points: [
        'contextvars.ContextVar provides task-local storage in asyncio — like threading.local() but for coroutines. Each Task copies the context from its parent at creation time. Changes inside a task are not visible to other tasks. This is used for request context (user ID, trace ID, DB session) in async web frameworks.',
        'request_id: ContextVar[str] = ContextVar("request_id"). Set at the start of a request: token = request_id.set("abc123"). Access anywhere in the call chain: request_id.get(). token = var.set(value) returns a token; var.reset(token) restores the previous value — use in context managers.',
        'ContextVar is copied when creating a Task with create_task(). This means each task sees the value that was set by its parent at the time of task creation. If you set a ContextVar after creating a task, the task does NOT see the new value — the context snapshot was already taken.',
        'Without ContextVar, you would need to pass the request context as an argument through every function in the call chain. ContextVar threads state implicitly without tight coupling. FastAPI\'s dependency injection and middleware use ContextVar for request-scoped state.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Rate limiting & backpressure',
      language: 'typescript',
      code: `import asyncio, aiohttp, time

# Semaphore: cap concurrent requests
async def fetch(session, url, sem, results):
    async with sem:                          # max 5 concurrent
        async with asyncio.timeout(3.0):
            async with session.get(url) as r:
                results[url] = r.status

async def fetch_all_limited(urls: list[str], limit: int = 5) -> dict:
    sem = asyncio.Semaphore(limit)
    results = {}
    async with aiohttp.ClientSession() as session:
        await asyncio.gather(*[fetch(session, u, sem, results) for u in urls])
    return results

# Producer-consumer with backpressure
async def producer(queue: asyncio.Queue, items: list) -> None:
    for item in items:
        await queue.put(item)   # blocks if queue is full (maxsize reached)
    await queue.put(None)       # sentinel

async def consumer(queue: asyncio.Queue, results: list) -> None:
    while True:
        item = await queue.get()
        if item is None:
            queue.task_done()
            break
        await asyncio.sleep(0.01)   # simulated processing
        results.append(item * 2)
        queue.task_done()

async def pipeline(data: list) -> list:
    q: asyncio.Queue = asyncio.Queue(maxsize=10)  # bounded: backpressure
    results: list = []
    await asyncio.gather(
        producer(q, data),
        consumer(q, results),
    )
    return results

# Token bucket rate limiter
class RateLimiter:
    def __init__(self, rate: float, burst: int) -> None:
        self._tokens = burst
        self._rate = rate
        self._burst = burst
        self._last = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last
            self._tokens = min(self._burst, self._tokens + elapsed * self._rate)
            self._last = now
            if self._tokens < 1:
                await asyncio.sleep((1 - self._tokens) / self._rate)
                self._tokens = 0
            else:
                self._tokens -= 1`
    },
    {
      label: 'Sync-async bridge & ContextVar',
      language: 'typescript',
      code: `import asyncio
from contextvars import ContextVar
from concurrent.futures import ProcessPoolExecutor

# Bridge: run blocking sync code in thread
import requests   # blocking library

async def fetch_sync_in_thread(url: str) -> str:
    def _sync_get() -> str:
        return requests.get(url, timeout=5).text

    return await asyncio.to_thread(_sync_get)   # non-blocking wrapper

# Bridge: CPU-bound in process pool
def heavy_computation(n: int) -> int:
    return sum(i*i for i in range(n))

process_pool = ProcessPoolExecutor(max_workers=4)

async def run_cpu_work(n: int) -> int:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(process_pool, heavy_computation, n)

async def main():
    # Concurrent: I/O in thread + CPU in process
    result_io, result_cpu = await asyncio.gather(
        fetch_sync_in_thread("https://httpbin.org/get"),
        run_cpu_work(10 ** 7),
    )
    return result_io[:50], result_cpu

# ContextVar — request-scoped state
request_id: ContextVar[str] = ContextVar("request_id", default="none")
user_id:    ContextVar[int]  = ContextVar("user_id",    default=0)

async def handle_request(rid: str, uid: int) -> None:
    token_rid = request_id.set(rid)
    token_uid = user_id.set(uid)
    try:
        await process_request()   # sees request_id and user_id
    finally:
        request_id.reset(token_rid)
        user_id.reset(token_uid)

async def process_request() -> None:
    print(f"[{request_id.get()}] processing for user {user_id.get()}")
    # ContextVar values flow to child coroutines automatically
    task = asyncio.create_task(sub_task())
    await task

async def sub_task() -> None:
    # inherits ContextVar values from parent at task creation time
    print(f"  sub_task sees request_id={request_id.get()}")`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling asyncio.run() inside an already-running event loop',
      wrong: `async def outer():
    result = asyncio.run(inner())   # RuntimeError: This event loop is already running`,
      right: `async def outer():
    result = await inner()   # just await it directly

# Or from sync code inside a running loop:
import asyncio
loop = asyncio.get_event_loop()
future = asyncio.run_coroutine_threadsafe(inner(), loop)
result = future.result(timeout=5)`,
      explanation: 'asyncio.run() creates a new event loop and runs until the coroutine completes. Calling it from inside an already-running loop raises RuntimeError. From inside async code, just await the coroutine. From sync code that runs inside a loop (e.g. Django with ASGI), use run_coroutine_threadsafe or sync_to_async.'
    },
    {
      title: 'Not handling backpressure (unbounded queue)',
      wrong: `queue = asyncio.Queue()   # unbounded — no backpressure
async def producer():
    for item in huge_dataset:
        await queue.put(item)   # never blocks — memory grows without limit`,
      right: `queue = asyncio.Queue(maxsize=1000)   # bounded: backpressure
async def producer():
    for item in huge_dataset:
        await queue.put(item)   # blocks when queue is full`,
      explanation: 'An unbounded queue lets a fast producer outrun a slow consumer. The queue grows until the process runs out of memory. Setting maxsize creates backpressure: producers naturally slow to match the consumer\'s pace. This is the correct design for streaming pipelines.'
    },
    {
      title: 'Sharing event loop across threads unsafely',
      wrong: `# From a background thread:
async def my_coro(): ...
asyncio.run(my_coro())   # may conflict with the main thread's loop`,
      right: `# From a background thread, submit to the running loop:
import asyncio
loop = asyncio.get_event_loop()   # get the main thread's loop
future = asyncio.run_coroutine_threadsafe(my_coro(), loop)
result = future.result(timeout=10)`,
      explanation: 'asyncio event loops are not thread-safe. You cannot call loop methods from a different thread. asyncio.run_coroutine_threadsafe(coro, loop) is the thread-safe bridge: it schedules the coroutine on the given loop from any thread and returns a concurrent.futures.Future you can wait on.'
    },
    {
      title: 'Using threading.local() for asyncio task state',
      wrong: `import threading
_local = threading.local()

async def handler():
    _local.request_id = "abc"    # ALL tasks share the same thread-local — wrong!
    await process()`,
      right: `from contextvars import ContextVar
request_id: ContextVar[str] = ContextVar("request_id")

async def handler():
    token = request_id.set("abc")   # task-local copy
    try:
        await process()
    finally:
        request_id.reset(token)`,
      explanation: 'threading.local() is thread-local — all coroutines on the same thread share the same value. In asyncio (single-threaded), all tasks would read/write the same storage. ContextVar is task-local: each Task gets its own copy, isolated from other tasks running concurrently on the same thread.'
    },
  ];

  challenge: Challenge = {
    title: 'Async Retry with Circuit Breaker',
    language: 'typescript',
    description: 'Implement an async retry(fn, max_retries, delay, backoff) decorator that retries on exception with exponential backoff. Then implement a CircuitBreaker class with states CLOSED, OPEN, HALF_OPEN. Open the circuit after N failures; after a timeout, enter HALF_OPEN and allow one probe request; if it succeeds, close the circuit; if it fails, reopen.',
    hints: [
      'Use functools.wraps for the retry decorator',
      'Track failure count and last_failure_time on the CircuitBreaker',
      'HALF_OPEN: allow exactly one request through as a probe',
    ],
    starterCode: `import asyncio, functools, time
from enum import Enum

def async_retry(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    def decorator(fn):
        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            pass
        return wrapper
    return decorator

class CircuitState(Enum):
    CLOSED = "closed"; OPEN = "open"; HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        pass`,
    solution: `import asyncio, functools, time
from enum import Enum

def async_retry(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    def decorator(fn):
        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await fn(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    wait = delay * (backoff ** attempt)
                    await asyncio.sleep(wait)
        return wrapper
    return decorator

class CircuitState(Enum):
    CLOSED = "closed"; OPEN = "open"; HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.state = CircuitState.CLOSED
        self._failures = 0
        self._threshold = failure_threshold
        self._timeout = recovery_timeout
        self._opened_at: float | None = None

    async def call(self, fn, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            elapsed = time.monotonic() - (self._opened_at or 0)
            if elapsed < self._timeout:
                raise RuntimeError("Circuit is OPEN")
            self.state = CircuitState.HALF_OPEN

        try:
            result = await fn(*args, **kwargs)
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self._failures = 0
            return result
        except Exception:
            self._failures += 1
            if self._failures >= self._threshold or self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                self._opened_at = time.monotonic()
            raise`
  };

  quiz: QuizQuestion[] = [
    { q: 'When should you use asyncio.to_thread() instead of asyncio.gather()?', options: ['When running multiple coroutines concurrently', 'When you need to run a synchronous blocking function without blocking the event loop', 'When you want results in order', 'When handling timeouts'], answer: 1, explanation: 'asyncio.to_thread(fn, *args) runs a synchronous (blocking) function in a thread pool, bridging sync code into async without blocking the event loop. asyncio.gather() runs multiple coroutines concurrently — it works with awaitables, not sync functions. Use to_thread() for legacy sync libraries in async code.' },
    { q: 'What is backpressure in an async queue?', options: ['A way to speed up producers', 'A mechanism where a bounded queue causes producers to slow down when consumers are overwhelmed', 'An error that occurs when too many tasks are created', 'A timeout on queue.get()'], answer: 1, explanation: 'asyncio.Queue(maxsize=N) creates a bounded queue. When the queue is full and a producer calls await queue.put(), it blocks (suspends) until a consumer removes an item. This slows the producer to match the consumer\'s pace — preventing memory exhaustion. Unbounded queues (maxsize=0) allow unlimited growth.' },
    { q: 'What is the purpose of ContextVar in asyncio?', options: ['Global variable accessible from all tasks', 'Task-local storage — each Task gets its own copy, isolated from other tasks', 'Configuration variable for the event loop', 'Thread-local variable for threading code'], answer: 1, explanation: 'ContextVar provides task-local storage for asyncio. Each Task created with create_task() copies the current context, so ContextVar values set in a parent task are visible in child tasks (at creation time), but changes in child tasks are not visible to siblings or parent. It is the async equivalent of threading.local().' },
    { q: 'What does asyncio.TaskGroup do differently from asyncio.gather()?', options: ['TaskGroup is faster', 'TaskGroup cancels all tasks if any one fails; gather continues by default', 'gather supports timeouts; TaskGroup does not', 'They are identical'], answer: 1, explanation: 'asyncio.TaskGroup (Python 3.11) uses structured concurrency: if any task raises an exception, ALL other tasks in the group are cancelled, and the group raises an ExceptionGroup. asyncio.gather() by default propagates the first exception but does not cancel other tasks (with return_exceptions=True, exceptions are values). TaskGroup provides fail-fast with cleanup.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is a circuit breaker pattern and why use it?', a: 'A circuit breaker wraps calls to an external service and has three states: CLOSED (normal, requests pass through), OPEN (too many failures — requests fail immediately without calling the service), HALF_OPEN (probe state — one request allowed through to test recovery). This prevents a failing dependency from cascading (thundering herd: all requests queueing and timing out against a down service). Libraries: tenacity for retry+circuit breaker; aiobreaker for async-native circuit breakers.' },
    { q: 'How do you integrate a synchronous ORM like SQLAlchemy into async code?', a: 'Three approaches: (1) Use SQLAlchemy async extension (sqlalchemy.ext.asyncio) — full async support with AsyncSession and async_sessionmaker. (2) Use asyncio.to_thread(sync_db_fn, ...) to run sync ORM calls in a thread without blocking the loop. (3) For Django, use sync_to_async from asgiref. The async SQLAlchemy approach is best for new async code; to_thread is the pragmatic bridge for existing sync code.' },
    { q: 'What is the difference between asyncio.Semaphore and asyncio.BoundedSemaphore?', a: 'asyncio.Semaphore allows release() to be called more times than acquire() — the internal counter can exceed its initial value. asyncio.BoundedSemaphore raises ValueError if release() is called more times than acquire() — it enforces the invariant that the count never exceeds the initial value. Use BoundedSemaphore when over-releasing would indicate a bug (most use cases). Use Semaphore when dynamic adjustment is intentional.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Choose asyncio for I/O-heavy async, threads for blocking libs, processes for CPU; bridge with to_thread(); use ContextVar for task-local state and Queue(maxsize) for backpressure.',
    mustKnow: [
      'I/O-bound + async libs → asyncio; I/O-bound + sync libs → threads; CPU-bound → processes.',
      'asyncio.to_thread(fn) bridges blocking sync code into the event loop.',
      'Queue(maxsize=N) creates backpressure — put() blocks when full.',
      'ContextVar is task-local; threading.local() is thread-local (wrong for asyncio).',
      'asyncio.run() inside a running loop → RuntimeError; use run_coroutine_threadsafe().',
      'TaskGroup (3.11): fail-fast — one failure cancels all tasks in the group.',
    ],
    interviewFocus: [
      'How do you integrate blocking libraries into async code?',
      'Explain backpressure with asyncio.Queue.',
      'What is the difference between threading.local() and ContextVar?',
    ]
  };
}
