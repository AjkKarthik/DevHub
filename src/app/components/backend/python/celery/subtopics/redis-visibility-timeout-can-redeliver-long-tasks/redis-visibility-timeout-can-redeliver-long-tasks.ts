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
  templateUrl: './redis-visibility-timeout-can-redeliver-long-tasks.html',
  styleUrl: './redis-visibility-timeout-can-redeliver-long-tasks.scss'
})
export class RedisVisibilityTimeoutCanRedeliverLongTasksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'acks_late is safer against lost work — but it introduces its own redelivery clock',
      points: [
        'The main page\'s own theory covers task_acks_late as trading "at-most-once" for "at-least-once" delivery — a crashed worker causes the broker to redeliver the task rather than silently losing it. What it does not mention is that with the Redis transport specifically, this redelivery is governed by its own separate timer, independent of whether the worker actually crashed at all: visibility_timeout.',
        'Celery\'s own Redis broker docs state the default directly: the Redis transport\'s visibility timeout defaults to 1 hour, configured via broker_transport_options = {"visibility_timeout": N} (in seconds). The mechanism itself is documented plainly: "The visibility timeout defines the number of seconds to wait for the worker to acknowledge the task before the message is redelivered to another worker."',
        'The word "acknowledge" is the key — with acks_late=True, acknowledgment only happens once the task genuinely finishes. If a task is still legitimately running (not crashed, just slow) when the visibility_timeout clock runs out, Redis has no way to know the difference between "the worker died" and "the worker is just still working" — it assumes the former and redelivers the SAME task to a different worker.',
      ]
    },
    {
      heading: 'The documented failure mode: a long-running task can execute in a loop, again and again',
      points: [
        'Celery\'s own docs contain an explicit warning about exactly this scenario: "If a task isn\'t acknowledged within the Visibility Timeout the task will be redelivered to another worker and executed. This causes problems with ETA/countdown/retry tasks where the time to execute exceeds the visibility timeout; in fact if that happens it will be executed again, and again in a loop." This is not a rare edge case — it is a directly documented, expected consequence of the default 1-hour timeout combined with any task whose actual execution time approaches or exceeds it.',
        'The redelivered copy does not wait for the first copy to finish or fail first — it runs concurrently, on a genuinely different worker, while the original is still executing. For a non-idempotent task (the main page\'s own idempotency section covers exactly this risk from a different angle — crash-triggered redelivery), this produces the same double-execution danger, except triggered purely by task duration rather than by any actual worker failure at all.',
        'Celery\'s own documented guidance on the fix is deliberately hedged, not a blanket "just raise the number": you can increase visibility_timeout to comfortably exceed your longest task\'s expected runtime, but the docs explicitly caution "this is not recommended as it may have negative impact on reliability" — since a genuinely crashed worker\'s task now waits that much longer before being picked up by someone else. For workloads with genuinely long-running work, the better-documented direction is redesigning around shorter, checkpointed tasks (or a different persistence strategy for long jobs) rather than simply widening the visibility window indefinitely.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A task longer than the default visibility_timeout gets redelivered mid-run',
      language: 'typescript',
      code: `from celery import Celery

app = Celery("myapp", broker="redis://localhost:6379/0",
             backend="redis://localhost:6379/1")

app.conf.task_acks_late = True   # acknowledge only after completion —
                                    # safer against lost work on crash,
                                    # but now subject to visibility_timeout

# broker_transport_options NOT set here — Redis transport's default
# visibility_timeout applies: 3600 seconds (1 hour)

@app.task(bind=True, acks_late=True)
def generate_annual_report(self, org_id: int) -> dict:
    # A genuinely long-running task — say this realistically takes
    # 75 minutes for a large organization's full annual report.
    heavy_report_computation(org_id)   # ~75 minutes of real work
    return {"org_id": org_id, "status": "complete"}

# At t=0:   Worker A picks up the task, starts executing.
# At t=60m: Redis's visibility_timeout (default 1 hour) expires.
#           The task was NEVER acknowledged (acks_late means ack only
#           happens on completion) — Redis assumes Worker A died and
#           redelivers the SAME task to Worker B.
# At t=60m: Worker B ALSO starts executing generate_annual_report(org_id)
#           — concurrently with Worker A, which is still running fine.
# At t=75m: Worker A finishes, generates the report, acknowledges.
# At t=135m: Worker B ALSO finishes — generating and (depending on the
#            task's own idempotency) potentially duplicating the SAME
#            annual report a second time, purely because the task took
#            longer than the default visibility window, not because
#            anything actually crashed.`,
    },
    {
      label: 'The documented (hedged) fix: raise visibility_timeout past the longest task',
      language: 'typescript',
      code: `from celery import Celery

app = Celery("myapp", broker="redis://localhost:6379/0",
             backend="redis://localhost:6379/1")

app.conf.task_acks_late = True

# Explicitly raise visibility_timeout comfortably past the longest
# realistic task runtime in this application — per Celery's own docs,
# this is a legitimate documented option, but with an explicit caveat:
# a genuinely crashed worker's task now waits this ENTIRE window
# before Redis considers it lost and redelivers it to someone else.
app.conf.broker_transport_options = {
    "visibility_timeout": 7200,   # 2 hours — comfortably longer than
                                    # the ~75-minute annual report task
}

@app.task(bind=True, acks_late=True)
def generate_annual_report(self, org_id: int) -> dict:
    heavy_report_computation(org_id)
    return {"org_id": org_id, "status": "complete"}

# Now a 75-minute task finishes well before the 2-hour visibility
# window expires — no spurious redelivery. But Celery's own docs
# caution this trade-off explicitly: "not recommended as it may have
# negative impact on reliability" — a worker that GENUINELY crashes
# 5 minutes into this same task now leaves it stuck, unpicked-up by
# any other worker, for up to 2 full hours before redelivery finally
# happens, instead of the shorter wait a lower timeout would allow.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables task_acks_late=True across their whole Celery app specifically to protect against losing work if a worker crashes mid-task, matching the main page\'s own guidance. Most tasks are quick (under a minute), but one task — a video transcoding job — occasionally takes over 90 minutes for very large files. A few weeks after deploying, they notice the transcoding job sometimes runs TWICE for the same video, producing duplicate output files, even though no worker crash appears in any logs. Explain why, using what this subtopic covers, and describe the fix that addresses this specific task without weakening acks_late protection for every other (short) task.',
    hint: 'Per this subtopic\'s theory, does Redis\'s visibility_timeout distinguish "the worker genuinely crashed" from "the task is just still legitimately running, past the default window"? Does the redelivery in that case require ANY actual worker failure to have happened?',
    solution: 'The video transcoding job runs twice because its occasional 90-minute runtime exceeds the Redis transport\'s default visibility_timeout of 1 hour (3600 seconds), and per this subtopic\'s theory, Redis has no way to distinguish "the worker genuinely crashed" from "the task is simply still legitimately executing, past the visibility window" — it treats both identically and redelivers the task to another worker once the timeout expires, regardless of whether anything actually failed. Since task_acks_late=True means acknowledgment only happens on completion, a still-running 90-minute task has never been acknowledged by the time the 1-hour window closes, so Redis assumes the original worker died and dispatches the SAME task again — producing a second, fully concurrent execution that generates a duplicate output file, exactly matching Celery\'s own documented warning about tasks whose execution time exceeds visibility_timeout running "again, and again in a loop." No crash ever needs to occur for this to happen, which is exactly why the team found nothing in their crash logs. The fix that addresses only this specific task without weakening acks_late protection everywhere else is to route the long-running transcoding task to a dedicated queue with its own broker_transport_options-configured visibility_timeout raised comfortably past its worst-case runtime (e.g. 3 hours), while leaving the default (or a much shorter) visibility_timeout in place for the queue(s) handling the app\'s many quick, sub-minute tasks — those short tasks benefit from a SHORTER visibility window (a genuinely crashed worker\'s quick task gets picked up again sooner), so uniformly raising the timeout app-wide to accommodate the one slow task would unnecessarily weaken crash-recovery speed for everything else.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'task_acks_late=True is a complete, self-contained protection against a task being lost or duplicated — once enabled, the only way a task runs more than once is if a worker genuinely crashes mid-task.',
      reality: 'This subtopic\'s theory and first code example show the Redis transport\'s own visibility_timeout introduces a SEPARATE trigger for redelivery — a task that simply runs longer than the timeout (default 1 hour) gets redelivered to another worker and runs concurrently, even when the original worker never crashed and is still executing perfectly normally.'
    },
    {
      thought: 'If duplicate task execution is observed with acks_late=True enabled, it must mean a worker crash occurred somewhere, even if nothing shows up in the crash logs, since acks_late is specifically designed around crash recovery.',
      reality: 'This subtopic\'s theory and exercise show duplicate execution can happen with zero actual worker failures — Celery\'s own documented visibility_timeout mechanism redelivers a task purely based on elapsed time since dispatch without acknowledgment, which is exactly why a legitimately long-running (but perfectly healthy) task can trigger the same symptom as a genuine crash, with nothing appearing in crash logs because nothing actually crashed.'
    },
    {
      thought: 'The safe fix for a visibility_timeout-caused duplicate execution is to raise visibility_timeout as high as reasonably possible across the whole application, since higher is strictly safer.',
      reality: 'This subtopic\'s theory and second code example show Celery\'s own docs explicitly hedge this recommendation — raising visibility_timeout is a real, documented option, but a higher timeout also means a GENUINELY crashed worker\'s task waits that much longer before being redelivered to a healthy worker, trading duplicate-execution risk for slower crash recovery. The better-scoped fix is a per-queue timeout matched to that queue\'s own realistic task durations, not a single blanket increase for the whole application.'
    }
  ];
}
