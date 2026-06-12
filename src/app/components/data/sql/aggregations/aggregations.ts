import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-aggregations',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './aggregations.html',
  styleUrl: './aggregations.scss',
})
export class SqlAggregations {

  quickRef: QuickRefItem[] = [
    { name: 'COUNT(*)',               type: 'function', desc: 'Count all rows in the group, including NULLs.' },
    { name: 'COUNT(col)',             type: 'function', desc: 'Count non-NULL values in col. COUNT(DISTINCT col) counts unique non-NULL values.' },
    { name: 'SUM / AVG',             type: 'function', desc: 'Sum or average of non-NULL values. NULL rows are ignored silently.' },
    { name: 'MIN / MAX',             type: 'function', desc: 'Minimum/maximum value. Works on numbers, dates, and strings. NULLs ignored.' },
    { name: 'GROUP BY',              type: 'keyword',  desc: 'Collapse rows into groups. Every SELECT column must be in GROUP BY or wrapped in an aggregate.' },
    { name: 'HAVING',                type: 'keyword',  desc: 'Filter AFTER aggregation (operates on groups). WHERE filters before aggregation (operates on rows).' },
    { name: 'STRING_AGG (both)',     type: 'function', desc: 'Concatenate values into a delimited string. MSSQL: STRING_AGG(col, \',\'). PG: STRING_AGG(col, \',\').' },
    { name: 'FILTER (PostgreSQL)',   type: 'keyword',  desc: 'Apply a per-aggregate WHERE: COUNT(*) FILTER (WHERE status=\'Active\'). MSSQL uses SUM(CASE WHEN … END).' },
    { name: 'ROLLUP',                type: 'keyword',  desc: 'Subtotals + grand total: GROUP BY ROLLUP(a, b) produces (a,b), (a), () groups. Both dialects.' },
    { name: 'CUBE',                  type: 'keyword',  desc: 'All combinations of grouping columns. GROUP BY CUBE(a, b) → (a,b), (a,), (b), (). Both dialects.' },
    { name: 'GROUPING SETS',        type: 'keyword',  desc: 'Explicit list of grouping combinations. More flexible than ROLLUP/CUBE. Both dialects.' },
    { name: 'PERCENTILE_CONT/DISC', type: 'function', desc: 'Ordered-set aggregates. PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY val) = median. Both dialects.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Aggregate Functions and GROUP BY',
      points: [
        'Aggregate functions collapse multiple rows into a single value per group: COUNT, SUM, AVG, MIN, MAX.',
        'NULLs are silently ignored by all aggregates except COUNT(*). AVG(col) is the average of non-NULL values, which may surprise you — SUM(col)/COUNT(*) gives a different result when NULLs are present.',
        'GROUP BY defines the groups. Every column in SELECT must either appear in GROUP BY or be wrapped in an aggregate function — otherwise the query is an error (or non-deterministic in older dialects).',
        'Use COALESCE(SUM(col), 0) when a LEFT JOIN can produce NULL groups so that missing values display as 0 rather than NULL.',
        'COUNT(*) counts rows (including NULLs). COUNT(col) counts non-NULL values of that column. COUNT(DISTINCT col) counts unique non-NULL values.',
      ],
    },
    {
      heading: 'HAVING vs WHERE',
      points: [
        'WHERE filters individual rows BEFORE aggregation. HAVING filters groups AFTER aggregation.',
        'Rule of thumb: if the condition references an aggregate function (SUM, COUNT, AVG…), it belongs in HAVING. If it references a raw column value, it belongs in WHERE.',
        'Filtering early in WHERE is cheaper: it reduces the row count before the GROUP BY, so the engine aggregates fewer rows. Move every non-aggregate filter to WHERE.',
        'HAVING without GROUP BY: applies to the single group formed by the whole table — rarely useful but valid.',
      ],
    },
    {
      heading: 'Conditional Aggregation',
      points: [
        'Pivot-style aggregation: collapse multiple rows into multiple columns based on a condition, all in one pass.',
        'MSSQL & PostgreSQL (universal): SUM(CASE WHEN status = \'Shipped\' THEN amount ELSE 0 END) AS shipped_revenue.',
        'PostgreSQL FILTER clause (cleaner): COUNT(*) FILTER (WHERE status = \'Active\') AS active_count. Readable, standard SQL:2003. Not available in MSSQL.',
        'Use conditional aggregation to pivot category breakdowns, day-of-week stats, or A/B test metrics without a separate PIVOT/UNPIVOT operation.',
      ],
    },
    {
      heading: 'Advanced Grouping: ROLLUP, CUBE, GROUPING SETS',
      points: [
        'ROLLUP(a, b): produces subtotals at each level — (a,b), then (a, all b), then grand total (all a, all b). The order of columns determines the hierarchy.',
        'CUBE(a, b): every combination — (a,b), (a,), (b), and (). n columns → 2ⁿ grouping sets. Useful for OLAP-style cross-tab analysis.',
        'GROUPING SETS: explicit control. GROUPING SETS((a,b), (a), ()  ) is equivalent to ROLLUP(a,b). Use it when you need an arbitrary subset of combinations.',
        'GROUPING(col): returns 1 when that column is part of a subtotal row (i.e., it is a rolled-up NULL), 0 when it is an actual group value. Use it to label "All" rows in reports.',
        'Both MSSQL and PostgreSQL support all three. Syntax is identical.',
      ],
    },
    {
      heading: 'Statistical and String Aggregates',
      points: [
        'STRING_AGG(col, separator): concatenates non-NULL values. Supported in MSSQL 2017+ and PostgreSQL 9.0+. Add ORDER BY inside: STRING_AGG(name, \',\') WITHIN GROUP (ORDER BY name).',
        'MSSQL pre-2017 equivalent: STUFF(FOR XML PATH) pattern — verbose but still seen in legacy code.',
        'PERCENTILE_CONT(fraction): interpolated percentile. PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) gives the median even if no row has exactly the median value.',
        'PERCENTILE_DISC(fraction): returns the nearest actual data value rather than an interpolation.',
        'PostgreSQL extras: ARRAY_AGG(col ORDER BY …) aggregates values into an array; json_agg(row) into a JSON array; mode() WITHIN GROUP (ORDER BY col) for the most frequent value. These have no direct MSSQL equivalents.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'GROUP BY & HAVING (both)',
      language: 'sql',
      code: `-- Works in both MSSQL and PostgreSQL

-- Basic aggregation: revenue and order count per category
SELECT
    c.category_name,
    COUNT(o.order_id)               AS order_count,
    SUM(ol.qty * ol.unit_price)     AS total_revenue,
    AVG(ol.unit_price)              AS avg_unit_price,
    MIN(o.order_date)               AS first_order,
    MAX(o.order_date)               AS last_order
FROM   categories c
JOIN   products   p  ON p.category_id  = c.category_id
JOIN   order_lines ol ON ol.product_id  = p.product_id
JOIN   orders     o  ON o.order_id     = ol.order_id
GROUP BY c.category_id, c.category_name
ORDER BY total_revenue DESC;

-- HAVING: only categories with more than 100 orders AND > 10 000 revenue
SELECT
    c.category_name,
    COUNT(o.order_id)           AS order_count,
    SUM(ol.qty * ol.unit_price) AS total_revenue
FROM   categories c
JOIN   products   p  ON p.category_id  = c.category_id
JOIN   order_lines ol ON ol.product_id  = p.product_id
JOIN   orders     o  ON o.order_id     = ol.order_id
WHERE  o.order_date >= '2024-01-01'      -- WHERE filters rows before GROUP BY
GROUP BY c.category_id, c.category_name
HAVING COUNT(o.order_id) > 100           -- HAVING filters groups after aggregation
   AND SUM(ol.qty * ol.unit_price) > 10000
ORDER BY total_revenue DESC;

-- COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col)
SELECT
    COUNT(*)                  AS total_rows,
    COUNT(customer_id)        AS non_null_customers,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(coupon_code)        AS orders_with_coupon   -- NULL rows skipped
FROM orders;`,
    },
    {
      label: 'Conditional agg (both + PG FILTER)',
      language: 'sql',
      code: `-- MSSQL and PostgreSQL: SUM(CASE WHEN …) conditional aggregation
SELECT
    category_name,
    SUM(CASE WHEN o.status = 'Shipped'   THEN ol.qty * ol.unit_price ELSE 0 END) AS shipped_revenue,
    SUM(CASE WHEN o.status = 'Pending'   THEN ol.qty * ol.unit_price ELSE 0 END) AS pending_revenue,
    SUM(CASE WHEN o.status = 'Cancelled' THEN 1 ELSE 0 END)                       AS cancelled_orders
FROM   categories c
JOIN   products   p  ON p.category_id = c.category_id
JOIN   order_lines ol ON ol.product_id = p.product_id
JOIN   orders     o  ON o.order_id    = ol.order_id
GROUP BY c.category_id, c.category_name;

-- PostgreSQL only: FILTER clause (cleaner, same result)
SELECT
    category_name,
    SUM(ol.qty * ol.unit_price) FILTER (WHERE o.status = 'Shipped')   AS shipped_revenue,
    SUM(ol.qty * ol.unit_price) FILTER (WHERE o.status = 'Pending')   AS pending_revenue,
    COUNT(*)                    FILTER (WHERE o.status = 'Cancelled')  AS cancelled_orders
FROM   categories c
JOIN   products   p  ON p.category_id = c.category_id
JOIN   order_lines ol ON ol.product_id = p.product_id
JOIN   orders     o  ON o.order_id    = ol.order_id
GROUP BY c.category_id, c.category_name;`,
    },
    {
      label: 'ROLLUP / CUBE / GROUPING SETS (both)',
      language: 'sql',
      code: `-- ROLLUP: totals per (year, quarter), per year, and grand total
SELECT
    YEAR(order_date)                AS yr,      -- MSSQL: YEAR()
    DATEPART(QUARTER, order_date)   AS qtr,     -- MSSQL: DATEPART()
    SUM(total_amount)               AS revenue,
    GROUPING(YEAR(order_date))      AS is_year_total,
    GROUPING(DATEPART(QUARTER, order_date)) AS is_grand_total
FROM  orders
GROUP BY ROLLUP(YEAR(order_date), DATEPART(QUARTER, order_date))
ORDER BY yr, qtr;

-- PostgreSQL equivalent (EXTRACT instead of YEAR/DATEPART):
SELECT
    EXTRACT(YEAR  FROM order_date)::int    AS yr,
    EXTRACT(QUARTER FROM order_date)::int  AS qtr,
    SUM(total_amount)                      AS revenue,
    GROUPING(EXTRACT(YEAR FROM order_date))    AS is_year_total,
    GROUPING(EXTRACT(QUARTER FROM order_date)) AS is_grand_total
FROM  orders
GROUP BY ROLLUP(
    EXTRACT(YEAR FROM order_date),
    EXTRACT(QUARTER FROM order_date)
)
ORDER BY yr NULLS LAST, qtr NULLS LAST;

-- GROUPING SETS: flexible — total per region AND total per product, not their cross-product
SELECT region, product_name, SUM(revenue) AS revenue
FROM   sales
GROUP BY GROUPING SETS(
    (region, product_name),   -- subtotal per region+product
    (region),                  -- subtotal per region only
    ()                         -- grand total
);`,
    },
    {
      label: 'STRING_AGG & percentiles (both)',
      language: 'sql',
      code: `-- STRING_AGG: comma-separated product names per category
-- MSSQL 2017+ and PostgreSQL 9.0+:
SELECT
    c.category_name,
    STRING_AGG(p.product_name, ', ') WITHIN GROUP (ORDER BY p.product_name) AS products
FROM   categories c
JOIN   products   p ON p.category_id = c.category_id
GROUP BY c.category_id, c.category_name;

-- MSSQL pre-2017 equivalent (legacy):
SELECT
    c.category_name,
    STUFF(
        (SELECT ', ' + p2.product_name
         FROM   products p2
         WHERE  p2.category_id = c.category_id
         ORDER BY p2.product_name
         FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'),
        1, 2, '') AS products
FROM categories c
GROUP BY c.category_id, c.category_name;

-- PERCENTILE_CONT: median salary per department (both dialects)
SELECT
    department,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY salary) AS p90_salary,
    PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary_disc
FROM   employees
GROUP BY department;

-- PostgreSQL extras: ARRAY_AGG, json_agg
SELECT
    category_id,
    ARRAY_AGG(product_name ORDER BY product_name)  AS name_array,
    json_agg(row_to_json(p))                        AS products_json
FROM products p
GROUP BY category_id;`,
    },
  ];

  challenge: Challenge = {
    title: 'Sales Dashboard Query',
    language: 'sql',
    description: 'Write a single query that returns, per salesperson (from an employees table), for the year 2024: total revenue, order count, their percentage share of overall 2024 revenue (rounded to 2 decimal places), and their revenue rank (1 = highest). Include only employees with at least 5 orders. Sort by revenue rank.',
    hints: [
      'Use a CTE or subquery to get the grand total once, then join it back to avoid repeating the aggregate',
      'Percentage share: revenue / grand_total * 100',
      'RANK() or DENSE_RANK() as a window function — or simply ORDER BY revenue DESC',
      'The "at least 5 orders" filter is a HAVING condition',
    ],
    starterCode: `-- Tables:
--   employees(employee_id, full_name, department)
--   orders(order_id, employee_id, order_date, total_amount)

WITH totals AS (
    SELECT
        employee_id,
        /* aggregates */
    FROM orders
    WHERE /* year filter */
    GROUP BY employee_id
    HAVING /* minimum orders */
),
grand AS (
    SELECT SUM(revenue) AS grand_total FROM totals
)
SELECT
    e.full_name,
    t.order_count,
    t.revenue,
    /* pct_share */
    /* rank */
FROM totals t
JOIN employees e ON e.employee_id = t.employee_id
CROSS JOIN grand
ORDER BY /* rank */;`,
    solution: `-- PostgreSQL:
WITH totals AS (
    SELECT
        employee_id,
        COUNT(*)           AS order_count,
        SUM(total_amount)  AS revenue
    FROM   orders
    WHERE  EXTRACT(YEAR FROM order_date) = 2024
    GROUP  BY employee_id
    HAVING COUNT(*) >= 5
),
grand AS (
    SELECT SUM(revenue) AS grand_total FROM totals
)
SELECT
    e.full_name,
    t.order_count,
    ROUND(t.revenue, 2)                                        AS revenue,
    ROUND(t.revenue / g.grand_total * 100, 2)                 AS pct_share,
    RANK() OVER (ORDER BY t.revenue DESC)                     AS revenue_rank
FROM   totals      t
JOIN   employees   e ON e.employee_id = t.employee_id
CROSS JOIN grand  g
ORDER BY revenue_rank;

-- MSSQL equivalent (YEAR() instead of EXTRACT, no NULLS LAST):
WITH totals AS (
    SELECT
        employee_id,
        COUNT(*)           AS order_count,
        SUM(total_amount)  AS revenue
    FROM   orders
    WHERE  YEAR(order_date) = 2024
    GROUP  BY employee_id
    HAVING COUNT(*) >= 5
),
grand AS (
    SELECT SUM(revenue) AS grand_total FROM totals
)
SELECT
    e.full_name,
    t.order_count,
    ROUND(t.revenue, 2)                                        AS revenue,
    ROUND(t.revenue / g.grand_total * 100, 2)                 AS pct_share,
    RANK() OVER (ORDER BY t.revenue DESC)                     AS revenue_rank
FROM   totals      t
JOIN   employees   e ON e.employee_id = t.employee_id
CROSS JOIN grand  g
ORDER BY revenue_rank;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A query has: SELECT region, SUM(amount) FROM sales WHERE SUM(amount) > 5000 GROUP BY region. What is wrong?',
      options: [
        'SUM(amount) cannot appear in a SELECT list',
        'WHERE cannot reference aggregate functions — use HAVING instead',
        'GROUP BY must come before WHERE',
        'SUM requires an ORDER BY clause',
      ],
      answer: 1,
      explanation: 'WHERE is evaluated before GROUP BY and aggregation, so aggregate functions are not yet computed at that point. Move the condition to HAVING: GROUP BY region HAVING SUM(amount) > 5000.',
    },
    {
      q: 'You have 10 rows where salary is NULL. What does AVG(salary) return for this group?',
      options: [
        '0',
        'NULL',
        'An error',
        'The average of all other rows, excluding the NULL rows',
      ],
      answer: 3,
      explanation: 'All aggregate functions (AVG, SUM, MIN, MAX, COUNT(col)) silently ignore NULL values. AVG(salary) computes the average of non-NULL salary values. If ALL values are NULL, then AVG returns NULL.',
    },
    {
      q: 'Which statement about ROLLUP(year, quarter) is correct?',
      options: [
        'It produces one group per (year, quarter) pair only',
        'It produces (year, quarter) groups, (year) subtotals, and a grand total',
        'It produces every combination of year and quarter, including (quarter) alone',
        'It is identical to CUBE(year, quarter)',
      ],
      answer: 1,
      explanation: 'ROLLUP follows the column hierarchy from left to right: (year, quarter), then (year, ALL quarters), then (ALL years, ALL quarters — the grand total). CUBE would additionally produce (ALL years, quarter) groups, which ROLLUP does not.',
    },
    {
      q: 'COUNT(*) vs COUNT(customer_id) — when do they differ?',
      options: [
        'They always return the same value',
        'COUNT(*) is slower because it counts all columns',
        'COUNT(customer_id) skips rows where customer_id IS NULL; COUNT(*) counts every row',
        'COUNT(*) counts distinct values; COUNT(col) counts all values',
      ],
      answer: 2,
      explanation: 'COUNT(*) counts every row in the group regardless of NULL values. COUNT(col) counts only rows where col is NOT NULL. If customer_id is nullable and some rows have NULL, COUNT(customer_id) < COUNT(*).',
    },
    {
      q: 'The FILTER clause in PostgreSQL (e.g. COUNT(*) FILTER (WHERE status=\'Active\')) is equivalent to which MSSQL pattern?',
      options: [
        'WHERE status = \'Active\'',
        'HAVING status = \'Active\'',
        'SUM(CASE WHEN status = \'Active\' THEN 1 ELSE 0 END)',
        'PIVOT(COUNT(*) FOR status IN (\'Active\'))',
      ],
      answer: 2,
      explanation: 'FILTER is a per-aggregate conditional. The MSSQL equivalent is SUM(CASE WHEN status = \'Active\' THEN 1 ELSE 0 END) or COUNT(CASE WHEN status = \'Active\' THEN 1 END). Both compute conditional aggregation in a single pass.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does my LEFT JOIN + GROUP BY return unexpected NULL totals?',
      a: 'When a LEFT JOIN finds no matching rows on the right side, all right-side columns are NULL. Aggregate functions like SUM() then return NULL for those groups (because there are no non-NULL values to sum). Fix with COALESCE: COALESCE(SUM(amount), 0). The same applies to AVG, MIN, and MAX. COUNT(*) always returns 0 or more — it never returns NULL even for empty groups.',
    },
    {
      q: 'When should I use ROLLUP vs GROUPING SETS?',
      a: 'ROLLUP is a shorthand when your grouping dimensions form a strict hierarchy (e.g., year → quarter → month). It always produces subtotals from right to left in the column list, plus a grand total. Use GROUPING SETS when you need an arbitrary subset of combinations — for example, subtotals by region AND by product but NOT by (region, product). GROUPING SETS gives you full control over which groups appear. CUBE generates all 2ⁿ combinations, useful for full cross-tab analysis but explosive for many columns.',
    },
    {
      q: 'How do I compute a median in MSSQL and PostgreSQL?',
      a: 'Both support PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col): SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) FROM employees. PERCENTILE_CONT returns an interpolated value (may not be an actual data point). PERCENTILE_DISC(0.5) returns the nearest actual value. These are ordered-set aggregate functions — they have no GROUP BY requirement and can be combined with GROUP BY to get per-group medians. Both MSSQL (2012+) and PostgreSQL (9.4+) support them.',
    },
  ];
}
