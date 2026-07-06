import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-startasync-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './startasync-returns-before-executeasync-actually-completes.html',
  styleUrl: './startasync-returns-before-executeasync-actually-completes.scss',
})
export class StartasyncReturnsBeforeExecuteasyncActuallyCompletesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states two facts that are actually the SAME mechanism, without connecting them: "the host calls StartAsync for all hosted services sequentially" and "avoid starting heavy work in StartAsync — instead, do initialization in ExecuteAsync". The reason the second recommendation WORKS is a specific, precise detail about how BackgroundService\'s own (non-overridable) StartAsync implementation behaves',
      points: [
        '<code>BackgroundService</code>\'s inherited <code>StartAsync(CancellationToken)</code> — the one the host actually calls — invokes your <code>ExecuteAsync(stoppingToken)</code> override, stores the returned <code>Task</code>, and then checks whether that task is ALREADY completed. If <code>ExecuteAsync</code> has not yet reached an <code>await</code> point that yields control (i.e., it is still running synchronously, or has hit its first genuine asynchronous wait), <code>StartAsync</code> returns immediately — it does <strong>not</strong> wait for <code>ExecuteAsync</code> to finish running.',
        'This is precisely why heavy ASYNCHRONOUS initialization at the top of <code>ExecuteAsync</code> does not block host startup: the moment your initialization code hits its first genuine <code>await</code> on an incomplete operation (a real database call, an HTTP request, <code>Task.Delay</code>), control yields back to <code>StartAsync</code>, which returns to the host, which proceeds to call the NEXT hosted service\'s <code>StartAsync</code> — all while your worker\'s initialization keeps running on its own Task in the background.',
      ],
    },
    {
      heading: 'The precise boundary this creates: SYNCHRONOUS work at the top of ExecuteAsync (before the first real await) DOES block host startup, exactly like code in StartAsync would — only the ASYNCHRONOUS portion benefits from the "runs in the background" behavior',
      points: [
        'If <code>ExecuteAsync</code>\'s first several lines are synchronous (a tight CPU-bound loop, a blocking <code>.Result</code>/<code>.Wait()</code> call, or an <code>await</code> on a <code>Task</code> that happens to already be completed, such as an in-memory cache lookup with no real asynchrony), that code runs to completion INSIDE the call to <code>StartAsync</code>, on the SAME call stack, before the returned Task is checked for completion — meaning it behaves exactly like code placed directly in <code>StartAsync</code> itself, blocking the host from proceeding to the next service\'s startup.',
        'This means the main page\'s advice ("move initialization to <code>ExecuteAsync</code>") only delivers the promised benefit if that initialization is GENUINELY asynchronous and actually awaits something that has not already completed — synchronous or already-completed-task work at the top of <code>ExecuteAsync</code> gets none of the "runs in the background, doesn\'t block startup" advantage the recommendation implies, because it never reaches a real yield point before <code>StartAsync</code> inspects the task\'s completion state.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The behavior, demonstrated — a genuine await yields control back to the host immediately',
      language: 'csharp',
      code: `public class SlowInitWorker(ILogger<SlowInitWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Starting heavy initialization...");

        // A GENUINE asynchronous wait — this is the first real yield point.
        // The moment this line is reached, control returns to
        // BackgroundService.StartAsync(), which returns to the host,
        // which proceeds to the NEXT hosted service's StartAsync —
        // all BEFORE this delay actually finishes:
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        logger.LogInformation("Heavy initialization complete.");

        while (!stoppingToken.IsCancellationRequested)
        {
            // ... normal worker loop ...
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}

// Timeline observed at real app startup, with THIS worker registered
// FIRST among several hosted services:
//   t=0.00s   Host calls SlowInitWorker.StartAsync() (inherited impl)
//             → calls ExecuteAsync() → hits "await Task.Delay(10s)"
//             → StartAsync returns IMMEDIATELY (task not yet complete)
//   t=0.01s   Host calls the NEXT hosted service's StartAsync — does
//             NOT wait for the 10-second delay above
//   t=0.05s   Host finishes calling StartAsync for ALL services;
//             app.Run() begins accepting HTTP requests — the app is
//             LIVE while SlowInitWorker is still mid-delay
//   t=10.0s   SlowInitWorker's delay completes; "Heavy initialization
//             complete" is logged; the worker's main loop begins`,
    },
    {
      label: 'The trap — synchronous work at the top DOES block, despite living in ExecuteAsync',
      language: 'csharp',
      code: `public class SynchronousTrapWorker(AppStartupCache cache) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Looks like it follows the main page's advice — "initialization
        // in ExecuteAsync, not StartAsync." But this call is SYNCHRONOUS
        // (blocking .Result on a Task, or a genuinely CPU-bound loop):
        var categories = cache.LoadCategoriesSync();   // blocks the THREAD
        // No 'await' reached yet — this runs INLINE, on the same call
        // stack as StartAsync, before StartAsync ever gets a chance to
        // return. If LoadCategoriesSync() takes 5 seconds, host startup
        // is blocked for those 5 seconds — EXACTLY as if this code were
        // written directly inside StartAsync() itself.

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}

// THE FIX — make the initialization genuinely asynchronous, so it
// actually yields control at its first await:
public class FixedWorker(AppStartupCache cache) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // A real async call — hits a genuine await point, StartAsync
        // returns to the host immediately, host startup proceeds:
        var categories = await cache.LoadCategoriesAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
// The ONLY difference is Sync vs Async — but it determines whether
// this code behaves like StartAsync (blocking) or like the
// background-worker pattern the main page recommends (non-blocking).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A worker\'s ExecuteAsync starts with await Task.FromResult(42) (an already-completed Task, wrapped in an await) before doing any real work. Does this specific line yield control back to the host the way await Task.Delay(...) does, or does it behave like the synchronous trap? Explain precisely why, using the actual mechanic BackgroundService.StartAsync depends on.',
    hint: 'BackgroundService.StartAsync checks whether the Task returned by ExecuteAsync IS ALREADY COMPLETE before deciding whether to wait for it. Does awaiting an ALREADY-COMPLETED Task (like Task.FromResult(42)) cause the compiler-generated state machine to actually suspend and yield the calling thread, or does it just continue synchronously since there\'s nothing to wait for?',
    solution: `await Task.FromResult(42) behaves like the SYNCHRONOUS TRAP, not
like a genuine yield point — this is a precise and easy-to-miss
consequence of how async/await actually works at the compiler level,
not just a BackgroundService-specific quirk.

When you await a Task that is ALREADY completed by the time the await
expression is reached, the compiler-generated state machine detects
this (via the awaiter's IsCompleted property) and continues execution
SYNCHRONOUSLY, on the same thread, without actually suspending the
method or returning control to the caller. Task.FromResult(42)
constructs an already-completed Task — there is nothing to
asynchronously wait for, so the await is effectively a no-op from a
control-flow perspective; execution falls straight through to the next
line, still within the SAME synchronous call that invoked ExecuteAsync
in the first place.

This means from BackgroundService.StartAsync's perspective, the
ExecuteAsync Task has not "hit a real yield point" by the time this
line finishes — if EVERY await in your initialization code happens to
be on already-completed Tasks (a common accidental pattern when mixing
sync and async code, e.g. wrapping a synchronous cache lookup in
Task.FromResult "to satisfy an async interface"), the ENTIRE
initialization block runs inline, on the host's own call stack, before
StartAsync gets a chance to return — identical in effect to the
SynchronousTrapWorker example, DESPITE the code superficially looking
"async" with await keywords sprinkled throughout.

The precise, generalizable rule: it is not "using async/await" that
gets you the non-blocking startup benefit — it is awaiting a Task that
is GENUINELY still pending (a real I/O operation, a real Task.Delay,
anything actually asynchronous under the hood) at the moment the await
is reached. A codebase full of "async-flavored" wrappers around
synchronous or already-resolved work gets none of the benefit the main
page's advice promises, and the only way to know for certain is to
trace whether each awaited call can genuinely be pending at that point,
not just whether the syntax uses await.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'moving initialization code from StartAsync into the top of ExecuteAsync automatically means it runs in the background and does not block host startup, simply because it now lives in a different method.',
      reality: 'the benefit comes specifically from BackgroundService.StartAsync returning as soon as ExecuteAsync\'s Task hits a genuine, still-pending await — synchronous work, or await on an already-completed Task, runs inline on the same call stack as StartAsync and blocks host startup exactly as if it were written directly in StartAsync itself.',
    },
    {
      thought: 'any code written with the async/await syntax is automatically non-blocking with respect to the caller.',
      reality: 'awaiting a Task that is already completed by the time the await is reached continues synchronously at the compiler level — the calling method never actually yields control, regardless of how the code is styled; only awaiting a genuinely still-pending operation causes a real yield.',
    },
    {
      thought: 'the host calling StartAsync "sequentially in registration order" for all hosted services means each worker\'s FULL initialization and setup logic completes before the next service\'s StartAsync is even invoked.',
      reality: 'for a BackgroundService, StartAsync only waits for ExecuteAsync to reach its first genuine yield point — everything after that point (including lengthy async initialization) runs concurrently with the NEXT service\'s StartAsync call and the rest of host startup, not sequentially after it.',
    },
  ];
}
