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
    { name: 'DATETIMEOFFSET',      type: 'type', desc: 'MSSQL: datetime2 + UTC offset. Use when originating timezone must be preserved.' },
    { name: 'TIMESTAMPTZ',        type: 'type', desc: 'PostgreSQL: timestamp with time zone — stored as UTC, displayed in session timezone. Always use this over plain TIMESTAMP.' },
    { name: 'BIT',                 type: 'type', desc: 'MSSQL: 1/0/NULL — not a true Boolean. PG equivalent: BOOLEAN (TRUE/FALSE/NULL).' },
    { name: 'UNIQUEIDENTIFIER',    type: 'type', desc: 'MSSQL: 128-bit GUID (16 bytes). Use NEWSEQUENTIALID() for PKs to reduce index fragmentation. PG: UUID type.' },
    { name: 'JSONB (PG)',          type: 'type', desc: 'PostgreSQL binary JSON — parsed on insert, supports GIN indexes, operators @>, ?, ->. Preferred over JSON type.' },
    { name: 'JSON (MSSQL)',        type: 'type', desc: 'MSSQL stores JSON as NVARCHAR; functions JSON_VALUE/JSON_QUERY/OPENJSON parse it at query time. No dedicated JSON type.' },
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
        'MSSQL DATETIME2(n): date + time, fractional seconds 0–7 (7 = 100ns precision). Replaces the legacy DATETIME type. Use SYSUTCDATETIME() for the current UTC time as DATETIME2(7). DATETIMEOFFSET adds a UTC offset component for storing the originating timezone alongside the UTC moment.',
        'PostgreSQL TIMESTAMPTZ (= TIMESTAMP WITH TIME ZONE): stores the value as UTC internally; displays it in the session\'s timezone. Always use TIMESTAMPTZ. NOW() / CURRENT_TIMESTAMP returns TIMESTAMPTZ. Plain TIMESTAMP has no timezone awareness — avoid it.',
        'Universal rule: store all timestamps in UTC. Convert to local time in the application layer. Mixing local and UTC timestamps in storage is a major source of subtle bugs across DST transitions.',
        'Date arithmetic: MSSQL uses DATEADD / DATEDIFF functions. PostgreSQL uses interval arithmetic directly: <code>\'2025-01-01\'::DATE + INTERVAL \'7 days\'</code>. Both support EXTRACT / DATEPART for extracting year, month, day, hour, etc.',
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
    {
      heading: 'JSON and semi-structured data — JSONB vs typed columns',
      points: [
        '<strong>PostgreSQL JSONB</strong>: binary JSON stored in a parsed, decomposed format. Faster to query than plain JSON (no re-parsing), supports GIN indexes on all keys or specific paths, and supports containment (<code>@&gt;</code>), key-existence (<code>?</code>), and path operators (<code>-&gt;</code>, <code>-&gt;&gt;</code>, <code>#&gt;</code>). Preferred over the plain JSON type (which is stored as text and must be re-parsed on every read).',
        '<strong>MSSQL JSON</strong>: MSSQL has no dedicated JSON column type — JSON is stored as NVARCHAR. Functions <code>JSON_VALUE(col, \'$.path\')</code> (returns a scalar), <code>JSON_QUERY(col, \'$.path\')</code> (returns an object/array), and <code>OPENJSON(col)</code> (shreds to rows) parse it at query time. SQL Server 2022+ adds JSON_PATH_EXISTS and JSON_OBJECT/JSON_ARRAY constructors.',
        'When to use JSON vs typed columns: use <strong>typed columns</strong> for attributes you filter, sort, join, or aggregate on — they are indexable, type-safe, and queryable with standard SQL. Use <strong>JSON/JSONB</strong> for flexible, schema-less attributes that vary per row (product custom attributes, user preferences, event payloads) where the exact set of keys is not fixed in advance.',
        '<strong>JSONB indexing in PostgreSQL</strong>: a GIN index on the whole column (<code>CREATE INDEX ON products USING GIN(custom_attrs)</code>) accelerates containment and key-existence queries. An expression index on a specific path (<code>CREATE INDEX ON products((custom_attrs-&gt;&gt;\'color\'))</code>) accelerates equality filters on that key — useful for frequently-queried known attributes even if stored in JSONB.',
        '<strong>Hybrid schema pattern</strong>: combine both — typed columns for the fixed, shared attributes (price, sku, created_at) and a single JSONB / NVARCHAR(JSON) column for category-specific extras. This gives you the filtering and indexing of typed columns where it matters and the flexibility of JSON where attribute sets vary. Never use the EAV (entity-attribute-value) pattern — JSON is a far better alternative when structured columns are insufficient.',
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
    event_id       BIGINT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    event_name     NVARCHAR(200)   NOT NULL,
    occurs_on      DATE            NOT NULL,           -- date only
    created_at     DATETIME2(0)    NOT NULL             -- UTC, second precision
                     DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2(7)    NOT NULL DEFAULT SYSUTCDATETIME(),
    user_local_at  DATETIMEOFFSET  NULL                -- preserves originating timezone
);

-- Current timestamps in MSSQL:
SELECT
    GETDATE()           AS local_datetime,   -- session/server timezone (avoid)
    SYSUTCDATETIME()    AS utc_datetime2,    -- UTC as DATETIME2(7) (preferred)
    SYSDATETIMEOFFSET() AS utc_with_offset;  -- DATETIMEOFFSET

-- Date arithmetic in MSSQL:
SELECT
    DATEADD(DAY,   7, '2025-01-01')          AS plus7days,
    DATEADD(MONTH, 3, '2025-01-01')          AS plus3months,
    DATEDIFF(DAY, '2024-01-01', '2025-01-01') AS days_diff,
    YEAR('2025-06-15')                        AS year_part,
    DATEPART(WEEKDAY, '2025-06-15')           AS weekday;

-- ── PostgreSQL date/time best practices ──────────────────────────────────
CREATE TABLE events_pg (
    event_id    BIGSERIAL     NOT NULL,
    event_name  VARCHAR(200)  NOT NULL,
    occurs_on   DATE          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),   -- always TIMESTAMPTZ
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_events PRIMARY KEY (event_id)
);

