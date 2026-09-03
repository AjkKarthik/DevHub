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
    heading: 'Correlated Means "Varies Per Input Document"',
    points: [
      'MongoDB\'s own terminology, confirmed against its official documentation, is the OPPOSITE of what the main page\'s theory section originally stated: the pipeline $lookup form that binds outer-document fields with <code>let</code> and references them via <code>$$</code> in the sub-pipeline is called a <strong>correlated</strong> subquery — not "uncorrelated." The main page has been corrected to say this.',
      'A pipeline $lookup sub-pipeline is <strong>uncorrelated</strong> when it never references a let binding at all — it runs the exact same sub-pipeline regardless of which input document triggered it, so every input document gets an identical result. MongoDB\'s query planner can legitimately execute an uncorrelated sub-pipeline once and reuse the cached result across every input document, rather than re-running it per document.',
      'The main page\'s own "Pipeline $lookup" codeTab — the department-budget example using <code>let: { deptId: \'$_id\', budget: \'$budget\' }</code> and <code>$$deptId</code>/<code>$$budget</code> inside the sub-pipeline — is a textbook CORRELATED subquery: each department genuinely gets a different set of "top earners," because the sub-pipeline\'s own filter depends on that specific department\'s own id and budget.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Uncorrelated vs. Correlated, Side by Side',
    language: 'typescript',
    code: `const orders = db.collection('orders');

// UNCORRELATED: the sub-pipeline never references a let binding, so
// every order gets the IDENTICAL top-3-globally-most-expensive result.
const withGlobalTopProducts = await orders.aggregate([
  { \$lookup: {
    from: 'products',
    pipeline: [
      { \$sort: { price: -1 } },
      { \$limit: 3 },
    ],
    as: 'top3GlobalProducts', // same 3 products embedded on EVERY order
  }},
]).toArray();

// CORRELATED: the sub-pipeline uses \$\$category (bound via let), so the
// result genuinely VARIES depending on each order's own category field.
const withTopInSameCategory = await orders.aggregate([
  { \$lookup: {
    from: 'products',
    let: { category: '\$category' },
    pipeline: [
      { \$match: { \$expr: { \$eq: ['\$category', '\$\$category'] } } },
      { \$sort: { price: -1 } },
      { \$limit: 2 },
    ],
    as: 'top2InCategory', // different 2 products per order, by category
  }},
]).toArray();

// Pure-JS equivalent, verified against a 3-order/5-product seed set:
function uncorrelatedTop3(products) {
  return [...products].sort((a, b) => b.price - a.price).slice(0, 3).map(p => p.name);
}
function correlatedTop2InCategory(products, category) {
  return products.filter(p => p.category === category)
    .sort((a, b) => b.price - a.price).slice(0, 2).map(p => p.name);
}

for (const o of orders) console.log(o._id, uncorrelatedTop3(products));
// -> 100 [ 'Gadget Y', 'Gadget X', 'Widget B' ]
// -> 101 [ 'Gadget Y', 'Gadget X', 'Widget B' ]   (IDENTICAL every time)
// -> 102 [ 'Gadget Y', 'Gadget X', 'Widget B' ]

for (const o of orders) console.log(o._id, o.category, '->', correlatedTop2InCategory(products, o.category));
// -> 100 tools -> [ 'Widget B', 'Widget A' ]
// -> 101 electronics -> [ 'Gadget Y', 'Gadget X' ]   (VARIES by category)
// -> 102 tools -> [ 'Widget B', 'Widget A' ]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A pipeline $lookup declares <code>let: { minPrice: \'$minBudget\' }</code> but its sub-pipeline\'s only stage is <code>{ $sort: { rating: -1 } }, { $limit: 5 }</code> — it never actually references <code>$$minPrice</code> anywhere. Is this sub-pipeline correlated or uncorrelated, and does declaring an unused let binding change the answer?',
  hint: 'The definition hinges on whether the sub-pipeline\'s RESULT can differ between two different input documents — not on whether a let binding was merely declared.',
  solution: `// It is UNCORRELATED, despite declaring a let binding. The definition
// is about whether the sub-pipeline's own logic actually REFERENCES a
// let-bound variable somewhere -- a $match, $project, or $expr that
// uses $$minPrice. A DECLARED-but-unused let binding changes nothing
// about the sub-pipeline's behavior: { $sort: { rating: -1 } }, { $limit: 5 }
// produces the exact same top-5-highest-rated result for every single
// input document, regardless of what that document's own minBudget
// field happens to be.
//
// This is a genuinely easy mistake to make when refactoring -- removing
// the one $match stage that used $$minPrice (perhaps while debugging)
// silently turns a correlated sub-pipeline into an uncorrelated one,
// with no error and no warning, just a query that now returns the
// same embedded array on every document instead of a per-document one.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A pipeline $lookup using the let/pipeline syntax is always called "correlated," and the basic localField/foreignField shorthand is always "uncorrelated" — the two forms map one-to-one onto the two terms.',
    reality: 'The terms describe whether the sub-pipeline\'s RESULT depends on the input document, not which $lookup SYNTAX was used. A pipeline-form $lookup that declares a let binding but never references it with $$ anywhere in its sub-pipeline is still uncorrelated — verified directly that a sub-pipeline consisting only of a global $sort + $limit returns the IDENTICAL embedded array for every input document, even with an unused let binding sitting right there in the syntax.',
  },
  {
    thought: 'An "uncorrelated" $lookup sub-pipeline is somehow broken or pointless — if it doesn\'t vary per document, why run it inside a per-document $lookup at all instead of just embedding a static value?',
    reality: 'An uncorrelated pipeline $lookup is a legitimate, useful pattern — attaching the same computed reference data (e.g., a global "top 3 trending products" list) to every document in a result set without a separate query, letting MongoDB potentially execute the sub-pipeline once and reuse it, rather than something to avoid. It is a documented performance characteristic MongoDB actively optimizes for, not a mistake.',
  },
];

@Component({
  selector: 'app-mongo-lookup-correlated',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './correlated-vs-uncorrelated-lookup-subqueries.html',
  styleUrl: './correlated-vs-uncorrelated-lookup-subqueries.scss',
})
export class CorrelatedVsUncorrelatedLookupSubqueriesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
