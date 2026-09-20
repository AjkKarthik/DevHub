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
  selector: 'app-saga-pattern',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './saga-pattern.html',
  styleUrl: './saga-pattern.scss'
})
export class SagaPattern {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Saga', type: 'keyword', desc: 'Sequence of local transactions coordinated via events or orchestrator' },
    { name: 'Choreography', type: 'keyword', desc: 'Each service publishes events; next service reacts (no central coordinator)' },
    { name: 'Orchestration', type: 'keyword', desc: 'Central saga orchestrator tells each service what to do and when' },
    { name: 'Compensating transaction', type: 'keyword', desc: 'Undo operation that reverses the effect of a completed local transaction' },
    { name: 'Eventually consistent', type: 'keyword', desc: 'Distributed system reaches consistency after all compensations complete' },
    { name: 'Saga state', type: 'keyword', desc: 'Persistent record of saga progress used for recovery after crash' },
    { name: 'Pivot transaction', type: 'keyword', desc: 'Go/no-go step: once it commits the saga must run to completion, and later steps are retried, not compensated' },
    { name: 'Idempotency', type: 'keyword', desc: 'Each saga step safe to replay without side effects on duplicate delivery' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Why Sagas? Distributed Transactions without 2PC',
      points: [
        'Distributed ACID transactions (2-Phase Commit) across microservices lock resources across service boundaries, causing availability problems.',
        'The Saga pattern replaces one distributed transaction with a sequence of local transactions, each publishing an event on success.',
        'If a step fails, compensating transactions undo previous steps to restore consistency.',
        'Sagas achieve eventual consistency, not ACID isolation — other services may see intermediate states.',
      ]
    },
    {
      heading: 'Choreography vs Orchestration',
      points: [
        'Choreography: each service reacts to events and publishes its own events. No central controller. Decoupled but hard to observe.',
        'Orchestration: a dedicated saga orchestrator explicitly tells each service when to act and tracks global state. Easier to monitor but more coupled.',
        'Choreography suits simple, linear flows. Orchestration suits complex flows with branching logic and clear failure handling.',
        'Common orchestrators: AWS Step Functions, Temporal, custom state machine backed by a database.',
        'Orchestration has a coupling and availability cost of its own: the orchestrator must know every participant and becomes a component whose failure stalls all sagas. Choose it for complex, many-step flows where central visibility matters, and choreography for simple flows or when avoiding a central coordinator is the priority.',
      ]
    },
    {
      heading: 'Compensating Transactions',
      points: [
        'Every forward step in a saga must have a corresponding compensating transaction.',
        'Compensating transactions must be idempotent — they may be called multiple times on retry.',
        'Semantic undo: compensating transactions do not simply "cancel" — they may create new events (e.g., "refund issued" rather than deleting a charge).',
        'Not all steps can be compensated — the pivot transaction is the point of no return.',
        'Steps before the pivot are compensable and are undone if the saga fails. Steps after it are retryable and idempotent: once the pivot commits, they are retried until they succeed rather than compensated. The pivot can be the last compensable step or the first retryable one.',
        'Not every operation has a clean compensating action: an email cannot be "unsent". Order the saga so irreversible steps run late, at or after the pivot, once the steps that can still fail have succeeded.',
        'A compensation may run for a step whose forward action never completed (for example after a timeout), so it must tolerate that case. Compensating only the steps recorded as committed avoids most of these no-op compensations.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Choreography Saga',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });

// --- Order Service ---
// Step 1: Reserve order → publish 'order.reserved'
async function reserveOrder(orderId: string, userId: string, total: number) {
  // Local DB transaction
  await db.orders.insert({ orderId, userId, total, status: 'reserved' });

  await publish('order-events', 'order.reserved', { orderId, userId, total });
}

// Compensation: cancel reservation on failure
async function cancelOrder(orderId: string, reason: string) {
  await db.orders.update(orderId, { status: 'cancelled' });
  await publish('order-events', 'order.cancelled', { orderId, reason });
}

// --- Payment Service (reacts to order.reserved) ---
async function processPayment(orderId: string, userId: string, total: number) {
  try {
    await chargeCard(userId, total);
    await publish('payment-events', 'payment.completed', { orderId });
  } catch {
    // Trigger compensation: tell order service to cancel
    await publish('payment-events', 'payment.failed', { orderId, reason: 'Card declined' });
  }
}

// --- Order Service (reacts to payment.failed) ---
// On payment.failed → compensate by cancelling order
// On payment.completed → fulfil order

// Key by orderId so every event of one order goes to the same partition, in order.
// Keying by eventType would spread one order's events across partitions.
// (Demo only: create one producer and reuse it instead of one per event.)
async function publish(topic: string, eventType: string, data: { orderId: string; [key: string]: unknown }) {
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ key: data.orderId, value: JSON.stringify({ type: eventType, ...data }) }],
    acks: -1,
  });
  await producer.disconnect();
}`,
    },
    {
      label: 'Orchestration Saga',
      language: 'typescript',
      code: `// Saga Orchestrator — tracks state and drives each step

