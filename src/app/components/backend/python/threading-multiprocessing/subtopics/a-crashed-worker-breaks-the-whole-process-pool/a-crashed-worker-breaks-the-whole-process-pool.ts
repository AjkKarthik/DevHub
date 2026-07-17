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
  templateUrl: './a-crashed-worker-breaks-the-whole-process-pool.html',
  styleUrl: './a-crashed-worker-breaks-the-whole-process-pool.scss'
})
export class ACrashedWorkerBreaksTheWholeProcessPoolSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One worker crashing non-cleanly poisons the ENTIRE ProcessPoolExecutor, not just that one task',
      points: [
        'The main page\'s own theory covers ordinary task failures — an exception raised inside a submitted function, caught via future.result() inside a try/except, exactly like the main page\'s own "Failed: {url} — {e}" pattern. That pattern correctly isolates one task\'s ordinary Python exception from the rest. A worker process crashing non-cleanly is a fundamentally different, more severe failure mode the main page never addresses.',
        'Python\'s own concurrent.futures documentation describes a dedicated exception for exactly this: BrokenProcessPool, "raised when one of the workers of a ProcessPoolExecutor has terminated in a non-clean fashion (for example, if it was killed from the outside)" — a segmentation fault in a C extension, the OS killing the process for using too much memory, or anything else that ends the worker process abruptly rather than through an ordinary Python exception.',
        'This is not scoped to the one task that happened to be running on the crashed worker. Python\'s own documentation notes (from the "Changed in version 3.3" entry) that this failure affects "the executor or its futures" broadly — in practice, once a worker crashes this way, the executor itself is left in a permanently broken state: every OTHER pending task, and any new task submitted afterward, also raises BrokenProcessPool, even though those other tasks themselves never did anything wrong.',
      ]
    },
    {
      heading: 'Why this matters and what the correct response actually is',
      points: [
        'This is a categorically different failure than the main page\'s own per-task exception handling can address — no amount of try/except around individual future.result() calls fixes a broken pool, because the pool itself, not any specific task, is what has failed. Code that only catches ordinary exceptions from .result() will find BrokenProcessPool propagating out of every subsequent call, potentially looking like a cascading, mysterious failure across many unrelated tasks at once.',
        'The correct response is catching BrokenProcessPool specifically (it is available as concurrent.futures.process.BrokenProcessPool), and treating it as a signal that the ENTIRE executor instance needs to be discarded and a fresh one created — not retried with the same, now-permanently-broken pool. This is worth designing for explicitly in any long-running service that uses a ProcessPoolExecutor for an extended period, since a rare worker crash (however unlikely for any single task) becomes a real operational concern over enough total task volume.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A crashed worker breaks every OTHER task, not just its own',
      language: 'typescript',
      code: `from concurrent.futures import ProcessPoolExecutor
from concurrent.futures.process import BrokenProcessPool
import os, signal

def normal_task(n):
    return n * n

def crashing_task():
    # Simulates a hard crash (e.g. a segfault in a C extension) —
    # killing the worker process itself, not raising an ordinary
    # Python exception.
    os.kill(os.getpid(), signal.SIGKILL)

if __name__ == "__main__":
    with ProcessPoolExecutor(max_workers=2) as ex:
        f1 = ex.submit(crashing_task)     # this worker gets killed
        f2 = ex.submit(normal_task, 5)    # perfectly fine task —
                                            # never does anything wrong

        try:
            f1.result()
        except BrokenProcessPool as e:
            print(f"f1 failed as expected: {e}")

        try:
            f2.result()   # BrokenProcessPool too — even though
                            # normal_task(5) never crashed anything!
        except BrokenProcessPool as e:
            print(f"f2 ALSO failed: {e}")
        # Both fail — the entire pool is broken, not just the task
        # that actually caused the crash.`,
    },
    {
      label: 'The correct response — discard and recreate the executor',
      language: 'typescript',
      code: `from concurrent.futures import ProcessPoolExecutor
from concurrent.futures.process import BrokenProcessPool

def create_executor():
    return ProcessPoolExecutor(max_workers=4)

def run_with_pool_recovery(tasks):
    executor = create_executor()
    results = []
    try:
        futures = [executor.submit(fn, *args) for fn, args in tasks]
        for f in futures:
            try:
                results.append(f.result())
            except BrokenProcessPool:
                # The POOL is broken — no point retrying against
                # this same executor instance at all.
                print("Pool broken — discarding and recreating")
                executor.shutdown(wait=False)
                executor = create_executor()   # fresh pool
                # Real production code would re-submit remaining
                # tasks to the NEW executor here.
                break
    finally:
        executor.shutdown(wait=True)
    return results`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A long-running data-processing service maintains a single, shared ProcessPoolExecutor for its entire lifetime, submitting thousands of independent image-transformation tasks to it over many hours. One task happens to trigger a rare crash inside a C image-processing library, killing that one worker process outright. Immediately afterward, every subsequent task submitted to the SAME executor instance also fails, even though none of those later tasks touch the problematic image or code path at all. Explain why, using what this subtopic covers, and describe the correct fix.',
    hint: 'Per this subtopic\'s theory, when a ProcessPoolExecutor worker terminates non-cleanly (a crash, not an ordinary Python exception), does the resulting failure stay scoped to just that one task\'s Future — or does it affect the executor instance as a whole, including tasks that have nothing to do with the crash?',
    solution: 'Every subsequent task fails because a worker crashing non-cleanly (a segfault inside the C image-processing library, not an ordinary Python exception) breaks the ENTIRE ProcessPoolExecutor instance, not just the one task that happened to trigger it. Python\'s own documentation confirms BrokenProcessPool is "raised when one of the workers of a ProcessPoolExecutor has terminated in a non-clean fashion," and describes the resulting failure as affecting "the executor or its futures" broadly — in practice, once this happens, the executor is left permanently unable to process any further work correctly, so every task submitted to that same instance afterward — regardless of how unrelated its own code path is to the original crash — also raises BrokenProcessPool. This is precisely why later, completely unrelated image-transformation tasks started failing immediately after the crash: they were never at fault themselves, but the pool they were submitted to had already been poisoned by the earlier crash. The correct fix is catching BrokenProcessPool specifically (available as concurrent.futures.process.BrokenProcessPool) at the point future.result() is called, and treating it as a signal to discard the current executor instance entirely (calling shutdown()) and create a brand-new ProcessPoolExecutor to continue processing — no amount of retrying against the SAME broken executor instance will ever succeed, since the executor itself, not any individual task, is what has actually failed. For a long-running service like this one, building this "detect BrokenProcessPool, recreate the pool, resubmit remaining work" recovery logic in from the start is worth doing explicitly, since a rare per-task crash probability compounds into a real, eventual certainty over enough total task volume and running time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If one task submitted to a ProcessPoolExecutor causes its worker process to crash, only that specific task\'s Future is affected — other, unrelated tasks already submitted to or later submitted to the same executor should continue working normally.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation confirms a non-clean worker termination raises BrokenProcessPool, and this affects the executor broadly, not just the one task that triggered the crash; every other pending or future task on that same executor instance also fails.'
    },
    {
      thought: 'Wrapping every future.result() call in a try/except that catches ordinary exceptions is sufficient error handling for any ProcessPoolExecutor-based code, since it already isolates individual task failures from the rest of the program.',
      reality: 'This subtopic\'s theory explains this is not sufficient on its own — ordinary per-task exception handling addresses ordinary Python exceptions raised inside a task, but a BrokenProcessPool failure is categorically different (the pool itself has failed, not a specific task), and requires its own dedicated handling: discarding and recreating the executor, not simply catching and logging.'
    },
    {
      thought: 'A cascading pattern of many unrelated tasks suddenly failing all at once on the same ProcessPoolExecutor must indicate a bug spread across many different pieces of code, or a systemic issue with the input data being processed.',
      reality: 'This subtopic\'s exercise shows a much simpler, single root cause behind exactly this symptom — one single non-clean worker crash, from just ONE task, is sufficient to break the entire pool and cause every subsequent, completely unrelated task to fail identically, with no bug or data issue in any of those other tasks at all.'
    }
  ];
}
