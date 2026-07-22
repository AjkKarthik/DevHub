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
  templateUrl: './switchover-guarantees-zero-data-loss-unplanned-failover-doesnt.html',
  styleUrl: './switchover-guarantees-zero-data-loss-unplanned-failover-doesnt.scss'
})
export class SwitchoverGuaranteesZeroDataLossUnplannedFailoverDoesntSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states one RTO/RPO figure for Aurora Global Database DR — as if there were only one failover mechanism',
      points: [
        'The main page\'s own QnA answer states: "In a DR scenario, a secondary region can be promoted to primary in under 1 minute. The RTO... is <1 min and RPO is <1 s." This is presented as a single, unconditional figure for "a DR scenario" in general.',
        'AWS\'s own documentation describes TWO distinct mechanisms for promoting a secondary region — with meaningfully different guarantees — and the main page\'s own single RPO figure only actually applies to one of them.',
      ]
    },
    {
      heading: 'Switchover guarantees zero data loss by waiting for sync first; unplanned failover does not wait, and can lose data',
      points: [
        'Per AWS\'s own documentation, "switchover" (formerly called "managed planned failover") is for controlled, healthy-cluster scenarios: "Before Aurora starts the switchover process, it waits for the target secondary Region clusters to be fully synchronized with the primary Region cluster... Because the target secondary cluster was synchronized with the primary at the beginning of the process, the new primary continues operations for the Aurora global database without losing any data." This is where the main page\'s own RPO<1s (effectively RPO=0) figure genuinely applies.',
        '"Failover" — AWS\'s own term specifically for recovering from a real, unplanned regional outage — works differently: "Managed failover doesn\'t wait for data to synchronize between the chosen secondary Region and the current primary Region... it\'s possible that not all transactions replicated to the chosen secondary AWS Region before it\'s promoted." AWS\'s own disaster-recovery planning page states this even more directly: "Both failover methods can result in a loss of write transaction data that wasn\'t replicated to the chosen secondary before the failover event occurred."',
        'AWS\'s own documentation also names a specific, real risk unique to unplanned failover that switchover\'s wait-for-sync design avoids entirely: "split-brain" — if the old primary region briefly becomes reachable again after failover has already promoted a new primary, both regions could theoretically accept writes simultaneously. AWS attempts "write fencing" to stop this, but explicitly calls it "a best-effort attempt" that isn\'t guaranteed to succeed, especially "in the unlikely event of multiple AZ failures in a Region."',
        'This means the main page\'s own "<1 min RTO, <1 s RPO" figure is the switchover/healthy-cluster number, not a guarantee for the actual disaster scenario ("a real Regional outage") its own QnA question is framed around — for genuinely unplanned failover, AWS\'s own guidance is that RPO is "typically a non-zero value measured in seconds," directly dependent on however much replication lag existed at the moment of the outage.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Switchover — zero data loss, but requires a healthy cluster',
      language: 'bash',
      code: `# Switchover (planned) -- AWS's own recommended use cases: regional
# rotation drills, follow-the-sun latency optimization, or failing
# back to the original primary after a real disaster is over.
# Requires BOTH regions to be healthy and running compatible engine
# versions -- this is NOT a disaster-recovery tool for an active
# outage.
aws rds --region eu-west-1 \\
  switchover-global-cluster \\
  --global-cluster-identifier prod-global-db \\
  --target-db-cluster-identifier arn:aws:rds:us-east-1:123456789012:cluster:prod-secondary

# Behind the scenes, per AWS's own documented behavior: Aurora
# WAITS for the target secondary to be fully synchronized before
# doing anything else -- only THEN does the old primary become
# read-only and the new primary get promoted. This wait is exactly
# why switchover can guarantee RPO=0 -- it never promotes a
# secondary that might be missing recent transactions.

# Check replication lag BEFORE switching -- higher lag = longer
# switchover time, since Aurora waits for it to close:
aws cloudwatch get-metric-statistics \\
  --namespace AWS/RDS \\
  --metric-name AuroraGlobalDBRPOLag \\
  --dimensions Name=DBClusterIdentifier,Value=prod-secondary \\
  --start-time 2026-07-21T00:00:00Z --end-time 2026-07-21T01:00:00Z \\
  --period 60 --statistics Maximum`,
    },
    {
      label: 'Unplanned failover — no wait, real data-loss and split-brain risk',
      language: 'bash',
      code: `# Unplanned failover -- for an ACTUAL regional outage where the
# primary is genuinely unreachable. Explicitly requires
# --allow-data-loss -- AWS makes the tradeoff impossible to invoke
# by accident:
aws rds --region us-east-1 \\
  failover-global-cluster \\
  --global-cluster-identifier prod-global-db \\
  --target-db-cluster-identifier arn:aws:rds:us-east-1:123456789012:cluster:prod-secondary \\
  --allow-data-loss

# AWS's own recommended precaution BEFORE calling this, specifically
# to reduce (not eliminate) split-brain risk: take applications
# offline first, so the old primary region genuinely stops
# receiving new writes rather than relying solely on AWS's own
# best-effort write fencing:
# 1. Stop application traffic to the old primary region.
# 2. THEN call failover-global-cluster with --allow-data-loss.
# 3. Reduce DNS TTL caching to pick up the global writer endpoint
#    change quickly once it happens.

# After the old primary region recovers, Aurora creates a recovery
# snapshot of what its storage looked like at the moment of failure
# -- this is how AWS lets you recover data that never made it to
# the promoted secondary before the outage:
aws rds describe-db-cluster-snapshots \\
  --query "DBClusterSnapshots[?starts_with(DBClusterSnapshotIdentifier, 'rds:unplanned-global-failover-')]"
# -- confirms the exact mechanism AWS's own docs describe for
# recovering unreplicated writes after a genuine unplanned failover
# -- something switchover never needs, because it never loses any
# data to begin with.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own stated "<1 min RTO, <1s RPO" figure, a DR runbook tells on-call engineers to simply call the Aurora Global Database failover API during ANY declared incident affecting the primary region, expecting near-zero data loss every time based on that number. During a real regional outage drill, the team is surprised to discover several recent write transactions are missing after the failover completes. Using this subtopic\'s theory, was the runbook\'s expectation reasonable, and what should it have said instead?',
    hint: 'The main page\'s own RPO figure — does it describe the mechanism that runs during a genuine, primary-region-down outage, or a different mechanism meant for healthy-cluster scenarios?',
    solution: 'Per this subtopic\'s theory, the runbook\'s expectation was not well-founded for this scenario — the main page\'s own "<1s RPO" figure describes switchover, which is specifically designed for controlled, HEALTHY-cluster scenarios and works by waiting for full synchronization before promoting the secondary. A real regional outage, where the primary is genuinely unreachable, requires unplanned failover instead — a mechanism AWS\'s own documentation explicitly states "doesn\'t wait for data to synchronize" and can result in "a loss of write transaction data that wasn\'t replicated to the chosen secondary before the failover event occurred." The missing transactions the team observed during the drill are exactly the expected behavior for unplanned failover, not a malfunction — AWS\'s own API even requires an explicit --allow-data-loss flag specifically because this tradeoff is expected and deliberate. The runbook should distinguish the two scenarios clearly: for planned maintenance or regional rotation where both regions are healthy, use switchover and expect genuinely zero data loss; for an actual declared regional outage, use unplanned failover, expect some recent writes to be missing (recoverable afterward from the automatic recovery snapshot AWS creates of the old primary\'s storage), and take applications offline first to reduce (not eliminate) the risk of split-brain writes during the transition.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Aurora Global Database provides a single, unified failover mechanism with one consistent RTO/RPO guarantee, matching the main page\'s own "<1 min RTO, <1s RPO" figure for any DR scenario.',
      reality: 'Per this subtopic\'s theory, AWS documents two genuinely different mechanisms — switchover (RPO=0, waits for sync, healthy-cluster only) and unplanned failover (RPO typically non-zero, doesn\'t wait, for genuine outages) — and the main page\'s own figure only describes the first one.'
    },
    {
      thought: 'Since Aurora automatically creates a recovery snapshot of the old primary region after an unplanned failover, any data lost during the failover is automatically recovered without further action.',
      reality: 'Per this subtopic\'s theory, the snapshot only makes recovery of the missing data POSSIBLE — restoring and merging that data back into the new primary is a separate, manual operational task, not something Aurora does automatically as part of the failover itself.'
    },
    {
      thought: 'AWS\'s own "write fencing" during an unplanned failover reliably guarantees the old primary region can never accept another write once failover begins, eliminating split-brain risk.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation explicitly calls write fencing "a best-effort attempt" that is not guaranteed to succeed, especially during multi-AZ failures — which is exactly why AWS separately recommends taking applications offline before initiating an unplanned failover, as an additional safeguard.'
    }
  ];
}
