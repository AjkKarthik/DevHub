import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-deadlock-priority-not-a-fix-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-deadlock-priority-low-does-not-prevent-the-deadlock.html',
  styleUrl: './demonstrating-that-deadlock-priority-low-does-not-prevent-the-deadlock.scss',
})
export class DemonstratingThatDeadlockPriorityLowDoesNotPreventTheDeadlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "Fix" That\'s Really Just a Preference',
      points: [
        'The main page\'s "MSSQL deadlock demo & fix" code tab lists three items back to back: "Fix 1: access in consistent order," "Fix 2: SNAPSHOT isolation," and "Fix 3: set deadlock priority (this session loses instead of winning) SET DEADLOCK_PRIORITY LOW;" — presenting all three under the same "Fix" label, as if each one independently resolves the deadlock scenario shown above it.',
        'Fix 1 and Fix 2 are genuine deadlock PREVENTION techniques — applied correctly, the circular wait never forms in the first place. DEADLOCK_PRIORITY does something categorically different: it only influences which of the two deadlocked sessions SQL Server selects as the victim once a deadlock has ALREADY occurred. It does not prevent the deadlock cycle from forming at all — the other session (whichever has normal or higher priority) still gets killed with error 1205, just as reliably as before.',
      ],
    },
    {
      heading: 'What DEADLOCK_PRIORITY Actually Controls',
      points: [
        'SQL Server\'s deadlock detection runs on a fixed interval regardless of any session\'s DEADLOCK_PRIORITY setting — the cycle still forms, is still detected, and one participant is still killed. DEADLOCK_PRIORITY only shifts the VICTIM SELECTION criteria: normally the cheapest-to-roll-back transaction loses; setting one session to LOW guarantees it loses regardless of rollback cost (unless the OTHER session is set even lower).',
        'This is genuinely useful — for example, ensuring a background reporting job always loses a deadlock rather than a customer-facing transaction — but it\'s a victim-selection PREFERENCE, not a prevention TECHNIQUE, and grouping it under the same "Fix" heading as consistent lock ordering blurs a real, practically important distinction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the deadlock WITH "Fix 3" applied',
      language: 'sql',
      code: `CREATE TABLE accounts (account_id INT PRIMARY KEY, balance DECIMAL(10,2));
INSERT INTO accounts VALUES (1, 1000.00), (2, 1000.00);

-- Session A:
SET DEADLOCK_PRIORITY LOW;   -- "Fix 3" applied, exactly as the page describes
BEGIN TRAN;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
-- (paused here, before touching account 2)

-- Session B, run concurrently -- normal priority, opposite order:
BEGIN TRAN;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
-- Session B now WAITS for Session A's lock on account 1.

-- Session A continues:
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
-- Session A now WAITS for Session B's lock on account 2.
-- THE DEADLOCK CYCLE IS FORMED -- exactly as before "Fix 3" was applied.`,
    },
    {
      label: 'Confirming the deadlock still fires — DEADLOCK_PRIORITY only picked the loser',
      language: 'sql',
      code: `-- After SQL Server's deadlock monitor detects the cycle (typically
-- within a few seconds):

-- Session A's UPDATE returns:
-- Msg 1205, Level 13, State 51
-- Transaction (Process ID 52) was deadlocked on lock resources with
-- another process and has been chosen as the deadlock victim.
-- Rerun the transaction.

-- Session B's UPDATE, previously blocked, now proceeds and commits
-- successfully.
--
-- The deadlock DID occur -- error 1205 was still raised, exactly as
-- in the original unmodified demo. The ONLY difference "Fix 3" made
-- is WHICH session (A, the LOW-priority one) was guaranteed to be
-- the victim -- without it, the choice would have been based on
-- rollback cost instead, which could have gone either way.`,
    },
    {
      label: 'The genuine fixes, for contrast — the cycle never forms',
      language: 'sql',
      code: `-- Fix 1 (real prevention): consistent lock ordering -- BOTH sessions
-- must update account_id = 1 before account_id = 2:
-- Session A:
BEGIN TRAN;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;

-- Session B (SAME order now):
BEGIN TRAN;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;  -- waits for A, doesn't deadlock
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
-- Session B simply BLOCKS until Session A commits, then proceeds
-- normally -- no error 1205 at all. THIS is what "no deadlock occurs"
-- actually looks like, unlike DEADLOCK_PRIORITY LOW, which still
-- produces error 1205 every time the cycle forms.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds SET DEADLOCK_PRIORITY LOW; to a background batch job, based on the main page\'s "Fix 3," expecting deadlock errors involving that job to stop occurring. After deploying, the job still occasionally fails with error 1205. Was the team\'s expectation reasonable, and what should they check?',
    hint: 'Compare what DEADLOCK_PRIORITY actually changes (which session loses) against what the team expected it to change (whether a deadlock happens at all).',
    solution: `The team's expectation was not well-founded — DEADLOCK_PRIORITY LOW
does not stop deadlocks from occurring; it only guarantees that the
LOW-priority session (their batch job) is the one selected as the
victim whenever a deadlock cycle does form. The job will therefore
continue to occasionally receive error 1205 exactly as before,
though other, higher-priority transactions competing with it will
now no longer be killed in its place.

What they should check is whether the ACTUAL lock-ordering conflict
that's forming the deadlock cycle in the first place has been
addressed — the genuine fix (consistent lock acquisition order across
all transactions touching the same resources, as demonstrated above)
prevents the cycle from forming at all, which is the only way to make
error 1205 stop occurring entirely. DEADLOCK_PRIORITY is worth
keeping (it correctly ensures the batch job, not a customer
transaction, is the one that gets rolled back when a conflict does
occur), but it should be treated as a victim-selection preference
layered on top of real prevention, not a substitute for it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SET DEADLOCK_PRIORITY LOW; is a genuine fix that stops the deadlock scenario from occurring, the same way consistent lock ordering or SNAPSHOT isolation does.',
      reality: 'DEADLOCK_PRIORITY does not prevent the deadlock cycle from forming at all — it only controls which session is selected as the victim once a deadlock has already occurred; error 1205 still fires just as reliably.',
    },
    {
      thought: 'if a session has DEADLOCK_PRIORITY LOW set, it will simply wait its turn and avoid conflicting with other transactions instead of erroring out.',
      reality: 'a LOW-priority session still gets killed with a genuine error 1205 when a deadlock forms — the setting only guarantees it, specifically, is the one chosen to be killed, not that it avoids the deadlock or receives some gentler outcome.',
    },
    {
      thought: 'grouping DEADLOCK_PRIORITY alongside consistent lock ordering and SNAPSHOT isolation under the same "Fix" label implies all three solve the same underlying problem with equal effectiveness.',
      reality: 'consistent ordering and SNAPSHOT isolation prevent the deadlock cycle from forming; DEADLOCK_PRIORITY only changes victim selection after a cycle has already formed — these are different categories of solution, not interchangeable options.',
    },
  ];
}
