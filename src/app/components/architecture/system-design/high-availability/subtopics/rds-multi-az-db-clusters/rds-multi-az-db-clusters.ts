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
  templateUrl: './rds-multi-az-db-clusters.html',
  styleUrl: './rds-multi-az-db-clusters.scss'
})
export class RdsMultiAzDbClustersFailOverInUnder35SecondsNotJust60120Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "60-120 seconds" figure is accurate — for one of two RDS Multi-AZ options',
      points: [
        'The main page\'s "Manual failover instead of automated" mistake fix cites "AWS RDS Multi-AZ: automatic failover in 60-120 seconds." Checking this against AWS\'s current documentation confirms it is accurate — but specifically for the older, more common "Multi-AZ DB instance" deployment. There is a second, faster option the page never mentions.',
        'This is a gap-closing addition, not a correction — the cited figure is genuinely correct for the deployment type it describes, so nothing on the main page needed to change.',
      ]
    },
    {
      heading: 'The faster option: Multi-AZ DB Cluster deployments',
      points: [
        'AWS introduced a second Multi-AZ deployment option, "Multi-AZ DB cluster," which uses two full, active-standby-capable read replica instances (rather than one passive standby "hot copy") alongside the primary. AWS\'s own documentation states failover for this deployment type completes in under 35 seconds — roughly 2-4x faster than the traditional Multi-AZ instance option\'s 60-120 seconds.',
        'The mechanism behind the speed difference: the standby instances in a Multi-AZ DB cluster are full database instances that can serve read traffic and are kept continuously ready to take over, rather than the traditional Multi-AZ instance deployment\'s standby, which exists purely for failover and needs to complete crash recovery before becoming the new primary.',
        'The tradeoff is cost and complexity: a Multi-AZ DB cluster deployment runs 3 full database instances (compared to a Multi-AZ instance deployment\'s 1 active + 1 passive), and the two standby instances can also serve read traffic — a capability the traditional Multi-AZ instance option does not offer at all (its standby is unreadable until it becomes primary).',
      ]
    },
    {
      heading: 'Which option to reach for, and when',
      points: [
        'The main page\'s cited 60-120 seconds remains the correct figure to use when discussing the DEFAULT, more common Multi-AZ instance deployment — most existing RDS deployments and most introductory system-design material describe this option.',
        'For a workload where the extra ~85 seconds of failover time is genuinely consequential (a payment or trading system\'s 99.99%+ SLA budget, where every additional second of failover eats directly into the annual downtime allowance), naming the Multi-AZ DB CLUSTER option specifically — and its ability to also serve read traffic from the standbys — is worth knowing as the more precise answer, rather than treating "RDS Multi-AZ" as a single, undifferentiated feature.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two RDS Multi-AZ options compared',
      language: 'bash',
      code: `# Multi-AZ DB INSTANCE (the traditional, more common option)
aws rds create-db-instance \\
  --db-instance-identifier mydb \\
  --multi-az \\
  --engine postgres
# Failover: ~60-120 seconds
# Standby: passive "hot copy" -- unreadable until it becomes primary
# Instance count: 1 active + 1 passive standby

# Multi-AZ DB CLUSTER (the newer, faster option)
aws rds create-db-cluster \\
  --db-cluster-identifier mydb-cluster \\
  --engine postgres \\
  --engine-mode provisioned
# Failover: typically under 35 seconds
# Standbys: 2 full instances, BOTH can serve read traffic
# Instance count: 1 writer + 2 readable standbys (3 total)

# Check current failover status:
aws rds describe-db-clusters --db-cluster-identifier mydb-cluster \\
  --query 'DBClusters[0].[Status,MultiAZ]'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A payment processing team needs the fastest RDS failover AWS offers, and also wants to offload some read-only reporting queries to a standby without impacting the primary. Would the traditional Multi-AZ DB instance deployment satisfy both requirements?',
    hint: 'Can a traditional Multi-AZ instance deployment\'s standby serve read traffic at all, regardless of failover speed?',
    solution: 'No — a traditional Multi-AZ DB instance deployment fails on the SECOND requirement even before considering speed: its standby is a passive "hot copy" that cannot serve any read traffic at all until it is promoted to primary during a failover. It also does not offer the fastest available failover (60-120 seconds). The correct choice is the Multi-AZ DB CLUSTER deployment option: it fails over in under 35 seconds AND both of its standby instances can serve read-only traffic continuously (not just after a failover) — satisfying both the failover-speed requirement and the read-offload requirement at once, something the traditional Multi-AZ instance deployment cannot do regardless of configuration.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"RDS Multi-AZ" is a single feature with one fixed failover time (60-120 seconds) regardless of how it is configured.',
      reality: 'Per this subtopic\'s theory, AWS offers two distinct Multi-AZ deployment options — the traditional Multi-AZ DB instance (60-120s failover) and the newer Multi-AZ DB cluster (under 35s failover) — with genuinely different underlying architectures, not just a tuning knob on the same feature.'
    },
    {
      thought: 'A Multi-AZ standby in RDS can always serve read-only queries to offload the primary, since it is a live, continuously-synced copy of the data.',
      reality: 'Per this subtopic\'s theory, this is true ONLY for the Multi-AZ DB CLUSTER deployment\'s standbys. The traditional Multi-AZ DB INSTANCE deployment\'s standby is a passive hot copy that cannot serve any read traffic until it is promoted during a failover.'
    },
    {
      thought: 'The faster Multi-AZ DB cluster option is strictly better, so there is no real reason to still use the traditional Multi-AZ instance deployment.',
      reality: 'Per this subtopic\'s theory, the DB cluster option runs 3 full instances versus the instance option\'s 1 active + 1 passive — a real cost and complexity tradeoff that makes the traditional option still the right default for workloads that do not specifically need the faster failover or the extra read capacity.'
    }
  ];
}
