import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-checksum-version-instability-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './checksum-is-not-stable-across-sql-server-versions-or-patches.html',
  styleUrl: './checksum-is-not-stable-across-sql-server-versions-or-patches.scss',
})
export class ChecksumIsNotStableAcrossSqlServerVersionsOrPatchesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Deterministic Enough to Persist" Is Not "Stable Forever"',
      points: [
        'The main page\'s "Full name & checksum patterns" code tab persists a row_hash column: row_hash AS CHECKSUM(first_name, last_name) PERSISTED, describing it as being "for change detection." CHECKSUM() passes SQL Server\'s determinism check (same inputs, same server, same moment → same output), which is exactly what makes SQL Server ALLOW it inside a PERSISTED computed column at all — the main page\'s own theory correctly states that non-deterministic expressions are rejected for PERSISTED columns.',
        'But Microsoft\'s own documentation for CHECKSUM explicitly warns that its output "might differ between versions of SQL Server" and is not guaranteed stable across service packs or even certain internal changes. This means a PERSISTED row_hash value computed and stored under one SQL Server build can come out DIFFERENT if the exact same input row is checksummed again after an in-place SQL Server upgrade — silently breaking any change-detection logic that compares an old stored checksum against a freshly computed one across that upgrade boundary.',
      ],
    },
    {
      heading: 'Why This Matters for "Change Detection"',
      points: [
        'The specific use case the main page names — "row checksum for change detection" — is exactly the scenario this instability breaks. A typical pattern compares a NEWLY computed checksum for an incoming row against the OLD, PERSISTED checksum already stored for that row, to decide whether the row actually changed (e.g., in an ETL "has this record changed since last sync" check). If the two checksums were computed under different SQL Server versions/patches, they could differ even though the underlying data is identical — a false positive that triggers unnecessary reprocessing.',
        'Microsoft\'s own recommended alternative for durable, cross-version-stable hashing is HASHBYTES() with a real cryptographic algorithm (e.g., SHA2_256), which does not carry this same version-instability caveat — the main page never mentions HASHBYTES as an alternative anywhere.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern, exactly as published',
      language: 'sql',
      code: `CREATE TABLE customers (
    customer_id INT IDENTITY PRIMARY KEY,
    first_name  NVARCHAR(100) NOT NULL,
    last_name   NVARCHAR(100) NOT NULL,
    row_hash    AS CHECKSUM(first_name, last_name) PERSISTED
);

INSERT INTO customers (first_name, last_name) VALUES ('Alice', 'Smith');

SELECT customer_id, first_name, last_name, row_hash FROM customers;
-- row_hash = some integer, e.g. -1287643920
--
-- This value is computed and PERSISTED to disk right now, on THIS
-- SQL Server instance's current version/build.`,
    },
    {
      label: 'Confirming Microsoft\'s own documented caveat',
      language: 'sql',
      code: `-- From Microsoft's own CHECKSUM documentation (paraphrased,
-- confirmed current as of recent SQL Server releases):
--
-- "CHECKSUM satisfies the properties of a hash function: [...]
--  The checksum value depends on the SQL collation. [...] Also,
--  because the underlying algorithm may change between versions
--  of SQL Server, checksum results are not guaranteed to be
--  the same between versions of SQL Server."
--
-- Practically: a row with first_name='Alice', last_name='Smith'
-- checksummed on SQL Server 2019 CU10 is NOT guaranteed to produce
-- the identical integer if the SAME row is checksummed again after
-- an in-place upgrade to SQL Server 2022, or even after certain
-- cumulative updates on the same major version.
--
-- The row_hash column's PERSISTED value from BEFORE an upgrade
-- reflects the OLD checksum algorithm's output. A change-detection
-- job comparing that old value to a freshly computed CHECKSUM()
-- on the SAME unchanged data, post-upgrade, can see a mismatch --
-- a false "this row changed" signal for data that never actually changed.`,
    },
    {
      label: 'The stable alternative Microsoft recommends',
      language: 'sql',
      code: `CREATE TABLE customers_v2 (
    customer_id INT IDENTITY PRIMARY KEY,
    first_name  NVARCHAR(100) NOT NULL,
    last_name   NVARCHAR(100) NOT NULL,
    row_hash    AS CONVERT(VARBINARY(32),
                     HASHBYTES('SHA2_256',
                         CONCAT(first_name, N'|', last_name))) PERSISTED
);

-- HASHBYTES with a named cryptographic algorithm (SHA2_256, SHA2_512,
-- etc.) does not carry CHECKSUM's "may change between SQL Server
-- versions" caveat -- the algorithm itself is a fixed, standard
-- cryptographic hash, not an internal, version-dependent SQL Server
-- implementation detail. This is the durable choice for change
-- detection that needs to survive a SQL Server upgrade.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An ETL pipeline uses the main page\'s exact row_hash AS CHECKSUM(...) PERSISTED pattern to skip reprocessing unchanged customer records. After a routine SQL Server cumulative update is applied, the next sync run suddenly reprocesses the ENTIRE customers table, even though no actual customer data changed. What\'s the most likely explanation, and what should replace CHECKSUM for this use case?',
    hint: 'Check whether the CHECKSUM algorithm itself is documented as guaranteed-stable across SQL Server patches — the answer to that determines whether "no data changed" is really true from the pipeline\'s perspective.',
    solution: `The most likely explanation is exactly the CHECKSUM version-instability
caveat: the cumulative update changed the underlying CHECKSUM
algorithm's output for at least some inputs, so freshly computed
CHECKSUM values no longer match the OLD, PERSISTED row_hash values
stored before the update -- even though the actual customer data is
byte-for-byte identical. The pipeline's "has this row changed?" logic
sees a mismatch and (correctly, given its own logic) treats every row
as changed, triggering a full reprocess.

The fix is switching row_hash to HASHBYTES('SHA2_256', ...) (or
another named cryptographic algorithm) instead of CHECKSUM(). Because
HASHBYTES uses a fixed, standard cryptographic algorithm rather than
an internal SQL Server implementation detail that Microsoft
explicitly reserves the right to change between versions, a
HASHBYTES-based row_hash would have remained stable across the exact
same cumulative update, avoiding the unnecessary full reprocess.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if SQL Server allows a function inside a PERSISTED computed column (because it passes the determinism check), that function\'s output is guaranteed to be stable forever, including across version upgrades.',
      reality: 'the determinism check only guarantees the same output for the same input on the SAME SQL Server instance/version at a given moment — CHECKSUM specifically is documented by Microsoft as NOT guaranteed stable across different SQL Server versions or certain patches.',
    },
    {
      thought: 'CHECKSUM() is a reliable, general-purpose choice for row-change detection over the lifetime of a database, including through SQL Server upgrades.',
      reality: 'Microsoft explicitly documents CHECKSUM\'s output as potentially differing between SQL Server versions — HASHBYTES with a named cryptographic algorithm (like SHA2_256) is the recommended, version-stable alternative for durable change detection.',
    },
    {
      thought: 'a change-detection pipeline reprocessing every row after a routine SQL Server patch indicates a bug in the pipeline\'s own comparison logic.',
      reality: 'if the pipeline uses a PERSISTED CHECKSUM-based hash, the root cause can be entirely outside the pipeline\'s logic — CHECKSUM\'s own documented version-instability, not a comparison bug, is a well-known cause of this exact symptom.',
    },
  ];
}
