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
  selector: 'app-sql-basics',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './basics.html',
  styleUrl: './basics.scss',
})
export class SqlBasics {

  quickRef: QuickRefItem[] = [
    { name: 'SELECT',              type: 'keyword',   desc: 'Specifies which columns to return. * means all columns. Evaluated after FROM/WHERE/GROUP BY.' },
    { name: 'FROM',                type: 'keyword',   desc: 'Specifies the source table, view, or subquery.' },
    { name: 'WHERE',               type: 'keyword',   desc: 'Filters rows before aggregation. Uses Boolean predicates. Runs before SELECT — aliases not yet available.' },
    { name: 'ORDER BY',            type: 'keyword',   desc: 'Sorts result set. ASC (default) or DESC. Multiple columns allowed. NULLS FIRST/LAST (PG).' },
    { name: 'DISTINCT',            type: 'keyword',   desc: 'Removes duplicate rows from the result set after SELECT. Not the same as GROUP BY.' },
    { name: 'TOP n (MSSQL)',       type: 'keyword',   desc: 'Returns first n rows. SELECT TOP 10 … FROM … Requires ORDER BY for deterministic results.' },
    { name: 'LIMIT n (PG)',        type: 'keyword',   desc: 'PostgreSQL: limits rows returned. SELECT … FROM … LIMIT 10 OFFSET 20.' },
    { name: 'OFFSET…FETCH (MSSQL)',type: 'keyword',   desc: 'MSSQL paging: ORDER BY col OFFSET n ROWS FETCH NEXT m ROWS ONLY. ANSI standard.' },
    { name: 'LIKE',                type: 'operator',  desc: 'Pattern match: % = zero or more chars, _ = exactly one char. Leading % = full scan.' },
    { name: 'ILIKE (PG)',          type: 'operator',  desc: 'Case-insensitive LIKE. PostgreSQL only. MSSQL: use CI collation or LOWER().' },
    { name: 'IN',                  type: 'operator',  desc: 'Tests membership in a list or subquery. Equivalent to multiple ORs. Avoid NOT IN if subquery can return NULL.' },
    { name: 'BETWEEN',             type: 'operator',  desc: 'Inclusive range: col BETWEEN a AND b ≡ col >= a AND col <= b.' },
    { name: 'IS NULL / IS NOT NULL', type: 'operator', desc: 'The only correct way to test for NULL. col = NULL always returns UNKNOWN (never TRUE).' },
    { name: 'EXISTS',              type: 'operator',  desc: 'Returns TRUE if the subquery returns at least one row. Safe with NULLs. Use instead of IN for large subqueries.' },
    { name: 'CAST(x AS type)',     type: 'function',  desc: 'ANSI standard explicit type conversion. Use instead of implicit casts to avoid sargability bugs.' },
    { name: 'COALESCE(a,b,…)',     type: 'function',  desc: 'Returns first non-NULL argument. Evaluates left to right.' },
    { name: 'NULLIF(a, b)',        type: 'function',  desc: 'Returns NULL if a = b, otherwise returns a. Common use: NULLIF(denominator, 0) to avoid division by zero.' },
    { name: 'CONVERT(type, x)',    type: 'function',  desc: 'MSSQL: type conversion with optional format style (e.g. CONVERT(VARCHAR, date, 103) for DD/MM/YYYY).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SELECT and the logical query processing order',
      points: [
        'SQL is declarative — you describe <em>what</em> data you want, not <em>how</em> to retrieve it. The engine chooses the execution plan. But there is a defined <strong>logical order</strong> in which SQL clauses are evaluated: <code>FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</code>.',
        'This order has practical consequences. You cannot use a SELECT alias in a WHERE or HAVING clause — those clauses run before SELECT is evaluated. You CAN use a SELECT alias in ORDER BY because ORDER BY runs last. A common workaround for alias filtering: wrap the query in a CTE or subquery.',
        '<code>SELECT *</code> returns all columns. Fine for exploration and quick queries, but a bad practice in production: it returns columns you do not need (wasted I/O), breaks when columns are added or reordered, makes query intent opaque, and can prevent certain index-only scans. Always name columns explicitly in production code.',
        '<code>DISTINCT</code> removes duplicate rows after SELECT is evaluated. It considers all selected columns — not just the first one. DISTINCT is not aggregation — it does not compute sums or counts; it only deduplicates. For large result sets, DISTINCT can be expensive (requires a sort or hash); GROUP BY with explicit aggregation is often more intentional.',
        'Column aliases (<code>AS</code>) improve readability and are required when using expressions in SELECT: <code>SELECT price * 1.2 AS price_with_vat</code>. The AS keyword is optional in most dialects (you can write <code>price * 1.2 price_with_vat</code>) but always include it for clarity. In PostgreSQL, use double-quotes for aliases that contain spaces or are case-sensitive: <code>AS "Price With VAT"</code>.',
      ],
    },
    {
      heading: 'Filtering with WHERE',
      points: [
        'WHERE filters individual rows <em>before</em> any aggregation. Predicates are Boolean expressions combined with <code>AND</code>, <code>OR</code>, and <code>NOT</code>. AND binds more tightly than OR — always use parentheses when mixing them: <code>WHERE status = \'Active\' AND (region = \'EU\' OR region = \'UK\')</code>.',
        '<code>IN (list)</code> tests whether a column value belongs to a literal list: equivalent to multiple ORs but more readable. <code>IN (subquery)</code> is also valid — the subquery must return a single column. <strong>Caution with NOT IN</strong>: if the list or subquery contains even one NULL, NOT IN returns no rows (because col <> NULL is UNKNOWN, not FALSE). Use NOT EXISTS instead.',
        '<code>BETWEEN a AND b</code> is inclusive at both ends — equivalent to <code>col >= a AND col <= b</code>. Common trap with datetime ranges: <code>BETWEEN \'2025-01-01\' AND \'2025-01-31\'</code> misses events from Jan 31 after midnight if the column stores time. Safer: <code>WHERE col >= \'2025-01-01\' AND col < \'2025-02-01\'</code>.',
        '<code>LIKE</code> pattern matching: <code>%</code> matches zero or more characters, <code>_</code> matches exactly one character. <code>LIKE \'prefix%\'</code> (trailing wildcard) is sargable — the index can do a range seek. <code>LIKE \'%suffix\'</code> or <code>LIKE \'%middle%\'</code> (leading wildcard) always causes a full scan. For full-text search, use Full-Text Indexing (MSSQL) or tsvector/tsquery (PostgreSQL).',
        'PostgreSQL <code>ILIKE</code> provides case-insensitive LIKE matching. MSSQL has no direct equivalent — case sensitivity is controlled by the column\'s collation (case-insensitive collation like <code>Latin1_General_CI_AS</code> makes LIKE case-insensitive automatically). For cross-platform code, use <code>LOWER(col) LIKE LOWER(\'%pattern%\')</code> — but note this breaks sargability.',
      ],
    },
    {
      heading: 'NULL — three-valued logic',
      points: [
        'NULL means "unknown" or "not applicable." It is not zero, not empty string, not false. NULL is contagious: any arithmetic with NULL returns NULL (<code>5 + NULL = NULL</code>), any string concatenation with NULL returns NULL in MSSQL (<code>\'Hello\' + NULL = NULL</code>), and any comparison with NULL using standard operators returns UNKNOWN.',
        'Use <code>IS NULL</code> and <code>IS NOT NULL</code> — never <code>= NULL</code> or <code><> NULL</code>. The expression <code>WHERE col = NULL</code> never returns any rows because it evaluates to UNKNOWN (not TRUE) for every row, including rows where col is actually NULL. This is the most common beginner SQL mistake.',
        'In WHERE and HAVING clauses, only rows that evaluate to TRUE pass the filter. UNKNOWN is treated the same as FALSE — the row is excluded. This is why <code>WHERE NOT (col = \'x\')</code> excludes NULL rows (NOT UNKNOWN = UNKNOWN, not TRUE), but <code>WHERE col <> \'x\' OR col IS NULL</code> includes them.',
        '<code>COALESCE(a, b, c, …)</code> returns the first non-NULL argument, evaluating left to right. Works in both MSSQL and PostgreSQL. Common uses: <code>COALESCE(nickname, first_name, \'Guest\')</code> for fallback display names, and <code>COALESCE(discount, 0)</code> to substitute 0 for NULL in arithmetic.',
        '<code>NULLIF(a, b)</code> returns NULL if a = b, otherwise returns a. Its primary use is safe division: <code>value / NULLIF(denominator, 0)</code> — if the denominator is zero, NULLIF returns NULL, and dividing by NULL returns NULL (avoiding a "division by zero" error). NULL is a safer sentinel than an error in most reporting contexts.',
      ],
    },
    {
      heading: 'Limiting rows — TOP vs LIMIT/OFFSET and keyset pagination',
      points: [
        'MSSQL <code>TOP n</code>: placed immediately after SELECT. <code>SELECT TOP 10 * FROM orders ORDER BY order_date DESC</code> — without ORDER BY, the 10 rows returned are arbitrary (the engine picks whichever it reads first). TOP also accepts a variable: <code>SELECT TOP (@n) *</code>. <code>TOP n PERCENT</code> returns a percentage of rows — no direct PostgreSQL equivalent.',
        'MSSQL paging with <code>OFFSET … FETCH NEXT</code> (ANSI SQL, supported from MSSQL 2012+): <code>ORDER BY col OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY</code>. Requires an ORDER BY clause. This is the recommended paging syntax for MSSQL.',
        'PostgreSQL <code>LIMIT n OFFSET m</code>: simpler syntax — <code>SELECT … FROM … ORDER BY … LIMIT 10 OFFSET 20</code>. Returns rows 21–30. PostgreSQL also supports the ANSI OFFSET/FETCH syntax. LIMIT without ORDER BY returns arbitrary rows.',
        '<strong>Deep pagination pitfall</strong>: <code>OFFSET 100000 ROWS FETCH NEXT 10 ROWS ONLY</code> is slow — the engine must scan and discard 100,000 rows before returning 10. For large datasets, use <strong>keyset pagination</strong> (cursor-based): <code>WHERE order_id > @last_seen_id ORDER BY order_id LIMIT 10</code>. This seeks directly into the index with no large offset scan.',
        '<strong>PostgreSQL <code>DISTINCT ON (col)</code></strong>: a PostgreSQL extension that keeps only the first row per distinct value of col, as determined by ORDER BY. <code>SELECT DISTINCT ON (customer_id) customer_id, order_date FROM orders ORDER BY customer_id, order_date DESC</code> returns the most recent order per customer. The MSSQL equivalent uses <code>ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)</code> then filters for <code>rn = 1</code>.',
      ],
    },
    {
      heading: 'Dialect differences — MSSQL vs PostgreSQL',
      points: [
        'String concatenation: MSSQL uses <code>+</code> (but <code>\'Hello\' + NULL = NULL</code> — use CONCAT() to safely ignore NULLs). PostgreSQL uses <code>||</code> (<code>\'Hello\' || NULL = NULL</code> by default). <code>CONCAT(a, b)</code> is ANSI and treats NULL as empty string in both dialects — the safest cross-platform choice.',
        'Current timestamp: MSSQL <code>GETDATE()</code> returns server local datetime as DATETIME — avoid it, timezone-sensitive. Prefer <code>SYSUTCDATETIME()</code> (returns UTC as DATETIME2(7)). PostgreSQL <code>NOW()</code> / <code>CURRENT_TIMESTAMP</code> returns TIMESTAMPTZ — always UTC-aware and timezone-convertible on retrieval.',
        'String case sensitivity: MSSQL default collation is case-insensitive (<code>Latin1_General_CI_AS</code>) — <code>WHERE name = \'alice\'</code> matches "Alice". PostgreSQL comparisons are case-sensitive by default — <code>WHERE name = \'alice\'</code> does NOT match "Alice". Use <code>ILIKE</code>, <code>LOWER()</code>, or <code>citext</code> extension for case-insensitive PG comparisons.',
        'Identifier quoting: MSSQL uses <code>[square brackets]</code> or <code>"double quotes"</code> to escape reserved words or spaces in identifiers. PostgreSQL uses <code>"double quotes"</code> only. In both, single quotes (<code>\'</code>) are always for string literals — never double quotes for strings.',
        'NULL sort order: MSSQL sorts NULLs as the lowest value (first in ASC, last in DESC). PostgreSQL sorts NULLs as the highest value (last in ASC, first in DESC) by default — control with <code>NULLS FIRST</code> / <code>NULLS LAST</code>: <code>ORDER BY score DESC NULLS LAST</code>.',
      ],
    },
    {
      heading: 'Type conversion — CAST, CONVERT, and implicit casts',
      points: [
        '<code>CAST(expression AS type)</code> is the ANSI SQL standard for explicit type conversion — works identically in MSSQL and PostgreSQL. Always use CAST in cross-platform code. PostgreSQL also supports the shorthand <code>expression::type</code> (e.g. <code>price::INT</code>, <code>\'2024-01-01\'::DATE</code>) which is idiomatic PG but not portable.',
        'MSSQL <code>CONVERT(type, expression, style)</code> extends CAST with an optional style parameter for datetime formatting: <code>CONVERT(VARCHAR, GETDATE(), 103)</code> returns <code>DD/MM/YYYY</code>. <code>CONVERT(VARCHAR, GETDATE(), 23)</code> returns ISO <code>YYYY-MM-DD</code>. Use CONVERT when you need dialect-specific date formatting; use CAST for all other conversions.',
        '<strong>Implicit type conversion</strong> is a hidden performance killer. If you compare a VARCHAR column to an integer literal (<code>WHERE account_code = 123</code>), the engine implicitly casts account_code to INT for every row — making the predicate non-sargable (full scan, even with an index). Always match the literal type to the column type: <code>WHERE account_code = \'123\'</code>.',
        '<strong>String concatenation and NULL casting</strong>: in MSSQL, concatenating any string with NULL using <code>+</code> returns NULL (<code>\'Hello \' + NULL = NULL</code>). Use <code>CONCAT()</code> to treat NULL as empty string, or <code>ISNULL(col, \'\')</code>. In PostgreSQL, the <code>||</code> operator behaves the same — use <code>CONCAT()</code> or <code>COALESCE(col, \'\')</code>.',
        'Common safe CAST patterns: converting string to date (<code>CAST(\'2024-01-15\' AS DATE)</code>), decimal to integer (truncates, does not round: <code>CAST(3.9 AS INT) = 3</code>), and integer division gotcha — in both dialects, <code>7 / 2 = 3</code> (integer division). To force decimal division: <code>7.0 / 2</code> or <code>CAST(7 AS DECIMAL) / 2</code> or <code>7 * 1.0 / 2</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SELECT & WHERE (both)',
      language: 'sql',
      code: `-- Basic SELECT — works in both MSSQL and PostgreSQL
SELECT
    product_id,
    product_name,
    price,
    COALESCE(description, 'No description') AS description  -- substitute NULL
FROM products
WHERE price BETWEEN 10.00 AND 100.00
  AND category_id IN (1, 2, 5)
  AND product_name LIKE 'Wireless%'   -- starts with 'Wireless' (index can be used)
  AND discontinued_at IS NULL         -- IS NULL, not = NULL
ORDER BY price DESC, product_name ASC;

-- Parentheses are required when mixing AND and OR:
-- Without parens: A AND B OR C = (A AND B) OR C — often not what you mean
SELECT * FROM orders
WHERE status = 'Pending'
  AND (total_amount > 500 OR priority = 'High');  -- explicit grouping

-- NULLIF to avoid division by zero (both dialects):
SELECT
    page_views,
    conversions,
    ROUND(100.0 * conversions / NULLIF(page_views, 0), 2) AS conversion_rate
FROM campaign_stats;

-- Safe date range (avoids BETWEEN gotcha with times):
SELECT * FROM orders
WHERE order_date >= '2025-01-01'
  AND order_date <  '2025-02-01';  -- entire January, including 2025-01-31 23:59:59`,
    },
    {
      label: 'Limit rows (MSSQL)',
      language: 'sql',
      code: `-- TOP n — first n rows (arbitrary without ORDER BY)
SELECT TOP 10 *
FROM orders
ORDER BY order_date DESC;   -- most recent 10

-- TOP with PERCENT
SELECT TOP 5 PERCENT *
FROM products
ORDER BY price DESC;        -- top 5% most expensive products

-- TOP with a variable
DECLARE @pageSize INT = 20;
SELECT TOP (@pageSize) * FROM products ORDER BY product_name;

-- Paging: OFFSET … FETCH NEXT (ANSI standard, MSSQL 2012+)
DECLARE @page     INT = 2;   -- 1-indexed page number
DECLARE @pageSize2 INT = 15;

SELECT
    order_id,
    customer_id,
    order_date,
    total_amount
FROM orders
ORDER BY order_date DESC
OFFSET (@page - 1) * @pageSize2 ROWS   -- skip first (page-1)*pageSize rows
FETCH NEXT @pageSize2 ROWS ONLY;

-- Keyset pagination (fast — no deep-offset scan):
SELECT TOP 15 *
FROM orders
WHERE order_id > @last_seen_id          -- picks up from where the last page left off
ORDER BY order_id;`,
    },
    {
      label: 'Limit rows (PostgreSQL)',
      language: 'sql',
      code: `-- LIMIT / OFFSET — native PostgreSQL syntax
SELECT *
FROM orders
ORDER BY order_date DESC
LIMIT 15 OFFSET 15;         -- page 2 (0-indexed), 15 per page

-- ILIKE — case-insensitive pattern match (PostgreSQL only)
SELECT *
FROM customers
WHERE full_name ILIKE '%smith%';   -- matches 'Smith', 'SMITH', 'smith'

-- NULLS FIRST / LAST — control NULL sort position
SELECT product_name, discontinued_at
FROM products
ORDER BY discontinued_at ASC NULLS LAST;  -- active products first (NULLs at end)

-- DISTINCT ON — PostgreSQL extension: keep first row per distinct value
-- Returns the most recent order per customer:
SELECT DISTINCT ON (customer_id)
    customer_id, order_date, total_amount
FROM orders
ORDER BY customer_id, order_date DESC;

-- MSSQL equivalent using ROW_NUMBER():
SELECT customer_id, order_date, total_amount
FROM (
    SELECT customer_id, order_date, total_amount,
           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
    FROM orders
) t
WHERE rn = 1;`,
    },
    {
      label: 'Dialect diffs side by side',
      language: 'sql',
      code: `-- ── String concatenation ──────────────────────────────────────────────
SELECT first_name + ' ' + last_name    AS full_name FROM customers;  -- MSSQL (+)
SELECT first_name || ' ' || last_name  AS full_name FROM customers;  -- PostgreSQL (||)
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM customers; -- both (ANSI; NULLs → '')

-- ── Current UTC timestamp ─────────────────────────────────────────────
SELECT SYSUTCDATETIME()    AS utc_now FROM (VALUES(1)) t(x);  -- MSSQL: DATETIME2(7)
SELECT NOW()               AS utc_now;                        -- PostgreSQL: TIMESTAMPTZ

-- ── Identifier quoting ────────────────────────────────────────────────
SELECT [order id], [from] FROM [my table];    -- MSSQL (square brackets)
SELECT "order id", "from" FROM "my table";    -- PostgreSQL (double quotes)

-- ── NULL sort order ───────────────────────────────────────────────────
-- MSSQL: NULLs sort first in ASC (lowest value). No NULLS FIRST/LAST syntax.
-- PostgreSQL: NULLs sort last in ASC by default.
SELECT name, score FROM leaderboard ORDER BY score DESC NULLS LAST;  -- PG only

-- ── Case sensitivity ──────────────────────────────────────────────────
-- MSSQL (CI collation — default): case-insensitive
SELECT * FROM products WHERE name = 'widget';  -- also matches 'Widget', 'WIDGET'
-- PostgreSQL: case-sensitive
SELECT * FROM products WHERE name = 'widget';  -- only matches exact lowercase
SELECT * FROM products WHERE LOWER(name) = LOWER('widget');  -- cross-platform fix
SELECT * FROM products WHERE name ILIKE 'widget';            -- PG shortcut

-- ── Integer division ──────────────────────────────────────────────────
SELECT 7 / 2   AS wrong_result;   -- = 3 (integer division in BOTH dialects)
SELECT 7.0 / 2 AS correct_result; -- = 3.5 (force decimal by making one operand decimal)
SELECT CAST(7 AS DECIMAL(10,2)) / 2;  -- explicit cast (cross-platform)`,
    },
    {
      label: 'Type conversion (CAST/CONVERT)',
      language: 'sql',
      code: `-- ── CAST — ANSI standard, works in both dialects ─────────────────────
SELECT CAST('2024-06-15' AS DATE)          AS as_date;    -- string → date
SELECT CAST(price AS INT)                   AS truncated;  -- 9.99 → 9 (truncates, no rounding)
SELECT CAST(qty AS DECIMAL(10,2)) / total  AS ratio;      -- force decimal division

-- ── PostgreSQL shorthand :: ───────────────────────────────────────────
SELECT '2024-06-15'::DATE        AS as_date;  -- PG only; not portable
SELECT price::INT                AS truncated; -- PG only
SELECT '{"key":"val"}'::JSONB    AS parsed;   -- PG only: string → jsonb

-- ── CONVERT — MSSQL only, adds date format styles ─────────────────────
-- Style 103 = DD/MM/YYYY  (British/French)
SELECT CONVERT(VARCHAR, GETDATE(), 103)  AS british_date;  -- e.g. '15/06/2024'
-- Style 120 = YYYY-MM-DD HH:MI:SS (ODBC canonical)
SELECT CONVERT(VARCHAR, GETDATE(), 120)  AS odbc_date;
-- Style 23 = YYYY-MM-DD (ISO date only)
SELECT CONVERT(VARCHAR, GETDATE(), 23)   AS iso_date;

-- ── Implicit conversion pitfall (non-sargable!) ────────────────────────
-- account_code is VARCHAR; comparing to INT literal forces implicit cast on every row:
SELECT * FROM accounts WHERE account_code = 123;    -- ❌ full scan (implicit CAST on col)
SELECT * FROM accounts WHERE account_code = '123';  -- ✅ index seek (types match)

-- Check for implicit conversions in SQL Server execution plan:
-- Look for "CONVERT_IMPLICIT" warning nodes in the plan XML or SSMS plan viewer.

-- ── String + NULL in MSSQL ────────────────────────────────────────────
SELECT 'Hello ' + NULL      AS mssql_concat;    -- returns NULL (bad)
SELECT ISNULL(NULL, '')     AS safe_null;        -- returns ''
SELECT CONCAT('Hello ', NULL) AS safe_concat;   -- returns 'Hello ' (CONCAT ignores NULL)

-- ── Safe rounding vs truncation ───────────────────────────────────────
SELECT CAST(3.9 AS INT)       AS truncated;   -- 3 (not 4 — CAST truncates)
SELECT ROUND(3.9, 0)          AS rounded;     -- 4.0
SELECT CAST(ROUND(3.9,0) AS INT) AS rounded_int; -- 4`,
    },
    {
      label: 'EXISTS vs IN vs NOT IN',
      language: 'sql',
      code: `-- ── IN with a list (fast, readable for small lists) ──────────────────
SELECT * FROM orders WHERE status IN ('Pending', 'Processing');

-- ── IN with a subquery ────────────────────────────────────────────────
SELECT * FROM customers
WHERE customer_id IN (SELECT DISTINCT customer_id FROM orders WHERE order_date >= '2024-01-01');

-- ── EXISTS (preferred for subqueries) ─────────────────────────────────
-- EXISTS stops scanning as soon as it finds the first matching row (semi-join)
-- Also safe with NULLs — it checks row existence, not value equality
SELECT c.*
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.order_date >= '2024-01-01'
);

-- ── NOT IN — DANGEROUS with NULLs ─────────────────────────────────────
-- If the subquery returns even one NULL, NOT IN returns 0 rows:
SELECT * FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM orders);
-- If ANY row in orders has customer_id IS NULL → zero rows returned silently!

-- ── NOT EXISTS — the safe replacement ─────────────────────────────────
-- Customers who have never placed an order (NULL-safe):
SELECT c.*
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
);

-- ── ALL / ANY with subquery ────────────────────────────────────────────
-- Products more expensive than ALL competitor prices:
SELECT * FROM products
WHERE price > ALL (SELECT competitor_price FROM competitor_prices);

-- Products cheaper than at least one competitor:
SELECT * FROM products
WHERE price < ANY (SELECT competitor_price FROM competitor_prices);`,
    },
  ];

  challenge: Challenge = {
    title: 'Product Search Query',
    language: 'sql',
    description: 'Write a query against a products table that: (1) finds products with a name containing "cable" (case-insensitive), (2) filters to price between $5 and $200, (3) excludes discontinued products (<code>discontinued_at IS NOT NULL</code>), (4) orders by price ascending then name, (5) returns page 2 with 15 results per page. Write both MSSQL and PostgreSQL versions.',
    hints: [
      'PostgreSQL: use ILIKE for case-insensitive match',
      'MSSQL: use LIKE with a CI collation (the default) or LOWER()',
      'MSSQL paging: ORDER BY … OFFSET 15 ROWS FETCH NEXT 15 ROWS ONLY',
      'PostgreSQL paging: ORDER BY … LIMIT 15 OFFSET 15',
      'Exclude discontinued: WHERE discontinued_at IS NULL',
    ],
    starterCode: `-- Products table:
-- product_id, product_name, price DECIMAL(10,2), discontinued_at DATE NULL

-- MSSQL version:
SELECT ...
FROM products
WHERE ...
ORDER BY ...
-- paging for page 2, 15 per page

-- PostgreSQL version:
SELECT ...
FROM products
WHERE ...
ORDER BY ...
-- paging for page 2, 15 per page`,
    solution: `-- MSSQL (T-SQL):
SELECT
    product_id,
    product_name,
    price
FROM products
WHERE product_name LIKE '%cable%'        -- case-insensitive on default CI collation
  AND price BETWEEN 5.00 AND 200.00
  AND discontinued_at IS NULL
ORDER BY price ASC, product_name ASC
OFFSET 15 ROWS FETCH NEXT 15 ROWS ONLY; -- page 2 (0-indexed offset), 15 per page

-- PostgreSQL:
SELECT
    product_id,
    product_name,
    price
FROM products
WHERE product_name ILIKE '%cable%'       -- built-in case-insensitive LIKE
  AND price BETWEEN 5.00 AND 200.00
  AND discontinued_at IS NULL
ORDER BY price ASC, product_name ASC
LIMIT 15 OFFSET 15;                      -- page 2 (0-indexed), 15 per page`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does WHERE col = NULL return?',
      options: [
        'All rows where col is NULL',
        'No rows — NULL comparisons with = always return UNKNOWN, which the WHERE clause treats as FALSE',
        'An error — = NULL is a syntax error',
        'All rows',
      ],
      answer: 1,
      explanation: 'NULL represents "unknown." Any comparison using = against NULL returns UNKNOWN (not TRUE or FALSE). The WHERE clause only passes rows that evaluate to TRUE. Use IS NULL to test for NULL — WHERE col IS NULL.',
    },
    {
      q: 'In MSSQL, which syntax correctly returns rows 21–30 ordered by order_date?',
      options: [
        'SELECT TOP 10 … ORDER BY order_date SKIP 20',
        'SELECT … ORDER BY order_date OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY',
        'SELECT … ORDER BY order_date LIMIT 10 OFFSET 20',
        'SELECT … OFFSET 20 FETCH 10 ORDER BY order_date',
      ],
      answer: 1,
      explanation: 'MSSQL uses ANSI paging syntax: ORDER BY … OFFSET n ROWS FETCH NEXT m ROWS ONLY. This requires an ORDER BY clause. LIMIT/OFFSET is PostgreSQL syntax; SKIP does not exist in MSSQL.',
    },
    {
      q: 'LIKE \'%value%\' on an indexed column causes a full scan. Why?',
      options: [
        'LIKE is not supported for indexed columns',
        'A leading wildcard means the engine cannot use the B-tree index to narrow the search — it must evaluate every row',
        'The % operator bypasses all indexes by design',
        'The column must be in GROUP BY to use an index with LIKE',
      ],
      answer: 1,
      explanation: 'A B-tree index is organised by prefix. LIKE \'prefix%\' (trailing wildcard) can seek to the first matching prefix and scan forward — sargable. LIKE \'%value%\' has an unknown starting point, so the engine cannot seek into the index and must scan every row.',
    },
    {
      q: 'What result does COALESCE(NULL, NULL, 42, NULL) return?',
      options: ['NULL', '0', '42', 'An error'],
      answer: 2,
      explanation: 'COALESCE returns the first non-NULL argument, evaluating left to right and stopping at the first non-NULL value. The first two arguments are NULL; 42 is the first non-NULL value, so COALESCE returns 42.',
    },
    {
      q: 'Why is NOT IN dangerous when the subquery might return NULL values?',
      options: [
        'NOT IN is not valid with subqueries',
        'If the subquery returns any NULL, NOT IN returns zero rows because col <> NULL evaluates to UNKNOWN for every row',
        'NOT IN only works with literal lists, not subqueries',
        'NULL values are automatically excluded from NOT IN subqueries',
      ],
      answer: 1,
      explanation: 'NOT IN (subquery) expands to: col <> val1 AND col <> val2 AND … . If any value in the subquery is NULL, col <> NULL evaluates to UNKNOWN. UNKNOWN AND anything = UNKNOWN, so the entire expression is UNKNOWN — which the WHERE clause treats as FALSE, excluding all rows. Use NOT EXISTS instead, which safely tests row existence without NULL comparisons.',
    },
    {
      q: 'You compare WHERE account_code = 123 but account_code is VARCHAR. What is the performance risk?',
      options: [
        'No risk — SQL automatically handles type mismatches',
        'Implicit type conversion is applied to every row in the column, making the predicate non-sargable and causing a full table scan',
        'The query will raise a type error',
        'Only a risk if the table has fewer than 1000 rows',
      ],
      answer: 1,
      explanation: 'When you compare a VARCHAR column to an integer literal, the engine implicitly casts the column value to INT for every row — equivalent to wrapping the column in a CONVERT() function. This breaks sargability: the index cannot be used for a seek. Fix: match the literal type to the column type — WHERE account_code = \'123\'.',
    },
    {
      q: 'In the logical query processing order, which clause is evaluated LAST?',
      options: ['SELECT', 'WHERE', 'HAVING', 'ORDER BY'],
      answer: 3,
      explanation: 'The logical order is: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. ORDER BY is evaluated last — which is why SELECT aliases ARE available in ORDER BY (SELECT has already run). WHERE, HAVING, and GROUP BY cannot reference SELECT aliases because they run before SELECT.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why can\'t I use a SELECT alias in the WHERE clause?',
      a: 'The logical query processing order evaluates WHERE before SELECT. When the WHERE clause runs, the aliases defined in SELECT do not yet exist. This is one of the most common sources of SQL confusion. Workaround: wrap the query in a subquery or CTE and filter on the alias in the outer query: <code>WITH cte AS (SELECT price * 1.2 AS price_with_tax FROM products) SELECT * FROM cte WHERE price_with_tax > 100</code>. Aliases ARE available in ORDER BY (evaluated last) but not in WHERE, HAVING, or GROUP BY.',
    },
    {
      q: 'What is the difference between GETDATE() and SYSUTCDATETIME() in MSSQL?',
      a: '<code>GETDATE()</code> returns the current date and time in the SQL Server instance\'s local timezone as DATETIME — timezone-sensitive and imprecise (3.33ms accuracy). <code>SYSUTCDATETIME()</code> returns UTC time as DATETIME2(7) — 100ns precision, larger date range, and independent of the server\'s timezone setting. Always use <code>SYSUTCDATETIME()</code> for timestamps in new code. Mixing local and UTC timestamps across tables causes subtle bugs when the server is in a non-UTC timezone or when DST occurs. The PostgreSQL equivalent is <code>NOW()</code>, which returns TIMESTAMPTZ — always UTC-aware.',
    },
    {
      q: 'Why does NOT IN fail when the subquery can return NULL?',
      a: '<code>NOT IN (subquery)</code> is logically equivalent to <code>col <> val1 AND col <> val2 AND …</code>. If the subquery returns even one NULL, the comparison <code>col <> NULL</code> evaluates to UNKNOWN (not FALSE). UNKNOWN AND anything = UNKNOWN, and the WHERE clause treats UNKNOWN as FALSE — so every row is excluded. This is one of the most common SQL bugs in production code. Fix: use <code>NOT EXISTS</code> instead — it tests whether a correlated subquery returns any rows, which is NULL-safe. Rule: never use <code>NOT IN</code> with a subquery unless both the column and the subquery result are guaranteed NOT NULL.',
    },
    {
      q: 'What is the difference between WHERE and HAVING?',
      a: 'WHERE filters individual rows <em>before</em> any aggregation (GROUP BY). HAVING filters groups <em>after</em> aggregation. You cannot use aggregate functions (SUM, COUNT, AVG) in a WHERE clause — use HAVING instead: <code>GROUP BY customer_id HAVING SUM(total) > 1000</code>. Conversely, you can filter non-aggregated column values in either WHERE or HAVING — but WHERE is much more efficient because it reduces the row count before grouping, whereas HAVING filters after all aggregation work is already done.',
    },
    {
      q: 'When should I use EXISTS instead of IN?',
      a: '<code>EXISTS</code> and <code>IN</code> are logically equivalent for most cases, but EXISTS has two important advantages: (1) <strong>NULL safety</strong> — EXISTS tests whether any row exists, not whether a column value equals something, so it handles NULLs correctly (unlike NOT IN). (2) <strong>Short-circuit evaluation</strong> — EXISTS stops scanning the subquery as soon as it finds the first matching row (a semi-join optimisation), while IN with a subquery may materialise the entire result set. Use IN for simple literal lists. Use EXISTS (and NOT EXISTS) when the subquery references an outer column or when NULLs could appear in the subquery result.',
    },
    {
      q: 'What happens when you concatenate a string with NULL in MSSQL?',
      a: 'In MSSQL, the <code>+</code> concatenation operator propagates NULL: <code>\'Hello \' + NULL</code> returns NULL. This is the standard SQL NULL-propagation behaviour. To safely concatenate with potentially NULL values: use <code>ISNULL(col, \'\')</code> to substitute empty string for NULL, or use <code>CONCAT(\'Hello \', col)</code> — the CONCAT function treats NULL arguments as empty strings (a deliberate deviation from standard NULL propagation, common to both MSSQL and PostgreSQL). PostgreSQL\'s <code>||</code> also propagates NULL; use <code>CONCAT()</code> or <code>COALESCE(col, \'\')</code>.',
    },
    {
      q: 'What is keyset pagination and when should I use it instead of OFFSET?',
      a: 'OFFSET-based pagination (<code>OFFSET 10000 ROWS FETCH NEXT 20 ROWS ONLY</code>) is slow for large offsets: the engine must scan and discard 10,000 rows before returning the 20 you need. This gets slower as page numbers grow. Keyset pagination (cursor-based) avoids this: instead of skipping rows by count, you record the last-seen value from the previous page and seek to that position: <code>WHERE order_id > @last_seen_id ORDER BY order_id LIMIT 20</code>. This is a direct index seek — O(log n) regardless of which page you are on. Use keyset pagination for any table with > ~1,000 pages or when users can jump to arbitrary deep pages. The limitation: keyset pagination only supports sequential navigation (next/previous), not "jump to page 500".',
    },
  ];
}
