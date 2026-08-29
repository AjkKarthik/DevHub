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
  { name: 'Saga',                type: 'keyword',   desc: 'Manages a long-running distributed transaction across multiple services using compensating transactions instead of 2PC.' },
  { name: 'Choreography',        type: 'keyword',   desc: 'Saga style: services react to events independently — no central coordinator; loose coupling but harder to trace.' },
  { name: 'Orchestration',       type: 'keyword',   desc: 'Saga style: a central orchestrator (saga manager) issues commands to each service and handles failures.' },
  { name: 'Compensating Txn',    type: 'keyword',   desc: 'The rollback equivalent: CancelReservation undoes ReserveInventory when a later step fails.' },
  { name: 'Idempotency',         type: 'keyword',   desc: 'Saga steps must be idempotent — safe to retry on failure without double-applying side effects.' },
  { name: 'MassTransit / Rebus', type: 'class',     desc: '.NET saga frameworks: MassTransit StateMachine or Rebus Saga manage saga state and step coordination.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is a Saga?',
    points: [
      'A Saga is a sequence of local transactions — each service does its part and publishes an event or sends a command.',
      'If a step fails, compensating transactions undo the already-completed steps (eventual rollback).',
      'Sagas avoid distributed 2-phase commit — there is no global lock; each step is atomic locally.',
      'The trade-off: eventual consistency — intermediate states are visible during the saga execution.',
    ],
  },
  {
    heading: 'Choreography vs Orchestration',
    points: [
      'Choreography: services react to domain events — OrderPlaced → InventoryService reserves → PaymentService charges → etc. No coordinator needed.',
      'Orchestration: a Saga Manager sends commands to each service — PlaceOrder saga tells Inventory to reserve, then tells Payment to charge.',
      'Choreography: looser coupling, harder to trace the overall flow.',
      'Orchestration: central visibility of the saga state, easier debugging, but single coordination point.',
    ],
  },
  {
    heading: 'Compensating Transactions',
    points: [
      'Every forward step must have a compensating step: ReserveInventory → ReleaseInventory.',
      'Compensation is not the same as rollback — the forward step already committed; compensation is a new transaction.',
      'Not all steps need compensation: read-only steps or idempotent steps may not require it.',
      'Design compensation from the start — retrofitting it later is error-prone.',
    ],
  },
  {
    heading: 'Saga and Idempotency',
    points: [
      'Messages can be delivered more than once — each saga step must be idempotent.',
      'Use idempotency keys: store the step result with a unique key; if the key exists, return the stored result.',
      'The Outbox pattern pairs with Sagas: publish events reliably as part of a local transaction.',
      'State machine sagas (MassTransit) track which steps are complete and prevent re-execution.',
    ],
  },
  {
    heading: 'Saga as Distributed Transaction Management',
    points: [
      'A Saga coordinates a sequence of local transactions across multiple services, where each step has a corresponding COMPENSATING transaction that can undo its effect if a later step fails — this replaces the atomicity a single distributed transaction would provide with an explicit, application-level recovery mechanism.',
      'Because there is no true atomic rollback across services, a Saga provides eventual consistency rather than the immediate atomicity of a local ACID transaction — the system may be temporarily in a partially-completed state while a saga is mid-flight or while compensations are being applied.',
      'Sagas can be implemented via orchestration (a central coordinator explicitly directing each step) or choreography (each service reacting to events from others with no central coordinator) — the choice affects debuggability, coupling, and how easy it is to add new steps to the saga later.',
      'Designing genuinely reliable compensating transactions is often the hardest part of implementing a Saga — not every operation has a clean, safe undo (sending an email cannot be truly "unsent"), which requires careful saga step ordering and sometimes accepting that certain steps simply cannot be compensated after the fact.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Orchestration Saga (MassTransit)',
    language: 'csharp',
    code: `// Saga state — persisted between steps
public class OrderSagaState : SagaStateMachineInstance
{
    public Guid   CorrelationId    { get; set; } // saga instance ID = order ID
    public string CurrentState     { get; set; } = string.Empty;
    public Guid   CustomerId       { get; set; }
    public decimal Total           { get; set; }
    public Guid   ReservationId    { get; set; }
    public Guid   PaymentId        { get; set; }
}

// MassTransit state machine — orchestrates the saga steps
public class OrderStateMachine : MassTransitStateMachine<OrderSagaState>
{
    public State InventoryReserved { get; private set; } = null!;
    public State PaymentProcessed  { get; private set; } = null!;
    public State OrderConfirmed    { get; private set; } = null!;
    public State Compensating      { get; private set; } = null!;
    public State Failed            { get; private set; } = null!;

    public Event<OrderPlacedEvent>              OrderPlaced             { get; private set; } = null!;
    public Event<InventoryReservedEvent>        InventoryReserved_Event { get; private set; } = null!;
    public Event<InventoryReservationFailed>    InventoryFailed         { get; private set; } = null!;
    public Event<PaymentProcessedEvent>         PaymentProcessed_Event  { get; private set; } = null!;
    public Event<PaymentFailedEvent>            PaymentFailed           { get; private set; } = null!;

    public OrderStateMachine()
    {
        InstanceState(s => s.CurrentState);
        Event(() => OrderPlaced,             e => e.CorrelateById(m => m.Message.OrderId));
        Event(() => InventoryReserved_Event, e => e.CorrelateById(m => m.Message.OrderId));
        Event(() => InventoryFailed,         e => e.CorrelateById(m => m.Message.OrderId));
        Event(() => PaymentProcessed_Event,  e => e.CorrelateById(m => m.Message.OrderId));
        Event(() => PaymentFailed,           e => e.CorrelateById(m => m.Message.OrderId));

        Initially(
            When(OrderPlaced)
                .Then(ctx => { ctx.Saga.CustomerId = ctx.Message.CustomerId; ctx.Saga.Total = ctx.Message.Total; })
                .Publish(ctx => new ReserveInventoryCommand(ctx.Saga.CorrelationId, ctx.Message.Items))
                .TransitionTo(InventoryReserved));

        During(InventoryReserved,
            When(InventoryReserved_Event)
                .Then(ctx => ctx.Saga.ReservationId = ctx.Message.ReservationId)
                .Publish(ctx => new ProcessPaymentCommand(ctx.Saga.CorrelationId, ctx.Saga.Total))
                .TransitionTo(PaymentProcessed),
            When(InventoryFailed)
                .Publish(ctx => new NotifyOrderFailedCommand(ctx.Saga.CorrelationId, "Inventory unavailable"))
                .TransitionTo(Failed));

        During(PaymentProcessed,
            When(PaymentProcessed_Event)
                .Then(ctx => ctx.Saga.PaymentId = ctx.Message.PaymentId)
                .Publish(ctx => new ConfirmOrderCommand(ctx.Saga.CorrelationId))
                .TransitionTo(OrderConfirmed),
            When(PaymentFailed)
                // Compensate: release inventory reservation
                .Publish(ctx => new ReleaseInventoryCommand(ctx.Saga.ReservationId))
                .TransitionTo(Compensating));

        During(Compensating,
            Ignore(InventoryReserved_Event)); // absorb late events
    }
}

// Registration
builder.Services.AddMassTransit(x =>
{
    x.AddSagaStateMachine<OrderStateMachine, OrderSagaState>()
     .EntityFrameworkRepository(r =>
     {
         r.ConcurrencyMode = ConcurrencyMode.Optimistic;
         r.AddDbContext<OrderSagaDbContext>(...);
     });
});`,
  },
  {
    label: 'Choreography Saga',
    language: 'csharp',
    code: `// No coordinator — services react to events independently

// Order Service: publishes event when order is placed
public class PlaceOrderHandler(IUnitOfWork uow, IPublishEndpoint bus) : IRequestHandler<PlaceOrderCommand>
{
    public async Task Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await uow.Orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);
        // Outbox pattern: publish event after commit
        await bus.Publish(new OrderPlacedEvent(order.Id, cmd.Items, order.Total), ct);
    }
}

// Inventory Service: reacts to OrderPlaced event
public class OrderPlacedConsumer(IInventoryRepository repo, IPublishEndpoint bus)
    : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> ctx)
    {
        try
        {
            var reservationId = await repo.ReserveAsync(ctx.Message.OrderId, ctx.Message.Items);
            // Forward the order total — Payment Service has no other way
            // to know what to charge; it never sees OrderPlacedEvent itself.
            await bus.Publish(new InventoryReservedEvent(ctx.Message.OrderId, reservationId, ctx.Message.Total));
        }
        catch (InsufficientStockException)
        {
            await bus.Publish(new InventoryReservationFailedEvent(ctx.Message.OrderId));
        }
    }
}

// Payment Service: reacts to InventoryReserved event
public class InventoryReservedConsumer(IPaymentGateway gateway, IPublishEndpoint bus)
    : IConsumer<InventoryReservedEvent>
{
    public async Task Consume(ConsumeContext<InventoryReservedEvent> ctx)
    {
        var result = await gateway.ChargeAsync(ctx.Message.OrderId, ctx.Message.Total);
        if (result.Success)
            await bus.Publish(new PaymentProcessedEvent(ctx.Message.OrderId, result.PaymentId));
        else
        {
            // Compensation: tell Inventory to release reservation
            await bus.Publish(new PaymentFailedEvent(ctx.Message.OrderId, ctx.Message.ReservationId));
        }
    }
}

// Inventory Service: compensates on payment failure
public class PaymentFailedConsumer(IInventoryRepository repo) : IConsumer<PaymentFailedEvent>
{
    public async Task Consume(ConsumeContext<PaymentFailedEvent> ctx) =>
        await repo.ReleaseReservationAsync(ctx.Message.ReservationId);
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not designing compensating transactions upfront',
    wrong: `// ReserveInventory step has no compensation defined
// When payment fails later, inventory is permanently reserved`,
    right: `// Every step with side effects must define its compensation:
// ReserveInventory ↔ ReleaseInventory
// ProcessPayment  ↔ RefundPayment
// ShipOrder       ↔ RecallShipment (if possible)`,
    explanation: 'Compensating transactions are the rollback mechanism of sagas. Design them for every step that changes external state. Steps that cannot be undone (emails sent, physical shipments) are "pivot transactions" — design the saga to minimise work after them.',
  },
  {
    title: 'Non-idempotent saga steps causing duplicate effects',
    wrong: `public async Task ReserveInventory(Guid orderId, List<Item> items)
{
    // No idempotency check — if called twice, reserves inventory twice!
    await _db.Reservations.AddAsync(new Reservation(orderId, items));
}`,
    right: `if (await _db.Reservations.AnyAsync(r => r.OrderId == orderId)) return existingReservationId;
await _db.Reservations.AddAsync(new Reservation(orderId, items));`,
    explanation: 'Message brokers guarantee at-least-once delivery — saga steps will be called more than once on retries. Each step must check if it was already executed (idempotency key) and return the prior result instead of re-applying the effect.',
  },
  {
    title: 'Using sagas for single-service operations',
    wrong: `// Single service, single database: place order + update inventory
// Using a saga with events and compensation instead of a local transaction`,
    right: `// Use a database transaction (UoW) for same-service, same-DB operations
// Sagas are for cross-service, cross-database distributed transactions`,
    explanation: 'Sagas add significant complexity: message queues, compensations, idempotency, saga state storage. Use them only when operations span multiple services/databases. For within-service operations, use a database transaction.',
  },
  {
    title: 'Assuming saga compensation is immediate or synchronous',
    wrong: `// Payment fails → immediately consistent state
// Inventory is still "reserved" until compensation event is processed`,
    right: `// Compensation is asynchronous — there IS a window of inconsistency
// Design UX around this: "Order cancellation in progress" vs immediate cancellation`,
    explanation: 'Sagas guarantee eventual consistency, not immediate consistency. After a failure, compensating events propagate asynchronously — the system is inconsistent until compensation completes. Design the system and UX to handle this intermediate state.',
  },
];

