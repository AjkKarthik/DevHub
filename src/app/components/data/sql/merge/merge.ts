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
  selector: 'app-sql-merge',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './merge.html',
  styleUrl: './merge.scss',
})
export class SqlMerge {

  quickRef: QuickRefItem[] = [
    { name: 'MERGE … USING',            type: 'syntax',  desc: 'MSSQL: compares source to target. WHEN MATCHED / WHEN NOT MATCHED actions follow.' },
    { name: 'WHEN MATCHED THEN UPDATE', type: 'syntax',  desc: 'Action when a row exists in both source and target.' },
    { name: 'WHEN NOT MATCHED THEN INSERT', type: 'syntax', desc: 'Action when source row has no match in target.' },
    { name: 'WHEN NOT MATCHED BY SOURCE', type: 'syntax', desc: 'MSSQL only: action when target row has no match in source (e.g., DELETE stale rows).' },
    { name: 'INSERT … ON CONFLICT',     type: 'syntax',  desc: 'PostgreSQL upsert: ON CONFLICT (col) DO UPDATE SET … or DO NOTHING.' },
    { name: 'EXCLUDED',                 type: 'keyword', desc: 'PostgreSQL: references the row that would have been inserted (the conflicting source row).' },
    { name: 'OUTPUT clause',            type: 'keyword', desc: 'MSSQL: capture inserted/updated/deleted rows in a MERGE without a second query.' },
    { name: 'Semicolon required',       type: 'syntax',  desc: 'MSSQL MERGE statement MUST end with a semicolon — missing it causes a parser error.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is upsert and why use it',
      points: [
        'Upsert (update-or-insert) writes a row: if it already exists, update it; if not, insert it. This is a common pattern for syncing data from an external source.',
        'Without upsert, you need two round-trips: SELECT to check existence, then INSERT or UPDATE. Under concurrent load, this causes race conditions — two sessions may both see "not exists" and both try to INSERT, causing a duplicate key error.',
        'Database-native upsert handles this atomically — no race condition, no extra round-trip.',
      ],
    },
    {
      heading: 'MERGE statement (MSSQL / ANSI SQL)',
      points: [
        'MERGE compares a source dataset to a target table using an ON condition, then applies different actions depending on whether rows match.',
        'Three branches: WHEN MATCHED (row exists in target), WHEN NOT MATCHED BY TARGET (row in source but not target — insert), WHEN NOT MATCHED BY SOURCE (MSSQL only — row in target but not source — delete stale data).',
        'The MERGE statement must end with a semicolon in MSSQL. The OUTPUT clause after MERGE captures all affected rows (with $action to distinguish INSERT/UPDATE/DELETE).',
      ],
    },
    {
      heading: 'INSERT … ON CONFLICT (PostgreSQL)',
      points: [
        'PostgreSQL\'s upsert syntax is ON CONFLICT (conflict_target) DO UPDATE SET … or DO NOTHING. It is atomically safe against concurrent inserts.',
        'The special table reference EXCLUDED refers to the row that was proposed for insertion (the "conflicting" row). Use it to reference source values in the SET clause.',
        'The conflict target must be a column with a unique or primary key constraint. You can also use ON CONFLICT ON CONSTRAINT constraint_name.',
      ],
    },
    {
      heading: 'OUTPUT clause and return values',
      points: [
        'MSSQL\'s MERGE OUTPUT clause lets you capture every inserted, updated, or deleted row without an extra SELECT. Use $action to distinguish INSERT/UPDATE/DELETE.',
        'PostgreSQL INSERT … ON CONFLICT can use RETURNING to get the final row values after the upsert — including the id of newly inserted rows.',
        'These features eliminate the common pattern of running a second SELECT after an upsert to fetch the resulting row or ID.',
      ],
    },
    {
      heading: 'Common pitfalls',
      points: [
        'MSSQL MERGE has a known bug: if the source has duplicate rows matching the same target row, the behaviour is undefined and the statement may apply multiple updates incorrectly. Always deduplicate the source CTE before merging.',
        'PostgreSQL ON CONFLICT DO UPDATE is not truly atomic in all cases with partial indexes — test under concurrency. For the highest safety, use advisory locks or serializable isolation.',
        'Both MSSQL MERGE and PostgreSQL ON CONFLICT require a unique/primary key on the conflict column. Missing this causes a syntax or runtime error.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL MERGE',
      language: 'sql',
      code: `-- Sync products from a staging table into the main products table
MERGE products AS target
USING staging_products AS source
    ON target.product_id = source.product_id
WHEN MATCHED THEN
    UPDATE SET
        target.name      = source.name,
        target.price     = source.price,
        target.updated   = GETDATE()
WHEN NOT MATCHED BY TARGET THEN
    INSERT (product_id, name, price, created)
    VALUES (source.product_id, source.name, source.price, GETDATE())
WHEN NOT MATCHED BY SOURCE THEN
    DELETE;           -- remove target rows absent from source`,
    },
    {
      label: 'MSSQL MERGE + OUTPUT',
      language: 'sql',
      code: `-- Capture all changes made by the MERGE
DECLARE @changes TABLE (action VARCHAR(10), product_id INT, name VARCHAR(200));

MERGE products AS target
USING staging_products AS source ON target.product_id = source.product_id
WHEN MATCHED THEN
    UPDATE SET target.name = source.name, target.price = source.price
WHEN NOT MATCHED THEN
    INSERT (product_id, name, price) VALUES (source.product_id, source.name, source.price)
OUTPUT $action, inserted.product_id, inserted.name
INTO @changes;

SELECT action, COUNT(*) AS cnt FROM @changes GROUP BY action;`,
    },
    {
      label: 'PostgreSQL ON CONFLICT',
      language: 'sql',
      code: `-- Basic upsert: insert, or update price if product_id conflicts
INSERT INTO products (product_id, name, price, updated)
VALUES (42, 'Widget', 9.99, NOW())
ON CONFLICT (product_id)
DO UPDATE SET
    price   = EXCLUDED.price,
    updated = NOW();

-- DO NOTHING: ignore duplicates silently
INSERT INTO event_log (event_id, payload)
VALUES (\${eventId}, \${payload}::jsonb)
ON CONFLICT (event_id) DO NOTHING;

-- RETURNING: get the resulting row
INSERT INTO customers (email, name)
VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING id, email, name;`,
    },
    {
      label: 'Safe MSSQL MERGE (deduplicated source)',
      language: 'sql',
      code: `-- Always deduplicate source to avoid the MERGE duplicate-match bug
WITH deduped_source AS (
    SELECT
        product_id,
        name,
        price,
        ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY updated DESC) AS rn
    FROM staging_products
)
MERGE products AS target
USING (SELECT * FROM deduped_source WHERE rn = 1) AS source
    ON target.product_id = source.product_id
WHEN MATCHED AND (target.name <> source.name OR target.price <> source.price) THEN
    UPDATE SET target.name = source.name, target.price = source.price
WHEN NOT MATCHED BY TARGET THEN
    INSERT (product_id, name, price) VALUES (source.product_id, source.name, source.price);`,
    },
    {
      label: 'Upsert in application code (parameterised)',
      language: 'sql',
      code: `-- MSSQL: parameterised MERGE via sp_executesql
-- (used from application layer)
MERGE INTO user_preferences AS target
USING (VALUES (@user_id, @theme, @lang)) AS source (user_id, theme, lang)
    ON target.user_id = source.user_id
WHEN MATCHED THEN
    UPDATE SET theme = source.theme, lang = source.lang
WHEN NOT MATCHED THEN
    INSERT (user_id, theme, lang) VALUES (source.user_id, source.theme, source.lang);

-- PostgreSQL: ON CONFLICT with named parameters
INSERT INTO user_preferences (user_id, theme, lang)
VALUES ($1, $2, $3)
ON CONFLICT (user_id)
DO UPDATE SET theme = EXCLUDED.theme, lang = EXCLUDED.lang;`,
    },
  ];

  challenge: Challenge = {
    title: 'Inventory sync with MERGE / ON CONFLICT',
    language: 'sql',
    description: `You have:
- inventory(product_id PK, quantity, last_updated)
- daily_counts(product_id, quantity)

Write an upsert that:
1. Updates quantity and last_updated for products that already exist in inventory.
2. Inserts new rows for products in daily_counts that aren't in inventory.
Write both the MSSQL MERGE version and the PostgreSQL ON CONFLICT version.`,
    hints: [
      'MSSQL: USING daily_counts AS source ON target.product_id = source.product_id',
      'PostgreSQL: ON CONFLICT (product_id) DO UPDATE SET quantity = EXCLUDED.quantity',
      'Use GETDATE() for MSSQL, NOW() for PostgreSQL to set last_updated',
    ],
    starterCode: `-- MSSQL MERGE version

-- PostgreSQL ON CONFLICT version`,
    solution: `-- MSSQL MERGE version
MERGE inventory AS target
USING daily_counts AS source ON target.product_id = source.product_id
WHEN MATCHED THEN
    UPDATE SET quantity = source.quantity, last_updated = GETDATE()
WHEN NOT MATCHED BY TARGET THEN
    INSERT (product_id, quantity, last_updated)
    VALUES (source.product_id, source.quantity, GETDATE());

-- PostgreSQL ON CONFLICT version
INSERT INTO inventory (product_id, quantity, last_updated)
SELECT product_id, quantity, NOW() FROM daily_counts
ON CONFLICT (product_id)
DO UPDATE SET
    quantity     = EXCLUDED.quantity,
    last_updated = NOW();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In a PostgreSQL ON CONFLICT upsert, what does EXCLUDED refer to?',
      options: [
        'The existing row in the target table',
        'The row that was proposed for insertion but caused a conflict',
        'Rows that were skipped due to DO NOTHING',
        'A system table of constraint violations',
      ],
      answer: 1,
      explanation: 'EXCLUDED is a virtual table referencing the row that would have been inserted. Use EXCLUDED.column to reference source values in the DO UPDATE SET clause.',
    },
    {
      q: 'What is the MSSQL MERGE duplicate source bug?',
      options: [
        'MERGE does not support DELETE as an action',
        'If multiple source rows match the same target row, behaviour is undefined — one or both updates may apply incorrectly',
        'MERGE cannot use CTEs as the source',
        'The semicolon at the end is optional',
      ],
      answer: 1,
      explanation: 'If the source dataset contains multiple rows matching the same target row, MSSQL MERGE has undefined behaviour. Always deduplicate the source (e.g., using ROW_NUMBER()) before merging.',
    },
    {
      q: 'Which PostgreSQL clause captures the resulting row after an upsert?',
      options: ['OUTPUT', 'INTO', 'RETURNING', 'FETCH'],
      answer: 2,
      explanation: 'RETURNING returns specified columns from the affected rows after INSERT … ON CONFLICT. MSSQL uses OUTPUT for equivalent functionality.',
    },
    {
      q: 'What does WHEN NOT MATCHED BY SOURCE do in MSSQL MERGE?',
      options: [
        'Inserts a new row into the source table',
        'Acts when a target row has no matching source row — typically used for DELETE',
        'Updates rows that failed the ON match condition',
        'Validates the source data types against the target',
      ],
      answer: 1,
      explanation: 'WHEN NOT MATCHED BY SOURCE handles target rows that have no corresponding row in the source. It is commonly used to DELETE stale rows from the target during a full sync.',
    },
    {
      q: 'Why must MSSQL MERGE statements end with a semicolon?',
      options: [
        'It is optional but recommended for clarity',
        'It signals the OUTPUT clause to flush results',
        'It is a parser requirement — MERGE is followed by a semicolon even when the next statement also has one',
        'It commits the transaction',
      ],
      answer: 2,
      explanation: 'MSSQL requires a semicolon at the end of a MERGE statement. Omitting it causes a parser error on the next statement. This is a known quirk of the MERGE syntax.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use MERGE or a manual INSERT/UPDATE pattern?',
      a: 'MERGE is atomic and concurrency-safe, but the MSSQL duplicate-source bug makes it risky without deduplication. For simple single-row upserts, ON CONFLICT (PostgreSQL) or a TRY/CATCH INSERT + UPDATE (MSSQL) are cleaner. Use MERGE for bulk sync operations where you control the source data quality.',
    },
    {
      q: 'Does PostgreSQL have a MERGE statement?',
      a: 'Yes — PostgreSQL 15 added a standard MERGE statement. However, ON CONFLICT remains the simpler and more widely used upsert syntax and is available since PostgreSQL 9.5.',
    },
    {
      q: 'How do I upsert and get the resulting ID in both dialects?',
      a: 'PostgreSQL: use RETURNING id after ON CONFLICT DO UPDATE. MSSQL: use the OUTPUT clause — OUTPUT inserted.id INTO @ids — or chain a SELECT after the MERGE.',
    },
  ];
}
