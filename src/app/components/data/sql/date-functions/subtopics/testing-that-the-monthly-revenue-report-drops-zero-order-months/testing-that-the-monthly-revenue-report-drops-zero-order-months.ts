import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-monthly-revenue-report-gap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-monthly-revenue-report-drops-zero-order-months.html',
  styleUrl: './testing-that-the-monthly-revenue-report-drops-zero-order-months.scss',
})
export class TestingThatTheMonthlyRevenueReportDropsZeroOrderMonthsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "Last 12 Months" Report Never Tested on a Gap',
      points: [
        'The main page\'s challenge asks for "monthly revenue for the last 12 months," and its solution groups by DATE_TRUNC(\'month\', order_date). This is only ever demonstrated conceptually — it is never run against a dataset where one of the 12 months happens to have zero orders (a slow month, a launch gap, a new product line).',
        'GROUP BY only produces a row for a group that actually exists in the data. If no order falls in, say, February, the query\'s result set silently has 11 rows instead of 12 — there is no row for February with revenue = 0. The challenge\'s stated requirements (twelve months of revenue) are quietly violated whenever the underlying data has a gap, with no error, warning, or empty row to flag it.',
      ],
    },
    {
      heading: 'Why This Matters for a Report',
      points: [
        'A dashboard or chart consuming this query\'s output typically expects one data point per month. A silently missing row doesn\'t render as "$0" — many charting libraries either skip the month entirely (making the timeline visually compress) or misalign later months if the chart is indexed positionally rather than by date.',
        'The fix is to generate the full calendar of 12 months first (via generate_series), then LEFT JOIN the actual order data onto it — guaranteeing exactly 12 rows regardless of how many months have zero orders.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the gap',
      language: 'sql',
      code: `CREATE TABLE orders (id INT, customer_id INT, order_date TIMESTAMP, total DECIMAL(10,2));

-- 12 months of data, EXCEPT February has zero orders (a real gap)
INSERT INTO orders (id, customer_id, order_date, total) VALUES
    (1, 1, '2025-01-15', 100.00),
    (2, 1, '2025-03-10', 150.00),   -- note: nothing in February
    (3, 1, '2025-04-05', 200.00);
-- (remaining months populated similarly for this example)

-- The main page's own challenge solution, run as-is:
SELECT
    DATE_TRUNC('month', order_date)    AS month_start,
    COUNT(*)                            AS order_count,
    SUM(total)                          AS revenue,
    ROUND(AVG(total), 2)               AS avg_order
FROM orders
WHERE order_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month_start;

-- Result: a row for January, a row for March, a row for April... but
-- NO row at all for February. The result set has fewer rows than
-- there are months in the requested range -- silently.`,
    },
    {
      label: 'The fix — generate_series + LEFT JOIN',
      language: 'sql',
      code: `WITH months AS (
    SELECT generate_series(
        DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
        DATE_TRUNC('month', NOW()),
        INTERVAL '1 month'
    ) AS month_start
)
SELECT
    m.month_start,
    COUNT(o.id)                          AS order_count,
    COALESCE(SUM(o.total), 0)            AS revenue,
    COALESCE(ROUND(AVG(o.total), 2), 0)  AS avg_order
FROM months m
LEFT JOIN orders o
    ON DATE_TRUNC('month', o.order_date) = m.month_start
GROUP BY m.month_start
ORDER BY m.month_start;

-- Now February appears with order_count = 0, revenue = 0, avg_order = 0
-- -- exactly 12 rows, guaranteed, regardless of how sparse the
-- underlying order data is for any given month.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A dashboard built on the main page\'s exact challenge solution shows a revenue line chart where one month appears to be completely skipped — the line jumps directly from January to March with no dip to zero in between. Based on how GROUP BY actually works, is "zero revenue in February" or "the query never produced a February row at all" the more likely explanation, and how would you tell the difference?',
    hint: 'A "$0 in February" scenario would still produce a row (month_start = Feb, revenue = 0). What does the ORIGINAL query do when there are literally no orders in a month, versus when there are orders totaling zero?',
    solution: `"The query never produced a February row at all" is by far the more
likely explanation. GROUP BY DATE_TRUNC('month', order_date) can only
ever produce a row for a group that exists in the underlying orders
table -- if there are zero matching rows for February, there is
nothing to group, and no row is emitted. This is different from a
"revenue = 0" row, which would only happen if orders existed in
February but happened to sum to exactly zero (e.g. all refunded).

To tell the difference: check whether the chart's month-to-month
spacing looks compressed (evidence of a skipped data point entirely)
versus a visible dip to the zero line (evidence of an actual $0 row).
The fix in either case is the same: generate the full calendar of
months with generate_series() and LEFT JOIN the order data onto it,
so every month in the requested range gets an explicit row even when
its order_count is 0.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "Monthly revenue report" challenge solution correctly returns exactly 12 rows for "the last 12 months," since that\'s what the challenge asks for.',
      reality: 'GROUP BY only emits a row for a month that has at least one matching order -- a month with zero orders is silently omitted from the result set entirely, producing fewer than 12 rows whenever the data has a gap.',
    },
    {
      thought: 'a month with zero orders and a month with orders that summed to zero (e.g. all refunds) would look the same in this query\'s output.',
      reality: 'they behave completely differently -- a month with orders summing to zero still produces a row (revenue = 0), while a month with NO orders at all produces no row whatsoever, since there\'s nothing to group.',
    },
    {
      thought: 'fixing a "missing month" gap in a report just requires adding a WHERE clause or an OUTER JOIN somewhere in the existing query.',
      reality: 'the fix requires generating the calendar of expected months independently of the order data (e.g. with generate_series) and then LEFT JOINing orders onto that calendar -- there\'s no way to "recover" a month that has zero matching source rows from the orders table alone.',
    },
  ];
}
