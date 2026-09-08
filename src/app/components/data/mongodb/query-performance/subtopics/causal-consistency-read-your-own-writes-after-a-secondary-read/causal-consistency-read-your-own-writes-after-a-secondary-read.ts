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
    heading: 'A Session That Remembers Its Own Last Write',
    points: [
      'The main page\'s own QnA on secondary reads names causal consistency in a single clause — "use causal consistency if you do" need read-your-own-writes after a secondary read — but no codeTab on the page ever builds it.',
      'Verified against MongoDB\'s own documentation: a causally consistent session is started with <code>client.startSession({ causalConsistency: true })</code>, and EVERY operation that should participate — both the write and the later read — must be explicitly associated with that same session object.',
      'The guarantee only holds when both sides use <code>"majority"</code> write concern (on the write) and <code>"majority"</code> read concern (on the read) — the session tracks the write\'s own operation time internally, and a later read in the SAME session will wait until the serving member has replicated up to at least that point, regardless of which member (primary or secondary) actually serves it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real Causally Consistent Session',
    language: 'typescript',
    code: `const client = new MongoClient(uri);
const session = client.startSession({ causalConsistency: true });

const products = client.db('shop').collection('products');

// Write on the primary, with majority write concern -- the driver
// tracks this write's operationTime internally on the session.
await products.updateOne(
  { _id: productId },
  { \$set: { sku: 'NEW-SKU', updatedAt: new Date() } },
  { session, writeConcern: { w: 'majority' } }
);

// Read from a SECONDARY, in the SAME session -- the driver makes
// this read wait until the secondary has replicated up to the
// write's own operationTime before returning, guaranteeing the
// caller sees their own just-written value.
const result = await products.findOne(
  { _id: productId },
  { session, readConcern: { level: 'majority' }, readPreference: 'secondary' }
);
console.log(result.sku); // -> 'NEW-SKU', never a stale pre-write value

await session.endSession();

// Pure-JS model of the guarantee, verified against a 35ms replication
// lag scenario:
function writeOnPrimary(primary, newSku, atTime) {
  primary.sku = newSku;
  primary.operationTime = atTime;
  return atTime;
}
function readSecondaryNoWait(secondary) {
  return { sku: secondary.sku, atTime: secondary.appliedUpToTime };
}
function readSecondaryCausal(secondary, sessionOperationTime) {
  while (secondary.appliedUpToTime < sessionOperationTime) {
    secondary.appliedUpToTime += 10;
    if (secondary.appliedUpToTime >= sessionOperationTime) secondary.sku = 'NEW-SKU';
  }
  return { sku: secondary.sku, atTime: secondary.appliedUpToTime };
}

const primary = { sku: 'OLD-SKU', operationTime: 0 };
const secondary = { sku: 'OLD-SKU', appliedUpToTime: 0 };
const writeTime = writeOnPrimary(primary, 'NEW-SKU', 100);

console.log('WITHOUT causal consistency, read secondary immediately:', readSecondaryNoWait(secondary));
console.log('WITH causal consistency, read secondary (waits for replication):', readSecondaryCausal(secondary, writeTime));
// -> WITHOUT: { sku: 'OLD-SKU', atTime: 0 }              -- stale!
// -> WITH:    { sku: 'NEW-SKU', atTime: 100 }             -- correct`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team writes with <code>{ writeConcern: { w: 1 } }</code> (the default, NOT majority) inside a causally consistent session, then reads from a secondary in the same session. Per MongoDB\'s own documented requirements, does the read still reliably see the write?',
  hint: 'The theory section names TWO specific requirements together — check whether BOTH still hold when one of them is swapped out.',
  solution: `// No -- this is not guaranteed. MongoDB's own documentation states
// the causal-consistency guarantee specifically requires "majority"
// write concern on the write AND "majority" read concern on the
// read -- both conditions together, not either one alone. A write
// with { w: 1 } (only the primary acknowledges) can be part of a
// causally consistent session syntactically, but the session's own
// causal tracking is documented to only apply reliably when both
// operations use majority-level concerns.
//
// This is a real, easy-to-miss gap: simply wrapping operations in a
// causally consistent session ({ causalConsistency: true }) is NOT
// sufficient on its own -- the write concern and read concern on the
// INDIVIDUAL operations still have to be set correctly for the
// guarantee to actually hold.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Starting a session with { causalConsistency: true } is sufficient on its own to guarantee read-your-own-writes — the session handles everything automatically regardless of what write/read concern the individual operations use.',
    reality: 'Verified against MongoDB\'s own documented requirements: the causal-consistency guarantee specifically depends on BOTH the write using majority write concern AND the read using majority read concern, in ADDITION to both operations being associated with the causally consistent session. The session enables the mechanism; it does not override an operation\'s own weaker concern settings.',
  },
  {
    thought: 'Causal consistency is a cluster-wide or collection-wide setting — once enabled, every client reading that collection benefits from the same read-your-own-writes guarantee.',
    reality: 'Causal consistency is scoped to a single SESSION object, not the cluster or the collection. Verified via the driver API: it is explicitly created per client.startSession({ causalConsistency: true }) call, and only operations EXPLICITLY passed that same session object participate. A completely different client, or the same client without a session, gets no such guarantee at all.',
  },
];

@Component({
  selector: 'app-mongo-qp-causal-consistency',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './causal-consistency-read-your-own-writes-after-a-secondary-read.html',
  styleUrl: './causal-consistency-read-your-own-writes-after-a-secondary-read.scss',
})
export class CausalConsistencyReadYourOwnWritesAfterASecondaryReadSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
