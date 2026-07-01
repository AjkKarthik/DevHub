import { Component } from '@angular/core';
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
  selector: 'app-redis-replication-sentinel',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './replication-sentinel.html',
  styleUrl: './replication-sentinel.scss',
})
export class RedisReplicationSentinel {
  quickRef: QuickRefItem[] = [
    { name: 'REPLICAOF host port', type: 'keyword', desc: 'Make the current server a replica of host:port' },
    { name: 'REPLICAOF NO ONE', type: 'keyword', desc: 'Detach from master — promote replica to standalone' },
    { name: 'INFO replication', type: 'keyword', desc: 'Show role, master_host, connected_slaves, repl offset' },
    { name: 'replica-read-only yes', type: 'syntax', desc: 'Replicas reject write commands (default: yes)' },
    { name: 'min-replicas-to-write 1', type: 'syntax', desc: 'Master requires N replicas acknowledged before write returns' },
    { name: 'sentinel monitor mymaster host 6379 2', type: 'syntax', desc: 'Sentinel watches master; 2 = quorum for failover decision' },
    { name: 'sentinel down-after-milliseconds mymaster 5000', type: 'syntax', desc: 'ms before Sentinel marks master subjectively down' },
    { name: 'sentinel failover-timeout mymaster 60000', type: 'syntax', desc: 'Max time for a failover attempt (ms)' },
    { name: 'SENTINEL get-master-addr-by-name mymaster', type: 'keyword', desc: 'Ask Sentinel for current master address' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Redis Replication',
      points: [
        'Redis replication is asynchronous and single-direction: one master, N replicas. Replicas receive a stream of write commands from the master and apply them in order.',
        'Initial sync: the master forks and performs BGSAVE (RDB snapshot), sends the RDB to the replica, then sends buffered commands. After initial sync, incremental replication via the replication backlog continues.',
        'Replication is asynchronous by default — the master does not wait for replicas to acknowledge writes. This means a small amount of data can be lost if the master crashes before a write propagates.',
        'min-replicas-to-write N + min-replicas-max-lag S: master refuses writes if fewer than N replicas are within S seconds of replication lag. Increases durability at the cost of availability.',
        'Replicas can serve read traffic to scale read throughput — useful for heavy-read workloads. But be aware of replication lag: replicas may be slightly behind the master.',
      ],
    },
    {
      heading: 'Redis Sentinel — Automatic Failover',
      points: [
        'Sentinel is a separate process (or set of processes) that monitors Redis masters and replicas and performs automatic failover when the master becomes unavailable.',
        'Quorum: Sentinel requires a majority of Sentinel instances to agree the master is down before initiating failover. With 3 Sentinels, quorum of 2 prevents split-brain decisions.',
        'Failover process: Sentinel detects master down (SDOWN) → quorum of Sentinels agree (ODOWN) → Sentinel leader elected → best replica promoted to master → other replicas repointed → clients notified via Pub/Sub.',
        'Clients connect via Sentinel, not directly to the master. The Sentinel returns the current master address; on failover, the client reconnects to the new master automatically.',
        'Always deploy an odd number of Sentinels (minimum 3) across different availability zones to survive single-node failures without losing quorum.',
      ],
    },
    {
      heading: 'Sentinel vs Cluster',
      points: [
        'Sentinel provides high availability (HA) for a single-master setup. All data lives on one primary node; replicas are standby copies for failover and reads.',
        'Redis Cluster provides both HA and horizontal scaling by sharding data across multiple master nodes, each with its own replicas.',
        'Choose Sentinel when your dataset fits on one node and you need automatic failover. Choose Cluster when you need data sharding across multiple nodes.',
        'Sentinel is simpler to operate and understand. Cluster adds complexity (slot assignment, CROSSSLOT constraints, multi-key commands limitations).',
      ],
    },
    {
      heading: 'Automatic Failover with Redis Sentinel',
      points: [
        'Sentinel is a separate, dedicated process (run as a quorum of multiple Sentinel instances) that monitors Redis primary and replica health, and automatically promotes a replica to primary if the current primary becomes unreachable — providing automatic failover without manual intervention.',
        'A quorum of at least 3 Sentinel instances (an odd number, to avoid split-brain ties) is recommended for production — a single Sentinel instance is itself a single point of failure for the failover mechanism, defeating the purpose of having automated failover at all.',
        'Applications connect to Sentinel (not directly to a hardcoded primary address) to discover the CURRENT primary\'s address — this indirection is what allows the actual primary to change during a failover event without requiring every client to be manually reconfigured with a new address.',
        'Failover is not instantaneous — there is a detection window (Sentinel must confirm the primary is genuinely down, not just experiencing transient network issues) before promoting a replica, meaning a brief window of write unavailability is expected during any failover event, not a truly zero-downtime transition.',
      ],
    },
    {
      heading: 'Replication Lag and Read Scaling Tradeoffs',
      points: [
        'Redis replication is asynchronous by default — a write is acknowledged to the client as soon as the primary applies it, without waiting for replicas to confirm, meaning replicas can lag behind the primary under heavy write load or network delay.',
        'Reading from replicas to scale read throughput introduces the same staleness tradeoff as any asynchronously replicated system — an application reading a just-written value from a lagging replica may see the previous value momentarily, which must be an acceptable tradeoff for that specific read path.',
        'WAIT (blocking until a specified number of replicas acknowledge a write, up to a timeout) can be used selectively for genuinely critical writes needing stronger durability guarantees — at the cost of added write latency, so it should be reserved for writes where the durability guarantee is worth that cost.',
        'Monitoring replication lag (via INFO replication, specifically the master_repl_offset vs slave_repl_offset difference) is essential for any deployment relying on read replicas — a replica falling significantly behind indicates either resource constraints or network issues that should be investigated before it becomes a bigger consistency problem.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sentinel Client (ioredis)',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// Connect via Sentinel — ioredis auto-discovers master and handles failover
const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster',        // must match sentinel.conf "sentinel monitor mymaster"
  sentinelPassword: 'sentinel-secret',  // if Sentinel has auth
  password: 'redis-secret',             // if Redis has auth
});

// ioredis automatically reconnects to the new master after failover
redis.on('ready', () => console.log('Connected to Redis master'));
redis.on('+switch-master', (e) => console.log('Failover — new master:', e));

// Read from replica for read scaling
const replicaRedis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster',
  role: 'slave', // connect to a replica for reads
});`,
    },
    {
      label: 'sentinel.conf',
      language: 'bash',
      code: `# /etc/redis/sentinel.conf

