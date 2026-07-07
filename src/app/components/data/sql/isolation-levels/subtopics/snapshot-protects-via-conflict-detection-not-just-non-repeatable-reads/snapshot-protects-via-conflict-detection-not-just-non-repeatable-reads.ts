import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-snapshot-conflict-detection-mechanism-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './snapshot-protects-via-conflict-detection-not-just-non-repeatable-reads.html',
  styleUrl: './snapshot-protects-via-conflict-detection-not-just-non-repeatable-reads.scss',
})
export class SnapshotProtectsViaConflictDetectionNotJustNonRepeatableReadsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Comment That Explains the Wrong Half of the Protection',
      points: [
        'The challenge\'s scenario 2 solution comment says: "SNAPSHOT prevents non-repeatable read without blocking." That\'s true, but it\'s not actually what makes the bank-transfer pattern (read balance, check, then conditionally deduct) safe under concurrency — preventing a non-repeatable READ says nothing about what happens when TWO transactions both read the same balance and then both try to WRITE a deduction.',
        'The mechanism that actually makes this pattern safe is update-conflict DETECTION: when two SNAPSHOT transactions both read balance = 1000 and both decide to deduct, the FIRST one to actually execute its UPDATE succeeds; the SECOND one\'s UPDATE is rejected with error 3960 ("Snapshot isolation transaction aborted due to update conflict") the moment it tries to modify a row that changed since its snapshot began. Without this write-conflict check, both transactions could independently believe "balance is high enough" and both deduct — a lost-update bug — even though neither read a stale value.',
      ],
    },
    {
      heading: 'Why the Distinction Is Worth Making Explicit',
      points: [
        'A developer who internalizes "SNAPSHOT prevents non-repeatable reads" as the FULL explanation might reasonably (but incorrectly) assume any read-based check under SNAPSHOT is automatically race-free, even for patterns that don\'t go on to WRITE based on that read — or conversely, might not realize that removing the UPDATE step (e.g., replacing it with a read-only report) removes the safety net entirely, since there would be nothing left to trigger a conflict check.',
        'This subtopic reproduces the true race directly: two SNAPSHOT transactions both reading a sufficient balance, both attempting to deduct, and shows explicitly that it\'s the SECOND transaction\'s UPDATE — not either of their SELECTs — that fails.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'sql',
      code: `ALTER DATABASE CURRENT SET ALLOW_SNAPSHOT_ISOLATION ON;
CREATE TABLE accounts (account_id INT PRIMARY KEY, balance DECIMAL(10,2));
INSERT INTO accounts VALUES (1, 1000.00);`,
    },
    {
      label: 'Session A and B both read the SAME sufficient balance',
      language: 'sql',
      code: `-- Session A:
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRAN;
DECLARE @bal_a DECIMAL(10,2);
SELECT @bal_a = balance FROM accounts WHERE account_id = 1;  -- 1000.00
-- @bal_a >= 500 -> true, Session A intends to deduct 500

-- Session B, run concurrently, BEFORE Session A's UPDATE:
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRAN;
DECLARE @bal_b DECIMAL(10,2);
SELECT @bal_b = balance FROM accounts WHERE account_id = 1;  -- ALSO 1000.00
-- @bal_b >= 500 -> ALSO true, Session B ALSO intends to deduct 500
--
-- Both reads succeeded, both saw the SAME value, and neither read
-- was "non-repeatable" in any sense that failed -- the risk is
-- entirely in what happens next.`,
    },
    {
      label: 'The write-conflict check is what actually catches the race',
      language: 'sql',
      code: `-- Session A proceeds first:
UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
COMMIT;
-- Succeeds. balance is now 500.00.

-- Session B, still holding its snapshot from BEFORE Session A's
-- commit, now attempts its own deduction:
UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
-- Msg 3960, Level 16, State 2
-- Snapshot isolation transaction aborted due to update conflict.
-- You cannot use snapshot isolation to access table 'accounts'
-- directly or indirectly in database 'X' to update, delete, or
-- insert the row that has been modified or deleted by another
-- transaction since the start of this transaction.

-- Session B's COMMIT never happens -- the transaction must be
-- retried (re-reading the NOW-current balance of 500, correctly
-- failing the @bal >= 500... well actually it would still pass at
-- 500, but the point stands: it re-evaluates against fresh data,
-- not the stale 1000 it originally read).
ROLLBACK;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, having read the challenge\'s comment "SNAPSHOT prevents non-repeatable read without blocking," modifies the bank-transfer pattern to skip the UPDATE entirely for a "preview my transfer" read-only feature that just displays whether a transfer WOULD succeed, without ever writing. Are two concurrent calls to this read-only preview feature protected against showing an inconsistent picture, and why does the answer differ from the write-based scenario?',
    hint: 'The 3960 conflict error only fires on an actual UPDATE attempting to modify a row changed since the snapshot began — check whether a read-only preview ever reaches that code path.',
    solution: `A read-only preview feature under SNAPSHOT isolation IS protected
against non-repeatable reads (each read within its own transaction
sees a single consistent snapshot, so the balance won't change
mid-preview) -- but it gets NONE of the write-conflict protection
demonstrated above, because that protection only triggers when an
actual UPDATE statement attempts to modify a row that changed since
the snapshot began. A read-only transaction never issues that UPDATE,
so there's nothing for SQL Server to detect a conflict against.

This means two concurrent "preview" calls can both correctly report
"yes, this transfer would succeed" based on their own consistent
(but now-stale) snapshot of the balance -- and if both previews are
later acted on by actually executing the transfer, THAT is where the
3960 conflict would surface, on the second write. The lesson: SNAPSHOT\'s
non-repeatable-read protection and its write-conflict protection are
two separate guarantees that apply to different operations (reads vs.
writes) -- removing the write from a pattern removes the safety net
the challenge's bank-transfer scenario actually depends on, even
though the READ-safety half remains intact.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the reason the challenge\'s bank-transfer pattern is safe under SNAPSHOT isolation is that SNAPSHOT prevents the balance from appearing to change during a re-read within the transaction.',
      reality: 'preventing a non-repeatable read is real, but it\'s not what stops two concurrent transactions from both deducting based on the same stale balance — that protection comes from a separate mechanism: write-conflict detection (error 3960) firing when a transaction\'s UPDATE targets a row already modified by another transaction since its snapshot began.',
    },
    {
      thought: 'any read-based decision made under SNAPSHOT isolation is automatically race-free against concurrent transactions making the same decision.',
      reality: 'the race-freedom in the bank-transfer pattern specifically depends on the subsequent UPDATE statement triggering a write-conflict check — a read-only decision with no corresponding write gets snapshot consistency (no non-repeatable reads) but no protection against two concurrent reads seeing the same soon-to-be-stale value.',
    },
    {
      thought: 'error 3960 (snapshot isolation update conflict) indicates something has gone wrong with the SNAPSHOT isolation configuration and needs a DBA to investigate.',
      reality: 'error 3960 is SNAPSHOT isolation working exactly as designed — it\'s the mechanism that catches a genuine write-write race and forces the losing transaction to retry against fresh data, precisely the protection the bank-transfer scenario relies on.',
    },
  ];
}
