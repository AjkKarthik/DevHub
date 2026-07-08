import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-small-table-seq-scan-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-small-tables-seq-scan-despite-a-covering-index.html',
  styleUrl: './testing-that-small-tables-seq-scan-despite-a-covering-index.scss',
})
export class TestingThatSmallTablesSeqScanDespiteACoveringIndexSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge Assumes a "Fixed" Index Is Always Used',
      points: [
        'The challenge describes a "10M-row orders table" and its solution ends with an unqualified promise: "Verify: EXPLAIN ANALYZE should now show Index Scan / Index Only Scan / Index Seek ... with no Seq Scan." That promise is scoped to the 10M-row scenario the challenge sets up — it is not a universal guarantee for any table with the same index.',
        'PostgreSQL\'s query planner is cost-based, not rule-based: it does not use an index just because one exists and matches the predicate. It estimates the cost of a Seq Scan (read every row from a small, cheap-to-scan table) against the cost of an Index Scan (traverse the B-tree, then fetch rows) and picks whichever the STATISTICS say is cheaper.',
      ],
    },
    {
      heading: 'Why Small Tables Flip the Decision',
      points: [
        'For a table with only a few hundred rows fitting in one or two disk pages, a Seq Scan reads that page (or two) once. An Index Scan on the same tiny table would need to read the index pages PLUS the heap pages — genuinely MORE total I/O than just scanning the table directly.',
        'This means the exact same covering index, the exact same query shape, and the exact same predicate can produce a Seq Scan on a small table and an Index/Index Only Scan on a large one — the index existing is necessary but not sufficient; table size (and the planner\'s cost estimate) decides which plan actually gets chosen.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The challenge\'s fix, applied to a SMALL table',
      language: 'sql',
      code: `-- Only 200 rows -- everything else identical to the challenge's solution
CREATE TABLE orders_small (
  order_id    serial PRIMARY KEY,
  customer_id int,
  order_date  date,
  status      text,
  amount      numeric
);
INSERT INTO orders_small (customer_id, order_date, status, amount)
SELECT (random()*1000)::int, date '2024-01-01' + (random()*365)::int,
       (ARRAY['Shipped','Pending','Cancelled'])[1 + (random()*2)::int],
       (random()*500)::numeric(10,2)
FROM generate_series(1, 200);

CREATE INDEX ix_orders_small_date_status_cov
ON orders_small (order_date, status)
INCLUDE (order_id, customer_id, amount);

ANALYZE orders_small;

EXPLAIN ANALYZE
SELECT order_id, customer_id, amount
FROM   orders_small
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';

-- -> Seq Scan on orders_small  (cost=0.00..5.50 rows=33 width=20)
--      (actual time=0.008..0.031 rows=68 loops=1)
--    Filter: ((order_date >= '2024-01-01') AND (order_date < '2025-01-01') AND (status = 'Shipped'))
--
-- Seq Scan -- NOT Index Scan / Index Only Scan -- despite the index
-- existing and matching the predicate exactly as the challenge's
-- solution specifies.`,
    },
    {
      label: 'The SAME index, now with enough rows to flip the plan',
      language: 'sql',
      code: `INSERT INTO orders_small (customer_id, order_date, status, amount)
SELECT (random()*100000)::int, date '2024-01-01' + (random()*365)::int,
       (ARRAY['Shipped','Pending','Cancelled'])[1 + (random()*2)::int],
       (random()*500)::numeric(10,2)
FROM generate_series(1, 200000);  -- now ~200,200 rows total

ANALYZE orders_small;

EXPLAIN ANALYZE
SELECT order_id, customer_id, amount
FROM   orders_small
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';

-- -> Index Only Scan using ix_orders_small_date_status_cov on orders_small
--      (cost=0.42..812.30 rows=22400 width=20) (actual time=0.045..3.812 rows=22380 loops=1)
--
-- Same table, same index, same query text -- Index Only Scan now,
-- once there are enough rows for the planner's cost model to prefer
-- it over a Seq Scan.`,
    },
    {
      label: 'Finding the crossover with pg_stats / row estimates',
      language: 'sql',
      code: `-- No fixed row-count threshold exists -- it depends on selectivity,
-- row width, and disk-page cost settings (seq_page_cost /
-- random_page_cost). To see the planner's own reasoning:
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT order_id, customer_id, amount
FROM   orders_small
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';
-- Compare the "cost=" estimates for both plan shapes at different
-- table sizes -- the crossover point is whichever costs less, not a
-- fixed row count.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You create the exact covering index the challenge\'s solution specifies, run EXPLAIN ANALYZE on a staging table with 300 rows, and see "Seq Scan" instead of "Index Scan." Did you make a mistake following the solution?',
    hint: 'Check what the challenge\'s "10M-row orders table" framing implicitly assumes about table size, and what a cost-based planner does differently on a small table.',
    solution: `No -- this is the expected, correct behavior of a cost-based query
planner, not a mistake in applying the solution. The challenge's
verification note ("should now show Index Scan ... with no Seq
Scan") is implicitly scoped to its own stated 10M-row scenario. On
a 300-row staging table, a Seq Scan (reading the table's one or two
disk pages) is genuinely CHEAPER than an Index Scan (which would
read index pages plus heap pages) -- so PostgreSQL correctly
chooses the Seq Scan, and that is the RIGHT answer for a table that
size, not a sign the index or query is broken.

The general lesson: an index's existence does not force its use.
Verify plan expectations at a representative (production-like) data
volume, not on a small staging or test table where the planner's
own cost-based reasoning will legitimately produce a different
plan shape for the identical schema and query.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once a covering index exists that matches a query\'s predicate and projected columns, the planner will always use it — the challenge\'s "should now show Index Scan" verification note is a universal guarantee.',
      reality: 'PostgreSQL\'s planner is cost-based: it compares the estimated cost of using the index against a plain Seq Scan and picks whichever is cheaper. On a small table, Seq Scan is often genuinely cheaper, so the SAME index goes unused.',
    },
    {
      thought: 'seeing "Seq Scan" in EXPLAIN output always means an index is missing or the schema needs fixing.',
      reality: 'on a small enough table, Seq Scan is frequently the correct, optimal choice — table size and row-estimate statistics, not just index existence, determine which plan the cost-based optimizer picks.',
    },
    {
      thought: 'testing an index\'s effectiveness on a small local/staging dataset is a reliable way to confirm it will be used in production.',
      reality: 'the challenge\'s own 10M-row framing hints at this: plan shape can flip entirely between a small test table and a large production one, so verification should happen against production-representative data volumes.',
    },
  ];
}
