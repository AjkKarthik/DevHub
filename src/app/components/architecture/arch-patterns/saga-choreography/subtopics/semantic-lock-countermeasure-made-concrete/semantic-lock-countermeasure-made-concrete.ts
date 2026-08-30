import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './semantic-lock-countermeasure-made-concrete.html',
  styleUrl: './semantic-lock-countermeasure-made-concrete.scss'
})
export class SemanticLockCountermeasureMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA names the technique and the risk, but never the code',
      points: [
        'The "What is the semantic lock counter-measure" QnA explains the idea in prose: mark a saga-in-progress record with a status like <code>pending</code>, reject other operations that try to touch it, and clear the flag when the saga finishes (committed or compensated). No code anywhere on the page shows this.',
        'The specific problem it solves: sagas have NO isolation. Between step 1 committing and step 3 committing, the intermediate, partially-updated state is fully visible and MODIFIABLE by anyone else querying or writing to that record — a saga is not wrapped in one atomic database transaction the way a single-service operation would be.',
        'Concretely: while an order-booking saga has reserved a hotel but not yet charged payment, a completely unrelated process (a customer service agent manually editing the same order, or another saga touching the same order for a different reason) could modify or cancel that order — creating a race the saga\'s own compensation logic was never designed to handle.',
      ]
    },
    {
      heading: 'Why this connects to this page\'s own idempotency and compensation guidance',
      points: [
        'The semantic lock is a DIFFERENT protection from idempotency (covered extensively elsewhere on this page) — idempotency protects against the SAME saga step running twice; the semantic lock protects against a COMPLETELY UNRELATED operation touching the same resource while the saga is mid-flight.',
        'The lock must be released in BOTH the success and the compensation paths — a saga that sets the pending flag but only clears it on the happy path would leave the resource permanently locked after ANY compensated failure, creating a new class of "stuck" resource distinct from the "stuck saga" the page\'s own QnA on compensation failures already covers.',
        'This is a lightweight technique specifically because it doesn\'t require an actual database-level lock held across the whole saga (which would reintroduce exactly the blocking problem 2PC has, and sagas exist to avoid) — it\'s just an ordinary field on the record, checked by ordinary application code before any other operation proceeds.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A pending flag, set at the start, cleared on every exit path',
      language: 'typescript',
      code: `interface Order {
  id: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'pending'; // 'pending' = semantic lock
  lockedBySagaId: string | null;
}

async function bookTripSaga(sagaId: string, orderId: string): Promise<void> {
  const order = await orderRepo.findById(orderId);

  // Acquire the semantic lock BEFORE the saga's first step
  if (order.status === 'pending') {
    throw new Error(\`Order \${orderId} is already locked by saga \${order.lockedBySagaId}\`);
  }
  order.status = 'pending';
  order.lockedBySagaId = sagaId;
  await orderRepo.save(order);

  try {
    await reserveHotel(orderId);
    await reserveFlight(orderId);
    await chargePayment(orderId);

    // SUCCESS path -- release the lock
    order.status = 'confirmed';
    order.lockedBySagaId = null;
    await orderRepo.save(order);
  } catch (err) {
    await compensate(orderId);

    // COMPENSATION path -- the lock must ALSO be released here.
    // Forgetting this branch leaves the order permanently 'pending'
    // even after a fully-compensated, cleanly-failed saga.
    order.status = 'cancelled';
    order.lockedBySagaId = null;
    await orderRepo.save(order);
    throw err;
  }
}

// Any OTHER operation touching the same order must check the lock first:
async function editOrderManually(orderId: string, changes: Partial<Order>): Promise<void> {
  const order = await orderRepo.findById(orderId);
  if (order.status === 'pending') {
    throw new Error('Order is currently being processed by a saga -- try again shortly.');
  }
  await orderRepo.update(orderId, changes);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements the semantic lock, but only clears the pending flag in the saga\'s success path -- the compensate() call in the catch block runs, but nothing resets order.status afterward. A saga that legitimately fails and gets fully, correctly compensated leaves the order in what state, and what problem does this cause?',
    hint: 'What value does order.status still hold after the catch block runs, if nothing explicitly changes it back?',
    solution: 'The order is left permanently stuck with status: \'pending\' -- even though the saga itself compensated correctly and the order\'s actual data is consistent again, the semantic lock was never released. Every future operation checking that lock (including editOrderManually, and potentially the customer\'s own ability to view or modify their order) will keep rejecting attempts to touch it, indefinitely, because nothing ever reset the flag. This is a distinct failure mode from a "stuck saga" (an unresolved inconsistency) -- here the underlying data IS consistent, but a bookkeeping flag left set by mistake makes the resource unusable anyway. The fix is making sure BOTH the success path and the compensation path explicitly clear the lock.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The semantic lock counter-measure and step idempotency (covered elsewhere on this page) protect against the same underlying risk.',
      reality: 'Per this subtopic\'s theory, they protect against different things — idempotency guards against the SAME saga step being retried and running twice; the semantic lock guards against a COMPLETELY UNRELATED operation touching the same resource while the saga is still mid-flight.'
    },
    {
      thought: 'A semantic lock only needs to be released when the saga completes successfully — a compensated (failed but cleanly rolled back) saga can leave the lock in place since the saga itself \'failed.\'',
      reality: 'Per this subtopic\'s theory, the lock must be released on BOTH the success path and the compensation path — a saga that fails and compensates cleanly still needs to release the resource, or it stays stuck even though the underlying data is consistent again.'
    },
    {
      thought: 'Implementing a semantic lock for a saga reintroduces the same blocking, coordinator-availability problem that sagas were adopted specifically to avoid (2PC).',
      reality: 'Per this subtopic\'s theory, it\'s a lightweight, ordinary application-level flag checked by regular code — not a database-level lock held across the whole saga — so it doesn\'t reintroduce 2PC\'s blocking behavior or single-point-of-failure risk.'
    }
  ];
}
