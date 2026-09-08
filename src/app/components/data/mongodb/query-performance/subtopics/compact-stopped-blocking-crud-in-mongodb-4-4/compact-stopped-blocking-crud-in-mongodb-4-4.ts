import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Stale "Maintenance Window Only" Claim, Fixed at the Source',
    points: [
      'The main page\'s own QnA on index fragmentation stated compact "blocks all operations on the collection during compaction" — a blanket, version-independent claim. Verified against MongoDB\'s own documented version history that this was true ONLY before MongoDB 4.4; since 4.4, compact does not block CRUD operations on WiredTiger at all.',
      'Before 4.4, compact really did block every operation for its entire duration, which is exactly why the standard advice was to run it only during planned maintenance windows. That advice is now stale for any currently-supported MongoDB version — compact is documented as safe to run at any time since 4.4.',
      'Compact is not entirely free even now: it still adds real checkpoint overhead that can slow other operations and add replication lag, which is why MongoDB\'s own guidance still recommends running it on a SECONDARY when possible — a real, ongoing precaution, just a different one than "never run this except during downtime."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'compact Before vs. After MongoDB 4.4',
    language: 'typescript',
    code: `const db = client.db('shop');

// Modern usage (MongoDB 4.4+): safe to run at any time; CRUD
// operations continue normally throughout.
await db.command({ compact: 'products' });

// Best practice even though it's non-blocking: prefer running it on a
// SECONDARY when possible, to keep checkpoint overhead off the primary.
await db.command({ compact: 'products', force: false });

// Modeling the version-history change, verified against MongoDB's own
// documented behavior:
function simulateCompact(version: number, durationMs: number) {
  const blocksCrud = version < 4.4; // documented: pre-4.4 blocked ALL ops; 4.4+ does not
  return { version, durationMs, blocksCrud, appDowntimeMs: blocksCrud ? durationMs : 0 };
}

const before = simulateCompact(4.2, 120_000); // a 2-minute compact on an older version
const after  = simulateCompact(5.0, 120_000); // the identical duration on a modern version

console.log('MongoDB 4.2 compact:', before);
console.log('MongoDB 5.0 compact:', after);
console.log('App downtime saved by upgrading:', before.appDowntimeMs - after.appDowntimeMs, 'ms');
// -> MongoDB 4.2 compact: { version: 4.2, durationMs: 120000, blocksCrud: true, appDowntimeMs: 120000 }
// -> MongoDB 5.0 compact: { version: 5, durationMs: 120000, blocksCrud: false, appDowntimeMs: 0 }
// -> App downtime saved by upgrading: 120000 ms`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team on MongoDB 6.2 (a version well past the 4.4 fix) still schedules their <code>compact</code> runs for a maintenance window at 3 AM, reasoning "better safe than sorry." Per this subtopic\'s own verified findings, is there still a genuine reason to prefer running it during low-traffic hours, even though CRUD operations are no longer blocked?',
  hint: 'The theory section names a specific, ongoing cost compact still has, separate from the (now-resolved) CRUD-blocking question.',
  solution: `// Yes -- there IS still a real reason, just not the original one.
// Compact still adds genuine checkpoint overhead that can slow other
// operations and add replication lag, even though it no longer
// BLOCKS reads and writes outright. Scheduling it for low-traffic
// hours (or, per MongoDB's own recommendation, running it on a
// SECONDARY specifically) is still sound practice -- the reasoning
// has just shifted from "this will freeze the app" (true pre-4.4,
// false since) to "this adds overhead worth minimizing during peak
// load" (still true today). Confusing these two justifications is
// easy, since the RECOMMENDED BEHAVIOR (schedule it thoughtfully)
// hasn't changed even though the underlying REASON has.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since MongoDB\'s own documentation historically described compact as a maintenance-window-only operation, any current mention of running compact "at any time" must be describing a different, less risky command, not the same compact.',
    reality: 'It genuinely is the SAME command — verified directly against MongoDB\'s own documented version history that compact\'s own locking behavior changed in MongoDB 4.4, not that a new command replaced it. The "maintenance window only" guidance and the "safe to run at any time" guidance both describe db.runCommand({ compact: ... }); they simply apply to different version ranges of the identical command.',
  },
  {
    thought: 'A "non-blocking" operation like compact (post-4.4) has effectively zero performance impact — since it does not block CRUD operations, running it has no meaningful cost at all.',
    reality: 'Verified against MongoDB\'s own documented guidance: non-blocking is not the same as free. Compact still checkpoints regularly, which can slow other operations and introduce replication lag on an active primary — real, measurable costs that justify continuing to prefer a secondary node or a quieter traffic period, even though the specific "all operations frozen" failure mode this subtopic corrects is gone.',
  },
];

@Component({
  selector: 'app-mongo-qp-compact',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './compact-stopped-blocking-crud-in-mongodb-4-4.html',
  styleUrl: './compact-stopped-blocking-crud-in-mongodb-4-4.scss',
})
export class CompactStoppedBlockingCrudInMongodb44Subtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
