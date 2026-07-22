import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './default-executor-thread-pool-sizing.html',
  styleUrl: './default-executor-thread-pool-sizing.scss'
})
export class DefaultExecutorThreadPoolSizingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'run_in_executor(None, fn) reuses one lazily-created pool, not a fresh pool per call',
      points: [
        'The main page\'s own quick reference describes run_in_executor(None, fn) and asyncio.to_thread() as ways to "run sync blocking fn in thread pool without blocking event loop" — but treats the pool itself as an implementation detail. Python\'s own asyncio-eventloop documentation is explicit about what None actually means: "a concurrent.futures.ThreadPoolExecutor will be lazy-initialized and used if needed." Lazy means the pool is not created until the first call that needs it — but every call after that first one reuses the SAME cached pool on that event loop, rather than spinning up a new one each time.',
        'asyncio.to_thread() is not a separate mechanism — it calls loop.run_in_executor(None, ...) internally, so it shares this exact same lazily-created, cached default pool. Every asyncio.to_thread() call across an entire event loop\'s lifetime draws from one pool with a fixed maximum worker count, not an unlimited or per-call thread allocation.',
      ]
    },
    {
      heading: 'The default pool\'s size is capped by a formula, not unbounded',
      points: [
        'Because run_in_executor(None, ...) creates a plain ThreadPoolExecutor with no max_workers argument specified, it inherits ThreadPoolExecutor\'s own default sizing. Python\'s own concurrent.futures documentation states the current formula directly: "Changed in version 3.8: Default value of max_workers is changed to min(32, os.cpu_count() + 4). This default value preserves at least 5 workers for I/O bound tasks." (An earlier default, os.cpu_count() * 5, applied before 3.8.)',
        'This means on an 8-core machine, the default pool caps out at min(32, 8 + 4) = 12 worker threads — not the 32 the min() might suggest at a glance, and nowhere near unlimited. Submitting the 13th concurrent asyncio.to_thread() call on such a machine does not fail or spawn a 13th thread; it queues behind the 12 already running, waiting for one to free up, exactly like any other bounded thread pool.',
        'The consequence for async code: code that fires off dozens or hundreds of asyncio.to_thread() calls concurrently (say, wrapping a blocking library for many simultaneous requests) is not actually running them all in parallel threads — most are queued, waiting for a slot in a pool sized for a small, fixed number of CPU cores plus a constant, regardless of how many coroutines are conceptually "in flight" at once. Python 3.13 kept the same shape but swapped the underlying call to os.process_cpu_count() (falling back to 1) — the formula itself, min(32, cpu_count + 4), has not changed since 3.8.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Measuring the default pool\'s actual cap',
      language: 'typescript',
      code: `import asyncio, os, time

def blocking_work(task_id: int) -> int:
    time.sleep(0.3)   # simulates a slow, blocking sync call
    return task_id

async def main():
    print(f"os.cpu_count() = {os.cpu_count()}")
    print(f"default pool cap = min(32, cpu_count + 4) = "
          f"{min(32, (os.cpu_count() or 1) + 4)}")

    n_tasks = 40   # deliberately more than the pool can run at once
    start = time.monotonic()
    results = await asyncio.gather(
        *[asyncio.to_thread(blocking_work, i) for i in range(n_tasks)]
    )
    elapsed = time.monotonic() - start

    # If the pool truly ran all 40 in parallel, elapsed would be ~0.3s.
    # Since the pool is capped (say, at 12 on an 8-core machine), the
    # 40 tasks run in ceil(40 / 12) = 4 waves of up to 0.3s each —
    # elapsed comes out closer to ~1.2s, revealing the queueing.
    print(f"{n_tasks} tasks finished in {elapsed:.2f}s "
          f"(pure parallel would be ~0.3s)")

asyncio.run(main())`,
    },
    {
      label: 'Passing an explicit executor when the default cap is too small',
      language: 'typescript',
      code: `import asyncio
from concurrent.futures import ThreadPoolExecutor

def blocking_work(task_id: int) -> int:
    import time; time.sleep(0.3)
    return task_id

async def main():
    n_tasks = 40

    # asyncio.to_thread() always uses the DEFAULT pool — there is no
    # way to pass a custom executor to it. To raise the concurrency
    # cap, go back to run_in_executor() with an explicit executor
    # sized for this specific workload instead of relying on None.
    custom_pool = ThreadPoolExecutor(max_workers=40)
    loop = asyncio.get_running_loop()

    results = await asyncio.gather(*[
        loop.run_in_executor(custom_pool, blocking_work, i)
        for i in range(n_tasks)
    ])
    # Now all 40 genuinely run concurrently, since the pool itself
    # was sized to match — this is the escape hatch for workloads
    # whose expected concurrent I/O-bound call count is known to
    # exceed the default min(32, cpu_count + 4) cap.
    custom_pool.shutdown(wait=True)

asyncio.run(main())`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A web scraper on a 4-core machine uses asyncio.to_thread() to wrap a blocking HTTP client, launching 50 concurrent asyncio.to_thread() calls via asyncio.gather() to fetch 50 URLs "in parallel." The developer expects all 50 requests to be in flight simultaneously, but network monitoring shows only a small number of connections open at any given moment, with the rest clearly queued. Explain why, using what this subtopic covers, and give the number the pool is actually capped at on this machine.',
    hint: 'What pool does every asyncio.to_thread() call on the same event loop actually share, and what is that pool\'s own default sizing formula? Does calling asyncio.to_thread() 50 times create 50 separate threads, or submit 50 items of work to one shared pool?',
    solution: 'The requests are queued, not simultaneous, because every asyncio.to_thread() call on a given event loop shares the SAME lazily-created default ThreadPoolExecutor — it is not creating a fresh thread per call. That default pool\'s size follows the documented concurrent.futures.ThreadPoolExecutor formula, since asyncio.to_thread() creates it with no explicit max_workers: min(32, os.cpu_count() + 4). On this 4-core machine, that works out to min(32, 4 + 4) = 8 worker threads — so of the 50 gather()-launched to_thread() calls, only 8 are ever actually running at once; the remaining 42 sit queued, each waiting for one of the 8 threads to finish its current URL fetch and become available. This is exactly why network monitoring shows a small, roughly-constant number of open connections rather than 50 at once — 8 is the real concurrency ceiling, regardless of how many to_thread() calls were conceptually launched together via gather(). The fix, if higher concurrency is genuinely needed, is to stop relying on to_thread()\'s fixed default pool and instead call loop.run_in_executor(custom_pool, fn, *args) with an explicitly-sized ThreadPoolExecutor(max_workers=50) (or whatever cap fits the workload), since run_in_executor() (unlike to_thread()) accepts a specific executor instead of always reaching for the shared default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Each call to asyncio.to_thread() (or run_in_executor(None, fn)) spins up its own new thread, so launching N concurrent calls via asyncio.gather() means N threads genuinely running at the same time.',
      reality: 'This subtopic\'s theory and first code example show every to_thread()/run_in_executor(None, ...) call on a given event loop shares one lazily-created, cached ThreadPoolExecutor — calls beyond that pool\'s worker cap queue and wait for a free slot, they do not each get a dedicated new thread.'
    },
    {
      thought: 'Since the default pool\'s formula is min(32, os.cpu_count() + 4), the practical concurrency cap is basically always 32 on any reasonably modern multi-core machine.',
      reality: 'This subtopic\'s exercise shows the cap is only 32 once cpu_count() + 4 reaches or exceeds 32 — meaning cpu_count() of 28 or more. On common machines with fewer cores (4, 8, even 16), the min() actually selects the smaller cpu_count() + 4 side of the formula (8, 12, or 20 respectively), not the flat 32 many assume applies everywhere.'
    },
    {
      thought: 'If the default thread pool\'s concurrency cap is too low for a workload, the fix is to call asyncio.to_thread() with some kind of pool-size argument or configuration option.',
      reality: 'This subtopic\'s second code example shows asyncio.to_thread() has no way to accept a custom executor at all — it always uses the shared default pool. The actual escape hatch is to go back to the lower-level loop.run_in_executor(executor, fn, *args) and pass an explicitly created, custom-sized ThreadPoolExecutor as the executor argument instead of None.'
    }
  ];
}