-- Current timestamps in PostgreSQL:
SELECT
    NOW()             AS timestamptz_now,   -- current TIMESTAMPTZ
    CURRENT_DATE      AS date_only,
    LOCALTIMESTAMP    AS without_tz;        -- avoid — no timezone info

-- Date arithmetic in PostgreSQL (interval-based, no functions needed):
SELECT
    '2025-01-01'::DATE + INTERVAL '7 days'   AS plus7days,
    '2025-01-01'::DATE + INTERVAL '3 months' AS plus3months,
    '2025-01-01'::DATE - '2024-01-01'::DATE  AS days_diff,  -- returns INTEGER
    EXTRACT(YEAR FROM NOW())::INT            AS year_part,
    AGE('2025-06-15', '2024-01-01')          AS interval_diff;`,
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
    external_id UUID         NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT pk_users PRIMARY KEY (user_id)
);

-- BOOLEAN used directly in WHERE — no = TRUE needed:
SELECT * FROM users_pg WHERE is_active;              -- correct
SELECT * FROM users_pg WHERE NOT is_admin;           -- correct

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
    {
      label: 'JSONB (PG) and JSON (MSSQL)',
      language: 'sql',
      code: `-- ── PostgreSQL JSONB — binary JSON with GIN indexing ─────────────────────
CREATE TABLE products (
    product_id   SERIAL        NOT NULL,
    sku          VARCHAR(50)   NOT NULL,
    price        NUMERIC(10,2) NOT NULL,    -- typed: always filterable
    custom_attrs JSONB         NULL,         -- flexible per-category extras
    CONSTRAINT pk_products PRIMARY KEY (product_id),
    CONSTRAINT uq_products_sku UNIQUE (sku)
);

-- GIN index on the whole JSONB column (containment + key existence queries):
CREATE INDEX ix_products_attrs ON products USING GIN(custom_attrs);

-- Expression index on a specific path (equality filter on known key):
CREATE INDEX ix_products_color ON products((custom_attrs->>'color'));

-- Insert: JSONB stored in binary — keys are sorted, duplicates removed
INSERT INTO products (sku, price, custom_attrs)
VALUES ('SHIRT-RED-M', 29.99, '{"color":"red","size":"M","material":"cotton"}');

-- Query JSONB operators:
SELECT sku, price,
       custom_attrs->>'color'    AS color,    -- ->> returns TEXT
       custom_attrs->'material'  AS material  -- -> returns JSONB
FROM products
WHERE custom_attrs->>'color' = 'red'          -- uses expression index
  AND custom_attrs @> '{"size":"M"}';         -- @> = containment (uses GIN)

-- Key existence check:
SELECT * FROM products WHERE custom_attrs ? 'discount_pct';  -- has this key?

-- Update a single JSONB key (non-destructive):
UPDATE products
SET custom_attrs = jsonb_set(custom_attrs, '{color}', '"blue"')
WHERE sku = 'SHIRT-RED-M';

-- ── MSSQL JSON (stored as NVARCHAR) ──────────────────────────────────────
CREATE TABLE products_mssql (
    product_id   INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    sku          VARCHAR(50)    NOT NULL,
    price        DECIMAL(10,2)  NOT NULL,
    custom_attrs NVARCHAR(MAX)  NULL
        CHECK (ISJSON(custom_attrs) = 1)    -- validate JSON on insert
);

-- Query with JSON_VALUE (scalar) and JSON_QUERY (object/array):
SELECT
    sku,
    JSON_VALUE(custom_attrs, '$.color')     AS color,
    JSON_VALUE(custom_attrs, '$.size')      AS size,
    JSON_QUERY(custom_attrs, '$.dimensions') AS dimensions_json
FROM products_mssql
WHERE JSON_VALUE(custom_attrs, '$.color') = 'red';

-- OPENJSON: shred JSON array to rows
SELECT p.sku, j.value AS tag
FROM products_mssql p
CROSS APPLY OPENJSON(p.custom_attrs, '$.tags') j;

