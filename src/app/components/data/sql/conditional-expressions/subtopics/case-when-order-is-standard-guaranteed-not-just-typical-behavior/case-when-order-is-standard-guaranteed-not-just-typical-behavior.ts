import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-case-when-order-guaranteed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './case-when-order-is-standard-guaranteed-not-just-typical-behavior.html',
  styleUrl: './case-when-order-is-standard-guaranteed-not-just-typical-behavior.scss',
})
export class CaseWhenOrderIsStandardGuaranteedNotJustTypicalBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An Understated Guarantee',
      points: [
        'The main page\'s Q&A hedges: "SQL does not guarantee short-circuit evaluation of CASE branches, but most engines do it in practice... most engines will not evaluate the THEN on matching ELSE rows." This wording — "most engines," "in practice" — makes CASE\'s WHEN-branch ordering sound like an implementation detail you happen to be able to rely on, similar to how WHERE-clause AND/OR predicate order is famously NOT reliable (the optimizer is free to reorder, combine, or short-circuit predicates however it decides is fastest).',
        'That\'s actually understating it. Sequential, first-match WHEN evaluation is part of the ANSI SQL standard\'s DEFINITION of CASE — not an incidental behavior some engines happen to implement consistently. Both MSSQL and PostgreSQL guarantee it because the standard requires it, not because they happen to agree by convention.',
      ],
    },
    {
      heading: 'Why This Distinction Matters',
      points: [
        'Because CASE\'s WHEN order is standard-guaranteed, the classic divide-by-zero guard — CASE WHEN denominator <> 0 THEN numerator / denominator ELSE 0 END — is not a "usually works" pattern; it is as reliable as NULLIF(denominator, 0). This is different from trying to rely on the order of AND-ed conditions in a WHERE clause to prevent an error (e.g. WHERE denominator <> 0 AND numerator / denominator > 1), which genuinely is NOT safe, since the optimizer can evaluate the second predicate before the first.',
        'This subtopic demonstrates the CASE guard succeeding reliably, and separately demonstrates the WHERE-clause AND version actually failing with a divide-by-zero error — the exact contrast the main page\'s Q&A gestures at but never shows side by side.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CASE WHEN guard — reliably avoids the error',
      language: 'sql',
      code: `CREATE TABLE department_payroll (department TEXT, total_salary NUMERIC, headcount INT);
INSERT INTO department_payroll VALUES ('Eng', 500000, 5), ('Sales', 0, 0);
-- Sales has headcount = 0 -- a genuine divide-by-zero risk.

SELECT
    department,
    CASE WHEN headcount <> 0 THEN total_salary / headcount ELSE 0 END AS avg_salary
FROM department_payroll;

-- Runs successfully for BOTH rows, every time, on both MSSQL and
-- PostgreSQL -- the ELSE 0 branch fires for Sales, and the division
-- in the THEN branch for that row is simply never evaluated. This is
-- guaranteed by the SQL standard's definition of CASE, not a lucky
-- coincidence of how any particular engine happens to optimize.`,
    },
    {
      label: 'WHERE clause AND — NOT the same guarantee',
      language: 'sql',
      code: `-- Attempting the equivalent guard as a WHERE clause AND condition:
SELECT department, total_salary / headcount AS avg_salary
FROM department_payroll
WHERE headcount <> 0 AND total_salary / headcount > 50000;

-- On some engines/versions, this CAN raise a divide-by-zero error
-- for the Sales row (headcount = 0), because the query optimizer is
-- free to evaluate "total_salary / headcount > 50000" before, or
-- independently of, "headcount <> 0" -- SQL's standard does NOT
-- guarantee left-to-right, short-circuit evaluation of AND-ed WHERE
-- predicates the way it guarantees WHEN-branch order inside CASE.
--
-- The safe rewrite moves the guard INSIDE a CASE or NULLIF, exactly
-- as the main page's own NULLIF(denominator, 0) pattern does:
SELECT department,
       total_salary / NULLIF(headcount, 0) AS avg_salary
FROM department_payroll
WHERE total_salary / NULLIF(headcount, 0) > 50000;
-- Always safe -- NULLIF itself is what prevents the division error,
-- not the order in which the WHERE clause happens to be evaluated.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes WHERE quantity <> 0 AND total / quantity > 10 to filter rows while guarding against a zero quantity, reasoning "SQL evaluates AND left to right, so quantity <> 0 will always be checked first." Is this reasoning sound, and how does it differ from relying on CASE WHEN\'s branch order for the same kind of guard?',
    hint: 'The main page\'s own Q&A specifically distinguishes CASE\'s guaranteed sequential evaluation from general SQL predicate evaluation — which one does a WHERE ... AND ... clause fall into?',
    solution: `The reasoning is NOT sound. Unlike CASE WHEN, which the SQL standard
requires to evaluate its branches in order and stop at the first
match, WHERE clause AND conditions have no such standard guarantee.
The query optimizer is free to reorder, combine, or evaluate AND-ed
predicates in whatever order it estimates will be fastest -- including
potentially evaluating "total / quantity > 10" before "quantity <> 0"
is checked, which can raise a divide-by-zero error on a row that the
teammate's mental model assumed was already filtered out.

The safe equivalent of the CASE guard is to make the division itself
conditionally safe, independent of predicate evaluation order --
either wrap it in NULLIF(quantity, 0) so the division simply can't
divide by zero regardless of when it runs, or move the check into an
actual CASE expression. Relying on AND's left-to-right appearance in
the source code is a mistake CASE WHEN specifically does NOT have,
which is exactly the distinction the main page's own Q&A points at
but doesn't fully spell out.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CASE WHEN\'s branch-order evaluation is a "most engines happen to do it this way" convention, similar to how WHERE clause AND conditions are usually, but not guaranteed to be, evaluated left to right.',
      reality: 'CASE\'s sequential, first-match WHEN evaluation is part of the ANSI SQL standard\'s definition of the CASE expression itself -- it is guaranteed, not a convention both major engines just happen to share.',
    },
    {
      thought: 'WHERE condition1 AND condition2 guarantees condition1 is checked before condition2, the same way CASE WHEN guarantees its first matching branch wins.',
      reality: 'WHERE clause AND conditions have no such standard-guaranteed evaluation order -- the query optimizer can reorder or combine them however it estimates is fastest, which is why a WHERE-clause divide-by-zero guard is NOT as reliable as an equivalent CASE WHEN or NULLIF guard.',
    },
    {
      thought: 'the safest way to guard a division against a zero denominator is always to add an extra WHERE condition checking the denominator first.',
      reality: 'the reliable guard wraps the division itself (via NULLIF or a CASE expression) so it cannot divide by zero regardless of predicate evaluation order -- an extra WHERE condition alone does not provide this guarantee.',
    },
  ];
}
