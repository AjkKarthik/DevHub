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
    { name: 'EXPLAIN',                    type: 'keyword', desc: 'PostgreSQL: shows the query plan without executing — costs and row estimates only', since: 'PostgreSQL' },
    { name: 'EXPLAIN ANALYZE',            type: 'keyword', desc: 'PostgreSQL: executes and shows actual rows, loops, and timing alongside estimates', since: 'PostgreSQL' },
    { name: 'EXPLAIN (ANALYZE, BUFFERS)', type: 'keyword', desc: 'PostgreSQL: also reports buffer hits, reads, dirtied, and written pages — I/O analysis', since: 'PostgreSQL' },
    { name: 'SET STATISTICS IO ON',       type: 'keyword', desc: 'MSSQL: reports logical/physical reads per table after query execution', since: 'MSSQL' },
    { name: 'SET STATISTICS TIME ON',     type: 'keyword', desc: 'MSSQL: reports CPU and elapsed time for each statement', since: 'MSSQL' },
    { name: 'Logical reads',              type: 'keyword', desc: 'Number of 8 KB pages read from the buffer pool; primary I/O metric in MSSQL (lower = better)', since: 'MSSQL' },
    { name: 'Key lookup',                 type: 'keyword', desc: 'Execution plan operator: fetch extra columns from clustered index; fix with INCLUDE columns', since: 'MSSQL' },
    { name: 'Sargable',                   type: 'keyword', desc: 'Predicate that enables an index seek — no function applied to the indexed column side', since: 'General' },
    { name: 'Implicit conversion',        type: 'keyword', desc: 'Type mismatch forces a per-row cast, preventing index seeks and causing full scans', since: 'General' },
    { name: 'Parameter sniffing',         type: 'keyword', desc: 'MSSQL caches the plan for the first parameter values; later calls with different values may use a sub-optimal plan', since: 'MSSQL' },
    { name: 'OPTION (RECOMPILE)',         type: 'keyword', desc: 'Force per-execution plan recompile — prevents bad cached plans; adds compile overhead', since: 'MSSQL' },
    { name: 'N+1 query',                  type: 'keyword', desc: 'Anti-pattern: one query per row in application code instead of one batched query', since: 'General' },
    { name: 'pg_stat_statements',         type: 'keyword', desc: 'PostgreSQL extension: tracks cumulative statistics per unique query text — find top consumers', since: 'PostgreSQL 9.2+' },
    { name: 'sys.dm_exec_query_stats',    type: 'keyword', desc: 'MSSQL DMV: cached plan statistics (CPU, reads, duration) per query — find top consumers', since: 'MSSQL 2005+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Reading execution plans',
      points: [
        'Execution plans visualise how the engine retrieves data. In SQL Server: Ctrl+M (actual plan while executing) or Ctrl+L (estimated plan without executing). In SSMS, look for the green "Missing Index" hint above the plan. In PostgreSQL: <code>EXPLAIN ANALYZE</code> prints a text plan with actual row counts and timing.',
        'Read SQL Server plans <strong>right-to-left, bottom-to-top</strong> — the rightmost, bottommost node is the first data source. Data flows left toward the final output. Arrow thickness is proportional to the estimated row count — thick arrows between operators signal high-volume data movement.',
        'Key operators: <strong>Index Seek</strong> (B-tree targeted lookup — efficient), <strong>Index/Table Scan</strong> (reads all pages — expensive on large tables), <strong>Key Lookup</strong> (RID Lookup: found the row via non-clustered index but must fetch extra columns from the clustered index — fix with INCLUDE), <strong>Nested Loops / Hash Match / Merge Join</strong> (three join algorithms, each optimal at different data sizes and sort orders).',
        'The percentage on each node is its share of the query\'s total estimated cost — a node at 80% cost is the primary target for optimisation. Large gaps between <em>estimated rows</em> and <em>actual rows</em> indicate stale or missing statistics causing the optimiser to choose a sub-optimal plan.',
        'In PostgreSQL, read the plan from the innermost (most indented) lines outward. <code>Seq Scan</code> = full table scan; <code>Index Scan</code> = B-tree traversal (rows fetched one-by-one); <code>Bitmap Heap Scan</code> = index used to build a bitmap, then rows fetched in heap order (efficient for many matching rows); <code>Hash Join</code>, <code>Merge Join</code>, <code>Nested Loop</code> are the three join algorithms. <code>cost=0.00..1234.56</code> means startup..total cost in abstract units.',
      ],
    },
    {
      heading: 'Common anti-patterns and sargability',
      points: [
        '<strong>SELECT *</strong>: fetches all columns including large LOBs (NVARCHAR(MAX), VARBINARY(MAX)). Prevents covering indexes — the engine must visit the clustered index for every row. Always project only the columns you actually need.',
        '<strong>Non-sargable predicates</strong>: a predicate is non-sargable when a function, operator, or implicit conversion is applied to the indexed column, preventing an index seek. Examples: <code>WHERE YEAR(OrderDate) = 2024</code>, <code>WHERE UPPER(email) = \'X\'</code>, <code>WHERE CONVERT(VARCHAR, id) = \'5\'</code>. Fix by rewriting to leave the column bare: <code>WHERE OrderDate &gt;= \'2024-01-01\' AND OrderDate &lt; \'2025-01-01\'</code>.',
        '<strong>Implicit type conversions</strong>: comparing an NVARCHAR column to a VARCHAR literal (missing N prefix) forces a per-row cast. Comparing an INT column to a string literal is even worse. The execution plan shows a CONVERT_IMPLICIT node and the index is not seekable. Match types explicitly: <code>WHERE email = N\'test@example.com\'</code>.',
        '<strong>OR conditions across different columns</strong>: <code>WHERE A = 1 OR B = 2</code> often causes a table scan even with separate indexes on A and B, because combining two index results efficiently requires an index union. Rewrite as <code>UNION ALL</code> of two targeted seeks — each branch uses its own index, and rows from both are merged.',
        '<strong>N+1 queries</strong>: application code fetches N parent records, then loops and issues one query per parent for its children — N+1 total round-trips. Replace with a single JOIN or <code>WHERE parent_id IN (…)</code> query to load all children in one trip. In ORM code, use eager loading. N+1 is the most common application-level SQL performance bug.',
      ],
    },
    {
      heading: 'Statistics and cardinality estimation',
      points: [
        'The query optimiser uses <strong>statistics</strong> — histograms of column value distributions — to estimate how many rows each operator will process. These estimates drive join algorithm choices, index selection, and memory grants. Wrong estimates lead to bad plans: nested loops on millions of rows, hash joins with insufficient memory, or wrong index choices.',
        'Statistics become <strong>stale</strong> when data changes significantly after the last update. A table that grows from 1M to 10M rows with auto-update statistics (20% change threshold in older MSSQL versions; trace flag 2371 lowers it) may run long with outdated histograms. Run <code>UPDATE STATISTICS table WITH FULLSCAN</code> after bulk loads. In PostgreSQL, run <code>ANALYZE tablename</code>.',
        'A <strong>cardinality mismatch</strong> — estimated 10 rows, actual 100,000 rows — is the telltale sign. This causes catastrophically bad plan choices: nested loops chosen for a 100k-row result (expects 10 rows → switches to hash join threshold far too late), memory grants too small for sort/hash (causing spills to tempdb), or index seeks chosen when a scan would be faster.',
        'MSSQL stores statistics per index and per column. View them with <code>DBCC SHOW_STATISTICS(\'TableName\', \'IndexName\')</code>. The histogram shows step values and density; gaps in the histogram mean the optimiser guesses for values between steps. Adding filtered statistics on common filter values can dramatically improve estimates.',
        'In PostgreSQL, column statistics depth is controlled by <code>ALTER TABLE t ALTER COLUMN c SET STATISTICS 500</code> (default 100 buckets). Higher values give more accurate histograms for high-cardinality columns. Extended statistics (<code>CREATE STATISTICS s ON (a, b) FROM t</code>) capture correlations between columns that single-column histograms miss (e.g., city + state are highly correlated).',
      ],
    },
    {
      heading: 'Parameter sniffing — cached plans vs. optimal plans',
      points: [
        '<strong>Parameter sniffing</strong> is when SQL Server compiles and caches a query plan based on the first set of parameter values it sees. Subsequent executions with different parameter values reuse that cached plan — even when a different plan would be more efficient for the new values. For example, the first call uses CustomerID=1 (1 order) → nested-loop plan cached. Next call uses CustomerID=500 (10,000 orders) → the nested-loop plan is terrible, but it\'s what\'s cached.',
        'Diagnose sniffing: in SSMS, use "Include Actual Plan" and check the XML plan for <code>ParameterCompiledValue</code> vs <code>ParameterRuntimeValue</code>. If they differ significantly, sniffing is a suspect. Also look for large estimated vs actual row mismatches for the first operator.',
        '<strong>Fix 1 — OPTION (RECOMPILE)</strong>: appended to the query, forces the optimiser to compile a new plan every execution using the current parameter values. Eliminates bad cached plans at the cost of compile overhead (typically 1–5 ms per execution). Right choice for queries run infrequently with highly variable parameters.',
        '<strong>Fix 2 — OPTIMIZE FOR UNKNOWN</strong>: <code>OPTION (OPTIMIZE FOR (@param UNKNOWN))</code> compiles the plan using average statistics rather than the sniffed value. Produces a plan that is rarely perfect but rarely catastrophic. Good for stored procedures with moderately variable parameters.',
        '<strong>Fix 3 — Local variables</strong>: assigning parameters to local variables inside the stored procedure breaks sniffing — SQL Server can\'t sniff a local variable, so it uses average statistics. Quick fix, but same downside as OPTIMIZE FOR UNKNOWN. For the highest-stakes queries, consider query store plan forcing or maintaining separate stored procedures for known skewed parameter ranges.',
      ],
    },
    {
      heading: 'Practical tuning workflow',
      points: [
        '<strong>Step 1 — Identify slow queries</strong>: SQL Server — query <code>sys.dm_exec_query_stats</code> ordered by <code>total_logical_reads / execution_count</code> (most I/O per execution) or <code>total_worker_time</code> (most CPU total). PostgreSQL — enable <code>pg_stat_statements</code> and query by <code>mean_exec_time DESC</code> or <code>total_blks_hit + total_blks_read DESC</code>.',
        '<strong>Step 2 — Capture the plan</strong>: in SSMS use "Include Actual Execution Plan" (Ctrl+M) while running the query in isolation. Or retrieve the cached plan from <code>sys.dm_exec_query_plan</code>. In PostgreSQL use <code>EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)</code> and paste into explain.dalibo.com for visual analysis.',
        '<strong>Step 3 — Diagnose</strong>: look for scans on large tables (add indexes), key lookups (add INCLUDE columns), thick arrows (row estimate wrong — check statistics), large estimated vs actual mismatches (stale statistics or parameter sniffing), sorts on large data sets (add an index with the right ORDER to avoid sorting), spills to tempdb (increase memory grant via statistics fix or query hint).',
        '<strong>Step 4 — Fix and test</strong>: apply one change at a time (index, rewrite, statistics update, query hint). Run <code>SET STATISTICS IO ON</code> (MSSQL) or <code>EXPLAIN (ANALYZE, BUFFERS)</code> (PG) before and after — measure logical reads (MSSQL) or buffer hits (PG). Never judge a fix by wallclock time alone — it varies with server load.',
        '<strong>Step 5 — Guard against regression</strong>: in SQL Server 2016+, Query Store records plan history and lets you force a known-good plan. In PostgreSQL, <code>pg_hint_plan</code> extension forces plan choices. For critical queries, add execution plan assertions to integration tests — re-run EXPLAIN and assert "should use Index Seek, not Seq Scan" to catch regressions in CI.',
      ],
    },
    {
      heading: 'Index strategies for performance',
      points: [
        'A <strong>covering index</strong> includes all columns the query needs — SELECT columns, WHERE columns, and JOIN columns — in the index itself. No Key Lookup needed: the engine answers the query entirely from the index pages. Example: <code>CREATE INDEX IX_Orders_Customer ON Orders (CustomerID) INCLUDE (OrderDate, Freight)</code> covers a query that filters by CustomerID and projects OrderDate and Freight.',
        'INCLUDE columns are stored only in index leaf pages (not in the B-tree interior nodes), so they don\'t increase the tree depth. Key columns (in the index definition, not INCLUDE) are used for seeks and sorts; INCLUDE columns are for covering — choose index key columns carefully (those used in WHERE/JOIN/ORDER BY), add the rest as INCLUDE.',
        '<strong>Filtered indexes</strong> (MSSQL) apply a WHERE clause to the index: <code>CREATE INDEX IX_Active ON Products (CategoryID) WHERE Discontinued = 0</code>. The index only contains active products — smaller, faster to scan, and usable by queries with the matching WHERE clause. Dramatically effective when a large fraction of rows have a common filter value (soft-deleted records, specific status).',
        '<strong>Index maintenance</strong>: B-tree indexes fragment over time as rows are inserted, updated, and deleted. Fragmentation increases logical reads. MSSQL: <code>REORGANIZE</code> (online, defragment leaf level, for low fragmentation) or <code>REBUILD</code> (offline by default, recreates the index, fixes all fragmentation + updates statistics). PostgreSQL: <code>REINDEX</code> (offline) or <code>REINDEX CONCURRENTLY</code> (online, PostgreSQL 12+). Run fragmentation checks periodically in maintenance windows.',
        '<strong>Too many indexes hurt write performance</strong>: each INSERT/UPDATE/DELETE must maintain every index on the table. A table with 15 indexes has 15 B-tree updates per row change. Audit unused indexes with <code>sys.dm_db_index_usage_stats</code> (MSSQL) or <code>pg_stat_user_indexes WHERE idx_scan = 0</code> (PostgreSQL). Drop unused indexes — the write overhead they impose is never worth it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Diagnosing slow queries',
      language: 'sql',
      code: `-- ── MSSQL: top 10 queries by average logical reads ───────────────────
SELECT TOP 10
    qs.total_logical_reads / qs.execution_count AS AvgLogicalReads,
    qs.execution_count,
    qs.total_worker_time / qs.execution_count / 1000 AS AvgCpuMs,
    SUBSTRING(st.text,
        (qs.statement_start_offset / 2) + 1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(st.text)
          ELSE qs.statement_end_offset END - qs.statement_start_offset) / 2) + 1
    ) AS QueryText
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY AvgLogicalReads DESC;

-- ── MSSQL: I/O per table for a specific query ─────────────────────────
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SELECT o.OrderID, c.CompanyName
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
WHERE o.OrderDate >= '2024-01-01';
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
-- Look for: "logical reads 5000" on a 100-row result → 50 reads/row → scan or key lookup

-- ── PostgreSQL: find top queries by I/O ───────────────────────────────
-- Requires: shared_preload_libraries = 'pg_stat_statements' in postgresql.conf
SELECT
    LEFT(query, 100) AS QuerySnippet,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS AvgMs,
    total_blks_hit + total_blks_read AS TotalBlocks
FROM pg_stat_statements
ORDER BY TotalBlocks DESC
LIMIT 10;`,
    },
    {
      label: 'Fixing sargability',
      language: 'sql',
      code: `-- ── Non-sargable vs sargable: date range ─────────────────────────────
-- ❌ Function on column: forces full scan even with index on OrderDate
SELECT * FROM Orders WHERE YEAR(OrderDate) = 2024;
SELECT * FROM Orders WHERE CONVERT(VARCHAR, OrderDate, 112) LIKE '2024%';

-- ✅ Range predicate: allows index seek
SELECT * FROM Orders
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';

-- ── Non-sargable vs sargable: function on column ───────────────────────
-- ❌ UPPER() prevents index seek on Email
SELECT * FROM Customers WHERE UPPER(Email) = 'TEST@EXAMPLE.COM';
-- ✅ Store email in lowercase, or create a computed column + index:
SELECT * FROM Customers WHERE Email = 'test@example.com';

-- ── Implicit type conversion ───────────────────────────────────────────
-- ❌ Email is NVARCHAR; missing N'' prefix → implicit cast, no seek
SELECT * FROM Customers WHERE Email = 'test@example.com';       -- VARCHAR literal
-- ✅ Match the column type
SELECT * FROM Customers WHERE Email = N'test@example.com';      -- NVARCHAR literal

-- ── OR → UNION ALL for independent index seeks ────────────────────────
-- ❌ OR may force scan even with separate indexes on CategoryID and SupplierID
SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1 OR SupplierID = 3;

-- ✅ Each branch uses its own index seek
SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1
UNION ALL
SELECT ProductID, ProductName FROM Products WHERE SupplierID = 3 AND CategoryID <> 1;

-- ── ISNULL / COALESCE in predicate ────────────────────────────────────
-- ❌ Non-sargable
WHERE ISNULL(Status, 'Pending') = 'Pending'
-- ✅ Sargable
WHERE (Status = 'Pending' OR Status IS NULL)`,
    },
    {
      label: 'EXPLAIN ANALYZE (PG)',
      language: 'sql',
      code: `-- ── PostgreSQL: execution plan with buffers (I/O) ────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.company_name, COUNT(o.order_id) AS orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'Germany'
GROUP BY c.company_name;

-- Reading the output:
-- "Seq Scan on customers  (cost=0.00..14.50 rows=5 width=32)
--                         (actual time=0.010..0.015 rows=11 loops=1)"
-- estimated rows=5, actual=11 → stale statistics → run ANALYZE customers
-- "Buffers: shared hit=3 read=1" → 3 pages from cache, 1 from disk

-- ── Update statistics / vacuum ─────────────────────────────────────────
ANALYZE customers;                -- update column statistics
VACUUM ANALYZE orders;            -- reclaim dead rows + update statistics

-- ── PostgreSQL: find missing indexes (tables with many seq scans) ──────
SELECT
    schemaname,
    relname                     AS table_name,
    seq_scan,
    idx_scan,
    n_live_tup                  AS live_rows,
    seq_tup_read / GREATEST(seq_scan, 1) AS avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100              -- frequently scanned without index
ORDER BY seq_tup_read DESC
LIMIT 20;`,
    },
    {
      label: 'Parameter sniffing (MSSQL)',
      language: 'sql',
      code: `-- ── Demonstrate sniffing ─────────────────────────────────────────────
-- First call: @CustomerID = 1 (1 order) → nested-loop plan compiled and cached
EXEC GetCustomerOrders @CustomerID = 1;

-- Second call: @CustomerID = 500 (50,000 orders) → cached nested-loop plan used
-- → disastrously slow: 50,000 index seeks instead of a single hash join scan
EXEC GetCustomerOrders @CustomerID = 500;

-- ── Fix 1: OPTION (RECOMPILE) — per-execution plan ────────────────────
CREATE PROCEDURE GetCustomerOrders @CustomerID INT
AS
    SELECT OrderID, OrderDate, Freight
    FROM Orders
    WHERE CustomerID = @CustomerID
    OPTION (RECOMPILE);   -- compiles a new plan each call using the actual value
GO
-- Best for: infrequent queries with highly variable parameters

-- ── Fix 2: OPTIMIZE FOR UNKNOWN — use average statistics ──────────────
CREATE PROCEDURE GetCustomerOrdersBalanced @CustomerID INT
AS
    SELECT OrderID, OrderDate, Freight
    FROM Orders
    WHERE CustomerID = @CustomerID
    OPTION (OPTIMIZE FOR (@CustomerID UNKNOWN));
GO
-- Compiles once using average density — not perfect, not catastrophic

-- ── Fix 3: Local variable — breaks parameter sniffing ─────────────────
CREATE PROCEDURE GetCustomerOrdersLocal @CustomerID INT
AS
    DECLARE @LocalID INT = @CustomerID;   -- SQL Server cannot sniff local variables
    SELECT OrderID, OrderDate, Freight
    FROM Orders WHERE CustomerID = @LocalID;
GO

-- ── Diagnose: find plan for a cached procedure ────────────────────────
SELECT
    qs.execution_count,
    qs.total_logical_reads,
    TRY_CONVERT(XML, qp.query_plan) AS PlanXml
FROM sys.dm_exec_procedure_stats ps
JOIN sys.dm_exec_query_plan(ps.plan_handle) qp ON 1=1
JOIN sys.dm_exec_query_stats qs ON qs.plan_handle = ps.plan_handle
WHERE OBJECT_NAME(ps.object_id) = 'GetCustomerOrders';`,
    },
    {
      label: 'Missing index DMVs',
      language: 'sql',
      code: `-- ── MSSQL: find missing indexes (high-impact, not yet created) ────────
SELECT TOP 20
    ROUND(migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans), 0)
        AS ImpactScore,
    migs.user_seeks, migs.user_scans,
    mid.statement                        AS TableName,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs
    ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid
    ON mig.index_handle     = mid.index_handle
ORDER BY ImpactScore DESC;

-- ── MSSQL: find unused indexes (wasting write overhead) ───────────────
SELECT
    OBJECT_NAME(i.object_id) AS TableName,
    i.name                   AS IndexName,
    ius.user_seeks + ius.user_scans + ius.user_lookups AS TotalReads,
    ius.user_updates         AS TotalWrites
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius
    ON ius.object_id = i.object_id AND ius.index_id = i.index_id
    AND ius.database_id = DB_ID()
WHERE i.type_desc = 'NONCLUSTERED'
    AND OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
    AND (ius.user_seeks + ius.user_scans + ius.user_lookups = 0
         OR ius.user_seeks IS NULL)   -- never used for reads
ORDER BY TotalWrites DESC;

-- ── MSSQL: index fragmentation ────────────────────────────────────────
SELECT
    OBJECT_NAME(ps.object_id) AS TableName,
    i.name AS IndexName,
    ps.avg_fragmentation_in_percent,
    ps.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.avg_fragmentation_in_percent > 10  -- >10% → REORGANIZE; >30% → REBUILD
  AND ps.page_count > 100
ORDER BY avg_fragmentation_in_percent DESC;`,
    },
    {
      label: 'Covering indexes',
      language: 'sql',
      code: `-- ── Problem: non-covering index → Key Lookup ─────────────────────────
-- Index on CustomerID only:
-- CREATE INDEX IX_Orders_Customer ON Orders (CustomerID);

-- Query needs OrderDate and Freight — not in the index → Key Lookup per row:
SELECT OrderDate, Freight
FROM Orders
WHERE CustomerID = 'ALFKI';
-- Plan shows: Index Seek → Key Lookup (expensive for many rows)

-- ── Solution: covering index with INCLUDE ─────────────────────────────
CREATE INDEX IX_Orders_Customer_Cov
    ON Orders (CustomerID)
    INCLUDE (OrderDate, Freight);   -- columns stored at leaf level only

-- Same query: Index Seek only — no Key Lookup
SELECT OrderDate, Freight
FROM Orders
WHERE CustomerID = 'ALFKI';

-- ── Filtered index (MSSQL): only active products ──────────────────────
CREATE INDEX IX_Products_Active
    ON Products (CategoryID, UnitPrice DESC)
    WHERE Discontinued = 0;   -- index only covers active rows

-- Only queries that include WHERE Discontinued = 0 can use this index:
SELECT TOP 5 ProductID, UnitPrice
FROM Products
WHERE CategoryID = 3 AND Discontinued = 0   -- ← this filter enables the filtered index
ORDER BY UnitPrice DESC;

-- ── Composite key order matters ────────────────────────────────────────
-- Index on (A, B): can seek on A alone, or A+B together. Cannot seek on B alone.
-- Index on (B, A): can seek on B alone, or B+A together. Cannot seek on A alone.
CREATE INDEX IX_Example ON Orders (CustomerID, OrderDate);
-- ✅ WHERE CustomerID = @c                    → seek on first column
-- ✅ WHERE CustomerID = @c AND OrderDate > @d → seek on both
-- ❌ WHERE OrderDate > @d                     → scan (no CustomerID prefix)`,
    },
  ];

  challenge: Challenge = {
    title: 'Rewrite a Slow, Non-Sargable Query',
    language: 'sql',
    description: `The following query runs slowly on a large Orders table (10M rows). It has three performance problems:
<pre><code>SELECT DISTINCT CustomerID
FROM Orders
WHERE CONVERT(VARCHAR, OrderDate, 112) LIKE '2024%'
  AND ISNULL(Status, 'Pending') = 'Pending';</code></pre>
<ol>
<li>Identify all three problems</li>
<li>Rewrite the query to be sargable (OrderDate is DATETIME2; Status is VARCHAR(20) NULLable — NULL means pending)</li>
<li>Suggest what index would best support the rewritten query</li>
</ol>`,
    hints: [
      'CONVERT on OrderDate is non-sargable — replace with a date range (>= start AND < end)',
      'ISNULL(Status, ...) = ... is non-sargable — rewrite as (Status = \'Pending\' OR Status IS NULL)',
      'SELECT DISTINCT still works — keep it',
      'A covering index on (Status, OrderDate) INCLUDE (CustomerID) could eliminate both scan and key lookup',
    ],
    starterCode: `-- Problems: 1) ?, 2) ?, 3) ?

-- Rewritten (sargable):
SELECT DISTINCT CustomerID
FROM Orders
WHERE
    -- fix the date predicate
    -- fix the status predicate
;

-- Suggested index:
-- CREATE INDEX ...`,
    solution: `-- Problems:
-- 1. CONVERT(VARCHAR, OrderDate, 112) wraps the indexed column → non-sargable (full scan)
-- 2. ISNULL(Status, 'Pending') wraps the Status column → non-sargable
-- 3. (Minor) SELECT * (DISTINCT CustomerID is fine — not a problem here)

-- Rewritten:
SELECT DISTINCT CustomerID
FROM Orders
WHERE OrderDate >= '2024-01-01'
  AND OrderDate  < '2025-01-01'            -- sargable date range
  AND (Status = 'Pending' OR Status IS NULL);  -- sargable NULL check

-- Supporting index:
CREATE INDEX IX_Orders_Status_Date
    ON Orders (Status, OrderDate)
    INCLUDE (CustomerID);
-- The Status predicate and OrderDate range can be satisfied by index seeks.
-- CustomerID is in INCLUDE to avoid a Key Lookup.

-- Filtered index alternative (if most queries filter Status = 'Pending'):
CREATE INDEX IX_Orders_Pending_Date
    ON Orders (OrderDate)
    INCLUDE (CustomerID)
    WHERE Status = 'Pending' OR Status IS NULL;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In which direction do you read a SQL Server execution plan?',
      options: [
        'Left to right, top to bottom — first operator is leftmost',
        'Right to left, bottom to top — the rightmost, bottommost operator is the first data source',
        'Top to bottom only — operators are evaluated in display order',
        'The order shown is the execution order; read top to bottom',
      ],
      answer: 1,
      explanation: 'SQL Server execution plans display data flow from right (sources) to left (output). The rightmost, bottommost node is the first data source. Data flows left toward the final result. Arrow thickness indicates estimated row count — thick arrows signal high-volume movement between operators.',
    },
    {
      q: 'What does a "Key Lookup" operator in a SQL Server execution plan indicate?',
      options: [
        'The query is performing a foreign key constraint check',
        'A non-clustered index was used for seeks, but extra columns must be fetched from the clustered index per row',
        'Full-text search indexing is occurring',
        'An implicit type conversion is blocking the index seek',
      ],
      answer: 1,
      explanation: 'A Key Lookup (formerly Bookmark Lookup) happens when a non-clustered index satisfies the WHERE but the SELECT needs columns not present in that index. The engine follows the row locator back to the clustered index for each qualifying row. Eliminate it by adding the projected columns as INCLUDE columns to the non-clustered index.',
    },
    {
      q: 'STATISTICS IO shows 50,000 logical reads for a query on a 10,000-row table. What does this suggest?',
      options: [
        'The query is well-optimised — logical reads reflect memory efficiency',
        'Excessive scanning — likely a missing index, a Key Lookup per row, or a Nested Loops join that scans an inner table many times',
        'The table statistics need refreshing',
        'The table is too small to benefit from any index',
      ],
      answer: 1,
      explanation: 'A 10,000-row table fits in roughly 100–200 data pages. 50,000 logical reads means pages were read hundreds of times — typically a Nested Loops join scanning an inner table for each outer row, or a Key Lookup for every row found via an index. Adding a covering index or switching to a Hash Join would collapse this dramatically.',
    },
    {
      q: 'Why does `WHERE ISNULL(Status, \'Pending\') = \'Pending\'` cause a full scan on an indexed Status column?',
      options: [
        'ISNULL is not supported on indexed columns',
        'The function wraps the indexed column, making the predicate non-sargable — the engine evaluates ISNULL(Status, …) for every row instead of doing an index seek',
        'NULL values are not stored in non-clustered indexes',
        'String comparisons always require a full scan',
      ],
      answer: 1,
      explanation: 'Any function applied to the indexed column side of a predicate prevents the index from being used for a seek. The engine must compute ISNULL(Status, \'Pending\') for every row to compare to \'Pending\'. Fix: rewrite as (Status = \'Pending\' OR Status IS NULL) — both predicates directly reference the column and are sargable.',
    },
    {
      q: 'What is parameter sniffing in SQL Server, and why can it be harmful?',
      options: [
        'SQL Server reads query parameters from the network packet — a security vulnerability',
        'SQL Server compiles and caches a plan based on the first parameter values it sees; future calls with different values reuse that plan, even when a different plan would be optimal',
        'Statistics are sniffed from the parameter type rather than the column histogram',
        'The query plan is recompiled every time parameters change, causing excessive CPU usage',
      ],
      answer: 1,
      explanation: 'When a parameterised stored procedure or query runs for the first time, SQL Server sniffs (samples) the parameter values and compiles a plan optimised for those specific values. The plan is cached and reused. If later calls supply very different values (e.g., the first call returns 1 row, the second returns 100,000 rows), the cached plan is sub-optimal or catastrophically slow for those new values.',
    },
    {
      q: 'What is the purpose of INCLUDE columns in a non-clustered index?',
      options: [
        'They extend the B-tree interior nodes, allowing seeks on more columns',
        'They store extra column values at the leaf level only, making the index covering without increasing the B-tree depth',
        'They define partial index conditions similar to a filtered index',
        'They hint the optimiser to use that index for ORDER BY operations',
      ],
      answer: 1,
      explanation: 'Key columns in a non-clustered index are stored in the B-tree interior and leaf nodes — they enable seeks and sorts. INCLUDE columns are stored only in the leaf pages (not in the interior nodes), so they do not increase tree depth or affect seek efficiency. They allow the index to cover queries that need those columns without adding them to the seekable key portion.',
    },
    {
      q: 'Which tool/view in PostgreSQL tracks cumulative query statistics to find the most expensive queries?',
      options: [
        'pg_stat_user_tables',
        'pg_stat_statements',
        'pg_stat_activity',
        'information_schema.statistics',
      ],
      answer: 1,
      explanation: 'pg_stat_statements (enabled via shared_preload_libraries) tracks cumulative execution counts, total/mean execution time, and buffer hits/reads per unique query text. It is the go-to tool for identifying top CPU and I/O consumers in PostgreSQL. pg_stat_user_tables tracks per-table scan and tuple activity, and pg_stat_activity shows currently running queries.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between logical reads and physical reads?',
      a: 'Logical reads count all 8 KB page accesses from the buffer pool (data cache), whether the page was already in memory or had to be fetched from disk. Physical reads count only pages fetched from disk (cache miss). Optimise for <strong>logical reads</strong> — an optimised query with a warm cache has high logical reads but zero physical reads. Reducing logical reads (via better indexes) also reduces physical reads under memory pressure and makes the query faster even when the cache is cold.',
    },
    {
      q: 'How do I fix parameter sniffing without using OPTION (RECOMPILE)?',
      a: 'Three alternatives: (1) <strong>OPTIMIZE FOR UNKNOWN</strong>: <code>OPTION (OPTIMIZE FOR (@param UNKNOWN))</code> compiles the plan using average column density rather than a sniffed value — avoids the worst-case sniffed plan without recompile per call. (2) <strong>Local variable</strong>: assign the parameter to a local variable before use — SQL Server cannot sniff local variables and falls back to average statistics. (3) <strong>Query Store plan forcing</strong> (SQL Server 2016+): identify the best plan for a known good execution, then force it — <code>EXEC sys.sp_query_store_force_plan @query_id = X, @plan_id = Y</code>. Use RECOMPILE only for infrequent, high-value queries where compile overhead is negligible.',
    },
    {
      q: 'How do I find queries causing the most I/O in production?',
      a: '<strong>SQL Server</strong>: query <code>sys.dm_exec_query_stats</code> ordered by <code>total_logical_reads / execution_count DESC</code> (most I/O per call) or <code>total_logical_reads DESC</code> (most cumulative I/O). Join to <code>sys.dm_exec_sql_text</code> for the query text and <code>sys.dm_exec_query_plan</code> for the cached plan. <strong>PostgreSQL</strong>: enable <code>pg_stat_statements</code> (shared_preload_libraries) and query <code>pg_stat_statements ORDER BY (total_blks_hit + total_blks_read) DESC</code>.',
    },
    {
      q: 'What is the N+1 query problem and how do I fix it?',
      a: 'N+1 happens when code runs one query to fetch N parent records, then loops and issues one query per parent to fetch its children — N+1 total round-trips. At N=1000, this is 1001 queries with network overhead per call. Fix: use a single <code>JOIN</code> or <code>WHERE parent_id IN (@ids)</code> to load all children in one trip, then group them in application code. In ORM context: use eager loading (EF Core\'s <code>Include()</code>, SQLAlchemy\'s <code>joinedload()</code>). The JOIN approach is usually better — it uses the database\'s optimiser rather than making N round-trips.',
    },
    {
      q: 'When should I reorganise vs rebuild an index in SQL Server?',
      a: '<strong>REORGANIZE</strong>: online (does not block reads/writes), defragments leaf-level pages, suitable when fragmentation is 10–30%. Does not update statistics. <strong>REBUILD</strong>: recreates the index from scratch, fixing all fragmentation levels. Updates statistics as a side effect. By default offline (blocks reads/writes) in older SQL Server versions; use <code>WITH (ONLINE = ON)</code> for enterprise edition. Use for fragmentation &gt;30% or when statistics are very stale. In PostgreSQL: <code>REINDEX CONCURRENTLY</code> (PG 12+) rebuilds without locking — equivalent to SQL Server REBUILD WITH ONLINE.',
    },
    {
      q: 'What is a filtered index and when should I use one?',
      a: 'A filtered index includes only rows matching a WHERE clause in the index definition: <code>CREATE INDEX IX ON T (col) WHERE status = \'active\'</code>. Benefits: much smaller than a full-column index, faster to scan, lower write overhead (only maintained for matching rows), and can enable very selective seeks for common filter patterns. Use when: (1) a large fraction of rows have a common exclusion value (soft-deletes, completed status); (2) a common query always includes a specific WHERE predicate; (3) you want a unique index over a subset of rows (<code>WHERE deleted_at IS NULL</code>). The query\'s WHERE clause must include the filter predicate for SQL Server to use the filtered index.',
    },
    {
      q: 'How does EXPLAIN ANALYZE differ from EXPLAIN in PostgreSQL?',
      a: '<code>EXPLAIN</code> estimates costs, row counts, and plan shape without executing the query — safe to run on any query including INSERT/UPDATE/DELETE. <code>EXPLAIN ANALYZE</code> <strong>actually executes</strong> the query and reports actual rows, actual timing, and loop counts alongside estimates — dangerous for DML (it modifies data; wrap in a transaction and ROLLBACK). Add <code>BUFFERS</code> to also see shared_hit (buffer cache) and shared_read (disk) page counts — the key I/O metric. The difference between estimated and actual rows in EXPLAIN ANALYZE is your primary diagnostic for stale statistics.',
    },
  ];
}
