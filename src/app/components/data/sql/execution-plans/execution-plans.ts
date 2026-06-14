import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-execution-plans',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './execution-plans.html',
  styleUrls: ['./execution-plans.scss']
})
export class SqlExecutionPlans {

  quickRef: QuickRefItem[] = [
    { name: 'SET SHOWPLAN_ALL ON',      type: 'keyword',  desc: 'MSSQL: show estimated plan without executing' },
    { name: 'SET STATISTICS IO ON',     type: 'keyword',  desc: 'MSSQL: show logical/physical reads per table' },
    { name: 'SET STATISTICS TIME ON',   type: 'keyword',  desc: 'MSSQL: show CPU and elapsed time' },
    { name: 'EXPLAIN (PG)',             type: 'keyword',  desc: 'PostgreSQL: show estimated plan' },
    { name: 'EXPLAIN ANALYZE (PG)',     type: 'keyword',  desc: 'PostgreSQL: execute and show actual vs estimated rows' },
    { name: 'Table Scan / Seq Scan',    type: 'keyword',  desc: 'Read every row — worst case, usually means missing index' },
    { name: 'Index Seek',               type: 'keyword',  desc: 'Navigate B-tree directly to matching rows — best case' },
    { name: 'Key Lookup / RID Lookup',  type: 'keyword',  desc: 'MSSQL: extra read to retrieve non-index columns — may need covering index' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is an execution plan?',
      points: [
        'An execution plan is the sequence of physical operations the database engine chooses to satisfy a query — joins, sorts, seeks, scans.',
        'The query optimizer estimates the cheapest plan based on table statistics (row counts, value distributions). Stale stats → bad plans.',
        'Two plan types: estimated (built without running the query) and actual (collected during execution — includes real row counts).',
      ]
    },
    {
      heading: 'Key plan operators to recognise',
      points: [
        'Table Scan / Seq Scan: reads every row. Usually a problem on large tables — consider adding or covering an index.',
        'Index Seek: navigates the B-tree to a specific range. Fast, selective. Preferred for filtered queries.',
        'Index Scan: traverses all index pages. Better than a table scan but still O(n) — may indicate a missing WHERE predicate or poor index selectivity.',
        'Hash Join: builds a hash table from the smaller input, then probes for matches. Good for large unsorted sets but memory-intensive.',
        'Nested Loop Join: for each row in the outer input, looks up matching rows in the inner — fast when inner is small or seekable by index.',
        'Merge Join: both inputs sorted on join key — efficient for large sorted sets.',
      ]
    },
    {
      heading: 'Reading MSSQL plans',
      points: [
        'Right-to-left, top-to-bottom: data flows from the rightmost operator upward.',
        'Thick arrows = many rows; look for unexpectedly thick arrows between operators.',
        'Warning triangles: missing index suggestion, implicit conversion, statistics out of date.',
        'Key Lookup after an Index Seek means the index does not cover all SELECT columns — add them to the INCLUDE list.',
      ]
    },
    {
      heading: 'Reading PostgreSQL EXPLAIN ANALYZE',
      points: [
        'Rows=N (estimated) vs actual rows=N (actual) — large discrepancies mean statistics need updating (ANALYZE).',
        'cost=0.00..N.NN: startup cost (before first row) and total cost.',
        'Loops=N: the operation was executed N times — multiply cost by loops.',
        'Buffers: hit=N miss=N — cache hits vs disk reads; high miss count may indicate memory pressure.',
      ]
    },
    {
      heading: 'Common fixes',
      points: [
        'Missing index: add a covering index on filter + sort columns with INCLUDE for projected columns.',
        'Implicit conversion: function on a column in WHERE disables seek — move the function to the parameter side.',
        'Parameter sniffing (MSSQL): plan compiled for one parameter value is reused for very different values — use OPTION(RECOMPILE) or OPTIMIZE FOR.',
        'Stale statistics: UPDATE STATISTICS table / ANALYZE table — run after large data changes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL plan tools',
      language: 'sql',
      code: `-- Estimated plan (does not execute)
SET SHOWPLAN_ALL ON;
SELECT o.order_id, c.name, o.amount
FROM   orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE  o.status = 'Pending' AND o.order_date >= '2024-01-01';
SET SHOWPLAN_ALL OFF;

-- Actual I/O and time stats
SET STATISTICS IO  ON;
SET STATISTICS TIME ON;

SELECT order_id, amount
FROM   orders
WHERE  status = 'Shipped'
  AND  order_date >= '2024-01-01';

SET STATISTICS IO  OFF;
SET STATISTICS TIME OFF;
-- Output: Table 'orders'. Scan count 1, logical reads 847, ...
-- SQL Server Execution Times: CPU time = 32 ms, elapsed time = 45 ms

-- Force a specific index (rarely needed; prefer fixing stats)
SELECT * FROM orders WITH (INDEX = ix_orders_date_status)
WHERE order_date >= '2024-01-01';`
    },
    {
      label: 'PostgreSQL EXPLAIN ANALYZE',
      language: 'sql',
      code: `-- Estimated plan
EXPLAIN
SELECT o.order_id, c.name, o.amount
FROM   orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE  o.status = 'Pending' AND o.order_date >= '2024-01-01';

-- Actual plan with timing and buffer stats
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.order_id, c.name, o.amount
FROM   orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE  o.status = 'Pending' AND o.order_date >= '2024-01-01';

-- Example output fragment:
-- -> Index Scan using ix_orders_status_date on orders  (cost=0.43..120.5 rows=85 width=24)
--      (actual time=0.052..1.234 rows=72 loops=1)
--    Index Cond: ((status = 'Pending') AND (order_date >= '2024-01-01'))
--    Buffers: shared hit=94

-- Force seq scan for testing (session-level)
SET enable_indexscan = off;
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'Shipped';
SET enable_indexscan = on;`
    },
    {
      label: 'Fixing a Key Lookup (MSSQL)',
      language: 'sql',
      code: `-- Problem: index on (status) but SELECT also needs order_date and amount
-- Plan shows: Index Seek → Key Lookup (expensive extra read per row)

-- BEFORE: non-covering index
CREATE INDEX ix_orders_status ON orders (status);

-- Execution plan:
-- Index Seek (ix_orders_status)
--   → Key Lookup (clustered index) to get order_date, amount   ← expensive

-- AFTER: covering index includes projected columns
DROP INDEX ix_orders_status ON orders;
CREATE INDEX ix_orders_status_cov
ON orders (status, order_date)
INCLUDE (order_id, amount, customer_id);

-- Now: single Index Seek, no Key Lookup
SELECT order_id, customer_id, order_date, amount
FROM   orders
WHERE  status = 'Shipped'
  AND  order_date >= '2024-01-01';`
    },
    {
      label: 'Fixing implicit conversion',
      language: 'sql',
      code: `-- Problem: column is INT but parameter is passed as VARCHAR
-- MSSQL implicitly converts every row — disables index seek

-- BAD: CONVERT on the column side → table scan
SELECT * FROM orders WHERE CONVERT(VARCHAR, customer_id) = '12345';

-- BAD: paramter type mismatch — MSSQL converts the column
DECLARE @id VARCHAR(10) = '12345';
SELECT * FROM orders WHERE customer_id = @id;  -- scan, not seek!

-- GOOD: cast the parameter, not the column
DECLARE @id INT = 12345;
SELECT * FROM orders WHERE customer_id = @id;  -- index seek

-- PostgreSQL equivalent: avoid functions on indexed columns
-- BAD (disables index):
SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024;

-- GOOD (range condition — index seek):
SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';`
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose and fix a slow query',
    language: 'sql',
    description: 'The following query is slow on a 10M-row orders table. Run EXPLAIN ANALYZE (PG) or SET STATISTICS IO ON (MSSQL) and identify the problem: SELECT order_id, customer_id, amount FROM orders WHERE YEAR(order_date) = 2024 AND status = \'Shipped\'. Then rewrite it to use a range predicate and suggest a covering index that eliminates any Key Lookup / extra reads.',
    hints: [
      'YEAR(order_date) = 2024 prevents an index seek — rewrite as a range: order_date >= \'2024-01-01\' AND order_date < \'2025-01-01\'.',
      'The covering index should include the filter columns (order_date, status) and the projected columns (order_id, customer_id, amount).',
      'In PostgreSQL, EXPLAIN (ANALYZE, BUFFERS) shows whether the index is being used and how many buffer hits vs disk reads occur.',
    ],
    starterCode: `-- Original slow query (avoid this pattern):
SELECT order_id, customer_id, amount
FROM   orders
WHERE  YEAR(order_date) = 2024
  AND  status = 'Shipped';

-- Step 1: diagnose
-- MSSQL: SET STATISTICS IO ON; <query>; SET STATISTICS IO OFF;
-- PG:    EXPLAIN (ANALYZE, BUFFERS) <query>;

-- Step 2: rewrite the predicate

-- Step 3: create a covering index`,
    solution: `-- Step 2: rewrite — range predicate enables index seek
SELECT order_id, customer_id, amount
FROM   orders
WHERE  order_date >= '2024-01-01'
  AND  order_date <  '2025-01-01'
  AND  status = 'Shipped';

-- Step 3a: MSSQL covering index
CREATE INDEX ix_orders_date_status_cov
ON orders (order_date, status)
INCLUDE (order_id, customer_id, amount);

-- Step 3b: PostgreSQL covering index
CREATE INDEX ix_orders_date_status_cov
ON orders (order_date, status)
INCLUDE (order_id, customer_id, amount);

-- Verify: EXPLAIN ANALYZE should now show Index Scan / Index Only Scan
-- with no Seq Scan and high buffer hit count.`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does an Index Seek mean in a MSSQL execution plan?',
      options: [
        'The entire index is scanned row by row',
        'The engine navigates the B-tree directly to the qualifying rows — selective and fast',
        'The query is using a hash join to match index keys',
        'The engine is rebuilding the index during the query'
      ],
      answer: 1,
      explanation: 'An Index Seek navigates the B-tree structure to jump directly to matching rows. It is the most efficient access method for selective queries and is contrasted with an Index Scan, which reads all index pages.'
    },
    {
      q: 'A Key Lookup in a MSSQL plan usually means…',
      options: [
        'The clustered index is corrupt and needs rebuilding',
        'The non-clustered index does not cover all columns in the SELECT — extra reads go back to the clustered index',
        'A foreign key is being validated on every row',
        'The query is using an implicit conversion'
      ],
      answer: 1,
      explanation: 'A Key Lookup occurs when a non-clustered index satisfies the WHERE clause but not all projected columns. The engine must do an extra clustered-index read per row. Fix by adding projected columns to the INCLUDE list of the non-clustered index.'
    },
    {
      q: 'In PostgreSQL EXPLAIN ANALYZE, what does a large discrepancy between "rows=100" (estimated) and "actual rows=50000" indicate?',
      options: [
        'The query is running correctly and estimated rows do not matter',
        'The index is corrupted',
        'Table statistics are stale — run ANALYZE to update them',
        'The query must be rewritten with LIMIT'
      ],
      answer: 2,
      explanation: 'The planner uses statistics to estimate row counts. A large mismatch means the statistics are outdated or skewed. Run ANALYZE table_name to refresh them. Stale stats lead to wrong join order, wrong algorithm choice, and poor performance.'
    },
    {
      q: 'Why does WHERE YEAR(order_date) = 2024 prevent an index seek?',
      options: [
        'YEAR() is not a valid SQL function',
        'The function wraps the indexed column — the optimizer cannot invert YEAR() to derive a range, so it scans every row',
        'Indexes do not support DATE columns',
        'The optimizer only uses indexes for equality conditions'
      ],
      answer: 1,
      explanation: 'Applying a function to an indexed column prevents the optimizer from using the index\'s B-tree structure to find a range. The engine must evaluate YEAR(order_date) for every row. Rewrite as a range predicate (order_date >= \'2024-01-01\') to restore the seek.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use OPTION(RECOMPILE) in MSSQL?',
      a: 'Use OPTION(RECOMPILE) when parameter sniffing causes a bad plan — for example, a stored procedure compiled for 1 row but called with a parameter that returns 5M rows. RECOMPILE forces recompilation on every execution with the actual parameters. The trade-off is CPU cost per execution. Only add it after confirming the sniffing problem via sys.dm_exec_cached_plans.',
    },
    {
      q: 'What is the difference between logical reads and physical reads in MSSQL STATISTICS IO?',
      a: 'Logical reads: pages read from the buffer pool (RAM). Physical reads: pages read from disk because they were not in the buffer pool. High physical reads indicate memory pressure or a cold cache. Tuning typically focuses on reducing logical reads via better indexes — physical reads should drop once the buffer pool warms up.',
    },
    {
      q: 'How do I use pg_stat_statements to find slow queries in PostgreSQL?',
      a: 'Enable pg_stat_statements in postgresql.conf (shared_preload_libraries = \'pg_stat_statements\'). Then: SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20; — this shows the queries consuming the most total time. EXPLAIN ANALYZE the top offenders to understand and fix them.',
    },
  ];
}
