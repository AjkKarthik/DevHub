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
  templateUrl: './pending-state-cannot-distinguish-unknown-from-queued.html',
  styleUrl: './pending-state-cannot-distinguish-unknown-from-queued.scss'
})
export class PendingStateCannotDistinguishUnknownFromQueuedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'PENDING means "waiting" AND "I have no idea what you\'re talking about" — the same word for both',
      points: [
        'The main page\'s own theory never discusses AsyncResult states beyond mentioning result.get() and task IDs in passing. Celery\'s own docs define the PENDING state precisely, and the definition itself contains the gotcha: "Task is waiting for execution or unknown. Any task id that\'s not known is implied to be in the pending state." Two entirely different situations — a real task genuinely queued and waiting for a worker, and a task ID that was never submitted at all (a typo, an expired result, a made-up UUID) — report the exact same string: "PENDING".',
        'This is not an edge case Celery accidentally leaves ambiguous — it is documented, deliberate behavior with a specific reason: Celery has no reliable, checkable list of "here is every task ID that genuinely exists somewhere in the queue right now." Rather than trying to distinguish the two, any AsyncResult constructed from an ID it has no other information about defaults to PENDING, full stop.',
        'The practical trap: AsyncResult(some_id).state == "PENDING" is often written as if it means "this task is real and just hasn\'t run yet" — but AsyncResult("totally-made-up-uuid-that-was-never-a-task").state also returns "PENDING", with no error, no exception, and no distinguishing signal of any kind. Code that polls a task ID and only worries about SUCCESS/FAILURE/PENDING can silently poll forever on a bogus ID that will never transition to anything else, mistaking "this task doesn\'t exist" for "this task just hasn\'t started."',
      ]
    },
    {
      heading: 'task_track_started narrows the gap — it does not close it',
      points: [
        'Celery\'s own docs point to task_track_started (default False) as the way to get more signal: with it enabled, a task reports "STARTED" the moment a worker actually begins executing it, rather than staying "PENDING" the entire time it is queued and running. This lets code distinguish "queued, no worker has picked it up yet" from "a worker is actively running it right now" — genuinely useful information the default configuration does not provide.',
        'But STARTED only helps for tasks that are real and eventually get picked up — a bogus task ID never reaches STARTED, SUCCESS, or FAILURE, since no worker will ever execute a task that was never actually dispatched. task_track_started narrows the ambiguity window for genuine tasks; it does nothing to resolve whether a given ID was ever a genuine task in the first place.',
        'Celery provides no documented "does this task ID exist" check at all — AsyncResult.successful() and .failed() only return True for a genuine SUCCESS or FAILURE state respectively, so both correctly return False for a bogus ID and for a real-but-unfinished task alike, without distinguishing between them either. The only reliable mitigation is one the application itself has to build: recording every task ID it actually dispatches (e.g. writing it to your own database or log at submission time) so "was this ever a real task" can be answered from that record, rather than by asking Celery.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A bogus task ID and a real queued task look identical',
      language: 'typescript',
      code: `from celery.result import AsyncResult
from tasks import app, send_email

# A REAL task, genuinely dispatched and waiting in the queue
real_result = send_email.delay("user@example.com", "Hi", "Welcome!")
print(real_result.state)   # "PENDING" — genuinely queued, not yet run

# A COMPLETELY MADE-UP task ID — never submitted, never existed
fake_result = AsyncResult("this-id-was-never-a-real-task-12345", app=app)
print(fake_result.state)   # ALSO "PENDING" — no error, no distinction

# Both report the exact same state string. Code that does:
def wait_for_task(task_id: str, timeout: int = 30) -> dict:
    result = AsyncResult(task_id, app=app)
    import time
    elapsed = 0
    while result.state == "PENDING" and elapsed < timeout:
        time.sleep(1)
        elapsed += 1
    if result.state == "PENDING":
        return {"error": "timed out — task never completed"}
    return {"state": result.state}

# ...cannot tell, from inside this function, whether it timed out
# because a real task was just slow, or because task_id was bogus
# from the very first call — both produce identical PENDING polling.`,
    },
    {
      label: 'task_track_started narrows, but does not close, the gap',
      language: 'typescript',
      code: `from celery import Celery

app = Celery("myapp", broker="redis://localhost:6379/0",
             backend="redis://localhost:6379/1")
app.conf.task_track_started = True   # off by default

@app.task
def slow_task():
    import time
    time.sleep(30)
    return "done"

# Dispatch and poll:
result = slow_task.delay()
print(result.state)   # "PENDING" — queued, no worker has picked it up yet

# ...a moment later, once a worker starts executing it:
print(result.state)   # "STARTED" — now we know a REAL worker is
                        # actively running this task, distinguishing
                        # it from "still just sitting in the queue"

# But a bogus ID STILL never gets here:
from celery.result import AsyncResult
fake = AsyncResult("never-existed", app=app)
print(fake.state)   # "PENDING" forever — task_track_started adds a
                      # STARTED signal for REAL tasks, but a fake ID
                      # has no worker to ever pick it up and transition
                      # it to STARTED in the first place.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A web app stores a Celery task_id returned from task.delay() in a database row so a status-check endpoint can later report progress: GET /jobs/{id}/status returns {"state": AsyncResult(id).state}. A bug elsewhere in the codebase occasionally writes a corrupted/truncated task_id to that database column. Explain what the status-check endpoint would show for one of those corrupted rows, using what this subtopic covers, and why this makes the bug harder to notice.',
    hint: 'Per this subtopic\'s theory, what state does Celery report for a task_id it has no information about — does it distinguish "this ID is corrupted/invalid" from "this is a valid ID for a task that just hasn\'t run yet"?',
    solution: 'The status-check endpoint would show {"state": "PENDING"} for a corrupted task_id row — exactly the same response it would show for a completely legitimate, real task that simply hasn\'t been picked up by a worker yet. Per this subtopic\'s theory, Celery\'s own documentation states plainly that "any task id that\'s not known is implied to be in the pending state" — there is no distinct error state, no exception, and no other signal that would differentiate a corrupted/invalid ID from a genuine one still waiting in the queue. This makes the underlying corruption bug significantly harder to notice: a user (or an automated monitor) polling that status endpoint sees "PENDING" and reasonably assumes the job just hasn\'t started yet, perhaps waiting patiently or retrying later — there is no error surfaced anywhere in this code path to point at the actual root cause (a corrupted task_id written by an unrelated bug). The job will simply stay "PENDING" forever, since a corrupted ID will never correspond to any real task a worker could pick up and transition to STARTED/SUCCESS/FAILURE. Diagnosing this requires looking OUTSIDE what AsyncResult itself can tell you — cross-referencing the task_id actually stored in the database against a separate, independently-maintained log of task_ids the application genuinely dispatched via .delay()/.apply_async() at submission time, since Celery\'s own API provides no "was this ever a real task" check to catch the corruption directly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If AsyncResult(some_task_id).state returns "PENDING", it reliably means a real task with that ID exists and is genuinely still waiting to be picked up by a worker.',
      reality: 'This subtopic\'s theory and first code example show PENDING is Celery\'s documented default for ANY task ID it has no information about — including one that was never a real task at all (a typo, corruption, a made-up string). A bogus ID and a genuine, queued task report the identical "PENDING" state, with no distinguishing signal.'
    },
    {
      thought: 'Enabling task_track_started=True is enough to reliably distinguish a real, valid task ID from an invalid/bogus one, since it adds more visibility into task state transitions.',
      reality: 'This subtopic\'s theory and second code example show task_track_started only adds a STARTED signal for tasks that a worker genuinely picks up and begins executing — a bogus task ID never reaches STARTED (there is no real task for any worker to start), so it stays stuck at PENDING regardless of this setting, exactly as it would without it.'
    },
    {
      thought: 'Celery provides a documented way to check whether a given task ID was ever actually submitted/dispatched, separate from checking its current execution state.',
      reality: 'This subtopic\'s theory shows Celery has no such built-in check — AsyncResult.successful()/.failed() only confirm genuine SUCCESS/FAILURE and return False equally for a bogus ID and an unfinished real one. The only reliable mitigation the docs\' own recommended pattern implies is application-level: independently recording every task ID actually dispatched, so its existence can be verified against that separate record rather than asked of Celery directly.'
    }
  ];
}
