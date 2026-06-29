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
  selector: 'app-sql-computed-columns',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './computed-columns.html',
  styleUrls: ['./computed-columns.scss']
})
export class SqlComputedColumns {

  quickRef: QuickRefItem[] = [
    { name: 'AS (expr) (MSSQL)',            type: 'syntax',  desc: 'Virtual computed column — calculated on read' },
    { name: 'AS (expr) PERSISTED (MSSQL)',  type: 'syntax',  desc: 'Stored computed column — written to disk on INSERT/UPDATE' },
    { name: 'GENERATED ALWAYS AS (PG)',     type: 'syntax',  desc: 'PostgreSQL stored generated column (always persisted)' },
    { name: 'Deterministic',                type: 'keyword', desc: 'Same inputs → same output; required for indexing' },
    { name: 'ISNULL / COALESCE in expr',    type: 'function', desc: 'Handle NULLs inside computed column expressions' },
    { name: 'Indexed computed column',      type: 'syntax',  desc: 'Create an index on a deterministic PERSISTED column' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are computed columns?',
      points: [
        'A computed column derives its value from an expression over other columns in the same row — no application logic needed.',
        'In MSSQL they can be virtual (recalculated on each read) or PERSISTED (stored on disk and updated on write).',
        'In PostgreSQL (12+) generated columns are always stored (STORED keyword required; virtual not yet supported).',
      ]
    },
    {
      heading: 'Virtual vs persisted / stored',
      points: [
        'Virtual: no storage cost, expression re-evaluated on every read. Best for lightweight calculations queried infrequently.',
        'Persisted/Stored: written to disk on every INSERT/UPDATE, takes extra space, but can be indexed and is faster to read at high query volumes.',
        'You cannot PERSIST a column whose expression is non-deterministic (e.g. GETDATE(), RAND(), NEWID()).',
      ]
    },
    {
      heading: 'Determinism and indexing',
      points: [
        'A computed column is deterministic if the expression always returns the same value for the same input.',
        'Only deterministic PERSISTED (MSSQL) or STORED (PG) computed columns can have an index.',
        'Indexed computed columns let queries filter on derived values (e.g. YEAR(order_date)) without a full table scan.',
      ]
    },
    {
      heading: 'Common use cases',
      points: [
        'Full-name column: first_name + \' \' + last_name — avoid duplicating the logic in every query.',
        'Extracted date parts: YEAR(order_date), MONTH(order_date) — index them for fast range filters.',
        'Checksum / hash: CHECKSUM(col1, col2) for fast change detection.',
        'Unit conversion: price_usd * exchange_rate where exchange_rate is another column.',
      ]
    },
    {
      heading: 'Limitations',
      points: [
        'Cannot reference other computed columns in MSSQL (depends on the expression graph).',
        'MSSQL: computed columns cannot be used in DEFAULT constraints or as FK targets (unless persisted).',
        'PostgreSQL generated columns cannot reference other generated columns or use subqueries.',
        'Neither dialect supports non-deterministic generated columns (functions like NOW() are excluded from PG generated columns entirely).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL computed columns',
      language: 'sql',
      code: `CREATE TABLE order_items (
    item_id     INT IDENTITY PRIMARY KEY,
    order_id    INT NOT NULL,
    product     NVARCHAR(100) NOT NULL,
    qty         INT NOT NULL CHECK (qty > 0),
    unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),

    -- Virtual: recalculated on read, no storage
    line_total  AS (qty * unit_price),

    -- Persisted: stored on disk, indexable
    line_total_p AS (qty * unit_price) PERSISTED
);

-- Index the persisted column for fast filtering
CREATE INDEX ix_items_total ON order_items (line_total_p);

-- Query — line_total appears like a normal column
SELECT item_id, product, qty, unit_price, line_total
FROM   order_items
WHERE  line_total_p > 100;   -- uses the index`
    },
    {
      label: 'MSSQL date extraction',
      language: 'sql',
      code: `CREATE TABLE orders (
    order_id   INT IDENTITY PRIMARY KEY,
    customer_id INT NOT NULL,
    amount     DECIMAL(10,2) NOT NULL,
    order_date DATETIME NOT NULL DEFAULT GETDATE(),

    -- Extract year and month as persisted columns for fast grouping
    order_year  AS (YEAR(order_date)) PERSISTED,
    order_month AS (MONTH(order_date)) PERSISTED
);

-- Composite index on (year, month) for date-range queries
CREATE INDEX ix_orders_ym ON orders (order_year, order_month);

-- Fast monthly aggregation — index seek, no function on base column
SELECT order_year, order_month, SUM(amount)
FROM   orders
WHERE  order_year = 2024
GROUP  BY order_year, order_month
ORDER  BY order_month;`
    },
    {
      label: 'PostgreSQL GENERATED columns',
      language: 'sql',
      code: `-- PostgreSQL 12+: GENERATED ALWAYS AS ... STORED
CREATE TABLE order_items (
    item_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id   INT NOT NULL,
    product    TEXT NOT NULL,
    qty        INT NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),

    -- Stored generated column
    line_total NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- Index it like any regular column
CREATE INDEX ON order_items (line_total);

-- Cannot INSERT/UPDATE a generated column — the DB fills it
INSERT INTO order_items (order_id, product, qty, unit_price)
VALUES (1, 'Widget', 3, 9.99);  -- line_total = 29.97 automatically

SELECT product, qty, unit_price, line_total FROM order_items;`
    },
    {
      label: 'Full name & checksum patterns',
      language: 'sql',
      code: `-- MSSQL: full name concatenation
CREATE TABLE customers (
    customer_id INT IDENTITY PRIMARY KEY,
    first_name  NVARCHAR(100) NOT NULL,
    last_name   NVARCHAR(100) NOT NULL,
    full_name   AS (first_name + N' ' + last_name) PERSISTED,
    -- Row checksum for change detection
    row_hash    AS CHECKSUM(first_name, last_name) PERSISTED
);

CREATE INDEX ix_cust_fullname ON customers (full_name);
CREATE INDEX ix_cust_hash     ON customers (row_hash);

-- PostgreSQL equivalent
CREATE TABLE customers (
    customer_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    full_name   TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED
);

CREATE INDEX ON customers (full_name);`
    },
  ];

  challenge: Challenge = {
    title: 'Discount and VAT columns',
    language: 'sql',
    description: 'Create an order_lines table with qty, unit_price, discount_pct (0–100), and add two computed columns: (1) discounted_price = unit_price * (1 - discount_pct/100.0), (2) vat_amount = discounted_price * 0.2. Use MSSQL PERSISTED or PostgreSQL STORED. Add an index on discounted_price.',
    hints: [
      'Cast discount_pct to DECIMAL or NUMERIC before dividing to avoid integer division.',
      'In MSSQL, computed columns cannot reference other computed columns — expand the expression inline for vat_amount.',
      'In PostgreSQL generated columns also cannot chain — inline the expression for vat_amount.',
    ],
    starterCode: `CREATE TABLE order_lines (
    line_id      INT PRIMARY KEY,
    qty          INT NOT NULL CHECK (qty > 0),
    unit_price   DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_pct DECIMAL(5,2)  NOT NULL DEFAULT 0
                               CHECK (discount_pct BETWEEN 0 AND 100),
    -- discounted_price computed column here
    -- vat_amount computed column here
);
-- index on discounted_price`,
    solution: `-- MSSQL
CREATE TABLE order_lines (
    line_id          INT IDENTITY PRIMARY KEY,
    qty              INT           NOT NULL CHECK (qty > 0),
    unit_price       DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0
                                   CHECK (discount_pct BETWEEN 0 AND 100),
    discounted_price AS (unit_price * (1 - discount_pct / 100.0)) PERSISTED,
    vat_amount       AS (unit_price * (1 - discount_pct / 100.0) * 0.2) PERSISTED
);
CREATE INDEX ix_ol_disc_price ON order_lines (discounted_price);

-- PostgreSQL
CREATE TABLE order_lines (
    line_id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    qty              INT           NOT NULL CHECK (qty > 0),
    unit_price       NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_pct     NUMERIC(5,2)  NOT NULL DEFAULT 0
                                   CHECK (discount_pct BETWEEN 0 AND 100),
    discounted_price NUMERIC(12,2) GENERATED ALWAYS AS
                       (unit_price * (1 - discount_pct / 100.0)) STORED,
    vat_amount       NUMERIC(12,2) GENERATED ALWAYS AS
                       (unit_price * (1 - discount_pct / 100.0) * 0.2) STORED
);
CREATE INDEX ON order_lines (discounted_price);`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key requirement for indexing a computed column in MSSQL?',
      options: [
        'The column must be of type INT or BIGINT',
        'The column must be PERSISTED and the expression must be deterministic',
        'The table must have fewer than 1 million rows',
        'The column must reference only one base column'
      ],
      answer: 1,
      explanation: 'MSSQL requires the computed column to be PERSISTED and its expression to be deterministic (same inputs always produce the same output) before you can create an index on it.'
    },
    {
      q: 'In PostgreSQL, generated columns are always…',
      options: ['Virtual — recalculated on read', 'Stored — written to disk', 'Optional — choose with VIRTUAL or STORED keyword', 'Indexed automatically'],
      answer: 1,
      explanation: 'PostgreSQL only supports STORED generated columns (as of PG 16). The STORED keyword is required in the syntax; VIRTUAL is not implemented yet.'
    },
    {
      q: 'Can you manually INSERT a value into a GENERATED ALWAYS AS IDENTITY column in PostgreSQL?',
      options: [
        'Yes, freely',
        'No — the database always computes the value and rejects manual values',
        'Yes, but only with OVERRIDING SYSTEM VALUE',
        'Only during a bulk COPY operation'
      ],
      answer: 1,
      explanation: 'GENERATED ALWAYS columns (both identity and generated) reject explicit values. Use GENERATED BY DEFAULT AS IDENTITY if you need to supply values manually (with OVERRIDING SYSTEM VALUE).'
    },
    {
      q: 'Why can\'t a computed/generated column use NOW() or GETDATE()?',
      options: [
        'Date functions are not supported in column expressions',
        'These functions are non-deterministic — the same row would return different values at different times',
        'Temporal columns require a separate PERIOD definition',
        'They can be used but only in virtual (non-persisted) columns'
      ],
      answer: 1,
      explanation: 'NOW() / GETDATE() return the current time, which changes. A generated column must be deterministic so the stored value equals what the expression would return now. Non-deterministic functions are rejected.'
    },
    {
      q: 'In MSSQL, can you update a persisted computed column directly with an UPDATE statement?',
      options: [
        'Yes — writing the column recalculates and stores the new value',
        'No — the column is read-only; the database recalculates it whenever source columns change',
        'Yes, but only when the table is not indexed',
        'No — you must drop and recreate the column to change the expression'
      ],
      answer: 1,
      explanation: 'Computed/generated columns are always read-only. The value is derived from the expression and updated automatically when source columns change. Attempting a direct UPDATE raises an error.'
    },
    {
      q: 'What is the performance trade-off of PERSISTED computed columns vs querying the expression directly?',
      options: [
        'PERSISTED is always slower — it uses extra storage',
        'PERSISTED pays a small storage cost on INSERT/UPDATE but eliminates recalculation on every SELECT and enables indexing',
        'Non-persisted computed columns are cached per session',
        'PERSISTED columns are only faster if the expression is deterministic'
      ],
      answer: 1,
      explanation: 'A PERSISTED column stores the computed value once and reads it directly. A non-persisted column recalculates on every row access. For expensive expressions or when the column is used in filters or sorts, persisting and indexing it avoids repeated computation.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a computed column reference a column from another table?',
      a: 'No. Computed and generated columns can only reference other columns within the same row of the same table. For cross-table derived values use a view, a trigger, or an application-layer calculation.',
    },
    {
      q: 'Does PERSISTED mean the value is always consistent with the source columns?',
      a: 'Yes — the database recalculates and stores the value whenever source columns are updated. You never need to manually sync it. The only edge case is if the expression involves a user-defined function that is marked deterministic but secretly is not; the stored value can then drift.',
    },
    {
      q: 'Should I use a computed column or a view for a full-name field?',
      a: 'Use a computed column when you need the derived value indexed, stored compactly, or available without joining. Use a view when you want to derive the field without altering the base table schema — useful when you do not own the table or need to combine columns from multiple tables.',
    },
    {
      q: 'Can I use a JSON path expression inside a generated column in PostgreSQL?',
      a: 'Yes — you can use ->> operator or jsonb_extract_path_text() in a generated column expression. Example: ALTER TABLE events ADD COLUMN event_type TEXT GENERATED ALWAYS AS (payload->>\'type\') STORED; This indexes a specific JSON field without a separate column update.',
    },
    {
      q: 'What is the difference between a computed column and a DEFAULT constraint?',
      a: 'A DEFAULT provides a one-time initial value on INSERT when no value is supplied — after that, the column behaves like any regular column and can be updated independently. A computed/generated column derives its value from an expression every time source columns change and cannot be manually set.',
    },
    {
      q: 'When would you use a trigger instead of a computed column for a derived value?',
      a: 'Use a trigger when: (1) the derived value depends on values from another table (computed columns cannot cross tables); (2) you need complex procedural logic that exceeds a single expression; (3) you want to log the old vs new derived value for audit purposes. For simple single-row arithmetic or string operations, a computed/generated column is cleaner and faster.',
    },
  ];
}