# Watch "mymaster" at 192.168.1.10:6379; quorum = 2 (of 3 Sentinels)
sentinel monitor mymaster 192.168.1.10 6379 2

# Auth for the Redis master/replicas
sentinel auth-pass mymaster redis-secret

# Time (ms) before marking master as SDOWN
sentinel down-after-milliseconds mymaster 5000

# Max time for a failover attempt
sentinel failover-timeout mymaster 60000

# Reconfigure N replicas per second after failover
sentinel parallel-syncs mymaster 1

# Sentinel auth (Redis 5+)
requirepass sentinel-secret

# Bind and port
bind 0.0.0.0
port 26379`,
    },
    {
      label: 'Replication Info',
      language: 'bash',
      code: `# On master
redis-cli INFO replication
# role:master
# connected_slaves:2
# slave0:ip=192.168.1.11,port=6379,state=online,offset=12345,lag=0
# slave1:ip=192.168.1.12,port=6379,state=online,offset=12344,lag=1
# master_repl_offset:12345
# repl_backlog_size:1048576

# Set up replication manually
redis-cli -h replica-1 REPLICAOF 192.168.1.10 6379

# Promote replica to master (manual failover)
redis-cli -h replica-1 REPLICAOF NO ONE

# Check Sentinel state
redis-cli -h sentinel-1 -p 26379 SENTINEL masters
redis-cli -h sentinel-1 -p 26379 SENTINEL get-master-addr-by-name mymaster`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Connecting clients directly to master IP instead of via Sentinel',
      wrong: 'const redis = new Redis({ host: "192.168.1.10", port: 6379 });',
      right: `const redis = new Redis({
  sentinels: [{ host: 'sentinel-1', port: 26379 }, ...],
  name: 'mymaster',
});`,
      explanation: 'Hardcoding the master IP means clients need to be manually updated after every failover. Connecting via Sentinel lets ioredis automatically discover the new master after failover with no application changes.',
    },
    {
      title: 'Using only 1 or 2 Sentinel instances',
      wrong: '# Only 2 Sentinels — cannot reach quorum if one fails\nsentinel monitor mymaster 192.168.1.10 6379 2',
      right: '# 3 Sentinels across 3 different hosts/AZs — quorum = 2\nsentinel monitor mymaster 192.168.1.10 6379 2',
      explanation: 'With 2 Sentinels and quorum = 2, losing either Sentinel prevents failover decisions (no quorum). Always deploy 3+ Sentinels (odd number) so that one can fail while the remaining still form a quorum.',
    },
    {
      title: 'Writing to a replica accidentally',
      wrong: `// All reads AND writes go to the replica connection
