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
  templateUrl: './gather-does-not-cancel-siblings-on-failure.html',
  styleUrl: './gather-does-not-cancel-siblings-on-failure.scss'
})
export class GatherDoesNotCancelSiblingsOnFailureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'gather()\'s default behavior stops WAITING on failure — it does not cancel the other coroutines',
      points: [
        'The main page\'s own theory says "Without return_exceptions=True, the first exception propagates and cancels remaining tasks" — describing gather()\'s default failure behavior as actively cancelling siblings. Python\'s own documentation describes something more precise and, in one respect, genuinely different.',
        'Python\'s own asyncio-task documentation states: "If return_exceptions is False (default), the first raised exception is immediately propagated to the task that awaits on gather(). Other awaitables in the aws sequence won\'t be cancelled and will continue to run." The exception propagates immediately to whatever is awaiting gather() — but the OTHER coroutines are explicitly NOT cancelled; they keep running in the background to their own natural completion, independent of the fact that gather() itself has already raised and returned control to its caller.',
        'This is the exact distinction Python\'s own documentation draws against TaskGroup: "TaskGroup provides stronger safety guarantees than gather for scheduling a nesting of subtasks: if a task... raises an exception, TaskGroup will, while gather will not, cancel the remaining scheduled tasks." gather() and TaskGroup handle a sibling failure in genuinely different ways — this is documented as a deliberate, real behavioral difference, not just alternate syntax for the same thing.',
      ]
    },
    {
      heading: 'Why the still-running siblings matter in practice',
      points: [
        'Since gather()\'s caller receives control back the moment the first exception propagates (via the raised exception, not a return value), any code after the await asyncio.gather(...) line that assumes "if we got past this line without an exception, everything is done" is only half-correct — an exception DOES stop the caller from proceeding past that point, but the sibling coroutines silently continue running in the background, potentially completing, raising their own separate exceptions later (which can surface as "Task exception was never retrieved" warnings if nothing ever collects them), or continuing to consume resources (open connections, in-flight requests) the caller has already logically moved past.',
        'The main page\'s own QnA on structured concurrency already flags the consequence in passing — "gather() does not automatically cancel sibling tasks when one fails... a subtle source of resource leaks (unclosed connections, orphaned tasks)" — this subtopic confirms the exact documented mechanism behind that warning: it isn\'t that gather() forgets to cancel siblings under some conditions, it is gather()\'s own, deliberately documented default behavior to never cancel them at all.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The other coroutines keep running after gather() raises',
      language: 'typescript',
      code: `import asyncio

async def task_a():
    await asyncio.sleep(0.1)
    raise ValueError("task A failed")

async def task_b():
    print("task B starting...")
    await asyncio.sleep(2)   # much slower than task_a's failure
    print("task B finished!")   # this STILL prints — task_b was
                                  # never cancelled by task_a's failure
    return "B done"

async def main():
    try:
        await asyncio.gather(task_a(), task_b())
    except ValueError as e:
        print(f"gather() raised: {e}")
        # Control returns HERE almost immediately (~0.1s) — but
        # task_b is still running in the background at this point.

    # Prove task_b really is still running by waiting longer:
    await asyncio.sleep(2.5)
    # "task B finished!" printed roughly 2 seconds AFTER the
    # ValueError was already caught and handled above.

asyncio.run(main())`,
    },
    {
      label: 'TaskGroup, by contrast, DOES cancel siblings on failure',
      language: 'typescript',
      code: `import asyncio

async def task_a():
    await asyncio.sleep(0.1)
    raise ValueError("task A failed")

async def task_b():
    print("task B starting...")
    try:
        await asyncio.sleep(2)
        print("task B finished!")   # this does NOT print with TaskGroup —
                                      # task_b gets cancelled first
    except asyncio.CancelledError:
        print("task B was cancelled")   # THIS prints instead, quickly
        raise

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(task_a())
            tg.create_task(task_b())
    except* ValueError as eg:
        print(f"TaskGroup raised: {eg.exceptions}")
    # "task B was cancelled" prints almost immediately — TaskGroup
    # actively cancels sibling tasks the moment one fails, unlike
    # gather()'s default behavior of leaving them running.

asyncio.run(main())`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function uses await asyncio.gather(charge_payment(order), reserve_inventory(order)) to run two operations concurrently. If charge_payment() raises, the function catches the exception and immediately returns an error response to the caller, assuming both operations have effectively stopped. Occasionally, inventory ends up reserved for orders whose payment ultimately failed. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'When charge_payment() raises inside the gather() call, does reserve_inventory() (the other coroutine) get cancelled automatically, or does it keep running independently in the background? What does this subtopic\'s theory say gather()\'s documented default behavior actually is when one awaitable fails?',
    solution: 'Inventory ends up reserved for failed-payment orders because reserve_inventory() is never actually cancelled when charge_payment() raises — per Python\'s own documentation, gather()\'s default behavior (return_exceptions=False) means "the first raised exception is immediately propagated to the task that awaits on gather(). Other awaitables in the aws sequence won\'t be cancelled and will continue to run." So the moment charge_payment() raises, the exception propagates to the function\'s try/except, which returns an error response right away — but reserve_inventory(), if it was still in progress at that exact moment, keeps running completely independently in the background, unaffected by charge_payment()\'s failure or by the function having already returned its error response. If reserve_inventory() happens to complete successfully AFTER the error response has already been sent, the inventory genuinely does get reserved, even though the caller (and the customer) were already told the order failed — exactly the observed bug, and exactly the kind of "resource leak" scenario the main page\'s own QnA on structured concurrency alludes to without spelling out the precise mechanism. The fix is switching from gather() to asyncio.TaskGroup (Python 3.11+), which per Python\'s own documented contrast with gather() DOES actively cancel sibling tasks the moment one raises — using async with asyncio.TaskGroup() as tg: tg.create_task(charge_payment(order)); tg.create_task(reserve_inventory(order)) ensures that if charge_payment() fails, reserve_inventory() is genuinely cancelled rather than left running to an inconsistent, orphaned completion.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own description — "without return_exceptions=True, the first exception propagates and cancels remaining tasks" — means gather() actively stops and cancels the other coroutines the moment one of them raises, the same way TaskGroup does.',
      reality: 'This subtopic\'s theory and first code example both show a real, documented distinction — gather()\'s default behavior only stops WAITING for the other coroutines (propagating the first exception immediately to its own caller); it explicitly does NOT cancel them, and they continue running independently in the background.'
    },
    {
      thought: 'Once code catches an exception raised from an await asyncio.gather(...) call and proceeds to handle the error (e.g., returning an error response), it is safe to assume every coroutine passed to that gather() call has already stopped running.',
      reality: 'This subtopic\'s exercise shows this assumption is false and can cause real bugs — sibling coroutines that were still in progress when the first one failed continue running to their own natural completion in the background, potentially producing effects (like reserving inventory) after the caller has already moved on believing the whole operation failed.'
    },
    {
      thought: 'asyncio.gather() and asyncio.TaskGroup are essentially interchangeable ways to run multiple coroutines concurrently and wait for all of them, differing mainly in syntax (a function call vs. an async context manager) rather than in actual failure-handling behavior.',
      reality: 'This subtopic\'s second code example shows a genuine, documented behavioral difference — Python\'s own docs state directly that TaskGroup provides "stronger safety guarantees" specifically because it cancels remaining scheduled tasks on a sibling failure, "while gather will not," making the choice between them a real behavioral decision, not just a stylistic one.'
    }
  ];
}
