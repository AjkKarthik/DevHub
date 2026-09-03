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
    heading: 'The Challenge Solution\'s Original addReview Had a Real Race Condition',
    points: [
      'The main page\'s own Challenge solution originally called <code>findOneAndUpdate</code> to atomically increment <code>reviewCount</code>/<code>ratingSum</code> and push into <code>recentReviews</code>, then made a SEPARATE, later <code>updateOne</code> call to compute and store <code>avgRating</code> from a snapshot captured by the first call.',
      'This is exactly the kind of gap the page\'s own EARLIER "Computed Pattern" codeTab correctly guards against — that codeTab wraps its own two writes (insert a review, update product stats) in a real MongoDB transaction. The Challenge solution\'s addReview used no transaction and no atomicity between its two writes at all.',
      'Verified via a precise concurrency model: if two addReview calls for the SAME product genuinely interleave, the FIRST call\'s own "recompute avgRating" step can run AFTER the second call\'s full increment has already landed, but using its OWN, now-STALE reviewCount/ratingSum snapshot — silently overwriting the correct, freshly-computed avgRating with a wrong one, computed from data that\'s already out of date.',
      'The fix, confirmed against MongoDB\'s own documentation for update-with-aggregation-pipeline, combines everything into ONE atomic call: passing an ARRAY of <code>$set</code> stages (instead of a plain update document) to <code>updateOne</code>. Unlike a single <code>$addFields</code> stage\'s siblings (covered by a sibling subtopic on Aggregation Expressions), a LATER <code>$set</code> stage in this array CAN reference a field set by an EARLIER stage in the SAME array — so <code>avgRating</code> can be computed from the just-incremented <code>reviewCount</code>/<code>ratingSum</code>, atomically, in the exact same operation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Buggy Two-Write vs. Fixed One-Write addReview',
    language: 'typescript',
    code: `// BUGGY (the Challenge solution's original form) -- two SEPARATE
// writes, with no atomicity between them.
async function buggyAddReview(productId, rating) {
  const updateResult = await db.collection('products').findOneAndUpdate(
    { _id: productId },
    { \$inc: { reviewCount: 1, ratingSum: rating } },
    { returnDocument: 'after' }
  );
  // A concurrent buggyAddReview() call for the SAME product can run its
  // OWN full increment + recompute HERE, before this line executes.
  const { reviewCount, ratingSum } = updateResult;
  await db.collection('products').updateOne(
    { _id: productId },
    { \$set: { avgRating: Math.round((ratingSum / reviewCount) * 10) / 10 } }, // STALE if interleaved
  );
}

// FIXED -- ONE atomic call, using an update-with-aggregation-pipeline
// (an array of \$set stages instead of a plain update document).
async function fixedAddReview(productId, rating) {
  await db.collection('products').updateOne(
    { _id: productId },
    [
      { \$set: {
        reviewCount: { \$add: ['\$reviewCount', 1] },
        ratingSum:   { \$add: ['\$ratingSum', rating] },
      }},
      { \$set: {
        // This SECOND stage CAN reference \$reviewCount/\$ratingSum set
        // by the FIRST stage -- unlike a single \$addFields stage.
        avgRating: { \$round: [{ \$divide: ['\$ratingSum', '\$reviewCount'] }, 1] },
      }},
    ]
  );
}

// Pure-JS concurrency model, verified against the exact interleaving
// that breaks the buggy version -- call A starts, call B FULLY
// completes (both its own steps) before call A's own step 2 runs:
function atomicInc(doc, incReviewCount, incRatingSum) {
  doc.reviewCount += incReviewCount;
  doc.ratingSum += incRatingSum;
  return { ...doc };
}
function buggyTwoWriteAddReview(store, rating, otherCallInterleaves) {
  const snapshot = atomicInc(store, 1, rating);       // step 1: atomic, correct
  if (otherCallInterleaves) otherCallInterleaves();    // concurrent call runs HERE
  store.avgRating = Math.round((snapshot.ratingSum / snapshot.reviewCount) * 10) / 10; // step 2: STALE
}

let store = { reviewCount: 0, ratingSum: 0, avgRating: 0 };
buggyTwoWriteAddReview(store, 5, () => buggyTwoWriteAddReview(store, 3));
console.log('Buggy two-write result:', store);
// -> { reviewCount: 2, ratingSum: 8, avgRating: 5 }   -- WRONG (should be 4.0)

function fixedOneWriteAddReview(store, rating) {
  store.reviewCount += 1;
  store.ratingSum += rating;
  store.avgRating = Math.round((store.ratingSum / store.reviewCount) * 10) / 10; // SAME op, fresh state
}
store = { reviewCount: 0, ratingSum: 0, avgRating: 0 };
fixedOneWriteAddReview(store, 5);
fixedOneWriteAddReview(store, 3);
console.log('Fixed one-write result:', store);
// -> { reviewCount: 2, ratingSum: 8, avgRating: 4 }   -- correct`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own JSON Schema Validation codeTab shows a totally different scenario — creating a collection validator. Does a $jsonSchema validator do anything to PREVENT the race condition this subtopic describes? Why or why not?',
  hint: 'Think about WHAT a validator actually checks — the shape/type of a document being written — versus WHEN two separate write operations for the same document happen to interleave.',
  solution: `// No -- a $jsonSchema validator does nothing to prevent this race.
// A validator checks that EACH INDIVIDUAL write (each updateOne call
// on its own) produces a document matching the required shape/types --
// it has no concept of "two separate operations, spaced apart in
// time, together represent one logical unit of work." Both the buggy
// version's step-2 write (a valid { $set: { avgRating: <number> } })
// and the fixed version's single write would pass an IDENTICAL
// $jsonSchema check individually -- the validator can't see that the
// buggy version's avgRating was computed from stale data, since by
// the time it runs, it's just looking at one, perfectly
// well-typed update on its own. Preventing THIS class of bug needs
// either a transaction (wrapping multiple writes as one unit) or,
// as this subtopic shows, combining the writes into a genuinely
// single atomic operation in the first place -- a schema validator
// operates at a completely different layer.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since MongoDB guarantees single-document writes are atomic, any sequence of $inc/$push/$set operations on the same document is automatically safe from race conditions, as long as each individual call uses atomic update operators.',
    reality: 'Each INDIVIDUAL call (findOneAndUpdate, updateOne) is atomic on its own — but a sequence of SEPARATE calls, even if each one individually uses atomic operators, is NOT atomic as a whole. Verified directly: the buggy version\'s first call ($inc) is perfectly atomic, and its second call ($set) is also perfectly atomic — the bug is entirely in the GAP between the two calls, where a concurrent operation can interleave.',
  },
  {
    thought: 'Fixing this kind of race condition always requires wrapping the writes in a multi-document transaction, the same way the page\'s own earlier Computed Pattern codeTab does.',
    reality: 'A transaction is one valid fix (and is necessary when the writes genuinely span MULTIPLE documents or collections, like the Computed Pattern codeTab\'s reviews-collection insert plus products-collection update). But when every field that needs to be consistent lives on the SAME single document, an update-with-aggregation-pipeline (an array of $set stages) can achieve the same atomicity guarantee with no transaction overhead at all — verified that a later stage in the array genuinely sees the earlier stage\'s newly-set fields, unlike a single $addFields stage\'s own siblings.',
  },
];

@Component({
  selector: 'app-mongo-schema-atomic-update',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './one-atomic-update-pipeline-call-instead-of-two-racy-writes.html',
  styleUrl: './one-atomic-update-pipeline-call-instead-of-two-racy-writes.scss',
})
export class OneAtomicUpdatePipelineCallInsteadOfTwoRacyWritesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
