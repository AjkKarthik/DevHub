import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Two Separate Things Named "Snapshot" — Only One Is the Default',
    points: [
      'The main page\'s own QnA on read concern <code>"snapshot"</code> used to call it "the default for transactions" — verified against MongoDB\'s own read concern documentation that this is backwards: if no read concern is explicitly set, a transaction inherits from the SESSION\'s own <code>defaultTransactionOptions</code>, then from the CLIENT\'s own default, and only falls back to <code>"local"</code> if neither sets anything — never to <code>"snapshot"</code> automatically.',
      'A SEPARATE, always-on guarantee applies regardless of which read concern level is in effect: every MongoDB transaction gets <strong>snapshot isolation</strong> as a behavior — every read within the SAME transaction sees one consistent view of the data as of the transaction\'s start, no matter what any other writer does mid-transaction. This is a property of the transaction mechanism itself, not something the <code>"snapshot"</code> read concern LEVEL switches on.',
      'Explicitly setting read concern <code>"snapshot"</code> on top of that ADDS something extra: it guarantees the transaction\'s snapshot reflects only <em>majority-committed</em> data, not merely whatever is locally available on the member serving the read — useful when a transaction must never observe data that could later be rolled back.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Resolving the Real Precedence Chain',
    language: 'typescript',
    code: `// Pure-JS model of MongoDB's own documented read concern precedence
// for a transaction, verified against four representative cases.
function resolveReadConcern({ transactionLevel, sessionDefault, clientDefault }: {
  transactionLevel?: string; sessionDefault?: string; clientDefault?: string;
}): string {
  return transactionLevel || sessionDefault || clientDefault || 'local';
}

console.log(resolveReadConcern({}));
// -> 'local'  -- NOTHING set anywhere, the true default -- never 'snapshot'.

console.log(resolveReadConcern({ clientDefault: 'majority' }));
// -> 'majority'  -- only the client-level default was ever configured.

console.log(resolveReadConcern({ sessionDefault: 'snapshot', clientDefault: 'majority' }));
// -> 'snapshot'  -- the session's own defaultTransactionOptions wins over
//                   the client-level default (nearer to the operation).

console.log(resolveReadConcern({ transactionLevel: 'snapshot', sessionDefault: 'local' }));
// -> 'snapshot'  -- startTransaction()'s own explicit option is the
//                   MOST specific setting and always wins.

// What this looks like with the real Node.js driver -- nothing set at
// any level means the transaction below runs under read concern
// "local", NOT "snapshot", even though it still gets full snapshot
// ISOLATION as a behavior of the transaction mechanism itself:
const session = client.startSession(); // no defaultTransactionOptions
session.startTransaction();            // no readConcern passed here either
const order = await client.db('shop').collection('orders')
  .findOne({ _id: orderId }, { session });
// order was read under read concern "local" -- but it is still a
// perfectly valid, isolated snapshot of the data as of transaction start.
await session.commitTransaction();`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A session is created with <code>client.startSession({ defaultTransactionOptions: { readConcern: { level: \'local\' } } })</code>. A specific transaction on that session is then started with <code>session.startTransaction({ readConcern: { level: \'snapshot\' } })</code>. Using the precedence chain above, which read concern actually applies to THIS transaction?',
  hint: 'The chain checks the transaction-level option FIRST, before ever looking at the session default — a later, more specific setting overrides an earlier, more general one.',
  solution: `// "snapshot" applies to this specific transaction.
//
// startTransaction()'s own explicit option is the MOST specific level
// in the chain -- it is checked before the session's own
// defaultTransactionOptions, which is itself only a fallback for
// transactions that don't set their own option. The session default
// of "local" would only apply to a DIFFERENT transaction on the same
// session that does NOT pass its own readConcern to startTransaction().`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Read concern "snapshot" must be the default for a MongoDB transaction — otherwise what would be the point of calling it a transaction at all?',
    reality: 'Verified against MongoDB\'s own documentation: the read concern LEVEL defaults to "local" (inherited from the session, then the client, if nothing is set) — never automatically to "snapshot". Separately, every transaction already gets snapshot ISOLATION as a behavior regardless of read concern level, which is the actual guarantee that makes a transaction meaningfully different from a bare series of independent operations.',
  },
  {
    thought: 'If the read concern level defaults to "local", a transaction offers no real consistency guarantee beyond what a single, ordinary find() already gives you.',
    reality: 'This conflates the read concern LEVEL with snapshot ISOLATION, which are two separate things. Even under read concern "local", every read inside the SAME transaction still sees one consistent view of the data as of the transaction\'s start — a guarantee a bare, non-transactional find() never has. Explicitly requesting read concern "snapshot" only adds the further guarantee that this consistent view is also majority-committed data.',
  },
];

@Component({
  selector: 'app-mongo-txn-read-concern-default',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './read-concern-defaults-to-local-not-snapshot.html',
  styleUrl: './read-concern-defaults-to-local-not-snapshot.scss',
})
export class ReadConcernDefaultsToLocalNotSnapshotSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
