import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Event Sourcing', type: 'keyword',   desc: 'Store state as an immutable sequence of domain events — replay them to reconstruct current state.' },
  { name: 'Domain Event',   type: 'class',     desc: 'Immutable fact: OrderPlaced, ItemAdded, OrderCancelled. Named in past tense.' },
  { name: 'Event Store',    type: 'class',     desc: 'Append-only log of domain events per aggregate — never update or delete.' },
  { name: 'Projection',     type: 'keyword',   desc: 'A read model built by replaying events — one event stream can feed multiple projections.' },
  { name: 'Snapshot',       type: 'keyword',   desc: 'A cached state checkpoint to avoid replaying thousands of events on every load.' },
  { name: 'EventStoreDB',   type: 'class',     desc: 'Purpose-built event store database for .NET — also Marten (Postgres), or custom append-only tables.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is Event Sourcing?',
    points: [
      'Instead of storing current state, store the sequence of events that led to that state.',
      'Current state is derived by replaying events in order: OrderPlaced → ItemAdded → ItemRemoved → OrderShipped.',
      'Events are immutable and append-only — the event log is the source of truth.',
      'Any past state can be reconstructed by replaying events up to that point in time.',
    ],
  },
  {
    heading: 'Events vs State',
    points: [
      'Traditional: UPDATE orders SET status=\'Shipped\' WHERE id=... — current state only, history lost.',
      'Event Sourcing: append OrderShipped event — full history preserved, audit log is the database.',
      'Events capture WHY state changed, not just WHAT changed.',
      'Regulatory compliance, audit trails, temporal queries are natural consequences.',
    ],
  },
  {
    heading: 'Projections (Read Models)',
    points: [
      'A projection listens to events and builds a denormalised read model optimised for specific queries.',
      'Multiple projections can be built from the same event stream independently.',
      'Projections can be rebuilt from scratch at any time by replaying the full event log.',
      'CQRS + Event Sourcing is a common pairing: events feed projections; queries read projections.',
    ],
  },
  {
    heading: 'Snapshots',
    points: [
      'Replaying thousands of events per aggregate load is expensive — snapshots address this.',
      'A snapshot captures the aggregate\'s state at a point in time (e.g. every 100 events).',
      'On load: restore from latest snapshot, then replay only events after that snapshot.',
      'Snapshots are an optimisation — correctness does not depend on them.',
    ],
  },
  {
    heading: 'Event Sourcing and Schema Evolution Over Time',
    points: [
      'Because events are stored permanently and replayed to reconstruct state, an event\'s schema effectively becomes immutable once written — changing an event\'s shape retroactively is far harder than changing a traditional database column, since old events in the log were written with the old shape and must still be readable.',
      'Common strategies for handling event schema evolution include upcasting (transforming old-shaped events into the new shape when read), versioned event types (OrderPlacedV1, OrderPlacedV2 handled explicitly), and weak schemas (using flexible formats like JSON with defensive parsing) — each with different tradeoffs in complexity versus flexibility.',
      'Event sourcing systems commonly need to support removing sensitive data from historical events (GDPR right-to-erasure) despite events nominally being immutable — techniques like crypto-shredding (encrypting sensitive fields with a per-subject key that can later be deleted) address this tension.',
      'Teams new to event sourcing often underestimate the long-term cost of schema evolution — a thoughtful initial event design (avoiding overly specific or brittle event shapes) reduces how often painful schema evolution situations arise later in a system\'s lifetime.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Event-Sourced Aggregate',
    language: 'csharp',
    code: `// Base domain event
public abstract record DomainEvent(Guid AggregateId, int Version, DateTimeOffset OccurredAt);

// Order domain events
public record OrderPlaced(Guid AggregateId, int Version, DateTimeOffset OccurredAt,
    Guid CustomerId, List<OrderItem> Items, decimal Total) : DomainEvent(AggregateId, Version, OccurredAt);

public record OrderItemAdded(Guid AggregateId, int Version, DateTimeOffset OccurredAt,
    OrderItem Item) : DomainEvent(AggregateId, Version, OccurredAt);

public record OrderCancelled(Guid AggregateId, int Version, DateTimeOffset OccurredAt,
    string Reason) : DomainEvent(AggregateId, Version, OccurredAt);

// Event-sourced aggregate
public class Order
{
    public Guid   Id       { get; private set; }
    public Guid   CustomerId { get; private set; }
    public List<OrderItem> Items  { get; private set; } = new();
    public OrderStatus     Status { get; private set; }
    public decimal         Total  { get; private set; }
    public int             Version { get; private set; }

    private readonly List<DomainEvent> _uncommitted = new();
    public IReadOnlyList<DomainEvent> UncommittedEvents => _uncommitted;

    // Reconstitute from event stream
    public static Order Rehydrate(IEnumerable<DomainEvent> events)
    {
        var order = new Order();
        foreach (var e in events) order.Apply(e);
        return order;
    }

    // Business operations raise events
    public static Order Place(Guid customerId, List<OrderItem> items)
    {
        var order = new Order();
        var e = new OrderPlaced(Guid.NewGuid(), 0, DateTimeOffset.UtcNow, customerId, items, items.Sum(i => i.Price));
        order.Raise(e);
        return order;
    }

    public void AddItem(OrderItem item)
    {
        if (Status != OrderStatus.Pending) throw new InvalidOperationException("Cannot modify a non-pending order");
        Raise(new OrderItemAdded(Id, Version + 1, DateTimeOffset.UtcNow, item));
    }

    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Shipped) throw new InvalidOperationException("Cannot cancel shipped order");
        Raise(new OrderCancelled(Id, Version + 1, DateTimeOffset.UtcNow, reason));
    }

    // Apply mutates state — called on rehydration AND after raising
    private void Raise(DomainEvent e) { Apply(e); _uncommitted.Add(e); }

    private void Apply(DomainEvent e)
    {
        switch (e)
        {
            case OrderPlaced p:
                Id = p.AggregateId; CustomerId = p.CustomerId;
                Items = p.Items; Total = p.Total; Status = OrderStatus.Pending;
                break;
            case OrderItemAdded a:
                Items.Add(a.Item); Total += a.Item.Price;
                break;
            case OrderCancelled:
                Status = OrderStatus.Cancelled;
                break;
        }
        Version = e.Version;
    }

    public void ClearUncommitted() => _uncommitted.Clear();
}`,
  },
  {
    label: 'Event Store + Projection',
    language: 'csharp',
    code: `// Append-only event store
public interface IEventStore
{
    Task AppendAsync(Guid streamId, IEnumerable<DomainEvent> events, int expectedVersion, CancellationToken ct = default);
    Task<IReadOnlyList<DomainEvent>> LoadAsync(Guid streamId, CancellationToken ct = default);
}

// EF Core implementation using append-only table
public class EventStore(AppDbContext db) : IEventStore
{
    public async Task AppendAsync(Guid streamId, IEnumerable<DomainEvent> events, int expectedVersion, CancellationToken ct = default)
    {
        // Optimistic concurrency: check version before appending
        var current = await db.EventStream.Where(e => e.StreamId == streamId).MaxAsync(e => (int?)e.Version, ct) ?? -1;
        if (current != expectedVersion) throw new ConcurrencyException(streamId);

        foreach (var e in events)
        {
            db.EventStream.Add(new StoredEvent
            {
                StreamId  = streamId,
                Version   = e.Version,
                EventType = e.GetType().Name,
                Payload   = JsonSerializer.Serialize(e, e.GetType()),
                OccurredAt = e.OccurredAt,
            });
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<DomainEvent>> LoadAsync(Guid streamId, CancellationToken ct = default)
    {
        var stored = await db.EventStream
            .Where(e => e.StreamId == streamId)
            .OrderBy(e => e.Version)
            .ToListAsync(ct);

        return stored.Select(Deserialise).ToList();
    }

    private DomainEvent Deserialise(StoredEvent s) => s.EventType switch
    {
        nameof(OrderPlaced)     => JsonSerializer.Deserialize<OrderPlaced>(s.Payload)!,
        nameof(OrderItemAdded)  => JsonSerializer.Deserialize<OrderItemAdded>(s.Payload)!,
        nameof(OrderCancelled)  => JsonSerializer.Deserialize<OrderCancelled>(s.Payload)!,
        _ => throw new UnknownEventTypeException(s.EventType)
    };
}

// Repository that uses event store
public class OrderRepository(IEventStore store)
{
    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var events = await store.LoadAsync(id, ct);
        return events.Count == 0 ? null : Order.Rehydrate(events);
    }

    public async Task SaveAsync(Order order, CancellationToken ct = default)
    {
        await store.AppendAsync(order.Id, order.UncommittedEvents, order.Version - order.UncommittedEvents.Count, ct);
        order.ClearUncommitted();
    }
}

// Projection — builds a read model from events
public class OrderSummaryProjection(AppDbContext db)
{
    public async Task HandleAsync(OrderPlaced e, CancellationToken ct) =>
        await db.OrderSummaries.AddAsync(new OrderSummary(e.AggregateId, e.CustomerId, e.Total, "Pending"), ct);

    public async Task HandleAsync(OrderCancelled e, CancellationToken ct)
    {
        var summary = await db.OrderSummaries.FindAsync([e.AggregateId], ct);
        if (summary is not null) summary.Status = "Cancelled";
        await db.SaveChangesAsync(ct);
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Storing mutable or overly large events',
    wrong: `public record OrderUpdated(Guid Id, Order FullOrderSnapshot) : DomainEvent; // anti-pattern`,
    right: `public record OrderItemAdded(Guid Id, int Version, DateTimeOffset OccurredAt, OrderItem Item) : DomainEvent;`,
    explanation: 'Events should capture the minimal fact that occurred — not the full state. "OrderUpdated" with a snapshot is just state storage in disguise. Use fine-grained events: OrderItemAdded, PriceChanged, AddressUpdated.',
  },
  {
    title: 'Changing or deleting past events',
    wrong: `// "Fix" a bug by updating events in the event store
UPDATE event_stream SET payload = '...' WHERE id = 'abc';`,
    right: `// Issue a compensating event instead: OrderItemPriceCorrection
// Or use a corrective event that supersedes the incorrect one`,
    explanation: 'Events are immutable facts — the event log must never be modified. To correct an error, append a compensating event. If GDPR requires data removal, use crypto-shredding (encrypt personal data in the event; delete the key).',
  },
  {
    title: 'Using Event Sourcing everywhere without justification',
    wrong: `// Product catalog: ProductCreated, ProductNameUpdated, ProductPriceChanged
// No audit requirement, no temporal queries — Event Sourcing adds complexity for no benefit`,
    right: `// Use standard state-based persistence for simple entities
// Apply Event Sourcing to aggregates that need audit trails, temporal queries, or event replay`,
    explanation: 'Event Sourcing is not a default architecture — it adds significant complexity (event versioning, projections, eventual consistency). Apply it only where the history IS the value: financial transactions, audit-required domains, complex state machines.',
  },
  {
    title: 'Not versioning events when the schema changes',
    wrong: `public record OrderPlaced(Guid Id, string CustomerEmail) : DomainEvent;
// Later: add CustomerId — now old events cannot be deserialised`,
    right: `// Version events: OrderPlaced_v1, OrderPlaced_v2 with upcasters
// Or use flexible serialisation (JsonElement) with migration logic`,
    explanation: 'Event schemas are permanent contracts — old events in the store must still be deserialised years later. Plan for schema evolution from day one: version event types, provide upcasters (v1→v2 transformers), or use schema registries.',
  },
];

