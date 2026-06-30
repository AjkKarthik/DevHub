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
  selector: 'app-sql-connection-pooling',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './connection-pooling.html',
  styleUrls: ['./connection-pooling.scss']
})
export class SqlConnectionPooling {

  quickRef: QuickRefItem[] = [
    { name: 'Connection pool',           type: 'keyword', desc: 'Cache of reusable database connections — avoids the cost of connect/disconnect per query' },
    { name: 'min / max pool size',       type: 'keyword', desc: 'Pool keeps min connections warm; rejects requests when max is reached' },
    { name: 'Connection timeout',        type: 'keyword', desc: 'How long to wait for a pooled connection before throwing an error' },
    { name: 'Command timeout',           type: 'keyword', desc: 'How long to wait for a query to complete before cancelling it' },
    { name: 'PgBouncer',                 type: 'keyword', desc: 'PostgreSQL lightweight connection pooler — transaction/session/statement modes' },
    { name: 'pgpool-II',                 type: 'keyword', desc: 'PostgreSQL pooler with load balancing and replication' },
    { name: 'sys.dm_exec_sessions (MSSQL)', type: 'keyword', desc: 'Active sessions and their wait stats, CPU, I/O' },
    { name: 'pg_stat_activity (PG)',     type: 'keyword', desc: 'PostgreSQL: current sessions, states, and active queries' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why connection pooling matters',
      points: [
        'Opening a TCP connection + TLS handshake + database authentication takes 20–200ms. Doing this per query kills throughput.',
        'A connection pool keeps N connections open and lends them to application threads — acquisition cost drops to microseconds.',
        'Without pooling, a web app with 500 concurrent requests would open 500 database connections — most databases struggle above a few hundred simultaneous connections (each consumes memory and a backend process/thread).',
        'Most application frameworks include built-in pooling: ADO.NET connection pooling (MSSQL), HikariCP (Java/JVM), Npgsql (C#/PostgreSQL), SQLAlchemy (Python).',
      ]
    },
    {
      heading: 'MSSQL: ADO.NET connection pooling',
      points: [
        'Enabled by default. Controlled via the connection string: Min Pool Size=5; Max Pool Size=100; Connection Timeout=30.',
        'Pool is keyed by the exact connection string — two strings that differ even by whitespace create separate pools.',
        'Connection Lifetime: maximum seconds a connection stays in the pool before being discarded (useful for load-balanced servers).',
        'Clear bad connections with SqlConnection.ClearPool(conn) or ClearAllPools() after a failover.',
      ]
    },
    {
      heading: 'PostgreSQL: PgBouncer',
      points: [
        'PostgreSQL server processes are heavyweight — each connection forks a backend process consuming ~5–10MB RAM.',
        'PgBouncer sits between app and Postgres and multiplexes many app connections onto a small pool of server connections.',
        'Transaction mode (recommended for most apps): server connection is released back to the pool after each transaction completes — maximum efficiency.',
        'Session mode: one server connection per client session — safer for apps that use session-level features (SET LOCAL, advisory locks, prepared statements without re-binding).',
        'max_client_conn (PgBouncer): total app connections accepted. pool_size: max server connections per database/user pair.',
      ]
    },
    {
      heading: 'Pool sizing',
      points: [
        'Pgbouncer / Postgres rule of thumb: server connections = num_cores * 2 + num_disk_spindles (often 10–20 per Postgres instance).',
        'App pool: tune so idle connections are < 20% of max — unused connections hold server resources.',
        'Monitor wait queue depth: if requests regularly wait for a pooled connection, either increase pool size or the server cannot handle more parallelism (CPU bottleneck).',
        'Too many connections is its own problem: context switching and lock contention increase. Smaller pool with a queue is often faster than a large pool.',
      ]
    },
    {
      heading: 'Monitoring connections',
      points: [
        'MSSQL: sys.dm_exec_sessions (active), sys.dm_exec_connections (physical connections), sys.dm_os_wait_stats (aggregate waits).',
        'PostgreSQL: SELECT count(*), state FROM pg_stat_activity GROUP BY state; — idle = pooled but unused, idle in transaction = open transaction not committing (dangerous).',
        'Idle in transaction is a major hazard: the connection holds locks but does nothing. Set idle_in_transaction_session_timeout = \'30s\' in PostgreSQL to auto-kill them.',
        'MSSQL: set a command timeout in the application; for long-running queries use KILL spid to reclaim a hung connection.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ADO.NET pool (MSSQL / C#)',
      language: 'sql',
      code: `-- Connection string with pool settings (configure in appsettings.json)
-- Server=myserver;Database=MyDB;User Id=app_user;Password=...;
-- Min Pool Size=5;Max Pool Size=100;
-- Connection Timeout=30;Command Timeout=60;
-- Connection Lifetime=300;

-- Monitor pool usage from the server side
SELECT
    s.login_name,
    s.status,
    s.cpu_time,
    s.memory_usage,
    s.total_elapsed_time / 1000 AS elapsed_s,
    r.wait_type,
    r.blocking_session_id
FROM sys.dm_exec_sessions s
LEFT JOIN sys.dm_exec_requests r ON r.session_id = s.session_id
WHERE s.is_user_process = 1
ORDER BY s.cpu_time DESC;

-- Count connections per login
SELECT login_name, COUNT(*) AS connection_count
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
GROUP BY login_name
ORDER BY connection_count DESC;

-- Kill a blocking session
KILL 57;  -- replace with the spid from blocking_session_id above`
    },
    {
      label: 'PgBouncer config (PostgreSQL)',
      language: 'sql',
      code: `-- pgbouncer.ini (key settings)
-- [databases]
-- mydb = host=127.0.0.1 port=5432 dbname=mydb
--
-- [pgbouncer]
-- pool_mode          = transaction      -- release conn after each txn
-- max_client_conn    = 1000             -- total app connections accepted
-- default_pool_size  = 20              -- server conns per db/user pair
-- min_pool_size      = 5
-- reserve_pool_size  = 5               -- emergency extra conns
-- server_idle_timeout = 600
-- client_idle_timeout = 0
-- log_connections    = 0               -- turn off in prod (noisy)

-- Monitor PgBouncer from psql connected to the pgbouncer admin db:
-- SHOW POOLS;
-- SHOW CLIENTS;
-- SHOW SERVERS;
-- SHOW STATS;

-- Monitor Postgres connections directly
SELECT
    state,
    COUNT(*) AS conn_count,
    MAX(EXTRACT(EPOCH FROM (now() - state_change))) AS max_age_s
FROM pg_stat_activity
WHERE datname = 'mydb'
GROUP BY state
ORDER BY conn_count DESC;`
    },
    {
      label: 'Idle-in-transaction detection (PostgreSQL)',
      language: 'sql',
      code: `-- Find connections idle in transaction (holding locks)
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    EXTRACT(EPOCH FROM (now() - state_change)) AS idle_in_txn_seconds,
    LEFT(query, 100) AS last_query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY idle_in_txn_seconds DESC;

-- Auto-kill after 30 seconds (add to postgresql.conf)
-- idle_in_transaction_session_timeout = '30s'

-- Manually terminate a stuck session
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND state_change < now() - INTERVAL '5 minutes';

-- Set statement timeout for a session (kills runaway queries)
SET statement_timeout = '30s';

-- Connection limit per role
ALTER ROLE app_user CONNECTION LIMIT 50;`
    },
    {
      label: 'Pool sizing diagnostics',
      language: 'sql',
      code: `-- MSSQL: connection waits (RESOURCE_SEMAPHORE_QUERY_COMPILE = memory pressure)
SELECT wait_type, waiting_tasks_count, wait_time_ms / 1000.0 AS wait_s
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN (
    'SLEEP_TASK','LAZYWRITER_SLEEP','BROKER_TO_FLUSH',
    'CLR_AUTO_EVENT','DISPATCHER_QUEUE_SEMAPHORE',
    'FT_IFTS_SCHEDULER_IDLE_WAIT','HADR_WORK_QUEUE',
    'REQUEST_FOR_DEADLOCK_MONITOR','RESOURCE_QUEUE',
    'SERVER_IDLE_CHECK','SLEEP_DBSTARTUP','SLEEP_DBRECOVER',
    'SLEEP_MASTERDBREADY','SLEEP_MASTERMDREADY',
    'SLEEP_MASTERUPGRADED','SLEEP_MSDBSTARTUP',
    'SLEEP_TEMPDBSTARTUP','SNI_HTTP_ACCEPT',
    'WAIT_XTP_OFFLINE_CKPT_NEW_LOG','XE_DISPATCHER_WAIT',
    'XE_TIMER_EVENT'
)
ORDER BY wait_time_ms DESC;

-- PostgreSQL: long-running queries (potential connection hogs)
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > INTERVAL '5 minutes'
  AND state != 'idle'
ORDER BY duration DESC;`
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose a connection exhaustion incident',
    language: 'sql',
    description: 'Your application is throwing "connection pool exhausted" errors under load. Write diagnostic queries for both MSSQL and PostgreSQL to: (1) Count connections grouped by state and login/user. (2) Identify sessions that have been idle in transaction for more than 60 seconds. (3) Show the top 5 longest-running active queries. Use this information to decide whether to increase pool size or fix the application.',
    hints: [
      'MSSQL: sys.dm_exec_sessions for state; sys.dm_exec_requests for active queries with elapsed time.',
      'PostgreSQL: pg_stat_activity has state (\'idle\', \'active\', \'idle in transaction\'), state_change timestamp, and query text.',
      'Idle in transaction for 60+ seconds almost always means the application forgot to commit — fix the app, not the pool size.',
    ],
    starterCode: `-- (1) Count by state and user
-- MSSQL:
SELECT ... FROM sys.dm_exec_sessions WHERE is_user_process = 1 ...

-- PostgreSQL:
SELECT ... FROM pg_stat_activity WHERE datname = 'mydb' ...

-- (2) Idle in transaction > 60s
-- MSSQL: (no direct "idle in transaction" state — look for open txn with no active request)
-- PostgreSQL:
SELECT ... FROM pg_stat_activity WHERE state = 'idle in transaction' ...

-- (3) Top 5 longest active queries
-- MSSQL:
SELECT TOP 5 ... FROM sys.dm_exec_requests r ...
-- PostgreSQL:
SELECT ... FROM pg_stat_activity WHERE state = 'active' ORDER BY ... LIMIT 5;`,
    solution: `-- MSSQL

-- (1) Connections by state and login
SELECT login_name, status, COUNT(*) AS cnt
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
GROUP BY login_name, status
ORDER BY cnt DESC;

-- (2) Open transactions with no active request (proxy for idle-in-transaction)
SELECT s.session_id, s.login_name, s.status,
       s.open_transaction_count,
       s.last_request_start_time,
       DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) AS idle_s
FROM sys.dm_exec_sessions s
WHERE s.is_user_process = 1
  AND s.open_transaction_count > 0
  AND NOT EXISTS (SELECT 1 FROM sys.dm_exec_requests r WHERE r.session_id = s.session_id)
  AND DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) > 60
ORDER BY idle_s DESC;

-- (3) Top 5 longest active queries
SELECT TOP 5
    r.session_id,
    r.total_elapsed_time / 1000 AS elapsed_s,
    r.cpu_time / 1000 AS cpu_s,
    r.logical_reads,
    t.text AS query_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.status = 'running'
ORDER BY r.total_elapsed_time DESC;

-- PostgreSQL

-- (1) Connections by state and user
SELECT usename, state, COUNT(*) AS cnt
FROM pg_stat_activity
WHERE datname = 'mydb'
GROUP BY usename, state
ORDER BY cnt DESC;

-- (2) Idle in transaction > 60s
SELECT pid, usename, application_name, client_addr,
       EXTRACT(EPOCH FROM (now() - state_change)) AS idle_s,
       LEFT(query, 100) AS last_query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND state_change < now() - INTERVAL '60 seconds'
ORDER BY idle_s DESC;

-- (3) Top 5 longest active queries
SELECT pid, usename, now() - query_start AS duration,
       LEFT(query, 200) AS query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC
LIMIT 5;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why does opening a new database connection per query kill application performance?',
      options: [
        'Each connection creates a new database file',
        'Each connection requires TCP handshake, TLS negotiation, and database authentication — typically 20–200ms overhead per query',
        'The database limits queries to one per second per connection',
        'Connections use excessive CPU on the application server'
      ],
      answer: 1,
      explanation: 'The network round-trip plus TLS plus authentication overhead often exceeds the query execution time for fast queries. A connection pool eliminates this by keeping connections alive and lending them to threads in microseconds.'
    },
    {
      q: 'What is PgBouncer\'s "transaction mode" and why is it the recommended pool mode?',
      options: [
        'PgBouncer commits all transactions automatically — no explicit COMMIT needed',
        'PgBouncer returns the server connection to the pool after each transaction completes, so many app connections share a small number of server connections efficiently',
        'PgBouncer batches all queries from a session into a single transaction',
        'PgBouncer wraps all queries in savepoints for automatic rollback'
      ],
      answer: 1,
      explanation: 'In transaction mode, the server connection is held only for the duration of the transaction, then released. An app with 1000 concurrent clients can share, say, 20 Postgres backend processes — each only in use while a transaction is active. Idle app connections consume no server resources.'
    },
    {
      q: 'What is dangerous about connections stuck in "idle in transaction" state?',
      options: [
        'They consume excessive network bandwidth',
        'They hold database locks, preventing other queries from accessing the rows or tables they locked — causing cascading slowdowns',
        'They prevent new connections from being established',
        'They cause the connection pool to grow unboundedly'
      ],
      answer: 1,
      explanation: 'A transaction that has run a DML statement holds row or page locks until it commits or rolls back. If the application thread then idles without committing (e.g. waiting for user input, or a bug), those locks block all other writers trying to access the same rows — potentially for minutes or hours.'
    },
    {
      q: 'Is a larger connection pool always better for performance?',
      options: [
        'Yes — more connections means more parallelism',
        'No — beyond a point, more connections increase context switching and lock contention; a smaller pool with a queue is often faster',
        'Yes — but only for read-only workloads',
        'No — connection pools are only useful for write-heavy workloads'
      ],
      answer: 1,
      explanation: 'Databases are ultimately limited by CPU cores and I/O throughput. Adding more simultaneous connections beyond that limit causes the OS to context-switch more, and SQL engines contend more on internal latches. The sweet spot (often 2× CPU cores for CPU-bound workloads) with a request queue frequently outperforms large pools where all connections compete.'
    },
    {
      q: 'What does HikariCP (Java) recommend as the formula for pool size?',
      options: [
        'pool_size = threads × 2',
        'pool_size = (cores × 2) + effective_spindle_count',
        'pool_size = max_connections / app_instances',
        'pool_size = average_query_time_ms × requests_per_second'
      ],
      answer: 1,
      explanation: 'The HikariCP "about pool sizing" article recommends: connections = (core_count × 2) + effective_spindle_count. For an 8-core server with SSDs (spindle count ≈ 1), that is 17 connections. This often surprises developers expecting a much larger pool.'
    },
    {
      q: 'What does the Min Pool Size (or min_size) setting control in a connection pool?',
      options: [
        'The minimum number of queries per connection before the connection is recycled',
        'The minimum number of connections the pool keeps open even during idle periods',
        'The minimum allowed connection timeout in milliseconds',
        'The minimum connection pool size across all application instances'
      ],
      answer: 1,
      explanation: 'Min Pool Size keeps a floor of open connections alive so that bursts of traffic do not incur reconnection latency. Set it to the baseline concurrency expected during off-peak hours. Setting it too high wastes database connections during idle periods.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I handle connection pool exhaustion gracefully in the application?',
      a: 'First diagnose: are connections leaked (app not returning them to the pool) or is the pool genuinely too small for the load? Leaked connections are the most common cause — ensure every connection is in a using block (C#) or finally block (Java/Python) so they are always returned. For genuine overload: increase pool size incrementally while monitoring server-side CPU/memory; add a wait queue with a short timeout; return HTTP 503 rather than waiting indefinitely. PgBouncer\'s server_login_retry setting softens thundering-herd reconnection storms.',
    },
    {
      q: 'ADO.NET pools by exact connection string — what can go wrong?',
      a: 'If your app generates connection strings dynamically (e.g. appending different options per request), each unique string creates a new pool. The result: hundreds of pools of size 1 instead of one pool of size 100 — defeating pooling entirely. Always use a canonical, static connection string. Use SqlConnectionStringBuilder to normalise it if you must vary options.',
    },
    {
      q: 'Can I use PgBouncer with prepared statements?',
      a: 'Not transparently in transaction mode. Prepared statements are session-scoped in PostgreSQL, but in transaction mode the server connection changes between transactions — the prepared statement is gone. Solutions: (1) Use simple query protocol instead of prepared statements. (2) Use PgBouncer\'s session mode (less efficient). (3) Use pgpool-II which has protocol-aware prepared statement tracking. (4) Use Npgsql\'s max_auto_prepare = 0 to disable prepared statements when behind PgBouncer.',
    },
    {
      q: 'How do I detect connection leaks in a pool?',
      a: 'Monitor pool metrics: if the "active connections" gauge grows over time without a corresponding increase in load, connections are being borrowed and not returned. In HikariCP set leakDetectionThreshold to log a warning when a connection is held longer than that threshold. In ADO.NET, enable connection lifetime and check sys.dm_exec_sessions for sessions in "sleeping" state longer than expected. Always use using blocks or try/finally to ensure disposal.',
    },
    {
      q: 'When should I use pgpool-II vs PgBouncer?',
      a: 'PgBouncer is a lightweight, fast proxy focused purely on connection pooling — it adds minimal overhead and is the default recommendation for most workloads. pgpool-II adds query load balancing (distribute SELECTs across replicas), connection pooling, and replication management. Choose pgpool-II when you need transparent read-scaling across multiple PostgreSQL nodes; otherwise PgBouncer is simpler to operate and debug.',
    },
    {
      q: 'How does the database enforce a maximum connection limit?',
      a: 'PostgreSQL enforces max_connections in postgresql.conf — new connection attempts beyond that limit immediately receive "sorry, too many clients already." MSSQL uses the max connections server property (0 = unlimited, but OS/hardware constrained). At the pool layer, Max Pool Size (ADO.NET/HikariCP) throttles the app before hitting the database limit — the pool queue absorbs burst traffic rather than letting clients hit database errors.',
    },
  ];
}
