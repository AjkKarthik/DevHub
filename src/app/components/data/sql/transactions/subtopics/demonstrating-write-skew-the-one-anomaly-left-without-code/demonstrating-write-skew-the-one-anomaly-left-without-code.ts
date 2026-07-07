import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-demonstrating-write-skew-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-write-skew-the-one-anomaly-left-without-code.html',
  styleUrl: './demonstrating-write-skew-the-one-anomaly-left-without-code.scss',
})
export class DemonstratingWriteSkewTheOneAnomalyLeftWithoutCodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every Other Anomaly on the Page Gets Code — Write Skew Doesn\'t',
      points: [
        'The main page\'s own theory describes dirty reads, non-repeatable reads, phantom reads, and lost updates — and every one of them gets a concrete code demonstration somewhere else on the page. Write skew is described only as a word problem: "two doctors both check \'at least 1 doctor on call\' and each goes off call — the invariant is broken." No SQL ever shows this actually happening, or shows the exact isolation-level boundary where it stops happening.',
        'Write skew is subtle precisely because BOTH transactions individually check a real, true condition before writing — the anomaly only emerges from the COMBINATION of their two independent, individually-valid decisions. It cannot be demonstrated with a single-session example; it requires two genuinely concurrent transactions.',
      ],
    },
    {
      heading: 'REPEATABLE READ Doesn\'t Prevent It — SERIALIZABLE Does',
      points: [
        'Under REPEATABLE READ, both transactions read the SAME committed row set (doctors currently on call) and each modifies a DIFFERENT row (their own doctor_id) — since neither transaction\'s write touches a row the other transaction READ in a way the lock manager tracks as conflicting, both commit successfully, and the "at least one doctor on call" invariant silently breaks.',
        'Under SERIALIZABLE, the engine must guarantee the outcome is equivalent to SOME serial (one-at-a-time) execution of the two transactions — and no serial ordering of "check count, then go off call" for both doctors could ever leave zero doctors on call if the check genuinely required at least one to remain. The engine detects this conflict at commit time and aborts one of the two transactions with a serialization failure, forcing a retry.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing write skew under REPEATABLE READ (not prevented)',
      language: 'sql',
      code: `-- Setup: exactly 2 doctors currently on call
INSERT INTO doctors (doctor_id, name, on_call) VALUES
  (1, 'Dr. Alice', true),
  (2, 'Dr. Bob',   true);

-- Session 1 (REPEATABLE READ)              -- Session 2 (REPEATABLE READ)
BEGIN;                                       BEGIN;
SET TRANSACTION ISOLATION LEVEL
  REPEATABLE READ;
SELECT COUNT(*) FROM doctors                 SET TRANSACTION ISOLATION LEVEL
WHERE on_call = true;                          REPEATABLE READ;
-- sees 2 -- "at least 1 will remain          SELECT COUNT(*) FROM doctors
--  if I go off call" -- proceeds             WHERE on_call = true;
                                              -- ALSO sees 2 -- ALSO proceeds
UPDATE doctors SET on_call = false
WHERE doctor_id = 1;
COMMIT;
                                              UPDATE doctors SET on_call = false
                                              WHERE doctor_id = 2;
                                              COMMIT;
-- BOTH commits succeed -- neither UPDATE touched a row the OTHER
-- transaction read in a way that conflicts under REPEATABLE READ's
-- locking. Final state: on_call = false for BOTH doctors -- zero
-- doctors on call, violating the invariant neither transaction's own
-- logic individually broke.
SELECT COUNT(*) FROM doctors WHERE on_call = true;  -- returns 0`,
    },
    {
      label: 'The same scenario under SERIALIZABLE (prevented)',
      language: 'sql',
      code: `-- Reset: exactly 2 doctors on call again
UPDATE doctors SET on_call = true WHERE doctor_id IN (1, 2);

-- Session 1 (SERIALIZABLE)                 -- Session 2 (SERIALIZABLE)
BEGIN;                                       BEGIN;
SET TRANSACTION ISOLATION LEVEL
  SERIALIZABLE;
SELECT COUNT(*) FROM doctors                 SET TRANSACTION ISOLATION LEVEL
WHERE on_call = true;  -- sees 2               SERIALIZABLE;
                                              SELECT COUNT(*) FROM doctors
                                              WHERE on_call = true;  -- sees 2
UPDATE doctors SET on_call = false
WHERE doctor_id = 1;
COMMIT;   -- succeeds
                                              UPDATE doctors SET on_call = false
                                              WHERE doctor_id = 2;
                                              COMMIT;
                                              -- ERROR (PostgreSQL):
                                              -- could not serialize access due to
                                              -- read/write dependencies among transactions
                                              -- ERROR (MSSQL):
                                              -- Transaction was deadlocked on
                                              -- lock | thread resources... rerun the
                                              -- transaction (serialization failure)

-- One of the two transactions is forced to abort and retry -- the
-- application must catch this and re-run it, at which point it will
-- correctly see on_call = false for the other doctor and refuse to
-- go off call itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A hospital scheduling system runs its "go off call" transaction under REPEATABLE READ and has never seen a production incident, despite the theoretical write-skew risk. A new engineer proposes switching to SERIALIZABLE "just to be safe" and is surprised when a load test suddenly starts showing transaction failures that never happened before. What\'s actually happening, and is the new failure behavior a regression?',
    hint: 'Think about what SERIALIZABLE is DESIGNED to do when it detects exactly this kind of conflicting read/write pattern between two concurrent transactions.',
    solution: `The new failures are not a regression — they are SERIALIZABLE correctly
doing its job. Under REPEATABLE READ, the two "go off call" transactions
never actually reported an error to the application because neither
transaction's write touched a row the other one's read locked directly;
the invariant violation happened silently, with both commits succeeding.

Under SERIALIZABLE, the engine actively DETECTS this exact
read/write dependency pattern between the two concurrent transactions
and aborts one of them with a serialization failure, specifically to
PREVENT the write-skew anomaly from occurring. The "failures" the load
test now surfaces are cases that were previously silently corrupting
data under REPEATABLE READ — SERIALIZABLE is surfacing them as
explicit, retryable errors instead. The application needs a retry loop
around this transaction for SERIALIZABLE to be a net improvement, not
a regression.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a REPEATABLE READ transaction never triggers a lock wait or a visible error in production, it must be free of concurrency anomalies.',
      reality: 'write skew produces no lock conflict and no error under REPEATABLE READ — both transactions individually pass their own check and both commit successfully, while the combined invariant they were both protecting silently breaks.',
    },
    {
      thought: 'write skew is prevented by REPEATABLE READ, the same way it prevents non-repeatable reads.',
      reality: 'REPEATABLE READ only guarantees that a ROW you\'ve already read won\'t change value if you read it again — it does nothing to prevent two transactions from independently reading a SET of rows, making decisions based on that set, and writing to DIFFERENT rows in a way that violates a combined invariant. Only SERIALIZABLE prevents this.',
    },
    {
      thought: 'switching an application to SERIALIZABLE isolation and then seeing new transaction failures under load indicates the switch introduced a new bug.',
      reality: 'serialization failures are SERIALIZABLE\'s intended mechanism for preventing anomalies like write skew that a lower isolation level would have allowed to occur silently — the application needs a retry loop for these transactions, not a rollback of the isolation-level change.',
    },
  ];
}
