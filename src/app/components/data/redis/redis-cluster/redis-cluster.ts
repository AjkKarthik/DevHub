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
  selector: 'app-redis-cluster',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './redis-cluster.html',
  styleUrl: './redis-cluster.scss',
})
export class RedisCluster {
  quickRef: QuickRefItem[] = [
    { name: '16384 hash slots', type: 'syntax', desc: 'Total slots in a Redis Cluster; distributed across master nodes' },
    { name: 'CLUSTER INFO', type: 'keyword', desc: 'Cluster state, slots assigned, size, epoch' },
    { name: 'CLUSTER NODES', type: 'keyword', desc: 'List all nodes: id, host:port, role, slots' },
    { name: 'CLUSTER KEYSLOT key', type: 'keyword', desc: 'Hash slot for a given key (0–16383)' },
    { name: '{hashtag} in key name', type: 'syntax', desc: 'Only content in {} is hashed — forces key co-location' },
    { name: 'CLUSTER MEET host port', type: 'keyword', desc: 'Add a new node to the cluster' },
    { name: 'CLUSTER REPLICATE node-id', type: 'keyword', desc: 'Make current node a replica of node-id' },
    { name: 'CLUSTER FAILOVER', type: 'keyword', desc: 'Manually trigger failover on a replica' },
    { name: 'redis-cli --cluster create', type: 'syntax', desc: 'Bootstrap a new cluster across listed nodes' },
    { name: 'MOVED slot host:port', type: 'keyword', desc: 'Redirect response when key is on a different node' },
    { name: 'ASK slot host:port', type: 'keyword', desc: 'Temporary redirect during slot migration' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Hash Slots and Data Distribution',
      points: [
        'Redis Cluster divides the keyspace into 16384 hash slots. Each key maps to a slot via CRC16(key) % 16384. Each master node owns a contiguous range of slots.',
        'With 3 masters: node A owns slots 0–5460, node B 5461–10922, node C 10923–16383 (equal distribution). Slot assignment is configurable and rebalanceable.',
        'Hash tags: if a key name contains `{...}`, only the content inside the braces is hashed. `user:{42}:session` and `user:{42}:profile` both hash to the same slot, guaranteeing they land on the same node.',
        'Hash tags are essential for multi-key commands (MGET, MSET, SUNION, Lua scripts) that must access multiple keys on the same node.',
        'CLUSTER KEYSLOT mykey returns the exact slot (0–16383) for a key — useful for debugging co-location issues.',
      ],
    },
    {
      heading: 'MOVED and ASK Redirects',
      points: [
        'When a client sends a command to the wrong node, the node replies with MOVED slot host:port. The client must retry the command on the correct node.',
        'ASK is a temporary redirect during slot migration. Unlike MOVED, ASK means "go to this node for this command only" — the slot assignment is not yet complete.',
        'Smart clients (like ioredis) maintain a slot map, route commands to the correct node automatically, and update the map on MOVED responses. This eliminates extra round-trips in normal operation.',
        'A single CROSSSLOT error occurs when a command addresses multiple keys from different slots — multi-key commands require all keys to be in the same slot (use hash tags).',
      ],
    },
    {
      heading: 'Cluster Topology and HA',
      points: [
        'Each master has one or more replicas. If a master fails, its replica is promoted automatically (no Sentinel needed — Cluster handles failover internally).',
        'Minimum viable cluster: 3 masters + 3 replicas (6 nodes total). A cluster can tolerate at most one master failure per slot range at a time.',
        'Cluster state: CLUSTER INFO shows `cluster_state:ok` (healthy) or `cluster_state:fail` (some slots unassigned). Writes are rejected during cluster failure.',
        'node.conf is auto-generated and maintained by Redis Cluster — do not edit manually. It records cluster membership and slot assignments persistently.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cluster Client (ioredis)',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// Cluster client — auto-discovers all nodes from the seed list
const cluster = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
], {
  redisOptions: { password: 'redis-secret' },
  clusterRetryStrategy: (times) => Math.min(times * 100, 3000),
  scaleReads: 'slave', // send reads to replicas
});

cluster.on('ready', () => console.log('Cluster connected'));
cluster.on('error', (err) => console.error('Cluster error:', err));

// Normal commands work — ioredis routes to correct node
await cluster.set('user:42:name', 'Alice');
const name = await cluster.get('user:42:name');

// Hash tags ensure co-location for multi-key commands
await cluster.mset('{user:42}:name', 'Alice', '{user:42}:email', 'alice@example.com');
const [n, e] = await cluster.mget('{user:42}:name', '{user:42}:email');`,
    },
    {
      label: 'Bootstrap Cluster',
      language: 'bash',
      code: `# Create a 6-node cluster (3 masters, 3 replicas)
redis-cli --cluster create \\
  192.168.1.10:6379 \\
  192.168.1.11:6379 \\
  192.168.1.12:6379 \\
  192.168.1.13:6379 \\
  192.168.1.14:6379 \\
  192.168.1.15:6379 \\
  --cluster-replicas 1

# Check cluster state
redis-cli -h 192.168.1.10 -p 6379 CLUSTER INFO
redis-cli -h 192.168.1.10 -p 6379 CLUSTER NODES

# Check which slot a key maps to
redis-cli -h 192.168.1.10 CLUSTER KEYSLOT "user:42"

# Rebalance slots (e.g. after adding a node)
redis-cli --cluster rebalance 192.168.1.10:6379`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Multi-key commands without hash tags',
      wrong: `// Keys on different slots — CROSSSLOT error
await cluster.mset('user:42:name', 'Alice', 'user:42:email', 'alice@example.com');`,
      right: `// Hash tags force both keys to the same slot
await cluster.mset('{user:42}:name', 'Alice', '{user:42}:email', 'alice@example.com');`,
      explanation: 'Multi-key commands (MSET, MGET, SUNION, Lua scripts, MULTI/EXEC across keys) require all keys to be in the same slot. Use hash tags `{tag}` in key names to guarantee co-location.',
    },
    {
      title: 'Connecting to only one Cluster node',
      wrong: 'const redis = new Redis({ host: "redis-node-1", port: 6379 }); // standalone client',
      right: `const cluster = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
]);`,
      explanation: 'A standalone Redis client connected to one Cluster node will receive MOVED redirects but cannot follow them. Use Redis.Cluster() which maintains the slot map and auto-routes commands.',
    },
    {
      title: 'Expecting Cluster to handle SCAN across all nodes',
      wrong: `// Only scans the node the cursor belongs to
