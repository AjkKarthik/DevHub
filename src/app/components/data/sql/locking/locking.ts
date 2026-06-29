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
  selector: 'app-sql-locking',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './locking.html',
  styleUrls: ['./locking.scss']
})
export class SqlLocking {

  quickRef: QuickRefItem[] = [
    { name: 'Shared lock (S)',        type: 'keyword', desc: 'Acquired on read — multiple S locks can coexist' },
    { name: 'Exclusive lock (X)',     type: 'keyword', desc: 'Acquired on write — blocks all other locks' },
    { name: 'Update lock (U)',        type: 'keyword', desc: 'MSSQL: intermediate lock that prevents deadlock on read-then-write' },
    { name: 'WITH (UPDLOCK)',         type: 'keyword', desc: 'MSSQL hint: acquire U lock on read to prevent deadlock' },
    { name: 'WITH (NOLOCK)',          type: 'keyword', desc: 'MSSQL hint: skip locking — dirty reads possible' },
    { name: 'SELECT … FOR UPDATE',   type: 'keyword', desc: 'PostgreSQL / MSSQL: acquire X lock on selected rows' },
    { name: 'Deadlock',              type: 'keyword', desc: 'Two transactions each waiting for a lock the other holds' },
    { name: 'DEADLOCK_PRIORITY',     type: 'keyword', desc: 'MSSQL: control which session is chosen as deadlock victim' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Lock types and compatibility',
      points: [
        'Shared (S): multiple readers can hold S locks simultaneously. A writer waiting for an X lock is blocked until all S locks release.',
        'Exclusive (X): only one transaction can hold an X lock on a resource. All other S and X requests block.',
        'Update (U, MSSQL): acquired during the scan phase of UPDATE before promotion to X. Two U locks are incompatible, preventing the deadlock that two S→X promotions would cause.',
        'Intent locks (IS, IX, SIX) are held at the page/table level to signal what lower-level locks exist — the engine checks these before granting higher-level locks.',
      ]
    },
    {
      heading: 'What is a deadlock?',
      points: [
        'Deadlock: transaction A holds lock on resource 1 and waits for resource 2; transaction B holds resource 2 and waits for resource 1.',
        'The database detects the cycle and kills one transaction (the deadlock victim) with an error.',
        'MSSQL error 1205; PostgreSQL error 40P01 (deadlock_detected).',
      ]
    },
    {
      heading: 'Preventing deadlocks',
      points: [
        'Access resources in the same order across all transactions — if every transaction locks table A before table B, no cycle can form.',
        'Keep transactions short — the longer a lock is held, the more chance of a cycle.',
        'Use UPDLOCK hint (MSSQL) on SELECT before an UPDATE to convert S→U immediately rather than promoting later.',
        'Use SNAPSHOT isolation — readers never block and cannot cause S/X deadlocks.',
      ]
    },
    {
      heading: 'PostgreSQL locking',
      points: [
        'PostgreSQL uses MVCC — SELECT never acquires row locks. Only FOR UPDATE / FOR SHARE acquires explicit row-level locks.',
        'SELECT … FOR UPDATE: locks selected rows so concurrent transactions cannot lock or modify them.',
        'SELECT … FOR UPDATE SKIP LOCKED: skips already-locked rows — useful for job queue patterns.',
        'Table-level locks: LOCK TABLE … IN EXCLUSIVE MODE for schema changes or whole-table operations.',
      ]
    },
    {
      heading: 'Blocking vs locking',
      points: [
        'Blocking: a transaction waits for a lock — normal, temporary. Resolved when the lock holder commits/rolls back.',
        'Deadlock: circular blocking — requires database intervention to resolve.',
        'MSSQL: sys.dm_exec_requests shows blocking_session_id; sys.dm_os_wait_stats shows wait types.',
        'PostgreSQL: pg_stat_activity shows wait_event_type; pg_locks shows current lock holders and waiters.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL lock hints',
      language: 'sql',
      code: `-- UPDLOCK: acquire update lock on read to prevent S→X deadlock
BEGIN TRAN;
SELECT balance
FROM   accounts WITH (UPDLOCK)   -- holds U lock; blocks other U/X
WHERE  account_id = 1;

-- Safe to promote to X — no other transaction can be mid-promotion
UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
COMMIT;

-- HOLDLOCK: hold S lock until end of transaction (= SERIALIZABLE for the hint)
SELECT COUNT(*) FROM products WITH (HOLDLOCK) WHERE category_id = 3;

-- ROWLOCK: prefer row-level locks (hint; engine may escalate anyway)
UPDATE products WITH (ROWLOCK) SET price = price * 1.1 WHERE category_id = 3;

-- NOLOCK: read without acquiring locks (dirty reads possible)
SELECT COUNT(*) FROM orders WITH (NOLOCK);  -- approximate, never for financial data`
    },
    {
      label: 'MSSQL deadlock demo & fix',
      language: 'sql',
      code: `-- Classic deadlock pattern:
-- Session A:
BEGIN TRAN;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
-- Session B runs at same time:
-- BEGIN TRAN;
-- UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
-- UPDATE accounts SET balance = balance - 100 WHERE account_id = 1; -- waits for A
-- Session A continues:
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;  -- deadlock!

-- Fix 1: access in consistent order (always lowest account_id first)
BEGIN TRAN;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;

-- Fix 2: SNAPSHOT isolation (readers don't block)
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;

-- Fix 3: set deadlock priority (this session loses instead of winning)
SET DEADLOCK_PRIORITY LOW;

-- Catch deadlock in TRY/CATCH
BEGIN TRY
    BEGIN TRAN;
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
    COMMIT;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 1205  -- deadlock victim
        ROLLBACK;
    THROW;
END CATCH;`
    },
    {
      label: 'PostgreSQL FOR UPDATE / SKIP LOCKED',
      language: 'sql',
      code: `-- FOR UPDATE: lock rows to prevent concurrent modification
BEGIN;
SELECT * FROM accounts
WHERE  account_id = 1
FOR UPDATE;               -- X lock on this row

UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
COMMIT;

-- FOR UPDATE SKIP LOCKED: job queue pattern
-- Worker picks one unprocessed job, skipping jobs locked by other workers
BEGIN;
SELECT job_id, payload
FROM   job_queue
WHERE  status = 'pending'
ORDER  BY created_at
LIMIT  1
FOR UPDATE SKIP LOCKED;   -- atomically claim a job

UPDATE job_queue SET status = 'processing' WHERE job_id = <fetched_id>;
COMMIT;

-- FOR SHARE: shared lock — prevents DELETE/UPDATE but allows other FOR SHARE
SELECT * FROM products WHERE product_id = 5 FOR SHARE;

-- NOWAIT: fail immediately instead of waiting
SELECT * FROM accounts WHERE account_id = 1 FOR UPDATE NOWAIT;`
    },
    {
      label: 'Monitoring locks',
      language: 'sql',
      code: `-- MSSQL: find blocking sessions
SELECT
    r.session_id,
    r.blocking_session_id,
    r.wait_type,
    r.wait_time / 1000.0 AS wait_sec,
    SUBSTRING(t.text, (r.statement_start_offset/2)+1,
        ((r.statement_end_offset - r.statement_start_offset)/2)+1) AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;

-- MSSQL: kill a blocking session
KILL 57;   -- use with care

-- PostgreSQL: find blocked queries
SELECT
    blocked.pid,
    blocked.query AS blocked_query,
    blocking.pid  AS blocking_pid,
    blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
     ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.wait_event_type = 'Lock';

-- PostgreSQL: terminate blocking connection
SELECT pg_terminate_backend(blocking_pid);`
    },
  ];

  challenge: Challenge = {
    title: 'Safe inventory deduction with locking',
    language: 'sql',
    description: 'Write a transaction that safely deducts stock for a product: read the current stock, check it is sufficient, then deduct. Prevent two concurrent transactions from both seeing enough stock and both deducting (double-booking). Use explicit locking rather than SERIALIZABLE isolation. Write both MSSQL (WITH UPDLOCK) and PostgreSQL (FOR UPDATE) versions.',
    hints: [
      'MSSQL: SELECT stock FROM products WITH (UPDLOCK) WHERE product_id = 1 — acquires U lock preventing concurrent reads from also acquiring U.',
      'PostgreSQL: SELECT stock FROM products WHERE product_id = 1 FOR UPDATE — exclusive row lock.',
      'Both prevent the race: the second transaction blocks on the lock until the first commits.',
    ],
    starterCode: `-- MSSQL version
BEGIN TRAN;
DECLARE @stock INT;
-- read with lock
SELECT @stock = stock FROM products /* lock hint */ WHERE product_id = 1;
IF @stock >= 5
BEGIN
    UPDATE products SET stock = stock - 5 WHERE product_id = 1;
    INSERT INTO order_items (product_id, qty) VALUES (1, 5);
END;
COMMIT;`,
    solution: `-- MSSQL: UPDLOCK prevents concurrent S-lock readers from proceeding to UPDATE
BEGIN TRAN;
DECLARE @stock INT;
SELECT @stock = stock
FROM   products WITH (UPDLOCK, ROWLOCK)
WHERE  product_id = 1;

IF @stock >= 5
BEGIN
    UPDATE products SET stock = stock - 5 WHERE product_id = 1;
    INSERT INTO order_items (product_id, qty) VALUES (1, 5);
END;
ELSE
    PRINT 'Insufficient stock';
COMMIT;

-- PostgreSQL: FOR UPDATE acquires X row lock on read
BEGIN;
DECLARE v_stock INT;
SELECT stock INTO v_stock
FROM   products
WHERE  product_id = 1
FOR UPDATE;   -- blocks concurrent FOR UPDATE until this transaction commits

IF v_stock >= 5 THEN
    UPDATE products SET stock = stock - 5 WHERE product_id = 1;
    INSERT INTO order_items (product_id, qty) VALUES (1, 5);
ELSE
    RAISE NOTICE 'Insufficient stock';
END IF;
COMMIT;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of the Update (U) lock in MSSQL?',
      options: [
        'To allow multiple transactions to update the same row simultaneously',
        'To prevent the S→X promotion deadlock by acquiring an intermediate lock during the scan phase',
        'To signal intent to lock at a lower granularity',
        'To lock the entire table during UPDATE statements'
      ],
      answer: 1,
      explanation: 'Without U locks, two transactions can both acquire S locks on a row, then both try to promote to X — neither can because the other holds S. U locks are incompatible with each other, so only one transaction proceeds to X at a time.'
    },
    {
      q: 'What does SELECT … FOR UPDATE SKIP LOCKED do in PostgreSQL?',
      options: [
        'Skips the locking step for performance',
        'Returns rows that are NOT locked, skipping any rows already locked by other transactions',
        'Updates the skipped rows in a background transaction',
        'Locks all rows except those matching the SKIP condition'
      ],
      answer: 1,
      explanation: 'FOR UPDATE SKIP LOCKED is a job queue pattern: each worker picks only rows not already claimed by another worker, avoiding the blocking wait. Without SKIP LOCKED, workers queue up waiting for the lock.'
    },
    {
      q: 'A deadlock occurs — which transaction does MSSQL kill?',
      options: [
        'The transaction that has been running longest',
        'The transaction that holds the most locks',
        'The transaction with the lowest DEADLOCK_PRIORITY, or the one whose rollback is cheapest',
        'Always the transaction that issued the second conflicting lock'
      ],
      answer: 2,
      explanation: 'MSSQL picks the deadlock victim by comparing DEADLOCK_PRIORITY settings first. If equal, it kills the transaction that is cheapest to roll back (fewest log bytes written). You can bias this with SET DEADLOCK_PRIORITY LOW/HIGH.'
    },
    {
      q: 'Why does PostgreSQL MVCC mean that a plain SELECT never blocks a writer?',
      options: [
        'PostgreSQL only supports table-level locking',
        'SELECT acquires no row locks — it reads from a consistent snapshot of committed data without locking rows',
        'PostgreSQL readers always have higher priority than writers',
        'PostgreSQL automatically retries blocked reads'
      ],
      answer: 1,
      explanation: 'MVCC keeps old row versions so readers always find a consistent committed snapshot without acquiring locks. Writers create new row versions. Neither needs to wait for the other.'
    },
    {
      q: 'What does sp_getapplock do in MSSQL?',
      options: [
        'Acquires a named application-level lock that has no associated database object',
        'Gets the current lock count for an application',
        'Returns a list of locks held by the current session',
        'Prevents the application from acquiring new locks'
      ],
      answer: 0,
      explanation: 'sp_getapplock acquires a named mutex-style lock scoped to a session or transaction. It is commonly used to serialize access to a critical section (e.g., a batch job that must not run concurrently) without creating a real database object to lock on.'
    },
    {
      q: 'What is a deadlock graph and how do you capture one in MSSQL?',
      options: [
        'A deadlock graph is a visual representation of index fragmentation',
        'An XML document captured by the system_health Extended Event session showing the processes and resources involved in a deadlock cycle',
        'A chart showing lock wait times per query over time',
        'A report generated by DBCC CHECKDB showing lock conflicts'
      ],
      answer: 1,
      explanation: 'SQL Server automatically captures deadlock graphs in the system_health XEvent session. Query the ring buffer: SELECT … FROM sys.dm_xe_session_targets where target_name = \'ring_buffer\' — or use SSMS Locks/Blocked Processes report to view them. The graph shows each victim, blocker, and the resources they contested.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is lock escalation and how does it affect performance?',
      a: 'Lock escalation is when SQL Server converts many fine-grained row/page locks into a single coarser table lock to reduce memory overhead (default threshold: 5 000 row locks). A table lock blocks all concurrent access. Prevent it with ALTER TABLE … SET (LOCK_ESCALATION = DISABLE) — but only when you have confirmed escalation is the bottleneck via sys.dm_os_wait_stats.',
    },
    {
      q: 'How do I find out which query is blocking mine in production?',
      a: 'MSSQL: query sys.dm_exec_requests filtering on blocking_session_id > 0 and use sys.dm_exec_sql_text to decode the blocking SQL. PostgreSQL: query pg_stat_activity joined via pg_blocking_pids(). In both cases, note the blocking PID, investigate the query, and decide whether to wait, kill the blocker, or retry.',
    },
    {
      q: 'Should I use WITH (NOLOCK) to speed up reporting queries?',
      a: 'Only as a last resort and never for financial or inventory data. NOLOCK (READ UNCOMMITTED) can return dirty reads, phantom rows (rows read twice or not at all due to page splits during the scan), and even corrupted rows in rare cases. A better option for MSSQL is enabling READ_COMMITTED_SNAPSHOT at the database level — no dirty reads, no blocking, and no hint required.',
    },
    {
      q: 'How do you prevent deadlocks by controlling lock acquisition order?',
      a: 'Access tables in a consistent alphabetical or dependency order across all transactions — if every transaction locks TableA before TableB, neither can form a cycle. For row-level locks, order by primary key: WHERE id IN (1, 5, 9) ORDER BY id so all concurrent transactions acquire row locks in the same ascending sequence.',
    },
    {
      q: 'What is the difference between SELECT … FOR SHARE and FOR UPDATE in PostgreSQL?',
      a: 'FOR SHARE acquires a shared lock on selected rows — other transactions can also acquire FOR SHARE but not FOR UPDATE or write to those rows. FOR UPDATE acquires an exclusive lock, blocking other FOR SHARE or FOR UPDATE on the same rows. Use FOR SHARE when you want to prevent concurrent updates but still allow concurrent readers; use FOR UPDATE when you intend to update the rows in the same transaction.',
    },
    {
      q: 'What does NOWAIT do on a locking SELECT and when should you use it?',
      a: 'SELECT … FOR UPDATE NOWAIT (PostgreSQL) or SELECT … WITH (UPDLOCK, NOWAIT) (MSSQL) returns an error immediately if any of the requested rows are locked — instead of waiting for the lock to be released. Use it in user-facing workflows where you want to detect contention and retry or show a "busy" message rather than silently blocking the request thread.',
    },
  ];
}
