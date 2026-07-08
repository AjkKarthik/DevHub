import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-switch-then-truncate-data-loss-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-truncate-orders-archive-discards-the-data-just-switched-in.html',
  styleUrl: './testing-that-truncate-orders-archive-discards-the-data-just-switched-in.scss',
})
export class TestingThatTruncateOrdersArchiveDiscardsTheDataJustSwitchedInSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Reading the Main Page\'s Own Statement Order',
      points: [
        'The "MSSQL partition switch (archival)" code tab runs these four statements, in this exact order: (1) SWITCH PARTITION 1 TO orders_archive, moving January\'s rows INTO orders_archive; (2) a comment "The partition is now empty in orders_partitioned"; (3) a comment "Archive table holds January data — can be dropped, moved, or backed up"; (4) TRUNCATE TABLE orders_archive;  -- clear after archiving.',
        'Step 4 runs immediately after step 1, with no backup, export, or move statement anywhere in between — despite step 3\'s own comment saying the archive table "can be… backed up" as if that already happened. TRUNCATE TABLE removes every row from orders_archive, including the January data the SWITCH just placed there seconds earlier.',
      ],
    },
    {
      heading: 'What the Comment Likely Intended vs. What the Code Does',
      points: [
        'The comment "-- clear after archiving" reads as if it refers to a DIFFERENT, later archival cycle — clearing orders_archive before the NEXT month\'s SWITCH reuses the same staging table. That is a legitimate pattern: SWITCH → back up/export → TRUNCATE (to empty it for reuse next month).',
        'But as written, with no backup/export statement between the SWITCH and the TRUNCATE, running this code tab top-to-bottom destroys the January data before it is ever persisted anywhere else — the "archival" produces an empty archive table.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s exact sequence',
      language: 'sql',
      code: `-- (using the fixed SWITCH syntax from the previous subtopic)
ALTER TABLE orders_partitioned
SWITCH PARTITION 1
TO orders_archive;

SELECT COUNT(*) FROM orders_archive;
-- e.g. 41,000 -- January 2024 rows successfully switched in

TRUNCATE TABLE orders_archive;  -- exact statement from the main page

SELECT COUNT(*) FROM orders_archive;
-- 0
--
-- The January data that was just switched in is now gone. It was
-- never exported, backed up, or copied anywhere else first -- the
-- comment "can be dropped, moved, or backed up" describes options
-- that were never actually exercised before the TRUNCATE ran.`,
    },
    {
      label: 'The corrected sequence — back up before truncating',
      language: 'sql',
      code: `ALTER TABLE orders_partitioned
SWITCH PARTITION 1
TO orders_archive;

-- Actually persist the data BEFORE clearing the staging table --
-- e.g. export, or copy into a permanent cold-storage table:
SELECT * INTO orders_archive_2024_01 FROM orders_archive;
-- or: bcp orders_archive out January_2024.bcp -c -T  (external export)

-- Only now is it safe to empty the staging table for next month's reuse:
TRUNCATE TABLE orders_archive;`,
    },
    {
      label: 'Alternative — skip the staging/truncate cycle entirely',
      language: 'sql',
      code: `-- If orders_archive is meant to be a PERMANENT, growing archive
-- (not a reusable staging table), simply never truncate it --
-- each month's SWITCH appends into the same permanent table:
ALTER TABLE orders_partitioned SWITCH PARTITION 1 TO orders_archive;
-- February's switch next month:
-- ALTER TABLE orders_partitioned SWITCH PARTITION 2 TO orders_archive_feb;
-- (each month needs ITS OWN staging table for a single-partition
-- SWITCH -- or a partitioned archive table using target-side
-- PARTITION n, matching the collision this topic's first subtopic covers)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DBA runs the main page\'s exact "MSSQL partition switch (archival)" code tab, top to bottom, once a month as their archival routine. Six months later, they need to restore a customer\'s January order. Where is the January data?',
    hint: 'Trace exactly what happens to orders_archive between the SWITCH statement and the TRUNCATE statement in the code tab — is there any statement that persists the data elsewhere first?',
    solution: `The January data is gone -- it was never persisted anywhere except
transiently in orders_archive, which was truncated in the same
script run, seconds after the SWITCH placed the data there. The
code tab's own comments describe orders_archive as data that "can
be… backed up," but no backup, export, or copy statement actually
appears between the SWITCH and the TRUNCATE.

To recover from this, the DBA would need a genuine backup/export
step (SELECT INTO a permanent table, bcp export, or a database
backup taken before the TRUNCATE) inserted between the SWITCH and
the TRUNCATE -- exactly what the "corrected sequence" example
demonstrates. As originally written, the routine silently deletes
each month's archived data immediately after creating it, and the
DBA likely would not notice until a restore was actually needed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a partition SWITCH followed by TRUNCATE TABLE on the target is a standard, safe archival pattern — TRUNCATE just tidies up.',
      reality: 'TRUNCATE TABLE unconditionally removes all rows from the target. If it runs before the switched-in data is persisted anywhere else (export, backup, or a permanent copy), the data is permanently lost.',
    },
    {
      thought: 'the comment "-- clear after archiving" next to a TRUNCATE statement confirms the archiving already happened and it is now safe to clear the table.',
      reality: 'a comment describes intent, not a guarantee — as written, no statement between the SWITCH and this TRUNCATE actually persists the data anywhere durable; the comment describes a step that is missing from the code, not one that ran.',
    },
    {
      thought: 'if a reference page\'s code tab is titled "archival," every statement in it is safe to run as a complete, tested procedure.',
      reality: 'reference code tabs are illustrative, not a certified runbook — tracing what each statement in the code actually does, in order, is the only way to catch a sequencing bug like this one.',
    },
  ];
}
