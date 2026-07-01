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
  { name: 'Outbox Pattern',    type: 'keyword',   desc: 'Write events to an outbox table in the SAME database transaction as domain changes — a relay process publishes them to the message broker.' },
  { name: 'Outbox Table',      type: 'class',     desc: 'A database table that temporarily stores outgoing events/messages before they are published to the broker.' },
  { name: 'Relay/Dispatcher',  type: 'class',     desc: 'Background process that polls the outbox table and publishes unpublished events to the message broker.' },
  { name: 'At-Least-Once',     type: 'keyword',   desc: 'The outbox guarantees each event is published at least once — consumers must be idempotent.' },
  { name: 'CDC',               type: 'keyword',   desc: 'Change Data Capture — alternative relay that reads the database transaction log (WAL) instead of polling an outbox table.' },
  { name: 'MassTransit Outbox', type: 'class',    desc: '.NET built-in outbox: transactional outbox via EF Core; relay runs as an IHostedService background worker.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Dual-Write Problem',
    points: [
      'After saving an order, you publish an OrderPlaced event to a message broker — two separate writes.',
      'If the database commits but the broker publish fails, the event is lost (ghost order).',
      'If the broker publish succeeds but the database rolls back, downstream services act on a non-existent order.',
      'The Outbox Pattern solves this by writing both the domain change and the event in one atomic transaction.',
    ],
  },
  {
    heading: 'How the Outbox Works',
    points: [
      'Step 1: Write the domain change AND the outgoing event to the outbox table in ONE database transaction.',
      'Step 2: A background relay process queries unprocessed outbox rows and publishes them to the broker.',
      'Step 3: Mark the outbox row as published (or delete it).',
      'If the relay crashes mid-publish, it will retry — downstream consumers must handle duplicate events idempotently.',
    ],
  },
  {
    heading: 'Polling vs Change Data Capture',
    points: [
      'Polling: relay queries outbox table every N seconds for unpublished rows — simple but adds query load.',
      'CDC (Change Data Capture): relay reads the database WAL (write-ahead log) — no polling; near real-time.',
      'Debezium is the standard CDC tool for PostgreSQL and SQL Server; Marten (Postgres) has built-in CDC support.',
      'MassTransit\'s built-in outbox uses polling; for CDC, use Debezium + Kafka or Marten.',
    ],
  },
  {
    heading: 'MassTransit Transactional Outbox',
    points: [
      'MassTransit 8+ has a built-in transactional outbox for EF Core — no manual outbox table needed.',
      'Messages published inside a consumer or saga are stored in the outbox table via the same DbContext.',
      'An IHostedService relay publishes them asynchronously after the transaction commits.',
      'Configure with AddEntityFrameworkOutbox() and UseMessageRetry() for reliable delivery.',
    ],
  },
  {
    heading: 'Outbox as a General Solution to the Dual-Write Problem',
    points: [
      'The dual-write problem arises whenever a system needs to atomically update a local database AND notify an external system (publish a message, call an external API) — since these are two genuinely separate operations against two separate systems, there is no native distributed transaction spanning both by default.',
      'The Outbox pattern resolves this by writing the intended external notification (as a row in an "outbox" table) within the SAME local database transaction as the actual business data change — guaranteeing the notification record and the business change either both commit or neither does.',
      'A separate relay process (polling the outbox table or using change-data-capture) then reads unpublished outbox rows and performs the actual external side effect, decoupling the atomic local write from the reliability of the external system it eventually needs to talk to.',
      'This pattern generalizes beyond messaging — the same "record the intent atomically, then reliably execute it asynchronously" structure applies to any scenario needing atomicity between a local database change and any external side effect, not exclusively message publishing.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Manual Outbox (EF Core)',
    language: 'csharp',
    code: `// Outbox message entity
public class OutboxMessage
{
    public Guid          Id          { get; set; } = Guid.NewGuid();
    public string        EventType   { get; set; } = string.Empty;
    public string        Payload     { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt  { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; set; }
}

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Order>          Orders          => Set<Order>();
    public DbSet<OutboxMessage>  OutboxMessages  => Set<OutboxMessage>();
}

// Command handler — writes domain + outbox in ONE transaction
public class PlaceOrderHandler(AppDbContext db) : IRequestHandler<PlaceOrderCommand, Guid>
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        db.Orders.Add(order);

        // Write event to outbox IN THE SAME TRANSACTION
        var outboxMsg = new OutboxMessage
        {
            EventType = nameof(OrderPlacedEvent),
            Payload   = JsonSerializer.Serialize(new OrderPlacedEvent(order.Id, cmd.CustomerId, order.Total)),
        };
        db.OutboxMessages.Add(outboxMsg);

        await db.SaveChangesAsync(ct); // atomic: order + outbox row together
        return order.Id;
    }
}

// Relay (background service) — polls and publishes
public class OutboxRelay(IServiceScopeFactory scopeFactory, IMessageBroker broker)
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
            .Take(50)
            .ToListAsync(ct);

        foreach (var msg in pending)
        {
            await broker.PublishAsync(msg.EventType, msg.Payload, ct);
            msg.ProcessedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }
}

// Register relay
builder.Services.AddHostedService<OutboxRelay>();`,
  },
  {
    label: 'MassTransit Built-In Outbox',
    language: 'csharp',
    code: `// MassTransit 8+ transactional outbox — minimal configuration
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderPlacedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");

        // Built-in outbox — stores messages in EF Core tables
        cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
        cfg.UseEntityFrameworkOutbox<AppDbContext>(ctx);

        cfg.ConfigureEndpoints(ctx);
    });

    // Register EF Core outbox with cleanup
    x.AddEntityFrameworkOutbox<AppDbContext>(o =>
    {
        o.UseSqlServer();       // or UsePostgres()
        o.UseBusOutbox();       // enable transactional outbox for IPublishEndpoint
        o.QueryDelay = TimeSpan.FromSeconds(1);
    });
});

// Consumer — publish goes to outbox automatically (same DbContext transaction)
public class PlaceOrderConsumer(AppDbContext db, IPublishEndpoint publish)
    : IConsumer<PlaceOrderCommand>
{
    public async Task Consume(ConsumeContext<PlaceOrderCommand> ctx)
    {
        var order = Order.Create(ctx.Message.CustomerId, ctx.Message.Items);
        db.Orders.Add(order);

        // This publish is deferred to the outbox — not published until after SaveChanges
        await publish.Publish(new OrderPlacedEvent(order.Id, order.Total));

        await db.SaveChangesAsync(ctx.CancellationToken);
        // MassTransit's outbox relay publishes the event after commit
    }
}

// EF Core migration adds outbox tables automatically
// dotnet ef migrations add AddOutbox`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Publishing to the broker AFTER SaveChanges (dual-write without outbox)',
    wrong: `await db.SaveChangesAsync(); // commit domain
await bus.Publish(new OrderPlaced(order.Id)); // separate publish — can fail!`,
    right: `// Write event to outbox IN the same SaveChanges transaction
// Relay publishes from outbox after the fact`,
    explanation: 'Publishing after SaveChanges creates the dual-write problem: if publish fails, the event is lost. The order exists but downstream services never know. Always write to the outbox as part of the same database transaction as the domain change.',
  },
  {
    title: 'Not making consumers idempotent (outbox guarantees at-least-once)',
    wrong: `public async Task Consume(OrderPlacedEvent e)
{
    await shippingService.CreateShipment(e.OrderId); // called twice = two shipments!
}`,
    right: `if (await db.Shipments.AnyAsync(s => s.OrderId == e.OrderId)) return; // idempotency check
await shippingService.CreateShipment(e.OrderId);`,
    explanation: 'The outbox pattern guarantees at-least-once delivery — the relay may publish the same event twice (e.g. crash after publish, before marking as processed). Consumers must check if they already processed an event and skip if so.',
  },
  {
    title: 'Letting the outbox table grow without cleanup',
    wrong: `// Mark as processed but never delete old rows
// Outbox table grows to millions of rows; queries slow to a crawl`,
    right: `// Delete processed rows older than N days (e.g. 7 days for audit)
// Or use MassTransit's built-in cleanup: o.QueryDelay + CleanupInterval`,
    explanation: 'Outbox rows must be cleaned up after a retention period. Accumulating millions of processed rows degrades query performance and wastes storage. Schedule a cleanup job or configure the framework\'s built-in cleanup.',
  },
  {
    title: 'Using the Outbox pattern for in-process events (same process, same DB)',
    wrong: `// Raising domain events between aggregates in the same service
// Using outbox for local domain event dispatch`,
    right: `// In-process: use MediatR domain events or Observer pattern
// Outbox: for events that cross service/process boundaries (message broker)`,
    explanation: 'Outbox adds infrastructure complexity (outbox table, relay, idempotency). It is only needed when events must cross process/service boundaries reliably. For domain events within the same service, use in-process dispatch (MediatR notifications).',
  },
];

