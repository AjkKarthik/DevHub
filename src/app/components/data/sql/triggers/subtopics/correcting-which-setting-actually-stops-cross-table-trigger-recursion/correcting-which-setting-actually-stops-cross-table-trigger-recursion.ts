import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-correcting-cross-table-recursion-setting-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-which-setting-actually-stops-cross-table-trigger-recursion.html',
  styleUrl: './correcting-which-setting-actually-stops-cross-table-trigger-recursion.scss',
})
export class CorrectingWhichSettingActuallyStopsCrossTableTriggerRecursionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory Section Prescribes the Wrong Fix for Its Own Example',
      points: [
        'The main page\'s theory states: "Recursive triggers: trigger A fires trigger B which fires A — set RECURSIVE_TRIGGERS OFF (MSSQL)..." — describing a scenario across TWO different tables (A on one table, B on another, B\'s DML fires A again). But RECURSIVE_TRIGGERS is a MSSQL DATABASE option that specifically controls DIRECT recursion — a trigger\'s own DML causing that SAME trigger to fire again on the SAME table. It has no effect on the cross-table (indirect) scenario the theory bullet actually describes.',
        'The page\'s own Q&A, a few sections later, gets this exactly right: "nesting is controlled by the nested triggers server option (default ON, up to 32 levels). Recursive triggers (trigger A on table T fires DML on T again) require the RECURSIVE_TRIGGERS database option." The Q&A correctly separates the two mechanisms; the theory bullet conflates them and recommends the wrong one for its own "A fires B fires A" example.',
      ],
    },
    {
      heading: 'The Two Mechanisms, Precisely',
      points: [
        'DIRECT recursion: an AFTER trigger on table T performs a DML statement that writes to T itself (the same table), which would normally cause the SAME trigger to fire again on itself. This specific case — and only this case — is controlled by the DATABASE-level RECURSIVE_TRIGGERS option (default OFF in MSSQL, meaning direct recursion is blocked out of the box).',
        'INDIRECT (nested) recursion: a trigger on table A performs DML on table B, whose trigger performs DML back on table A again — a chain across different tables/triggers. This is controlled by the entirely separate, SERVER-level "nested triggers" configuration option (sp_configure \'nested triggers\'), which defaults to ON (enabled, up to 32 levels) and is NOT affected by RECURSIVE_TRIGGERS at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setting up the exact "A fires B fires A" scenario',
      language: 'sql',
      code: `CREATE TABLE table_a (id INT PRIMARY KEY, val INT);
CREATE TABLE table_b (id INT PRIMARY KEY, val INT);
INSERT INTO table_a VALUES (1, 0);
INSERT INTO table_b VALUES (1, 0);
GO

CREATE TRIGGER trg_a ON table_a AFTER UPDATE AS
BEGIN
    UPDATE table_b SET val = val + 1 WHERE id = 1;   -- A triggers B
END;
GO
CREATE TRIGGER trg_b ON table_b AFTER UPDATE AS
BEGIN
    UPDATE table_a SET val = val + 1 WHERE id = 1;   -- B triggers A (again)
END;
GO`,
    },
    {
      label: 'Confirming RECURSIVE_TRIGGERS OFF does NOT stop this',
      language: 'sql',
      code: `ALTER DATABASE CURRENT SET RECURSIVE_TRIGGERS OFF;

UPDATE table_a SET val = val + 1 WHERE id = 1;
-- Msg 217, Level 16, State 1
-- Maximum stored procedure, function, trigger, or view nesting
-- level exceeded (limit 32).
--
-- The chain A -> B -> A -> B -> ... still recurses all the way to
-- the 32-level nesting limit and errors out -- RECURSIVE_TRIGGERS
-- OFF had NO effect on this cross-table scenario, exactly as the
-- theory bullet's prescribed fix would fail to prevent it.`,
    },
    {
      label: 'The setting that actually stops it',
      language: 'sql',
      code: `EXEC sp_configure 'nested triggers', 0;
RECONFIGURE;

UPDATE table_a SET val = val + 1 WHERE id = 1;
-- Succeeds immediately -- trg_a fires and updates table_b, but with
-- 'nested triggers' OFF, table_b's own trg_b is NOT allowed to fire
-- as a result -- the chain stops after one hop instead of recursing.

SELECT val FROM table_a WHERE id = 1;  -- incremented by the original UPDATE
SELECT val FROM table_b WHERE id = 1;  -- incremented once by trg_a,
                                        -- NOT incremented again by trg_b
                                        -- (since trg_b never fired)
--
-- 'nested triggers' -- a SERVER-level sp_configure option, entirely
-- separate from RECURSIVE_TRIGGERS -- is what actually controls this
-- cross-table recursion scenario.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DBA sees the main page\'s theory bullet ("trigger A fires trigger B which fires A — set RECURSIVE_TRIGGERS OFF") and runs ALTER DATABASE CURRENT SET RECURSIVE_TRIGGERS OFF; expecting it to prevent exactly this scenario in production. Based on the test above, will this actually work, and what should they run instead?',
    hint: 'RECURSIVE_TRIGGERS and "nested triggers" are two separate settings at two different scopes (database vs. server) — check which one governs a chain across TWO different tables.',
    solution: `RECURSIVE_TRIGGERS OFF will NOT prevent this scenario — as demonstrated
above, the "trigger A fires trigger B which fires A" chain is INDIRECT
(cross-table) recursion, which RECURSIVE_TRIGGERS does not govern at
all. The DBA's database-level change will have zero effect, and the
chain will still recurse until it hits the 32-level nesting limit and
raises error 217, exactly as if RECURSIVE_TRIGGERS had never been
touched.

The setting that actually controls this is the SERVER-level
configuration option 'nested triggers': EXEC sp_configure 'nested
triggers', 0; RECONFIGURE;. This is a genuinely different lever, at a
different scope (affecting the entire SQL Server instance, not just
one database), and it's what the main page's own Q&A correctly names
a few sections later — the theory bullet's prescribed fix simply
doesn't match the cross-table example it's attached to.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RECURSIVE_TRIGGERS OFF stops any trigger recursion scenario, including a chain across multiple tables like "trigger A fires trigger B which fires A."',
      reality: 'RECURSIVE_TRIGGERS only controls DIRECT recursion — a trigger\'s own DML causing that SAME trigger to fire again on the SAME table. Cross-table (indirect) recursion is controlled by the separate, server-level "nested triggers" option instead.',
    },
    {
      thought: 'RECURSIVE_TRIGGERS and "nested triggers" are two names for the same underlying MSSQL setting, just referenced inconsistently across documentation.',
      reality: 'they are genuinely different settings at different scopes — RECURSIVE_TRIGGERS is a per-database option (ALTER DATABASE), while "nested triggers" is a per-server option (sp_configure) — and they control two distinct recursion mechanisms.',
    },
    {
      thought: 'if a page\'s theory section and its Q&A section both discuss the same topic, they can be assumed to agree with each other.',
      reality: 'in this specific case they don\'t — the theory bullet conflates direct and indirect recursion under a single (wrong, for its own example) fix, while the Q&A elsewhere on the same page correctly distinguishes the two mechanisms.',
    },
  ];
}
