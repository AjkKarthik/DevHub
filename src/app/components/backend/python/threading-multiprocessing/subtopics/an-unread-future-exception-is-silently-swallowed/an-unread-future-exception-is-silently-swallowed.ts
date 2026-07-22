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
  templateUrl: './an-unread-future-exception-is-silently-swallowed.html',
  styleUrl: './an-unread-future-exception-is-silently-swallowed.scss'
})
export class AnUnreadFutureExceptionIsSilentlySwallowedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An exception inside a submitted task has no documented way to surface unless .result() is actually called',
      points: [
        'The main page\'s own examples always eventually call future.result() — either directly, or through as_completed() followed by future.result() inside a try/except. This is presented as the natural, obvious way to use a Future, which makes it easy to overlook that .result() isn\'t just how you GET the return value — it\'s also the only documented mechanism that makes an exception raised inside the task visible at all.',
        'Python\'s own concurrent.futures documentation is precise about the mechanism: Future.result() states "if the call raised an exception, this method will raise the same exception," and Future.exception() "return[s] the exception raised by the call." An exception raised inside a submitted callable is stored on the Future object — it does not propagate anywhere on its own, does not print to stderr, and does not crash anything, until code explicitly asks the Future for it via one of these two methods.',
        'This means a submit()-based pattern that fires off tasks and never checks their results at all — for example, submitting work purely for a side effect (writing to a database, sending a notification) with no code ever calling .result() on the returned Future — has NO documented way for a failure inside that task to become visible anywhere. The task silently fails; nothing about the program\'s behavior indicates anything went wrong.',
      ]
    },
    {
      heading: 'Why this is easy to miss and how to guard against it',
      points: [
        'The main page\'s own "submit + as_completed" pattern is actually already doing the right thing by wrapping future.result() in a try/except inside the loop — this subtopic isn\'t correcting that example, it\'s naming the underlying reason that specific pattern matters: skipping the .result() call (or the equivalent .exception() check) entirely is what turns a failing task into a completely silent one.',
        'The safest default for any submitted task whose outcome matters — even purely for its side effects, with no return value actually needed — is calling .result() (or .exception()) on every Future that gets created, specifically to force any stored exception to surface, rather than assuming "I don\'t need the return value" also means "I don\'t need to know if it failed."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A failing task with no result() call — completely silent',
      language: 'typescript',
      code: `from concurrent.futures import ThreadPoolExecutor

def send_notification(user_id: int) -> None:
    if user_id == 3:
        raise ValueError(f"invalid user_id: {user_id}")
    print(f"notified user {user_id}")

with ThreadPoolExecutor(max_workers=4) as ex:
    for user_id in range(5):
        ex.submit(send_notification, user_id)   # return value discarded —
                                                    # .result() is NEVER called
    # The pool's own context manager waits for every task to finish
    # before exiting the 'with' block — but nothing here ever asks
    # any Future for its result or exception.

print("all done")
# Output: only 4 "notified user X" lines print (user_id=3 silently
# failed) — "all done" prints normally, with ZERO indication
# anywhere that send_notification(3) ever raised an exception.`,
    },
    {
      label: 'The fix — always call .result() or .exception(), even for side-effect-only tasks',
      language: 'typescript',
      code: `from concurrent.futures import ThreadPoolExecutor

def send_notification(user_id: int) -> None:
    if user_id == 3:
        raise ValueError(f"invalid user_id: {user_id}")
    print(f"notified user {user_id}")

with ThreadPoolExecutor(max_workers=4) as ex:
    futures = [ex.submit(send_notification, uid) for uid in range(5)]
    for future in futures:
        exc = future.exception()   # forces the stored exception to
                                     # surface, without needing the
                                     # (unused) return value at all
        if exc is not None:
            print(f"task failed: {exc}")

print("all done")
# Output now includes: "task failed: invalid user_id: 3"
# — the failure is genuinely visible, even though the caller never
# needed send_notification's return value (it has none) and never
# called .result() directly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A batch job submits 10,000 image-processing tasks to a ThreadPoolExecutor, purely for their side effect of writing processed images to disk — the code never stores or checks any of the returned Future objects. After a production run, a monitoring dashboard shows only 9,850 processed images were written, but the job itself completed with no errors, no crash, and no log output indicating anything went wrong. Explain the likely cause, using what this subtopic covers.',
    hint: 'Since none of the 10,000 submitted tasks\' Future objects are ever stored or checked, is there any documented way for an exception raised inside one of those 150 "missing" tasks to become visible anywhere — in a log, on the console, or via a crash?',
    solution: 'The 150 missing images are very likely explained by exceptions raised inside those specific tasks that were never surfaced anywhere, because the code never stored or checked any of the submitted tasks\' Future objects. Per Python\'s own concurrent.futures documentation, an exception raised inside a submitted callable is stored on its Future and only becomes visible via future.result() (which re-raises it) or future.exception() (which returns it) — with no documented mechanism for it to appear anywhere else, such as a default log line or console output, when neither method is ever called. Since this batch job discards every Future immediately after submit() without ever calling either method, any of the 10,000 tasks that happened to raise an exception (a corrupted image file, an unexpected format, a disk write failure) failed completely silently — the job\'s own control flow has no way of knowing, so it correctly reports "completed with no errors" from its own perspective, even though 150 tasks genuinely did not succeed. The fix is storing every Future returned by submit() and explicitly checking each one afterward — even though the job doesn\'t need any RETURN value, calling future.exception() on each one (or future.result() inside a try/except) is the only documented way to force any hidden failures to actually surface, whether that means logging them, retrying them, or simply making the discrepancy between "10,000 submitted" and "9,850 succeeded" visible at the moment it happens rather than only via an external monitoring dashboard afterward.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a function submitted to a ThreadPoolExecutor or ProcessPoolExecutor raises an exception, Python will print it to the console or log it somewhere automatically, the same way an unhandled exception in ordinary synchronous code would.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation confirms an exception raised inside a submitted callable is only stored on its Future object, with no documented automatic logging or console output; it becomes visible only if code explicitly calls .result() or .exception() on that specific Future.'
    },
    {
      thought: 'Calling future.result() is only necessary when the code actually needs the task\'s return value — for tasks submitted purely for their side effects (writing a file, sending a notification), it is safe to discard the Future entirely without checking it.',
      reality: 'This subtopic\'s second code example shows the opposite — .result() (or .exception()) is the only documented way to surface a failure inside the task, completely independent of whether the return value itself is needed; discarding the Future means discarding the only channel through which that task\'s failure could ever become visible.'
    },
    {
      thought: 'A batch job or script that completes without crashing, printing any errors, or logging anything unusual can be trusted to have genuinely completed every submitted task successfully.',
      reality: 'This subtopic\'s exercise shows this assumption can be false in a very specific, easy-to-miss way — a program using submit() without ever checking the resulting Futures can have individual tasks fail completely silently, with the overall program still reporting normal, error-free completion.'
    }
  ];
}
