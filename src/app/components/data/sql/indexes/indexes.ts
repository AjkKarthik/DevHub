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
  selector: 'app-sql-indexes',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './indexes.html',
  styleUrl: './indexes.scss',
})
export class SqlIndexes {

  quickRef: QuickRefItem[] = [
    { name: 'Clustered index',      type: 'keyword', desc: 'Defines physical row order; one per table; MSSQL default is PK; determines B-tree leaf = data rows', since: 'MSSQL / PG' },
    { name: 'Non-clustered index',  type: 'keyword', desc: 'Separate B-tree with pointers to data rows; many per table; leaf = key + row locator', since: 'MSSQL / PG' },
    { name: 'INCLUDE (cols)',        type: 'syntax',  desc: 'Add columns to leaf level only (not key) for covering indexes without widening the B-tree', since: 'MSSQL 2005 / PG 11' },
    { name: 'Filtered / Partial index', type: 'syntax', desc: 'MSSQL: CREATE INDEX … WHERE clause; PG: same syntax. Covers only matching rows — smaller and faster', since: 'MSSQL 2008 / PG 8.3' },
    { name: 'Composite index',       type: 'syntax',  desc: 'Multi-column index; column order determines which query shapes can seek into the index', since: 'MSSQL / PG' },
    { name: 'Covering index',        type: 'keyword', desc: 'Index contains all columns the query needs — eliminates key lookups and enables index-only scans', since: 'MSSQL / PG' },
    { name: 'Unique index',          type: 'keyword', desc: 'Enforces uniqueness at the index level; created implicitly by UNIQUE constraint and PK', since: 'MSSQL / PG' },
    { name: 'GIN / GiST',           type: 'keyword', desc: 'PG specialised index types for JSONB/arrays (GIN) and geometric/full-text (GiST)', since: 'PostgreSQL' },
    { name: 'BRIN',                  type: 'keyword', desc: 'PG Block Range INdex — very small index for naturally ordered columns (timestamps, serial IDs)', since: 'PG 9.5' },
    { name: 'Hash index',            type: 'keyword', desc: 'O(1) equality seeks; does NOT support range queries or sorting. PG: crash-safe from PG 10+', since: 'PG 10 / MSSQL limited' },
    { name: 'Fill factor',           type: 'keyword', desc: 'MSSQL: % of each page left full at build time; lower = more inserts before page splits', since: 'MSSQL' },
    { name: 'Index seek',            type: 'syntax',  desc: 'Root→leaf traversal; requires sargable predicate; very fast for selective queries', since: 'MSSQL / PG' },
    { name: 'Key lookup / RID',      type: 'syntax',  desc: 'Lookup from non-clustered index to clustered row; appears when index doesn\'t cover query', since: 'MSSQL' },
    { name: 'Sargable',             type: 'keyword', desc: 'Predicate that can drive an index seek — column must be bare (no functions, no implicit casts)', since: 'General' },
    { name: 'sys.dm_db_index_usage_stats', type: 'method', desc: 'MSSQL DMV: tracks seek/scan/lookup counts per index since last restart — use to find unused indexes', since: 'SQL Server 2005' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Clustered vs non-clustered indexes — structure and tradeoffs',
      points: [
        'A <strong>clustered index</strong> determines the physical storage order of table rows on disk. The B-tree\'s leaf pages ARE the data rows — there is no separate data store. Only one clustered index is allowed per table because the data can only be physically sorted one way. SQL Server creates a clustered index on the primary key by default; PostgreSQL uses a <em>heap</em> table by default (no physical ordering) with <code>CLUSTER</code> as a one-time reorder.',
        'A <strong>non-clustered index</strong> is a separate B-tree. Its leaf pages contain the indexed key columns plus a row locator — on a clustered table, that locator is the clustered key value (not a physical address). This means the clustered key should be <strong>narrow</strong> (INT/BIGINT), <strong>unique</strong>, and <strong>ever-increasing</strong> (IDENTITY, SEQUENCE) to avoid row locator widening and insertion hotspot fragmentation.',
        'A <strong>heap</strong> is a table with no clustered index. Rows are stored in insertion order; non-clustered lookups use physical Row ID (RID) pointers. Heaps are fine for staging tables that receive bulk inserts and are fully scanned, but suffer from forwarding records after UPDATE operations grow a row beyond its page space.',
        'PostgreSQL every table is a heap by default. All indexes — including the primary key — are non-clustered B-trees pointing back into the heap via physical tuple IDs (TID). There is no equivalent of MSSQL\'s clustered index at the storage engine level (partitioned and BRIN indexes are the nearest analogues for access-pattern locality).',
        'The practical rule for MSSQL: always create a clustered index on the natural surrogate key (INT IDENTITY or BIGINT). Avoid wide composite clustered indexes — every non-clustered index must carry the clustered key as its row locator, multiplying storage cost proportionally to the key\'s byte width.',
      ],
    },
    {
      heading: 'Composite index design — column order rules',
      points: [
        'A composite index on <code>(A, B, C)</code> supports seeks on the prefix: <code>A</code>, <code>(A, B)</code>, and <code>(A, B, C)</code>. It does NOT support seeks on <code>B</code> alone or <code>(A, C)</code> skipping B. This is called the <strong>leftmost prefix rule</strong>. Design composite indexes by listing the most common equality-predicate columns first.',
        'Column ordering strategy: put high-selectivity <strong>equality</strong> columns first (they eliminate the most rows), then additional <strong>equality</strong> columns, then the <strong>range</strong> column last. A range column in the key means all subsequent key columns become non-seekable for that range (the B-tree traversal fans out at the range boundary).',
        'Avoid putting range columns in the middle of a composite key. Example: <code>(CustomerID, OrderDate, Status)</code> — after seeking CustomerID and ranging on OrderDate, the Status predicate can only be applied as a residual filter on the scanned rows, not as a seek. Better: <code>(CustomerID, Status, OrderDate)</code> if Status is an equality predicate.',
        '<strong>Index selectivity</strong>: a column with few distinct values (e.g., Status IN (\'Shipped\',\'Pending\')) has low selectivity — fewer rows eliminated per step. High-selectivity columns (CustomerID, email) eliminate more rows. As a tie-breaker between two equality columns of similar importance, put the higher-selectivity one first.',
        'Cover your ORDER BY / GROUP BY clause where possible: if the trailing index key matches the ORDER BY direction, the engine can avoid a Sort operator entirely — the rows arrive pre-sorted. Example: <code>CREATE INDEX IX ON Orders (CustomerID, OrderDate DESC)</code> eliminates the sort for <code>WHERE CustomerID = @c ORDER BY OrderDate DESC</code>.',
      ],
    },
    {
      heading: 'Covering indexes and INCLUDE columns',
      points: [
        'A query is <strong>covered</strong> when the index contains all columns needed by the query — both the filter/join columns (key) and the SELECT/OUTPUT columns. The engine never touches the data rows (no key lookup), enabling an <strong>index-only scan</strong>. This can reduce I/O by an order of magnitude for selective queries on wide tables.',
        'In SQL Server, use <code>INCLUDE(col1, col2)</code> to add non-key columns to the leaf level of a non-clustered index. They are stored only at the leaf (not the B-tree interior), so the key stays narrow for seeks while the leaf carries the extra payload for covering. INCLUDE columns cannot be used in seeks or used to eliminate sorts — only to avoid lookups.',
        'The <strong>key lookup</strong> operator (or RID lookup) in a SQL Server execution plan is the signal that the index does not cover the query. Look at the "Output List" of the lookup operator to find the missing columns — add them to INCLUDE.',
        'PostgreSQL supports <code>CREATE INDEX … INCLUDE (col)</code> syntax (since PG 11) for <strong>index-only scans</strong>. Before PG 11, the workaround was to add columns to the key itself (functional indexes). PostgreSQL requires the heap tuple\'s visibility map to indicate the page is all-visible before it can return an index-only scan result — <code>VACUUM</code> is needed to keep the visibility map current.',
        'Beware of over-INCLUDEing: including wide columns (NVARCHAR(MAX), image) bloats leaf pages, increases index size, slows scans, and hurts buffer pool efficiency. Include only the columns that are actually selected or appear in the SELECT list of the most important queries.',
      ],
    },
    {
      heading: 'Sargability — predicates that can drive an index seek',
      points: [
        'A predicate is <strong>sargable</strong> (Search ARGument ABLE) when the SQL engine can translate it into a B-tree range scan without evaluating an expression on every row. The fundamental rule: the <strong>indexed column must appear bare on one side of the comparison</strong> — no function calls, no arithmetic, no implicit type conversions wrapping the column.',
        'Non-sargable patterns and their fixes: <code>WHERE YEAR(OrderDate) = 2024</code> → use <code>WHERE OrderDate >= \'2024-01-01\' AND OrderDate < \'2025-01-01\'</code>. <code>WHERE LEN(description) > 100</code> → no fix; consider a persisted computed column. <code>WHERE col + 10 > @val</code> → rewrite as <code>WHERE col > @val - 10</code>.',
        '<strong>Implicit type conversion</strong> is a hidden sargability killer. If a VARCHAR column is compared to an integer literal (<code>WHERE AccountCode = 123</code>), the engine implicitly converts AccountCode to INT for every row. Always match types in comparisons — use string literals for VARCHAR columns: <code>WHERE AccountCode = \'123\'</code>.',
        '<code>LIKE \'%suffix\'</code> is always non-sargable (leading wildcard forces a full scan). <code>LIKE \'prefix%\'</code> is sargable and uses a range index scan between <code>\'prefix\'</code> and <code>\'prefiy\'</code> (next character). For full-text prefix/suffix searches, consider Full-Text Indexing (MSSQL FTS or PostgreSQL tsvector/tsquery).',
        '<code>IS NULL</code> can be sargable in SQL Server if <code>SET ANSI_NULLS ON</code> and the index allows NULLs (which it does by default). <code>NOT IN</code> and <code>!=</code>/<code><></code> are sargable for range scans but have low selectivity and often cause full scans due to poor cardinality estimates when many rows qualify. Use <code>NOT EXISTS</code> instead of <code>NOT IN</code> to avoid NULL traps and enable better plans.',
      ],
    },
    {
      heading: 'Filtered / partial indexes and special index types',
      points: [
        'A <strong>filtered index</strong> (MSSQL) / <strong>partial index</strong> (PostgreSQL) indexes only rows that match a WHERE clause: <code>CREATE INDEX IX_Orders_Active ON Orders (CustomerID, OrderDate) WHERE Status = \'Active\'</code>. The index is smaller, faster to build, cheaper to maintain, and produces more accurate statistics — it only competes with active rows. Ideal for "hot" subsets of large tables.',
        'Filtered indexes in MSSQL require the query\'s WHERE clause to match or imply the filter predicate — the optimiser will use the filtered index only when it can prove the filter is always satisfied for the rows returned. A partial index in PostgreSQL works the same way — the query planner uses it when the query includes the predicate.',
        'A <strong>unique index</strong> enforces uniqueness at the index level and is created implicitly by PRIMARY KEY and UNIQUE constraints. You can create one explicitly — <code>CREATE UNIQUE INDEX IX ON t (email)</code> — for the same enforcement. Unique indexes can include NULLs (multiple NULLs are allowed in most DBs since NULL ≠ NULL), unless the column is NOT NULL.',
        'PostgreSQL-specific special index types: <strong>GIN</strong> (Generalised Inverted Index) for JSONB, arrays, and full-text; <strong>GiST</strong> for geometric types, nearest-neighbour, and range types; <strong>BRIN</strong> (Block Range INdex) for huge, naturally-ordered tables (time-series log tables) — extremely small (a few pages) but only useful when the physical row order correlates with the query predicate; <strong>Hash</strong> for equality-only lookups (not range, no sort, crash-safe since PG 10).',
        'SQL Server\'s <strong>columnstore index</strong> stores data in column-compressed segments rather than rows — suited for analytical queries that scan a few columns across millions of rows. A non-clustered columnstore index on an OLTP table enables batch-mode execution for reporting queries while the clustered B-tree handles OLTP access. Compression ratios of 5–10× are common on numeric/date columns.',
      ],
    },
    {
      heading: 'Index maintenance — fragmentation, fill factor, statistics',
      points: [
        '<strong>Fragmentation</strong> accumulates when page splits occur during INSERT/UPDATE operations — a full page must be split, leaving two half-empty pages and causing logical ordering to diverge from physical ordering. This increases read I/O. Monitor with <code>sys.dm_db_index_physical_stats</code>. Rule of thumb: < 10% — no action; 10–30% — <code>ALTER INDEX … REORGANIZE</code> (online, defragments leaf pages in place); > 30% — <code>ALTER INDEX … REBUILD</code> (recreates the index, offline by default, or online with Enterprise edition).',
        '<strong>Fill factor</strong> controls what percentage of each B-tree leaf page is filled during index creation or rebuild. Default is 100% (fully packed) — optimal for read-heavy tables. A fill factor of 80% leaves 20% free space per page, delaying future splits on write-heavy tables. Set lower fill factors only on hot indexes with frequent random inserts; leaving too much slack wastes buffer pool.',
        '<strong>Statistics</strong> are histograms the optimiser uses to estimate row counts for each predicate (cardinality estimation). Stale statistics lead to poor plan choices — wrong join order, wrong index, incorrect memory grant. Statistics update automatically when > 20% of rows change (auto-update statistics is on by default). Force a manual update with <code>UPDATE STATISTICS tablename WITH FULLSCAN</code> after large bulk loads.',
        '<strong>Unused indexes</strong> cost write overhead on every INSERT/UPDATE/DELETE without providing read benefit. Query <code>sys.dm_db_index_usage_stats</code> for <code>user_seeks = 0</code> and <code>user_lookups = 0</code> since the last SQL Server restart — candidates for removal. Note: the DMV resets on service restart, so monitor over multiple weeks. PostgreSQL equivalent: <code>pg_stat_user_indexes</code>.',
        'PostgreSQL maintenance: <code>VACUUM</code> reclaims dead tuple space and updates the visibility map (needed for index-only scans). <code>VACUUM ANALYZE</code> also refreshes statistics. <code>autovacuum</code> runs automatically but may lag on high-churn tables — tune <code>autovacuum_vacuum_scale_factor</code> and <code>autovacuum_analyze_scale_factor</code> for hot tables. <code>REINDEX INDEX name</code> (or <code>REINDEX CONCURRENTLY</code> since PG 12) rebuilds a bloated index.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CREATE INDEX — basics',
      language: 'sql',
      code: `-- Non-clustered on a single column
CREATE INDEX IX_Orders_CustomerID
    ON Orders (CustomerID);

-- Composite: CustomerID equality first, then range column OrderDate
CREATE INDEX IX_Orders_Customer_Date
    ON Orders (CustomerID, OrderDate DESC);

-- Covering index: key for seeks, INCLUDE for SELECT columns (no key lookup)
CREATE INDEX IX_Orders_Covering
    ON Orders (CustomerID, Status, OrderDate DESC)
    INCLUDE (Freight, ShipCity);

-- Unique index (alternative to UNIQUE constraint — same B-tree)
CREATE UNIQUE INDEX IX_Customers_Email
    ON Customers (Email);

-- Filtered index: only active rows — smaller, faster, better statistics
CREATE INDEX IX_Orders_ActiveByCustomer
    ON Orders (CustomerID, OrderDate DESC)
    WHERE Status = 'Active';

-- PostgreSQL GIN index for JSONB containment queries
CREATE INDEX IX_Events_Payload ON Events USING GIN (Payload);

-- PostgreSQL partial index (equivalent to filtered)
CREATE INDEX IX_Orders_Pending
    ON orders (customer_id, created_at DESC)
    WHERE status = 'pending';`,
    },
    {
      label: 'Composite key design',
      language: 'sql',
      code: `-- ── How column order affects which queries can seek ───────────────────
-- Index: (A, B, C)   ← A first, C last
CREATE INDEX IX_Demo ON T (CustomerID, Status, OrderDate DESC);

-- ✅ SEEK on (CustomerID):        WHERE CustomerID = @c
-- ✅ SEEK on (CustomerID, Status): WHERE CustomerID = @c AND Status = 'Active'
-- ✅ SEEK on all 3:               WHERE CustomerID = @c AND Status = 'Active' AND OrderDate >= '2024-01-01'
-- ❌ Cannot seek on Status alone: WHERE Status = 'Active'   ← no prefix match
-- ❌ Skipping B:                  WHERE CustomerID = @c AND OrderDate >= '2024-01-01'
--    (OrderDate seek not possible without Status equality first)

-- ── Equality-then-range: range column must be LAST ────────────────────
-- BAD — range in the middle blocks Status seek:
CREATE INDEX IX_Bad ON Orders (CustomerID, OrderDate, Status);
--   WHERE CustomerID = @c AND Status = 'X' AND OrderDate >= '2024-01-01'
--   Result: seeks (CustomerID), ranges OrderDate, FILTERS Status (not a seek)

-- GOOD — equality predicates before range:
CREATE INDEX IX_Good ON Orders (CustomerID, Status, OrderDate DESC)
    INCLUDE (Freight);
--   WHERE CustomerID = @c AND Status = 'Shipped' AND OrderDate >= '2024-01-01'
--   Seek on (CustomerID, Status), then range-scan OrderDate DESC ✅

-- ── ORDER BY elimination ──────────────────────────────────────────────
-- Query: WHERE CustomerID = @c ORDER BY OrderDate DESC
-- Index: (CustomerID, OrderDate DESC) — engine delivers rows already sorted
-- No Sort operator needed in the execution plan.
SELECT OrderID, OrderDate, Freight
FROM Orders
WHERE CustomerID = 'ALFKI'
ORDER BY OrderDate DESC;
-- Uses IX_Good above with no additional Sort step`,
    },
    {
      label: 'Sargability examples',
      language: 'sql',
      code: `-- ══ Non-sargable → sargable rewrites ════════════════════════════════

-- ❌ Function on indexed column
WHERE YEAR(OrderDate) = 2024
-- ✅ Range on bare column:
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'

-- ❌ DATEADD wrapping the column
WHERE DATEADD(DAY, 30, ShipDate) < GETDATE()
-- ✅ Rewrite to isolate the column:
WHERE ShipDate < DATEADD(DAY, -30, GETDATE())

-- ❌ Implicit type conversion: AccountCode is VARCHAR, @id is INT
WHERE AccountCode = @id         -- casts AccountCode to INT for every row
-- ✅ Use matching type:
WHERE AccountCode = CAST(@id AS VARCHAR(20))

-- ❌ LIKE with leading wildcard
WHERE ProductName LIKE '%bike%'  -- full scan
-- ✅ Leading prefix only (sargable range scan):
WHERE ProductName LIKE 'bike%'

-- ❌ Arithmetic on the column
WHERE UnitPrice * 1.1 > 100
-- ✅ Isolate column:
WHERE UnitPrice > 100 / 1.1

-- ══ Check implicit conversions in execution plan ═══════════════════
-- SQL Server: look for "IMPLICIT CONVERT" warning in plan XML
-- Query sys.dm_exec_query_stats + sys.dm_exec_sql_text for plans with conversions:
SELECT TOP 20
    qs.total_logical_reads / qs.execution_count AS avg_reads,
    SUBSTRING(qt.text, 1, 200) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_reads DESC;`,
    },
    {
      label: 'Execution plans',
      language: 'sql',
      code: `-- ── SQL Server: view plan and I/O stats ───────────────────────────────
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT o.OrderID, o.OrderDate, c.CompanyName
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
WHERE o.CustomerID = 'ALFKI'
  AND o.OrderDate >= '2024-01-01';

-- Read the messages pane:
-- "logical reads": number of 8KB pages read from buffer cache — minimize this
-- A key lookup appears as a separate "Table 'Orders'" entry with high logical reads

-- ── Identify key lookup from a non-clustered index ────────────────────
-- Look for: Non-Clustered Index Seek + Key Lookup (Clustered) in plan
-- The Key Lookup "Output List" shows which columns are missing from the index
-- Fix: add those columns to INCLUDE

-- ── PostgreSQL: EXPLAIN ANALYZE ───────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.order_id, c.company_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.customer_id = 'ALFKI'
  AND o.order_date >= '2024-01-01';

-- Key output lines:
-- "Index Scan using IX_orders_customer on orders" → index is used
-- "Index Only Scan" → covering index; check "Heap Fetches: 0" (visibility map current)
-- "Seq Scan on orders" → no index used; add one or check if selectivity is too low
-- "Buffers: shared hit=N read=M" → hit=cache, read=disk I/O`,
    },
    {
      label: 'Maintenance',
      language: 'sql',
      code: `-- ── Check fragmentation (SQL Server) ─────────────────────────────────
SELECT
    OBJECT_NAME(ips.object_id)       AS TableName,
    i.name                           AS IndexName,
    ips.avg_fragmentation_in_percent AS Fragmentation,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 5
  AND ips.page_count > 1000          -- ignore tiny indexes
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- Reorganize (online, < 30% fragmentation)
ALTER INDEX IX_Orders_CustomerID ON Orders REORGANIZE;

-- Rebuild (offline by default, resets fill factor, > 30%)
ALTER INDEX IX_Orders_CustomerID ON Orders REBUILD WITH (ONLINE = ON, FILLFACTOR = 85);

-- Rebuild all indexes on a table
ALTER INDEX ALL ON Orders REBUILD;

-- ── Find unused indexes ────────────────────────────────────────────────
SELECT
    OBJECT_NAME(i.object_id)   AS TableName,
    i.name                     AS IndexName,
    COALESCE(us.user_seeks,0)  AS Seeks,
    COALESCE(us.user_scans,0)  AS Scans,
    COALESCE(us.user_updates,0)AS Updates   -- write overhead!
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats us
    ON  i.object_id = us.object_id
    AND i.index_id  = us.index_id
    AND us.database_id = DB_ID()
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
  AND i.index_id > 1                    -- skip clustered
  AND COALESCE(us.user_seeks, 0) = 0
  AND COALESCE(us.user_scans, 0) = 0
ORDER BY COALESCE(us.user_updates, 0) DESC;  -- high update cost = expensive unused index

-- ── Update statistics after bulk load ─────────────────────────────────
UPDATE STATISTICS Orders WITH FULLSCAN;   -- full scan, most accurate
UPDATE STATISTICS Orders;                  -- sampled (faster, less accurate)

-- ── PostgreSQL ─────────────────────────────────────────────────────────
VACUUM ANALYZE orders;                    -- reclaim space + update stats + visibility map
REINDEX INDEX CONCURRENTLY IX_orders_customer;   -- online rebuild (PG 12+)

SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0                        -- never used since stats reset
  AND relname = 'orders';`,
    },
    {
      label: 'PostgreSQL special indexes',
      language: 'sql',
      code: `-- ── Hash index — equality only, very fast, no range support ───────────
CREATE INDEX IX_customers_email_hash ON customers USING HASH (email);
-- ✅ WHERE email = 'x@y.com'     -- O(1) lookup
-- ❌ WHERE email LIKE 'a%'       -- not supported
-- ❌ ORDER BY email               -- not supported (no ordering in hash)
-- Note: crash-safe since PG 10; smaller than B-tree for equality-only workloads

-- ── BRIN — Block Range INdex (huge time-series tables) ────────────────
CREATE INDEX IX_logs_timestamp ON event_logs USING BRIN (created_at);
-- Only useful when physical row order correlates with the column (natural inserts)
-- Index is a few pages regardless of table size — stores min/max per block range
-- Very fast for time-range queries on append-only tables (logs, IoT data, audit)
-- Not useful on randomly ordered data

-- ── GiST — geometric/range types ──────────────────────────────────────
CREATE INDEX IX_rooms_during ON bookings USING GIST (during);  -- tsrange column
-- Supports overlap (&&), containment (@>, <@), exclusion constraints:
ALTER TABLE bookings ADD CONSTRAINT no_overlap
    EXCLUDE USING GIST (room_id WITH =, during WITH &&);  -- prevent double-booking

-- ── Expression (functional) index ─────────────────────────────────────
CREATE INDEX IX_customers_email_lower ON customers (LOWER(email));
-- ✅ WHERE LOWER(email) = LOWER('User@Example.com')   -- uses index
-- The query expression must match exactly

-- ── Covering via INCLUDE (PG 11+) ─────────────────────────────────────
CREATE INDEX IX_orders_customer_cover
    ON orders (customer_id, order_date DESC)
    INCLUDE (freight, ship_city);
-- Enable index-only scans; ensure VACUUM keeps visibility map current`,
    },
  ];

  challenge: Challenge = {
    title: 'Design Indexes for a Query',
    language: 'sql',
    description: `Given this slow query on the Orders table (OrderID PK, CustomerID, OrderDate, Status, ShipCountry, Freight):
<pre><code>SELECT CustomerID, OrderDate, Freight
FROM Orders
WHERE CustomerID = @cid
  AND Status = 'Shipped'
  AND OrderDate >= '2024-01-01'
ORDER BY OrderDate DESC;</code></pre>
<ol>
<li>Write a <code>CREATE INDEX</code> that allows an efficient seek and covers the query (no key lookup)</li>
<li>Explain why you chose that column order</li>
<li>Write a second filtered index for a query that always filters <code>Status = 'Shipped'</code></li>
</ol>`,
    hints: [
      'Equality columns first (CustomerID = @cid, Status = \'Shipped\'), range column last (OrderDate >= …)',
      'INCLUDE Freight — it appears in SELECT but not WHERE; widening the key wastes B-tree interior space',
      'Filtered index only indexes rows WHERE Status = \'Shipped\' — smaller, faster, and cheaper to maintain',
      'Match ORDER BY direction in the key (OrderDate DESC) to avoid a Sort operator',
    ],
    starterCode: `-- 1. Covering composite index
CREATE INDEX IX_Orders_CustomerStatus_Date
    ON Orders (
        -- equality columns first, range last
    )
    INCLUDE (
        -- SELECT columns not in WHERE
    );

-- 2. Filtered (subset-only) index
CREATE INDEX IX_Orders_Shipped
    ON Orders (
        -- ...
    )
    WHERE -- ...;`,
    solution: `-- 1. Covering composite index
CREATE INDEX IX_Orders_CustomerStatus_Date
    ON Orders (CustomerID, Status, OrderDate DESC)
    INCLUDE (Freight);
-- Why this order:
--   CustomerID: highest-selectivity equality — seeks to the right customer
--   Status: second equality ('Shipped') — narrows to shipped orders only
--   OrderDate DESC: range last — seek on (CustomerID, Status), then range-scan
--     descending (eliminates Sort operator)
--   INCLUDE Freight: needed in SELECT; adding to INCLUDE avoids a key lookup
--     without widening the B-tree interior pages

-- 2. Filtered index — only Shipped rows (smaller, better cardinality estimates)
CREATE INDEX IX_Orders_Shipped
    ON Orders (CustomerID, OrderDate DESC)
    INCLUDE (Freight)
    WHERE Status = 'Shipped';
-- Index is ~(1/n) the size of a full-table index if n statuses exist
-- Statistics are specific to Shipped rows — cardinality estimates are accurate
-- The query's WHERE Status = 'Shipped' satisfies the filter predicate, so
-- the optimiser can choose this index automatically`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How many clustered indexes can a table have?',
      options: ['Unlimited', '1', '2', 'Up to 999'],
      answer: 1,
      explanation: 'A table can have exactly one clustered index because the clustered index defines the physical row order on disk — there is only one physical order. All non-clustered indexes carry the clustered key as their row locator.',
    },
    {
      q: 'Given an index on (A, B, C), which WHERE clause can use an index seek?',
      options: [
        'WHERE B = 1 AND C = 2',
        'WHERE A = 1 AND C = 2 (skipping B)',
        'WHERE A = 1 AND B = 2',
        'None — composite indexes always force a scan',
      ],
      answer: 2,
      explanation: 'A composite index supports seeks only on leftmost prefixes: A alone, (A, B), or (A, B, C). WHERE A = 1 AND B = 2 can seek on both A and B. WHERE B = 1 skips A — no prefix match. WHERE A = 1 AND C = 2 skips B — the engine can seek on A then must scan for C as a residual filter.',
    },
    {
      q: 'What does the INCLUDE clause in CREATE INDEX do?',
      options: [
        'Adds columns to the B-tree key, affecting sort order and seek eligibility',
        'Adds columns to the leaf level only — covers SELECT lists without widening the B-tree key',
        'Creates a partial index filtered by those columns',
        'Sets the fill factor for the index pages',
      ],
      answer: 1,
      explanation: 'INCLUDE adds non-key columns only to the leaf pages of the non-clustered index. They can be returned directly without a key lookup, making the index covering — while the key stays narrow for efficient seeks. INCLUDE columns cannot be used in predicates or ORDER BY elimination.',
    },
    {
      q: 'Why is WHERE YEAR(OrderDate) = 2024 non-sargable?',
      options: [
        'YEAR() is not a valid SQL function',
        'Applying YEAR() to OrderDate forces evaluation for every row — the engine cannot use an index seek',
        'SQL cannot seek on date columns',
        'Non-sargable only applies to string predicates',
      ],
      answer: 1,
      explanation: 'Non-sargable predicates wrap the indexed column in a function. The engine must compute YEAR(OrderDate) for every row — it cannot look up the value in the B-tree. Rewrite as: WHERE OrderDate >= \'2024-01-01\' AND OrderDate < \'2025-01-01\' to leave the column bare and enable a range seek.',
    },
    {
      q: 'What is the main advantage of a filtered / partial index?',
      options: [
        'It allows indexing more than 16 columns',
        'It covers only rows that match the WHERE clause — smaller index, lower maintenance cost, and more accurate statistics for that subset',
        'It automatically applies to all queries, regardless of their WHERE clause',
        'It replaces the need for a clustered index',
      ],
      answer: 1,
      explanation: 'A filtered (MSSQL) or partial (PostgreSQL) index stores only rows matching the filter predicate. The result: a smaller, faster index with statistics specific to that subset. The optimiser uses it only when the query\'s WHERE clause implies the filter predicate. Ideal for "active", "pending", or "non-NULL" subsets of large tables.',
    },
    {
      q: 'When should you REORGANIZE vs REBUILD an index in SQL Server?',
      options: [
        'REORGANIZE for fragmentation > 30%; REBUILD for < 10%',
        'REORGANIZE for 10–30% fragmentation (online, lightweight); REBUILD for > 30% (offline by default, resets fill factor)',
        'They are equivalent — either works at any fragmentation level',
        'REBUILD is always preferred because it is faster',
      ],
      answer: 1,
      explanation: 'REORGANIZE defragments leaf pages in-place and is always online — use it for 10–30% fragmentation. REBUILD recreates the index from scratch, resets fill factor, and reclaims all wasted space — use it for > 30% fragmentation. By default REBUILD is offline (locks the table) unless ONLINE = ON (Enterprise edition).',
    },
    {
      q: 'What is a BRIN index in PostgreSQL best suited for?',
      options: [
        'Equality lookups on high-cardinality columns like email or UUID',
        'JSONB containment and key-existence queries',
        'Huge, append-only tables where physical row order correlates with the query column (e.g., timestamp logs)',
        'Preventing double-booking using exclusion constraints',
      ],
      answer: 2,
      explanation: 'BRIN (Block Range INdex) stores min/max per block range rather than per row — the index is tiny regardless of table size. It is only effective when physical storage order correlates with the indexed column: append-only time-series tables, log tables, or tables with a SEQUENCE primary key. On randomly ordered data, BRIN is useless.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find which indexes are missing for a slow query?',
      a: 'In SQL Server, run the query in SSMS with "Include Actual Execution Plan" enabled — the plan will show a green "Missing Index (Impact %)" hint on the operator. Alternatively, query <code>sys.dm_db_missing_index_details</code> joined with <code>sys.dm_db_missing_index_group_stats</code> to see accumulated suggestions across recent queries (sorted by impact). In PostgreSQL, run <code>EXPLAIN ANALYZE</code> — a "Seq Scan" on a large table with a filter condition suggests a missing index.',
    },
    {
      q: 'Should every foreign key column have an index?',
      a: 'Yes, in most cases. SQL Server does not create an index on FK columns automatically. When you JOIN on an FK, delete a parent row (the engine scans the child table to check referential integrity), or run cascade operations — without an index the engine does a full table scan on the child table. Create a non-clustered index on every FK column unless the table is tiny or the FK column is already part of a composite index that starts with it.',
    },
    {
      q: 'What is index fragmentation and when should I worry about it?',
      a: 'Fragmentation occurs when page splits fill pages only partially and logical index order diverges from physical disk order, increasing I/O for range scans. General rule: < 10% — do nothing; 10–30% — <code>ALTER INDEX … REORGANIZE</code> (online, incremental, no downtime); > 30% — <code>ALTER INDEX … REBUILD</code> (recreates the index, requires ONLINE = ON for zero-downtime on Enterprise). Small tables (< 1,000 pages) are rarely worth defragmenting — the overhead of rebuilding exceeds the I/O savings.',
    },
    {
      q: 'Can I create an index on a computed / expression column?',
      a: 'In SQL Server: create a <em>persisted</em> computed column, then index it normally — <code>ALTER TABLE t ADD EmailUpper AS UPPER(email) PERSISTED; CREATE INDEX IX ON t(EmailUpper);</code>. Without PERSISTED, the computed column is recalculated per row and cannot be indexed. In PostgreSQL: expression indexes are supported directly without a separate column — <code>CREATE INDEX ON t (LOWER(email));</code>. The query must use the exact same expression for the planner to choose the index.',
    },
    {
      q: 'How do I decide between a composite index and two separate single-column indexes?',
      a: 'The optimiser can sometimes combine two single-column indexes (index intersection / bitmap-AND in PostgreSQL), but a well-designed composite index is always more efficient for queries that filter on multiple columns — it eliminates more rows in a single seek step and may cover the query. Use a composite index when: (a) you have a common query pattern that filters on column A then column B; (b) ORDER BY can be satisfied by the trailing key. Single-column indexes are simpler and support more query variations — good as a complement but not a replacement for composite indexes on high-frequency multi-predicate queries.',
    },
    {
      q: 'What is a covering index and how does it eliminate key lookups?',
      a: 'A covering index contains all columns the query needs — key columns for seeks/filters plus INCLUDE columns for SELECT/ORDER BY output. When the index covers the query, the engine returns results from the index leaf pages alone without fetching the base table rows (no key lookup or RID lookup). In SQL Server, a key lookup (or RID lookup) in the execution plan is the indicator that the index is not covering — identify the "Output List" of the lookup operator and add those columns to INCLUDE. In PostgreSQL, an index-only scan signals coverage; check "Heap Fetches: 0" to confirm the visibility map is current.',
    },
    {
      q: 'What happens to an index when I run bulk INSERT or large UPDATE?',
      a: 'Every INSERT/UPDATE/DELETE must update all indexes on the table — the more indexes, the slower the write. For large bulk loads, it is often faster to drop non-clustered indexes first, load the data, then rebuild the indexes in one pass (REBUILD is set-based and much faster than incremental insert-level maintenance). SQL Server also supports disabling non-clustered indexes (<code>ALTER INDEX IX ON t DISABLE</code>) before a bulk load and enabling them (<code>REBUILD</code>) afterwards. Additionally, statistics become stale after large data changes — run <code>UPDATE STATISTICS tablename WITH FULLSCAN</code> after a bulk load to ensure the optimiser has accurate cardinality estimates.',
    },
  ];
}
