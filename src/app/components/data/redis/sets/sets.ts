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
  selector: 'app-redis-sets',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sets.html',
  styleUrl: './sets.scss',
})
export class RedisSets {
  quickRef: QuickRefItem[] = [
    { name: 'SADD key member [member...]', type: 'keyword', desc: 'Add members; duplicates silently ignored' },
    { name: 'SREM key member [member...]', type: 'keyword', desc: 'Remove members' },
    { name: 'SMEMBERS key', type: 'keyword', desc: 'Return all members (unordered)' },
    { name: 'SISMEMBER key member', type: 'keyword', desc: 'O(1) membership check — 1 or 0' },
    { name: 'SMISMEMBER key m [m...]', type: 'keyword', desc: 'Batch membership check (Redis 6.2+)' },
    { name: 'SCARD key', type: 'keyword', desc: 'Number of members in the set' },
    { name: 'SINTER key [key...]', type: 'keyword', desc: 'Members in ALL listed sets (intersection)' },
    { name: 'SUNION key [key...]', type: 'keyword', desc: 'Members in ANY listed set (union)' },
    { name: 'SDIFF key [key...]', type: 'keyword', desc: 'Members in first set not in the others' },
    { name: 'SPOP key [count]', type: 'keyword', desc: 'Remove and return random member(s)' },
    { name: 'SRANDMEMBER key [count]', type: 'keyword', desc: 'Return random member(s) without removing' },
    { name: 'SSCAN key cursor', type: 'keyword', desc: 'Cursor-safe iteration for large sets' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a Redis Set?',
      points: [
        'A Redis set is an unordered collection of unique string members. SADD silently ignores duplicates — ideal for tracking unique items without deduplication logic.',
        'Membership checks with SISMEMBER are O(1) — constant time regardless of set size. This makes sets perfect for "has this user seen this item?" style lookups.',
        'Sets use intset encoding for small sets of integers (≤ set-max-intset-entries, default 512) — extremely compact. Larger sets or string members use a hashtable.',
        'Maximum set size: 2^32 - 1 members (4 billion members per key).',
      ],
    },
    {
      heading: 'Set Operations',
      points: [
        'SINTER key1 key2 — members in BOTH sets. "Users who bought both product A and B".',
        'SUNION key1 key2 — members in EITHER set. "All users who interacted with either feature".',
        'SDIFF key1 key2 — members in key1 but NOT key2. "Users who subscribed but never converted".',
        'SINTERSTORE / SUNIONSTORE / SDIFFSTORE — compute the operation and save to a new key atomically.',
        'Set operations are O(N+M) where N and M are set sizes. For very large sets, this can be slow — consider pre-computing and caching results.',
      ],
    },
    {
      heading: 'Common Use Cases',
      points: [
        'Unique visitor tracking: SADD visits:page:home userId — automatically deduplicates. SCARD visits:page:home gives exact unique count.',
        'Social graph: SADD following:alice bob charlie; SADD following:bob alice. SINTER following:alice following:bob — mutual friends.',
        'Tags and categories: SADD tags:post:123 redis caching performance. SINTER tags:post:123 tags:post:456 — shared tags.',
        'Randomized recommendation: SPOP or SRANDMEMBER to pick random items from a candidate set.',
        'Eligibility gates: SADD feature:beta user1 user2. SISMEMBER feature:beta currentUser — O(1) flag check.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Set Commands',
      language: 'bash',
      code: `# Add members
SADD tags:post:1 redis caching performance
SADD tags:post:2 redis nosql database

# Membership and count
SISMEMBER tags:post:1 redis     # 1 (is a member)
SISMEMBER tags:post:1 golang    # 0 (not a member)
SCARD tags:post:1               # 3

# All members (order is arbitrary)
SMEMBERS tags:post:1           # ["redis", "caching", "performance"]

# Set operations
SINTER tags:post:1 tags:post:2   # ["redis"] — shared tags
SUNION tags:post:1 tags:post:2   # all unique tags across both
SDIFF tags:post:1 tags:post:2    # ["caching", "performance"] — in 1 not 2

# Store result in a new key
SINTERSTORE common:tags tags:post:1 tags:post:2

# Random members
SPOP tags:post:1              # remove and return one random member
SRANDMEMBER tags:post:1 3     # return 3 random members (no removal)

# Remove
SREM tags:post:1 caching`,
    },
    {
      label: 'Node.js',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Unique visitor tracking
async function trackVisit(page: string, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = \`visits:\${page}:\${today}\`;
  await redis.sadd(key, userId);
  await redis.expire(key, 86400 * 30); // keep 30 days
}

async function getUniqueVisitors(page: string, date: string): Promise<number> {
  return redis.scard(\`visits:\${page}:\${date}\`);
}

// Feature flag (beta users)
async function isBetaUser(userId: string): Promise<boolean> {
  return (await redis.sismember('feature:beta', userId)) === 1;
}

// Social: mutual follows
async function getMutualFollows(user1: string, user2: string): Promise<string[]> {
  return redis.sinter(\`following:\${user1}\`, \`following:\${user2}\`);
}

// Tags
async function getPostsWithTag(tag: string): Promise<string[]> {
  return redis.smembers(\`tag:\${tag}:posts\`);
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using SMEMBERS on a large set for membership checks',
      wrong: 'const members = await redis.smembers("beta:users");\nconst isIn = members.includes(userId);',
      right: 'const isIn = await redis.sismember("beta:users", userId);',
      explanation: 'SMEMBERS loads the entire set into memory and sends it over the network. SISMEMBER is O(1) — it checks directly in the hash table without loading any other members.',
    },
    {
      title: 'Using sets when order matters',
      wrong: 'SADD recent:actions "login" "purchase" "logout"  // unordered!',
      right: 'RPUSH recent:actions "login" "purchase" "logout"  // ordered list',
      explanation: 'Sets are unordered — SMEMBERS returns members in arbitrary order. Use lists for ordered data, or sorted sets if you need ordering by score.',
    },
    {
      title: 'Not storing result sets for expensive set operations',
      wrong: 'SINTER large:set1 large:set2  // computed every request',
      right: 'SINTERSTORE result:cache large:set1 large:set2\nEXPIRE result:cache 300',
      explanation: 'Set operations on large sets (100k+ members) take real time. SINTERSTORE computes once and caches the result. Expire the cached result to keep it fresh.',
    },
  ];

  challenge: Challenge = {
    title: 'Common Friends',
    language: 'typescript',
    description: 'Implement a social graph feature. `follow(user, target)` stores that user follows target. `getCommonFollows(user1, user2)` returns users both follow. `getSuggestions(user)` returns up to 5 people that user\'s follows follow (but user doesn\'t already follow).',
    hints: [
      'Use sets keyed by `following:userId`',
      'SUNION to aggregate all connections; SINTER for common; SDIFF to exclude already-followed',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function follow(user: string, target: string): Promise<void> {}
async function getCommonFollows(user1: string, user2: string): Promise<string[]> {}
async function getSuggestions(user: string): Promise<string[]> {}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function follow(user: string, target: string): Promise<void> {
  await redis.sadd(\`following:\${user}\`, target);
}

async function getCommonFollows(user1: string, user2: string): Promise<string[]> {
  return redis.sinter(\`following:\${user1}\`, \`following:\${user2}\`);
}

async function getSuggestions(user: string): Promise<string[]> {
  const myFollows = await redis.smembers(\`following:\${user}\`);
  const secondDegreeKeys = myFollows.map(f => \`following:\${f}\`);
  if (!secondDegreeKeys.length) return [];
  const candidates = await redis.sunion(...secondDegreeKeys);
  // Exclude self and already-followed
  const already = new Set([user, ...myFollows]);
  return candidates.filter(c => !already.has(c)).slice(0, 5);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of SISMEMBER?',
      options: ['O(N) — scans all members', 'O(log N)', 'O(1)', 'O(N log N)'],
      answer: 2,
      explanation: 'SISMEMBER is O(1) because sets use a hash table internally. Membership lookup is a direct hash table probe regardless of set size.',
    },
    {
      q: 'Which encoding does Redis use for a set of 100 small integers?',
      options: ['hashtable', 'intset', 'skiplist', 'ziplist'],
      answer: 1,
      explanation: 'Intset is a sorted array of integers — extremely compact. Used when all members are integers and the set is below set-max-intset-entries (default 512). Faster SISMEMBER than hashtable for small integer sets.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a set vs a sorted set for unique membership?',
      a: 'Use a set when you need membership only (is X a member?) or set algebra (SINTER/SUNION/SDIFF). Use a sorted set when you also need ordering by score (leaderboard, expiry-based eviction, timeline ordering). Sorted sets use more memory than sets for the same number of members.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis sets are unordered unique-member collections with O(1) membership checks and server-side set algebra (SINTER/SUNION/SDIFF).',
    mustKnow: [
      'SADD silently ignores duplicates — auto-deduplication',
      'SISMEMBER is O(1) — use it instead of SMEMBERS + includes()',
      'SINTER/SUNION/SDIFF for server-side set algebra',
      'SINTERSTORE/SUNIONSTORE to cache computed sets with TTL',
      'intset encoding for small integer sets — very memory efficient',
      'SSCAN for safe iteration over large sets',
    ],
    interviewFocus: [
      'How would you track unique page visitors per day using Redis?',
      'Set vs sorted set — when do you choose each?',
      'How does SISMEMBER achieve O(1) complexity?',
      'Implement a "mutual friends" feature using Redis set operations',
    ],
  };
}
