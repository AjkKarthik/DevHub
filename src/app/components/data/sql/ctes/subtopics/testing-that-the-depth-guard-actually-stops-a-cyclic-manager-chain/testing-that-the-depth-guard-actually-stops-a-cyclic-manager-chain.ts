import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-depth-guard-cyclic-manager-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-depth-guard-actually-stops-a-cyclic-manager-chain.html',
  styleUrl: './testing-that-the-depth-guard-actually-stops-a-cyclic-manager-chain.scss',
})
export class TestingThatTheDepthGuardActuallyStopsACyclicManagerChainSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Guard Is Never Actually Tested Against a Real Cycle',
      points: [
        'The main page\'s own Employee org-chart example includes two safety mechanisms: a manual depth guard in the recursive member (WHERE t.Depth < 10) and an engine-level cap (OPTION (MAXRECURSION 50) in MSSQL). It never demonstrates what happens if the underlying ReportsTo data actually contains a cycle — a realistic scenario after a bad HR data import or a manual reporting-line fix that accidentally points a manager back to one of their own indirect reports.',
        'A genuine cycle is easy to construct: employee 2 (the query\'s own starting point) has ReportsTo = 8, employee 5 has ReportsTo = 2, and employee 8 has ReportsTo = 5 — a 3-node loop (2 → 5 → 8 → 2 → …) that would recurse forever without the depth guard, regardless of the fact that employee 2 is where the anchor member starts.',
      ],
    },
    {
      heading: 'Testing Both Guards Separately Shows What Each One Actually Does',
      points: [
        'With the manual depth guard in place (WHERE t.Depth < 10), the query terminates normally and returns a bounded set of rows — depths 0 through 10 (11 rows total), cycling through employees 2, 5, and 8 repeatedly until the guard cuts it off. This is a clean, predictable stop, not an error.',
        'With the manual depth guard REMOVED — relying solely on OPTION (MAXRECURSION 50) — the query instead raises an explicit error once the recursion exceeds 50 iterations ("The maximum recursion 50 has been exhausted before statement completion"). This is a hard failure, not a graceful truncation — worth knowing which behavior a given query will actually exhibit before a cyclic-data incident happens in production.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — tSQLt test: the depth guard produces a clean, bounded result',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'RecursiveCteCycleTests';
GO

CREATE PROCEDURE RecursiveCteCycleTests.[test depth guard stops a cyclic manager chain]
AS
BEGIN
    -- A genuine 3-node cycle: 2 -> 5 -> 8 -> 2 -> ...
    INSERT INTO Employees (EmployeeID, LastName, ReportsTo) VALUES
      (2, 'Root', 8),
      (5, 'Mid',  2),
      (8, 'Leaf', 5);

    -- The main page's own query, WITH the depth guard intact:
    WITH EmployeeTree AS (
        SELECT EmployeeID, LastName, ReportsTo, 0 AS Depth
        FROM Employees WHERE EmployeeID = 2
        UNION ALL
        SELECT e.EmployeeID, e.LastName, e.ReportsTo, t.Depth + 1
        FROM Employees e
        INNER JOIN EmployeeTree t ON e.ReportsTo = t.EmployeeID
        WHERE t.Depth < 10          -- the guard under test
    )
    SELECT COUNT(*) AS RowCount INTO #Result FROM EmployeeTree
    OPTION (MAXRECURSION 50);

    -- Terminates cleanly with a BOUNDED row count (depths 0-10 = 11 rows)
    -- instead of hanging or erroring:
    EXEC tSQLt.AssertEquals @Expected = 11, @Actual = (SELECT RowCount FROM #Result);
END;
GO

EXEC tSQLt.Run 'RecursiveCteCycleTests';`,
    },
    {
      label: 'MSSQL — removing the guard: MAXRECURSION raises an explicit error',
      language: 'sql',
      code: `-- Same cyclic data, but the depth guard is REMOVED from the recursive
-- member -- only the engine-level cap remains:
WITH EmployeeTree AS (
    SELECT EmployeeID, LastName, ReportsTo, 0 AS Depth
    FROM Employees WHERE EmployeeID = 2
    UNION ALL
    SELECT e.EmployeeID, e.LastName, e.ReportsTo, t.Depth + 1
    FROM Employees e
    INNER JOIN EmployeeTree t ON e.ReportsTo = t.EmployeeID
    -- no WHERE t.Depth < 10 guard this time
)
SELECT * FROM EmployeeTree
OPTION (MAXRECURSION 50);
-- Msg 530, Level 16, State 1
-- The statement terminated. The maximum recursion 50 has been
-- exhausted before statement completion.
-- A hard error, not a silent truncation -- the query fails outright
-- rather than returning a partial, bounded result.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An org-chart report built on the main page\'s own recursive CTE pattern (with the <code>WHERE t.Depth < 10</code> guard intact) starts silently truncating a legitimate, non-cyclic department at exactly 10 levels of management — a real department that genuinely has 12 levels of hierarchy. Using what the test above reveals about the guard\'s behavior, what\'s happening, and how would you distinguish "genuinely too deep" from "a data cycle" in practice?',
    hint: 'The guard has no way to tell the difference between a real 12-level hierarchy and an infinite cycle — it just stops at a fixed depth either way.',
    solution: `The depth guard (WHERE t.Depth < 10) is a blunt instrument: it stops
recursion after exactly 10 levels regardless of WHY it reached that
depth -- it cannot distinguish a genuinely deep, valid 12-level
organization from an infinite cycle that would otherwise never
terminate. In this case, the guard is silently truncating legitimate
data because the hardcoded limit (10) is lower than the real
organization's actual depth (12).

To distinguish the two cases in practice: raise the depth guard to a
value comfortably above any REALISTIC organizational depth (e.g. 30 or
50) so genuine hierarchies are never truncated, while still bounding
runaway cycles at a value far below what MAXRECURSION would need to
catch. If a query then still hits the raised guard, that is itself a
strong signal worth investigating as a potential data cycle rather
than legitimate depth -- log or alert when the guard is actually
reached, rather than silently returning a truncated result with no
indication anything was cut off.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own depth guard (WHERE t.Depth < 10) and MAXRECURSION cap are redundant safety measures — either one alone would produce the same outcome on a cyclic dataset.',
      reality: 'they produce genuinely different outcomes — the manual depth guard causes a clean, bounded, successful result; relying on MAXRECURSION alone (with no manual guard) causes the entire query to fail with an explicit error once the cap is exceeded.',
    },
    {
      thought: 'a recursive CTE with a depth guard like WHERE t.Depth < 10 is "safe" from cyclic data in the sense that it will always return correct, complete results.',
      reality: 'the guard only prevents an infinite loop — it does not detect or report that a cycle occurred. A cyclic manager chain with the guard in place returns a plausible-looking, bounded result (11 rows in this fixture) with no indication that the underlying data is actually broken.',
    },
    {
      thought: 'testing a recursive CTE only requires checking that it produces the right output on a normal, acyclic dataset — cyclic data is too rare an edge case to warrant its own test.',
      reality: 'reporting-line and hierarchy data (ReportsTo, ParentID, and similar self-referencing foreign keys) is realistically prone to cycles from data-entry mistakes and bad migrations — testing the guard\'s behavior against a deliberately constructed cycle is directly relevant, not a hypothetical exercise.',
    },
  ];
}