const challenge: Challenge = {
  title: 'In-Memory Outbox Relay',
  language: 'typescript',
  description: `Simulate the Outbox pattern in memory.
OutboxStore has: write(event), getPending(), markPublished(id).
Relay: publishes pending events and marks them published.
Demonstrate: event written with domain change, relay publishes asynchronously.`,
  hints: [
    'OutboxMessage has id, eventType, payload, published flag',
    'write() adds to pending (simulates DB write)',
    'relay() calls getPending, "publishes" each, marks published',
  ],
  starterCode: `interface OutboxMessage { id: string; eventType: string; payload: string; published: boolean; }

class OutboxStore {
  private messages: OutboxMessage[] = [];
  write(eventType: string, payload: string): void { /* TODO */ }
  getPending(): OutboxMessage[] { /* TODO */ return []; }
  markPublished(id: string): void { /* TODO */ }
}

async function relay(store: OutboxStore): Promise<void> { /* TODO */ }`,
  solution: `interface OutboxMessage { id: string; eventType: string; payload: string; published: boolean; }

class OutboxStore {
  private messages: OutboxMessage[] = [];
  private nextId = 1;

  write(eventType: string, payload: string): void {
    this.messages.push({ id: String(this.nextId++), eventType, payload, published: false });
    console.log(\`[Outbox] Stored: \${eventType}\`);
  }

  getPending(): OutboxMessage[] {
    return this.messages.filter(m => !m.published);
  }

  markPublished(id: string): void {
    const msg = this.messages.find(m => m.id === id);
    if (msg) msg.published = true;
  }
}

async function relay(store: OutboxStore): Promise<void> {
  const pending = store.getPending();
  for (const msg of pending) {
    console.log(\`[Relay] Publishing \${msg.eventType}: \${msg.payload}\`);
    store.markPublished(msg.id);
  }
  console.log(\`[Relay] Published \${pending.length} event(s)\`);
}

// Simulate: place order + write outbox (one "transaction")
const outbox = new OutboxStore();
console.log('[App] Saving order ORD-001 and writing outbox...');
outbox.write('OrderPlaced', JSON.stringify({ orderId: 'ORD-001', total: 99.99 }));

// Relay runs asynchronously after commit
console.log('[App] Transaction committed.');
await relay(outbox);`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What problem does the Outbox pattern solve?',
    options: [
      'Slow database queries when writing large amounts of data',
      'The dual-write problem: database commit and message broker publish are two separate operations that can fail independently',
      'Message broker overload from too many concurrent publishers',
      'Circular dependencies between microservices',
    ],
    answer: 1,
    explanation: 'Without the outbox, publishing after SaveChanges creates two independent writes. If the DB commits but the broker publish fails, the event is lost (or vice versa). The outbox writes both the domain change and the event in ONE database transaction, then a relay publishes from the outbox asynchronously.',
  },
  {
    q: 'Why must Outbox consumers be idempotent?',
    options: [
      'Because the outbox guarantees exactly-once delivery',
      'Because the relay may publish the same event more than once (at-least-once delivery)',
      'Because consumers run in parallel and could race',
      'Because the outbox table may contain duplicate events from multiple writes',
    ],
    answer: 1,
    explanation: 'The outbox relay guarantees at-least-once delivery — if it crashes after publishing but before marking the row as processed, it will re-publish on restart. Consumers must check if they already processed an event (idempotency key) to avoid duplicate side effects.',
  },
  {
    q: 'What is Change Data Capture (CDC) in the context of the Outbox pattern?',
    options: [
      'A way to capture user input changes in a form',
      'Reading the database transaction log (WAL) to detect new outbox rows — an alternative to polling',
      'A CDC algorithm that compresses outbox messages before publishing',
      'A version control system for database schema changes',
    ],
    answer: 1,
    explanation: 'CDC (via tools like Debezium) reads the database write-ahead log (WAL) to detect new rows in the outbox table — no polling needed. This gives near-real-time publishing with lower database load than a polling relay. Debezium + Kafka is the standard CDC stack for Postgres and SQL Server.',
  },
  { q: 'What problem does the Transactional Outbox pattern solve?', options: ['Duplicate messages being consumed by multiple competing consumers', 'The dual-write problem: ensuring that both a database update and a message publish either both succeed or both fail, without requiring a distributed transaction', 'Outbox solves message ordering by ensuring FIFO delivery', 'Outbox solves message routing when the destination queue is unknown at write time'], answer: 1, explanation: 'The dual-write problem: in a microservice, you update the database and then publish an event to a message broker (Kafka, RabbitMQ). If the broker publish fails after the database commit, the event is lost. If the app crashes after publishing but before committing, you published an event for a failed transaction. The Outbox pattern: write the database update AND the event record in the same local transaction. A separate relay process reads the outbox and publishes events to the broker. The database transaction is the unit of atomicity; broker delivery is separate and retried on failure.' },
  { q: 'How does a message relay (publisher) work in the Transactional Outbox?', options: ['The relay is called synchronously within the transaction before commit', 'An asynchronous background process polls or tail-reads the outbox table and publishes unpublished events to the message broker, marking them published after successful delivery', 'The relay is invoked by a database trigger on the outbox table insert', 'The relay runs on a schedule every hour to batch-publish accumulated events'], answer: 1, explanation: 'The relay (publisher) is a background process separate from the main application transaction. Two approaches: polling: periodically SELECT unpublished events from the outbox, publish each to the broker, mark as published. Simple but has latency proportional to the polling interval and may add load to the database. Change Data Capture (CDC): tools like Debezium tail the database transaction log, detecting new outbox rows and forwarding them to Kafka. Near-real-time, no polling. Lower database load. The relay must be idempotent: if it fails after publishing but before marking as published, it will republish the event on retry; consumers must handle duplicates.' },
  { q: 'How do consumers handle duplicate events published by the Outbox relay?', options: ['The Outbox relay guarantees exactly-once delivery so consumers need not handle duplicates', 'Consumers implement idempotent processing: use a unique message ID to detect and skip already-processed events using a processed-messages table or cache', 'The message broker deduplicates events before delivering to consumers', 'Duplicates are prevented by the database unique constraint on the outbox table'], answer: 1, explanation: 'The Outbox pattern provides at-least-once delivery (the relay may publish duplicates on retry). Consumers must be idempotent: each event has a unique ID. Before processing, the consumer checks if the ID is in a processed-events store (database table, Redis set). If yes, skip. If no, process and record the ID atomically. This idempotency check-and-process should itself be in a transaction. Exactly-once semantics require coordinating both the Outbox (producer side) and idempotent consumers (consumer side). Kafka transactions + transactional consumers can approach exactly-once but at a cost of complexity.' },
];

