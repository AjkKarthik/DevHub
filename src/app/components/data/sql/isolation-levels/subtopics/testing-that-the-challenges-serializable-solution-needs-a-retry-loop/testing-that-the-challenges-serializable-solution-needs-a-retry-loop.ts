import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-serializable-challenge-retry-loop-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-serializable-solution-needs-a-retry-loop.html',
  styleUrl: './testing-that-the-challenges-serializable-solution-needs-a-retry-loop.scss',
})
export class TestingThatTheChallengesSerializableSolutionNeedsARetryLoopSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One SERIALIZABLE, Two Completely Different Failure Modes',
      points: [
        'The challenge\'s scenario 3 solution is presented as a single, dialect-neutral snippet: SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRAN; IF NOT EXISTS (...) INSERT ...; COMMIT;. But MSSQL and PostgreSQL implement SERIALIZABLE via fundamentally different mechanisms, and the challenge solution never distinguishes them: MSSQL uses range LOCKS (the second concurrent transaction BLOCKS, then proceeds safely once the first commits or rolls back); PostgreSQL uses Serializable Snapshot Isolation, SSI (the second concurrent transaction is allowed to proceed and is instead ABORTED with a serialization_failure error at COMMIT time).',
        'The main page\'s own separate "SERIALIZABLE & retry (PostgreSQL)" code tab correctly shows the retry-loop pattern this requires — but the challenge solution for the seat-booking scenario never references it, or mentions that a PostgreSQL implementation of this exact pattern needs that retry logic to work correctly at all.',
      ],
    },
    {
      heading: 'What Actually Happens Without the Retry Loop',
      points: [
        'Running the challenge\'s scenario 3 solution as a plain SQL block (no retry wrapper) against PostgreSQL, with two sessions racing to book the same seat, produces an UNHANDLED serialization_failure error on whichever session commits second — not a graceful "seat already booked" outcome, and not a silent, safe no-op. The application (or the raw SQL client) sees a database error it must specifically catch and retry, or the booking attempt simply fails with no indication to the user of what to do next.',
        'This subtopic reproduces both dialects\' actual behavior side by side, then applies the main page\'s own retry-loop pattern to the challenge\'s scenario 3 code, closing the gap between the two sections of the same page.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — the challenge\'s solution genuinely just blocks, then proceeds',
      language: 'sql',
      code: `CREATE TABLE bookings (seat_id INT PRIMARY KEY, user_id INT);

-- Session A:
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
IF NOT EXISTS (SELECT 1 FROM bookings WHERE seat_id = 42)
    INSERT INTO bookings (seat_id, user_id) VALUES (42, 99);
-- (Session A has NOT committed yet -- deliberately paused here)

-- Session B, run concurrently:
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
IF NOT EXISTS (SELECT 1 FROM bookings WHERE seat_id = 42)
    INSERT INTO bookings (seat_id, user_id) VALUES (42, 101);
-- Session B BLOCKS here -- MSSQL's range lock on seat_id = 42 makes
-- it wait for Session A to finish.

-- Session A commits:
COMMIT;
-- Session B now unblocks -- but its own IF NOT EXISTS check ran
-- BEFORE Session A committed, using data that's now stale. MSSQL's
-- range locking actually causes Session B's INSERT to then raise a
-- PRIMARY KEY violation (since seat 42 now exists) -- a clean,
-- catchable error, but still an error the challenge's plain solution
-- never anticipates or handles.`,
    },
    {
      label: 'PostgreSQL — the challenge\'s plain solution errors with no retry',
      language: 'sql',
      code: `CREATE TABLE bookings (seat_id INT PRIMARY KEY, user_id INT);

-- Session A:
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT 1 FROM bookings WHERE seat_id = 42;  -- not found
-- (paused before INSERT/COMMIT)

-- Session B, run concurrently:
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT 1 FROM bookings WHERE seat_id = 42;  -- also not found
INSERT INTO bookings (seat_id, user_id) VALUES (42, 101);
COMMIT;  -- Session B commits successfully

-- Session A, now also proceeding (SSI allowed both to run concurrently):
INSERT INTO bookings (seat_id, user_id) VALUES (42, 99);
COMMIT;
-- ERROR: could not serialize access due to read/write dependencies
--        among transactions
-- SQLSTATE: 40001 (serialization_failure)
--
-- Unlike MSSQL, PostgreSQL did NOT block Session A -- it let both
-- transactions run, then aborted the one that would have created a
-- serialization anomaly. The challenge's plain solution, with no
-- TRY/CATCH or retry loop, simply surfaces this error to the caller.`,
    },
    {
      label: 'Applying the page\'s own retry pattern to the challenge\'s scenario',
      language: 'sql',
      code: `-- Using the exact retry-loop shape from the main page's own
-- "SERIALIZABLE & retry (PostgreSQL)" code tab, applied to scenario 3:
DO $$
DECLARE
    retries INT := 0;
BEGIN
    LOOP
        BEGIN
            BEGIN;
            IF NOT EXISTS (SELECT 1 FROM bookings WHERE seat_id = 42) THEN
                INSERT INTO bookings (seat_id, user_id) VALUES (42, 99);
            END IF;
            COMMIT;
            EXIT;
        EXCEPTION WHEN serialization_failure THEN
            retries := retries + 1;
            IF retries > 3 THEN RAISE; END IF;
        END;
    END LOOP;
END;
$$;
-- Now the losing transaction retries automatically instead of
-- surfacing a raw database error -- on retry, it correctly observes
-- the seat is now taken and skips the INSERT, exactly matching what
-- MSSQL's blocking behavior achieves inherently, without needing an
-- explicit retry wrapper.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements the challenge\'s exact scenario 3 solution against PostgreSQL, without wrapping it in a retry loop, reasoning "SERIALIZABLE prevents the double-booking, so this is already correct." Two users click "book seat 42" within the same second. What actually happens to each of them, and is the team\'s reasoning correct?',
    hint: 'SERIALIZABLE preventing a double-booking and SERIALIZABLE preventing an unhandled ERROR are two different claims — check which one the challenge\'s plain code actually guarantees on PostgreSQL.',
    solution: `The team's reasoning is half right: SERIALIZABLE genuinely does
prevent the double-booking itself — seat 42 will never end up with
two rows in the bookings table. But it does NOT prevent an unhandled
database error from reaching one of the two users. Both sessions'
initial SELECT checks can run concurrently and both see "seat not
booked yet"; one INSERT+COMMIT succeeds, and the OTHER session's
COMMIT fails with a raw serialization_failure (SQLSTATE 40001) error
-- not a friendly "seat already taken" message, just an unhandled
database exception surfacing wherever the application's error
handling (or lack of it) sends it.

Without the retry loop shown in the main page's own separate code
tab, that user's booking attempt simply fails with a database error,
even though from a business logic standpoint they should just be told
"someone else got that seat, try another." The fix is exactly the
retry pattern demonstrated above -- on the serialization_failure, retry
the transaction, and on retry the NOT EXISTS check correctly reflects
the now-committed booking, letting the application respond
gracefully instead of raising a raw exception to the end user.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE behaves the same way in MSSQL and PostgreSQL — both simply block a second concurrent transaction until the first one finishes.',
      reality: 'MSSQL SERIALIZABLE uses range locks and genuinely blocks; PostgreSQL SERIALIZABLE (SSI) allows both transactions to proceed concurrently and instead aborts one with a serialization_failure error at commit time — a completely different failure mode.',
    },
    {
      thought: 'if a transaction is wrapped in SERIALIZABLE, the surrounding application code never needs special error handling, since the isolation level "handles" the concurrency automatically.',
      reality: 'on PostgreSQL specifically, SERIALIZABLE transactions MUST be prepared to catch a serialization_failure error and retry — without that handling, one of two genuinely legitimate concurrent users will see a raw database error instead of a graceful outcome.',
    },
    {
      thought: 'a challenge solution presented as one dialect-neutral SQL snippet, without separate MSSQL/PostgreSQL versions, implies both dialects need the same amount of surrounding application logic to work correctly.',
      reality: 'in this specific case they don\'t — MSSQL\'s blocking behavior means the plain snippet alone is closer to sufficient, while PostgreSQL requires the additional retry-loop wrapper shown elsewhere on the same page to avoid surfacing raw errors to legitimate concurrent users.',
    },
  ];
}
