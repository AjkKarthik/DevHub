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
  selector: 'app-sql-joins',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './joins.html',
  styleUrl: './joins.scss',
})
export class SqlJoins {

  quickRef: QuickRefItem[] = [
    { name: 'INNER JOIN',          type: 'keyword', desc: 'Returns only rows where the ON condition is TRUE in both tables. Non-matching rows are excluded.' },
    { name: 'LEFT [OUTER] JOIN',   type: 'keyword', desc: 'Returns ALL rows from the left table. Right-side columns are NULL where no match.' },
    { name: 'RIGHT [OUTER] JOIN',  type: 'keyword', desc: 'Returns ALL rows from the right table. Rewrite as LEFT JOIN by swapping tables — same result, more readable.' },
    { name: 'FULL [OUTER] JOIN',   type: 'keyword', desc: 'All rows from both tables. NULLs fill in where no match on either side.' },
    { name: 'CROSS JOIN',          type: 'keyword', desc: 'Cartesian product — every left row paired with every right row. No ON clause.' },
    { name: 'Self-join',           type: 'keyword', desc: 'Table joined to itself using two aliases. Used for parent-child hierarchy or row comparisons.' },
    { name: 'Anti-join',           type: 'keyword', desc: 'Left rows with NO match in right. Use LEFT JOIN … WHERE right.pk IS NULL, or NOT EXISTS.' },
    { name: 'Semi-join',           type: 'keyword', desc: 'Left rows where a match EXISTS, without duplicating for multiple right matches. Use EXISTS.' },
    { name: 'CROSS APPLY (MSSQL)', type: 'keyword', desc: 'Evaluates a TVF or subquery for each left-table row. Like CROSS JOIN LATERAL in PostgreSQL.' },
    { name: 'OUTER APPLY (MSSQL)', type: 'keyword', desc: 'Same as CROSS APPLY but keeps left rows even when the expression returns no rows (like LEFT JOIN).' },
    { name: 'LATERAL (PG)',        type: 'keyword', desc: 'PostgreSQL: a subquery in FROM that can reference columns from earlier FROM items. CROSS/OUTER APPLY equivalent.' },
    { name: 'Nested Loop Join',    type: 'keyword', desc: 'Join algorithm: for each outer row, probe the inner side. Best with a small outer set and an index on the inner join column.' },
    { name: 'Hash Join',           type: 'keyword', desc: 'Build a hash table from the smaller side; probe with the larger side. Best for large, unindexed inputs. No pre-sort required.' },
    { name: 'Merge Join',          type: 'keyword', desc: 'Both inputs must be sorted on the join key. Very fast if inputs are already sorted (e.g., PKs or pre-sorted CTEs).' },
    { name: 'WITH(NOLOCK) (MSSQL)',type: 'keyword', desc: 'Hint: read without shared locks — allows dirty reads. Use only for approximate reporting, never for transactional data.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'INNER JOIN — Only Matching Rows',
      points: [
        'INNER JOIN returns rows where the ON condition is TRUE in BOTH tables. Rows with no match on either side are excluded.',
        'The word INNER is optional — JOIN alone means INNER JOIN in both MSSQL and PostgreSQL.',
        'Chain multiple JOINs to combine 3+ tables. The engine processes them left to right logically, though the optimiser may reorder for efficiency.',
        'Provide an alias for each table to keep the query readable: FROM orders o JOIN customers c ON o.customer_id = c.customer_id.',
        'Performance: index the join columns. The optimiser chooses between Nested Loop (small tables + index), Hash Join (large unindexed sets), and Merge Join (both sides pre-sorted).',
      ],
    },
    {
      heading: 'LEFT JOIN — Preserve All Left Rows',
      points: [
        'LEFT JOIN returns ALL rows from the left table. For rows where the right table has no match, right-side columns are NULL in the result.',
        'Use LEFT JOIN when the right record is optional: all customers including those with no orders, all products including those never ordered.',
        'Critical trap: adding a WHERE condition on a right-side column converts the LEFT JOIN into an INNER JOIN, because WHERE filters out NULL rows. Move the filter into the ON clause to preserve outer behaviour.',
        'FULL OUTER JOIN keeps all rows from both tables with NULLs on whichever side had no match. Useful for diffing two datasets.',
        'RIGHT JOIN is semantically equivalent to LEFT JOIN with tables swapped. Standardise on LEFT JOIN for consistency.',
      ],
    },
    {
      heading: 'Anti-join, Semi-join, and Self-join',
      points: [
        'Anti-join finds left rows with NO match in the right table. Two patterns: (1) LEFT JOIN … WHERE right.pk IS NULL; (2) NOT EXISTS (SELECT 1 FROM right WHERE …). Prefer NOT EXISTS — it is NULL-safe and often produces a more efficient anti-join plan.',
        'The NOT IN pitfall: NOT IN (subquery) returns zero rows if the subquery ever returns NULL, because col <> NULL evaluates to UNKNOWN. This is a silent bug. Always use NOT EXISTS.',
        'Semi-join: return left rows where a match EXISTS, without returning right-side columns and without duplicating rows for multiple matches. Use WHERE EXISTS (SELECT 1 …).',
        'Self-join: join the table to itself with two aliases. Classic uses: employee + manager (both in the same Employees table), comparing rows to find adjacent records.',
        'CROSS JOIN: cartesian product, no ON clause. n × m result rows. Useful for generating date/product/size combinations. Always add a WHERE or APPLY to limit the explosion.',
      ],
    },
    {
      heading: 'APPLY (MSSQL) and LATERAL (PostgreSQL)',
      points: [
        'A subquery in FROM normally cannot reference columns from earlier FROM items — it is evaluated independently. APPLY / LATERAL removes this restriction.',
        'CROSS APPLY (MSSQL) / JOIN … ON TRUE (PG LATERAL): evaluates the right-side expression once per left row; excludes left rows where the expression returns no rows (like INNER JOIN).',
        'OUTER APPLY (MSSQL) / LEFT JOIN … ON TRUE (PG LATERAL): same, but keeps left rows even when the right expression returns nothing — NULLs fill the right columns (like LEFT JOIN).',
        'Top-N per group: SELECT … FROM groups g CROSS APPLY (SELECT TOP 3 … FROM detail d WHERE d.group_id = g.group_id ORDER BY …) t — far cleaner than a double-subquery approach.',
        'LATERAL also enables unnesting array/JSON values per row in PostgreSQL: FROM orders o, LATERAL jsonb_array_elements(o.line_items) AS item.',
      ],
    },
    {
      heading: 'Dialect Notes and Performance',
      points: [
        'MSSQL WITH(NOLOCK) table hint: reads without shared locks — allows dirty reads of uncommitted data. Useful for approximate counts and low-priority reporting queries. Never use for financial, inventory, or any query requiring accuracy.',
        'PostgreSQL has no NOLOCK. Use READ COMMITTED isolation (the default) — MVCC ensures readers do not block writers and readers see a consistent snapshot.',
        'Join order matters: put the most selective filter first. Provide up-to-date statistics (UPDATE STATISTICS / ANALYZE) so the optimiser can estimate cardinality correctly.',
        'MSSQL: use sys.dm_exec_query_stats + sys.dm_exec_sql_text to identify costly joins. PostgreSQL: use EXPLAIN (ANALYZE, BUFFERS) to inspect the actual join plan and row estimates.',
        'Implicit comma joins (SELECT … FROM a, b WHERE a.id = b.id) are still supported in both dialects but should be avoided — explicit JOIN syntax is clearer and less error-prone.',
      ],
    },
    {
      heading: 'Join execution algorithms — nested loop, hash join, and merge join',
      points: [
        '<strong>Nested Loop Join</strong>: for each row in the outer (driving) set, the engine probes the inner set via an index. Best when the outer set is small and the inner join column is indexed. O(n) with a good index — the default choice for OLTP point-lookups. If the inner side has no index, it degrades to O(n²) — catastrophic for large tables.',
        '<strong>Hash Join</strong>: the engine builds an in-memory hash table from the smaller (build) input keyed on the join column, then probes it with each row from the larger (probe) input. No pre-sorted input required. Best for large, unindexed inputs or when statistics show the join will return many rows. If the build side exceeds memory, it spills to disk ("hash spill" in MSSQL, "Hash Batches > 1" in PG) — diagnose and add memory or an index.',
        '<strong>Merge Join</strong>: both inputs must be physically sorted on the join key. The engine makes a single linear pass through both sorted streams simultaneously. Extremely fast if both sides are already sorted (e.g., joining on a clustered primary key). If neither is sorted, the engine adds a sort step first — check whether the sort cost outweighs the merge benefit.',
        'The optimiser chooses the algorithm based on: <strong>cardinality estimates</strong> (rows × columns × selectivity from statistics), available memory, indexes on the join column, and whether the inputs are already ordered. Stale statistics → wrong cardinality → wrong algorithm → slow query. Run <code>UPDATE STATISTICS table</code> (MSSQL) or <code>ANALYZE table</code> (PG) when query plans degrade unexpectedly.',
        'Forcing a join algorithm: MSSQL — <code>FROM a INNER HASH JOIN b ON …</code> or <code>INNER LOOP JOIN</code>. PG — <code>SET enable_hashjoin = off</code> / <code>SET enable_nestloop = off</code>. These are diagnostic tools, not production patterns — forcing an algorithm removes the optimiser\'s ability to adapt to data changes. Prefer fixing missing indexes or stale statistics instead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'JOIN types (both)',
      language: 'sql',
      code: `-- Works in both MSSQL and PostgreSQL

-- INNER JOIN: orders that have a matching customer
SELECT o.order_id, c.full_name, o.order_date, o.total_amount
FROM   orders    o
JOIN   customers c ON o.customer_id = c.customer_id
ORDER BY o.order_date DESC;

-- LEFT JOIN: all customers, even those with no orders
SELECT
    c.customer_id, c.full_name,
    COUNT(o.order_id) AS order_count
FROM   customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.full_name
ORDER BY order_count DESC;

-- LEFT JOIN trap — WHERE on right side converts to INNER JOIN:
-- WRONG: filters out customers with no orders
SELECT c.full_name FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status = 'Shipped';     -- eliminates NULL rows → effectively INNER JOIN

-- CORRECT: filter in ON clause to keep all customers
SELECT c.full_name, o.order_id FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status = 'Shipped';

-- FULL OUTER JOIN: all products and all order lines
SELECT p.product_name, ol.order_id
FROM   products   p
FULL JOIN order_lines ol ON p.product_id = ol.product_id
WHERE  p.product_id IS NULL   -- in order_lines but missing from products
    OR ol.order_id  IS NULL;  -- products never ordered`,
    },
    {
      label: 'Anti-join & self-join (both)',
      language: 'sql',
      code: `-- Anti-join: customers who have NEVER placed an order

-- Pattern 1: LEFT JOIN + IS NULL
SELECT c.customer_id, c.full_name
FROM   customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE  o.order_id IS NULL;

-- Pattern 2: NOT EXISTS (preferred — NULL-safe, typically better plan)
SELECT c.customer_id, c.full_name
FROM   customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE  o.customer_id = c.customer_id
);

-- NOT IN DANGER — returns 0 rows if any order has customer_id = NULL:
-- SELECT * FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM orders);
-- ↑ Never use NOT IN unless you can guarantee the subquery column is NOT NULL

-- Semi-join: customers who have placed at least one order (no duplicate rows)
SELECT c.customer_id, c.full_name
FROM   customers c
WHERE  EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

-- Self-join: employees with their manager names
SELECT
    e.employee_id,
    e.full_name  AS employee,
    m.full_name  AS manager,
    e.department
FROM   employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
ORDER BY m.full_name NULLS LAST, e.full_name;`,
    },
    {
      label: 'CROSS APPLY (MSSQL)',
      language: 'sql',
      code: `-- Top 3 most recent orders per customer
SELECT c.customer_id, c.full_name, recent.order_id, recent.order_date, recent.total_amount
FROM   customers c
CROSS APPLY (                              -- excludes customers with 0 orders
    SELECT TOP 3 order_id, order_date, total_amount
    FROM   orders o
    WHERE  o.customer_id = c.customer_id
    ORDER BY order_date DESC
) AS recent;

-- OUTER APPLY: include customers with no orders (NULL columns for missing orders)
SELECT c.customer_id, c.full_name, recent.order_id, recent.order_date
FROM   customers c
OUTER APPLY (
    SELECT TOP 3 order_id, order_date, total_amount
    FROM   orders o
    WHERE  o.customer_id = c.customer_id
    ORDER BY order_date DESC
) AS recent;

-- APPLY with a TVF that returns monthly stats per product
SELECT p.product_id, p.product_name, stats.month, stats.revenue
FROM   products p
CROSS APPLY dbo.fn_MonthlyRevenue(p.product_id, 2024) AS stats;

-- Dirty-read count with NOLOCK (approx reporting only):
SELECT c.category_name, COUNT(*) AS approx_product_count
FROM   categories c WITH(NOLOCK)
JOIN   products   p WITH(NOLOCK) ON p.category_id = c.category_id
GROUP BY c.category_name;`,
    },
    {
      label: 'LATERAL (PostgreSQL)',
      language: 'sql',
      code: `-- Top 3 most recent orders per customer (JOIN LATERAL = CROSS APPLY)
SELECT c.customer_id, c.full_name, recent.order_id, recent.order_date
FROM   customers c
JOIN LATERAL (
    SELECT order_id, order_date, total_amount
    FROM   orders o
    WHERE  o.customer_id = c.customer_id
    ORDER BY order_date DESC
    LIMIT 3
) AS recent ON TRUE;

-- LEFT JOIN LATERAL: include customers with no orders (= OUTER APPLY)
SELECT c.customer_id, c.full_name, recent.order_id, recent.order_date
FROM   customers c
LEFT JOIN LATERAL (
    SELECT order_id, order_date, total_amount
    FROM   orders o
    WHERE  o.customer_id = c.customer_id
    ORDER BY order_date DESC
    LIMIT 3
) AS recent ON TRUE;

-- LATERAL with unnest: expand array tags into individual rows
SELECT p.post_id, p.title, tag
FROM   posts p
CROSS JOIN LATERAL unnest(p.tags) AS tag;  -- tags is TEXT[]

-- LATERAL to extract JSON array elements per row
SELECT o.order_id, item->>'product_id' AS product_id, item->>'qty' AS qty
FROM   orders o
CROSS JOIN LATERAL jsonb_array_elements(o.line_items_json) AS item;`,
    },
    {
      label: 'Multi-table joins & row multiplication',
      language: 'sql',
      code: `-- ── 4-table join: categories → products → order_lines → orders ────────
-- Left-joining all the way so zero-sales categories still appear:
SELECT
    cat.category_name,
    p.product_name,
    COALESCE(SUM(ol.qty * ol.unit_price), 0) AS revenue_2024
FROM   categories  cat
LEFT JOIN products    p  ON p.category_id  = cat.category_id
LEFT JOIN order_lines ol ON ol.product_id  = p.product_id
LEFT JOIN orders      o  ON o.order_id     = ol.order_id
                         AND YEAR(o.order_date) = 2024    -- filter in ON, not WHERE
GROUP BY cat.category_id, cat.category_name, p.product_id, p.product_name
ORDER BY revenue_2024 DESC;

-- ── Row multiplication bug: joining two independent one-to-many tables ──
-- Orders has 3 rows per customer; Addresses has 2 rows per customer
-- WRONG: 3 × 2 = 6 rows per customer (revenue double-counted!)
SELECT c.customer_id, SUM(o.total) AS total_revenue
FROM   customers  c
JOIN   orders     o ON o.customer_id = c.customer_id
JOIN   addresses  a ON a.customer_id = c.customer_id   -- ❌ each order × each address
GROUP BY c.customer_id;

-- FIX A: pre-aggregate in a CTE/subquery before joining
WITH order_totals AS (
    SELECT customer_id, SUM(total) AS total_revenue FROM orders GROUP BY customer_id
),
addr_count AS (
    SELECT customer_id, COUNT(*) AS address_count FROM addresses GROUP BY customer_id
)
SELECT c.customer_id, ot.total_revenue, ac.address_count
FROM   customers   c
JOIN   order_totals ot ON ot.customer_id = c.customer_id
JOIN   addr_count   ac ON ac.customer_id = c.customer_id;

-- FIX B: use separate EXISTS/IN checks instead of joining both tables
SELECT c.customer_id,
       (SELECT SUM(o.total) FROM orders o WHERE o.customer_id = c.customer_id) AS total,
       (SELECT COUNT(*) FROM addresses a WHERE a.customer_id = c.customer_id)  AS addr_count
FROM   customers c;`,
    },
    {
      label: 'Join plan diagnostics',
      language: 'sql',
      code: `-- ── MSSQL: read the execution plan for a slow join ──────────────────
-- Set Statistics I/O to see logical reads per table:
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT o.order_id, c.full_name, SUM(ol.qty * ol.unit_price) AS revenue
FROM   orders o
JOIN   customers   c  ON c.customer_id = o.customer_id
JOIN   order_lines ol ON ol.order_id   = o.order_id
WHERE  o.order_date >= '2024-01-01'
GROUP BY o.order_id, c.full_name;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Find most expensive queries using Hash Joins (index candidate):
SELECT TOP 10
    qs.total_logical_reads / qs.execution_count AS avg_reads,
    qs.execution_count,
    SUBSTRING(st.text, 1, 200) AS sql_text
FROM   sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY avg_reads DESC;

-- ── PostgreSQL: EXPLAIN ANALYZE to read the join algorithm chosen ─────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.order_id, c.full_name, SUM(ol.qty * ol.unit_price) AS revenue
FROM   orders o
JOIN   customers   c  ON c.customer_id = o.customer_id
JOIN   order_lines ol ON ol.order_id   = o.order_id
WHERE  o.order_date >= '2024-01-01'
GROUP BY o.order_id, c.full_name;

-- Plan keywords to watch:
--   Hash Join           → large unindexed inputs; add index or memory if slow
--   Nested Loop         → small outer + indexed inner; fast in OLTP
--   Merge Join          → both sides sorted; fast if already ordered
--   "rows=X loops=Y"    → actual_rows = X × Y; compare to estimated rows for drift
--   "Buffers: hit=N"    → N blocks served from cache (good); "read=N" = disk I/O (costly)`,
    },
  ];

  challenge: Challenge = {
    title: 'Multi-table Sales Report',
    language: 'sql',
    description: 'Write a query across: categories, products, order_lines, orders. Return each category with its 2024 revenue (qty × unit_price), distinct customer count, and order count. Include categories with ZERO sales. Filter the final result to revenue > 1000 OR zero sales.',
    hints: [
      'Start from categories and LEFT JOIN all the way to orders — preserves zero-sales categories',
      'Move the year=2024 filter into the JOIN ON clause, not WHERE, to keep the outer-join behaviour',
      'COALESCE(SUM(…), 0) handles NULL from empty joins',
      'Use HAVING on the aggregated result for the revenue threshold',
    ],
    starterCode: `-- Tables: categories(category_id, category_name)
--         products(product_id, category_id)
--         order_lines(order_id, product_id, qty, unit_price)
--         orders(order_id, customer_id, order_date)

SELECT
    c.category_name,
    /* revenue, customer_count, order_count */
FROM categories c
/* LEFT JOINs */
/* year filter in ON */
GROUP BY c.category_id, c.category_name
/* HAVING */
ORDER BY revenue DESC;`,
    solution: `-- PostgreSQL:
SELECT
    c.category_name,
    COALESCE(SUM(ol.qty * ol.unit_price), 0)  AS revenue,
    COUNT(DISTINCT o.customer_id)              AS customer_count,
    COUNT(DISTINCT o.order_id)                 AS order_count
FROM   categories  c
LEFT JOIN products   p  ON p.category_id  = c.category_id
LEFT JOIN order_lines ol ON ol.product_id  = p.product_id
LEFT JOIN orders     o  ON o.order_id     = ol.order_id
                        AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY c.category_id, c.category_name
HAVING COALESCE(SUM(ol.qty * ol.unit_price), 0) > 1000
    OR COUNT(ol.order_id) = 0
ORDER BY revenue DESC NULLS LAST;

-- MSSQL equivalent (YEAR() instead of EXTRACT, no NULLS LAST):
SELECT
    c.category_name,
    COALESCE(SUM(ol.qty * ol.unit_price), 0)  AS revenue,
    COUNT(DISTINCT o.customer_id)              AS customer_count,
    COUNT(DISTINCT o.order_id)                 AS order_count
FROM   categories  c
LEFT JOIN products   p  ON p.category_id  = c.category_id
LEFT JOIN order_lines ol ON ol.product_id  = p.product_id
LEFT JOIN orders     o  ON o.order_id     = ol.order_id
                        AND YEAR(o.order_date) = 2024
GROUP BY c.category_id, c.category_name
HAVING COALESCE(SUM(ol.qty * ol.unit_price), 0) > 1000
    OR COUNT(ol.order_id) = 0
ORDER BY revenue DESC;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'You write: SELECT c.name FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.status = \'Active\'. Why does this return the same rows as an INNER JOIN?',
      options: [
        'LEFT JOIN and INNER JOIN are identical when both tables have data',
        'WHERE o.status = \'Active\' filters out the NULL rows that LEFT JOIN added for unmatched customers',
        'The ON clause is wrong — it should use USING instead',
        'The query is missing ORDER BY',
      ],
      answer: 1,
      explanation: 'LEFT JOIN first adds NULL rows for customers with no orders. Then WHERE o.status = \'Active\' filters out those NULL rows (NULL = \'Active\' is UNKNOWN, which filters as FALSE). Fix: move the condition to the ON clause: ON c.id = o.customer_id AND o.status = \'Active\'.',
    },
    {
      q: 'Why should NOT EXISTS be preferred over NOT IN for anti-join queries?',
      options: [
        'NOT EXISTS uses less memory',
        'NOT IN returns zero rows if the subquery contains any NULL value',
        'NOT EXISTS is faster in all cases',
        'NOT IN requires an index while NOT EXISTS does not',
      ],
      answer: 1,
      explanation: 'NOT IN (subquery) expands to col <> v1 AND col <> v2 AND …. Any comparison against NULL yields UNKNOWN, making the whole chain UNKNOWN — which is filtered out. NOT EXISTS is NULL-safe because it checks for row existence, not equality.',
    },
    {
      q: 'CROSS APPLY in MSSQL and JOIN LATERAL in PostgreSQL both allow what that a regular subquery cannot?',
      options: [
        'Returning more than one column from the subquery',
        'The right-side subquery can reference columns from the left-side table in the same FROM clause',
        'Joining tables across different schemas',
        'Using aggregate functions without GROUP BY',
      ],
      answer: 1,
      explanation: 'A standard derived-table subquery in FROM is evaluated independently and cannot reference other FROM items. APPLY / LATERAL lifts this restriction, enabling correlated derived tables — the foundation of "top-N per group" and per-row function calls.',
    },
    {
      q: 'A CROSS JOIN between a table of 100 rows and a table of 50 rows produces how many rows?',
      options: ['100', '50', '150', '5 000'],
      answer: 3,
      explanation: 'CROSS JOIN produces a Cartesian product: every row from the left table paired with every row from the right table. 100 × 50 = 5 000 result rows.',
    },
    {
      q: 'In a self-join to display employees with their managers, a CEO has no manager (manager_id IS NULL). Which join type ensures the CEO still appears in the result?',
      options: ['INNER JOIN', 'CROSS JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
      answer: 2,
      explanation: 'LEFT JOIN employees m ON e.manager_id = m.employee_id keeps all employee rows (including the CEO whose manager_id is NULL) and returns NULL in the manager columns where no match exists. INNER JOIN would exclude the CEO.',
    },
    {
      q: 'The optimizer chooses a Hash Join for a large table pair. What is the primary scenario where this is the correct choice?',
      options: [
        'When both inputs are already sorted on the join key',
        'When the outer set is small and the inner join column has a B-tree index',
        'When inputs are large and unindexed, and there is sufficient memory for a hash table',
        'When the query contains a CROSS JOIN',
      ],
      answer: 2,
      explanation: 'Hash Join builds an in-memory hash table from the smaller (build) input and probes it with the larger (probe) input. It requires no pre-sorted data and no index — ideal for large unindexed inputs. If memory is insufficient, it spills to disk. Merge Join needs sorted inputs; Nested Loop needs a small outer set with an indexed inner.',
    },
    {
      q: 'You join Customers (1 row each) to Orders (3 rows per customer) to Addresses (2 rows per customer). Without any aggregation, how many rows does each customer produce?',
      options: [
        '3 rows (one per order)',
        '2 rows (one per address)',
        '5 rows (3 + 2)',
        '6 rows (3 × 2) — row multiplication from joining two independent one-to-many tables',
      ],
      answer: 3,
      explanation: 'Joining two independent one-to-many relationships to the same parent causes row multiplication: each order row pairs with each address row for that customer. 3 orders × 2 addresses = 6 rows. Fix: pre-aggregate one or both sides in a CTE before joining, or use correlated subqueries.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use NOT IN or NOT EXISTS for anti-joins?',
      a: 'Always use NOT EXISTS. NOT IN (subquery) has a silent NULL bug: if the subquery returns even one NULL, the entire NOT IN returns zero rows because col <> NULL evaluates to UNKNOWN. NOT EXISTS checks for row existence and handles NULLs correctly. The optimiser in both MSSQL and PostgreSQL can generate an efficient anti-join plan for NOT EXISTS. The only time NOT IN is safe is when you can guarantee the subquery column is declared NOT NULL and you control the full set of values.',
    },
    {
      q: 'When should I use EXISTS vs INNER JOIN?',
      a: 'Use EXISTS (semi-join) when you only need to know whether a matching row exists and you do not need any columns from the right table. If the right table can have multiple matching rows, INNER JOIN multiplies the left-table rows — EXISTS returns each left row exactly once. Use INNER JOIN when you need columns from both sides or need to aggregate across matched rows. Example: "List customers who have at least one order" → EXISTS. "List customers with their order totals" → INNER JOIN with GROUP BY.',
    },
    {
      q: 'Is WITH(NOLOCK) safe to use in production?',
      a: 'Only for specific, low-stakes use cases. WITH(NOLOCK) reads uncommitted data (dirty reads), which means it can return rows that are later rolled back, miss rows that are being moved by a page split, or read a row twice. These are acceptable for approximate reporting counts or dashboards where slight inaccuracy is fine. They are NEVER acceptable for financial data, inventory, or any query where accuracy matters. A better approach for read-heavy MSSQL systems is to enable RCSI (Read Committed Snapshot Isolation) at the database level — it gives non-blocking reads without dirty data.',
    },
    {
      q: 'What causes "row multiplication" in a multi-table join and how do I fix it?',
      a: 'Row multiplication happens when you join two independent one-to-many tables to the same parent in a single query. Example: Customers → Orders (1:many) and Customers → Addresses (1:many). Joining all three in one query causes each order row to pair with each address row — 3 orders × 2 addresses = 6 rows per customer, which double-counts revenue in SUM(). Fix options: (1) pre-aggregate each one-to-many side into a CTE or subquery before joining (<code>SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id</code>), then join the aggregates to the parent; (2) use correlated scalar subqueries in SELECT instead of joins for the aggregates; (3) use window functions (<code>SUM() OVER (PARTITION BY customer_id)</code>) and DISTINCT — but option 1 is usually the cleanest.',
    },
    {
      q: 'When does the query optimizer choose each join algorithm — nested loop, hash join, or merge join?',
      a: '<strong>Nested Loop</strong>: best when the outer (driving) set is small and the inner join column has an index. The engine probes the index once per outer row. O(n) with an index — the default for OLTP point lookups. <strong>Hash Join</strong>: best for large, unindexed inputs. Builds a hash table from the smaller input; probes it with each row of the larger input. Requires sufficient memory; spills to disk if not. <strong>Merge Join</strong>: requires both inputs to be pre-sorted on the join key. Makes a single linear pass — very fast if inputs are already sorted (e.g., clustered PKs), but adds a sort step cost if not. The optimizer\'s choice is driven by: cardinality estimates from statistics, available indexes, available memory, and whether inputs are ordered. Stale statistics → wrong cardinality → wrong algorithm → slow query. Fix: <code>UPDATE STATISTICS</code> (MSSQL) or <code>ANALYZE</code> (PG).',
    },
    {
      q: 'How do I join tables from two different schemas or across linked servers in MSSQL?',
      a: 'In MSSQL, tables in different schemas within the same database are joined using qualified names: <code>FROM dbo.customers c JOIN sales.orders o ON …</code>. No special syntax needed — the engine resolves schema-qualified names automatically. Across databases on the same server: <code>FROM database1.dbo.customers c JOIN database2.dbo.orders o ON …</code>. Across linked servers (remote databases): <code>FROM [server1].database1.dbo.customers c JOIN [server2].database2.dbo.orders o ON …</code> — but linked-server joins bring the full remote result set to the local server and join it locally; always pre-filter with a WHERE or use <code>OPENQUERY()</code> to push the filter to the remote server. In PostgreSQL, cross-database joins are not natively supported — use foreign data wrappers (postgres_fdw extension) to create foreign tables, then join them normally.',
    },
    {
      q: 'What is the difference between a join ON clause and a USING clause?',
      a: '<code>ON a.customer_id = b.customer_id</code> is the general form — supports any expression, any column name, and works in both MSSQL and PostgreSQL. <code>USING (customer_id)</code> is SQL-standard shorthand that works when both tables have a column with the same name and you want equality; it merges the two columns into one in the output (so the result has one <code>customer_id</code> column, not two). MSSQL supports USING syntax as of 2022+; PostgreSQL has supported it for years. Prefer ON in cross-dialect code or when column names differ. Prefer USING in PostgreSQL when the column names match and you want the cleaner output — it is idiomatic PG and avoids accidentally selecting the same column twice.',
    },
  ];
}
