import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-quantifying-wide-clustered-key-cost-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './quantifying-why-a-wide-clustered-key-multiplies-storage-across-indexes.html',
  styleUrl: './quantifying-why-a-wide-clustered-key-multiplies-storage-across-indexes.scss',
})
export class QuantifyingWhyAWideClusteredKeyMultipliesStorageAcrossIndexesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Rule Is Stated — the Cost Is Never Put Into Numbers',
      points: [
        'The main page\'s own theory states the rule clearly: the clustered key "should be narrow... to avoid row locator widening" — but never quantifies WHY this matters as much as it does. Every non-clustered index\'s leaf row carries the FULL clustered key as its row locator. A wide clustered key is not just "a bit bigger" on its own — its extra bytes are duplicated in EVERY non-clustered index on the table, at every leaf row, and at every level of the B-tree above the leaf.',
        'Concretely: a Customers table with a clustered index on a 16-byte UNIQUEIDENTIFIER (GUID) instead of an 8-byte BIGINT surrogate key costs an extra 8 bytes per row locator. With 5 non-clustered indexes and 10 million rows, that is 8 bytes × 10,000,000 rows × 5 indexes = 400 MB of pure row-locator overhead that would not exist with a narrower key — and this doesn\'t even count the corresponding growth in the B-tree\'s internal (non-leaf) navigation pages, which also carry the key at every level.',
      ],
    },
    {
      heading: 'The Fix Doesn\'t Require Giving Up the GUID',
      points: [
        'If a GUID is genuinely required as a business identifier (e.g., for cross-system uniqueness or client-generated IDs), the fix is not to avoid GUIDs entirely — it is to keep the CLUSTERED key narrow (a BIGINT IDENTITY surrogate) and make the GUID a separate, non-clustered UNIQUE index instead. This keeps every OTHER non-clustered index\'s row locator narrow, while the GUID remains fully queryable and unique via its own index.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Measuring the actual index size difference (MSSQL)',
      language: 'sql',
      code: `-- Table A: GUID as the clustered key
CREATE TABLE CustomersGuid (
    CustomerID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    Email      VARCHAR(100),
    FullName   VARCHAR(100),
    CONSTRAINT PK_CustomersGuid PRIMARY KEY CLUSTERED (CustomerID)
);
CREATE INDEX IX_CustomersGuid_Email    ON CustomersGuid (Email);
CREATE INDEX IX_CustomersGuid_FullName ON CustomersGuid (FullName);

-- Table B: BIGINT surrogate as the clustered key; GUID as a
-- non-clustered unique index instead
CREATE TABLE CustomersBigint (
    CustomerID BIGINT IDENTITY NOT NULL,
    ExternalID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    Email      VARCHAR(100),
    FullName   VARCHAR(100),
    CONSTRAINT PK_CustomersBigint PRIMARY KEY CLUSTERED (CustomerID)
);
CREATE UNIQUE INDEX UX_CustomersBigint_ExternalID ON CustomersBigint (ExternalID);
CREATE INDEX IX_CustomersBigint_Email    ON CustomersBigint (Email);
CREATE INDEX IX_CustomersBigint_FullName ON CustomersBigint (FullName);

-- After loading the SAME row count into both tables, compare:
SELECT OBJECT_NAME(ips.object_id) AS TableName, i.name AS IndexName,
       ips.page_count, ips.page_count * 8 / 1024.0 AS SizeMB
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'DETAILED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE OBJECT_NAME(ips.object_id) IN ('CustomersGuid', 'CustomersBigint')
ORDER BY TableName, IndexName;
-- IX_CustomersGuid_Email and IX_CustomersGuid_FullName will show
-- consistently more pages than their CustomersBigint counterparts --
-- the extra bytes are the GUID row locator, duplicated per index.`,
    },
    {
      label: 'The fix — narrow clustered key, GUID as a separate unique index',
      language: 'sql',
      code: `-- Business code that needs to look up by the external GUID still
-- works exactly the same, via its own dedicated index:
SELECT CustomerID, Email, FullName
FROM CustomersBigint
WHERE ExternalID = '3F2504E0-4F89-11D3-9A0C-0305E82C3301';
-- Uses UX_CustomersBigint_ExternalID directly -- same lookup speed
-- as if the GUID were the clustered key, but every OTHER
-- non-clustered index (Email, FullName) stays narrow, since none of
-- them carry the GUID as their row locator anymore -- only the
-- 8-byte BIGINT does.

-- Foreign keys from other tables also stay narrow when they reference
-- CustomerID (BIGINT) rather than ExternalID (GUID):
CREATE TABLE Orders (
    OrderID    BIGINT IDENTITY PRIMARY KEY,
    CustomerID BIGINT NOT NULL REFERENCES CustomersBigint(CustomerID),
    OrderDate  DATE
);
-- An 8-byte FK column instead of a 16-byte one, repeated across
-- potentially millions of order rows -- the savings compound further
-- outside the Customers table itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DBA proposes switching a heavily-indexed Orders table (12 non-clustered indexes, 200 million rows) from a BIGINT clustered key to a UNIQUEIDENTIFIER clustered key, purely because "GUIDs are more modern and globally unique." Using the arithmetic from the code tab above, estimate the extra row-locator storage this change would add across all 12 indexes, and explain why this estimate is actually a LOWER BOUND on the real cost.',
    hint: 'The GUID is 16 bytes vs BIGINT\'s 8 bytes — multiply the per-row difference by the row count and the index count, then think about what ELSE besides leaf-level row locators also grows.',
    solution: `The GUID is 8 bytes wider than the BIGINT (16 vs 8 bytes). Across 12
non-clustered indexes and 200,000,000 rows, that's an extra 8 bytes x
200,000,000 rows x 12 indexes = 19,200,000,000 bytes, or
approximately 17.9 GB of pure row-locator overhead that would not
exist with the narrower BIGINT key.

This estimate is a LOWER bound because it only accounts for the
leaf-level row locators. The B-tree's internal (non-leaf) navigation
pages of the CLUSTERED index itself also store the key at every
level, and switching to a wider key increases the fan-out cost there
too -- more pages are needed at each internal level, which in turn
increases the total page count, buffer pool pressure, and I/O for
every query that touches these indexes, not just the raw byte count
computed above.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a 16-byte GUID versus an 8-byte BIGINT clustered key is a "small" difference that shouldn\'t meaningfully affect a table\'s storage footprint.',
      reality: 'the extra bytes are duplicated in the row locator of EVERY non-clustered index on the table, not just stored once — a table with several non-clustered indexes multiplies that "small" per-row difference across each one, at every row.',
    },
    {
      thought: 'avoiding a wide clustered key means giving up on using GUIDs for external/business identifiers entirely.',
      reality: 'a GUID can remain fully usable as a unique, queryable business identifier via a separate non-clustered UNIQUE index — only the CLUSTERED key (and any foreign keys referencing it) need to stay narrow to avoid the storage multiplication.',
    },
    {
      thought: 'the storage cost of a wide clustered key is limited to the row locators stored at the leaf level of each non-clustered index.',
      reality: 'the wider key also increases the size of the clustered index\'s own internal B-tree navigation pages at every level, compounding the cost beyond what a simple leaf-row-locator calculation captures.',
    },
  ];
}
