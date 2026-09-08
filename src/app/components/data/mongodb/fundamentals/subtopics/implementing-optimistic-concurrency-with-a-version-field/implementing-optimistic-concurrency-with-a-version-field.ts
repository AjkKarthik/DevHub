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
    heading: 'From "Read the Version, Update Only If It Matches" to Real Code',
    points: [
      'The main page\'s own QnA on concurrent writes states the whole pattern in one sentence: "read the document\'s version, update only if the version matches, increment the version in the update." No codeTab anywhere on the page shows what that filter-and-update actually looks like, or what happens on the losing side of a race.',
      '<code>findOneAndUpdate</code> is the operation that makes this pattern work at all — its filter and update are evaluated ATOMICALLY. Verified via a direct simulation: two concurrent "workers" both read <code>version: 1</code>, but only the FIRST one\'s <code>findOneAndUpdate({ _id, version: 1 }, ...)</code> actually matches a document — the moment it succeeds, the stored version becomes 2, and the SECOND worker\'s identical filter (still looking for <code>version: 1</code>) now matches nothing at all.',
      'A failed optimistic-lock write does not throw an error — <code>findOneAndUpdate</code> simply returns <code>null</code> (no document matched the filter). The calling code must explicitly check for that and decide what to do: re-read the current version and retry, or surface the conflict to the user, depending on what the write represents.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Optimistic Concurrency With a Version Filter',
    language: 'typescript',
    code: `import { Collection } from 'mongodb';

interface InventoryDoc {
  _id: string;
  qty: number;
  version: number;
}

async function updateWithOptimisticLock(
  collection: Collection<InventoryDoc>,
  id: string,
  expectedVersion: number,
  changes: Partial<Pick<InventoryDoc, 'qty'>>
) {
  const result = await collection.findOneAndUpdate(
    { _id: id, version: expectedVersion },   // atomic filter: only matches
                                              // if nothing changed underneath us
    { $set: { ...changes, version: expectedVersion + 1 } },
    { returnDocument: 'after' }
  );

  return result
    ? { ok: true as const, doc: result }
    : { ok: false as const,
        reason: 'version mismatch -- someone else updated this document first' };
}

// Two workers both read the document at version 1
const workerA_readVersion = 1;
const workerB_readVersion = 1;

// Worker A updates first -- succeeds, document is now version 2
const resultA = await updateWithOptimisticLock(inventory, 'sku-42', workerA_readVersion, { qty: 8 });
console.log(resultA); // { ok: true, doc: { _id: 'sku-42', qty: 8, version: 2 } }

// Worker B updates second, still using its own STALE read version (1)
const resultB = await updateWithOptimisticLock(inventory, 'sku-42', workerB_readVersion, { qty: 3 });
console.log(resultB); // { ok: false, reason: 'version mismatch -- someone else updated this document first' }

// Worker B retries after re-reading the CURRENT version (2) -- now succeeds
const current = await inventory.findOne({ _id: 'sku-42' });
const retry = await updateWithOptimisticLock(inventory, 'sku-42', current!.version, { qty: 3 });
console.log(retry); // { ok: true, doc: { _id: 'sku-42', qty: 3, version: 3 } }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose Worker A\'s <code>findOneAndUpdate</code> call is still IN FLIGHT — sent to the server but not yet committed — at the exact moment Worker B\'s own call, using the same stale <code>version: 1</code> filter, also reaches the server. Does Worker B\'s write still get correctly rejected, or does the race depend on which one the server happens to process "first" in some looser sense?',
  hint: 'findOneAndUpdate\'s filter-and-update pair is atomic at the database level — there is no window where the server has "partially" applied A\'s write while evaluating B\'s filter.',
  solution: `// Yes -- Worker B's write is STILL correctly rejected, deterministically,
// regardless of exact network timing. MongoDB serializes writes to the
// SAME document: whichever write the server actually applies FIRST wins
// outright (bumping version to 2), and the other write's filter -- still
// looking for version: 1 -- is evaluated AFTER that change is already
// visible, so it simply matches nothing and returns null.
//
// There is no partial or "half-applied" state a concurrent filter could
// observe. This is exactly what "atomic" means here: from the outside,
// only two orderings are possible (A-then-B or B-then-A), never a mix
// where one write sees the other's update half-finished. This is what
// makes the version-filter pattern a reliable substitute for a full
// multi-document transaction when only ONE document's consistency is at
// stake -- no session, no replica set requirement, just this one atomic
// operation.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A version-mismatch rejection from findOneAndUpdate throws an exception, the same way a unique-index violation on insertOne does.',
    reality: 'It does not throw at all — <code>findOneAndUpdate</code> simply returns <code>null</code>, because its filter genuinely matched zero documents (the version field no longer equals what the filter expected). This is functionally correct MongoDB behavior, not a bug, but it means the calling code MUST explicitly check the return value for <code>null</code> — a version-mismatch race that isn\'t checked for fails completely silently, doing nothing while the caller\'s code proceeds as if the update succeeded.',
  },
  {
    thought: 'The version field pattern is a special MongoDB feature — something built into the driver or the query language itself.',
    reality: 'There is nothing MongoDB-specific about a version field at all — it is ordinary application-level data, just like <code>qty</code> in the example. The ONLY MongoDB-specific piece doing real work is <code>findOneAndUpdate</code>\'s atomicity guarantee (filter-then-update as one indivisible operation) — the exact same atomicity every other single-document write in MongoDB already has. The "pattern" is really just a convention for how an application chooses to USE that atomicity, applicable to any field a team decides to treat as a version counter.',
  },
];

@Component({
  selector: 'app-mongo-fundamentals-optimistic-concurrency',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-optimistic-concurrency-with-a-version-field.html',
  styleUrl: './implementing-optimistic-concurrency-with-a-version-field.scss',
})
export class ImplementingOptimisticConcurrencyWithAVersionFieldSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
