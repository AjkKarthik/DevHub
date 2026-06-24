import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface CheatEntry {
  cmd: string;
  desc: string;
  example: string;
}

interface CheatSection {
  title: string;
  entries: CheatEntry[];
}

@Component({
  selector: 'app-redis-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule, PageMetaComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class RedisCheatsheet {
  searchTerm = signal('');
  activeTab = signal('strings');

  tabs = [
    { id: 'strings',    label: 'Strings' },
    { id: 'hashes',     label: 'Hashes' },
    { id: 'lists',      label: 'Lists' },
    { id: 'sets',       label: 'Sets' },
    { id: 'sorted',     label: 'Sorted Sets' },
    { id: 'keys',       label: 'Keys & TTL' },
    { id: 'streams',    label: 'Streams' },
    { id: 'pubsub',     label: 'Pub/Sub' },
    { id: 'server',     label: 'Server' },
  ];

  sections: Record<string, CheatSection> = {
    strings: {
      title: 'Strings',
      entries: [
        { cmd: 'SET key value [EX s] [PX ms] [NX|XX]', desc: 'Set string; NX=only if absent, XX=only if present', example: 'SET session:42 "user" EX 3600' },
        { cmd: 'GET key', desc: 'Get value (nil if missing)', example: 'GET session:42' },
        { cmd: 'GETSET key value', desc: 'Set new value, return old (deprecated — use GETDEL)', example: 'GETSET counter 0' },
        { cmd: 'MSET k v [k v...]', desc: 'Set multiple key-value pairs atomically', example: 'MSET name Alice age 30' },
        { cmd: 'MGET key [key...]', desc: 'Get multiple values in one roundtrip', example: 'MGET name age' },
        { cmd: 'INCR key', desc: 'Increment integer by 1; creates key at 0 first', example: 'INCR page:views' },
        { cmd: 'INCRBY key n', desc: 'Increment by n', example: 'INCRBY score 10' },
        { cmd: 'INCRBYFLOAT key f', desc: 'Increment by float', example: 'INCRBYFLOAT price 0.50' },
        { cmd: 'DECR key / DECRBY key n', desc: 'Decrement by 1 or n', example: 'DECRBY stock 5' },
        { cmd: 'APPEND key value', desc: 'Append to string; returns new length', example: 'APPEND log "event\\n"' },
        { cmd: 'STRLEN key', desc: 'Length of string value in bytes', example: 'STRLEN name' },
        { cmd: 'SETNX key value', desc: 'Set only if not exists (use SET NX instead)', example: 'SETNX lock:42 1' },
        { cmd: 'GETEX key [EX s]', desc: 'Get + set/reset TTL atomically (Redis 6.2+)', example: 'GETEX session:42 EX 3600' },
        { cmd: 'GETDEL key', desc: 'Get and delete in one atomic operation', example: 'GETDEL one_time_token:abc' },
      ],
    },
    hashes: {
      title: 'Hashes',
      entries: [
        { cmd: 'HSET key field value [f v...]', desc: 'Set one or more fields', example: 'HSET user:42 name Alice age 30' },
        { cmd: 'HGET key field', desc: 'Get one field value', example: 'HGET user:42 name' },
        { cmd: 'HMGET key f [f...]', desc: 'Get multiple fields', example: 'HMGET user:42 name age' },
        { cmd: 'HGETALL key', desc: 'Get all fields and values', example: 'HGETALL user:42' },
        { cmd: 'HDEL key field [f...]', desc: 'Delete one or more fields', example: 'HDEL user:42 temp_field' },
        { cmd: 'HEXISTS key field', desc: '1 if field exists, 0 if not', example: 'HEXISTS user:42 email' },
        { cmd: 'HKEYS key', desc: 'All field names', example: 'HKEYS user:42' },
        { cmd: 'HVALS key', desc: 'All field values', example: 'HVALS user:42' },
        { cmd: 'HLEN key', desc: 'Number of fields', example: 'HLEN user:42' },
        { cmd: 'HINCRBY key field n', desc: 'Increment integer field by n', example: 'HINCRBY stats:42 logins 1' },
        { cmd: 'HINCRBYFLOAT key field f', desc: 'Increment float field', example: 'HINCRBYFLOAT product:1 price 0.99' },
        { cmd: 'HSCAN key cursor [MATCH p] [COUNT n]', desc: 'Cursor-based hash field iteration', example: 'HSCAN user:42 0 MATCH *name*' },
      ],
    },
    lists: {
      title: 'Lists',
      entries: [
        { cmd: 'LPUSH key val [val...]', desc: 'Push to head; returns new length', example: 'LPUSH tasks "job1" "job2"' },
        { cmd: 'RPUSH key val [val...]', desc: 'Push to tail', example: 'RPUSH queue "item"' },
        { cmd: 'LPOP key [count]', desc: 'Pop from head', example: 'LPOP tasks 5' },
        { cmd: 'RPOP key [count]', desc: 'Pop from tail', example: 'RPOP queue' },
        { cmd: 'BLPOP key [key...] timeout', desc: 'Blocking left pop; waits up to timeout seconds', example: 'BLPOP jobs 30' },
        { cmd: 'BRPOP key [key...] timeout', desc: 'Blocking right pop', example: 'BRPOP queue 5' },
        { cmd: 'LLEN key', desc: 'List length', example: 'LLEN tasks' },
        { cmd: 'LRANGE key start stop', desc: 'Get elements by index range (0 -1 = all)', example: 'LRANGE tasks 0 -1' },
        { cmd: 'LINDEX key index', desc: 'Get element at index (0-based; negative from end)', example: 'LINDEX tasks 0' },
        { cmd: 'LSET key index value', desc: 'Set element at index', example: 'LSET tasks 0 "updated"' },
        { cmd: 'LINSERT key BEFORE|AFTER pivot val', desc: 'Insert before or after a pivot value', example: 'LINSERT tasks BEFORE "job2" "urgent"' },
        { cmd: 'LREM key count value', desc: 'Remove count occurrences of value', example: 'LREM tasks 1 "done"' },
        { cmd: 'LTRIM key start stop', desc: 'Trim list to range; keeps only start..stop', example: 'LTRIM recent:items 0 99' },
        { cmd: 'LMOVE src dst LEFT|RIGHT LEFT|RIGHT', desc: 'Atomic pop from src, push to dst', example: 'LMOVE pending processing LEFT LEFT' },
      ],
    },
    sets: {
      title: 'Sets',
      entries: [
        { cmd: 'SADD key member [m...]', desc: 'Add members; returns count added', example: 'SADD tags:post:1 redis caching' },
        { cmd: 'SREM key member [m...]', desc: 'Remove members', example: 'SREM tags:post:1 old-tag' },
        { cmd: 'SMEMBERS key', desc: 'All members (unordered)', example: 'SMEMBERS tags:post:1' },
        { cmd: 'SISMEMBER key member', desc: '1 if member exists, 0 if not', example: 'SISMEMBER tags:post:1 redis' },
        { cmd: 'SMISMEMBER key m [m...]', desc: 'Check multiple members at once', example: 'SMISMEMBER tags:post:1 redis python' },
        { cmd: 'SCARD key', desc: 'Set cardinality (size)', example: 'SCARD tags:post:1' },
        { cmd: 'SRANDMEMBER key [count]', desc: 'Random member(s) without removal', example: 'SRANDMEMBER tags:post:1 3' },
        { cmd: 'SPOP key [count]', desc: 'Remove and return random member(s)', example: 'SPOP lottery 1' },
        { cmd: 'SUNION key [key...]', desc: 'Union of multiple sets', example: 'SUNION tags:1 tags:2' },
        { cmd: 'SINTER key [key...]', desc: 'Intersection of sets', example: 'SINTER followers:alice followers:bob' },
        { cmd: 'SDIFF key [key...]', desc: 'Difference: first set minus others', example: 'SDIFF all:users inactive:users' },
        { cmd: 'SUNIONSTORE dst k [k...]', desc: 'Store union result in dst', example: 'SUNIONSTORE combined tags:1 tags:2' },
        { cmd: 'SSCAN key cursor [MATCH p] [COUNT n]', desc: 'Cursor-based set iteration', example: 'SSCAN myset 0 COUNT 100' },
      ],
    },
    sorted: {
      title: 'Sorted Sets',
      entries: [
        { cmd: 'ZADD key [NX|XX] [GT|LT] score member', desc: 'Add/update member with score', example: 'ZADD leaderboard 1500 "alice"' },
        { cmd: 'ZSCORE key member', desc: 'Get score of member', example: 'ZSCORE leaderboard "alice"' },
        { cmd: 'ZINCRBY key increment member', desc: 'Increment score of member', example: 'ZINCRBY leaderboard 50 "alice"' },
        { cmd: 'ZRANK key member [WITHSCORE]', desc: 'Rank (0-based, low→high); WITHSCORE returns [rank, score]', example: 'ZRANK leaderboard "alice"' },
        { cmd: 'ZREVRANK key member', desc: 'Rank in reverse order (high→low)', example: 'ZREVRANK leaderboard "alice"' },
        { cmd: 'ZRANGE key min max [BYSCORE|BYLEX] [REV] [LIMIT] [WITHSCORES]', desc: 'Range query (Redis 6.2+ unified)', example: 'ZRANGE leaderboard 0 9 REV WITHSCORES' },
        { cmd: 'ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT o c]', desc: 'Get members in score range', example: 'ZRANGEBYSCORE lb 1000 2000 WITHSCORES' },
        { cmd: 'ZREVRANGEBYSCORE key max min', desc: 'Reverse score range', example: 'ZREVRANGEBYSCORE lb +inf 1000' },
        { cmd: 'ZCARD key', desc: 'Number of members', example: 'ZCARD leaderboard' },
        { cmd: 'ZCOUNT key min max', desc: 'Count members in score range', example: 'ZCOUNT leaderboard 1000 +inf' },
        { cmd: 'ZPOPMIN key [count]', desc: 'Remove and return lowest-score member(s)', example: 'ZPOPMIN jobs:queue 1' },
        { cmd: 'ZPOPMAX key [count]', desc: 'Remove and return highest-score member(s)', example: 'ZPOPMAX leaderboard 3' },
        { cmd: 'ZREM key member [m...]', desc: 'Remove members', example: 'ZREM leaderboard "cheater"' },
        { cmd: 'ZREMRANGEBYSCORE key min max', desc: 'Remove members in score range', example: 'ZREMRANGEBYSCORE events 0 1700000000' },
        { cmd: 'ZSCAN key cursor [MATCH p] [COUNT n]', desc: 'Cursor-based iteration', example: 'ZSCAN lb 0 MATCH a* COUNT 50' },
      ],
    },
    keys: {
      title: 'Keys & TTL',
      entries: [
        { cmd: 'DEL key [key...]', desc: 'Delete keys synchronously', example: 'DEL session:42 temp:data' },
        { cmd: 'UNLINK key [key...]', desc: 'Delete keys (async memory free)', example: 'UNLINK large:dataset' },
        { cmd: 'EXISTS key [key...]', desc: 'Count how many keys exist', example: 'EXISTS session:42' },
        { cmd: 'TYPE key', desc: 'Returns: string|hash|list|set|zset|stream', example: 'TYPE user:42' },
        { cmd: 'OBJECT ENCODING key', desc: 'Internal encoding (listpack, quicklist, etc.)', example: 'OBJECT ENCODING user:42' },
        { cmd: 'RENAME key newkey', desc: 'Atomic rename; overwrites newkey if exists', example: 'RENAME temp:data perm:data' },
        { cmd: 'EXPIRE key seconds', desc: 'Set TTL in seconds', example: 'EXPIRE session:42 3600' },
        { cmd: 'PEXPIRE key ms', desc: 'Set TTL in milliseconds', example: 'PEXPIRE token:abc 5000' },
        { cmd: 'TTL key', desc: '-1=no TTL, -2=missing, else remaining seconds', example: 'TTL session:42' },
        { cmd: 'PTTL key', desc: 'Remaining TTL in milliseconds', example: 'PTTL token:abc' },
        { cmd: 'PERSIST key', desc: 'Remove TTL — make key permanent', example: 'PERSIST session:42' },
        { cmd: 'EXPIRETIME key', desc: 'Unix timestamp of expiry (Redis 7+)', example: 'EXPIRETIME session:42' },
        { cmd: 'SCAN cursor [MATCH p] [COUNT n] [TYPE t]', desc: 'Safe key iteration (never use KEYS in prod)', example: 'SCAN 0 MATCH user:* COUNT 200' },
        { cmd: 'COPY src dst [REPLACE]', desc: 'Copy a key to a new key', example: 'COPY template:42 instance:99' },
      ],
    },
    streams: {
      title: 'Streams',
      entries: [
        { cmd: 'XADD key [MAXLEN ~ n] * f v [f v...]', desc: 'Append entry; * = auto-generate ID', example: 'XADD events MAXLEN ~ 10000 * type click' },
        { cmd: 'XLEN key', desc: 'Number of entries in stream', example: 'XLEN events' },
        { cmd: 'XRANGE key start end [COUNT n]', desc: 'Read entries by ID range (- = min, + = max)', example: 'XRANGE events - + COUNT 100' },
        { cmd: 'XREAD COUNT n BLOCK ms STREAMS key id', desc: 'Read entries; BLOCK waits for new; $ = latest', example: 'XREAD COUNT 10 BLOCK 2000 STREAMS events $' },
        { cmd: 'XGROUP CREATE key group id [MKSTREAM]', desc: 'Create consumer group; $ = from now, 0 = from start', example: 'XGROUP CREATE events workers $ MKSTREAM' },
        { cmd: 'XREADGROUP GROUP g c [COUNT n] [BLOCK ms] STREAMS key >', desc: '> = new undelivered; other ID = re-read PEL', example: 'XREADGROUP GROUP workers w1 COUNT 10 STREAMS events >' },
        { cmd: 'XACK key group id [id...]', desc: 'Acknowledge processed entries (removes from PEL)', example: 'XACK events workers 1700000-0' },
        { cmd: 'XPENDING key group - + count', desc: 'List pending (unacknowledged) entries', example: 'XPENDING events workers - + 10' },
        { cmd: 'XAUTOCLAIM key group consumer idle start [COUNT n]', desc: 'Auto-claim idle pending entries', example: 'XAUTOCLAIM events workers w2 30000 0-0 COUNT 50' },
        { cmd: 'XTRIM key MAXLEN ~ n', desc: 'Trim stream to ~n entries', example: 'XTRIM events MAXLEN ~ 50000' },
      ],
    },
    pubsub: {
      title: 'Pub/Sub',
      entries: [
        { cmd: 'SUBSCRIBE channel [ch...]', desc: 'Subscribe to channels; enters subscribe mode', example: 'SUBSCRIBE notifications:user:42' },
        { cmd: 'UNSUBSCRIBE [channel...]', desc: 'Unsubscribe; no arg = all', example: 'UNSUBSCRIBE notifications:user:42' },
        { cmd: 'PUBLISH channel message', desc: 'Publish; returns subscriber count', example: 'PUBLISH notifications:user:42 "Order shipped"' },
        { cmd: 'PSUBSCRIBE pattern [p...]', desc: 'Pattern subscribe: ?, *, [ae]', example: 'PSUBSCRIBE events:user:*' },
        { cmd: 'PUNSUBSCRIBE [pattern...]', desc: 'Unsubscribe from patterns', example: 'PUNSUBSCRIBE events:user:*' },
        { cmd: 'PUBSUB CHANNELS [pattern]', desc: 'Active channels with at least 1 subscriber', example: 'PUBSUB CHANNELS events:*' },
        { cmd: 'PUBSUB NUMSUB [ch...]', desc: 'Subscriber count per channel', example: 'PUBSUB NUMSUB notifications:user:42' },
        { cmd: 'PUBSUB NUMPAT', desc: 'Total active pattern subscriptions', example: 'PUBSUB NUMPAT' },
      ],
    },
    server: {
      title: 'Server',
      entries: [
        { cmd: 'PING [message]', desc: 'Connection health check; returns PONG', example: 'PING "hello"' },
        { cmd: 'INFO [section]', desc: 'Server stats: server|clients|memory|stats|replication|cpu|persistence', example: 'INFO memory' },
        { cmd: 'CONFIG GET parameter', desc: 'Get config value; supports glob', example: 'CONFIG GET maxmemory*' },
        { cmd: 'CONFIG SET parameter value', desc: 'Set config at runtime', example: 'CONFIG SET maxmemory-policy allkeys-lru' },
        { cmd: 'DBSIZE', desc: 'Number of keys in current database', example: 'DBSIZE' },
        { cmd: 'BGSAVE', desc: 'Async RDB snapshot (fork child process)', example: 'BGSAVE' },
        { cmd: 'BGREWRITEAOF', desc: 'Compact AOF file in background', example: 'BGREWRITEAOF' },
        { cmd: 'LASTSAVE', desc: 'Unix timestamp of last RDB save', example: 'LASTSAVE' },
        { cmd: 'SLOWLOG GET [count]', desc: 'Retrieve slow queries log', example: 'SLOWLOG GET 10' },
        { cmd: 'MONITOR', desc: 'Stream all commands in real time (debug only)', example: 'MONITOR' },
        { cmd: 'CLIENT LIST', desc: 'All connected clients with metadata', example: 'CLIENT LIST' },
        { cmd: 'CLIENT KILL id', desc: 'Kill a client connection by ID', example: 'CLIENT KILL ID 42' },
        { cmd: 'MEMORY USAGE key', desc: 'Memory used by a key in bytes', example: 'MEMORY USAGE user:42' },
        { cmd: 'MEMORY DOCTOR', desc: 'Human-readable memory analysis', example: 'MEMORY DOCTOR' },
        { cmd: 'DEBUG JMAP', desc: 'Print memory objects (dev only)', example: 'DEBUG SLEEP 0' },
        { cmd: 'FLUSHDB [ASYNC]', desc: 'Delete all keys in current database', example: 'FLUSHDB ASYNC' },
        { cmd: 'SELECT db', desc: 'Switch to database index (0-15)', example: 'SELECT 1' },
      ],
    },
  };

  currentSection = computed(() => {
    const s = this.sections[this.activeTab()];
    const q = this.searchTerm().toLowerCase();
    if (!q) return s.entries;
    return s.entries.filter(e =>
      e.cmd.toLowerCase().includes(q) ||
      e.desc.toLowerCase().includes(q) ||
      e.example.toLowerCase().includes(q)
    );
  });

  setTab(id: string) { this.activeTab.set(id); this.searchTerm.set(''); }
}
