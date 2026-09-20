import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sp-idempotent-guard',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './idempotent-compensation-atomic-guard.html',
  styleUrl: './idempotent-compensation-atomic-guard.scss'
})
export class IdempotentCompensationAtomicGuardSubtopic {
  topicLabel = 'Saga Pattern';
  topicRoute = '/messaging/saga-pattern';

  theory: TheoryPoint[] = [
    {
      heading: 'Why check-then-act is not idempotent enough',
      points: [
        'The main page says compensations must be idempotent. The obvious implementation is a check followed by the work: read the status, return if it is already cancelled, otherwise credit the stock and then mark the order cancelled.',
        'That is three separate steps, and two things break it. If the process crashes after crediting the stock but before writing the status, the replay finds the order still not cancelled and credits the stock a second time.',
        'Two concurrent deliveries of the same compensation, which a broker can produce because delivery is at-least-once, can both pass the check before either has written the status. Both then credit the stock.'
      ]
    },
    {
      heading: 'One guarded update inside one local transaction',
      points: [
        'The fix is to let a single conditional update decide who does the work: update the order where its status is not yet cancelled and look at how many rows changed. Zero rows means another call already did it, so return.',
        'The stock credit sits in the same local database transaction as that update. If the process crashes in between, both roll back together and the replay starts clean.',
        'This works because everything lives in one service and one database, which is exactly where a compensation runs. It does not need a distributed transaction.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: separate steps vs one transaction',
      language: 'typescript',
      code: `type Db = { stock: number; status: 'reserved' | 'cancelled' };
const fresh = (): Db => ({ stock: 5, status: 'reserved' });

// Check, then credit, then update: three separate steps
async function cancelSeparate(db: Db, crashAfterCredit = false) {
  if (db.status === 'cancelled') return;
  await Promise.resolve();                 // another call can run here
  db.stock += 1;
  if (crashAfterCredit) throw new Error('crash');
  db.status = 'cancelled';
}

// Guarded update and credit in one local transaction
async function cancelAtomic(db: Db, crashAfterCredit = false) {
  const snapshot = { ...db };              // BEGIN
  try {
    if (db.status === 'cancelled') return; // guarded UPDATE matched 0 rows
    db.status = 'cancelled';               // guarded UPDATE matched 1 row
    db.stock += 1;
    if (crashAfterCredit) throw new Error('crash');
  } catch (e) { Object.assign(db, snapshot); throw e; }   // ROLLBACK
}

let db = fresh();
await cancelSeparate(db, true).catch(() => {});
await cancelSeparate(db);                  // the replay after the crash
console.log('separate, crash then replay :', db);   // { stock: 7, status: 'cancelled' }

db = fresh();
await Promise.all([cancelSeparate(db), cancelSeparate(db)]);
console.log('separate, two concurrent    :', db);   // { stock: 7, status: 'cancelled' }

db = fresh();
await cancelAtomic(db, true).catch(() => {});
await cancelAtomic(db);
await cancelAtomic(db);
console.log('atomic, crash then 2 replays:', db);   // { stock: 6, status: 'cancelled' }`
    },
    {
      label: 'The guarded compensation',
      language: 'typescript',
      code: `async function cancelOrder(orderId: string, quantity: number) {
  await db.transaction(async (tx) => {
    const changed = await tx.orders.updateWhere(
      { id: orderId, status: { not: 'cancelled' } },
      { status: 'cancelled' });
    if (changed === 0) return;                    // someone else already did it
    await tx.stock.increment(orderId, quantity);  // commits or rolls back with the status
  });
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Stock is 5. A cancel compensation credits 1 unit. With the check-then-act version, it crashes after crediting and before writing the status, then the broker redelivers it. What is the stock afterwards, and what should it be?',
    hint: 'The replay finds the status still not cancelled, so it does the whole job again.',
    solution: 'The stock ends at 7: the first attempt credited it, the crash lost the status write, and the replay credited it again. It should be 6. With the guarded update and the credit in one transaction, the crash rolls both back and the replay credits exactly once.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Checking the status first makes the compensation idempotent.',
      reality: 'Only if the check and the write are one atomic step. A separate read lets two concurrent deliveries both pass it, and a crash between the credit and the status update makes the replay credit again.'
    },
    {
      thought: 'An idempotent compensation needs a distributed lock.',
      reality: 'A compensation runs inside one service against one database, so a conditional update in a local transaction is enough.'
    },
    {
      thought: 'Brokers deliver each message once, so this is an edge case.',
      reality: 'Queues and streams are at-least-once. Redelivery after a consumer crash or a timeout is normal operation, and the compensation has to survive it.'
    }
  ];
}
