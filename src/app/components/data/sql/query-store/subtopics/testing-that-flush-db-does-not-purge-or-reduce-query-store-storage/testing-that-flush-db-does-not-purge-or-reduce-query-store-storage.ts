import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-flush-db-not-purge-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-flush-db-does-not-purge-or-reduce-query-store-storage.html',
  styleUrl: './testing-that-flush-db-does-not-purge-or-reduce-query-store-storage.scss',
})
export class TestingThatFlushDbDoesNotPurgeOrReduceQueryStoreStorageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Different Descriptions of the Same Procedure',
      points: [
        'The first "Enable & configure Query Store" code tab introduces sys.sp_query_store_flush_db with an accurate, specific comment: "-- Flush in-memory data to disk (useful before querying)". This describes exactly what it does — persist the in-memory Query Store buffer to its on-disk tables so recently-run queries are visible when you query sys.query_store_* views.',
        'The "Query Store is full (READ_ONLY)" Q&A later lists the SAME procedure as one of two purge-adjacent options for resolving a full Query Store: "or purge old data: EXEC sys.sp_query_store_remove_query @query_id = X; or EXEC sys.sp_query_store_flush_db; followed by ALTER DATABASE … SET QUERY_STORE CLEAR." Presenting flush_db in an "or" list alongside remove_query, immediately before CLEAR, reads as if flushing itself contributes to freeing storage.',
      ],
    },
    {
      heading: 'What flush_db Actually Affects',
      points: [
        'sp_query_store_flush_db forces the asynchronous in-memory write buffer to be written to the on-disk Query Store tables immediately, rather than waiting for the normal periodic flush interval. It is a durability/visibility operation, not a cleanup operation.',
        'current_storage_size_mb in sys.database_query_store_options — the metric that determines whether Query Store is READ_ONLY due to MAX_STORAGE_SIZE_MB being exceeded — is unaffected by flush_db. Only sp_query_store_remove_query (removes one query\'s data), ALTER DATABASE … SET QUERY_STORE CLEAR (removes everything), or raising MAX_STORAGE_SIZE_MB actually change that number.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming storage size is unaffected by flush_db',
      language: 'sql',
      code: `-- Storage size before
SELECT current_storage_size_mb, max_storage_size_mb, readonly_reason
FROM sys.database_query_store_options;
-- e.g. current_storage_size_mb = 487, max_storage_size_mb = 500, readonly_reason = 'SIZE'

EXEC sys.sp_query_store_flush_db;

-- Storage size after -- unchanged (or even slightly HIGHER, since
-- flushing can write buffered data that was still only in memory)
SELECT current_storage_size_mb, max_storage_size_mb, readonly_reason
FROM sys.database_query_store_options;
-- e.g. current_storage_size_mb = 487 (or 488) -- still READ_ONLY,
-- flush_db did not free any space or change the readonly_reason.`,
    },
    {
      label: 'What actually reduces storage size',
      language: 'sql',
      code: `-- Option A: remove one specific query's captured data
EXEC sys.sp_query_store_remove_query @query_id = 42;

SELECT current_storage_size_mb FROM sys.database_query_store_options;
-- current_storage_size_mb decreases, proportional to that query's
-- share of the stored plans/runtime stats.

-- Option B: clear everything (drastic -- loses all history)
ALTER DATABASE MyDB SET QUERY_STORE CLEAR;

SELECT current_storage_size_mb FROM sys.database_query_store_options;
-- current_storage_size_mb resets to near 0.

-- Option C: raise the ceiling instead of freeing space
ALTER DATABASE MyDB SET QUERY_STORE (MAX_STORAGE_SIZE_MB = 1000);
-- readonly_reason clears once current_storage_size_mb is back
-- under the (now higher) max_storage_size_mb -- no data removed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Query Store on a production database has gone READ_ONLY because current_storage_size_mb hit its MAX_STORAGE_SIZE_MB ceiling. Following the Q&A\'s wording literally, a DBA runs EXEC sys.sp_query_store_flush_db; expecting it to be one of the "purge old data" options listed. Does Query Store come back to READ_WRITE?',
    hint: 'Check what current_storage_size_mb actually reflects, and whether flush_db writes NEW data to disk or removes any existing data.',
    solution: `No — Query Store stays READ_ONLY. sp_query_store_flush_db only
forces any data still sitting in the in-memory write buffer to be
persisted to the on-disk Query Store tables sooner than the normal
flush interval would. It does not delete, aggregate away, or free
any existing stored data — if anything, flushing can slightly
INCREASE current_storage_size_mb by writing buffered data that
hadn't hit disk yet.

To actually resolve the READ_ONLY state, the DBA needs one of the
genuine storage-reducing (or ceiling-raising) options:
sp_query_store_remove_query for a specific query, ALTER DATABASE ...
SET QUERY_STORE CLEAR to wipe everything, or raising
MAX_STORAGE_SIZE_MB. The Q&A's phrasing groups flush_db alongside
these as if it belongs in the same "purge old data" category, but
functionally it belongs with querying/reporting operations instead
— exactly as the first code tab's own comment already describes it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sp_query_store_flush_db is a maintenance/cleanup operation that helps free up Query Store storage space.',
      reality: 'it is a durability operation — it forces in-memory data to be written to disk sooner, which can only hold current_storage_size_mb steady or increase it slightly, never decrease it.',
    },
    {
      thought: 'if a reference page lists a stored procedure as one of several options in an "or" list for solving a problem, all the listed options genuinely solve that specific problem.',
      reality: 'here, one item in the "purge old data" list (flush_db) does something unrelated to purging — always verify what an unfamiliar procedure name actually does before relying on its placement in a list of remedies.',
    },
    {
      thought: 'running EXEC sys.sp_query_store_flush_db; before checking sys.database_query_store_options is a way to get an accurate READ_ONLY/READ_WRITE status, since it "refreshes" the data.',
      reality: 'that reasoning is valid for querying RUNTIME/PLAN data (flush_db\'s actual, documented purpose) — but current_storage_size_mb and readonly_reason are metadata about the store itself, not query performance data, and are not stale in a way flush_db resolves.',
    },
  ];
}
