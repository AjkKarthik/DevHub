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
    heading: 'The Main Page Names This But Never Builds It',
    points: [
      'The "CQRS Spectrum" theory bullet names "Read model projection: dedicated read tables or views optimised for query performance" and "Distributed CQRS: separate read database... synchronised by events" as real points on the spectrum — but every codeTab on the page reads directly from the SAME table the write side writes to (<code>db.Orders</code>).',
      'A projection needs three pieces: a domain event raised on the write side, a handler that reacts to it, and a separate denormalized read row that handler keeps up to date — none of which the main page\'s <code>GetOrderHandler</code> demonstrates, since it queries the live <code>Orders</code> table directly.',
      'MediatR (already used for commands/queries on the main page) has a SECOND, separate mechanism for this: <code>INotificationHandler&lt;T&gt;</code> — a fire-and-forget publish/subscribe channel, distinct from the request/response <code>IRequestHandler&lt;T&gt;</code> commands and queries use.',
    ],
  },
  {
    heading: 'Domain Events vs. Commands — Different MediatR Shapes',
    points: [
      'A command (<code>IRequest&lt;T&gt;</code>) has exactly ONE handler and a return value — <code>mediator.Send()</code> picks the single matching <code>IRequestHandler</code>.',
      'A domain event (<code>INotification</code>) can have ZERO, ONE, or MANY handlers and no return value at all — <code>mediator.Publish()</code> invokes every registered <code>INotificationHandler&lt;T&gt;</code> for that event type.',
      'This is exactly the shape a read-model projection needs: the SAME <code>OrderPlaced</code> event could update an <code>OrderSummary</code> read table AND separately trigger an email notification AND update an analytics counter — three independent handlers, none of which the command handler needs to know about.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Domain Event + Projection Handler',
    language: 'csharp',
    code: `// Domain event — raised by the aggregate, not sent by the caller
public record OrderPlaced(Guid OrderId, Guid CustomerId, decimal Total, DateTime PlacedAt)
    : INotification;

// Denormalized read row — a completely separate table/model from
// the write-side "Orders" table PlaceOrderHandler saves to.
public class OrderSummary
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = "";   // pre-joined — no JOIN needed at read time
    public decimal Total { get; set; }
    public string Status { get; set; } = "Placed";
    public DateTime PlacedAt { get; set; }
}

// Projection handler — keeps OrderSummary in sync with the write side.
// Runs AFTER the command's own SaveChangesAsync() has already committed.
public class UpdateOrderSummaryOnPlaced(ReadDbContext readDb, ICustomerLookup customers)
    : INotificationHandler<OrderPlaced>
{
    public async Task Handle(OrderPlaced e, CancellationToken ct)
    {
        var customerName = await customers.GetNameAsync(e.CustomerId, ct);

        readDb.OrderSummaries.Add(new OrderSummary
        {
            Id = e.OrderId,
            CustomerName = customerName,
            Total = e.Total,
            Status = "Placed",
            PlacedAt = e.PlacedAt,
        });
        await readDb.SaveChangesAsync(ct);
    }
}

// PlaceOrderHandler now publishes the event AFTER its own commit —
// the write side and the projection are two separate transactions.
public class PlaceOrderHandler(IOrderRepository orders, IUnitOfWork uow, IMediator mediator)
    : IRequestHandler<PlaceOrderCommand, Guid>
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);

        await mediator.Publish(new OrderPlaced(order.Id, cmd.CustomerId, order.Total, DateTime.UtcNow), ct);
        return order.Id;
    }
}

// The query handler this enables — reads the pre-joined projection,
// zero JOINs, exactly the "optimised independently" promise the
// main page's theory names but never shows.
public class GetOrderSummaryHandler(ReadDbContext readDb)
    : IRequestHandler<GetOrderSummaryQuery, OrderSummary?>
{
    public Task<OrderSummary?> Handle(GetOrderSummaryQuery q, CancellationToken ct) =>
        readDb.OrderSummaries.FirstOrDefaultAsync(o => o.Id == q.OrderId, ct);
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s theory bullet on Distributed CQRS says the read database can be Redis or Elasticsearch, not just another SQL table. If <code>ReadDbContext</code> in the codeTab above were swapped for a Redis client, what would change about <code>UpdateOrderSummaryOnPlaced.Handle()</code> — and what would stay exactly the same?',
  hint: 'Think about which part of the method is "how the read model is stored" versus "when and why it gets updated."',
  solution: `// What changes: only the storage call at the end —
// readDb.SaveChangesAsync() becomes something like
// redis.StringSetAsync($"order:{e.OrderId}", JsonSerializer.Serialize(summary))

// What stays exactly the same: everything else — the handler still
// subscribes to the same OrderPlaced event, still builds the same
// pre-joined OrderSummary shape, still runs after the write-side
// commit. The projection's TRIGGER and SHAPE are independent of
// WHERE the projection is stored — that's the whole point of
// separating the read model from the write model in the first place.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>PlaceOrderHandler</code> now calls <code>mediator.Publish()</code>, the command handler "knows about" the read-model projection and CQRS\'s separation is broken.',
    reality: 'The command handler only knows it raised an <code>OrderPlaced</code> EVENT — it has zero knowledge of what (if anything) subscribes to it. <code>UpdateOrderSummaryOnPlaced</code> could be deleted, or ten more handlers could be added, with no change to <code>PlaceOrderHandler</code> at all. This is exactly what keeps the write side decoupled from however many read-side projections exist.',
  },
  {
    thought: 'Because the projection handler runs synchronously (awaited) right after the command, the read model is always perfectly up to date the instant the command returns.',
    reality: 'In THIS specific in-process MediatR setup, yes — <code>Publish()</code> is awaited before <code>Handle()</code> returns, so the projection is current by the time the HTTP response goes out. But the main page\'s own "Distributed CQRS" bullet describes a separate read DATABASE synced "by events" — in that shape, the event is usually placed on a message queue (Kafka, a service bus) and the projection handler runs in a completely separate process, moments later. Whether the sync is effectively synchronous or genuinely eventually-consistent depends entirely on the transport between command and projection, not on the projection pattern itself.',
  },
];

@Component({
  selector: 'app-dp-cqrs-projection',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './syncing-a-read-model-projection-from-a-domain-event.html',
  styleUrl: './syncing-a-read-model-projection-from-a-domain-event.scss',
})
export class SyncingAReadModelProjectionFromADomainEventSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
