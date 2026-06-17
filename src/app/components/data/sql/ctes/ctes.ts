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
  selector: 'app-sql-ctes',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './ctes.html',
  styleUrl: './ctes.scss',
})
export class SqlCtes {

  quickRef: QuickRefItem[] = [
    { name: 'WITH cte AS (...)',    type: 'syntax',  desc: 'Defines a named CTE; referenced in the following SELECT/INSERT/UPDATE/DELETE', since: 'SQL:1999' },
    { name: 'Multiple CTEs',        type: 'syntax',  desc: 'Comma-separated: WITH a AS (...), b AS (...) SELECT ... — each can reference previous CTEs', since: 'SQL:1999' },
    { name: 'Recursive CTE',        type: 'syntax',  desc: 'WITH RECURSIVE (PostgreSQL) or plain WITH (MSSQL) — uses UNION ALL with a self-reference', since: 'SQL:1999' },
    { name: 'Anchor member',        type: 'syntax',  desc: 'First SELECT in a recursive CTE — the base case; runs exactly once to seed the result set', since: 'SQL:1999' },
    { name: 'Recursive member',     type: 'syntax',  desc: 'Second SELECT references the CTE itself; runs repeatedly until it returns zero rows', since: 'SQL:1999' },
    { name: 'MAXRECURSION',         type: 'keyword', desc: 'MSSQL query hint: OPTION (MAXRECURSION 100) — prevents infinite loops; default is 100, 0 = unlimited', since: 'MSSQL 2005' },
    { name: 'NOT MATERIALIZED',     type: 'keyword', desc: 'PostgreSQL 12+: hint to inline the CTE rather than materialise it — enables predicate push-down', since: 'PostgreSQL 12' },
    { name: 'MATERIALIZED',         type: 'keyword', desc: 'PostgreSQL 12+: force the CTE to be evaluated once and cached — useful when referenced multiple times', since: 'PostgreSQL 12' },
    { name: 'CTE in DML',           type: 'syntax',  desc: 'CTEs can precede UPDATE/DELETE/INSERT for readable multi-step data changes', since: 'SQL:1999' },
    { name: 'WITH TIES',            type: 'keyword', desc: 'Used with TOP or FETCH FIRST in the outer query when ranking CTEs to include tied rows', since: 'SQL:2003' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CTE fundamentals — structure, scope, and readability',
      points: [
        'A <strong>Common Table Expression (CTE)</strong> is a named temporary result set defined at the top of a query with the <code>WITH</code> keyword. It exists only for the duration of the single statement that follows it — it is not stored, not indexed, and not visible to other queries.',
        'The primary purpose of a CTE is <strong>readability</strong>: replacing deeply nested subqueries with named, self-documenting logical steps. A query with three CTEs reads like a recipe — step 1, step 2, step 3 — rather than a nested Russian doll of anonymous subqueries.',
        'Multiple CTEs are separated by commas in a single <code>WITH</code> clause: <code>WITH a AS (…), b AS (…), c AS (…) SELECT … FROM c</code>. Later CTEs can freely reference earlier ones, enabling multi-step pipeline queries. All CTEs in the clause share the same scope.',
        'CTEs can precede not only SELECT but also <strong>INSERT, UPDATE, and DELETE</strong> statements — enabling clean multi-step data-modification operations without intermediate temp tables. This is a common interview question ("can you use a CTE with DML?").',
        'A CTE is equivalent to an inline view or derived table at the query optimizer\'s level — both are syntactic mechanisms, not physical storage. The key difference from a derived table: a CTE can be referenced <em>by name</em> more than once in the same statement, avoiding repeated copy-paste of the same subquery.',
      ],
    },
    {
      heading: 'Recursive CTEs — hierarchies, graphs, and sequences',
      points: [
        'A recursive CTE contains two parts joined by <code>UNION ALL</code>: the <strong>anchor member</strong> (base case) runs once to seed the result; the <strong>recursive member</strong> references the CTE itself and runs repeatedly until it produces zero rows. Recursion terminates naturally on an empty result — no explicit STOP keyword exists.',
        'Common use cases: <strong>org charts</strong> (employee → manager chain), <strong>folder/category hierarchies</strong> (find all subcategories of a parent), <strong>bill-of-materials</strong> (explode a part into its sub-components), <strong>graph path finding</strong> (shortest path between nodes), and <strong>number/date series generation</strong> (produce a sequence of integers or calendar dates without a loop).',
        'In <strong>PostgreSQL</strong>, the <code>RECURSIVE</code> keyword is mandatory: <code>WITH RECURSIVE cte AS (…)</code>. In <strong>SQL Server</strong>, the self-reference is automatically detected — plain <code>WITH</code> is used. This syntax difference is a common cross-platform gotcha.',
        '<strong>Guard against infinite recursion</strong>: in SQL Server, add <code>OPTION (MAXRECURSION N)</code> — default 100, set to 0 for unlimited (with a WHERE Level &lt; N guard in the recursive member instead). In PostgreSQL, the recursive member stops naturally when it returns zero rows — add a depth counter and <code>WHERE depth &lt; 100</code> as a safety bound.',
        'The recursive member has important restrictions: it <strong>cannot</strong> use <code>DISTINCT</code>, <code>GROUP BY</code>, <code>HAVING</code>, <code>TOP</code>/<code>LIMIT</code>, aggregate functions, or outer joins that reference the recursive part. It also cannot reference the CTE itself more than once. All of these are enforced at parse time.',
      ],
    },
    {
      heading: 'Materialisation, inlining, and performance characteristics',
      points: [
        'In <strong>PostgreSQL ≤ 11</strong>, CTEs were always <em>materialised</em> (evaluated once, stored in a temporary structure, reused for each reference). From <strong>PostgreSQL 12</strong>, the optimiser can <em>inline</em> a CTE (treat it like a subquery and push predicates inside it). Use <code>MATERIALIZED</code> to force caching, <code>NOT MATERIALIZED</code> to force inlining.',
        'In <strong>SQL Server</strong>, CTEs are <em>not guaranteed to materialise</em>. If a CTE is referenced multiple times in the same query, SQL Server may execute it multiple times — each reference becomes an independent subquery evaluation. This is a performance trap: a CTE with an expensive aggregation referenced 3 times runs the aggregation 3 times.',
        'The materialisation vs inlining distinction matters most for <strong>predicate push-down</strong>: an inlined CTE lets the optimiser push a <code>WHERE CustomerID = 5</code> from the outer query into the CTE\'s inner query, using an index. A materialised CTE evaluates first (without the predicate), then filters externally — full scan, then filter.',
        'When a CTE is expensive (large aggregation, complex join) and referenced multiple times in a single statement, consider a <strong>temp table</strong> (<code>#temp</code> in MSSQL, <code>CREATE TEMP TABLE</code> in PostgreSQL) — it physically materialises once, can be indexed, and is reused cheaply. The tradeoff: temp tables add transaction log overhead and are session-scoped.',
        'Use <strong>execution plans</strong> (SET STATISTICS IO ON / EXPLAIN ANALYZE) to measure actual behaviour. The theoretical materialisation rule is a starting point — always verify with the plan, especially on large datasets where the difference between one scan and N scans is significant.',
      ],
    },
    {
      heading: 'CTE chaining and multi-step pipeline patterns',
      points: [
        'CTE chaining is the most powerful pattern: each CTE transforms the output of the previous one — like a Unix pipe or a data pipeline. <code>WITH raw AS (…), cleaned AS (SELECT … FROM raw), ranked AS (SELECT … FROM cleaned) SELECT … FROM ranked</code>. Each step has a name, making the logic easy to follow and debug.',
        'A chain of CTEs lets you <strong>apply window functions progressively</strong>: the first CTE computes raw aggregates, the second applies RANK() or DENSE_RANK() over those aggregates, the third filters to top-N. Doing all of this in a single SELECT would require nested aggregations or subqueries — the CTE version is flat and readable.',
        '<strong>Debugging a CTE chain</strong>: temporarily change the final SELECT to reference an intermediate CTE instead of the last one. Since all CTEs in the WITH clause are in scope for the final statement, you can isolate and inspect any step without restructuring the query.',
        'CTEs work well with <strong>ROW_NUMBER() for deduplication</strong> and <strong>LAG/LEAD for gap analysis</strong>: <code>WITH numbered AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY key ORDER BY id) AS rn FROM T) DELETE FROM numbered WHERE rn > 1</code> — a concise, readable duplicate-removal pattern.',
        'For <strong>pivot/unpivot transformations</strong>, CTEs prepare the data before the final PIVOT/UNPIVOT clause (MSSQL) or crosstab function (PostgreSQL). Pre-aggregating in a CTE ensures the PIVOT sees clean, pre-grouped input, avoiding the double-aggregation trap.',
      ],
    },
    {
      heading: 'CTE vs subquery vs temp table — choosing the right tool',
      points: [
        'Use a <strong>CTE</strong> when: the logic is complex enough to name and document; the result is referenced more than once (avoiding duplication); you need recursion; or you are preceding a DML statement. CTEs signal intent to future readers — "this is a named logical step."',
        'Use a <strong>derived table (inline subquery in FROM)</strong> when: the logic is simple, single-use, and inline is readable enough. Derived tables are slightly less verbose for one-off subqueries and behave identically to CTEs from the optimiser\'s perspective in most databases.',
        'Use a <strong>temp table</strong> when: the intermediate result set is large and referenced more than once (avoiding re-execution); the result needs an index for subsequent lookups; the result is shared across multiple separate statements (CTEs exist only within one statement); or the result is needed in a stored procedure loop.',
        'Use a <strong>table variable (@T in MSSQL)</strong> for small intermediate sets (&lt;1,000 rows) within a stored procedure when transaction logging overhead of a #temp table matters. Table variables do not participate in rollbacks the same way #temp tables do — an important difference in error-handling scenarios.',
        'The heuristic: <strong>CTE for readability and single-statement pipelines, temp table for performance when data is large or referenced across statements, derived table for simple single-use inline logic.</strong> All three can produce the same query plan — verify with EXPLAIN/execution plan when performance matters.',
      ],
    },
    {
      heading: 'Common CTE mistakes and anti-patterns',
      points: [
        '<strong>Referencing a CTE multiple times expecting single execution (SQL Server)</strong>: if a CTE is expensive and referenced twice, SQL Server executes it twice. Verify with the execution plan — if you see the same subtree repeated, materialise into a #temp table instead.',
        '<strong>Using UNION instead of UNION ALL in the recursive member</strong>: UNION deduplicates, which is not supported in recursive CTEs in most databases (SQL Server rejects it with an error; PostgreSQL silently or with error). Always use UNION ALL between the anchor and recursive members. If you need deduplication, apply DISTINCT in the final outer SELECT.',
        '<strong>Forgetting the RECURSIVE keyword in PostgreSQL</strong>: a self-referential CTE without <code>RECURSIVE</code> in PostgreSQL raises an error ("relation does not exist"). SQL Server auto-detects self-references. Always add the keyword in cross-platform queries.',
        '<strong>Building CTEs that could simply be a view</strong>: if the same CTE appears in multiple queries across the codebase, extract it into a view. A CTE is scoped to one statement — if you copy-paste it, it becomes a maintenance liability. Views are reusable and can be indexed (materialised views in PostgreSQL, indexed views in MSSQL).',
        '<strong>Overusing CTEs for simple queries</strong>: wrapping a trivial SELECT in a CTE adds syntactic noise without readability benefit. The rule of thumb: if removing the CTE name and inlining the subquery makes the query equally readable, skip the CTE. Use it when the name genuinely adds meaning.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic & Multi-CTE',
      language: 'sql',
      code: `-- ── Single CTE for readability ────────────────────────────────────────
WITH HighValueOrders AS (
    SELECT o.OrderID, o.CustomerID,
           SUM(od.UnitPrice * od.Quantity) AS Total
    FROM [Order Details] od
    JOIN Orders o ON od.OrderID = o.OrderID
    GROUP BY o.OrderID, o.CustomerID
    HAVING SUM(od.UnitPrice * od.Quantity) > 1000
)
SELECT c.CompanyName, h.Total
FROM HighValueOrders h
JOIN Customers c ON h.CustomerID = c.CustomerID
ORDER BY h.Total DESC;

-- ── Chained CTEs: each step transforms the previous ───────────────────
WITH
  MonthlySales AS (
      SELECT
          YEAR(OrderDate)  AS Yr,
          MONTH(OrderDate) AS Mo,
          SUM(Freight)     AS Rev
      FROM Orders
      GROUP BY YEAR(OrderDate), MONTH(OrderDate)
  ),
  RankedMonths AS (
      SELECT *,
             RANK() OVER (PARTITION BY Yr ORDER BY Rev DESC) AS MonthRank
      FROM MonthlySales
  )
-- Final SELECT can reference any CTE in the clause
SELECT Yr, Mo, Rev
FROM RankedMonths
WHERE MonthRank = 1     -- best month per year
ORDER BY Yr;`,
    },
    {
      label: 'Recursive CTE',
      language: 'sql',
      code: `-- ── Employee org-chart: all reports under EmployeeID 2 ───────────────
-- MSSQL: no RECURSIVE keyword; SQL Server detects the self-reference
WITH EmployeeTree AS (
    -- Anchor member: base case — start from the root
    SELECT EmployeeID, LastName, ReportsTo, 0 AS Depth
    FROM Employees
    WHERE EmployeeID = 2

    UNION ALL     -- MUST be UNION ALL, not UNION

    -- Recursive member: find direct reports of each current row
    SELECT e.EmployeeID, e.LastName, e.ReportsTo, t.Depth + 1
    FROM Employees e
    INNER JOIN EmployeeTree t ON e.ReportsTo = t.EmployeeID
    WHERE t.Depth < 10       -- safety guard against cycles
)
SELECT EmployeeID, REPLICATE('  ', Depth) + LastName AS IndentedName, Depth
FROM EmployeeTree
ORDER BY Depth, LastName
OPTION (MAXRECURSION 50);   -- MSSQL: cap recursion depth

-- PostgreSQL equivalent (WITH RECURSIVE is mandatory):
-- WITH RECURSIVE EmployeeTree AS (
--     SELECT EmployeeID, LastName, ReportsTo, 0 AS Depth
--     FROM Employees WHERE EmployeeID = 2
--     UNION ALL
--     SELECT e.EmployeeID, e.LastName, e.ReportsTo, t.Depth + 1
--     FROM Employees e JOIN EmployeeTree t ON e.ReportsTo = t.EmployeeID
--     WHERE t.Depth < 10
-- )
-- SELECT * FROM EmployeeTree ORDER BY Depth;`,
    },
    {
      label: 'Recursive — Number Series',
      language: 'sql',
      code: `-- ── Generate a number sequence 1..100 (MSSQL) ────────────────────────
WITH Numbers AS (
    SELECT 1 AS n            -- anchor: seed value
    UNION ALL
    SELECT n + 1
    FROM Numbers
    WHERE n < 100            -- termination condition
)
SELECT n FROM Numbers
OPTION (MAXRECURSION 100);

-- ── Generate a date range for reporting ───────────────────────────────
-- All calendar dates in 2024 (MSSQL)
WITH Calendar AS (
    SELECT CAST('2024-01-01' AS DATE) AS dt
    UNION ALL
    SELECT DATEADD(DAY, 1, dt)
    FROM Calendar
    WHERE dt < '2024-12-31'
)
SELECT dt FROM Calendar
OPTION (MAXRECURSION 366);

-- PostgreSQL: use generate_series() instead (built-in, more efficient)
SELECT generate_series(
    '2024-01-01'::DATE,
    '2024-12-31'::DATE,
    INTERVAL '1 day'
)::DATE AS dt;

-- ── Path accumulation (find full path for category hierarchy) ──────────
WITH CategoryPath AS (
    SELECT CategoryID, CategoryName, ParentID,
           CAST(CategoryName AS VARCHAR(500)) AS FullPath
    FROM Categories WHERE ParentID IS NULL     -- root nodes

    UNION ALL

    SELECT c.CategoryID, c.CategoryName, c.ParentID,
           CAST(p.FullPath + ' > ' + c.CategoryName AS VARCHAR(500))
    FROM Categories c
    JOIN CategoryPath p ON c.ParentID = p.CategoryID
)
SELECT * FROM CategoryPath ORDER BY FullPath;`,
    },
    {
      label: 'CTE in UPDATE / DELETE',
      language: 'sql',
      code: `-- ── Delete duplicates — keep the row with the lowest ID ───────────────
WITH Duplicates AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email       -- duplicate key
               ORDER BY CustomerID ASC  -- keep first (lowest ID)
           ) AS rn
    FROM Customers
)
DELETE FROM Duplicates WHERE rn > 1;
-- CTE targets a single base table → DELETE/UPDATE is allowed

-- ── Batch update with a staging CTE ───────────────────────────────────
WITH PriceAdjustments AS (
    SELECT ProductID, UnitPrice * 1.10 AS NewPrice
    FROM Products
    WHERE CategoryID = 1
      AND Discontinued = 0
)
UPDATE p
SET p.UnitPrice = a.NewPrice
FROM Products p
JOIN PriceAdjustments a ON p.ProductID = a.ProductID;

-- ── Insert from a CTE (de-duplicate before inserting) ─────────────────
WITH NewRecords AS (
    SELECT DISTINCT CustomerID, ProductID
    FROM StagingImport si
    WHERE NOT EXISTS (
        SELECT 1 FROM Orders o
        WHERE o.CustomerID = si.CustomerID
          AND o.ProductID  = si.ProductID
    )
)
INSERT INTO Orders (CustomerID, ProductID, OrderDate)
SELECT CustomerID, ProductID, GETDATE()
FROM NewRecords;`,
    },
    {
      label: 'CTE with Window Functions',
      language: 'sql',
      code: `-- ── Deduplication with ROW_NUMBER ─────────────────────────────────────
WITH RankedOrders AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY CustomerID
               ORDER BY OrderDate DESC    -- keep most recent order per customer
           ) AS rn
    FROM Orders
)
SELECT CustomerID, OrderDate, Freight
FROM RankedOrders
WHERE rn = 1;

-- ── Running total and month-over-month growth ─────────────────────────
WITH MonthlySales AS (
    SELECT
        FORMAT(OrderDate, 'yyyy-MM') AS Month,
        SUM(Freight)                  AS Revenue
    FROM Orders
    GROUP BY FORMAT(OrderDate, 'yyyy-MM')
),
WithGrowth AS (
    SELECT
        Month, Revenue,
        SUM(Revenue) OVER (ORDER BY Month) AS RunningTotal,
        LAG(Revenue)  OVER (ORDER BY Month) AS PrevRevenue,
        ROUND(100.0 * (Revenue - LAG(Revenue) OVER (ORDER BY Month))
              / NULLIF(LAG(Revenue) OVER (ORDER BY Month), 0), 1) AS GrowthPct
    FROM MonthlySales
)
SELECT * FROM WithGrowth ORDER BY Month;

-- ── Top-N per group with DENSE_RANK ───────────────────────────────────
WITH RankedProducts AS (
    SELECT
        CategoryID, ProductName, UnitPrice,
        DENSE_RANK() OVER (
            PARTITION BY CategoryID
            ORDER BY UnitPrice DESC
        ) AS PriceRank
    FROM Products
    WHERE Discontinued = 0
)
SELECT CategoryID, ProductName, UnitPrice, PriceRank
FROM RankedProducts
WHERE PriceRank <= 3
ORDER BY CategoryID, PriceRank;`,
    },
    {
      label: 'CTE vs Temp Table',
      language: 'sql',
      code: `-- ── CTE: referenced once, no overhead ────────────────────────────────
WITH RecentOrders AS (
    SELECT CustomerID, COUNT(*) AS OrderCount
    FROM Orders
    WHERE OrderDate >= DATEADD(YEAR, -1, GETDATE())
    GROUP BY CustomerID
)
SELECT c.CompanyName, ro.OrderCount
FROM Customers c
JOIN RecentOrders ro ON ro.CustomerID = c.CustomerID
WHERE ro.OrderCount > 5;

-- ── CTE referenced TWICE — may execute twice in SQL Server ────────────
WITH ExpensiveAggregation AS (
    SELECT CustomerID,
           SUM(Freight)  AS TotalFreight,
           COUNT(*)       AS OrderCount
    FROM Orders
    GROUP BY CustomerID   -- imagine this scans 10M rows
)
SELECT ea1.CustomerID, ea1.TotalFreight
FROM ExpensiveAggregation ea1              -- reference 1: may re-execute
WHERE ea1.TotalFreight > (
    SELECT AVG(TotalFreight) FROM ExpensiveAggregation  -- reference 2: may re-execute
);

-- ── Temp table: materialise once, reference many times ────────────────
-- Use when the CTE is expensive AND referenced more than once:
SELECT CustomerID,
       SUM(Freight)  AS TotalFreight,
       COUNT(*)       AS OrderCount
INTO #CustomerStats                        -- materialised once
FROM Orders
GROUP BY CustomerID;

CREATE INDEX IX_CustomerStats ON #CustomerStats (CustomerID);  -- indexable!

SELECT cs.CustomerID, cs.TotalFreight
FROM #CustomerStats cs
WHERE cs.TotalFreight > (SELECT AVG(TotalFreight) FROM #CustomerStats);  -- single scan

DROP TABLE #CustomerStats;                 -- clean up`,
    },
  ];

  challenge: Challenge = {
    title: 'Category Revenue Ranking & YoY Growth',
    language: 'sql',
    description: `Using Orders, Order Details, Products, and Categories:
<ol>
<li><strong>Part A:</strong> Use two chained CTEs — first compute total revenue per category, then rank categories by revenue. Return CategoryName, Revenue, and Rank for the top 3.</li>
<li><strong>Part B (bonus):</strong> Add a third CTE that uses LAG() to compute year-over-year revenue change for each category. Show CategoryName, Revenue, PrevYearRevenue, and GrowthPct.</li>
</ol>`,
    hints: [
      'Part A, CTE 1: join Order Details → Products → Categories, SUM(Quantity × UnitPrice) GROUP BY category',
      'Part A, CTE 2: apply RANK() OVER (ORDER BY Revenue DESC) to the first CTE',
      'Part A, final SELECT: WHERE Rank <= 3',
      'Part B, CTE 3: add YEAR(OrderDate) to the first CTE, then LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Year)',
    ],
    starterCode: `WITH
  CategoryRevenue AS (
      -- Step 1: revenue per category
  ),
  RankedCategories AS (
      -- Step 2: rank from CategoryRevenue
  )
SELECT CategoryName, Revenue, Rank
FROM RankedCategories
WHERE Rank <= 3
ORDER BY Rank;`,
    solution: `-- Part A
WITH
  CategoryRevenue AS (
      SELECT c.CategoryID, c.CategoryName,
             SUM(od.Quantity * od.UnitPrice) AS Revenue
      FROM [Order Details] od
      JOIN Products   p ON od.ProductID = p.ProductID
      JOIN Categories c ON p.CategoryID = c.CategoryID
      GROUP BY c.CategoryID, c.CategoryName
  ),
  RankedCategories AS (
      SELECT *,
             RANK() OVER (ORDER BY Revenue DESC) AS Rank
      FROM CategoryRevenue
  )
SELECT CategoryName, Revenue, Rank
FROM RankedCategories
WHERE Rank <= 3
ORDER BY Rank;

-- Part B (bonus)
WITH
  YearlyRevenue AS (
      SELECT c.CategoryID, c.CategoryName,
             YEAR(o.OrderDate) AS Yr,
             SUM(od.Quantity * od.UnitPrice) AS Revenue
      FROM [Order Details] od
      JOIN Orders     o  ON od.OrderID   = o.OrderID
      JOIN Products   p  ON od.ProductID = p.ProductID
      JOIN Categories c  ON p.CategoryID = c.CategoryID
      GROUP BY c.CategoryID, c.CategoryName, YEAR(o.OrderDate)
  ),
  WithGrowth AS (
      SELECT *,
             LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Yr) AS PrevRevenue,
             ROUND(100.0 * (Revenue - LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Yr))
                   / NULLIF(LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Yr), 0), 1) AS GrowthPct
      FROM YearlyRevenue
  )
SELECT CategoryName, Yr, Revenue, PrevRevenue, GrowthPct
FROM WithGrowth
WHERE PrevRevenue IS NOT NULL   -- exclude first year (no prior year to compare)
ORDER BY CategoryName, Yr;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the maximum number of CTEs you can define in a single WITH clause?',
      options: [
        '1 — only one CTE per WITH',
        '5',
        'No hard maximum — as many as needed, separated by commas',
        '10',
      ],
      answer: 2,
      explanation: 'SQL allows any number of CTEs in a single WITH clause, separated by commas. Each CTE can reference any CTEs defined before it in the same WITH clause. The practical limit is readability and the query optimiser\'s ability to handle complexity.',
    },
    {
      q: 'In a recursive CTE, what terminates the recursion?',
      options: [
        'A LIMIT or TOP clause on the recursive member',
        'The recursive member returning zero rows',
        'MAXRECURSION reaching zero',
        'A STOP RECURSION keyword',
      ],
      answer: 1,
      explanation: 'Recursion terminates when the recursive member SELECT produces zero rows — there is no more data to process. MAXRECURSION (MSSQL) is a safety cap that aborts execution if the recursive member runs more than N times; it does not cause normal termination. The WHERE clause in the recursive member is the intended termination condition.',
    },
    {
      q: 'Which keyword is required in PostgreSQL for a recursive CTE but is NOT used in SQL Server?',
      options: [
        'UNION ALL',
        'RECURSIVE',
        'CYCLE',
        'WITH DEPTH',
      ],
      answer: 1,
      explanation: 'PostgreSQL requires the explicit RECURSIVE keyword: WITH RECURSIVE cte AS (…). SQL Server automatically detects the self-reference and treats a self-referential CTE as recursive without any extra keyword. Forgetting RECURSIVE in PostgreSQL results in a "relation does not exist" error.',
    },
    {
      q: 'In PostgreSQL 12+, what does NOT MATERIALIZED hint on a CTE do?',
      options: [
        'Prevents the CTE from being used in a DML statement',
        'Forces the CTE to be inlined like a subquery, enabling predicate push-down from the outer query',
        'Makes the CTE\'s result persist after the query ends as a temp table',
        'Disables index usage inside the CTE',
      ],
      answer: 1,
      explanation: 'NOT MATERIALIZED tells PostgreSQL to inline the CTE (treat it like a derived table), which allows the optimiser to push WHERE predicates from the outer query into the CTE\'s inner query — enabling index seeks. A plain CTE (MATERIALIZED) is evaluated once first, then filtered externally — no predicate push-down, potentially a full scan.',
    },
    {
      q: 'Which SQL statement can a CTE NOT precede?',
      options: [
        'SELECT',
        'UPDATE',
        'CREATE TABLE',
        'DELETE',
      ],
      answer: 2,
      explanation: 'CTEs can precede SELECT, INSERT, UPDATE, and DELETE (DML). They cannot precede DDL statements like CREATE TABLE, ALTER TABLE, DROP, or CREATE INDEX. CTEs are part of the DML layer, not the DDL layer.',
    },
    {
      q: 'In SQL Server, if an expensive CTE is referenced twice in the same query, what happens?',
      options: [
        'SQL Server materialises the CTE once and reuses the cached result for both references',
        'SQL Server may execute the CTE twice — once per reference — because CTEs are not guaranteed to be materialised',
        'SQL Server raises an error — a CTE can only be referenced once per statement',
        'SQL Server automatically converts the CTE into a temp table to avoid re-execution',
      ],
      answer: 1,
      explanation: 'Unlike temp tables, SQL Server CTEs are generally inlined and not guaranteed to be materialised. If a CTE is referenced twice in the same query, the optimiser may execute the underlying query twice — once per reference. For expensive CTEs referenced multiple times, use a #temp table to force a single materialisation and optionally add an index.',
    },
    {
      q: 'Which part of a recursive CTE is NOT allowed to use GROUP BY, aggregate functions, or DISTINCT?',
      options: [
        'The anchor member',
        'The recursive member',
        'Both anchor and recursive members',
        'The final outer SELECT',
      ],
      answer: 1,
      explanation: 'The recursive member (the SELECT that references the CTE itself) cannot use DISTINCT, GROUP BY, HAVING, TOP/LIMIT, aggregate functions, or outer joins that reference the recursive part. These restrictions exist because the recursive member runs iteratively and row-by-row, not as a set. The anchor member and outer SELECT have no such restrictions.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is a CTE stored as a temp table?',
      a: 'No. A CTE exists only for the duration of the single statement that follows the WITH clause and is not persisted. In SQL Server it is typically inlined (treated as a subquery). In PostgreSQL ≤ 11 it was always materialised (evaluated once, stored temporarily); from PostgreSQL 12, the optimiser decides. If you need to reference an intermediate result many times across statements, or add an index to it, use a #temp table (MSSQL) or CREATE TEMP TABLE (PostgreSQL) instead.',
    },
    {
      q: 'Can a CTE reference itself more than once in the recursive member?',
      a: 'No. A recursive CTE can reference itself exactly once in the recursive member — this is enforced at parse time. The recursive member also cannot use DISTINCT, GROUP BY, HAVING, TOP/LIMIT, aggregate functions, or outer joins that reference the recursive part. All filtering and aggregation must happen in the anchor member or in the final outer SELECT after the WITH clause.',
    },
    {
      q: 'How do I prevent infinite recursion in a recursive CTE?',
      a: 'Two mechanisms: (1) <strong>Termination condition in the WHERE clause</strong> — add a depth counter incremented in each recursive step with a guard like <code>WHERE Level &lt; 50</code>. This is the correct, portable approach. (2) <strong>MAXRECURSION (MSSQL)</strong> — <code>OPTION (MAXRECURSION N)</code> aborts execution if the recursive member runs more than N times (default 100, 0 = unlimited). Use MAXRECURSION as a safety net, not as the primary termination condition — design the recursive member to terminate naturally.',
    },
    {
      q: 'Can I use a CTE in a view definition?',
      a: 'Yes. SQL Server and PostgreSQL both support CTEs inside view definitions: <code>CREATE VIEW v AS WITH cte AS (…) SELECT … FROM cte</code>. The CTE is scoped to the view\'s defining SELECT. You can also create an indexed view (MSSQL) or materialised view (PostgreSQL) over a CTE-based SELECT for persistent, pre-computed results with index support.',
    },
    {
      q: 'Why should I use UNION ALL and not UNION between the anchor and recursive members?',
      a: 'The recursive member in most databases requires <code>UNION ALL</code> (not <code>UNION</code>). UNION deduplicates results, which requires comparing the entire result set with previous iterations — an operation not permitted in recursive context. SQL Server rejects <code>UNION</code> in a recursive CTE with a parse error. PostgreSQL also prohibits it. Use UNION ALL between anchor and recursive members; apply DISTINCT in the final outer SELECT if deduplication is needed.',
    },
    {
      q: 'Can a later CTE in a WITH clause reference an earlier one?',
      a: 'Yes. All CTEs in a WITH clause share the same scope. A CTE can reference any CTE defined <em>before</em> it in the same WITH clause, enabling pipeline-style chaining: <code>WITH a AS (…), b AS (SELECT … FROM a), c AS (SELECT … FROM b) SELECT … FROM c</code>. A CTE cannot reference one defined <em>after</em> it (forward references are not allowed). This one-directional chaining is what enables the multi-step pipeline pattern.',
    },
    {
      q: 'When should I use a CTE vs a view vs a temp table for recurring logic?',
      a: '<strong>CTE</strong>: one-off logic in a single statement — readability and named steps. Not reusable across queries. <strong>View</strong>: recurring logic reused across many queries — encapsulates the logic once, referenceable by name. Consider indexed/materialised view if performance is critical. <strong>Temp table</strong>: large intermediate result needed multiple times in the same session/procedure, or requiring an index. Persists for the session, not just one statement. The decision matrix: is the logic reused across queries? → view. Is it large and multi-reference in one statement? → temp table. Is it single-use and complex? → CTE.',
    },
  ];
}
