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
  selector: 'app-sql-query-store',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './query-store.html',
  styleUrls: ['./query-store.scss']
})
export class SqlQueryStore {

  quickRef: QuickRefItem[] = [
    { name: 'Query Store (MSSQL)',         type: 'keyword',  desc: 'Built-in query performance history store — plans, runtime stats' },
    { name: 'pg_stat_statements (PG)',     type: 'keyword',  desc: 'PostgreSQL extension: cumulative query statistics' },
    { name: 'sys.query_store_query',       type: 'keyword',  desc: 'MSSQL: query text and metadata in Query Store' },
    { name: 'sys.query_store_plan',        type: 'keyword',  desc: 'MSSQL: execution plans captured by Query Store' },
    { name: 'sys.query_store_runtime_stats', type: 'keyword', desc: 'MSSQL: aggregated CPU, duration, I/O per plan' },
    { name: 'Force plan',                  type: 'keyword',  desc: 'MSSQL: pin a query to a specific known-good plan' },
    { name: 'AUTO mode',                   type: 'keyword',  desc: 'MSSQL: Query Store automatically forces plans for regressed queries' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Query Store?',
      points: [
        'Query Store (MSSQL 2016+) is a built-in flight recorder — it persists query text, execution plans, and runtime statistics across server restarts.',
        'Unlike plan cache (which is volatile), Query Store survives restarts and lets you track plan changes over time.',
        'Key use cases: catch plan regressions after index/stat changes or upgrades, force a known-good plan, identify top resource consumers.',
      ]
    },
    {
      heading: 'Enabling and configuring Query Store',
      points: [
        'ALTER DATABASE MyDB SET QUERY_STORE = ON (READ_WRITE);',
        'Key settings: MAX_STORAGE_SIZE_MB (default 100), QUERY_CAPTURE_MODE (ALL / AUTO / CUSTOM), INTERVAL_LENGTH_MINUTES (aggregation window).',
        'AUTO mode: only captures queries that meet significance thresholds — good default for production.',
        'SSMS Query Store reports: Top Resource Consuming Queries, Plan Forcing, Regressed Queries.',
      ]
    },
    {
      heading: 'Plan forcing',
      points: [
        'When a query regresses (new plan is slower), you can force the old good plan: sp_query_store_force_plan @query_id, @plan_id.',
        'The optimizer will use the forced plan until you unforce it: sp_query_store_unforce_plan.',
        'Automatic plan correction (Azure SQL / SQL Server 2017+): SET AUTOMATIC_TUNING (FORCE_LAST_GOOD_PLAN = ON) — database automatically forces previous good plans on regression.',
      ]
    },
    {
      heading: 'pg_stat_statements (PostgreSQL)',
      points: [
        'CREATE EXTENSION pg_stat_statements; (once per database). Enable in postgresql.conf: shared_preload_libraries = \'pg_stat_statements\'.',
        'Tracks cumulative stats per normalised query: calls, total_exec_time, mean_exec_time, rows, shared_blks_hit/read.',
        'pg_stat_statements_reset() clears all statistics — call it to get a clean baseline measurement window.',
      ]
    },
    {
      heading: 'Finding top queries',
      points: [
        'MSSQL: query sys.query_store_runtime_stats + sys.query_store_query_text to find queries by total CPU, duration, or I/O.',
        'PostgreSQL: SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC.',
        'Focus on total_exec_time (total impact) not just mean_exec_time (per-call cost) — a fast query called 1M times may cost more than a slow query called once.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enable & configure Query Store (MSSQL)',
      language: 'sql',
      code: `-- Enable Query Store
ALTER DATABASE MyDB
SET QUERY_STORE = ON (
    OPERATION_MODE          = READ_WRITE,
    QUERY_CAPTURE_MODE      = AUTO,
    MAX_STORAGE_SIZE_MB     = 500,
    INTERVAL_LENGTH_MINUTES = 60,
    SIZE_BASED_CLEANUP_MODE = AUTO
);

-- Check current configuration
SELECT * FROM sys.database_query_store_options;

-- Check Query Store size and state
SELECT
    current_storage_size_mb,
    max_storage_size_mb,
    readonly_reason,
    actual_state_desc
FROM sys.database_query_store_options;

-- Flush in-memory data to disk (useful before querying)
EXEC sys.sp_query_store_flush_db;`
    },
    {
      label: 'Find top CPU queries (MSSQL)',
      language: 'sql',
      code: `-- Top 10 queries by total CPU time
SELECT TOP 10
    qt.query_sql_text,
    q.query_id,
    p.plan_id,
    rs.avg_cpu_time       / 1000.0 AS avg_cpu_ms,
    rs.avg_duration       / 1000.0 AS avg_duration_ms,
    rs.avg_logical_io_reads,
    rs.count_executions,
    rs.avg_cpu_time * rs.count_executions / 1000.0 AS total_cpu_ms
FROM sys.query_store_query        q
JOIN sys.query_store_query_text   qt ON qt.query_text_id = q.query_text_id
JOIN sys.query_store_plan         p  ON p.query_id = q.query_id
JOIN sys.query_store_runtime_stats rs ON rs.plan_id = p.plan_id
ORDER BY total_cpu_ms DESC;

-- Find queries with multiple plans (parameter sniffing suspects)
SELECT q.query_id, COUNT(DISTINCT p.plan_id) AS plan_count,
       qt.query_sql_text
FROM sys.query_store_query q
JOIN sys.query_store_query_text qt ON qt.query_text_id = q.query_text_id
JOIN sys.query_store_plan p ON p.query_id = q.query_id
GROUP BY q.query_id, qt.query_sql_text
HAVING COUNT(DISTINCT p.plan_id) > 1
ORDER BY plan_count DESC;`
    },
    {
      label: 'Force & unforce a plan (MSSQL)',
      language: 'sql',
      code: `-- Find the last known-good plan for a regressed query
SELECT
    p.plan_id,
    p.query_id,
    rs.avg_duration / 1000.0 AS avg_ms,
    p.last_execution_time,
    p.is_forced_plan
FROM sys.query_store_plan p
JOIN sys.query_store_runtime_stats rs ON rs.plan_id = p.plan_id
WHERE p.query_id = 42   -- replace with your query_id
ORDER BY rs.avg_duration ASC;

-- Force the fastest plan
EXEC sys.sp_query_store_force_plan
    @query_id = 42,
    @plan_id  = 17;   -- the good plan_id

-- Later: unforce to let optimizer choose again
EXEC sys.sp_query_store_unforce_plan
    @query_id = 42,
    @plan_id  = 17;

-- Enable automatic plan correction (SQL Server 2017+ / Azure SQL)
ALTER DATABASE MyDB
SET AUTOMATIC_TUNING (FORCE_LAST_GOOD_PLAN = ON);`
    },
    {
      label: 'pg_stat_statements (PostgreSQL)',
      language: 'sql',
      code: `-- Enable extension (once)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 queries by total execution time
SELECT
    LEFT(query, 120)                   AS query_snippet,
    calls,
    ROUND(mean_exec_time::NUMERIC, 2)  AS mean_ms,
    ROUND(total_exec_time::NUMERIC, 2) AS total_ms,
    rows,
    shared_blks_hit,
    shared_blks_read
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Worst per-call (slowest single execution on average)
SELECT LEFT(query, 120), calls, ROUND(mean_exec_time::NUMERIC, 2) AS mean_ms
FROM pg_stat_statements
WHERE calls > 100    -- ignore rarely-called queries
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Reset statistics for a clean measurement window
SELECT pg_stat_statements_reset();`
    },
  ];

  challenge: Challenge = {
    title: 'Identify and fix a regressed query',
    language: 'sql',
    description: 'Using MSSQL Query Store: (1) Write a query against sys.query_store_runtime_stats that finds queries where the most recent interval\'s avg_duration is more than 3x the historic average (indicating regression). (2) For the worst offender, show how to force the previous best plan. Alternatively for PostgreSQL: write a pg_stat_statements query that finds queries with mean_exec_time > 500ms called more than 100 times.',
    hints: [
      'MSSQL: join runtime_stats on plan_id; use two aggregates — one for recent intervals, one for all-time — then compare.',
      'sys.query_store_runtime_stats.runtime_stats_interval_id identifies the aggregation window; the highest ID is most recent.',
      'PostgreSQL: WHERE mean_exec_time > 500 AND calls > 100 ORDER BY total_exec_time DESC.',
    ],
    starterCode: `-- MSSQL: find regressed queries
SELECT
    qt.query_sql_text,
    q.query_id,
    -- recent avg duration (last interval)
    -- historic avg duration (all intervals)
    -- regression ratio
FROM sys.query_store_query q
JOIN sys.query_store_query_text qt ON ...
JOIN sys.query_store_plan p ON ...
JOIN sys.query_store_runtime_stats rs ON ...
-- group and filter for regression > 3x

-- PostgreSQL: high-impact slow queries
SELECT ...
FROM pg_stat_statements
WHERE ...
ORDER BY ...
LIMIT 20;`,
    solution: `-- MSSQL: queries where latest interval is 3x slower than historic average
WITH stats AS (
    SELECT
        p.query_id,
        rs.runtime_stats_interval_id,
        rs.avg_duration,
        MAX(rs.runtime_stats_interval_id) OVER (PARTITION BY p.query_id) AS latest_interval
    FROM sys.query_store_plan p
    JOIN sys.query_store_runtime_stats rs ON rs.plan_id = p.plan_id
)
SELECT
    qt.query_sql_text,
    s.query_id,
    MAX(CASE WHEN s.runtime_stats_interval_id = s.latest_interval THEN s.avg_duration END) / 1000.0 AS recent_ms,
    AVG(s.avg_duration) / 1000.0 AS historic_avg_ms
FROM stats s
JOIN sys.query_store_query q ON q.query_id = s.query_id
JOIN sys.query_store_query_text qt ON qt.query_text_id = q.query_text_id
GROUP BY qt.query_sql_text, s.query_id
HAVING MAX(CASE WHEN s.runtime_stats_interval_id = s.latest_interval THEN s.avg_duration END)
     > AVG(s.avg_duration) * 3
ORDER BY recent_ms DESC;

-- PostgreSQL: high-impact slow queries
SELECT
    LEFT(query, 200)               AS query_snippet,
    calls,
    ROUND(mean_exec_time::NUMERIC,2) AS mean_ms,
    ROUND(total_exec_time::NUMERIC,2) AS total_ms
FROM pg_stat_statements
WHERE mean_exec_time > 500
  AND calls > 100
ORDER BY total_exec_time DESC
LIMIT 20;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does plan forcing in MSSQL Query Store do?',
      options: [
        'Permanently rewrites the query to use a specific index',
        'Instructs the optimizer to always use a specific previously-captured plan for a query',
        'Clears the plan cache so the query recompiles',
        'Copies the plan to all databases on the server'
      ],
      answer: 1,
      explanation: 'sp_query_store_force_plan pins a query to a specific plan_id captured in Query Store. The optimizer uses that plan on every execution until you call sp_query_store_unforce_plan. The plan stays pinned across restarts.'
    },
    {
      q: 'What is the key advantage of Query Store over the plan cache?',
      options: [
        'Query Store holds more plans simultaneously',
        'Query Store persists plans and runtime stats across server restarts; the plan cache is volatile',
        'Query Store automatically rewrites slow queries',
        'Query Store works for all databases; plan cache is per-user'
      ],
      answer: 1,
      explanation: 'The plan cache is held in memory and is cleared on restart, failover, or memory pressure. Query Store writes to the database and survives these events, giving you a historical record of plan changes and performance trends.'
    },
    {
      q: 'In pg_stat_statements, why is total_exec_time often more useful than mean_exec_time?',
      options: [
        'mean_exec_time is always inaccurate',
        'A query with low mean_exec_time but very high call count may have more total impact on the system',
        'total_exec_time includes index build time',
        'mean_exec_time only counts successful executions'
      ],
      answer: 1,
      explanation: 'A query averaging 5ms but called 1 000 000 times costs 5 000 seconds total. A query averaging 2 000ms called 10 times costs only 20 seconds. Optimising the high-call-count query has more system-wide impact even though its per-call cost is lower.'
    },
    {
      q: 'What does QUERY_CAPTURE_MODE = AUTO do in MSSQL Query Store?',
      options: [
        'Captures all queries including one-time ad-hoc queries',
        'Only captures queries that exceed a configurable CPU/duration threshold — filters out trivial queries',
        'Disables query capture but still tracks plan changes',
        'Captures only stored procedure calls, not ad-hoc SQL'
      ],
      answer: 1,
      explanation: 'AUTO mode applies significance thresholds (minimum execution count, CPU, duration) so that trivial or infrequent queries do not fill the Query Store. ALL captures everything — useful for debugging but noisy in production.'
    },
    {
      q: 'What does Automatic Plan Correction (APC) do in SQL Server 2017+?',
      options: [
        'Rewrites queries to use better indexes automatically',
        'Detects when a forced plan regresses performance and auto-forces the last-known-good plan from Query Store history',
        'Rebuilds statistics and indexes during off-peak hours',
        'Identifies and removes duplicate plans from the cache'
      ],
      answer: 1,
      explanation: 'APC monitors Query Store plan history. If a plan change causes a significant CPU increase, APC forces the previously-good plan and logs the correction in sys.dm_db_tuning_recommendations. It is enabled with ALTER DATABASE … SET AUTOMATIC_TUNING (FORCE_LAST_GOOD_PLAN = ON).'
    },
    {
      q: 'What must be configured in postgresql.conf before pg_stat_statements works?',
      options: [
        'enable_query_tracking = on',
        'pg_stat_statements must be added to shared_preload_libraries and the server restarted',
        'Only CREATE EXTENSION pg_stat_statements is needed — no server restart required',
        'query_logging = pg_stat_statements in pg_hba.conf'
      ],
      answer: 1,
      explanation: 'pg_stat_statements is a background worker that hooks into the executor at startup. It must be listed in shared_preload_libraries before the server starts. After a restart, CREATE EXTENSION pg_stat_statements; makes its view available.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Query Store is full (READ_ONLY) — what should I do?',
      a: 'Either increase MAX_STORAGE_SIZE_MB: ALTER DATABASE … SET QUERY_STORE (MAX_STORAGE_SIZE_MB = 1000); or purge old data: EXEC sys.sp_query_store_remove_query @query_id = X; or EXEC sys.sp_query_store_flush_db; followed by ALTER DATABASE … SET QUERY_STORE CLEAR. Investigate why it filled — common cause is QUERY_CAPTURE_MODE = ALL capturing too much, or too small a storage limit.',
    },
    {
      q: 'How do I reset pg_stat_statements without losing all data?',
      a: 'pg_stat_statements_reset() resets all rows. To reset just one query: pg_stat_statements_reset(userid, dbid, queryid) — available in PostgreSQL 12+. Call it after a scheduled maintenance window or index rebuild to get clean post-change measurements.',
    },
    {
      q: 'Can Query Store help with parameter sniffing?',
      a: 'Yes — Query Store tracks multiple plans per query. If a query has many plans (visible in the "Plan Summary" SSMS report), each compiled for different parameter values, you can identify the best general-purpose plan and force it. Alternatively, enable Automatic Plan Correction (SQL Server 2017+) which detects regressions and forces the last-known-good plan automatically.',
    },
    {
      q: 'How do I export Query Store data for offline analysis?',
      a: 'Query the sys.query_store_query, sys.query_store_plan, and sys.query_store_runtime_stats tables directly and export to CSV or a reporting tool. For cross-server comparison, use SSMS "Export Data" or a linked server query. The tables are in the user database, so any backup includes the Query Store data.',
    },
    {
      q: 'How do I find the top CPU-consuming queries using pg_stat_statements?',
      a: 'SELECT query, calls, total_exec_time, mean_exec_time, stddev_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10; — total_exec_time is the total wall-clock time across all calls. Sort by mean_exec_time to find the slowest individual calls. Use stddev_exec_time to identify queries with inconsistent performance (high variance often indicates parameter sniffing or locking).',
    },
    {
      q: 'How does Query Store compare to Extended Events for performance monitoring?',
      a: 'Query Store persists pre-aggregated metrics (avg/min/max duration, CPU, reads per plan) automatically with minimal overhead. Extended Events give you raw event data (individual query executions, lock waits, deadlocks) with more detail but require configuration and consume more storage. Use Query Store for ongoing trend analysis and plan regression detection; use XEvents for deep-dive investigation of specific incidents.',
    },
  ];
}
