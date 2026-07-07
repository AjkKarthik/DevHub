import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-categorypath-missing-guard-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './categorypath-has-no-depth-guard-and-postgresql-wont-save-it.html',
  styleUrl: './categorypath-has-no-depth-guard-and-postgresql-wont-save-it.scss',
})
export class CategorypathHasNoDepthGuardAndPostgresqlWontSaveItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One Recursive Example on the Page Has a Guard — the Other Doesn\'t',
      points: [
        'The main page\'s own Employee org-chart example includes WHERE t.Depth < 10 in its recursive member. Its Number Series examples have natural termination conditions (WHERE n < 100, WHERE dt < \'2024-12-31\'). Its CategoryPath (category-hierarchy path accumulation) example — in the very same "Recursive — Number Series" code tab — has NONE of these: it relies entirely on "the recursive join eventually finds no more matching rows," which is correct for a genuinely acyclic category tree but offers zero protection if a ParentID data-entry error ever creates a cycle (a category\'s ParentID accidentally set to one of its own descendants).',
        'The main page\'s own theory section states the general rule clearly: "Guard against infinite recursion... add a depth counter and WHERE depth < 100 as a safety bound" — advice its own Employee example follows and its own CategoryPath example does not.',
      ],
    },
    {
      heading: 'The Safety Consequences Are Not Symmetric Across Dialects',
      points: [
        'MSSQL applies a DEFAULT MAXRECURSION of 100 automatically to every recursive CTE, even without an explicit OPTION (MAXRECURSION n) clause. A cyclic CategoryPath query in MSSQL would still terminate — with an explicit error — after 100 iterations by accident, purely because of this undocumented-in-this-example default safety net.',
        'PostgreSQL has NO equivalent automatic cap at all. The exact same query, ported directly to PostgreSQL with no depth guard added, would recurse indefinitely on a genuine cycle, consuming memory until the connection is manually terminated (or a statement_timeout is separately configured) — a materially more dangerous failure mode than MSSQL\'s accidental 100-iteration ceiling.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — the unguarded query survives by accident (default MAXRECURSION)',
      language: 'sql',
      code: `-- Bad data: Category 3's ParentID accidentally set to Category 9,
-- which is itself a descendant of Category 3 -- a genuine cycle:
INSERT INTO Categories (CategoryID, CategoryName, ParentID) VALUES
  (1, 'Root',   NULL),
  (3, 'Mid',    9),      -- cyclic: 3's parent is 9
  (9, 'Leaf',   3);      -- 9's parent is 3

-- The main page's own CategoryPath query, exactly as written -- no
-- depth guard, no explicit OPTION(MAXRECURSION):
WITH CategoryPath AS (
    SELECT CategoryID, CategoryName, ParentID,
           CAST(CategoryName AS VARCHAR(500)) AS FullPath
    FROM Categories WHERE ParentID IS NULL

    UNION ALL

    SELECT c.CategoryID, c.CategoryName, c.ParentID,
           CAST(p.FullPath + ' > ' + c.CategoryName AS VARCHAR(500))
    FROM Categories c
    JOIN CategoryPath p ON c.ParentID = p.CategoryID
)
SELECT * FROM CategoryPath ORDER BY FullPath;
-- Msg 530: The maximum recursion 100 has been exhausted before
-- statement completion.
-- This query never mentioned MAXRECURSION at all -- MSSQL's DEFAULT
-- cap of 100 is what stopped it, purely by accident.`,
    },
    {
      label: 'PostgreSQL — no default cap exists at all',
      language: 'sql',
      code: `-- The equivalent PostgreSQL query, same cyclic data, same missing guard:
WITH RECURSIVE CategoryPath AS (
    SELECT category_id, category_name, parent_id,
           category_name::VARCHAR(500) AS full_path
    FROM categories WHERE parent_id IS NULL

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id,
           (p.full_path || ' > ' || c.category_name)::VARCHAR(500)
    FROM categories c
    JOIN CategoryPath p ON c.parent_id = p.category_id
)
SELECT * FROM CategoryPath ORDER BY full_path;
-- PostgreSQL has NO automatic recursion cap equivalent to MSSQL's
-- default MAXRECURSION=100. This query will recurse indefinitely on
-- the same cyclic data, consuming memory until the connection is
-- manually cancelled or the server runs out of resources -- there is
-- no accidental safety net here at all.`,
    },
    {
      label: 'The fix — the same depth-guard pattern, ported to CategoryPath',
      language: 'sql',
      code: `-- Both dialects: add the SAME Depth column + guard the Employee
-- example already uses, adapted to CategoryPath:
WITH CategoryPath AS (
    SELECT CategoryID, CategoryName, ParentID,
           CAST(CategoryName AS VARCHAR(500)) AS FullPath,
           0 AS Depth
    FROM Categories WHERE ParentID IS NULL

    UNION ALL

    SELECT c.CategoryID, c.CategoryName, c.ParentID,
           CAST(p.FullPath + ' > ' + c.CategoryName AS VARCHAR(500)),
           p.Depth + 1
    FROM Categories c
    JOIN CategoryPath p ON c.ParentID = p.CategoryID
    WHERE p.Depth < 20         -- protects BOTH dialects identically
)
SELECT * FROM CategoryPath ORDER BY FullPath
OPTION (MAXRECURSION 20);     -- MSSQL only; harmless no-op comment in PG
-- Now a data cycle terminates cleanly and identically in both
-- dialects, instead of relying on MSSQL's accidental default cap or
-- PostgreSQL's complete lack of one.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs the main page\'s own unguarded CategoryPath query in production. In MSSQL it fails after a few seconds with a MAXRECURSION error and someone investigates the ParentID data. The SAME query, ported to a PostgreSQL read-replica for a migration, instead causes that replica to run out of memory and get killed by the OS, with no clear error message pointing at the cause. Why did the two environments behave so differently, and what single change would make both behave identically (and safely)?',
    hint: 'Neither environment has an explicit depth guard written into the query — think about what each database provides (or doesn\'t) BY DEFAULT when no guard is present.',
    solution: `The two environments behaved differently because MSSQL applies a
DEFAULT MAXRECURSION of 100 to every recursive CTE automatically, even
when the query never mentions MAXRECURSION at all -- this accidental
safety net is what caused the MSSQL version to fail cleanly, with an
explicit, diagnosable error message, after 100 iterations. PostgreSQL
provides no equivalent automatic cap whatsoever -- with no depth guard
written into the query, a genuine cycle recurses without limit,
consuming memory until the operating system (not the database itself)
intervenes, producing a much less informative failure.

The single fix that makes both behave identically and safely is
adding an explicit depth guard directly in the query -- a Depth column
seeded at 0 in the anchor member, incremented in the recursive member,
and checked with a WHERE clause (e.g. WHERE p.Depth < 20) before the
recursive join runs. This protects both dialects the same way,
regardless of whether the underlying engine happens to provide its
own automatic cap.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a recursive CTE without an explicit MAXRECURSION clause in MSSQL has no protection against infinite recursion at all.',
      reality: 'MSSQL applies a DEFAULT MAXRECURSION of 100 automatically to every recursive CTE, even when OPTION (MAXRECURSION n) is never written — this default cap is what silently protects an unguarded query like the main page\'s own CategoryPath example.',
    },
    {
      thought: 'a query pattern that works safely in MSSQL (like the unguarded CategoryPath example) will behave the same way if ported directly to PostgreSQL, since both dialects support recursive CTEs with the same UNION ALL structure.',
      reality: 'PostgreSQL has no equivalent to MSSQL\'s default MAXRECURSION cap — an unguarded recursive query that fails safely (with a clear error) in MSSQL can recurse indefinitely, unbounded, in PostgreSQL, with no automatic safety net at all.',
    },
    {
      thought: 'if one recursive CTE example on a reference page includes a depth guard, every other recursive CTE example on the same page necessarily follows the same safe pattern.',
      reality: 'the main page\'s own Employee org-chart example includes a depth guard, while its CategoryPath example — in the same code tab, following the same general theory section\'s advice — does not. Consistency has to be checked per-example, not assumed.',
    },
  ];
}
