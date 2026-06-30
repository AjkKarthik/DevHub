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
  selector: 'app-sql-date-functions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './date-functions.html',
  styleUrl: './date-functions.scss',
})
export class SqlDateFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'GETDATE() / NOW()',         type: 'function', desc: 'Current date and time. MSSQL: GETDATE() or GETUTCDATE(). PostgreSQL: NOW() or CURRENT_TIMESTAMP.' },
    { name: 'DATEADD(part, n, date)',    type: 'function', desc: 'MSSQL: add n units to a date. PostgreSQL: date + INTERVAL \'n days\'.' },
    { name: 'DATEDIFF(part, start, end)', type: 'function', desc: 'MSSQL: difference in specified units. PostgreSQL: AGE() or arithmetic subtraction.' },
    { name: 'DATEPART(part, date)',      type: 'function', desc: 'MSSQL: extract a date component as integer. PostgreSQL: EXTRACT(part FROM date).' },
    { name: 'DATE_TRUNC(part, date)',    type: 'function', desc: 'PostgreSQL: truncate date to specified precision (month, day, hour, etc.).' },
    { name: 'FORMAT(date, fmt)',         type: 'function', desc: 'MSSQL: format a date as string. PostgreSQL: TO_CHAR(date, format_string).' },
    { name: 'CAST / CONVERT',           type: 'function', desc: 'MSSQL: CONVERT(DATE, string, style) or CAST. PostgreSQL: CAST or :: operator.' },
    { name: 'AT TIME ZONE',             type: 'syntax',   desc: 'Convert timestamps between time zones. Available in both MSSQL (2016+) and PostgreSQL.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Always store timestamps in UTC',
      points: [
        'Store all timestamps in UTC and convert to local time only at the display layer. Mixing local times in the database causes bugs when daylight saving time changes.',
        'MSSQL: use DATETIME2 (higher precision, wider range) or DATETIMEOFFSET (stores UTC offset). PostgreSQL: use TIMESTAMPTZ (timestamp with time zone) — it always stores UTC and converts on retrieval.',
        'GETUTCDATE() (MSSQL) and NOW() AT TIME ZONE \'UTC\' (PostgreSQL) return the current UTC time. In PostgreSQL, NOW() always returns the transaction start time in UTC when the session timezone is UTC.',
      ],
    },
    {
      heading: 'Adding and subtracting dates',
      points: [
        'MSSQL: DATEADD(unit, n, date) — e.g., DATEADD(day, 7, order_date) to add 7 days.',
        'PostgreSQL: use interval arithmetic — order_date + INTERVAL \'7 days\'. Intervals support years, months, days, hours, minutes, seconds.',
        'MSSQL also supports direct arithmetic: date + 7 adds 7 days to a DATETIME. PostgreSQL arithmetic on a DATE returns a DATE; arithmetic on a TIMESTAMP returns a TIMESTAMP.',
      ],
    },
    {
      heading: 'Extracting date parts',
      points: [
        'MSSQL: DATEPART(year, date), DATEPART(month, date), YEAR(date), MONTH(date), DAY(date) — convenience aliases.',
        'PostgreSQL: EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date). The result is a double precision number.',
        'DATE_TRUNC is PostgreSQL-only and truncates a timestamp to a given precision — very useful for grouping by month/week: DATE_TRUNC(\'month\', created_at) groups all rows in a month to the first of the month.',
      ],
    },
    {
      heading: 'Calculating differences',
      points: [
        'MSSQL: DATEDIFF(unit, start, end) returns an integer — e.g., DATEDIFF(day, hire_date, GETDATE()) gives days employed.',
        'PostgreSQL: DATE_PART(\'day\', end_date - start_date) or AGE(end_date, start_date) which returns an interval. Subtract timestamps directly for exact interval.',
        'Be careful with DATEDIFF in MSSQL — DATEDIFF(month, \'2024-01-31\', \'2024-02-01\') returns 1, but they are only 1 day apart. It counts boundary crossings, not elapsed time.',
      ],
    },
    {
      heading: 'Formatting dates as strings',
      points: [
        'MSSQL: FORMAT(date, \'yyyy-MM-dd\') or CONVERT(VARCHAR, date, 126) for ISO 8601. FORMAT is locale-aware but slower; CONVERT is faster for simple formats.',
        'PostgreSQL: TO_CHAR(date, \'YYYY-MM-DD\') — format codes are different from MSSQL. DD = day, MM = month, YYYY = 4-digit year, HH24 = 24-hour hour.',
        'For sorting and filtering, always compare timestamps directly — never convert to string first, as string comparison gives wrong date order for non-ISO formats.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Current date/time',
      language: 'sql',
      code: `-- MSSQL
SELECT
    GETDATE()       AS local_time,   -- local server time (avoid)
    GETUTCDATE()    AS utc_time,     -- UTC (preferred)
    SYSDATETIMEOFFSET() AS with_offset;

-- PostgreSQL
SELECT
    NOW()               AS utc_time,           -- transaction start time, UTC
    CURRENT_TIMESTAMP   AS current_ts,          -- same as NOW()
    CLOCK_TIMESTAMP()   AS wall_clock;          -- actual wall-clock time

-- Filter rows from the last 7 days
-- MSSQL
SELECT * FROM orders WHERE created_at >= DATEADD(day, -7, GETUTCDATE());
-- PostgreSQL
SELECT * FROM orders WHERE created_at >= NOW() - INTERVAL '7 days';`,
    },
    {
      label: 'DATEADD / INTERVAL',
      language: 'sql',
      code: `-- MSSQL: DATEADD
SELECT
    DATEADD(day,    7,  order_date)  AS plus_7_days,
    DATEADD(month, -1,  order_date)  AS minus_1_month,
    DATEADD(year,   1,  order_date)  AS plus_1_year,
    DATEADD(hour,   3,  created_at)  AS plus_3_hours
FROM orders;

-- PostgreSQL: interval arithmetic
SELECT
    order_date + INTERVAL '7 days'   AS plus_7_days,
    order_date - INTERVAL '1 month'  AS minus_1_month,
    order_date + INTERVAL '1 year'   AS plus_1_year,
    created_at + INTERVAL '3 hours'  AS plus_3_hours
FROM orders;`,
    },
    {
      label: 'DATEDIFF / AGE',
      language: 'sql',
      code: `-- MSSQL: DATEDIFF
SELECT
    DATEDIFF(day,   hire_date, GETDATE()) AS days_employed,
    DATEDIFF(year,  birth_date, GETDATE()) AS age_years,
    DATEDIFF(month, start_date, end_date)  AS months_between
FROM employees;

-- PostgreSQL: DATE_PART or AGE
SELECT
    DATE_PART('day', NOW() - hire_date)       AS days_employed,
    DATE_PART('year', AGE(birth_date))         AS age_years,
    AGE(end_date, start_date)                  AS interval_between
FROM employees;

-- Days between two dates in PostgreSQL
SELECT (end_date::date - start_date::date) AS days FROM projects;`,
    },
    {
      label: 'DATEPART / EXTRACT + DATE_TRUNC',
      language: 'sql',
      code: `-- MSSQL: extract parts
SELECT
    YEAR(order_date)          AS order_year,
    MONTH(order_date)         AS order_month,
    DATEPART(weekday, order_date) AS day_of_week,  -- 1=Sunday in default
    DATEPART(quarter, order_date) AS quarter
FROM orders;

-- PostgreSQL: EXTRACT
SELECT
    EXTRACT(YEAR  FROM order_date) AS order_year,
    EXTRACT(MONTH FROM order_date) AS order_month,
    EXTRACT(DOW   FROM order_date) AS day_of_week,  -- 0=Sunday
    EXTRACT(QUARTER FROM order_date) AS quarter
FROM orders;

-- PostgreSQL: DATE_TRUNC for grouping
SELECT
    DATE_TRUNC('month', order_date) AS month_start,
    COUNT(*) AS orders,
    SUM(total) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month_start;`,
    },
    {
      label: 'Formatting & time zones',
      language: 'sql',
      code: `-- MSSQL: FORMAT and CONVERT
SELECT
    FORMAT(GETDATE(), 'yyyy-MM-dd')             AS iso_date,
    FORMAT(GETDATE(), 'dd/MM/yyyy')             AS uk_date,
    CONVERT(VARCHAR, order_date, 126)           AS iso_8601
FROM orders;

-- PostgreSQL: TO_CHAR
SELECT
    TO_CHAR(NOW(), 'YYYY-MM-DD')                AS iso_date,
    TO_CHAR(NOW(), 'DD/MM/YYYY')                AS uk_date,
    TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')  AS iso_8601
FROM orders;

-- Time zone conversion
-- MSSQL (2016+)
SELECT created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time' AS us_east;

-- PostgreSQL
SELECT created_at AT TIME ZONE 'America/New_York' AS us_east;
SELECT created_at::timestamptz AT TIME ZONE 'Europe/London' AS uk_time;`,
    },
  ];

  challenge: Challenge = {
    title: 'Monthly revenue report',
    language: 'sql',
    description: `Given: orders(id, customer_id, order_date TIMESTAMP, total DECIMAL)

Write a PostgreSQL query that returns monthly revenue for the last 12 months:
- month_start: first day of each month (DATE_TRUNC)
- order_count: number of orders that month
- revenue: total revenue that month
- avg_order: average order value (rounded to 2 decimal places)

Sort by month_start ascending.`,
    hints: [
      'DATE_TRUNC(\'month\', order_date) groups all orders in the same month',
      'Filter: order_date >= NOW() - INTERVAL \'12 months\'',
      'ROUND(AVG(total), 2) for the average',
    ],
    starterCode: `SELECT
    -- month_start
    -- order_count
    -- revenue
    -- avg_order
FROM orders
-- WHERE: last 12 months
-- GROUP BY month
-- ORDER BY month`,
    solution: `SELECT
    DATE_TRUNC('month', order_date)    AS month_start,
    COUNT(*)                            AS order_count,
    SUM(total)                          AS revenue,
    ROUND(AVG(total), 2)               AS avg_order
FROM orders
WHERE order_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month_start;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the PostgreSQL equivalent of MSSQL\'s DATEADD(day, 7, order_date)?',
      options: [
        'DATE_ADD(order_date, 7)',
        "order_date + INTERVAL '7 days'",
        'DATEADD(order_date, 7)',
        'ADD_DAYS(order_date, 7)',
      ],
      answer: 1,
      explanation: "PostgreSQL uses interval arithmetic: order_date + INTERVAL '7 days'. The INTERVAL keyword accepts plain-English units.",
    },
    {
      q: 'Which PostgreSQL function truncates a timestamp to the start of its month?',
      options: ['EXTRACT(MONTH FROM ts)', 'TRUNC(ts)', "DATE_TRUNC('month', ts)", 'FLOOR_DATE(ts)'],
      answer: 2,
      explanation: "DATE_TRUNC('month', ts) returns the first day of the month at midnight. It's essential for grouping by month in aggregation queries.",
    },
    {
      q: 'What data type should you use in PostgreSQL to store timestamps that include time zone information?',
      options: ['TIMESTAMP', 'DATETIME', 'TIMESTAMPTZ', 'DATETIMEOFFSET'],
      answer: 2,
      explanation: 'TIMESTAMPTZ (timestamp with time zone) stores UTC internally and converts to the session time zone on retrieval. Plain TIMESTAMP stores no zone info.',
    },
    {
      q: 'MSSQL DATEDIFF(month, \'2024-01-31\', \'2024-02-01\') returns what?',
      options: ['0', '1', '31', 'Error — invalid date range'],
      answer: 1,
      explanation: 'DATEDIFF counts boundary crossings of the specified part. Jan→Feb crosses one month boundary, so result is 1 — even though the dates are only 1 day apart.',
    },
    {
      q: 'Which MSSQL function returns the current UTC time?',
      options: ['NOW()', 'GETDATE()', 'GETUTCDATE()', 'CURRENT_TIMESTAMP'],
      answer: 2,
      explanation: 'GETUTCDATE() returns the current UTC time. GETDATE() and CURRENT_TIMESTAMP return the local server time, which depends on server configuration.',
    },
    {
      q: 'How does AT TIME ZONE work in MSSQL?',
      options: [
        'It displays the UTC offset of the given time zone as a number',
        'It converts a datetime or datetimeoffset to the specified named Windows time zone, handling DST automatically',
        'It is equivalent to DATEADD with an offset constant',
        'It converts a TIMESTAMPTZ to a plain TIMESTAMP'
      ],
      answer: 1,
      explanation: 'SELECT created_at AT TIME ZONE \'UTC\' AT TIME ZONE \'Eastern Standard Time\' returns a DATETIMEOFFSET adjusted to Eastern time. It uses the Windows time zone database (including DST rules), so the offset changes in March and November automatically.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I filter by today\'s date ignoring the time component?',
      a: "MSSQL: WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE) or WHERE created_at >= CONVERT(DATE, GETDATE()) AND created_at < DATEADD(day,1,CONVERT(DATE,GETDATE())). PostgreSQL: WHERE created_at::date = CURRENT_DATE or WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + 1. Avoid wrapping the column in a function — it prevents index use; instead, use a range on the raw column.",
    },
    {
      q: 'What is the difference between NOW() and CLOCK_TIMESTAMP() in PostgreSQL?',
      a: 'NOW() returns the transaction start time — it does not change during the transaction. CLOCK_TIMESTAMP() reads the actual wall-clock time and changes with each call. Use CLOCK_TIMESTAMP() when measuring elapsed time inside a transaction or procedure.',
    },
    {
      q: 'How do I handle daylight saving time correctly when storing and querying dates?',
      a: 'Store everything as UTC (DATETIMEOFFSET in MSSQL, TIMESTAMPTZ in PostgreSQL). Convert to local time zones only in the application layer or in a view. Never add DST offsets manually — use the database\'s AT TIME ZONE feature with named time zones (e.g., \'America/New_York\') which handles DST automatically.',
    },
    {
      q: 'How do I calculate a person\'s age correctly in SQL?',
      a: 'Simple subtraction underestimates for birthdays not yet reached this year. In PostgreSQL: EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) — AGE() returns an interval. In MSSQL: DATEDIFF(year, birth_date, GETDATE()) - CASE WHEN MONTH(birth_date) > MONTH(GETDATE()) OR (MONTH(birth_date) = MONTH(GETDATE()) AND DAY(birth_date) > DAY(GETDATE())) THEN 1 ELSE 0 END.',
    },
    {
      q: 'How do I truncate a date to the start of the fiscal year (April 1) in SQL?',
      a: 'Compute the calendar year of the fiscal year start: fiscal_year_start = CASE WHEN MONTH(dt) >= 4 THEN DATEFROMPARTS(YEAR(dt), 4, 1) ELSE DATEFROMPARTS(YEAR(dt) - 1, 4, 1) END (MSSQL). PostgreSQL: CASE WHEN EXTRACT(MONTH FROM dt) >= 4 THEN DATE_TRUNC(\'year\', dt) + INTERVAL \'3 months\' ELSE DATE_TRUNC(\'year\', dt) - INTERVAL \'9 months\' END.',
    },
    {
      q: 'How do I group sales data by month when the datetime column has both date and time?',
      a: 'Truncate to month before grouping: MSSQL: GROUP BY DATEADD(month, DATEDIFF(month, 0, order_date), 0) — returns the first of the month. PostgreSQL: GROUP BY DATE_TRUNC(\'month\', order_date). Both approaches let the optimizer use a range index on the raw order_date column rather than wrapping it in a function.',
    },
  ];
}