const challenge: Challenge = {
  title: 'Simple Order Saga Steps',
  language: 'typescript',
  description: `Simulate a 3-step choreography saga: reserveInventory → processPayment → confirmOrder.
Each step publishes an event. If processPayment fails (amount > 100), publish PaymentFailed and call releaseInventory as compensation.
Log each step and compensation.`,
  hints: [
    'Use async functions for each step',
    'processPayment throws if amount > 100',
    'Call releaseInventory in the catch block',
  ],
  starterCode: `async function reserveInventory(orderId: string): Promise<string> {
  console.log(\`[Inventory] Reserving for order \${orderId}\`);
  return 'RES-' + orderId;
}

async function processPayment(orderId: string, amount: number): Promise<void> {
  if (amount > 100) throw new Error('Payment declined');
  console.log(\`[Payment] Charged \${amount} for order \${orderId}\`);
}

async function releaseInventory(reservationId: string): Promise<void> {
  console.log(\`[Inventory] Released reservation \${reservationId}\`);
}

// TODO: runOrderSaga(orderId, amount)`,
  solution: `async function reserveInventory(orderId: string): Promise<string> {
  console.log(\`[Inventory] Reserving for order \${orderId}\`);
  return 'RES-' + orderId;
}

async function processPayment(orderId: string, amount: number): Promise<void> {
  if (amount > 100) throw new Error('Payment declined');
  console.log(\`[Payment] Charged \${amount} for order \${orderId}\`);
}

async function releaseInventory(reservationId: string): Promise<void> {
  console.log(\`[Inventory] Released reservation \${reservationId}\`);
}

async function confirmOrder(orderId: string): Promise<void> {
  console.log(\`[Order] Confirmed \${orderId}\`);
}

async function runOrderSaga(orderId: string, amount: number): Promise<void> {
  const reservationId = await reserveInventory(orderId);
  try {
    await processPayment(orderId, amount);
    await confirmOrder(orderId);
  } catch (err) {
    console.log(\`[Saga] Payment failed: \${(err as Error).message}. Compensating...\`);
    await releaseInventory(reservationId);
  }
}

await runOrderSaga('ORD-001', 50);   // success
await runOrderSaga('ORD-002', 200);  // payment fails → compensation`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key difference between a Saga and a distributed 2-phase commit (2PC)?',
    options: [
      'Sagas are faster than 2PC',
      'Sagas use compensating transactions for eventual rollback without global locks; 2PC uses distributed locks to guarantee atomicity',
      'Sagas require a database; 2PC works without one',
      '2PC uses events; Sagas use direct service calls',
    ],
    answer: 1,
    explanation: '2PC requires a distributed coordinator to hold locks across all services until all commit or rollback — this blocks resources and is fragile. Sagas avoid locks: each step commits locally; failures trigger compensating transactions that are themselves local operations. Sagas achieve eventual (not immediate) consistency.',
  },
  {
    q: 'What is a compensating transaction?',
    options: [
      'A database transaction that compensates for slow queries',
      'A business transaction that logically reverses a previously committed step when a saga fails',
      'An automatic rollback triggered by the database on failure',
      'A retry mechanism for failed service calls',
    ],
    answer: 1,
    explanation: 'A compensating transaction is a new, forward-going transaction that logically undoes a previously committed step. ReserveInventory→ReleaseInventory, ProcessPayment→RefundPayment. It is not an UNDO — the forward step already committed; compensation is a separate business operation.',
  },
  {
    q: 'Which Saga style has a central coordinator that sends commands to each service?',
    options: [
      'Choreography — services react to domain events independently',
      'Orchestration — a saga manager sends commands and tracks progress',
      'Event streaming — Kafka manages the workflow',
      '2PC — the coordinator locks all services',
    ],
    answer: 1,
    explanation: 'Orchestration uses a central saga manager (e.g. MassTransit StateMachine) that explicitly commands each service: "Reserve inventory", "Charge payment". Choreography has no coordinator — each service reacts to events published by other services.',
  },
  { q: 'What is the Saga pattern and what distributed problem does it address?', options: ['A long-running background job pattern for batch processing', 'A pattern for managing distributed transactions across multiple services without a global transaction coordinator, using a sequence of local transactions with compensating actions', 'A pattern for coordinating database schema migrations across microservices', 'A messaging pattern that routes events between services based on content'], answer: 1, explanation: 'Distributed transactions across microservices are impractical (2PC requires all services to support it, is slow, and is a single point of failure). Saga divides a distributed transaction into a sequence of local database transactions, each in a single service. If one local transaction fails, the Saga executes compensating transactions to undo already-completed steps. Example: PlaceOrder saga: reserve inventory, charge payment, create shipment. If charging fails: release the inventory reservation. No global lock; each service commits locally.' },
  { q: 'What is the difference between Choreography and Orchestration Saga?', options: ['Choreography uses synchronous HTTP calls; Orchestration uses asynchronous messaging', 'Choreography: each service reacts to events from others without a central coordinator; Orchestration: a central saga orchestrator sends commands to each service and handles the overall flow', 'Choreography requires a message broker; Orchestration uses direct HTTP', 'They are the same; the terms are interchangeable in different communities'], answer: 1, explanation: 'Choreography Saga: services communicate via events. Service A completes its step and emits an event. Service B subscribes and starts its step. No central coordinator. Pro: decentralized, simple per service. Con: the overall saga flow is implicit, scattered across services, harder to monitor and debug. Orchestration Saga: a saga orchestrator sends command messages to each service in sequence. The orchestrator handles success/failure and decides on compensation. Pro: the saga flow is visible in one place. Con: the orchestrator is a new service that must be built and maintained. MassTransit Saga StateMachine and Axon Framework Saga are orchestration implementations.' },
  { q: 'What does it mean for a compensating transaction to be "commutative," and why does that property matter for sagas specifically?', options: ['Commutative means the compensation must run before the original action, not after', 'Commutative means the compensation produces a correct result regardless of what order it runs in relative to other concurrent operations on the same resource — important because network delays and retries mean compensations and forward actions can arrive out of the order they were logically issued', 'Commutative means the compensation can only be applied to numeric fields', 'Commutative means the compensation must be a no-op if called twice'], answer: 1, explanation: 'In a distributed saga, message delivery order is not guaranteed — a compensation message for step 2 could theoretically be processed before a later forward action affecting the same resource is applied, due to network delays or retries. A commutative compensation is designed so the final state is correct no matter what order it executes relative to other operations (e.g. "decrement inventory by X" is commutative with other decrements/increments in a way that "set inventory to exactly Y" is not) — this robustness to out-of-order arrival is specifically important in sagas because, unlike a single-node transaction with a guaranteed sequential log, saga steps run across independent, asynchronously-communicating services.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do I choose between Choreography and Orchestration?',
    a: 'Choreography works well for simple, short flows with 2-3 services — low coupling, each service independently reacts to events. Choose Orchestration when: the flow has many steps, complex branching logic, or compensation must be tracked centrally. Orchestration gives better observability (saga state is persisted) but introduces a coordination point. For most production systems with complex flows, Orchestration is easier to reason about and debug.',
  },
  {
    q: 'Why must saga steps be idempotent?',
    a: 'Message brokers guarantee at-least-once delivery, not exactly-once. A saga step may be called multiple times due to network retries, consumer restarts, or duplicate messages. If ReserveInventory is called twice without idempotency, inventory is reserved twice. Use an idempotency key (e.g. orderId): if a reservation for that orderId already exists, return it instead of creating a new one.',
  },
  { q: 'How do you handle partial failures in a Saga?', a: 'When a step in the saga fails: the saga records the failure and executes compensating transactions for all previously completed steps in reverse order. Example: if step 3 (charge payment) fails after step 1 (reserve inventory) and step 2 (reserve warehouse slot), execute compensating transaction for step 2 (release warehouse slot) then compensating transaction for step 1 (release inventory). Each compensation is a separate local transaction that may also fail. Saga must handle compensation failures: retry compensations until they succeed (using message queues with retry). In pathological cases, compensations may fail irreversibly; these require manual intervention (dead letter queue, human review process).' },
  { q: 'How do you track Saga state in an Orchestration Saga?', a: 'The saga orchestrator maintains a saga state entity in its own database. The state machine records: saga ID, current step, step results, and any data needed for compensations. On each command response (success or failure), the state machine transitions to the next step or begins compensation. The state must be persisted before sending the next command (write-ahead logging): if the orchestrator crashes after persisting but before sending the command, it can resume by re-reading the state. Saga frameworks like MassTransit StateMachine, Temporal.io, and Axon Framework manage saga state persistence and recovery automatically. Never hold saga state only in memory.' },
  { q: 'Why is a 2PC coordinator failure during the "prepare" phase considered worse than a Saga step failing at the equivalent point?', a: 'In 2PC, once a participant votes "yes" during prepare, it must hold its resource lock indefinitely until the coordinator sends the final commit/abort decision — if the coordinator crashes at that exact moment, every participant is stuck in an "in-doubt" state, holding locks with no way to know whether to commit or abort, until the coordinator recovers (this is the classic 2PC blocking problem). A Saga has no equivalent frozen state: each step already committed its LOCAL transaction and released its resources immediately, so if the saga orchestrator crashes mid-flow, no service is left holding a lock — the worst case is simply that compensations for already-completed steps need to run once the orchestrator recovers, which is an operational cleanup task, not a resource-blocking outage affecting other unrelated transactions competing for the same locked resources.' },
  { q: 'What monitoring and observability must you build for Sagas?', a: 'Saga observability is critical because distributed flows are hard to debug. Monitor: saga state transitions (log each step completion and failure). Dead letter queue depth (failed compensations requiring manual intervention). Saga duration (long-running sagas may indicate stuck steps). Compensation rate (high compensation rate signals upstream problems). Implementation: emit saga events to an observability platform (Datadog, Grafana). Use correlation IDs that trace through all service calls within a saga. Saga dashboards showing active sagas, step distributions, and compensation counts. Alerts on stuck sagas (not completing after a timeout). Tools: Temporal.io provides built-in visibility into workflow execution state. MassTransit Saga includes state querying APIs.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Saga manages distributed transactions across services using local commits + compensating transactions — achieving eventual consistency without distributed locks or 2-phase commit.',
  mustKnow: [
    'Saga = sequence of local transactions + compensating transactions for rollback',
    'Choreography: event-driven, no coordinator; Orchestration: central saga manager',
    'Every side-effecting step needs a compensation: Reserve ↔ Release, Charge ↔ Refund',
    'Steps must be idempotent — at-least-once delivery means steps can run multiple times',
    'Sagas achieve eventual consistency — intermediate inconsistent states are visible',
  ],
  interviewFocus: [
    'Saga vs 2-phase commit — what problem does Saga solve?',
    'Choreography vs Orchestration — trade-offs?',
    'Why must saga steps be idempotent?',
  ],
};

@Component({
  selector: 'app-dp-saga',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './saga.html',
  styleUrl: './saga.scss',
})
export class DpSaga {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
