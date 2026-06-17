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
  selector: 'app-sql-subqueries',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './subqueries.html',
  styleUrl: './subqueries.scss',
})
export class SqlSubqueries {

  quickRef: QuickRefItem[] = [
    { name: 'Scalar subquery',   type: 'syntax',   desc: 'Returns exactly one row, one column; used as a column expression or in WHERE/HAVING', since: 'SQL-92' },
    { name: 'Row subquery',      type: 'syntax',   desc: 'Returns one row with multiple columns; compared with a row constructor', since: 'SQL-92' },
    { name: 'Derived table',     type: 'syntax',   desc: 'Subquery in FROM clause; must be aliased; evaluated once and reused', since: 'SQL-92' },
    { name: 'IN / NOT IN',       type: 'operator', desc: 'Tests membership in subquery result; NOT IN breaks with NULLs in the subquery', since: 'SQL-92' },
    { name: 'EXISTS',            type: 'operator', desc: 'Returns TRUE if the subquery returns at least one row; short-circuits on first match', since: 'SQL-92' },
    { name: 'NOT EXISTS',        type: 'operator', desc: 'Returns TRUE if the subquery returns no rows; NULL-safe unlike NOT IN', since: 'SQL-92' },
    { name: 'ANY / SOME',        type: 'operator', desc: 'TRUE if the comparison holds for at least one subquery value; SOME is a synonym', since: 'SQL-92' },
    { name: 'ALL',               type: 'operator', desc: 'TRUE if the comparison holds for every subquery value; ALL with > means "greater than the maximum"', since: 'SQL-92' },
    { name: 'Correlated',        type: 'syntax',   desc: 'References an outer query column; re-evaluated once per outer row unless optimiser rewrites it', since: 'SQL-92' },
    { name: 'LATERAL / CROSS APPLY', type: 'keyword', desc: 'Allows a subquery in FROM to reference columns from preceding FROM items — runs once per row', since: 'SQL:1999 / MSSQL 2005+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Types of subqueries — scalar, derived, and row',
      points: [
        'A <strong>scalar subquery</strong> returns exactly one row and one column. It can appear anywhere a single value is expected: in SELECT (to compute a per-row lookup), in WHERE (for comparison), in HAVING, or even in ORDER BY. If a scalar subquery returns more than one row the database raises a runtime error — use TOP 1 / LIMIT 1 or EXISTS to guard against this.',
        'A <strong>derived table</strong> (inline view) lives in the FROM clause, must be aliased, and is treated like a regular table for the rest of the query. The engine materialises it once — unlike a correlated subquery that re-executes per row. Derived tables can be joined, filtered, and grouped just like base tables.',
        'A <strong>correlated subquery</strong> references one or more columns from the outer query in its WHERE or HAVING clause. The database re-evaluates the subquery for each row of the outer query (worst case O(n)), though the optimiser frequently rewrites it as a join or semi-join automatically.',
        '<strong>EXISTS / NOT EXISTS</strong> subqueries are implicitly correlated and short-circuit as soon as one row is found — making them efficient for existence checks even without an index, because the inner scan stops immediately. The SELECT list of an EXISTS subquery is irrelevant; <code>SELECT 1</code> is a conventional placeholder.',
        'A <strong>row subquery</strong> (less common) returns one row with multiple columns and is compared using a row constructor: <code>WHERE (col1, col2) = (SELECT a, b FROM T WHERE …)</code>. Supported in PostgreSQL and MySQL; MSSQL requires rewriting as AND conditions.',
      ],
    },
    {
      heading: 'IN vs EXISTS — performance and NULL correctness',
      points: [
        '<code>col IN (SELECT …)</code> materialises the full subquery result set first, then checks membership for each outer row. On large subquery results this can use significant memory. Most modern optimisers rewrite IN as a semi-join with a hash or index lookup, so the performance difference from EXISTS is often negligible.',
        '<code>EXISTS (SELECT 1 FROM … WHERE …)</code> stops scanning as soon as any matching row is found. It is generally preferred for large outer tables because the short-circuit behaviour avoids processing the entire inner set. EXISTS is also the idiomatic choice when the subquery tests for the presence of a relationship.',
        '<strong>Critical NULL trap:</strong> <code>col NOT IN (SELECT col FROM T)</code> returns zero rows if T contains any NULL. This is because NOT IN expands to <code>col &lt;&gt; v1 AND col &lt;&gt; v2 AND … AND col &lt;&gt; NULL</code>. Any comparison with NULL evaluates to UNKNOWN, so the entire expression is UNKNOWN — not TRUE — and the row is excluded. Always use <code>NOT EXISTS</code> or add <code>WHERE col IS NOT NULL</code> to the inner SELECT.',
        'IN is more readable for literal value lists: <code>WHERE status IN (\'active\', \'pending\')</code>. Prefer EXISTS when the inner query is a table reference. The two are semantically interchangeable (for non-NULL cases) and the optimiser typically produces identical plans for both forms.',
        '<strong>ALL</strong> shares the same NULL hazard: <code>col > ALL (SELECT col FROM T)</code> returns false (not true) if T is empty, and returns UNKNOWN if T contains any NULL — mirroring the NOT IN behaviour. Validate inner result sets when using ALL in correctness-sensitive code.',
      ],
    },
    {
      heading: 'Correlated subqueries — mechanics and optimisation',
      points: [
        'A correlated subquery references an outer alias in its WHERE/HAVING. The outer query processes each row, evaluates the subquery (which sees the current outer row), and uses the result for the current row\'s condition. Conceptually it is a nested loop: outer_rows × inner_cost.',
        'The most common pattern is <strong>per-group aggregation</strong>: <code>WHERE price > (SELECT AVG(price) FROM Products p2 WHERE p2.category = p.category)</code>. For each outer row the subquery computes the category average. Window functions (<code>AVG(price) OVER (PARTITION BY category)</code>) are the preferred rewrite when all rows are needed — one pass vs N passes.',
        'Correlated subqueries in the SELECT list are called <strong>scalar aggregate subqueries</strong>. They are convenient for ad-hoc queries but expensive at scale: each row in the result triggers a separate subquery execution. Rewrite as a LEFT JOIN + GROUP BY or a window function for production queries on large tables.',
        'The <strong>APPLY / LATERAL</strong> pattern (see next section) is a correlated subquery generalised to the FROM clause — it returns a table rather than a scalar, which unlocks multi-row, multi-column correlated results.',
        'To diagnose whether the optimiser rewrote a correlated subquery: check the execution plan for a "Nested Loops" node with an inner "Index Seek/Scan" that has an outer reference. If the plan shows a Hash Match or Merge Join, the optimiser transformed it to a join — generally a good sign.',
      ],
    },
    {
      heading: 'ANY, SOME, and ALL quantifiers',
      points: [
        '<code>value &gt; ANY (SELECT col FROM T)</code> returns TRUE if <em>value</em> is greater than at least one value in the subquery result. SOME is an exact synonym for ANY — they are interchangeable. ANY/SOME is semantically equivalent to <code>value IN (SELECT col FROM T)</code> only when the operator is <code>=</code>.',
        '<code>value &gt; ALL (SELECT col FROM T)</code> returns TRUE only if <em>value</em> is greater than every value in the subquery result — equivalent to <code>value &gt; (SELECT MAX(col) FROM T)</code>. This makes ALL useful for "find rows that exceed the maximum" queries without a separate aggregation.',
        'NULL handling: if the subquery result is empty, <code>ALL</code> returns TRUE (vacuous truth — the condition holds for all zero values), while <code>ANY</code> returns FALSE (there is no value for which the condition holds). If any subquery value is NULL, <code>ANY</code> may return UNKNOWN (NULL propagation) and <code>ALL</code> may also return UNKNOWN.',
        'In practice, ANY/ALL with <code>=</code>/<code>&lt;&gt;</code> are rarely used directly — developers write IN/NOT EXISTS instead because they are more readable. ANY/ALL are most useful with inequality operators: <code>&lt; ALL</code> (less than the minimum), <code>&gt; ALL</code> (greater than the maximum).',
        'MSSQL and PostgreSQL both support ANY/ALL. MySQL supports them but has subtle differences in how UNKNOWN propagates. In any dialect, prefer scalar subqueries with MIN/MAX or EXISTS/NOT EXISTS for clarity and predictable NULL behaviour in production code.',
      ],
    },
    {
      heading: 'LATERAL joins (PostgreSQL) and CROSS / OUTER APPLY (MSSQL)',
      points: [
        'A standard subquery in FROM cannot reference columns from other FROM items in the same query — it is evaluated in isolation. <strong>LATERAL</strong> (PostgreSQL) and <strong>CROSS APPLY</strong> (MSSQL) break this restriction: the subquery can reference columns from preceding FROM items, making it a correlated subquery that returns a table rather than a scalar.',
        '<strong>CROSS APPLY / LATERAL JOIN</strong> behaves like an INNER JOIN: if the subquery returns zero rows for an outer row, that outer row is excluded from the result. <strong>OUTER APPLY / LEFT JOIN LATERAL</strong> behaves like a LEFT JOIN: if the subquery returns zero rows, the outer row is retained with NULLs for the subquery columns.',
        'Classic APPLY use case: <strong>top-N per group</strong>. <code>CROSS APPLY (SELECT TOP 3 … FROM Orders o WHERE o.CustomerID = c.CustomerID ORDER BY o.Amount DESC) top3</code> returns the top 3 orders for each customer in a single pass — far simpler than window functions with a filtering CTE when N is a parameter.',
        'APPLY/LATERAL is also used to <strong>call table-valued functions</strong> per row: <code>CROSS APPLY dbo.GetProductDetails(p.ProductID)</code> invokes the TVF once per row in the outer query. This is the idiomatic MSSQL pattern for encapsulating row-level table logic in a reusable function.',
        'Performance: APPLY/LATERAL executes the inner query once per outer row — semantically a nested loop. If the inner query can use an index seek on the outer reference column, this is efficient (index-nested-loop join). If it cannot, consider a regular join with a ROW_NUMBER() CTE as an alternative. Always check the execution plan.',
      ],
    },
    {
      heading: 'Subquery vs CTE vs JOIN — choosing the right tool',
      points: [
        'Use a <strong>subquery in WHERE (EXISTS / IN)</strong> for existence checks and filtering: readability is highest when the logic is "give me rows where something exists/does not exist in another table." The optimiser converts these to semi-joins — the plan is usually equivalent to an explicit JOIN.',
        'Use a <strong>CTE (WITH clause)</strong> when: the same subquery is referenced more than once in the query; the query needs to be readable and maintainable (CTEs are named and self-documenting); or you need recursion. CTEs are NOT necessarily materialised — the optimiser may inline them — but they communicate intent clearly.',
        'Use an explicit <strong>JOIN</strong> when you need columns from both tables in the result (not just a filter), when aggregating across related rows, or when you need LEFT/RIGHT/FULL OUTER semantics. JOINs give the optimiser maximum flexibility to choose between nested loop, hash join, and merge join strategies.',
        '<strong>Avoid scalar subqueries in SELECT on large result sets</strong> — they execute once per row. Rewrite as a LEFT JOIN + GROUP BY or a window function (SUM OVER, AVG OVER). The window function version is a single pass over sorted/partitioned data vs N separate lookups.',
        'Decision heuristic: (1) filtering for existence → EXISTS; (2) need related columns → JOIN; (3) logic reused or recursive → CTE; (4) per-row aggregate → window function (preferred) or correlated scalar (acceptable for small tables). Always check the execution plan — the optimiser often produces identical plans for equivalent forms, so readability should be the tiebreaker.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Scalar & Derived',
      language: 'sql',
      code: `-- ── Scalar subquery in SELECT: per-row lookup ─────────────────────────
SELECT
    ProductName,
    UnitPrice,
    (SELECT AVG(UnitPrice) FROM Products) AS GlobalAvg,
    UnitPrice - (SELECT AVG(UnitPrice) FROM Products) AS Delta
FROM Products;
-- The scalar subquery runs ONCE (non-correlated) and its value is reused per row.
-- Better: use a cross join to a pre-computed value, or a window function.

-- ── Derived table in FROM ──────────────────────────────────────────────
-- Top customers by order count, with additional filtering
SELECT c.CompanyName, co.Orders, co.Total
FROM Customers c
JOIN (
    SELECT CustomerID,
           COUNT(*)       AS Orders,
           SUM(Freight)   AS Total
    FROM Orders
    GROUP BY CustomerID
) AS co ON co.CustomerID = c.CustomerID   -- derived table must be aliased
WHERE co.Orders >= 5
ORDER BY co.Total DESC;

-- ── Scalar subquery in WHERE ───────────────────────────────────────────
-- Products priced above the overall average
SELECT ProductName, UnitPrice
FROM Products
WHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products)  -- scalar: single value
ORDER BY UnitPrice DESC;`,
    },
    {
      label: 'IN vs EXISTS',
      language: 'sql',
      code: `-- ── IN: products that have ever been ordered ──────────────────────────
SELECT ProductName
FROM Products
WHERE ProductID IN (
    SELECT DISTINCT ProductID    -- DISTINCT optional: IN deduplicates automatically
    FROM OrderDetails
);

-- ── EXISTS: equivalent, short-circuits on first match ─────────────────
SELECT ProductName
FROM Products p
WHERE EXISTS (
    SELECT 1                     -- SELECT list is irrelevant for EXISTS
    FROM OrderDetails od
    WHERE od.ProductID = p.ProductID
);

-- ── NOT IN ── DANGER: breaks silently with NULLs ──────────────────────
-- If OrderDetails.ProductID contains any NULL, this returns ZERO rows:
SELECT ProductName
FROM Products
WHERE ProductID NOT IN (SELECT ProductID FROM OrderDetails);
-- Bug: NOT IN expands to ... AND ProductID <> NULL → UNKNOWN → filtered out

-- ── NOT EXISTS: the correct approach ──────────────────────────────────
SELECT ProductName
FROM Products p
WHERE NOT EXISTS (
    SELECT 1
    FROM OrderDetails od
    WHERE od.ProductID = p.ProductID
);
-- Safe: EXISTS never evaluates NULL comparisons in a way that silently drops rows`,
    },
    {
      label: 'Correlated subquery',
      language: 'sql',
      code: `-- ── Per-category above-average products ───────────────────────────────
-- Correlated: inner query sees p.CategoryID from the outer row
SELECT p.ProductName, p.UnitPrice, p.CategoryID
FROM Products p
WHERE p.UnitPrice > (
    SELECT AVG(p2.UnitPrice)
    FROM Products p2
    WHERE p2.CategoryID = p.CategoryID   -- ← outer reference
);
-- Runs once per outer row. For large tables, rewrite with window function below.

-- ── Window function rewrite (preferred for large tables) ───────────────
SELECT ProductName, UnitPrice, CategoryID
FROM (
    SELECT ProductName, UnitPrice, CategoryID,
           AVG(UnitPrice) OVER (PARTITION BY CategoryID) AS CategoryAvg
    FROM Products
) t
WHERE UnitPrice > CategoryAvg;
-- Single scan + partition — far more efficient than per-row correlated subquery.

-- ── Correlated subquery in SELECT (scalar aggregate) ──────────────────
SELECT
    e.EmployeeID,
    e.LastName,
    (SELECT COUNT(*) FROM Orders o WHERE o.EmployeeID = e.EmployeeID) AS OrderCount
FROM Employees e;
-- Runs once per employee. For large datasets prefer a LEFT JOIN + GROUP BY.`,
    },
    {
      label: 'ANY / ALL',
      language: 'sql',
      code: `-- ── ANY: at least one match ───────────────────────────────────────────
-- Products more expensive than at least one product in category 1
SELECT ProductName, UnitPrice
FROM Products
WHERE UnitPrice > ANY (
    SELECT UnitPrice FROM Products WHERE CategoryID = 1
);
-- Equivalent to: WHERE UnitPrice > (SELECT MIN(UnitPrice) FROM Products WHERE CategoryID = 1)

-- ── = ANY: equivalent to IN ────────────────────────────────────────────
SELECT ProductName
FROM Products
WHERE CategoryID = ANY (SELECT CategoryID FROM Categories WHERE CategoryName LIKE 'B%');
-- Exact synonym of: WHERE CategoryID IN (SELECT ...)

-- ── ALL: every value ───────────────────────────────────────────────────
-- Products more expensive than EVERY product in category 1
SELECT ProductName, UnitPrice
FROM Products
WHERE UnitPrice > ALL (
    SELECT UnitPrice FROM Products WHERE CategoryID = 1
);
-- Equivalent to: WHERE UnitPrice > (SELECT MAX(UnitPrice) FROM Products WHERE CategoryID = 1)

-- ── ALL with empty set: returns TRUE (vacuous truth) ──────────────────
-- WHERE price > ALL (SELECT price FROM T WHERE 1=0)  →  always TRUE (no values to fail)
-- WHERE price > ANY (SELECT price FROM T WHERE 1=0)  →  always FALSE (no values to match)

-- ── NULL trap with ALL ─────────────────────────────────────────────────
-- If the subquery returns any NULL, ALL returns UNKNOWN (same as NOT IN):
-- WHERE price > ALL (SELECT NULLIF(price, 0) FROM T)  →  may return 0 rows unexpectedly
-- Fix: add WHERE price IS NOT NULL to the inner subquery`,
    },
    {
      label: 'LATERAL / CROSS APPLY',
      language: 'sql',
      code: `-- ══ PostgreSQL — LATERAL ═════════════════════════════════════════════

-- Top 3 orders per customer (LATERAL can reference c.CustomerID)
SELECT c.CompanyName, o.OrderDate, o.Freight
FROM Customers c
CROSS JOIN LATERAL (
    SELECT OrderDate, Freight
    FROM Orders
    WHERE CustomerID = c.CustomerID   -- ← outer reference: requires LATERAL
    ORDER BY Freight DESC
    LIMIT 3
) o;
-- Without LATERAL, the subquery cannot reference c.CustomerID

-- LEFT JOIN LATERAL: keep customers with zero orders (NULLs for o columns)
SELECT c.CompanyName, o.OrderDate, o.Freight
FROM Customers c
LEFT JOIN LATERAL (
    SELECT OrderDate, Freight
    FROM Orders WHERE CustomerID = c.CustomerID
    ORDER BY Freight DESC LIMIT 3
) o ON TRUE;

-- ══ MSSQL — CROSS APPLY / OUTER APPLY ════════════════════════════════

-- Top 3 orders per customer
SELECT c.CompanyName, o.OrderDate, o.Freight
FROM Customers c
CROSS APPLY (
    SELECT TOP 3 OrderDate, Freight
    FROM Orders
    WHERE CustomerID = c.CustomerID   -- outer reference is natural in APPLY
    ORDER BY Freight DESC
) o;

-- OUTER APPLY: keep customers with no orders
SELECT c.CompanyName, o.OrderDate, o.Freight
FROM Customers c
OUTER APPLY (
    SELECT TOP 3 OrderDate, Freight
    FROM Orders WHERE CustomerID = c.CustomerID
    ORDER BY Freight DESC
) o;

-- APPLY with a table-valued function (idiomatic MSSQL)
SELECT p.ProductID, d.*
FROM Products p
CROSS APPLY dbo.GetPriceHistory(p.ProductID) d;`,
    },
    {
      label: 'Subquery vs CTE vs JOIN',
      language: 'sql',
      code: `-- Scenario: find customers whose total order value exceeds $10,000

-- ── Correlated subquery in WHERE ───────────────────────────────────────
SELECT CompanyName
FROM Customers c
WHERE (SELECT SUM(Freight) FROM Orders o WHERE o.CustomerID = c.CustomerID) > 10000;
-- Readable but runs a separate SUM per customer. Optimiser may cache it.

-- ── Derived table (inline view) ────────────────────────────────────────
SELECT c.CompanyName
FROM Customers c
JOIN (
    SELECT CustomerID, SUM(Freight) AS Total
    FROM Orders
    GROUP BY CustomerID
) agg ON agg.CustomerID = c.CustomerID
WHERE agg.Total > 10000;
-- Pre-aggregates once, then joins. Generally most efficient.

-- ── CTE ────────────────────────────────────────────────────────────────
WITH CustomerTotals AS (
    SELECT CustomerID, SUM(Freight) AS Total
    FROM Orders
    GROUP BY CustomerID
)
SELECT c.CompanyName
FROM Customers c
JOIN CustomerTotals ct ON ct.CustomerID = c.CustomerID
WHERE ct.Total > 10000;
-- Same plan as derived table in most databases; better readability.
-- CTE shines when referenced more than once in the same query.

-- ── Window function (when you need all customers + their totals) ────────
SELECT DISTINCT c.CompanyName,
       SUM(o.Freight) OVER (PARTITION BY o.CustomerID) AS Total
FROM Customers c
JOIN Orders o ON o.CustomerID = c.CustomerID
HAVING SUM(o.Freight) OVER (PARTITION BY o.CustomerID) > 10000;
-- Avoid: use derived table/CTE with HAVING for cleaner aggregation filter.`,
    },
  ];

  challenge: Challenge = {
    title: 'Above-Average Products & Top-3 per Category',
    language: 'sql',
    description: `Using the Products table (ProductID, ProductName, CategoryID, UnitPrice, Discontinued):
<ol>
<li><strong>Part A:</strong> Find all active products (Discontinued = 0) whose UnitPrice is strictly above the average price of their own category. Return ProductName, CategoryID, UnitPrice. Order by CategoryID, then UnitPrice descending.</li>
<li><strong>Part B:</strong> Using CROSS APPLY (MSSQL) or LATERAL (PostgreSQL), return the 3 most expensive active products per category. Return CategoryID, ProductName, UnitPrice.</li>
</ol>`,
    hints: [
      'Part A: correlated subquery in WHERE referencing p.CategoryID; filter Discontinued = 0 in both outer and inner query',
      'Part B (MSSQL): outer query is categories/distinct CategoryIDs; CROSS APPLY subquery filters WHERE CategoryID = c.CategoryID ORDER BY UnitPrice DESC TOP 3',
      'Part B (PostgreSQL): same idea but CROSS JOIN LATERAL with LIMIT 3 instead of TOP 3',
    ],
    starterCode: `-- Part A
SELECT ProductName, CategoryID, UnitPrice
FROM Products p
WHERE Discontinued = 0
  AND UnitPrice > (
    -- correlated subquery: avg price for this product's category
  )
ORDER BY CategoryID, UnitPrice DESC;

-- Part B (MSSQL)
SELECT cat.CategoryID, top3.ProductName, top3.UnitPrice
FROM (SELECT DISTINCT CategoryID FROM Products) cat
CROSS APPLY (
    -- top 3 products for this category
) top3;`,
    solution: `-- Part A
SELECT ProductName, CategoryID, UnitPrice
FROM Products p
WHERE Discontinued = 0
  AND UnitPrice > (
      SELECT AVG(UnitPrice)
      FROM Products p2
      WHERE p2.CategoryID = p.CategoryID
        AND p2.Discontinued = 0
  )
ORDER BY CategoryID, UnitPrice DESC;

-- Part B (MSSQL)
SELECT cat.CategoryID, top3.ProductName, top3.UnitPrice
FROM (SELECT DISTINCT CategoryID FROM Products WHERE Discontinued = 0) cat
CROSS APPLY (
    SELECT TOP 3 ProductName, UnitPrice
    FROM Products p
    WHERE p.CategoryID = cat.CategoryID
      AND p.Discontinued = 0
    ORDER BY UnitPrice DESC
) top3
ORDER BY cat.CategoryID, top3.UnitPrice DESC;

-- Part B (PostgreSQL)
SELECT cat.CategoryID, top3.ProductName, top3.UnitPrice
FROM (SELECT DISTINCT CategoryID FROM Products WHERE Discontinued = false) cat
CROSS JOIN LATERAL (
    SELECT ProductName, UnitPrice
    FROM Products p
    WHERE p.CategoryID = cat.CategoryID
      AND p.Discontinued = false
    ORDER BY UnitPrice DESC
    LIMIT 3
) top3
ORDER BY cat.CategoryID, top3.UnitPrice DESC;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens if a scalar subquery returns more than one row?',
      options: [
        'It returns the first row silently',
        'A runtime error occurs — scalar subquery must return exactly one row',
        'It returns NULL',
        'It is treated as an IN subquery automatically',
      ],
      answer: 1,
      explanation: 'A scalar subquery is expected to return exactly one row and one column. If it returns multiple rows, the database raises a runtime error ("subquery returns more than one row" in PostgreSQL; "subquery returned more than 1 value" in MSSQL). Guard with TOP 1 / LIMIT 1 or rewrite as EXISTS.',
    },
    {
      q: 'Why does `col NOT IN (SELECT col FROM T)` return no rows when T contains a NULL?',
      options: [
        'NULL means the subquery is empty and IN returns FALSE for empty sets',
        'NOT IN expands to col <> v1 AND col <> v2 … AND col <> NULL; comparison with NULL yields UNKNOWN, so every row is filtered out',
        'Databases treat NULL as 0 in numeric comparisons inside NOT IN',
        'NOT IN with a subquery is not supported — it requires a literal list',
      ],
      answer: 1,
      explanation: 'NOT IN reduces to a chain of col <> v AND col <> NULL …. Any comparison with NULL (other than IS NULL) evaluates to UNKNOWN. Since UNKNOWN AND anything is UNKNOWN or FALSE, the predicate never evaluates to TRUE and all rows are excluded. Use NOT EXISTS or add WHERE col IS NOT NULL to the inner SELECT to fix this.',
    },
    {
      q: 'A correlated subquery in the WHERE clause of a 50,000-row outer query runs how many times in the worst case?',
      options: [
        'Once — it is evaluated at parse time',
        '50,000 times — once per outer row',
        'Twice — once for NULLs and once for non-NULL values',
        'Depends only on the SELECT list of the outer query',
      ],
      answer: 1,
      explanation: 'A correlated subquery references an outer column, so it must be re-evaluated once per outer row in its naive form. For a 50,000-row outer table it executes 50,000 times. The optimiser often transforms this into a join (hash or index), but you cannot rely on it — verify with the execution plan.',
    },
    {
      q: 'Which is the safest way to check that NO rows exist in a related table?',
      options: [
        'col NOT IN (SELECT col FROM T)',
        'NOT EXISTS (SELECT 1 FROM T WHERE join_condition)',
        'COUNT(*) = 0 in a correlated scalar subquery',
        'LEFT JOIN T ON join_condition WHERE T.col IS NULL',
      ],
      answer: 1,
      explanation: 'NOT EXISTS is correct even when the inner table contains NULLs — EXISTS checks only for row presence, not column values. NOT IN breaks silently with NULLs (returns zero rows). LEFT JOIN + IS NULL is also correct but requires a join. COUNT(*) = 0 in a correlated subquery is functionally correct but less efficient (full inner scan vs EXISTS short-circuit).',
    },
    {
      q: 'What does `price > ALL (SELECT price FROM T WHERE category = 1)` return when T is empty?',
      options: [
        'FALSE — there are no prices to be greater than',
        'TRUE — vacuous truth: the condition holds for all zero values in the empty set',
        'NULL — ALL with an empty set propagates NULL',
        'A runtime error — ALL requires at least one row',
      ],
      answer: 1,
      explanation: 'ALL follows vacuous truth logic: "x is greater than all values in an empty set" is trivially TRUE because there are no counterexamples. This is the opposite of ANY: "x is greater than some value in an empty set" is FALSE (no values to satisfy it). This behaviour can cause surprising results when filtering with ALL on an empty subquery result.',
    },
    {
      q: 'What is the key difference between CROSS APPLY and OUTER APPLY (MSSQL)?',
      options: [
        'CROSS APPLY sorts the result; OUTER APPLY does not',
        'CROSS APPLY excludes outer rows where the applied subquery returns zero rows; OUTER APPLY retains them with NULLs',
        'CROSS APPLY can reference outer columns; OUTER APPLY cannot',
        'OUTER APPLY only works with table-valued functions, not inline subqueries',
      ],
      answer: 1,
      explanation: 'CROSS APPLY behaves like INNER JOIN: if the inner subquery/function returns zero rows for an outer row, that outer row is dropped from the result. OUTER APPLY behaves like LEFT JOIN: the outer row is retained with NULLs for all inner columns. Choose OUTER APPLY when you need to keep all outer rows even without a match — for example, to see customers with no orders.',
    },
    {
      q: 'When should you prefer a CTE (WITH clause) over a derived table (inline subquery in FROM)?',
      options: [
        'CTEs are always faster because the database materialises them once',
        'When the same subquery result must be referenced more than once in the query, or when readability and self-documentation are priorities',
        'Derived tables cannot be aliased, so CTEs are required for joining',
        'CTEs support indexes; derived tables do not',
      ],
      answer: 1,
      explanation: 'CTEs and derived tables produce equivalent query plans in most databases — the optimiser inlines both. Choose a CTE when: (1) the same result is referenced more than once (DRY); (2) the query needs to be readable and self-explanatory; (3) you need recursion. Derived tables are fine for single-use inline logic. Neither is inherently faster — verify with the execution plan if performance matters.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I prefer a subquery over a JOIN?',
      a: 'Subqueries in WHERE (EXISTS / NOT EXISTS / IN) are natural for existence checks when you only need columns from the outer table. Scalar subqueries in SELECT are readable for one-off per-row lookups. For returning columns from both tables, aggregating across related rows, or LEFT/FULL OUTER semantics, use explicit JOINs. The optimiser frequently rewrites EXISTS as a semi-join and IN as a hash join, producing equivalent plans — readability should guide the choice.',
    },
    {
      q: 'What is the difference between a derived table and a CTE?',
      a: 'A derived table is an inline subquery in FROM — it cannot be referenced more than once and has no name outside its query. A CTE (<code>WITH name AS (…)</code>) is named and can be referenced multiple times in the same query and supports recursion. Most databases inline CTEs (treat them like derived tables) unless explicitly instructed to materialise — so the plan is usually identical. Prefer CTEs for readability and when the result is reused; derived tables for single-use inline logic.',
    },
    {
      q: 'Can a subquery appear in the FROM clause and the SELECT clause simultaneously?',
      a: 'Yes. You can have a derived table in FROM for joining/aggregating, and separate scalar subqueries in the SELECT list for per-row lookups. The only constraint is that scalar subqueries in SELECT must return exactly one row and one column. The execution engine evaluates them independently: the derived table once (or as a join), the scalar subqueries once per result row.',
    },
    {
      q: 'What is a non-correlated subquery and how does it differ from a correlated one?',
      a: 'A non-correlated (independent) subquery contains no reference to the outer query. The engine evaluates it once, caches the result, and reuses it for every outer row — e.g. <code>WHERE price &gt; (SELECT AVG(price) FROM Products)</code>. A correlated subquery references at least one outer column, so it must re-execute for each outer row. Non-correlated subqueries are inherently cheaper; correlated subqueries enable per-row logic that non-correlated ones cannot express.',
    },
    {
      q: 'Why is LATERAL / CROSS APPLY needed when correlated subqueries in WHERE already exist?',
      a: 'A correlated subquery in WHERE returns a scalar or a boolean — it cannot return multiple rows and columns as part of the result set. LATERAL / CROSS APPLY extends the correlated pattern to the FROM clause, allowing the inner query to return a full table (multiple rows and columns) that is then joined to the outer query. This enables "top-N per group" patterns and calling table-valued functions with per-row arguments — impossible to express cleanly with only WHERE subqueries.',
    },
    {
      q: 'When does a correlated scalar subquery in SELECT become a problem, and how do I fix it?',
      a: 'A scalar subquery in SELECT runs once per row in the result set. For a query returning 100,000 rows with a subquery that aggregates 1,000 rows each, that is 100,000 × 1,000 = 100 million rows scanned. Fix with one of three approaches: (1) <strong>Window function</strong> — <code>SUM(col) OVER (PARTITION BY key)</code> computes in a single pass; (2) <strong>LEFT JOIN + GROUP BY</strong> — pre-aggregate in a derived table/CTE and join once; (3) <strong>OUTER APPLY / LATERAL</strong> — for multi-column correlated results. Always check the execution plan after rewriting.',
    },
    {
      q: 'Can `= ANY` be used instead of IN, and are they always equivalent?',
      a: '<code>col = ANY (SELECT val FROM T)</code> is logically equivalent to <code>col IN (SELECT val FROM T)</code> for non-NULL values. The difference is NULL handling: <code>IN</code> and <code>= ANY</code> both return UNKNOWN when col is NULL (consistent). However, their NULL propagation when the <em>subquery</em> returns NULLs is identical — both can leave rows filtered if the subquery contains NULLs and the operator is <code>&lt;&gt;</code>. In practice they produce the same execution plan; choose whichever reads more clearly.',
    },
  ];
}
