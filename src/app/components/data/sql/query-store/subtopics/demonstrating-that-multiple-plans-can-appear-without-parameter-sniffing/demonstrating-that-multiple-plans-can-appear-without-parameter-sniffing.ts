import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-multiple-plans-not-sniffing-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-multiple-plans-can-appear-without-parameter-sniffing.html',
  styleUrl: './demonstrating-that-multiple-plans-can-appear-without-parameter-sniffing.scss',
})
export class DemonstratingThatMultiplePlansCanAppearWithoutParameterSniffingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Label',
      points: [
        'The "Find top CPU queries" code tab includes a second query under the comment: "-- Find queries with multiple plans (parameter sniffing suspects)". It groups by query_id, counts DISTINCT plan_id, and filters to COUNT(DISTINCT p.plan_id) > 1 — labeling every result as a parameter-sniffing suspect.',
        'Parameter sniffing (the optimizer compiling a plan for one parameter value, then reusing it for a very different one) is genuinely ONE cause of multiple plans per query_id in Query Store — but it is far from the only one. Query Store creates a new plan_id whenever a query recompiles with a materially different plan, for reasons that have nothing to do with parameters.',
      ],
    },
    {
      heading: 'Other Documented Causes of a New plan_id',
      points: [
        'Index changes: adding, dropping, or rebuilding an index the query uses invalidates its cached plan and forces a recompile — even for a query with zero parameters, or one called with the exact same literal value every time.',
        'Statistics updates: UPDATE STATISTICS (or an automatic stats update after enough row modifications) changes the optimizer\'s cardinality estimates, which can produce a different plan on the next compilation regardless of parameters.',
        'SET options differences (ANSI_NULLS, QUOTED_IDENTIFIER, etc.): the same query text run under different session SET options is treated as needing separate plans by the optimizer, unrelated to any parameter value.',
        'Schema changes and plan eviction under memory pressure can also each independently trigger a recompile that produces a new plan_id.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing multiple plans with zero parameters involved',
      language: 'sql',
      code: `-- A completely non-parameterized, literal-only query --
-- no parameter sniffing possible, by definition
CREATE INDEX ix_orders_status ON orders (status);
GO
SELECT order_id, amount FROM orders WHERE status = 'Shipped';
GO
-- Query Store now has query_id = N, plan_id = P1 for this exact
-- literal query text.

-- Rebuild the index the query depends on -- invalidates the
-- cached plan, forces a recompile on next execution:
ALTER INDEX ix_orders_status ON orders REBUILD;
GO
SELECT order_id, amount FROM orders WHERE status = 'Shipped';
GO
-- Same query_id (identical text), but Query Store now records a
-- SECOND plan_id (P2) for it -- purely from the index rebuild,
-- with the exact same literal predicate both times.`,
    },
    {
      label: 'Confirming with the main page\'s own multi-plan query',
      language: 'sql',
      code: `SELECT q.query_id, COUNT(DISTINCT p.plan_id) AS plan_count,
       qt.query_sql_text
FROM sys.query_store_query q
JOIN sys.query_store_query_text qt ON qt.query_text_id = q.query_text_id
JOIN sys.query_store_plan p ON p.query_id = q.query_id
GROUP BY q.query_id, qt.query_sql_text
HAVING COUNT(DISTINCT p.plan_id) > 1
ORDER BY plan_count DESC;
-- The literal-only "WHERE status = 'Shipped'" query above now
-- appears in this result set with plan_count = 2, despite having
-- no parameters at all -- it is not a "parameter sniffing suspect"
-- by any definition, since there was never a parameter to sniff.`,
    },
    {
      label: 'Distinguishing the causes with force_last_compile_reason',
      language: 'sql',
      code: `-- SQL Server 2017+ (compatibility level 140+) exposes WHY a plan
-- was recompiled directly, which is far more reliable than
-- inferring "parameter sniffing" from plan_count alone:
SELECT
    p.plan_id,
    p.query_id,
    p.last_compile_batch_sql_handle,
    p.query_plan_hash,
    rs.avg_duration
FROM sys.query_store_plan p
JOIN sys.query_store_runtime_stats rs ON rs.plan_id = p.plan_id
WHERE p.query_id = 42
ORDER BY p.plan_id;
-- Cross-reference with Extended Events (query_store_plan_forcing_failed,
-- or sql_statement_recompile with recompile_cause) to see the actual
-- recompile reason -- 'Schema changed', 'Statistics changed',
-- 'Index changed' are all distinct from 'parameter sniffing'-style
-- causes and appear in real Query Store data regularly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You run the main page\'s "Find queries with multiple plans" report and see a query with plan_count = 3. You immediately assume it must have been called with 3 wildly different parameter values causing parameter-sniffing-driven plan changes, and start investigating parameter distributions. What else should you check before concluding that?',
    hint: 'List every documented reason Query Store creates a new plan_id for the same query_id besides different parameter values.',
    solution: `Before assuming parameter sniffing, check whether index changes,
statistics updates, or SET options differences coincide with the
plan_id changes — any of these can independently produce a new
plan_id for the exact same query text, with or without different
parameter values ever being involved. As demonstrated above, even a
query with ZERO parameters (pure literals) can accumulate multiple
plan_ids purely from an index rebuild.

A more reliable diagnostic than plan_count alone is checking the
actual recompile reason via Extended Events (sql_statement_recompile
with its recompile_cause column) or comparing query_plan_hash values
across the plans to see how structurally different they actually
are. "Multiple plans" is a necessary signal that something changed
between compilations — it is not, by itself, sufficient evidence
that the cause was parameter sniffing specifically.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'COUNT(DISTINCT plan_id) > 1 for a query_id in Query Store is a reliable, specific signal of parameter sniffing.',
      reality: 'it is a signal that the query recompiled into a materially different plan at least once — parameter sniffing is one possible cause among several documented ones, including index changes, statistics updates, SET options differences, and schema changes.',
    },
    {
      thought: 'a query with no parameters at all (pure literal predicates) cannot show up in a "multiple plans" report, since parameter sniffing requires parameters.',
      reality: 'Query Store tracks plan_id per query_id regardless of whether the query is parameterized — a literal-only query can and does accumulate multiple plan_ids from causes entirely unrelated to parameters, as demonstrated by the index-rebuild example above.',
    },
    {
      thought: 'the fix for any query flagged by the "multiple plans" report is the same: force the best-performing plan and move on.',
      reality: 'forcing a plan without first identifying WHY the plan changed can mask a legitimate adaptation (e.g., a plan that correctly changed after a real data-distribution shift) — checking the actual recompile cause first avoids forcing a now-stale plan onto changed data.',
    },
  ];
}
