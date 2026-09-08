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
    heading: 'From "Add a Session" to the Actual Code',
    points: [
      'The main page\'s own QnA on causal consistency describes the shopping-cart scenario precisely: "add item (write to primary), redirect to cart page (read may hit secondary) — without causal consistency, the item might not appear." It names <code>client.startSession()</code> and the <code>afterClusterTime</code> mechanism by name — but no codeTab anywhere on the page shows a session actually being created or passed to an operation.',
      'The fix is passing the SAME <code>ClientSession</code> object to every operation in the causally-related sequence, via the <code>{ session }</code> option. The driver automatically tracks the write\'s <code>operationTime</code> on that session, and every SUBSEQUENT read through the same session waits (via <code>afterClusterTime</code>) until whichever node it happens to read from has replicated up to at least that point — even if that node is a secondary.',
      'The guarantee is scoped to the session, not to the collection or the application globally — an operation on the SAME data that does not pass <code>{ session }</code> gets no causal-consistency guarantee at all, and could still read stale data from a lagging secondary, regardless of how recently a write happened through a different session (or no session).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Add Item, Then Read It Back — Causally Consistent',
    language: 'typescript',
    code: `import { MongoClient } from 'mongodb';

async function addItemAndReturnCart(client: MongoClient, userId: string, item: object) {
  const session = client.startSession(); // causal consistency is ON by default

  try {
    const carts = client.db('shop').collection('carts');

    // The write -- may go to any node the driver selects, but goes
    // THROUGH the session either way.
    await carts.updateOne(
      { _id: userId as any },
      { \$push: { items: item } },
      { session, upsert: true }
    );

    // The read -- even if it lands on a SECONDARY replica, passing the
    // SAME session guarantees it reflects the write above, because the
    // driver waits for that secondary to catch up to the write's own
    // operationTime before returning.
    const cart = await carts.findOne(
      { _id: userId as any },
      { session }
    );

    return cart;
  } finally {
    await session.endSession();
  }
}

// Contrast: a read WITHOUT the session has no such guarantee --
async function readCartWithoutSession(client: MongoClient, userId: string) {
  const carts = client.db('shop').collection('carts');
  // No { session } here -- if this happens to hit a lagging secondary
  // moments after the write above, the newly-added item might not
  // appear yet, regardless of how the write itself was done.
  return carts.findOne({ _id: userId as any });
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A function writes an item to a cart using session A, then a completely separate, unrelated request handler calls <code>carts.findOne({ _id: userId })</code> with NO session at all, milliseconds later. Does that second call get the causal-consistency guarantee from session A\'s own write?',
  hint: 'The guarantee is tracked per ClientSession object, not per document, not per collection, and not globally across the application — trace exactly what object the guarantee actually attaches to.',
  solution: `// No -- the causal-consistency guarantee is scoped to the SESSION
// OBJECT itself, not to the document, the collection, or the
// application as a whole. Session A's write updates session A's own
// tracked operationTime; a completely separate call that passes no
// session (or a DIFFERENT session that never observed that write) has
// no way to know it needs to wait for that specific write to replicate.
//
// This second call could genuinely read stale data if it happens to
// land on a secondary that hasn't caught up yet -- exactly the same
// staleness risk the main page's own QnA describes, just now clearly
// scoped to "which calls pass which session object," not merely
// "did a write happen recently somewhere in the app."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Causal consistency is a collection-wide or database-wide setting you turn on once, after which every read anywhere reflects every prior write.',
    reality: 'It is scoped to individual ClientSession objects, created and passed explicitly on a per-operation basis via { session } — there is no global switch. A large application with many independent request handlers needs to deliberately thread the SAME session through every operation in one causally-related sequence (like the add-then-redirect-then-read flow in the main page\'s own example); operations outside that thread get no guarantee regardless of how the rest of the application is configured.',
  },
  {
    thought: 'Passing { session } to a read makes it as fast as a normal read — the guarantee is essentially free.',
    reality: 'The main page\'s own QnA states the real cost directly: "slightly higher read latency because secondary must wait to catch up to the write time." If the node a causally-consistent read happens to land on is genuinely behind the write\'s own operationTime, the driver\'s wait for it to catch up is real, observable latency — not merely a bookkeeping overhead. For reads that must see the absolute latest data with no tolerance for that wait, readPreference: primary is the main page\'s own recommended alternative.',
  },
];

@Component({
  selector: 'app-mongo-crud-causal-consistency',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './session-based-causal-consistency-for-read-your-writes.html',
  styleUrl: './session-based-causal-consistency-for-read-your-writes.scss',
})
export class SessionBasedCausalConsistencyForReadYourWritesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
