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
  templateUrl: './pitr-5-min-window-confuses-granularity-with-recency-lag.html',
  styleUrl: './pitr-5-min-window-confuses-granularity-with-recency-lag.scss'
})
export class Pitr5MinWindowConfusesGranularityWithRecencyLagSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A claim that contradicted the page\'s own Challenge solution, right on the same page',
      points: [
        'The main page\'s theory section originally said "RDS, Cloud SQL, and Aurora snapshot every 5 min. Restore to any 5-min window" — implying PITR restore points are coarse, spaced 5 minutes apart. The Challenge\'s own solution, elsewhere on the SAME page, describes restoring "to 30 seconds before the DELETE" and states an RPO of "< 30 seconds (PITR granularity)" — a precision that a genuine 5-minute-window restore mechanism could not achieve. The page has been corrected.',
        'This is catchable with zero external research: a "restore to any 5-minute window" mechanism cannot also deliver "restore to 30 seconds before an event" — the two claims describe different levels of precision for the supposedly SAME underlying capability.',
      ]
    },
    {
      heading: 'What "5 minutes" actually refers to, per AWS\'s own documentation',
      points: [
        'AWS RDS documents a field called LatestRestorableTime — the most RECENT point in time you can currently restore to. This value is typically about 5 minutes behind the current time, because that is how far behind real-time the continuously-archived transaction log stream trails.',
        'This is a statement about RECENCY (how close to "now" you can restore), not about GRANULARITY (how finely you can choose a restore point within the available range). Within the retention period, RDS PITR supports restoring to essentially any SECOND, using the automated base backup plus continuously archived transaction logs replayed up to the requested timestamp.',
        'Concretely: if a destructive DELETE happened 20 minutes ago, you can restore to the exact second immediately before it — the "5 minutes" figure only becomes relevant if you tried to restore to something that happened in roughly the last 5 minutes, which may not yet be restorable because the transaction log covering it has not finished archiving.',
      ]
    },
    {
      heading: 'Why the imprecise framing matters for exactly the scenario the page\'s own Challenge describes',
      points: [
        'The Challenge scenario is an accidental DELETE on a payments table — precisely the kind of incident where restoring to the WRONG second (because you believed the granularity was only 5 minutes) could mean either re-losing legitimate transactions that happened just before the DELETE, or failing to fully exclude the destructive statement itself.',
        'Understanding the real mechanism — second-level restore precision, with only the MOST RECENT ~5 minutes potentially unavailable — lets a team correctly reason about exactly how close to a destructive event they can safely restore, rather than assuming a coarse 5-minute margin of error they do not actually have to plan around.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Granularity vs. recency — checking LatestRestorableTime',
      language: 'bash',
      code: `# Check how close to "now" you can currently restore an RDS instance
aws rds describe-db-instances --db-instance-identifier payments-db \\
  --query 'DBInstances[0].LatestRestorableTime'
# e.g. "2026-07-29T14:25:03Z" -- roughly 5 minutes behind the current time,
# NOT a snapshot boundary -- this is a recency limit, not a granularity limit

# Restoring to a specific SECOND, well within the retention window
# (not constrained to 5-minute boundaries):
aws rds restore-db-instance-to-point-in-time \\
  --source-db-instance-identifier payments-db \\
  --target-db-instance-identifier payments-db-restored \\
  --restore-time "2026-07-29T09:14:37Z"
# Any second is a valid --restore-time, as long as it is before
# LatestRestorableTime and within the backup retention period.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An accidental DELETE on the payments table happened at 09:14:37 UTC, confirmed from application logs. A teammate says "we can only restore to 5-minute windows, so the closest we can get is the 09:10:00 or 09:15:00 snapshot — we\'ll lose several minutes of legitimate transactions either way." Is this correct?',
    hint: 'Does RDS PITR restore to fixed snapshot boundaries, or does it replay transaction logs up to an arbitrary requested timestamp?',
    solution: 'Not correct. RDS PITR is not limited to discrete 5-minute snapshot boundaries — it replays the base backup plus continuously archived transaction logs up to whatever specific timestamp you request, at second-level precision. The team can request a restore to 09:14:36 UTC (one second before the confirmed DELETE) and get exactly that state, preserving every legitimate transaction up to that second while excluding the destructive DELETE. The "5 minutes" figure the teammate is thinking of describes LatestRestorableTime — how close to the CURRENT moment a restore can target, not the spacing between valid restore points in the past. Since this incident happened well outside that ~5-minute recency window, second-level restore precision is fully available.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RDS PITR restores are limited to discrete snapshot boundaries spaced 5 minutes apart — you cannot target an arbitrary second.',
      reality: 'Per this subtopic\'s theory, RDS PITR replays continuously archived transaction logs on top of a base backup up to any requested timestamp, supporting second-level restore precision — the "5 minutes" figure is unrelated to this granularity.'
    },
    {
      thought: '"LatestRestorableTime typically 5 minutes behind now" and "restore granularity is 5-minute windows" are two ways of describing the same limitation.',
      reality: 'Per this subtopic\'s theory, these describe genuinely different things — recency (how close to the current moment you can restore) versus granularity (how finely you can choose a restore point within the available range). RDS constrains the former to roughly 5 minutes but supports second-level precision for the latter.'
    },
    {
      thought: 'Since RDS PITR has some limitation related to "5 minutes," restoring to the exact second before a destructive event from an hour ago is not possible.',
      reality: 'Per this subtopic\'s theory, the 5-minute figure only affects restores targeting roughly the last 5 minutes of activity (which may not have finished archiving yet) — an incident from an hour ago is well outside that window and can be restored to the exact second, as the page\'s own Challenge solution correctly demonstrates elsewhere.'
    }
  ];
}
