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
    heading: 'bulkWrite Gets an Entire Theory Section — and Zero Code',
    points: [
      'The main page names <code>bulkWrite()</code> in the QuickRef, gives it an entire theory heading ("Bulk Operations for Write Efficiency"), and covers it in two separate QnAs — but none of the four codeTabs (Insert, Read, Update, Delete) ever shows the actual <code>bulkWrite()</code> call syntax. Every operation inside the array must be wrapped in its own key naming the intent — <code>{ insertOne: { document } }</code>, <code>{ updateOne: { filter, update } }</code>, <code>{ deleteOne: { filter } }</code> — a structural detail the prose never demonstrates.',
      'The result of a <code>bulkWrite()</code> call carries per-operation-type counts — <code>insertedCount</code>, <code>modifiedCount</code>, <code>deletedCount</code>, <code>upsertedCount</code> — and, with <code>{ ordered: false }</code>, a <code>writeErrors</code> array naming exactly which operations in the batch failed and why, without the whole call rejecting.',
      'The main page\'s own QnA on ordered bulkWrite failures describes this precisely in prose ("the BulkWriteError result includes exactly which operations succeeded... so calling code can determine what still needs to be retried") — this subtopic builds the actual result-inspection code that prose describes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Mixed bulkWrite Call',
    language: 'typescript',
    code: `const products = db.collection('products');

const result = await products.bulkWrite(
  [
    { insertOne: { document: { name: 'Webcam', price: 59.99, inStock: true } } },
    { updateOne: {
        filter: { name: 'Laptop' },
        update: { \$set: { price: 899.99 } },
    } },
    { deleteOne: { filter: { name: 'Discontinued Item' } } },
    { updateMany: {
        filter: { inStock: false },
        update: { \$set: { clearance: true } },
    } },
  ],
  { ordered: false } // continue past individual failures, collect all errors
);

console.log({
  insertedCount: result.insertedCount,
  matchedCount:  result.matchedCount,
  modifiedCount: result.modifiedCount,
  deletedCount:  result.deletedCount,
});

// Inspecting which specific operations failed:
if (result.hasWriteErrors && result.hasWriteErrors()) {
  for (const err of result.getWriteErrors()) {
    // err.index -- the position of the FAILED operation in the original array
    // err.errmsg -- why it failed (e.g. duplicate key)
    console.warn(\`Operation at index \${err.index} failed: \${err.errmsg}\`);
  }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A bulkWrite array has 5 operations. With <code>{ ordered: true }</code> (the default), operation index 2 fails with a duplicate key error. What does the result object tell you about operations at index 3 and 4 — did they run, and would they appear in writeErrors if they had their own separate problems?',
  hint: 'ordered:true stops the WHOLE batch execution at the first failure — think about what "stops" means for every operation still queued after that point.',
  solution: `// Operations at index 3 and 4 never ran at all -- ordered:true means
// execution stops IMMEDIATELY at the first failure (index 2), and every
// operation queued after it in the array is simply never attempted.
//
// This also means index 3 and 4 would NEVER appear in writeErrors,
// even if they would have had their own separate problems (say, index 4
// also targets a duplicate key) -- writeErrors only ever reports on
// operations that were actually ATTEMPTED. An ordered bulkWrite's error
// report can never be a complete picture of every problem in the batch,
// only of the problems encountered before execution stopped -- which is
// exactly why the main page's own QnA recommends ordered:false whenever
// you need to see every failure in one pass rather than fixing them one
// at a time across repeated retries.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'bulkWrite() operations execute as one atomic transaction — either the whole batch commits or none of it does.',
    reality: 'Each operation in the array is applied INDEPENDENTLY, exactly as if it had been called on its own — bulkWrite is purely a network-efficiency optimization (one round trip instead of several), not a transactional guarantee. The main page\'s own QnA on ordered-batch partial failure states this directly: operations that already succeeded before a later failure REMAIN committed, with no automatic rollback. Genuine all-or-nothing behavior across multiple operations requires a real multi-document transaction instead.',
  },
  {
    thought: 'Passing { insertOne: {...} } directly as one array element is just a stylistic wrapper — you could equally pass the plain document and MongoDB would infer the operation type from context.',
    reality: 'The wrapping key is not optional stylistic sugar — it IS how bulkWrite distinguishes which of the six supported operation types (insertOne, updateOne, updateMany, deleteOne, deleteMany, replaceOne) each array element represents. Passing a bare document with no wrapping key is not valid input at all; the driver has no other way to know whether that object is meant as an insert, an update filter, or something else.',
  },
];

@Component({
  selector: 'app-mongo-crud-bulkwrite-mixed',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mixing-operations-in-a-real-bulkwrite-call.html',
  styleUrl: './mixing-operations-in-a-real-bulkwrite-call.scss',
})
export class MixingOperationsInARealBulkwriteCallSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
