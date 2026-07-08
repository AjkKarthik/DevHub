import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-index-scan-not-desired-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-index-scan-is-not-the-desired-mssql-outcome.html',
  styleUrl: './demonstrating-that-index-scan-is-not-the-desired-mssql-outcome.scss',
})
export class DemonstratingThatIndexScanIsNotTheDesiredMssqlOutcomeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Contradiction, Read Side by Side',
      points: [
        'The main page\'s own "Key plan operators to recognise" theory section states plainly: "Index Scan: traverses all index pages. Better than a table scan but still O(n) — may indicate a missing WHERE predicate or poor index selectivity." That is an explicit warning sign, not a goal.',
        'Yet the challenge\'s solution ends with: "Verify: EXPLAIN ANALYZE should now show Index Scan / Index Only Scan with no Seq Scan and high buffer hit count." — listing "Index Scan" as the successful, desired verification outcome for MSSQL, directly contradicting the theory section\'s own O(n) warning just a few sections above it.',
      ],
    },
    {
      heading: 'Why the Confusion: Two Dialects, One Overloaded Name',
      points: [
        'PostgreSQL genuinely uses "Index Scan" as the name for its efficient, selective operator (the one that navigates the index and fetches matching heap rows) — for PostgreSQL, "Index Scan" (or "Index Only Scan" when no heap fetch is needed) really is the good outcome.',
        'MSSQL uses different terminology for the same efficient operation: "Index Seek." In MSSQL, "Index Scan" specifically means the LESS efficient full-index traversal that the theory section warns about — the good outcome for MSSQL is "Index Seek," never "Index Scan."',
        'The challenge\'s verification note applies PostgreSQL\'s terminology ("Index Scan / Index Only Scan") as if it were universal, but for a reader running the MSSQL half of the solution and dutifully checking for "Index Scan" in the plan, that is checking for the WRONG operator name — and if they do see "Index Scan" in MSSQL, per the page\'s own theory, that is a sign something is still not fully fixed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Running the challenge\'s own solution in MSSQL',
      language: 'sql',
      code: `CREATE INDEX ix_orders_date_status_cov
ON orders (order_date, status)
INCLUDE (order_id, customer_id, amount);

SELECT order_id, customer_id, amount
FROM   orders
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';

-- Actual execution plan (SSMS):
--   Index Seek (ix_orders_date_status_cov)
--     Seek Predicate: order_date >= '2024-01-01' AND order_date < '2025-01-01'
--     Predicate: status = 'Shipped'
--
-- The correct, successful operator name is "Index Seek" -- it never
-- says "Index Scan" anywhere in a correctly-tuned MSSQL plan for
-- this query. If "Index Scan" DOES appear, that means the engine is
-- traversing the whole index -- exactly the O(n) problem the
-- theory section describes, not a success.`,
    },
    {
      label: 'The same solution in PostgreSQL — here "Index Scan" IS correct',
      language: 'sql',
      code: `CREATE INDEX ix_orders_date_status_cov
ON orders (order_date, status)
INCLUDE (order_id, customer_id, amount);

EXPLAIN ANALYZE
SELECT order_id, customer_id, amount
FROM   orders
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';

-- -> Index Only Scan using ix_orders_date_status_cov on orders
--      (cost=0.43..45.2 rows=310 width=20) (actual time=0.031..0.412 rows=298 loops=1)
--    Index Cond: ((order_date >= '2024-01-01') AND (order_date < '2025-01-01'))
--    Filter: (status = 'Shipped')
--    Buffers: shared hit=42
--
-- For PostgreSQL, "Index Only Scan" genuinely IS the desired,
-- efficient outcome the challenge's verification note describes --
-- the note is correct for this half of the dual-dialect answer.`,
    },
    {
      label: 'Deliberately forcing a bad MSSQL plan to see the difference',
      language: 'sql',
      code: `-- Dropping the covering index to reproduce the WARNED-about case
DROP INDEX ix_orders_date_status_cov ON orders;
CREATE INDEX ix_orders_status_only ON orders (status);  -- too narrow

SELECT order_id, customer_id, amount
FROM   orders
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';

-- Plan now shows: Index Scan (ix_orders_status_only)
-- with a Predicate filter applied AFTER scanning every row of the
-- index -- exactly the O(n) "Index Scan" the theory section warns
-- about, and exactly the operator name the challenge's verification
-- note lists as a SUCCESS. Same name, opposite meaning.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A reader follows the challenge\'s MSSQL solution, runs EXPLAIN, and sees "Index Seek" in the plan (not "Index Scan"). Per the challenge\'s own verification note ("should now show Index Scan"), did they fail the exercise?',
    hint: 'Re-read the main page\'s own "Key plan operators to recognise" theory section for what "Index Scan" specifically means in MSSQL, and compare it to what "Index Seek" means.',
    solution: `No -- seeing "Index Seek" means they succeeded. The challenge's
verification note ("should now show Index Scan / Index Only Scan")
uses PostgreSQL's terminology, where "Index Scan" genuinely is the
efficient outcome. But the SAME page's own theory section defines
MSSQL's "Index Scan" as the LESS efficient, O(n) full-index
traversal -- MSSQL's efficient outcome is called "Index Seek," a
completely different operator name.

A reader checking their MSSQL plan against the literal words
"Index Scan" is checking for the wrong thing -- if they actually
see "Index Scan" in MSSQL, that is the O(n) case the theory section
warns about, not a success. "Index Seek" is the correct MSSQL
success signal, and the verification note should have said so
explicitly instead of reusing PostgreSQL's operator name for both
dialects.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Index Scan" means the same thing — an efficient, targeted read — in both MSSQL and PostgreSQL execution plans.',
      reality: 'the two engines use the name for opposite outcomes. PostgreSQL\'s "Index Scan"/"Index Only Scan" is the efficient, desired operator. MSSQL\'s "Index Scan" is the inefficient, O(n) full-index traversal — MSSQL\'s efficient equivalent is called "Index Seek," a different name entirely.',
    },
    {
      thought: 'the challenge\'s verification note, "should now show Index Scan / Index Only Scan," is a reliable universal check for a well-tuned plan in either dialect.',
      reality: 'it is only reliable for the PostgreSQL half of the solution. Checking an MSSQL plan for "Index Scan" is checking for the wrong operator name — a correctly-tuned MSSQL plan should show "Index Seek" instead.',
    },
    {
      thought: 'if two claims on the same reference page seem to conflict, the later one (closer to the "answer") is probably the one to trust.',
      reality: 'here it is the earlier theory section that is correct and precise for MSSQL, and the later challenge note that carries over PostgreSQL terminology without adjusting it for the MSSQL half of the same answer.',
    },
  ];
}
