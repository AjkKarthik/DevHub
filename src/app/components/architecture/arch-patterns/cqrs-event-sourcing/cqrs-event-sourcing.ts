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

@Component({
  selector: 'app-arch-cqrs-event-sourcing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cqrs-event-sourcing.html',
  styleUrl: './cqrs-event-sourcing.scss',
})
export class ArchCqrsEventSourcing {

  quickRef: QuickRefItem[] = [
    { name: 'CQRS', type: 'keyword', desc: 'Command Query Responsibility Segregation — separate write model (commands) from read model (queries)' },
    { name: 'Command', type: 'keyword', desc: 'Intent to change state — PlaceOrder, CancelOrder; returns void or an ID' },
    { name: 'Query', type: 'keyword', desc: 'Read-only request — GetOrderById; never mutates state' },
    { name: 'Event Sourcing', type: 'keyword', desc: 'Store state as an append-only log of events; current state = replay of all events' },
    { name: 'Event Store', type: 'keyword', desc: 'Append-only database for domain events — EventStoreDB, Cosmos DB, custom table' },
    { name: 'Projection', type: 'keyword', desc: 'A read model built by replaying events — optimised for a specific query pattern' },
    { name: 'Snapshot', type: 'keyword', desc: 'Periodic checkpoint of aggregate state to avoid replaying all events from the beginning' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CQRS — Separate Read and Write',
      points: [
        'Traditional CRUD: the same model handles reads and writes. This creates tension when read/write access patterns differ greatly.',
        'CQRS splits: Commands mutate state via the domain model. Queries return read-optimised projections — no domain objects.',
        'Write side: rich domain model with invariants, optimised for consistency.',
        'Read side: denormalised projections (flat DTOs from a view or materialized table), optimised for query performance.',
        'Simple CQRS: one database, two models. Full CQRS: separate read/write databases, eventually consistent.',
      ],
    },
    {
      heading: 'Event Sourcing — State as an Event Log',
      points: [
        'Instead of storing current state (UPDATE orders SET status = "confirmed"), store every event that ever happened.',
        'Event log: [OrderCreated, LineAdded, LineAdded, OrderConfirmed, PaymentCharged, OrderShipped].',
        'Current state is derived by replaying events. The log is the source of truth.',
        'Benefits: complete audit trail, replay to rebuild projections, time-travel debugging, ability to derive new read models from history.',
        'CQRS + Event Sourcing: commands produce events (write side); events are projected into read models (read side).',
      ],
    },
    {
      heading: 'When to Use — and When Not To',
      points: [
        'Good fit: financial systems needing audit trails, booking systems with complex state machines, collaborative editing, anything needing "what was the state at T?".',
        'Avoid: simple CRUD apps with no complex business logic. The overhead (event store, projections, eventual consistency) far outweighs the benefit.',
        'Eventual consistency: after a command, the read model may be seconds behind. Design the UI to handle stale reads (optimistic UI, polling).',
        'Complexity budget: CQRS+ES is a significant investment. Start with simple CQRS (same DB, two models) before going full event sourcing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CQRS — Commands & Queries',
      language: 'typescript',
      code: `// WRITE SIDE — domain model with invariants
class Order {
  private events: DomainEvent[] = [];
  private lines: OrderLine[] = [];
  private status: 'draft' | 'confirmed' = 'draft';

  static create(customerId: string): Order {
    const o = new Order();
    o.apply(new OrderCreatedEvent(generateId(), customerId));
    return o;
  }

  addLine(productId: string, qty: number, price: number): void {
    if (this.status !== 'draft') throw new Error('Cannot modify confirmed order');
    this.apply(new LineAddedEvent(productId, qty, price));
  }

  confirm(): void {
    if (this.lines.length === 0) throw new Error('Order has no lines');
    this.apply(new OrderConfirmedEvent());
  }

  private apply(event: DomainEvent): void {
    this.when(event);        // update state
    this.events.push(event); // record for persistence
  }

  private when(event: DomainEvent): void {
    if (event instanceof LineAddedEvent) this.lines.push({ ...event });
    if (event instanceof OrderConfirmedEvent) this.status = 'confirmed';
  }
}

// READ SIDE — flat DTO, no domain logic
async function getOrderSummary(orderId: string): Promise<OrderSummaryDto> {
  // Query directly from read model (denormalised view)
  return db.query(
    'SELECT id, customer_name, status, total FROM order_summaries WHERE id = $1',
    [orderId]
  ).then(r => r.rows[0]);
}`
    },
    {
      label: 'Event Store + Projection',
      language: 'typescript',
      code: `// Event Store — append-only
interface StoredEvent {
  streamId: string;       // e.g., "order-abc123"
  position: number;       // sequence number in stream
  type: string;           // "OrderCreated"
  data: unknown;
  occurredAt: string;
}

class EventStore {
  async append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    // Optimistic concurrency: fail if another command already changed this stream
    const current = await this.getCurrentVersion(streamId);
    if (current !== expectedVersion) throw new Error('Concurrency conflict');
    for (const [i, event] of events.entries()) {
      await db.query(
        'INSERT INTO events (stream_id, position, type, data, occurred_at) VALUES ($1,$2,$3,$4,NOW())',
        [streamId, expectedVersion + i + 1, event.constructor.name, JSON.stringify(event)]
      );
    }
  }

  async load(streamId: string): Promise<StoredEvent[]> {
    return db.query('SELECT * FROM events WHERE stream_id=$1 ORDER BY position', [streamId])
      .then(r => r.rows);
  }
}

// Projection — rebuild read model from events
async function buildOrderSummaryProjection(streamId: string): Promise<void> {
  const events = await eventStore.load(streamId);
  let summary = { id: streamId, lineCount: 0, total: 0, status: 'draft' };

  for (const e of events) {
    if (e.type === 'LineAddedEvent') { summary.lineCount++; summary.total += (e.data as any).price; }
    if (e.type === 'OrderConfirmedEvent') { summary.status = 'confirmed'; }
  }

  await db.query('INSERT INTO order_summaries VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE ...',
    [summary.id, summary.lineCount, summary.total, summary.status]);
}`
    },
    {
      label: 'Snapshots',
      language: 'typescript',
      code: `// Snapshot — avoid replaying 10,000 events every load
interface Snapshot {
  streamId: string;
  version: number;
  state: unknown;         // serialised aggregate state
  takenAt: string;
}

async function loadWithSnapshot(streamId: string): Promise<Order> {
  // 1. Load latest snapshot
  const snapshot = await snapshotStore.getLatest(streamId);
  const fromVersion = snapshot?.version ?? 0;

  // 2. Load only events AFTER the snapshot
  const events = await eventStore.loadFrom(streamId, fromVersion);

  // 3. Restore aggregate: start from snapshot state, then replay recent events
  const order = snapshot
    ? Order.restoreFromSnapshot(snapshot.state)
    : new Order();

  for (const e of events) order.rehydrate(e);
  return order;
}

// Save snapshot every 50 events
async function saveIfNeeded(order: Order): Promise<void> {
  await eventStore.append(order.id, order.uncommittedEvents, order.version - 1);
  order.clearEvents();

  if (order.version % 50 === 0) {
    await snapshotStore.save({
      streamId: order.id,
      version: order.version,
      state: order.toSnapshot(),
      takenAt: new Date().toISOString(),
    });
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Applying CQRS+ES to a simple CRUD app',
      wrong: `// Todo app with full CQRS, event store, projections, snapshots`,
      right: `// Use simple CRUD with a single model; add CQRS only when read/write patterns diverge significantly`,
      explanation: 'CQRS+ES adds significant complexity: separate models, eventual consistency, event schema management. Reserve it for genuinely complex domains with audit/replay needs.',
    },
    {
      title: 'Storing commands in the event store instead of events',
      wrong: `// Storing "PlaceOrderCommand" in the event store`,
      right: `// Storing "OrderPlacedEvent" — what happened, not what was requested`,
      explanation: 'Commands may fail. Events are facts that already happened. The event store records history, not intent.',
    },
    {
      title: 'Querying the write model for reads',
      wrong: `// GetOrderById loads the full Order domain object for a simple status display`,
      right: `// GetOrderById queries the read model / projection table directly`,
      explanation: 'Loading and replaying domain events for every read defeats the purpose of CQRS. Read models are denormalised, query-optimised projections.',
    },
    {
      title: 'No snapshot strategy for long-lived aggregates',
      wrong: `// Order with 5,000 events — replays all 5,000 on every load`,
      right: `// Snapshot every 50–100 events; load snapshot + recent events only`,
      explanation: 'Without snapshots, load time grows linearly with the number of events. Long-lived aggregates become unusably slow.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a Simple Event-Sourced Counter',
    language: 'typescript',
    description: `Build an event-sourced Counter aggregate that:
1. Has events: CounterCreated, CounterIncremented, CounterDecremented.
2. Stores all events in an append-only array (event log).
3. Derives current count by replaying all events.
4. Prevents the count from going below 0 (domain invariant).`,
    hints: [
      'Apply each event to update internal state in a when() method',
      'Store events in uncommittedEvents; replay from an events array',
      'Decrement must check count > 0 before applying the event',
      'Count is derived, not stored directly — recomputed by replay',
    ],
    starterCode: `type CounterEvent =
  | { type: 'CounterCreated'; id: string }
  | { type: 'CounterIncremented' }
  | { type: 'CounterDecremented' };

class Counter {
  private _count = 0;
  readonly uncommittedEvents: CounterEvent[] = [];

  // TODO: static create(id: string): Counter
  // TODO: increment(): void
  // TODO: decrement(): void
  // TODO: static rehydrate(events: CounterEvent[]): Counter
  get count() { return this._count; }
}`,
    solution: `type CounterEvent =
  | { type: 'CounterCreated'; id: string }
  | { type: 'CounterIncremented' }
  | { type: 'CounterDecremented' };

class Counter {
  private _count = 0;
  readonly uncommittedEvents: CounterEvent[] = [];

  static create(id: string): Counter {
    const c = new Counter();
    c.apply({ type: 'CounterCreated', id });
    return c;
  }

  increment(): void {
    this.apply({ type: 'CounterIncremented' });
  }

  decrement(): void {
    if (this._count <= 0) throw new Error('Counter cannot go below 0');
    this.apply({ type: 'CounterDecremented' });
  }

  private apply(event: CounterEvent): void {
    this.when(event);
    this.uncommittedEvents.push(event);
  }

  private when(event: CounterEvent): void {
    if (event.type === 'CounterIncremented') this._count++;
    if (event.type === 'CounterDecremented') this._count--;
  }

  static rehydrate(events: CounterEvent[]): Counter {
    const c = new Counter();
    for (const e of events) c.when(e);
    return c;
  }

  get count() { return this._count; }
}

// Demo
const c = Counter.create('c1');
c.increment(); c.increment(); c.decrement();
console.log('Count:', c.count); // 1
const rebuilt = Counter.rehydrate(c.uncommittedEvents);
console.log('Rebuilt count:', rebuilt.count); // 1`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does CQRS stand for and what does it separate?',
      options: [
        'Command Queue Response System — queues from responses',
        'Command Query Responsibility Segregation — write model (commands) from read model (queries)',
        'Cache Query Result Strategy — cache from live data',
        'Central Queue Routing Service — routing from delivery',
      ],
      answer: 1,
      explanation: 'CQRS separates the write model (domain model handling commands) from the read model (projections optimised for queries).',
    },
    {
      q: 'In Event Sourcing, what is the source of truth?',
      options: [
        'The current state in the relational database',
        'The append-only event log',
        'The snapshot table',
        'The read model projection',
      ],
      answer: 1,
      explanation: 'The event log is the source of truth. Current state is derived by replaying events. Projections and snapshots are derived views.',
    },
    {
      q: 'What problem do snapshots solve in Event Sourcing?',
      options: [
        'They reduce storage requirements',
        'They prevent replaying thousands of events on every aggregate load',
        'They eliminate the need for projections',
        'They make commands synchronous',
      ],
      answer: 1,
      explanation: 'Without snapshots, loading an aggregate with many events requires replaying all of them. Snapshots checkpoint the state periodically.',
    },
    { q: 'What is the core idea behind Command Query Responsibility Segregation (CQRS)?', options: ['Using different database technologies for commands and queries', 'Separating the models used for reading data from those used for writing data, allowing each to be optimized independently', 'Running queries on replicas and commands on the primary database', 'Caching query results to avoid recomputing them on every read'], answer: 1, explanation: 'CQRS separates the command model (write side: handles state changes via commands, enforces business rules) from the query model (read side: handles data retrieval via queries, often denormalized and optimized for specific views). Commands change state; queries return state without changing it. The key insight: the optimal model for writing is often different from the optimal model for reading. The query model can be a pre-materialized view that is trivial to read without joins, while the command model enforces business rules on normalized data.' },
    { q: 'What is event sourcing and how does it differ from traditional state storage?', options: ['Event sourcing stores only the current state with timestamps', 'Event sourcing stores the complete history of domain events that led to the current state; the current state is derived by replaying events', 'Event sourcing is a database backup strategy that replays WAL logs for recovery', 'Event sourcing is another name for the CQRS pattern'], answer: 1, explanation: 'Traditional storage: persist the current state of an entity. When state changes, overwrite the old state. Event sourcing: never overwrite. Instead, append an event describing each state change. OrderPlaced, ItemAdded, PaymentProcessed, OrderShipped. The current state is computed by replaying all events from the beginning. Benefits: complete audit trail, ability to reconstruct any past state (temporal queries), and the event log naturally provides the data for building read-side projections. The tradeoff is that reading current state requires replaying events, which is mitigated by snapshots.' },
    { q: 'Why do CQRS and event sourcing naturally fit together?', options: ['They are the same pattern and cannot be used separately', 'Event sourcing provides the event log that drives CQRS read-side projection updates, and CQRS provides the query models that efficiently serve reads without replaying events each time', 'Both patterns require separate databases and cannot share infrastructure', 'CQRS requires eventual consistency which only event sourcing can provide'], answer: 1, explanation: 'Event sourcing produces a log of domain events. These events naturally drive CQRS read-side projections: event handlers consume domain events and maintain denormalized read models optimized for specific queries. The event log is the source of truth for the write side; the projection stores are derived views for the read side. Each pattern benefits from the other: event sourcing gains efficient reads via CQRS projections; CQRS gains a natural write-side audit trail and temporal query capability via event sourcing. They are often combined but can be used independently.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use CQRS without Event Sourcing?',
      a: 'Absolutely. Simple CQRS: one database, write operations go through the domain model, read operations query a denormalised view or table directly. Event Sourcing adds further complexity. Start with simple CQRS and only adopt Event Sourcing when audit trails or event replay are genuinely needed.',
    },
    {
      q: 'How do you handle eventual consistency in the UI?',
      a: 'Optimistic updates: show the user the expected result immediately after a command, assume it will succeed. If it fails, show an error and roll back. Alternatively, poll the read model until it reflects the command\'s effect. Avoid blocking the UI waiting for the projection to update.',
    },
    {
      q: 'What is optimistic concurrency in Event Sourcing?',
      a: 'When appending events to a stream, you specify the expected version (how many events you loaded). If someone else has appended events since you loaded, the expected version does not match the actual version — the store rejects your append. You reload and retry, resolving the conflict in domain logic.',
    },
    { q: 'What is a projection in event sourcing and how is it built?', a: 'A projection is a derived read model built by consuming and processing domain events. For example, an OrderSummaryProjection listens to OrderPlaced, OrderShipped, and OrderCancelled events and maintains a denormalized table with one row per order, storing all the fields needed for the order list page. Projections can be rebuilt from scratch by replaying the entire event log if the read model becomes corrupted or needs restructuring. Multiple projections can be built from the same event log, each optimized for a different query pattern. Projections are eventually consistent: they lag behind the write side by the event propagation delay, so a command that just completed may not yet be reflected in the query model.' },
    { q: 'What is a snapshot in event sourcing and when do you need one?', a: 'In event sourcing, reading current state requires replaying all events from the beginning. For entities with thousands of events, this replay becomes slow. A snapshot captures the state of an entity at a specific event sequence number. When loading the entity, start from the most recent snapshot and replay only events that occurred after it, dramatically reducing replay time. Create snapshots periodically (e.g., every 100 events) or on demand for entities with high event volume. Store snapshots alongside events in the event store or separately. Snapshots are a performance optimization, not the source of truth; the event log remains authoritative.' },
    { q: 'What are the main challenges of implementing event sourcing in practice?', a: 'Key challenges: event schema evolution is hard because old events must always be replayable with the current code. Add new fields as optional with defaults rather than required fields that break old events. Use upcasters to transform old event versions to the current version during replay. Eventual consistency: queries return slightly stale data immediately after commands. Design the UI to show loading states or optimistic updates. Debugging: understanding current state requires replaying events, which is harder than inspecting a current-state database row. Event store performance: all writes are appends which are fast, but snapshotting requires occasional reads. Avoid business logic in event handlers; handlers should only update projections based on events, not make decisions.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CQRS separates read and write models for independent scaling; Event Sourcing stores state as an append-only event log enabling audit trails, replay, and new projections.',
    mustKnow: [
      'CQRS: commands mutate via domain model; queries read from denormalised projections',
      'Event Sourcing: state = replay of all events; log is the source of truth',
      'Projection: read model rebuilt by processing the event stream',
      'Snapshot: periodic checkpoint to avoid replaying all events on load',
      'Apply only when audit trails, replay, or complex state machines justify the complexity',
    ],
    interviewFocus: [
      'Explain CQRS — what problem does separating reads and writes solve?',
      'How is current state derived in Event Sourcing?',
      'When would you NOT use CQRS+Event Sourcing?',
    ],
  };
}
