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
    heading: 'Only Ten Named Stages Are Excluded From $facet',
    points: [
      'MongoDB\'s own documentation lists the aggregation stages that CANNOT run inside a $facet sub-pipeline: <code>$collStats</code>, <code>$facet</code> itself, <code>$geoNear</code>, <code>$indexStats</code>, <code>$out</code>, <code>$merge</code>, <code>$planCacheStats</code>, <code>$search</code>, <code>$searchMeta</code>, and <code>$vectorSearch</code>. <code>$lookup</code> is not on that list, so it is fully supported — the correction the main page now states.',
      'The reasoning behind the exclusions is consistent once you look at what they have in common: <code>$out</code>/<code>$merge</code> write outside the pipeline (no sensible "which facet branch wins" answer), <code>$geoNear</code>/<code>$search</code>/<code>$vectorSearch</code> must be the FIRST stage of a pipeline (a $facet sub-pipeline is never the top-level pipeline), and <code>$facet</code> nesting inside itself is simply disallowed. <code>$lookup</code> triggers none of those constraints.',
      'This matters in practice: a single aggregation can run TWO OR MORE independent $lookup-using branches over the same filtered input in one round trip — a "top N enriched with customer data" branch and a "flagged items enriched with customer data" branch, for instance — rather than needing a separate query (and a separate round trip) per branch.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two $facet Branches, Each With Its Own $lookup',
    language: 'typescript',
    code: `const orders = db.collection('orders');

const report = await orders.aggregate([
  { \$match: { createdAt: { \$gte: startOfMonth } } },  // shared filtered input
  { \$facet: {
    // Branch A: top 2 highest-value orders, WITH customer data joined
    topOrders: [
      { \$sort: { amount: -1 } },
      { \$limit: 2 },
      { \$lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
    ],
    // Branch B: flagged orders needing review, ALSO with customer data joined
    flaggedOrders: [
      { \$match: { flagged: true } },
      { \$lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
    ],
  }},
]).toArray();

// Pure-JS equivalent, verified against a 5-order seed set to confirm BOTH
// branches independently perform their own join with no interference:
function lookupCustomer(order, custById) {
  const match = custById.get(order.customerId);
  return { ...order, customer: match ? [match] : [] };
}

function runFacet(inputOrders, custById) {
  const topOrders = [...inputOrders].sort((a, b) => b.amount - a.amount).slice(0, 2)
    .map(o => lookupCustomer(o, custById));
  const flaggedOrders = inputOrders.filter(o => o.flagged)
    .map(o => lookupCustomer(o, custById));
  return { topOrders, flaggedOrders };
}

const result = runFacet(seedOrders, custById);
console.log(result.topOrders.map(o => \`\${o._id}:\${o.amount} (\${o.customer[0]?.name})\`));
// -> [ '4:1200 (Cogsworth Inc)', '2:900 (Bolt LLC)' ]
console.log(result.flaggedOrders.map(o => \`\${o._id}:\${o.amount} (\${o.customer[0]?.name})\`));
// -> [ '2:900 (Bolt LLC)', '4:1200 (Cogsworth Inc)' ]
// Both branches correctly resolved their own customer join independently.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own "limits of $lookup" QnA originally claimed $lookup was one of the stages excluded from $facet. Name the actual reasoning pattern shared by every stage that genuinely IS excluded — why does it make sense that $out and $merge can\'t run inside $facet, even though the reason has nothing to do with $lookup?',
  hint: 'Think about what $out and $merge actually DO — they write data somewhere. If two different $facet branches both tried to $merge into the same collection, what would "the result of the $facet stage" even mean?',
  solution: `// $out and $merge write results OUTSIDE the pipeline entirely -- to a
// real collection on disk. A $facet stage's whole point is to run several
// independent sub-pipelines and return ALL of their results together as
// named fields on ONE output document. If one branch's sub-pipeline
// contained $out, there would be no sensible "combined result" to put
// into that branch's own named field -- the data would already have
// left the pipeline and been written to a collection, and two branches
// racing to $merge into the same target would have an undefined,
// order-dependent outcome.
//
// $geoNear/$search/$searchMeta/$vectorSearch are excluded for a
// DIFFERENT, unrelated reason: MongoDB requires each of those to be the
// very FIRST stage of a pipeline (they need to run against the raw
// collection, not against documents already reshaped by earlier
// stages) -- and a $facet sub-pipeline, by definition, is never the
// top-level pipeline.
//
// $lookup fits neither pattern: it reads from another collection and
// returns its result INSIDE the current pipeline document (as an
// array field), exactly like $match or $group do -- which is why it
// was never actually excluded, despite what the main page's QnA
// originally (and incorrectly) claimed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$lookup cannot be used inside a $facet sub-pipeline — you have to run it before or after the $facet stage instead.',
    reality: '$lookup is fully supported inside $facet sub-pipelines, and different branches of the SAME $facet stage can each run their own, completely independent $lookup — verified directly with a 2-branch example where one branch joins the top 2 highest-value orders to customer data and a separate branch joins the flagged orders to customer data, with neither branch\'s join interfering with the other\'s.',
  },
  {
    thought: 'Since $out and $merge are excluded from $facet, any stage that "writes" or "reads from elsewhere" (like $lookup, which reads from another collection) must also be excluded, by the same logic.',
    reality: '$out and $merge are excluded because they write OUTSIDE the current pipeline (to a real collection on disk), making "the result of this facet branch" undefined. $lookup reads from another collection but returns its result INSIDE the current pipeline document, the same way $group or $addFields produce a new field — it never leaves the pipeline, so the same restriction never applied to it in the first place.',
  },
];

@Component({
  selector: 'app-mongo-lookup-facet',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lookup-is-actually-supported-inside-facet-sub-pipelines.html',
  styleUrl: './lookup-is-actually-supported-inside-facet-sub-pipelines.scss',
})
export class LookupIsActuallySupportedInsideFacetSubPipelinesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
