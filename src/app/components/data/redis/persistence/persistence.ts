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
  selector: 'app-redis-persistence',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './persistence.html',
  styleUrl: './persistence.scss',
})
export class RedisPersistence {
  quickRef: QuickRefItem[] = [
    { name: 'save 3600 1 300 100 60 10000', type: 'syntax', desc: 'RDB snapshot triggers (redis.conf): time window + dirty key count' },
    { name: 'BGSAVE', type: 'keyword', desc: 'Fork a child process to write RDB snapshot in background' },
    { name: 'BGREWRITEAOF', type: 'keyword', desc: 'Rewrite AOF file in background (compaction)' },
    { name: 'LASTSAVE', type: 'keyword', desc: 'Unix timestamp of last successful RDB save' },
    { name: 'appendonly yes', type: 'syntax', desc: 'Enable AOF persistence in redis.conf' },
    { name: 'appendfsync always|everysec|no', type: 'syntax', desc: 'AOF fsync policy: durability vs performance' },
    { name: 'aof-use-rdb-preamble yes', type: 'syntax', desc: 'Hybrid mode: RDB header + AOF tail for fast load' },
    { name: 'DEBUG SLEEP 0', type: 'keyword', desc: 'Used in testing; SAVE forces synchronous RDB write' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'RDB — Point-in-Time Snapshots',
      points: [
        'RDB (Redis Database) writes the entire dataset as a compact binary snapshot to disk. Redis forks a child process (BGSAVE) so the parent keeps serving requests while the child writes.',
        'Snapshot triggers are configured via save rules in redis.conf: `save 900 1` means "save if at least 1 key changed in 900 seconds". Multiple rules are OR-ed.',
        'Advantages: compact file, fast restart (no replaying), minimal I/O impact. Disadvantages: data written since the last snapshot is lost on crash.',
        'BGSAVE is non-blocking for the parent — but fork() copies the entire process memory (copy-on-write). On a 32 GB dataset, fork() itself can take milliseconds and cause a latency spike.',
        'RDB files use CRC64 checksums. Corruption is detected at load time. Use `redis-check-rdb dump.rdb` to validate files offline.',
      ],
    },
    {
      heading: 'AOF — Append-Only File',
      points: [
        'AOF logs every write command (in Redis text protocol) as it is executed. On restart, Redis replays the AOF to reconstruct the dataset.',
        'appendfsync controls durability: `always` — fsync after every write (safest, slowest); `everysec` — fsync every second (default, at most 1 second of data loss on crash); `no` — let the OS flush (fastest, most data loss risk).',
        'AOF files grow over time. BGREWRITEAOF compacts the file by rewriting it with the minimal set of commands to recreate the current state (equivalent SETEX instead of a SET + EXPIRE).',
        'auto-aof-rewrite-percentage and auto-aof-rewrite-min-size control automatic compaction.',
        'AOF is more durable than RDB but produces larger files and longer restarts on large datasets.',
      ],
    },
    {
      heading: 'Hybrid Persistence (Recommended)',
      points: [
        'aof-use-rdb-preamble yes (default in Redis 7+) combines both: the AOF file starts with an RDB snapshot followed by AOF commands written after the snapshot. Fast to load (binary RDB preamble) + durable (minimal AOF tail).',
        'This is the recommended mode for production — it provides the restart speed of RDB with the durability of AOF.',
        'When BGREWRITEAOF runs in hybrid mode, it generates the RDB preamble + AOF tail atomically, then atomically replaces the old AOF file.',
      ],
    },
    {
      heading: 'No Persistence Mode',
      points: [
        'Setting `save ""` and `appendonly no` disables all persistence. Redis becomes a pure in-memory cache — all data is lost on restart.',
        'Use no-persistence for ephemeral caches where the source of truth is a database and Redis is purely a performance layer.',
        'Even in no-persistence mode, replication still works — replicas receive data via the replication stream.',
      ],
    },
    {
      heading: 'Combining RDB and AOF for Durability and Recovery Speed',
      points: [
        'RDB (point-in-time snapshots) produces compact files ideal for backups and fast restarts, but can lose data between the last snapshot and a crash — appropriate when some data loss on crash is acceptable and fast restart time matters more than absolute durability.',
        'AOF (Append Only File, logging every write operation) provides much stronger durability — with appropriate fsync settings, at most one second of writes can be lost on crash, at the cost of larger log files and slower restart (since Redis must replay the entire log to rebuild state).',
        'Using both RDB and AOF together (a common production configuration) combines RDB\'s fast restart capability with AOF\'s stronger durability guarantee — Redis loads from AOF on restart when both are enabled, since it more accurately reflects the most recent state.',
        'AOF rewrite (compacting the log file by writing the current dataset state rather than replaying every historical command) prevents the AOF file from growing unboundedly over time — this happens automatically based on configured growth thresholds, or can be triggered manually via BGREWRITEAOF.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'redis.conf Persistence',
      language: 'bash',
      code: `# --- RDB ---
# Save if 1+ keys changed in 3600s, 100+ in 300s, or 10000+ in 60s
save 3600 1
save 300 100
save 60 10000
dbfilename dump.rdb
dir /var/lib/redis

# --- AOF ---
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec         # recommended: 1s max data loss
no-appendfsync-on-rewrite yes  # don't fsync during BGSAVE/BGREWRITEAOF

# --- Hybrid (recommended, default in Redis 7+) ---
aof-use-rdb-preamble yes

# --- Auto AOF rewrite ---
auto-aof-rewrite-percentage 100   # rewrite when AOF is 100% bigger than base
auto-aof-rewrite-min-size 64mb`,
    },
    {
      label: 'Monitoring & Control',
      language: 'bash',
      code: `# Trigger manual save
BGSAVE                    # async (fork child)
SAVE                      # sync — BLOCKS Redis until complete

# Check save status
LASTSAVE                  # Unix timestamp of last successful save
INFO persistence          # full persistence stats:
# rdb_changes_since_last_save: 42
# rdb_bgsave_in_progress: 0
# aof_enabled: 1
# aof_current_size: 12345678
# aof_rewrite_in_progress: 0

# Trigger AOF compaction
BGREWRITEAOF

# Verify RDB file
redis-check-rdb /var/lib/redis/dump.rdb
# Verify AOF file
redis-check-aof --fix /var/lib/redis/appendonly.aof`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running SAVE (blocking) instead of BGSAVE in production',
      wrong: 'SAVE  # blocks Redis event loop for seconds on large datasets',
      right: 'BGSAVE  # forks a child; parent keeps serving commands',
      explanation: 'SAVE is synchronous — Redis cannot process any commands while it runs. On a multi-GB dataset, SAVE can block for many seconds causing client timeouts. Always use BGSAVE in production.',
    },
    {
      title: 'Using appendfsync always without SSDs',
      wrong: 'appendfsync always  # on spinning disk: kills throughput',
      right: 'appendfsync everysec  # 1 second max data loss; good throughput on any disk',
      explanation: 'appendfsync always calls fsync() on every write command. On rotating disks, fsync is ~10ms — meaning max ~100 writes/sec. On SSDs it is viable but still has overhead. everysec is the recommended default.',
    },
    {
      title: 'Disabling save without setting maxmemory policy',
      wrong: `save ""
# no maxmemory policy — Redis fills RAM, then crashes`,
      right: `save ""
maxmemory 4gb
maxmemory-policy allkeys-lru  # evict LRU keys when memory is full`,
      explanation: 'If you disable persistence for a pure cache role, you must configure maxmemory + eviction policy. Without this, Redis will grow until it is OOM-killed by the OS.',
    },
  ];

  challenge: Challenge = {
    title: 'Persistence Health Check',
    language: 'typescript',
    description: 'Write `checkPersistenceHealth(redis)` that uses INFO persistence to return an object: `{ rdbLastSaveAgeSeconds, aofEnabled, aofCurrentSizeMB, needsRewrite }` where `needsRewrite` is true if AOF file is >100 MB.',
    hints: [
      'redis.info("persistence") returns a string of key:value\\r\\n lines',
      'Parse LASTSAVE from the info output; compute age as now - lastSave',
    ],
    starterCode: `import Redis from 'ioredis';

async function checkPersistenceHealth(redis: Redis) {
  // use redis.info('persistence')
}`,
    solution: `import Redis from 'ioredis';

async function checkPersistenceHealth(redis: Redis) {
  const raw = await redis.info('persistence');
  const lines = Object.fromEntries(
    raw.split('\\r\\n').filter(l => l.includes(':')).map(l => l.split(':'))
  );
  const lastSave = parseInt(lines['rdb_last_save_time'] ?? '0', 10);
  const nowSec = Math.floor(Date.now() / 1000);
  const aofSize = parseInt(lines['aof_current_size'] ?? '0', 10);
  return {
    rdbLastSaveAgeSeconds: nowSec - lastSave,
    aofEnabled: lines['aof_enabled'] === '1',
    aofCurrentSizeMB: Math.round(aofSize / 1024 / 1024),
    needsRewrite: aofSize > 100 * 1024 * 1024,
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which appendfsync mode provides the best balance of durability and performance?',
      options: ['always', 'everysec', 'no', 'hybrid'],
      answer: 1,
      explanation: 'appendfsync everysec calls fsync once per second — at most 1 second of data can be lost on crash. It provides good throughput while maintaining reasonable durability.',
    },
    {
      q: 'What is aof-use-rdb-preamble?',
      options: [
        'A Redis Cluster option',
        'Hybrid mode: RDB snapshot + AOF tail for fast load and durability',
        'Compresses the RDB file before writing',
        'Enables AOF for secondary replicas only',
      ],
      answer: 1,
      explanation: 'Hybrid persistence writes an RDB binary snapshot at the head of the AOF file followed by incremental commands. This gives fast restarts (binary RDB) with AOF durability.',
    },
    {
      q: 'What is the key trade-off between RDB and AOF persistence?',
      options: ['RDB is faster for reads; AOF is faster for writes', 'RDB provides compact point-in-time snapshots with potential data loss; AOF logs every write for durability at the cost of larger files and slower restarts', 'AOF is compressed; RDB is plain text', 'RDB replays the log; AOF takes snapshots'],
      answer: 1,
      explanation: 'RDB: smaller file, faster restart, potential data loss (last snapshot to crash). AOF: logs every write (configurable fsync), near-zero data loss, larger file, slower restart due to log replay.',
    },
    {
      q: 'What does appendfsync everysec do?',
      options: ['Flushes AOF to disk every second — potential 1 second of data loss but good performance', 'Flushes AOF to disk on every write command — maximum durability but slowest', 'Lets the OS decide when to flush — fastest but highest data loss risk', 'Disables AOF syncing'],
      answer: 0,
      explanation: 'appendfsync everysec calls fsync every second in a background thread. A crash could lose up to 1 second of writes. It is the recommended balance between performance and durability. always gives maximum durability; no gives best performance.',
    },
    {
      q: 'What is Redis AOF rewrite and why is it needed?',
      options: ['Rewrites the AOF in JSON format for readability', 'Compacts the AOF by replaying current dataset state and writing only the minimal commands needed — reducing file size', 'Splits the AOF into multiple files', 'Converts AOF to RDB format'],
      answer: 1,
      explanation: 'AOF grows indefinitely as every write is logged. BGREWRITEAOF (or auto-triggered by auto-aof-rewrite-percentage) rewrites the AOF by representing the current dataset with minimal commands — removing redundant SET/DEL pairs.',
    },
    {
      q: 'What is Redis hybrid persistence (RDB+AOF)?',
      options: ['Two separate Redis instances — one for RDB, one for AOF', 'Enabling both RDB and AOF: RDB provides a compact snapshot; AOF records changes since the last snapshot — combining fast startup and durability', 'Alternating between RDB and AOF on each restart', 'Writing RDB format inside the AOF file'],
      answer: 1,
      explanation: 'Enable both save (RDB) and appendonly yes (AOF). On restart, Redis prefers AOF if enabled. The aof-use-rdb-preamble option (default on) writes an RDB snapshot at the start of the AOF file for faster restart.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How much extra memory does BGSAVE use?',
      a: 'BGSAVE uses fork() which implements copy-on-write (COW). Initially, the child shares all memory pages with the parent. Pages modified by the parent while the child is writing get copied. In the worst case (all keys written during save), memory usage can temporarily double. Monitor `rdb_current_bgsave_type` and `used_memory` via INFO to track this.',
    },
    {
      q: 'What is the difference between BGSAVE and SAVE?',
      a: '<strong>BGSAVE</strong> forks a child process to write the RDB snapshot — the parent continues serving requests. <strong>SAVE</strong> blocks the entire Redis server while writing RDB — never use in production. BGSAVE is triggered automatically by the save config directive. LASTSAVE returns the Unix timestamp of the last successful RDB.',
    },
    {
      q: 'How does RDB snapshot configuration work in redis.conf?',
      a: 'The <code>save</code> directive triggers BGSAVE: <code>save 900 1</code> (save after 900s if 1 key changed), <code>save 300 10</code>, <code>save 60 10000</code>. Multiple directives are OR-ed. <code>save ""</code> disables RDB. On restart, Redis loads the RDB file first (or AOF if enabled). Use <code>BGSAVE</code> for manual snapshots.',
    },
    {
      q: 'How do you recover Redis data after a crash?',
      a: 'Redis restores from persistence files on startup. If AOF enabled: <code>redis-check-aof --fix appendonly.aof</code> repairs a truncated AOF. If RDB: <code>redis-check-rdb dump.rdb</code> validates it. AOF takes precedence over RDB when both are enabled. Point the data dir to the backup files and restart. Test recovery procedures regularly.',
    },
    {
      q: 'What happens to write commands received WHILE BGREWRITEAOF\'s child process is busy compacting the AOF file in the background?',
      a: 'The parent Redis process keeps appending incoming writes to the OLD AOF file exactly as before, while the child process independently builds the new, compacted AOF from a point-in-time snapshot of the dataset — Redis additionally buffers writes that occur during the rewrite so that once the child finishes, those buffered writes are appended to the new compacted file before it atomically replaces the old one. This is why BGREWRITEAOF does not block or pause write traffic: the parent process continues serving normal read/write commands throughout, and the swap to the new file only happens once it is fully caught up.',
    },
    {
      q: 'If aof-use-rdb-preamble is disabled, what happens to AOF rewrite and restart behavior compared to leaving it enabled?',
      a: 'With the preamble disabled, an AOF rewrite produces a file containing only plain-text Redis commands (no binary RDB snapshot at the start) — every single command needed to reconstruct the dataset must be written out and, on restart, replayed one at a time, which is both a larger file and a substantially slower restart for large datasets compared to the hybrid format. This option exists mainly for compatibility with older tooling that expects a pure-AOF text format (some external log-parsing tools couldn\'t handle the binary RDB preamble) — for virtually all modern deployments, leaving the default (enabled) is preferred for faster restarts.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'RDB = periodic binary snapshots (fast restart, data loss risk); AOF = command log (durable, slow restart); Hybrid = RDB preamble + AOF tail (recommended for production).',
    mustKnow: [
      'RDB: fork-based snapshots; BGSAVE is async; data since last save is lost on crash',
      'AOF: logs every write; appendfsync everysec = 1s max loss',
      'Hybrid (aof-use-rdb-preamble): fast load + durable — recommended default',
      'BGSAVE is non-blocking; SAVE blocks — never use SAVE in production',
      'Always set maxmemory + eviction policy when using no-persistence cache mode',
      'BGREWRITEAOF compacts AOF; auto-triggers configurable by size/growth ratio',
    ],
    interviewFocus: [
      'RDB vs AOF — trade-offs in durability and restart time',
      'What is hybrid persistence and why is it recommended?',
      'Why does BGSAVE use copy-on-write and how does it affect memory?',
      'appendfsync always vs everysec — when to use each?',
    ],
  };
}
