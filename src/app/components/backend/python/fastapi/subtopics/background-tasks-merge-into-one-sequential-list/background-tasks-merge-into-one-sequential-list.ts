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
  templateUrl: './background-tasks-merge-into-one-sequential-list.html',
  styleUrl: './background-tasks-merge-into-one-sequential-list.scss'
})
export class BackgroundTasksMergeIntoOneSequentialListSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every BackgroundTasks() in a request is really the same shared object',
      points: [
        'The main page\'s own theory says "inject BackgroundTasks as a function parameter. Call .add_task(fn, *args). The task runs AFTER the response is sent" — describing BackgroundTasks as if the route handler owns its own private instance. FastAPI\'s own docs describe something more specific: "FastAPI knows what to do in each case and how to reuse the same object, so that all the background tasks are merged together and are run afterwards in the background."',
        'FastAPI\'s own source confirms the mechanism: solve_dependencies() lazily creates ONE BackgroundTasks() instance the first time any part of a request (a dependency, or the route handler itself) declares a BackgroundTasks parameter, then threads that exact same instance through every subsequent dependency resolution and into the handler. A dependency that adds a task and the route handler that also adds a task are both calling .add_task() on the identical shared object — not two separate lists that FastAPI later combines.',
        'The practical consequence: a task added deep inside an auth or logging dependency runs in the SAME queue as a task the route handler itself adds — there is no way to isolate "this dependency\'s background work" from "this handler\'s background work" once both are added to the request\'s single shared BackgroundTasks.',
      ]
    },
    {
      heading: 'Tasks run sequentially, in order, strictly after the response — and one failure stops the rest',
      points: [
        'BackgroundTasks is a re-export of Starlette\'s own class, and Starlette\'s source shows exactly how the queue executes: async def __call__(self): for task in self.tasks: await task() — a plain for loop with await, run strictly in the order .add_task() was called. There is no asyncio.gather or concurrent scheduling here at all: tasks execute one at a time, and a slow task delays every task queued after it.',
        'This __call__ runs as part of the ASGI response cycle only once the response has already been sent over the wire to the client — the client has no way to observe how long the background queue takes to finish, only that the connection eventually closes.',
        'Since the loop has no try/except around each task() call, an exception raised by one task propagates upward and stops the loop entirely — every task still queued after the one that raised never runs. The exception cannot alter the response (already sent), but it does propagate to Starlette\'s own server-level exception handling, which is how such a failure typically surfaces in server logs — silently, from the client\'s point of view, but not invisibly from the server\'s.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A dependency-added task and a handler-added task share one queue',
      language: 'typescript',
      code: `from fastapi import FastAPI, BackgroundTasks, Depends
import time

app = FastAPI()
log: list[str] = []

def log_step(name: str) -> None:
    log.append(name)

# A dependency that ALSO adds a background task
async def audit_dependency(background_tasks: BackgroundTasks):
    background_tasks.add_task(log_step, "audit logged (from dependency)")

@app.post("/orders")
async def create_order(
    background_tasks: BackgroundTasks,
    _audit: None = Depends(audit_dependency),
):
    # This is the SAME BackgroundTasks object the dependency just used —
    # not a separate list FastAPI merges later.
    background_tasks.add_task(log_step, "order confirmation email queued")
    background_tasks.add_task(log_step, "inventory updated")
    return {"status": "created"}

# After the response for POST /orders is sent, log ends up as:
#   ["audit logged (from dependency)",
#    "order confirmation email queued",
#    "inventory updated"]
# — in the exact order .add_task() was called across BOTH the
# dependency and the handler, run one after another, not concurrently.`,
    },
    {
      label: 'A failing task stops every task queued after it',
      language: 'typescript',
      code: `from fastapi import FastAPI, BackgroundTasks

app = FastAPI()
completed: list[str] = []

def send_confirmation_email(order_id: int) -> None:
    completed.append(f"email sent for order {order_id}")

def charge_loyalty_points(order_id: int) -> None:
    # simulates a bug: this raises for every order
    raise RuntimeError(f"loyalty service unreachable for order {order_id}")

def update_analytics(order_id: int) -> None:
    # this NEVER runs when charge_loyalty_points is queued before it —
    # the background loop has no try/except per task, so the exception
    # above stops the whole queue right there
    completed.append(f"analytics updated for order {order_id}")

@app.post("/orders/{order_id}/complete")
async def complete_order(order_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_confirmation_email, order_id)   # runs
    background_tasks.add_task(charge_loyalty_points, order_id)      # raises
    background_tasks.add_task(update_analytics, order_id)           # SKIPPED
    return {"status": "completing"}
    # The client gets a normal 200 response immediately — it has no
    # way to know update_analytics never ran. The RuntimeError
    # propagates to Starlette's server-level error handling/logging,
    # not back to this already-sent response.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A checkout endpoint injects BackgroundTasks in both an inventory-reservation dependency (which adds a task to release a temporary hold) and the route handler itself (which adds a task to send a receipt email). During a load test, the team notices that whenever the hold-release task happens to raise (a rare edge case), the receipt email — added AFTER the hold-release task in this particular request — never gets sent, even though sending it has nothing to do with inventory. Explain why, using what this subtopic covers, and describe a fix that makes the receipt email reliably send regardless of the hold-release outcome.',
    hint: 'Are the dependency\'s BackgroundTasks and the handler\'s BackgroundTasks actually two separate queues, or the same one? When one task in a shared queue raises, what happens to every task queued after it, per this subtopic\'s theory?',
    solution: 'The receipt email never sends because the inventory dependency and the route handler are both adding tasks to the exact same shared BackgroundTasks instance for that request — FastAPI reuses one object across the whole dependency tree and the handler, per its own documentation ("reuse the same object, so that all the background tasks are merged together"). Since Starlette\'s BackgroundTasks.__call__ runs its tasks with a plain for loop and no try/except around each one, the hold-release task raising an exception stops the loop immediately — every task queued after it in that same request, including the receipt email (which was added later, purely by order of the two .add_task() calls), never runs at all. This has nothing to do with the tasks being logically related; it is purely a consequence of queue ORDER and the queue having no per-task fault isolation. The fix is to make the two tasks independent of each other\'s failure — either wrap each task function\'s own body in its own try/except so a task failure is caught and logged internally rather than propagating out of task() (the cleanest fix, since it makes every task individually fault-tolerant regardless of queue position), or, if strict ordering independence is required, dispatch genuinely unrelated background work through a separate mechanism entirely (a task queue like Celery, or a second BackgroundTasks-triggering call) rather than relying on FastAPI\'s single shared per-request queue to keep unrelated tasks isolated from each other.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A BackgroundTasks parameter injected into a dependency and a BackgroundTasks parameter injected into the route handler are two separate queues that FastAPI happens to run one after another.',
      reality: 'This subtopic\'s theory and first code example show it is the exact same object the whole way through — FastAPI lazily creates ONE BackgroundTasks instance per request and threads that identical reference through every dependency and into the handler, so .add_task() calls from anywhere in that request\'s resolution all land in one single list.'
    },
    {
      thought: 'Background tasks queued via multiple .add_task() calls run concurrently after the response is sent, similar to how asyncio.gather() would run several coroutines at once.',
      reality: 'This subtopic\'s theory, grounded directly in Starlette\'s own source (a plain for loop with await task()), shows background tasks run strictly SEQUENTIALLY in the exact order they were added — a slow task delays every task queued after it, and there is no concurrent execution at all.'
    },
    {
      thought: 'If one background task raises an exception, it only affects that specific task — the other unrelated tasks queued in the same request still run normally afterward.',
      reality: 'This subtopic\'s second code example and exercise show the opposite — since Starlette\'s background task loop has no try/except around each individual task() call, one task raising stops the ENTIRE remaining queue for that request, silently (from the client\'s perspective) skipping every task that was queued after the one that failed, regardless of whether those later tasks are logically related to the failure at all.'
    }
  ];
}
