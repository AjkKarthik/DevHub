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
  templateUrl: './create-task-needs-a-saved-reference-or-it-vanishes.html',
  styleUrl: './create-task-needs-a-saved-reference-or-it-vanishes.scss'
})
export class CreateTaskNeedsASavedReferenceOrItVanishesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The event loop only holds a WEAK reference to a Task — an unreferenced task can vanish mid-execution',
      points: [
        'The main page\'s own theory describes create_task() as scheduling work that "runs concurrently" and returns a Task "immediately" — every example on the main page immediately awaits the returned task (r1 = await t1) or stores it in a local variable that stays in scope for the rest of the function. This makes it easy to assume the event loop itself is what keeps a scheduled task alive and running.',
        'Python\'s own asyncio documentation states directly, in an "Important" note under create_task(): "Save a reference to the result of this function, to avoid a task disappearing mid-execution. The event loop only keeps weak references to tasks. A task that isn\'t referenced elsewhere may get garbage collected at any time, even before it\'s done." The event loop\'s own bookkeeping is not enough on its own to keep a Task alive — something else in your code needs to hold a genuine, strong reference to it.',
        'This specifically bites the "fire and forget" pattern — calling asyncio.create_task(some_background_work()) and immediately discarding the return value (or letting the local variable holding it go out of scope) without ever awaiting it. Since nothing retains a strong reference, Python\'s garbage collector is free to collect the Task object at any point, silently cancelling whatever work it was still doing, with no exception or warning raised at the call site that scheduled it.',
      ]
    },
    {
      heading: 'The documented fix — a background-tasks set with an auto-cleanup callback',
      points: [
        'Python\'s own documentation gives the exact recommended pattern for reliable fire-and-forget tasks: background_tasks = set(); task = asyncio.create_task(some_coro()); background_tasks.add(task); task.add_done_callback(background_tasks.discard). Adding the task to the set creates the strong reference that keeps it alive; add_done_callback(background_tasks.discard) automatically removes it from the set once it finishes, preventing the set from growing unboundedly over the life of a long-running application.',
        'This matters most for genuinely fire-and-forget background work that the main page\'s own examples don\'t model — logging, metrics emission, cache warming, or notification sends kicked off from inside a request handler without the handler itself awaiting them. Any of the main page\'s own patterns that DO await every created task (as all of its examples do) are already safe from this issue, since the await itself keeps a live reference for as long as it\'s needed.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An unreferenced fire-and-forget task can be silently GC\'d mid-execution',
      language: 'typescript',
      code: `import asyncio

async def send_notification(user_id: int) -> None:
    await asyncio.sleep(2)   # simulated network call
    print(f"Notified user {user_id}")

async def handle_request(user_id: int) -> str:
    # Fire-and-forget: intentionally NOT awaited, so the request
    # handler can return immediately without waiting for the
    # notification to actually send.
    asyncio.create_task(send_notification(user_id))
    # The Task object returned above is never stored anywhere —
    # nothing holds a strong reference to it. The event loop's OWN
    # reference is documented as weak, not strong.
    return "Request handled"

async def main():
    result = await handle_request(42)
    print(result)
    # "Notified user 42" may or may not print, depending on whether
    # the garbage collector reclaims the unreferenced task before it
    # finishes — this is genuinely non-deterministic, silent behavior.
    await asyncio.sleep(3)

asyncio.run(main())`,
    },
    {
      label: 'The documented fix — a background-tasks set with auto-cleanup',
      language: 'typescript',
      code: `import asyncio

background_tasks: set[asyncio.Task] = set()

async def send_notification(user_id: int) -> None:
    await asyncio.sleep(2)
    print(f"Notified user {user_id}")

def fire_and_forget(coro) -> None:
    task = asyncio.create_task(coro)
    background_tasks.add(task)          # creates a STRONG reference
    task.add_done_callback(background_tasks.discard)  # auto-cleanup

async def handle_request(user_id: int) -> str:
    fire_and_forget(send_notification(user_id))
    return "Request handled"

async def main():
    result = await handle_request(42)
    print(result)
    await asyncio.sleep(3)
    # "Notified user 42" now reliably prints — background_tasks held
    # a genuine strong reference to the task for its entire duration,
    # and the done-callback cleanly removed it once finished.

asyncio.run(main())`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A web application handler kicks off a background audit-log write for every request using asyncio.create_task(write_audit_log(request_data)), without awaiting or storing the returned Task anywhere. In production under moderate load, audit log entries are found to be missing roughly 5-10% of the time, with no errors logged anywhere. Under light local testing, every audit log entry always appears to be written successfully. Explain the likely cause, using what this subtopic covers.',
    hint: 'What does Python\'s own documentation say happens to a Task if nothing in your code holds a strong reference to it — does the event loop\'s own internal bookkeeping count as a strong reference? Why might this be more likely to actually manifest under real production load (with garbage collection genuinely running periodically) than during light local testing?',
    solution: 'The missing audit log entries are very likely caused by the unreferenced Task being garbage collected mid-execution, before write_audit_log() actually finishes — per Python\'s own documentation, "the event loop only keeps weak references to tasks. A task that isn\'t referenced elsewhere may get garbage collected at any time, even before it\'s done," and since the create_task() call\'s return value here is never stored or awaited, nothing in the application holds a genuine strong reference to it. Under light local testing, garbage collection may simply not happen to run at a moment that catches one of these short-lived tasks mid-flight, especially with few concurrent requests — making the bug effectively invisible. Under real production load, with many more objects being allocated and collected over time, the odds of a GC cycle catching an in-flight, unreferenced task rise substantially, which lines up precisely with the 5-10% intermittent, non-deterministic loss rate observed, and explains why no errors are ever logged — a garbage-collected task simply stops running silently, it does not raise any exception anywhere that error logging would catch. The fix is exactly the pattern Python\'s own documentation recommends: maintain a module-level background_tasks = set(), add each created task to it (task = asyncio.create_task(write_audit_log(request_data)); background_tasks.add(task)), and register task.add_done_callback(background_tasks.discard) to clean up once each task completes — this guarantees every fire-and-forget audit-log task has a genuine strong reference keeping it alive until it genuinely finishes, regardless of how or when garbage collection runs.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once asyncio.create_task() schedules a coroutine to run on the event loop, the event loop itself keeps that task alive and running to completion, regardless of whether the calling code stores or awaits the returned Task object.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation states plainly that "the event loop only keeps weak references to tasks," meaning an unreferenced task can be garbage collected and silently stop running at any point, even before it finishes.'
    },
    {
      thought: 'A "fire and forget" background task pattern (calling asyncio.create_task() without awaiting the result) is inherently safe as long as the coroutine itself doesn\'t raise any exceptions, since the whole point is not needing to track its outcome.',
      reality: 'This subtopic\'s exercise shows a real risk with this pattern regardless of whether the coroutine would have succeeded — an unreferenced task can be garbage-collected and simply stop running entirely, silently, with no exception raised anywhere to indicate anything went wrong.'
    },
    {
      thought: 'Since a bug like this — a fire-and-forget task silently failing to complete — would be caught during normal local development and testing, its absence during testing is reasonable evidence the code is correct and safe to deploy.',
      reality: 'This subtopic\'s exercise shows the opposite — this specific bug is inherently non-deterministic and tied to actual garbage collection timing, which behaves very differently under light local testing versus sustained production load, making it a genuine example of a bug that can pass all local testing yet still cause real, measurable data loss in production.'
    }
  ];
}
