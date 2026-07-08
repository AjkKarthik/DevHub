import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-not-valid-lock-demonstration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './not-valid-plus-validate-constraint-avoids-the-full-table-lock.html',
  styleUrl: './not-valid-plus-validate-constraint-avoids-the-full-table-lock.scss',
})
export class NotValidPlusValidateConstraintAvoidsTheFullTableLockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Lock Difference Described in Prose, Never Shown',
      points: [
        'The main page\'s quiz explanation for NOT VALID is accurate and detailed: "Adds the constraint definition immediately without scanning existing rows... A subsequent ALTER TABLE ... VALIDATE CONSTRAINT runs the scan with a weaker ShareUpdateExclusiveLock, allowing reads/writes during validation. Ideal for zero-downtime FK additions on large tables." This is correct PostgreSQL behavior — but the page never actually demonstrates the lock difference concretely, leaving "ideal for zero-downtime" as a claim to trust rather than something shown.',
        'The page\'s own theory section separately notes, without connecting the two: "Adding a constraint to an existing table triggers a full table scan to validate current data — can be slow on large tables." That statement describes the DEFAULT (non-NOT VALID) behavior, which also takes an AccessExclusiveLock for the duration of that scan — blocking ALL reads and writes on the table, not just other DDL.',
      ],
    },
    {
      heading: 'What "Zero-Downtime" Actually Means Here',
      points: [
        'A plain ALTER TABLE ... ADD CONSTRAINT ... CHECK (...) takes an AccessExclusiveLock immediately and holds it for the entire duration of the validating table scan — on a large table, this can mean the application is unable to read OR write that table for minutes.',
        'ALTER TABLE ... ADD CONSTRAINT ... NOT VALID takes the same AccessExclusiveLock, but only briefly, to update table metadata — no scan happens at that point, so the lock releases almost immediately. The subsequent ALTER TABLE ... VALIDATE CONSTRAINT then does the actual scan, but under a much weaker ShareUpdateExclusiveLock, which permits concurrent SELECT, INSERT, UPDATE, and DELETE — only conflicting with other DDL operations like a second ALTER TABLE.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the lock a plain ADD CONSTRAINT takes',
      language: 'sql',
      code: `-- Session A: start adding a CHECK constraint to a large table
BEGIN;
ALTER TABLE orders ADD CONSTRAINT ck_orders_amount CHECK (amount > 0);
-- While this runs (full table scan to validate existing rows),
-- check what lock it's holding from another session:

-- Session B (run concurrently):
SELECT relation::regclass, mode, granted
FROM pg_locks
WHERE relation = 'orders'::regclass;

--  relation |          mode           | granted
-- ----------+--------------------------+---------
--  orders   | AccessExclusiveLock     | t
--
-- AccessExclusiveLock blocks EVERY other operation on the table --
-- SELECT, INSERT, UPDATE, DELETE, and other DDL all queue up behind
-- Session A until its COMMIT.`,
    },
    {
      label: 'Confirming the weaker lock with NOT VALID + VALIDATE',
      language: 'sql',
      code: `-- Session A: add the constraint as NOT VALID first (near-instant)
ALTER TABLE orders ADD CONSTRAINT ck_orders_amount CHECK (amount > 0) NOT VALID;
-- This commits almost immediately -- no table scan happens here.

-- Session A: now validate it (the actual scan)
ALTER TABLE orders VALIDATE CONSTRAINT ck_orders_amount;
-- While THIS runs, check the lock from Session B:

SELECT relation::regclass, mode, granted
FROM pg_locks
WHERE relation = 'orders'::regclass;

--  relation |            mode              | granted
-- ----------+-------------------------------+---------
--  orders   | ShareUpdateExclusiveLock     | t
--
-- ShareUpdateExclusiveLock does NOT block SELECT, INSERT, UPDATE,
-- or DELETE -- Session B's application traffic continues normally
-- while the validation scan runs in the background.`,
    },
    {
      label: 'Proving reads/writes actually proceed during VALIDATE CONSTRAINT',
      language: 'sql',
      code: `-- Session B, run WHILE Session A's VALIDATE CONSTRAINT (above) is
-- still in progress on a large orders table:
INSERT INTO orders (order_id, amount) VALUES (99999, 42.00);
-- Succeeds immediately -- no blocking, no timeout.

SELECT COUNT(*) FROM orders WHERE amount > 100;
-- Also succeeds immediately.
--
-- Repeat the identical INSERT/SELECT while a PLAIN (non-NOT VALID)
-- ADD CONSTRAINT is running instead, and both statements will HANG
-- until the AccessExclusiveLock is released at COMMIT -- this is
-- the concrete difference "zero-downtime" is actually describing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team needs to add a CHECK constraint to a 200-million-row orders table that receives constant application traffic, and can\'t afford several minutes of blocked reads/writes during a maintenance window. Based on the lock behavior demonstrated above, what\'s the two-step approach, and what does each step actually cost in terms of blocking?',
    hint: 'Split the single ALTER TABLE ... ADD CONSTRAINT into the two statements shown above — which one is fast-but-blocking, and which one is slow-but-non-blocking?',
    solution: `The two-step approach is: (1) ALTER TABLE orders ADD CONSTRAINT
ck_orders_amount CHECK (amount > 0) NOT VALID; followed by (2) ALTER
TABLE orders VALIDATE CONSTRAINT ck_orders_amount;.

Step 1 takes an AccessExclusiveLock, but only briefly -- it just
updates table metadata to record the new constraint, with no table
scan, so the lock releases almost instantly even on a 200-million-row
table. Step 2 does the actual full-table scan to validate every
existing row against the CHECK expression, but under a
ShareUpdateExclusiveLock, which does NOT block SELECT, INSERT,
UPDATE, or DELETE -- only other DDL. Application traffic continues
uninterrupted while step 2 runs, however long it takes.

A single plain ALTER TABLE ... ADD CONSTRAINT ... CHECK (...) (no
NOT VALID) instead holds the AccessExclusiveLock for the ENTIRE
duration of the validating scan, which on 200 million rows could mean
minutes of every read and write on the table queuing up -- exactly
what the team can't afford.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'NOT VALID skips validating existing rows against the new constraint entirely, meaning invalid data could silently remain in the table.',
      reality: 'NOT VALID only DEFERS validation to a later, explicit VALIDATE CONSTRAINT step — it doesn\'t skip it. New rows are checked against the constraint immediately after the NOT VALID statement; only pre-existing rows wait for the VALIDATE CONSTRAINT step to be checked.',
    },
    {
      thought: 'both a plain ADD CONSTRAINT and the NOT VALID + VALIDATE CONSTRAINT pattern hold the same kind of lock — the only difference is when the table scan happens.',
      reality: 'the lock TYPE itself differs — a plain ADD CONSTRAINT holds AccessExclusiveLock (blocking everything) for its entire scan, while VALIDATE CONSTRAINT holds the much weaker ShareUpdateExclusiveLock (blocking only other DDL) for its scan.',
    },
    {
      thought: '"zero-downtime constraint addition" is marketing language for a technique that still causes some brief blocking most users won\'t notice.',
      reality: 'in this specific case it\'s literal — application SELECT/INSERT/UPDATE/DELETE traffic can be confirmed to proceed without any blocking at all while VALIDATE CONSTRAINT\'s scan runs, as demonstrated directly above.',
    },
  ];
}
