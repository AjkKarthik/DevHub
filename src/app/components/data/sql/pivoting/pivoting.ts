import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-pivoting',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './pivoting.html',
  styleUrls: ['./pivoting.scss']
})
export class SqlPivoting {

  quickRef: QuickRefItem[] = [
    { name: 'PIVOT (MSSQL)',     type: 'syntax',  desc: 'Rotate rows → columns with FOR … IN (…)' },
    { name: 'UNPIVOT (MSSQL)',   type: 'syntax',  desc: 'Rotate columns → rows' },
    { name: 'CASE aggregation',  type: 'syntax',  desc: 'Portable pivot: SUM(CASE WHEN col=X THEN val END)' },
    { name: 'crosstab() (PG)',   type: 'function', desc: 'tablefunc extension cross-tab function' },
    { name: 'STRING_AGG pivot',  type: 'function', desc: 'Group concat to build a "wide" string column' },
    { name: 'Dynamic PIVOT',     type: 'syntax',  desc: 'Build column list at runtime with sp_executesql' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is pivoting?',
      points: [
        'Pivoting transforms rows into columns — useful for cross-tab reports and dashboards.',
        'The opposite, UNPIVOT, rotates columns back into rows.',
        'MSSQL has native PIVOT / UNPIVOT operators; PostgreSQL uses conditional aggregation or the tablefunc extension.',
      ]
    },
    {
      heading: 'Conditional aggregation (portable)',
      points: [
        'SUM(CASE WHEN category = \'A\' THEN amount END) emulates a pivot column in any SQL dialect.',
        'Works in every database with no extensions or special syntax.',
        'The downside: column names must be known at query-write time.',
      ]
    },
    {
      heading: 'MSSQL PIVOT operator',
      points: [
        'SELECT … FROM table PIVOT (AGG(val) FOR col IN ([A],[B],[C])) AS p',
        'The IN list must be static — use dynamic SQL to build it at runtime.',
        'UNPIVOT syntax: … UNPIVOT (val FOR col IN ([A],[B],[C])) AS u',
      ]
    },
    {
      heading: 'PostgreSQL crosstab()',
      points: [
        'Requires CREATE EXTENSION tablefunc; once installed use crosstab() in FROM clause.',
        'First argument: query returning (row_name, category, value); second: query returning distinct category values.',
        'Output columns must be declared explicitly in the function call.',
      ]
    },
    {
      heading: 'Dynamic pivot',
      points: [
        'When the category values are unknown at query-write time, build the IN list from a metadata query.',
        'MSSQL: build @cols = STRING_AGG(QUOTENAME(category), \',\'), then sp_executesql a dynamic PIVOT string.',
        'Always sanitise or use QUOTENAME() to guard against SQL injection in dynamic column names.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Conditional Aggregation',
      language: 'sql',
      code: `-- Portable pivot: monthly sales by product
-- Works in MSSQL, PostgreSQL, MySQL, SQLite
SELECT
    product,
    SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) AS Jan,
    SUM(CASE WHEN month = 'Feb' THEN amount ELSE 0 END) AS Feb,
    SUM(CASE WHEN month = 'Mar' THEN amount ELSE 0 END) AS Mar
FROM sales
GROUP BY product;

-- Result:
-- product | Jan   | Feb   | Mar
-- --------+-------+-------+------
-- Widget  | 1500  | 2200  | 1800
-- Gadget  | 900   | 1100  | 1400`
    },
    {
      label: 'MSSQL PIVOT',
      language: 'sql',
      code: `-- Native PIVOT operator (MSSQL only)
SELECT product, [Jan], [Feb], [Mar]
FROM (
    SELECT product, month, amount
    FROM sales
) AS src
PIVOT (
    SUM(amount)
    FOR month IN ([Jan], [Feb], [Mar])
) AS pvt;

-- UNPIVOT: go back to rows
SELECT product, month, amount
FROM (
    SELECT product, Jan, Feb, Mar
    FROM monthly_totals
) AS src
UNPIVOT (
    amount FOR month IN ([Jan], [Feb], [Mar])
) AS upvt;`
    },
    {
      label: 'PostgreSQL crosstab',
      language: 'sql',
      code: `-- Enable the extension once per database
CREATE EXTENSION IF NOT EXISTS tablefunc;

-- crosstab pivot
SELECT *
FROM crosstab(
    $$ SELECT product, month, SUM(amount)
       FROM sales
       GROUP BY product, month
       ORDER BY product $$,
    $$ VALUES ('Jan'), ('Feb'), ('Mar') $$
) AS ct(product TEXT, "Jan" NUMERIC, "Feb" NUMERIC, "Mar" NUMERIC);

-- Without tablefunc: filter aggregate
SELECT
    product,
    SUM(amount) FILTER (WHERE month = 'Jan') AS "Jan",
    SUM(amount) FILTER (WHERE month = 'Feb') AS "Feb",
    SUM(amount) FILTER (WHERE month = 'Mar') AS "Mar"
FROM sales
GROUP BY product;`
    },
    {
      label: 'Dynamic PIVOT (MSSQL)',
      language: 'sql',
      code: `-- Build column list dynamically from data
DECLARE @cols   NVARCHAR(MAX);
DECLARE @sql    NVARCHAR(MAX);

-- Collect distinct months in order
SELECT @cols = STRING_AGG(QUOTENAME(month), ', ')
               WITHIN GROUP (ORDER BY MIN(sale_date))
FROM (SELECT DISTINCT month, MIN(sale_date) AS sale_date FROM sales) d;

-- Build and execute dynamic PIVOT
SET @sql = N'
    SELECT product, ' + @cols + N'
    FROM (
        SELECT product, month, amount FROM sales
    ) AS src
    PIVOT (SUM(amount) FOR month IN (' + @cols + N')) AS pvt;';

EXEC sp_executesql @sql;`
    },
  ];

  challenge: Challenge = {
    title: 'Quarterly Revenue by Category',
    language: 'sql',
    description: 'Write a query that pivots the orders table to show total revenue per product_category as columns: Q1, Q2, Q3, Q4. Use portable conditional aggregation so it works in both MSSQL and PostgreSQL. Filter out cancelled orders (status <> \'Cancelled\').',
    hints: [
      'Use DATEPART(QUARTER, …) in MSSQL or EXTRACT(QUARTER FROM …) in PostgreSQL to derive the quarter.',
      'Wrap in CASE WHEN quarter = 1 THEN revenue END inside SUM.',
      'Add a WHERE status <> \'Cancelled\' before the GROUP BY.',
    ],
    starterCode: `-- orders(id, product_category, revenue, order_date, status)
SELECT
    product_category,
    -- Q1 column here
    -- Q2 column here
    -- Q3 column here
    -- Q4 column here
FROM orders
WHERE status <> 'Cancelled'
GROUP BY product_category
ORDER BY product_category;`,
    solution: `SELECT
    product_category,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 1 THEN revenue ELSE 0 END) AS Q1,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 2 THEN revenue ELSE 0 END) AS Q2,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 3 THEN revenue ELSE 0 END) AS Q3,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 4 THEN revenue ELSE 0 END) AS Q4
FROM orders
WHERE status <> 'Cancelled'
GROUP BY product_category
ORDER BY product_category;

-- MSSQL variant uses DATEPART(QUARTER, order_date)`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which approach works in both MSSQL and PostgreSQL for pivoting?',
      options: ['PIVOT operator', 'Conditional aggregation with CASE', 'crosstab()', 'UNPIVOT'],
      answer: 1,
      explanation: 'Conditional aggregation with SUM/MAX + CASE WHEN is the only portable technique supported by all major SQL engines.'
    },
    {
      q: 'What does QUOTENAME() do in a dynamic PIVOT query?',
      options: ['Trims whitespace from column names', 'Wraps a name in square brackets to prevent SQL injection', 'Converts a value to a quoted string literal', 'Validates that a column exists'],
      answer: 1,
      explanation: 'QUOTENAME() wraps identifiers in square brackets ([Name]), preventing SQL injection when building dynamic column lists from user-controlled data.'
    },
    {
      q: 'The crosstab() function in PostgreSQL requires which extension?',
      options: ['pg_stat_statements', 'tablefunc', 'uuid-ossp', 'pg_trgm'],
      answer: 1,
      explanation: 'crosstab() ships with the tablefunc extension. Run CREATE EXTENSION tablefunc; once per database before using it.'
    },
    {
      q: 'UNPIVOT is the inverse of PIVOT — what does it do?',
      options: ['Removes duplicate rows', 'Turns rows into columns', 'Turns columns into rows', 'Aggregates a pivoted result'],
      answer: 2,
      explanation: 'UNPIVOT rotates column values back into rows, which is useful for normalising wide tables for further processing.'
    },
    {
      q: 'What is the main limitation of the MSSQL PIVOT operator vs conditional aggregation?',
      options: [
        'PIVOT is slower than conditional aggregation',
        'PIVOT requires the column values to be known at query write time — dynamic values require dynamic SQL',
        'PIVOT can only aggregate COUNT, not SUM or MAX',
        'PIVOT requires a primary key on the source table'
      ],
      answer: 1,
      explanation: 'The PIVOT IN list must be a static set of literals. If the pivot columns come from data (e.g., product names in a table), you must query those values, build a dynamic SQL string, and EXEC it. Conditional aggregation with CASE is equally static but is easier to extend dynamically.'
    },
    {
      q: 'How do you handle NULL in a MSSQL PIVOT cell — showing 0 instead of NULL?',
      options: [
        'Use ISNULL() in the source query before pivoting',
        'Wrap each pivoted column in ISNULL([col], 0) in the outer SELECT',
        'Add ELSE 0 inside the PIVOT aggregate function',
        'NULL cannot appear in PIVOT output'
      ],
      answer: 1,
      explanation: 'PIVOT outputs NULL for missing category/row combinations. Wrap the column references in the outer SELECT with ISNULL([Jan], 0), ISNULL([Feb], 0) etc. to replace NULL with zero. Alternatively, use COALESCE for portability.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why do PIVOT column names have to be static in MSSQL?',
      a: 'SQL Server must plan the query shape (number and type of output columns) at parse time. The IN list is used to generate output columns before any data is read, so dynamic values require building and executing a dynamic SQL string.',
    },
    {
      q: 'Is the FILTER clause in PostgreSQL better than CASE for conditional aggregation?',
      a: 'FILTER (WHERE …) is cleaner syntax and can be slightly faster because the planner can skip rows earlier, but both produce identical results. CASE is more portable (works in MSSQL, MySQL, SQLite).',
    },
    {
      q: 'How do I pivot with NULL values instead of 0 for missing data?',
      a: 'Drop the ELSE 0 clause: SUM(CASE WHEN category=\'X\' THEN amount END). Without an ELSE, CASE returns NULL for non-matching rows, and SUM of all NULLs returns NULL rather than 0.',
    },
    {
      q: 'How do I build a dynamic PIVOT in MSSQL when column values come from the data?',
      a: 'Query the distinct pivot values: SELECT @cols = STRING_AGG(QUOTENAME(category), \',\') FROM (SELECT DISTINCT category FROM sales) t; then build the dynamic SQL: SET @sql = \'SELECT date, \' + @cols + \' FROM sales PIVOT (SUM(amount) FOR category IN (\' + @cols + \')) p;\'; EXEC sp_executesql @sql;',
    },
    {
      q: 'Can I use UNPIVOT with multiple value columns?',
      a: 'Standard UNPIVOT only handles one value column at a time. For multiple value columns (e.g., qty and price for each month), use CROSS APPLY with VALUES: SELECT month, metric, value FROM sales CROSS APPLY (VALUES (\'qty\', jan_qty), (\'qty\', feb_qty), (\'price\', jan_price)) v(metric, value). This is more flexible and portable.',
    },
    {
      q: 'What is the performance impact of pivoting large datasets?',
      a: 'Conditional aggregation and PIVOT both require a single pass through the source data with GROUP BY — O(n) with a sort or hash aggregate. Performance depends on GROUP BY column cardinality and aggregate column count. For very wide pivots (hundreds of columns), consider materialising the pivoted result into a temp table or indexed view rather than computing it on every report request.',
    },
  ];
}
