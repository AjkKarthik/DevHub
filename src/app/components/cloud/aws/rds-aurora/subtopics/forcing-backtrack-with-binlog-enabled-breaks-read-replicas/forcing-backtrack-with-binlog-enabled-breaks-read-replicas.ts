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
  templateUrl: './forcing-backtrack-with-binlog-enabled-breaks-read-replicas.html',
  styleUrl: './forcing-backtrack-with-binlog-enabled-breaks-read-replicas.scss'
})
export class ForcingBacktrackWithBinlogEnabledBreaksReadReplicasSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents Backtrack as a simple, low-risk rewind — no interactions with other Aurora features mentioned',
      points: [
        'The main page\'s own "Aurora Backtrack" theory bullet describes it as rewinding "the cluster to any point in time within the backtrack window (up to 72 h) without restoring a snapshot — database remains online." Its own code tab shows enabling backtrack and performing one, with no mention of any other Aurora feature that could conflict with it.',
        'The main page\'s own "Amazon Aurora Architecture" section separately covers cross-region read replicas and CloudWatch log exports (binary logging is implied for MySQL replication) as if they were independent, freely-combinable features — nothing connects the two sections.',
      ]
    },
    {
      heading: 'Binary logging and backtrack interact badly — forcing it breaks downstream replicas',
      points: [
        'Per AWS\'s own documented backtracking limitations: "You can\'t create cross-Region read replicas from a backtrack-enabled cluster, but you can still enable binary log (binlog) replication on the cluster. If you try to backtrack a DB cluster for which binary logging is enabled, an error typically occurs unless you choose to force the backtrack."',
        'AWS is explicit about the consequence of overriding that safety check: "Any attempts to force a backtrack will break downstream read replicas and interfere with other operations such as blue/green deployments." This is not a theoretical edge case — it is the DOCUMENTED, EXPECTED outcome of using the force option specifically because it exists to let you bypass the block, at the cost AWS states directly.',
        'AWS\'s own documentation also describes what backtracking does to ACTIVE connections and in-flight work on the cluster itself, regardless of binlog: "Backtracking causes a brief DB instance disruption. You must stop or pause your applications before starting a backtrack operation... Aurora pauses the database, closes any open connections, and drops any uncommitted reads and writes." The main page\'s own "database remains online" framing is accurate in the sense that no new cluster is created, but it undersells the real, if brief, disruption every backtrack causes.',
        'A separate, permanent limitation AWS documents: "Backtracking is only available for DB clusters that were created with the Backtrack feature enabled. You can\'t modify a DB cluster to enable the Backtrack feature" after the fact — a cluster running in production without Backtrack enabled from creation cannot retroactively gain this capability; the only path is creating a new cluster (or restoring a snapshot) with Backtrack enabled from the start.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the block — backtrack attempt on a binlog-enabled cluster',
      language: 'bash',
      code: `# A cluster with Backtrack enabled (matching the main page's own
# "modify-db-cluster --backtrack-window 86400" example), which ALSO
# has binary logging enabled for downstream replication -- e.g. for
# a CDC pipeline reading MySQL binlogs into a data warehouse:
aws rds describe-db-clusters --db-cluster-identifier prod-aurora-mysql \\
  --query 'DBClusters[0].{Backtrack:BacktrackWindow,BinlogFormat:...}'
# (binary logging enabled via a custom parameter group, e.g.
# binlog_format=ROW, for downstream CDC replication)

# Attempting a normal backtrack, matching the main page's own
# example exactly:
aws rds backtrack-db-cluster \\
  --db-cluster-identifier prod-aurora-mysql \\
  --backtrack-to "2026-07-21T10:30:00Z"
# An error occurred (InvalidDBClusterStateFault): Cannot backtrack
# because binary logging is enabled on this cluster. Use --force to
# override, but be aware this can break downstream replication.
# -- exactly matching AWS's own documented behavior: the error is
# the SAFETY CHECK, not a bug -- it exists specifically because
# forcing past it has a real, documented consequence.`,
    },
    {
      label: 'What actually breaks when the safety check is forced past',
      language: 'bash',
      code: `# Forcing the backtrack anyway -- per AWS's own documentation, this
# IS possible, but the consequence is explicit and documented, not
# a surprise bug:
aws rds backtrack-db-cluster \\
  --db-cluster-identifier prod-aurora-mysql \\
  --backtrack-to "2026-07-21T10:30:00Z" \\
  --force

# The backtrack succeeds -- but per AWS's own stated consequence,
# any downstream read replicas relying on binlog replication from
# this cluster are now broken, because the backtrack rewound the
# PRIMARY's own binlog position to a point the replicas had already
# consumed PAST -- the replicas' own replication state no longer
# corresponds to reality on the primary:
aws rds describe-db-instances --db-instance-identifier prod-aurora-mysql-read-replica \\
  --query 'DBInstances[0].DBInstanceStatus'
# "replication-error" (or similar) -- the replica needs to be
# recreated from scratch; it cannot simply "catch back up."

# The same applies to an in-progress blue/green deployment relying
# on binlog-based replication between the blue and green
# environments -- per AWS's own documentation, forcing a backtrack
# "will... interfere with other operations such as blue/green
# deployments":
aws rds describe-blue-green-deployments \\
  --query "BlueGreenDeployments[?Source=='arn:aws:rds:eu-west-1:123:cluster:prod-aurora-mysql']"
# -- any active deployment referencing this cluster as its source
# should be treated as compromised after a forced backtrack, and
# re-created rather than trusted to resume correctly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An engineer needs to undo a bad DELETE statement on a production Aurora MySQL cluster and remembers the main page\'s own "Backtrack rewinds without restoring a snapshot" feature as the fast fix. They attempt a backtrack and hit an error about binary logging being enabled — the cluster also feeds a downstream analytics pipeline via binlog-based CDC replication. Under time pressure, they consider using --force to push the backtrack through immediately. Using this subtopic\'s theory, what would actually happen, and is that an acceptable tradeoff for fixing the bad DELETE quickly?',
    hint: 'AWS documents the exact, specific consequence of using --force here — is it a minor inconvenience, or does it require rebuilding something that can\'t just "catch up" on its own?',
    solution: 'Per this subtopic\'s theory, forcing the backtrack would fix the bad DELETE (the cluster genuinely rewinds to before the destructive statement), but per AWS\'s own documented consequence, it would also break the downstream CDC replication — the analytics pipeline\'s replica would need to be recreated from scratch, not simply reconnected or caught up, since its own replication state no longer corresponds to the primary\'s rewound binlog position. Whether this is an acceptable tradeoff depends entirely on how costly rebuilding that downstream replica actually is — for a small, quickly-rebuildable analytics replica, forcing the backtrack might genuinely be the fastest overall fix; for a large, expensive-to-rebuild CDC pipeline feeding a data warehouse other systems depend on, the "5-minute" backtrack could trigger a multi-hour (or longer) replica rebuild, making it the SLOWER overall fix despite feeling faster in the moment. Per this subtopic\'s theory, the engineer should at minimum confirm the actual rebuild cost of the downstream replica before forcing the backtrack, and consider the alternative AWS itself lists as the standard recovery mechanism instead — point-in-time recovery to a NEW cluster, verify the data, then redirect traffic — which does not touch the existing binlog-dependent replica at all, at the cost of being slower to execute than an in-place backtrack.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Aurora Backtrack, matching the main page\'s own "rewinds without restoring a snapshot" framing, is always a safe, low-risk operation that can be applied to any backtrack-enabled cluster without side effects.',
      reality: 'Per this subtopic\'s theory, AWS explicitly blocks backtracking on a cluster with binary logging enabled by default — bypassing that block with --force has a documented, real consequence: it breaks downstream read replicas and interferes with blue/green deployments relying on that binlog.'
    },
    {
      thought: 'If a forced backtrack breaks a downstream binlog-dependent replica, the replica can simply resume replicating once the backtrack completes.',
      reality: 'Per this subtopic\'s theory, the replica\'s own replication state no longer matches the primary\'s rewound binlog position after a forced backtrack — it cannot simply catch up; it needs to be recreated from scratch.'
    },
    {
      thought: 'The main page\'s own "database remains online" description of Backtrack means the operation has no impact on active connections or in-progress transactions.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states a backtrack causes "a brief DB instance disruption" where Aurora "pauses the database, closes any open connections, and drops any uncommitted reads and writes" — a real, if brief, disruption the main page\'s own framing undersells.'
    }
  ];
}
