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
  templateUrl: './relay-lock-was-released-before-publishing.html',
  styleUrl: './relay-lock-was-released-before-publishing.scss'
})
export class RelayLockWasReleasedBeforePublishingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A lock that protects nothing because it\'s already gone',
      points: [
        'The "Relay Process" codeTab\'s comment says the <code>FOR UPDATE SKIP LOCKED</code> query exists specifically to "lock to prevent duplicate relay workers." The mechanism is real and correct in principle — but the code originally ran the <code>SELECT ... FOR UPDATE SKIP LOCKED</code> as one standalone <code>db.query(...)</code> call, then looped through the results calling <code>broker.publish()</code> and a SEPARATE <code>db.query(...)</code> for the <code>UPDATE</code>, with no explicit transaction wrapping any of it.',
        'A row lock acquired by <code>FOR UPDATE</code> is only held for the life of the TRANSACTION that acquired it. If each standalone <code>db.query()</code> call runs in its own auto-committed transaction (the normal default when there\'s no explicit <code>BEGIN</code>/transaction wrapper), the SELECT\'s transaction — and the lock with it — ends the moment the SELECT itself finishes, well before <code>broker.publish()</code> or the <code>UPDATE</code> ever run.',
        'That means a second, concurrent relay worker calling the identical <code>SELECT ... FOR UPDATE SKIP LOCKED</code> query moments later would see the row as UNLOCKED (because the first worker\'s lock already released) and pick up the SAME unpublished row — reproducing, in the exact codeTab that claims to prevent it, the precise double-publish scenario the page\'s OWN "Running multiple relay workers without row-level locking" mistake block warns against.',
      ]
    },
    {
      heading: 'Why this is a self-contained catch, and the minimal fix',
      points: [
        'This is a self-contained catch requiring no external research — just knowing the basic PostgreSQL fact that a row lock lasts exactly as long as its enclosing transaction, and checking whether the code actually kept the SELECT and the subsequent publish-and-mark-published steps inside ONE transaction. It didn\'t.',
        'The fix is minimal: wrap the SELECT, the loop, and the UPDATE inside a single <code>db.transaction(async (tx) => {...})</code> call — the exact same pattern this page\'s own "Outbox Pattern" codeTab already uses for its own atomic write. Now the lock genuinely stays held until each row has either been published-and-marked or the transaction ends, which is what actually makes <code>SKIP LOCKED</code> do its job for a second concurrent worker.',
        'A useful check for any code using <code>SELECT ... FOR UPDATE</code> (or any row-locking read) for exactly this purpose: does everything that needs the lock\'s protection happen inside the SAME transaction as the locking SELECT, or does the code drift outside that transaction boundary somewhere along the way?',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same lock statement, two very different guarantees',
      language: 'typescript',
      code: `// BEFORE -- SELECT FOR UPDATE SKIP LOCKED, but NOT inside one transaction
// with the publish + UPDATE that follow it
async function relayBroken(): Promise<void> {
  const rows = await db.query(\`
    SELECT id, topic, payload FROM outbox
    WHERE published_at IS NULL
    ORDER BY created_at LIMIT 100
    FOR UPDATE SKIP LOCKED
  \`);
  // <- the SELECT's own transaction has already committed HERE,
  //    releasing every lock it acquired, before this loop even starts

  for (const row of rows.rows) {
    await broker.publish(row.topic, row.payload);
    await db.query('UPDATE outbox SET published_at = NOW() WHERE id = $1', [row.id]);
  }
  // A second worker's SELECT ... FOR UPDATE SKIP LOCKED, run at this exact
  // moment, sees these rows as UNLOCKED and picks them up too.
}

// AFTER -- everything that needs the lock's protection happens inside
// the SAME transaction as the locking SELECT
async function relay(): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx.query(\`
      SELECT id, topic, payload FROM outbox
      WHERE published_at IS NULL
      ORDER BY created_at LIMIT 100
      FOR UPDATE SKIP LOCKED
    \`);
    // The lock is held for as long as THIS transaction is open --
    // a second worker's own SELECT ... SKIP LOCKED correctly skips
    // these rows until this transaction commits or rolls back.

    for (const row of rows.rows) {
      await broker.publish(row.topic, row.payload);
      await tx.query('UPDATE outbox SET published_at = NOW() WHERE id = $1', [row.id]);
    }
  });
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two relay worker processes both run the SELECT ... FOR UPDATE SKIP LOCKED query at roughly the same moment, targeting the same outbox table. Worker A\'s SELECT completes first, but its subsequent broker.publish() calls run OUTSIDE of any transaction that still holds those rows\' locks. What is the most likely outcome for Worker B?',
    hint: 'FOR UPDATE SKIP LOCKED tells worker B to skip rows that are CURRENTLY locked. Is worker A\'s lock still held by the time worker B runs its own SELECT?',
    solution: 'If Worker A\'s SELECT ran in its own auto-committed transaction (no explicit transaction wrapping the subsequent publish + UPDATE steps), Worker A\'s lock is already released by the time Worker B runs its own SELECT ... FOR UPDATE SKIP LOCKED shortly after -- SKIP LOCKED only skips rows that are locked RIGHT NOW, and these rows aren\'t locked anymore. Worker B would select the SAME rows Worker A already selected (and is in the middle of publishing), and both workers would independently publish the same events to the broker -- the exact double-publish scenario the locking was supposed to prevent. The fix is keeping the SELECT and everything that depends on its lock inside one transaction, so the lock is genuinely still held while Worker A is doing the actual publish work.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Using SELECT ... FOR UPDATE SKIP LOCKED anywhere in a relay function is sufficient to prevent two workers from processing the same row, regardless of how the rest of the code is structured.',
      reality: 'Per this subtopic\'s theory, the lock only protects code that runs INSIDE the same transaction as the locking SELECT — code that runs after that transaction has already committed gets no protection from a lock that no longer exists.'
    },
    {
      thought: 'A comment stating that a query "locks to prevent duplicate workers" is good evidence the surrounding code actually achieves that.',
      reality: 'Per this subtopic\'s theory, a comment describing the INTENDED protection doesn\'t verify the code actually delivers it — the same "check whether the code does what the comment claims" discipline already applied to catching other gaps in this hub.'
    },
    {
      thought: 'This kind of transaction-boundary bug would be immediately obvious in testing, since a single relay worker running alone would clearly show something is wrong.',
      reality: 'Per this subtopic\'s theory, a single relay worker running alone behaves completely correctly — the bug only manifests when a SECOND worker runs concurrently, which is exactly the scenario the page\'s own "Running multiple relay workers" mistake block describes as a real production risk, not something obvious from single-worker testing.'
    }
  ];
}
