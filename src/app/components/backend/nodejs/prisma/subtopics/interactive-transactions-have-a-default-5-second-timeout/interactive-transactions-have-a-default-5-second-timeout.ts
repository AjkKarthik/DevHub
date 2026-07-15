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
  templateUrl: './interactive-transactions-have-a-default-5-second-timeout.html',
  styleUrl: './interactive-transactions-have-a-default-5-second-timeout.scss'
})
export class InteractiveTransactionsHaveADefault5SecondTimeoutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own interactive-transaction example ("conditional logic inside the transaction") shows a bank-transfer callback with only fast DB calls — worth knowing it also has an invisible clock running, and a real database call that happens to be slow enough breaks it',
      points: [
        'Per Prisma\'s own official documentation, every interactive transaction (prisma.$transaction(async (tx) => { ... })) has two configurable timing limits with specific defaults: maxWait defaults to 2000ms — how long Prisma will wait to acquire a transaction slot/DB connection before giving up — and timeout defaults to 5000ms — the maximum time your callback function itself is allowed to run before Prisma automatically rolls the whole transaction back.',
        'If the callback runs longer than the timeout, Prisma throws a P2028 error and rolls back everything the transaction had done so far — even operations that would have succeeded on their own. At runtime, this typically surfaces as a message like "Transaction is no longer valid. Last state: \'Expired\'" (the exact runtime wording, not literal text quoted from Prisma\'s docs page itself).',
        'Prisma\'s own documentation carries an explicit warning about this: "Use interactive transactions with caution" and specifically "Try to avoid performing network requests and executing slow queries inside your transaction functions" — advising to "Keep transactions short."',
      ]
    },
    {
      heading: 'Why this is easy to trip over, and how to fix it deliberately',
      points: [
        'The main page\'s own bank-transfer example (findUniqueOrThrow, two update() calls, one create()) is exactly the kind of SHORT, fast-database-only transaction Prisma\'s docs recommend — it would virtually never hit the 5-second default. The risk appears the moment someone adds something slower inside that same callback pattern: an external payment-gateway API call to verify the transfer, a slow reporting query, or simply a database under unusual load.',
        'The fix, per Prisma\'s own recommendation, is architectural rather than just "raise the timeout" — move slow, non-database work (external API calls, heavy computation) OUTSIDE the transaction callback entirely, doing it before or after the transaction runs. If a longer transaction is genuinely unavoidable, Prisma does allow explicitly configuring a longer timeout/maxWait via a second options argument, but that\'s a fallback, not the primary recommended fix.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The risky version: a slow call INSIDE the transaction',
      language: 'typescript',
      code: `// Extends the main page's own bank-transfer example with an
// external fraud-check API call — added directly inside the
// transaction callback, seemingly a natural place to put it.
await prisma.$transaction(async (tx) => {
  const from = await tx.account.findUniqueOrThrow({ where: { id: fromId } });
  if (from.balance < amount) throw new Error('Insufficient funds');

  // A slow external API call INSIDE the transaction callback —
  // if this fraud-check service is slow or has a bad day, the
  // ENTIRE transaction can exceed the default 5-second timeout
  // and roll back with a P2028 error, even though every DB
  // operation involved would have succeeded fine on its own.
  const fraudCheck = await fraudCheckService.verify(fromId, toId, amount);
  if (!fraudCheck.approved) throw new Error('Transaction flagged');

  await tx.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } });
  await tx.account.update({ where: { id: toId },   data: { balance: { increment: amount } } });
  await tx.ledger.create({ data: { fromId, toId, amount } });
});`,
    },
    {
      label: 'The fix: move slow work outside the transaction',
      language: 'typescript',
      code: `// Do the slow, non-database work FIRST, outside any transaction —
// this is what Prisma's own docs recommend: keep transaction
// callbacks short, and avoid network requests inside them.
const from = await prisma.account.findUniqueOrThrow({ where: { id: fromId } });
if (from.balance < amount) throw new Error('Insufficient funds');

const fraudCheck = await fraudCheckService.verify(fromId, toId, amount);
if (!fraudCheck.approved) throw new Error('Transaction flagged');

// NOW the transaction callback only does fast, local DB work —
// comfortably inside the 5-second default timeout regardless of
// how the external fraud-check service happens to be performing.
await prisma.$transaction(async (tx) => {
  await tx.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } });
  await tx.account.update({ where: { id: toId },   data: { balance: { increment: amount } } });
  await tx.ledger.create({ data: { fromId, toId, amount } });
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s interactive transaction, which had run reliably in staging for months, starts intermittently failing in production with a P2028 error immediately after they add a step that calls an external shipping-rate API to calculate a fee, using the result inside the same transaction to update an order record. Using Prisma\'s documented transaction timeout behavior, explain the most likely cause and the recommended fix.',
    hint: 'What is the default maximum time an interactive transaction callback is allowed to run before Prisma automatically rolls it back? Does calling a network API inside that callback introduce a new source of unpredictable latency that wasn\'t present before?',
    solution: 'The most likely cause is that the newly-added external shipping-rate API call, running inside the transaction callback, occasionally takes long enough (combined with the existing database operations) to exceed Prisma\'s default 5-second interactive-transaction timeout — triggering an automatic rollback and the P2028 error. This matches Prisma\'s own documented guidance to avoid network requests inside transaction callbacks specifically because external API latency is unpredictable and can push a previously-reliable, fast, database-only transaction over its timeout — exactly the pattern this team just introduced by adding the shipping-rate lookup. The recommended fix is to call the shipping-rate API BEFORE starting the transaction, capture its result, and pass that result into a transaction callback that then only performs fast, local database operations — removing the unpredictable network latency from inside the timed window entirely, rather than trying to solve this by simply raising the timeout value (which treats the symptom, not the underlying architectural issue Prisma\'s own docs specifically warn against).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Prisma interactive transaction can run for as long as its callback function takes to complete — there is no default time limit unless one is explicitly configured.',
      reality: 'This subtopic\'s theory shows the opposite — Prisma\'s own documentation defines a default 5-second timeout (and a separate 2-second maxWait for acquiring a transaction slot) that applies automatically unless explicitly overridden, throwing a P2028 error and rolling back if exceeded.'
    },
    {
      thought: 'Adding an external API call inside an interactive transaction callback (like a fraud check or a shipping-rate lookup) is safe as long as the individual database operations in that same transaction are fast.',
      reality: 'This subtopic\'s code example and exercise both show the opposite — the TOTAL time the entire callback takes, including any external network calls mixed in with the database operations, counts against the same timeout; Prisma\'s own docs specifically warn against putting network requests inside transaction callbacks for exactly this reason.'
    },
    {
      thought: 'The correct fix for a transaction that occasionally times out due to an external API call is to increase the configured timeout value to comfortably cover the API\'s worst-case latency.',
      reality: 'This subtopic\'s theory recommends the opposite as the PRIMARY fix — moving the slow, non-database work outside the transaction callback entirely — with raising the timeout framed as a fallback, not the main recommended approach, since Prisma\'s own guidance is to keep transactions short rather than simply widen the window for slow operations.'
    }
  ];
}
