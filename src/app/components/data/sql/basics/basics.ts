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
    { name: 'SELECT',              type: 'keyword',   desc: 'Specifies which columns to return. * means all. Evaluated after FROM/WHERE.' },
    { name: 'FROM',                type: 'keyword',   desc: 'Specifies the table, view, or subquery to read from.' },
    { name: 'WHERE',               type: 'keyword',   desc: 'Filters rows before any aggregation. Uses Boolean predicates.' },
    { name: 'ORDER BY',            type: 'keyword',   desc: 'Sorts the result. ASC (default) or DESC. Multiple columns allowed.' },
    { name: 'DISTINCT',            type: 'keyword',   desc: 'Removes duplicate rows from the result set.' },
    { name: 'TOP n (MSSQL)',       type: 'keyword',   desc: 'Limits result to first n rows. SELECT TOP 10 … FROM …' },
    { name: 'LIMIT n (PG)',        type: 'keyword',   desc: 'PostgreSQL: limits rows returned. SELECT … FROM … LIMIT 10 OFFSET 20.' },
    { name: 'OFFSET…FETCH (MSSQL)',type: 'keyword',   desc: 'MSSQL paging: ORDER BY col OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY.' },
    { name: 'LIKE',                type: 'operator',  desc: 'Pattern match: % = zero or more chars, _ = exactly one char. Case-sensitive depends on collation.' },
    { name: 'ILIKE (PG only)',     type: 'operator',  desc: 'Case-insensitive LIKE. PostgreSQL only. No MSSQL equivalent — use a case-insensitive collation.' },
    { name: 'IN',                  type: 'operator',  desc: 'Tests membership in a list or subquery. Equivalent to multiple ORs.' },
    { name: 'BETWEEN',             type: 'operator',  desc: 'Inclusive range: BETWEEN a AND b ≡ col >= a AND col <= b.' },
    { name: 'IS NULL',             type: 'operator',  desc: 'NULL cannot be tested with = or <>. Always use IS NULL / IS NOT NULL.' },
    { name: 'AS',                  type: 'keyword',   desc: 'Column or table alias. Alias can be referenced in ORDER BY.' },
    { name: 'CAST(x AS type)',     type: 'function',  desc: 'ANSI standard type conversion. Works in both dialects.' },
    { name: 'COALESCE(a,b,…)',     type: 'function',  desc: 'Returns the first non-NULL argument. Works in both dialects.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SELECT and the Logical Query Processing Order',
      points: [
        'SQL is declarative — you describe WHAT you want, not HOW to get it. The engine decides the execution plan. But there is a logical order in which clauses are evaluated.',
        'Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. This matters because you cannot reference a SELECT alias in a WHERE clause — WHERE is evaluated before SELECT.',
        'SELECT * is fine for exploration but a bad practice in production code: it returns columns you may not need (wasted I/O), breaks if a column is added or reordered, and makes the query\'s intent opaque.',
        'DISTINCT operates on the full row after SELECT is evaluated. It removes rows where ALL selected columns have the same values. It is NOT the same as a GROUP BY — it does no aggregation.',
        'Column aliases (AS) can be used in ORDER BY in both MSSQL and PostgreSQL. They cannot be used in WHERE or HAVING (those clauses run before SELECT is evaluated).',
      ],
    },
    {
      heading: 'Filtering with WHERE',
      points: [
        'WHERE filters individual rows before any aggregation. Combine predicates with AND, OR, and NOT. Use parentheses to control precedence — AND binds more tightly than OR.',
        'IN (list): tests whether a column value is in a literal list. Equivalent to multiple ORs. IN (subquery) is also valid. Performance: efficient for small lists; consider EXISTS for large subqueries.',
        'BETWEEN a AND b: inclusive at both ends. Equivalent to col >= a AND col <= b. Common trap: BETWEEN with dates — BETWEEN \'2025-01-01\' AND \'2025-01-31\' misses rows from Jan 31 after midnight if the column is DATETIME2/TIMESTAMPTZ.',
        'LIKE: % matches zero or more characters, _ matches exactly one character. Leading wildcard (LIKE \'%value\') always causes a full scan — the index cannot be used for prefix matching from the right.',
        'PostgreSQL ILIKE: case-insensitive LIKE. No direct MSSQL equivalent — use a case-insensitive collation (e.g. Latin1_General_CI_AS) or LOWER(col) LIKE LOWER(pattern).',
      ],
    },
    {
      heading: 'NULL — Three-Valued Logic',
      points: [
        'NULL means "unknown." It is not zero, not empty string, not false. Any arithmetic with NULL returns NULL. Any comparison with NULL using = or <> returns UNKNOWN (not TRUE or FALSE).',
        'Use IS NULL and IS NOT NULL — not = NULL or <> NULL. WHERE col = NULL never returns any rows.',
        'In WHERE clauses, only rows that evaluate to TRUE pass the filter. UNKNOWN rows are filtered out — the same behaviour as FALSE. This is why NOT IN with a NULL in the list returns no rows.',
        'COALESCE(a, b, c): returns the first non-NULL value. Works in both dialects. Use it to substitute a default when a value is NULL.',
        'NULLIF(a, b): returns NULL if a = b, otherwise returns a. Useful for avoiding division by zero: value / NULLIF(denominator, 0).',
      ],
    },
    {
      heading: 'Limiting Rows — TOP vs LIMIT/OFFSET',
      points: [
        'MSSQL TOP n: placed immediately after SELECT. SELECT TOP 10 * FROM … returns the first 10 rows. Without ORDER BY, the 10 rows are arbitrary.',
        'MSSQL paging: ORDER BY col OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY. Requires an ORDER BY clause. This is ANSI SQL standard syntax — also supported in PostgreSQL.',
        'PostgreSQL LIMIT / OFFSET: SELECT … FROM … LIMIT 10 OFFSET 20. Simpler to write but not ANSI standard. Supported in MSSQL only via the OFFSET…FETCH syntax.',
        'MSSQL TOP with PERCENT: SELECT TOP 10 PERCENT * FROM … returns the top 10% of rows. No direct PostgreSQL equivalent.',
        'Deep pagination (OFFSET 1 000 000 ROWS) is expensive in both dialects — the engine must scan and discard all preceding rows. For large datasets, use keyset (cursor) pagination: WHERE id > last_seen_id LIMIT n.',
      ],
    },
    {
      heading: 'Dialect Differences at a Glance',
      points: [
        'String concatenation: MSSQL uses + (\'Hello\' + \' World\'). PostgreSQL uses || (\'Hello\' || \' World\'). CONCAT() works in both.',
        'Current timestamp: MSSQL GETDATE() returns local datetime; GETUTCDATE() / SYSUTCDATETIME() returns UTC. PostgreSQL NOW() / CURRENT_TIMESTAMP returns TIMESTAMPTZ (UTC-aware).',
        'String casing: MSSQL collation controls case sensitivity (CI = case-insensitive by default). PostgreSQL comparisons are case-sensitive by default; use LOWER() or ILIKE.',
        'Quoting identifiers: MSSQL uses [square brackets] or "double quotes". PostgreSQL uses "double quotes". Single quotes are always for string literals in both.',
        'NULL sorting: MSSQL NULLs sort first in ASC (smallest). PostgreSQL NULLs sort last in ASC by default; control with NULLS FIRST / NULLS LAST in ORDER BY.',
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
  AND discontinued IS NULL             -- IS NULL, not = NULL
ORDER BY price DESC, product_name ASC;

-- Combine predicates with parentheses to avoid AND/OR precedence bugs:
-- Without parens: A AND B OR C = (A AND B) OR C  — often not what you mean
SELECT * FROM orders
WHERE status = 'Pending'
  AND (total_amount > 500 OR priority = 'High');  -- parens make intent clear

-- NULLIF to avoid division by zero (both dialects):
SELECT
    page_views,
    conversions,
    ROUND(100.0 * conversions / NULLIF(page_views, 0), 2) AS conversion_rate
FROM campaign_stats;`,
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

-- Paging: OFFSET … FETCH NEXT (ANSI standard, MSSQL 2012+)
SELECT
    order_id,
    customer_id,
    order_date,
    total_amount
FROM orders
ORDER BY order_date DESC
OFFSET 20 ROWS              -- skip 20 rows (page 3, page size 10)
FETCH NEXT 10 ROWS ONLY;    -- return the next 10

-- Keyset pagination (fast, no deep-offset scan):
SELECT TOP 10 *
FROM orders
WHERE order_id > @last_seen_id   -- use the last ID from the previous page
ORDER BY order_id;`,
    },
    {
      label: 'Limit rows (PostgreSQL)',
      language: 'sql',
      code: `-- LIMIT / OFFSET — PostgreSQL native syntax
SELECT *
FROM orders
ORDER BY order_date DESC
LIMIT 10 OFFSET 20;         -- page 3 (zero-indexed), page size 10

-- ILIKE — case-insensitive pattern match (PostgreSQL only)
SELECT *
FROM customers
WHERE full_name ILIKE '%smith%';   -- matches 'Smith', 'SMITH', 'smith'

-- NULLS FIRST / LAST — control NULL sort position
SELECT product_name, discontinued_at
FROM products
ORDER BY discontinued_at ASC NULLS LAST;  -- active products first (NULLs at end)

-- DISTINCT ON — PostgreSQL extension: keep first row per distinct value
-- (no direct MSSQL equivalent — use ROW_NUMBER() instead)
SELECT DISTINCT ON (customer_id)
    customer_id, order_date, total_amount
FROM orders
ORDER BY customer_id, order_date DESC;  -- latest order per customer`,
    },
    {
      label: 'Dialect diffs side by side',
      language: 'sql',
      code: `-- ── String concatenation ──────────────────────────────────────────────
-- MSSQL:
SELECT first_name + ' ' + last_name AS full_name FROM customers;
-- PostgreSQL:
SELECT first_name || ' ' || last_name AS full_name FROM customers;
-- Both (ANSI):
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM customers;

-- ── Current timestamp ─────────────────────────────────────────────────
-- MSSQL (avoid GETDATE — returns server local time):
SELECT GETUTCDATE()        AS utc_now_datetime;   -- UTC as DATETIME
SELECT SYSUTCDATETIME()    AS utc_now_datetime2;  -- UTC as DATETIME2(7) — preferred
-- PostgreSQL:
SELECT NOW()               AS utc_now;            -- TIMESTAMPTZ (UTC-aware)
SELECT CURRENT_TIMESTAMP   AS same_as_now;

-- ── Identifier quoting ────────────────────────────────────────────────
-- MSSQL:
SELECT [order id], [from] FROM [my table];   -- square brackets escape reserved words
-- PostgreSQL:
SELECT "order id", "from" FROM "my table";   -- double quotes

-- ── NULL sort order ───────────────────────────────────────────────────
-- MSSQL: NULLs sort first in ASC (lowest), last in DESC
SELECT name, score FROM leaderboard ORDER BY score DESC;  -- NULLs at end in DESC

-- PostgreSQL: NULLs sort last in ASC by default; control explicitly
SELECT name, score FROM leaderboard ORDER BY score DESC NULLS LAST;

-- ── Case sensitivity ──────────────────────────────────────────────────
-- MSSQL (CI collation — default): case-insensitive
SELECT * FROM products WHERE name = 'widget';  -- also matches 'Widget', 'WIDGET'
-- PostgreSQL: case-sensitive by default
SELECT * FROM products WHERE name = 'widget';  -- only matches exact case
SELECT * FROM products WHERE LOWER(name) = 'widget';  -- case-insensitive workaround
SELECT * FROM products WHERE name ILIKE 'widget';     -- better`,
    },
  ];

  challenge: Challenge = {
    title: 'Product Search Query',
    language: 'sql',
    description: 'Write a query against a products table that: (1) finds products with a name containing "cable" (case-insensitive), (2) filters to price between $5 and $200, (3) excludes discontinued products (discontinued_at IS NOT NULL), (4) orders by price ascending then name, (5) returns page 2 with 15 results per page. Write both MSSQL and PostgreSQL versions.',
    hints: [
      'PostgreSQL: use ILIKE for case-insensitive match',
      'MSSQL: use LIKE with a CI collation or LOWER()',
      'MSSQL paging: OFFSET 15 ROWS FETCH NEXT 15 ROWS ONLY',
      'PostgreSQL paging: LIMIT 15 OFFSET 15',
    ],
    starterCode: `-- Products table:
-- product_id, product_name, price DECIMAL(10,2), discontinued_at DATE NULL

-- Write the query in MSSQL (T-SQL):
SELECT ...
FROM products
WHERE ...
ORDER BY ...
-- add paging for page 2, 15 per page

-- Write the equivalent in PostgreSQL:
SELECT ...
FROM products
WHERE ...
ORDER BY ...
-- add paging for page 2, 15 per page`,
    solution: `-- MSSQL (T-SQL):
SELECT
    product_id,
    product_name,
    price
FROM products
WHERE product_name LIKE '%cable%'        -- case-insensitive if DB uses CI collation
  AND price BETWEEN 5.00 AND 200.00
  AND discontinued_at IS NULL
ORDER BY price ASC, product_name ASC
OFFSET 15 ROWS FETCH NEXT 15 ROWS ONLY; -- page 2 (0-indexed), 15 per page

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
        'No rows — NULL comparisons with = always return UNKNOWN, which filters out as FALSE',
        'An error',
        'All rows',
      ],
      answer: 1,
      explanation: 'NULL represents "unknown." Any comparison using = against NULL returns UNKNOWN, not TRUE. The WHERE clause only passes rows that evaluate to TRUE. Use IS NULL to test for NULL.',
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
      explanation: 'MSSQL uses the ANSI SQL paging syntax: ORDER BY … OFFSET n ROWS FETCH NEXT m ROWS ONLY. LIMIT/OFFSET is PostgreSQL syntax. SKIP does not exist in MSSQL.',
    },
    {
      q: 'LIKE \'%value%\' on an indexed column causes a full scan. Why?',
      options: [
        'LIKE is not supported for indexed columns',
        'A leading wildcard means the engine cannot use the index to narrow the search — it must scan every row',
        'The % operator bypasses all indexes by design',
        'The column must be in GROUP BY to use an index with LIKE',
      ],
      answer: 1,
      explanation: 'A B-tree index is organised by prefix. LIKE \'value%\' (trailing wildcard only) can use the index to find all values starting with "value". LIKE \'%value%\' or LIKE \'%value\' has an unknown starting point, so the engine must scan every row.',
    },
    {
      q: 'In PostgreSQL, what does SELECT DISTINCT ON (customer_id) … ORDER BY customer_id, order_date DESC return?',
      options: [
        'All distinct customer IDs with no other columns',
        'One row per customer — the most recent order for each (due to ORDER BY order_date DESC)',
        'A syntax error — DISTINCT ON is not valid SQL',
        'All orders, deduplicated by the full row',
      ],
      answer: 1,
      explanation: 'DISTINCT ON (col) is a PostgreSQL extension that keeps only the first row per distinct value of col, as determined by the ORDER BY clause. ORDER BY customer_id, order_date DESC means: within each customer, take the row with the latest order_date.',
    },
    {
      q: 'COALESCE(NULL, NULL, 42, NULL) returns:',
      options: ['NULL', '0', '42', 'An error'],
      answer: 2,
      explanation: 'COALESCE returns the first non-NULL argument in the list. It evaluates left to right and stops as soon as it finds a non-NULL value. Here, 42 is the first non-NULL argument.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why can\'t I use a SELECT alias in the WHERE clause?',
      a: 'The logical query processing order evaluates WHERE before SELECT. When the WHERE clause runs, the aliases defined in SELECT do not yet exist. This is a common source of confusion. Workaround: wrap the query in a subquery or CTE and filter on the alias in the outer WHERE. Example: WITH cte AS (SELECT price * 1.2 AS price_with_tax FROM products) SELECT * FROM cte WHERE price_with_tax > 100.',
    },
    {
      q: 'What is the difference between GETDATE() and SYSUTCDATETIME() in MSSQL?',
      a: 'GETDATE() returns the current date and time in the server\'s local timezone as DATETIME. GETUTCDATE() returns UTC as DATETIME. SYSUTCDATETIME() returns UTC as DATETIME2(7) — the highest precision type. Always use SYSUTCDATETIME() (or SYSDATETIMEOFFSET()) in new code. Storing server-local timestamps causes subtle bugs when the server timezone changes (DST, migrations). The PostgreSQL equivalent is NOW() which returns TIMESTAMPTZ — always UTC-aware.',
    },
    {
      q: 'Why does NOT IN fail when the subquery can return NULL?',
      a: 'NOT IN (subquery) is equivalent to col <> val1 AND col <> val2 AND … . If the subquery returns even one NULL, the comparison col <> NULL evaluates to UNKNOWN, making the entire AND chain UNKNOWN — which filters out ALL rows. Use NOT EXISTS instead: it safely handles NULLs. This is one of the most common SQL bugs in production code. Rule: never use NOT IN with a subquery unless the column and the subquery result are both guaranteed NOT NULL.',
    },
  ];
}
