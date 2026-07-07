import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-bulk-logged-pitr-gap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-bulk-logged-advice-missing-the-point-in-time-restore-gap.html',
  styleUrl: './correcting-the-bulk-logged-advice-missing-the-point-in-time-restore-gap.scss',
})
export class CorrectingTheBulkLoggedAdviceMissingThePointInTimeRestoreGapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Recovery Model Q&A',
      points: [
        'The "What recovery model should I use for a large bulk load in MSSQL?" Q&A recommends: switch to BULK_LOGGED for the load duration, run the load, switch back to FULL, "and take a log backup immediately." It frames this sequence as the way to keep "the database recoverable" through a bulk load.',
        'The advice is directionally correct — BULK_LOGGED does reduce log volume for bulk operations while remaining part of the FULL recovery chain. But "recoverable" understates a specific, well-documented restriction on exactly the log backup this Q&A tells you to take immediately after the load.',
      ],
    },
    {
      heading: 'The Restriction the Q&A Doesn\'t Mention',
      points: [
        'Per Microsoft\'s own documentation on backup under the bulk-logged recovery model: if a transaction log backup contains ANY minimally-logged (bulk) operations, that specific log backup does not support point-in-time restore. You can restore up through the END of that log backup, or skip past it entirely to a later one — but you cannot land on an arbitrary timestamp that falls within it.',
        'This matters precisely because the Q&A\'s own recommended workflow — switch to BULK_LOGGED, run the bulk load, take a log backup — produces exactly the kind of log backup this restriction applies to. If a restore is later needed to a point in time that falls inside that specific backup (e.g., "restore to just before an accidental DELETE that happened 10 minutes after the bulk load"), it is not possible using that log backup alone.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s recommended sequence',
      language: 'sql',
      code: `ALTER DATABASE MyDB SET RECOVERY BULK_LOGGED;

-- (run the bulk load here)
BULK INSERT dbo.orders FROM 'C:\\data\\orders.csv'
WITH (FORMAT = 'CSV', FIRSTROW = 2, TABLOCK);

ALTER DATABASE MyDB SET RECOVERY FULL;

BACKUP LOG MyDB TO DISK = 'C:\\backups\\MyDB_afterbulk.trn';
-- This log backup CONTAINS the minimally-logged bulk operation --
-- it is exactly the kind of backup the point-in-time restriction
-- applies to, and the Q&A's own wording never says so.`,
    },
    {
      label: 'What that restriction means for a later restore',
      language: 'sql',
      code: `-- Suppose 10 minutes after the bulk load, someone accidentally
-- runs: DELETE FROM orders WHERE customer_id = 42;  (should have been WHERE customer_id = 4200)
-- and you want to restore to just before that DELETE.

-- This RESTORE attempt fails/is rejected:
RESTORE LOG MyDB
FROM DISK = 'C:\\backups\\MyDB_afterbulk.trn'
WITH STOPAT = '2026-07-08 14:32:00', RECOVERY;
-- Msg 3159: STOPAT cannot be honored because the log backup
-- contains minimally logged (bulk) changes and does not support
-- point-in-time restore to a point within it.

-- The only options with THIS log backup are:
--   (a) restore it fully (to its end) -- past the accidental DELETE too, or
--   (b) skip it and restore the NEXT log backup (taken after this
--       one) to a point-in-time within THAT backup instead, accepting
--       you cannot land inside the bulk-logged backup's own window.`,
    },
    {
      label: 'A sequence that preserves point-in-time restore capability',
      language: 'sql',
      code: `ALTER DATABASE MyDB SET RECOVERY BULK_LOGGED;
BULK INSERT dbo.orders FROM 'C:\\data\\orders.csv'
WITH (FORMAT = 'CSV', FIRSTROW = 2, TABLOCK);
ALTER DATABASE MyDB SET RECOVERY FULL;

-- Take the log backup covering the bulk-logged window
-- (still cannot point-in-time restore WITHIN this one -- unavoidable)
BACKUP LOG MyDB TO DISK = 'C:\\backups\\MyDB_afterbulk.trn';

-- Immediately take ANOTHER log backup once back on FULL recovery,
-- even with zero new activity -- this establishes a fresh,
-- fully-logged starting point going forward:
BACKUP LOG MyDB TO DISK = 'C:\\backups\\MyDB_postbulk_boundary.trn';
-- Point-in-time restore now works normally for anything that
-- happens AFTER this boundary backup -- exactly the accidental
-- DELETE scenario above, as long as it happened after this backup.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You follow the main page\'s Q&A exactly: switch to BULK_LOGGED, run the load, switch back to FULL, and immediately take a log backup. Two weeks later, someone needs to restore to a specific timestamp that falls five minutes AFTER the bulk load finished but is still covered by that same log backup (no other log backup was taken in between). Can you do it?',
    hint: 'Check what the log backup taken immediately after switching back to FULL actually contains, and what the documented restriction says about restoring to a point in time within it.',
    solution: `No — not using that log backup. Because it contains the
minimally-logged bulk operation, SQL Server does not support
restoring to an arbitrary point in time within it, even if the
target timestamp is technically after the bulk load statement
itself finished within that same backup's time window. The only
options are to restore that log backup in full (landing exactly at
its end) or to restore a later log backup to a point-in-time within
that later backup instead.

The Q&A's advice to "take a log backup immediately" is necessary
but not sufficient for preserving point-in-time restore capability
through this exact window — an additional log backup taken right
after (with no bulk operations in it) is what actually re-enables
fine-grained point-in-time restore for everything from that second
backup onward, as shown in the third code example above.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'switching back to FULL recovery model and taking a log backup immediately after a bulk load fully restores normal point-in-time restore capability from that moment forward.',
      reality: 'the very next log backup taken still CONTAINS the minimally-logged bulk operation and is therefore itself exempt from point-in-time restore — a further, bulk-operation-free log backup is what actually re-establishes fine-grained restore capability.',
    },
    {
      thought: '"the database is recoverable" (the Q&A\'s own phrase) is equivalent to "any point in time is restorable."',
      reality: 'BULK_LOGGED keeps the database in the FULL recovery chain (so no backup chain is broken and full/differential restores work normally) — but it specifically forfeits point-in-time granularity for whichever log backup captures the minimally-logged operation.',
    },
    {
      thought: 'this restriction only matters for exotic, rarely-needed restore scenarios, so it is safe to omit from routine bulk-load runbooks.',
      reality: 'the exact scenario it blocks — restoring to a timestamp shortly after a bulk load, to undo some unrelated mistake that happened soon after — is a common, realistic reason to need point-in-time restore in practice.',
    },
  ];
}
