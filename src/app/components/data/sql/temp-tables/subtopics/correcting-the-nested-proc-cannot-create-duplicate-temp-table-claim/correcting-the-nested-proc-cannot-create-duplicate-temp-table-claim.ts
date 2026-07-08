import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-correcting-nested-proc-temp-table-claim-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-nested-proc-cannot-create-duplicate-temp-table-claim.html',
  styleUrl: './correcting-the-nested-proc-cannot-create-duplicate-temp-table-claim.scss',
})
export class CorrectingTheNestedProcCannotCreateDuplicateTempTableClaimSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Confident Claim, Backwards',
      points: [
        'The main page\'s Q&A states: "a #temp table created in a parent scope... is visible to all child stored procedures called within the same session. The child proc can INSERT/SELECT/UPDATE the temp table by name. However, the child proc cannot CREATE the same #temp table (it already exists)." The first two sentences are correct. The last sentence is not — a child procedure absolutely CAN issue CREATE TABLE #temp with the exact same name as one already visible from an outer scope, and it does not raise an "already exists" error.',
        'What actually happens is SQL Server\'s scoping rule for local temp tables: each #temp table\'s TRUE name in tempdb is internally suffixed to be globally unique (something like #order_summary______________________0000000001AB). When a nested procedure creates a #temp table with a name that collides with an outer scope\'s #temp table, SQL Server creates a genuinely NEW, separate temp table and makes it the one resolved by that name for the REST of the nested scope — shadowing the outer one, not colliding with it.',
      ],
    },
    {
      heading: 'Why This Matters in Practice',
      points: [
        'A developer relying on the main page\'s claim might assume it\'s always safe for a nested procedure to blindly use a #temp table name from an outer scope without checking for naming collisions — reasoning "if there\'s a conflict, SQL Server will just error out and I\'ll notice." In reality, no error occurs; the nested procedure silently starts working with its OWN, separate, empty temp table, while the outer scope\'s #temp table (and any data already in it) becomes completely inaccessible for the remainder of the nested procedure\'s execution.',
        'This is a genuine, silent-failure-shaped footgun: any code that assumed it was reading/writing the OUTER #temp table\'s data, but happens to run inside a nested scope that redeclared the same name, is quietly working with a different, empty table instead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup — outer scope creates and populates #order_summary',
      language: 'sql',
      code: `CREATE TABLE orders (order_id INT, customer_id INT, amount DECIMAL(10,2));
INSERT INTO orders VALUES (1, 100, 50.00), (2, 100, 75.00);
GO

CREATE PROCEDURE dbo.usp_Inner AS
BEGIN
    -- Attempting to create a #temp table with the SAME name as one
    -- already created by the caller:
    CREATE TABLE #order_summary (customer_id INT, total DECIMAL(10,2));
    -- The main page's Q&A claims this line should be impossible /
    -- should error because "#order_summary already exists."

    INSERT INTO #order_summary VALUES (999, 0.00);  -- clearly different data

    SELECT * FROM #order_summary;  -- what does THIS return?
END;
GO`,
    },
    {
      label: 'Running it — no error, but the outer data is gone',
      language: 'sql',
      code: `CREATE TABLE #order_summary (customer_id INT, total DECIMAL(10,2));
INSERT INTO #order_summary SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id;

SELECT * FROM #order_summary;
-- customer_id | total
-- ------------+-------
--     100     | 125.00

EXEC dbo.usp_Inner;
-- NO ERROR raised by the CREATE TABLE #order_summary inside usp_Inner.
-- Its own SELECT * FROM #order_summary returns:
-- customer_id | total
-- ------------+-------
--     999     | 0.00
-- -- its own, freshly created, separate table.

-- Back in the outer scope, after usp_Inner returns:
SELECT * FROM #order_summary;
-- customer_id | total
-- ------------+-------
--     100     | 125.00
-- -- the ORIGINAL data is untouched -- because usp_Inner's CREATE
-- statement made a genuinely SEPARATE table that only existed
-- (and shadowed the outer one) for the duration of usp_Inner's own
-- execution. It was silently dropped when usp_Inner returned.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a nested stored procedure that assumes "if I accidentally reuse a #temp table name from the caller, SQL Server will throw an error and I\'ll catch the bug immediately during testing." Based on the demonstration above, is this a safe assumption to test against, and what actually happens instead?',
    hint: 'Trace what SELECT * FROM #order_summary returns INSIDE usp_Inner versus in the OUTER scope after usp_Inner runs — are they reading the same table?',
    solution: `This is not a safe assumption. As shown above, SQL Server raises no
error at all when a nested procedure creates a #temp table with a
name that collides with one from an outer scope -- it silently
creates a genuinely separate table that shadows the outer one for
the remainder of the nested procedure's execution, then gets dropped
automatically when that nested scope ends.

The practical danger: a developer testing this nested procedure in
isolation would see it behave "correctly" (its own CREATE, INSERT,
and SELECT on #order_summary all work fine) -- the bug only becomes
visible when examining the OUTER scope's data after the nested call
returns, and discovering it was never touched by the nested
procedure at all, because the nested procedure was quietly working
with its own separate, empty copy the whole time. The main page's Q&A
claim that this scenario "cannot" happen (it frames it as an error
case) actively works against catching this bug, since a developer
trusting that claim wouldn't think to check for it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a nested stored procedure attempts to CREATE a #temp table with the same name as one visible from an outer scope, SQL Server raises an "object already exists" error.',
      reality: 'no error occurs — SQL Server creates a genuinely separate #temp table that shadows the outer scope\'s table by name for the remainder of the nested procedure\'s execution, then silently drops it when that scope ends.',
    },
    {
      thought: 'a #temp table\'s name is a reliable, unique identifier within a session — SELECT * FROM #order_summary always refers to the same underlying table regardless of which procedure scope the query runs in.',
      reality: 'SQL Server resolves a #temp table NAME to whichever #temp table was most recently created with that name in the CURRENT or an enclosing scope — nested CREATE statements with matching names silently redirect all subsequent references within that nested scope to the new table.',
    },
    {
      thought: 'a bug caused by this name-shadowing behavior would be caught immediately, since a nested procedure\'s own tests would reveal something is wrong with the #temp table\'s data.',
      reality: 'the nested procedure\'s own tests typically pass without issue, since it correctly creates, populates, and reads its own shadowed table — the bug only manifests as MISSING data in the OUTER scope, which is easy to overlook if the outer scope\'s state isn\'t independently re-checked after the nested call.',
    },
  ];
}
