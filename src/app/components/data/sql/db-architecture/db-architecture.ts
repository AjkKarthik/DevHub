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
  selector: 'app-sql-db-architecture',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './db-architecture.html',
  styleUrl: './db-architecture.scss',
})
export class SqlDbArchitecture {

  quickRef: QuickRefItem[] = [
    { name: 'Page / Block',       type: 'keyword', desc: 'Smallest unit of I/O. MSSQL: 8 KB pages in .mdf/.ndf data files. PostgreSQL: 8 KB blocks in heap files.' },
    { name: 'Extent',             type: 'keyword', desc: 'MSSQL: 8 contiguous pages (64 KB) — the allocation unit. PG: no extent concept; uses FSM (free space map).' },
    { name: 'Buffer Pool',        type: 'keyword', desc: 'MSSQL: in-memory page cache managed by SQL OS. PostgreSQL: shared_buffers — the shared in-memory page cache.' },
    { name: 'WAL',                type: 'keyword', desc: 'Write-Ahead Log (PostgreSQL) — changes logged before being written to data files, ensuring durability.' },
    { name: 'Transaction Log',    type: 'keyword', desc: 'MSSQL equivalent of WAL. Sequential .ldf file; records every data modification for recovery and replication.' },
    { name: 'Checkpoint',         type: 'keyword', desc: 'A flush of all dirty (modified) buffer pages to disk. Recovery after a crash only needs to replay log from the last checkpoint.' },
    { name: 'MVCC',               type: 'keyword', desc: 'Multi-Version Concurrency Control. PostgreSQL native: keeps multiple row versions so readers never block writers.' },
    { name: 'Dead Tuple',         type: 'keyword', desc: 'PostgreSQL: an old row version no longer visible to any active transaction. Reclaimed by VACUUM.' },
    { name: 'VACUUM',             type: 'keyword', desc: 'PostgreSQL process that reclaims dead tuple space and updates visibility maps. AUTOVACUUM runs automatically.' },
    { name: 'TempDB',             type: 'keyword', desc: 'MSSQL system database for temp tables (#t), table variables, worktables (sorts/spools), and row-version store for SNAPSHOT isolation.' },
    { name: 'LSN',                type: 'keyword', desc: 'Log Sequence Number — a position in the transaction log / WAL. Used for replication, point-in-time recovery.' },
    { name: 'shared_buffers',     type: 'keyword', desc: 'PostgreSQL GUC parameter: size of the shared buffer pool. Default 128 MB; set to ~25% of RAM.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Physical Storage: Pages, Files, and Extents',
      points: [
        'Both MSSQL and PostgreSQL store data in fixed-size pages/blocks of 8 KB. Every table row, index entry, and free-space record lives on a page.',
        'MSSQL: data lives in .mdf (primary) and .ndf (secondary) data files. Pages are grouped into extents of 8 pages (64 KB) — the minimum allocation unit. Uniform extents serve one object; mixed extents serve up to 8 small objects.',
        'PostgreSQL: each table and index is a "heap file" — a sequence of 8 KB blocks in the OS file system. Large column values (> ~2 KB) are stored out-of-line in TOAST (The Oversized-Attribute Storage Technique) tables.',
        'Row size limit: MSSQL allows rows up to 8060 bytes on a single page (with overflow for varchar/nvarchar(max)). PostgreSQL rows must fit on a single block or spill to TOAST.',
        'Understanding pages matters for performance: reading one row from disk always reads a full 8 KB page. Wider rows = fewer rows per page = more I/O per query.',
      ],
    },
    {
      heading: 'Buffer Pool and Memory Architecture',
      points: [
        'MSSQL Buffer Pool: managed by SQL OS. Pages are loaded into memory on first access and stay as long as possible. Eviction uses a clock-sweep algorithm. The buffer pool is the single largest consumer of SQL Server memory — allow it to grow to ~80% of RAM.',
        'PostgreSQL shared_buffers: the kernel-level shared memory segment shared between all backend processes. Set to ~25% of RAM. PostgreSQL also relies heavily on the OS page cache (double buffering) — this is why total RAM usage can be 2× shared_buffers.',
        'Buffer hit ratio: the percentage of page reads served from memory vs disk. Target >99% for OLTP workloads. A low buffer hit ratio indicates insufficient memory or a missing index causing excessive full scans.',
        'MSSQL DMVs: sys.dm_os_buffer_descriptors shows which pages are in the buffer pool. sys.dm_os_performance_counters tracks buffer hit rate.',
        'PostgreSQL: pg_stat_bgwriter shows checkpoint and buffer activity. pg_stat_user_tables shows sequential vs index scans per table.',
      ],
    },
    {
      heading: 'Write-Ahead Logging: Durability Without Constant Full Writes',
      points: [
        'The WAL/transaction log principle: before any data page is modified on disk, the change must first be written to the log. On crash, replay the log to reconstruct committed changes.',
        'MSSQL transaction log (.ldf): a single sequential file (or multiple files). Written synchronously before the commit acknowledgement is sent to the client. Inactive portions are truncated after a checkpoint (SIMPLE recovery) or log backup (FULL recovery).',
        'PostgreSQL WAL: stored in pg_wal/ directory as 16 MB segment files. WAL is also the foundation for streaming replication (primary ships WAL segments to standbys) and point-in-time recovery (PITR).',
        'Checkpoint: periodically, dirty buffer pages are flushed to data files and the LSN of the checkpoint is recorded. After a crash, the engine only needs to replay the WAL/log from the last checkpoint — not from the beginning of time.',
        'Performance implication: fsync ensures WAL writes hit durable storage. Disabling fsync (only safe on replicas or test environments) dramatically speeds writes but risks data loss on crash.',
      ],
    },
    {
      heading: 'MVCC vs Lock-Based Concurrency',
      points: [
        'PostgreSQL uses MVCC natively: every UPDATE creates a new row version (tuple) and marks the old version as dead. Each transaction sees a consistent snapshot based on its start time — readers never block writers and writers never block readers.',
        'Dead tuples accumulate over time and must be reclaimed by VACUUM. AUTOVACUUM runs VACUUM and ANALYZE automatically in the background. If autovacuum falls behind on a busy table, dead tuples cause table bloat and slow sequential scans.',
        'MSSQL default isolation (READ COMMITTED) is lock-based: a reader takes a shared lock on each page/row it reads, blocking writers. This is simple but causes contention on busy OLTP tables.',
        'MSSQL SNAPSHOT isolation / RCSI (Read Committed Snapshot Isolation): enables MVCC-like behaviour by storing old row versions in TempDB. Readers take no shared locks. Enable per-database: ALTER DATABASE … SET READ_COMMITTED_SNAPSHOT ON. Most new MSSQL applications should enable RCSI.',
        'TempDB is critical for MSSQL performance: it serves temp tables, table variables, worktables (hash joins, sorts), spool operators, and the row-version store for SNAPSHOT/RCSI. TempDB contention (allocation page latch waits) is a common cause of scalability limits — use trace flag 1117/1118 or pre-create multiple TempDB files.',
      ],
    },
    {
      heading: 'VACUUM, ANALYZE, and Statistics',
      points: [
        'PostgreSQL VACUUM: marks dead tuples as free space (reclaimable). Does not shrink the file. VACUUM FULL rewrites the table compactly but holds a full table lock — use only for severe bloat.',
        'PostgreSQL AUTOVACUUM: runs VACUUM and ANALYZE automatically based on a fraction of row changes (autovacuum_vacuum_scale_factor, default 20%). Tune thresholds per table for high-write tables.',
        'ANALYZE (PostgreSQL) / UPDATE STATISTICS (MSSQL): updates the query planner\'s statistics — column histograms and row count estimates used to generate execution plans. Stale statistics cause bad plans.',
        'MSSQL: statistics are updated automatically when ~20% of rows change (auto update statistics). For large tables, 20% of 100 M rows = 20 M changes before stats update — consider manual UPDATE STATISTICS on important tables after bulk loads.',
        'Both engines: always run ANALYZE (PG) or UPDATE STATISTICS (MSSQL) after a large bulk insert or data migration, before running queries that depend on accurate cardinality estimates.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Buffer pool stats (MSSQL)',
      language: 'sql',
      code: `-- Top 10 databases by pages in the MSSQL buffer pool
SELECT
    DB_NAME(database_id)        AS DatabaseName,
    COUNT(*)                    AS PagesInBuffer,
    COUNT(*) * 8 / 1024         AS SizeMB
FROM sys.dm_os_buffer_descriptors
WHERE database_id > 4  -- exclude system databases
GROUP BY database_id
ORDER BY PagesInBuffer DESC;

-- Buffer hit ratio (target > 99%)
SELECT
    object_name,
    counter_name,
    cntr_value  AS HitRatio
FROM sys.dm_os_performance_counters
WHERE object_name  LIKE '%Buffer Manager%'
  AND counter_name = 'Buffer cache hit ratio';

-- Pages in buffer for a specific table
SELECT
    OBJECT_NAME(i.object_id) AS TableName,
    i.name                   AS IndexName,
    COUNT(b.page_id)         AS PagesInBuffer,
    COUNT(b.page_id) * 8    AS SizeKB
FROM sys.dm_os_buffer_descriptors b
JOIN sys.allocation_units         a ON b.allocation_unit_id = a.allocation_unit_id
JOIN sys.partitions               p ON a.container_id IN (p.hobt_id, p.partition_id)
JOIN sys.indexes                  i ON p.object_id = i.object_id AND p.index_id = i.index_id
WHERE b.database_id = DB_ID()
GROUP BY i.object_id, i.name
ORDER BY PagesInBuffer DESC;`,
    },
    {
      label: 'Buffer & checkpoint stats (PostgreSQL)',
      language: 'sql',
      code: `-- Buffer hit ratio per table (target > 99%)
SELECT
    relname                                                AS table_name,
    heap_blks_hit                                          AS buffer_hits,
    heap_blks_read                                         AS disk_reads,
    ROUND(100.0 * heap_blks_hit
          / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) AS hit_pct
FROM pg_statio_user_tables
ORDER BY disk_reads DESC
LIMIT 20;

-- Checkpoint and bgwriter activity
SELECT
    checkpoints_timed,
    checkpoints_req,
    buffers_checkpoint,
    buffers_clean,
    buffers_backend,
    buffers_alloc
FROM pg_stat_bgwriter;

-- Table bloat: estimated dead tuple percentage
SELECT
    schemaname,
    relname                                                AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_pct DESC;`,
    },
    {
      label: 'WAL / transaction log usage',
      language: 'sql',
      code: `-- ── MSSQL: transaction log usage ────────────────────────────────────────
SELECT
    name                    AS DatabaseName,
    log_size_mb             = size * 8.0 / 1024,
    log_used_mb             = FILEPROPERTY(name, 'SpaceUsed') * 8.0 / 1024,
    log_reuse_wait_desc     -- shows why log space cannot be reclaimed
FROM sys.databases
WHERE name = DB_NAME();

-- More detail from sys.dm_db_log_space_usage
SELECT
    total_log_size_mb    = total_log_size_in_bytes / 1048576.0,
    used_log_space_mb    = used_log_space_in_bytes  / 1048576.0,
    log_space_in_use_pct = used_log_space_in_bytes * 100.0
                           / total_log_size_in_bytes
FROM sys.dm_db_log_space_usage;

-- ── PostgreSQL: WAL status ────────────────────────────────────────────────
-- Current WAL position
SELECT pg_current_wal_lsn();

-- WAL segment files on disk
SELECT name, size
FROM pg_ls_waldir()
ORDER BY modification DESC
LIMIT 10;

-- Replication lag (if standbys connected)
SELECT
    application_name,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    write_lag,
    flush_lag,
    replay_lag
FROM pg_stat_replication;`,
    },
    {
      label: 'VACUUM & statistics',
      language: 'sql',
      code: `-- ── PostgreSQL: manual VACUUM and ANALYZE ───────────────────────────────
VACUUM ANALYZE orders;           -- reclaim dead tuples + update statistics
VACUUM (VERBOSE) orders;         -- show what was cleaned up
-- VACUUM FULL orders;           -- rewrites table (shrinks file, holds lock — use sparingly)

-- Check autovacuum settings for a table
SELECT
    relname,
    reloptions  -- per-table autovacuum overrides
FROM pg_class
WHERE relname = 'orders';

-- Tune autovacuum for a high-write table:
ALTER TABLE orders SET (
    autovacuum_vacuum_scale_factor  = 0.01,  -- vacuum after 1% of rows change (not 20%)
    autovacuum_analyze_scale_factor = 0.005
);

-- ── MSSQL: update statistics ─────────────────────────────────────────────
-- Update all statistics on a table (run after bulk loads)
UPDATE STATISTICS dbo.Orders WITH FULLSCAN;

-- Update statistics on a specific index
UPDATE STATISTICS dbo.Orders IX_Orders_CustomerID;

-- View statistics for a column (MSSQL)
DBCC SHOW_STATISTICS ('dbo.Orders', 'IX_Orders_CustomerID');

-- Check when statistics were last updated
SELECT
    s.name          AS stat_name,
    sp.last_updated,
    sp.rows,
    sp.rows_sampled,
    sp.modification_counter
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) sp
WHERE OBJECT_NAME(s.object_id) = 'Orders'
ORDER BY sp.last_updated DESC;`,
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose a Slow Query via Architecture Knowledge',
    language: 'sql',
    description: 'A query that was fast last week is now slow. Use the architecture concepts from this page to write the diagnostic queries that would tell you: (1) whether the table has bloat/dead tuples, (2) whether statistics are stale, and (3) whether the buffer hit ratio has dropped.',
    hints: [
      'pg_stat_user_tables has n_dead_tup and last_autoanalyze',
      'For MSSQL: sys.dm_db_stats_properties has modification_counter and last_updated',
      'Buffer hit ratio: pg_statio_user_tables (PG) or sys.dm_os_performance_counters (MSSQL)',
      'If dead_pct > 10%, run VACUUM ANALYZE. If stats are stale, run UPDATE STATISTICS.',
    ],
    starterCode: `-- Diagnose slow query on the 'orders' table

-- 1. Check for table bloat (PostgreSQL)
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM /* which catalog view? */
WHERE relname = 'orders';

-- 2. Check for stale statistics (MSSQL)
SELECT s.name, sp.last_updated, sp.modification_counter
FROM sys.stats s
CROSS APPLY /* which function? */ sp
WHERE OBJECT_NAME(s.object_id) = 'Orders';

-- 3. Check buffer hit ratio (PostgreSQL)
SELECT relname, heap_blks_hit, heap_blks_read
FROM /* which catalog view? */
WHERE relname = 'orders';`,
    solution: `-- 1. Table bloat (PostgreSQL) — from pg_stat_user_tables
SELECT
    relname,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'orders';
-- If dead_pct > 10%: run VACUUM ANALYZE orders;

-- 2. Stale statistics (MSSQL) — sys.dm_db_stats_properties
SELECT
    s.name                  AS stat_name,
    sp.last_updated,
    sp.rows,
    sp.modification_counter -- rows changed since last stats update
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) sp
WHERE OBJECT_NAME(s.object_id) = 'Orders'
ORDER BY sp.modification_counter DESC;
-- If modification_counter > 20% of rows: run UPDATE STATISTICS dbo.Orders WITH FULLSCAN;

-- 3. Buffer hit ratio (PostgreSQL) — pg_statio_user_tables
SELECT
    relname,
    heap_blks_hit,
    heap_blks_read,
    ROUND(100.0 * heap_blks_hit
          / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) AS hit_pct
FROM pg_statio_user_tables
WHERE relname = 'orders';
-- If hit_pct < 95%: either insufficient shared_buffers or a new full-scan query is evicting pages.`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why does PostgreSQL need VACUUM but MSSQL does not (under default settings)?',
      options: [
        'PostgreSQL stores all data in a single file; MSSQL uses multiple files',
        'PostgreSQL MVCC keeps old row versions as dead tuples in-place; MSSQL uses TempDB for row versions and does not accumulate dead tuples in the table heap',
        'MSSQL automatically compresses dead rows; PostgreSQL does not',
        'VACUUM is optional in PostgreSQL — it only improves performance, not correctness',
      ],
      answer: 1,
      explanation: 'PostgreSQL MVCC stores old row versions as dead tuples in the heap file. VACUUM reclaims that space. MSSQL stores row versions in TempDB (for SNAPSHOT/RCSI) and does not leave dead tuples in the heap, so no VACUUM equivalent is needed.',
    },
    {
      q: 'What does the Write-Ahead Log guarantee?',
      options: [
        'Queries execute in the order they are submitted',
        'Committed transactions survive a server crash, because the log is written before the data pages',
        'Read queries never block write queries',
        'All data pages are written to disk before a transaction commits',
      ],
      answer: 1,
      explanation: 'WAL guarantees durability (the D in ACID). Changes are logged before being applied to data pages. On crash, the engine replays the log from the last checkpoint to restore all committed transactions — even if the data file pages were not yet flushed.',
    },
    {
      q: 'A PostgreSQL table\'s buffer hit ratio drops from 99% to 85% after a new nightly batch job starts. What is the most likely cause?',
      options: [
        'VACUUM is not running',
        'The batch job performs large sequential scans that evict hot pages from shared_buffers',
        'Statistics are stale',
        'The transaction log is full',
      ],
      answer: 1,
      explanation: 'Large sequential scans can "pollute" the buffer pool by evicting frequently-used OLTP pages and replacing them with scan pages that are never re-used. PostgreSQL has a ring buffer for sequential scans to limit this, but very large scans still impact shared_buffers.',
    },
    {
      q: 'What is the purpose of enabling RCSI (Read Committed Snapshot Isolation) in MSSQL?',
      options: [
        'It prevents all deadlocks',
        'It makes readers take shared locks, improving write throughput',
        'It stores old row versions in TempDB so readers do not block writers under READ COMMITTED',
        'It disables the transaction log for better performance',
      ],
      answer: 2,
      explanation: 'RCSI stores row versions in TempDB so that READ COMMITTED queries read the last committed version of a row without acquiring shared locks. This eliminates reader-writer blocking under the default isolation level, which is the most common cause of OLTP contention.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How much memory should I give to shared_buffers in PostgreSQL and the buffer pool in MSSQL?',
      a: 'PostgreSQL: set shared_buffers to ~25% of total RAM. PostgreSQL also uses the OS page cache extensively, so setting it higher than 40% can be counterproductive. Set effective_cache_size (a hint to the planner, not an allocation) to 50–75% of RAM. MSSQL: allow the buffer pool to use up to ~80–90% of RAM by setting max server memory. SQL Server\'s memory manager will dynamically scale down under OS pressure. Leave enough RAM for the OS and other processes (typically 2–4 GB).',
    },
    {
      q: 'What is TempDB contention and how do I fix it?',
      a: 'TempDB contention occurs when many concurrent sessions compete to allocate pages in TempDB, causing latch waits on allocation pages (PFS, GAM, SGAM). Symptoms: PAGELATCH_EX or PAGELATCH_SH waits on TempDB allocation pages in sys.dm_os_wait_stats. Fixes: (1) pre-create TempDB data files equal to the number of CPU cores (up to 8); (2) enable trace flags 1117 and 1118 (pre-SQL 2016) or use tempdb configuration in SQL Server 2016+ to set uniform file growth; (3) avoid excessive temp table creation in loops — use table variables or in-memory OLTP for small volatile sets.',
    },
    {
      q: 'What is the difference between VACUUM and VACUUM FULL in PostgreSQL?',
      a: 'VACUUM (plain): marks dead tuple space as reusable within the same file. Does not shrink the file on disk. Runs concurrently with reads and writes — safe to run on production tables at any time. This is what autovacuum runs. VACUUM FULL: rewrites the entire table to a new file, compacting it and returning space to the OS. Acquires an ACCESS EXCLUSIVE lock — blocks ALL reads and writes for the duration. Only use VACUUM FULL when a table has extreme bloat (e.g. after deleting 90% of rows) and the free space must be returned to the OS. Plan a maintenance window.',
    },
  ];
}
