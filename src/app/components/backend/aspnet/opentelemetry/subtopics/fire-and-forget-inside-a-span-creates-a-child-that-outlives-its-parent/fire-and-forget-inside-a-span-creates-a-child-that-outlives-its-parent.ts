import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-otel-fire-and-forget-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './fire-and-forget-inside-a-span-creates-a-child-that-outlives-its-parent.html',
  styleUrl: './fire-and-forget-inside-a-span-creates-a-child-that-outlives-its-parent.scss',
})
export class FireAndForgetInsideASpanCreatesAChildThatOutlivesItsParentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Starting Background Work Inside a using Activity Block Creates a Span That Can Outlive Its Own Parent',
      points: [
        'The main page\'s own "Custom Spans" example fully awaits CreateOrderAsync(req) INSIDE the using var activity block — a safe pattern where the parent span\'s lifetime cleanly contains all of its child work. A very natural extension a developer might make to this SAME method — sending a confirmation email "in the background" so the response returns faster — becomes dangerous the moment it\'s added as a fire-and-forget call still INSIDE the using block: the using block disposes (ends) the ProcessOrder span the moment ProcessAsync returns, but the fire-and-forget email task — and any child span IT starts — keeps running independently afterward, still carrying ProcessOrder\'s TraceId as its parent context.',
        'The result is a trace where a CHILD span\'s start time (and possibly its entire duration) falls AFTER its own PARENT span has already ended — most tracing backends render this as a visually confusing or flagged-as-anomalous trace, since the normal assumption (a parent\'s time range fully contains all its children) no longer holds.',
      ],
    },
    {
      heading: 'The Fix — Detach the Background Work From the Request\'s Trace Context, or Await It',
      points: [
        'If the background work genuinely must outlive the request (fire-and-forget is intentional), it should NOT inherit the request\'s Activity as its parent at all — start it with Activity.Current cleared so it becomes its own independent trace, rather than an orphaned-looking child of a request that has already finished.',
        'If the background work should instead be considered PART of processing this order (and its success or failure genuinely matters to whether ProcessOrder itself succeeded), the correct fix is the opposite: actually await it inside the using block, keeping the parent span\'s lifetime accurately reflecting the FULL scope of work it represents — exactly as the main page\'s own original example already does for CreateOrderAsync.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own safe pattern, reproduced',
      language: 'csharp',
      code: `// The main page's own example — fully safe: all child work is
// AWAITED inside the using block, so the parent's lifetime genuinely
// contains everything that happens under it.
using var activity = Telemetry.Source.StartActivity("ProcessOrder");
var order = await CreateOrderAsync(req);
activity?.SetTag("order.id", order.Id.ToString());
return order;`,
    },
    {
      label: 'The natural, dangerous extension',
      language: 'csharp',
      code: `using var activity = Telemetry.Source.StartActivity("ProcessOrder");
var order = await CreateOrderAsync(req);
activity?.SetTag("order.id", order.Id.ToString());

// BUG: fire-and-forget, still INSIDE the using block. The child span
// this starts inherits ProcessOrder as its parent — but ProcessOrder
// is disposed (ended) the instant this method returns, while the
// email task (and its own span) keeps running independently.
_ = SendConfirmationEmailAsync(order);

return order;

async Task SendConfirmationEmailAsync(Order order)
{
    using var emailActivity = Telemetry.Source.StartActivity("SendConfirmationEmail");
    await Task.Delay(2000);   // simulate a slow email provider call
    emailActivity?.SetTag("email.sent", true);
}
// The trace now shows "SendConfirmationEmail" starting and ending
// well AFTER its own parent "ProcessOrder" span has already closed.`,
    },
    {
      label: 'The fix — detach it into its own independent trace',
      language: 'csharp',
      code: `_ = Task.Run(async () =>
{
    // Clears the ambient Activity.Current so the new span starts as
    // its OWN independent trace, not a child of the already-ending
    // ProcessOrder span.
    Activity.Current = null;

    using var emailActivity = Telemetry.Source.StartActivity("SendConfirmationEmail");
    await SendConfirmationEmailAsync(order);
    emailActivity?.SetTag("email.sent", true);
});

return order;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test asserts <code>Assert.Null(Activity.Current?.ParentId)</code> inside the detached background task from the fix above, expecting it to prove the email span is correctly independent. Walk through why this specific assertion is checking the right thing, and what it would have shown for the ORIGINAL buggy version instead.',
    hint: 'ParentId reflects whichever Activity was ambient (Activity.Current) at the moment StartActivity() was called — trace it through both versions.',
    solution: `In the FIXED version, Activity.Current is explicitly set to null
immediately before StartActivity("SendConfirmationEmail") runs — so
the new Activity has no parent context to inherit, and its ParentId is
correctly null, proving it started its own independent trace.

In the ORIGINAL buggy version, no such reset happens — the fire-and-
forget task runs inside the SAME async flow that was still "inside"
ProcessOrder's Activity.Current at the moment it was kicked off (since
Activity.Current flows through async continuations, including into a
detached, non-awaited call). StartActivity("SendConfirmationEmail") in
that version would inherit ProcessOrder's TraceId and set its ParentId
to ProcessOrder's span ID — exactly the "orphaned-looking child of an
already-ended parent" trace shape this subtopic describes. Asserting
Assert.Null(Activity.Current?.ParentId) against the ORIGINAL version
would FAIL, correctly detecting the bug, while the fixed version
passes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'starting a fire-and-forget background task inside a using var activity block is safe as long as the background work doesn\'t throw, since the using block\'s disposal only affects the PARENT span, not anything the background task does.',
      reality: 'the using block\'s disposal ends the PARENT span the moment the enclosing method returns — a fire-and-forget child task (and any span it starts) keeps running afterward, still referencing the now-ended parent as its trace context, producing a trace where a child outlives its parent.',
    },
    {
      thought: 'Activity.Current only matters for code that\'s still executing synchronously within the same using block — background tasks started with Task.Run or fire-and-forget calls don\'t inherit it.',
      reality: 'Activity.Current flows through async continuations, including into fire-and-forget calls kicked off from within an active span\'s scope, unless it\'s explicitly cleared or the work is started in a way that doesn\'t flow execution context.',
    },
    {
      thought: 'the fix for background work that should outlive a request is to simply not create a span for it at all, avoiding the parent/child confusion entirely.',
      reality: 'the better fix is to give the background work its OWN independent trace (by clearing Activity.Current before starting it) rather than losing observability into it altogether — background work that matters operationally still deserves its own trace, just not as a child of a request trace that\'s already ending.',
    },
  ];
}
