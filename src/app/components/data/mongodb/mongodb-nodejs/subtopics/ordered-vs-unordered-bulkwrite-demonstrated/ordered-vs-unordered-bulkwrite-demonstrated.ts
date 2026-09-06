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
    heading: 'A Named Behavior, Never Actually Demonstrated',
    points: [
      'The main page\'s own QnA on bulk operations describes the ordered-vs-unordered <code>bulkWrite()</code> distinction precisely — "ordered: stop on first error"; "unordered: continue on errors, processes all operations, returns combined error list" — but no codeTab anywhere on the page ever runs both modes side by side to show the difference.',
      'Ordered bulk writes (the default) process operations in array order and STOP at the first failure — every operation after the failing one is never even attempted, regardless of whether it would have succeeded on its own.',
      'Unordered bulk writes (<code>{ ordered: false }</code>) process every operation regardless of earlier failures, collecting ALL errors into one combined list at the end — the trade-off is that operations no longer have a guaranteed relative execution order.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Ordered vs. Unordered, Side by Side',
    language: 'typescript',
    code: `// Pure-JS model of MongoDB's documented ordered-vs-unordered
// bulkWrite semantics, applied to 5 operations where #2 and #4 fail.
interface BulkOp { id: number; shouldFail: boolean; errorMsg?: string; }

function runBulkWrite(operations: BulkOp[], ordered: boolean) {
  const succeeded: number[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op.shouldFail) {
      errors.push({ index: i, error: op.errorMsg! });
      if (ordered) break; // ordered: STOP at the first error
      // unordered: continue processing remaining operations
    } else {
      succeeded.push(op.id);
    }
  }
  return { succeeded, failed: errors.length, errors };
}

const operations: BulkOp[] = [
  { id: 1, shouldFail: false },
  { id: 2, shouldFail: true, errorMsg: 'duplicate key' },
  { id: 3, shouldFail: false },
  { id: 4, shouldFail: true, errorMsg: 'duplicate key' },
  { id: 5, shouldFail: false },
];

console.log('Ordered bulkWrite:', runBulkWrite(operations, true));
// -> { succeeded: [1], failed: 1, errors: [{ index: 1, error: 'duplicate key' }] }
// -- stops immediately after op #2 fails; ops #3, #4, #5 never even ran.

console.log('Unordered bulkWrite:', runBulkWrite(operations, false));
// -> { succeeded: [1, 3, 5], failed: 2, errors: [
//       { index: 1, error: 'duplicate key' }, { index: 3, error: 'duplicate key' }
//     ] }
// -- every operation ran; both failures collected into one combined list.

// The real driver call, per MongoDB's own documented option:
await usersCollection.bulkWrite(
  [
    { insertOne: { document: { email: 'a@x.com' } } },
    { insertOne: { document: { email: 'a@x.com' } } }, // duplicate -- fails
    { insertOne: { document: { email: 'b@x.com' } } },
  ],
  { ordered: false } // continue past the duplicate, insert 'b@x.com' too
);`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A bulk import script inserts 1,000 rows from a CSV file using the DEFAULT ordered bulkWrite. Row #7 happens to violate a unique index. Using the model above, roughly how many of the 1,000 rows actually get inserted?',
  hint: 'Ordered bulk writes stop at the FIRST failure — think about how many rows come before row #7 in the array.',
  solution: `// Only 6 rows get inserted (rows #1 through #6) -- ordered bulkWrite
// stops the instant row #7 fails, meaning rows #8 through #1000 (993
// rows) are NEVER EVEN ATTEMPTED, regardless of whether every single
// one of them would have inserted successfully on its own.
//
// This is exactly why bulk CSV imports commonly use { ordered: false }
// -- a single bad row (a duplicate, a validation failure) should not
// silently block hundreds or thousands of otherwise-valid rows behind
// it. With unordered, all 999 valid rows would insert, with row #7's
// failure reported in the combined error list at the end.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Unordered bulkWrite is strictly "safer" than ordered, since it makes more of the batch succeed even when some operations fail — there\'s no real reason to ever use the ordered default.',
    reality: 'Ordered bulkWrite exists specifically for cases where operations depend on each other succeeding IN SEQUENCE (e.g., operation 3 assumes operation 2\'s effect already happened) — stopping at the first failure prevents cascading incorrect writes built on top of a failure. Unordered is the right choice for a batch of genuinely INDEPENDENT operations, like a CSV import, not a universal improvement.',
  },
  {
    thought: 'With unordered bulkWrite, operations still execute in array order on the server — "unordered" just means errors don\'t stop the batch.',
    reality: 'Unordered means MongoDB is free to execute operations in ANY order (including in parallel, across shards) for better throughput — the relative execution order is explicitly NOT guaranteed, which is the actual trade-off being made in exchange for continuing past individual failures, not merely a side effect of "not stopping on error."',
  },
];

@Component({
  selector: 'app-mongo-node-bulkwrite-ordered',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './ordered-vs-unordered-bulkwrite-demonstrated.html',
  styleUrl: './ordered-vs-unordered-bulkwrite-demonstrated.scss',
})
export class OrderedVsUnorderedBulkwriteDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
