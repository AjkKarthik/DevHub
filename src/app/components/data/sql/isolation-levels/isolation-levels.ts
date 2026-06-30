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
  selector: 'app-sql-isolation-levels',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './isolation-levels.html',
  styleUrls: ['./isolation-levels.scss']
})
export class SqlIsolationLevels {

  quickRef: QuickRefItem[] = [
    { name: 'READ UNCOMMITTED',        type: 'keyword', desc: 'Dirty reads allowed — sees uncommitted changes from other transactions' },
    { name: 'READ COMMITTED',          type: 'keyword', desc: 'Default in most databases — only sees committed data' },
    { name: 'REPEATABLE READ',         type: 'keyword', desc: 'Re-reads of same rows return same data; phantom reads possible' },
    { name: 'SERIALIZABLE',            type: 'keyword', desc: 'Highest isolation — no dirty, non-repeatable, or phantom reads' },
    { name: 'SNAPSHOT (MSSQL)',        type: 'keyword', desc: 'Optimistic isolation using row versioning in tempdb' },
    { name: 'READ COMMITTED SNAPSHOT', type: 'keyword', desc: 'MSSQL: statement-level snapshot; replaces locking READ COMMITTED' },
    { name: 'SET TRANSACTION ISOLATION LEVEL', type: 'syntax', desc: 'Set isolation for the current connection/transaction' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The ACID isolation problem',
      points: [
        'When multiple transactions run concurrently, three anomalies can occur: dirty reads, non-repeatable reads, and phantom reads.',
        'Isolation levels trade consistency guarantees for concurrency — higher isolation = fewer anomalies but more blocking.',
        'The right level depends on your workload: reporting queries often tolerate lower isolation; financial transactions need higher.',
      ]
    },
    {
      heading: 'The four standard levels',
      points: [
        'READ UNCOMMITTED: sees uncommitted data from other transactions (dirty read). Only useful for approximate aggregate queries where dirty reads are acceptable.',
        'READ COMMITTED (default in MSSQL/PG): only reads committed data. A re-read of the same row within a transaction may return a different value if another transaction committed in between (non-repeatable read).',
        'REPEATABLE READ: locks rows read until transaction ends — a re-read returns the same value. New rows matching your WHERE clause can still appear (phantom read). Default in MySQL InnoDB.',
        'SERIALIZABLE: prevents all anomalies by range-locking, making transactions appear to execute serially. Highest isolation but most blocking.',
      ]
    },
    {
      heading: 'MSSQL snapshot isolation',
      points: [
        'SNAPSHOT: readers see a consistent snapshot of committed data as of the transaction start — no read locks, no blocking between readers and writers.',
        'READ COMMITTED SNAPSHOT (RCSI): row-versioning at the statement level. Replaces the default locking READ COMMITTED — readers never block writers and writers never block readers.',
        'Both require enabling at the database level: ALTER DATABASE … SET ALLOW_SNAPSHOT_ISOLATION ON / READ_COMMITTED_SNAPSHOT ON.',
      ]
    },
    {
      heading: 'PostgreSQL isolation',
      points: [
        'PostgreSQL implements MVCC (Multi-Version Concurrency Control) — readers never block writers regardless of isolation level.',
        'In PostgreSQL, READ UNCOMMITTED is accepted but behaves identically to READ COMMITTED — the engine never returns dirty reads.',
        'SERIALIZABLE in PostgreSQL uses Serializable Snapshot Isolation (SSI) — detects serialisation conflicts and returns a serialisation failure error rather than blocking.',
      ]
    },
    {
      heading: 'Choosing the right level',
      points: [
        'Reporting queries: READ UNCOMMITTED (MSSQL with NOLOCK) or READ COMMITTED SNAPSHOT — tolerate slight staleness for non-blocking reads.',
        'Normal OLTP: READ COMMITTED (default) — correct for most single-statement operations.',
        'Multi-statement read-then-write sequences: REPEATABLE READ or SNAPSHOT — prevent the row changing under your feet.',
        'Financial / inventory updates where correctness is critical: SERIALIZABLE — accept the blocking/retry cost.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Set isolation level (both dialects)',
      language: 'sql',
      code: `-- MSSQL: set for the current session/transaction
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;     -- default
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;           -- requires DB-level opt-in

-- MSSQL: enable snapshot isolation at DB level
ALTER DATABASE MyDB SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE MyDB SET READ_COMMITTED_SNAPSHOT  ON; -- RCSI

-- PostgreSQL: set for current transaction (must be first statement)
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- or:
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
COMMIT;

-- PostgreSQL: BEGIN with isolation inline
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- your transaction here
COMMIT;`
    },
    {
      label: 'Dirty read demo (MSSQL)',
      language: 'sql',
      code: `-- Session A (writer)
BEGIN TRAN;
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 1;
-- NOT committed yet

-- Session B (reader at READ UNCOMMITTED)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT balance FROM accounts WHERE account_id = 1;
-- Sees -1000 before A commits — this is a DIRTY READ

-- Session A rolls back
ROLLBACK;
-- Session B's dirty read was wrong — the balance never actually changed

-- Fix: MSSQL NOLOCK hint (same as READ UNCOMMITTED)
SELECT balance FROM accounts WITH (NOLOCK) WHERE account_id = 1;
-- Avoid for financial data; ok for approximate reporting counts

-- Fix: use READ COMMITTED or SNAPSHOT
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT balance FROM accounts WHERE account_id = 1;  -- waits for A to commit/rollback`
    },
    {
      label: 'Non-repeatable read demo',
      language: 'sql',
      code: `-- The problem: two reads of the same row return different values
-- Session A: READ COMMITTED (default)
BEGIN TRAN;
SELECT balance FROM accounts WHERE account_id = 1;  -- returns 5000

-- Session B (concurrent):
UPDATE accounts SET balance = 4500 WHERE account_id = 1;
COMMIT;

-- Session A re-reads:
SELECT balance FROM accounts WHERE account_id = 1;  -- returns 4500  ← changed!
COMMIT;

-- Fix with REPEATABLE READ or SNAPSHOT
-- MSSQL:
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRAN;
SELECT balance FROM accounts WHERE account_id = 1;  -- 5000
-- Session B updates and commits...
SELECT balance FROM accounts WHERE account_id = 1;  -- still 5000 (snapshot)
COMMIT;

-- PostgreSQL:
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE account_id = 1;  -- 5000
-- B commits update...
SELECT balance FROM accounts WHERE account_id = 1;  -- still 5000
COMMIT;`
    },
    {
      label: 'SERIALIZABLE & retry (PostgreSQL)',
      language: 'sql',
      code: `-- PostgreSQL SERIALIZABLE uses SSI — may fail with serialisation error
-- Application must retry on sqlstate '40001' (serialization_failure)

DO \$\$
DECLARE
    retries INT := 0;
BEGIN
    LOOP
        BEGIN
            BEGIN;
            -- Check stock before deducting
            IF (SELECT stock FROM products WHERE product_id = 1) >= 5 THEN
                UPDATE products SET stock = stock - 5 WHERE product_id = 1;
                INSERT INTO order_items (product_id, qty) VALUES (1, 5);
            END IF;
            COMMIT;
            EXIT;  -- success — exit retry loop
        EXCEPTION WHEN serialization_failure THEN
            retries := retries + 1;
            IF retries > 3 THEN RAISE; END IF;
            -- loop again
        END;
    END LOOP;
END;
\$\$;

-- MSSQL: similar pattern with TRY/CATCH on error 1205 (deadlock) or 3960 (snapshot conflict)`
    },
  ];

  challenge: Challenge = {
    title: 'Pick the right isolation level',
    language: 'sql',
    description: 'Write three short transaction blocks for these scenarios: (1) A nightly report that sums all order amounts — tolerate slight staleness, no blocking. (2) A bank transfer that reads a balance, checks it, then deducts — must not read stale data. (3) A seat reservation that checks availability and books — must prevent two users booking the same seat simultaneously. For each, specify the isolation level and explain why.',
    hints: [
      'Scenario 1: READ UNCOMMITTED (MSSQL) or default READ COMMITTED with MVCC (PostgreSQL).',
      'Scenario 2: SNAPSHOT (MSSQL) or REPEATABLE READ (PostgreSQL) prevents the balance changing between read and deduct.',
      'Scenario 3: SERIALIZABLE prevents two concurrent transactions both seeing a seat as available.',
    ],
    starterCode: `-- Scenario 1: nightly report
SET TRANSACTION ISOLATION LEVEL ???;
BEGIN TRAN;
SELECT SUM(amount) FROM orders WHERE order_date = CAST(GETDATE() AS DATE);
COMMIT;

-- Scenario 2: bank transfer
SET TRANSACTION ISOLATION LEVEL ???;
BEGIN TRAN;
DECLARE @bal DECIMAL(10,2);
SELECT @bal = balance FROM accounts WHERE account_id = 1;
IF @bal >= 500
    UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
COMMIT;

-- Scenario 3: seat reservation
SET TRANSACTION ISOLATION LEVEL ???;
BEGIN TRAN;
IF NOT EXISTS (SELECT 1 FROM bookings WHERE seat_id = 42)
    INSERT INTO bookings (seat_id, user_id) VALUES (42, 99);
COMMIT;`,
    solution: `-- Scenario 1: nightly report — tolerate dirty reads for non-blocking aggregate
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN TRAN;
SELECT SUM(amount) FROM orders WHERE order_date = CAST(GETDATE() AS DATE);
COMMIT;

-- Scenario 2: bank transfer — SNAPSHOT prevents non-repeatable read without blocking
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;   -- requires ALLOW_SNAPSHOT_ISOLATION ON
BEGIN TRAN;
DECLARE @bal DECIMAL(10,2);
SELECT @bal = balance FROM accounts WHERE account_id = 1;
IF @bal >= 500
    UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
COMMIT;

-- Scenario 3: seat reservation — SERIALIZABLE prevents phantom (concurrent booking)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
IF NOT EXISTS (SELECT 1 FROM bookings WHERE seat_id = 42)
    INSERT INTO bookings (seat_id, user_id) VALUES (42, 99);
COMMIT;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which anomaly does REPEATABLE READ prevent that READ COMMITTED does not?',
      options: ['Dirty reads', 'Phantom reads', 'Non-repeatable reads', 'Lost updates'],
      answer: 2,
      explanation: 'READ COMMITTED prevents dirty reads but allows non-repeatable reads (the same row returns different values on re-read within a transaction). REPEATABLE READ locks read rows until the transaction ends, guaranteeing they do not change.'
    },
    {
      q: 'What is the main advantage of MSSQL SNAPSHOT isolation over SERIALIZABLE?',
      options: [
        'SNAPSHOT allows dirty reads for better performance',
        'SNAPSHOT uses row versioning so readers never block writers — higher concurrency than SERIALIZABLE',
        'SNAPSHOT prevents more anomalies than SERIALIZABLE',
        'SNAPSHOT does not require any database-level configuration'
      ],
      answer: 1,
      explanation: 'SNAPSHOT reads from a version store rather than locking rows, so readers and writers do not block each other. SERIALIZABLE uses range locks and blocks concurrent access. SNAPSHOT requires ALTER DATABASE … SET ALLOW_SNAPSHOT_ISOLATION ON.'
    },
    {
      q: 'In PostgreSQL, what happens if you set READ UNCOMMITTED?',
      options: [
        'Dirty reads are enabled as per the SQL standard',
        'The database raises an error — READ UNCOMMITTED is not supported',
        'PostgreSQL silently uses READ COMMITTED — it never returns dirty reads',
        'It enables MVCC bypass for maximum performance'
      ],
      answer: 2,
      explanation: 'PostgreSQL accepts READ UNCOMMITTED but treats it as READ COMMITTED internally. The MVCC architecture means the engine never returns uncommitted data regardless of the isolation level.'
    },
    {
      q: 'A phantom read occurs when…',
      options: [
        'A row you read changes value on re-read',
        'You read a row that another transaction has not committed yet',
        'A new row appears in a range query re-executed within the same transaction',
        'A committed row disappears between two reads'
      ],
      answer: 2,
      explanation: 'A phantom read is when a range query (e.g. WHERE amount > 100) returns a different set of rows on re-execution because another transaction inserted or deleted qualifying rows and committed. SERIALIZABLE prevents phantoms.'
    },
    {
      q: 'Which anomaly does SERIALIZABLE prevent that REPEATABLE READ does not?',
      options: [
        'Non-repeatable reads',
        'Dirty reads',
        'Phantom reads caused by range inserts/deletes from concurrent transactions',
        'Lost updates'
      ],
      answer: 2,
      explanation: 'REPEATABLE READ locks rows you have already read, preventing them from changing. However, a concurrent transaction can still INSERT new rows matching your range query — those phantom rows appear on re-execution. SERIALIZABLE prevents phantoms by also locking the ranges that match your predicates.'
    },
    {
      q: 'Which T-SQL keyword enables SNAPSHOT isolation for a specific transaction in MSSQL?',
      options: [
        'SET TRANSACTION ISOLATION LEVEL SNAPSHOT',
        'BEGIN SNAPSHOT TRANSACTION',
        'WITH (SNAPSHOT) table hint',
        'ALTER SESSION SET ISOLATION = SNAPSHOT'
      ],
      answer: 0,
      explanation: 'SET TRANSACTION ISOLATION LEVEL SNAPSHOT enables snapshot isolation for the current session. The database must first have ALLOW_SNAPSHOT_ISOLATION enabled via ALTER DATABASE … SET ALLOW_SNAPSHOT_ISOLATION ON.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between SNAPSHOT and READ COMMITTED SNAPSHOT (RCSI) in MSSQL?',
      a: 'SNAPSHOT isolation: the transaction sees data as of its START time — consistent throughout the transaction. RCSI: each statement sees data as of its own start time — a re-read within the same transaction can return updated values. RCSI is a database-wide setting that changes the default READ COMMITTED behaviour; SNAPSHOT is an explicit per-transaction choice.',
    },
    {
      q: 'Does PostgreSQL SERIALIZABLE block concurrent transactions?',
      a: 'Not with blocking locks — PostgreSQL SSI (Serializable Snapshot Isolation) detects serialisation anomalies optimistically and aborts a transaction with a serialisation_failure error (SQLSTATE 40001) rather than blocking. The application must catch this error and retry the transaction.',
    },
    {
      q: 'When is READ UNCOMMITTED safe to use?',
      a: 'For approximate aggregate reporting (total order count, rough revenue sum) where slight staleness is acceptable and blocking is undesirable. Never use it for anything that drives a decision based on exact values — balances, inventory counts, seat availability. In PostgreSQL it is never "unsafe" because dirty reads are never returned, but the annotation is still misleading for code reviewers.',
    },
    {
      q: 'How do you check the current isolation level of a session?',
      a: 'MSSQL: SELECT session_id, transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID; (values 0–5 map to the isolation level enum). PostgreSQL: SHOW transaction_isolation; inside a transaction, or SELECT current_setting(\'transaction_isolation\');',
    },
    {
      q: 'Are isolation levels set per-connection or per-transaction?',
      a: 'They are set per-session (or per-statement in some dialects) and persist until changed. A SET TRANSACTION ISOLATION LEVEL command in MSSQL applies to all subsequent transactions in the session until reset. PostgreSQL\'s SET TRANSACTION applies only to the current transaction. Connection pooling can cause unexpected isolation level leakage — always reset the isolation level when returning a connection to a pool.',
    },
    {
      q: 'How does isolation level choice affect replication in MSSQL?',
      a: 'If ALLOW_SNAPSHOT_ISOLATION is ON, the version store in tempdb grows — the server must retain old row versions as long as any snapshot transaction is open. Long-running snapshot transactions can cause tempdb bloat and slow cleanup. For AlwaysOn readable secondaries, reads run under SNAPSHOT isolation by default to avoid blocking primary transactions.',
    },
  ];
}
