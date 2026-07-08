import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-postgresql-savepoint-unconditional-rollback-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './the-postgresql-savepoint-example-rolls-back-a-successful-insert.html',
  styleUrl: './the-postgresql-savepoint-example-rolls-back-a-successful-insert.scss',
})
export class ThePostgresqlSavepointExampleRollsBackASuccessfulInsertSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The MSSQL Example Guards the Rollback — Its PostgreSQL Counterpart Doesn\'t',
      points: [
        'The main page\'s own MSSQL SAVEPOINT example correctly guards the rollback behind a condition: IF @@ERROR <> 0 BEGIN ROLLBACK TRANSACTION sp1; ... END — the rollback to the savepoint only happens if the order insert actually failed.',
        'The PostgreSQL example directly below it, in the SAME code tab, has no such guard: INSERT INTO orders (customer_id) VALUES (\'ALFKI\'); -- may fail is immediately followed, UNCONDITIONALLY, by ROLLBACK TO SAVEPOINT sp1;. As written, this rolls back the orders insert EVERY TIME the script runs — regardless of whether the insert actually succeeded or failed. The subsequent audit_log entry, "order insert failed — rolled back," is also written unconditionally, even on a run where the insert genuinely succeeded.',
      ],
    },
    {
      heading: 'Why Plain SQL Can\'t Express the Guard PostgreSQL Needs',
      points: [
        'Unlike MSSQL\'s T-SQL, which allows an ordinary IF @@ERROR check directly in a top-level batch script, PostgreSQL\'s savepoint recovery model requires a PL/pgSQL exception-handling block to conditionally branch on whether the PRECEDING statement failed. Plain, unstructured SQL statements run sequentially with no built-in way to ask "did the last statement fail?" — that conditional logic only exists inside a DO block or function body\'s BEGIN ... EXCEPTION WHEN OTHERS THEN ... END structure.',
        'The correct fix wraps the risky insert in exactly this structure: the ROLLBACK TO SAVEPOINT only executes inside the EXCEPTION handler, which PostgreSQL only enters if the preceding statement genuinely raised an error — leaving a successful insert completely untouched.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the bug — the main page\'s own PostgreSQL example, literally',
      language: 'sql',
      code: `-- Exactly as written in the main page's SAVEPOINT code tab:
BEGIN;
  INSERT INTO audit_log (event) VALUES ('batch started');

  SAVEPOINT sp1;

  INSERT INTO orders (customer_id) VALUES ('ALFKI');  -- succeeds this time!

  -- Unconditional -- runs regardless of whether the insert above
  -- actually succeeded or failed:
  ROLLBACK TO SAVEPOINT sp1;

  INSERT INTO audit_log (event) VALUES ('order insert failed — rolled back');

COMMIT;

-- Result: the orders insert is GONE, even though it succeeded --
-- ROLLBACK TO SAVEPOINT sp1 discarded it unconditionally. The audit
-- log falsely records "order insert failed" for a genuinely
-- successful insert.
SELECT * FROM orders WHERE customer_id = 'ALFKI';   -- 0 rows`,
    },
    {
      label: 'The fix — a real PL/pgSQL exception handler guards the rollback',
      language: 'sql',
      code: `DO $$
BEGIN
    INSERT INTO audit_log (event) VALUES ('batch started');

    -- No manual SAVEPOINT needed: PL/pgSQL implicitly creates one at
    -- the start of every BEGIN...EXCEPTION block.
    BEGIN
        INSERT INTO orders (customer_id) VALUES ('ALFKI');
        -- If this succeeds, execution falls through normally --
        -- no rollback, no "failed" log entry.
    EXCEPTION WHEN OTHERS THEN
        -- Only reached if the INSERT genuinely raised an exception:
        INSERT INTO audit_log (event) VALUES ('order insert failed — rolled back');
    END;
END $$;

-- Now a successful insert survives, and the "failed" audit log entry
-- is written ONLY when the insert genuinely raises an exception --
-- matching the MSSQL example's IF @@ERROR <> 0 guard correctly.
SELECT * FROM orders WHERE customer_id = 'ALFKI';   -- 1 row, as expected`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own PostgreSQL SAVEPOINT example directly into a batch import script, runs it against 10,000 customer orders, and later discovers the orders table is completely empty despite the audit log showing "batch started" 10,000 times and no unexpected errors reported. What happened, and how does the PL/pgSQL fix resolve it?',
    hint: 'Check what the script does immediately after every single INSERT INTO orders statement, regardless of whether that insert raised an error.',
    solution: `The script's ROLLBACK TO SAVEPOINT sp1 runs unconditionally after every
single orders insert, whether or not that insert actually failed. Since
the main page's own PostgreSQL example never gates the rollback behind
an actual error check (unlike its MSSQL counterpart's IF @@ERROR <> 0),
EVERY orders insert gets discarded, all 10,000 times, even though none
of them technically failed -- there is no error to report, because
nothing went wrong with the inserts themselves; the script just always
rolls them back regardless.

The PL/pgSQL fix resolves this by moving the risky INSERT INTO orders
statement inside a BEGIN...EXCEPTION WHEN OTHERS THEN...END block. The
implicit savepoint PL/pgSQL creates for this block is only rolled back
if the block's own EXCEPTION handler is actually entered — which only
happens when the INSERT genuinely raises an error. A successful insert
falls through normally, is never rolled back, and the "order insert
failed" audit log entry is only written on a genuine failure.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own PostgreSQL SAVEPOINT example, sitting right next to a correctly-guarded MSSQL version doing the same thing, must also be correctly guarded — the two examples are meant to be equivalent.',
      reality: 'the PostgreSQL example is missing the conditional guard the MSSQL version has — it unconditionally rolls back to the savepoint after every attempt, regardless of whether the preceding insert actually failed.',
    },
    {
      thought: 'a comment like "-- may fail" next to a risky statement, followed by a rollback, is sufficient documentation that the rollback is meant to be conditional.',
      reality: 'a comment describes intent but does not change what the SQL actually executes — as literally written, the rollback runs every time, regardless of what the comment implies should happen.',
    },
    {
      thought: 'plain top-level SQL statements (outside a function or DO block) in PostgreSQL can check whether the immediately preceding statement succeeded or failed, similar to MSSQL\'s @@ERROR.',
      reality: 'PostgreSQL has no equivalent to a plain, top-level @@ERROR check — conditional error handling requires a PL/pgSQL BEGIN...EXCEPTION WHEN OTHERS THEN...END block inside a DO block or function body.',
    },
  ];
}
