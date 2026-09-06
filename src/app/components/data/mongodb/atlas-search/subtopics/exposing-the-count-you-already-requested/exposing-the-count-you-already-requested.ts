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
    heading: 'Requested, But Never Read',
    points: [
      'The main page\'s own "Compound Search with Filters" codeTab passes <code>count: { type: \'total\' }</code> inside the <code>$search</code> stage — but the pipeline ends at <code>$limit: 20</code> and <code>.toArray()</code>, with no stage anywhere that captures or reads the count it just requested.',
      'The theory section states plainly that this option "avoids a second round-trip" for getting the total result count — but without a <code>$project</code> stage explicitly capturing <code>$$SEARCH_META</code> (per the sibling subtopic\'s own fix), the requested count is computed by the server and then simply discarded, never reaching the application at all.',
      'This is a gap distinct from the Challenge\'s own fabricated-field bug: nothing here is factually WRONG, the codeTab just never finishes the one thing it started — reusing the exact same compound query already on the page to close that gap.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Completing the Compound Search\'s Own Count Request',
    language: 'typescript',
    code: `// The main page's own compound search + filters query, extended with
// the one $project addition that actually retrieves the count it
// already requests via count: { type: 'total' }.
const results = await db.collection('products').aggregate([
  {
    \$search: {
      index: 'default',
      compound: {
        must: [{
          text: {
            query: req.query.q as string,
            path: ['name', 'description', 'tags'],
          }
        }],
        filter: [{
          text: { query: req.query.category as string, path: 'category' }
        }, {
          range: {
            path: 'price',
            gte: Number(req.query.minPrice ?? 0),
            lte: Number(req.query.maxPrice ?? 10000),
          }
        }],
      },
      count: { type: 'total' },  // requested here...
    }
  },
  {
    \$project: {
      name: 1, price: 1, category: 1,
      score: { \$meta: 'searchScore' },
      meta: '\$\$SEARCH_META',  // ...and actually captured here.
    }
  },
  { \$limit: 20 },
]).toArray();

const totalMatches = results[0]?.meta?.count?.total ?? 0;
console.log(\`Showing \${results.length} of \${totalMatches} total matches\`);

// Pure-JS model confirming the count survives pagination correctly --
// the SAME total appears whether you're looking at page 1 or page 5,
// since it describes the whole result set, not the current page.
function simulatePage(allMatches: number, pageResults: string[]) {
  return pageResults.map(name => ({ name, meta: { count: { total: allMatches } } }));
}
const page1 = simulatePage(340, ['A', 'B']);
const page5 = simulatePage(340, ['Y', 'Z']);
console.log('Page 1 total:', page1[0].meta.count.total, '| Page 5 total:', page5[0].meta.count.total);
// -> both report 340 -- the total describes the query, not the page.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The theory section claims requesting the count this way "avoids a second round-trip." Explain, in terms of the fixed pipeline above, what the ALTERNATIVE (two-round-trip) approach would have looked like, and why the single pipeline above avoids it.',
  hint: 'Think about how you would get a total count WITHOUT the count option and $$SEARCH_META at all — what would a second, separate query need to do?',
  solution: `// The alternative would be running a SECOND, separate aggregation
// (or a countDocuments()-style call) using the SAME compound search
// criteria, purely to count how many documents match, in addition to
// the first query that actually fetches the paginated result page --
// two network round trips to the database for one logical "get page
// + total" operation.
//
// The count: { type: 'total' } option (with $$SEARCH_META captured in
// the SAME pipeline) computes the total as a side effect of the exact
// same query that already fetches the page of results -- one round
// trip does both jobs, which is precisely the savings the theory
// section's claim refers to.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the codeTab already passes count: { type: \'total\' } and the theory section describes what it does, the codeTab is functionally complete — the missing $project is just a stylistic omission, not something that changes behavior.',
    reality: 'Without capturing $$SEARCH_META in a $project stage, the count is computed by the Atlas Search service and then never returned to the application at all — the application receives the SAME documents either way, but has no way to know the total match count. This is a functional gap, not a stylistic one.',
  },
  {
    thought: 'type: \'total\' and type: \'lowerBound\' (the other option the theory section names) both return the exact same information, just under different field names.',
    reality: 'They represent genuinely different guarantees: "total" computes an exact count (more expensive on very large result sets), while "lowerBound" returns a fast, approximate floor that may undercount on large result sets. Choosing between them is a real trade-off between exactness and query cost, not an arbitrary naming choice.',
  },
];

@Component({
  selector: 'app-mongo-as-exposing-count',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './exposing-the-count-you-already-requested.html',
  styleUrl: './exposing-the-count-you-already-requested.scss',
})
export class ExposingTheCountYouAlreadyRequestedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
