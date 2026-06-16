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
  selector: 'app-sql-transactions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class SqlTransactions {

  quickRef: QuickRefItem[] = [
    { name: 'BEGIN TRANSACTION',       type: 'keyword', desc: 'Starts an explicit transaction; all subsequent DML is part of it until COMMIT or ROLLBACK', since: 'SQL-92' },
    { name: 'COMMIT',                  type: 'keyword', desc: 'Persists all changes in the transaction permanently to durable storage', since: 'SQL-92' },
    { name: 'ROLLBACK',                type: 'keyword', desc: 'Undoes all changes back to BEGIN or the last named SAVEPOINT', since: 'SQL-92' },
    { name: 'SAVEPOINT',               type: 'keyword', desc: 'Creates a named point within a transaction for partial rollback (PostgreSQL: SAVEPOINT sp1; MSSQL: SAVE TRANSACTION sp1)', since: 'SQL-92' },
    { name: 'ACID',                    type: 'keyword', desc: 'Atomicity, Consistency, Isolation, Durability — the four core transaction guarantees', since: 'General' },
    { name: 'READ UNCOMMITTED',        type: 'keyword', desc: 'Lowest isolation; dirty reads allowed — can read uncommitted, potentially rolled-back data', since: 'SQL-92' },
    { name: 'READ COMMITTED',          type: 'keyword', desc: 'Default in MSSQL/PostgreSQL; reads only committed data; non-repeatable reads possible', since: 'SQL-92' },
    { name: 'REPEATABLE READ',         type: 'keyword', desc: 'Holds read locks; same row read twice returns same value; phantom reads still possible (MSSQL)', since: 'SQL-92' },
    { name: 'SERIALIZABLE',            type: 'keyword', desc: 'Highest isolation; prevents all anomalies; highest blocking potential', since: 'SQL-92' },
    { name: 'SNAPSHOT (MSSQL)',        type: 'keyword', desc: 'Readers see a snapshot from transaction start; no read-write blocking; needs version store', since: 'MSSQL 2005' },
    { name: 'XACT_STATE()',            type: 'function', desc: '1 = active committable, -1 = uncommittable (must rollback), 0 = no active transaction', since: 'MSSQL' },
    { name: 'Deadlock (error 1205)',   type: 'keyword', desc: 'Two transactions hold locks the other needs; DB terminates the cheaper victim (MSSQL error 1205)', since: 'General' },
    { name: 'WITH (NOLOCK)',           type: 'keyword', desc: 'MSSQL table hint: READ UNCOMMITTED for that table; allows dirty reads to avoid blocking', since: 'MSSQL' },
    { name: 'WITH (UPDLOCK)',          type: 'keyword', desc: 'Promote a shared lock to an update lock at read time to prevent lost updates', since: 'MSSQL' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ACID — the four transaction guarantees',
      points: [
        '<strong>Atomicity</strong>: a transaction is all-or-nothing. Either all statements commit together or none do. A failure mid-transaction (hardware crash, constraint violation, deadlock) automatically rolls back every change made so far. The write-ahead log enables this by recording changes before applying them.',
        '<strong>Consistency</strong>: a transaction takes the database from one valid state to another. All constraints — primary keys, foreign keys, CHECK constraints, UNIQUE indexes — must hold before and after the transaction. A constraint violation causes an automatic rollback of the violating statement (and the whole transaction if autocommit is off).',
        '<strong>Isolation</strong>: concurrent transactions are invisible to each other until committed (to a configurable degree). Without isolation, concurrent transactions would interfere — reading each other\'s partial writes, updating the same rows concurrently, or seeing different data on successive reads. Isolation level is the knob that trades isolation strength for concurrency.',
        '<strong>Durability</strong>: once committed, changes survive crashes. The database writes transaction data to the write-ahead log (WAL) on durable storage before acknowledging COMMIT. On recovery after a crash, the WAL is replayed to restore committed transactions and undo uncommitted ones.',
        'ACID is often contrasted with BASE (Basically Available, Soft state, Eventually consistent) — the model used by most NoSQL databases that sacrifice strict consistency for higher availability and partition tolerance. Understanding this tradeoff is foundational for system design interviews.',
      ],
    },
    {
      heading: 'Concurrency anomalies — dirty reads, phantoms, and lost updates',
      points: [
        'A <strong>dirty read</strong> occurs when a transaction reads data written by another uncommitted transaction. If the writer rolls back, the reader has seen data that never existed. Prevented at READ COMMITTED and above.',
        'A <strong>non-repeatable read</strong> occurs when a transaction reads the same row twice and gets different values — another committed transaction modified it between reads. Prevented at REPEATABLE READ and above.',
        'A <strong>phantom read</strong> occurs when a transaction re-executes a range query and gets different rows — another committed transaction inserted or deleted rows in the range. Prevented at SERIALIZABLE. PostgreSQL also prevents phantoms at REPEATABLE READ due to its MVCC implementation.',
        'A <strong>lost update</strong> occurs when two transactions read the same row, both modify it, and the second commit overwrites the first without seeing it. Example: two sessions both read balance=1000, both subtract 100, both write back 900 — one deduction is lost. Prevented with REPEATABLE READ, SERIALIZABLE, optimistic locking (version check), or pessimistic locking (SELECT … WITH (UPDLOCK)).',
        'A <strong>write skew</strong> (SERIALIZABLE level only) occurs when two transactions each read a set of rows, make decisions based on those reads, and write to different rows — their combined effect violates a constraint that neither individual write violates alone. Example: two doctors both check "at least 1 doctor on call" and each goes off call — the invariant is broken. Only SERIALIZABLE isolation prevents this.',
      ],
    },
    {
      heading: 'Isolation levels — the concurrency tradeoff',
      points: [
        'Higher isolation = fewer anomalies, more blocking, lower throughput. Lower isolation = more concurrency anomalies, less blocking, higher throughput. The four standard levels in ascending isolation order: READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE. Each prevents additional anomalies at the cost of more locking.',
        '<strong>READ UNCOMMITTED</strong>: allows dirty reads — a transaction can read rows modified by another uncommitted transaction. Never use in production for business logic; occasionally used for non-critical reporting where blocking is unacceptable and stale data is tolerable.',
        '<strong>READ COMMITTED</strong> (default in MSSQL and PostgreSQL): prevents dirty reads. A SELECT re-acquires its shared lock statement-by-statement, so the same row read twice in the same transaction may return different values (non-repeatable read). This is the recommended default for most OLTP workloads.',
        '<strong>REPEATABLE READ</strong>: holds shared locks on all read rows until transaction end — the same row read twice returns the same value. In MSSQL, phantom rows (new inserts by other transactions) are still possible. In PostgreSQL, MVCC extends REPEATABLE READ to also prevent phantoms.',
        '<strong>SERIALIZABLE</strong>: complete isolation — transactions appear to execute one at a time. In MSSQL, achieved with range locks (key-range locks on index ranges). In PostgreSQL, implemented as Serializable Snapshot Isolation (SSI) — writers are checked for serialisation conflicts at commit time rather than via blocking. SSI has less blocking than traditional SERIALIZABLE but aborts transactions on conflict.',
      ],
    },
    {
      heading: 'Error handling — TRY/CATCH, XACT_STATE, THROW',
      points: [
        'Wrap multi-statement transactions in TRY/CATCH (MSSQL) or BEGIN/EXCEPTION (PostgreSQL PL/pgSQL). If any statement raises an error, execution jumps to the CATCH block — the transaction is neither committed nor automatically rolled back until you explicitly ROLLBACK.',
        'Inside the CATCH block, always check <code>XACT_STATE()</code> before rolling back. <strong>XACT_STATE() = 1</strong>: transaction is active and committable. <strong>XACT_STATE() = -1</strong>: transaction is doomed (uncommittable) — you MUST ROLLBACK; attempting COMMIT raises an additional error. <strong>XACT_STATE() = 0</strong>: no active transaction (already rolled back or was never started).',
        'Always ROLLBACK in the CATCH block if a transaction is active. Leaving a failed transaction open without rollback <strong>holds locks indefinitely</strong>, blocking every other session that needs those rows. This is one of the most common production deadlock causes in legacy stored procedures.',
        'Use <code>THROW</code> (MSSQL 2012+, no arguments inside CATCH) to re-raise the original error after rolling back — the caller sees the error with original message, severity, and state. Avoid <code>RAISERROR</code> for re-raising in new code; THROW preserves the original error number. Use <code>THROW 50001, \'message\', 1</code> (with arguments) to raise a custom error.',
        'In PostgreSQL PL/pgSQL: <code>DECLARE … BEGIN … EXCEPTION WHEN others THEN ROLLBACK; RAISE;</code>. The RAISE; statement (no arguments) re-raises the current exception. PostgreSQL also supports named exception types: <code>WHEN unique_violation THEN</code>, <code>WHEN foreign_key_violation THEN</code> — enabling targeted error handling per constraint type.',
      ],
    },
    {
      heading: 'Deadlocks — detection, prevention, and retry',
      points: [
        'A deadlock occurs when transaction A holds lock L1 and waits for L2, while transaction B holds L2 and waits for L1 — a circular wait. The database\'s deadlock monitor detects the cycle (by scanning the lock wait graph) and terminates the "victim" — usually the transaction that has done less work or whose rollback is cheaper — with error 1205 (MSSQL) or error 40P01 (PostgreSQL).',
        '<strong>Prevention 1 — consistent lock ordering</strong>: always acquire locks in the same object order across all transactions. If Transaction A always updates Orders before OrderDetails, and Transaction B does the same, no deadlock cycle can form between these two objects.',
        '<strong>Prevention 2 — keep transactions short</strong>: long transactions hold locks for longer periods, increasing collision probability. Do all application-level computation (validation, data fetching) before <code>BEGIN TRANSACTION</code>; perform only the writes inside the transaction and COMMIT immediately.',
        '<strong>Prevention 3 — use appropriate indexes</strong>: a missing index causes a table scan, which takes broad shared locks on many rows instead of targeted row locks. Adding the right index reduces lock scope and drastically reduces deadlock frequency in busy OLTP systems.',
        '<strong>Retry pattern</strong>: for any deadlock-prone transaction, the application must catch error 1205 / 40P01 and retry the entire transaction (with exponential backoff + jitter). Some frameworks (EF Core, Dapper + Polly) handle this automatically. In the database layer, the transaction must be re-executed from the start — partial retry is not possible because the transaction was rolled back.',
      ],
    },
    {
      heading: 'SNAPSHOT isolation, optimistic locking, and table hints',
      points: [
        '<strong>SNAPSHOT isolation (MSSQL)</strong>: readers see a consistent snapshot of committed data taken at the start of the transaction — no read locks acquired. Writers still use locks. Readers and writers never block each other. Requires a version store in tempdb (additional disk/memory overhead). Enable with <code>ALTER DATABASE … SET ALLOW_SNAPSHOT_ISOLATION ON</code>.',
        '<strong>READ COMMITTED SNAPSHOT (RCSI)</strong>: a weaker form — each statement (not each transaction) sees a snapshot. Eliminates reader-writer blocking with zero application changes (READ COMMITTED becomes lock-free for reads). Microsoft recommends RCSI as the default for new MSSQL databases. Enable with <code>ALTER DATABASE … SET READ_COMMITTED_SNAPSHOT ON</code>.',
        '<strong>PostgreSQL MVCC</strong>: PostgreSQL is MVCC-native — all readers always see a snapshot, never acquiring shared locks. Readers never block writers. Dead rows (old versions) are cleaned up by VACUUM. PostgreSQL\'s READ COMMITTED is inherently lock-free for reads; REPEATABLE READ and SERIALIZABLE use snapshot validation instead of locks.',
        '<strong>Optimistic locking</strong>: instead of locking rows at read time, record a <code>RowVersion</code> / <code>TIMESTAMP</code> / integer version. Before updating, check that the version has not changed: <code>WHERE id = @id AND version = @original_version</code>. If 0 rows affected, another transaction changed the row — retry or report a conflict. Best for low-contention scenarios where reads far outnumber writes.',
        '<strong>Table hints (MSSQL)</strong>: <code>WITH (NOLOCK)</code> = READ UNCOMMITTED for that table — allows dirty reads, avoids blocking, risks reading rolled-back data. Use only for non-critical reporting. <code>WITH (UPDLOCK)</code> promotes a shared lock to an update lock at read time, preventing the lost-update pattern in SELECT-then-UPDATE sequences. <code>WITH (ROWLOCK)</code> hints the engine to use row-level rather than page-level locks to reduce contention scope.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'BEGIN / COMMIT / ROLLBACK',
      language: 'sql',
      code: `-- ── Bank transfer: atomic debit + credit ──────────────────────────────
BEGIN TRANSACTION;

UPDATE Accounts SET Balance = Balance - 500 WHERE AccountID = 1;
UPDATE Accounts SET Balance = Balance + 500 WHERE AccountID = 2;

-- Guard: reject if source account went negative
IF (SELECT Balance FROM Accounts WHERE AccountID = 1) < 0
BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR('Insufficient funds', 16, 1);
    RETURN;
END;

COMMIT TRANSACTION;
-- Both updates committed together, or neither committed at all.

-- ── Implicit vs explicit transactions ──────────────────────────────────
-- By default in MSSQL, each statement is its own autocommit transaction:
UPDATE Products SET UnitPrice = 10 WHERE ProductID = 1; -- auto-committed immediately

-- Disable autocommit for a session (use explicit BEGIN/COMMIT):
SET IMPLICIT_TRANSACTIONS ON;  -- MSSQL: every DML starts an implicit transaction
-- Each statement must be explicitly committed/rolled back

-- ── PostgreSQL equivalent ──────────────────────────────────────────────
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;`,
    },
    {
      label: 'TRY / CATCH + XACT_STATE',
      language: 'sql',
      code: `-- ── MSSQL: robust multi-step transaction with error handling ──────────
BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO Orders (CustomerID, OrderDate)
    VALUES ('ALFKI', GETDATE());

    DECLARE @OrderID INT = SCOPE_IDENTITY();

    INSERT INTO OrderDetails (OrderID, ProductID, Quantity, UnitPrice)
    VALUES (@OrderID, 1, 10, 18.00);

    -- Optional: validate business rules before committing
    IF (SELECT COUNT(*) FROM OrderDetails WHERE OrderID = @OrderID) = 0
        THROW 50001, 'Order must have at least one item', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    -- XACT_STATE() = -1: uncommittable — MUST rollback
    -- XACT_STATE() = 1: still active — should rollback on error
    -- XACT_STATE() = 0: no transaction (already rolled back)
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    -- Re-raise original error to the caller with full context
    THROW;
END CATCH;

-- ── PostgreSQL PL/pgSQL equivalent ────────────────────────────────────
-- DO $$
-- BEGIN
--     INSERT INTO orders (customer_id, order_date) VALUES ('ALFKI', NOW());
--     INSERT INTO order_details (order_id, product_id, quantity) VALUES (lastval(), 1, 10);
--     COMMIT;
-- EXCEPTION WHEN OTHERS THEN
--     ROLLBACK;
--     RAISE;
-- END;
-- $$;`,
    },
    {
      label: 'Isolation levels',
      language: 'sql',
      code: `-- ── MSSQL: set isolation level for the current session ───────────────
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;       -- default; prevents dirty reads
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;      -- holds read locks; prevents non-repeatable
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;         -- full isolation; highest blocking
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;             -- MVCC; requires database-level setup

-- ── Enable SNAPSHOT isolation on the database ─────────────────────────
ALTER DATABASE Northwind SET ALLOW_SNAPSHOT_ISOLATION ON;

-- ── Enable READ COMMITTED SNAPSHOT (RCSI) — recommended for new DBs ───
-- Eliminates reader-writer blocking at READ COMMITTED with no app changes
ALTER DATABASE Northwind SET READ_COMMITTED_SNAPSHOT ON;

-- ── PostgreSQL: per-transaction isolation ─────────────────────────────
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- or:
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- ── Diagnose current blocking (MSSQL) ─────────────────────────────────
SELECT
    r.session_id,
    r.blocking_session_id,
    r.wait_type,
    r.wait_time / 1000.0 AS WaitSec,
    SUBSTRING(t.text, 1, 200) AS Query
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;`,
    },
    {
      label: 'SAVEPOINTs',
      language: 'sql',
      code: `-- ── MSSQL: SAVE TRANSACTION for partial rollback ─────────────────────
BEGIN TRANSACTION;

INSERT INTO AuditLog (Event) VALUES ('Batch started');
-- ↑ This insert will NOT be rolled back when we roll back to sp1

SAVE TRANSACTION sp1;   -- create a savepoint

INSERT INTO Orders (CustomerID) VALUES ('ALFKI');
INSERT INTO OrderDetails (OrderID, ProductID, Quantity) VALUES (SCOPE_IDENTITY(), 1, 10);

-- If the order inserts fail, roll back only to sp1 (keep audit log insert)
IF @@ERROR <> 0
BEGIN
    ROLLBACK TRANSACTION sp1;   -- rolls back to savepoint, not to BEGIN
    -- outer transaction is still active — can continue or commit
    INSERT INTO AuditLog (Event) VALUES ('Order batch failed — rolled back to sp1');
END;

COMMIT TRANSACTION;     -- commits the audit log entries

-- ── PostgreSQL: SAVEPOINT / ROLLBACK TO SAVEPOINT ─────────────────────
BEGIN;
  INSERT INTO audit_log (event) VALUES ('batch started');

  SAVEPOINT sp1;

  INSERT INTO orders (customer_id) VALUES ('ALFKI');  -- may fail
  -- If it fails, PostgreSQL automatically marks the transaction as aborted.
  -- You must ROLLBACK TO SAVEPOINT to recover:
  ROLLBACK TO SAVEPOINT sp1;      -- undo back to sp1; outer transaction stays active

  INSERT INTO audit_log (event) VALUES ('order insert failed — rolled back');

COMMIT;   -- commits the audit log entries`,
    },
    {
      label: 'Deadlock retry pattern',
      language: 'sql',
      code: `-- ── Application-level retry (pseudo-code pattern) ────────────────────
-- SQL Server deadlock = error 1205, PostgreSQL = 40P01

-- MSSQL stored procedure with built-in retry:
CREATE PROCEDURE TransferInventory
    @FromWarehouse CHAR(1),
    @ToWarehouse   CHAR(1),
    @ProductID     INT,
    @Qty           INT
AS
BEGIN
    DECLARE @Retries INT = 0;
    DECLARE @MaxRetries INT = 3;

    retry:
    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE Inventory
        SET Quantity = Quantity - @Qty
        WHERE WarehouseID = @FromWarehouse AND ProductID = @ProductID;

        IF (SELECT Quantity FROM Inventory
            WHERE WarehouseID = @FromWarehouse AND ProductID = @ProductID) < 0
            THROW 50001, 'Insufficient stock', 1;

        UPDATE Inventory
        SET Quantity = Quantity + @Qty
        WHERE WarehouseID = @ToWarehouse AND ProductID = @ProductID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

        -- Retry on deadlock (1205) up to MaxRetries times
        IF ERROR_NUMBER() = 1205 AND @Retries < @MaxRetries
        BEGIN
            SET @Retries += 1;
            WAITFOR DELAY '00:00:00.1';   -- 100ms backoff (increase per retry in app layer)
            GOTO retry;
        END;

        THROW;   -- non-deadlock error or retries exhausted
    END CATCH;
END;`,
    },
    {
      label: 'Optimistic locking & hints',
      language: 'sql',
      code: `-- ── Optimistic locking with rowversion (MSSQL) ───────────────────────
-- Schema: Products table has RowVer ROWVERSION column (auto-updated on change)

-- Step 1: Read and capture the version
SELECT ProductID, ProductName, UnitPrice, RowVer
FROM Products
WHERE ProductID = 1;
-- Application stores @OriginalVer

-- Step 2: Update only if version unchanged (no other transaction modified the row)
UPDATE Products
SET UnitPrice = 19.99
WHERE ProductID = 1
  AND RowVer = @OriginalVer;   -- optimistic check

-- Check for conflict:
IF @@ROWCOUNT = 0
    THROW 50002, 'Conflict: row was modified by another transaction. Reload and retry.', 1;

-- ── WITH (UPDLOCK): prevent lost updates without full serializable ─────
-- Scenario: read-then-update pattern with concurrent transactions
BEGIN TRANSACTION;

-- Acquire update lock at read time — prevents other transactions from
-- taking shared or update locks, preventing the lost-update race condition
SELECT Quantity
FROM Inventory WITH (UPDLOCK)
WHERE ProductID = 5 AND WarehouseID = 'A';

-- Safe to update — UPDLOCK held since the SELECT
UPDATE Inventory
SET Quantity = Quantity - 10
WHERE ProductID = 5 AND WarehouseID = 'A'
  AND Quantity >= 10;

COMMIT TRANSACTION;

-- ── WITH (NOLOCK): read-only, non-blocking, dirty reads ───────────────
-- Use ONLY for non-critical reporting queries where stale data is acceptable:
SELECT COUNT(*) AS ApproxOrderCount
FROM Orders WITH (NOLOCK)   -- no shared locks; may read uncommitted/dirty data
WHERE OrderDate >= '2024-01-01';
-- Risk: may count orders that are being rolled back in another transaction`,
    },
  ];

  challenge: Challenge = {
    title: 'Safe Multi-Table Transfer with Retry',
    language: 'sql',
    description: `Write a stored procedure <code>TransferStock</code> that:
<ol>
<li>Transfers <code>@Qty</code> units of <code>@ProductID</code> from warehouse A to warehouse B</li>
<li>Validates that warehouse A has sufficient stock after the deduction</li>
<li>Wraps both UPDATEs in TRY/CATCH with proper XACT_STATE() check</li>
<li>Re-raises the error on failure</li>
<li>Retries up to 3 times on deadlock (error 1205)</li>
</ol>`,
    hints: [
      'XACT_STATE() <> 0 before ROLLBACK ensures you only roll back an active transaction',
      'Check IF (SELECT Quantity FROM Inventory WHERE ...) < 0 after the first UPDATE',
      'ERROR_NUMBER() = 1205 is the deadlock error code in SQL Server',
      'GOTO retry after incrementing @Retries — but only when @Retries < @MaxRetries',
    ],
    starterCode: `CREATE PROCEDURE TransferStock
    @ProductID INT,
    @Qty       INT
AS
BEGIN
    DECLARE @Retries INT = 0;

    retry:
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Deduct from warehouse A
        -- Check for negative stock
        -- Add to warehouse B

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- rollback if active transaction
        -- retry on deadlock up to 3 times
        -- re-raise otherwise
    END CATCH;
END;`,
    solution: `CREATE PROCEDURE TransferStock
    @ProductID INT,
    @Qty       INT
AS
BEGIN
    DECLARE @Retries    INT = 0;
    DECLARE @MaxRetries INT = 3;

    retry:
    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE Inventory
        SET Quantity = Quantity - @Qty
        WHERE ProductID = @ProductID AND WarehouseID = 'A';

        IF (SELECT Quantity FROM Inventory
            WHERE ProductID = @ProductID AND WarehouseID = 'A') < 0
            THROW 50001, 'Insufficient stock in warehouse A', 1;

        UPDATE Inventory
        SET Quantity = Quantity + @Qty
        WHERE ProductID = @ProductID AND WarehouseID = 'B';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;

        IF ERROR_NUMBER() = 1205 AND @Retries < @MaxRetries
        BEGIN
            SET @Retries += 1;
            WAITFOR DELAY '00:00:00.1';
            GOTO retry;
        END;

        THROW;
    END CATCH;
END;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which ACID property ensures that a transaction is all-or-nothing?',
      options: [
        'Consistency',
        'Isolation',
        'Atomicity',
        'Durability',
      ],
      answer: 2,
      explanation: 'Atomicity guarantees that all statements in a transaction commit together or all are rolled back. No partial commit is possible — if the system crashes after the first of five INSERTs, none of the five are committed.',
    },
    {
      q: 'What happens when SQL Server detects a deadlock?',
      options: [
        'Both transactions are rolled back simultaneously',
        'The transaction that has been running longest is rolled back',
        'One transaction (the deadlock victim) is terminated with error 1205, releasing its locks',
        'The database pauses until an administrator manually resolves it',
      ],
      answer: 2,
      explanation: 'SQL Server\'s deadlock monitor detects circular lock waits and chooses a victim — usually the transaction that has done less work or would cost less to roll back. It terminates the victim with error 1205 (deadlock victim), releasing its locks so the surviving transaction can proceed. The victim transaction must be retried by the application.',
    },
    {
      q: 'Which isolation level allows dirty reads (reading uncommitted data)?',
      options: [
        'READ COMMITTED',
        'REPEATABLE READ',
        'READ UNCOMMITTED',
        'SNAPSHOT',
      ],
      answer: 2,
      explanation: 'READ UNCOMMITTED is the only standard isolation level that permits dirty reads — a transaction can read rows that another transaction has written but not yet committed. If the writer rolls back, the reader has seen data that never permanently existed.',
    },
    {
      q: 'Inside a CATCH block, XACT_STATE() returns -1. What must you do?',
      options: [
        'COMMIT the transaction — -1 means partial success',
        'ROLLBACK the transaction — it is in an uncommittable state and cannot be committed',
        'Do nothing — -1 means the error was non-fatal',
        'Re-execute the failed statement',
      ],
      answer: 1,
      explanation: 'XACT_STATE() = -1 means the transaction is doomed (uncommittable). Attempting to COMMIT will raise another error. You MUST ROLLBACK; failing to do so leaves active locks on held rows, blocking other sessions indefinitely.',
    },
    {
      q: 'What concurrency anomaly does REPEATABLE READ prevent that READ COMMITTED does not?',
      options: [
        'Dirty reads — reading uncommitted data',
        'Non-repeatable reads — reading the same row twice and getting different values',
        'Phantom reads — a range query returning different rows on re-execution',
        'Lost updates — two transactions overwriting each other\'s changes',
      ],
      answer: 1,
      explanation: 'READ COMMITTED prevents dirty reads but allows non-repeatable reads (the same row can return different values if re-read within a transaction, because another transaction committed an update between reads). REPEATABLE READ holds shared read locks until transaction end, preventing this. Phantom reads (new rows in a range) are only prevented by SERIALIZABLE (in MSSQL) or REPEATABLE READ (in PostgreSQL due to MVCC).',
    },
    {
      q: 'What is the risk of using WITH (NOLOCK) in SQL Server?',
      options: [
        'It acquires an exclusive lock, blocking all other readers and writers',
        'It can return dirty (uncommitted or being-rolled-back) data, and may also miss rows or return duplicates during page splits',
        'It prevents the query from using indexes',
        'It only works on tables with a clustered index',
      ],
      answer: 1,
      explanation: 'WITH (NOLOCK) reads at READ UNCOMMITTED level for that table — no shared locks are taken. This means the query may read data that is being rolled back (dirty data), miss rows during a page split (rows move to a new page after you already scanned past it), or read the same row twice. It is acceptable for non-critical reporting where stale data is tolerable, but never for financial or transactional queries.',
    },
    {
      q: 'What is the key difference between SNAPSHOT isolation and READ COMMITTED SNAPSHOT (RCSI) in SQL Server?',
      options: [
        'SNAPSHOT is row-level; RCSI is page-level',
        'SNAPSHOT takes a snapshot per transaction (consistent throughout the transaction); RCSI takes a snapshot per statement (may see different committed data on each new statement)',
        'SNAPSHOT requires no database configuration; RCSI requires ALTER DATABASE',
        'They are identical — RCSI is just an alias for SNAPSHOT',
      ],
      answer: 1,
      explanation: 'With SNAPSHOT isolation, a transaction sees a consistent snapshot of all committed data as it existed at the transaction\'s START. With READ COMMITTED SNAPSHOT (RCSI), each individual statement sees committed data as it existed at the STATEMENT\'s start — a new statement within the same transaction may see data committed by other transactions between statements. RCSI eliminates reader-writer blocking at READ COMMITTED level with zero application changes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between SNAPSHOT isolation and READ COMMITTED SNAPSHOT (RCSI)?',
      a: '<strong>SNAPSHOT isolation</strong>: each transaction sees a consistent snapshot taken at <em>transaction start</em> — repeated reads return the same data throughout. Writers still take locks. <strong>RCSI</strong>: each <em>statement</em> sees a snapshot at statement start — a new SELECT in the same transaction may see rows committed by other transactions between statements. RCSI requires no application changes (READ COMMITTED becomes lock-free for reads). Microsoft recommends RCSI as the default for new SQL Server databases.',
    },
    {
      q: 'Can I use SAVEPOINTs to partially roll back a transaction?',
      a: 'Yes. <strong>PostgreSQL</strong>: <code>SAVEPOINT sp1; … ROLLBACK TO SAVEPOINT sp1;</code> — rolls back to the savepoint; the outer transaction remains active and must still be committed or rolled back. <strong>MSSQL</strong>: <code>SAVE TRANSACTION sp1; … ROLLBACK TRANSACTION sp1;</code> — same semantics. The outer transaction is still active after rolling back to a savepoint. Useful for retrying a section of a large transaction (e.g. a failed order item) without restarting the whole batch.',
    },
    {
      q: 'Why is it important to keep transactions short?',
      a: 'Long transactions hold locks for a long time, blocking every other session that needs those same rows. They increase deadlock probability (more overlap with other transactions), grow the log (WAL must retain all uncommitted transaction data), and hurt throughput. Best practice: do all application-side work (input validation, data fetching, computations) before <code>BEGIN TRANSACTION</code>, then perform only the writes inside the transaction, and COMMIT immediately.',
    },
    {
      q: 'What is optimistic locking and when should I use it?',
      a: 'Optimistic locking avoids taking a row lock at read time. Instead, a version column (<code>ROWVERSION</code>, <code>TIMESTAMP</code>, or integer counter) is read alongside the data. Before updating, the query checks that the version has not changed: <code>WHERE id = @id AND ver = @originalVer</code>. If 0 rows affected, another transaction modified the row — the application retries or reports a conflict. Use when conflicts are rare and reads far outnumber writes. Avoid when contention is high — constant retries degrade throughput worse than pessimistic locking.',
    },
    {
      q: 'What is a lost update and how do I prevent it?',
      a: 'A lost update occurs when two transactions each read the same row, compute a new value, and both write back — the second write overwrites the first without seeing it. Example: both start with stock=100, both compute stock=90, both write 90 — one deduction is lost. Prevention options: (1) <strong>REPEATABLE READ or higher</strong> — shared locks prevent the other transaction from updating until you commit; (2) <strong>WITH (UPDLOCK)</strong> — promote shared lock to update lock at read time; (3) <strong>Optimistic locking</strong> — version check before update; (4) <strong>Atomic SQL</strong> — <code>UPDATE SET stock = stock - @qty WHERE stock >= @qty</code> — a single atomic statement, no read-then-write race.',
    },
    {
      q: 'When should I use WITH (NOLOCK) in production?',
      a: 'Only for non-critical read queries where stale or dirty data is acceptable and blocking is unacceptable — for example, a dashboard total that is refreshed every 30 seconds and where counting a rolled-back order is acceptable. Never use it for financial calculations, order processing, inventory checks, or any query that drives a business decision. The risks are real: dirty reads (counting rolled-back rows), phantom rows (page splits cause rows to be read twice or missed), and incorrect aggregates. For read-only reporting without blocking, SNAPSHOT isolation or RCSI is a safer, correct alternative.',
    },
    {
      q: 'How does PostgreSQL\'s MVCC differ from SQL Server\'s locking approach?',
      a: '<strong>PostgreSQL MVCC</strong>: readers never block writers and writers never block readers. Each transaction sees a snapshot of committed data. Old row versions are kept ("dead tuples") and cleaned up by VACUUM. REPEATABLE READ and SERIALIZABLE are implemented via snapshot validation, not range locks. Result: no reader-writer deadlocks, but VACUUM must run regularly. <strong>SQL Server (default)</strong>: uses shared/exclusive locks. Readers block writers (and vice versa) unless SNAPSHOT or RCSI is enabled. RCSI adds a version store (similar to MVCC) on top of the locking engine. When RCSI is on, SQL Server behaves much like PostgreSQL for reads.',
    },
  ];
}
