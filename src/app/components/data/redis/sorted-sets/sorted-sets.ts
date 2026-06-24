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
  selector: 'app-redis-sorted-sets',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sorted-sets.html',
  styleUrl: './sorted-sets.scss',
})
export class RedisSortedSets {
  quickRef: QuickRefItem[] = [
    { name: 'ZADD key score member', type: 'keyword', desc: 'Add or update member with score' },
    { name: 'ZSCORE key member', type: 'keyword', desc: 'Get the score of a member' },
    { name: 'ZINCRBY key delta member', type: 'keyword', desc: 'Atomically increment a member\'s score' },
    { name: 'ZRANK key member', type: 'keyword', desc: 'Zero-based rank (ascending); ZREVRANK for descending' },
    { name: 'ZRANGE key start stop [REV] [WITHSCORES]', type: 'keyword', desc: 'Range by rank (Redis 6.2+ unified command)' },
    { name: 'ZRANGEBYSCORE key min max', type: 'keyword', desc: 'Members with score between min and max' },
    { name: 'ZRANGEBYLEX key [min [max', type: 'keyword', desc: 'Lexicographic range (all members same score)' },
    { name: 'ZCARD key', type: 'keyword', desc: 'Total number of members' },
    { name: 'ZCOUNT key min max', type: 'keyword', desc: 'Count of members with score in range' },
    { name: 'ZREM key member [member...]', type: 'keyword', desc: 'Remove members' },
    { name: 'ZPOPMIN / ZPOPMAX key [count]', type: 'keyword', desc: 'Remove and return lowest/highest scoring members' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Sorted Sets Work',
      points: [
        'A sorted set (zset) pairs each unique member (string) with a floating-point score. Members are stored in score order; ties are broken lexicographically by member name.',
        'Internally Redis uses a skiplist + hashtable combination: the hashtable gives O(1) score lookup by member; the skiplist provides O(log N) range queries.',
        'ZADD is O(log N); ZRANGE is O(log N + M) where M is the number of returned elements. This makes sorted sets extremely efficient for leaderboard and range queries.',
        'Small sorted sets use a listpack encoding (≤ zset-max-listpack-entries, default 128) which is more memory-compact but converts to skiplist+hashtable on growth.',
      ],
    },
    {
      heading: 'Leaderboard Pattern',
      points: [
        'ZADD leaderboard 1500 "alice" — add/update alice\'s score. ZINCRBY leaderboard 50 "alice" — add 50 points atomically.',
        'ZREVRANGE leaderboard 0 9 WITHSCORES — top 10 players with scores (highest score = rank 0).',
        'ZREVRANK leaderboard "alice" — alice\'s 0-based rank from the top.',
        'Real-time leaderboards: each user action calls ZINCRBY. ZREVRANGE gives the current top N in O(log N + N) time.',
      ],
    },
    {
      heading: 'Sliding Window Rate Limiting',
      points: [
        'Each request: ZADD ratelimit:userId now_ms now_ms — add timestamp as both score and member.',
        'Remove old entries: ZREMRANGEBYSCORE ratelimit:userId 0 (now_ms - window_ms).',
        'Count requests in window: ZCARD ratelimit:userId.',
        'This sliding window accurately counts requests over the last N milliseconds, unlike fixed-window which resets at intervals.',
      ],
    },
    {
      heading: 'Expiry Queue and Scheduling',
      points: [
        'ZADD jobs:scheduled expiryTimestamp jobId — job expiry timestamp as score.',
        'ZRANGEBYSCORE jobs:scheduled 0 now — jobs ready to execute right now.',
        'ZPOPMIN jobs:scheduled — dequeue the earliest-due job.',
        'This replaces cron jobs and enables distributed task scheduling with sub-second precision.',
        'ZADD with NX flag: only add if not already present. GT/LT flags: only update if new score is greater/less than existing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Leaderboard',
      language: 'bash',
      code: `# Add players
ZADD leaderboard 1200 alice 1500 bob 900 charlie

# Increment score
ZINCRBY leaderboard 100 alice   # alice now at 1300

# Top 3 (highest to lowest)
ZREVRANGE leaderboard 0 2 WITHSCORES
# 1) "bob"     2) "1500"
# 3) "alice"   4) "1300"
# 5) "charlie" 6) "900"

# Alice's rank (0-based, from top)
ZREVRANK leaderboard alice   # 1 (second place)

# Alice's score
ZSCORE leaderboard alice     # "1300"

# Players with score >= 1000
ZRANGEBYSCORE leaderboard 1000 +inf WITHSCORES

# Total player count
ZCARD leaderboard   # 3

# Remove a player
ZREM leaderboard charlie`,
    },
    {
      label: 'Node.js Patterns',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Leaderboard
async function addScore(userId: string, delta: number): Promise<number> {
  return redis.zincrby('leaderboard:global', delta, userId);
}

async function getTopPlayers(n: number): Promise<Array<{user: string; score: number}>> {
  const raw = await redis.zrevrange('leaderboard:global', 0, n - 1, 'WITHSCORES');
  const result = [];
  for (let i = 0; i < raw.length; i += 2) {
    result.push({ user: raw[i], score: parseFloat(raw[i + 1]) });
  }
  return result;
}

// Sliding window rate limiter
async function isAllowedSliding(userId: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const key = \`ratelimit:sliding:\${userId}\`;
  await redis.zremrangebyscore(key, 0, now - windowMs);
  await redis.zadd(key, now, \`\${now}\`);
  await redis.expire(key, Math.ceil(windowMs / 1000) + 1);
  const count = await redis.zcard(key);
  return count <= limit;
}

// Scheduled job queue
async function scheduleJob(jobId: string, runAtMs: number): Promise<void> {
  await redis.zadd('jobs:scheduled', runAtMs, jobId);
}

async function getReadyJobs(): Promise<string[]> {
  return redis.zrangebyscore('jobs:scheduled', 0, Date.now());
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using ZRANGE with start/stop as score range instead of rank range',
      wrong: 'ZRANGE leaderboard 1000 5000  // wrong: 1000 and 5000 are treated as rank indices',
      right: 'ZRANGEBYSCORE leaderboard 1000 5000  // filter by score range',
      explanation: 'ZRANGE start/stop are zero-based rank offsets (position in the sorted list). ZRANGEBYSCORE uses actual score values. The Redis 6.2+ unified ZRANGE with BYSCORE option clarifies this.',
    },
    {
      title: 'Sliding window: using member as timestamp string but not making it unique',
      wrong: 'await redis.zadd(key, now, "req");  // all requests collide on "req" member',
      right: 'await redis.zadd(key, now, `${now}-${Math.random()}`);',
      explanation: 'Sorted set members must be unique. If you reuse the same member string, ZADD updates the score instead of adding a new entry — you\'d only ever count 1 request. Include a nonce or use the timestamp as both score and member.',
    },
    {
      title: 'Getting rank with ZRANK when leaderboard is descending',
      wrong: 'const rank = await redis.zrank("leaderboard", userId); // lowest score = rank 0',
      right: 'const rank = await redis.zrevrank("leaderboard", userId); // highest score = rank 0',
      explanation: 'ZRANK returns rank in ascending order (lowest score = 0). For leaderboards where higher scores are better, use ZREVRANK to get rank from the top.',
    },
  ];

  challenge: Challenge = {
    title: 'Game Leaderboard',
    language: 'typescript',
    description: 'Implement a game leaderboard: `submitScore(userId, score)` records the score (keep the best score per user), `getRank(userId)` returns 1-based rank, and `getTopN(n)` returns top players with scores.',
    hints: [
      'ZADD with GT flag to only update if new score is higher',
      'ZREVRANK gives 0-based rank; add 1 for 1-based',
      'ZREVRANGE with WITHSCORES for top N',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function submitScore(userId: string, score: number): Promise<void> {}
async function getRank(userId: string): Promise<number | null> {}
async function getTopN(n: number): Promise<Array<{userId: string; score: number}>> {}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function submitScore(userId: string, score: number): Promise<void> {
  await redis.zadd('leaderboard', 'GT', score, userId);
}

async function getRank(userId: string): Promise<number | null> {
  const rank = await redis.zrevrank('leaderboard', userId);
  return rank === null ? null : rank + 1;
}

async function getTopN(n: number): Promise<Array<{userId: string; score: number}>> {
  const raw = await redis.zrevrange('leaderboard', 0, n - 1, 'WITHSCORES');
  const result = [];
  for (let i = 0; i < raw.length; i += 2) {
    result.push({ userId: raw[i], score: parseFloat(raw[i + 1]) });
  }
  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What internal data structure does Redis use for large sorted sets?',
      options: ['B-tree', 'Skiplist + hashtable', 'Red-black tree', 'Linked list'],
      answer: 1,
      explanation: 'Redis sorted sets use a skiplist for ordered range queries (O(log N)) and a hashtable for O(1) score lookup by member name. Both structures are kept in sync on every write.',
    },
    {
      q: 'ZINCRBY leaderboard 50 "alice" — if alice does not exist, what happens?',
      options: ['Returns an error', 'Treats alice\'s existing score as 0, returns 50', 'Does nothing', 'Creates alice with score -50'],
      answer: 1,
      explanation: 'ZINCRBY creates the member if absent, treating the initial score as 0. So ZINCRBY leaderboard 50 "alice" adds alice with score 50 if she didn\'t exist.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can sorted set scores be negative or very large?',
      a: 'Scores are IEEE 754 double-precision floats — range ±1.8×10^308. Special values +inf and -inf are also valid. Integer precision is exact up to 2^53. For very large integer IDs used as scores, stay within 2^53 to avoid floating-point rounding.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis sorted sets pair each unique member with a float score — O(log N) ordered access for leaderboards, range queries, and sliding-window rate limiting.',
    mustKnow: [
      'ZADD score member; ZINCRBY for atomic score increment',
      'ZREVRANGE for top-N leaderboard; ZREVRANK for player rank',
      'ZRANGEBYSCORE min max — filter members by score range',
      'Skiplist + hashtable: O(log N) range, O(1) score lookup',
      'ZADD GT flag: only update if new score is higher',
      'Sliding window rate limit: timestamp as score, ZREMRANGEBYSCORE to expire old entries',
    ],
    interviewFocus: [
      'How would you implement a real-time leaderboard with Redis?',
      'Sorted set vs regular set — when do you need the extra complexity?',
      'How does the sliding window rate limiter work with sorted sets?',
      'ZADD time complexity and the underlying data structure',
    ],
  };
}
