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
  selector: 'app-sql-statistics',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.scss']
})
export class SqlStatistics {

  quickRef: QuickRefItem[] = [
    { name: 'Statistics (MSSQL)',      type: 'keyword', desc: 'Histograms and density vectors used by the query optimizer to estimate row counts' },
    { name: 'UPDATE STATISTICS',       type: 'keyword', desc: 'Rebuild statistics for a table or specific index/column' },
    { name: 'AUTO_UPDATE_STATISTICS',  type: 'keyword', desc: 'DB option: automatically update stale statistics' },
    { name: 'ANALYZE (PostgreSQL)',    type: 'keyword', desc: 'Collect statistics used by the query planner' },
    { name: 'autovacuum ANALYZE',      type: 'keyword', desc: 'PG background process that runs ANALYZE automatically' },
    { name: 'DBCC SHOW_STATISTICS',   type: 'keyword', desc: 'MSSQL: display histogram and density for a statistics object' },
    { name: 'pg_statistic / pg_stats', type: 'keyword', desc: 'PG system catalog views for column-level statistics' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why statistics matter',
      points: [
        'The query optimizer is a cost-based engine — it estimates how many rows each operation will process and chooses the cheapest plan.',
        'Those estimates come from statistics: histograms (value distribution per column) and density vectors (multi-column cardinality).',
        'Stale or missing statistics cause bad cardinality estimates, which lead to bad plan choices — wrong join type, wrong index, wrong memory grant.',
      ]
    },
    {
      heading: 'MSSQL statistics',
      points: [
        'Created automatically for index key columns and, when AUTO_CREATE_STATISTICS is ON, for columns referenced in WHERE/JOIN predicates.',
        'Auto-update threshold (traditional): 20% of rows changed (rowcount * 0.2). SQL Server 2016+: dynamic threshold — 500 + sqrt(rows) * 0.2 for large tables.',
        'Trace flag 2371 (pre-2016) or setting compatibility level ≥ 130 enables the dynamic threshold.',
        'FULLSCAN uses 100% of rows — accurate but expensive. SAMPLE N PERCENT balances accuracy and speed for large tables.',
      ]
    },
    {
      heading: 'PostgreSQL statistics',
      points: [
        'ANALYZE collects statistics stored in pg_statistic. The planner uses these to estimate selectivity.',
        'default_statistics_target (default 100) controls histogram bucket count — increase for columns with high cardinality or skew.',
        'Per-column override: ALTER TABLE t ALTER COLUMN c SET STATISTICS 500;',
        'autovacuum runs ANALYZE automatically when ~10% of rows change. pg_stat_user_tables.n_mod_since_analyze tracks accumulated changes.',
      ]
    },
    {
      heading: 'When to manually update statistics',
      points: [
        'After a large bulk load (auto-update may not trigger quickly enough).',
        'After a major index rebuild — REBUILD updates statistics as a side effect, but REORGANIZE does not.',
        'When you see cardinality misestimates in execution plans (estimated vs actual rows differ greatly).',
        'After batch deletes that skew the data distribution significantly.',
      ]
    },
    {
      heading: 'Diagnosing stale statistics',
      points: [
        'MSSQL: DBCC SHOW_STATISTICS (\'table\', \'index_or_stat_name\') shows histogram, density, and last update date.',
        'sys.dm_db_stats_properties returns rows_sampled, modification_counter, last_updated for each stats object.',
        'PostgreSQL: SELECT * FROM pg_stats WHERE tablename = \'orders\' AND attname = \'customer_id\';',
        'Compare estimated vs actual rows in EXPLAIN ANALYZE (PG) or the execution plan (MSSQL) — large discrepancies signal stale statistics.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Update statistics (MSSQL)',
      language: 'sql',
      code: `-- Update all statistics on a table (default sampling)
UPDATE STATISTICS dbo.orders;

-- Full scan — accurate but slow for large tables
UPDATE STATISTICS dbo.orders WITH FULLSCAN;

-- Sample 30% of rows
UPDATE STATISTICS dbo.orders WITH SAMPLE 30 PERCENT;

-- Update a specific statistics object
UPDATE STATISTICS dbo.orders [ix_orders_customer_date];

-- Update all statistics in the database
EXEC sp_updatestats;  -- only updates stats where modification_counter > 0

-- Check when statistics were last updated
SELECT
    OBJECT_NAME(s.object_id)   AS table_name,
    s.name                      AS stat_name,
    sp.last_updated,
    sp.rows,
    sp.rows_sampled,
    sp.modification_counter
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE OBJECT_NAME(s.object_id) = 'orders'
ORDER BY sp.modification_counter DESC;`
    },
    {
      label: 'Inspect histogram (MSSQL)',
      language: 'sql',
      code: `-- Show statistics details: header, density vector, histogram
DBCC SHOW_STATISTICS ('dbo.orders', 'ix_orders_customer_date');

-- Header: when updated, rows, rows sampled
-- Density vector: multi-column combinations
-- Histogram: RANGE_HI_KEY, EQ_ROWS, RANGE_ROWS, DISTINCT_RANGE_ROWS, AVG_RANGE_ROWS

-- Find tables with stale statistics (modification_counter high relative to rows)
SELECT
    OBJECT_NAME(s.object_id)   AS table_name,
    s.name                      AS stat_name,
    sp.rows,
    sp.modification_counter,
    CAST(sp.modification_counter * 100.0 / NULLIF(sp.rows,0) AS DECIMAL(5,1)) AS pct_modified,
    sp.last_updated
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE sp.modification_counter > 0
  AND OBJECTPROPERTY(s.object_id, 'IsUserTable') = 1
ORDER BY pct_modified DESC;`
    },
    {
      label: 'ANALYZE & pg_stats (PostgreSQL)',
      language: 'sql',
      code: `-- Analyze a specific table
ANALYZE orders;

-- Analyze a specific column
ANALYZE orders (customer_id);

-- Increase statistics target for a skewed column
ALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS 500;
ANALYZE orders (customer_id);  -- rebuild with new target

-- Inspect column statistics
SELECT
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE tablename = 'orders'
  AND attname   = 'customer_id';

-- Check auto-analyze status
SELECT
    relname,
    n_live_tup,
    n_mod_since_analyze,
    last_autoanalyze,
    last_analyze
FROM pg_stat_user_tables
WHERE relname = 'orders';`
    },
    {
      label: 'Correlation & cardinality tips',
      language: 'sql',
      code: `-- MSSQL: statistics for a column not covered by any index
-- The optimizer creates single-column stats automatically (AUTO_CREATE_STATISTICS ON)
-- but you can create them manually for multi-column combinations:
CREATE STATISTICS st_orders_status_date
ON dbo.orders (status, order_date);

-- Extended events: capture cardinality misestimate warnings
-- Event: sqlserver.missing_column_statistics, sqlserver.large_plan_cache_warning

-- PostgreSQL: create extended statistics for correlated columns
CREATE STATISTICS st_orders_cust_region
    ON customer_id, region
    FROM orders;
ANALYZE orders;

-- View extended statistics
SELECT * FROM pg_statistic_ext;

-- PostgreSQL: planner settings for debugging
SET enable_seqscan = OFF;   -- force index usage for a test
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
RESET enable_seqscan;`
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose a cardinality misestimate',
    language: 'sql',
    description: 'Given a slow query: SELECT * FROM orders WHERE status = \'Pending\' AND order_date > \'2024-01-01\'; (1) In MSSQL: write queries against sys.stats and sys.dm_db_stats_properties to check when statistics on the orders table were last updated and how many rows have been modified since. (2) In PostgreSQL: query pg_stats to find n_distinct and histogram_bounds for the status and order_date columns. (3) Write the commands to update/rebuild statistics for both dialects.',
    hints: [
      'MSSQL: join sys.stats with sys.dm_db_stats_properties via CROSS APPLY.',
      'A modification_counter > 500 + sqrt(rows)*0.2 means auto-update is likely overdue.',
      'PostgreSQL: pg_stats is a user-friendly view over pg_statistic; filter by tablename and attname.',
    ],
    starterCode: `-- MSSQL: check statistics freshness
SELECT ...
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(...) AS sp
WHERE OBJECT_NAME(s.object_id) = 'orders';

-- PostgreSQL: inspect column stats
SELECT attname, n_distinct, histogram_bounds
FROM pg_stats
WHERE ...;

-- Update statistics
-- MSSQL: ...
-- PostgreSQL: ...`,
    solution: `-- MSSQL: check statistics freshness
SELECT
    s.name                      AS stat_name,
    sp.last_updated,
    sp.rows,
    sp.rows_sampled,
    sp.modification_counter,
    500 + SQRT(sp.rows) * 0.2   AS dynamic_threshold
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE OBJECT_NAME(s.object_id) = 'orders';

-- PostgreSQL: inspect column stats
SELECT attname, n_distinct, correlation, histogram_bounds, most_common_vals
FROM pg_stats
WHERE tablename = 'orders'
  AND attname IN ('status', 'order_date');

-- MSSQL: update with full scan
UPDATE STATISTICS dbo.orders WITH FULLSCAN;

-- PostgreSQL: analyze with increased target for skewed column
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 200;
ANALYZE orders;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What causes a cardinality misestimate in query plans?',
      options: [
        'Too many indexes on a table',
        'Statistics that are stale, missing, or under-sampled — the optimizer\'s row count estimate differs from reality',
        'Queries that use subqueries instead of JOINs',
        'Tables with more than 1 million rows'
      ],
      answer: 1,
      explanation: 'The optimizer uses statistics (histograms, densities) to estimate how many rows will match predicates. When statistics are stale or based on a small sample, estimates can be orders of magnitude off, leading to poor plan choices like nested loops instead of hash joins.'
    },
    {
      q: 'What is the dynamic auto-update threshold for statistics in MSSQL 2016+ (compat level 130+)?',
      options: [
        '20% of rows modified',
        '10% of rows modified',
        '500 + sqrt(row_count) * 0.2 rows modified',
        '1000 rows modified regardless of table size'
      ],
      answer: 2,
      explanation: 'The old threshold (20%) meant a 100M-row table needed 20M changes before auto-update triggered — far too high. The dynamic threshold (500 + sqrt(N) * 0.2) scales with table size, triggering much more often for large tables.'
    },
    {
      q: 'In PostgreSQL, what does ALTER TABLE t ALTER COLUMN c SET STATISTICS 500 do?',
      options: [
        'Limits the column to 500 distinct values',
        'Increases the histogram bucket count for that column, giving the planner finer-grained data about its distribution',
        'Samples 500 rows when running ANALYZE',
        'Creates an index with 500 leaf pages'
      ],
      answer: 1,
      explanation: 'default_statistics_target (default 100) controls the histogram resolution globally. Setting a per-column target higher (e.g. 500) tells ANALYZE to collect more buckets for that column — useful for columns with high cardinality or skewed distributions that cause bad estimates.'
    },
    {
      q: 'In MSSQL, does ALTER INDEX … REORGANIZE update statistics?',
      options: [
        'Yes, REORGANIZE always updates statistics',
        'No — only REBUILD updates statistics as a side effect; REORGANIZE does not',
        'Yes, but only for the clustered index',
        'Both REBUILD and REORGANIZE update statistics identically'
      ],
      answer: 1,
      explanation: 'ALTER INDEX … REBUILD updates the associated statistics as part of the operation (equivalent to WITH FULLSCAN by default). ALTER INDEX … REORGANIZE only defragments index pages — it does not update statistics. Run UPDATE STATISTICS separately after a REORGANIZE.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I always use FULLSCAN when updating statistics?',
      a: 'Not always. FULLSCAN is most accurate but reads every row — expensive on large tables. For very large tables (100M+ rows), SAMPLE 30 PERCENT often gives equally good estimates in a fraction of the time. Reserve FULLSCAN for highly skewed columns where a sample might miss a data spike, or when cardinality estimates are critically wrong even after a sampled update.',
    },
    {
      q: 'Why does PostgreSQL sometimes ignore my index even after ANALYZE?',
      a: 'A few common reasons: (1) The planner estimates sequential scan is cheaper (for low selectivity queries). (2) Stale statistics — run ANALYZE again and check pg_stats. (3) The correlation value for a column is close to 0 — random heap order means index seeks are expensive. (4) enable_indexscan might be OFF. Try SET enable_seqscan = OFF; EXPLAIN ANALYZE … to see if the index plan is faster, then check why the planner chose the seq scan.',
    },
    {
      q: 'What is AUTO_UPDATE_STATISTICS_ASYNC in MSSQL?',
      a: 'When set ON, statistics updates happen asynchronously — the current query runs with the stale statistics, and the update happens in a background thread for future queries. This avoids the latency spike of synchronous updates on hot queries. Trade-off: the first query after a threshold may still use a bad plan. Useful for latency-sensitive OLTP workloads.',
    },
  ];
}
