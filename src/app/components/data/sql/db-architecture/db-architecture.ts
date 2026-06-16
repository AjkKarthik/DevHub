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
    { name: 'Streaming Replication', type: 'keyword', desc: 'PostgreSQL HA: primary streams WAL records in real-time to standby servers. Standbys replay WAL to stay in sync.' },
    { name: 'Always On AG',       type: 'keyword', desc: 'MSSQL Availability Groups: synchronous or asynchronous log shipping with automatic failover and readable secondaries.' },
    { name: 'Connection Pooling', type: 'keyword', desc: 'Reusing idle database connections instead of opening a new one per request. Reduces connection overhead on both client and server.' },
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
    {
      heading: 'Replication, high availability, and connection pooling',
      points: [
        '<strong>PostgreSQL streaming replication</strong>: the primary server sends WAL records in real-time to one or more standby servers, which replay them continuously. Synchronous replication (synchronous_commit = on) waits for at least one standby to acknowledge the WAL write before confirming commit — zero RPO at the cost of added latency. Asynchronous replication (the default) is faster but standby may lag by seconds.',
        '<strong>MSSQL Always On Availability Groups</strong>: a set of user databases that fail over together. Each AG has a primary replica (read-write) and up to 8 secondary replicas (read-only or HA-only). Secondary replicas can serve read-only queries — offloading reporting workloads from the primary. Failover can be automatic (synchronous replica + Windows Server Failover Cluster) or manual.',
        '<strong>Replication lag</strong> is the key health metric for any standby. In PostgreSQL, query pg_stat_replication on the primary for write_lag, flush_lag, and replay_lag. In MSSQL, query sys.dm_hadr_database_replica_states for redo_queue_size and estimated_recovery_time. Alert when lag exceeds your RPO threshold.',
        '<strong>Connection pooling</strong>: opening a new database connection is expensive (process/thread creation, TLS handshake, authentication). A connection pool maintains a set of idle, pre-authenticated connections and hands them to application requests. Tools: PgBouncer (PostgreSQL — transaction-mode pooling is the most efficient), Pgpool-II, or the built-in pool in frameworks (ADO.NET for MSSQL, HikariCP for Java). MSSQL has built-in connection pooling in the ADO.NET driver — no separate tool needed in most cases.',
        '<strong>Max connections and monitoring</strong>: PostgreSQL has a hard max_connections limit (default 100); each connection is a separate OS process (~5-10 MB RAM each). PgBouncer allows thousands of application connections to share a small pool of server connections. MSSQL is thread-based — max connections is limited by RAM and licensing rather than a hard config limit. Monitor active vs idle vs waiting connections via pg_stat_activity (PG) or sys.dm_exec_connections + sys.dm_exec_sessions (MSSQL) to catch connection leaks or pool exhaustion.',
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
    {
      label: 'Replication health (MSSQL + PG)',
      language: 'sql',
      code: `-- ── PostgreSQL: streaming replication health on the primary ─────────────
-- Query on the PRIMARY to see all connected standbys and their lag:
SELECT
    application_name,
    client_addr,
    state,                 -- 'streaming' = live; 'catchup' = behind
    sync_state,            -- 'sync' or 'async'
    write_lag,             -- time from primary WAL write to standby ack of write
    flush_lag,             -- time until standby flushes to its own disk
    replay_lag,            -- time until standby applies change to its data files
    sent_lsn,
    replay_lsn,
    (sent_lsn - replay_lsn) AS lag_bytes    -- bytes of unapplied WAL
FROM pg_stat_replication
ORDER BY replay_lag DESC;

-- Query on the STANDBY to check its own lag:
SELECT
    pg_is_in_recovery()         AS is_standby,
    pg_last_wal_receive_lsn()   AS last_received_lsn,
    pg_last_wal_replay_lsn()    AS last_applied_lsn,
    now() - pg_last_xact_replay_timestamp() AS replication_lag;

-- ── MSSQL: Always On AG health ───────────────────────────────────────────
-- AG overview: primary + secondaries, sync state, redo queue
SELECT
    ag.name                     AS ag_name,
    ars.role_desc               AS role,
    ars.operational_state_desc,
    ars.connected_state_desc,
    ars.synchronization_health_desc,
    drs.synchronization_state_desc,
    drs.redo_queue_size,        -- KB of WAL not yet replayed on secondary
    drs.estimated_recovery_time AS estimated_catchup_seconds
FROM sys.availability_groups            ag
JOIN sys.availability_replicas          ar  ON ar.group_id   = ag.group_id
JOIN sys.dm_hadr_availability_replica_states ars ON ars.replica_id = ar.replica_id
JOIN sys.dm_hadr_database_replica_states     drs ON drs.replica_id = ar.replica_id
ORDER BY ag.name, ars.role_desc;`,
    },
    {
      label: 'Connection monitoring',
      language: 'sql',
      code: `-- ── PostgreSQL: active connections and pool pressure ─────────────────────
-- Current connections by state and application:
SELECT
    datname                AS database,
    application_name,
    state,                 -- 'active', 'idle', 'idle in transaction', 'waiting'
    COUNT(*)               AS connections,
    MAX(EXTRACT(EPOCH FROM (now() - state_change)))::INT AS max_seconds_in_state
FROM pg_stat_activity
GROUP BY datname, application_name, state
ORDER BY connections DESC;

-- Long-running idle-in-transaction connections (connection leak indicator):
SELECT pid, datname, application_name, state, state_change,
       now() - state_change AS time_in_state,
       query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > INTERVAL '5 minutes'
ORDER BY time_in_state DESC;

-- Terminate a stuck connection (requires superuser):
SELECT pg_terminate_backend(pid)
FROM   pg_stat_activity
WHERE  pid <> pg_backend_pid()   -- don't kill yourself
  AND  state = 'idle in transaction'
  AND  now() - state_change > INTERVAL '30 minutes';

-- ── MSSQL: connection and session monitoring ──────────────────────────────
-- Active sessions: connection details + current request
SELECT
    s.session_id,
    s.login_name,
    s.program_name,
    s.status,
    r.wait_type,
    r.wait_time / 1000.0         AS wait_seconds,
    r.total_elapsed_time / 1000.0 AS elapsed_seconds,
    SUBSTRING(t.text, 1, 200)    AS current_sql
FROM sys.dm_exec_sessions   s
LEFT JOIN sys.dm_exec_requests r  ON r.session_id = s.session_id
OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE s.is_user_process = 1
ORDER BY wait_seconds DESC NULLS LAST;

-- Check for blocking chains:
SELECT
    blocked.session_id      AS blocked_session,
    blocking.session_id     AS blocking_session,
    blocked.wait_type,
    blocked.wait_time / 1000.0 AS blocked_seconds
FROM sys.dm_exec_requests blocked
JOIN sys.dm_exec_sessions blocking ON blocking.session_id = blocked.blocking_session_id
ORDER BY blocked_seconds DESC;`,
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
    {
      q: 'What happens during a database checkpoint?',
      options: [
        'All active transactions are rolled back',
        'All dirty (modified) buffer pages are flushed to data files on disk, and the LSN of the checkpoint is recorded in the log',
        'The WAL log is deleted and restarted from zero',
        'All user connections are terminated',
      ],
      answer: 1,
      explanation: 'A checkpoint flushes dirty pages from the buffer pool to data files and records the checkpoint LSN. This is important for recovery: after a crash, the engine only needs to replay the log from the most recent checkpoint LSN forward — making restart time predictable. Without checkpoints, recovery time would grow unboundedly.',
    },
    {
      q: 'In MSSQL, sys.databases shows log_reuse_wait_desc = \'LOG_BACKUP\'. What does this mean?',
      options: [
        'The log file is corrupt and needs to be rebuilt',
        'The database is in FULL recovery model and log space cannot be reused until a log backup is taken',
        'The database has no log file',
        'Active transactions are blocking log truncation',
      ],
      answer: 1,
      explanation: 'In FULL recovery model, the transaction log grows until a log backup is taken. LOG_BACKUP means the log is waiting for a backup before it can truncate inactive portions. Fix: take a transaction log backup (or switch to SIMPLE recovery model if you do not need point-in-time recovery). Other common values: ACTIVE_TRANSACTION (an open long-running transaction), REPLICATION (log reader agent is behind).',
    },
    {
      q: 'Why is PgBouncer transaction-mode pooling more efficient than session-mode pooling for PostgreSQL?',
      options: [
        'Transaction mode allows more concurrent transactions per connection',
        'In transaction mode, a server connection is held only for the duration of a transaction, not for the entire client session — so 1000 app connections can share 20 server connections',
        'Transaction mode bypasses authentication, reducing overhead',
        'Session mode uses more RAM per connection',
      ],
      answer: 1,
      explanation: 'In session-mode pooling, a server connection is assigned to a client for the entire session — while the client is idle between transactions, the server connection is held and unavailable to others. Transaction-mode pooling returns the connection to the pool after each transaction ends, allowing the same server connections to serve many more clients. This is critical because PostgreSQL server connections are expensive OS processes.',
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
    {
      q: 'What is the difference between synchronous and asynchronous replication in PostgreSQL?',
      a: 'In <strong>synchronous replication</strong> (<code>synchronous_commit = on</code>), the primary waits for at least one synchronous standby to acknowledge that the WAL record has been written (and optionally flushed) before returning success to the client. This gives zero data loss (RPO = 0) on planned failover, but adds network round-trip latency to every write. In <strong>asynchronous replication</strong> (the default), the primary returns success immediately after writing the WAL locally. The standby replays changes shortly after — typically milliseconds, but potentially seconds or more under heavy load. Asynchronous is faster but may lose a small window of commits on failover. Choose based on RPO requirements: zero-loss financial systems → synchronous; high-throughput analytics → asynchronous.',
    },
    {
      q: 'What causes "idle in transaction" connections and why are they dangerous?',
      a: '"Idle in transaction" means the application opened a transaction (BEGIN) but has not committed or rolled back, yet the connection is sitting idle. This is almost always a bug in application code — a transaction left open after completing its last SQL statement. These sessions are dangerous because: (1) they hold row-level or table-level locks, blocking writes to those rows; (2) in PostgreSQL, they prevent VACUUM from reclaiming dead tuples (the oldest transaction horizon stays pinned); (3) they consume a database connection slot indefinitely. Fix in code: always commit/rollback in a finally block. Operational fix: set <code>idle_in_transaction_session_timeout</code> (PostgreSQL) to auto-terminate sessions that have been idle in transaction for too long (e.g. 5 minutes).',
    },
    {
      q: 'When should I use connection pooling, and which tool should I choose?',
      a: 'Use connection pooling whenever your application creates more than ~20-30 concurrent database connections, or when connection setup time is measurable (e.g. microservices making short-lived requests). Without pooling, each request opens a new TCP connection + authentication handshake + session init — adds 5-50ms per request. For <strong>PostgreSQL</strong>: use <strong>PgBouncer</strong> in transaction mode for most workloads — it is lightweight, widely deployed, and handles thousands of app connections with ~20-50 server connections. For complex load balancing + read/write split, use Pgpool-II. For <strong>MSSQL</strong>: the ADO.NET driver has built-in connection pooling — it is enabled by default and usually sufficient. Only add external pooling if you need cross-process pooling or very fine-grained control. In both cases, set pool min/max sizes to match your workload: too large wastes server resources; too small causes connection starvation under load.',
    },
    {
      q: 'What does the MSSQL transaction log log_reuse_wait_desc = \'ACTIVE_TRANSACTION\' mean, and how do I find the blocking transaction?',
      a: '<code>ACTIVE_TRANSACTION</code> means an open (uncommitted) transaction is preventing log space from being reused. Even if the transaction is not doing anything, the log must retain all records since that transaction started (in case of rollback). Find the culprit: query <code>sys.dm_tran_active_transactions</code> joined to <code>sys.dm_exec_sessions</code> — look for the oldest transaction (largest transaction_begin_time). Common causes: long-running batch jobs that wrap thousands of rows in one transaction, or idle-in-transaction application connections. Fix: commit or break work into smaller batches. If the session is stuck, identify the session_id and kill it with <code>KILL session_id</code> — after verifying with the application team that rolling back is safe.',
    },
  ];
}
