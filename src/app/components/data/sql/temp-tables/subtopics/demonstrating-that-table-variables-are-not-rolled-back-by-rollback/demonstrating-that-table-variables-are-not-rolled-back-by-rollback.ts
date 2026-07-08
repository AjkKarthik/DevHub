import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-table-variable-rollback-immunity-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-table-variables-are-not-rolled-back-by-rollback.html',
  styleUrl: './demonstrating-that-table-variables-are-not-rolled-back-by-rollback.scss',
})
export class DemonstratingThatTableVariablesAreNotRolledBackByRollbackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Fact the Main Page Never Mentions At All',
      points: [
        'The main page describes @table_var\'s scope, indexing limitations, and logging characteristics in detail — but never mentions one of the most consequential and useful differences between @table variables and #temp tables: a ROLLBACK TRANSACTION does NOT undo changes to a @table variable. A #temp table\'s data IS rolled back along with everything else in the transaction; a @table variable\'s data survives untouched.',
        'This isn\'t a minor footnote — it\'s the standard, documented reason experienced T-SQL developers reach for a @table variable specifically to log errors or diagnostic data INSIDE a stored procedure that might itself ROLLBACK: the error log data needs to survive the very rollback it\'s reporting on.',
      ],
    },
    {
      heading: 'Why This Happens',
      points: [
        'A @table variable is not, strictly speaking, a database object living inside a user transaction the way a #temp table (or a permanent table) is — Microsoft\'s documentation notes that operations on table variables are not affected by an explicit or implicit rollback in the way that other tables/objects are, because a table variable has limited transactional context of its own compared to persisted tables.',
        'This subtopic proves it directly: insert into both a #temp table and a @table variable inside the same explicit transaction, ROLLBACK, and compare what each one contains afterward.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The side-by-side test',
      language: 'sql',
      code: `CREATE TABLE #temp_log (msg VARCHAR(100));
DECLARE @var_log TABLE (msg VARCHAR(100));

BEGIN TRANSACTION;

INSERT INTO #temp_log VALUES ('logged inside the transaction');
INSERT INTO @var_log  VALUES ('logged inside the transaction');

-- Both tables have one row right now, inside the still-open transaction:
SELECT 'temp table' AS source, COUNT(*) AS row_count FROM #temp_log
UNION ALL
SELECT 'table variable', COUNT(*) FROM @var_log;
--     source      | row_count
-- -----------------+-----------
--  temp table      |     1
--  table variable  |     1

ROLLBACK TRANSACTION;`,
    },
    {
      label: 'Checking both AFTER the rollback',
      language: 'sql',
      code: `SELECT 'temp table' AS source, COUNT(*) AS row_count FROM #temp_log
UNION ALL
SELECT 'table variable', COUNT(*) FROM @var_log;

--     source      | row_count
-- -----------------+-----------
--  temp table      |     0      -- rolled back, exactly like a
--                                  permanent table would be
--  table variable  |     1      -- SURVIVED the rollback -- the row
--                                  inserted inside the now-rolled-
--                                  back transaction is still there.

SELECT * FROM @var_log;
-- msg
-- --------------------------------
-- logged inside the transaction`,
    },
    {
      label: 'The standard use case: error logging that survives its own rollback',
      language: 'sql',
      code: `CREATE PROCEDURE dbo.usp_RiskyOperation AS
BEGIN
    DECLARE @ErrorLog TABLE (occurred_at DATETIME, message VARCHAR(4000));

    BEGIN TRY
        BEGIN TRANSACTION;
            -- ... risky work that might fail ...
            RAISERROR('Simulated failure', 16, 1);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        INSERT INTO @ErrorLog VALUES (GETDATE(), ERROR_MESSAGE());
        -- Even though the transaction above just rolled back, this
        -- INSERT into @ErrorLog is safe and will NOT be undone --
        -- allowing the procedure to persist diagnostic info about
        -- exactly the failure that triggered the rollback.
    END CATCH

    -- @ErrorLog can now be written to a permanent logging table
    -- OUTSIDE any transaction, or returned to the caller, with the
    -- error details intact.
    SELECT * FROM @ErrorLog;
END;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer needs to capture diagnostic information about a database error INSIDE a CATCH block, immediately after rolling back the failed transaction, so the diagnostic data can be written to a permanent audit table afterward. They\'re deciding between a #temp table and a @table variable for this buffer. Based on the demonstration above, which one is actually usable for this purpose, and why would the other one fail?',
    hint: 'The CATCH block\'s ROLLBACK TRANSACTION runs BEFORE the diagnostic INSERT — trace what happens to each kind of table\'s data at that ROLLBACK.',
    solution: `A @table variable is the correct choice here, and a #temp table
would actually work too for THIS specific pattern as long as the
INSERT into it happens AFTER the ROLLBACK completes -- but the
classic failure mode is when a developer inserts diagnostic data
BEFORE calling ROLLBACK (e.g., logging "about to fail" state), where
a #temp table's data would be wiped out by the very ROLLBACK meant to
recover from the error, while a @table variable's data survives
regardless of when the INSERT happened relative to the ROLLBACK.

This is precisely why @table variables are the standard, documented
choice for error-logging buffers in T-SQL error handling: they are
immune to ROLLBACK's effects entirely, so a developer doesn't have to
carefully reason about statement ordering relative to the ROLLBACK
call to guarantee the diagnostic data survives. A #temp table
requires that careful ordering discipline; a @table variable doesn't.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '@table variables and #temp tables behave identically with respect to transactions — both have their changes undone by a ROLLBACK, the same as any other table.',
      reality: 'a #temp table\'s changes ARE rolled back by ROLLBACK TRANSACTION, exactly like a permanent table\'s would be — but a @table variable\'s changes are NOT rolled back, surviving the ROLLBACK entirely.',
    },
    {
      thought: 'the "table variables are minimally logged" characteristic mentioned in some documentation is the same thing as "table variables are immune to rollback."',
      reality: 'these are two separate properties — logging volume is about how much transaction log activity an operation generates, while rollback immunity is about whether an explicit ROLLBACK undoes the table variable\'s changes at all. A table variable\'s rollback immunity is the more practically significant and more commonly relied-upon property.',
    },
    {
      thought: 'if a stored procedure needs to preserve diagnostic data about an error that triggered a ROLLBACK, the diagnostic INSERT must happen before the ROLLBACK to avoid losing it.',
      reality: 'when using a @table variable specifically for this buffer, the ordering doesn\'t matter — the ROLLBACK has no effect on the @table variable\'s contents regardless of whether the diagnostic INSERT happened before or after it.',
    },
  ];
}
