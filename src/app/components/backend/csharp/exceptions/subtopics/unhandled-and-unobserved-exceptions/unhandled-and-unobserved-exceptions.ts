import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-unhandled-and-unobserved-exceptions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './unhandled-and-unobserved-exceptions.html',
  styleUrl: './unhandled-and-unobserved-exceptions.scss',
})
export class AppDomainUnhandledExceptionAndTaskSchedulerUnobservedTaskExceptionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page never covers what happens when NOTHING catches',
      points: [
        'The main Exceptions page covers try/catch/finally, filters, custom exceptions, and <code>AggregateException</code> extensively — but every example assumes some catch block exists. It never addresses the two genuinely different "last line of defense" mechanisms for exceptions that escape ALL of your own catch blocks: synchronous unhandled exceptions, and exceptions from fire-and-forget async work nobody ever awaited.',
      ],
    },
    {
      heading: 'AppDomain.UnhandledException — the synchronous last resort',
      points: [
        '<code>AppDomain.CurrentDomain.UnhandledException</code> fires when an exception propagates all the way out of every catch block on the thread and is about to crash the process. It is a NOTIFICATION only — by the time this event fires, the exception is already fatal and the process WILL terminate; the handler cannot prevent the crash, it can only log/flush state before the process dies.',
        'This is fundamentally different from a global exception-handling MIDDLEWARE (e.g. ASP.NET Core\'s exception handling pipeline) — middleware runs INSIDE the request pipeline and can genuinely recover and return a response; <code>AppDomain.UnhandledException</code> runs only after everything else has already failed to catch, and the application is going down regardless.',
      ],
    },
    {
      heading: 'TaskScheduler.UnobservedTaskException — a completely different failure mode',
      points: [
        'A "fire-and-forget" <code>Task</code> (one started but never <code>await</code>ed, and whose result/exception is never inspected) that throws does NOT crash the process the way a synchronous unhandled exception does. Historically (pre-.NET 4.5), an unobserved faulted task\'s exception was rethrown on the FINALIZER thread when the <code>Task</code> object was garbage collected — potentially crashing the process much later, and confusingly, than where the real bug was.',
        'Since .NET 4.5, an unobserved task exception no longer crashes the process by default — instead, <code>TaskScheduler.UnobservedTaskException</code> fires (on the finalizer thread, when the faulted <code>Task</code> is collected) and the exception is silently swallowed unless you subscribe to this event. This means a fire-and-forget task that throws can fail COMPLETELY SILENTLY, with no log, no crash, nothing — unless this specific event handler is wired up.',
        'The main page\'s <code>Task.WhenAll</code> guidance (inspect <code>task.Exception!.InnerExceptions</code>) only helps when you deliberately hold a reference to the <code>Task</code> and check it — it says nothing about async work that was started and never tracked at all, which is exactly the gap <code>UnobservedTaskException</code> exists to catch.',
      ],
    },
    {
      heading: 'Both are diagnostic nets, not substitutes for real handling',
      points: [
        'Neither <code>AppDomain.UnhandledException</code> nor <code>TaskScheduler.UnobservedTaskException</code> should be treated as a normal error-handling mechanism — they exist purely so a genuinely unexpected failure gets LOGGED somewhere before it is lost (process crash) or silently swallowed (unobserved task). The correct fix for both is almost always upstream: catch and handle exceptions where they are thrown, and never fire-and-forget a <code>Task</code> without at minimum attaching a <code>.ContinueWith</code> or logging wrapper.',
        'Wiring both handlers at application startup is a genuinely valuable, low-cost defensive habit — it turns "the app silently died with no trace" or "some background task failed and nobody will ever know" into an actual log entry, even if it cannot fix the underlying bug.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AppDomain.UnhandledException — a notification, not a catch',
      language: 'csharp',
      code: `// Wire this once, near application startup:
AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
{
    var ex = (Exception)e.ExceptionObject;
    Console.Error.WriteLine($"FATAL: {ex}");
    // e.IsTerminating is almost always true here — the process is
    // going down regardless of what this handler does. This is your
    // LAST CHANCE to flush logs/telemetry before the crash, not a
    // recovery mechanism.
};

// Somewhere deep in the call stack, with NO surrounding try/catch:
void ProcessCriticalWork()
{
    throw new InvalidOperationException("Unrecoverable state corruption");
}

// Calling this with nothing catching it anywhere up the call stack:
ProcessCriticalWork();
// Prints via the handler above, THEN the process terminates — the
// handler observed the crash, it did not prevent it.`,
    },
    {
      label: 'A fire-and-forget task that fails completely silently',
      language: 'csharp',
      code: `// A "fire-and-forget" call — started but never awaited, never assigned
// to a variable, never checked:
void StartBackgroundWork()
{
    _ = ProcessInBackgroundAsync(); // fire-and-forget — the returned
    // Task is discarded with "_ =" (or worse, not even assigned at all)
}

async Task ProcessInBackgroundAsync()
{
    await Task.Delay(100);
    throw new InvalidOperationException("Background work failed");
    // Nothing awaits this method's Task — this exception is NEVER seen
    // by any catch block, ever. The application keeps running as if
    // nothing happened. No crash. No log. Silence.
}

StartBackgroundWork();
Console.WriteLine("Application continues normally...");
// This line runs — the failure above is completely invisible unless
// TaskScheduler.UnobservedTaskException is wired up (next example) AND
// the faulted Task object happens to get garbage collected.`,
    },
    {
      label: 'TaskScheduler.UnobservedTaskException — the only way to see it',
      language: 'csharp',
      code: `// Wire this once, near application startup, alongside AppDomain.UnhandledException:
TaskScheduler.UnobservedTaskException += (sender, e) =>
{
    Console.Error.WriteLine($"UNOBSERVED TASK EXCEPTION: {e.Exception}");
    e.SetObserved(); // marks it as handled — prevents (legacy) finalizer
                      // thread crash behavior on older runtimes
};

void StartBackgroundWork()
{
    _ = ProcessInBackgroundAsync(); // same fire-and-forget call as before
}

async Task ProcessInBackgroundAsync()
{
    await Task.Delay(100);
    throw new InvalidOperationException("Background work failed");
}

StartBackgroundWork();
GC.Collect();               // forces the faulted, unreferenced Task to be
GC.WaitForPendingFinalizers(); // collected NOW, for demonstration purposes —
// in a real app this happens whenever the GC naturally collects the Task,
// which could be seconds or minutes after the actual failure occurred.

// Output (only because the handler above was registered):
//   UNOBSERVED TASK EXCEPTION: System.InvalidOperationException: Background work failed
//
// WITHOUT the handler registered: nothing prints, ever. The failure is
// gone. This is exactly why fire-and-forget async work should always be
// tracked (logged inside a catch, or via a continuation) rather than
// relying on this event as a safety net.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "We don\'t need to wire up TaskScheduler.UnobservedTaskException — if a background task fails, AppDomain.UnhandledException will catch it anyway." Explain why this is wrong, using the distinction between the two mechanisms from the theory above.',
    hint: 'Think about WHERE each exception originates from and what thread it propagates on. AppDomain.UnhandledException only fires for exceptions that propagate synchronously out through a thread\'s own call stack — an unobserved Task exception never does that; it is captured inside the Task object itself and only resurfaces (if at all) via a completely separate event on the finalizer thread.',
    solution: `// AppDomain.UnhandledException fires for exceptions that propagate
// SYNCHRONOUSLY out through a thread's call stack, unhandled, crashing
// the process. An unobserved Task's exception never does this — it is
// captured and stored INSIDE the Task object when the async method
// faults, and simply sits there. Nothing propagates up any call stack
// at all, because nothing ever awaited or observed the Task.

// These are separate mechanisms watching separate failure paths:
//   AppDomain.UnhandledException        → synchronous, unhandled, thread-crashing exceptions
//   TaskScheduler.UnobservedTaskException → exceptions trapped inside a
//                                            faulted, never-observed Task,
//                                            surfaced later on the finalizer thread

// Proof: register ONLY AppDomain.UnhandledException (not the Task one)
// and rerun the fire-and-forget example — nothing prints. The exception
// from ProcessInBackgroundAsync never reaches AppDomain.UnhandledException
// because it never propagates out of any thread's call stack in the
// first place; it just sits inside the Task, silently, until GC'd.

AppDomain.CurrentDomain.UnhandledException += (s, e) =>
    Console.WriteLine("This will NOT catch the fire-and-forget failure below");

_ = FailingBackgroundWorkAsync(); // exception is trapped inside this Task
                                   // object — AppDomain.UnhandledException
                                   // never fires for it, proving the teammate wrong.

async Task FailingBackgroundWorkAsync()
{
    await Task.Delay(50);
    throw new InvalidOperationException("Silently trapped inside the Task");
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>AppDomain.UnhandledException</code> can prevent the process from crashing if you handle the exception inside it.',
      reality: 'by the time AppDomain.UnhandledException fires, the exception has already propagated out of every catch block on the thread and the process is going to terminate regardless — the handler can only log or flush state before the crash, not prevent it.',
    },
    {
      thought: 'a fire-and-forget async method that throws will eventually be caught by <code>AppDomain.UnhandledException</code>, the same as a synchronous unhandled exception.',
      reality: 'an unobserved Task\'s exception is captured inside the Task object itself and never propagates through any thread\'s call stack — it is invisible to AppDomain.UnhandledException entirely, and only surfaces (if at all) via the separate TaskScheduler.UnobservedTaskException event when the faulted Task is eventually garbage collected.',
    },
    {
      thought: 'since .NET 4.5 stopped crashing the process for unobserved task exceptions, those failures are effectively "safe" to ignore.',
      reality: 'the failures are not safe — they became SILENT instead of crash-worthy, which is arguably worse: without TaskScheduler.UnobservedTaskException explicitly wired up, a genuinely broken background operation can fail repeatedly with zero visibility, no log, and no crash to signal something is wrong.',
    },
  ];
}
