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
    heading: 'The QnA Names a Strategy It Never Shows',
    points: [
      'The main page\'s own eventual-consistency quiz explanation lists several mitigation strategies in prose — "show last updated timestamp," "add a synchronous read-after-write for the issuing user," "read from the write model immediately after their command" — but no codeTab anywhere on the page demonstrates any of them.',
      'This is the specific, most common one: after the ISSUING user\'s own command completes, redirect their next read back through the WRITE model (or the write-side database directly) instead of the — possibly-still-stale — read projection, just for that one response.',
      'Every OTHER user reading the same order keeps hitting the fast, denormalized projection from the previous subtopic — only the person who just made the change gets the special-cased, guaranteed-fresh path.',
    ],
  },
  {
    heading: 'Why Not Just Make Every Read Hit the Write Model?',
    points: [
      'Because that defeats the entire point of building a separate read model in the first place — the projection exists specifically so most reads can skip the write side\'s joins, locks, and load.',
      'Read-your-writes is deliberately narrow: it only overrides the fast path for the SAME actor, for a SHORT window (typically until the next projection sync), right after THEIR OWN write — not as a general substitute for the projection.',
      'A common way to scope the override precisely: the command handler returns a version/timestamp the client echoes back on its next read; the query handler only falls back to the write model when that echoed version is newer than what the projection currently holds.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Version-Aware Query Handler',
    language: 'csharp',
    code: `// PlaceOrderHandler now returns a version stamp alongside the ID —
// a monotonically increasing counter set at command-processing time.
public record PlaceOrderResult(Guid OrderId, long Version);

public class PlaceOrderHandler(IOrderRepository orders, IUnitOfWork uow, IMediator mediator)
    : IRequestHandler<PlaceOrderCommand, PlaceOrderResult>
{
    public async Task<PlaceOrderResult> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);

        var version = order.Version;   // e.g. a row-version / xmin-style counter
        await mediator.Publish(new OrderPlaced(order.Id, cmd.CustomerId, order.Total, DateTime.UtcNow), ct);
        return new PlaceOrderResult(order.Id, version);
    }
}

// GetOrderSummaryQuery now carries an optional "I need at least this
// version" hint — set by the client only right after ITS OWN write.
public record GetOrderSummaryQuery(Guid OrderId, long? MinVersion = null)
    : IRequest<OrderSummary?>;

public class GetOrderSummaryHandler(ReadDbContext readDb, AppDbContext writeDb)
    : IRequestHandler<GetOrderSummaryQuery, OrderSummary?>
{
    public async Task<OrderSummary?> Handle(GetOrderSummaryQuery q, CancellationToken ct)
    {
        var projected = await readDb.OrderSummaries
            .FirstOrDefaultAsync(o => o.Id == q.OrderId, ct);

        // Fast path: no freshness requirement, or the projection has
        // already caught up — every OTHER user takes this branch.
        if (q.MinVersion is null || (projected?.Version ?? 0) >= q.MinVersion)
            return projected;

        // Slow path, taken ONLY by the issuing user in the brief
        // window before the projection syncs — read the write model
        // directly so they never see their own change vanish.
        var order = await writeDb.Orders.FirstOrDefaultAsync(o => o.Id == q.OrderId, ct);
        return order is null ? null : ToSummary(order);
    }

    private static OrderSummary ToSummary(Order o) => new()
    {
        Id = o.Id, Total = o.Total, Status = o.Status.ToString(), PlacedAt = o.CreatedAt,
    };
}

// Client: PlaceOrderResult.Version travels back on the very next
// GetOrderSummaryQuery the placing user's own UI issues.
var placed = await mediator.Send(new PlaceOrderCommand(customerId, items));
var summary = await mediator.Send(new GetOrderSummaryQuery(placed.OrderId, placed.Version));`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A second, unrelated user opens the same order\'s detail page moments after the example above. Their client never received a <code>PlaceOrderResult.Version</code> from anyone. Which branch of <code>GetOrderSummaryHandler.Handle()</code> do they take, and does it matter whether the projection has finished syncing yet?',
  hint: 'Look at what <code>q.MinVersion</code> equals for a request that never set it, and re-check the fast-path condition.',
  solution: `// They take the fast path: q.MinVersion is null (the default),
// so "q.MinVersion is null || ..." is true immediately, and they
// get whatever the projection currently holds — no write-model
// read at all.

// It genuinely doesn't matter to THEM whether the projection has
// synced yet: they have no version to compare against, so there is
// no "staler than expected" case from their point of view. Only the
// issuing user, who has a concrete version number to hold the read
// to, can ever trigger the slow path — read-your-writes is scoped
// to exactly one actor at a time, by construction.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Read-your-writes means the whole application switches to strong consistency for a little while after any write happens.',
    reality: 'It is scoped to one REQUEST from one ACTOR, not a system-wide mode change. Every other concurrent read — from every other user, and even the SAME user reading a DIFFERENT order — keeps using the fast projection path exactly as before. Nothing about the system\'s general consistency guarantees changes; only the one query that explicitly carries a fresh-enough <code>MinVersion</code> ever takes the slow branch.',
  },
  {
    thought: 'This pattern requires a distributed transaction linking the command and the following query together.',
    reality: 'No transaction spans them at all — they are two completely independent MediatR round trips, exactly as the main page\'s own <code>Send()</code> calls already are. The only thing that travels between them is a plain version number returned by the command and echoed back by the client on its next read; the query handler just compares two numbers before deciding which data source to read from.',
  },
];

@Component({
  selector: 'app-dp-cqrs-read-your-writes',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './read-your-writes-for-the-issuing-user.html',
  styleUrl: './read-your-writes-for-the-issuing-user.scss',
})
export class ReadYourWritesForTheIssuingUserSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
