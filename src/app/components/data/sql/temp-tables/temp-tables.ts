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
  selector: 'app-sql-temp-tables',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './temp-tables.html',
  styleUrls: ['./temp-tables.scss']
})
export class SqlTempTables {

  quickRef: QuickRefItem[] = [
    { name: '#temp (MSSQL)',          type: 'syntax',  desc: 'Session-scoped temp table; stored in tempdb' },
    { name: '##global_temp (MSSQL)',  type: 'syntax',  desc: 'Global temp table; shared across all sessions' },
    { name: 'TEMP / TEMPORARY (PG)',  type: 'keyword', desc: 'PostgreSQL session-scoped temporary table' },
    { name: '@table_var (MSSQL)',     type: 'syntax',  desc: 'Table variable; scope = current batch/proc' },
    { name: 'CREATE TEMP TABLE … ON COMMIT DROP', type: 'keyword', desc: 'PostgreSQL: auto-drop temp table at transaction end' },
    { name: 'SELECT INTO #t (MSSQL)', type: 'syntax',  desc: 'Create-and-populate temp table from a query' },
    { name: 'CREATE TABLE … AS SELECT (PG)', type: 'syntax', desc: 'Create-and-populate in PostgreSQL' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why use temp tables?',
      points: [
        'Break complex multi-step queries into readable stages without permanent schema changes.',
        'Materialise an intermediate result so it is read once and referenced many times — avoids repeated subquery evaluation.',
        'Temp tables support indexes, statistics, and can be reused across multiple statements in a stored procedure.',
      ]
    },
    {
      heading: 'MSSQL: #temp tables vs @table variables',
      points: [
        '#temp — stored in tempdb, session-scoped, support CREATE INDEX, visible to nested proc calls via EXEC.',
        '@table_var — scoped to the current batch or procedure, no explicit indexes (except PK/UNIQUE), not visible to EXEC calls, no transaction log (minimally logged).',
        'Rule of thumb: use @table_var for small sets (< ~1 000 rows) where you do not need indexes; #temp for anything larger or when you need statistics.',
      ]
    },
    {
      heading: 'PostgreSQL TEMP tables',
      points: [
        'CREATE TEMP TABLE or CREATE TEMPORARY TABLE — session-scoped, stored in a per-session schema.',
        'Automatically dropped when the session ends. Use ON COMMIT DROP to drop at transaction end.',
        'Can be indexed and analyzed just like permanent tables; statistics are maintained per-session.',
      ]
    },
    {
      heading: 'CTE vs subquery vs temp table',
      points: [
        'CTE (WITH …): readable, reusable within one query, but the database may re-evaluate for each reference (not always materialised).',
        'Subquery: inline, single-use, can be hard to read for complex logic.',
        'Temp table: always materialised, supports indexes and multi-statement reuse — best for large or complex intermediate results referenced more than once.',
      ]
    },
    {
      heading: 'Cleanup and pitfalls',
      points: [
        'MSSQL: temp tables are dropped automatically at session end but drop explicitly with DROP TABLE IF EXISTS #t inside stored procs to avoid collisions on re-run.',
        'PG: temp tables live for the session; DROP TABLE IF EXISTS temp_name or rely on session-end cleanup.',
        'Never use global temp tables (##name) for per-user data — all sessions share them.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL #temp',
      language: 'sql',
      code: `-- Create explicitly, then populate
CREATE TABLE #order_summary (
    customer_id INT,
    total_orders INT,
    total_revenue DECIMAL(12,2)
);

INSERT INTO #order_summary
SELECT customer_id, COUNT(*), SUM(amount)
FROM   orders
WHERE  status = 'Shipped'
GROUP  BY customer_id;

-- Index for faster lookup
CREATE INDEX ix_os_customer ON #order_summary (customer_id);

-- Reuse multiple times in the same session/proc
SELECT c.name, os.total_revenue
FROM   customers c
JOIN   #order_summary os ON os.customer_id = c.customer_id
WHERE  os.total_revenue > 10000;

-- Clean up (especially in stored procs)
DROP TABLE IF EXISTS #order_summary;`
    },
    {
      label: 'MSSQL @table variable',
      language: 'sql',
      code: `-- Table variable: scope = current batch
DECLARE @top_customers TABLE (
    customer_id   INT PRIMARY KEY,
    total_revenue DECIMAL(12,2)
);

INSERT INTO @top_customers
SELECT TOP 100 customer_id, SUM(amount)
FROM   orders
GROUP  BY customer_id
ORDER  BY SUM(amount) DESC;

-- Use within the same batch
SELECT c.name, tc.total_revenue
FROM   customers c
JOIN   @top_customers tc ON tc.customer_id = c.customer_id;

-- @table_var goes out of scope at end of batch — no explicit DROP needed.
-- Note: stats are NOT updated on @table_var; optimizer estimates 1 row.`
    },
    {
      label: 'PostgreSQL TEMP TABLE',
      language: 'sql',
      code: `-- Session-scoped temp table
CREATE TEMP TABLE order_summary AS
SELECT customer_id,
       COUNT(*)       AS total_orders,
       SUM(amount)    AS total_revenue
FROM   orders
WHERE  status = 'Shipped'
GROUP  BY customer_id;

-- Add an index
CREATE INDEX ON order_summary (customer_id);

-- Update stats so the planner uses them
ANALYZE order_summary;

-- Use across multiple queries in the session
SELECT c.name, os.total_revenue
FROM   customers c
JOIN   order_summary os USING (customer_id)
WHERE  os.total_revenue > 10000;

-- ON COMMIT DROP: drops at end of transaction
CREATE TEMP TABLE staging_rows (
    id INT, val TEXT
) ON COMMIT DROP;`
    },
    {
      label: 'SELECT INTO / CREATE AS SELECT',
      language: 'sql',
      code: `-- MSSQL: SELECT INTO creates #temp from query result
SELECT customer_id, COUNT(*) AS cnt, SUM(amount) AS revenue
INTO   #quick_summary
FROM   orders
WHERE  order_date >= '2024-01-01'
GROUP  BY customer_id;

-- Verify
SELECT * FROM #quick_summary WHERE revenue > 5000;
DROP TABLE IF EXISTS #quick_summary;

-- PostgreSQL: CREATE TEMP TABLE … AS SELECT
CREATE TEMP TABLE quick_summary AS
SELECT customer_id, COUNT(*) AS cnt, SUM(amount) AS revenue
FROM   orders
WHERE  order_date >= '2024-01-01'
GROUP  BY customer_id;

-- Add NOT NULL / constraint (must do after CREATE AS SELECT)
ALTER TABLE quick_summary ALTER COLUMN customer_id SET NOT NULL;
DROP TABLE IF EXISTS quick_summary;`
    },
  ];

  challenge: Challenge = {
    title: 'Multi-step sales analysis with temp table',
    language: 'sql',
    description: 'Write a stored-procedure-style script (MSSQL or PG) that: (1) loads the top 50 customers by lifetime revenue into a temp table, (2) adds an index on customer_id, (3) joins back to orders to find those customers\' orders placed in the last 30 days, and (4) drops the temp table at the end.',
    hints: [
      'Use SELECT TOP 50 … ORDER BY SUM(amount) DESC (MSSQL) or LIMIT 50 … ORDER BY (PG) for step 1.',
      'CREATE INDEX ix_tc ON #top_customers (customer_id); after the INSERT.',
      'JOIN to orders WHERE order_date >= DATEADD(DAY,-30,GETDATE()) / NOW() - INTERVAL \'30 days\'.',
    ],
    starterCode: `-- Step 1: create and populate temp table
-- Step 2: index it
-- Step 3: join back to orders for recent activity
-- Step 4: clean up`,
    solution: `-- MSSQL version
CREATE TABLE #top_customers (
    customer_id   INT PRIMARY KEY,
    lifetime_rev  DECIMAL(12,2)
);

INSERT INTO #top_customers
SELECT TOP 50 customer_id, SUM(amount)
FROM   orders
GROUP  BY customer_id
ORDER  BY SUM(amount) DESC;

CREATE INDEX ix_tc ON #top_customers (customer_id);

SELECT c.name, o.order_id, o.amount, o.order_date
FROM   #top_customers tc
JOIN   customers c ON c.customer_id = tc.customer_id
JOIN   orders    o ON o.customer_id = tc.customer_id
WHERE  o.order_date >= DATEADD(DAY, -30, GETDATE())
ORDER  BY tc.lifetime_rev DESC, o.order_date DESC;

DROP TABLE IF EXISTS #top_customers;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When should you prefer a #temp table over a @table variable in MSSQL?',
      options: [
        'Always — #temp tables are strictly better',
        'When you have more than ~1 000 rows or need explicit indexes and accurate statistics',
        'When the data must persist after the session ends',
        'When the result set is smaller than 100 rows'
      ],
      answer: 1,
      explanation: '@table_var gives the optimizer no statistics (assumes 1 row), which can cause bad plans on large sets. Use #temp with indexes and statistics for larger intermediate results or when the table is referenced in sub-calls.'
    },
    {
      q: 'What is the scope of a PostgreSQL TEMP TABLE?',
      options: ['Current statement only', 'Current transaction', 'Current session', 'The entire database'],
      answer: 2,
      explanation: 'PostgreSQL TEMP tables are session-scoped by default — they persist until the session ends or you DROP them. Use ON COMMIT DROP to limit scope to the current transaction.'
    },
    {
      q: 'Why might a CTE be slower than a temp table for the same intermediate result?',
      options: [
        'CTEs are always re-evaluated for each reference in the query, so the work is repeated',
        'CTEs cannot use indexes',
        'CTEs require a separate connection',
        'CTEs are limited to 1 000 rows'
      ],
      answer: 0,
      explanation: 'In most engines a CTE is not guaranteed to be materialised. If referenced multiple times the optimizer may re-execute it each time. A temp table is always materialised and can be indexed for subsequent reads.'
    },
    {
      q: 'What happens to a global temp table (##name) in MSSQL when the creating session ends?',
      options: [
        'It persists until the database is restarted',
        'It is dropped as soon as all sessions referencing it have disconnected',
        'It is converted to a permanent table',
        'It is moved to the user\'s schema'
      ],
      answer: 1,
      explanation: 'A global temp table (##name) is dropped when the session that created it ends AND no other sessions are actively using it. It is not safe for sharing long-lived data across sessions.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I create an index on a @table variable in MSSQL?',
      a: 'Only implicitly — you can declare a PRIMARY KEY or UNIQUE constraint in the table variable definition, which creates the underlying index. You cannot issue a standalone CREATE INDEX on a @table_var after it is declared.',
    },
    {
      q: 'Do temp tables in MSSQL use transaction log?',
      a: 'Yes, #temp tables are fully logged (in tempdb). @table_var changes are minimally logged. This is one reason @table_var can be faster for small row counts with frequent updates — less logging overhead.',
    },
    {
      q: 'How do I avoid "There is already an object named \'#temp\'" errors in stored procedures?',
      a: 'Add DROP TABLE IF EXISTS #temp; at the top of the procedure (or after each use). Without it, if the procedure errors mid-way and is re-run, the temp table may already exist from the previous run.',
    },
  ];
}
