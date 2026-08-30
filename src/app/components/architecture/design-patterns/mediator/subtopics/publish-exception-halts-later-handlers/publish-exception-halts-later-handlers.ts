import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Main Page\'s Own Two Handlers Are Not as Independent as They Look',
    points: [
      'The main page\'s "MediatR CQRS" codeTab registers two separate handlers for ' +
      '<code>OrderShippedNotification</code>: <code>EmailNotificationHandler</code> and ' +
      '<code>AnalyticsHandler</code>. Nothing in the page states or shows what happens if one of them throws.',
      'By default, <code>IMediator.Publish()</code> uses <code>ForeachAwaitPublisher</code> — it awaits each ' +
      'registered handler ONE AT A TIME, in registration order. If <code>EmailNotificationHandler</code> ' +
      'throws, the loop stops right there: <code>AnalyticsHandler</code> never runs at all for that ' +
      'notification, even though sending a shipping email and tracking analytics are two completely ' +
      'unrelated side effects with no reason to depend on each other.',
      'This is easy to miss because it is not a MediatR bug or an edge case — it is the DOCUMENTED default ' +
      'behavior, and the main page\'s own example gives no indication that a failure in one handler silently ' +
      'skips every handler registered after it.',
    ],
  },
  {
    heading: 'The Fix Is a Publisher Strategy, Not a Try/Catch in Each Handler',
    points: [
      'MediatR ships an alternate built-in strategy, <code>TaskWhenAllPublisher</code>, which starts every ' +
      'registered handler and awaits <code>Task.WhenAll</code> across all of them — if one throws, the ' +
      'others still run to completion; the exception only surfaces after all handlers have finished.',
      'The strategy is configured once, at registration, via <code>NotificationPublisher</code> on the ' +
      '<code>AddMediatR</code> options — no change is needed inside <code>EmailNotificationHandler</code> or ' +
      '<code>AnalyticsHandler</code> themselves.',
      'The right choice is not universal: sequential (the default) is correct when handler order genuinely ' +
      'matters or a later handler depends on an earlier one succeeding; parallel is correct when handlers are ' +
      'truly independent side effects, which is exactly the shape of the main page\'s own email + analytics ' +
      'example.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — default ForeachAwaitPublisher (sequential, order-sensitive)
public class EmailNotificationHandler(IEmailService email)
    : INotificationHandler<OrderShippedNotification>
{
    public Task Handle(OrderShippedNotification n, CancellationToken ct)
        // If the email service is down and this throws...
        => email.SendShippingConfirmationAsync(n.OrderId, n.TrackingCode, ct);
}

public class AnalyticsHandler(IAnalytics analytics)
    : INotificationHandler<OrderShippedNotification>
{
    public Task Handle(OrderShippedNotification n, CancellationToken ct)
        // ...this handler NEVER RUNS for that notification — not because
        // it failed, but because ForeachAwaitPublisher stopped the loop
        // the moment EmailNotificationHandler's Task faulted.
        => analytics.TrackOrderShippedAsync(n.OrderId, ct);
}

await mediator.Publish(new OrderShippedNotification(orderId, trackingCode));
// Registration order: Email registered before Analytics.
// If Email throws -> Analytics silently never runs. No log, no error
// about Analytics — just an OrderShippedNotification that produced
// one side effect instead of two.

// AFTER — opt into parallel publishing so failures don't cascade
// between genuinely independent handlers.
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<Program>();
    cfg.NotificationPublisher = new TaskWhenAllPublisher();
});
// Now both handlers start immediately and run to completion
// regardless of one another. If Email throws, Analytics still
// records the event — the exception is only re-thrown (via an
// AggregateException) after BOTH tasks have finished.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose <code>AnalyticsHandler</code> were registered BEFORE <code>EmailNotificationHandler</code> ' +
    'instead of after, and <code>EmailNotificationHandler</code> still throws. Under the default ' +
    '<code>ForeachAwaitPublisher</code>, does <code>AnalyticsHandler</code> run this time?',
  hint:
    'ForeachAwaitPublisher processes handlers in REGISTRATION order, one at a time — think about which ' +
    'handler is now first in that order.',
  solution:
    'Yes — this time AnalyticsHandler DOES run, because it is now first in registration order and completes ' +
    'before EmailNotificationHandler (now second) ever throws. This is exactly why relying on the default ' +
    'sequential publisher for independent side effects is fragile: whether a given handler runs at all can ' +
    'depend purely on the ARBITRARY order handlers happen to be registered in, not on anything about what ' +
    'that handler actually does. Swapping to TaskWhenAllPublisher removes this order-dependence entirely — ' +
    'both handlers always run regardless of registration order or which one fails.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Publish() is a broadcast — every registered handler always runs, since that is the whole point ' +
      'of a notification with multiple handlers.',
    reality:
      'That is true for the HAPPY path, but the default publisher stops on the first exception. ' +
      '<code>Publish()</code> broadcasting to every handler is a best-effort guarantee under ' +
      '<code>ForeachAwaitPublisher</code>, not an unconditional one — a single failing handler silently ' +
      'prevents every handler registered after it from running at all.',
  },
  {
    thought: 'Switching to TaskWhenAllPublisher is strictly better, so it should just be the default.',
    reality:
      'Parallel execution removes the safety net of ordering when order-dependence is intentional — e.g. a ' +
      'handler that must persist state before a second handler reads it. MediatR\'s sequential default is a ' +
      'reasonable, predictable choice for the general case; TaskWhenAllPublisher is an opt-in for the specific ' +
      'case (like this page\'s own email + analytics example) where handlers are genuinely independent.',
  },
];

@Component({
  selector: 'app-mediator-publish-exception-halts-later-handlers',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './publish-exception-halts-later-handlers.html',
  styleUrl: './publish-exception-halts-later-handlers.scss',
})
export class PublishExceptionHaltsLaterHandlersSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
