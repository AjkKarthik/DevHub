import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-get-orders-by-status-unnecessary-dynamic-sql-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-get-orders-by-status-does-not-need-dynamic-sql-at-all.html',
  styleUrl: './demonstrating-that-get-orders-by-status-does-not-need-dynamic-sql-at-all.scss',
})
export class DemonstratingThatGetOrdersByStatusDoesNotNeedDynamicSqlAtAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "Dynamic SQL" Example That Isn\'t Dynamic',
      points: [
        'The main page presents get_orders_by_status() as an "Equivalent" to the FORMAT-based search_table() example, demonstrating EXECUTE ... USING for bind parameters. But looking at what actually varies at runtime — only the VALUE of p_status, never a table name, column name, or clause structure — this function has no genuine need for dynamic SQL at all.',
        'The main page\'s own theory is explicit about when dynamic SQL is actually warranted: "useful when table names, column names, or WHERE clause structure vary at runtime." get_orders_by_status() has none of these — it\'s a single, fixed query shape with one variable VALUE, which is exactly what an ordinary parameterized (non-dynamic) SQL statement already handles.',
      ],
    },
    {
      heading: 'Why the Distinction Matters, Not Just Stylistically',
      points: [
        'A plain, static SQL statement inside a function is planned ONCE and that plan is reused across every call — the query planner sees the exact same SQL text every time, with parameters bound normally. EXECUTE ... USING, by contrast, goes through PostgreSQL\'s dynamic SQL execution path, which (depending on version and context) can involve additional overhead compared to a query the planner can see and cache directly as part of the function\'s own execution plan.',
        'Beyond performance, static SQL is simply easier to read, test, and statically analyze (tools can verify a plain SELECT references real tables/columns; a dynamically EXECUTEd string is opaque to most tooling) — reaching for EXECUTE when it isn\'t needed adds real complexity for zero benefit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own function — dynamic SQL for a fixed query shape',
      language: 'sql',
      code: `-- Exactly as published:
CREATE OR REPLACE FUNCTION get_orders_by_status(p_status TEXT)
RETURNS SETOF orders
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    EXECUTE 'SELECT * FROM orders WHERE status = $1'
    USING p_status;
END;
$$;

-- What actually varies between calls: ONLY the VALUE of p_status.
-- The table name (orders), the column (status), and the overall
-- query shape are IDENTICAL on every single call -- none of the
-- three conditions the main page's own theory names as reasons to
-- reach for dynamic SQL ("table names, column names, or WHERE
-- clause structure vary at runtime") actually apply here.`,
    },
    {
      label: 'The static equivalent — identical behavior, no EXECUTE at all',
      language: 'sql',
      code: `CREATE OR REPLACE FUNCTION get_orders_by_status_static(p_status TEXT)
RETURNS SETOF orders
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM orders WHERE status = p_status;
END;
$$;

-- Confirm both versions return identical results:
SELECT * FROM get_orders_by_status('Shipped');
SELECT * FROM get_orders_by_status_static('Shipped');
-- Same rows, same columns, same order -- byte-for-byte identical
-- output. The static version achieves the exact same parameterised
-- safety (p_status is a genuine bound parameter, not concatenated)
-- with less code, no string literal to maintain, and a query the
-- planner can see directly as part of the function body.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, having studied the main page\'s dynamic SQL topic, starts wrapping every PL/pgSQL function\'s query in EXECUTE ... USING as a matter of habit — reasoning "the reference page showed this pattern for filtering by a value, so it must be the recommended way to filter by a value in general." Is this a sound generalization, and what should guide the decision instead?',
    hint: 'Check the main page\'s OWN stated criteria for when dynamic SQL is actually needed — does "filtering by a value" appear anywhere in that list?',
    solution: `This is not a sound generalization, and it\'s actually contradicted by
the main page\'s own theory section, which names the genuine reasons
for dynamic SQL as table names, column names, or WHERE clause
structure varying at runtime — not simple value-based filtering,
which ordinary parameterized SQL already handles safely and
efficiently.

The decision should be driven by what ACTUALLY varies at runtime for
a given query: if only a VALUE changes (like p_status here), a plain
parameterized SQL statement is both simpler and, in most cases, more
efficient — no EXECUTE needed. Dynamic SQL earns its complexity only
when the query\'s STRUCTURE itself needs to change per call — a
different table name, a variable number of WHERE conditions, or a
column list built from runtime data (like the dynamic PIVOT example
elsewhere on the same page, which genuinely does need it). Applying
EXECUTE as a default habit for ordinary value-based filtering adds
real complexity — harder-to-read code, reduced tooling support, and
potentially different planning behavior — for no actual benefit.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s get_orders_by_status() function is a good template for "how to safely filter by a parameter value" in PL/pgSQL, worth copying whenever a function needs a WHERE clause on a value.',
      reality: 'this specific function is presented as a dynamic SQL example, but it doesn\'t actually need dynamic SQL at all — an ordinary static SELECT with a parameterized WHERE clause achieves identical, safe results with less complexity.',
    },
    {
      thought: 'EXECUTE ... USING is always at least as good as a plain SELECT statement inside a PL/pgSQL function, since it\'s "more explicit" about parameter binding.',
      reality: 'a plain, static SELECT with the parameter used directly in the WHERE clause is planned once as part of the function\'s own compiled body — reaching for EXECUTE when the query shape never changes adds complexity without adding safety, since both approaches bind the value as a genuine parameter.',
    },
    {
      thought: 'dynamic SQL is warranted any time a query needs to accept a parameter and filter results based on it.',
      reality: 'the main page\'s own theory section is explicit that dynamic SQL is for when TABLE NAMES, COLUMN NAMES, or WHERE CLAUSE STRUCTURE vary at runtime — filtering by a value alone is exactly the ordinary case static, parameterized SQL is designed for.',
    },
  ];
}
