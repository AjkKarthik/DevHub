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
    { name: 'BEGIN TRANSACTION',     type: 'keyword', desc: 'Starts an explicit transaction; all subsequent DML is part of it', since: 'SQL-92' },
    { name: 'COMMIT',                type: 'keyword', desc: 'Persists all changes made in the transaction permanently', since: 'SQL-92' },
    { name: 'ROLLBACK',              type: 'keyword', desc: 'Undoes all changes in the current transaction back to BEGIN or last SAVEPOINT', since: 'SQL-92' },
    { name: 'SAVEPOINT',             type: 'keyword', desc: 'Creates a named point within a transaction for partial rollback', since: 'SQL-92' },
    { name: 'ACID',                  type: 'keyword', desc: 'Atomicity, Consistency, Isolation, Durability — the four guarantees', since: 'General' },
    { name: 'READ UNCOMMITTED',      type: 'keyword', desc: 'Lowest isolation; dirty reads allowed — can read uncommitted changes', since: 'SQL-92' },
    { name: 'READ COMMITTED',        type: 'keyword', desc: 'Default in MSSQL/PostgreSQL; reads only committed data; non-repeatable reads possible', since: 'SQL-92' },
    { name: 'REPEATABLE READ',       type: 'keyword', desc: 'Same row read twice returns same value within a transaction; phantom reads possible', since: 'SQL-92' },
    { name: 'SERIALIZABLE',          type: 'keyword', desc: 'Highest isolation; transactions appear to execute serially; slowest', since: 'SQL-92' },
    { name: 'SNAPSHOT (MSSQL)',      type: 'keyword', desc: 'Readers see a snapshot of committed data from transaction start; no read locks', since: 'MSSQL 2005' },
    { name: 'Deadlock',              type: 'keyword', desc: 'Two transactions hold locks the other needs; DB terminates the victim (error 1205)', since: 'General' },
    { name: 'Optimistic locking',    type: 'keyword', desc: 'Check a version/timestamp before updating; retry if changed by another transaction', since: 'General' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ACID — the four guarantees',
      points: [
        '<strong>Atomicity</strong>: a transaction is all-or-nothing. Either all statements commit or none do. A failure mid-transaction rolls back every change made so far.',
        '<strong>Consistency</strong>: a transaction takes the database from one valid state to another. All constraints (PK, FK, CHECK, UNIQUE) must hold before and after.',
        '<strong>Isolation</strong>: concurrent transactions are invisible to each other until committed. The degree of isolation is configurable via isolation levels.',
        '<strong>Durability</strong>: once committed, changes survive crashes. The write-ahead log ensures the transaction is recoverable even if the system fails immediately after COMMIT.',
      ],
    },
    {
      heading: 'Isolation levels — the concurrency tradeoff',
      points: [
        'Higher isolation = fewer concurrency anomalies, but more blocking and lower throughput. Lower isolation = more concurrency anomalies (dirty reads, phantom reads), but more concurrency.',
        '<strong>READ UNCOMMITTED</strong>: allows dirty reads (reading rows modified by an uncommitted transaction). Never use in production — can read rolled-back data.',
        '<strong>READ COMMITTED</strong> (SQL Server/PostgreSQL default): reads only committed data. Prevents dirty reads; non-repeatable reads and phantoms are still possible.',
        '<strong>REPEATABLE READ</strong>: holds read locks until transaction end, preventing non-repeatable reads. Phantom reads (new rows inserted by another transaction) are still possible in MSSQL; PostgreSQL prevents them.',
        '<strong>SERIALIZABLE</strong>: full isolation — transactions appear to run one at a time. Prevents all anomalies but has the most blocking.',
        '<strong>SNAPSHOT (MSSQL)</strong>: readers use a version store to see a consistent snapshot without blocking writers. Equivalent to PostgreSQL\'s default MVCC behaviour.',
      ],
    },
    {
      heading: 'Deadlocks — detection and prevention',
      points: [
        'A deadlock occurs when transaction A holds lock L1 and waits for L2, while transaction B holds L2 and waits for L1. The database detects the cycle and terminates one transaction (the deadlock "victim") with error 1205 in SQL Server.',
        'Application code must catch error 1205 (or deadlock exceptions) and retry the transaction. Most ORMs and drivers surface this as a retriable exception.',
        'Prevention strategies: always acquire locks in the same order across transactions; keep transactions short; use the lowest isolation level that meets requirements; add appropriate indexes to reduce lock scope.',
        'Use SNAPSHOT isolation or READ COMMITTED SNAPSHOT in SQL Server to eliminate most reader-writer deadlocks entirely.',
      ],
    },
    {
      heading: 'Error handling with TRY/CATCH',
      points: [
        'Wrap multi-statement transactions in TRY/CATCH. In the CATCH block, check <code>XACT_STATE()</code> before rolling back: XACT_STATE() = -1 means uncommittable transaction (must rollback); 1 means committable; 0 means no active transaction.',
        'Always ROLLBACK in the CATCH block if a transaction is active. Leaving a failed transaction open without rollback holds locks and blocks other sessions.',
        'Use <code>THROW</code> (SQL Server 2012+) to re-raise the error after rolling back, so the caller knows the operation failed.',
        'PostgreSQL uses PL/pgSQL EXCEPTION blocks: <code>BEGIN … EXCEPTION WHEN others THEN ROLLBACK; RAISE;</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'BEGIN / COMMIT / ROLLBACK',
      language: 'sql',
      code: `-- Bank transfer: debit one account, credit another
BEGIN TRANSACTION;

UPDATE Accounts SET Balance = Balance - 500 WHERE AccountID = 1;
UPDATE Accounts SET Balance = Balance + 500 WHERE AccountID = 2;

-- Verify constraints are met
IF @@ERROR <> 0 OR (SELECT Balance FROM Accounts WHERE AccountID = 1) < 0
BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR('Transfer failed', 16, 1);
    RETURN;
END;

COMMIT TRANSACTION;`,
    },
    {
      label: 'TRY / CATCH',
      language: 'sql',
      code: `BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO Orders (CustomerID, OrderDate)
    VALUES ('ALFKI', GETDATE());

    INSERT INTO [Order Details] (OrderID, ProductID, Quantity, UnitPrice)
    VALUES (SCOPE_IDENTITY(), 1, 10, 18.00);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;   -- re-raise so the caller sees the error
END CATCH;`,
    },
    {
      label: 'Isolation levels',
      language: 'sql',
      code: `-- Set isolation level for the current session (SQL Server)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;   -- default
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;         -- MVCC

-- Enable SNAPSHOT on the database (one-time setup)
ALTER DATABASE Northwind SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE Northwind SET READ_COMMITTED_SNAPSHOT ON; -- READ COMMITTED uses snapshots

-- Check current locks (SQL Server)
SELECT
    r.session_id,
    r.blocking_session_id,
    r.wait_type,
    r.wait_time,
    t.text AS Query
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;`,
    },
  ];

  challenge: Challenge = {
    title: 'Safe Multi-Table Update',
    language: 'sql',
    description: `Write a stored procedure (or batch) that transfers inventory between two warehouses:
- Decrease stock in Warehouse A by 100 units for ProductID 5
- Increase stock in Warehouse B by 100 units for ProductID 5
- Wrap in a transaction with TRY/CATCH
- Roll back if either update fails OR if stock in Warehouse A would go negative after the decrease
- Re-raise the error to the caller`,
    hints: [
      'Check stock availability after the UPDATE with a SELECT ... WHERE Quantity < 0 check',
      'XACT_STATE() <> 0 means an active transaction exists and should be rolled back',
      'Use THROW (no arguments) inside CATCH to re-raise the caught error',
    ],
    starterCode: `BEGIN TRY
    BEGIN TRANSACTION;

    -- Step 1: decrease stock in Warehouse A
    UPDATE Inventory
    SET Quantity = Quantity - 100
    WHERE ProductID = 5 AND WarehouseID = 'A';

    -- Step 2: check for negative stock
    -- ...

    -- Step 3: increase stock in Warehouse B
    -- ...

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    -- rollback and re-raise
END CATCH;`,
    solution: `BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE Inventory
    SET Quantity = Quantity - 100
    WHERE ProductID = 5 AND WarehouseID = 'A';

    IF (SELECT Quantity FROM Inventory WHERE ProductID = 5 AND WarehouseID = 'A') < 0
    BEGIN
        RAISERROR('Insufficient stock in Warehouse A', 16, 1);
    END;

    UPDATE Inventory
    SET Quantity = Quantity + 100
    WHERE ProductID = 5 AND WarehouseID = 'B';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which ACID property ensures that a transaction is all-or-nothing?',
      options: ['Consistency', 'Isolation', 'Atomicity', 'Durability'],
      answer: 2,
      explanation: 'Atomicity guarantees that all statements in a transaction either commit together or all are rolled back. Partial commits are not possible.',
    },
    {
      q: 'What happens when a deadlock is detected in SQL Server?',
      options: ['Both transactions are rolled back', 'The transaction that has been running longest is rolled back', 'One transaction (the victim) is terminated with error 1205', 'The database locks until an admin intervenes'],
      answer: 2,
      explanation: 'SQL Server\'s deadlock monitor terminates the least expensive transaction (the deadlock victim) with error 1205, releasing its locks so the other transaction can proceed.',
    },
    {
      q: 'Which isolation level allows dirty reads (reading uncommitted data)?',
      options: ['READ COMMITTED', 'REPEATABLE READ', 'READ UNCOMMITTED', 'SNAPSHOT'],
      answer: 2,
      explanation: 'READ UNCOMMITTED is the only isolation level that allows dirty reads — a transaction can read rows that another transaction has modified but not yet committed.',
    },
    {
      q: 'Inside a CATCH block, XACT_STATE() returns -1. What should you do?',
      options: ['COMMIT the transaction', 'ROLLBACK the transaction — it is uncommittable', 'Do nothing — XACT_STATE() -1 means success', 'Re-execute the failed statement'],
      answer: 1,
      explanation: 'XACT_STATE() = -1 means the transaction is in an uncommittable state. You MUST ROLLBACK; attempting to COMMIT will raise an error.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between SNAPSHOT isolation and READ COMMITTED SNAPSHOT?',
      a: 'SNAPSHOT isolation: each individual transaction sees a snapshot of committed data taken at the start of the transaction — reads are consistent throughout. READ COMMITTED SNAPSHOT (RCSI): each statement sees a snapshot of committed data at the statement start (not the transaction start). RCSI is a weaker form but eliminates reader-writer blocking without changing application isolation level settings.',
    },
    {
      q: 'Can I use SAVEPOINTs to partially roll back?',
      a: 'Yes in PostgreSQL: SAVEPOINT sp1; ... ROLLBACK TO SAVEPOINT sp1. In SQL Server, SAVE TRANSACTION name; ... ROLLBACK TRANSACTION name — but this only rolls back to the savepoint, not all the way. The outer transaction is still active. This is useful for retrying a portion of a larger transaction without restarting from scratch.',
    },
    {
      q: 'Why is it important to keep transactions short?',
      a: 'Long transactions hold locks for a long time, blocking other sessions. They also increase the chance of a deadlock. Best practice: do all application-side work (input validation, data fetching) before opening a transaction, then perform only the writes inside the transaction and commit immediately.',
    },
    {
      q: 'What is optimistic locking and when should I use it?',
      a: 'Optimistic locking avoids taking a lock at read time. Instead, it records a version number or rowversion/timestamp. Before updating, it checks if the version has changed since it was read — if so, another transaction modified the row, and the current transaction retries or fails. Use it when conflicts are rare and reads far outnumber writes. It reduces lock contention but increases retry logic complexity.',
    },
  ];
}
