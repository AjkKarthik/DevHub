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
  selector: 'app-redis-eviction-policies',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './eviction-policies.html',
  styleUrl: './eviction-policies.scss',
})
export class RedisEvictionPolicies {
  quickRef: QuickRefItem[] = [
    { name: 'maxmemory <bytes>', type: 'syntax', desc: 'Maximum memory limit (e.g. 4gb, 512mb). 0 = no limit' },
    { name: 'noeviction', type: 'keyword', desc: 'Return error on writes when memory full — default policy' },
    { name: 'allkeys-lru', type: 'keyword', desc: 'Evict least recently used keys from the entire keyspace' },
    { name: 'volatile-lru', type: 'keyword', desc: 'Evict LRU keys that have a TTL set' },
    { name: 'allkeys-lfu', type: 'keyword', desc: 'Evict least frequently used keys from entire keyspace (Redis 4+)' },
    { name: 'volatile-lfu', type: 'keyword', desc: 'Evict LFU keys that have a TTL set' },
    { name: 'allkeys-random', type: 'keyword', desc: 'Evict a random key from the entire keyspace' },
    { name: 'volatile-random', type: 'keyword', desc: 'Evict a random key that has a TTL set' },
    { name: 'volatile-ttl', type: 'keyword', desc: 'Evict keys closest to expiry first' },
    { name: 'maxmemory-samples 5', type: 'syntax', desc: 'Number of keys sampled per eviction — higher = more accurate, slower' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Eviction Policies Matter',
      points: [
        'When Redis reaches its maxmemory limit, it must either reject writes (noeviction) or remove existing keys to make room. The eviction policy determines which keys are removed.',
        'Without a maxmemory limit (default), Redis will grow until the OS OOM-killer terminates it. Always set maxmemory in production.',
        'Eviction only triggers on write commands (SET, LPUSH, etc.) — Redis checks memory pressure before each write and evicts if needed.',
        'Redis uses a probabilistic approximation of LRU/LFU — it samples maxmemory-samples random keys and evicts the worst candidate. It does not maintain a true LRU list (that would be O(N) memory overhead).',
        'The correct policy depends on your use case: pure cache → allkeys-lru or allkeys-lfu; mixed cache+persistent → volatile-lru; session store → volatile-ttl.',
      ],
    },
    {
      heading: 'LRU vs LFU',
      points: [
        'LRU (Least Recently Used): evicts the key that has not been accessed for the longest time. Good for temporal locality — recently accessed data is more likely to be needed again.',
        'LFU (Least Frequently Used, Redis 4+): evicts the key accessed the fewest times overall, with a time-decaying counter. Better for "popularity" patterns where some keys are always hot.',
        'LFU uses a Morris counter (8-bit logarithmic counter) per key — memory overhead is minimal. The decay rate is configurable: `lfu-decay-time 1` (minutes per counter decrement).',
        'For most caching workloads, allkeys-lru is a safe default. Switch to allkeys-lfu when you have clear hot vs cold key distributions (e.g. product catalogue where top items are always popular).',
      ],
    },
    {
      heading: 'Volatile vs Allkeys',
      points: [
        'volatile-* policies only consider keys with a TTL set. If you have keys without TTL, they are never evicted — useful for mixing persistent data (no TTL) with cache data (with TTL) in the same instance.',
        'allkeys-* policies consider the entire keyspace — even keys with no TTL can be evicted. Use for a pure cache where all data is expendable.',
        'If volatile-* is selected and all keys have no TTL, Redis falls back to noeviction behaviour.',
        'volatile-ttl evicts keys with the shortest remaining TTL first — a pragmatic choice when keys already have TTLs and you want the "most expired" keys gone first.',
      ],
    },
    {
      heading: 'Choosing the Right Eviction Policy for Your Workload',
      points: [
        'allkeys-lru evicts the least recently used key across the entire keyspace when memory limit is reached — appropriate for a pure cache use case where any key could reasonably be evicted and recency of access is the best predictor of future access.',
        'volatile-lru only evicts among keys that have an explicit TTL set, leaving keys without expiration untouched — useful when Redis holds a mix of genuinely persistent data (no TTL) and cacheable, evictable data (with TTL) in the same instance.',
        'noeviction (the default) rejects write commands once memory limit is reached rather than evicting anything — appropriate when Redis is being used as a primary data store where silently losing data via eviction would be unacceptable, accepting write failures instead.',
        'Monitoring evicted_keys in Redis INFO output over time reveals whether the configured maxmemory is genuinely sufficient for the workload — a steadily growing eviction count indicates the cache is under memory pressure and either needs more memory or a review of what is being cached.',
      ],
    },
    {
      heading: 'Sampling-Based LRU Approximation',
      points: [
        'Redis does not implement true LRU (which would require tracking exact access order for every key, an expensive operation) — instead it uses an approximated LRU algorithm that samples a small random set of keys and evicts the least recently used among that sample.',
        'The maxmemory-samples configuration controls how many keys are sampled when an eviction decision is needed — a higher sample size produces a closer approximation to true LRU at the cost of slightly more CPU work per eviction, while a lower value is faster but less precise.',
        'This sampling-based approach is a deliberate engineering tradeoff — true LRU tracking would add memory and CPU overhead to every single key access, while the sampling approximation adds overhead only at eviction time and in practice produces eviction decisions close enough to true LRU for most caching workloads.',
        'Redis also offers LFU (Least Frequently Used) eviction policies (allkeys-lfu, volatile-lfu) as an alternative to LRU — LFU tracks access frequency rather than recency, which can produce better eviction decisions for workloads where some keys are accessed very frequently but not necessarily most recently.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'redis.conf Configuration',
      language: 'bash',
      code: `# Set memory limit
maxmemory 4gb

# For pure cache (all data is expendable)
maxmemory-policy allkeys-lru

# For mixed persistent + cache (only evict keys with TTL)
# maxmemory-policy volatile-lru

# For popularity-based eviction (Redis 4+)
# maxmemory-policy allkeys-lfu
# lfu-decay-time 1     # decay counter every 1 minute
# lfu-log-factor 10    # how fast counter increments slow down

# Sampling for LRU/LFU approximation (higher = more accurate, slower)
maxmemory-samples 5

# Check eviction stats
# INFO stats | grep evicted_keys`,
    },
    {
      label: 'Monitor Evictions',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

async function getMemoryStats() {
  const [memory, stats] = await Promise.all([
    redis.info('memory'),
    redis.info('stats'),
  ]);

  const parse = (raw: string) => Object.fromEntries(
    raw.split('\\r\\n').filter(l => l.includes(':')).map(l => l.split(':'))
  );

  const mem = parse(memory);
  const st = parse(stats);

  return {
    usedMemoryMB: Math.round(parseInt(mem['used_memory']) / 1024 / 1024),
    maxMemoryMB: Math.round(parseInt(mem['maxmemory'] ?? '0') / 1024 / 1024),
    memFragRatio: parseFloat(mem['mem_fragmentation_ratio']),
    evictedKeys: parseInt(st['evicted_keys']),
    evictionPolicy: mem['maxmemory_policy'],
  };
}

// Set policy at runtime (takes effect immediately)
async function setEvictionPolicy(policy: string) {
  await redis.config('SET', 'maxmemory-policy', policy);
  await redis.config('SET', 'maxmemory', '4gb');
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not setting maxmemory in production',
      wrong: '# redis.conf — no maxmemory line\n# Redis grows unbounded until OS kills it with OOM',
      right: 'maxmemory 4gb\nmaxmemory-policy allkeys-lru',
      explanation: 'Without maxmemory, Redis will consume all available RAM. The OS OOM killer will then terminate Redis, causing data loss and downtime. Always set maxmemory appropriate to your server\'s available RAM (typically 60-80% of total RAM).',
    },
    {
      title: 'Using noeviction as a cache policy',
      wrong: `maxmemory 2gb
maxmemory-policy noeviction  # returns OOM errors when cache is full`,
      right: `maxmemory 2gb
maxmemory-policy allkeys-lru  # evicts old cache entries automatically`,
      explanation: 'noeviction (the default) is appropriate for persistent data stores where you never want data silently removed. For caches, use allkeys-lru or allkeys-lfu so Redis manages memory automatically without crashing client applications.',
    },
    {
      title: 'Using volatile-lru with keys that have no TTL',
      wrong: `maxmemory-policy volatile-lru
SET permanent:config "value"   # no TTL — never evicted
SET cache:user:42 "data"       # no TTL — also never evicted!
# Redis memory fills; falls back to noeviction behaviour`,
      right: `maxmemory-policy volatile-lru
SET permanent:config "value"         # no TTL — never evicted (intentional)
SET cache:user:42 "data" EX 300      # has TTL — evictable under pressure`,
      explanation: 'volatile-lru only evicts keys with TTL. Keys without TTL are invisible to the eviction algorithm. If your "cache" keys have no TTL, volatile-lru behaves like noeviction for those keys. Always set TTL on cache keys when using volatile-* policies.',
    },
  ];

  challenge: Challenge = {
    title: 'Memory Pressure Alert',
    language: 'typescript',
    description: 'Write `checkMemoryPressure(redis)` that returns `{ usedPct, policy, warning }` where `usedPct` is `usedMemory / maxmemory * 100` and `warning` is a string if `usedPct > 80` or eviction policy is `noeviction`. Return `null` for `warning` if healthy.',
    hints: [
      'redis.info("memory") returns a multi-line string',
      'Parse used_memory, maxmemory, maxmemory_policy from the info output',
    ],
    starterCode: `import Redis from 'ioredis';

async function checkMemoryPressure(redis: Redis): Promise<{
  usedPct: number;
  policy: string;
  warning: string | null;
}> {}`,
    solution: `import Redis from 'ioredis';

async function checkMemoryPressure(redis: Redis) {
  const raw = await redis.info('memory');
  const lines = Object.fromEntries(
    raw.split('\\r\\n').filter(l => l.includes(':')).map(l => l.split(':'))
  );
  const used = parseInt(lines['used_memory'], 10);
  const max = parseInt(lines['maxmemory'] ?? '0', 10);
  const policy = lines['maxmemory_policy'] ?? 'unknown';
  const usedPct = max > 0 ? Math.round((used / max) * 100) : 0;
  let warning: string | null = null;
  if (policy === 'noeviction') warning = 'noeviction policy: writes will fail when memory is full';
  else if (usedPct > 80) warning = \`Memory at \${usedPct}% — evictions likely under write pressure\`;
  return { usedPct, policy, warning };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which eviction policy should you use for a pure in-memory cache where all data is expendable?',
      options: ['noeviction', 'volatile-lru', 'allkeys-lru', 'volatile-ttl'],
      answer: 2,
      explanation: 'allkeys-lru evicts the least recently used key from the entire keyspace — suitable for a pure cache where any key can be evicted and reloaded from the source on a miss.',
    },
    {
      q: 'What is the difference between LRU and LFU eviction?',
      options: [
        'LRU is for keys with TTL; LFU is for all keys',
        'LRU evicts least recently used; LFU evicts least frequently used',
        'LRU is available from Redis 4+; LFU from Redis 2+',
        'No difference — aliases',
      ],
      answer: 1,
      explanation: 'LRU removes the key not accessed for the longest time (recency). LFU removes the key accessed the fewest times overall (frequency, with time decay). LFU is better for workloads with clear hot/cold distributions.',
    },
    {
      q: 'What does the volatile-lru eviction policy do?',
      options: ['Evicts any key using LRU', 'Evicts the least recently used key that has a TTL set', 'Evicts keys with the shortest TTL', 'Evicts all volatile (TTL) keys randomly'],
      answer: 1,
      explanation: 'volatile-lru only considers keys with an expiry set and removes the least recently used among them. Keys without TTL are never evicted. Use when you want to protect permanent data while caching ephemeral data.',
    },
    {
      q: 'What happens when Redis reaches maxmemory with noeviction policy?',
      options: ['Redis deletes the oldest key', 'Redis returns an OOM error on write commands', 'Redis writes to disk', 'Redis restarts automatically'],
      answer: 1,
      explanation: 'With noeviction, Redis returns an error for writes (SET, LPUSH, etc.) when maxmemory is reached. Reads still work. Use this when you cannot tolerate data loss — your app handles the OOM error explicitly.',
    },
    {
      q: 'What is LFU (Least Frequently Used) eviction in Redis?',
      options: ['Evicts keys that expire soonest', 'Evicts keys accessed fewest times over time, using a counter with decay', 'Evicts the largest keys first', 'Evicts randomly among all keys'],
      answer: 1,
      explanation: 'LFU tracks access frequency with a logarithmic counter that decays over time. Keys accessed rarely are evicted before recently-popular-but-less-frequent keys. Better than LRU for Zipfian distributions. Available as allkeys-lfu or volatile-lfu.',
    },
    {
      q: 'What does allkeys-random eviction do?',
      options: ['Removes the key with the longest TTL', 'Randomly removes any key regardless of TTL or access pattern', 'Removes random keys that have TTLs', 'Same as volatile-random but only for new keys'],
      answer: 1,
      explanation: 'allkeys-random removes a random key from the entire keyspace when maxmemory is reached. Useful when your workload is uniform and you do not need LRU/LFU approximations — simpler and marginally faster than LRU sampling.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How much memory overhead does Redis add on top of stored data?',
      a: 'Redis stores metadata per key: pointer + key string + value object + LRU/LFU field + expiry entry. For small strings, the overhead can be 50-100 bytes per key — sometimes more than the value itself. For large values the overhead is proportionally smaller. Monitor `mem_fragmentation_ratio` (ideally 1.0–1.5). A high ratio (>2) indicates fragmentation; use MEMORY PURGE or restart to reclaim.',
    },
    {
      q: 'How do you choose the right eviction policy for a Redis cache?',
      a: '<strong>allkeys-lru</strong>: all keys are cache entries — use when every key can be evicted. <strong>volatile-lru</strong>: mix of cache (TTL) and persistent data (no TTL). <strong>allkeys-lfu</strong>: hot keys re-used frequently (Zipfian distribution). <strong>noeviction</strong>: queues, sessions — never lose data (handle OOM in app instead).',
    },
    {
      q: 'What is volatile-ttl eviction?',
      a: 'volatile-ttl evicts the key with the shortest remaining TTL when maxmemory is reached. Logic: keys about to expire anyway are the best candidates for early eviction. Only considers keys with TTL set; keys without TTL are never evicted by this policy.',
    },
    {
      q: 'How does Redis approximate LRU instead of true LRU?',
      a: 'True LRU requires tracking access order for all keys — expensive. Redis uses sampling: pick N random keys (default maxmemory-samples=5), evict the least recently accessed from that sample. More samples = more accurate but slower eviction. LFU uses a logarithmic counter per key with time decay.',
    },
    {
      q: 'How do you monitor what Redis is evicting?',
      a: '<code>INFO stats</code> shows <strong>evicted_keys</strong> counter. Monitor cache hit rate: <code>keyspace_hits / (keyspace_hits + keyspace_misses)</code>. High evictions + high miss rate = maxmemory too low. Use Redis keyspace notifications with expired event to react to evictions in real time.',
    },
    {
      q: 'Should you always set maxmemory in Redis?',
      a: 'Yes — always set maxmemory in production. Without it Redis uses all available RAM, potentially causing OS-level OOM kills or swapping (which destroys Redis performance). Set to 70-80% of available RAM. Configure via redis.conf or dynamically: <code>CONFIG SET maxmemory 4gb</code>. Always pair with an eviction policy.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Always set maxmemory + eviction policy; allkeys-lru for pure cache; volatile-lru for mixed; LFU outperforms LRU for popularity-skewed workloads.',
    mustKnow: [
      'maxmemory must be set in production — default is no limit (OOM risk)',
      'noeviction (default) returns errors on writes when full — wrong for caches',
      'allkeys-lru: evicts any key by recency — safe default for pure caches',
      'volatile-* only evicts keys with TTL — never mix TTL-less keys in volatile mode',
      'LFU (Redis 4+) better for hot/cold key skew; LRU better for temporal locality',
      'maxmemory-samples: higher = more accurate eviction, higher CPU cost',
    ],
    interviewFocus: [
      'What happens when Redis runs out of memory with noeviction policy?',
      'When would you choose allkeys-lfu over allkeys-lru?',
      'Explain volatile-lru vs allkeys-lru',
      'How does Redis approximate LRU without a full LRU list?',
    ],
  };
}