const [cursor, keys] = await cluster.scan('0', 'MATCH', 'user:*', 'COUNT', 100);`,
      right: `// Scan all master nodes individually
const masters = cluster.nodes('master');
const allKeys: string[] = [];
for (const node of masters) {
  let cursor = '0';
  do {
    const [c, batch] = await node.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100);
    allKeys.push(...batch); cursor = c;
  } while (cursor !== '0');
}`,
      explanation: 'SCAN in Cluster mode iterates a single node\'s keyspace. To scan all keys across the cluster, you must run SCAN on each master node independently and combine results.',
    },
  ];

  challenge: Challenge = {
    title: 'Cluster Slot Validator',
    language: 'typescript',
    description: 'Write `validateCoLocation(cluster, keys)` that checks whether all provided keys hash to the same slot. Return `{ sameSlot: boolean, slots: Record<string, number> }` where `slots` maps each key to its slot number. Use CLUSTER KEYSLOT.',
    hints: [
      'cluster.sendCommand on a specific node: cluster.nodes("master")[0].cluster("KEYSLOT", key)',
      'All slots must be equal for sameSlot to be true',
    ],
    starterCode: `import Redis from 'ioredis';

async function validateCoLocation(cluster: Redis.Cluster, keys: string[]) {
  // implement
}`,
    solution: `import Redis from 'ioredis';

