import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-group-by-date-trunc-expression-index-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './group-by-date-trunc-still-needs-an-expression-index-not-the-raw-column.html',
  styleUrl: './group-by-date-trunc-still-needs-an-expression-index-not-the-raw-column.scss',
})
export class GroupByDateTruncStillNeedsAnExpressionIndexNotTheRawColumnSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Claim That Contradicts the Page\'s Own Adjacent Warning',
      points: [
        'The main page\'s Q&A on grouping by month states: "Truncate to month before grouping... Both approaches let the optimizer use a range index on the raw order_date column rather than wrapping it in a function." But the very Q&A right before it, on filtering by today\'s date, warns the opposite: "Avoid wrapping the column in a function — it prevents index use; instead, use a range on the raw column."',
        'The GROUP BY query does exactly what the filtering Q&A warns against — it wraps order_date in DATE_TRUNC(\'month\', order_date) (or the MSSQL DATEADD/DATEDIFF equivalent). A plain B-tree index built on the raw order_date column cannot be used to satisfy that grouping efficiently, for the same fundamental reason a wrapped WHERE predicate can\'t use a plain index: the index stores raw order_date values, not DATE_TRUNC\'d ones, so Postgres cannot look up or group by the index\'s own sort order without computing the expression for every row first.',
      ],
    },
    {
      heading: 'What Actually Makes GROUP BY DATE_TRUNC Fast',
      points: [
        'To let an index actually serve this GROUP BY, the index has to be built ON the expression itself — an expression index: CREATE INDEX ON orders (DATE_TRUNC(\'month\', order_date)). Only then does Postgres have a structure that is already sorted by month, letting it use a GroupAggregate over a fast Index Scan instead of a full Seq Scan.',
        'Without that expression index, GROUP BY DATE_TRUNC(\'month\', order_date) on the raw order_date column\'s plain index requires reading every row (typically via Seq Scan or a full Index Scan of the raw index in row order, gaining nothing from the ordering), computing DATE_TRUNC for each one, and then sorting/hashing the results — the plain index is not being leveraged for the grouping operation at all, contrary to what the page\'s Q&A claims.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The plain index the page claims is being used',
      language: 'sql',
      code: `CREATE TABLE orders (id INT, order_date TIMESTAMP, total DECIMAL(10,2));
CREATE INDEX orders_order_date_idx ON orders (order_date);
-- Populated with 1,000,000 rows spanning several years.

EXPLAIN SELECT
    DATE_TRUNC('month', order_date) AS month_start,
    SUM(total) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

--                          QUERY PLAN
-- ---------------------------------------------------------------
--  HashAggregate  (cost=32154.00..32180.50 rows=48 width=40)
--    Group Key: date_trunc('month'::text, order_date)
--    ->  Seq Scan on orders  (cost=0.00..24654.00 rows=1000000 width=16)
--
-- A Seq Scan, not an Index Scan -- orders_order_date_idx is NOT
-- being used to satisfy this GROUP BY at all, despite existing on
-- the exact column the query groups by a function of.`,
    },
    {
      label: 'The expression index that actually earns the claim',
      language: 'sql',
      code: `CREATE INDEX orders_month_idx ON orders (DATE_TRUNC('month', order_date));

EXPLAIN SELECT
    DATE_TRUNC('month', order_date) AS month_start,
    SUM(total) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

--                              QUERY PLAN
-- --------------------------------------------------------------------
--  GroupAggregate  (cost=0.42..18432.10 rows=48 width=40)
--    Group Key: date_trunc('month'::text, order_date)
--    ->  Index Scan using orders_month_idx on orders
--          (cost=0.42..15654.00 rows=1000000 width=16)
--
-- NOW an Index Scan is used, and the plan switches from HashAggregate
-- to the cheaper GroupAggregate, because the index is already sorted
-- by the exact expression being grouped on. This is what "letting the
-- optimizer use an index" actually requires -- an index ON the
-- expression, not the plain index on the raw column the page's Q&A
-- credits.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s Q&A and concludes "we already have an index on order_date, so our monthly revenue GROUP BY is already using it efficiently — no further indexing work needed." Based on the EXPLAIN output above, what would you tell them to check before accepting that conclusion?',
    hint: 'The Q&A\'s claim and the EXPLAIN plan for a plain index on order_date are two different things — one is a sentence, the other is what the query planner actually decided to do.',
    solution: `Run EXPLAIN on the actual query before accepting the claim. As shown
above, a plain index on the raw order_date column produces a Seq Scan
for GROUP BY DATE_TRUNC('month', order_date) -- it is not being used
at all for this query, contrary to what the main page's Q&A states.

The check is simple and definitive: if EXPLAIN shows "Seq Scan on
orders" instead of "Index Scan using ...", the existing index isn't
helping this particular query, regardless of what any documentation
(including this site's own Q&A) claims in prose. The actual fix is to
add an expression index built directly on DATE_TRUNC('month',
order_date) -- only then does EXPLAIN switch to an Index Scan and a
cheaper GroupAggregate plan.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'grouping by DATE_TRUNC(\'month\', order_date) can use an existing plain index on the raw order_date column, since the index does cover that column.',
      reality: 'a plain index on order_date is built in the order of the RAW timestamp values, not their DATE_TRUNC\'d equivalents -- the planner cannot use it to satisfy the grouping, and EXPLAIN will show a Seq Scan despite the index\'s existence.',
    },
    {
      thought: 'wrapping a column in a function is only a performance concern in WHERE clauses (filtering) -- GROUP BY is a separate case where the same rule doesn\'t apply.',
      reality: 'the exact same rule applies to GROUP BY as to WHERE -- wrapping a column in a function prevents a plain index from being used to satisfy that operation directly, whether it\'s a filter predicate or a grouping key.',
    },
    {
      thought: 'the fix for a slow GROUP BY DATE_TRUNC query is to add MORE indexes on the raw column, or to add a covering index that includes order_date.',
      reality: 'the fix is a specific kind of index -- an EXPRESSION index built directly on DATE_TRUNC(\'month\', order_date) -- not additional indexes on the raw, untransformed column, which cannot help regardless of how many of them exist.',
    },
  ];
}
