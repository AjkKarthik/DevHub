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
  selector: 'app-sql-window-functions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './window-functions.html',
  styleUrl: './window-functions.scss',
})
export class SqlWindowFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'OVER()',              type: 'syntax',   desc: 'Defines the window; empty OVER() applies the function to all rows without grouping', since: 'SQL:2003' },
    { name: 'PARTITION BY',       type: 'keyword',  desc: 'Divides rows into independent partitions; the window function resets per partition', since: 'SQL:2003' },
    { name: 'ORDER BY (in OVER)', type: 'keyword',  desc: 'Sets row order within a partition; required for ranking, LAG/LEAD, and running aggregates', since: 'SQL:2003' },
    { name: 'ROW_NUMBER()',       type: 'function', desc: 'Sequential integer per partition; no ties — always unique. Use for deduplication.', since: 'SQL:2003' },
    { name: 'RANK()',             type: 'function', desc: 'Same rank for ties; skips numbers after ties: 1, 2, 2, 4', since: 'SQL:2003' },
    { name: 'DENSE_RANK()',       type: 'function', desc: 'Same rank for ties; no gaps: 1, 2, 2, 3. Use when counting unique positions matters.', since: 'SQL:2003' },
    { name: 'NTILE(n)',           type: 'function', desc: 'Distributes rows into n buckets (quartiles, deciles); extra rows go to earlier buckets', since: 'SQL:2003' },
    { name: 'LAG(col, n, def)',   type: 'function', desc: 'Value from n rows before current row; def when no prior row exists', since: 'SQL:2003' },
    { name: 'LEAD(col, n, def)',  type: 'function', desc: 'Value from n rows ahead of current row; def when no next row exists', since: 'SQL:2003' },
    { name: 'FIRST_VALUE(col)',   type: 'function', desc: 'First value in the current window frame (default: first row in partition up to current)', since: 'SQL:2003' },
    { name: 'LAST_VALUE(col)',    type: 'function', desc: 'Last value in the current window frame — needs ROWS BETWEEN … UNBOUNDED FOLLOWING for true last', since: 'SQL:2003' },
    { name: 'PERCENT_RANK()',     type: 'function', desc: '(rank - 1) / (rows - 1) — relative rank as 0.0–1.0; first row is always 0.0', since: 'SQL:2003' },
    { name: 'CUME_DIST()',        type: 'function', desc: 'Cumulative distribution: fraction of rows ≤ current row\'s ORDER BY value; ranges 0 < x ≤ 1', since: 'SQL:2003' },
    { name: 'PERCENTILE_CONT(p)', type: 'function', desc: 'Continuous interpolated percentile (e.g. PERCENTILE_CONT(0.5) = median); used as ordered-set aggregate', since: 'SQL:2003' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Windows — what makes them different from GROUP BY',
      points: [
        'Window functions compute a value for each row based on a <em>window</em> — a set of rows related to the current row. Unlike GROUP BY aggregates, <strong>they do not collapse rows</strong>: every input row produces exactly one output row with both its original columns and the window result.',
        'The <code>OVER()</code> clause defines the window. An empty <code>OVER()</code> applies the function across all rows in the result set. <code>PARTITION BY</code> divides rows into independent groups (the function resets per group). <code>ORDER BY</code> within OVER sets the sort order for ranking and running-aggregate calculations.',
        'Window functions execute in the SQL processing order <strong>after WHERE, JOIN, GROUP BY, and HAVING — but before the outer ORDER BY</strong>. This means they see only rows that survived the WHERE filter, but they cannot be used directly in WHERE or HAVING predicates. Wrap in a CTE or subquery to filter on window results.',
        'Window functions are dramatically more efficient than correlated scalar subqueries for the same task. A correlated subquery for "department average salary" runs once per employee row; <code>AVG(salary) OVER (PARTITION BY dept_id)</code> runs once per partition in a single pass.',
        'Multiple window functions in the same SELECT with <strong>identical OVER() clauses</strong> share a single sort operation. Mixing many different OVER() definitions in one SELECT may trigger multiple sort passes — the query optimiser batches identical windows. Check the execution plan when performance matters.',
      ],
    },
    {
      heading: 'Ranking functions — ROW_NUMBER, RANK, DENSE_RANK, NTILE',
      points: [
        '<strong>ROW_NUMBER()</strong> assigns a unique sequential integer to each row within the partition. Ties get <em>arbitrary but distinct</em> numbers — if two rows have the same ORDER BY value, which gets 1 and which gets 2 is undefined unless a tiebreaker column is added. Use ROW_NUMBER for deduplication (<code>DELETE WHERE rn &gt; 1</code>) and pagination (<code>WHERE rn BETWEEN 101 AND 200</code>).',
        '<strong>RANK()</strong> assigns the same rank to tied rows and then <em>skips</em> subsequent ranks by the count of ties: 1, 2, 2, 4. The gap after ties makes RANK reflect true position — like a sports leaderboard where two silver medalists mean no bronze is awarded.',
        '<strong>DENSE_RANK()</strong> assigns the same rank to ties but <em>never skips</em>: 1, 2, 2, 3. Use DENSE_RANK when you want to know "how many unique ranks exist" — for example, top-3 salary tiers where you want exactly 3 tiers regardless of how many people share a rank.',
        '<strong>NTILE(n)</strong> divides the partition into n equal buckets and assigns each row a bucket number 1..n. For quartile analysis use NTILE(4); for deciles NTILE(10). When rows don\'t divide evenly by n, earlier buckets get one extra row. Useful for percentile segmentation (which salary quartile does each employee fall into?).',
        'Interview tip: ROW_NUMBER → unique IDs and dedup; RANK → true rank with gaps (sports/leaderboards); DENSE_RANK → rank without gaps (category positions); NTILE → percentile buckets. These four are the most commonly tested window functions in SQL interviews.',
      ],
    },
    {
      heading: 'Offset functions — LAG, LEAD, FIRST_VALUE, LAST_VALUE',
      points: [
        '<strong>LAG(col, offset, default)</strong> returns the value from <code>offset</code> rows <em>before</em> the current row within the window. The third argument is the fallback when no prior row exists (first row of a partition). Classic use: period-over-period comparison — <code>Revenue - LAG(Revenue) OVER (ORDER BY Month)</code> gives month-over-month delta without a self-join.',
        '<strong>LEAD(col, offset, default)</strong> looks <em>ahead</em>: value from <code>offset</code> rows after the current row. Use for next-event analysis — "when is the next order for this customer?", "how many days until the next price change?", or to flag the last event in a sequence (LEAD IS NULL = last row in partition).',
        '<strong>FIRST_VALUE(col)</strong> returns the first value in the current window frame. With <code>ORDER BY date</code> in OVER and the default frame, this gives the first date in the partition up to the current row — useful for "days since first order per customer".',
        '<strong>LAST_VALUE(col)</strong> has a critical gotcha: the default frame is <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>, so it returns the <em>current row</em>\'s value — not the last row in the partition. To get the actual last value, explicitly specify <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code>. This is the most common LAST_VALUE mistake.',
        'LAG and LEAD do not require a separate self-join: the equivalent of <code>LAG(col)</code> without window functions requires <code>JOIN T ON T.id = current.id - 1</code> — fragile and error-prone. Window offset functions are the clean, index-friendly replacement.',
      ],
    },
    {
      heading: 'Running aggregates and window frames',
      points: [
        'Any aggregate function (SUM, AVG, MIN, MAX, COUNT) can be used as a window function by adding <code>OVER()</code>: <code>SUM(revenue) OVER (PARTITION BY year ORDER BY month)</code> computes a running total that resets per year. The aggregate does not collapse rows — it adds a column to each row.',
        'The <strong>window frame</strong> controls which rows within the partition are included in the aggregate for each row. The default frame <strong>with ORDER BY</strong> is <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> — this is the running aggregate (cumulative sum). The default frame <strong>without ORDER BY</strong> is the entire partition — a simple partitioned aggregate (same value on all rows in the group).',
        '<strong>ROWS</strong> frames count physical rows: <code>ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code> is always exactly 3 rows — ideal for fixed-size moving averages. <strong>RANGE</strong> frames work on values: <code>RANGE BETWEEN INTERVAL \'7 days\' PRECEDING AND CURRENT ROW</code> (PostgreSQL) includes all rows whose date is within 7 days of the current row — the window size varies with data density.',
        'Useful frame patterns: <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> → running total; <code>ROWS BETWEEN 6 PRECEDING AND CURRENT ROW</code> → 7-day moving average; <code>ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING</code> → inverse running total (remaining); <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> → full partition aggregate (same as no frame without ORDER BY).',
        '<strong>SUM(SUM(col)) OVER (…)</strong> — the double-aggregation pattern — is used when the query needs to GROUP BY and compute a running total at the same time. The inner SUM groups rows; the outer SUM applies the window over the grouped result. This is common in "monthly revenue with running year-to-date total" queries.',
      ],
    },
    {
      heading: 'Statistical functions — PERCENT_RANK, CUME_DIST, PERCENTILE_CONT',
      points: [
        '<strong>PERCENT_RANK()</strong> returns the relative rank of a row as a decimal: <code>(rank - 1) / (total_rows - 1)</code>. The first row always returns 0.0; the last returns 1.0. Tied rows get the same PERCENT_RANK. Use it to answer "what percentile does this employee\'s salary fall in?".',
        '<strong>CUME_DIST()</strong> (cumulative distribution) returns the fraction of rows with an ORDER BY value <em>less than or equal to</em> the current row\'s value: <code>number_of_rows ≤ current / total_rows</code>. The last row is always 1.0; the first is 1/N (never 0). Tied rows share the same CUME_DIST. It differs from PERCENT_RANK in how it handles the first row and ties.',
        '<strong>PERCENTILE_CONT(fraction)</strong> computes the <em>continuous</em> (interpolated) percentile value for a sorted set. <code>PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)</code> returns the median salary — if the median falls between two values, it interpolates. <strong>PERCENTILE_DISC(fraction)</strong> returns the actual discrete value closest to the percentile without interpolation.',
        'PERCENTILE_CONT and PERCENTILE_DISC are <strong>ordered-set aggregate functions</strong> — a special category that takes an <code>ORDER BY</code> inside <code>WITHIN GROUP (…)</code> rather than in OVER(). They can be partitioned using OVER (PARTITION BY …) to compute per-group medians. This syntax is supported in MSSQL 2012+, PostgreSQL 9.4+, and Oracle.',
        'Practical use: PERCENT_RANK to classify employees into performance percentiles; CUME_DIST to find "what percentage of orders are below this value"; PERCENTILE_CONT(0.5) for median computation (the standard alternative to AVG when outliers skew the mean); NTILE(4) for quartile bucket assignment.',
      ],
    },
    {
      heading: 'Performance patterns and common mistakes',
      points: [
        '<strong>Window functions vs correlated subqueries</strong>: a correlated scalar subquery in SELECT (e.g. "department average salary") executes once per outer row — O(n × m). The equivalent window function (<code>AVG(salary) OVER (PARTITION BY dept_id)</code>) is a single scan with a hash or sort partition — typically O(n log n) at most. Always prefer window functions over correlated subqueries for per-group aggregates.',
        '<strong>Cannot use window functions in WHERE/HAVING</strong>: window functions run after WHERE/HAVING in the SQL evaluation order. Filtering on a window result requires a CTE or subquery wrapper: <code>WITH r AS (SELECT *, ROW_NUMBER() OVER (…) AS rn FROM T) SELECT * FROM r WHERE rn = 1</code>. This is the canonical deduplication pattern.',
        '<strong>LAST_VALUE gotcha</strong>: always specify the frame explicitly when using LAST_VALUE. The default frame stops at the current row, making LAST_VALUE return the current row\'s value — almost never what you want. Add <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> to see the actual last value in the partition.',
        '<strong>ORDER BY in OVER vs ORDER BY in the query</strong>: these are independent. <code>ORDER BY date OVER (PARTITION BY dept_id ORDER BY date)</code> is in the window definition. The outer <code>ORDER BY</code> on the final SELECT controls output order. A query can have a window ORDER BY and a different output ORDER BY.',
        '<strong>Identical OVER() clauses share a single sort</strong>: if you write <code>ROW_NUMBER() OVER (PARTITION BY x ORDER BY y)</code> and <code>RANK() OVER (PARTITION BY x ORDER BY y)</code> in the same SELECT, the optimiser uses one sort for both. Mixing different PARTITION BY / ORDER BY combinations can trigger multiple sort passes — profile with the execution plan if you see unexpected CPU cost.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ranking',
      language: 'sql',
      code: `-- ── ROW_NUMBER: deduplication — keep earliest record per email ────────
WITH Deduped AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email
               ORDER BY CustomerID ASC   -- keep lowest ID (earliest)
           ) AS rn
    FROM Customers
)
SELECT CustomerID, Email, CompanyName
FROM Deduped
WHERE rn = 1;

-- ── RANK vs DENSE_RANK comparison ─────────────────────────────────────
SELECT
    EmployeeID,
    LastName,
    Salary,
    RANK()       OVER (ORDER BY Salary DESC) AS Rank,       -- 1,2,2,4
    DENSE_RANK() OVER (ORDER BY Salary DESC) AS DenseRank,  -- 1,2,2,3
    ROW_NUMBER() OVER (ORDER BY Salary DESC) AS RowNum      -- 1,2,3,4
FROM Employees;

-- ── Top-1 per category (most expensive product) ───────────────────────
SELECT CategoryID, ProductName, UnitPrice
FROM (
    SELECT CategoryID, ProductName, UnitPrice,
           ROW_NUMBER() OVER (
               PARTITION BY CategoryID
               ORDER BY UnitPrice DESC
           ) AS rn
    FROM Products WHERE Discontinued = 0
) t
WHERE rn = 1
ORDER BY CategoryID;`,
    },
    {
      label: 'LAG / LEAD',
      language: 'sql',
      code: `-- ── Month-over-month revenue change ───────────────────────────────────
SELECT
    SaleMonth,
    Revenue,
    LAG(Revenue, 1, 0)  OVER (ORDER BY SaleMonth)  AS PrevRevenue,
    Revenue - LAG(Revenue, 1, 0) OVER (ORDER BY SaleMonth) AS Delta,
    ROUND(
        100.0 * (Revenue - LAG(Revenue) OVER (ORDER BY SaleMonth))
               / NULLIF(LAG(Revenue) OVER (ORDER BY SaleMonth), 0),
        1
    ) AS PctChange
FROM MonthlySales
ORDER BY SaleMonth;

-- ── LEAD: next order date per customer ────────────────────────────────
SELECT
    CustomerID,
    OrderDate,
    LEAD(OrderDate) OVER (
        PARTITION BY CustomerID
        ORDER BY OrderDate
    ) AS NextOrderDate,
    DATEDIFF(DAY, OrderDate,
        LEAD(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate)
    ) AS DaysToNextOrder
FROM Orders;

-- ── Detect last order in a series (LEAD IS NULL = final row in partition)
SELECT CustomerID, OrderDate,
       CASE WHEN LEAD(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate) IS NULL
            THEN 'Last Order' ELSE 'Not Last' END AS Status
FROM Orders;`,
    },
    {
      label: 'FIRST_VALUE / LAST_VALUE / NTILE',
      language: 'sql',
      code: `-- ── FIRST_VALUE: days since first order per customer ─────────────────
SELECT
    CustomerID,
    OrderDate,
    FIRST_VALUE(OrderDate) OVER (
        PARTITION BY CustomerID
        ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS FirstOrderDate,
    DATEDIFF(DAY,
        FIRST_VALUE(OrderDate) OVER (
            PARTITION BY CustomerID ORDER BY OrderDate
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ),
        OrderDate
    ) AS DaysSinceFirst
FROM Orders;

-- ── LAST_VALUE gotcha — MUST specify frame ────────────────────────────
SELECT
    ProductID, OrderDate, UnitPrice,
    -- Wrong: default frame = ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    -- → returns current row's price, not the last price
    LAST_VALUE(UnitPrice) OVER (
        PARTITION BY ProductID ORDER BY OrderDate
        -- missing frame → wrong result!
    ) AS WrongLastPrice,

    -- Correct: extend frame to end of partition
    LAST_VALUE(UnitPrice) OVER (
        PARTITION BY ProductID ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS CorrectLastPrice
FROM OrderDetails;

-- ── NTILE: quartile segmentation ──────────────────────────────────────
SELECT
    EmployeeID, LastName, Salary,
    NTILE(4) OVER (ORDER BY Salary DESC) AS Quartile,
    CASE NTILE(4) OVER (ORDER BY Salary DESC)
        WHEN 1 THEN 'Top 25%'
        WHEN 2 THEN '25-50%'
        WHEN 3 THEN '50-75%'
        WHEN 4 THEN 'Bottom 25%'
    END AS SalaryTier
FROM Employees;`,
    },
    {
      label: 'Running totals & frames',
      language: 'sql',
      code: `-- ── Running total of freight per year ────────────────────────────────
SELECT
    YEAR(OrderDate)  AS Yr,
    MONTH(OrderDate) AS Mo,
    SUM(Freight)     AS MonthlyFreight,
    -- Running total resets each year (PARTITION BY year)
    SUM(SUM(Freight)) OVER (
        PARTITION BY YEAR(OrderDate)
        ORDER BY MONTH(OrderDate)
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS YearToDateFreight
FROM Orders
GROUP BY YEAR(OrderDate), MONTH(OrderDate)
ORDER BY Yr, Mo;

-- ── 3-row moving average (ROWS frame) ─────────────────────────────────
SELECT
    OrderDate,
    Freight,
    AVG(Freight) OVER (
        ORDER BY OrderDate
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW   -- exactly 3 physical rows
    ) AS MovingAvg3
FROM Orders;

-- ── RANGE frame: value-based (PostgreSQL) ─────────────────────────────
-- All rows within 7 days of the current row
SELECT
    OrderDate,
    Freight,
    AVG(Freight) OVER (
        ORDER BY OrderDate
        RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
    ) AS Rolling7DayAvg    -- window size varies with data density
FROM Orders;

-- ── Remaining total (inverse running sum) ─────────────────────────────
SELECT
    Mo,
    MonthlyFreight,
    SUM(MonthlyFreight) OVER (
        ORDER BY Mo
        ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
    ) AS RemainingTotal
FROM (SELECT MONTH(OrderDate) Mo, SUM(Freight) MonthlyFreight
      FROM Orders GROUP BY MONTH(OrderDate)) m;`,
    },
    {
      label: 'PERCENT_RANK / CUME_DIST / Percentile',
      language: 'sql',
      code: `-- ── PERCENT_RANK: relative rank as 0.0–1.0 ───────────────────────────
-- First row = 0.0, last row = 1.0, ties share the same value
SELECT
    EmployeeID, LastName, Salary,
    ROUND(PERCENT_RANK() OVER (ORDER BY Salary), 3) AS SalaryPercentRank,
    -- "This employee is in the top X% of salaries"
    ROUND(1 - PERCENT_RANK() OVER (ORDER BY Salary), 3) AS TopPct
FROM Employees;

-- ── CUME_DIST: cumulative fraction ≤ current value ────────────────────
-- Always > 0, last row = 1.0; first row = 1/N (not 0)
SELECT
    ProductID, UnitPrice,
    ROUND(CUME_DIST() OVER (ORDER BY UnitPrice), 3) AS PriceCumeDist
    -- "X% of products cost this price or less"
FROM Products;

-- ── PERCENTILE_CONT: median salary per department ─────────────────────
-- PERCENTILE_CONT(0.5) interpolates the median
-- PERCENTILE_DISC(0.5) picks the nearest actual value
SELECT DISTINCT
    DeptID,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY Salary)
        OVER (PARTITION BY DeptID) AS MedianSalary,
    PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY Salary)
        OVER (PARTITION BY DeptID) AS MedianSalaryDiscrete,
    AVG(Salary) OVER (PARTITION BY DeptID)  AS AvgSalary
FROM Employees;
-- Use MedianSalary (CONT) when outliers skew the average — median is more robust.

-- ── Combined: rank + percentile in one query ──────────────────────────
SELECT
    EmployeeID, LastName, DeptID, Salary,
    DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS DeptRank,
    NTILE(4)     OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS Quartile,
    ROUND(PERCENT_RANK() OVER (PARTITION BY DeptID ORDER BY Salary), 2) AS PctRank
FROM Employees
ORDER BY DeptID, DeptRank;`,
    },
    {
      label: 'Window + CTE patterns',
      language: 'sql',
      code: `-- ── Pattern 1: Dedup with ROW_NUMBER in a CTE, then delete ──────────
WITH Ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email
               ORDER BY CustomerID   -- keep lowest ID
           ) AS rn
    FROM Customers
)
DELETE FROM Ranked WHERE rn > 1;

-- ── Pattern 2: Running total then filter (must wrap in CTE) ───────────
WITH RunningRevenue AS (
    SELECT
        OrderDate, CustomerID, Freight,
        SUM(Freight) OVER (ORDER BY OrderDate) AS CumulativeRevenue
    FROM Orders
)
-- Window results can only be filtered in an outer query
SELECT * FROM RunningRevenue
WHERE CumulativeRevenue > 10000
ORDER BY OrderDate;

-- ── Pattern 3: YoY growth — LAG across partitioned years ──────────────
WITH YearlySales AS (
    SELECT
        CategoryID,
        YEAR(OrderDate)         AS Yr,
        SUM(od.UnitPrice * od.Quantity) AS Revenue
    FROM [Order Details] od
    JOIN Orders o ON od.OrderID = o.OrderID
    GROUP BY CategoryID, YEAR(OrderDate)
)
SELECT
    CategoryID, Yr, Revenue,
    LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Yr) AS PrevRevenue,
    ROUND(100.0 * (Revenue - LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Yr))
          / NULLIF(LAG(Revenue) OVER (PARTITION BY CategoryID ORDER BY Yr), 0), 1) AS GrowthPct
FROM YearlySales
ORDER BY CategoryID, Yr;

-- ── Pattern 4: Gap analysis — consecutive date groups ─────────────────
-- Find groups of consecutive login days (island-and-gaps problem)
WITH Numbered AS (
    SELECT UserID, LoginDate,
           ROW_NUMBER() OVER (PARTITION BY UserID ORDER BY LoginDate)
               AS rn
    FROM Logins
)
SELECT UserID, MIN(LoginDate) AS IslandStart, MAX(LoginDate) AS IslandEnd
FROM (
    SELECT UserID, LoginDate,
           DATEADD(DAY, -rn, LoginDate) AS GroupKey  -- same GroupKey = consecutive days
    FROM Numbered
) g
GROUP BY UserID, GroupKey
ORDER BY UserID, IslandStart;`,
    },
  ];

  challenge: Challenge = {
    title: 'Employee Salary Analysis',
    language: 'sql',
    description: `Using an Employees table (EmployeeID, DeptID, LastName, Salary, HireDate):
<ol>
<li>For each employee show: LastName, DeptID, Salary, their DENSE_RANK within their department (highest salary = rank 1), and salary as a percentage of the department max (rounded to 1 decimal).</li>
<li>Add a column showing the salary of the employee hired immediately before this one in the same department (LAG by HireDate), and the delta between this employee's salary and the previous hire's salary.</li>
</ol>
Order by DeptID, then DenseRank ascending.`,
    hints: [
      'DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC)',
      'Pct of max: ROUND(100.0 * Salary / MAX(Salary) OVER (PARTITION BY DeptID), 1)',
      'Previous hire salary: LAG(Salary) OVER (PARTITION BY DeptID ORDER BY HireDate)',
      'Delta: Salary - LAG(Salary) OVER (PARTITION BY DeptID ORDER BY HireDate)',
    ],
    starterCode: `SELECT
    LastName, DeptID, Salary,
    -- dense rank per department (highest = 1)
    -- pct of dept max
    -- salary of previous hire in same dept
    -- delta from previous hire
FROM Employees
ORDER BY DeptID, DeptRank;`,
    solution: `SELECT
    LastName,
    DeptID,
    Salary,
    DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS DeptRank,
    ROUND(100.0 * Salary / MAX(Salary) OVER (PARTITION BY DeptID), 1) AS PctOfMax,
    LAG(Salary) OVER (PARTITION BY DeptID ORDER BY HireDate)     AS PrevHireSalary,
    Salary - LAG(Salary) OVER (PARTITION BY DeptID ORDER BY HireDate) AS SalaryDelta
FROM Employees
ORDER BY DeptID, DeptRank;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which ranking function produces 1, 2, 2, 3 (no gaps after ties)?',
      options: [
        'ROW_NUMBER()',
        'RANK()',
        'DENSE_RANK()',
        'NTILE(4)',
      ],
      answer: 2,
      explanation: 'DENSE_RANK() assigns the same rank to ties and increments by 1 for the next distinct value — no gaps (1, 2, 2, 3). RANK() would produce 1, 2, 2, 4 (skips position 3 because two rows tied for position 2). ROW_NUMBER() always produces unique sequential integers.',
    },
    {
      q: 'What does LAST_VALUE() return when used with the default window frame (ORDER BY col in OVER)?',
      options: [
        'The last row in the entire partition',
        'The current row\'s value — because the default frame ends at CURRENT ROW',
        'An error — an explicit frame is always required for LAST_VALUE',
        'NULL for all rows except the last in the partition',
      ],
      answer: 1,
      explanation: 'The default frame with ORDER BY is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. So LAST_VALUE(col) returns the value of the current row — not the last row in the partition. To get the actual last value, specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.',
    },
    {
      q: 'Can a window function appear directly in a WHERE clause?',
      options: [
        'Yes, if it uses OVER()',
        'No — window functions execute after WHERE; wrap in a subquery or CTE',
        'Only with PARTITION BY',
        'Only ROW_NUMBER() can appear in WHERE',
      ],
      answer: 1,
      explanation: 'Window functions execute after WHERE (and HAVING) in the SQL evaluation order. To filter on a window result, wrap the query in a CTE or derived table: WITH r AS (SELECT *, ROW_NUMBER() OVER (…) AS rn FROM T) SELECT * FROM r WHERE rn = 1.',
    },
    {
      q: 'LAG(col, 2, 0) returns:',
      options: [
        'The value 2 rows ahead of the current row',
        'The value 2 rows before the current row; 0 if no such prior row exists',
        'The difference between the current row and the row 2 positions back',
        'The average of the 2 preceding rows',
      ],
      answer: 1,
      explanation: 'LAG(col, n, default) returns the value n rows before the current row within the partition order. The third argument (default) is returned when no prior row exists — e.g. for the first two rows of a partition. LAG(col, 2, 0) returns the value 2 rows back, or 0 for the first two rows.',
    },
    {
      q: 'What is the default window frame when ORDER BY is specified in OVER()?',
      options: [
        'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING — entire partition',
        'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — running aggregate up to current row',
        'ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING — 3-row sliding window',
        'RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING — forward-looking',
      ],
      answer: 1,
      explanation: 'When ORDER BY is specified in OVER(), the default frame is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — making SUM, AVG, MIN, MAX all running (cumulative) aggregates. Without ORDER BY, the default frame is the entire partition (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING). This default is the source of the LAST_VALUE gotcha.',
    },
    {
      q: 'How does PERCENT_RANK() differ from CUME_DIST()?',
      options: [
        'PERCENT_RANK counts rows strictly less than the current value; CUME_DIST counts rows less than or equal',
        'They are identical — both return a value between 0 and 1',
        'PERCENT_RANK requires NTILE(100) as input; CUME_DIST does not',
        'CUME_DIST is only available in PostgreSQL; PERCENT_RANK works in all databases',
      ],
      answer: 0,
      explanation: 'PERCENT_RANK computes (rank - 1) / (N - 1) — it is based on rows strictly less than the current value, so the first row is always 0.0. CUME_DIST computes count_of_rows_≤_current / N — it is based on rows less than OR equal to the current value, so the first row is 1/N (never 0). They produce different results for duplicate values.',
    },
    {
      q: 'NTILE(4) is applied to 10 rows. How many rows end up in bucket 1?',
      options: [
        '2 rows — 10 ÷ 4 = 2.5, rounded down',
        '3 rows — when rows don\'t divide evenly, earlier buckets get one extra row',
        '4 rows — NTILE always makes the first bucket the largest',
        '2 or 3 rows depending on the ORDER BY values',
      ],
      answer: 1,
      explanation: '10 ÷ 4 = 2 remainder 2. The remainder (2) is distributed one extra row to the first 2 buckets. So buckets 1 and 2 get 3 rows each, and buckets 3 and 4 get 2 rows each. The total is 3+3+2+2 = 10. Earlier buckets always absorb the extra rows.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a window function instead of a GROUP BY aggregate?',
      a: 'Use a window function when you need the aggregate result alongside individual row details. GROUP BY collapses rows into one per group — you lose individual row data. A window function keeps every row while adding aggregate context. Example: showing each employee\'s salary and the department average in the same row requires <code>AVG(salary) OVER (PARTITION BY dept_id)</code> — impossible with plain GROUP BY without a self-join or correlated subquery.',
    },
    {
      q: 'What is the performance impact of multiple OVER() clauses in the same SELECT?',
      a: 'Each distinct OVER() clause (distinct PARTITION BY + ORDER BY combination) may require a separate sort pass. If multiple window functions share the exact same PARTITION BY and ORDER BY definition, the optimiser can reuse a single sort. Group compatible OVER() definitions together and avoid mixing many different window specs in one query. Check the execution plan — if you see multiple "Window Spool" or "Sort" nodes, the optimiser is doing multiple passes.',
    },
    {
      q: 'Can I use a window function inside an aggregate like SUM(ROW_NUMBER() OVER (...))?',
      a: 'No. Window functions and aggregate functions cannot be directly nested in a single SELECT. Workaround: compute the window function in an inner query (subquery or CTE), then aggregate the results in an outer query: <code>WITH r AS (SELECT *, ROW_NUMBER() OVER (…) AS rn FROM T) SELECT SUM(rn) FROM r</code>.',
    },
    {
      q: 'What is the difference between ROWS and RANGE frame types?',
      a: '<strong>ROWS</strong> counts physical rows relative to the current row: <code>ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code> is exactly 3 physical rows — always the same window size. <strong>RANGE</strong> works on values: <code>RANGE BETWEEN INTERVAL \'7 days\' PRECEDING AND CURRENT ROW</code> includes all rows whose ORDER BY value is within 7 days of the current row\'s value — the window size varies with data density. RANGE treats ties as a group (all rows with the same ORDER BY value are included together or not at all); ROWS treats each row individually.',
    },
    {
      q: 'How do window functions replace correlated subqueries?',
      a: 'A correlated scalar subquery in SELECT (e.g. <code>SELECT (SELECT AVG(salary) FROM E e2 WHERE e2.dept_id = e.dept_id)</code>) runs once per outer row — O(n × m). The equivalent window function <code>AVG(salary) OVER (PARTITION BY dept_id)</code> is computed in a single pass with hash partitioning — O(n). For per-group aggregates (department average, running total, period-over-period delta), window functions are the correct tool: cleaner syntax, far better performance.',
    },
    {
      q: 'What is PERCENTILE_CONT(0.5) and when should I use it instead of AVG?',
      a: '<code>PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col)</code> computes the median — the value at the 50th percentile, interpolating between the two middle values when the count is even. Use median instead of AVG when your data has outliers that skew the mean. For example, salary data often has a few very high earners that pull the average up — the median gives a better sense of what a typical employee earns. PERCENTILE_DISC(0.5) returns the actual nearest data point rather than an interpolated value.',
    },
    {
      q: 'Why might NTILE(10) and PERCENT_RANK() give different results for the same row?',
      a: 'They answer different questions. NTILE(10) divides rows into 10 equal-sized buckets by row count — a row in bucket 1 is in the top 10% by row count. PERCENT_RANK() returns the relative rank of the row\'s ORDER BY value: (rank - 1) / (N - 1). For tied values, NTILE assigns different buckets based on physical row order, while PERCENT_RANK gives all ties the same value. For dense data with many ties, PERCENT_RANK is semantically more correct; for even bucketing regardless of ties, NTILE is appropriate.',
    },
  ];
}
