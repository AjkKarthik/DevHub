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
    heading: 'Named in QuickRef, Explained in a Quiz, Never Shown in Code',
    points: [
      '<code>$lookup</code> is one of the main page\'s own QuickRef entries ("Join with another collection"), and one of its quiz questions gives the full pipeline-form syntax in the EXPLANATION text — but none of the page\'s three codeTabs (Match & Group, $project & $addFields, $unwind) ever demonstrate a single <code>$lookup</code> call, in either form.',
      'The simple (equality) form joins on exactly ONE field: <code>{ $lookup: { from, localField, foreignField, as } }</code>. It is always a LEFT OUTER JOIN — every local document appears in the output exactly once, with its matches collected into the <code>as</code> array, which is an EMPTY array (not a missing field, and not a dropped document) when nothing matches.',
      'The pipeline (extended) form replaces <code>localField</code>/<code>foreignField</code> with a <code>let</code> clause (binding local document fields to <code>$$</code>-prefixed variables) and a <code>pipeline</code> array — allowing arbitrary conditions (ranges, expressions, <code>$sort</code>, <code>$limit</code>) instead of a bare equality match.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Simple Join, Then the Pipeline Form',
    language: 'typescript',
    code: `const users = db.collection('users');

// Simple equality $lookup -- one field, exact match
const withOrders = await users.aggregate([
  { \$lookup: {
    from: 'orders',
    localField: 'userId',
    foreignField: 'userId',
    as: 'orders',
  }},
]).toArray();
// Every user appears once. orders is [] for a user with no matching
// orders -- NOT a missing field, and the user is NOT dropped.

// Pipeline $lookup -- only orders over \$100, sorted, limited
const withHighValueOrders = await users.aggregate([
  { \$lookup: {
    from: 'orders',
    let: { uid: '\$userId' },
    pipeline: [
      { \$match: { \$expr: {
        \$and: [
          { \$eq: ['\$userId', '\$\$uid'] },
          { \$gt: ['\$total', 100] },
        ],
      }}},
      { \$sort: { total: -1 } },
      { \$limit: 5 },
    ],
    as: 'highValueOrders',
  }},
]).toArray();
// Alice (with a \$150 order) gets one entry in highValueOrders.
// Bob (only a \$30 order) gets an EMPTY highValueOrders array --
// still present in the results, just with nothing matching.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Two users exist: Alice (with orders totaling $50 and $150) and Bob (with one order totaling $30). Using the pipeline $lookup shown above (only orders over $100), what does Bob\'s document look like in the result — is Bob missing from the output, or present with something specific in <code>highValueOrders</code>?',
  hint: 'Trace what the pipeline sub-query actually returns when zero foreign documents match the filter for a given local document -- does $lookup ever drop the local document itself?',
  solution: `// Bob IS present in the results -- $lookup NEVER drops a local
// document, regardless of how many (or how few) foreign documents
// match. Bob's own highValueOrders field is present and set to an
// EMPTY ARRAY ([]), since his one $30 order doesn't satisfy the
// > 100 condition.
//
// Verified directly: { userId: 2, name: 'Bob', highValueOrders: [] }
// -- this is exactly how a LEFT OUTER JOIN behaves: every row from
// the "left" (local) side survives the join, with a possibly-empty
// set of matches from the "right" (foreign) side. A query
// downstream that assumes "if highValueOrders exists, it has at
// least one entry" would be a real, easy-to-make mistake -- the
// field always exists after $lookup; only its length varies.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$lookup only supports the simple equality form (localField/foreignField) — anything more complex requires unwinding and re-joining in application code.',
    reality: 'The pipeline form directly supports arbitrary conditions inside $lookup itself — range comparisons, multiple AND/OR conditions via $expr, even $sort and $limit on the matched documents — all inside the SAME $lookup stage, with no need to leave the aggregation pipeline or handle the join logic in application code at all.',
  },
  {
    thought: 'A user with zero matching orders is simply omitted from the $lookup result, the same way an INNER JOIN would exclude it.',
    reality: '$lookup is always a LEFT OUTER JOIN, never an inner join — every local document survives regardless of match count, verified directly above with Bob\'s empty (not missing, not absent-document) highValueOrders array. Simulating an INNER JOIN instead requires an explicit follow-up stage, typically $match: { "as-field.0": { $exists: true } } to drop documents whose joined array came back empty.',
  },
];

@Component({
  selector: 'app-mongo-agg-lookup',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-lookup-example-simple-and-pipeline-form.html',
  styleUrl: './a-real-lookup-example-simple-and-pipeline-form.scss',
})
export class ARealLookupExampleSimpleAndPipelineFormSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
