import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-confirming-shared-sort-over-clauses-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './confirming-that-identical-over-clauses-really-do-share-a-single-sort.html',
  styleUrl: './confirming-that-identical-over-clauses-really-do-share-a-single-sort.scss',
})
export class ConfirmingThatIdenticalOverClausesReallyDoShareASingleSortSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A General Claim, Stated Without Demonstration',
      points: [
        'The main page\'s own theory states: "Multiple window functions in the same SELECT with identical OVER() clauses share a single sort operation. Mixing many different OVER() definitions in one SELECT may trigger multiple sort passes." This is presented as a general fact, with no execution plan ever shown to confirm it — a reader is asked to trust the claim rather than verify it against a real query plan.',
        'An execution plan directly answers this: MSSQL exposes a distinct "Sort" operator (or Segment/Window Spool) per unique window specification; PostgreSQL\'s EXPLAIN shows a distinct WindowAgg node per unique PARTITION BY/ORDER BY combination. Counting these nodes for a query with identical vs differing OVER() clauses confirms — or refutes — the claim directly.',
      ],
    },
    {
      heading: 'What Changes When a Third, Different OVER() Clause Is Added',
      points: [
        'Two window functions sharing the exact same PARTITION BY DeptID ORDER BY Salary DESC clause produce ONE sort/window node in the plan — confirming the shared-sort claim. Adding a third window function with a genuinely different clause (e.g. ORDER BY HireDate instead of Salary) introduces a SECOND distinct sort/window node — confirming the "different OVER() definitions may trigger multiple sort passes" half of the same claim.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — identical OVER() clauses share one sort',
      language: 'sql',
      code: `SET STATISTICS PROFILE ON;

SELECT
    EmployeeID, DeptID, Salary,
    ROW_NUMBER() OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS RowNum,
    RANK()       OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS Rank,
    DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS DenseRank
FROM Employees;

-- In the profiled plan output, look for "Segment" / "Sort" operators
-- keyed on (DeptID, Salary DESC): only ONE such Sort/Segment pair
-- appears, even though THREE window functions reference it -- the
-- three ranking functions share a single sort, confirming the claim.

SET STATISTICS PROFILE OFF;`,
    },
    {
      label: 'MSSQL — adding a genuinely different OVER() clause adds a second sort',
      language: 'sql',
      code: `SET STATISTICS PROFILE ON;

SELECT
    EmployeeID, DeptID, Salary, HireDate,
    ROW_NUMBER() OVER (PARTITION BY DeptID ORDER BY Salary DESC)  AS RowNum,
    RANK()       OVER (PARTITION BY DeptID ORDER BY Salary DESC)  AS Rank,
    -- a THIRD window function with a DIFFERENT ORDER BY column:
    ROW_NUMBER() OVER (PARTITION BY DeptID ORDER BY HireDate ASC) AS HireOrder
FROM Employees;

-- Now the profiled plan shows TWO distinct Segment/Sort pairs -- one
-- keyed on (DeptID, Salary DESC) shared by RowNum and Rank, and a
-- SECOND one keyed on (DeptID, HireDate ASC) for HireOrder alone --
-- confirming the "different OVER() definitions trigger multiple sort
-- passes" half of the main page's own claim.

SET STATISTICS PROFILE OFF;`,
    },
    {
      label: 'PostgreSQL — EXPLAIN shows the same pattern via WindowAgg node count',
      language: 'sql',
      code: `-- Identical OVER() clauses: expect ONE WindowAgg node
EXPLAIN
SELECT
    employee_id, dept_id, salary,
    row_number() OVER (PARTITION BY dept_id ORDER BY salary DESC),
    rank()       OVER (PARTITION BY dept_id ORDER BY salary DESC)
FROM employees;
-- Plan: a single WindowAgg node computing both row_number and rank
-- together, over one Sort beneath it.

-- Adding a differently-ordered window function: expect a SECOND
-- WindowAgg (and a second underlying Sort) to appear
EXPLAIN
SELECT
    employee_id, dept_id, salary, hire_date,
    row_number() OVER (PARTITION BY dept_id ORDER BY salary DESC),
    rank()       OVER (PARTITION BY dept_id ORDER BY salary DESC),
    row_number() OVER (PARTITION BY dept_id ORDER BY hire_date ASC)
FROM employees;
-- Plan: TWO WindowAgg nodes, each with its OWN Sort beneath it --
-- confirming the same pattern MSSQL's plan showed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate is optimizing a report with five different window functions in the same SELECT and is deciding whether to rewrite all five to share the exact same PARTITION BY/ORDER BY clause (even where it slightly changes the ranking semantics) purely to reduce sort passes. Using the technique above, how would you determine whether this rewrite is actually worth doing for THIS specific query, rather than assuming it always helps?',
    hint: 'The claim about shared sorts is about how many DISTINCT OVER() clauses currently exist in the query — count them first before assuming a rewrite changes anything.',
    solution: `Before making the change, capture the execution plan for the query as
it currently stands and count the distinct Sort/Segment (MSSQL) or
WindowAgg (PostgreSQL) nodes. If several of the five window functions
already share identical OVER() clauses, the optimizer is likely
already sharing sorts among them, and the query may already have
fewer distinct sort passes than there are window functions -- in which
case unifying the clauses further might yield little or no additional
benefit, while potentially changing the query's actual semantics
(a real cost with only a marginal, or zero, performance gain).

Only if the plan shows genuinely MORE distinct sort/window nodes than
the query actually needs (i.e., several window functions could
legitimately share one clause but currently don't) does the rewrite
have a clear, evidence-based justification. Deciding this from the
actual plan, rather than from the general claim alone, avoids both
under- and over-optimizing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own theory statement about identical OVER() clauses sharing a sort is either self-evidently true from how SQL works, or something that must be taken on faith since it describes internal optimizer behavior.',
      reality: 'this is a directly verifiable claim — capturing an execution plan and counting the distinct Sort/Segment or WindowAgg nodes confirms or refutes it concretely, for a specific query and engine version, rather than requiring faith either way.',
    },
    {
      thought: 'rewriting every window function in a query to use the exact same PARTITION BY/ORDER BY clause always improves performance by reducing sort passes.',
      reality: 'if several window functions already share an identical clause, the optimizer may already be sharing the sort among them — checking the actual plan first avoids an unnecessary rewrite that changes query semantics for no real performance gain.',
    },
    {
      thought: 'the number of window functions in a SELECT list directly determines the number of sort passes in the execution plan — five window functions means five sorts.',
      reality: 'the number of DISTINCT OVER() clauses (not the number of window functions) determines the number of sort passes — several window functions sharing one clause require only one sort pass between them.',
    },
  ];
}
