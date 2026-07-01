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

@Component({
  selector: 'app-aws-rds-aurora',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rds-aurora.html',
  styleUrl: './rds-aurora.scss'
})
export class AwsRdsAurora {

  quickRef: QuickRefItem[] = [
    { name: 'RDS Multi-AZ', type: 'class', desc: 'Synchronous standby replica in another AZ — automatic failover in 60-120 s, no data loss (RPO=0).' },
    { name: 'Read Replica', type: 'class', desc: 'Asynchronous copy for read scale-out. Can be promoted to standalone DB. Cross-region replicas supported.' },
    { name: 'Aurora Cluster', type: 'class', desc: 'Shared storage volume across 6 copies in 3 AZs; writer + up to 15 reader endpoints on the same storage.' },
    { name: 'Aurora Serverless v2', type: 'class', desc: 'Scales ACUs (Aurora Capacity Units) instantly from 0.5 to 128 — pay per second, ideal for variable workloads.' },
    { name: 'Parameter Group', type: 'class', desc: 'Database engine configuration — max_connections, work_mem, log_min_duration_statement etc.' },
    { name: 'RDS Proxy', type: 'class', desc: 'Connection pooler between app and RDS/Aurora — reduces connection overhead, improves failover time.' },
    { name: 'Aurora Global Database', type: 'class', desc: 'Replication across up to 5 regions with <1 s lag. Secondary regions can be promoted in <1 min for DR.' },
    { name: 'Enhanced Monitoring', type: 'keyword', desc: 'OS-level metrics (CPU, memory, file system, I/O) at 1-60 s granularity via CloudWatch Logs.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'RDS Multi-AZ vs Read Replicas',
      points: [
        'Multi-AZ: synchronous replication to a standby in a different AZ — the standby is not accessible for reads. Purpose: high availability and failover (not performance). Failover is automatic in 60-120 s via DNS record update.',
        'Read Replicas: asynchronous replication, used for read scale-out. Replicas are accessible and serve SELECT queries. They can be promoted to standalone DBs (breaks replication). Cross-region read replicas supported for MySQL, PostgreSQL, MariaDB.',
        'For HA + read scale, combine both: Multi-AZ for the primary + read replicas for query offloading.',
        'RDS for PostgreSQL and MySQL can have up to 5 read replicas. Aurora supports up to 15 Aurora Replicas on the same shared storage volume.',
        'Replication lag on read replicas is typically milliseconds to seconds. Monitor ReplicaLag CloudWatch metric — high lag means stale reads.',
      ]
    },
    {
      heading: 'Amazon Aurora Architecture',
      points: [
        'Aurora uses a distributed storage layer: data is written synchronously to 6 copies across 3 AZs (quorum write: 4/6, quorum read: 3/6). Storage auto-grows in 10 GiB increments up to 128 TiB.',
        'Aurora is 5× faster than MySQL and 3× faster than PostgreSQL for the same workload — primarily due to the log-based storage design (redo log is the database).',
        'Cluster endpoints: writer endpoint (routes to primary), reader endpoint (round-robin across replicas), custom endpoints (subset of instances for analytical queries), instance endpoints (direct).',
        'Aurora failover: if the primary fails, a replica is promoted automatically in <30 s (vs 60-120 s for RDS Multi-AZ). Writer endpoint DNS is updated; applications reconnect without code changes.',
        'Aurora Backtrack: rewinds the cluster to any point in time within the backtrack window (up to 72 h) without restoring a snapshot — database remains online. Aurora MySQL only.',
      ]
    },
    {
      heading: 'Aurora Serverless v2',
      points: [
        'Aurora Serverless v2 scales in increments of 0.5 ACU (Aurora Capacity Unit) from a configurable minimum (0.5 ACU) to maximum (128 ACU). 1 ACU ≈ 2 GB RAM + proportional CPU.',
        'Scaling is near-instant (milliseconds) — unlike v1 which had a "scaling point" requirement and took seconds to minutes. v2 scales while processing queries.',
        'Minimum ACU can be set to 0 for pause-when-idle behavior (approximately 5 minutes of inactivity, ~$0/hour while paused). Cold start on resume adds ~25 s latency.',
        'v2 supports Multi-AZ, read replicas, Aurora Global Database, and RDS Proxy — all the production features lacking in v1.',
        'Cost model: billed per ACU-hour. Predictable workloads with constant high load are often cheaper with provisioned instances. Variable or dev/staging workloads benefit most from Serverless v2.',
      ]
    },
    {
      heading: 'Connectivity & Security',
      points: [
        'RDS instances are deployed in a VPC subnet group (multiple AZs). Access is controlled by VPC security groups — inbound port 3306 (MySQL), 5432 (PostgreSQL) only from app tier SG.',
        'RDS Proxy: sits between app and database, maintains a warm connection pool. Reduces connection establishment overhead for short-lived connections (Lambda→RDS). Improves failover speed — Proxy detects failover and reconnects without DNS TTL waiting.',
        'Encryption at rest: AWS KMS managed keys. Encryption in transit: SSL/TLS by default (enforce via parameter group rds.force_ssl=1 or pg_hba.conf). Encrypt the parameter group requirement.',
        'Secrets Manager rotation: RDS Proxy integrates natively — Secrets Manager rotates the password, Proxy uses it immediately without code changes or restarts.',
        'IAM database authentication: authenticates using an IAM token (15-min expiry) instead of a password — no password to manage, integrates with instance profiles. Supported for MySQL and PostgreSQL.',
      ]
    },
    {
      heading: 'Monitoring & Performance',
      points: [
        'CloudWatch metrics: CPUUtilization, DatabaseConnections, FreeStorageSpace, ReadIOPS/WriteIOPS, ReadLatency/WriteLatency, ReplicaLag.',
        'Enhanced Monitoring: OS-level metrics every 1-60 s via CloudWatch Logs (rdsosmetrics log group). Useful for identifying OS-level CPU steal or memory pressure not visible in DB-level metrics.',
        'Performance Insights: visualises database load by wait events, SQL statements, hosts, and users. 7-day free retention, 2-year paid. Instantly shows which queries are causing bottlenecks.',
        'RDS Events: subscribe to event categories (failover, backup, configuration change) via SNS — get notified when Multi-AZ failover occurs.',
        'Parameter groups are versioned — create a custom parameter group to change engine settings. Apply changes require DB restart for static parameters; dynamic parameters apply immediately.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'RDS Instance Setup',
      language: 'bash',
      code: `# Create a subnet group spanning 2 AZs
aws rds create-db-subnet-group \\
  --db-subnet-group-name prod-subnet-group \\
  --db-subnet-group-description "Production RDS subnets" \\
  --subnet-ids subnet-private-1a subnet-private-1b

# Create a Multi-AZ PostgreSQL instance
aws rds create-db-instance \\
  --db-instance-identifier prod-postgres \\
  --db-instance-class db.t3.medium \\
  --engine postgres \\
  --engine-version "15.4" \\
  --master-username admin \\
  --master-user-password "$(aws secretsmanager get-random-password --output text)" \\
  --allocated-storage 100 \\
  --storage-type gp3 \\
  --iops 3000 \\
  --multi-az \\
  --db-subnet-group-name prod-subnet-group \\
  --vpc-security-group-ids sg-rds-0abc123 \\
  --backup-retention-period 7 \\
  --preferred-backup-window "02:00-03:00" \\
  --preferred-maintenance-window "sun:04:00-sun:05:00" \\
  --enable-performance-insights \\
  --performance-insights-retention-period 7 \\
  --monitoring-interval 60 \\
  --monitoring-role-arn arn:aws:iam::123:role/rds-monitoring-role \\
  --storage-encrypted \\
  --no-publicly-accessible

# Create a Read Replica
aws rds create-db-instance-read-replica \\
  --db-instance-identifier prod-postgres-replica \\
  --source-db-instance-identifier prod-postgres \\
  --db-instance-class db.t3.medium \\
  --enable-performance-insights

# Initiate manual failover (tests Multi-AZ)
aws rds reboot-db-instance \\
  --db-instance-identifier prod-postgres \\
  --force-failover`,
    },
    {
      label: 'Aurora Cluster',
      language: 'bash',
      code: `# Create Aurora PostgreSQL cluster
aws rds create-db-cluster \\
  --db-cluster-identifier prod-aurora \\
  --engine aurora-postgresql \\
  --engine-version "15.4" \\
  --master-username admin \\
  --manage-master-user-password \\
  --db-subnet-group-name prod-subnet-group \\
  --vpc-security-group-ids sg-rds-0abc123 \\
  --backup-retention-period 7 \\
  --storage-encrypted \\
  --enable-cloudwatch-logs-exports '["postgresql"]'

# Add writer instance
aws rds create-db-instance \\
  --db-instance-identifier prod-aurora-writer \\
  --db-cluster-identifier prod-aurora \\
  --db-instance-class db.r6g.large \\
  --engine aurora-postgresql

# Add reader instance
aws rds create-db-instance \\
  --db-instance-identifier prod-aurora-reader-1 \\
  --db-cluster-identifier prod-aurora \\
  --db-instance-class db.r6g.large \\
  --engine aurora-postgresql

# Get cluster endpoints
aws rds describe-db-clusters \\
  --db-cluster-identifier prod-aurora \\
  --query 'DBClusters[0].{Writer:Endpoint,Reader:ReaderEndpoint}'

# Enable Backtrack (Aurora MySQL only)
aws rds modify-db-cluster \\
  --db-cluster-identifier prod-aurora-mysql \\
  --backtrack-window 86400  # 24 hours

# Backtrack to a specific time
aws rds backtrack-db-cluster \\
  --db-cluster-identifier prod-aurora-mysql \\
  --backtrack-to "2024-01-15T10:30:00Z"`,
    },
    {
      label: 'Aurora Serverless v2',
      language: 'bash',
      code: `# Create Aurora Serverless v2 cluster
aws rds create-db-cluster \\
  --db-cluster-identifier dev-aurora-serverless \\
  --engine aurora-postgresql \\
  --engine-version "15.4" \\
  --master-username admin \\
  --manage-master-user-password \\
  --db-subnet-group-name prod-subnet-group \\
  --vpc-security-group-ids sg-rds-0abc123 \\
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=8

# Add a Serverless v2 instance
aws rds create-db-instance \\
  --db-instance-identifier dev-aurora-serverless-instance \\
  --db-cluster-identifier dev-aurora-serverless \\
  --db-instance-class db.serverless \\
  --engine aurora-postgresql

# Scale min/max capacity (e.g. increase for peak traffic)
aws rds modify-db-cluster \\
  --db-cluster-identifier dev-aurora-serverless \\
  --serverless-v2-scaling-configuration MinCapacity=2,MaxCapacity=32

# Monitor ACU usage
aws cloudwatch get-metric-statistics \\
  --namespace AWS/RDS \\
  --metric-name ServerlessDatabaseCapacity \\
  --dimensions Name=DBClusterIdentifier,Value=dev-aurora-serverless \\
  --start-time 2024-01-01T00:00:00Z \\
  --end-time 2024-01-01T06:00:00Z \\
  --period 300 \\
  --statistics Average`,
    },
    {
      label: 'RDS Proxy & Secrets',
      language: 'bash',
      code: `# Store DB credentials in Secrets Manager
SECRET_ARN=$(aws secretsmanager create-secret \\
  --name /prod/rds/postgres \\
  --secret-string '{
    "username": "admin",
    "password": "CHANGE_ME",
    "host": "prod-postgres.abc.eu-west-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "appdb"
  }' \\
  --query 'ARN' --output text)

# Create RDS Proxy
aws rds create-db-proxy \\
  --db-proxy-name prod-proxy \\
  --engine-family POSTGRESQL \\
  --auth '[{
    "AuthScheme": "SECRETS",
    "SecretArn": "'$SECRET_ARN'",
    "IAMAuth": "REQUIRED"
  }]' \\
  --role-arn arn:aws:iam::123:role/rds-proxy-role \\
  --vpc-subnet-ids subnet-private-1a subnet-private-1b \\
  --vpc-security-group-ids sg-rds-0abc123

# Associate proxy with target DB instance
aws rds register-db-proxy-targets \\
  --db-proxy-name prod-proxy \\
  --db-instance-identifiers prod-postgres

# Connect via proxy (same PostgreSQL protocol)
# psql -h prod-proxy.proxy-abc.eu-west-1.rds.amazonaws.com -U admin -d appdb

# Enable Performance Insights on existing instance
aws rds modify-db-instance \\
  --db-instance-identifier prod-postgres \\
  --enable-performance-insights \\
  --performance-insights-retention-period 731 \\
  --apply-immediately`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Connecting to RDS from Lambda without RDS Proxy',
      wrong: `// Lambda creates a new DB connection on every invocation
// 1000 concurrent Lambdas = 1000 simultaneous DB connections
// PostgreSQL default max_connections = 100 (on db.t3.micro)
// Result: "too many connections" errors under load`,
      right: `// Use RDS Proxy between Lambda and RDS
// Proxy pools and reuses connections
// Lambda → Proxy (thousands of connections)
// Proxy → RDS (small pool of ~10 real connections)
const host = process.env.DB_PROXY_HOST; // proxy endpoint, not RDS endpoint`,
      explanation: 'Lambda scales to thousands of concurrent invocations, each creating a new database connection. RDS max_connections is limited (especially on smaller instance classes). RDS Proxy pools connections so Lambda can scale without exhausting the database connection limit.'
    },
    {
      title: 'Using RDS Multi-AZ for read scaling',
      wrong: `// Thinking the Multi-AZ standby handles read traffic
// Pointing read-heavy reporting queries to the "Multi-AZ replica"
// Error: the standby is not accessible — it only exists for failover`,
      right: `// Create READ REPLICAS for read scale-out
aws rds create-db-instance-read-replica \\
  --db-instance-identifier prod-postgres-replica \\
  --source-db-instance-identifier prod-postgres
// Multi-AZ standby = HA only. Read replicas = read traffic`,
      explanation: 'Multi-AZ standby is a hot standby for failover only — it is not accessible for read queries. To scale read traffic, create read replicas. For Aurora, use the reader endpoint which load-balances across Aurora Replicas on the same shared storage.'
    },
    {
      title: 'Not enabling storage autoscaling for RDS',
      wrong: `--allocated-storage 100
# No autoscaling configured
# DB fills to 100 GiB
# RDS storage full -> database stops accepting writes
# Emergency: manual storage modification + wait for resizing`,
      right: `--allocated-storage 100 \\
--max-allocated-storage 1000
# Storage automatically grows by 10% (or 5 GiB, whichever is larger)
# Triggers when free space < 10% or < 5 GiB for 5 minutes`,
      explanation: 'RDS storage cannot shrink — only grow. If storage fills, the database stops accepting writes. Enable storage autoscaling (--max-allocated-storage) so RDS automatically expands within the configured maximum when approaching full. Aurora handles storage automatically — it grows in 10 GiB increments without any configuration.'
    },
    {
      title: 'Hardcoding RDS endpoint instead of using the cluster endpoint',
      wrong: `// Hardcoded to writer instance endpoint
const DB_HOST = "prod-aurora-writer.abc.rds.amazonaws.com";
// Aurora failover promotes a reader to writer
// New writer has a different instance endpoint
// App is still pointing to the old writer -> connection failures`,
      right: `// Use the cluster writer endpoint — auto-updates on failover
const DB_HOST = "prod-aurora.cluster-abc.eu-west-1.rds.amazonaws.com";
// Aurora updates DNS of cluster endpoint to new writer in <30s`,
      explanation: 'Aurora instance endpoints are specific to one database instance. On failover, the promoted replica gets a new instance endpoint. The cluster writer endpoint (cluster-abc.eu-west-1.rds.amazonaws.com) always points to the current primary — use this in your applications.'
    },
    {
      title: 'Restoring from RDS snapshot to the same instance (overwrites data)',
      wrong: `# Trying to restore in-place to recover from corruption
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier prod-postgres \\  # same name!
  --db-snapshot-identifier rds:prod-postgres-2024-01-01
# Error: instance already exists — or worse: wrong expectation about overwrite`,
      right: `# Restore to a NEW instance, verify data, then rename/promote
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier prod-postgres-restored \\
  --db-snapshot-identifier rds:prod-postgres-2024-01-01
# Verify data, then update app connection string
# Rename old -> old-corrupted, restored -> prod-postgres`,
      explanation: 'RDS snapshot restore always creates a NEW DB instance — you cannot restore in-place over the existing one. Plan your recovery: restore to a new identifier, verify the data is correct, then update your application connection string or rename instances. Aurora Point-In-Time Recovery also creates a new cluster.'
    },
  ];

  challenge: Challenge = {
    title: 'Aurora Serverless v2 with RDS Proxy',
    language: 'typescript',
    description: `Write the AWS CLI commands to create an Aurora PostgreSQL Serverless v2 cluster (min 0.5 ACU, max 16 ACU) and configure an RDS Proxy in front of it using Secrets Manager for credentials. The proxy should require IAM authentication. Output the commands as strings.`,
    hints: [
      'Create the Aurora cluster first with --serverless-v2-scaling-configuration.',
      'Add a db.serverless instance to the cluster.',
      'Create a Secrets Manager secret with the DB credentials first.',
      'RDS Proxy engine-family for PostgreSQL is POSTGRESQL.',
      'Register the Aurora cluster (not the instance) as the proxy target with --db-cluster-identifiers.',
    ],
    starterCode: `const clusterCmd = \`aws rds create-db-cluster \\
  --db-cluster-identifier staging-aurora \\
  --engine aurora-postgresql \\
  --engine-version "15.4" \\
  --master-username admin \\
  --manage-master-user-password \\
  // TODO: serverless v2 scaling config (0.5 to 16 ACU)
  // TODO: subnet group and security group
\`;

const instanceCmd = \`aws rds create-db-instance \\
  // TODO: db.serverless instance in the cluster
\`;

const proxyCmd = \`aws rds create-db-proxy \\
  // TODO: POSTGRESQL proxy with Secrets Manager + IAM auth
\`;

console.log(clusterCmd, instanceCmd, proxyCmd);`,
    solution: `const SECRET_ARN = "arn:aws:secretsmanager:eu-west-1:123:secret:/staging/aurora/postgres";

const clusterCmd = \`
aws rds create-db-cluster \\
  --db-cluster-identifier staging-aurora \\
  --engine aurora-postgresql \\
  --engine-version "15.4" \\
  --master-username admin \\
  --manage-master-user-password \\
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=16 \\
  --db-subnet-group-name prod-subnet-group \\
  --vpc-security-group-ids sg-rds-0abc123 \\
  --storage-encrypted
\`;

const instanceCmd = \`
aws rds create-db-instance \\
  --db-instance-identifier staging-aurora-instance \\
  --db-cluster-identifier staging-aurora \\
  --db-instance-class db.serverless \\
  --engine aurora-postgresql
\`;

const proxyCmd = \`
aws rds create-db-proxy \\
  --db-proxy-name staging-proxy \\
  --engine-family POSTGRESQL \\
  --auth '[{
    "AuthScheme": "SECRETS",
    "SecretArn": "\${SECRET_ARN}",
    "IAMAuth": "REQUIRED"
  }]' \\
  --role-arn arn:aws:iam::123456789012:role/rds-proxy-role \\
  --vpc-subnet-ids subnet-private-1a subnet-private-1b \\
  --vpc-security-group-ids sg-rds-0abc123
\`;

const registerCmd = \`
aws rds register-db-proxy-targets \\
  --db-proxy-name staging-proxy \\
  --db-cluster-identifiers staging-aurora
\`;

console.log(clusterCmd, instanceCmd, proxyCmd, registerCmd);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between RDS Multi-AZ and a Read Replica?',
      options: [
        'Multi-AZ uses asynchronous replication; Read Replica uses synchronous replication',
        'Multi-AZ is for high availability with synchronous replication; Read Replica is for read scaling with asynchronous replication',
        'Both use synchronous replication but to different AZs',
        'Multi-AZ supports cross-region; Read Replica only supports single-region'
      ],
      answer: 1,
      explanation: 'Multi-AZ uses synchronous replication to a standby (RPO=0, automatic failover) — the standby is NOT accessible. Read Replicas use asynchronous replication and ARE accessible for read queries, enabling read scale-out. They serve different purposes: HA vs performance.'
    },
    {
      q: 'How many copies of data does Aurora maintain, and across how many AZs?',
      options: ['2 copies in 1 AZ', '3 copies in 2 AZs', '6 copies across 3 AZs', '4 copies across 2 AZs'],
      answer: 2,
      explanation: 'Aurora maintains 6 copies of data across 3 AZs (2 per AZ). Writes require 4/6 quorum; reads require 3/6 quorum. Aurora can tolerate losing 2 copies for writes and 3 copies for reads — significantly more durable than standard RDS Multi-AZ.'
    },
    {
      q: 'Why should you use RDS Proxy between Lambda and RDS?',
      options: [
        'Proxy provides stronger encryption than direct RDS connections',
        'Lambda cannot connect to RDS without a proxy',
        'Proxy pools connections so thousands of Lambda invocations share a small RDS connection pool',
        'Proxy reduces storage costs for RDS'
      ],
      answer: 2,
      explanation: 'Lambda can scale to thousands of concurrent invocations, each creating a new DB connection. Most RDS instance classes have a limited max_connections (e.g. 100-1000). RDS Proxy maintains a small warm pool of connections to RDS while allowing Lambda to scale freely.'
    },
    {
      q: 'Which Aurora endpoint should your application use to survive a primary instance failover?',
      options: [
        'Instance endpoint of the current writer',
        'Cluster writer endpoint (cluster-identifier.cluster-xxx.rds.amazonaws.com)',
        'Reader endpoint',
        'Any instance endpoint — they all update on failover'
      ],
      answer: 1,
      explanation: 'The cluster writer endpoint always points to the current primary. On failover, Aurora promotes a replica and updates the DNS of the cluster endpoint within ~30 seconds. Instance endpoints are specific to a single instance and do not update on failover.'
    },
    {
      q: 'What does Aurora Serverless v2 "minimum ACU of 0.5" enable?',
      options: [
        'The cluster shuts down completely when idle',
        'Scale-to-zero with a ~25s cold start on resume',
        'A near-zero cost floor while keeping the cluster warm; set min=0 for true pause',
        'Exactly 0.5 GB of memory is always allocated'
      ],
      answer: 2,
      explanation: 'Setting minimum ACU to 0.5 keeps the cluster warm at very low cost (~$0.06/hour) — no cold start penalty. To pause completely (scale to zero), set minimum ACU to 0 in the scaling configuration. Resuming from pause adds ~25 seconds of latency on the first connection.'
    },
    {
      q: 'What is the key architectural advantage of Aurora over standard RDS MySQL/PostgreSQL?',
      options: ['Aurora is simply a rebranded version of RDS with no technical differences', 'Aurora separates compute from a distributed, self-healing storage layer replicated across multiple AZs, enabling faster failover and higher throughput', 'Aurora only supports a single Availability Zone', 'Aurora requires manual replication configuration unlike RDS'],
      answer: 1,
      explanation: 'Aurora\'s storage layer is a distributed, log-structured system automatically replicated 6 ways across 3 Availability Zones, decoupled from the compute (database engine) layer — enabling much faster failover (typically under 30 seconds), higher throughput, and automatic storage healing, compared to standard RDS where storage is tied more directly to a single instance with traditional replication.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose Aurora over standard RDS?',
      a: 'Choose Aurora when: you need higher performance (5× MySQL, 3× PostgreSQL throughput), more than 5 read replicas (Aurora supports 15), faster failover (<30 s vs 60-120 s), Aurora Global Database for multi-region replication (<1 s lag), Aurora Serverless v2 for variable workloads, or Aurora Backtrack for point-in-time rewind without snapshot restore. Choose standard RDS when: you need Oracle or SQL Server (Aurora supports only MySQL-compatible and PostgreSQL-compatible), the cost difference matters on small workloads, or you want a simpler pricing model.'
    },
    {
      q: 'What is the difference between RDS point-in-time recovery and Aurora Backtrack?',
      a: 'RDS Point-In-Time Recovery restores to a NEW database instance using automated backups and transaction logs — the original instance is unaffected. This takes minutes to hours depending on database size. Aurora Backtrack rewinds the EXISTING cluster to a specified point in time (up to 72 hours, in seconds) — the cluster stays online during the rewind. Backtrack is faster but limited to Aurora MySQL. PITR is available for all RDS engines and Aurora, and has no time limit within the backup retention period.'
    },
    {
      q: 'How does Aurora Global Database work for disaster recovery?',
      a: 'An Aurora Global Database has one primary region (read/write) and up to 5 secondary regions (read-only). Replication uses a dedicated replication infrastructure — typically <1 s lag with no impact on the primary. In a DR scenario, a secondary region can be promoted to primary in under 1 minute. The RTO (Recovery Time Objective) is <1 min and RPO is <1 s. Applications in secondary regions can read locally for low-latency global reads. Managed failover (using the AWS console or CLI) updates the global cluster configuration and switches write traffic to the new primary region.'
    },
    {
      q: 'What is the impact of a database parameter group change requiring a restart?',
      a: 'Parameter groups have two types: static parameters (require DB restart, e.g. max_connections, shared_buffers) and dynamic parameters (apply without restart, e.g. log_min_duration_statement). Before making changes: identify whether the parameter is static or dynamic, plan a maintenance window, verify the change in a staging environment first. For Aurora, a cluster parameter group change can be applied to individual instances one at a time to avoid full-cluster downtime. Use the pending-reboot status to check which parameters are waiting for a restart.'
    },
    {
      q: 'A team creates a read replica of their Multi-AZ RDS instance and points half their read traffic at it. During a Multi-AZ automatic failover, does the read replica need any reconfiguration, or does it keep replicating from the new primary automatically?',
      a: 'The read replica keeps working without manual reconfiguration — RDS tracks replication from the Multi-AZ pair\'s DB instance identifier (the endpoint), not a specific physical instance, so when Multi-AZ fails over and the standby becomes the new primary, the read replica\'s asynchronous replication stream automatically reattaches to whichever instance is now serving as primary behind that same identifier. What DOES change during the failover window is replication lag: because the new primary just took over and the read replica has to catch up to its current state, application code reading from the replica may see a brief period of increased staleness immediately after a failover, on top of the replica\'s normal steady-state lag — worth accounting for in code that assumes replica reads are always near-real-time.',
    },
    {
      q: 'A Lambda function still hardcodes a DB password in an environment variable even after RDS Proxy is introduced between it and RDS. What security benefit of RDS Proxy is the team missing out on, and how would they fix it?',
      a: 'RDS Proxy supports IAM database authentication, where the Lambda\'s execution role — rather than a static password — is used to obtain short-lived authentication tokens for connecting through the proxy, meaning there is no long-lived database credential to leak, rotate manually, or accidentally commit to source control. Keeping a hardcoded password in an environment variable sidesteps this entirely: the team gets RDS Proxy\'s connection-pooling benefit but none of its credential-management benefit. The fix is granting the Lambda execution role rds-db:connect permission scoped to the specific proxy/database-user, configuring RDS Proxy\'s auth to require IAM authentication, and removing the static password from the function\'s environment variables and Secrets Manager entirely (or at minimum rotating it automatically via Secrets Manager rotation if IAM auth cannot be adopted immediately).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'RDS provides managed relational databases with Multi-AZ HA and read replicas; Aurora adds shared distributed storage, 15 replicas, <30 s failover, and Serverless v2 for variable workloads.',
    mustKnow: [
      'Multi-AZ: synchronous, standby not readable, automatic failover (60-120 s, RPO=0)',
      'Read Replica: asynchronous, readable, promotable — for read scale-out not HA',
      'Aurora: 6 copies in 3 AZs, 15 replicas, <30 s failover, cluster endpoint auto-updates',
      'Aurora Serverless v2: scales 0.5–128 ACU near-instantly, pay-per-second, full feature set',
      'RDS Proxy: connection pooling for Lambda, faster failover detection, IAM auth integration',
      'Always use cluster endpoint (not instance endpoint) in app connection strings',
      'Enable storage autoscaling (--max-allocated-storage) to prevent write outages on RDS',
    ],
    interviewFocus: [
      'Multi-AZ vs Read Replica — synchronous/HA vs asynchronous/read-scale',
      'Aurora shared storage architecture — why 6 copies, quorum reads and writes',
      'Aurora Serverless v2 ACU scaling model and when it beats provisioned',
      'RDS Proxy — why it\'s essential for Lambda→RDS connections',
      'Aurora Global Database — RTO <1 min, RPO <1 s for multi-region DR',
    ],
  };
}
