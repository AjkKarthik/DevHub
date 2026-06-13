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
    { name: 'OVER()',          type: 'syntax',   desc: 'Defines the window; empty OVER() applies the function to all rows', since: 'SQL:2003' },
    { name: 'PARTITION BY',   type: 'keyword',  desc: 'Divides rows into groups (partitions); function resets per partition', since: 'SQL:2003' },
    { name: 'ORDER BY',       type: 'keyword',  desc: 'Sets the row order within a window; required for ranking and frame-aware functions', since: 'SQL:2003' },
    { name: 'ROW_NUMBER()',   type: 'function', desc: 'Sequential integer per partition, no ties, always unique', since: 'SQL:2003' },
    { name: 'RANK()',         type: 'function', desc: 'Leaves gaps after ties: 1, 2, 2, 4', since: 'SQL:2003' },
    { name: 'DENSE_RANK()',   type: 'function', desc: 'No gaps after ties: 1, 2, 2, 3', since: 'SQL:2003' },
    { name: 'NTILE(n)',       type: 'function', desc: 'Distributes rows into n buckets as evenly as possible', since: 'SQL:2003' },
    { name: 'LAG(col, n)',    type: 'function', desc: 'Returns the value from n rows before in the window (default n=1)', since: 'SQL:2003' },
    { name: 'LEAD(col, n)',   type: 'function', desc: 'Returns the value from n rows ahead in the window (default n=1)', since: 'SQL:2003' },
    { name: 'FIRST_VALUE()',  type: 'function', desc: 'First value in the window frame', since: 'SQL:2003' },
    { name: 'LAST_VALUE()',   type: 'function', desc: 'Last value in the current frame — needs explicit ROWS BETWEEN for correct results', since: 'SQL:2003' },
    { name: 'SUM / AVG OVER', type: 'function', desc: 'Running or partitioned aggregate without collapsing rows', since: 'SQL:2003' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Windows — what makes them special',
      points: [
        'Window functions compute a value for each row based on a set of rows related to the current row — the <em>window</em>. Unlike GROUP BY, they <strong>do not collapse rows</strong>: every input row produces exactly one output row.',
        'The <code>OVER()</code> clause defines the window. An empty OVER() means "all rows". <code>PARTITION BY</code> sub-divides rows into independent groups; <code>ORDER BY</code> sets the sort order within each partition.',
        'Window functions execute after WHERE, GROUP BY, and HAVING — but before the final ORDER BY. They cannot appear in WHERE or HAVING directly; wrap them in a subquery or CTE.',
        'Window functions are evaluated once per output row using the rows in its window frame. They are dramatically more efficient than correlated subqueries for the same task.',
      ],
    },
    {
      heading: 'Ranking functions',
      points: [
        '<strong>ROW_NUMBER()</strong>: assigns a unique sequential integer. No ties — two rows with the same ORDER BY value get different numbers (order between ties is arbitrary). Use for deduplication: DELETE WHERE rn > 1.',
        '<strong>RANK()</strong>: ties get the same rank; the next rank <em>skips</em> by the number of tied rows: 1, 2, 2, 4. Think sports podium.',
        '<strong>DENSE_RANK()</strong>: ties get the same rank; the next rank does <em>not</em> skip: 1, 2, 2, 3. Better for medal tables where you want to know "how many unique positions".',
        '<strong>NTILE(n)</strong>: distributes rows into n buckets as evenly as possible. NTILE(4) produces quartiles (1–4). Uneven distribution puts extra rows in earlier buckets.',
      ],
    },
    {
      heading: 'Offset functions — LAG, LEAD, FIRST_VALUE',
      points: [
        '<strong>LAG(col, offset, default)</strong> returns the value from <code>offset</code> rows <em>before</em> the current row. If no previous row, returns <code>default</code> (or NULL). Classic use: calculate period-over-period change.',
        '<strong>LEAD(col, offset, default)</strong> looks <em>ahead</em>. Use it for next-event analysis or flagging when a sequence ends.',
        '<strong>FIRST_VALUE(col)</strong> and <strong>LAST_VALUE(col)</strong> return the first/last value in the window frame. <strong>Be careful with LAST_VALUE</strong>: the default frame is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, so LAST_VALUE gives the current row. Add <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> to get the true last.',
      ],
    },
    {
      heading: 'Running aggregates and frames',
      points: [
        '<code>SUM(revenue) OVER (PARTITION BY year ORDER BY month)</code> computes a running total within each year — sum resets per year.',
        'The default frame with ORDER BY is <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> — the running aggregate. Without ORDER BY the default frame includes all rows in the partition.',
        'Explicit frames: <code>ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code> gives a 3-row moving average. <code>RANGE</code> frames work with values rather than row positions — <code>RANGE BETWEEN INTERVAL \'7 days\' PRECEDING AND CURRENT ROW</code> in PostgreSQL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ranking',
      language: 'sql',
      code: `-- ROW_NUMBER: unique ID per partition — classic dedup pattern
SELECT *
FROM (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email
               ORDER BY CustomerID
           ) AS rn
    FROM Customers
) t
WHERE rn = 1;   -- keep earliest record per email

-- RANK vs DENSE_RANK
SELECT
    EmployeeID,
    Salary,
    RANK()       OVER (ORDER BY Salary DESC) AS Rank,
    DENSE_RANK() OVER (ORDER BY Salary DESC) AS DenseRank
FROM Employees;

-- Top 1 per category using ROW_NUMBER
SELECT * FROM (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY CategoryID
               ORDER BY UnitPrice DESC
           ) AS rn
    FROM Products
) t WHERE rn = 1;`,
    },
    {
      label: 'LAG / LEAD',
      language: 'sql',
      code: `-- Month-over-month revenue change
SELECT
    SaleMonth,
    Revenue,
    LAG(Revenue, 1, 0) OVER (ORDER BY SaleMonth) AS PrevRevenue,
    Revenue - LAG(Revenue, 1, 0) OVER (ORDER BY SaleMonth) AS Delta,
    ROUND(
        100.0 * (Revenue - LAG(Revenue) OVER (ORDER BY SaleMonth))
               / NULLIF(LAG(Revenue) OVER (ORDER BY SaleMonth), 0),
        1
    ) AS PctChange
FROM MonthlySales;

-- LEAD: show next order date per customer
SELECT
    CustomerID,
    OrderDate,
    LEAD(OrderDate) OVER (
        PARTITION BY CustomerID
        ORDER BY OrderDate
    ) AS NextOrderDate
FROM Orders;`,
    },
    {
      label: 'Running totals',
      language: 'sql',
      code: `-- Running total of freight per year, per month
SELECT
    YEAR(OrderDate)                                 AS Yr,
    MONTH(OrderDate)                                AS Mo,
    SUM(Freight)                                    AS MonthlyFreight,
    SUM(SUM(Freight)) OVER (
        PARTITION BY YEAR(OrderDate)
        ORDER BY MONTH(OrderDate)
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                               AS RunningTotal
FROM Orders
GROUP BY YEAR(OrderDate), MONTH(OrderDate);

-- 3-month moving average
SELECT
    OrderDate,
    Freight,
    AVG(Freight) OVER (
        ORDER BY OrderDate
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS MovingAvg3
FROM Orders;`,
    },
  ];

  challenge: Challenge = {
    title: 'Employee Salary Ranking',
    language: 'sql',
    description: `Using an Employees table (EmployeeID, DeptID, LastName, Salary):
- For each employee, show: LastName, DeptID, Salary, their dense rank within their department (highest salary = rank 1), and their salary as a percentage of the highest salary in their department (rounded to 1 decimal)
- Order by DeptID, then dense rank ascending`,
    hints: [
      'DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC)',
      'For percentage: 100.0 * Salary / MAX(Salary) OVER (PARTITION BY DeptID)',
      'Both window functions use the same PARTITION BY — you can define them in the same SELECT',
    ],
    starterCode: `SELECT
    LastName,
    DeptID,
    Salary,
    -- dense rank per department
    -- pct of dept max salary
FROM Employees
ORDER BY DeptID, -- rank column;`,
    solution: `SELECT
    LastName,
    DeptID,
    Salary,
    DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC) AS DeptRank,
    ROUND(100.0 * Salary / MAX(Salary) OVER (PARTITION BY DeptID), 1) AS PctOfMax
FROM Employees
ORDER BY DeptID, DeptRank;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which ranking function produces 1, 2, 2, 3 (no gaps after ties)?',
      options: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE(4)'],
      answer: 2,
      explanation: 'DENSE_RANK() assigns the same rank to ties and increments by 1 for the next distinct value, producing no gaps (1, 2, 2, 3). RANK() would produce 1, 2, 2, 4.',
    },
    {
      q: 'What does LAST_VALUE() return by default (without an explicit frame)?',
      options: [
        'The last row in the entire partition',
        'The current row value — because the default frame ends at CURRENT ROW',
        'An error — frame is required',
        'NULL',
      ],
      answer: 1,
      explanation: 'The default frame with ORDER BY is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. So LAST_VALUE returns the value of the current row. To get the actual last row, add ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.',
    },
    {
      q: 'Can a window function appear in a WHERE clause?',
      options: ['Yes, if it uses OVER()', 'No — window functions are evaluated after WHERE; use a subquery or CTE', 'Only with PARTITION BY', 'Only for ranking functions'],
      answer: 1,
      explanation: 'Window functions execute after WHERE (and HAVING). To filter on a window result, wrap the query in a subquery or CTE and apply WHERE on the outer query.',
    },
    {
      q: 'LAG(col, 2, 0) returns:',
      options: ['The value 2 rows ahead', 'The value 2 rows behind; 0 if no such row exists', 'The lag between the current and previous value', 'The value offset by 2 within the partition'],
      answer: 1,
      explanation: 'LAG(col, n, default) returns the value n rows before the current row. The third argument is returned when no previous row exists (e.g. the first two rows of a partition).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a window function instead of a GROUP BY aggregate?',
      a: 'Use a window function when you need the aggregate result alongside individual row details. GROUP BY collapses rows into one per group; a window function keeps every row while adding aggregate context. Example: showing each employee\'s salary and the department average in the same row requires a window aggregate, not GROUP BY.',
    },
    {
      q: 'What is the performance impact of multiple OVER() clauses in the same SELECT?',
      a: 'Each distinct OVER() clause may require a separate sort pass. If multiple window functions share the same PARTITION BY and ORDER BY, the optimiser can use a single sort. Group compatible OVER() definitions together and avoid mixing many different window specs in one query.',
    },
    {
      q: 'Can I use a window function inside an aggregate like SUM(ROW_NUMBER() OVER (...))?',
      a: 'No. Window functions and aggregate functions cannot be directly nested. The workaround is to compute the window function in an inner query (subquery or CTE) and then aggregate the results in an outer query.',
    },
    {
      q: 'What is the difference between ROWS and RANGE frame types?',
      a: 'ROWS counts physical rows relative to the current row (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW = 3 physical rows). RANGE is value-based: RANGE BETWEEN INTERVAL \'7\' DAY PRECEDING AND CURRENT ROW includes all rows within 7 days of the current row\'s date. RANGE handles ties differently — all rows with the same ORDER BY value are included or excluded together.',
    },
  ];
}