const qna: QnaItem[] = [
  {
    q: 'How does MassTransit\'s built-in transactional outbox work?',
    a: 'MassTransit 8+ stores messages published via IPublishEndpoint in outbox tables (InboxState, OutboxMessage, OutboxState) in the same DbContext. When SaveChangesAsync is called, the messages are committed to the outbox tables in the same transaction as domain changes. An IHostedService relay polls the outbox and delivers messages to the broker asynchronously. Configure with AddEntityFrameworkOutbox<DbContext>() and UseEntityFrameworkOutbox().',
  },
  {
    q: 'Is the Outbox pattern the same as the Inbox pattern?',
    a: 'Related but different. The Outbox pattern ensures reliable message publishing from a producer. The Inbox pattern ensures idempotent message processing at a consumer: each incoming message is recorded in an inbox table; if the same message arrives again, it is skipped. Together they provide end-to-end exactly-once processing semantics in distributed systems.',
  },
  { q: 'What is Change Data Capture (CDC) and how does it relate to the Outbox pattern?', a: 'CDC reads the database transaction log (WAL in PostgreSQL, binlog in MySQL, redo log in Oracle) and streams changes to downstream systems. In the Outbox pattern with CDC: instead of polling the outbox table with SELECT queries, Debezium (or similar CDC tool) monitors the database log for inserts to the outbox table and forwards them to Kafka. Advantages over polling: lower database load (reads the log, not the table), near-zero latency, captures all changes including those made via tools outside the application. Trade-off: requires CDC tooling setup and operational overhead. Debezium Kafka Connector is the most common CDC implementation for the Outbox pattern.' },
  { q: 'How does the Inbox pattern complement the Outbox pattern?', a: 'The Inbox pattern is the consumer-side complement. When a consumer receives a message: insert the message ID into an inbox table within the same database transaction that processes the message. Before processing, check if the message ID already exists in the inbox. If yes, the message was already processed; skip it. If no, process and insert atomically. This ensures exactly-once processing semantics for the consumer. Outbox ensures at-least-once reliable publishing from the producer. Inbox ensures idempotent at-most-once processing on the consumer. Together they implement the reliable event-driven integration pattern that approximates end-to-end exactly-once semantics without a distributed transaction coordinator.' },
  { q: 'What are the operational challenges of the Outbox pattern?', a: 'Challenges: outbox table grows indefinitely if events are not cleaned up after successful publishing. Implement retention: delete published events after N days or after the relay confirms delivery. Performance: under high write volume, the outbox table can become a hot spot. Mitigate with partitioning or archiving. Relay failure: if the relay is down, events accumulate in the outbox but are not delivered. Monitor relay lag (outbox queue depth). Ordering: outbox events may be published out of order if the relay processes in parallel. Use ordered Kafka partitions or single-threaded relay per aggregate type to preserve ordering. Schema evolution: outbox event payloads must be versioned and backward compatible as the schema changes.' },
  { q: 'When should you use the Outbox pattern vs. a distributed transaction (2PC)?', a: 'Two-phase commit (2PC) coordinates a transaction across the database and message broker simultaneously, providing exactly-once semantics. Drawbacks: requires both systems to support 2PC (most cloud-managed databases and brokers do not), blocks resources during coordination, reduces throughput, and is a single point of failure if the coordinator fails. Outbox avoids 2PC entirely by using a local database transaction for both the data update and the event record, then delivering asynchronously. Use Outbox when: 2PC is unavailable (cloud-managed services), you can accept at-least-once delivery with idempotent consumers, and you need high throughput. Use 2PC only when you have infrastructure support and the latency and complexity are acceptable.' },
];

const revision: RevisionSummary = {
  oneLiner: 'The Outbox pattern solves the dual-write problem: write domain changes and outgoing events in ONE database transaction; a relay publishes from the outbox to the broker asynchronously.',
  mustKnow: [
    'Dual-write problem: DB commit + broker publish are two operations that can fail independently',
    'Solution: write event to outbox table IN THE SAME transaction as the domain change',
    'A relay (background service) publishes outbox rows to the broker after the transaction commits',
    'Outbox guarantees at-least-once delivery — consumers must be idempotent',
    'MassTransit 8+ has built-in EF Core transactional outbox (AddEntityFrameworkOutbox)',
  ],
  interviewFocus: [
    'What is the dual-write problem and how does the Outbox solve it?',
    'Why does the Outbox only guarantee at-least-once, not exactly-once?',
    'What is CDC and when would you use it instead of polling?',
  ],
};

@Component({
  selector: 'app-dp-outbox',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './outbox.html',
  styleUrl: './outbox.scss',
})
export class DpOutbox {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
