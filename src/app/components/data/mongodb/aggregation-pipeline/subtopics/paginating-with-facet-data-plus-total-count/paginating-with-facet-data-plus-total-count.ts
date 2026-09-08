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
    heading: 'Both Sub-Pipelines See the Same Filtered Input',
    points: [
      'The main page\'s own QnA on pagination names the exact pattern for getting a page of results and a total count in one call: <code>{ $facet: { data: [$skip, $limit], totalCount: [{ $count: "count" }] } }</code> — no codeTab anywhere builds it.',
      'Both sub-pipelines inside the <code>$facet</code> run against the IDENTICAL filtered input (whatever survives any <code>$match</code> stage placed BEFORE the <code>$facet</code>). This is why <code>totalCount</code> correctly reflects every matching document, not just the ones that happen to land on the current page — <code>$skip</code>/<code>$limit</code> only affects the <code>data</code> branch.',
      'The result is a SINGLE document with two fields, <code>data</code> (an array of the page\'s documents) and <code>totalCount</code> (an array holding one object, since <code>$count</code> always outputs a single document) — not two separate result sets, which is why client code has to unwrap <code>totalCount[0]?.count</code> rather than reading it as a plain number.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '$facet: Page of Results Plus Total Count',
    language: 'typescript',
    code: `const products = db.collection('products');

async function getProductsPage(category: string, page: number, pageSize: number) {
  const result = await products.aggregate([
    { \$match: { category } },              // filter BEFORE $facet -- both branches share this
    { \$facet: {
      data: [
        { \$skip: (page - 1) * pageSize },
        { \$limit: pageSize },
      ],
      totalCount: [
        { \$count: 'count' },
      ],
    }},
  ]).toArray();

  return {
    items: result[0].data,
    total: result[0].totalCount[0]?.count ?? 0, // 0 if the category had zero matches at all
  };
}

// Pure-JS equivalent, verified against a 23-item seed set (every 3rd
// item matching the category filter) to confirm both branches behave
// exactly as claimed:
function facetPagination<T>(docs: T[], filterFn: (d: T) => boolean, skip: number, limit: number) {
  const filtered = docs.filter(filterFn);
  return {
    data: filtered.slice(skip, skip + limit),
    totalCount: [{ count: filtered.length }],
  };
}

const seedProducts = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  category: i % 3 === 0 ? 'electronics' : 'other',
}));

const page2 = facetPagination(seedProducts, p => p.category === 'electronics', 3, 3);
console.log(page2.data.map(p => p.id));       // -> [10, 13, 16]  (page 2, 3 per page)
console.log(page2.totalCount);                 // -> [{ count: 8 }]  -- ALL matching, not just this page`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A category filter matches ZERO products at all. What does <code>result[0].totalCount[0]?.count</code> evaluate to, and why does the code use <code>?? 0</code> instead of trusting <code>totalCount[0].count</code> directly?',
  hint: 'Think about what the $count stage produces when its own input (from a $match matching nothing) is already empty -- does it still emit a document with count: 0, or does it emit nothing at all?',
  solution: `// result[0].totalCount[0]?.count evaluates to undefined, because
// $count NEVER emits a document at all when its input is empty --
// it only outputs a document when there is at least one input
// document to count. So totalCount ends up as an empty array [],
// making totalCount[0] undefined, and the optional chaining (?.)
// on undefined also evaluates to undefined.
//
// This is exactly why ?? 0 is necessary, not defensive over-caution:
// without it, a category with zero matches would return total:
// undefined instead of the correct total: 0, a real bug a caller
// checking "if (total > 0)" would handle inconsistently depending on
// whether undefined happens to coerce the way 0 would in that
// specific comparison.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since both sub-pipelines run inside one $facet call, the totalCount branch only counts the documents that also appear in the data branch (i.e., just this one page).',
    reality: 'The two branches are completely INDEPENDENT sub-pipelines, each starting fresh from the same input the $facet stage received (everything that survived the pre-$facet $match) — the data branch\'s own $skip/$limit has zero effect on what the totalCount branch sees or counts. Verified directly: with 8 total matching documents and a page size of 3, totalCount correctly reports { count: 8 }, not { count: 3 }.',
  },
  {
    thought: 'totalCount is a plain number in the result, so it can be read directly as result[0].totalCount.',
    reality: 'Every $facet sub-pipeline output is always an ARRAY, even when (like $count) it can only ever contain zero or one document. totalCount is genuinely [{ count: N }] — an array holding one object — not a bare number, which is exactly why the correct access pattern is result[0].totalCount[0]?.count, unwrapping two levels (the array, then the field on its first element) rather than one.',
  },
];

@Component({
  selector: 'app-mongo-agg-facet-pagination',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './paginating-with-facet-data-plus-total-count.html',
  styleUrl: './paginating-with-facet-data-plus-total-count.scss',
})
export class PaginatingWithFacetDataPlusTotalCountSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
