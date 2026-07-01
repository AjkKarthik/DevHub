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
  selector: 'app-azure-sql-cosmos',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sql-cosmos.html',
  styleUrl: './sql-cosmos.scss'
})
export class AzureSqlCosmos {

  quickRef: QuickRefItem[] = [
    { name: 'Azure SQL Database', type: 'type', desc: 'Fully managed PaaS SQL Server. Three purchasing models: DTU-based, vCore-based, and Serverless (auto-pause after inactivity). Built-in HA, backups, and geo-replication.' },
    { name: 'Elastic Pool', type: 'type', desc: 'Shared compute/storage pool for multiple Azure SQL databases. Databases share resources, reducing cost for variable workloads with non-overlapping peaks.' },
    { name: 'Serverless', type: 'type', desc: 'Azure SQL serverless tier: auto-scales compute within min/max vCore range and auto-pauses after inactivity (billing stops for compute). Latency on resume ~1 min.' },
    { name: 'Cosmos DB', type: 'type', desc: 'Globally distributed, multi-model NoSQL database. APIs: Core (SQL), MongoDB, Cassandra, Gremlin (graph), Table. 5 consistency levels. 99.999% multi-region availability.' },
    { name: 'Consistency Level', type: 'type', desc: 'Cosmos DB trade-off between consistency and latency: Strong → Bounded Staleness → Session (default) → Consistent Prefix → Eventual.' },
    { name: 'RU/s', type: 'type', desc: 'Request Unit per second — Cosmos DB throughput unit. A 1-KB point read costs 1 RU. Provisioned (manual/autoscale) or Serverless (pay per request).' },
    { name: 'Active Geo-Replication', type: 'type', desc: 'Azure SQL feature creating readable secondary replicas in up to 4 other regions. Manual failover. Predecessor to Auto-Failover Groups.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Azure SQL Database Tiers & Deployment',
      points: [
        'Azure SQL Database is fully managed SQL Server — no OS or SQL Server patching, built-in HA, automated backups (7–35 days PITR), and threat detection. It is distinct from SQL Managed Instance (full SQL Server compatibility with VNet injection) and SQL Server on VM (IaaS).',
        'vCore model: choose compute generation (Gen5), vCores, and memory. Decoupled compute and storage. Service tiers: General Purpose (99.99% SLA, remote storage), Business Critical (local SSD, 99.99%, readable secondary included), Hyperscale (multi-TB databases, rapid scale-out).',
        'Serverless: compute auto-scales between configured min and max vCores. Auto-pause after a configurable inactivity period (min 1 hour) — billing stops for compute (storage still billed). On first query after pause, there is a ~1-minute cold start. Best for intermittent, unpredictable workloads.',
        'DTU model (legacy): blended measure of CPU, memory, and I/O. Basic/Standard/Premium tiers. Simpler but less transparent. vCore is recommended for new deployments — it allows Azure Hybrid Benefit (bring existing SQL Server licences to save up to 55%).',
        'Elastic Pools: a pool with a shared set of resources (eDTUs or vCores) serving multiple databases. Databases borrow from the pool as needed. Economical when databases have non-overlapping peak usage — the pool handles the aggregate without each database needing to be sized for its individual peak.',
      ]
    },
    {
      heading: 'Cosmos DB Architecture',
      points: [
        'Cosmos DB is a globally distributed multi-model database. A Cosmos account holds databases, which hold containers (collections/tables). Data is partitioned by a partition key — all items with the same partition key live on the same logical partition (physical partition = up to 50 GB, ~10,000 RU/s).',
        'Partition key choice is critical: high cardinality (many distinct values) distributes load evenly. A poor partition key creates hot partitions — one partition receives all traffic while others are idle, causing throttling (429) on the hot partition.',
        'Throughput: Provisioned (manual RU/s or autoscale max RU/s — scales down automatically, billed for max provisioned) or Serverless (pay per actual RU consumed, best for dev/test or very sporadic workloads, no geo-replication in serverless).',
        'Global distribution: add regions to a Cosmos account with one click. Writes go to the write region; reads can be served from any read region. Multi-region writes (multi-master) allow writes in every region — resolves conflicts via Last Write Wins (timestamp) or custom merge procedures.',
        'APIs: Core (SQL-like query syntax, native Cosmos), MongoDB (wire-protocol compatible), Cassandra (CQL), Gremlin (graph traversal), Table (compatible with Azure Table Storage). Each API is a different interface over the same underlying Cosmos engine.',
      ]
    },
    {
      heading: 'Cosmos DB Consistency Levels',
      points: [
        'Strong: all reads return the most recent committed write — no stale reads. Latency: highest (must wait for quorum across all replicas). Throughput: halved (writes must replicate synchronously). Not available with multi-region writes.',
        'Bounded Staleness: reads lag writes by at most K versions or T seconds. Predictable staleness. Reads guaranteed to be in order. Good for scenarios needing near-strong consistency with regional reads.',
        'Session (default): consistent within a session. Your own writes are immediately visible to your own reads (read your own writes). The best balance for most applications. Most reads hit a local replica.',
        'Consistent Prefix: reads never see out-of-order writes. If writes are A, B, C you may read A or A,B or A,B,C but never B,A or A,C. No single-read guarantee of latest version.',
        'Eventual: reads may see older versions, reads may be out of order. Lowest latency, highest throughput. Appropriate for non-critical scenarios (like counts, analytics) where eventual convergence is acceptable.',
      ]
    },
    {
      heading: 'Geo-Replication & Failover',
      points: [
        'Azure SQL Auto-Failover Groups: group one or more databases for automatic or manual failover to a secondary server in another region. Provide a listener endpoint (yourgroup.database.windows.net) that always points to the current primary — app reconnects seamlessly after failover.',
        'Cosmos DB multi-region writes: enable multiple write regions to allow writes and reads from any region. RTO = 0 for regional outages. With single write region, RTO ≈ 15 minutes for manual failover (or auto-failover after threshold).',
        'PITR (Point-in-Time Restore): Azure SQL retains transaction log backups enabling restore to any second within the retention window (7–35 days). Cosmos DB retains continuous backups (2 or 30 days) with 1-second granularity on periodic/continuous mode.',
        'Cosmos DB analytical store: automatically syncs data from transactional store to a columnar analytical store (Pareto format) — run Azure Synapse Analytics queries without impacting transactional throughput. No ETL pipeline needed.',
        'Azure SQL Hyperscale: for very large databases (up to 100 TB). Distributed architecture with page servers and rapid backup/restore (minutes, not hours). vCore-based, General Purpose SLA.',
      ]
    },
    {
      heading: 'Choosing Between Azure SQL and Cosmos DB',
      points: [
        'Azure SQL Database is a relational database with strong consistency, ACID transactions, and a fixed schema — appropriate when data has clear relational structure and applications benefit from SQL\'s expressive querying and strong consistency guarantees.',
        'Cosmos DB is a globally distributed, multi-model NoSQL database offering tunable consistency (from strong to eventual) and horizontal scale across regions — appropriate for applications needing massive scale, flexible schema, and low-latency global reads/writes.',
        'Cosmos DB\'s partition key choice is a critical, largely irreversible design decision — a poorly chosen partition key can create hot partitions that bottleneck throughput regardless of provisioned RU/s, unlike a relational database where indexing strategy can be adjusted more easily after the fact.',
        'Cost models differ significantly — Azure SQL is typically priced by compute tier (DTU or vCore), while Cosmos DB is priced by provisioned or consumed Request Units (RU/s) — this difference should factor into the choice for cost-sensitive, high-throughput workloads.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Azure SQL Database',
      language: 'bash',
      code: `# Create SQL Server (logical server) with Entra ID admin
az sql server create \\
  --name my-sql-server --resource-group my-rg \\
  --location eastus \\
  --admin-user sqladmin \\
  --admin-password "Str0ng!Pass#2025"

# Set Entra ID admin (prefer this over SQL auth)
az sql server ad-admin create \\
  --server-name my-sql-server --resource-group my-rg \\
  --display-name "DBA Group" \\
  --object-id <group-object-id>

# Create serverless database
az sql db create \\
  --server my-sql-server --resource-group my-rg \\
  --name my-db \\
  --edition GeneralPurpose \\
  --family Gen5 --capacity 2 \\
  --compute-model Serverless \\
  --auto-pause-delay 60 \\
  --min-capacity 0.5

# Create Auto-Failover Group (secondary server in different region)
az sql failover-group create \\
  --name my-fg \\
  --server my-sql-server --resource-group my-rg \\
  --partner-server my-sql-server-secondary \\
  --partner-resource-group my-rg-secondary \\
  --failover-policy Automatic \\
  --grace-period 1 \\
  --add-db my-db`
    },
    {
      label: 'Cosmos DB Setup',
      language: 'bash',
      code: `# Create Cosmos DB account with two regions (single write region)
az cosmosdb create \\
  --name my-cosmos --resource-group my-rg \\
  --kind GlobalDocumentDB \\
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=true \\
  --locations regionName=westus failoverPriority=1 isZoneRedundant=false \\
  --default-consistency-level Session \\
  --enable-automatic-failover true

# Create database and container with partition key
az cosmosdb sql database create \\
  --account-name my-cosmos --resource-group my-rg \\
  --name my-database

az cosmosdb sql container create \\
  --account-name my-cosmos --resource-group my-rg \\
  --database-name my-database \\
  --name users \\
  --partition-key-path /userId \\
  --throughput 400

# Enable autoscale (max 4000 RU/s, scales down automatically)
az cosmosdb sql container throughput update \\
  --account-name my-cosmos --resource-group my-rg \\
  --database-name my-database --name users \\
  --max-throughput 4000

# Add a write region (multi-region writes)
az cosmosdb update \\
  --name my-cosmos --resource-group my-rg \\
  --enable-multiple-write-locations true \\
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=true \\
  --locations regionName=westus failoverPriority=1 isZoneRedundant=true`
    },
    {
      label: 'Cosmos DB SDK (TypeScript)',
      language: 'typescript',
      code: `import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env['COSMOS_ENDPOINT']!,
  key: process.env['COSMOS_KEY']!,
  // OR use DefaultAzureCredential for Managed Identity:
  // aadCredentials: new DefaultAzureCredential()
});

const container = client.database('my-database').container('users');

// Point read (cheapest — 1 RU for 1 KB item)
async function getUser(userId: string) {
  const { resource } = await container.item(userId, userId).read();
  return resource;
}

// SQL query (more expensive — cross-partition if not filtered by pk)
async function getUsersByCountry(country: string) {
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.country = @country',
      parameters: [{ name: '@country', value: country }],
    })
    .fetchAll();
  return resources;
}

// Upsert (create or replace)
async function saveUser(user: { userId: string; name: string; country: string }) {
  const { resource } = await container.items.upsert(user);
  return resource;
}

// Delete
async function deleteUser(userId: string) {
  await container.item(userId, userId).delete();
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Choosing a poor partition key in Cosmos DB (low cardinality)',
      wrong: `// partitionKey: '/country' — only 200 distinct values, causes hot partitions`,
      right: `// partitionKey: '/userId' — millions of distinct values, even distribution`,
      explanation: 'A partition key with low cardinality (few distinct values like country, status, or boolean flags) routes most traffic to a few logical partitions, causing hot partitions that hit the 10,000 RU/s per physical partition limit and return 429 errors. Choose a key with high cardinality that is also used in most query WHERE clauses to avoid cross-partition queries.'
    },
    {
      title: 'Using cross-partition queries in Cosmos DB for every operation',
      wrong: `// SELECT * FROM c WHERE c.country = 'US' — without partition filter, scans all partitions`,
      right: `// Always include partition key in queries: WHERE c.userId = @userId`,
      explanation: 'Cross-partition queries fan out to all physical partitions and aggregate results — expensive in both RU/s cost and latency. Design your data model so the most frequent queries include the partition key (enabling a single-partition lookup). For queries that genuinely need cross-partition, provision sufficient RU/s to handle the fan-out cost.'
    },
    {
      title: 'Using DTU-based Azure SQL for new workloads',
      wrong: `az sql db create --edition Standard --dtu 100  # DTU model — opaque, no Azure Hybrid Benefit`,
      right: `az sql db create --edition GeneralPurpose --family Gen5 --capacity 4  # vCore model`,
      explanation: 'DTU-based pricing bundles compute, memory, and I/O into an opaque unit — hard to right-size and does not support Azure Hybrid Benefit (which can save 55% with existing SQL Server licences). vCore model is transparent (separate compute, storage billing), supports Hybrid Benefit, and maps directly to SQL Server SKUs for easier capacity planning.'
    },
    {
      title: 'Setting Cosmos DB consistency to Strong for multi-region writes',
      wrong: `az cosmosdb create --default-consistency-level Strong --enable-multiple-write-locations true`,
      right: `# Strong consistency is not available with multi-region writes — use BoundedStaleness or Session`,
      explanation: 'Strong consistency requires synchronous replication across all replicas before acknowledging writes — this is incompatible with multi-region writes where network latency between regions makes synchronous replication prohibitive. If you need Strong consistency, use a single write region. For multi-region writes, use Session or BoundedStaleness.'
    },
  ];

  challenge: Challenge = {
    title: 'Cosmos DB partition key analyser',
    language: 'typescript',
    description: 'Analyse a dataset to recommend a partition key. Given an array of items (objects), write analysePartitionKey(items: Record<string, unknown>[], field: string): { cardinality: number; hotPartition: string | null; recommendation: string } that:\n- counts distinct values for the field\n- identifies if any single value holds >20% of items (hot partition risk)\n- returns a recommendation string',
    hints: [
      'Count occurrences of each field value using a Map',
      'Cardinality = number of distinct values',
      'Hot partition: any value whose count / total > 0.2',
      'Recommendation: good if cardinality > items.length * 0.5 and no hot partitions',
    ],
    starterCode: `export function analysePartitionKey(
  items: Record<string, unknown>[],
  field: string
): { cardinality: number; hotPartition: string | null; recommendation: string } {
  return { cardinality: 0, hotPartition: null, recommendation: '' };
}`,
    solution: `export function analysePartitionKey(
  items: Record<string, unknown>[],
  field: string
): { cardinality: number; hotPartition: string | null; recommendation: string } {
  const counts = new Map<string, number>();
  for (const item of items) {
    const val = String(item[field] ?? '__missing__');
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  const cardinality = counts.size;
  const threshold = items.length * 0.2;
  let hotPartition: string | null = null;
  for (const [key, count] of counts) {
    if (count > threshold) { hotPartition = key; break; }
  }
  const isGood = cardinality > items.length * 0.5 && hotPartition === null;
  const recommendation = isGood
    ? 'Good partition key: high cardinality, no hot partitions detected.'
    : hotPartition
      ? \`Avoid: value "\${hotPartition}" holds >\${Math.round(100/items.length*counts.get(hotPartition)!)}% of items.\`
      : \`Low cardinality (\${cardinality} values for \${items.length} items) — consider a higher-cardinality field.\`;
  return { cardinality, hotPartition, recommendation };
}`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does Azure SQL Serverless auto-pause mean for application latency?',
      options: [
        'The database is never paused — serverless only refers to billing',
        'After inactivity, compute is deallocated; the first query after resumption has ~1-minute latency',
        'Queries are queued during pause and execute when compute resumes — no latency impact',
        'Auto-pause only applies to storage, not compute'
      ],
      answer: 1,
      explanation: 'In Serverless mode, Azure SQL deallocates compute after a configurable inactivity period (min 1 hour). Compute billing stops during the pause. When a new connection arrives, Azure provisions compute again — this takes approximately 1 minute, causing the first query to time out or appear very slow. Design health checks and connection retry logic accordingly.'
    },
    {
      q: 'What is the default Cosmos DB consistency level and why is it recommended for most apps?',
      options: [
        'Strong — guarantees latest data always',
        'Eventual — lowest latency',
        'Session — reads your own writes within a session; good latency vs consistency balance',
        'Bounded Staleness — predictable staleness window'
      ],
      answer: 2,
      explanation: 'Session consistency is the default and recommended for most applications. Within a session, you always read your own writes (read-your-writes guarantee). Reads are served from a local replica (low latency). This is the best balance for typical application patterns like user profiles, shopping carts, and content management where users need to see their own changes immediately.'
    },
    {
      q: 'What is an Elastic Pool in Azure SQL Database?',
      options: [
        'A feature for scaling a single database vertically on demand',
        'A shared compute/storage pool serving multiple databases — databases borrow resources as needed',
        'A connection pool managed by Azure to reduce connection overhead',
        'A type of read replica for distributing query load'
      ],
      answer: 1,
      explanation: 'An Elastic Pool allocates a shared pool of resources (eDTUs or vCores) that multiple databases in the same logical server can share. Databases borrow from the pool as they need it, and return resources when idle. Cost-effective when databases have non-overlapping peak usage — instead of each database being sized for its individual peak, the pool handles the aggregate load.'
    },
    {
      q: 'Why is partition key selection critical in Cosmos DB?',
      options: [
        'The partition key is used to encrypt data at rest',
        'Items with the same partition key are co-located — poor choice causes hot partitions and throttling (429)',
        'Cosmos DB requires a partition key for ACID transactions only',
        'Partition keys determine which region data is stored in'
      ],
      answer: 1,
      explanation: 'Items with the same partition key value land on the same logical/physical partition. A partition is capped at 50 GB and ~10,000 RU/s. Low-cardinality partition keys concentrate traffic on a few partitions, causing 429 (TooManyRequests) throttling and hot spots. A high-cardinality key that maps to your most frequent query access pattern enables even distribution and single-partition lookups.'
    },
    {
      q: 'What is the RU/s cost of a Cosmos DB point read for a 1 KB item?',
      options: ['0.1 RU', '1 RU', '5 RU', '10 RU'],
      answer: 1,
      explanation: 'A point read (reading one item by its id + partition key) of a 1 KB item costs exactly 1 RU — the cheapest possible operation. A cross-partition query scanning many items can cost hundreds or thousands of RUs. This is why the access pattern "always look up by id + partition key" is preferred in Cosmos DB — design your data model around this to minimise RU cost.'
    },
    {
      q: 'Which Cosmos DB consistency level provides the strongest consistency guarantee?',
      options: [
        'Eventual',
        'Consistent Prefix',
        'Session',
        'Strong',
      ],
      answer: 3,
      explanation: 'Strong consistency guarantees linearisability reads always return the most recently committed write. It has the highest latency and lowest throughput. Eventual consistency offers the best performance but weakest guarantees.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose Azure SQL vs Cosmos DB?',
      a: '<strong>Azure SQL</strong>: relational data with complex relationships, joins, transactions (ACID), reporting queries, and teams familiar with SQL. Strong consistency guaranteed. Well-defined schema. Up to ~100 TB with Hyperscale. <strong>Cosmos DB</strong>: globally distributed apps needing single-digit millisecond latency worldwide, flexible schema (JSON documents), very high write throughput, or multi-API requirements (MongoDB, Cassandra). NoSQL trade-offs: no multi-table joins (embed related data), eventual consistency options. Rule of thumb: if you need SQL joins and ACID multi-table transactions → Azure SQL. If you need global distribution, flexible schema, or extreme throughput → Cosmos DB.'
    },
    {
      q: 'What is the difference between Cosmos DB Provisioned and Serverless throughput?',
      a: '<strong>Provisioned throughput</strong>: you set RU/s (manual) or max RU/s (autoscale). Billed for what you provision, whether or not used. Best for predictable workloads. Supports geo-replication. <strong>Serverless</strong>: no provisioning — you pay only for the actual RU/s consumed per request. Ideal for intermittent workloads, development, and testing. Does not support geo-replication or the analytical store. Autoscale provisioned throughput is the middle ground: scales between 10% and 100% of max RU/s automatically, still geo-replication capable.'
    },
    {
      q: 'How does Azure SQL Auto-Failover Group differ from Active Geo-Replication?',
      a: '<strong>Active Geo-Replication</strong>: creates up to 4 readable secondary replicas in different regions. Failover is manual — you must initiate failover in code or the portal. No listener endpoint — app must be updated with the new primary server name after failover. <strong>Auto-Failover Group</strong>: wraps one or more databases with a group that has a listener endpoint (yourgroup.database.windows.net) pointing to the current primary. Supports automatic failover after a configurable grace period. App connects to the listener — no connection string change needed after failover. Recommended for production geo-redundancy.'
    },
    {
      q: 'What is Azure SQL Hyperscale and when should I use it?',
      a: '<strong>Hyperscale</strong> is an Azure SQL service tier designed for very large databases (up to 100 TB). Unlike standard Azure SQL (which has a max of 4 TB), Hyperscale uses a distributed architecture with separate page servers (scale-out read replicas), a log service, and compute nodes. Key benefits: near-instant backups (copying metadata, not data), rapid scale-up/down of compute, and up to 4 named replicas for read scale-out. Use when your database exceeds 4 TB, you need extremely fast backup/restore, or you need read scale-out beyond a single readable secondary.'
    },
    {
      q: 'What is Cosmos DB Change Feed and what can you use it for?',
      a: '<strong>Change Feed</strong> is an ordered log of all inserts and updates to items in a Cosmos container. It does not include deletes (unless you use soft-delete pattern with a "deleted" flag). Common use cases: (1) <strong>Event sourcing</strong>: downstream systems react to data changes. (2) <strong>Materialised views</strong>: maintain a read-optimised projection of data in another container. (3) <strong>Cache invalidation</strong>: invalidate Redis cache when underlying data changes. (4) <strong>Audit trail</strong>: record all changes to a separate audit container. Consumed via Azure Functions Cosmos trigger or the SDK\'s change feed processor.'
    },
    {
      q: 'What is the RU (Request Unit) in Cosmos DB and why does it matter for cost?',
      a: 'A Request Unit (RU) is a normalised unit of database operations — CPU, memory, and IOPS combined. You provision RU/s (throughput) and pay per-RU. Every operation (read, write, query) costs a predictable number of RUs. Underprovisioning causes 429 throttling; overprovisioning wastes cost. Use autoscale to elastically adjust between min and max RU/s.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure SQL Database is fully managed relational SQL with elastic pools, serverless, and auto-failover groups; Cosmos DB is globally distributed multi-model NoSQL with 5 consistency levels, partition-based scaling, and multi-API support.',
    mustKnow: [
      'Azure SQL: vCore model preferred (Hybrid Benefit, transparent scaling); serverless auto-pauses after inactivity (~1 min resume latency)',
      'Elastic Pool: shared resources across databases — economical for non-overlapping peak workloads',
      'Auto-Failover Group: listener endpoint abstracts primary location — app needs no reconnect logic after failover',
      'Cosmos DB: partition key = distribution of data and throughput; high cardinality essential to avoid hot partitions',
      'Cosmos DB consistency: Session (default) — read your own writes, local replica reads, good latency/consistency balance',
      'Point read (item by id + pk) = 1 RU for 1 KB; cross-partition query = many RUs — design access patterns accordingly',
    ],
    interviewFocus: [
      'When would you choose Azure SQL vs Cosmos DB?',
      'Explain Cosmos DB consistency levels and the trade-offs of each',
      'What makes a good vs bad partition key in Cosmos DB?',
      'What is the difference between Auto-Failover Group and Active Geo-Replication in Azure SQL?',
    ],
  };
}
