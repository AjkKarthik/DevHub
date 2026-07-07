import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-sql-constraints-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-constraints-with-tsqlt-and-pgtap.html',
  styleUrl: './testing-constraints-with-tsqlt-and-pgtap.scss',
})
export class TestingConstraintsWithTsqltAndPgtapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Integrity Violations Are Ad-Hoc Snippets, Never a Repeatable Test Suite',
      points: [
        'The main page\'s own "Integrity violations" tab shows individual INSERT/DELETE statements with comments describing the EXPECTED error — useful for understanding, but none of it is wrapped in anything that could be run repeatedly, in CI, or rolled back automatically. Both major dialects have dedicated, widely-used SQL-native testing frameworks built exactly for this: tSQLt for SQL Server, and pgTAP for PostgreSQL. Both let a test assert that a specific statement THROWS the expected error, and both automatically roll back all changes at the end of every test — so a constraint test can freely attempt bad INSERTs/DELETEs without leaving the database in a modified state.',
        'This matters specifically for constraint testing because the main page\'s own examples are inherently DESTRUCTIVE demonstrations — they show what happens when you violate a rule. Running them ad hoc in a real environment either fails harmlessly (the point) or, for the ones that ARE expected to succeed (like a correctly-scoped CASCADE), actually changes data. A test framework with automatic rollback removes the operational risk of running these checks repeatedly.',
      ],
    },
    {
      heading: 'What a Real Constraint Test Asserts, Precisely',
      points: [
        'A well-written constraint test doesn\'t just check "did this statement fail" — it asserts on the SPECIFIC error condition (tSQLt.ExpectException with a particular message pattern, or pgTAP\'s throws_ok checking a SQLSTATE code) to distinguish "my FK constraint correctly rejected this" from "some unrelated error happened to occur" (a typo in a column name, a permission error, a totally different constraint firing first). This precision is exactly what the main page\'s own plain comments ("ERROR: The INSERT statement conflicted with the FOREIGN KEY constraint") describe informally but never verify programmatically.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'tSQLt — testing FK referential integrity (SQL Server)',
      language: 'sql',
      code: `-- tSQLt: automatically rolls back everything at the end of every test
EXEC tSQLt.NewTestClass 'IntegrityTests';
GO

CREATE PROCEDURE IntegrityTests.[test FK rejects order with nonexistent customer]
AS
BEGIN
    EXEC tSQLt.ExpectException
        @ExpectedMessagePattern = '%FOREIGN KEY constraint%';

    INSERT INTO Orders (CustomerID, Status) VALUES (999, 'Pending');
    -- If this DOESN'T throw, tSQLt fails the test — proving the
    -- constraint is actually enforced, not just documented in a comment.
END;
GO

EXEC tSQLt.Run 'IntegrityTests';
-- tSQLt automatically ROLLS BACK the entire test's transaction —
-- the attempted (and rejected) INSERT never persists, and no manual
-- cleanup is required between test runs.`,
    },
    {
      label: 'pgTAP — the same test, PostgreSQL',
      language: 'sql',
      code: `-- pgTAP: run inside a transaction, ROLLBACK at the end
BEGIN;
SELECT plan(1);

SELECT throws_ok(
    $$ INSERT INTO orders (customer_id, status) VALUES (999, 'Pending') $$,
    '23503',                                   -- SQLSTATE for foreign_key_violation
    NULL,
    'FK rejects an order referencing a nonexistent customer'
);

SELECT * FROM finish();
ROLLBACK;   -- nothing from this test session persists`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a tSQLt test using <code>EXEC tSQLt.ExpectException</code> with no <code>@ExpectedMessagePattern</code> argument at all — just asserting "SOME exception happens." The INSERT statement inside has a typo (misspelled column name CustomrID instead of CustomerID). Does the test pass or fail, and what does that reveal about the value of asserting on the SPECIFIC error?',
    hint: 'A misspelled column name is also a real SQL error — think about what kind of error THAT produces versus a foreign-key violation, and whether ExpectException without a pattern can tell them apart.',
    solution: `The test would PASS — misspelling CustomrID produces an "invalid column
name" error at parse/bind time, which IS an exception, and
tSQLt.ExpectException with no @ExpectedMessagePattern accepts ANY
exception as satisfying the assertion. The test is now GREEN, but for
entirely the WRONG REASON — it never actually executed far enough to
even ATTEMPT the insert that would trigger the foreign key constraint,
because the typo caused a parse error before the statement could run
at all.

This is exactly why asserting on the SPECIFIC error (a message pattern
containing "FOREIGN KEY constraint", or pgTAP's SQLSTATE '23503') is
essential rather than optional: a test that accepts "any exception" as
success can silently stop testing what it claims to test the moment an
unrelated bug (like a typo) is introduced elsewhere in the same test —
the test keeps passing, but it has stopped verifying the referential
integrity constraint at all. Fixing the typo would make the REAL FK
violation occur — and specifying the exact expected error pattern is
what would have caught the typo immediately, by failing with an
"exception occurred, but didn't match the expected pattern" result
instead of a false-positive pass.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'verifying that a foreign key constraint works correctly just means running the failing INSERT once manually and confirming an error appears, as the main page\'s own comments show.',
      reality: 'a repeatable, automated test — using tSQLt (MSSQL) or pgTAP (PostgreSQL) — proves the constraint continues to work as the schema evolves, and both frameworks automatically roll back all changes, so the test can be run safely and repeatedly without manual cleanup.',
    },
    {
      thought: 'asserting that "some exception occurred" (tSQLt.ExpectException with no message pattern, or a generic try/catch) is sufficient to test that a specific constraint is enforced.',
      reality: 'an unrelated bug — a typo in a column name, a permission error, a different constraint firing first — also produces an exception, which a generic assertion would accept as a false-positive pass. Asserting on the SPECIFIC error message or SQLSTATE code is what actually proves the INTENDED constraint fired.',
    },
    {
      thought: 'testing destructive operations like a FK violation or a cascade delete against a real database risks leaving the database in a modified, inconsistent state.',
      reality: 'both tSQLt and pgTAP automatically roll back everything a test does — including data that was successfully inserted, updated, or deleted before an assertion — so even genuinely destructive test scenarios (like verifying a real CASCADE) leave no permanent trace.',
    },
  ];
}
