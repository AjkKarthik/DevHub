import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-table-variable-inline-index-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-table-variables-support-inline-non-unique-indexes.html',
  styleUrl: './demonstrating-that-table-variables-support-inline-non-unique-indexes.scss',
})
export class DemonstratingThatTableVariablesSupportInlineNonUniqueIndexesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An Incomplete Answer, Now Outdated',
      points: [
        'The main page\'s Q&A on indexing table variables says: "Only implicitly — you can declare a PRIMARY KEY or UNIQUE constraint in the table variable definition, which creates the underlying index. You cannot issue a standalone CREATE INDEX on a @table_var after it is declared." The second sentence remains true — but the first sentence understates what\'s actually possible, and has been incomplete since SQL Server 2014.',
        'Since SQL Server 2014, table variable declarations support INLINE INDEX syntax for regular, NON-UNIQUE, non-key indexes too — not just the implicit indexes that come from PRIMARY KEY or UNIQUE constraints. This means a table variable CAN have a genuine, purpose-built NONCLUSTERED index on a column that has nothing to do with uniqueness, contradicting the Q&A\'s framing that PK/UNIQUE constraints are the only path to an index on a table variable.',
      ],
    },
    {
      heading: 'The Syntax and Why It Matters',
      points: [
        'The inline INDEX clause goes directly inside the DECLARE @t TABLE (...) column list, alongside the column definitions: DECLARE @t TABLE (id INT, category VARCHAR(50), INDEX ix_category NONCLUSTERED (category)). This creates a real index the query optimizer can use for lookups and joins on "category" — a column with no uniqueness constraint at all.',
        'This closes a real gap in the "use #temp for anything needing indexes, @table_var only for small unindexed sets" rule of thumb elsewhere on the main page — for SQL Server 2014+, a table variable can be indexed on non-key columns too, though it still lacks the query-plan statistics that make #temp tables the better choice for genuinely large result sets.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s claim — index only via PK/UNIQUE',
      language: 'sql',
      code: `-- What the main page's Q&A describes as the only option:
DECLARE @products TABLE (
    product_id INT PRIMARY KEY,      -- implicit index, via PRIMARY KEY
    sku        VARCHAR(20) UNIQUE,   -- implicit index, via UNIQUE
    category   VARCHAR(50)           -- NO index possible, per the Q&A
);

-- The Q&A is correct that you cannot do this AFTER the DECLARE:
-- CREATE INDEX ix_category ON @products (category);
-- Msg 1088: Cannot find the object "@products" because it does not
-- exist or you do not have permissions.
-- (table variables genuinely can't take a standalone CREATE INDEX)`,
    },
    {
      label: 'What the Q&A misses — inline indexes since SQL Server 2014',
      language: 'sql',
      code: `DECLARE @products TABLE (
    product_id INT PRIMARY KEY,
    sku        VARCHAR(20) UNIQUE,
    category   VARCHAR(50),
    price      DECIMAL(10,2),
    INDEX ix_category NONCLUSTERED (category),        -- non-unique,
                                                        -- non-key index
    INDEX ix_category_price NONCLUSTERED (category, price)  -- composite,
                                                              -- also non-unique
);

INSERT INTO @products VALUES
    (1, 'SKU-1', 'Electronics', 199.99),
    (2, 'SKU-2', 'Electronics',  49.99),
    (3, 'SKU-3', 'Kitchen',      29.99);

-- These indexes are real -- confirm with an execution plan:
SELECT product_id, price FROM @products WHERE category = 'Electronics';
-- The optimizer CAN use ix_category here, unlike a table variable
-- with no index at all on "category" -- contradicting the Q&A's
-- framing that PK/UNIQUE constraints are the only path to indexing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer on SQL Server 2019 reads the main page\'s Q&A and concludes "if I need a table variable indexed on a non-unique column like category, I have to use a #temp table instead — table variables just can\'t do that." Is this conclusion correct for their SQL Server version, and what should they check first?',
    hint: 'The Q&A\'s claim was accurate for versions before SQL Server 2014 — check whether the developer\'s SQL Server version predates or postdates that inline-index feature.',
    solution: `The conclusion is not correct on SQL Server 2019 (or any version
2014+). Table variables have supported inline, non-unique
NONCLUSTERED indexes declared directly in the DECLARE @t TABLE (...)
statement since SQL Server 2014 -- the developer can add INDEX
ix_category NONCLUSTERED (category) to their table variable's column
list and get a real, usable index on that non-key column, without
switching to a #temp table.

The one thing they should still check is whether their actual use
case needs accurate query-plan STATISTICS (row-count estimates) --
table variables still don't maintain statistics the way #temp tables
do, regardless of whether they're indexed, so for large or
skewed result sets a #temp table with an index may still produce a
better execution plan even with the same inline-index feature
available on the table variable. Indexing capability and statistics
accuracy are two separate concerns, and only one of them was actually
limited by the (outdated) claim in the Q&A.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a table variable can only be indexed implicitly, via a PRIMARY KEY or UNIQUE constraint declared on one of its columns.',
      reality: 'since SQL Server 2014, table variables also support explicit, non-unique NONCLUSTERED indexes declared inline in the DECLARE @t TABLE (...) statement — indexing is not limited to PK/UNIQUE-backed columns.',
    },
    {
      thought: 'if a table variable needs an index on a non-key column, switching to a #temp table is the only option.',
      reality: 'on SQL Server 2014+, an inline INDEX clause in the table variable declaration provides this directly — a #temp table is still the better choice for large result sets specifically because of missing STATISTICS, not missing index support.',
    },
    {
      thought: '"you cannot issue a standalone CREATE INDEX on a @table_var" (the accurate half of the Q&A) means table variables cannot be indexed at all beyond PK/UNIQUE.',
      reality: 'the standalone CREATE INDEX limitation only rules out adding an index AFTER the DECLARE statement — indexes (including non-unique ones) declared INLINE, as part of the DECLARE statement itself, are fully supported since SQL Server 2014.',
    },
  ];
}
