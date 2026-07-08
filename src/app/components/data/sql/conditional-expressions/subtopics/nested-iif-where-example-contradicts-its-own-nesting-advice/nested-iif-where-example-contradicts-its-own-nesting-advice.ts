import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nested-iif-contradiction-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nested-iif-where-example-contradicts-its-own-nesting-advice.html',
  styleUrl: './nested-iif-where-example-contradicts-its-own-nesting-advice.scss',
})
export class NestedIifWhereExampleContradictsItsOwnNestingAdviceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Code Example That Breaks Its Own Later Rule',
      points: [
        'The main page\'s "CASE in ORDER BY and WHERE" code tab includes this MSSQL example: WHERE IIF(@status = \'all\', 1, IIF(status = @status, 1, 0)) = 1 — an IIF nested directly inside another IIF\'s false branch.',
        'Several sections later, the page\'s own Q&A gives explicit advice: "Avoid nesting IIF() — it becomes unreadable; use CASE for multi-branch logic." The earlier code tab does precisely the thing this later Q&A tells the reader not to do — and it does it in a WHERE clause, arguably the worst place for hard-to-read conditional logic, since a mistake there silently changes which ROWS are returned.',
      ],
    },
    {
      heading: 'Why the Nested Version Is Genuinely Harder to Verify',
      points: [
        'With two levels of nesting, verifying the WHERE IIF(...) example requires mentally tracking which branch of the OUTER IIF you\'re in before you can even start reading the INNER IIF\'s condition — and this pattern scales badly. A three-status filter parameter (not just @status = \'all\' vs. a specific value) would need a third level of nesting, at which point the false-branch chain becomes a genuine readability hazard.',
        'The page\'s own searched CASE syntax handles arbitrary numbers of conditions as a flat, linearly-readable list — exactly the multi-branch case the Q&A recommends CASE for, and exactly what this WHERE clause example should have used from the start.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own nested-IIF WHERE clause',
      language: 'sql',
      code: `-- From the main page's "CASE in ORDER BY and WHERE" code tab:
DECLARE @status VARCHAR(20) = 'shipped';

SELECT * FROM orders
WHERE IIF(@status = 'all', 1, IIF(status = @status, 1, 0)) = 1;

-- To verify this is correct, a reader has to trace:
-- outer IIF: is @status = 'all'?
--   if yes -> 1 (row included)
--   if no  -> evaluate the INNER IIF: is status = @status?
--     if yes -> 1 (row included)
--     if no  -> 0 (row excluded)
-- Two nested conditionals just to express "match everything, or
-- match one specific value" -- and this is the SIMPLEST possible
-- case (only 2 real outcomes).`,
    },
    {
      label: 'The rewrite the page\'s own Q&A recommends',
      language: 'sql',
      code: `-- Rewritten as a flat searched CASE, per the main page's own advice:
-- "Avoid nesting IIF() -- it becomes unreadable; use CASE for
--  multi-branch logic."
SELECT * FROM orders
WHERE CASE
    WHEN @status = 'all'  THEN 1
    WHEN status = @status THEN 1
    ELSE 0
END = 1;

-- Same result, same two dialects work (this version is actually the
-- one the main page's OWN code tab shows in the line right before
-- the nested-IIF version) -- but now every branch is at the same
-- indentation level, and extending to a third status condition is
-- just one more WHEN line, not another level of nesting:
SELECT * FROM orders
WHERE CASE
    WHEN @status = 'all'      THEN 1
    WHEN status = @status     THEN 1
    WHEN @includeArchived = 1 AND status = 'archived' THEN 1
    ELSE 0
END = 1;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate wants to extend the main page\'s nested-IIF WHERE clause example to also match orders where @includeArchived = 1 AND status = \'archived\', while keeping the existing two conditions. Using the nested-IIF style shown on the main page, what happens to the readability of the resulting expression, and how does the CASE rewrite compare?',
    hint: 'Each additional condition in the nested-IIF style requires wrapping the ENTIRE previous expression inside a new IIF\'s false branch — trace how deep that nesting gets with three conditions.',
    solution: `In the nested-IIF style, adding a third condition means wrapping the
existing two-level nested IIF inside a THIRD IIF's false branch:

IIF(@status = 'all', 1,
    IIF(status = @status, 1,
        IIF(@includeArchived = 1 AND status = 'archived', 1, 0)))

Three levels of nesting, three closing parentheses to count at the
end, and the logic only reads correctly if you track which false
branch you're inside at each level -- exactly the "unreadable" outcome
the main page's own Q&A warns about.

The CASE rewrite, by contrast, just gets one more WHEN line at the
SAME indentation level as the other two -- no additional nesting, no
extra closing parentheses to track, and the whole condition list
reads top-to-bottom in the order it's actually evaluated. This is
precisely why the main page's Q&A recommends CASE over nested IIF for
multi-branch logic -- the nested-IIF WHERE clause example earlier on
the same page is the counter-example that makes the advice concrete.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s nested-IIF WHERE clause example is presented as MSSQL\'s recommended style for parameter-driven filtering, since it appears as one of the page\'s own code examples.',
      reality: 'the page\'s own Q&A section explicitly advises against nesting IIF() for exactly this reason — the WHERE clause code tab predates that advice in reading order, but the two sections directly contradict each other on the SAME pattern.',
    },
    {
      thought: 'IIF and CASE are interchangeable in every situation, so nesting IIF is just a stylistic preference with no real readability cost compared to CASE.',
      reality: 'nested IIF requires tracking which false-branch level you\'re inside to read a condition, and each additional branch adds another level of nesting — a searched CASE keeps every branch at the same, flat indentation level regardless of how many conditions are added.',
    },
    {
      thought: 'since IIF(condition, true_val, false_val) is "just" a two-branch CASE, using nested IIF for 3+ conditions is the natural way to extend it.',
      reality: 'IIF is specifically a two-branch shorthand — the moment a WHERE clause or expression needs a third condition, the main page\'s own Q&A says to switch to CASE, not to nest another IIF inside the false branch.',
    },
  ];
}
