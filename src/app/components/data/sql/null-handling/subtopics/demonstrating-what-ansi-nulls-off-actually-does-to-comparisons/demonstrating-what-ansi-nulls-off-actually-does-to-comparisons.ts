import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-demonstrating-ansi-nulls-off-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-what-ansi-nulls-off-actually-does-to-comparisons.html',
  styleUrl: './demonstrating-what-ansi-nulls-off-actually-does-to-comparisons.scss',
})
export class DemonstratingWhatAnsiNullsOffActuallyDoesToComparisonsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Setting That Flips Every Other Page\'s Assumptions — Described, Never Shown',
      points: [
        'The main page\'s own Q&A states, in prose only: "ANSI_NULLS OFF makes NULL = NULL → TRUE and NULL <> NULL → FALSE." No code anywhere on the page demonstrates the concrete, side-by-side difference this setting makes to actual query results — and every OTHER page in this SQL hub silently assumes ANSI_NULLS ON (the standard, default behavior) when explaining that = NULL always returns zero rows.',
        'The danger is not the setting\'s existence — it is that the SAME literal query text, WHERE column = NULL, produces genuinely opposite result sets depending purely on invisible session state that is never visible in the query itself.',
      ],
    },
    {
      heading: 'Stored Procedures and Views Capture ANSI_NULLS at Creation Time',
      points: [
        'An additional, easy-to-miss wrinkle: CREATE PROCEDURE, CREATE VIEW, and CREATE TRIGGER capture the ANSI_NULLS setting that was in effect at the moment the object was CREATED, storing it alongside the object definition — and use THAT captured setting whenever the object executes, regardless of whatever ANSI_NULLS setting is active in the CALLING session at execution time. A stored procedure created years ago under a legacy ANSI_NULLS OFF session can silently keep that behavior indefinitely, even when every new connection to the database correctly uses ANSI_NULLS ON.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The identical query, two different session settings',
      language: 'sql',
      code: `CREATE TABLE Orders (OrderID INT, ShippedDate DATE NULL);
INSERT INTO Orders VALUES (1, NULL), (2, '2024-01-15');

-- The default, standard-compliant setting:
SET ANSI_NULLS ON;
SELECT * FROM Orders WHERE ShippedDate = NULL;
-- Returns ZERO rows -- NULL = NULL evaluates to UNKNOWN, exactly as
-- every other page in this SQL hub assumes.

-- The deprecated, legacy setting -- same query text, unchanged:
SET ANSI_NULLS OFF;
SELECT * FROM Orders WHERE ShippedDate = NULL;
-- Returns ONE row: OrderID 1 -- under ANSI_NULLS OFF, NULL = NULL
-- evaluates to TRUE, so this predicate now behaves like IS NULL.
-- The query text never changed -- only the invisible session setting did.`,
    },
    {
      label: 'A stored procedure captures ANSI_NULLS at creation time, not call time',
      language: 'sql',
      code: `-- A procedure created under the legacy setting:
SET ANSI_NULLS OFF;
GO
CREATE PROCEDURE usp_GetUnshippedOrders_Legacy AS
    SELECT * FROM Orders WHERE ShippedDate = NULL;
GO

-- Now switch the SESSION back to the modern, correct setting:
SET ANSI_NULLS ON;
GO

-- Call the procedure from THIS session (ANSI_NULLS ON):
EXEC usp_GetUnshippedOrders_Legacy;
-- STILL returns OrderID 1 -- the procedure runs using the ANSI_NULLS
-- setting captured when it was CREATED (OFF), not the calling
-- session's CURRENT setting (ON). Confirm the captured setting:
SELECT uses_ansi_nulls FROM sys.sql_modules
WHERE object_id = OBJECT_ID('usp_GetUnshippedOrders_Legacy');
-- Returns 0 (OFF) -- permanently, regardless of future callers'
-- own session settings, until the procedure is dropped and recreated.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A new engineer joins a team, connects to the database with a modern client (ANSI_NULLS ON by default), and writes a brand-new stored procedure using <code>WHERE column = NULL</code> — expecting it to correctly return zero rows, matching every SQL reference they\'ve ever read, including this one. In production, the procedure unexpectedly returns rows where the column IS NULL. What\'s the most likely explanation, given the mechanics above, and how would they confirm it?',
    hint: 'The engineer\'s OWN session setting is not necessarily the setting that matters once the code becomes a stored procedure — check what gets captured at CREATE time versus what applies at CALL time.',
    solution: `The most likely explanation is that the stored procedure was actually
CREATEd (or later ALTERed) under a session where ANSI_NULLS was OFF --
perhaps an old deployment script, a legacy migration tool, or an
inherited connection profile with the deprecated setting still active
-- and that OFF setting got captured and stored alongside the
procedure definition at creation time. Even though the engineer's OWN
current session correctly uses ANSI_NULLS ON, the procedure itself
runs using whatever setting was captured when it was created, not the
calling session's setting.

To confirm this, query sys.sql_modules for the procedure's
uses_ansi_nulls column, exactly as shown in the second code tab -- a
value of 0 confirms the procedure was created under ANSI_NULLS OFF and
is silently using NULL = NULL → TRUE semantics regardless of any
future caller's session settings. The fix is to DROP and CREATE (not
ALTER, which does not update the captured setting either) the
procedure under a session with ANSI_NULLS explicitly ON.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a developer\'s own current session correctly has ANSI_NULLS ON, any stored procedure or view they call will also use ANSI_NULLS ON, since it\'s a connection-wide setting.',
      reality: 'stored procedures, views, and triggers capture the ANSI_NULLS setting that was in effect at their CREATION time and use that captured value whenever they execute — completely independent of the calling session\'s own current setting.',
    },
    {
      thought: 'ANSI_NULLS OFF is a rare, obscure setting unlikely to actually be active in any real production database, making this mostly a theoretical concern.',
      reality: 'the setting can persist invisibly for years inside stored procedures created under old tools, legacy migration scripts, or inherited connection defaults — it does not need to be intentionally or currently configured to still be silently affecting specific database objects.',
    },
    {
      thought: 'the main page\'s own Q&A statement that ANSI_NULLS OFF "makes NULL = NULL → TRUE" is easy enough to understand from the description alone, without needing to see it actually demonstrated against real data.',
      reality: 'seeing the identical query text produce opposite result sets under the two settings — as shown in the first code tab — makes the practical danger of an invisible session-level flag far more concrete than the prose description alone conveys.',
    },
  ];
}