type SagaStep = 'RESERVE_ORDER' | 'CHARGE_PAYMENT' | 'SHIP_ORDER' | 'COMPLETED' | 'COMPENSATING' | 'FAILED';

interface SagaState {
  sagaId:    string;
  orderId:   string;
  step:      SagaStep;
  completed: string[];   // commands whose local transaction committed
  error?:    string;
}

// The compensation that undoes each compensable step
const COMPENSATIONS: Record<string, [service: string, command: string]> = {
  RESERVE_ORDER:  ['order-service',   'CANCEL_ORDER'],
  CHARGE_PAYMENT: ['payment-service', 'REFUND_PAYMENT'],
};

async function startOrderSaga(orderId: string) {
  const state: SagaState = { sagaId: crypto.randomUUID(), orderId, step: 'RESERVE_ORDER', completed: [] };
  await saveSagaState(state);

  try {
    // Step 1: Reserve order
    await sendCommand('order-service', 'RESERVE_ORDER', { orderId });
    state.completed.push('RESERVE_ORDER');
    state.step = 'CHARGE_PAYMENT';
    await saveSagaState(state);

    // Step 2: Charge payment
    await sendCommand('payment-service', 'CHARGE_PAYMENT', { orderId });
    state.completed.push('CHARGE_PAYMENT');
    state.step = 'SHIP_ORDER';
    await saveSagaState(state);

    // Step 3: Ship order (pivot: if it commits, the saga must finish)
    await sendCommand('shipping-service', 'SHIP_ORDER', { orderId });
    state.completed.push('SHIP_ORDER');
    state.step = 'COMPLETED';
    await saveSagaState(state);

  } catch (err: any) {
    state.error = err.message;
    state.step  = 'COMPENSATING';
    await saveSagaState(state);
    await compensate(state);
  }
}

async function compensate(state: SagaState) {
  // Undo only the steps that committed, newest first. The step that failed is not in the list.
  for (const cmd of [...state.completed].reverse()) {
    const comp = COMPENSATIONS[cmd];
    if (comp) await sendCommand(comp[0], comp[1], { orderId: state.orderId });
  }
  state.step = 'FAILED';
  await saveSagaState(state);
}

