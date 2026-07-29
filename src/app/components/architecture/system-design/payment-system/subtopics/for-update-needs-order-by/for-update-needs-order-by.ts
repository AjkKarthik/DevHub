import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './for-update-needs-order-by.html',
  styleUrl: './for-update-needs-order-by.scss'
})
export class SortingIdsDoesntGuaranteeLockOrderWithoutOrderBySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A deadlock-prevention comment the query itself doesn\'t actually enforce',
      points: [
        'The Challenge solution\'s transfer() function sorts the two account IDs (const [accountA, accountB] = [from, to].sort()) with the comment "Lock BOTH accounts in consistent order (lower ID first) to prevent deadlock," then runs SELECT id, balance FROM accounts WHERE id IN (?, ?) FOR UPDATE. Verified: a bare WHERE ... IN() clause with no ORDER BY does NOT guarantee the database locks rows in the order the values appear in the IN list — the query planner is free to choose whatever scan order it likes. The page has been corrected to add ORDER BY id.',
        'Sorting the two IDs in application code before passing them to the query is a necessary step, but it\'s not sufficient on its own — the sorted order needs to be reflected in how the DATABASE actually acquires the locks, which requires an explicit ORDER BY clause in the SELECT ... FOR UPDATE statement itself.',
      ]
    },
    {
      heading: 'Why the missing ORDER BY specifically breaks the deadlock-prevention goal',
      points: [
        'The classic deadlock scenario this code is trying to avoid: Transfer 1 (A → B) and Transfer 2 (B → A) run concurrently. If Transfer 1 locks A then B, while Transfer 2 locks B then A, each can end up waiting on a lock the other already holds — a deadlock.',
        'The fix (sorting IDs so both transfers always try to lock the SAME two accounts in the SAME order, e.g. always the lower ID first) only works if the database actually acquires the locks in that sorted order. Without ORDER BY id in the query, a query like WHERE id IN (accountA, accountB) FOR UPDATE could return and lock the rows in an order determined by the table\'s physical layout or index scan path — which for a UUID primary key is effectively unrelated to the sorted comparison order used in application code.',
        'Adding ORDER BY id to the query makes the row-return (and therefore lock-acquisition) order deterministic and equal to ascending ID order — matching the sorted order the application code already computed, which is what actually closes the deadlock window.',
      ]
    },
    {
      heading: 'A general lesson: application-level ordering needs a matching database-level guarantee',
      points: [
        'This is a recurring category of bug: doing something "in a consistent order" in application code (sorting an array, iterating a Set in insertion order) doesn\'t automatically translate into the same consistent order at whatever downstream system actually performs the operation — the downstream system needs its own explicit ordering guarantee.',
        'For SELECT ... FOR UPDATE specifically, PostgreSQL\'s own documentation and mailing list discussions confirm that ORDER BY is the standard, recommended way to make row-locking order deterministic when multiple transactions might lock an overlapping set of rows — this isn\'t a database-specific quirk, it\'s the documented mechanism for exactly this use case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Missing ORDER BY vs. deterministic lock order',
      language: 'bash',
      code: `-- WITHOUT ORDER BY: sorting the IDs in application code doesn't
-- guarantee the DATABASE locks the rows in that same order.
SELECT id, balance FROM accounts
WHERE id IN ('a1111...', 'b2222...')
FOR UPDATE;
-- The query planner may return/lock these rows in whatever order
-- its chosen access path produces -- for a UUID column, this is
-- effectively unrelated to the sorted (ascending) comparison order.

-- WITH ORDER BY: row-locking order becomes deterministic and
-- matches the sorted order the application already computed.
SELECT id, balance FROM accounts
WHERE id IN ('a1111...', 'b2222...')
ORDER BY id
FOR UPDATE;
-- Now every transaction touching this same pair of accounts locks
-- them in the SAME order (ascending id) -- the classic "always lock
-- resources in a consistent global order" deadlock-avoidance pattern
-- actually holds at the database level, not just in application code.

-- Two concurrent transfers, WITHOUT the fix:
-- Transfer 1 (A -> B): locks in scan order [B, A] (arbitrary)
-- Transfer 2 (B -> A): locks in scan order [A, B] (arbitrary)
-- -> Transfer 1 holds B, waits for A. Transfer 2 holds A, waits for B.
-- -> DEADLOCK, even though both sorted their IDs in application code.

-- Same scenario, WITH "ORDER BY id FOR UPDATE":
-- Transfer 1 (A -> B): locks in id order [A, B] -- always
-- Transfer 2 (B -> A): locks in id order [A, B] -- always
-- -> Both attempt to lock A first. One waits briefly, then proceeds
--    once the other releases A. No deadlock.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A transfer function sorts two account IDs in application code (const [accountA, accountB] = [from, to].sort()), then runs SELECT id, balance FROM accounts WHERE id IN (?, ?) FOR UPDATE with no ORDER BY. The comment claims this "locks accounts in consistent order to prevent deadlock." Does it actually guarantee that, and if not, what\'s missing?',
    hint: 'Sorting the IDs in your application code determines the order of the VALUES passed to the query -- does that control the order in which the database engine returns and locks the matching rows?',
    solution: 'No, it does not guarantee consistent lock order -- sorting the IDs in application code only controls what values are passed into the IN() clause, not the order in which the database actually scans, returns, and locks the matching rows. Without an explicit ORDER BY id in the query, the database\'s query planner is free to choose any access path, and for a UUID-keyed table that access order is effectively unrelated to the application-level sorted order. The fix is adding ORDER BY id directly to the SELECT ... FOR UPDATE query -- this makes row-locking order deterministic and equal to ascending ID order, so every transaction touching the same pair of accounts genuinely locks them in the same order, which is what actually prevents the deadlock the original comment claimed to prevent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sorting an array of IDs in application code before passing them to a SELECT ... WHERE id IN (...) FOR UPDATE query is sufficient to guarantee the database locks the corresponding rows in that same sorted order.',
      reality: 'Per this subtopic\'s theory, the sorted order of VALUES passed into an IN() clause has no bearing on the ORDER in which the database\'s query planner scans and locks the matching rows — an explicit ORDER BY clause in the query itself is required to make that order deterministic.'
    },
    {
      thought: 'The "always lock resources in a consistent order to prevent deadlock" pattern is purely an application-level concern — as long as the application code is consistent, the database layer doesn\'t need anything special.',
      reality: 'Per this subtopic\'s theory, the consistent-ordering guarantee has to hold at whichever layer actually performs the locking — for SELECT ... FOR UPDATE, that\'s the database\'s row-locking order, which needs its own explicit ORDER BY to match the application\'s intended order, not just consistency in the application code alone.'
    },
    {
      thought: 'A deadlock-prevention comment in a code sample accurately describes what the code actually does, since the comment and the code were presumably written by the same author with the same intent in mind.',
      reality: 'Per this subtopic\'s theory, a comment describing INTENT ("lock in consistent order to prevent deadlock") can be wrong about what the code actually ACHIEVES — the intent was correct, but the specific SQL as originally written (missing ORDER BY) didn\'t fully implement it, which is exactly the kind of gap worth checking for rather than trusting the comment at face value.'
    }
  ];
}
