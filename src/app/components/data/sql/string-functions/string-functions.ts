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
  selector: 'app-sql-string-functions',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './string-functions.html',
  styleUrl: './string-functions.scss',
})
export class SqlStringFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'LEN(s) / LENGTH(s)',        type: 'function', desc: 'Character count. MSSQL: LEN (excludes trailing spaces). PostgreSQL: LENGTH.' },
    { name: 'SUBSTRING(s, start, len)',  type: 'function', desc: 'Extract a portion. MSSQL uses 1-based indexing. PostgreSQL: SUBSTRING or SUBSTR.' },
    { name: 'CHARINDEX(find, s)',        type: 'function', desc: 'MSSQL: position of substring (0 = not found). PostgreSQL: POSITION(find IN s) or STRPOS.' },
    { name: 'REPLACE(s, old, new)',      type: 'function', desc: 'Replace all occurrences of old with new. Case-sensitive in MSSQL; case-insensitive in PostgreSQL when using citext.' },
    { name: 'UPPER(s) / LOWER(s)',       type: 'function', desc: 'Change case. Works identically in both dialects.' },
    { name: 'LTRIM/RTRIM/TRIM(s)',       type: 'function', desc: 'Remove whitespace. MSSQL 2017+: TRIM. PostgreSQL: TRIM, LTRIM, RTRIM.' },
    { name: 'CONCAT(a, b, …)',           type: 'function', desc: 'Concatenate strings. NULL-safe in MSSQL (treats NULL as empty). Use || in PostgreSQL.' },
    { name: 'FORMAT(val, fmt)',          type: 'function', desc: 'MSSQL: format numbers/dates as strings. PostgreSQL: TO_CHAR(val, fmt).' },
    { name: 'LIKE / ILIKE',             type: 'operator', desc: 'Pattern match: % = any chars, _ = single char. ILIKE is case-insensitive (PostgreSQL only).' },
    { name: 'STRING_AGG(col, sep)',      type: 'function', desc: 'Aggregate rows into a delimited string. Both dialects (MSSQL 2017+, PostgreSQL 9.0+).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'String functions are not portable — know the dialect',
      points: [
        'SQL string functions are among the least portable parts of SQL. MSSQL (T-SQL) and PostgreSQL share most common functions but differ on names, argument order, and case sensitivity.',
        'Key differences: MSSQL uses LEN, CHARINDEX, PATINDEX; PostgreSQL uses LENGTH, POSITION, STRPOS, and the ~ regex operator. Concatenation is + in MSSQL and || in PostgreSQL (both support CONCAT()).',
        'String comparisons in MSSQL are case-insensitive by default (controlled by collation). PostgreSQL is case-sensitive by default — use ILIKE or LOWER(col) = LOWER(value) for case-insensitive searches.',
      ],
    },
    {
      heading: 'Extraction and position',
      points: [
        'SUBSTRING(s, start, length) extracts a portion — indices are 1-based in both dialects. In PostgreSQL you can also use SUBSTR(s, start) or SUBSTR(s, start, length).',
        'CHARINDEX(needle, haystack) returns the 1-based position of needle in haystack (MSSQL). In PostgreSQL use POSITION(needle IN haystack) or STRPOS(haystack, needle).',
        'LEFT(s, n) and RIGHT(s, n) extract from the start or end — available in both dialects. Useful for fixed-format strings like phone numbers or codes.',
      ],
    },
    {
      heading: 'Cleaning and transforming',
      points: [
        'TRIM removes leading and trailing whitespace. LTRIM and RTRIM remove from one side. In MSSQL before 2017, there is no combined TRIM — use LTRIM(RTRIM(s)).',
        'REPLACE(s, old, new) is case-sensitive in MSSQL (unless collation is CI). Chain REPLACE calls to clean multiple patterns.',
        'UPPER and LOWER normalise case. This is especially important in MSSQL where column comparison is often case-insensitive but explicit normalisation helps with GROUP BY and joins.',
      ],
    },
    {
      heading: 'Searching with LIKE and regex',
      points: [
        'LIKE uses % (any characters) and _ (single character) wildcards. Prefix searches (col LIKE \'abc%\') can use an index; mid-string (\'%abc%\') cannot.',
        'ILIKE in PostgreSQL is the case-insensitive variant of LIKE. In MSSQL, LIKE is already case-insensitive when the collation is CI (the default).',
        'PostgreSQL supports POSIX regex with ~ (match), !~ (no match), ~* (case-insensitive match). MSSQL has PATINDEX for limited pattern matching but no full regex support natively.',
      ],
    },
    {
      heading: 'Aggregation and splitting',
      points: [
        'STRING_AGG(column, separator) aggregates rows into a single delimited string. Both MSSQL (2017+) and PostgreSQL (9.0+) support it. Add ORDER BY inside the call in PostgreSQL: STRING_AGG(name, \', \' ORDER BY name).',
        'MSSQL also has FOR XML PATH(\'\') for older string concatenation and STRING_SPLIT to split a delimited string into rows. PostgreSQL uses STRING_TO_ARRAY and UNNEST.',
        'Avoid storing delimited values in a column — normalise to a child table instead. If you must split, use these functions only at the read layer.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic functions',
      language: 'sql',
      code: `-- Both dialects
SELECT
    UPPER(name)                          AS upper_name,
    LOWER(email)                         AS lower_email,
    TRIM(address)                        AS trimmed,
    REPLACE(phone, '-', '')              AS digits_only,
    CONCAT(first_name, ' ', last_name)  AS full_name
FROM customers;

-- MSSQL-specific
SELECT
    LEN(description)                     AS char_count,
    LEFT(product_code, 3)               AS category_prefix,
    CHARINDEX('-', product_code)         AS dash_position,
    SUBSTRING(product_code, 5, 3)        AS part_number
FROM products;

-- PostgreSQL-specific
SELECT
    LENGTH(description)                  AS char_count,
    STRPOS(product_code, '-')            AS dash_position,
    SUBSTRING(product_code FROM 5 FOR 3) AS part_number,
    product_code ~ '^[A-Z]{3}-\d+$'     AS matches_code_pattern
FROM products;`,
    },
    {
      label: 'LIKE / ILIKE',
      language: 'sql',
      code: `-- Prefix search — can use index on name
SELECT * FROM products WHERE name LIKE 'Widget%';

-- Contains search — full table scan
SELECT * FROM products WHERE name LIKE '%blue%';

-- PostgreSQL: case-insensitive search
SELECT * FROM products WHERE name ILIKE '%blue%';

-- MSSQL: LIKE is already case-insensitive with default CI collation
-- For explicit case-sensitive search, use binary collation:
SELECT * FROM products WHERE name LIKE '%blue%' COLLATE Latin1_General_CS_AS;

-- Escape the wildcard characters
-- Find rows where name contains a literal %
SELECT * FROM products WHERE name LIKE '%\%%' ESCAPE '\';`,
    },
    {
      label: 'STRING_AGG',
      language: 'sql',
      code: `-- PostgreSQL: ordered list of product names per category
SELECT
    category,
    STRING_AGG(name, ', ' ORDER BY name) AS product_list
FROM products
GROUP BY category;

-- MSSQL: STRING_AGG (SQL Server 2017+)
SELECT
    category,
    STRING_AGG(name, ', ') WITHIN GROUP (ORDER BY name) AS product_list
FROM products
GROUP BY category;

-- MSSQL: older servers — FOR XML PATH trick
SELECT
    category,
    STUFF((
        SELECT ', ' + p2.name
        FROM products p2
        WHERE p2.category = p1.category
        ORDER BY p2.name
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS product_list
FROM products p1
GROUP BY category;`,
    },
    {
      label: 'Split & format',
      language: 'sql',
      code: `-- MSSQL: split comma-delimited string into rows (SQL Server 2016+)
SELECT value AS tag
FROM STRING_SPLIT('angular,csharp,sql', ',');

-- PostgreSQL: split into array then unnest
SELECT unnest(STRING_TO_ARRAY('angular,csharp,sql', ',')) AS tag;

-- MSSQL: FORMAT for display
SELECT
    FORMAT(price, 'C', 'en-US')        AS price_usd,   -- $9.99
    FORMAT(GETDATE(), 'yyyy-MM-dd')     AS today_str;

-- PostgreSQL: TO_CHAR
SELECT
    TO_CHAR(price, 'FM$999,999.00')    AS price_fmt,
    TO_CHAR(NOW(), 'YYYY-MM-DD')        AS today_str;`,
    },
    {
      label: 'Cleaning dirty data',
      language: 'sql',
      code: `-- Normalise phone numbers: keep digits only (MSSQL recursive replace)
-- Simple: remove common separators
SELECT
    REPLACE(REPLACE(REPLACE(REPLACE(phone, '-',''), ' ',''), '(',''), ')','')
    AS clean_phone
FROM contacts;

-- PostgreSQL: regex replace
SELECT
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g') AS clean_phone
FROM contacts;

-- MSSQL: trim and normalise email
UPDATE customers
SET email = LOWER(TRIM(email))
WHERE email <> LOWER(TRIM(email));

-- Find rows with non-printable / whitespace-only names
SELECT * FROM customers WHERE TRIM(name) = '' OR name IS NULL;`,
    },
  ];

  challenge: Challenge = {
    title: 'Name normaliser query',
    language: 'sql',
    description: `Given a customers table with columns: id, first_name, last_name, email, phone.

Write a single SELECT that returns:
1. full_name: "Last, First" format, with each part trimmed and title-cased (first letter upper, rest lower).
2. email_domain: the part after @ in the email address.
3. clean_phone: digits only (remove -, spaces, (, )).
4. name_length: total characters in the full name (before formatting).

Write it for PostgreSQL.`,
    hints: [
      'UPPER(SUBSTRING(s,1,1)) || LOWER(SUBSTRING(s,2)) for title case',
      'SPLIT_PART(email, \'@\', 2) gives the domain in PostgreSQL',
      'REGEXP_REPLACE(phone, \'[^0-9]\', \'\', \'g\') removes non-digits',
    ],
    starterCode: `SELECT
    -- full_name in "Last, First" format
    -- email_domain
    -- clean_phone
    -- name_length
FROM customers;`,
    solution: `SELECT
    UPPER(SUBSTRING(TRIM(last_name), 1, 1))  || LOWER(SUBSTRING(TRIM(last_name), 2))
    || ', '
    || UPPER(SUBSTRING(TRIM(first_name), 1, 1)) || LOWER(SUBSTRING(TRIM(first_name), 2))
        AS full_name,
    SPLIT_PART(LOWER(TRIM(email)), '@', 2)      AS email_domain,
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g')    AS clean_phone,
    LENGTH(TRIM(first_name)) + LENGTH(TRIM(last_name)) + 2
        AS name_length
FROM customers;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the PostgreSQL equivalent of MSSQL\'s CHARINDEX(needle, haystack)?',
      options: ['LOCATE()', 'STRPOS(haystack, needle)', 'FIND()', 'INDEXOF()'],
      answer: 1,
      explanation: 'STRPOS(haystack, needle) is the PostgreSQL equivalent. Note the argument order is reversed: CHARINDEX has (needle, haystack); STRPOS has (haystack, needle).',
    },
    {
      q: 'Which LIKE pattern can leverage an index on the searched column?',
      options: ["'%abc%'", "'_abc'", "'abc%'", "'%abc'"],
      answer: 2,
      explanation: "Prefix patterns like 'abc%' allow the database to perform an index range scan. Mid-string ('%abc%') and suffix ('%abc') patterns require a full scan.",
    },
    {
      q: 'What does MSSQL\'s CONCAT() do when one argument is NULL?',
      options: [
        'Returns NULL for the whole result',
        'Raises an error',
        'Treats NULL as an empty string',
        'Skips the NULL argument and concatenates the rest',
      ],
      answer: 2,
      explanation: "MSSQL's CONCAT() treats NULL as empty string. The + operator returns NULL if any operand is NULL. In PostgreSQL, || propagates NULL; use COALESCE to guard.",
    },
    {
      q: 'Which function aggregates multiple rows into a single comma-separated string?',
      options: ['GROUP_CONCAT()', 'STRING_AGG()', 'ARRAY_AGG()', 'LIST_AGG()'],
      answer: 1,
      explanation: 'STRING_AGG(column, separator) is available in both MSSQL (2017+) and PostgreSQL (9.0+). GROUP_CONCAT is MySQL; LIST_AGG is Oracle.',
    },
    {
      q: 'In PostgreSQL, how do you do a case-insensitive LIKE search?',
      options: ['Use LIKE with NOCASE option', 'Use ILIKE', 'Use LIKE with CI collation hint', 'Use REGEXP_LIKE with /i flag'],
      answer: 1,
      explanation: 'ILIKE is the PostgreSQL case-insensitive variant of LIKE. MSSQL LIKE is already case-insensitive by default when the collation is case-insensitive.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I search with LIKE or a full-text search index?',
      a: 'Use LIKE for simple pattern matches on small datasets or indexed prefix searches. For searching across large text columns or natural-language queries, use full-text search (MSSQL FTS or PostgreSQL tsvector/GIN) — LIKE \'%term%\' cannot use an index and performs a full scan.',
    },
    {
      q: 'How do I handle collation and case sensitivity in MSSQL?',
      a: 'MSSQL collations control case sensitivity (CI = case-insensitive, CS = case-sensitive) and accent sensitivity. The default is usually Latin1_General_CI_AS (case-insensitive). Append COLLATE Latin1_General_CS_AS to a column comparison to force case-sensitivity.',
    },
    {
      q: 'What is the PostgreSQL equivalent of MSSQL\'s STRING_SPLIT?',
      a: 'Use REGEXP_SPLIT_TO_TABLE(string, pattern) or STRING_TO_ARRAY(string, delimiter) combined with UNNEST. Example: SELECT unnest(STRING_TO_ARRAY(\'a,b,c\', \',\')) AS item.',
    },
  ];
}