const challenge: Challenge = {
  title: 'Bank Account Event Store',
  language: 'typescript',
  description: `Implement an event-sourced BankAccount.
Events: AccountOpened(id, owner, balance), MoneyDeposited(amount), MoneyWithdrawn(amount).
BankAccount.rehydrate(events[]) reconstructs state.
deposit() and withdraw() raise events.`,
  hints: [
    'Store uncommitted events in an array',
    'apply() mutates state and is called from rehydrate AND raise()',
    'withdraw() throws if insufficient funds',
  ],
  starterCode: `type DomainEvent =
  | { type: 'AccountOpened'; id: string; owner: string; balance: number }
  | { type: 'MoneyDeposited'; amount: number }
  | { type: 'MoneyWithdrawn'; amount: number };

class BankAccount {
  id = ''; owner = ''; balance = 0;
  private uncommitted: DomainEvent[] = [];

  static rehydrate(events: DomainEvent[]): BankAccount { /* TODO */ return new BankAccount(); }
  deposit(amount: number): void { /* TODO */ }
  withdraw(amount: number): void { /* TODO */ }
  getUncommitted(): DomainEvent[] { return this.uncommitted; }
}`,
  solution: `type DomainEvent =
  | { type: 'AccountOpened'; id: string; owner: string; balance: number }
  | { type: 'MoneyDeposited'; amount: number }
  | { type: 'MoneyWithdrawn'; amount: number };

class BankAccount {
  id = ''; owner = ''; balance = 0;
  private uncommitted: DomainEvent[] = [];

  private apply(e: DomainEvent): void {
    if (e.type === 'AccountOpened') { this.id = e.id; this.owner = e.owner; this.balance = e.balance; }
    if (e.type === 'MoneyDeposited') this.balance += e.amount;
    if (e.type === 'MoneyWithdrawn') this.balance -= e.amount;
  }

  private raise(e: DomainEvent): void { this.apply(e); this.uncommitted.push(e); }

  static open(id: string, owner: string, initialBalance: number): BankAccount {
    const acc = new BankAccount();
    acc.raise({ type: 'AccountOpened', id, owner, balance: initialBalance });
    return acc;
  }

  static rehydrate(events: DomainEvent[]): BankAccount {
    const acc = new BankAccount();
    events.forEach(e => acc.apply(e));
    return acc;
  }

  deposit(amount: number): void { this.raise({ type: 'MoneyDeposited', amount }); }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error('Insufficient funds');
    this.raise({ type: 'MoneyWithdrawn', amount });
  }

  getUncommitted(): DomainEvent[] { return this.uncommitted; }
}

const acc = BankAccount.open('A1', 'Alice', 1000);
acc.deposit(500);
acc.withdraw(200);
console.log(acc.balance); // 1300
console.log(acc.getUncommitted()); // 3 events

const acc2 = BankAccount.rehydrate(acc.getUncommitted());
console.log(acc2.balance); // 1300 — same state from events`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the "source of truth" in an Event Sourced system?',
    options: [
      'The latest snapshot of each aggregate',
      'The immutable, append-only event log',
      'The read model projection database',
      'The current state stored in a relational table',
    ],
    answer: 1,
    explanation: 'In Event Sourcing, the event log is the source of truth. Current state is derived by replaying events — it is a cache of the event log. Projections/snapshots are derived views; only the event log is canonical.',
  },
  {
    q: 'What is a projection in Event Sourcing?',
    options: [
      'A 3D rendering of the domain model',
      'A read model built by applying events in order — optimised for specific queries',
      'A snapshot of aggregate state stored for performance',
      'A backup copy of the event store',
    ],
    answer: 1,
    explanation: 'A projection listens to events and builds a denormalised read model for efficient querying. The same event stream can feed multiple projections independently. If a projection is wrong or a new query type is needed, replay the events to rebuild it.',
  },
  {
    q: 'How do you correct an error in an Event Sourced system?',
    options: [
      'Update the incorrect event in the event store',
      'Delete the incorrect event and rewrite the stream',
      'Append a compensating event that logically reverses or corrects the error',
      'Restore from backup to the state before the error',
    ],
    answer: 2,
    explanation: 'Events are immutable — you cannot update or delete past events. To correct an error, append a compensating event (e.g. OrderItemPriceCorrection). The event log becomes a complete audit trail including the correction.',
  },
  { q: 'What is Event Sourcing and how does it differ from traditional CRUD storage?', options: ['Event Sourcing stores events in addition to the current state for auditing', 'Event Sourcing stores the full history of state-changing events as the source of truth; current state is derived by replaying events, not stored directly', 'Event Sourcing uses database triggers to record changes', 'Event Sourcing uses message queues to persist write operations before applying them'], answer: 1, explanation: 'Traditional CRUD: only the current state is stored. UPDATE replaces old values; there is no history. Event Sourcing: no mutable state row. Every state change is appended as an immutable event to an event stream: OrderPlaced, ItemAdded, OrderShipped. Current state is derived by replaying events from the beginning (or from the last snapshot). The event stream is the source of truth. Benefits: full audit trail, temporal queries (reconstruct state at any past point), new projections can be built from the history, events can trigger downstream services via event bus.' },
  { q: 'What is a snapshot in Event Sourcing and why is it needed?', options: ['A copy of the database used for disaster recovery', 'A periodic checkpoint of the current aggregate state stored to avoid replaying the entire event stream on every load', 'A read-only projection of the event stream for reporting', 'A backup of the event store taken nightly'], answer: 1, explanation: 'As an aggregate accumulates events over time, loading it by replaying all events from the beginning becomes slow. Snapshots solve this: periodically (every N events), save the current state as a snapshot. On load: find the latest snapshot, load it, then replay only events that occurred after the snapshot. Example: an account with 10,000 transactions does not need to replay all 10,000 on every load if a snapshot at event 9,900 is available. Snapshots are an optimization; the event stream remains the source of truth. Snapshots can be discarded and rebuilt from events if needed.' },
  { q: 'What is event upcasting in Event Sourcing?', options: ['Converting events from one encoding format to another (JSON to Avro)', 'Transforming old event schema versions to the current version when replaying, to handle schema evolution over time', 'Elevating event priority when a consumer falls behind', 'Replaying events in reverse order for undo operations'], answer: 1, explanation: 'Event schema evolves: an event from 2 years ago may have fewer fields or different field names than the current version. Event upcasting transforms old event versions to the current schema during replay without modifying the stored events (which are immutable). An upcaster is a function that takes an event of version N and returns the equivalent event in version N+1. Upcaster chain: v1 -> v2 -> v3 (applied in sequence). This allows the application to always work with the latest event schema while the event store preserves the historical events as originally written.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Event Sourcing?',
    a: 'Use Event Sourcing when: (1) full audit trail is a business requirement (finance, healthcare, legal), (2) temporal queries are needed ("what was the state on date X?"), (3) CQRS read models need to be rebuilt or new projections added later, (4) the domain is naturally event-driven (order processing, account management). Avoid it for simple CRUD entities where history adds no value.',
  },
  {
    q: 'How does Event Sourcing handle GDPR right-to-erasure if events are immutable?',
    a: 'Use crypto-shredding: encrypt personally identifiable data in events using a per-user encryption key. When erasure is requested, delete the encryption key — all encrypted event data becomes unreadable without changing the events themselves. Alternatively, replace personal data in projections; events with a reference ID (not PII) still function.',
  },
  { q: 'How do you handle event schema evolution in Event Sourcing?', a: 'Strategies for event schema changes: additive changes (adding new optional fields) are backwards compatible: old events simply do not have the new field; read code handles the absence with a default. Renaming or removing fields: use event upcasting to transform old events during replay to the current schema. Write a versioned event type (OrderPlacedV2) and register an upcaster from V1 to V2. Never modify stored events: they are immutable history. For major semantic changes, use a new event type and keep the old type for historical events. Document event versions in a schema registry (Avro schema registry, AsyncAPI spec) and version event type identifiers.' },
  { q: 'What is the difference between an event and a command in Event Sourcing?', a: 'Command: an intent or request that may be accepted or rejected. PlaceOrder command is sent to the order aggregate. The aggregate validates the command (is the customer active? is there inventory?). If valid, it records an OrderPlaced event. If invalid, it rejects the command with a domain exception. Event: a fact that already happened and cannot be rejected. OrderPlaced event is immutably appended to the event stream. Events are past tense (something that occurred). Commands are present or imperative tense (a request to do something). This distinction matters for idempotency: processing the same command twice might be rejected the second time; processing the same event twice should be idempotent.' },
  { q: 'What happens to a running application\'s queries WHILE a projection is being rebuilt from scratch after a new query requirement is added?', a: 'This is a real operational concern: rebuilding a projection by replaying potentially millions of historical events can take minutes to hours depending on event volume, and the projection\'s read table is typically empty or stale during that window. Common approaches: build the new projection into a SEPARATE table/version and atomically swap it in only once the rebuild completes (blue-green projection deployment), so the old version keeps serving queries throughout the rebuild; or accept a maintenance window for less critical projections. Never rebuild in-place against a table actively serving production reads, since that produces incomplete or inconsistent query results mid-rebuild.' },
  { q: 'What are the challenges and trade-offs of Event Sourcing?', a: 'Challenges: eventual consistency between the event store and projections means queries may return stale data. Querying the current state requires a read model (you cannot directly query the event stream like a SQL table). Performance: aggregate loading requires replaying events (mitigated by snapshots). Schema evolution requires upcasters for every breaking event change. Debugging requires tooling to replay and inspect events rather than just reading a table. Overkill for simple CRUD domains without genuine need for audit trails, temporal queries, or event-driven integration. Recommended for: financial systems, e-commerce orders, healthcare records, and collaborative editing where full history, auditability, or event-driven integration is essential.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Event Sourcing stores state as an immutable sequence of domain events — current state is derived by replaying them, giving a complete audit trail and temporal query capability.',
  mustKnow: [
    'Events are immutable facts appended to an event log — never updated or deleted',
    'State = replay all events for an aggregate in order (or snapshot + recent events)',
    'Projections build read models from events — can be rebuilt at any time',
    'Snapshots are a performance optimisation — not the source of truth',
    'To correct errors: append compensating events, never modify past events',
  ],
  interviewFocus: [
    'What is the source of truth in Event Sourcing?',
    'How do projections work and why can they be rebuilt?',
    'How do you handle GDPR erasure with immutable events?',
  ],
};

@Component({
  selector: 'app-dp-event-sourcing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './event-sourcing.html',
  styleUrl: './event-sourcing.scss',
})
export class DpEventSourcing {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