async function saveSagaState(s: SagaState) { console.log('Saga state:', s); }
async function sendCommand(svc: string, cmd: string, data: object) {
  console.log(\`→ \${svc}: \${cmd}\`, data);
  if (cmd === 'CHARGE_PAYMENT') throw new Error('Card declined'); // simulate failure
}`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Not making compensating transactions idempotent',
      wrong: `// CancelOrder called twice (a retry, or a replay after a crash) — stock is credited twice
async function cancelOrder(orderId: string) {
  await db.stock.increment(orderId, quantity); // double credit if called twice
}`,
      right: `// Idempotent: a guarded update decides who does the work, in ONE local transaction
async function cancelOrder(orderId: string) {
  await db.transaction(async (tx) => {
    const changed = await tx.orders.updateWhere(
      { id: orderId, status: { not: 'cancelled' } }, { status: 'cancelled' });
    if (changed === 0) return;                    // already cancelled: do nothing
    await tx.stock.increment(orderId, quantity);  // rolls back with the status change on a crash
  });
}`,
      explanation: 'Compensating transactions may be replayed on failure or retry. They must be idempotent — the same compensation applied twice must produce the same result as once. The check and the change must be one atomic step: a separate read-then-write lets two concurrent calls both pass the check, and a crash between the stock credit and the status update makes the replay credit the stock again.'
    },
    {
      title: 'Assuming intermediate saga state is invisible to other services',
      wrong: `// Saga step 1 reserves order — immediately visible to customers
// If step 2 (payment) fails, customer sees a momentary "order placed" then cancellation`,
      right: `// Use "pending" status for saga in-progress; only expose final state
// Alternatively, use CQRS: project only completed sagas to the read model`,
      explanation: 'Sagas are eventually consistent. Other services see intermediate states. Design UX and read models to handle in-progress saga states gracefully.'
    },
    {
      title: 'Not persisting saga state before executing each step',
      wrong: `// Saga state updated only at the end
await step1(); await step2(); await step3();
await saveSagaState({ step: 'COMPLETED' }); // crash mid-way = lost state`,
      right: `// Save state BEFORE executing each step (write-ahead)
state.step = 'STEP_2';
await saveSagaState(state);   // persist first
await executeStep2();         // then execute`,
      explanation: 'On crash recovery, the saga orchestrator reads persisted state to resume from the right step. Save state before executing each step, not after.'
    },
    {
      title: 'Attempting 2PC instead of saga for distributed consistency',
      wrong: `// 2PC across microservices — locks all services until coordinator releases
await begin2PC([orderService, paymentService, shippingService]);
// Any service unavailability blocks the entire transaction`,
      right: `// Saga: local transactions + compensating transactions
// Each service independently commits and publishes events`,
      explanation: '2PC across services creates distributed locks that reduce availability and create single points of failure. Sagas trade ACID isolation for availability and loose coupling.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Simple Order Saga with Rollback',
    language: 'typescript',
    description: 'Implement a 3-step choreography saga for order processing: (1) reserve inventory, (2) charge payment, (3) confirm shipment. Each step publishes a success or failure event. On payment failure, compensate by releasing the inventory reservation. Use in-memory event bus.',
    hints: [
      'Use an EventEmitter or simple Map of listeners as your event bus',
      'Each step handler subscribes to the previous step\'s success event',
      'Compensation subscribes to payment.failed and reverses inventory reservation',
    ],
    starterCode: `import { EventEmitter } from 'events';
const bus = new EventEmitter();

async function startSaga(orderId: string) {
  // TODO: 3-step choreography saga with compensation
}`,
    solution: `import { EventEmitter } from 'events';
const bus = new EventEmitter();

// Step 1: Inventory Service
bus.on('order.created', async ({ orderId, qty }) => {
  console.log('[Inventory] Reserving', qty, 'units for', orderId);
  bus.emit('inventory.reserved', { orderId, qty });
});

// Step 2: Payment Service (reacts to inventory.reserved)
bus.on('inventory.reserved', async ({ orderId }) => {
  console.log('[Payment] Charging for', orderId);
  const success = orderId !== 'ORD-002'; // deterministic: ORD-002 always fails, so compensation always runs
  if (success) {
    bus.emit('payment.completed', { orderId });
  } else {
    bus.emit('payment.failed', { orderId, reason: 'Card declined' });
  }
});

// Step 3: Shipping (reacts to payment.completed)
bus.on('payment.completed', async ({ orderId }) => {
  console.log('[Shipping] Scheduling shipment for', orderId);
  bus.emit('order.completed', { orderId });
});

// Compensation: release inventory on payment failure
bus.on('payment.failed', async ({ orderId, reason }) => {
  console.log('[Inventory] Releasing reservation for', orderId, '—', reason);
  bus.emit('order.failed', { orderId, reason });
});

bus.on('order.completed', ({ orderId }) => console.log('✓ Order', orderId, 'complete'));
bus.on('order.failed',    ({ orderId, reason }) => console.log('✗ Order', orderId, 'failed:', reason));

async function startSaga(orderId: string) {
  bus.emit('order.created', { orderId, qty: 2 });
}

startSaga('ORD-001');  // completes
startSaga('ORD-002');  // payment fails, inventory is released`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What does a compensating transaction do in a saga?', options: ['Commits a global distributed transaction', 'Reverses the effect of a previously completed local transaction', 'Retries the failed step', 'Notifies all services of the failure'], answer: 1, explanation: 'Compensating transactions semantically undo completed saga steps when a later step fails, restoring eventual consistency.' },
    { q: 'Which saga coordination style has no central controller?', options: ['Orchestration', 'Choreography', '2PC saga', 'Event-sourced saga'], answer: 1, explanation: 'Choreography: each service reacts to events and emits its own — no central coordinator. Orchestration uses a dedicated saga manager.' },
    { q: 'What is a pivot transaction in a saga?', options: ['The first step', 'The go/no-go step: once it commits, the saga can no longer be rolled back and must run to completion', 'The compensation step', 'The failure handler'], answer: 1, explanation: 'The pivot transaction is the point of no return. Steps before it are compensable and are undone if the saga fails. Once it commits, the remaining steps are retryable and idempotent, and are retried until they succeed rather than compensated.' },
    { q: 'Why must saga compensating transactions be idempotent?', options: ['To support 2PC commit protocol', 'To allow safe retries when compensations are replayed on failure', 'To ensure ACID isolation', 'To synchronise distributed databases'], answer: 1, explanation: 'On crash/retry, the orchestrator may call the same compensation multiple times. Idempotent compensations produce the same result regardless of how many times they run.' },
    { q: 'What is the key difference between choreography and orchestration sagas?', options: ['Choreography uses a central coordinator; orchestration is event-driven', 'Choreography: services react to events independently; orchestration: a central saga orchestrator commands each step', 'They are identical but differ in implementation language', 'Orchestration is only for microservices'], answer: 1, explanation: 'Choreography: each service listens for events and decides its next action — decentralized, no SPOF, but harder to track flow. Orchestration: a saga orchestrator sends commands and tracks state — easier to visualize, single point of failure.' },
    { q: 'Why can a saga\'s compensating transaction not always achieve a true rollback to the exact prior state?', options: ['Compensations always achieve a perfect rollback — this is never a concern', 'A compensation can only semantically UNDO an action\'s effect (e.g. refund a charge), but cannot erase that the action happened at all — external side effects like a sent notification email or a third-party API call already made cannot be "unsent"', 'Compensations are only theoretical and are never actually implemented', 'Because saga steps never have external side effects'], answer: 1, explanation: 'A compensating transaction reverses the observable BUSINESS EFFECT of a step (refunding a charge, releasing reserved inventory) but cannot undo the fact that the original action occurred — if a step sent a confirmation email or called a non-reversible third-party API before a later step failed, no compensation can make it as if that email was never sent. This is a fundamental limitation of sagas versus true ACID rollback, and is why saga steps involving irreversible external effects need extra care (e.g. delaying notifications until the whole saga completes successfully).' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Does a saga guarantee ACID isolation?', a: 'No. Sagas guarantee eventual consistency, not ACID isolation. Other services see intermediate states during saga execution. Use read models (CQRS) that only show completed sagas, or expose "pending" states explicitly in the UI.' },
    { q: 'When should I choose orchestration over choreography?', a: 'Orchestration is better for complex flows with branching logic, long-running processes, and when you need a clear audit log of saga progress. Choreography is better for simple linear flows where decoupling between services is the priority.' },
    { q: 'What is Temporal and how does it relate to sagas?', a: 'Temporal is a workflow orchestration platform that makes saga state durable and handles retries and timeouts, so a workflow survives worker crashes without a hand-built state machine. It does not write the compensations for you: you register a compensation for each step in workflow code and run them in reverse order on failure, and each must be idempotent and tolerate a forward step that never ran. Temporal guarantees that this compensation code runs reliably.' },
    { q: 'How do you track saga state for observability?', a: 'The orchestrator maintains a <strong>saga state machine</strong> persisted in a database. Each step transition (PENDING → ORDER_PLACED → PAYMENT_CHARGED) is recorded with timestamp and correlation ID. Use a saga log/history for debugging. Tools: Temporal, Conductor, Axon Framework store saga state natively. Always include correlation IDs in all emitted events for distributed tracing.' },
    { q: 'What is the difference between a saga and a distributed transaction (2PC)?', a: '<strong>2PC</strong> (two-phase commit): locks resources across services until all commit — strong consistency but blocking, single point of failure (coordinator), poor performance at scale. <strong>Saga</strong>: sequence of local transactions with compensations on failure — no locking, eventual consistency, higher availability. Sagas sacrifice ACID guarantees for resilience and scalability.' },
    { q: 'How do you handle idempotency in saga steps?', a: 'Each saga step must be idempotent — if the step is retried (network failure, timeout), it should produce the same result. Implement: unique constraint on saga step ID in DB, check-before-execute, or idempotency key passed in command message. The orchestrator retries failed steps; idempotent handlers prevent double-charging or double-booking on retry.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Sagas replace distributed 2PC with local transactions + compensating transactions for eventual consistency.',
    mustKnow: [
      'Saga = sequence of local transactions; failure triggers compensating transactions in reverse',
      'Choreography: event-driven, no central coordinator; Orchestration: saga manager drives steps',
      'Compensating transactions must be idempotent — they may be replayed on crash/retry',
      'Sagas achieve eventual consistency, not ACID isolation — plan for visible intermediate states',
      'Persist saga state before each step (write-ahead) for crash recovery',
      'Pivot transaction: the go/no-go point. Steps before it are compensable; steps after it are retried until they succeed',
    ],
    interviewFocus: [
      'Saga vs 2PC: why 2PC doesn\'t work across microservices',
      'Choreography vs orchestration: trade-offs in coupling and observability',
      'Compensating transactions: semantic undo, idempotency requirement',
      'Tools: Temporal, AWS Step Functions, or custom saga state machines',
    ],
  };
}
