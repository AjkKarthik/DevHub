import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'RTO',           type: 'keyword', desc: 'Recovery Time Objective — max acceptable downtime. How long until system is back online.' },
  { name: 'RPO',           type: 'keyword', desc: 'Recovery Point Objective — max acceptable data loss. How old the backup can be.' },
  { name: 'Cold standby',  type: 'keyword', desc: 'Backup infra is off. Turn on during disaster. RTO: hours. Cheapest option.' },
  { name: 'Pilot light',   type: 'keyword', desc: 'Core data systems running; app layer off. RTO: 10-30 min. Moderate cost.' },
  { name: 'Warm standby',  type: 'keyword', desc: 'Scaled-down live copy running continuously. RTO: minutes. Higher cost.' },
  { name: 'Active-active', type: 'keyword', desc: 'Full multi-region, both regions live. RTO: near-zero. Highest cost and complexity.' },
  { name: 'PITR',          type: 'keyword', desc: 'Point-in-Time Recovery — restore DB to any moment using WAL + base backup.' },
  { name: 'Runbook',       type: 'keyword', desc: 'Step-by-step recovery procedure. Must be tested regularly — untested runbooks fail.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'RTO and RPO — the two axes of DR',
    points: [
      'RPO (data loss): how much data can you afford to lose? RPO=0 → synchronous replication; RPO=1h → hourly snapshots.',
      'RTO (downtime): how fast must you recover? RTO=1h → cold standby ok; RTO=5min → warm standby or active-active.',
      'Lowering either metric increases cost significantly. Plot your budget against each.',
      'Example: financial trading → RPO=0, RTO=30s. Blog → RPO=24h, RTO=4h.',
    ],
  },
  {
    heading: 'DR strategies (cheapest to most expensive)',
    points: [
      'Cold standby: backups stored in S3; infra off. Disaster → provision infra → restore DB → RTO ~hours.',
      'Pilot light: DB replica running + replicated data; app servers off. Disaster → scale up app layer → RTO ~15min.',
      'Warm standby: full system running at reduced capacity. Disaster → scale up + switch DNS → RTO ~5min.',
      'Active-active (multi-region): both regions live, traffic split. Disaster → route all traffic to healthy region → RTO ~seconds.',
    ],
  },
  {
    heading: 'Database recovery',
    points: [
      'PITR (Point-in-Time Recovery): base snapshot + WAL log → restore to any moment between snapshots.',
      'Cross-region replica: async replication to second region; promote on disaster (RPO = replication lag).',
      'Automated snapshots: RDS, Cloud SQL, and Aurora snapshot every 5 min. Restore to any 5-min window.',
      'Always test restore: take a backup, restore it, verify data integrity. Untested backups fail when needed.',
    ],
  },
  {
    heading: 'DR planning and testing',
    points: [
      'Chaos engineering: intentionally terminate instances, cut network links, corrupt data in staging.',
      'Game day: scheduled full DR drill — declare disaster, follow runbook, measure actual RTO/RPO.',
      'Runbooks: automated where possible (Terraform + Ansible). Manual runbooks rot — automate first.',
      'Monitoring: alert on cross-region replication lag > RPO threshold before disaster strikes.',
    ],
  },
  {
    heading: 'RTO and RPO as Design Constraints',
    points: [
      'Recovery Time Objective (RTO) defines the maximum acceptable downtime after a disaster — a 5-minute RTO requires automated failover, while a 24-hour RTO may tolerate a manual recovery process, and this single number drives enormous architectural cost differences.',
      'Recovery Point Objective (RPO) defines the maximum acceptable data loss, measured in time — an RPO of zero requires synchronous replication (every write confirmed in two locations before acknowledging the client), while an RPO of 1 hour tolerates asynchronous replication with periodic snapshots.',
      'RTO and RPO should be set deliberately per system based on actual business impact, not defaulted to "as low as possible" — the cost of near-zero RTO/RPO (multi-region synchronous replication, active-active infrastructure) is substantial and only justified for genuinely critical systems.',
      'Regular disaster recovery drills (actually failing over to the backup region, not just reviewing the runbook on paper) are what separates a DR plan that works from one that looks good in documentation but fails when genuinely needed — untested recovery procedures routinely fail in real incidents.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'DR Strategy Comparison',
    language: 'typescript',
    code: `// DR strategy matrix — choose based on RTO/RPO requirements and budget

interface DRStrategy {
  name: string;
  rto: string;
  rpo: string;
  costMultiplier: string;
  howItWorks: string;
  bestFor: string;
}

const strategies: DRStrategy[] = [
  {
    name: 'Cold Standby (Backup & Restore)',
    rto: '2–8 hours',
    rpo: '1–24 hours',
    costMultiplier: '1× (base)',
    howItWorks: 'Daily DB snapshots to S3 cross-region. On disaster: Terraform provisions infra, restores DB from latest snapshot.',
    bestFor: 'Internal tools, dev environments, RPO tolerance > 1 hour',
  },
  {
    name: 'Pilot Light',
    rto: '10–30 minutes',
    rpo: '< 1 hour',
    costMultiplier: '1.5×',
    howItWorks: 'DB replica in DR region running and synced. App servers off. On disaster: scale up app fleet, update DNS.',
    bestFor: 'SaaS products where 20-min outage is acceptable',
  },
  {
    name: 'Warm Standby',
    rto: '2–10 minutes',
    rpo: '< 5 minutes',
    costMultiplier: '2–3×',
    howItWorks: 'Full-stack running at 20% capacity in DR region. DB replication lag < 5 min. On disaster: Route53 failover + auto-scale.',
    bestFor: 'E-commerce, SaaS with 99.9%+ SLA',
  },
  {
    name: 'Active-Active (Multi-Region)',
    rto: '< 30 seconds',
    rpo: '0 (sync replication) or < 1 min (async)',
    costMultiplier: '3–5×',
    howItWorks: 'Full traffic split across both regions. Geo-routing sends each user to nearest region. Failover = DNS weight change.',
    bestFor: 'Financial services, global consumer apps, 99.99%+ SLA',
  },
];`,
  },
  {
    label: 'AWS Route53 Failover',
    language: 'bash',
    code: `# Route53 health-check-based failover
# Primary: us-east-1  |  Secondary (DR): eu-west-1

# 1. Create health check on primary
aws route53 create-health-check --caller-reference "primary-hc-2024" \\
  --health-check-config '{
    "Type": "HTTPS",
    "FullyQualifiedDomainName": "api-us.example.com",
    "Port": 443,
    "ResourcePath": "/health",
    "RequestInterval": 10,
    "FailureThreshold": 3
  }'

# 2. Primary DNS record (failover routing — PRIMARY)
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.example.com",
      "Type": "A",
      "Failover": "PRIMARY",
      "HealthCheckId": "hc-id-here",
      "AliasTarget": { "DNSName": "alb-us.us-east-1.elb.amazonaws.com", ... }
    }
  }]
}'

# 3. Secondary DNS record (failover routing — SECONDARY)
# Route53 sends traffic here ONLY when primary health check fails
# (No HealthCheckId on secondary — it is always healthy by definition)
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.example.com",
      "Failover": "SECONDARY",
      "AliasTarget": { "DNSName": "alb-eu.eu-west-1.elb.amazonaws.com", ... }
    }
  }]
}'

# Failover time: 3 failed checks × 10s = 30s to trigger + DNS TTL (set to 60s)
# Total: ~90s automatic failover with zero human intervention`,
  },
  {
    label: 'Database PITR',
    language: 'bash',
    code: `# PostgreSQL Point-in-Time Recovery (PITR)

# 1. Configure WAL archiving on primary
# postgresql.conf:
# archive_mode = on
# archive_command = 'aws s3 cp %p s3://my-wal-archive/%f'
# wal_level = replica

# 2. Take base backup (daily via cron)
pg_basebackup -h localhost -U postgres \\
  -D /var/lib/postgresql/backup/$(date +%Y%m%d) \\
  -Ft -z -Xs

# Upload to S3 cross-region:
aws s3 sync /var/lib/postgresql/backup/ \\
  s3://my-db-backups-eu-west-1/ --storage-class STANDARD_IA

# 3. Restore to a specific point in time (e.g., before accidental DELETE)
# Copy base backup + WAL files to new server:
aws s3 sync s3://my-db-backups-eu-west-1/20240115/ /var/lib/postgresql/data/
aws s3 sync s3://my-wal-archive/ /var/lib/postgresql/wal-archive/

# recovery.conf (PostgreSQL < 12) or postgresql.conf (12+):
# restore_command = 'cp /var/lib/postgresql/wal-archive/%f %p'
# recovery_target_time = '2024-01-15 14:30:00 UTC'  ← point in time
# recovery_target_action = 'promote'

pg_ctl start -D /var/lib/postgresql/data/
# PostgreSQL replays WAL up to 14:30 UTC, then promotes to primary`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Never testing the DR runbook',
    wrong: `# Runbook written 18 months ago, never tested
# Disaster strikes at 2am
# Step 3: "restore from S3 backup"
# → S3 bucket was deleted 6 months ago in cleanup
# → DB restore fails; RTO: 8 hours instead of 1`,
    right: `# Run DR drill quarterly:
# 1. Declare simulated disaster in staging
# 2. Follow runbook step-by-step, timing each step
# 3. Measure actual RTO and RPO
# 4. Fix gaps found, update runbook, re-test
# DR runbook that has never been tested will fail`,
    explanation: 'An untested DR plan is a false sense of security. Runbooks rot — S3 buckets get deleted, IAM roles change, Terraform state drifts. Quarterly game days reveal failures before a real disaster does.',
  },
  {
    title: 'Backups in the same region as primary',
    wrong: `# Backups in us-east-1 same as primary
# AWS us-east-1 has a major outage (it happens)
# → primary down, backups also inaccessible
# → no recovery possible from same region`,
    right: `# Cross-region backup replication:
aws s3api put-bucket-replication --bucket primary-backups \\
  --replication-configuration '{
    "Role": "arn:aws:iam::...replication-role",
    "Rules": [{"Destination": {"Bucket": "arn:aws:s3:::backups-eu-west-1"}}]
  }'
# Backups in eu-west-1 survive us-east-1 region failure`,
    explanation: 'A regional disaster (power, networking, hardware) takes down everything in that region — including your backups if they are co-located. Always replicate backups to a different region.',
  },
  {
    title: 'Setting RPO=0 without synchronous replication',
    wrong: `# SLA promises RPO=0 (no data loss)
# But cross-region replication is asynchronous
# Replication lag: 2-5 seconds
# Primary fails → replica promoted → last 5 seconds of writes lost
# RPO=5s, not RPO=0`,
    right: `# RPO=0 requires synchronous replication:
# PostgreSQL: synchronous_standby_names = 'replica-eu'
# MySQL: semi-sync or Group Replication with sync mode
# AWS Aurora Global: RPO typically < 1s (async) — state this accurately in SLA`,
    explanation: 'RPO=0 is only achievable with synchronous replication — the primary waits for the replica to acknowledge before committing. Async replication always has non-zero RPO equal to the replication lag.',
  },
  {
    title: 'No automated failover — manual DNS change',
    wrong: `# Disaster at 2am
# On-call engineer wakes up
# Diagnoses primary failure: 15 min
# Updates DNS manually: 5 min
# DNS propagates (TTL=3600s): 60 min
# Total actual RTO: 80 minutes`,
    right: `# Automated failover with low DNS TTL:
# Route53 health check: detects failure in 30s
# DNS TTL: 60s (set in advance, not during disaster)
# Automatic failover: 90s total
# Set DNS TTL to 60s always — not just during disasters`,
    explanation: 'High DNS TTL (3600s = 1 hour) makes DNS-based failover useless. Set TTL to 60s in normal operation. Route53 health checks enable fully automatic failover without waking anyone at 2am.',
  },
];

