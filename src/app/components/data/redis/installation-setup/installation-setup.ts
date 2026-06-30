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
  selector: 'app-redis-installation-setup',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './installation-setup.html',
  styleUrl: './installation-setup.scss',
})
export class RedisInstallationSetup {
  quickRef: QuickRefItem[] = [
    { name: 'redis-server', type: 'keyword', desc: 'Start Redis with default config (port 6379)' },
    { name: 'redis-server /etc/redis/redis.conf', type: 'keyword', desc: 'Start with config file' },
    { name: 'redis-cli', type: 'keyword', desc: 'Connect to local Redis REPL' },
    { name: 'redis-cli -h host -p port -a pass', type: 'keyword', desc: 'Connect to remote with auth' },
    { name: 'PING', type: 'keyword', desc: 'Test connectivity — returns PONG' },
    { name: 'INFO server', type: 'keyword', desc: 'Server version, uptime, memory, OS' },
    { name: 'CONFIG GET maxmemory', type: 'keyword', desc: 'Read a config parameter at runtime' },
    { name: 'CONFIG SET maxmemory 256mb', type: 'keyword', desc: 'Change config at runtime (no restart)' },
    { name: 'DEBUG SLEEP 5', type: 'keyword', desc: 'Block server 5s — used to test timeouts' },
    { name: 'SHUTDOWN SAVE', type: 'keyword', desc: 'Graceful shutdown with RDB snapshot' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Installation Methods',
      points: [
        'Linux (Ubuntu/Debian): `sudo apt install redis-server` installs Redis and starts it as a systemd service automatically.',
        'macOS: `brew install redis` then `brew services start redis` for auto-start on login.',
        'Docker: `docker run -d -p 6379:6379 redis:7-alpine` is the fastest way to get a clean Redis 7 instance without any local setup.',
        'Windows: Redis is not officially supported on Windows; use WSL2 or Docker Desktop for development.',
        'Production: use the official Redis Docker image, Kubernetes operator, or managed services (AWS ElastiCache, Azure Cache for Redis, Google Memorystore).',
      ],
    },
    {
      heading: 'Key redis.conf Settings',
      points: [
        '`bind 127.0.0.1`: listen only on localhost — change to `0.0.0.0` only in trusted networks. Leave unset or bind to specific IPs, never expose Redis publicly without authentication.',
        '`requirepass your_secret`: enable password authentication. Prefer ACL (aclfile) over requirepass for multi-user environments (Redis 6+).',
        '`maxmemory 256mb`: cap memory usage. Without a cap, Redis will consume all available RAM and trigger OS OOM killer.',
        '`maxmemory-policy allkeys-lru`: eviction policy when maxmemory is reached. Choose based on your workload (cache vs persistent store).',
        '`appendonly yes`: enable AOF persistence for durability. Combine with `appendfsync everysec` for a balance of durability and performance.',
        '`save 900 1`: RDB snapshot trigger — save if at least 1 key changed in 900 seconds. Disable with `save ""` for pure cache deployments.',
      ],
    },
    {
      heading: 'redis-cli Essentials',
      points: [
        'Interactive mode: run `redis-cli` to open an interactive REPL. Commands are case-insensitive (SET = set).',
        'One-shot mode: `redis-cli GET mykey` — execute a single command and exit. Useful in shell scripts.',
        'Pipeline mode: `redis-cli --pipe < commands.txt` — send bulk commands from a file with minimal overhead.',
        '`redis-cli --stat`: print live server stats every second (memory, ops/s, keys, clients).',
        '`redis-cli --latency`: measure round-trip latency to Redis. Useful for diagnosing network issues.',
        '`redis-cli --bigkeys`: scan all keys to find the largest ones by memory. Run during low-traffic periods.',
      ],
    },
    {
      heading: 'Redis Insight',
      points: [
        'Redis Insight is the official GUI for Redis — connect to any instance, browse keys, run commands, view memory usage, and monitor slow logs.',
        'Available as a desktop app and as a Docker image. Useful for development and debugging — not required for production.',
        'Key browser: explore keys with a tree view using colon-separated namespaces. Filter, paginate, and inspect values.',
        'Memory analysis: identify memory hogs, top key patterns, and serialisation overhead per data type.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Docker Setup',
      language: 'bash',
      code: `# Run Redis 7 in Docker
docker run -d --name redis \\
  -p 6379:6379 \\
  redis:7-alpine

# With password
docker run -d --name redis \\
  -p 6379:6379 \\
  redis:7-alpine redis-server --requirepass "secret"

# With config file mount
docker run -d --name redis \\
  -p 6379:6379 \\
  -v /path/to/redis.conf:/usr/local/etc/redis/redis.conf \\
  redis:7-alpine redis-server /usr/local/etc/redis/redis.conf

# Connect to running container
docker exec -it redis redis-cli -a secret

# View logs
docker logs redis`,
    },
    {
      label: 'redis.conf',
      language: 'bash',
      code: `# /etc/redis/redis.conf — minimal production config

# Binding
bind 127.0.0.1          # listen on loopback only
protected-mode yes       # extra safety when no password is set

# Authentication (Redis 6+ ACL is preferred)
requirepass your_strong_password

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence — AOF for durability
appendonly yes
appendfsync everysec     # flush to disk every second

# Disable RDB for pure cache (saves memory and CPU)
save ""

# Logging
loglevel notice
logfile /var/log/redis/redis.log

# Apply at runtime without restart
# redis-cli CONFIG SET maxmemory 512mb`,
    },
    {
      label: 'Node.js Connection',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// Local dev
const redis = new Redis();

// With auth + TLS (production)
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASS,
  tls: {},                    // enable TLS
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error', err));

// Health check
await redis.ping(); // PONG

// Read runtime config
const [, maxmem] = await redis.config('GET', 'maxmemory');
console.log('maxmemory:', maxmem);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Binding Redis to 0.0.0.0 without authentication',
      wrong: 'bind 0.0.0.0  # no requirepass set',
      right: 'bind 0.0.0.0\nrequirepass strong_password_here',
      explanation: 'Redis exposed on all interfaces without a password is publicly accessible. Attackers can dump data, execute Lua scripts, or write SSH keys via SLAVEOF. Always require a password or bind to localhost.',
    },
    {
      title: 'Not setting maxmemory',
      wrong: '# maxmemory not configured — Redis uses all available RAM',
      right: 'maxmemory 512mb\nmaxmemory-policy allkeys-lru',
      explanation: 'Without a memory cap, Redis will consume all system RAM and the OS OOM killer will terminate the Redis process. Always set maxmemory to leave room for the OS and other processes.',
    },
    {
      title: 'Connecting to Redis on every function call',
      wrong: 'async function handler() { const r = new Redis(); const v = await r.get(k); await r.quit(); }',
      right: 'const redis = new Redis(); // module-level singleton\nasync function handler() { return redis.get(k); }',
      explanation: 'Creating a Redis connection per request adds ~1ms TCP handshake latency and depletes connection limits. Create one instance at app startup and reuse it.',
    },
    {
      title: 'Using AUTH over an unencrypted connection',
      wrong: 'redis-cli -h prod-host -a password  // unencrypted',
      right: 'redis-cli -h prod-host -a password --tls  // TLS encrypted',
      explanation: 'Without TLS, passwords and data travel in plaintext. Any network observer on the path can capture them. Always use TLS for connections that cross untrusted networks.',
    },
  ];

  challenge: Challenge = {
    title: 'Health Check Endpoint',
    language: 'typescript',
    description: 'Write a `checkRedisHealth()` function that connects to Redis, PINGs it, and returns an object `{ status: "ok" | "error", latencyMs: number, version?: string }`. Parse the INFO server response to extract the `redis_version` field.',
    hints: [
      'Use `redis.ping()` to get a round-trip time measurement',
      'Use `redis.info("server")` which returns a multi-line string',
      'Parse the INFO response by splitting on newlines and finding the `redis_version:` line',
    ],
    starterCode: `import Redis from 'ioredis';

const redis = new Redis();

async function checkRedisHealth(): Promise<{ status: 'ok' | 'error'; latencyMs: number; version?: string }> {
  // TODO: ping Redis, measure latency, parse version from INFO
}`,
    solution: `import Redis from 'ioredis';

const redis = new Redis();

async function checkRedisHealth(): Promise<{ status: 'ok' | 'error'; latencyMs: number; version?: string }> {
  try {
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;

    const info = await redis.info('server');
    const versionLine = info.split('\\n').find(l => l.startsWith('redis_version:'));
    const version = versionLine?.split(':')[1]?.trim();

    return { status: 'ok', latencyMs, version };
  } catch {
    return { status: 'error', latencyMs: -1 };
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the default port Redis listens on?',
      options: ['3306', '5432', '6379', '27017'],
      answer: 2,
      explanation: '6379 is the default Redis port. The number was chosen because "MERZ" on a phone keypad maps to 6379 — a reference to a show the creator of Redis was watching at the time.',
    },
    {
      q: 'Which redis.conf directive caps memory usage and triggers eviction?',
      options: ['maxkeys', 'maxmemory', 'memorylimit', 'evictioncap'],
      answer: 1,
      explanation: 'maxmemory sets the maximum RAM Redis will use. When reached, the maxmemory-policy determines whether to evict keys or return errors.',
    },
    {
      q: 'What does `redis-cli --pipe` do?',
      options: ['Pipe commands from Redis to a file', 'Send bulk commands with minimal round-trips', 'Stream data from Kafka to Redis', 'Monitor Redis in real-time'],
      answer: 1,
      explanation: '--pipe mode reads Redis protocol commands from stdin and sends them in one batch, dramatically reducing latency for bulk loading compared to sending commands one by one.',
    },
    {
      q: 'What does bind 127.0.0.1 in redis.conf do?',
      options: ['Sets the authentication password', 'Restricts Redis to accept connections only from localhost', 'Binds Redis to a Unix socket', 'Sets the maximum number of connected clients'],
      answer: 1,
      explanation: 'bind specifies which network interfaces Redis listens on. bind 127.0.0.1 means only local connections — protects against external access. For multi-host: bind 0.0.0.0 (with protected-mode no and firewall). Always restrict in production.',
    },
    {
      q: 'What is protected-mode in Redis?',
      options: ['Encrypts all data at rest', 'A safety measure that rejects all external connections unless bind is configured or requirepass is set', 'Prevents CONFIG SET commands', 'Blocks Lua scripting'],
      answer: 1,
      explanation: 'Protected-mode (default: yes) blocks connections from addresses other than 127.0.0.1 unless: (a) a bind address is explicitly configured, or (b) requirepass is set. Prevents accidentally exposing Redis to the internet.',
    },
    {
      q: 'What does maxmemory-policy default to if not configured?',
      options: ['allkeys-lru', 'volatile-lru', 'noeviction', 'allkeys-random'],
      answer: 2,
      explanation: 'The default maxmemory-policy is noeviction — Redis returns an error on write commands when maxmemory is reached rather than evicting data. Set an appropriate policy (allkeys-lru for pure cache use) based on your workload.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I reload redis.conf without restarting Redis?',
      a: 'Use CONFIG REWRITE to update the config file from the in-memory config, or CONFIG SET to change individual parameters at runtime (e.g., CONFIG SET maxmemory 512mb). Not all parameters can be changed at runtime — directives like bind, aof-use-rdb-preamble, and cluster-enabled require a restart.',
    },
    {
      q: 'What is the difference between redis-server and redis-sentinel?',
      a: 'redis-server is the main Redis data server. redis-sentinel is a separate process that monitors Redis instances, performs automatic failover, and notifies clients when the primary changes. Sentinel runs alongside redis-server instances, not instead of them.',
    },
    {
      q: 'How do you verify a Redis instance is running correctly?',
      a: '<code>redis-cli ping</code> → PONG confirms connectivity. <code>redis-cli info server</code> shows version. <code>redis-cli info memory</code> checks RAM usage. <code>redis-cli monitor</code> streams all commands (debug only). <code>redis-cli --latency</code> measures round-trip latency. <code>redis-benchmark</code> runs throughput tests.',
    },
    {
      q: 'What is the recommended way to run Redis in production?',
      a: 'Run as a <strong>systemd service</strong> (not daemonize yes for systemd-managed). Set <code>maxmemory</code> and <code>maxmemory-policy</code>. Enable AOF + RDB persistence. Set requirepass or ACL. Disable dangerous commands (rename-command CONFIG """"). Run as non-root. Monitor with Redis Exporter + Prometheus.',
    },
    {
      q: 'How do you persist configuration changes made with CONFIG SET?',
      a: '<code>CONFIG SET maxmemory 2gb</code> changes running config immediately. To persist across restarts: <code>CONFIG REWRITE</code> writes the current in-memory config back to redis.conf. Without CONFIG REWRITE, dynamic changes are lost on restart. Always test config changes with CONFIG SET before committing to redis.conf.',
    },
    {
      q: 'What does the daemonize option in redis.conf control?',
      a: '<code>daemonize yes</code> runs Redis as a background daemon. <code>daemonize no</code> runs in foreground — preferred under process supervisors like systemd or Docker which manage the process lifecycle. In Docker always use <code>daemonize no</code> so the container stays alive. Set <code>loglevel notice</code> and <code>logfile /var/log/redis/redis.log</code> for production logging.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Install Redis via apt/brew/Docker; configure bind, requirepass, maxmemory, and persistence in redis.conf; use redis-cli or Redis Insight to explore.',
    mustKnow: [
      'Default port 6379; bind 127.0.0.1 for security',
      'Always set maxmemory and maxmemory-policy in production',
      'requirepass or ACL for authentication; TLS for in-transit encryption',
      'appendonly yes for AOF durability; save "" disables RDB',
      'CONFIG SET changes config at runtime; CONFIG REWRITE persists to file',
      'redis-cli --stat and --latency for live monitoring',
    ],
    interviewFocus: [
      'What are the security risks of an exposed Redis instance?',
      'Why do you need maxmemory in production?',
      'RDB vs AOF persistence trade-offs',
      'How do you change Redis config without a restart?',
    ],
  };
}
