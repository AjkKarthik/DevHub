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
  selector: 'app-arch-aggregates-domain-events',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './aggregates-domain-events.html',
  styleUrl: './aggregates-domain-events.scss',
})
export class ArchAggregatesDomainEvents {

  quickRef: QuickRefItem[] = [
    { name: 'Aggregate', type: 'keyword', desc: 'A cluster of entities and value objects with a single Aggregate Root as the only entry point' },
    { name: 'Aggregate Root', type: 'keyword', desc: 'The entity through which all external interactions with the aggregate must pass' },
    { name: 'Invariant', type: 'keyword', desc: 'A business rule that must always be true within an aggregate (e.g., order total ≥ 0)' },
    { name: 'Aggregate Boundary', type: 'keyword', desc: 'The scope of transactional consistency — aggregates are loaded and saved as a unit' },
    { name: 'Domain Event', type: 'keyword', desc: 'An immutable record of something that happened within the domain, raised by the aggregate' },
    { name: 'Transactional Consistency', type: 'keyword', desc: 'Within one aggregate, all changes are atomic. Cross-aggregate = eventual consistency via events' },
    { name: 'Reference by ID', type: 'keyword', desc: 'Aggregates reference other aggregates by their ID only — never hold a direct object reference' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Aggregates — Consistency Boundaries',
      points: [
        'An aggregate defines the boundary of transactional consistency: everything inside one aggregate is strongly consistent.',
        'The aggregate root is the single entry point. External code holds a reference only to the root, never to internal entities.',
        'Keep aggregates small: one or two entity types plus value objects. Large aggregates cause lock contention under concurrent load.',
        'Cross-aggregate operations use eventual consistency via domain events — not distributed transactions.',
        'Aggregates reference other aggregates by ID only. Never navigate from Order to Customer to get the address — call the Customer service.',
      ],
    },
    {
      heading: 'Domain Events — Communicating What Happened',
      points: [
        'Domain events are raised by the aggregate when something significant happens: Order.confirm() raises OrderConfirmedEvent.',
        'Events are collected on the aggregate and published AFTER the transaction commits — not before.',
        'Domain events enable loose coupling: the Notification service subscribes to OrderConfirmed without the Order service knowing about it.',
        'Events are facts — immutable, past tense, containing the data that downstream services need.',
        'Naming convention: EntityVerbed — OrderPlaced, PaymentCharged, ShipmentDispatched.',
      ],
    },
    {
      heading: 'Designing Aggregate Boundaries',
      points: [
        'Ask: what invariants must always be true together? Those entities belong in the same aggregate.',
        'Order + OrderLines are one aggregate: the total must always match the sum of lines — they must change together.',
        'Order and Customer are separate aggregates: no invariant spans both. Reference Customer by ID.',
        'Rule: one aggregate root per transaction. If you need to modify two aggregates, use domain events to trigger the second modification asynchronously.',
      ],
    },
    {
      heading: 'Aggregate Boundaries and Transactional Consistency',
      points: [
        'An aggregate defines a transactional consistency boundary — invariants that must hold true (an order total matching the sum of its line items) are enforced WITHIN a single aggregate\'s transaction, never spanning multiple aggregates in one atomic operation.',
        'Referencing another aggregate by ID (not by direct object reference) is the standard DDD practice — this keeps aggregates small and independently persistable, avoiding the temptation to load and modify multiple aggregates within a single transaction.',
        'Designing aggregates too large (encompassing more entities than necessary) creates unnecessary contention — concurrent updates to unrelated parts of an overly large aggregate compete for the same lock, hurting throughput without any corresponding consistency benefit.',
        'Designing aggregates too small (splitting genuinely related invariants across multiple aggregates) forces eventual consistency (via domain events) where true transactional consistency was actually needed, risking a temporary invalid state that the application must explicitly tolerate.',
      ],
    },
    {
      heading: 'Domain Events for Cross-Aggregate Consistency',
      points: [
        'When a business rule spans multiple aggregates (updating inventory after an order is placed), a domain event raised by the originating aggregate — handled asynchronously by a separate process — achieves eventual consistency without violating the single-aggregate transactional boundary.',
        'Domain events should be published only AFTER the originating transaction commits successfully — publishing before commit risks other services reacting to a change that is later rolled back, a subtle but serious correctness bug.',
        'The outbox pattern is the standard mechanism for reliably publishing domain events alongside a database transaction, avoiding the dual-write problem where the aggregate\'s state change and its corresponding event publish could otherwise fall out of sync.',
        'Consumers of domain events must be designed for eventual consistency and idempotent processing, since the event-driven nature of cross-aggregate consistency means there is always a window, however brief, where the overall system is not yet fully consistent.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Aggregate with Domain Events',
      language: 'typescript',
      code: `// Base class — domain event collection
abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected raise(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  get domainEvents(): readonly DomainEvent[] { return this._domainEvents; }
  clearDomainEvents(): void { this._domainEvents = []; }
}

// Domain Events (immutable, past tense)
class OrderPlacedEvent {
  readonly occurredAt = new Date().toISOString();
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
  ) {}
}

class OrderCancelledEvent {
  readonly occurredAt = new Date().toISOString();
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {}
}

// Aggregate Root
class Order extends AggregateRoot {
  private _lines: OrderLine[] = [];
  private _status: 'draft' | 'placed' | 'cancelled' = 'draft';

  constructor(
    public readonly id: string,
    public readonly customerId: string, // reference by ID — not the Customer object
  ) { super(); }

  addLine(productId: string, qty: number, price: Money): void {
    if (this._status !== 'draft') throw new Error('Cannot modify a placed order');
    if (qty <= 0) throw new Error('Quantity must be positive');
    this._lines.push(new OrderLine(productId, qty, price));
  }

  place(): void {
    if (this._lines.length === 0) throw new Error('Order must have at least one line');
    this._status = 'placed';
    this.raise(new OrderPlacedEvent(this.id, this.customerId, this.total.amount));
  }

  cancel(reason: string): void {
    if (this._status === 'cancelled') throw new Error('Already cancelled');
    this._status = 'cancelled';
    this.raise(new OrderCancelledEvent(this.id, reason));
  }

  get total(): Money {
    return this._lines.reduce((sum, l) => sum.add(l.lineTotal), Money.zero());
  }
}`
    },
    {
      label: 'Saving & Publishing Events',
      language: 'typescript',
      code: `// Repository saves aggregate, then application service publishes events
class PlaceOrderHandler {
  constructor(
    private orders: IOrderRepository,
    private events: IDomainEventPublisher,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<string> {
    const order = new Order(generateId(), cmd.customerId);
    for (const line of cmd.lines) {
      const price = await this.catalogService.getPrice(line.productId);
      order.addLine(line.productId, line.qty, price);
    }

    order.place(); // raises OrderPlacedEvent internally

    await this.orders.save(order); // ACID commit — events still pending

    // Publish AFTER commit — events are facts about committed state
    await this.events.publishAll(order.domainEvents);
    order.clearDomainEvents();

    return order.id;
  }
}

// Application service wires the event publication after the transaction
// WRONG: publishing inside the repository or inside the aggregate method
// RIGHT: publish in application layer, after the repo.save() call`
    },
    {
      label: 'Cross-Aggregate via Domain Events',
      language: 'typescript',
      code: `// WRONG — directly loading Customer from inside Order aggregate
class Order extends AggregateRoot {
  // BAD: this reaches outside the aggregate boundary
  async applyLoyaltyDiscount(customerRepo: ICustomerRepository): Promise<void> {
    const customer = await customerRepo.findById(this.customerId); // cross-aggregate!
    if (customer.isVip) { /* apply discount */ }
  }
}

// RIGHT — separate aggregates, eventual consistency via domain event
// Order places itself; emits OrderPlacedEvent
// LoyaltyService (separate bounded context) subscribes and awards points
// CustomerAggregate is updated asynchronously in its own transaction

class LoyaltyEventHandler {
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    const customer = await this.customerRepo.findById(event.customerId);
    customer.addLoyaltyPoints(Math.floor(event.totalAmount));
    await this.customerRepo.save(customer);
    // Customer aggregate updated in its own separate transaction
    // Eventual consistency: points visible after a short delay
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Publishing domain events inside the aggregate method',
      wrong: `// Order.place() calls messageBus.publish() directly`,
      right: `// Order.place() raises event internally; application service publishes after repo.save()`,
      explanation: 'Aggregates should not depend on infrastructure (message bus). The application layer publishes events after the transaction commits — events are facts about committed state.',
    },
    {
      title: 'Navigating from one aggregate to another inside a transaction',
      wrong: `// Loading Customer inside the Order aggregate to check VIP status`,
      right: `// Reference Customer by ID; react to CustomerBecameVip event in a separate transaction`,
      explanation: 'Cross-aggregate navigation inside a single transaction couples aggregates and creates locking contention. Use eventual consistency via events.',
    },
    {
      title: 'Making aggregates too large',
      wrong: `// OrderAggregate contains Order + Customer + Address + Payment + Shipment`,
      right: `// OrderAggregate: Order + OrderLines only. Other aggregates are separate with ID references.`,
      explanation: 'Large aggregates load and lock too much data. Concurrent modifications to different parts cause transaction conflicts. Size by invariant, not by relationship.',
    },
    {
      title: 'Exposing internal aggregate collections directly',
      wrong: `get lines(): OrderLine[] { return this._lines; } // mutable reference exposed`,
      right: `get lines(): readonly OrderLine[] { return [...this._lines]; } // defensive copy`,
      explanation: 'Exposing mutable collections allows external code to bypass the aggregate root and modify internal state without invariant enforcement.',
    },
  ];

  challenge: Challenge = {
    title: 'Add a CancelOrderLine Feature to an Order Aggregate',
    language: 'typescript',
    description: `Extend the Order aggregate to support cancelling a single line:
1. cancelLine(lineId: string): removes the line from the order.
2. An order must have at least one line after cancellation — throw if it would be left empty.
3. Raise an OrderLineCancelledEvent with orderId and the cancelled lineId.
4. Only placed orders (status === 'placed') can have lines cancelled.`,
    hints: [
      'Find the line by id, check count before removing',
      'Raise the event after validation passes',
      'Return defensive copy in get lines()',
    ],
    starterCode: `class OrderLineCancelledEvent {
  constructor(public readonly orderId: string, public readonly lineId: string) {}
}

class OrderLine {
  constructor(public readonly id: string, public readonly productId: string, public readonly qty: number) {}
}

class Order {
  private _lines: OrderLine[];
  private _status: 'draft' | 'placed' = 'draft';
  private _events: object[] = [];

  constructor(public readonly id: string, lines: OrderLine[]) {
    this._lines = [...lines];
  }

  place(): void { this._status = 'placed'; }

  // TODO: cancelLine(lineId: string): void

  get lines(): readonly OrderLine[] { return [...this._lines]; }
  get domainEvents(): object[] { return this._events; }
}`,
    solution: `class OrderLineCancelledEvent {
  constructor(public readonly orderId: string, public readonly lineId: string) {}
}

class OrderLine {
  constructor(public readonly id: string, public readonly productId: string, public readonly qty: number) {}
}

class Order {
  private _lines: OrderLine[];
  private _status: 'draft' | 'placed' = 'draft';
  private _events: object[] = [];

  constructor(public readonly id: string, lines: OrderLine[]) {
    this._lines = [...lines];
  }

  place(): void { this._status = 'placed'; }

  cancelLine(lineId: string): void {
    if (this._status !== 'placed') throw new Error('Can only cancel lines on placed orders');

    const lineIndex = this._lines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) throw new Error(\`Line \${lineId} not found\`);
    if (this._lines.length === 1) throw new Error('Cannot cancel the last line — cancel the order instead');

    this._lines.splice(lineIndex, 1);
    this._events.push(new OrderLineCancelledEvent(this.id, lineId));
  }

  get lines(): readonly OrderLine[] { return [...this._lines]; }
  get domainEvents(): object[] { return this._events; }
}

// Demo
const order = new Order('ord-1', [
  new OrderLine('l1', 'prod-a', 2),
  new OrderLine('l2', 'prod-b', 1),
]);
order.place();
order.cancelLine('l1');
console.log(order.lines.length); // 1
console.log(order.domainEvents); // [OrderLineCancelledEvent]
try { order.cancelLine('l2'); } // throws: last line
catch(e) { console.error((e as Error).message); }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is an invariant in the context of aggregates?',
      options: [
        'A constant variable in the code',
        'A business rule that must always be true within the aggregate boundary',
        'An event that never changes',
        'An immutable value object',
      ],
      answer: 1,
      explanation: 'An invariant is a business rule enforced by the aggregate — e.g., an order total must equal the sum of its line totals. The aggregate root enforces it on every change.',
    },
    {
      q: 'When should domain events be published?',
      options: [
        'Inside the aggregate method when the event is raised',
        'Before the repository save to notify subscribers early',
        'After the repository save commits the transaction',
        'Only when the consumer is online',
      ],
      answer: 2,
      explanation: 'Publish AFTER the transaction commits. Events describe committed facts — publishing before commit means publishing about a state change that might roll back.',
    },
    {
      q: 'How should one aggregate reference another?',
      options: [
        'Hold a direct object reference to the other aggregate',
        'Load the other aggregate inside the aggregate method',
        'Reference by ID only — never hold a direct object reference',
        'Share a database table',
      ],
      answer: 2,
      explanation: 'Aggregates reference each other by ID. Loading another aggregate object inside an aggregate creates cross-aggregate coupling and breaks transactional boundaries.',
    },
    { q: 'What is an aggregate in Domain-Driven Design?', options: ['A database view that joins multiple tables', 'A cluster of domain objects treated as a single unit with a root entity that controls all external access', 'A summary or calculation over a set of domain records', 'A collection of all entities sharing the same bounded context'], answer: 1, explanation: 'An aggregate is a cluster of related objects (entities and value objects) treated as a single consistency unit. The aggregate root is the only object clients reference directly; all access to objects inside the aggregate must go through the root. This enforces invariants: business rules that must always hold within the aggregate. For example, an Order aggregate owns its OrderLines; you cannot modify an OrderLine directly, only through Order methods that enforce business rules like total price recalculation.' },
    { q: 'What is a domain event and when should it be raised?', options: ['A system log entry created whenever a database write occurs', 'An immutable record of something significant that happened in the domain, raised after an invariant-enforcing state change', 'A network event triggered when a microservice receives an HTTP request', 'A periodic event triggered by a scheduler to sync domain state'], answer: 1, explanation: 'A domain event records a meaningful business occurrence, expressed in past tense: OrderPlaced, PaymentProcessed, InventoryReserved. It is raised after an aggregate enforces its invariants and commits a state change. Domain events drive side effects in other parts of the system without tight coupling: the aggregate publishes the event; other aggregates or services react to it. They are not generic technical events but meaningful business concepts that a domain expert would recognize.' },
    { q: 'What is the rule about aggregate boundaries and transactions in DDD?', options: ['One transaction can span multiple aggregates freely for performance', 'Each transaction should modify only one aggregate; cross-aggregate consistency is achieved eventually via domain events', 'Aggregates must always be small to ensure transaction performance', 'Transactions must be avoided in favor of eventual consistency for all domain operations'], answer: 1, explanation: 'A core DDD rule: one transaction modifies one aggregate. This keeps transaction boundaries small and predictable. When a business operation affects multiple aggregates (e.g., an order placement reserves inventory), use domain events for cross-aggregate coordination: the Order aggregate commits and publishes OrderPlaced, and the Inventory aggregate reacts to that event in a separate transaction. This achieves eventual consistency without distributed transactions and keeps aggregates decoupled.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I modify two aggregates in one transaction?',
      a: 'DDD principle: one transaction, one aggregate. Modifying two aggregates in one transaction couples them at the transaction boundary. Use domain events to trigger the second aggregate\'s modification in a separate transaction (eventual consistency). Exception: small, low-concurrency systems where the coupling is acceptable.',
    },
    {
      q: 'What is the difference between a domain event and an integration event?',
      a: 'Domain event: raised within the aggregate, in-process, for cross-aggregate communication within the same bounded context. Integration event: published to a message broker, crosses service/context boundaries. A domain event may be promoted to an integration event by the application layer after the transaction commits.',
    },
    {
      q: 'How do you choose what belongs in an aggregate vs a separate aggregate?',
      a: 'Ask: what invariants must be enforced together? Entities that share an invariant belong in the same aggregate. Entities that can be updated independently (with eventual consistency) belong in separate aggregates. Order + Lines share the total-must-equal-sum invariant → same aggregate. Order + Customer have no shared invariant → separate aggregates.',
    },
    { q: 'How do you determine the right aggregate boundary for a domain model?', a: 'Aggregate boundaries are defined by the business invariants that must be enforced atomically. Ask: which objects must be consistent with each other at all times? If OrderLine totals must always match Order total, they belong in the same aggregate. Objects that can tolerate eventual consistency belong in separate aggregates. Beware of making aggregates too large: large aggregates cause transaction contention and high memory usage. Prefer small aggregates that enforce a tight set of invariants and coordinate with other aggregates via domain events. Look for the noun that business people reference and use it as the aggregate root.' },
    { q: 'How do domain events relate to event sourcing?', a: 'Domain events and event sourcing are related but distinct. Domain events are something an aggregate raises to signal meaningful state changes to other parts of the system. They are optional in DDD and primarily used for integration. Event sourcing uses events as the storage mechanism: instead of storing current state, store the complete history of domain events that produced the current state. Replaying these events rebuilds the current state. Event sourcing naturally produces an audit trail and supports temporal queries. When using both together, the same events serve double duty: stored as the audit trail and published to drive integration between aggregates or services.' },
    { q: 'What is an event handler and how does it react to domain events?', a: 'An event handler subscribes to a specific domain event type and executes side effects when that event occurs. In a monolith, event handlers run in the same process via an in-memory event bus after the aggregate commits. In a microservices architecture, domain events are published to a message broker (Kafka, RabbitMQ) and other services subscribe to receive them. Event handlers must be idempotent because events may be delivered more than once with at-least-once delivery. Best practice: check whether the side effect was already applied before executing it, using an idempotency key derived from the event ID.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Aggregates enforce business invariants within a consistency boundary; domain events communicate what happened to the outside world after the transaction commits.',
    mustKnow: [
      'Aggregate root: single entry point; enforces all invariants within the boundary',
      'Reference other aggregates by ID only — never by object reference',
      'One transaction = one aggregate modification; cross-aggregate = eventual consistency via events',
      'Domain events: raised internally, published after repo.save() commits, past tense',
      'Keep aggregates small — sized by invariant, not by relationship graph',
    ],
    interviewFocus: [
      'How do you decide the boundary of an aggregate?',
      'Why are domain events published after the transaction, not inside the aggregate method?',
      'Explain cross-aggregate consistency — one transaction or eventual?',
    ],
  };
}
