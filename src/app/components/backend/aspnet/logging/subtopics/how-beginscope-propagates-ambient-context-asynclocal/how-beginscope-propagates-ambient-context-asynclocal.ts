import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-beginscope-asynclocal-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-beginscope-propagates-ambient-context-asynclocal.html',
  styleUrl: './how-beginscope-propagates-ambient-context-asynclocal.scss',
})
export class HowBeginscopePropagatesAmbientContextAsynclocalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "the scope travels with the async context automatically" as a fact — the mechanism is .NET\'s AsyncLocal<T>, riding on ExecutionContext',
      points: [
        'The main Logging page\'s "Log scopes" section says <code>BeginScope(...)</code> properties are visible to "calls inside injected services called from within that block, even if those services use a different <code>ILogger&lt;T&gt;</code> category," and that "the scope travels with the async context automatically." What actually makes this true: the built-in logging infrastructure maintains its scope stack in an <code>AsyncLocal&lt;Stack&lt;object&gt;&gt;</code>-like structure (specifically the internal <code>LoggerExternalScopeProvider</code>). <code>AsyncLocal&lt;T&gt;</code> values are captured into the current thread\'s <code>ExecutionContext</code>, and the .NET runtime automatically flows that <code>ExecutionContext</code> across every <code>await</code> continuation and into every <code>Task</code> created via <code>Task.Run</code> or the thread pool — which is WHY a scope opened in middleware is still visible deep inside an awaited service call three layers down, with zero explicit parameter passing.',
      ],
    },
    {
      heading: 'ExecutionContext flows into a child Task by default — but a "fire-and-forget" Task that outlives its parent\'s scope reads a STALE snapshot, not a live reference',
      points: [
        '<code>AsyncLocal&lt;T&gt;</code> propagation is a COPY, not a shared reference: when a child <code>Task</code> or <code>await</code> continuation starts, it captures the CURRENT VALUE of the ambient scope stack at that moment. If code inside a <code>using (logger.BeginScope(...))</code> block starts a background <code>Task.Run(...)</code> WITHOUT awaiting it (a genuine "fire-and-forget"), and the outer <code>using</code> block exits (disposing the scope) BEFORE that detached task finishes logging, the detached task still sees the scope properties that were active at the moment it was STARTED — because it captured its own copy of the <code>ExecutionContext</code> at creation time. This means the "stale" read is actually more subtle than a simple lost-reference bug: the fire-and-forget task keeps logging with the OLD scope value it captured, even after that scope has technically been "disposed" from the perspective of the code that opened it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own middleware scope — why it reaches every awaited service call',
      language: 'csharp',
      code: `app.Use(async (context, next) =>
{
    using var scope = _logger.BeginScope(new Dictionary<string, object>
    {
        ["CorrelationId"] = context.TraceIdentifier,
    });

    // 'await next(context)' resumes on a continuation that captured THIS
    // ExecutionContext, which carries the AsyncLocal scope stack. Every
    // service resolved and awaited inside 'next' — no matter how many
    // layers deep, no matter which ILogger<T> category it uses — reads
    // the SAME ambient scope stack, because ExecutionContext flows
    // automatically across every await continuation by default:
    await next(context);

}); // scope disposed HERE — pops CorrelationId off the ambient stack
    // for any code that runs AFTER this point on this logical call chain`,
    },
    {
      label: 'The fire-and-forget trap — a detached Task keeps a STALE copy of the scope, even after it is "disposed"',
      language: 'csharp',
      code: `public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public async Task<Order> CreateAsync(CreateOrderRequest req)
    {
        Order order;
        using (_logger.BeginScope("Order {OrderId}", req.TempId))
        {
            order = await ProcessOrderAsync(req);

            // BUG: fire-and-forget — NOT awaited. This captures a COPY of
            // the CURRENT ExecutionContext (including the "Order {OrderId}"
            // scope) at the moment Task.Run is called:
            _ = Task.Run(() => SendConfirmationEmailAsync(order));

        } // scope disposed HERE — the 'using' block exits and pops the
          // scope off THIS logical call's ambient stack

        return order;
    }

    private async Task SendConfirmationEmailAsync(Order order)
    {
        await Task.Delay(500);   // simulates a slow email provider

        // SURPRISE: this log entry STILL carries the "Order {OrderId}"
        // scope property — even though the 'using' block that created it
        // has ALREADY been disposed by the time this line runs (the outer
        // method returned well before this 500ms delay completed). This is
        // not a bug in the sense of "scope leaked forever" — it is a
        // STALE SNAPSHOT: the detached task captured its own private copy
        // of the ambient scope stack at the exact moment Task.Run() was
        // called, and that copy is now completely disconnected from the
        // parent method's lifecycle:
        _logger.LogInformation("Confirmation email sent");
    }
}

// THE PRACTICAL CONSEQUENCE: if the SAME OrderId value gets reused for a
// LATER, UNRELATED order further down the same request pipeline (unlikely
// but illustrates the mechanism), the detached email task's log entry
// would still show the ORIGINAL captured OrderId — not because of a race
// condition on shared mutable state, but because ExecutionContext capture
// happens ONCE, at Task.Run() time, and is never refreshed afterward.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the fire-and-forget <code>Task.Run(() =&gt; SendConfirmationEmailAsync(order))</code> call captures a snapshot of the ambient scope at creation time, propose a fix that ensures the email-sending log entries do NOT carry an <code>OrderId</code> scope property that has already gone out of its logical lifetime.',
    hint: 'Consider that the actual bug here is not really about AsyncLocal semantics being "wrong" — it is about fire-and-forget itself being an anti-pattern for anything that needs correct completion tracking or clean lifecycle boundaries. What would change if the email send were awaited, or handled by a dedicated background queue instead?',
    solution: `The cleanest fix is to stop using bare fire-and-forget entirely — either:

1. AWAIT the email send within the same scope (if latency allows):

using (_logger.BeginScope("Order {OrderId}", req.TempId))
{
    order = await ProcessOrderAsync(req);
    await SendConfirmationEmailAsync(order);  // now correctly scoped,
                                                // and completes before
                                                // the 'using' block exits
}

2. Or, if the email send genuinely needs to run in the background
   independent of the request, hand it to a DEDICATED background queue
   (e.g. IBackgroundTaskQueue, Hangfire, or a channel-based worker) rather
   than a bare Task.Run — and have THAT worker open its OWN fresh scope
   using only the data it actually needs (e.g. the OrderId itself, passed
   as an explicit parameter, not captured ambiently):

_backgroundQueue.Enqueue(async () =>
{
    using var workerScope = _logger.BeginScope("Order {OrderId} (background email)", order.Id);
    await SendConfirmationEmailAsync(order);
});

Option 2 is the better general practice: rather than relying on whatever
ambient scope happened to be active at Task.Run() time (which is fragile
and easy to misread, as this subtopic shows), a background worker should
establish its OWN explicit scope from data passed to it directly. This
makes the logging correct AND makes the code's intent clearer — a
reader does not need to know anything about AsyncLocal capture semantics
to correctly predict what scope properties appear in the background
worker's logs.

The deeper lesson: fire-and-forget Task.Run() calls are risky specifically
BECAUSE they silently capture an ambient context snapshot that can outlive
its logical owner — this is a general argument against un-awaited
background work, not just a logging-specific quirk.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'logger.BeginScope(...) attaches properties to a shared, mutable, globally-visible object that every concurrent request reads and writes.',
      reality: 'the scope stack lives in an AsyncLocal<T>, which .NET automatically gives each logical call chain (and each Task) its OWN independent snapshot — concurrent requests never see each other\'s scope properties, because each one flows its own private copy of ExecutionContext.',
    },
    {
      thought: 'disposing a BeginScope() using block immediately makes its properties disappear from ANY code that might still reference them, everywhere.',
      reality: 'a fire-and-forget Task.Run() started inside that using block captured its OWN private snapshot of the scope at the moment it was created — disposing the outer scope has zero effect on that already-detached copy, which keeps logging with the old values for its own remaining lifetime.',
    },
    {
      thought: 'AsyncLocal<T> propagation requires explicitly passing a CancellationToken or similar context object through every method signature, the same way you would thread through a correlation ID manually.',
      reality: 'AsyncLocal<T> flows implicitly via ExecutionContext across every await continuation and Task.Run/thread-pool hop — no explicit parameter needs to be threaded through method signatures at all, which is exactly why BeginScope context reaches deeply nested awaited service calls with zero code changes to those services.',
    },
  ];
}
