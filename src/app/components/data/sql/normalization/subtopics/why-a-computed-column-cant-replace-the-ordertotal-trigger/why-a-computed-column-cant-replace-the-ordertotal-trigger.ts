import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-computed-column-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-a-computed-column-cant-replace-the-ordertotal-trigger.html',
  styleUrl: './why-a-computed-column-cant-replace-the-ordertotal-trigger.scss',
})
export class WhyAComputedColumnCantReplaceTheOrdertotalTriggerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Generated/Computed Columns Only See the Same Row',
      points: [
        'Both dialects offer a native alternative to hand-written triggers for keeping a denormalized value in sync: MSSQL\'s computed column (AS (expression) PERSISTED) and PostgreSQL\'s GENERATED ALWAYS AS (expression) STORED. Both automatically recompute — and, with PERSISTED/STORED, physically store — a column\'s value from an expression, with no trigger code and no risk of forgetting to fire on some code path. The main page\'s own Denormalization tab never mentions this alternative at all, going straight to a full custom trigger for OrderTotal.',
        'The reason a generated column CAN\'T replace that specific trigger is a hard limitation of the feature: both MSSQL\'s computed columns and PostgreSQL\'s GENERATED columns can only reference OTHER COLUMNS IN THE SAME ROW — they cannot contain a subquery or aggregate across a related table. OrderTotal = SUM(OrderLines.Qty * OrderLines.UnitPrice) aggregates across an ENTIRE RELATED TABLE, which is exactly the one thing a generated column cannot express. This is precisely why the main page reaches for a trigger for this specific case — there is no simpler native alternative for cross-table aggregation.',
      ],
    },
    {
      heading: 'But It\'s the Right Tool for a Same-Row Denormalization',
      points: [
        'The main page\'s OWN star schema example has a DIFFERENT denormalized column that IS a pure same-row expression: FactSales.Profit, commented as "denormalised: Revenue - Cost" — Revenue and Cost are both columns on the SAME FactSales row. This is exactly the shape of expression a generated column CAN handle natively. Yet the page\'s own DDL declares Profit as an ordinary NOT NULL column with no computation mechanism at all — meaning whatever ETL process loads FactSales is trusted to compute Revenue - Cost correctly and consistently, with nothing in the schema itself enforcing that relationship.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why OrderTotal needs a trigger, but Profit doesn\'t',
      language: 'sql',
      code: `-- OrderTotal aggregates ACROSS a related table — a generated column
-- CANNOT express this (no subqueries/cross-table references allowed):
-- ALTER TABLE Orders ADD OrderTotal AS (
--     SELECT SUM(Qty * UnitPrice) FROM OrderLines WHERE OrderID = Orders.OrderID
-- ) PERSISTED;
-- ERROR: computed column definitions cannot reference another table.
-- This is exactly why the main page reaches for a trigger for OrderTotal.

-- Profit, however, is a pure SAME-ROW expression — a generated column
-- handles it natively, with zero custom code:

-- MSSQL:
ALTER TABLE FactSales DROP COLUMN Profit;
ALTER TABLE FactSales ADD Profit AS (Revenue - Cost) PERSISTED;

-- PostgreSQL:
ALTER TABLE fact_sales DROP COLUMN profit;
ALTER TABLE fact_sales
    ADD COLUMN profit NUMERIC(12,2) GENERATED ALWAYS AS (revenue - cost) STORED;`,
    },
    {
      label: 'Proving the generated column can never drift',
      language: 'sql',
      code: `-- Attempting to insert a Profit value that contradicts Revenue - Cost:
INSERT INTO fact_sales (date_key, customer_key, product_key, quantity, revenue, cost, profit)
VALUES (20240101, 1, 1, 5, 100.00, 60.00, 999.00);  -- should be 40.00, not 999.00

-- With Profit as an ORDINARY column (the main page's own DDL): this
-- INSERT succeeds — 999.00 is silently accepted, drifting from reality.

-- With Profit as GENERATED ALWAYS AS (revenue - cost) STORED:
-- ERROR: cannot insert a non-DEFAULT value into column "profit"
-- The generated column REJECTS any attempt to specify it directly —
-- it is computed automatically and can never be wrong relative to
-- Revenue and Cost, by construction.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate wants to migrate the existing FactSales.Profit column (an ordinary column, per the main page\'s own DDL) to a GENERATED ALWAYS AS STORED column, but the migration fails with an error about existing data. Why would this happen, and what does it reveal about a real risk in the CURRENT (ordinary-column) design that the migration itself just exposed?',
    hint: 'Think about what a generated column definition COMPUTES for every existing row the moment it\'s applied, versus what value is CURRENTLY stored in that row from the old design.',
    solution: `The migration compares what the GENERATED expression would compute
for every EXISTING row (Revenue - Cost) against whatever value is
CURRENTLY stored in the ordinary Profit column for that row. If any
row\'s stored Profit value doesn't exactly match Revenue - Cost — drift
that accumulated over time under the old, unenforced design, whether
from an ETL bug, a manual data fix, or any other path that touched
Profit directly — the migration surfaces that mismatch.

This is the real point: the migration attempt itself is a diagnostic.
If it reveals rows where the stored value differs from the computed
one, that difference IS the accumulated cost of never having enforced
the Revenue-Cost relationship in the first place. The main page's own
comment ("denormalised: Revenue - Cost") only documents intent; a
GENERATED column would have made the relationship a database-enforced
FACT from day one, and this exact migration failure would simply never
have been possible — there would be no way for Profit to have ever
drifted from Revenue - Cost to begin with.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own OrderTotal trigger could be replaced by a MSSQL computed column or PostgreSQL GENERATED column to avoid custom trigger code entirely.',
      reality: 'generated/computed columns can only reference columns in the SAME ROW — they cannot aggregate across a related table like OrderLines, which is exactly why the main page reaches for a trigger for this specific case.',
    },
    {
      thought: 'the FactSales.Profit column, since it\'s just Revenue - Cost, is safe to leave as an ordinary column as long as the ETL process is documented to compute it correctly.',
      reality: 'documentation alone doesn\'t prevent drift — a GENERATED ALWAYS AS (revenue - cost) STORED column would make the relationship enforced by the database itself, rejecting any INSERT/UPDATE that tries to set Profit to a value inconsistent with Revenue and Cost.',
    },
    {
      thought: 'if a generated/computed column feature exists, it should always be preferred over a trigger for any denormalized value.',
      reality: 'generated columns only work for same-row expressions — any denormalization that aggregates or looks up values from a DIFFERENT table (like OrderTotal from OrderLines) still requires a trigger or application-level logic; the two techniques solve different shapes of the same underlying problem.',
    },
  ];
}
