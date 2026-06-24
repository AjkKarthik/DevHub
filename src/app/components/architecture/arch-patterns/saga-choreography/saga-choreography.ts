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
  selector: 'app-arch-saga-choreography',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './saga-choreography.html',
  styleUrl: './saga-choreography.scss',
})
export class ArchSagaChoreography {

  quickRef: QuickRefItem[] = [
    { name: 'Saga', type: 'keyword', desc: 'A sequence of local transactions coordinated across services without 2PC' },
    { name: 'Compensating Transaction', type: 'keyword', desc: 'An undo action that reverses a completed local transaction on failure' },
    { name: 'Choreography', type: 'keyword', desc: 'Services react to events autonomously — no central coordinator' },
    { name: 'Orchestration', type: 'keyword', desc: 'A central saga orchestrator directs each step via commands' },
    { name: '2PC', type: 'keyword', desc: 'Two-Phase Commit — distributed transaction protocol; avoided in microservices due to blocking and SPOF' },
    { name: 'Saga Log', type: 'keyword', desc: 'Persistent record of saga state — used to resume or compensate on failure' },
    { name: 'Idempotency', type: 'keyword', desc: 'Each saga step must be safe to retry without duplicating effects' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Sagas? The Problem with 2PC',
      points: [
        'Two-Phase Commit (2PC) provides ACID guarantees across services but is blocking: all participants must be available simultaneously.',
        'In a microservices system, a slow or unavailable participant holds locks across all services — a cascade blocker.',
        'Sagas replace 2PC with a sequence of local transactions: each service commits locally, then publishes an event or responds to a command.',
        'If a step fails, compensating transactions undo the completed steps — eventual consistency instead of distributed atomicity.',
      ],
    },
    {
      heading: 'Choreography vs Orchestration',
      points: [
        'Choreography: no central controller. Each service listens for events and reacts independently. OrderPlaced → Inventory reserves → StockReserved → Payment charges → PaymentCharged → Order confirms.',
        'Choreography pros: simple, loosely coupled, no SPOF. Cons: hard to visualise the full flow; difficult to add cross-cutting logic; cyclic event dependencies are a risk.',
        'Orchestration: a central saga orchestrator sends commands to each participant and waits for responses. Explicit state machine.',
        'Orchestration pros: flow is explicit, easy to monitor and debug, easy to add steps. Cons: orchestrator is a coupling point and a SPOF if not made resilient.',
      ],
    },
    {
      heading: 'Compensating Transactions',
      points: [
        'Each forward action must have a corresponding compensating action that undoes it.',
        'Reserve Stock → Compensate: Release Stock. Charge Payment → Compensate: Issue Refund. Send Notification → Compensate: Send Cancellation.',
        'Not all steps can be truly undone (an email already sent cannot be unsent). Design compensations as semantic undos: send a cancellation email.',
        'Compensating transactions must be idempotent — the saga may call them more than once on retry.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Choreography Pattern',
      language: 'typescript',
      code: `// Choreography — services react to events, no central coordinator

// 1. Order Service places order and publishes event
async function placeOrder(cmd: PlaceOrderCommand): Promise<void> {
  const order = Order.create(cmd);
  await orderRepo.save(order);
  await broker.publish('orders.placed', { orderId: order.id, items: cmd.items, customerId: cmd.customerId });
}

// 2. Inventory Service listens, reserves stock
broker.subscribe('orders.placed', async (e) => {
  const reserved = await inventoryRepo.reserve(e.items);
  if (reserved) {
    await broker.publish('stock.reserved', { orderId: e.orderId, customerId: e.customerId });
  } else {
    await broker.publish('stock.reservation.failed', { orderId: e.orderId, reason: 'Insufficient stock' });
  }
});

// 3. Payment Service listens for successful reservation
broker.subscribe('stock.reserved', async (e) => {
  const charged = await paymentGateway.charge(e.customerId);
  if (charged) {
    await broker.publish('payment.charged', { orderId: e.orderId });
  } else {
    await broker.publish('payment.failed', { orderId: e.orderId });
  }
});

// 4. Compensation — if payment fails, release the stock
broker.subscribe('payment.failed', async (e) => {
  await inventoryRepo.release(e.orderId); // compensating transaction
  await orderRepo.cancel(e.orderId);
  await broker.publish('order.cancelled', { orderId: e.orderId, reason: 'Payment failed' });
});`
    },
    {
      label: 'Orchestration Pattern',
      language: 'typescript',
      code: `// Orchestration — central saga orchestrator manages state machine
type SagaState = 'started' | 'stock_reserved' | 'payment_charged' | 'completed' | 'compensating' | 'failed';

class OrderSaga {
  state: SagaState = 'started';
  orderId: string;
  compensationSteps: Array<() => Promise<void>> = [];

  constructor(orderId: string) { this.orderId = orderId; }

  async execute(cmd: PlaceOrderCommand): Promise<void> {
    try {
      // Step 1: Reserve stock
      await inventoryService.reserve(cmd.items);
      this.compensationSteps.push(() => inventoryService.release(this.orderId));
      this.state = 'stock_reserved';

      // Step 2: Charge payment
      await paymentService.charge(cmd.customerId, cmd.totalAmount);
      this.compensationSteps.push(() => paymentService.refund(this.orderId));
      this.state = 'payment_charged';

      // Step 3: Confirm order
      await orderService.confirm(this.orderId);
      this.state = 'completed';

    } catch (err) {
      console.error('Saga failed at state:', this.state, err);
      await this.compensate();
    }
  }

  private async compensate(): Promise<void> {
    this.state = 'compensating';
    // Execute compensations in reverse order
    for (const compensate of [...this.compensationSteps].reverse()) {
      try { await compensate(); }
      catch (e) { console.error('Compensation step failed:', e); }
    }
    this.state = 'failed';
  }
}

// Run the saga
const saga = new OrderSaga(orderId);
await saga.execute(placeOrderCommand);`
    },
    {
      label: 'Durable Saga with State Persistence',
      language: 'typescript',
      code: `// In production: saga state must be persisted to survive crashes
interface SagaRecord {
  sagaId: string;
  orderId: string;
  state: SagaState;
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
}

class DurableOrderSaga {
  async execute(sagaId: string, cmd: PlaceOrderCommand): Promise<void> {
    let record = await sagaRepo.load(sagaId) ?? {
      sagaId, orderId: cmd.orderId, state: 'started',
      completedSteps: [], createdAt: new Date().toISOString(), updatedAt: ''
    };

    // Resume from last known state (idempotent steps)
    if (!record.completedSteps.includes('reserve_stock')) {
      await inventoryService.reserve(cmd.items);
      record.completedSteps.push('reserve_stock');
      record.state = 'stock_reserved';
      await sagaRepo.save(record); // checkpoint after each step
    }

    if (!record.completedSteps.includes('charge_payment')) {
      await paymentService.charge(cmd.customerId, cmd.totalAmount);
      record.completedSteps.push('charge_payment');
      record.state = 'payment_charged';
      await sagaRepo.save(record);
    }

    if (!record.completedSteps.includes('confirm_order')) {
      await orderService.confirm(cmd.orderId);
      record.completedSteps.push('confirm_order');
      record.state = 'completed';
      await sagaRepo.save(record);
    }
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not making saga steps idempotent',
      wrong: `// ReserveStock called twice on retry — double reservation, double charge`,
      right: `// Each step checks if it already ran: if (completedSteps.includes('reserve_stock')) skip`,
      explanation: 'Saga steps run in a retry-heavy environment. Each step must be idempotent: running it twice produces the same result as running it once.',
    },
    {
      title: 'Choreography for complex sagas with many steps',
      wrong: `// 8-step saga via choreography — impossible to trace the flow or add logic`,
      right: `// Use orchestration for sagas with > 3–4 steps or complex branching`,
      explanation: 'Choreography is elegant for simple linear flows. Complex sagas (branching, parallel steps, conditional compensation) are much easier to reason about with an explicit orchestrator.',
    },
    {
      title: 'Not persisting saga state',
      wrong: `// In-memory saga — crashes lose all progress; must restart from zero`,
      right: `// Persist state after each step; resume from last checkpoint on restart`,
      explanation: 'A saga may run for seconds or minutes. The orchestrator process can crash at any point. Durable state ensures the saga resumes without re-running completed steps.',
    },
    {
      title: 'Ignoring compensation failures',
      wrong: `// Compensation step throws but error is swallowed — inconsistent state`,
      right: `// Log all compensation failures and alert; consider a manual intervention workflow`,
      explanation: 'Compensating transactions can also fail. Log failures, alert operators, and design a manual recovery path for stuck sagas.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a 3-Step Saga with Compensation',
    language: 'typescript',
    description: `Build a simplified trip-booking saga with three steps:
1. Reserve hotel (can fail if no rooms available)
2. Reserve flight (can fail if no seats)
3. Charge payment (always succeeds in this simulation)

If any step fails, compensate all completed steps in reverse order.
Simulate hotel failure on the second run.`,
    hints: [
      'Track completedSteps array; on failure iterate in reverse',
      'Each step has a forward action and a compensation action',
      'Compensate: releaseHotel, releaseFlight (no compensation for "book more" on payment failure)',
    ],
    starterCode: `const completedSteps: string[] = [];

async function reserveHotel(fail = false): Promise<void> {
  if (fail) throw new Error('No rooms available');
  console.log('Hotel reserved');
}
async function releaseHotel(): Promise<void> { console.log('Hotel released'); }
async function reserveFlight(): Promise<void> { console.log('Flight reserved'); }
async function releaseFlight(): Promise<void> { console.log('Flight released'); }
async function chargePayment(): Promise<void> { console.log('Payment charged'); }

// TODO: implement bookTrip(failHotel: boolean)`,
    solution: `const completedSteps: string[] = [];
const compensations: Array<() => Promise<void>> = [];

async function reserveHotel(fail = false): Promise<void> {
  if (fail) throw new Error('No rooms available');
  console.log('Hotel reserved');
}
async function releaseHotel(): Promise<void> { console.log('Hotel released'); }
async function reserveFlight(): Promise<void> { console.log('Flight reserved'); }
async function releaseFlight(): Promise<void> { console.log('Flight released'); }
async function chargePayment(): Promise<void> { console.log('Payment charged'); }

async function bookTrip(failHotel = false): Promise<void> {
  completedSteps.length = 0;
  compensations.length = 0;
  try {
    await reserveHotel(failHotel);
    completedSteps.push('hotel');
    compensations.push(releaseHotel);

    await reserveFlight();
    completedSteps.push('flight');
    compensations.push(releaseFlight);

    await chargePayment();
    completedSteps.push('payment');
    console.log('Trip booked successfully!');
  } catch (err) {
    console.error('Saga failed:', (err as Error).message);
    for (const compensate of [...compensations].reverse()) {
      await compensate();
    }
    console.log('Saga compensated. Completed steps rolled back:', completedSteps);
  }
}

await bookTrip(false); // success
console.log('---');
await bookTrip(true);  // hotel fails → nothing to compensate`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is a compensating transaction in a saga?',
      options: [
        'A database rollback command',
        'An action that semantically undoes a completed local transaction on saga failure',
        'A retry of the failed step',
        'A read-only validation step',
      ],
      answer: 1,
      explanation: 'Compensating transactions are domain actions that undo a completed step — release reserved stock, issue a refund, send a cancellation. They are not DB rollbacks.',
    },
    {
      q: 'When should you prefer saga orchestration over choreography?',
      options: [
        'Always — orchestration is always better',
        'For simple 2-step flows',
        'When the saga has many steps, branching logic, or needs clear observability',
        'Only when using Kafka',
      ],
      answer: 2,
      explanation: 'Orchestration makes complex sagas explicit and monitorable. Choreography is simpler for short linear flows but becomes untraceable with many steps.',
    },
    {
      q: 'Why must saga steps be idempotent?',
      options: [
        'To make them faster',
        'Because sagas may retry steps after a crash; running a step twice must not duplicate effects',
        'To avoid database locks',
        'To support 2PC',
      ],
      answer: 1,
      explanation: 'On saga resume after a crash, already-completed steps may be called again. Idempotency ensures no double-charges, double-reservations, or duplicate emails.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a saga provide ACID guarantees?',
      a: 'No. Sagas provide BASE (Basically Available, Soft state, Eventually consistent) semantics. During the saga, the system is in a partially consistent state — some services have committed, others have not. This is acceptable for most business flows but not for operations requiring strict atomicity.',
    },
    {
      q: 'What happens if a compensating transaction fails?',
      a: 'This is called a "stuck saga" — the system is in an inconsistent state that automated code cannot resolve. Mitigations: retry compensations with exponential backoff, alert operators, maintain a saga audit log for manual intervention, design compensations to be idempotent so retries are safe.',
    },
    {
      q: 'What tools implement saga orchestration?',
      a: 'MassTransit (with saga state machines, .NET), NServiceBus, AWS Step Functions (cloud-native orchestrator), Temporal.io (durable workflow engine), Microsoft Durable Functions (Azure), and Netflix Conductor. These provide persistence, retries, and visualisation out of the box.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Sagas replace 2PC with a sequence of local transactions and compensating actions — choreography via events or orchestration via a central state machine.',
    mustKnow: [
      'Saga: local transactions + compensations — no distributed lock, no 2PC',
      'Choreography: event-driven, no SPOF, hard to trace for complex flows',
      'Orchestration: explicit state machine, easy to monitor, orchestrator is coupling point',
      'Compensating transaction: semantic undo of a completed step (refund, release stock)',
      'All steps and compensations must be idempotent — sagas retry aggressively',
    ],
    interviewFocus: [
      'Why do microservices avoid 2PC and use sagas instead?',
      'Compare choreography vs orchestration — trade-offs?',
      'What happens when a compensating transaction itself fails?',
    ],
  };
}
