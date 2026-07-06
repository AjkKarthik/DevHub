import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-masstransit-send-queue-name-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './send-hardcoded-queue-name-can-silently-point-at-an-empty-queue.html',
  styleUrl: './send-hardcoded-queue-name-can-silently-point-at-an-empty-queue.scss',
})
export class SendHardcodedQueueNameCanSilentlyPointAtAnEmptyQueueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Send() Needs an Exact Queue Name — Publish() Needs Only a Type',
      points: [
        'The main page\'s own "Publish & Send" tab sends CancelOrder to new Uri("queue:order-cancellation") — a literal string the developer must get exactly right. Publish(), by contrast, routes by MESSAGE TYPE (OrderPlaced) with no string involved at all; MassTransit resolves every subscribed consumer automatically via ConfigureEndpoints(ctx). Send() has no equivalent auto-resolution — the queue name in the Uri must match whatever receive endpoint MassTransit actually created for the intended consumer, which is normally DERIVED from the consumer\'s class name by convention (e.g. a class like CancelOrderConsumer typically produces a queue named cancel-order, not order-cancellation) unless a ReceiveEndpoint() call explicitly names it.',
        'If the string in GetSendEndpoint() doesn\'t match any real receive endpoint, MassTransit does NOT throw at send time — the configured transport happily creates or routes to a queue with that literal name, and the message sits there, correctly delivered by MassTransit\'s own logic, with absolutely nothing ever consuming it. There is no compile-time check tying a hardcoded Uri string to an actual IConsumer&lt;T&gt; registration.',
      ],
    },
    {
      heading: 'How to Make This Failure Loud Instead of Silent',
      points: [
        'The safest fix is to avoid a hand-typed Uri entirely: expose the intended queue name as a shared constant referenced by BOTH the ReceiveEndpoint() registration and every Send() call site, so a rename in one place forces a compile-time update everywhere else that references the same constant — rather than two independent string literals that can silently diverge.',
        'A cheap safety net at the integration-test level: an ITestHarness-based test that sends to the EXACT literal queue string used in production code, then asserts the intended consumer\'s harness recorded a Consumed entry for it — this converts a silent drop into an immediate, loud test failure the moment the queue name and the consumer\'s real endpoint diverge.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The fragile pattern — two independent strings that must happen to match',
      language: 'csharp',
      code: `// The main page's own example:
app.MapPost("/orders/{id}/cancel", async (
    Guid id,
    ISendEndpointProvider sender) =>
{
    var endpoint = await sender.GetSendEndpoint(new Uri("queue:order-cancellation"));
    await endpoint.Send(new CancelOrder(id));
    return Results.Accepted();
});

// Elsewhere, the consumer is registered by convention:
public class CancelOrderConsumer : IConsumer<CancelOrder>
{
    public Task Consume(ConsumeContext<CancelOrder> ctx) => Task.CompletedTask;
}
x.AddConsumer<CancelOrderConsumer>();
x.UsingRabbitMq((ctx, cfg) => cfg.ConfigureEndpoints(ctx));
// MassTransit's default naming convention derives the queue name from
// the consumer class — typically "cancel-order", NOT "order-cancellation".
// The Send() call above silently delivers into a DIFFERENT, unconsumed
// queue that the transport happily creates on first use.`,
    },
    {
      label: 'Test that catches the mismatch',
      language: 'csharp',
      code: `[Fact]
public async Task CancelOrder_Sent_To_Production_Queue_Name_Is_Actually_Consumed()
{
    await using var provider = new ServiceCollection()
        .AddMassTransitTestHarness(x =>
        {
            x.AddConsumer<CancelOrderConsumer>();
        })
        .BuildServiceProvider(true);

    var harness = provider.GetRequiredService<ITestHarness>();
    await harness.Start();

    var sender = provider.GetRequiredService<ISendEndpointProvider>();

    // Send to the EXACT literal string used in production code —
    // not whatever name the test happens to find convenient.
    var endpoint = await sender.GetSendEndpoint(new Uri("queue:order-cancellation"));
    await endpoint.Send(new CancelOrder(Guid.NewGuid()));

    // Fails if "order-cancellation" isn't the consumer's REAL endpoint —
    // proving the exact same mismatch a silent production drop would hit.
    Assert.True(await harness.Consumed.Any<CancelOrder>());
}`,
    },
    {
      label: 'The fix — one shared constant, no independently-typed strings',
      language: 'csharp',
      code: `public static class QueueNames
{
    public const string OrderCancellation = "order-cancellation";
}

// Consumer registration explicitly uses the SAME constant:
cfg.ReceiveEndpoint(QueueNames.OrderCancellation, e =>
    e.ConfigureConsumer<CancelOrderConsumer>(ctx));

// Every Send() call site references the SAME constant — a rename
// forces a compile error everywhere else instead of a silent mismatch:
var endpoint = await sender.GetSendEndpoint(new Uri($"queue:{QueueNames.OrderCancellation}"));
await endpoint.Send(new CancelOrder(id));`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate renames CancelOrderConsumer to OrderCancellationConsumer, reasoning the class name should read more naturally, and does not touch the Send() call\'s Uri string at all. Using MassTransit\'s naming-convention behavior above, would this rename actually fix or break the original mismatch from the main page\'s own example?',
    hint: 'The main page\'s Send() call already used the literal string "order-cancellation" — compare that EXACT string against what a class named OrderCancellationConsumer would produce under the default naming convention, versus what CancelOrderConsumer produced.',
    solution: `This rename would likely FIX the original mismatch by accident, not
by intention. The main page's own Send() call hardcodes
new Uri("queue:order-cancellation") — under MassTransit's default
consumer-name-derived convention, a class named OrderCancellationConsumer
would plausibly produce a queue name close to "order-cancellation",
which is what the Send() call was already using. So renaming the
consumer TOWARD matching the hardcoded string happens to align the two
independent strings that were previously mismatched (CancelOrderConsumer
naturally producing something like "cancel-order" instead).

This is exactly the risk of two independently-typed strings: whether
they match or not depends entirely on someone happening to pick names
that align, with zero enforcement either way. Any in-flight messages
already sitting in the OLD, actually-consumed queue (whatever
"cancel-order" resolved to before) simply stay unconsumed once the
consumer is renamed and reconfigured for a different queue name — those
messages are now stranded exactly as the main page's own original
mismatch would have stranded messages sent to "order-cancellation"
before this accidental fix. The shared-constant approach eliminates
this guessing game entirely — a rename becomes a single edit, and every
Send() call site (and the ReceiveEndpoint registration itself) update
together automatically, with the compiler catching any place still
referencing an old, removed constant.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Send() and Publish() are equally safe ways to route a MassTransit message — Send() just requires specifying which queue.',
      reality: 'Publish() routes by MESSAGE TYPE with automatic consumer resolution and no string involved; Send() requires an exact queue-name string that must independently match wherever the real consumer\'s receive endpoint actually is — a mismatch is not caught by the compiler or even by MassTransit at send time.',
    },
    {
      thought: 'if a Send() call\'s queue name doesn\'t match any real consumer, MassTransit throws an error immediately, alerting you to the mistake.',
      reality: 'the message is delivered exactly as instructed into whatever queue that literal name resolves to — the transport happily creates or accepts it, and the message sits there unconsumed with no exception raised anywhere.',
    },
    {
      thought: 'MassTransit\'s default consumer-to-queue-name convention is unpredictable, so hardcoding a Send() Uri string is the only reliable option.',
      reality: 'the convention is derivable and stable for a given consumer class name, but relying on a developer to correctly guess or remember it in a separate Send() call is exactly the fragility to avoid — a shared constant referenced by both the endpoint registration and every Send() call removes the guesswork entirely.',
    },
  ];
}