async function validateCoLocation(cluster: Redis.Cluster, keys: string[]) {
  const node = cluster.nodes('master')[0];
  const slots: Record<string, number> = {};
  for (const key of keys) {
    slots[key] = await node.cluster('KEYSLOT', key) as number;
  }
  const values = Object.values(slots);
  const sameSlot = values.every(s => s === values[0]);
  return { sameSlot, slots };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How many hash slots does Redis Cluster use?',
      options: ['1024', '4096', '16384', '65536'],
      answer: 2,
      explanation: 'Redis Cluster uses 16384 hash slots. Keys are assigned to slots via CRC16(key) % 16384. Each master node owns a range of slots.',
    },
    {
      q: 'What does a CROSSSLOT error mean?',
      options: [
        'A slot is being migrated to another node',
        'A multi-key command accesses keys from different hash slots',
        'The cluster has an odd number of nodes',
        'A MOVED redirect failed',
      ],
      answer: 1,
      explanation: 'CROSSSLOT error occurs when a multi-key command (MGET, MSET, Lua script, etc.) accesses keys that belong to different hash slots — and thus different nodes. Use hash tags to force co-location.',
    },
    {
      q: 'How many hash slots does Redis Cluster have?',
      options: ['1024', '4096', '16384', '65536'],
      answer: 2,
      explanation: 'Redis Cluster uses 16384 hash slots. Keys are mapped to slots using CRC16(key) % 16384. Slots are distributed across master nodes. The number 16384 was chosen to fit the cluster config in a small gossip message.',
    },
    {
      q: 'What happens when a Redis Cluster command accesses keys on different slots?',
      options: ['Redis automatically redirects to the correct node', 'The command returns a CROSSSLOT error — multi-key commands require all keys in the same slot', 'Redis executes the command on the node with the most keys', 'Multi-key commands are queued and executed later'],
      answer: 1,
      explanation: 'Redis Cluster requires all keys in a multi-key command to be in the same slot. Use hash tags {user1} to force key co-location: keys like {user1}:session and {user1}:profile share the slot of user1.',
    },
    {
      q: 'What is CLUSTER KEYSLOT and when do you use it?',
      options: ['Lists all keys in a given slot', 'Returns the hash slot for a given key — useful for debugging co-location and verifying hash tags', 'Migrates a slot between nodes', 'Returns cluster topology'],
      answer: 1,
      explanation: 'CLUSTER KEYSLOT key returns the integer slot (0-16383) that the key maps to. Use it to verify that keys with hash tags land in the same slot: CLUSTER KEYSLOT {user1}:a and CLUSTER KEYSLOT {user1}:b should return the same value.',
    },
    {
      q: 'What is the minimum number of master nodes required for Redis Cluster?',
      options: ['1', '2', '3', '6'],
      answer: 2,
      explanation: 'Redis Cluster requires at least 3 master nodes for quorum-based failure detection. With 3 masters you can also have 3 replicas (one per master) for a typical 6-node production cluster with failover capability.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use Redis Cluster with a single-node Redis client library?',
      a: 'Technically yes — a single-node client will receive MOVED redirects and can manually follow them. But this is inefficient (extra round-trips) and error-prone. Use a Cluster-aware client (ioredis Redis.Cluster, node-redis in cluster mode) that maintains a slot map and auto-routes commands to the correct node. Cluster-aware clients also handle ASK redirects during slot migrations.',
    },
    {
      q: 'What is a hash tag in Redis Cluster and why do you use it?',
      a: 'A hash tag is the substring between <code>{}</code> in a key name. Only the tagged part is hashed for slot assignment. Example: <code>{user:1001}:session</code> and <code>{user:1001}:profile</code> both hash <code>user:1001</code> — landing in the same slot. This enables multi-key operations on related data without CROSSSLOT errors.',
    },
    {
      q: 'How do you add a new node to a Redis Cluster?',
      a: 'Use <code>redis-cli --cluster add-node new-node:6379 existing-node:6379</code>. Then rebalance slot distribution: <code>redis-cli --cluster rebalance existing-node:6379</code> or manually migrate slots with <code>--cluster reshard</code>. New nodes start empty — slots must be migrated before they serve traffic. Add replicas with --cluster-slave flag.',
    },
    {
      q: 'What happens during a Redis Cluster failover?',
      a: 'When a master fails: replicas detect failure via gossip protocol after <code>cluster-node-timeout</code>. A replica starts a failover election — collects votes from other masters. Majority vote → replica promotes to master and updates cluster config. Slots owned by the failed master are now served by the new master. Clients receive MOVED/ASK redirects.',
    },
    {
      q: 'What are MOVED and ASK errors in Redis Cluster?',
      a: '<strong>MOVED error</strong>: the key is permanently in the indicated node — update your routing table and retry. <strong>ASK error</strong>: the key is being migrated (slot resharding in progress) — send ASKING to the new node and retry once. MOVED is permanent; ASK is transient. Smart clients (ioredis, Jedis) handle these automatically.',
    },
    {
      q: 'What consistency model does Redis Cluster provide?',
      a: 'Redis Cluster provides <strong>eventual consistency</strong> — asynchronous replication means recent writes to a master can be lost if it fails before replicating. <strong>cluster-require-full-coverage yes</strong> (default): cluster rejects writes if any slot is unavailable. <strong>no</strong>: continues serving available slots. Use WAIT command to request synchronous replica acknowledgment when consistency matters.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '16384 hash slots distributed across masters; hash tags `{tag}` force co-location; MOVED/ASK redirects route commands; scan all master nodes individually for full keyspace iteration.',
    mustKnow: [
      '16384 slots; CRC16(key) % 16384 determines slot; each master owns a range',
      'Hash tags {tag}: only tag content is hashed — forces key co-location',
      'CROSSSLOT error: multi-key commands must access keys on the same slot',
      'Use Cluster-aware clients (Redis.Cluster) — handles MOVED/ASK automatically',
      'SCAN in Cluster must be run on each master separately',
      'Minimum cluster: 3 masters + 3 replicas; built-in failover (no Sentinel needed)',
    ],
    interviewFocus: [
      'How does Redis Cluster shard data across nodes?',
      'What are hash tags and why are they needed?',
      'Explain MOVED vs ASK redirects',
      'How do you scan all keys in a Redis Cluster?',
    ],
  };
}
