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
  selector: 'app-sql-math-functions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './math-functions.html',
  styleUrl: './math-functions.scss',
})
export class SqlMathFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'ROUND(n, d)',    type: 'function', desc: 'Round n to d decimal places. ROUND(9.456, 2) = 9.46. Negative d rounds to tens/hundreds.' },
    { name: 'FLOOR(n)',       type: 'function', desc: 'Largest integer ≤ n. FLOOR(4.9) = 4, FLOOR(-4.1) = -5.' },
    { name: 'CEILING(n)',     type: 'function', desc: 'Smallest integer ≥ n. CEILING(4.1) = 5, CEILING(-4.9) = -4. CEIL() in PostgreSQL.' },
    { name: 'ABS(n)',         type: 'function', desc: 'Absolute value. ABS(-7) = 7. Works in both dialects.' },
    { name: 'POWER(n, exp)',  type: 'function', desc: 'n raised to exp. POWER(2, 10) = 1024. MSSQL: POWER. PostgreSQL: POWER or ^ operator.' },
    { name: 'SQRT(n)',        type: 'function', desc: 'Square root. SQRT(16) = 4. Both dialects.' },
    { name: 'LOG(n) / LOG(b, n)', type: 'function', desc: 'Natural log (LOG in PostgreSQL) or base-b log. MSSQL LOG(n) = natural; LOG(n, b) = base-b.' },
    { name: 'MOD(n, d) / %', type: 'operator', desc: 'Modulo (remainder). MOD(10, 3) = 1. PostgreSQL: 10 % 3. MSSQL: 10 % 3 (operator).' },
    { name: 'RANDOM() / RAND()', type: 'function', desc: 'Random float [0,1). MSSQL: RAND(). PostgreSQL: RANDOM().' },
    { name: 'TRUNC(n, d)',    type: 'function', desc: 'Truncate (not round) to d decimal places. PostgreSQL: TRUNC. MSSQL: no TRUNC — use ROUND with TRUNCATE flag.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Integer division — the silent precision trap',
      points: [
        'In both T-SQL and PostgreSQL, dividing two integers performs integer division: 5 / 2 = 2, not 2.5. The fractional part is silently discarded.',
        'To get decimal division, cast at least one operand: 5.0 / 2, CAST(5 AS DECIMAL) / 2, or 5 * 1.0 / 2.',
        'This trap is especially dangerous in aggregations: AVG(integer_col) computes integer division internally in some scenarios. Always cast when exact decimal results matter.',
      ],
    },
    {
      heading: 'ROUND vs FLOOR vs CEILING vs TRUNC',
      points: [
        'ROUND(n, d) rounds to d decimal places using "round half up" in MSSQL. PostgreSQL uses "round half to even" (banker\'s rounding) for NUMERIC types.',
        'FLOOR returns the next lower integer; CEILING the next higher integer. For negative numbers: FLOOR(-4.1) = -5, CEILING(-4.9) = -4.',
        'TRUNC truncates (chops off) without rounding. PostgreSQL has TRUNC(n, d). MSSQL has no TRUNC — use ROUND(n, d, 1) where the third argument 1 means truncate instead of round.',
      ],
    },
    {
      heading: 'Money arithmetic — use DECIMAL not FLOAT',
      points: [
        'Never use FLOAT or DOUBLE PRECISION for monetary values. Floating-point arithmetic is approximate: 0.1 + 0.2 ≠ 0.3 in binary floating point.',
        'Use DECIMAL(p, s) or NUMERIC(p, s) for money. p is total significant digits; s is decimal places. DECIMAL(18, 2) is a common money type.',
        'When performing percentage calculations on DECIMAL columns, the result precision follows SQL rules — multiply by 1.0 or cast explicitly to ensure adequate precision in the output.',
      ],
    },
    {
      heading: 'Modulo, power, and logarithms',
      points: [
        'Modulo (remainder): in both dialects, use the % operator: 17 % 5 = 2. PostgreSQL also has MOD(n, d). Useful for alternating rows, cyclic numbering, and even/odd detection.',
        'POWER(base, exp) raises a number to a power. PostgreSQL also supports the ^ operator: 2 ^ 10 = 1024.',
        'LOG(n) in MSSQL returns the natural logarithm. LOG(n, base) returns log in a given base. PostgreSQL: LN(n) for natural log, LOG(n) for base-10, LOG(base, n) for custom base.',
      ],
    },
    {
      heading: 'Random numbers and sampling',
      points: [
        'RAND() (MSSQL) and RANDOM() (PostgreSQL) return a random float in [0, 1). Each call within a query returns the same value in MSSQL (call RAND() once); PostgreSQL re-evaluates per row.',
        'To get a random integer in range [min, max]: FLOOR(RANDOM() * (max - min + 1)) + min in PostgreSQL. MSSQL: FLOOR(RAND() * (max - min + 1)) + min.',
        'For random row sampling use TABLESAMPLE (MSSQL/PostgreSQL) for large tables, or ORDER BY NEWID() (MSSQL) / ORDER BY RANDOM() (PostgreSQL) for small tables — the latter is slow on large datasets.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Rounding functions',
      language: 'sql',
      code: `-- ROUND, FLOOR, CEILING (both dialects)
SELECT
    price,
    ROUND(price, 2)         AS rounded_2dp,
    ROUND(price, 0)         AS rounded_integer,
    ROUND(price, -2)        AS rounded_hundreds,   -- e.g. 1234 -> 1200
    FLOOR(price)            AS floored,
    CEILING(price)          AS ceilinged,
    ABS(price - list_price) AS price_diff
FROM products;

-- TRUNC: truncate without rounding
-- PostgreSQL
SELECT TRUNC(9.999, 2);      -- 9.99 (not 10.00)

-- MSSQL: use ROUND with third arg = 1 (truncate mode)
SELECT ROUND(9.999, 2, 1);   -- 9.990 (truncated)`,
    },
    {
      label: 'Integer division trap',
      language: 'sql',
      code: `-- TRAP: integer / integer = integer (truncated)
SELECT 7 / 2;          -- returns 3, not 3.5

-- FIX: cast one operand to decimal
SELECT 7.0 / 2;        -- 3.5
SELECT CAST(7 AS DECIMAL(10,2)) / 2;  -- 3.500000...

-- In aggregations: careful with AVG on INT column
SELECT AVG(quantity)            AS int_avg,     -- may lose precision
       AVG(quantity * 1.0)      AS decimal_avg  -- correct
FROM order_items;

-- Percentage calculation
SELECT
    shipped,
    total,
    ROUND(shipped * 100.0 / NULLIF(total, 0), 1) AS pct_shipped
FROM order_summary;`,
    },
    {
      label: 'POWER, SQRT, LOG, MOD',
      language: 'sql',
      code: `-- MSSQL
SELECT
    POWER(2, 10)        AS two_to_ten,       -- 1024
    SQRT(144)           AS sqrt_144,          -- 12
    LOG(2.718281828)    AS natural_log,       -- ~1 (e)
    LOG(100, 10)        AS log_base10,        -- 2
    17 % 5              AS modulo;            -- 2

-- PostgreSQL
SELECT
    POWER(2, 10)        AS two_to_ten,       -- 1024
    2 ^ 10              AS two_to_ten_op,    -- 1024
    SQRT(144)           AS sqrt_144,
    LN(2.718281828)     AS natural_log,      -- ~1
    LOG(100)            AS log_base10,       -- 2
    LOG(2, 1024)        AS log_base2,        -- 10
    17 % 5              AS modulo;`,
    },
    {
      label: 'Money arithmetic',
      language: 'sql',
      code: `-- Use DECIMAL for money — never FLOAT
CREATE TABLE prices (
    id       INT PRIMARY KEY,
    amount   DECIMAL(18, 2) NOT NULL  -- 18 sig digits, 2 decimal places
);

-- Apply a 15% tax — explicit DECIMAL precision
SELECT
    amount,
    ROUND(amount * 0.15, 2)          AS tax,
    ROUND(amount * 1.15, 2)          AS total_with_tax
FROM prices;

-- Avoid float precision errors:
-- WRONG: 0.1 + 0.2 with FLOAT may give 0.30000000000000004
SELECT CAST(0.1 AS FLOAT) + CAST(0.2 AS FLOAT);   -- may not equal 0.3

-- CORRECT: DECIMAL arithmetic is exact
SELECT CAST(0.1 AS DECIMAL(5,1)) + CAST(0.2 AS DECIMAL(5,1));  -- 0.3`,
    },
    {
      label: 'Random sampling',
      language: 'sql',
      code: `-- Random integer 1–100 (PostgreSQL)
SELECT FLOOR(RANDOM() * 100 + 1)::INT AS rand_1_to_100;

-- Random integer 1–100 (MSSQL)
SELECT FLOOR(RAND() * 100 + 1);

-- Random sample of 10 rows (PostgreSQL — small tables)
SELECT * FROM customers ORDER BY RANDOM() LIMIT 10;

-- Random sample of 10 rows (MSSQL — small tables)
SELECT TOP 10 * FROM customers ORDER BY NEWID();

-- Efficient sampling of large tables with TABLESAMPLE
-- PostgreSQL: SYSTEM samples ~N% of data pages (fast, approximate)
SELECT * FROM orders TABLESAMPLE SYSTEM (1);  -- ~1% of rows

-- MSSQL: TABLESAMPLE with row count
SELECT * FROM orders TABLESAMPLE (1000 ROWS);`,
    },
  ];

  challenge: Challenge = {
    title: 'Pricing calculator query',
    language: 'sql',
    description: `Given: products(id, name, cost DECIMAL(10,2), list_price DECIMAL(10,2), discount_pct DECIMAL(5,2))

Write a query that calculates:
1. sale_price: list_price reduced by discount_pct (e.g. 10% discount → * 0.9), rounded to 2dp
2. margin: sale_price minus cost, rounded to 2dp
3. margin_pct: margin as a percentage of sale_price, rounded to 1dp
4. price_band: 'Budget' (<50), 'Mid' (50–199.99), 'Premium' (200+) based on sale_price

Guard against division by zero in margin_pct.`,
    hints: [
      'sale_price = ROUND(list_price * (1 - discount_pct/100), 2)',
      'margin_pct: multiply by 100.0 and divide by NULLIF(sale_price, 0)',
      'CASE WHEN sale_price < 50 THEN … for price_band',
    ],
    starterCode: `SELECT
    id,
    name,
    -- sale_price
    -- margin
    -- margin_pct
    -- price_band
FROM products;`,
    solution: `SELECT
    id,
    name,
    ROUND(list_price * (1 - discount_pct / 100.0), 2)             AS sale_price,
    ROUND(list_price * (1 - discount_pct / 100.0) - cost, 2)      AS margin,
    ROUND(
        (list_price * (1 - discount_pct / 100.0) - cost) * 100.0
        / NULLIF(list_price * (1 - discount_pct / 100.0), 0)
    , 1)                                                            AS margin_pct,
    CASE
        WHEN list_price * (1 - discount_pct / 100.0) < 50    THEN 'Budget'
        WHEN list_price * (1 - discount_pct / 100.0) < 200   THEN 'Mid'
        ELSE 'Premium'
    END                                                             AS price_band
FROM products;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does 7 / 2 return in both MSSQL and PostgreSQL?',
      options: ['3.5', '3', '4', 'Error'],
      answer: 1,
      explanation: 'Integer division truncates the fractional part. 7 / 2 = 3 in both dialects. Cast to decimal (7.0 / 2 or CAST(7 AS DECIMAL) / 2) to get 3.5.',
    },
    {
      q: 'What does ROUND(1234.5, -2) return?',
      options: ['1234.50', '1200', '1235', '1300'],
      answer: 1,
      explanation: 'Negative decimal places round to the left of the decimal point. -2 rounds to the nearest hundred: 1234.5 → 1200.',
    },
    {
      q: 'Which data type should you use for monetary values?',
      options: ['FLOAT', 'DOUBLE PRECISION', 'DECIMAL(p,s) or NUMERIC(p,s)', 'REAL'],
      answer: 2,
      explanation: 'FLOAT/REAL are binary floating-point and are not exact. DECIMAL/NUMERIC store exact decimal values and are the correct choice for money.',
    },
    {
      q: 'In PostgreSQL, what does LN(n) compute?',
      options: ['Log base 10', 'Log base 2', 'Natural logarithm (base e)', 'Log base n'],
      answer: 2,
      explanation: 'LN(n) is the natural logarithm (base e). PostgreSQL LOG(n) is base-10. MSSQL LOG(n) is natural log; LOG(n, base) is base-specific.',
    },
    {
      q: 'How do you get a random row sample efficiently from a very large table?',
      options: [
        'ORDER BY RANDOM() LIMIT n',
        'WHERE id % 100 = 0',
        'TABLESAMPLE SYSTEM (1)',
        'TOP 1 PERCENT',
      ],
      answer: 2,
      explanation: 'TABLESAMPLE SYSTEM samples at the page level without reading every row, making it efficient for large tables. ORDER BY RANDOM() does a full scan and sort.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is banker\'s rounding and does it affect SQL results?',
      a: 'Banker\'s rounding (round half to even) rounds 0.5 to the nearest even number: 0.5 → 0, 1.5 → 2, 2.5 → 2. PostgreSQL uses this for NUMERIC types. MSSQL uses "round half up" (0.5 → 1). This matters when processing large volumes of financial calculations — the rounding method affects cumulative totals.',
    },
    {
      q: 'How do I compute a running total or cumulative sum?',
      a: 'Use a window function: SUM(amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING). This computes the cumulative sum up to and including the current row, ordered by date. Add PARTITION BY to reset the running total per group.',
    },
    {
      q: 'Why does AVG on an integer column sometimes give wrong results?',
      a: 'AVG(integer_col) computes an integer average in some cases — e.g., AVG of 1,2,3 is 2, not 2.0. To force decimal precision: AVG(col * 1.0) or AVG(CAST(col AS DECIMAL(10,4))). Always check the return type when computing averages on integer columns.',
    },
  ];
}
