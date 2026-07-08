import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-bank-transfer-already-safe-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-bank-transfer-example-is-already-safe-without-updlock.html',
  styleUrl: './testing-that-the-bank-transfer-example-is-already-safe-without-updlock.scss',
})
export class TestingThatTheBankTransferExampleIsAlreadySafeWithoutUpdlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Self-Referencing UPDATE Is Already Atomic — No Locking Hint Required',
      points: [
        'The main page\'s own bank-transfer example uses UPDATE Accounts SET Balance = Balance - 500 WHERE AccountID = 1 — a single, atomic, self-referencing UPDATE, where the read of the current Balance and the write of the new value happen INSIDE one statement. Under any standard isolation level, including the default READ COMMITTED, the engine takes an exclusive row lock BEFORE reading the row\'s current value and holds it until the transaction ends. A second, concurrent UPDATE against the same row must wait, then applies against the POST-first-transaction value. This pattern is safe from the lost-update anomaly the main page\'s own theory describes — by construction, with no explicit locking hint like WITH (UPDLOCK) required.',
        'This is easy to doubt, because the main page\'s own theory on lost updates ("two sessions both read balance=1000, both subtract 100, both write back 900 — one deduction is lost") describes exactly the kind of scenario the bank-transfer example superficially resembles. The difference is entirely in HOW the update is expressed: a separate SELECT followed by an application-computed UPDATE (using a value read into application memory) is genuinely vulnerable; a single self-referencing UPDATE statement computed entirely inside the database is not.',
      ],
    },
    {
      heading: 'The Genuinely Vulnerable Pattern Is Shown Later on the Same Page',
      points: [
        'The main page\'s own "WITH (UPDLOCK)" example is structured completely differently: SELECT Quantity FROM Inventory ... (a separate read, into an application variable) followed by a SEPARATE UPDATE statement using that previously-read value. This two-statement, read-then-write pattern genuinely needs WITH (UPDLOCK) to prevent a lost update — without it, another transaction\'s UPDATE can interleave between the SELECT and the UPDATE.',
        'Testing both patterns side by side under real concurrent sessions confirms the distinction directly: the self-referencing UPDATE pattern (bank transfer) serializes correctly with zero data loss even with no locking hints at all; the naive SELECT-then-UPDATE pattern (without UPDLOCK) genuinely loses an update under the same concurrent load.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the bank-transfer pattern is safe under concurrency',
      language: 'sql',
      code: `-- Two sessions, both debiting the SAME account by 500, run concurrently
-- (interleaving simulated with session markers):

-- Session 1                              -- Session 2
BEGIN TRANSACTION;                        -- (not yet started)
UPDATE Accounts SET Balance = Balance - 500
WHERE AccountID = 1;
-- Session 1 now holds an exclusive row
-- lock on AccountID = 1's row.
                                           BEGIN TRANSACTION;
                                           UPDATE Accounts SET Balance = Balance - 500
                                           WHERE AccountID = 1;
                                           -- Session 2 BLOCKS here, waiting
                                           -- for Session 1's row lock to release.
COMMIT TRANSACTION;                       -- Session 1 commits (Balance now 500 lower)
                                           -- Session 2 UNBLOCKS, applies its own
                                           -- -500 against the ALREADY-UPDATED value
                                           COMMIT TRANSACTION;

-- Starting balance 1000: after both commit, Balance = 0 -- BOTH debits
-- were correctly applied. Neither was lost, despite no UPDLOCK hint.`,
    },
    {
      label: 'The genuinely vulnerable pattern — SELECT then application UPDATE, no UPDLOCK',
      language: 'sql',
      code: `-- Two sessions, both performing a naive SELECT-then-UPDATE against
-- Inventory.Quantity, WITHOUT the main page's own UPDLOCK hint:

-- Session 1                              -- Session 2
SELECT Quantity FROM Inventory             -- reads Quantity = 100 into app memory
WHERE ProductID = 5;                       SELECT Quantity FROM Inventory
                                           WHERE ProductID = 5;  -- ALSO reads 100
                                           -- no lock is held after either SELECT
-- App computes 100 - 10 = 90
UPDATE Inventory SET Quantity = 90
WHERE ProductID = 5;
                                           -- App (independently) computes 100 - 10 = 90
                                           UPDATE Inventory SET Quantity = 90
                                           WHERE ProductID = 5;

-- Final Quantity = 90 -- but TWO deductions of 10 should have produced
-- 80. One deduction was silently lost, because both sessions computed
-- their new value from the SAME stale read of 100.

-- The main page's own fix -- WITH (UPDLOCK) -- closes exactly this gap
-- by holding a lock from the SELECT through the UPDATE, forcing the
-- second session to wait and read the POST-first-update value instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reviewing the main page\'s bank-transfer example insists it needs <code>WITH (UPDLOCK)</code> added to the UPDATE statements "just to be safe," since it looks structurally similar to the lost-update scenario the page describes elsewhere. Using the mechanics demonstrated above, explain whether they\'re right, and what would actually change (or not change) if UPDLOCK were added.',
    hint: 'Think about whether the bank-transfer UPDATE ever reads the Balance into application memory before writing a new value, the way the Inventory/UPDLOCK example does.',
    solution: `The teammate is not correct that UPDLOCK is needed here. UPDATE
Accounts SET Balance = Balance - 500 WHERE AccountID = 1 is a single,
self-referencing statement -- the read of the current Balance and the
write of the new value happen atomically inside the database, under
one exclusive row lock taken automatically the moment the UPDATE
starts. There is no separate SELECT reading the value into application
memory first, so there is no window where a concurrent transaction
could interleave and cause a lost update -- the row lock already
serializes concurrent debits correctly.

Adding WITH (UPDLOCK) to this specific statement would change nothing
observable: UPDLOCK affects how a SELECT acquires its lock ahead of a
later UPDATE, but this UPDATE doesn't have a preceding SELECT to
protect. The genuinely at-risk pattern is the SEPARATE SELECT-then-
UPDATE shown in the main page's own Inventory example, where UPDLOCK
is the actual, necessary fix.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own bank-transfer example (UPDATE Accounts SET Balance = Balance - 500) is vulnerable to the same lost-update anomaly described in its own theory section, since both involve two transactions modifying the same row concurrently.',
      reality: 'a single, self-referencing UPDATE statement is atomic — the row lock is acquired before the read happens, inside the same statement, making it safe from the lost-update anomaly by construction. The vulnerable pattern requires a SEPARATE read (into application memory) followed by a separate write.',
    },
    {
      thought: 'any two concurrent transactions modifying the same row need an explicit locking hint like WITH (UPDLOCK) to avoid data loss.',
      reality: 'WITH (UPDLOCK) is specifically needed to bridge a gap between a SELECT and a LATER, separate UPDATE — a single self-referencing UPDATE statement (as in the bank-transfer example) already has the protection built in, with no hint required.',
    },
    {
      thought: 'adding WITH (UPDLOCK) defensively to every UPDATE statement, "just in case," is a harmless way to guard against lost updates.',
      reality: 'UPDLOCK is meaningful specifically on a SELECT that precedes a later UPDATE — applying it to a statement that has no such preceding read (like the bank-transfer UPDATE) doesn\'t add meaningful protection, since the statement was already safe.',
    },
  ];
}
