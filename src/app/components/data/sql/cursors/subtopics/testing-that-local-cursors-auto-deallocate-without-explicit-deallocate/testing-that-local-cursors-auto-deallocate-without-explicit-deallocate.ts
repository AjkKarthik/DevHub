import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-local-cursor-auto-deallocate-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-local-cursors-auto-deallocate-without-explicit-deallocate.html',
  styleUrl: './testing-that-local-cursors-auto-deallocate-without-explicit-deallocate.scss',
})
export class TestingThatLocalCursorsAutoDeallocateWithoutExplicitDeallocateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An Unconditional Warning That Has an Unstated Condition',
      points: [
        'The main page\'s Q&A states flatly: "Omitting DEALLOCATE causes a resource leak if the procedure is called in a loop." Every cursor example on the page is declared with plain DECLARE cursor_name CURSOR ... — never specifying LOCAL or GLOBAL — so the reader has no way to know which scope applies, or that it even matters for this claim.',
        'Whether omitting DEALLOCATE actually leaks depends entirely on that unstated scope. A LOCAL cursor (the database-level default on virtually every modern SQL Server database, controlled by the LOCAL_CURSOR_DEFAULT database option, TRUE by default since SQL Server 2000) is automatically deallocated when the batch, stored procedure, or trigger that declared it ends — with no leak, even without an explicit DEALLOCATE. A GLOBAL cursor persists for the entire session and genuinely does leak if never deallocated.',
      ],
    },
    {
      heading: 'Why This Matters in Practice',
      points: [
        'For the overwhelming majority of real-world stored procedures — which rely on the database default and never specify LOCAL or GLOBAL explicitly — omitting DEALLOCATE is harmless: the cursor is cleaned up automatically the moment the procedure returns, called once or called a million times in a loop.',
        'The genuine risk only appears on a database explicitly configured with LOCAL_CURSOR_DEFAULT = FALSE (a legacy or migrated-from-older-version setting), or when a cursor is deliberately declared GLOBAL. This subtopic tests both scenarios directly rather than treating "always DEALLOCATE explicitly" as a blanket, unconditional rule.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the database\'s actual LOCAL_CURSOR_DEFAULT setting',
      language: 'sql',
      code: `SELECT DATABASEPROPERTYEX(DB_NAME(), 'IsLocalCursorsDefault') AS local_cursor_default;
-- 1 = LOCAL is the default (SQL Server's out-of-the-box setting since SQL Server 2000)
-- 0 = GLOBAL is the default (a legacy/explicitly-configured setting)`,
    },
    {
      label: 'A LOCAL cursor: no leak, even without DEALLOCATE',
      language: 'sql',
      code: `CREATE OR ALTER PROCEDURE dbo.usp_ProcessOrders AS
BEGIN
    DECLARE @id INT;
    -- No LOCAL/GLOBAL keyword -- relies on the database default
    DECLARE cur CURSOR FOR SELECT order_id FROM orders WHERE status = 'Pending';
    OPEN cur;
    FETCH NEXT FROM cur INTO @id;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- ... work ...
        FETCH NEXT FROM cur INTO @id;
    END;
    CLOSE cur;
    -- Deliberately OMITTING DEALLOCATE, to test the claim
END;
GO

-- Call it repeatedly, simulating "called in a loop":
EXEC dbo.usp_ProcessOrders;
EXEC dbo.usp_ProcessOrders;
EXEC dbo.usp_ProcessOrders;
-- On a database with the default LOCAL_CURSOR_DEFAULT = TRUE, this
-- runs cleanly every time -- no "cursor already exists" error, no
-- growing resource usage. SQL Server auto-deallocates the LOCAL
-- cursor when the procedure returns, each and every call.`,
    },
    {
      label: 'A GLOBAL cursor: the leak the Q&A actually describes',
      language: 'sql',
      code: `CREATE OR ALTER PROCEDURE dbo.usp_ProcessOrdersGlobal AS
BEGIN
    DECLARE @id INT;
    DECLARE cur CURSOR GLOBAL FOR SELECT order_id FROM orders WHERE status = 'Pending';
    OPEN cur;
    FETCH NEXT FROM cur INTO @id;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        FETCH NEXT FROM cur INTO @id;
    END;
    CLOSE cur;
    -- Omitting DEALLOCATE here is genuinely risky:
END;
GO

EXEC dbo.usp_ProcessOrdersGlobal;   -- succeeds
EXEC dbo.usp_ProcessOrdersGlobal;
-- Msg 16915: A cursor with the name 'cur' already exists.
--
-- Because GLOBAL cursors persist for the entire SESSION (not just
-- the procedure call), the second execution tries to DECLARE a
-- cursor named "cur" that's still open from the first call -- this
-- is the real, reproducible failure the Q&A's warning is actually
-- describing, but only for GLOBAL cursors specifically.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer flags every stored procedure in a codebase that has a DECLARE CURSOR without an explicit DEALLOCATE, citing the main page\'s "resource leak" warning as policy. A developer pushes back, pointing out none of these procedures specify LOCAL or GLOBAL. Based on the tests above, whose position is better supported?',
    hint: 'The reviewer\'s policy treats the warning as unconditional — check whether the warning\'s truth actually depends on a database setting neither the reviewer nor the flagged code ever checked.',
    solution: `The developer's pushback is well-supported, PROVIDED the database in
question uses the default LOCAL_CURSOR_DEFAULT = TRUE setting (true
for the vast majority of SQL Server databases). For LOCAL cursors —
which is what a plain DECLARE CURSOR without GLOBAL resolves to under
that default — SQL Server automatically deallocates the cursor when
the procedure returns, with no leak regardless of how many times the
procedure is called.

The reviewer's policy isn't wrong in spirit, but it's incompletely
targeted: the actual, verifiable risk is specific to cursors declared
GLOBAL (explicitly, or implicitly via a database configured with
LOCAL_CURSOR_DEFAULT = FALSE) — not to every DECLARE CURSOR missing an
explicit DEALLOCATE. The more precise policy is to run SELECT
DATABASEPROPERTYEX(DB_NAME(), 'IsLocalCursorsDefault') first, and to
require DEALLOCATE specifically for any cursor declared GLOBAL or
running against a database where that property returns 0 — rather than
flagging every LOCAL cursor as an unconditional resource-leak risk.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'omitting DEALLOCATE always causes a resource leak in a stored procedure that\'s called repeatedly, regardless of how the cursor was declared.',
      reality: 'this depends entirely on whether the cursor is LOCAL or GLOBAL — a LOCAL cursor (the database default in virtually every modern SQL Server installation) is automatically deallocated when the procedure returns, even without an explicit DEALLOCATE.',
    },
    {
      thought: 'DECLARE CURSOR without specifying LOCAL or GLOBAL has a fixed, universal default behavior that\'s the same on every SQL Server database.',
      reality: 'the default is controlled by the database-level LOCAL_CURSOR_DEFAULT setting — while TRUE (LOCAL) is the out-of-the-box default since SQL Server 2000, it can be, and sometimes is, explicitly configured to FALSE (GLOBAL) on a specific database.',
    },
    {
      thought: 'a "cursor with the name already exists" error when calling a procedure a second time is unrelated to whether DEALLOCATE was called — it must be caused by something else.',
      reality: 'this exact error is the direct, reproducible symptom of a GLOBAL cursor left un-deallocated from a prior call, exactly as demonstrated above — it is precisely the failure mode the DEALLOCATE warning is describing, just conditional on cursor scope rather than universal.',
    },
  ];
}
