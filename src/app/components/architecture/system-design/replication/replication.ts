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
  { name: 'Single-leader',   type: 'keyword', desc: 'One primary accepts writes; replicas sync via WAL/binlog. Most common pattern.' },
  { name: 'Multi-leader',    type: 'keyword', desc: 'Multiple nodes accept writes. Geo-distributed; conflict resolution required.' },
  { name: 'Leaderless',      type: 'keyword', desc: 'All nodes accept reads/writes. Quorum ensures consistency (W + R > N).' },
  { name: 'Sync replication',type: 'keyword', desc: 'Leader waits for replica ACK before committing. Zero data loss; higher latency.' },
  { name: 'Async replication',type: 'keyword', desc: 'Leader commits immediately; replica lags behind. Lower latency; risk of data loss.' },
  { name: 'WAL',             type: 'keyword', desc: 'Write-Ahead Log — append-only log used to ship changes to replicas (PostgreSQL, MySQL).' },
  { name: 'Replication lag', type: 'keyword', desc: 'Time between write on primary and visibility on replica. Can cause stale reads.' },
  { name: 'Read-your-writes',type: 'keyword', desc: 'Consistency guarantee: after a write, the same user always reads the latest value.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Single-leader replication',
    points: [
      'One primary node handles all writes; one or more replicas copy changes.',
      'Changes shipped via WAL (PostgreSQL) or binary log (MySQL); replica applies in order.',
      'Pros: simple, strong read scaling (add replicas), conflict-free.',
      'Cons: write bottleneck at primary; failover takes 30-60 seconds without managed tools.',
    ],
  },
  {
    heading: 'Multi-leader replication',
    points: [
      'Multiple nodes accept writes simultaneously. Each propagates writes to all other leaders.',
      'Use case: geo-distributed systems (write to nearest region, sync globally).',
      'Conflict resolution required: last-write-wins (LWW), merge, CRDT, or application logic.',
      'Examples: CockroachDB, Spanner, multi-master MySQL, offline apps (mobile sync).',
    ],
  },
  {
    heading: 'Leaderless replication (Dynamo-style)',
    points: [
      'All nodes are equal — any node accepts reads and writes.',
      'Quorum: W + R > N ensures at least one node has the latest write when reading.',
      'With N=3: W=2, R=2 → strongly consistent; W=1, R=1 → eventually consistent.',
      'Examples: Cassandra, Riak, DynamoDB (by default eventual, tunable to quorum).',
    ],
  },
  {
    heading: 'Synchronous vs asynchronous replication',
    points: [
      'Synchronous: leader waits for replica ACK before returning success. RPO=0 but +10-50ms latency.',
      'Asynchronous: leader returns immediately; replica may lag by seconds. Lower latency; replication lag causes stale reads.',
      'Semi-synchronous (MySQL): one replica must ACK; others async. Middle ground.',
      'PostgreSQL: synchronous_standby_names = 1 makes one replica synchronous.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'PostgreSQL Replication Setup',
    language: 'bash',
    code: `# PostgreSQL streaming replication (primary → replica)

# On primary — postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB

# Create replication user
CREATE USER replicator REPLICATION LOGIN ENCRYPTED PASSWORD 'secret';

# pg_hba.conf — allow replica to connect
host replication replicator replica-ip/32 md5

# On replica — pg_basebackup to clone primary
pg_basebackup -h primary-ip -U replicator -D /var/lib/postgresql/data -Fp -Xs -R

# The -R flag writes recovery.conf (or standby.signal in PG13+)
# Replica will stream from primary automatically

# Monitor replication lag:
SELECT client_addr, state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)  AS sent_lag_bytes,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;`,
  },
  {
    label: 'Quorum Reads (Cassandra)',
    language: 'bash',
    code: `# Cassandra quorum — tuning W + R > N

# N = 3 replicas (replication_factor = 3)

# Strong consistency: W=QUORUM(2), R=QUORUM(2) → 2+2=4 > 3
CREATE KEYSPACE my_ks WITH replication = {'class': 'NetworkTopologyStrategy', 'dc1': 3};

# Write with QUORUM (2 of 3 must ACK)
INSERT INTO users (id, name) VALUES (?, ?) USING CONSISTENCY QUORUM;

# Read with QUORUM (2 of 3 must respond; latest wins)
SELECT * FROM users WHERE id = ? USING CONSISTENCY QUORUM;

# Eventual consistency: ONE (faster, may return stale)
SELECT * FROM users WHERE id = ? USING CONSISTENCY ONE;

# Read-repair: Cassandra detects divergence during QUORUM read
# and synchronises the stale replica in background
# Explicit repair: nodetool repair  (use after node recovery)`,
  },
  {
    label: 'Handling Replication Lag',
    language: 'typescript',
    code: `// Problem: user posts a comment; reads from replica; comment missing (lag)

// Solution 1: Read-your-writes — route writes to primary, reads to replica
// For the same user's own writes within 1 min: read from primary
async function getUserPosts(userId: string, isRecentWriter: boolean) {
  const db = isRecentWriter ? primaryDb : replicaDb;
  return db.query('SELECT * FROM posts WHERE user_id = ?', [userId]);
}

// Solution 2: monotonic read — user always reads from same replica (session affinity)
// Map userId → replica index (consistent hash)
function getReplicaForUser(userId: string): DatabasePool {
  const idx = hash(userId) % replicas.length;
  return replicas[idx]; // always same replica for this user
}

// Solution 3: wait for replication before redirecting to replica
// Only practical with sync replication or CDC events
async function writeAndWaitForReplica(data: Post): Promise<void> {
  const lsn = await primaryDb.insert('posts', data); // returns WAL LSN
  // Wait until replica reaches this LSN (PostgreSQL pg_last_wal_replay_lsn)
  await replicaDb.waitForLSN(lsn, { timeout: 200 }); // 200ms max wait
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Reading from replica immediately after write',
    wrong: `await db.write(primary, data);
const result = await db.read(replica, query);
// Replica hasn't caught up yet — stale read`,
    right: `await db.write(primary, data);
// Route user's own reads back to primary for a short window (e.g., 1 min)
const result = await db.read(userJustWrote ? primary : replica, query);`,
    explanation: 'Async replication means replicas lag behind the primary. Reading immediately from a replica after a write may return stale data. Route the writing user\'s own reads to primary (read-your-writes guarantee).',
  },
  {
    title: 'Promoting replica without checking replication lag',
    wrong: `# Primary fails → immediately promote random replica
pg_ctl promote -D /var/lib/postgresql/data`,
    right: `# Check replication lag before promoting
SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) FROM pg_stat_replication;
# Promote the replica with the smallest lag (most up-to-date)
# In managed DBs: AWS RDS failover does this automatically`,
    explanation: 'Promoting a lagging replica may lose the writes that never replicated. Always promote the most up-to-date replica. Use managed failover (AWS RDS Multi-AZ, Patroni) that handles this automatically.',
  },
  {
    title: 'Using async replication for financial data',
    wrong: `# Async replication for payment transactions
# If primary crashes after commit but before replica ACK:
# money deducted from account; transaction log lost on replica`,
    right: `# Use synchronous replication for financial data:
# PostgreSQL: synchronous_standby_names = 'replica1'
# Leader waits for replica ACK before returning commit success
# RPO = 0 (no data loss on failover)`,
    explanation: 'Async replication has non-zero RPO — writes acknowledged to clients may not survive a primary failure. For financial or safety-critical data, require synchronous replication.',
  },
  {
    title: 'Ignoring replication lag monitoring',
    wrong: `# No monitoring on replica lag
# Replica drifts 10 minutes behind primary
# Reads return stale data; no alerts fired`,
    right: `# Monitor: pg_stat_replication.replay_lag (PostgreSQL)
# Alert if lag > 30 seconds (tune to your RPO requirement)
# AWS RDS: ReplicaLag CloudWatch metric
# Alert threshold: ReplicaLag > 60 seconds → page on-call`,
    explanation: 'Replication lag can silently grow due to high write load, network congestion, or large transactions. Unmonitored lag causes stale reads and data loss on failover.',
  },
];