-- Computed column + index on a JSON path (MSSQL):
ALTER TABLE products_mssql
ADD color AS JSON_VALUE(custom_attrs, '$.color') PERSISTED;
CREATE INDEX ix_products_color ON products_mssql(color);`,
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
    {
      q: 'In MSSQL, why is NEWSEQUENTIALID() preferred over NEWID() for a UNIQUEIDENTIFIER primary key?',
      options: [
        'NEWSEQUENTIALID() is shorter and uses less storage',
        'NEWID() generates duplicate values; NEWSEQUENTIALID() is unique',
        'NEWID() generates random UUIDs that cause page splits on every insert; NEWSEQUENTIALID() generates increasing UUIDs that insert at the end of the B-tree, like an IDENTITY column',
        'NEWSEQUENTIALID() is compatible with PostgreSQL UUID; NEWID() is not',
      ],
      answer: 2,
      explanation: 'A B-tree clustered index keeps rows in sorted order. NEWID() generates random UUIDs, so each insert lands at a random position in the index — causing page splits and severe fragmentation on busy tables. NEWSEQUENTIALID() generates values that are always greater than any previous value, so inserts append to the end of the index, matching the efficient behaviour of IDENTITY columns.',
    },
    {
      q: 'What is the key difference between PostgreSQL\'s JSONB type and its plain JSON type?',
      options: [
        'JSONB supports more JSON operators; JSON does not support any operators',
        'JSONB is stored as parsed binary (faster to query, supports GIN indexes); JSON is stored as raw text (preserves whitespace and key order, must re-parse on every read)',
        'JSON can be larger than JSONB',
        'JSONB requires a schema definition; JSON is schema-less',
      ],
      answer: 1,
      explanation: 'PostgreSQL\'s plain JSON stores the raw text and re-parses it on every access — preserving whitespace, duplicate keys, and key order. JSONB decomposes and stores JSON in binary format on insert, strips whitespace, removes duplicates, and can be queried with GIN indexes. For almost all use cases, JSONB is the right choice.',
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
    {
      q: 'What is the MSSQL DATETIMEOFFSET type and when do I need it?',
      a: 'DATETIMEOFFSET stores a datetime2 value together with its UTC offset (e.g. 2025-06-15 14:30:00 +05:30). Use it when the originating timezone must be preserved alongside the absolute moment — for example, a meeting time scheduled by a user in a specific timezone that must display back in that same timezone regardless of where the server is. For general-purpose timestamps (audit columns, created_at, updated_at), use DATETIME2(7) stored in UTC — the timezone conversion to local time should happen in the application layer. Never mix DATETIMEOFFSET and DATETIME2 columns in the same query without explicit conversion.',
    },
    {
      q: 'When should I use JSONB instead of typed columns in PostgreSQL?',
      a: 'Use JSONB when: (1) the set of attributes varies significantly per row and cannot be defined in advance (e.g. product custom attributes differ by category — a phone has RAM and storage, a shirt has color and size); (2) the attributes are written but rarely filtered or sorted — so index performance is less critical; (3) you are storing event payloads, configuration objects, or API responses where the schema evolves frequently. Use typed columns when: (1) you filter, sort, or aggregate on the attribute; (2) you need referential integrity (FK constraints); (3) you need type-safe CHECK constraints. Hybrid: typed columns for shared filterable fields + a single JSONB column for flexible per-category extras. Never use EAV tables — JSONB is a far better alternative for flexible schemas.',
    },
    {
      q: 'What are TRY_CAST and TRY_CONVERT in MSSQL and when should I use them?',
      a: 'TRY_CAST(expression AS type) and TRY_CONVERT(type, expression) are MSSQL-specific safe conversion functions that return NULL instead of raising an error when the conversion fails. Regular CAST and CONVERT throw a runtime error if the value cannot be converted (e.g. CAST(\'abc\' AS INT) = error). Use TRY_CAST/TRY_CONVERT when processing user input, imported data, or any string column that might contain non-numeric values: <code>SELECT TRY_CAST(user_input AS DECIMAL(10,2))</code> — then check for NULL to detect invalid values. PostgreSQL has no built-in TRY_CAST; the workaround is a custom function using an EXCEPTION block or a REGEXP check before casting.',
    },
    {
      q: 'Should I store IP addresses as VARCHAR or use a dedicated type?',
      a: 'PostgreSQL provides <code>INET</code> (a single IP address or network address, IPv4 or IPv6) and <code>CIDR</code> (a network block like 192.168.1.0/24). These types validate format on insert, support network-aware operators (<code>&lt;&lt;</code> = is contained by network, <code>&gt;&gt;</code> = contains), and can be indexed. Use them instead of VARCHAR for IP data in PostgreSQL. MSSQL has no INET type — store as VARCHAR(45) (covers IPv6) and validate at the application layer, or store as BIGINT (IPv4 only, for range queries using BETWEEN). For both dialects, avoid storing IP addresses in BINARY — it complicates display and makes queries harder.',
    },
  ];
}
