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
  templateUrl: './phase-3-timing-is-about-references-not-elapsed-time.html',
  styleUrl: './phase-3-timing-is-about-references-not-elapsed-time.scss'
})
export class Phase3TimingIsAboutReferencesNotElapsedTimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states Phase 3 happens "weeks later" — but a calendar duration is never actually the thing that makes it safe',
      points: [
        'The main page\'s own theory describes expand-contract as: "Phase 1: add \'full_name\' column... Phase 2: backfill... Phase 3: remove \'user_name\' column (weeks later, after validation)." The quiz answer repeats the same framing: old structure removed "weeks later." Read at face value, this suggests time itself is the safety mechanism — wait long enough, then it\'s safe.',
        'The main page\'s own mistakes entry actually names the REAL criterion in passing, without connecting it back to the "weeks later" framing: the broken example fails specifically because "During a rolling update: old app code sees \'full_name\', crashes... new app code deploys first, tries \'full_name\' that doesn\'t exist yet." The danger was never about elapsed time — it was about a running process (in this case, an in-flight rolling update) still referencing a column that had already changed underneath it.',
      ]
    },
    {
      heading: 'The actual Phase 3 criterion: zero remaining references, not a calendar duration',
      points: [
        'Phase 3 is safe the moment — and ONLY the moment — every single thing that could still reference the old column has stopped referencing it. In practice this means: every pod running the old app version has been fully replaced (no old ReplicaSet still scheduled), every batch job, cron job, and reporting/analytics query that might read the old column has been updated or retired, and every OTHER service in the codebase (not just the one being actively deployed) that touches the same table has also been migrated.',
        '"Weeks later" is a reasonable, defensive DEFAULT precisely because it is usually long enough to be confident all of those things have happened — a rolling update finishes in minutes, most cron jobs run at least weekly, most teams notice a broken batch job within a couple of weeks. But the calendar duration is a PROXY for the real criterion, not the criterion itself: a team with fast, frequent deploys and comprehensive reference-tracking could safely reach Phase 3 in days; a team with an undocumented nightly batch script that only runs on the last day of each month could still be unsafe after weeks, because that one job hasn\'t executed yet to reveal it still depends on the old column.',
        'The practically useful check is a direct one: search the ENTIRE codebase (including infrastructure/reporting tools, not just the app repo) for references to the old column name before dropping it, and confirm via query logs or database-level column-usage metrics (where available) that nothing has actually read or written to it recently — this is a stronger signal than any fixed number of weeks.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why "weeks later" alone is neither necessary nor sufficient',
      language: 'bash',
      code: `# Scenario A: fast-moving team, confident Phase 3 in 4 days
#
# Day 0: Phase 1 deployed (full_name added, dual-write active)
# Day 1: Backfill job completes; all reads switched to full_name
# Day 2-3: Every service confirmed migrated via a codebase-wide grep
#          for "user_name"; old ReplicaSets long gone (rolling
#          updates finish in minutes, not days)
# Day 4: Phase 3 -- drop user_name column. SAFE, despite being far
#        short of "weeks later" -- because the actual criterion
#        (zero remaining references) was already satisfied.

# Scenario B: "weeks later" isn't automatically safe either
#
# Week 0: Phase 1 deployed
# Week 1: Backfill completes, main app migrated
# Week 3: Team feels confident -- it's been "weeks," drops
#         user_name column.
# Week 3, day 2: A month-end billing report (runs on the LAST day
#                of each month, hasn't executed even once since
#                Phase 1 started) queries user_name directly.
#                It has NEVER run since the column was added --
#                elapsed time gave zero signal about THIS
#                reference, because the thing that would have
#                revealed the dependency simply hadn't happened yet.
#                Report job fails/crashes.`,
    },
    {
      label: 'A direct reference check, instead of relying on elapsed time',
      language: 'bash',
      code: `# Before Phase 3 -- search everything that might touch the table,
# not just the actively-deployed application repo:

grep -r "user_name" --include="*.{sql,py,ts,groovy,yml}" .
# ...across the APP repo, any separate reporting/ETL repos,
# scheduled-job definitions (cron, Airflow DAGs, Jenkins jobs),
# and any BI-tool saved queries that live outside version control
# entirely (these need a manual audit -- grep can't see them)

# Where available, check the database's own column-usage /
# query-log signal for a recent window (implementation varies by
# database -- e.g. slow query logs, pg_stat_statements,
# audit-logging extensions):
#
# "Has anything actually SELECTed or written to user_name in the
#  last N days?" -- a real, direct signal, rather than inferring
# safety indirectly from how much calendar time has passed.

# Only once BOTH the codebase search and the usage signal (where
# available) come back clean is Phase 3 -- dropping user_name --
# actually justified, regardless of whether that point arrives in
# 4 days or 4 months.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own expand-contract guidance, waiting a full six weeks before running Phase 3 (dropping the old column) — well past the "weeks later" guidance. A month after Phase 3, a rarely-used quarterly compliance report starts failing. Using this subtopic\'s theory, explain why waiting six weeks did not actually guarantee safety here, and what check would have caught this before dropping the column.',
    hint: 'Per this subtopic\'s theory, does elapsed calendar time directly verify that every possible reference to the old column has been found — or does it only make that MORE LIKELY as a side effect of giving infrequent processes more chances to run?',
    solution: 'Six weeks was not actually sufficient because, per this subtopic\'s theory, elapsed time is only a PROXY for the real criterion (zero remaining references), not the criterion itself — a quarterly report runs roughly every three months, so a six-week window gave it no opportunity to run even once and reveal its dependency on the old column, regardless of how long the team waited. The report\'s failure a month after Phase 3 is exactly the scenario this subtopic\'s theory warns about: a real reference that elapsed time alone was never going to surface, because the specific process that depends on it simply hadn\'t executed during the waiting period. The check that would have caught this beforehand is the direct one — a codebase-wide (and infrastructure/reporting-tool-wide) search for the old column name covering EVERYTHING that might reference it, including infrequently-run jobs whose schedules mean they might not execute during any reasonable waiting window at all, rather than relying on a fixed number of weeks as a stand-in for that search.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "weeks later" guidance means Phase 3 (dropping the old column) is safe purely because enough calendar time has passed since Phase 1.',
      reality: 'Per this subtopic\'s theory, elapsed time is a proxy, not the actual safety mechanism — the real criterion is that every possible reference to the old column (app code, batch jobs, other services, reporting tools) has genuinely stopped using it. "Weeks later" is usually long enough for that to become true, but it isn\'t what makes it true.'
    },
    {
      thought: 'If a team waits LONGER than the main page\'s "weeks later" guidance before running Phase 3, that extra caution guarantees it\'s safe.',
      reality: 'This subtopic\'s exercise shows waiting longer doesn\'t help against a reference that simply hasn\'t had a chance to execute yet — a quarterly job can still be missed after six weeks, the same way it could be missed after two. The fix is checking for references directly, not extending the waiting period further.'
    },
    {
      thought: 'A codebase-wide search for the old column name only needs to cover the actively-deployed application\'s own repository, since that\'s where the expand-contract migration itself is happening.',
      reality: 'Per this subtopic\'s theory, the actual scope is much broader — separate reporting/ETL repos, scheduled job definitions (cron, Airflow, Jenkins), and other services entirely can all reference the same database column without living anywhere near the migrating application\'s own codebase.'
    }
  ];
}
