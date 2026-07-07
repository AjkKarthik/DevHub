import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-order-by-update-invalid-syntax-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-order-by-on-update-is-invalid-syntax-not-a-lock-technique.html',
  styleUrl: './testing-that-order-by-on-update-is-invalid-syntax-not-a-lock-technique.scss',
})
export class TestingThatOrderByOnUpdateIsInvalidSyntaxNotALockTechniqueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Suggested Fix That Doesn\'t Parse',
      points: [
        'The main page\'s Q&A on preventing deadlocks says: "For row-level locks, order by primary key: WHERE id IN (1, 5, 9) ORDER BY id so all concurrent transactions acquire row locks in the same ascending sequence." Read as a literal instruction, this describes adding ORDER BY to the WHERE clause of an UPDATE (or DELETE) statement — but neither MSSQL nor PostgreSQL\'s UPDATE (or DELETE) statement grammar supports an ORDER BY clause at all. SELECT supports it; UPDATE and DELETE do not.',
        'This means the Q&A\'s literal suggestion — UPDATE accounts SET ... WHERE id IN (1, 5, 9) ORDER BY id — is not valid SQL in either dialect. Copying it into an actual UPDATE statement produces a syntax error, not a working lock-ordering technique.',
      ],
    },
    {
      heading: 'How Row Lock Acquisition Order Is Actually Controlled',
      points: [
        'A single multi-row UPDATE (or DELETE) statement acquires locks in whatever order the query\'s execution plan visits the rows — typically index order for an index seek, or physical storage order for a table scan — and this order is NOT something ORDER BY (even if it were syntactically valid) could control for a write statement, since ORDER BY only affects the order OUTPUT rows are returned in for SELECT, not the internal order operations are applied in.',
        'The actual technique for guaranteeing a consistent lock acquisition order across multiple discrete resources — exactly what the theory\'s own "Fix 1" example does correctly — is to issue SEPARATE UPDATE statements in the desired sequence (lowest ID first, consistently, across every transaction that touches these rows), not to rely on any single statement\'s internal row-visiting order.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the Q&A\'s literal suggestion',
      language: 'sql',
      code: `CREATE TABLE accounts (id INT PRIMARY KEY, balance DECIMAL(10,2));
INSERT INTO accounts VALUES (1, 100), (5, 100), (9, 100);

-- The Q&A's exact suggested pattern, applied to an UPDATE:
UPDATE accounts
SET    balance = balance + 10
WHERE  id IN (1, 5, 9)
ORDER  BY id;

-- MSSQL: Msg 156, Level 15, State 1
-- Incorrect syntax near the keyword 'ORDER'.

-- PostgreSQL: ERROR:  syntax error at or near "ORDER"
-- LINE 4: ORDER BY id;
--         ^
--
-- Both dialects reject this immediately -- UPDATE's grammar has no
-- ORDER BY clause at all, unlike SELECT.`,
    },
    {
      label: 'Why ORDER BY on a SELECT wouldn\'t help even if UPDATE allowed it',
      language: 'sql',
      code: `-- Even a read-only SELECT with ORDER BY only controls the order rows
-- are RETURNED to the client -- it says nothing about the order the
-- engine internally acquires locks while evaluating the WHERE clause:
SELECT id, balance FROM accounts WHERE id IN (1, 5, 9) ORDER BY id;
-- This SELECT's execution plan might still scan the table (or an
-- index) in an entirely different internal order, then SORT the
-- results afterward to satisfy ORDER BY -- the sort happens on the
-- OUTPUT, not on the order operations were performed during
-- execution. ORDER BY was never a lock-ordering mechanism, even in
-- principle, for either SELECT or (if it were valid) UPDATE.`,
    },
    {
      label: 'The actual technique — separate statements, consistent order',
      language: 'sql',
      code: `-- What genuinely guarantees consistent lock acquisition order across
-- ALL concurrent transactions touching these three rows: issue
-- separate statements, always in the same ascending ID sequence,
-- exactly like the theory's own "Fix 1" pattern for two accounts:
BEGIN TRAN;
UPDATE accounts SET balance = balance + 10 WHERE id = 1;
UPDATE accounts SET balance = balance + 10 WHERE id = 5;
UPDATE accounts SET balance = balance + 10 WHERE id = 9;
COMMIT;

-- Every transaction touching these three accounts, anywhere in the
-- application, must follow this SAME id = 1, then 5, then 9 sequence
-- -- consistently applied across the codebase, not expressed via any
-- single statement's syntax -- to actually prevent a lock-ordering
-- deadlock cycle from forming.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reads the main page\'s Q&A and adds WHERE id IN (1, 5, 9) ORDER BY id to a production UPDATE statement, expecting it to control lock acquisition order and prevent a recurring deadlock. What happens when they deploy this change, and what should they do instead?',
    hint: 'Check whether UPDATE\'s grammar in either MSSQL or PostgreSQL actually accepts an ORDER BY clause at all.',
    solution: `The deployment fails outright — ORDER BY is not valid syntax on an
UPDATE statement in either MSSQL or PostgreSQL, so the statement
raises a syntax error and never executes at all. This isn't a subtle
runtime behavior difference; it's a hard parse-time rejection that
would be caught immediately (in testing, or at worst in production
the moment that code path runs).

What the developer should do instead is split the single multi-row
UPDATE into separate, individual UPDATE statements, each targeting
one row, issued in a consistent ascending order (id = 1, then id = 5,
then id = 9) — and ensure every OTHER transaction in the codebase
that touches these same three accounts follows that identical
sequence. This is exactly the technique the main page's own "Fix 1"
deadlock-prevention example already demonstrates correctly for two
accounts — the Q&A's ORDER BY suggestion was describing the right
GOAL (consistent lock ordering) with the wrong, non-existent SQL
mechanism.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'adding ORDER BY id to the WHERE clause of an UPDATE statement controls the order in which the engine acquires row locks for the affected rows.',
      reality: 'UPDATE\'s grammar in both MSSQL and PostgreSQL has no ORDER BY clause at all — this is a syntax error, not a working lock-ordering technique, in either dialect.',
    },
    {
      thought: 'even where ORDER BY is valid (on a SELECT), it would control the internal order the engine visits and locks rows in during execution.',
      reality: 'ORDER BY only controls the order rows are returned to the client in the final output — it does not dictate the engine\'s internal execution or locking order, which is determined by the query plan (index scan order, table scan order, etc.).',
    },
    {
      thought: 'the correct way to guarantee consistent lock acquisition order across multiple rows is a special SQL clause or hint applied to a single statement.',
      reality: 'the correct technique is architectural, not syntactic — issuing separate statements in a consistently-applied order across every transaction in the codebase that touches the same set of resources, exactly as the main page\'s own "Fix 1" two-account example does.',
    },
  ];
}
