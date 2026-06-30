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
  selector: 'app-redis-lua-scripting',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './lua-scripting.html',
  styleUrl: './lua-scripting.scss',
})
export class RedisLuaScripting {
  quickRef: QuickRefItem[] = [
    { name: 'EVAL script numkeys key [key...] arg [arg...]', type: 'keyword', desc: 'Execute a Lua script atomically' },
    { name: 'EVALSHA sha numkeys key [key...]', type: 'keyword', desc: 'Execute cached script by SHA1 digest' },
    { name: 'SCRIPT LOAD script', type: 'keyword', desc: 'Cache a script and return its SHA1' },
    { name: 'SCRIPT EXISTS sha [sha...]', type: 'keyword', desc: 'Check if scripts are cached on server' },
    { name: 'SCRIPT FLUSH', type: 'keyword', desc: 'Flush all cached Lua scripts from server' },
    { name: 'KEYS[i]', type: 'keyword', desc: 'Lua table: access nth key passed to EVAL (1-indexed)' },
    { name: 'ARGV[i]', type: 'keyword', desc: 'Lua table: access nth argument passed to EVAL (1-indexed)' },
    { name: 'redis.call(cmd, ...)', type: 'function', desc: 'Execute Redis command; raises error on failure' },
    { name: 'redis.pcall(cmd, ...)', type: 'function', desc: 'Execute Redis command; returns error table on failure' },
    { name: 'redis.status_reply(str)', type: 'function', desc: 'Return a Redis status reply from Lua' },
    { name: 'redis.error_reply(str)', type: 'function', desc: 'Return a Redis error reply from Lua' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Lua Scripts?',
      points: [
        'Lua scripts (EVAL) run atomically on the Redis server — no other command can execute between any two Redis calls inside the script. This enables conditional read-modify-write operations impossible with MULTI/EXEC.',
        'Scripts are cached by SHA1 hash. SCRIPT LOAD caches without executing; EVALSHA re-runs the cached script avoiding retransmitting the script body on every call.',
        'EVAL numkeys: the numkeys argument tells Redis how many of the following arguments are keys vs arguments. Keys go into KEYS[], args into ARGV[], both 1-indexed.',
        'Scripts execute in a sandbox: no file I/O, no network, no system calls. Only Redis API (redis.call / redis.pcall) and Lua standard libraries (math, string, table, etc.) are available.',
        'Script execution is bounded in time by lua-time-limit (default 5 seconds). Exceeding it causes Redis to respond to other clients with BUSY errors while the script runs.',
      ],
    },
    {
      heading: 'redis.call vs redis.pcall',
      points: [
        'redis.call raises a Lua error on Redis command failure — the script aborts and the error propagates to the client.',
        'redis.pcall catches Redis errors and returns them as a Lua table: { err = "error message" }. Use when you need to handle partial failures gracefully inside the script.',
        'Type conversions: Lua number → Redis integer; Lua string → Redis bulk string; Lua table (array) → Redis array reply; Lua false/nil → Redis nil. Boolean true → Redis integer 1.',
        'Lua numbers are floats; Redis integer replies truncate. If you need a float result, return it as a string from Lua.',
      ],
    },
    {
      heading: 'Script Caching and EVALSHA',
      points: [
        'Every EVAL call sends the full script body over the network. For scripts called frequently, use SCRIPT LOAD once at startup to get the SHA1, then EVALSHA on every call.',
        'Scripts are cached in memory on the server and persist until SCRIPT FLUSH or server restart. They do NOT persist across RDB/AOF restores — reload them at startup.',
        'SCRIPT EXISTS returns a 1/0 for each SHA1 — use this to check if a script needs re-loading after a restart.',
        'In Redis Cluster, scripts must only access keys that hash to the same slot — or you will get a CROSSSLOT error. Use hash tags (e.g. {user}.session and {user}.profile) to force co-location.',
      ],
    },
    {
      heading: 'Common Use Cases',
      points: [
        'Rate limiting with sliding window: atomically read the counter, increment, set TTL, return remaining quota — all in one roundtrip.',
        'Conditional set: SET key value only if the current value equals an expected value (CAS without WATCH + retry).',
        'Token bucket / leaky bucket algorithms: maintain counter + last-refill-time atomically.',
        'Atomic pop from sorted set + store to hash: dequeue a job and mark it in-progress in one step.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Rate Limiter Script',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Fixed-window rate limiter as a Lua script
const rateLimiterScript = \`
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, window)
end
if current > limit then
  return 0
end
return limit - current
\`;

let rateLimiterSha: string;

async function initScripts() {
  rateLimiterSha = await redis.script('LOAD', rateLimiterScript) as string;
}

async function checkRateLimit(identifier: string, limit: number, windowSec: number): Promise<number> {
  const key = \`rl:\${identifier}\`;
  const remaining = await redis.evalsha(rateLimiterSha, 1, key, String(limit), String(windowSec));
  return remaining as number; // 0 = blocked, >0 = remaining quota
}

await initScripts();
const remaining = await checkRateLimit('user:42', 100, 60); // 100 req/min`,
    },
    {
      label: 'CAS Script',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Compare-and-swap: set key to newVal only if current value is expectedVal
const casScript = \`
local current = redis.call(\'GET\', KEYS[1])
if current == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  return 1
end
return 0
\`;

async function compareAndSwap(key: string, expected: string, newValue: string): Promise<boolean> {
  const result = await redis.eval(casScript, 1, key, expected, newValue);
  return result === 1;
}

// Usage
await redis.set('config:feature-flag', 'disabled');
const swapped = await compareAndSwap('config:feature-flag', 'disabled', 'enabled');
console.log(swapped); // true — atomically updated`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using global variables in Lua scripts',
      wrong: `local script = \`
count = count + 1    -- global: persists between EVAL calls on same server!
return count
\``,
      right: `local script = \`
local count = redis.call('INCR', KEYS[1])
return count
\``,
      explanation: 'Lua global variables in Redis scripts persist for the lifetime of the Redis process. This causes shared mutable state between script invocations — a serious bug. Always use local variables.',
    },
    {
      title: 'Hardcoding key names inside the script body',
      wrong: `local script = \`redis.call('GET', 'user:42:session')\``,
      right: `local script = \`redis.call(\'GET\', KEYS[1])\`
// call: redis.eval(script, 1, 'user:42:session')`,
      explanation: 'Hardcoding keys prevents Redis Cluster from correctly routing the script. Redis uses the KEYS[] list to determine which cluster node the script should run on. Keys not declared in numkeys may be on a different slot.',
    },
    {
      title: 'Not reloading scripts after server restart',
      wrong: '// evalsha at startup without checking SCRIPT EXISTS first',
      right: `const exists = await redis.script('EXISTS', sha);
if (!exists[0]) sha = await redis.script('LOAD', scriptBody) as string;`,
      explanation: 'Lua scripts are cached in memory only. A Redis restart (or SCRIPT FLUSH) clears all cached scripts. EVALSHA will return NOSCRIPT error. Always check or reload at startup.',
    },
  ];

  challenge: Challenge = {
    title: 'Lua Token Bucket',
    language: 'typescript',
    description: 'Implement a token-bucket rate limiter using EVAL. The bucket refills at `rate` tokens per second (stored as a float in a hash). Fields: `tokens` and `last`. On each call: refill tokens based on elapsed time, deduct 1 if tokens >= 1, return 1 (allowed) or 0 (blocked).',
    hints: [
      'Store state in a hash: HGETALL KEYS[1] returns {tokens, last}',
      'tonumber() converts string to number in Lua; os.time() is unavailable — pass current timestamp as ARGV[1]',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

const tokenBucketScript = \`
-- KEYS[1] = bucket key
-- ARGV[1] = current time (epoch seconds, float string)
-- ARGV[2] = rate (tokens/sec)
-- ARGV[3] = max capacity
-- return 1 if allowed, 0 if blocked
\`;

async function consume(bucketKey: string, rate: number, capacity: number): Promise<boolean> {
  const now = Date.now() / 1000;
  const result = await redis.eval(tokenBucketScript, 1, bucketKey, String(now), String(rate), String(capacity));
  return result === 1;
}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

const tokenBucketScript = \`
local data = redis.call('HMGET', KEYS[1], 'tokens', 'last')
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local tokens = tonumber(data[1]) or capacity
local last = tonumber(data[2]) or now
local elapsed = now - last
tokens = math.min(capacity, tokens + elapsed * rate)
if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
  redis.call('EXPIRE', KEYS[1], math.ceil(capacity / rate) + 1)
  return 1
else
  redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
  return 0
end
\`;

async function consume(bucketKey: string, rate: number, capacity: number): Promise<boolean> {
  const now = Date.now() / 1000;
  const result = await redis.eval(tokenBucketScript, 1, bucketKey, String(now), String(rate), String(capacity));
  return result === 1;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between redis.call() and redis.pcall() in Lua?',
      options: [
        'call is async; pcall is sync',
        'call raises on error; pcall returns error as table',
        'call returns strings; pcall returns integers',
        'No difference — aliases',
      ],
      answer: 1,
      explanation: 'redis.call() raises a Lua error on Redis command failure (aborts the script). redis.pcall() catches the error and returns it as a Lua table { err = "..." }, allowing graceful handling.',
    },
    {
      q: 'After a Redis server restart, what happens to EVALSHA calls for previously cached scripts?',
      options: ['They run normally', 'They return NOSCRIPT error', 'They auto-reload the script', 'They return nil'],
      answer: 1,
      explanation: 'Lua scripts are cached in memory only. A restart clears the script cache. EVALSHA will return a NOSCRIPT error. Applications must reload scripts (SCRIPT LOAD) on startup.',
    },
    {
      q: 'Why are Redis Lua scripts atomic?',
      options: ['Lua uses its own transaction system', 'Redis executes the entire Lua script without interruption — no other command can run between script instructions', 'Scripts run in a separate thread with a lock', 'Lua scripts use MULTI/EXEC internally'],
      answer: 1,
      explanation: 'Lua scripts run atomically in Redis — the event loop is blocked for the script duration. This guarantees no race conditions between script steps. Keep scripts short to avoid blocking other clients for too long.',
    },
    {
      q: 'What is the difference between redis.call() and redis.pcall() in Lua?',
      options: ['redis.call() is async; redis.pcall() is sync', 'redis.call() raises an error on command failure; redis.pcall() catches errors and returns them as a Lua table', 'redis.pcall() only works with read commands', 'There is no functional difference'],
      answer: 1,
      explanation: 'redis.call() propagates command errors as Lua errors (aborting the script). redis.pcall() catches errors and returns {err: msg} — enabling per-command error handling within the script without aborting.',
    },
    {
      q: 'What is EVALSHA and why use it instead of EVAL?',
      options: ['EVALSHA runs scripts faster by compiling them', 'EVALSHA executes a pre-loaded script by SHA1 hash, avoiding resending the script body on every call', 'EVALSHA supports more Lua functions than EVAL', 'EVALSHA is for read-only scripts'],
      answer: 1,
      explanation: 'SCRIPT LOAD script returns a SHA1 hash. EVALSHA sha1 numkeys keys argv runs the cached script. This avoids sending the full script body on each call, reducing network traffic. NOSCRIPT error means the script was not loaded.',
    },
    {
      q: 'How should Redis keys be passed to Lua scripts and why?',
      options: ['Keys can be hardcoded inside the Lua script', 'Keys should be passed via the KEYS array so Redis Cluster can determine key slots and route correctly', 'Keys should be passed in ARGV for flexibility', 'Keys are automatically detected by the script'],
      answer: 1,
      explanation: 'Pass keys via KEYS[1], KEYS[2]... so Redis Cluster knows which slot the script accesses and can verify all keys are on the same slot. Hardcoding key names makes cluster routing impossible — a scripting best practice.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can Lua scripts access external systems or make HTTP calls?',
      a: 'No. Redis runs Lua in a sandboxed environment with no file I/O, network access, or system calls. The only I/O is through redis.call() / redis.pcall() to the Redis server itself. This sandbox is intentional — it prevents scripts from causing side effects or hanging Redis while waiting on external resources.',
    },
    {
      q: 'How do you pass arguments to a Redis Lua script?',
      a: 'EVAL script numkeys [key...] [arg...]: keys are in KEYS table (KEYS[1], KEYS[2]...), args in ARGV table (ARGV[1], ARGV[2]...). Example: <code>EVAL "return redis.call(\'GET\', KEYS[1])" 1 mykey</code>. Always pass keys via KEYS — required for Redis Cluster routing and script analysis tools.',
    },
    {
      q: 'What are the limitations of Lua scripts in Redis?',
      a: 'Limitations: (1) Scripts block the event loop — keep them short; (2) No global state between calls (use Redis keys); (3) Cannot use SUBSCRIBE/PUBLISH; (4) No external network calls; (5) No access to file system; (6) Deterministic required (no math.random without seed — use RANDOM workarounds). Scripts must be deterministic for AOF/replication.',
    },
    {
      q: 'How do you handle errors in Redis Lua scripts?',
      a: '<code>redis.call()</code> raises a Lua error on Redis command failure (e.g., wrong type). <code>redis.pcall()</code> returns <code>{err: msg}</code> on error without aborting. For validation, use <code>return redis.error_reply(\'msg\')</code> to return an error to the client. <code>return redis.status_reply(\'OK\')</code> for OK responses.',
    },
    {
      q: 'What is SCRIPT FLUSH and when do you use it?',
      a: 'SCRIPT FLUSH clears all cached Lua scripts from the server. Use after deploying new script versions to ensure old SHA1s are invalidated. Also use for debugging when EVALSHA returns NOSCRIPT. In production, SCRIPT LOAD new scripts first, then update client code to use the new SHA1 atomically.',
    },
    {
      q: 'How do Lua scripts work in Redis Cluster?',
      a: 'In cluster mode, all keys a script accesses must be in the same hash slot. Pass all keys in KEYS[] so Redis can verify slot ownership. Use hash tags <code>{tag}</code> to co-locate related keys. Lua scripts cannot access keys in different slots — this is enforced. EVALSHA is sent to the node owning the slot of KEYS[1].',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EVAL runs Lua scripts atomically with read-modify-write in one roundtrip; use EVALSHA + SCRIPT LOAD for efficiency; always use KEYS[]/ARGV[], never global variables.',
    mustKnow: [
      'EVAL script numkeys KEYS[] ARGV[] — atomic, no interleaving possible',
      'redis.call raises on error; redis.pcall returns error table',
      'SCRIPT LOAD + EVALSHA avoids resending script body on every call',
      'Scripts are memory-only — reload after restart (check SCRIPT EXISTS)',
      'Never use global Lua vars — they persist across EVAL calls',
      'Always pass key names via KEYS[], not hardcoded — required for Cluster routing',
    ],
    interviewFocus: [
      'When would you use Lua over MULTI/EXEC?',
      'How does EVALSHA improve performance?',
      'Why must keys be passed via KEYS[] in a Cluster environment?',
      'What happens if a Lua script exceeds lua-time-limit?',
    ],
  };
}
