import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './reindex-concurrently-avoids-write-locks-but-isnt-fully-lock-free.html',
  styleUrl: './reindex-concurrently-avoids-write-locks-but-isnt-fully-lock-free.scss'
})
export class ReindexConcurrentlyAvoidsWriteLocksButIsntFullyLockFreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "without locking" claim that was true for the case that matters most, but not literally',
      points: [
        'The main page\'s QnA on index bloat originally said "REINDEX CONCURRENTLY rebuilds the index without locking the table." Checking PostgreSQL\'s own documentation shows this is true in the sense that matters for most production operators — it does not block reads or writes — but it is not literally lock-free. The page has been corrected to state precisely what is and is not blocked.',
        'This is a common shorthand in database advice generally: "concurrent" operations are described as "lock-free" because they avoid the SPECIFIC lock that would have blocked normal application traffic — but "avoids the lock that matters to your app" and "takes no lock at all" are different claims worth distinguishing before relying on the second one.',
      ]
    },
    {
      heading: 'What REINDEX CONCURRENTLY actually locks, per PostgreSQL\'s own documentation',
      points: [
        'A plain REINDEX takes an ACCESS EXCLUSIVE lock on the table — the strongest lock PostgreSQL has, which blocks ALL other access (reads, writes, even other queries just trying to look at the table\'s structure) for the whole operation.',
        'REINDEX CONCURRENTLY instead takes a SHARE UPDATE EXCLUSIVE lock — genuinely much weaker: it does NOT block concurrent SELECT, INSERT, UPDATE, or DELETE statements, which is the practical reason it is the recommended option for reindexing a live production table. But it DOES block other SCHEMA-MODIFYING operations (like adding a column, or another REINDEX/CREATE INDEX) on the same table for its duration.',
        'The operation is also structurally different, not just differently-locked: PostgreSQL\'s own docs describe REINDEX CONCURRENTLY as running as several separate steps, each in its own transaction — this is WHY it can avoid the big exclusive lock, but it also means the whole operation takes meaningfully longer than a plain REINDEX and consumes more resources (a second, temporary copy of the index exists during the rebuild).',
      ]
    },
    {
      heading: 'Why the "not fully lock-free" nuance is worth knowing for a maintenance-window decision',
      points: [
        'A team that reads "REINDEX CONCURRENTLY = no locking" might assume it is completely safe to run alongside ANY other maintenance operation on the same table — including another index rebuild, or a migration tool that adds a column — when in fact those specific operations will BLOCK behind the SHARE UPDATE EXCLUSIVE lock until the concurrent reindex finishes.',
        'This directly matters for planning: it is safe to run REINDEX CONCURRENTLY during business hours alongside normal application traffic (the main benefit the main page correctly highlights), but it is NOT automatically safe to queue it up back-to-back with an unrelated schema migration on the same table without accounting for the wait.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each REINDEX form actually blocks',
      language: 'typescript',
      code: `interface ReindexForm {
  variant: string;
  lockType: string;
  blocksReadsWrites: boolean;
  blocksOtherSchemaChanges: boolean;
}

const forms: ReindexForm[] = [
  {
    variant: 'REINDEX (plain)',
    lockType: 'ACCESS EXCLUSIVE',
    blocksReadsWrites: true,
    blocksOtherSchemaChanges: true,
  },
  {
    variant: 'REINDEX CONCURRENTLY',
    lockType: 'SHARE UPDATE EXCLUSIVE',
    blocksReadsWrites: false, // the whole point -- app traffic is unaffected
    blocksOtherSchemaChanges: true, // still true, often overlooked
  },
];

// "Without locking the table" is accurate for the row that
// affects application traffic (reads/writes) -- it is NOT
// accurate for the row that affects other DDL/maintenance
// operations queued against the same table.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team schedules two maintenance jobs to run back-to-back on the same large table: first REINDEX CONCURRENTLY to fix index bloat, immediately followed by ALTER TABLE ... ADD COLUMN to support a new feature. They assume both are "non-blocking" so running them close together is fine. What actually happens?',
    hint: 'REINDEX CONCURRENTLY does not block reads/writes — but does it hold ANY lock at all for its duration, and does ADD COLUMN need to wait for that lock to clear?',
    solution: 'REINDEX CONCURRENTLY holds a SHARE UPDATE EXCLUSIVE lock on the table for its full duration — this does not block ordinary application reads/writes, but it DOES block other schema-modifying operations on the same table, including ALTER TABLE ... ADD COLUMN. So the ADD COLUMN job queued immediately after will simply wait (blocked) until the REINDEX CONCURRENTLY operation finishes, which — since it runs as multiple separate steps and typically takes meaningfully longer than a plain REINDEX — could be a much longer wait than the team expected from treating both operations as generically "non-blocking." The fix is either sequencing them with an explicit gap, or confirming the reindex has actually completed before kicking off the schema change, rather than assuming "non-blocking" means "can run in parallel with anything."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'REINDEX CONCURRENTLY takes no lock at all on the table it is rebuilding.',
      reality: 'Per this subtopic\'s theory, it takes a SHARE UPDATE EXCLUSIVE lock — a genuinely much weaker lock than a plain REINDEX\'s ACCESS EXCLUSIVE, but not zero. That weaker lock still blocks other schema-modifying operations on the same table.'
    },
    {
      thought: 'Since REINDEX CONCURRENTLY does not block reads and writes, it is safe to run alongside any other maintenance operation on the same table without special sequencing.',
      reality: 'Per this subtopic\'s theory, "does not block reads/writes" is specifically about ordinary application traffic — other DDL/schema-change operations on the same table will still queue and wait behind REINDEX CONCURRENTLY\'s own lock.'
    },
    {
      thought: 'REINDEX CONCURRENTLY takes roughly the same time as a plain REINDEX, just without the big lock.',
      reality: 'Per this subtopic\'s theory, REINDEX CONCURRENTLY runs as several separate steps, each its own transaction, and maintains a temporary second copy of the index during the rebuild — this structural difference is WHY it avoids the exclusive lock, but it also means it typically takes meaningfully longer and uses more resources than a plain REINDEX.'
    }
  ];
}
