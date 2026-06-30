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
  selector: 'app-sql-bulk-operations',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './bulk-operations.html',
  styleUrls: ['./bulk-operations.scss']
})
export class SqlBulkOperations {

  quickRef: QuickRefItem[] = [
    { name: 'BULK INSERT (MSSQL)',       type: 'keyword',  desc: 'Load a flat file into a table at high speed' },
    { name: 'bcp (MSSQL)',               type: 'keyword',  desc: 'Command-line bulk copy: export or import data' },
    { name: 'COPY (PostgreSQL)',          type: 'keyword',  desc: 'Server-side bulk load from/to file or stdin' },
    { name: '\\copy (psql)',             type: 'keyword',  desc: 'Client-side copy; works without superuser privilege' },
    { name: 'TABLOCK / TABLOCKX',        type: 'keyword',  desc: 'MSSQL: hint to enable minimal logging during bulk load' },
    { name: 'INSERT … SELECT batch',     type: 'syntax',   desc: 'Batched INSERT in chunks to limit lock duration' },
    { name: 'Staging table pattern',     type: 'syntax',   desc: 'Load into temp/staging table, validate, then MERGE into target' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why bulk loading matters',
      points: [
        'Row-by-row INSERT is the slowest way to load data — each statement is a separate transaction with logging overhead.',
        'Bulk operations amortise transaction overhead across many rows, reduce logging, and can bypass some constraint checks temporarily.',
        'Typical use cases: ETL pipelines, data migrations, nightly file imports, initial data seeding.',
      ]
    },
    {
      heading: 'MSSQL bulk tools',
      points: [
        'BULK INSERT: T-SQL command that reads a file from the server\'s file system. Fast, simple, but requires file access on the server.',
        'bcp (Bulk Copy Program): command-line tool for import and export. Works with any ODBC-compatible client and supports format files.',
        'INSERT … SELECT with TABLOCK hint enables minimal logging when the database recovery model is SIMPLE or BULK_LOGGED.',
        'SqlBulkCopy (.NET): programmatic API that streams batches to the server — ideal for application-layer ETL.',
      ]
    },
    {
      heading: 'PostgreSQL COPY',
      points: [
        'COPY table FROM \'/path/file.csv\' (FORMAT CSV, HEADER) — server-side, requires superuser or pg_read_server_files.',
        '\\copy in psql: client-side — reads the file on the client machine, works for non-superusers.',
        'COPY … FROM STDIN can pipe data from an application directly without a temp file.',
        'COPY TO exports data; COPY FROM imports. Both are significantly faster than INSERT for large datasets.',
      ]
    },
    {
      heading: 'Staging table pattern',
      points: [
        'Load raw data into a staging/temp table first — no constraints, no indexes (except what you need for dedup).',
        'Validate, cleanse, and deduplicate in staging.',
        'MERGE (MSSQL) or INSERT … ON CONFLICT (PostgreSQL) to upsert from staging into the target table.',
        'Drop or truncate staging after successful load.',
      ]
    },
    {
      heading: 'Batching and performance',
      points: [
        'For very large deletes or updates, process in batches of 10 000–100 000 rows to limit log growth and lock duration.',
        'Disable non-clustered indexes before a large load and rebuild them after — faster than maintaining indexes during the load.',
        'MSSQL: ALTER TABLE … DISABLE TRIGGER / NOCHECK CONSTRAINT before bulk load; re-enable and validate after.',
        'PostgreSQL: SET session_replication_role = replica (disables FK triggers); reset to default after load.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL BULK INSERT',
      language: 'sql',
      code: `-- Load a CSV file (server file system path)
BULK INSERT dbo.orders_staging
FROM 'C:\\data\\orders_2024.csv'
WITH (
    FORMAT         = 'CSV',
    FIRSTROW       = 2,          -- skip header
    FIELDTERMINATOR = ',',
    ROWTERMINATOR  = '\\n',
    BATCHSIZE      = 10000,      -- commit every 10K rows
    TABLOCK                      -- table lock for minimal logging
);

-- Check errors
SELECT * FROM dbo.orders_staging WHERE is_valid = 0;

-- Validate then merge into target
INSERT INTO dbo.orders (order_id, customer_id, amount, order_date)
SELECT order_id, customer_id, amount, order_date
FROM   dbo.orders_staging
WHERE  order_id IS NOT NULL
  AND  amount > 0;

TRUNCATE TABLE dbo.orders_staging;`
    },
    {
      label: 'MSSQL batched DELETE/UPDATE',
      language: 'sql',
      code: `-- Delete in batches to limit log growth and locking
DECLARE @batch INT = 10000;
DECLARE @deleted INT = 1;

WHILE @deleted > 0
BEGIN
    DELETE TOP (@batch) FROM orders
    WHERE order_date < '2020-01-01'
      AND status = 'Cancelled';

    SET @deleted = @@ROWCOUNT;
    -- Optional: WAITFOR DELAY '00:00:01'; -- throttle if needed
END;

-- Batched UPDATE
DECLARE @updated INT = 1;
WHILE @updated > 0
BEGIN
    UPDATE TOP (10000) orders
    SET    status = 'Archived'
    WHERE  order_date < '2020-01-01'
      AND  status = 'Cancelled'
      AND  status <> 'Archived';

    SET @updated = @@ROWCOUNT;
END;`
    },
    {
      label: 'PostgreSQL COPY',
      language: 'sql',
      code: `-- Server-side COPY (requires pg_read_server_files role or superuser)
COPY orders_staging (order_id, customer_id, amount, order_date)
FROM '/var/data/orders_2024.csv'
(FORMAT CSV, HEADER TRUE, NULL '\\N');

-- psql client-side (works without superuser)
-- \\copy orders_staging FROM '~/orders_2024.csv' CSV HEADER

-- COPY with STDIN (from application)
-- COPY orders_staging FROM STDIN WITH (FORMAT BINARY);

-- Export to CSV
COPY (
    SELECT order_id, customer_id, amount
    FROM   orders
    WHERE  order_date >= '2024-01-01'
) TO '/var/exports/orders_q1.csv'
(FORMAT CSV, HEADER TRUE);

-- Validate & upsert from staging
INSERT INTO orders (order_id, customer_id, amount, order_date)
SELECT order_id, customer_id, amount, order_date
FROM   orders_staging
WHERE  order_id IS NOT NULL
ON CONFLICT (order_id) DO UPDATE
SET amount = EXCLUDED.amount,
    order_date = EXCLUDED.order_date;

TRUNCATE orders_staging;`
    },
    {
      label: 'Disable indexes for bulk load',
      language: 'sql',
      code: `-- MSSQL: disable non-clustered indexes before bulk load
ALTER INDEX ix_orders_customer   ON orders DISABLE;
ALTER INDEX ix_orders_date       ON orders DISABLE;
ALTER INDEX ix_orders_status_cov ON orders DISABLE;

-- Bulk load (much faster without index maintenance)
BULK INSERT orders FROM 'C:\\data\\orders.csv'
WITH (FORMAT='CSV', FIRSTROW=2, TABLOCK);

-- Rebuild indexes after load
ALTER INDEX ix_orders_customer   ON orders REBUILD;
ALTER INDEX ix_orders_date       ON orders REBUILD;
ALTER INDEX ix_orders_status_cov ON orders REBUILD;

-- Update statistics after large load
UPDATE STATISTICS orders;

-- PostgreSQL equivalent: drop and recreate indexes
DROP INDEX ix_orders_customer;
-- ... COPY ...
CREATE INDEX ix_orders_customer ON orders (customer_id);
ANALYZE orders;  -- update statistics after load`
    },
  ];

  challenge: Challenge = {
    title: 'Staged CSV import with validation',
    language: 'sql',
    description: 'Design a bulk load pipeline for a products.csv file (product_id, name, price, category_id). (1) Create a products_staging table with all columns as TEXT (no constraints). (2) Write the BULK INSERT / COPY command. (3) Write a SELECT to find invalid rows (price not numeric, category_id not in categories, duplicate product_id). (4) INSERT valid rows into the target products table.',
    hints: [
      'Staging table uses TEXT columns so the COPY/BULK INSERT never fails on bad data — validation happens in SQL.',
      'Use TRY_CAST (MSSQL) or a regexp check (PostgreSQL) to detect non-numeric price values.',
      'Use NOT EXISTS or LEFT JOIN to find category_ids that have no match in the categories table.',
    ],
    starterCode: `-- Step 1: staging table
CREATE TABLE products_staging (
    product_id  TEXT,
    name        TEXT,
    price       TEXT,
    category_id TEXT
);

-- Step 2: bulk load
-- MSSQL: BULK INSERT products_staging FROM '...' WITH (FORMAT='CSV', FIRSTROW=2);
-- PG:    COPY products_staging FROM '...' (FORMAT CSV, HEADER);

-- Step 3: find invalid rows

-- Step 4: insert valid rows into products`,
    solution: `-- Step 1: staging (already created above)

-- Step 2: MSSQL bulk load
BULK INSERT products_staging
FROM 'C:\\data\\products.csv'
WITH (FORMAT = 'CSV', FIRSTROW = 2, TABLOCK);

-- Step 3: invalid rows
SELECT *
FROM products_staging
WHERE TRY_CAST(price AS DECIMAL(10,2)) IS NULL        -- bad price
   OR TRY_CAST(category_id AS INT) IS NULL             -- non-integer category
   OR NOT EXISTS (
        SELECT 1 FROM categories
        WHERE id = TRY_CAST(category_id AS INT)
      )                                                -- missing category
   OR product_id IN (
        SELECT product_id FROM products_staging
        GROUP BY product_id HAVING COUNT(*) > 1
      );                                               -- duplicate in file

-- Step 4: insert valid rows
INSERT INTO products (product_id, name, price, category_id)
SELECT
    TRY_CAST(product_id  AS INT),
    name,
    TRY_CAST(price       AS DECIMAL(10,2)),
    TRY_CAST(category_id AS INT)
FROM products_staging
WHERE TRY_CAST(price AS DECIMAL(10,2)) IS NOT NULL
  AND TRY_CAST(category_id AS INT) IS NOT NULL
  AND EXISTS (SELECT 1 FROM categories WHERE id = TRY_CAST(category_id AS INT));

TRUNCATE TABLE products_staging;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does TABLOCK hint do for a BULK INSERT in MSSQL?',
      options: [
        'Prevents other sessions from reading the table during the load',
        'Enables minimal logging when the database is in SIMPLE or BULK_LOGGED recovery model',
        'Forces the load to commit every row individually',
        'Disables all constraints for the duration of the load'
      ],
      answer: 1,
      explanation: 'TABLOCK acquires a table-level lock and enables minimal logging (only extent allocations logged) when the recovery model is SIMPLE or BULK_LOGGED. This dramatically reduces log growth for large loads.'
    },
    {
      q: 'What is the difference between COPY and \\copy in PostgreSQL?',
      options: [
        'COPY uses CSV format; \\copy uses binary format',
        'COPY runs server-side (reads file on the server); \\copy runs client-side (reads file on the client machine)',
        'COPY requires a transaction; \\copy is auto-committed',
        'They are identical — \\copy is just an alias'
      ],
      answer: 1,
      explanation: 'COPY is a server-side command requiring the file to exist on the database server and needing pg_read_server_files (or superuser). \\copy is a psql meta-command that reads the file on the client machine and streams it to the server — available to normal users.'
    },
    {
      q: 'Why should you disable non-clustered indexes before a large bulk load?',
      options: [
        'To prevent duplicate key errors during the load',
        'Because the load will fail if indexes exist',
        'Maintaining indexes during INSERT adds per-row overhead — disabling and rebuilding them after is faster for large volumes',
        'Indexes are automatically disabled by BULK INSERT'
      ],
      answer: 2,
      explanation: 'Each row insert must update every non-clustered index. For large loads, the cumulative overhead of per-row index maintenance exceeds the cost of a single post-load index rebuild. Disable non-clustered (not clustered) indexes, load, then rebuild.'
    },
    {
      q: 'Why use a staging table for bulk loads instead of loading directly into the target?',
      options: [
        'The target table cannot receive bulk inserts directly',
        'Staging lets you load without constraints, validate/cleanse the data in SQL, then MERGE clean rows — protecting the target from bad data',
        'Direct loads bypass transaction logging and may corrupt the target',
        'Staging tables are automatically compressed by the database engine'
      ],
      answer: 1,
      explanation: 'A staging table with no constraints accepts all rows regardless of data quality. You can then inspect, filter, and transform bad rows in SQL before inserting only valid data into the target. This also decouples load speed from validation complexity.'
    },
    {
      q: 'What batch size should you use for SqlBulkCopy to maximise throughput?',
      options: [
        '1 row per batch to minimise transaction log growth',
        '100 000–500 000 rows is usually optimal — large enough to amortise round-trip overhead, small enough to avoid excessive log growth and memory pressure',
        'Always the entire dataset in one batch',
        'Exactly 1 000 rows — the documented .NET default'
      ],
      answer: 1,
      explanation: 'Very small batches waste round-trip overhead; very large batches hold long-running transactions and consume memory. Testing on your data usually shows 100k–500k rows per batch as the sweet spot, but the optimal size depends on row width and hardware.'
    },
    {
      q: 'What does the ERRORFILE option of MSSQL BULK INSERT do?',
      options: [
        'Aborts the entire load on any error',
        'Writes rows that fail parsing or type conversion to a separate file for inspection, while allowing the rest of the load to continue',
        'Redirects error messages to the Windows Event Log',
        'Retries failed rows automatically up to 3 times'
      ],
      answer: 1,
      explanation: 'ERRORFILE = \'path\' (combined with MAXERRORS N) allows the load to continue past bad rows and writes rejected rows to a separate file. This is essential for loading dirty data where you want to capture errors without halting the entire job.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I bulk load from an application without writing a file to disk?',
      a: 'MSSQL: use SqlBulkCopy in .NET — it streams a DataTable or IDataReader directly to the server in efficient batches with no temp file. PostgreSQL: use COPY … FROM STDIN with the Npgsql BinaryImporter or the libpq PQputCopyData API. Both achieve near-COPY speeds without touching the file system.',
    },
    {
      q: 'What recovery model should I use for a large bulk load in MSSQL?',
      a: 'Switch to BULK_LOGGED for the load duration: ALTER DATABASE MyDB SET RECOVERY BULK_LOGGED; — run the load; then ALTER DATABASE MyDB SET RECOVERY FULL; and take a log backup immediately. BULK_LOGGED minimises log writes for bulk operations while keeping the database recoverable. Do not leave it in BULK_LOGGED permanently.',
    },
    {
      q: 'How do I handle duplicate rows during a bulk load upsert?',
      a: 'PostgreSQL: INSERT … ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col — atomic upsert. MSSQL: use MERGE with WHEN MATCHED THEN UPDATE / WHEN NOT MATCHED THEN INSERT. For very large staging tables, add an index on the key column in staging before the MERGE to speed up the join.',
    },
    {
      q: 'How do I load data from a cloud storage bucket (S3, Azure Blob) directly into the database?',
      a: 'PostgreSQL on AWS RDS/Aurora: use COPY … FROM \'s3://…\' WITH (format csv, …) via the aws_s3 extension. Azure SQL: use BULK INSERT with FROM \'https://…\' and a SHARED ACCESS SIGNATURE credential or IDENTITY = \'Managed Identity\'. Google Cloud SQL: use the import from Cloud Storage feature via the console or gcloud CLI. All avoid the need to download the file to an intermediary host.',
    },
    {
      q: 'What happens if a BULK INSERT or COPY fails midway through — is data rolled back?',
      a: 'MSSQL: if ROWS_PER_BATCH is set, committed batches remain — only the current batch rolls back. Without batching, the entire load is one transaction and rolls back on failure. PostgreSQL COPY is a single statement inside the current transaction — it rolls back completely if not in auto-commit mode. Always test error recovery in a staging environment before running a large production load.',
    },
    {
      q: 'How can I validate data quality before committing a bulk load?',
      a: 'Load into a staging table without constraints, then run validation queries: SELECT * FROM staging WHERE amount < 0; SELECT * FROM staging WHERE customer_id NOT IN (SELECT id FROM customers); Count violations. If counts are within tolerance, proceed with INSERT … SELECT or MERGE into the target. If not, investigate and clean before loading.',
    },
  ];
}
