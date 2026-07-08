import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-plan-cache-pollution-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './plan-cache-pollution-is-about-query-text-not-query-structure.html',
  styleUrl: './plan-cache-pollution-is-about-query-text-not-query-structure.scss',
})
export class PlanCachePollutionIsAboutQueryTextNotQueryStructureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Plan Cache Pollution Is About Query TEXT, Not Query STRUCTURE',
      points: [
        'The main page\'s own "Plan caching" point states "ad-hoc queries with literal values often produce a different cache entry per value (plan cache pollution)" — the mechanism behind this is that the plan cache keys entries off a HASH OF THE QUERY\'S EXACT TEXT, not its logical structure. SELECT * FROM Orders WHERE CustomerID = 5 and SELECT * FROM Orders WHERE CustomerID = 6 are structurally IDENTICAL queries that would almost certainly produce the SAME execution plan — but because their literal text differs, they hash to different cache keys and get two ENTIRELY SEPARATE plan cache entries, each independently optimized from scratch.',
        'At scale, this means an application that builds ad-hoc SQL strings by concatenating literal values (rather than using parameters) can flood the plan cache with thousands of near-identical entries for what is functionally ONE query shape — wasting both the memory the cache consumes and the CPU time spent re-running full cost-based optimization for every new literal value that appears, even though the optimizer would produce the same plan every time.',
      ],
    },
    {
      heading: 'Parameterization Collapses All of Those Into One Shared Entry',
      points: [
        'Using sp_executesql (MSSQL) or a prepared statement (PostgreSQL) replaces the literal value with a parameter placeholder in the CACHED text — SELECT * FROM Orders WHERE CustomerID = @CustomerID — meaning every call with a DIFFERENT CustomerID value still hashes to the exact SAME cache key and reuses the SAME already-optimized plan. This is precisely why the main page\'s own advice to "use sp_executesql (MSSQL) or prepared statements to cache parametrically" works: it isn\'t just a style preference, it collapses what would be N separate cache entries (one per distinct literal ever seen) into exactly ONE.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving multiple cache entries for ad-hoc literal queries',
      language: 'sql',
      code: `-- Run these three "different" queries...
SELECT * FROM Orders WHERE CustomerID = 1;
SELECT * FROM Orders WHERE CustomerID = 2;
SELECT * FROM Orders WHERE CustomerID = 3;

-- ...then inspect the plan cache:
SELECT text, usecounts
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle)
WHERE text LIKE '%FROM Orders WHERE CustomerID%';

-- Result: THREE separate rows, one per literal value, each with
-- usecounts = 1 — three independently-optimized plans for what is
-- functionally the exact same query shape.`,
    },
    {
      label: 'Parameterized version — one shared cache entry',
      language: 'sql',
      code: `-- Using sp_executesql — the SAME parameterized text is cached ONCE:
EXEC sp_executesql
    N'SELECT * FROM Orders WHERE CustomerID = @CustomerID',
    N'@CustomerID INT', @CustomerID = 1;

EXEC sp_executesql
    N'SELECT * FROM Orders WHERE CustomerID = @CustomerID',
    N'@CustomerID INT', @CustomerID = 2;

EXEC sp_executesql
    N'SELECT * FROM Orders WHERE CustomerID = @CustomerID',
    N'@CustomerID INT', @CustomerID = 3;

SELECT text, usecounts
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle)
WHERE text LIKE '%FROM Orders WHERE CustomerID = @CustomerID%';

-- Result: ONE row — text is identical across all three calls — with
-- usecounts = 3, since the SAME cached plan was reused every time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "fixes" plan cache pollution by wrapping every ad-hoc query in sp_executesql WITHOUT actually parameterizing the literal value — e.g. <code>EXEC sp_executesql N\'SELECT * FROM Orders WHERE CustomerID = 5\'</code> (the literal 5 baked directly into the text string). Does this actually solve the plan cache pollution problem?',
    hint: 'The cache key is a hash of the exact TEXT string. Does wrapping a literal-containing string in sp_executesql change what that text actually IS?',
    solution: `No — this doesn't solve anything, because the cache key is still a
hash of the exact TEXT, and the text N'SELECT * FROM Orders WHERE
CustomerID = 5' is just as literal-specific as before, merely passed
through sp_executesql instead of run directly. A call with CustomerID = 6
produces a DIFFERENT text string ("...= 6" instead of "...= 5"), which
still hashes to a different cache key and still gets its own separate
plan cache entry — sp_executesql alone doesn't parameterize anything;
it just executes whatever string it's given.

The fix requires actually extracting the literal into a genuine
parameter — the @CustomerID placeholder in the query text itself, with
the value supplied SEPARATELY as a parameter argument, exactly as shown
in the working example above. Only then does the CACHED TEXT stay
identical across every call regardless of which CustomerID value is
passed, collapsing what would otherwise be one cache entry per distinct
value ever seen into a single shared, reused plan.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SELECT * FROM Orders WHERE CustomerID = 5 and SELECT * FROM Orders WHERE CustomerID = 6 share the same cached execution plan, since they\'re structurally the same query.',
      reality: 'the plan cache keys entries off a hash of the query\'s EXACT TEXT, not its logical structure — two queries differing only in a literal value produce two completely separate cache entries, each independently optimized.',
    },
    {
      thought: 'wrapping an ad-hoc query string (with a literal value already baked in) inside sp_executesql() automatically parameterizes it and fixes plan cache pollution.',
      reality: 'sp_executesql executes whatever text string it\'s given — if that string still contains the literal value directly, it\'s just as text-specific as running it directly, and still produces a separate cache entry per distinct value.',
    },
    {
      thought: 'plan cache pollution is primarily a memory-usage concern — extra cache entries take up space but don\'t otherwise cost anything.',
      reality: 'each new literal-value entry also means the optimizer runs a FULL cost-based optimization pass from scratch for that specific value, rather than reusing an already-computed plan — the CPU cost of repeated optimization compounds the memory cost.',
    },
  ];
}
