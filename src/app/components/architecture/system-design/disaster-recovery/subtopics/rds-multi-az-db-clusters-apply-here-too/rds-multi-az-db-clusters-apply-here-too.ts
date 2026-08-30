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
  templateUrl: './rds-multi-az-db-clusters-apply-here-too.html',
  styleUrl: './rds-multi-az-db-clusters-apply-here-too.scss'
})
export class RdsMultiAzDbClustersApplyHereTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A figure this hub already verified once, showing up again here unchanged',
      points: [
        'The main page\'s Challenge solution describes the AZ-failure scenario as: "RDS Multi-AZ auto-promotes replica in 60-120s," landing on an overall "rto: 2 minutes (automatic)." This figure is accurate for the traditional Multi-AZ INSTANCE deployment — the same figure this hub\'s own High Availability Design topic already verified against AWS\'s documentation.',
        'That sibling subtopic also confirmed AWS offers a second, newer option — Multi-AZ DB CLUSTER deployments — with failover completing in under 35 seconds, roughly 2-4x faster than the traditional option this Challenge solution assumes. This is a gap-closing addition, not a correction: the Challenge\'s own 60-120s figure remains accurate for the deployment type it describes.',
      ]
    },
    {
      heading: 'Why this specifically matters for a fintech payments API\'s DR plan',
      points: [
        'The Challenge\'s own stated requirements are RTO < 5 minutes and 99.99% annual uptime for a PAYMENTS system — exactly the kind of workload where the sibling subtopic noted the extra ~85 seconds of the traditional Multi-AZ instance option\'s failover time is genuinely consequential to an annual downtime budget (99.99% only permits ~52 minutes/year total).',
        'Swapping in a Multi-AZ DB CLUSTER deployment for the AZ-failure scenario specifically would tighten that leg of the Challenge\'s own plan from "~2 minutes (automatic)" to well under 1 minute — meaningful headroom against the 5-minute RTO requirement, and against the annual 99.99% budget this exact incident type eats into every time it occurs.',
        'The DB CLUSTER option also has a second relevant property for a DR plan: unlike the traditional Multi-AZ instance\'s unreadable standby, its two standby instances can serve read traffic continuously — potentially useful for the same Challenge\'s "Regional failure" scenario\'s read-scaling needs during a partial-capacity DR posture.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Updating the AZ-failure leg of the DR plan',
      language: 'typescript',
      code: `interface DRPlan {
  scenario: string;
  detection: string;
  recovery: string;
  rto: string;
  rpo: string;
}

// BEFORE: assumes the traditional Multi-AZ instance deployment
const azFailoverBefore: DRPlan = {
  scenario: 'AZ failure (us-east-1a goes down)',
  detection: 'ALB health check removes unhealthy instances in 30s. RDS Multi-AZ auto-promotes replica in 60-120s.',
  recovery: 'Automatic -- no human intervention. ALB routes to us-east-1b instances. RDS promotes Multi-AZ standby.',
  rto: '2 minutes (automatic)',
  rpo: '0 -- RDS Multi-AZ uses synchronous replication within region',
};

// AFTER: using a Multi-AZ DB CLUSTER deployment instead
const azFailoverAfter: DRPlan = {
  scenario: 'AZ failure (us-east-1a goes down)',
  detection: 'ALB health check removes unhealthy instances in 30s. RDS Multi-AZ DB CLUSTER fails over in under 35s.',
  recovery: 'Automatic -- one of two readable standby instances is promoted, roughly 2-4x faster than the traditional Multi-AZ instance option.',
  rto: 'Well under 1 minute (automatic)',
  rpo: '0 -- still synchronous replication within region',
};
// For a 99.99% SLA (52 min/year budget), this specific incident
// type now costs meaningfully less of the annual downtime allowance.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A payments API\'s DR plan states an RTO of "2 minutes (automatic)" for AZ failures, based on the traditional RDS Multi-AZ instance deployment\'s 60-120 second failover. The team also needs their DR-region standby to serve read-only reporting queries without impacting the primary — a separate requirement not currently met. Would switching to Multi-AZ DB Cluster satisfy both needs?',
    hint: 'What does a Multi-AZ DB Cluster deployment\'s standby offer that a traditional Multi-AZ instance deployment\'s standby does not, beyond just failover speed?',
    solution: 'Yes. A Multi-AZ DB Cluster deployment satisfies both requirements at once: its failover completes in under 35 seconds (versus the traditional option\'s 60-120s), tightening the AZ-failure RTO well below the current 2-minute figure; AND its two standby instances can serve read-only traffic continuously (unlike the traditional Multi-AZ instance deployment\'s standby, which is unreadable until promoted) — directly addressing the read-only reporting requirement without needing a separate read replica. The tradeoff is running 3 full database instances instead of 1 active + 1 passive, a real cost increase worth weighing against the combined RTO and read-capacity benefit.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"RDS Multi-AZ" always means the same 60-120 second failover time, regardless of which specific deployment option is configured.',
      reality: 'Per this subtopic\'s theory (and this hub\'s own High Availability Design subtopic), AWS offers two distinct Multi-AZ options with genuinely different failover times — the traditional Multi-AZ instance deployment (60-120s) and the newer Multi-AZ DB Cluster deployment (under 35s).'
    },
    {
      thought: 'Since the Challenge\'s "2 minutes (automatic)" AZ-failover RTO already comfortably meets the stated "< 5 minutes" requirement, there is no reason to consider a faster option.',
      reality: 'Per this subtopic\'s theory, meeting a per-incident RTO requirement is different from minimizing how much of the ANNUAL uptime budget (99.99% = ~52 min/year) each incident consumes — a faster failover option is still worth adopting even when the current one technically satisfies the RTO target.'
    },
    {
      thought: 'Multi-AZ DB Cluster is purely a faster drop-in replacement for Multi-AZ instance deployments, with no other functional differences.',
      reality: 'Per this subtopic\'s theory, the DB Cluster option\'s standbys are also independently readable — a capability the traditional Multi-AZ instance deployment\'s unreadable standby does not offer at all, useful for read-scaling needs beyond just failover speed.'
    }
  ];
}