const challenge: Challenge = {
  title: 'Design a DR plan for a fintech payments API',
  language: 'typescript',
  description: `Design a disaster recovery plan for a payment processing API.

Requirements:
- RPO: < 1 minute (cannot lose more than 60 seconds of transactions)
- RTO: < 5 minutes (must be processing payments within 5 min of disaster)
- 99.99% annual uptime SLA
- Must handle: AZ failure, regional failure, accidental data deletion

Current setup:
- PostgreSQL primary in us-east-1a
- Application servers in us-east-1 only
- Daily backups to S3 (us-east-1)

For each failure scenario:
1. AZ failure
2. Regional failure
3. Accidental DELETE on payments table`,
  hints: [
    'RPO<1min → async cross-region replication with lag monitoring',
    'RTO<5min → warm standby (pre-provisioned in DR region)',
    'AZ failure → Multi-AZ deployment covers this automatically',
    'Accidental DELETE → PITR + table-level backup before destructive operations',
  ],
  starterCode: `interface DRPlan {
  scenario: string;
  detection: string;
  recovery: string;
  rto: string;
  rpo: string;
}

const plan: DRPlan[] = [];`,
  solution: `const plan: DRPlan[] = [
  {
    scenario: 'AZ failure (us-east-1a goes down)',
    detection: 'ALB health check removes unhealthy instances in 30s. RDS Multi-AZ auto-promotes replica in 60-120s.',
    recovery: 'Automatic — no human intervention. ALB routes to us-east-1b instances. RDS promotes Multi-AZ standby.',
    rto: '2 minutes (automatic)',
    rpo: '0 — RDS Multi-AZ uses synchronous replication within region',
  },
  {
    scenario: 'Regional failure (us-east-1 entirely unavailable)',
    recovery: 'Route53 health check detects primary failure (30s). DNS TTL=60s → traffic routes to eu-west-1 warm standby in 90s. RDS read replica in eu-west-1 promoted to primary (2 min). App layer pre-provisioned at 25% capacity — auto-scale to full.',
    detection: 'Route53 health check: 3 × 10s = 30s to detect',
    rto: '~4 minutes total',
    rpo: '< 1 minute (async cross-region replication lag; monitor alert if lag > 30s)',
  },
  {
    scenario: 'Accidental DELETE on payments table',
    detection: 'Monitoring alert: payments table row count drops > 50% in 60s → page on-call.',
    recovery: 'PITR: restore DB to 30 seconds before the DELETE. RDS PITR supports any 5-min window. For payments: restore to separate instance, extract deleted rows, replay into production. Prevent: pre-prod IAM denies DELETE on payments without MFA + approval workflow.',
    rto: '30–60 minutes (PITR restore + data validation)',
    rpo: '< 30 seconds (PITR granularity)',
  },
];

// Additional measures:
// - Cross-region S3 replication for backups
// - Monthly DR game day — follow runbook, measure actual RTO/RPO
// - Replication lag alarm: CloudWatch metric > 45s → page on-call (before RPO breach)
// - DNS TTL: 60s always (not set during disaster — too late)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'RPO of 1 hour means?',
    options: [
      'System must be back online within 1 hour',
      'The system can lose at most 1 hour of data',
      'Backups are taken every hour',
      'Recovery takes 1 hour',
    ],
    answer: 1,
    explanation: 'RPO (Recovery Point Objective) is the maximum acceptable data loss measured in time. RPO=1h means you can restore to data from up to 1 hour ago — you may lose up to 60 minutes of changes. RTO is the recovery time.',
  },
  {
    q: 'Which DR strategy provides near-zero RTO?',
    options: [
      'Cold standby',
      'Pilot light',
      'Warm standby',
      'Active-active multi-region',
    ],
    answer: 3,
    explanation: 'Active-active has both regions serving live traffic. Disaster = route all traffic to healthy region. RTO is seconds (DNS TTL). The other strategies require provisioning or scaling up infrastructure, taking minutes to hours.',
  },
  {
    q: 'PITR (Point-in-Time Recovery) requires?',
    options: [
      'Full DB backups every minute',
      'A base snapshot plus continuous WAL/binlog archiving',
      'Read replicas in every region',
      'Application-level event sourcing',
    ],
    answer: 1,
    explanation: 'PITR works by replaying WAL (Write-Ahead Log) entries on top of a base snapshot. You restore the base snapshot, then replay WAL up to the desired moment. Without continuous WAL archiving, you can only restore to snapshot times.',
  },
  { q: 'What is the difference between RPO and RTO in disaster recovery?', options: ['RPO measures response time; RTO measures recovery time', 'RPO is the maximum acceptable data loss measured in time; RTO is the maximum acceptable downtime before the system is restored', 'RPO applies to databases only; RTO applies to application servers', 'A lower RPO always requires a higher RTO'], answer: 1, explanation: 'RPO (Recovery Point Objective) defines how much data loss is acceptable: an RPO of 1 hour means you can lose up to 1 hour of data. Achieving low RPO requires frequent backups or synchronous replication. RTO (Recovery Time Objective) defines how long the system can be down before recovery must be complete: an RTO of 15 minutes means the system must be restored within 15 minutes of a failure. Achieving low RTO requires pre-provisioned standby infrastructure and fast failover automation. Lower RPO and RTO both increase cost.' },
  { q: 'What is the difference between active-passive and active-active disaster recovery configurations?', options: ['Active-passive is for databases only; active-active is for stateless services', 'Active-passive has a standby that takes over on failure; active-active runs both sites simultaneously sharing traffic', 'Active-active is less expensive than active-passive', 'Active-passive requires synchronous replication; active-active uses only async replication'], answer: 1, explanation: 'Active-passive: one primary site handles all traffic; a standby site replicates data but receives no traffic. On failure, traffic fails over to the standby. Simple to operate but the standby costs money without handling traffic, and failover takes minutes. Active-active: both sites handle traffic simultaneously. On failure of one site, the other absorbs all traffic automatically with near-zero RTO. More complex due to distributed state management and conflict resolution for writes hitting both sites. Active-active has zero wasted standby capacity but requires careful handling of global state.' },
  { q: 'What is a tabletop exercise in the context of disaster recovery?', options: ['A small-scale DR test run on a development server', 'A discussion-based simulation where the DR team walks through a disaster scenario to identify gaps without actually failing over systems', 'An automated test that randomly terminates production services to test resilience', 'A scheduled maintenance window for updating DR documentation'], answer: 1, explanation: 'A tabletop exercise is a meeting where the DR team walks through a simulated failure scenario step by step, discussing who would do what, who would communicate to whom, and what decisions would be made at each stage. It reveals gaps in runbooks, unclear ownership, and missing contact information without the risk of affecting production. Tabletop exercises should be followed by actual failover drills to test both the plan and the technical recovery mechanisms under realistic conditions.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do I choose between warm standby and active-active?',
    a: 'Cost and complexity vs RTO. Warm standby costs 2-3× base and achieves RTO of 2-10 minutes — good for 99.9% SLA. Active-active costs 3-5× and achieves near-zero RTO — required for 99.99%+ or financial/safety-critical systems. Active-active requires solving distributed state problems (multi-region DB writes, conflict resolution). For most SaaS products, warm standby is the right choice.',
  },
  {
    q: 'What should every DR runbook include?',
    a: 'A DR runbook must include: (1) Detection — how do you know a disaster occurred? (2) Decision criteria — at what threshold do you declare disaster and invoke DR? (3) Step-by-step recovery commands — automated scripts preferred. (4) Verification steps — how to confirm the DR environment is healthy before switching. (5) Communication — who to notify, what to say to customers. (6) Rollback — how to revert if DR environment has issues. Test it quarterly.',
  },
  { q: 'What is the difference between backup and replication in disaster recovery?', a: 'Backup creates point-in-time copies of data stored separately from the primary system, typically at intervals from minutes to daily. Backups protect against data corruption, accidental deletion, and ransomware because they provide historical snapshots you can restore from. Recovery from backup takes time proportional to backup age and data size. Replication continuously mirrors data to a secondary system with near-zero lag (synchronous) or slight lag (asynchronous). Replication protects against hardware failure and data center outages but does not protect against logical corruption because errors replicate immediately to the replica. A complete DR strategy needs both: replication for fast failover and backups for logical recovery.' },
  { q: 'How do you test a disaster recovery plan effectively?', a: 'DR testing levels: (1) Tabletop exercise: team discusses responses to a simulated scenario without touching production. Identifies runbook gaps. (2) Component test: restore a single service or database from backup in a test environment. Verifies backup integrity and restore procedures. (3) Partial failover: fail over a subset of services or a secondary region while primary remains live. Tests failover automation and monitoring. (4) Full failover: shift all traffic to the DR region and run there for a defined period. The highest confidence test but also highest risk. Run full failovers during low-traffic periods with all teams on standby. Document RTO and RPO achieved in each test versus targets and close gaps found.' },
  { q: 'How does chaos engineering relate to disaster recovery?', a: 'Chaos engineering proactively injects failures into production to discover weaknesses before real incidents cause them. Netflix Chaos Monkey randomly terminates EC2 instances during business hours, forcing engineers to build and verify resilience. AWS Fault Injection Simulator lets you run controlled experiments like simulating AZ failures or network latency spikes. Chaos engineering differs from DR testing: DR tests validate known failure scenarios and recovery procedures. Chaos engineering discovers unknown failure modes by combining failures in unexpected ways. Running both builds confidence: DR testing confirms you can recover from planned failure scenarios, and chaos engineering surfaces resilience gaps that DR plans did not anticipate.' },
  { q: 'What is a multi-region active-active architecture and what are its data consistency challenges?', a: 'In multi-region active-active, users in each region are served by local infrastructure and writes go to local databases. Replication synchronizes data between regions asynchronously. Challenges: write conflicts occur when users in different regions modify the same record simultaneously. Solutions: optimistic concurrency control with last-write-wins using timestamps, or application-level conflict resolution logic. Routing strategy: use latency-based routing to send users to their closest region, but ensure a user session always routes to the same region to avoid reading stale data from another region. Consider using a globally distributed database like CockroachDB, Spanner, or DynamoDB Global Tables that handles conflict resolution internally.' },
];

const revision: RevisionSummary = {
  oneLiner: 'RTO=downtime tolerance, RPO=data loss tolerance. Cold/pilot/warm/active-active balance cost vs recovery speed. Always test runbooks quarterly.',
  mustKnow: [
    'RTO: how fast to recover; RPO: how much data loss is acceptable',
    'Cold standby: cheapest, RTO hours; Pilot light: RTO 15-30min',
    'Warm standby: RTO ~5min at 2-3× cost; Active-active: near-zero RTO',
    'RPO=0 requires synchronous replication — async has non-zero RPO',
    'PITR: base snapshot + WAL archiving → restore to any point in time',
    'Untested DR runbooks fail — drill quarterly (game day)',
  ],
  interviewFocus: [
    'Define RTO and RPO with concrete examples (fintech vs blog)',
    'Map each DR strategy to its RTO range and cost multiplier',
    'Explain PITR: what it needs and how it works',
    'Why cross-region backup replication is mandatory',
  ],
};

@Component({
  selector: 'app-sysdesign-disaster-recovery',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './disaster-recovery.html',
  styleUrl: './disaster-recovery.scss',
})
export class SysdesignDisasterRecovery {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