const value = await replicaRedis.get('key');
await replicaRedis.set('key', 'value'); // ERR READONLY You can't write against a read only replica`,
      right: `await masterRedis.set('key', 'value');  // writes to master
const value = await replicaRedis.get('key'); // reads from replica`,
      explanation: 'Replicas are read-only by default (replica-read-only yes). Writes must go to the master. Use separate client instances for reads (replica) and writes (master via Sentinel).',
    },
  ];

  challenge: Challenge = {
    title: 'Replication Lag Monitor',
    language: 'typescript',
    description: 'Write `getReplicationLag(redis)` that parses `INFO replication` and returns an array of `{ ip, port, lag }` objects for each connected replica. Flag replicas with `lag > 5` seconds as `{ ip, port, lag, stale: true }`.',
    hints: [
      'INFO replication returns lines like: slave0:ip=x,port=y,state=online,offset=z,lag=N',
      'Parse comma-separated key=value pairs for each slave line',
    ],
    starterCode: `import Redis from 'ioredis';

async function getReplicationLag(redis: Redis): Promise<Array<{
  ip: string; port: number; lag: number; stale: boolean;
}>> {}`,
    solution: `import Redis from 'ioredis';

async function getReplicationLag(redis: Redis) {
  const raw = await redis.info('replication');
  return raw.split('\\r\\n')
    .filter(l => l.startsWith('slave'))
    .map(line => {
      const kv = Object.fromEntries(line.split(':')[1].split(',').map(p => p.split('=')));
      const lag = parseInt(kv['lag'] ?? '0', 10);
      return { ip: kv['ip'], port: parseInt(kv['port'], 10), lag, stale: lag > 5 };
    });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the minimum number of Sentinel instances recommended for production?',
      options: ['1', '2', '3', '5'],
      answer: 2,
      explanation: '3 Sentinels (odd number) with quorum 2 is the minimum recommended setup. This allows one Sentinel to fail while the remaining two can still form quorum and make failover decisions.',
    },
    {
      q: 'What happens to in-flight writes during a Sentinel failover?',
      options: [
        'All writes complete normally',
        'Writes that haven\'t replicated to the new master may be lost',
        'Redis buffers writes until the failover completes',
        'Sentinel retries all failed writes automatically',
      ],
      answer: 1,
      explanation: 'Because Redis replication is asynchronous, writes acknowledged by the old master but not yet replicated to the new master can be lost during failover. min-replicas-to-write reduces this risk at the cost of availability.',
    },
    {
      q: 'What is the minimum number of Sentinels for a reliable Redis Sentinel setup?',
      options: ['1', '2', '3', '5'],
      answer: 2,
      explanation: '3 Sentinels is the minimum for quorum-based failover. With 2, losing one leaves 1 Sentinel which cannot form a quorum. 3 Sentinels means losing 1 still allows 2 to agree. Place Sentinels on separate machines/failure domains.',
    },
    {
      q: 'What does REPLICAOF command do?',
      options: ['Creates a cluster partition', 'Makes the current Redis instance a replica of the specified master', 'Promotes a replica to master', 'Disconnects from the current master'],
      answer: 1,
      explanation: 'REPLICAOF host port makes the current instance replicate from the specified master. REPLICAOF NO ONE promotes it to a standalone master (used during failover). Previously called SLAVEOF.',
    },
    {
      q: 'What is the quorum setting in Redis Sentinel?',
      options: ['Maximum replicas per master', 'Minimum number of Sentinels that must agree a master is down before triggering failover', 'The number of writes required before acknowledging', 'The timeout for replica sync'],
      answer: 1,
      explanation: 'quorum is the minimum Sentinels that must agree the master is unreachable (marking it subjective down). If quorum is met, one Sentinel is elected leader to run the failover. Set quorum to majority of Sentinel count.',
    },
    {
      q: 'How does Redis replication handle data on a new replica?',
      options: ['Replication starts from a specific OFFSET provided by the master', 'Master performs BGSAVE, sends the RDB file to the replica, then streams the write backlog', 'Replica copies keys one by one over time', 'Replication requires manual data export and import'],
      answer: 1,
      explanation: 'Full sync: master generates RDB snapshot (BGSAVE) and streams it to the replica while buffering new writes. Replica loads RDB then applies the buffered commands. Subsequent incremental replication uses a replication offset and backlog.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Sentinel select which replica to promote during failover?',
      a: 'Sentinel ranks eligible replicas by: (1) replica-priority config (lower = preferred; 0 = never promote); (2) replication offset (most up-to-date wins); (3) run ID as a tiebreaker. Replicas with SDOWN status or that have been disconnected for longer than down-after-milliseconds × 10 are excluded from selection.',
    },
    {
      q: 'How does Redis replication work at a high level?',
      a: 'Replica connects to master and requests replication. Master forks (BGSAVE), streams the RDB snapshot to replica, then sends the replication backlog (buffered writes since fork). Replica loads RDB and applies backlog. Ongoing: replica receives a replication stream. On reconnect, replica uses replication offset to request only missed commands (partial sync).',
    },
    {
      q: 'What is the replication backlog in Redis?',
      a: 'The replication backlog (<code>repl-backlog-size</code>, default 1MB) is a circular buffer on the master storing recent write commands. On replica reconnect, if the replica offset is still within the backlog, partial resync happens (much faster than full RDB sync). Increase backlog size for replicas with unreliable connections or high write rates.',
    },
    {
      q: 'How does Redis Sentinel detect and handle master failure?',
      a: 'Sentinels ping the master every second. If no response within <code>down-after-milliseconds</code>, the Sentinel marks it subjective down. If a quorum of Sentinels agree, it is objective down. A Sentinel leader is elected, selects the best replica (lowest replication lag), promotes it with REPLICAOF NO ONE, and configures other replicas and Sentinels to follow the new master.',
    },
    {
      q: 'How do client libraries connect to Redis via Sentinel?',
      a: 'Client connects to any Sentinel, asks for the master address: <code>SENTINEL get-master-addr-by-name mymaster</code>. Client then connects to the returned master address. On failover, Sentinel publishes <code>+switch-master</code> event. Smart clients (ioredis, Jedis) subscribe to this and automatically reconnect to the new master without application code changes.',
    },
    {
      q: 'What is min-replicas-to-write in Redis?',
      a: '<code>min-replicas-to-write N</code> and <code>min-replicas-max-lag S</code>: the master refuses writes if fewer than N replicas are connected with lag <= S seconds. This prevents data divergence in split-brain scenarios — master stops accepting writes when too few replicas are replicating. Trade-off: availability vs consistency guarantee.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Replication streams writes from master to replicas asynchronously; Sentinel monitors the master and auto-promotes a replica on failure — always use 3+ Sentinels and connect via Sentinel, not hardcoded IPs.',
    mustKnow: [
      'Replication is async — small data loss possible if master crashes before propagation',
      'Sentinel quorum: majority must agree master is down before initiating failover',
      'Always 3+ Sentinel instances (odd number) across different hosts/AZs',
      'Connect clients via Sentinel API, not hardcoded master IP',
      'min-replicas-to-write increases durability but reduces write availability',
      'Sentinel vs Cluster: Sentinel = HA for one master; Cluster = HA + sharding',
    ],
    interviewFocus: [
      'How does Redis Sentinel detect and respond to master failure?',
      'Why is quorum important and what happens if you only have 2 Sentinels?',
      'Can data be lost during a Sentinel failover? How do you minimise it?',
      'When would you choose Sentinel over Redis Cluster?',
    ],
  };
}
