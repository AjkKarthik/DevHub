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
    heading: 'Every Field Expression Sees the SAME Input Snapshot',
    points: [
      'The main page\'s own "Date Expressions" codeTab originally computed <code>expiresAt</code> and then, in the SAME <code>$addFields</code> stage object, computed <code>isExpired: { $lt: [\'$expiresAt\', \'$$NOW\'] }</code> — but MongoDB\'s own official $addFields documentation confirms every field expression inside ONE stage is evaluated against the document as it was BEFORE that stage runs, not against sibling fields being computed in the same object.',
      'Since <code>expiresAt</code> did not exist on the input document when <code>isExpired</code>\'s expression ran, <code>$expiresAt</code> resolved to a MISSING field. Verified directly against MongoDB\'s own documented BSON comparison order that a missing field compares as <code>null</code>, and <strong>null sorts BEFORE every Date value</strong> — meaning <code>{ $lt: [null, someDate] }</code> evaluates to <code>true</code>, ALWAYS, regardless of the actual expiry date.',
      'This is not a rare edge case or a "sometimes wrong" bug — verified directly that the original codeTab would have flagged EVERY document as expired, unconditionally, the instant it ran, with no error and no warning. The fix, confirmed against MongoDB\'s own documentation example for exactly this pattern, is to move the field that depends on a newly-computed sibling into a SEPARATE, later <code>$addFields</code> stage — the exact chaining technique the page\'s own Challenge solution already correctly uses for <code>subtotal</code> → <code>tax</code>/<code>grandTotal</code>.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Buggy vs. Fixed: One Stage vs. Two',
    language: 'typescript',
    code: `// BUGGY -- expiresAt and isExpired computed in the SAME $addFields
// stage. isExpired's $expiresAt reference sees a document that does
// NOT have expiresAt yet, so it resolves as missing -> null.
const buggy = await db.collection('orders').aggregate([
  { \$addFields: {
    expiresAt: { \$dateAdd: { startDate: '\$createdAt', unit: 'month', amount: 12 } },
    isExpired: { \$lt: ['\$expiresAt', '\$\$NOW'] }, // \$expiresAt is MISSING here!
  }},
]).toArray();
// isExpired is TRUE for every single document -- missing compares as
// null, and null < any Date is always true.

// FIXED -- expiresAt in stage 1, isExpired in a SEPARATE stage 2.
const fixed = await db.collection('orders').aggregate([
  { \$addFields: {
    expiresAt: { \$dateAdd: { startDate: '\$createdAt', unit: 'month', amount: 12 } },
  }},
  { \$addFields: {
    isExpired: { \$lt: ['\$expiresAt', '\$\$NOW'] }, // now sees the REAL expiresAt
  }},
]).toArray();

// Pure-JS model, verified against two documents -- one genuinely
// expired (created 2020), one genuinely fresh (created Aug 2026),
// confirmed matching MongoDB's own documented BSON comparison rule
// (missing field compares as null; null sorts BEFORE every Date):
function runAddFieldsStage(doc, fieldExprs) {
  const snapshot = { ...doc };  // every sibling expr sees THIS SAME snapshot
  const result = { ...doc };
  for (const [key, exprFn] of Object.entries(fieldExprs)) {
    result[key] = exprFn(snapshot);
  }
  return result;
}
function bsonLt(fieldValue, dateValue) {
  if (fieldValue === undefined) return true; // missing == null, null < Date always
  return fieldValue < dateValue;
}

const NOW = new Date('2026-09-03T00:00:00Z');
function addOneYear(d) { return new Date(new Date(d).setFullYear(new Date(d).getFullYear() + 1)); }

for (const [label, doc] of [
  ['expiredOrder', { createdAt: new Date('2020-01-01') }],
  ['freshOrder',   { createdAt: new Date('2026-08-01') }],
]) {
  const buggyResult = runAddFieldsStage(doc, {
    expiresAt: (d) => addOneYear(d.createdAt),
    isExpired: (d) => bsonLt(d.expiresAt, NOW), // d.expiresAt is undefined!
  });
  console.log(label, '(buggy, one stage)  -> isExpired:', buggyResult.isExpired);

  const stage1 = runAddFieldsStage(doc, { expiresAt: (d) => addOneYear(d.createdAt) });
  const stage2 = runAddFieldsStage(stage1, { isExpired: (d) => bsonLt(d.expiresAt, NOW) });
  console.log(label, '(fixed, two stages) -> isExpired:', stage2.isExpired);
}
// -> expiredOrder (buggy, one stage)  -> isExpired: true
// -> expiredOrder (fixed, two stages) -> isExpired: true    (correct either way)
// -> freshOrder   (buggy, one stage)  -> isExpired: true    (WRONG!)
// -> freshOrder   (fixed, two stages) -> isExpired: false   (correct)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The page\'s own "Arithmetic & String" codeTab computes <code>margin: { $round: [{ $divide: [{ $subtract: [\'$revenue\', \'$cost\'] }, \'$revenue\'] }, 4] }</code> in the SAME $addFields stage as <code>profit</code> and <code>discount</code> — but <code>margin</code> never references <code>profit</code> or vice versa. Does THIS codeTab have the same bug? Why or why not?',
  hint: 'The bug only bites when field B\'s expression references field A by name (with $) where A is a NEW field being computed in the same stage — not when two new fields are simply computed independently, side by side.',
  solution: `// No -- the "Arithmetic & String" codeTab does NOT have this bug.
// profit, discount, and margin are each computed directly from the
// ORIGINAL document's own fields (revenue, cost, price) -- none of
// them reference $profit, $discount, or $margin by name. Being
// listed as sibling keys in the same $addFields object is completely
// harmless; the bug only triggers when one expression's OWN field
// path references another field that is ALSO being newly computed
// in that exact same stage. Computing several independent new fields
// side by side in one stage is the normal, correct, and efficient way
// to use $addFields -- it's only a DEPENDENCY between two new fields
// within the same stage that breaks.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since $addFields processes an object of key-value pairs, MongoDB must evaluate them one at a time in order, so a later field can see an earlier one that was just added.',
    reality: 'MongoDB\'s own documentation confirms every expression in one $addFields stage is evaluated against the SAME input-document snapshot — the state of the document BEFORE the stage ran — regardless of the order the keys happen to be written in. Referencing a sibling field being computed in the same stage sees that field as MISSING, not as its about-to-exist value.',
  },
  {
    thought: 'If a field reference inside an expression points at something that doesn\'t exist yet, MongoDB will throw an error or the pipeline will fail, alerting you to the mistake.',
    reality: 'Verified directly against MongoDB\'s own documented BSON comparison order: a missing field is silently treated as null, with no error and no warning. For a $lt comparison against a Date specifically, this is especially dangerous — null sorts before every Date, so the comparison silently and consistently evaluates to true for every document, which can look like a correctly-working feature until the data is checked closely.',
  },
];

@Component({
  selector: 'app-mongo-agg-expr-addfields-selfref',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-single-addfields-stage-cant-see-its-own-new-fields.html',
  styleUrl: './a-single-addfields-stage-cant-see-its-own-new-fields.scss',
})
export class ASingleAddfieldsStageCantSeeItsOwnNewFieldsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
