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
  selector: 'app-sql-conditional-expressions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './conditional-expressions.html',
  styleUrl: './conditional-expressions.scss',
})
export class SqlConditionalExpressions {

  quickRef: QuickRefItem[] = [
    { name: 'CASE WHEN … THEN … END',     type: 'syntax',   desc: 'Searched CASE: evaluates each WHEN condition; returns first THEN whose condition is TRUE.' },
    { name: 'CASE col WHEN val THEN … END', type: 'syntax', desc: 'Simple CASE: compares col to each WHEN value; like a switch statement.' },
    { name: 'ELSE',                        type: 'keyword',  desc: 'Default value when no WHEN branch matches. If omitted and nothing matches, returns NULL.' },
    { name: 'IIF(cond, true_val, false_val)', type: 'function', desc: 'MSSQL shorthand for a two-branch CASE. Not available in PostgreSQL.' },
    { name: 'NULLIF(a, b)',               type: 'function',  desc: 'Returns NULL when a = b; otherwise returns a. Prevents divide-by-zero.' },
    { name: 'COALESCE(a, b, …)',          type: 'function',  desc: 'Returns the first non-NULL. Equivalent to a CASE WHEN chain.' },
    { name: 'GREATEST(a, b, …)',          type: 'function',  desc: 'Returns the largest non-NULL value. PostgreSQL and MSSQL 2022+.' },
    { name: 'LEAST(a, b, …)',             type: 'function',  desc: 'Returns the smallest non-NULL value. PostgreSQL and MSSQL 2022+.' },
    { name: 'CHOOSE(n, val1, val2, …)',   type: 'function',  desc: 'MSSQL: returns the nth item from a list (1-based). Not in PostgreSQL.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Searched CASE vs simple CASE',
      points: [
        'Searched CASE: CASE WHEN condition1 THEN result1 WHEN condition2 THEN result2 ELSE default END. Each WHEN has a full Boolean expression. The first TRUE branch wins.',
        'Simple CASE: CASE expression WHEN value1 THEN result1 WHEN value2 THEN result2 ELSE default END. Compares one expression to a list of values — like a switch statement. Simpler but less flexible.',
        'CASE is an expression, not a statement — it returns a value and can be used anywhere an expression is valid: SELECT, WHERE, ORDER BY, GROUP BY, aggregate functions, and as function arguments.',
        'If no WHEN matches and there is no ELSE clause, the CASE returns NULL. Always include ELSE when the caller cannot handle NULL.',
      ],
    },
    {
      heading: 'CASE in aggregates — conditional counts and sums',
      points: [
        'A common pattern is using CASE inside SUM or COUNT to get conditional totals in a single query: SUM(CASE WHEN status = \'shipped\' THEN 1 ELSE 0 END) AS shipped_count.',
        'PostgreSQL supports a cleaner syntax with the FILTER clause: COUNT(*) FILTER (WHERE status = \'shipped\'). This is equivalent to the CASE approach but more readable.',
        'This pivoting technique replaces multiple separate queries or subqueries — one pass through the table produces multiple conditional aggregations.',
      ],
    },
    {
      heading: 'IIF — two-branch shorthand (MSSQL)',
      points: [
        'IIF(condition, true_value, false_value) is syntactic sugar for CASE WHEN condition THEN true_value ELSE false_value END.',
        'IIF is MSSQL-only (SQL Server 2012+). PostgreSQL does not have IIF — use CASE or a custom function.',
        'Like CASE, IIF returns a value and short-circuits — the false branch is not evaluated when the condition is true, which matters for functions with side effects.',
      ],
    },
    {
      heading: 'NULLIF and division by zero',
      points: [
        'NULLIF(a, b) returns NULL when a equals b. The primary use case: NULLIF(denominator, 0) prevents a division-by-zero error. Dividing by NULL returns NULL rather than raising an error.',
        'COALESCE can be chained after NULLIF to substitute a default: COALESCE(numerator / NULLIF(denominator, 0), 0) returns 0 instead of NULL when the denominator is zero.',
        'NULLIF is also useful for treating sentinel values as NULL: NULLIF(status, \'N/A\') returns NULL when status is \'N/A\', letting aggregates ignore it.',
      ],
    },
    {
      heading: 'GREATEST, LEAST, CHOOSE',
      points: [
        'GREATEST(a, b, c, …) and LEAST(a, b, c, …) return the maximum or minimum of their arguments, ignoring NULLs. Available in PostgreSQL natively; MSSQL added them in SQL Server 2022.',
        'For MSSQL before 2022, simulate with: CASE WHEN a >= b THEN a ELSE b END for two values, or use a VALUES subquery with MAX/MIN.',
        'CHOOSE(n, v1, v2, …) is MSSQL-only — returns the nth value from a list. Example: CHOOSE(MONTH(date), \'Jan\',\'Feb\',…,\'Dec\') converts a month number to a name.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Searched & simple CASE',
      language: 'sql',
      code: `-- Searched CASE: full conditions
SELECT
    order_id,
    total,
    CASE
        WHEN total >= 1000 THEN 'Large'
        WHEN total >= 100  THEN 'Medium'
        WHEN total > 0     THEN 'Small'
        ELSE 'Zero or NULL'
    END AS order_size
FROM orders;

-- Simple CASE: value comparison (switch)
SELECT
    status,
    CASE status
        WHEN 'P' THEN 'Pending'
        WHEN 'S' THEN 'Shipped'
        WHEN 'D' THEN 'Delivered'
        WHEN 'C' THEN 'Cancelled'
        ELSE 'Unknown'
    END AS status_label
FROM orders;`,
    },
    {
      label: 'CASE in aggregates',
      language: 'sql',
      code: `-- Conditional counts in one pass (both dialects)
SELECT
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*)                              AS total_orders,
    SUM(CASE WHEN status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,
    SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN status = 'shipped'   THEN total ELSE 0 END) AS shipped_revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

-- PostgreSQL FILTER clause (cleaner equivalent)
SELECT
    COUNT(*) FILTER (WHERE status = 'shipped')   AS shipped,
    COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
    SUM(total) FILTER (WHERE status = 'shipped') AS shipped_revenue
FROM orders;`,
    },
    {
      label: 'IIF (MSSQL) & NULLIF',
      language: 'sql',
      code: `-- MSSQL: IIF
SELECT
    product_id,
    stock,
    IIF(stock > 0, 'In Stock', 'Out of Stock') AS availability,
    IIF(price > 100, price * 0.9, price)       AS sale_price
FROM products;

-- NULLIF: prevent division by zero (both dialects)
SELECT
    department,
    total_salary,
    headcount,
    total_salary / NULLIF(headcount, 0)              AS avg_salary,
    COALESCE(total_salary / NULLIF(headcount, 0), 0) AS avg_salary_default_0
FROM department_payroll;

-- NULLIF as sentinel filter
SELECT AVG(score)
FROM results
WHERE NULLIF(score, -1) IS NOT NULL;  -- treat -1 as "no data"`,
    },
    {
      label: 'CASE in ORDER BY and WHERE',
      language: 'sql',
      code: `-- Dynamic sort order with CASE in ORDER BY
SELECT * FROM products
ORDER BY
    CASE WHEN category = 'Featured' THEN 0 ELSE 1 END,  -- Featured first
    name;

-- Conditional filtering with CASE
-- (useful when filter depends on a parameter)
SELECT * FROM orders
WHERE
    CASE
        WHEN @status = 'all'  THEN 1
        WHEN status = @status THEN 1
        ELSE 0
    END = 1;

-- MSSQL version with IIF
SELECT * FROM orders
WHERE IIF(@status = 'all', 1, IIF(status = @status, 1, 0)) = 1;`,
    },
    {
      label: 'GREATEST / LEAST / CHOOSE',
      language: 'sql',
      code: `-- PostgreSQL: GREATEST / LEAST
SELECT
    GREATEST(price, min_price, 0.01)      AS effective_price,
    LEAST(discount, max_discount, price)  AS capped_discount
FROM products;

-- MSSQL 2022+: same functions available
SELECT
    GREATEST(price, min_price, 0.01)      AS effective_price,
    LEAST(discount, max_discount, price)  AS capped_discount
FROM products;

-- MSSQL <2022: simulate GREATEST with CASE
SELECT
    CASE WHEN price >= min_price THEN price ELSE min_price END AS effective_price
FROM products;

-- MSSQL CHOOSE: convert month number to abbreviated name
SELECT
    CHOOSE(MONTH(order_date), 'Jan','Feb','Mar','Apr','May','Jun',
           'Jul','Aug','Sep','Oct','Nov','Dec') AS month_name
FROM orders;`,
    },
  ];

  challenge: Challenge = {
    title: 'Order status dashboard pivot',
    language: 'sql',
    description: `Given: orders(id, customer_id, status VARCHAR, total DECIMAL, order_date DATE)
Status values: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'

Write a single query that returns per-month statistics:
- month: year-month label (e.g. '2024-03')
- pending_count, processing_count, shipped_count, delivered_count, cancelled_count
- fulfilment_rate: percentage of orders that are 'delivered' (0 decimal places)

Write for PostgreSQL.`,
    hints: [
      'Use SUM(CASE WHEN status = \'x\' THEN 1 ELSE 0 END) for each status',
      "TO_CHAR(order_date, 'YYYY-MM') for the month label",
      'ROUND(delivered_count * 100.0 / total_orders) for rate',
    ],
    starterCode: `SELECT
    -- month
    -- pending_count, processing_count, ...
    -- fulfilment_rate
FROM orders
GROUP BY -- month
ORDER BY -- month;`,
    solution: `SELECT
    TO_CHAR(order_date, 'YYYY-MM') AS month,
    SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
    SUM(CASE WHEN status = 'shipped'    THEN 1 ELSE 0 END) AS shipped_count,
    SUM(CASE WHEN status = 'delivered'  THEN 1 ELSE 0 END) AS delivered_count,
    SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled_count,
    ROUND(
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0)
    ) AS fulfilment_rate
FROM orders
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY month;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does a CASE expression return when no WHEN matches and there is no ELSE?',
      options: ['0', 'An error', 'NULL', 'FALSE'],
      answer: 2,
      explanation: 'If no WHEN condition matches and ELSE is omitted, CASE returns NULL. Always include ELSE to avoid unexpected NULLs in your result.',
    },
    {
      q: 'Where can a CASE expression appear in a SQL query?',
      options: [
        'Only in the SELECT list',
        'Only in WHERE and HAVING',
        'Anywhere an expression is valid: SELECT, WHERE, ORDER BY, GROUP BY, inside aggregates',
        'Only as a standalone statement',
      ],
      answer: 2,
      explanation: 'CASE is an expression, not a statement. It can be used wherever a value expression is expected — SELECT, WHERE, ORDER BY, GROUP BY, inside SUM/COUNT, etc.',
    },
    {
      q: 'What is the result of NULLIF(quantity, 0) when quantity = 5?',
      options: ['NULL', '0', '5', 'Error'],
      answer: 2,
      explanation: 'NULLIF returns NULL only when the two arguments are equal. When quantity = 5 and the second argument is 0, they are not equal, so NULLIF returns 5.',
    },
    {
      q: 'Which is the PostgreSQL alternative to MSSQL\'s IIF()?',
      options: [
        'IF()',
        'DECODE()',
        'CASE WHEN condition THEN t ELSE f END',
        'SWITCH()',
      ],
      answer: 2,
      explanation: 'PostgreSQL has no IIF function. Use CASE WHEN cond THEN t ELSE f END. IIF is MSSQL-only shorthand for a two-branch CASE.',
    },
    {
      q: 'In PostgreSQL, what does COUNT(*) FILTER (WHERE status = \'shipped\') do?',
      options: [
        'Counts all rows then subtracts non-shipped rows',
        'Equivalent to SUM(CASE WHEN status=\'shipped\' THEN 1 ELSE 0 END)',
        'Requires a WHERE clause on the outer query',
        'Only works in HAVING, not SELECT',
      ],
      answer: 1,
      explanation: "FILTER (WHERE …) is a PostgreSQL extension that applies a condition within an aggregate. It's cleaner than the CASE-inside-SUM pattern and produces the same result.",
    },
    {
      q: 'What is the difference between COALESCE and ISNULL in MSSQL for performance?',
      options: [
        'COALESCE is always slower because it evaluates all arguments even when the first is non-NULL',
        'ISNULL is a T-SQL function that takes exactly 2 args and is sometimes inlined more efficiently by the optimizer; COALESCE is ANSI SQL and always evaluates args lazily',
        'ISNULL converts the second argument to the type of the first; COALESCE returns the widest compatible type',
        'They are identical in all respects'
      ],
      answer: 2,
      explanation: 'ISNULL(x, y) uses the data type of x (truncating y if necessary). COALESCE(x, y) returns the highest-precedence type from all arguments. This matters for string lengths: ISNULL(CAST(NULL AS VARCHAR(5)), \'default\') returns VARCHAR(5), potentially truncating \'default\'.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use CASE to avoid multiple passes through a table?',
      a: 'Yes — this is one of the most important uses of CASE. Instead of running three separate queries for three status counts, use SUM(CASE WHEN status=\'x\' THEN 1 ELSE 0 END) three times in one query. One table scan, three conditional counts.',
    },
    {
      q: 'Is CASE evaluated lazily (short-circuit)?',
      a: 'SQL does not guarantee short-circuit evaluation of CASE branches, but most engines do it in practice. Do not rely on it for side effects. However, division-by-zero protection with NULLIF in the WHEN condition is safe — if you write WHEN denominator <> 0 THEN numerator/denominator, most engines will not evaluate the THEN on matching ELSE rows.',
    },
    {
      q: 'How do I use CASE for dynamic column ordering?',
      a: 'Use CASE in the ORDER BY clause: ORDER BY CASE WHEN @sort = \'name\' THEN name END, CASE WHEN @sort = \'date\' THEN order_date END. Each CASE returns a value for that column; unmatched branches return NULL and sort last. This enables parameter-driven sorting without dynamic SQL.',
    },
    {
      q: 'Can I use CASE inside a GROUP BY clause?',
      a: 'Yes — GROUP BY CASE WHEN amount < 100 THEN \'small\' WHEN amount < 1000 THEN \'medium\' ELSE \'large\' END groups rows into buckets. The expression in GROUP BY must exactly match the one in SELECT. In PostgreSQL you can reference a SELECT alias in GROUP BY; MSSQL requires repeating the full expression.',
    },
    {
      q: 'How do I handle complex nested CASE expressions readably?',
      a: 'Break deeply nested CASE into a CTE or subquery that computes intermediate values. For example: WITH category AS (SELECT id, CASE status WHEN \'A\' THEN \'active\' ELSE \'inactive\' END AS cat FROM orders) SELECT … CASE WHEN cat = \'active\' AND amount > 100 THEN \'priority\' … END FROM category. This keeps each CASE to a single level and makes the logic auditable.',
    },
    {
      q: 'When is IIF() preferable to CASE WHEN in MSSQL?',
      a: 'IIF(condition, true_val, false_val) is syntactic sugar for a two-branch CASE — it is slightly shorter when you only need one TRUE/FALSE branch and no ELSE. Both compile to the same plan. IIF is T-SQL-specific; use CASE WHEN for portable code. Avoid nesting IIF() — it becomes unreadable; use CASE for multi-branch logic.',
    },
  ];
}
