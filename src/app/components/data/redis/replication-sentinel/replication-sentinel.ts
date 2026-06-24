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
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Sentinel select which replica to promote during failover?',
      a: 'Sentinel ranks eligible replicas by: (1) replica-priority config (lower = preferred; 0 = never promote); (2) replication offset (most up-to-date wins); (3) run ID as a tiebreaker. Replicas with SDOWN status or that have been disconnected for longer than down-after-milliseconds × 10 are excluded from selection.',
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
