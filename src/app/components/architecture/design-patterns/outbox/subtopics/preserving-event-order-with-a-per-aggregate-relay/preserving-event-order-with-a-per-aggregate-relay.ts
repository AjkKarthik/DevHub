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
    heading: 'One Sentence, No Working Relay',
    points: [
      'The main page\'s "operational challenges" QnA names the risk directly: "outbox events may be published out of order if the relay processes in parallel. Use ordered Kafka partitions or single-threaded relay per aggregate type to preserve ordering." That is the entire treatment — no codeTab shows what "single-threaded relay per aggregate type" actually looks like.',
      'The main page\'s OWN <code>OutboxRelay.PublishPendingAsync</code> already processes messages SEQUENTIALLY in one <code>foreach</code> loop — so it happens to preserve order already, for the simplest possible reason: it never parallelizes at all. The risk only shows up once a relay is sped up by publishing multiple messages CONCURRENTLY, which is a very natural next optimisation once the outbox table starts backing up.',
      'The fix the QnA names ("single-threaded relay per aggregate type") is more precise than "never parallelize anything" — it means: events for the SAME aggregate (the same <code>OrderId</code>, say) must stay in order relative to EACH OTHER, but events for two DIFFERENT aggregates have no ordering relationship to preserve and can safely run at the same time.',
    ],
  },
  {
    heading: 'Why Naive Parallelism Breaks Ordering',
    points: [
      'If ten pending outbox rows are all published via <code>Task.WhenAll</code> at once, the broker call for row 5 might complete before row 2\'s — even though row 2 was written to the outbox first. For two events belonging to the SAME order (e.g. <code>OrderPlaced</code> then <code>OrderCancelled</code>), a consumer that happens to receive them out of order could process a cancellation before the order it\'s cancelling has even been created in its own local read model.',
      'Grouping by aggregate ID and publishing each group\'s own events sequentially — while still letting DIFFERENT aggregates\' groups run concurrently — gets both properties at once: real parallelism where it\'s safe, and strict ordering where it isn\'t.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Per-Aggregate Ordered Relay',
    language: 'csharp',
    code: `// OutboxMessage now records WHICH aggregate it belongs to — the
// main page's own OutboxMessage entity has no such field at all.
public class OutboxMessage
{
    public Guid           Id           { get; set; } = Guid.NewGuid();
    public Guid           AggregateId  { get; set; }   // e.g. the OrderId
    public string         EventType    { get; set; } = string.Empty;
    public string         Payload      { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt    { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; set; }
}

public class OrderedOutboxRelay(IServiceScopeFactory scopeFactory, IMessageBroker broker)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await PublishPendingAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task PublishPendingAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null)
            .OrderBy(m => m.CreatedAt)
            .Take(200)
            .ToListAsync(ct);

        // Group by aggregate — everything within ONE group publishes
        // strictly in order; DIFFERENT groups run concurrently.
        var groups = pending.GroupBy(m => m.AggregateId);

        await Task.WhenAll(groups.Select(group => PublishGroupInOrderAsync(group, db, ct)));

        await db.SaveChangesAsync(ct);
    }

    private async Task PublishGroupInOrderAsync(
        IEnumerable<OutboxMessage> group, AppDbContext db, CancellationToken ct)
    {
        // Sequential loop WITHIN one aggregate's own events — this is
        // the "single-threaded relay per aggregate" the QnA names.
        foreach (var msg in group.OrderBy(m => m.CreatedAt))
        {
            await broker.PublishAsync(msg.EventType, msg.Payload, ct);
            msg.ProcessedAt = DateTimeOffset.UtcNow;
        }
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The outbox table has 4 pending rows: two for <code>OrderId = A</code> (<code>OrderPlaced</code> then <code>OrderCancelled</code>), and two for a completely different <code>OrderId = B</code> (<code>OrderPlaced</code> then <code>PaymentProcessed</code>). Using <code>OrderedOutboxRelay</code> above, is it possible for B\'s <code>PaymentProcessed</code> to reach the broker before A\'s <code>OrderCancelled</code> does? Is that a problem?',
  hint: 'Check whether A\'s group and B\'s group are the SAME <code>Task</code> in the <code>Task.WhenAll</code> call, or two separate ones.',
  solution: `// Yes, it's entirely possible -- A's group and B's group run as
// two INDEPENDENT tasks under Task.WhenAll, with no ordering
// guarantee relative to EACH OTHER. B's PaymentProcessed reaching
// the broker before A's OrderCancelled is completely fine.

// It is NOT a problem, because ordering only matters WITHIN one
// aggregate's own event stream. A's two events (OrderPlaced then
// OrderCancelled) are guaranteed to publish in that exact order,
// since they're in the same group and that group's foreach loop is
// strictly sequential. B's events have no logical relationship to
// A's at all -- there's no invariant being protected by keeping
// them in any particular relative order.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Grouping by aggregate ID and running groups concurrently is functionally the same as just publishing every row sequentially, one at a time — it just adds unnecessary complexity for no real speed gain.',
    reality: 'The whole point is the OPPOSITE of sequential-everything: a relay processing 200 pending rows across 50 different orders can publish up to 50 groups CONCURRENTLY (one per aggregate), instead of waiting for row 1 to fully complete before starting row 2 regardless of which order each belongs to. Ordering is preserved WITHIN each aggregate\'s own small group, while the relay as a whole gets real parallelism across aggregates — a meaningfully faster relay than the main page\'s own single sequential loop, without giving up the correctness the QnA\'s ordering warning is about.',
  },
  {
    thought: 'This kind of ordering guarantee is unique to a custom-built relay — a message broker with native ordered delivery (like Kafka partitions, which the QnA also mentions) makes this whole problem go away automatically.',
    reality: 'Kafka partition-based ordering only preserves order WITHIN a single partition — the producer still has to choose a partition key (typically the aggregate ID) so that all of one aggregate\'s events land on the SAME partition. That is the exact same underlying idea as grouping by <code>AggregateId</code> here, just delegated to the broker\'s own partitioning instead of the relay\'s own grouping logic — not a different problem, a different place to solve the identical one.',
  },
];

@Component({
  selector: 'app-dp-outbox-ordering',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './preserving-event-order-with-a-per-aggregate-relay.html',
  styleUrl: './preserving-event-order-with-a-per-aggregate-relay.scss',
})
export class PreservingEventOrderWithAPerAggregateRelaySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
