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
  selector: 'app-sql-data-types',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './data-types.html',
  styleUrl: './data-types.scss',
})
export class SqlDataTypes {

  quickRef: QuickRefItem[] = [
    { name: 'TINYINT',             type: 'type', desc: 'MSSQL: 1 byte, 0–255. PG: no TINYINT — use SMALLINT (2B, ±32 767).' },
    { name: 'SMALLINT',            type: 'type', desc: '2 bytes, ±32 767. Both dialects.' },
    { name: 'INT / INTEGER',       type: 'type', desc: '4 bytes, ±2.1 billion. Both dialects. Use for most IDs.' },
    { name: 'BIGINT',              type: 'type', desc: '8 bytes, ±9.2 × 10¹⁸. Both dialects. Use for PKs on high-volume tables.' },
    { name: 'DECIMAL(p,s)',        type: 'type', desc: 'Exact numeric. p = total digits, s = digits after decimal. Use for money, quantities. Both dialects.' },
    { name: 'FLOAT / REAL',        type: 'type', desc: 'Approximate binary floating point. Never use for money — rounding errors are unavoidable.' },
    { name: 'VARCHAR(n)',          type: 'type', desc: 'MSSQL: 1 byte/char (ASCII). PG: UTF-8 variable-length string. Both support VARCHAR(MAX) / TEXT.' },
    { name: 'NVARCHAR(n)',         type: 'type', desc: 'MSSQL-only: 2 bytes/char Unicode (UCS-2). Use for all user-visible text in MSSQL. No equivalent in PG — all strings are Unicode.' },
    { name: 'TEXT',                type: 'type', desc: 'PG: unlimited length UTF-8 string (preferred for long text). MSSQL: deprecated large-value type — use VARCHAR(MAX) instead.' },
    { name: 'DATE',                type: 'type', desc: 'Date only (no time). YYYY-MM-DD. Both dialects.' },
    { name: 'DATETIME2(n)',        type: 'type', desc: 'MSSQL: date + time, 0–7 fractional seconds precision. Preferred over the legacy DATETIME type.' },
    { name: 'TIMESTAMPTZ',        type: 'type', desc: 'PostgreSQL: timestamp with time zone — stored as UTC, displayed in session timezone. Always use this over plain TIMESTAMP.' },
    { name: 'BIT',                 type: 'type', desc: 'MSSQL: 1/0/NULL — not a true Boolean. PG equivalent: BOOLEAN (TRUE/FALSE/NULL).' },
    { name: 'UNIQUEIDENTIFIER',    type: 'type', desc: 'MSSQL: 128-bit GUID (16 bytes). Use NEWSEQUENTIALID() for PKs to reduce index fragmentation. PG: UUID type.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Integer Types — Choosing the Right Size',
      points: [
        'TINYINT (MSSQL only, 1B, 0–255): useful for status codes with a fixed small range (e.g. 0–10). Not available in PostgreSQL — use SMALLINT instead.',
        'SMALLINT (2B, ±32 767): lookup table IDs, flags, small enumerations. Both dialects.',
        'INT / INTEGER (4B, ±2.1B): the default choice for most integer columns and foreign keys. Both dialects.',
        'BIGINT (8B, ±9.2×10¹⁸): use for primary keys on tables expected to exceed ~500 million rows (INT overflows at 2.1B). Also use for counters, byte offsets, and financial amounts multiplied to avoid decimals.',
        'MSSQL-specific: TINYINT is the only type not available in PostgreSQL. Use SMALLINT there. Both support IDENTITY (MSSQL) / SERIAL or GENERATED ALWAYS AS IDENTITY (PostgreSQL) for auto-increment.',
      ],
    },
    {
      heading: 'String Types — VARCHAR, NVARCHAR, and TEXT',
      points: [
        'MSSQL VARCHAR(n): stores 1 byte per ASCII character. Efficient for codes, slugs, and ASCII-only data. Silently truncates data that does not fit the declared length.',
        'MSSQL NVARCHAR(n): stores 2 bytes per character (UCS-2 Unicode). Use for all user-visible text: names, descriptions, addresses. Collation controls sort order and case-sensitivity.',
        'MSSQL VARCHAR(MAX) / NVARCHAR(MAX): up to 2 GB. Stored in-row if ≤ 8 KB, otherwise off-row in LOB pages. Avoid in indexes — use a hash or a computed truncated column instead.',
        'PostgreSQL: ALL strings are UTF-8 Unicode. TEXT and VARCHAR are functionally identical internally; VARCHAR(n) adds a length check constraint. There is no NVARCHAR — the N prefix is meaningless in PostgreSQL.',
        'Always prefix string literals with N in MSSQL when storing Unicode: N\'José\' not \'José\'. Without the N prefix, non-ASCII characters may be silently corrupted if the column collation does not support them.',
      ],
    },
    {
      heading: 'Numeric Precision — DECIMAL vs FLOAT',
      points: [
        'DECIMAL(p, s) / NUMERIC(p, s): exact numeric. p = total significant digits, s = digits to the right of the decimal point. DECIMAL(10, 2) stores up to 99 999 999.99.',
        'FLOAT / REAL: IEEE 754 binary floating point. Approximate — not all decimal fractions can be represented exactly in binary. 0.1 + 0.2 = 0.30000000000000004 in binary floating point.',
        'Rule: NEVER store money, prices, or financial amounts as FLOAT. Use DECIMAL(19, 4) (covers up to 999 999 999 999 999.9999 with 4 decimal places). The MSSQL MONEY type is also approximate — prefer DECIMAL.',
        'PostgreSQL NUMERIC is identical to DECIMAL and is the preferred spelling. Both dialects support the standard DECIMAL(p, s) syntax.',
        'For very large or very small scientific values where approximate is acceptable (measurements, coordinates), FLOAT(53) / DOUBLE PRECISION is fine.',
      ],
    },
    {
      heading: 'Date and Time Types — Always Use UTC',
      points: [
        'DATE: date only, no time component. YYYY-MM-DD. Both dialects. Use for birthdays, event dates, and any value where time is irrelevant.',
        'MSSQL DATETIME (legacy): date + time, ±3.33 ms precision, range 1753–9999. Avoid in new schemas — DATETIME2 supersedes it.',
        'MSSQL DATETIME2(n): date + time, fractional seconds 0–7 (7 = 100ns precision). Use DATETIME2(0) for second precision, DATETIME2(7) for the maximum. SYSUTCDATETIME() returns current UTC as DATETIME2(7).',
        'MSSQL DATETIMEOFFSET: stores the UTC offset alongside the value. Useful when the originating timezone must be preserved (e.g. user-submitted appointments).',
        'PostgreSQL TIMESTAMP: date + time without timezone. Avoid for anything that could span timezones.',
        'PostgreSQL TIMESTAMPTZ (= TIMESTAMP WITH TIME ZONE): stores the value as UTC internally; displays it in the session\'s timezone. Always use TIMESTAMPTZ. NOW() / CURRENT_TIMESTAMP returns TIMESTAMPTZ.',
        'Universal rule: store all timestamps in UTC. Convert to local time in the application layer. Mixing timezones in storage is a major source of subtle bugs.',
      ],
    },
    {
      heading: 'Boolean, UUID, and PostgreSQL-Specific Types',
      points: [
        'MSSQL BIT: stores 1, 0, or NULL. Not a true Boolean — you cannot use WHERE is_active (must write WHERE is_active = 1). Packs 8 BIT columns into 1 byte of storage.',
        'PostgreSQL BOOLEAN: true Boolean type. Accepts TRUE/FALSE/NULL and text aliases (\'t\', \'yes\', \'on\', 1). Use directly in WHERE: WHERE is_active.',
        'UUID / UNIQUEIDENTIFIER: 128-bit globally unique identifier. MSSQL: UNIQUEIDENTIFIER; PG: UUID. Random UUIDs (NEWID() / gen_random_uuid()) as PKs cause index fragmentation — use NEWSEQUENTIALID() (MSSQL) or UUIDv7 (PG 17+) for sequential UUIDs that insert at the end of the B-tree.',
        'PostgreSQL-only types: ARRAY (e.g. INT[]), INET/CIDR for IP addresses, JSONB for binary JSON (indexed with GIN), HSTORE for string key-value pairs, geometric types (POINT, LINE, POLYGON). These have no direct MSSQL equivalents.',
        'MSSQL-only types: HIERARCHYID (for tree structures), GEOGRAPHY/GEOMETRY (spatial), ROWVERSION (auto-updated binary version number for optimistic locking), SQL_VARIANT (avoid).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Integer & numeric (both)',
      language: 'sql',
      code: `-- ── MSSQL ──────────────────────────────────────────────────────────────
CREATE TABLE products_mssql (
    product_id    INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    sku           VARCHAR(50)    NOT NULL,
    name          NVARCHAR(200)  NOT NULL,
    price         DECIMAL(10,2)  NOT NULL CHECK (price > 0),   -- NOT FLOAT
    stock_qty     INT            NOT NULL DEFAULT 0,
    weight_kg     DECIMAL(8,3)   NULL,
    tax_rate      DECIMAL(5,4)   NOT NULL DEFAULT 0.2000,      -- 20.00%
    view_count    BIGINT         NOT NULL DEFAULT 0,           -- could exceed INT range
    is_active     BIT            NOT NULL DEFAULT 1
);

-- ── PostgreSQL ──────────────────────────────────────────────────────────
CREATE TABLE products_pg (
    product_id    SERIAL         NOT NULL,
    sku           VARCHAR(50)    NOT NULL,
    name          VARCHAR(200)   NOT NULL,  -- no NVARCHAR; all PG strings are Unicode
    price         NUMERIC(10,2)  NOT NULL CHECK (price > 0),
    stock_qty     INTEGER        NOT NULL DEFAULT 0,
    weight_kg     NUMERIC(8,3)   NULL,
    tax_rate      NUMERIC(5,4)   NOT NULL DEFAULT 0.2000,
    view_count    BIGINT         NOT NULL DEFAULT 0,
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,        -- true Boolean, not BIT
    CONSTRAINT pk_products PRIMARY KEY (product_id)
);

-- FLOAT precision trap — do NOT use for money:
SELECT 0.1 + 0.2;                   -- 0.3 (looks fine in simple cases)
SELECT CAST(0.1+0.2 AS FLOAT) = 0.3;-- 0 (FALSE!) — binary float cannot represent 0.3 exactly
SELECT CAST(0.1+0.2 AS DECIMAL(5,2)) = CAST(0.3 AS DECIMAL(5,2));  -- 1 (TRUE)`,
    },
    {
      label: 'String types (MSSQL vs PG)',
      language: 'sql',
      code: `-- ── MSSQL: VARCHAR vs NVARCHAR ─────────────────────────────────────────
CREATE TABLE contacts_mssql (
    contact_id  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    email       VARCHAR(254)  NOT NULL,   -- ASCII email — VARCHAR is fine
    full_name   NVARCHAR(200) NOT NULL,   -- Unicode names — MUST be NVARCHAR
    notes       NVARCHAR(MAX) NULL,       -- unlimited Unicode text (off-row if > 8KB)
    country_code CHAR(2)      NOT NULL    -- fixed 2-char code: CHAR avoids trailing space issues
);

-- Literal prefix matters in MSSQL:
INSERT INTO contacts_mssql (email, full_name, country_code)
VALUES ('jose@example.com', N'José García', 'ES');  -- N prefix for Unicode literal
-- Without N: INSERT ... VALUES ('jose@example.com', 'José García', 'ES')
-- The é may be corrupted if the database collation is Latin1_General_CI_AS

-- ── PostgreSQL: all strings are UTF-8 ────────────────────────────────────
CREATE TABLE contacts_pg (
    contact_id   SERIAL        NOT NULL,
    email        VARCHAR(254)  NOT NULL,   -- length-constrained varchar
    full_name    VARCHAR(200)  NOT NULL,   -- same as TEXT but with length limit
    notes        TEXT          NULL,       -- unlimited — TEXT preferred over VARCHAR(MAX)
    country_code CHAR(2)       NOT NULL,
    CONSTRAINT pk_contacts PRIMARY KEY (contact_id)
);

-- No N prefix needed in PostgreSQL — all string literals are UTF-8:
INSERT INTO contacts_pg (email, full_name, country_code)
VALUES ('jose@example.com', 'José García', 'ES');  -- works natively

-- ILIKE: PostgreSQL case-insensitive LIKE (no MSSQL equivalent — use collation)
SELECT * FROM contacts_pg WHERE full_name ILIKE '%garcia%';`,
    },
    {
      label: 'Date & time (MSSQL vs PG)',
      language: 'sql',
      code: `-- ── MSSQL date/time best practices ─────────────────────────────────────
CREATE TABLE events_mssql (
    event_id     BIGINT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    event_name   NVARCHAR(200)   NOT NULL,
    occurs_on    DATE            NOT NULL,            -- date only
    created_at   DATETIME2(0)    NOT NULL             -- UTC, second precision
                   DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(7)    NOT NULL             -- UTC, max precision
                   DEFAULT SYSUTCDATETIME(),
    duration_ms  INT             NULL
);

-- Current timestamps in MSSQL:
SELECT
    GETDATE()          AS local_datetime,    -- session/server timezone (avoid)
    GETUTCDATE()       AS utc_datetime,      -- UTC as DATETIME (legacy precision)
    SYSUTCDATETIME()   AS utc_datetime2,     -- UTC as DATETIME2(7) (preferred)
    SYSDATETIMEOFFSET() AS utc_with_offset;  -- DATETIMEOFFSET

-- Date arithmetic in MSSQL:
SELECT
    DATEADD(DAY,   7, '2025-01-01')  AS plus7days,
    DATEADD(MONTH, 3, '2025-01-01')  AS plus3months,
    DATEDIFF(DAY, '2024-01-01', '2025-01-01') AS days_diff;

-- ── PostgreSQL date/time best practices ──────────────────────────────────
CREATE TABLE events_pg (
    event_id    BIGSERIAL     NOT NULL,
    event_name  VARCHAR(200)  NOT NULL,
    occurs_on   DATE          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),   -- always TIMESTAMPTZ
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    duration_ms INTEGER       NULL,
    CONSTRAINT pk_events PRIMARY KEY (event_id)
);

-- Current timestamps in PostgreSQL:
SELECT
    NOW()                    AS timestamptz_now,     -- current TIMESTAMPTZ
    CURRENT_TIMESTAMP        AS same_as_now,
    CURRENT_DATE             AS date_only,
    LOCALTIMESTAMP           AS without_tz;          -- avoid — no timezone info

-- Date arithmetic in PostgreSQL:
SELECT
    '2025-01-01'::DATE + INTERVAL '7 days'        AS plus7days,
    '2025-01-01'::DATE + INTERVAL '3 months'       AS plus3months,
    '2025-01-01'::DATE - '2024-01-01'::DATE        AS days_diff,  -- returns INTEGER
    AGE('2025-01-01', '2024-01-01')                AS interval_diff;`,
    },
    {
      label: 'Boolean & UUID (MSSQL vs PG)',
      language: 'sql',
      code: `-- ── MSSQL BIT (not a true Boolean) ──────────────────────────────────────
CREATE TABLE users_mssql (
    user_id      INT              NOT NULL IDENTITY(1,1) PRIMARY KEY,
    email        NVARCHAR(254)    NOT NULL,
    is_active    BIT              NOT NULL DEFAULT 1,
    is_admin     BIT              NOT NULL DEFAULT 0,
    -- GUID PK for distributed systems (random — causes fragmentation):
    external_id  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    -- Sequential GUID — insert at the end of the index (no fragmentation):
    seq_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
);

-- BIT comparison — must use = 1 or = 0:
SELECT * FROM users_mssql WHERE is_active = 1;       -- correct
-- SELECT * FROM users_mssql WHERE is_active;        -- SYNTAX ERROR in MSSQL

-- ── PostgreSQL BOOLEAN (true Boolean) ────────────────────────────────────
CREATE TABLE users_pg (
    user_id     SERIAL       NOT NULL,
    email       VARCHAR(254) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    is_admin    BOOLEAN      NOT NULL DEFAULT FALSE,
    -- UUID (requires pgcrypto or pg 13+):
    external_id UUID         NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT pk_users PRIMARY KEY (user_id)
);

-- BOOLEAN used directly in WHERE — no = TRUE needed:
SELECT * FROM users_pg WHERE is_active;              -- correct
SELECT * FROM users_pg WHERE NOT is_admin;           -- correct
SELECT * FROM users_pg WHERE is_active = TRUE;       -- also valid but verbose

-- PostgreSQL ARRAY type (no MSSQL equivalent):
CREATE TABLE post_tags_pg (
    post_id  INT    NOT NULL,
    tag_ids  INT[]  NOT NULL  -- array of integers
);
INSERT INTO post_tags_pg VALUES (1, ARRAY[10, 20, 30]);
SELECT * FROM post_tags_pg WHERE 20 = ANY(tag_ids);  -- element membership`,
    },
    {
      label: 'CAST & type conversion',
      language: 'sql',
      code: `-- ── CAST — ANSI standard, works in both dialects ────────────────────────
SELECT CAST('2025-06-01' AS DATE)          AS date_val;
SELECT CAST(42.7 AS INT)                   AS truncated;   -- 42 (truncates, not rounds)
SELECT CAST('123.45' AS DECIMAL(10,2))     AS decimal_val;

-- ── CONVERT — MSSQL-only, with optional style parameter ──────────────────
SELECT CONVERT(VARCHAR(10), GETDATE(), 120);   -- 'YYYY-MM-DD' format
SELECT CONVERT(DATETIME2, '2025-06-01 14:30:00', 120);
-- 120 = ISO 8601 style. See MSSQL docs for full style list.

-- ── PostgreSQL :: cast operator (shorthand) ───────────────────────────────
SELECT '2025-06-01'::DATE;
SELECT '123.45'::NUMERIC(10,2);
SELECT NOW()::DATE;               -- truncate TIMESTAMPTZ to DATE

-- ── Implicit conversion pitfall (both dialects) ───────────────────────────
-- MSSQL: mixing VARCHAR and NVARCHAR in predicates causes implicit conversion
-- and can prevent index seeks on the NVARCHAR column:
-- WHERE nvarchar_col = 'literal'        -- implicit conversion: bad for indexes
-- WHERE nvarchar_col = N'literal'       -- no conversion: index seek

-- PostgreSQL: mixing INTEGER and TEXT in a JOIN can also block index use:
-- WHERE int_col = '42'    -- implicit cast from text; may prevent index seek
-- WHERE int_col = 42      -- correct: no cast

-- ── TRY_CAST / TRY_CONVERT (MSSQL) — safe conversion that returns NULL ───
SELECT TRY_CAST('not_a_number' AS INT);    -- NULL (no error)
SELECT TRY_CONVERT(INT, 'not_a_number');   -- NULL (no error)

-- PostgreSQL equivalent — wrap in a function or use CASE:
-- No built-in TRY_CAST; use a custom function or validate before casting.`,
    },
  ];

  challenge: Challenge = {
    title: 'Fix a Poorly Typed Table',
    language: 'sql',
    description: 'The following MSSQL table definition has several type choice mistakes. Identify each problem and write the corrected version in both MSSQL and PostgreSQL.',
    hints: [
      'FLOAT for price/tax — what type should financial values use?',
      'DATETIME is a legacy type — what replaces it?',
      'VARCHAR for a name field — what about international characters?',
      'INT for row_count — could this ever exceed 2.1 billion?',
    ],
    starterCode: `-- POORLY TYPED TABLE (MSSQL):
CREATE TABLE sales_report (
    report_id   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,          -- problem 1
    total_sales FLOAT        NOT NULL,          -- problem 2
    tax_amount  FLOAT        NOT NULL,          -- problem 2
    generated_at DATETIME    NOT NULL,          -- problem 3
    row_count   INT          NOT NULL           -- problem 4 (maybe)
);

-- List the problems, then write corrected versions for both MSSQL and PostgreSQL.`,
    solution: `-- PROBLEMS:
-- 1. VARCHAR(100) for report_name: international report names won't store correctly
--    Fix MSSQL: NVARCHAR(200).  PostgreSQL: VARCHAR(200) (already Unicode).
-- 2. FLOAT for financial columns: binary float cannot represent all decimals exactly.
--    Fix: DECIMAL(18,2) / NUMERIC(18,2).
-- 3. DATETIME legacy type: limited range, 3.33ms precision, no explicit UTC.
--    Fix MSSQL: DATETIME2(0) DEFAULT SYSUTCDATETIME().
-- 4. INT for row_count: reports on large tables may exceed 2.1B rows.
--    Fix: BIGINT.

-- CORRECTED — MSSQL:
CREATE TABLE sales_report_mssql (
    report_id    INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    report_name  NVARCHAR(200)  NOT NULL,
    total_sales  DECIMAL(18,2)  NOT NULL,
    tax_amount   DECIMAL(18,2)  NOT NULL,
    generated_at DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    row_count    BIGINT         NOT NULL
);

-- CORRECTED — PostgreSQL:
CREATE TABLE sales_report_pg (
    report_id    SERIAL         NOT NULL,
    report_name  VARCHAR(200)   NOT NULL,
    total_sales  NUMERIC(18,2)  NOT NULL,
    tax_amount   NUMERIC(18,2)  NOT NULL,
    generated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    row_count    BIGINT         NOT NULL,
    CONSTRAINT pk_sales_report PRIMARY KEY (report_id)
);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which data type should you use to store a product price of $1 299.99 in MSSQL?',
      options: ['FLOAT', 'REAL', 'DECIMAL(10,2)', 'MONEY'],
      answer: 2,
      explanation: 'FLOAT and REAL are approximate — they cannot represent all decimal fractions exactly, leading to rounding errors in financial calculations. MONEY is also approximate internally. Use DECIMAL(10,2) for exact monetary values.',
    },
    {
      q: 'In PostgreSQL, what is the difference between TEXT and VARCHAR(200)?',
      options: [
        'TEXT is stored off-row; VARCHAR is always stored in-row',
        'TEXT is unlimited length; VARCHAR(200) adds a length-check constraint — both are stored identically',
        'VARCHAR supports Unicode; TEXT does not',
        'TEXT is deprecated in PostgreSQL; always use VARCHAR',
      ],
      answer: 1,
      explanation: 'In PostgreSQL, TEXT and VARCHAR are stored identically (both UTF-8, variable-length). VARCHAR(n) simply adds a length constraint that rejects strings longer than n. There is no storage or performance difference between them.',
    },
    {
      q: 'What does the N prefix on a string literal in MSSQL do? (e.g. N\'José\')',
      options: [
        'Marks the literal as NOT NULL',
        'Normalises the string to uppercase',
        'Tells MSSQL to treat the literal as Unicode (NVARCHAR), preventing character corruption',
        'Has no effect — MSSQL treats all literals as Unicode automatically',
      ],
      answer: 2,
      explanation: 'Without the N prefix, a string literal in MSSQL is treated as the current database\'s default non-Unicode collation. Non-ASCII characters like accented letters may be silently corrupted when stored in an NVARCHAR column if the literal lacks the N prefix.',
    },
    {
      q: 'A table is expected to store up to 5 billion rows over its lifetime. What integer type should the primary key column use?',
      options: ['TINYINT', 'SMALLINT', 'INT', 'BIGINT'],
      answer: 3,
      explanation: 'INT overflows at approximately 2.1 billion. 5 billion exceeds this. BIGINT (8 bytes, max ±9.2×10¹⁸) is the correct choice.',
    },
    {
      q: 'You need to store a timestamp that records exactly when a user submitted a form, and the application serves users in multiple timezones. Which PostgreSQL type is correct?',
      options: ['TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME'],
      answer: 1,
      explanation: 'TIMESTAMPTZ (TIMESTAMP WITH TIME ZONE) stores the value as UTC and displays it in the session\'s timezone. Plain TIMESTAMP has no timezone awareness — if users are in different timezones, you cannot determine the absolute moment of submission from a plain TIMESTAMP.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use UUID or BIGINT as a primary key?',
      a: 'BIGINT is the safer default: 8 bytes (vs 16 for UUID), sequential inserts at the end of the B-tree index (no fragmentation), and faster JOINs. Use UUID when you need globally unique identifiers across distributed systems or when you cannot afford sequential IDs (e.g. public URLs where predictability is a security concern). If you use UUIDs in MSSQL, use NEWSEQUENTIALID() — not NEWID() — for the default to avoid severe index fragmentation. In PostgreSQL 17+, gen_random_uuid() produces UUIDv4; for sequential UUIDs use the uuid_generate_v7() extension function.',
    },
    {
      q: 'What is the right way to store currency/money values?',
      a: 'Use DECIMAL(19, 4) (or NUMERIC(19, 4) in PostgreSQL). The 19 gives you 15 digits before the decimal — more than enough for any real monetary value. 4 decimal places handles most currencies including 3-decimal-place currencies like KWD (Kuwaiti Dinar). Avoid FLOAT, REAL, and MSSQL MONEY/SMALLMONEY — they all use binary floating-point internally and can produce rounding errors in arithmetic. For multi-currency applications, always store the ISO 4217 currency code alongside the amount as a CHAR(3) column.',
    },
    {
      q: 'When should I use CHAR(n) vs VARCHAR(n)?',
      a: 'Use CHAR(n) for fixed-length strings where EVERY value will always be exactly n characters: ISO country codes (CHAR(2)), ISO currency codes (CHAR(3)), fixed-format codes. CHAR pads shorter values with spaces and rejects longer ones. For everything else use VARCHAR(n) — it stores only the actual length without padding. In PostgreSQL, CHAR(n) is stored identically to VARCHAR(n) except for the trailing space padding; VARCHAR is almost always preferable. In MSSQL, CHAR vs VARCHAR does matter for collation and implicit conversion behaviour.',
    },
  ];
}
