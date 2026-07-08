import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-dead-nullif-count-guard-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-nullif-count-zero-can-never-actually-fire.html',
  styleUrl: './testing-that-nullif-count-zero-can-never-actually-fire.scss',
})
export class TestingThatNullifCountZeroCanNeverActuallyFireSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Defensive Code That Guards Against an Impossible Case',
      points: [
        'The main page\'s "Order status dashboard pivot" challenge solution computes fulfilment_rate as ROUND(SUM(CASE WHEN status = \'delivered\' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), grouped by month. The NULLIF(COUNT(*), 0) is presented as a defensive guard against dividing by zero — the same pattern the main page uses correctly elsewhere for genuinely risky divisions (like headcount that really can be zero).',
        'But COUNT(*) in this specific query can provably never be zero for any row the query actually returns. GROUP BY only emits a row for a group that has at least one matching row in the source table — a group with zero rows isn\'t a group at all, it\'s simply absent from the result (exactly the "missing months" behavior demonstrated in the previous topic\'s own subtopic on the monthly revenue report). So every row this query DOES produce has COUNT(*) >= 1 by construction, making the NULLIF guard dead code — it can never actually change the result.',
      ],
    },
    {
      heading: 'Why It\'s Still Reasonable to Write, and When It Would Matter',
      points: [
        'This isn\'t a bug — the query still produces correct results either way, and NULLIF(COUNT(*), 0) is a low-cost, harmless defensive habit copied from the (genuinely necessary) headcount example a few sections earlier. But it\'s worth knowing the difference between a guard that\'s protecting against a real, reachable edge case and one that\'s protecting against a state the query structure makes unreachable — the two look identical in code but mean different things when reviewing or simplifying a query.',
        'The guard WOULD matter if the query were restructured to use a LEFT JOIN against a generated calendar of months (the fix from the previous topic\'s missing-months subtopic) — in that version, a month with zero orders WOULD appear as a row with COUNT(*) = 0, and NULLIF(COUNT(*), 0) would become load-bearing rather than decorative.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming COUNT(*) is never 0 in the plain GROUP BY version',
      language: 'sql',
      code: `CREATE TABLE orders (id INT, status TEXT, order_date DATE);
INSERT INTO orders VALUES
    (1, 'delivered', '2025-01-05'),
    (2, 'pending',   '2025-01-20');
-- No orders at all in February -- exactly like the previous topic's
-- missing-months scenario.

-- The main page's own challenge solution, run as-is:
SELECT
    TO_CHAR(order_date, 'YYYY-MM') AS month,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
    COUNT(*) AS total_orders,
    ROUND(
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0)
    ) AS fulfilment_rate
FROM orders
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY month;

-- Only ONE row: month = '2025-01', total_orders = 2. There is NO row
-- for '2025-02' at all -- proving COUNT(*) never appears as 0 in this
-- result set. The NULLIF guard on this query can never fire, because
-- the row it would protect against never gets produced in the first
-- place.`,
    },
    {
      label: 'Where the SAME guard becomes load-bearing',
      language: 'sql',
      code: `-- Once the "missing months" gap is fixed with generate_series + LEFT JOIN
-- (the fix from the Date & Time Functions topic), COUNT(*) = 0 becomes
-- a genuinely reachable state:
WITH months AS (
    SELECT TO_CHAR(generate_series(
        DATE_TRUNC('month', MIN(order_date)),
        DATE_TRUNC('month', MAX(order_date)),
        INTERVAL '1 month'
    ), 'YYYY-MM') AS month
    FROM orders
)
SELECT
    m.month,
    SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
    COUNT(o.id) AS total_orders,
    ROUND(
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(o.id), 0)
    ) AS fulfilment_rate
FROM months m
LEFT JOIN orders o ON TO_CHAR(o.order_date, 'YYYY-MM') = m.month
GROUP BY m.month
ORDER BY m.month;

-- NOW '2025-02' appears with total_orders = 0, and WITHOUT the
-- NULLIF guard, fulfilment_rate would raise a genuine divide-by-zero
-- error for that row. In THIS version of the query, the exact same
-- NULLIF(COUNT(o.id), 0) expression is no longer decorative -- it is
-- the only thing preventing a runtime error.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer suggests removing NULLIF(COUNT(*), 0) from the main page\'s original challenge solution as "unnecessary defensive code that adds noise." Is the reviewer right for THIS specific query, and would their suggestion still be safe to apply if the query were later rewritten to use the generate_series + LEFT JOIN fix from the Date & Time Functions topic?',
    hint: 'The correctness of removing a guard depends entirely on whether the specific query structure can ever produce the state the guard protects against — that can change when the query itself changes.',
    solution: `The reviewer is technically correct for the ORIGINAL query as
written: plain GROUP BY can never produce a row with COUNT(*) = 0, so
NULLIF(COUNT(*), 0) is provably dead code in that specific version --
removing it would not change any result, ever.

However, the reviewer's suggestion would become actively WRONG the
moment the query is rewritten to use generate_series + LEFT JOIN to
fix the "missing months" gap. In that version, a month with zero
orders produces a real row with COUNT(*) = 0, and removing the NULLIF
guard would reintroduce a genuine divide-by-zero error for that row.

The lesson: whether a defensive guard is "unnecessary noise" or
"load-bearing protection" is a property of the SPECIFIC query
structure, not of the expression in isolation -- the same
NULLIF(COUNT(*), 0) text means something different depending on
whether GROUP BY can produce a zero-count group in that particular
query, which is exactly what changes between the two versions shown
here.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'NULLIF(COUNT(*), 0) in the challenge solution is protecting against a real edge case, the same way NULLIF(headcount, 0) protects against a genuinely possible zero headcount elsewhere on the main page.',
      reality: 'in the challenge solution\'s plain GROUP BY query, COUNT(*) can never be 0 for any row the query actually returns — GROUP BY only emits rows for groups with at least one matching row, making this specific NULLIF guard dead code.',
    },
    {
      thought: 'if an expression like NULLIF(COUNT(*), 0) appears safe to remove in one query, it\'s safe to remove anywhere the same expression appears.',
      reality: 'whether COUNT(*) can be zero depends entirely on the query\'s structure — the identical expression is dead code in a plain GROUP BY query but becomes essential the moment the query is rewritten to include a LEFT JOIN against a generated calendar that CAN produce zero-count groups.',
    },
    {
      thought: 'defensive code that never actually fires is a sign of a bug or a misunderstanding of the data.',
      reality: 'it can simply be a harmless habit copied from a genuinely necessary pattern used elsewhere in the same codebase — provably dead code isn\'t automatically wrong, it\'s just non-load-bearing for the current query shape.',
    },
  ];
}
