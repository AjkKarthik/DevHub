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
    { name: 'GROUPING(col)',         type: 'function', desc: 'Returns 1 if col is a rolled-up (subtotal) NULL in a ROLLUP/CUBE result; 0 if it is an actual group value.' },
    { name: 'PERCENTILE_CONT/DISC', type: 'function', desc: 'Ordered-set aggregates. PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY val) = median. Both dialects.' },
    { name: 'ARRAY_AGG (PG)',        type: 'function', desc: 'PostgreSQL: aggregates values into a PostgreSQL array. ARRAY_AGG(name ORDER BY name).' },
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
        'HAVING without GROUP BY: applies to the single group formed by the whole table. Rarely useful, but valid — for example <code>HAVING COUNT(*) > 0</code> on a bare table would always return one row if the table is non-empty.',
        'SELECT aliases are NOT available in HAVING (HAVING is evaluated before SELECT). Use the full expression: <code>HAVING SUM(amount) > 5000</code> rather than <code>HAVING revenue > 5000</code> unless your dialect explicitly supports alias references in HAVING (PostgreSQL does; MSSQL generally does not).',
      ],
    },
    {
      heading: 'Conditional Aggregation',
      points: [
        'Pivot-style aggregation: collapse multiple rows into multiple columns based on a condition, all in one pass.',
        'MSSQL & PostgreSQL (universal): SUM(CASE WHEN status = \'Shipped\' THEN amount ELSE 0 END) AS shipped_revenue.',
        'PostgreSQL FILTER clause (cleaner): COUNT(*) FILTER (WHERE status = \'Active\') AS active_count. Readable, standard SQL:2003. Not available in MSSQL.',
        'Use conditional aggregation to pivot category breakdowns, day-of-week stats, or A/B test metrics without a separate PIVOT/UNPIVOT operation.',
        'NULL handling in CASE WHEN: <code>SUM(CASE WHEN condition THEN col END)</code> (no ELSE) is equivalent to <code>SUM(CASE WHEN condition THEN col ELSE NULL END)</code> — the NULL is ignored by SUM. This is correct when you want to sum only matching rows. Use ELSE 0 only when a missing value should contribute 0 to the total (e.g. counting flags), not when summing amounts.',
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
    {
      heading: 'Aggregate performance — covering indexes, hash vs sort aggregate',
      points: [
        'The query planner can execute GROUP BY using two algorithms: <strong>Hash Aggregate</strong> (build an in-memory hash table keyed on the GROUP BY columns) or <strong>Sort Aggregate</strong> (sort the input first, then scan for group boundaries). Hash Aggregate is generally faster for unsorted inputs; Sort Aggregate is chosen when the input is already ordered on the GROUP BY keys (e.g., a clustered index scan).',
        '<strong>Covering index for GROUP BY</strong>: if the GROUP BY columns and all aggregated columns fit in a single non-clustered index, the engine can do an index-only scan rather than fetching data pages. Example: <code>CREATE INDEX ix_orders_emp_date_amt ON orders(employee_id, order_date) INCLUDE (total_amount)</code> — a query grouping by employee_id and filtering by order_date can satisfy GROUP BY entirely from the index.',
        '<strong>COUNT(DISTINCT col) is expensive</strong>: it cannot be computed in a simple one-pass hash aggregate — the engine must track all distinct values per group. For large tables, consider an approximation (<code>HLL</code> extension in PG, or pre-aggregate unique values in a CTE) or restructure the query to use a subquery that deduplicates first.',
        '<strong>Pre-aggregate in CTEs</strong> to avoid redundant computation. If you need total revenue per employee AND the grand total, compute the employee totals once in a CTE, then derive the grand total from the CTE using a second aggregation — never compute the raw join + aggregate twice in separate subqueries.',
        '<strong>Avoiding accidental full-table aggregation</strong>: a query with no WHERE clause and a GROUP BY on a low-cardinality column (e.g., status with 3 values) will scan the entire table. For dashboards, consider a materialized view (PG) or indexed view (MSSQL) that pre-computes common aggregations and is incrementally maintained by the engine.',
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
GROUP BY c.category_id, c.category_name;

-- NULL in CASE WHEN — SUM without ELSE ignores non-matching rows
-- Use ELSE 0 for counting flags, no ELSE for summing amounts:
SELECT
    COUNT(CASE WHEN status = 'Active' THEN 1 END)      AS active_count,  -- no ELSE
    SUM(CASE WHEN status = 'Active' THEN amount END)   AS active_revenue, -- no ELSE, not ELSE 0
    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_flag     -- ELSE 0 for counting
FROM orders;`,
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
    {
      label: 'Pre-aggregate CTE pattern',
      language: 'sql',
      code: `-- ── Anti-pattern: computing the join+aggregate twice ────────────────────
-- WRONG: expensive — two separate full scans + joins
SELECT
    e.full_name,
    t.revenue,
    t.revenue / (SELECT SUM(total_amount) FROM orders WHERE YEAR(order_date) = 2024)
        AS pct_share
FROM employees e
JOIN (
    SELECT employee_id, SUM(total_amount) AS revenue
    FROM   orders WHERE YEAR(order_date) = 2024
    GROUP  BY employee_id
) t ON t.employee_id = e.employee_id;

-- ── Correct: aggregate once in a CTE, derive grand total from it ─────────
WITH emp_totals AS (
    SELECT
        employee_id,
        COUNT(*)          AS order_count,
        SUM(total_amount) AS revenue
    FROM   orders
    WHERE  YEAR(order_date) = 2024   -- MSSQL; use EXTRACT(YEAR FROM …) for PG
    GROUP  BY employee_id
    HAVING COUNT(*) >= 5
),
grand_total AS (
    SELECT SUM(revenue) AS total FROM emp_totals  -- derived from CTE, not raw table
)
SELECT
    e.full_name,
    et.order_count,
    ROUND(et.revenue, 2)                       AS revenue,
    ROUND(et.revenue / gt.total * 100, 2)      AS pct_share,
    RANK() OVER (ORDER BY et.revenue DESC)     AS revenue_rank
FROM   emp_totals  et
JOIN   employees   e  ON e.employee_id = et.employee_id
CROSS JOIN grand_total gt
ORDER BY revenue_rank;

-- ── Covering index for GROUP BY (add INCLUDE for aggregated columns) ─────
-- Without: GROUP BY employee_id hits the clustered table for each row
-- With: GROUP BY employee_id can be satisfied entirely from the index
CREATE INDEX IX_Orders_Emp_Date
    ON orders(employee_id, order_date)
    INCLUDE (total_amount);     -- MSSQL syntax; PG: CREATE INDEX ... INCLUDE (total_amount)`,
    },
    {
      label: 'Aggregate diagnostics & GROUPING()',
      language: 'sql',
      code: `-- ── GROUPING() to label subtotal rows in ROLLUP output ──────────────────
-- Both MSSQL and PostgreSQL:
SELECT
    CASE WHEN GROUPING(region) = 1 THEN 'ALL REGIONS' ELSE region END   AS region,
    CASE WHEN GROUPING(status)  = 1 THEN 'ALL STATUSES' ELSE status END AS status,
    COUNT(*)          AS order_count,
    SUM(total_amount) AS revenue
FROM orders
GROUP BY ROLLUP(region, status)
ORDER BY region, status;
-- Rows where GROUPING(region)=1 are the per-status-all-regions subtotal
-- Rows where both GROUPING()=1 are the grand total

-- ── COUNT(DISTINCT) performance comparison (PostgreSQL) ──────────────────
-- Slow: COUNT(DISTINCT) requires tracking all values per group
EXPLAIN (ANALYZE, BUFFERS)
SELECT category_id, COUNT(DISTINCT customer_id) AS unique_customers
FROM   orders
GROUP BY category_id;

-- Fast alternative: pre-deduplicate in a CTE, then count
WITH deduped AS (
    SELECT DISTINCT category_id, customer_id
    FROM   orders o
    JOIN   order_lines ol ON ol.order_id  = o.order_id
    JOIN   products    p  ON p.product_id = ol.product_id
)
SELECT category_id, COUNT(*) AS unique_customers
FROM   deduped
GROUP BY category_id;

-- ── MSSQL: check hash aggregate vs sort aggregate in execution plan ───────
-- Look for "Hash Match (Aggregate)" vs "Sort" + "Stream Aggregate" in the plan:
SET STATISTICS IO ON;
SELECT employee_id, SUM(total_amount) AS revenue
FROM   orders
WHERE  order_date >= '2024-01-01'
GROUP  BY employee_id
ORDER  BY revenue DESC;
SET STATISTICS IO OFF;
-- Hash Aggregate: no pre-sort needed — typically faster for low-cardinality GROUP BY
-- Stream Aggregate: requires sorted input — used when clustered index provides order`,
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
    {
      q: 'GROUPING(col) returns 1 in a ROLLUP result row. What does that mean?',
      options: [
        'The column has a NULL data value in the source table',
        'That column is "rolled up" — this row is a subtotal or grand total where col is aggregated across all its values',
        'The GROUP BY clause is missing the column',
        'The column contains duplicate values',
      ],
      answer: 1,
      explanation: 'GROUPING(col) = 1 means this row is a subtotal row where col is not broken out — i.e., the NULL in that column is a "rolled-up" NULL generated by ROLLUP/CUBE, not a NULL data value. Use it to reliably distinguish subtotal rows from rows where the actual data value happens to be NULL.',
    },
    {
      q: 'What is the difference between PERCENTILE_CONT(0.5) and PERCENTILE_DISC(0.5)?',
      options: [
        'PERCENTILE_CONT is faster; PERCENTILE_DISC is more accurate',
        'PERCENTILE_CONT returns an interpolated value (may not exist in the data); PERCENTILE_DISC returns the nearest actual data row value',
        'PERCENTILE_DISC works only in PostgreSQL; PERCENTILE_CONT works in both dialects',
        'They are identical for numeric columns',
      ],
      answer: 1,
      explanation: 'PERCENTILE_CONT uses linear interpolation — for an even number of values, the median might be the average of the two middle values (not necessarily present in the data). PERCENTILE_DISC returns the smallest value in the ordered set whose cumulative distribution is ≥ the specified fraction — always an actual data point. Use CONT for statistical medians, DISC when you need a real row value.',
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
    {
      q: 'Can I use a SELECT alias in GROUP BY or HAVING?',
      a: 'It depends on the dialect. <strong>PostgreSQL</strong> allows SELECT aliases in GROUP BY (evaluated after GROUP BY internally resolves them) — so <code>SELECT price * 1.2 AS taxed_price … GROUP BY taxed_price</code> works. <strong>MSSQL</strong> does NOT allow aliases in GROUP BY — you must repeat the expression: <code>GROUP BY price * 1.2</code>. For HAVING: PostgreSQL allows aliases; MSSQL does not. Cross-platform safe practice: always repeat the expression in GROUP BY and HAVING rather than using an alias. Alternatively, wrap the query in a CTE or subquery so the alias is visible in the outer query\'s WHERE.',
    },
    {
      q: 'Why is COUNT(DISTINCT col) slow and what can I do about it?',
      a: 'COUNT(DISTINCT col) forces the engine to track all distinct values seen per group, which requires either sorting the values or building a hash set of them — both are more expensive than a simple count. For large tables, alternatives: (1) <strong>Pre-deduplicate in a CTE</strong>: <code>WITH d AS (SELECT DISTINCT group_col, counted_col FROM t) SELECT group_col, COUNT(*) FROM d GROUP BY group_col</code> — gives the optimizer more flexibility. (2) <strong>HyperLogLog approximation</strong> (PostgreSQL extension): gives an approximate distinct count in O(1) space per group — accurate within ~1-2%, fast enough for dashboards. (3) For MSSQL: check if a pre-aggregated indexed view can serve the query. Avoid COUNT(DISTINCT) inside ROLLUP — it is especially expensive there.',
    },
    {
      q: 'What is the difference between SUM(CASE WHEN cond THEN col END) and SUM(CASE WHEN cond THEN col ELSE 0 END)?',
      a: 'When the condition is false, the ELSE-less version returns NULL for that row, which SUM ignores — so only matching rows contribute to the total. The ELSE 0 version contributes 0 for non-matching rows. For revenue/amount sums, both produce the same result. The distinction matters for averaging: <code>AVG(CASE WHEN cond THEN col END)</code> averages only matching rows (denominator = count of matching rows), while <code>AVG(CASE WHEN cond THEN col ELSE 0 END)</code> averages all rows with 0 for non-matches (denominator = total row count, result is smaller). Use no-ELSE for "sum/avg of the subset", use ELSE 0 for "count or flag across all rows".',
    },
    {
      q: 'When should I use a materialized view instead of a GROUP BY query?',
      a: 'Consider a materialized view (PostgreSQL) or indexed view (MSSQL) when: (1) the aggregation is over a very large table and the query runs frequently; (2) the underlying data changes infrequently relative to how often the aggregate is read; (3) the GROUP BY columns and aggregate functions are well-defined and stable. PostgreSQL materialized views require manual or scheduled <code>REFRESH MATERIALIZED VIEW</code> — they are not auto-updated. MSSQL indexed views are auto-maintained by the engine on every write (with some restrictions: no outer joins, no subqueries, specific WITH SCHEMABINDING requirement). Trade-off: write overhead to maintain the pre-computed aggregate vs read speed. For real-time dashboards with high write rates, materialized views can become a write bottleneck.',
    },
  ];
}
