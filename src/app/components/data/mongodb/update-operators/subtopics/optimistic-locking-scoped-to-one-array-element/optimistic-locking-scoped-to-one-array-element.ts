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
    heading: 'A Lock Scoped to One Slot, Not the Whole Document',
    points: [
      'The main page\'s own QnA describes it in one sentence: "include the current value in the query to detect concurrent modifications: db.col.updateOne({ _id: id, \'items.2.qty\': currentQty }, { $set: { \'items.2.qty\': newQty } }). If another client modified items.2.qty between your read and update, matchedCount is 0 and you can retry." No codeTab demonstrates the race this actually protects against.',
      'This is deliberately NARROWER than a whole-document version-field pattern (already covered in this hub\'s own Fundamentals topic) — the filter here checks the CURRENT VALUE of one specific array element directly, rather than a separate version counter covering the entire document. Two concurrent writes to two DIFFERENT elements of the SAME document never conflict with each other at all under this pattern, since each write\'s filter only cares about its own element\'s value.',
      'Verified via a direct simulation: Worker A reads <code>items[2].qty = 10</code> and updates it to 7 — succeeds, since the filter matches. Worker B ALSO read <code>qty = 10</code> (now stale, since A already changed it) and tries to update to 3 using that same stale filter value — <code>matchedCount: 0</code>, correctly rejected. Worker B then re-reads the current value (7) and retries — succeeds.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Locking One Array Element by Its Own Value',
    language: 'typescript',
    code: `const orders = db.collection('orders');

async function updateItemQtyOptimistic(
  orderId: string,
  itemIndex: number,
  expectedQty: number,
  newQty: number
) {
  const filterKey = \`items.\${itemIndex}.qty\`;
  const updateKey = \`items.\${itemIndex}.qty\`;

  const result = await orders.updateOne(
    { _id: orderId, [filterKey]: expectedQty },
    { $set: { [updateKey]: newQty } }
  );

  if (result.matchedCount === 0) {
    // Either the order doesn't exist, OR (far more likely) someone
    // else already changed items[itemIndex].qty since we last read it.
    throw new Error('Concurrent modification detected -- re-read and retry');
  }

  return result;
}

// Worker A reads qty = 10, updates to 7 -- succeeds
await updateItemQtyOptimistic('order-1', 2, 10, 7);

// Worker B ALSO read qty = 10 (now stale) -- rejected
try {
  await updateItemQtyOptimistic('order-1', 2, 10, 3);
} catch {
  // Re-read the current value (7) and retry
  await updateItemQtyOptimistic('order-1', 2, 7, 3); // succeeds
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Worker C concurrently reads <code>items[0].qty</code> (a DIFFERENT array element than the one Worker A and B were racing over) and updates it. Does Worker C\'s update conflict with Worker A or B\'s updates to <code>items[2].qty</code> in any way, under this pattern?',
  hint: 'Look at exactly what field the filter checks -- items.2.qty specifically, not the whole items array and not the whole document.',
  solution: `// No conflict at all. Worker C's filter checks items.0.qty; Worker A
// and B's filters check items.2.qty -- two completely independent
// fields as far as MongoDB's matching is concerned. All three updates
// can succeed in any interleaving with zero contention between them.
//
// This is the real trade-off versus a whole-document version field:
// a single shared version counter would make Worker C's update ALSO
// conflict with A and B's (since any write bumps the shared version,
// invalidating every other in-flight optimistic check on that same
// document) -- much safer in the sense of catching more potential
// races, but at the cost of unrelated concurrent writes to different
// parts of the same document needlessly colliding with each other.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'This pattern and the whole-document version-field pattern (covered elsewhere in this hub) are the same technique, just applied to different fields.',
    reality: 'They protect against different SCOPES of conflict, not just different fields. A version-field lock on the whole document catches ANY concurrent write anywhere in that document, including ones the current operation never even reads. This array-element-value lock only catches conflicts on the SPECIFIC field named in the filter — a concurrent write to a sibling field (even within the same array element) would not be detected at all, since the filter never checks it.',
  },
  {
    thought: 'Using the current value itself as the lock (items.2.qty: expectedQty) is just as safe as a dedicated version counter, since both work the same way — filter, then check matchedCount.',
    reality: 'A dedicated version counter increments on EVERY write, so it can detect a conflict even when a write happens to set the field back to the same value it started with (e.g., qty going 10 → 5 → 10 from two different writers). Using the raw current value as the lock cannot distinguish "nobody touched this since I read it" from "someone touched it and coincidentally left it at the same value" -- a real, if narrow, gap a dedicated version field does not have.',
  },
];

@Component({
  selector: 'app-mongo-update-array-element-lock',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './optimistic-locking-scoped-to-one-array-element.html',
  styleUrl: './optimistic-locking-scoped-to-one-array-element.scss',
})
export class OptimisticLockingScopedToOneArrayElementSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
