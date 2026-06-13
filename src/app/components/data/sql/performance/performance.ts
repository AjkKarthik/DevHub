import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-performance',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './performance.html',
  styleUrl: './performance.scss',
})
export class SqlPerformance {

  quickRef: QuickRefItem[] = [
    { name: 'EXPLAIN',               type: 'keyword', desc: 'PostgreSQL: shows the query plan without executing', since: 'PostgreSQL' },
    { name: 'EXPLAIN ANALYZE',       type: 'keyword', desc: 'PostgreSQL: executes the query and shows actual vs estimated row counts', since: 'PostgreSQL' },
    { name: 'SET STATISTICS IO ON',  type: 'keyword', desc: 'MSSQL: reports logical/physical reads per table after query execution', since: 'MSSQL' },
    { name: 'SET STATISTICS TIME ON',type: 'keyword', desc: 'MSSQL: reports CPU and elapsed time for each statement', since: 'MSSQL' },
    { name: 'Logical reads',         type: 'keyword', desc: 'Number of 8KB pages read from the buffer pool; the primary I/O metric in MSSQL', since: 'MSSQL' },
    { name: 'Key lookup',            type: 'keyword', desc: 'Execution plan operator that fetches extra columns from the clustered index; eliminate with INCLUDE', since: 'MSSQL' },
    { name: 'Sargable',             type: 'keyword', desc: 'Predicate usable for index seek — no function on the indexed column side', since: 'General' },
    { name: 'Implicit conversion',   type: 'keyword', desc: 'Type mismatch forces a cast on every row, preventing index seeks', since: 'General' },
    { name: 'N+1 query',             type: 'keyword', desc: 'Anti-pattern: one query per row instead of one query for all rows', since: 'General' },
    { name: 'SELECT *',              type: 'keyword', desc: 'Anti-pattern: fetches all columns including LOBs; prevents covering indexes', since: 'General' },
    { name: 'NOLOCK / READUNCOMMITTED', type: 'keyword', desc: 'Dirty reads — risky shortcut; prefer RCSI for read isolation without hints', since: 'MSSQL' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Reading execution plans',
      points: [
        'Execution plans show how the query engine will (or did) retrieve data. In SQL Server use Ctrl+M (actual plan) or Ctrl+L (estimated plan). In PostgreSQL use EXPLAIN ANALYZE.',
        'Read plans <strong>right-to-left, bottom-to-top</strong> — the rightmost, bottom-most operator is executed first. Data flows left toward the result.',
        'Key operators to recognise: <strong>Table/Index Scan</strong> (reads all rows — potential problem on large tables), <strong>Index Seek</strong> (efficient B-tree lookup), <strong>Key Lookup</strong> (non-covering index — consider adding INCLUDE columns), <strong>Hash Match / Nested Loops / Merge Join</strong> (join algorithms).',
        'Thick arrows between operators indicate high row estimates — high cost. The percentage shown on each operator is its share of total estimated cost.',
      ],
    },
    {
      heading: 'Common anti-patterns',
      points: [
        '<strong>SELECT *</strong>: fetches all columns including large ones (NVARCHAR(MAX), VARBINARY). Prevents covering indexes. Always select only the columns you need.',
        '<strong>Functions on indexed columns</strong> (non-sargable): <code>WHERE YEAR(OrderDate) = 2024</code> forces a full scan. Rewrite as a range: <code>WHERE OrderDate >= \'2024-01-01\' AND OrderDate < \'2025-01-01\'</code>.',
        '<strong>Implicit type conversions</strong>: comparing a VARCHAR column to an integer literal forces per-row casts. Always match types, or use explicit CAST.',
        '<strong>OR conditions across columns</strong>: <code>WHERE A = 1 OR B = 2</code> often degrades to a scan even with separate indexes on A and B. Consider UNION ALL of two targeted queries instead.',
        '<strong>N+1 queries</strong>: one query per row in application code. Replace with a single JOIN or IN query.',
      ],
    },
    {
      heading: 'Statistics and cardinality estimates',
      points: [
        'The query optimiser uses <strong>statistics</strong> — histograms of column value distributions — to estimate how many rows each operation will process. Wrong estimates lead to bad plan choices.',
        'Stale statistics happen when data changes significantly after the last statistics update. Enable <code>AUTO_UPDATE_STATISTICS</code> (on by default) and occasionally run <code>UPDATE STATISTICS table WITH FULLSCAN</code> for large tables.',
        'Cardinality estimate mismatches (estimated vs actual rows far apart in the plan) indicate stale or missing statistics. Huge mismatches cause nested loops on millions of rows, or hash joins on tiny sets.',
        'In PostgreSQL run <code>ANALYZE tablename</code> to update statistics, or <code>VACUUM ANALYZE</code> to also reclaim dead-row space.',
      ],
    },
    {
      heading: 'Practical tuning workflow',
      points: [
        '1. <strong>Identify slow queries</strong>: SQL Server — sys.dm_exec_query_stats (top by CPU/reads); PostgreSQL — pg_stat_statements extension.',
        '2. <strong>Read the plan</strong>: look for scans on large tables, key lookups, thick arrows, high estimated vs actual row mismatches.',
        '3. <strong>Check indexes</strong>: is there a missing index hint? Does the predicate disable an existing index (non-sargable, type mismatch)?',
        '4. <strong>Rewrite the query</strong>: replace scalar UDFs with iTVFs, CTEs, or joins; fix sargability; split complex OR into UNION ALL.',
        '5. <strong>Test with SET STATISTICS IO ON</strong> (MSSQL) or EXPLAIN ANALYZE (PG) — compare logical reads before and after.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Diagnosing slow queries',
      language: 'sql',
      code: `-- MSSQL: top 10 queries by total logical reads
SELECT TOP 10
    qs.total_logical_reads / qs.execution_count AS AvgReads,
    qs.execution_count,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset END
         - qs.statement_start_offset)/2) + 1) AS QueryText
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY AvgReads DESC;

-- MSSQL: I/O per table for a query
SET STATISTICS IO ON;
SELECT o.OrderID, c.CompanyName FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
WHERE o.OrderDate >= '2024-01-01';
SET STATISTICS IO OFF;`,
    },
    {
      label: 'Fixing sargability',
      language: 'sql',
      code: `-- ❌ Non-sargable: function on indexed column
SELECT * FROM Orders WHERE YEAR(OrderDate) = 2024;
SELECT * FROM Customers WHERE UPPER(Email) = 'TEST@EXAMPLE.COM';

-- ✅ Sargable: range predicate / match types
SELECT * FROM Orders
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';

-- ❌ Implicit type conversion (Email is NVARCHAR, literal is VARCHAR)
SELECT * FROM Customers WHERE Email = 'test@example.com';   -- no N prefix

-- ✅ Correct type
SELECT * FROM Customers WHERE Email = N'test@example.com';

-- ❌ OR blocking seeks
SELECT * FROM Products WHERE CategoryID = 1 OR SupplierID = 3;

-- ✅ UNION ALL — each branch can use its own index
SELECT * FROM Products WHERE CategoryID = 1
UNION ALL
SELECT * FROM Products WHERE SupplierID = 3 AND CategoryID <> 1;`,
    },
    {
      label: 'EXPLAIN ANALYZE (PG)',
      language: 'sql',
      code: `-- PostgreSQL: full execution details
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.company_name, COUNT(o.order_id) AS orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'Germany'
GROUP BY c.company_name;

-- Reading the output:
-- "Seq Scan on customers"  → no index used for country filter
-- "rows=5 width=..." (estimated) vs "(actual rows=11 loops=1)"
-- Large difference = stale statistics → run ANALYZE customers

-- Update statistics
ANALYZE customers;

-- Vacuum + analyze (reclaim dead rows + update stats)
VACUUM ANALYZE orders;`,
    },
  ];

  challenge: Challenge = {
    title: 'Rewrite a Slow Query',
    language: 'sql',
    description: `The following query runs slowly on a large Orders table (10M rows). Identify what is wrong and rewrite it to be efficient:

\`\`\`sql
SELECT DISTINCT CustomerID
FROM Orders
WHERE CONVERT(VARCHAR, OrderDate, 112) LIKE '2024%'
  AND ISNULL(Status, 'Pending') = 'Pending';
\`\`\`

Rewrite the query to be sargable and correct, assuming:
- OrderDate is DATETIME2
- Status is VARCHAR(20) NULLable; NULL means 'Pending'`,
    hints: [
      'CONVERT on OrderDate is non-sargable — replace with a date range',
      'ISNULL(Status, ...) = ... is non-sargable — use (Status = \'Pending\' OR Status IS NULL)',
      'DISTINCT is fine here but ensure the rewrite returns the same rows',
    ],
    starterCode: `-- Slow original:
-- SELECT DISTINCT CustomerID FROM Orders
-- WHERE CONVERT(VARCHAR, OrderDate, 112) LIKE '2024%'
--   AND ISNULL(Status, 'Pending') = 'Pending';

-- Rewritten (sargable):
SELECT DISTINCT CustomerID
FROM Orders
WHERE
    -- fix the date predicate
    -- fix the status predicate
;`,
    solution: `SELECT DISTINCT CustomerID
FROM Orders
WHERE OrderDate >= '2024-01-01'
  AND OrderDate  < '2025-01-01'
  AND (Status = 'Pending' OR Status IS NULL);

-- Why it is now sargable:
-- 1. Date range on OrderDate allows an index seek (no function on the column).
-- 2. (Status = 'Pending' OR Status IS NULL) is a direct column predicate.
--    A filtered index WHERE Status IS NULL or IS NOT NULL can also be useful.`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In which direction do you read a SQL Server execution plan?',
      options: ['Left to right, top to bottom', 'Right to left, bottom to top — last operator executes first', 'Top to bottom only', 'The order shown is the execution order'],
      answer: 1,
      explanation: 'Data flows from right to left in a SQL Server execution plan. The rightmost, bottommost operator is the first data source. Read it from right to left to follow the data pipeline.',
    },
    {
      q: 'What does a "Key Lookup" operator in a SQL Server execution plan indicate?',
      options: [
        'The query is using a foreign key lookup',
        'A non-covering index is being used; the engine must fetch extra columns from the clustered index',
        'Full-text search is occurring',
        'An implicit type conversion is happening',
      ],
      answer: 1,
      explanation: 'A Key Lookup (or RID Lookup) happens when a non-clustered index was used for seeks but the SELECT needs columns not in the index. The engine follows the row locator back to the clustered index for each row. Eliminate it by adding INCLUDE columns.',
    },
    {
      q: 'STATISTICS IO reports 50,000 logical reads for a query on a 10,000-row table (8 KB pages). This suggests:',
      options: [
        'The query is well-optimised',
        'Excessive scanning — likely a table/index scan repeated many times or a missing index',
        'The table needs more statistics',
        'The table is too small to benefit from indexes',
      ],
      answer: 1,
      explanation: 'A 10,000-row table fits in roughly 100–200 data pages. 50,000 logical reads suggests either many scans, a nested-loop join causing repeated scans, or a missing index forcing full table scans.',
    },
    {
      q: 'Why does `WHERE ISNULL(Status, \'Pending\') = \'Pending\'` perform poorly on an indexed Status column?',
      options: [
        'ISNULL is not a valid function',
        'The function wraps the column, making the predicate non-sargable — the engine must evaluate ISNULL(Status, ...) for every row',
        'The index does not support NULL values',
        'String comparisons are always slow',
      ],
      answer: 1,
      explanation: 'Any function applied to the indexed column (ISNULL, COALESCE, CONVERT, YEAR, etc.) prevents an index seek. Rewrite as: (Status = \'Pending\' OR Status IS NULL) to keep the predicate sargable.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between logical reads and physical reads?',
      a: 'Logical reads count all page accesses from the buffer pool (cache), whether the page was already in memory or had to be read from disk. Physical reads count only pages fetched from disk. An optimised query with warm cache has high logical reads but zero physical reads. Minimise logical reads by improving indexes — this reduces both cache pressure and disk I/O.',
    },
    {
      q: 'When should I use query hints like NOLOCK?',
      a: 'Almost never in production code. WITH(NOLOCK) allows dirty reads (uncommitted data, phantom rows, duplicated rows). It is often used to "fix" blocking problems — but the real fix is shorter transactions, proper indexes, or RCSI (READ_COMMITTED_SNAPSHOT). Use NOLOCK only for truly non-critical reads like monitoring queries where accuracy does not matter.',
    },
    {
      q: 'How do I find queries that are causing the most I/O in production?',
      a: 'SQL Server: query sys.dm_exec_query_stats ordered by total_logical_reads or total_worker_time. The query plan is available via sys.dm_exec_query_plan. PostgreSQL: install pg_stat_statements (shared_preload_libraries = \'pg_stat_statements\') then query pg_stat_statements ordered by total_blks_hit + total_blks_read or total_exec_time.',
    },
    {
      q: 'What is the N+1 query problem and how do I fix it?',
      a: 'N+1 happens when application code runs one query to fetch N records, then N more queries to fetch related data for each record. Fix: use a JOIN or subquery to retrieve everything in one round-trip. In an ORM context, use eager loading (Include() in EF Core, joinedload() in SQLAlchemy) or a raw SQL query that JOINs the related table.',
    },
  ];
}
