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
  selector: 'app-redis-security',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class RedisSecurity {
  quickRef: QuickRefItem[] = [
    { name: 'requirepass <password>', type: 'syntax', desc: 'Set a password — clients must AUTH before commands' },
    { name: 'AUTH password', type: 'keyword', desc: 'Authenticate a connection' },
    { name: 'ACL SETUSER alice on >pass ~key:* &* +@read', type: 'keyword', desc: 'Create ACL user: password, key pattern, channels, commands' },
    { name: 'ACL LIST', type: 'keyword', desc: 'List all ACL rules' },
    { name: 'ACL WHOAMI', type: 'keyword', desc: 'Show current connection\'s username' },
    { name: 'ACL LOG', type: 'keyword', desc: 'Show recent ACL access violations' },
    { name: 'bind 127.0.0.1 -::1', type: 'syntax', desc: 'Bind to loopback only — block external network access' },
    { name: 'protected-mode yes', type: 'syntax', desc: 'Refuse connections from non-loopback if no password set' },
    { name: 'tls-port 6380 tls-cert-file ...', type: 'syntax', desc: 'Enable TLS for encrypted connections' },
    { name: 'rename-command FLUSHALL ""', type: 'syntax', desc: 'Disable dangerous commands by renaming to empty string' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Authentication and Network Binding',
      points: [
        'By default, Redis binds to 127.0.0.1 (loopback) in modern versions. Never expose Redis directly to the public internet — it has no firewall of its own.',
        'requirepass sets a global password. In Redis 6+, ACL (Access Control Lists) replace the single-password model with per-user usernames, passwords, command restrictions, and key pattern filters.',
        'protected-mode yes (default) refuses external connections if no password is set and Redis is bound to 0.0.0.0. This catches accidental public exposure.',
        'For production on cloud infrastructure, place Redis on a private network/VPC and restrict access via security groups. Never expose port 6379 publicly.',
        'Use a firewall (iptables, ufw, or cloud security groups) as the primary network access control — do not rely solely on Redis auth.',
      ],
    },
    {
      heading: 'ACL — Access Control Lists (Redis 6+)',
      points: [
        'ACL allows fine-grained per-user permissions: which commands, which key patterns, which Pub/Sub channels, and connection limits.',
        'Command categories: +@read (all read commands), +@write (all write commands), +@all (everything), -FLUSHALL (disable specific command). Combine with + and -.',
        'Key patterns: ~session:* (only keys starting with session:), ~* (all keys), ~key:42 (exact key). Per-user key isolation prevents one service from reading another\'s data.',
        'ACL SETUSER syntax: `ACL SETUSER alice on >password ~data:* &* +@read +@write -@dangerous`',
        'Store ACL rules in redis.conf (`aclfile /etc/redis/users.acl`) or use ACL SETUSER at runtime. Runtime changes take effect immediately but must be saved (ACL SAVE or CONFIG REWRITE) to survive restarts.',
      ],
    },
    {
      heading: 'TLS and Encrypted Connections',
      points: [
        'Redis 6+ supports TLS natively via tls-port, tls-cert-file, tls-key-file, tls-ca-cert-file. Enables encrypted client-server communication.',
        'For Redis Sentinel and Cluster, TLS must be enabled on all nodes and Sentinel instances.',
        'In cloud-managed Redis (ElastiCache, Redis Cloud, Upstash), TLS is typically enabled by default. For self-hosted, generate certs with Let\'s Encrypt or an internal CA.',
        'Test TLS: `redis-cli --tls --cert client.crt --key client.key --cacert ca.crt -h redis-host -p 6380`',
      ],
    },
    {
      heading: 'Disabling Dangerous Commands',
      points: [
        'FLUSHALL, FLUSHDB, KEYS, DEBUG, CONFIG can be catastrophic if called accidentally or by a compromised service. Restrict or disable them in production.',
        '`rename-command FLUSHALL ""` in redis.conf disables the command entirely. `rename-command KEYS _KEYS_INTERNAL_ONLY` renames it to something secret.',
        'With ACL, use `-@dangerous` in user rules to block the dangerous command category. This is cleaner than rename-command in Redis 6+.',
        'Lua scripts: disable if not needed with `lua-time-limit 0`. Scripts can execute arbitrary Redis commands, so limit who has access to EVAL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ACL Configuration',
      language: 'bash',
      code: `# redis.conf — ACL setup

# Default user: disabled (no anonymous access)
# user default off nopass nocommands nokeys

# App service: read/write on session:* keys only
ACL SETUSER app-service on >AppSecret123 ~session:* ~cache:* &* +@read +@write -FLUSHALL -FLUSHDB -DEBUG -KEYS

# Read-only analytics user
ACL SETUSER analytics on >AnalyticsPass ~* &* +@read

# Admin user: full access
ACL SETUSER admin on >AdminSecurePass ~* &* +@all

# Verify
ACL LIST
ACL WHOAMI

# Save ACL to file
CONFIG SET aclfile /etc/redis/users.acl
ACL SAVE`,
    },
    {
      label: 'TLS + Auth (redis.conf)',
      language: 'bash',
      code: `# /etc/redis/redis.conf

# Network
bind 127.0.0.1 10.0.0.5   # loopback + private IP only
protected-mode yes

# TLS (Redis 6+)
tls-port 6380
port 0                     # disable plaintext port
tls-replication yes        # TLS for replica connections
tls-cluster yes            # TLS for cluster bus

tls-cert-file /etc/redis/tls/redis.crt
tls-key-file  /etc/redis/tls/redis.key
tls-ca-cert-file /etc/redis/tls/ca.crt
tls-auth-clients yes       # require client certificates

# Disable dangerous commands
rename-command FLUSHALL  ""
rename-command FLUSHDB   ""
rename-command DEBUG     ""
rename-command CONFIG    "CONFIG_RESTRICTED_9f2a"

# Logging
loglevel notice
logfile /var/log/redis/redis.log`,
    },
    {
      label: 'Secure Client (ioredis)',
      language: 'typescript',
      code: `import Redis from 'ioredis';
import { readFileSync } from 'fs';

const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: 6380,
  username: 'app-service',         // ACL username
  password: process.env.REDIS_PASSWORD!,
  tls: {
    cert: readFileSync('/etc/ssl/client.crt'),
    key: readFileSync('/etc/ssl/client.key'),
    ca: readFileSync('/etc/ssl/ca.crt'),
  },
  // Fail fast if connection can't be established in 5s
  connectTimeout: 5000,
  maxRetriesPerRequest: 2,
});

redis.on('error', (err) => {
  // Never log the full error object — it may contain auth details
  console.error('Redis connection error:', err.message);
});

// Verify ACL permissions at startup
async function verifyRedisPermissions() {
  const who = await redis.acl('WHOAMI');
  console.log('Redis authenticated as:', who);
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Binding Redis to 0.0.0.0 without a password',
      wrong: `# redis.conf
bind 0.0.0.0
# No requirepass — Redis accessible from any IP with no auth`,
      right: `bind 127.0.0.1 10.0.0.5   # private network IP only
requirepass StrongPasswordHere
protected-mode yes`,
      explanation: 'Redis bound to 0.0.0.0 with no password is publicly accessible to anyone who can reach the port. This is the most common Redis misconfiguration leading to data breaches and ransomware. Bind to private IPs only and always require authentication.',
    },
    {
      title: 'Storing passwords in environment variables without ACL users',
      wrong: `# Single requirepass — all services share one password
requirepass SharedPassword123`,
      right: `# Per-service ACL users with minimal permissions
ACL SETUSER api-service on >ApiPass ~session:* +@read +@write
ACL SETUSER background-job on >JobPass ~job:* +@read +@write -@dangerous`,
      explanation: 'A shared password means a compromised service can access all data. ACL users enforce least-privilege: a session service can only read/write session keys; a background job cannot FLUSH the database.',
    },
    {
      title: 'Logging Redis errors with the full error object',
      wrong: `redis.on('error', (err) => {
  console.error('Redis error:', err); // may log connection URL with password
});`,
      right: `redis.on('error', (err) => {
  console.error('Redis error:', err.message); // message only — no credentials
});`,
      explanation: 'The full error object from Redis clients can contain the connection URL, which includes credentials. Log only err.message (or a sanitised subset) to avoid leaking passwords to log aggregators.',
    },
  ];

  challenge: Challenge = {
    title: 'ACL Audit Logger',
    language: 'typescript',
    description: 'Write `auditAclViolations(redis)` that reads ACL LOG, parses the entries, and returns an array of `{ username, command, key, reason, count }` objects sorted by `count` descending. ACL LOG returns raw arrays — parse them into structured objects.',
    hints: [
      'redis.acl("LOG") returns an array of raw log entries (nested arrays)',
      'Each entry has fields: count, reason, object, username, age, client-info',
    ],
    starterCode: `import Redis from 'ioredis';

async function auditAclViolations(redis: Redis): Promise<Array<{
  username: string; command: string; key: string; reason: string; count: number;
}>> {}`,
    solution: `import Redis from 'ioredis';

async function auditAclViolations(redis: Redis) {
  const raw = await redis.acl('LOG') as string[][];
  return raw
    .map(entry => {
      const kv = Object.fromEntries(entry.reduce<[string, string][]>((acc, v, i) => i % 2 === 0 ? [...acc, [v, entry[i + 1]]] : acc, []));
      return {
        username: kv['username'] ?? 'unknown',
        command: (kv['object'] ?? '').split('|')[0],
        key: (kv['object'] ?? '').split('|')[1] ?? '',
        reason: kv['reason'] ?? '',
        count: parseInt(kv['count'] ?? '1', 10),
      };
    })
    .sort((a, b) => b.count - a.count);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does ACL SETUSER with the flag `~session:*` restrict?',
      options: [
        'The user can only run SESSION commands',
        'The user can only access keys matching the pattern session:*',
        'The user\'s connection expires after the session ends',
        'The user is limited to one connection',
      ],
      answer: 1,
      explanation: '~session:* is a key pattern filter. The user can only read/write Redis keys whose names match the glob pattern "session:*". Attempts to access keys outside this pattern return an ACL error.',
    },
    {
      q: 'What is the safest way to disable a dangerous command like FLUSHALL in Redis 6+?',
      options: [
        'rename-command FLUSHALL ""',
        'Use ACL to remove it from user permissions with -FLUSHALL or -@dangerous',
        'Set lua-time-limit 0',
        'Comment it out of redis.conf',
      ],
      answer: 1,
      explanation: 'In Redis 6+, use ACL per-user rules (-FLUSHALL or -@dangerous) to disable dangerous commands. rename-command still works but is a global config change. ACL is more flexible as it can be applied per user while still allowing admin access.',
    },
    {
      q: 'What does Redis ACL (Access Control List) provide beyond requirepass?',
      options: ['ACL provides TLS encryption', 'ACL allows per-user authentication with command and key-pattern restrictions; requirepass gives all clients the same password with no access control', 'ACL stores passwords encrypted; requirepass stores them in plain text', 'ACL is only available in Redis Enterprise'],
      answer: 1,
      explanation: 'Redis 6+ ACL: create users with individual passwords, restrict which commands they can run (nocommands, +GET), and which key patterns they can access (~user:*). requirepass is a single shared password with no per-user control.',
    },
    {
      q: 'How do you enable TLS in Redis?',
      options: ['Set tls-enabled yes in redis.conf', 'Compile Redis with --tls flag', 'Set tls-port, tls-cert-file, tls-key-file, tls-ca-cert-file in redis.conf and use --tls-port when starting', 'TLS is not supported in open-source Redis'],
      answer: 2,
      explanation: 'Redis 6+ supports TLS natively. Configure tls-port 6380, tls-cert-file, tls-key-file, tls-ca-cert-file (for mTLS). Clients connect with TLS. Use tls-auth-clients yes to require client certificates. Replicas and Sentinels also need TLS config.',
    },
    {
      q: 'What is the rename-command security technique in Redis?',
      options: ['Renames all keys in a database', 'Renames dangerous commands (like CONFIG, FLUSHALL, DEBUG) to empty string (disabling them) or a secret name', 'Renames the Redis database', 'Changes the command prefix from Redis to a custom string'],
      answer: 1,
      explanation: 'rename-command CONFIG "" (empty string) in redis.conf disables the command. rename-command FLUSHALL "" prevents accidental data wipe. This is a defence-in-depth measure — still use ACL for fine-grained control in Redis 6+.',
    },
    {
      q: 'What network security measure should you always apply to Redis?',
      options: ['Enable protected-mode and use SSL only', 'Bind to 127.0.0.1 or private network interface and use a firewall to block port 6379 from the internet', 'Enable password hashing on the config file', 'Limit to 10 simultaneous connections'],
      answer: 1,
      explanation: 'Redis has no authentication by default. Exposed to the internet, anyone can read/write all data and run dangerous commands. Always: bind to private interface, use firewall rules (allow only app servers), set requirepass/ACL, run Redis as non-root.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does Redis encrypt data at rest?',
      a: 'No — Redis does not natively encrypt data at rest. Data in memory and RDB/AOF files on disk is stored in plaintext. For data-at-rest encryption, rely on OS-level filesystem encryption (dm-crypt/LUKS on Linux, encrypted EBS volumes on AWS) or use a managed Redis service (AWS ElastiCache with encrypted storage, Redis Cloud). TLS only encrypts data in transit between clients and Redis.',
    },
    {
      q: 'What is Redis ACL and how do you create a restricted user?',
      a: '<code>ACL SETUSER readonly on >password ~readonly:* +GET +MGET +HGET +HGETALL</code>: creates user readonly with password, key pattern restriction (readonly:* prefix), and only GET-type commands allowed. <code>ACL LIST</code> shows all users. <code>ACL LOG</code> shows denied command attempts. Redis 6+ feature — more granular than requirepass.',
    },
    {
      q: 'How do you harden Redis against common attack vectors?',
      a: 'Hardening checklist: (1) Bind to private IP only; (2) Firewall port 6379 to app servers only; (3) Set requirepass/ACL; (4) Disable/rename dangerous commands (FLUSHALL, CONFIG, DEBUG); (5) Enable TLS in transit; (6) Run as non-root; (7) Keep Redis updated; (8) Enable protected-mode; (9) Monitor AUTH failures with keyspace notifications or fail2ban.',
    },
    {
      q: 'What is the Redis RESET command used for?',
      a: 'RESET (Redis 6+) resets the connection state: exits subscriber/monitor mode, resets MULTI/EXEC, unsubscribes from all channels, resets AUTH state. Useful for connection pool implementations to clean up client state without disconnecting and reconnecting. More efficient than a full reconnect.',
    },
    {
      q: 'How do you use Redis ACL to restrict key access per user?',
      a: 'Key patterns in ACL use glob matching: <code>~user:*</code> allows access to keys starting with user:, <code>~*</code> allows all. <code>%R~pattern</code> for read-only key patterns, <code>%W~pattern</code> for write-only. <code>nokeys</code> denies all key access (for admin users who only need INFO/CONFIG). Apply ACLs from file: <code>aclfile /etc/redis/users.acl</code>.',
    },
    {
      q: 'What is Redis protected-mode and when does it trigger?',
      a: 'Protected-mode (default on) blocks external connections unless: (a) a bind directive explicitly configures an external interface, OR (b) requirepass is set. When triggered, clients from non-loopback addresses receive an error explaining how to disable protected-mode. This prevents accidental internet exposure of a default Redis install.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Bind to private IPs only; use ACL users with least-privilege key patterns; enable TLS for in-transit encryption; disable dangerous commands; never expose Redis to the public internet.',
    mustKnow: [
      'Never bind to 0.0.0.0 without a password — public Redis = instant compromise',
      'ACL (Redis 6+): per-user permissions on commands, key patterns, channels',
      'protected-mode yes blocks external connections if no password set',
      'TLS via tls-port + cert files for encrypted client-server communication',
      'Disable/rename FLUSHALL, KEYS, DEBUG in production via ACL -@dangerous',
      'Redis does not encrypt data at rest — use filesystem or managed-service encryption',
    ],
    interviewFocus: [
      'What is the most common Redis security misconfiguration?',
      'How do ACL users improve security over a single requirepass?',
      'Does Redis support encryption at rest?',
      'How do you restrict one microservice from accessing another\'s Redis keys?',
    ],
  };
}