const challenge: Challenge = {
  title: 'Design replication for a global payment processing system',
  language: 'typescript',
  description: `Design the replication strategy for a payment processor.

Requirements:
- Handle 50k transactions per second globally
- Zero data loss (RPO = 0) on primary failure
- Read latency < 50ms for payers globally (US, EU, APAC)
- Writes must be acknowledged only after durable
- Regulatory: EU data must stay in EU

Design:
1. Which replication model (single/multi/leaderless)?
2. Sync or async replication?
3. How to achieve global low-latency reads?
4. How to handle EU data residency?`,
  hints: [
    'RPO = 0 requires synchronous replication at least to one replica',
    'Global reads with low latency → regional replicas + reads from local replica',
    'Multi-leader for geo-distributed writes? Consider conflict risk for payments',
    'EU data residency: separate cluster in EU region, no cross-region data copy',
  ],
  starterCode: `interface ReplicationDesign {
  model: 'single-leader' | 'multi-leader' | 'leaderless';
  syncMode: 'synchronous' | 'semi-sync' | 'asynchronous';
  globalReadStrategy: string;
  euResidency: string;
  failoverStrategy: string;
}`,
  solution: `const design: ReplicationDesign = {
  model: 'multi-leader',
  // One leader per region (US, EU, APAC) for low-latency writes
  // Conflict prevention: shard by user_id → user always writes to same region
  // Result: same-region leader for both reads and writes

  syncMode: 'semi-sync',
  // Semi-synchronous: write must ACK from in-region replica before commit (RPO=0 within region)
  // Cross-region replication async (no cross-ocean blocking); tolerate brief cross-region lag
  // If regional leader fails, in-region replica promotes with no data loss

  globalReadStrategy: 'Read from nearest regional leader or in-region replica. User session stores their region; route all requests accordingly. Cache payment status in Redis for sub-ms repeated reads.',

  euResidency: 'EU cluster is entirely isolated (Frankfurt data center). No data replication outside EU. US transactions never stored in EU cluster and vice versa. Separate encryption keys per region.',

  failoverStrategy: 'Patroni + etcd for automatic leader election within region. Promote most up-to-date replica (zero lag due to semi-sync). Cross-region failover manual (requires regulatory approval for EU data).',
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which replication mode guarantees RPO = 0 (no data loss on primary failure)?',
    options: ['Asynchronous', 'Synchronous', 'Semi-synchronous', 'Leaderless with ONE consistency'],
    answer: 1,
    explanation: 'Synchronous replication requires the replica to acknowledge the write before the primary returns success. If the primary crashes, the replica has all data. Async can lose writes that were acknowledged but not yet replicated.',
  },
  {
    q: 'In a Cassandra cluster with N=3, which settings provide strong consistency?',
    options: ['W=1, R=2', 'W=2, R=2', 'W=1, R=1', 'W=3, R=1'],
    answer: 1,
    explanation: 'Strong consistency requires W + R > N. With N=3: W=2, R=2 → 2+2=4 > 3. This guarantees the read set overlaps with the write set (at least one node has the latest data).',
  },
  {
    q: 'Replication lag on a read replica causes which problem?',
    options: ['Write performance degradation', 'Stale reads — users see outdated data', 'Primary node failure', 'Increased storage usage'],
    answer: 1,
    explanation: 'Replication lag means the replica has not yet applied all writes from the primary. Reading from a lagging replica returns stale data. Solutions: read-your-writes routing, monotonic reads, or synchronous replication.',
  },
  { q: 'What is the difference between synchronous and asynchronous replication?', options: ['Synchronous replication is for databases; asynchronous replication is for file systems', 'Synchronous replication waits for the replica to confirm before acknowledging the write; asynchronous replication acknowledges immediately and replicates in the background', 'Asynchronous replication provides stronger durability guarantees than synchronous', 'Synchronous replication can only replicate to one replica; asynchronous supports multiple replicas'], answer: 1, explanation: 'Synchronous replication: the primary waits for at least one replica to confirm receipt before acknowledging success to the client. Zero data loss on primary failure because the replica has all committed data. But any replica network latency adds to write latency, and write throughput decreases. Asynchronous replication: the primary acknowledges immediately after writing locally and replicates in the background. Lower write latency and throughput, but if the primary fails before replication completes, recent writes are lost. Most databases let you configure the durability tradeoff per table or transaction.' },
  { q: 'What is replication lag and why is it problematic for read replicas?', options: ['Replication lag is the disk space consumed by replication logs', 'Replication lag is the delay between a write on the primary and when it appears on replicas, causing reads from replicas to return stale data', 'Replication lag only occurs during high write throughput periods and resolves automatically', 'Replication lag is a network latency metric between primary and replica hosts'], answer: 1, explanation: 'Replication lag is the time between a write committing on the primary and the same write appearing on read replicas. During lag, queries to the replica return outdated results. Problems this causes: a user writes their profile and immediately reads it back from a replica, seeing the old value. A read that should reflect a previous write incorrectly returns stale data. Solutions: route critical reads to the primary, use read-your-writes consistency by tracking the replication position and waiting until the replica catches up for a specific user session, or use monotonic read consistency by routing each session consistently to the same replica.' },
  { q: 'What is multi-master (multi-primary) replication and what is its main challenge?', options: ['Multi-master replication means both primary and replica are read-only until a primary is elected', 'Multi-master allows writes to any node but requires conflict resolution when the same data is modified concurrently on different primaries', 'Multi-master is another name for the leader-follower replication pattern', 'Multi-master replication is only available in MySQL and not supported by other databases'], answer: 1, explanation: 'Multi-master replication allows writes to multiple nodes simultaneously, eliminating the single write bottleneck and improving write availability. The core challenge: if two clients write different values to the same row on different primaries simultaneously, a conflict occurs. Resolution strategies: last-write-wins using timestamps (simple but can lose data), manual conflict resolution (complex, requires application logic), or CRDTs that mathematically merge concurrent updates without loss. Multi-master is used in geographically distributed deployments where each region needs low-latency writes.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is a WAL (Write-Ahead Log) and why is it central to replication?',
    a: 'The WAL is an append-only sequence of all changes made to the database. Before any change is applied to data files, it is written to the WAL — hence "write-ahead." Replication works by shipping the WAL to replicas, which replay it in order. The WAL also enables point-in-time recovery (PITR).',
  },
  {
    q: 'What is read-your-writes consistency and how do you implement it?',
    a: 'Read-your-writes guarantees that after a user performs a write, their subsequent reads always reflect that write. Implement by: routing the user\'s reads to the primary for a short window after write; or by tracking the WAL position of the write and ensuring the replica has replayed past that position before serving the read.',
  },
  { q: 'How does read replica offloading work and what are its limitations?', a: 'Read replica offloading routes read queries to replicas while writes go to the primary. This horizontally scales read throughput by adding replicas. Configuration: use the connection string of each replica in the application read pool. Most ORM frameworks and connection poolers support read/write splitting. Limitations: replication lag means replicas may serve stale data. Not all reads can be served from replicas: reads that must follow a write (read-your-writes) need to go to the primary or use synchronous reads from a replica that has confirmed receipt of the specific LSN. Monitoring replication lag is essential: if a replica falls too far behind, route its traffic back to the primary to avoid serving significantly stale data.' },
  { q: 'What is the Raft consensus algorithm and how does it ensure consistency?', a: 'Raft is a consensus algorithm used by distributed systems like etcd, CockroachDB, and TiDB to ensure that a cluster of nodes agrees on a single sequence of log entries even in the presence of node failures. Raft elects a leader that handles all writes. The leader replicates log entries to followers and commits them once a majority (quorum) acknowledges receipt. If the leader fails, a new election occurs and a new leader is chosen from followers with the most up-to-date log. A majority quorum (N/2 + 1 of N nodes) must be available for the cluster to accept writes. Raft provides strong consistency guarantees: all committed entries are durable and visible to all subsequent reads.' },
  { q: 'How does replication differ in relational databases versus Cassandra?', a: 'Relational DB replication is typically leader-follower: one primary handles all writes, replicas receive changes via the replication log (WAL in PostgreSQL, binlog in MySQL). A single leader is the consistency bottleneck. Cassandra uses leaderless replication: any node can accept writes for any key, and the client specifies a consistency level (ONE, QUORUM, ALL) determining how many replicas must confirm. With replication factor 3 and QUORUM consistency, writes and reads each contact 2 of 3 replicas. If write QUORUM + read QUORUM > replication factor, reads always see the latest write. This enables tunable consistency per operation and no single write bottleneck, at the cost of potential conflicts requiring conflict resolution.' },
  { q: 'What is a replication slot in PostgreSQL and why is it important?', a: 'A replication slot is a mechanism that ensures the primary server retains WAL (Write-Ahead Log) segments until all connected replicas have consumed them. Without replication slots, the primary may recycle WAL files that a lagging replica still needs, causing the replica to fail and require a full resync. With a slot, the primary tracks each replica connection progress and retains WAL segments until they are consumed. Critical for logical replication used in change data capture (CDC) with tools like Debezium. Risk: if a replica disconnects and never reconnects, its slot prevents WAL cleanup indefinitely, causing disk exhaustion. Monitor slot lag and configure max_slot_wal_keep_size to limit WAL retention per slot.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Single-leader is simplest; multi-leader for geo writes; leaderless with W+R>N for tuneable consistency. Sync replication = RPO 0.',
  mustKnow: [
    'Single-leader: one primary, WAL-shipped replicas, simple failover',
    'Multi-leader: conflict resolution needed; used for geo-distributed writes',
    'Leaderless: W + R > N for strong consistency (Cassandra, Dynamo)',
    'Sync replication: RPO=0, +latency; async: lower latency, non-zero RPO',
    'Replication lag causes stale reads — implement read-your-writes',
    'Promote replica with smallest lag to minimise data loss on failover',
  ],
  interviewFocus: [
    'State sync vs async decision based on RPO requirement',
    'Explain W + R > N formula when discussing Cassandra/DynamoDB',
    'Mention replication lag as a stale-read risk and mitigation strategy',
    'For payments: always sync replication at minimum to one in-region replica',
  ],
};

@Component({
  selector: 'app-sysdesign-replication',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './replication.html',
  styleUrl: './replication.scss',
})
export class SysdesignReplication {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
