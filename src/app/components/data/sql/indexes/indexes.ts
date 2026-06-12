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
    { name: 'Clustered index',      type: 'keyword', desc: 'Defines the physical row order of the table; one per table; default is the PK', since: 'MSSQL / PG' },
    { name: 'Non-clustered index',  type: 'keyword', desc: 'Separate B-tree structure with pointers back to data rows; many allowed per table', since: 'MSSQL / PG' },
    { name: 'Covering index',       type: 'syntax',  desc: 'Includes all columns a query needs, avoiding a key lookup; use INCLUDE(cols) in MSSQL', since: 'MSSQL 2005' },
    { name: 'Composite index',      type: 'syntax',  desc: 'Index on multiple columns; column order matters for seek eligibility', since: 'MSSQL / PG' },
    { name: 'Filtered index',       type: 'syntax',  desc: 'Index on a subset of rows (WHERE clause on CREATE INDEX)', since: 'MSSQL 2008 / PG 8.3' },
    { name: 'GIN index',            type: 'keyword', desc: 'PostgreSQL generalised inverted index for JSONB, arrays, full-text', since: 'PostgreSQL' },
    { name: 'Index seek',           type: 'syntax',  desc: 'Efficient lookup via B-tree root → leaf; generated when predicate is sargable', since: 'MSSQL / PG' },
    { name: 'Index scan',           type: 'syntax',  desc: 'Reads all index leaf pages; may be chosen over seek when selectivity is low', since: 'MSSQL / PG' },
    { name: 'Table scan',           type: 'syntax',  desc: 'Reads every row; occurs when no usable index exists', since: 'MSSQL / PG' },
    { name: 'Sargable',             type: 'keyword', desc: 'Predicate that can use an index seek (no function on the indexed column)', since: 'General' },
    { name: 'Fill factor',          type: 'keyword', desc: 'MSSQL: percentage of each page left full at create time; leaves room for inserts', since: 'MSSQL' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Clustered vs non-clustered indexes',
      points: [
        'A <strong>clustered index</strong> determines the physical storage order of table rows. There can be only one per table because the data can only be sorted one way. SQL Server creates a clustered index on the primary key by default.',
        'A <strong>non-clustered index</strong> is a separate B-tree structure containing a copy of the indexed columns plus a pointer (row locator) back to the actual data row. A table can have many non-clustered indexes (up to 999 in SQL Server).',
        'On a clustered table, non-clustered row locators are the clustered key value — not a physical address — so the clustered key should be narrow (int/bigint), unique, and ever-increasing to avoid fragmentation.',
        'A heap (table with no clustered index) stores rows in insertion order. Non-clustered lookups on heaps use physical Row ID (RID) pointers and suffer from more fragmentation.',
      ],
    },
    {
      heading: 'Covering indexes and INCLUDE columns',
      points: [
        'A query is <strong>covered</strong> by an index when the index contains all columns the query needs — both the filter columns and the SELECT columns. No lookup back to the data page is required.',
        'In SQL Server use <code>INCLUDE(col1, col2)</code> to add columns to the leaf level of the index without making them part of the key. This avoids costly key lookups without widening the index key.',
        'The <strong>key lookup</strong> (or RID lookup) operator in an execution plan indicates the index doesn\'t cover the query — add the missing SELECT columns to INCLUDE.',
        'PostgreSQL uses <code>CREATE INDEX … INCLUDE (col)</code> for the same purpose (index-only scans). The included columns are in the leaf node but not used for ordering.',
      ],
    },
    {
      heading: 'Sargability — predicates that use indexes',
      points: [
        'A predicate is <strong>sargable</strong> (Search ARGument ABLE) when the index can be used for an efficient seek. The rule: do not apply a function or implicit conversion to the indexed column.',
        'Non-sargable (bad): <code>WHERE YEAR(OrderDate) = 2024</code>. Sargable (good): <code>WHERE OrderDate >= \'2024-01-01\' AND OrderDate < \'2025-01-01\'</code>.',
        'Implicit type conversions also break sargability: comparing a VARCHAR column with an integer constant forces a type cast on every row. Always match data types.',
        '<code>LIKE \'%suffix\'</code> is non-sargable (leading %). <code>LIKE \'prefix%\'</code> can use a range index scan.',
      ],
    },
    {
      heading: 'Index maintenance and over-indexing',
      points: [
        'Every write (INSERT, UPDATE, DELETE) must update all indexes on the table. Too many indexes slow writes — audit with SQL Server\'s missing-index DMVs and user-seek/scan counters: <code>sys.dm_db_index_usage_stats</code>.',
        '<strong>Index fragmentation</strong> builds up over time. Use <code>ALTER INDEX … REBUILD</code> (offline, regains space) or <code>ALTER INDEX … REORGANIZE</code> (online, lightweight) to reduce it. Check fragmentation with <code>sys.dm_db_index_physical_stats</code>.',
        '<strong>Statistics</strong> are histograms the optimiser uses to estimate row counts. Stale statistics cause poor plan choices. Use <code>UPDATE STATISTICS</code> or enable auto-update (on by default).',
        'PostgreSQL equivalent: <code>REINDEX INDEX name</code> / <code>VACUUM ANALYZE tablename</code> to reclaim space and update statistics.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CREATE INDEX',
      language: 'sql',
      code: `-- Non-clustered index on a single column
CREATE INDEX IX_Orders_CustomerID
    ON Orders (CustomerID);

-- Composite index: column order matters
-- Seeks on (CustomerID), (CustomerID, OrderDate) — NOT (OrderDate) alone
CREATE INDEX IX_Orders_Customer_Date
    ON Orders (CustomerID, OrderDate DESC);

-- Covering index with INCLUDE (SQL Server)
CREATE INDEX IX_Orders_Covering
    ON Orders (CustomerID, OrderDate)
    INCLUDE (Freight, ShipCity);

-- Filtered index: only active products
CREATE INDEX IX_Products_Active
    ON Products (CategoryID, UnitPrice)
    WHERE Discontinued = 0;

-- PostgreSQL GIN index for JSONB
CREATE INDEX IX_Events_Payload
    ON Events USING GIN (Payload);`,
    },
    {
      label: 'Execution plans',
      language: 'sql',
      code: `-- SQL Server: show actual execution plan
-- Press Ctrl+M or add this before the query:
SET STATISTICS IO, TIME ON;

-- Check what the optimiser chose for a query
SELECT o.OrderID, o.OrderDate, c.CompanyName
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
WHERE o.CustomerID = 'ALFKI'
  AND o.OrderDate >= '2024-01-01';

-- PostgreSQL: EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT o.order_id, c.company_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.customer_id = 'ALFKI'
  AND o.order_date >= '2024-01-01';`,
    },
    {
      label: 'Maintenance',
      language: 'sql',
      code: `-- Check fragmentation (SQL Server)
SELECT
    OBJECT_NAME(ips.object_id)       AS TableName,
    i.name                           AS IndexName,
    ips.avg_fragmentation_in_percent AS Fragmentation
FROM sys.dm_db_index_physical_stats(
        DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i
    ON ips.object_id = i.object_id
   AND ips.index_id  = i.index_id
WHERE avg_fragmentation_in_percent > 10
ORDER BY avg_fragmentation_in_percent DESC;

-- Rebuild / reorganize
ALTER INDEX IX_Orders_CustomerID ON Orders REBUILD;
ALTER INDEX ALL ON Orders REORGANIZE;

-- Update statistics
UPDATE STATISTICS Orders WITH FULLSCAN;

-- Find unused indexes
SELECT OBJECT_NAME(i.object_id) AS Tbl, i.name, us.user_seeks, us.user_scans
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats us
    ON i.object_id = us.object_id AND i.index_id = us.index_id
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
  AND (us.user_seeks = 0 OR us.user_seeks IS NULL)
ORDER BY Tbl, i.name;`,
    },
  ];

  challenge: Challenge = {
    title: 'Design Indexes for a Query',
    language: 'sql',
    description: `Given this slow query on the Orders table (OrderID PK, CustomerID, OrderDate, Status, ShipCountry, Freight):

SELECT CustomerID, OrderDate, Freight
FROM Orders
WHERE CustomerID = @cid
  AND Status = 'Shipped'
  AND OrderDate >= '2024-01-01'
ORDER BY OrderDate DESC;

Write a CREATE INDEX statement that: (a) allows an efficient seek on CustomerID + Status + OrderDate, and (b) covers the query (no key lookup needed). Explain why you chose that column order.`,
    hints: [
      'High-equality columns first (CustomerID = @cid, Status = \'Shipped\') — they eliminate the most rows',
      'The range column (OrderDate) goes last in the key so the seek can use the equality columns first',
      'INCLUDE Freight since it\'s in SELECT but not in WHERE — no need to widen the key',
    ],
    starterCode: `CREATE INDEX IX_Orders_CustomerStatus_Date
    ON Orders (
        -- key columns in the right order
    )
    INCLUDE (
        -- covered SELECT columns not in WHERE
    );
-- Explain why this order is efficient:
-- ...`,
    solution: `CREATE INDEX IX_Orders_CustomerStatus_Date
    ON Orders (CustomerID, Status, OrderDate DESC)
    INCLUDE (Freight);

-- Why this order:
-- 1. CustomerID first — equality predicate, high selectivity, eliminates most rows
-- 2. Status next  — equality predicate on the remaining rows
-- 3. OrderDate last — range predicate; the engine seeks on (CustomerID, Status) then range-scans OrderDate DESC to satisfy ORDER BY without a sort
-- 4. INCLUDE Freight — query needs Freight in SELECT; including it avoids a key lookup
--    back to the clustered index row`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How many clustered indexes can a table have?',
      options: ['Unlimited', '1', '2', 'Up to 999'],
      answer: 1,
      explanation: 'A table can have only one clustered index because the clustered index defines the physical row order of the table — there is only one physical order.',
    },
    {
      q: 'A query uses WHERE UPPER(email) = \'TEST@EXAMPLE.COM\'. Why is this non-sargable?',
      options: [
        'UPPER is not a valid function in SQL',
        'Applying UPPER() to the column forces evaluation for every row, preventing an index seek',
        'String comparisons never use indexes',
        'The index must be on UPPER(email) specifically',
      ],
      answer: 1,
      explanation: 'Non-sargable predicates apply a function to the indexed column. The engine cannot use the index to seek — it must evaluate UPPER(email) for every row. Fix: use a case-insensitive collation, or create a computed-column index on UPPER(email).',
    },
    {
      q: 'What does the INCLUDE clause in CREATE INDEX do?',
      options: [
        'Adds columns to the B-tree key, affecting sort order',
        'Adds columns to the leaf level only, covering SELECT lists without widening the key',
        'Creates a partial index filtered by those columns',
        'Sets the fill factor for the index pages',
      ],
      answer: 1,
      explanation: 'INCLUDE adds columns to the leaf node of the non-clustered index but not the key. The query can retrieve them without a key lookup, making the index covering — while keeping the key narrow for efficient seeks.',
    },
    {
      q: 'When is a table scan preferable to an index seek?',
      options: [
        'Never — seeks are always better',
        'When the query returns a large percentage of rows (high selectivity = few rows = seek; low selectivity = many rows = scan is cheaper)',
        'Only when there is no index',
        'When the table has fewer than 1000 rows',
      ],
      answer: 1,
      explanation: 'Index seeks have overhead per row (key lookup back to data). When a query returns > 5–30% of rows, a full table/index scan with sequential I/O is faster. The optimiser chooses based on cardinality estimates from statistics.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find which indexes are missing for a query?',
      a: 'In SQL Server, run the query and check the execution plan for green "Missing Index" suggestions (SET STATISTICS IO ON too). Or query sys.dm_db_missing_index_details and sys.dm_db_missing_index_group_stats for accumulated suggestions across all recent queries. In PostgreSQL, EXPLAIN ANALYZE shows sequential scans on large tables, signalling an opportunity for an index.',
    },
    {
      q: 'Should every foreign key have an index?',
      a: 'Yes, in most cases. When you join on a FK or delete a parent row (triggering a scan for referencing child rows), the engine does a table scan without an index. The FK itself enforces integrity but does not create an index — you must create one explicitly.',
    },
    {
      q: 'What is index fragmentation and when should I worry about it?',
      a: 'Fragmentation happens when index pages fill up and split, leaving pages partly empty and out of order. This increases I/O. General rule: < 10% fragmentation — do nothing; 10–30% — REORGANIZE; > 30% — REBUILD. Rebuild is offline but resets fill factor; reorganize is online and incremental.',
    },
    {
      q: 'Can I create an index on a computed column?',
      a: 'Yes. In SQL Server, create a persisted computed column, then index it: ALTER TABLE t ADD EmailUpper AS UPPER(email) PERSISTED; CREATE INDEX IX ON t(EmailUpper). PostgreSQL supports expression indexes directly: CREATE INDEX ON t (UPPER(email));',
    },
  ];
}
