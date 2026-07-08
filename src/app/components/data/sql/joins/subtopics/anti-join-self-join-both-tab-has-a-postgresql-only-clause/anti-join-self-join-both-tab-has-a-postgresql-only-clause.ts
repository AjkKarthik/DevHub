import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-anti-join-self-join-both-tab-pg-only-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './anti-join-self-join-both-tab-has-a-postgresql-only-clause.html',
  styleUrl: './anti-join-self-join-both-tab-has-a-postgresql-only-clause.scss',
})
export class AntiJoinSelfJoinBothTabHasAPostgresqlOnlyClauseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The "(both)" Label Is Not Accurate for Every Line in the Tab',
      points: [
        'The main page\'s own "Anti-join & self-join (both)" code tab is explicitly labeled to run in both MSSQL and PostgreSQL. Its final query — the self-join example listing employees with their manager names — ends with ORDER BY m.full_name NULLS LAST, e.full_name. NULLS LAST is PostgreSQL-only syntax, confirmed by the main SQL Basics page\'s own dialect notes elsewhere on this site: MSSQL has no NULLS FIRST/LAST clause at all.',
        'Run exactly as written against MSSQL, this query raises a syntax error at NULLS — it does not run in "both" dialects as the tab\'s own label claims. This is a genuine, verifiable gap: the rest of the main page is otherwise careful to call out dialect-specific syntax explicitly (as in its own "Dialect Notes and Performance" theory section), but this one line inside a tab labeled universally compatible slipped through unflagged.',
      ],
    },
    {
      heading: 'The MSSQL-Compatible Equivalent Needs a CASE Expression',
      points: [
        'MSSQL has no dedicated NULLS LAST syntax, so the equivalent behavior must be simulated with a CASE expression sorted first: ORDER BY CASE WHEN m.full_name IS NULL THEN 1 ELSE 0 END, m.full_name. This sorts on a computed "is-null flag" column first (0 for non-null, 1 for null, pushing NULLs to the end), then breaks ties on the real column — more verbose than PostgreSQL\'s dedicated syntax, but functionally equivalent and valid in both dialects.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the error — the main page\'s own query, run against MSSQL',
      language: 'sql',
      code: `-- Exactly as written in the main page's "Anti-join & self-join (both)" tab:
SELECT
    e.employee_id,
    e.full_name  AS employee,
    m.full_name  AS manager,
    e.department
FROM   employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
ORDER BY m.full_name NULLS LAST, e.full_name;

-- Run against MSSQL:
-- Msg 156, Level 15, State 1
-- Incorrect syntax near 'NULLS'.
-- MSSQL has no NULLS FIRST / NULLS LAST clause -- this is PostgreSQL-only
-- syntax, despite the tab being labeled to work in "both" dialects.`,
    },
    {
      label: 'PostgreSQL — this line genuinely works as labeled',
      language: 'sql',
      code: `-- The identical query runs correctly in PostgreSQL, since NULLS LAST
-- is native syntax there:
SELECT
    e.employee_id,
    e.full_name  AS employee,
    m.full_name  AS manager,
    e.department
FROM   employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
ORDER BY m.full_name NULLS LAST, e.full_name;
-- Works fine in PostgreSQL -- the "(both)" label is only wrong for MSSQL.`,
    },
    {
      label: 'The genuinely portable fix — CASE-based NULLS LAST simulation',
      language: 'sql',
      code: `-- MSSQL: simulate NULLS LAST with a CASE expression sorted first
SELECT
    e.employee_id,
    e.full_name  AS employee,
    m.full_name  AS manager,
    e.department
FROM   employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
ORDER BY CASE WHEN m.full_name IS NULL THEN 1 ELSE 0 END, m.full_name, e.full_name;

-- PostgreSQL: native syntax remains the more concise, idiomatic choice
SELECT
    e.employee_id,
    e.full_name  AS employee,
    m.full_name  AS manager,
    e.department
FROM   employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
ORDER BY m.full_name NULLS LAST, e.full_name;
-- The CASE-expression version is the one to use if you actually need
-- ONE query that runs unmodified against both dialects.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A shared query library labels a self-join query "cross-platform — works on MSSQL and PostgreSQL" and copies the main page\'s own <code>ORDER BY m.full_name NULLS LAST, e.full_name</code> line verbatim. A teammate runs the exact same file against an MSSQL database in CI and the job fails. What\'s the actual root cause, and how would you fix the query so the "(both)" label becomes true?',
    hint: 'The failure is a syntax error, not a logic error — think about which specific clause in the ORDER BY is dialect-specific.',
    solution: `The root cause is that NULLS LAST is PostgreSQL-only syntax -- MSSQL
has no NULLS FIRST/LAST clause at all, so MSSQL's parser rejects the
query with "Incorrect syntax near 'NULLS'" before it ever runs. The
query was never actually cross-platform, despite being labeled and
copied as such -- it only ever worked against PostgreSQL.

The fix is to replace NULLS LAST with the CASE-expression equivalent
that works in both dialects: ORDER BY CASE WHEN m.full_name IS NULL
THEN 1 ELSE 0 END, m.full_name, e.full_name. This produces the same
sort order (NULLs pushed to the end) using syntax valid in both MSSQL
and PostgreSQL, making the "(both)" label on the shared query library
entry actually accurate.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a code tab explicitly labeled "(both)" on the main page has been verified to run correctly, unmodified, against both MSSQL and PostgreSQL.',
      reality: 'the self-join query in that exact tab uses ORDER BY ... NULLS LAST, which is PostgreSQL-only syntax and raises a syntax error against MSSQL -- the "(both)" label is not accurate for that specific line.',
    },
    {
      thought: 'NULLS FIRST / NULLS LAST is standard ANSI SQL syntax supported by every major relational database.',
      reality: 'MSSQL has no NULLS FIRST/LAST clause at all -- it is PostgreSQL (and some other engines\') extension syntax, not a universal ANSI feature. MSSQL requires a CASE-expression workaround to achieve the same sort behavior.',
    },
    {
      thought: 'if a query runs without error on your own development database, it is safe to label it as working across every dialect your application supports.',
      reality: 'a query can run perfectly on the dialect you happen to be testing against while silently containing dialect-specific syntax that fails elsewhere -- confirming cross-dialect compatibility requires actually running the query against each target dialect, not assuming from one successful run.',
    },
  ];
}
