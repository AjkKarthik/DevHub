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
    heading: 'Retention Is Purely Size-Based Until You Say Otherwise',
    points: [
      'The main page\'s own QnA used to claim "MongoDB ensures a minimum retention period of 1 hour by default." Verified directly against MongoDB\'s own Replica Set Oplog documentation: "By default MongoDB does not set a minimum oplog retention period and automatically truncates the oplog starting with the oldest entries to maintain the configured maximum oplog size." <code>oplogMinRetentionHours</code> defaults to <strong>0</strong> — disabled, not "1 hour."',
      'Without <code>oplogMinRetentionHours</code> set, oplog entries are removed purely because the oplog exceeded its configured MAX SIZE — their age is never checked at all. A high enough write rate can truncate entries that are only minutes old, well under any "1 hour" figure.',
      'Once <code>oplogMinRetentionHours</code> IS explicitly set, an entry is only removed when BOTH conditions hold: the oplog has exceeded its max size, AND the entry is older than the configured number of hours. This is what actually turns retention into a genuine time-based guarantee — the setting is the mechanism, not a default behavior.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Modeling the Real Default vs. an Explicit Floor',
    language: 'typescript',
    code: `// How many hours of history a fixed-size oplog actually retains,
// given a steady write rate and an oplogMinRetentionHours setting.
function retainedHours(maxSizeMB: number, writeRateMBPerHour: number, oplogMinRetentionHours = 0): number {
  const sizeBasedHours = maxSizeMB / writeRateMBPerHour;
  // With a minimum set, real retention is whichever is LARGER: the
  // explicit floor, or however long size-based retention already gives.
  return Math.max(sizeBasedHours, oplogMinRetentionHours);
}

// A 10GB oplog under a genuinely high write rate: 12GB/hour of oplog data.
const sizeMB = 10 * 1024;
const highRateMBPerHour = 12 * 1024;

console.log('Default (oplogMinRetentionHours = 0):',
  retainedHours(sizeMB, highRateMBPerHour, 0).toFixed(2), 'hours retained');
// -> ~0.83 hours (50 minutes) -- genuinely LESS than the falsely-claimed
// "1 hour minimum" -- because there IS no default minimum at all.

console.log('Same write rate, WITH oplogMinRetentionHours = 1 explicitly set:',
  retainedHours(sizeMB, highRateMBPerHour, 1).toFixed(2), 'hours retained');
// -> 1.00 hours -- the floor only exists once you configure it yourself.

// A calmer write rate: 2GB/hour -- happens to retain hours of history
// even at the true default, which is exactly what makes the false
// "1 hour minimum" claim easy to believe without checking.
const calmRateMBPerHour = 2 * 1024;
console.log('Calmer write rate, still default (oplogMinRetentionHours = 0):',
  retainedHours(sizeMB, calmRateMBPerHour, 0).toFixed(2), 'hours retained');
// -> 5.00 hours -- looks like a "guarantee," but it is purely a side
// effect of this deployment's own write volume, not a documented floor.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team\'s production deployment writes at a steady 500MB/hour and uses the default 10GB oplog with <code>oplogMinRetentionHours</code> left unset. Using the model above, roughly how many hours of history does their oplog retain — and is that number something they can rely on staying the same if their write volume triples during a future traffic spike?',
  hint: 'Compute the size-based figure for 500MB/hour first, then think about what happens to that SAME number once the write rate changes, given that no explicit floor is configured.',
  solution: `// 10,240MB / 500MB per hour = ~20.48 hours retained today.
//
// This number is NOT something the team can rely on staying the same.
// Since oplogMinRetentionHours is unset (defaults to 0), retention is
// PURELY a function of the current write rate against the fixed oplog
// size -- if write volume triples to 1,500MB/hour during a traffic
// spike, the SAME oplog now retains only ~6.83 hours, with zero warning
// and no configuration change on their part. A team that wants a real,
// stable guarantee (e.g. "always at least 4 hours to safely restart a
// consumer") needs to explicitly set oplogMinRetentionHours: 4 --
// otherwise their effective retention silently shrinks under load,
// exactly when a change stream consumer is also most likely to fall
// behind and need that retention window the most.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'MongoDB guarantees at least 1 hour of oplog retention by default — oplogMinRetentionHours just lets you extend that further if you need more.',
    reality: 'Verified against MongoDB\'s own documentation: the default is 0 (disabled), with NO minimum retention guarantee at all — purely size-based truncation. oplogMinRetentionHours does not extend an existing 1-hour floor; it CREATES the first floor that exists, whatever value you set it to.',
  },
  {
    thought: 'If a deployment has been observed retaining 24-72 hours of oplog history in practice, that figure is safe to plan a change stream consumer\'s maximum acceptable downtime around.',
    reality: 'An OBSERVED retention window, without oplogMinRetentionHours explicitly set, is purely a byproduct of the CURRENT write rate against the oplog\'s fixed size — it can shrink without warning the moment write volume increases, since nothing is actually guaranteeing that number. Only an explicitly configured oplogMinRetentionHours is a real, reliable floor to plan around.',
  },
];

@Component({
  selector: 'app-mongo-cs-oplog-retention-default',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './oplog-retention-has-no-default-minimum-hours.html',
  styleUrl: './oplog-retention-has-no-default-minimum-hours.scss',
})
export class OplogRetentionHasNoDefaultMinimumHoursSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
