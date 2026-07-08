import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-avg-integer-dialect-difference-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-avg-on-integers-differs-between-postgresql-and-mssql.html',
  styleUrl: './testing-that-avg-on-integers-differs-between-postgresql-and-mssql.scss',
})
export class TestingThatAvgOnIntegersDiffersBetweenPostgresqlAndMssqlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "Both Dialects" Framing That Only Half Applies',
      points: [
        'The main page\'s Q&A states plainly: "AVG(integer_col) computes an integer average in some cases — e.g., AVG of 1,2,3 is 2, not 2.0" — presented as a general SQL trap alongside dual-dialect code examples elsewhere on the page that consistently show MSSQL and PostgreSQL side by side, implying the trap applies to both.',
        'It only applies to MSSQL. PostgreSQL\'s AVG() function, per the ANSI SQL standard, is REQUIRED to return a result with greater precision than the input when averaging an exact numeric type — AVG(integer_col) in PostgreSQL always returns a NUMERIC value (e.g., 2.0000000000000000), never a truncated integer. This subtopic runs the exact 1,2,3 example from the Q&A against both engines to show the claim is dialect-specific, not universal.',
      ],
    },
    {
      heading: 'Why the Standard Requires This for AVG',
      points: [
        'The SQL standard specifies that AVG() applied to an exact numeric type (like INTEGER) must return a result of a type capable of representing fractional values — this is precisely because an average is fundamentally a division, and truncating it silently would make the aggregate function nearly useless for real reporting. PostgreSQL implements this standard requirement; SQL Server historically does not for the plain AVG(int) case, which is why the workaround (AVG(col * 1.0)) is needed there specifically.',
        'This means the main page\'s AVG(quantity * 1.0) workaround code, while harmless to apply in PostgreSQL too, is only actually FIXING anything in MSSQL — in PostgreSQL, AVG(quantity) and AVG(quantity * 1.0) already return the same correct decimal result.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s own example, in both dialects',
      language: 'sql',
      code: `-- MSSQL: an INT column
CREATE TABLE t (n INT);
INSERT INTO t VALUES (1), (2), (3);

SELECT AVG(n) AS avg_result FROM t;
-- avg_result = 2   -- confirms the main page's claim: truncated to
--                      an integer, losing the true average of 2.0

SELECT AVG(n * 1.0) AS avg_result_fixed FROM t;
-- avg_result_fixed = 2.000000  -- the documented fix actually matters here`,
    },
    {
      label: 'The same test in PostgreSQL — the claim does not hold',
      language: 'sql',
      code: `CREATE TABLE t (n INTEGER);
INSERT INTO t VALUES (1), (2), (3);

SELECT AVG(n) AS avg_result FROM t;
-- avg_result = 2.0000000000000000  -- already a full-precision NUMERIC,
--                                       NOT truncated to an integer

SELECT AVG(n * 1.0) AS avg_result_with_workaround FROM t;
-- avg_result_with_workaround = 2.00000000000000000000  -- same value,
--                                                            just wider precision
--
-- The main page's "AVG of 1,2,3 is 2, not 2.0" claim, and the
-- AVG(col * 1.0) workaround it recommends, describe a real MSSQL
-- behavior -- but PostgreSQL's AVG(integer_col) was never broken in
-- the first place. Applying the workaround here is harmless, but
-- unnecessary.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team maintaining a single SQL codebase that runs against both MSSQL and PostgreSQL adds AVG(col * 1.0) everywhere as a defensive habit "since the docs said AVG on integers is a trap in both dialects." Based on the tests above, is this habit protecting against a real risk in the PostgreSQL half of their codebase?',
    hint: 'Compare the two AVG results shown for PostgreSQL above — do they actually differ from each other?',
    solution: `No — in the PostgreSQL half of the codebase, AVG(col * 1.0) is not
protecting against anything, because AVG(col) alone already returns a
full-precision NUMERIC result for an integer column, per the SQL
standard's requirement for the AVG aggregate. The two PostgreSQL
queries above (AVG(n) and AVG(n * 1.0)) return equivalent decimal
values — there is no truncation bug in PostgreSQL to guard against.

The habit IS protecting against a real risk in the MSSQL half of the
same codebase, where AVG(int_col) genuinely does return a truncated
integer result. So the defensive pattern isn't wrong to apply
everywhere — it's just asymmetric in WHY it matters: essential in
MSSQL, harmless-but-unnecessary in PostgreSQL. A team maintaining
both dialects from one codebase can reasonably keep the workaround
universal for consistency, but should understand it's not fixing a
real bug on the PostgreSQL side.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AVG(integer_column) truncates to an integer result "in some cases" as a general SQL behavior that applies across dialects, the way the main page\'s Q&A phrasing suggests.',
      reality: 'this is specifically an MSSQL behavior — PostgreSQL\'s AVG() on an integer column always returns a full-precision NUMERIC value, never a truncated integer, per the SQL standard\'s requirement for the AVG aggregate function.',
    },
    {
      thought: 'the AVG(col * 1.0) workaround shown on the main page is necessary in PostgreSQL to get a correct decimal average, the same way it is in MSSQL.',
      reality: 'in PostgreSQL, AVG(col) and AVG(col * 1.0) on an integer column return equivalent results — the workaround is a no-op there, only genuinely fixing anything on the MSSQL side.',
    },
    {
      thought: 'if a SQL trap is demonstrated with generic, dialect-unlabeled code on a page that otherwise shows both MSSQL and PostgreSQL side by side, it\'s safe to assume the trap applies to both.',
      reality: 'not always — some traps (like this one) and some fixes are dialect-specific, and a Q&A written in general terms without an explicit per-dialect test can accidentally generalize a single-dialect behavior.',
    },
  ];
}
