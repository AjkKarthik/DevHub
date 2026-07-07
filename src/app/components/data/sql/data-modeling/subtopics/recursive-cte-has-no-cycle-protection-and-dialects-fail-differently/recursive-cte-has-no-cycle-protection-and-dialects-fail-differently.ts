import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-recursive-cte-cycle-protection-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './recursive-cte-has-no-cycle-protection-and-dialects-fail-differently.html',
  styleUrl: './recursive-cte-has-no-cycle-protection-and-dialects-fail-differently.scss',
})
export class RecursiveCteHasNoCycleProtectionAndDialectsFailDifferentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Recursive CTE Has No Cycle Protection',
      points: [
        'The main page\'s own "Self-referencing hierarchy" example builds a recursive CTE over categories.parent_category_id with NO safeguard against a cycle — e.g. if Electronics\' parent were accidentally set to Smartphones (one of its own descendants), the recursive member would repeatedly re-join an ever-growing chain with no natural termination. Both dialects handle this badly, but DIFFERENTLY.',
        'MSSQL enforces a MAXRECURSION limit of 100 by default — the query errors out with "The statement terminated. The maximum recursion 100 has been exhausted before statement completion," a recoverable, if abrupt, failure. PostgreSQL\'s WITH RECURSIVE has NO default recursion limit at all — a genuine cycle can loop until it exhausts available memory or disk for temporary files, a much more severe failure mode than MSSQL\'s.',
      ],
    },
    {
      heading: 'The Fix — Track Visited IDs and Stop Before Re-Entering Them',
      points: [
        'The standard fix tracks every category_id already visited on the current path (an array in PostgreSQL, a delimited string in MSSQL) and adds a WHERE clause to the recursive member that refuses to re-join a category already in that list — stopping the recursion the moment it would revisit a node, regardless of how the cycle was introduced. Pairing this with an explicit, low OPTION (MAXRECURSION n) in MSSQL adds a second line of defense in case the visited-tracking logic itself has a bug.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — cycle detection with a visited-IDs array',
      language: 'sql',
      code: `WITH RECURSIVE cat_tree AS (
    SELECT category_id, category_name, parent_category_id, 0 AS depth,
           ARRAY[category_id] AS visited,     -- track visited IDs
           CAST(category_name AS VARCHAR(1000)) AS path
    FROM categories
    WHERE parent_category_id IS NULL

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_category_id,
           ct.depth + 1,
           ct.visited || c.category_id,
           CAST(ct.path || ' > ' || c.category_name AS VARCHAR(1000))
    FROM categories c
    JOIN cat_tree ct ON c.parent_category_id = ct.category_id
    WHERE NOT c.category_id = ANY(ct.visited)   -- stop before re-visiting
)
SELECT depth, path FROM cat_tree ORDER BY path;`,
    },
    {
      label: 'MSSQL — visited-IDs path plus an explicit low MAXRECURSION cap',
      language: 'sql',
      code: `WITH cat_tree AS (
    SELECT category_id, category_name, parent_category_id, 0 AS depth,
           CAST('|' + CAST(category_id AS VARCHAR(10)) + '|' AS VARCHAR(1000)) AS visited_ids,
           CAST(category_name AS NVARCHAR(1000)) AS path
    FROM categories
    WHERE parent_category_id IS NULL

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_category_id,
           ct.depth + 1,
           ct.visited_ids + CAST(c.category_id AS VARCHAR(10)) + '|',
           CAST(ct.path + N' > ' + c.category_name AS NVARCHAR(1000))
    FROM categories c
    JOIN cat_tree ct ON c.parent_category_id = ct.category_id
    WHERE ct.visited_ids NOT LIKE '%|' + CAST(c.category_id AS VARCHAR(10)) + '|%'
)
SELECT depth, path FROM cat_tree
OPTION (MAXRECURSION 50);   -- explicit, low cap as a second line of defense`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A junior DBA accidentally runs <code>UPDATE categories SET parent_category_id = 5 WHERE category_id = 1;</code> where category 5 is actually a descendant of category 1 several levels down, creating a cycle. On MSSQL, the recursive CTE query from the main page\'s own example would eventually stop with a MAXRECURSION error — is this "safe enough," or is there still a real risk?',
    hint: 'Think about what happens BEFORE the 100th recursion level — how much intermediate work does the engine do, and does hitting a hard error after 100 levels actually protect anything, or just delay the failure?',
    solution: `It's "safe" in the narrow sense that the query WILL eventually
terminate with an error rather than running forever — but it's not
actually safe in a broader sense. Before hitting the MAXRECURSION
limit, the engine still does 100 full levels of JOIN work, generating
and holding all 100 levels of intermediate rows before the error is
raised — for a large categories table, or if this pattern runs
concurrently across many sessions, that's still real, wasted resource
consumption on every single execution of the buggy query, not a single
problem caught once.

More importantly, MAXRECURSION only protects the RECURSIVE CTE QUERY
itself — it does nothing to catch the cycle at the moment the bad
UPDATE happens. The row (category_id = 1, parent_category_id = 5) gets
written successfully; nothing prevents the cyclic data from persisting
in the table. Every future query against the hierarchy — this one and
any others — pays the same cost repeatedly until someone notices and
manually fixes the bad row. A more robust defense adds a CHECK or
trigger-based validation at WRITE time that rejects an UPDATE/INSERT
which would introduce a cycle in the first place, rather than relying
on read-time recursion limits to eventually surface the symptom.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MSSQL\'s default MAXRECURSION limit of 100 makes the main page\'s own recursive CTE example inherently safe against a cyclic self-reference.',
      reality: 'MAXRECURSION only turns an infinite loop into a hard error after 100 levels of wasted work — it doesn\'t prevent the cyclic data from existing, doesn\'t stop the query from doing real work before failing, and provides no protection at all on PostgreSQL, which has no default recursion limit.',
    },
    {
      thought: 'PostgreSQL\'s WITH RECURSIVE and MSSQL\'s recursive CTE behave the same way when given cyclic data — both eventually hit a built-in safety limit and error out.',
      reality: 'PostgreSQL has NO default recursion limit — a genuine cycle can loop until it exhausts available memory or disk for temporary files, a more severe failure mode than MSSQL\'s recoverable MAXRECURSION error.',
    },
    {
      thought: 'adding cycle detection (tracking visited IDs) to a recursive CTE is only necessary for genuinely deep hierarchies, not simple ones like the main page\'s own 3-level category example.',
      reality: 'cycle risk isn\'t about hierarchy depth — it\'s about whether the underlying self-referencing data can EVER contain a cycle at all, which a single bad UPDATE can introduce regardless of how shallow the intended hierarchy is.',
    },
  ];
}
